import {
  mountShadowHud,
  getHudEl,
  isEventInsideHud,
  isMutationInsideHud,
  destroyShadowHud,
} from '../ui/shadowHudHost.js';
import { mergeBaselineAndDynamicTree } from '../tree/dynamicTreeManager.js';

// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (v3.0 — Shadow DOM + Dexie IndexedDB + Sync Realtime)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira v3.0.0 ativo em:', window.location.href);

  // Encerra eventual instância anterior do content script (quando a extensão é recarregada)
  try {
    window.dispatchEvent(new CustomEvent('qg-caveira-teardown'));
    destroyShadowHud();
  } catch (_) {}

  const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=caveira';
  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';
  const SCHEMA_KEY = 'qg_caveira_schema_v3';
  const GOAL_KEY = 'qg_caveira_daily_goal';
  const ACTIVE_USER_KEY = 'qg_active_user_id';
  const ACTIVE_USER_LABEL_KEY = 'qg_active_user_label';
  const PENDING_FILTER_KEY = 'qg_pending_caveira_filter';
  const COURSE_INDEX_CACHE_KEY = 'qg_caveira_course_index_cache';
  const FILTER_CORRECTION_MEMORY_KEY = 'qg_caveira_filter_memory';
  const FILTER_ID_MEMORY_KEY = 'qg_caveira_filter_id_memory_v1';
  const FILTER_MEMORY_CLOUD_KEY = 'qg_filter_memory_cloud';
  const TODAY_MISSION_KEY = 'qg_today_mission';
  const SUBJECT_SPEEDS_KEY = 'qg_subject_speeds';
  const PLAYER_SPEED_KEY = 'qg_player_target_speed';
  const PLAYER_SEEK_KEY = 'qg_player_pending_seek';
  const PENDING_CATALOG_KEY = 'qg_pending_course_catalog';
  const PENDING_SIMULADOS_KEY = 'qg_pending_simulados_import';
  const PENDING_PDF_KEY = 'qg_pending_pdf_study';
  const LAST_FILTER_DIAG_KEY = 'qg_caveira_last_filter_diag';
  const DEFAULT_PREFS_KEY = 'qg_caveira_default_prefs';
  const SUBJECT_TREE_CACHE_KEY = 'qg_caveira_subject_tree_cache';
  const MAX_BUCKET_QUESTIONS = 1500;
  let cachedDailyGoal = 50;
  let cachedActiveUserId = null;
  let cachedActiveUserLabel = '';
  let activePracticeFilter = null;
  let isApplyingFilter = false;
  let filterStatusMessage = '';
  let lastFilterDiagnosticLog = null;
  let cachedCaveiraTree = null;
  let cachedCaveiraTreeGeradoEm = '';
  let pendingResolverResult = null;
  let lastCapturedCourseSignature = '';
  let currentCourseIndexStatus = null;
  let cachedTodayMission = null;
  let todayMissionIdx = 0;
  let cachedSubjectSpeeds = {};
  let pdfReadingSeconds = 0;
  let pdfTimerInterval = null;
  let lastPlaygroundSpeedApplied = 0;
  let lastSeekUrlApplied = '';
  let apiCourseCatalogCache = null;
  const apiQuestionCache = new Map();
  let apiSimuladosCache = [];
  let handleApiSnifferMessageRef = null;
  const lessonCompletionStateByUrl = new Map();
  const observedVideos = new WeakSet();
  const peekedCourseUrls = new Set();

  function isCoursePage() {
    try {
      return window.location.pathname.includes('/courses');
    } catch (_) {
      return false;
    }
  }

  function isCoursePlaygroundPage() {
    try {
      return /\/courses\/.*\/playground/i.test(window.location.pathname);
    } catch (_) {
      return false;
    }
  }

  function isCourseCatalogPage() {
    try {
      return /\/courses\/\d+/i.test(window.location.pathname);
    } catch (_) {
      return false;
    }
  }

  function isQuestionsPage() {
    try {
      return /\/questions/i.test(window.location.pathname);
    } catch (_) {
      return false;
    }
  }

  function isSimuladosPage() {
    try {
      return /\/(?:teams|personal-practice-exams|practice-exams|simulados)/i.test(window.location.pathname);
    } catch (_) {
      return false;
    }
  }

  function isPdfSummariesPage() {
    try {
      return /\/(?:smart-summaries|resumos)/i.test(window.location.pathname);
    } catch (_) {
      return false;
    }
  }

  function flushPendingQgEvents() {
    try {
      if (isExtensionContextValid() && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'FLUSH_PENDING_QG_EVENTS' }).catch(() => {});
      }
    } catch (_) {}
  }

  function compactQuestionsForStorage(questions, maxItems = MAX_BUCKET_QUESTIONS) {
    if (!Array.isArray(questions)) return [];
    return questions.slice(0, maxItems).map((q, idx) => {
      if (!q || idx < 150) return q;
      const compacted = { ...q };
      if (typeof compacted.content === 'string' && compacted.content.length > 400) {
        compacted.content = compacted.content.slice(0, 400);
      }
      if (typeof compacted.teacherComment === 'string' && compacted.teacherComment.length > 500) {
        compacted.teacherComment = compacted.teacherComment.slice(0, 500);
      }
      if (Array.isArray(compacted.alternatives) && compacted.alternatives.length > 6) {
        compacted.alternatives = compacted.alternatives.slice(0, 6);
      }
      return compacted;
    });
  }

  let isDestroyed = false;
  let isStorageLoaded = false;
  let currentQuestionId = null;
  let timerSeconds = 0;
  let isTimerRunning = false;
  let timerInterval = null;
  let scanIntervalId = null;
  let domObserver = null;
  let promptDismissTimer = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;
  let scanDebounceTimer = null;
  let scrollRafId = null;

  // Cache em memória da lista de questões para evitar condição de corrida em escritas simultâneas
  let questionsCache = [];

  // Armazena o tempo individual de cada questão (permite rolar entre questões sem perder a contagem de cada uma)
  const questionTimers = new Map();
  // Rastreia questões já contabilizadas nesta sessão da página
  const processedInSession = new Set();
  // Rastreia questões nas quais o usuário REALMENTE clicou em "Responder"
  const pendingAnswerQIds = new Set();
  // Cache de questões já salvas no storage local do Chrome
  const savedQuestionIds = new Set();
  // Questões já salvas anteriormente que ainda não possuem o texto das alternativas
  const savedQuestionsMissingAlts = new Set();
  // Questões já respondidas cujos comentários do professor já tentamos auto-carregar silenciosamente
  const autoCommentAttemptedQIds = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    date: getTodaySessionDate(),
    total: 0,
    hits: 0,
    errors: 0
  };

  function getTodaySessionDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function normalizeSession(rawSession) {
    const today = getTodaySessionDate();
    if (!rawSession || rawSession.date !== today) {
      return {
        date: today,
        total: 0,
        hits: 0,
        errors: 0
      };
    }
    return {
      date: today,
      total: Number(rawSession.total) || 0,
      hits: Number(rawSession.hits) || 0,
      errors: Number(rawSession.errors) || 0
    };
  }

  function checkDailySessionReset() {
    const today = getTodaySessionDate();
    if (sessionStats.date !== today) {
      sessionStats = { date: today, total: 0, hits: 0, errors: 0 };
      if (isExtensionContextValid()) {
        chrome.storage.local.set({ [SESSION_KEY]: sessionStats });
      }
      updateHudStats();
    }
  }

  function isExtensionContextValid() {
    try {
      return !isDestroyed && Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local);
    } catch (_) {
      return false;
    }
  }

  let handleScrollUpdateRef = null;
  let handlePopstateHashRef = null;
  let handleDocumentClickRef = null;
  let handleDocumentKeydownRef = null;

  function teardownInstance() {
    isDestroyed = true;
    if (timerInterval) clearInterval(timerInterval);
    if (pdfTimerInterval) clearInterval(pdfTimerInterval);
    if (scanIntervalId) clearInterval(scanIntervalId);
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    if (promptDismissTimer) clearTimeout(promptDismissTimer);
    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = null;
    }
    if (domObserver) domObserver.disconnect();
    if (handleScrollUpdateRef) {
      window.removeEventListener('scroll', handleScrollUpdateRef, { capture: true });
      window.removeEventListener('wheel', handleScrollUpdateRef);
    }
    if (handlePopstateHashRef) {
      window.removeEventListener('popstate', handlePopstateHashRef);
      window.removeEventListener('hashchange', handlePopstateHashRef);
    }
    if (handleDocumentClickRef) {
      document.removeEventListener('click', handleDocumentClickRef, true);
    }
    if (handleDocumentKeydownRef) {
      document.removeEventListener('keydown', handleDocumentKeydownRef);
    }
    if (handleApiSnifferMessageRef) {
      window.removeEventListener('message', handleApiSnifferMessageRef);
    }
    destroyShadowHud();
  }

  window.addEventListener('qg-caveira-teardown', teardownInstance, { once: true });

  function loadInitialState() {
    if (!isExtensionContextValid()) return;
    try {
      chrome.storage.local.get(
        [STORAGE_KEY, SESSION_KEY, SCHEMA_KEY, GOAL_KEY, ACTIVE_USER_KEY, ACTIVE_USER_LABEL_KEY, PENDING_FILTER_KEY, LAST_FILTER_DIAG_KEY, TODAY_MISSION_KEY, SUBJECT_SPEEDS_KEY, FILTER_ID_MEMORY_KEY, FILTER_MEMORY_CLOUD_KEY],
        (res) => {
          if (chrome.runtime.lastError || isDestroyed) return;
          cachedActiveUserId = res?.[ACTIVE_USER_KEY] || null;
          cachedActiveUserLabel = res?.[ACTIVE_USER_LABEL_KEY] || '';
          if (res?.[TODAY_MISSION_KEY]) cachedTodayMission = res[TODAY_MISSION_KEY];
          if (res?.[SUBJECT_SPEEDS_KEY] && typeof res[SUBJECT_SPEEDS_KEY] === 'object') {
            cachedSubjectSpeeds = res[SUBJECT_SPEEDS_KEY];
          }
          // #56: Mescla memória de filtros vinda da nuvem sem perder seleções locais mais novas
          const cloudMem = res?.[FILTER_MEMORY_CLOUD_KEY];
          if (cloudMem && typeof cloudMem === 'object' && Object.keys(cloudMem).length > 0) {
            const localMem = (res?.[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === 'object')
              ? { ...res[FILTER_ID_MEMORY_KEY] }
              : {};
            let mergedChanged = false;
            Object.entries(cloudMem).forEach(([k, v]) => {
              if (!v || typeof v !== 'object') return;
              if (!localMem[k] || (Number(v.updatedAt) || 0) > (Number(localMem[k].updatedAt) || 0)) {
                localMem[k] = v;
                mergedChanged = true;
              }
            });
            if (mergedChanged) {
              chrome.storage.local.set({ [FILTER_ID_MEMORY_KEY]: localMem });
            }
          }
          updateHudUser();
          updateContextualHud();
        const savedDiag = res?.[LAST_FILTER_DIAG_KEY];
        if (savedDiag && savedDiag.savedAt && (Date.now() - savedDiag.savedAt) < 25000) {
          if (savedDiag.diagLog) lastFilterDiagnosticLog = savedDiag.diagLog;
          if (savedDiag.activePracticeFilter) activePracticeFilter = savedDiag.activePracticeFilter;
          if (savedDiag.bannerText) {
            filterStatusMessage = savedDiag.bannerText;
            renderFilterBanner(savedDiag.bannerText);
          }
          chrome.storage.local.remove([LAST_FILTER_DIAG_KEY]);
        }
        const pendingFilter = res?.[PENDING_FILTER_KEY];
        if (!isCoursePage() && pendingFilter && (pendingFilter.topic || (Array.isArray(pendingFilter.lessons) && pendingFilter.lessons.length > 0)) && (Date.now() - (pendingFilter.createdAt || 0)) < 180000) {
          setTimeout(() => applyCaveiraPracticeFilter(pendingFilter), 900);
        }
        if (res && res[GOAL_KEY]) {
          cachedDailyGoal = Number(res[GOAL_KEY]) || 50;
        }
        const today = getTodaySessionDate();
        if (res[SCHEMA_KEY] !== 'v3_strict_clean') {
          const cleanSession = { date: today, total: 0, hits: 0, errors: 0 };
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: cleanSession,
            [SCHEMA_KEY]: 'v3_strict_clean'
          });
          questionsCache = [];
          sessionStats = cleanSession;
          isStorageLoaded = true;
          updateHudStats();
          scanCards();
          return;
        }

        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        questionsCache = [...questions];
        questions.forEach(q => {
          if (q && q.id) {
            savedQuestionIds.add(q.id);
            if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every(a => !a.text || a.text === a.letter)) {
              savedQuestionsMissingAlts.add(q.id);
            }
          }
        });

        const rawSession = res[SESSION_KEY];
        sessionStats = normalizeSession(rawSession);
        if (!rawSession || rawSession.date !== today) {
          chrome.storage.local.set({ [SESSION_KEY]: sessionStats });
        }
        isStorageLoaded = true;
        updateHudStats();
        scanCards();
      });
    } catch (_) {}
  }

  loadInitialState();

  if (isExtensionContextValid() && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (!isExtensionContextValid()) {
          teardownInstance();
          return;
        }
        if (area === 'local') {
          if (changes[STORAGE_KEY]) {
            const updatedList = Array.isArray(changes[STORAGE_KEY].newValue) ? changes[STORAGE_KEY].newValue : [];
            questionsCache = [...updatedList];
            savedQuestionIds.clear();
            savedQuestionsMissingAlts.clear();
            updatedList.forEach(q => {
              if (q && q.id) {
                savedQuestionIds.add(q.id);
                if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every(a => !a.text || a.text === a.letter)) {
                  savedQuestionsMissingAlts.add(q.id);
                }
              }
            });
            for (const pId of Array.from(processedInSession)) {
              if (!savedQuestionIds.has(pId)) {
                processedInSession.delete(pId);
              }
            }
            if (currentQuestionId) {
              const activeCard = getQuestionCards().find(c => extractQuestionId(c) === currentQuestionId);
              renderQuestionHistory(currentQuestionId, activeCard ? isCardAnswered(activeCard) : false);
            }
          }
          if (changes[SESSION_KEY]) {
            sessionStats = normalizeSession(changes[SESSION_KEY].newValue);
            updateHudStats();
          }
          if (changes[ACTIVE_USER_KEY]) {
            cachedActiveUserId = changes[ACTIVE_USER_KEY].newValue || null;
            updateHudUser();
          }
          if (changes[ACTIVE_USER_LABEL_KEY]) {
            cachedActiveUserLabel = changes[ACTIVE_USER_LABEL_KEY].newValue || '';
            updateHudUser();
          }
          if (changes[GOAL_KEY]) {
            cachedDailyGoal = Number(changes[GOAL_KEY].newValue) || 50;
            updateHudGoal();
          }
          if (changes[TODAY_MISSION_KEY]) {
            cachedTodayMission = changes[TODAY_MISSION_KEY].newValue || null;
            updateContextualHud();
          }
          if (changes[SUBJECT_SPEEDS_KEY]) {
            cachedSubjectSpeeds = changes[SUBJECT_SPEEDS_KEY].newValue || {};
            updateContextualHud();
          }
        }
      });
    } catch (_) {}
  }

  if (isExtensionContextValid() && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.type === 'FORCE_SCAN_NOW') {
          scanCards();
          sendResponse({ ok: true });
        }
        if (msg && msg.type === 'APPLY_CAVEIRA_FILTER' && msg.payload) {
          applyCaveiraPracticeFilter(msg.payload);
          sendResponse({ ok: true });
        }
        if (msg && msg.type === 'PLAYER_VIDEO_ENDED') {
          showLessonCompletedBanner();
          sendResponse({ ok: true });
        }
      });
    } catch (_) {}
  }

  // Listener passivo do Sniffer de API (#2 — MAIN world -> Isolated world)
  function classifySubjectBloco(subjectName = '') {
    const s = normalizeFilterText(subjectName);
    if (!s) return 'Bloco I';
    if (/transito|ctb|contran|resolucao|habilitacao|sinalizacao/.test(s)) return 'Bloco II';
    if (/constitucional|administrativo|penal|processual|direitos humanos|legislacao especial|leis especiais/.test(s)) return 'Bloco III';
    return 'Bloco I';
  }

  handleApiSnifferMessageRef = (event) => {
    if (isDestroyed || event.source !== window) return;
    const msg = event.data;
    if (!msg || msg.source !== 'QG_CAVEIRA_API_SNIFFER') return;

    if (msg.type === 'API_COURSE_CATALOG' && msg.payload && Array.isArray(msg.payload.modules)) {
      const mergedMap = new Map();
      (Array.isArray(apiCourseCatalogCache?.modules) ? apiCourseCatalogCache.modules : []).forEach((m) => {
        if (!m || !m.name) return;
        const k = m.id ? `id:${m.id}` : `nm:${normalizeCourseIndexKey(m.name)}`;
        mergedMap.set(k, m);
      });
      msg.payload.modules.forEach((m) => {
        if (!m || !m.name) return;
        const k = m.id ? `id:${m.id}` : `nm:${normalizeCourseIndexKey(m.name)}`;
        const prevM = mergedMap.get(k);
        if (!prevM) {
          mergedMap.set(k, m);
          return;
        }
        const prevLessons = Array.isArray(prevM.lessons) ? prevM.lessons : [];
        const incLessons = Array.isArray(m.lessons) ? m.lessons : [];
        const byLes = new Map();
        prevLessons.forEach((l) => {
          if (l?.title) byLes.set(l.id ? `id:${l.id}` : normalizeCourseIndexKey(l.title), l);
        });
        incLessons.forEach((l) => {
          if (l?.title) {
            const lk = l.id ? `id:${l.id}` : normalizeCourseIndexKey(l.title);
            byLes.set(lk, { ...(byLes.get(lk) || {}), ...l });
          }
        });
        mergedMap.set(k, {
          ...prevM,
          ...m,
          moduleUrl: m.moduleUrl || prevM.moduleUrl || '',
          lessons: Array.from(byLes.values()),
        });
      });
      apiCourseCatalogCache = {
        courseId: msg.payload.courseId || apiCourseCatalogCache?.courseId || '',
        courseName: msg.payload.courseName || apiCourseCatalogCache?.courseName || 'Curso Caveira',
        modules: Array.from(mergedMap.values()),
      };
      return;
    }

    if (msg.type === 'API_QUESTION_DATA' && Array.isArray(msg.payload?.questions)) {
      msg.payload.questions.forEach((aq) => {
        if (!aq || !aq.id) return;
        const prevApi = apiQuestionCache.get(aq.id) || {};
        const mergedApi = { ...prevApi, ...aq };
        apiQuestionCache.set(aq.id, mergedApi);

        const existing = questionsCache.find((q) => q && q.id === aq.id);
        if (existing) {
          const needsComment = !existing.teacherComment && mergedApi.teacherComment;
          const needsStats = existing.communityCorrectPct === undefined && mergedApi.communityCorrectPct !== undefined;
          const needsNote = !existing.userNote && mergedApi.userNote;
          if (needsComment || needsStats || needsNote) {
            saveQuestion({
              ...existing,
              ...(needsComment ? { teacherComment: mergedApi.teacherComment, commentSource: mergedApi.commentSource || 'professor' } : {}),
              ...(needsStats ? { communityCorrectPct: mergedApi.communityCorrectPct, communityErrorPct: mergedApi.communityErrorPct } : {}),
              ...(needsNote ? { userNote: mergedApi.userNote } : {})
            }, true);
          }
        }
      });
      return;
    }

    if (msg.type === 'API_SIMULADOS_DATA' && Array.isArray(msg.payload?.simulados)) {
      const nextMap = new Map();
      apiSimuladosCache.forEach((s) => {
        if (s && !isRankingTitleOrRow('', s.title || '') && (s.caveiraId || s.title)) {
          nextMap.set(s.caveiraId || s.title, s);
        }
      });
      msg.payload.simulados.forEach((rawSim) => {
        if (!rawSim || isRankingTitleOrRow('', rawSim.title || '')) return;
        let b1 = 0; let b2 = 0; let b3 = 0; let hasBlocks = false;
        if (Array.isArray(rawSim.subjectScores) && rawSim.subjectScores.length > 0) {
          hasBlocks = true;
          rawSim.subjectScores.forEach((sc) => {
            const b = classifySubjectBloco(sc.name);
            const val = Number(sc.liquida) || ((Number(sc.hits) || 0) - (Number(sc.errors) || 0));
            if (b === 'Bloco I') b1 += val;
            else if (b === 'Bloco II') b2 += val;
            else b3 += val;
          });
        }
        const enriched = {
          ...rawSim,
          data: rawSim.data || getTodaySessionDate(),
          ...(hasBlocks ? { b1Liquida: b1, b2Liquida: b2, b3Liquida: b3 } : {})
        };
        const key = enriched.caveiraId || `${enriched.title}|${enriched.data}`;
        nextMap.set(key, enriched);
      });
      apiSimuladosCache = Array.from(nextMap.values());
      return;
    }

    if (msg.type === 'API_SUBJECT_TREE_DATA' && Array.isArray(msg.payload?.nodes) && msg.payload.nodes.length > 0) {
      if (isExtensionContextValid() && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'DB_MERGE_TREE_OVERLAY',
          payload: { nodes: msg.payload.nodes }
        }, (resp) => {
          if (!chrome.runtime?.lastError && resp?.added > 0) {
            cachedCaveiraTree = null;
          }
        });
      }
    }
  };
  window.addEventListener('message', handleApiSnifferMessageRef);
  try {
    window.postMessage({ source: 'QG_CAVEIRA_CONTENT', type: 'REQUEST_SNIFFER_REPLAY' }, '*');
    setTimeout(() => {
      if (!isDestroyed) {
        window.postMessage({ source: 'QG_CAVEIRA_CONTENT', type: 'REQUEST_SNIFFER_REPLAY' }, '*');
      }
    }, 800);
  } catch (_) {}

  // --- HELPERS DAS 15 INTEGRAÇÕES v2.0.0 (#1, #2, #27, #29, #30, #31) ---
  function resolveSubjectSpeedForContext(contextTitle = '') {
    if (!cachedSubjectSpeeds || typeof cachedSubjectSpeeds !== 'object') return 1;
    const normCtx = normalizeFilterText(contextTitle);
    const inferred = inferSubjectFromLessons([contextTitle], contextTitle) || '';
    const normInf = normalizeFilterText(inferred);
    for (const [subName, spd] of Object.entries(cachedSubjectSpeeds)) {
      const sNorm = normalizeFilterText(subName);
      if (!sNorm) continue;
      if ((normInf && (sNorm === normInf || sNorm.includes(normInf) || normInf.includes(sNorm))) ||
          (normCtx && (normCtx.includes(sNorm) || sNorm.includes(normCtx)))) {
        const num = Number(spd);
        if (Number.isFinite(num) && num >= 0.5 && num <= 4) return num;
      }
    }
    return 1;
  }

  function applySubjectVideoSpeedInPlayground() {
    if (!isCoursePlaygroundPage()) return;
    const lessonTitle = currentCourseIndexStatus?.lessonTitle || extractCourseLessonTitle() || document.title || '';
    const targetSpeed = resolveSubjectSpeedForContext(lessonTitle);
    const speedBadge = getHudEl('qg-hud-speed-badge');
    if (speedBadge) {
      if (targetSpeed !== 1) {
        speedBadge.style.display = 'inline-flex';
        speedBadge.textContent = `⚡ Velocidade QG: ${targetSpeed}x`;
      } else {
        speedBadge.style.display = 'none';
      }
    }

    // #1 + #28: Auto-seek no iframe mediadelivery.net quando ?t=<segundos> estiver na URL
    try {
      if (window.location.href !== lastSeekUrlApplied) {
        lastSeekUrlApplied = window.location.href;
        const seekParam = Number(new URLSearchParams(window.location.search || '').get('t'));
        if (Number.isFinite(seekParam) && seekParam > 0) {
          chrome.storage.local.set({ [PLAYER_SEEK_KEY]: { seconds: seekParam, savedAt: Date.now() } }, () => {
            if (chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({ type: 'SEEK_VIDEO_TO', payload: { seconds: seekParam } }).catch(() => {});
            }
          });
        }
      }
    } catch (_) {}

    // #1 + #30: Enviar velocidade para o iframe player_bridge.js via storage + runtime message
    if (targetSpeed !== lastPlaygroundSpeedApplied) {
      lastPlaygroundSpeedApplied = targetSpeed;
      try {
        chrome.storage.local.set({ [PLAYER_SPEED_KEY]: { speed: targetSpeed, updatedAt: Date.now() } }, () => {
          if (chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: 'APPLY_PLAYER_SPEED', payload: { speed: targetSpeed } }).catch(() => {});
          }
        });
      } catch (_) {}
    }

    try {
      document.querySelectorAll('video').forEach((v) => {
        if (v && Number.isFinite(targetSpeed) && Math.abs((v.playbackRate || 1) - targetSpeed) > 0.01) {
          v.playbackRate = targetSpeed;
        }
        if (v && !observedVideos.has(v)) {
          observedVideos.add(v);
          v.addEventListener('ended', () => {
            showLessonCompletedBanner();
          });
        }
      });
    } catch (_) {}
  }

  function showLessonCompletedBanner() {
    const banner = getHudEl('qg-hud-course-completed-banner');
    if (banner) {
      banner.style.display = 'flex';
    }
  }

  function detectCurrentPlaygroundLessonCompleted() {
    try {
      const videoId = new URLSearchParams(window.location.search || '').get('course_video_id') || '';
      const activeItems = Array.from(document.querySelectorAll('.q-item--active, [class*="active-lesson"], [class*="selected"], a[href*="course_video_id"]'))
        .filter((el) => !videoId || String(el.getAttribute('href') || el.innerHTML || '').includes(videoId));

      for (const el of activeItems) {
        const chk = el.querySelector('.q-checkbox[aria-checked="true"], input[type="checkbox"]:checked, .q-toggle[aria-checked="true"]');
        if (chk) return true;
        const icons = Array.from(el.querySelectorAll('.material-icons, i, svg'));
        if (icons.some((ic) => /check_circle|task_alt|done_all/i.test((ic.textContent || '') + ' ' + (ic.className || '')))) {
          return true;
        }
      }
      // Também verifica botão/toggle principal de "Concluir aula" na toolbar do player
      const toggleBtns = Array.from(document.querySelectorAll('.q-checkbox[aria-checked], .q-btn, button')).filter((el) => {
        if (el.closest('#qg-caveira-shadow-host, #qg-caveira-hud')) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent || '');
        return txt.includes('aula concluida') || txt.includes('concluida');
      });
      if (toggleBtns.some((b) => b.getAttribute('aria-checked') === 'true' || b.classList.contains('bg-positive') || /aula\s+concluida/.test(normalizeFilterText(b.innerText || '')))) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  function observeLessonCompletionOnPlayground() {
    if (!isCoursePlaygroundPage()) return;
    const key = window.location.href;
    const isNowCompleted = detectCurrentPlaygroundLessonCompleted();
    const prev = lessonCompletionStateByUrl.get(key);
    if (prev === false && isNowCompleted === true) {
      showLessonCompletedBanner();
    }
    lessonCompletionStateByUrl.set(key, isNowCompleted);
  }

  function scrapeCourseCatalogAndSync() {
    const modulesMap = new Map();
    const courseIdMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
    const modIdMatch = window.location.pathname.match(/\/modules\/(\d+)/i);
    const courseId = courseIdMatch ? courseIdMatch[1] : '12';
    const currentModId = modIdMatch ? modIdMatch[1] : '';
    const courseName = (document.querySelector('h1, h2, .text-h5, .text-h6')?.innerText || 'Curso Caveira PRF').trim();

    const activeModEl = document.querySelector('.q-item--active, [aria-selected="true"].q-item, [class*="module"].active, [class*="breadcrumb"] a:last-child');
    const activeModName = (activeModEl?.innerText || activeModEl?.textContent || '').split(/\r?\n/)[0]?.trim() || courseName;
    const defaultModuleUrl = (courseId && currentModId)
      ? `${window.location.origin}/courses/${courseId}/modules/${currentModId}/playground`
      : `${window.location.origin}/courses/${courseId}`;

    const lessonLinks = Array.from(document.querySelectorAll('a[href*="course_video_id"], a[href*="/modules/"], [data-course-video-id], .q-expansion-item, .q-item, .q-card'))
      .filter((el) => !el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') && isElementVisible(el));

    const lessons = [];
    const seenLessonKeys = new Set();

    // Captura a aula atualmente aberta no playground (caso esteja assistindo dentro de /playground)
    if (isCoursePlaygroundPage()) {
      const currentTitle = extractCourseLessonTitle() ||
        currentCourseIndexStatus?.lessonTitle ||
        (document.querySelector('h1, h2, .text-h6')?.innerText || '').trim();
      const curVidMatch = window.location.search.match(/course_video_id=(\d+)/i);
      if (currentTitle && currentTitle.length >= 3) {
        const curVid = curVidMatch?.[1] || '';
        const kCur = curVid ? `vid:${curVid}` : normalizeCourseIndexKey(currentTitle);
        seenLessonKeys.add(kCur);
        lessons.push({
          id: curVid || null,
          title: currentTitle,
          durationMin: 0,
          completed: detectCurrentPlaygroundLessonCompleted(),
          url: window.location.href,
        });
      }
    }

    lessonLinks.forEach((el) => {
      const href = el.getAttribute('href') || el.querySelector('a[href*="course_video_id"], a[href*="/modules/"]')?.getAttribute('href') || '';
      const modHrefMatch = href.match(/\/modules\/(\d+)/i);
      let videoId = el.getAttribute('data-course-video-id') || '';
      if (!videoId && href) {
        const m = href.match(/course_video_id=(\d+)/i);
        if (m) videoId = m[1];
      }
      const rawText = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!rawText || rawText.length < 4 || rawText.length > 220) return;

      const hasVideoIcon = Array.from(el.querySelectorAll('.material-icons, i')).some((i) =>
        /play_circle|ondemand_video|smart_display|play_arrow|videocam/i.test(i.textContent || '')
      );
      const isLessonItem = Boolean(videoId || /\d{1,2}:\d{2}/.test(rawText) || /\baula\b/i.test(rawText) || hasVideoIcon);

      // Card ou link de módulo inteiro (mesmo colapsado na tela /courses/:id)
      if (!isLessonItem && (modHrefMatch || (el.matches('.q-expansion-item, .q-card') && inferSubjectFromLessons([rawText], rawText)))) {
        const modHeading = (el.querySelector('h1, h2, h3, h4, .text-h6, .text-subtitle1, .q-item__label')?.innerText || rawText.split(/\n/)[0] || '').trim();
        if (modHeading.length >= 3 && modHeading.length <= 90) {
          const fullModUrl = href
            ? (href.startsWith('http') ? href : `${window.location.origin}${href.startsWith('/') ? '' : '/'}${href}`)
            : defaultModuleUrl;
          if (!modulesMap.has(modHeading)) {
            modulesMap.set(modHeading, {
              id: modHrefMatch?.[1] || null,
              name: modHeading,
              moduleUrl: fullModUrl,
              lessons: [],
            });
          }
        }
        return;
      }

      if (!isLessonItem) return;

      const durMatch = rawText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
      let durationMin = 0;
      if (durMatch) {
        durationMin = durMatch[3] !== undefined
          ? Math.round(Number(durMatch[1]) * 60 + Number(durMatch[2]) + Number(durMatch[3]) / 60)
          : Math.max(1, Math.round(Number(durMatch[1]) + Number(durMatch[2]) / 60));
      }
      const title = rawText
        .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, '')
        .replace(/\b(?:assistir|conclu[íi]da|play_arrow|play_circle|ondemand_video|smart_display|check_circle|done)\b/gi, '')
        .trim();
      if (!title || title.length < 3) return;
      const dedupKey = videoId ? `vid:${videoId}` : normalizeCourseIndexKey(title);
      if (seenLessonKeys.has(dedupKey)) return;
      seenLessonKeys.add(dedupKey);

      const completed = Boolean(
        el.querySelector('.q-checkbox[aria-checked="true"], input[type="checkbox"]:checked') ||
        Array.from(el.querySelectorAll('.material-icons, i')).some((i) => /check_circle|task_alt|done/i.test(i.textContent || ''))
      );
      const url = href
        ? (href.startsWith('http') ? href : `${window.location.origin}${href.startsWith('/') ? '' : '/'}${href}`)
        : (isCoursePlaygroundPage() ? window.location.href : defaultModuleUrl);

      lessons.push({ id: videoId || null, title, durationMin, completed, url });
    });

    // Mescla módulos capturados passivamente pela API (#2 — todos os módulos de 1 vez)
    const apiMods = Array.isArray(apiCourseCatalogCache?.modules) ? apiCourseCatalogCache.modules : [];
    apiMods.forEach((m) => {
      if (m && m.name && (Array.isArray(m.lessons) && (m.lessons.length > 0 || m.moduleUrl))) {
        modulesMap.set(m.name, m);
      }
    });
    if (lessons.length > 0) {
      const existingMod = modulesMap.get(activeModName);
      if (existingMod && Array.isArray(existingMod.lessons)) {
        const byTitle = new Map(existingMod.lessons.map(l => [normalizeCourseIndexKey(l.title), l]));
        lessons.forEach(l => {
          const k = normalizeCourseIndexKey(l.title);
          if (!byTitle.has(k)) byTitle.set(k, l);
        });
        modulesMap.set(activeModName, {
          ...existingMod,
          name: activeModName,
          moduleUrl: existingMod.moduleUrl || defaultModuleUrl,
          lessons: Array.from(byTitle.values())
        });
      } else {
        modulesMap.set(activeModName, { name: activeModName, moduleUrl: defaultModuleUrl, lessons });
      }
    }

    const totalLessonsCount = Array.from(modulesMap.values()).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    const payload = {
      courseId: apiCourseCatalogCache?.courseId || courseId,
      courseName: apiCourseCatalogCache?.courseName || courseName,
      modules: Array.from(modulesMap.values()),
      syncedAt: Date.now()
    };

    if (payload.modules.length > 0) {
      try {
        chrome.storage.local.set({ [PENDING_CATALOG_KEY]: payload }, () => {
          flushPendingQgEvents();
        });
      } catch (_) {}
    }

    return { modulesCount: payload.modules.length, lessonsCount: totalLessonsCount };
  }

  function isRankingTitleOrRow(text = '', title = '', isTableRow = false) {
    const cleanTitle = String(title || '').trim();
    const cleanText = String(text || '').trim();
    if (/^#?\d{1,5}\s*[º°ª]?$/.test(cleanTitle)) return true;
    if (/^caveira\s+\d{3,}$/i.test(cleanTitle)) return true;
    if (isTableRow && /^\s*#?\d{1,5}\s*[º°ª]\b/.test(cleanText)) return true;
    return false;
  }

  function isInsideRankingSection(el) {
    if (!el || typeof el.closest !== 'function') return false;
    const tableWrap = el.closest('table, .q-table__container');
    if (tableWrap) {
      const headerText = Array.from(tableWrap.querySelectorAll('thead th, .q-table__top'))
        .map((h) => (h.innerText || h.textContent || '').trim())
        .join(' ');
      if (/(?:posi[cç][aã]o|coloca[cç][aã]o|ranking|classifica[cç][aã]o|candidato|aluno|usu[aá]rio|apelido|nickname|p[oó]dio)/i.test(headerText)) {
        return true;
      }
    }
    return Boolean(el.closest('[class*="ranking" i], [id*="ranking" i], [class*="leaderboard" i], [class*="podium" i]'));
  }

  function scrapeSimuladosAndImport() {
    const cards = Array.from(document.querySelectorAll('.q-card, table tbody tr, .q-item'))
      .filter((el) => !el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') && isElementVisible(el));
    const results = [];
    const seen = new Set();

    // Prioriza simulados ricos vindos da API (com B1/B2/B3 quando disponíveis)
    apiSimuladosCache.forEach((sim) => {
      if (!sim || isRankingTitleOrRow('', sim.title || '', false)) return;
      const key = sim.caveiraId || `${sim.title}|${sim.data || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(sim);
    });

    cards.forEach((card, idx) => {
      if (isInsideRankingSection(card)) return;
      const text = (card.innerText || card.textContent || '').replace(/\n+/g, ' | ').replace(/\s+/g, ' ').trim();
      if (!text || text.length < 10) return;

      const href = card.getAttribute('href') || card.querySelector('a')?.getAttribute('href') || '';
      const hasSimuladoHref = /\/(?:practice-exams|personal-practice-exams|simulados)\/\d+/i.test(href);
      const isRow = card.matches('tr');
      if (isRow && !hasSimuladoHref && !/simulado|exame|prova|caderno|bloco|pessoal|turma/i.test(text)) {
        return;
      }
      if (!hasSimuladoHref && !/simulado|exame|prova|acertos|erros|desempenho|nota|gabarito|quest[oõ]es/i.test(text)) {
        return;
      }

      const scoreRatioMatch = text.match(/(\d{1,3})\s*(?:\/|de)\s*(\d{1,3})/i);
      const pctMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
      const hitsLabelMatch = text.match(/(?:acertos?|certas?)\s*[:-]?\s*(\d{1,3})/i);
      const errorsLabelMatch = text.match(/(?:erros?|erradas?)\s*[:-]?\s*(\d{1,3})/i);
      const netLabelMatch = text.match(/(?:nota\s*l[ií]quida|l[ií]quida|pontua[cç][aã]o|nota)\s*[:-]?\s*(-?\d{1,3}(?:[.,]\d+)?)/i);
      if (!scoreRatioMatch && !pctMatch && !hitsLabelMatch && !netLabelMatch) return;

      const hitsFromLabel = hitsLabelMatch ? Number(hitsLabelMatch[1]) : null;
      const errorsFromLabel = errorsLabelMatch ? Number(errorsLabelMatch[1]) : null;
      const netFromLabel = netLabelMatch ? Math.round(parseFloat(netLabelMatch[1].replace(',', '.'))) : null;

      let total = scoreRatioMatch ? Number(scoreRatioMatch[2]) : 120;
      if (!scoreRatioMatch && hitsFromLabel !== null && errorsFromLabel !== null && (hitsFromLabel + errorsFromLabel) > total) {
        total = hitsFromLabel + errorsFromLabel;
      }
      const hits = scoreRatioMatch
        ? Number(scoreRatioMatch[1])
        : hitsFromLabel !== null
        ? hitsFromLabel
        : pctMatch
        ? Math.round(((parseFloat(pctMatch[1].replace(',', '.')) || 0) / 100) * total)
        : Math.max(0, Math.round((total + (netFromLabel || 0)) / 2));
      if (!total || hits > total) return;

      const errors = errorsFromLabel !== null ? errorsFromLabel : Math.max(0, total - hits);
      const pct = pctMatch ? Math.round(parseFloat(pctMatch[1].replace(',', '.'))) : Math.round((hits / total) * 100);
      const liquida = netFromLabel !== null ? netFromLabel : (hits - errors);
      const dateMatch = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/) || text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      const dataStr = dateMatch
        ? (dateMatch[3] ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : dateMatch[1])
        : getTodaySessionDate();

      const parts = text.split('|').map(s => s.trim()).filter(s => s.length >= 4 && !/^\d{2}\/\d{2}\/\d{4}$/.test(s) && !/^\d+%$/.test(s));
      const title = (parts[0] || `Simulado Caveira #${idx + 1}`).slice(0, 90);
      if (isRankingTitleOrRow(text, title, isRow)) return;
      const idMatch = href.match(/(\d{2,})/);
      const caveiraId = idMatch ? `sim_${idMatch[1]}` : `sim_${normalizeCourseIndexKey(title).slice(0, 32)}_${dataStr}_${hits}`;
      if (seen.has(caveiraId)) return;
      seen.add(caveiraId);

      results.push({
        caveiraId,
        title,
        data: dataStr,
        total,
        hits,
        errors,
        pct,
        liquida,
        ...(href ? { url: href.startsWith('http') ? href : `${window.location.origin}${href}` } : {})
      });
    });

    // Fallback para página individual de resultado do simulado (onde título e métricas ficam em blocos separados)
    if (results.length === 0) {
      const container = document.querySelector('main, .q-page, body');
      if (container) {
        const clone = container.cloneNode(true);
        clone.querySelectorAll('#qg-caveira-shadow-host, #qg-caveira-hud, table, .q-table__container, [class*="ranking" i], [id*="ranking" i]').forEach((n) => n.remove());
        const summaryText = (clone.textContent || '').replace(/\s+/g, ' ').trim();
        const headingTitle = (document.querySelector('h1, h2, .text-h5, .text-h6')?.innerText || '').replace(/\s+/g, ' ').trim() || 'Simulado Caveira';
        if (!isRankingTitleOrRow(summaryText, headingTitle, false)) {
          const hitsM = summaryText.match(/(?:acertos?|certas?)\s*[:-]?\s*(\d{1,3})/i);
          const errM = summaryText.match(/(?:erros?|erradas?)\s*[:-]?\s*(\d{1,3})/i);
          const netM = summaryText.match(/(?:nota\s*l[ií]quida|l[ií]quida|pontua[cç][aã]o)\s*[:-]?\s*(-?\d{1,3}(?:[.,]\d+)?)/i);
          const pctM = summaryText.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
          const ratioM = summaryText.match(/(\d{1,3})\s*(?:\/|de)\s*(\d{1,3})/i);
          if (hitsM || netM || (pctM && /simulado|desempenho|exame/i.test(summaryText))) {
            const total = ratioM ? Number(ratioM[2]) : 120;
            const hits = hitsM ? Number(hitsM[1]) : ratioM ? Number(ratioM[1]) : pctM ? Math.round((parseFloat(pctM[1].replace(',', '.')) / 100) * total) : Math.max(0, Math.round((total + parseFloat(netM[1].replace(',', '.'))) / 2));
            const errors = errM ? Number(errM[1]) : Math.max(0, total - hits);
            const liquida = netM ? Math.round(parseFloat(netM[1].replace(',', '.'))) : (hits - errors);
            const pct = pctM ? Math.round(parseFloat(pctM[1].replace(',', '.'))) : Math.round((hits / total) * 100);
            const pathId = window.location.pathname.match(/(\d{2,})/);
            if (total > 0 && hits <= total) {
              results.push({
                caveiraId: pathId ? `sim_${pathId[1]}` : `sim_${normalizeCourseIndexKey(headingTitle).slice(0, 32)}_${getTodaySessionDate()}_${hits}`,
                title: headingTitle.slice(0, 90),
                data: getTodaySessionDate(),
                total,
                hits,
                errors,
                pct,
                liquida,
                url: window.location.href,
              });
            }
          }
        }
      }
    }

    if (results.length > 0) {
      try {
        chrome.storage.local.set({ [PENDING_SIMULADOS_KEY]: { simulados: results, savedAt: Date.now() } }, () => {
          flushPendingQgEvents();
        });
      } catch (_) {}
    }
    return results.length;
  }

  function startPdfTimerLoop() {
    if (pdfTimerInterval) return;
    pdfTimerInterval = setInterval(() => {
      if (isDestroyed) return;
      if (isPdfSummariesPage() && !document.hidden) {
        pdfReadingSeconds += 1;
        const timerEl = getHudEl('qg-pdf-timer-text');
        if (timerEl) {
          const m = Math.floor(pdfReadingSeconds / 60);
          const s = pdfReadingSeconds % 60;
          timerEl.textContent = `📄 Lendo PDF • ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      }
    }, 1000);
  }

  function updateContextualHud() {
    const ctxBox = getHudEl('qg-hud-contextual-actions');
    if (!ctxBox) return;

    const missionRow = getHudEl('qg-ctx-today-mission');
    const catalogRow = getHudEl('qg-ctx-course-catalog');
    const simRow = getHudEl('qg-ctx-simulados');
    const pdfRow = getHudEl('qg-ctx-pdf-tracker');

    let anyVisible = false;

    // #27 Missão de Hoje em /questions
    if (missionRow) {
      const subjects = Array.isArray(cachedTodayMission?.subjects) ? cachedTodayMission.subjects : [];
      if (isQuestionsPage() && subjects.length > 0) {
        const pending = subjects.filter(s => !s.completed);
        const list = pending.length > 0 ? pending : subjects;
        const picked = list[todayMissionIdx % list.length];
        const btn = getHudEl('qg-btn-today-mission');
        if (btn && picked) {
          btn.textContent = `⚡ Missão: ${picked.name}`;
          btn.title = picked.topic ? `${picked.name} → ${picked.topic}` : picked.name;
        }
        const nextBtn = getHudEl('qg-btn-today-next');
        if (nextBtn) nextBtn.style.display = list.length > 1 ? 'inline-flex' : 'none';
        missionRow.style.display = 'flex';
        anyVisible = true;
      } else {
        missionRow.style.display = 'none';
      }
    }

    // #1 Catálogo de Cursos em /courses/:id
    if (catalogRow) {
      if (isCourseCatalogPage()) {
        catalogRow.style.display = 'flex';
        anyVisible = true;
      } else {
        catalogRow.style.display = 'none';
      }
    }

    // #2 Importar Simulados em /teams e /personal-practice-exams
    if (simRow) {
      if (isSimuladosPage()) {
        simRow.style.display = 'flex';
        anyVisible = true;
      } else {
        simRow.style.display = 'none';
      }
    }

    // #31 Tracker de PDF em /smart-summaries
    if (pdfRow) {
      if (isPdfSummariesPage()) {
        startPdfTimerLoop();
        pdfRow.style.display = 'flex';
        anyVisible = true;
      } else {
        pdfRow.style.display = 'none';
      }
    }

    ctxBox.style.display = anyVisible ? 'flex' : 'none';
  }

  // --- 1. CRIAÇÃO DO HUD FLUTUANTE ---
  function createHud() {
    if (getHudEl('qg-caveira-hud')) return;

    const extVersion = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest)
      ? chrome.runtime.getManifest().version
      : '3.0.0';

    const hudInnerHtml = `
      <div class="qg-hud-header">
        <div class="qg-hud-title">
          <span class="qg-hud-pulse"></span>
          <span>💀 QG PRF • CAVEIRA <small style="opacity:0.65;font-size:9px;margin-left:3px;">v${extVersion}</small></span>
        </div>
        <div class="qg-hud-controls">
          <button type="button" class="qg-hud-btn-icon" id="qg-btn-toggle-search" title="Busca Offline (IndexedDB + MiniSearch)">🔍</button>
          <button type="button" class="qg-hud-btn-icon" id="qg-btn-min" title="Minimizar / Expandir">_</button>
        </div>
      </div>

      <div id="qg-hud-user-bar" style="display:flex;align-items:center;justify-content:space-between;padding:5px 14px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;font-weight:700;color:#94a3b8;">
        <span id="qg-hud-user-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🟡 Conecte sua conta no QG</span>
      </div>

      <div id="qg-hud-filter-banner" style="display:none;align-items:center;justify-content:space-between;gap:6px;padding:6px 14px;background:rgba(37,99,235,0.14);border-bottom:1px solid rgba(59,130,246,0.3);font-size:10px;font-weight:700;color:#bfdbfe;">
        <span id="qg-hud-filter-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">🎯 Filtro</span>
        <button type="button" id="qg-btn-copy-filter-log" style="background:rgba(15,23,42,0.85);color:#cbd5e1;border:1px solid rgba(148,163,184,0.35);border-radius:6px;padding:2px 6px;font-size:9px;font-weight:800;cursor:pointer;flex-shrink:0;" title="Copiar log diagnóstico do último filtro">📋 Log</button>
        <button type="button" id="qg-btn-refilter" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:2px 6px;font-size:9px;font-weight:800;cursor:pointer;flex-shrink:0;" title="Aplicar filtro novamente">🔄</button>
        <button type="button" id="qg-btn-close-filter" style="background:none;color:#94a3b8;border:none;font-size:11px;cursor:pointer;padding:0 2px;flex-shrink:0;" title="Fechar aviso">✕</button>
      </div>

      <div id="qg-hud-resolver-box" style="display:none;flex-direction:column;gap:6px;padding:8px 14px;background:rgba(245,158,11,0.12);border-bottom:1px solid rgba(245,158,11,0.35);font-size:10px;color:#fde68a;">
        <div id="qg-hud-resolver-title" style="font-weight:800;line-height:1.3;">⚠️ Selecione o assunto correto:</div>
        <div id="qg-hud-resolver-list" style="display:flex;flex-direction:column;gap:4px;max-height:150px;overflow-y:auto;"></div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
          <button type="button" id="qg-btn-apply-alt" style="background:#10b981;color:#052e16;border:none;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:800;cursor:pointer;flex:1;">Filtrar</button>
          <button type="button" id="qg-btn-legacy-dom" style="background:rgba(15,23,42,0.85);color:#cbd5e1;border:1px solid rgba(148,163,184,0.35);border-radius:6px;padding:4px 8px;font-size:9px;font-weight:700;cursor:pointer;" title="Usar preenchimento antigo via dropdown">Tentar modo antigo</button>
        </div>
      </div>

      <div class="qg-hud-body">
        <div class="qg-hud-stats-grid">
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Feitas</span>
            <span class="qg-hud-stat-value blue" id="qg-stat-total">${sessionStats.total}</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Certas</span>
            <span class="qg-hud-stat-value green" id="qg-stat-hits">${sessionStats.hits}</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Erradas</span>
            <span class="qg-hud-stat-value red" id="qg-stat-errors">${sessionStats.errors}</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Acerto</span>
            <span class="qg-hud-stat-value gold" id="qg-stat-net">${sessionStats.total > 0 ? Math.round((sessionStats.hits / sessionStats.total) * 100) : 0}%</span>
          </div>
        </div>

        <div class="qg-hud-goal-box" style="margin-top: 7px; margin-bottom: 7px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 5px 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 3px;">
            <span style="color: #94a3b8; display: flex; align-items: center; gap: 3px;">🎯 <span>Meta Diária</span></span>
            <span id="qg-hud-goal-ratio" style="color: #38bdf8;">${sessionStats.total} / ${cachedDailyGoal} (${Math.min(100, Math.round((sessionStats.total / cachedDailyGoal) * 100))}%)</span>
          </div>
          <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
            <div id="qg-hud-goal-bar" style="width: ${Math.min(100, Math.round((sessionStats.total / cachedDailyGoal) * 100))}%; height: 100%; background: linear-gradient(90deg, #0284c7, #10b981); border-radius: 999px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div class="qg-hud-current">
          <span id="qg-current-q-id">Aguardando questão...</span>
          <span class="qg-hud-timer" id="qg-timer">00:00</span>
        </div>

        <div id="qg-hud-course-actions" style="display:none;flex-direction:column;gap:5px;margin-top:8px;">
          <span id="qg-hud-speed-badge" style="display:none;align-self:flex-start;background:rgba(14,165,233,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.35);border-radius:6px;padding:2px 7px;font-size:9px;font-weight:900;text-transform:uppercase;">⚡ 1.5x</span>
          <div id="qg-hud-course-completed-banner" style="display:none;flex-direction:column;gap:5px;padding:7px 9px;border-radius:8px;background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.45);font-size:10px;font-weight:800;color:#6ee7b7;">
            <span>🎉 Aula concluída detectada!</span>
            <button type="button" id="qg-btn-banner-complete" style="width:100%;background:#10b981;color:#052e16;border:none;border-radius:6px;padding:5px 8px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">✅ Registrar Aula no QG Agora</button>
          </div>
          <button type="button" id="qg-btn-course-practice" style="width:100%;background:linear-gradient(90deg,#0284c7,#2563eb);color:#fff;border:none;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(2,132,199,0.3);">
            <span>🎯 Resolver Questões desta Aula</span>
          </button>
          <button type="button" id="qg-btn-course-complete" style="width:100%;background:rgba(16,185,129,0.14);color:#6ee7b7;border:1px solid rgba(16,185,129,0.35);border-radius:8px;padding:6px 10px;font-size:10px;font-weight:800;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
            <span>✅ Marcar Aula Assistida no QG</span>
          </button>
        </div>

        <div id="qg-hud-contextual-actions" style="display:none;flex-direction:column;gap:5px;margin-top:8px;">
          <div id="qg-ctx-today-mission" style="display:none;gap:4px;align-items:center;">
            <button type="button" id="qg-btn-today-mission" style="flex:1;background:linear-gradient(90deg,#0ea5e9,#0284c7);color:#fff;border:none;border-radius:8px;padding:6px 9px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">⚡ Missão de Hoje</button>
            <button type="button" id="qg-btn-today-next" style="background:rgba(14,165,233,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.35);border-radius:8px;padding:6px 8px;font-size:10px;font-weight:900;cursor:pointer;" title="Próxima matéria de hoje">↻</button>
          </div>
          <div id="qg-ctx-course-catalog" style="display:none;">
            <button type="button" id="qg-btn-sync-catalog" style="width:100%;background:rgba(14,165,233,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">🔄 Sincronizar Curso com QG</button>
          </div>
          <div id="qg-ctx-simulados" style="display:none;">
            <button type="button" id="qg-btn-import-simulados" style="width:100%;background:rgba(168,85,247,0.2);color:#e9d5ff;border:1px solid rgba(168,85,247,0.45);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">📊 Importar Simulados para o QG</button>
          </div>
          <div id="qg-ctx-pdf-tracker" style="display:none;flex-direction:column;gap:4px;padding:7px 9px;border-radius:8px;background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.35);">
            <span id="qg-pdf-timer-text" style="font-size:10px;font-weight:800;color:#5eead4;">📄 Lendo PDF • 00:00</span>
            <button type="button" id="qg-btn-log-pdf" style="width:100%;background:#14b8a6;color:#042f2e;border:none;border-radius:6px;padding:5px 8px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">✅ Registrar Estudo por PDF no QG</button>
          </div>
        </div>

        <div id="qg-hud-search-drawer" class="qg-offline-search-box" style="display: none;">
          <input type="search" id="qg-hud-search-input" class="qg-offline-search-input" placeholder="Buscar no banco integral (enunciado, bizu, lei)..." />
          <div id="qg-hud-search-results" class="qg-offline-search-results"></div>
        </div>

        <div id="qg-hud-history-box" style="display: none;"></div>
      </div>

      <div class="qg-hud-prompt" id="qg-prompt-box" style="display: none;">
        <div class="qg-prompt-title">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span id="qg-prompt-status-badge" class="qg-prompt-badge hit">ACERTO</span>
            <span>Autoavaliação Tática</span>
          </div>
          <button type="button" id="qg-prompt-close" style="background: none; border: none; color: #94a3b8; font-size: 13px; cursor: pointer; padding: 2px 6px; border-radius: 4px;">✕</button>
        </div>

        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 700;">CONFIANÇA (Dúvida/Chute vai p/ FSRS):</div>
        <div class="qg-prompt-buttons">
          <button class="qg-btn-tag" data-confidence="sabia">🎯 Sabia</button>
          <button class="qg-btn-tag" data-confidence="duvida" title="Envia para a fila de Revisão FSRS mesmo acertando">🤔 Dúvida</button>
          <button class="qg-btn-tag" data-confidence="chute" title="Envia para a fila de Revisão FSRS mesmo acertando">🎲 Chute</button>
          <button class="qg-btn-tag" id="qg-btn-priority" data-priority="true" title="Marcar para revisão urgente no FSRS do QG">🔥 Prioridade</button>
        </div>

        <div id="qg-error-reasons" style="display: none;">
          <div style="font-size: 10px; color: #ef4444; margin-bottom: 4px; font-weight: 700;">MOTIVO DO ERRO:</div>
          <div class="qg-prompt-buttons">
            <button class="qg-btn-tag" data-reason="conteudo">📚 Teoria</button>
            <button class="qg-btn-tag" data-reason="atencao">⚠️ Atenção</button>
            <button class="qg-btn-tag" data-reason="interpretacao">🔍 Enunciado</button>
          </div>
        </div>
      </div>

      <div class="qg-hud-footer">
        <a href="${QG_WEB_URL}" target="_blank" class="qg-btn-qg-link" id="qg-open-link">
          <span>Abrir Diagnóstico QG</span>
          <span>→</span>
        </a>
      </div>
    `;

    const mounted = mountShadowHud(hudInnerHtml);
    if (!mounted || !mounted.created || !mounted.hud) return;
    const hud = mounted.hud;
    updateHudUser();
    updateHudStats();
    renderFilterBanner();

    hud.querySelector('#qg-btn-copy-filter-log')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const payload = lastFilterDiagnosticLog
        ? JSON.stringify(lastFilterDiagnosticLog, null, 2)
        : JSON.stringify({ message: 'Nenhum filtro executado ainda nesta aba.', activePracticeFilter }, null, 2);
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(payload);
          copied = true;
        }
      } catch (_) {}
      if (!copied) {
        try {
          const ta = document.createElement('textarea');
          ta.value = payload;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          copied = document.execCommand('copy');
          ta.remove();
        } catch (_) {}
      }
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = copied ? '✅ Copiado' : '⚠️ Erro';
        setTimeout(() => {
          if (btn && btn.isConnected) btn.textContent = prev || '📋 Log';
        }, 1800);
      }
    });

    hud.querySelector('#qg-btn-refilter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePracticeFilter) applyCaveiraPracticeFilter(activePracticeFilter);
    });

    hud.querySelector('#qg-btn-close-filter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      activePracticeFilter = null;
      pendingResolverResult = null;
      filterStatusMessage = '';
      renderFilterBanner('');
      const box = hud.querySelector('#qg-hud-resolver-box');
      if (box) box.style.display = 'none';
    });

    hud.querySelector('#qg-btn-apply-alt')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const box = hud.querySelector('#qg-hud-resolver-box');
      if (!box || !pendingResolverResult) return;
      const checked = Array.from(box.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => Number(cb.getAttribute('data-subtopic-id')))
        .filter(n => Number.isFinite(n) && n > 0);
      if (checked.length === 0) return;

      const subjId = pendingResolverResult.subject?.id || Number(box.querySelector('input[type="checkbox"]:checked')?.getAttribute('data-subject-id'));
      if (!subjId) return;

      const selectedAlts = (pendingResolverResult.alternatives || []).filter(a => checked.includes(a.id));
      const picks = selectedAlts.map(a => ({ id: a.id, name: a.name, path: a.path || [a.name] }));

      if (activePracticeFilter) {
        saveFilterIdMemory(activePracticeFilter, {
          subjectId: subjId,
          subjectName: pendingResolverResult.subject?.name || activePracticeFilter.subject || '',
          ids: checked,
          picks
        });
      }
      if (lastFilterDiagnosticLog) {
        lastFilterDiagnosticLog.manualSelection = { subjectId: subjId, ids: checked, picks };
        lastFilterDiagnosticLog.ids = checked;
        lastFilterDiagnosticLog.picks = picks;
      }
      box.style.display = 'none';
      const summary = [pendingResolverResult.subject?.name || activePracticeFilter?.subject, activePracticeFilter?.topic].filter(Boolean).join(' • ');
      await navigateToCaveiraDeepLink(subjId, checked, `✅ Filtro aplicado (seleção manual): ${summary}`);
    });

    hud.querySelector('#qg-btn-legacy-dom')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = hud.querySelector('#qg-hud-resolver-box');
      if (box) box.style.display = 'none';
      if (activePracticeFilter) {
        applyCaveiraPracticeFilterLegacyDom(activePracticeFilter);
      }
    });

    hud.querySelector('#qg-btn-course-practice')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!currentCourseIndexStatus) return;
      const lessonTitle = currentCourseIndexStatus.lessonTitle || extractCourseLessonTitle() || '';
      const subtopics = Array.isArray(currentCourseIndexStatus.subtopics) ? currentCourseIndexStatus.subtopics : [];
      const rawIndexText = currentCourseIndexStatus.rawIndexText || '';
      const inferredSubject = inferSubjectFromLessons([lessonTitle], lessonTitle) || '';
      const filterData = {
        subject: inferredSubject,
        topic: lessonTitle,
        lessons: lessonTitle ? [lessonTitle] : [],
        fallbackTopic: lessonTitle,
        subtopics,
        rawIndexText,
        createdAt: Date.now()
      };
      try {
        chrome.storage.local.set({ [PENDING_FILTER_KEY]: filterData }, () => {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'OPEN_CAVEIRA_PRACTICE',
              payload: filterData
            }).catch(() => {});
          }
        });
      } catch (_) {}
    });

    hud.querySelector('#qg-btn-course-complete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const lessonTitle = currentCourseIndexStatus?.lessonTitle || extractCourseLessonTitle() || '';
      const subtopics = Array.isArray(currentCourseIndexStatus?.subtopics) ? currentCourseIndexStatus.subtopics : [];
      const rawIndexText = currentCourseIndexStatus?.rawIndexText || '';
      const inferredSubject = inferSubjectFromLessons([lessonTitle], lessonTitle) || '';
      const payload = {
        subject: inferredSubject,
        lessonTitle,
        subtopics,
        rawIndexText,
        url: window.location.href,
        requestedAt: Date.now()
      };
      try {
        chrome.storage.local.set({ qg_pending_course_completion: payload }, () => {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'OPEN_QG_LESSON_COMPLETE',
              payload
            }).catch(() => {});
          }
        });
      } catch (_) {}
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<span>✓ Enviado para o QG da PRF!</span>';
        setTimeout(() => {
          if (btn && btn.isConnected) btn.innerHTML = orig;
        }, 2000);
      }
    });

    hud.querySelector('#qg-btn-banner-complete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      hud.querySelector('#qg-btn-course-complete')?.click();
      const banner = getHudEl('qg-hud-course-completed-banner');
      if (banner) banner.style.display = 'none';
    });

    hud.querySelector('#qg-btn-today-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      todayMissionIdx += 1;
      updateContextualHud();
    });

    hud.querySelector('#qg-btn-today-mission')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const subjects = Array.isArray(cachedTodayMission?.subjects) ? cachedTodayMission.subjects : [];
      if (subjects.length === 0) return;
      const pending = subjects.filter(s => !s.completed);
      const list = pending.length > 0 ? pending : subjects;
      const picked = list[todayMissionIdx % list.length];
      if (picked) {
        applyCaveiraPracticeFilter({
          subject: picked.name,
          topic: picked.topic || '',
          lessons: picked.lesson ? [picked.lesson] : [],
          fallbackTopic: picked.topic || ''
        });
      }
    });

    hud.querySelector('#qg-btn-sync-catalog')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const res = scrapeCourseCatalogAndSync();
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = res.lessonsCount > 0
          ? `✓ ${res.modulesCount} mód. / ${res.lessonsCount} aulas enviadas!`
          : res.modulesCount > 0
          ? `✓ ${res.modulesCount} módulo(s) vinculados ao QG!`
          : '⚠️ Abra um curso/módulo no Caveira';
        setTimeout(() => {
          if (btn && btn.isConnected) btn.textContent = orig;
        }, 2500);
      }
    });

    hud.querySelector('#qg-btn-import-simulados')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const count = scrapeSimuladosAndImport();
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = count > 0
          ? `✓ ${count} simulado(s) enviado(s) ao QG!`
          : '⚠️ Nenhum simulado seu encontrado nesta tela';
        setTimeout(() => {
          if (btn && btn.isConnected) btn.textContent = orig;
        }, 2500);
      }
    });

    hud.querySelector('#qg-btn-log-pdf')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const mins = Math.max(1, Math.round(pdfReadingSeconds / 60));
      const heading = (document.querySelector('h1, h2, .text-h5, .text-h6')?.innerText || document.title || 'PDF Interativo Caveira').trim();
      const subject = inferSubjectFromLessons([heading], heading) || '';
      const logItem = { title: heading, subject, minutes: mins, url: window.location.href, loggedAt: Date.now() };
      try {
        chrome.storage.local.get([PENDING_PDF_KEY], (res) => {
          const prevArr = Array.isArray(res?.[PENDING_PDF_KEY]) ? res[PENDING_PDF_KEY] : [];
          chrome.storage.local.set({ [PENDING_PDF_KEY]: [...prevArr, logItem] }, () => {
            flushPendingQgEvents();
          });
        });
      } catch (_) {}
      pdfReadingSeconds = 0;
      const timerEl = getHudEl('qg-pdf-timer-text');
      if (timerEl) timerEl.textContent = '📄 Lendo PDF • 00:00';
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = `✓ +${mins} min enviados ao QG!`;
        setTimeout(() => {
          if (btn && btn.isConnected) btn.textContent = orig;
        }, 2200);
      }
    });

    updateContextualHud();

    const btnMin = hud.querySelector('#qg-btn-min');
    btnMin.addEventListener('click', (e) => {
      e.stopPropagation();
      hud.classList.toggle('minimized');
      btnMin.textContent = hud.classList.contains('minimized') ? '□' : '_';
    });

    const btnToggleSearch = hud.querySelector('#qg-btn-toggle-search');
    const searchDrawer = hud.querySelector('#qg-hud-search-drawer');
    const searchInput = hud.querySelector('#qg-hud-search-input');
    const searchResults = hud.querySelector('#qg-hud-search-results');
    if (btnToggleSearch && searchDrawer && searchInput && searchResults) {
      let hudSearchTimer = null;
      btnToggleSearch.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hud.classList.contains('minimized')) {
          hud.classList.remove('minimized');
          btnMin.textContent = '_';
        }
        const isOpen = searchDrawer.style.display === 'flex';
        searchDrawer.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) setTimeout(() => searchInput.focus(), 40);
      });
      searchInput.addEventListener('click', (e) => e.stopPropagation());
      searchInput.addEventListener('keydown', (e) => e.stopPropagation());
      searchInput.addEventListener('input', () => {
        clearTimeout(hudSearchTimer);
        const query = searchInput.value.trim();
        if (!query) {
          searchResults.textContent = '';
          return;
        }
        hudSearchTimer = setTimeout(() => {
          if (!isExtensionContextValid() || !chrome.runtime?.sendMessage) return;
          chrome.runtime.sendMessage({
            type: 'DB_SEARCH_QUESTIONS',
            payload: { query, userId: cachedActiveUserId || null, limit: 15 }
          }, (resp) => {
            if (chrome.runtime?.lastError || isDestroyed) return;
            searchResults.textContent = '';
            const rows = Array.isArray(resp?.results) ? resp.results : [];
            if (rows.length === 0) {
              const emptyEl = document.createElement('div');
              emptyEl.style.cssText = 'color:#94a3b8;font-size:10px;padding:4px 2px;';
              emptyEl.textContent = 'Nenhum resultado encontrado.';
              searchResults.appendChild(emptyEl);
              return;
            }
            rows.forEach((r) => {
              const card = document.createElement('div');
              card.className = 'qg-offline-search-item';
              const head = document.createElement('div');
              head.className = 'qg-offline-search-head';
              const tag = document.createElement('span');
              tag.style.color = r.hit ? '#10b981' : '#ef4444';
              tag.textContent = `${r.hit ? '✓' : '✗'} ${r.id} • ${r.canonicalSubject || r.subject || 'PRF'}`;
              head.appendChild(tag);
              const body = document.createElement('div');
              body.style.color = '#cbd5e1';
              const preview = r.userNote ? `💡 ${r.userNote}` : String(r.content || '').slice(0, 120);
              body.textContent = preview + (preview.length >= 120 ? '...' : '');
              card.appendChild(head);
              card.appendChild(body);
              searchResults.appendChild(card);
            });
          });
        }, 140);
      });
    }

    hud.addEventListener('click', () => {
      if (hud.classList.contains('minimized')) {
        hud.classList.remove('minimized');
        btnMin.textContent = '_';
      }
    });

    hud.querySelector('#qg-prompt-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPrompt();
    });

    hud.querySelectorAll('[data-confidence]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.querySelectorAll('[data-confidence]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          const conf = btn.dataset.confidence;
          activeQuestionData.confidence = conf;
          activeQuestionData.fsrsRequested = (conf === 'chute' || conf === 'duvida');
          saveQuestion(activeQuestionData, true);
          const badge = getHudEl('qg-prompt-status-badge');
          if (badge && activeQuestionData.hit && (conf === 'chute' || conf === 'duvida')) {
            badge.textContent = '🃏 +FSRS AGENDADO';
          }
          if (activeQuestionData.hit) {
            setTimeout(dismissPrompt, 650);
          }
        }
      });
    });

    hud.querySelector('#qg-btn-priority')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const isNowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', isNowActive);
      if (activeQuestionData) {
        activeQuestionData.priorityReview = isNowActive;
        if (isNowActive) activeQuestionData.fsrsRequested = true;
        saveQuestion(activeQuestionData, true);
        const badge = getHudEl('qg-prompt-status-badge');
        if (badge && isNowActive) {
          badge.textContent = '🔥 REVISÃO PRIORITÁRIA';
        }
      }
    });

    hud.querySelectorAll('[data-reason]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.querySelectorAll('[data-reason]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          activeQuestionData.errorReason = btn.dataset.reason;
          saveQuestion(activeQuestionData, true);
          setTimeout(dismissPrompt, 500);
        }
      });
    });

    startTimerInterval();
  }

  // --- 2. CRONÔMETRO POR QUESTÃO ---
  function normalizeFilterText(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function renderFilterBanner(customText = '') {
    const banner = getHudEl('qg-hud-filter-banner');
    const textEl = getHudEl('qg-hud-filter-text');
    if (!banner || !textEl) return;
    if (customText !== undefined && customText !== null && customText !== '') {
      filterStatusMessage = customText;
    }
    if (activePracticeFilter && (activePracticeFilter.topic || activePracticeFilter.subject)) {
      const baseLabel = [activePracticeFilter.subject, activePracticeFilter.topic].filter(Boolean).join(' • ');
      const displayLabel = filterStatusMessage || `🎯 ${baseLabel}`;
      textEl.textContent = displayLabel;
      textEl.title = baseLabel;
      banner.style.display = 'flex';
    } else {
      filterStatusMessage = '';
      banner.style.display = 'none';
    }
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || '1') > 0;
  }

  function setNativeInputValue(input, value) {
    if (!input) return;
    const proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
    const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
    if (descriptor && typeof descriptor.set === 'function') {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
    try {
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
    } catch (_) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  function sleepMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clickElementRealistically(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch (_) {}
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + Math.min(rect.width / 2, 16);
    const clientY = rect.top + rect.height / 2;
    const evtInit = { bubbles: true, cancelable: true, view: window, clientX, clientY };
    try { el.dispatchEvent(new PointerEvent('pointerdown', evtInit)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('mousedown', evtInit)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('mouseup', evtInit)); } catch (_) {}
    el.click();
  }

  function findCheckboxInRowOrParent(rowEl) {
    if (!rowEl) return null;
    const selector = 'input[type="checkbox"], [role="checkbox"], .q-checkbox, .q-checkbox__inner';
    const direct = rowEl.querySelector(selector);
    if (direct) return direct;
    const parent = rowEl.parentElement;
    if (parent && normalizeFilterText(parent.innerText || parent.textContent) === normalizeFilterText(rowEl.innerText || rowEl.textContent)) {
      return parent.querySelector(selector);
    }
    return null;
  }

  function isOptionRowChecked(rowEl) {
    if (!rowEl) return false;
    const checkboxChild = rowEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox__inner') || findCheckboxInRowOrParent(rowEl);
    return Boolean(
      rowEl.getAttribute('aria-checked') === 'true' ||
      rowEl.getAttribute('aria-selected') === 'true' ||
      rowEl.getAttribute('data-state') === 'checked' ||
      rowEl.classList.contains('q-checkbox--truthy') ||
      (checkboxChild && (
        checkboxChild.checked === true ||
        checkboxChild.getAttribute('aria-checked') === 'true' ||
        checkboxChild.classList.contains('q-checkbox--truthy') ||
        checkboxChild.classList.contains('q-checkbox__inner--truthy')
      ))
    );
  }

  function clickOptionRow(rowEl) {
    if (!rowEl) return;
    if (isOptionRowChecked(rowEl)) return;
    const checkboxChild = rowEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox__inner') || findCheckboxInRowOrParent(rowEl);
    const target = checkboxChild || rowEl;
    clickElementRealistically(target);
  }

  const GENERIC_MATCH_WORDS = new Set([
    'legislacao',
    'direito',
    'direitos',
    'nocao',
    'nocoes',
    'codigo',
    'codigos',
    'lei',
    'leis',
    'lingua',
    'linguas',
    'estatuto',
    'estatutos',
    'curso',
    'cursos',
    'conhecimento',
    'conhecimentos',
    'administracao',
    'administrativo',
    'administrativa',
    'administrativos',
    'administrativas',
    'processo',
    'processos',
    'geral',
    'gerais',
    'publica',
    'publico',
    'publicas',
    'publicos',
    'crime',
    'crimes',
    'contra',
    'sobre',
    'entre',
    'para',
    'pelo',
    'pela',
    'pelos',
    'pelas',
    'com',
    'sem',
    'dos',
    'das',
    'nos',
    'nas',
    'uma',
    'uns',
    'umas',
    'parte',
    'partes',
    'aula',
    'aulas',
    'modulo',
    'modulos',
    'bloco',
    'blocos',
    'definicao',
    'definicoes',
    'conceito',
    'conceitos',
    'introducao',
    'aspecto',
    'aspectos',
    'estudo',
    'classificacao',
    'tipo',
    'tipos',
    'especie',
    'especies',
    'inicial',
    'iniciais',
    'basico',
    'basica',
    'basicos',
    'basicas',
    'acerca',
    'tema',
    'temas',
    'topico',
    'topicos',
    'assunto',
    'assuntos',
    'capitulo',
    'capitulos',
    'secao',
    'secoes',
    'resumo',
    'visao',
    'quadro',
    'esquema',
    'tabela',
    'observacao',
    'observacoes',
    'importante',
    'importantes',
    'diferenca',
    'diferencas',
    'distincao',
    'comparacao',
    'comparativo'
  ]);

  const CONCEPT_STOP_WORDS = new Set([
    'x', 'vs', 'versus', 'e', 'ou', 'de', 'da', 'do', 'dos', 'das',
    'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem',
    'sobre', 'entre', 'ao', 'aos', 'as', 'os', 'um', 'uma'
  ]);

  let stemmedGenericMatchWordsCache = null;
  function getStemmedGenericMatchWords() {
    if (!stemmedGenericMatchWordsCache) {
      stemmedGenericMatchWordsCache = new Set();
      for (const gw of GENERIC_MATCH_WORDS) {
        stemmedGenericMatchWordsCache.add(gw);
        const st = normalizeStemText(gw);
        if (st) {
          for (const sw of st.split(' ')) {
            if (sw) stemmedGenericMatchWordsCache.add(sw);
          }
        }
      }
    }
    return stemmedGenericMatchWordsCache;
  }

  function extractConceptWords(str) {
    const rawNorm = normalizeFilterText(String(str || ''))
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (!rawNorm) return [];
    const genericStems = getStemmedGenericMatchWords();
    const seen = new Set();
    const result = [];
    for (const rawWord of rawNorm.split(/\s+/)) {
      if (!rawWord) continue;
      if (CONCEPT_STOP_WORDS.has(rawWord) || GENERIC_MATCH_WORDS.has(rawWord)) continue;
      const stemmed = normalizeStemText(rawWord).trim() || rawWord;
      if (!stemmed || stemmed.length < 3) continue;
      if (CONCEPT_STOP_WORDS.has(stemmed) || genericStems.has(stemmed)) continue;
      if (!seen.has(stemmed)) {
        seen.add(stemmed);
        result.push(stemmed);
      }
    }
    return result;
  }

  const CONFLICTING_QUALIFIER_FAMILIES = [
    ['estadual'],
    ['municipal'],
    ['distrital', 'distrito'],
    ['eleitoral'],
    ['tributario', 'tributaria'],
    ['previdenciario', 'previdenciaria'],
    ['trabalhista'],
    ['mulher', 'mulheres', 'maria', 'penha', '11340', 'feminicidio']
  ];

  const SPECIAL_LAW_RULES = [
    {
      id: 'eca',
      lawDigits: '8069',
      test: (norm) =>
        /\beca\b/.test(norm) ||
        norm.includes('crianca e do adolescente') ||
        norm.includes('crianca e o adolescente') ||
        norm.includes('estatuto da crianca') ||
        norm.includes('8.069') ||
        norm.includes('8069'),
      terms: [
        '8.069',
        'estatuto da crianca',
        'estatuto da crianca e do adolescente',
        'eca',
        'crianca e do adolescente',
        '8069'
      ]
    },
    {
      id: 'henry_borel',
      lawDigits: '14344',
      test: (norm) =>
        norm.includes('henry borel') ||
        norm.includes('14.344') ||
        norm.includes('14344'),
      terms: ['14.344', 'henry borel', 'lei henry borel', '14344']
    },
    {
      id: 'escuta_especializada',
      lawDigits: '13431',
      test: (norm) =>
        norm.includes('escuta especializada') ||
        norm.includes('depoimento especial') ||
        norm.includes('13.431') ||
        norm.includes('13431'),
      terms: ['13.431', 'escuta especializada', 'depoimento especial', '13431']
    },
    {
      id: 'drogas',
      lawDigits: '11343',
      test: (norm) =>
        /\bdrogas?\b|\bsisnad\b|entorpecente/.test(norm) ||
        norm.includes('11.343') ||
        norm.includes('11343'),
      terms: ['11.343', 'lei de drogas', 'drogas', 'sisnad', '11343']
    },
    {
      id: 'desarmamento',
      lawDigits: '10826',
      test: (norm) =>
        norm.includes('desarmamento') ||
        /\barmas?\b/.test(norm) ||
        norm.includes('sinarm') ||
        norm.includes('10.826') ||
        norm.includes('10826'),
      terms: ['10.826', 'estatuto do desarmamento', 'desarmamento', 'arma de fogo', '10826']
    },
    {
      id: 'abuso_autoridade',
      lawDigits: '13869',
      test: (norm) =>
        norm.includes('abuso de autoridade') ||
        norm.includes('13.869') ||
        norm.includes('13869'),
      terms: ['13.869', 'abuso de autoridade', '13869']
    },
    {
      id: 'tortura',
      lawDigits: '9455',
      test: (norm) =>
        norm.includes('tortura') ||
        norm.includes('9.455') ||
        norm.includes('9455'),
      terms: ['9.455', 'tortura', 'lei de tortura', 'crimes de tortura', '9455']
    },
    {
      id: 'hediondos',
      lawDigits: '8072',
      test: (norm) =>
        norm.includes('hediondo') ||
        norm.includes('8.072') ||
        norm.includes('8072'),
      terms: ['8.072', 'crimes hediondos', 'hediondos', '8072']
    },
    {
      id: 'orcrim',
      lawDigits: '12850',
      test: (norm) =>
        norm.includes('organizacao criminosa') ||
        norm.includes('organizacoes criminosas') ||
        /\borcrim\b/.test(norm) ||
        norm.includes('12.850') ||
        norm.includes('12850'),
      terms: ['12.850', 'organizacoes criminosas', 'organizacao criminosa', '12850']
    },
    {
      id: 'maria_da_penha',
      lawDigits: '11340',
      test: (norm) =>
        norm.includes('maria da penha') ||
        (norm.includes('violencia domestica') && /\bmulher(?:es)?\b/.test(norm)) ||
        norm.includes('feminicidio') ||
        norm.includes('11.340') ||
        norm.includes('11340'),
      terms: [
        '11.340',
        'maria da penha',
        'lei maria da penha',
        'violencia domestica e familiar contra a mulher',
        '11340'
      ]
    },
    {
      id: 'crimes_ambientais',
      lawDigits: '9605',
      test: (norm) =>
        norm.includes('meio ambiente') ||
        norm.includes('ambienta') ||
        norm.includes('9.605') ||
        norm.includes('9605'),
      terms: ['9.605', 'crimes ambientais', 'lei ambiental', 'meio ambiente', '9605']
    },
    {
      id: 'interceptacao',
      lawDigits: '9296',
      test: (norm) =>
        norm.includes('interceptacao') ||
        norm.includes('9.296') ||
        norm.includes('9296'),
      terms: ['9.296', 'interceptacao telefonica', '9296']
    },
    {
      id: 'jecrim',
      lawDigits: '9099',
      test: (norm) =>
        norm.includes('juizado') ||
        /\bjecrim\b/.test(norm) ||
        norm.includes('9.099') ||
        norm.includes('9099'),
      terms: ['9.099', 'juizados especiais', 'juizado especial', 'jecrim', '9099']
    },
    {
      id: 'lavagem',
      lawDigits: '9613',
      test: (norm) =>
        norm.includes('lavagem') ||
        norm.includes('9.613') ||
        norm.includes('9613'),
      terms: ['9.613', 'lavagem de dinheiro', 'lavagem de capitais', '9613']
    },
    {
      id: 'racismo',
      lawDigits: '7716',
      test: (norm) =>
        norm.includes('racismo') ||
        norm.includes('7.716') ||
        norm.includes('7716'),
      terms: ['7.716', 'racismo', 'crimes de racismo', '7716']
    },
    {
      id: 'lep',
      lawDigits: '7210',
      test: (norm) =>
        /\blep\b/.test(norm) ||
        norm.includes('execucao penal') ||
        norm.includes('7.210') ||
        norm.includes('7210'),
      terms: ['7.210', 'execucao penal', 'lei de execucao penal', 'lep', '7210']
    },
    {
      id: 'prisao_temporaria',
      lawDigits: '7960',
      test: (norm) =>
        norm.includes('prisao temporaria') ||
        norm.includes('7.960') ||
        norm.includes('7960'),
      terms: ['7.960', 'prisao temporaria', '7960']
    },
    {
      id: 'idoso',
      lawDigits: '10741',
      test: (norm) =>
        norm.includes('idoso') ||
        norm.includes('pessoa idosa') ||
        norm.includes('10.741') ||
        norm.includes('10741'),
      terms: ['10.741', 'estatuto do idoso', 'estatuto da pessoa idosa', '10741']
    },
    {
      id: 'anticrime',
      lawDigits: '13964',
      test: (norm) =>
        norm.includes('pacote anticrime') ||
        /\banticrime\b/.test(norm) ||
        norm.includes('13.964') ||
        norm.includes('13964'),
      terms: ['13.964', 'pacote anticrime', '13964']
    },
    {
      id: 'igualdade_racial',
      lawDigits: '12288',
      test: (norm) =>
        norm.includes('igualdade racial') ||
        norm.includes('12.288') ||
        norm.includes('12288'),
      terms: ['12.288', 'estatuto da igualdade racial', 'igualdade racial', '12288']
    },
    {
      id: 'pcd',
      lawDigits: '13146',
      test: (norm) =>
        norm.includes('pessoa com deficiencia') ||
        /\blbi\b/.test(norm) ||
        norm.includes('13.146') ||
        norm.includes('13146'),
      terms: ['13.146', 'estatuto da pessoa com deficiencia', 'pessoa com deficiencia', '13146']
    },
    {
      id: 'ctb',
      lawDigits: '9503',
      test: (norm) =>
        /\bctb\b/.test(norm) ||
        norm.includes('codigo de transito') ||
        norm.includes('9.503') ||
        norm.includes('9503'),
      terms: ['9.503', 'codigo de transito brasileiro', 'ctb', '9503']
    },
    {
      id: 'lia',
      lawDigits: '8429',
      test: (norm) =>
        /\blia\b/.test(norm) ||
        norm.includes('improbidade administrativa') ||
        norm.includes('8.429') ||
        norm.includes('8429'),
      terms: ['8.429', 'improbidade administrativa', 'lei de improbidade administrativa', '8429']
    }
  ];

  function normalizeStemText(str) {
    return normalizeFilterText(str)
      .replace(/[()[\],;:!?"'“”]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => {
        if (w.length >= 5 && w.endsWith('ais')) return `${w.slice(0, -3)}al`;
        if (w.length >= 5 && (w.endsWith('oes') || w.endsWith('aes'))) return `${w.slice(0, -3)}ao`;
        if (w.length >= 5 && w.endsWith('res')) return w.slice(0, -2);
        if (w.length >= 4 && w.endsWith('ns')) return `${w.slice(0, -2)}m`;
        if (w.length >= 4 && w.endsWith('s')) return w.slice(0, -1);
        return w;
      })
      .join(' ');
  }

  function isOnlyGenericWords(phrase) {
    const tokens = normalizeFilterText(phrase).split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.length === 0) return true;
    return tokens.every(w => {
      if (w.length <= 2) return true;
      const stem = normalizeStemText(w);
      return GENERIC_MATCH_WORDS.has(w) || (stem && GENERIC_MATCH_WORDS.has(stem));
    });
  }

  function restoreCommonPortugueseAccents(str) {
    const raw = String(str || '').trim();
    if (!raw) return '';
    const wordMap = {
      crianca: 'criança',
      criancas: 'crianças',
      lingua: 'língua',
      portugues: 'português',
      raciocinio: 'raciocínio',
      logico: 'lógico',
      logica: 'lógica',
      matematica: 'matemática',
      fisica: 'física',
      etica: 'ética',
      geopolitica: 'geopolítica',
      informatica: 'informática',
      transito: 'trânsito',
      codigo: 'código',
      publico: 'público',
      publica: 'pública',
      publicos: 'públicos',
      publicas: 'públicas',
      orgao: 'órgão',
      orgaos: 'órgãos',
      juridico: 'jurídico',
      juridica: 'jurídica',
      politico: 'político',
      politica: 'política',
      economico: 'econômico',
      economica: 'econômica',
      tributario: 'tributário',
      tributaria: 'tributária',
      previdenciario: 'previdenciário',
      previdenciaria: 'previdenciária',
      inquerito: 'inquérito',
      ilicito: 'ilícito',
      ilicitos: 'ilícitos',
      unico: 'único',
      unica: 'única',
      numero: 'número',
      veiculo: 'veículo',
      veiculos: 'veículos',
      servico: 'serviço',
      servicos: 'serviços',
      comercio: 'comércio',
      exercicio: 'exercício',
      exercicios: 'exercícios',
      beneficio: 'benefício',
      beneficios: 'benefícios',
      principio: 'princípio',
      principios: 'princípios',
      seguranca: 'segurança',
      violencia: 'violência',
      domestica: 'doméstica',
      domestico: 'doméstico',
      estatistica: 'estatística',
      tecnica: 'técnica',
      tecnico: 'técnico',
      pratica: 'prática',
      pratico: 'prático',
      mecanica: 'mecânica',
      cinematica: 'cinemática',
      dinamica: 'dinâmica',
      telefonica: 'telefônica',
      nao: 'não',
      sao: 'são',
      familia: 'família',
      saude: 'saúde',
      medio: 'médio',
      media: 'média',
      historia: 'história',
      memoria: 'memória',
      materia: 'matéria',
      patrimonio: 'patrimônio',
      homicidio: 'homicídio',
      suicidio: 'suicídio',
      auxilio: 'auxílio',
      justica: 'justiça',
      forca: 'força',
      licenca: 'licença',
      rodoviario: 'rodoviário',
      rodoviaria: 'rodoviária',
      extraordinario: 'extraordinário',
      extraordinaria: 'extraordinária',
      sumario: 'sumário',
      sumaria: 'sumária',
      ordinario: 'ordinário',
      ordinaria: 'ordinária',
      policia: 'polícia',
      judiciaria: 'judiciária',
      discricionaria: 'discricionária',
      temporaria: 'temporária',
      necessaria: 'necessária',
      subsidiaria: 'subsidiária',
      solidaria: 'solidária',
      estatutaria: 'estatutária',
      hierarquico: 'hierárquico',
      hierarquica: 'hierárquica',
      especie: 'espécie',
      especies: 'espécies',
      proprio: 'próprio',
      propria: 'própria',
      proprios: 'próprios',
      proprias: 'próprias',
      ministerio: 'ministério',
      ministerios: 'ministérios',
      consorcio: 'consórcio',
      consorcios: 'consórcios',
      sumula: 'súmula',
      sumulas: 'súmulas',
      eletronico: 'eletrônico',
      eletronica: 'eletrônica',
      virus: 'vírus',
      dominio: 'domínio',
      analise: 'análise',
      combinatoria: 'combinatória',
      fonetica: 'fonética',
      semantica: 'semântica',
      concordancia: 'concordância',
      adverbio: 'advérbio',
      adverbios: 'advérbios',
      periodo: 'período',
      genero: 'gênero',
      generos: 'gêneros',
      sinonimos: 'sinônimos',
      antonimos: 'antônimos',
      homonimos: 'homônimos',
      paronimos: 'parônimos',
      politicos: 'políticos',
      politicas: 'políticas',
      democraticas: 'democráticas',
      fe: 'fé',
      reu: 'réu',
      juizo: 'juízo'
    };

    return raw
      .split(/\s+/)
      .map(token => {
        const lower = token.toLowerCase();
        if (wordMap[lower]) return wordMap[lower];
        if (/^[a-z]+cao$/.test(lower)) return `${lower.slice(0, -3)}ção`;
        if (/^[a-z]+coes$/.test(lower)) return `${lower.slice(0, -4)}ções`;
        if (/^[a-z]{2,}sao$/.test(lower)) return `${lower.slice(0, -3)}são`;
        if (/^[a-z]{2,}soes$/.test(lower)) return `${lower.slice(0, -4)}sões`;
        if (/^[a-z]{2,}encia$/.test(lower)) return `${lower.slice(0, -5)}ência`;
        if (/^[a-z]{2,}encias$/.test(lower)) return `${lower.slice(0, -6)}ências`;
        if (/^[a-z]{2,}ario$/.test(lower)) return `${lower.slice(0, -4)}ário`;
        if (/^[a-z]{2,}arios$/.test(lower)) return `${lower.slice(0, -5)}ários`;
        return token;
      })
      .join(' ');
  }

  function stripAmendedLawTail(rawText) {
    const norm = normalizeFilterText(rawText);
    if (!norm) return '';
    return norm
      .replace(/\b(?:e\s+)?(?:altera|modifica|acrescenta|revoga|da\s+nova\s+redacao)\s+(?:a\s+|o\s+|os\s+|as\s+|dispositivos\s+da\s+)?(?:lei|decreto|codigo|estatuto)\b.*$/i, '')
      .trim();
  }

  function extractLeadingLawDigits(rawText) {
    const base = stripAmendedLawTail(rawText) || normalizeFilterText(rawText);
    if (!base) return '';
    const match = base.match(/\b(?:lei|decreto(?:-lei)?|lc)\s*(?:complementar\s*)?(?:n\.?[oº°.]?\s*|numero\s+)?(\d{1,2}\.?\d{3})\b/i);
    return match ? match[1].replace(/\D/g, '') : '';
  }

  function getMatchingSpecialLawIds(rawText, opts = {}) {
    const primaryOnly = Boolean(opts && opts.primaryOnly);
    const sourceText = primaryOnly ? (stripAmendedLawTail(rawText) || rawText) : rawText;
    const norm = normalizeFilterText(sourceText)
      .replace(/[-–—:|/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!norm) return [];
    const leadingDigits = primaryOnly ? extractLeadingLawDigits(sourceText) : '';
    const ids = [];
    for (const rule of SPECIAL_LAW_RULES) {
      if (!rule.id || !rule.test(norm)) continue;
      if (primaryOnly && leadingDigits && rule.lawDigits && rule.lawDigits !== leadingDigits) {
        continue;
      }
      if (!ids.includes(rule.id)) {
        ids.push(rule.id);
      }
    }
    if (primaryOnly && leadingDigits) {
      const key = `lei_${leadingDigits}`;
      if (!ids.includes(key)) ids.push(key);
    } else {
      const lawRegex = /\blei\s+(?:n\.?[oº°.]?\s*|numero\s+)?(\d{1,2}\.?\d{3})\b/gi;
      let match;
      while ((match = lawRegex.exec(norm)) !== null) {
        const digits = match[1].replace(/\D/g, '');
        if (digits.length >= 4 && digits.length <= 5) {
          const key = `lei_${digits}`;
          if (!ids.includes(key)) ids.push(key);
        }
      }
    }
    return ids;
  }

  function getSpecialLawSearchTerms(rawText) {
    const norm = normalizeFilterText(rawText)
      .replace(/[-–—:|/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!norm) return [];
    const results = [];
    const pushTerm = (t) => {
      if (t && !results.includes(t)) results.push(t);
    };

    for (const rule of SPECIAL_LAW_RULES) {
      if (rule.test(norm)) {
        for (const t of rule.terms) {
          pushTerm(t);
        }
      }
    }

    // Extrai números de leis explícitos no texto (ex.: "Lei nº 14.344/2022" -> "lei 14.344", "14.344", "14344")
    const lawRegex = /\blei\s+(?:n[oº°.]?\s*)?(\d{1,2}\.?\d{3})\b/gi;
    let match;
    while ((match = lawRegex.exec(norm)) !== null) {
      const digits = match[1].replace(/\D/g, '');
      if (digits.length >= 4 && digits.length <= 5) {
        const dotted = digits.replace(/^(\d+)(\d{3})$/, '$1.$2');
        pushTerm(`lei ${dotted}`);
        pushTerm(dotted);
        pushTerm(digits);
      }
    }

    return results;
  }

  const KNOWN_SUBJECT_RULES = [
    {
      canonical: 'Direito Processual Penal',
      exactPatterns: ['direito processual penal', 'processual penal', 'processo penal', 'dpp'],
      inlineRegex: /\b(?:direito\s+processual\s+penal|processo\s+penal)\b/i
    },
    {
      canonical: 'Legislação Especial',
      exactPatterns: [
        'legislacao penal especial', 'legislacao especial', 'legislacao extravagante',
        'leis penais especiais', 'leis especiais', 'direito penal especial', 'penal especial'
      ],
      inlineRegex: /\b(?:legislacao\s+(?:penal\s+)?especial|legislacao\s+extravagante|leis\s+(?:penais\s+)?especiais)\b/i
    },
    {
      canonical: 'Direito Constitucional',
      exactPatterns: ['direito constitucional', 'constitucional', 'dir constitucional'],
      inlineRegex: /\bdireito\s+constitucional\b/i
    },
    {
      canonical: 'Direito Administrativo',
      exactPatterns: ['direito administrativo', 'administrativo', 'dir administrativo'],
      inlineRegex: /\bdireito\s+administrativo\b/i
    },
    {
      canonical: 'Direito Penal',
      exactPatterns: ['direito penal', 'penal', 'dir penal'],
      inlineRegex: /\bdireito\s+penal\b/i
    },
    {
      canonical: 'Legislação de Trânsito',
      exactPatterns: [
        'legislacao de transito', 'codigo de transito brasileiro', 'codigo de transito',
        'ctb', 'transito'
      ],
      inlineRegex: /\b(?:legislacao\s+de\s+transito|codigo\s+de\s+transito(?:\s+brasileiro)?|ctb)\b/i
    },
    {
      canonical: 'Língua Portuguesa',
      exactPatterns: ['lingua portuguesa', 'portugues', 'gramatica', 'interpretacao de texto', 'interpretacao textual'],
      inlineRegex: /\b(?:lingua\s+portuguesa|portugues)\b/i
    },
    {
      canonical: 'Raciocínio Lógico',
      exactPatterns: ['raciocinio logico matematico', 'raciocinio logico', 'rlm', 'matematica'],
      inlineRegex: /\b(?:raciocinio\s+logico(?:\s+matematico)?|rlm)\b/i
    },
    {
      canonical: 'Informática',
      exactPatterns: ['nocoes de informatica', 'informatica'],
      inlineRegex: /\binformatica\b/i
    },
    {
      canonical: 'Ética no Serviço Público',
      exactPatterns: ['etica no servico publico', 'etica profissional', 'etica e cidadania', 'etica'],
      inlineRegex: /\betica\s+no\s+servico\s+publico\b/i
    },
    {
      canonical: 'Direitos Humanos',
      exactPatterns: ['direitos humanos', 'cidadania e direitos humanos'],
      inlineRegex: /\bdireitos\s+humanos\b/i
    },
    {
      canonical: 'Física',
      exactPatterns: ['fisica aplicada', 'fisica'],
      inlineRegex: /\bfisica\b/i
    },
    {
      canonical: 'Geopolítica',
      exactPatterns: ['geopolitica brasileira', 'geopolitica'],
      inlineRegex: /\bgeopolitica\b/i
    },
    {
      canonical: 'Direito Civil',
      exactPatterns: ['direito civil'],
      inlineRegex: /\bdireito\s+civil\b/i
    },
    {
      canonical: 'Redação',
      exactPatterns: ['redacao discursiva', 'redacao oficial', 'redacao'],
      inlineRegex: /\bredacao(?:\s+(?:discursiva|oficial))?\b/i
    }
  ];

  function matchExactSubjectRule(segment) {
    const norm = normalizeFilterText(segment)
      .replace(/^(?:nocoes\s+de|disciplina\s*:?|materia\s*:?)\s+/i, '')
      .replace(/\b(?:aula|parte|bloco|modulo)\s*\d+\b/gi, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!norm) return null;
    for (const rule of KNOWN_SUBJECT_RULES) {
      if (rule.exactPatterns.includes(norm)) {
        return rule.canonical;
      }
    }
    return null;
  }

  function extractSubjectFromLessonTitle(lessonTitle) {
    const raw = String(lessonTitle || '').trim();
    if (!raw) return { subject: '', cleanedTitle: '' };

    // 1. Verifica prefixo entre colchetes/parênteses no início: "[Informática] Redes" ou "(Direito Penal) Crimes"
    const bracketMatch = raw.match(/^\s*[[(]([^\]()]{3,45})[\])]\s*[-–—:|]*\s*(.+)$/);
    if (bracketMatch) {
      const bracketSubject = matchExactSubjectRule(bracketMatch[1]);
      if (bracketSubject) {
        const rest = bracketMatch[2].trim();
        return {
          subject: bracketSubject,
          cleanedTitle: rest || raw
        };
      }
    }

    // 2. Verifica segmentos separados por -, –, —, :, |
    const segments = raw.split(/\s*(?:[-–—:|])\s*/).map(s => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      const stripLeadingOrder = (s) => s.replace(/^(?:aula|modulo|bloco)\s*\d+\s*/i, '').trim();
      const firstCand = stripLeadingOrder(segments[0]) || segments[0];
      const firstSubject = matchExactSubjectRule(firstCand);
      if (firstSubject) {
        const remaining = segments.slice(1).join(' - ').trim();
        return {
          subject: firstSubject,
          cleanedTitle: remaining && !/^(?:aula|parte|bloco|modulo)\s*\d+$/i.test(normalizeFilterText(remaining)) ? remaining : raw
        };
      }

      // Caso venha no segundo segmento após "Aula 01 - Direito Penal - ..."
      if (segments.length >= 3 && /^(?:aula|modulo|bloco)\s*\d+$/i.test(normalizeFilterText(segments[0]))) {
        const secondSubject = matchExactSubjectRule(segments[1]);
        if (secondSubject) {
          const remaining = segments.slice(2).join(' - ').trim();
          return {
            subject: secondSubject,
            cleanedTitle: remaining || raw
          };
        }
      }

      // Caso a matéria venha no último segmento: "Inquérito Policial - Direito Processual Penal"
      const lastSubject = matchExactSubjectRule(segments[segments.length - 1]);
      if (lastSubject) {
        const remaining = segments.slice(0, -1).join(' - ').trim();
        return {
          subject: lastSubject,
          cleanedTitle: remaining && !/^(?:aula|parte|bloco|modulo)\s*\d+$/i.test(normalizeFilterText(remaining)) ? remaining : raw
        };
      }
    }

    // 3. Fallback inline: detecta menção explícita da matéria no meio do título sem remover palavras do assunto
    const normRaw = normalizeFilterText(raw);
    for (const rule of KNOWN_SUBJECT_RULES) {
      if (rule.inlineRegex && rule.inlineRegex.test(normRaw)) {
        return { subject: rule.canonical, cleanedTitle: raw };
      }
    }

    return { subject: '', cleanedTitle: raw };
  }

  function inferSubjectFromLessons(lessonsList = [], fallbackTopic = '') {
    const candidates = [...(Array.isArray(lessonsList) ? lessonsList : [lessonsList]), fallbackTopic].filter(Boolean);
    for (const cand of candidates) {
      const { subject } = extractSubjectFromLessonTitle(cand);
      if (subject) return subject;
    }
    return '';
  }

  function stripSubjectFromLessonTitle(lessonTitle, subjectName = '') {
    const raw = String(lessonTitle || '').trim();
    if (!raw) return '';
    const extracted = extractSubjectFromLessonTitle(raw);
    if (extracted.cleanedTitle && extracted.cleanedTitle !== raw) {
      return extracted.cleanedTitle;
    }
    if (subjectName) {
      const targetCanon = matchExactSubjectRule(subjectName) || normalizeFilterText(subjectName);
      const segments = raw.split(/\s*(?:[-–—:|])\s*/).map(s => s.trim()).filter(Boolean);
      if (segments.length >= 2) {
        const firstCanon = matchExactSubjectRule(segments[0]) || normalizeFilterText(segments[0]);
        if (firstCanon && firstCanon === targetCanon) {
          const rest = segments.slice(1).join(' - ').trim();
          if (rest && !/^(?:aula|parte|bloco|modulo)\s*\d+$/i.test(normalizeFilterText(rest))) {
            return rest;
          }
        }
      }
    }
    return raw;
  }

  function isGenericSubjectName(subject) {
    const norm = normalizeFilterText(subject);
    if (!norm) return true;
    return /^(?:geral|edital|revisao|simulado|curso|modulo|modulos|aula|aulas|bateria|questoes|nivelamento)$/.test(norm);
  }

  function getSubjectSearchTerms(subject) {
    const norm = normalizeFilterText(subject);
    if (!norm) return [];
    const specialLegislationTerms = [
      'legislacao penal especial',
      'legislacao especial',
      'leis penais especiais',
      'leis especiais',
      'legislacao extravagante',
      'direito penal especial',
      'penal especial',
      'especial',
      'especiais',
      'extravagante'
    ];
    const aliases = {
      'portugues': ['lingua portuguesa', 'portugues'],
      'lingua portuguesa': ['lingua portuguesa', 'portugues'],
      'legislacao de transito': ['codigo de transito brasileiro', 'ctb', 'transito', 'legislacao de transito'],
      'transito': ['codigo de transito brasileiro', 'ctb', 'transito'],
      'ctb': ['codigo de transito brasileiro', 'ctb'],
      'raciocinio logico': ['raciocinio logico', 'matematica'],
      'rlm': ['raciocinio logico', 'matematica'],
      'processo penal': ['direito processual penal', 'processo penal'],
      'direito processual penal': ['direito processual penal', 'processo penal'],
      'direito penal': ['direito penal', 'penal'],
      'penal': ['direito penal', 'penal'],
      'direito constitucional': ['direito constitucional', 'constitucional'],
      'constitucional': ['direito constitucional', 'constitucional'],
      'direito administrativo': ['direito administrativo', 'administrativo'],
      'administrativo': ['direito administrativo', 'administrativo'],
      'direitos humanos': ['direitos humanos'],
      'direito civil': ['direito civil'],
      'legislacao especial': specialLegislationTerms,
      'legislacao penal especial': specialLegislationTerms,
      'leis especiais': specialLegislationTerms,
      'leis penais especiais': specialLegislationTerms,
      'informatica': ['informatica', 'nocoes de informatica'],
      'etica': ['etica no servico publico', 'etica'],
      'etica no servico publico': ['etica no servico publico', 'etica'],
      'fisica': ['fisica'],
      'geopolitica': ['geopolitica'],
      'redacao': ['redacao']
    };
    const list = aliases[norm] ? [...aliases[norm]] : [norm];
    if (!list.includes(norm)) list.push(norm);
    return list;
  }

  function getTopicSearchTerms(topic) {
    const norm = normalizeFilterText(topic);
    if (!norm) return [];
    const terms = [];
    const pushUnique = (t) => {
      const s = String(t || '').trim();
      if (s && !terms.includes(s)) terms.push(s);
    };

    const cleaned = norm
      .replace(/\b(de nivelamento|nivelamento|bases da|bases do|nocoes de|introducao a|introducao ao|parte \d+|aula \d+|modulo \d+)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    pushUnique(norm);
    pushUnique(cleaned);

    getSpecialLawSearchTerms(norm).forEach(t => pushUnique(t));
    if (cleaned && cleaned !== norm) {
      getSpecialLawSearchTerms(cleaned).forEach(t => pushUnique(t));
    }

    // Gera variante plural simples caso o assunto do QG esteja no singular (ex.: "conceito iniciais" -> "conceitos iniciais")
    const cleanedWords = cleaned.split(' ').filter(Boolean);
    if (cleanedWords.length >= 2 && cleanedWords[1].length >= 3) {
      const pair = `${cleanedWords[0]} ${cleanedWords[1]}`;
      if (!isOnlyGenericWords(pair)) {
        pushUnique(pair);
        if (!cleanedWords[0].endsWith('s') && cleanedWords[0].length >= 4 && !isOnlyGenericWords(cleanedWords[0])) {
          pushUnique(`${cleanedWords[0]}s ${cleanedWords[1]}`);
        }
      }
    }

    const sigWords = cleanedWords.filter(w => w.length >= 4 && !isOnlyGenericWords(w));
    sigWords.sort((a, b) => b.length - a.length);
    sigWords.forEach(w => pushUnique(w));
    return terms;
  }

  function extractEnumeratedSubitemsFromLesson(lessonTitle) {
    const strippedSubject = stripSubjectFromLessonTitle(lessonTitle);
    const cleaned = String(strippedSubject || lessonTitle || '')
      .replace(/\b(?:aula|parte|bloco|m[oó]dulo|cap[ií]tulo)\s*\d+\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, '')
      .trim();
    if (!cleaned) return [];

    const dashParts = cleaned.split(/\s*[-–—:]\s*/).map(p => p.trim()).filter(Boolean);
    const targetParts = dashParts.length > 1 ? dashParts.slice(1) : [cleaned];

    const rawItems = [];
    const seenNorm = new Set();
    const headNouns = new Set([
      'administracao', 'atos', 'ato', 'principios', 'principio', 'controle',
      'poder', 'poderes', 'competencia', 'competencias', 'orgaos', 'agentes',
      'servicos', 'responsabilidade', 'acao', 'prisao', 'crimes'
    ]);
    for (const part of targetParts) {
      const strippedPart = part
        .replace(/^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o|comparativo|quadro\s+comparativo|rela[cç][aã]o)\s+(?:entre|de|da|do)\s+|(?:conceitos?|no[cç][oõ]es|defini[cç][oõ]es|defini[cç][aã]o|esp[eé]cies|formas|tipos|classifica[cç][aã]o|caracter[ií]sticas)\s+(?:de|da|do|dos|das)\s+)/i, '')
        .replace(/\s*\([^)]*\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!strippedPart) continue;

      const splitItems = strippedPart
        .split(/\s*,\s*|\s+\be\b\s+|\s+\bx\b\s+|\s+\b(?:vs\.?|versus)\b\s+|(?<=[a-zA-ZÀ-ÿ])\s*\/\s*(?=[a-zA-ZÀ-ÿ])/i)
        .map(p => p.trim())
        .filter(Boolean);
      if (splitItems.length < 2) continue;

      if (splitItems.length === 2) {
        const firstWords = splitItems[0].split(/\s+/).filter(Boolean);
        const secondWords = splitItems[1].split(/\s+/).filter(Boolean);
        if (firstWords.length >= 2 && secondWords.length === 1 && headNouns.has(normalizeFilterText(firstWords[0]))) {
          splitItems[1] = `${firstWords[0]} ${splitItems[1]}`;
        }
      }

      splitItems.forEach((item, idx) => {
        const cleanNorm = normalizeFilterText(item)
          .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanNorm.length >= 3 && !isOnlyGenericWords(cleanNorm) && !seenNorm.has(cleanNorm)) {
          seenNorm.add(cleanNorm);
          rawItems.push({ raw: item.trim(), norm: cleanNorm, idx });
        }
      });
    }

    // Ordena termos mais específicos/longos primeiro (em empate de tamanho, prefere itens posteriores como intranet/extranet antes de internet)
    rawItems.sort((a, b) => (b.norm.length - a.norm.length) || (b.idx - a.idx));
    return rawItems.map(entry => entry.raw);
  }

  function getLessonSearchTerms(lessonTitle) {
    const withoutSubject = stripSubjectFromLessonTitle(lessonTitle);
    const cleanedRaw = String(withoutSubject || lessonTitle || '')
      .replace(/\b(?:aula|parte|bloco|m[oó]dulo|cap[ií]tulo)\s*\d+\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, '')
      .trim();
    if (!cleanedRaw) return [];

    const terms = [];
    const pushUnique = (t) => {
      const s = normalizeFilterText(t)
        .replace(/\b(aula|parte|bloco|modulo|capitulo)\s*\d+\b/g, ' ')
        .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (s && !terms.includes(s)) terms.push(s);
    };

    const pushEnumeratedFromPart = (part) => {
      const listParts = part.split(/\s*,\s*|\s+\be\b\s+|\s+\bx\b\s+/i).map(p => p.trim()).filter(Boolean);
      if (listParts.length > 1) {
        const specificParts = [];
        listParts.forEach((sub, idx) => {
          const cleanPart = normalizeFilterText(sub);
          if (cleanPart.length >= 3 && !isOnlyGenericWords(cleanPart)) {
            specificParts.push({ cleanPart, idx });
          }
        });
        specificParts.sort((a, b) => (b.cleanPart.length - a.cleanPart.length) || (b.idx - a.idx));
        specificParts.forEach(entry => pushUnique(entry.cleanPart));
      }
    };

    // Divide primeiro por hífen / travessão para não misturar prefixo genérico com lista enumerada à direita
    const dashParts = cleanedRaw.split(/\s*[-–—:]\s*/).map(p => p.trim()).filter(Boolean);
    if (dashParts.length > 1) {
      const rightParts = dashParts.slice(1);
      const leftPart = dashParts[0];

      // Prioriza partes específicas à direita (ex.: "Internet, Intranet e Extranet") antes do prefixo à esquerda ("Definições de Redes")
      rightParts.forEach(part => {
        const cleanPart = normalizeFilterText(part);
        if (cleanPart.length >= 3 && !isOnlyGenericWords(cleanPart)) {
          pushUnique(part);
        }
        getSpecialLawSearchTerms(part).forEach(t => pushUnique(t));
        pushEnumeratedFromPart(part);
      });

      pushUnique(cleanedRaw);
      getSpecialLawSearchTerms(cleanedRaw).forEach(t => pushUnique(t));

      const cleanLeft = normalizeFilterText(leftPart);
      if (cleanLeft.length >= 3 && !isOnlyGenericWords(cleanLeft)) {
        pushUnique(leftPart);
      }
      getSpecialLawSearchTerms(leftPart).forEach(t => pushUnique(t));
      pushEnumeratedFromPart(leftPart);
    } else {
      pushUnique(cleanedRaw);
      getSpecialLawSearchTerms(cleanedRaw).forEach(t => pushUnique(t));
      pushEnumeratedFromPart(cleanedRaw);
    }

    // Variantes sem palavras genéricas e palavras-chave significativas (>= 4 letras)
    const expanded = [...terms];
    expanded.forEach(t => {
      const words = t.split(' ').filter(Boolean);
      if (words.length >= 2 && words[1].length >= 3) {
        const pair = `${words[0]} ${words[1]}`;
        if (!isOnlyGenericWords(pair)) {
          pushUnique(pair);
          if (!words[0].endsWith('s') && words[0].length >= 4 && !isOnlyGenericWords(words[0])) {
            pushUnique(`${words[0]}s ${words[1]}`);
          }
        }
      }
      words
        .filter(w => w.length >= 4 && !isOnlyGenericWords(w))
        .sort((a, b) => b.length - a.length)
        .forEach(w => pushUnique(w));
    });

    return terms;
  }

  function findAppliedFiltersSection() {
    const label = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, label, strong'))
      .find(el => {
        if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === 'filtros aplicados' || txt === 'filtros aplicados:';
      });
    if (!label) return null;
    const labelRect = label.getBoundingClientRect();
    let container = label.parentElement;
    while (container && container !== document.body) {
      const r = container.getBoundingClientRect();
      if (r.height >= 45 && r.height <= 460 && r.width >= 260) {
        return { container, labelRect };
      }
      container = container.parentElement;
    }
    return { container: label.parentElement, labelRect };
  }

  function findFilterDropdownTrigger(labelWord) {
    const targetNorm = normalizeFilterText(labelWord);
    const targetPrefix = targetNorm.slice(0, Math.min(6, targetNorm.length));
    const appliedInfo = findAppliedFiltersSection();

    const matches = Array.from(document.querySelectorAll('button, [role="button"], [role="combobox"], .q-select, .q-field, div, span'))
      .filter(el => {
        if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
        if (appliedInfo) {
          const r = el.getBoundingClientRect();
          if (r.top >= appliedInfo.labelRect.top - 4) return false;
          if (appliedInfo.container && appliedInfo.container.contains(el)) return false;
        }
        const txt = normalizeFilterText(el.innerText || el.textContent);
        if (!txt || txt.length > 60 || txt.includes('filtros aplicados')) return false;
        return (
          txt === targetNorm ||
          txt.startsWith(`${targetNorm} `) ||
          txt.startsWith(`${targetNorm}\n`) ||
          (targetPrefix.length >= 5 && txt.startsWith(targetPrefix) && /\bselecionad/.test(txt))
        );
      });

    const containers = [];
    for (const el of matches) {
      let cur = el;
      let chosen = null;
      for (let depth = 0; depth < 5 && cur && cur !== document.body; depth++) {
        const r = cur.getBoundingClientRect();
        if (r.width >= 110 && r.width <= 420 && r.height >= 28 && r.height <= 65) {
          if (cur.matches('button, [role="button"], [role="combobox"], .q-select, .q-field, div')) {
            chosen = cur;
            if (cur.matches('button, [role="button"], [role="combobox"], .q-select, .q-field')) break;
          }
        }
        cur = cur.parentElement;
      }
      if (chosen) containers.push(chosen);
    }

    const unique = Array.from(new Set(containers));
    unique.sort((a, b) => {
      const aClickable = a.matches('button, [role="button"], [role="combobox"], .q-select, .q-field') ? 0 : 1;
      const bClickable = b.matches('button, [role="button"], [role="combobox"], .q-select, .q-field') ? 0 : 1;
      if (aClickable !== bClickable) return aClickable - bClickable;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    return unique[0] || null;
  }

  function findMenuFilterInput() {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'))
      .filter(el => !el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') && isElementVisible(el));
    return inputs.find(el => {
      const meta = normalizeFilterText(`${el.placeholder || ''} ${el.getAttribute('aria-label') || ''} ${el.name || ''}`);
      if (!meta || meta.includes('filtrar carreiras') || meta.includes('palavra chave')) return false;
      return meta.includes('digite para filtrar');
    }) || null;
  }

  function getMenuContainer(filterInput) {
    if (!filterInput) return null;
    let container = filterInput.closest('.q-menu, [role="listbox"], .v-menu__content, .dropdown-menu');
    if (!container) {
      let cur = filterInput.parentElement;
      for (let depth = 0; depth < 6 && cur && cur !== document.body; depth++) {
        const r = cur.getBoundingClientRect();
        if (r.height >= 100 && r.width >= 160 && r.width <= 650) {
          container = cur;
          break;
        }
        cur = cur.parentElement;
      }
    }
    return container;
  }

  function hasNoSearchResultsInMenu(filterInput) {
    const container = getMenuContainer(filterInput) || filterInput?.parentElement?.parentElement;
    if (!container) return false;
    const txt = normalizeFilterText(container.innerText || container.textContent);
    return txt.includes('pesquisa sem resultados') || txt.includes('nenhum resultado');
  }

  function findDropdownOptionElements(filterInput) {
    const container = getMenuContainer(filterInput);
    if (!container) return [];

    const inputRect = filterInput.getBoundingClientRect();
    const rawCandidates = Array.from(container.querySelectorAll('label, li, [role="option"], [role="menuitem"], [role="checkbox"], .q-item, div'))
      .filter(el => {
        if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || el === filterInput || el.contains(filterInput) || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.top < inputRect.bottom - 4) return false;
        if (r.width < 80 || r.height < 18 || r.height > 84) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        if (!txt || txt === 'digite para filtrar') return false;
        return true;
      });

    const checkboxSel = 'input[type="checkbox"], [role="checkbox"], .q-checkbox, .q-checkbox__inner';
    const candidates = Array.from(new Set(rawCandidates.map(el => {
      if (el.querySelector(checkboxSel)) return el;
      const elNorm = normalizeFilterText(el.innerText || el.textContent);
      let parent = el.parentElement;
      for (let depth = 0; depth < 2 && parent && parent !== container && container.contains(parent); depth++) {
        if (
          parent !== filterInput &&
          !parent.contains(filterInput) &&
          !parent.closest('#qg-caveira-shadow-host, #qg-caveira-hud') &&
          isElementVisible(parent) &&
          normalizeFilterText(parent.innerText || parent.textContent) === elNorm &&
          parent.querySelector(checkboxSel)
        ) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return el;
    })));

    // Mantém apenas linhas-folha (não contêm outro candidato com texto diferente)
    const leafCandidates = candidates.filter(el => {
      const elTxt = normalizeFilterText(el.innerText || el.textContent);
      return !candidates.some(other => {
        if (other === el || !el.contains(other)) return false;
        const otherTxt = normalizeFilterText(other.innerText || other.textContent);
        return Boolean(otherTxt && otherTxt !== elTxt);
      });
    });

    const anyHasCheckbox = leafCandidates.some(el => Boolean(findCheckboxInRowOrParent(el)));
    if (anyHasCheckbox) {
      return leafCandidates.filter(el => Boolean(findCheckboxInRowOrParent(el)));
    }
    return leafCandidates;
  }

  function hasWholeStartMatch(text, term) {
    if (!text || !term) return false;
    if (!text.startsWith(term)) return false;
    if (term.length > 4 || text.length === term.length) return true;
    return /[^a-z0-9]/.test(text.charAt(term.length));
  }

  function hasWholeTermMatch(text, term) {
    if (!text || !term) return false;
    if (term.length <= 4) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(text);
    }
    return text.includes(term);
  }

  function scoreOptionMatch(optionText, searchTerms, opts = {}) {
    const primaryOptionText = stripAmendedLawTail(optionText) || optionText;
    const normOpt = normalizeFilterText(primaryOptionText);
    const stemOpt = normalizeStemText(primaryOptionText);
    if (!normOpt) return 0;

    const validTerms = Array.isArray(searchTerms)
      ? searchTerms.map(t => normalizeFilterText(t)).filter(Boolean)
      : [];
    if (validTerms.length === 0) return 0;

    // Guarda de Lei Específica: avalia a lei principal da opção (sem a cauda "e altera a Lei...")
    const optLawIds = getMatchingSpecialLawIds(primaryOptionText, { primaryOnly: true });
    if (optLawIds.length > 0) {
      if (opts.allowedLawIds instanceof Set && opts.allowedLawIds.size > 0) {
        if (!optLawIds.some(id => opts.allowedLawIds.has(id))) {
          return 0;
        }
      }
      const searchLawIds = getMatchingSpecialLawIds(validTerms.join(' '));
      if (!optLawIds.some(id => searchLawIds.includes(id))) {
        return 0;
      }
    }

    // Rejeita qualificadores conflitantes (ex.: "Legislação Estadual" quando busca "Legislação Especial")
    const optStemWords = new Set(normalizeStemText(normOpt.replace(/[^a-z0-9]+/g, ' ')).split(' ').filter(Boolean));
    const searchStemJoined = normalizeStemText(validTerms.join(' ').replace(/[^a-z0-9]+/g, ' '));
    const searchStemWords = new Set(searchStemJoined.split(' ').filter(Boolean));
    for (const family of CONFLICTING_QUALIFIER_FAMILIES) {
      const optHasFamily = family.some(w => optStemWords.has(w));
      if (optHasFamily && !family.some(w => searchStemWords.has(w))) {
        return 0;
      }
    }

    const normOptWithoutLeiPrefix = normOpt
      .replace(/^(?:lei|decreto(?:-lei)?|lc)\s*(?:complementar\s*)?(?:n\.?[oº°.]?\s*|numero\s+)?/, '')
      .trim();
    const stemOptWithoutLeiPrefix = normalizeStemText(normOptWithoutLeiPrefix);

    const normOptBase = normOpt
      .replace(/\s*\([^)]*\)/g, ' ')
      .replace(/[.;:]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const stemOptBase = normalizeStemText(normOptBase);
    const optParenAliases = [];
    const parenRegex = /\(([^()]{2,35})\)/g;
    let pm;
    while ((pm = parenRegex.exec(normOpt)) !== null) {
      const pa = pm[1].trim();
      if (pa && !isOnlyGenericWords(pa)) optParenAliases.push(pa);
    }

    const targetConcepts =
      opts.targetConcepts instanceof Set && opts.targetConcepts.size > 0
        ? opts.targetConcepts
        : new Set(extractConceptWords(validTerms[0] || ''));
    const searchConcepts = new Set(extractConceptWords(validTerms.join(' ')));
    const lessonConcepts =
      opts.lessonConcepts instanceof Set && opts.lessonConcepts.size > 0
        ? opts.lessonConcepts
        : null;
    const allowedConcepts = new Set([
      ...targetConcepts,
      ...searchConcepts,
      ...(lessonConcepts ? lessonConcepts : [])
    ]);
    const optConcepts = extractConceptWords(normOptBase || primaryOptionText);
    const matchedConcepts = optConcepts.filter(c => targetConcepts.has(c));
    const matchedAllowed = optConcepts.filter(c => allowedConcepts.has(c));
    const missingTargetCount = Array.from(targetConcepts).filter(c => !optConcepts.includes(c)).length;
    const foreignConcepts = optConcepts.filter(c => !allowedConcepts.has(c));

    const hasExactParenAliasMatch =
      optConcepts.length <= 1 &&
      validTerms.some(term => {
        const stemTerm = normalizeStemText(term);
        return optParenAliases.some(a => a === term || (stemTerm && normalizeStemText(a) === stemTerm));
      });

    // Guarda Anti-Tópico Irmão (Sibling Trap): impede marcar tópico irmão com conceito estranho
    if (optLawIds.length === 0 && targetConcepts.size > 0 && !hasExactParenAliasMatch) {
      if (optConcepts.length > 0 && matchedAllowed.length === 0) {
        return 0;
      }
      if (missingTargetCount > 0 && foreignConcepts.length > 0) {
        return 0;
      }
      if (targetConcepts.size >= 3 && matchedConcepts.length <= 1 && optConcepts.some(c => !targetConcepts.has(c))) {
        return 0;
      }
    }

    const isPureConceptSubset = optConcepts.length > 0 && matchedConcepts.length === optConcepts.length;
    const isSinglePartialConcept =
      targetConcepts.size >= 2 &&
      optConcepts.length === 1 &&
      matchedConcepts.length === 1;
    const compositeConceptScore =
      matchedConcepts.length >= 2 && isPureConceptSubset
        ? 1000 + matchedConcepts.length * 80
        : 0;

    let best = 0;
    let additionalTermMatches = 0;
    for (let i = 0; i < validTerms.length; i++) {
      const term = validTerms[i];
      const stemTerm = normalizeStemText(term);
      if (!term) continue;
      if (
        normOpt === term ||
        (stemTerm && stemOpt === stemTerm) ||
        (normOptBase && (normOptBase === term || (stemTerm && stemOptBase === stemTerm)))
      ) {
        if (foreignConcepts.length === 0) {
          if (!isSinglePartialConcept && compositeConceptScore === 0) {
            return 1000 - i;
          }
          best = Math.max(best, isSinglePartialConcept ? Math.max(1, 720 - i) : (1000 - i));
          continue;
        }
        best = Math.max(best, 920 - i);
        continue;
      }
      if (
        optConcepts.length <= 1 &&
        optParenAliases.some(a => a === term || (stemTerm && normalizeStemText(a) === stemTerm))
      ) {
        if (foreignConcepts.length === 0) {
          if (!isSinglePartialConcept && compositeConceptScore === 0) {
            return 950 - i;
          }
          best = Math.max(best, isSinglePartialConcept ? Math.max(1, 720 - i) : (950 - i));
          continue;
        }
        best = Math.max(best, 900 - i);
        continue;
      }
      if (
        (normOptWithoutLeiPrefix && hasWholeStartMatch(normOptWithoutLeiPrefix, term)) ||
        (stemOptWithoutLeiPrefix && stemTerm && hasWholeStartMatch(stemOptWithoutLeiPrefix, stemTerm))
      ) {
        best = Math.max(best, 900 - i);
        if (i > 0) additionalTermMatches += 1;
      } else if (
        hasWholeStartMatch(normOpt, term) ||
        (stemTerm && hasWholeStartMatch(stemOpt, stemTerm)) ||
        (normOptBase && (hasWholeStartMatch(normOptBase, term) || (stemTerm && hasWholeStartMatch(stemOptBase, stemTerm))))
      ) {
        best = Math.max(best, 800 - i);
        if (i > 0) additionalTermMatches += 1;
      } else if (
        hasWholeTermMatch(normOpt, term) ||
        (stemTerm && hasWholeTermMatch(stemOpt, stemTerm)) ||
        (normOptBase && (hasWholeTermMatch(normOptBase, term) || (stemTerm && hasWholeTermMatch(stemOptBase, stemTerm))))
      ) {
        best = Math.max(best, 600 - i);
        if (i > 0) additionalTermMatches += 1;
      } else if (
        normOpt.length >= 4 &&
        !isOnlyGenericWords(normOpt) &&
        isPureConceptSubset &&
        (hasWholeTermMatch(term, normOpt) || (stemTerm && stemOpt && hasWholeTermMatch(stemTerm, stemOpt)))
      ) {
        best = Math.max(best, 700 - i);
        if (i > 0) additionalTermMatches += 1;
      } else {
        const words = (stemTerm || term).split(' ').filter(w => w.length >= 3);
        const hits = words.filter(w => hasWholeTermMatch(stemOpt, w) || hasWholeTermMatch(normOpt, w)).length;
        if (hits > 0) {
          const specificWords = words.filter(w => !GENERIC_MATCH_WORDS.has(w));
          if (specificWords.length > 0) {
            const specificHits = specificWords.filter(
              w => hasWholeTermMatch(stemOpt, w) || hasWholeTermMatch(normOpt, w)
            ).length;
            if (specificHits === 0) continue;
          }
          best = Math.max(best, Math.round((hits / Math.max(1, words.length)) * 450) - i);
        }
      }
    }

    if (best > 0) {
      if (additionalTermMatches > 0) {
        best += Math.min(60, additionalTermMatches * 15);
      }
      if (compositeConceptScore > 0) {
        best = Math.max(best, compositeConceptScore);
      }
      if (optLawIds.length === 0 && targetConcepts.size > 0 && matchedConcepts.length === 0 && !hasExactParenAliasMatch) {
        best = Math.min(best, 350);
      }
      if (missingTargetCount === 0 && foreignConcepts.length > 0 && compositeConceptScore === 0 && best > 500) {
        best -= Math.min(120, foreignConcepts.length * 25);
      }
      if (isSinglePartialConcept && best > 720) {
        best = 720;
      }
    }
    return best;
  }

  async function closeOpenDropdown(trigger, filterInput) {
    if (!findMenuFilterInput()) return;

    if (filterInput && hasNoSearchResultsInMenu(filterInput)) {
      setNativeInputValue(filterInput, '');
      await sleepMs(160);
    }

    const activeInput = findMenuFilterInput() || filterInput;
    if (activeInput) {
      activeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await sleepMs(150);
    if (!findMenuFilterInput()) return;

    const menuContainer = getMenuContainer(findMenuFilterInput() || filterInput);
    const neutralHeading = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, span, p'))
      .find(el => {
        if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
        if (menuContainer && menuContainer.contains(el)) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === 'banco de questoes' || txt === 'carreiras' || txt === 'filtros';
      });
    if (neutralHeading) {
      clickElementRealistically(neutralHeading);
      await sleepMs(150);
    }

    if (findMenuFilterInput()) {
      const pointEl = document.elementFromPoint(15, 150);
      if (
        pointEl &&
        !pointEl.closest('#qg-caveira-shadow-host, #qg-caveira-hud') &&
        (!menuContainer || !menuContainer.contains(pointEl)) &&
        !pointEl.closest('a, button')
      ) {
        clickElementRealistically(pointEl);
        await sleepMs(150);
      }
    }

    if (findMenuFilterInput()) {
      const bodyEvt = { bubbles: true, cancelable: true, view: window, clientX: 15, clientY: 150 };
      try { document.body.dispatchEvent(new MouseEvent('mousedown', bodyEvt)); } catch (_) {}
      try { document.body.dispatchEvent(new MouseEvent('mouseup', bodyEvt)); } catch (_) {}
      document.body.click();
      await sleepMs(180);
    }

    if (findMenuFilterInput() && trigger && (!menuContainer || !trigger.contains(menuContainer))) {
      clickElementRealistically(trigger);
      await sleepMs(180);
    }
  }

  const GENERIC_INDEX_LINES = new Set([
    'introducao',
    'apresentacao',
    'abertura',
    'encerramento',
    'conclusao',
    'finalizacao',
    'consideracoes finais',
    'duvidas',
    'recados',
    'avisos',
    'revisao',
    'resumo',
    'exercicios',
    'questoes',
    'simulado',
    'inicio',
    'fim',
    'boas vindas',
    'bizus da aula',
    'resumo da aula',
    'topicos da aula',
    'assuntos da aula',
    'pontos importantes',
    'quadro resumo',
    'mapa mental'
  ]);

  const LEADING_INDEX_FILLER_REGEX = /^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o)\s+entre|comparativo\s+(?:entre|de|da|do)|quadro\s+comparativo\s+(?:entre|de|da|do)|rela[cç][aã]o\s+entre|conceitos?\s+e\s+caracter[ií]sticas\s+(?:de|da|do|dos|das)|conceitos?\s+(?:de|da|do|dos|das|sobre)|defini[cç][aã]o\s+(?:de|da|do|dos|das)|defini[cç][oõ]es\s+(?:de|da|do|dos|das)|resumo\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das)|aspectos?\s+(?:gerais|iniciais|principais)\s+(?:de|da|do|dos|das)|vis[aã]o\s+geral\s+(?:de|da|do)|entendendo\s+(?:a|o|as|os)|compreendendo\s+(?:a|o|as|os)|o\s+que\s+[eé])\s+/i;

  const BROAD_PARENT_PREFIX_REGEX = /^(?:organiza[cç][aã]o\s+(?:da|do|de)|conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das))\s+/i;

  function normalizeCourseIndexKey(str) {
    return normalizeFilterText(str)
      .replace(/[-–—:|/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const PURE_ARTICLE_LINE_REGEX = /^(?:revoga[cç][aã]o\s+(?:do|da|dos|das)\s+|leitura\s+(?:do|da|dos|das)\s+|coment[aá]rios?\s+(?:ao|sobre|do|dos)\s+|an[aá]lise\s+(?:do|dos)\s+)?art(?:igo)?s?\.?\s*(\d+)/i;

  function buildBroadParentNorms(contextNames = []) {
    const broad = new Set();
    for (const name of (Array.isArray(contextNames) ? contextNames : [contextNames])) {
      const raw = String(name || '').trim();
      if (!raw) continue;
      const stripped = raw
        .replace(/\s*[-–—]\s*(?:parte|aula|bloco|modulo)\s*\d+\s*$/i, '')
        .trim();
      for (const candidate of [raw, stripped]) {
        if (getSpecialLawSearchTerms(candidate).length > 0) continue;
        const norm = normalizeCourseIndexKey(candidate);
        if (norm) broad.add(norm);
        let cur = candidate;
        for (let i = 0; i < 2; i++) {
          const next = cur.replace(BROAD_PARENT_PREFIX_REGEX, '').trim();
          const nextNorm = normalizeCourseIndexKey(next);
          if (nextNorm && nextNorm !== normalizeCourseIndexKey(cur)) {
            if (getSpecialLawSearchTerms(next).length === 0) {
              broad.add(nextNorm);
            }
            cur = next;
          } else {
            break;
          }
        }
      }
    }
    return broad;
  }

  const PROSE_NOTE_PREFIX_REGEX = /^(?:obs(?:erva[cç][aã]o)?|aten[cç][aã]o|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|s[uú]mula|importante)\s*[:\-–]/i;

  function parseCourseIndexSubtopics(rawText, contextNames = []) {
    const input = String(rawText || '').trim();
    if (!input) return [];

    const normalizedBlock = input.replace(/([^\n])\s*(\[\d{1,2}:\d{2}(?::\d{2})?\])/g, '$1\n$2');
    const rawLines = normalizedBlock.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const mergedLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      const cur = rawLines[i];
      if (
        (/^[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?$/.test(cur) || /^\d{1,2}\s*[.)\-–—]$/.test(cur)) &&
        i + 1 < rawLines.length
      ) {
        mergedLines.push(`${cur} ${rawLines[i + 1]}`);
        i += 1;
      } else {
        mergedLines.push(cur);
      }
    }

    // Modo Bizus numerado (ex.: "1. Desconcentração", "2. Descentralização"):
    // mantém apenas as linhas numeradas dos títulos de assunto e descarta explicações/bullets.
    const hasTimestamps = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(input);
    const isNumberedBizusFormat =
      !hasTimestamps &&
      mergedLines.some(l => /^\s*\d{1,2}\s*[.)\-–—]\s+[A-Za-zÀ-ÿ]/.test(l));
    const linesToProcess = isNumberedBizusFormat
      ? mergedLines.filter(l => /^\s*\d{1,2}\s*[.)\-–—]\s+\S+/.test(l))
      : mergedLines;

    const broadContext = buildBroadParentNorms(contextNames);
    const contextText = (Array.isArray(contextNames) ? contextNames : [contextNames]).filter(Boolean).join(' ');
    const mainLawIds = new Set(getMatchingSpecialLawIds(contextText));
    const results = [];
    const seenNorm = new Set();

    for (const rawLine of linesToProcess) {
      const rawNorm = normalizeCourseIndexKey(rawLine);
      if (
        !rawNorm ||
        rawNorm === 'indice' ||
        rawNorm === 'charlie' ||
        rawNorm === 'bizus' ||
        rawNorm === 'arquivos' ||
        rawNorm === 'comentarios'
      ) {
        continue;
      }

      const hadIntroPrefix = /^(?:[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*|\d{1,2}\s*[.)\-–—]\s*)?introdu[cç][aã]o\b/i.test(rawLine);
      let cleaned = rawLine
        .replace(/^[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*[-–—:|]*\s*/, '')
        .replace(/^(?:[-•*●▪◦]|\d{1,2}\s*[.)\-–—])\s+/, '')
        .replace(/\bademi\s+publica\b/gi, 'Administração Pública')
        .replace(/\bademi\b/gi, 'Administração')
        .replace(/\badm\.?\s+publica\b/gi, 'Administração Pública')
        .replace(/\badm\.?\b/gi, 'Administração')
        .replace(/\bconst\.?\s+federal\b/gi, 'Constituição Federal')
        .replace(/\bcf\b(?=\s|$|[.,])/gi, 'Constituição Federal')
        .replace(/\bctb\b(?=\s|$|[.,])/gi, 'Código de Trânsito Brasileiro')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleaned) continue;

      if (PROSE_NOTE_PREFIX_REGEX.test(cleaned)) continue;

      if (isNumberedBizusFormat) {
        let didTruncateColon = false;
        const colonIdx = cleaned.indexOf(':');
        if (colonIdx > 2 && colonIdx < cleaned.length - 1) {
          const beforeColon = cleaned.slice(0, colonIdx).trim();
          const afterColon = cleaned.slice(colonIdx + 1).trim();
          const afterWords = afterColon.split(/\s+/).filter(Boolean).length;
          if (normalizeCourseIndexKey(beforeColon).length >= 3 && (afterColon.length > 25 || afterWords > 4)) {
            cleaned = beforeColon;
            didTruncateColon = true;
          }
        }
        if (!didTruncateColon) {
          const dashMatch = cleaned.match(/^(.+?)\s+[-–—]\s+(.+)$/);
          if (dashMatch) {
            const beforeDash = dashMatch[1].trim();
            const afterDash = dashMatch[2].trim();
            const beforeNorm = normalizeCourseIndexKey(beforeDash);
            const afterWords = afterDash.split(/\s+/).filter(Boolean).length;
            if (
              beforeNorm.length >= 4 &&
              !PURE_ARTICLE_LINE_REGEX.test(beforeDash) &&
              !LEADING_INDEX_FILLER_REGEX.test(beforeDash) &&
              !isOnlyGenericWords(beforeDash) &&
              (afterDash.length > 35 || afterWords > 6)
            ) {
              cleaned = beforeDash;
            }
          }
        }
        cleaned = cleaned.replace(/\s*\([^()]{28,}\)\s*$/g, '').trim();
        cleaned = cleaned.replace(/[:;.\-–—]+$/g, '').trim();
        if (!cleaned) continue;
      }

      if (cleaned.length > 85 || (/\.\s*$/.test(cleaned) && cleaned.split(/\s+/).length > 8)) {
        continue;
      }

      if (mainLawIds.size > 0) {
        const lineLawIds = getMatchingSpecialLawIds(cleaned);
        if (lineLawIds.some(id => !mainLawIds.has(id))) {
          continue;
        }
      }

      let norm = normalizeCourseIndexKey(cleaned);
      if (
        !norm ||
        norm.length < 3 ||
        GENERIC_INDEX_LINES.has(norm) ||
        /^(?:parte|aula|bloco|modulo)\s*\d+$/.test(norm) ||
        broadContext.has(norm)
      ) {
        continue;
      }

      const artMatch = cleaned.match(PURE_ARTICLE_LINE_REGEX);
      if (artMatch) {
        const artNum = artMatch[1];
        const isLandmarkArticle = ['5', '37', '144'].includes(artNum);
        const hasSpecialLawMention = getSpecialLawSearchTerms(cleaned).length > 0;
        if (!isLandmarkArticle && !hasSpecialLawMention) {
          continue;
        }
      }

      const strippedCore = cleaned.replace(LEADING_INDEX_FILLER_REGEX, '').trim();
      const strippedNorm = normalizeCourseIndexKey(strippedCore);
      if (strippedCore && strippedNorm.length >= 4) {
        if (hadIntroPrefix && strippedNorm.split(' ').length === 1 && strippedNorm.length < 10) {
          continue;
        }
        cleaned = strippedCore;
        norm = strippedNorm;
      }

      if (!norm || norm.length < 3 || GENERIC_INDEX_LINES.has(norm) || broadContext.has(norm)) {
        continue;
      }

      const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (!seenNorm.has(norm)) {
        seenNorm.add(norm);
        results.push(formatted);
      }
    }

    return results;
  }

  function expandSubtopicToSearchGroups(subtopic) {
    const clean = normalizeFilterText(subtopic)
      .replace(/\bademi\b/g, 'administracao')
      .replace(/\badm\b/g, 'administracao')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return { primary: [], splitFallbacks: [] };

    const primary = [];
    const pushPrimary = (t) => {
      const s = normalizeFilterText(t).replace(/\s+/g, ' ').trim();
      if (s && !primary.includes(s)) primary.push(s);
    };
    const extraSplits = [];
    const seenSplitKeys = new Set();
    const pushSplit = (arr) => {
      const cleanArr = (Array.isArray(arr) ? arr : [arr])
        .map(x => normalizeFilterText(x).replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      if (cleanArr.length === 0) return;
      const key = cleanArr.join('|');
      if (!seenSplitKeys.has(key)) {
        seenSplitKeys.add(key);
        extraSplits.push(cleanArr);
      }
    };

    const lawTerms = getSpecialLawSearchTerms(clean);
    const withoutParens = clean.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    const parenTerms = [];
    for (const pm of clean.matchAll(/\(([^()]{3,35})\)/g)) {
      const pt = pm[1].replace(/\s+/g, ' ').trim();
      if (pt && pt.length >= 3 && !isOnlyGenericWords(pt) && !parenTerms.includes(pt)) {
        parenTerms.push(pt);
      }
    }

    // Se o título do Bizu contiver travessão ou dois-pontos (-, –, :), prioriza primeiro a parte esquerda específica (quando não genérica) e também a parte direita
    const dashParts = String(subtopic || '')
      .split(/\s*[-–—:]\s*/)
      .map(p => normalizeFilterText(p).replace(/\bademi\b/g, 'administracao').replace(/\badm\b/g, 'administracao').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (dashParts.length > 1) {
      const leftIsGeneric = isOnlyGenericWords(dashParts[0]) || LEADING_INDEX_FILLER_REGEX.test(dashParts[0]);
      if (!leftIsGeneric && dashParts[0].length >= 3) {
        pushPrimary(dashParts[0]);
        const leftNoParen = dashParts[0].replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
        if (leftNoParen && leftNoParen !== dashParts[0] && !isOnlyGenericWords(leftNoParen)) {
          pushPrimary(leftNoParen);
        }
      }
      const rightJoined = dashParts.slice(1).join(' ').trim();
      if (rightJoined.length >= 3 && !isOnlyGenericWords(rightJoined)) {
        pushPrimary(rightJoined);
      }
    }

    pushPrimary(clean);
    if (withoutParens && withoutParens !== clean && withoutParens.length >= 3 && !isOnlyGenericWords(withoutParens)) {
      pushPrimary(withoutParens);
    }

    // Remove prefixo descritivo/comparativo (ex.: "Espécies de Descentralização" -> "descentralizacao")
    const descriptivePrefixRegex = /^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o)\s+entre|comparativo\s+(?:entre|de|da|do)|quadro\s+comparativo\s+(?:entre|de|da|do)|rela[cç][aã]o\s+entre|conceitos?\s+e\s+caracter[ií]sticas\s+(?:de|da|do|dos|das)|conceitos?|nocoes|definicoes|definicao|especies|formas|tipos|classificacao|caracteristicas|atributos|elementos|requisitos|regras|modalidades|principios|aspectos|estudo|teoria\s+geral)\s+(?:de|da|do|dos|das|sobre|entre)?\s*/i;
    const prefixLessCandidates = [];
    for (const candidate of [clean, withoutParens]) {
      if (!candidate) continue;
      const withoutPrefix = candidate.replace(descriptivePrefixRegex, '').trim();
      if (withoutPrefix && withoutPrefix !== candidate && withoutPrefix.length >= 4 && !isOnlyGenericWords(withoutPrefix)) {
        pushPrimary(withoutPrefix);
        if (!prefixLessCandidates.includes(withoutPrefix)) prefixLessCandidates.push(withoutPrefix);
      }
    }

    // Remove qualificador genérico final da disciplina (ex.: "desconcentracao administrativa" -> "desconcentracao")
    const trailingSubjectQualifierRegex = /\s+(?:administrativa|administrativo|publica|publico|constitucional|penal|processual|civil|especial|geral|gerais)$/i;
    for (const candidate of [clean, withoutParens, ...prefixLessCandidates]) {
      if (!candidate) continue;
      const withoutSuffix = candidate.replace(trailingSubjectQualifierRegex, '').trim();
      if (withoutSuffix && withoutSuffix !== candidate && withoutSuffix.length >= 4 && !isOnlyGenericWords(withoutSuffix)) {
        pushPrimary(withoutSuffix);
      }
    }

    if (lawTerms.length === 0) {
      parenTerms.forEach(pt => {
        pushPrimary(pt);
        pushSplit([pt]);
      });
      for (const candidate of [withoutParens, ...prefixLessCandidates, clean]) {
        if (!candidate) continue;
        const prepMatch = candidate.match(/^(.+?)\s+(?:por|em|nos?|nas?|quanto\s+a)\s+(.+)$/i);
        if (prepMatch) {
          const coreConcept = prepMatch[1].trim();
          if (coreConcept.length >= 5 && !isOnlyGenericWords(coreConcept)) {
            pushPrimary(coreConcept);
            pushSplit([coreConcept]);
          }
        }
      }
    }

    // Enumerações em títulos de Bizus (ex.: "1. Desconcentração e Descentralização", "Internet, Intranet e Extranet")
    if (lawTerms.length === 0) {
      const enumItems = extractEnumeratedSubitemsFromLesson(subtopic);
      if (enumItems.length >= 2) {
        enumItems.forEach(item => {
          pushPrimary(item);
          pushSplit([item]);
        });
      }
    }

    if (clean.includes('administracao publica direta e indireta')) {
      pushPrimary('administracao direta e indireta');
    }
    if (clean.includes('teoria do orgao')) {
      pushPrimary('orgaos publicos');
      pushPrimary('orgao publico');
    }
    if (clean.includes('terceiro setor')) {
      pushPrimary('terceiro setor');
      pushPrimary('entidades paraestatais');
      pushPrimary('paraestatais');
    }
    if (clean.includes('por servico')) {
      pushPrimary('outorga');
      pushPrimary('descentralizacao por servico');
    }
    if (clean.includes('por colaboracao')) {
      pushPrimary('delegacao');
      pushPrimary('descentralizacao por colaboracao');
    }
    if (clean.includes('ministerios')) {
      pushPrimary('ministerios');
    }
    if (clean.includes('poder regulamentar')) {
      pushPrimary('poder normativo');
      pushSplit(['poder normativo']);
    } else if (clean.includes('poder normativo')) {
      pushPrimary('poder regulamentar');
      pushSplit(['poder regulamentar']);
    }
    if (/\bnavegador(?:es)?\b/.test(clean)) {
      pushPrimary('browsers');
    } else if (/\bbrowsers?\b/.test(clean)) {
      pushPrimary('navegadores');
    }
    if (clean.includes('correio eletronico')) {
      pushPrimary('e-mail');
      pushPrimary('webmail');
    } else if (/\b(?:e-?mail|webmail)\b/.test(clean)) {
      pushPrimary('correio eletronico');
    }
    if (clean.includes('computacao em nuvem')) {
      pushPrimary('cloud computing');
    } else if (clean.includes('cloud computing')) {
      pushPrimary('computacao em nuvem');
    }
    if (clean.includes('copia de seguranca')) {
      pushPrimary('backup');
    } else if (/\bbackup\b/.test(clean)) {
      pushPrimary('copia de seguranca');
    }
    if (clean.includes('excludentes de ilicitude') || clean.includes('excludente de ilicitude')) {
      pushPrimary('exclusao da ilicitude');
      pushPrimary('causas de exclusao da ilicitude');
    } else if (clean.includes('exclusao da ilicitude')) {
      pushPrimary('excludentes de ilicitude');
    }
    if (clean.includes('concurso de pessoas')) {
      pushPrimary('coautoria e participacao');
    } else if (clean.includes('coautoria') && clean.includes('participacao')) {
      pushPrimary('concurso de pessoas');
    }

    if (lawTerms.length > 0) {
      if (/\beca\b/.test(clean)) {
        pushPrimary(clean.replace(/\beca\b/g, 'estatuto da crianca e do adolescente'));
        if (/\bcrimes?\b/.test(clean)) {
          pushPrimary('crimes contra a crianca e o adolescente');
        }
      } else if (/\bctb\b/.test(clean)) {
        pushPrimary(clean.replace(/\bctb\b/g, 'codigo de transito brasileiro'));
      } else if (/\blep\b/.test(clean)) {
        pushPrimary(clean.replace(/\blep\b/g, 'lei de execucao penal'));
      } else if (/\blia\b/.test(clean)) {
        pushPrimary(clean.replace(/\blia\b/g, 'improbidade administrativa'));
      }
      lawTerms.forEach(t => {
        pushPrimary(t);
        pushSplit([t]);
      });
    }

    // Se o subtópico combina 2 conceitos-chave de edital, gera buscas específicas adicionais caso apareçam separados no Caveira
    if (clean.includes('direta') && clean.includes('indireta')) {
      pushSplit(['administracao direta']);
      pushSplit(['administracao indireta']);
    }
    if (clean.includes('desconcentracao') && (clean.includes('descentralizacao') || clean.includes('orgao'))) {
      pushSplit(['desconcentracao']);
      if (clean.includes('descentralizacao')) pushSplit(['descentralizacao']);
      if (clean.includes('orgao')) pushSplit(['orgaos publicos', 'teoria do orgao']);
    } else if (clean.includes('concentracao') && clean.includes('descentralizacao')) {
      pushSplit(['concentracao', 'centralizacao']);
      pushSplit(['descentralizacao']);
    }
    if (clean.includes('terceiro setor') && clean.includes('entidades')) {
      pushSplit(['terceiro setor', 'paraestatais']);
    }

    return { primary, splitFallbacks: extraSplits };
  }

  function findScrollableMenuElement(filterInput) {
    const container = getMenuContainer(filterInput);
    if (!container) return null;
    const candidates = [container, ...Array.from(container.querySelectorAll('div, ul, section'))];
    for (const el of candidates) {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud')) continue;
      if ((el.scrollHeight || 0) > (el.clientHeight || 0) + 8) {
        return el;
      }
    }
    return container;
  }

  function buildTreeCacheHash(options) {
    const list = Array.isArray(options) ? options : [];
    const first = list[0]?.norm || '';
    const last = list[list.length - 1]?.norm || '';
    return `${list.length}:${first}:${last}`;
  }

  function loadSubjectTreeCache(subjectName) {
    return new Promise((resolve) => {
      try {
        const key = normalizeCourseIndexKey(subjectName || '');
        if (!key || !isExtensionContextValid() || !chrome?.storage?.local) {
          resolve(null);
          return;
        }
        chrome.storage.local.get([SUBJECT_TREE_CACHE_KEY], (res) => {
          const store = (res && res[SUBJECT_TREE_CACHE_KEY] && typeof res[SUBJECT_TREE_CACHE_KEY] === 'object')
            ? res[SUBJECT_TREE_CACHE_KEY]
            : {};
          const entry = store[key];
          const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
          if (entry && Array.isArray(entry.nodes) && entry.nodes.length > 0 && (Date.now() - (entry.scannedAt || 0)) < maxAgeMs) {
            resolve(entry);
            return;
          }
          resolve(null);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  function saveSubjectTreeCache(subjectName, options) {
    try {
      const key = normalizeCourseIndexKey(subjectName || '');
      if (!key || !Array.isArray(options) || options.length < 3 || !isExtensionContextValid() || !chrome?.storage?.local) return;
      const treeMatcher = (typeof globalThis !== 'undefined' && globalThis.QGCaveiraTreeMatcher) ? globalThis.QGCaveiraTreeMatcher : null;
      const nonLeafNodes = options
        .filter(o => !treeMatcher || !treeMatcher.isLeafArticleLabel(o.label))
        .map(o => ({ label: o.label, norm: o.norm }));
      if (nonLeafNodes.length < 2) return;
      chrome.storage.local.get([SUBJECT_TREE_CACHE_KEY], (res) => {
        if (chrome.runtime?.lastError) return;
        const store = (res && res[SUBJECT_TREE_CACHE_KEY] && typeof res[SUBJECT_TREE_CACHE_KEY] === 'object')
          ? { ...res[SUBJECT_TREE_CACHE_KEY] }
          : {};
        store[key] = {
          subjectName,
          scannedAt: Date.now(),
          hash: buildTreeCacheHash(nonLeafNodes),
          nodes: nonLeafNodes
        };
        const entries = Object.entries(store);
        const payload = entries.length > 35
          ? Object.fromEntries(entries.sort((a, b) => (b[1]?.scannedAt || 0) - (a[1]?.scannedAt || 0)).slice(0, 35))
          : store;
        chrome.storage.local.set({ [SUBJECT_TREE_CACHE_KEY]: payload }, () => {
          void chrome.runtime?.lastError;
        });
      });
    } catch (_) {}
  }

  async function collectAllDropdownOptionsByScroll(filterInput, subjectName = '') {
    if (!filterInput) return { options: [], scrollSteps: 0, isVirtualized: false, fromCache: false };
    try {
      if (filterInput.value) {
        filterInput.focus();
        setNativeInputValue(filterInput, '');
        await sleepMs(260);
      }
    } catch (_) {}

    const initialVisible = findDropdownOptionElements(filterInput);
    const firstVisibleNorm = initialVisible[0] ? normalizeCourseIndexKey(initialVisible[0].innerText || initialVisible[0].textContent) : '';

    if (subjectName) {
      const cached = await loadSubjectTreeCache(subjectName);
      if (cached && Array.isArray(cached.nodes) && cached.nodes.length >= 3) {
        const cachedFirst = cached.nodes[0]?.norm || '';
        if (!firstVisibleNorm || !cachedFirst || firstVisibleNorm === cachedFirst) {
          return {
            options: cached.nodes.map(n => ({ label: n.label, norm: n.norm, el: null })),
            scrollSteps: 0,
            isVirtualized: true,
            fromCache: true
          };
        }
      }
    }

    const collected = new Map();
    const collectVisible = () => {
      const visible = findDropdownOptionElements(filterInput);
      for (const el of visible) {
        const label = String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        const norm = normalizeCourseIndexKey(label);
        if (!norm) continue;
        if (!collected.has(norm)) {
          collected.set(norm, { label, norm, el });
        } else {
          const prev = collected.get(norm);
          if (!prev.el || !prev.el.isConnected) prev.el = el;
        }
      }
      return visible.length;
    };

    collectVisible();
    const scrollEl = findScrollableMenuElement(filterInput);
    let scrollSteps = 0;
    let isVirtualized = false;

    if (scrollEl && (scrollEl.scrollHeight || 0) > (scrollEl.clientHeight || 0) + 8) {
      const stepPx = Math.max(120, Math.floor((scrollEl.clientHeight || 240) * 0.75));
      const maxScrollTop = Math.max(0, (scrollEl.scrollHeight || 0) - (scrollEl.clientHeight || 0));
      let prevTop = -1;
      let curTop = scrollEl.scrollTop || 0;

      for (let i = 0; i < 45 && curTop < maxScrollTop - 2; i++) {
        if (isDestroyed) break;
        const nextTop = Math.min(maxScrollTop, curTop + stepPx);
        if (nextTop === prevTop || nextTop === curTop) break;
        prevTop = curTop;
        scrollEl.scrollTop = nextTop;
        scrollSteps += 1;
        await sleepMs(55);
        collectVisible();
        curTop = scrollEl.scrollTop || nextTop;
      }

      try {
        scrollEl.scrollTop = 0;
        await sleepMs(40);
      } catch (_) {}

      for (const entry of collected.values()) {
        if (!entry.el || !entry.el.isConnected) {
          isVirtualized = true;
          break;
        }
      }
    }

    const finalOptions = Array.from(collected.values());
    if (subjectName && finalOptions.length >= 3) {
      saveSubjectTreeCache(subjectName, finalOptions);
    }

    return {
      options: finalOptions,
      scrollSteps,
      isVirtualized,
      fromCache: false
    };
  }

  function readAppliedFiltersFromDom() {
    const result = { status: '', disciplina: '', assuntos: [] };
    const appliedInfo = findAppliedFiltersSection();
    if (!appliedInfo || !appliedInfo.container) return result;

    const cleanChipText = (raw) => String(raw || '')
      .replace(/\b(close|cancel|clear|highlight_off)\b/gi, ' ')
      .replace(/[✕×]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const blocks = Array.from(appliedInfo.container.querySelectorAll('div, span, li, p'))
      .filter(el => el && !el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') && isElementVisible(el));

    const seenAssuntos = new Set();
    for (const block of blocks) {
      const rawText = String(block.innerText || block.textContent || '').replace(/\s+/g, ' ').trim();
      const strippedRaw = rawText.replace(/^(?:close|cancel|clear|highlight_off|✕|×|x)\s+/i, '').trim();
      const norm = normalizeFilterText(strippedRaw);
      if (!norm || norm === 'filtros aplicados' || norm === 'filtros aplicados:') continue;

      if (/^disciplina\b/.test(norm) && strippedRaw.length < 180) {
        const val = cleanChipText(strippedRaw.replace(/^disciplina\s*:?\s*/i, ''));
        if (val && !result.disciplina) result.disciplina = val;
      } else if (/^status\b/.test(norm) && strippedRaw.length < 100) {
        const val = cleanChipText(strippedRaw.replace(/^status\s*:?\s*/i, ''));
        if (val && !result.status) result.status = val;
      } else if (/^assunto\b/.test(norm) && strippedRaw.length < 360) {
        const childChips = Array.from(block.querySelectorAll('.q-chip, [class*="chip"], [class*="badge"], [class*="tag"], button, span, div'))
          .filter(ch => {
            if (!ch || ch === block || !isElementVisible(ch)) return false;
            const ct = cleanChipText(ch.innerText || ch.textContent);
            const cn = normalizeFilterText(ct);
            if (!cn || cn === 'assunto' || cn.startsWith('assunto ') || cn.length < 3) return false;
            return ch.children.length <= 2;
          })
          .map(ch => cleanChipText(ch.innerText || ch.textContent))
          .filter(Boolean);

        if (childChips.length > 0) {
          for (const chip of childChips) {
            const cn = normalizeCourseIndexKey(chip);
            if (cn && !seenAssuntos.has(cn)) {
              seenAssuntos.add(cn);
              result.assuntos.push(chip);
            }
          }
        } else {
          const val = cleanChipText(strippedRaw.replace(/^assunto\s*:?\s*/i, ''));
          const vn = normalizeCourseIndexKey(val);
          if (vn && !seenAssuntos.has(vn)) {
            seenAssuntos.add(vn);
            result.assuntos.push(val);
          }
        }
      }
    }

    return result;
  }

  function buildFilterMemoryKeys(subject, lessonsList, fallbackTopic) {
    const keys = [];
    const pushKey = (raw) => {
      const k = normalizeCourseIndexKey(raw);
      if (k && !keys.includes(k)) keys.push(k);
    };
    const subjNorm = normalizeFilterText(subject || '');
    const lessons = Array.isArray(lessonsList) ? lessonsList.filter(Boolean) : [];
    const combined = lessons.join(' | ') || String(fallbackTopic || '').trim();
    if (combined) {
      if (subjNorm) pushKey(`${subjNorm}::${combined}`);
      pushKey(combined);
    }
    for (const l of lessons) {
      if (subjNorm) pushKey(`${subjNorm}::${l}`);
      pushKey(l);
    }
    if (fallbackTopic) {
      if (subjNorm) pushKey(`${subjNorm}::${fallbackTopic}`);
      pushKey(fallbackTopic);
    }
    return keys;
  }

  function loadFilterCorrectionMemory(subject, lessonsList, fallbackTopic) {
    return new Promise((resolve) => {
      try {
        if (!isExtensionContextValid() || !chrome?.storage?.local) {
          resolve(null);
          return;
        }
        const keys = buildFilterMemoryKeys(subject, lessonsList, fallbackTopic);
        if (keys.length === 0) {
          resolve(null);
          return;
        }
        chrome.storage.local.get([FILTER_CORRECTION_MEMORY_KEY], (res) => {
          const store = (res && res[FILTER_CORRECTION_MEMORY_KEY] && typeof res[FILTER_CORRECTION_MEMORY_KEY] === 'object')
            ? res[FILTER_CORRECTION_MEMORY_KEY]
            : {};
          for (const k of keys) {
            if (store[k] && Array.isArray(store[k].assuntos) && store[k].assuntos.length > 0) {
              resolve({ key: k, ...store[k] });
              return;
            }
          }
          resolve(null);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  function saveFilterCorrectionMemory(filterCtx, appliedFilters) {
    try {
      if (!isExtensionContextValid() || !chrome?.storage?.local) return;
      if (!filterCtx || !appliedFilters || !Array.isArray(appliedFilters.assuntos) || appliedFilters.assuntos.length === 0) return;

      const effectiveSubject = appliedFilters.disciplina || filterCtx.subject || '';
      const keys = buildFilterMemoryKeys(effectiveSubject, filterCtx.lessons, filterCtx.fallbackTopic);
      if (keys.length === 0) return;

      const primaryKey = keys[0];
      chrome.storage.local.get([FILTER_CORRECTION_MEMORY_KEY], (res) => {
        const store = (res && res[FILTER_CORRECTION_MEMORY_KEY] && typeof res[FILTER_CORRECTION_MEMORY_KEY] === 'object')
          ? { ...res[FILTER_CORRECTION_MEMORY_KEY] }
          : {};
        store[primaryKey] = {
          subject: effectiveSubject,
          assuntos: appliedFilters.assuntos.slice(0, 12),
          lessonTitle: filterCtx.topic || filterCtx.fallbackTopic || '',
          updatedAt: Date.now()
        };
        const entries = Object.entries(store);
        if (entries.length > 300) {
          entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0));
          const trimmed = Object.fromEntries(entries.slice(0, 300));
          chrome.storage.local.set({ [FILTER_CORRECTION_MEMORY_KEY]: trimmed });
        } else {
          chrome.storage.local.set({ [FILTER_CORRECTION_MEMORY_KEY]: store });
        }
      });
    } catch (_) {}
  }

  async function loadCaveiraTree() {
    if (cachedCaveiraTree) return cachedCaveiraTree;
    const resolver = (typeof globalThis !== 'undefined' && globalThis.QGCaveiraResolver) ? globalThis.QGCaveiraResolver : null;
    if (!resolver || !isExtensionContextValid() || !chrome?.runtime?.getURL) return null;
    try {
      const url = chrome.runtime.getURL('caveira_arvore.json');
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const json = await resp.json();
      let dynamicNodes = [];
      try {
        if (chrome.runtime?.sendMessage) {
          const overlayResp = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'DB_GET_TREE_OVERLAY' }, (r) => {
              if (chrome.runtime?.lastError) resolve(null);
              else resolve(r);
            });
          });
          if (overlayResp?.ok && Array.isArray(overlayResp.nodes)) {
            dynamicNodes = overlayResp.nodes;
          }
        }
      } catch (_) {}
      const { mergedJson } = mergeBaselineAndDynamicTree(json, dynamicNodes);
      cachedCaveiraTreeGeradoEm = String(mergedJson?.geradoEm || json?.geradoEm || '');
      cachedCaveiraTree = resolver.loadTree(mergedJson);
      return cachedCaveiraTree;
    } catch (_) {
      return null;
    }
  }

  function buildFilterIdMemoryKey(subject, lessonsList, fallbackTopic) {
    const subjNorm = normalizeCourseIndexKey(subject || '');
    const lessonsNorm = (Array.isArray(lessonsList) ? lessonsList : []).map(normalizeCourseIndexKey).filter(Boolean).join('|');
    const topicNorm = normalizeCourseIndexKey(fallbackTopic || '');
    return `${subjNorm}::${lessonsNorm}::${topicNorm}`;
  }

  function loadFilterIdMemory(subject, lessonsList, fallbackTopic) {
    return new Promise((resolve) => {
      try {
        if (!isExtensionContextValid() || !chrome?.storage?.local) {
          resolve(null);
          return;
        }
        const primaryKey = buildFilterIdMemoryKey(subject, lessonsList, fallbackTopic);
        const fallbackKey = buildFilterIdMemoryKey(subject, lessonsList, '');
        chrome.storage.local.get([FILTER_ID_MEMORY_KEY], (res) => {
          if (chrome.runtime?.lastError) {
            resolve(null);
            return;
          }
          const store = (res && res[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === 'object')
            ? res[FILTER_ID_MEMORY_KEY]
            : {};
          const entry = store[primaryKey] || store[fallbackKey] || null;
          if (entry && entry.subjectId && Array.isArray(entry.ids) && entry.ids.length > 0) {
            resolve({ key: store[primaryKey] ? primaryKey : fallbackKey, ...entry });
            return;
          }
          resolve(null);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }

  function saveFilterIdMemory(filterCtx, data) {
    try {
      if (!isExtensionContextValid() || !chrome?.storage?.local || !filterCtx || !data) return;
      const subjectId = Number(data.subjectId);
      const ids = Array.isArray(data.ids) ? data.ids.map(Number).filter(n => Number.isFinite(n) && n > 0) : [];
      if (!subjectId || ids.length === 0) return;

      const key = buildFilterIdMemoryKey(
        filterCtx.subject || data.subjectName || '',
        filterCtx.lessons || [],
        filterCtx.fallbackTopic || ''
      );
      chrome.storage.local.get([FILTER_ID_MEMORY_KEY], (res) => {
        if (chrome.runtime?.lastError) return;
        const store = (res && res[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === 'object')
          ? { ...res[FILTER_ID_MEMORY_KEY] }
          : {};
        store[key] = {
          subjectId,
          subjectName: data.subjectName || filterCtx.subject || '',
          ids,
          picks: Array.isArray(data.picks) ? data.picks : [],
          lessonTitle: filterCtx.topic || filterCtx.fallbackTopic || '',
          updatedAt: Date.now()
        };
        const entries = Object.entries(store);
        const payload = entries.length > 400
          ? Object.fromEntries(entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0)).slice(0, 400))
          : store;
        chrome.storage.local.set({ [FILTER_ID_MEMORY_KEY]: payload }, () => {
          void chrome.runtime?.lastError;
        });
      });
    } catch (_) {}
  }

  async function resolveIdsFromUrlOrDom(appliedDom) {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const rawSubj = params.get('subject_ids') || '';
      const rawIds = params.get('subtopic_ids') || '';
      const subjectId = Number(rawSubj.split(',')[0]);
      const urlIds = rawIds.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
      if (subjectId && urlIds.length > 0) {
        const tree = await loadCaveiraTree();
        const subjObj = tree?.subjects?.get(subjectId);
        const picks = urlIds.map(id => {
          const n = subjObj?.byId?.get(id);
          return n ? { id, name: n.name, path: n.path || [n.name] } : { id, name: String(id), path: [] };
        });
        return { subjectId, subjectName: subjObj?.name || appliedDom?.disciplina || '', ids: urlIds, picks };
      }

      if (appliedDom && appliedDom.assuntos && appliedDom.assuntos.length > 0) {
        const tree = await loadCaveiraTree();
        if (tree) {
          const resolver = globalThis.QGCaveiraResolver;
          const discNorm = normalizeCourseIndexKey(appliedDom.disciplina || '');
          let subjObj = null;
          for (const s of tree.subjects.values()) {
            if (normalizeCourseIndexKey(s.name) === discNorm) {
              subjObj = s;
              break;
            }
          }
          if (!subjObj && resolver) {
            const tempRes = resolver.resolveLesson(tree, { subjectName: appliedDom.disciplina || '', lessons: [], topic: '', subtopics: [] });
            if (tempRes?.subject?.id) subjObj = tree.subjects.get(tempRes.subject.id) || null;
          }
          if (subjObj) {
            const picks = [];
            for (const label of appliedDom.assuntos) {
              const lNorm = normalizeCourseIndexKey(label);
              const found = subjObj.nodes.find(n => normalizeCourseIndexKey(n.name) === lNorm);
              if (found) picks.push({ id: found.id, name: found.name, path: found.path || [found.name] });
            }
            if (picks.length > 0) {
              return { subjectId: subjObj.id, subjectName: subjObj.name, ids: picks.map(p => p.id), picks };
            }
          }
        }
      }
    } catch (_) {}
    return null;
  }

  async function getEffectiveQuestionPrefs(filterCtx) {
    const resolver = (typeof globalThis !== 'undefined' && globalThis.QGCaveiraResolver) ? globalThis.QGCaveiraResolver : null;
    const fromSite = filterCtx && (Array.isArray(filterCtx.examBoards) || Array.isArray(filterCtx.numberAlternatives));
    if (fromSite) {
      // site novo: array vazio = "sem filtro" explícito
      return { examBoards: filterCtx.examBoards || [], numberAlternatives: filterCtx.numberAlternatives || [], source: 'site' };
    }
    const fallback = resolver?.DEFAULT_PREFS || { examBoards: [], numberAlternatives: [] };
    try {
      if (isExtensionContextValid() && chrome?.storage?.local) {
        const saved = await new Promise((res) => chrome.storage.local.get([DEFAULT_PREFS_KEY], (r) => res(r?.[DEFAULT_PREFS_KEY] || null)));
        if (saved && (Array.isArray(saved.examBoards) || Array.isArray(saved.numberAlternatives))) {
          return { examBoards: saved.examBoards || [], numberAlternatives: saved.numberAlternatives || [], source: 'popup' };
        }
      }
    } catch (_) {}
    return { examBoards: fallback.examBoards, numberAlternatives: fallback.numberAlternatives, source: 'padrao' };
  }

  async function navigateToCaveiraDeepLink(subjectId, ids, bannerText) {
    const resolver = (typeof globalThis !== 'undefined' && globalThis.QGCaveiraResolver) ? globalThis.QGCaveiraResolver : null;
    if (!resolver || !subjectId || !Array.isArray(ids) || ids.length === 0) return false;
    const prefs = await getEffectiveQuestionPrefs(activePracticeFilter);
    const url = resolver.buildUrl(window.location.origin, subjectId, ids, { status: 'not_resolved', examBoards: prefs.examBoards, numberAlternatives: prefs.numberAlternatives });
    const prefsLabel = resolver.describePrefs ? resolver.describePrefs(prefs.examBoards, prefs.numberAlternatives) : '';
    if (bannerText && prefsLabel) bannerText = `${bannerText} • ${prefsLabel}`;
    if (lastFilterDiagnosticLog) { lastFilterDiagnosticLog.examBoards = prefs.examBoards; lastFilterDiagnosticLog.numberAlternatives = prefs.numberAlternatives; lastFilterDiagnosticLog.prefsSource = prefs.source; lastFilterDiagnosticLog.url = url; }
    try {
      if (isExtensionContextValid() && chrome?.storage?.local) {
        await new Promise((res) => {
          chrome.storage.local.set({
            [LAST_FILTER_DIAG_KEY]: {
              savedAt: Date.now(),
              diagLog: lastFilterDiagnosticLog,
              activePracticeFilter,
              bannerText: bannerText || ''
            }
          }, () => res());
        });
      }
    } catch (_) {}
    if (bannerText) renderFilterBanner(bannerText);
    window.location.assign(url);
    return true;
  }

  function renderResolverAlternativesBox(res, filterCtx) {
    const box = getHudEl('qg-hud-resolver-box');
    const titleEl = getHudEl('qg-hud-resolver-title');
    const listEl = getHudEl('qg-hud-resolver-list');
    if (!box || !titleEl || !listEl) return;

    pendingResolverResult = res;
    let alts = Array.isArray(res?.alternatives) ? res.alternatives : [];
    let fromPicks = false;
    if (alts.length === 0 && Array.isArray(res?.picks) && res.picks.length > 0) {
      alts = res.picks.map(p => ({ id: p.id, name: p.name, path: p.path }));
      fromPicks = true;
    }
    const subjName = res?.subject?.name || filterCtx?.subject || '';

    if (alts.length === 0) {
      titleEl.textContent = `⚠️ Não foi possível decidir automaticamente${subjName ? ` (${subjName})` : ''}.`;
      listEl.innerHTML = `<div style="color:#cbd5e1;font-size:10px;">Nenhuma alternativa segura encontrada para "${escapeHtml(filterCtx?.topic || '')}".</div>`;
      const applyAltBtn = box.querySelector('#qg-btn-apply-alt');
      if (applyAltBtn) applyAltBtn.style.display = 'none';
    } else {
      const applyAltBtn = box.querySelector('#qg-btn-apply-alt');
      if (applyAltBtn) applyAltBtn.style.display = 'block';
      titleEl.textContent = res?.anchorAmbiguous
        ? `⚠️ Múltiplas pastas compatíveis (${subjName}). Escolha:`
        : `⚠️ Confiança ${res?.confidence || 'baixa'} (${subjName}). Escolha:`;
      listEl.innerHTML = alts.map((alt, idx) => {
        const fullPath = Array.isArray(alt.path) && alt.path.length > 0 ? alt.path.join(' › ') : alt.name;
        return `
          <label style="display:flex;align-items:flex-start;gap:6px;padding:4px 6px;border-radius:6px;background:rgba(15,23,42,0.7);border:1px solid rgba(255,255,255,0.08);cursor:pointer;">
            <input type="checkbox" data-subtopic-id="${Number(alt.id)}" data-subject-id="${Number(res?.subject?.id || 0)}" ${(fromPicks || (idx === 0 && alts.length === 1)) ? 'checked' : ''} style="margin-top:2px;flex-shrink:0;" />
            <span style="display:flex;flex-direction:column;gap:1px;line-height:1.25;">
              <strong style="color:#f8fafc;font-size:10px;">${escapeHtml(alt.name)}</strong>
              <span style="color:#94a3b8;font-size:9px;">${escapeHtml(fullPath)}</span>
            </span>
          </label>
        `;
      }).join('');
    }
    box.style.display = 'flex';
  }

  function setupManualFilterCorrectionListener() {
    if (typeof document === 'undefined' || !document.addEventListener) return;
    const onDocClick = (e) => {
      if (isDestroyed || isApplyingFilter || !activePracticeFilter) return;
      const target = e.target;
      if (!target || isEventInsideHud(e)) return;
      const btn = target.closest ? target.closest('button, [role="button"], .q-btn') : null;
      if (!btn) return;
      const txt = normalizeFilterText(btn.innerText || btn.textContent);
      const allowed = ['filtrar', 'filtrar questoes', 'aplicar', 'aplicar filtros', 'buscar', 'buscar questoes', 'pesquisar'];
      if (!allowed.includes(txt)) return;

      const ctxSnapshot = { ...activePracticeFilter };
      setTimeout(async () => {
        if (isDestroyed || isApplyingFilter) return;
        const applied = readAppliedFiltersFromDom();
        const resolvedIds = await resolveIdsFromUrlOrDom(applied);
        if (resolvedIds && resolvedIds.subjectId && resolvedIds.ids.length > 0) {
          saveFilterIdMemory(ctxSnapshot, resolvedIds);
          if (lastFilterDiagnosticLog) {
            lastFilterDiagnosticLog.manualCorrectionSaved = {
              savedAt: new Date().toISOString(),
              subjectId: resolvedIds.subjectId,
              ids: resolvedIds.ids,
              picks: resolvedIds.picks
            };
          }
          renderFilterBanner(`💾 Correção memorizada (${resolvedIds.ids.length} ID(s)): ${ctxSnapshot.topic || ctxSnapshot.subject}`);
        } else if (applied.assuntos && applied.assuntos.length > 0) {
          saveFilterCorrectionMemory(ctxSnapshot, applied);
          renderFilterBanner(`💾 Correção memorizada (${applied.assuntos.length} assunto(s)): ${ctxSnapshot.topic || ctxSnapshot.subject}`);
        }
      }, 450);
    };
    document.addEventListener('click', onDocClick, true);
    window.addEventListener('qg-caveira-teardown', () => {
      document.removeEventListener('click', onDocClick, true);
    }, { once: true });
  }
  setupManualFilterCorrectionListener();

  async function matchOptionInOpenDropdown(filterInput, searchTerms, opts = {}) {
    const forbiddenNorms = opts.forbiddenNorms instanceof Set ? opts.forbiddenNorms : null;
    const excludeNorms = opts.excludeNorms instanceof Set ? opts.excludeNorms : null;
    const minScore = typeof opts.minScore === 'number' ? opts.minScore : 200;
    const allowEmptyFallback = opts.allowEmptyFallback !== false;
    const preScannedOptions = Array.isArray(opts.preScannedOptions) ? opts.preScannedOptions : null;
    const diagLog = opts.diagLog && Array.isArray(opts.diagLog.queries) ? opts.diagLog : null;

    let matched = null;
    let bestScore = 0;

    // 1. Varredura local na árvore completa coletada (evita falhas de acentuação/busca parcial do site)
    if (preScannedOptions && preScannedOptions.length > 0) {
      const scored = [];
      let bestEntry = null;
      for (const entry of preScannedOptions) {
        if (!entry || !entry.norm) continue;
        if (forbiddenNorms && forbiddenNorms.has(entry.norm)) continue;
        if (excludeNorms && excludeNorms.has(entry.norm)) continue;
        const sc = scoreOptionMatch(entry.label, searchTerms, opts);
        if (sc > 0) scored.push({ label: entry.label, score: sc });
        if (sc > bestScore) {
          bestScore = sc;
          bestEntry = entry;
        }
      }
      scored.sort((a, b) => b.score - a.score);
      if (diagLog) {
        diagLog.queries.push({
          source: opts.diagSource || 'tree-scan',
          terms: searchTerms.slice(0, 6),
          minScore,
          top5: scored.slice(0, 5),
          selected: (bestEntry && bestScore >= minScore) ? bestEntry.label : null
        });
      }
      if (bestEntry && bestScore >= minScore) {
        // Verifica primeiro no DOM visível atual (nós de virtual-scroll podem ser reciclados ao rolar)
        const liveOptions = findDropdownOptionElements(filterInput);
        const liveMatch = liveOptions.find(el => normalizeCourseIndexKey(el.innerText || el.textContent) === bestEntry.norm);
        if (liveMatch) return liveMatch;

        if (bestEntry.el && bestEntry.el.isConnected && normalizeCourseIndexKey(bestEntry.el.innerText || bestEntry.el.textContent) === bestEntry.norm) {
          return bestEntry.el;
        }

        if (filterInput) {
          const revealQuery = bestEntry.label.slice(0, 48).trim();
          filterInput.focus();
          setNativeInputValue(filterInput, revealQuery);
          await sleepMs(320);
          const visible = findDropdownOptionElements(filterInput);
          const exactEl = visible.find(el => normalizeCourseIndexKey(el.innerText || el.textContent) === bestEntry.norm);
          if (exactEl) return exactEl;
        }
      }
    }

    const typedTerms = (preScannedOptions && preScannedOptions.length > 0)
      ? searchTerms.filter(t => String(t || '').trim().split(/\s+/).length >= 2 || !(opts.targetConcepts && opts.targetConcepts.size >= 3)).slice(0, 2)
      : searchTerms;

    for (const term of typedTerms) {
      if (filterInput) {
        const accented = restoreCommonPortugueseAccents(term);
        const primaryQuery = (accented && accented !== term) ? accented : term;

        filterInput.focus();
        setNativeInputValue(filterInput, primaryQuery);
        await sleepMs(420);

        if (hasNoSearchResultsInMenu(filterInput) && primaryQuery !== term) {
          filterInput.focus();
          setNativeInputValue(filterInput, term);
          await sleepMs(420);
        }
      }

      if (filterInput && hasNoSearchResultsInMenu(filterInput)) {
        continue;
      }

      const options = findDropdownOptionElements(filterInput);
      bestScore = 0;
      matched = null;
      const typedScored = [];
      for (const opt of options) {
        const label = opt.innerText || opt.textContent;
        const optNorm = normalizeCourseIndexKey(label);
        if (!optNorm) continue;
        if (forbiddenNorms && forbiddenNorms.has(optNorm)) continue;
        if (excludeNorms && excludeNorms.has(optNorm)) continue;

        const sc = scoreOptionMatch(label, searchTerms, opts);
        if (sc > 0) typedScored.push({ label: String(label).replace(/\s+/g, ' ').trim(), score: sc });
        if (sc > bestScore) {
          bestScore = sc;
          matched = opt;
        }
      }
      if (diagLog && typedScored.length > 0) {
        typedScored.sort((a, b) => b.score - a.score);
        diagLog.queries.push({
          source: `${opts.diagSource || 'typed'}:${term}`,
          terms: [term],
          minScore,
          top5: typedScored.slice(0, 5),
          selected: (matched && bestScore >= minScore) ? String(matched.innerText || matched.textContent).replace(/\s+/g, ' ').trim() : null
        });
      }
      if (matched && bestScore >= minScore) break;
      matched = null;
    }

    if ((!matched || (filterInput && hasNoSearchResultsInMenu(filterInput))) && filterInput && allowEmptyFallback) {
      setNativeInputValue(filterInput, '');
      await sleepMs(320);
      const allOptions = findDropdownOptionElements(filterInput);
      let bestFallbackScore = 0;
      for (const opt of allOptions) {
        const optNorm = normalizeCourseIndexKey(opt.innerText || opt.textContent);
        if (!optNorm) continue;
        if (forbiddenNorms && forbiddenNorms.has(optNorm)) continue;
        if (excludeNorms && excludeNorms.has(optNorm)) continue;

        const sc = scoreOptionMatch(opt.innerText || opt.textContent, searchTerms, opts);
        if (sc > bestFallbackScore) {
          bestFallbackScore = sc;
          matched = opt;
        }
      }
      if (bestFallbackScore < Math.max(150, minScore)) matched = null;
    }

    return matched;
  }

  async function selectCaveiraDropdownOption(labelWord, searchTerms) {
    if (isDestroyed || !searchTerms || searchTerms.length === 0) return false;
    const trigger = findFilterDropdownTrigger(labelWord);
    if (!trigger) return false;

    clickElementRealistically(trigger);
    await sleepMs(320);

    let filterInput = findMenuFilterInput();
    if (!filterInput) {
      clickElementRealistically(trigger);
      await sleepMs(350);
      filterInput = findMenuFilterInput();
    }

    const matched = await matchOptionInOpenDropdown(filterInput, searchTerms);
    if (matched) {
      clickOptionRow(matched);
      await sleepMs(220);
    }

    await closeOpenDropdown(trigger, filterInput);
    await sleepMs(200);
    return Boolean(matched);
  }

  function isSpecialLegislationSubjectName(subjectName) {
    const norm = normalizeFilterText(subjectName);
    if (!norm) return false;
    return (
      norm === 'legislacao especial' ||
      norm === 'legislacao penal especial' ||
      norm === 'leis especiais' ||
      norm === 'leis penais especiais' ||
      norm === 'legislacao extravagante' ||
      norm === 'direito penal especial' ||
      norm === 'penal especial' ||
      (norm.includes('legislacao') && (norm.includes('especial') || norm.includes('extravagante')))
    );
  }

  async function selectCaveiraLessonsInDropdown(lessonsList, fallbackTopic, subtopicsList = [], subjectName = '', extraOpts = {}) {
    const validLessons = (Array.isArray(lessonsList) ? lessonsList : []).filter(Boolean);
    const validSubtopics = (Array.isArray(subtopicsList) ? subtopicsList : []).filter(Boolean);
    const savedMemoryAssuntos = Array.isArray(extraOpts.savedMemoryAssuntos) ? extraOpts.savedMemoryAssuntos.filter(Boolean) : [];
    const diagLog = extraOpts.diagLog || null;
    const hasFallback = Boolean(String(fallbackTopic || '').trim());
    if (isDestroyed || (validLessons.length === 0 && validSubtopics.length === 0 && savedMemoryAssuntos.length === 0 && !hasFallback)) return false;

    const trigger = findFilterDropdownTrigger('Assunto');
    if (!trigger) return false;

    clickElementRealistically(trigger);
    await sleepMs(320);

    let filterInput = findMenuFilterInput();
    if (!filterInput) {
      clickElementRealistically(trigger);
      await sleepMs(350);
      filterInput = findMenuFilterInput();
    }

    const treeScan = await collectAllDropdownOptionsByScroll(filterInput, subjectName);
    const preScannedOptions = treeScan.options || [];
    const treeMatcher = (typeof globalThis !== 'undefined' && globalThis.QGCaveiraTreeMatcher) ? globalThis.QGCaveiraTreeMatcher : null;
    const bm25Index = (treeMatcher && preScannedOptions.length > 0) ? treeMatcher.buildBm25Index(preScannedOptions) : null;
    if (diagLog) {
      diagLog.treeScan = {
        scannedCount: preScannedOptions.length,
        scrollSteps: treeScan.scrollSteps,
        isVirtualized: treeScan.isVirtualized,
        fromCache: Boolean(treeScan.fromCache),
        sampleOptions: preScannedOptions.slice(0, 60).map(o => o.label)
      };
    }

    let matchedCount = 0;
    const selectedOptionNorms = new Set();
    const coveredConcepts = new Set();

    const lessonTargetConcepts = new Set();
    const buildConceptSetFromSource = (text, preferRightDash = false) => {
      const conceptSet = new Set();
      const withoutSubject = stripSubjectFromLessonTitle(text, subjectName);
      const rawStr = String(withoutSubject || text || '')
        .replace(/\b(?:aula|parte|p[aá]gina|bloco|m[oó]dulo|cap[ií]tulo)\s*\d+\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, '')
        .trim();
      if (!rawStr) return conceptSet;
      let scopeText = rawStr;
      if (preferRightDash) {
        const dashParts = rawStr.split(/\s*[-–—:]\s*/).map(p => p.trim()).filter(Boolean);
        if (dashParts.length > 1) {
          const leftIsGeneric = isOnlyGenericWords(dashParts[0]) || LEADING_INDEX_FILLER_REGEX.test(dashParts[0]);
          const rightJoined = dashParts.slice(1).join(' ');
          if (leftIsGeneric && extractConceptWords(rightJoined).length > 0) {
            scopeText = rightJoined;
          }
        }
      }
      extractConceptWords(scopeText).forEach(c => conceptSet.add(c));
      return conceptSet;
    };
    const addConceptsFromSource = (text, preferRightDash = false) => {
      buildConceptSetFromSource(text, preferRightDash).forEach(c => lessonTargetConcepts.add(c));
    };
    if (validSubtopics.length > 0) {
      validSubtopics.forEach(sub => addConceptsFromSource(sub, true));
    } else {
      validLessons.forEach(lesson => addConceptsFromSource(lesson, true));
    }

    const mainContextText = [fallbackTopic, ...validLessons].filter(Boolean).join(' ');
    const mainLawIds = getMatchingSpecialLawIds(mainContextText);
    const subjectOwnLawIds = new Set(getMatchingSpecialLawIds(`${subjectName || ''} ${fallbackTopic === 'CTB' ? 'ctb' : ''}`.trim()));
    const isSpecialSubject = isSpecialLegislationSubjectName(subjectName);
    const mainLawTerms = (isSpecialSubject || !mainLawIds.every(id => subjectOwnLawIds.has(id)))
      ? getSpecialLawSearchTerms(mainContextText)
      : [];
    const allowedLawIds = mainLawIds.length > 0 ? new Set(mainLawIds) : null;

    const trySelectWithTerms = async (terms, matchOpts = {}) => {
      if (!terms || terms.length === 0) return false;
      const effectiveOpts = {
        ...matchOpts,
        ...(allowedLawIds ? { allowedLawIds } : {}),
        ...(matchOpts.targetConcepts !== undefined
          ? {}
          : (lessonTargetConcepts.size > 0 ? { targetConcepts: lessonTargetConcepts } : {})),
        excludeNorms: selectedOptionNorms,
        preScannedOptions,
        diagLog
      };
      const matched = await matchOptionInOpenDropdown(filterInput, terms, effectiveOpts);
      if (!matched) return false;
      const matchedLabel = matched.innerText || matched.textContent;
      const matchedNorm = normalizeCourseIndexKey(matchedLabel);
      if (matchedNorm && selectedOptionNorms.has(matchedNorm)) return false;
      if (matchedNorm) selectedOptionNorms.add(matchedNorm);
      extractConceptWords(matchedLabel).forEach(c => coveredConcepts.add(c));
      if (!isOptionRowChecked(matched)) {
        clickOptionRow(matched);
        matchedCount += 1;
        await sleepMs(180);
      } else {
        matchedCount += 1;
      }
      if (diagLog && Array.isArray(diagLog.selectedLabels)) {
        diagLog.selectedLabels.push(String(matchedLabel).replace(/\s+/g, ' ').trim());
      }
      return true;
    };

    const selectOptionByExactLabel = async (label, norm) => {
      if (!label || !norm || selectedOptionNorms.has(norm)) return false;
      const liveOptions = findDropdownOptionElements(filterInput);
      let targetEl = liveOptions.find(el => normalizeCourseIndexKey(el.innerText || el.textContent) === norm) || null;
      if (!targetEl && filterInput) {
        const revealQuery = String(label).replace(/^[\s_]+/, '').slice(0, 48).trim();
        filterInput.focus();
        setNativeInputValue(filterInput, revealQuery);
        await sleepMs(320);
        const visible = findDropdownOptionElements(filterInput);
        targetEl = visible.find(el => normalizeCourseIndexKey(el.innerText || el.textContent) === norm) || null;
      }
      if (!targetEl) return false;
      selectedOptionNorms.add(norm);
      extractConceptWords(label).forEach(c => coveredConcepts.add(c));
      if (!isOptionRowChecked(targetEl)) {
        clickOptionRow(targetEl);
        matchedCount += 1;
        await sleepMs(180);
      } else {
        matchedCount += 1;
      }
      if (diagLog && Array.isArray(diagLog.selectedLabels)) {
        diagLog.selectedLabels.push(String(label).replace(/\s+/g, ' ').trim());
      }
      return true;
    };

    // 0. Prioridade 0: Memória de correções do usuário para esta aula/assunto
    if (savedMemoryAssuntos.length > 0) {
      for (const memAssunto of savedMemoryAssuntos) {
        if (isDestroyed) break;
        await trySelectWithTerms([memAssunto], {
          minScore: 420,
          allowEmptyFallback: true,
          targetConcepts: null,
          diagSource: 'correction-memory'
        });
      }
      if (matchedCount > 0) {
        await closeOpenDropdown(trigger, filterInput);
        await sleepMs(200);
        return true;
      }
    }

    // 1A. Prioridade máxima: se o card/aula já define uma Lei Principal (ex.: ECA), marca essa lei imediatamente
    if (mainLawTerms.length > 0) {
      await trySelectWithTerms(mainLawTerms, {
        minScore: 220,
        allowEmptyFallback: true,
        allowedLawIds,
        targetConcepts: null
      });

      if (matchedCount > 0 && isSpecialLegislationSubjectName(subjectName)) {
        await closeOpenDropdown(trigger, filterInput);
        await sleepMs(200);
        return true;
      }
    }

    // 1A-bis. Âncora Nível A (Título da aula / tópico via BM25 na árvore cacheada)
    const subjectExcludeTokens = new Set();
    if (treeMatcher && subjectName) {
      const subjectTokensSources = [subjectName, ...getSubjectSearchTerms(subjectName)].filter(Boolean);
      for (const src of subjectTokensSources) {
        treeMatcher.canon(src).tokens.forEach(t => subjectExcludeTokens.add(t));
      }
    }

    if (bm25Index && !isSpecialSubject) {
      const anchorQueries = [...validLessons, fallbackTopic].filter(Boolean);
      for (const rawAnchorQ of anchorQueries) {
        if (isDestroyed) break;
        const cleanedAnchor = (stripSubjectFromLessonTitle(rawAnchorQ, subjectName) || rawAnchorQ)
          .replace(/\((?:aula|parte|bloco|m[oó]dulo)[^)]*\)/gi, ' ')
          .replace(/\b(?:aula|parte|bloco|m[oó]dulo)\s*\d+\b/gi, ' ')
          .replace(/\s*[-–—:|]+\s*$/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const anchorQ = cleanedAnchor || rawAnchorQ;
        const ranked = treeMatcher.scoreTreeNodesBm25(anchorQ, bm25Index, {
          excludeNorms: selectedOptionNorms,
          excludeTokens: subjectExcludeTokens
        });
        const top1 = ranked[0];
        const top2 = ranked[1];
        if (diagLog && Array.isArray(diagLog.queries) && ranked.length > 0) {
          diagLog.queries.push({
            source: `bm25-anchor-A:${anchorQ}`,
            terms: [anchorQ],
            minRelScore: 0.55,
            top5: ranked.slice(0, 5).map(r => ({ label: r.node.label, score: r.score, relScore: r.relScore, coverage: r.coverage })),
            selected: null
          });
        }
        const hasMargin = !top2 || top1.score >= top2.score * 1.12;
        const passesScore = top1 && top1.relScore >= 0.55;
        if (passesScore && !top1.node.isLeaf && top1.coverage >= 0.5 && hasMargin) {
          const ok = await selectOptionByExactLabel(top1.node.label, top1.node.norm);
          if (ok) {
            if (diagLog && diagLog.queries.length > 0) {
              diagLog.queries[diagLog.queries.length - 1].selected = top1.node.label;
            }
          }
        }
      }
    }

    // 1. Subassuntos do Índice/Bizus da aula (filtrados de ruído e ranqueados em B/C)
    const bizusAudit = (treeMatcher && validSubtopics.length > 0)
      ? (treeMatcher.filterAndRankBizusSubtopicsWithAudit
          ? treeMatcher.filterAndRankBizusSubtopicsWithAudit(validSubtopics, [...validLessons, fallbackTopic], 10)
          : { kept: treeMatcher.filterAndRankBizusSubtopics(validSubtopics, [...validLessons, fallbackTopic], 10), discarded: [] })
      : { kept: validSubtopics.map(s => ({ raw: s, cleaned: s, level: 'B', weight: 0.75 })), discarded: [] };
    const rankedSubtopics = bizusAudit.kept;
    if (diagLog) {
      diagLog.bizusFilter = {
        inputCount: validSubtopics.length,
        keptCount: rankedSubtopics.length,
        kept: rankedSubtopics.map(s => `[${s.level}] ${s.cleaned || s.raw}`),
        discarded: bizusAudit.discarded || []
      };
      if (!Array.isArray(diagLog.subtopicOutcomes)) diagLog.subtopicOutcomes = [];
    }

    const recordSubtopicOutcome = (subtopic, level, outcome, selectedLabel = null, top5 = []) => {
      if (diagLog && Array.isArray(diagLog.subtopicOutcomes)) {
        diagLog.subtopicOutcomes.push({
          subtopic,
          level,
          outcome,
          selectedLabel: selectedLabel || null,
          top5
        });
      }
    };

    if (rankedSubtopics.length > 0) {
      const forbiddenParentNorms = buildBroadParentNorms([subjectName, fallbackTopic, ...validLessons]);
      for (const subEntry of rankedSubtopics) {
        if (isDestroyed) break;
        const subtopic = subEntry.cleaned || subEntry.raw;
        const isLevelC = subEntry.level === 'C';

        if (allowedLawIds) {
          const subLawIds = getMatchingSpecialLawIds(subtopic);
          if (subLawIds.some(id => !allowedLawIds.has(id))) {
            recordSubtopicOutcome(subtopic, subEntry.level, 'skipped-law-lock');
            continue;
          }
        }

        const subConcepts = extractConceptWords(subtopic);
        if (subConcepts.length > 0 && subConcepts.every(c => coveredConcepts.has(c))) {
          recordSubtopicOutcome(subtopic, subEntry.level, 'skipped-covered');
          continue;
        }

        // Tenta BM25 local antes de expandir/digitar termos (resolve Romanos<->Arábicos como Anexo 1 <-> Anexo I)
        let bm25Top5 = [];
        if (bm25Index) {
          const bm25Query = stripSubjectFromLessonTitle(subtopic, subjectName) || subtopic;
          const ranked = treeMatcher.scoreTreeNodesBm25(bm25Query, bm25Index, {
            excludeNorms: selectedOptionNorms,
            excludeTokens: subjectExcludeTokens
          });
          const top1 = ranked[0];
          const top2 = ranked[1];
          bm25Top5 = ranked.slice(0, 5).map(r => ({ label: r.node.label, score: r.score, relScore: r.relScore, coverage: r.coverage }));
          const relThreshold = isLevelC ? 0.55 : 0.50;
          const hasMargin = !top2 || top1.score >= top2.score * 1.15;
          const passesScore = top1 && top1.relScore >= relThreshold;
          if (passesScore && !top1.node.isLeaf && top1.coverage >= 0.45 && hasMargin) {
            const ok = await selectOptionByExactLabel(top1.node.label, top1.node.norm);
            if (diagLog && Array.isArray(diagLog.queries)) {
              diagLog.queries.push({
                source: `bm25-${subEntry.level}:${bm25Query}`,
                terms: [bm25Query],
                minRelScore: relThreshold,
                top5: bm25Top5,
                selected: ok ? top1.node.label : null
              });
            }
            if (ok) {
              recordSubtopicOutcome(subtopic, subEntry.level, 'bm25-selected', top1.node.label, bm25Top5);
              continue;
            }
          }
          // Só pula o fallback antigo se houve empate ambíguo entre candidatos realmente fortes (coverage >= 0.45)
          if (passesScore && !hasMargin && top1.coverage >= 0.45) {
            if (diagLog && Array.isArray(diagLog.queries)) {
              diagLog.queries.push({
                source: `bm25-${subEntry.level}-tie-skip:${bm25Query}`,
                terms: [bm25Query],
                minRelScore: relThreshold,
                top5: bm25Top5,
                selected: null
              });
            }
            recordSubtopicOutcome(subtopic, subEntry.level, 'bm25-tie-skip', null, bm25Top5);
            continue;
          }
        }

        const expanded = expandSubtopicToSearchGroups(subtopic);
        if (!expanded || !expanded.primary || expanded.primary.length === 0) {
          recordSubtopicOutcome(subtopic, subEntry.level, bm25Top5.length > 0 ? 'bm25-no-candidate' : 'legacy-no-match', null, bm25Top5);
          continue;
        }

        const selectedBeforeCount = selectedOptionNorms.size;
        const subConceptSet = new Set(extractConceptWords(subtopic));
        const directHit = await trySelectWithTerms(expanded.primary, {
          forbiddenNorms: forbiddenParentNorms,
          minScore: 420,
          allowEmptyFallback: false,
          allowedLawIds,
          targetConcepts: subConceptSet.size > 0 ? subConceptSet : lessonTargetConcepts,
          lessonConcepts: lessonTargetConcepts
        });

        const hasUncoveredSplits =
          Array.isArray(expanded.splitFallbacks) &&
          expanded.splitFallbacks.length > 0 &&
          (!directHit || expanded.splitFallbacks.some(splitTerms => {
            const sc = extractConceptWords(splitTerms.join(' '));
            return sc.length > 0 && !sc.every(c => coveredConcepts.has(c));
          }));

        if (hasUncoveredSplits) {
          for (const splitTerms of expanded.splitFallbacks) {
            if (isDestroyed) break;
            const splitConcepts = extractConceptWords(splitTerms.join(' '));
            if (splitConcepts.length > 0 && splitConcepts.every(c => coveredConcepts.has(c))) {
              continue;
            }
            const splitLawIds = getMatchingSpecialLawIds(splitTerms.join(' '));
            if (allowedLawIds && splitLawIds.some(id => !allowedLawIds.has(id))) {
              continue;
            }
            if (
              directHit &&
              splitLawIds.length > 0 &&
              Array.from(selectedOptionNorms).some(sel =>
                splitLawIds.every(id => getMatchingSpecialLawIds(sel, { primaryOnly: true }).includes(id))
              )
            ) {
              continue;
            }
            const splitConceptSet = new Set(splitConcepts);
            await trySelectWithTerms(splitTerms, {
              forbiddenNorms: forbiddenParentNorms,
              minScore: 420,
              allowEmptyFallback: false,
              allowedLawIds,
              targetConcepts: splitConceptSet.size > 0 ? splitConceptSet : (subConceptSet.size > 0 ? subConceptSet : lessonTargetConcepts),
              lessonConcepts: lessonTargetConcepts
            });
          }
        }

        const newlySelected = Array.from(selectedOptionNorms).slice(selectedBeforeCount);
        recordSubtopicOutcome(
          subtopic,
          subEntry.level,
          newlySelected.length > 0 ? 'legacy-selected' : 'legacy-no-match',
          newlySelected.length > 0 ? newlySelected.join(', ') : null,
          bm25Top5
        );
      }
    }

    // 1B. Caso não houvesse lei principal no título/tópico, verifica se o contexto geral revelou uma única lei específica
    if (mainLawTerms.length === 0 && isSpecialSubject) {
      const allContextText = [fallbackTopic, ...validLessons, ...validSubtopics].filter(Boolean).join(' ');
      const allContextLawTerms = getSpecialLawSearchTerms(allContextText);
      if (allContextLawTerms.length > 0) {
        const hasContextLawSelected = Array.from(selectedOptionNorms).some(
          selNorm => scoreOptionMatch(selNorm, allContextLawTerms) >= 400
        );
        if (!hasContextLawSelected) {
          await trySelectWithTerms(allContextLawTerms, {
            minScore: 220,
            allowEmptyFallback: true,
            targetConcepts: null
          });
        }
      }
    }

    // 2. Fallback seguro: se não havia índice ou nenhum subassunto específico casou na árvore, filtra pelo título da aula
    if (matchedCount === 0) {
      for (const lessonTitle of validLessons) {
        if (isDestroyed) break;
        const lessonTerms = getLessonSearchTerms(lessonTitle);
        const singleLessonConcepts = buildConceptSetFromSource(lessonTitle, true);
        if (lessonTerms.length > 0) {
          await trySelectWithTerms(lessonTerms, {
            minScore: 200,
            allowEmptyFallback: true,
            allowedLawIds,
            targetConcepts: singleLessonConcepts
          });
        }

        // Se a aula enumera múltiplos conceitos (ex.: "Internet, Intranet e Extranet") e o filtro selecionado
        // ainda não cobriu todos (ex.: selecionou só "Intranet" porque não havia pasta composta "Intranet x Extranet x Internet"),
        // complementa com os conceitos restantes da enumeração.
        const enumItems = extractEnumeratedSubitemsFromLesson(lessonTitle);
        if (enumItems.length >= 2) {
          for (const item of enumItems) {
            if (isDestroyed) break;
            const itemConcepts = extractConceptWords(item);
            if (itemConcepts.length > 0 && itemConcepts.every(c => coveredConcepts.has(c))) {
              continue;
            }
            const itemConceptSet = new Set(itemConcepts);
            await trySelectWithTerms([item], {
              minScore: 200,
              allowEmptyFallback: false,
              allowedLawIds,
              targetConcepts: itemConceptSet,
              lessonConcepts: singleLessonConcepts
            });
          }
        }
      }
    }

    if (matchedCount === 0 && hasFallback) {
      const fallbackTerms = getTopicSearchTerms(fallbackTopic);
      await trySelectWithTerms(fallbackTerms, {
        minScore: 200,
        allowEmptyFallback: true,
        allowedLawIds,
        targetConcepts: new Set(extractConceptWords(fallbackTopic))
      });
    }

    await closeOpenDropdown(trigger, filterInput);
    await sleepMs(200);
    return matchedCount > 0;
  }

  function findCaveiraClearFiltersButton() {
    const rawCandidates = Array.from(
      document.querySelectorAll('button, [role="button"], .q-btn, a, div, span')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 55 || r.width > 340 || r.height < 18 || r.height > 64) return false;

      let txt = normalizeFilterText(el.innerText || el.textContent);
      txt = txt
        .replace(/\b(refresh|sync|clear|close|restart_alt|autorenew|delete_sweep|replay)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return txt === 'limpar filtros' || txt === 'limpar filtro';
    });

    const resolved = [];
    for (const el of rawCandidates) {
      let clickable = el.closest('button, [role="button"], .q-btn, a');
      if (!clickable) {
        let cur = el;
        for (let depth = 0; depth < 4 && cur && cur !== document.body; depth++) {
          const r = cur.getBoundingClientRect();
          const cursorStyle = window.getComputedStyle(cur).cursor;
          if (r.height >= 20 && r.height <= 64 && r.width >= 55 && r.width <= 340 && (cursorStyle === 'pointer' || depth === 0)) {
            clickable = cur;
            if (cursorStyle === 'pointer') break;
          }
          cur = cur.parentElement;
        }
      }
      if (clickable && !clickable.closest('#qg-caveira-shadow-host, #qg-caveira-hud') && isElementVisible(clickable)) {
        resolved.push(clickable);
      }
    }

    const unique = Array.from(new Set(resolved));
    unique.sort((a, b) => {
      const aNative = a.matches('button, [role="button"], .q-btn, a') ? 0 : 1;
      const bNative = b.matches('button, [role="button"], .q-btn, a') ? 0 : 1;
      if (aNative !== bNative) return aNative - bNative;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    return unique[0] || null;
  }

  function hasActiveCaveiraFilters() {
    for (const labelWord of ['Disciplina', 'Assunto', 'Caderno', 'Banca', 'Nivel', 'Ano', 'Dificuldade']) {
      const trigger = findFilterDropdownTrigger(labelWord);
      if (trigger) {
        const txt = normalizeFilterText(trigger.innerText || trigger.textContent);
        if (/\b\d+\s+selecionad/.test(txt)) return true;
      }
    }
    const appliedInfo = findAppliedFiltersSection();
    if (appliedInfo && appliedInfo.container) {
      const cTxt = normalizeFilterText(appliedInfo.container.innerText || appliedInfo.container.textContent);
      if (/\b(disciplina|assunto|caderno|banca|nivel|ano|dificuldade|palavra)\b/.test(cTxt)) {
        return true;
      }
    }
    return false;
  }

  async function removeAppliedFilterChipsFallback() {
    const appliedInfo = findAppliedFiltersSection();
    if (!appliedInfo || !appliedInfo.container) return;

    const removeIcons = Array.from(
      appliedInfo.container.querySelectorAll('button, [role="button"], .q-chip__icon--remove, svg, i, span')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 10 || r.width > 34 || r.height < 10 || r.height > 34) return false;
      const parentBtn = el.closest('button, [role="button"], a');
      if (parentBtn) {
        const pTxt = normalizeFilterText(parentBtn.innerText || parentBtn.textContent);
        if (
          pTxt.includes('limpar filtros') ||
          pTxt.includes('filtrar') ||
          pTxt.includes('simulado') ||
          pTxt.includes('mostrar filtros')
        ) {
          return false;
        }
      }
      const txt = normalizeFilterText(el.innerText || el.textContent);
      return !txt || txt === 'x' || txt === 'close' || txt === 'cancel' || txt === 'clear';
    });

    for (const icon of removeIcons.slice(0, 25)) {
      if (isDestroyed || !icon.isConnected || !isElementVisible(icon)) continue;
      const clickable = icon.closest('button, [role="button"]') || icon;
      clickElementRealistically(clickable);
      await sleepMs(80);
    }
  }

  async function clearPreviousCaveiraFilters() {
    if (isDestroyed) return;
    const clearBtn = findCaveiraClearFiltersButton();
    const hasActiveBefore = hasActiveCaveiraFilters() || Boolean(findAppliedFiltersSection());
    if (!clearBtn && !hasActiveBefore) return;

    if (clearBtn) {
      try {
        clearBtn.scrollIntoView({ block: 'center', inline: 'nearest' });
      } catch (_) {}
      await sleepMs(100);
      clickElementRealistically(clearBtn);
      const nestedBtn = !clearBtn.matches('button, [role="button"], .q-btn')
        ? clearBtn.querySelector('button, [role="button"], .q-btn')
        : null;
      if (nestedBtn && nestedBtn !== clearBtn) {
        clickElementRealistically(nestedBtn);
      }
      for (let i = 0; i < 8; i++) {
        if (isDestroyed) return;
        await sleepMs(180);
        if (!hasActiveCaveiraFilters()) break;
      }
    }

    if (hasActiveCaveiraFilters()) {
      const retryBtn = findCaveiraClearFiltersButton();
      if (retryBtn) {
        clickElementRealistically(retryBtn);
        await sleepMs(350);
      }
      if (hasActiveCaveiraFilters()) {
        await removeAppliedFilterChipsFallback();
        await sleepMs(250);
      }
    }
  }

  async function selectUnresolvedQuestionsFilter() {
    if (isDestroyed) return false;
    const rawCandidates = Array.from(
      document.querySelectorAll('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label, div, span, a')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.width > 260 || r.height < 18 || r.height > 60) return false;
      const txt = normalizeFilterText(el.innerText || el.textContent);
      return txt === 'nao resolvidas' || txt === 'nao resolvida';
    });

    const pills = [];
    for (const el of rawCandidates) {
      const target = el.closest('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') || el;
      if (!target || target.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(target)) continue;
      const tr = target.getBoundingClientRect();
      if (tr.width < 40 || tr.width > 260 || tr.height < 18 || tr.height > 60) continue;
      const targetTxt = normalizeFilterText(target.innerText || target.textContent);
      if (targetTxt !== 'nao resolvidas' && targetTxt !== 'nao resolvida') continue;
      if (!pills.includes(target)) pills.push(target);
    }

    if (pills.length === 0) return false;

    pills.sort((a, b) => {
      const aInteractive = a.matches('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') ? 0 : 1;
      const bInteractive = b.matches('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') ? 0 : 1;
      if (aInteractive !== bInteractive) return aInteractive - bInteractive;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });

    const pill = pills[0];
    if (
      pill.getAttribute('aria-pressed') === 'true' ||
      pill.getAttribute('aria-selected') === 'true' ||
      pill.getAttribute('aria-checked') === 'true'
    ) {
      return true;
    }

    clickElementRealistically(pill);
    await sleepMs(250);
    return true;
  }

  function resolveSubtopicsFromCourseCache(lessonsList, fallbackTopic, subjectName) {
    return new Promise((resolve) => {
      if (!isExtensionContextValid()) {
        resolve({ subtopics: [], rawIndexText: '' });
        return;
      }
      try {
        chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
          if (chrome.runtime.lastError || isDestroyed) {
            resolve({ subtopics: [], rawIndexText: '' });
            return;
          }
          const cache = res?.[COURSE_INDEX_CACHE_KEY];
          if (!cache || typeof cache !== 'object') {
            resolve({ subtopics: [], rawIndexText: '' });
            return;
          }

          const byLesson = (cache.byLesson && typeof cache.byLesson === 'object') ? cache.byLesson : {};
          const candidates = [...(Array.isArray(lessonsList) ? lessonsList : []), fallbackTopic].filter(Boolean);
          let matchedEntry = null;

          // 1. Chave exata
          for (const c of candidates) {
            const k = normalizeCourseIndexKey(c);
            if (k && (byLesson[k]?.bizusRawText || byLesson[k]?.rawIndexText)) {
              matchedEntry = byLesson[k];
              break;
            }
          }

          // 2. Correspondência canônica parcial
          if (!matchedEntry) {
            const canon = (s) => normalizeCourseIndexKey(s).replace(/\bparte\s*0*(\d+)\b/g, 'parte $1').replace(/\baula\s*0*(\d+)\b/g, 'aula $1').trim();
            const candCanon = candidates.map(canon).filter(Boolean);
            for (const [k, entry] of Object.entries(byLesson)) {
              if (!(entry?.bizusRawText || entry?.rawIndexText)) continue;
              const eCanon = canon(entry.lessonTitle || k);
              if (!eCanon) continue;
              if (candCanon.some(c => c === eCanon || (c.length >= 10 && eCanon.includes(c)) || (eCanon.length >= 10 && c.includes(eCanon)))) {
                matchedEntry = entry;
                break;
              }
            }
          }

          // 3. Fallback opcional: último Bizus/índice capturado recentemente se compartilhar palavras-chave relevantes com a aula
          if (!matchedEntry && (cache.latest?.bizusRawText || cache.latest?.rawIndexText) && (Date.now() - (cache.latest.capturedAt || 0)) < 1800000) {
            const latestCanon = normalizeCourseIndexKey(cache.latest.lessonTitle || '');
            const combinedCand = candidates.map(normalizeCourseIndexKey).join(' ');
            const sigWords = combinedCand.split(' ').filter(w => w.length >= 5);
            if (latestCanon && sigWords.some(w => latestCanon.includes(w))) {
              matchedEntry = cache.latest;
            }
          }

          if (!matchedEntry) {
            resolve({ subtopics: [], rawIndexText: '' });
            return;
          }

          const effectiveRaw = matchedEntry.bizusRawText || matchedEntry.rawIndexText || '';
          const parsed = effectiveRaw
            ? parseCourseIndexSubtopics(effectiveRaw, [subjectName, fallbackTopic, ...(Array.isArray(lessonsList) ? lessonsList : [])])
            : (Array.isArray(matchedEntry.bizusSubtopics) && matchedEntry.bizusSubtopics.length > 0
                ? matchedEntry.bizusSubtopics
                : (Array.isArray(matchedEntry.subtopics) ? matchedEntry.subtopics : []));
          resolve({ subtopics: parsed, rawIndexText: effectiveRaw });
        });
      } catch (_) {
        resolve({ subtopics: [], rawIndexText: '' });
      }
    });
  }

  async function applyCaveiraPracticeFilter(filterObj) {
    if (isDestroyed || !filterObj || isApplyingFilter) return;
    const rawSubject = String(filterObj.subject || '').trim();
    const lessons = Array.isArray(filterObj.lessons) ? filterObj.lessons.map(l => String(l || '').trim()).filter(Boolean) : [];
    const topic = String(filterObj.topic || '').trim();
    const rawFallbackTopic = String(filterObj.fallbackTopic || topic || '').trim();
    const rawLessons = lessons.length > 0 ? lessons : (topic ? [topic] : []);
    const inferredSubject = inferSubjectFromLessons(rawLessons, rawFallbackTopic);
    const subject = (!rawSubject || isGenericSubjectName(rawSubject)) && inferredSubject
      ? inferredSubject
      : rawSubject;
    const effectiveLessons = rawLessons.map(l => stripSubjectFromLessonTitle(l, subject || inferredSubject)).filter(Boolean);
    const fallbackTopic = stripSubjectFromLessonTitle(rawFallbackTopic, subject || inferredSubject) || rawFallbackTopic;
    const displayTarget = effectiveLessons.join(' • ') || fallbackTopic;
    if (!subject && !displayTarget) return;

    const rawIndexText = String(filterObj.rawIndexText || '').trim();
    const rawSubtopicsInput = Array.isArray(filterObj.subtopics)
      ? filterObj.subtopics.map(s => String(s || '').trim()).filter(Boolean)
      : [];

    const sourceTextForParse = rawIndexText || rawSubtopicsInput.join('\n');
    let effectiveSubtopics = sourceTextForParse
      ? parseCourseIndexSubtopics(sourceTextForParse, [subject, inferredSubject, fallbackTopic, ...effectiveLessons, ...rawLessons])
      : [];

    if (effectiveSubtopics.length === 0 && !rawIndexText) {
      const cached = await resolveSubtopicsFromCourseCache(rawLessons, fallbackTopic, subject || inferredSubject);
      if (cached.subtopics.length > 0) {
        effectiveSubtopics = cached.subtopics;
      }
    }

    isApplyingFilter = true;
    activePracticeFilter = {
      subject: subject || inferredSubject,
      lessons: effectiveLessons,
      topic: displayTarget,
      fallbackTopic,
      subtopics: effectiveSubtopics,
      rawIndexText,
      examBoards: Array.isArray(filterObj.examBoards) ? filterObj.examBoards : undefined,
      numberAlternatives: Array.isArray(filterObj.numberAlternatives) ? filterObj.numberAlternatives : undefined
    };
    const resolverBox = getHudEl('qg-hud-resolver-box');
    if (resolverBox) resolverBox.style.display = 'none';
    renderFilterBanner('⏳ Resolvendo filtro por IDs...');

    try {
      chrome.storage.local.remove([PENDING_FILTER_KEY]);
    } catch (_) {}

    try {
      // 1. Consultar memória de correções por ID ANTES do resolver
      const idMemHit = await loadFilterIdMemory(subject || inferredSubject, effectiveLessons, fallbackTopic);
      if (idMemHit && idMemHit.subjectId && Array.isArray(idMemHit.ids) && idMemHit.ids.length > 0) {
        lastFilterDiagnosticLog = {
          version: '1.5.0',
          timestamp: new Date().toISOString(),
          geradoEm: cachedCaveiraTreeGeradoEm || '',
          mode: 'id-memory',
          input: { rawSubject, rawLessons, rawFallbackTopic, rawSubtopicsCount: rawSubtopicsInput.length },
          resolvedSubject: { id: idMemHit.subjectId, name: idMemHit.subjectName || subject || '' },
          confidence: 'alta',
          reason: 'memória de correções por ID',
          ids: idMemHit.ids,
          picks: idMemHit.picks || []
        };
        const summary = [idMemHit.subjectName || subject, displayTarget].filter(Boolean).join(' • ');
        await navigateToCaveiraDeepLink(idMemHit.subjectId, idMemHit.ids, `✅ Filtro aplicado (💾 Memória IDs): ${summary}`);
        return;
      }

      // 2. Carregar caveira_arvore.json e chamar QGCaveiraResolver.resolveLesson
      const resolver = (typeof globalThis !== 'undefined' && globalThis.QGCaveiraResolver) ? globalThis.QGCaveiraResolver : null;
      const tree = resolver ? await loadCaveiraTree() : null;
      if (!resolver || !tree) {
        lastFilterDiagnosticLog = {
          version: '1.5.0',
          timestamp: new Date().toISOString(),
          geradoEm: cachedCaveiraTreeGeradoEm || '',
          mode: 'resolver-unavailable',
          reason: !resolver ? 'QGCaveiraResolver não carregado' : 'Falha ao carregar caveira_arvore.json'
        };
        renderResolverAlternativesBox({ subject: null, alternatives: [], confidence: 'nenhuma', reason: lastFilterDiagnosticLog.reason }, activePracticeFilter);
        renderFilterBanner(`⚠️ Árvore indisponível — tente o modo antigo`);
        return;
      }

      const res = resolver.resolveLesson(tree, {
        subjectName: subject || inferredSubject,
        lessons: effectiveLessons,
        topic: fallbackTopic,
        subtopics: effectiveSubtopics
      });

      lastFilterDiagnosticLog = {
        version: '1.5.0',
        timestamp: new Date().toISOString(),
        geradoEm: cachedCaveiraTreeGeradoEm || '',
        mode: 'resolver-id',
        input: { rawSubject, rawLessons, rawFallbackTopic, rawSubtopicsCount: rawSubtopicsInput.length, effectiveSubtopics },
        resolvedSubject: res.subject ? { id: res.subject.id, name: res.subject.name } : null,
        anchor: res.anchor || null,
        anchorsRanking: res.log?.anchors || [],
        reason_detail: res.reason || '',
        confidence: res.confidence,
        anchorAmbiguous: Boolean(res.anchorAmbiguous),
        reason: res.reason,
        ids: res.ids || [],
        picks: (res.picks || []).map(p => ({ id: p.id, name: p.name, path: p.path })),
        alternatives: (res.alternatives || []).map(a => ({ id: a.id, name: a.name, path: a.path })),
        subtopicsLog: res.log?.subtopics || []
      };

      const canAutoNavigate =
        (res.confidence === 'alta' || res.confidence === 'media') &&
        !res.anchorAmbiguous &&
        Array.isArray(res.ids) &&
        res.ids.length > 0 &&
        res.subject &&
        res.subject.id;

      if (canAutoNavigate) {
        const summary = [res.subject.name, displayTarget].filter(Boolean).join(' • ');
        const tag = `${res.ids.length} assunto(s) • ${res.confidence}`;
        await navigateToCaveiraDeepLink(res.subject.id, res.ids, `✅ Filtro aplicado (${tag}): ${summary}`);
        return;
      }

      // 3. Confiança baixa / nenhuma / âncora ambígua -> exibe seletor de alternativas no HUD
      renderResolverAlternativesBox(res, activePracticeFilter);
      renderFilterBanner(`⚠️ Confirme no HUD (${res.confidence}${res.anchorAmbiguous ? ' • ambíguo' : ''}): ${displayTarget || res.subject?.name || ''}`);
    } finally {
      isApplyingFilter = false;
    }
  }

  async function applyCaveiraPracticeFilterLegacyDom(filterObj) {
    if (isDestroyed || !filterObj || isApplyingFilter) return;
    const rawSubject = String(filterObj.subject || '').trim();
    const lessons = Array.isArray(filterObj.lessons) ? filterObj.lessons.map(l => String(l || '').trim()).filter(Boolean) : [];
    const topic = String(filterObj.topic || '').trim();
    const rawFallbackTopic = String(filterObj.fallbackTopic || topic || '').trim();
    const rawLessons = lessons.length > 0 ? lessons : (topic ? [topic] : []);
    const inferredSubject = inferSubjectFromLessons(rawLessons, rawFallbackTopic);
    const subject = (!rawSubject || isGenericSubjectName(rawSubject)) && inferredSubject
      ? inferredSubject
      : rawSubject;
    const effectiveLessons = rawLessons.map(l => stripSubjectFromLessonTitle(l, subject || inferredSubject)).filter(Boolean);
    const fallbackTopic = stripSubjectFromLessonTitle(rawFallbackTopic, subject || inferredSubject) || rawFallbackTopic;
    const displayTarget = effectiveLessons.join(' • ') || fallbackTopic;
    if (!subject && !displayTarget) return;

    const rawIndexText = String(filterObj.rawIndexText || '').trim();
    const rawSubtopicsInput = Array.isArray(filterObj.subtopics)
      ? filterObj.subtopics.map(s => String(s || '').trim()).filter(Boolean)
      : [];

    const sourceTextForParse = rawIndexText || rawSubtopicsInput.join('\n');
    let effectiveSubtopics = sourceTextForParse
      ? parseCourseIndexSubtopics(sourceTextForParse, [subject, inferredSubject, fallbackTopic, ...effectiveLessons, ...rawLessons])
      : [];

    if (effectiveSubtopics.length === 0 && !rawIndexText) {
      const cached = await resolveSubtopicsFromCourseCache(rawLessons, fallbackTopic, subject || inferredSubject);
      if (cached.subtopics.length > 0) {
        effectiveSubtopics = cached.subtopics;
      }
    }

    const filterStartedAt = Date.now();
    const memoryHit = await loadFilterCorrectionMemory(subject || inferredSubject, effectiveLessons, fallbackTopic);
    const effectiveSubjectForFilter = (memoryHit && memoryHit.subject && (!subject || isGenericSubjectName(subject)))
      ? memoryHit.subject
      : subject;

    lastFilterDiagnosticLog = {
      version: '1.5.0',
      timestamp: new Date().toISOString(),
      input: {
        rawSubject,
        rawLessons,
        rawFallbackTopic,
        rawSubtopicsCount: rawSubtopicsInput.length,
        hasRawIndexText: Boolean(rawIndexText)
      },
      inferred: {
        subject: effectiveSubjectForFilter,
        inferredSubject,
        effectiveLessons,
        fallbackTopic,
        effectiveSubtopics
      },
      memory: memoryHit
        ? { hit: true, key: memoryHit.key, savedSubject: memoryHit.subject || '', savedAssuntos: memoryHit.assuntos || [] }
        : { hit: false },
      discipline: { ok: null, terms: [] },
      treeScan: null,
      queries: [],
      selectedLabels: [],
      final: null
    };

    isApplyingFilter = true;
    activePracticeFilter = {
      subject: effectiveSubjectForFilter,
      lessons: effectiveLessons,
      topic: displayTarget,
      fallbackTopic,
      subtopics: effectiveSubtopics,
      rawIndexText
    };
    renderFilterBanner('⏳ Abrindo Banco de Questões...');

    try {
      chrome.storage.local.remove([PENDING_FILTER_KEY]);
    } catch (_) {}

    try {
      // 1. Se ainda não estiver no Banco de Questões (sem dropdown Disciplina), navega para a aba Questões
      if (!findFilterDropdownTrigger('Disciplina')) {
        const navCandidates = Array.from(document.querySelectorAll('a, button, [role="tab"], .q-tab, .q-item'));
        const questTab = navCandidates.find(el => {
          if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
          const txt = normalizeFilterText(el.innerText || el.textContent);
          return txt === 'questoes' || txt === 'banco de questoes' || txt === 'resolver questoes';
        });
        if (questTab) {
          clickElementRealistically(questTab);
        }
      }

      // Aguarda até ~5s o dropdown de Disciplina aparecer
      for (let waitIdx = 0; waitIdx < 14; waitIdx++) {
        if (isDestroyed) return;
        if (findFilterDropdownTrigger('Disciplina')) break;
        await sleepMs(350);
      }

      // Limpa quaisquer filtros anteriores (de aulas passadas) antes de aplicar os novos
      renderFilterBanner('⏳ Limpando filtros anteriores...');
      await clearPreviousCaveiraFilters();
      await sleepMs(200);

      // Sempre marca o filtro de questões "Não resolvidas" antes de abrir os dropdowns
      renderFilterBanner('⏳ Marcando: Não resolvidas...');
      const unresolvedOk = await selectUnresolvedQuestionsFilter();

      let subjectOk = true;
      let topicOk = true;

      // 2. Seleciona Disciplina primeiro (pois libera/carrega os Assuntos no Caveira)
      if (effectiveSubjectForFilter) {
        renderFilterBanner(`⏳ Selecionando Disciplina: ${effectiveSubjectForFilter}...`);
        const subjectTerms = getSubjectSearchTerms(effectiveSubjectForFilter);
        if (lastFilterDiagnosticLog) lastFilterDiagnosticLog.discipline.terms = subjectTerms;
        subjectOk = await selectCaveiraDropdownOption('Disciplina', subjectTerms);
        if (!subjectOk && inferredSubject && normalizeFilterText(inferredSubject) !== normalizeFilterText(effectiveSubjectForFilter)) {
          renderFilterBanner(`⏳ Tentando Disciplina inferida da aula: ${inferredSubject}...`);
          const inferredTerms = getSubjectSearchTerms(inferredSubject);
          if (lastFilterDiagnosticLog) lastFilterDiagnosticLog.discipline.terms = inferredTerms;
          subjectOk = await selectCaveiraDropdownOption('Disciplina', inferredTerms);
        }
        if (lastFilterDiagnosticLog) lastFilterDiagnosticLog.discipline.ok = subjectOk;
        await sleepMs(500);
      }

      // 3. Seleciona Assunto(s) pela Memória de Correções, subassuntos do Índice/Bizus ou título da(s) aula(s)
      if ((memoryHit && memoryHit.assuntos?.length > 0) || effectiveSubtopics.length > 0 || effectiveLessons.length > 0 || fallbackTopic) {
        if (memoryHit && memoryHit.assuntos?.length > 0) {
          renderFilterBanner(`💾 Aplicando correção memorizada (${memoryHit.assuntos.length})...`);
        } else if (effectiveSubtopics.length > 0) {
          renderFilterBanner(`⏳ Filtrando ${effectiveSubtopics.length} subassuntos do Índice...`);
        } else {
          renderFilterBanner(`⏳ Selecionando Aula(s): ${displayTarget}...`);
        }
        topicOk = await selectCaveiraLessonsInDropdown(effectiveLessons, fallbackTopic, effectiveSubtopics, effectiveSubjectForFilter, {
          savedMemoryAssuntos: memoryHit ? memoryHit.assuntos : [],
          diagLog: lastFilterDiagnosticLog
        });
        await sleepMs(300);
      }

      // 4. Localiza e aciona o botão explícito de busca/filtragem (inclui .q-btn, div/span estilizados e texto com ícones)
      await sleepMs(250);
      const applyBtn = findCaveiraFilterSubmitButton();
      if (applyBtn) {
        try {
          applyBtn.scrollIntoView({ block: 'center', inline: 'nearest' });
        } catch (_) {}
        await sleepMs(120);
        clickElementRealistically(applyBtn);
        const nestedBtn = applyBtn.querySelector('button, [role="button"], .q-btn');
        if (nestedBtn && nestedBtn !== applyBtn) {
          clickElementRealistically(nestedBtn);
        }
        await sleepMs(300);
      }
      try {
        window.scrollBy({ top: 260, behavior: 'smooth' });
      } catch (_) {}

      if (lastFilterDiagnosticLog) {
        lastFilterDiagnosticLog.final = {
          subjectOk,
          topicOk,
          unresolvedOk,
          applyBtnFound: Boolean(applyBtn),
          appliedDom: readAppliedFiltersFromDom(),
          elapsedMs: Date.now() - filterStartedAt
        };
      }

      const summary = [effectiveSubjectForFilter, displayTarget].filter(Boolean).join(' • ');
      const memTag = (memoryHit && memoryHit.assuntos?.length > 0) ? ' • 💾 Memória' : '';
      const subtag = effectiveSubtopics.length > 0 ? ` • ${effectiveSubtopics.length} subassuntos` : '';
      if (subjectOk && topicOk && applyBtn) {
        const statusTag = unresolvedOk ? 'Não resolvidas' : 'Não resolvidas pendente';
        renderFilterBanner(`✅ Filtro aplicado (${statusTag}${memTag}${subtag}): ${summary}`);
      } else if (subjectOk && topicOk) {
        renderFilterBanner(`⚠️ Selecionado (clique em Filtrar): ${summary}`);
      } else {
        renderFilterBanner(`⚠️ Parcial (${subjectOk ? 'Disciplina OK' : 'Disciplina não encontrada'} / ${topicOk ? 'Assunto OK' : 'Selecione o assunto'})`);
      }
    } finally {
      isApplyingFilter = false;
    }
  }

  function findCaveiraFilterSubmitButton() {
    const allowedExact = ['filtrar', 'filtrar questoes', 'aplicar', 'aplicar filtros', 'buscar', 'buscar questoes', 'pesquisar'];
    const blockedWords = ['carreiras', 'digite', 'limpar', 'salvar', 'caderno', 'filtros'];

    const rawCandidates = Array.from(
      document.querySelectorAll('button, [role="button"], .q-btn, a, input[type="button"], input[type="submit"], div, span')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 36 || r.width > 380 || r.height < 20 || r.height > 72) return false;

      let txt = normalizeFilterText(el.tagName === 'INPUT' ? el.value : (el.innerText || el.textContent));
      txt = txt
        .replace(/\b(filter_alt|filter_list|search|tune|find_in_page)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!txt || txt.length > 40) return false;
      if (blockedWords.some(bw => txt.includes(bw))) return false;

      return allowedExact.includes(txt) || txt.startsWith('filtrar ') || txt.endsWith(' filtrar');
    });

    const resolved = [];
    for (const el of rawCandidates) {
      let clickable = el.closest('button, [role="button"], .q-btn, a, input[type="button"], input[type="submit"]');
      if (!clickable) {
        let cur = el;
        for (let depth = 0; depth < 4 && cur && cur !== document.body; depth++) {
          const r = cur.getBoundingClientRect();
          const cursorStyle = window.getComputedStyle(cur).cursor;
          if (r.height >= 28 && r.height <= 60 && r.width >= 36 && r.width <= 380 && (cursorStyle === 'pointer' || depth === 0)) {
            clickable = cur;
            if (cursorStyle === 'pointer') break;
          }
          cur = cur.parentElement;
        }
      }
      if (clickable && !clickable.closest('#qg-caveira-shadow-host, #qg-caveira-hud') && isElementVisible(clickable)) {
        resolved.push(clickable);
      }
    }

    const unique = Array.from(new Set(resolved));
    unique.sort((a, b) => {
      const aNative = a.matches('button, [role="button"], .q-btn, input[type="submit"], input[type="button"]') ? 0 : 1;
      const bNative = b.matches('button, [role="button"], .q-btn, input[type="submit"], input[type="button"]') ? 0 : 1;
      if (aNative !== bNative) return aNative - bNative;
      const aExact = normalizeFilterText(a.innerText || a.textContent || a.value || '') === 'filtrar' ? 0 : 1;
      const bExact = normalizeFilterText(b.innerText || b.textContent || b.value || '') === 'filtrar' ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    return unique[0] || null;
  }

  function updateHudUser() {
    const userTextEl = getHudEl('qg-hud-user-text');
    const userBarEl = getHudEl('qg-hud-user-bar');
    if (!userTextEl || !userBarEl) return;
    if (cachedActiveUserId) {
      const label = (cachedActiveUserLabel || '').trim() || `ID ${String(cachedActiveUserId).slice(0, 8)}...`;
      userTextEl.textContent = `👤 ${label}`;
      userTextEl.title = label;
      userBarEl.style.color = '#86efac';
      userBarEl.style.background = 'rgba(16, 185, 129, 0.08)';
    } else {
      userTextEl.textContent = '🟡 Faça login no QG para vincular';
      userTextEl.title = 'Nenhuma conta vinculada';
      userBarEl.style.color = '#fde68a';
      userBarEl.style.background = 'rgba(251, 191, 36, 0.06)';
    }
  }

  function startTimerInterval() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      checkDailySessionReset();
      // Só cronometra se a aba estiver visível, o timer estiver ativo e houver questão ativa na tela
      if (document.visibilityState === 'visible' && isTimerRunning && currentQuestionId) {
        timerSeconds = (questionTimers.get(currentQuestionId) || 0) + 1;
        questionTimers.set(currentQuestionId, timerSeconds);
        renderTimerDisplay();
      }
    }, 1000);
  }

  function renderTimerDisplay() {
    const timerEl = getHudEl('qg-timer');
    if (!timerEl) return;
    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
    if (isTimerRunning) {
      timerEl.style.opacity = '1';
      timerEl.style.color = timerSeconds >= 150 ? '#ef4444' : timerSeconds >= 90 ? '#f97316' : '#fbbf24';
    } else {
      timerEl.style.opacity = '0.7';
    }
  }

  function pauseTimer() {
    isTimerRunning = false;
  }

  function clearActiveQuestionState() {
    if (!currentQuestionId && !isTimerRunning) {
      if (isCoursePage() && currentCourseIndexStatus?.count > 0) {
        const currentQEl = getHudEl('qg-current-q-id');
        if (currentQEl) {
          const capLabel = currentCourseIndexStatus.source === 'bizus' ? 'Bizus capturado' : 'Índice capturado';
          currentQEl.textContent = `📑 ${capLabel} (${currentCourseIndexStatus.count} subassuntos)`;
          currentQEl.title = currentCourseIndexStatus.preview || '';
        }
      }
      return;
    }
    isTimerRunning = false;
    currentQuestionId = null;
    timerSeconds = 0;
    dismissPrompt();
    renderTimerDisplay();
    renderQuestionHistory(null, false);
    const currentQEl = getHudEl('qg-current-q-id');
    if (currentQEl) {
      if (isCoursePage() && currentCourseIndexStatus?.count > 0) {
        const capLabel = currentCourseIndexStatus.source === 'bizus' ? 'Bizus capturado' : 'Índice capturado';
        currentQEl.textContent = `📑 ${capLabel} (${currentCourseIndexStatus.count} subassuntos)`;
        currentQEl.title = currentCourseIndexStatus.preview || '';
      } else {
        currentQEl.textContent = 'Aguardando questão...';
      }
    }
  }

  // --- MEMÓRIA TÁTICA / ALERTA DE QUESTÃO REPETIDA (#9) ---
  function renderQuestionHistory(qId, isCurrentQuestionAnswered = false) {
    const box = getHudEl('qg-hud-history-box');
    if (!box) return;

    if (!qId) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    const previousData = questionsCache.find(q => q && q.id === qId);
    if (!previousData || !previousData.timestamp) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    const qDate = new Date(previousData.timestamp);
    const now = new Date();
    const diffMs = Math.max(0, now - qDate);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const timeLabel = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'ontem' : `há ${diffDays} dias`;

    const isHit = Boolean(previousData.hit);
    const statusText = isHit
      ? (previousData.confidence === 'chute' ? 'ACERTOU NO CHUTE 🎲' : previousData.confidence === 'duvida' ? 'ACERTOU COM DÚVIDA 🤔' : 'ACERTOU ANTERIORMENTE ✓')
      : `ERROU ANTERIORMENTE ✗ (${previousData.errorReason === 'atencao' ? 'Atenção' : previousData.errorReason === 'interpretacao' ? 'Interpretação' : 'Teoria'})`;

    const bizuHtml = previousData.userNote
      ? `<div class="qg-history-bizu">💡 <strong>Seu Bizu:</strong> ${escapeHtml(previousData.userNote)}</div>`
      : '';

    // Anti-spoiler: só exibe o que marcou e o gabarito quando a questão já estiver respondida nesta tentativa
    let choicesHtml = '';
    if (isCurrentQuestionAnswered) {
      const activeChoice = (activeQuestionData && activeQuestionData.id === qId) ? activeQuestionData.userChoice : null;
      const activeGabarito = (activeQuestionData && activeQuestionData.id === qId) ? activeQuestionData.correctChoice : null;
      const userChoice = activeChoice || previousData.userChoice || '?';
      const gabarito = activeGabarito || previousData.correctChoice || '?';
      choicesHtml = `<div style="font-size: 9px; opacity: 0.85; margin-top: 1px;">Você marcou: <strong>${userChoice}</strong> | Gabarito: <strong>${gabarito}</strong></div>`;
    }

    box.className = `qg-hud-history ${isHit ? 'hit-history' : 'error-history'}`;
    box.innerHTML = `
      <div>
        <span class="qg-history-badge">${isHit ? '✓ HISTÓRICO' : '⚠️ ATENÇÃO: REPETIDA'}</span>
        <div style="font-weight: 700;">${statusText} (${timeLabel})</div>
        ${choicesHtml}
      </div>
      ${bizuHtml}
    `;
    box.style.display = 'block';
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function switchActiveQuestion(newQId, isAlreadyAnswered = false) {
    if (!newQId) return;
    const isDifferentQuestion = currentQuestionId !== newQId;
    if (!isDifferentQuestion && isTimerRunning === !isAlreadyAnswered) return;

    currentQuestionId = newQId;
    timerSeconds = questionTimers.get(newQId) || 0;
    isTimerRunning = !isAlreadyAnswered;

    if (isDifferentQuestion) {
      lastUserClickedChoice = null;
      // Se o usuário rolou para outra questão diferente da que acabou de responder, fecha o prompt anterior
      if (!activeQuestionData || activeQuestionData.id !== newQId) {
        dismissPrompt();
      }
    }

    renderQuestionHistory(newQId, isAlreadyAnswered);
    renderTimerDisplay();

    const currentQEl = getHudEl('qg-current-q-id');
    if (currentQEl) {
      currentQEl.textContent = isAlreadyAnswered ? `${newQId} ✓` : newQId;
    }
  }

  // --- 3. ATUALIZAÇÃO VISUAL DAS ESTATÍSTICAS ---
  function updateHudGoal() {
    const elRatio = getHudEl('qg-hud-goal-ratio');
    const elBar = getHudEl('qg-hud-goal-bar');
    if (!elRatio || !elBar) return;

    const current = Number(sessionStats.total) || 0;
    const goal = cachedDailyGoal || 50;
    const pct = Math.min(100, Math.round((current / goal) * 100));

    if (current >= goal) {
      elRatio.innerHTML = `<span style="color:#10b981;">🏆 ${current}/${goal} (100%)</span>`;
      elBar.style.background = '#10b981';
      elBar.style.width = '100%';
    } else {
      elRatio.textContent = `${current} / ${goal} (${pct}%)`;
      elBar.style.background = 'linear-gradient(90deg, #0284c7, #10b981)';
      elBar.style.width = `${pct}%`;
    }
  }

  function updateHudStats() {
    const elTotal = getHudEl('qg-stat-total');
    const elHits = getHudEl('qg-stat-hits');
    const elErrors = getHudEl('qg-stat-errors');
    const elNet = getHudEl('qg-stat-net');
    if (!elTotal) return;

    elTotal.textContent = sessionStats.total;
    elHits.textContent = sessionStats.hits;
    elErrors.textContent = sessionStats.errors;
    const rate = sessionStats.total > 0 ? Math.round((sessionStats.hits / sessionStats.total) * 100) : 0;
    elNet.textContent = `${rate}%`;
    elNet.className = `qg-hud-stat-value ${rate >= 70 ? 'green' : rate >= 50 ? 'gold' : sessionStats.total === 0 ? 'gold' : 'red'}`;

    updateHudGoal();
  }

  // --- 4. SELEÇÃO DE CARDS E DETECÇÃO POR VIEWPORT (SCROLL) ---
  function getQuestionCards() {
    const allCards = document.querySelectorAll('.q-card');
    return Array.from(allCards).filter(card => {
      if (card.closest('#qg-caveira-shadow-host, #qg-caveira-hud')) return false;
      if (card.parentElement && card.parentElement.closest('.q-card')) return false;
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const hasNumber = Boolean(card.querySelector('.number'));
      const hasAlternatives = Boolean(card.querySelector('.question-alternatives, .alternative, .alternative-letter'));
      return hasNumber && hasAlternatives;
    });
  }

  // Identifica qual card de questão está no centro de leitura da tela durante a rolagem
  function findCardInViewport(cards) {
    if (!cards || cards.length === 0) return null;
    if (cards.length === 1) return cards[0];

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    // Ponto focal de leitura do olho humano (cerca de 38% a partir do topo da janela)
    const focalY = viewportHeight * 0.38;

    let bestCard = null;
    let bestDistance = Infinity;

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      // Ignora cards que estão totalmente fora da tela
      if (rect.bottom < 40 || rect.top > viewportHeight - 40) continue;

      // Se o card atravessa a linha de leitura principal (focalY), ele é o card ativo imediato
      if (rect.top <= focalY && rect.bottom >= focalY) {
        return card;
      }

      // Caso contrário, pega o card mais próximo da linha focal de leitura
      const cardCenter = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(cardCenter - focalY);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestCard = card;
      }
    }

    return bestCard || cards[0];
  }

  function extractQuestionId(card) {
    if (!card) return null;
    const numberEl = card.querySelector('.number');
    if (numberEl) {
      const match = numberEl.textContent.match(/Q\s*[:.-]?\s*(\d{2,9})/i);
      if (match) return `Q${match[1]}`;
    }
    return null;
  }

  function isCardAnswered(card) {
    if (!card) return false;

    // Regra 1: O box de estatísticas com feedback oficial de resposta
    const statsBox = card.querySelector('.stats-box');
    if (statsBox) {
      const text = (statsBox.textContent || '').toUpperCase();
      if (
        Boolean(statsBox.querySelector('.bg-correct-1, .bg-correct-2, .bg-incorrect-1, .bg-incorrect-2, .title-stats')) ||
        text.includes('PARABÉNS') ||
        text.includes('ERROU') ||
        text.includes('VOCÊ ACERTOU') ||
        text.includes('VOCÊ ERROU') ||
        text.includes('RESPOSTA CORRETA') ||
        text.includes('GABARITO DEFINITIVO')
      ) {
        return true;
      }
    }

    // Regra 2: Alternativas marcadas com a cor verde ou vermelha do gabarito (dentro de .question-alternatives ou .alternative)
    // ATENÇÃO: NÃO usar [class*="correct"] genérico porque classes do Quasar como "items-start" ou "justify-start" ou outras do Quasar podem dar falso positivo!
    const altScope = card.querySelector('.question-alternatives') || card;
    const hasColoredAlternative = Boolean(
      altScope.querySelector(
        '.alternative.bg-correct-1, .alternative.bg-correct-2, .alternative.bg-incorrect-1, .alternative.bg-incorrect-2, ' +
        '.alternative-letter.bg-correct-1, .alternative-letter.bg-correct-2, .alternative-letter.bg-incorrect-1, .alternative-letter.bg-incorrect-2, ' +
        '.bg-positive, .bg-negative, .text-positive, .text-negative'
      )
    );
    if (hasColoredAlternative) return true;

    return false;
  }

  function classifyPRFCategory(subject, topic, content) {
    const s = (subject || '').toLowerCase();
    const t = (topic || '').toLowerCase();
    const c = (content || '').toLowerCase();
    const full = `${s} ${t} ${c}`;

    // REGRA DE OURO 1: Se a matéria informada pelo Caveira já for expressamente uma disciplina do Bloco I
    if (s.includes('informática') || s.includes('informatica') || t.includes('informática') || t.includes('segurança da informação') || t.includes('redes')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Informática' };
    }
    if (s.includes('português') || s.includes('portuguesa') || s.includes('língua portuguesa')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Língua Portuguesa' };
    }
    if (s.includes('raciocínio lógico') || s.includes('raciocinio logico') || s.includes('rlm') || s.includes('matemática') || s.includes('física') || s.includes('fisica')) {
      return { bloco: 'Bloco I', canonicalSubject: s.includes('física') || s.includes('fisica') ? 'Física' : 'Raciocínio Lógico-Matemático' };
    }
    if (s.includes('ética') || s.includes('etica') || s.includes('geopolítica') || s.includes('geopolitica') || s.includes('inglês') || s.includes('espanhol')) {
      const canonical = s.includes('ética') || s.includes('etica') ? 'Ética e Cidadania' : s.includes('geopolítica') || s.includes('geopolitica') ? 'Geopolítica' : 'Língua Estrangeira';
      return { bloco: 'Bloco I', canonicalSubject: canonical };
    }

    // REGRA DE OURO 2: Se for expressamente Legislação de Trânsito
    if (s.includes('trânsito') || s.includes('transito') || s.includes('ctb') || s.includes('contran')) {
      const subCat = (full.includes('contran') || full.includes('resolução') || full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes'))
        ? 'Resoluções do CONTRAN'
        : 'Legislação de Trânsito (CTB)';
      return { bloco: 'Bloco II', canonicalSubject: subCat };
    }

    // REGRA DE OURO 3: Se a matéria for Direito específico
    if (s.includes('constitucional')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Constitucional' };
    if (s.includes('administrativo')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Administrativo' };
    if (s.includes('processual penal')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Processual Penal' };
    if (s.includes('penal especial') || s.includes('legislação especial') || s.includes('leis especiais')) return { bloco: 'Bloco III', canonicalSubject: 'Legislação Penal Especial' };
    if (s.includes('direitos humanos')) return { bloco: 'Bloco III', canonicalSubject: 'Direitos Humanos' };
    if (s.includes('direito penal')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Penal' };

    // BLOCO II — Legislação de Trânsito
    if (
      full.includes('trânsito') || full.includes('transito') || full.includes('ctb') ||
      full.includes('9.503') || full.includes('contran') || full.includes('resolução') ||
      full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes') ||
      full.includes('sinalização') || full.includes('habilitação') || full.includes('sinistro')
    ) {
      const subCat = (full.includes('contran') || full.includes('resolução') || full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes'))
        ? 'Resoluções do CONTRAN'
        : 'Legislação de Trânsito (CTB)';
      return { bloco: 'Bloco II', canonicalSubject: subCat };
    }

    // BLOCO III — Direito e Conhecimentos Específicos
    if (full.includes('constitucional') || full.includes('constituição') || full.includes('art. 5') || full.includes('art. 144')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Constitucional' };
    }
    if (full.includes('administrativo') || full.includes('8.112') || full.includes('improbidade') || full.includes('8.429') || full.includes('14.133') || full.includes('licitaç') || full.includes('atos administrativos') || full.includes('poderes administrativos')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Administrativo' };
    }
    if (full.includes('processual penal') || full.includes('processo penal') || full.includes('inquérito') || full.includes('prisão em flagrante') || full.includes('ação penal')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Processual Penal' };
    }
    if (
      full.includes('legislação especial') || full.includes('leis especiais') || full.includes('11.343') ||
      full.includes('drogas') || full.includes('10.826') || full.includes('desarmamento') || full.includes('armas') ||
      full.includes('13.869') || full.includes('abuso de autoridade') || full.includes('9.455') || full.includes('tortura') ||
      full.includes('8.072') || full.includes('hediondos') || full.includes('12.850') || full.includes('organizações criminosas') ||
      full.includes('9.099') || full.includes('maria da penha') || full.includes('9.605') || full.includes('meio ambiente') ||
      full.includes('estatuto da criança') || full.includes('eca')
    ) {
      return { bloco: 'Bloco III', canonicalSubject: 'Legislação Penal Especial' };
    }
    if (full.includes('direitos humanos') || full.includes('pacto de san josé') || full.includes('declaração universal')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direitos Humanos' };
    }
    if (full.includes('direito penal') || full.includes('código penal') || full.includes('teoria do crime') || full.includes('crimes contra') || full.includes('peculato') || full.includes('homicídio')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Penal' };
    }

    // BLOCO I — Conhecimentos Básicos
    if (full.includes('português') || full.includes('portuguesa') || full.includes('gramática') || full.includes('redação oficial') || full.includes('sintaxe') || full.includes('crase') || full.includes('pontuação') || full.includes('concordância') || full.includes('regência')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Língua Portuguesa' };
    }
    if (full.includes('raciocínio lógico') || full.includes('rlm') || full.includes('matemática') || full.includes('probabilidade') || full.includes('estatística') || full.includes('combinatória') || full.includes('proposiç')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Raciocínio Lógico-Matemático' };
    }
    if (full.includes('informática') || full.includes('redes de computadores') || full.includes('segurança da informação') || full.includes('windows') || full.includes('linux') || full.includes('internet') || full.includes('malware') || full.includes('código de verificação') || full.includes('hash')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Informática' };
    }
    if (full.includes('física') || full.includes('cinemática') || full.includes('dinâmica') || full.includes('energia mecânica') || full.includes('colisões') || full.includes('quantidade de movimento')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Física' };
    }
    if (full.includes('ética') || full.includes('1.171') || full.includes('cidadania')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Ética e Cidadania' };
    }
    if (full.includes('geopolítica') || full.includes('geografia')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Geopolítica' };
    }
    if (full.includes('inglês') || full.includes('espanhol') || full.includes('língua estrangeira')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Língua Estrangeira' };
    }

    return { bloco: 'Bloco I', canonicalSubject: subject || 'Geral' };
  }

  function extractQuestionData(card, qId) {
    if (!card) return null;

    // Busca disciplina e assunto pelo seletor específico ou vasculha a linha do cabeçalho ao lado do número
    let subject = 'Geral';
    let topic = 'Geral';

    const subjectEl = card.querySelector('.subject, [class*="subject"], [class*="disciplina"]');
    let rawSubjectText = subjectEl ? subjectEl.textContent.trim() : '';

    if (!rawSubjectText) {
      // Tenta achar na barra superior do card (onde fica o Q112072)
      const numberEl = card.querySelector('.number');
      const headerRow = numberEl ? (numberEl.closest('.row, .q-card__section, div') || numberEl.parentElement) : null;
      if (headerRow) {
        // Pega todos os textos da linha do cabeçalho que contenham '->'
        const possibleElements = headerRow.querySelectorAll('div, span, p');
        for (const el of possibleElements) {
          if (el.textContent && el.textContent.includes('->')) {
            rawSubjectText = el.textContent.trim();
            break;
          }
        }
      }
    }

    if (rawSubjectText) {
      const parts = rawSubjectText.split('->').map(s => s.trim()).filter(Boolean);
      subject = parts[0] || 'Geral';
      topic = parts.slice(1).join(' ➔ ') || subject;
    }

    const infoText = card.querySelector('.question-info')?.textContent || '';
    const bancaMatch = infoText.match(/Banca:\s*([^Ano\n]+)/i);
    const anoMatch = infoText.match(/Ano:\s*(\d+)/i);
    const diffMatch = infoText.match(/Dificuldade:\s*([^\n]+)/i);

    const banca = bancaMatch ? bancaMatch[1].trim() : 'CAVEIRA';
    const ano = anoMatch ? anoMatch[1].trim() : '2026';
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Média';

    const content = card.querySelector('.content')?.innerText?.trim() || '';
    const { bloco, canonicalSubject } = classifyPRFCategory(subject, topic, content);

    const statsBox = card.querySelector('.stats-box');
    const statsText = statsBox ? statsBox.textContent : '';

    let correctLetterFromDom = null;
    let incorrectLetterFromDom = null;
    const altScope = card.querySelector('.question-alternatives') || card;
    const altItems = altScope.querySelectorAll('.alternative, [class*="alternative"]');

    altItems.forEach(altEl => {
      const letterEl = altEl.querySelector('.alternative-letter, [class*="letter"]') || altEl;
      let rawLetter = (altEl.querySelector('.alternative-letter, [class*="letter"]')?.textContent || '').trim().toUpperCase();
      if (!rawLetter || rawLetter.length > 2) {
        // Fallback: tenta pegar do início do texto ou atributo
        const match = (altEl.textContent || '').trim().match(/^([A-E])\b/i);
        if (match) rawLetter = match[1].toUpperCase();
      }
      if (!rawLetter || rawLetter.length > 2) return;

      const combinedClasses = `${altEl.className || ''} ${letterEl.className || ''} ${altEl.parentElement?.className || ''}`;
      const styleAttr = `${altEl.getAttribute('style') || ''} ${letterEl.getAttribute('style') || ''}`;

      const isRed =
        /\b(bg-incorrect(?:-\d+)?|incorrect|is-wrong|wrong|bg-negative|text-negative|danger)\b/i.test(combinedClasses) ||
        styleAttr.includes('rgb(239, 68, 68)') ||
        styleAttr.includes('#ef4444') ||
        styleAttr.includes('red');

      const isGreen =
        !isRed && (
          /\b(bg-correct(?:-\d+)?|correct|is-correct|bg-positive|text-positive|success)\b/i.test(combinedClasses) ||
          styleAttr.includes('rgb(16, 185, 129)') ||
          styleAttr.includes('#10b981') ||
          styleAttr.includes('green')
        );

      if (isRed) {
        incorrectLetterFromDom = rawLetter;
      } else if (isGreen) {
        correctLetterFromDom = rawLetter;
      }
    });

    // Também verifica se há indicação de resposta no texto do card ou box de estatísticas
    const fullCardText = card.innerText || card.textContent || '';
    const statsAnswerMatch = statsText.match(/(?:Resposta correta|Gabarito|Alternativa correta|Gabarito definitivo|Resposta)\s*[:=]?\s*\(?([A-E])\)?/i) ||
                             fullCardText.match(/(?:Resposta correta|Gabarito|Alternativa correta|Gabarito definitivo|Resposta)\s*[:=]?\s*\(?([A-E])\)?/i);

    const hasStatsIncorrect =
      Boolean(statsBox?.querySelector('.bg-incorrect-1, .bg-incorrect-2, .bg-negative, .text-negative')) ||
      /\b(VOC[EÊ]\s+ERROU|ERROU|INCORRETA|RESPOSTA\s+ERRADA)\b/i.test(statsText);

    const hasStatsCorrect =
      !hasStatsIncorrect && (
        Boolean(statsBox?.querySelector('.bg-correct-1, .bg-correct-2, .bg-positive, .text-positive')) ||
        /\b(PARAB[EÉ]NS|VOC[EÊ]\s+ACERTOU|ACERTOU)\b/i.test(statsText)
      );

    const isCorrect = (incorrectLetterFromDom || hasStatsIncorrect)
      ? false
      : (hasStatsCorrect || (Boolean(correctLetterFromDom) && !statsText.toUpperCase().includes('RESPOSTA CORRETA')));

    // Identifica o que o usuário marcou
    const userSelectedEl = altScope.querySelector('.q-radio[aria-checked="true"], .q-radio--active, [class*="selected"], [class*="active"], input:checked');
    let userChoiceFromRadio = null;
    if (userSelectedEl) {
      const parentAlt = userSelectedEl.closest('.alternative, [class*="alternative"]') || userSelectedEl.parentElement;
      const l = (parentAlt?.querySelector('.alternative-letter, [class*="letter"]')?.textContent || '').trim().toUpperCase();
      if (l && l.length <= 2) userChoiceFromRadio = l;
    }

    const userChoice = incorrectLetterFromDom ||
                       (isCorrect ? correctLetterFromDom : null) ||
                       userChoiceFromRadio ||
                       lastUserClickedChoice ||
                       (isCorrect ? (correctLetterFromDom || 'C') : 'E');

    let correctChoice = correctLetterFromDom;
    if (statsAnswerMatch) {
      correctChoice = statsAnswerMatch[1].toUpperCase();
    } else if (isCorrect) {
      correctChoice = userChoice;
    } else if (!correctChoice) {
      // Se errou e não achou a letra verde explícita no DOM, busca nas alternativas qual tem ícone de check ou classe correta
      const checkIconEl = Array.from(altScope.querySelectorAll('.material-icons, [class*="check"]'))
        .find(el => (el.classList && Array.from(el.classList).some(c => c.includes('check'))) || (el.textContent || '').trim().toLowerCase() === 'check');
      const checkIconAlt = checkIconEl?.closest('.alternative');
      const checkLetter = (checkIconAlt?.querySelector('.alternative-letter')?.textContent || '').trim().toUpperCase();
      if (checkLetter && checkLetter.length <= 2) {
        correctChoice = checkLetter;
      } else {
        // Cebraspe padrão: se o usuário marcou C e errou, é E; se marcou E e errou, é C
        correctChoice = userChoice === 'C' ? 'E' : 'C';
      }
    }

    function cleanAlternativeText(rawText, letter) {
      if (!rawText || typeof rawText !== 'string') return '';
      let clean = rawText.trim();
      const safeLetter = (letter && /^[A-Za-z0-9]$/.test(String(letter).trim())) ? String(letter).trim() : '[A-E]';
      const letterPrefixRegex = new RegExp(`^\\(?\\s*${safeLetter}\\s*[\\).\\-–—:]?\\s+`, 'i');
      clean = clean.replace(letterPrefixRegex, '').trim();
      const isOnlyPercentage = /^\d+(?:[.,]\d+)?\s*%\s*$/.test(clean);
      if (!isOnlyPercentage) {
        clean = clean.replace(/^\s*\d{1,3}(?:[.,]\d+)?\s*%\s*/, '').trim();
        clean = clean.replace(/\s*\d{1,3}(?:[.,]\d+)?\s*%\s*$/, '').trim();
      }
      return clean || rawText;
    }

    const alternatives = [];
    const seenLetters = new Set();
    const altScopeForText = card.querySelector('.question-alternatives') || card;

    // Estratégia 1: Busca a partir de cada caixinha de letra (.alternative-letter) e extrai o texto irmão na linha
    const letterNodes = altScopeForText.querySelectorAll('.alternative-letter');
    letterNodes.forEach(letterNode => {
      const rawLetter = (letterNode.textContent || '').trim().replace(/[^A-Za-z]/g, '').toUpperCase();
      if (!rawLetter || rawLetter.length > 2 || seenLetters.has(rawLetter)) return;

      const rowEl = letterNode.closest('.alternative') || letterNode.parentElement;
      if (!rowEl) return;

      const clone = rowEl.cloneNode(true);
      clone.querySelectorAll('.alternative-letter, .q-radio__inner, button, .q-icon, i.material-icons, .q-badge, .q-linear-progress, .q-tooltip, [class*="percent"], [class*="badge"], [class*="stat"], [class*="progress"]').forEach(el => el.remove());
      let altText = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
      // Remove eventual letra solta duplicada no começo ou porcentagem de estatística
      altText = cleanAlternativeText(altText, rawLetter);

      if (altText) {
        seenLetters.add(rawLetter);
        alternatives.push({
          letter: rawLetter,
          text: altText
        });
      }
    });

    // Estratégia 2 (Fallback): Busca direto nos elementos .alternative caso não haja .alternative-letter
    if (alternatives.length === 0) {
      const altEls = altScopeForText.querySelectorAll('.alternative');
      altEls.forEach((altEl, idx) => {
        const defaultLetters = ['A', 'B', 'C', 'D', 'E'];
        const clone = altEl.cloneNode(true);
        clone.querySelectorAll('.alternative-letter, .q-radio__inner, button, .q-icon, i.material-icons, .q-badge, .q-linear-progress, .q-tooltip, [class*="percent"], [class*="badge"], [class*="stat"], [class*="progress"]').forEach(el => el.remove());
        const rawText = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
        if (!rawText) return;
        const match = rawText.match(/^([A-E])[\s.)-]+(.*)$/i);
        const letter = match ? match[1].toUpperCase() : (defaultLetters[idx] || String(idx + 1));
        const text = cleanAlternativeText(match ? match[2].trim() : rawText, letter);
        if (!seenLetters.has(letter) && text) {
          seenLetters.add(letter);
          alternatives.push({ letter, text });
        }
      });
    }

    const elapsedForThisQ = questionTimers.get(qId) || timerSeconds || 10;
    const durationSeconds = Math.max(3, elapsedForThisQ);

    // Captura Comentário do Professor caso esteja aberto no card
    const teacherComment = extractTeacherCommentFromCard(card);

    return {
      id: qId,
      bloco,
      canonicalSubject,
      subject,
      topic,
      banca,
      ano,
      difficulty,
      content: content.slice(0, 1000),
      alternatives: alternatives.length > 0 ? alternatives : null,
      teacherComment: teacherComment || undefined,
      userChoice,
      correctChoice,
      hit: isCorrect,
      durationSeconds,
      confidence: isCorrect ? 'sabia' : 'duvida',
      errorReason: isCorrect ? null : 'conteudo',
      fsrsRequested: false,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- 5. SALVAR QUESTÃO DIRETO NO STORAGE (SEM RACE CONDITION) ---
  function saveQuestion(question, isMetadataUpdateOnly = false) {
    if (!isExtensionContextValid()) {
      teardownInstance();
      return;
    }

    checkDailySessionReset();

    if (!isMetadataUpdateOnly) {
      sessionStats.total += 1;
      if (question.hit) sessionStats.hits += 1;
      else sessionStats.errors += 1;
      updateHudStats();
    }

    const nowIso = new Date().toISOString();
    const resolvedOwnerId = cachedActiveUserId || question.ownerUserId || null;
    const buildAttemptsList = (prevObj, nextObj) => {
      const list = [];
      const addAttempt = (a) => {
        if (!a) return;
        const ts = a.timestamp || nowIso;
        const ms = new Date(ts).getTime() || 0;
        const hit = Boolean(a.hit);
        const userChoice = String(a.userChoice || '');
        const durationSeconds = Number(a.durationSeconds) || 0;
        const dup = list.some(ex => {
          const exMs = new Date(ex.timestamp || 0).getTime() || 0;
          return Math.abs(exMs - ms) <= 5000 && Boolean(ex.hit) === hit && String(ex.userChoice || '') === userChoice;
        });
        if (!dup) list.push({ timestamp: ts, hit, userChoice, durationSeconds });
      };
      if (prevObj) {
        if (Array.isArray(prevObj.attempts) && prevObj.attempts.length > 0) {
          prevObj.attempts.forEach(addAttempt);
        } else if (prevObj.timestamp || prevObj.userChoice) {
          addAttempt({
            timestamp: prevObj.timestamp || prevObj.updatedAt,
            hit: prevObj.hit,
            userChoice: prevObj.userChoice,
            durationSeconds: prevObj.durationSeconds
          });
        }
      }
      if (!isMetadataUpdateOnly) {
        addAttempt({
          timestamp: nextObj.timestamp || nowIso,
          hit: nextObj.hit,
          userChoice: nextObj.userChoice,
          durationSeconds: nextObj.durationSeconds
        });
      }
      return list;
    };

    const existingIdx = questionsCache.findIndex(q => q && q.id === question.id);
    if (existingIdx >= 0) {
      const prev = questionsCache[existingIdx];
      const communityCorrectPct = question.communityCorrectPct !== undefined ? question.communityCorrectPct : prev.communityCorrectPct;
      const communityErrorPct = question.communityErrorPct !== undefined
        ? question.communityErrorPct
        : (communityCorrectPct !== undefined && communityCorrectPct !== null ? Math.max(0, Math.min(100, Math.round(100 - communityCorrectPct))) : prev.communityErrorPct);
      const hitVal = Boolean(question.hit !== undefined ? question.hit : prev.hit);
      questionsCache[existingIdx] = {
        ...prev,
        ...question,
        ...(resolvedOwnerId ? { ownerUserId: resolvedOwnerId } : {}),
        attempts: buildAttemptsList(prev, question),
        teacherComment: question.teacherComment || prev.teacherComment || '',
        commentSource: question.commentSource || prev.commentSource || ((question.teacherComment || prev.teacherComment) ? 'professor' : ''),
        userNote: (question.userNote !== undefined && question.userNote !== '') ? question.userNote : (prev.userNote || ''),
        ...(communityCorrectPct !== undefined && communityCorrectPct !== null ? { communityCorrectPct, communityErrorPct, isPegadinha: communityErrorPct >= 65, isAvoidableError: !hitVal && communityCorrectPct >= 65 } : {}),
        alternatives: (Array.isArray(question.alternatives) && question.alternatives.length > 0)
          ? question.alternatives
          : (prev.alternatives || null),
        updatedAt: nowIso
      };
    } else {
      questionsCache.unshift({
        ...question,
        ...(resolvedOwnerId ? { ownerUserId: resolvedOwnerId } : {}),
        attempts: buildAttemptsList(null, question),
        updatedAt: question.updatedAt || nowIso
      });
    }

    savedQuestionIds.add(question.id);
    if (Array.isArray(question.alternatives) && question.alternatives.length > 0) {
      savedQuestionsMissingAlts.delete(question.id);
    }

    const updatedSession = {
      date: sessionStats.date || getTodaySessionDate(),
      total: sessionStats.total,
      hits: sessionStats.hits,
      errors: sessionStats.errors
    };

    const fullQuestionForDb = existingIdx >= 0 ? questionsCache[existingIdx] : questionsCache[0];
    if (fullQuestionForDb && fullQuestionForDb.id) {
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'DB_UPSERT_QUESTION',
            payload: {
              question: fullQuestionForDb,
              enqueueOutbox: true
            }
          }).catch(() => {});
        }
      } catch (_) {}
    }

    questionsCache = compactQuestionsForStorage(questionsCache);

    try {
      chrome.storage.local.set({
        [STORAGE_KEY]: questionsCache,
        [SESSION_KEY]: updatedSession
      }, () => {
        if (chrome.runtime.lastError) return;
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'UPDATE_BADGE_ONLY',
            payload: { session: updatedSession }
          }).catch(() => {});
        }
      });
    } catch (_) {}
  }

  // --- 6. EXIBIR E FECHAR PROMPT TÁTICO ---
  function dismissPrompt() {
    if (promptDismissTimer) {
      clearTimeout(promptDismissTimer);
      promptDismissTimer = null;
    }
    const promptBox = getHudEl('qg-prompt-box');
    if (promptBox) {
      promptBox.style.display = 'none';
    }
  }

  function showPrompt(question) {
    dismissPrompt();

    const promptBox = getHudEl('qg-prompt-box');
    const badge = getHudEl('qg-prompt-status-badge');
    const errorSection = getHudEl('qg-error-reasons');
    if (!promptBox || !badge || !errorSection) return;

    badge.className = `qg-prompt-badge ${question.hit ? 'hit' : 'error'}`;
    badge.textContent = question.hit ? '✓ ACERTOU' : '✗ ERROU';

    if (question.hit) {
      errorSection.style.display = 'none';
    } else {
      errorSection.style.display = 'block';
    }

    promptBox.querySelectorAll('.qg-btn-tag').forEach(b => b.classList.remove('active'));
    promptBox.style.display = 'block';

    promptDismissTimer = setTimeout(() => {
      dismissPrompt();
    }, 10000);
  }

  function extractCourseLessonTitle() {
    const ignored = new Set([
      'indice', 'charlie', 'bizus', 'arquivos', 'comentarios', 'comentario',
      'voltar', 'cursos', 'aulas', 'modulos', 'projeto caveira', 'digite para pesquisar'
    ]);
    const candidates = Array.from(
      document.querySelectorAll('h1, h2, h3, [aria-current="page"], [aria-current="true"], [class*="active"], [class*="selected"], [class*="lesson"] [class*="title"], [class*="video"] [class*="title"]')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt.length < 4 || txt.length > 140) return false;
      if (/^[[(]?\d{1,2}:\d{2}/.test(txt)) return false;
      const norm = normalizeCourseIndexKey(txt);
      if (!norm || ignored.has(norm)) return false;
      if (/^\d+\s+[a-z]/.test(norm) && !norm.includes('parte') && !norm.includes('aula')) return false;
      return true;
    });

    candidates.sort((a, b) => {
      const aTxt = normalizeCourseIndexKey(a.innerText || a.textContent);
      const bTxt = normalizeCourseIndexKey(b.innerText || b.textContent);
      const aPart = /\bparte\s*\d+\b|\baula\s*\d+\b/.test(aTxt) ? 0 : 1;
      const bPart = /\bparte\s*\d+\b|\baula\s*\d+\b/.test(bTxt) ? 0 : 1;
      if (aPart !== bPart) return aPart - bPart;
      const aHeading = a.matches('h1, h2, h3') ? 0 : 1;
      const bHeading = b.matches('h1, h2, h3') ? 0 : 1;
      return aHeading - bHeading;
    });

    if (candidates[0]) {
      return (candidates[0].innerText || candidates[0].textContent || '').replace(/\s+/g, ' ').trim();
    }

    const docTitle = String(document.title || '')
      .replace(/\s*[|\-–]\s*projeto\s*caveira.*$/i, '')
      .replace(/\s*[|\-–]\s*caveira.*$/i, '')
      .trim();
    return docTitle.length >= 4 && !ignored.has(normalizeCourseIndexKey(docTitle)) ? docTitle : '';
  }

  function isCourseTabActive(el) {
    if (!el) return false;
    const cls = String(el.className || '');
    return Boolean(
      el.getAttribute('aria-selected') === 'true' ||
      el.getAttribute('data-state') === 'active' ||
      el.classList.contains('q-tab--active') ||
      /\bactive\b/i.test(cls)
    );
  }

  function findCourseTabElement(tabNameNorm) {
    return Array.from(document.querySelectorAll('button, [role="tab"], .q-tab, a, div, span')).find(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 32 || r.width > 200 || r.height < 20 || r.height > 58) return false;
      const txt = normalizeFilterText(el.innerText || el.textContent);
      return txt === tabNameNorm;
    }) || null;
  }

  function extractCourseIndexRawTextFromDom() {
    const tsRegex = /\[\d{1,2}:\d{2}(?::\d{2})?\]/g;
    const containers = [];
    for (const el of document.querySelectorAll('div, ul, ol, section, aside, main')) {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) continue;
      const txt = el.innerText || el.textContent || '';
      const matches = txt.match(tsRegex);
      if (matches && matches.length >= 2) {
        containers.push({ el, count: matches.length, len: txt.length, txt });
      }
    }

    if (containers.length === 0) return '';

    containers.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.len - b.len;
    });

    const best = containers[0];
    const rawLines = best.txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tsLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      const cur = rawLines[i];
      if (/^\[\d{1,2}:\d{2}(?::\d{2})?\]$/.test(cur) && i + 1 < rawLines.length) {
        tsLines.push(`${cur} ${rawLines[i + 1]}`);
        i += 1;
      } else if (/^\[\d{1,2}:\d{2}(?::\d{2})?\]\s*\S+/.test(cur)) {
        tsLines.push(cur);
      }
    }
    return tsLines.join('\n');
  }

  function extractCourseBizusRawTextFromDom() {
    const bizusTab = findCourseTabElement('bizus');
    if (!bizusTab || !isCourseTabActive(bizusTab)) return '';

    const tabRect = bizusTab.getBoundingClientRect();
    let panelEl = null;

    const ariaControls = bizusTab.getAttribute('aria-controls');
    if (ariaControls) {
      const target = document.getElementById(ariaControls);
      if (target && isElementVisible(target)) panelEl = target;
    }

    if (!panelEl) {
      const panels = Array.from(document.querySelectorAll('.q-tab-panel, [role="tabpanel"], section, div'))
        .filter(el => {
          if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
          if (el.contains(bizusTab)) return false;
          const r = el.getBoundingClientRect();
          if (r.top < tabRect.bottom - 6) return false;
          if (r.width < 220 || r.height < 60) return false;
          const txt = (el.innerText || el.textContent || '').trim();
          return txt.length >= 15 && txt.length <= 8000;
        })
        .sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return Math.abs(ra.top - tabRect.bottom) - Math.abs(rb.top - tabRect.bottom) || (ra.width * ra.height) - (rb.width * rb.height);
        });
      panelEl = panels[0] || null;
    }

    if (!panelEl) return '';

    const titles = [];
    const seen = new Set();

    const cleanBizusTitleCandidate = (rawStr) => {
      let s = String(rawStr || '').replace(/\s+/g, ' ').trim();
      if (!s) return '';
      s = s.replace(/^(?:[-•*●▪◦]|\d{1,2}\s*[.)\-–—]|[IVXLCDM]{1,5}\s*[.)\-–—])\s+/i, '').trim();
      if (!s) return '';
      let didTruncateColon = false;
      const colonIdx = s.indexOf(':');
      if (colonIdx > 2 && colonIdx < s.length - 1) {
        const beforeColon = s.slice(0, colonIdx).trim();
        const afterColon = s.slice(colonIdx + 1).trim();
        const afterWords = afterColon.split(/\s+/).filter(Boolean).length;
        const beforeNorm = normalizeFilterText(beforeColon);
        if (
          beforeNorm.length >= 4 &&
          !/^(?:obs(?:ervacao)?|atencao|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|sumula|importante)$/.test(beforeNorm) &&
          (afterColon.length > 25 || afterWords > 4)
        ) {
          s = beforeColon;
          didTruncateColon = true;
        }
      }
      if (!didTruncateColon) {
        const dashMatch = s.match(/^(.+?)\s+[-–—]\s+(.+)$/);
        if (dashMatch) {
          const beforeDash = dashMatch[1].trim();
          const afterDash = dashMatch[2].trim();
          const beforeNorm = normalizeCourseIndexKey(beforeDash);
          const afterWords = afterDash.split(/\s+/).filter(Boolean).length;
          if (
            beforeNorm.length >= 4 &&
            !PURE_ARTICLE_LINE_REGEX.test(beforeDash) &&
            !LEADING_INDEX_FILLER_REGEX.test(beforeDash) &&
            !isOnlyGenericWords(beforeDash) &&
            !/^(?:obs(?:ervacao)?|atencao|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|sumula|importante)$/.test(beforeNorm) &&
            (afterDash.length > 35 || afterWords > 6)
          ) {
            s = beforeDash;
          }
        }
      }
      s = s.replace(/\s*\([^()]{28,}\)\s*$/g, '').trim();
      s = s.replace(/[:;.\-–—]+$/g, '').trim();
      return s;
    };

    const pushBizusTitle = (rawCandidate) => {
      const rawTrimmed = String(rawCandidate || '').replace(/\s+/g, ' ').trim();
      if (!rawTrimmed) return false;
      const title = cleanBizusTitleCandidate(rawTrimmed);
      if (!title || title.length < 3 || title.length > 85) return false;
      if (/\.\s*$/.test(rawTrimmed) && title.split(/\s+/).length > 8 && rawTrimmed.length > 85) return false;
      if (PROSE_NOTE_PREFIX_REGEX.test(title) || PROSE_NOTE_PREFIX_REGEX.test(rawTrimmed)) return false;
      const key = normalizeCourseIndexKey(title);
      if (
        !key ||
        key.length < 3 ||
        key === 'bizus' ||
        key === 'indice' ||
        key === 'charlie' ||
        key === 'arquivos' ||
        key === 'comentarios' ||
        GENERIC_INDEX_LINES.has(key)
      ) {
        return false;
      }
      if (!seen.has(key)) {
        seen.add(key);
        titles.push(title);
        return true;
      }
      return false;
    };

    // Extrai apenas títulos estruturados de assuntos (Headings, <ol> > <li>, blocos/linhas numeradas "1. Título")
    const structuralNodes = Array.from(panelEl.querySelectorAll('h1, h2, h3, h4, h5, h6, li, p, div, span'))
      .filter(el => el && isElementVisible(el));

    for (const el of structuralNodes) {
      const tag = (el.tagName || '').toUpperCase();

      // Regra 1: Headings
      if (/^H[1-6]$/.test(tag)) {
        pushBizusTitle(el.innerText || el.textContent || '');
        continue;
      }

      // Regra 2: Itens diretos de listas ordenadas (<ol> > <li>)
      if (tag === 'LI' && el.parentElement && (el.parentElement.tagName || '').toUpperCase() === 'OL') {
        const liText = (el.innerText || el.textContent || '').trim();
        const leadNode = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'))
          .find(child => !child.closest('ul') && child.closest('ol, ul') === el.parentElement && isElementVisible(child));
        if (leadNode) {
          const leadText = (leadNode.innerText || leadNode.textContent || '').replace(/\s+/g, ' ').trim();
          const liNorm = normalizeFilterText(liText).replace(/^\d{1,2}\s*[.)\-–—]\s*/, '').trim();
          const leadNorm = normalizeFilterText(leadText);
          if (leadText && leadText.length <= 85 && leadNorm && liNorm.startsWith(leadNorm)) {
            pushBizusTitle(leadText);
            continue;
          }
        }
        const firstLine = (liText.split(/\r?\n/)[0] || '').trim();
        if (firstLine && firstLine.length <= 85 && !(/\.\s*$/.test(firstLine) && firstLine.split(/\s+/).length > 8)) {
          pushBizusTitle(firstLine);
        }
        continue;
      }

      // Regra 3: Blocos iniciando com numeração explícita (ex.: "1. Desconcentração", "2) Descentralização")
      if (tag === 'P' || tag === 'DIV' || tag === 'LI' || tag === 'SPAN') {
        if (tag === 'DIV' && el.querySelector('p, div, ol, ul, h1, h2, h3, h4, h5, h6')) {
          continue;
        }
        if (el.closest('ul')) {
          continue;
        }
        if (tag !== 'LI' && el.closest('ol')) {
          continue;
        }
        const blockText = (el.innerText || el.textContent || '').trim();
        const firstLine = (blockText.split(/\r?\n/)[0] || '').trim();
        const numMatch = firstLine.match(/^\s*(\d{1,2}\s*[.)\-–—]\s+)(.+)$/);
        if (numMatch) {
          const afterNumber = numMatch[2].trim();
          const boldNode = Array.from(el.querySelectorAll('strong, b')).find(child => !child.closest('ul') && isElementVisible(child));
          if (boldNode) {
            const boldText = (boldNode.innerText || boldNode.textContent || '').replace(/\s+/g, ' ').trim();
            const afterNorm = normalizeFilterText(afterNumber);
            const boldNorm = normalizeFilterText(boldText);
            if (boldText && boldText.length <= 85 && boldNorm && afterNorm.startsWith(boldNorm)) {
              pushBizusTitle(boldText);
              continue;
            }
          }
          if (afterNumber.length <= 85 || afterNumber.includes(':')) {
            pushBizusTitle(firstLine);
          }
        }
      }
    }

    // Complemento da Regra 3 para linhas numeradas separadas por <br>/texto corrido em panelEl.innerText
    const rawPanelText = (panelEl.innerText || panelEl.textContent || '').trim();
    if (rawPanelText) {
      for (const line of rawPanelText.split(/\r?\n/)) {
        const trimmedLine = line.trim();
        if (!/^\s*\d{1,2}\s*[.)\-–—]\s+[A-Za-zÀ-ÿ]/.test(trimmedLine)) continue;
        const candidate = cleanBizusTitleCandidate(trimmedLine);
        const candidateKey = normalizeCourseIndexKey(candidate);
        if (!candidateKey) continue;
        const alreadyCoveredByShortTitle = titles.some(t => {
          const tk = normalizeCourseIndexKey(t);
          return tk && (candidateKey === tk || candidateKey.startsWith(`${tk} `));
        });
        if (alreadyCoveredByShortTitle) continue;
        pushBizusTitle(trimmedLine);
      }
    }

    // Regra 4: Caso nenhuma regra estruturada/numerada tenha retornado títulos, aceita negritos isolados (<p><strong>Título</strong></p>)
    if (titles.length === 0) {
      const boldNodes = Array.from(panelEl.querySelectorAll('strong, b')).filter(el => el && isElementVisible(el));
      for (const boldEl of boldNodes) {
        if (boldEl.closest('ul')) continue;
        const parentBlock = boldEl.closest('p, div, li') || boldEl.parentElement;
        if (!parentBlock) continue;
        const parentFirstLine = ((parentBlock.innerText || parentBlock.textContent || '').split(/\r?\n/)[0] || '').trim();
        const boldText = (boldEl.innerText || boldEl.textContent || '').replace(/\s+/g, ' ').trim();
        if (!boldText || boldText.length > 80) continue;
        const cleanParentKey = normalizeCourseIndexKey(cleanBizusTitleCandidate(parentFirstLine));
        const cleanBoldKey = normalizeCourseIndexKey(cleanBizusTitleCandidate(boldText));
        if (cleanParentKey && cleanParentKey === cleanBoldKey) {
          pushBizusTitle(boldText);
        }
      }
    }

    if (titles.length === 0) return '';
    return titles.slice(0, 20).map((t, idx) => `${idx + 1}. ${t}`).join('\n');
  }

  function scanCourseVideoIndex() {
    if (isDestroyed || !isCoursePage()) return;

    const lessonTitle = extractCourseLessonTitle();
    const peekKey = `${window.location.href}|${lessonTitle}`;

    let captureSource = 'bizus';
    let rawIndexText = extractCourseBizusRawTextFromDom();

    if (!rawIndexText) {
      const bizusTab = findCourseTabElement('bizus');
      if (bizusTab && !isCourseTabActive(bizusTab) && !peekedCourseUrls.has(peekKey)) {
        peekedCourseUrls.add(peekKey);
        clickElementRealistically(bizusTab);
        setTimeout(scanCourseVideoIndex, 450);
        setTimeout(scanCourseVideoIndex, 950);
        return;
      }

      const indexText = extractCourseIndexRawTextFromDom();
      if (indexText) {
        rawIndexText = indexText;
        captureSource = 'indice';
      } else {
        const indexTab = findCourseTabElement('indice');
        const indicePeekKey = `${peekKey}|indice`;
        if (indexTab && !isCourseTabActive(indexTab) && !peekedCourseUrls.has(indicePeekKey)) {
          peekedCourseUrls.add(indicePeekKey);
          clickElementRealistically(indexTab);
          setTimeout(scanCourseVideoIndex, 450);
        }
        return;
      }
    }

    const subtopics = parseCourseIndexSubtopics(rawIndexText, lessonTitle ? [lessonTitle] : []);
    if (subtopics.length === 0) return;

    currentCourseIndexStatus = {
      count: subtopics.length,
      lessonTitle,
      source: captureSource,
      subtopics,
      rawIndexText,
      preview: `${lessonTitle ? lessonTitle + ': ' : ''}${subtopics.slice(0, 6).join(' • ')}`
    };

    const currentQEl = getHudEl('qg-current-q-id');
    if (currentQEl) {
      const label = captureSource === 'bizus' ? 'Bizus capturado' : 'Índice capturado';
      currentQEl.textContent = `📑 ${label} (${subtopics.length} subassuntos)`;
      currentQEl.title = currentCourseIndexStatus.preview;
    }

    const courseActionsEl = getHudEl('qg-hud-course-actions');
    if (courseActionsEl) {
      courseActionsEl.style.display = 'flex';
    }

    const signature = `${captureSource}|${window.location.href}|${lessonTitle}|${rawIndexText}`;
    if (signature === lastCapturedCourseSignature || !isExtensionContextValid()) return;
    lastCapturedCourseSignature = signature;

    let videoId = '';
    try {
      videoId = new URL(window.location.href).searchParams.get('course_video_id') || '';
    } catch (_) {}

    const entry = {
      url: window.location.href,
      videoId,
      lessonTitle,
      source: captureSource,
      rawIndexText,
      ...(captureSource === 'bizus' ? { bizusRawText: rawIndexText, bizusSubtopics: subtopics } : {}),
      subtopics,
      capturedAt: Date.now()
    };

    try {
      chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
        if (chrome.runtime.lastError || isDestroyed) return;
        const prev = (res?.[COURSE_INDEX_CACHE_KEY] && typeof res[COURSE_INDEX_CACHE_KEY] === 'object')
          ? res[COURSE_INDEX_CACHE_KEY]
          : { latest: null, byLesson: {} };
        const nextByLesson = { ...(prev.byLesson || {}) };
        const lessonKey = normalizeCourseIndexKey(lessonTitle);
        if (lessonKey) {
          const existing = nextByLesson[lessonKey];
          if (captureSource === 'bizus') {
            nextByLesson[lessonKey] = entry;
          } else if (existing && existing.source === 'bizus') {
            // Mantém os títulos dos Bizus como fonte prioritária da aula
          } else {
            nextByLesson[lessonKey] = entry;
          }
        }
        // Mantém no máximo 40 aulas mais recentes em cache
        const ordered = Object.entries(nextByLesson)
          .sort((a, b) => (b[1]?.capturedAt || 0) - (a[1]?.capturedAt || 0))
          .slice(0, 40);
        const compactedByLesson = Object.fromEntries(ordered);
        const latestEntry =
          (prev.latest && prev.latest.source === 'bizus' && captureSource === 'indice' && lessonKey && normalizeCourseIndexKey(prev.latest.lessonTitle || '') === lessonKey)
            ? prev.latest
            : ((lessonKey && compactedByLesson[lessonKey]) || entry);
        chrome.storage.local.set({
          [COURSE_INDEX_CACHE_KEY]: {
            latest: latestEntry,
            byLesson: compactedByLesson
          }
        });
      });
    } catch (_) {}
  }

  function extractTeacherCommentFromCard(card) {
    if (!card) return '';
    const commentNodes = card.querySelectorAll(
      '.teacher-comment, .comment-teacher, .professor-comment, .comentario-professor, [class*="teacher-comment"], [class*="comentario"], [class*="gabarito-comentado"], .q-tab-panel'
    );
    for (const node of commentNodes) {
      const txt = (node.innerText || node.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
      if (!txt || txt.length <= 45) continue;
      const upper = txt.toUpperCase();
      if (
        upper.startsWith('SELECIONE') ||
        txt.includes('Estatísticas da questão') ||
        txt.includes('Acertos e erros') ||
        txt.includes('Digite seu comentário') ||
        txt.includes('Nenhum comentário ainda')
      ) {
        continue;
      }
      return txt.slice(0, 2500);
    }
    return '';
  }

  function extractCommunityStatsFromNode(rootNode) {
    if (!rootNode) return null;
    const text = (rootNode.innerText || rootNode.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    let correctPct = null;
    let errorPct = null;
    const corrMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:acert|corret)|(?:acertos?|acertaram)[^%\d]{0,20}(\d{1,3}(?:[.,]\d+)?)\s*%/i);
    if (corrMatch) {
      correctPct = Math.round(parseFloat((corrMatch[1] || corrMatch[2]).replace(',', '.')));
    }
    const errMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:err|incorret)|(?:erros?|erraram)[^%\d]{0,20}(\d{1,3}(?:[.,]\d+)?)\s*%/i);
    if (errMatch) {
      errorPct = Math.round(parseFloat((errMatch[1] || errMatch[2]).replace(',', '.')));
    }
    if (correctPct !== null && (correctPct < 0 || correctPct > 100)) correctPct = null;
    if (errorPct !== null && (errorPct < 0 || errorPct > 100)) errorPct = null;
    if (correctPct === null && errorPct !== null) correctPct = Math.max(0, Math.min(100, 100 - errorPct));
    if (errorPct === null && correctPct !== null) errorPct = Math.max(0, Math.min(100, 100 - correctPct));
    if (correctPct === null) return null;
    return { communityCorrectPct: correctPct, communityErrorPct: errorPct };
  }

  function extractPrivateNoteFromCard(card) {
    if (!card) return '';
    const panels = Array.from(card.querySelectorAll('.q-tab-panel, [role="tabpanel"]'));
    for (const p of panels) {
      if (!isElementVisible(p)) continue;
      const ta = p.querySelector('textarea');
      if (ta && ta.value && ta.value.trim().length > 2) {
        return ta.value.trim().slice(0, 1000);
      }
      const ce = p.querySelector('[contenteditable="true"]');
      if (ce && ce.innerText && ce.innerText.trim().length > 2) {
        return ce.innerText.trim().slice(0, 1000);
      }
      const savedNote = p.querySelector('.note-content, .anotacao, p, .q-item__label');
      if (savedNote && savedNote.innerText) {
        const t = savedNote.innerText.trim();
        if (t.length > 3 && !/nenhuma anota|digite sua anota|adicionar anota/i.test(t)) {
          return t.slice(0, 1000);
        }
      }
    }
    return '';
  }

  function extractCharlieOrStudentCommentFromCard(card) {
    if (!card) return '';
    const panels = Array.from(card.querySelectorAll('.q-tab-panel, [role="tabpanel"], .comments-list, .q-list'));
    for (const node of panels) {
      if (!isElementVisible(node)) continue;
      const txt = (node.innerText || node.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
      if (!txt || txt.length <= 50) continue;
      if (
        /^(?:carregando|gerando|nenhum coment|pergunte ao charlie|digite seu coment)/i.test(txt) ||
        txt.includes('Estatísticas da questão')
      ) {
        continue;
      }
      return txt.slice(0, 2500);
    }
    return '';
  }

  function triggerSilentTeacherCommentCapture(card, qId) {
    if (!card || !qId || autoCommentAttemptedQIds.has(qId)) return;
    autoCommentAttemptedQIds.add(qId);

    const tabs = Array.from(card.querySelectorAll('.q-tab, [role="tab"], button, .q-btn')).filter(el => {
      if (!el || el.closest('#qg-caveira-shadow-host, #qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      return r.width >= 30 && r.height >= 18 && r.height <= 56;
    });

    const findTab = (matcher) => tabs.find(t => matcher(normalizeFilterText(t.innerText || t.textContent)));
    const teacherTab = findTab(tText =>
      tText === 'comentario do professor' ||
      tText === 'comentarios do professor' ||
      tText === 'gabarito comentado' ||
      tText === 'professor' ||
      (tText.includes('comentario') && tText.includes('professor')) ||
      tText === 'comentario'
    );
    const charlieTab = findTab(tText => tText.includes('charlie'));
    const studentTab = findTab(tText => tText === 'comentarios' || tText === 'comentarios alunos' || (tText.includes('coment') && !tText.includes('professor')));
    const notesTab = findTab(tText => tText.includes('anotac'));
    const statsTab = findTab(tText => tText.includes('estatist'));

    const activeTabBefore = tabs.find(t =>
      t.getAttribute('aria-selected') === 'true' ||
      t.classList.contains('q-tab--active') ||
      /\bactive\b/i.test(t.className || '')
    ) || null;

    const patch = {};
    // #2: Primeiro aproveita dados já capturados passivamente da API (zero cliques em abas)
    const apiData = apiQuestionCache.get(qId);
    if (apiData) {
      if (apiData.teacherComment) {
        patch.teacherComment = apiData.teacherComment;
        patch.commentSource = apiData.commentSource || 'professor';
      }
      if (apiData.communityCorrectPct !== undefined) {
        patch.communityCorrectPct = apiData.communityCorrectPct;
        patch.communityErrorPct = apiData.communityErrorPct;
      }
      if (apiData.userNote) {
        patch.userNote = apiData.userNote;
      }
    }

    // Verifica estatísticas e comentário visíveis imediatamente
    const inlineStats = extractCommunityStatsFromNode(card.querySelector('.stats-box') || card);
    if (inlineStats && patch.communityCorrectPct === undefined) Object.assign(patch, inlineStats);

    const immediateProf = extractTeacherCommentFromCard(card);
    if (immediateProf && !patch.teacherComment) {
      patch.teacherComment = immediateProf;
      patch.commentSource = 'professor';
    }

    const waitMs = (ms) => new Promise(r => setTimeout(r, ms));
    let didClickTab = false;
    const saveScrollAndClick = async (tabEl, delay = 260) => {
      if (!tabEl || !card.isConnected || isDestroyed) return false;
      const yBefore = window.scrollY;
      didClickTab = true;
      tabEl.click();
      if (Math.abs(window.scrollY - yBefore) > 4) window.scrollTo({ top: yBefore, behavior: 'instant' });
      await waitMs(delay);
      return !isDestroyed && card.isConnected;
    };

    (async () => {
      try {
        const existing = questionsCache.find(item => item && item.id === qId) || {};
        if (!patch.teacherComment && !existing.teacherComment && teacherTab && teacherTab !== activeTabBefore) {
          if (await saveScrollAndClick(teacherTab, 320)) {
            const profTxt = extractTeacherCommentFromCard(card);
            if (profTxt) {
              patch.teacherComment = profTxt;
              patch.commentSource = 'professor';
            }
          }
        }

        // #3 Fallback Charlie IA ou Comentário da Comunidade se Professor estiver vazio
        if (!patch.teacherComment && !existing.teacherComment && charlieTab) {
          if (await saveScrollAndClick(charlieTab, 300)) {
            const cTxt = extractCharlieOrStudentCommentFromCard(card);
            if (cTxt) {
              patch.teacherComment = cTxt;
              patch.commentSource = 'charlie';
            }
          }
        }
        if (!patch.teacherComment && !existing.teacherComment && studentTab) {
          if (await saveScrollAndClick(studentTab, 280)) {
            const sTxt = extractCharlieOrStudentCommentFromCard(card);
            if (sTxt) {
              patch.teacherComment = sTxt;
              patch.commentSource = 'aluno';
            }
          }
        }

        // #3 Captura Anotações privadas
        if (notesTab && !patch.userNote && !existing.userNote) {
          if (await saveScrollAndClick(notesTab, 220)) {
            const noteTxt = extractPrivateNoteFromCard(card);
            if (noteTxt) patch.userNote = noteTxt;
          }
        }

        // #12 Captura % de acertos da comunidade (Estatísticas)
        if (patch.communityCorrectPct === undefined && existing.communityCorrectPct === undefined && statsTab) {
          if (await saveScrollAndClick(statsTab, 220)) {
            const st = extractCommunityStatsFromNode(card.querySelector('.q-tab-panel') || card);
            if (st) Object.assign(patch, st);
          }
        }

        if (didClickTab && activeTabBefore && activeTabBefore.isConnected) {
          const yBefore = window.scrollY;
          activeTabBefore.click();
          if (Math.abs(window.scrollY - yBefore) > 4) window.scrollTo({ top: yBefore, behavior: 'instant' });
        }

        if (Object.keys(patch).length > 0 && card.isConnected && !isDestroyed) {
          const latest = questionsCache.find(item => item && item.id === qId);
          if (latest) {
            saveQuestion({ ...latest, ...patch }, true);
          }
        }
      } catch (_) {}
    })();
  }

  // --- 7. VARREDURA DE CARDS E DETECÇÃO DE VIEWPORT ---
  function scanCards() {
    if (!isExtensionContextValid()) {
      teardownInstance();
      return;
    }
    createHud();
    if (!isStorageLoaded) return;

    updateContextualHud();

    if (isCoursePage()) {
      scanCourseVideoIndex();
      applySubjectVideoSpeedInPlayground();
      observeLessonCompletionOnPlayground();
    } else {
      const courseActionsEl = getHudEl('qg-hud-course-actions');
      if (courseActionsEl) courseActionsEl.style.display = 'none';
    }

    const cards = getQuestionCards();
    if (!cards || cards.length === 0) {
      clearActiveQuestionState();
      return;
    }

    cards.forEach(card => {
      const qId = extractQuestionId(card);
      if (!qId) return;

      // Se a questão já estava salva antes da v1.1.4 sem o texto das alternativas, enriquece automaticamente!
      if (savedQuestionsMissingAlts.has(qId)) {
        const enriched = extractQuestionData(card, qId);
        if (enriched && Array.isArray(enriched.alternatives) && enriched.alternatives.length > 0) {
          savedQuestionsMissingAlts.delete(qId);
          const existing = questionsCache.find(item => item && item.id === qId) || {};
          saveQuestion({
            ...existing,
            id: qId,
            alternatives: enriched.alternatives,
            subject: (existing.subject && existing.subject !== 'Geral') ? existing.subject : enriched.subject,
            topic: (existing.topic && existing.topic !== 'Geral') ? existing.topic : enriched.topic,
            canonicalSubject: enriched.canonicalSubject || existing.canonicalSubject,
            bloco: enriched.bloco || existing.bloco,
            content: enriched.content || existing.content
          }, true);
        }
      }

      // Se a questão já estava salva e falta comentário, nota privada ou estatística da comunidade, captura silenciosamente!
      if (savedQuestionIds.has(qId)) {
        const existing = questionsCache.find(item => item && item.id === qId);
        if (existing && (!existing.teacherComment || existing.communityCorrectPct === undefined)) {
          const commentTxt = !existing.teacherComment ? extractTeacherCommentFromCard(card) : '';
          if (commentTxt) {
            saveQuestion({ ...existing, teacherComment: commentTxt, commentSource: 'professor' }, true);
          } else if (isCardAnswered(card) && !autoCommentAttemptedQIds.has(qId)) {
            setTimeout(() => triggerSilentTeacherCommentCapture(card, qId), 350);
          }
        }
      }

      const answered = isCardAnswered(card);

      if (!answered) {
        processedInSession.delete(qId);
      } else {
        // A questão está respondida no Caveira!
        // Se ela ainda não está salva no storage do QG ou se o usuário acabou de clicar em Responder, captura imediatamente!
        const shouldCapture = !savedQuestionIds.has(qId) || pendingAnswerQIds.has(qId);

        if (shouldCapture && !processedInSession.has(qId)) {
          processedInSession.add(qId);
          pendingAnswerQIds.delete(qId);

          pauseTimer();

          const currentQEl = getHudEl('qg-current-q-id');
          if (currentQEl) {
            currentQEl.textContent = `${qId} ✓`;
          }

          const questionData = extractQuestionData(card, qId);
          if (questionData) {
            activeQuestionData = questionData;
            saveQuestion(questionData, false);
            renderQuestionHistory(qId, true);
            showPrompt(questionData);
            if (!questionData.teacherComment || questionData.communityCorrectPct === undefined || !questionData.userNote) {
              setTimeout(() => triggerSilentTeacherCommentCapture(card, qId), 380);
            }
          }
        }
      }
    });

    // Atualiza a questão ativa de acordo com o card que está visível no centro da tela (scroll)
    const focusedCard = findCardInViewport(cards);
    if (focusedCard) {
      const focusedQId = extractQuestionId(focusedCard);
      const focusedAnswered = isCardAnswered(focusedCard);
      if (focusedQId) {
        switchActiveQuestion(focusedQId, focusedAnswered);
      }
    }
  }

  function scheduleScan(delay = 40) {
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(scanCards, delay);
  }

  // Handler leve para rolagem da página (detecta imediatamente quando o usuário rola para a questão de baixo)
  function handleScrollUpdate() {
    if (isDestroyed) return;
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      if (isDestroyed) return;
      const cards = getQuestionCards();
      if (!cards || cards.length === 0) {
        clearActiveQuestionState();
        return;
      }
      const focusedCard = findCardInViewport(cards);
      if (focusedCard) {
        const focusedQId = extractQuestionId(focusedCard);
        const focusedAnswered = isCardAnswered(focusedCard);
        if (focusedQId) {
          switchActiveQuestion(focusedQId, focusedAnswered);
        }
      }
    });
  }

  // --- 8. GATILHOS DE INTERAÇÃO E ROLAGEM (SCROLL) ---
  function setupTriggers() {
    handleScrollUpdateRef = handleScrollUpdate;
    handlePopstateHashRef = () => scheduleScan(50);

    // 1. Detecção em tempo real ao rolar a página e ao trocar de rota na SPA
    window.addEventListener('scroll', handleScrollUpdateRef, { capture: true, passive: true });
    window.addEventListener('wheel', handleScrollUpdateRef, { passive: true });
    window.addEventListener('popstate', handlePopstateHashRef);
    window.addEventListener('hashchange', handlePopstateHashRef);

    // 2. Cliques do usuário
    handleDocumentClickRef = (e) => {
      if (isDestroyed) return;
      if (isEventInsideHud(e)) return;

      const card = e.target.closest('.q-card');
      const rootCard = (card && card.parentElement?.closest('.q-card')) ? card.parentElement.closest('.q-card') : card;
      const clickedCardQId = rootCard ? extractQuestionId(rootCard) : null;

      if (rootCard && clickedCardQId) {
        switchActiveQuestion(clickedCardQId, isCardAnswered(rootCard));
      }

      const alt = e.target.closest('.alternative');
      if (alt) {
        const letter = alt.querySelector('.alternative-letter')?.textContent?.trim();
        if (letter && letter.length <= 2) {
          lastUserClickedChoice = letter;
        }
      }

      const btn = e.target.closest('button, .q-btn, a');
      if (btn) {
        const text = (btn.textContent || '').trim();
        const textUpper = text.toUpperCase();
        if (
          textUpper.includes('RESPONDER') ||
          textUpper.includes('CONFIRMAR') ||
          btn.classList.contains('light-mode-answer-btn') ||
          (btn.getAttribute('aria-label') || '').toUpperCase().includes('RESPONDER')
        ) {
          const targetQId = clickedCardQId || currentQuestionId;
          const targetCard = rootCard || getQuestionCards().find(c => extractQuestionId(c) === targetQId);
          if (targetQId && targetCard && !isCardAnswered(targetCard)) {
            processedInSession.delete(targetQId);
            pendingAnswerQIds.add(targetQId);
          }
          // Varreduras rápidas e estendidas para cobrir qualquer atraso de rede da API do Caveira
          [40, 100, 200, 400, 800, 1500, 2500, 4000].forEach(delay => setTimeout(scanCards, delay));

          // Auto-captura invisível do Comentário do Professor com restauração imediata da aba original do card
          setTimeout(() => {
            if (targetCard && targetQId) {
              triggerSilentTeacherCommentCapture(targetCard, targetQId);
            }
          }, 420);
        }

        if (
          textUpper.includes('PRÓXIMA') ||
          textUpper.includes('AVANÇAR') ||
          btn.querySelector('.material-icons')?.textContent?.includes('chevron_right') ||
          btn.querySelector('.material-icons')?.textContent?.includes('navigate_next')
        ) {
          setTimeout(scanCards, 80);
          setTimeout(scanCards, 300);
        }
      }
    };
    document.addEventListener('click', handleDocumentClickRef, true);

    // 3. Teclado (Enter, Setas, PageDown/PageUp)
    handleDocumentKeydownRef = (e) => {
      if (isDestroyed) return;
      if (e.key === 'Enter' && currentQuestionId) {
        const focusedCard = getQuestionCards().find(c => extractQuestionId(c) === currentQuestionId);
        if (focusedCard && !isCardAnswered(focusedCard)) {
          processedInSession.delete(currentQuestionId);
          pendingAnswerQIds.add(currentQuestionId);
          setTimeout(scanCards, 80);
          setTimeout(scanCards, 350);
        }
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'PageUp') {
        setTimeout(handleScrollUpdate, 60);
        setTimeout(scanCards, 200);
      }
    };
    document.addEventListener('keydown', handleDocumentKeydownRef);

    // 4. MutationObserver para capturar respostas instantaneamente
    domObserver = new MutationObserver((mutations) => {
      const isInternal = mutations.every(m => isMutationInsideHud(m));
      if (isInternal) return;
      scheduleScan(40);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled']
    });

    scanIntervalId = setInterval(scanCards, 1500);
    scanCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createHud();
      setupTriggers();
    });
  } else {
    createHud();
    setupTriggers();
  }
})();
