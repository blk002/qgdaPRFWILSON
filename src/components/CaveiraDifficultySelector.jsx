import React from 'react';
import {
  CAVEIRA_DIFFICULTY_LEVELS,
  CAVEIRA_UNDEFINED_DIFFICULTY,
  sanitizeDifficultyIds,
} from '../lib/caveiraDifficulty';

const DIFF_TONE_ACTIVE = {
  emerald: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500',
  sky: 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500',
  amber: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500',
  orange: 'bg-orange-600 text-white border-orange-600 dark:bg-orange-500 dark:text-slate-950 dark:border-orange-500',
  rose: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500 dark:text-white dark:border-rose-500',
};

export default function CaveiraDifficultySelector({
  mode = 'manual',
  onChangeMode = null,
  selectedIds = [],
  onChangeIds,
  includeUndefined = false,
  onChangeIncludeUndefined = null,
  recommendation = null,
  compact = false,
  showRateHint = false,
}) {
  const cleanIds = sanitizeDifficultyIds(selectedIds).filter((id) => id >= 2);
  const isAuto = mode === 'auto';
  const isAllActive = !isAuto && cleanIds.length === 0;
  const hasActiveUndefined = Array.isArray(selectedIds)
    ? selectedIds.includes(CAVEIRA_UNDEFINED_DIFFICULTY.id) || Boolean(includeUndefined)
    : Boolean(includeUndefined);

  const handleSelectAll = () => {
    if (typeof onChangeMode === 'function') {
      onChangeMode('manual', []);
    } else if (typeof onChangeIds === 'function') {
      onChangeIds([]);
    }
  };

  const handleToggleAuto = () => {
    if (typeof onChangeMode === 'function') {
      onChangeMode(isAuto ? 'manual' : 'auto');
      return;
    }
    if (recommendation?.recommendedId && typeof onChangeIds === 'function') {
      const next = hasActiveUndefined
        ? sanitizeDifficultyIds([recommendation.recommendedId, CAVEIRA_UNDEFINED_DIFFICULTY.id])
        : [recommendation.recommendedId];
      onChangeIds(next);
    }
  };

  const handleToggleLevel = (id) => {
    const nextBase = cleanIds.includes(id)
      ? cleanIds.filter((x) => x !== id)
      : sanitizeDifficultyIds([...cleanIds, id]);
    const nextWithUndef =
      nextBase.length > 0 && hasActiveUndefined && !onChangeIncludeUndefined
        ? sanitizeDifficultyIds([...nextBase, CAVEIRA_UNDEFINED_DIFFICULTY.id])
        : nextBase;
    if (typeof onChangeMode === 'function') {
      onChangeMode('manual', nextWithUndef);
    } else if (typeof onChangeIds === 'function') {
      onChangeIds(nextWithUndef);
    }
  };

  const handleToggleUndefined = () => {
    if (typeof onChangeIncludeUndefined === 'function') {
      onChangeIncludeUndefined(!includeUndefined);
      return;
    }
    if (typeof onChangeIds === 'function') {
      const has1 = Array.isArray(selectedIds) && selectedIds.includes(CAVEIRA_UNDEFINED_DIFFICULTY.id);
      if (cleanIds.length === 0) return;
      onChangeIds(
        has1
          ? cleanIds
          : sanitizeDifficultyIds([...cleanIds, CAVEIRA_UNDEFINED_DIFFICULTY.id])
      );
    }
  };

  const pillHeight = compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleSelectAll}
          className={`${pillHeight} rounded-lg font-medium transition-colors border cursor-pointer whitespace-nowrap ${
            isAllActive
              ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
              : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          Todos
        </button>

        {CAVEIRA_DIFFICULTY_LEVELS.map((lvl) => {
          const active = !isAuto && cleanIds.includes(lvl.id);
          const text = compact
            ? lvl.shortLabel
            : showRateHint
              ? `${lvl.label} (${lvl.rateLabel})`
              : lvl.label;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => handleToggleLevel(lvl.id)}
              title={`${lvl.label} (${lvl.rateLabel} de acertos na plataforma)`}
              className={`${pillHeight} rounded-lg font-medium transition-colors border cursor-pointer whitespace-nowrap ${
                active
                  ? DIFF_TONE_ACTIVE[lvl.tone]
                  : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {text}
            </button>
          );
        })}

        {(typeof onChangeMode === 'function' || recommendation) && (
          <button
            type="button"
            onClick={handleToggleAuto}
            title={
              recommendation?.summary ||
              'Seleciona automaticamente o nível ideal de acordo com o seu histórico no Raio-X'
            }
            className={`${pillHeight} rounded-lg font-semibold transition-colors border cursor-pointer whitespace-nowrap ${
              isAuto
                ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
                : 'text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/15 border-sky-500/25'
            }`}
          >
            {recommendation?.level?.label
              ? `⚡ Auto: ${compact ? recommendation.level.shortLabel : recommendation.level.label}`
              : '⚡ Auto'}
          </button>
        )}
      </div>

      {(onChangeIncludeUndefined || (!onChangeMode && cleanIds.length > 0)) &&
        (isAuto || cleanIds.length > 0) && (
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                onChangeIncludeUndefined
                  ? Boolean(includeUndefined)
                  : Boolean(Array.isArray(selectedIds) && selectedIds.includes(CAVEIRA_UNDEFINED_DIFFICULTY.id))
              }
              onChange={handleToggleUndefined}
              className="rounded border-slate-300 dark:border-slate-700 accent-sky-600"
            />
            <span>Incluir questões novas (&quot;Em definição&quot;)</span>
          </label>
        )}
    </div>
  );
}
