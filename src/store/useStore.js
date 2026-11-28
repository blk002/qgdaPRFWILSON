import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import { PET_FOODS, PET_LEVELS } from '../data/petConstants';
import { parseDurationToSeconds, calculateLessonsForGoal } from '../lib/durationHelpers';
import { normalizeCourseLookupKey } from '../lib/courseIndexParser';
import { extractCourseIdFromUrl, scoreLessonTitleMatch } from '../lib/caveiraLessonLinks';
import { applySubjectDaysToSchedule } from '../lib/calendarBulkOps';
import { normalizeErrorReason, getErrorCauseMeta } from '../lib/errorAutopsy';
import {
  DEFAULT_CAVEIRA_QUESTION_PREFS,
  sanitizeCaveiraQuestionPrefs,
  resolveEffectiveDifficultyIds,
  formatDifficultyIdsLabel,
  sanitizeDifficultyIds,
} from '../lib/caveiraDifficulty';
import {
  INITIAL_FIXATION_TARGET,
  INITIAL_FIXATION_DIFFICULTY_ID,
  PROGRESSIVE_REVIEW_TARGET,
  FIRST_REVIEW_DIFFICULTY_ID,
  getExpandedDifficultyIds,
  addDaysToLocalDateStr,
  computeNextProgressiveReviewState,
  serializeMissionForBridge,
  isMissionNewerThan,
  getMissionSyncSignature,
  doesQuestionMatchMissionSubject,
} from '../lib/lessonMastery';
import {
  LOCAL_TEST_ACCOUNT,
  createLocalTestSession,
  isLocalTestUser,
  persistLocalTestSession,
} from '../lib/localTestAuth';
import {
  cleanAlternativeText,
  cleanAltText,
  THEME_DEFINITIONS,
  getCleanInitialState,
  PERSISTED_KEYS
} from './storeConfig';
import {
  saveLocalRestorePoint,
  listLocalRestorePoints,
  removeLocalRestorePoint,
  extractPersistedData,
} from '../lib/backupManager';

export {
  cleanAlternativeText,
  cleanAltText,
  THEME_DEFINITIONS,
  getCleanInitialState,
  PERSISTED_KEYS
};

const CAVEIRA_OWNER_KEY = 'prf_caveira_owner_id';

const parseIsoMs = (ts) => {
  const n = Date.parse(String(ts || ''));
  return Number.isFinite(n) ? n : 0;
};

const toSortableIsoDate = (raw) => {
  const s = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

const matchesCaveiraReview = (r, targetId) =>
  Boolean(
    r &&
      targetId &&
      (r.caveiraQuestionId === targetId ||
        r.id === `rev_caveira_${targetId}` ||
        String(r.topicName || '').startsWith(`[Caveira ${targetId}]`))
  );

const mergeAttempts = (prev = null, incoming = {}) => {
  const list = [];
  const pushUnique = (entry) => {
    if (!entry || typeof entry !== 'object') return;
    const ts = entry.timestamp || new Date().toISOString();
    const tsMs = new Date(ts).getTime() || 0;
    const hit = Boolean(entry.hit);
    const userChoice = String(entry.userChoice || '');
    const durationSeconds = Number(entry.durationSeconds) || 0;
    const dup = list.some(existing => {
      const exMs = new Date(existing.timestamp || 0).getTime() || 0;
      return Math.abs(exMs - tsMs) <= 5000 && Boolean(existing.hit) === hit && String(existing.userChoice || '') === userChoice;
    });
    if (!dup) {
      list.push({ timestamp: ts, hit, userChoice, durationSeconds });
    }
  };

  if (prev && typeof prev === 'object') {
    if (Array.isArray(prev.attempts) && prev.attempts.length > 0) {
      prev.attempts.forEach(pushUnique);
    } else if (prev.timestamp || prev.updatedAt || prev.userChoice) {
      pushUnique({
        timestamp: prev.timestamp || prev.updatedAt,
        hit: prev.hit,
        userChoice: prev.userChoice,
        durationSeconds: prev.durationSeconds
      });
    }
  }

  if (Array.isArray(incoming.attempts) && incoming.attempts.length > 0) {
    incoming.attempts.forEach(pushUnique);
  } else if (incoming.timestamp || incoming.userChoice !== undefined || incoming.hit !== undefined) {
    const incomingTs = incoming.timestamp || incoming.updatedAt || new Date().toISOString();
    const incomingMs = new Date(incomingTs).getTime() || 0;
    const latest = list.length > 0 ? list[list.length - 1] : null;
    const latestMs = latest ? (new Date(latest.timestamp || 0).getTime() || 0) : 0;
    const changedResult = latest && (Boolean(latest.hit) !== Boolean(incoming.hit) || String(latest.userChoice || '') !== String(incoming.userChoice || ''));
    if (!latest || Math.abs(incomingMs - latestMs) > 5000 || (changedResult && incomingMs >= latestMs)) {
      pushUnique({
        timestamp: incomingTs,
        hit: incoming.hit,
        userChoice: incoming.userChoice,
        durationSeconds: incoming.durationSeconds
      });
    }
  }

  return list.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
};

const enrichCaveiraQuestionPayload = (prev = null, incoming = {}) => {
  const merged = prev ? { ...prev, ...incoming } : { ...incoming };
  const attempts = mergeAttempts(prev, incoming);
  const communityCorrectPct = incoming.communityCorrectPct !== undefined && incoming.communityCorrectPct !== null
    ? Number(incoming.communityCorrectPct)
    : (prev?.communityCorrectPct !== undefined && prev?.communityCorrectPct !== null ? Number(prev.communityCorrectPct) : null);
  const communityErrorPct = incoming.communityErrorPct !== undefined && incoming.communityErrorPct !== null
    ? Number(incoming.communityErrorPct)
    : (communityCorrectPct !== null ? Math.max(0, Math.min(100, Math.round(100 - communityCorrectPct))) : (prev?.communityErrorPct ?? null));
  const hitVal = Boolean(merged.hit);
  return {
    ...merged,
    attempts,
    ...(communityCorrectPct !== null && Number.isFinite(communityCorrectPct) ? { communityCorrectPct } : {}),
    ...(communityErrorPct !== null && Number.isFinite(communityErrorPct) ? { communityErrorPct } : {}),
    isPegadinha: communityErrorPct !== null && Number.isFinite(communityErrorPct) ? communityErrorPct >= 65 : Boolean(merged.isPegadinha),
    isAvoidableError: !hitVal && communityCorrectPct !== null && Number.isFinite(communityCorrectPct) ? communityCorrectPct >= 65 : false,
    commentSource: incoming.commentSource || prev?.commentSource || (merged.teacherComment ? 'professor' : ''),
    ...(incoming.courseVideoUrl || prev?.courseVideoUrl ? { courseVideoUrl: incoming.courseVideoUrl || prev?.courseVideoUrl } : {}),
    ...(incoming.courseTimestampSec !== undefined || prev?.courseTimestampSec !== undefined
      ? { courseTimestampSec: incoming.courseTimestampSec ?? prev?.courseTimestampSec }
      : {})
  };
};

const getInitialLocalCaveiraQuestions = () => {
  try {
    if (localStorage.getItem('prf_caveira_schema') !== 'v3_strict_clean') {
      localStorage.removeItem('prf_caveira_questions');
      localStorage.removeItem(CAVEIRA_OWNER_KEY);
      localStorage.setItem('prf_caveira_schema', 'v3_strict_clean');
      return [];
    }
    const saved = localStorage.getItem('prf_caveira_questions');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

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

  if (cleanData.completedTodayDate === undefined) cleanData.completedTodayDate = null;
  if (!Array.isArray(cleanData.completedToday)) cleanData.completedToday = [];
  if (!cleanData.slotProgressToday || typeof cleanData.slotProgressToday !== 'object' || Array.isArray(cleanData.slotProgressToday)) {
    cleanData.slotProgressToday = {};
  }
  if (!cleanData.studyHistory) cleanData.studyHistory = {};
  if (!cleanData.unlockedAvatars || cleanData.unlockedAvatars.length === 0) {
    cleanData.unlockedAvatars = [...defaults.unlockedAvatars];
  }
  if (!cleanData.dailyMissions) cleanData.dailyMissions = [];
  if (!cleanData.lastDailyResetDate) cleanData.lastDailyResetDate = null;
  cleanData.userStats = {
    ...defaults.userStats,
    ...(cleanData.userStats && typeof cleanData.userStats === 'object' ? cleanData.userStats : {}),
    medals: Array.isArray(cleanData.userStats?.medals) ? cleanData.userStats.medals : [],
  };
  if (!cleanData.userStats.avatar) {
    cleanData.userStats.avatar = '/assets/gamification/avatar_male.png';
  }
  if (cleanData.userStats.totalPurchases === undefined) {
    cleanData.userStats.totalPurchases = 0;
  }
  cleanData.streakData = {
    ...defaults.streakData,
    ...(cleanData.streakData && typeof cleanData.streakData === 'object' ? cleanData.streakData : {}),
  };
  cleanData.reviewStats = {
    ...defaults.reviewStats,
    ...(cleanData.reviewStats && typeof cleanData.reviewStats === 'object' ? cleanData.reviewStats : {}),
  };
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
      const nowD = new Date();
      const todayLocalNow = `${nowD.getFullYear()}-${String(nowD.getMonth() + 1).padStart(2, '0')}-${String(nowD.getDate()).padStart(2, '0')}`;
      const sortedAsc = [...cleanData.futureScheduleRules]
        .filter(r => r && r.v === 2 && (!r.fromDate || r.fromDate <= todayLocalNow) && Array.isArray(r.daySlots) && r.daySlots.length > 0)
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
  if (!cleanData.lifeRoutine || typeof cleanData.lifeRoutine !== 'object') {
    cleanData.lifeRoutine = defaults.lifeRoutine;
  } else {
    const rawDays = cleanData.lifeRoutine.days || {};
    cleanData.lifeRoutine = {
      ...defaults.lifeRoutine,
      ...cleanData.lifeRoutine,
      days: {
        seg: Array.isArray(rawDays.seg) ? rawDays.seg : [],
        ter: Array.isArray(rawDays.ter) ? rawDays.ter : [],
        qua: Array.isArray(rawDays.qua) ? rawDays.qua : [],
        qui: Array.isArray(rawDays.qui) ? rawDays.qui : [],
        sex: Array.isArray(rawDays.sex) ? rawDays.sex : [],
        sab: Array.isArray(rawDays.sab) ? rawDays.sab : [],
        dom: Array.isArray(rawDays.dom) ? rawDays.dom : [],
      },
    };
  }
  if (!cleanData.discursivaData || typeof cleanData.discursivaData !== 'object') {
    cleanData.discursivaData = defaults.discursivaData;
  } else {
    cleanData.discursivaData = {
      favorites: Array.isArray(cleanData.discursivaData.favorites) ? cleanData.discursivaData.favorites : [],
      mastered: Array.isArray(cleanData.discursivaData.mastered) ? cleanData.discursivaData.mastered : [],
      customRepertorios: Array.isArray(cleanData.discursivaData.customRepertorios) ? cleanData.discursivaData.customRepertorios : []
    };
  }

  // Mescla caveiraQuestions preservando dados da nuvem e locais
  const incomingCaveira = Array.isArray(cleanData.caveiraQuestions) ? cleanData.caveiraQuestions : [];
  const mergedMap = new Map();
  (currentCaveira || []).forEach(q => { if (q && q.id) mergedMap.set(q.id, q); });
  incomingCaveira.forEach(q => { if (q && q.id) mergedMap.set(q.id, { ...(mergedMap.get(q.id) || {}), ...q }); });
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

const appendLocalBackup = (data, reason = 'auto', userId = null, label = '') => {
  return saveLocalRestorePoint(data, {
    reason,
    label,
    userId: userId || useStore.getState?.().user?.id || null,
  });
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

    if (key === 'tafAppData') {
      if (remoteVal && typeof remoteVal === 'object' && !(lTs > rTs && localKeyTimestamps?.tafAppData)) {
        merged[key] = remoteVal;
      } else {
        merged[key] = localVal;
      }
      return;
    }

    if (key === 'tafTrainingStatus') {
      const rDate = remoteVal?.lastDoneDate || null;
      const lDate = localVal?.lastDoneDate || null;
      const maxDate = [rDate, lDate].filter(Boolean).sort().pop() || null;
      merged[key] = { ...(remoteVal || {}), ...(localVal || {}), lastDoneDate: maxDate };
      return;
    }

    if (key === 'tafHistory') {
      const deletedIds = new Set([
        ...(Array.isArray(remoteRaw?.tafAppData?.deletedTafIds) ? remoteRaw.tafAppData.deletedTafIds : []),
        ...(Array.isArray(localState?.tafAppData?.deletedTafIds) ? localState.tafAppData.deletedTafIds : []),
      ]);
      const byId = new Map();
      (Array.isArray(remoteVal) ? remoteVal : []).forEach((s) => {
        if (s && s.id != null && !deletedIds.has(s.id)) byId.set(s.id, s);
      });
      (Array.isArray(localVal) ? localVal : []).forEach((s) => {
        if (s && s.id != null && !deletedIds.has(s.id)) byId.set(s.id, s);
      });
      merged[key] = Array.from(byId.values()).sort((a, b) => Number(a.id) - Number(b.id));
      return;
    }

    if (key === 'activePracticeMission') {
      const completedSet = new Set([
        ...(Array.isArray(remoteRaw?.completedMissionIds) ? remoteRaw.completedMissionIds.map(String) : []),
        ...(Array.isArray(localState?.completedMissionIds) ? localState.completedMissionIds.map(String) : []),
      ]);
      const safeLocal = localVal && localVal.id && !completedSet.has(String(localVal.id)) ? localVal : null;
      const safeRemote = remoteVal && remoteVal.id && !completedSet.has(String(remoteVal.id)) ? remoteVal : null;
      if (!safeLocal && !safeRemote) {
        merged[key] = null;
        return;
      }
      if (!safeLocal || !safeRemote) {
        const localWonTs = lTs > rTs;
        merged[key] = safeLocal ? (lTs >= rTs ? safeLocal : null) : (localWonTs ? null : safeRemote);
        return;
      }
      if (String(safeLocal.id) === String(safeRemote.id)) {
        const lIds = Array.isArray(safeLocal.answeredQuestionIds) ? safeLocal.answeredQuestionIds.map(String) : [];
        const rIds = Array.isArray(safeRemote.answeredQuestionIds) ? safeRemote.answeredQuestionIds.map(String) : [];
        const unionIds = Array.from(new Set([...lIds, ...rIds]));
        const unionDiffs = sanitizeDifficultyIds([
          ...(Array.isArray(safeLocal.activeDifficultyIds) ? safeLocal.activeDifficultyIds : []),
          ...(Array.isArray(safeRemote.activeDifficultyIds) ? safeRemote.activeDifficultyIds : []),
        ]);
        merged[key] = {
          ...safeRemote,
          ...safeLocal,
          answeredQuestionIds: unionIds,
          hits: Math.max(Number(safeLocal.hits) || 0, Number(safeRemote.hits) || 0),
          errors: Math.max(Number(safeLocal.errors) || 0, Number(safeRemote.errors) || 0),
          activeDifficultyIds: unionDiffs,
          updatedAt: Math.max(Number(safeLocal.updatedAt) || 0, Number(safeRemote.updatedAt) || 0),
        };
      } else {
        merged[key] = isMissionNewerThan(safeLocal, safeRemote) ? safeLocal : safeRemote;
      }
      return;
    }

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
      cloudSyncError: null,
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
        let storedOwner = null;
        try { storedOwner = localStorage.getItem(CAVEIRA_OWNER_KEY); } catch (_) {}
        const switchedToDifferentOwner = Boolean(
          nextUser?.id && ((state.user?.id && state.user.id !== nextUser.id) || (storedOwner && storedOwner !== nextUser.id))
        );
        const shouldClearUserData = switchedToDifferentOwner || !nextUser;
        return {
          session,
          user: nextUser,
          ...(userChanged ? { hasCompletedInitialCloudSync: false } : {}),
          ...(shouldClearUserData ? {
            caveiraQuestions: [],
            reviews: [],
            progressiveReviews: [],
            activePracticeMission: null,
            completedMissionIds: [],
            caveiraSessionStats: null,
            caveiraPerformanceSnapshot: null,
            caveiraFilterMemory: {},
            caveiraCourseIndexMap: {},
          } : {})
        };
      }),
      
      signInLocalTest: async () => {
        persistLocalTestSession(true);
        const localSession = createLocalTestSession();
        get().setSession(localSession);
        await get().loadFromCloud();
        return localSession;
      },

      signOut: async () => {
        const isLocal = isLocalTestUser(get().user);
        persistLocalTestSession(false);
        if (!isLocal) {
          await supabase.auth.signOut();
        }
        set({
          session: null,
          user: null,
          caveiraQuestions: [],
          reviews: [],
          progressiveReviews: [],
          activePracticeMission: null,
          completedMissionIds: [],
          caveiraSessionStats: null,
          caveiraPerformanceSnapshot: null,
          caveiraFilterMemory: {},
          caveiraCourseIndexMap: {},
          hasCompletedInitialCloudSync: false,
        });
        localStorage.removeItem('prf-qg-storage');
        localStorage.removeItem('prf_qg_backups');
        localStorage.removeItem('prf_caveira_questions');
        localStorage.removeItem('qg_lesson_index_map_v1');
        localStorage.removeItem(CAVEIRA_OWNER_KEY);
        localStorage.removeItem(LOCAL_STATE_STORAGE_KEY);
        await new Promise((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            window.removeEventListener('message', onAck);
            resolve();
          };
          const onAck = (event) => {
            if (
              event?.source === window &&
              event?.origin === window.location.origin &&
              event?.data?.source === 'QG_CAVEIRA_EXTENSION' &&
              event?.data?.type === 'USER_SIGNED_OUT_ACK'
            ) {
              done();
            }
          };
          window.addEventListener('message', onAck);
          setTimeout(done, 450);
          try {
            window.postMessage({ source: 'QG_WEB_APP', type: 'USER_SIGNED_OUT' }, window.location.origin);
          } catch (_) {
            done();
          }
        });
        window.location.reload();
      },

      loadFromCloud: async (retryCount = 0) => {
        const { user, isLoadingFromCloud } = get();
        if (!user) return false;
        if (isLoadingFromCloud && retryCount === 0) return false;

        // Isolamento por usuário: descarta cache local de Caveira se pertencia a outra conta ou sem dono
        let storedCaveiraOwner = null;
        try { storedCaveiraOwner = localStorage.getItem(CAVEIRA_OWNER_KEY); } catch (_) {}
        const isForeignCaveiraCache = storedCaveiraOwner !== user.id;
        if (isForeignCaveiraCache) {
          try { localStorage.removeItem('prf_caveira_questions'); } catch (_) {}
          set({ caveiraQuestions: [] });
        }
        try { localStorage.setItem(CAVEIRA_OWNER_KEY, user.id); } catch (_) {}

        // Modo Conta Local de Teste (isolado apenas em localStorage, sem acessar Supabase)
        if (isLocalTestUser(user)) {
          const snap = readLocalSnapshot();
          const hasValidTestSnap = Boolean(snap && snap.userId === user.id && snap.data);
          const safeCaveira = isForeignCaveiraCache ? [] : (get().caveiraQuestions || []);
          const baseState = hasValidTestSnap
            ? normalizeHydratedState(snap.data, safeCaveira)
            : getCleanInitialState();

          if (!baseState.userStats?.displayName || baseState.userStats.displayName === 'Guerreiro PRF') {
            baseState.userStats = {
              ...(baseState.userStats || {}),
              displayName: LOCAL_TEST_ACCOUNT.displayName,
            };
          }

          set({
            ...baseState,
            caveiraQuestions: baseState.caveiraQuestions || safeCaveira,
            isSyncing: false,
            isLoadingFromCloud: false,
            hasCompletedInitialCloudSync: true,
            hasUnsyncedChanges: false,
            lastSyncedAt: new Date().toISOString(),
          });

          get().syncDayRollover();
          get().checkAndResetWeekly();
          get().checkAndAdvanceSeason();
          get().checkAndResetDailyMissions();
          get().syncAndRepairCaveiraReviews?.();
          writeLocalSnapshot(get(), { dirty: false, savedAt: new Date().toISOString() });
          try {
            window.postMessage(
              {
                source: 'QG_WEB_APP',
                type: 'SET_ACTIVE_USER',
                payload: {
                  userId: user.id,
                  userEmail: user.email || '',
                  userLabel: LOCAL_TEST_ACCOUNT.displayName,
                },
              },
              '*'
            );
          } catch (_) {}
          return true;
        }

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
          if (snap && snap.userId === sameUserId && hasMeaningfulUserData(snap.data)) {
            return {
              data: snap.data,
              label: snap.savedAt ? `snapshot local (${new Date(snap.savedAt).toLocaleString()})` : 'snapshot local'
            };
          }
          try {
            const backupsJson = localStorage.getItem('prf_qg_backups');
            const backups = backupsJson ? JSON.parse(backupsJson) : [];
            const validBackup = (backups || []).find(b => b?.data && b.userId === sameUserId && hasMeaningfulUserData(b.data));
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
          const currentCaveira = isForeignCaveiraCache ? [] : (get().caveiraQuestions || []);
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

          // A1: Compara snapshot local com a nuvem — só mescla se o snapshot for estritamente do mesmo usuário, tiver alterações com timestamp real e não for estado inicial vazio
          const localSnap = readLocalSnapshot();
          const isSameUser = Boolean(localSnap?.userId && localSnap.userId === user.id);
          const localHasRealKeyChanges = localSnap?.keyTimestamps && Object.keys(localSnap.keyTimestamps).length > 0;
          const localIsNewerAndDirty = Boolean(
            !recoveredFromBackup &&
            localSnap &&
            isSameUser &&
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
          set({ isSyncing: false, isLoadingFromCloud: false });
          get().syncDayRollover();
          get().checkAndResetWeekly();
          get().checkAndAdvanceSeason();
          get().checkAndResetDailyMissions();
          get().syncAndRepairCaveiraReviews?.();

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

          try { const st = get(); const userLabel = (st.userStats?.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || user.email || '').trim(); window.postMessage({ source: 'QG_WEB_APP', type: 'SET_ACTIVE_USER', payload: { userId: user.id, userEmail: user.email || '', userLabel } }, '*'); } catch (_) {}
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

          if (get().user?.id !== user.id) return false;
          if (error) throw error;

          if (data && data.length > 0 && data[0].full_data) {
            console.log("✅ [Nuvem] Dados sincronizados com sucesso.");
            return applyHydratedCloudRecord(data[0].full_data, data[0].updated_at || null);
          }

          // A4: Segurança contra falso "nova conta" (ex.: sessão expirada ou RLS retornando [] sem erro)
          // 1) Verifica se a sessão de autenticação está realmente válida
          const { data: sessionCheck, error: sessionErr } = await supabase.auth.getSession();
          if (get().user?.id !== user.id) return false;
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
          if (get().user?.id !== user.id) return false;
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
              const validBackup = (backups || []).find(b => b?.data && (!b.userId || b.userId === user.id) && hasMeaningfulUserData(b.data));
              if (validBackup) {
                candidateLocalData = validBackup.data;
                candidateSourceLabel = `backup local (${new Date(validBackup.timestamp).toLocaleString()})`;
              }
            } catch (_) {}
          }

          if (candidateLocalData) {
            console.warn(`⚠️ [Nuvem] Perfil remoto vazio, mas há dados no ${candidateSourceLabel}. Preservando dados locais.`);
            const safeCaveira = isForeignCaveiraCache ? [] : (get().caveiraQuestions || []);
            const restored = normalizeHydratedState(candidateLocalData, safeCaveira);
            try {
              localStorage.setItem('prf_caveira_questions', JSON.stringify(restored.caveiraQuestions || []));
              localStorage.setItem(CAVEIRA_OWNER_KEY, user.id);
            } catch (_) {}
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
            get().syncAndRepairCaveiraReviews?.();
            try { const st = get(); const userLabel = (st.userStats?.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || user.email || '').trim(); window.postMessage({ source: 'QG_WEB_APP', type: 'SET_ACTIVE_USER', payload: { userId: user.id, userEmail: user.email || '', userLabel } }, '*'); } catch (_) {}
            return true;
          }

          // Conta genuinamente nova e sem dados locais prévios
          console.log('ℹ️ [Nuvem] Nova conta confirmada! Inicializando perfil limpo para uso.');
          const freshState = getCleanInitialState();
          const initialFreshCaveira = isForeignCaveiraCache ? [] : (get().caveiraQuestions || []);
          try {
            localStorage.setItem('prf_caveira_questions', JSON.stringify(initialFreshCaveira));
            localStorage.setItem(CAVEIRA_OWNER_KEY, user.id);
          } catch (_) {}
          set({
            ...freshState,
            caveiraQuestions: initialFreshCaveira,
            lastSyncedAt: null,
            isSyncing: false,
            isLoadingFromCloud: false,
            hasCompletedInitialCloudSync: true
          });
          get().syncDayRollover();
          get().checkAndResetWeekly();
          get().checkAndAdvanceSeason();
          get().checkAndResetDailyMissions();
          get().syncAndRepairCaveiraReviews?.();
          await get().saveToCloud({ allowEmptyOverwrite: true });
          try { const st = get(); const userLabel = (st.userStats?.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || user.email || '').trim(); window.postMessage({ source: 'QG_WEB_APP', type: 'SET_ACTIVE_USER', payload: { userId: user.id, userEmail: user.email || '', userLabel } }, '*'); } catch (_) {}
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
            const safeSnap = (!localSnap?.userId || localSnap.userId === user.id) ? localSnap : null;
            const backupsJson = localStorage.getItem('prf_qg_backups');
            const backups = backupsJson ? JSON.parse(backupsJson) : [];
            const userBackups = (backups || []).filter(b => !b?.userId || b.userId === user.id);
            const latestBackup = userBackups.find(b => b?.data && hasMeaningfulUserData(b.data)) || userBackups?.[0] || null;

            const snapTs = safeSnap?.savedAt ? new Date(safeSnap.savedAt).getTime() : 0;
            const backupTs = latestBackup?.timestamp ? Number(latestBackup.timestamp) : 0;

            const snapMeaningful = hasMeaningfulUserData(safeSnap?.data);
            const backupMeaningful = hasMeaningfulUserData(latestBackup?.data);

            let chosenRaw = null;
            let chosenDateStr = null;
            if (snapMeaningful && (!backupMeaningful || snapTs >= backupTs)) {
              chosenRaw = safeSnap.data;
              chosenDateStr = safeSnap.savedAt ? new Date(safeSnap.savedAt).toLocaleString() : null;
            } else if (backupMeaningful) {
              chosenRaw = latestBackup.data;
              chosenDateStr = latestBackup.timestamp ? new Date(latestBackup.timestamp).toLocaleString() : null;
            } else if (safeSnap?.data || latestBackup?.data) {
              chosenRaw = (snapTs >= backupTs && safeSnap?.data) ? safeSnap.data : latestBackup?.data;
              chosenDateStr = (snapTs >= backupTs && safeSnap?.savedAt)
                ? new Date(safeSnap.savedAt).toLocaleString()
                : (latestBackup ? new Date(latestBackup.timestamp).toLocaleString() : null);
            }

            if (chosenRaw) {
              console.log(`💡 [Estado Offline] Carregando dados locais de ${chosenDateStr}`);
              const safeCaveira = isForeignCaveiraCache ? [] : (get().caveiraQuestions || []);
              const cleanData = normalizeHydratedState(chosenRaw, safeCaveira);
              set({ ...cleanData, isSyncing: false, isLoadingFromCloud: false, hasCompletedInitialCloudSync: true, cloudSyncError: 'Sem conexão com a nuvem. Usando dados salvos no dispositivo.' });
              get().syncDayRollover();
              get().checkAndResetWeekly();
              get().checkAndAdvanceSeason();
              get().checkAndResetDailyMissions();
              get().syncAndRepairCaveiraReviews?.();
              try { const st = get(); const userLabel = (st.userStats?.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || user.email || '').trim(); window.postMessage({ source: 'QG_WEB_APP', type: 'SET_ACTIVE_USER', payload: { userId: user.id, userEmail: user.email || '', userLabel } }, '*'); } catch (_) {}

              toast.info(`Usando dados salvos localmente (${chosenDateStr}) devido a falha de conexão.`);
              return true;
            }
          } catch (backupErr) {
            console.error("Falha ao restaurar dados locais:", backupErr);
          }

          set({ cloudSyncError: 'Não foi possível conectar à nuvem. Tente sincronizar novamente.' });
          toast.error("Não foi possível carregar da nuvem. Tente sincronizar novamente.");
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
        if (!user || isLoadingFromCloud) return false;
        if (isLocalTestUser(user)) {
          const nowIso = new Date().toISOString();
          writeLocalSnapshot(get(), { dirty: false, savedAt: nowIso });
          try {
            localStorage.setItem('prf_caveira_questions', JSON.stringify(get().caveiraQuestions || []));
            localStorage.setItem(CAVEIRA_OWNER_KEY, user.id);
          } catch (_) {}
          set({
            isSavingToCloud: false,
            savePending: false,
            hasUnsyncedChanges: false,
            lastSyncedAt: nowIso,
          });
          return true;
        }
        if (!hasCompletedInitialCloudSync && !allowEmptyOverwrite) {
          console.warn('🛑 [Nuvem] Auto-save bloqueado antes da sincronização inicial concluir.');
          return false;
        }

        // A2: Se um save já está em andamento, não descarta: marca savePending para rodar logo após o término
        if (isSavingToCloud) {
          useStore._savePending = true;
          useStore._savePendingAllowEmpty = Boolean(useStore._savePendingAllowEmpty || allowEmptyOverwrite);
          set({ savePending: true, hasUnsyncedChanges: true });
          return false;
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
                if (!conflictData || conflictData.length === 0) {
                  throw new Error('Conflito concorrente durante merge na nuvem');
                }
                if (conflictData?.[0]?.updated_at) finalSyncedAt = conflictData[0].updated_at;

                useStore._suppressSubscribeStamp = true;
                try {
                  set({ ...normalizedMerged });
                } finally {
                  useStore._suppressSubscribeStamp = false;
                }
                toast.info('🔄 Sincronizado com outro dispositivo preservando suas alterações locais.', { id: 'sync-merge-toast' });
              }
            }
          })();

          await Promise.race([savePromise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
          if (get().user?.id !== user.id) return false;

          // Atualiza a baseline de sincronização após gravação bem-sucedida
          useStore._retryCount = 0;
          useStore._unsyncedToastShown = false;
          if (hasMeaningfulUserData(dataToSave)) {
            useStore._lastKnownCloudWasMeaningful = true;
          }
          const stillDirty = Boolean(useStore._savePending);
          set({ lastSyncedAt: finalSyncedAt, hasUnsyncedChanges: stillDirty, cloudSyncError: null });
          writeLocalSnapshot(get(), {
            dirty: stillDirty,
            savedAt: finalSyncedAt,
            keyTimestamps: useStore._keyTimestamps || {}
          });

          // Backup local automático (só adiciona se tiver dados reais, preservando últimos pontos íntegros)
          appendLocalBackup(dataToSave, 'cloud_sync');

          toast.success("Nuvem atualizada!", { id: 'cloud-sync-toast', duration: 1200 });
          return true;
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
            if (verifyTs > 0 && sentTs > 0 && verifyTs === sentTs && get().user?.id === user.id) {
              finalSyncedAt = verifyData[0].updated_at;
              recoveredFromTimeout = true;
              useStore._retryCount = 0;
              useStore._unsyncedToastShown = false;
              const stillDirty = Boolean(useStore._savePending);
              set({ lastSyncedAt: finalSyncedAt, hasUnsyncedChanges: stillDirty, cloudSyncError: null });
              writeLocalSnapshot(get(), {
                dirty: stillDirty,
                savedAt: finalSyncedAt,
                keyTimestamps: useStore._keyTimestamps || {}
              });
            }
          } catch (_) {}

          if (!recoveredFromTimeout) {
            if (get().user?.id !== user.id) return false;
            console.error('❌ [Nuvem] Erro no Upload:', error.message);
            set({
              hasUnsyncedChanges: true,
              cloudSyncError: 'Alterações salvas no dispositivo, mas pendentes de envio para a nuvem.',
            });
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
            return false;
          }
          return true;
        } finally {
          set({ isSavingToCloud: false });
          // A2: Se houve alteração enquanto salvava, dispara novo save imediatamente
          if (useStore._savePending) {
            useStore._savePending = false;
            const retryAllowEmpty = Boolean(useStore._savePendingAllowEmpty);
            useStore._savePendingAllowEmpty = false;
            set({ savePending: false });
            clearTimeout(useStore._debounceTimer);
            useStore._debounceTimer = setTimeout(() => {
              get().saveToCloud({ allowEmptyOverwrite: retryAllowEmpty });
            }, 100);
          }
        }
      },

      unsubscribeFromCloudRealtime: () => {
        if (useStore._realtimeDebounce) {
          clearTimeout(useStore._realtimeDebounce);
          useStore._realtimeDebounce = null;
        }
        if (useStore._realtimeChannel) {
          try {
            supabase.removeChannel(useStore._realtimeChannel);
          } catch (_) {}
          useStore._realtimeChannel = null;
          useStore._realtimeUserId = null;
        }
      },

      checkCloudDeltaIfNewer: async () => {
        const now = Date.now();
        if (useStore._lastDeltaCheckAt && (now - useStore._lastDeltaCheckAt) < 8000) return false;
        useStore._lastDeltaCheckAt = now;

        const { session, hasCompletedInitialCloudSync, isLoadingFromCloud, isSavingToCloud, lastSyncedAt } = get();
        if (!session?.user?.id || isLocalTestUser(session) || !hasCompletedInitialCloudSync || isLoadingFromCloud || isSavingToCloud) {
          return false;
        }
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('updated_at')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!error && data?.updated_at && (!lastSyncedAt || parseIsoMs(data.updated_at) > parseIsoMs(lastSyncedAt))) {
            await get().loadFromCloud();
            return true;
          }
        } catch (_) {}
        return false;
      },

      subscribeToCloudRealtime: () => {
        const { session, hasCompletedInitialCloudSync } = get();
        const userId = session?.user?.id;
        if (!userId || isLocalTestUser(session) || !hasCompletedInitialCloudSync) return;
        if (useStore._realtimeChannel && useStore._realtimeUserId === userId) return;

        get().unsubscribeFromCloudRealtime();

        try {
          const channel = supabase
            .channel(`qg-prf-realtime-${userId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
              (payload) => {
                const st = useStore.getState();
                if (st.isLoadingFromCloud || st.isSavingToCloud) return;
                const remoteTs = payload?.new?.updated_at;
                if (remoteTs && (!st.lastSyncedAt || parseIsoMs(remoteTs) > parseIsoMs(st.lastSyncedAt))) {
                  clearTimeout(useStore._realtimeDebounce);
                  useStore._realtimeDebounce = setTimeout(() => {
                    const latest = useStore.getState();
                    if (!latest.isLoadingFromCloud && !latest.isSavingToCloud) {
                      latest.loadFromCloud();
                    }
                  }, 450);
                }
              }
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'caveira_question_events', filter: `user_id=eq.${userId}` },
              (payload) => {
                const st = useStore.getState();
                if (payload?.eventType === 'DELETE' && payload?.old?.question_id) {
                  st.deleteCaveiraQuestion?.(payload.old.question_id, { fromRemote: true });
                } else if (payload?.new?.payload?.id) {
                  st.importCaveiraQuestions?.([payload.new.payload], true);
                }
              }
            )
            .subscribe();

          useStore._realtimeChannel = channel;
          useStore._realtimeUserId = userId;
        } catch (_) {}
      },

      getPendingReviews: () => {
        const { reviews, getLocalDateStr } = get();
        const today = getLocalDateStr();
        return (reviews || []).filter(r => {
          const isCaveira = Boolean(
            r.isCaveiraQuestion ||
            r.questionData ||
            String(r.id || '').startsWith('rev_caveira_') ||
            String(r.topicName || '').startsWith('[Caveira')
          );
          return isCaveira && r.nextDateStr <= today;
        });
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
              speed: Math.min(4, Math.max(0.5, Math.round((Number(speed) || 1) * 100) / 100))
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
        },
        ...(dateStr === state.getLocalDateStr()
          ? { cycleCarryoverOffset: 0, lastCarryoverCheckDate: dateStr }
          : {})
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

        const todayStr = state.getLocalDateStr();
        return {
          cycle: nextCycle,
          cycleSlotCounts: nextCycleSlotCounts,
          ...(fromDate <= todayStr ? { cycleCarryoverOffset: 0, lastCarryoverCheckDate: todayStr } : {}),
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
      setLifeRoutine: (lifeRoutine) => set((state) => ({ lifeRoutine: typeof lifeRoutine === 'function' ? lifeRoutine(state.lifeRoutine) : lifeRoutine })),
      setDiscursivaData: (discursivaData) => set((state) => ({ discursivaData: typeof discursivaData === 'function' ? discursivaData(state.discursivaData) : discursivaData })),
      setTafHistory: (tafHistory) => set((state) => ({ tafHistory: typeof tafHistory === 'function' ? tafHistory(state.tafHistory) : tafHistory })),
      setTafTrainingStatus: (tafTrainingStatus) => set({ tafTrainingStatus }),
      setGlobalModal: (globalModal) => set({ globalModal }),
      setIsDarkMode: (isDarkMode) => {
        set({ isDarkMode });
        try {
          localStorage.setItem('qg_prf_dark_mode', String(Boolean(isDarkMode)));
        } catch (_) {}
      },
      setTargetExamDate: (targetExamDate) => set({ targetExamDate }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setCurrentDayIndex: (currentDayIndex) => set({ currentDayIndex }),
      setCompletedToday: (completedToday) => set((state) => {
        const today = state.getLocalDateStr();
        // Se a data guardada não é hoje, o valor anterior é de outro dia e nunca deve ser considerado.
        const base = state.completedTodayDate === today ? (state.completedToday || []) : [];
        const nextCompleted = typeof completedToday === 'function' ? completedToday(base) : completedToday;
        const baseProgress = state.completedTodayDate === today ? (state.slotProgressToday || {}) : {};
        return {
          completedToday: nextCompleted,
          completedTodayDate: today,
          slotProgressToday: Array.isArray(nextCompleted) && nextCompleted.length === 0 ? {} : baseProgress
        };
      }),
      resetCycleCarryover: () => set({ cycleCarryoverOffset: 0, lastCarryoverCheckDate: get().getLocalDateStr() }),

      // Detecta a virada do dia real: zera os blocos concluídos de ontem e atualiza a chave de "hoje".
      syncDayRollover: () => {
        const state = get();
        const today = state.getLocalDateStr();
        const patch = {};
        if (state.todayKey !== today) patch.todayKey = today;
        if (state.completedTodayDate !== today) {
          patch.completedToday = [];
          patch.completedTodayDate = today;
          patch.slotProgressToday = {};
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
            const [dy, dm, dd] = String(dateStr).split('-').map(Number);
            const effDateObj = (currentOffset > 0 && dy && dm && dd)
              ? new Date(dy, dm - 1, dd - currentOffset)
              : dateObj;
            const effDateStr = currentOffset > 0 ? formatLocal(effDateObj) : dateStr;
            if (currentOffset > 0 && calendarOverrides && Array.isArray(calendarOverrides[effDateStr])) {
              return calendarOverrides[effDateStr].length > 0;
            }
            const dow = dateObj.getDay();
            const rawIdx = cycleWeekStart === 'monday' ? (dow + 6) % 7 : dow;
            const effIdx = ((rawIdx - currentOffset) % 7 + 7) % 7;
            const effDow = effDateObj.getDay();
            const matchingRules = (futureScheduleRules || [])
              .filter(r => {
                if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effDateStr) return false;
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
            let nextOffset = cycleCarryoverOffset;
            const hasPriorStudy = Object.entries(studyHistory || {}).some(([d, m]) => d < today && Number(m) > 0);
            if (hasPriorStudy && hadScheduledStudyOnDate(yesterdayObj, yesterdayStr, cycleCarryoverOffset)) {
              if ((studyHistory?.[yesterdayStr] || 0) <= 0) {
                nextOffset = (cycleCarryoverOffset + 1) % 7;
              }
            }
            patch.cycleCarryoverOffset = nextOffset;
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
            patch.cycleCarryoverOffset = nextOffset;
            patch.lastCarryoverCheckDate = today;
          }
        } else if (state.lastCarryoverCheckDate !== today) {
          patch.cycleCarryoverOffset = 0;
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
          const enriched = enrichCaveiraQuestionPayload(null, question);
          updatedList.unshift(enriched);
          if (enriched.hit) {
            addXP(25, `Questão Caveira ${question.id} Acertada`);
            setCoins(c => c + 3);
          } else {
            addXP(10, `Questão Caveira ${question.id} Analisada`);
          }
          boostPetWithStudy('review');
        } else {
          updatedList[existingIdx] = enrichCaveiraQuestionPayload(updatedList[existingIdx], question);
        }

        set({ caveiraQuestions: updatedList });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updatedList)); } catch (_) {}

        if (!question.hit || question.confidence === 'chute' || question.confidence === 'duvida' || question.fsrsRequested) {
          get().createFsrsCardFromCaveira(updatedList.find(q => q.id === question.id) || question, true);
        }
        const activeMission = get().activePracticeMission;
        if (activeMission && activeMission.status === 'active') {
          get().recordMissionQuestionAnswer?.(question.id, Boolean(question.hit), question);
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
        const activeMission = get().activePracticeMission;
        const missionStartedAt =
          activeMission && activeMission.status === 'active'
            ? Number(activeMission.startedAt) || 0
            : 0;
        const newlyAnsweredForMission = [];

        questionsList.forEach(q => {
          if (!q || !q.id) return;
          const prev = map.get(q.id);
          if (!prev) {
            newCount++;
            const enrichedNew = enrichCaveiraQuestionPayload(null, q);
            map.set(q.id, enrichedNew);
            if (missionStartedAt > 0) {
              const qTs = new Date(enrichedNew.timestamp || enrichedNew.updatedAt || Date.now()).getTime();
              if (Number.isFinite(qTs) && qTs >= missionStartedAt - 15000) {
                newlyAnsweredForMission.push({
                  id: enrichedNew.id,
                  hit: Boolean(enrichedNew.hit),
                  subject: enrichedNew.subject,
                  canonicalSubject: enrichedNew.canonicalSubject,
                });
              }
            }
          } else {
            const prevIsNewer = Boolean(prev.updatedAt && (!q.updatedAt || prev.updatedAt > q.updatedAt));
            const baseMerged = prevIsNewer
              ? {
                  ...prev,
                  ...q,
                  confidence: prev.confidence,
                  errorReason: prev.errorReason,
                  fsrsRequested: prev.fsrsRequested,
                  priorityReview: prev.priorityReview,
                  userNote: (prev.userNote !== undefined && prev.userNote !== '') ? prev.userNote : (q.userNote || ''),
                  teacherComment: prev.teacherComment || q.teacherComment || '',
                  mirrorProven: Boolean(prev.mirrorProven || q.mirrorProven),
                  mirrorQuestionId: prev.mirrorQuestionId || q.mirrorQuestionId || '',
                  mirrorProvenAt: prev.mirrorProvenAt || q.mirrorProvenAt || null,
                  alternatives: (Array.isArray(q.alternatives) && q.alternatives.length > (Array.isArray(prev.alternatives) ? prev.alternatives.length : 0))
                    ? q.alternatives
                    : (prev.alternatives || q.alternatives || null),
                  updatedAt: prev.updatedAt
                }
              : {
                  ...prev,
                  ...q,
                  mirrorProven: Boolean(prev.mirrorProven || q.mirrorProven),
                  mirrorQuestionId: q.mirrorQuestionId || prev.mirrorQuestionId || '',
                  mirrorProvenAt: q.mirrorProvenAt || prev.mirrorProvenAt || null,
                  teacherComment: q.teacherComment || prev.teacherComment || '',
                  userNote: (q.userNote !== undefined && q.userNote !== '') ? q.userNote : (prev.userNote || ''),
                  alternatives: (Array.isArray(q.alternatives) && q.alternatives.length >= (Array.isArray(prev.alternatives) ? prev.alternatives.length : 0))
                    ? q.alternatives
                    : (prev.alternatives || null)
                };
            const mergedItem = enrichCaveiraQuestionPayload(prev, baseMerged);

            if (
              prev.confidence !== mergedItem.confidence ||
              prev.errorReason !== mergedItem.errorReason ||
              Boolean(prev.fsrsRequested) !== Boolean(mergedItem.fsrsRequested) ||
              Boolean(prev.priorityReview) !== Boolean(mergedItem.priorityReview) ||
              Boolean(prev.mirrorProven) !== Boolean(mergedItem.mirrorProven) ||
              (prev.userNote || '') !== (mergedItem.userNote || '') ||
              (prev.teacherComment || '') !== (mergedItem.teacherComment || '') ||
              (prev.commentSource || '') !== (mergedItem.commentSource || '') ||
              prev.communityCorrectPct !== mergedItem.communityCorrectPct ||
              (Array.isArray(prev.attempts) ? prev.attempts.length : 0) !== (Array.isArray(mergedItem.attempts) ? mergedItem.attempts.length : 0) ||
              prev.hit !== mergedItem.hit ||
              prev.subject !== mergedItem.subject ||
              prev.topic !== mergedItem.topic ||
              prev.userChoice !== mergedItem.userChoice ||
              prev.correctChoice !== mergedItem.correctChoice ||
              (!prev.alternatives && mergedItem.alternatives) ||
              (Array.isArray(mergedItem.alternatives) && mergedItem.alternatives.length > (Array.isArray(prev.alternatives) ? prev.alternatives.length : 0))
            ) {
              updatedExisting = true;
            }
            const prevAttemptsLen = Array.isArray(prev.attempts) ? prev.attempts.length : 0;
            const nextAttemptsLen = Array.isArray(mergedItem.attempts) ? mergedItem.attempts.length : 0;
            if (missionStartedAt > 0 && nextAttemptsLen > prevAttemptsLen) {
              const latestTs = new Date(
                mergedItem.timestamp || mergedItem.updatedAt || Date.now()
              ).getTime();
              if (Number.isFinite(latestTs) && latestTs >= missionStartedAt - 15000) {
                newlyAnsweredForMission.push({
                  id: mergedItem.id,
                  hit: Boolean(mergedItem.hit),
                  subject: mergedItem.subject,
                  canonicalSubject: mergedItem.canonicalSubject,
                });
              }
            }
            map.set(q.id, mergedItem);
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

        if (newlyAnsweredForMission.length > 0) {
          newlyAnsweredForMission.forEach((item) => {
            get().recordMissionQuestionAnswer?.(item.id, Boolean(item.hit), item);
          });
        }
        return newCount;
      },

      updateCaveiraQuestion: (id, updates) => {
        const { caveiraQuestions = [] } = get();
        const updatedAt = new Date().toISOString();
        const enrichedUpdates = { ...updates, updatedAt };
        const updated = caveiraQuestions.map(q => q.id === id ? { ...q, ...enrichedUpdates } : q);
        set({ caveiraQuestions: updated });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updated)); } catch (_) {}
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'UPDATE_CAVEIRA_QUESTION', payload: { id, updates: enrichedUpdates } }, '*'); } catch (_) {}
        get().syncAndRepairCaveiraReviews?.();
      },

      deleteCaveiraQuestion: (id, { fromRemote = false } = {}) => {
        const { caveiraQuestions = [], reviews = [] } = get();
        const updated = caveiraQuestions.filter(q => q.id !== id);
        const filteredReviews = reviews.filter(r => !matchesCaveiraReview(r, id));
        set({ caveiraQuestions: updated, reviews: filteredReviews });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updated)); } catch (_) {}
        try {
          window.postMessage(
            { source: 'QG_WEB_APP', type: 'DELETE_CAVEIRA_QUESTION', payload: { id, enqueueOutbox: !fromRemote } },
            window.location.origin
          );
        } catch (_) {}
        if (!fromRemote) {
          toast.success('Questão removida do histórico.');
        }
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
        const { reviews = [], progressiveReviews = [], getLocalDateStr, playSound } = get();
        const todayStr = getLocalDateStr();
        let movedCount = 0;
        const updatedReviews = reviews.map(r => {
          if (r && r.nextDateStr === targetDateStr && r.nextDateStr > todayStr) {
            movedCount++;
            return { ...r, nextDateStr: todayStr };
          }
          return r;
        });
        const updatedProgressive = progressiveReviews.map(pr => {
          if (pr && pr.nextDateStr === targetDateStr && pr.nextDateStr > todayStr) {
            movedCount++;
            return { ...pr, nextDateStr: todayStr, updatedAt: Date.now() };
          }
          return pr;
        });
        if (movedCount > 0) {
          set({ reviews: updatedReviews, progressiveReviews: updatedProgressive });
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
          errorReason: normalizeErrorReason(question.errorReason),
          userNote: question.userNote || '',
          teacherComment: question.teacherComment || '',
          timestamp: question.timestamp || null,
          mirrorProven: Boolean(question.mirrorProven),
          mirrorQuestionId: question.mirrorQuestionId || '',
          mirrorProvenAt: question.mirrorProvenAt || null
        };

        const noteLine = question.userNote ? `\nBizu / Anotação Tática: ${question.userNote}` : '';
        const topicLabel = question.topic && question.topic !== question.subject
          ? `${customSubjectName} ➔ ${question.topic}`
          : (question.topic || customSubjectName);

        // Verifica se já existe um card ativo desta questão no FSRS
        const existingMatches = reviews.filter(r => matchesCaveiraReview(r, question.id));

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

          const updatedQuestions = caveiraQuestions.map(q => q.id === question.id ? { ...q, fsrsCreated: true, fsrsDismissed: false } : q);
          set({ reviews: repairedReviews, caveiraQuestions: updatedQuestions });
          try { localStorage.setItem('prf_caveira_questions', JSON.stringify(updatedQuestions)); } catch (_) {}
          if (!silent) {
            toast.info(`🃏 Questão ${question.id} já está na fila de revisão FSRS!`);
          }
          return false;
        }

        const todayStr = getLocalDateStr();

        const reasonLine = question.hit
          ? `Motivo da revisão: ${question.confidence === 'chute' ? 'Acertou no Chute 🎲' : question.confidence === 'duvida' ? 'Acertou com Dúvida 🤔' : 'Revisão Manual 📌'}`
          : `Autópsia do erro: ${getErrorCauseMeta(question.errorReason).label}`;

        const isMirrorProven = Boolean(question.mirrorProven);
        const initialNextDate = isMirrorProven ? addDaysToLocalDateStr(todayStr, 3) : todayStr;

        const newReview = {
          id: 'rev_caveira_' + question.id,
          caveiraQuestionId: question.id,
          isCaveiraQuestion: true,
          customSubjectName,
          createdAt: question.timestamp || new Date().toISOString(),
          questionData: qDataPayload,
          subjectId,
          topicName: `[Caveira ${question.id}] ${topicLabel}`,
          notes: `Enunciado: ${question.content || ''}\nGabarito: ${question.correctChoice} (Você marcou: ${question.userChoice})\n${reasonLine}${noteLine}`,
          nextDateStr: initialNextDate,
          interval: isMirrorProven ? 3 : 0,
          stability: isMirrorProven ? 3 : 0,
          difficulty: 0,
          ...(isMirrorProven ? { mirrorDowngraded: true } : {}),
          lastReviewDate: null,
          lastPerformance: undefined
        };

        const updatedQuestions = caveiraQuestions.map(q => q.id === question.id ? { ...q, fsrsCreated: true, fsrsDismissed: false } : q);
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
          if (q && q.id) qMap.set(String(q.id).trim().toUpperCase(), q);
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

          // FSRS é exclusivo para questões do Caveira: descarta cartões legados de aulas do ciclo
          if (!isCaveira) {
            reviewsChanged = true;
            continue;
          }

          // Extrai o ID da questão (ex.: Q\d+ ou fps-...)
          const idMatch =
            String(rev.caveiraQuestionId || '').match(/Q\d+/i) ||
            String(rev.id || '').match(/Q\d+/i) ||
            String(rev.topicName || '').match(/Q\d+/i);
          const rawQId = idMatch ? idMatch[0].toUpperCase() : String(rev.caveiraQuestionId || rev.id || '').replace(/^rev_caveira_/, '');
          const normKey = String(rawQId).trim().toUpperCase();

          // Remove cartões duplicados da mesma questão Caveira
          if (seenCaveiraIds.has(normKey)) {
            reviewsChanged = true;
            continue;
          }
          seenCaveiraIds.add(normKey);

          const matchedQ = qMap.get(normKey);
          const qId = matchedQ?.id || rawQId;

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
            errorReason: normalizeErrorReason(matchedQ?.errorReason || rev.questionData?.errorReason || 'base'),
            userNote: matchedQ?.userNote || rev.questionData?.userNote || '',
            teacherComment: matchedQ?.teacherComment || rev.questionData?.teacherComment || '',
            timestamp: resolvedTimestamp,
            mirrorProven: Boolean(matchedQ?.mirrorProven || rev.questionData?.mirrorProven || rev.mirrorDowngraded),
            mirrorQuestionId: matchedQ?.mirrorQuestionId || rev.questionData?.mirrorQuestionId || '',
            mirrorProvenAt: matchedQ?.mirrorProvenAt || rev.questionData?.mirrorProvenAt || null
          };

          const topicLabel = mergedQuestionData.topic && mergedQuestionData.topic !== mergedQuestionData.subject
            ? `${customSubjectName} ➔ ${mergedQuestionData.topic}`
            : (mergedQuestionData.topic || customSubjectName);
          const expectedTopicName = `[Caveira ${qId}] ${topicLabel}`;

          const isMirrorProven = Boolean(mergedQuestionData.mirrorProven);
          const needsMirrorDowngrade = Boolean(isMirrorProven && !rev.lastReviewDate && !rev.mirrorDowngraded);

          // Se nunca foi revisado ainda (lastReviewDate === null) e estava agendado para amanhã, traz para hoje (exceto se já superou questão-espelho!)
          let repairedNextDateStr = rev.nextDateStr;
          let repairedInterval = rev.interval;
          let repairedStability = rev.stability;
          let repairedMirrorDowngraded = Boolean(rev.mirrorDowngraded);
          if (needsMirrorDowngrade) {
            repairedNextDateStr = addDaysToLocalDateStr(todayStr, 3);
            repairedInterval = Math.max(Number(rev.interval) || 0, 3);
            repairedStability = Math.max(Number(rev.stability) || 0, 3);
            repairedMirrorDowngraded = true;
          } else if (!rev.lastReviewDate && !isMirrorProven && rev.nextDateStr > todayStr) {
            repairedNextDateStr = todayStr;
          }

          const altsMismatch = JSON.stringify(rev.questionData?.alternatives || null) !== JSON.stringify(sanitizedAlts);

          if (
            !rev.isCaveiraQuestion ||
            rev.caveiraQuestionId !== qId ||
            rev.subjectId !== subjectId ||
            rev.customSubjectName !== customSubjectName ||
            rev.topicName !== expectedTopicName ||
            rev.nextDateStr !== repairedNextDateStr ||
            Boolean(rev.mirrorDowngraded) !== repairedMirrorDowngraded ||
            rev.createdAt !== resolvedTimestamp ||
            !rev.questionData ||
            rev.questionData.content !== mergedQuestionData.content ||
            rev.questionData.confidence !== mergedQuestionData.confidence ||
            rev.questionData.errorReason !== mergedQuestionData.errorReason ||
            Boolean(rev.questionData.mirrorProven) !== Boolean(mergedQuestionData.mirrorProven) ||
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
            interval: repairedInterval,
            stability: repairedStability,
            ...(repairedMirrorDowngraded ? { mirrorDowngraded: true } : {}),
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

          const needsFsrs = !q.fsrsDismissed && (!q.hit || q.confidence === 'chute' || q.confidence === 'duvida' || q.fsrsRequested || q.fsrsCreated);
          const normQKey = String(q.id).trim().toUpperCase();

          if (needsFsrs && !seenCaveiraIds.has(normQKey)) {
            seenCaveiraIds.add(normQKey);
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

            const isMirrorProven = Boolean(q.mirrorProven);
            const initialNextDate = isMirrorProven ? addDaysToLocalDateStr(todayStr, 3) : todayStr;

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
                timestamp: q.timestamp || null,
                mirrorProven: isMirrorProven,
                mirrorQuestionId: q.mirrorQuestionId || '',
                mirrorProvenAt: q.mirrorProvenAt || null
              },
              notes: `Enunciado: ${q.content || ''}\nGabarito: ${q.correctChoice} (Você marcou: ${q.userChoice})\n${reasonLine}${noteLine}`,
              nextDateStr: initialNextDate,
              interval: isMirrorProven ? 3 : 0,
              stability: isMirrorProven ? 3 : 0,
              difficulty: 0,
              ...(isMirrorProven ? { mirrorDowngraded: true } : {}),
              lastReviewDate: null,
              lastPerformance: undefined
            });
            return { ...q, alternatives: sanitizedQAlts, fsrsCreated: true };
          }
          if (needsFsrs && !q.fsrsCreated && seenCaveiraIds.has(normQKey)) {
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
        const rawFullDateStr = dateInfo?.fullDateStr;
        set(state => {
          const isWeekly = (state.cycleScheduleType || 'weekly') === 'weekly';
          const hasExplicitTodayOverride = Boolean(rawFullDateStr && Array.isArray(state.calendarOverrides?.[rawFullDateStr]));
          const carryover = (isWeekly && dateInfo?.isToday && !hasExplicitTodayOverride) ? (state.cycleCarryoverOffset || 0) : 0;
          const targetDayIndex = carryover > 0 ? ((dayIndex - carryover) % 7 + 7) % 7 : dayIndex;
          let fullDateStr = rawFullDateStr;
          if (carryover > 0 && rawFullDateStr) {
            const p = String(rawFullDateStr).split('-').map(Number);
            if (p.length === 3) {
              const effD = new Date(p[0], p[1] - 1, p[2] - carryover);
              fullDateStr = `${effD.getFullYear()}-${String(effD.getMonth() + 1).padStart(2, '0')}-${String(effD.getDate()).padStart(2, '0')}`;
            }
          }

          const baseCycle = isWeekly
            ? Array.from({ length: 7 }, (_, i) => Array.isArray(state.cycle?.[i]) ? [...state.cycle[i]] : [])
            : [...(state.cycle || [])];

          const newCycle = baseCycle.map((daySlots, dIdx) => {
            if (dIdx !== targetDayIndex || !Array.isArray(daySlots)) return daySlots;
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
                return r.dayOfWeek === dayOfWeek || r.cycleIndex === targetDayIndex;
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
      addStudyMinutes: (minutes, dateStrOverride = null, { skipXp = false } = {}) => {
        const { getLocalDateStr, setUserStats, setWeeklySprint, addXP } = get();
        if (minutes <= 0) return;
        
        const targetDateStr = dateStrOverride || getLocalDateStr();
        setUserStats(prev => ({ ...prev, totalStudyMinutes: (prev.totalStudyMinutes || 0) + minutes }));
        setWeeklySprint(prev => ({ ...prev, currentMinutes: (prev.currentMinutes || 0) + minutes }));
        
        // XP reward for using pomodoro (2 XP per minute)
        if (!skipXp) {
          addXP(minutes * 2, "Sessão Pomodoro Concluída", targetDateStr);
        }
        
        set(state => ({
          studyHistory: {
            ...state.studyHistory,
            [targetDateStr]: (state.studyHistory?.[targetDateStr] || 0) + minutes
          }
        }));
        get().updateDailyMissionProgress('minutes', minutes);
        get().registerStudyActivity(targetDateStr);
      },

      watchClass: (subjectId, slotIndex, amountWatched = 1, speed = null, studyDateStr = null, plannedBlockCount = null) => {
        const { subjects, getActiveTopic, addXP, setUserStats, setWeeklySprint, setCoins, setCompletedToday, getLocalDateStr, getStartOfWeek, getTodayDate } = get();
        const activeTopic = getActiveTopic(subjectId);
        if (!activeTopic) return;

        const todayObj = getTodayDate();
        const todayStr = getLocalDateStr(todayObj);
        const targetDateStr = (studyDateStr && /^\d{4}-\d{2}-\d{2}$/.test(studyDateStr) && studyDateStr <= todayStr)
          ? studyDateStr
          : todayStr;
        const isRetroactive = targetDateStr < todayStr;
        const [, tm, td] = targetDateStr.split('-').map(Number);
        const currentWeekStartStr = getLocalDateStr(getStartOfWeek(todayObj));
        const isInCurrentWeek = targetDateStr >= currentWeekStartStr;

        const parsedSpeed = Number(speed);
        const fallbackSpeed = Number(subjects[subjectId]?.speed);
        const effectiveSpeed = (
          speed !== null &&
          speed !== undefined &&
          speed !== '' &&
          Number.isFinite(parsedSpeed) &&
          parsedSpeed > 0
        )
          ? parsedSpeed
          : (Number.isFinite(fallbackSpeed) && fallbackSpeed > 0 ? fallbackSpeed : 1);

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
            // FSRS exclusivo para questões do Caveira: aulas assistidas não geram cards em reviews.
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
          const hasMoreLessonsInSubject = topics.some(
            (t) => (Number(t.completed) || 0) < (Number(t.total) || 0)
          );
          const curState = get();
          const baseProgress = curState.completedTodayDate === todayStr && curState.slotProgressToday
            ? curState.slotProgressToday
            : {};
          const existing = baseProgress[slotIndex];
          const isMatchingExisting = existing && (!existing.subjectId || existing.subjectId === subjectId);
          const watchedStep = actualWatched > 0 ? actualWatched : Math.max(1, Math.floor(Number(amountWatched) || 1));
          const targetCount = isMatchingExisting && Number(existing.target) > 0
            ? Math.floor(Number(existing.target))
            : Number(plannedBlockCount) > 0
              ? Math.floor(Number(plannedBlockCount))
              : watchedStep;
          const newWatched = (isMatchingExisting ? Math.max(0, Number(existing.watched) || 0) : 0) + watchedStep;
          const isBlockFullyCompleted = newWatched >= targetCount || !hasMoreLessonsInSubject;

          if (isBlockFullyCompleted) {
            setCompletedToday(prev => !prev.includes(slotIndex) ? [...prev, slotIndex] : prev);
            set((s) => {
              const nextProgress = { ...(s.completedTodayDate === todayStr ? (s.slotProgressToday || {}) : {}) };
              delete nextProgress[slotIndex];
              return { slotProgressToday: nextProgress, completedTodayDate: todayStr };
            });
          } else {
            set((s) => {
              const nextProgress = {
                ...(s.completedTodayDate === todayStr ? (s.slotProgressToday || {}) : {}),
                [slotIndex]: { watched: newWatched, target: targetCount, subjectId }
              };
              const baseCompleted = s.completedTodayDate === todayStr ? (s.completedToday || []) : [];
              return {
                completedToday: baseCompleted,
                completedTodayDate: todayStr,
                slotProgressToday: nextProgress
              };
            });
          }
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
            newSubjects[subjectId] = {
              ...newSubjects[subjectId],
              topics: [...(newSubjects[subjectId].topics || []), ...topics]
            };
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
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'CLEAR_SESSION' }, '*'); } catch (_) {}
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
          changes.slotProgressToday = {};
          changes.subjectGoals = {};
          changes.subjectTimeGoal = {};
          changes.calendarOverrides = {};
          changes.calendarOverrideCounts = {};
          changes.futureScheduleRules = [];
          changes.studyHistory = {};
          changes.cycleCarryoverOffset = 0;
          changes.lastCarryoverCheckDate = get().getLocalDateStr();
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
          changes.slotProgressToday = {};
          changes.cycleCarryoverOffset = 0;
          changes.lastCarryoverCheckDate = get().getLocalDateStr();
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
          changes.slotProgressToday = {};
          changes.calendarOverrides = {};
          changes.calendarOverrideCounts = {};
          changes.futureScheduleRules = [];
          changes.cycleCarryoverOffset = 0;
          changes.lastCarryoverCheckDate = get().getLocalDateStr();
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
          changes.progressiveReviews = [];
          changes.reviewStats = { totalDone: 0, correct: 0, streak: 0 };
          changes.dailyReviewStats = {};
          if (!raioXCaveira) {
            const currentCaveira = changes.caveiraQuestions !== undefined ? changes.caveiraQuestions : (get().caveiraQuestions || []);
            changes.caveiraQuestions = currentCaveira.map(q => ({
              ...q,
              fsrsCreated: false,
              fsrsRequested: false,
              fsrsDismissed: true,
            }));
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
            changes.reviews = currentReviews.filter(r => !(
              r.origin?.includes('FPS') ||
              r.questionData?.origin?.includes('FPS') ||
              r.questionData?.source?.includes('Duelo') ||
              String(r.id || '').startsWith('rev_fps_') ||
              String(r.id || '').startsWith('rev_caveira_duelo_') ||
              String(r.id || '').startsWith('rev_caveira_fps-') ||
              String(r.caveiraQuestionId || '').startsWith('fps-') ||
              String(r.caveiraQuestionId || '').startsWith('duelo_')
            ));
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

      applySubjectDaysInCalendar: async (subjectId, selectedDaysOfWeek = [], slotCount = 0, fromDate = '') => {
        if (!subjectId) return;
        const st = get();
        if ((st.cycleScheduleType || 'weekly') !== 'weekly') return;
        const todayStr = st.getLocalDateStr ? st.getLocalDateStr() : '';
        const updated = applySubjectDaysToSchedule(st, subjectId, selectedDaysOfWeek, slotCount, todayStr, fromDate);
        if (!updated || Object.keys(updated).length === 0) return;
        set(updated);
        if (st.user?.id) {
          await get().saveToCloud({ allowEmptyOverwrite: true });
        }
      },

      createLocalRestorePoint: (reason = 'manual', label = '') => {
        const st = get();
        const snapshot = extractPersistedData(st);
        return saveLocalRestorePoint(snapshot, {
          reason,
          label,
          userId: st.user?.id || null,
          force: reason === 'manual',
        });
      },

      getLocalRestorePoints: () => {
        return listLocalRestorePoints(get().user?.id || null);
      },

      deleteLocalRestorePoint: (pointId) => {
        removeLocalRestorePoint(pointId);
        return listLocalRestorePoints(get().user?.id || null);
      },

      restoreFromLocalPoint: async (pointId) => {
        const st = get();
        const points = listLocalRestorePoints(st.user?.id || null);
        const target = points.find((p) => p.id === pointId);
        if (!target || !target.data) {
          toast.error('Ponto de restauração não encontrado.');
          return false;
        }
        // Salva ponto preventivo antes da restauração
        if (hasMeaningfulUserData(st)) {
          saveLocalRestorePoint(extractPersistedData(st), {
            reason: 'pre_restore',
            userId: st.user?.id || null,
          });
        }
        const restored = normalizeHydratedState(target.data, target.data.caveiraQuestions || []);
        set({ ...restored });
        get().syncDayRollover?.();
        get().checkAndResetWeekly?.();
        get().checkAndResetDailyMissions?.();
        get().syncAndRepairCaveiraReviews?.();
        try {
          localStorage.setItem('prf_caveira_questions', JSON.stringify(restored.caveiraQuestions || []));
        } catch (_) {}
        await get().saveToCloud({ allowEmptyOverwrite: true });
        toast.success('Ponto de restauração aplicado com sucesso.');
        return true;
      },

      executeTotalWipe: async () => {
        const st = get();
        const { user } = st;
        // Backup preventivo antes de zerar tudo, permitindo desfazer em Backup & Sistema
        if (hasMeaningfulUserData(st)) {
          saveLocalRestorePoint(extractPersistedData(st), {
            reason: 'pre_total_wipe',
            userId: user?.id || null,
          });
        }
        clearTimeout(useStore._debounceTimer);
        clearTimeout(useStore._localDebounceTimer);
        clearTimeout(useStore._retryTimer);
        useStore._keyTimestamps = {};
        try {
          localStorage.removeItem('prf_caveira_questions');
          localStorage.removeItem(LOCAL_STATE_STORAGE_KEY);
          localStorage.removeItem('alvo_legal_seen_statements_v1');
          localStorage.removeItem('alvo_legal_high_score_v1');
          localStorage.removeItem('qg_duelo_fps_topic_stats_v1');
        } catch (_) {}
        
        const cleanState = getCleanInitialState();

        // 1. Limpa memória e extensão imediatamente
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'CLEAR_SESSION' }, '*'); } catch (_) {}
        set(cleanState);

        // 2. Força sobrescrita na nuvem (Supabase) como fonte da verdade
        if (user && !isLocalTestUser(user)) {
          const persistedCleanState = extractPersistedData(cleanState);
          try {
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ 
                full_data: persistedCleanState, 
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
                  full_data: persistedCleanState,
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
            const rawSimDateKey = `${targetSimDate.getFullYear()}-${String(targetSimDate.getMonth() + 1).padStart(2, '0')}-${String(targetSimDate.getDate()).padStart(2, '0')}`;
            const hasExplicitTodayOverride = Boolean(calendarOverrides && Array.isArray(calendarOverrides[rawSimDateKey]));
            const simCarryoverOffset = (dayOffset === 0 && !hasExplicitTodayOverride && cycleScheduleType === 'weekly') ? (get().cycleCarryoverOffset || 0) : 0;
            const effectiveSimDate = simCarryoverOffset > 0
              ? new Date(targetSimDate.getFullYear(), targetSimDate.getMonth(), targetSimDate.getDate() - simCarryoverOffset)
              : targetSimDate;
            const simDateKey = simCarryoverOffset > 0
              ? `${effectiveSimDate.getFullYear()}-${String(effectiveSimDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveSimDate.getDate()).padStart(2, '0')}`
              : rawSimDateKey;

            let daySubjects = [];
            let daySlotCounts = [];
            if (hasExplicitTodayOverride) {
              daySubjects = [...calendarOverrides[rawSimDateKey]];
              daySlotCounts = Array.isArray(calendarOverrideCounts?.[rawSimDateKey]) ? [...calendarOverrideCounts[rawSimDateKey]] : [];
            } else if (calendarOverrides && Array.isArray(calendarOverrides[simDateKey])) {
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

      setCaveiraDailyGoal: (goal) => {
        const safeGoal = Math.max(5, Math.min(1000, Math.round(Number(goal) || 50)));
        set({ caveiraDailyGoal: safeGoal });
        try {
          window.postMessage({
            source: 'QG_WEB_APP',
            type: 'SET_CAVEIRA_DAILY_GOAL',
            payload: { dailyGoal: safeGoal }
          }, '*');
        } catch (_) {}
      },

      setCaveiraQuestionPrefs: (partial) => {
        const prev = sanitizeCaveiraQuestionPrefs(
          get().caveiraQuestionPrefs || DEFAULT_CAVEIRA_QUESTION_PREFS
        );
        const next = sanitizeCaveiraQuestionPrefs(
          { ...prev, ...(partial && typeof partial === 'object' ? partial : {}), updatedAt: Date.now() },
          prev
        );
        set({ caveiraQuestionPrefs: next });
        try {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_SYNC_DEFAULT_PREFS',
              payload: {
                prefs: {
                  examBoards: next.examBoards,
                  numberAlternatives: next.numberAlternatives,
                  status: next.status,
                  difficultyIds: resolveEffectiveDifficultyIds(next),
                  syncBoardsAndAlts: true,
                },
              },
            },
            window.location.origin
          );
        } catch (_) {}
      },

      // --- MISSÕES ATIVAS DE FIXAÇÃO (10q) & REVISÕES PROGRESSIVAS (5q · 100%) ---
      startPracticeMission: (config = {}) => {
        const type = config.type === 'progressive_review' ? 'progressive_review' : 'lesson_fixation';
        const baseDiffId = Number(config.baseDifficultyId) || (type === 'lesson_fixation' ? INITIAL_FIXATION_DIFFICULTY_ID : FIRST_REVIEW_DIFFICULTY_ID);
        const initialDiffIds = sanitizeDifficultyIds(
          Array.isArray(config.difficultyIds) && config.difficultyIds.length > 0
            ? config.difficultyIds
            : [baseDiffId]
        );
        const targetCount = Math.max(
          1,
          Number(config.targetCount) || (type === 'lesson_fixation' ? INITIAL_FIXATION_TARGET : PROGRESSIVE_REVIEW_TARGET)
        );
        const missionId = config.id || `mission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = Date.now();
        const mission = {
          id: missionId,
          ownerUserId: get().user?.id || null,
          type,
          status: 'active',
          title: String(config.title || config.topicName || config.subjectName || 'Prática Caveira').trim(),
          subjectId: config.subjectId || '',
          subjectName: String(config.subjectName || '').trim(),
          topicName: String(config.topicName || '').trim(),
          lessonNames: Array.isArray(config.lessonNames) ? config.lessonNames.filter(Boolean) : [],
          subtopics: Array.isArray(config.subtopics) ? config.subtopics.filter(Boolean) : [],
          rawIndexText: String(config.rawIndexText || ''),
          baseDifficultyId: baseDiffId,
          activeDifficultyIds: initialDiffIds,
          targetCount,
          requirePerfectScore: type === 'progressive_review',
          answeredQuestionIds: [],
          hits: 0,
          errors: 0,
          startedAt: now,
          updatedAt: now,
          reviewId: config.reviewId || null,
          lessonContext: config.lessonContext || null,
          finishedSeries: Array.isArray(config.finishedSeries) ? config.finishedSeries : [],
        };

        set({ activePracticeMission: mission });

        const savedPrefs = get().caveiraQuestionPrefs;
        const hasCustomQgPrefs = Boolean(savedPrefs && Number(savedPrefs.updatedAt) > 0);
        const hasExt = typeof document !== 'undefined' && document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true';

        if (hasExt) {
          try {
            window.postMessage(
              {
                source: 'QG_WEB_APP',
                type: 'QG_PRF_SYNC_ACTIVE_MISSION',
                payload: { mission: serializeMissionForBridge(mission) },
              },
              window.location.origin
            );
          } catch (err) {
            console.warn('[QG_WEB_APP] Falha ao sincronizar missão ativa:', err);
          }
          try {
            window.postMessage(
              {
                source: 'QG_WEB_APP',
                type: 'OPEN_CAVEIRA_PRACTICE',
                payload: {
                  missionId: mission.id,
                  subject: mission.subjectName,
                  lessons: mission.lessonNames,
                  topic:
                    mission.subtopics.length > 0
                      ? mission.subtopics.slice(0, 3).join(' • ')
                      : mission.lessonNames.join(' • ') || mission.topicName,
                  fallbackTopic: mission.topicName,
                  subtopics: mission.subtopics,
                  rawIndexText: mission.rawIndexText,
                  status: 'not_resolved',
                  difficultyIds: mission.activeDifficultyIds,
                  ...(hasCustomQgPrefs
                    ? {
                        examBoards: Array.isArray(savedPrefs.examBoards) ? savedPrefs.examBoards : [],
                        numberAlternatives: Array.isArray(savedPrefs.numberAlternatives)
                          ? savedPrefs.numberAlternatives
                          : [],
                      }
                    : {}),
                },
              },
              window.location.origin
            );
          } catch (err) {
            console.warn('[QG_WEB_APP] Falha ao abrir Caveira para a missão:', err);
          }
          const diffLabel = formatDifficultyIdsLabel(mission.activeDifficultyIds);
          toast.success(
            `${type === 'lesson_fixation' ? 'Fixação iniciada' : 'Revisão iniciada'}: ${mission.targetCount} questões (${diffLabel})`
          );
        } else {
          window.open('https://app.caveira.com/questions', '_blank', 'noopener');
          toast.info('Extensão não detectada nesta aba. Missão salva no QG.');
        }

        return mission;
      },

      expandActiveMissionDifficulty: () => {
        const mission = get().activePracticeMission;
        if (!mission || mission.status !== 'active') return null;
        const expanded = getExpandedDifficultyIds(mission.activeDifficultyIds, mission.baseDifficultyId);
        if (expanded.join(',') === sanitizeDifficultyIds(mission.activeDifficultyIds).join(',')) {
          toast.info('Todos os níveis vizinhos já estão incluídos.');
          return mission;
        }
        const updated = {
          ...mission,
          activeDifficultyIds: expanded,
          updatedAt: Date.now(),
        };
        set({ activePracticeMission: updated });
        const savedPrefs = get().caveiraQuestionPrefs;
        const hasCustomQgPrefs = Boolean(savedPrefs && Number(savedPrefs.updatedAt) > 0);
        try {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_SYNC_ACTIVE_MISSION',
              payload: { mission: serializeMissionForBridge(updated) },
            },
            window.location.origin
          );
        } catch (err) {
          console.warn('[QG_WEB_APP] Falha ao sincronizar missão expandida:', err);
        }
        try {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'OPEN_CAVEIRA_PRACTICE',
              payload: {
                missionId: updated.id,
                subject: updated.subjectName,
                lessons: updated.lessonNames,
                topic:
                  updated.subtopics.length > 0
                    ? updated.subtopics.slice(0, 3).join(' • ')
                    : updated.lessonNames.join(' • ') || updated.topicName,
                fallbackTopic: updated.topicName,
                subtopics: updated.subtopics,
                rawIndexText: updated.rawIndexText,
                status: 'not_resolved',
                difficultyIds: expanded,
                ...(hasCustomQgPrefs
                  ? {
                      examBoards: Array.isArray(savedPrefs.examBoards) ? savedPrefs.examBoards : [],
                      numberAlternatives: Array.isArray(savedPrefs.numberAlternatives)
                        ? savedPrefs.numberAlternatives
                        : [],
                    }
                  : {}),
              },
            },
            window.location.origin
          );
        } catch (err) {
          console.warn('[QG_WEB_APP] Falha ao abrir Caveira após expandir nível:', err);
        }
        toast.info(`Filtro expandido: ${formatDifficultyIdsLabel(expanded)}`);
        return updated;
      },

      cancelActivePracticeMission: () => {
        const cur = get().activePracticeMission;
        if (!cur) return;
        set({ activePracticeMission: null });
        try {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_CLEAR_ACTIVE_MISSION',
              payload: { missionId: cur.id || null },
            },
            window.location.origin
          );
        } catch (_) {}
        toast.info('Missão ativa cancelada.');
      },

      handleMissionClearedFromExtension: (missionId = null) => {
        const cur = get().activePracticeMission;
        if (!cur || !cur.id) return false;
        if (missionId && String(cur.id) !== String(missionId)) return false;
        set({ activePracticeMission: null });
        return true;
      },

      recordMissionQuestionAnswer: (questionId, hit, questionMeta = null) => {
        const mission = get().activePracticeMission;
        if (!mission || mission.status !== 'active' || !questionId) return false;
        if (questionMeta && !doesQuestionMatchMissionSubject(questionMeta, mission)) {
          return false;
        }
        const qKey = String(questionId);
        const answered = Array.isArray(mission.answeredQuestionIds) ? [...mission.answeredQuestionIds] : [];
        if (answered.includes(qKey)) return false;

        answered.push(qKey);
        const hits = (Number(mission.hits) || 0) + (hit ? 1 : 0);
        const errors = (Number(mission.errors) || 0) + (hit ? 0 : 1);
        const isDone = answered.length >= (Number(mission.targetCount) || 1);
        const updated = {
          ...mission,
          answeredQuestionIds: answered,
          hits,
          errors,
          status: isDone ? 'completed' : 'active',
          completedAt: isDone ? Date.now() : null,
          updatedAt: Date.now(),
        };

        set({ activePracticeMission: updated });
        try {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_SYNC_ACTIVE_MISSION',
              payload: { mission: serializeMissionForBridge(updated) },
            },
            window.location.origin
          );
        } catch (err) {
          console.warn('[QG_WEB_APP] Falha ao sincronizar progresso da missão:', err);
        }

        if (isDone) {
          get().completeActivePracticeMission(updated);
        }
        return true;
      },

      syncActiveMissionFromExtension: (extMission) => {
        if (!extMission || !extMission.id) return false;
        const curUid = get().user?.id || null;
        if (!curUid || (extMission.ownerUserId && extMission.ownerUserId !== curUid)) return false;
        const completedIds = Array.isArray(get().completedMissionIds) ? get().completedMissionIds : [];
        if (completedIds.includes(extMission.id)) {
          try {
            window.postMessage(
              {
                source: 'QG_WEB_APP',
                type: 'QG_PRF_MISSION_FINALIZED',
                payload: { missionId: extMission.id },
              },
              window.location.origin
            );
          } catch (_) {}
          return false;
        }

        const local = get().activePracticeMission;
        if (!local || local.id !== extMission.id) {
          if (local && local.id && !isMissionNewerThan(extMission, local)) {
            return false;
          }
          const extAnswered = Array.isArray(extMission.answeredQuestionIds)
            ? Array.from(new Set(extMission.answeredQuestionIds.map(String)))
            : [];
          const target = Math.max(1, Number(extMission.targetCount) || 1);
          const merged = {
            ...extMission,
            answeredQuestionIds: extAnswered,
            hits: Number(extMission.hits) || 0,
            errors: Number(extMission.errors) || 0,
          };
          if (merged.status === 'completed' || extAnswered.length >= target) {
            return get().completeActivePracticeMission(merged);
          }
          useStore._lastMissionSyncFromExtSig = getMissionSyncSignature(merged);
          set({ activePracticeMission: merged });
          return true;
        }

        const localIds = Array.isArray(local.answeredQuestionIds) ? local.answeredQuestionIds.map(String) : [];
        const extIds = Array.isArray(extMission.answeredQuestionIds) ? extMission.answeredQuestionIds.map(String) : [];
        const unionIds = Array.from(new Set([...localIds, ...extIds]));
        const hits = extIds.length >= localIds.length ? (Number(extMission.hits) || 0) : (Number(local.hits) || 0);
        const errors = extIds.length >= localIds.length ? (Number(extMission.errors) || 0) : (Number(local.errors) || 0);
        const localDiffs = sanitizeDifficultyIds(local.activeDifficultyIds);
        const extDiffs = sanitizeDifficultyIds(extMission.activeDifficultyIds);
        const activeDifficultyIds = sanitizeDifficultyIds([...localDiffs, ...extDiffs]);
        const targetCount = Math.max(1, Number(local.targetCount) || Number(extMission.targetCount) || 1);
        const isDone = extMission.status === 'completed' || unionIds.length >= targetCount;

        if (
          !isDone &&
          unionIds.length === localIds.length &&
          hits === (Number(local.hits) || 0) &&
          errors === (Number(local.errors) || 0) &&
          activeDifficultyIds.join(',') === localDiffs.join(',') &&
          local.status === 'active'
        ) {
          return false;
        }

        const merged = {
          ...local,
          answeredQuestionIds: unionIds,
          hits,
          errors,
          activeDifficultyIds,
          status: isDone ? 'completed' : 'active',
          completedAt: isDone ? (extMission.completedAt || Date.now()) : null,
          updatedAt: Math.max(Number(local.updatedAt) || 0, Number(extMission.updatedAt) || 0),
        };

        if (isDone) {
          return get().completeActivePracticeMission(merged);
        }
        useStore._lastMissionSyncFromExtSig = getMissionSyncSignature(merged);
        set({ activePracticeMission: merged });
        return true;
      },

      completeActivePracticeMission: (missionOverride = null, { allowPartial = false } = {}) => {
        const mission = missionOverride || get().activePracticeMission;
        if (!mission || !mission.id) return false;
        const completedIds = Array.isArray(get().completedMissionIds) ? get().completedMissionIds : [];
        if (completedIds.includes(mission.id)) return false;

        const answeredCount = Array.isArray(mission.answeredQuestionIds) ? mission.answeredQuestionIds.length : 0;
        const targetCount = Math.max(1, Number(mission.targetCount) || 1);
        if (!allowPartial && answeredCount < targetCount && mission.status !== 'completed') {
          return false;
        }

        const todayStr = get().getLocalDateStr();
        const nextCompletedIds = [mission.id, ...completedIds.filter((id) => id !== mission.id)].slice(0, 100);
        set({
          activePracticeMission: null,
          completedMissionIds: nextCompletedIds,
        });

        const hits = Number(mission.hits) || 0;
        const total = Math.max(answeredCount, hits + (Number(mission.errors) || 0));

        if (mission.type === 'lesson_fixation') {
          const ctx = mission.lessonContext;
          if (ctx && ctx.subjectId) {
            get().watchClass(
              ctx.subjectId,
              ctx.slotIndex ?? null,
              ctx.amountWatched || 1,
              ctx.speed ?? null,
              ctx.studyDateStr || todayStr,
              ctx.plannedBlockCount ?? null
            );
            if (ctx.slotIndex !== undefined && ctx.slotIndex !== null) {
              try {
                const storageKey = `qg_checked_lessons_${todayStr || 'today'}`;
                const rawChecked = localStorage.getItem(storageKey);
                if (rawChecked) {
                  const parsedChecked = JSON.parse(rawChecked);
                  const prefix = `${ctx.subjectId}:${ctx.slotIndex}:`;
                  let changed = false;
                  for (const k of Object.keys(parsedChecked)) {
                    if (k.startsWith(prefix)) {
                      delete parsedChecked[k];
                      changed = true;
                    }
                  }
                  if (changed) {
                    localStorage.setItem(storageKey, JSON.stringify(parsedChecked));
                  }
                }
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('qg-checked-lessons-cleared', {
                      detail: { subjectId: ctx.subjectId, slotIndex: ctx.slotIndex },
                    })
                  );
                }
              } catch (_) {}
            }
            if (typeof ctx.onConfirmed === 'function') {
              try { ctx.onConfirmed(); } catch (_) {}
            }
          }

          const seriesList = Array.isArray(mission.finishedSeries) && mission.finishedSeries.length > 0
            ? mission.finishedSeries
            : [{
                seriesKey: `${mission.subjectId}::${mission.topicName}::${mission.title}`,
                title: mission.title || mission.topicName,
                lessonNames: mission.lessonNames || [],
              }];

          const initialInterval = total > 0 && hits === total && total >= targetCount ? 3 : 1;
          const nextDateStr = addDaysToLocalDateStr(todayStr, initialInterval);
          const curProg = Array.isArray(get().progressiveReviews) ? [...get().progressiveReviews] : [];

          seriesList.forEach((s) => {
            if (!s?.seriesKey) return;
            const existingIdx = curProg.findIndex((r) => r?.seriesKey === s.seriesKey);
            const baseCard = {
              id: existingIdx >= 0 ? curProg[existingIdx].id : `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              seriesKey: s.seriesKey,
              subjectId: mission.subjectId || '',
              subjectName: mission.subjectName || '',
              topicName: mission.topicName || '',
              title: s.title || mission.title || mission.topicName,
              lessonNames: Array.isArray(s.lessonNames) && s.lessonNames.length > 0 ? s.lessonNames : (mission.lessonNames || []),
              subtopics: mission.subtopics || [],
              rawIndexText: mission.rawIndexText || '',
              currentDifficultyId: FIRST_REVIEW_DIFFICULTY_ID,
              targetQuestions: PROGRESSIVE_REVIEW_TARGET,
              mastered: false,
              stability: initialInterval,
              difficulty: 5,
              interval: initialInterval,
              nextDateStr,
              lastReviewDate: todayStr,
              lastPerformance: total > 0 ? hits / total : 0,
              history: [
                {
                  date: todayStr,
                  difficultyId: mission.baseDifficultyId || INITIAL_FIXATION_DIFFICULTY_ID,
                  hits,
                  total,
                  passed: total > 0 && hits === total,
                },
              ],
              createdAt: existingIdx >= 0 ? curProg[existingIdx].createdAt : todayStr,
              updatedAt: Date.now(),
            };
            if (existingIdx >= 0) curProg[existingIdx] = baseCard;
            else curProg.unshift(baseCard);
          });

          set({ progressiveReviews: curProg });
          get().addXP?.(50, `Fixação concluída: ${mission.title}`);
          get().setCoins?.((c) => c + 15);
          get().playSound?.('levelUp');
          toast.success(
            `🎯 Fixação concluída (${hits}/${total})! Aula registrada e 1ª revisão (Fácil · 5q) agendada para ${initialInterval === 3 ? 'daqui a 3 dias' : 'amanhã'}.`
          );
        } else if (mission.type === 'progressive_review') {
          const curProg = Array.isArray(get().progressiveReviews) ? [...get().progressiveReviews] : [];
          const rIdx = curProg.findIndex((r) => r?.id === mission.reviewId);
          if (rIdx >= 0) {
            const outcome = computeNextProgressiveReviewState(curProg[rIdx], {
              hits,
              total,
              todayDateStr: todayStr,
              updateFsrsCardFn: get().updateFsrsCard,
            });
            curProg[rIdx] = outcome.updatedReview;
            set({ progressiveReviews: curProg });

            get().setReviewStats?.((prev) => ({
              totalDone: prev.totalDone + 1,
              correct: outcome.passed ? prev.correct + 1 : prev.correct,
              streak: outcome.passed ? prev.streak + 1 : 0,
            }));
            set((state) => {
              const dailyReviewStats = state.dailyReviewStats || {};
              const todayStats = dailyReviewStats[todayStr] || { total: 0, correct: 0 };
              return {
                dailyReviewStats: {
                  ...dailyReviewStats,
                  [todayStr]: {
                    total: todayStats.total + 1,
                    correct: outcome.passed ? todayStats.correct + 1 : todayStats.correct,
                  },
                },
              };
            });
            get().registerStudyActivity?.(todayStr);
            get().updateMissionProgress?.('review', 1);

            const nextDiffLabel = formatDifficultyIdsLabel([outcome.nextDifficultyId]) || 'Fácil';
            if (outcome.newlyMastered) {
              get().addXP?.(100, `Conteúdo blindado: ${mission.title}`);
              get().setCoins?.((c) => c + 25);
              get().playSound?.('levelUp');
              toast.success(`🏆 100% no nível Muito difícil! "${mission.title}" foi BLINDADO (${hits}/${total}).`);
            } else if (outcome.leveledUp) {
              get().addXP?.(60, `Revisão 100%: ${mission.title}`);
              get().setCoins?.((c) => c + 15);
              get().playSound?.('levelUp');
              toast.success(`🔥 100% (${hits}/${total})! Próxima revisão sobe para ${nextDiffLabel} em ${outcome.nextInterval}d.`);
            } else if (outcome.passed) {
              get().addXP?.(50, `Revisão 100%: ${mission.title}`);
              get().setCoins?.((c) => c + 12);
              get().playSound?.('coin');
              toast.success(`✅ 100% (${hits}/${total}) no nível máximo! Próxima manutenção em ${outcome.nextInterval}d.`);
            } else {
              get().addXP?.(20, `Revisão concluída: ${mission.title}`);
              get().setCoins?.((c) => c + 5);
              get().playSound?.('coin');
              toast.info(`🔁 ${hits}/${total} acertos — faltou 100%. Mantido em ${nextDiffLabel} com 5 questões novas amanhã.`);
            }
          }
        }

        try {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_MISSION_FINALIZED',
              payload: { missionId: mission.id },
            },
            window.location.origin
          );
        } catch (_) {}

        return true;
      },

      completeLessonBypassFixation: ({
        subjectId,
        slotIndex = null,
        amountWatched = 1,
        speed = null,
        studyDateStr = null,
        plannedBlockCount = null,
        finishedSeries = [],
        topicName = '',
        subjectName = '',
        subtopics = [],
        rawIndexText = '',
        scheduleReview = true,
      } = {}) => {
        if (!subjectId) return false;
        const todayStr = get().getLocalDateStr();
        get().watchClass(subjectId, slotIndex, amountWatched, speed, studyDateStr || todayStr, plannedBlockCount);

        if (scheduleReview && Array.isArray(finishedSeries) && finishedSeries.length > 0) {
          const nextDateStr = addDaysToLocalDateStr(todayStr, 1);
          const curProg = Array.isArray(get().progressiveReviews) ? [...get().progressiveReviews] : [];
          let added = 0;
          finishedSeries.forEach((s) => {
            if (!s?.seriesKey || s.alreadyFixated) return;
            if (curProg.some((r) => r?.seriesKey === s.seriesKey)) return;
            added++;
            curProg.unshift({
              id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              seriesKey: s.seriesKey,
              subjectId,
              subjectName: subjectName || get().subjects?.[subjectId]?.name || '',
              topicName: topicName || '',
              title: s.title || topicName || 'Aula',
              lessonNames: Array.isArray(s.lessonNames) ? s.lessonNames : [],
              subtopics: Array.isArray(subtopics) ? subtopics : [],
              rawIndexText: String(rawIndexText || ''),
              currentDifficultyId: FIRST_REVIEW_DIFFICULTY_ID,
              targetQuestions: PROGRESSIVE_REVIEW_TARGET,
              mastered: false,
              stability: 1,
              difficulty: 5,
              interval: 1,
              nextDateStr,
              lastReviewDate: todayStr,
              lastPerformance: 0,
              history: [],
              createdAt: todayStr,
              updatedAt: Date.now(),
            });
          });
          if (added > 0) {
            set({ progressiveReviews: curProg });
          }
        }
        return true;
      },

      advanceProgressiveReviewToToday: (reviewId) => {
        const todayStr = get().getLocalDateStr();
        const cur = Array.isArray(get().progressiveReviews) ? get().progressiveReviews : [];
        let changed = false;
        const updated = cur.map((r) => {
          if (r && r.id === reviewId && r.nextDateStr > todayStr) {
            changed = true;
            return { ...r, nextDateStr: todayStr, updatedAt: Date.now() };
          }
          return r;
        });
        if (changed) {
          set({ progressiveReviews: updated });
          toast.success('Revisão de aula adiantada para hoje!');
        }
      },

      deleteProgressiveReview: (reviewId) => {
        const cur = Array.isArray(get().progressiveReviews) ? get().progressiveReviews : [];
        const next = cur.filter((r) => r && r.id !== reviewId);
        if (next.length !== cur.length) {
          set({ progressiveReviews: next });
          toast.info('Revisão de aula removida.');
        }
      },

      setCaveiraSessionStats: (sessionStats) => set({ caveiraSessionStats: sessionStats }),

      setCaveiraPerformanceSnapshot: (snapshot) => {
        if (!snapshot || typeof snapshot !== 'object') return;
        set({ caveiraPerformanceSnapshot: snapshot });
      },

      setCaveiraFilterMemory: (memory) => {
        if (!memory || typeof memory !== 'object') return;
        const prev = get().caveiraFilterMemory || {};
        const merged = { ...prev, ...memory };
        try {
          if (JSON.stringify(prev) === JSON.stringify(merged)) return;
        } catch (_) {}
        set({ caveiraFilterMemory: merged });
      },

      setCaveiraCourseIndexMap: (entryOrMap) => {
        if (!entryOrMap || typeof entryOrMap !== 'object') return;
        const prev = get().caveiraCourseIndexMap || {};
        const next = { ...prev };
        let changed = false;

        const parseTimestampTopics = (rawText = '') => {
          const lines = String(rawText || '').split(/\r?\n/);
          const parsed = [];
          lines.forEach((raw) => {
            const m = raw.match(/[[( ]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s*[-–—:|]*\s*(.+)/);
            if (!m) return;
            const hasHours = m[3] !== undefined;
            const h = hasHours ? Number(m[1]) : 0;
            const min = hasHours ? Number(m[2]) : Number(m[1]);
            const sec = hasHours ? Number(m[3]) : Number(m[2]);
            const seconds = h * 3600 + min * 60 + sec;
            const mmss = hasHours
              ? `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
              : `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
            const label = String(m[4] || '').trim();
            if (label && seconds >= 0) {
              parsed.push({ label, mmss, seconds });
            }
          });
          return parsed;
        };

        const cleanCourseLessonTitle = (str = '') =>
          String(str || '')
            .replace(/\b(?:play_circle(?:_outline|_filled)?|check_circle|ondemand_video|smart_display|lock|schedule)\b/gi, ' ')
            .replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const cleanCourseEntryUrl = (rawUrl = '') => {
          if (!rawUrl) return '';
          try {
            const u = new URL(String(rawUrl));
            u.hash = '';
            u.searchParams.delete('t');
            return u.toString();
          } catch (_) {
            return String(rawUrl).split('#')[0].replace(/([?&])t=\d+&?/g, '$1').replace(/[?&]$/, '');
          }
        };

        const modLookup = {};
        const lessonSubjectLookup = {};
        Object.values(get().subjects || {}).forEach((sub) => {
          if (!sub) return;
          const addUrlMod = (rawU, modTitle = '') => {
            const m = String(rawU || '').match(/\/courses\/(\d+)\/modules\/(\d+)/i);
            if (m) {
              const mk = `${m[1]}:${m[2]}`;
              if (!modLookup[mk]) modLookup[mk] = { subject: sub.name || '', moduleName: modTitle || '' };
            }
          };
          addUrlMod(sub.caveiraModuleUrl, '');
          (sub.topics || []).forEach((t) => {
            if (!t) return;
            addUrlMod(t.caveiraModuleUrl, t.name || '');
            (t.lessons || []).forEach((l) => {
              addUrlMod(l?.caveiraUrl || l?.url, t.name || '');
              const lk = normalizeCourseLookupKey(cleanCourseLessonTitle(l?.name || ''));
              if (lk && !lessonSubjectLookup[lk]) {
                lessonSubjectLookup[lk] = { subject: sub.name || '', moduleName: t.name || '' };
              }
            });
          });
        });

        // Self-heal entradas antigas sujas no store (play_circle, ?t= na base URL, subject vazio, Módulo Atual)
        Object.keys(next).forEach((k) => {
          const item = next[k];
          if (!item || typeof item !== 'object') return;
          const cleanedTitle = cleanCourseLessonTitle(item.title || item.lessonTitle || k);
          const cleanedUrl = cleanCourseEntryUrl(item.url || '');
          const modMatch = cleanedUrl.match(/\/courses\/(\d+)\/modules\/(\d+)/i);
          const fromMod = modMatch ? modLookup[`${modMatch[1]}:${modMatch[2]}`] : null;
          const fromLesson = lessonSubjectLookup[normalizeCourseLookupKey(cleanedTitle)] || null;
          const nextSubj = item.subject || fromMod?.subject || fromLesson?.subject || '';
          const nextMod = (item.moduleName && item.moduleName !== 'Módulo Atual')
            ? item.moduleName
            : (fromMod?.moduleName || fromLesson?.moduleName || '');
          if (cleanedTitle !== item.title || cleanedUrl !== item.url || nextSubj !== item.subject || nextMod !== item.moduleName) {
            next[k] = { ...item, title: cleanedTitle, url: cleanedUrl, subject: nextSubj, moduleName: nextMod };
            changed = true;
          }
          if (/\b(?:play_circle|check_circle|ondemand_video)\b/i.test(k) || /\s+\d{1,2}\s+\d{2}$/.test(k)) {
            const cid = String(item.courseId || extractCourseIdFromUrl(cleanedUrl) || '');
            const cleanKeyCore = normalizeCourseLookupKey(cleanedTitle);
            const cleanKey = cid && cleanKeyCore ? `${cid}::${cleanKeyCore}` : cleanKeyCore;
            if (cleanKey && cleanKey !== k) {
              if (!next[cleanKey] || (Array.isArray(item.topics) && item.topics.length > (next[cleanKey].topics?.length || 0))) {
                next[cleanKey] = next[k];
              }
              delete next[k];
              changed = true;
            }
          }
        });

        const upsertEntry = (key, rawEntry) => {
          if (!key || !rawEntry || typeof rawEntry !== 'object') return;
          const rawText = rawEntry.indiceRawText || rawEntry.rawIndexText || rawEntry.bizusRawText || '';
          const topics = Array.isArray(rawEntry.topics) && rawEntry.topics.length > 0
            ? rawEntry.topics
            : parseTimestampTopics(rawText);
          const rawTitle = cleanCourseLessonTitle(rawEntry.lessonTitle || rawEntry.title || key);
          const initialUrl = cleanCourseEntryUrl(rawEntry.url || prev[key]?.url || '');
          const initialCourseId = String(rawEntry.courseId || extractCourseIdFromUrl(initialUrl) || prev[key]?.courseId || '');
          const cleanKeyPart = normalizeCourseLookupKey(rawTitle) || String(key).replace(/^\d+::/, '');
          const scopedKey = initialCourseId ? `${initialCourseId}::${cleanKeyPart}` : cleanKeyPart;
          const prevScoped = next[scopedKey] || prev[scopedKey] || prev[key];
          const url = cleanCourseEntryUrl(rawEntry.url || prevScoped?.url || '');
          const courseId = String(rawEntry.courseId || extractCourseIdFromUrl(url) || prevScoped?.courseId || '');
          const courseName = String(rawEntry.courseName || prevScoped?.courseName || '');
          const modMatch = url.match(/\/courses\/(\d+)\/modules\/(\d+)/i);
          const fromMod = modMatch ? modLookup[`${modMatch[1]}:${modMatch[2]}`] : null;
          const fromLesson = lessonSubjectLookup[normalizeCourseLookupKey(rawTitle)] || null;
          const resolvedSubject = rawEntry.subject || prevScoped?.subject || fromMod?.subject || fromLesson?.subject || '';
          const rawMod = rawEntry.moduleName || prevScoped?.moduleName || '';
          const resolvedModuleName = (rawMod && rawMod !== 'Módulo Atual')
            ? rawMod
            : (fromMod?.moduleName || fromLesson?.moduleName || '');
          const candidate = {
            url,
            courseId,
            courseName,
            title: rawTitle || prevScoped?.title || key,
            subject: resolvedSubject,
            moduleName: resolvedModuleName,
            topics: topics.length > 0 ? topics : (prevScoped?.topics || []),
            subtopics: Array.isArray(rawEntry.subtopics) ? rawEntry.subtopics : (prevScoped?.subtopics || []),
            updatedAt: rawEntry.updatedAt || prevScoped?.updatedAt || Date.now()
          };
          if (JSON.stringify(next[scopedKey]) !== JSON.stringify(candidate)) {
            next[scopedKey] = candidate;
            changed = true;
          }
        };

        if (entryOrMap.byLesson && typeof entryOrMap.byLesson === 'object') {
          Object.entries(entryOrMap.byLesson).forEach(([k, val]) => upsertEntry(k, val));
          if (entryOrMap.latest && entryOrMap.latest.lessonTitle) {
            const latestKey = normalizeCourseLookupKey(entryOrMap.latest.lessonTitle);
            const latestCid = String(entryOrMap.latest.courseId || extractCourseIdFromUrl(entryOrMap.latest.url) || '');
            upsertEntry(latestCid ? `${latestCid}::${latestKey}` : latestKey, entryOrMap.latest);
          }
        } else {
          Object.entries(entryOrMap).forEach(([k, val]) => upsertEntry(k, val));
        }

        if (changed) {
          // Limita a 250 aulas indexadas mais recentes para manter o snapshot enxuto
          const entries = Object.entries(next).sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0)).slice(0, 250);
          set({ caveiraCourseIndexMap: Object.fromEntries(entries) });
        }
      },

      importCaveiraSimulados: (items = []) => {
        if (!Array.isArray(items) || items.length === 0) return 0;
        const { simulados = [], getLocalDateStr, addXP, updateMissionProgress } = get();
        const today = getLocalDateStr();
        const nextSimulados = simulados.map(s => ({ ...s }));
        let addedCount = 0;
        let updatedCount = 0;

        items.forEach((item, idx) => {
          if (!item || typeof item !== 'object') return;
          const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(String(item.data || '')) ? item.data : today;
          const title = String(item.title || 'Simulado Projeto Caveira').trim();
          if (/^#?\d{1,5}\s*[º°ª]?$/.test(title) || /^caveira\s+\d{3,}$/i.test(title)) return;

          const titleNorm = normalizeCourseLookupKey(title);
          const existingIdx = nextSimulados.findIndex((s) => (
            (item.caveiraId && s?.caveiraId && s.caveiraId === item.caveiraId) ||
            (s?.source === 'caveira' && titleNorm && normalizeCourseLookupKey(s?.title || '') === titleNorm)
          ));

          const total = Number(item.total) || 0;
          const hits = Number(item.hits) || 0;
          const errors = item.errors !== undefined && item.errors !== null ? Number(item.errors) : Math.max(0, total - hits);
          const pct = item.pct !== undefined && item.pct !== null
            ? Number(item.pct)
            : (total > 0 ? Math.round((hits / total) * 100) : 0);
          const liquida = item.liquida !== undefined && item.liquida !== null
            ? Number(item.liquida)
            : (hits - errors);

          const blockFields = {
            ...(item.b1C !== undefined ? { b1C: Number(item.b1C) } : {}),
            ...(item.b1E !== undefined ? { b1E: Number(item.b1E) } : {}),
            ...(item.b1Liquida !== undefined ? { b1Liquida: Number(item.b1Liquida) } : {}),
            ...(item.b2C !== undefined ? { b2C: Number(item.b2C) } : {}),
            ...(item.b2E !== undefined ? { b2E: Number(item.b2E) } : {}),
            ...(item.b2Liquida !== undefined ? { b2Liquida: Number(item.b2Liquida) } : {}),
            ...(item.b3C !== undefined ? { b3C: Number(item.b3C) } : {}),
            ...(item.b3E !== undefined ? { b3E: Number(item.b3E) } : {}),
            ...(item.b3Liquida !== undefined ? { b3Liquida: Number(item.b3Liquida) } : {}),
          };

          const inferBlocoBySubjectName = (subName) => {
            const norm = normalizeCourseLookupKey(subName);
            if (!norm) return 'Bloco I';
            if (/(?:transito|ctb|contran|9503)/.test(norm)) return 'Bloco II';
            if (/(?:penal|processual|administrativo|constitucional|direitos humanos|extravagante|leis especiais|legislacao especial|institucional)/.test(norm)) {
              return 'Bloco III';
            }
            return 'Bloco I';
          };

          const normalizeSubjectRow = (sc) => {
            if (!sc || !sc.name) return null;
            const h = Number(sc.hits) || 0;
            const e = Number(sc.errors) || 0;
            const bl = Number(sc.blank) || 0;
            const canc = Number(sc.canceled) || 0;
            const tot = Number(sc.total) || (h + e + bl + canc);
            const liq = sc.liquida !== undefined ? Number(sc.liquida) : (h - e);
            const pctVal = sc.pct !== undefined ? Number(sc.pct) : (tot > 0 ? Math.round((h / tot) * 100) : 0);
            return {
              ...(sc.subjectId ? { subjectId: Number(sc.subjectId) } : {}),
              name: String(sc.name).trim(),
              hits: h,
              errors: e,
              blank: bl,
              ...(canc > 0 ? { canceled: canc } : {}),
              total: tot,
              liquida: liq,
              pct: pctVal,
              ...(sc.othersPct !== undefined ? { othersPct: Number(sc.othersPct) } : {}),
              bloco: sc.bloco || inferBlocoBySubjectName(sc.name),
            };
          };
          const normalizedSubjects = Array.isArray(item.subjectScores)
            ? item.subjectScores.map(normalizeSubjectRow).filter(Boolean)
            : [];

          if (existingIdx >= 0) {
            const cur = nextSimulados[existingIdx];
            const addsBlocks = cur.b1Liquida === undefined && item.b1Liquida !== undefined;
            const addsSubjects = normalizedSubjects.length > 0 && (
              !Array.isArray(cur.subjectScores) ||
              cur.subjectScores.length < normalizedSubjects.length ||
              normalizedSubjects.some((s, i) => (
                (cur.subjectScores[i]?.othersPct === undefined && s.othersPct !== undefined) ||
                (cur.subjectScores[i]?.subjectId === undefined && s.subjectId !== undefined)
              ))
            );
            const changesScore = (item.hits !== undefined && cur.hits !== hits) ||
              (item.errors !== undefined && cur.errors !== errors) ||
              (item.liquida !== undefined && cur.liquida !== liquida);
            const addsUrl = Boolean(item.url && !cur.url);

            const dateRank = (src) => (src === 'manual' ? 4 : (src === 'attempt' || src === 'created') ? 3 : (src === 'release' || src === 'api_date') ? 2 : 1);
            const curRank = dateRank(cur.dateSource || 'import');
            const incRank = dateRank(item.dateSource || 'import');
            const canImproveDate = cur.dateSource !== 'manual' && item.dateSource && (
              incRank > curRank || (incRank >= curRank && item.dateSource !== 'import' && dateStr !== cur.data)
            );

            if (addsBlocks || addsSubjects || changesScore || addsUrl || canImproveDate) {
              nextSimulados[existingIdx] = {
                ...cur,
                caveiraId: (item.caveiraId && !String(item.caveiraId).startsWith('sim_title_')) ? item.caveiraId : (cur.caveiraId || item.caveiraId || null),
                ...(canImproveDate ? { data: dateStr, dateSource: item.dateSource, ...(item.dateField ? { dateField: item.dateField } : {}) } : {}),
                ...(item.releasedAt ? { releasedAt: item.releasedAt } : {}),
                total: total || cur.total,
                hits: item.hits !== undefined ? hits : cur.hits,
                errors: item.errors !== undefined ? errors : cur.errors,
                ...(item.blank !== undefined ? { blank: Number(item.blank) } : {}),
                ...(item.canceled !== undefined ? { canceled: Number(item.canceled) } : {}),
                pct: item.pct !== undefined ? pct : cur.pct,
                liquida: item.liquida !== undefined ? liquida : cur.liquida,
                ...blockFields,
                ...(normalizedSubjects.length > 0 ? { subjectScores: normalizedSubjects } : {}),
                ...(item.url ? { url: item.url } : {}),
              };
              updatedCount += 1;
            }
            return;
          }

          nextSimulados.push({
            id: Date.now() + idx,
            data: dateStr,
            ...(item.dateSource ? { dateSource: item.dateSource } : {}),
            ...(item.dateField ? { dateField: item.dateField } : {}),
            ...(item.releasedAt ? { releasedAt: item.releasedAt } : {}),
            title,
            source: 'caveira',
            caveiraId: item.caveiraId || null,
            total,
            hits,
            errors,
            ...(item.blank !== undefined ? { blank: Number(item.blank) } : {}),
            ...(item.canceled !== undefined ? { canceled: Number(item.canceled) } : {}),
            pct,
            liquida,
            ...blockFields,
            ...(normalizedSubjects.length > 0 ? { subjectScores: normalizedSubjects } : {}),
            ...(item.url ? { url: item.url } : {})
          });
          addedCount += 1;
        });

        if (addedCount === 0 && updatedCount === 0) return 0;
        const sorted = nextSimulados.sort((a, b) => toSortableIsoDate(a.data).localeCompare(toSortableIsoDate(b.data)));
        set({ simulados: sorted });
        if (addedCount > 0) {
          addXP(150 * addedCount, `${addedCount} Simulado(s) do Caveira importado(s)`);
          updateMissionProgress?.('simulado', addedCount);
        }
        return addedCount + updatedCount;
      },

      logCaveiraPdfStudy: ({ title = 'PDF Interativo', subject = '', minutes = 5 } = {}) => {
        const mins = Math.max(1, Math.min(480, Math.round(Number(minutes) || 1)));
        const { addStudyMinutes, setCoins, addXP, boostPetWithStudy } = get();
        addStudyMinutes(mins, null, { skipXp: true });
        addXP(Math.min(200, mins * 2), `Leitura de PDF (${subject || title}): ${mins} min`);
        setCoins(c => c + Math.min(25, Math.max(2, Math.ceil(mins / 3))));
        boostPetWithStudy?.('study');
        toast.success(`📄 +${mins} min de PDF (${subject || title}) registrados no QG!`);
        return mins;
      },

      syncCourseCatalogFromCaveira: (catalog) => {
        if (!catalog || !Array.isArray(catalog.modules) || catalog.modules.length === 0) {
          return { matchedSubjects: 0, updatedLessons: 0, addedLessons: 0 };
        }
        const { subjects = {} } = get();
        const nextSubjects = { ...subjects };
        let matchedSubjects = 0;
        let updatedLessons = 0;
        let addedLessons = 0;

        const SUBJECT_ALIASES = [
          { group: ['lingua portuguesa', 'portugues', 'gramatica', 'interpretacao de texto', 'ortografia'] },
          { group: ['legislacao de transito', 'transito', 'ctb', 'codigo de transito', 'contran'] },
          { group: ['raciocinio logico', 'rlm', 'matematica'] },
          { group: ['direito administrativo', 'administrativo'] },
          { group: ['direito constitucional', 'constitucional'] },
          { group: ['direito processual penal', 'processual penal', 'processo penal', 'dpp'] },
          { group: ['direito penal', 'penal'], excludeIf: ['processual', 'processo'] },
          { group: ['legislacao especial', 'leis especiais', 'extravagante'] },
          { group: ['direitos humanos', 'humanos'] },
          { group: ['informatica', 'redes', 'seguranca da informacao'] },
          { group: ['fisica', 'cinematica', 'dinamica'] },
          { group: ['etica', 'servico publico'] },
          { group: ['geopolitica', 'geografia'] },
          { group: ['redacao', 'discursiva'] },
        ];

        const normModuleMatch = (subName, modName) => {
          const s = normalizeCourseLookupKey(subName);
          const m = normalizeCourseLookupKey(modName);
          if (!s || !m) return false;
          if (s === m || m.includes(s) || s.includes(m)) return true;
          const sTokens = s.split(' ').filter(w => w.length > 3);
          if (sTokens.length > 0 && sTokens.every(tok => m.includes(tok))) return true;
          for (const rule of SUBJECT_ALIASES) {
            if (rule.excludeIf && rule.excludeIf.some(ex => m.includes(ex) || s.includes(ex))) continue;
            const sHit = rule.group.some(alias => s.includes(alias));
            const mHit = rule.group.some(alias => m.includes(alias));
            if (sHit && mHit) return true;
          }
          return false;
        };

        const incomingCourseId = String(catalog.courseId || '');
        const incomingCourseName = String(catalog.courseName || '').trim();

        const isSpecificNameMatch = (a, b) => {
          const na = normalizeCourseLookupKey(a);
          const nb = normalizeCourseLookupKey(b);
          if (!na || !nb) return false;
          if (na === nb) return true;
          if (na.length >= 6 && nb.length >= 6 && (nb.includes(na) || na.includes(nb))) return true;
          const toks = na.split(' ').filter(w => w.length > 3);
          return toks.length >= 2 && toks.every(t => nb.includes(t));
        };

        const parseMinToClock = (minVal) => {
          const mins = Number(minVal);
          if (!Number.isFinite(mins) || mins <= 0) return '';
          const totalSec = Math.round(mins * 60);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          return h > 0
            ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        catalog.modules.forEach((mod) => {
          if (!mod || !mod.name) return;
          const modLessons = Array.isArray(mod.lessons) ? mod.lessons : [];
          if (modLessons.length === 0 && !mod.moduleUrl) return;

          const firstBracket = modLessons[0]?.title?.match(/^\s*[[(]([^\]()]{3,40})[\])]/)?.[1] || '';
          const candidatesToMatch = [mod.name, incomingCourseName, firstBracket].filter(Boolean);

          // Escolhe a disciplina mais específica sem sobrescrever disciplinas presas a outro curso
          let targetEntry = null;
          let bestSubjectScore = 0;
          Object.entries(nextSubjects).forEach(([id, sub]) => {
            if (!sub) return;
            const subCourseId = String(sub.caveiraCourseId || extractCourseIdFromUrl(sub.caveiraModuleUrl) || '');
            const topicMatchesCourseId = (sub.topics || []).some(
              (t) => incomingCourseId && String(t?.caveiraCourseId || extractCourseIdFromUrl(t?.caveiraModuleUrl) || '') === incomingCourseId
            );
            const topicMatchesCourseName = incomingCourseName && (sub.topics || []).some(
              (t) => isSpecificNameMatch(t?.name, incomingCourseName) || isSpecificNameMatch(t?.caveiraCourseName, incomingCourseName)
            );
            const subMatchesCourseName = incomingCourseName && (
              isSpecificNameMatch(sub.name, incomingCourseName) || isSpecificNameMatch(sub.caveiraCourseName, incomingCourseName)
            );

            if (incomingCourseId && subCourseId && subCourseId !== incomingCourseId && !topicMatchesCourseId && !topicMatchesCourseName) {
              return;
            }

            let score = 0;
            if (incomingCourseId && subCourseId === incomingCourseId) score += 120;
            if (topicMatchesCourseId) score += 100;
            if (subMatchesCourseName) score += 90;
            if (topicMatchesCourseName) score += 70;
            if (candidatesToMatch.some((c) => isSpecificNameMatch(sub.name, c))) score += 60;
            if (candidatesToMatch.some((c) => normModuleMatch(sub.name, c))) score += 40;

            if (score > bestSubjectScore) {
              bestSubjectScore = score;
              targetEntry = [id, sub];
            }
          });
          if (!targetEntry) return;

          const [subId, subObj] = targetEntry;
          matchedSubjects++;
          const topics = Array.isArray(subObj.topics) ? subObj.topics.map(t => ({
            ...t,
            lessons: Array.isArray(t.lessons) ? t.lessons.map(l => ({ ...l })) : []
          })) : [];

          if (modLessons.length > 0 && topics.length === 0) {
            topics.push({
              id: `top_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: mod.name,
              ...(incomingCourseId ? { caveiraCourseId: incomingCourseId } : {}),
              ...(incomingCourseName ? { caveiraCourseName: incomingCourseName } : {}),
              ...(mod.moduleUrl ? { caveiraModuleUrl: mod.moduleUrl } : {}),
              completed: modLessons.filter(l => l.completed).length,
              total: modLessons.length,
              lessons: modLessons.map(l => ({
                name: l.title,
                duration: parseMinToClock(l.durationMin),
                completed: Boolean(l.completed),
                ...(l.url ? { caveiraUrl: l.url } : {}),
                ...(l.id ? { caveiraVideoId: l.id } : {}),
                ...(incomingCourseId ? { caveiraCourseId: incomingCourseId } : {}),
                ...(incomingCourseName ? { caveiraCourseName: incomingCourseName } : {})
              }))
            });
            addedLessons += modLessons.length;
          } else if (modLessons.length > 0) {
            const topicMatchingCourse = topics.find(
              (t) =>
                (incomingCourseId && String(t?.caveiraCourseId || extractCourseIdFromUrl(t?.caveiraModuleUrl) || '') === incomingCourseId) ||
                (incomingCourseName && (isSpecificNameMatch(t?.name, incomingCourseName) || isSpecificNameMatch(t?.caveiraCourseName, incomingCourseName)))
            );

            modLessons.forEach((les) => {
              if (!les || !les.title) return;
              let bestTopic = null;
              let bestIdx = -1;
              let bestScore = 0;

              for (const topic of topics) {
                const topicCid = String(topic?.caveiraCourseId || extractCourseIdFromUrl(topic?.caveiraModuleUrl) || '');
                if (incomingCourseId && topicCid && topicCid !== incomingCourseId) continue;

                const isCoursePreferredTopic = Boolean(
                  topicMatchingCourse && topic.id === topicMatchingCourse.id
                );

                (topic.lessons || []).forEach((existing, idx) => {
                  const baseSc = scoreLessonTitleMatch(existing?.name || '', les.title);
                  if (baseSc <= 0) return;
                  const effectiveSc = baseSc + (isCoursePreferredTopic ? 15 : 0);
                  if (effectiveSc > bestScore) {
                    bestScore = effectiveSc;
                    bestTopic = topic;
                    bestIdx = idx;
                  }
                });
              }

              if (bestScore >= 65 && bestTopic && bestIdx >= 0) {
                const cur = bestTopic.lessons[bestIdx];
                const curHasSpecificVideo = Boolean(cur?.caveiraUrl && String(cur.caveiraUrl).includes('course_video_id='));
                const curCourseId = String(cur?.caveiraCourseId || extractCourseIdFromUrl(cur?.caveiraUrl) || '');
                const belongsToAnotherCourse = Boolean(
                  curHasSpecificVideo && curCourseId && incomingCourseId && curCourseId !== incomingCourseId
                );
                if (!belongsToAnotherCourse) {
                  const incHasVerifiedVideo = Boolean(les.verifiedVideoUrl && les.url && String(les.url).includes('course_video_id='));
                  const resolvedUrl = (!curHasSpecificVideo || incHasVerifiedVideo || (les.url && curHasSpecificVideo))
                    ? (les.url || cur.caveiraUrl)
                    : cur.caveiraUrl;
                  bestTopic.lessons[bestIdx] = {
                    ...cur,
                    ...(resolvedUrl ? { caveiraUrl: resolvedUrl } : {}),
                    ...(les.id ? { caveiraVideoId: les.id } : {}),
                    ...(incomingCourseId ? { caveiraCourseId: incomingCourseId } : {}),
                    ...(incomingCourseName ? { caveiraCourseName: incomingCourseName } : {}),
                    ...(les.durationMin > 0 && !cur.duration ? { duration: parseMinToClock(les.durationMin) } : {})
                  };
                  updatedLessons++;
                }
              } else {
                const matchingTopic =
                  topicMatchingCourse ||
                  topics.find(t => isSpecificNameMatch(t?.name, mod.name)) ||
                  (String(subObj.caveiraCourseId || '') === incomingCourseId ? topics[0] : null);
                const matchingTopicCid = String(matchingTopic?.caveiraCourseId || extractCourseIdFromUrl(matchingTopic?.caveiraModuleUrl) || '');
                const canAppendToTopic = Boolean(
                  matchingTopic &&
                  (!matchingTopicCid || !incomingCourseId || matchingTopicCid === incomingCourseId) &&
                  (matchingTopicCid === incomingCourseId || String(subObj.caveiraCourseId || '') === incomingCourseId || isSpecificNameMatch(matchingTopic.name, incomingCourseName))
                );
                if (canAppendToTopic) {
                  matchingTopic.lessons = Array.isArray(matchingTopic.lessons) ? matchingTopic.lessons : [];
                  matchingTopic.lessons.push({
                    name: les.title,
                    duration: parseMinToClock(les.durationMin),
                    completed: Boolean(les.completed),
                    ...(les.url ? { caveiraUrl: les.url } : {}),
                    ...(les.id ? { caveiraVideoId: les.id } : {}),
                    ...(incomingCourseId ? { caveiraCourseId: incomingCourseId } : {}),
                    ...(incomingCourseName ? { caveiraCourseName: incomingCourseName } : {})
                  });
                  matchingTopic.total = Math.max(Number(matchingTopic.total) || 0, matchingTopic.lessons.length);
                  if (les.completed) {
                    matchingTopic.completed = Math.min(matchingTopic.total, (Number(matchingTopic.completed) || 0) + 1);
                  }
                  addedLessons++;
                }
              }
            });
          }

          const existingSubCourseId = String(subObj.caveiraCourseId || extractCourseIdFromUrl(subObj.caveiraModuleUrl) || '');
          const canUpdateSubjectBinding = !existingSubCourseId || !incomingCourseId || existingSubCourseId === incomingCourseId;

          nextSubjects[subId] = {
            ...subObj,
            ...(canUpdateSubjectBinding && incomingCourseId ? { caveiraCourseId: incomingCourseId } : {}),
            ...(canUpdateSubjectBinding && incomingCourseName ? { caveiraCourseName: incomingCourseName } : {}),
            ...(canUpdateSubjectBinding && mod.moduleUrl ? { caveiraModuleUrl: mod.moduleUrl } : {}),
            topics
          };
        });

        if (matchedSubjects > 0) {
          set({ subjects: nextSubjects });
        }
        return { matchedSubjects, updatedLessons, addedLessons };
      },

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
  // Não grava snapshot nem agenda upload enquanto o carregamento inicial ou merge está em curso
  if (state.isLoadingFromCloud || state.isSyncing || useStore._suppressSubscribeStamp) return;

  const changedKeys = PERSISTED_KEYS.filter(key => state[key] !== prevState[key]);
  if (changedKeys.length === 0) return;
  const isUiThemeOnlyChange = changedKeys.every(k => k === 'isDarkMode' || k === 'activeTab');

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
  if (!state.user || !state.hasCompletedInitialCloudSync || isUiThemeOnlyChange) return;

  clearTimeout(useStore._debounceTimer);
  useStore._debounceTimer = setTimeout(() => {
    pendingSaves++;
    useStore.getState().saveToCloud().finally(() => {
      pendingSaves = Math.max(0, pendingSaves - 1);
    });
  }, 1500);
});

