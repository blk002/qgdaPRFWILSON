import React from 'react';

const RANK_IMAGES = {
  1: 'assets/gamification/rank_1_recruta.png',
  2: 'assets/gamification/rank_2_agente3.png',
  3: 'assets/gamification/rank_3_agente2.png',
  4: 'assets/gamification/rank_4_agente1.png',
  5: 'assets/gamification/rank_5_especial.png',
  6: 'assets/gamification/rank_6_inspetor.png',
  7: 'assets/gamification/rank_7_lenda.png',
};

const RANK_THEMES = {
  1: { glow: 'rgba(113, 128, 150, 0.25)', bg: 'from-slate-800/80 to-slate-900/90', border: 'border-slate-700/50' },
  2: { glow: 'rgba(59, 130, 246, 0.35)', bg: 'from-blue-950/80 to-slate-900/90', border: 'border-blue-500/40' },
  3: { glow: 'rgba(37, 99, 235, 0.45)', bg: 'from-indigo-950/80 to-slate-900/90', border: 'border-indigo-500/50' },
  4: { glow: 'rgba(251, 191, 36, 0.5)', bg: 'from-yellow-950/40 to-slate-900/90', border: 'border-yellow-500/50' },
  5: { glow: 'rgba(249, 115, 22, 0.6)', bg: 'from-orange-950/50 to-slate-900/90', border: 'border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.25)]' },
  6: { glow: 'rgba(239, 68, 68, 0.7)', bg: 'from-red-950/60 to-slate-900/90', border: 'border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.35)]' },
  7: { glow: 'rgba(168, 85, 247, 0.8)', bg: 'from-purple-950/70 to-slate-900/90', border: 'border-purple-500/80 shadow-[0_0_35px_rgba(168,85,247,0.45)]' }
};

export default function RankBadge({ level = 1, size = 64, className = '' }) {
  const lvl = Math.max(1, Math.min(7, level));
  
  // Caminho base para garantir que funcione tanto localmente quanto no GitHub Pages
  const basePath = import.meta.env.BASE_URL || '/';
  const imageUrl = `${basePath}${RANK_IMAGES[lvl]}`;
  const theme = RANK_THEMES[lvl] || RANK_THEMES[1];

  return (
    <div 
      className={`relative rounded-3xl p-1.5 flex items-center justify-center border bg-gradient-to-br transition-all duration-300 hover:scale-105 group overflow-hidden ${theme.bg} ${theme.border} ${className}`}
      style={{ 
        width: size, 
        height: size,
        boxShadow: `0 8px 32px 0 ${theme.glow}, inset 0 2px 4px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Reflexo de luz decorativo no hover nos níveis avançados */}
      {lvl >= 4 && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      {/* Imagem do badge PNG real */}
      <img 
        src={imageUrl} 
        alt={`Patente Nível ${lvl}`} 
        className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:rotate-3 group-hover:scale-110"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://cdn-icons-png.flaticon.com/512/744/744922.png';
        }}
      />
    </div>
  );
}
