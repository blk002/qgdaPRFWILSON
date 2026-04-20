import React from 'react';

// ===== ESCUDO BASE PRF (Forma Polonesa com ponta na base) =====
const SHIELD_PATH = "M10 8 L90 8 L90 58 L50 88 L10 58 Z";
const SHIELD_INNER = "M14 12 L86 12 L86 56 L50 83 L14 56 Z";

// ===== ELEMENTOS INSTITUCIONAIS =====

// Rodas dentadas cruzadas (símbolo de fiscalização e engenharia rodoviária)
const CrossedGears = ({ x, y, size = 14, color = '#b8bfc9' }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Engrenagem esquerda */}
    <g transform={`translate(-${size * 0.5}, 0) scale(${size / 18})`}>
      <circle cx="0" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="0" cy="0" r="2.5" fill={color} />
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <rect key={i} x="-1.2" y="-9" width="2.4" height="3.5" fill={color}
          transform={`rotate(${angle})`} rx="0.5" />
      ))}
    </g>
    {/* Engrenagem direita */}
    <g transform={`translate(${size * 0.5}, 0) scale(${size / 18})`}>
      <circle cx="0" cy="0" r="6" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="0" cy="0" r="2.5" fill={color} />
      {[22,67,112,157,202,247,292,337].map((angle, i) => (
        <rect key={i} x="-1.2" y="-9" width="2.4" height="3.5" fill={color}
          transform={`rotate(${angle})`} rx="0.5" />
      ))}
    </g>
  </g>
);

// Chevron (divisa) - símbolo de classe
const Chevron = ({ y, color = '#b8bfc9', size = 20 }) => (
  <path
    d={`M${50 - size} ${y} L50 ${y - 7} L${50 + size} ${y}`}
    fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
  />
);

// Estrelas
const Star = ({ x, y, r = 4, color = '#ffd700' }) => (
  <path
    d={`M${x} ${y - r} L${x + r * 0.37} ${y - r * 0.12} L${x + r * 0.95} ${y - r * 0.31} L${x + r * 0.59} ${y + r * 0.19} L${x + r * 0.59} ${y + r * 0.81} L${x} ${y + r * 0.5} L${x - r * 0.59} ${y + r * 0.81} L${x - r * 0.59} ${y + r * 0.19} L${x - r * 0.95} ${y - r * 0.31} L${x - r * 0.37} ${y - r * 0.12} Z`}
    fill={color}
    style={{ filter: `drop-shadow(0 0 ${r}px ${color})` }}
  />
);

// Águia Federal simplificada (silhueta)
const Eagle = ({ x, y, size = 1, color = '#ffd700' }) => (
  <g transform={`translate(${x}, ${y}) scale(${size})`}>
    {/* Corpo */}
    <ellipse cx="0" cy="2" rx="5" ry="7" fill={color} />
    {/* Asa esquerda */}
    <path d="M-5 0 Q-18 -8 -14 -15 Q-8 -5 0 -2 Z" fill={color} />
    {/* Asa direita */}
    <path d="M5 0 Q18 -8 14 -15 Q8 -5 0 -2 Z" fill={color} />
    {/* Cabeça */}
    <circle cx="0" cy="-8" r="4.5" fill={color} />
    {/* Bico */}
    <path d="M0 -6 L3 -5 L1 -4 Z" fill="#ff9900" />
    {/* Olho */}
    <circle cx="1.5" cy="-9" r="0.8" fill="#001233" />
  </g>
);

// Coroa (Inspetor - Lenda)
const Crown = ({ x, y, size = 1, color = '#ffd700' }) => (
  <g transform={`translate(${x}, ${y}) scale(${size})`}>
    <path d="M-12 5 L-12 -3 L-6 3 L0 -8 L6 3 L12 -3 L12 5 Z" fill={color} />
    <rect x="-12" y="5" width="24" height="4" rx="1" fill={color} />
    <circle cx="0" cy="-8" r="2" fill="white" opacity="0.9" />
    <circle cx="-10" cy="-1" r="1.5" fill="white" opacity="0.7" />
    <circle cx="10" cy="-1" r="1.5" fill="white" opacity="0.7" />
  </g>
);

// Stripes rodoviárias (faixa de estrada)
const RoadStripes = ({ y, color = 'rgba(255,255,255,0.15)' }) => (
  <g>
    {[-15, -5, 5, 15].map((offset, i) => (
      <rect key={i} x={50 + offset - 1} y={y} width="2" height="5" rx="0.5" fill={color} />
    ))}
  </g>
);

// ===== ESCUDOS POR PATENTE =====

const shields = {
  recruta: (
    <svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="r_bg" x1="0%" y1="0%" x2="100%" y2="120%">
          <stop offset="0%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#1a202c" />
        </linearGradient>
        <linearGradient id="r_border" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#718096" />
          <stop offset="100%" stopColor="#4a5568" />
        </linearGradient>
        <filter id="r_shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
        </filter>
      </defs>
      <g filter="url(#r_shadow)">
        <path d={SHIELD_PATH} fill="url(#r_bg)" />
        <path d={SHIELD_PATH} fill="none" stroke="url(#r_border)" strokeWidth="2.5" />
        <path d={SHIELD_INNER} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
      </g>
      {/* Faixas de estrada (candidato chegando) */}
      <RoadStripes y={30} color="rgba(255,255,255,0.1)" />
      {/* Texto EM FORMAÇÃO */}
      <text x="50" y="48" textAnchor="middle" fill="#718096" fontSize="6" fontWeight="900" letterSpacing="0.5">EM</text>
      <text x="50" y="56" textAnchor="middle" fill="#718096" fontSize="6" fontWeight="900" letterSpacing="0.5">FORMAÇÃO</text>
      {/* Faixa PRF base */}
      <rect x="22" y="64" width="56" height="9" rx="1.5" fill="rgba(0,34,68,0.9)" />
      <text x="50" y="71" textAnchor="middle" fill="#718096" fontSize="5.5" fontWeight="900" letterSpacing="1">PRF</text>
    </svg>
  ),

  agente_3: (
    <svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="a3_bg" x1="0%" y1="0%" x2="100%" y2="120%">
          <stop offset="0%" stopColor="#003380" />
          <stop offset="60%" stopColor="#001a40" />
          <stop offset="100%" stopColor="#00102a" />
        </linearGradient>
        <linearGradient id="a3_border" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
        <filter id="a3_glow"><feGaussianBlur stdDeviation="1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path d={SHIELD_PATH} fill="url(#a3_bg)" />
      <path d={SHIELD_PATH} fill="none" stroke="url(#a3_border)" strokeWidth="2.5" />
      {/* Faixa POLÍCIA */}
      <rect x="18" y="12" width="64" height="10" rx="1" fill="rgba(0,20,50,0.9)" />
      <text x="50" y="20" textAnchor="middle" fill="#b8bfc9" fontSize="5.5" fontWeight="900" letterSpacing="1">POLÍCIA</text>
      {/* Engrenagens cruzadas */}
      <CrossedGears x={50} y={42} size={22} color="#9ca3af" />
      {/* 1 Chevron prata */}
      <Chevron y={64} color="#b8bfc9" size={18} />
      {/* Faixa RODOVIÁRIA FEDERAL */}
      <rect x="15" y="70" width="70" height="8" rx="1" fill="rgba(0,20,50,0.9)" />
      <text x="50" y="76.5" textAnchor="middle" fill="#9ca3af" fontSize="4.5" fontWeight="900" letterSpacing="0.8">RODOVIÁRIA FEDERAL</text>
    </svg>
  ),

  agente_2: (
    <svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="a2_bg" x1="0%" y1="0%" x2="100%" y2="120%">
          <stop offset="0%" stopColor="#003d99" />
          <stop offset="60%" stopColor="#001f4d" />
          <stop offset="100%" stopColor="#00102a" />
        </linearGradient>
        <linearGradient id="a2_border" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c0c8d4" />
          <stop offset="100%" stopColor="#8a9bb0" />
        </linearGradient>
      </defs>
      <path d={SHIELD_PATH} fill="url(#a2_bg)" />
      <path d={SHIELD_PATH} fill="none" stroke="url(#a2_border)" strokeWidth="2.5" />
      {/* Reflexo lateral */}
      <path d="M10 8 L18 8 L18 50 L12 56 L10 54 Z" fill="rgba(255,255,255,0.05)" />
      <rect x="18" y="12" width="64" height="10" rx="1" fill="rgba(0,20,50,0.9)" />
      <text x="50" y="20" textAnchor="middle" fill="#c0c8d4" fontSize="5.5" fontWeight="900" letterSpacing="1">POLÍCIA</text>
      <CrossedGears x={50} y={40} size={22} color="#b0bac6" />
      {/* 2 Chevrons prata */}
      <Chevron y={60} color="#c0c8d4" size={18} />
      <Chevron y={67} color="#c0c8d4" size={18} />
      <rect x="15" y="73" width="70" height="8" rx="1" fill="rgba(0,20,50,0.9)" />
      <text x="50" y="79.5" textAnchor="middle" fill="#b0bac6" fontSize="4.5" fontWeight="900" letterSpacing="0.8">RODOVIÁRIA FEDERAL</text>
    </svg>
  ),

  agente_1: (
    <svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="a1_bg" x1="0%" y1="0%" x2="100%" y2="120%">
          <stop offset="0%" stopColor="#00409e" />
          <stop offset="60%" stopColor="#001f52" />
          <stop offset="100%" stopColor="#000e24" />
        </linearGradient>
        <linearGradient id="a1_border" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#cc9900" />
          <stop offset="100%" stopColor="#996600" />
        </linearGradient>
      </defs>
      <path d={SHIELD_PATH} fill="url(#a1_bg)" />
      <path d={SHIELD_PATH} fill="none" stroke="url(#a1_border)" strokeWidth="3" />
      <path d="M10 8 L18 8 L18 50 L12 56 L10 54 Z" fill="rgba(255,215,0,0.06)" />
      <rect x="18" y="12" width="64" height="10" rx="1" fill="rgba(0,10,30,0.95)" />
      <text x="50" y="20" textAnchor="middle" fill="#ffd700" fontSize="5.5" fontWeight="900" letterSpacing="1">POLÍCIA</text>
      <CrossedGears x={50} y={40} size={22} color="#e8c44a" />
      {/* 3 Chevrons dourados */}
      <Chevron y={59} color="#ffd700" size={18} />
      <Chevron y={65} color="#e6c200" size={18} />
      <Chevron y={71} color="#cc9900" size={18} />
      <rect x="15" y="76" width="70" height="8" rx="1" fill="rgba(0,10,30,0.95)" />
      <text x="50" y="82.5" textAnchor="middle" fill="#e8c44a" fontSize="4.5" fontWeight="900" letterSpacing="0.8">RODOVIÁRIA FEDERAL</text>
    </svg>
  ),

  especial: (
    <svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="e_bg" x1="0%" y1="0%" x2="100%" y2="120%">
          <stop offset="0%" stopColor="#003080" />
          <stop offset="50%" stopColor="#001540" />
          <stop offset="100%" stopColor="#000820" />
        </linearGradient>
        <linearGradient id="e_border" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#b8860b" />
          <stop offset="100%" stopColor="#7a5c00" />
        </linearGradient>
        <filter id="e_glow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(255,215,0,0.4)" />
        </filter>
      </defs>
      <path d={SHIELD_PATH} fill="url(#e_bg)" />
      <path d={SHIELD_PATH} fill="none" stroke="url(#e_border)" strokeWidth="3" filter="url(#e_glow)" />
      {/* Reflexo */}
      <path d="M10 8 L20 8 L20 52 L12 58 L10 56 Z" fill="rgba(255,215,0,0.07)" />
      <rect x="18" y="11" width="64" height="10" rx="1" fill="rgba(0,8,24,0.97)" />
      <text x="50" y="19" textAnchor="middle" fill="#ffd700" fontSize="5.5" fontWeight="900" letterSpacing="0.8">POLÍCIA</text>
      {/* Louros decorativos laterais */}
      <path d="M20 38 Q16 32 20 26 Q22 32 20 38Z" fill="#7a6000" />
      <path d="M80 38 Q84 32 80 26 Q78 32 80 38Z" fill="#7a6000" />
      {/* Águia Federal Central */}
      <Eagle x={50} y={44} size={1.35} color="#ffd700" />
      {/* Estrelas abaixo */}
      <Star x={38} y={65} r={3} color="#ffd700" />
      <Star x={50} y={65} r={3} color="#ffd700" />
      <Star x={62} y={65} r={3} color="#ffd700" />
      <rect x="14" y="72" width="72" height="8" rx="1" fill="rgba(0,8,24,0.97)" />
      <text x="50" y="78.5" textAnchor="middle" fill="#ffd700" fontSize="4.3" fontWeight="900" letterSpacing="0.6">RODOVIÁRIA FEDERAL</text>
    </svg>
  ),

  inspetor: (
    <svg viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="i_bg" x1="0%" y1="0%" x2="100%" y2="130%">
          <stop offset="0%" stopColor="#1a0a00" />
          <stop offset="40%" stopColor="#2a1500" />
          <stop offset="100%" stopColor="#0a0500" />
        </linearGradient>
        <linearGradient id="i_border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff0a0" />
          <stop offset="30%" stopColor="#ffd700" />
          <stop offset="70%" stopColor="#c8a000" />
          <stop offset="100%" stopColor="#a07800" />
        </linearGradient>
        <filter id="i_legendaryglow">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="rgba(255,215,0,0.6)" />
        </filter>
        <filter id="i_innerglow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(255,200,0,0.8)" />
        </filter>
      </defs>
      {/* Aura externa */}
      <path d={SHIELD_PATH} fill="rgba(255,215,0,0.12)" transform="scale(1.05) translate(-2.5,-4)" />
      <path d={SHIELD_PATH} fill="url(#i_bg)" />
      <path d={SHIELD_PATH} fill="none" stroke="url(#i_border)" strokeWidth="3.5" filter="url(#i_legendaryglow)" />
      {/* Reflexo premium */}
      <path d="M11 9 L22 9 L22 54 L13 60 L11 58 Z" fill="rgba(255,215,0,0.1)" />
      {/* Coroa no topo */}
      <Crown x={50} y={18} size={0.9} color="#ffd700" />
      {/* Faixa POLÍCIA */}
      <rect x="19" y="24" width="62" height="9" rx="1" fill="rgba(255,215,0,0.12)" />
      <text x="50" y="31.5" textAnchor="middle" fill="#ffd700" fontSize="5.5" fontWeight="900" letterSpacing="0.8">POLÍCIA</text>
      {/* Brasão central - Círculo Oficial */}
      <circle cx="50" cy="52" r="14" fill="rgba(255,215,0,0.1)" stroke="#ffd700" strokeWidth="1" filter="url(#i_innerglow)" />
      <text x="50" y="48.5" textAnchor="middle" fill="#ffd700" fontSize="5.5" fontWeight="900">🦅</text>
      <text x="50" y="57" textAnchor="middle" fill="#b8860b" fontSize="3.5" fontWeight="900" letterSpacing="0.5">REPÚBLICA</text>
      <text x="50" y="61" textAnchor="middle" fill="#b8860b" fontSize="3.5" fontWeight="900" letterSpacing="0.5">FEDERATIVA</text>
      {/* 5 Estrelas Lendárias */}
      <Star x={28} y={74} r={2.8} color="#ffd700" />
      <Star x={36} y={71} r={2.8} color="#ffd700" />
      <Star x={50} y={70} r={3.2} color="#fff0a0" />
      <Star x={64} y={71} r={2.8} color="#ffd700" />
      <Star x={72} y={74} r={2.8} color="#ffd700" />
      {/* Faixa final */}
      <rect x="14" y="80" width="72" height="8" rx="1" fill="rgba(255,215,0,0.12)" />
      <text x="50" y="86.5" textAnchor="middle" fill="#ffd700" fontSize="4.3" fontWeight="900" letterSpacing="0.6">RODOVIÁRIA FEDERAL</text>
    </svg>
  ),
};

export default function PatentShield({ patenteId, size = 80, className = '', glow = false }) {
  const shield = shields[patenteId] || shields.recruta;

  const glowStyle = glow ? {
    filter: patenteId === 'inspetor'
      ? 'drop-shadow(0 0 20px rgba(255,215,0,0.5))'
      : patenteId === 'especial'
      ? 'drop-shadow(0 0 15px rgba(255,215,0,0.35))'
      : 'drop-shadow(0 0 10px rgba(59,130,246,0.4))'
  } : {};

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size * 0.96, ...glowStyle }}
    >
      {shield}
    </div>
  );
}
