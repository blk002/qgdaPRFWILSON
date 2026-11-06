import React from 'react';
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
  Target
} from 'lucide-react';
import { formatMinutesToFriendly } from '../lib/durationHelpers';

export default function Calendario() {
  const {
    subjects,
    cycle,
    currentDayIndex,
    completedToday,
    calendarDate,
    setCalendarDate,
    getSubjectEstimates,
    getEstimatedCompletionDate,
    subjectTimeGoal
  } = useStore();
  
  if (!calendarDate) return null;

  const subjectEstimates = getSubjectEstimates();
  const estimatedDate = getEstimatedCompletionDate();

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

  Object.values(subjects).forEach(sub => {
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

    // Adiciona extensões de matérias ativas a partir de uma data específica (3ª matéria até zerar)
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

      // Se a matéria original esgotou suas aulas, verificar a regra de transição pré-configurada
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
          // Busca uma matéria com aulas pendentes (primeiro no próprio dia, depois em qualquer matéria da fila)
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



  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6 w-full pb-10 fade-in">
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        
        <div className={`text-white p-4 md:p-5 rounded-xl shadow-md mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${estimatedDate.isLate ? 'bg-red-600 animate-pulse border border-red-800' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full shrink-0 dark:bg-slate-900">
              {estimatedDate.isLate ? <AlertTriangle className="text-yellow-300 w-6 h-6 md:w-8 md:h-8" /> : <Trophy className="text-yellow-300 w-6 h-6 md:w-8 md:h-8" />}
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

        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
            <CalendarIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" /> {mesesNomes[month]} {year}
          </h2>
          <div className="flex gap-1 sm:gap-2">
            <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:bg-slate-950 dark:border-slate-800"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:bg-slate-950 dark:border-slate-800"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="min-w-[500px] sm:min-w-0">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {diasSemana.map(dia => <div key={dia} className="text-center font-bold text-slate-400 text-xs sm:text-sm">{dia}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {blanks.map((_, i) => <div key={`blank-${i}`} className="min-h-[5rem] md:min-h-[7rem] bg-slate-50/50 rounded-md sm:rounded-lg dark:bg-slate-950"></div>)}
              {days.map(day => {
                const cellDateObj = new Date(year, month, day);
                const cellTime = cellDateObj.getTime();
                const todayTime = todayDateObj.getTime();
                const diffDays = Math.round((cellTime - todayTime) / (1000 * 60 * 60 * 24));
                const isTodayReal = diffDays === 0;
                const isPast = diffDays < 0;

                let bgClass = isPast ? "bg-slate-50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-500" : isTodayReal ? "bg-blue-50 border-2 border-blue-500 shadow-sm text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300" : "bg-white border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300";
                
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
