import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ActiveRoundQuestion } from '../data/questionsBank';
import {
  createTacticalMaterials,
  createBeveledBoxGeometry,
  buildHighDetailNPC,
  buildFirstPersonWeapon,
  buildBallisticTargetStand,
} from './proceduralModels';

export interface ShotTriggerCommand {
  choice: boolean; // true = CERTO, false = ERRADO
  id: number;
}

interface TacticalRange3DProps {
  gameState: 'menu' | 'playing' | 'executing' | 'gameover';
  currentQuestion: ActiveRoundQuestion | null;
  timeLeft: number; // 0 to 24
  roundNumber: number;
  externalShotCommand: ShotTriggerCommand | null;
  onShootTarget: (choice: boolean) => void;
  onHoverTargetChange: (hovered: 'CERTO' | 'ERRADO' | null) => void;
}

// Pre-allocated math helpers at module scope to prevent GC in the render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mouseNDC = new THREE.Vector2(0, 0);

interface SparkParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

interface EjectedShell {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  life: number;
}

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export const TacticalRange3D: React.FC<TacticalRange3DProps> = ({
  gameState,
  currentQuestion,
  timeLeft,
  roundNumber,
  externalShotCommand,
  onShootTarget,
  onHoverTargetChange,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const cs2CrosshairRef = useRef<HTMLDivElement | null>(null);
  const cs2TopBarRef = useRef<HTMLDivElement | null>(null);
  const cs2BottomBarRef = useRef<HTMLDivElement | null>(null);
  const cs2LeftBarRef = useRef<HTMLDivElement | null>(null);
  const cs2RightBarRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    gameState,
    currentQuestion,
    timeLeft,
    roundNumber,
    hoveredTarget: null as 'CERTO' | 'ERRADO' | null,
    playerGunRecoil: 0,
    playerMuzzleTimer: 0,
    npcMuzzleTimer: 0,
    certoPlateTilt: 0,
    erradoPlateTilt: 0,
    cameraDeathFall: 0,
    cameraShake: 0,
    swayX: 0,
    swayY: 0,
    aimWorldTarget: new THREE.Vector3(0, 1.7, -4.8),
  });

  const callbacksRef = useRef({
    onShootTarget,
    onHoverTargetChange,
  });

  useEffect(() => {
    callbacksRef.current = { onShootTarget, onHoverTargetChange };
  }, [onShootTarget, onHoverTargetChange]);

  useEffect(() => {
    const prevState = stateRef.current.gameState;
    stateRef.current.gameState = gameState;
    stateRef.current.currentQuestion = currentQuestion;
    stateRef.current.timeLeft = timeLeft;
    stateRef.current.roundNumber = roundNumber;

    if (gameState === 'executing' && prevState !== 'executing') {
      stateRef.current.npcMuzzleTimer = 0.35;
      stateRef.current.cameraShake = 0.9;
    }
    if (gameState === 'playing' && prevState !== 'playing') {
      stateRef.current.cameraDeathFall = 0;
      stateRef.current.cameraShake = 0;
      stateRef.current.certoPlateTilt = 0;
      stateRef.current.erradoPlateTilt = 0;
    }
  }, [gameState, currentQuestion, timeLeft, roundNumber]);

  const fire3DShotRef = useRef<((choice: boolean, impactPoint?: THREE.Vector3) => void) | null>(null);

  useEffect(() => {
    if (externalShotCommand && fire3DShotRef.current) {
      fire3DShotRef.current(externalShotCommand.choice);
    }
  }, [externalShotCommand]);

  const updateBoardCanvasRef = useRef<(() => void) | null>(null);
  const halfSecTick = Math.floor(timeLeft * 2);
  useEffect(() => {
    if (updateBoardCanvasRef.current) {
      updateBoardCanvasRef.current();
    }
  }, [currentQuestion, roundNumber, halfSecTick, gameState]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL detection per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080a0f);
    scene.fog = new THREE.FogExp2(0x080a0f, 0.044);

    // Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Camera (First-Person CS2 FOV Perspective)
    const camera = new THREE.PerspectiveCamera(
      55,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.05,
      60
    );
    const baseCamPos = new THREE.Vector3(0, 1.66, 2.35);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 1.85, -5.0);
    scene.add(camera);

    // 2. Studio & Bunker 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x18181b, 0.76);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.5);
    keyLight.position.set(3.8, 7.8, 2.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 22;
    const d = 7;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0x38bdf8, 3.8, 20, Math.PI / 3, 0.45, 1.1);
    rimLight.position.set(0, 5.5, -7.8);
    rimLight.target.position.set(0, 1.5, -4.5);
    scene.add(rimLight);
    scene.add(rimLight.target);

    const playerFlashLight = new THREE.PointLight(0xf59e0b, 0, 8);
    scene.add(playerFlashLight);

    const npcFlashLight = new THREE.PointLight(0xef4444, 0, 16);
    npcFlashLight.position.set(0, 1.65, -3.9);
    scene.add(npcFlashLight);

    // 3. Create Procedural PBR Material Library
    const mats = createTacticalMaterials(maxAnisotropy, isSoftwareGl);

    // 4. Sculpted CS2 Indoor Firing Range Architecture
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), mats.diamondPlateMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const floorHazardStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 0.32),
      mats.hazardStripeMat
    );
    floorHazardStrip.rotation.x = -Math.PI / 2;
    floorHazardStrip.position.set(0, 0.01, -0.5);
    scene.add(floorHazardStrip);

    // Backstop Armored Wall & Angled Ballistic Bullet-Trap Baffles
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8.5, 0.6),
      mats.bunkerConcreteMat
    );
    backWall.position.set(0, 4.25, -8.3);
    backWall.receiveShadow = true;
    scene.add(backWall);

    for (let i = 0; i < 4; i++) {
      const baffle = new THREE.Mesh(
        createBeveledBoxGeometry(14.5, 0.55, 0.25, 0.02, 2),
        mats.bluedSteelMat
      );
      baffle.rotation.x = 0.38;
      baffle.position.set(0, 0.7 + i * 0.75, -7.85);
      scene.add(baffle);
    }

    // Side Acoustic Baffle Walls, Concrete Columns & Overhead Target Retrieval Rails
    [-6.5, 6.5].forEach((sideX) => {
      const sideWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 8.5, 16),
        mats.bunkerConcreteMat
      );
      sideWall.position.set(sideX, 4.25, -2.0);
      scene.add(sideWall);

      // Acoustic pyramid-foam soundproofing panels along side walls
      for (let z = -6.0; z <= 1.0; z += 2.2) {
        const foamPanel = new THREE.Mesh(
          createBeveledBoxGeometry(0.12, 2.4, 1.8, 0.02, 2),
          mats.acousticFoamMat
        );
        foamPanel.position.set(sideX > 0 ? sideX - 0.22 : sideX + 0.22, 2.1, z);
        scene.add(foamPanel);
      }
    });

    [-5.4, 5.4].forEach((xPos) => {
      const column = new THREE.Mesh(
        createBeveledBoxGeometry(1.05, 8.2, 1.15, 0.04, 3),
        mats.bunkerConcreteMat
      );
      column.position.set(xPos, 4.1, -5.2);
      column.castShadow = !isSoftwareGl;
      column.receiveShadow = true;
      scene.add(column);

      const collar = new THREE.Mesh(
        createBeveledBoxGeometry(1.12, 0.35, 1.22, 0.02, 2),
        mats.brushedSteelMat
      );
      collar.position.set(xPos, 1.5, -5.2);
      scene.add(collar);
    });

    // Overhead Steel Gantry Truss & Industrial LED Light Fixtures
    const trussBeam = new THREE.Mesh(
      createBeveledBoxGeometry(12.2, 0.28, 0.35, 0.02, 2),
      mats.bluedSteelMat
    );
    trussBeam.position.set(0, 5.35, -5.2);
    scene.add(trussBeam);

    const ledTubeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    [-2.5, 0, 2.5].forEach((lx) => {
      const fixtureHousing = new THREE.Mesh(
        createBeveledBoxGeometry(1.4, 0.08, 0.28, 0.01, 2),
        mats.parkerizedSteelMat
      );
      fixtureHousing.position.set(lx, 5.18, -3.2);
      scene.add(fixtureHousing);

      const ledTube = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.025, 0.18), ledTubeMat);
      ledTube.position.set(lx, 5.13, -3.2);
      scene.add(ledTube);
    });

    // Detailed Tactical Shooting Bench in front of Player (with Ammo Crate, Ear Pro & Brass Shells)
    const benchGroup = new THREE.Group();
    const benchWall = new THREE.Mesh(
      createBeveledBoxGeometry(6.6, 0.9, 0.38, 0.025, 3),
      mats.bunkerConcreteMat
    );
    benchWall.position.set(0, 0.45, 0.92);
    benchGroup.add(benchWall);

    const benchTopCounter = new THREE.Mesh(
      createBeveledBoxGeometry(6.8, 0.09, 0.62, 0.015, 3),
      mats.bluedSteelMat
    );
    benchTopCounter.position.set(0, 0.94, 0.92);
    benchGroup.add(benchTopCounter);

    const ammoCrate = new THREE.Mesh(
      createBeveledBoxGeometry(0.42, 0.24, 0.22, 0.015, 3),
      mats.corduraOliveMat
    );
    ammoCrate.position.set(-1.05, 1.1, 0.88);
    ammoCrate.rotation.y = 0.28;
    benchGroup.add(ammoCrate);

    // Spare Pistol Magazine & Brass Cartridges on the shooting bench
    const spareMag = new THREE.Mesh(
      createBeveledBoxGeometry(0.04, 0.025, 0.14, 0.004, 2),
      mats.bluedSteelMat
    );
    spareMag.position.set(-0.55, 0.995, 0.94);
    spareMag.rotation.y = 0.45;
    benchGroup.add(spareMag);

    const cartridgeGeo = new THREE.CylinderGeometry(0.007, 0.008, 0.038, 12);
    [
      [-0.72, 0.92],
      [-0.68, 0.95],
      [-0.75, 0.97],
      [0.82, 0.93],
      [0.88, 0.96],
    ].forEach(([cx, cz]) => {
      const round = new THREE.Mesh(cartridgeGeo, mats.brassMat);
      round.position.set(cx, 1.004, cz);
      benchGroup.add(round);
    });

    scene.add(benchGroup);

    // 5. High-Detail Sculpted Tactical Operator NPC + M4A4 Carbine (NO LASER)
    const npcRig = buildHighDetailNPC(mats, isSoftwareGl);
    scene.add(npcRig.npcRoot);

    // 6. Overhead 3D Cebraspe Briefing Jumbotron with Beveled Armored Frame
    const boardCanvas = document.createElement('canvas');
    boardCanvas.width = 1400;
    boardCanvas.height = 620;
    const bCtx = boardCanvas.getContext('2d')!;
    const boardTexture = new THREE.CanvasTexture(boardCanvas);
    boardTexture.colorSpace = THREE.SRGBColorSpace;
    boardTexture.anisotropy = maxAnisotropy;

    const drawQuestionBoard = () => {
      const { currentQuestion: q, timeLeft: tl, roundNumber: rn } = stateRef.current;
      const safeTl = typeof tl === 'number' && !isNaN(tl) ? tl : 24.0;
      const safeRn = typeof rn === 'number' && !isNaN(rn) ? rn : 1;

      bCtx.fillStyle = '#090d16';
      bCtx.fillRect(0, 0, 1400, 620);

      const isContran = q?.category === 'CONTRAN';
      const accentHex = isContran ? '#06b6d4' : '#f59e0b';
      bCtx.strokeStyle = accentHex;
      bCtx.lineWidth = 8;
      bCtx.strokeRect(16, 16, 1368, 588);

      bCtx.fillStyle = '#111827';
      bCtx.fillRect(24, 24, 1352, 92);

      bCtx.fillStyle = accentHex;
      bCtx.font = 'bold 34px "Chakra Petch", sans-serif';
      const headerLabel = q
        ? `RODADA #${String(safeRn).padStart(2, '0')}  ·  ${
            q.category === 'CTB' ? 'CÓDIGO DE TRÂNSITO BRASILEIRO (CTB)' : 'RESOLUÇÃO DO CONTRAN'
          }`
        : 'SISTEMA DE TREINAMENTO TÁTICO CEBRASPE';
      bCtx.fillText(headerLabel, 48, 82);

      const isDanger = safeTl <= 6;
      bCtx.fillStyle = isDanger ? '#ef4444' : '#f4f4f5';
      bCtx.font = 'bold 44px "JetBrains Mono", monospace';
      bCtx.textAlign = 'right';
      bCtx.fillText(`${safeTl.toFixed(1)}s`, 1345, 85);
      bCtx.textAlign = 'left';

      bCtx.fillStyle = '#f8fafc';
      bCtx.font = '500 35px "Plus Jakarta Sans", sans-serif';
      const statementText =
        q?.statement ||
        'Aguardando início da bateria tática. Você terá 24 segundos por item para atirar na placa CERTO ou ERRADO.';
      const lines = wrapTextLines(bCtx, statementText, 1290);
      let yCursor = 185;
      lines.slice(0, 8).forEach((line) => {
        bCtx.fillText(line, 54, yCursor);
        yCursor += 50;
      });

      bCtx.fillStyle = '#1e293b';
      bCtx.fillRect(48, 545, 1304, 28);
      const ratio = Math.max(0, Math.min(1, tl / 24));
      bCtx.fillStyle = isDanger ? '#ef4444' : accentHex;
      bCtx.fillRect(48, 545, 1304 * ratio, 28);

      boardTexture.needsUpdate = true;
    };

    updateBoardCanvasRef.current = drawQuestionBoard;
    drawQuestionBoard();

    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 3.58, -5.35);
    boardGroup.rotation.x = 0.08;

    const boardFrame = new THREE.Mesh(
      createBeveledBoxGeometry(6.9, 3.12, 0.24, 0.035, 3),
      mats.bluedSteelMat
    );
    boardGroup.add(boardFrame);

    [-2.8, 2.8].forEach((cx) => {
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 1.6, 12),
        mats.brushedSteelMat
      );
      strut.position.set(cx, 1.85, -0.05);
      boardGroup.add(strut);
    });

    const boardScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(6.55, 2.85),
      new THREE.MeshBasicMaterial({ map: boardTexture })
    );
    boardScreen.position.z = 0.125;
    boardGroup.add(boardScreen);
    scene.add(boardGroup);

    // 7. Reactive 3D Hydraulic Target Plates: [ CERTO ] (Left) & [ ERRADO ] (Right)
    const createTargetPlateTexture = (label: 'CERTO' | 'ERRADO', keyHint: string, isHovered: boolean) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d')!;
      const isCerto = label === 'CERTO';

      ctx.fillStyle = isCerto ? (isHovered ? '#065f46' : '#064e3b') : isHovered ? '#7f1d1d' : '#450a0a';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 2;
      for (let i = -512; i < 1024; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 512, 512);
        ctx.stroke();
      }

      ctx.strokeStyle = isCerto ? '#10b981' : '#ef4444';
      ctx.lineWidth = isHovered ? 22 : 14;
      ctx.strokeRect(18, 18, 476, 476);

      ctx.strokeStyle = isCerto ? 'rgba(16, 185, 129, 0.38)' : 'rgba(239, 68, 68, 0.38)';
      ctx.lineWidth = 5;
      [185, 130, 75].forEach((r) => {
        ctx.beginPath();
        ctx.arc(256, 230, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.fillStyle = '#cbd5e1';
      [
        [48, 48],
        [464, 48],
        [48, 464],
        [464, 464],
      ].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 11, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 86px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 256, 258);

      ctx.fillStyle = isCerto ? '#a7f3d0' : '#fecaca';
      ctx.font = 'bold 30px "JetBrains Mono", monospace';
      ctx.fillText(`ATIRAR [${keyHint}]`, 256, 425);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;
      return tex;
    };

    const certoTexNormal = createTargetPlateTexture('CERTO', 'TECLA C / CLIQUE', false);
    const certoTexHover = createTargetPlateTexture('CERTO', 'TECLA C / CLIQUE', true);
    const erradoTexNormal = createTargetPlateTexture('ERRADO', 'TECLA E / CLIQUE', false);
    const erradoTexHover = createTargetPlateTexture('ERRADO', 'TECLA E / CLIQUE', true);

    const certoTarget = buildBallisticTargetStand(-2.48, 'CERTO', certoTexNormal, mats, isSoftwareGl);
    const erradoTarget = buildBallisticTargetStand(2.48, 'ERRADO', erradoTexNormal, mats, isSoftwareGl);
    scene.add(certoTarget.standGroup);
    scene.add(erradoTarget.standGroup);

    const clickableMeshes: THREE.Object3D[] = [
      certoTarget.faceMesh,
      certoTarget.steelBacking,
      erradoTarget.faceMesh,
      erradoTarget.steelBacking,
    ];

    // 8. CS2-Style First-Person Tactical Weapon + Gloved Hands + Tritium 3-Dot Iron Sights
    const fpWeaponRig = buildFirstPersonWeapon(mats);
    camera.add(fpWeaponRig.fpRoot);

    // 9. Ejected Brass Shell Casings Pool & Metallic Impact Sparks Pool
    const casingPoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.009, 0.0),
      new THREE.Vector2(0.009, 0.032),
      new THREE.Vector2(0.007, 0.035),
    ];
    const casingGeo = new THREE.LatheGeometry(casingPoints, 12);
    const ejectedShells: EjectedShell[] = [];
    for (let i = 0; i < 6; i++) {
      const shellMesh = new THREE.Mesh(casingGeo, mats.brassMat);
      shellMesh.visible = false;
      camera.add(shellMesh);
      ejectedShells.push({
        mesh: shellMesh,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        life: 0,
      });
    }

    const sparkGeo = new THREE.BoxGeometry(0.035, 0.035, 0.14);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const sparkParticles: SparkParticle[] = [];
    for (let i = 0; i < 14; i++) {
      const sMesh = new THREE.Mesh(sparkGeo, sparkMat);
      sMesh.visible = false;
      scene.add(sMesh);
      sparkParticles.push({
        mesh: sMesh,
        vel: new THREE.Vector3(),
        life: 0,
      });
    }

    const spawnShotEffects = (impactWorldPos: THREE.Vector3) => {
      const shell = ejectedShells.find((s) => s.life <= 0) || ejectedShells[0];
      shell.life = 0.75;
      shell.mesh.visible = true;
      shell.mesh.position.set(0.32, -0.2, -0.52);
      shell.mesh.rotation.set(Math.random(), Math.random(), Math.random());
      shell.vel.set(0.95 + Math.random() * 0.4, 1.15 + Math.random() * 0.35, 0.25 + Math.random() * 0.3);
      shell.rotVel.set(18, 24, 15);

      sparkParticles.forEach((sp) => {
        sp.life = 0.28 + Math.random() * 0.18;
        sp.mesh.visible = true;
        sp.mesh.position.copy(impactWorldPos);
        sp.vel.set(
          (Math.random() - 0.5) * 6.5,
          1.2 + Math.random() * 4.5,
          1.5 + Math.random() * 4.0
        );
      });
    };

    // Bullet Tracer Line
    const tracerGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.4, 1.8),
      new THREE.Vector3(0, 1.8, -4.6),
    ]);
    const tracerMat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
    });
    const tracerLine = new THREE.Line(tracerGeo, tracerMat);
    scene.add(tracerLine);

    const triggerShot = (choice: boolean, customHitPoint?: THREE.Vector3) => {
      if (stateRef.current.gameState !== 'playing') return;

      const hitX = choice ? -2.48 : 2.48;
      const impactPos = customHitPoint || _vec3A.set(hitX, 1.88, -4.55);

      const posAttr = tracerGeo.getAttribute('position') as THREE.BufferAttribute;
      camera.getWorldPosition(_vec3B);
      posAttr.setXYZ(0, _vec3B.x + 0.24, _vec3B.y - 0.16, _vec3B.z - 0.44);
      posAttr.setXYZ(1, impactPos.x, impactPos.y, impactPos.z);
      posAttr.needsUpdate = true;

      spawnShotEffects(impactPos);

      stateRef.current.playerGunRecoil = 1.0;
      stateRef.current.playerMuzzleTimer = 0.12;
      if (choice) {
        stateRef.current.certoPlateTilt = 1.18;
      } else {
        stateRef.current.erradoPlateTilt = 1.18;
      }

      callbacksRef.current.onShootTarget(choice);
    };

    fire3DShotRef.current = triggerShot;

    // 10. Raycasting & CS2 Crosshair Tracking
    const raycaster = new THREE.Raycaster();
    let lastHoverTime = 0;

    const updateMouseNDC = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      _mouseNDC.x = (relX / rect.width) * 2 - 1;
      _mouseNDC.y = -(relY / rect.height) * 2 + 1;

      // Move CS2 Crosshair directly to the player's aim point
      if (cs2CrosshairRef.current) {
        cs2CrosshairRef.current.style.transform = `translate3d(${relX}px, ${relY}px, 0)`;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      updateMouseNDC(e.clientX, e.clientY);
      stateRef.current.aimWorldTarget.set(_mouseNDC.x * 3.8, 1.65 + _mouseNDC.y * 1.6, -4.65);

      const now = performance.now();
      if (now - lastHoverTime < 35) return;
      lastHoverTime = now;

      raycaster.setFromCamera(_mouseNDC, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);
      const hitType = (intersects[0]?.object?.userData?.targetType as 'CERTO' | 'ERRADO' | undefined) || null;

      if (hitType !== stateRef.current.hoveredTarget) {
        stateRef.current.hoveredTarget = hitType;
        certoTarget.faceMat.map = hitType === 'CERTO' ? certoTexHover : certoTexNormal;
        certoTarget.faceMat.emissiveIntensity = hitType === 'CERTO' ? 0.8 : 0.38;
        certoTarget.faceMat.needsUpdate = true;

        erradoTarget.faceMat.map = hitType === 'ERRADO' ? erradoTexHover : erradoTexNormal;
        erradoTarget.faceMat.emissiveIntensity = hitType === 'ERRADO' ? 0.8 : 0.38;
        erradoTarget.faceMat.needsUpdate = true;

        callbacksRef.current.onHoverTargetChange(hitType);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (stateRef.current.gameState !== 'playing') return;
      if (e.button !== 0) return;

      updateMouseNDC(e.clientX, e.clientY);
      raycaster.setFromCamera(_mouseNDC, camera);
      const intersects = raycaster.intersectObjects(clickableMeshes, false);

      if (intersects.length > 0) {
        const hitType = intersects[0].object.userData?.targetType as 'CERTO' | 'ERRADO' | undefined;
        if (hitType === 'CERTO') {
          triggerShot(true, intersects[0].point);
        } else if (hitType === 'ERRADO') {
          triggerShot(false, intersects[0].point);
        }
      } else {
        stateRef.current.playerGunRecoil = 0.68;
        stateRef.current.playerMuzzleTimer = 0.09;
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointermove', handlePointerMove);
    domElem.addEventListener('pointerdown', handlePointerDown);

    // Initialize CS2 crosshair at center of container
    if (cs2CrosshairRef.current) {
      const initW = (container.clientWidth || window.innerWidth) / 2;
      const initH = (container.clientHeight || window.innerHeight) / 2;
      cs2CrosshairRef.current.style.transform = `translate3d(${initW}px, ${initH}px, 0)`;
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 11. Render Loop with Software-WebGL Pacing Guard (`afterDraw`)
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      if (st.gameState === 'playing' && updateBoardCanvasRef.current) {
        updateBoardCanvasRef.current();
      }

      // 1. Sculpted NPC tension, breathing, and head/rifle tracking (NO LASER)
      const urgency = st.gameState === 'playing' ? Math.max(0, 1 - st.timeLeft / 24) : 0;
      const breathSpeed = 2.2 + urgency * 7.5;
      npcRig.npcUpperBody.position.y =
        1.12 + Math.sin(elapsed * breathSpeed) * (0.01 + urgency * 0.014);
      npcRig.headGroup.rotation.y = THREE.MathUtils.damp(
        npcRig.headGroup.rotation.y,
        _mouseNDC.x * 0.15,
        5,
        delta
      );
      npcRig.npcWeaponGroup.rotation.x = Math.sin(elapsed * (breathSpeed * 1.25)) * 0.02;
      npcRig.npcWeaponGroup.rotation.y =
        Math.cos(elapsed * 1.6) * 0.014 + _mouseNDC.x * 0.06;

      // 2. CS2 Viewmodel Sway, Recoil & Reciprocating CNC Slide Cycle
      st.playerGunRecoil = THREE.MathUtils.damp(st.playerGunRecoil, 0, 16, delta);
      st.swayX = THREE.MathUtils.damp(st.swayX, _mouseNDC.x, 10, delta);
      st.swayY = THREE.MathUtils.damp(st.swayY, _mouseNDC.y, 10, delta);

      const lagX = _mouseNDC.x - st.swayX;
      const lagY = _mouseNDC.y - st.swayY;

      fpWeaponRig.fpRoot.position.x = fpWeaponRig.fpBasePos.x - lagX * 0.04;
      fpWeaponRig.fpRoot.position.z = fpWeaponRig.fpBasePos.z + st.playerGunRecoil * 0.13;
      fpWeaponRig.fpRoot.position.y =
        fpWeaponRig.fpBasePos.y +
        Math.sin(elapsed * 2.4) * 0.004 +
        st.playerGunRecoil * 0.038 -
        lagY * 0.03;
      fpWeaponRig.fpRoot.rotation.x = st.playerGunRecoil * 0.32 + _mouseNDC.y * 0.18;
      fpWeaponRig.fpRoot.rotation.y = -_mouseNDC.x * 0.25 - lagX * 0.12;

      // Slide cycles back along Z during recoil exposing the match barrel hood
      fpWeaponRig.fpSlideGroup.position.z = st.playerGunRecoil * 0.088;

      // Update CS2 Crosshair dynamic gap expansion based on weapon recoil
      const gapPx = 4 + st.playerGunRecoil * 14;
      if (cs2TopBarRef.current) {
        cs2TopBarRef.current.style.transform = `translate3d(-50%, ${-gapPx - 9}px, 0)`;
      }
      if (cs2BottomBarRef.current) {
        cs2BottomBarRef.current.style.transform = `translate3d(-50%, ${gapPx}px, 0)`;
      }
      if (cs2LeftBarRef.current) {
        cs2LeftBarRef.current.style.transform = `translate3d(${-gapPx - 9}px, -50%, 0)`;
      }
      if (cs2RightBarRef.current) {
        cs2RightBarRef.current.style.transform = `translate3d(${gapPx}px, -50%, 0)`;
      }

      // 3. Ejected Brass Shell Casings Physics & Impact Sparks
      ejectedShells.forEach((shell) => {
        if (shell.life > 0) {
          shell.life -= delta;
          shell.vel.y -= 4.8 * delta;
          shell.mesh.position.addScaledVector(shell.vel, delta);
          shell.mesh.rotation.x += shell.rotVel.x * delta;
          shell.mesh.rotation.y += shell.rotVel.y * delta;
          shell.mesh.rotation.z += shell.rotVel.z * delta;
          if (shell.life <= 0) {
            shell.mesh.visible = false;
          }
        }
      });

      sparkParticles.forEach((sp) => {
        if (sp.life > 0) {
          sp.life -= delta;
          sp.vel.y -= 9.8 * delta;
          sp.mesh.position.addScaledVector(sp.vel, delta);
          sp.mesh.lookAt(
            sp.mesh.position.x + sp.vel.x,
            sp.mesh.position.y + sp.vel.y,
            sp.mesh.position.z + sp.vel.z
          );
          if (sp.life <= 0) {
            sp.mesh.visible = false;
          }
        }
      });

      // 4. Player Muzzle Flash & Tracer Decay
      if (st.playerMuzzleTimer > 0) {
        st.playerMuzzleTimer = Math.max(0, st.playerMuzzleTimer - delta);
        const flashAlpha = st.playerMuzzleTimer / 0.12;
        fpWeaponRig.playerMuzzleMat.opacity = flashAlpha;
        tracerMat.opacity = flashAlpha * 0.92;
        playerFlashLight.intensity = flashAlpha * 5.5;
        camera.getWorldPosition(playerFlashLight.position);
      } else {
        fpWeaponRig.playerMuzzleMat.opacity = 0;
        tracerMat.opacity = 0;
        playerFlashLight.intensity = 0;
      }

      // 5. Hydraulic Target Plate Hinge Spring-Back
      st.certoPlateTilt = THREE.MathUtils.damp(st.certoPlateTilt, 0, 8, delta);
      certoTarget.platePivot.rotation.x = -st.certoPlateTilt;

      st.erradoPlateTilt = THREE.MathUtils.damp(st.erradoPlateTilt, 0, 8, delta);
      erradoTarget.platePivot.rotation.x = -st.erradoPlateTilt;

      // 6. NPC Execution Shot & Player Camera Knockdown
      if (st.npcMuzzleTimer > 0) {
        st.npcMuzzleTimer = Math.max(0, st.npcMuzzleTimer - delta);
        const npcFlash = st.npcMuzzleTimer / 0.35;
        npcRig.npcMuzzleFlashMat.opacity = npcFlash;
        npcFlashLight.intensity = npcFlash * 18;
        npcRig.npcWeaponGroup.position.z = 0.62 - npcFlash * 0.18;
      } else {
        npcRig.npcMuzzleFlashMat.opacity = 0;
        npcFlashLight.intensity = 0;
        npcRig.npcWeaponGroup.position.z = 0.62;
      }

      if (st.gameState === 'executing' || st.gameState === 'gameover') {
        st.cameraDeathFall = THREE.MathUtils.damp(st.cameraDeathFall, 1, 4.5, delta);
        st.cameraShake = THREE.MathUtils.damp(st.cameraShake, 0, 6, delta);
        camera.position.x = baseCamPos.x + (Math.random() - 0.5) * st.cameraShake * 0.35;
        camera.position.y = THREE.MathUtils.lerp(baseCamPos.y, 0.45, st.cameraDeathFall);
        camera.position.z = THREE.MathUtils.lerp(baseCamPos.z, 2.85, st.cameraDeathFall);
        camera.rotation.z = THREE.MathUtils.lerp(0, -0.48, st.cameraDeathFall);
        camera.rotation.x = THREE.MathUtils.lerp(-0.04, 0.28, st.cameraDeathFall);
      } else {
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          baseCamPos.x + _mouseNDC.x * 0.18,
          6,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          baseCamPos.y + _mouseNDC.y * 0.08,
          6,
          delta
        );
        camera.position.z = baseCamPos.z;
        camera.lookAt(_mouseNDC.x * 0.55, 1.85 + _mouseNDC.y * 0.35, -5.0);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointermove', handlePointerMove);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (domElem.parentNode === container) {
        container.removeChild(domElem);
      }
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className={`w-full h-full relative overflow-hidden ${
        gameState === 'playing' ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Authentic Counter-Strike 2 Classic Dynamic/Static Crosshair (cl_crosshaircolor 1, cl_crosshair_drawoutline 1) */}
      {gameState === 'playing' && (
        <div
          ref={cs2CrosshairRef}
          className="pointer-events-none absolute top-0 left-0 z-30 will-change-transform"
        >
          {/* Center 2x2px Dot with 1px Black Outline */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#00FF41] border border-black/95" />

          {/* Top Crosshair Pip */}
          <div
            ref={cs2TopBarRef}
            className="absolute left-0 top-0 w-[3px] h-[9px] bg-[#00FF41] border border-black/95"
            style={{ transform: 'translate3d(-50%, -13px, 0)' }}
          />

          {/* Bottom Crosshair Pip */}
          <div
            ref={cs2BottomBarRef}
            className="absolute left-0 top-0 w-[3px] h-[9px] bg-[#00FF41] border border-black/95"
            style={{ transform: 'translate3d(-50%, 4px, 0)' }}
          />

          {/* Left Crosshair Pip */}
          <div
            ref={cs2LeftBarRef}
            className="absolute left-0 top-0 w-[9px] h-[3px] bg-[#00FF41] border border-black/95"
            style={{ transform: 'translate3d(-13px, -50%, 0)' }}
          />

          {/* Right Crosshair Pip */}
          <div
            ref={cs2RightBarRef}
            className="absolute left-0 top-0 w-[9px] h-[3px] bg-[#00FF41] border border-black/95"
            style={{ transform: 'translate3d(4px, -50%, 0)' }}
          />
        </div>
      )}
    </div>
  );
};
