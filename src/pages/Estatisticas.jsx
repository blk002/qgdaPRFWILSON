import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { PieChart, Activity, FastForward, Info, X, StickyNote, Save, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Estatisticas() {
  const { subjects, setSubjects, weeklySprint, userStats } = useStore();
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);

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

  return (
    <div className="fade-in max-w-[1400px] px-2 sm:px-4 mx-auto pb-10">
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

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
         <div className="bg-blue-100 p-3 rounded-full shrink-0"><PieChart className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" /></div>
         <div>
           <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Dashboard de Desempenho</h2>
           <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">Acompanhe seu avanço detalhado por disciplina e assunto.</p>
         </div>
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
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div>
                <div className="flex items-center gap-2 mb-2">
                   <FastForward className="w-5 h-5 text-blue-400" />
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Sprint Semanal: Missão de Elite</h3>
                </div>
                <p className="text-slate-400 text-xs mb-4">Meta de {weeklySprint.goalHours}h semanais. Mantenha a constância para subir de patente.</p>
             </div>
             
             <div className="flex items-center gap-4 mt-auto">
                <div className="flex-1">
                   <div className="flex justify-between items-end mb-1 text-[10px] font-black uppercase tracking-tighter">
                      <span className="text-blue-400">{Math.floor(weeklySprint.currentMinutes / 60)}h cumpridas</span>
                      <span className="text-slate-500">{weeklySprint.goalHours}h meta</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 p-0.5">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${Math.min(100, (weeklySprint.currentMinutes / (weeklySprint.goalHours * 60)) * 100)}%` }}
                      ></div>
                   </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl text-center min-w-[80px]">
                   <span className="text-[10px] font-black text-slate-500 block">STATUS</span>
                   <span className="text-xs font-black text-white">{(weeklySprint.currentMinutes / (weeklySprint.goalHours * 60)) >= 1 ? '🥇 CUMPRIDA' : '⚡ EM CURSO'}</span>
                </div>
             </div>

             <div className="mt-6 flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Saldo XP</span>
                  <span className="text-2xl font-black text-white">{userStats.xp.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1 bg-blue-500 text-white rounded text-[10px] font-black">NAVY SEAL STATUS</div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-around gap-6 p-6 sm:p-8 dark:bg-slate-900 dark:border-slate-800">
        {renderCircularChart(overallProgress, 'Avanço', `${overallProgress}%`, 'Edital Global', '#d946ef', '#2563eb')}
        {renderCircularChart(overallProgress, 'Aulas', `${completedEdital}`, `de ${totalEdital || 0} Teóricas`, '#10b981', '#0ea5e9')}
        {renderCircularChart(subjectsPercent, 'Concluídas', `${subjectsFinished}`, `de ${stats.length} Matérias`, '#f59e0b', '#ef4444')}
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
