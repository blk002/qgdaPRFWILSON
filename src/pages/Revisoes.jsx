import { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  BrainCircuit, AlertTriangle, Target as TargetIcon, Clock, Eye, EyeOff, 
  ChevronLeft, ChevronRight, CalendarDays, Layers, CheckCircle, 
  TrendingUp, TrendingDown
} from 'lucide-react';

export default function Revisoes() {
  const [showBacklog, setShowBacklog] = useState(false);
  const {
    reviews,
    reviewStats,
    subjects,
    getThermometer,
    getLocalDateStr,
    getPendingReviews,
    reviewCalendarDate,
    setReviewCalendarDate,
    setReviewModal
  } = useStore();
  
  if (!reviewCalendarDate) return null; // Safety check
  const todayStr = getLocalDateStr();
  const allDueToday = getPendingReviews()
    .sort((a, b) => a.ease - b.ease);
    
  const pendingReviews = allDueToday.slice(0, 4);
  const backlogReviews = allDueToday.slice(4);
  const backlogCount = backlogReviews.length;
  const isProcrastinating = backlogCount > 5;

  const subjectsDueCounts = {};
  allDueToday.forEach(rev => {
    subjectsDueCounts[rev.subjectId] = (subjectsDueCounts[rev.subjectId] || 0) + 1;
  });
  const activeReviewSubjects = Object.entries(subjectsDueCounts)
    .map(([id, count]) => ({ subject: subjects[id], count }))
    .filter(item => item.subject)
    .sort((a, b) => b.count - a.count);

  const perfReviews = reviews.filter(r => r.lastPerformance !== undefined);
  const avgMemoryHealth = perfReviews.length > 0 
    ? Math.round((perfReviews.reduce((acc, r) => acc + r.lastPerformance, 0) / perfReviews.length) * 100) 
    : 0;

  const rYear = new Date(reviewCalendarDate).getFullYear();
  const rMonth = new Date(reviewCalendarDate).getMonth();
  const rDaysInMonth = new Date(rYear, rMonth + 1, 0).getDate();
  const rFirstDayIndex = new Date(rYear, rMonth, 1).getDay();
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const rBlanks = Array(rFirstDayIndex).fill(null);
  const rDays = Array.from({ length: rDaysInMonth }, (_, i) => i + 1);

  return (
    <div className="fade-in max-w-[1400px] px-2 sm:px-4 mx-auto pb-10">
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full shrink-0"><BrainCircuit className="text-red-600 w-6 h-6 sm:w-8 sm:h-8" /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">C.C.R. (Centro de Comando de Retenção)</h2>
            <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">Auditoria do Algoritmo FSRS de Espaçamento.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex-1 min-w-[100px] lg:w-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center dark:bg-slate-950 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Acerto Global</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              {reviewStats.totalDone > 0 ? Math.round((reviewStats.correct / reviewStats.totalDone) * 100) : 0}%
            </p>
          </div>
          <div className="flex-1 min-w-[100px] lg:w-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center dark:bg-slate-950 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" title="Média de todas as revisões feitas">Saúde da Memória</p>
            <p className={`text-xl sm:text-2xl font-black ${avgMemoryHealth >= 80 ? 'text-emerald-500' : avgMemoryHealth >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
              {avgMemoryHealth}%
            </p>
          </div>
          <div className="flex-1 min-w-[100px] lg:w-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center dark:bg-slate-950 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sequência</p>
            <p className="text-xl sm:text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
              🔥 {reviewStats.streak}
            </p>
          </div>
        </div>
      </div>

      {isProcrastinating && (
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-md mb-6 flex items-center justify-between border-2 border-red-800 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-300" />
            <div>
              <h3 className="font-black uppercase tracking-wider text-sm">Multa de Procrastinação Ativada</h3>
              <p className="text-xs text-red-100 mt-0.5">Você acumulou {backlogCount} revisões ignoradas. Suas moedas estão sendo drenadas até que limpe a fila.</p>
            </div>
          </div>
        </div>
      )}

      {pendingReviews.length > 0 ? (
        <>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 dark:text-slate-200">
              <TargetIcon className="w-5 h-5 text-red-500"/> Fila Estratégica de Hoje
            </h3>
            <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
              Restam {allDueToday.length} Cartões
            </span>
          </div>

          {activeReviewSubjects.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 snap-x items-center">
              <div className="flex items-center justify-center px-1 shrink-0" title="Disciplinas na Fila">
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              {activeReviewSubjects.map(({ subject, count }) => (
                <div key={subject.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm shrink-0 snap-start transition-transform hover:scale-105 ${subject.color}`}>
                  <span className="text-[12px] font-black uppercase tracking-wider">{subject.name}</span>
                  <span className="bg-white/40 px-1.5 py-0.5 rounded text-[11px] font-black backdrop-blur-sm border border-white/20 dark:bg-slate-900">{count}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {pendingReviews.map(rev => {
              const sub = subjects[rev.subjectId];
              const thermo = getThermometer(rev.lastPerformance);
              
              return (
                <div key={rev.id} className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors dark:bg-slate-900 dark:border-slate-800">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[11px] sm:text-[13px] font-black px-2 py-1 rounded uppercase ${sub?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {sub?.name}
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`text-[11px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${thermo.color}`} title="Termômetro de Memória">
                          {thermo.icon} {Math.round(rev.lastPerformance * 100 || 0)}%
                        </div>
                        {rev.trend !== 0 && rev.trend !== undefined && (
                          <div className={`flex items-center gap-0.5 text-[9px] font-black uppercase ${rev.trend > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {rev.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {rev.trend > 0 ? 'Melhora' : 'Queda'}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight mb-2 dark:text-slate-100">{rev.topicName}</p>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold bg-slate-50 p-1.5 rounded border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 opacity-70"><Clock className="w-3 h-3"/> Agendamento:</span>
                        <span className="text-blue-600 font-black">{rev.interval} {rev.interval === 1 ? 'dia' : 'dias'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="opacity-70 uppercase text-[8px]">Estabilidade</span>
                        <span className="text-slate-700 dark:text-slate-300 font-black">{rev.stability?.toFixed(1) || 0}d</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setReviewModal(rev)} className="mt-4 w-full py-2.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm">
                    Fazer Questões
                  </button>
                </div>
              );
            })}
          </div>

          {backlogCount > 0 && (
            <div className="mb-8 border border-orange-200 rounded-xl overflow-hidden shadow-sm">
              <div 
                className={`p-3 sm:p-4 flex justify-between items-center cursor-pointer transition-colors ${showBacklog ? 'bg-orange-100' : 'bg-orange-50 hover:bg-orange-100'}`}
                onClick={() => setShowBacklog(!showBacklog)}
              >
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-bold">
                    Você possui {backlogCount} assunto(s) atrasado(s) em espera.
                  </span>
                </div>
                {showBacklog ? <EyeOff className="w-4 h-4 text-orange-600"/> : <Eye className="w-4 h-4 text-orange-600"/>}
              </div>
              
              {showBacklog && (
                <div className="bg-white p-4 border-t border-orange-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 dark:bg-slate-900">
                  {backlogReviews.map(rev => {
                    const sub = subjects[rev.subjectId];
                    return (
                      <div key={rev.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                        <div>
                          <span className="text-[11px] font-black text-slate-500 block uppercase mb-0.5 dark:text-slate-400">{sub?.name}</span>
                          <span className="text-xs font-bold text-slate-800 line-clamp-1 dark:text-slate-100">{rev.topicName}</span>
                        </div>
                        <button onClick={() => setReviewModal(rev)} className="text-[10px] font-bold bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white px-2 py-1.5 rounded transition-colors">
                          Revisar
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500 flex flex-col items-center mb-8 shadow-sm dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
          <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Missões Concluídas!</h3>
          <p className="text-sm mt-1">O seu cérebro está aquecido. Vá para o seu Ciclo avançar o edital.</p>
        </div>
      )}

      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden mt-6">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400"/> Mapeamento FSRS (Heatmap)
          </h3>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{mesesNomes[rMonth]} {rYear}</span>
            <div className="flex gap-1">
              <button onClick={() => setReviewCalendarDate(new Date(rYear, rMonth - 1, 1))} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setReviewCalendarDate(new Date(rYear, rMonth + 1, 1))} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {diasSemana.map(dia => <div key={dia} className="text-center font-black text-slate-500 uppercase tracking-widest text-[9px] sm:text-xs dark:text-slate-400">{dia}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {rBlanks.map((_, i) => <div key={`blank-${i}`} className="min-h-[4rem] sm:min-h-[6rem] bg-slate-800/30 rounded-lg"></div>)}
            {rDays.map(day => {
              const d = new Date(rYear, rMonth, day);
              const dateStr = getLocalDateStr(d);
              const dayRevs = reviews.filter(r => r.nextDateStr === dateStr);
              const isTodayStr = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              
              let heatClass = "bg-slate-800 border-slate-700";
              if (isTodayStr) heatClass = "bg-blue-900/40 border-blue-500 ring-1 ring-blue-500/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]";
              else if (isPast) heatClass = "bg-slate-800/30 border-slate-800 opacity-60";
              else if (dayRevs.length > 8) heatClass = "bg-red-900/20 border-red-800 shadow-[inset_0_0_10px_rgba(220,38,38,0.15)]";
              else if (dayRevs.length > 4) heatClass = "bg-orange-900/20 border-orange-800/60";

              return (
                <div key={day} className={`min-h-[4.5rem] sm:min-h-[6rem] p-1.5 sm:p-2 rounded-lg flex flex-col border transition-all ${heatClass}`}>
                  <div className="flex justify-between items-start mb-1 gap-1">
                    <span className={`font-black text-[10px] sm:text-xs ${isTodayStr ? 'text-blue-400' : isPast ? 'text-slate-500' : 'text-slate-300'}`}>{day}</span>
                    {dayRevs.length > 0 && (
                      <span className={`text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm ${isPast ? 'bg-slate-700 text-slate-400' : dayRevs.length > 8 ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
                        {dayRevs.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-0.5 mt-auto overflow-hidden">
                    {(() => {
                      if (dayRevs.length === 0) return null;
                      const subjectCounts = {};
                      dayRevs.forEach(r => {
                        subjectCounts[r.subjectId] = (subjectCounts[r.subjectId] || 0) + 1;
                      });
                      
                      const items = Object.entries(subjectCounts).map(([subId, count]) => {
                        const sub = subjects[subId];
                        return sub ? { name: sub.name, color: sub.color || 'bg-slate-100 text-slate-600', count } : null;
                      }).filter(Boolean);

                      return (
                        <>
                          {items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between text-[9px] sm:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm leading-none mb-0.5 ${item.color}`} title={`${item.name} (${item.count} resoluções)`}>
                              <span className="truncate flex-1 uppercase">{item.name}</span>
                              <span className="shrink-0 ml-1 opacity-70">({item.count})</span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <span className="text-[7px] font-bold text-slate-500 ml-3 dark:text-slate-400">+{items.length - 3}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
