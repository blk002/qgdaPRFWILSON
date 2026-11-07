import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  Trophy, 
  BookOpen, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight, 
  Settings, 
  RotateCcw, 
  X, 
  Info, 
  Zap, 
  Target,
  Sun
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

function formatMinutesToFriendly(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMins}m`;
}

export default function Calendario() {
  const { 
    calendarDate, 
    setCalendarDate, 
    subjects = {}, 
    cycle = [], 
    setCycle,
    cycleScheduleType = 'weekly',
    currentDayIndex = 0, 
    completedToday = [], 
    getEstimatedCompletionDate, 
    getSubjectEstimates,
    targetExamDate,
    subjectTimeGoal = {},
    calendarOverrides = {},
    setDayOverride,
    removeDayOverride,
    scheduleExtensions = [],
    addScheduleExtension,
    removeScheduleExtension,
    futureScheduleRules = [],
    addFutureScheduleRule,
    removeFutureScheduleRule,
    setScheduleFromDate,
    updateSubject
  } = useStore();

  // Estados de Interface
  const [managingDay, setManagingDay] = useState(null); // { dateObj, dateKey, diffDays, daySubjects, vacancies, isCustomized, hasFutureRule }
  const [daySlots, setDaySlots] = useState([]);
  const [saveMode, setSaveMode] = useState('future'); // 'single' | 'future' | 'all'
  const [isAddingNewBlock, setIsAddingNewBlock] = useState(false);
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState('');
  const [newBlockScope, setNewBlockScope] = useState('until_finished'); // 'until_finished' | 'single_day'

  // Estado do Modal de Transição de Matéria
  const [editingTransitionSub, setEditingTransitionSub] = useState(null);
  const [tempAction, setTempAction] = useState('double_remaining');
  const [tempRepId, setTempRepId] = useState('');

  if (!calendarDate) return null;

  const subjectEstimates = getSubjectEstimates ? getSubjectEstimates() : [];
  const estimatedDate = getEstimatedCompletionDate ? getEstimatedCompletionDate() : { short: '', full: '', isLate: false, daysDiff: 0, examDateFormatted: '' };

  const calDate = new Date(calendarDate);
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesesNomesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasSemanaFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const today = new Date();
  const todayDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Simulação dos 365 dias para renderização do calendário e sincronização exata de datas
  const futureSchedule = {};
  const dayVacancies = {}; // mapeia dateKey -> lista de vagas abertas
  const calCompletionDates = {}; // mapeia subjectId -> { dayOffset, dateObj, dateStr }
  const remainingLessonsQueue = {};

  Object.values(subjects || {}).forEach(sub => {
    const spd = Math.max(0.5, Number(sub.speed) || 1);
    const q = [];
    (sub.topics || []).forEach(t => {
      const completed = t.completed || 0;
      const topicLessonsArr = t.lessons || [];
      for (let idx = completed; idx < t.total; idx++) {
        const lesson = topicLessonsArr[idx];
        let mins = 60;
        if (lesson?.duration) {
          const parts = String(lesson.duration).split(':').map(Number);
          if (parts.length === 3 && !parts.some(isNaN)) mins = parts[0] * 60 + parts[1] + parts[2] / 60;
          else if (parts.length === 2 && !parts.some(isNaN)) mins = parts[0] + parts[1] / 60;
        }
        q.push({ durationMins: mins, accelMins: mins / spd });
      }
    });
    remainingLessonsQueue[sub.id] = q;
  });

  for (let i = 0; i < 365; i++) {
    if (cycle.length === 0 && (!calendarOverrides || Object.keys(calendarOverrides).length === 0) && (!futureScheduleRules || futureScheduleRules.length === 0)) break;
    
    const targetSimDate = new Date(todayDateObj);
    targetSimDate.setDate(targetSimDate.getDate() + i);
    const simDateKey = `${targetSimDate.getFullYear()}-${String(targetSimDate.getMonth() + 1).padStart(2, '0')}-${String(targetSimDate.getDate()).padStart(2, '0')}`;

    let daySubjects = [];
    let isExplicitOverride = false;
    
    if (calendarOverrides && calendarOverrides[simDateKey]) {
      daySubjects = [...calendarOverrides[simDateKey]];
      isExplicitOverride = true;
    } else {
      const cycleIndex = (currentDayIndex + i) % Math.max(1, cycle.length);
      const targetDayOfWeek = targetSimDate.getDay();
      
      // Procura regras de padrão para o futuro que comecem antes ou nesta data
      const matchingRules = (futureScheduleRules || [])
        .filter(r => r.fromDate <= simDateKey && (r.dayOfWeek === targetDayOfWeek || r.cycleIndex === cycleIndex))
        .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

      if (matchingRules.length > 0) {
        daySubjects = [...matchingRules[0].daySlots];
      } else if (cycle.length > 0) {
        daySubjects = [...(cycle[cycleIndex] || [])];
      }
    }

    // Extensões ativas (ex: 3ª matéria adicionada até zerar)
    if (scheduleExtensions && scheduleExtensions.length > 0) {
      scheduleExtensions.forEach(ext => {
        if (ext.active !== false && simDateKey >= ext.fromDate) {
          if (remainingLessonsQueue[ext.subjectId]?.length > 0 && !daySubjects.includes(ext.subjectId)) {
            daySubjects.push(ext.subjectId);
          }
        }
      });
    }

    const scheduledThisDay = [];
    const vacanciesThisDay = [];

    daySubjects.forEach((subId, slotIdx) => {
      if (i === 0 && completedToday.includes(slotIdx)) return;

      let effectiveSubId = subId;
      let q = remainingLessonsQueue[effectiveSubId];
      let wasTransitioned = false;

      // Se a matéria esgotou suas aulas, verificar transição ou flag de vaga aberta
      if (!q || q.length === 0) {
        const originalSub = subjects[subId];
        const action = originalSub?.onCompleteAction || 'double_remaining';

        if (action === 'replace' && originalSub?.replacementSubjectId && subjects[originalSub.replacementSubjectId]) {
          const repId = originalSub.replacementSubjectId;
          const repQ = remainingLessonsQueue[repId];
          if (repQ && repQ.length > 0) {
            effectiveSubId = repId;
            q = repQ;
            wasTransitioned = true;
          }
        } else if (action === 'double_remaining') {
          const fallbackId = daySubjects.find(sId => sId !== subId && remainingLessonsQueue[sId]?.length > 0)
            || Object.keys(remainingLessonsQueue).find(sId => remainingLessonsQueue[sId]?.length > 0);
          
          if (fallbackId) {
            effectiveSubId = fallbackId;
            q = remainingLessonsQueue[fallbackId];
            wasTransitioned = true;
          }
        }

        // Registrar vaga aberta caso a original tenha zerado
        if (!isExplicitOverride && originalSub) {
          vacanciesThisDay.push({
            slotIndex: slotIdx,
            originalSubId: subId,
            originalSubName: originalSub.name,
            currentEffectiveSubId: wasTransitioned ? effectiveSubId : null,
            transitionAction: action
          });
        }
      }

      if (q && q.length > 0) {
        const sub = subjects[effectiveSubId];
        const goalMin = Number(sub?.timeGoalMinutes || subjectTimeGoal?.[effectiveSubId]) || 0;
        let consumed = 0;
        let accelAcc = 0;

        while (q.length > 0) {
          const nextL = q[0];
          if (consumed === 0) {
            consumed++;
            accelAcc += nextL.accelMins;
            q.shift();
            if (goalMin === 0) break;
            continue;
          }

          if (accelAcc >= goalMin * 0.85 && ((accelAcc + nextL.accelMins - goalMin) / goalMin) > 0.20) {
            break;
          }

          if (accelAcc < goalMin) {
            consumed++;
            accelAcc += nextL.accelMins;
            q.shift();
          } else {
            break;
          }
        }

        const isLast = q.length === 0;
        scheduledThisDay.push({ 
          id: effectiveSubId, 
          originalId: subId,
          isLast, 
          count: consumed,
          isTransitioned: wasTransitioned 
        });

        // Grava a data exata em que a matéria encerra no grid
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

    futureSchedule[i] = scheduledThisDay;
    if (vacanciesThisDay.length > 0) {
      dayVacancies[simDateKey] = vacanciesThisDay;
    }
  }

  // Handlers do Gerenciador de Dia
  const handleOpenDayManager = (cellDateObj, dateKey) => {
    const diff = Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
    let currentDaySubs = [];
    
    // 1. Prioriza exatamente o que está simulado e visível na grade do calendário
    if (diff >= 0 && futureSchedule[diff] && futureSchedule[diff].length > 0) {
      currentDaySubs = futureSchedule[diff].map(item => item.id);
    } else if (calendarOverrides && calendarOverrides[dateKey]) {
      currentDaySubs = [...calendarOverrides[dateKey]];
    } else {
      const cIdx = ((currentDayIndex + Math.max(0, diff)) % Math.max(1, cycle.length));
      const targetDayOfWeek = cellDateObj.getDay();
      const matchingRules = (futureScheduleRules || [])
        .filter(r => r.fromDate <= dateKey && (r.dayOfWeek === targetDayOfWeek || r.cycleIndex === cIdx))
        .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

      if (matchingRules.length > 0) {
        currentDaySubs = [...matchingRules[0].daySlots];
      } else if (cycle.length > 0) {
        currentDaySubs = [...(cycle[cIdx] || [])];
      }
    }

    // 2. Garante que qualquer extensão ativa para esta data (ex: 3ª matéria) esteja presente no gerenciador
    if (scheduleExtensions && scheduleExtensions.length > 0) {
      scheduleExtensions.forEach(ext => {
        if (ext.active !== false && dateKey >= ext.fromDate) {
          if (remainingLessonsQueue[ext.subjectId]?.length > 0 && !currentDaySubs.includes(ext.subjectId)) {
            currentDaySubs.push(ext.subjectId);
          }
        }
      });
    }

    const hasFutureRule = futureScheduleRules?.some(r => r.fromDate === dateKey && r.dayOfWeek === cellDateObj.getDay());

    setManagingDay({
      dateObj: cellDateObj,
      dateKey,
      diffDays: diff,
      isCustomized: Boolean(calendarOverrides && calendarOverrides[dateKey]),
      hasFutureRule,
      vacancies: dayVacancies[dateKey] || []
    });
    setDaySlots(currentDaySubs);
    setSaveMode('future'); // padrão recomendado: para o futuro
    setIsAddingNewBlock(false);
    setSelectedNewSubjectId('');
    setNewBlockScope('until_finished');
  };

  const handleSaveDayManager = () => {
    if (!managingDay) return;
    const { dateKey, dateObj, diffDays } = managingDay;
    const dayOfWeek = dateObj.getDay();
    const cycleIndex = (currentDayIndex + Math.max(0, diffDays)) % Math.max(1, cycle.length);

    let updatedSlots = [...daySlots];

    // Se estiver adicionando novo bloco
    if (isAddingNewBlock && selectedNewSubjectId) {
      if (!updatedSlots.includes(selectedNewSubjectId)) {
        updatedSlots.push(selectedNewSubjectId);
      }
      if (newBlockScope === 'until_finished') {
        if (addScheduleExtension) {
          addScheduleExtension({
            fromDate: dateKey,
            subjectId: selectedNewSubjectId,
            mode: 'until_finished'
          });
        }
        toast.success(`3ª Matéria (${subjects[selectedNewSubjectId]?.name || 'Disciplina'}) estendida a partir de ${dateKey} até zerar!`);
      }
    }

    // Se o usuário removeu alguma matéria que era uma extensão iniciada nesta data:
    const extsOnThisDate = (scheduleExtensions || []).filter(e => e.fromDate === dateKey);
    extsOnThisDate.forEach(ext => {
      if (!updatedSlots.includes(ext.subjectId) && removeScheduleExtension) {
        removeScheduleExtension(ext.id);
      }
    });

    if (saveMode === 'single') {
      // 1. Salvar APENAS neste dia
      if (setDayOverride) {
        setDayOverride(dateKey, updatedSlots);
        toast.success(`Alterações salvas exclusivamente para o dia ${dateKey}!`);
      }
    } else if (saveMode === 'future') {
      // 2. Tornar PADRÃO PARA O FUTURO (a partir desta data)
      // Preserva todos os dias anteriores intactos!
      if (addFutureScheduleRule) {
        addFutureScheduleRule({
          fromDate: dateKey,
          dayOfWeek,
          cycleIndex,
          daySlots: updatedSlots
        });
      }
      if (removeDayOverride) removeDayOverride(dateKey);
      toast.success(`Padrão definido para o futuro a partir de ${dateKey}! Todos os dias anteriores foram preservados.`);
    }

    setManagingDay(null);
  };

  const handleResetDayToDefault = () => {
    if (!managingDay) return;
    const { dateKey, dateObj } = managingDay;
    const dayOfWeek = dateObj.getDay();

    if (removeDayOverride) removeDayOverride(dateKey);
    
    // Remove regras de futuro que começavam exatamente nesta data
    const ruleToRemove = futureScheduleRules?.find(r => r.fromDate === dateKey && r.dayOfWeek === dayOfWeek);
    if (ruleToRemove && removeFutureScheduleRule) {
      removeFutureScheduleRule(ruleToRemove.id);
    }

    // Remove extensões que começavam exatamente nesta data
    const extsToRemove = scheduleExtensions?.filter(e => e.fromDate === dateKey);
    if (extsToRemove && extsToRemove.length > 0 && removeScheduleExtension) {
      extsToRemove.forEach(e => removeScheduleExtension(e.id));
    }

    toast.success(`Customização do dia ${dateKey} removida. Padrão anterior restaurado!`);
    setManagingDay(null);
  };

  const handleQuickFillVacancy = (vacancy, chosenSubId) => {
    if (!managingDay) return;
    const { dateKey, dateObj, diffDays } = managingDay;
    const dayOfWeek = dateObj.getDay();
    const cycleIndex = (currentDayIndex + Math.max(0, diffDays)) % Math.max(1, cycle.length);

    const updatedSlots = daySlots.map((sId, idx) => idx === vacancy.slotIndex ? chosenSubId : sId);

    // Cria regra para o futuro a partir de dateKey
    if (addFutureScheduleRule) {
      addFutureScheduleRule({
        fromDate: dateKey,
        dayOfWeek,
        cycleIndex,
        daySlots: updatedSlots
      });
    }

    toast.success(`Vaga preenchida por ${subjects[chosenSubId]?.name || 'nova matéria'} a partir de ${dateKey} para o futuro! Dias anteriores preservados.`);
    setManagingDay(null);
  };

  // Handlers para Transição de Conclusão no Painel Lateral
  const handleOpenTransitionModal = (sub) => {
    setEditingTransitionSub(sub);
    setTempAction(sub.onCompleteAction || 'double_remaining');
    setTempRepId(sub.replacementSubjectId || '');
  };

  const handleSaveTransition = () => {
    if (!editingTransitionSub) return;
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
    <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6 w-full pb-10 fade-in">
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        
        {/* Banner de Previsão de Término */}
        <div className={`text-white p-4 md:p-5 rounded-xl shadow-md mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${estimatedDate.isLate ? 'bg-red-600 animate-pulse border border-red-800' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full shrink-0 dark:bg-slate-900">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
            </div>
            <div>
              <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5">Previsão de Fechamento do Edital</p>
              <div className="flex-1 min-w-0">
                <h4 className="text-xl md:text-2xl font-black text-white whitespace-nowrap overflow-visible">{estimatedDate.full}</h4>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="bg-black/20 px-3 py-1.5 rounded-lg text-xs md:text-sm text-white font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4"/> Prova: {estimatedDate.examDateFormatted}
            </div>
            {estimatedDate.isLate && (
              <span className="text-xs font-black text-yellow-300 mt-2 uppercase text-right">
                Risco de Reprovação: Atrasado {estimatedDate.daysDiff} dias. Aumente seu ritmo!
              </span>
            )}
          </div>
        </div>

        {/* Cabeçalho do Mês no Calendário */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
            <CalendarIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" /> {mesesNomes[month]} {year}
          </h2>
          <div className="flex gap-1 sm:gap-2">
            <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:bg-slate-950 dark:border-slate-800 cursor-pointer"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:bg-slate-950 dark:border-slate-800 cursor-pointer"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
        
        {/* Grade do Calendário */}
        <div className="overflow-x-auto custom-scrollbar pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="min-w-[500px] sm:min-w-0">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {diasSemana.map(dia => <div key={dia} className="text-center font-bold text-slate-400 text-xs sm:text-sm">{dia}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {blanks.map((_, i) => <div key={`blank-${i}`} className="min-h-[5.5rem] md:min-h-[7.5rem] bg-slate-50/50 rounded-md sm:rounded-lg dark:bg-slate-950"></div>)}
              {days.map(day => {
                const cellDateObj = new Date(year, month, day);
                const cellTime = cellDateObj.getTime();
                const todayTime = todayDateObj.getTime();
                const diffDays = Math.round((cellTime - todayTime) / (1000 * 60 * 60 * 24));
                const isTodayReal = diffDays === 0;
                const isPast = diffDays < 0;

                let bgClass = isPast 
                  ? "bg-slate-50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-500" 
                  : isTodayReal 
                    ? "bg-blue-50 border-2 border-blue-500 shadow-sm text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300" 
                    : "bg-white border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300";
                
                let projectedSubjects = [];
                if (diffDays >= 0 && futureSchedule[diffDays]) projectedSubjects = futureSchedule[diffDays];

                const cellDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isOverridden = Boolean(calendarOverrides && calendarOverrides[cellDateKey]);
                const hasExtensions = scheduleExtensions?.some(e => e.active !== false && cellDateKey >= e.fromDate);
                const hasFutureRule = futureScheduleRules?.some(r => r.fromDate <= cellDateKey && r.dayOfWeek === cellDateObj.getDay());
                const vacancies = dayVacancies[cellDateKey] || [];

                return (
                  <div 
                    key={day} 
                    onClick={() => handleOpenDayManager(cellDateObj, cellDateKey)}
                    className={`min-h-[5.5rem] md:min-h-[7.5rem] p-1 sm:p-1.5 rounded-md flex flex-col transition-all cursor-pointer group hover:ring-2 hover:ring-blue-400 hover:shadow-md ${bgClass}`}
                    title="Clique para gerenciar matérias, adicionar bloco ou definir padrão para o futuro"
                  >
                    <div className="flex justify-between items-start mb-1 gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs sm:text-sm px-1 group-hover:text-blue-500 transition-colors">{day}</span>
                        {isOverridden && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Dia com personalização manual avulsa" />
                        )}
                        {hasFutureRule && !isOverridden && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Dia sob regra de padrão para o futuro" />
                        )}
                        {hasExtensions && (
                          <span className="text-[8px] font-black text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800" title="3ª Matéria Ativa (até zerar)">
                            +3ª
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isTodayReal && <span className="text-[9px] sm:text-[10px] font-black bg-blue-500 text-white px-1 sm:px-1.5 py-0.5 rounded-sm">HOJE</span>}
                        <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Vagas Abertas em Destaque */}
                    {diffDays >= 0 && vacancies.length > 0 && !isOverridden && (
                      <div className="mb-1">
                        {vacancies.map((v, vIdx) => (
                          <div 
                            key={vIdx}
                            className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase flex items-center gap-1 animate-pulse"
                            title={`${v.originalSubName} concluiu seu conteúdo! Clique para definir quem assume a vaga.`}
                          >
                            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span className="truncate">Vaga: {v.originalSubName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {diffDays >= 0 && projectedSubjects.length > 0 && (
                       <div className="flex flex-col gap-0.5 sm:gap-1 pb-1 mt-auto">
                         {projectedSubjects.map((item, idx) => {
                           const sub = subjects[item.id];
                           if(!sub) return null;
                           return (
                             <div key={idx} className={`flex items-center justify-between text-[10px] sm:text-[12px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm leading-tight mb-0.5 ${sub.color}`}>
                               <span className="truncate flex-1">
                                 {sub.name}
                                 {item.isTransitioned && (
                                   <span className="opacity-80 text-[8px] font-black uppercase tracking-tight ml-1 bg-black/20 dark:bg-white/20 px-1 py-0.2 rounded">
                                     2º BLOCO
                                   </span>
                                 )}
                               </span>
                               {item.isLast && (
                                 <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0 ml-0.5" viewBox="0 0 24 24" fill="none">
                                   <path d="M12 2L22 20H2L12 2Z" fill="white" stroke="#E81C23" strokeWidth="3" strokeLinejoin="round"/>
                                   <path d="M12 8V14" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
                                   <circle cx="12" cy="17.5" r="1.5" fill="#1A1A1A"/>
                                 </svg>
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
      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col shrink-0 mb-8 lg:mb-0 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:text-slate-100 dark:border-slate-800">
          <BookOpen className="text-blue-600 w-5 h-5" /> Fim das Disciplinas
        </h3>
        <div className="flex flex-col gap-3 pr-2">
          {subjectEstimates.map(sub => {
            const totalClasses = (sub.topics || []).reduce((acc, t) => acc + (t.total || 0), 0);
            const completedClasses = Math.max(0, totalClasses - sub.remaining);
            const pct = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;
            const currentSpeed = Number(sub.speed) || 1;
            const currentTimeGoal = Number(sub.timeGoalMinutes) || 0;

            // Sincronização direta com a previsão do calendário
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
                        {sub.onCompleteAction === 'replace' ? '🔄 Substituir' : '⚡ Dobrar Restante'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Seção de Regras para o Futuro e Extensões Ativas */}
        {((futureScheduleRules && futureScheduleRules.length > 0) || (scheduleExtensions && scheduleExtensions.length > 0)) && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Padrões Futuros & Extensões
            </h4>
            <div className="flex flex-col gap-2">
              {/* Regras de Padrão para o Futuro */}
              {futureScheduleRules?.map(rule => {
                const dayName = diasSemanaFull[rule.dayOfWeek] || `Dia ${rule.dayOfWeek}`;
                return (
                  <div key={rule.id} className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex flex-col">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        Padrão: {dayName}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        A partir de {rule.fromDate} ({rule.daySlots.length} blocos)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (removeFutureScheduleRule) removeFutureScheduleRule(rule.id);
                        toast.success('Padrão para o futuro removido! Grade base restaurada.');
                      }}
                      className="p-1.5 text-emerald-700 hover:text-red-500 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                      title="Excluir este padrão futuro e restaurar o original"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* 3ª Matéria Estendida */}
              {scheduleExtensions?.map(ext => {
                const sub = subjects[ext.subjectId];
                return (
                  <div key={ext.id} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        + {sub?.name || 'Disciplina'} (3ª Matéria)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        A partir de {ext.fromDate} (até zerar aulas)
                      </span>
                    </div>
                    <button
                      onClick={() => removeScheduleExtension && removeScheduleExtension(ext.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                      title="Remover esta extensão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  Gerenciar Dia: {managingDay.dateKey} ({diasSemanaFull[managingDay.dateObj.getDay()]})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste os blocos deste dia e decida se a alteração se aplica apenas a esta data ou se torna o novo padrão para o futuro.
              </p>
            </div>

            {/* Alerta de Vaga em Aberto */}
            {managingDay.vacancies && managingDay.vacancies.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Vaga disponível: Matéria concluída</span>
                </div>
                {managingDay.vacancies.map((vac, vIdx) => (
                  <div key={vIdx} className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-2">
                    <p>
                      <strong>{vac.originalSubName}</strong> encerrou seu conteúdo nesta data. Como deseja preencher esta vaga?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const otherId = daySlots.find(sId => sId !== vac.originalSubId) || Object.keys(subjects)[0];
                          handleQuickFillVacancy(vac, otherId);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        ⚡ Dobrar Matéria Restante (Para o Futuro a partir de {managingDay.dateKey})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
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
                        onClick={() => setDaySlots(daySlots.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Remover este bloco"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Adicionar Novo Bloco (ex: 3ª Matéria) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {!isAddingNewBlock ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewBlock(true);
                    setSelectedNewSubjectId(Object.keys(subjects)[0] || '');
                  }}
                  className="w-full py-2 border-2 border-dashed border-blue-300 dark:border-blue-900 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Adicionar Mais um Bloco neste Dia (3º, 4º...)
                </button>
              ) : (
                <div className="bg-blue-50/60 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Adicionar Bloco Adicional
                    </span>
                    <button onClick={() => setIsAddingNewBlock(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancelar</button>
                  </div>

                  <select
                    value={selectedNewSubjectId}
                    onChange={(e) => setSelectedNewSubjectId(e.target.value)}
                    className="w-full text-xs font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  >
                    {Object.values(subjects).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <div className="flex flex-col gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <label className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Alcance desta inclusão:</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="newBlockScope" 
                        value="until_finished" 
                        checked={newBlockScope === 'until_finished'} 
                        onChange={() => setNewBlockScope('until_finished')}
                      />
                      <span><strong>Desta data em diante até zerar todas as aulas</strong> (Estender cronograma)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="newBlockScope" 
                        value="single_day" 
                        checked={newBlockScope === 'single_day'} 
                        onChange={() => setNewBlockScope('single_day')}
                      />
                      <span>Apenas neste dia ({managingDay.dateKey})</span>
                    </label>
                  </div>
                </div>
              )}
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
                      🚀 Tornar Padrão para o Futuro (a partir de {managingDay.dateKey})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Aplica esta grade para este dia da semana ({diasSemanaFull[managingDay.dateObj.getDay()]}) daqui em diante. <strong>Todos os dias anteriores continuam intactos!</strong>
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
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      💾 Apenas neste dia ({managingDay.dateKey})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Modifica exclusivamente esta data. As semanas seguintes e anteriores não serão alteradas.
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
                className={`w-full py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${saveMode === 'future' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <CheckCircle className="w-4 h-4" /> 
                {saveMode === 'future' ? `Confirmar e Tornar Padrão de ${managingDay.dateKey} em Diante` : 'Salvar Alterações para este Dia'}
              </button>

              {(managingDay.isCustomized || managingDay.hasFutureRule) && (
                <button
                  type="button"
                  onClick={handleResetDayToDefault}
                  className="w-full py-2 text-slate-500 hover:text-red-500 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão Anterior (Remover Customização)
                </button>
              )}
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
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">⚡ Dobrar Matéria Restante (ex: 2 aulas de Física)</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">A outra disciplina do dia assume a vaga deixada, acelerando o término do edital.</span>
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
    </div>
  );
}
