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
  Trophy,
  ChevronRight,
  RotateCcw,
  Layers,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { formatSecondsToFriendly, formatMinutesToFriendly } from '../../lib/durationHelpers';

export default function CronogramaDayWorkbench({
  day,
  shownDays,
  selectedDayIndex,
  onSelectDay,
  cycleScheduleType,
  cycleCarryoverOffset,
  resetCycleCarryover,
  completedToday,
  todayTotalSlots,
  advanceDay,
  onOpenSlotModal,
  onOpenPastSlotModal,
  onOpenNotes,
  onReplaceSubject,
  onSkipTodaySlot,
  onGoToCalendar
}) {
  if (!day) return null;

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

  const totalPlannedLessons = slots.reduce(
    (acc, s) => acc + (!s.isSlotCompleted && s.activeTopic ? (s.plannedLessons?.length || 0) : 0),
    0
  );
  const completedSlotsCount = isToday
    ? slots.filter((s) => s.isSlotCompleted).length
    : 0;
  const savedSeconds = hasAcceleration ? Math.max(0, dayTotalSeconds - dayAcceleratedSeconds) : 0;

  // Distribuição de tempo por disciplina no dia selecionado
  const timeBreakdown = slots
    .filter((s) => !s.isSlotCompleted && s.blockTotalAccelSec > 0)
    .map((s) => ({
      key: `${s.subjectId}-${s.slotIndex}`,
      name: s.subject.name,
      color: s.subject.color,
      textColorClass: s.textColorClass,
      seconds: s.blockTotalAccelSec,
      lessonsCount: s.plannedLessons?.length || 0
    }));

  const breakdownTotalSec = Math.max(
    1,
    timeBreakdown.reduce((acc, item) => acc + item.seconds, 0)
  );

  const isDailyGoalComplete = isToday && todayTotalSlots > 0 && completedToday.length === todayTotalSlots;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* COLUNA PRINCIPAL (8 cols): CABEÇALHO DO DIA + BLOCOS DE ESTUDO */}
      <div className="xl:col-span-8 space-y-4">
        {/* Banner Meta Diária Batida */}
        {isDailyGoalComplete && (
          <div className="bg-emerald-600 dark:bg-emerald-600/90 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold leading-tight">
                  Meta Diária Batida!
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  {cycleScheduleType === 'weekly'
                    ? 'Missão cumprida com excelência. Amanhã o cronograma avança automaticamente.'
                    : 'Missão cumprida! Avance a fila tática quando estiver pronto para o próximo dia.'}
                </p>
              </div>
            </div>
            {cycleScheduleType !== 'weekly' && (
              <button
                type="button"
                onClick={advanceDay}
                className="h-9 px-4 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <span>Avançar Ciclo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Card Principal do Dia */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Cabeçalho do Dia Selecionado */}
          <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isToday
              ? 'bg-sky-500/[0.04] dark:bg-sky-500/[0.06] border-sky-500/20'
              : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800'
          }`}>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isToday ? (
                  <span className="px-2 py-0.5 rounded-md bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Ordem do Dia
                  </span>
                ) : isPast ? (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Dia anterior
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-bold uppercase tracking-wider">
                    Previsto
                  </span>
                )}
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {dateInfo.title} · {dateInfo.dateStr}
                </span>
                {isToday && cycleScheduleType === 'weekly' && cycleCarryoverOffset > 0 && (
                  <div className="inline-flex items-center gap-1.5 flex-wrap">
                    <span
                      title={`Grade deslocada ${cycleCarryoverOffset} dia(s) para repor dia não estudado`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reposição (+{cycleCarryoverOffset}d)
                    </span>
                    <button
                      type="button"
                      onClick={resetCycleCarryover}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      Voltar à grade normal
                    </button>
                  </div>
                )}
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {dayTitle}
              </h2>
            </div>

            {/* Destaque de Tempo Total do Dia + Progresso */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isPast ? (
                dayTotalSeconds > 0 ? (
                  <span className="h-9 px-3.5 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold inline-flex items-center gap-1.5 tabular-nums">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Realizado · {formatSecondsToFriendly(dayTotalSeconds)}
                  </span>
                ) : (
                  <span className="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 font-mono text-xs font-semibold inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Não realizado
                  </span>
                )
              ) : dayTotalSeconds > 0 ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-9 px-3.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/18 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-mono text-sm font-extrabold inline-flex items-center gap-1.5 tabular-nums shadow-xs"
                    title={hasAcceleration
                      ? `Tempo em 1x: ${formatSecondsToFriendly(dayTotalSeconds)} | Poupado: ${formatSecondsToFriendly(savedSeconds)}`
                      : `Tempo total previsto: ${formatSecondsToFriendly(dayTotalSeconds)}`}
                  >
                    {hasAcceleration ? (
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span>Total: {formatSecondsToFriendly(hasAcceleration ? dayAcceleratedSeconds : dayTotalSeconds)}</span>
                  </span>
                  {hasAcceleration && (
                    <span className="text-xs font-mono text-slate-400 line-through tabular-nums hidden sm:inline">
                      {formatSecondsToFriendly(dayTotalSeconds)}
                    </span>
                  )}
                </div>
              ) : null}

              {isToday && slots.length > 0 && (
                <span className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center tabular-nums">
                  {completedSlotsCount}/{slots.length} concluídos
                </span>
              )}
            </div>
          </div>

          {/* Lista de Blocos do Dia */}
          <div className="p-4 sm:p-5 space-y-3.5">
            {slots.length === 0 ? (
              <div className="py-12 px-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-center space-y-2.5">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <div>
                  <p className="font-display text-sm font-bold text-slate-700 dark:text-slate-200">
                    Dia Livre / Descanso
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nenhum bloco de estudo programado para esta data.
                  </p>
                </div>
                {!isPast && (
                  <button
                    type="button"
                    onClick={onGoToCalendar}
                    className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Programar no Calendário</span>
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

                // Card de Dia Passado
                if (isPast) {
                  return (
                    <div
                      key={slotIndex}
                      className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${borderColorClass} bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide truncate ${textColorClass}`}>
                            {subject.name}
                          </span>
                          {(isDoubled || isReplaced) && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                              {isReplaced ? 'Subst.' : '2x'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {wasStudied ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Dia estudado · {formatMinutesToFriendly(pastMinutes)} registrados
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Não estudado · fila retomada em Hoje
                            </span>
                          )}
                        </div>
                      </div>

                      {pastActiveTopic && pastActiveTopic.completed < pastActiveTopic.total && (
                        <button
                          type="button"
                          onClick={() => onOpenPastSlotModal(slot, dateInfo)}
                          className="h-8 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-sky-600 text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                        >
                          Registrar em {dateInfo.dateStr}
                        </button>
                      )}
                    </div>
                  );
                }

                // Card de Bloco Ativo (Hoje ou Futuro)
                return (
                  <article
                    key={slotIndex}
                    className={`rounded-xl border bg-white dark:bg-slate-950/50 border-l-4 transition-colors ${
                      isSlotCompleted
                        ? 'border-emerald-300 dark:border-emerald-800/70 border-l-emerald-500 bg-emerald-500/[0.03]'
                        : `border-slate-200 dark:border-slate-800 ${borderColorClass}`
                    } p-4 space-y-3`}
                  >
                    {/* Cabeçalho do Bloco: Disciplina / Tópico sempre na mesma linha + Meta + Tempo + Notas */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/90">
                      <div
                        className="flex items-center flex-nowrap gap-1.5 min-w-0 flex-1 overflow-hidden"
                        title={activeTopic?.name ? `${subject.name} / ${activeTopic.name}` : subject.name}
                      >
                        <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-wide truncate shrink-0 max-w-[48%] ${textColorClass}`}>
                          {subject.name}
                        </span>
                        {activeTopic?.name && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate min-w-0">
                              {activeTopic.name}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(isReplaced || isDoubled) && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {isReplaced ? 'Subst.' : '2x'}
                          </span>
                        )}
                        {!isSlotCompleted && activeTopic && (remainingLessons ?? displayTotalLessons) > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-mono text-[11px] font-bold tabular-nums">
                            {aulaBadgeText}
                          </span>
                        )}
                        {!isSlotCompleted && activeTopic && blockTotalAccelSec > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 font-mono text-[11px] font-extrabold tabular-nums inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Tempo total: {formatSecondsToFriendly(blockTotalAccelSec)}
                          </span>
                        )}
                        {!isSlotCompleted && activeTopic && (
                          <button
                            type="button"
                            onClick={() => onOpenNotes(subjectId, activeTopic)}
                            className="h-7 w-7 rounded-md bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 inline-flex items-center justify-center transition-colors cursor-pointer"
                            title="Anotações do Tópico"
                            aria-label="Anotações do Tópico"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Corpo do Bloco */}
                    {isSlotCompleted ? (
                      <div className="py-2 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Aula Assistida · Bloco Concluído Hoje
                        </span>
                      </div>
                    ) : activeTopic ? (
                      <>
                        {/* Lista de Aulas com link direto no título */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {plannedLessons.map((les, lIdx) => (
                            <div
                              key={lIdx}
                              className="py-1.5 first:pt-0.5 last:pb-0.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm leading-snug"
                            >
                              <a
                                href={les.directLesHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex items-center gap-2.5 min-w-0 -mx-2 px-2 py-1.5 rounded-lg border border-transparent hover:bg-sky-500/[0.09] dark:hover:bg-sky-400/[0.12] hover:border-sky-500/35 dark:hover:border-sky-400/35 hover:shadow-xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 transition-all duration-200 ease-out cursor-pointer"
                                title={`Assistir "${les.name}" diretamente no Caveira`}
                              >
                                <span className="w-6 h-6 rounded-full bg-sky-500/12 dark:bg-sky-400/12 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 dark:group-hover:bg-sky-400 group-hover:text-white dark:group-hover:text-slate-950 group-hover:scale-110 group-hover:shadow-sm group-hover:shadow-sky-500/30 flex items-center justify-center shrink-0 transition-all duration-200">
                                  <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                </span>
                                <span className="text-slate-800 dark:text-slate-100 font-medium break-words line-clamp-2 min-w-0 flex-1 group-hover:text-sky-700 dark:group-hover:text-sky-300 group-hover:translate-x-0.5 transition-all duration-200">
                                  {les.name}
                                </span>
                                <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-sky-600/12 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 text-[11px] font-bold whitespace-nowrap shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200">
                                  <span>Assistir</span>
                                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </span>
                              </a>

                              {les.durationLabel ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/12 border border-amber-500/30 font-mono text-xs font-extrabold text-amber-700 dark:text-amber-300 tabular-nums shrink-0 justify-self-end whitespace-nowrap">
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  {les.durationLabel}
                                </span>
                              ) : (
                                <span />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Botões de Conclusão (apenas em Hoje) */}
                        {isToday && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => onOpenSlotModal(slot, true)}
                              className="h-9 px-3 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4 shrink-0" />
                              <span>Aula Assistida</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenSlotModal(slot, false)}
                              className="h-9 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Target className="w-4 h-4 text-sky-500 shrink-0" />
                              <span>Exercícios da Aula</span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                              100% da Teoria Concluída
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Você pode substituir esta vaga por outra disciplina do edital.
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onReplaceSubject({ dayIndex, slotIndex, oldSubjectId: originalSubId })}
                            className="h-8 px-3 rounded-lg bg-sky-500/12 hover:bg-sky-600 text-sky-700 dark:text-sky-300 hover:text-white border border-sky-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Shuffle className="w-3.5 h-3.5" />
                            <span>Reestruturar Vaga</span>
                          </button>
                          {isToday && (
                            <button
                              type="button"
                              onClick={() => onSkipTodaySlot(slotIndex)}
                              className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Pular hoje
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* COLUNA LATERAL (4 cols): CARGA DO DIA + MAPA RÁPIDO DA SEMANA */}
      <aside className="xl:col-span-4 space-y-4">
        {/* Card 1: Distribuição da Carga do Dia */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>Carga do dia</span>
            </h3>
            <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {totalPlannedLessons} {totalPlannedLessons === 1 ? 'aula' : 'aulas'}
            </span>
          </div>

          {timeBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
              {isPast
                ? dayTotalSeconds > 0
                  ? `${formatSecondsToFriendly(dayTotalSeconds)} estudados nesta data.`
                  : 'Sem tempo registrado nesta data.'
                : 'Nenhuma aula pendente neste dia.'}
            </p>
          ) : (
            <div className="space-y-3">
              {timeBreakdown.map((item) => {
                const pct = Math.round((item.seconds / breakdownTotalSec) * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`font-bold truncate ${item.textColorClass}`}>
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0 tabular-nums">
                        {formatSecondsToFriendly(item.seconds)}
                        <span className="text-slate-400 font-normal ml-1">({item.lessonsCount}a)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {savedSeconds > 60 && (
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Economizado com aceleração
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    -{formatSecondsToFriendly(savedSeconds)}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Card 2: Resumo Rápido dos Dias da Semana */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Ritmo da semana</span>
            </h3>
            <button
              type="button"
              onClick={onGoToCalendar}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Editar grade →
            </button>
          </div>

          <div className="space-y-1">
            {shownDays.map((d) => {
              const isSelected = d.dayIndex === selectedDayIndex;
              const sec = d.hasAcceleration ? d.dayAcceleratedSeconds : d.dayTotalSeconds;
              return (
                <button
                  key={d.dayIndex}
                  type="button"
                  onClick={() => onSelectDay(d.dayIndex)}
                  className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/35 text-slate-900 dark:text-white'
                      : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-850/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-mono text-[11px] font-bold w-8 shrink-0 ${
                      d.isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {d.dateInfo.shortName || `D${d.dayIndex + 1}`}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {d.dateInfo.dateStr}
                    </span>
                    {d.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {d.slots.length > 0 ? `${d.slots.length} ${d.slots.length === 1 ? 'bloco' : 'blocos'}` : 'Livre'}
                    </span>
                  </div>

                  <span className={`font-mono text-xs font-bold shrink-0 tabular-nums ${
                    d.isPast
                      ? sec > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                      : sec > 0
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-slate-400'
                  }`}>
                    {sec > 0 ? formatSecondsToFriendly(sec) : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
}
