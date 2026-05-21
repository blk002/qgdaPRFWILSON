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
  Activity
} from 'lucide-react';

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
    studyHistory
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
  const remainingClasses = {};
  Object.values(subjects).forEach(sub => {
      let rem = 0;
      sub.topics.forEach(t => rem += (t.total - (t.completed || 0)));
      remainingClasses[sub.id] = rem;
  });

  for (let i = 0; i < 365; i++) {
      if (cycle.length === 0) break;
      const cycleIndex = (currentDayIndex + i) % cycle.length;
      const daySubjects = cycle[cycleIndex] || [];
      const scheduledThisDay = [];

      daySubjects.forEach((subId, slotIdx) => {
          if (i === 0 && completedToday.includes(slotIdx)) return;
          if (remainingClasses[subId] > 0) {
              remainingClasses[subId] -= 1;
              const isLast = remainingClasses[subId] === 0;
              scheduledThisDay.push({ id: subId, isLast });
          }
      });
      futureSchedule[i] = scheduledThisDay;
  }

  // --- GitHub Contribution Grid Calculation ---
  const gridDays = [];
  const startDay = new Date();
  startDay.setDate(startDay.getDate() - 364);
  const dayOfWeek = startDay.getDay();
  startDay.setDate(startDay.getDate() - dayOfWeek); // Alinha com o domingo

  for (let i = 0; i < 371; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    gridDays.push(d);
  }

  const monthLabels = [];
  let currentMonth = -1;
  gridDays.forEach((d, index) => {
    if (d.getDay() === 0) {
      const m = d.getMonth();
      if (m !== currentMonth) {
        monthLabels.push({ name: mesesNomes[m].substring(0, 3), colIndex: Math.floor(index / 7) });
        currentMonth = m;
      }
    }
  });

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

                return (
                  <div key={day} className={`min-h-[5rem] md:min-h-[7rem] p-1 sm:p-1.5 rounded-md flex flex-col ${bgClass}`}>
                    <div className="flex justify-between items-start mb-1 gap-0.5">
                      <span className="font-bold text-xs sm:text-sm px-1">{day}</span>
                      {isTodayReal && <span className="text-[9px] sm:text-[10px] font-black bg-blue-500 text-white px-1 sm:px-1.5 py-0.5 rounded-sm">HOJE</span>}
                    </div>
                    
                    {diffDays >= 0 && projectedSubjects.length > 0 && (
                       <div className="flex flex-col gap-0.5 sm:gap-1 pb-1 mt-auto">
                         {projectedSubjects.map((item, idx) => {
                           const sub = subjects[item.id];
                           if(!sub) return null;
                           return (
                             <div key={idx} className={`flex items-center justify-between text-[10px] sm:text-[12px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm leading-tight mb-0.5 ${sub.color}`}>
                               <span className="truncate flex-1">{sub.name}</span>
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

        {/* Gráfico de Consistência Anual (Estilo GitHub) */}
        <div className="mt-8 border-t border-slate-150 pt-6 dark:border-slate-800/80">
           <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4 dark:text-slate-350">
              <Activity className="w-4 h-4 text-purple-500" /> Registro Anual de Consistência
           </h3>
           
           <div className="flex gap-3 items-end">
              {/* Rótulos dos dias da semana */}
              <div className="flex flex-col justify-between text-[9px] font-bold text-slate-400 h-[84px] pb-1 select-none">
                 <span>Seg</span>
                 <span>Qua</span>
                 <span>Sex</span>
              </div>
              
              <div className="flex-1 overflow-x-auto scrollbar-thin">
                 {/* Rótulos dos meses */}
                 <div className="relative h-4 text-[9px] font-black text-slate-400 uppercase mb-1 select-none" style={{ minWidth: `${53 * 14}px` }}>
                    {monthLabels.map((lbl, idx) => (
                      <span
                        key={idx}
                        className="absolute"
                        style={{ left: `${lbl.colIndex * 14}px` }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                 </div>
                 
                 {/* O Grid das 52 semanas */}
                 <div className="grid grid-flow-col grid-rows-7 gap-[2px]" style={{ minWidth: `${53 * 14}px`, gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                    {gridDays.map((d, index) => {
                      const dateStr = d.toISOString().split('T')[0];
                      const mins = studyHistory[dateStr] || 0;
                      
                      let bg = "bg-slate-100 dark:bg-slate-800/85";
                      if (mins > 0 && mins < 30) bg = "bg-purple-100 dark:bg-purple-950/60";
                      else if (mins >= 30 && mins < 60) bg = "bg-purple-300 dark:bg-purple-800/60";
                      else if (mins >= 60 && mins < 120) bg = "bg-purple-500 dark:bg-purple-600";
                      else if (mins >= 120) bg = "bg-purple-700 dark:bg-purple-400";

                      const formattedDate = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
                      const tooltipText = `${formattedDate} • ${mins}m estudados`;

                      return (
                        <div
                          key={index}
                          className={`w-[11px] h-[11px] rounded-[2px] ${bg} transition-all duration-150 hover:scale-125 cursor-pointer relative group/cell`}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/cell:flex flex-col items-center z-50 pointer-events-none">
                            <div className="bg-slate-950 text-white text-[9px] font-black py-1 px-2 rounded shadow-md whitespace-nowrap">
                              {tooltipText}
                            </div>
                            <div className="w-1 h-1 bg-slate-950 rotate-45 -mt-[2px]" />
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
           </div>
           
           {/* Legenda de cores */}
           <div className="flex justify-end items-center gap-1.5 mt-3 text-[10px] text-slate-400 font-bold select-none">
              <span>Menos</span>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-slate-100 dark:bg-slate-800/85" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-purple-100 dark:bg-purple-950/60" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-purple-300 dark:bg-purple-800/60" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-purple-500 dark:bg-purple-600" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-purple-700 dark:bg-purple-400" />
              <span>Mais</span>
           </div>
        </div>
      </div>

      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col shrink-0 mb-8 lg:mb-0 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 dark:text-slate-100 dark:border-slate-800">
          <BookOpen className="text-blue-600 w-5 h-5" /> Fim das Disciplinas
        </h3>
        <div className="flex flex-col gap-3 pr-2">
          {subjectEstimates.map(sub => (
            <div key={sub.id} className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1.5 hover:border-slate-200 transition-colors bg-slate-50/50 dark:bg-slate-950 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider ${sub.color}`}>{sub.name}</span>
                {sub.remaining === 0 ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle className="w-3 h-3" /> Concluído</span>
                ) : (
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{sub.dateStr}</span>
                )}
              </div>
              {sub.remaining > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-400">Restam {sub.remaining} aulas</span>
                  <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden dark:bg-slate-800">
                     <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, 100 - (sub.remaining * 2)))}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
