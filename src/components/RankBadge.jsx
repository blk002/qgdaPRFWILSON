import React from 'react';

/**
 * RankBadge — Componente SVG de Patente Tática PRF
 * 
 * Renderiza um escudo tático com gradientes metálicos que evolui visualmente
 * conforme o nível (1-6). Cada nível tem materiais e estrelas diferentes:
 *   1 = Ferro (1★)  |  2 = Prata (2★)  |  3 = Cromo (3★)
 *   4 = Ouro (4★)   |  5 = Platina (5★) |  6 = Diamante (6★)
 */

const RANK_THEMES = [
  // Level 1 — Recruta (Ferro Fosco)
  { 
    base: ['#4a5568', '#2d3748', '#1a202c'],
    border: ['#718096', '#4a5568'],
    star: '#a0aec0',
    glow: 'rgba(113,128,150,0.3)',
    stars: 1
  },
  // Level 2 — Agente 3ª (Prata)
  { 
    base: ['#3b82f6', '#1e40af', '#1e3a5f'],
    border: ['#93c5fd', '#60a5fa'],
    star: '#e2e8f0',
    glow: 'rgba(59,130,246,0.4)',
    stars: 2
  },
  // Level 3 — Agente 2ª (Cromo Azul)
  { 
    base: ['#2563eb', '#1d4ed8', '#1e3a8a'],
    border: ['#93c5fd', '#3b82f6'],
    star: '#f1f5f9',
    glow: 'rgba(37,99,235,0.5)',
    stars: 3
  },
  // Level 4 — Agente 1ª (Ouro)
  { 
    base: ['#1e3a8a', '#1e40af', '#0f172a'],
    border: ['#fbbf24', '#d97706'],
    star: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    stars: 4
  },
  // Level 5 — Especial (Ouro + Platina)
  { 
    base: ['#312e81', '#1e1b4b', '#0c0a2e'],
    border: ['#fcd34d', '#f59e0b'],
    star: '#fde68a',
    glow: 'rgba(252,211,77,0.5)',
    stars: 5
  },
  // Level 6 — Inspetor (Diamante Lendário)
  { 
    base: ['#7c3aed', '#5b21b6', '#2e1065'],
    border: ['#fde68a', '#f59e0b'],
    star: '#fef3c7',
    glow: 'rgba(124,58,237,0.6)',
    stars: 6
  },
];

export default function RankBadge({ level = 1, size = 64, className = '' }) {
  const idx = Math.max(0, Math.min(5, level - 1));
  const theme = RANK_THEMES[idx];
  const id = `rank-${level}-${Math.random().toString(36).slice(2, 6)}`;

  // Posições das estrelas em arco
  const getStarPositions = (count) => {
    const cx = 50, cy = 18;
    const radius = 18;
    const positions = [];
    
    if (count === 1) {
      positions.push({ x: cx, y: cy - 2 });
    } else {
      const startAngle = Math.PI + (Math.PI - (count - 1) * 0.35) / 2;
      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * 0.35;
        positions.push({
          x: cx + radius * Math.cos(angle),
          y: cy - radius * Math.sin(angle) + 6
        });
      }
    }
    return positions;
  };

  const starPositions = getStarPositions(theme.stars);
  const starSize = theme.stars <= 3 ? 4 : theme.stars <= 5 ? 3.2 : 2.8;

  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={className}
      style={{ filter: `drop-shadow(0 4px 12px ${theme.glow})` }}
    >
      <defs>
        {/* Gradiente do corpo do escudo */}
        <linearGradient id={`${id}-base`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.base[0]} />
          <stop offset="50%" stopColor={theme.base[1]} />
          <stop offset="100%" stopColor={theme.base[2]} />
        </linearGradient>

        {/* Gradiente da borda metálica */}
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.border[0]} />
          <stop offset="100%" stopColor={theme.border[1]} />
        </linearGradient>

        {/* Brilho especular no topo */}
        <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.25" />
          <stop offset="50%" stopColor="white" stopOpacity="0.05" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Padrão tático hexagonal */}
        <pattern id={`${id}-hex`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M4 0 L8 2 L8 6 L4 8 L0 6 L0 2 Z" fill="white" fillOpacity="0.04" />
        </pattern>
      </defs>

      {/* Aura de Glow (para ranks altos) */}
      {level >= 4 && (
        <path 
          d="M15 8 L85 8 L85 58 L50 92 L15 58 Z" 
          fill={theme.border[0]} 
          opacity="0.15"
          filter="url(#blur)"
        />
      )}

      {/* Base do Escudo */}
      <path 
        d="M15 8 L85 8 L85 58 L50 92 L15 58 Z" 
        fill={`url(#${id}-base)`}
        stroke={`url(#${id}-border)`}
        strokeWidth={level >= 5 ? 3 : 2}
      />

      {/* Textura Tática */}
      <path d="M15 8 L85 8 L85 58 L50 92 L15 58 Z" fill={`url(#${id}-hex)`} />

      {/* Brilho Especular */}
      <path d="M17 10 L83 10 L83 35 L17 35 Z" fill={`url(#${id}-shine)`} />

      {/* Linha central decorativa */}
      <line x1="30" y1="42" x2="70" y2="42" stroke={theme.border[0]} strokeWidth="0.8" strokeOpacity="0.5" />

      {/* Texto "PRF" central */}
      <text 
        x="50" y="58" 
        textAnchor="middle" 
        fill={theme.star}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="900" 
        fontSize={level >= 5 ? "16" : "14"}
        letterSpacing="3"
        opacity="0.9"
      >
        PRF
      </text>

      {/* Sub-linha decorativa */}
      <line x1="30" y1="66" x2="70" y2="66" stroke={theme.border[0]} strokeWidth="0.5" strokeOpacity="0.3" />

      {/* Chevron inferior (rank ≥ 3) */}
      {level >= 3 && (
        <path 
          d="M38 74 L50 80 L62 74" 
          fill="none" 
          stroke={theme.border[0]} 
          strokeWidth="1.5" 
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
      )}

      {/* Chevron duplo inferior (rank ≥ 5) */}
      {level >= 5 && (
        <path 
          d="M40 79 L50 84 L60 79" 
          fill="none" 
          stroke={theme.border[0]} 
          strokeWidth="1" 
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      )}

      {/* Estrelas no arco superior */}
      {starPositions.map((pos, i) => (
        <g key={i}>
          {/* Glow da estrela (ranks altos) */}
          {level >= 4 && (
            <circle cx={pos.x} cy={pos.y} r={starSize + 2} fill={theme.star} opacity="0.15" />
          )}
          {/* Estrela 5 pontas */}
          <polygon
            points={starPoints(pos.x, pos.y, starSize, starSize * 0.4)}
            fill={theme.star}
            stroke={level >= 4 ? theme.border[0] : 'none'}
            strokeWidth="0.3"
          />
        </g>
      ))}
    </svg>
  );
}

/** Gera os pontos de uma estrela de 5 pontas */
function starPoints(cx, cy, outerR, innerR) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 2) + (i * Math.PI / 5);
    points.push(`${cx + r * Math.cos(angle)},${cy - r * Math.sin(angle)}`);
  }
  return points.join(' ');
}
