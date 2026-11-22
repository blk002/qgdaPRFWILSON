import { useStore } from '../store/useStore';
import { Target, AlertTriangle, Activity, Trophy, ChevronRight, ChevronLeft, Layers, PlayCircle, BrainCircuit, Shuffle, CheckCircle, FileText, Clock, Zap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useConfetti } from '../hooks/useConfetti';
import NotesDrawer from '../components/NotesDrawer';
import { parseDurationToSeconds, formatSecondsToClock, formatSecondsToFriendly, calculateLessonsForGoal, formatMinutesToFriendly } from '../lib/durationHelpers';
import { getSubjectTextColorClass, getSubjectAccentBorderClass } from '../lib/subjectColors';

export default function Ciclo() {
  const navigate = useNavigate();
  const {
    getPendingReviews,
    subjects,
    getThermometer,
    completedToday: rawCompletedToday,
    completedTodayDate,
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
    futureScheduleRules
  } = useStore();

  // Blocos concluídos só valem se foram marcados hoje (todayKey muda na virada do dia e re-renderiza a tela)
  const completedToday = completedTodayDate === getLocalDateStr() ? (rawCompletedToday || []) : [];

  const pendingReviews = getPendingReviews().slice(0, 4);

  const [weekOffset, setWeekOffset] = useState(0);
  const MAX_WEEK_OFFSET = 26;

  // Informações de data de um dia do ciclo, deslocado em N semanas para o futuro (modo semanal)
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

  // Resolve as matérias e quantidades de aulas por bloco efetivas de um dia do ciclo
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

    // Prioriza override explícito gravado para a própria data (ex.: hoje editado manualmente no Calendário)
    if (calendarOverrides && Array.isArray(calendarOverrides[dateInfo.fullDateStr])) {
      return sanitizeSchedule(
        calendarOverrides[dateInfo.fullDateStr],
        calendarOverrideCounts?.[dateInfo.fullDateStr]
      );
    }

    const shouldShiftCarryover = cycleScheduleType === 'weekly' && dateInfo.isToday && (cycleCarryoverOffset || 0) > 0;
    const effectiveCycleIdx = shouldShiftCarryover
      ? ((dayIndex - cycleCarryoverOffset) % 7 + 7) % 7
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
      .filter(r => {
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

  const getEffectiveDaySubjects = (dayIndex, week = 0) => getEffectiveDaySchedule(dayIndex, week).daySubjects;

  // Sincroniza o dia atual quando em modo semanal
  useEffect(() => {
    if (cycleScheduleType === 'weekly') {
      const today = new Date();
      const todayDOW = today.getDay();
      const currentWeekIndex = (cycleWeekStart === 'monday') ? (todayDOW + 6) % 7 : todayDOW;
      if (currentDayIndex !== currentWeekIndex) {
        setCurrentDayIndex(currentWeekIndex);
      }
    }
  }, [cycleScheduleType, cycleWeekStart, currentDayIndex, setCurrentDayIndex, todayKey]);

  const visibleDays = (() => {
    if (cycleScheduleType === 'weekly') {
      // Inclui as semanas intermediárias para que a simulação de aulas seja sequencial até a semana exibida
      const result = [];
      for (let week = 0; week <= weekOffset; week++) {
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const sched = getEffectiveDaySchedule(dayIndex, week);
          result.push({
            daySubjects: sched.daySubjects,
            daySlotCounts: sched.daySlotCounts,
            dayIndex,
            week,
            dateInfo: getDateInfo(dayIndex, week)
          });
        }
      }
      return result;
    }
    if (!cycle || cycle.length === 0) return [];
    const safeCurrentDayIndex = currentDayIndex % cycle.length;
    const result = [];
    for (let i = 0; i < cycle.length; i++) {
      const dayIndex = (safeCurrentDayIndex + i) % cycle.length;
      const sched = getEffectiveDaySchedule(dayIndex);
      result.push({ daySubjects: sched.daySubjects, daySlotCounts: sched.daySlotCounts, dayIndex, week: 0, dateInfo: getRelativeDateInfo(dayIndex) });
    }
    return result;
  })();

  const shownDays = visibleDays.filter(d => d.week === weekOffset);

  // Rótulo do intervalo da semana exibida
  const weekRangeLabel = shownDays.length > 0
    ? `${shownDays[0].dateInfo.dateStr} – ${shownDays[shownDays.length - 1].dateInfo.dateStr}`
    : '';

  const todayTotalSlots = getEffectiveDaySubjects(currentDayIndex).length;

  const scrollContainerRef = useRef(null);

  const scrollToDay = (index, smooth = true) => {
    const el = document.getElementById(`cycle-day-${index}`);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
    }
  };

  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Suporte a rolagem horizontal via roda do mouse sobre o contêiner
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Só converte rolagem vertical em horizontal quando houver overflow horizontal real
      if (container.scrollWidth <= container.clientWidth) return;
      // Ignora se estiver rolando um sub-menu vertical interno
      if (e.target.closest('.overflow-y-auto')) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Centraliza o dia atual ao montar a página
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToDay(currentDayIndex, true);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentDayIndex]);

  // Ao trocar de semana, rola para hoje (quando weekOffset === 0) ou para o primeiro dia exibido
  useEffect(() => {
    if (weekOffset === 0) {
      const timer = setTimeout(() => {
        scrollToDay(currentDayIndex, true);
      }, 80);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(timer);
  }, [weekOffset, currentDayIndex]);

  const { setTriggerConfetti, ConfettiCanvas } = useConfetti();
  const prevCompletedLength = useRef(completedToday.length);

  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [noteContent, setNoteContent] = useState('');

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

  // Garante scroll reset ao montar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Ao completar a meta do dia, dispara o confetti
  useEffect(() => {
    const totalSlots = todayTotalSlots;
    if (completedToday.length === totalSlots && totalSlots > 0 && prevCompletedLength.current < totalSlots) {
      setTimeout(() => {
        setTriggerConfetti(true);
      }, 0);
    }
    prevCompletedLength.current = completedToday.length;
  }, [completedToday.length, todayTotalSlots, setTriggerConfetti]);

  return (
    <div className="fade-in w-full pb-6">
      {pendingReviews.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-3.5 mb-3 shadow-xs relative overflow-hidden dark:bg-red-950/20 dark:border-red-900/50">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-200 rounded-bl-full opacity-40 pointer-events-none dark:bg-red-900/20"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10">
            <div>
              <h3 className="font-black text-red-800 flex items-center gap-2 text-sm sm:text-base dark:text-red-400">
                <AlertTriangle className="w-4 h-4"/> Prioridade Zero: Blindar Memória
              </h3>
              <p className="text-xs text-red-600 mt-0.5 font-semibold max-w-2xl dark:text-red-500/90">
                Limpe sua fila de revisões FSRS antes de absorver conteúdo novo.
              </p>
            </div>
            <div className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xs self-start sm:self-auto flex items-center gap-2 leading-none">
              <span className="text-[10px] opacity-85 uppercase">FSRS</span>
              <span className="text-base">{pendingReviews.length}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
            {pendingReviews.map(rev => {
              const sub = subjects[rev.subjectId];
              const isCaveira = Boolean(rev.isCaveiraQuestion || rev.questionData || String(rev.id || '').startsWith('rev_caveira_'));
              const subName = rev.customSubjectName || rev.questionData?.canonicalSubject || sub?.name || 'Revisão FSRS';
              const subColor = sub?.color || (isCaveira ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400');
              const thermo = getThermometer(rev.lastPerformance);
              
              return (
                <div key={rev.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors dark:bg-slate-900">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase truncate max-w-[65%] ${subColor}`}>
                        {subName}
                      </span>
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${thermo.color}`} title={thermo.label}>
                        {thermo.icon} {Math.round(rev.lastPerformance * 100 || 0)}%
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-tight mb-2 line-clamp-2 dark:text-slate-100" title={rev.topicName}>{rev.topicName}</p>
                  </div>
                  <button onClick={() => { navigate('/revisoes'); }} className="mt-2 w-full py-1.5 bg-red-100 hover:bg-red-500 text-red-700 hover:text-white border border-red-200 rounded text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white">
                    <Activity className="w-3 h-3"/> Executar Revisão
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedToday.length === todayTotalSlots && completedToday.length > 0 && (
        <div className="bg-emerald-500 p-5 md:p-6 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-5 text-white fade-in border border-emerald-600">
          <div className="text-center md:text-left flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full dark:bg-slate-900"><Trophy className="text-yellow-300 w-8 h-8" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black">Meta Diária Batida!</h2>
              <p className="text-emerald-100 text-sm font-medium">{cycleScheduleType === 'weekly' ? 'Missão cumprida com excelência. Amanhã o ciclo avança automaticamente para o próximo dia.' : 'Missão cumprida com excelência. Avance a fila tática quando estiver pronto para o próximo dia.'}</p>
            </div>
          </div>
          {cycleScheduleType !== 'weekly' && (
            <button 
              onClick={advanceDay} 
              className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-black shadow-sm hover:bg-emerald-50 transition-colors w-full md:w-auto uppercase tracking-wider text-sm flex items-center justify-center gap-2 dark:bg-slate-900"
            >
              Avançar Ciclo <ChevronRight className="w-4 h-4"/>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 flex-wrap">
          <Layers className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
          <span>Fila de Conteúdo Novo / Avanço</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
            {shownDays.length} {shownDays.length === 1 ? 'dia' : 'dias'}
          </span>
        </h3>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
          {cycleScheduleType === 'weekly' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                className="px-2 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" /> Semana
              </button>
              <span className="px-2 text-[11px] font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {weekOffset === 0 ? 'Esta semana' : weekOffset === 1 ? 'Próxima semana' : `+${weekOffset} semanas`}
                <span className="ml-1.5 text-[10px] font-bold text-slate-400">{weekRangeLabel}</span>
              </span>
              <button
                type="button"
                disabled={weekOffset >= MAX_WEEK_OFFSET}
                onClick={() => setWeekOffset(w => Math.min(MAX_WEEK_OFFSET, w + 1))}
                className="px-2 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                title="Próxima semana"
                aria-label="Próxima semana"
              >
                Semana <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <button 
            type="button"
            onClick={() => { setWeekOffset(0); setTimeout(() => scrollToDay(currentDayIndex, true), 60); }}
            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Rolar direto para o dia de hoje"
          >
            <Calendar className="w-3.5 h-3.5" /> Ir para Hoje
          </button>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
            <button 
              type="button"
              onClick={() => scrollByAmount(-350)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Rolar dias para a esquerda"
              aria-label="Rolar dias para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => scrollByAmount(350)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Rolar dias para a direita"
              aria-label="Rolar dias para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de atalhos rápidos para todos os dias do ciclo */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-x pb-2 mb-4">
        {shownDays.map(({ dayIndex, dateInfo }) => {
          const isToday = dateInfo.isToday;
          const isPast = dateInfo.isPast;
          return (
            <button
              key={dayIndex}
              type="button"
              onClick={() => scrollToDay(dayIndex, true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                isToday
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/30'
                  : isPast
                  ? 'bg-slate-100/70 text-slate-400 border-slate-200 dark:bg-slate-900/40 dark:text-slate-500 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-slate-700'
              }`}
            >
              <span>{dateInfo.shortName || `D${dayIndex + 1}`}</span>
              <span className={`text-[10px] ${isToday ? 'text-blue-100 font-black' : 'opacity-70'}`}>{dateInfo.dateStr}</span>
              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          );
        })}
      </div>

      <div 
        ref={scrollContainerRef}
        id="cycle-scroll-container" 
        className="overflow-x-auto pt-3 pb-3 custom-scrollbar-x"
      >
        <div className="flex gap-3 items-stretch w-full min-w-max">
          {(() => {
            const simulatedIncrements = {};
            const isSubDoneWithSim = (sub, simMap) => {
              const topics = sub?.topics || [];
              if (topics.length === 0 || !topics.some(t => (t.total || 0) > 0)) return false;
              const remTotal = topics.reduce((acc, t) => acc + Math.max(0, (t.total || 0) - (t.completed || 0)), 0);
              return (simMap?.[sub.id] || 0) >= remTotal;
            };
            return visibleDays.map(({ daySubjects: rawDaySubjects, daySlotCounts: rawSlotCounts, dayIndex, week, dateInfo }) => {
              let daySubjects = [...(rawDaySubjects || [])];
              let daySlotCounts = [...(rawSlotCounts || [])];

              const isToday = dateInfo.isToday;
              const isPast = dateInfo.isPast;
              
              // Calcular tempo total do dia
              let dayTotalSeconds = 0;
              let dayAcceleratedSeconds = 0;

              if (isPast) {
                const pastMinutes = studyHistory?.[dateInfo.fullDateStr] || 0;
                dayTotalSeconds = pastMinutes * 60;
                dayAcceleratedSeconds = dayTotalSeconds;
              } else {
                const tempSim = week !== weekOffset ? simulatedIncrements : { ...simulatedIncrements };
                for (let i = 0; i < daySubjects.length; i++) {
                  const originalSubId = daySubjects[i];
                  let subjectId = originalSubId;
                  let subject = subjects[subjectId];
                  if (!subject) continue;
                  const isSlotCompleted = isToday && completedToday.includes(i);
                  if (isSlotCompleted) continue;
                  // Transição inteligente se a matéria original já foi concluída (incluindo aulas simuladas)
                  const isOrigDone = isSubDoneWithSim(subject, tempSim);
                  let wasSlotTransitioned = false;
                  if (isOrigDone) {
                    const action = subject.onCompleteAction || "keep_fixed";
                    if (action === "replace" && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
                      const rep = subjects[subject.replacementSubjectId];
                      if (!isSubDoneWithSim(rep, tempSim)) {
                        subjectId = subject.replacementSubjectId;
                        subject = rep;
                        wasSlotTransitioned = true;
                      }
                    } else if (action === "double_remaining") {
                      const fallbackId = daySubjects.find(sId => sId !== originalSubId && subjects[sId] && !isSubDoneWithSim(subjects[sId], tempSim));
                      if (fallbackId && subjects[fallbackId]) {
                        subjectId = fallbackId;
                        subject = subjects[fallbackId];
                        wasSlotTransitioned = true;
                      }
                    }
                  }

                  let tempIncrement = tempSim[subjectId] || 0;
                  const customSlotLessons = !wasSlotTransitioned ? Math.floor(Number(daySlotCounts?.[i]) || 0) : 0;

                  const topics = subject.topics || [];
                  for (let t of topics) {
                    const remaining = t.total - t.completed;
                    if (tempIncrement < remaining) {
                      const currentCompleted = t.completed + tempIncrement;
                      const spd = Number(subject.speed) || 1;
                      const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(subject.lessonsPerBlock) || 0);
                      const goalMin = customSlotLessons > 0 ? 0 : (Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0);
                      
                      let count = 1;
                      if (goalMin > 0 || lessonsN > 0) {
                        const remainingInTopic = t.total - currentCompleted;
                        const suggestion = calculateLessonsForGoal(t.lessons || [], currentCompleted, spd, goalMin, t.total, lessonsN);
                        count = Math.min(remainingInTopic, Math.max(1, suggestion.count));
                        dayTotalSeconds += suggestion.totalOrigSec;
                        dayAcceleratedSeconds += suggestion.totalAccelSec;
                      } else {
                        const lessonEntry = t.lessons?.[currentCompleted];
                        const durStr = lessonEntry?.duration || '';
                        const sec = parseDurationToSeconds(durStr) || 3600;
                        dayTotalSeconds += sec;
                        dayAcceleratedSeconds += Math.round(sec / spd);
                      }
                      
                      tempSim[subjectId] = (tempSim[subjectId] || 0) + count;
                      break;
                    } else {
                      tempIncrement -= remaining;
                    }
                  }
                }
              }

              const hasAcceleration = dayAcceleratedSeconds > 0 && dayAcceleratedSeconds < dayTotalSeconds;

              // Semanas intermediárias só alimentam a simulação sequencial de aulas (não são exibidas)
              if (week !== weekOffset) return null;

              return (
                <div id={`cycle-day-${dayIndex}`} key={dayIndex} className={`flex-none w-[86vw] sm:w-[340px] lg:w-[360px] xl:w-[390px] flex flex-col rounded-xl border transition-all mt-2 ${
                    isToday ? 'border-sky-500/80 bg-slate-50 shadow-md ring-2 ring-sky-500/15 relative dark:bg-slate-900 dark:border-sky-500/80 dark:ring-sky-500/10' : 'border-slate-200/80 bg-white opacity-95 hover:opacity-100 dark:border-slate-800 dark:bg-slate-900/80'
                }`}>
                  {isToday && (
                     <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-sky-600 dark:bg-sky-500 dark:text-slate-950 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs z-10 border border-white dark:border-slate-900 whitespace-nowrap">
                       Ordem do Dia
                     </div>
                  )}

                  <div className={`p-2.5 text-center border-b flex flex-col gap-0.5 rounded-t-xl ${isToday ? 'border-sky-200 bg-sky-50/70 pt-3.5 dark:border-sky-500/25 dark:bg-sky-950/25' : 'border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-400'}`}>
                      {dateInfo.title} • {dateInfo.dateStr}
                    </span>
                    <span className={`font-black text-base tracking-tight truncate ${isToday ? 'text-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`} title={cycleScheduleType === 'weekly' ? (dateInfo.weekDayName || `DIA ${dayIndex + 1}`) : `DIA ${dayIndex + 1}`}>
                      {cycleScheduleType === 'weekly' ? (dateInfo.weekDayName || `DIA ${dayIndex + 1}`) : `DIA ${dayIndex + 1}`}
                    </span>
                    {isToday && cycleScheduleType === 'weekly' && cycleCarryoverOffset > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                        <span
                          title={`Grade deslocada ${cycleCarryoverOffset} dia(s) para repor dia não estudado`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        >
                          ↩ Reposição (+{cycleCarryoverOffset}d)
                        </span>
                        <button
                          type="button"
                          onClick={resetCycleCarryover}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 hover:bg-white text-slate-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                        >
                          Voltar à grade normal
                        </button>
                      </div>
                    )}
                    {isPast ? (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        {dayTotalSeconds > 0 ? (
                          <span className="inline-flex items-center justify-center flex-wrap gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" /> Realizado ({formatSecondsToFriendly(dayTotalSeconds)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center flex-wrap gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                            Não Realizado
                          </span>
                        )}
                      </div>
                    ) : dayTotalSeconds > 0 && (
                      <div className="flex flex-col items-center gap-0.5 mt-1">
                        {hasAcceleration ? (
                          <>
                            <span 
                              className={`inline-flex items-center justify-center flex-wrap gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-xs ${
                                isToday 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-blue-300 border border-slate-300 dark:border-slate-700'
                              }`}
                              title={`Sem aceleração: ${formatSecondsToFriendly(dayTotalSeconds)} | Poupado: ${formatSecondsToFriendly(dayTotalSeconds - dayAcceleratedSeconds)}`}
                            >
                              <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                              <span>{formatSecondsToFriendly(dayAcceleratedSeconds)}</span>
                              <span className="opacity-75 text-[9px] font-bold uppercase tracking-wider">acelerado</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 line-through">
                              {formatSecondsToFriendly(dayTotalSeconds)} (1x)
                            </span>
                          </>
                        ) : (
                          <span className={`inline-flex items-center justify-center flex-wrap gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black ${isToday ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                            <Clock className="w-3 h-3 text-yellow-500 shrink-0" /> {formatSecondsToFriendly(dayTotalSeconds)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-2 flex flex-col gap-2 flex-1 min-w-0">
                    {daySubjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center text-center p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex-1 min-h-[88px] gap-1.5">
                        <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Dia Livre / Descanso
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
                          Nenhum bloco agendado. Clique no dia pelo Calendário para programar.
                        </p>
                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => navigate('/calendario')}
                            className="mt-0.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-500 dark:hover:text-slate-950 border border-sky-200 dark:border-sky-800/60 transition-colors cursor-pointer"
                          >
                            Agendar no Calendário
                          </button>
                        )}
                      </div>
                    )}
                    {daySubjects.map((originalSubId, slotIndex) => {
                      let subjectId = originalSubId;
                      let subject = subjects[subjectId];
                      if (!subject) return null;
                      const isOriginalDone = isSubDoneWithSim(subject, simulatedIncrements);
                      let isDoubled = false;
                      let isReplaced = false;
                      if (isOriginalDone) {
                        const action = subject.onCompleteAction || "keep_fixed";
                        if (action === "replace" && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
                          const rep = subjects[subject.replacementSubjectId];
                          if (!isSubDoneWithSim(rep, simulatedIncrements)) {
                            subjectId = subject.replacementSubjectId;
                            subject = rep;
                            isReplaced = true;
                          }
                        } else if (action === "double_remaining") {
                          const fallbackId = daySubjects.find(sId => sId !== originalSubId && subjects[sId] && !isSubDoneWithSim(subjects[sId], simulatedIncrements));
                          if (fallbackId && subjects[fallbackId]) {
                            subjectId = fallbackId;
                            subject = subjects[fallbackId];
                            isDoubled = true;
                          }
                        }
                      }

                      const textColorClass = getSubjectTextColorClass(subject.color);
                      const borderColorClass = getSubjectAccentBorderClass(subject.color);

                      if (isPast) {
                        const pastMinutes = studyHistory?.[dateInfo.fullDateStr] || 0;
                        const wasStudied = pastMinutes > 0;
                        const pastActiveTopic = getActiveTopic ? getActiveTopic(subjectId) : null;
                        return (
                          <div key={slotIndex} className={`p-3 rounded-xl border bg-white dark:bg-slate-900 ${borderColorClass} opacity-85 space-y-2 min-w-0`}>
                            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                              <span className={`text-xs sm:text-sm font-black uppercase tracking-wide truncate min-w-0 flex-1 ${textColorClass}`} title={subject.name}>
                                {subject.name}
                              </span>
                              {(isDoubled || isReplaced) && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-300 shrink-0 uppercase">
                                  {isReplaced ? 'Subst.' : '2x'}
                                </span>
                              )}
                            </div>
                            <div className="py-1 flex flex-col items-center justify-center text-center gap-1 min-h-[72px]">
                              {wasStudied ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                    Dia estudado
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Total do dia: {formatMinutesToFriendly(pastMinutes)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Não Estudado
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                                    Fila retomada em <strong className="text-sky-500 font-bold">Hoje</strong>.
                                  </span>
                                </>
                              )}
                              {pastActiveTopic && pastActiveTopic.completed < pastActiveTopic.total && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const remLessons = (pastActiveTopic.lessons || []).slice(pastActiveTopic.completed, pastActiveTopic.total);
                                    const spdPast = Number(subject.speed) || 1;
                                    const customPastCount = (!isDoubled && !isReplaced) ? Math.floor(Number(daySlotCounts?.[slotIndex]) || 0) : 0;
                                    const pastLessonsN = customPastCount > 0 ? customPastCount : Math.floor(Number(subject.lessonsPerBlock) || 0);
                                    const pastGoalMin = customPastCount > 0 ? 0 : (Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0);
                                    const pastSug = (pastGoalMin > 0 || pastLessonsN > 0)
                                      ? calculateLessonsForGoal(pastActiveTopic.lessons || [], pastActiveTopic.completed, spdPast, pastGoalMin, pastActiveTopic.total, pastLessonsN).count
                                      : 1;
                                    const pastPlannedCount = Math.max(1, pastSug || 1);
                                    const pastLessonNames = remLessons.slice(0, pastPlannedCount).map(l => l?.name).filter(Boolean);
                                    setClassConfirmModal({
                                      subjectId,
                                      slotIndex,
                                      topicName: pastActiveTopic.name,
                                      lessonNames: pastLessonNames,
                                      allRemainingLessonNames: remLessons.map(l => l?.name).filter(Boolean),
                                      maxClasses: pastActiveTopic.total - pastActiveTopic.completed,
                                      lessonDuration: remLessons[0]?.duration || '',
                                      allLessonsDurations: remLessons.map(l => l.duration || '60:00'),
                                      suggestedClasses: pastPlannedCount,
                                      timeGoalMinutes: pastGoalMin || null,
                                      initialStudyDate: dateInfo.fullDateStr
                                    });
                                  }}
                                  className="mt-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-sky-600 text-slate-600 hover:text-white dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-sky-500 dark:hover:text-slate-950 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                >
                                  Registrar em {dateInfo.dateStr}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      const isSlotCompleted = isToday && completedToday.includes(slotIndex);
                      
                      // Simular progresso sequencial do ciclo
                      let activeTopic = null;
                      let activeLessonName = '';
                      let activeLessonDuration = '';
                      let currentCompleted = 0;
                      let currentTotal = 0;
                      let blockCount = 1;
                      let plannedLessons = [];
                      let goalMin = 0;
                      let spd = 1;

                      if (!isSlotCompleted) {
                        const increment = simulatedIncrements[subjectId] || 0;
                        let tempIncrement = increment;
                        let found = false;

                        const topics = subject.topics || [];
                        for (let t of topics) {
                          const remaining = t.total - t.completed;
                          if (tempIncrement < remaining) {
                            activeTopic = t;
                            currentCompleted = t.completed + tempIncrement;
                            currentTotal = t.total;
                            spd = Number(subject.speed) || 1;
                            const customSlotLessons = (!isDoubled && !isReplaced) ? Math.floor(Number(daySlotCounts?.[slotIndex]) || 0) : 0;
                            const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(subject.lessonsPerBlock) || 0);
                            goalMin = customSlotLessons > 0 ? 0 : (Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0);

                            if (goalMin > 0 || lessonsN > 0) {
                              const remainingInTopic = t.total - currentCompleted;
                              const suggestion = calculateLessonsForGoal(t.lessons || [], currentCompleted, spd, goalMin, t.total, lessonsN);
                              blockCount = Math.min(remainingInTopic, Math.max(1, suggestion.count));
                              plannedLessons = suggestion.lessonsList;
                              const firstLesson = plannedLessons[0];
                              activeLessonName = firstLesson?.name || (t.lessons?.[currentCompleted]?.name) || `${t.name} - Aula ${currentCompleted + 1}`;
                              activeLessonDuration = firstLesson?.durStr || (t.lessons?.[currentCompleted]?.duration) || '';
                            } else {
                              blockCount = 1;
                              const lessonEntry = t.lessons?.[currentCompleted];
                              activeLessonName = lessonEntry?.name || `${t.name} - Aula ${currentCompleted + 1}`;
                              activeLessonDuration = lessonEntry?.duration || '';
                              const origSec = parseDurationToSeconds(activeLessonDuration) || 3600;
                              const accelSec = Math.round(origSec / spd);
                              plannedLessons = [{
                                index: currentCompleted,
                                name: activeLessonName,
                                origSec,
                                accelSec,
                                durStr: activeLessonDuration
                              }];
                            }

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

                      const startNum = currentCompleted + 1;
                      const endNum = currentCompleted + blockCount;

                      const openSlotModal = (skipPrePrompt) => {
                        if (!activeTopic || !setClassConfirmModal) return;
                        const remainingLessons = (activeTopic.lessons || []).slice(currentCompleted, activeTopic.total);
                        const blockLessonNames = plannedLessons.map(pl => pl?.name).filter(Boolean);
                        setClassConfirmModal({
                          subjectId,
                          slotIndex,
                          topicName: activeTopic.name,
                          lessonNames: blockLessonNames.length > 0 ? blockLessonNames : (activeLessonName ? [activeLessonName] : []),
                          allRemainingLessonNames: remainingLessons.map(l => l?.name).filter(Boolean),
                          maxClasses: Math.max(1, (Number(activeTopic.total) || 0) - (Number(activeTopic.completed) || 0)),
                          lessonDuration: activeLessonDuration,
                          allLessonsDurations: remainingLessons.map(l => l?.duration || '60:00'),
                          suggestedClasses: blockCount,
                          timeGoalMinutes: goalMin || null,
                          skipPrePrompt
                        });
                      };

                      return (
                        <div
                          key={slotIndex}
                          className={`p-3 rounded-xl border bg-white dark:bg-slate-900 ${
                            isSlotCompleted ? 'border-emerald-300 dark:border-emerald-800/70 opacity-85' : borderColorClass
                          } space-y-2.5 transition-all min-w-0`}
                        >
                          {/* Cabeçalho: DISCIPLINA -> TÓPICO */}
                          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                            <div
                              className={`text-xs sm:text-sm font-black uppercase tracking-wide truncate min-w-0 flex-1 ${textColorClass}`}
                              title={activeTopic?.name ? `${subject.name} → ${activeTopic.name}` : subject.name}
                            >
                              {subject.name}
                              {activeTopic?.name ? ` → ${activeTopic.name}` : ''}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(isReplaced || isDoubled) && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-300 uppercase">
                                  {isReplaced ? 'Subst.' : '2x'}
                                </span>
                              )}
                              {!isSlotCompleted && activeTopic && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenNotes(subjectId, activeTopic)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded text-slate-400 hover:text-sky-500 transition-colors cursor-pointer"
                                  title="Anotações do Tópico"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isSlotCompleted ? (
                            <div className="py-2 fade-in flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-black uppercase tracking-wider">
                                Aula Assistida • Bloco Concluído Hoje
                              </span>
                            </div>
                          ) : activeTopic ? (
                            <>
                              {/* Linha AULA X/Y */}
                              <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                <span className="uppercase tracking-wider">
                                  {blockCount > 1
                                    ? `Aulas ${startNum}–${endNum}/${currentTotal}`
                                    : `Aula ${startNum}/${currentTotal}`}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {(() => {
                                    const firstIdx = plannedLessons?.[0]?.index ?? currentCompleted;
                                    const firstLessonName = plannedLessons?.[0]?.name || activeTopic?.lessons?.[firstIdx]?.name || '';
                                    const rawHref = activeTopic?.lessons?.[firstIdx]?.caveiraUrl
                                      || subject?.caveiraModuleUrl
                                      || (subject?.caveiraCourseId ? `https://app.caveira.com/courses/${subject.caveiraCourseId}` : '');
                                    const lesHref = rawHref
                                      ? `${String(rawHref).split('#')[0]}${firstLessonName ? `#qg_lesson=${encodeURIComponent(firstLessonName)}${subject?.name ? `&qg_subject=${encodeURIComponent(subject.name)}` : ''}` : ''}`
                                      : '';
                                    return lesHref ? (
                                      <a
                                        href={lesHref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider transition-colors"
                                        title="Abrir videoaula no Caveira"
                                      >
                                        <PlayCircle className="w-3 h-3" />
                                        <span>Vídeo</span>
                                      </a>
                                    ) : null;
                                  })()}
                                  {spd > 1 && (
                                    <span className="text-[11px] font-black text-sky-600 dark:text-sky-400">
                                      {spd}x ativo
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Lista de Aulas com Nome + MM:SS (spd) */}
                              <div className="space-y-1.5">
                                {plannedLessons.map((les, lIdx) => {
                                  const origSec = Number(les.origSec) || parseDurationToSeconds(les.durStr) || 0;
                                  const accelSec = Number(les.accelSec) || (origSec > 0 ? Math.round(origSec / spd) : 0);
                                  const durationLabel =
                                    accelSec > 0
                                      ? `${formatSecondsToClock(accelSec)}${spd > 1 ? ` (${spd}x)` : ''}`
                                      : les.durStr || '';

                                  const rawLesHref = activeTopic?.lessons?.[les.index ?? lIdx]?.caveiraUrl
                                    || subject?.caveiraModuleUrl
                                    || (subject?.caveiraCourseId ? `https://app.caveira.com/courses/${subject.caveiraCourseId}` : '');
                                  const directLesHref = rawLesHref
                                    ? `${String(rawLesHref).split('#')[0]}#qg_lesson=${encodeURIComponent(les.name || '')}${subject?.name ? `&qg_subject=${encodeURIComponent(subject.name)}` : ''}`
                                    : '';

                                  return (
                                    <div
                                      key={lIdx}
                                      className="flex items-start justify-between gap-2.5 text-sm leading-snug"
                                    >
                                      <span className="font-semibold text-slate-800 dark:text-slate-100 break-words flex-1 min-w-0">
                                        • {les.name}
                                        {directLesHref && (
                                          <a
                                            href={directLesHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-1.5 inline-flex items-center text-[10px] font-black text-sky-500 hover:text-sky-400 underline underline-offset-2"
                                            title="Abrir esta aula no Caveira"
                                          >
                                            ▶️
                                          </a>
                                        )}
                                      </span>
                                      {durationLabel && (
                                        <span className="text-xs sm:text-sm font-mono font-black text-amber-600 dark:text-amber-300 shrink-0 flex items-center gap-1 tabular-nums">
                                          <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                                          {durationLabel}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* 2 Botões: AULA ASSISTIDA + EXERCÍCIOS DA AULA */}
                              {isToday && (
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => openSlotModal(true)}
                                    className="h-9 px-2 rounded-lg text-[11px] font-black uppercase tracking-tight bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Aula Assistida</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openSlotModal(false)}
                                    className="h-9 px-2 rounded-lg text-[11px] font-black uppercase tracking-tight bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <Target className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                                    <span>Exercícios da Aula</span>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-2 flex flex-col items-center">
                              <div className="bg-emerald-100 dark:bg-emerald-950/50 p-1.5 rounded-full mb-1.5"><BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">100% da Teoria Concluída</span>
                              
                              <button onClick={() => setReplaceSubjectModal({ dayIndex, slotIndex, oldSubjectId: originalSubId })} className="w-full py-1.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white dark:bg-slate-850 dark:text-sky-400 dark:hover:bg-sky-500 dark:hover:text-slate-950 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 border border-sky-200 dark:border-slate-700 cursor-pointer">
                                <Shuffle className="w-3 h-3" /> <span className="truncate">Reestruturar Vaga</span>
                              </button>
                              
                              {isToday && <button onClick={() => setCompletedToday(prev => [...prev, slotIndex])} className="mt-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2 dark:text-slate-300 cursor-pointer">Pular hoje</button>}
                            </div>
                          )}
                        </div>
                      );
                  })}
                </div>
              </div>
            );
          })
        })()}
      </div>
      </div>
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
