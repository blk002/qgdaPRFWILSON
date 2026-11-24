import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  AlertTriangle,
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Calendar,
  LayoutGrid,
  Focus,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfetti } from '../hooks/useConfetti';
import NotesDrawer from '../components/NotesDrawer';
import CronogramaDayWorkbench from '../components/ciclo/CronogramaDayWorkbench';
import CronogramaWeekGrid from '../components/ciclo/CronogramaWeekGrid';
import {
  parseDurationToSeconds,
  formatSecondsToClock,
  formatSecondsToFriendly,
  calculateLessonsForGoal
} from '../lib/durationHelpers';
import { getSubjectTextColorClass, getSubjectAccentBorderClass } from '../lib/subjectColors';
import { getSafeExternalUrl } from '../lib/safeUrl';

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

const MAX_WEEK_OFFSET = 26;

export default function Ciclo() {
  const navigate = useNavigate();
  const {
    getPendingReviews,
    subjects,
    getThermometer,
    completedToday: rawCompletedToday,
    completedTodayDate,
    slotProgressToday: rawSlotProgressToday = {},
    todayKey,
    setCompletedToday,
    cycle,
    cycleSlotCounts,
    currentDayIndex,
    advanceDay,
    getActiveTopic,
    getRelativeDateInfo,
    getLocalDateStr,
    setClassConfirmModal,
    setReplaceSubjectModal,
    saveTopicNotes,
    subjectTimeGoal,
    cycleScheduleType,
    cycleWeekStart,
    cycleCarryoverOffset = 0,
    resetCycleCarryover,
    setCurrentDayIndex,
    studyHistory,
    calendarOverrides,
    calendarOverrideCounts,
    futureScheduleRules,
    caveiraCourseIndexMap = {}
  } = useStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('focus'); // 'focus' | 'week'
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [trackedCurrentDayIndex, setTrackedCurrentDayIndex] = useState(currentDayIndex);
  if (trackedCurrentDayIndex !== currentDayIndex) {
    setTrackedCurrentDayIndex(currentDayIndex);
    if (weekOffset === 0) {
      setSelectedDayIndex(null);
    }
  }
  const effectiveSelectedDayIndex = selectedDayIndex ?? (weekOffset === 0 ? currentDayIndex : 0);
  const [showReviewsDrawer, setShowReviewsDrawer] = useState(true);

  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [noteContent, setNoteContent] = useState('');

  // URL fallback index para abrir videoaulas diretamente no Caveira
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

  // Blocos concluídos só valem se foram marcados hoje
  const completedToday = useMemo(
    () => (completedTodayDate === getLocalDateStr() ? (rawCompletedToday || []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedTodayDate, rawCompletedToday, getLocalDateStr, todayKey]
  );

  const slotProgressToday = useMemo(
    () =>
      completedTodayDate === getLocalDateStr() &&
      rawSlotProgressToday &&
      typeof rawSlotProgressToday === 'object'
        ? rawSlotProgressToday
        : {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedTodayDate, rawSlotProgressToday, getLocalDateStr, todayKey]
  );

  const allPendingReviews = getPendingReviews();
  const pendingReviews = allPendingReviews.slice(0, 4);

  // Sincroniza o dia atual quando em modo semanal
  useEffect(() => {
    if (cycleScheduleType === 'weekly') {
      const today = new Date();
      const todayDOW = today.getDay();
      const currentWeekIndex = cycleWeekStart === 'monday' ? (todayDOW + 6) % 7 : todayDOW;
      if (currentDayIndex !== currentWeekIndex) {
        setCurrentDayIndex(currentWeekIndex);
      }
    }
  }, [cycleScheduleType, cycleWeekStart, currentDayIndex, setCurrentDayIndex, todayKey]);

  // Simulação completa e sequencial de todos os dias (semanas intermediárias + semana exibida)
  const { computedShownDays, todayTotalSlots } = useMemo(() => {
    const getDateInfo = (dayIndex, week = 0) => {
      const base = getRelativeDateInfo(dayIndex);
      if (!week || cycleScheduleType !== 'weekly') return base;
      const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      const dayDiff = (base.dayDiff || 0) + week * 7;
      const target = new Date();
      target.setDate(target.getDate() + dayDiff);
      return {
        ...base,
        title: diasSemana[target.getDay()],
        shortName: diasSemana[target.getDay()],
        dateStr: `${String(target.getDate()).padStart(2, '0')}/${String(target.getMonth() + 1).padStart(2, '0')}`,
        fullDateStr: getLocalDateStr(target),
        isToday: false,
        isPast: false,
        isFuture: true,
        dayDiff
      };
    };

    const getEffectiveDaySchedule = (dayIndex, week = 0) => {
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

      const dateInfo = getDateInfo(dayIndex, week);

      if (calendarOverrides && Array.isArray(calendarOverrides[dateInfo.fullDateStr])) {
        return sanitizeSchedule(
          calendarOverrides[dateInfo.fullDateStr],
          calendarOverrideCounts?.[dateInfo.fullDateStr]
        );
      }

      const shouldShiftCarryover = cycleScheduleType === 'weekly' && dateInfo.isToday && (cycleCarryoverOffset || 0) > 0;
      const effectiveCycleIdx = shouldShiftCarryover
        ? (((dayIndex - cycleCarryoverOffset) % 7) + 7) % 7
        : dayIndex;
      let daySubjects = Array.isArray(cycle?.[effectiveCycleIdx]) ? [...cycle[effectiveCycleIdx]] : [];
      let daySlotCounts = Array.isArray(cycleSlotCounts?.[effectiveCycleIdx]) ? [...cycleSlotCounts[effectiveCycleIdx]] : [];

      const parts = String(dateInfo.fullDateStr).split('-').map(Number);
      const baseDateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
      const effectiveDateObj = shouldShiftCarryover
        ? new Date(baseDateObj.getFullYear(), baseDateObj.getMonth(), baseDateObj.getDate() - cycleCarryoverOffset)
        : baseDateObj;
      const effectiveDateStr = shouldShiftCarryover ? getLocalDateStr(effectiveDateObj) : dateInfo.fullDateStr;

      if (shouldShiftCarryover && calendarOverrides && Array.isArray(calendarOverrides[effectiveDateStr])) {
        return sanitizeSchedule(
          calendarOverrides[effectiveDateStr],
          calendarOverrideCounts?.[effectiveDateStr]
        );
      }

      const dayOfWeek = effectiveDateObj.getDay();
      const matchingRules = (futureScheduleRules || [])
        .filter((r) => {
          if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effectiveDateStr) return false;
          if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
            return r.dayOfWeek === dayOfWeek;
          }
          return r.dayOfWeek === dayOfWeek || r.cycleIndex === effectiveCycleIdx;
        })
        .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

      if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
        daySubjects = [...matchingRules[0].daySlots];
        daySlotCounts = Array.isArray(matchingRules[0].slotCounts) ? [...matchingRules[0].slotCounts] : [];
      }

      return sanitizeSchedule(daySubjects, daySlotCounts);
    };

    const visibleDays = [];
    if (cycleScheduleType === 'weekly') {
      for (let week = 0; week <= weekOffset; week++) {
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const sched = getEffectiveDaySchedule(dayIndex, week);
          visibleDays.push({
            daySubjects: sched.daySubjects,
            daySlotCounts: sched.daySlotCounts,
            dayIndex,
            week,
            dateInfo: getDateInfo(dayIndex, week)
          });
        }
      }
    } else if (cycle && cycle.length > 0) {
      const safeCurrentDayIndex = currentDayIndex % cycle.length;
      for (let i = 0; i < cycle.length; i++) {
        const dayIndex = (safeCurrentDayIndex + i) % cycle.length;
        const sched = getEffectiveDaySchedule(dayIndex, 0);
        visibleDays.push({
          daySubjects: sched.daySubjects,
          daySlotCounts: sched.daySlotCounts,
          dayIndex,
          week: 0,
          dateInfo: getRelativeDateInfo(dayIndex)
        });
      }
    }

    const simulatedIncrements = {};
    const isSubDoneWithSim = (sub, simMap) => {
      const topics = sub?.topics || [];
      if (topics.length === 0 || !topics.some((t) => (t.total || 0) > 0)) return false;
      const remTotal = topics.reduce((acc, t) => acc + Math.max(0, (t.total || 0) - (t.completed || 0)), 0);
      return (simMap?.[sub.id] || 0) >= remTotal;
    };

    const resolvedShownDays = [];

    visibleDays.forEach(({ daySubjects: rawDaySubjects, daySlotCounts: rawSlotCounts, dayIndex, week, dateInfo }) => {
      const daySubjects = [...(rawDaySubjects || [])];
      const daySlotCounts = [...(rawSlotCounts || [])];
      const isToday = dateInfo.isToday;
      const isPast = dateInfo.isPast;

      let dayTotalSeconds = 0;
      let dayAcceleratedSeconds = 0;
      const slots = [];

      if (isPast) {
        const pastMinutes = studyHistory?.[dateInfo.fullDateStr] || 0;
        dayTotalSeconds = pastMinutes * 60;
        dayAcceleratedSeconds = dayTotalSeconds;

        if (week === weekOffset) {
          daySubjects.forEach((originalSubId, slotIndex) => {
            let subjectId = originalSubId;
            let subject = subjects[subjectId];
            if (!subject) return;
            const isOriginalDone = isSubDoneWithSim(subject, simulatedIncrements);
            let isDoubled = false;
            let isReplaced = false;
            if (isOriginalDone) {
              const action = subject.onCompleteAction || 'keep_fixed';
              if (action === 'replace' && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
                const rep = subjects[subject.replacementSubjectId];
                if (!isSubDoneWithSim(rep, simulatedIncrements)) {
                  subjectId = subject.replacementSubjectId;
                  subject = rep;
                  isReplaced = true;
                }
              } else if (action === 'double_remaining') {
                const fallbackId = daySubjects.find(
                  (sId) => sId !== originalSubId && subjects[sId] && !isSubDoneWithSim(subjects[sId], simulatedIncrements)
                );
                if (fallbackId && subjects[fallbackId]) {
                  subjectId = fallbackId;
                  subject = subjects[fallbackId];
                  isDoubled = true;
                }
              }
            }

            const pastActiveTopic = getActiveTopic ? getActiveTopic(subjectId) : null;
            slots.push({
              slotIndex,
              originalSubId,
              subjectId,
              subject,
              textColorClass: getSubjectTextColorClass(subject.color),
              borderColorClass: getSubjectAccentBorderClass(subject.color),
              isReplaced,
              isDoubled,
              isSlotCompleted: false,
              pastMinutes,
              wasStudied: pastMinutes > 0,
              pastActiveTopic,
              daySlotCount: Math.floor(Number(daySlotCounts?.[slotIndex]) || 0),
              blockTotalAccelSec: 0,
              plannedLessons: []
            });
          });
        }
      } else {
        daySubjects.forEach((originalSubId, slotIndex) => {
          let subjectId = originalSubId;
          let subject = subjects[subjectId];
          if (!subject) return;

          const isSlotCompleted = isToday && completedToday.includes(slotIndex);

          const isOriginalDone = isSubDoneWithSim(subject, simulatedIncrements);
          let isDoubled = false;
          let isReplaced = false;
          if (isOriginalDone) {
            const action = subject.onCompleteAction || 'keep_fixed';
            if (action === 'replace' && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
              const rep = subjects[subject.replacementSubjectId];
              if (!isSubDoneWithSim(rep, simulatedIncrements)) {
                subjectId = subject.replacementSubjectId;
                subject = rep;
                isReplaced = true;
              }
            } else if (action === 'double_remaining') {
              const fallbackId = daySubjects.find(
                (sId) => sId !== originalSubId && subjects[sId] && !isSubDoneWithSim(subjects[sId], simulatedIncrements)
              );
              if (fallbackId && subjects[fallbackId]) {
                subjectId = fallbackId;
                subject = subjects[fallbackId];
                isDoubled = true;
              }
            }
          }

          let activeTopic = null;
          let activeLessonName = '';
          let activeLessonDuration = '';
          let currentCompleted = 0;
          let currentTotal = 0;
          let blockCount = 1;
          let plannedLessons = [];
          let goalMin = 0;
          let spd = 1;
          let blockTotalOrigSec = 0;
          let blockTotalAccelSec = 0;

          const subjectTopicsList = subject.topics || [];
          const subjectTotalLessons = subjectTopicsList.reduce((acc, tp) => acc + (Number(tp?.total) || 0), 0);
          const subjectCompletedBase = subjectTopicsList.reduce(
            (acc, tp) => acc + Math.min(Number(tp?.total) || 0, Number(tp?.completed) || 0),
            0
          );
          const priorSubjectIncrement = simulatedIncrements[subjectId] || 0;
          const subjectCompletedBefore = subjectCompletedBase + priorSubjectIncrement;

          const slotProgress = isToday ? slotProgressToday?.[slotIndex] : null;
          const isValidSlotProgress =
            isToday &&
            !isSlotCompleted &&
            slotProgress &&
            (!slotProgress.subjectId || slotProgress.subjectId === subjectId) &&
            Number(slotProgress.target) > 0;
          const watchedInSlotToday = isValidSlotProgress ? Math.max(0, Number(slotProgress.watched) || 0) : 0;
          const targetLessonsInSlot = isValidSlotProgress ? Math.max(1, Number(slotProgress.target) || 1) : 0;
          const remainingInSlotToday = targetLessonsInSlot > 0 ? Math.max(1, targetLessonsInSlot - watchedInSlotToday) : 0;

          if (!isSlotCompleted) {
            let tempIncrement = priorSubjectIncrement;
            let found = false;

            for (const t of subjectTopicsList) {
              const remaining = t.total - t.completed;
              if (tempIncrement < remaining) {
                activeTopic = t;
                currentCompleted = t.completed + tempIncrement;
                currentTotal = t.total;
                spd = Number(subject.speed) || 1;
                const customSlotLessons = !isDoubled && !isReplaced ? Math.floor(Number(daySlotCounts?.[slotIndex]) || 0) : 0;
                const baseLessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(subject.lessonsPerBlock) || 0);
                const lessonsN = remainingInSlotToday > 0 ? remainingInSlotToday : baseLessonsN;
                goalMin = remainingInSlotToday > 0
                  ? 0
                  : customSlotLessons > 0
                    ? 0
                    : (Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0);

                if (goalMin > 0 || lessonsN > 0) {
                  const remainingInTopic = t.total - currentCompleted;
                  const suggestion = calculateLessonsForGoal(t.lessons || [], currentCompleted, spd, goalMin, t.total, lessonsN);
                  blockCount = Math.min(remainingInTopic, Math.max(1, suggestion.count));
                  plannedLessons = suggestion.lessonsList;
                  blockTotalOrigSec = suggestion.totalOrigSec;
                  blockTotalAccelSec = suggestion.totalAccelSec;
                  const firstLesson = plannedLessons[0];
                  activeLessonName = firstLesson?.name || t.lessons?.[currentCompleted]?.name || `${t.name} - Aula ${currentCompleted + 1}`;
                  activeLessonDuration = firstLesson?.durStr || t.lessons?.[currentCompleted]?.duration || '';
                } else {
                  blockCount = 1;
                  const lessonEntry = t.lessons?.[currentCompleted];
                  activeLessonName = lessonEntry?.name || `${t.name} - Aula ${currentCompleted + 1}`;
                  activeLessonDuration = lessonEntry?.duration || '';
                  const origSec = parseDurationToSeconds(activeLessonDuration) || 3600;
                  const accelSec = Math.round(origSec / spd);
                  blockTotalOrigSec = origSec;
                  blockTotalAccelSec = accelSec;
                  plannedLessons = [
                    {
                      index: currentCompleted,
                      name: activeLessonName,
                      origSec,
                      accelSec,
                      durStr: activeLessonDuration
                    }
                  ];
                }

                dayTotalSeconds += blockTotalOrigSec;
                dayAcceleratedSeconds += blockTotalAccelSec;
                found = true;
                break;
              } else {
                tempIncrement -= remaining;
              }
            }

            if (found) {
              simulatedIncrements[subjectId] = (simulatedIncrements[subjectId] || 0) + blockCount;
            }
          }

          if (week === weekOffset) {
            const displayTotalLessons = subjectTotalLessons > 0 ? subjectTotalLessons : currentTotal;
            const startBase = subjectTotalLessons > 0 ? subjectCompletedBefore : currentCompleted;
            const remainingLessons = Math.max(0, displayTotalLessons - startBase);
            const aulaBadgeText = remainingLessons === 1
              ? 'Falta 1 aula'
              : `Faltam ${remainingLessons} aulas`;

            const enrichedLessons = plannedLessons.map((les, lIdx) => {
              const origSec = Number(les.origSec) || parseDurationToSeconds(les.durStr) || 0;
              const accelSec = Number(les.accelSec) || (origSec > 0 ? Math.round(origSec / spd) : 0);
              const durationLabel = accelSec > 0
                ? `${formatSecondsToClock(accelSec)}${spd > 1 ? ` (${spd}x)` : ''}`
                : les.durStr || '';

              const lessonEntry = activeTopic?.lessons?.[les.index ?? lIdx];
              const indexedUrl = courseIndexUrlByTitle.get(normalizeLessonTitleKey(les.name)) || '';
              const rawLesHref = lessonEntry?.caveiraUrl
                || lessonEntry?.url
                || indexedUrl
                || subject?.caveiraModuleUrl
                || (subject?.caveiraCourseId ? `https://app.caveira.com/courses/${subject.caveiraCourseId}` : '')
                || fallbackCaveiraCourseBaseUrl;
              const safeBaseUrl = getSafeExternalUrl(rawLesHref, 'https://app.caveira.com/courses');
              const cleanBase = safeBaseUrl.split('#')[0];
              const directLesHref = les.name
                ? `${cleanBase}#qg_lesson=${encodeURIComponent(les.name)}${subject?.name ? `&qg_subject=${encodeURIComponent(subject.name)}` : ''}`
                : cleanBase;

              return {
                ...les,
                durationLabel,
                directLesHref
              };
            });

            slots.push({
              slotIndex,
              originalSubId,
              subjectId,
              subject,
              textColorClass: getSubjectTextColorClass(subject.color),
              borderColorClass: getSubjectAccentBorderClass(subject.color),
              isReplaced,
              isDoubled,
              isSlotCompleted,
              activeTopic,
              activeLessonName,
              activeLessonDuration,
              currentCompleted,
              currentTotal,
              blockCount,
              watchedInSlotToday,
              slotTargetCount: targetLessonsInSlot > 0 ? targetLessonsInSlot : blockCount,
              plannedLessons: enrichedLessons,
              goalMin,
              spd,
              blockTotalOrigSec,
              blockTotalAccelSec,
              aulaBadgeText,
              displayTotalLessons,
              remainingLessons
            });
          }
        });
      }

      if (week === weekOffset) {
        resolvedShownDays.push({
          dayIndex,
          week,
          dateInfo,
          isToday,
          isPast,
          dayTotalSeconds,
          dayAcceleratedSeconds,
          hasAcceleration: dayAcceleratedSeconds > 0 && dayAcceleratedSeconds < dayTotalSeconds,
          slots
        });
      }
    });

    const todaySlotsCount = getEffectiveDaySchedule(currentDayIndex, 0).daySubjects.length;

    return {
      computedShownDays: resolvedShownDays,
      todayTotalSlots: todaySlotsCount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    subjects,
    cycle,
    cycleSlotCounts,
    cycleScheduleType,
    cycleWeekStart,
    cycleCarryoverOffset,
    currentDayIndex,
    completedToday,
    slotProgressToday,
    calendarOverrides,
    calendarOverrideCounts,
    futureScheduleRules,
    subjectTimeGoal,
    studyHistory,
    weekOffset,
    todayKey,
    courseIndexUrlByTitle,
    fallbackCaveiraCourseBaseUrl
  ]);

  // Garante que o dia selecionado exista na semana atual
  const activeDay = useMemo(() => {
    if (computedShownDays.length === 0) return null;
    const found = computedShownDays.find((d) => d.dayIndex === effectiveSelectedDayIndex);
    if (found) return found;
    const todayInWeek = computedShownDays.find((d) => d.isToday);
    return todayInWeek || computedShownDays[0];
  }, [computedShownDays, effectiveSelectedDayIndex]);

  // Telemetria semanal (aulas planejadas + tempo total + economia de aceleração)
  const weekSummary = useMemo(() => {
    let totalAccelSec = 0;
    let totalOrigSec = 0;
    let totalLessons = 0;
    let activeDays = 0;

    computedShownDays.forEach((d) => {
      if (d.slots.length > 0) activeDays += 1;
      if (!d.isPast) {
        totalOrigSec += d.dayTotalSeconds;
        totalAccelSec += d.hasAcceleration ? d.dayAcceleratedSeconds : d.dayTotalSeconds;
        d.slots.forEach((s) => {
          if (!s.isSlotCompleted && s.activeTopic) {
            totalLessons += s.plannedLessons?.length || 0;
          }
        });
      }
    });

    return {
      totalAccelSec,
      savedSec: Math.max(0, totalOrigSec - totalAccelSec),
      totalLessons,
      activeDays
    };
  }, [computedShownDays]);

  const weekRangeLabel = computedShownDays.length > 0
    ? `${computedShownDays[0].dateInfo.dateStr} – ${computedShownDays[computedShownDays.length - 1].dateInfo.dateStr}`
    : '';

  const { setTriggerConfetti, ConfettiCanvas } = useConfetti();
  const prevCompletedLength = useRef(completedToday.length);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const totalSlots = todayTotalSlots;
    if (completedToday.length === totalSlots && totalSlots > 0 && prevCompletedLength.current < totalSlots) {
      setTimeout(() => {
        setTriggerConfetti(true);
      }, 0);
    }
    prevCompletedLength.current = completedToday.length;
  }, [completedToday.length, todayTotalSlots, setTriggerConfetti]);

  const handleOpenNotes = (subjectId, topic) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopic(topic);
    setNoteContent(topic.notes || '');
    setNoteDrawerOpen(true);
  };

  const handleSaveNotes = () => {
    if (!selectedSubjectId || !selectedTopic) return;
    saveTopicNotes(selectedSubjectId, selectedTopic.id, noteContent);
    setNoteDrawerOpen(false);
  };

  const handleOpenSlotModal = (slot, skipPrePrompt) => {
    if (!slot?.activeTopic || !setClassConfirmModal) return;
    const {
      activeTopic,
      currentCompleted,
      plannedLessons,
      activeLessonName,
      activeLessonDuration,
      blockCount,
      slotTargetCount,
      goalMin,
      subjectId,
      slotIndex
    } = slot;
    const remainingLessons = (activeTopic.lessons || []).slice(currentCompleted, activeTopic.total);
    const blockLessonNames = plannedLessons.map((pl) => pl?.name).filter(Boolean);

    setClassConfirmModal({
      subjectId,
      slotIndex,
      topicName: activeTopic.name,
      lessonNames: blockLessonNames.length > 0 ? blockLessonNames : (activeLessonName ? [activeLessonName] : []),
      allRemainingLessonNames: remainingLessons.map((l) => l?.name).filter(Boolean),
      maxClasses: Math.max(1, (Number(activeTopic.total) || 0) - (Number(activeTopic.completed) || 0)),
      lessonDuration: activeLessonDuration,
      allLessonsDurations: remainingLessons.map((l) => l?.duration || '60:00'),
      suggestedClasses: blockCount,
      plannedBlockCount: slotTargetCount || plannedLessons.length || blockCount || 1,
      timeGoalMinutes: goalMin || null,
      skipPrePrompt
    });
  };

  const handleOpenPastSlotModal = (slot, dateInfo) => {
    if (!slot?.pastActiveTopic || !setClassConfirmModal) return;
    const { pastActiveTopic, subject, subjectId, slotIndex, isDoubled, isReplaced, daySlotCount } = slot;
    const remLessons = (pastActiveTopic.lessons || []).slice(pastActiveTopic.completed, pastActiveTopic.total);
    const spdPast = Number(subject.speed) || 1;
    const customPastCount = !isDoubled && !isReplaced ? daySlotCount : 0;
    const pastLessonsN = customPastCount > 0 ? customPastCount : Math.floor(Number(subject.lessonsPerBlock) || 0);
    const pastGoalMin = customPastCount > 0 ? 0 : (Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0);
    const pastSug = pastGoalMin > 0 || pastLessonsN > 0
      ? calculateLessonsForGoal(pastActiveTopic.lessons || [], pastActiveTopic.completed, spdPast, pastGoalMin, pastActiveTopic.total, pastLessonsN).count
      : 1;
    const pastPlannedCount = Math.max(1, pastSug || 1);
    const pastLessonNames = remLessons.slice(0, pastPlannedCount).map((l) => l?.name).filter(Boolean);

    setClassConfirmModal({
      subjectId,
      slotIndex,
      topicName: pastActiveTopic.name,
      lessonNames: pastLessonNames,
      allRemainingLessonNames: remLessons.map((l) => l?.name).filter(Boolean),
      maxClasses: pastActiveTopic.total - pastActiveTopic.completed,
      lessonDuration: remLessons[0]?.duration || '',
      allLessonsDurations: remLessons.map((l) => l?.duration || '60:00'),
      suggestedClasses: pastPlannedCount,
      timeGoalMinutes: pastGoalMin || null,
      initialStudyDate: dateInfo.fullDateStr
    });
  };

  const handleSkipTodaySlot = (slotIndex) => {
    setCompletedToday((prev) => (prev.includes(slotIndex) ? prev : [...prev, slotIndex]));
  };

  const handleGoToToday = () => {
    setWeekOffset(0);
    setSelectedDayIndex(null);
    setViewMode('focus');
  };

  const handleChangeWeek = (delta) => {
    const next = Math.min(MAX_WEEK_OFFSET, Math.max(0, weekOffset + delta));
    setWeekOffset(next);
    setSelectedDayIndex(null);
  };

  return (
    <div className="fade-in w-full pb-10 space-y-4">
      {/* 1. BARRA DE PRIORIDADE ZERO (FSRS) — COMPACTA E EXPANSÍVEL */}
      {pendingReviews.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-red-500/35 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-red-500/[0.06] dark:bg-red-500/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-sm font-bold text-red-700 dark:text-red-400">
                    Prioridade Zero: Blindar Memória
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-mono text-[11px] font-bold tabular-nums">
                    {allPendingReviews.length} FSRS
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  Limpe sua fila de revisões espaçadas antes de absorver conteúdo novo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/revisoes')}
                className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Executar revisões</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReviewsDrawer((v) => !v)}
                className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showReviewsDrawer ? 'Ocultar' : 'Ver fila'}</span>
                {showReviewsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showReviewsDrawer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-red-500/15"
              >
                <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {pendingReviews.map((rev) => {
                    const sub = subjects[rev.subjectId];
                    const isCaveira = Boolean(rev.isCaveiraQuestion || rev.questionData || String(rev.id || '').startsWith('rev_caveira_'));
                    const subName = rev.customSubjectName || rev.questionData?.canonicalSubject || sub?.name || 'Revisão FSRS';
                    const subColor = sub?.color || (isCaveira ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400');
                    const thermo = getThermometer(rev.lastPerformance);

                    return (
                      <div
                        key={rev.id}
                        className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2 hover:border-red-400/50 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase truncate max-w-[65%] ${subColor}`}>
                              {subName}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 tabular-nums ${thermo.color}`} title={thermo.label}>
                              {thermo.icon} {Math.round(rev.lastPerformance * 100 || 0)}%
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2" title={rev.topicName}>
                            {rev.topicName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/revisoes')}
                          className="h-7 w-full rounded-lg bg-red-500/10 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-500/25 text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Activity className="w-3 h-3" />
                          <span>Revisar agora</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* 2. BARRA DE COMANDO SEMANAL + TELEMETRIA + ALTERNADOR DE VISÃO */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Esquerda: Semana + Resumo de Carga */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {cycleScheduleType === 'weekly'
                  ? weekOffset === 0
                    ? 'Cronograma desta semana'
                    : weekOffset === 1
                    ? 'Próxima semana'
                    : `Semana +${weekOffset}`
                  : 'Cronograma em ciclo contínuo'}
              </h2>
              {weekRangeLabel && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 tabular-nums">
                  {weekRangeLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                <strong className="font-mono text-slate-800 dark:text-slate-100">{weekSummary.totalLessons}</strong> aulas previstas
              </span>
              {weekSummary.totalAccelSec > 0 && (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-300">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {formatSecondsToFriendly(weekSummary.totalAccelSec)} na semana
                </span>
              )}
              {weekSummary.savedSec > 60 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  (-{formatSecondsToFriendly(weekSummary.savedSec)} acelerado)
                </span>
              )}
            </div>
          </div>

          {/* Direita: Controles de Semana + Modo de Visualização */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {cycleScheduleType === 'weekly' && (
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={weekOffset === 0}
                  onClick={() => handleChangeWeek(-1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="h-8 px-3 rounded-lg text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-white dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Voltar para o dia de hoje"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Hoje</span>
                </button>
                <button
                  type="button"
                  disabled={weekOffset >= MAX_WEEK_OFFSET}
                  onClick={() => handleChangeWeek(1)}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors cursor-pointer"
                  title="Próxima semana"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Alternador de Visão: Foco no Dia vs Grade Semanal */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('focus')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'focus'
                    ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Focus className="w-3.5 h-3.5" />
                <span>Foco no Dia</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grade Semanal</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. LINHA DO TEMPO INTERATIVA DOS 7 DIAS (SELETOR MASTER NO MODO FOCO) */}
        {viewMode === 'focus' && computedShownDays.length > 0 && (
          <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <div
              className="grid gap-2 overflow-x-auto no-scrollbar"
              style={{ gridTemplateColumns: `repeat(${Math.min(7, computedShownDays.length)}, minmax(112px, 1fr))` }}
            >
              {computedShownDays.map((d) => {
                const isSelected = activeDay?.dayIndex === d.dayIndex;
                const displaySec = d.hasAcceleration ? d.dayAcceleratedSeconds : d.dayTotalSeconds;
                const allTodayDone = d.isToday && d.slots.length > 0 && d.slots.every((s) => s.isSlotCompleted);

                return (
                  <button
                    key={d.dayIndex}
                    type="button"
                    onClick={() => setSelectedDayIndex(d.dayIndex)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-sky-500/15 dark:text-white dark:border-sky-400 ring-1 ring-sky-500/30 shadow-xs'
                        : d.isToday
                        ? 'bg-sky-500/8 dark:bg-sky-500/10 border-sky-500/35 text-slate-900 dark:text-white hover:border-sky-500'
                        : d.isPast
                        ? 'bg-white/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-mono text-[11px] font-bold uppercase ${
                        isSelected
                          ? 'text-sky-300 dark:text-sky-300'
                          : d.isToday
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {d.dateInfo.shortName || `D${d.dayIndex + 1}`}
                      </span>
                      <span className={`font-mono text-[11px] font-semibold tabular-nums ${
                        isSelected ? 'text-slate-300 dark:text-slate-200' : 'text-slate-400'
                      }`}>
                        {d.dateInfo.dateStr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      {allTodayDone || (d.isPast && displaySec > 0) ? (
                        <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold tabular-nums ${
                          isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <CheckCircle className="w-3 h-3 shrink-0" />
                          {displaySec > 0 ? formatSecondsToFriendly(displaySec) : 'Feito'}
                        </span>
                      ) : displaySec > 0 ? (
                        <span className={`inline-flex items-center gap-1 font-mono text-xs font-extrabold tabular-nums ${
                          isSelected ? 'text-amber-300' : 'text-amber-700 dark:text-amber-300'
                        }`}>
                          {d.hasAcceleration ? <Zap className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" /> : <Clock className="w-3 h-3 text-amber-500 shrink-0" />}
                          {formatSecondsToFriendly(displaySec)}
                        </span>
                      ) : (
                        <span className={`text-[11px] font-medium ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                          {d.slots.length === 0 ? 'Livre' : '0m'}
                        </span>
                      )}

                      {d.isToday && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-sky-400' : 'bg-sky-500'}`} title="Hoje" />
                      )}
                    </div>

                    {/* Mini barras das matérias do dia */}
                    <div className="flex items-center gap-1 h-1.5">
                      {d.slots.length === 0 ? (
                        <span className={`h-1 flex-1 rounded-full ${isSelected ? 'bg-white/15' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      ) : (
                        d.slots.slice(0, 5).map((s) => (
                          <span
                            key={s.slotIndex}
                            className={`h-1.5 flex-1 rounded-full ${
                              s.isSlotCompleted
                                ? 'bg-emerald-500'
                                : isSelected
                                ? 'bg-sky-400'
                                : 'bg-sky-500/50 dark:bg-sky-400/50'
                            }`}
                            title={s.subject?.name}
                          />
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* 4. ÁREA PRINCIPAL: FOCO NO DIA OU GRADE SEMANAL */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${weekOffset}-${viewMode === 'focus' ? activeDay?.dayIndex : 'all'}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.14 }}
        >
          {viewMode === 'focus' ? (
            <CronogramaDayWorkbench
              day={activeDay}
              shownDays={computedShownDays}
              selectedDayIndex={activeDay?.dayIndex}
              onSelectDay={setSelectedDayIndex}
              cycleScheduleType={cycleScheduleType}
              cycleCarryoverOffset={cycleCarryoverOffset}
              resetCycleCarryover={resetCycleCarryover}
              completedToday={completedToday}
              todayTotalSlots={todayTotalSlots}
              advanceDay={advanceDay}
              onOpenSlotModal={handleOpenSlotModal}
              onOpenPastSlotModal={handleOpenPastSlotModal}
              onOpenNotes={handleOpenNotes}
              onReplaceSubject={setReplaceSubjectModal}
              onSkipTodaySlot={handleSkipTodaySlot}
              onGoToCalendar={() => navigate('/estudos?tab=calendario')}
            />
          ) : (
            <CronogramaWeekGrid
              shownDays={computedShownDays}
              cycleScheduleType={cycleScheduleType}
              cycleCarryoverOffset={cycleCarryoverOffset}
              resetCycleCarryover={resetCycleCarryover}
              onFocusDay={(dayIdx) => {
                setSelectedDayIndex(dayIdx);
                setViewMode('focus');
              }}
              onOpenSlotModal={handleOpenSlotModal}
              onOpenPastSlotModal={handleOpenPastSlotModal}
              onOpenNotes={handleOpenNotes}
              onReplaceSubject={setReplaceSubjectModal}
              onSkipTodaySlot={handleSkipTodaySlot}
              onGoToCalendar={() => navigate('/estudos?tab=calendario')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Canvas de Confete ao bater a meta */}
      <ConfettiCanvas />

      {/* Slide Drawer de Anotações de Tópico */}
      <NotesDrawer
        isOpen={noteDrawerOpen}
        onClose={() => setNoteDrawerOpen(false)}
        topic={selectedTopic}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        onSave={handleSaveNotes}
      />
    </div>
  );
}
