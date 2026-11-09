import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Pin
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
    cycleWeekStart = 'sunday',
    currentDayIndex = 0, 
    completedToday = [], 
    getEstimatedCompletionDate, 
    getSubjectEstimates,
    subjectTimeGoal = {},
    calendarOverrides = {},
    setDayOverride,
    removeDayOverride,
    futureScheduleRules = [],
    addFutureScheduleRule,
    updateSubject
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
  const [saveMode, setSaveMode] = useState('future'); // 'single' | 'future' | 'all'

  // Estado do Modal de Transição de Matéria
  const [editingTransitionSub, setEditingTransitionSub] = useState(null);
  const [tempAction, setTempAction] = useState('keep_fixed');
  const [tempRepId, setTempRepId] = useState('');

  const rawCalDate = calendarDate ? new Date(calendarDate) : new Date();
  const calDate = isNaN(rawCalDate.getTime()) ? new Date() : rawCalDate;

  const subjectEstimates = getSubjectEstimates ? getSubjectEstimates() : [];
  const estimatedDate = getEstimatedCompletionDate ? getEstimatedCompletionDate() : { short: '', full: '', isLate: false, daysDiff: 0, examDateFormatted: '' };
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

  // Função principal: retorna as matérias programadas para qualquer data do calendário
  const getDaySubjectsForDate = (cellDateObj, dateKey) => {
    // 1. Personalização manual explícita para este dia específico (prioridade absoluta)
    if (calendarOverrides && Array.isArray(calendarOverrides[dateKey])) {
      return [...calendarOverrides[dateKey]];
    }

    let daySubjects = [];

    // 2. Ciclo Semanal Fixo ou Sequencial + Regras Futuras
    if (cycle && cycle.length > 0) {
      const targetDayOfWeek = cellDateObj.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sáb
      const diff = Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      const cycleIndex = (cycleScheduleType === 'weekly' && cycle.length === 7)
        ? ((cycleWeekStart === 'monday') ? (targetDayOfWeek + 6) % 7 : targetDayOfWeek)
        : ((currentDayIndex + diff) % cycle.length + cycle.length) % cycle.length;

      const matchingRules = (futureScheduleRules || [])
        .filter(r => {
          if (!r || r.v !== 2 || !r.fromDate || r.fromDate > dateKey) return false;
          if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
            return r.dayOfWeek === targetDayOfWeek;
          }
          return r.dayOfWeek === targetDayOfWeek || r.cycleIndex === cycleIndex;
        })
        .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

      if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
        daySubjects = [...matchingRules[0].daySlots];
      } else if (Array.isArray(cycle[cycleIndex])) {
        daySubjects = [...cycle[cycleIndex]];
      }
    }

    return daySubjects;
  };

  // 3. Simulação dos 730 dias para sincronização e previsão de término das disciplinas
  const futureSchedule = {}; // dateKey -> array of { id, count, isLast, isTransitioned }
  const calCompletionDates = {}; // subjectId -> { dayOffset, dateObj, dateStr }
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

  for (let i = 0; i < 730; i++) {
    if (cycle.length === 0 && (!calendarOverrides || Object.keys(calendarOverrides).length === 0) && (!futureScheduleRules || futureScheduleRules.length === 0)) break;

    const targetSimDate = new Date(todayDateObj);
    targetSimDate.setDate(targetSimDate.getDate() + i);
    const simDateKey = `${targetSimDate.getFullYear()}-${String(targetSimDate.getMonth() + 1).padStart(2, '0')}-${String(targetSimDate.getDate()).padStart(2, '0')}`;

    let daySubjects = [];
    if (calendarOverrides && Array.isArray(calendarOverrides[simDateKey])) {
      daySubjects = [...calendarOverrides[simDateKey]];
    } else {
      const targetDayOfWeek = targetSimDate.getDay();
      const cycleIndex = (cycleScheduleType === 'weekly' && cycle.length === 7)
        ? ((cycleWeekStart === 'monday') ? (targetDayOfWeek + 6) % 7 : targetDayOfWeek)
        : (currentDayIndex + i) % Math.max(1, cycle.length);
      
      const matchingRules = (futureScheduleRules || [])
        .filter(r => {
          if (!r || r.v !== 2 || !r.fromDate || r.fromDate > simDateKey) return false;
          if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
            return r.dayOfWeek === targetDayOfWeek;
          }
          return r.dayOfWeek === targetDayOfWeek || r.cycleIndex === cycleIndex;
        })
        .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

      if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
        daySubjects = [...matchingRules[0].daySlots];
      } else if (cycle.length > 0 && cycle[cycleIndex]) {
        daySubjects = [...(cycle[cycleIndex] || [])];
      }
    }

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
          isLast, 
          count: consumed,
          isTransitioned: wasTransitioned
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

  // Botão tático para fixar e limpar quaisquer extensões fantasmas (+3ª) ou regras antigas
  const handleFixCalendar = () => {
    useStore.setState({
      scheduleExtensions: [],
      futureScheduleRules: [],
      calendarOverrides: {}
    });
    toast.success("Calendário 100% fixado no padrão do seu ciclo semanal!");
  };

  // Handlers do Gerenciador de Dia
  const handleOpenDayManager = (cellDateObj, dateKey) => {
    const diff = Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return; // Dias passados não abrem o gerenciador

    const dayOfWeek = cellDateObj.getDay();
    const weekIndex = (cycleScheduleType === 'weekly' && cycle.length === 7)
      ? ((cycleWeekStart === 'monday') ? (dayOfWeek + 6) % 7 : dayOfWeek)
      : ((currentDayIndex + diff) % Math.max(1, cycle.length) + Math.max(1, cycle.length)) % Math.max(1, cycle.length);

    const baseSubs = (cycle && Array.isArray(cycle[weekIndex])) ? [...cycle[weekIndex]] : [];
    // Lê exatamente as matérias visíveis neste card do calendário
    const currentDaySubs = futureSchedule[dateKey] !== undefined
      ? futureSchedule[dateKey].map(item => item.id)
      : [...getDaySubjectsForDate(cellDateObj, dateKey)];

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
    setSaveMode('future'); // padrão: aplicar desta data para o futuro (sem alterar o passado)
  };

  const handleSaveDayManager = () => {
    if (!managingDay) return;
    const { dateKey, dayOfWeek, weekIndex } = managingDay;
    const updatedSlots = [...daySlots];

    if (saveMode === 'single') {
      // 1. Salva apenas nesta data específica (prioridade absoluta sobre regras e extensões)
      if (setDayOverride) {
        setDayOverride(dateKey, updatedSlots);
        toast.success(`Programação salva exclusivamente para ${dateKey}!`);
      }
    } else if (saveMode === 'future') {
      // 2. Torna padrão a partir desta data para o FUTURO (preserva todos os dias anteriores/passado intactos!)
      if (addFutureScheduleRule) {
        addFutureScheduleRule({
          fromDate: dateKey,
          dayOfWeek,
          cycleIndex: weekIndex,
          daySlots: updatedSlots
        });
      }
      // Remove overrides avulsos desta data em diante neste mesmo dia da semana para que a regra futura prevaleça
      const nextOverrides = { ...(calendarOverrides || {}) };
      Object.keys(nextOverrides).forEach(dKey => {
        if (dKey >= dateKey) {
          const parts = dKey.split('-').map(Number);
          if (parts.length === 3) {
            const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
            if (dObj.getDay() === dayOfWeek) {
              delete nextOverrides[dKey];
            }
          }
        }
      });
      useStore.setState({ calendarOverrides: nextOverrides });
      toast.success(`Programação definida de ${dateKey} para o futuro! Os dias anteriores não foram alterados.`);
    } else {
      // 3. Atualiza o ciclo semanal base para todas as semanas neste dia e limpa regras antigas conflitantes
      if (setCycle) {
        const totalDays = cycleScheduleType === 'weekly' ? 7 : Math.max((cycle || []).length, weekIndex + 1);
        const newCycle = Array.from({ length: totalDays }, (_, i) => Array.isArray(cycle?.[i]) ? [...cycle[i]] : []);
        newCycle[weekIndex] = updatedSlots;
        setCycle(newCycle);
        if (removeDayOverride) removeDayOverride(dateKey);

        // Remove regras futuras antigas que sobrescreviam este dia da semana
        const cleanedRules = (futureScheduleRules || []).filter(
          r => r && r.v === 2 && r.dayOfWeek !== dayOfWeek && r.cycleIndex !== weekIndex
        );
        useStore.setState({
          futureScheduleRules: cleanedRules
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
              <CalendarIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" /> {mesesNomes[month]} {year}
            </h2>
            <button
              onClick={handleFixCalendar}
              className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
              title="Fixar a grade semanal e remover quaisquer extensões ou regras que alteravam a programação"
            >
              <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Grade Semanal Fixa
            </button>
          </div>
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
                  ? "bg-slate-50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-500 cursor-default" 
                  : isTodayReal 
                    ? "bg-blue-50 border-2 border-blue-500 shadow-sm text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:shadow-md" 
                    : "bg-white border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:shadow-md";

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
                    className={`min-h-[5.5rem] md:min-h-[7.5rem] p-1 sm:p-1.5 rounded-md flex flex-col transition-all group ${bgClass}`}
                    title={isPast ? "Dia já concluído / passado" : "Clique para gerenciar matérias deste dia"}
                  >
                    <div className="flex justify-between items-start mb-1 gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-xs sm:text-sm px-1 transition-colors ${!isPast ? 'group-hover:text-blue-500' : ''}`}>{day}</span>
                        {isOverridden && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Dia com personalização manual avulsa" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isTodayReal && <span className="text-[9px] sm:text-[10px] font-black bg-blue-500 text-white px-1 sm:px-1.5 py-0.5 rounded-sm">HOJE</span>}
                        {!isPast && <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </div>
                    
                    {dayItemsToRender.length > 0 && (
                      <div className="flex flex-col gap-0.5 sm:gap-1 pb-1 mt-auto">
                        {dayItemsToRender.map((item, idx) => {
                          const sub = subjects[item.id];
                          if (!sub) return null;
                          return (
                            <div key={idx} className={`flex items-center justify-between text-[10px] sm:text-[12px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm leading-tight mb-0.5 ${sub.color}`}>
                              <span className="truncate flex-1">
                                {sub.name}
                                {item.isTransitioned && (
                                  <span className="opacity-80 text-[8px] font-black uppercase tracking-tight ml-1 bg-black/20 dark:bg-white/20 px-1 py-0.2 rounded">
                                    SUBST.
                                  </span>
                                )}
                              </span>
                              {item.isLast && (
                                <span title={`Conclusão prevista de ${sub.name}!`} className="flex items-center ml-0.5 shrink-0">
                                  <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 animate-bounce" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L22 20H2L12 2Z" fill="white" stroke="#E81C23" strokeWidth="3" strokeLinejoin="round"/>
                                    <path d="M12 8V14" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
                                    <circle cx="12" cy="17.5" r="1.5" fill="#1A1A1A"/>
                                  </svg>
                                </span>
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

            {/* Adicionar Novo Bloco neste Dia */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const firstSubId = Object.keys(subjects)[0] || '';
                  if (firstSubId) {
                    setDaySlots([...daySlots, firstSubId]);
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

              {managingDay.isCustomized && (
                <button
                  type="button"
                  onClick={handleResetDayToDefault}
                  className="w-full py-2 text-slate-500 hover:text-red-500 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão do Ciclo Semanal
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
    </div>
  );
}
