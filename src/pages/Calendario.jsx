import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Trophy, 
  BookOpen, 
  Plus, 
  Trash2, 
  Sparkles, 
  Settings, 
  RotateCcw, 
  X, 
  Zap, 
  Target,
  Pin,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { parseDurationToSeconds, calculateLessonsForGoal } from '../lib/durationHelpers';

function formatMinutesToFriendly(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMins}m`;
}

const mesesNomesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
// Data de prova padrão antiga (valor inicial do app): se ainda for ela e já passou, o usuário nunca definiu a prova.
const LEGACY_DEFAULT_EXAM_DATE = '2026-08-15';

export default function Calendario() {
  const navigate = useNavigate();
  const { 
    calendarDate, 
    setCalendarDate, 
    subjects = {}, 
    cycle = [], 
    setCycle,
    cycleSlotCounts = [],
    setCycleSlotCounts,
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
    setDayOverride,
    removeDayOverride,
    futureScheduleRules = [],
    addFutureScheduleRule,
    updateSubject,
    executeSelectiveReset
  } = useStore();

  // Limpeza automática de regras sem versão v:2 de versões anteriores
  useEffect(() => {
    const hasLegacyRules = Array.isArray(futureScheduleRules) && futureScheduleRules.some(r => !r || r.v !== 2);
    if (hasLegacyRules) {
      useStore.setState({
        futureScheduleRules: (futureScheduleRules || []).filter(r => r && r.v === 2)
      });
    }
  }, [futureScheduleRules]);

  // Estados de Interface
  const [managingDay, setManagingDay] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [daySlotCounts, setDaySlotCounts] = useState([]);
  const [saveMode, setSaveMode] = useState('future'); // 'single' | 'future' | 'all'

  // Estado do Modal de Redefinição do Calendário
  const [showResetCalendarModal, setShowResetCalendarModal] = useState(false);
  const [resetMode, setResetMode] = useState('overrides'); // 'overrides' | 'clear_all' | 'reset_progress'
  const [isResettingCalendar, setIsResettingCalendar] = useState(false);

  // Estado do Modal de Transição de Matéria
  const [editingTransitionSub, setEditingTransitionSub] = useState(null);
  const [tempAction, setTempAction] = useState('keep_fixed');
  const [tempRepId, setTempRepId] = useState('');

  // Ao abrir a aba, o calendário sempre começa no mês atual (o mês visitado por último não é mais persistido)
  useEffect(() => {
    setCalendarDate(new Date());
  }, [setCalendarDate]);

  const rawCalDate = calendarDate ? new Date(calendarDate) : new Date();
  const calDate = isNaN(rawCalDate.getTime()) ? new Date() : rawCalDate;

  // Blocos concluídos só valem se foram marcados hoje
  const completedToday = useMemo(
    () => (completedTodayDate && completedTodayDate === getLocalDateStr() ? (rawCompletedToday || []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawCompletedToday, completedTodayDate, getLocalDateStr, todayKey]
  );

  // Previsões pesadas (até 1500 dias de simulação): só recalculam quando os dados de agenda mudam, não a cada render/modal
  const { subjectEstimates, estimatedDate } = useMemo(() => ({
    subjectEstimates: getSubjectEstimates ? getSubjectEstimates() : [],
    estimatedDate: getEstimatedCompletionDate ? getEstimatedCompletionDate() : { short: '', full: '', isLate: false, daysDiff: 0, examDateFormatted: '' }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    getSubjectEstimates, getEstimatedCompletionDate, subjects, cycle, cycleSlotCounts, currentDayIndex,
    completedToday, subjectTimeGoal, calendarOverrides, calendarOverrideCounts, futureScheduleRules,
    cycleScheduleType, cycleWeekStart, cycleCarryoverOffset, targetExamDate, todayKey
  ]);

  // Data da prova nunca definida pelo usuário (vazia ou padrão antigo já vencido): não exibe "Risco de Reprovação"
  const examDateNotSet = !targetExamDate || (targetExamDate === LEGACY_DEFAULT_EXAM_DATE && targetExamDate < (getLocalDateStr ? getLocalDateStr() : ''));
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasSemanaFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // "Hoje" recalculado quando o dia real muda (todayKey é atualizado pelo store na virada do dia)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayDateObj = useMemo(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }, [todayKey]);

  // Função principal: retorna as matérias e quantidades de aulas por bloco programadas para qualquer data do calendário
  const getDayScheduleForDate = useCallback((cellDateObj, dateKey) => {
    // 1a. Personalização manual explícita gravada para esta própria data tem prioridade máxima
    if (calendarOverrides && Array.isArray(calendarOverrides[dateKey])) {
      return {
        daySubjects: [...calendarOverrides[dateKey]],
        daySlotCounts: Array.isArray(calendarOverrideCounts?.[dateKey]) ? [...calendarOverrideCounts[dateKey]] : []
      };
    }

    const isTodayCell = cellDateObj.getTime() === todayDateObj.getTime();
    const shouldShiftCarryover = cycleScheduleType === 'weekly' && isTodayCell && cycleCarryoverOffset > 0;
    const effectiveDateObj = shouldShiftCarryover
      ? new Date(cellDateObj.getFullYear(), cellDateObj.getMonth(), cellDateObj.getDate() - cycleCarryoverOffset)
      : cellDateObj;
    const effectiveDateKey = shouldShiftCarryover
      ? `${effectiveDateObj.getFullYear()}-${String(effectiveDateObj.getMonth() + 1).padStart(2, '0')}-${String(effectiveDateObj.getDate()).padStart(2, '0')}`
      : dateKey;

    // 1b. Personalização manual do dia de origem quando em reposição automática
    if (shouldShiftCarryover && calendarOverrides && Array.isArray(calendarOverrides[effectiveDateKey])) {
      return {
        daySubjects: [...calendarOverrides[effectiveDateKey]],
        daySlotCounts: Array.isArray(calendarOverrideCounts?.[effectiveDateKey]) ? [...calendarOverrideCounts[effectiveDateKey]] : []
      };
    }

    let daySubjects = [];
    let slotCounts = [];

    // 2. Ciclo Semanal Fixo ou Sequencial + Regras Futuras
    if (cycle && cycle.length > 0) {
      const targetDayOfWeek = effectiveDateObj.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sáb
      const cycleIndex = getCycleIndexForDate
        ? getCycleIndexForDate(cellDateObj, todayDateObj)
        : ((cycleScheduleType === 'weekly')
          ? ((cycleWeekStart === 'monday') ? (targetDayOfWeek + 6) % 7 : targetDayOfWeek)
          : ((currentDayIndex + Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24))) % cycle.length + cycle.length) % cycle.length);

      const matchingRules = (futureScheduleRules || [])
        .filter(r => {
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

    return { daySubjects, daySlotCounts: slotCounts };
  }, [calendarOverrides, calendarOverrideCounts, cycle, cycleSlotCounts, cycleScheduleType, cycleWeekStart, cycleCarryoverOffset, currentDayIndex, futureScheduleRules, getCycleIndexForDate, todayDateObj]);

  const getDaySubjectsForDate = (cellDateObj, dateKey) => getDayScheduleForDate(cellDateObj, dateKey).daySubjects;

  // 3. Simulação dos 730 dias para sincronização e previsão de término das disciplinas (memoizada)
  const { futureSchedule, calCompletionDates, remainingLessonsQueue, initialSubjectQueues } = useMemo(() => {
  const futureSchedule = {}; // dateKey -> array of { id, count, isLast, isTransitioned, lessons }
  const calCompletionDates = {}; // subjectId -> { dayOffset, dateStr, dateObj }
  const remainingLessonsQueue = {};
  const initialSubjectQueues = {};

  Object.values(subjects || {}).forEach(sub => {
    const spd = Math.max(0.5, Number(sub.speed) || 1);
    const q = [];
    (sub.topics || []).forEach(t => {
      const completed = t.completed || 0;
      const topicLessonsArr = t.lessons || [];
      for (let idx = completed; idx < t.total; idx++) {
        const lesson = topicLessonsArr[idx];
        const origSec = parseDurationToSeconds(lesson?.duration);
        const mins = (origSec > 0 ? origSec : 3600) / 60;
        const rawName = typeof lesson?.name === 'string' ? lesson.name.trim() : '';
        const isGeneric = !rawName || /^(aula|v[ií]deo)\s*0*\d+$/i.test(rawName);
        const fallbackLabel = rawName || `Aula ${idx + 1}`;
        const displayName = isGeneric
          ? (t.name ? `${t.name} - ${fallbackLabel}` : fallbackLabel)
          : rawName;
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
    remainingLessonsQueue[sub.id] = q;
    initialSubjectQueues[sub.id] = [...q];
  });

  for (let i = 0; i < 730; i++) {
    if (cycle.length === 0 && (!calendarOverrides || Object.keys(calendarOverrides).length === 0) && (!futureScheduleRules || futureScheduleRules.length === 0)) break;

    const targetSimDate = new Date(todayDateObj);
    targetSimDate.setDate(targetSimDate.getDate() + i);
    const simDateKey = `${targetSimDate.getFullYear()}-${String(targetSimDate.getMonth() + 1).padStart(2, '0')}-${String(targetSimDate.getDate()).padStart(2, '0')}`;

    const { daySubjects, daySlotCounts: simSlotCounts } = getDayScheduleForDate(targetSimDate, simDateKey);

    const scheduledThisDay = [];

    daySubjects.forEach((subId, slotIdx) => {
      if (i === 0 && completedToday.includes(slotIdx)) return;

      let effectiveSubId = subId;
      let q = remainingLessonsQueue[effectiveSubId];
      let wasTransitioned = false;

      // Se a matéria esgotou suas aulas em uma data anterior, verifica a regra de transição (suporta cadeia A -> B -> C):
      const visited = new Set([effectiveSubId]);
      while (!q || q.length === 0) {
        const currentSub = subjects[effectiveSubId];
        const action = currentSub?.onCompleteAction || 'keep_fixed';

        if (action === 'replace' && currentSub?.replacementSubjectId && subjects[currentSub.replacementSubjectId] && !visited.has(currentSub.replacementSubjectId)) {
          const repId = currentSub.replacementSubjectId;
          visited.add(repId);
          effectiveSubId = repId;
          q = remainingLessonsQueue[repId];
          wasTransitioned = true;
        } else if (action === 'double_remaining') {
          const fallbackId = daySubjects.find(sId => !visited.has(sId) && remainingLessonsQueue[sId]?.length > 0);
          if (fallbackId) {
            visited.add(fallbackId);
            effectiveSubId = fallbackId;
            q = remainingLessonsQueue[fallbackId];
            wasTransitioned = true;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Somente agenda no calendário se a matéria (ou sua substituta) ainda possuir aulas a serem estudadas!
      // Assim que uma matéria conclui todas as suas aulas na data de término (isLast), ela NÃO aparece nos dias seguintes.
      if (q && q.length > 0) {
        const sub = subjects[effectiveSubId];
        const spd = Math.max(0.5, Number(sub?.speed) || 1);
        const customSlotLessons = !wasTransitioned ? Math.floor(Number(simSlotCounts?.[slotIdx]) || 0) : 0;
        const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(sub?.lessonsPerBlock) || 0);
        const goalMin = customSlotLessons > 0 ? 0 : (Number(sub?.timeGoalMinutes || subjectTimeGoal?.[effectiveSubId]) || 0);

        const suggestion = calculateLessonsForGoal(q, 0, spd, goalMin, q.length, lessonsN);
        const consumed = Math.min(q.length, Math.max(1, suggestion.count || 1));
        const consumedLessons = q.splice(0, consumed);

        const isLast = q.length === 0;
        scheduledThisDay.push({ 
          id: effectiveSubId, 
          isLast, 
          count: consumed,
          customCount: customSlotLessons,
          isTransitioned: wasTransitioned,
          lessons: consumedLessons
        });

        if (isLast && !calCompletionDates[effectiveSubId]) {
          const dStr = `${String(targetSimDate.getDate()).padStart(2, '0')}/${mesesNomesShort[targetSimDate.getMonth()]}/${targetSimDate.getFullYear()}`;
          calCompletionDates[effectiveSubId] = {
            dayOffset: i,
            dateObj: new Date(targetSimDate),
            dateStr: dStr
          };
        }
      }
    });

    futureSchedule[simDateKey] = scheduledThisDay;
  }

  return { futureSchedule, calCompletionDates, remainingLessonsQueue, initialSubjectQueues };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, cycle, cycleSlotCounts, cycleScheduleType, cycleWeekStart, currentDayIndex, completedToday, calendarOverrides, calendarOverrideCounts, futureScheduleRules, subjectTimeGoal, todayKey, getDayScheduleForDate, todayDateObj]);

  // Prévia dinâmica das aulas previstas para cada bloco no modal "Gerenciar Dia"
  const managingDayPreviewLessons = useMemo(() => {
    if (!managingDay) return [];
    const consumedBeforeDate = {};
    Object.entries(futureSchedule || {}).forEach(([dKey, items]) => {
      if (dKey < managingDay.dateKey && Array.isArray(items)) {
        items.forEach(item => {
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

      if (!sub || remainingQueue.length === 0) {
        return [];
      }

      const spd = Math.max(0.5, Number(sub.speed) || 1);
      const customSlotLessons = Math.floor(Number(daySlotCounts?.[idx]) || 0);
      const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(sub.lessonsPerBlock) || 0);
      const goalMin = customSlotLessons > 0 ? 0 : (Number(sub.timeGoalMinutes || subjectTimeGoal?.[subId]) || 0);

      const suggestion = calculateLessonsForGoal(remainingQueue, 0, spd, goalMin, remainingQueue.length, lessonsN);
      const consumed = Math.min(remainingQueue.length, Math.max(1, suggestion.count || 1));
      const pickedLessons = remainingQueue.slice(0, consumed);
      sameDayOffset[subId] = (sameDayOffset[subId] || 0) + consumed;
      return pickedLessons;
    });
  }, [managingDay, futureSchedule, daySlots, daySlotCounts, subjects, initialSubjectQueues, subjectTimeGoal]);

  // Botão tático para fixar e limpar quaisquer extensões fantasmas (+3ª) ou regras antigas
  const handleFixCalendar = () => {
    useStore.setState({
      scheduleExtensions: [],
      futureScheduleRules: [],
      calendarOverrides: {},
      calendarOverrideCounts: {}
    });
    toast.success("Calendário 100% fixado no padrão do seu ciclo semanal!");
  };

  // Handler do Modal de Redefinição do Calendário
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
        toast.success("Calendário redefinido para o padrão do ciclo semanal!");
      } else if (resetMode === 'clear_all') {
        if (executeSelectiveReset) {
          await executeSelectiveReset({ calendarSchedule: true });
        }
        toast.success("Grade do calendário e do ciclo zerada! Suas disciplinas foram mantidas.");
      } else if (resetMode === 'reset_progress') {
        if (executeSelectiveReset) {
          await executeSelectiveReset({ watchedLessons: true });
        }
        toast.success("Progresso das aulas reiniciado! O calendário voltou para a Aula 1.");
      }
      setShowResetCalendarModal(false);
    } catch (err) {
      console.error("Erro ao redefinir calendário:", err);
      toast.error("Ocorreu um erro ao redefinir o calendário.");
    } finally {
      setIsResettingCalendar(false);
    }
  };

  // Handlers do Gerenciador de Dia
  const handleOpenDayManager = (cellDateObj, dateKey) => {
    const diff = Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return; // Dias passados não abrem o gerenciador

    const dayOfWeek = cellDateObj.getDay();
    const weekIndex = cycleScheduleType === 'weekly'
      ? ((cycleWeekStart === 'monday') ? (dayOfWeek + 6) % 7 : dayOfWeek)
      : ((currentDayIndex + diff) % Math.max(1, cycle.length) + Math.max(1, cycle.length)) % Math.max(1, cycle.length);

    const baseSubs = (cycle && Array.isArray(cycle[weekIndex])) ? [...cycle[weekIndex]] : [];
    const { daySubjects: scheduledSubs, daySlotCounts: scheduledCounts } = getDayScheduleForDate(cellDateObj, dateKey);

    // Lê as matérias configuradas ou exibidas neste card do calendário
    const currentDaySubs = scheduledSubs.length > 0
      ? scheduledSubs
      : (futureSchedule[dateKey] !== undefined ? futureSchedule[dateKey].map(item => item.id) : []);

    const currentDayCounts = currentDaySubs.map((_, idx) => Math.max(0, Math.floor(Number(scheduledCounts?.[idx]) || 0)));

    const hasCustomOverride = Boolean(calendarOverrides && Array.isArray(calendarOverrides[dateKey]));
    const hasFutureRuleOnDay = (futureScheduleRules || []).some(
      r => r && r.v === 2 && r.fromDate <= dateKey && ((cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) ? r.dayOfWeek === dayOfWeek : (r.dayOfWeek === dayOfWeek || r.cycleIndex === weekIndex))
    );
    const hasDiffFromBase = currentDaySubs.length !== baseSubs.length || currentDaySubs.some((id, idx) => id !== baseSubs[idx]);

    setManagingDay({
      dateObj: cellDateObj,
      dateKey,
      dayOfWeek,
      weekIndex,
      isCustomized: hasCustomOverride || hasFutureRuleOnDay || hasDiffFromBase
    });
    setDaySlots(currentDaySubs);
    setDaySlotCounts(currentDayCounts);
    setSaveMode('future'); // padrão: aplicar desta data para o futuro (sem alterar o passado)
  };

  // Navegação entre dias dentro do gerenciador (setas na tela e teclado ← →)
  const canGoPrevDay = Boolean(managingDay) && Math.round((managingDay.dateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24)) > 0;

  const navigateManagedDay = (delta) => {
    if (!managingDay) return;
    const d = managingDay.dateObj;
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
    if (target.getTime() < todayDateObj.getTime()) return;
    const key = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    handleOpenDayManager(target, key);
    if (target.getFullYear() !== year || target.getMonth() !== month) {
      setCalendarDate(new Date(target.getFullYear(), target.getMonth(), 1));
    }
  };

  const navigateManagedDayRef = React.useRef(navigateManagedDay);
  navigateManagedDayRef.current = navigateManagedDay;

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

  const handleSaveDayManager = () => {
    if (!managingDay) return;
    const { dateKey, dayOfWeek, weekIndex } = managingDay;
    const updatedSlots = [...daySlots];
    const updatedCounts = updatedSlots.map((_, idx) => Math.max(0, Math.floor(Number(daySlotCounts?.[idx]) || 0)));

    if (saveMode === 'single') {
      // 1. Salva apenas nesta data específica (prioridade absoluta sobre regras e extensões)
      if (setDayOverride) {
        setDayOverride(dateKey, updatedSlots, updatedCounts);
        toast.success(`Programação salva exclusivamente para ${dateKey}!`);
      }
    } else if (saveMode === 'future') {
      // 2. Torna padrão a partir desta data para o FUTURO (preserva todos os dias anteriores/passado intactos!)
      if (addFutureScheduleRule) {
        addFutureScheduleRule({
          fromDate: dateKey,
          dayOfWeek,
          cycleIndex: weekIndex,
          daySlots: updatedSlots,
          slotCounts: updatedCounts
        });
      }
      // Remove overrides avulsos desta data em diante neste mesmo dia da semana para que a regra futura prevaleça
      const nextOverrides = { ...(calendarOverrides || {}) };
      const nextOverrideCounts = { ...(calendarOverrideCounts || {}) };
      Object.keys(nextOverrides).forEach(dKey => {
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
      const todayStr = getLocalDateStr ? getLocalDateStr() : '';
      useStore.setState({
        calendarOverrides: nextOverrides,
        calendarOverrideCounts: nextOverrideCounts,
        ...(dateKey === todayStr ? { cycleCarryoverOffset: 0, lastCarryoverCheckDate: todayStr } : {})
      });
      toast.success(`Programação definida de ${dateKey} para o futuro! Os dias anteriores não foram alterados.`);
    } else {
      // 3. Atualiza o ciclo semanal base para todas as semanas neste dia e limpa regras antigas conflitantes
      if (setCycle) {
        const totalDays = cycleScheduleType === 'weekly' ? 7 : Math.max((cycle || []).length, weekIndex + 1);
        const newCycle = Array.from({ length: totalDays }, (_, i) => Array.isArray(cycle?.[i]) ? [...cycle[i]] : []);
        const newCycleSlotCounts = Array.from({ length: totalDays }, (_, i) => Array.isArray(cycleSlotCounts?.[i]) ? [...cycleSlotCounts[i]] : []);
        newCycle[weekIndex] = updatedSlots;
        newCycleSlotCounts[weekIndex] = updatedCounts;
        setCycle(newCycle);
        if (setCycleSlotCounts) setCycleSlotCounts(newCycleSlotCounts);
        if (removeDayOverride) removeDayOverride(dateKey);

        // Remove regras futuras antigas que sobrescreviam este dia da semana
        const cleanedRules = (futureScheduleRules || []).filter(
          r => r && r.v === 2 && r.dayOfWeek !== dayOfWeek && r.cycleIndex !== weekIndex
        );
        const todayStr = getLocalDateStr ? getLocalDateStr() : '';
        useStore.setState({
          futureScheduleRules: cleanedRules,
          ...(dateKey === todayStr ? { cycleCarryoverOffset: 0, lastCarryoverCheckDate: todayStr } : {})
        });

        toast.success(`Ciclo semanal base atualizado com sucesso!`);
      }
    }

    setManagingDay(null);
  };

  const handleResetDayToDefault = () => {
    if (!managingDay) return;
    const { dateKey, dayOfWeek, weekIndex } = managingDay;
    if (removeDayOverride) removeDayOverride(dateKey);

    // Remove apenas regras futuras que afetam este dia da semana a partir desta data (preservando anteriores)
    const cleanedRules = (futureScheduleRules || []).filter(
      r => r && r.v === 2 && !((r.dayOfWeek === dayOfWeek || r.cycleIndex === weekIndex) && r.fromDate >= dateKey)
    );
    useStore.setState({ futureScheduleRules: cleanedRules });

    toast.success(`Programação restaurada a partir de ${dateKey}!`);
    setManagingDay(null);
  };

  // Handlers para Transição de Conclusão no Painel Lateral
  const handleOpenTransitionModal = (sub) => {
    setEditingTransitionSub(sub);
    const currentAct = (sub.onCompleteAction === 'replace' || sub.onCompleteAction === 'double_remaining')
      ? sub.onCompleteAction
      : 'keep_fixed';
    setTempAction(currentAct);
    setTempRepId(sub.replacementSubjectId || '');
  };

  const handleSaveTransition = () => {
    if (!editingTransitionSub) return;
    if (tempAction === 'replace' && !tempRepId) {
      toast.error("Selecione qual disciplina substituta deve entrar no lugar!");
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

  return (
    <div className="flex flex-col lg:flex-row items-start gap-5 lg:gap-6 w-full pb-10 fade-in">
      <div className="flex-1 min-w-0 w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        
        {/* Banner de Previsão de Término */}
        <div className={`text-white p-4 sm:p-5 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${(estimatedDate.isLate && !examDateNotSet) ? 'bg-gradient-to-r from-red-600 to-rose-700 dark:from-red-950/90 dark:via-rose-950/90 dark:to-slate-900 border border-red-500/40' : 'bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-slate-900 dark:via-[#141F36] dark:to-blue-950/90 dark:border dark:border-blue-500/25'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-white/20 p-2 rounded-full shrink-0 dark:bg-slate-900">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
            </div>
            <div className="min-w-0">
              <p className="text-blue-100 text-[11px] font-bold uppercase tracking-wider mb-0.5">Previsão de Fechamento do Edital</p>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight">{estimatedDate.full}</h4>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end shrink-0">
            <div className="bg-black/20 px-3 py-1.5 rounded-lg text-xs md:text-sm text-white font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4"/> {examDateNotSet ? 'Prova: não definida' : `Prova: ${estimatedDate.examDateFormatted}`}
            </div>
            {examDateNotSet ? (
              <button
                onClick={() => navigate('/config')}
                className="text-xs font-black text-yellow-300 mt-2 uppercase md:text-right underline underline-offset-2 hover:text-yellow-200 cursor-pointer"
              >
                Defina a data da prova
              </button>
            ) : estimatedDate.isLate && (
              <span className="text-xs font-black text-yellow-300 mt-2 uppercase md:text-right">
                Risco de Reprovação: Atrasado {estimatedDate.daysDiff} dias. Aumente seu ritmo!
              </span>
            )}
          </div>
        </div>

        {/* Cabeçalho do Mês no Calendário */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100 mr-1">
              <CalendarIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" /> {mesesNomes[month]} {year}
            </h2>
            <button
              onClick={handleFixCalendar}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs hover:bg-emerald-200/80 dark:hover:bg-emerald-900/70 transition-colors cursor-pointer"
              title="Fixar a grade semanal e remover quaisquer extensões ou regras que alteravam a programação"
            >
              <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Grade Semanal Fixa
            </button>
            <button
              type="button"
              onClick={() => {
                setResetMode('overrides');
                setShowResetCalendarModal(true);
              }}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80 dark:hover:bg-red-900/60 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Redefinir programação, edições manuais ou progresso das aulas no calendário"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Redefinir
            </button>
          </div>
          <div className="flex gap-1.5 items-center">
            <button onClick={() => setCalendarDate(new Date())} className="h-8 px-3 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:bg-slate-950 dark:border-slate-800 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors" title="Voltar ao mês atual">Hoje</button>
            <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:bg-slate-950 dark:border-slate-800 cursor-pointer flex items-center justify-center transition-colors" title="Mês anterior"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:bg-slate-950 dark:border-slate-800 cursor-pointer flex items-center justify-center transition-colors" title="Próximo mês"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        
        {/* Grade do Calendário */}
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[560px] sm:min-w-0">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
              {diasSemana.map(dia => <div key={dia} className="text-center font-bold text-slate-400 text-xs sm:text-sm">{dia}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {blanks.map((_, i) => <div key={`blank-${i}`} className="min-h-[6rem] md:min-h-[8.25rem] bg-slate-50/50 rounded-lg dark:bg-slate-950/30"></div>)}
              {days.map(day => {
                const cellDateObj = new Date(year, month, day);
                const cellTime = cellDateObj.getTime();
                const todayTime = todayDateObj.getTime();
                const diffDays = Math.round((cellTime - todayTime) / (1000 * 60 * 60 * 24));
                const isTodayReal = diffDays === 0;
                const isPast = diffDays < 0;

                let bgClass = isPast 
                  ? "bg-slate-50/80 text-slate-400 border border-slate-200/40 dark:bg-slate-950/40 dark:border-slate-800/40 dark:text-slate-600 cursor-default" 
                  : isTodayReal 
                    ? "bg-blue-50 border-2 border-blue-500 shadow-sm text-blue-700 dark:bg-blue-950/35 dark:border-blue-500/80 dark:text-blue-300 cursor-pointer hover:ring-2 hover:ring-blue-400/50 hover:shadow-md" 
                    : "bg-white border border-slate-200/80 hover:bg-slate-50 dark:hover:bg-slate-900/90 text-slate-700 dark:bg-slate-950/80 dark:border-slate-800 dark:text-slate-300 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md";

                const cellDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isOverridden = !isPast && Boolean(calendarOverrides && calendarOverrides[cellDateKey]);
                
                // Dias passados ficam limpos (sem exibir matérias)
                let dayItemsToRender = [];
                if (!isPast) {
                  if (futureSchedule[cellDateKey] !== undefined) {
                    dayItemsToRender = futureSchedule[cellDateKey];
                  } else {
                    const baseIds = getDaySubjectsForDate(cellDateObj, cellDateKey);
                    dayItemsToRender = baseIds
                      .filter(id => (remainingLessonsQueue[id]?.length || 0) > 0)
                      .map(id => ({ id, isLast: false, isTransitioned: false }));
                  }
                }

                return (
                  <div 
                    key={day} 
                    onClick={() => !isPast && handleOpenDayManager(cellDateObj, cellDateKey)}
                    className={`min-h-[6rem] md:min-h-[8.25rem] min-w-0 p-1.5 sm:p-2 rounded-lg flex flex-col transition-all group ${bgClass}`}
                    title={isPast ? "Dia já concluído / passado" : "Clique para gerenciar matérias deste dia"}
                  >
                    <div className="flex justify-between items-start mb-1.5 gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-xs sm:text-sm px-0.5 transition-colors ${!isPast ? 'group-hover:text-blue-500' : ''}`}>{day}</span>
                        {isOverridden && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Dia com personalização manual avulsa" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isTodayReal && <span className="text-[9px] sm:text-[10px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-sm">HOJE</span>}
                        {!isPast && <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </div>
                    
                    {dayItemsToRender.length > 0 && (
                      <div className="flex flex-col gap-1 pb-0.5 mt-auto min-w-0">
                        {dayItemsToRender.map((item, idx) => {
                          const sub = subjects[item.id];
                          if (!sub) return null;
                          const lessonsList = Array.isArray(item.lessons) ? item.lessons : [];
                          const blockTooltip = lessonsList.length > 0
                            ? `${sub.name}: ${lessonsList.map(l => l.name).join(' • ')}`
                            : sub.name;
                          return (
                            <div
                              key={idx}
                              title={blockTooltip}
                              className={`flex flex-col gap-0.5 min-w-0 text-[10px] sm:text-[11px] font-bold px-1.5 py-1 rounded-md leading-tight ${sub.color}`}
                            >
                              <div className="flex items-center justify-between gap-0.5 min-w-0">
                                <span className="truncate flex-1 min-w-0">
                                  {sub.name}
                                  {item.isTransitioned && (
                                    <span className="opacity-80 text-[8px] font-black uppercase tracking-tight ml-1 bg-black/20 dark:bg-white/20 px-1 py-0.2 rounded">
                                      SUBST.
                                    </span>
                                  )}
                                </span>
                                {item.count >= 1 && (
                                  <span
                                    className="ml-1 px-1 py-0.2 rounded text-[9px] font-black bg-black/25 dark:bg-white/20 shrink-0"
                                    title={`${item.count} ${item.count === 1 ? 'aula prevista' : 'aulas previstas'} neste bloco`}
                                  >
                                    {item.count}a
                                  </span>
                                )}
                                {item.isLast && (
                                  <span title={`Conclusão prevista de ${sub.name}!`} className="flex items-center ml-0.5 shrink-0">
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none">
                                      <path d="M12 2L22 20H2L12 2Z" fill="white" stroke="#E81C23" strokeWidth="3" strokeLinejoin="round"/>
                                      <path d="M12 8V14" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
                                      <circle cx="12" cy="17.5" r="1.5" fill="#1A1A1A"/>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {lessonsList.length > 0 && (
                                <div className="mt-0.5 pt-0.5 border-t border-black/15 dark:border-white/15 flex flex-col gap-0.5 min-w-0">
                                  {lessonsList.map((les, lIdx) => (
                                    <span
                                      key={lIdx}
                                      className="text-[10px] font-medium leading-tight truncate opacity-95"
                                      title={les.topicName && !les.name.includes(les.topicName) ? `${les.topicName} • ${les.name}${les.duration ? ` (${les.duration})` : ''}` : `${les.name}${les.duration ? ` (${les.duration})` : ''}`}
                                    >
                                      • {les.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Painel Lateral: Fim das Disciplinas & Transições */}
      <div className="w-full lg:w-72 xl:w-80 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 flex flex-col shrink-0 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:text-slate-100 dark:border-slate-800">
          <BookOpen className="text-blue-600 w-5 h-5" /> Fim das Disciplinas
        </h3>
        <div className="flex flex-col gap-3">
          {subjectEstimates.map(sub => {
            const totalClasses = (sub.topics || []).reduce((acc, t) => acc + (t.total || 0), 0);
            const completedClasses = Math.max(0, totalClasses - sub.remaining);
            const pct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;
            const currentSpeed = Number(sub.speed) || 1;
            const currentTimeGoal = Number(sub.timeGoalMinutes) || 0;

            const calFinish = calCompletionDates[sub.id];
            const displayDateStr = calFinish ? calFinish.dateStr : sub.dateStr;

            return (
              <div key={sub.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2 hover:border-blue-300 dark:hover:border-blue-900 transition-all bg-slate-50/70 dark:bg-slate-950/70 shadow-sm">
                <div className="flex justify-between items-start gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase ${sub.color}`}>{sub.name}</span>
                    {currentSpeed > 1 && (
                      <span className="text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900 flex items-center gap-0.5" title={`Aceleração de vídeo: ${currentSpeed}x`}>
                        <Zap className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" /> {currentSpeed}x
                      </span>
                    )}
                    {currentTimeGoal > 0 && (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 flex items-center gap-0.5" title={`Meta por bloco no ciclo: ${currentTimeGoal} min`}>
                        <Target className="w-2.5 h-2.5" /> {formatMinutesToFriendly(currentTimeGoal)}
                      </span>
                    )}
                  </div>
                  {sub.remaining === 0 ? (
                    <span className="flex items-center gap-1 text-xs font-black text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Concluído</span>
                  ) : (
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight shrink-0">{displayDateStr}</span>
                  )}
                </div>

                {sub.remaining > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span>{sub.remaining} aulas restantes</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleOpenTransitionModal(sub)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" /> Regra ao concluir...
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {sub.onCompleteAction === 'replace' ? '🔄 Substituir' : sub.onCompleteAction === 'double_remaining' ? '⚡ Dobrar Dia' : '✅ Encerrar ao Fim'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: GERENCIADOR DE DIA DO CALENDÁRIO */}
      {managingDay && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setManagingDay(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1 pr-8">
                <button
                  type="button"
                  onClick={() => navigateManagedDay(-1)}
                  disabled={!canGoPrevDay}
                  title="Dia anterior (←)"
                  aria-label="Dia anterior"
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 text-center">
                    {managingDay.dateKey} ({diasSemanaFull[managingDay.dateObj.getDay()]})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigateManagedDay(1)}
                  title="Próximo dia (→)"
                  aria-label="Próximo dia"
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mb-1">Use as setas ← → do teclado para trocar de dia (alterações não salvas deste dia são descartadas)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste os blocos deste dia e decida se a alteração se aplica apenas a esta data ou se torna o novo padrão para o futuro.
              </p>
            </div>

            {/* Lista de Blocos Agendados para o Dia */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Blocos de Estudo Agendados ({daySlots.length})
              </label>

              {daySlots.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                  Nenhum bloco agendado para este dia (Dia de Descanso).
                </div>
              ) : (
                daySlots.map((subId, idx) => {
                  const sub = subjects[subId];
                  const slotCountVal = Math.max(0, Math.floor(Number(daySlotCounts?.[idx]) || 0));
                  const defaultLabel = sub
                    ? (Number(sub.lessonsPerBlock) > 0
                        ? `Padrão (${sub.lessonsPerBlock}a)`
                        : (Number(sub.timeGoalMinutes || subjectTimeGoal?.[subId]) > 0
                            ? `Padrão (${formatMinutesToFriendly(Number(sub.timeGoalMinutes || subjectTimeGoal?.[subId]))})`
                            : 'Padrão (1a)'))
                    : 'Padrão';

                  const updateSlotCount = (val) => {
                    const next = [...daySlotCounts];
                    while (next.length < daySlots.length) next.push(0);
                    next[idx] = Math.min(50, Math.max(0, Math.floor(Number(val) || 0)));
                    setDaySlotCounts(next);
                  };

                  return (
                    <div key={idx} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-400 w-6 text-center">
                          #{idx + 1}
                        </span>
                        <select
                          value={subId}
                          onChange={(e) => {
                            const newSlots = [...daySlots];
                            newSlots[idx] = e.target.value;
                            setDaySlots(newSlots);
                          }}
                          className={`flex-1 text-xs font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-700 outline-none cursor-pointer ${sub ? sub.color : 'bg-white text-slate-800'}`}
                        >
                          {Object.values(subjects).map(s => (
                            <option key={s.id} value={s.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">{s.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setDaySlots(daySlots.filter((_, i) => i !== idx));
                            setDaySlotCounts((daySlotCounts || []).filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remover este bloco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Seletor de Quantidade de Aulas neste Dia para este Bloco */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pl-8 pr-1 pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Qtd. de aulas neste dia:
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateSlotCount(0)}
                            className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                              slotCountVal === 0
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-white'
                            }`}
                            title="Usar a configuração padrão da disciplina"
                          >
                            {defaultLabel}
                          </button>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => updateSlotCount(n)}
                              className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                                slotCountVal === n
                                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {n} {n === 1 ? 'aula' : 'aulas'}
                            </button>
                          ))}
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                              slotCountVal > 5
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-400'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                            title="Digitar outra quantidade de aulas para este dia"
                          >
                            <input
                              type="number"
                              min="0"
                              max="50"
                              placeholder="Nº"
                              value={slotCountVal > 0 ? slotCountVal : ''}
                              onChange={(e) => updateSlotCount(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                              className="w-8 bg-transparent text-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 outline-none"
                            />
                            <span className="text-[9px] font-bold text-slate-400">aulas</span>
                          </div>
                        </div>
                      </div>

                      {/* Prévia das Aulas Previstas neste Bloco */}
                      {(() => {
                        const previewLessons = managingDayPreviewLessons[idx] || [];
                        return (
                          <div className="pl-8 pr-1 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/60">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                              Aulas previstas neste bloco ({previewLessons.length}):
                            </span>
                            {previewLessons.length > 0 ? (
                              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                                {previewLessons.map((les, lIdx) => (
                                  <div
                                    key={lIdx}
                                    className="flex items-center justify-between gap-2 text-[11px] bg-white dark:bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-slate-700 dark:text-slate-200 truncate" title={les.name}>
                                        {les.name}
                                      </p>
                                      {les.topicName && !les.name.includes(les.topicName) && (
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate" title={les.topicName}>
                                          {les.topicName}
                                        </p>
                                      )}
                                    </div>
                                    {les.duration && les.duration !== '00:00' && (
                                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                        {les.duration}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] italic text-amber-600 dark:text-amber-400">
                                Todas as aulas desta disciplina já foram concluídas antes desta data.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>

            {/* Adicionar Novo Bloco neste Dia */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const firstSubId = Object.keys(subjects)[0] || '';
                  if (firstSubId) {
                    setDaySlots([...daySlots, firstSubId]);
                    setDaySlotCounts([...(daySlotCounts || []), 0]);
                  }
                }}
                className="w-full py-2 border-2 border-dashed border-blue-300 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Bloco de Estudo neste Dia ({daySlots.length + 1}º Bloco)
              </button>
            </div>

            {/* SELEÇÃO DO ESCOPO DE SALVAMENTO */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" /> Onde aplicar estas alterações?
              </label>

              <div className="grid grid-cols-1 gap-2">
                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${saveMode === 'future' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                  <input 
                    type="radio" 
                    name="saveModeRadio" 
                    value="future" 
                    checked={saveMode === 'future'} 
                    onChange={() => setSaveMode('future')}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      🚀 Tornar padrão para o Futuro (a partir de {managingDay.dateKey})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Aplica esta programação nas próximas <strong>{diasSemanaFull[managingDay.dayOfWeek]}s</strong> desta data em diante. <strong>Os dias anteriores (passado) não serão alterados!</strong>
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${saveMode === 'single' ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                  <input 
                    type="radio" 
                    name="saveModeRadio" 
                    value="single" 
                    checked={saveMode === 'single'} 
                    onChange={() => setSaveMode('single')}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      💾 Apenas neste dia ({managingDay.dateKey})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Modifica exclusivamente esta data ({managingDay.dateKey}). As semanas anteriores e seguintes não serão alteradas.
                    </span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${saveMode === 'all' ? 'bg-amber-50 border-amber-500 dark:bg-amber-950/40 dark:border-amber-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                  <input 
                    type="radio" 
                    name="saveModeRadio" 
                    value="all" 
                    checked={saveMode === 'all'} 
                    onChange={() => setSaveMode('all')}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      📌 Fixar em todas as {diasSemanaFull[managingDay.dayOfWeek]}s do Ciclo Base
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Atualiza o ciclo semanal inteiro (incluindo as semanas anteriores a esta data).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Botões de Ação do Modal */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveDayManager}
                className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  saveMode === 'future'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : saveMode === 'all'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> 
                {saveMode === 'future'
                  ? `Aplicar de ${managingDay.dateKey} para o Futuro`
                  : saveMode === 'all'
                    ? `Fixar em todas as ${diasSemanaFull[managingDay.dayOfWeek]}s do Ciclo`
                    : `Salvar Apenas neste Dia (${managingDay.dateKey})`}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {daySlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDaySlots([]);
                      setDaySlotCounts([]);
                      toast.info('Blocos removidos. Clique no botão de salvar acima para confirmar este dia livre.');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar / Redefinir Dia
                  </button>
                )}

                {managingDay.isCustomized && (
                  <button
                    type="button"
                    onClick={handleResetDayToDefault}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão do Ciclo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: CONFIGURAÇÃO DE TRANSIÇÃO DE UMA MATÉRIA */}
      {editingTransitionSub && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative flex flex-col gap-4">
            <button 
              onClick={() => setEditingTransitionSub(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${editingTransitionSub.color}`}>
                {editingTransitionSub.name}
              </span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2">
                Regra ao Concluir Conteúdo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quando você terminar todas as aulas desta matéria, o que deve acontecer com seus blocos nos dias seguintes?
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${tempAction === 'keep_fixed' ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                <input 
                  type="radio" 
                  name="modalAction" 
                  value="keep_fixed" 
                  checked={tempAction === 'keep_fixed'} 
                  onChange={() => setTempAction('keep_fixed')}
                  className="mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">✅ Encerrar Matéria na Data de Término (Liberar Vaga)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Assim que a última aula for concluída, a matéria deixa de aparecer nos dias seguintes.</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${tempAction === 'double_remaining' ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                <input 
                  type="radio" 
                  name="modalAction" 
                  value="double_remaining" 
                  checked={tempAction === 'double_remaining'} 
                  onChange={() => setTempAction('double_remaining')}
                  className="mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">⚡ Dobrar a Outra Matéria do Dia</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">A outra disciplina programada no mesmo dia assume a vaga deixada até concluir.</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${tempAction === 'replace' ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                <input 
                  type="radio" 
                  name="modalAction" 
                  value="replace" 
                  checked={tempAction === 'replace'} 
                  onChange={() => setTempAction('replace')}
                  className="mt-0.5"
                />
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">🔄 Ingressar Nova Disciplina</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Uma disciplina cadastrada que ainda não foi estudada entra no lugar.</span>
                  
                  {tempAction === 'replace' && (
                    <select
                      value={tempRepId}
                      onChange={(e) => setTempRepId(e.target.value)}
                      className="text-xs font-bold p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Selecione a disciplina substituta --</option>
                      {Object.values(subjects)
                        .filter(s => s.id !== editingTransitionSub.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  )}
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTransitionSub(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTransition}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Salvar Regra
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: REDEFINIR CALENDÁRIO */}
      {showResetCalendarModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => !isResettingCalendar && setShowResetCalendarModal(false)}
              disabled={isResettingCalendar}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/70 text-red-600 dark:text-red-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                    Redefinir Calendário
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Escolha o que deseja redefinir no seu planejamento do calendário.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${resetMode === 'overrides' ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                <input
                  type="radio"
                  name="resetCalendarMode"
                  value="overrides"
                  checked={resetMode === 'overrides'}
                  onChange={() => setResetMode('overrides')}
                  className="mt-1"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    📌 Restaurar Padrão do Ciclo Semanal (Limpar Edições do Calendário)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Remove personalizações manuais de dias avulsos, regras futuras e deslocamentos de reposição, voltando ao ciclo semanal base.
                  </span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${resetMode === 'clear_all' ? 'bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                <input
                  type="radio"
                  name="resetCalendarMode"
                  value="clear_all"
                  checked={resetMode === 'clear_all'}
                  onChange={() => setResetMode('clear_all')}
                  className="mt-1"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    🗑️ Zerar Toda a Grade do Calendário e Ciclo (Limpar Todos os Dias)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Remove todas as matérias agendadas nos dias do calendário e do ciclo semanal, <strong>mantendo intactas</strong> todas as matérias e aulas em &quot;Minhas Disciplinas&quot;.
                  </span>
                </div>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${resetMode === 'reset_progress' ? 'bg-amber-50 border-amber-500 dark:bg-amber-950/40 dark:border-amber-600' : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}>
                <input
                  type="radio"
                  name="resetCalendarMode"
                  value="reset_progress"
                  checked={resetMode === 'reset_progress'}
                  onChange={() => setResetMode('reset_progress')}
                  className="mt-1"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    🔄 Reiniciar Aulas no Calendário (Voltar para a Aula 1)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Desmarca as aulas concluídas para que o calendário reprograme todas as matérias desde a primeira aula, mantendo a grade e as disciplinas.
                  </span>
                </div>
              </label>
            </div>

            {resetMode !== 'overrides' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  {resetMode === 'clear_all'
                    ? 'Atenção: todos os blocos do calendário e do ciclo semanal ficarão vazios para você montar do zero.'
                    : 'Atenção: o progresso de aulas concluídas será zerado e sincronizado com a nuvem.'}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetCalendarModal(false)}
                disabled={isResettingCalendar}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetCalendar}
                disabled={isResettingCalendar}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  resetMode === 'clear_all'
                    ? 'bg-red-600 hover:bg-red-700'
                    : resetMode === 'reset_progress'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isResettingCalendar ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redefinindo...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" /> Confirmar Redefinição
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
