import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import CaveiraReviewQuestionModal from './CaveiraReviewQuestionModal';
import {
  parseDurationToSeconds,
  formatSecondsToClock,
  formatSecondsToFriendly,
  calculateLessonsForGoal
} from '../lib/durationHelpers';
import { getSubjectTextColorClass, getSubjectAccentBorderClass } from '../lib/subjectColors';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Target,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Zap
} from 'lucide-react';

const SHORT_WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const isCaveiraCard = (rev) =>
  Boolean(
    rev?.isCaveiraQuestion ||
      rev?.questionData ||
      String(rev?.id || '').startsWith('rev_caveira_') ||
      String(rev?.topicName || '').startsWith('[Caveira')
  );

const isSubjectFullyDone = (sub) => {
  const topics = sub?.topics || [];
  if (topics.length === 0 || !topics.some((t) => (Number(t.total) || 0) > 0)) return false;
  return topics.every((t) => (Number(t.completed) || 0) >= (Number(t.total) || 0));
};

export default function AbaHoje({ onGoToTab }) {
  const {
    subjects = {},
    cycle = [],
    cycleSlotCounts = [],
    cycleScheduleType = 'weekly',
    cycleWeekStart = 'sunday',
    cycleCarryoverOffset = 0,
    currentDayIndex = 0,
    completedToday: rawCompletedToday = [],
    completedTodayDate = null,
    todayKey,
    calendarOverrides = {},
    calendarOverrideCounts = {},
    futureScheduleRules = [],
    subjectTimeGoal = {},
    reviews = [],
    getLocalDateStr,
    getCycleIndexForDate,
    setClassConfirmModal,
    setReviewModal
  } = useStore();

  const [reviewIdx, setReviewIdx] = useState(0);

  const todayDateStr = useMemo(
    () => (getLocalDateStr ? getLocalDateStr() : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getLocalDateStr, todayKey]
  );

  const todayHeaderLabel = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${SHORT_WEEKDAYS[d.getDay()]}, ${day}/${month}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  const completedToday = useMemo(
    () => (completedTodayDate === todayDateStr ? rawCompletedToday || [] : []),
    [completedTodayDate, todayDateStr, rawCompletedToday]
  );

  // Resolve os blocos programados para hoje respeitando overrides, carryover e regras v2
  const todaySchedule = useMemo(() => {
    const sanitizeSchedule = (rawSubjects, rawCounts) => {
      const validSubjects = [];
      const validCounts = [];
      (rawSubjects || []).forEach((sId, idx) => {
        if (subjects && subjects[sId]) {
          validSubjects.push(sId);
          validCounts.push(rawCounts?.[idx] ?? 0);
        }
      });
      return { daySubjects: validSubjects, daySlotCounts: validCounts };
    };

    if (calendarOverrides && Array.isArray(calendarOverrides[todayDateStr])) {
      return sanitizeSchedule(
        calendarOverrides[todayDateStr],
        calendarOverrideCounts?.[todayDateStr]
      );
    }

    const todayObj = new Date();
    const baseIdx =
      cycleScheduleType === 'weekly'
        ? getCycleIndexForDate
          ? getCycleIndexForDate(todayObj, todayObj)
          : cycleWeekStart === 'monday'
            ? (todayObj.getDay() + 6) % 7
            : todayObj.getDay()
        : currentDayIndex || 0;

    const shouldShiftCarryover = cycleScheduleType === 'weekly' && (cycleCarryoverOffset || 0) > 0;
    const effectiveCycleIdx = shouldShiftCarryover
      ? ((baseIdx - cycleCarryoverOffset) % 7 + 7) % 7
      : baseIdx;

    const effectiveDateObj = shouldShiftCarryover
      ? new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() - cycleCarryoverOffset)
      : todayObj;
    const effectiveDateStr = shouldShiftCarryover && getLocalDateStr
      ? getLocalDateStr(effectiveDateObj)
      : todayDateStr;

    if (shouldShiftCarryover && calendarOverrides && Array.isArray(calendarOverrides[effectiveDateStr])) {
      return sanitizeSchedule(
        calendarOverrides[effectiveDateStr],
        calendarOverrideCounts?.[effectiveDateStr]
      );
    }

    const effDow = effectiveDateObj.getDay();
    const matchingRules = (futureScheduleRules || [])
      .filter((r) => {
        if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effectiveDateStr) return false;
        if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
          return r.dayOfWeek === effDow;
        }
        return r.dayOfWeek === effDow || r.cycleIndex === effectiveCycleIdx;
      })
      .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

    if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
      return sanitizeSchedule(matchingRules[0].daySlots, matchingRules[0].slotCounts);
    }

    return sanitizeSchedule(
      Array.isArray(cycle?.[effectiveCycleIdx]) ? cycle[effectiveCycleIdx] : [],
      Array.isArray(cycleSlotCounts?.[effectiveCycleIdx]) ? cycleSlotCounts[effectiveCycleIdx] : []
    );
  }, [
    subjects,
    calendarOverrides,
    calendarOverrideCounts,
    todayDateStr,
    cycleScheduleType,
    cycleWeekStart,
    cycleCarryoverOffset,
    currentDayIndex,
    futureScheduleRules,
    cycle,
    cycleSlotCounts,
    getLocalDateStr,
    getCycleIndexForDate
  ]);

  // Monta os blocos de hoje com aulas sequenciais, aceleração e metadados
  const theoryBlocks = useMemo(() => {
    const simulatedIncrements = {};
    const { daySubjects, daySlotCounts } = todaySchedule;

    return daySubjects
      .map((originalSubId, slotIndex) => {
        let subjectId = originalSubId;
        let subject = subjects[subjectId];
        if (!subject) return null;

        const isSlotCompleted = completedToday.includes(slotIndex);

        let isDoubled = false;
        let isReplaced = false;
        if (!isSlotCompleted && isSubjectFullyDone(subject)) {
          const action = subject.onCompleteAction || 'keep_fixed';
          if (action === 'replace' && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
            const rep = subjects[subject.replacementSubjectId];
            if (!isSubjectFullyDone(rep)) {
              subjectId = subject.replacementSubjectId;
              subject = rep;
              isReplaced = true;
            }
          } else if (action === 'double_remaining') {
            const fallbackId = daySubjects.find(
              (sId) => sId !== originalSubId && subjects[sId] && !isSubjectFullyDone(subjects[sId])
            );
            if (fallbackId && subjects[fallbackId]) {
              subjectId = fallbackId;
              subject = subjects[fallbackId];
              isDoubled = true;
            }
          }
        }

        let activeTopic = null;
        let currentCompleted = 0;
        let currentTotal = 0;
        let blockCount = 1;
        let blockOrigSec = 0;
        let blockAccelSec = 0;
        let plannedLessons = [];
        let goalMin = 0;
        const spd = Math.max(0.5, Number(subject.speed) || 1);

        if (!isSlotCompleted) {
          let tempIncrement = simulatedIncrements[subjectId] || 0;
          const topics = subject.topics || [];

          for (const t of topics) {
            const remaining = (Number(t.total) || 0) - (Number(t.completed) || 0);
            if (tempIncrement < remaining) {
              activeTopic = t;
              currentCompleted = (Number(t.completed) || 0) + tempIncrement;
              currentTotal = Number(t.total) || 0;

              const customSlotLessons = !isDoubled && !isReplaced ? Math.floor(Number(daySlotCounts?.[slotIndex]) || 0) : 0;
              const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(subject.lessonsPerBlock) || 0);
              goalMin = customSlotLessons > 0 ? 0 : Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0;

              if (goalMin > 0 || lessonsN > 0) {
                const remainingInTopic = currentTotal - currentCompleted;
                const suggestion = calculateLessonsForGoal(
                  t.lessons || [],
                  currentCompleted,
                  spd,
                  goalMin,
                  currentTotal,
                  lessonsN
                );
                blockCount = Math.min(remainingInTopic, Math.max(1, suggestion.count));
                blockAccelSec = suggestion.totalAccelSec;
                blockOrigSec = suggestion.totalOrigSec;
                plannedLessons = suggestion.lessonsList;
              } else {
                blockCount = 1;
                const lessonEntry = t.lessons?.[currentCompleted];
                const lessonName = lessonEntry?.name || `${t.name} - Aula ${currentCompleted + 1}`;
                const durStr = lessonEntry?.duration || '';
                const origSec = parseDurationToSeconds(durStr) || 3600;
                blockOrigSec = origSec;
                blockAccelSec = Math.round(origSec / spd);
                plannedLessons = [
                  {
                    index: currentCompleted,
                    name: lessonName,
                    origSec,
                    accelSec: blockAccelSec,
                    durStr
                  }
                ];
              }

              simulatedIncrements[subjectId] = (simulatedIncrements[subjectId] || 0) + blockCount;
              break;
            } else {
              tempIncrement -= Math.max(0, remaining);
            }
          }
        }

        return {
          slotIndex,
          subjectId,
          subject,
          isSlotCompleted,
          isDoubled,
          isReplaced,
          activeTopic,
          currentCompleted,
          currentTotal,
          blockCount,
          blockOrigSec,
          blockAccelSec,
          plannedLessons,
          goalMin,
          spd
        };
      })
      .filter(Boolean);
  }, [todaySchedule, subjects, completedToday, subjectTimeGoal]);

  // Fila de revisões pendentes para hoje (Caveira primeiro para embutir inline na coluna direita)
  const dueReviews = useMemo(() => {
    const due = (reviews || []).filter((r) => r && (!todayDateStr || r.nextDateStr <= todayDateStr));
    return due.sort((a, b) => {
      const aCav = isCaveiraCard(a) ? 0 : 1;
      const bCav = isCaveiraCard(b) ? 0 : 1;
      if (aCav !== bCav) return aCav - bCav;
      return String(a.nextDateStr || '').localeCompare(String(b.nextDateStr || ''));
    });
  }, [reviews, todayDateStr]);

  const safeReviewIdx = dueReviews.length > 0 ? Math.min(reviewIdx, dueReviews.length - 1) : 0;
  const activeReview = dueReviews[safeReviewIdx] || null;
  const completedSlotsCount = theoryBlocks.filter((b) => b.isSlotCompleted).length;

  const openLessonModal = (block, skipPrePrompt) => {
    if (!block?.activeTopic || !setClassConfirmModal) return;
    const { activeTopic, currentCompleted, plannedLessons, blockCount, goalMin, subjectId, slotIndex } = block;
    const remainingLessons = (activeTopic.lessons || []).slice(currentCompleted, activeTopic.total);
    const blockLessonNames = (plannedLessons || []).map((pl) => pl?.name).filter(Boolean);
    const firstName = plannedLessons?.[0]?.name || '';
    const firstDur = plannedLessons?.[0]?.durStr || '';

    setClassConfirmModal({
      subjectId,
      slotIndex,
      topicName: activeTopic.name,
      lessonNames: blockLessonNames.length > 0 ? blockLessonNames : firstName ? [firstName] : [],
      allRemainingLessonNames: remainingLessons.map((l) => l?.name).filter(Boolean),
      maxClasses: Math.max(1, (Number(activeTopic.total) || 0) - (Number(activeTopic.completed) || 0)),
      lessonDuration: firstDur,
      allLessonsDurations: remainingLessons.map((l) => l?.duration || '60:00'),
      suggestedClasses: blockCount,
      timeGoalMinutes: goalMin || null,
      skipPrePrompt
    });
  };

  return (
    <div className="fade-in w-full pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* COLUNA ESQUERDA: TEORIA */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Teoria
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
              {theoryBlocks.length > 0 ? `${completedSlotsCount}/${theoryBlocks.length} concluídos` : 'Sem blocos'}
            </span>
          </div>

          {theoryBlocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40 p-5 text-center space-y-2.5">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="space-y-0.5">
                <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                  Nenhum bloco programado para hoje
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adicione matérias neste dia pelo Calendário ou ajuste seu Cronograma semanal.
                </p>
              </div>
              {onGoToTab && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onGoToTab('calendario')}
                    className="h-7 px-3 rounded-lg text-[11px] font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                  >
                    Abrir Calendário
                  </button>
                  <button
                    type="button"
                    onClick={() => onGoToTab('cronograma')}
                    className="h-7 px-3 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Ver Cronograma
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {theoryBlocks.map((block) => {
                const textColorClass = getSubjectTextColorClass(block.subject?.color);
                const borderColorClass = getSubjectAccentBorderClass(block.subject?.color);
                const startNum = block.currentCompleted + 1;
                const endNum = block.currentCompleted + block.blockCount;
                const totalTimeText = block.blockAccelSec > 0
                  ? formatSecondsToFriendly(block.blockAccelSec)
                  : '';

                return (
                  <div
                    key={`${block.subjectId}-${block.slotIndex}`}
                    className={`rounded-xl border bg-slate-50/70 dark:bg-slate-850/70 overflow-hidden ${
                      block.isSlotCompleted
                        ? 'border-emerald-300 dark:border-emerald-800/70'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Faixa Topo do Bloco: Dia da Semana, XX/MM + Tempo Total */}
                    <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                        <Calendar className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                        <span>{todayHeaderLabel}</span>
                      </div>
                      {totalTimeText && !block.isSlotCompleted && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-amber-600 dark:text-amber-300 tabular-nums">
                          {block.spd > 1 && <Zap className="w-4 h-4 text-amber-500 dark:text-amber-300" />}
                          <span>Tempo total: {totalTimeText}</span>
                        </div>
                      )}
                    </div>

                    {/* Caixa da Disciplina + Aulas + Botões */}
                    <div className={`p-3 m-2 rounded-lg border bg-white dark:bg-slate-900 ${borderColorClass} space-y-2.5`}>
                      {/* Cabeçalho: DISCIPLINA -> TÓPICO */}
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <div className={`text-sm font-black uppercase tracking-wide truncate ${textColorClass}`}>
                          {block.subject.name}
                          {block.activeTopic?.name ? ` → ${block.activeTopic.name}` : ''}
                        </div>
                        {(block.isReplaced || block.isDoubled) && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-300 shrink-0 uppercase">
                            {block.isReplaced ? 'Subst.' : '2x'}
                          </span>
                        )}
                      </div>

                      {block.isSlotCompleted ? (
                        <div className="py-2 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider">
                            Aula Assistida • Bloco Concluído Hoje
                          </span>
                        </div>
                      ) : block.activeTopic ? (
                        <>
                          {/* Linha AULA X/Y */}
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                            <span className="uppercase tracking-wider">
                              {block.blockCount > 1
                                ? `Aulas ${startNum}–${endNum}/${block.currentTotal}`
                                : `Aula ${startNum}/${block.currentTotal}`}
                            </span>
                            {block.spd > 1 && (
                              <span className="text-[11px] font-black text-sky-600 dark:text-sky-400">
                                {block.spd}x ativo
                              </span>
                            )}
                          </div>

                          {/* Lista de Aulas com Nome + MM:SS (spd) */}
                          <div className="space-y-1.5">
                            {block.plannedLessons.map((les, lIdx) => {
                              const origSec = Number(les.origSec) || parseDurationToSeconds(les.durStr) || 0;
                              const accelSec = Number(les.accelSec) || (origSec > 0 ? Math.round(origSec / block.spd) : 0);
                              const durationLabel =
                                accelSec > 0
                                  ? `${formatSecondsToClock(accelSec)}${block.spd > 1 ? ` (${block.spd}x)` : ''}`
                                  : les.durStr || '';

                              return (
                                <div
                                  key={lIdx}
                                  className="flex items-start justify-between gap-3 text-sm leading-snug"
                                >
                                  <span className="font-semibold text-slate-800 dark:text-slate-100 break-words flex-1 min-w-0">
                                    • {les.name}
                                  </span>
                                  {durationLabel && (
                                    <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-300 shrink-0 flex items-center gap-1 tabular-nums">
                                      <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                                      {durationLabel}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* 2 Botões: AULA ASSISTIDA + EXERCÍCIOS DA AULA */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => openLessonModal(block, true)}
                              className="h-9 px-3 rounded-lg text-xs font-black uppercase tracking-wide bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4 shrink-0" />
                              <span className="truncate">Aula Assistida</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openLessonModal(block, false)}
                              className="h-9 px-3 rounded-lg text-xs font-black uppercase tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Target className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                              <span className="truncate">Exercícios da Aula</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          100% desta disciplina já foi concluída!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COLUNA DIREITA: REVISÃO */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-sky-500 dark:text-sky-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Revisão
              </h2>
            </div>

            {dueReviews.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeReviewIdx <= 0}
                  onClick={() => setReviewIdx((i) => Math.max(0, i - 1))}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                  aria-label="Questão anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-black tabular-nums px-1.5 text-slate-600 dark:text-slate-300">
                  {safeReviewIdx + 1}/{dueReviews.length}
                </span>
                <button
                  type="button"
                  disabled={safeReviewIdx >= dueReviews.length - 1}
                  onClick={() => setReviewIdx((i) => Math.min(dueReviews.length - 1, i + 1))}
                  className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 cursor-pointer"
                  aria-label="Próxima questão"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Alerta de Questões Pendentes */}
          {dueReviews.length > 0 ? (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Você tem {dueReviews.length} {dueReviews.length === 1 ? 'questão' : 'questões'} para revisar
              </span>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Nenhuma questão pendente para revisar hoje</span>
            </div>
          )}

          {/* Questão de Revisão Inline (Raio-X Caveira ou Auditoria FSRS) */}
          {activeReview ? (
            isCaveiraCard(activeReview) ? (
              <CaveiraReviewQuestionModal
                key={activeReview.id}
                review={activeReview}
                inline={true}
                onClose={() => {}}
                onCompleted={() => setReviewIdx(0)}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-4 space-y-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                    Revisão Programada FSRS
                  </span>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                    {activeReview.topicName || 'Revisão de Tópico'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModal && setReviewModal(activeReview)}
                  className="w-full h-8 rounded-lg text-xs font-black uppercase tracking-wider bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                >
                  Avaliar Retenção Agora
                </button>
              </div>
            )
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40 p-5 text-center space-y-2">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Sua fila de revisão FSRS está zerada.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Novas questões do Raio-X Caveira marcadas para revisão aparecerão aqui automaticamente.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
