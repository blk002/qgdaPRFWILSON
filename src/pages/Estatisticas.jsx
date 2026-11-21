import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import StudyConsistencyHeatmap from '../components/StudyConsistencyHeatmap';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { PieChart, Activity, FastForward, Info, X, StickyNote, Save, BarChart2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

export default function Estatisticas() {
  const { subjects, setSubjects, weeklySprint, userStats, studyHistory = {}, getLocalDateStr, isSyncing, isDarkMode, reviews = [] } = useStore();
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

  const fsrsAuditData = useMemo(() => {
    const result = [];
    
    Object.values(subjects || {}).forEach(sub => {
      const subReviews = reviews.filter(r => r.subjectId === sub.id);
      if (subReviews.length === 0) return;

      const topicsData = [];
      let subTotal = 0;
      let subNovos = 0;
      let subBom = 0;
      let subDificil = 0;
      let subSumStability = 0;
      let subReviewedCount = 0;

      (sub.topics || []).forEach(topic => {
        const topicUpper = String(topic?.name || '').trim().toUpperCase();
        if (!topicUpper) return;
        const topicReviews = subReviews.filter(r => {
          const rTopicUpper = String(r?.topicName || '').trim().toUpperCase();
          if (!rTopicUpper) return false;
          const cleanName = rTopicUpper.replace(/\s*\(AULA\s+\d+\)\s*$/, '').trim();
          return cleanName === topicUpper || rTopicUpper.startsWith(`${topicUpper} (AULA `);
        });

        if (topicReviews.length === 0) return;

        const total = topicReviews.length;
        const novos = topicReviews.filter(r => r.lastReviewDate === null).length;
        const bom = topicReviews.filter(r => r.lastReviewDate !== null && r.lastPerformance >= 0.75).length;
        const dificil = topicReviews.filter(r => r.lastReviewDate !== null && r.lastPerformance < 0.75).length;
        
        const reviewedCount = total - novos;
        const accuracy = reviewedCount > 0 ? Math.round((bom / reviewedCount) * 100) : 0;
        const avgStability = total > 0 ? parseFloat((topicReviews.reduce((acc, r) => acc + (r.stability || 0), 0) / total).toFixed(1)) : 0;

        topicsData.push({
          id: topic.id,
          name: topic.name,
          total,
          novos,
          bom,
          dificil,
          accuracy,
          avgStability
        });

        subTotal += total;
        subNovos += novos;
        subBom += bom;
        subDificil += dificil;
        subSumStability += topicReviews.reduce((acc, r) => acc + (r.stability || 0), 0);
        subReviewedCount += reviewedCount;
      });

      if (subTotal > 0) {
        const subAccuracy = subReviewedCount > 0 ? Math.round((subBom / subReviewedCount) * 100) : 0;
        const subAvgStability = parseFloat((subSumStability / subTotal).toFixed(1));

        result.push({
          id: sub.id,
          name: sub.name,
          color: sub.color,
          total: subTotal,
          novos: subNovos,
          bom: subBom,
          dificil: subDificil,
          accuracy: subAccuracy,
          avgStability: subAvgStability,
          topics: topicsData
        });
      }
    });

    // Inclui também cartões FSRS gerados pelo Projeto Caveira (agrupados por disciplina canônica)
    const caveiraRevs = reviews.filter(r =>
      r.isCaveiraQuestion || r.questionData || String(r.id || '').startsWith('rev_caveira_') || String(r.topicName || '').startsWith('[Caveira')
    );
    const caveiraBySub = {};
    caveiraRevs.forEach(r => {
      const subName = r.customSubjectName || r.questionData?.canonicalSubject || r.questionData?.subject || 'Questões Caveira';
      if (!caveiraBySub[subName]) caveiraBySub[subName] = [];
      caveiraBySub[subName].push(r);
    });

    Object.entries(caveiraBySub).forEach(([subName, revList]) => {
      const total = revList.length;
      const novos = revList.filter(r => r.lastReviewDate === null).length;
      const bom = revList.filter(r => r.lastReviewDate !== null && r.lastPerformance >= 0.75).length;
      const dificil = revList.filter(r => r.lastReviewDate !== null && r.lastPerformance < 0.75).length;
      const reviewedCount = total - novos;
      const accuracy = reviewedCount > 0 ? Math.round((bom / reviewedCount) * 100) : 0;
      const avgStability = total > 0 ? parseFloat((revList.reduce((acc, r) => acc + (r.stability || 0), 0) / total).toFixed(1)) : 0;

      result.push({
        id: 'caveira_audit_' + subName,
        name: `💀 ${subName} (Caveira)`,
        color: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
        total,
        novos,
        bom,
        dificil,
        accuracy,
        avgStability,
        topics: revList.map(r => ({
          id: r.id,
          name: r.topicName,
          total: 1,
          novos: r.lastReviewDate === null ? 1 : 0,
          bom: r.lastReviewDate !== null && r.lastPerformance >= 0.75 ? 1 : 0,
          dificil: r.lastReviewDate !== null && r.lastPerformance < 0.75 ? 1 : 0,
          accuracy: r.lastReviewDate === null ? 0 : Math.round((r.lastPerformance || 0) * 100),
          avgStability: parseFloat((r.stability || 0).toFixed(1))
        }))
      });
    });

    return result;
  }, [subjects, reviews]);

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
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center min-h-[220px] justify-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 dark:text-slate-100">Equilíbrio Operacional</h3>
          {stats.length > 0 ? (
            <div className="w-full h-[210px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <RadarChart cx="50%" cy="50%" outerRadius="78%" data={radarData}>
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
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 text-center">Equilíbrio entre frentes do edital e constância física.</p>
            </div>
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
                      <span className="text-sm font-black text-slate-800 dark:text-white">
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
      <div className="mb-3">
        <StudyConsistencyHeatmap />
      </div>

      {/* Tabela de Auditoria FSRS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-4 sm:p-6 mb-6 text-white">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Auditoria de Memorização FSRS (Questões)
            </h3>
            <p className="text-slate-400 text-[10px] sm:text-xs mt-1 font-bold uppercase tracking-wide">
              Análise detalhada de retenção, estabilidade de memória e novos cards por assunto
            </p>
          </div>
        </div>

        {fsrsAuditData.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle p-4 sm:p-0">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-3 pr-4">Disciplina / Assunto</th>
                    <th className="py-3 px-4 text-center">Total</th>
                    <th className="py-3 px-4 text-center">Desempenho (Bom / Difícil / Novo)</th>
                    <th className="py-3 px-4 text-center w-28 sm:w-36">Distribuição</th>
                    <th className="py-3 px-4 text-right">Taxa de Acerto / Estabilidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {fsrsAuditData.map(sub => {
                    const bomPercent = sub.total > 0 ? Math.round((sub.bom / sub.total) * 100) : 0;
                    const dificilPercent = sub.total > 0 ? Math.round((sub.dificil / sub.total) * 100) : 0;
                    const novosPercent = sub.total > 0 ? Math.round((sub.novos / sub.total) * 100) : 0;

                    return (
                      <React.Fragment key={sub.id}>
                        {/* Linha da Disciplina Principal */}
                        <tr className="bg-slate-800/40 hover:bg-slate-800/60 transition-colors font-bold text-xs text-white">
                          <td className="py-3.5 pr-4 pl-2 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sub.color?.split(' ')[0] || 'bg-slate-500'}`} />
                            <span className="font-black uppercase tracking-tight">{sub.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-slate-300">{sub.total}</td>
                          <td className="py-3.5 px-4 text-center text-[10px] text-slate-400 font-bold">
                            <span className="text-blue-400">{sub.bom}</span> <span className="opacity-40">({bomPercent}%)</span> <span className="opacity-30">/</span>{' '}
                            <span className="text-red-400">{sub.dificil}</span> <span className="opacity-40">({dificilPercent}%)</span> <span className="opacity-30">/</span>{' '}
                            <span className="text-slate-500">{sub.novos}</span> <span className="opacity-40">({novosPercent}%)</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                              {sub.bom > 0 && <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full" style={{ width: `${bomPercent}%` }} title={`Bom: ${bomPercent}%`} />}
                              {sub.dificil > 0 && <div className="bg-red-500 h-full" style={{ width: `${dificilPercent}%` }} title={`Difícil: ${dificilPercent}%`} />}
                              {sub.novos > 0 && <div className="bg-slate-650 h-full" style={{ width: `${novosPercent}%` }} title={`Novo: ${novosPercent}%`} />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black">
                            <span className="text-emerald-400">{sub.accuracy}%</span>{' '}
                            <span className="text-slate-600 font-bold">/</span>{' '}
                            <span className="text-blue-300">{sub.avgStability}d</span>
                          </td>
                        </tr>

                        {/* Linhas dos Assuntos */}
                        {sub.topics.map(topic => {
                          const tBomPercent = topic.total > 0 ? Math.round((topic.bom / topic.total) * 100) : 0;
                          const tDificilPercent = topic.total > 0 ? Math.round((topic.dificil / topic.total) * 100) : 0;
                          const tNovosPercent = topic.total > 0 ? Math.round((topic.novos / topic.total) * 100) : 0;

                          return (
                            <tr key={topic.id} className="hover:bg-slate-800/20 transition-colors text-[10px] sm:text-[11px] text-slate-300 border-t border-slate-800/30">
                              <td className="py-3 pl-6 sm:pl-8 pr-4 font-semibold text-slate-400 italic">
                                ↳ <span className="text-slate-300 not-italic font-bold">{topic.name}</span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-400">{topic.total}</td>
                              <td className="py-3 px-4 text-center text-[10px] text-slate-500 font-semibold">
                                <span className="text-blue-400/90">{topic.bom}</span> <span className="opacity-40">({tBomPercent}%)</span> <span className="opacity-30">/</span>{' '}
                                <span className="text-red-400/90">{topic.dificil}</span> <span className="opacity-40">({tDificilPercent}%)</span> <span className="opacity-30">/</span>{' '}
                                <span className="text-slate-500/90">{topic.novos}</span> <span className="opacity-40">({tNovosPercent}%)</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex border border-slate-800">
                                  {topic.bom > 0 && <div className="bg-blue-500 h-full" style={{ width: `${tBomPercent}%` }} />}
                                  {topic.dificil > 0 && <div className="bg-red-500 h-full" style={{ width: `${tDificilPercent}%` }} />}
                                  {topic.novos > 0 && <div className="bg-slate-700 h-full" style={{ width: `${tNovosPercent}%` }} />}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-400">
                                <span className="text-emerald-500">{topic.accuracy}%</span>{' '}
                                <span className="text-slate-600">/</span>{' '}
                                <span className="text-blue-400">{topic.avgStability}d</span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sem revisões ou questões geradas no FSRS ainda.</p>
            <p className="text-[10px] text-slate-600 font-semibold mt-1">Responda ou importe questões no painel "Raio-X Caveira" para inicializar seus dados de memorização FSRS.</p>
          </div>
        )}
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
                                 <div className="bg-blue-500 h-full rounded-full" style={{ width: `${topic.total > 0 ? Math.min(100, (topic.completed / topic.total) * 100) : 0}%` }}></div>
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
