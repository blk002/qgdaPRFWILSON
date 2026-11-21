const COLOR_TEXT_MAP = {
  blue: 'text-blue-700 dark:text-blue-400',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  green: 'text-emerald-700 dark:text-emerald-400',
  red: 'text-red-700 dark:text-red-400',
  rose: 'text-rose-700 dark:text-rose-400',
  amber: 'text-amber-700 dark:text-amber-300',
  yellow: 'text-amber-700 dark:text-yellow-300',
  purple: 'text-purple-700 dark:text-purple-400',
  violet: 'text-violet-700 dark:text-violet-400',
  orange: 'text-orange-700 dark:text-orange-400',
  cyan: 'text-cyan-700 dark:text-cyan-300',
  sky: 'text-sky-700 dark:text-sky-300',
  pink: 'text-pink-700 dark:text-pink-400',
  lime: 'text-lime-700 dark:text-lime-300',
  indigo: 'text-indigo-700 dark:text-indigo-300',
  fuchsia: 'text-fuchsia-700 dark:text-fuchsia-400',
  teal: 'text-teal-700 dark:text-teal-300',
  white: 'text-slate-800 dark:text-slate-100',
  slate: 'text-slate-700 dark:text-slate-300'
};

const COLOR_BORDER_MAP = {
  blue: 'border-blue-500/40 dark:border-blue-500/40',
  emerald: 'border-emerald-500/40 dark:border-emerald-500/40',
  green: 'border-emerald-500/40 dark:border-emerald-500/40',
  red: 'border-red-500/40 dark:border-red-500/40',
  rose: 'border-rose-500/40 dark:border-rose-500/40',
  amber: 'border-amber-500/40 dark:border-amber-400/40',
  yellow: 'border-amber-500/40 dark:border-yellow-400/40',
  purple: 'border-purple-500/40 dark:border-purple-500/40',
  violet: 'border-violet-500/40 dark:border-violet-500/40',
  orange: 'border-orange-500/40 dark:border-orange-500/40',
  cyan: 'border-cyan-500/40 dark:border-cyan-400/40',
  sky: 'border-sky-500/40 dark:border-sky-400/40',
  pink: 'border-pink-500/40 dark:border-pink-500/40',
  lime: 'border-lime-500/40 dark:border-lime-400/40',
  indigo: 'border-indigo-500/40 dark:border-indigo-400/40',
  fuchsia: 'border-fuchsia-500/40 dark:border-fuchsia-500/40',
  teal: 'border-teal-500/40 dark:border-teal-400/40',
  white: 'border-slate-300 dark:border-slate-700',
  slate: 'border-slate-300 dark:border-slate-700'
};

function detectColorToken(bgColorClass = '') {
  const str = String(bgColorClass || '').toLowerCase();
  const match = str.match(/(?:^|\s)(?:bg|text|border)-([a-z]+)(?:-|\s|$)/);
  if (match && COLOR_TEXT_MAP[match[1]]) {
    return match[1];
  }
  const tokens = Object.keys(COLOR_TEXT_MAP);
  return tokens.find((key) => str.includes(key)) || 'slate';
}

export function getSubjectTextColorClass(bgColorClass = '') {
  const token = detectColorToken(bgColorClass);
  return COLOR_TEXT_MAP[token] || 'text-slate-800 dark:text-slate-100';
}

export function getSubjectAccentBorderClass(bgColorClass = '') {
  const token = detectColorToken(bgColorClass);
  return COLOR_BORDER_MAP[token] || 'border-slate-200 dark:border-slate-800';
}
