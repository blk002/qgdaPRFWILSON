import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import CaveiraReviewQuestionModal from './CaveiraReviewQuestionModal';
import StudyConsistencyHeatmap from './StudyConsistencyHeatmap';
import {
  parseDurationToSeconds,
  formatSecondsToClock,
  formatSecondsToFriendly,
  calculateLessonsForGoal
} from '../lib/durationHelpers';
import { getSubjectTextColorClass, getSubjectAccentBorderClass } from '../lib/subjectColors';
import { getSafeExternalUrl } from '../lib/safeUrl';
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
  Zap,
  Pencil
} from 'lucide-react';

const SHORT_WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function formatDurationHMS(totalSec) {
  const safe = Math.max(0, Math.round(Number(totalSec) || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

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

const normalizeLessonTitleKey = (str) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const extractCourseIdFromUrl = (url) => {
  const match = String(url || '').match(/\/courses\/(\d+)/i);
  return match ? match[1] : '';
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
    caveiraQuestions = [],
    caveiraDailyGoal = 50,
    caveiraSessionStats = null,
    caveiraCourseIndexMap = {},
    setCaveiraDailyGoal,
    getLocalDateStr,
    getCycleIndexForDate,
    setClassConfirmModal,
    setReviewModal
  } = useStore();

  const [reviewIdx, setReviewIdx] = useState(0);
  const [isEditingQGoal, setIsEditingQGoal] = useState(false);
  const [qGoalDraft, setQGoalDraft] = useState(caveiraDailyGoal || 50);

  const todayDateStr = useMemo(
    () => (getLocalDateStr ? getLocalDateStr() : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getLocalDateStr, todayKey]
  );

  const caveiraStats = useMemo(() => {
    const list = Array.isArray(caveiraQuestions) ? caveiraQuestions.filter(Boolean) : [];
    const total = list.length;
    const hits = list.filter((q) => q && q.hit).length;
    const errors = list.filter((q) => q && !q.hit).length;
    const totalSeconds = list.reduce((acc, q) => acc + (Number(q?.durationSeconds) || 0), 0);
    const avgTimeSec = total > 0 ? Math.round(totalSeconds / total) : 0;

    // Questões respondidas hoje (pela sessão da extensão se for de hoje, ou pelo timestamp das questões)
    const todayFromQuestions = list.filter((q) => {
      if (!q?.timestamp) return false;
      const d = new Date(q.timestamp);
      if (isNaN(d.getTime())) return false;
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayDateStr;
    }).length;

    const extSessionToday =
      caveiraSessionStats && caveiraSessionStats.date === todayDateStr
        ? Number(caveiraSessionStats.total) || 0
        : 0;
    const todayAnswered = Math.max(todayFromQuestions, extSessionToday);

    return { total, hits, errors, totalSeconds, avgTimeSec, todayAnswered };
  }, [caveiraQuestions, caveiraSessionStats, todayDateStr]);

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

        const subjectTopics = subject.topics || [];
        const subjectTotalLessons = subjectTopics.reduce((acc, tp) => acc + (Number(tp?.total) || 0), 0);
        const subjectCompletedBase = subjectTopics.reduce(
          (acc, tp) => acc + Math.min(Number(tp?.total) || 0, Number(tp?.completed) || 0),
          0
        );
        const priorSubjectIncrement = simulatedIncrements[subjectId] || 0;
        const subjectCompletedBefore = subjectCompletedBase + priorSubjectIncrement;

        if (!isSlotCompleted) {
          let tempIncrement = priorSubjectIncrement;
          const topics = subjectTopics;

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
          subjectCompletedBefore,
          subjectTotalLessons,
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
  const totalTheoryAccelSec = useMemo(
    () => theoryBlocks.reduce((acc, b) => acc + (b.isSlotCompleted ? 0 : (Number(b.blockAccelSec) || 0)), 0),
    [theoryBlocks]
  );
  const hasAcceleratedTheory = useMemo(
    () => theoryBlocks.some((b) => !b.isSlotCompleted && (Number(b.blockAccelSec) || 0) > 0 && b.spd > 1),
    [theoryBlocks]
  );

  // Mapa de URLs das aulas capturadas + fallback inteligente de curso no Caveira
  const { courseIndexUrlByTitle, fallbackCaveiraCourseBaseUrl } = useMemo(() => {
    const byTitle = new Map();
    let inferredCourseId = '';

    Object.values(caveiraCourseIndexMap || {}).forEach((entry) => {
      if (!entry || !entry.url) return;
      const key = normalizeLessonTitleKey(entry.title || entry.lessonTitle || '');
      if (key && !byTitle.has(key)) {
        byTitle.set(key, entry.url);
      }
      if (!inferredCourseId) {
        inferredCourseId = extractCourseIdFromUrl(entry.url);
      }
    });

    if (!inferredCourseId) {
      for (const sub of Object.values(subjects || {})) {
        if (!sub) continue;
        if (sub.caveiraCourseId) {
          inferredCourseId = String(sub.caveiraCourseId);
          break;
        }
        const fromMod = extractCourseIdFromUrl(sub.caveiraModuleUrl);
        if (fromMod) {
          inferredCourseId = fromMod;
          break;
        }
        for (const tp of sub.topics || []) {
          for (const ls of tp?.lessons || []) {
            const fromLes = extractCourseIdFromUrl(ls?.caveiraUrl || ls?.url);
            if (fromLes) {
              inferredCourseId = fromLes;
              break;
            }
          }
          if (inferredCourseId) break;
        }
        if (inferredCourseId) break;
      }
    }

    return {
      courseIndexUrlByTitle: byTitle,
      fallbackCaveiraCourseBaseUrl: inferredCourseId
        ? `https://app.caveira.com/courses/${inferredCourseId}`
        : 'https://app.caveira.com/courses'
    };
  }, [caveiraCourseIndexMap, subjects]);

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
    <div className="fade-in w-full pb-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* COLUNA ESQUERDA: TEORIA */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                Teoria de hoje
              </h2>
            </div>

            {totalTheoryAccelSec > 0 && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/45 dark:border-amber-400/45 text-amber-700 dark:text-amber-300 shadow-xs shrink-0"
                title="Tempo total somado de todas as aulas pendentes de hoje"
              >
                {hasAcceleratedTheory ? (
                  <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                )}
                <span className="text-[11px] font-sans font-bold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/85">
                  Total:
                </span>
                <span className="font-mono text-sm font-extrabold tabular-nums">
                  {formatSecondsToFriendly(totalTheoryAccelSec)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
              <span>{todayHeaderLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {theoryBlocks.length > 0 ? `${completedSlotsCount}/${theoryBlocks.length} concluídos` : 'Sem blocos'}
              </span>
            </div>
          </div>

          {theoryBlocks.length === 0 ? (
            <div className="my-auto py-8 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Nenhum bloco programado para hoje
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Adicione disciplinas no Calendário ou configure seu Cronograma semanal para ver suas aulas aqui.
                </p>
              </div>
              {onGoToTab && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onGoToTab('calendario')}
                    className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                  >
                    Abrir calendário
                  </button>
                  <button
                    type="button"
                    onClick={() => onGoToTab('cronograma')}
                    className="h-9 px-3.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Ver cronograma
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {theoryBlocks.map((block) => {
                const textColorClass = getSubjectTextColorClass(block.subject?.color);
                const accentBorderClass = getSubjectAccentBorderClass(block.subject?.color);
                const displayTotalLessons = block.subjectTotalLessons > 0 ? block.subjectTotalLessons : block.currentTotal;
                const startBase = block.subjectTotalLessons > 0 ? block.subjectCompletedBefore : block.currentCompleted;
                const startNum = displayTotalLessons > 0 ? Math.min(displayTotalLessons, startBase + 1) : 1;
                const endNum = displayTotalLessons > 0 ? Math.min(displayTotalLessons, startBase + block.blockCount) : (startBase + block.blockCount);
                const aulaBadgeText = (block.blockCount > 1 && endNum > startNum)
                  ? `Aulas ${startNum}–${endNum}/${displayTotalLessons}`
                  : `Aula ${startNum}/${displayTotalLessons}`;
                const totalTimeText = block.blockAccelSec > 0
                  ? formatSecondsToFriendly(block.blockAccelSec)
                  : '';

                return (
                  <div
                    key={`${block.subjectId}-${block.slotIndex}`}
                    className="py-4 first:pt-4 last:pb-1"
                  >
                    <div className={`border-l-2 pl-3.5 space-y-3 ${block.isSlotCompleted ? 'border-emerald-500/60' : accentBorderClass}`}>
                      {/* Cabeçalho limpo do bloco */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className="flex items-center gap-1.5 flex-nowrap min-w-0"
                            title={block.activeTopic?.name ? `${block.subject.name} / ${block.activeTopic.name}` : block.subject.name}
                          >
                            <h3 className={`text-sm font-bold tracking-tight whitespace-nowrap shrink-0 max-w-[50%] truncate ${textColorClass}`}>
                              {block.subject.name}
                            </h3>
                            {block.activeTopic?.name && (
                              <>
                                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate min-w-0">
                                  {block.activeTopic.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {!block.isSlotCompleted && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0 tabular-nums flex-wrap">
                            {(block.isReplaced || block.isDoubled) && (
                              <>
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  {block.isReplaced ? 'Substituída' : 'Dobrada 2x'}
                                </span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            {block.activeTopic && displayTotalLessons > 0 && (
                              <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                                {aulaBadgeText}
                              </span>
                            )}
                            {totalTimeText && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/12 dark:bg-amber-400/12 border border-amber-500/30 dark:border-amber-400/30 font-mono font-bold text-amber-700 dark:text-amber-300">
                                  {block.spd > 1 && <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />}
                                  <span className="text-amber-800/80 dark:text-amber-200/80 font-sans font-semibold">Tempo total:</span>
                                  <span>{totalTimeText}</span>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {block.isSlotCompleted ? (
                        <div className="py-2.5 px-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-semibold">
                            Aula assistida · Bloco concluído hoje
                          </span>
                        </div>
                      ) : block.activeTopic ? (
                        <>
                          {/* Lista de aulas planejadas com botão Abrir Videoaula */}
                          <div className="space-y-2">
                            {block.plannedLessons.map((les, lIdx) => {
                              const origSec = Number(les.origSec) || parseDurationToSeconds(les.durStr) || 0;
                              const accelSec = Number(les.accelSec) || (origSec > 0 ? Math.round(origSec / block.spd) : 0);
                              const durationLabel =
                                accelSec > 0
                                  ? `${formatSecondsToClock(accelSec)}${block.spd > 1 ? ` (${block.spd}x)` : ''}`
                                  : les.durStr || '';

                              const lessonEntry = block.activeTopic?.lessons?.[les.index ?? lIdx];
                              const indexedUrl = courseIndexUrlByTitle.get(normalizeLessonTitleKey(les.name)) || '';
                              const rawDirectUrl =
                                lessonEntry?.caveiraUrl ||
                                lessonEntry?.url ||
                                indexedUrl ||
                                block.subject?.caveiraModuleUrl ||
                                (block.subject?.caveiraCourseId ? `https://app.caveira.com/courses/${block.subject.caveiraCourseId}` : '') ||
                                fallbackCaveiraCourseBaseUrl;

                              const safeBaseUrl = getSafeExternalUrl(rawDirectUrl, 'https://app.caveira.com/courses');
                              const cleanBase = safeBaseUrl.split('#')[0];
                              const directUrl = les.name
                                ? `${cleanBase}#qg_lesson=${encodeURIComponent(les.name)}${block.subject?.name ? `&qg_subject=${encodeURIComponent(block.subject.name)}` : ''}`
                                : cleanBase;

                              return (
                                <div
                                  key={lIdx}
                                  className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_7.75rem] items-center gap-x-3 gap-y-1 text-sm leading-snug"
                                >
                                  <span
                                    className="text-slate-700 dark:text-slate-200 break-words line-clamp-2 min-w-0"
                                    title={les.name}
                                  >
                                    • {les.name}
                                  </span>
                                  <a
                                    href={directUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/12 hover:bg-sky-500/22 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-semibold transition-colors shrink-0 whitespace-nowrap"
                                    title={`Abrir "${les.name}" diretamente no Caveira`}
                                  >
                                    <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Abrir Videoaula</span>
                                  </a>
                                  <span className="col-span-2 sm:col-span-1 inline-flex items-center sm:justify-end">
                                    {durationLabel && (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/12 dark:bg-amber-400/12 border border-amber-500/35 dark:border-amber-400/35 text-xs sm:text-[13px] font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums whitespace-nowrap">
                                        <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                        <span>{durationLabel}</span>
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Ações primária e secundária */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => openLessonModal(block, true)}
                              className="h-10 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <PlayCircle className="w-4 h-4 shrink-0" />
                              <span className="truncate">Aula Assistida</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openLessonModal(block, false)}
                              className="h-10 px-3.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <Target className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                              <span className="truncate">Exercícios da Aula</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Disciplina 100% concluída.
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
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <BrainCircuit className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                Fila de revisão
              </h2>
            </div>

            {dueReviews.length > 1 ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={safeReviewIdx <= 0}
                  onClick={() => setReviewIdx((i) => Math.max(0, i - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 flex items-center justify-center cursor-pointer"
                  aria-label="Questão anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-semibold tabular-nums px-2 text-slate-600 dark:text-slate-300">
                  {safeReviewIdx + 1}/{dueReviews.length}
                </span>
                <button
                  type="button"
                  disabled={safeReviewIdx >= dueReviews.length - 1}
                  onClick={() => setReviewIdx((i) => Math.min(dueReviews.length - 1, i + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 flex items-center justify-center cursor-pointer"
                  aria-label="Próxima questão"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className={`text-xs font-medium ${dueReviews.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {dueReviews.length > 0 ? '1 pendente' : 'Em dia'}
              </span>
            )}
          </div>

          {/* Status de pendências */}
          {dueReviews.length > 0 ? (
            <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Você tem <strong className="font-mono font-bold tabular-nums">{dueReviews.length}</strong>{' '}
                {dueReviews.length === 1 ? 'item agendado' : 'itens agendados'} para revisar hoje.
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Nenhuma revisão pendente para hoje.</span>
            </div>
          )}

          {/* Questão de Revisão Inline */}
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
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-sky-600 dark:text-sky-400 block">
                    Revisão programada FSRS
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {activeReview.topicName || 'Revisão de tópico'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModal && setReviewModal(activeReview)}
                  className="w-full h-10 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                >
                  Avaliar retenção agora
                </button>
              </div>
            )
          ) : (
            <div className="my-auto py-8 px-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Fila de revisão zerada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Novas questões do Raio-X Caveira e revisões de aulas concluídas aparecerão aqui automaticamente.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Consistência + Métricas de Questões */}
      <div className="flex flex-col xl:flex-row items-stretch gap-5">
        <StudyConsistencyHeatmap />

        <div className="flex-1 min-w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800">
          {(() => {
            const safeGoal = Math.max(5, Number(caveiraDailyGoal) || 50);
            const pct = Math.min(100, Math.round((caveiraStats.todayAnswered / safeGoal) * 100));
            const isGoalMet = caveiraStats.todayAnswered >= safeGoal;
            return (
              <div className="pb-3.5 first:pt-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Meta diária de questões</span>
                  </span>
                  {isEditingQGoal ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={qGoalDraft}
                        onChange={(e) => setQGoalDraft(e.target.value)}
                        className="w-16 h-7 px-2 rounded-md border border-sky-500 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-semibold text-center text-slate-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (setCaveiraDailyGoal) setCaveiraDailyGoal(qGoalDraft);
                          setIsEditingQGoal(false);
                        }}
                        className="h-7 px-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono font-semibold tabular-nums ${isGoalMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {caveiraStats.todayAnswered}/{safeGoal} ({pct}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQGoalDraft(safeGoal);
                          setIsEditingQGoal(true);
                        }}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                        title="Alterar meta diária de questões"
                        aria-label="Alterar meta diária de questões"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isGoalMet ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Questões respondidas
            </span>
            <span className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {caveiraStats.total}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Acertos
            </span>
            <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {caveiraStats.hits}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Erros
            </span>
            <span className="text-base font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
              {caveiraStats.errors}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tempo total em questões
            </span>
            <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatDurationHMS(caveiraStats.totalSeconds)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tempo médio por questão
            </span>
            <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatDurationHMS(caveiraStats.avgTimeSec)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
