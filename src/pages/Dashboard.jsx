import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import RankBadge from '../components/RankBadge';
import { 
  Activity, Trophy, Clock, AlertTriangle, CheckCircle, Coins, 
  Flame, ShieldCheck, Target, Pencil, Check as CheckIcon,
  BookOpen, TrendingUp, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

function XpSparkline({ xpHistory }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','');
    const entry = (xpHistory || []).find(h => h.date === key);
    return { key, label, xp: entry?.xp || 0 };
  });
  const maxXp = Math.max(...days.map(d => d.xp), 1);
  const W = 280, H = 48, padX = 10, padY = 6;
  const barW = (W - padX * 2) / 7 - 4;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" style={{ maxHeight: 80 }}>
        {days.map((day, i) => {
          const barH = Math.max(3, ((day.xp / maxXp) * (H - padY * 2)));
          const x = padX + i * ((W - padX * 2) / 7) + 2;
          const y = H - padY - barH;
          const isToday = i === 6;
          return (
            <g key={day.key}>
              <rect x={x} y={y} width={barW} height={barH} rx={3}
                fill={isToday ? '#3b82f6' : day.xp > 0 ? '#6366f1' : '#1e293b'}
                opacity={day.xp > 0 ? 1 : 0.4} />
              {day.xp > 0 && (
                <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize="6"
                  fill={isToday ? '#93c5fd' : '#818cf8'} fontWeight="bold">{day.xp}</text>
              )}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="7"
                fill={isToday ? '#94a3b8' : '#475569'} fontWeight="bold">{day.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const { 
    userStats, coins, user,
    getCurrentPatente, getEstimatedCompletionDate, getSubjectEstimates,
    weeklyMissions = [], claimMissionReward,
    streakData = { currentStreak: 0 },
    reviewStats = { totalDone: 0, correct: 0, streak: 0 },
    xpHistory = []
  } = useStore();

  const enrollmentId = `PRF-${(user?.id || 'ANON').slice(-6).toUpperCase()}`;
  const patenteAtual = getCurrentPatente();
  const currentLevelIndex = PATENTES.findIndex(p => p.id === patenteAtual.id);
  const nextPatente = PATENTES[currentLevelIndex + 1] || null;
  const progressToNext = nextPatente ? ((userStats.xp - patenteAtual.minXp) / (nextPatente.minXp - patenteAtual.minXp)) * 100 : 100;

  const estimatedDate = getEstimatedCompletionDate();
  const subjectEstimates = getSubjectEstimates();
  const completionPercent = Math.round((subjectEstimates.filter(s => s.remaining === 0).length / subjectEstimates.length) * 100) || 0;

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userStats.displayName || '');
  const displayName = userStats.displayName || user?.email?.split('@')[0] || 'Combatente';

  const handleSaveName = () => {
    if (tempName.trim()) useStore.setState(s => ({ userStats: { ...s.userStats, displayName: tempName.trim() } }));
    setIsEditingName(false);
  };

  const acertoRate = reviewStats.totalDone > 0 
    ? Math.round((reviewStats.correct / reviewStats.totalDone) * 100) : 0;
  const xpThisWeek = (xpHistory || [])
    .filter(h => { const d = new Date(h.date); const now = new Date(); return (now - d) <= 7 * 86400000; })
    .reduce((sum, h) => sum + h.xp, 0);

  const kpis = [
    { label: 'Ofensiva', value: `${streakData.currentStreak}d`, sub: 'dias consecutivos', icon: Flame, color: 'text-orange-500', bg: 'border-orange-500/20 bg-orange-500/5' },
    { label: 'Revisões', value: reviewStats.totalDone, sub: 'total realizadas', icon: BookOpen, color: 'text-purple-500', bg: 'border-purple-500/20 bg-purple-500/5' },
    { label: 'XP Semana', value: xpThisWeek.toLocaleString(), sub: 'pontos esta semana', icon: Zap, color: 'text-blue-500', bg: 'border-blue-500/20 bg-blue-500/5' },
    { label: 'Acertos', value: `${acertoRate}%`, sub: 'taxa de correção', icon: TrendingUp, color: 'text-emerald-500', bg: 'border-emerald-500/20 bg-emerald-500/5' },
  ];

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10 px-4">
      
      {/* CABEÇALHO */}
      <section className="relative mb-8 mt-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl rounded-3xl -z-10"></div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] relative z-10 bg-slate-800">
               {userStats.avatar ? (
                 <img src={userStats.avatar} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                   <RankBadge level={patenteAtual.level} size={80} />
                 </div>
               )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-2 border-white dark:border-slate-900 z-20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping opacity-20 -z-10"></div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-end gap-2 mb-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={tempName} onChange={e => setTempName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()} autoFocus maxLength={30}
                    className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase bg-transparent border-b-2 border-blue-500 outline-none w-64"
                    placeholder="Seu nome..." />
                  <button onClick={handleSaveName} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all">
                    <CheckIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">{displayName}</h1>
                  <button onClick={() => { setTempName(displayName); setIsEditingName(true); }}
                    className="p-1.5 text-slate-400 hover:text-blue-500 opacity-0 group-hover/name:opacity-100 transition-all rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              <span className={`text-sm font-black px-3 py-1 rounded-lg uppercase tracking-widest bg-slate-100 dark:bg-slate-800 ${patenteAtual.color}`}>{patenteAtual.name}</span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/50">
                <Target className="w-3.5 h-3.5" /> ID: {enrollmentId}
              </div>
              <div className="flex items-center gap-1.5 text-orange-500 font-black text-xs bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/50 animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-current" /> OFENSIVA: {streakData.currentStreak} DIAS
              </div>
            </div>

            <div className="max-w-xl mx-auto md:mx-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Evolução de Carreira</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">{userStats.xp.toLocaleString()} <span className="text-slate-400">XP</span></span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3.5 p-0.5 border border-slate-300 dark:border-slate-700 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 h-full rounded-full relative shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                </motion.div>
              </div>
              {nextPatente && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-wider">Faltam {(nextPatente.minXp - userStats.xp).toLocaleString()} XP para promoção a {nextPatente.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
               <Coins className="text-yellow-600 w-6 h-6 mb-1" />
               <span className="text-2xl font-black text-yellow-700 dark:text-yellow-500 leading-none">{coins}</span>
               <span className="text-[9px] font-black text-yellow-600/70 uppercase mt-1">Moedas</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
               <CheckCircle className="text-emerald-600 w-6 h-6 mb-1" />
               <span className="text-2xl font-black text-emerald-700 dark:text-emerald-500 leading-none">{completionPercent}%</span>
               <span className="text-[9px] font-black text-emerald-600/70 uppercase mt-1">Edital</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI CARDS */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={stagger} initial="hidden" animate="visible">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={fadeUp}
              className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${kpi.bg} p-5 flex flex-col gap-2 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className={`text-3xl font-black leading-none ${kpi.color}`}>{kpi.value}</span>
              <span className="text-[10px] text-slate-400 font-bold">{kpi.sub}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* GRÁFICO XP SEMANAL */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 px-5 py-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-white uppercase text-xs flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-400" /> XP por Dia — Últimos 7 Dias
          </h3>
          <span className="text-[10px] text-slate-500 font-bold">
            Semana: <span className="text-blue-400 font-black">{xpThisWeek.toLocaleString()} XP</span>
          </span>
        </div>
        <XpSparkline xpHistory={xpHistory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA CENTRAL */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-base mb-8 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" /> Jornada de Promoções
            </h3>
            <div className="relative flex justify-between items-center sm:px-4">
               <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
               {PATENTES.map((p, idx) => {
                 const isCompleted = userStats.xp >= p.minXp;
                 const isNext = !isCompleted && PATENTES[idx-1] && userStats.xp >= PATENTES[idx-1].minXp;
                 const isActive = patenteAtual.id === p.id;
                 return (
                   <div key={p.id} className="relative z-10 flex flex-col items-center group">
                      <div className={`transition-all duration-500 ${isActive ? 'scale-125' : isCompleted ? 'scale-100' : 'opacity-30 grayscale saturate-0'}`}>
                        <RankBadge level={p.level} size={48} />
                      </div>
                      <div className="absolute top-full mt-3 text-center w-max">
                        <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight ${isActive ? patenteAtual.color : isCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{p.name.split(' ')[0]}</p>
                      </div>
                      {isNext && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-[7px] font-black text-white px-2 py-0.5 rounded-full animate-pulse">PRÓXIMO</span>}
                   </div>
                 );
               })}
            </div>
            <div className="mt-10 text-center">
               <p className="text-xs font-bold text-slate-500 uppercase">Sua patente atual: <span className={`font-black ${patenteAtual.color}`}>{patenteAtual.name}</span></p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl border-2 border-blue-900/30 p-6 sm:p-8 relative overflow-hidden">
            <h3 className="font-black text-white uppercase text-base mb-6 flex items-center justify-between">
              <span className="flex items-center gap-3"><Activity className="w-6 h-6 text-blue-500" /> Contratos Operacionais da Semana</span>
              <span className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full border border-blue-600/30">ATIVAS</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {weeklyMissions.map(mission => (
                 <div key={mission.id} className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${mission.claimed ? 'bg-slate-950/50 border-slate-800' : mission.completed ? 'bg-blue-900/20 border-blue-600/50 shadow-lg shadow-blue-500/10' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}`}>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className={`w-4 h-4 ${mission.completed ? 'text-blue-400' : 'text-slate-600'}`} />
                          <h4 className={`text-sm font-black uppercase tracking-tight ${mission.completed ? 'text-white' : 'text-slate-400'}`}>{mission.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-bold leading-snug mb-4">{mission.description}</p>
                        <div className="flex items-center gap-3">
                           <div className="text-[10px] font-black text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-600/20">+{mission.xpReward} XP</div>
                           <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500 bg-yellow-600/10 px-2 py-0.5 rounded border border-yellow-600/20">+{mission.coinReward} <Coins className="w-3 h-3" /></div>
                        </div>
                      </div>
                      {mission.completed && !mission.claimed && (
                        <button onClick={() => claimMissionReward(mission.id)}
                          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                          RESGATAR
                        </button>
                      )}
                    </div>
                    {mission.claimed && <div className="absolute top-2 right-2 rotate-12 text-[10px] font-black text-slate-700 border-2 border-slate-700/50 px-2 py-1 rounded">CONCLUÍDO</div>}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
             <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-6 flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-purple-500" /> Vitrine de Honra
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {MEDALHAS.map(medal => {
                  const isUnlocked = userStats.medals.includes(medal.id);
                  return (
                    <div key={medal.id} className={`p-4 rounded-2xl border text-center transition-all hover:scale-[1.03] ${isUnlocked ? 'bg-slate-50 dark:bg-slate-800/30 border-blue-100 dark:border-blue-900/30 shadow-inner' : 'bg-slate-50/50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-40'}`}>
                       <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
                          {isUnlocked ? (
                            <motion.img whileHover={{ scale: 1.15, rotate: 5 }} src={medal.icon} alt={medal.title}
                              className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
                              onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }} />
                          ) : (
                            <div className="text-4xl filter grayscale contrast-0 opacity-20">🛡️</div>
                          )}
                       </div>
                       <p className={`text-[11px] font-black uppercase ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>{medal.title}</p>
                       <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 leading-tight">{medal.desc}</p>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden hover:scale-[1.01] transition-all ${estimatedDate.isLate ? 'bg-red-900/10 border-red-900/30' : 'bg-blue-900/10 border-blue-900/30'}`}>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className={`p-2 rounded-xl ${estimatedDate.isLate ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {estimatedDate.isLate ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status de Edital</span>
                </div>
                <h2 className={`text-2xl font-black mb-1 ${estimatedDate.isLate ? 'text-red-500' : 'text-blue-500'}`}>{estimatedDate.full}</h2>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prova: {estimatedDate.examDateFormatted}</span>
                   {estimatedDate.isLate && <span className="text-[10px] font-black text-red-600 bg-red-600/10 px-2 py-0.5 rounded w-fit uppercase mt-1">⚠️ ATENÇÃO AO CRONOGRAMA</span>}
                </div>
             </div>
             <div className={`absolute -bottom-10 -right-10 w-28 h-28 ${estimatedDate.isLate ? 'text-red-600/10' : 'text-blue-600/10'}`}>
                <Activity className="w-full h-full" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
