import React from 'react';
import { Star } from 'lucide-react';
import { formatSecondsToFriendly } from '../../lib/durationHelpers';
import { getSubjectTextColorClass } from '../../lib/subjectColors';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarioMonthGrid({
  year,
  month,
  days,
  blanks,
  todayDateObj,
  subjects,
  futureSchedule,
  calendarOverrides,
  remainingLessonsQueue,
  getDaySubjectsForDate,
  highlightedSubjectId,
  onOpenDayManager
}) {
  const todayTime = todayDateObj.getTime();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[640px]">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
            {DIAS_SEMANA.map((dia, idx) => {
              const isWeekend = idx === 0 || idx === 6;
              return (
                <div
                  key={dia}
                  className={`py-2 px-2 text-center text-xs font-semibold ${
                    isWeekend
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {dia}
                </div>
              );
            })}
          </div>

          {/* Grade mensal em linhas finas */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {blanks.map((_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-[6rem] md:min-h-[7rem] bg-slate-50/40 dark:bg-slate-950/35"
              />
            ))}

            {days.map((day) => {
              const cellDateObj = new Date(year, month, day);
              const diffDays = Math.round((cellDateObj.getTime() - todayTime) / (1000 * 60 * 60 * 24));
              const isTodayReal = diffDays === 0;
              const isPast = diffDays < 0;
              const cellDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isOverridden = !isPast && Boolean(calendarOverrides && calendarOverrides[cellDateKey]);

              let dayItemsToRender = [];
              if (!isPast) {
                if (futureSchedule[cellDateKey] !== undefined) {
                  dayItemsToRender = futureSchedule[cellDateKey];
                } else {
                  const baseIds = getDaySubjectsForDate(cellDateObj, cellDateKey);
                  dayItemsToRender = baseIds
                    .filter((id) => (remainingLessonsQueue[id]?.length || 0) > 0)
                    .map((id) => ({ id, isLast: false, isTransitioned: false }));
                }
              }

              const dayAccelSec = dayItemsToRender.reduce((acc, it) => acc + (Number(it?.accelSec) || 0), 0);
              const dayTimeLabel = dayAccelSec > 0 ? formatSecondsToFriendly(dayAccelSec) : '';
              const matchesHighlight =
                !highlightedSubjectId || dayItemsToRender.some((it) => it?.id === highlightedSubjectId);

              const cellClass = isPast
                ? 'bg-slate-50/75 dark:bg-slate-950/45 text-slate-400 dark:text-slate-600 cursor-default'
                : isTodayReal
                  ? 'bg-sky-50/50 dark:bg-sky-950/20 text-slate-900 dark:text-slate-100 cursor-pointer ring-1 ring-inset ring-sky-500/80 dark:ring-sky-400/75'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50/90 dark:hover:bg-slate-800/45 text-slate-700 dark:text-slate-200 cursor-pointer';

              return (
                <div
                  key={day}
                  onClick={() => !isPast && onOpenDayManager(cellDateObj, cellDateKey)}
                  title={isPast ? 'Dia anterior' : 'Clique para editar os blocos deste dia'}
                  className={`min-h-[6rem] md:min-h-[7rem] min-w-0 p-2 flex flex-col transition-colors group ${cellClass} ${
                    !isPast && highlightedSubjectId && !matchesHighlight ? 'opacity-35' : ''
                  }`}
                >
                  {/* Cabeçalho enxuto do dia */}
                  <div className="flex items-center justify-between gap-1 pb-1 mb-1 border-b border-slate-100 dark:border-slate-800/80 leading-none">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isTodayReal
                            ? 'text-sky-600 dark:text-sky-400'
                            : isPast
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {String(day).padStart(2, '0')}
                      </span>
                      {isTodayReal && (
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                          Hoje
                        </span>
                      )}
                      {isOverridden && (
                        <span
                          className="text-[10px] font-medium text-amber-600 dark:text-amber-400"
                          title="Dia personalizado manualmente"
                        >
                          · Edit.
                        </span>
                      )}
                    </div>

                    {dayTimeLabel ? (
                      <span className="text-[11px] font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300 whitespace-nowrap shrink-0">
                        {dayTimeLabel}
                      </span>
                    ) : !isPast ? (
                      <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Editar
                      </span>
                    ) : null}
                  </div>

                  {/* Conteúdo do dia */}
                  {dayItemsToRender.length > 0 ? (
                    <div className="flex flex-col gap-1.5 min-w-0">
                      {dayItemsToRender.map((item, idx) => {
                        const sub = subjects[item.id];
                        if (!sub) return null;
                        const lessonsList = Array.isArray(item.lessons) ? item.lessons : [];
                        const textColorClass = getSubjectTextColorClass(sub.color);
                        const isDimmed = Boolean(highlightedSubjectId && sub.id !== highlightedSubjectId);
                        const isHighlighted = Boolean(highlightedSubjectId && sub.id === highlightedSubjectId);
                        const blockTooltip =
                          lessonsList.length > 0
                            ? `${sub.name}: ${lessonsList.map((l) => l.name).join(' • ')}`
                            : sub.name;

                        return (
                          <div
                            key={`${item.id}-${idx}`}
                            className={`min-w-0 transition-opacity ${isDimmed ? 'opacity-20' : ''}`}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                title={blockTooltip}
                                className={`text-[11px] font-bold leading-snug truncate ${textColorClass} ${
                                  isHighlighted ? 'underline underline-offset-2' : ''
                                }`}
                              >
                                {sub.name}
                                {item.isTransitioned ? ' · Subst.' : ''}
                              </span>
                              {item.isLast && (
                                <Star
                                  className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500 shrink-0"
                                  title="Última aula desta disciplina"
                                />
                              )}
                            </div>

                            {lessonsList.length > 0 ? (
                              <div className="mt-0.5 flex flex-col gap-0.5">
                                {lessonsList.map((les, lIdx) => (
                                  <span
                                    key={`${idx}-${lIdx}`}
                                    className="block pl-1.5 text-[11px] leading-snug text-slate-600 dark:text-slate-300/90 break-words"
                                    title={
                                      les.topicName && !les.name.includes(les.topicName)
                                        ? `${les.topicName} · ${les.name}${les.duration ? ` (${les.duration})` : ''}`
                                        : `${les.name}${les.duration ? ` (${les.duration})` : ''}`
                                    }
                                  >
                                    · {les.name}
                                  </span>
                                ))}
                              </div>
                            ) : item.count >= 1 ? (
                              <span className="block pl-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                                · {item.count} {item.count === 1 ? 'aula' : 'aulas'}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : !isPast ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[11px] text-slate-300 dark:text-slate-700 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
                        Livre
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
