import React, { useMemo } from 'react';
import { CheckCircle, Settings2, X } from 'lucide-react';
import { getSubjectTextColorClass } from '../../lib/subjectColors';

function formatMinutesShort(minutes) {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0 && mins > 0) return `${hours}h${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

const MESES_SHORT_MAP = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11
};

function parseDisplayDateTimestamp(dateObj, dateStr) {
  if (dateObj instanceof Date && !Number.isNaN(dateObj.getTime()) && dateObj.getTime() > 0) {
    return dateObj.getTime();
  }
  const match = String(dateStr || '').trim().match(/^(\d{1,2})\/([a-zA-ZçÇ]{3})\/(\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const monthIdx = MESES_SHORT_MAP[match[2].toLowerCase()];
    const year = Number(match[3]);
    if (monthIdx !== undefined && !Number.isNaN(day) && !Number.isNaN(year)) {
      return new Date(year, monthIdx, day).getTime();
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

export default function CalendarioSubjectRail({
  subjectEstimates,
  calCompletionDates,
  highlightedSubjectId,
  onToggleHighlight,
  onOpenTransitionModal
}) {
  const orderedSubjects = useMemo(() => {
    return (subjectEstimates || [])
      .map((sub) => {
        const totalClasses = (sub.topics || []).reduce((acc, t) => acc + (t.total || 0), 0);
        const completedClasses = Math.max(0, totalClasses - sub.remaining);
        const pct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;
        const calFinish = calCompletionDates?.[sub.id];
        const isDone = sub.remaining === 0;
        const displayDateStr = calFinish ? calFinish.dateStr : sub.dateStr;
        const isScheduled = Boolean(calFinish) || sub.isScheduledInCycle !== false;
        const finishTimestamp = isDone
          ? Number.MAX_SAFE_INTEGER
          : parseDisplayDateTimestamp(calFinish?.dateObj || sub.dateObj, displayDateStr);

        return {
          sub,
          pct,
          isDone,
          isScheduled,
          finishTimestamp,
          displayDateStr
        };
      })
      .sort((a, b) => {
        // 1. Disciplinas em andamento vêm antes das já concluídas
        if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
        // 2. Disciplinas agendadas no calendário vêm antes das sem agenda
        if (!a.isDone && a.isScheduled !== b.isScheduled) return a.isScheduled ? -1 : 1;
        // 3. Ordem cronológica estrita: quem encerra primeiro aparece primeiro
        if (a.finishTimestamp !== b.finishTimestamp) return a.finishTimestamp - b.finishTimestamp;
        // 4. Desempate: menos aulas restantes, depois nome
        if (a.sub.remaining !== b.sub.remaining) return a.sub.remaining - b.sub.remaining;
        return String(a.sub.name || '').localeCompare(String(b.sub.name || ''), 'pt-BR');
      });
  }, [subjectEstimates, calCompletionDates]);

  return (
    <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/50">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Fim das Disciplinas
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Mais próximas do fim primeiro · clique para filtrar
          </p>
        </div>

        {highlightedSubjectId && (
          <button
            type="button"
            onClick={() => onToggleHighlight(null)}
            className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {orderedSubjects.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Nenhuma disciplina cadastrada.
        </div>
      ) : (
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800/80 max-h-[72vh] overflow-y-auto custom-scrollbar">
          {orderedSubjects.map(({ sub, pct, isDone, displayDateStr }) => {
            const textColorClass = getSubjectTextColorClass(sub.color);
            const isSelected = highlightedSubjectId === sub.id;
            const currentSpeed = Number(sub.speed) || 1;
            const currentGoal = formatMinutesShort(Number(sub.timeGoalMinutes) || 0);
            const ruleShort =
              sub.onCompleteAction === 'replace'
                ? 'Substitui'
                : sub.onCompleteAction === 'double_remaining'
                  ? 'Dobra'
                  : 'Encerra';

            return (
              <div
                key={sub.id}
                onClick={() => onToggleHighlight(isSelected ? null : sub.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleHighlight(isSelected ? null : sub.id);
                  }
                }}
                className={`px-3.5 py-2.5 flex flex-col gap-1.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/75 dark:bg-sky-950/30'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className={`text-xs font-bold truncate ${textColorClass}`} title={sub.name}>
                    {sub.name}
                  </span>

                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap">
                      <CheckCircle className="w-3 h-3" /> Concluída
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-bold tabular-nums text-slate-800 dark:text-slate-200 shrink-0 whitespace-nowrap">
                      {displayDateStr}
                    </span>
                  )}
                </div>

                {/* Barra de progresso fina */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 w-7 text-right">
                    {pct}%
                  </span>
                </div>

                {/* Metadados enxutos + botão de regra ao concluir */}
                {!isDone && (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate tabular-nums">
                      {sub.remaining} {sub.remaining === 1 ? 'aula' : 'aulas'}
                      {currentSpeed > 1 ? ` · ${currentSpeed}x` : ''}
                      {currentGoal ? ` · ${currentGoal}` : ''}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTransitionModal(sub);
                      }}
                      title="Configurar o que acontece ao concluir esta disciplina"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <Settings2 className="w-3 h-3" /> {ruleShort}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
