import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import RankBadge from '../components/RankBadge';
import { assetUrl } from '../lib/assets';
import {
  Activity, Trophy, Clock, AlertTriangle, CheckCircle, Coins,
  Flame, ShieldCheck, Target, Pencil, Check as CheckIcon,
  BookOpen, TrendingUp, Zap, X, Lock, Dog, ArrowRight, Calendar, Shield
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
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const entry = (xpHistory || []).find(h => h.date === key);
    return { key, label, xp: entry?.xp || 0 };
  });
  const maxXp = Math.max(...days.map(d => d.xp), 1);
  const W = 320, H = 56, padX = 12, padY = 10;
  const slotW = (W - padX * 2) / 7;
  const barW = slotW - 10;

  const emptyBarColor = isDarkMode ? '#1d2536' : '#e2e8f0';
  const filledBarColor = isDarkMode ? '#334155' : '#cbd5e1';
  const todayBarColor = '#0ea5e9';
  const labelColor = isDarkMode ? '#94a3b8' : '#64748b';
  const valueColor = isDarkMode ? '#cbd5e1' : '#334155';

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full max-h-[96px]">
        {days.map((day, i) => {
          const barH = Math.max(4, ((day.xp / maxXp) * (H - padY * 2)));
          const x = padX + i * slotW + 5;
          const y = H - padY - barH;
          const isToday = i === 6;
          return (
            <g key={day.key}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={isToday ? todayBarColor : day.xp > 0 ? filledBarColor : emptyBarColor}
              />
              {day.xp > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize="7"
                  fill={isToday ? '#38bdf8' : valueColor}
                  fontWeight="600"
                >
                  {day.xp}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={H + 12}
                textAnchor="middle"
                fontSize="7.5"
                fill={isToday ? '#38bdf8' : labelColor}
                fontWeight={isToday ? '700' : '500'}
              >
                {day.label}
              </text>
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

const RARITY_LABELS = {
  common: { label: 'Comum', text: 'text-slate-500 dark:text-slate-400' },
  uncommon: { label: 'Incomum', text: 'text-emerald-600 dark:text-emerald-400' },
  rare: { label: 'Raro', text: 'text-sky-600 dark:text-sky-400' },
  epic: { label: 'Épico', text: 'text-purple-600 dark:text-purple-400' },
  legendary: { label: 'Lendário', text: 'text-amber-600 dark:text-amber-400' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const {
    userStats, coins, user,
    getCurrentPatente, getEstimatedCompletionDate,
    weeklyMissions = [], claimMissionReward,
    dailyMissions = [], claimDailyMissionReward,
    unlockedAvatars = [], selectAvatar,
    streakData = { currentStreak: 0 },
    getEffectiveStreak,
    todayKey,
    reviewStats = { totalDone: 0, correct: 0, streak: 0 },
    caveiraQuestions = [],
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
      <div className="fade-in w-full pb-10 space-y-5 animate-pulse">
        <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="flex-1 w-full space-y-3">
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-full max-w-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-card rounded-xl p-5 space-y-3">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const enrollmentId = `PRF-${(user?.id || 'ANON').slice(-6).toUpperCase()}`;
  const patenteAtual = getCurrentPatente();
  const currentLevelIndex = PATENTES.findIndex(p => p.id === patenteAtual.id);
  const nextPatente = PATENTES[currentLevelIndex + 1] || null;
  const progressToNext = nextPatente
    ? Math.max(0, Math.min(100, ((userStats.xp - patenteAtual.minXp) / (nextPatente.minXp - patenteAtual.minXp)) * 100))
    : 100;

  const estimatedDate = getEstimatedCompletionDate();
  const completionPercent = (() => {
    let total = 0;
    let done = 0;
    Object.values(subjects || {}).forEach((sub) => {
      (sub.topics || []).forEach((t) => {
        const tTotal = Number(t.total) || 0;
        const tDone = Math.min(tTotal, Number(t.completed) || 0);
        total += tTotal;
        done += tDone;
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();

  const displayName = userStats?.displayName || user?.email?.split('@')[0] || 'Combatente';

  const handleSaveName = () => {
    if (tempName.trim()) useStore.setState(s => ({ userStats: { ...s.userStats, displayName: tempName.trim() } }));
    setIsEditingName(false);
  };

  const caveiraTotal = Array.isArray(caveiraQuestions) ? caveiraQuestions.length : 0;
  const caveiraCorrect = Array.isArray(caveiraQuestions)
    ? caveiraQuestions.filter(q => q && (q.hit === true || q.correct === true || q.isCorrect === true || q.acertou === true || q.result === 'correct' || q.status === 'correct')).length
    : 0;
  const combinedTotalAnswered = (Number(reviewStats.totalDone) || 0) + caveiraTotal;
  const combinedTotalCorrect = (Number(reviewStats.correct) || 0) + caveiraCorrect;
  const acertoRate = combinedTotalAnswered > 0
    ? Math.round((combinedTotalCorrect / combinedTotalAnswered) * 100)
    : 0;
  const acertoSubLabel = combinedTotalAnswered > 0
    ? `${combinedTotalCorrect}/${combinedTotalAnswered} resolvidas`
    : 'sem questões ainda';

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

    const shouldShiftCarryover = cycleScheduleType === 'weekly' && (cycleCarryoverOffset || 0) > 0;
    const effectiveCycleIdx = cycleScheduleType === 'weekly'
      ? (getCycleIndexForDate
          ? getCycleIndexForDate(todayObj, todayObj)
          : ((((cycleWeekStart === 'monday' ? (todayDow + 6) % 7 : todayDow) - (shouldShiftCarryover ? cycleCarryoverOffset : 0)) % 7) + 7) % 7)
      : (currentDayIndex || 0);

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
    { label: 'Ofensiva', value: `${effectiveStreak}d`, sub: 'dias consecutivos', icon: Flame, iconColor: 'text-amber-500' },
    { label: 'Revisões', value: reviewStats.totalDone, sub: 'concluídas no total', icon: BookOpen, iconColor: 'text-sky-500' },
    { label: 'XP semanal', value: xpThisWeek.toLocaleString(), sub: 'últimos 7 dias', icon: Zap, iconColor: 'text-sky-500' },
    { label: 'Taxa de acertos', value: `${acertoRate}%`, sub: acertoSubLabel, icon: TrendingUp, iconColor: 'text-emerald-500' },
  ];

  const petOverallHealth = Math.round(
    ((petData?.hunger ?? 100) + (petData?.energy ?? 100) + (petData?.hygiene ?? 100) + (petData?.fun ?? 100)) / 4
  );

  return (
    <div className="fade-in w-full pb-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-1">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Carreira
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {patenteAtual.name} · {userStats.xp.toLocaleString()} XP · {completionPercent}% do edital concluído
          </p>
        </div>
      </header>

      {/* CABEÇALHO DE CARREIRA — Superfície única limpa */}
      <section className="glass-card rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Avatar + Identidade */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative group shrink-0 rounded-full focus-visible:outline-sky-500 cursor-pointer"
              title="Alterar avatar"
              aria-label="Alterar avatar do perfil"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 group-hover:border-sky-500 transition-colors bg-slate-100 dark:bg-slate-850">
                {userStats.avatar ? (
                  <img
                    src={assetUrl(userStats.avatar)}
                    alt="Avatar do perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <RankBadge level={patenteAtual.level} size={64} />
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:text-sky-500 group-hover:border-sky-500 flex items-center justify-center transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </span>
            </button>

            <div className="flex-1 min-w-0 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      maxLength={30}
                      className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-sky-500 outline-none w-56 sm:w-64"
                      placeholder="Seu nome..."
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      aria-label="Salvar nome"
                      className="w-9 h-9 bg-sky-600 hover:bg-sky-500 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                      {displayName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => { setTempName(displayName); setIsEditingName(true); }}
                      aria-label="Editar nome de exibição"
                      title="Editar nome"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Metadados limpos em linha (sem cápsulas) */}
              <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5">
                  <RankBadge level={patenteAtual.level} size={16} />
                  {patenteAtual.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{enrollmentId}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  Ofensiva de {effectiveStreak} {effectiveStreak === 1 ? 'dia' : 'dias'}
                </span>
              </div>

              {/* Barra de Progresso de Carreira */}
              <div className="mt-4 max-w-xl mx-auto sm:mx-0 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {nextPatente
                      ? `Faltam ${(nextPatente.minXp - userStats.xp).toLocaleString()} XP para ${nextPatente.name}`
                      : 'Patente máxima alcançada'}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-100 shrink-0">
                    {userStats.xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="bg-sky-500 h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Numérico Lateral (Moedas & Edital) */}
          <div className="flex items-center justify-around lg:justify-end gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-6 shrink-0">
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end gap-1.5 text-amber-600 dark:text-amber-400">
                <Coins className="w-4 h-4" />
                <span className="font-mono text-2xl font-bold tabular-nums leading-none">{coins}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">Moedas</span>
            </div>
            <div className="w-px h-9 bg-slate-200 dark:bg-slate-800" />
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-end gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-mono text-2xl font-bold tabular-nums leading-none">{completionPercent}%</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">Edital concluído</span>
            </div>
          </div>
        </div>
      </section>

      {/* MISSÃO DE HOJE — Faixa Operacional 2 Colunas */}
      <section className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Prioridades de hoje
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Revisões FSRS */}
          <div className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revisões FSRS</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`font-mono text-2xl font-bold tabular-nums leading-none ${pendingReviewsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {pendingReviewsCount}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {pendingReviewsCount === 0
                      ? 'em dia por hoje'
                      : pendingReviewsCount === 1
                        ? 'item aguardando revisão'
                        : 'itens aguardando revisão'}
                  </span>
                </div>
              </div>
              <span className={`text-xs font-semibold ${pendingReviewsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {pendingReviewsCount > 0 ? 'Pendente' : 'Concluído'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {pendingReviewsCount > 0
                  ? 'Elimine sua fila antes de avançar na teoria.'
                  : 'Sua memória espaçada está em dia.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/revisoes')}
                className="shrink-0 h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{pendingReviewsCount > 0 ? 'Revisar agora' : 'Ver revisões'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Blocos do Ciclo de Hoje */}
          <div className="p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Ciclo de hoje
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white leading-none">
                    {todayBlocks.length > 0 ? `${completedBlocksCount}/${todayBlocks.length}` : '0'}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {todayBlocks.length === 0
                      ? 'nenhum bloco programado'
                      : completedBlocksCount === todayBlocks.length
                        ? 'todos os blocos concluídos'
                        : `${todayBlocks.length - completedBlocksCount} ${todayBlocks.length - completedBlocksCount === 1 ? 'bloco restante' : 'blocos restantes'}`}
                  </span>
                </div>
              </div>
              {todayBlocks.length > 0 && (
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                  {Math.round((completedBlocksCount / todayBlocks.length) * 100)}%
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {todayBlocks.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 flex-1 min-w-0">
                  {todayBlocks.slice(0, 5).map((b) => (
                    <span
                      key={`${b.id}-${b.slotIdx}`}
                      className={`inline-flex items-center gap-1.5 text-xs ${
                        b.completed
                          ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-75'
                          : 'text-slate-700 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {b.completed ? (
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${b.color || 'bg-sky-500'}`} />
                      )}
                      <span className="truncate max-w-[140px]">{b.name}</span>
                    </span>
                  ))}
                  {todayBlocks.length > 5 && (
                    <span className="text-xs font-mono text-slate-400">+{todayBlocks.length - 5}</span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex-1 min-w-0">
                  Configure suas disciplinas no cronograma.
                </p>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/estudos?tab=cronograma')}
                  className="h-9 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Ir para o Ciclo
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/estudos?tab=hoje')}
                  className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Estudar hoje</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI STRIP — 4 COLUNAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="glass-card rounded-xl p-4 sm:p-5 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</span>
                <Icon className={`w-4 h-4 shrink-0 ${kpi.iconColor}`} />
              </div>
              <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums leading-none text-slate-900 dark:text-white">
                {kpi.value}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* GRÁFICO XP SEMANAL */}
      <section className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-500" />
            <span>XP nos últimos 7 dias</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Total: <strong className="font-mono font-semibold text-slate-900 dark:text-white">{xpThisWeek.toLocaleString()} XP</strong>
          </span>
        </div>
        <XpSparkline xpHistory={xpHistory} />
      </section>

      {/* CONTEÚDO PRINCIPAL 2/3 + LATERAL 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* JORNADA DE PROMOÇÕES */}
          <section className="glass-card rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Jornada de promoções</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Atual: <strong className="font-semibold text-slate-800 dark:text-slate-100">{patenteAtual.name}</strong>
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar pb-2">
              <div className="relative flex justify-between items-center min-w-[460px] px-2 pt-4 pb-8">
                <div className="absolute top-10 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                {PATENTES.map((p, idx) => {
                  const isCompleted = userStats.xp >= p.minXp;
                  const isNext = !isCompleted && PATENTES[idx - 1] && userStats.xp >= PATENTES[idx - 1].minXp;
                  const isActive = patenteAtual.id === p.id;
                  return (
                    <div key={p.id} className="relative z-10 flex flex-col items-center">
                      {isNext && (
                        <span className="absolute -top-5 text-[10px] font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          Próxima
                        </span>
                      )}
                      <div className={`transition-transform duration-300 rounded-full p-1 bg-white dark:bg-slate-900 ${
                        isActive ? 'scale-115 ring-2 ring-sky-500' : isCompleted ? 'opacity-100' : 'opacity-30 grayscale'
                      }`}>
                        <RankBadge level={p.level} size={40} />
                      </div>
                      <p className={`mt-2 text-[11px] font-medium text-center whitespace-nowrap ${
                        isActive
                          ? 'text-slate-900 dark:text-white font-semibold'
                          : isCompleted
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {p.name.replace('Policial Rodoviário', 'PRF').replace('Agente ', 'Ag. ').replace('Classe', 'Cl.')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CONTRATOS DIÁRIOS */}
          <section className="glass-card rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Contratos diários</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Renovam à meia-noite</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyMissions.map(mission => {
                const pct = Math.min(100, Math.round((mission.current / Math.max(1, mission.goal)) * 100));
                return (
                  <div
                    key={mission.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                      mission.claimed
                        ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/70 dark:border-slate-800/70 opacity-65'
                        : mission.completed
                          ? 'bg-emerald-500/5 border-emerald-500/40'
                          : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                          {mission.title}
                        </h3>
                        <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${mission.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {mission.description}
                      </p>
                      <div className="pt-1 space-y-1">
                        <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${mission.completed ? 'bg-emerald-500' : 'bg-sky-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          <span>{mission.current}/{mission.goal}{mission.type === 'minutes' ? ' min' : ''}</span>
                          <span>{pct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        +{mission.xpReward} XP · +{mission.coinReward} <Coins className="w-3 h-3 inline text-amber-500 -mt-0.5" />
                      </span>
                      {mission.claimed ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Resgatado</span>
                      ) : mission.completed ? (
                        <button
                          type="button"
                          onClick={() => claimDailyMissionReward(mission.id)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Resgatar
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CONTRATOS SEMANAIS */}
          <section className="glass-card rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-500" />
                <span>Contratos da semana</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Metas semanais</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {weeklyMissions.map(mission => (
                <div
                  key={mission.id}
                  className={`py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${mission.claimed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${mission.completed ? 'text-sky-500' : 'text-slate-300 dark:text-slate-700'}`} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{mission.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mission.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 shrink-0">
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                      +{mission.xpReward} XP · +{mission.coinReward} <Coins className="w-3 h-3 inline text-amber-500 -mt-0.5" />
                    </span>
                    {mission.claimed ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Concluído</span>
                    ) : mission.completed ? (
                      <button
                        type="button"
                        onClick={() => claimMissionReward(mission.id)}
                        className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Resgatar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUNA LATERAL */}
        <div className="space-y-6">
          {/* WIDGET K9 */}
          <button
            type="button"
            onClick={() => navigate('/pet')}
            className="w-full text-left glass-card glass-card-hover rounded-xl p-5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1.5">
                <Dog className="w-4 h-4" />
                Mascote K9
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Nível {petData?.level || 1}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Dog className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {petData?.name || 'Recruta K9'}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {(petData?.hunger || 0) < 35
                    ? 'Com fome — precisa de ração'
                    : petData?.isSleeping
                      ? 'Descansando na base'
                      : 'Pronto para a próxima ronda'}
                </p>

                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-850 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${petOverallHealth}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                    {petOverallHealth}%
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* STATUS DO EDITAL */}
          <section className={`glass-card rounded-xl p-5 ${estimatedDate.isLate ? 'border-amber-500/40' : ''}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Previsão de edital</span>
              {estimatedDate.isLate ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <Clock className="w-4 h-4 text-sky-500" />
              )}
            </div>
            <p className={`font-display text-xl font-bold leading-snug ${estimatedDate.isLate ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {estimatedDate.full}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Data alvo da prova: <strong className="font-mono text-slate-700 dark:text-slate-200">{estimatedDate.examDateFormatted}</strong>
            </p>
            {estimatedDate.isLate && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                Ritmo atual ultrapassa a data da prova — ajuste seu ciclo ou meta diária.
              </p>
            )}
          </section>

          {/* VITRINE DE HONRA */}
          <section className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                <span>Conquistas</span>
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {userStats.medals.length}/{MEDALHAS.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MEDALHAS.map(medal => {
                const isUnlocked = userStats.medals.includes(medal.id);
                return (
                  <div
                    key={medal.id}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center ${
                      isUnlocked
                        ? 'bg-slate-50/70 dark:bg-slate-850/50 border-slate-200 dark:border-slate-700/80'
                        : 'bg-transparent border-slate-200/60 dark:border-slate-800/60 opacity-45'
                    }`}
                  >
                    <div className="w-11 h-11 mb-2 flex items-center justify-center shrink-0">
                      {isUnlocked ? (
                        <img
                          src={assetUrl(medal.icon)}
                          alt={medal.title}
                          className="w-full h-full object-contain"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Shield className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                      )}
                    </div>
                    <p className={`text-xs font-semibold leading-tight ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                      {medal.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {medal.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* SELETOR DE AVATAR MODAL (SUPORTE COMPLETO LIGHT & DARK) */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-[150] p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                aria-label="Fechar seletor de avatar"
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5 pr-10">
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Seleção de avatar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Escolha seu avatar ativo ou desbloqueie novos na Loja.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar grid grid-cols-2 sm:grid-cols-4 gap-3.5 pb-2">
                {ALL_AVATARS.map(avatar => {
                  const isUnlocked = unlockedAvatars.includes(avatar.path);
                  const isActive = userStats.avatar === avatar.path;
                  const rarity = RARITY_LABELS[avatar.rarity] || RARITY_LABELS.common;

                  return (
                    <div
                      key={avatar.id}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-between text-center transition-colors bg-slate-50/70 dark:bg-slate-850/60 ${
                        isActive
                          ? 'border-sky-500 ring-1 ring-sky-500/40'
                          : isUnlocked
                            ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                            : 'border-slate-200/70 dark:border-slate-800/70 opacity-65'
                      }`}
                      onClick={() => {
                        if (isUnlocked && !isActive) {
                          selectAvatar(avatar.path);
                        }
                      }}
                    >
                      <span className={`text-[11px] font-medium mb-2 ${rarity.text}`}>
                        {rarity.label}
                      </span>

                      <div className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 mb-3 bg-slate-200 dark:bg-slate-800">
                        <img src={assetUrl(avatar.path)} alt={avatar.name} className="w-full h-full object-cover" />
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-slate-950/65 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-3">
                        {avatar.name}
                      </h4>

                      <div className="w-full">
                        {isActive ? (
                          <span className="w-full h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            Em uso
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAvatar(avatar.path);
                            }}
                            className="w-full h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Equipar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAvatarModalOpen(false);
                              navigate('/loja');
                            }}
                            className="w-full h-8 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span>Ver na loja</span>
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
