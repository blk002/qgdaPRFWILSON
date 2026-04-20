import React from 'react';
import { useStore } from '../store/useStore';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import { Activity, Trophy, Clock, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';


export default function Dashboard() {
  const { 
    userStats, 
    coins, 
    user,
    getCurrentPatente, 
    getEstimatedCompletionDate,
    getSubjectEstimates,
    weeklyMissions = [],
    seasonalData = {},
    claimMissionReward
  } = useStore();

  const enrollmentId = `PRF-${(user?.id || 'ANON').slice(-6).toUpperCase()}`;

  const patenteAtual = getCurrentPatente();
  const nextPatente = PATENTES[PATENTES.indexOf(patenteAtual) + 1] || null;
  const progressToNext = nextPatente ? ((userStats.xp - patenteAtual.minXp) / (nextPatente.minXp - patenteAtual.minXp)) * 100 : 100;

  const estimatedDate = getEstimatedCompletionDate();
  const subjectEstimates = getSubjectEstimates();

  return (
    <div className="fade-in max-w-[1200px] mx-auto pb-10 px-4">
      {/* Banner de Previsão de Edital */}
      <div className={`p-4 sm:p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-l-8 transition-all ${estimatedDate.isLate ? 'bg-red-50 border-red-600 dark:bg-red-900/10' : 'bg-blue-50 border-blue-600 dark:bg-blue-900/10'}`}>
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-full ${estimatedDate.isLate ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {estimatedDate.isLate ? <AlertTriangle className="w-8 h-8 animate-pulse" /> : <Clock className="w-8 h-8" />}
           </div>
           <div>
              <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Previsão de Conclusão do Edital</p>
               <div className="flex-1 min-w-0">
                 <h2 className={`text-xl sm:text-2xl font-black whitespace-nowrap overflow-visible ${estimatedDate.isLate ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>{estimatedDate.full}</h2>
               </div>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">Prova: {estimatedDate.examDateFormatted}</span>
                 {estimatedDate.isLate && <span className="text-[10px] font-black text-red-500 dark:text-red-400">⚠️ {estimatedDate.daysDiff} DIAS DE ATRASO</span>}
              </div>
           </div>
        </div>
        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
           <span className="text-[10px] font-black text-slate-400 uppercase mb-2">Aproveitamento Global</span>
           <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100">
                {Math.round((subjectEstimates.filter(s => s.remaining === 0).length / subjectEstimates.length) * 100) || 0}
              </span>
              <span className="text-lg font-bold text-slate-400">%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temporada e Missões */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-2xl p-6 border-b-4 border-blue-600 shadow-2xl relative overflow-hidden mb-2">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg ring-4 ring-blue-500/20">
                    <Trophy className="w-8 h-8" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Temporada {seasonalData?.currentSeason || 1}</p>
                    <h2 className="text-2xl font-black text-white">{seasonalData?.seasonName || "Carregando..."}</h2>
                 </div>
              </div>
              
              <div className="flex-1 w-full max-w-2xl">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Progresso de Temporada</span>
                  <span className="text-xs font-black text-blue-400">{seasonalData?.seasonXp || 0} / {seasonalData?.seasonGoalXp || 5000} XP</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-4 p-1 border border-slate-700">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, ((seasonalData?.seasonXp || 0) / (seasonalData?.seasonGoalXp || 5000)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-slate-500 uppercase">Expira em</p>
                <p className="text-sm font-black text-white">
                  {(() => {
                    const { getTodayDate } = useStore.getState();
                    const end = new Date(seasonalData?.endDate);
                    const today = getTodayDate();
                    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                    return diff > 0 ? `${diff} Dias` : 'Finalizada';
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Status do Combatente */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-8 border-2 border-slate-800 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <div className="text-6xl mb-4 drop-shadow-lg">{patenteAtual.icon}</div>
            <h2 className={`text-2xl font-black uppercase tracking-widest mb-1 ${patenteAtual.color}`}>{patenteAtual.name}</h2>
            <div className="flex flex-col items-center gap-1 mb-6">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Matrícula Operacional</span>
              <span className="text-slate-400 text-xs font-mono font-bold px-3 py-0.5 bg-slate-800/50 rounded-full border border-slate-700/50">{enrollmentId}</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end text-xs font-black uppercase">
                <span className="text-slate-400">Progresso de Carreira</span>
                <span className="text-white">{userStats.xp.toLocaleString()} XP</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700 overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${progressToNext}%` }}></div>
              </div>
              {nextPatente && (
                <p className="text-[10px] text-slate-500 font-bold uppercase">Faltam {(nextPatente.minXp - userStats.xp).toLocaleString()} XP para {nextPatente.name}</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Estatísticas Virtuais
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Patrimônio</span>
                <span className="text-lg font-black text-yellow-500">{coins} <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Moedas</span></span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Missões Semanais</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">4 Ativas</span>
            </h3>
            <div className="space-y-4">
              {weeklyMissions?.map((mission) => (
                <div key={mission.id} className={`p-3 rounded-xl border transition-all ${mission.claimed ? 'bg-slate-50 border-slate-100 opacity-60 dark:bg-slate-950 dark:border-slate-900' : mission.completed ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50' : 'bg-white border-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800'}`}>
                   <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`text-xs font-black uppercase tracking-tighter ${mission.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-100'}`}>{mission.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold leading-none mt-0.5">{mission.description}</p>
                      </div>
                      {mission.completed && !mission.claimed && (
                        <button onClick={() => claimMissionReward(mission.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-2 py-1 rounded shadow-md animate-pulse transition-all">RESGATAR</button>
                      )}
                      {mission.claimed && (
                        <span className="text-emerald-600"><CheckCircle className="w-4 h-4" /></span>
                      )}
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className={`${mission.completed ? 'bg-emerald-500' : 'bg-blue-500'} h-full transition-all duration-700`} style={{ width: `${(mission.current / mission.goal) * 100}%` }}></div>
                      </div>
                      <span className="text-[9px] font-black text-slate-500">{mission.current}/{mission.goal}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Calendário (Lista de Prazos) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-4 flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-purple-500" /> Próximos Alvos
             </h3>
             <div className="space-y-3">
               {subjectEstimates.filter(s => s.remaining > 0).slice(0, 3).map(sub => (
                 <div key={sub.id} className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${sub.color}`}>{sub.name}</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{sub.dateStr}</span>
                 </div>
               ))}
               <p className="text-[10px] text-slate-400 text-center uppercase font-black mt-2">Veja cronograma completo na aba Calendário</p>
             </div>
          </div>
        </div>

        {/* Galeria de Honra (Medalhas) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" /> Galeria de Honra
              </h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase dark:bg-blue-900/30 dark:text-blue-400">
                {userStats.medals.length} / {MEDALHAS.length} Conquistas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {MEDALHAS.map(medal => {
                const unlocked = userStats.medals.includes(medal.id);
                return (
                  <div key={medal.id} className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-500 ${unlocked ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-900/50' : 'bg-slate-50 border-slate-100 opacity-40 grayscale blur-[0.5px] dark:bg-slate-950 dark:border-slate-900'}`}>
                    <div className={`text-4xl mb-3 ${unlocked ? 'animate-bounce-slow' : ''}`}>{medal.icon}</div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tighter leading-none">{medal.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">{unlocked ? medal.desc : 'Requisito Oculto'}</p>
                  </div>
                );
              })}
            </div>

            {userStats.medals.length === 0 && (
              <div className="mt-12 text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                <p className="text-slate-400 font-bold italic">Nenhuma medalha conquistada ainda. Execute missões de peso para ser condecorado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
