import React, { useState } from 'react';
import { Target, RotateCcw, ArrowUpRight, Plus, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDifficultyIdsLabel } from '../lib/caveiraDifficulty';

export default function ActiveMissionBanner() {
  const activePracticeMission = useStore((s) => s.activePracticeMission);
  const caveiraQuestionPrefs = useStore((s) => s.caveiraQuestionPrefs);
  const expandActiveMissionDifficulty = useStore((s) => s.expandActiveMissionDifficulty);
  const completeActivePracticeMission = useStore((s) => s.completeActivePracticeMission);
  const cancelActivePracticeMission = useStore((s) => s.cancelActivePracticeMission);
  const [confirmPartial, setConfirmPartial] = useState(false);

  if (!activePracticeMission || activePracticeMission.status !== 'active') return null;

  const m = activePracticeMission;
  const count = Array.isArray(m.answeredQuestionIds) ? m.answeredQuestionIds.length : 0;
  const target = Math.max(1, Number(m.targetCount) || 1);
  const hits = Number(m.hits) || 0;
  const errors = Number(m.errors) || 0;
  const pct = Math.min(100, Math.round((count / target) * 100));
  const diffLabel = formatDifficultyIdsLabel(m.activeDifficultyIds) || 'Muito fácil';
  const isReview = m.type === 'progressive_review';

  const handleOpenInCaveira = () => {
    const hasCustomQgPrefs = Boolean(caveiraQuestionPrefs && Number(caveiraQuestionPrefs.updatedAt) > 0);
    const hasExt =
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true';
    if (hasExt) {
      window.postMessage(
        {
          source: 'QG_WEB_APP',
          type: 'OPEN_CAVEIRA_PRACTICE',
          payload: {
            missionId: m.id,
            subject: m.subjectName || '',
            lessons: m.lessonNames || [],
            topic:
              Array.isArray(m.subtopics) && m.subtopics.length > 0
                ? m.subtopics.slice(0, 3).join(' • ')
                : (m.lessonNames || []).join(' • ') || m.topicName || '',
            fallbackTopic: m.topicName || '',
            subtopics: m.subtopics || [],
            rawIndexText: m.rawIndexText || '',
            status: 'not_resolved',
            difficultyIds: m.activeDifficultyIds || [m.baseDifficultyId || 2],
            ...(hasCustomQgPrefs
              ? {
                  examBoards: Array.isArray(caveiraQuestionPrefs.examBoards)
                    ? caveiraQuestionPrefs.examBoards
                    : [],
                  numberAlternatives: Array.isArray(caveiraQuestionPrefs.numberAlternatives)
                    ? caveiraQuestionPrefs.numberAlternatives
                    : [],
                }
              : {}),
          },
        },
        window.location.origin
      );
    } else {
      window.open('https://app.caveira.com/questions', '_blank', 'noopener');
    }
  };

  return (
    <div className="bg-sky-50/90 dark:bg-sky-950/35 border border-sky-200 dark:border-sky-800/80 rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-600/15 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
            {isReview ? <RotateCcw className="w-4 h-4" /> : <Target className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
                {isReview ? 'Revisão Progressiva Ativa' : 'Fixação Obrigatória da Aula'}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300">
                {diffLabel}
              </span>
              {isReview && (
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  · Meta: 100% para subir
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
              {m.subjectName ? `${m.subjectName} — ` : ''}
              {m.title || m.topicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-xs">
          <span className="font-bold text-sky-700 dark:text-sky-300">
            {count}/{target}
          </span>
          <span className="text-slate-400">·</span>
          <span>
            <strong className="text-emerald-600 dark:text-emerald-400">{hits}C</strong>
            {' / '}
            <strong className="text-red-600 dark:text-red-400">{errors}E</strong>
          </span>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-sky-200/80 dark:bg-sky-900/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-600 to-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenInCaveira}
            className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ir ao Caveira</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => expandActiveMissionDifficulty?.()}
            title="Usar se não houver questões suficientes neste nível"
            className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nível vizinho</span>
          </button>

          {confirmPartial ? (
            <button
              type="button"
              onClick={() => {
                setConfirmPartial(false);
                completeActivePracticeMission?.(null, { allowPartial: true });
              }}
              className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmar encerramento ({count}/{target})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmPartial(true)}
              title="Use apenas se acabaram as questões inéditas no banco"
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Encerrar com {count}/{target}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => cancelActivePracticeMission?.()}
          className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 inline-flex items-center gap-1 transition-colors cursor-pointer"
          title="Cancelar missão"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );
}
