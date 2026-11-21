import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import RankBadge from '../components/RankBadge';
import { assetUrl } from '../lib/assets';
import { 
  Activity, Trophy, Clock, AlertTriangle, CheckCircle, Coins, 
  Flame, ShieldCheck, Target, Pencil, Check as CheckIcon,
  BookOpen, TrendingUp, Zap, X, Lock, Dog, ArrowRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function XpSparkline({ xpHistory }) {
  const { isDarkMode, getLocalDateStr } = useStore();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const key = getLocalDateStr
      ? getLocalDateStr(d)
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','');
    const entry = (xpHistory || []).find(h => h.date === key);
    return { key, label, xp: entry?.xp || 0 };
  });
  const maxXp = Math.max(...days.map(d => d.xp), 1);
  const W = 280, H = 48, padX = 10, padY = 6;
  const barW = (W - padX * 2) / 7 - 4;

  const emptyBarColor = isDarkMode ? '#1e293b' : '#e2e8f0';
  const filledBarColor = isDarkMode ? '#6366f1' : '#4f46e5';
  const todayBarColor = '#3b82f6';

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
                fill={isToday ? todayBarColor : day.xp > 0 ? filledBarColor : emptyBarColor}
                opacity={day.xp > 0 ? 1 : 0.4} />
              {day.xp > 0 && (
                <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize="6"
                  fill={isToday ? '#3b82f6' : '#6366f1'} fontWeight="bold">{day.xp}</text>
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

const ALL_AVATARS = [
  { id: 'male', name: 'Combatente Alpha', path: '/assets/gamification/avatar_male.png', isPremium: false, rarity: 'common' },
  { id: 'female', name: 'Combatente Beta', path: '/assets/gamification/avatar_female.png', isPremium: false, rarity: 'common' },
  { id: 'phoenix', name: 'Guerreiro Phoenix', path: '/assets/gamification/phoenix.png', isPremium: true, rarity: 'legendary', cost: 800 },
  { id: 'sniper', name: 'Atirador Sniper', path: '/assets/gamification/sniper.png', isPremium: true, rarity: 'epic', cost: 500 },
  { id: 'wall', name: 'Muralha Operacional', path: '/assets/gamification/wall.png', isPremium: true, rarity: 'rare', cost: 300 },
  { id: 'investor', name: 'Investidor PRF', path: '/assets/gamification/investor.png', isPremium: true, rarity: 'rare', cost: 400 },
  { id: 'ironman', name: 'Agente de Ferro', path: '/assets/gamification/ironman.png', isPremium: true, rarity: 'legendary', cost: 1000 },
  { id: 'diretor_geral', name: 'Diretor Geral', path: '/assets/gamification/diretor_geral.png', isPremium: true, rarity: 'legendary', cost: 1500 },
];

const RARITY_STYLES = {
  common: { 
    border: 'border-slate-200 dark:border-slate-800', 
    glow: 'hover:shadow-slate-500/10 dark:hover:shadow-slate-500/5', 
    neonGlow: 'hover:border-slate-400 dark:hover:border-slate-600',
    label: 'Comum', 
    labelColor: 'text-slate-400 bg-slate-100 dark:bg-slate-800' 
  },
  uncommon: { 
    border: 'border-emerald-200 dark:border-emerald-950', 
    glow: 'hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10', 
    neonGlow: 'hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)]',
    label: 'Incomum', 
    labelColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' 
  },
  rare: { 
    border: 'border-blue-200 dark:border-blue-950', 
    glow: 'hover:shadow-blue-500/30 dark:hover:shadow-blue-500/15', 
    neonGlow: 'hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.35)]',
    label: 'Raro', 
    labelColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50' 
  },
  epic: { 
    border: 'border-purple-200 dark:border-purple-950', 
    glow: 'hover:shadow-purple-500/40 dark:hover:shadow-purple-500/20', 
    neonGlow: 'hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.45)]',
    label: 'Épico', 
    labelColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50' 
  },
  legendary: { 
    border: 'border-amber-200 dark:border-amber-950', 
    glow: 'hover:shadow-amber-500/50 dark:hover:shadow-amber-500/25', 
    neonGlow: 'hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.55)]',
    label: 'Lendário', 
    labelColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50' 
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const { 
    userStats, coins, user,
    getCurrentPatente, getEstimatedCompletionDate, getSubjectEstimates,
    weeklyMissions = [], claimMissionReward,
    dailyMissions = [], claimDailyMissionReward,
    unlockedAvatars = [], selectAvatar,
    streakData = { currentStreak: 0 },
    getEffectiveStreak,
    todayKey,
    reviewStats = { totalDone: 0, correct: 0, streak: 0 },
    xpHistory = [],
    isSyncing,
    petData,
    subjects = {},
    cycle = [],
    cycleScheduleType = 'weekly',
    cycleWeekStart = 'sunday',
    cycleCarryoverOffset = 0,
    currentDayIndex = 0,
    completedToday: rawCompletedToday = [],
    completedTodayDate,
    calendarOverrides = {},
    futureScheduleRules = [],
    getPendingReviews,
    getLocalDateStr,
    getCycleIndexForDate
  } = useStore();

  useEffect(() => {
    if (!isSyncing) {
      useStore.getState().checkAndResetDailyMissions();
    }
  }, [isSyncing]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userStats?.displayName || '');

  if (isSyncing) {
    return (
      <div className="fade-in w-full pb-10 space-y-6 animate-pulse font-sans">
        {/* Skeleton CABEÇALHO */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6 border border-slate-200 dark:border-slate-800/80 bg-slate-900/10">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-full mt-4" />
          </div>
        </div>

        {/* Skeleton KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-slate-900/10 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/10 h-64 animate-pulse" />
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/10 h-64 animate-pulse" />
          </div>
          {/* Col 2 */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-900/10 h-96 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const enrollmentId = `PRF-${(user?.id || 'ANON').slice(-6).toUpperCase()}`;
  const patenteAtual = getCurrentPatente();
  const currentLevelIndex = PATENTES.findIndex(p => p.id === patenteAtual.id);
  const nextPatente = PATENTES[currentLevelIndex + 1] || null;
  const progressToNext = nextPatente ? ((userStats.xp - patenteAtual.minXp) / (nextPatente.minXp - patenteAtual.minXp)) * 100 : 100;

  const estimatedDate = getEstimatedCompletionDate();
  const subjectEstimates = getSubjectEstimates();
  const completionPercent = Math.round((subjectEstimates.filter(s => s.remaining === 0).length / subjectEstimates.length) * 100) || 0;

  const displayName = userStats?.displayName || user?.email?.split('@')[0] || 'Combatente';

  const handleSaveName = () => {
    if (tempName.trim()) useStore.setState(s => ({ userStats: { ...s.userStats, displayName: tempName.trim() } }));
    setIsEditingName(false);
  };

  const acertoRate = reviewStats.totalDone > 0 
    ? Math.round((reviewStats.correct / reviewStats.totalDone) * 100) : 0;
  const last7DayKeys = new Set(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return useStore.getState().getLocalDateStr(d);
    })
  );
  const xpThisWeek = (xpHistory || [])
    .filter(h => h && last7DayKeys.has(h.date))
    .reduce((sum, h) => sum + (h.xp || 0), 0);

  const effectiveStreak = getEffectiveStreak ? getEffectiveStreak() : (streakData.currentStreak || 0);
  void todayKey;

  const todayDateStr = getLocalDateStr ? getLocalDateStr() : '';
  const todayCompletedSlots = completedTodayDate === todayDateStr ? (rawCompletedToday || []) : [];
  const pendingReviews = getPendingReviews ? getPendingReviews() : [];
  const pendingReviewsCount = pendingReviews.length;

  const todayBlocks = (() => {
    const todayObj = new Date();
    const todayDow = todayObj.getDay();
    const sanitize = (rawSubs) =>
      (rawSubs || [])
        .map((subId, slotIdx) => {
          const sub = subjects?.[subId];
          if (!sub) return null;
          return {
            slotIdx,
            id: subId,
            name: sub.name,
            color: sub.color,
            completed: todayCompletedSlots.includes(slotIdx)
          };
        })
        .filter(Boolean);

    if (calendarOverrides && Array.isArray(calendarOverrides[todayDateStr])) {
      return sanitize(calendarOverrides[todayDateStr]);
    }

    const baseCycleIdx = cycleScheduleType === 'weekly'
      ? (getCycleIndexForDate ? getCycleIndexForDate(todayObj, todayObj) : ((cycleWeekStart === 'monday') ? (todayDow + 6) % 7 : todayDow))
      : (currentDayIndex || 0);

    const shouldShiftCarryover = cycleScheduleType === 'weekly' && (cycleCarryoverOffset || 0) > 0;
    const effectiveCycleIdx = shouldShiftCarryover
      ? ((baseCycleIdx - cycleCarryoverOffset) % 7 + 7) % 7
      : baseCycleIdx;

    const effectiveDateObj = shouldShiftCarryover
      ? new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() - cycleCarryoverOffset)
      : todayObj;
    const effectiveDateStr = shouldShiftCarryover && getLocalDateStr
      ? getLocalDateStr(effectiveDateObj)
      : todayDateStr;

    if (shouldShiftCarryover && calendarOverrides && Array.isArray(calendarOverrides[effectiveDateStr])) {
      return sanitize(calendarOverrides[effectiveDateStr]);
    }

    const effDow = effectiveDateObj.getDay();
    const matchingRules = (futureScheduleRules || [])
      .filter(r => {
        if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effectiveDateStr) return false;
        if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
          return r.dayOfWeek === effDow;
        }
        return r.dayOfWeek === effDow || r.cycleIndex === effectiveCycleIdx;
      })
      .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

    if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
      return sanitize(matchingRules[0].daySlots);
    }

    return sanitize(Array.isArray(cycle?.[effectiveCycleIdx]) ? cycle[effectiveCycleIdx] : []);
  })();

  const completedBlocksCount = todayBlocks.filter(b => b.completed).length;

  const kpis = [
    { label: 'Ofensiva', value: `${effectiveStreak}d`, sub: 'dias consecutivos', icon: Flame, color: 'text-orange-500', glow: 'hover:shadow-orange-500/10 hover:border-orange-500/30' },
    { label: 'Revisões', value: reviewStats.totalDone, sub: 'total realizadas', icon: BookOpen, color: 'text-purple-500', glow: 'hover:shadow-purple-500/10 hover:border-purple-500/30' },
    { label: 'XP Semana', value: xpThisWeek.toLocaleString(), sub: 'pontos esta semana', icon: Zap, color: 'text-blue-500', glow: 'hover:shadow-blue-500/10 hover:border-blue-500/30' },
    { label: 'Acertos', value: `${acertoRate}%`, sub: 'taxa de correção', icon: TrendingUp, color: 'text-emerald-500', glow: 'hover:shadow-emerald-500/10 hover:border-emerald-500/30' },
  ];

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="fade-in w-full pb-10">
      
      {/* CABEÇALHO */}
      <section className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-amber-500/5 blur-2xl rounded-3xl -z-10"></div>
        <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-blue-500/70 ring-4 ring-blue-500/15 shadow-lg relative z-10 bg-slate-800 transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400">
               {userStats.avatar ? (
                 <img src={assetUrl(userStats.avatar)} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                    <RankBadge level={patenteAtual.level} size={80} />
                 </div>
               )}
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                 <span className="text-white text-xs font-black uppercase tracking-wider">Alterar</span>
               </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-slate-900 z-20 group-hover:bg-blue-500 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
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
              <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-widest bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 ${patenteAtual.color}`}>{patenteAtual.name}</span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-5">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-xs bg-slate-100 dark:bg-slate-850 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                <Target className="w-3.5 h-3.5" /> ID: {enrollmentId}
              </div>
              <div className="flex items-center gap-1.5 text-orange-500 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-500/25">
                <Flame className="w-3.5 h-3.5 fill-current" /> OFENSIVA: {effectiveStreak} DIAS
              </div>
            </div>

            <div className="max-w-xl mx-auto md:mx-0">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Evolução de Carreira</span>
                <span className="text-sm font-black tabular-nums text-slate-700 dark:text-slate-200">{userStats.xp.toLocaleString()} <span className="text-slate-400">XP</span></span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-3 p-0.5 border border-slate-300 dark:border-slate-800 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 h-full rounded-full relative">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                </motion.div>
              </div>
              {nextPatente && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-semibold uppercase tracking-wider">Faltam {(nextPatente.minXp - userStats.xp).toLocaleString()} XP para promoção a {nextPatente.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="bg-amber-50/80 dark:bg-slate-950/70 border border-amber-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
               <Coins className="text-amber-500 w-6 h-6 mb-1.5" />
               <span className="text-2xl font-black tabular-nums text-amber-600 dark:text-amber-400 leading-none">{coins}</span>
               <span className="text-[11px] font-bold text-amber-700/70 dark:text-slate-400 uppercase mt-1">Moedas</span>
            </div>
            <div className="bg-emerald-50/80 dark:bg-slate-950/70 border border-emerald-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
               <CheckCircle className="text-emerald-500 w-6 h-6 mb-1.5" />
               <span className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">{completionPercent}%</span>
               <span className="text-[11px] font-bold text-emerald-700/70 dark:text-slate-400 uppercase mt-1">Edital</span>
            </div>
          </div>
        </div>
      </section>

      {/* MISSÃO DE HOJE */}
      <section className="glass-card rounded-xl p-3.5 sm:p-4 mb-4 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">Missão de Hoje</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Prioridades imediatas para hoje</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums uppercase">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Coluna 1: Revisões FSRS */}
          <div className="rounded-lg p-3 bg-slate-50/90 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Revisões FSRS</span>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className={`text-xl sm:text-2xl font-black tabular-nums leading-none ${pendingReviewsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {pendingReviewsCount}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {pendingReviewsCount === 0
                      ? 'Tudo em dia por hoje'
                      : pendingReviewsCount === 1
                        ? 'questão aguardando revisão'
                        : 'questões aguardando revisão'}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                pendingReviewsCount > 0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
              }`}>
                {pendingReviewsCount > 0 ? 'Pendente' : 'Em dia'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {pendingReviewsCount > 0
                  ? 'Elimine sua fila antes da teoria.'
                  : 'Memória em dia.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/estudos?tab=revisoes')}
                className="shrink-0 h-7 px-3 rounded-lg text-[11px] font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{pendingReviewsCount > 0 ? 'Revisar agora' : 'Ver revisões'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Coluna 2: Blocos do Ciclo de Hoje */}
          <div className="rounded-lg p-3 bg-slate-50/90 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Ciclo de Hoje
                </span>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100 leading-none">
                    {todayBlocks.length > 0 ? `${completedBlocksCount}/${todayBlocks.length}` : '0'}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {todayBlocks.length === 0
                      ? 'Nenhum bloco programado hoje'
                      : completedBlocksCount === todayBlocks.length
                        ? 'Todos os blocos concluídos!'
                        : `${todayBlocks.length - completedBlocksCount} ${todayBlocks.length - completedBlocksCount === 1 ? 'bloco restante' : 'blocos restantes'}`}
                  </span>
                </div>
              </div>
              {todayBlocks.length > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                  completedBlocksCount === todayBlocks.length
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}>
                  {Math.round((completedBlocksCount / todayBlocks.length) * 100)}%
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
                {todayBlocks.slice(0, 5).map((block) => (
                  <span
                    key={block.slotIdx}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded truncate max-w-[130px] ${block.color} ${block.completed ? 'opacity-60 line-through' : ''}`}
                    title={`${block.name}${block.completed ? ' (concluído)' : ''}`}
                  >
                    {block.completed && <CheckIcon className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate">{block.name}</span>
                  </span>
                ))}
                {todayBlocks.length > 5 && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    +{todayBlocks.length - 5}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/estudos?tab=cronograma')}
                className="shrink-0 h-7 px-3 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ir para o Ciclo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI CARDS */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={stagger} initial="hidden" animate="visible">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={fadeUp}
              className="glass-card rounded-2xl p-5 flex flex-col gap-2.5 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{kpi.label}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <span className={`text-3xl font-black tabular-nums leading-none ${kpi.color}`}>{kpi.value}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{kpi.sub}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* GRÁFICO XP SEMANAL */}
      <div className="glass-card rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-500" /> XP por Dia — Últimos 7 Dias
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
            Semana: <span className="text-blue-500 dark:text-blue-400 font-black">{xpThisWeek.toLocaleString()} XP</span>
          </span>
        </div>
        <XpSparkline xpHistory={xpHistory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA CENTRAL */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 sm:p-8 overflow-hidden">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-base mb-8 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-500" /> Jornada de Promoções
            </h3>
            <div className="relative flex justify-between items-center sm:px-4">
               <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
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
                        <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight ${isActive ? patenteAtual.color : isCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{p.name.split(' ')[0]}</p>
                      </div>
                      {isNext && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-[9px] font-black text-white px-2 py-0.5 rounded-full">PRÓXIMO</span>}
                   </div>
                 );
               })}
            </div>
            <div className="mt-10 text-center">
               <p className="text-xs font-bold text-slate-500 uppercase">Sua patente atual: <span className={`font-black ${patenteAtual.color}`}>{patenteAtual.name}</span></p>
            </div>
          </div>

          {/* CONTRATOS DIÁRIOS */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-base mb-6 flex items-center justify-between">
              <span className="flex items-center gap-3"><Activity className="w-5 h-5 text-emerald-500" /> Contratos Diários do Agente</span>
              <span className="text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/25 font-bold">DIÁRIO</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {dailyMissions.map(mission => (
                 <div key={mission.id} className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                   mission.claimed 
                     ? 'bg-slate-100/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60' 
                     : mission.completed 
                       ? 'bg-emerald-500/10 border-emerald-500/60 dark:border-emerald-500/40' 
                       : 'bg-slate-50/70 dark:bg-slate-850/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                 }`}>
                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${mission.completed ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <h4 className={`text-xs font-black uppercase tracking-tight leading-tight ${mission.completed ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-200'}`}>{mission.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-snug mb-4 min-h-[32px]">{mission.description}</p>
                      
                      {/* Barra de Progresso */}
                      <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${mission.completed ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (mission.current / mission.goal) * 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-semibold tabular-nums">
                        <span>Progresso:</span>
                        <span>{mission.current} / {mission.goal} {mission.type === 'minutes' ? 'min' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between mt-auto pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col gap-1">
                         <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">+{mission.xpReward} XP</div>
                         <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">+{mission.coinReward} <Coins className="w-2.5 h-2.5" /></div>
                      </div>
                      {mission.completed && !mission.claimed && (
                        <button onClick={() => claimDailyMissionReward(mission.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer">
                          RESGATAR
                        </button>
                      )}
                    </div>
                    {mission.claimed && <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center z-20"><div className="rotate-12 text-[11px] font-black text-emerald-400 border-2 border-emerald-500/50 px-3 py-1.5 rounded uppercase bg-slate-950 shadow-lg">Contrato Concluído</div></div>}
                 </div>
               ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-base mb-6 flex items-center justify-between">
              <span className="flex items-center gap-3"><Activity className="w-5 h-5 text-blue-500" /> Contratos Operacionais da Semana</span>
              <span className="text-[11px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-500/25 font-bold">ATIVAS</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {weeklyMissions.map(mission => (
                 <div key={mission.id} className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                   mission.claimed 
                     ? 'bg-slate-100/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60' 
                     : mission.completed 
                       ? 'bg-blue-500/10 border-blue-500/60 dark:border-blue-500/40' 
                       : 'bg-slate-50/70 dark:bg-slate-850/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                 }`}>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className={`w-4 h-4 ${mission.completed ? 'text-blue-500' : 'text-slate-400'}`} />
                          <h4 className={`text-sm font-black uppercase tracking-tight ${mission.completed ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-200'}`}>{mission.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-snug mb-4">{mission.description}</p>
                        <div className="flex items-center gap-2.5">
                           <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">+{mission.xpReward} XP</div>
                           <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+{mission.coinReward} <Coins className="w-3 h-3" /></div>
                        </div>
                      </div>
                      {mission.completed && !mission.claimed && (
                        <button onClick={() => claimMissionReward(mission.id)}
                          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer">
                          RESGATAR
                        </button>
                      )}
                    </div>
                    {mission.claimed && <div className="absolute top-2 right-2 rotate-12 text-[10px] font-black text-slate-500 border-2 border-slate-500/50 px-2 py-1 rounded">CONCLUÍDO</div>}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL */}
        <div className="space-y-6">
          {/* WIDGET K9 COMPANHEIRO */}
          <div 
            onClick={() => navigate('/pet')}
            className="glass-card rounded-2xl p-6 hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
                <Dog className="w-4 h-4" /> Mascote K9
              </span>
              <span className="text-[11px] font-bold bg-blue-500/10 text-blue-500 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 uppercase">
                Nível {petData?.level || 1}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-3xl shadow-md border border-amber-400/30 group-hover:scale-105 transition-transform shrink-0">
                🐕
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate">
                  {petData?.name || 'Recruta K9'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5 truncate">
                  {(petData?.hunger || 0) < 35 
                    ? '⚠️ Com fome, precisa de lanche!' 
                    : petData?.isSleeping 
                      ? '😴 Tirando uma soneca tática' 
                      : '❤️ Motivado e pronto para a ronda!'}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all" 
                      style={{ width: `${Math.round(((petData?.hunger ?? 100) + (petData?.energy ?? 100) + (petData?.hygiene ?? 100) + (petData?.fun ?? 100)) / 4)}%` }} 
                    />
                  </div>
                  <span className="text-[11px] font-black tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {Math.round(((petData?.hunger ?? 100) + (petData?.energy ?? 100) + (petData?.hygiene ?? 100) + (petData?.fun ?? 100)) / 4)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 sm:p-7">
             <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-6 flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-blue-500" /> Vitrine de Honra
             </h3>
             <div className="grid grid-cols-2 gap-4">
                {MEDALHAS.map(medal => {
                  const isUnlocked = userStats.medals.includes(medal.id);
                  return (
                    <div key={medal.id} className={`p-4 rounded-2xl border text-center transition-all hover:-translate-y-0.5 ${
                      isUnlocked 
                        ? 'bg-slate-50/80 dark:bg-slate-850/80 border-blue-500/25 dark:border-slate-700/80' 
                        : 'bg-slate-100/30 dark:bg-slate-950/60 border-slate-200/50 dark:border-slate-800/50 opacity-35'
                    }`}>
                       <div className="relative w-full aspect-square mb-3 flex items-center justify-center">
                          {isUnlocked ? (
                            <motion.img whileHover={{ scale: 1.1, rotate: 4 }} src={assetUrl(medal.icon)} alt={medal.title}
                              className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]"
                              onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }} />
                          ) : (
                            <div className="text-4xl filter grayscale contrast-0 opacity-20">🛡️</div>
                          )}
                       </div>
                       <p className={`text-xs font-black uppercase ${isUnlocked ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>{medal.title}</p>
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-1 leading-tight">{medal.desc}</p>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200 ${
            estimatedDate.isLate 
              ? 'border-red-500/30 dark:border-red-500/30' 
              : 'border-blue-500/25 dark:border-slate-800'
          }`}>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className={`p-2 rounded-xl ${estimatedDate.isLate ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {estimatedDate.isLate ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                   </div>
                   <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">Status de Edital</span>
                </div>
                <h2 className={`text-2xl font-black mb-1 ${estimatedDate.isLate ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'}`}>{estimatedDate.full}</h2>
                <div className="flex flex-col gap-1">
                   <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prova: {estimatedDate.examDateFormatted}</span>
                   {estimatedDate.isLate && <span className="text-[11px] font-black text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded w-fit uppercase mt-1">⚠️ ATENÇÃO AO CRONOGRAMA</span>}
                </div>
             </div>
             <div className={`absolute -bottom-10 -right-10 w-28 h-28 ${estimatedDate.isLate ? 'text-red-600/10' : 'text-blue-600/10'}`}>
                <Activity className="w-full h-full" />
             </div>
          </div>
        </div>
    </div>

      {/* SELETOR DE AVATAR MODAL */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[85vh] flex flex-col relative shadow-[0_0_50px_rgba(59,130,246,0.15)]"
            >
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-blue-500 w-6 h-6" /> Dossiê do Agente — Seleção de Avatar
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">Personalize sua identidade operational no QG.</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4">
                {ALL_AVATARS.map(avatar => {
                  const isUnlocked = unlockedAvatars.includes(avatar.path);
                  const isActive = userStats.avatar === avatar.path;
                  const rarity = RARITY_STYLES[avatar.rarity];
                  
                  return (
                    <div 
                      key={avatar.id}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all duration-300 relative overflow-hidden group bg-slate-950/40 ${
                        isActive 
                          ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]' 
                          : isUnlocked 
                            ? `${rarity.border} ${rarity.neonGlow} cursor-pointer` 
                            : 'border-slate-800 opacity-60'
                      }`}
                      onClick={() => {
                        if (isUnlocked && !isActive) {
                          selectAvatar(avatar.path);
                        }
                      }}
                    >
                      <div className="absolute top-2 right-2">
                        <span className={`text-[7px] font-black uppercase tracking-widest ${rarity.labelColor} px-1.5 py-0.5 rounded-full border border-slate-200/10`}>
                          {rarity.label}
                        </span>
                      </div>

                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 mb-3 bg-slate-800 group-hover:scale-105 transition-transform duration-300">
                        <img src={assetUrl(avatar.path)} alt={avatar.name} className="w-full h-full object-cover" />
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center">
                            <Lock className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <h4 className="text-[11px] font-black uppercase text-slate-200 tracking-tight mb-2 leading-tight min-h-[22px]">{avatar.name}</h4>

                      <div className="w-full mt-2">
                        {isActive ? (
                          <span className="w-full py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider block">
                            Ativo
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAvatar(avatar.path);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/10"
                          >
                            Equipar
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAvatarModalOpen(false);
                              navigate('/loja');
                            }}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                          >
                            <Lock className="w-3 h-3 text-yellow-500" /> Loja
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
