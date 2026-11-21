import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import StudyConsistencyHeatmap from '../components/StudyConsistencyHeatmap';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { PieChart, FastForward, BarChart2, Printer } from 'lucide-react';

export default function Estatisticas() {
  const { subjects, weeklySprint, userStats, studyHistory = {}, getLocalDateStr, isSyncing, isDarkMode } = useStore();
  const [chartDays, setChartDays] = useState(15);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateStr(d);
      const minutes = studyHistory[dateStr] || 0;
      
      const day = d.getDate().toString().padStart(2, '0');
      const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthLabel = monthsShort[d.getMonth()];
      
      data.push({
        dateKey: dateStr,
        label: `${day}/${monthLabel}`,
        minutes: minutes,
        hours: parseFloat((minutes / 60).toFixed(1))
      });
    }
    return data;
  }, [studyHistory, chartDays, getLocalDateStr]);

  let totalEdital = 0;
  let completedEdital = 0;
  let subjectsFinished = 0;

  let b1C = 0, b1T = 0, b2C = 0, b2T = 0, b3C = 0, b3T = 0;

  const stats = Object.values(subjects || {}).map(sub => {
    let subTotal = 0;
    let subCompleted = 0;
    (sub.topics || []).forEach(t => {
      subTotal += t.total;
      subCompleted += t.completed;
    });
    totalEdital += subTotal;
    completedEdital += subCompleted;
    if (subTotal > 0 && subCompleted === subTotal) subjectsFinished++;

    if (sub.block === 'B1') { b1C += subCompleted; b1T += subTotal; }
    else if (sub.block === 'B2') { b2C += subCompleted; b2T += subTotal; }
    else if (sub.block === 'B3') { b3C += subCompleted; b3T += subTotal; }
    
    return { ...sub, total: subTotal, completed: subCompleted, progress: subTotal === 0 ? 0 : Math.round((subCompleted / subTotal) * 100) };
  }).sort((a, b) => b.progress - a.progress); 

  const b1Percent = b1T === 0 ? 0 : Math.round((b1C / b1T) * 100);
  const b2Percent = b2T === 0 ? 0 : Math.round((b2C / b2T) * 100);
  const b3Percent = b3T === 0 ? 0 : Math.round((b3C / b3T) * 100);

  const overallProgress = totalEdital === 0 ? 0 : Math.round((completedEdital / totalEdital) * 100);
  const subjectsPercent = stats.length === 0 ? 0 : Math.round((subjectsFinished / stats.length) * 100);
  
  const sprintProgress = weeklySprint.goalHours > 0 ? (weeklySprint.currentMinutes / (weeklySprint.goalHours * 60)) * 100 : 0;
  const xpProgress = Math.min(100, (userStats.xp / 10000) * 100);

  const radarData = [
    { subject: 'B1 (Básicas)', A: b1Percent, fullMark: 100 },
    { subject: 'B2 (Trânsito)', A: b2Percent, fullMark: 100 },
    { subject: 'B3 (Direito)', A: b3Percent, fullMark: 100 },
    { subject: 'Sprints', A: sprintProgress, fullMark: 100 },
    { subject: 'XP Total', A: xpProgress, fullMark: 100 },
  ];

  const renderCircularChart = (progress, label, valueText, subText, colorStart, colorEnd) => {
    const radius = 27;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex items-center gap-3 p-2 w-full">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="transform -rotate-90 w-16 h-16" viewBox="0 0 68 68">
            <defs>
              <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorStart} />
                <stop offset="100%" stopColor={colorEnd} />
              </linearGradient>
            </defs>
            <circle cx="34" cy="34" r={radius} stroke="currentColor" strokeWidth="6.5" fill="transparent" className="text-slate-200 dark:text-slate-800" />
            <circle 
              cx="34" cy="34" r={radius} 
              stroke={`url(#grad-${label.replace(/\s+/g, '')})`} 
              strokeWidth="6.5" fill="transparent" 
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out" 
            />
          </svg>
          <span className="absolute text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">{progress}%</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{label}</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight tabular-nums block">{valueText}</span>
          {subText && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">{subText}</span>
          )}
        </div>
      </div>
    );
  };

  if (isSyncing) {
    return (
      <div className="fade-in w-full pb-10 space-y-8 animate-pulse font-sans">
        {/* Skeleton Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/10 h-48 animate-pulse" />
          ))}
        </div>
        
        {/* Skeleton charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/10 h-96 animate-pulse" />
          <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/10 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in w-full pb-10">
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:bg-slate-900 dark:border-slate-800">
         <div className="flex items-center gap-3">
            <div className="bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 p-2 rounded-lg shrink-0"><PieChart className="text-sky-600 dark:text-sky-400 w-5 h-5" /></div>
            <div>
               <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Dashboard de Desempenho</h2>
               <p className="text-slate-500 text-xs dark:text-slate-400">Acompanhe seu avanço detalhado por disciplina e assunto.</p>
            </div>
         </div>
         <button
           onClick={() => window.print()}
           className="no-print bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 justify-center cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
         >
           <Printer className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
           <span>Gerar Relatório (PDF)</span>
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1 dark:text-slate-100">Equilíbrio Operacional</h3>
          {stats.length > 0 ? (
            <>
              <div className="w-full h-[195px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <RadarChart cx="50%" cy="50%" outerRadius="76%" data={radarData}>
                    <PolarGrid stroke={isDarkMode ? '#252C3D' : '#e2e8f0'} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#9CA6BC' : '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Evolução"
                      dataKey="A"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 text-center">Equilíbrio entre frentes do edital e constância física.</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 opacity-50">
              <BarChart2 className="w-9 h-9 text-slate-300 mb-1.5" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sem dados para análise radar</p>
            </div>
          )}
        </div>

         <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 overflow-hidden relative flex flex-col justify-center">
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 justify-between">
             {/* Left Column: Description & Status */}
             <div className="flex-1 space-y-2.5 w-full">
                <div>
                   <div className="flex items-center gap-1.5 mb-1">
                      <FastForward className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Sprint Semanal: Missão de Elite</h3>
                   </div>
                   <p className="text-slate-500 dark:text-slate-400 text-xs leading-snug">Meta de {weeklySprint.goalHours}h semanais para constância de aprovação.</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                   <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 p-2.5 rounded-lg">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Realizado</span>
                      <span className="text-sm font-black text-sky-600 dark:text-sky-400 tabular-nums">{Math.floor(weeklySprint.currentMinutes / 60)}h {(weeklySprint.currentMinutes % 60)}min</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/60 p-2.5 rounded-lg">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Status</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white whitespace-nowrap">
                         {(weeklySprint.currentMinutes / (weeklySprint.goalHours * 60)) >= 1 ? '🥇 CUMPRIDA' : '⚡ EM CURSO'}
                      </span>
                   </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                   <div className="flex items-baseline gap-2">
                     <span className="text-[9px] font-black uppercase text-slate-400">Saldo XP</span>
                     <span className="text-base font-black text-slate-800 dark:text-white tabular-nums">{userStats.xp.toLocaleString()}</span>
                   </div>
                   <div className="px-2 py-0.5 bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 rounded text-[9px] font-black">OPERACIONAL</div>
                </div>
             </div>

             {/* Right Column: Circular SVG Progress Ring */}
             <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative w-24 h-24 flex items-center justify-center">
                   <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                      <circle 
                         cx="50" cy="50" r="40" 
                         stroke="#0ea5e9" 
                         strokeWidth="8" 
                         fill="transparent" 
                         strokeDasharray={2 * Math.PI * 40} 
                         strokeDashoffset={(2 * Math.PI * 40) - (Math.min(100, sprintProgress) / 100) * (2 * Math.PI * 40)} 
                         strokeLinecap="round" 
                         className="transition-all duration-1000 ease-out" 
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{Math.round(sprintProgress)}%</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase">Meta</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 dark:bg-slate-900 dark:border-slate-800">
          {renderCircularChart(overallProgress, 'Avanço', `${overallProgress}%`, 'Edital Global', '#0ea5e9', '#2dd4bf')}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 dark:bg-slate-900 dark:border-slate-800">
          {renderCircularChart(overallProgress, 'Aulas', `${completedEdital}`, `de ${totalEdital || 0} Teóricas`, '#14b8a6', '#38bdf8')}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-1.5 dark:bg-slate-900 dark:border-slate-800">
          {renderCircularChart(subjectsPercent, 'Concluídas', `${subjectsFinished}`, `de ${stats.length} Matérias`, '#f59e0b', '#fb923c')}
        </div>
      </div>

      {/* Gráfico de Evolução de Estudos */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 mb-3 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Evolução Temporal dos Estudos
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5 dark:text-slate-400 font-bold uppercase tracking-wide">
              Análise de rendimento e horas acumuladas por período
            </p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/70 no-print">
            {[7, 15, 30].map(days => (
              <button
                key={days}
                onClick={() => setChartDays(days)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                  chartDays === days 
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {days} Dias
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[210px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartMinutesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--theme-blue-500, #3b82f6)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--theme-blue-500, #3b82f6)" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
              <XAxis 
                dataKey="label" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                unit="m"
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-xl text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{data.dateKey}</p>
                        <p className="text-sm font-black text-blue-400 mt-1">{data.minutes} minutos</p>
                        <p className="text-[10px] text-slate-300 font-medium">({data.hours}h estudadas)</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="minutes" 
                stroke="var(--theme-blue-500, #3b82f6)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#chartMinutesGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mapa de Consistência de Estudos (Heatmap) */}
      <div>
        <StudyConsistencyHeatmap />
      </div>
    </div>
  );
}
