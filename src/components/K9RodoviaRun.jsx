import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Play, RefreshCw, X, Heart, Shield, Sparkles } from 'lucide-react';
import { useConfetti } from '../hooks/useConfetti';

export default function K9RodoviaRun({
  onGameOver,
  onClose,
  petSkin = 'caramel'
}) {
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('k9_minigame_high') || '0', 10);
  });
  const [lives, setLives] = useState(3);

  // Posição vertical do K9
  const [k9Y, setK9Y] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const k9Ref = useRef({ y: 0, velocity: 0 });

  // Obstáculos e Moedas no caminho
  const [obstacles, setObstacles] = useState([]);
  const [items, setItems] = useState([]);

  const animFrameRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const speedRef = useRef(5);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const obstaclesRef = useRef([]);
  const itemsRef = useRef([]);
  const hasReportedGameOverRef = useRef(false);

  const { setTriggerConfetti } = useConfetti();

  // Ação de Pular
  const jump = useCallback(() => {
    if (gameState !== 'playing') return;
    if (k9Ref.current.y <= 5) {
      k9Ref.current.velocity = 15;
      setIsJumping(true);
    }
  }, [gameState]);

  const startGame = () => {
    hasReportedGameOverRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 3;
    obstaclesRef.current = [];
    itemsRef.current = [];
    setGameState('playing');
    setScore(0);
    setCoinsCollected(0);
    setLives(3);
    setObstacles([]);
    setItems([]);
    k9Ref.current = { y: 0, velocity: 0 };
    setK9Y(0);
    speedRef.current = 5.5;
    lastSpawnRef.current = Date.now();
  };

  // Loop Principal do Jogo
  useEffect(() => {
    if (gameState !== 'playing') return;

    let isMounted = true;
    const gravity = 0.85;

    const gameLoop = () => {
      if (!isMounted) return;

      // 1. Física do Salto do K9
      k9Ref.current.y += k9Ref.current.velocity;
      k9Ref.current.velocity -= gravity;
      if (k9Ref.current.y <= 0) {
        k9Ref.current.y = 0;
        k9Ref.current.velocity = 0;
        setIsJumping(false);
      }
      setK9Y(k9Ref.current.y);

      // 2. Pontuação progressiva
      scoreRef.current += 1;
      setScore(scoreRef.current);

      // Aumento gradual de velocidade a cada 400 pts
      speedRef.current = Math.min(11, 5.5 + Math.floor(scoreRef.current / 400) * 0.8);

      const now = Date.now();

      // 3. Spawner de Obstáculos (Cones de Blitz)
      if (now - lastSpawnRef.current > 1200 + Math.random() * 1000) {
        lastSpawnRef.current = now;
        const newObs = {
          id: Math.random(),
          x: 600,
          type: Math.random() > 0.4 ? 'cone' : 'radar'
        };
        obstaclesRef.current = [...obstaclesRef.current, newObs];

        // Spawner de Moedas / Ossos
        if (Math.random() > 0.3) {
          itemsRef.current = [
            ...itemsRef.current,
            {
              id: Math.random(),
              x: 600 + (Math.random() > 0.5 ? 80 : 0),
              y: Math.random() > 0.5 ? 70 : 20, // no chão ou no ar
              type: Math.random() > 0.3 ? 'coin' : 'bone'
            }
          ];
        }
      }

      // 4. Mover obstáculos e checar colisão
      const nextObs = [];
      let lostLives = 0;
      for (const obs of obstaclesRef.current) {
        const newX = obs.x - speedRef.current;

        // Checagem de colisão com o K9 (K9 fica em x = 80 a 140)
        if (newX > 70 && newX < 125 && k9Ref.current.y < 45) {
          lostLives += 1;
          continue;
        }

        if (newX > -50) {
          nextObs.push({ ...obs, x: newX });
        }
      }
      obstaclesRef.current = nextObs;
      setObstacles(nextObs);

      if (lostLives > 0) {
        livesRef.current = Math.max(0, livesRef.current - lostLives);
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          setGameState('gameover');
          return;
        }
      }

      // 5. Mover e coletar itens
      const nextItems = [];
      let addedCoins = 0;
      let bonusScore = 0;
      for (const it of itemsRef.current) {
        const newX = it.x - speedRef.current;

        if (newX > 70 && newX < 135) {
          const distY = Math.abs(k9Ref.current.y - it.y);
          if (distY < 45) {
            if (it.type === 'coin') {
              addedCoins += 1;
              bonusScore += 50;
            } else {
              bonusScore += 100;
            }
            continue;
          }
        }

        if (newX > -50) {
          nextItems.push({ ...it, x: newX });
        }
      }
      itemsRef.current = nextItems;
      setItems(nextItems);

      if (addedCoins > 0) {
        setCoinsCollected(c => c + addedCoins);
      }
      if (bonusScore > 0) {
        scoreRef.current += bonusScore;
        setScore(scoreRef.current);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  // Checa e salva recorde ao morrer
  useEffect(() => {
    if (gameState === 'gameover' && !hasReportedGameOverRef.current) {
      hasReportedGameOverRef.current = true;
      const isNewHigh = score > highScore;
      if (isNewHigh) {
        localStorage.setItem('k9_minigame_high', score.toString());
      }
      const timer = setTimeout(() => {
        if (isNewHigh) {
          setHighScore(score);
          setTriggerConfetti(true);
        }
        if (onGameOver) {
          onGameOver(score, coinsCollected);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [gameState, score, highScore, coinsCollected, onGameOver, setTriggerConfetti]);

  // Controles de teclado (Barra de espaço / Seta para cima)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  return (
    <div 
      onClick={jump}
      className="relative w-full max-w-2xl mx-auto h-[380px] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl overflow-hidden border-4 border-blue-500/30 shadow-2xl flex flex-col justify-between cursor-pointer select-none"
    >
      {/* Botão Fechar */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-40 p-2 bg-slate-800/80 hover:bg-red-600/80 text-white rounded-xl backdrop-blur-md transition-all cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* HUD Superior (Vidas, Placar, Moedas) */}
      <div className="relative z-30 p-4 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart 
              key={i} 
              className={`w-6 h-6 transition-all ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} 
            />
          ))}
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700">
          <div className="flex items-center gap-1.5 text-yellow-400 font-black text-sm">
            <Coins className="w-4 h-4" />
            <span>+{coinsCollected}</span>
          </div>
          <div className="text-white font-mono font-black text-base">
            {score.toString().padStart(5, '0')}
          </div>
        </div>
      </div>

      {/* Cenário da Rodovia em Movimento */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Céu noturno com estrelas */}
        <div className="absolute top-4 left-10 text-slate-700 text-xs">✨</div>
        <div className="absolute top-8 left-1/3 text-slate-700 text-xs">⭐</div>
        <div className="absolute top-6 right-20 text-slate-700 text-xs">✨</div>

        {/* Linha do horizonte da rodovia */}
        <div className="absolute bottom-16 left-0 right-0 h-1 bg-slate-800/60" />

        {/* K9 Correndo / Pulando */}
        <div 
          style={{ 
            transform: `translateY(${-k9Y}px)`,
            bottom: '48px',
            left: '80px'
          }}
          className="absolute z-20 transition-transform"
        >
          {/* Mascote K9 em miniatura */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className={`w-12 h-12 rounded-full ${petSkin === 'tactical_black' ? 'bg-zinc-800' : petSkin === 'golden' ? 'bg-amber-400' : 'bg-amber-600'} border-2 border-white/20 shadow-lg flex items-center justify-center relative overflow-hidden`}>
              {/* Orelhas */}
              <div className="absolute -top-1 left-1.5 w-3 h-5 bg-amber-800 rounded-full rotate-[-20deg]" />
              <div className="absolute -top-1 right-1.5 w-3 h-5 bg-amber-800 rounded-full rotate-[20deg]" />
              {/* Olhos K9 */}
              <div className="flex gap-2">
                <div className="w-2.5 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
                <div className="w-2.5 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
              </div>
              {/* Colete azul refletivo */}
              <div className="absolute bottom-0 inset-x-0 h-3 bg-blue-600 flex items-center justify-center">
                <span className="text-[6px] text-white font-black">PRF</span>
              </div>
            </div>

            {/* Poeirinha de corrida no chão quando não está pulando */}
            {!isJumping && gameState === 'playing' && (
              <motion.div 
                animate={{ opacity: [0.6, 0], scale: [0.8, 1.4], x: [-5, -15] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="absolute -bottom-1 left-1 text-slate-500 text-[10px]"
              >
                💨
              </motion.div>
            )}
          </div>
        </div>

        {/* Obstáculos (Cones & Radares) */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            style={{ left: `${obs.x}px`, bottom: '48px' }}
            className="absolute z-10 w-9 h-11 flex items-end justify-center"
          >
            {obs.type === 'cone' ? (
              // Cone de trânsito alaranjado
              <div className="relative flex flex-col items-center">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[34px] border-b-orange-500 relative">
                  <div className="absolute top-2 -left-[7px] w-[14px] h-[5px] bg-white opacity-90" />
                  <div className="absolute top-5 -left-[10px] w-[20px] h-[5px] bg-white opacity-90" />
                </div>
                <div className="w-8 h-2 bg-orange-600 rounded-sm -mt-0.5" />
              </div>
            ) : (
              // Radar fixo de velocidade
              <div className="relative flex flex-col items-center">
                <div className="w-6 h-8 bg-slate-800 border-2 border-slate-600 rounded-md flex flex-col items-center justify-around p-1 shadow-md">
                  <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                  <div className="w-3 h-1.5 bg-slate-400 rounded-sm" />
                </div>
                <div className="w-1.5 h-4 bg-slate-600" />
              </div>
            )}
          </div>
        ))}

        {/* Itens Coletáveis (Moedas / Ossos) */}
        {items.map(it => (
          <div
            key={it.id}
            style={{ left: `${it.x}px`, bottom: `${48 + it.y}px` }}
            className="absolute z-10 flex items-center justify-center animate-bounce"
          >
            {it.type === 'coin' ? (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 border-2 border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.5)] flex items-center justify-center font-black text-amber-900 text-xs">
                🪙
              </div>
            ) : (
              <div className="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                🦴
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Asfalto da Rodovia com faixas brancas animadas */}
      <div className="relative h-12 bg-slate-950 border-t-4 border-slate-800 flex items-center overflow-hidden">
        <motion.div 
          animate={{ x: [0, -100] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 w-[1200px]"
        >
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-14 h-2 bg-yellow-400/90 rounded-full shrink-0" />
          ))}
        </motion.div>
      </div>

      {/* Tela de Início / Instrução */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <span className="text-3xl">🐕</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
            K9 Rodovia Run
          </h2>
          <p className="text-slate-400 text-xs font-bold max-w-sm mb-6">
            Pule os cones e radares da blitz para manter a rodovia segura! Colete moedas e ossos para o seu mascote.
          </p>

          <button
            onClick={(e) => { e.stopPropagation(); startGame(); }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer uppercase text-sm tracking-wider"
          >
            <Play className="w-5 h-5 fill-current" /> Começar Missão
          </button>
          <span className="text-[10px] text-slate-500 mt-4 uppercase font-bold">
            Clique na tela ou aperte ESPAÇO para pular
          </span>
        </div>
      )}

      {/* Tela de Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-black text-red-500 uppercase tracking-wider mb-2">
            Missão Finalizada!
          </h2>
          <p className="text-slate-400 text-xs font-bold mb-6">
            O K9 descansou após o patrulhamento.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs w-full mb-6">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase">Pontos</span>
              <p className="text-2xl font-black text-white">{score}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-black text-yellow-500 uppercase flex items-center justify-center gap-1">
                <Coins className="w-3 h-3" /> Moedas
              </span>
              <p className="text-2xl font-black text-yellow-400">+{coinsCollected}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); startGame(); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer uppercase text-xs"
            >
              <RefreshCw className="w-4 h-4" /> Jogar Novamente
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black px-6 py-3 rounded-2xl border border-slate-700 transition-all uppercase text-xs"
            >
              Voltar ao K9
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
