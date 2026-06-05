import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { PieChart, Activity, FastForward, Info, X, StickyNote, Save, BarChart2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

export default function Estatisticas() {
  const { subjects, setSubjects, weeklySprint, userStats, studyHistory = {}, getLocalDateStr, isSyncing, isDarkMode } = useStore();
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
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

  const heatmapDataObj = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 52 weeks ago
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // Shift back to Sunday
    startDate.setHours(0, 0, 0, 0);

    const days = [];
    const weeks = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 371; i++) {
      const d = new Date(currentDate);
      days.push(d);
      if (i % 7 === 0) {
        weeks.push(d); // Store the Sunday of each week
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return { days, weeks };
  }, []);

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
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center p-2">
        <div className="relative flex flex-col items-center justify-center group hover:scale-105 transition-transform duration-300">
          <svg className="transform -rotate-90 w-32 h-32 sm:w-40 sm:h-40 drop-shadow-md" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorStart} />
                <stop offset="100%" stopColor={colorEnd} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200" />
            <circle 
              cx="60" cy="60" r={radius} 
              stroke={`url(#grad-${label.replace(/\s+/g, '')})`} 
              strokeWidth="12" fill="transparent" 
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              className="transition-all duration-1000 ease-out" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
            <span className="text-3xl sm:text-4xl font-black text-slate-800 leading-none tracking-tighter dark:text-slate-100">{valueText}</span>
          </div>
        </div>
        {subText && <span className="text-[10px] font-bold text-slate-500 mt-4 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800">{subText}</span>}
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
      {editingNotes && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StickyNote className="text-blue-500 w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-wider italic">Caderno de Erros</h3>
              </div>
              <button onClick={() => setEditingNotes(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">{subjects[editingNotes.subjectId]?.name} • {editingNotes.topicName}</p>
              <textarea 
                autoFocus
                value={editingNotes.content}
                onChange={(e) => setEditingNotes({...editingNotes, content: e.target.value})}
                placeholder="Anote aqui as pegadinhas e pontos críticos deste assunto..." 
                className="w-full h-48 p-4 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all shadow-inner bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800"
              />
              <div className="flex justify-end gap-3 mt-5">
                <button 
                  onClick={() => setEditingNotes(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setSubjects(prev => {
                      const newSubjects = { ...prev };
                      const topics = [...newSubjects[editingNotes.subjectId].topics];
                      const idx = topics.findIndex(t => t.id === editingNotes.topicId);
                      if (idx !== -1) {
                        topics[idx] = { ...topics[idx], notes: editingNotes.content };
                      }
                      newSubjects[editingNotes.subjectId].topics = topics;
                      return newSubjects;
                    });
                    setEditingNotes(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" /> Salvar Notas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-800">
         <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full shrink-0"><PieChart className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" /></div>
            <div>
               <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard de Desempenho</h2>
               <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">Acompanhe seu avanço detalhado por disciplina e assunto.</p>
            </div>
         </div>
         <button
           onClick={() => window.print()}
           className="no-print bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 justify-center cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 hover:border-transparent dark:hover:border-transparent"
         >
           <Printer className="w-4 h-4 text-blue-400" />
           <span>Gerar Relatório (PDF)</span>
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center min-h-[300px] justify-center">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 dark:text-slate-100">Equilíbrio Operacional</h3>
          {stats.length > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Evolução"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 text-center">O radar mostra seu equilíbrio entre as frentes do edital e constância física.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <BarChart2 className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sem dados para análise radar</p>
            </div>
          )}
        </div>

         <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Activity className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 h-full justify-between">
             {/* Left Column: Description & Status */}
             <div className="flex-1 space-y-4">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <FastForward className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Sprint Semanal: Missão de Elite</h3>
                   </div>
                   <p className="text-slate-400 text-xs leading-relaxed">Meta de {weeklySprint.goalHours}h semanais. Mantenha a constância para subir de patente.</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-xl min-w-[100px]">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Realizado</span>
                      <span className="text-sm font-black text-blue-400">{Math.floor(weeklySprint.currentMinutes / 60)}h {(weeklySprint.currentMinutes % 60)}min</span>
                   </div>
                   <div className="bg-slate-800/80 border border-slate-700/50 p-3 rounded-xl min-w-[100px]">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Status</span>
                      <span className="text-sm font-black text-white">
                         {(weeklySprint.currentMinutes / (weeklySprint.goalHours * 60)) >= 1 ? '🥇 CUMPRIDA' : '⚡ EM CURSO'}
                      </span>
                   </div>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black uppercase text-slate-400">Saldo XP</span>
                     <span className="text-xl font-black text-white">{userStats.xp.toLocaleString()}</span>
                   </div>
                   <div className="px-2.5 py-1 bg-blue-500 text-white rounded text-[9px] font-black">NAVY SEAL STATUS</div>
                </div>
             </div>

             {/* Right Column: Circular SVG Progress Ring */}
             <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative w-32 h-32 flex items-center justify-center">
                   <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                      <circle 
                         cx="50" cy="50" r="40" 
                         stroke="#3b82f6" 
                         strokeWidth="8" 
                         fill="transparent" 
                         strokeDasharray={2 * Math.PI * 40} 
                         strokeDashoffset={(2 * Math.PI * 40) - (Math.min(100, sprintProgress) / 100) * (2 * Math.PI * 40)} 
                         strokeLinecap="round" 
                         className="transition-all duration-1000 ease-out" 
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-white">{Math.round(sprintProgress)}%</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase">Meta</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-around gap-6 p-6 sm:p-8 dark:bg-slate-900 dark:border-slate-800">
        {renderCircularChart(overallProgress, 'Avanço', `${overallProgress}%`, 'Edital Global', '#d946ef', '#2563eb')}
        {renderCircularChart(overallProgress, 'Aulas', `${completedEdital}`, `de ${totalEdital || 0} Teóricas`, '#10b981', '#0ea5e9')}
        {renderCircularChart(subjectsPercent, 'Concluídas', `${subjectsFinished}`, `de ${stats.length} Matérias`, '#f59e0b', '#ef4444')}
      </div>

      {/* Gráfico de Evolução de Estudos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Evolução Temporal dos Estudos
            </h3>
            <p className="text-slate-500 text-xs mt-1 dark:text-slate-400 font-bold uppercase tracking-wide">
              Análise de rendimento e horas acumuladas por período
            </p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner no-print">
            {[7, 15, 30].map(days => (
              <button
                key={days}
                onClick={() => setChartDays(days)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  chartDays === days 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {days} Dias
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
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
      <div className="bg-white dark:bg-slate-900/60 dark:border-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-lg p-6 mb-6 transition-all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Consistência de Estudos (Últimos 12 Meses)
            </h3>
            <p className="text-slate-500 text-xs mt-1 dark:text-slate-400 font-bold uppercase tracking-wide">
              Visualização diária da sua dedicação operacional à PRF
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-black bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 uppercase tracking-wider">
              {Math.round(Object.values(studyHistory).reduce((acc, val) => acc + val, 0) / 60)} horas totais
            </span>
          </div>
        </div>

        <div className="flex items-start">
          {/* Rótulos dos dias da semana (Seg, Qua, Sex) */}
          <div 
            className="grid gap-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none pr-3 text-right shrink-0"
            style={{ 
              gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
              paddingTop: '68px',
              height: '202px'
            }}
          >
            <div className="h-3.5 flex items-center justify-end"></div>
            <div className="h-3.5 flex items-center justify-end">Seg</div>
            <div className="h-3.5 flex items-center justify-end"></div>
            <div className="h-3.5 flex items-center justify-end">Qua</div>
            <div className="h-3.5 flex items-center justify-end"></div>
            <div className="h-3.5 flex items-center justify-end">Sex</div>
            <div className="h-3.5 flex items-center justify-end"></div>
          </div>

          {/* Container rolável com o gráfico de consistência */}
          <div className="flex-1 overflow-x-auto custom-scrollbar pb-2 scroll-smooth">
            <div className="w-max pt-12 pr-6 pl-3">
              {/* Linha dos meses alinhada de forma absoluta para evitar sobreposição */}
              <div className="relative h-3.5 mb-1.5 select-none w-full">
                {heatmapDataObj.weeks.map((weekStart, colIdx) => {
                  const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                  const isFirstWeekOfMonth = colIdx === 0 || 
                    heatmapDataObj.weeks[colIdx].getMonth() !== heatmapDataObj.weeks[colIdx - 1].getMonth();
                  
                  if (!isFirstWeekOfMonth) return null;

                  // Cada coluna tem largura w-3.5 (14px) + gap-1.5 (6px) = 20px
                  const leftPos = colIdx * 20;

                  return (
                    <div 
                      key={colIdx} 
                      className="absolute text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left"
                      style={{ left: `${leftPos}px` }}
                    >
                      {mesesAbreviados[weekStart.getMonth()]}
                    </div>
                  );
                })}
              </div>

              {/* Grade de quadradinhos (371 células: 7 linhas x 53 colunas) */}
              <div 
                className="grid grid-flow-col gap-1.5"
                style={{ 
                  gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
                  height: '134px'
                }}
              >
                {heatmapDataObj.days.map((cellDate, idx) => {
                  const dateStr = getLocalDateStr(cellDate);
                  const minutes = studyHistory[dateStr] || 0;
                  const isFuture = cellDate > new Date();

                  let heatClass = "bg-slate-200/50 border-slate-300/10 dark:bg-slate-800/40 dark:border-slate-700/10";
                  if (isFuture) {
                    heatClass = "bg-slate-100/10 border-dashed border-slate-200/5 dark:bg-slate-800/5 dark:border-slate-700/5 opacity-15 pointer-events-none";
                  } else if (minutes > 0 && minutes <= 30) {
                    heatClass = "bg-blue-500/15 border-transparent";
                  } else if (minutes > 30 && minutes <= 60) {
                    heatClass = "bg-blue-500/35 border-transparent";
                  } else if (minutes > 60 && minutes <= 120) {
                    heatClass = "bg-blue-500/65 border-transparent";
                  } else if (minutes > 120) {
                    heatClass = "bg-gradient-to-br from-blue-400 to-indigo-500 border-transparent shadow-[0_0_10px_rgba(59,130,246,0.3)]";
                  }

                  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                  const monthName = mesesNomes[cellDate.getMonth()];
                  const dayName = cellDate.getDate();

                  const colIdx = Math.floor(idx / 7);
                  let tooltipAlignClass = "left-1/2 -translate-x-1/2";
                  if (colIdx < 5) {
                    tooltipAlignClass = "left-0";
                  } else if (colIdx > 47) {
                    tooltipAlignClass = "right-0 left-auto";
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all group/cell relative cursor-default hover:scale-110 hover:z-30 ${heatClass}`}
                    >
                      {/* Tooltip Premium */}
                      {!isFuture && (
                        <div className={`absolute bottom-full ${tooltipAlignClass} mb-2.5 w-max bg-slate-950/95 backdrop-blur-md text-white text-[10.5px] font-semibold py-2 px-3.5 rounded-xl opacity-0 pointer-events-none group-hover/cell:opacity-100 transition-all duration-200 translate-y-1 group-hover/cell:translate-y-0 z-50 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-slate-800/80 text-center`}>
                          <p className="text-slate-200 font-bold">{dayName} de {monthName} de {cellDate.getFullYear()}</p>
                          <p className="text-blue-400 font-extrabold mt-0.5">{minutes > 0 ? `⚡ ${minutes} min estudados` : '💤 Nenhum estudo registrado'}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legenda de intensidades */}
        <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <span>Menos</span>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-slate-200/50 dark:bg-slate-800/40 border border-slate-300/10 dark:border-slate-700/10"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500/15"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500/35"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500/65"></div>
          <div className="w-3.5 h-3.5 rounded-[3px] bg-gradient-to-br from-blue-400 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
          <span>Mais</span>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map(sub => (
          <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-blue-300 dark:hover:border-blue-700">
             <div onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)} className="p-4 sm:p-5 flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] ${sub.color} shadow-sm group-hover:scale-110 transition-transform p-1 text-center leading-none`}>
                     {sub.name.substring(0, 3).toUpperCase()}
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{sub.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                         <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${sub.progress}%` }}></div>
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">{sub.progress}% Concluído</span>
                      </div>
                   </div>
                </div>
                {expandedSubject === sub.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
             </div>
             
             {expandedSubject === sub.id && (
               <div className="p-4 sm:p-5 pt-0 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                     {sub.topics.map(topic => (
                        <div key={topic.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                           <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm leading-tight">{topic.name}</span>
                              <div className="bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">
                                {topic.completed} / {topic.total} aulas
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1 rounded-full">
                                 <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(topic.completed / topic.total) * 100}%` }}></div>
                              </div>
                              <button 
                                onClick={() => {
                                  setEditingNotes({
                                    subjectId: sub.id,
                                    topicId: topic.id,
                                    topicName: topic.name,
                                    content: topic.notes || ''
                                  });
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group/btn"
                              >
                                <StickyNote className={`w-4 h-4 ${topic.notes ? 'text-blue-500' : 'text-slate-300 group-hover/btn:text-slate-400'}`} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}
