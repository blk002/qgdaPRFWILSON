import * as THREE from 'three';

export interface TacticalMaterialLibrary {
  kevlarMat: THREE.MeshPhysicalMaterial;
  corduraOliveMat: THREE.MeshStandardMaterial;
  uniformFabricMat: THREE.MeshStandardMaterial;
  bluedSteelMat: THREE.MeshPhysicalMaterial;
  parkerizedSteelMat: THREE.MeshPhysicalMaterial;
  brushedSteelMat: THREE.MeshPhysicalMaterial;
  chromeBarrelMat: THREE.MeshPhysicalMaterial;
  polymerGripMat: THREE.MeshStandardMaterial;
  brassMat: THREE.MeshPhysicalMaterial;
  copperJacketMat: THREE.MeshPhysicalMaterial;
  visorGlassMat: THREE.MeshPhysicalMaterial;
  opticLensMat: THREE.MeshPhysicalMaterial;
  tritiumGlowMat: THREE.MeshBasicMaterial;
  goldBadgeMat: THREE.MeshPhysicalMaterial;
  leatherGloveMat: THREE.MeshPhysicalMaterial;
  carbonFiberMat: THREE.MeshPhysicalMaterial;
  skinToneMat: THREE.MeshStandardMaterial;
  bunkerConcreteMat: THREE.MeshStandardMaterial;
  acousticFoamMat: THREE.MeshStandardMaterial;
  diamondPlateMat: THREE.MeshStandardMaterial;
  hazardStripeMat: THREE.MeshStandardMaterial;
}

/**
 * Generates high-resolution procedural normal/bump/roughness/albedo CanvasTextures
 */
export function createTacticalMaterials(maxAnisotropy: number, isSoftwareGl: boolean): TacticalMaterialLibrary {
  // 1. High-density Cordura / Kevlar ballistic weave bump map
  const kevlarCanvas = document.createElement('canvas');
  kevlarCanvas.width = 256;
  kevlarCanvas.height = 256;
  const kCtx = kevlarCanvas.getContext('2d')!;
  kCtx.fillStyle = '#808080';
  kCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 8) {
      const isAlt = ((x + y) / 8) % 2 === 0;
      kCtx.fillStyle = isAlt ? '#c4c4c4' : '#3a3a3a';
      kCtx.fillRect(x, y, 7, 3);
      kCtx.fillStyle = isAlt ? '#4a4a4a' : '#b4b4b4';
      kCtx.fillRect(x, y + 4, 3, 7);
    }
  }
  const kevlarBump = new THREE.CanvasTexture(kevlarCanvas);
  kevlarBump.wrapS = THREE.RepeatWrapping;
  kevlarBump.wrapT = THREE.RepeatWrapping;
  kevlarBump.repeat.set(14, 14);

  // 2. Custom Pistol Grip Diamond Checkering / Stippling bump map
  const gripCanvas = document.createElement('canvas');
  gripCanvas.width = 256;
  gripCanvas.height = 256;
  const gCtx = gripCanvas.getContext('2d')!;
  gCtx.fillStyle = '#606060';
  gCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 8) {
      gCtx.fillStyle = '#e0e0e0';
      gCtx.beginPath();
      gCtx.moveTo(x + 4, y);
      gCtx.lineTo(x + 8, y + 4);
      gCtx.lineTo(x + 4, y + 8);
      gCtx.lineTo(x, y + 4);
      gCtx.closePath();
      gCtx.fill();
    }
  }
  const gripBump = new THREE.CanvasTexture(gripCanvas);
  gripBump.wrapS = THREE.RepeatWrapping;
  gripBump.wrapT = THREE.RepeatWrapping;
  gripBump.repeat.set(10, 10);

  // 3. Brushed CNC Gunmetal micro-grain bump map
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const mCtx = metalCanvas.getContext('2d')!;
  mCtx.fillStyle = '#808080';
  mCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const shade = 110 + Math.floor(Math.random() * 36);
    mCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
    mCtx.fillRect(0, y, 256, 1);
  }
  const metalBump = new THREE.CanvasTexture(metalCanvas);
  metalBump.wrapS = THREE.RepeatWrapping;
  metalBump.wrapT = THREE.RepeatWrapping;
  metalBump.repeat.set(4, 4);

  // 4. Board-formed architectural concrete texture with weathering & seams
  const concCanvas = document.createElement('canvas');
  concCanvas.width = 512;
  concCanvas.height = 512;
  const cCtx = concCanvas.getContext('2d')!;
  cCtx.fillStyle = '#1b1f29';
  cCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    const alpha = Math.random() * 0.08;
    cCtx.fillStyle = Math.random() > 0.48 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.6})`;
    cCtx.fillRect(nx, ny, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  cCtx.strokeStyle = '#0e1117';
  cCtx.lineWidth = 4;
  cCtx.strokeRect(4, 4, 504, 250);
  cCtx.strokeRect(4, 258, 504, 250);
  [
    [48, 48],
    [256, 48],
    [464, 48],
    [48, 210],
    [256, 210],
    [464, 210],
    [48, 302],
    [256, 302],
    [464, 302],
    [48, 464],
    [256, 464],
    [464, 464],
  ].forEach(([cx, cy]) => {
    cCtx.fillStyle = '#090b10';
    cCtx.beginPath();
    cCtx.arc(cx, cy, 6, 0, Math.PI * 2);
    cCtx.fill();
  });
  const concTex = new THREE.CanvasTexture(concCanvas);
  concTex.colorSpace = THREE.SRGBColorSpace;
  concTex.wrapS = THREE.RepeatWrapping;
  concTex.wrapT = THREE.RepeatWrapping;
  concTex.repeat.set(3, 2);
  concTex.anisotropy = maxAnisotropy;

  // 5. Scuffed Tactical Range Floor with lane markings & tire/boot wear
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const fCtx = floorCanvas.getContext('2d')!;
  fCtx.fillStyle = '#141820';
  fCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    fCtx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.07)';
    fCtx.fillRect(x, y, 3, 3);
  }
  fCtx.strokeStyle = '#1f2637';
  fCtx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    fCtx.beginPath();
    fCtx.moveTo(i, 0);
    fCtx.lineTo(i, 512);
    fCtx.stroke();
    fCtx.beginPath();
    fCtx.moveTo(0, i);
    fCtx.lineTo(512, i);
    fCtx.stroke();
  }
  fCtx.fillStyle = '#262f45';
  for (let y = 16; y < 512; y += 32) {
    for (let x = 16; x < 512; x += 32) {
      fCtx.save();
      fCtx.translate(x, y);
      fCtx.rotate(((x + y) / 32) % 2 === 0 ? Math.PI / 4 : -Math.PI / 4);
      fCtx.fillRect(-6, -2, 12, 4);
      fCtx.restore();
    }
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(6, 6);
  floorTex.anisotropy = maxAnisotropy;

  // 6. Hazard yellow/black chevron texture
  const hazCanvas = document.createElement('canvas');
  hazCanvas.width = 256;
  hazCanvas.height = 64;
  const hCtx = hazCanvas.getContext('2d')!;
  hCtx.fillStyle = '#eab308';
  hCtx.fillRect(0, 0, 256, 64);
  hCtx.fillStyle = '#09090b';
  for (let i = -64; i < 320; i += 32) {
    hCtx.beginPath();
    hCtx.moveTo(i, 0);
    hCtx.lineTo(i + 16, 0);
    hCtx.lineTo(i - 16, 64);
    hCtx.lineTo(i - 32, 64);
    hCtx.closePath();
    hCtx.fill();
  }
  const hazTex = new THREE.CanvasTexture(hazCanvas);
  hazTex.colorSpace = THREE.SRGBColorSpace;
  hazTex.wrapS = THREE.RepeatWrapping;
  hazTex.wrapT = THREE.RepeatWrapping;
  hazTex.repeat.set(8, 1);
  hazTex.anisotropy = maxAnisotropy;

  return {
    kevlarMat: new THREE.MeshPhysicalMaterial({
      color: 0x161e2e,
      roughness: 0.64,
      metalness: 0.15,
      bumpMap: kevlarBump,
      bumpScale: 0.018,
      sheen: 0.4,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color(0x334155),
    }),
    corduraOliveMat: new THREE.MeshStandardMaterial({
      color: 0x2c3527,
      roughness: 0.78,
      metalness: 0.08,
      bumpMap: kevlarBump,
      bumpScale: 0.016,
    }),
    uniformFabricMat: new THREE.MeshStandardMaterial({
      color: 0x1e2636,
      roughness: 0.86,
      metalness: 0.05,
      bumpMap: kevlarBump,
      bumpScale: 0.01,
    }),
    bluedSteelMat: new THREE.MeshPhysicalMaterial({
      color: 0x1c2029,
      roughness: 0.22,
      metalness: 0.95,
      bumpMap: metalBump,
      bumpScale: 0.004,
      anisotropy: isSoftwareGl ? 0 : 0.85,
      clearcoat: 0.3,
      clearcoatRoughness: 0.22,
    }),
    parkerizedSteelMat: new THREE.MeshPhysicalMaterial({
      color: 0x2a2e37,
      roughness: 0.42,
      metalness: 0.88,
      bumpMap: metalBump,
      bumpScale: 0.008,
    }),
    brushedSteelMat: new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      roughness: 0.26,
      metalness: 0.92,
      bumpMap: metalBump,
      bumpScale: 0.005,
      anisotropy: isSoftwareGl ? 0 : 0.8,
    }),
    chromeBarrelMat: new THREE.MeshPhysicalMaterial({
      color: 0xe4e4e7,
      roughness: 0.12,
      metalness: 0.98,
      clearcoat: 0.6,
    }),
    polymerGripMat: new THREE.MeshStandardMaterial({
      color: 0x12141a,
      roughness: 0.74,
      metalness: 0.08,
      bumpMap: gripBump,
      bumpScale: 0.024,
    }),
    brassMat: new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      roughness: 0.16,
      metalness: 0.96,
      clearcoat: 0.45,
    }),
    copperJacketMat: new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.94,
    }),
    visorGlassMat: new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.06,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: isSoftwareGl ? 0 : 0.75,
      iridescenceIOR: 1.45,
    }),
    opticLensMat: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.04,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.3 : 1.0,
      ior: 1.52,
      thickness: 0.2,
      clearcoat: 1.0,
      depthWrite: false,
    }),
    tritiumGlowMat: new THREE.MeshBasicMaterial({
      color: 0x00ff41, // CS2 signature bright tactical green
    }),
    goldBadgeMat: new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      roughness: 0.18,
      metalness: 0.95,
      clearcoat: 0.6,
    }),
    leatherGloveMat: new THREE.MeshPhysicalMaterial({
      color: 0x14161d,
      roughness: 0.55,
      metalness: 0.12,
      bumpMap: kevlarBump,
      bumpScale: 0.008,
      sheen: 0.3,
      sheenColor: new THREE.Color(0x27272a),
    }),
    carbonFiberMat: new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.25,
      metalness: 0.5,
      bumpMap: gripBump,
      bumpScale: 0.01,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
    }),
    skinToneMat: new THREE.MeshStandardMaterial({
      color: 0xc89678,
      roughness: 0.58,
      metalness: 0.04,
    }),
    bunkerConcreteMat: new THREE.MeshStandardMaterial({
      map: concTex,
      bumpMap: concTex,
      bumpScale: 0.028,
      roughness: 0.85,
      metalness: 0.08,
    }),
    acousticFoamMat: new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.92,
      metalness: 0.02,
      bumpMap: gripBump,
      bumpScale: 0.045,
    }),
    diamondPlateMat: new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorTex,
      bumpScale: 0.022,
      roughness: 0.45,
      metalness: 0.65,
    }),
    hazardStripeMat: new THREE.MeshStandardMaterial({
      map: hazTex,
      roughness: 0.48,
      metalness: 0.2,
    }),
  };
}

/**
 * Helper: Creates a precision CNC-beveled box using ExtrudeGeometry
 */
export function createBeveledBoxGeometry(
  width: number,
  height: number,
  depth: number,
  bevelSize = 0.015,
  bevelSegments = 3
): THREE.ExtrudeGeometry {
  const w = Math.max(0.008, width - bevelSize * 2);
  const h = Math.max(0.008, height - bevelSize * 2);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(w / 2, h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: Math.max(0.008, depth - bevelSize * 2),
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelSegments,
  });
  geo.center();
  return geo;
}

/**
 * Helper: Creates an octagonal/chamfered CS2 pistol slide profile
 */
function createChamferedSlideGeometry(width: number, height: number, length: number): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const ch = width * 0.22; // Top corner chamfers like USP-S / Glock CS2 slide
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw, hh - ch);
  shape.lineTo(hw - ch, hh);
  shape.lineTo(-hw + ch, hh);
  shape.lineTo(-hw, hh - ch);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: length,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

/**
 * Builds the Ultra-Detailed CS2-Style Tactical Operator NPC + M4A4/Tactical Carbine (NO LASER)
 */
export function buildHighDetailNPC(mats: TacticalMaterialLibrary, isSoftwareGl: boolean) {
  const npcRoot = new THREE.Group();
  npcRoot.position.set(0, 0, -5.0); // Grounded at y = 0

  // Contact shadow plane directly under NPC
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.88)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.78 })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  npcRoot.add(contactShadow);

  // 1. Anatomically Sculpted Combat Boots, Bloused Tactical Trousers, Hard-Shell Knee Pads & Drop-Leg Rig
  const bootSoleGeo = createBeveledBoxGeometry(0.21, 0.055, 0.39, 0.012, 3);
  const bootFootGeo = createBeveledBoxGeometry(0.195, 0.14, 0.33, 0.028, 3);
  const bootShaftGeo = new THREE.CylinderGeometry(0.095, 0.09, 0.18, 16);

  // Sculpted anatomical calf & thigh profiles via LatheGeometry
  const calfProfile = [
    new THREE.Vector2(0.078, 0.0),
    new THREE.Vector2(0.092, 0.08),
    new THREE.Vector2(0.118, 0.24),
    new THREE.Vector2(0.105, 0.38),
    new THREE.Vector2(0.098, 0.44),
  ];
  const calfLatheGeo = new THREE.LatheGeometry(calfProfile, 18);

  const thighProfile = [
    new THREE.Vector2(0.105, 0.0),
    new THREE.Vector2(0.132, 0.15),
    new THREE.Vector2(0.148, 0.32),
    new THREE.Vector2(0.142, 0.44),
  ];
  const thighLatheGeo = new THREE.LatheGeometry(thighProfile, 18);

  const kneePadCapGeo = createBeveledBoxGeometry(0.155, 0.175, 0.085, 0.024, 3);
  const cargoPocketGeo = createBeveledBoxGeometry(0.065, 0.22, 0.19, 0.012, 2);

  [-1, 1].forEach((side) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 0.235, 0, side === 1 ? -0.06 : 0.05); // Authentic staggered firing stance
    legGroup.rotation.y = side * -0.09;

    // Boot sole with heel & toe cap
    const sole = new THREE.Mesh(bootSoleGeo, mats.polymerGripMat);
    sole.position.set(0, 0.028, 0.045);
    sole.castShadow = !isSoftwareGl;
    legGroup.add(sole);

    const bootFoot = new THREE.Mesh(bootFootGeo, mats.leatherGloveMat);
    bootFoot.position.set(0, 0.095, 0.035);
    bootFoot.castShadow = !isSoftwareGl;
    legGroup.add(bootFoot);

    const bootShaft = new THREE.Mesh(bootShaftGeo, mats.leatherGloveMat);
    bootShaft.position.set(0, 0.21, -0.01);
    legGroup.add(bootShaft);

    // Sculpted Calf
    const calf = new THREE.Mesh(calfLatheGeo, mats.uniformFabricMat);
    calf.position.set(0, 0.22, 0);
    calf.castShadow = !isSoftwareGl;
    legGroup.add(calf);

    // Molded Tactical Knee Pad + Dual Elastic Straps
    const kneePad = new THREE.Mesh(kneePadCapGeo, mats.polymerGripMat);
    kneePad.position.set(0, 0.62, 0.095);
    legGroup.add(kneePad);

    [0.58, 0.66].forEach((strapY) => {
      const strap = new THREE.Mesh(
        new THREE.TorusGeometry(0.112, 0.014, 8, 20),
        mats.leatherGloveMat
      );
      strap.rotation.x = Math.PI / 2;
      strap.position.set(0, strapY, 0);
      legGroup.add(strap);
    });

    // Sculpted Thigh
    const thigh = new THREE.Mesh(thighLatheGeo, mats.uniformFabricMat);
    thigh.position.set(0, 0.64, 0);
    thigh.castShadow = !isSoftwareGl;
    legGroup.add(thigh);

    // Right thigh: Molded Kydex Drop-Leg Holster with Secondary Sidearm; Left thigh: Cargo Dump Pouch
    if (side === 1) {
      const holsterPlate = new THREE.Mesh(
        createBeveledBoxGeometry(0.055, 0.24, 0.16, 0.01, 2),
        mats.polymerGripMat
      );
      holsterPlate.position.set(0.145, 0.86, 0.02);
      legGroup.add(holsterPlate);

      const sidearmGrip = new THREE.Mesh(
        createBeveledBoxGeometry(0.045, 0.11, 0.08, 0.008, 2),
        mats.bluedSteelMat
      );
      sidearmGrip.rotation.x = -0.3;
      sidearmGrip.position.set(0.16, 0.98, -0.01);
      legGroup.add(sidearmGrip);
    } else {
      const cargoPocket = new THREE.Mesh(cargoPocketGeo, mats.corduraOliveMat);
      cargoPocket.position.set(-0.145, 0.85, 0.01);
      legGroup.add(cargoPocket);
    }

    npcRoot.add(legGroup);
  });

  // 2. Sculpted Pelvis, Groin Protector & Heavy Tactical War Belt
  const pelvis = new THREE.Mesh(
    createBeveledBoxGeometry(0.58, 0.23, 0.35, 0.045, 3),
    mats.uniformFabricMat
  );
  pelvis.position.set(0, 1.05, 0);
  npcRoot.add(pelvis);

  const groinFlap = new THREE.Mesh(
    createBeveledBoxGeometry(0.28, 0.22, 0.06, 0.015, 3),
    mats.kevlarMat
  );
  groinFlap.position.set(0, 0.99, 0.175);
  groinFlap.rotation.x = -0.08;
  npcRoot.add(groinFlap);

  // Upper Body Group (Animated with breathing & aiming tension)
  const npcUpperBody = new THREE.Group();
  npcUpperBody.position.set(0, 1.12, 0);
  npcRoot.add(npcUpperBody);

  // Cobra-Buckle Tactical War Belt
  const dutyBelt = new THREE.Mesh(
    createBeveledBoxGeometry(0.63, 0.105, 0.39, 0.02, 3),
    mats.corduraOliveMat
  );
  dutyBelt.position.set(0, 0.02, 0);
  npcUpperBody.add(dutyBelt);

  const cobraBuckle = new THREE.Mesh(
    createBeveledBoxGeometry(0.095, 0.075, 0.045, 0.008, 2),
    mats.goldBadgeMat
  );
  cobraBuckle.position.set(0, 0.02, 0.195);
  npcUpperBody.add(cobraBuckle);

  // 3. Thoracic Combat Shirt & Crye Precision JPC Plate Carrier Vest
  const combatShirtTorso = new THREE.Mesh(
    createBeveledBoxGeometry(0.6, 0.64, 0.36, 0.065, 4),
    mats.uniformFabricMat
  );
  combatShirtTorso.position.set(0, 0.39, 0);
  combatShirtTorso.castShadow = !isSoftwareGl;
  npcUpperBody.add(combatShirtTorso);

  const plateCarrier = new THREE.Mesh(
    createBeveledBoxGeometry(0.53, 0.55, 0.41, 0.038, 4),
    mats.kevlarMat
  );
  plateCarrier.position.set(0, 0.4, 0.01);
  plateCarrier.castShadow = !isSoftwareGl;
  npcUpperBody.add(plateCarrier);

  // MOLLE Webbing Rows
  const molleGeo = createBeveledBoxGeometry(0.47, 0.024, 0.022, 0.004, 2);
  [0.23, 0.31, 0.39, 0.47, 0.55].forEach((yPos) => {
    const strip = new THREE.Mesh(molleGeo, mats.corduraOliveMat);
    strip.position.set(0, yPos, 0.215);
    npcUpperBody.add(strip);
  });

  // 3 STANAG Rifle Magazine Pouches with Exposed PMAG Baseplates & Bungee Retention
  const magPouchGeo = createBeveledBoxGeometry(0.112, 0.185, 0.08, 0.012, 2);
  const pmagTopGeo = createBeveledBoxGeometry(0.092, 0.065, 0.055, 0.006, 2);
  [-0.145, 0, 0.145].forEach((xOff) => {
    const pouch = new THREE.Mesh(magPouchGeo, mats.corduraOliveMat);
    pouch.position.set(xOff, 0.265, 0.245);
    npcUpperBody.add(pouch);

    const pmag = new THREE.Mesh(pmagTopGeo, mats.polymerGripMat);
    pmag.position.set(xOff, 0.38, 0.245);
    npcUpperBody.add(pmag);
  });

  // 2 M84 Stun Grenades / Flashbangs Clipped to Upper Chest Rig
  const flashbangBodyGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.11, 14);
  [-0.21, -0.13].forEach((xOff) => {
    const fbGroup = new THREE.Group();
    fbGroup.position.set(xOff, 0.51, 0.235);
    fbGroup.rotation.z = 0.15;
    const fbBody = new THREE.Mesh(flashbangBodyGeo, mats.parkerizedSteelMat);
    fbGroup.add(fbBody);
    const fbSpoon = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.09, 0.025),
      mats.brushedSteelMat
    );
    fbSpoon.position.set(0.024, 0.01, 0);
    fbGroup.add(fbSpoon);
    npcUpperBody.add(fbGroup);
  });

  // Tactical AN/PRC Radio + Coiled PTT Cable + Whip Antenna
  const radioBox = new THREE.Mesh(
    createBeveledBoxGeometry(0.088, 0.15, 0.055, 0.008, 2),
    mats.polymerGripMat
  );
  radioBox.position.set(-0.22, 0.34, 0.21);
  npcUpperBody.add(radioBox);

  const radioAntenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.007, 0.36, 8),
    mats.polymerGripMat
  );
  radioAntenna.position.set(-0.24, 0.58, 0.19);
  radioAntenna.rotation.z = 0.08;
  npcUpperBody.add(radioAntenna);

  // Golden Hexagonal Federal Police Badge on Upper Right Chest
  const badgeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.056, 0.018, 6),
    mats.goldBadgeMat
  );
  badgeMesh.rotation.x = Math.PI / 2;
  badgeMesh.position.set(0.15, 0.53, 0.22);
  npcUpperBody.add(badgeMesh);

  // Padded Shoulder Straps & Deltoid Armor Pads
  const strapGeo = createBeveledBoxGeometry(0.12, 0.19, 0.39, 0.02, 3);
  [-0.21, 0.21].forEach((xOff) => {
    const strap = new THREE.Mesh(strapGeo, mats.corduraOliveMat);
    strap.position.set(xOff, 0.66, 0.01);
    npcUpperBody.add(strap);
  });

  // 4. Sculpted Head, Balaclava, Ops-Core FAST Helmet, Panoramic Visor, Peltor ComTac Headset & Boom Mic
  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.115, 0.17, 18),
    mats.polymerGripMat
  );
  neckMesh.position.set(0, 0.75, 0.01);
  npcUpperBody.add(neckMesh);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.92, 0.04);
  npcUpperBody.add(headGroup);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.188, 28, 28), mats.skinToneMat);
  cranium.scale.set(0.94, 1.08, 1.03);
  headGroup.add(cranium);

  // Ribbed Tactical Balaclava Mask covering nose, mouth & jaw
  const balaclavaMask = new THREE.Mesh(
    new THREE.CylinderGeometry(0.178, 0.145, 0.21, 24),
    mats.polymerGripMat
  );
  balaclavaMask.position.set(0, -0.06, 0.022);
  headGroup.add(balaclavaMask);

  // Ops-Core FAST High-Cut Ballistic Helmet Shell
  const helmetShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.218, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.58),
    mats.corduraOliveMat
  );
  helmetShell.scale.set(0.98, 1.02, 1.09);
  helmetShell.position.set(0, 0.032, -0.01);
  helmetShell.castShadow = !isSoftwareGl;
  headGroup.add(helmetShell);

  // Wilcox Aluminum NVG Mount Shroud on Front of Helmet
  const nvgMount = new THREE.Mesh(
    createBeveledBoxGeometry(0.095, 0.085, 0.042, 0.006, 2),
    mats.brushedSteelMat
  );
  nvgMount.position.set(0, 0.135, 0.215);
  nvgMount.rotation.x = -0.22;
  headGroup.add(nvgMount);

  // Helmet ARC Side Rails, Strobe Light & Peltor ComTac Tactical Headset
  [-1, 1].forEach((side) => {
    const sideRail = new THREE.Mesh(
      createBeveledBoxGeometry(0.032, 0.048, 0.19, 0.005, 2),
      mats.polymerGripMat
    );
    sideRail.position.set(side * 0.205, 0.06, 0.02);
    headGroup.add(sideRail);

    const earCup = new THREE.Mesh(
      createBeveledBoxGeometry(0.072, 0.125, 0.105, 0.024, 3),
      mats.corduraOliveMat
    );
    earCup.position.set(side * 0.198, -0.02, -0.005);
    headGroup.add(earCup);
  });

  // Curved Boom Microphone extending from Left Ear Cup to Mouth
  const micCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.195, -0.05, 0.03),
    new THREE.Vector3(-0.16, -0.09, 0.14),
    new THREE.Vector3(-0.04, -0.095, 0.2),
  ]);
  const boomMic = new THREE.Mesh(
    new THREE.TubeGeometry(micCurve, 12, 0.006, 8, false),
    mats.bluedSteelMat
  );
  headGroup.add(boomMic);

  // Wrap-Around Ballistic Goggles Frame & Anti-Reflective Dark Visor
  const goggleFrame = new THREE.Mesh(
    createBeveledBoxGeometry(0.36, 0.12, 0.165, 0.022, 3),
    mats.polymerGripMat
  );
  goggleFrame.position.set(0, 0.022, 0.132);
  headGroup.add(goggleFrame);

  const goggleLens = new THREE.Mesh(
    createBeveledBoxGeometry(0.33, 0.088, 0.155, 0.018, 3),
    mats.visorGlassMat
  );
  goggleLens.position.set(0, 0.022, 0.148);
  headGroup.add(goggleLens);

  // 5. Anatomically Articulated Arms Locked in CS2 CQB Firing Stance
  const shoulderArmorGeo = createBeveledBoxGeometry(0.165, 0.21, 0.19, 0.035, 3);
  const upperArmGeo = new THREE.CapsuleGeometry(0.086, 0.27, 10, 16);
  const forearmGeo = new THREE.CapsuleGeometry(0.075, 0.29, 10, 16);

  const rightShoulder = new THREE.Mesh(shoulderArmorGeo, mats.kevlarMat);
  rightShoulder.position.set(0.36, 0.58, 0.04);
  rightShoulder.rotation.z = -0.22;
  npcUpperBody.add(rightShoulder);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, mats.uniformFabricMat);
  rightUpperArm.position.set(0.32, 0.52, 0.22);
  rightUpperArm.rotation.x = Math.PI / 2 - 0.18;
  rightUpperArm.rotation.z = 0.35;
  npcUpperBody.add(rightUpperArm);

  const rightForearm = new THREE.Mesh(forearmGeo, mats.uniformFabricMat);
  rightForearm.position.set(0.14, 0.49, 0.48);
  rightForearm.rotation.x = Math.PI / 2 - 0.05;
  rightForearm.rotation.z = 0.48;
  npcUpperBody.add(rightForearm);

  const leftShoulder = new THREE.Mesh(shoulderArmorGeo, mats.kevlarMat);
  leftShoulder.position.set(-0.36, 0.58, 0.04);
  leftShoulder.rotation.z = 0.22;
  npcUpperBody.add(leftShoulder);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, mats.uniformFabricMat);
  leftUpperArm.position.set(-0.31, 0.52, 0.25);
  leftUpperArm.rotation.x = Math.PI / 2 - 0.15;
  leftUpperArm.rotation.z = -0.32;
  npcUpperBody.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(forearmGeo, mats.uniformFabricMat);
  leftForearm.position.set(-0.11, 0.49, 0.58);
  leftForearm.rotation.x = Math.PI / 2 - 0.04;
  leftForearm.rotation.z = -0.36;
  npcUpperBody.add(leftForearm);

  // 6. Ultra-Detailed CS2 M4A4 / Tactical Carbine Assembly Pointed at Player (NO LASER)
  const npcWeaponGroup = new THREE.Group();
  npcWeaponGroup.position.set(0.03, 0.53, 0.62);
  npcUpperBody.add(npcWeaponGroup);

  // SOPMOD Crane Telescopic Stock & Buffer Tube
  const bufferTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.28, 14),
    mats.bluedSteelMat
  );
  bufferTube.rotation.x = Math.PI / 2;
  bufferTube.position.set(0, 0.025, -0.28);
  npcWeaponGroup.add(bufferTube);

  const stockBody = new THREE.Mesh(
    createBeveledBoxGeometry(0.078, 0.165, 0.28, 0.014, 3),
    mats.polymerGripMat
  );
  stockBody.position.set(0, -0.02, -0.32);
  npcWeaponGroup.add(stockBody);

  // Forged Upper & Lower Receiver with Magazine Well & Brass Deflector
  const receiverMesh = new THREE.Mesh(
    createBeveledBoxGeometry(0.092, 0.16, 0.42, 0.012, 3),
    mats.parkerizedSteelMat
  );
  receiverMesh.position.set(0, 0.02, 0);
  npcWeaponGroup.add(receiverMesh);

  // Ribbed 30-Round STANAG Magazine
  const magMesh = new THREE.Mesh(
    createBeveledBoxGeometry(0.064, 0.26, 0.112, 0.01, 2),
    mats.bluedSteelMat
  );
  magMesh.position.set(0, -0.16, 0.08);
  magMesh.rotation.x = 0.22;
  npcWeaponGroup.add(magMesh);

  // Free-Float M-LOK Octagonal Handguard with Picatinny Top Rail
  const handguard = new THREE.Mesh(
    createBeveledBoxGeometry(0.086, 0.112, 0.44, 0.014, 3),
    mats.bluedSteelMat
  );
  handguard.position.set(0, 0.035, 0.39);
  npcWeaponGroup.add(handguard);

  // Vertical Foregrip on Handguard
  const foregrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.02, 0.13, 14),
    mats.polymerGripMat
  );
  foregrip.position.set(0, -0.07, 0.36);
  npcWeaponGroup.add(foregrip);

  // Sculpted Gloved Hands with Carbon-Fiber Knuckle Guards gripping Pistol Grip & Foregrip
  const gloveGeo = createBeveledBoxGeometry(0.112, 0.11, 0.12, 0.025, 3);
  const rightGlove = new THREE.Mesh(gloveGeo, mats.leatherGloveMat);
  rightGlove.position.set(0.02, -0.08, -0.06);
  npcWeaponGroup.add(rightGlove);

  const leftGlove = new THREE.Mesh(gloveGeo, mats.leatherGloveMat);
  leftGlove.position.set(-0.02, -0.05, 0.36);
  npcWeaponGroup.add(leftGlove);

  // Lathe-turned Heavy Barrel, Gas Block, Front Sight Post (A2 Triangle) & Birdcage Flash Hider
  const barrelPoints = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.024, 0.0),
    new THREE.Vector2(0.024, 0.29),
    new THREE.Vector2(0.032, 0.3),
    new THREE.Vector2(0.032, 0.42),
    new THREE.Vector2(0.016, 0.42),
    new THREE.Vector2(0.016, 0.34),
  ];
  const barrelLatheGeo = new THREE.LatheGeometry(barrelPoints, 24);
  const npcBarrel = new THREE.Mesh(barrelLatheGeo, mats.bluedSteelMat);
  npcBarrel.rotation.x = Math.PI / 2;
  npcBarrel.position.set(0, 0.04, 0.57);
  npcWeaponGroup.add(npcBarrel);

  // A2 Triangle Front Sight Post
  const frontSightA2 = new THREE.Mesh(
    createBeveledBoxGeometry(0.032, 0.095, 0.07, 0.005, 2),
    mats.parkerizedSteelMat
  );
  frontSightA2.position.set(0, 0.1, 0.68);
  frontSightA2.rotation.x = -0.18;
  npcWeaponGroup.add(frontSightA2);

  // Aimpoint / EOTech Optic on Receiver Rail
  const holoHood = new THREE.Mesh(
    createBeveledBoxGeometry(0.076, 0.088, 0.13, 0.008, 2),
    mats.bluedSteelMat
  );
  holoHood.position.set(0, 0.138, 0.04);
  npcWeaponGroup.add(holoHood);

  // Multi-Fin 3D Star Muzzle Flash Assembly (Only flashes when NPC executes player)
  const npcMuzzleFlashGroup = new THREE.Group();
  npcMuzzleFlashGroup.position.set(0, 0.04, 1.05);
  npcWeaponGroup.add(npcMuzzleFlashGroup);

  const npcMuzzleFlashMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const flashCore = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.85, 12), npcMuzzleFlashMat);
  flashCore.rotation.x = Math.PI / 2;
  npcMuzzleFlashGroup.add(flashCore);

  [0, Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4].forEach((rot) => {
    const fin = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.42), npcMuzzleFlashMat);
    fin.rotation.y = Math.PI / 2;
    fin.rotation.x = rot;
    npcMuzzleFlashGroup.add(fin);
  });

  return {
    npcRoot,
    npcUpperBody,
    headGroup,
    npcWeaponGroup,
    npcMuzzleFlashMat,
  };
}

/**
 * Builds the Counter-Strike 2 Style First-Person Tactical Pistol (USP-S / Glock CS2 Viewmodel)
 * with Chamfered CNC Slide, Tritium 3-Dot Iron Sights, Open Ejection Port, Tactical Gloves & Watch
 */
export function buildFirstPersonWeapon(mats: TacticalMaterialLibrary) {
  const fpRoot = new THREE.Group();
  // Authentic CS2 viewmodel offset (right-handed classic position)
  const fpBasePos = new THREE.Vector3(0.29, -0.27, -0.58);
  fpRoot.position.copy(fpBasePos);

  // 1. Polymer Tactical Frame with Picatinny Rail Slots, Trigger Guard & Stippled Grip
  const lowerFrame = new THREE.Mesh(
    createBeveledBoxGeometry(0.064, 0.048, 0.4, 0.008, 3),
    mats.polymerGripMat
  );
  lowerFrame.position.set(0, 0.006, 0.02);
  fpRoot.add(lowerFrame);

  // Picatinny cross-slots under the dust cover
  const railSlotGeo = new THREE.BoxGeometry(0.066, 0.012, 0.016);
  [-0.14, -0.1, -0.06, -0.02].forEach((zPos) => {
    const slot = new THREE.Mesh(railSlotGeo, mats.bluedSteelMat);
    slot.position.set(0, -0.018, zPos);
    fpRoot.add(slot);
  });

  // Ergonomic Contoured Grip with Stippled Panels & Beaver-tail Tang
  const pistolGrip = new THREE.Mesh(
    createBeveledBoxGeometry(0.062, 0.215, 0.108, 0.015, 3),
    mats.polymerGripMat
  );
  pistolGrip.rotation.x = 0.27;
  pistolGrip.position.set(0, -0.096, 0.155);
  fpRoot.add(pistolGrip);

  // Beaver-tail frame tang
  const beaverTail = new THREE.Mesh(
    createBeveledBoxGeometry(0.058, 0.028, 0.075, 0.008, 2),
    mats.polymerGripMat
  );
  beaverTail.rotation.x = -0.18;
  beaverTail.position.set(0, 0.018, 0.215);
  fpRoot.add(beaverTail);

  // Flared Competition Magwell & Extended Basepad
  const magwell = new THREE.Mesh(
    createBeveledBoxGeometry(0.074, 0.028, 0.122, 0.008, 2),
    mats.brushedSteelMat
  );
  magwell.rotation.x = 0.27;
  magwell.position.set(0, -0.192, 0.182);
  fpRoot.add(magwell);

  // Undercut Trigger Guard & Flat-Faced Match Trigger
  const triggerGuard = new THREE.Mesh(
    createBeveledBoxGeometry(0.026, 0.062, 0.112, 0.006, 2),
    mats.polymerGripMat
  );
  triggerGuard.position.set(0, -0.038, 0.05);
  fpRoot.add(triggerGuard);

  const triggerShoe = new THREE.Mesh(
    createBeveledBoxGeometry(0.014, 0.044, 0.018, 0.003, 2),
    mats.brushedSteelMat
  );
  triggerShoe.rotation.x = 0.28;
  triggerShoe.position.set(0, -0.026, 0.065);
  fpRoot.add(triggerShoe);

  // Slide Stop Lever & Magazine Catch on Left Side of Frame
  const slideStop = new THREE.Mesh(
    createBeveledBoxGeometry(0.012, 0.018, 0.065, 0.003, 2),
    mats.brushedSteelMat
  );
  slideStop.position.set(-0.035, 0.018, 0.09);
  fpRoot.add(slideStop);

  // Compact Underbarrel Tactical Light (Streamlight TLR / SureFire style)
  const tacLightBody = new THREE.Mesh(
    createBeveledBoxGeometry(0.058, 0.044, 0.145, 0.009, 3),
    mats.parkerizedSteelMat
  );
  tacLightBody.position.set(0, -0.032, -0.11);
  fpRoot.add(tacLightBody);

  const tacLightBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.021, 0.019, 0.038, 18),
    mats.brushedSteelMat
  );
  tacLightBezel.rotation.x = Math.PI / 2;
  tacLightBezel.position.set(0, -0.032, -0.195);
  fpRoot.add(tacLightBezel);

  // 2. Stationary Polished Match Barrel, Chamber Hood & CS2-Style Threaded Suppressor/Compensator
  const barrelChamber = new THREE.Mesh(
    createBeveledBoxGeometry(0.046, 0.048, 0.105, 0.005, 2),
    mats.chromeBarrelMat
  );
  barrelChamber.position.set(0, 0.054, 0.045);
  fpRoot.add(barrelChamber);

  const matchBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.45, 20),
    mats.chromeBarrelMat
  );
  matchBarrel.rotation.x = Math.PI / 2;
  matchBarrel.position.set(0, 0.048, -0.04);
  fpRoot.add(matchBarrel);

  // Machined Tactical Muzzle Brake / Thread Protector (LatheGeometry)
  const compProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.028, 0.0),
    new THREE.Vector2(0.031, 0.015),
    new THREE.Vector2(0.031, 0.075),
    new THREE.Vector2(0.026, 0.085),
    new THREE.Vector2(0.012, 0.085),
    new THREE.Vector2(0.012, 0.04),
  ];
  const compGeo = new THREE.LatheGeometry(compProfile, 20);
  const compensator = new THREE.Mesh(compGeo, mats.bluedSteelMat);
  compensator.rotation.x = -Math.PI / 2;
  compensator.position.set(0, 0.048, -0.195);
  fpRoot.add(compensator);

  // 3. Reciprocating CS2 Chamfered CNC Slide Assembly + Authentic Tritium 3-Dot Iron Sights
  const fpSlideGroup = new THREE.Group();
  fpRoot.add(fpSlideGroup);

  // Rear portion of slide (behind ejection port)
  const slideRear = new THREE.Mesh(
    createChamferedSlideGeometry(0.068, 0.068, 0.14),
    mats.bluedSteelMat
  );
  slideRear.position.set(0, 0.048, 0.155);
  fpSlideGroup.add(slideRear);

  // Front portion of slide (ahead of ejection port)
  const slideFront = new THREE.Mesh(
    createChamferedSlideGeometry(0.068, 0.068, 0.18),
    mats.bluedSteelMat
  );
  slideFront.position.set(0, 0.048, -0.095);
  fpSlideGroup.add(slideFront);

  // Left bridge wall of slide (leaving right-top open for realistic Ejection Port!)
  const slideBridgeLeft = new THREE.Mesh(
    createBeveledBoxGeometry(0.022, 0.064, 0.115, 0.004, 2),
    mats.bluedSteelMat
  );
  slideBridgeLeft.position.set(-0.023, 0.046, 0.045);
  fpSlideGroup.add(slideBridgeLeft);

  // Angled Slide Cocking Serrations
  const serrationGeo = new THREE.BoxGeometry(0.071, 0.046, 0.006);
  [-0.14, -0.125, -0.11, -0.095, 0.125, 0.14, 0.155, 0.17, 0.185].forEach((zOff) => {
    const rib = new THREE.Mesh(serrationGeo, mats.parkerizedSteelMat);
    rib.rotation.x = -0.18;
    rib.position.set(0, 0.044, zOff);
    fpSlideGroup.add(rib);
  });

  // CS2-Style Tritium 3-Dot Combat Iron Sights (Rear Notch + Front Post)
  // Rear Sight Left & Right Posts with Dual Green Tritium Dots
  [-0.017, 0.017].forEach((xOff) => {
    const rearPost = new THREE.Mesh(
      createBeveledBoxGeometry(0.018, 0.022, 0.028, 0.003, 2),
      mats.parkerizedSteelMat
    );
    rearPost.position.set(xOff, 0.09, 0.205);
    fpSlideGroup.add(rearPost);

    const rearTritiumDot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0032, 0.0032, 0.004, 12),
      mats.tritiumGlowMat
    );
    rearTritiumDot.rotation.x = Math.PI / 2;
    rearTritiumDot.position.set(xOff, 0.092, 0.219);
    fpSlideGroup.add(rearTritiumDot);
  });

  // Front Sight Blade with Bright Center Green Tritium Dot
  const frontBlade = new THREE.Mesh(
    createBeveledBoxGeometry(0.012, 0.024, 0.028, 0.002, 2),
    mats.parkerizedSteelMat
  );
  frontBlade.position.set(0, 0.091, -0.165);
  fpSlideGroup.add(frontBlade);

  const frontTritiumDot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0038, 0.0038, 0.004, 12),
    mats.tritiumGlowMat
  );
  frontTritiumDot.rotation.x = Math.PI / 2;
  frontTritiumDot.position.set(0, 0.094, -0.15);
  fpSlideGroup.add(frontTritiumDot);

  // 4. CS2 Specialist Tactical Gloves, Articulated Fingers, Forearm Sleeves & Chronograph Watch
  // Right Hand Palm & Carbon-Fiber Knuckle Guard
  const rightHandPalm = new THREE.Mesh(
    createBeveledBoxGeometry(0.084, 0.135, 0.115, 0.022, 3),
    mats.leatherGloveMat
  );
  rightHandPalm.rotation.x = 0.27;
  rightHandPalm.position.set(0.016, -0.09, 0.172);
  fpRoot.add(rightHandPalm);

  const knucklePlate = new THREE.Mesh(
    createBeveledBoxGeometry(0.032, 0.095, 0.045, 0.008, 2),
    mats.carbonFiberMat
  );
  knucklePlate.rotation.x = 0.27;
  knucklePlate.position.set(0.052, -0.08, 0.145);
  fpRoot.add(knucklePlate);

  // Right Index Trigger Finger extending into Trigger Guard
  const indexFingerProximal = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.012, 0.055, 8, 12),
    mats.leatherGloveMat
  );
  indexFingerProximal.rotation.x = Math.PI / 2 + 0.12;
  indexFingerProximal.rotation.y = -0.22;
  indexFingerProximal.position.set(0.034, -0.022, 0.115);
  fpRoot.add(indexFingerProximal);

  const indexFingerTip = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.011, 0.04, 8, 12),
    mats.leatherGloveMat
  );
  indexFingerTip.rotation.z = Math.PI / 2;
  indexFingerTip.position.set(0.014, -0.026, 0.072);
  fpRoot.add(indexFingerTip);

  // Remaining 3 Fingers wrapped around front of grip
  const fingerGeo = new THREE.CapsuleGeometry(0.014, 0.062, 8, 12);
  [-0.055, -0.088, -0.122].forEach((yOff, idx) => {
    const finger = new THREE.Mesh(fingerGeo, mats.leatherGloveMat);
    finger.rotation.z = Math.PI / 2;
    finger.position.set(0, yOff, 0.1 + idx * 0.012);
    fpRoot.add(finger);
  });

  // Left Support Hand Thumbs-Forward C-Clamp Grip & Forearm Sleeve
  const leftSupportHand = new THREE.Mesh(
    createBeveledBoxGeometry(0.082, 0.125, 0.128, 0.022, 3),
    mats.leatherGloveMat
  );
  leftSupportHand.rotation.x = 0.24;
  leftSupportHand.position.set(-0.028, -0.092, 0.13);
  fpRoot.add(leftSupportHand);

  const leftThumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.014, 0.068, 8, 12),
    mats.leatherGloveMat
  );
  leftThumb.rotation.x = Math.PI / 2 - 0.15;
  leftThumb.position.set(-0.042, 0.008, 0.065);
  fpRoot.add(leftThumb);

  const leftForearmSleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.06, 0.3, 10, 16),
    mats.uniformFabricMat
  );
  leftForearmSleeve.rotation.x = 1.12;
  leftForearmSleeve.rotation.z = -0.36;
  leftForearmSleeve.position.set(-0.125, -0.195, 0.31);
  fpRoot.add(leftForearmSleeve);

  const rightForearmSleeve = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.062, 0.3, 10, 16),
    mats.uniformFabricMat
  );
  rightForearmSleeve.rotation.x = 1.18;
  rightForearmSleeve.rotation.z = 0.22;
  rightForearmSleeve.position.set(0.085, -0.2, 0.34);
  fpRoot.add(rightForearmSleeve);

  // Detailed Tactical Dive Watch on Left Wrist
  const watchGroup = new THREE.Group();
  watchGroup.position.set(-0.068, -0.12, 0.22);
  watchGroup.rotation.set(0.35, 0.2, 0.42);
  fpRoot.add(watchGroup);

  const watchCase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.029, 0.029, 0.015, 20),
    mats.brushedSteelMat
  );
  watchGroup.add(watchCase);

  const watchDial = new THREE.Mesh(
    new THREE.CircleGeometry(0.023, 20),
    new THREE.MeshBasicMaterial({ color: 0x091914 })
  );
  watchDial.rotation.x = -Math.PI / 2;
  watchDial.position.y = 0.008;
  watchGroup.add(watchDial);

  // 5. Multi-Plane 3D Muzzle Flash for Player's Weapon
  const playerMuzzleFlashGroup = new THREE.Group();
  playerMuzzleFlashGroup.position.set(0, 0.048, -0.32);
  fpRoot.add(playerMuzzleFlashGroup);

  const playerMuzzleMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const pFlashCone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 10), playerMuzzleMat);
  pFlashCone.rotation.x = -Math.PI / 2;
  playerMuzzleFlashGroup.add(pFlashCone);

  [0, Math.PI / 3, (Math.PI * 2) / 3].forEach((rot) => {
    const pFin = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.16), playerMuzzleMat);
    pFin.rotation.y = Math.PI / 2;
    pFin.rotation.x = rot;
    playerMuzzleFlashGroup.add(pFin);
  });

  return {
    fpRoot,
    fpBasePos,
    fpSlideGroup,
    playerMuzzleMat,
  };
}

/**
 * Builds an Articulated Ballistic Target Stand with Hydraulic Damper, Springs, and Chamfered Armor Plate
 */
export function buildBallisticTargetStand(
  xPos: number,
  label: 'CERTO' | 'ERRADO',
  normalTex: THREE.CanvasTexture,
  mats: TacticalMaterialLibrary,
  isSoftwareGl: boolean
) {
  const standGroup = new THREE.Group();
  standGroup.position.set(xPos, 0, -4.65);

  const basePlate = new THREE.Mesh(
    createBeveledBoxGeometry(1.18, 0.14, 1.08, 0.02, 3),
    mats.bluedSteelMat
  );
  basePlate.position.y = 0.07;
  basePlate.castShadow = !isSoftwareGl;
  basePlate.receiveShadow = true;
  standGroup.add(basePlate);

  const baseHazard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.12, 0.12),
    mats.hazardStripeMat
  );
  baseHazard.position.set(0, 0.07, 0.545);
  standGroup.add(baseHazard);

  [-0.28, 0.28].forEach((xOff) => {
    const stanchion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.07, 1.38, 18),
      mats.brushedSteelMat
    );
    stanchion.position.set(xOff, 0.76, 0);
    stanchion.castShadow = !isSoftwareGl;
    standGroup.add(stanchion);
  });

  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 1.25, 14),
    mats.chromeBarrelMat
  );
  piston.position.set(0, 0.72, -0.08);
  standGroup.add(piston);

  for (let i = 0; i < 6; i++) {
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.064, 0.015, 8, 20),
      mats.bluedSteelMat
    );
    coil.rotation.x = Math.PI / 2 + 0.12;
    coil.position.set(0, 0.85 + i * 0.07, -0.08);
    standGroup.add(coil);
  }

  const axleBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.94, 18),
    mats.chromeBarrelMat
  );
  axleBar.rotation.z = Math.PI / 2;
  axleBar.position.set(0, 1.42, 0);
  standGroup.add(axleBar);

  const platePivot = new THREE.Group();
  platePivot.position.set(0, 1.42, 0);
  standGroup.add(platePivot);

  const steelBacking = new THREE.Mesh(
    createBeveledBoxGeometry(1.78, 1.78, 0.12, 0.025, 3),
    mats.bluedSteelMat
  );
  steelBacking.position.y = 0.48;
  steelBacking.castShadow = !isSoftwareGl;
  steelBacking.userData = { targetType: label };
  platePivot.add(steelBacking);

  const ledColor = label === 'CERTO' ? 0x10b981 : 0xef4444;
  const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
  [-0.91, 0.91].forEach((lx) => {
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 1.55, 0.04), ledMat);
    ledStrip.position.set(lx, 0.48, 0.03);
    platePivot.add(ledStrip);
  });

  const faceMat = new THREE.MeshStandardMaterial({
    map: normalTex,
    roughness: 0.3,
    metalness: 0.2,
    emissive: label === 'CERTO' ? new THREE.Color(0x064e3b) : new THREE.Color(0x450a0a),
    emissiveIntensity: 0.38,
  });

  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 1.64), faceMat);
  faceMesh.position.set(0, 0.48, 0.065);
  faceMesh.userData = { targetType: label };
  platePivot.add(faceMesh);

  return { standGroup, platePivot, faceMat, faceMesh, steelBacking };
}
