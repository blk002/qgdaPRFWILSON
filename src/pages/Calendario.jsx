import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Pin,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  LayoutGrid,
  List,
  Star,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { parseDurationToSeconds, calculateLessonsForGoal, formatSecondsToFriendly } from '../lib/durationHelpers';
import CalendarioMonthGrid from '../components/calendario/CalendarioMonthGrid';
import CalendarioAgendaView from '../components/calendario/CalendarioAgendaView';
import CalendarioSubjectRail from '../components/calendario/CalendarioSubjectRail';
import {
  DayManagerModal,
  TransitionRuleModal,
  ResetCalendarModal,
  BulkScheduleModal
} from '../components/calendario/CalendarioModals';

const MESES_NOMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];
const MESES_NOMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const LEGACY_DEFAULT_EXAM_DATE = '2026-08-15';

export default function Calendario() {
  const navigate = useNavigate();
  const {
    calendarDate,
    setCalendarDate,
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
    targetExamDate,
    getLocalDateStr,
    getCycleIndexForDate,
    getEstimatedCompletionDate,
    getSubjectEstimates,
    subjectTimeGoal = {},
    calendarOverrides = {},
    calendarOverrideCounts = {},
    removeDayOverride,
    futureScheduleRules = [],
    updateSubject,
    executeSelectiveReset,
    applySubjectDaysInCalendar
  } = useStore();

  useEffect(() => {
    const hasLegacyRules = Array.isArray(futureScheduleRules) && futureScheduleRules.some((r) => !r || r.v !== 2);
    if (hasLegacyRules) {
      useStore.setState({
        futureScheduleRules: (futureScheduleRules || []).filter((r) => r && r.v === 2)
      });
    }
  }, [futureScheduleRules]);

  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'
  const [highlightedSubjectId, setHighlightedSubjectId] = useState(null);
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [bulkInitialSubjectId, setBulkInitialSubjectId] = useState('');
  const [showRail, setShowRail] = useState(() => {
    try {
      const saved = localStorage.getItem('qg_cal_show_subjects');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qg_cal_show_subjects', String(showRail));
    } catch {
      // ignore storage errors
    }
  }, [showRail]);

  // Estados do Gerenciador de Dia
  const [managingDay, setManagingDay] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [daySlotCounts, setDaySlotCounts] = useState([]);
  const [saveMode, setSaveMode] = useState('future');
  const [initialDaySnapshot, setInitialDaySnapshot] = useState('');
  const [autoSaveOnNavigate, setAutoSaveOnNavigate] = useState(() => {
    try {
      return localStorage.getItem('qg_cal_autosave_nav') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('qg_cal_autosave_nav', String(autoSaveOnNavigate));
    } catch {
      // ignore storage errors
    }
  }, [autoSaveOnNavigate]);

  // Modais de redefinição e transição
  const [showResetCalendarModal, setShowResetCalendarModal] = useState(false);
  const [resetMode, setResetMode] = useState('overrides');
  const [isResettingCalendar, setIsResettingCalendar] = useState(false);

  const [editingTransitionSub, setEditingTransitionSub] = useState(null);
  const [tempAction, setTempAction] = useState('keep_fixed');
  const [tempRepId, setTempRepId] = useState('');

  useEffect(() => {
    setCalendarDate(new Date());
  }, [setCalendarDate]);

  const rawCalDate = calendarDate ? new Date(calendarDate) : new Date();
  const calDate = Number.isNaN(rawCalDate.getTime()) ? new Date() : rawCalDate;

  const completedToday = useMemo(
    () => (completedTodayDate && completedTodayDate === getLocalDateStr() ? rawCompletedToday || [] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawCompletedToday, completedTodayDate, getLocalDateStr, todayKey]
  );

  const { subjectEstimates, estimatedDate } = useMemo(
    () => ({
      subjectEstimates: getSubjectEstimates ? getSubjectEstimates() : [],
      estimatedDate: getEstimatedCompletionDate
        ? getEstimatedCompletionDate()
        : { short: '', full: '', isLate: false, daysDiff: 0, examDateFormatted: '' }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getSubjectEstimates,
      getEstimatedCompletionDate,
      subjects,
      cycle,
      cycleSlotCounts,
      currentDayIndex,
      completedToday,
      subjectTimeGoal,
      calendarOverrides,
      calendarOverrideCounts,
      futureScheduleRules,
      cycleScheduleType,
      cycleWeekStart,
      cycleCarryoverOffset,
      targetExamDate,
      todayKey
    ]
  );

  const isWeeklyCycle = (cycleScheduleType || 'weekly') === 'weekly';

  const examDateNotSet =
    !targetExamDate ||
    (targetExamDate === LEGACY_DEFAULT_EXAM_DATE && targetExamDate < (getLocalDateStr ? getLocalDateStr() : ''));

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const todayDateObj = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  const getDayScheduleForDate = useCallback(
    (cellDateObj, dateKey) => {
      const sanitize = (rawSubjects, rawCounts) => {
        const validSubjects = [];
        const validCounts = [];
        (rawSubjects || []).forEach((sId, idx) => {
          if (subjects && subjects[sId]) {
            validSubjects.push(sId);
            validCounts.push(Math.max(0, Math.floor(Number(rawCounts?.[idx]) || 0)));
          }
        });
        return { daySubjects: validSubjects, daySlotCounts: validCounts };
      };

      if (calendarOverrides && Array.isArray(calendarOverrides[dateKey])) {
        return sanitize(calendarOverrides[dateKey], calendarOverrideCounts?.[dateKey]);
      }

      const isTodayCell = cellDateObj.getTime() === todayDateObj.getTime();
      const shouldShiftCarryover = cycleScheduleType === 'weekly' && isTodayCell && cycleCarryoverOffset > 0;
      const effectiveDateObj = shouldShiftCarryover
        ? new Date(cellDateObj.getFullYear(), cellDateObj.getMonth(), cellDateObj.getDate() - cycleCarryoverOffset)
        : cellDateObj;
      const effectiveDateKey = shouldShiftCarryover
        ? `${effectiveDateObj.getFullYear()}-${String(effectiveDateObj.getMonth() + 1).padStart(2, '0')}-${String(effectiveDateObj.getDate()).padStart(2, '0')}`
        : dateKey;

      if (shouldShiftCarryover && calendarOverrides && Array.isArray(calendarOverrides[effectiveDateKey])) {
        return sanitize(calendarOverrides[effectiveDateKey], calendarOverrideCounts?.[effectiveDateKey]);
      }

      let daySubjects = [];
      let slotCounts = [];

      if (cycle && cycle.length > 0) {
        const targetDayOfWeek = effectiveDateObj.getDay();
        const cycleIndex = getCycleIndexForDate
          ? getCycleIndexForDate(cellDateObj, todayDateObj)
          : cycleScheduleType === 'weekly'
            ? cycleWeekStart === 'monday'
              ? (targetDayOfWeek + 6) % 7
              : targetDayOfWeek
            : (((currentDayIndex + Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24))) %
                cycle.length) +
                cycle.length) %
              cycle.length;

        const matchingRules = (futureScheduleRules || [])
          .filter((r) => {
            if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effectiveDateKey) return false;
            if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
              return r.dayOfWeek === targetDayOfWeek;
            }
            return r.dayOfWeek === targetDayOfWeek || r.cycleIndex === cycleIndex;
          })
          .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

        if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
          daySubjects = [...matchingRules[0].daySlots];
          slotCounts = Array.isArray(matchingRules[0].slotCounts) ? [...matchingRules[0].slotCounts] : [];
        } else if (Array.isArray(cycle[cycleIndex])) {
          daySubjects = [...cycle[cycleIndex]];
          slotCounts = Array.isArray(cycleSlotCounts?.[cycleIndex]) ? [...cycleSlotCounts[cycleIndex]] : [];
        }
      }

      return sanitize(daySubjects, slotCounts);
    },
    [
      subjects,
      calendarOverrides,
      calendarOverrideCounts,
      cycle,
      cycleSlotCounts,
      cycleScheduleType,
      cycleWeekStart,
      cycleCarryoverOffset,
      currentDayIndex,
      futureScheduleRules,
      getCycleIndexForDate,
      todayDateObj
    ]
  );

  const getDaySubjectsForDate = useCallback(
    (cellDateObj, dateKey) => getDayScheduleForDate(cellDateObj, dateKey).daySubjects,
    [getDayScheduleForDate]
  );

  // Simulação de 730 dias para previsão e sincronização
  const { futureSchedule, calCompletionDates, remainingLessonsQueue, initialSubjectQueues } = useMemo(() => {
    const nextFutureSchedule = {};
    const nextCalCompletionDates = {};
    const nextRemainingLessonsQueue = {};
    const nextInitialSubjectQueues = {};

    Object.values(subjects || {}).forEach((sub) => {
      const spd = Math.max(0.5, Number(sub.speed) || 1);
      const q = [];
      (sub.topics || []).forEach((t) => {
        const completed = t.completed || 0;
        const topicLessonsArr = t.lessons || [];
        for (let idx = completed; idx < t.total; idx++) {
          const lesson = topicLessonsArr[idx];
          const origSec = parseDurationToSeconds(lesson?.duration);
          const mins = (origSec > 0 ? origSec : 3600) / 60;
          const rawName = typeof lesson?.name === 'string' ? lesson.name.trim() : '';
          const isGeneric = !rawName || /^(aula|v[ií]deo)\s*0*\d+$/i.test(rawName);
          const fallbackLabel = rawName || `Aula ${idx + 1}`;
          const displayName = isGeneric ? (t.name ? `${t.name} - ${fallbackLabel}` : fallbackLabel) : rawName;
          q.push({
            name: displayName,
            rawName: fallbackLabel,
            topicName: t.name || '',
            lessonNumber: idx + 1,
            duration: lesson?.duration || '',
            durationMins: mins,
            accelMins: mins / spd
          });
        }
      });
      nextRemainingLessonsQueue[sub.id] = q;
      nextInitialSubjectQueues[sub.id] = [...q];
    });

    for (let i = 0; i < 730; i++) {
      if (
        cycle.length === 0 &&
        (!calendarOverrides || Object.keys(calendarOverrides).length === 0) &&
        (!futureScheduleRules || futureScheduleRules.length === 0)
      ) {
        break;
      }

      const targetSimDate = new Date(todayDateObj);
      targetSimDate.setDate(targetSimDate.getDate() + i);
      const simDateKey = `${targetSimDate.getFullYear()}-${String(targetSimDate.getMonth() + 1).padStart(2, '0')}-${String(targetSimDate.getDate()).padStart(2, '0')}`;

      const { daySubjects, daySlotCounts: simSlotCounts } = getDayScheduleForDate(targetSimDate, simDateKey);
      const scheduledThisDay = [];

      daySubjects.forEach((subId, slotIdx) => {
        if (i === 0 && completedToday.includes(slotIdx)) return;

        let effectiveSubId = subId;
        let q = nextRemainingLessonsQueue[effectiveSubId];
        let wasTransitioned = false;

        const visited = new Set([effectiveSubId]);
        while (!q || q.length === 0) {
          const currentSub = subjects[effectiveSubId];
          const action = currentSub?.onCompleteAction || 'keep_fixed';

          if (
            action === 'replace' &&
            currentSub?.replacementSubjectId &&
            subjects[currentSub.replacementSubjectId] &&
            !visited.has(currentSub.replacementSubjectId)
          ) {
            const repId = currentSub.replacementSubjectId;
            visited.add(repId);
            effectiveSubId = repId;
            q = nextRemainingLessonsQueue[repId];
            wasTransitioned = true;
          } else if (action === 'double_remaining') {
            const fallbackId = daySubjects.find(
              (sId) => !visited.has(sId) && nextRemainingLessonsQueue[sId]?.length > 0
            );
            if (fallbackId) {
              visited.add(fallbackId);
              effectiveSubId = fallbackId;
              q = nextRemainingLessonsQueue[fallbackId];
              wasTransitioned = true;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        if (q && q.length > 0) {
          const sub = subjects[effectiveSubId];
          const spd = Math.max(0.5, Number(sub?.speed) || 1);
          const customSlotLessons = !wasTransitioned ? Math.floor(Number(simSlotCounts?.[slotIdx]) || 0) : 0;
          const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(sub?.lessonsPerBlock) || 0);
          const goalMin =
            customSlotLessons > 0 ? 0 : Number(sub?.timeGoalMinutes || subjectTimeGoal?.[effectiveSubId]) || 0;

          const suggestion = calculateLessonsForGoal(q, 0, spd, goalMin, q.length, lessonsN);
          const consumed = Math.min(q.length, Math.max(1, suggestion.count || 1));
          const consumedLessons = q.splice(0, consumed);

          const isLast = q.length === 0;
          scheduledThisDay.push({
            id: effectiveSubId,
            isLast,
            count: consumed,
            accelSec: suggestion.totalAccelSec || 0,
            customCount: customSlotLessons,
            isTransitioned: wasTransitioned,
            lessons: consumedLessons
          });

          if (isLast && !nextCalCompletionDates[effectiveSubId]) {
            const dStr = `${String(targetSimDate.getDate()).padStart(2, '0')}/${MESES_NOMES_SHORT[targetSimDate.getMonth()]}/${targetSimDate.getFullYear()}`;
            nextCalCompletionDates[effectiveSubId] = {
              dayOffset: i,
              dateObj: new Date(targetSimDate),
              dateStr: dStr
            };
          }
        }
      });

      nextFutureSchedule[simDateKey] = scheduledThisDay;
    }

    return {
      futureSchedule: nextFutureSchedule,
      calCompletionDates: nextCalCompletionDates,
      remainingLessonsQueue: nextRemainingLessonsQueue,
      initialSubjectQueues: nextInitialSubjectQueues
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    subjects,
    cycle,
    cycleSlotCounts,
    cycleScheduleType,
    cycleWeekStart,
    currentDayIndex,
    completedToday,
    calendarOverrides,
    calendarOverrideCounts,
    futureScheduleRules,
    subjectTimeGoal,
    todayKey,
    getDayScheduleForDate,
    todayDateObj
  ]);

  // Telemetria do mês exibido
  const monthSummary = useMemo(() => {
    let activeDays = 0;
    let restDays = 0;
    let totalLessons = 0;
    let totalAccelSec = 0;
    const finishingSubjects = [];
    const finishingIds = new Set();
    const todayTime = todayDateObj.getTime();

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateObj = new Date(year, month, d);
      if (cellDateObj.getTime() < todayTime) continue;

      const cellDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = futureSchedule[cellDateKey] || [];
      const filteredItems = highlightedSubjectId
        ? items.filter((it) => it?.id === highlightedSubjectId)
        : items;

      if (filteredItems.length > 0) {
        activeDays += 1;
        filteredItems.forEach((it) => {
          totalLessons += Number(it?.count) || it?.lessons?.length || 0;
          totalAccelSec += Number(it?.accelSec) || 0;
          if (it?.isLast && subjects?.[it.id] && !finishingIds.has(it.id)) {
            finishingIds.add(it.id);
            finishingSubjects.push({
              id: it.id,
              name: subjects[it.id].name,
              day: d
            });
          }
        });
      } else {
        restDays += 1;
      }
    }

    return { activeDays, restDays, totalLessons, totalAccelSec, finishingSubjects };
  }, [year, month, daysInMonth, todayDateObj, futureSchedule, highlightedSubjectId, subjects]);

  // Prévia dinâmica das aulas no Gerenciador de Dia
  const managingDayPreviewLessons = useMemo(() => {
    if (!managingDay) return [];
    const consumedBeforeDate = {};
    Object.entries(futureSchedule || {}).forEach(([dKey, items]) => {
      if (dKey < managingDay.dateKey && Array.isArray(items)) {
        items.forEach((item) => {
          consumedBeforeDate[item.id] = (consumedBeforeDate[item.id] || 0) + (item.count || 0);
        });
      }
    });

    const sameDayOffset = {};
    return (daySlots || []).map((subId, idx) => {
      const sub = subjects?.[subId];
      const fullQueue = initialSubjectQueues?.[subId] || [];
      const startOffset = (consumedBeforeDate[subId] || 0) + (sameDayOffset[subId] || 0);
      const remainingQueue = fullQueue.slice(startOffset);

      if (!sub || remainingQueue.length === 0) return [];

      const spd = Math.max(0.5, Number(sub.speed) || 1);
      const customSlotLessons = Math.floor(Number(daySlotCounts?.[idx]) || 0);
      const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(sub.lessonsPerBlock) || 0);
      const goalMin = customSlotLessons > 0 ? 0 : Number(sub.timeGoalMinutes || subjectTimeGoal?.[subId]) || 0;

      const suggestion = calculateLessonsForGoal(remainingQueue, 0, spd, goalMin, remainingQueue.length, lessonsN);
      const consumed = Math.min(remainingQueue.length, Math.max(1, suggestion.count || 1));
      const pickedLessons = remainingQueue.slice(0, consumed);
      sameDayOffset[subId] = (sameDayOffset[subId] || 0) + consumed;
      return pickedLessons;
    });
  }, [managingDay, futureSchedule, daySlots, daySlotCounts, subjects, initialSubjectQueues, subjectTimeGoal]);

  const handleFixCalendar = () => {
    useStore.setState({
      scheduleExtensions: [],
      futureScheduleRules: [],
      calendarOverrides: {},
      calendarOverrideCounts: {}
    });
    toast.success('Calendário 100% fixado no padrão do seu ciclo semanal!');
  };

  const handleConfirmResetCalendar = async () => {
    setIsResettingCalendar(true);
    try {
      const todayStr = getLocalDateStr ? getLocalDateStr() : '';
      if (resetMode === 'overrides') {
        useStore.setState({
          scheduleExtensions: [],
          futureScheduleRules: [],
          calendarOverrides: {},
          calendarOverrideCounts: {},
          cycleCarryoverOffset: 0,
          ...(todayStr ? { lastCarryoverCheckDate: todayStr } : {})
        });
        toast.success('Calendário redefinido para o padrão do ciclo semanal!');
      } else if (resetMode === 'clear_all') {
        if (executeSelectiveReset) {
          await executeSelectiveReset({ calendarSchedule: true });
        }
        toast.success('Grade do calendário e do ciclo zerada! Suas disciplinas foram mantidas.');
      } else if (resetMode === 'reset_progress') {
        if (executeSelectiveReset) {
          await executeSelectiveReset({ watchedLessons: true });
        }
        toast.success('Progresso das aulas reiniciado! O calendário voltou para a Aula 1.');
      }
      setShowResetCalendarModal(false);
    } catch (err) {
      console.error('Erro ao redefinir calendário:', err);
      toast.error('Ocorreu um erro ao redefinir o calendário.');
    } finally {
      setIsResettingCalendar(false);
    }
  };

  const handleOpenDayManager = useCallback(
    (cellDateObj, dateKey) => {
      const diff = Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) return;

      const dayOfWeek = cellDateObj.getDay();
      const weekIndex =
        cycleScheduleType === 'weekly'
          ? cycleWeekStart === 'monday'
            ? (dayOfWeek + 6) % 7
            : dayOfWeek
          : (((currentDayIndex + diff) % Math.max(1, cycle.length)) + Math.max(1, cycle.length)) %
            Math.max(1, cycle.length);

      const baseSubs = cycle && Array.isArray(cycle[weekIndex]) ? [...cycle[weekIndex]] : [];
      const { daySubjects: scheduledSubs, daySlotCounts: scheduledCounts } = getDayScheduleForDate(
        cellDateObj,
        dateKey
      );

      const currentDaySubs =
        scheduledSubs.length > 0
          ? scheduledSubs
          : futureSchedule[dateKey] !== undefined
            ? futureSchedule[dateKey].map((item) => item.id)
            : [];

      const currentDayCounts = currentDaySubs.map((_, idx) =>
        Math.max(0, Math.floor(Number(scheduledCounts?.[idx]) || 0))
      );

      const hasCustomOverride = Boolean(calendarOverrides && Array.isArray(calendarOverrides[dateKey]));
      const hasFutureRuleOnDay = (futureScheduleRules || []).some(
        (r) =>
          r &&
          r.v === 2 &&
          r.fromDate <= dateKey &&
          (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined
            ? r.dayOfWeek === dayOfWeek
            : r.dayOfWeek === dayOfWeek || r.cycleIndex === weekIndex)
      );
      const hasDiffFromBase =
        currentDaySubs.length !== baseSubs.length || currentDaySubs.some((id, idx) => id !== baseSubs[idx]);

      setManagingDay({
        dateObj: cellDateObj,
        dateKey,
        dayOfWeek,
        weekIndex,
        isCustomized: hasCustomOverride || hasFutureRuleOnDay || hasDiffFromBase
      });
      setDaySlots(currentDaySubs);
      setDaySlotCounts(currentDayCounts);
      setInitialDaySnapshot(JSON.stringify({ slots: currentDaySubs || [], counts: currentDayCounts }));
      setSaveMode('future');
    },
    [
      todayDateObj,
      cycleScheduleType,
      cycleWeekStart,
      currentDayIndex,
      cycle,
      getDayScheduleForDate,
      futureSchedule,
      calendarOverrides,
      futureScheduleRules
    ]
  );

  const currentDaySnapshot = useMemo(() => {
    const normalizedCounts = (daySlots || []).map((_, idx) =>
      Math.max(0, Math.floor(Number(daySlotCounts?.[idx]) || 0))
    );
    return JSON.stringify({ slots: daySlots || [], counts: normalizedCounts });
  }, [daySlots, daySlotCounts]);

  const isDayDirty =
    Boolean(managingDay) && initialDaySnapshot !== '' && currentDaySnapshot !== initialDaySnapshot;

  const canGoPrevDay =
    Boolean(managingDay) &&
    Math.round((managingDay.dateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24)) > 0;

  const saveCurrentDayManager = useCallback(
    ({ closeModal = true, silent = false } = {}) => {
      if (!managingDay) return false;
      const storeState = useStore.getState();
      const {
        calendarOverrides: freshOverrides,
        calendarOverrideCounts: freshOverrideCounts,
        futureScheduleRules: freshFutureRules,
        cycle: freshCycle,
        cycleSlotCounts: freshCycleSlotCounts,
        cycleScheduleType: freshScheduleType,
        setDayOverride: storeSetDayOverride,
        addFutureScheduleRule: storeAddFutureScheduleRule,
        setCycle: storeSetCycle,
        setCycleSlotCounts: storeSetCycleSlotCounts,
        removeDayOverride: storeRemoveDayOverride,
        getLocalDateStr: storeGetLocalDateStr
      } = storeState;

      const { dateKey, dayOfWeek, weekIndex } = managingDay;
      const updatedSlots = [...daySlots];
      const updatedCounts = updatedSlots.map((_, idx) =>
        Math.max(0, Math.floor(Number(daySlotCounts?.[idx]) || 0))
      );

      if (saveMode === 'single') {
        if (storeSetDayOverride) {
          storeSetDayOverride(dateKey, updatedSlots, updatedCounts);
          if (!silent) toast.success(`Programação salva exclusivamente para ${dateKey}!`);
        }
      } else if (saveMode === 'future') {
        if (storeAddFutureScheduleRule) {
          storeAddFutureScheduleRule({
            fromDate: dateKey,
            dayOfWeek,
            cycleIndex: weekIndex,
            daySlots: updatedSlots,
            slotCounts: updatedCounts
          });
        }
        const nextOverrides = { ...(freshOverrides || {}) };
        const nextOverrideCounts = { ...(freshOverrideCounts || {}) };
        Object.keys(nextOverrides).forEach((dKey) => {
          if (dKey >= dateKey) {
            const parts = dKey.split('-').map(Number);
            if (parts.length === 3) {
              const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
              if (dObj.getDay() === dayOfWeek) {
                delete nextOverrides[dKey];
                delete nextOverrideCounts[dKey];
              }
            }
          }
        });
        const todayStr = storeGetLocalDateStr ? storeGetLocalDateStr() : '';
        useStore.setState({
          calendarOverrides: nextOverrides,
          calendarOverrideCounts: nextOverrideCounts,
          ...(dateKey === todayStr ? { cycleCarryoverOffset: 0, lastCarryoverCheckDate: todayStr } : {})
        });
        if (!silent) {
          toast.success(`Programação definida de ${dateKey} para o futuro! Os dias anteriores não foram alterados.`);
        }
      } else if (storeSetCycle) {
        const totalDays = freshScheduleType === 'weekly' ? 7 : Math.max((freshCycle || []).length, weekIndex + 1);
        const newCycle = Array.from({ length: totalDays }, (_, i) =>
          Array.isArray(freshCycle?.[i]) ? [...freshCycle[i]] : []
        );
        const newCycleSlotCounts = Array.from({ length: totalDays }, (_, i) =>
          Array.isArray(freshCycleSlotCounts?.[i]) ? [...freshCycleSlotCounts[i]] : []
        );
        newCycle[weekIndex] = updatedSlots;
        newCycleSlotCounts[weekIndex] = updatedCounts;
        storeSetCycle(newCycle);
        if (storeSetCycleSlotCounts) storeSetCycleSlotCounts(newCycleSlotCounts);
        if (storeRemoveDayOverride) storeRemoveDayOverride(dateKey);

        const cleanedRules = (freshFutureRules || []).filter(
          (r) => r && r.v === 2 && r.dayOfWeek !== dayOfWeek && r.cycleIndex !== weekIndex
        );
        const todayStr = storeGetLocalDateStr ? storeGetLocalDateStr() : '';
        useStore.setState({
          futureScheduleRules: cleanedRules,
          ...(dateKey === todayStr ? { cycleCarryoverOffset: 0, lastCarryoverCheckDate: todayStr } : {})
        });

        if (!silent) toast.success('Ciclo semanal base atualizado com sucesso!');
      }

      setInitialDaySnapshot(JSON.stringify({ slots: updatedSlots, counts: updatedCounts }));
      if (silent) {
        toast.success(`Alterações de ${dateKey} salvas automaticamente`, { duration: 1800 });
      }
      if (closeModal) {
        setManagingDay(null);
      }
      return true;
    },
    [managingDay, daySlots, daySlotCounts, saveMode]
  );

  const navigateManagedDay = useCallback(
    (delta) => {
      if (!managingDay) return;
      if (autoSaveOnNavigate && isDayDirty) {
        saveCurrentDayManager({ closeModal: false, silent: true });
      }
      const d = managingDay.dateObj;
      const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
      if (target.getTime() < todayDateObj.getTime()) return;
      const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
      handleOpenDayManager(target, key);
      if (target.getFullYear() !== year || target.getMonth() !== month) {
        setCalendarDate(new Date(target.getFullYear(), target.getMonth(), 1));
      }
    },
    [managingDay, autoSaveOnNavigate, isDayDirty, saveCurrentDayManager, todayDateObj, handleOpenDayManager, year, month, setCalendarDate]
  );

  const navigateManagedDayRef = useRef(navigateManagedDay);
  useEffect(() => {
    navigateManagedDayRef.current = navigateManagedDay;
  }, [navigateManagedDay]);

  useEffect(() => {
    if (!managingDay) return undefined;
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateManagedDayRef.current(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateManagedDayRef.current(-1);
      } else if (e.key === 'Escape') {
        setManagingDay(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [managingDay]);

  const handleResetDayToDefault = () => {
    if (!managingDay) return;
    const { dateKey, dayOfWeek, weekIndex } = managingDay;
    if (removeDayOverride) removeDayOverride(dateKey);

    const cleanedRules = (futureScheduleRules || []).filter(
      (r) => r && r.v === 2 && !((r.dayOfWeek === dayOfWeek || r.cycleIndex === weekIndex) && r.fromDate >= dateKey)
    );
    useStore.setState({ futureScheduleRules: cleanedRules });

    toast.success(`Programação restaurada a partir de ${dateKey}!`);
    setManagingDay(null);
  };

  const handleOpenTransitionModal = (sub) => {
    setEditingTransitionSub(sub);
    const currentAct =
      sub.onCompleteAction === 'replace' || sub.onCompleteAction === 'double_remaining'
        ? sub.onCompleteAction
        : 'keep_fixed';
    setTempAction(currentAct);
    setTempRepId(sub.replacementSubjectId || '');
  };

  const handleSaveTransition = () => {
    if (!editingTransitionSub) return;
    if (tempAction === 'replace' && !tempRepId) {
      toast.error('Selecione qual disciplina substituta deve entrar no lugar!');
      return;
    }
    if (updateSubject) {
      updateSubject(editingTransitionSub.id, {
        onCompleteAction: tempAction,
        replacementSubjectId: tempAction === 'replace' ? tempRepId : undefined
      });
      toast.success(`Regra de transição de ${editingTransitionSub.name} atualizada!`);
    }
    setEditingTransitionSub(null);
  };

  const isLate = Boolean(estimatedDate.isLate && !examDateNotSet);

  return (
    <div className="flex flex-col gap-3.5 w-full pb-8 fade-in">
      {/* ZONA 1: Cabeçalho Estratégico Compacto (Previsão + 3 KPIs do Mês + Marcos de Conclusão) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 sm:px-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          {/* Esquerda: Fechamento do edital */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                isLate
                  ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400'
                  : 'bg-sky-50 border-sky-200/80 text-sky-600 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-400'
              }`}
            >
              <Trophy className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Previsão de fechamento do edital</span>
                {isLate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Atraso de {estimatedDate.daysDiff} dias
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug text-balance">
                {estimatedDate.full}
              </h2>
            </div>
          </div>

          {/* Direita: 3 métricas tabulares */}
          <div className="grid grid-cols-3 gap-4 sm:gap-5 xl:pl-5 xl:border-l border-slate-200 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Carga em {MESES_NOMES_SHORT[month]}
              </span>
              <span className="block text-sm sm:text-base font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300">
                {monthSummary.totalAccelSec > 0 ? formatSecondsToFriendly(monthSummary.totalAccelSec) : '0m'}
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {monthSummary.totalLessons} {monthSummary.totalLessons === 1 ? 'aula' : 'aulas'}
              </span>
            </div>

            <div className="min-w-0 pl-4 border-l border-slate-200/80 dark:border-slate-800">
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Dias restantes
              </span>
              <span className="block text-sm sm:text-base font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {monthSummary.activeDays}
                <span className="text-xs font-sans font-normal text-slate-400 dark:text-slate-500"> ativos</span>
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {monthSummary.restDays} {monthSummary.restDays === 1 ? 'livre' : 'livres'}
              </span>
            </div>

            <div className="min-w-0 pl-4 border-l border-slate-200/80 dark:border-slate-800">
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                Data da prova
              </span>
              {examDateNotSet ? (
                <>
                  <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Não definida
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/config')}
                    className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Definir agora →
                  </button>
                </>
              ) : (
                <>
                  <span className="block text-sm sm:text-base font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {estimatedDate.examDateFormatted}
                  </span>
                  <span
                    className={`block text-[11px] font-medium ${
                      isLate
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isLate ? 'Ritmo atrasado' : 'Dentro do prazo'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Linha condicional: matérias que encerram neste mês */}
        {monthSummary.finishingSubjects.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              Encerram em {MESES_NOMES[month]}:
            </span>
            {monthSummary.finishingSubjects.map((fin, idx) => (
              <React.Fragment key={fin.id}>
                {idx > 0 && (
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                    ·
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setHighlightedSubjectId((prev) => (prev === fin.id ? null : fin.id))}
                  className="font-medium text-slate-700 dark:text-slate-200 hover:underline cursor-pointer"
                >
                  {fin.name}{' '}
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    ({String(fin.day).padStart(2, '0')}/{String(month + 1).padStart(2, '0')})
                  </span>
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {/* ZONA 2: Barra de Controle Única (Mês + Alternador Mês/Agenda + Ações) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Navegação do mês + filtro ativo */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
              aria-label="Mês anterior"
              title="Mês anterior"
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-base font-bold text-slate-900 dark:text-slate-100 min-w-[144px] text-center whitespace-nowrap">
              {MESES_NOMES[month]} {year}
            </span>

            <button
              type="button"
              onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
              aria-label="Próximo mês"
              title="Próximo mês"
              className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setCalendarDate(new Date())}
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Hoje
            </button>
          </div>

          {highlightedSubjectId && subjects?.[highlightedSubjectId] && (
            <button
              type="button"
              onClick={() => setHighlightedSubjectId(null)}
              className="h-8 px-2.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{subjects[highlightedSubjectId].name}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Alternador simples Mês | Agenda + ações essenciais */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/75 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`h-7 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Agenda
            </button>
          </div>

          {isWeeklyCycle && (
            <button
              type="button"
              onClick={() => {
                setBulkInitialSubjectId(highlightedSubjectId || '');
                setShowBulkScheduleModal(true);
              }}
              title="Adicionar uma matéria em vários dias da semana ou remover matérias do calendário"
              className="h-8 px-2.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Gerenciar Matérias
            </button>
          )}

          <button
            type="button"
            onClick={handleFixCalendar}
            title="Fixar a grade semanal e remover regras ou personalizações avulsas"
            className="h-8 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Pin className="w-3.5 h-3.5" /> Grade Fixa
          </button>

          <button
            type="button"
            onClick={() => {
              setResetMode('overrides');
              setShowResetCalendarModal(true);
            }}
            title="Redefinir programação, edições manuais ou progresso das aulas"
            className="h-8 px-2.5 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Redefinir
          </button>

          <button
            type="button"
            onClick={() => setShowRail((prev) => !prev)}
            title={showRail ? 'Ocultar Fim das Disciplinas' : 'Mostrar Fim das Disciplinas'}
            aria-label={showRail ? 'Ocultar Fim das Disciplinas' : 'Mostrar Fim das Disciplinas'}
            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {showRail ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ZONA 3: Área Principal (Calendário/Agenda à esquerda + Fim das Disciplinas sempre acessível à direita) */}
      <div className="flex flex-col xl:flex-row items-start gap-3.5">
        <div className="flex-1 min-w-0 w-full">
          {viewMode === 'month' ? (
            <CalendarioMonthGrid
              year={year}
              month={month}
              days={days}
              blanks={blanks}
              todayDateObj={todayDateObj}
              subjects={subjects}
              futureSchedule={futureSchedule}
              calendarOverrides={calendarOverrides}
              remainingLessonsQueue={remainingLessonsQueue}
              getDaySubjectsForDate={getDaySubjectsForDate}
              highlightedSubjectId={highlightedSubjectId}
              onOpenDayManager={handleOpenDayManager}
            />
          ) : (
            <CalendarioAgendaView
              year={year}
              month={month}
              days={days}
              todayDateObj={todayDateObj}
              subjects={subjects}
              futureSchedule={futureSchedule}
              calendarOverrides={calendarOverrides}
              remainingLessonsQueue={remainingLessonsQueue}
              getDaySubjectsForDate={getDaySubjectsForDate}
              highlightedSubjectId={highlightedSubjectId}
              onOpenDayManager={handleOpenDayManager}
            />
          )}
        </div>

        {showRail && (
          <div className="w-full xl:w-72 2xl:w-80 shrink-0">
            <CalendarioSubjectRail
              subjectEstimates={subjectEstimates}
              calCompletionDates={calCompletionDates}
              highlightedSubjectId={highlightedSubjectId}
              onToggleHighlight={setHighlightedSubjectId}
              onOpenTransitionModal={handleOpenTransitionModal}
              onOpenBulkSubjectModal={isWeeklyCycle ? (subId) => {
                setBulkInitialSubjectId(subId || '');
                setShowBulkScheduleModal(true);
              } : undefined}
            />
          </div>
        )}
      </div>

      {/* MODAIS */}
      <DayManagerModal
        managingDay={managingDay}
        onClose={() => setManagingDay(null)}
        canGoPrevDay={canGoPrevDay}
        onNavigateDay={navigateManagedDay}
        autoSaveOnNavigate={autoSaveOnNavigate}
        setAutoSaveOnNavigate={setAutoSaveOnNavigate}
        isDayDirty={isDayDirty}
        daySlots={daySlots}
        setDaySlots={setDaySlots}
        daySlotCounts={daySlotCounts}
        setDaySlotCounts={setDaySlotCounts}
        subjects={subjects}
        subjectTimeGoal={subjectTimeGoal}
        initialSubjectQueues={initialSubjectQueues}
        managingDayPreviewLessons={managingDayPreviewLessons}
        saveMode={saveMode}
        setSaveMode={setSaveMode}
        onSave={() => saveCurrentDayManager({ closeModal: true, silent: false })}
        onResetToDefault={handleResetDayToDefault}
      />

      <TransitionRuleModal
        editingTransitionSub={editingTransitionSub}
        onClose={() => setEditingTransitionSub(null)}
        tempAction={tempAction}
        setTempAction={setTempAction}
        tempRepId={tempRepId}
        setTempRepId={setTempRepId}
        subjects={subjects}
        onSave={handleSaveTransition}
      />

      <ResetCalendarModal
        isOpen={showResetCalendarModal}
        onClose={() => setShowResetCalendarModal(false)}
        resetMode={resetMode}
        setResetMode={setResetMode}
        isResettingCalendar={isResettingCalendar}
        onConfirm={handleConfirmResetCalendar}
      />

      <BulkScheduleModal
        isOpen={showBulkScheduleModal && isWeeklyCycle}
        onClose={() => setShowBulkScheduleModal(false)}
        subjects={subjects}
        initialSubjectId={bulkInitialSubjectId}
        cycle={cycle}
        cycleSlotCounts={cycleSlotCounts}
        cycleWeekStart={cycleWeekStart}
        futureScheduleRules={futureScheduleRules}
        todayStr={getLocalDateStr ? getLocalDateStr() : ''}
        onApplySubjectDays={async (subId, days, count, fromDate = '') => {
          if (!subId || !applySubjectDaysInCalendar) return;
          const subName = subjects?.[subId]?.name || 'Matéria';
          const cleanFrom = /^\d{4}-\d{2}-\d{2}$/.test(String(fromDate || '')) ? String(fromDate) : '';
          await applySubjectDaysInCalendar(subId, days, count, cleanFrom);
          const brDate = cleanFrom ? cleanFrom.split('-').reverse().join('/') : '';
          if (days.length === 0) {
            toast.success(
              cleanFrom
                ? `${subName} removida do calendário a partir de ${brDate}.`
                : `${subName} removida de todos os dias do calendário.`
            );
          } else {
            toast.success(
              cleanFrom
                ? `${subName} programada em ${days.length} dia(s) da semana a partir de ${brDate}.`
                : `${subName} programada em ${days.length} dia(s) da semana.`
            );
          }
          if (cleanFrom) {
            const [fy, fm] = cleanFrom.split('-').map(Number);
            if (fy && fm && (fy !== year || fm - 1 !== month)) {
              setCalendarDate(new Date(fy, fm - 1, 1));
            }
          }
          setShowBulkScheduleModal(false);
        }}
        onClearAllCalendar={async () => {
          await executeSelectiveReset({ calendarSchedule: true });
          toast.success('Todas as matérias foram removidas do calendário.');
          setShowBulkScheduleModal(false);
        }}
      />
    </div>
  );
}
