import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  CheckCircle,
  Zap,
  Target,
  RotateCcw,
  Settings,
  Shuffle,
  Check,
  X,
  Plus
} from 'lucide-react';
import { formatMinutesToFriendly } from '../lib/durationHelpers';

export default function Calendario() {
  const {
    subjects = {},
    setSubjects,
    cycle = [],
    currentDayIndex = 0,
    completedToday = [],
    calendarDate,
    setCalendarDate,
    getSubjectEstimates,
    getEstimatedCompletionDate,
    subjectTimeGoal = {},
    calendarOverrides = {},
    setDayOverride,
    removeDayOverride,
    scheduleExtensions = [],
    addScheduleExtension,
    removeScheduleExtension,
    setScheduleFromDate
  } = useStore();
  
  // Estado do Gerenciador de Dia no Calendário
  const [managingDay, setManagingDay] = useState(null);
  const [daySlots, setDaySlots] = useState([]);
  const [isAddingNewBlock, setIsAddingNewBlock] = useState(false);
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState('');
  const [newBlockScope, setNewBlockScope] = useState('until_finished'); // 'until_finished' | 'single_day'
  
  // Estado do Modal de Transição
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
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const today = new Date();
  const todayDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const futureSchedule = {};
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
    if (cycle.length === 0 && (!calendarOverrides || Object.keys(calendarOverrides).length === 0)) break;
    
    const targetSimDate = new Date(todayDateObj);
    targetSimDate.setDate(targetSimDate.getDate() + i);
    const simDateKey = `${targetSimDate.getFullYear()}-${String(targetSimDate.getMonth() + 1).padStart(2, '0')}-${String(targetSimDate.getDate()).padStart(2, '0')}`;

    let daySubjects = [];
    if (calendarOverrides && calendarOverrides[simDateKey]) {
      daySubjects = [...calendarOverrides[simDateKey]];
    } else if (cycle.length > 0) {
      const cycleIndex = (currentDayIndex + i) % cycle.length;
      daySubjects = [...(cycle[cycleIndex] || [])];
    }

    // Adiciona extensões ativas a partir de uma data específica (3ª matéria até zerar)
    if (scheduleExtensions && scheduleExtensions.length > 0) {
      scheduleExtensions.forEach(ext => {
        if (ext.active !== false && simDateKey >= ext.fromDate) {
          if (remainingLessonsQueue[ext.subjectId]?.length > 0) {
            daySubjects.push(ext.subjectId);
          }
        }
      });
    }

    const scheduledThisDay = [];

    daySubjects.forEach((subId, slotIdx) => {
      if (i === 0 && completedToday.includes(slotIdx)) return;

      let effectiveSubId = subId;
      let q = remainingLessonsQueue[effectiveSubId];

      // Se a matéria original esgotou suas aulas, verificar a regra de transição
      if (!q || q.length === 0) {
        const originalSub = subjects[subId];
        const action = originalSub?.onCompleteAction || 'double_remaining';

        if (action === 'replace' && originalSub?.replacementSubjectId && subjects[originalSub.replacementSubjectId]) {
          const repId = originalSub.replacementSubjectId;
          const repQ = remainingLessonsQueue[repId];
          if (repQ && repQ.length > 0) {
            effectiveSubId = repId;
            q = repQ;
          }
        } else if (action === 'double_remaining') {
          const fallbackId = daySubjects.find(sId => sId !== subId && remainingLessonsQueue[sId]?.length > 0)
            || Object.keys(remainingLessonsQueue).find(sId => remainingLessonsQueue[sId]?.length > 0);
          
          if (fallbackId) {
            effectiveSubId = fallbackId;
            q = remainingLessonsQueue[fallbackId];
          }
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
          isLast, 
          count: consumed,
          isTransitioned: effectiveSubId !== subId 
        });
      }
    });
    futureSchedule[i] = scheduledThisDay;
  }

  // Handlers para gerenciar o dia
  const handleOpenDayManager = (cellDateObj, dateKey) => {
    const diff = Math.round((cellDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
    let currentDaySubs = [];
    if (calendarOverrides && calendarOverrides[dateKey]) {
      currentDaySubs = [...calendarOverrides[dateKey]];
    } else if (diff >= 0 && futureSchedule[diff]) {
      currentDaySubs = futureSchedule[diff].map(item => item.id);
    } else if (cycle.length > 0) {
      const cIdx = ((currentDayIndex + Math.max(0, diff)) % cycle.length);
      currentDaySubs = [...(cycle[cIdx] || [])];
    }

    setManagingDay({
      dateObj: cellDateObj,
      dateKey,
      diffDays: diff,
      isCustomized: Boolean(calendarOverrides && calendarOverrides[dateKey])
    });
    setDaySlots(currentDaySubs);
    setIsAddingNewBlock(false);
    setSelectedNewSubjectId('');
    setNewBlockScope('until_finished');
  };

  const handleSaveDayManager = () => {
    if (!managingDay) return;
    const { dateKey } = managingDay;

    if (isAddingNewBlock && selectedNewSubjectId) {
      if (newBlockScope === 'until_finished') {
        if (addScheduleExtension) {
          addScheduleExtension({
            fromDate: dateKey,
            subjectId: selectedNewSubjectId,
            mode: 'until_finished'
          });
        }
        toast.success(`"${subjects[selectedNewSubjectId]?.name || 'Disciplina'}" agendada a partir de ${dateKey} até concluir o conteúdo!`);
      } else {
        const updated = [...daySlots, selectedNewSubjectId];
        if (setDayOverride) setDayOverride(dateKey, updated);
        toast.success(`Novo bloco adicionado para o dia ${dateKey}!`);
      }
    } else {
      if (setDayOverride) setDayOverride(dateKey, daySlots);
      toast.success(`Cronograma do dia ${dateKey} atualizado!`);
    }

    setManagingDay(null);
  };

  const handleResetDayToDefault = () => {
    if (!managingDay) return;
    if (removeDayOverride) removeDayOverride(managingDay.dateKey);
    toast.success('Dia restaurado para o padrão do ciclo.');
    setManagingDay(null);
  };

  const openTransitionModal = (sub) => {
    setEditingTransitionSub(sub);
    setTempAction(sub.onCompleteAction || 'double_remaining');
    setTempRepId(sub.replacementSubjectId || '');
  };

  const handleSaveTransition = () => {
    if (!editingTransitionSub) return;
    if (setSubjects) {
      setSubjects(prev => {
        const current = prev[editingTransitionSub.id];
        if (!current) return prev;
        return {
          ...prev,
          [editingTransitionSub.id]: {
            ...current,
            onCompleteAction: tempAction,
            replacementSubjectId: tempAction === 'replace' ? tempRepId : ''
          }
        };
      });
    }
    toast.success(`Regra de transição de "${editingTransitionSub.name}" salva!`);
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
              <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5">Previsão de Fechamento</p>
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

        {/* Cabeçalho do Mês */}
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

                return (
                  <div 
                    key={day} 
                    onClick={() => handleOpenDayManager(cellDateObj, cellDateKey)}
                    className={`min-h-[5.5rem] md:min-h-[7.5rem] p-1 sm:p-1.5 rounded-md flex flex-col transition-all cursor-pointer group hover:ring-2 hover:ring-blue-400 hover:shadow-md ${bgClass}`}
                    title="Clique para gerenciar as matérias e blocos deste dia"
                  >
                    <div className="flex justify-between items-start mb-1 gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs sm:text-sm px-1 group-hover:text-blue-500 transition-colors">{day}</span>
                        {isOverridden && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Dia com programação personalizada" />
                        )}
                        {hasExtensions && (
                          <span className="text-[8px] font-black text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-800" title="3ª Matéria Ativa">
                            +1
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isTodayReal && <span className="text-[9px] sm:text-[10px] font-black bg-blue-500 text-white px-1 sm:px-1.5 py-0.5 rounded-sm">HOJE</span>}
                        <Settings className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
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
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight shrink-0">{sub.dateStr}</span>
                  )}
                </div>

                {sub.remaining > 0 && (
                  <>
                    <div className="flex justify-between items-baseline text-xs mt-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Restam <strong className="text-slate-700 dark:text-slate-200">{sub.remaining} aulas</strong>
                      </span>
                      {sub.remainingAcceleratedMinutes > 0 ? (
                        <div className="text-right">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-xs">
                            ~{Math.round(sub.remainingAcceleratedMinutes / 60)}h
                            {currentSpeed > 1 && <span className="text-[9px] font-bold text-yellow-500 ml-0.5">⚡</span>}
                          </span>
                          {currentSpeed > 1 && (
                            <span className="text-[9px] text-slate-400 block -mt-0.5">
                              (~{Math.round(sub.remainingMinutes / 60)}h normal)
                            </span>
                          )}
                        </div>
                      ) : sub.remainingMinutes > 0 ? (
                        <span className="font-bold text-slate-500 text-xs">
                          (~{Math.round(sub.remainingMinutes / 60)}h)
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 shrink-0">{pct}%</span>
                    </div>
                  </>
                )}

                {/* Transição de Cronograma ao Concluir */}
                <div className="mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                  <div className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                    <RotateCcw className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">
                      Ao fim: <strong className="text-slate-700 dark:text-slate-200">
                        {sub.onCompleteAction === 'replace' && sub.replacementSubjectId && subjects[sub.replacementSubjectId]
                          ? `➔ ${subjects[sub.replacementSubjectId].name}`
                          : sub.onCompleteAction === 'ask'
                            ? 'Perguntar'
                            : 'Dobra Restantes'}
                      </strong>
                    </span>
                  </div>
                  <button
                    onClick={() => openTransitionModal(sub)}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Configurar regra de transição desta matéria no cronograma"
                  >
                    <Settings className="w-2.5 h-2.5" /> Ajustar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Interativo de Gerenciamento do Dia */}
      {managingDay && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[130] p-4 fade-in font-sans">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Gerenciar Dia: {String(managingDay.dateObj.getDate()).padStart(2, '0')}/{String(managingDay.dateObj.getMonth() + 1).padStart(2, '0')}/{managingDay.dateObj.getFullYear()}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    {diasSemana[managingDay.dateObj.getDay()]} • {daySlots.length} Bloco(s) de Estudo
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setManagingDay(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Você pode alterar qualquer matéria deste dia, adicionar um 3º bloco ou definir uma nova matéria para rodar a partir desta data até zerar as aulas.
            </p>

            {/* Lista de Blocos Atuais do Dia */}
            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Matérias Programadas para Este Dia:
              </label>

              {daySlots.map((sId, slotIdx) => {
                const sub = subjects[sId];
                return (
                  <div key={slotIdx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-black text-slate-500 w-5">#{slotIdx + 1}</span>
                      {sub ? (
                        <span className={`text-xs font-black px-2.5 py-1 rounded uppercase tracking-wider ${sub.color}`}>
                          {sub.name}
                        </span>
                      ) : (
                        <span className="text-xs font-black px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-dashed border-slate-700">
                          Vaga em Aberto
                        </span>
                      )}
                    </div>

                    {/* Trocar matéria do bloco */}
                    <div className="flex items-center gap-2">
                      <select
                        value={sId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = [...daySlots];
                          next[slotIdx] = val;
                          setDaySlots(next);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {Object.values(subjects || {}).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const next = daySlots.filter((_, idx) => idx !== slotIdx);
                          setDaySlots(next);
                        }}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remover este bloco"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {daySlots.length === 0 && (
                <div className="p-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 font-bold">
                  Nenhum bloco de estudo agendado para este dia (Dia de Descanso).
                </div>
              )}
            </div>

            {/* Painel para Adicionar Novo Bloco (Ex: 3ª Matéria) */}
            <div className="border border-slate-800 bg-slate-900/50 p-3.5 rounded-xl flex flex-col gap-3 mt-1">
              {!isAddingNewBlock ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNewBlock(true)}
                  className="w-full py-2.5 bg-blue-600/15 hover:bg-blue-600/25 border border-dashed border-blue-500/40 hover:border-blue-400 text-blue-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" /> + Adicionar Nova Matéria (3º Bloco)
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-emerald-400" /> Adicionar Matéria ao Cronograma:
                    </label>
                    <button 
                      onClick={() => setIsAddingNewBlock(false)} 
                      className="text-xs text-slate-500 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <select
                    value={selectedNewSubjectId}
                    onChange={(e) => setSelectedNewSubjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-bold text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Selecione a disciplina --</option>
                    {Object.values(subjects || {}).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.topics?.reduce((acc, t) => acc + (t.total || 0), 0) || 0} aulas)
                      </option>
                    ))}
                  </select>

                  {/* Escopo da Adição */}
                  <div className="flex flex-col gap-2 bg-[#020617] p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Duração desta matéria:</span>
                    
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="newBlockScope"
                        checked={newBlockScope === 'until_finished'}
                        onChange={() => setNewBlockScope('until_finished')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          A partir deste dia em diante (até zerar as aulas)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          A matéria passará a ser estudada diariamente como 3º bloco até concluir 100% das suas aulas.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="newBlockScope"
                        checked={newBlockScope === 'single_day'}
                        onChange={() => setNewBlockScope('single_day')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Apenas neste dia específico
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Válido somente para esta data (ideal para feriados ou dias com mais tempo).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Ações do Rodapé */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={handleSaveDayManager}
                className="w-full sm:flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Salvar Alterações no Calendário
              </button>

              {managingDay.isCustomized && (
                <button
                  type="button"
                  onClick={handleResetDayToDefault}
                  className="w-full sm:w-auto px-3 py-3 text-amber-400 hover:text-amber-300 font-bold text-xs uppercase rounded-xl border border-amber-900/40 hover:bg-amber-950/30 transition-colors cursor-pointer"
                >
                  Restaurar Padrão
                </button>
              )}

              <button
                type="button"
                onClick={() => setManagingDay(null)}
                className="w-full sm:w-auto px-4 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Configuração de Transição no Calendário */}
      {editingTransitionSub && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[130] p-4 fade-in font-sans">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Transição: {editingTransitionSub.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingTransitionSub(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Defina o que o calendário e o ciclo de estudos farão com as vagas de <strong className="text-white">{editingTransitionSub.name}</strong> a partir do dia em que suas aulas forem concluídas.
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Opção 1: Dobrar Restantes */}
              <button
                type="button"
                onClick={() => setTempAction('double_remaining')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  tempAction === 'double_remaining'
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Dobrar Matéria(s) Restante(s)
                  </span>
                  {tempAction === 'double_remaining' && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
                </div>
                <p className="text-[10px] text-slate-400">
                  A vaga será usada para dobrar os estudos das outras matérias ativas (ex: 2 aulas de Física por dia).
                </p>
              </button>

              {/* Opção 2: Nova Disciplina */}
              <button
                type="button"
                onClick={() => setTempAction('replace')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  tempAction === 'replace'
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-emerald-400" /> Substituir por Nova Disciplina
                  </span>
                  {tempAction === 'replace' && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
                </div>
                <p className="text-[10px] text-slate-400">
                  Uma matéria cadastrada da fila assumirá esta vaga no dia seguinte ao término.
                </p>
              </button>

              {/* Seletor quando 'replace' */}
              {tempAction === 'replace' && (
                <div className="bg-[#020617] p-2.5 rounded-lg border border-slate-800 ml-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">
                    Qual disciplina assumirá esta vaga?
                  </label>
                  <select
                    value={tempRepId}
                    onChange={(e) => setTempRepId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Selecione uma matéria cadastrada --</option>
                    {Object.values(subjects || {})
                      .filter(s => s.id !== editingTransitionSub.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.topics?.reduce((acc, t) => acc + (t.total || 0), 0) || 0} aulas)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Opção 3: Perguntar Depois */}
              <button
                type="button"
                onClick={() => setTempAction('ask')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  tempAction === 'ask'
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-400" /> Perguntar na Conclusão
                  </span>
                  {tempAction === 'ask' && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
                </div>
                <p className="text-[10px] text-slate-400">
                  O sistema pausará o bloco no calendário e perguntará quando a última aula for concluída.
                </p>
              </button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={handleSaveTransition}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Salvar e Atualizar Calendário
              </button>
              <button
                type="button"
                onClick={() => setEditingTransitionSub(null)}
                className="px-4 py-2.5 text-slate-400 hover:text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
