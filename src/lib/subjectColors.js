export const availableColors = [
  { id: 'blue', color: 'bg-blue-600 text-white', label: 'Azul Real' },
  { id: 'emerald', color: 'bg-emerald-500 text-slate-950', label: 'Verde Esmeralda' },
  { id: 'red', color: 'bg-red-600 text-white', label: 'Vermelho Fogo' },
  { id: 'amber', color: 'bg-amber-400 text-slate-950', label: 'Amarelo Ouro' },
  { id: 'purple', color: 'bg-purple-600 text-white', label: 'Roxo Elétrico' },
  { id: 'orange', color: 'bg-orange-500 text-white', label: 'Laranja Chama' },
  { id: 'cyan', color: 'bg-cyan-400 text-slate-950', label: 'Ciano Neon' },
  { id: 'pink', color: 'bg-pink-500 text-white', label: 'Rosa Choque' },
  { id: 'lime', color: 'bg-lime-400 text-slate-950', label: 'Verde Lima Fluor' },
  { id: 'indigo', color: 'bg-indigo-700 text-white', label: 'Índigo Profundo' },
  { id: 'fuchsia', color: 'bg-fuchsia-600 text-white', label: 'Fúcsia Magenta' },
  { id: 'teal', color: 'bg-teal-600 text-white', label: 'Verde Petróleo' },
  { id: 'sky', color: 'bg-sky-400 text-slate-950', label: 'Azul Céu' },
  { id: 'rose', color: 'bg-rose-500 text-white', label: 'Coral Vivo' },
  { id: 'forest', color: 'bg-green-700 text-white', label: 'Verde Floresta' },
  { id: 'brown', color: 'bg-amber-800 text-white', label: 'Marrom Bronze' },
  { id: 'wine', color: 'bg-rose-900 text-white', label: 'Vinho Bordô' },
  { id: 'slate', color: 'bg-slate-500 text-white', label: 'Cinza Chumbo' }
];

const TEXT_COLOR_BY_HUE = {
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  green: 'text-green-700 dark:text-green-400',
  red: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  purple: 'text-purple-600 dark:text-purple-400',
  violet: 'text-violet-600 dark:text-violet-400',
  orange: 'text-orange-600 dark:text-orange-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  pink: 'text-pink-600 dark:text-pink-400',
  lime: 'text-lime-600 dark:text-lime-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  fuchsia: 'text-fuchsia-600 dark:text-fuchsia-400',
  teal: 'text-teal-600 dark:text-teal-400',
  sky: 'text-sky-600 dark:text-sky-400',
  rose: 'text-rose-600 dark:text-rose-400',
  slate: 'text-slate-600 dark:text-slate-300',
  zinc: 'text-zinc-600 dark:text-zinc-300',
  gray: 'text-gray-600 dark:text-gray-300'
};

const BORDER_COLOR_BY_HUE = {
  blue: 'border-blue-500/70 dark:border-blue-400/70',
  emerald: 'border-emerald-500/70 dark:border-emerald-400/70',
  green: 'border-green-600/70 dark:border-green-400/70',
  red: 'border-red-500/70 dark:border-red-400/70',
  amber: 'border-amber-500/70 dark:border-amber-400/70',
  yellow: 'border-amber-500/70 dark:border-amber-400/70',
  purple: 'border-purple-500/70 dark:border-purple-400/70',
  violet: 'border-violet-500/70 dark:border-violet-400/70',
  orange: 'border-orange-500/70 dark:border-orange-400/70',
  cyan: 'border-cyan-500/70 dark:border-cyan-400/70',
  pink: 'border-pink-500/70 dark:border-pink-400/70',
  lime: 'border-lime-500/70 dark:border-lime-400/70',
  indigo: 'border-indigo-500/70 dark:border-indigo-400/70',
  fuchsia: 'border-fuchsia-500/70 dark:border-fuchsia-400/70',
  teal: 'border-teal-500/70 dark:border-teal-400/70',
  sky: 'border-sky-500/70 dark:border-sky-400/70',
  rose: 'border-rose-500/70 dark:border-rose-400/70',
  slate: 'border-slate-400/70 dark:border-slate-500/70',
  zinc: 'border-zinc-400/70 dark:border-zinc-500/70',
  gray: 'border-gray-400/70 dark:border-gray-500/70'
};

const BAR_COLOR_BY_HUE = {
  blue: 'bg-blue-500 dark:bg-blue-400',
  emerald: 'bg-emerald-500 dark:bg-emerald-400',
  green: 'bg-green-600 dark:bg-green-400',
  red: 'bg-red-500 dark:bg-red-400',
  amber: 'bg-amber-500 dark:bg-amber-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  purple: 'bg-purple-500 dark:bg-purple-400',
  violet: 'bg-violet-500 dark:bg-violet-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
  cyan: 'bg-cyan-500 dark:bg-cyan-400',
  pink: 'bg-pink-500 dark:bg-pink-400',
  lime: 'bg-lime-500 dark:bg-lime-400',
  indigo: 'bg-indigo-500 dark:bg-indigo-400',
  fuchsia: 'bg-fuchsia-500 dark:bg-fuchsia-400',
  teal: 'bg-teal-500 dark:bg-teal-400',
  sky: 'bg-sky-500 dark:bg-sky-400',
  rose: 'bg-rose-500 dark:bg-rose-400',
  slate: 'bg-slate-400 dark:bg-slate-500',
  zinc: 'bg-zinc-400 dark:bg-zinc-500',
  gray: 'bg-gray-400 dark:bg-gray-500'
};

function extractHue(colorClass = '') {
  const match = String(colorClass).match(/bg-([a-z]+)-\d+/);
  return match ? match[1] : 'sky';
}

export function getSubjectTextColorClass(colorClass) {
  const hue = extractHue(colorClass);
  return TEXT_COLOR_BY_HUE[hue] || TEXT_COLOR_BY_HUE.sky;
}

export function getSubjectAccentBorderClass(colorClass) {
  const hue = extractHue(colorClass);
  return BORDER_COLOR_BY_HUE[hue] || BORDER_COLOR_BY_HUE.sky;
}

export function getSubjectAccentBarClass(colorClass) {
  const hue = extractHue(colorClass);
  return BAR_COLOR_BY_HUE[hue] || BAR_COLOR_BY_HUE.sky;
}
