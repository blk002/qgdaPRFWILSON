// Causas canônicas da Autópsia de Erro (v146.9 / Ext v3.4.8)

export const ERROR_CAUSES = [
  {
    id: 'leitura',
    filterId: 'cause_leitura',
    label: 'Leitura / Desatenção',
    shortLabel: 'Leitura',
    icon: '👀',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  },
  {
    id: 'decoreba',
    filterId: 'cause_decoreba',
    label: 'Decoreba / Prazo / Pena',
    shortLabel: 'Decoreba',
    icon: '🧠',
    barClass: 'bg-violet-500',
    textClass: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
  },
  {
    id: 'pegadinha',
    filterId: 'cause_pegadinha',
    label: 'Pegadinha da banca',
    shortLabel: 'Pegadinha',
    icon: '🪤',
    barClass: 'bg-sky-500',
    textClass: 'text-sky-600 dark:text-sky-400',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
  },
  {
    id: 'base',
    filterId: 'cause_base',
    label: 'Falta de base',
    shortLabel: 'Base',
    icon: '📚',
    barClass: 'bg-red-500',
    textClass: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30',
  },
  {
    id: 'cansaco',
    filterId: 'cause_cansaco',
    label: 'Cansaço / Chute',
    shortLabel: 'Cansaço',
    icon: '😵',
    barClass: 'bg-slate-500',
    textClass: 'text-slate-600 dark:text-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  },
];

const LEGACY_CAUSE_MAP = {
  atencao: 'leitura',
  interpretacao: 'pegadinha',
  conteudo: 'base',
};

const VALID_CAUSE_IDS = new Set(ERROR_CAUSES.map((c) => c.id));

export function normalizeErrorReason(raw) {
  const key = String(raw || '').trim().toLowerCase();
  if (VALID_CAUSE_IDS.has(key)) return key;
  if (LEGACY_CAUSE_MAP[key]) return LEGACY_CAUSE_MAP[key];
  return 'base';
}

export function getErrorCauseMeta(raw) {
  const id = normalizeErrorReason(raw);
  return ERROR_CAUSES.find((c) => c.id === id) || ERROR_CAUSES[3];
}
