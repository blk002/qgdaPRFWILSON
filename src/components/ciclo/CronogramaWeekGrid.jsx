import React from 'react';
import {
  PlayCircle,
  Target,
  Clock,
  Zap,
  CheckCircle,
  FileText,
  Calendar,
  BrainCircuit,
  Shuffle,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { formatSecondsToFriendly, formatMinutesToFriendly } from '../../lib/durationHelpers';

export default function CronogramaWeekGrid({
  shownDays,
  cycleScheduleType,
  cycleCarryoverOffset,
  resetCycleCarryover,
  onFocusDay,
  onOpenSlotModal,
  onOpenPastSlotModal,
  onOpenNotes,
  onReplaceSubject,
  onSkipTodaySlot,
  onGoToCalendar
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-stretch">
      {shownDays.map((day) => {
        const {
          dayIndex,
          dateInfo,
          isToday,
          isPast,
          dayTotalSeconds,
          dayAcceleratedSeconds,
          hasAcceleration,
          slots
        } = day;

        const dayTitle = cycleScheduleType === 'weekly'
          ? (dateInfo.weekDayName || `Dia ${dayIndex + 1}`)
          : `Dia ${dayIndex + 1}`;
        const displaySec = hasAcceleration ? dayAcceleratedSeconds : dayTotalSeconds;

        return (
          <section
            key={dayIndex}
            className={`rounded-2xl border flex flex-col overflow-hidden transition-colors ${
              isToday
                ? 'bg-white dark:bg-slate-900 border-sky-500/70 ring-1 ring-sky-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Cabeçalho do Card do Dia */}
            <div className={`px-4 py-3 border-b flex items-start justify-between gap-2 ${
              isToday
                ? 'bg-sky-500/[0.06] border-sky-500/20'
                : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800'
            }`}>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-mono text-[11px] font-bold uppercase ${
                    isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {dateInfo.title} · {dateInfo.dateStr}
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 font-mono text-[9px] font-bold uppercase">
                      Hoje
                    </span>
                  )}
                </div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {dayTitle}
                </h3>
                {isToday && cycleScheduleType === 'weekly' && cycleCarryoverOffset > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <RotateCcw className="w-2.5 h-2.5" />
                      +{cycleCarryoverOffset}d
                    </span>
                    <button
                      type="button"
                      onClick={resetCycleCarryover}
                      className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                    >
                      Normalizar
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onFocusDay(dayIndex)}
                  className="h-6 px-2 rounded-md text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 inline-flex items-center gap-0.5 transition-colors cursor-pointer"
                  title="Abrir dia em tela cheia"
                >
                  <span>Focar</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>

                {isPast ? (
                  <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                    dayTotalSeconds > 0
                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400'
                  }`}>
                    {dayTotalSeconds > 0 ? formatSecondsToFriendly(dayTotalSeconds) : '0m'}
                  </span>
                ) : displaySec > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 font-mono text-[11px] font-extrabold text-amber-800 dark:text-amber-300 tabular-nums">
                    {hasAcceleration ? <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                    {formatSecondsToFriendly(displaySec)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Blocos do Dia */}
            <div className="p-3 flex flex-col gap-2.5 flex-1">
              {slots.length === 0 ? (
                <div className="my-auto py-8 px-3 text-center space-y-2">
                  <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Dia Livre / Descanso
                  </p>
                  {!isPast && (
                    <button
                      type="button"
                      onClick={onGoToCalendar}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Agendar no Calendário
                    </button>
                  )}
                </div>
              ) : (
                slots.map((slot) => {
                  const {
                    slotIndex,
                    originalSubId,
                    subjectId,
                    subject,
                    textColorClass,
                    borderColorClass,
                    isReplaced,
                    isDoubled,
                    isSlotCompleted,
                    activeTopic,
                    plannedLessons,
                    aulaBadgeText,
                    displayTotalLessons,
                    remainingLessons,
                    blockTotalAccelSec,
                    pastMinutes,
                    wasStudied,
                    pastActiveTopic
                  } = slot;

                  if (isPast) {
                    return (
                      <div
                        key={slotIndex}
                        className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 border-l-3 ${borderColorClass} bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold uppercase truncate ${textColorClass}`}>
                            {subject.name}
                          </span>
                          {wasStudied ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{wasStudied ? formatMinutesToFriendly(pastMinutes) : 'Não estudado'}</span>
                          {pastActiveTopic && pastActiveTopic.completed < pastActiveTopic.total && (
                            <button
                              type="button"
                              onClick={() => onOpenPastSlotModal(slot, dateInfo)}
                              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                              Registrar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slotIndex}
                      className={`p-3 rounded-xl border border-l-3 space-y-2 ${
                        isSlotCompleted
                          ? 'border-emerald-300 dark:border-emerald-800/70 border-l-emerald-500 bg-emerald-500/[0.04]'
                          : `border-slate-200 dark:border-slate-800 ${borderColorClass} bg-slate-50/40 dark:bg-slate-950/40`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div
                          className="flex items-center flex-nowrap gap-1 min-w-0 flex-1 overflow-hidden"
                          title={activeTopic?.name ? `${subject.name} / ${activeTopic.name}` : subject.name}
                        >
                          <span className={`text-xs font-extrabold uppercase truncate shrink-0 max-w-[55%] ${textColorClass}`}>
                            {subject.name}
                          </span>
                          {activeTopic?.name && (
                            <>
                              <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate min-w-0">
                                {activeTopic.name}
                              </span>
                            </>
                          )}
                        </div>
                        {!isSlotCompleted && activeTopic && (
                          <button
                            type="button"
                            onClick={() => onOpenNotes(subjectId, activeTopic)}
                            className="p-1 text-slate-400 hover:text-sky-500 cursor-pointer shrink-0"
                            title="Anotações do Tópico"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {!isSlotCompleted && activeTopic && (
                        <div className="flex items-center justify-between gap-1.5 flex-wrap text-[11px] font-mono tabular-nums">
                          <div className="flex items-center gap-1">
                            {(isReplaced || isDoubled) && (
                              <span className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                                {isReplaced ? 'Subst.' : '2x'}
                              </span>
                            )}
                            {(remainingLessons ?? displayTotalLessons) > 0 && (
                              <span className="text-sky-600 dark:text-sky-400 font-bold">
                                {aulaBadgeText}
                              </span>
                            )}
                          </div>
                          {blockTotalAccelSec > 0 && (
                            <span className="text-amber-700 dark:text-amber-300 font-extrabold">
                              {formatSecondsToFriendly(blockTotalAccelSec)}
                            </span>
                          )}
                        </div>
                      )}

                      {isSlotCompleted ? (
                        <div className="py-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Concluído hoje</span>
                        </div>
                      ) : activeTopic ? (
                        <>
                          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/70">
                            {plannedLessons.map((les, lIdx) => (
                              <div key={lIdx} className="flex items-center justify-between gap-2 text-xs">
                                <a
                                  href={les.directLesHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative flex items-center gap-2 flex-1 min-w-0 -mx-1.5 px-1.5 py-1 rounded-lg border border-transparent hover:bg-sky-500/[0.09] dark:hover:bg-sky-400/[0.12] hover:border-sky-500/35 dark:hover:border-sky-400/35 hover:shadow-xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 transition-all duration-200 ease-out cursor-pointer"
                                  title={`Assistir "${les.name}" diretamente no Caveira`}
                                >
                                  <span className="w-5 h-5 rounded-full bg-sky-500/12 dark:bg-sky-400/12 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 dark:group-hover:bg-sky-400 group-hover:text-white dark:group-hover:text-slate-950 group-hover:scale-110 group-hover:shadow-sm group-hover:shadow-sky-500/30 flex items-center justify-center shrink-0 transition-all duration-200">
                                    <PlayCircle className="w-3 h-3 shrink-0" />
                                  </span>
                                  <span className="text-slate-700 dark:text-slate-200 font-medium leading-snug line-clamp-2 flex-1 min-w-0 group-hover:text-sky-700 dark:group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all duration-200">
                                    {les.name}
                                  </span>
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-sky-600/12 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 shrink-0 opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200">
                                    <ArrowUpRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                  </span>
                                </a>
                                {les.durationLabel && (
                                  <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300 shrink-0 tabular-nums">
                                    {les.durationLabel}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {isToday && (
                            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/70">
                              <button
                                type="button"
                                onClick={() => onOpenSlotModal(slot, true)}
                                className="h-7 px-2 rounded-lg text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <PlayCircle className="w-3 h-3 shrink-0" />
                                <span>Assistida</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenSlotModal(slot, false)}
                                className="h-7 px-2 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Target className="w-3 h-3 text-sky-500 shrink-0" />
                                <span>Exercícios</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="pt-1 flex items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <BrainCircuit className="w-3.5 h-3.5" />
                            Concluída
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onReplaceSubject({ dayIndex, slotIndex, oldSubjectId: originalSubId })}
                              className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <Shuffle className="w-3 h-3" />
                              Trocar
                            </button>
                            {isToday && (
                              <button
                                type="button"
                                onClick={() => onSkipTodaySlot(slotIndex)}
                                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                Pular
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
