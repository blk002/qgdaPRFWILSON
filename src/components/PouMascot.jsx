import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Shield, Star, Moon } from 'lucide-react';
import { PET_ACCESSORIES } from '../data/petConstants';

export default function PouMascot({
  petData,
  onPetClick,
  actionState = 'idle', // 'idle' | 'eating' | 'washing' | 'sleeping' | 'happy'
  _onFeedDirect = null,
  isSleeping = false,
  className = ""
}) {
  const containerRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [hearts, setHearts] = useState([]);

  // Configuração visual de pele
  const currentSkinItem = PET_ACCESSORIES.find(a => a.id === `skin:${petData?.skin}`) || PET_ACCESSORIES.find(a => a.id === 'skin:caramel');
  const skinColor = currentSkinItem?.color || '#d99b61';
  const skinShade = currentSkinItem?.shade || '#b87a42';

  // Olhos seguindo o cursor do mouse
  useEffect(() => {
    if (isSleeping) return;

    let animationFrame;
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2 - 20;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const angle = Math.atan2(deltaY, deltaX);
        const dist = Math.min(6, Math.hypot(deltaX, deltaY) / 30);

        setPupilOffset({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isSleeping]);

  // Ciclo de piscar os olhos
  useEffect(() => {
    if (isSleeping) return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2500);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Carinho no Mascote
  const handleInteraction = (e) => {
    if (onPetClick) onPetClick(e);

    // Adiciona coração flutuante
    const initialX = (Math.random() - 0.5) * 80;
    const newHeart = {
      id: Date.now() + Math.random(),
      x: initialX,
      targetX: initialX + (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40
    };
    setHearts(prev => [...prev.slice(-6), newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1200);
  };

  const isHungry = (petData?.hunger || 100) < 35;
  const isDirty = (petData?.hygiene || 100) < 45;
  const isSad = (petData?.fun || 100) < 35;
  const activePupilOffset = isSleeping ? { x: 0, y: 0 } : pupilOffset;

  return (
    <div 
      ref={containerRef}
      onClick={handleInteraction}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform group ${className}`}
      title="Clique ou faça carinho no seu Mascote K9!"
    >
      {/* Sombra realista projetada no chão */}
      <motion.div 
        animate={{
          scale: isSleeping ? [1, 1.05, 1] : actionState === 'happy' ? [0.8, 1.2, 0.8] : [1, 1.03, 1],
          opacity: [0.35, 0.45, 0.35]
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-2 w-48 h-8 bg-black/40 dark:bg-black/60 rounded-full blur-md -z-10"
      />

      {/* Partículas flutuantes de carinho / Zzz / sabão */}
      <AnimatePresence>
        {hearts.map(h => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.5, x: h.x, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, x: h.targetX, y: -90 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute pointer-events-none text-red-500 z-30"
          >
            <Heart className="w-6 h-6 fill-current drop-shadow-md" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Animação Zzz se estiver dormindo */}
      {isSleeping && (
        <div className="absolute -top-10 right-8 z-30 pointer-events-none">
          <motion.div
            animate={{ y: [-10, -40], x: [0, 15], opacity: [0, 1, 0], scale: [0.8, 1.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            className="text-blue-400 font-black text-xl flex items-center gap-1 drop-shadow"
          >
            <span className="font-mono">Z</span>
            <span className="font-mono text-sm">z</span>
            <span className="font-mono text-xs">z</span>
          </motion.div>
        </div>
      )}

      {/* Aura de foco / Alto Rendimento se o dono estudou hoje */}
      {(petData?.level || 1) >= 3 && !isSleeping && (
        <motion.div 
          animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl -z-10"
        />
      )}

      {/* CORPO DO MASCOTE (Formato Clássico do Pou arredondado) */}
      <motion.div
        animate={{
          y: isSleeping ? [0, 3, 0] : actionState === 'happy' ? [0, -18, 0] : [0, -4, 0],
          scaleY: isSleeping ? [1, 0.98, 1] : actionState === 'eating' ? [1, 1.05, 0.96, 1] : [1, 1.01, 1],
          scaleX: isSleeping ? [1, 1.02, 1] : [1, 0.99, 1]
        }}
        transition={{
          duration: actionState === 'happy' ? 0.45 : isSleeping ? 2.8 : 2.2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        whileTap={{ scale: 0.92, scaleY: 0.88 }}
        className="relative w-56 h-56 flex items-center justify-center"
      >
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] overflow-visible"
        >
          <defs>
            {/* Gradiente 3D suave do corpo */}
            <radialGradient id="pouBodyGrad" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor={skinColor} />
              <stop offset="85%" stopColor={skinShade} />
              <stop offset="100%" stopColor="#1a1008" stopOpacity="0.8" />
            </radialGradient>

            {/* Brilho ocular */}
            <linearGradient id="eyeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            {/* Sombra sob os olhos */}
            <filter id="eyeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* O Formato Famoso do Pou: Gota/Triângulo arredondado com física orgânica */}
          <path
            d="M 100,28 
               C 150,28 178,75 180,122 
               C 182,168 156,188 100,188 
               C 44,188 18,168 20,122 
               C 22,75 50,28 100,28 Z"
            fill="url(#pouBodyGrad)"
            stroke={skinShade}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Bochechinhas rosadas fofas */}
          <ellipse cx="50" cy="128" rx="11" ry="6" fill="#f43f5e" opacity={isSleeping ? 0.2 : 0.45} />
          <ellipse cx="150" cy="128" rx="11" ry="6" fill="#f43f5e" opacity={isSleeping ? 0.2 : 0.45} />

          {/* Manchinhas de sujeira se a higiene estiver baixa */}
          {isDirty && (
            <g opacity="0.6">
              <path d="M 45,75 Q 52,70 56,77 Q 50,83 45,75 Z" fill="#78350f" />
              <path d="M 148,82 Q 155,78 158,85 Q 152,90 148,82 Z" fill="#78350f" />
              <circle cx="100" cy="165" r="5" fill="#78350f" />
            </g>
          )}

          {/* OLHO ESQUERDO */}
          <g filter="url(#eyeShadow)">
            {/* Esclera (Globo ocular) */}
            <ellipse 
              cx="72" 
              cy="85" 
              rx="24" 
              ry={isBlinking ? 2 : isSleeping ? 2 : 28} 
              fill={isBlinking || isSleeping ? skinShade : "url(#eyeGrad)"} 
              stroke={skinShade} 
              strokeWidth="2.5" 
            />

            {/* Conteúdo do olho (Pupila & Brilho) - some ao piscar/dormir */}
            {!isBlinking && !isSleeping && (
              <>
                {/* Pupila que segue o mouse */}
                <circle 
                  cx={72 + activePupilOffset.x} 
                  cy={85 + activePupilOffset.y + (isHungry ? 3 : 0)} 
                  r={isHungry ? 7 : 10} 
                  fill="#09090b" 
                />
                {/* Reflexo de luz na pupila (dá vida e fofura!) */}
                <circle 
                  cx={75 + activePupilOffset.x} 
                  cy={81 + activePupilOffset.y} 
                  r="3.5" 
                  fill="#ffffff" 
                />
                <circle 
                  cx={68 + activePupilOffset.x} 
                  cy={88 + activePupilOffset.y} 
                  r="1.5" 
                  fill="#ffffff" 
                />
              </>
            )}

            {/* Pálpebra sonolenta ou olheira se estiver faminto/cansado */}
            {isHungry && !isSleeping && (
              <path d="M 49,95 Q 72,102 95,95" stroke="#713f12" strokeWidth="2.5" fill="none" opacity="0.6" />
            )}
          </g>

          {/* OLHO DIREITO */}
          <g filter="url(#eyeShadow)">
            <ellipse 
              cx="128" 
              cy="85" 
              rx="24" 
              ry={isBlinking ? 2 : isSleeping ? 2 : 28} 
              fill={isBlinking || isSleeping ? skinShade : "url(#eyeGrad)"} 
              stroke={skinShade} 
              strokeWidth="2.5" 
            />

            {!isBlinking && !isSleeping && (
              <>
                <circle 
                  cx={128 + activePupilOffset.x} 
                  cy={85 + activePupilOffset.y + (isHungry ? 3 : 0)} 
                  r={isHungry ? 7 : 10} 
                  fill="#09090b" 
                />
                <circle 
                  cx={131 + activePupilOffset.x} 
                  cy={81 + activePupilOffset.y} 
                  r="3.5" 
                  fill="#ffffff" 
                />
                <circle 
                  cx={124 + activePupilOffset.x} 
                  cy={88 + activePupilOffset.y} 
                  r="1.5" 
                  fill="#ffffff" 
                />
              </>
            )}

            {isHungry && !isSleeping && (
              <path d="M 105,95 Q 128,102 151,95" stroke="#713f12" strokeWidth="2.5" fill="none" opacity="0.6" />
            )}
          </g>

          {/* BOCA DINÂMICA */}
          {actionState === 'eating' ? (
            // Mastigando comida com a boca aberta
            <g>
              <ellipse cx="100" cy="138" rx="14" ry="12" fill="#881337" stroke="#4c0519" strokeWidth="2" />
              <path d="M 94,142 Q 100,147 106,142" stroke="#fda4af" strokeWidth="4" strokeLinecap="round" />
            </g>
          ) : isSleeping ? (
            // Boquinha relaxada de sono
            <ellipse cx="100" cy="135" rx="5" ry="3" fill="#522e15" opacity="0.7" />
          ) : isSad ? (
            // Tristonho
            <path d="M 86,142 Q 100,132 114,142" stroke="#3f2310" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          ) : actionState === 'happy' ? (
            // Sorrisão aberto muito feliz!
            <g>
              <path d="M 82,130 Q 100,158 118,130 Z" fill="#881337" stroke="#3f2310" strokeWidth="2.5" />
              <path d="M 90,143 Q 100,152 110,143" fill="#fb7185" />
            </g>
          ) : (
            // Sorrisinho clássico simpático do Pou
            <path 
              d="M 85,134 Q 100,148 115,134" 
              stroke="#3f2310" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              fill="none" 
            />
          )}

          {/* ROUPA / COLETE CUSTOMIZADO */}
          {petData?.outfit === 'vest_k9' && (
            <g id="vest_k9">
              {/* Colete Tático Preto K9 com faixa amarela PRF */}
              <path 
                d="M 52,142 Q 100,152 148,142 L 158,182 Q 100,192 42,182 Z" 
                fill="#18181b" 
                stroke="#27272a" 
                strokeWidth="2" 
              />
              <path d="M 50,152 Q 100,161 150,152" stroke="#eab308" strokeWidth="5" fill="none" />
              {/* Inscrição K9 PRF */}
              <text x="100" y="174" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" letterSpacing="1">
                K9 • PRF
              </text>
            </g>
          )}

          {petData?.outfit === 'police_uniform' && (
            <g id="police_uniform">
              {/* Camisa Azul Operacional com gravata/gola e distintivo */}
              <path 
                d="M 56,138 Q 100,150 144,138 L 156,182 Q 100,190 44,182 Z" 
                fill="#1e3a8a" 
                stroke="#172554" 
                strokeWidth="2" 
              />
              {/* Colarinho branco */}
              <polygon points="100,145 90,138 98,155" fill="#ffffff" />
              <polygon points="100,145 110,138 102,155" fill="#ffffff" />
              {/* Gravata preta */}
              <polygon points="98,155 102,155 104,175 100,180 96,175" fill="#0f172a" />
              {/* Distintivo de metal */}
              <circle cx="76" cy="160" r="5" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            </g>
          )}

          {petData?.outfit === 'camo_harness' && (
            <g id="camo_harness">
              {/* Peitoral camuflado tático */}
              <path d="M 55,140 L 145,140 L 152,180 L 48,180 Z" fill="#14532d" stroke="#166534" strokeWidth="2" />
              <line x1="100" y1="140" x2="100" y2="180" stroke="#16a34a" strokeWidth="3" />
              <circle cx="100" cy="160" r="6" fill="#334155" stroke="#64748b" strokeWidth="2" />
            </g>
          )}

          {petData?.outfit === 'hero_cape' && (
            <g id="hero_cape">
              {/* Capa Dourada da Aprovação */}
              <path d="M 40,135 Q 20,170 30,190 Q 60,185 65,150 Z" fill="#f59e0b" opacity="0.9" />
              <path d="M 160,135 Q 180,170 170,190 Q 140,185 135,150 Z" fill="#f59e0b" opacity="0.9" />
            </g>
          )}

          {/* CHAPÉU / ACESSÓRIO DE CABEÇA */}
          {petData?.hat === 'beret_prf' && (
            <g id="beret_prf">
              {/* Boina Preta Tática inclinada com brasão dourado */}
              <path 
                d="M 40,42 Q 100,-2 170,25 Q 180,48 140,55 Q 85,50 40,42 Z" 
                fill="#0f172a" 
                stroke="#1e293b" 
                strokeWidth="2.5" 
              />
              {/* Brasão dourado de metal na boina */}
              <polygon points="135,32 142,42 135,46 128,42" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            </g>
          )}

          {petData?.hat === 'cap_police' && (
            <g id="cap_police">
              {/* Boné Azul Marinho Operacional com aba curva */}
              <path d="M 55,42 Q 100,10 145,42 Z" fill="#1e3a8a" stroke="#172554" strokeWidth="2" />
              <path d="M 45,42 Q 100,48 158,40 Q 165,50 145,55 Q 95,54 45,42 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              <circle cx="100" cy="32" r="4" fill="#fbbf24" />
            </g>
          )}

          {petData?.hat === 'aviator_glasses' && (
            <g id="aviator_glasses">
              {/* Óculos Escuros Aviador Espelhados com reflexo de rodovia */}
              <path d="M 50,78 Q 72,74 92,78 Q 88,102 54,100 Z" fill="#09090b" stroke="#eab308" strokeWidth="2.5" />
              <path d="M 108,78 Q 128,74 150,78 Q 146,102 112,100 Z" fill="#09090b" stroke="#eab308" strokeWidth="2.5" />
              <line x1="92" y1="78" x2="108" y2="78" stroke="#eab308" strokeWidth="3" />
              {/* Reflexo de luz branco nas lentes */}
              <line x1="58" y1="84" x2="78" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="116" y1="84" x2="136" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>
          )}

          {petData?.hat === 'tactical_headset' && (
            <g id="tactical_headset">
              {/* Arco e abafadores laterais de tiro */}
              <path d="M 28,95 Q 100,-10 172,95" stroke="#334155" strokeWidth="7" fill="none" strokeLinecap="round" />
              <rect x="18" y="80" width="16" height="30" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <rect x="166" y="80" width="16" height="30" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              {/* Haste do microfone tático */}
              <path d="M 28,100 Q 45,130 75,132" stroke="#475569" strokeWidth="3" fill="none" />
              <circle cx="76" cy="132" r="3.5" fill="#0f172a" />
            </g>
          )}

          {petData?.hat === 'gold_crown' && (
            <g id="gold_crown">
              {/* Coroa Dourada de Inspetor Lenda */}
              <polygon points="65,40 75,15 90,32 100,10 110,32 125,15 135,40" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
              <circle cx="75" cy="15" r="3" fill="#ef4444" />
              <circle cx="100" cy="10" r="3.5" fill="#3b82f6" />
              <circle cx="125" cy="15" r="3" fill="#10b981" />
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
