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
  caveiraDailyGoal: 50,
  caveiraSessionStats: null,
  caveiraFilterMemory: {},
  caveiraCourseIndexMap: {},
  caveiraPerformanceSnapshot: null,
  lifeRoutine: {
    days: {
      seg: [],
      ter: [],
      qua: [],
      qui: [],
      sex: [],
      sab: [],
      dom: []
    },
    startHour: 5,
    autoSyncLessons: true,
    preferredLayout: 'blocks',
    blocksPerDay: 1,
    blockBreakMin: 30,
    subjectBreakMin: 15,
    syncedSignatures: {}
  },
});

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
  'cycleScheduleType', 'cycleWeekStart', 'cycleDayNames', 'cycleSlotCounts', 'cycleCarryoverOffset', 'lastCarryoverCheckDate', 'calendarOverrides', 'calendarOverrideCounts', 'futureScheduleRules', 'xpHistory', 'petData', 'caveiraQuestions', 'caveiraDailyGoal', 'caveiraFilterMemory', 'caveiraCourseIndexMap', 'lifeRoutine'
];
