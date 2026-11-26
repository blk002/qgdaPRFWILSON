import React from 'react';
import { Crosshair, CalendarClock, Trash2, Trophy, CheckCircle2, Clock } from 'lucide-react';
import { CAVEIRA_DIFFICULTY_LEVELS } from '../lib/caveiraDifficulty';

const STEP_TONES = {
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

export default function ProgressiveReviewCard({
  review,
  subjectColor = 'bg-sky-500 text-white',
  todayStr = '',
  compact = false,
  onStartMission,
  onAdvanceToToday,
  onDelete,
}) {
  if (!review) return null;

  const currentId = Number(review.currentDifficultyId) || 3;
  const currentLevel =
    CAVEIRA_DIFFICULTY_LEVELS.find((l) => l.id === currentId) || CAVEIRA_DIFFICULTY_LEVELS[1];
  const targetQuestions = Number(review.targetQuestions) || 5;
  const dotClass = String(subjectColor || '').split(' ')[0] || 'bg-sky-500';
  const lastAttempt =
    Array.isArray(review.history) && review.history.length > 0
      ? review.history[review.history.length - 1]
      : null;
  const isFuture = Boolean(todayStr && review.nextDateStr && review.nextDateStr > todayStr);

  const handleStart = () => {
    onStartMission?.({
      type: 'progressive_review',
      reviewId: review.id,
      subjectId: review.subjectId || '',
      subjectName: review.subjectName || '',
      topicName: review.topicName || '',
      title: review.title || review.topicName || 'Revisão de Aula',
      lessonNames: Array.isArray(review.lessonNames) ? review.lessonNames : [],
      subtopics: Array.isArray(review.subtopics) ? review.subtopics : [],
      rawIndexText: review.rawIndexText || '',
      baseDifficultyId: currentId,
      difficultyIds: [currentId],
      targetCount: targetQuestions,
    });
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/85 dark:border-slate-800 ${
        compact ? 'p-3.5 space-y-2.5' : 'p-4 sm:p-5 space-y-3.5'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
              {review.subjectName || 'Disciplina'}
            </span>
            {review.topicName && review.topicName !== review.title && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{review.topicName}</span>
              </>
            )}
          </div>
          <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-slate-900 dark:text-white leading-snug`}>
            {review.title || review.topicName}
          </h3>
        </div>

        {review.mastered ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold shrink-0">
            <Trophy className="w-3 h-3" />
            <span>Blindado</span>
          </span>
        ) : (
          <span
            className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${
              STEP_TONES[currentLevel.tone] || STEP_TONES.sky
            }`}
          >
            {currentLevel.label}
          </span>
        )}
      </div>

      {/* Escada de Maestria (5 níveis oficiais do Caveira) */}
      <div className="flex flex-wrap items-center gap-1">
        {CAVEIRA_DIFFICULTY_LEVELS.map((lvl) => {
          const isDone = review.mastered || lvl.id < currentId;
          const isCurrent = !review.mastered && lvl.id === currentId;
          return (
            <span
              key={lvl.id}
              title={`${lvl.label} (${lvl.rateLabel})`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border inline-flex items-center gap-1 ${
                isDone
                  ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                  : isCurrent
                    ? STEP_TONES[lvl.tone] || STEP_TONES.sky
                    : 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {isDone && <CheckCircle2 className="w-2.5 h-2.5" />}
              <span>{lvl.shortLabel}</span>
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {targetQuestions} questões inéditas · 100% para subir
          </span>
          {lastAttempt && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Última: {lastAttempt.hits}/{lastAttempt.total}
              </span>
            </>
          )}
          {review.nextDateStr && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3 h-3 text-slate-400" />
                {review.nextDateStr.split('-').reverse().slice(0, 2).join('/')}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isFuture && typeof onAdvanceToToday === 'function' && (
            <button
              type="button"
              onClick={() => onAdvanceToToday(review.id)}
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Adiantar revisão para hoje"
            >
              <CalendarClock className="w-3.5 h-3.5 text-sky-500" />
              <span>Adiantar</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>
              Iniciar ({targetQuestions}q · {currentLevel.shortLabel})
            </span>
          </button>
          {typeof onDelete === 'function' && (
            <button
              type="button"
              onClick={() => onDelete(review.id)}
              aria-label="Remover revisão de aula"
              title="Remover revisão de aula"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
