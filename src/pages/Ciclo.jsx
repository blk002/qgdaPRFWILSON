import { useStore } from '../store/useStore';
import { Target, AlertTriangle, Activity, Trophy, ChevronRight, ChevronLeft, Flame, Layers, PlayCircle, BrainCircuit, Shuffle, CheckCircle, FileText, Save, Clock, Zap, FastForward, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useConfetti } from '../hooks/useConfetti';
import NotesDrawer from '../components/NotesDrawer';
import { parseDurationToSeconds, formatSecondsToClock, formatSecondsToFriendly, calculateLessonsForGoal, formatMinutesToFriendly } from '../lib/durationHelpers';

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
    getSubjectProgress,
    getRelativeDateInfo,
    getCycleIndexForDate,
    getLocalDateStr,
    reviews,
    setClassConfirmModal,
    setReplaceSubjectModal,
    saveTopicNotes,
    subjectTimeGoal,
    cycleScheduleType,
    cycleWeekStart,
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
    const dateInfo = getDateInfo(dayIndex, week);
    let daySubjects = Array.isArray(cycle?.[dayIndex]) ? [...cycle[dayIndex]] : [];
    let daySlotCounts = Array.isArray(cycleSlotCounts?.[dayIndex]) ? [...cycleSlotCounts[dayIndex]] : [];

    if (calendarOverrides && Array.isArray(calendarOverrides[dateInfo.fullDateStr])) {
      return {
        daySubjects: [...calendarOverrides[dateInfo.fullDateStr]],
        daySlotCounts: Array.isArray(calendarOverrideCounts?.[dateInfo.fullDateStr]) ? [...calendarOverrideCounts[dateInfo.fullDateStr]] : []
      };
    }

    const parts = String(dateInfo.fullDateStr).split('-').map(Number);
    const dayDateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    const dayOfWeek = dayDateObj.getDay();
    const matchingRules = (futureScheduleRules || [])
      .filter(r => {
        if (!r || r.v !== 2 || !r.fromDate || r.fromDate > dateInfo.fullDateStr) return false;
        if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
          return r.dayOfWeek === dayOfWeek;
        }
        return r.dayOfWeek === dayOfWeek || r.cycleIndex === dayIndex;
      })
      .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

    if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
      daySubjects = [...matchingRules[0].daySlots];
      daySlotCounts = Array.isArray(matchingRules[0].slotCounts) ? [...matchingRules[0].slotCounts] : [];
    }

    return { daySubjects, daySlotCounts };
  };

  const getEffectiveDaySubjects = (dayIndex, week = 0) => getEffectiveDaySchedule(dayIndex, week).daySubjects;

  // Sincroniza o dia atual quando em modo semanal
  useEffect(() => {
    if (cycleScheduleType === 'weekly') {
      const today = new Date();
      const currentWeekIndex = getCycleIndexForDate
        ? getCycleIndexForDate(today, today)
        : ((cycleWeekStart === 'monday') ? (today.getDay() + 6) % 7 : today.getDay());
      if (currentDayIndex !== currentWeekIndex) {
        setCurrentDayIndex(currentWeekIndex);
      }
    }
  }, [cycleScheduleType, cycleWeekStart, currentDayIndex, setCurrentDayIndex, getCycleIndexForDate, todayKey]);

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
    <div className="fade-in w-full pb-10">
      
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-blue-600 w-7 h-7" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight dark:text-slate-100">Conversor de Edital (Teoria ➔ Questões)</h2>
        </div>

        {pendingReviews.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-5 mb-6 shadow-sm relative overflow-hidden dark:bg-red-950/20 dark:border-red-900/50">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-200 rounded-bl-full opacity-50 pointer-events-none dark:bg-red-900/20"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
              <div>
                <h3 className="font-black text-red-800 flex items-center gap-2 text-lg dark:text-red-400">
                  <AlertTriangle className="w-5 h-5"/> Prioridade Zero: Blindar Memória
                </h3>
                <p className="text-xs text-red-600 mt-1 font-bold max-w-2xl dark:text-red-500/90">
                  A regra de ouro do alto rendimento: limpe a sua fila de revisões FSRS antes de absorver qualquer conteúdo novo. A sua aprovação não está no que estuda hoje, está no que não esquece amanhã.
                </p>
              </div>
              <div className="bg-red-600 text-white text-xs font-black px-4 py-2 rounded-lg whitespace-nowrap shadow-sm self-start sm:self-auto flex flex-col items-center leading-none">
                <span className="text-[10px] opacity-80 mb-0.5">CARTÕES FSRS</span>
                <span className="text-xl">{pendingReviews.length}</span>
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
      </div>

      {completedToday.length === todayTotalSlots && completedToday.length > 0 && (
        <div className="bg-emerald-500 p-5 md:p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-5 text-white fade-in border border-emerald-600">
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

      <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800 mb-8 overflow-hidden">
        <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Progresso de Conversão (Teoria ➔ FSRS)
          </h3>
          <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Queimar Teoria: {completedToday.length} / {todayTotalSlots} Slots
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 pt-2 snap-x">
          {Object.values(subjects).map(sub => {
            const progress = getSubjectProgress(sub.id);
            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;
            const isDone = progress === 100;

            return (
              <div key={sub.id} className={`min-w-[110px] sm:min-w-[120px] shrink-0 snap-start rounded-xl p-3 flex flex-col items-center justify-center gap-3 relative overflow-hidden transition-all shadow-sm border ${isDone ? 'bg-emerald-900/20 border-emerald-800/50 hover:border-emerald-600' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                
                {isDone && <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none"></div>}

                <div className="relative flex items-center justify-center group z-10">
                  <svg className="transform -rotate-90 w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md overflow-visible" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id={`grad-cycle-${sub.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isDone ? '#10b981' : '#c084fc'} />
                        <stop offset="100%" stopColor={isDone ? '#059669' : '#3b82f6'} />
                      </linearGradient>
                      <filter id={`glow-cycle-${sub.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                    <circle 
                      cx="50" cy="50" r={radius} 
                      stroke={`url(#grad-cycle-${sub.id})`} 
                      strokeWidth="8" fill="transparent" 
                      strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out origin-center" 
                      filter={`url(#glow-cycle-${sub.id})`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-[11px] sm:text-xs font-black ${isDone ? 'text-emerald-400' : 'text-white'}`}>{progress}%</span>
                  </div>
                </div>

                <div className="w-full text-center z-10">
                  <span className="text-[9px] font-bold text-slate-300 uppercase truncate block px-1" title={sub.name}>{sub.name}</span>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" /> Fila de Conteúdo Novo / Avanço
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold ml-1">
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
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-x pb-2 mb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
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
              {isToday && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
            </button>
          );
        })}
      </div>

      <div 
        ref={scrollContainerRef}
        id="cycle-scroll-container" 
        className="overflow-x-auto pt-2 pb-5 custom-scrollbar-x -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        <div className="flex gap-2.5 sm:gap-4 items-stretch w-full min-w-max">
          {(() => {
            const simulatedIncrements = {};
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
                  // Transição inteligente se a matéria original já foi concluída
                  const isOrigDone = (subject.topics || []).length > 0 &&
                    (subject.topics || []).some(t => (t.total || 0) > 0) &&
                    (subject.topics || []).every(t => (t.completed || 0) >= (t.total || 0));
                  let wasSlotTransitioned = false;
                  if (isOrigDone) {
                    const action = subject.onCompleteAction || "keep_fixed";
                    if (action === "replace" && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
                      const rep = subjects[subject.replacementSubjectId];
                      if ((rep.topics || []).some(t => (t.completed || 0) < (t.total || 0))) {
                        subjectId = subject.replacementSubjectId;
                        subject = rep;
                        wasSlotTransitioned = true;
                      }
                    } else if (action === "double_remaining") {
                      const fallbackId = daySubjects.find(sId => sId !== originalSubId && (subjects[sId]?.topics || []).some(t => (t.completed || 0) < (t.total || 0)));
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
                <div id={`cycle-day-${dayIndex}`} key={dayIndex} className={`flex-1 min-w-[290px] sm:min-w-[310px] md:min-w-[325px] max-w-[380px] flex flex-col rounded-2xl border-2 transition-all mt-2 ${
                    isToday ? 'border-blue-500 bg-slate-50 shadow-xl ring-4 ring-blue-50 relative dark:bg-slate-900 dark:border-blue-500 dark:ring-blue-900/30' : 'border-slate-200 bg-white opacity-80 hover:opacity-100 scale-[0.99] hover:scale-100 dark:border-slate-800 dark:bg-slate-950'
                }`}>
                  {isToday && (
                     <div className="absolute -top-3.5 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-1.5 rounded-full shadow-md z-10 border-2 border-white dark:border-slate-900 whitespace-nowrap">
                       Ordem do Dia
                     </div>
                  )}

                  <div className={`p-3 sm:p-4 text-center border-b-2 flex flex-col gap-1 rounded-t-xl ${isToday ? 'border-blue-200 bg-blue-100/40 pt-5 sm:pt-6 dark:border-blue-900/50 dark:bg-blue-950/30' : 'border-slate-100 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-900/40'}`}>
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400'}`}>
                      {dateInfo.title} • {dateInfo.dateStr}
                    </span>
                    <span className={`font-black text-xl sm:text-2xl md:text-3xl tracking-tight ${isToday ? 'text-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {cycleScheduleType === 'weekly' ? (dateInfo.weekDayName || `DIA ${dayIndex + 1}`) : `DIA ${dayIndex + 1}`}
                    </span>
                    {isPast ? (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        {dayTotalSeconds > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Realizado ({formatSecondsToFriendly(dayTotalSeconds)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                            Não Realizado
                          </span>
                        )}
                      </div>
                    ) : dayTotalSeconds > 0 && (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        {hasAcceleration ? (
                          <>
                            <span 
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shadow-xs ${
                                isToday 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-blue-300 border border-slate-300 dark:border-slate-700'
                              }`}
                              title={`Sem aceleração: ${formatSecondsToFriendly(dayTotalSeconds)} | Poupado: ${formatSecondsToFriendly(dayTotalSeconds - dayAcceleratedSeconds)}`}
                            >
                              <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              <span>{formatSecondsToFriendly(dayAcceleratedSeconds)}</span>
                              <span className="opacity-75 text-[9px] font-bold uppercase tracking-wider">acelerado</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 line-through">
                              {formatSecondsToFriendly(dayTotalSeconds)} (1x)
                            </span>
                          </>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black ${isToday ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                            <Clock className="w-3 h-3 text-yellow-500" /> {formatSecondsToFriendly(dayTotalSeconds)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 flex-1">
                    {daySubjects.length === 0 && (
                      <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex-1 min-h-[160px] gap-2">
                        <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Dia Livre / Descanso
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[210px] leading-relaxed">
                          Nenhum bloco agendado neste dia. Para programar matérias aqui, clique no dia pelo Calendário.
                        </p>
                        {!isPast && (
                          <button
                            type="button"
                            onClick={() => navigate('/calendario')}
                            className="mt-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
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
                      const isOriginalDone = (subject.topics || []).length > 0 &&
                        (subject.topics || []).some(t => (t.total || 0) > 0) &&
                        (subject.topics || []).every(t => (t.completed || 0) >= (t.total || 0));
                      let isDoubled = false;
                      let isReplaced = false;
                      if (isOriginalDone) {
                        const action = subject.onCompleteAction || "keep_fixed";
                        if (action === "replace" && subject.replacementSubjectId && subjects[subject.replacementSubjectId]) {
                          const rep = subjects[subject.replacementSubjectId];
                          if ((rep.topics || []).some(t => (t.completed || 0) < (t.total || 0))) {
                            subjectId = subject.replacementSubjectId;
                            subject = rep;
                            isReplaced = true;
                          }
                        } else if (action === "double_remaining") {
                          const fallbackId = daySubjects.find(sId => sId !== originalSubId && (subjects[sId]?.topics || []).some(t => (t.completed || 0) < (t.total || 0)));
                          if (fallbackId && subjects[fallbackId]) {
                            subjectId = fallbackId;
                            subject = subjects[fallbackId];
                            isDoubled = true;
                          }
                        }
                      }

                      if (isPast) {
                        const pastMinutes = studyHistory?.[dateInfo.fullDateStr] || 0;
                        const wasStudied = pastMinutes > 0;
                        return (
                          <div key={slotIndex} className="bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xs opacity-75">
                            <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 flex justify-between items-center border-b border-black/5 ${subject.color}`}>
                              <span className="font-black text-[10px] sm:text-xs uppercase tracking-wider truncate max-w-[70%]" title={subject.name}>
                                {subject.name}
                                {isDoubled && <span className="ml-1 text-[8px] font-bold opacity-80">(2º BLOCO)</span>}
                                {isReplaced && <span className="ml-1 text-[8px] font-bold opacity-80">(SUBST.)</span>}
                              </span>
                              <span className="text-[9px] font-black bg-white/30 dark:bg-slate-900/50 dark:text-white px-1.5 py-0.5 rounded backdrop-blur-sm shrink-0">
                                {isDoubled ? '⚡ DOBRADA' : isReplaced ? '🔄 SUBST.' : (subject.block || 'B?')}
                              </span>
                            </div>
                            <div className="p-4 flex flex-col items-center justify-center text-center gap-1.5 flex-1 min-h-[140px]">
                              {wasStudied ? (
                                <>
                                  <CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
                                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                    Dia estudado
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {formatMinutesToFriendly(pastMinutes)} registrados neste dia
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-1" />
                                  <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Não Estudado
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight max-w-[200px]">
                                    A fila não avançou e começou em <strong className="text-blue-500 font-bold">Hoje</strong>.
                                  </span>
                                </>
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
                      let blockAccelSec = 0;
                      let blockOrigSec = 0;
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
                              blockAccelSec = suggestion.totalAccelSec;
                              blockOrigSec = suggestion.totalOrigSec;
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
                              blockOrigSec = origSec;
                              blockAccelSec = Math.round(origSec / spd);
                              plannedLessons = [{
                                index: currentCompleted,
                                name: activeLessonName,
                                origSec,
                                accelSec: blockAccelSec,
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

                      return (
                        <div key={slotIndex} className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden flex flex-col shadow-sm transition-all ${isSlotCompleted ? 'border-emerald-200 dark:border-emerald-800 opacity-80' : isToday ? 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
                          
                          <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 flex justify-between items-center border-b border-black/5 ${subject.color}`}>
                            <span className="font-black text-[10px] sm:text-xs uppercase tracking-wider truncate max-w-[70%]" title={subject.name}>{subject.name}</span>
                            <span className="text-[9px] font-black bg-white/30 dark:bg-slate-900/50 dark:text-white px-1.5 py-0.5 rounded backdrop-blur-sm shrink-0">{subject.block || 'B?'}</span>
                          </div>

                          <div className="p-2.5 sm:p-3.5 flex flex-col gap-2.5 flex-1 justify-center">
                            {isSlotCompleted ? (
                              <div className="text-center py-4 fade-in flex flex-col items-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Teoria Queimada!</span>
                              </div>
                            ) : activeTopic ? (
                              <>
                                {/* Header do Tópico com Botão de Notas */}
                                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0"/> 
                                    <span className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={activeTopic.name}>
                                      {activeTopic.name}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => handleOpenNotes(subjectId, activeTopic)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded text-slate-400 hover:text-blue-500 transition-colors shrink-0"
                                    title="Anotações do Tópico"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {blockCount > 1 ? (
                                  <div className="flex flex-col gap-2">
                                    {/* Barra de Meta e Contagem de Aulas */}
                                    <div className="flex items-center justify-between gap-1.5 bg-slate-100/90 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
                                          📚 {blockCount} Aulas
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-800 whitespace-nowrap">
                                          {currentCompleted + 1} a {currentCompleted + blockCount}
                                        </span>
                                      </div>
                                      {goalMin > 0 && (
                                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0 whitespace-nowrap" title={`Meta do bloco: ${goalMin} min`}>
                                          <Target className="w-2.5 h-2.5 text-emerald-500" /> {formatMinutesToFriendly(goalMin)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Lista das Aulas no Bloco */}
                                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                                      {plannedLessons.map((pl, plIdx) => (
                                        <div key={plIdx} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/80 px-2 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                          <span className="truncate flex-1 font-medium text-slate-700 dark:text-slate-200 text-left" title={pl.name}>
                                            {pl.name}
                                          </span>
                                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0 text-[10px] bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            ⚡{formatSecondsToClock(pl.accelSec)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Barra de Tempo Total do Bloco */}
                                    <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-lg px-2.5 py-1.5 text-xs">
                                      <div className="flex items-center gap-1.5 font-black text-blue-700 dark:text-blue-300">
                                        <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                                        <span>Bloco: {formatSecondsToFriendly(blockAccelSec)}</span>
                                        <span className="text-[10px] font-bold opacity-75">({spd}x)</span>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 line-through">
                                        {formatSecondsToFriendly(blockOrigSec)} 1x
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                          Aula {currentCompleted + 1}
                                        </span>
                                        {goalMin > 0 && (
                                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                                            <Target className="w-2.5 h-2.5 text-emerald-500" /> {formatMinutesToFriendly(goalMin)}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2" title={activeLessonName}>
                                        {activeLessonName}
                                      </p>
                                    </div>

                                    {activeLessonDuration && activeLessonDuration !== '00:00' && (
                                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs mt-1">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {activeLessonDuration} (1x)
                                        </span>
                                        {spd > 1 && (
                                          <span className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                                            <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            {formatSecondsToClock(blockAccelSec)} ({spd}x)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-100 dark:bg-slate-950 dark:border-slate-800 mt-0.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase dark:text-slate-400">Teoria Restante</span>
                                    <span className="text-[8px] sm:text-[10px] font-black text-blue-600">{currentCompleted}/{currentTotal} Aulas</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-1 dark:bg-slate-800">
                                    <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${currentTotal > 0 ? Math.min(100, (currentCompleted / currentTotal) * 100) : 0}%` }}></div>
                                  </div>
                                </div>

                              {isToday && (
                                (() => {
                                  // --- TRAVA DE ILUSÃO DE PROGRESSO ---
                                  const hasRetentionDebt = reviews.some(r => r.subjectId === subjectId && r.lastPerformance !== undefined && r.lastPerformance < 0.70);
                                  
                                  if (hasRetentionDebt) {
                                    return (
                                      <div className="mt-2 text-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                                        <span className="text-[8px] sm:text-[10px] font-black text-red-700 dark:text-red-400 block uppercase">Avanço Bloqueado</span>
                                        <p className="text-[8px] text-red-600 dark:text-red-400/80 mt-1 font-medium leading-tight">Você possui falhas críticas no FSRS desta matéria. Restaure a retenção antes de ver conteúdo novo.</p>
                                      </div>
                                    );
                                  }

                                   return (
                                    <button 
                                      onClick={() => {
                                        const remainingLessons = (activeTopic.lessons || []).slice(currentCompleted, activeTopic.total);
                                        setClassConfirmModal({ 
                                          subjectId, 
                                          slotIndex, 
                                          topicName: activeTopic.name, 
                                          maxClasses: activeTopic.total - activeTopic.completed,
                                          lessonDuration: activeLessonDuration,
                                          allLessonsDurations: remainingLessons.map(l => l.duration || '60:00'),
                                          suggestedClasses: blockCount,
                                          timeGoalMinutes: goalMin || null
                                        });
                                      }} 
                                      className="mt-1 flex items-center justify-center gap-1 w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-white rounded-lg text-[9px] sm:text-xs font-black transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:border-orange-500 dark:hover:border-orange-500 hover:scale-[1.02] active:scale-95 group"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-orange-400 group-hover:text-white shrink-0" />
                                      <span className="truncate">
                                        {blockCount > 1 
                                          ? `Queimar Bloco (${blockCount} Aulas • ${formatSecondsToFriendly(blockAccelSec)})` 
                                          : 'Queimar Teoria (+1 FSRS)'}
                                      </span>
                                    </button>
                                  );
                                })()
                              )}

                            </>
                          ) : (
                            <div className="text-center py-2 flex flex-col items-center">
                              <div className="bg-emerald-100 dark:bg-emerald-950/50 p-1.5 rounded-full mb-1.5"><BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                              <span className="text-[8px] sm:text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">100% no FSRS (Só Questões)</span>
                              
                              <button onClick={() => setReplaceSubjectModal({ dayIndex, slotIndex, oldSubjectId: subjectId })} className="w-full py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[9px] sm:text-[11px] font-black transition-all flex items-center justify-center gap-1 border border-blue-100 hover:border-blue-600">
                                <Shuffle className="w-3 h-3" /> <span className="truncate">Reestruturar Vaga</span>
                              </button>
                              
                              {isToday && <button onClick={() => setCompletedToday(prev => [...prev, slotIndex])} className="mt-1 text-[8px] sm:text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2 dark:text-slate-300">Pular hoje</button>}
                            </div>
                          )}
                        </div>
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
