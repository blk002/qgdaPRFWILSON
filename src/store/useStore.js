import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import { PET_FOODS, PET_LEVELS } from '../data/petConstants';
import { parseDurationToSeconds, calculateLessonsForGoal } from '../lib/durationHelpers';

export function cleanAlternativeText(rawText, letter) {
  if (!rawText || typeof rawText !== 'string') return '';
  let clean = rawText.trim();
  const safeLetter = letter && /^[A-Za-z0-9]$/.test(String(letter).trim()) ? String(letter).trim() : '[A-E]';
  const letterPrefixRegex = new RegExp(`^\\(?\\s*${safeLetter}\\s*[\\).\\-–—:]?\\s+`, 'i');
  clean = clean.replace(letterPrefixRegex, '').trim();
  const isOnlyPercentage = /^\d+(?:[.,]\d+)?\s*%\s*$/.test(clean);
  if (!isOnlyPercentage) {
    clean = clean.replace(/^\s*\d{1,3}(?:[.,]\d+)?\s*%\s*/, '').trim();
    clean = clean.replace(/\s*\d{1,3}(?:[.,]\d+)?\s*%\s*$/, '').trim();
  }
  return clean || rawText;
}

export const cleanAltText = cleanAlternativeText;

export const THEME_DEFINITIONS = {
  blue: {
    name: 'Dark Blue (Padrão)',
    colors: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
      '500-glow': 'rgba(59, 130, 246, 0.15)'
    }
  },
  forest: {
    name: 'Forest Green',
    colors: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
      '500-glow': 'rgba(34, 197, 94, 0.15)'
    }
  },
  purple: {
    name: 'Cyber Purple',
    colors: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
      '500-glow': 'rgba(168, 85, 247, 0.15)'
    }
  },
  gold: {
    name: 'Obsidian Gold',
    colors: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
      '500-glow': 'rgba(245, 158, 11, 0.15)'
    }
  },
  crimson: {
    name: 'Crimson Red',
    colors: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
      '500-glow': 'rgba(239, 68, 68, 0.15)'
    }
  }
};

export const getCleanInitialState = () => ({
  subjects: {},
  pushEnabled: false,
  pushTime: '08:00',
  cycle: [[], [], [], [], [], [], []],
  currentDayIndex: 0,
  completedToday: [],
  completedTodayDate: null,
  targetExamDate: '2026-08-15',
  coins: 250,
  userStats: { xp: 0, medals: [], totalStudyMinutes: 0, avatar: '/assets/gamification/avatar_male.png' },
  streakData: { currentStreak: 0, lastCheckDate: null },
  enableSounds: true,
  weeklySprint: { goalHours: 35, currentMinutes: 0, weekStart: new Date().toISOString() },
  reviews: [],
  reviewStats: { totalDone: 0, correct: 0, streak: 0 },
  simulados: [],
  tafHistory: [],
  tafTrainingStatus: { lastDoneDate: null },
  studyHistory: {},
  isDarkMode: true,
  activeTab: 'carreira',
  // todayStr removido do estado — agora é computado via getLocalDateStr()
  calendarDate: new Date(),
  reviewCalendarDate: new Date(),
  seasonalData: {
    currentSeason: 1,
    seasonName: "Recruta Operacional",
    seasonXp: 0,
    seasonGoalXp: 5000,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  weeklyMissions: [
    { id: 'm1', title: 'Cérebro Ativo', description: 'Complete 10 revisões FSRS', goal: 10, current: 0, xpReward: 150, coinReward: 50, type: 'review', completed: false, claimed: false },
    { id: 'm2', title: 'Combatente Físico', description: 'Registre 2 treinos TAF', goal: 2, current: 0, xpReward: 100, coinReward: 30, type: 'taf', completed: false, claimed: false },
    { id: 'm3', title: 'Simulado de Elite', description: 'Registre 1 novo Simulado', goal: 1, current: 0, xpReward: 120, coinReward: 40, type: 'simulado', completed: false, claimed: false },
    { id: 'm4', title: 'Persistência Total', description: 'Assista 4 aulas de teoria', goal: 4, current: 0, xpReward: 200, coinReward: 60, type: 'study', completed: false, claimed: false },
  ],
  unlockedAvatars: [
    '/assets/gamification/avatar_male.png',
    '/assets/gamification/avatar_female.png'
  ],
  dailyMissions: [],
  lastDailyResetDate: null,
  activeBoosts: { xpBoostActions: 0, streakShieldActive: false },
  dailyReviewStats: {},
  syntaxLevel: 0,
  activeTheme: 'blue',
  unlockedThemes: ['blue'],
  dailyGoalMinutes: 240,
  subjectGoals: {},
  subjectTimeGoal: {},
  pushSettings: { enabled: false, streakWarning: true, reviewsPending: true },
  cycleScheduleType: 'weekly',
  cycleWeekStart: 'sunday',
  cycleDayNames: [],
  cycleSlotCounts: [[], [], [], [], [], [], []],
  cycleCarryoverOffset: 0,
  lastCarryoverCheckDate: null,
  calendarOverrides: {},
  calendarOverrideCounts: {},
  futureScheduleRules: [],
  xpHistory: [],
  petData: {
    name: 'Recruta K9',
    hunger: 85,
    energy: 90,
    hygiene: 85,
    fun: 80,
    level: 1,
    xp: 0,
    isSleeping: false,
    skin: 'caramel',
    hat: 'none',
    outfit: 'none',
    unlockedItems: ['skin:caramel', 'hat:none', 'outfit:none'],
    foodInventory: {
      coffee: 3,
      pao_de_queijo: 4,
      energy_drink: 2,
      steak_k9: 2,
      donut: 3
    },
    totalCareCount: 0,
    lastTick: Date.now()
  },
  caveiraQuestions: [],
});

const getInitialLocalCaveiraQuestions = () => {
  try {
    if (localStorage.getItem('prf_caveira_schema') !== 'v3_strict_clean') {
      localStorage.removeItem('prf_caveira_questions');
      localStorage.setItem('prf_caveira_schema', 'v3_strict_clean');
      return [];
    }
    const saved = localStorage.getItem('prf_caveira_questions');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Fonte única de verdade das chaves persistidas (nuvem, backup local,
// export/import e gatilho de auto-save). Mantê-la única evita divergências
// como a do export de backup, que silenciosamente perdia dados.
export const PERSISTED_KEYS = [
  'subjects', 'cycle', 'currentDayIndex', 'completedToday', 'completedTodayDate', 'targetExamDate',
  'coins', 'userStats', 'streakData', 'weeklySprint', 'reviews',
  'reviewStats', 'simulados', 'tafHistory', 'tafTrainingStatus',
  'isDarkMode', 'activeTab',
  'seasonalData', 'weeklyMissions', 'studyHistory',
  'unlockedAvatars', 'dailyMissions', 'lastDailyResetDate', 'pushEnabled', 'pushTime',
  'enableSounds', 'activeBoosts', 'dailyReviewStats', 'syntaxLevel',
  'activeTheme', 'unlockedThemes', 'dailyGoalMinutes', 'subjectGoals', 'subjectTimeGoal', 'pushSettings',
  'cycleScheduleType', 'cycleWeekStart', 'cycleDayNames', 'cycleSlotCounts', 'cycleCarryoverOffset', 'lastCarryoverCheckDate', 'calendarOverrides', 'calendarOverrideCounts', 'futureScheduleRules', 'xpHistory', 'petData', 'caveiraQuestions'
];

// Data local (YYYY-MM-DD) usada para detectar a virada de dia.
const localTodayStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000).toISOString().split('T')[0];
};

const LOCAL_STATE_STORAGE_KEY = 'prf_qg_local_state';

// Normaliza dados vindos da nuvem, snapshot local ou backup local garantindo padrões seguros para campos novos/ausentes
const normalizeHydratedState = (raw, currentCaveira = []) => {
  const defaults = getCleanInitialState();
  const { isSyncing: _s, lastSyncedAt: _l, _keyTimestamps: _kt, ...cleanData } = raw || {};
  delete cleanData.calendarDate;
  delete cleanData.reviewCalendarDate;
  delete cleanData.reviewCalendarDate;

  if (cleanData.completedTodayDate === undefined) cleanData.completedTodayDate = null;
  if (!Array.isArray(cleanData.completedToday)) cleanData.completedToday = [];
  if (!cleanData.studyHistory) cleanData.studyHistory = {};
  if (!cleanData.unlockedAvatars || cleanData.unlockedAvatars.length === 0) {
    cleanData.unlockedAvatars = [...defaults.unlockedAvatars];
  }
  if (!cleanData.dailyMissions) cleanData.dailyMissions = [];
  if (!cleanData.lastDailyResetDate) cleanData.lastDailyResetDate = null;
  if (cleanData.userStats && !cleanData.userStats.avatar) {
    cleanData.userStats.avatar = '/assets/gamification/avatar_male.png';
  }
  if (cleanData.userStats && cleanData.userStats.totalPurchases === undefined) {
    cleanData.userStats.totalPurchases = 0;
  }
  if (!cleanData.activeBoosts) {
    cleanData.activeBoosts = { xpBoostActions: 0, streakShieldActive: false };
  }
  if (!cleanData.dailyReviewStats) cleanData.dailyReviewStats = {};
  if (cleanData.syntaxLevel === undefined) cleanData.syntaxLevel = 0;
  if (cleanData.enableSounds === undefined) cleanData.enableSounds = true;
  if (cleanData.streakData && cleanData.streakData.hasHadBreak === undefined) {
    cleanData.streakData.hasHadBreak = false;
  }
  if (!cleanData.activeTheme) cleanData.activeTheme = 'blue';
  if (!cleanData.unlockedThemes) cleanData.unlockedThemes = ['blue'];
  if (cleanData.dailyGoalMinutes === undefined) cleanData.dailyGoalMinutes = 240;
  if (!cleanData.subjectGoals) cleanData.subjectGoals = {};
  if (!cleanData.subjectTimeGoal) cleanData.subjectTimeGoal = {};
  if (!cleanData.pushSettings) {
    cleanData.pushSettings = { enabled: false, streakWarning: true, reviewsPending: true };
  }
  if (!cleanData.petData) cleanData.petData = defaults.petData;
  if ((cleanData.cycleScheduleType || 'weekly') === 'weekly') {
    cleanData.cycle = Array.from({ length: 7 }, (_, i) => Array.isArray(cleanData.cycle?.[i]) ? cleanData.cycle[i] : []);
    cleanData.cycleSlotCounts = Array.from({ length: 7 }, (_, i) => Array.isArray(cleanData.cycleSlotCounts?.[i]) ? cleanData.cycleSlotCounts[i] : []);
    const isCycleCompletelyEmpty = cleanData.cycle.every(d => !Array.isArray(d) || d.length === 0);
    if (isCycleCompletelyEmpty && Array.isArray(cleanData.futureScheduleRules) && cleanData.futureScheduleRules.length > 0) {
      const sortedAsc = [...cleanData.futureScheduleRules]
        .filter(r => r && r.v === 2 && Array.isArray(r.daySlots) && r.daySlots.length > 0)
        .sort((a, b) => String(a.fromDate || '').localeCompare(String(b.fromDate || '')));
      sortedAsc.forEach(r => {
        const idx = (cleanData.cycleWeekStart === 'monday' && r.dayOfWeek !== undefined)
          ? (r.dayOfWeek + 6) % 7
          : (r.cycleIndex ?? r.dayOfWeek);
        if (idx !== undefined && idx >= 0 && idx < 7 && (!cleanData.cycle[idx] || cleanData.cycle[idx].length === 0)) {
          cleanData.cycle[idx] = [...r.daySlots];
          if (Array.isArray(r.slotCounts)) {
            cleanData.cycleSlotCounts[idx] = [...r.slotCounts];
          }
        }
      });
    }
  }
  if (!cleanData.calendarOverrideCounts) cleanData.calendarOverrideCounts = {};

  // Mescla caveiraQuestions preservando lote limpo v3
  const isCloudCleanedV3 = localStorage.getItem('prf_caveira_cloud_v3_cleaned') === 'true';
  const incomingCaveira = isCloudCleanedV3 ? (cleanData.caveiraQuestions || []) : [];
  if (!isCloudCleanedV3) {
    try { localStorage.setItem('prf_caveira_cloud_v3_cleaned', 'true'); } catch (_) {}
  }
  const mergedMap = new Map();
  incomingCaveira.forEach(q => { if (q && q.id) mergedMap.set(q.id, q); });
  (currentCaveira || []).forEach(q => { if (q && q.id) mergedMap.set(q.id, { ...(mergedMap.get(q.id) || {}), ...q }); });
  cleanData.caveiraQuestions = Array.from(mergedMap.values());

  return cleanData;
};

const readLocalSnapshot = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeLocalSnapshot = (state, { dirty = true, savedAt = new Date().toISOString(), keyTimestamps = null } = {}) => {
  try {
    const prevSnap = readLocalSnapshot();
    const data = {};
    PERSISTED_KEYS.forEach(key => {
      if (key === 'caveiraQuestions') return; // caveiraQuestions já possui chave própria
      if (state[key] !== undefined) data[key] = state[key];
    });
    const payload = {
      savedAt,
      dirty,
      userId: state.user?.id || prevSnap?.userId || null,
      keyTimestamps: keyTimestamps || prevSnap?.keyTimestamps || {},
      data
    };
    localStorage.setItem(LOCAL_STATE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    // Trata QuotaExceededError ou falhas de escrita sem quebrar a aplicação
    console.warn('⚠️ [Snapshot Local] Falha ao gravar estado local:', err?.name || err?.message);
    return false;
  }
};

const appendLocalBackup = (data, reason = 'auto') => {
  if (!hasMeaningfulUserData(data)) return;
  try {
    const backupsJson = localStorage.getItem('prf_qg_backups');
    let backups = backupsJson ? JSON.parse(backupsJson) : [];
    if (!Array.isArray(backups)) backups = [];
    backups.unshift({
      timestamp: Date.now(),
      reason,
      data
    });
    backups = backups.slice(0, 5);
    localStorage.setItem('prf_qg_backups', JSON.stringify(backups));
  } catch (err) {
    console.error("Erro ao criar backup local:", err);
  }
};

const hasMeaningfulUserData = (data) => {
  if (!data || typeof data !== 'object') return false;
  const hasSubjects = data.subjects && Object.keys(data.subjects).length > 0;
  const hasReviews = Array.isArray(data.reviews) && data.reviews.length > 0;
  const hasCycle = Array.isArray(data.cycle) && data.cycle.some(d => Array.isArray(d) && d.length > 0);
  const hasHistory = data.studyHistory && Object.keys(data.studyHistory).length > 0;
  const hasXp = (data.userStats?.xp || 0) > 0 || (data.userStats?.totalStudyMinutes || 0) > 0;
  return Boolean(hasSubjects || hasReviews || hasCycle || hasHistory || hasXp);
};

// Faz merge chave a chave entre nuvem e estado local sem descartar alterações locais genuínas
const mergeCloudAndLocalData = (remoteRaw, localState, localKeyTimestamps = {}, remoteUpdatedAt = null, lastSyncedAt = null) => {
  const merged = { ...(remoteRaw || {}) };
  const remoteKeyTs = (remoteRaw && typeof remoteRaw._keyTimestamps === 'object') ? remoteRaw._keyTimestamps : {};

  const mergedTimestamps = { ...remoteKeyTs };
  PERSISTED_KEYS.forEach(key => {
    if (key === 'caveiraQuestions') return;
    const localVal = localState[key];
    const remoteVal = remoteRaw?.[key];
    if (localVal === undefined) return;
    if (remoteVal === undefined) {
      merged[key] = localVal;
      if (localKeyTimestamps?.[key]) mergedTimestamps[key] = localKeyTimestamps[key];
      return;
    }

    const lTs = localKeyTimestamps?.[key] ? new Date(localKeyTimestamps[key]).getTime() : 0;
    const rTs = remoteKeyTs?.[key]
      ? new Date(remoteKeyTs[key]).getTime()
      : (remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : 0);
    const baseTs = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;

    // Nunca sobrescreve dado remoto com uma chave que não foi modificada localmente (lTs === 0)
    if (lTs === 0) {
      merged[key] = remoteVal;
      return;
    }

    const localModifiedSinceSync = baseTs > 0 ? (lTs > baseTs) : (rTs === 0 || lTs >= rTs);
    if (localModifiedSinceSync) {
      if (remoteKeyTs?.[key] && rTs > lTs) {
        merged[key] = remoteVal;
      } else {
        merged[key] = localVal;
        if (localKeyTimestamps?.[key]) mergedTimestamps[key] = localKeyTimestamps[key];
      }
    } else {
      merged[key] = remoteVal;
    }
  });

  // Reutiliza a lógica de merge por ID para caveiraQuestions
  const mergedCaveira = new Map();
  (remoteRaw?.caveiraQuestions || []).forEach(q => { if (q && q.id) mergedCaveira.set(q.id, q); });
  (localState?.caveiraQuestions || []).forEach(q => { if (q && q.id) mergedCaveira.set(q.id, { ...(mergedCaveira.get(q.id) || {}), ...q }); });
  merged.caveiraQuestions = Array.from(mergedCaveira.values());
  merged._keyTimestamps = mergedTimestamps;

  return merged;
};

const getInitialHydratedLocalState = () => {
  const base = getCleanInitialState();
  const snap = readLocalSnapshot();
  if (!snap || !snap.data) return base;
  const normalized = normalizeHydratedState(snap.data, getInitialLocalCaveiraQuestions());
  return { ...base, ...normalized };
};

export const useStore = create(
    (set, get) => ({
      // --- ESTADOS INICIAIS (HIDRATADOS DO SNAPSHOT LOCAL + NUVEM) ---
      ...getInitialHydratedLocalState(),
      // Chave volátil (não persistida) que muda na virada do dia real e força re-render das telas.
      todayKey: localTodayStr(),
      caveiraQuestions: getInitialLocalCaveiraQuestions(),
      isSyncing: true,
      isLoadingFromCloud: false,
      hasCompletedInitialCloudSync: false,
      isSavingToCloud: false,
      savePending: false,
      hasUnsyncedChanges: Boolean(readLocalSnapshot()?.dirty),
      // Marca temporal da última versão sincronizada da nuvem (controle de concorrência)
      lastSyncedAt: null,

      // --- ESTADOS VOLÁTEIS (INTERFACE) ---
      globalModal: null,
      reviewModal: null,
      classConfirmModal: null,
      replaceSubjectModal: null,

      // --- SUPABASE / CLOUD ---
      session: null,
      user: null,
      setSession: (session) => set((state) => {
        const nextUser = session?.user ?? null;
        const userChanged = state.user?.id !== nextUser?.id;
        return {
          session,
          user: nextUser,
          ...(userChanged ? { hasCompletedInitialCloudSync: false } : {})
        };
      }),
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
        localStorage.removeItem('prf-qg-storage');
        localStorage.removeItem('prf_qg_backups');
        localStorage.removeItem('prf_caveira_questions');
        localStorage.removeItem(LOCAL_STATE_STORAGE_KEY);
        window.location.reload();
      },

      loadFromCloud: async (retryCount = 0) => {
        const { user, isLoadingFromCloud } = get();
        if (!user) return false;
        if (isLoadingFromCloud && retryCount === 0) return false;

        // Cancela timers pendentes de pré-carga para impedir gravação do estado inicial vazio
        clearTimeout(useStore._localDebounceTimer);
        clearTimeout(useStore._debounceTimer);
        clearTimeout(useStore._retryTimer);

        if (retryCount === 0) {
          console.log('☁️ [Nuvem] Iniciando carregamento de dados seguros...');
          set({ isSyncing: true, isLoadingFromCloud: true });
        }

        const findRecoverableLocalBackup = (sameUserId) => {
          const snap = readLocalSnapshot();
          if (snap && (!snap.userId || snap.userId === sameUserId) && hasMeaningfulUserData(snap.data)) {
            return {
              data: snap.data,
              label: snap.savedAt ? `snapshot local (${new Date(snap.savedAt).toLocaleString()})` : 'snapshot local'
            };
          }
          try {
            const backupsJson = localStorage.getItem('prf_qg_backups');
            const backups = backupsJson ? JSON.parse(backupsJson) : [];
            const validBackup = (backups || []).find(b => b?.data && hasMeaningfulUserData(b.data));
            if (validBackup) {
              return {
                data: validBackup.data,
                label: `backup local (${new Date(validBackup.timestamp).toLocaleString()})`
              };
            }
          } catch (_) {}
          return null;
        };

        const applyHydratedCloudRecord = (rawFullData, remoteUpdatedAt) => {
          const currentCaveira = get().caveiraQuestions || [];
          let cleanData = normalizeHydratedState(rawFullData, currentCaveira);

          // Recuperação automática caso a nuvem tenha sido sobrescrita com dados vazios mas exista backup local íntegro
          let recoveredFromBackup = null;
          if (!hasMeaningfulUserData(cleanData)) {
            recoveredFromBackup = findRecoverableLocalBackup(user.id);
            if (recoveredFromBackup) {
              console.warn(`⚠️ [Recuperação] Nuvem vazia detectada, restaurando do ${recoveredFromBackup.label}!`);
              cleanData = normalizeHydratedState(recoveredFromBackup.data, currentCaveira);
            }
          }

          // A1: Compara snapshot local com a nuvem — só mescla se o snapshot for do mesmo usuário, tiver alterações com timestamp real e não for estado inicial vazio
          const localSnap = readLocalSnapshot();
          const isSameUserOrAnon = !localSnap?.userId || localSnap.userId === user.id;
          const localHasRealKeyChanges = localSnap?.keyTimestamps && Object.keys(localSnap.keyTimestamps).length > 0;
          const localIsNewerAndDirty = Boolean(
            !recoveredFromBackup &&
            localSnap &&
            isSameUserOrAnon &&
            localSnap.dirty &&
            localHasRealKeyChanges &&
            localSnap.savedAt &&
            (hasMeaningfulUserData(localSnap.data) || !hasMeaningfulUserData(cleanData)) &&
            (!remoteUpdatedAt || new Date(localSnap.savedAt) > new Date(remoteUpdatedAt))
          );

          if (localIsNewerAndDirty) {
            console.log('💾 [Snapshot Local] Estado local mais recente que a nuvem detectado. Mesclando alterações pendentes...');
            const mergedRaw = mergeCloudAndLocalData(
              rawFullData,
              { ...localSnap.data, caveiraQuestions: currentCaveira },
              localSnap.keyTimestamps || {},
              remoteUpdatedAt,
              get().lastSyncedAt
            );
            cleanData = normalizeHydratedState(mergedRaw, currentCaveira);
          }

          useStore._lastKnownCloudWasMeaningful = hasMeaningfulUserData(rawFullData);
          if (rawFullData?._keyTimestamps && !localIsNewerAndDirty) {
            useStore._keyTimestamps = { ...rawFullData._keyTimestamps };
          } else if (localIsNewerAndDirty && localSnap?.keyTimestamps) {
            useStore._keyTimestamps = { ...(rawFullData?._keyTimestamps || {}), ...localSnap.keyTimestamps };
          }

          try { localStorage.setItem('prf_caveira_questions', JSON.stringify(cleanData.caveiraQuestions)); } catch (_) {}

          set({
            ...cleanData,
            lastSyncedAt: remoteUpdatedAt,
            hasUnsyncedChanges: Boolean(localIsNewerAndDirty || recoveredFromBackup),
            hasCompletedInitialCloudSync: true,
            ...(recoveredFromBackup ? {
              globalModal: {
                title: 'Backup Local Recuperado!',
                message: `Detectamos que o perfil na nuvem veio vazio, mas encontramos seus dados salvos no ${recoveredFromBackup.label} e os restauramos na tela. Clique abaixo para regravá-los na nuvem agora!`,
                onConfirm: () => {
                  get().saveToCloud({ allowEmptyOverwrite: true });
                }
              }
            } : {})
          });
          get().syncDayRollover();
          get().checkAndResetWeekly();
          get().checkAndAdvanceSeason();
          get().checkAndResetDailyMissions();
          get().syncAndRepairCaveiraReviews?.();
          set({ isSyncing: false, isLoadingFromCloud: false });

          if (localIsNewerAndDirty) {
            writeLocalSnapshot(get(), {
              dirty: true,
              savedAt: localSnap.savedAt,
              keyTimestamps: localSnap.keyTimestamps
            });
            setTimeout(() => { get().saveToCloud(); }, 150);
          } else if (recoveredFromBackup) {
            writeLocalSnapshot(get(), {
              dirty: true,
              savedAt: new Date().toISOString(),
              keyTimestamps: useStore._keyTimestamps || {}
            });
          } else {
            writeLocalSnapshot(get(), {
              dirty: false,
              savedAt: remoteUpdatedAt || new Date().toISOString(),
              keyTimestamps: rawFullData?._keyTimestamps || {}
            });
          }

          try { window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA' }, '*'); } catch (_) {}
          return true;
        };

        try {
          // Timeout ultra-rápido de 2.5 segundos para não travar o usuário
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          let timerId;
          const timeoutPromise = new Promise((_, reject) => {
            timerId = setTimeout(() => {
              controller?.abort();
              reject(new Error("Timeout"));
            }, 2500);
          });

          let fetchQuery = supabase.from('profiles').select('full_data, updated_at').eq('id', user.id).limit(1);
          if (controller && typeof fetchQuery.abortSignal === 'function') {
            fetchQuery = fetchQuery.abortSignal(controller.signal);
          }
          const { data, error } = await Promise.race([fetchQuery, timeoutPromise]).finally(() => clearTimeout(timerId));

          if (error) throw error;

          if (data && data.length > 0 && data[0].full_data) {
            console.log("✅ [Nuvem] Dados sincronizados com sucesso.");
            return applyHydratedCloudRecord(data[0].full_data, data[0].updated_at || null);
          }

          // A4: Segurança contra falso "nova conta" (ex.: sessão expirada ou RLS retornando [] sem erro)
          // 1) Verifica se a sessão de autenticação está realmente válida
          const { data: sessionCheck, error: sessionErr } = await supabase.auth.getSession();
          const activeSession = sessionCheck?.session;
          if (sessionErr || !activeSession || activeSession.user?.id !== user.id) {
            throw new Error("Sessão expirada ou inválida durante leitura do perfil.");
          }

          // 2) Segunda leitura de confirmação para garantir que a linha realmente não existe
          const { data: confirmData, error: confirmErr } = await supabase
            .from('profiles')
            .select('full_data, updated_at')
            .eq('id', user.id)
            .limit(1);
          if (confirmErr) throw confirmErr;

          if (confirmData && confirmData.length > 0 && confirmData[0].full_data) {
            console.log("✅ [Nuvem] Dados confirmados na segunda leitura.");
            return applyHydratedCloudRecord(confirmData[0].full_data, confirmData[0].updated_at || null);
          }

          // 3) NUNCA apaga prf_qg_backups nem prf_caveira_questions aqui.
          // Se houver snapshot local ou backup com dados reais, oferece restaurá-lo em vez de criar perfil vazio por cima.
          const localSnap = readLocalSnapshot();
          let candidateLocalData = (!localSnap?.userId || localSnap.userId === user.id) && hasMeaningfulUserData(localSnap?.data)
            ? localSnap.data
            : null;
          let candidateSourceLabel = 'snapshot local';

          if (!candidateLocalData) {
            try {
              const backupsJson = localStorage.getItem('prf_qg_backups');
              const backups = backupsJson ? JSON.parse(backupsJson) : [];
              const validBackup = (backups || []).find(b => b?.data && hasMeaningfulUserData(b.data));
              if (validBackup) {
                candidateLocalData = validBackup.data;
                candidateSourceLabel = `backup local (${new Date(validBackup.timestamp).toLocaleString()})`;
              }
            } catch (_) {}
          }

          if (candidateLocalData) {
            console.warn(`⚠️ [Nuvem] Perfil remoto vazio, mas há dados no ${candidateSourceLabel}. Preservando dados locais.`);
            const restored = normalizeHydratedState(candidateLocalData, get().caveiraQuestions || []);
            set({
              ...restored,
              lastSyncedAt: null,
              isSyncing: false,
              isLoadingFromCloud: false,
              hasCompletedInitialCloudSync: true,
              hasUnsyncedChanges: true,
              globalModal: {
                title: 'Dados Locais Encontrados',
                message: `Sua conta na nuvem ainda não possui dados salvos, mas encontramos seu progresso no ${candidateSourceLabel}. Deseja restaurar e sincronizar esses dados na nuvem agora?`,
                onConfirm: () => {
                  get().saveToCloud({ allowEmptyOverwrite: true });
                }
              }
            });
            get().syncDayRollover();
            get().checkAndResetWeekly();
            get().checkAndAdvanceSeason();
            get().checkAndResetDailyMissions();
            return true;
          }

          // Conta genuinamente nova e sem dados locais prévios
          console.log('ℹ️ [Nuvem] Nova conta confirmada! Inicializando perfil limpo para uso.');
          const freshState = getCleanInitialState();
          set({
            ...freshState,
            caveiraQuestions: get().caveiraQuestions || [],
            lastSyncedAt: null,
            hasCompletedInitialCloudSync: true
          });
          get().syncDayRollover();
          get().checkAndResetWeekly();
          get().checkAndAdvanceSeason();
          get().checkAndResetDailyMissions();
          set({ isSyncing: false, isLoadingFromCloud: false });
          await get().saveToCloud({ allowEmptyOverwrite: true });
          return true;
        } catch (error) {
          if (retryCount < 2) {
            console.warn(`⚠️ [Nuvem] Tentativa ${retryCount + 1} falhou (ou timeout). Tentando novamente...`);
            return await get().loadFromCloud(retryCount + 1);
          }
          console.error('❌ [Nuvem] Falha após retentativas:', error.message);
          
          // Tentar carregar do snapshot local mais recente ou do backup local
          try {
            const localSnap = readLocalSnapshot();
            const backupsJson = localStorage.getItem('prf_qg_backups');
            const backups = backupsJson ? JSON.parse(backupsJson) : [];
            const latestBackup = (backups || []).find(b => b?.data && hasMeaningfulUserData(b.data)) || backups?.[0] || null;

            const snapTs = localSnap?.savedAt ? new Date(localSnap.savedAt).getTime() : 0;
            const backupTs = latestBackup?.timestamp ? Number(latestBackup.timestamp) : 0;

            const snapMeaningful = hasMeaningfulUserData(localSnap?.data);
            const backupMeaningful = hasMeaningfulUserData(latestBackup?.data);

            let chosenRaw = null;
            let chosenDateStr = null;
            if (snapMeaningful && (!backupMeaningful || snapTs >= backupTs)) {
              chosenRaw = localSnap.data;
              chosenDateStr = localSnap.savedAt ? new Date(localSnap.savedAt).toLocaleString() : null;
            } else if (backupMeaningful) {
              chosenRaw = latestBackup.data;
              chosenDateStr = latestBackup.timestamp ? new Date(latestBackup.timestamp).toLocaleString() : null;
            } else if (localSnap?.data || latestBackup?.data) {
              chosenRaw = (snapTs >= backupTs && localSnap?.data) ? localSnap.data : latestBackup?.data;
              chosenDateStr = (snapTs >= backupTs && localSnap?.savedAt)
                ? new Date(localSnap.savedAt).toLocaleString()
                : (latestBackup ? new Date(latestBackup.timestamp).toLocaleString() : null);
            }

            if (chosenRaw) {
              console.log(`💡 [Estado Offline] Carregando dados locais de ${chosenDateStr}`);
              const cleanData = normalizeHydratedState(chosenRaw, get().caveiraQuestions || []);
              set({ ...cleanData, hasCompletedInitialCloudSync: true });
              get().syncDayRollover();
              get().checkAndResetWeekly();
              get().checkAndAdvanceSeason();
              get().checkAndResetDailyMissions();
              set({ isSyncing: false, isLoadingFromCloud: false });

              toast.info(`⚠️ Usando dados salvos localmente (${chosenDateStr}) devido a erro de conexão.`);
              return true;
            }
          } catch (backupErr) {
            console.error("Falha ao restaurar dados locais:", backupErr);
          }

          toast.error("O Supabase está demorando para responder. Tente atualizar a página (F5).");
        } finally {
          if (retryCount === 0 || retryCount >= 2 || !get().isLoadingFromCloud) {
             set({ isSyncing: false, isLoadingFromCloud: false });
          }
        }
        return false;
      },

      saveToCloud: async (options = {}) => {
        const { allowEmptyOverwrite = false } = options || {};
        const { user, isLoadingFromCloud, isSavingToCloud, hasCompletedInitialCloudSync, lastSyncedAt, ...state } = get();
        if (!user || isLoadingFromCloud) return;
        if (!hasCompletedInitialCloudSync && !allowEmptyOverwrite) {
          console.warn('🛑 [Nuvem] Auto-save bloqueado antes da sincronização inicial concluir.');
          return;
        }

        // A2: Se um save já está em andamento, não descarta: marca savePending para rodar logo após o término
        if (isSavingToCloud) {
          useStore._savePending = true;
          set({ savePending: true, hasUnsyncedChanges: true });
          return;
        }

        clearTimeout(useStore._localDebounceTimer);
        clearTimeout(useStore._debounceTimer);
        clearTimeout(useStore._retryTimer);

        const buildPayload = (srcState) => {
          const payload = {};
          PERSISTED_KEYS.forEach(key => { if (srcState[key] !== undefined) payload[key] = srcState[key]; });
          payload._keyTimestamps = { ...(useStore._keyTimestamps || {}) };
          return payload;
        };

        let dataToSave = buildPayload(state);
        if (!allowEmptyOverwrite && useStore._lastKnownCloudWasMeaningful && !hasMeaningfulUserData(dataToSave)) {
          console.error('🛑 [Proteção de Dados] Bloqueada gravação automática vazia sobre nuvem com dados!');
          toast.error('Proteção ativada: evitamos sobrescrever seus dados na nuvem com um estado vazio.');
          return;
        }

        set({ isSavingToCloud: true });
        console.log('📤 [Nuvem] Despachando dados para o servidor...');
        const newUpdatedAt = new Date().toISOString();
        let finalSyncedAt = newUpdatedAt;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        let timeoutId;

        try {
          // Timeout de 5 segundos com AbortController
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              controller?.abort();
              reject(new Error("Timeout Nuvem"));
            }, 5000);
          });

          const savePromise = (async () => {
            // A3: Trava otimista usando .eq('updated_at', lastSyncedAt) quando já temos lastSyncedAt
            let updateQuery = supabase
              .from('profiles')
              .update({ full_data: dataToSave, updated_at: newUpdatedAt })
              .eq('id', user.id);
            if (lastSyncedAt) {
              updateQuery = updateQuery.eq('updated_at', lastSyncedAt);
            }
            if (controller && typeof updateQuery.abortSignal === 'function') {
              updateQuery = updateQuery.abortSignal(controller.signal);
            }

            const { data: updateData, error: updateError } = await updateQuery.select('updated_at');
            if (updateError) throw updateError;
            if (updateData && updateData.length > 0 && updateData[0]?.updated_at) {
              finalSyncedAt = updateData[0].updated_at;
            }

            // Se 0 linhas foram afetadas: ou o perfil ainda não existe, ou houve conflito de concorrência
            if (!updateData || updateData.length === 0) {
              let checkQuery = supabase
                .from('profiles')
                .select('full_data, updated_at')
                .eq('id', user.id)
                .limit(1);
              if (controller && typeof checkQuery.abortSignal === 'function') {
                checkQuery = checkQuery.abortSignal(controller.signal);
              }
              const { data: existingRows, error: checkErr } = await checkQuery;
              if (checkErr) throw checkErr;

              if (!existingRows || existingRows.length === 0) {
                // Perfil ainda não existe: faz o insert inicial
                let insertQuery = supabase
                  .from('profiles')
                  .insert({ id: user.id, full_data: dataToSave, updated_at: newUpdatedAt })
                  .select('updated_at');
                if (controller && typeof insertQuery.abortSignal === 'function') {
                  insertQuery = insertQuery.abortSignal(controller.signal);
                }
                const { data: insData, error: insertError } = await insertQuery;
                if (insertError) throw insertError;
                if (insData?.[0]?.updated_at) finalSyncedAt = insData[0].updated_at;
              } else {
                // Conflito real: outro dispositivo atualizou updated_at. Faz merge por chave sem descartar alterações locais!
                const remoteRow = existingRows[0];
                const remoteUpdatedAt = remoteRow.updated_at || null;
                const mergedRaw = mergeCloudAndLocalData(
                  remoteRow.full_data || {},
                  dataToSave,
                  useStore._keyTimestamps || {},
                  remoteUpdatedAt,
                  lastSyncedAt
                );
                const normalizedMerged = normalizeHydratedState(mergedRaw, get().caveiraQuestions || []);
                dataToSave = {
                  ...normalizedMerged,
                  _keyTimestamps: mergedRaw._keyTimestamps || {}
                };
                finalSyncedAt = new Date().toISOString();

                let conflictUpdateQuery = supabase
                  .from('profiles')
                  .update({ full_data: dataToSave, updated_at: finalSyncedAt })
                  .eq('id', user.id);
                if (remoteUpdatedAt) {
                  conflictUpdateQuery = conflictUpdateQuery.eq('updated_at', remoteUpdatedAt);
                }
                if (controller && typeof conflictUpdateQuery.abortSignal === 'function') {
                  conflictUpdateQuery = conflictUpdateQuery.abortSignal(controller.signal);
                }
                const { data: conflictData, error: conflictErr } = await conflictUpdateQuery.select('updated_at');
                if (conflictErr) throw conflictErr;
                if (conflictData?.[0]?.updated_at) finalSyncedAt = conflictData[0].updated_at;

                set({ ...normalizedMerged });
                toast.info('🔄 Sincronizado com outro dispositivo preservando suas alterações locais.', { id: 'sync-merge-toast' });
              }
            }
          })();

          await Promise.race([savePromise, timeoutPromise]).finally(() => clearTimeout(timeoutId));

          // Atualiza a baseline de sincronização após gravação bem-sucedida
          useStore._retryCount = 0;
          useStore._unsyncedToastShown = false;
          if (hasMeaningfulUserData(dataToSave)) {
            useStore._lastKnownCloudWasMeaningful = true;
          }
          set({ lastSyncedAt: finalSyncedAt, hasUnsyncedChanges: false });
          writeLocalSnapshot(get(), {
            dirty: false,
            savedAt: finalSyncedAt,
            keyTimestamps: useStore._keyTimestamps || {}
          });

          // Backup local automático (só adiciona se tiver dados reais, preservando últimos 5 backups íntegros)
          appendLocalBackup(dataToSave, 'cloud_sync');

          toast.success("Nuvem atualizada! ☁️", { duration: 800 });
        } catch (error) {
          clearTimeout(timeoutId);
          // A3: Em caso de timeout/abort, relê o updated_at remoto para checar se o servidor concluiu a gravação
          let recoveredFromTimeout = false;
          try {
            const { data: verifyData } = await supabase
              .from('profiles')
              .select('updated_at')
              .eq('id', user.id)
              .limit(1);
            const verifyTs = verifyData?.[0]?.updated_at ? new Date(verifyData[0].updated_at).getTime() : 0;
            const sentTs = newUpdatedAt ? new Date(newUpdatedAt).getTime() : 0;
            if (verifyTs > 0 && sentTs > 0 && verifyTs === sentTs) {
              finalSyncedAt = verifyData[0].updated_at;
              recoveredFromTimeout = true;
              useStore._retryCount = 0;
              useStore._unsyncedToastShown = false;
              set({ lastSyncedAt: finalSyncedAt, hasUnsyncedChanges: false });
              writeLocalSnapshot(get(), {
                dirty: false,
                savedAt: finalSyncedAt,
                keyTimestamps: useStore._keyTimestamps || {}
              });
            }
          } catch (_) {}

          if (!recoveredFromTimeout) {
            console.error('❌ [Nuvem] Erro no Upload:', error.message);
            set({ hasUnsyncedChanges: true });
            writeLocalSnapshot(get(), {
              dirty: true,
              savedAt: new Date().toISOString(),
              keyTimestamps: useStore._keyTimestamps || {}
            });

            // A2: Backoff de retentativa automática (5 s, 15 s, 60 s) e aviso discreto único
            const retryDelays = [5000, 15000, 60000];
            const attempt = Math.min(useStore._retryCount || 0, retryDelays.length - 1);
            const delayMs = retryDelays[attempt];
            useStore._retryCount = (useStore._retryCount || 0) + 1;

            if (!useStore._unsyncedToastShown) {
              useStore._unsyncedToastShown = true;
              toast.warning('⚠️ Alterações não sincronizadas (salvas no dispositivo). Tentando reenviar...', {
                id: 'unsynced-changes-toast',
                duration: 4000
              });
            }

            clearTimeout(useStore._retryTimer);
            useStore._retryTimer = setTimeout(() => {
              get().saveToCloud();
            }, delayMs);
          }
        } finally {
          set({ isSavingToCloud: false });
          // A2: Se houve alteração enquanto salvava, dispara novo save imediatamente
          if (useStore._savePending) {
            useStore._savePending = false;
            set({ savePending: false });
            clearTimeout(useStore._debounceTimer);
            useStore._debounceTimer = setTimeout(() => {
              get().saveToCloud();
            }, 100);
          }
        }
      },

      getPendingReviews: () => {
        const { reviews, getLocalDateStr } = get();
        const today = getLocalDateStr();
        return reviews.filter(r => r.nextDateStr <= today);
      },

      // --- SETTERS BÁSICOS ---
      setSubjects: (subjects) => set((state) => ({ subjects: typeof subjects === 'function' ? subjects(state.subjects) : subjects })),
      updateSubject: (subjectId, updates) => set((state) => {
        const sub = state.subjects[subjectId];
        if (!sub) return state;
        return {
          subjects: {
            ...state.subjects,
            [subjectId]: {
              ...sub,
              ...(typeof updates === 'function' ? updates(sub) : updates)
            }
          }
        };
      }),
      setSubjectSpeed: (subjectId, speed) => set((state) => {
        const sub = state.subjects[subjectId];
        if (!sub) return state;
        return {
          subjects: {
            ...state.subjects,
            [subjectId]: {
              ...sub,
              speed: Number(speed) || 1
            }
          }
        };
      }),
      setCycleSlotCounts: (cycleSlotCounts) => set({ cycleSlotCounts }),
      setDayOverride: (dateStr, subjectIds, slotCounts = []) => set(state => ({
        calendarOverrides: {
          ...(state.calendarOverrides || {}),
          [dateStr]: subjectIds
        },
        calendarOverrideCounts: {
          ...(state.calendarOverrideCounts || {}),
          [dateStr]: Array.isArray(slotCounts) ? [...slotCounts] : []
        }
      })),
      removeDayOverride: (dateStr) => set(state => {
        const next = { ...(state.calendarOverrides || {}) };
        const nextCounts = { ...(state.calendarOverrideCounts || {}) };
        delete next[dateStr];
        delete nextCounts[dateStr];
        return { calendarOverrides: next, calendarOverrideCounts: nextCounts };
      }),
      addFutureScheduleRule: ({ fromDate, dayOfWeek, cycleIndex, daySlots, slotCounts = [] }) => set(state => {
        if (!fromDate || !Array.isArray(daySlots)) return state;
        const isWeekly = (state.cycleScheduleType || 'weekly') === 'weekly';
        const nextCycle = isWeekly
          ? Array.from({ length: 7 }, (_, i) => Array.isArray(state.cycle?.[i]) ? [...state.cycle[i]] : [])
          : [...(state.cycle || [])];
        const nextCycleSlotCounts = isWeekly
          ? Array.from({ length: 7 }, (_, i) => Array.isArray(state.cycleSlotCounts?.[i]) ? [...state.cycleSlotCounts[i]] : [])
          : [...(state.cycleSlotCounts || [])];

        const hadPriorRuleForDay = (state.futureScheduleRules || []).some(r => {
          if (!r || r.v !== 2 || !r.fromDate || r.fromDate >= fromDate) return false;
          return (isWeekly && r.dayOfWeek !== undefined && dayOfWeek !== undefined)
            ? r.dayOfWeek === dayOfWeek
            : (r.dayOfWeek === dayOfWeek || r.cycleIndex === cycleIndex);
        });

        const targetIdx = isWeekly
          ? ((state.cycleWeekStart === 'monday' && dayOfWeek !== undefined) ? (dayOfWeek + 6) % 7 : (cycleIndex ?? dayOfWeek))
          : cycleIndex;

        if (targetIdx !== undefined && targetIdx >= 0 && (!nextCycle[targetIdx] || nextCycle[targetIdx].length === 0) && !hadPriorRuleForDay) {
          nextCycle[targetIdx] = [...daySlots];
          nextCycleSlotCounts[targetIdx] = Array.isArray(slotCounts) ? [...slotCounts] : [];
        }

        return {
          cycle: nextCycle,
          cycleSlotCounts: nextCycleSlotCounts,
          futureScheduleRules: [
            ...(state.futureScheduleRules || []).filter(r => {
              if (!r || r.v !== 2 || !r.fromDate) return false;
              const sameDay = (isWeekly && r.dayOfWeek !== undefined && dayOfWeek !== undefined)
                ? r.dayOfWeek === dayOfWeek
                : (r.dayOfWeek === dayOfWeek || r.cycleIndex === cycleIndex);
              return !(sameDay && r.fromDate >= fromDate);
            }),
            {
              id: 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
              v: 2,
              fromDate,
              dayOfWeek,
              cycleIndex,
              daySlots: [...daySlots],
              slotCounts: Array.isArray(slotCounts) ? [...slotCounts] : []
            }
          ]
        };
      }),
      removeFutureScheduleRule: (ruleId) => set(state => ({
        futureScheduleRules: (state.futureScheduleRules || []).filter(r => r && r.v === 2 && r.id !== ruleId)
      })),
      setCycle: (cycle) => set((state) => ({ cycle: typeof cycle === 'function' ? cycle(state.cycle) : cycle })),
      setCycleScheduleType: (cycleScheduleType) => set({ cycleScheduleType }),
      setCycleWeekStart: (cycleWeekStart) => set({ cycleWeekStart }),
      setCycleDayNames: (cycleDayNames) => set((state) => ({ 
        cycleDayNames: typeof cycleDayNames === 'function' ? cycleDayNames(state.cycleDayNames || []) : cycleDayNames 
      })),
      fillFullWeekCycle: (weekStart = null) => {
        const state = get();
        const start = weekStart || state.cycleWeekStart || 'sunday';
        const current = [...(state.cycle || [])];
        const newCycle = [];
        for (let i = 0; i < 7; i++) {
          newCycle.push(current[i] || []);
        }
        set({
          cycle: newCycle,
          cycleScheduleType: 'weekly',
          cycleWeekStart: start
        });
      },
      getWeekdayName: (dayIndex) => {
        const { cycleWeekStart, cycleDayNames } = get();
        if (cycleDayNames && cycleDayNames[dayIndex]) {
          return cycleDayNames[dayIndex];
        }
        const fullNamesSunday = [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado'
        ];
        const fullNamesMonday = [
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
          'Domingo'
        ];
        const list = cycleWeekStart === 'monday' ? fullNamesMonday : fullNamesSunday;
        return list[dayIndex % 7] || `Dia ${dayIndex + 1}`;
      },
      setCoins: (coins) => set((state) => ({ coins: typeof coins === 'function' ? coins(state.coins) : coins })),
      setUserStats: (userStats) => set((state) => ({ userStats: typeof userStats === 'function' ? userStats(state.userStats) : userStats })),
      setStreakData: (streakData) => set((state) => ({ streakData: typeof streakData === 'function' ? streakData(state.streakData) : streakData })),
      setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
      setPushTime: (time) => set({ pushTime: time }),
      
      getTodayDate: () => {
        const today = get().getLocalDateStr();
        return new Date(`${today}T12:00:00`);
      },

      // --- MOTOR FSRS v6 (21 PARÂMETROS) ---
      // Pesos padrão otimizados para v6
      fsrs_w: [
        0.4025, 1.4612, 3.3458, 15.6965, // S0
        5.8659, 1.3411, 1.0142,          // D0, D_change
        0.2233, 2.3081, 0.1332, 1.0772,  // Success Stability terms
        2.2131, 0.1174, 0.3134, 1.5852,  // Failure Stability terms
        0.2272, 2.8804,                  // Unused/Metadata
        0.449, 1.66,                     // Curve Shape
        0.44, 0.98, 0.58                 // Extra/Revised weights for v6 (21 total)
      ],
      retention_target: 0.88,

      calculateNextInterval: (stability) => {
        const { retention_target } = get();
        // Fórmula de intervalo FSRS: S * ( (R^-1/w18 - 1) / (0.9^-1/w18 - 1) )
        // Simplificada para w18 = -0.5 (padrão): S * (R - 1) / (0.9 - 1)
        // Aqui usamos a fórmula direta de v6
        const interval = stability * (Math.pow(retention_target, 1 / -0.5) - 1) / (Math.pow(0.9, 1 / -0.5) - 1);
        return Math.max(1, Math.round(interval));
      },

      updateFsrsCard: (card, rating) => {
        const { fsrs_w, getTodayDate } = get();
        const w = fsrs_w;
        const g = rating; // 1: Again, 2: Hard, 3: Good, 4: Easy
        
        let s = card.stability || 0;
        let d = card.difficulty || 0;
        const today = getTodayDate();
        const lastDateObj = card.lastReviewDate ? new Date(card.lastReviewDate) : today;
        const lastLocalNoon = isNaN(lastDateObj.getTime())
          ? today
          : new Date(lastDateObj.getFullYear(), lastDateObj.getMonth(), lastDateObj.getDate(), 12, 0, 0);
        const t = Math.max(0, Math.round((today - lastLocalNoon) / (1000 * 60 * 60 * 24)));

        // Probabilidade de Retenção Atual (R) baseado no Fator Exato para 90% em t=S
        const factor = Math.pow(0.9, 1 / -0.5) - 1; 
        const retrievability = s === 0 ? 1 : Math.pow(1 + factor * t / s, -0.5);

        if (s === 0) {
          // Inicialização (Primeira Vez)
          s = w[g - 1];
          d = Math.min(10, Math.max(1, w[4] - w[5] * (g - 3)));
        } else {
          // Atualização de Dificuldade
          d = d - w[6] * (g - 3);
          d = Math.min(10, Math.max(1, d + w[6] * (w[4] - d) / 10)); // Mean reversion

          if (g > 1) {
            // Sucesso (com penalidade Hard w[15] e bônus Easy w[16])
            // Se t === 0 (revisão adiantada ou no mesmo dia), garante ganho mínimo discreto em vez de 0
            const effectiveR = t === 0 ? Math.min(retrievability, 0.92) : retrievability;
            const hardPenalty = g === 2 ? w[15] : 1;
            const easyBonus = g === 4 ? w[16] : 1;
            const s_growth = 1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - effectiveR)) - 1) * hardPenalty * easyBonus;
            s = s * s_growth;
          } else {
            // Falha (Again)
            const s_forget = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
            s = Math.min(s, s_forget);
          }
        }

        return {
          stability: s,
          difficulty: d,
          nextInterval: get().calculateNextInterval(s),
          lastReviewDate: today.toISOString()
        };
      },
      setWeeklySprint: (weeklySprint) => set((state) => ({ weeklySprint: typeof weeklySprint === 'function' ? weeklySprint(state.weeklySprint) : weeklySprint })),
      setReviews: (reviews) => set((state) => ({ reviews: typeof reviews === 'function' ? reviews(state.reviews) : reviews })),
      setReviewStats: (reviewStats) => set((state) => ({ reviewStats: typeof reviewStats === 'function' ? reviewStats(state.reviewStats) : reviewStats })),
      setSimulados: (simulados) => set((state) => ({ simulados: typeof simulados === 'function' ? simulados(state.simulados) : simulados })),
      setTafHistory: (tafHistory) => set((state) => ({ tafHistory: typeof tafHistory === 'function' ? tafHistory(state.tafHistory) : tafHistory })),
      setTafTrainingStatus: (tafTrainingStatus) => set({ tafTrainingStatus }),
      setGlobalModal: (globalModal) => set({ globalModal }),
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
      setTargetExamDate: (targetExamDate) => set({ targetExamDate }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setCurrentDayIndex: (currentDayIndex) => set({ currentDayIndex }),
      setCompletedToday: (completedToday) => set((state) => {
        const today = state.getLocalDateStr();
        // Se a data guardada não é hoje, o valor anterior é de outro dia e nunca deve ser considerado.
        const base = state.completedTodayDate === today ? (state.completedToday || []) : [];
        return {
          completedToday: typeof completedToday === 'function' ? completedToday(base) : completedToday,
          completedTodayDate: today
        };
      }),
      resetCycleCarryover: () => set({ cycleCarryoverOffset: 0 }),

      // Detecta a virada do dia real: zera os blocos concluídos de ontem e atualiza a chave de "hoje".
      syncDayRollover: () => {
        const state = get();
        const today = state.getLocalDateStr();
        const patch = {};
        if (state.todayKey !== today) patch.todayKey = today;
        if (state.completedTodayDate !== today) {
          patch.completedToday = [];
          patch.completedTodayDate = today;
        }

        // Carryover automático no modo semanal: se um dia programado não foi estudado, empurra a grade para frente.
        if (state.cycleScheduleType === 'weekly') {
          const {
            lastCarryoverCheckDate,
            cycleCarryoverOffset = 0,
            studyHistory = {},
            calendarOverrides = {},
            futureScheduleRules = [],
            cycle = [],
            cycleWeekStart = 'sunday'
          } = state;

          const formatLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const [ty, tm, td] = today.split('-').map(Number);
          const todayObj = new Date(ty, tm - 1, td);
          const yesterdayObj = new Date(ty, tm - 1, td - 1);
          const yesterdayStr = formatLocal(yesterdayObj);

          const hadScheduledStudyOnDate = (dateObj, dateStr, currentOffset) => {
            if (calendarOverrides && Array.isArray(calendarOverrides[dateStr])) {
              return calendarOverrides[dateStr].length > 0;
            }
            const dow = dateObj.getDay();
            const rawIdx = cycleWeekStart === 'monday' ? (dow + 6) % 7 : dow;
            const effIdx = ((rawIdx - currentOffset) % 7 + 7) % 7;
            const effDow = (dow - (currentOffset % 7) + 7) % 7;
            const matchingRules = (futureScheduleRules || [])
              .filter(r => {
                if (!r || r.v !== 2 || !r.fromDate || r.fromDate > dateStr) return false;
                if (r.dayOfWeek !== undefined) return r.dayOfWeek === effDow;
                return r.cycleIndex === effIdx;
              })
              .sort((a, b) => b.fromDate.localeCompare(a.fromDate));
            if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
              return matchingRules[0].daySlots.length > 0;
            }
            return Array.isArray(cycle?.[effIdx]) && cycle[effIdx].length > 0;
          };

          if (!lastCarryoverCheckDate) {
            const hasPriorStudy = Object.entries(studyHistory || {}).some(([d, m]) => d < today && Number(m) > 0);
            if (hasPriorStudy && hadScheduledStudyOnDate(yesterdayObj, yesterdayStr, cycleCarryoverOffset)) {
              if ((studyHistory?.[yesterdayStr] || 0) <= 0) {
                patch.cycleCarryoverOffset = (cycleCarryoverOffset + 1) % 7;
              }
            }
            patch.lastCarryoverCheckDate = today;
          } else if (lastCarryoverCheckDate < today) {
            const [ly, lm, ld] = String(lastCarryoverCheckDate).split('-').map(Number);
            let cursor = new Date(ly, lm - 1, ld);
            const minStart = new Date(ty, tm - 1, td - 14);
            if (cursor < minStart) cursor = minStart;

            let nextOffset = cycleCarryoverOffset;
            while (cursor < todayObj) {
              const dStr = formatLocal(cursor);
              if ((studyHistory?.[dStr] || 0) > 0) {
                nextOffset = 0;
              } else if (hadScheduledStudyOnDate(cursor, dStr, nextOffset)) {
                nextOffset = (nextOffset + 1) % 7;
              }
              cursor.setDate(cursor.getDate() + 1);
            }
            if (nextOffset !== cycleCarryoverOffset) {
              patch.cycleCarryoverOffset = nextOffset;
            }
            patch.lastCarryoverCheckDate = today;
          }
        } else if (state.lastCarryoverCheckDate !== today) {
          patch.lastCarryoverCheckDate = today;
        }

        if (Object.keys(patch).length === 0) return false;
        set(patch);
        return true;
      },
      setCalendarDate: (calendarDate) => set({ calendarDate }),
      setReviewCalendarDate: (reviewCalendarDate) => set({ reviewCalendarDate }),
      setSeasonalData: (seasonalData) => set((state) => ({ seasonalData: typeof seasonalData === 'function' ? seasonalData(state.seasonalData) : seasonalData })),
      setWeeklyMissions: (weeklyMissions) => set((state) => ({ weeklyMissions: typeof weeklyMissions === 'function' ? weeklyMissions(state.weeklyMissions) : weeklyMissions })),
      setReviewModal: (reviewModal) => set({ reviewModal }),
      setClassConfirmModal: (classConfirmModal) => set({ classConfirmModal }),
      setReplaceSubjectModal: (replaceSubjectModal) => set({ replaceSubjectModal }),
      setEnableSounds: (enableSounds) => set({ enableSounds }),

      // --- SINALIZADOR DE ÁUDIO NO NAVEGADOR ---
      playSound: (type) => {
        const { enableSounds } = get();
        if (!enableSounds) return;
        
        const sounds = {
          xp: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
          coin: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
          levelUp: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
          click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
        };
        
        const url = sounds[type];
        if (url) {
          const audio = new Audio(url);
          audio.volume = 0.4;
          audio.play().catch(() => {}); // Ignora erro de auto-play bloqueado
        }
      },

      // --- SISTEMA MASCOTE K9 / POU TÁTICO ---
      feedPet: (foodId) => {
        const food = PET_FOODS.find(f => f.id === foodId);
        if (!food) return false;

        const { petData, playSound } = get();
        const currentInv = petData?.foodInventory?.[foodId] || 0;
        if (currentInv <= 0) return false;
        
        let newInv = { ...(petData?.foodInventory || {}) };
        newInv[foodId] = currentInv - 1;

        const newHunger = Math.min(100, (petData?.hunger || 0) + food.hunger);
        const newEnergy = Math.min(100, (petData?.energy || 0) + food.energy);
        const newXp = (petData?.xp || 0) + 15;
        
        let newLevel = petData?.level || 1;
        const nextLvl = PET_LEVELS.find(l => l.level === newLevel + 1);
        if (nextLvl && newXp >= nextLvl.minXp) {
          newLevel += 1;
          playSound('levelUp');
          toast.success(`🎉 O ${petData?.name || 'Mascote'} subiu para a patente: ${nextLvl.name}!`);
        } else {
          playSound('click');
        }

        set({
          petData: {
            ...petData,
            hunger: newHunger,
            energy: newEnergy,
            xp: newXp,
            level: newLevel,
            foodInventory: newInv,
            totalCareCount: (petData?.totalCareCount || 0) + 1
          }
        });
        return true;
      },

      buyPetFood: (foodId, count = 1) => {
        const food = PET_FOODS.find(f => f.id === foodId);
        if (!food) return false;
        const totalCost = food.cost * count;
        const { coins, petData, setCoins, playSound } = get();
        if (coins < totalCost) return false;

        setCoins(c => c - totalCost);
        playSound('coin');

        const currentInv = petData?.foodInventory?.[foodId] || 0;
        const newInv = {
          ...(petData?.foodInventory || {}),
          [foodId]: currentInv + count
        };

        set({
          petData: {
            ...petData,
            foodInventory: newInv
          }
        });
        return true;
      },

      washPet: () => {
        const { petData, playSound } = get();
        playSound('click');
        const newXp = (petData?.xp || 0) + 10;
        let newLevel = petData?.level || 1;
        const nextLvl = PET_LEVELS.find(l => l.level === newLevel + 1);
        if (nextLvl && newXp >= nextLvl.minXp) {
          newLevel += 1;
          playSound('levelUp');
          toast.success(`🎉 O ${petData?.name || 'Mascote'} subiu para a patente: ${nextLvl.name}!`);
        }

        set({
          petData: {
            ...petData,
            hygiene: 100,
            xp: newXp,
            level: newLevel,
            totalCareCount: (petData?.totalCareCount || 0) + 1
          }
        });
      },

      togglePetSleep: () => {
        const { petData, playSound } = get();
        playSound('click');
        const willSleep = !petData?.isSleeping;
        set({
          petData: {
            ...petData,
            isSleeping: willSleep,
            energy: willSleep ? Math.min(100, (petData?.energy || 0) + 35) : petData?.energy
          }
        });
      },

      petThePet: () => {
        const { petData, playSound } = get();
        playSound('click');
        const newFun = Math.min(100, (petData?.fun || 0) + 8);
        const newXp = (petData?.xp || 0) + 5;
        let newLevel = petData?.level || 1;
        const nextLvl = PET_LEVELS.find(l => l.level === newLevel + 1);
        if (nextLvl && newXp >= nextLvl.minXp) {
          newLevel += 1;
          playSound('levelUp');
          toast.success(`🎉 O ${petData?.name || 'Mascote'} subiu para a patente: ${nextLvl.name}!`);
        }

        set({
          petData: {
            ...petData,
            fun: newFun,
            xp: newXp,
            level: newLevel,
            totalCareCount: (petData?.totalCareCount || 0) + 1
          }
        });
      },

      playWithPet: (score = 100, coinsEarned = 0) => {
        const { petData, setCoins, playSound } = get();
        if (coinsEarned > 0) {
          setCoins(c => c + coinsEarned);
          playSound('coin');
        }

        const xpEarned = Math.max(15, Math.floor(score / 20));
        const newXp = (petData?.xp || 0) + xpEarned;
        let newLevel = petData?.level || 1;
        const nextLvl = PET_LEVELS.find(l => l.level === newLevel + 1);
        if (nextLvl && newXp >= nextLvl.minXp) {
          newLevel += 1;
          playSound('levelUp');
          toast.success(`🎉 O ${petData?.name || 'Mascote'} subiu para a patente: ${nextLvl.name}!`);
        }

        set({
          petData: {
            ...petData,
            fun: 100,
            energy: Math.max(10, (petData?.energy ?? 100) - 15),
            xp: newXp,
            level: newLevel
          }
        });
      },

      equipPetItem: (category, itemId) => {
        const { petData, playSound } = get();
        playSound('click');
        set({
          petData: {
            ...petData,
            [category]: itemId
          }
        });
      },

      buyPetAccessory: (item) => {
        const { coins, petData, setCoins, playSound } = get();
        if (coins < item.cost) return false;
        
        setCoins(c => c - item.cost);
        playSound('coin');

        const unlocked = [...(petData?.unlockedItems || [])];
        if (!unlocked.includes(item.id)) {
          unlocked.push(item.id);
        }

        set({
          petData: {
            ...petData,
            unlockedItems: unlocked,
            [item.type]: item.id.replace(`${item.type}:`, '')
          }
        });
        toast.success(`🎉 ${item.name} adquirido e equipado no K9!`);
        return true;
      },

      renamePet: (name) => {
        const { petData } = get();
        set({
          petData: {
            ...petData,
            name: name
          }
        });
      },

      boostPetWithStudy: (studyType = 'class') => {
        const { petData } = get();
        if (!petData) return;
        const xpBoost = studyType === 'class' ? 25 : studyType === 'review' ? 15 : 20;
        const newFun = Math.min(100, (petData?.fun || 0) + 15);
        const newXp = (petData?.xp || 0) + xpBoost;
        let newLevel = petData?.level || 1;
        const nextLvl = PET_LEVELS.find(l => l.level === newLevel + 1);
        if (nextLvl && newXp >= nextLvl.minXp) {
          newLevel += 1;
        }

        set({
          petData: {
            ...petData,
            fun: newFun,
            xp: newXp,
            level: newLevel
          }
        });
      },

      // --- SISTEMA RAIO-X PROJETO CAVEIRA ---
      resolveCaveiraSubject: (question, subjects = {}) => {
        const norm = (str) => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const rawSub = String(question?.subject || question?.canonicalSubject || '').trim();
        const rawTop = String(question?.topic || '').trim();
        const s = norm(rawSub);
        const t = norm(rawTop);
        const c = norm(question?.content || '');
        const full = `${s} ${t} ${c}`;

        let canonical = rawSub && rawSub !== 'Geral' ? rawSub : '';
        if (s.includes('informatica') || t.includes('informatica') || t.includes('seguranca da informacao') || t.includes('computacao em nuvem') || t.includes('redes de computadores')) {
          canonical = 'Informática';
        } else if (s.includes('portugues') || s.includes('lingua portuguesa')) {
          canonical = 'Língua Portuguesa';
        } else if (s.includes('raciocinio logico') || s.includes('rlm') || s.includes('matematica')) {
          canonical = 'Raciocínio Lógico-Matemático';
        } else if (s.includes('fisica')) {
          canonical = 'Física';
        } else if (s.includes('etica')) {
          canonical = 'Ética e Cidadania';
        } else if (s.includes('geopolitica')) {
          canonical = 'Geopolítica';
        } else if (s.includes('ingles') || s.includes('espanhol') || s.includes('lingua estrangeira')) {
          canonical = 'Língua Estrangeira';
        } else if (s.includes('transito') || s.includes('ctb') || s.includes('contran')) {
          canonical = (full.includes('contran') || full.includes('resolucao')) ? 'Resoluções do CONTRAN' : 'Legislação de Trânsito (CTB)';
        } else if (s.includes('constitucional')) {
          canonical = 'Direito Constitucional';
        } else if (s.includes('administrativo')) {
          canonical = 'Direito Administrativo';
        } else if (s.includes('processual penal') || s.includes('processo penal')) {
          canonical = 'Direito Processual Penal';
        } else if (s.includes('penal especial') || s.includes('legislacao especial') || s.includes('leis especiais')) {
          canonical = 'Legislação Penal Especial';
        } else if (s.includes('direitos humanos')) {
          canonical = 'Direitos Humanos';
        } else if (s.includes('direito penal')) {
          canonical = 'Direito Penal';
        } else if (s.includes('legislacao aplicada') || s.includes('policia civil') || s.includes('estatuto')) {
          canonical = rawSub.length > 32 ? 'Legislação Institucional' : rawSub;
        } else if (!canonical) {
          if (full.includes('informatica') || full.includes('seguranca da informacao') || full.includes('cloud computing')) canonical = 'Informática';
          else if (full.includes('transito') || full.includes('ctb') || full.includes('contran')) canonical = 'Legislação de Trânsito (CTB)';
          else if (full.includes('constitucional')) canonical = 'Direito Constitucional';
          else if (full.includes('administrativo')) canonical = 'Direito Administrativo';
          else if (full.includes('processo penal') || full.includes('inquerito')) canonical = 'Direito Processual Penal';
          else if (full.includes('direito penal')) canonical = 'Direito Penal';
          else canonical = rawTop && rawTop !== 'Geral' ? rawTop : 'Questão Caveira';
        }

        const normTarget = norm(canonical);
        const normRawSub = norm(rawSub);
        let matchedSubjectId = null;

        for (const [subId, sub] of Object.entries(subjects || {})) {
          const sNameNorm = norm(sub?.name || '');
          if (!sNameNorm || sNameNorm.length < 3) continue;
          if (
            (normTarget && (normTarget === sNameNorm || (sNameNorm.length >= 5 && (normTarget.includes(sNameNorm) || sNameNorm.includes(normTarget))))) ||
            (normRawSub && (normRawSub === sNameNorm || (sNameNorm.length >= 5 && (normRawSub.includes(sNameNorm) || sNameNorm.includes(normRawSub)))))
          ) {
            matchedSubjectId = subId;
            break;
          }
        }

        const fallbackSubjectId = 'caveira_sub_' + (normTarget.replace(/[^a-z0-9]+/g, '_') || 'geral');
        return {
          subjectId: matchedSubjectId || fallbackSubjectId,
          customSubjectName: canonical || rawSub || 'Questão Caveira'
        };
      },

      addCaveiraQuestion: (question) => {
        if (!question || !question.id) return false;
        const { caveiraQuestions = [], addXP, setCoins, boostPetWithStudy } = get();
        const existingIdx = caveiraQuestions.findIndex(q => q.id === question.id);
        
        let updatedList = [...caveiraQuestions];
        const isNew = existingIdx === -1;

        if (isNew) {
          updatedList.unshift(question);
          if (question.hit) {
            addXP(25, `Questão Caveira ${question.id} Acertada`);
            setCoins(c => c + 3);
          } else {
            addXP(10, `Questão Caveira ${question.id} Analisada`);
          }
          boostPetWithStudy('review');
        } else {
          updatedList[existingIdx] = { ...updatedList[existingIdx], ...question };
        }

        set({ caveiraQuestions: updatedList });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updatedList)); } catch (_) {}

        if (!question.hit) {
          get().createFsrsCardFromCaveira(updatedList.find(q => q.id === question.id) || question, true);
        }
        return true;
      },

      importCaveiraQuestions: (questionsList, silent = true) => {
        if (!Array.isArray(questionsList) || questionsList.length === 0) return 0;
        const { caveiraQuestions = [], addXP, setCoins } = get();
        
        const map = new Map();

        // Preserva existentes válidos
        caveiraQuestions.forEach(q => {
          if (!q || !q.id) return;
          map.set(q.id, q);
        });
        
        let newCount = 0;
        let updatedExisting = false;

        questionsList.forEach(q => {
          if (!q || !q.id) return;
          const prev = map.get(q.id);
          if (!prev) {
            newCount++;
            map.set(q.id, q);
          } else {
            if (
              prev.confidence !== q.confidence ||
              prev.errorReason !== q.errorReason ||
              prev.hit !== q.hit ||
              prev.subject !== q.subject ||
              prev.topic !== q.topic ||
              prev.userChoice !== q.userChoice ||
              prev.correctChoice !== q.correctChoice ||
              (!prev.alternatives && q.alternatives) ||
              (!prev.teacherComment && q.teacherComment)
            ) {
              updatedExisting = true;
            }
            map.set(q.id, {
              ...prev,
              ...q,
              teacherComment: q.teacherComment || prev.teacherComment || '',
              userNote: q.userNote || prev.userNote || ''
            });
          }
        });

        const merged = Array.from(map.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

        if (newCount === 0 && !updatedExisting && map.size === caveiraQuestions.length) {
          get().syncAndRepairCaveiraReviews?.();
          if (!silent) toast.info('As questões já estavam atualizadas no QG.');
          return 0;
        }
        
        if (newCount > 0) {
          addXP(newCount * 15, `${newCount} Questões Caveira Sincronizadas`);
          setCoins(c => c + Math.min(100, newCount * 2));
          toast.success(`🎯 ${newCount} novas questões do Projeto Caveira sincronizadas!`);
        } else if (!silent) {
          toast.success('🔄 Questões do Projeto Caveira sincronizadas com sucesso!');
        }

        set({ caveiraQuestions: merged });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(merged)); } catch (_) {}

        // Sincroniza, repara e agenda no FSRS todas as questões erradas sem duplicar
        get().syncAndRepairCaveiraReviews?.();
        return newCount;
      },

      updateCaveiraQuestion: (id, updates) => {
        const { caveiraQuestions = [] } = get();
        const updated = caveiraQuestions.map(q => q.id === id ? { ...q, ...updates } : q);
        set({ caveiraQuestions: updated });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updated)); } catch (_) {}
        get().syncAndRepairCaveiraReviews?.();
      },

      deleteCaveiraQuestion: (id) => {
        const { caveiraQuestions = [], reviews = [] } = get();
        const updated = caveiraQuestions.filter(q => q.id !== id);
        const filteredReviews = reviews.filter(r => !(r.caveiraQuestionId === id || String(r.id || '').includes(id) || String(r.topicName || '').includes(id)));
        set({ caveiraQuestions: updated, reviews: filteredReviews });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updated)); } catch (_) {}
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'DELETE_CAVEIRA_QUESTION', payload: { id } }, '*'); } catch (_) {}
        toast.success('Questão removida do histórico.');
      },

      clearCaveiraQuestions: () => {
        const { reviews = [] } = get();
        const filteredReviews = reviews.filter(r => !(r.isCaveiraQuestion || String(r.id || '').startsWith('rev_caveira_') || String(r.topicName || '').startsWith('[Caveira')));
        set({ caveiraQuestions: [], reviews: filteredReviews });
        try { localStorage.removeItem('prf_caveira_questions'); } catch (_) {}
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'CLEAR_SESSION' }, '*'); } catch (_) {}
        toast.info('Histórico do Raio-X Caveira limpo.');
      },

      advanceFutureReviews: (targetDateStr) => {
        const { reviews = [], getLocalDateStr, playSound } = get();
        const todayStr = getLocalDateStr();
        let movedCount = 0;
        const updatedReviews = reviews.map(r => {
          if (r.nextDateStr === targetDateStr && r.nextDateStr > todayStr) {
            movedCount++;
            return { ...r, nextDateStr: todayStr };
          }
          return r;
        });
        if (movedCount > 0) {
          set({ reviews: updatedReviews });
          playSound?.('coin');
          const [y, m, d] = targetDateStr.split('-');
          toast.success(`⚡ ${movedCount} ${movedCount === 1 ? 'revisão adiantada' : 'revisões adiantadas'} de ${d}/${m}/${y} para hoje!`);
        } else {
          toast.info('Nenhuma revisão pendente nesta data para adiantar.');
        }
        return movedCount;
      },

      createFsrsCardFromCaveira: (question, silent = false) => {
        if (!question || !question.id) return false;
        const { reviews = [], caveiraQuestions = [], getLocalDateStr, subjects, playSound, resolveCaveiraSubject } = get();
        const { subjectId, customSubjectName } = resolveCaveiraSubject(question, subjects);

        const sanitizedAlternatives = Array.isArray(question.alternatives)
          ? question.alternatives.map(a => ({
              ...a,
              text: cleanAltText(a?.text || a?.label || '', a?.letter)
            }))
          : null;

        const qDataPayload = {
          id: question.id,
          content: question.content || '',
          alternatives: sanitizedAlternatives,
          userChoice: question.userChoice,
          correctChoice: question.correctChoice,
          subject: question.subject || customSubjectName,
          topic: question.topic || '',
          canonicalSubject: customSubjectName,
          banca: question.banca,
          ano: question.ano,
          hit: Boolean(question.hit),
          confidence: question.confidence || (question.hit ? 'sabia' : 'duvida'),
          errorReason: question.errorReason || 'conteudo',
          userNote: question.userNote || '',
          teacherComment: question.teacherComment || '',
          timestamp: question.timestamp || null
        };

        const noteLine = question.userNote ? `\nBizu / Anotação Tática: ${question.userNote}` : '';
        const topicLabel = question.topic && question.topic !== question.subject
          ? `${customSubjectName} ➔ ${question.topic}`
          : (question.topic || customSubjectName);

        // Verifica se já existe um card ativo desta questão no FSRS
        const existingMatches = reviews.filter(r =>
          r.caveiraQuestionId === question.id ||
          String(r.id || '').includes(question.id) ||
          String(r.topicName || '').includes(question.id)
        );

        if (existingMatches.length > 0) {
          // Atualiza o primeiro card existente com os metadados completos e remove duplicatas
          const primaryId = existingMatches[0].id;
          const duplicateIds = new Set(existingMatches.slice(1).map(r => r.id));
          const repairedReviews = reviews
            .filter(r => !duplicateIds.has(r.id))
            .map(r => r.id === primaryId ? {
              ...r,
              caveiraQuestionId: question.id,
              isCaveiraQuestion: true,
              customSubjectName,
              subjectId,
              createdAt: question.timestamp || r.createdAt || null,
              topicName: `[Caveira ${question.id}] ${topicLabel}`,
              questionData: { ...(r.questionData || {}), ...qDataPayload }
            } : r);

          const updatedQuestions = caveiraQuestions.map(q => q.id === question.id ? { ...q, fsrsCreated: true } : q);
          set({ reviews: repairedReviews, caveiraQuestions: updatedQuestions });
          try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updatedQuestions)); } catch (_) {}
          if (!silent) {
            toast.info(`🃏 Questão ${question.id} já está na fila de revisão FSRS!`);
          }
          return false;
        }

        const todayStr = getLocalDateStr();

        const newReview = {
          id: 'rev_caveira_' + question.id,
          caveiraQuestionId: question.id,
          isCaveiraQuestion: true,
          customSubjectName,
          createdAt: question.timestamp || new Date().toISOString(),
          questionData: qDataPayload,
          subjectId,
          topicName: `[Caveira ${question.id}] ${topicLabel}`,
          notes: `Enunciado: ${question.content || ''}\nGabarito: ${question.correctChoice} (Você marcou: ${question.userChoice})\nMotivo do erro: ${question.errorReason || 'Conteúdo'}${noteLine}`,
          nextDateStr: todayStr,
          interval: 0,
          stability: 0,
          difficulty: 0,
          lastReviewDate: null,
          lastPerformance: undefined
        };

        const updatedQuestions = caveiraQuestions.map(q => q.id === question.id ? { ...q, fsrsCreated: true } : q);
        set({ reviews: [newReview, ...reviews], caveiraQuestions: updatedQuestions });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updatedQuestions)); } catch (_) {}
        if (!silent) {
          playSound('coin');
          toast.success(`🃏 Questão ${question.id} adicionada à fila de Revisões FSRS!`);
        }
        return true;
      },

      syncAndRepairCaveiraReviews: () => {
        const { reviews = [], caveiraQuestions = [], subjects = {}, getLocalDateStr, resolveCaveiraSubject } = get();
        const qMap = new Map();
        caveiraQuestions.forEach(q => {
          if (q && q.id) qMap.set(q.id, q);
        });

        const seenCaveiraIds = new Set();
        let reviewsChanged = false;
        let questionsChanged = false;
        const repairedReviews = [];
        const todayStr = getLocalDateStr();

        for (const rev of reviews) {
          const isCaveira = Boolean(
            rev.isCaveiraQuestion ||
            rev.questionData ||
            String(rev.id || '').startsWith('rev_caveira_') ||
            String(rev.topicName || '').startsWith('[Caveira')
          );

          if (!isCaveira) {
            repairedReviews.push(rev);
            continue;
          }

          // Extrai o ID Q\d+ do card
          const idMatch =
            String(rev.caveiraQuestionId || '').match(/Q\d+/i) ||
            String(rev.id || '').match(/Q\d+/i) ||
            String(rev.topicName || '').match(/Q\d+/i);
          const qId = idMatch ? idMatch[0].toUpperCase() : (rev.caveiraQuestionId || rev.id);

          // Remove cartões duplicados da mesma questão Caveira
          if (seenCaveiraIds.has(qId)) {
            reviewsChanged = true;
            continue;
          }
          seenCaveiraIds.add(qId);

          const matchedQ = qMap.get(qId);

          // Extrai dados de fallback das notas/título caso a questão seja antiga
          let parsedContent = '';
          let parsedCorrect = 'C';
          let parsedUser = 'E';
          if (rev.notes) {
            const enunMatch = rev.notes.match(/Enunciado:\s*([\s\S]*?)(?:\nGabarito:|$)/i);
            if (enunMatch) parsedContent = enunMatch[1].trim();
            const gabMatch = rev.notes.match(/Gabarito:\s*([A-E])\s*\(Voc[eê] marcou:\s*([A-E])\)/i);
            if (gabMatch) {
              parsedCorrect = gabMatch[1].toUpperCase();
              parsedUser = gabMatch[2].toUpperCase();
            }
          }

          const rawTitleClean = String(rev.topicName || '').replace(/^\[Caveira\s*Q?\d*\]\s*/i, '').trim();
          const titleParts = rawTitleClean.split(/\s*(?:->|➔)\s*/);
          const fallbackSub = titleParts[0] || 'Questão Caveira';
          const fallbackTop = titleParts.slice(1).join(' ➔ ') || fallbackSub;

          const sourceQuestion = matchedQ || rev.questionData || {
            id: qId,
            content: parsedContent || rawTitleClean,
            correctChoice: parsedCorrect,
            userChoice: parsedUser,
            subject: fallbackSub,
            topic: fallbackTop
          };

          const rawAlts = matchedQ?.alternatives || rev.questionData?.alternatives || null;
          const sanitizedAlts = Array.isArray(rawAlts)
            ? rawAlts.map(a => ({
                ...a,
                text: cleanAltText(a?.text || a?.label || '', a?.letter)
              }))
            : null;

          const { subjectId, customSubjectName } = resolveCaveiraSubject(sourceQuestion, subjects);
          const resolvedTimestamp = matchedQ?.timestamp || rev.questionData?.timestamp || rev.createdAt || null;
          const mergedQuestionData = {
            id: qId,
            content: matchedQ?.content || rev.questionData?.content || parsedContent || rawTitleClean,
            alternatives: sanitizedAlts,
            userChoice: matchedQ?.userChoice || rev.questionData?.userChoice || parsedUser,
            correctChoice: matchedQ?.correctChoice || rev.questionData?.correctChoice || parsedCorrect,
            subject: matchedQ?.subject || rev.questionData?.subject || fallbackSub,
            topic: matchedQ?.topic || rev.questionData?.topic || fallbackTop,
            canonicalSubject: customSubjectName,
            banca: matchedQ?.banca || rev.questionData?.banca || '',
            ano: matchedQ?.ano || rev.questionData?.ano || '',
            hit: matchedQ ? Boolean(matchedQ.hit) : Boolean(rev.questionData?.hit),
            confidence: matchedQ?.confidence || rev.questionData?.confidence || 'sabia',
            errorReason: matchedQ?.errorReason || rev.questionData?.errorReason || 'conteudo',
            userNote: matchedQ?.userNote || rev.questionData?.userNote || '',
            teacherComment: matchedQ?.teacherComment || rev.questionData?.teacherComment || '',
            timestamp: resolvedTimestamp
          };

          const topicLabel = mergedQuestionData.topic && mergedQuestionData.topic !== mergedQuestionData.subject
            ? `${customSubjectName} ➔ ${mergedQuestionData.topic}`
            : (mergedQuestionData.topic || customSubjectName);
          const expectedTopicName = `[Caveira ${qId}] ${topicLabel}`;

          // Se nunca foi revisado ainda (lastReviewDate === null) e estava agendado para amanhã, traz para hoje
          const repairedNextDateStr = (!rev.lastReviewDate && rev.nextDateStr > todayStr) ? todayStr : rev.nextDateStr;

          const altsMismatch = JSON.stringify(rev.questionData?.alternatives || null) !== JSON.stringify(sanitizedAlts);

          if (
            !rev.isCaveiraQuestion ||
            rev.caveiraQuestionId !== qId ||
            rev.subjectId !== subjectId ||
            rev.customSubjectName !== customSubjectName ||
            rev.topicName !== expectedTopicName ||
            rev.nextDateStr !== repairedNextDateStr ||
            rev.createdAt !== resolvedTimestamp ||
            !rev.questionData ||
            rev.questionData.content !== mergedQuestionData.content ||
            rev.questionData.confidence !== mergedQuestionData.confidence ||
            rev.questionData.userNote !== mergedQuestionData.userNote ||
            rev.questionData.teacherComment !== mergedQuestionData.teacherComment ||
            rev.questionData.timestamp !== resolvedTimestamp ||
            altsMismatch
          ) {
            reviewsChanged = true;
          }

          repairedReviews.push({
            ...rev,
            caveiraQuestionId: qId,
            isCaveiraQuestion: true,
            subjectId,
            customSubjectName,
            createdAt: resolvedTimestamp,
            topicName: expectedTopicName,
            nextDateStr: repairedNextDateStr,
            questionData: mergedQuestionData
          });
        }

        // Agora garante que toda questão errada (!q.hit) em caveiraQuestions tenha seu card FSRS e alternativas limpas
        const updatedCaveiraQuestions = caveiraQuestions.map(q => {
          if (!q || !q.id) return q;

          let qAltsChanged = false;
          let sanitizedQAlts = q.alternatives;
          if (Array.isArray(q.alternatives)) {
            sanitizedQAlts = q.alternatives.map(a => {
              const clean = cleanAltText(a?.text || a?.label || '', a?.letter);
              if (clean !== a?.text) qAltsChanged = true;
              return { ...a, text: clean };
            });
          }
          if (qAltsChanged) {
            questionsChanged = true;
          }

          const needsFsrs = !q.hit || q.confidence === 'chute' || q.confidence === 'duvida' || q.fsrsRequested || q.fsrsCreated;

          if (needsFsrs && !seenCaveiraIds.has(q.id)) {
            seenCaveiraIds.add(q.id);
            reviewsChanged = true;
            questionsChanged = true;

            const { subjectId, customSubjectName } = resolveCaveiraSubject(q, subjects);
            const topicLabel = q.topic && q.topic !== q.subject
              ? `${customSubjectName} ➔ ${q.topic}`
              : (q.topic || customSubjectName);
            const noteLine = q.userNote ? `\nBizu / Anotação Tática: ${q.userNote}` : '';
            const reasonLine = q.hit
              ? `Motivo da revisão: ${q.confidence === 'chute' ? 'Acertou no Chute 🎲' : 'Acertou com Dúvida 🤔'}`
              : `Motivo do erro: ${q.errorReason || 'Conteúdo'}`;

            repairedReviews.push({
              id: 'rev_caveira_' + q.id,
              caveiraQuestionId: q.id,
              isCaveiraQuestion: true,
              customSubjectName,
              createdAt: q.timestamp || null,
              subjectId,
              topicName: `[Caveira ${q.id}] ${topicLabel}`,
              questionData: {
                id: q.id,
                content: q.content || '',
                alternatives: sanitizedQAlts || null,
                userChoice: q.userChoice,
                correctChoice: q.correctChoice,
                subject: q.subject || customSubjectName,
                topic: q.topic || '',
                canonicalSubject: customSubjectName,
                banca: q.banca,
                ano: q.ano,
                hit: Boolean(q.hit),
                confidence: q.confidence || (q.hit ? 'sabia' : 'duvida'),
                errorReason: q.errorReason || 'conteudo',
                userNote: q.userNote || '',
                teacherComment: q.teacherComment || '',
                timestamp: q.timestamp || null
              },
              notes: `Enunciado: ${q.content || ''}\nGabarito: ${q.correctChoice} (Você marcou: ${q.userChoice})\n${reasonLine}${noteLine}`,
              nextDateStr: todayStr,
              interval: 0,
              stability: 0,
              difficulty: 0,
              lastReviewDate: null,
              lastPerformance: undefined
            });
            return { ...q, alternatives: sanitizedQAlts, fsrsCreated: true };
          }
          if (needsFsrs && !q.fsrsCreated && seenCaveiraIds.has(q.id)) {
            questionsChanged = true;
            return { ...q, alternatives: sanitizedQAlts, fsrsCreated: true };
          }
          if (qAltsChanged) {
            return { ...q, alternatives: sanitizedQAlts };
          }
          return q;
        });

        if (reviewsChanged || questionsChanged) {
          set({
            ...(reviewsChanged ? { reviews: repairedReviews } : {}),
            ...(questionsChanged ? { caveiraQuestions: updatedCaveiraQuestions } : {})
          });
          if (questionsChanged) {
            try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updatedCaveiraQuestions)); } catch (_) {}
          }
        }
      },

      // --- AÇÕES LÓGICAS ---

      addXP: (amount, message = "", dateStrOverride = null) => {
        get().playSound('xp');
        let finalAmount = amount;
        let boostUsed = false;
        
        const activeBoosts = get().activeBoosts || { xpBoostActions: 0, streakShieldActive: false };
        if (activeBoosts.xpBoostActions > 0) {
          finalAmount = amount * 2;
          boostUsed = true;
        }

        const todayStr = dateStrOverride || get().getLocalDateStr();
        set((state) => {
          const stateActiveBoosts = state.activeBoosts || { xpBoostActions: 0, streakShieldActive: false };
          const prevHistory = Array.isArray(state.xpHistory) ? state.xpHistory : [];
          const existingIdx = prevHistory.findIndex(h => h && h.date === todayStr);
          const nextHistory = existingIdx >= 0
            ? prevHistory.map((h, i) => i === existingIdx ? { ...h, xp: (h.xp || 0) + finalAmount } : h)
            : [...prevHistory.slice(-29), { date: todayStr, xp: finalAmount }];

          return {
            userStats: { ...state.userStats, xp: state.userStats.xp + finalAmount },
            seasonalData: { ...state.seasonalData, seasonXp: state.seasonalData.seasonXp + finalAmount },
            xpHistory: nextHistory,
            activeBoosts: boostUsed ? {
              ...stateActiveBoosts,
              xpBoostActions: Math.max(0, stateActiveBoosts.xpBoostActions - 1)
            } : stateActiveBoosts
          };
        });

        if (message) {
          const boostMsg = boostUsed ? ` [Boost 2x Ativo! +${finalAmount - amount} XP]` : "";
          toast.success(`${message}${boostMsg}`);
        }

        // Verifica avanço de temporada
        get().checkAndAdvanceSeason();
      },

      unlockMedal: (medalId) => {
        const { userStats } = get();
        if (!userStats.medals.includes(medalId)) {
          set((state) => ({
            userStats: { ...state.userStats, medals: [...state.userStats.medals, medalId] }
          }));
          return true;
        }
        return false;
      },

      completeTafTraining: () => {
        const { getLocalDateStr, tafTrainingStatus, addXP, setCoins, setTafTrainingStatus, updateMissionProgress } = get();
        const today = getLocalDateStr();
        if (tafTrainingStatus.lastDoneDate === today) return false;

        addXP(50, "Treino Físico do Dia concluído");
        get().playSound('coin');
        setCoins(prev => prev + 30);
        setTafTrainingStatus({ lastDoneDate: today });
        updateMissionProgress('taf', 1);
        get().updateDailyMissionProgress('taf', 1);
        get().boostPetWithStudy('taf');
        return true; 
      },

      handleReviewSubmit: (reviewId, performance) => {
        const { reviews, getLocalDateStr, addXP, setCoins, updateMissionProgress, setReviews, setReviewStats, updateFsrsCard } = get();
        const reviewIndex = reviews.findIndex(r => r.id === reviewId);
        if (reviewIndex === -1) return;

        const review = reviews[reviewIndex];
        
        // Mapear Performance para Notas FSRS (1-4)
        let rating = 3; // Default Good
        if (performance >= 1.0) rating = 4; // Easy
        else if (performance >= 0.80) rating = 3; // Good
        else if (performance >= 0.60) rating = 2; // Hard
        else rating = 1; // Again

        const fsrsUpdate = updateFsrsCard(review, rating);
        const nextDate = get().getTodayDate(); 
        nextDate.setDate(nextDate.getDate() + fsrsUpdate.nextInterval);

        const newReviews = [...reviews];
        newReviews[reviewIndex] = {
          ...review,
          stability: fsrsUpdate.stability,
          difficulty: fsrsUpdate.difficulty,
          interval: fsrsUpdate.nextInterval,
          nextDateStr: getLocalDateStr(nextDate),
          lastReviewDate: fsrsUpdate.lastReviewDate,
          lastPerformance: performance,
          trend: performance - (review.lastPerformance ?? 0.75)
        };

        setReviews(newReviews);
        setReviewStats(prev => ({
          totalDone: prev.totalDone + 1,
          correct: rating > 1 ? prev.correct + 1 : prev.correct,
          streak: rating > 1 ? prev.streak + 1 : 0
        }));

        addXP(rating > 1 ? 30 : 10, "Auditoria FSRS v6");
        
        const todayStr = getLocalDateStr(get().getTodayDate());
        set(state => {
          const dailyReviewStats = state.dailyReviewStats || {};
          const todayStats = dailyReviewStats[todayStr] || { total: 0, correct: 0 };
          const newDailyReviewStats = {
            ...dailyReviewStats,
            [todayStr]: {
              total: todayStats.total + 1,
              correct: rating > 1 ? todayStats.correct + 1 : todayStats.correct
            }
          };

          const newState = {
            studyHistory: {
              ...state.studyHistory,
              [todayStr]: (state.studyHistory?.[todayStr] || 0) + 2
            },
            userStats: {
              ...state.userStats,
              totalStudyMinutes: (state.userStats?.totalStudyMinutes || 0) + 2
            },
            weeklySprint: {
              ...state.weeklySprint,
              currentMinutes: (state.weeklySprint?.currentMinutes || 0) + 2
            },
            dailyReviewStats: newDailyReviewStats
          };

          return newState;
        });

        get().registerStudyActivity?.(todayStr);

        // Verifica medalha Muralha (5 dias consecutivos com 100% de acerto nas revisões executadas)
        const dailyReviewStatsAfter = get().dailyReviewStats || {};
        let has5DaysAfter = true;
        for (let i = 0; i < 5; i++) {
          const checkDate = new Date(get().getTodayDate());
          checkDate.setDate(checkDate.getDate() - i);
          const checkDateStr = getLocalDateStr(checkDate);
          const dayStat = dailyReviewStatsAfter[checkDateStr];
          if (!dayStat || dayStat.total === 0 || dayStat.correct !== dayStat.total) {
            has5DaysAfter = false;
            break;
          }
        }
        if (has5DaysAfter) {
          get().unlockMedal('muralha');
        }

        if (rating > 1) {
          get().playSound('coin');
          setCoins(c => c + 5);
          updateMissionProgress('review', 1);
          get().updateDailyMissionProgress('review', 1);
        }
        get().boostPetWithStudy('review');
      },

      handleReplaceSubject: (dayIndex, slotIndex, oldSubjectId, newSubjectId) => {
        if (!newSubjectId) return;
        const dateInfo = get().getRelativeDateInfo?.(dayIndex);
        const fullDateStr = dateInfo?.fullDateStr;
        set(state => {
          const isWeekly = (state.cycleScheduleType || 'weekly') === 'weekly';
          const baseCycle = isWeekly
            ? Array.from({ length: 7 }, (_, i) => Array.isArray(state.cycle?.[i]) ? [...state.cycle[i]] : [])
            : [...(state.cycle || [])];

          const newCycle = baseCycle.map((daySlots, dIdx) => {
            if (dIdx !== dayIndex || !Array.isArray(daySlots)) return daySlots;
            return daySlots.map((subId, sIdx) =>
              sIdx === slotIndex && subId === oldSubjectId ? newSubjectId : subId
            );
          });

          const nextOverrides = { ...(state.calendarOverrides || {}) };
          if (fullDateStr && Array.isArray(nextOverrides[fullDateStr])) {
            nextOverrides[fullDateStr] = nextOverrides[fullDateStr].map((subId, sIdx) =>
              sIdx === slotIndex && subId === oldSubjectId ? newSubjectId : subId
            );
          }

          let nextRules = state.futureScheduleRules || [];
          if (fullDateStr && Array.isArray(nextRules) && nextRules.length > 0) {
            const parts = String(fullDateStr).split('-').map(Number);
            const dayDateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
            const dayOfWeek = dayDateObj.getDay();
            const matchingRules = nextRules
              .filter(r => {
                if (!r || r.v !== 2 || !r.fromDate || r.fromDate > fullDateStr) return false;
                if (isWeekly && r.dayOfWeek !== undefined) return r.dayOfWeek === dayOfWeek;
                return r.dayOfWeek === dayOfWeek || r.cycleIndex === dayIndex;
              })
              .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

            if (matchingRules.length > 0) {
              const activeRuleId = matchingRules[0].id;
              nextRules = nextRules.map(r => {
                if (!r || r.id !== activeRuleId || !Array.isArray(r.daySlots)) return r;
                return {
                  ...r,
                  daySlots: r.daySlots.map((subId, sIdx) =>
                    sIdx === slotIndex && subId === oldSubjectId ? newSubjectId : subId
                  )
                };
              });
            }
          }

          return {
            cycle: newCycle,
            calendarOverrides: nextOverrides,
            futureScheduleRules: nextRules
          };
        });
      },

      getLocalDateStr: (date) => {
        const targetDate = date || new Date();
        const offset = targetDate.getTimezoneOffset();
        const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      },

      getEffectiveStreak: () => {
        const { streakData, activeBoosts, getLocalDateStr } = get();
        const current = streakData?.currentStreak || 0;
        const lastCheckDate = streakData?.lastCheckDate;
        if (!lastCheckDate || current <= 0) return 0;
        const today = getLocalDateStr();
        if (lastCheckDate === today) return current;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);
        if (lastCheckDate === yesterdayStr) return current;
        if (activeBoosts?.streakShieldActive) return current;
        return 0;
      },

      registerStudyActivity: (activityDateStr = null) => {
        const { getLocalDateStr, streakData, setStreakData, setCoins, studyHistory } = get();
        const today = getLocalDateStr();
        const targetDate = (activityDateStr && /^\d{4}-\d{2}-\d{2}$/.test(activityDateStr) && activityDateStr <= today)
          ? activityDateStr
          : today;
        const lastCheckDate = streakData?.lastCheckDate || null;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateStr(yesterday);

        if (lastCheckDate && lastCheckDate >= targetDate) {
          // Se o usuário já estudou hoje mas registrou ontem retroativamente e havia estudado anteontem, recupera a continuidade da sequência
          if (targetDate === yesterdayStr && lastCheckDate === today && (streakData?.currentStreak || 0) <= 1) {
            const [yy, ym, yd] = yesterdayStr.split('-').map(Number);
            const dayBeforeYest = new Date(yy, ym - 1, yd);
            dayBeforeYest.setDate(dayBeforeYest.getDate() - 1);
            const dayBeforeYestStr = getLocalDateStr(dayBeforeYest);
            if ((studyHistory?.[dayBeforeYestStr] || 0) > 0) {
              setStreakData({ ...streakData, currentStreak: (streakData?.currentStreak || 1) + 1 });
            }
          }
          return;
        }

        let newStreak = streakData?.currentStreak || 0;
        let newHasHadBreak = Boolean(streakData?.hasHadBreak);

        const [ty, tm, td] = targetDate.split('-').map(Number);
        const prevDay = new Date(ty, tm - 1, td);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = getLocalDateStr(prevDay);

        if (lastCheckDate === prevDayStr) {
          newStreak += 1;
        } else if (!lastCheckDate) {
          // Primeiro estudo da conta: inicia ofensiva sem marcar quebra (evita medalha Fênix indevida no dia 7)
          newStreak = 1;
        } else {
          // Havia lastCheckDate anterior ao dia anterior -> houve quebra real
          const activeBoosts = get().activeBoosts || { xpBoostActions: 0, streakShieldActive: false };
          if (activeBoosts.streakShieldActive && targetDate === today) {
            set(state => ({
              activeBoosts: {
                ...(state.activeBoosts || {}),
                streakShieldActive: false
              }
            }));
            toast.success("🛡️ Escudo de Streak consumido! Sua ofensiva foi protegida.");
            newStreak = streakData?.currentStreak || 1;
          } else {
            newStreak = 1;
            newHasHadBreak = true;
          }
        }

        setStreakData({ lastCheckDate: targetDate, currentStreak: newStreak, hasHadBreak: newHasHadBreak });
        if (newStreak === 7) {
          setCoins(c => c + 100);
          if (newHasHadBreak) {
            get().unlockMedal('fenix');
          }
        }
      },

      // Nota: tanto PomodoroTimer (via addStudyMinutes) quanto watchClass somam minutos em studyHistory e weeklySprint.
      addStudyMinutes: (minutes, dateStrOverride = null) => {
        const { getLocalDateStr, setUserStats, setWeeklySprint, addXP } = get();
        if (minutes <= 0) return;
        
        const targetDateStr = dateStrOverride || getLocalDateStr();
        setUserStats(prev => ({ ...prev, totalStudyMinutes: (prev.totalStudyMinutes || 0) + minutes }));
        setWeeklySprint(prev => ({ ...prev, currentMinutes: (prev.currentMinutes || 0) + minutes }));
        
        // XP reward for using pomodoro (2 XP per minute)
        addXP(minutes * 2, "Sessão Pomodoro Concluída");
        
        set(state => ({
          studyHistory: {
            ...state.studyHistory,
            [targetDateStr]: (state.studyHistory?.[targetDateStr] || 0) + minutes
          }
        }));
        get().updateDailyMissionProgress('minutes', minutes);
        get().registerStudyActivity();
      },

      watchClass: (subjectId, slotIndex, amountWatched = 1, speed = null, studyDateStr = null) => {
        const { subjects, getActiveTopic, addXP, setUserStats, setWeeklySprint, setReviews, setCoins, setCompletedToday, getLocalDateStr, getStartOfWeek, getTodayDate } = get();
        const activeTopic = getActiveTopic(subjectId);
        if (!activeTopic) return;

        const todayObj = getTodayDate();
        const todayStr = getLocalDateStr(todayObj);
        const targetDateStr = (studyDateStr && /^\d{4}-\d{2}-\d{2}$/.test(studyDateStr) && studyDateStr <= todayStr)
          ? studyDateStr
          : todayStr;
        const isRetroactive = targetDateStr < todayStr;
        const [ty, tm, td] = targetDateStr.split('-').map(Number);
        const targetDateObj = new Date(ty, tm - 1, td);
        const currentWeekStartStr = getLocalDateStr(getStartOfWeek(todayObj));
        const isInCurrentWeek = targetDateStr >= currentWeekStartStr;

        const effectiveSpeed = (speed !== null && speed !== undefined && !isNaN(speed)) 
          ? Number(speed) 
          : (Number(subjects[subjectId]?.speed) || 1);

        const newSubjects = { ...subjects };
        const subject = { ...newSubjects[subjectId] };
        const topics = [...subject.topics];
        const topicIndex = topics.findIndex(t => t.id === activeTopic.id);
        
        let actualWatched = 0;
        if (topicIndex !== -1) {
          const currentCompleted = topics[topicIndex].completed;
          const total = topics[topicIndex].total;
          const newCompleted = Math.min(total, currentCompleted + amountWatched);
          actualWatched = Math.max(0, newCompleted - currentCompleted);
          
          if (newCompleted > currentCompleted) {
            // Calcular minutos reais: usa duração da aula se disponível (lessons[]), senão 60min por aula
            const topicLessonsArr = topics[topicIndex].lessons || [];
            let addedMinutes = 0;
            for (let i = currentCompleted; i < newCompleted; i++) {
              const lesson = topicLessonsArr[i];
              const origSec = parseDurationToSeconds(lesson?.duration);
              const mins = (origSec > 0 ? origSec : 3600) / 60;
              addedMinutes += (mins / effectiveSpeed);
            }
            addedMinutes = Math.round(addedMinutes);
            if (!Number.isFinite(addedMinutes) || (addedMinutes === 0 && actualWatched > 0)) {
              addedMinutes = Math.round((60 * actualWatched) / effectiveSpeed);
            }
            
            const targetBr = `${String(td).padStart(2, '0')}/${String(tm).padStart(2, '0')}`;
            addXP(
              100 * actualWatched,
              isRetroactive ? `Progresso registrado em ${targetBr}` : "Progresso em disciplina",
              targetDateStr
            );
            setUserStats(prev => ({ ...prev, totalStudyMinutes: (prev.totalStudyMinutes || 0) + addedMinutes }));
            if (isInCurrentWeek) {
              setWeeklySprint(prev => ({ ...prev, currentMinutes: (prev.currentMinutes || 0) + addedMinutes }));
            }
            
            set(state => {
              const prevDayMinutes = state.studyHistory?.[targetDateStr] || 0;
              const shouldReduceCarryover =
                isRetroactive &&
                prevDayMinutes <= 0 &&
                addedMinutes > 0 &&
                state.cycleScheduleType === 'weekly' &&
                (state.cycleCarryoverOffset || 0) > 0;
              return {
                studyHistory: {
                  ...state.studyHistory,
                  [targetDateStr]: prevDayMinutes + addedMinutes
                },
                ...(shouldReduceCarryover
                  ? { cycleCarryoverOffset: Math.max(0, (state.cycleCarryoverOffset || 0) - 1) }
                  : {})
              };
            });
            if (!isRetroactive) {
              get().updateDailyMissionProgress('minutes', addedMinutes);
            }

            // Adicionar CADA aula concluída à fila de revisão a partir da data do estudo (+1 dia)
            const nextReviewDate = new Date(targetDateObj);
            nextReviewDate.setDate(nextReviewDate.getDate() + 1);
            const nextReviewDateStr = getLocalDateStr(nextReviewDate);
            
            const newReviews = [];
            const topicLessons = topics[topicIndex].lessons || [];
            for (let i = currentCompleted + 1; i <= newCompleted; i++) {
              // Usa o nome real da aula se estiver cadastrado, senão gera nome genérico
              const lessonEntry = topicLessons[i - 1]; // lessons são 0-indexed
              let rName = lessonEntry?.name
                ? lessonEntry.name
                : (total > 1 ? `${topics[topicIndex].name} (Aula ${i})` : topics[topicIndex].name);
              newReviews.push({
                id: 'rev_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5),
                subjectId: subjectId,
                topicName: rName,
                nextDateStr: nextReviewDateStr, 
                interval: 0,
                stability: 0,
                difficulty: 0,
                lastReviewDate: null,
                lastPerformance: undefined
              });
            }
            setReviews(rPrev => [...rPrev, ...newReviews]);
          }

          topics[topicIndex] = { ...topics[topicIndex], completed: newCompleted };
        }
        subject.topics = topics;
        newSubjects[subjectId] = subject;
        
        set({ subjects: newSubjects });
        if (actualWatched > 0) {
          setCoins(prev => prev + (10 * actualWatched));
          if (isInCurrentWeek) {
            get().updateMissionProgress('study', actualWatched);
          }
          if (!isRetroactive) {
            get().updateDailyMissionProgress('study', actualWatched);
          }
          get().registerStudyActivity(targetDateStr);
        }
        if (!isRetroactive && slotIndex !== null && slotIndex !== undefined) {
          setCompletedToday(prev => !prev.includes(slotIndex) ? [...prev, slotIndex] : prev);
        }
        get().boostPetWithStudy('class');
      },

      advanceDay: () => {
        const { cycle, currentDayIndex, setCurrentDayIndex, setCompletedToday } = get();
        if (cycle.length === 0) return;
        
        get().registerStudyActivity();

        // Em modo semanal o "dia do ciclo" é sempre o dia real da semana (Ciclo.jsx o resincroniza),
        // então avançar não mexe no índice nem nos blocos concluídos: só streak/moedas acima.
        if ((get().cycleScheduleType || 'weekly') !== 'weekly') {
          const cycleLen = Math.max(1, cycle.length);
          const nextIndex = (currentDayIndex + 1) % cycleLen;
          setCurrentDayIndex(nextIndex);
          setCompletedToday([]);
        }

        // Lógica de verificação semanal e temporada
        get().checkAndResetWeekly();
        get().checkAndAdvanceSeason();
      },

      handleBulkAddConfirm: (subjectId, bulkText) => {
        const topics = bulkText.split('\n')
          .filter(line => line.trim() !== '')
          .map((line, idx) => ({
            id: 't_' + Date.now() + '_' + idx,
            name: line.trim(),
            total: 10,
            completed: 0
          }));

        set(state => {
          const newSubjects = { ...state.subjects };
          if (newSubjects[subjectId]) {
            newSubjects[subjectId].topics = [...newSubjects[subjectId].topics, ...topics];
          }
          return { subjects: newSubjects };
        });
      },

      executeTacticalReset: async () => {
        const clean = getCleanInitialState();
        set((state) => ({
          ...clean,
          isDarkMode: state.isDarkMode,
          activeTheme: state.activeTheme || 'blue',
          unlockedThemes: state.unlockedThemes || ['blue'],
          unlockedAvatars: state.unlockedAvatars || clean.unlockedAvatars,
          enableSounds: state.enableSounds ?? true,
          targetExamDate: state.targetExamDate || clean.targetExamDate,
          userStats: {
            ...clean.userStats,
            avatar: state.userStats?.avatar || clean.userStats.avatar,
            displayName: state.userStats?.displayName || ''
          }
        }));
        
        // Sincroniza o reset com a nuvem e limpa chave separada de questões
        try { localStorage.removeItem('prf_caveira_questions'); } catch (_) {}
        const { saveToCloud } = get();
        await saveToCloud({ allowEmptyOverwrite: true });
      },

      executeSelectiveReset: async (options = {}) => {
        const {
          all,
          subjects,
          watchedLessons,
          calendarSchedule,
          raioXCaveira,
          fsrs,
          dueloCTB,
          career,
          mascot,
          coinsRewards
        } = options;

        if (all) {
          return await get().executeTotalWipe();
        }

        // Snapshot de segurança pré-reset no localStorage caso o usuário resete algo por engano
        const preResetState = get();
        if (hasMeaningfulUserData(preResetState)) {
          const preResetSnapshot = {};
          PERSISTED_KEYS.forEach(key => {
            if (preResetState[key] !== undefined) preResetSnapshot[key] = preResetState[key];
          });
          appendLocalBackup(preResetSnapshot, 'pre_selective_reset');
        }

        const clean = getCleanInitialState();
        const changes = {};
        const summary = [];

        // 1. Apagar somente as disciplinas
        if (subjects) {
          changes.subjects = {};
          changes.cycle = [[], [], [], [], [], [], []];
          changes.cycleSlotCounts = [[], [], [], [], [], [], []];
          changes.currentDayIndex = 0;
          changes.cycleDayNames = [];
          changes.completedToday = [];
          changes.completedTodayDate = null;
          changes.subjectGoals = {};
          changes.subjectTimeGoal = {};
          changes.calendarOverrides = {};
          changes.calendarOverrideCounts = {};
          changes.futureScheduleRules = [];
          changes.studyHistory = {};
          summary.push('Disciplinas & Ciclo');
        }

        // 1b. Zerar somente as aulas assistidas (mantendo matérias, assuntos e aulas cadastradas)
        if (watchedLessons && !subjects) {
          const currentSubjects = get().subjects || {};
          const resetSubjects = {};
          Object.entries(currentSubjects).forEach(([id, sub]) => {
            resetSubjects[id] = {
              ...sub,
              topics: (sub.topics || []).map(t => ({
                ...t,
                completed: 0,
                ...(Array.isArray(t.lessons)
                  ? { lessons: t.lessons.map(l => ({ ...l, completed: false })) }
                  : {})
              }))
            };
          });
          changes.subjects = resetSubjects;
          changes.completedToday = [];
          changes.completedTodayDate = null;
          summary.push('Aulas Assistidas');
        }

        // 1c. Remover somente as matérias colocadas no calendário e no ciclo
        if (calendarSchedule && !subjects) {
          const isWeekly = (get().cycleScheduleType || 'weekly') === 'weekly';
          changes.cycle = isWeekly ? [[], [], [], [], [], [], []] : [];
          changes.cycleSlotCounts = isWeekly ? [[], [], [], [], [], [], []] : [];
          changes.currentDayIndex = 0;
          changes.cycleDayNames = [];
          changes.completedToday = [];
          changes.completedTodayDate = null;
          changes.calendarOverrides = {};
          changes.calendarOverrideCounts = {};
          changes.futureScheduleRules = [];
          summary.push('Calendário & Ciclo');
        }

        // 2. Apagar somente o Raio-X Caveira
        if (raioXCaveira) {
          changes.caveiraQuestions = [];
          const currentReviews = changes.reviews !== undefined ? changes.reviews : (get().reviews || []);
          changes.reviews = currentReviews.filter(r => !(r.isCaveiraQuestion || String(r.id || '').startsWith('rev_caveira_') || String(r.topicName || '').startsWith('[Caveira')));
          try { localStorage.removeItem('prf_caveira_questions'); } catch (_) {}
          try { window.postMessage({ source: 'QG_WEB_APP', type: 'CLEAR_SESSION' }, '*'); } catch (_) {}
          summary.push('Raio-X Caveira');
        }

        // 3. Apagar somente as revisões FSRS
        if (fsrs) {
          changes.reviews = [];
          changes.reviewStats = { totalDone: 0, correct: 0, streak: 0 };
          changes.dailyReviewStats = {};
          if (!raioXCaveira) {
            const currentCaveira = changes.caveiraQuestions !== undefined ? changes.caveiraQuestions : (get().caveiraQuestions || []);
            changes.caveiraQuestions = currentCaveira.map(q => ({ ...q, fsrsCreated: false }));
          }
          summary.push('Revisões FSRS');
        }

        // 4. Apagar somente os dados do Duelo CTB
        if (dueloCTB) {
          try {
            localStorage.removeItem('alvo_legal_seen_statements_v1');
            localStorage.removeItem('alvo_legal_high_score_v1');
            localStorage.removeItem('qg_duelo_fps_topic_stats_v1');
          } catch (_) {}
          if (!raioXCaveira) {
            const currentCaveira = changes.caveiraQuestions !== undefined ? changes.caveiraQuestions : (get().caveiraQuestions || []);
            changes.caveiraQuestions = currentCaveira.filter(q => !(q.source?.includes('Duelo') || q.origin?.includes('FPS') || String(q.id || '').startsWith('fps-') || String(q.id || '').startsWith('duelo_')));
          }
          if (!fsrs) {
            const currentReviews = changes.reviews !== undefined ? changes.reviews : (get().reviews || []);
            changes.reviews = currentReviews.filter(r => !(r.origin?.includes('FPS') || String(r.id || '').startsWith('rev_fps_') || String(r.id || '').startsWith('rev_caveira_duelo_')));
          }
          summary.push('Duelo CTB / CONTRAN');
        }

        if (!raioXCaveira && changes.caveiraQuestions !== undefined) {
          try {
            localStorage.setItem('prf_caveira_questions', JSON.stringify(changes.caveiraQuestions));
          } catch (_) {}
        }

        // 5. Apagar dados da carreira e começar do zero
        if (career) {
          const prevUserStats = get().userStats || {};
          changes.userStats = {
            xp: 0,
            medals: [],
            totalStudyMinutes: 0,
            avatar: prevUserStats.avatar || '/assets/gamification/avatar_male.png',
            displayName: prevUserStats.displayName || '',
            totalPurchases: coinsRewards ? 0 : (prevUserStats.totalPurchases || 0)
          };
          changes.xpHistory = [];
          changes.streakData = { currentStreak: 0, lastCheckDate: null };
          changes.weeklySprint = { goalHours: 35, currentMinutes: 0, weekStart: new Date().toISOString() };
          changes.weeklyMissions = clean.weeklyMissions;
          changes.dailyMissions = [];
          changes.lastDailyResetDate = null;
          changes.seasonalData = clean.seasonalData;
          changes.syntaxLevel = 0;
          changes.activeBoosts = { xpBoostActions: 0, streakShieldActive: false };
          summary.push('Evolução de Carreira');
        }

        // 6. Resetar o mascote
        if (mascot) {
          changes.petData = clean.petData;
          summary.push('Mascote K9');
        }

        // 7. Resetar as moedas e recompensas
        if (coinsRewards) {
          changes.coins = 250;
          changes.unlockedThemes = ['blue'];
          changes.activeTheme = 'blue';
          changes.unlockedAvatars = [
            '/assets/gamification/avatar_male.png',
            '/assets/gamification/avatar_female.png'
          ];
          changes.activeBoosts = { xpBoostActions: 0, streakShieldActive: false };
          if (!career) {
            const prevUserStats = get().userStats || {};
            changes.userStats = { ...prevUserStats, totalPurchases: 0 };
          }
          summary.push('Moedas & Recompensas');
        }

        // Aplica alterações atômicas no estado
        set(changes);

        // Sincroniza com a nuvem (Supabase)
        const { saveToCloud } = get();
        await saveToCloud({ allowEmptyOverwrite: true });

        return summary;
      },

      executeTotalWipe: async () => {
        const { user } = get();
        console.log("🔴 PROTOCOLO DE DESTRUIÇÃO ABSOLUTA INICIADO...");
        clearTimeout(useStore._debounceTimer);
        clearTimeout(useStore._localDebounceTimer);
        clearTimeout(useStore._retryTimer);
        useStore._keyTimestamps = {};
        try {
          localStorage.removeItem('prf_caveira_questions');
          localStorage.removeItem('prf_qg_backups');
          localStorage.removeItem(LOCAL_STATE_STORAGE_KEY);
          localStorage.removeItem('alvo_legal_seen_statements_v1');
          localStorage.removeItem('alvo_legal_high_score_v1');
          localStorage.removeItem('qg_duelo_fps_topic_stats_v1');
        } catch (_) {}
        
        const cleanState = getCleanInitialState();

        // 1. Limpa memória imediatamente
        set(cleanState);

        // 2. Força sobrescrita na nuvem (Supabase) como fonte da verdade
        if (user) {
          try {
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ 
                full_data: cleanState, 
                updated_at: new Date().toISOString() 
              })
              .eq('id', user.id)
              .select();
            
            if (updateError) throw updateError;
            
            if (!updateData || updateData.length === 0) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  full_data: cleanState,
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) throw insertError;
            }
            console.log("✅ Nuvem purificada com sucesso.");
          } catch (error) {
            console.error('❌ Erro crítico ao limpar nuvem:', error);
            toast.error("Erro ao limpar dados na nuvem. Verifique sua conexão.");
            return;
          }
        }

        // 3. Recarregamento limpo para garantir integridade
        window.location.reload();
      },

      updateMissionProgress: (type, amount) => {
        const { weeklyMissions, setWeeklyMissions, setGlobalModal } = get();
        const updatedMissions = weeklyMissions.map(mission => {
          if (mission.type === type && !mission.completed) {
            const newCurrent = Math.min(mission.goal, mission.current + amount);
            const isNowCompleted = newCurrent >= mission.goal;
            
            if (isNowCompleted && !mission.completed) {
              // Notificar via modal global
              setGlobalModal({
                title: "🎯 Missão Cumprida!",
                message: `Você completou a missão: ${mission.title}. Resgate sua recompensa no Painel!`,
                isAlert: true
              });
            }
            
            return { ...mission, current: newCurrent, completed: isNowCompleted };
          }
          return mission;
        });
        setWeeklyMissions(updatedMissions);
      },

      claimMissionReward: (missionId) => {
        const { weeklyMissions, setWeeklyMissions, addXP, setCoins } = get();
        const missionIndex = weeklyMissions.findIndex(m => m.id === missionId);
        if (missionIndex === -1 || !weeklyMissions[missionIndex].completed || weeklyMissions[missionIndex].claimed) return;

        const mission = weeklyMissions[missionIndex];
        addXP(mission.xpReward, `Recompensa de Missão: ${mission.title}`);
        get().playSound('coin');
        setCoins(c => c + mission.coinReward);

        const updatedMissions = [...weeklyMissions];
        updatedMissions[missionIndex] = { ...mission, claimed: true };
        setWeeklyMissions(updatedMissions);
      },

      unlockAvatar: (avatarPath, cost) => {
        const { coins, unlockedAvatars, setCoins, unlockMedal } = get();
        if (coins < cost) {
          toast.error("Moedas insuficientes para desbloquear este avatar!");
          return false;
        }
        if (unlockedAvatars.includes(avatarPath)) {
          toast.error("Avatar já desbloqueado!");
          return false;
        }
        setCoins(c => c - cost);
        set(state => ({
          unlockedAvatars: [...state.unlockedAvatars, avatarPath],
          userStats: {
            ...state.userStats,
            totalPurchases: (state.userStats?.totalPurchases || 0) + 1
          }
        }));
        const newPurchases = (get().userStats?.totalPurchases || 0);
        if (newPurchases >= 5) unlockMedal('investidor');
        toast.success("Avatar desbloqueado com sucesso! 🎉");
        get().playSound('levelUp');
        return true;
      },

      selectAvatar: (avatarPath) => {
        const { unlockedAvatars } = get();
        if (!unlockedAvatars.includes(avatarPath)) {
          toast.error("Você precisa desbloquear este avatar antes de equipá-lo!");
          return false;
        }
        set(state => ({
          userStats: {
            ...state.userStats,
            avatar: avatarPath
          }
        }));
        toast.success("Avatar equipado com sucesso! 🛡️");
        return true;
      },

      checkAndResetDailyMissions: () => {
        const { getLocalDateStr, lastDailyResetDate } = get();
        const todayStr = getLocalDateStr();
        
        if (lastDailyResetDate !== todayStr) {
          // --- MULTA DE PROCRASTINAÇÃO ---
          // Se não é a primeira execução da vida (lastDailyResetDate existe)
          // E o usuário tem mais de 5 revisões estritamente atrasadas (anteriores a hoje)
          if (lastDailyResetDate) {
            const overdueCount = (get().reviews || []).filter(r => r.nextDateStr && r.nextDateStr < todayStr).length;
            if (overdueCount > 5) {
              const penalty = (overdueCount - 5) * 2; // -2 moedas por cada revisão atrasada além de 5
              set(state => ({ coins: Math.max(0, state.coins - penalty) }));
            }
          }

          const defaultDaily = [
            { id: 'd1', title: 'Foco Diário', description: 'Estude por 30 minutos', goal: 30, current: 0, xpReward: 30, coinReward: 10, type: 'minutes', completed: false, claimed: false },
            { id: 'd2', title: 'Aula Concluída', description: 'Marque uma aula como concluída', goal: 1, current: 0, xpReward: 20, coinReward: 5, type: 'study', completed: false, claimed: false },
            { id: 'd3', title: 'Revisão Tática', description: 'Realize 1 revisão FSRS', goal: 1, current: 0, xpReward: 15, coinReward: 5, type: 'review', completed: false, claimed: false },
          ];
          set({
            dailyMissions: defaultDaily,
            lastDailyResetDate: todayStr
          });
          return true;
        }
        return false;
      },

      updateDailyMissionProgress: (type, amount) => {
        const { checkAndResetDailyMissions } = get();
        checkAndResetDailyMissions();
        const currentDailyMissions = get().dailyMissions;
        
        const updated = currentDailyMissions.map(m => {
          if (m.type === type && !m.completed) {
            const newCurrent = Math.min(m.goal, m.current + amount);
            const isCompleted = newCurrent >= m.goal;
            if (isCompleted) {
              toast.success(`Contrato Diário cumprido: ${m.title}! 🎯`);
            }
            return { ...m, current: newCurrent, completed: isCompleted };
          }
          return m;
        });
        set({ dailyMissions: updated });
      },

      claimDailyMissionReward: (missionId) => {
        const { dailyMissions, addXP, setCoins } = get();
        const index = dailyMissions.findIndex(m => m.id === missionId);
        if (index === -1 || !dailyMissions[index].completed || dailyMissions[index].claimed) return;

        const mission = dailyMissions[index];
        addXP(mission.xpReward, `Contrato Cumprido: ${mission.title}`);
        get().playSound('coin');
        setCoins(c => c + mission.coinReward);

        const updated = [...dailyMissions];
        updated[index] = { ...mission, claimed: true };
        set({ dailyMissions: updated });
      },

      // --- HELPERS ---
      getThermometer: (perf) => {
        if (perf === undefined) return { label: 'Inédito', color: 'bg-slate-100 text-slate-400', icon: '❄️' };
        if (perf >= 0.9) return { label: 'Blindado', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: '🔋' };
        if (perf >= 0.7) return { label: 'Estável', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: '📡' };
        return { label: 'Crítico', color: 'bg-red-100 text-red-600 border-red-200', icon: '⚠️' };
      },

      getActiveTopic: (subjectId) => {
        const { subjects } = get();
        const subject = subjects[subjectId];
        if (!subject) return null;
        return (subject.topics || []).find(t => t.completed < t.total) || null;
      },

      getCurrentPatente: () => {
        const { userStats } = get();
        const sorted = [...PATENTES].reverse();
        return sorted.find(p => userStats.xp >= p.minXp) || PATENTES[0];
      },

      getSubjectProgress: (subId) => {
        const { subjects } = get();
        const s = subjects[subId];
        if (!s) return 0;
        let t = 0; let c = 0;
        (s.topics || []).forEach(x => { t += x.total; c += x.completed; });
        return t === 0 ? 0 : Math.round((c / t) * 100);
      },

      getCycleIndexForDate: (targetDateInput, baseTodayInput = null) => {
        const { cycle = [], currentDayIndex = 0, cycleScheduleType = 'weekly', cycleWeekStart = 'sunday', cycleCarryoverOffset = 0 } = get();
        const targetDate = targetDateInput instanceof Date ? targetDateInput : new Date(targetDateInput || Date.now());
        const rawToday = baseTodayInput instanceof Date ? baseTodayInput : get().getTodayDate();
        const t0 = new Date(rawToday.getFullYear(), rawToday.getMonth(), rawToday.getDate());
        const t1 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        if (cycleScheduleType === 'weekly') {
          const targetDOW = targetDate.getDay();
          const rawIdx = (cycleWeekStart === 'monday') ? (targetDOW + 6) % 7 : targetDOW;
          if (cycleCarryoverOffset > 0 && t1.getTime() === t0.getTime()) {
            return ((rawIdx - cycleCarryoverOffset) % 7 + 7) % 7;
          }
          return rawIdx;
        }
        const cycleLen = Math.max(1, cycle.length);
        const diffDays = Math.round((t1.getTime() - t0.getTime()) / (1000 * 60 * 60 * 24));
        return ((currentDayIndex + diffDays) % cycleLen + cycleLen) % cycleLen;
      },

      getRelativeDateInfo: (idx) => {
        const { currentDayIndex, cycle, cycleScheduleType, cycleWeekStart = 'sunday' } = get();
        const today = new Date();
        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
        const nomesCompletosSemana = [
          'DOMINGO',
          'SEGUNDA-FEIRA',
          'TERÇA-FEIRA',
          'QUARTA-FEIRA',
          'QUINTA-FEIRA',
          'SEXTA-FEIRA',
          'SÁBADO'
        ];

        if (cycleScheduleType === 'weekly') {
          const todayDOW = today.getDay();
          const currentWeekIndex = (cycleWeekStart === 'monday') ? (todayDOW + 6) % 7 : todayDOW;
          const dayDiff = idx - currentWeekIndex;
          
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + dayDiff);
          const targetDOW = targetDate.getDay();
          
          const isToday = dayDiff === 0;
          const isPast = dayDiff < 0;
          const isFuture = dayDiff > 0;
          const customName = get().cycleDayNames && get().cycleDayNames[idx];
          
          return {
            title: isToday ? 'HOJE' : diasSemana[targetDOW],
            dateStr: `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`,
            fullDateStr: get().getLocalDateStr(targetDate),
            isToday,
            isPast,
            isFuture,
            dayDiff,
            weekDayName: customName || nomesCompletosSemana[targetDOW],
            shortName: diasSemana[targetDOW]
          };
        }

        let offset = idx - currentDayIndex;
        if (cycle.length > 0 && offset < 0) offset += cycle.length; 
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + offset);
        return { 
          title: offset === 0 ? 'HOJE' : diasSemana[targetDate.getDay()], 
          dateStr: `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`, 
          fullDateStr: get().getLocalDateStr(targetDate),
          isToday: offset === 0,
          isPast: false,
          isFuture: offset > 0,
          dayDiff: offset,
          weekDayName: `DIA ${idx + 1}`,
          shortName: `D${idx + 1}`
        };
      },

      getSubjectEstimates: () => {
        const { subjects, cycle, cycleSlotCounts, completedToday: rawCompletedToday, completedTodayDate, subjectTimeGoal, calendarOverrides, calendarOverrideCounts, futureScheduleRules, cycleScheduleType = 'weekly' } = get();
        // completedToday de outro dia nunca é válido
        const completedToday = completedTodayDate === get().getLocalDateStr() ? (rawCompletedToday || []) : [];
        const estimates = [];
        const remainingClasses = {};
        const remainingMinutesDict = {};
        const remainingAccelMinutesDict = {};
        const remainingLessonsQueue = {};
        const classesPerBlockDict = {};

        Object.values(subjects).forEach(subject => {
          let remaining = 0;
          let remainingMinutes = 0;
          let remainingAccelMinutes = 0;
          const spd = Math.max(0.5, Number(subject.speed) || 1);
          const goalMin = Number(subject.timeGoalMinutes || subjectTimeGoal?.[subject.id]) || 0;
          const queue = [];

          (subject.topics || []).forEach(t => {
            const completed = t.completed || 0;
            remaining += Math.max(0, t.total - completed);
            const topicLessonsArr = t.lessons || [];
            for (let i = completed; i < t.total; i++) {
              const lesson = topicLessonsArr[i];
              const origSec = parseDurationToSeconds(lesson?.duration);
              const mins = (origSec > 0 ? origSec : 3600) / 60;
              const accelMins = mins / spd;
              remainingMinutes += mins;
              remainingAccelMinutes += accelMins;
              queue.push({ duration: lesson?.duration, durationMins: mins, accelMins });
            }
          });

          remainingClasses[subject.id] = remaining;
          remainingMinutesDict[subject.id] = Math.round(remainingMinutes);
          remainingAccelMinutesDict[subject.id] = Math.round(remainingAccelMinutes);
          remainingLessonsQueue[subject.id] = queue;

          // Estimativa de aulas por bloco
          if (Number(subject.lessonsPerBlock) > 0) {
            classesPerBlockDict[subject.id] = Math.floor(Number(subject.lessonsPerBlock));
          } else if (goalMin > 0 && queue.length > 0) {
            const avgAccel = remainingAccelMinutes / queue.length;
            classesPerBlockDict[subject.id] = Math.max(1, Math.round(goalMin / Math.max(1, avgAccel)));
          } else {
            classesPerBlockDict[subject.id] = 1;
          }

          if (remaining === 0) {
            estimates.push({ 
              ...subject, 
              remaining: 0, 
              remainingMinutes: 0, 
              remainingAcceleratedMinutes: 0,
              speed: spd,
              timeGoalMinutes: goalMin,
              classesPerBlock: 1,
              dateStr: 'Concluído', 
              dateObj: new Date(0) 
            });
          }
        });

        const today = get().getTodayDate();
        const todayDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const endDaysOffset = {};
        let dayOffset = 0;
        let allDone = false;
        const maxSimulationDays = 1500;
        let consecutiveNoProgressDays = 0; 

        const hasAnySchedule =
          (Array.isArray(cycle) && cycle.some(d => Array.isArray(d) && d.length > 0)) ||
          (Array.isArray(futureScheduleRules) && futureScheduleRules.length > 0) ||
          (calendarOverrides && Object.keys(calendarOverrides).length > 0);

        if (hasAnySchedule) {
          while (!allDone && dayOffset < maxSimulationDays) {
            const targetSimDate = new Date(todayDateObj);
            targetSimDate.setDate(targetSimDate.getDate() + dayOffset);
            const simCarryoverOffset = (dayOffset === 0 && cycleScheduleType === 'weekly') ? (get().cycleCarryoverOffset || 0) : 0;
            const effectiveSimDate = simCarryoverOffset > 0
              ? new Date(targetSimDate.getFullYear(), targetSimDate.getMonth(), targetSimDate.getDate() - simCarryoverOffset)
              : targetSimDate;
            const simDateKey = `${effectiveSimDate.getFullYear()}-${String(effectiveSimDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveSimDate.getDate()).padStart(2, '0')}`;

            let daySubjects = [];
            let daySlotCounts = [];
            if (calendarOverrides && Array.isArray(calendarOverrides[simDateKey])) {
              daySubjects = [...calendarOverrides[simDateKey]];
              daySlotCounts = Array.isArray(calendarOverrideCounts?.[simDateKey]) ? [...calendarOverrideCounts[simDateKey]] : [];
            } else {
              const cycleIndex = get().getCycleIndexForDate(targetSimDate, todayDateObj);
              const targetDayOfWeek = effectiveSimDate.getDay();
              const matchingRules = (futureScheduleRules || [])
                .filter(r => {
                  if (!r || r.v !== 2 || !r.fromDate || r.fromDate > simDateKey) return false;
                  if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
                    return r.dayOfWeek === targetDayOfWeek;
                  }
                  return r.dayOfWeek === targetDayOfWeek || r.cycleIndex === cycleIndex;
                })
                .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

              if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
                daySubjects = [...matchingRules[0].daySlots];
                daySlotCounts = Array.isArray(matchingRules[0].slotCounts) ? [...matchingRules[0].slotCounts] : [];
              } else {
                daySubjects = [...(cycle[cycleIndex] || [])];
                daySlotCounts = Array.isArray(cycleSlotCounts?.[cycleIndex]) ? [...cycleSlotCounts[cycleIndex]] : [];
              }
            }
            
            let progressMadeToday = false;
            daySubjects.forEach((subId, slotIdx) => {
              if (dayOffset === 0 && completedToday.includes(slotIdx)) return; 
              
              let effectiveSubId = subId;
              let q = remainingLessonsQueue[effectiveSubId];
              let wasTransitioned = false;

              // Se a matéria original esgotou suas aulas, verificar a regra de transição explícita (suporta cadeia de substituições)
              const visited = new Set([effectiveSubId]);
              while (!q || q.length === 0) {
                const currentSub = subjects[effectiveSubId];
                const action = currentSub?.onCompleteAction || 'keep_fixed';

                if (action === 'replace' && currentSub?.replacementSubjectId && subjects[currentSub.replacementSubjectId] && !visited.has(currentSub.replacementSubjectId)) {
                  const repId = currentSub.replacementSubjectId;
                  visited.add(repId);
                  effectiveSubId = repId;
                  q = remainingLessonsQueue[repId];
                  wasTransitioned = true;
                } else if (action === 'double_remaining') {
                  const fallbackId = daySubjects.find(sId => !visited.has(sId) && remainingLessonsQueue[sId]?.length > 0);
                  
                  if (fallbackId) {
                    visited.add(fallbackId);
                    effectiveSubId = fallbackId;
                    q = remainingLessonsQueue[fallbackId];
                    wasTransitioned = true;
                  } else {
                    break;
                  }
                } else {
                  break;
                }
              }

              if (q && q.length > 0) {
                const sub = subjects[effectiveSubId];
                const spd = Math.max(0.5, Number(sub?.speed) || 1);
                const customSlotLessons = !wasTransitioned ? Math.floor(Number(daySlotCounts?.[slotIdx]) || 0) : 0;
                const lessonsN = customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(sub?.lessonsPerBlock) || 0);
                const goalMin = customSlotLessons > 0 ? 0 : (Number(sub?.timeGoalMinutes || subjectTimeGoal?.[effectiveSubId]) || 0);
                
                const suggestion = calculateLessonsForGoal(q, 0, spd, goalMin, q.length, lessonsN);
                const slotCount = Math.min(q.length, Math.max(1, suggestion.count || 1));
                q.splice(0, slotCount);
                progressMadeToday = true;

                if (q.length === 0 && endDaysOffset[effectiveSubId] === undefined) {
                  endDaysOffset[effectiveSubId] = dayOffset;
                }
              }
            });

            if (progressMadeToday) {
              consecutiveNoProgressDays = 0;
            } else {
              consecutiveNoProgressDays++;
            }

            const anyRemainingInQueues = Object.keys(remainingLessonsQueue).some(subId => remainingLessonsQueue[subId].length > 0);
            if (!anyRemainingInQueues || consecutiveNoProgressDays >= 60) {
              allDone = true;
            } else {
              dayOffset++;
            }
          }
        }

        Object.values(subjects).forEach(sub => {
          if (remainingClasses[sub.id] > 0) {
            const daysToFinish = endDaysOffset[sub.id] !== undefined ? endDaysOffset[sub.id] : 999;
            const completionDate = new Date(todayDateObj);
            completionDate.setDate(completionDate.getDate() + daysToFinish);

            const mesesNomesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const dia = String(completionDate.getDate()).padStart(2, '0');
            const ano = completionDate.getFullYear();

            if (!estimates.some(e => e.id === sub.id)) {
               estimates.push({
                 ...sub,
                 speed: Number(sub.speed) || 1,
                 timeGoalMinutes: Number(sub.timeGoalMinutes || subjectTimeGoal?.[sub.id]) || 0,
                 classesPerBlock: classesPerBlockDict[sub.id] || 1,
                 remaining: remainingClasses[sub.id],
                 remainingMinutes: remainingMinutesDict[sub.id],
                 remainingAcceleratedMinutes: remainingAccelMinutesDict[sub.id],
                 dateStr: `${dia}/${mesesNomesShort[completionDate.getMonth()]}/${ano}`,
                 dateObj: completionDate,
                 isScheduledInCycle: endDaysOffset[sub.id] !== undefined
               });
            }
          }
        });

        return estimates.sort((a, b) => {
          if (a.remaining === 0 && b.remaining === 0) return 0;
          if (a.remaining === 0) return -1;
          if (b.remaining === 0) return 1;
          return a.dateObj - b.dateObj;
        });
      },

      getEstimatedCompletionDate: () => {
        const { getSubjectEstimates, targetExamDate } = get();
        const subjectEstimates = getSubjectEstimates();
        const unfinished = subjectEstimates.filter(e => e.remaining > 0);
        if (unfinished.length === 0) return { short: "Concluído", full: "Edital Concluído", isLate: false };

        const scheduledUnfinished = unfinished.filter(e => e.isScheduledInCycle !== false);
        const targetList = scheduledUnfinished.length > 0 ? scheduledUnfinished : unfinished;
        const lastSubject = targetList[targetList.length - 1];
        const completionDate = lastSubject.dateObj;
        const parsedExam = new Date(`${targetExamDate || '2026-08-15'}T00:00:00`);
        const examDateObj = isNaN(parsedExam.getTime()) ? new Date('2026-08-15T00:00:00') : parsedExam;
        
        const isLate = completionDate > examDateObj;
        const daysDiff = Math.round((completionDate - examDateObj) / (1000 * 60 * 60 * 24));

        const mesesNomesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesesNomesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return {
          short: `${String(completionDate.getDate()).padStart(2, '0')}/${mesesNomesShort[completionDate.getMonth()]}/${completionDate.getFullYear()}`,
          full: `${String(completionDate.getDate()).padStart(2, '0')} de ${mesesNomesFull[completionDate.getMonth()]} de ${completionDate.getFullYear()}`,
          isLate: isLate,
          daysDiff: daysDiff,
          examDateFormatted: `${String(examDateObj.getDate()).padStart(2, '0')}/${mesesNomesShort[examDateObj.getMonth()]}/${examDateObj.getFullYear()}`
        };
      },

      getStartOfWeek: (dateInput) => {
        const date = dateInput ? new Date(dateInput) : new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
      },

      checkAndResetWeekly: () => {
        const { weeklySprint, getStartOfWeek, getLocalDateStr } = get();
        const now = new Date();
        const currentMonday = getStartOfWeek(now);
        const currentWeekStartStr = getLocalDateStr(currentMonday);
        const sprintWeekStartStr = weeklySprint?.weekStart
          ? getLocalDateStr(getStartOfWeek(new Date(weeklySprint.weekStart)))
          : null;

        if (!sprintWeekStartStr || currentWeekStartStr !== sprintWeekStartStr) {
          set(state => ({
            weeklySprint: {
              ...state.weeklySprint,
              currentMinutes: 0,
              weekStart: currentMonday.toISOString()
            },
            weeklyMissions: state.weeklyMissions.map(m => ({
              ...m,
              current: 0,
              completed: false,
              claimed: false
            }))
          }));
          return true;
        }
        return false;
      },

      checkAndAdvanceSeason: () => {
        const { seasonalData, setCoins } = get();
        const now = new Date();
        const endDate = new Date(seasonalData.endDate);
        
        if (now >= endDate || seasonalData.seasonXp >= seasonalData.seasonGoalXp) {
          const reachedGoal = seasonalData.seasonXp >= seasonalData.seasonGoalXp;
          const nextSeasonNum = seasonalData.currentSeason + 1;
          
          const seasonNames = [
            "Recruta Operacional",
            "Patrulheiro Tático",
            "Inspetor de Elite",
            "Guardião das Rodovias",
            "Comandante do Asfalto",
            "Força Especial PRF"
          ];
          const newName = seasonNames[(nextSeasonNum - 1) % seasonNames.length];
          
          if (reachedGoal) {
            setCoins(c => c + 500);
            toast.success(`🎉 Temporada concluída! Você atingiu o objetivo de XP e ganhou 500 moedas bônus!`);
          } else {
            toast.info(`⏳ A temporada anterior terminou. Iniciando nova temporada.`);
          }

          set({
            seasonalData: {
              currentSeason: nextSeasonNum,
              seasonName: newName,
              seasonXp: 0,
              seasonGoalXp: 5000 + (nextSeasonNum - 1) * 1000,
              startDate: now.toISOString(),
              endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          });
          return true;
        }
        return false;
      },

      buyReward: (reward) => {
        const { coins, unlockAvatar, unlockMedal } = get();
        if (coins < reward.cost) {
          toast.error(`Moedas insuficientes para resgatar "${reward.title}"!`);
          return false;
        }

        if (reward.category === 'customizacao') {
          return unlockAvatar(reward.avatarPath, reward.cost);
        }

        // Gameplay boosters
        if (reward.isGameplay) {
          if (reward.id === 9) { // Boost XP (2x)
            set(state => {
              const activeBoosts = state.activeBoosts || { xpBoostActions: 0, streakShieldActive: false };
              return {
                coins: state.coins - reward.cost,
                activeBoosts: {
                  ...activeBoosts,
                  xpBoostActions: (activeBoosts.xpBoostActions || 0) + 5
                },
                userStats: {
                  ...state.userStats,
                  totalPurchases: (state.userStats.totalPurchases || 0) + 1
                }
              };
            });
            const newPurchases = (get().userStats.totalPurchases || 0);
            if (newPurchases >= 5) unlockMedal('investidor');
            toast.success(`Boost de XP (2x) ativado para as próximas 5 ações! ⚡`);
            return true;
          }

          if (reward.id === 10) { // Escudo de Streak
            if (get().activeBoosts?.streakShieldActive) {
              toast.info("O Escudo de Streak já está ativo!");
              return false;
            }
            set(state => {
              const activeBoosts = state.activeBoosts || { xpBoostActions: 0, streakShieldActive: false };
              return {
                coins: state.coins - reward.cost,
                activeBoosts: {
                  ...activeBoosts,
                  streakShieldActive: true
                },
                userStats: {
                  ...state.userStats,
                  totalPurchases: (state.userStats.totalPurchases || 0) + 1
                }
              };
            });
            const newPurchases = (get().userStats.totalPurchases || 0);
            if (newPurchases >= 5) unlockMedal('investidor');
            toast.success(`Escudo de Streak ativado! Seu streak está protegido. 🛡️`);
            return true;
          }
        }

        // Normal reward (Leisure/Well-being/Premium)
        set(state => ({
          coins: state.coins - reward.cost,
          userStats: {
            ...state.userStats,
            totalPurchases: (state.userStats.totalPurchases || 0) + 1
          }
        }));

        const newPurchases = (get().userStats.totalPurchases || 0);
        if (newPurchases >= 5) unlockMedal('investidor');
        toast.success(`Você resgatou com sucesso: "${reward.title}"! 🎉`);
        return true;
      },

      setSyntaxLevel: (syntaxLevel) => set({ syntaxLevel }),

      applyTheme: (themeId) => {
        const theme = THEME_DEFINITIONS[themeId] || THEME_DEFINITIONS['blue'];
        const root = document.documentElement;
        Object.keys(theme.colors).forEach(shade => {
          root.style.setProperty(`--theme-blue-${shade}`, theme.colors[shade]);
        });
        if (get().activeTheme !== themeId) {
          set({ activeTheme: themeId });
        }
      },

      unlockTheme: (themeId, cost) => {
        const { coins, unlockedThemes, setCoins } = get();
        if (coins < cost) {
          toast.error("Moedas insuficientes para desbloquear este tema!");
          return false;
        }
        if (unlockedThemes.includes(themeId)) {
          toast.error("Tema já desbloqueado!");
          return false;
        }
        setCoins(c => c - cost);
        set(state => ({
          unlockedThemes: [...state.unlockedThemes, themeId]
        }));
        toast.success("Tema de cores desbloqueado com sucesso! 🎨");
        get().playSound('levelUp');
        return true;
      },

      selectTheme: (themeId) => {
        const { unlockedThemes, applyTheme } = get();
        if (!unlockedThemes.includes(themeId)) {
          toast.error("Você precisa desbloquear este tema antes de equipá-lo!");
          return false;
        }
        applyTheme(themeId);
        toast.success("Tema de cores equipado com sucesso!");
        return true;
      },

      setDailyGoalMinutes: (minutes) => set({ dailyGoalMinutes: minutes }),

      setSubjectGoal: (subjectId, minutes) => set(state => ({
        subjectGoals: {
          ...state.subjectGoals,
          [subjectId]: minutes
        }
      })),

      setSubjectTimeGoal: (subjectId, minutes) => set(state => ({
        subjectTimeGoal: {
          ...state.subjectTimeGoal,
          [subjectId]: minutes
        },
        subjects: state.subjects[subjectId] ? {
          ...state.subjects,
          [subjectId]: {
            ...state.subjects[subjectId],
            timeGoalMinutes: minutes,
            // Meta de tempo e quantidade fixa de aulas são mutuamente exclusivas
            lessonsPerBlock: minutes > 0 ? 0 : (state.subjects[subjectId].lessonsPerBlock || 0)
          }
        } : state.subjects
      })),

      // Define uma quantidade fixa de aulas por bloco (0 = desativado). Desliga a meta de tempo quando > 0.
      setSubjectLessonsPerBlock: (subjectId, lessons) => set(state => {
        const n = Math.min(50, Math.max(0, Math.floor(Number(lessons) || 0)));
        if (!state.subjects[subjectId]) return state;
        return {
          subjectTimeGoal: n > 0
            ? { ...state.subjectTimeGoal, [subjectId]: 0 }
            : state.subjectTimeGoal,
          subjects: {
            ...state.subjects,
            [subjectId]: {
              ...state.subjects[subjectId],
              lessonsPerBlock: n,
              timeGoalMinutes: n > 0 ? 0 : (state.subjects[subjectId].timeGoalMinutes || 0)
            }
          }
        };
      }),

      setPushSettings: (pushSettings) => set({ pushSettings }),

      triggerNotification: async (title, options) => {
        const { pushSettings } = get();
        if (!pushSettings.enabled) return;
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'granted') {
          try {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.showNotification) {
              registration.showNotification(title, options);
            } else {
              new Notification(title, options);
            }
          } catch {
            new Notification(title, options);
          }
        }
      },

      saveTopicNotes: (subjectId, topicId, notes) => {
        set(state => {
          const newSubjects = { ...state.subjects };
          if (newSubjects[subjectId]) {
            const subject = { ...newSubjects[subjectId] };
            const topics = (subject.topics || []).map(t => 
              t.id === topicId ? { ...t, notes } : t
            );
            subject.topics = topics;
            newSubjects[subjectId] = subject;
          }
          return { subjects: newSubjects };
        });
        toast.success("Anotação salva com sucesso!");
      }
    })
);

// Motor de replicação em nuvem em Segundo Plano - AGORA INSTANTÂNEO
let pendingSaves = 0;

// Proteção ativa contra fechamento/F5 da aba durante um salvamento em andamento
window.addEventListener('beforeunload', (e) => {
  const st = useStore.getState();
  if (pendingSaves > 0 || st.isSavingToCloud || st.savePending) {
    e.preventDefault();
    e.returnValue = "Seus dados ainda estão sendo enviados para a Nuvem de forma 100% online. Fechar agora cancelará o envio.";
    return e.returnValue;
  }
});

useStore.subscribe((state, prevState) => {
  // Não grava snapshot nem agenda upload enquanto o carregamento inicial da nuvem está em curso
  if (state.isLoadingFromCloud || state.isSyncing) return;

  const changedKeys = PERSISTED_KEYS.filter(key => state[key] !== prevState[key]);
  if (changedKeys.length === 0) return;

  const nowIso = new Date().toISOString();
  const nextTimestamps = { ...(useStore._keyTimestamps || {}) };
  changedKeys.forEach((key) => {
    nextTimestamps[key] = nowIso;
  });
  useStore._keyTimestamps = nextTimestamps;

  // A1: Snapshot local com debounce curto (~500 ms) mesmo offline, sem login ou se a nuvem falhou
  clearTimeout(useStore._localDebounceTimer);
  useStore._localDebounceTimer = setTimeout(() => {
    const latestState = useStore.getState();
    writeLocalSnapshot(latestState, {
      dirty: true,
      savedAt: new Date().toISOString(),
      keyTimestamps: useStore._keyTimestamps || {}
    });
  }, 500);

  // Só envia para a nuvem depois que a sincronização inicial concluiu com segurança
  if (!state.user || !state.hasCompletedInitialCloudSync) return;

  clearTimeout(useStore._debounceTimer);
  useStore._debounceTimer = setTimeout(() => {
    pendingSaves++;
    useStore.getState().saveToCloud().finally(() => {
      pendingSaves = Math.max(0, pendingSaves - 1);
    });
  }, 1500);
});

