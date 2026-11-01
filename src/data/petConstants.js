// Constantes e definições do Mascote K9 / Pou Tático

export const PET_LEVELS = [
  { level: 1, name: 'Recruta Canino', minXp: 0, icon: '🐾', badge: '🔰' },
  { level: 2, name: 'Cão de Pista K9', minXp: 100, icon: '🐕', badge: '🥉' },
  { level: 3, name: 'Farejador de Elite', minXp: 300, icon: '🔍', badge: '🥈' },
  { level: 4, name: 'Operador Tático K9', minXp: 700, icon: '🛡️', badge: '🥇' },
  { level: 5, name: 'Comando de Choque', minXp: 1500, icon: '⚡', badge: '⭐' },
  { level: 6, name: 'Lobo Alfa da PRF', minXp: 3000, icon: '🐺', badge: '👑' },
];

export const PET_FOODS = [
  { 
    id: 'coffee', 
    name: 'Café do Plantão', 
    icon: '☕', 
    hunger: 20, 
    energy: 25, 
    cost: 15, 
    desc: 'Combustível essencial para as noites de estudo e ronda.',
    sound: 'slurp'
  },
  { 
    id: 'pao_de_queijo', 
    name: 'Pão de Queijo Tático', 
    icon: '🥖', 
    hunger: 30, 
    energy: 10, 
    cost: 20, 
    desc: 'Quentinho e crocante, direto da cantina do posto rodoviário.',
    sound: 'crunch'
  },
  { 
    id: 'energy_drink', 
    name: 'Energético 24h PRF', 
    icon: '⚡', 
    hunger: 15, 
    energy: 45, 
    cost: 35, 
    desc: 'Garante foco absoluto e recarrega as baterias instantaneamente.',
    sound: 'gulp'
  },
  { 
    id: 'steak_k9', 
    name: 'Bife Prime K9', 
    icon: '🥩', 
    hunger: 55, 
    energy: 20, 
    cost: 50, 
    desc: 'Corte nobre de proteína para cães de alta performance.',
    sound: 'nom'
  },
  { 
    id: 'donut', 
    name: 'Donut do Inspetor', 
    icon: '🍩', 
    hunger: 35, 
    energy: 15, 
    cost: 25, 
    desc: 'O doce clássico dos plantões com cobertura de chocolate.',
    sound: 'nom'
  },
  { 
    id: 'golden_bone', 
    name: 'Osso Dourado Real', 
    icon: '🦴', 
    hunger: 80, 
    energy: 50, 
    cost: 120, 
    desc: 'Guloseima lendária que sacia toda a fome e enche de moral.',
    sound: 'chew'
  }
];

export const PET_ACCESSORIES = [
  // Chapéus & Cabeça
  { id: 'hat:none', name: 'Sem Chapéu', type: 'hat', cost: 0, icon: '❌', rarity: 'common', desc: 'Cabeça livre.' },
  { id: 'hat:beret_prf', name: 'Boina Preta PRF', type: 'hat', cost: 120, icon: '🎖️', rarity: 'rare', desc: 'Boina tática com brasão de metal dourado.' },
  { id: 'hat:cap_police', name: 'Boné Operacional', type: 'hat', cost: 90, icon: '🧢', rarity: 'uncommon', desc: 'Boné oficial com proteção UV para rodovias.' },
  { id: 'hat:aviator_glasses', name: 'Óculos Aviador PRF', type: 'hat', cost: 180, icon: '🕶️', rarity: 'rare', desc: 'Lentes espelhadas para patrulhamento sob sol forte.' },
  { id: 'hat:tactical_headset', name: 'Abafador Tático K9', type: 'hat', cost: 240, icon: '🎧', rarity: 'epic', desc: 'Headset de comunicação e proteção auricular.' },
  { id: 'hat:gold_crown', name: 'Coroa de Inspetor Lenda', type: 'hat', cost: 600, icon: '👑', rarity: 'legendary', desc: 'Dedicada aos que conquistaram o topo da carreira.' },

  // Coletes & Fardas
  { id: 'outfit:none', name: 'Pelagem Natural', type: 'outfit', cost: 0, icon: '❌', rarity: 'common', desc: 'Sem uniforme.' },
  { id: 'outfit:vest_k9', name: 'Colete Balístico K9', type: 'outfit', cost: 160, icon: '🦺', rarity: 'rare', desc: 'Colete de kevlar com inscrição refletiva K9 PRF.' },
  { id: 'outfit:police_uniform', name: 'Farda Azul Operacional', type: 'outfit', cost: 220, icon: '👔', rarity: 'rare', desc: 'Camisa farda com botões e distintivo dourado no peito.' },
  { id: 'outfit:camo_harness', name: 'Peitoral Camuflado', type: 'outfit', cost: 280, icon: '🛡️', rarity: 'epic', desc: 'Arnes tático militar de rastreamento em mata fechada.' },
  { id: 'outfit:hero_cape', name: 'Capa da Aprovação', type: 'outfit', cost: 500, icon: '🦸', rarity: 'legendary', desc: 'Capa dourada reluzente que tremula ao vento.' },

  // Peles / Raças
  { id: 'skin:caramel', name: 'Caramelo Clássico', type: 'skin', cost: 0, icon: '🐶', rarity: 'common', desc: 'A cor tradicional, carismática e amiga.', color: '#d99b61', shade: '#b87a42' },
  { id: 'skin:tactical_black', name: 'Pastor Malinois K9', type: 'skin', cost: 180, icon: '🐺', rarity: 'rare', desc: 'Pelagem escura de cão farejador da divisão especial.', color: '#27272a', shade: '#18181b' },
  { id: 'skin:golden', name: 'Golden Retriever', type: 'skin', cost: 300, icon: '✨', rarity: 'epic', desc: 'Pelo dourado brilhante que irradia energia e sorte.', color: '#f59e0b', shade: '#d97706' },
  { id: 'skin:cyber_blue', name: 'Cyber Néon PRF', type: 'skin', cost: 450, icon: '⚡', rarity: 'legendary', desc: 'Edição especial cibernética com reflexo azul neon.', color: '#0ea5e9', shade: '#0369a1' },
];

export const RARITY_BADGES = {
  common: { label: 'Comum', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  uncommon: { label: 'Incomum', bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
  rare: { label: 'Raro', bg: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' },
  epic: { label: 'Épico', bg: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400' },
  legendary: { label: 'Lendário', bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' },
};
