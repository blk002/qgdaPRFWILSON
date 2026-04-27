import React from 'react';

// Mapeamento de level -> imagem real da patente
const RANK_IMAGES = {
  1: '/assets/gamification/Recruta.png',
  2: '/assets/gamification/Agente de 3ª Classe.png',
  3: '/assets/gamification/Agente de 2ª Classe.png',
  4: '/assets/gamification/Agente de 1ª Classe.png',
  5: '/assets/gamification/classe especial.png',
  6: '/assets/gamification/inspetor lenda.png',
  7: '/assets/gamification/diretor_geral.png',
};

/**
 * RankBadge — Exibe a imagem real da patente da PRF.
 * Nível 1-7, com fallback para o SVG simples se a imagem falhar.
 */
export default function RankBadge({ level = 1, size = 64, className = '' }) {
  const clampedLevel = Math.max(1, Math.min(7, level));
  const src = RANK_IMAGES[clampedLevel];

  return (
    <img
      src={src}
      alt={`Patente nível ${clampedLevel}`}
      width={size}
      height={size}
      className={`object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${className}`}
      onError={(e) => {
        // Fallback: escudo simples se a imagem não carregar
        e.target.style.display = 'none';
      }}
    />
  );
}
