// Bridge entre a Extensão e a aplicação Web QG da PRF (v3 Strict)

(function() {
  try {
    window.dispatchEvent(new CustomEvent('qg-bridge-teardown'));
  } catch (_) {}

  console.log('💀 [QG Bridge] Inicializado na aplicação web.');

  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';
  const ACTIVE_USER_KEY = 'qg_active_user_id';
  const ACTIVE_USER_LABEL_KEY = 'qg_active_user_label';
  const USER_BUCKETS_KEY = 'qg_caveira_user_buckets';
  const GOAL_KEY = 'qg_caveira_daily_goal';
  const PENDING_FILTER_KEY = 'qg_pending_caveira_filter';
  const COURSE_INDEX_CACHE_KEY = 'qg_caveira_course_index_cache';
  const MAX_BUCKET_QUESTIONS = 1500;
  let isBridgeDestroyed = false;
  let cachedActiveUserId = null;
  let lastSyncPayloadJson = '';
  let lastSyncPayloadTime = 0;

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

  function postSyncUpdate(questions, userId) {
    if (isBridgeDestroyed || !Array.isArray(questions) || !userId) return;
    const scopedQuestions = questions.filter(q => q && (!q.ownerUserId || q.ownerUserId === userId));
    const now = Date.now();
    let payloadJson = '';
    try {
      payloadJson = JSON.stringify({ userId, scopedQuestions });
    } catch (_) {
      payloadJson = `${userId}:${scopedQuestions.length}`;
    }
    if (payloadJson === lastSyncPayloadJson && now - lastSyncPayloadTime < 800) {
      return;
    }
    lastSyncPayloadJson = payloadJson;
    lastSyncPayloadTime = now;
    window.postMessage({
      source: 'QG_CAVEIRA_EXTENSION',
      type: 'SYNC_UPDATE',
      payload: { questions: scopedQuestions, userId }
    }, '*');
  }

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
      return { date: today, total: 0, hits: 0, errors: 0 };
    }
    return {
      date: today,
      total: Number(rawSession.total) || 0,
      hits: Number(rawSession.hits) || 0,
      errors: Number(rawSession.errors) || 0
    };
  }

  // Marca que a extensão está instalada no navegador
  document.documentElement.setAttribute('data-qg-caveira-extension-installed', 'true');
  window.postMessage({ source: 'QG_CAVEIRA_EXTENSION', type: 'EXTENSION_DETECTED' }, '*');

  function deliverCourseIndexCache(explicitCache = null) {
    if (isBridgeDestroyed || !isExtensionContextValid()) return;
    if (explicitCache && typeof explicitCache === 'object') {
      window.postMessage({
        source: 'QG_CAVEIRA_EXTENSION',
        type: 'COURSE_INDEX_SYNC',
        payload: explicitCache
      }, '*');
      return;
    }
    try {
      chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
        if (chrome.runtime.lastError || isBridgeDestroyed) return;
        const cache = res?.[COURSE_INDEX_CACHE_KEY];
        if (cache && typeof cache === 'object') {
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'COURSE_INDEX_SYNC',
            payload: cache
          }, '*');
        }
      });
    } catch (_) {}
  }

  deliverCourseIndexCache();

  function isExtensionContextValid() {
    try {
      return !isBridgeDestroyed && Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local);
    } catch (_) {
      return false;
    }
  }

  // Limpa apenas caches de Service Worker legados (pré-v50) que usavam Stale-While-Revalidate no HTML
  if ('caches' in window) {
    caches.keys().then((names) => {
      const staleCaches = names.filter(n => {
        if (!n.startsWith('qg-prf-cache-v')) return false;
        const ver = parseInt(n.replace('qg-prf-cache-v', ''), 10);
        return Number.isFinite(ver) && ver < 50;
      });
      if (staleCaches.length > 0) {
        Promise.all(staleCaches.map(n => caches.delete(n))).then(() => {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update()));
          }
          if (!sessionStorage.getItem('qg_sw_purged_v50')) {
            sessionStorage.setItem('qg_sw_purged_v50', 'true');
            window.location.reload();
          }
        });
      }
    }).catch(() => {});
  }

  function switchUserBucket(nextUserId, callback, nextUserLabel = '') {
    if (!isExtensionContextValid()) return;
    try {
      chrome.storage.local.get([ACTIVE_USER_KEY, ACTIVE_USER_LABEL_KEY, STORAGE_KEY, SESSION_KEY, USER_BUCKETS_KEY, GOAL_KEY], (res) => {
        if (chrome.runtime.lastError || isBridgeDestroyed) return;
        const prevUserId = res?.[ACTIVE_USER_KEY] || null;
        const prevUserLabel = res?.[ACTIVE_USER_LABEL_KEY] || '';
        const prevDailyGoal = Number(res?.[GOAL_KEY]) || 50;
        const currentQuestions = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        const currentSession = normalizeSession(res?.[SESSION_KEY]);
        const buckets = (res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object')
          ? { ...res[USER_BUCKETS_KEY] }
          : {};

        if (!nextUserId) {
          if (prevUserId) {
            buckets[prevUserId] = {
              questions: compactQuestionsForStorage(currentQuestions.map(q => ({ ...q, ownerUserId: q.ownerUserId || prevUserId }))),
              session: currentSession,
              dailyGoal: prevDailyGoal,
              userLabel: prevUserLabel || buckets[prevUserId]?.userLabel || ''
            };
          }
          const emptySession = normalizeSession(null);
          cachedActiveUserId = null;
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: emptySession,
            [ACTIVE_USER_KEY]: null,
            [ACTIVE_USER_LABEL_KEY]: '',
            [GOAL_KEY]: 50,
            [USER_BUCKETS_KEY]: buckets
          }, () => {
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({ type: 'UPDATE_BADGE_ONLY', payload: { session: emptySession } }).catch(() => {});
            }
            if (callback) callback({ userId: null, questions: [], session: emptySession });
          });
          return;
        }

        if (prevUserId === nextUserId) {
          cachedActiveUserId = nextUserId;
          const resolvedLabel = nextUserLabel || prevUserLabel || buckets[nextUserId]?.userLabel || '';
          let changed = resolvedLabel !== prevUserLabel;
          const cleanQuestions = compactQuestionsForStorage(currentQuestions.filter(q => {
            if (!q) return false;
            if (q.ownerUserId && q.ownerUserId !== nextUserId) {
              changed = true;
              return false;
            }
            return true;
          }).map(q => {
            if (!q.ownerUserId) {
              changed = true;
              return { ...q, ownerUserId: nextUserId };
            }
            return q;
          }));
          if (changed) {
            chrome.storage.local.set({
              [STORAGE_KEY]: cleanQuestions,
              ...(resolvedLabel ? { [ACTIVE_USER_LABEL_KEY]: resolvedLabel } : {})
            }, () => {
              if (callback) callback({ userId: nextUserId, questions: cleanQuestions, session: currentSession });
            });
          } else if (callback) {
            callback({ userId: nextUserId, questions: cleanQuestions, session: currentSession });
          }
          return;
        }

        if (prevUserId && prevUserId !== nextUserId) {
          buckets[prevUserId] = {
            questions: compactQuestionsForStorage(currentQuestions.map(q => ({ ...q, ownerUserId: q.ownerUserId || prevUserId }))),
            session: currentSession,
            dailyGoal: prevDailyGoal,
            userLabel: prevUserLabel || buckets[prevUserId]?.userLabel || ''
          };
          const targetBucket = buckets[nextUserId] || {};
          const nextQuestions = compactQuestionsForStorage(
            (Array.isArray(targetBucket.questions) ? targetBucket.questions : [])
              .map(q => ({ ...q, ownerUserId: nextUserId }))
          );
          const nextSession = normalizeSession(targetBucket.session);
          const nextGoal = Number(targetBucket.dailyGoal) || 50;
          const nextLabel = nextUserLabel || targetBucket.userLabel || '';
          cachedActiveUserId = nextUserId;
          chrome.storage.local.set({
            [STORAGE_KEY]: nextQuestions,
            [SESSION_KEY]: nextSession,
            [ACTIVE_USER_KEY]: nextUserId,
            [ACTIVE_USER_LABEL_KEY]: nextLabel,
            [GOAL_KEY]: nextGoal,
            [USER_BUCKETS_KEY]: buckets
          }, () => {
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({ type: 'UPDATE_BADGE_ONLY', payload: { session: nextSession } }).catch(() => {});
            }
            if (callback) callback({ userId: nextUserId, questions: nextQuestions, session: nextSession });
          });
          return;
        }

        // !prevUserId: primeiro vínculo após sessão deslogada ou instalação nova
        const foreignQuestions = currentQuestions.filter(q => q && q.ownerUserId && q.ownerUserId !== nextUserId);
        foreignQuestions.forEach(q => {
          const owner = q.ownerUserId;
          const prevOwnerBucket = buckets[owner] || { questions: [], session: normalizeSession(null) };
          const ownerMap = new Map();
          (prevOwnerBucket.questions || []).forEach(item => { if (item?.id) ownerMap.set(item.id, item); });
          if (q.id) ownerMap.set(q.id, q);
          buckets[owner] = { ...prevOwnerBucket, questions: compactQuestionsForStorage(Array.from(ownerMap.values())) };
        });

        const ownOrOrphan = currentQuestions
          .filter(q => q && (!q.ownerUserId || q.ownerUserId === nextUserId))
          .map(q => ({ ...q, ownerUserId: nextUserId }));

        const existingBucket = buckets[nextUserId] || {};
        const mergedMap = new Map();
        (Array.isArray(existingBucket.questions) ? existingBucket.questions : []).forEach(q => {
          if (q?.id) mergedMap.set(q.id, { ...q, ownerUserId: nextUserId });
        });
        ownOrOrphan.forEach(q => {
          if (q?.id) mergedMap.set(q.id, { ...(mergedMap.get(q.id) || {}), ...q, ownerUserId: nextUserId });
        });

        const finalQuestions = compactQuestionsForStorage(Array.from(mergedMap.values()));
        const finalSession = existingBucket.session
          ? normalizeSession(existingBucket.session)
          : (foreignQuestions.length === 0 ? currentSession : normalizeSession(null));
        const finalGoal = Number(existingBucket.dailyGoal) || prevDailyGoal || 50;
        const finalLabel = nextUserLabel || existingBucket.userLabel || '';

        cachedActiveUserId = nextUserId;
        chrome.storage.local.set({
          [STORAGE_KEY]: finalQuestions,
          [SESSION_KEY]: finalSession,
          [ACTIVE_USER_KEY]: nextUserId,
          [ACTIVE_USER_LABEL_KEY]: finalLabel,
          [GOAL_KEY]: finalGoal,
          [USER_BUCKETS_KEY]: buckets
        }, () => {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'UPDATE_BADGE_ONLY', payload: { session: finalSession } }).catch(() => {});
          }
          if (callback) callback({ userId: nextUserId, questions: finalQuestions, session: finalSession });
        });
      });
    } catch (_) {}
  }

  function deliverDataForActiveUser(activeUserId) {
    if (!isExtensionContextValid() || !activeUserId) return;
    const postFilteredResponse = (rawQuestions, rawSession) => {
      if (isBridgeDestroyed) return;
      const scoped = (Array.isArray(rawQuestions) ? rawQuestions : []).filter(
        q => q && (!q.ownerUserId || q.ownerUserId === activeUserId)
      );
      window.postMessage({
        source: 'QG_CAVEIRA_EXTENSION',
        type: 'CAVEIRA_DATA_RESPONSE',
        payload: {
          userId: activeUserId,
          questions: scoped,
          session: normalizeSession(rawSession)
        }
      }, '*');
    };

    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (response) => {
          if (!chrome.runtime.lastError && response && Array.isArray(response.questions)) {
            postFilteredResponse(response.questions, response.session);
          } else {
            chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
              if (chrome.runtime.lastError) return;
              postFilteredResponse(res?.[STORAGE_KEY], res?.[SESSION_KEY]);
            });
          }
        });
      } else {
        chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
          if (chrome.runtime.lastError) return;
          postFilteredResponse(res?.[STORAGE_KEY], res?.[SESSION_KEY]);
        });
      }
    } catch (_) {}
  }

  function sendStoredData(requestedUserId = null) {
    if (!isExtensionContextValid()) return;
    deliverCourseIndexCache();
    if (requestedUserId) {
      switchUserBucket(requestedUserId, ({ userId }) => {
        if (userId) deliverDataForActiveUser(userId);
      });
      return;
    }

    if (cachedActiveUserId) {
      deliverDataForActiveUser(cachedActiveUserId);
      return;
    }

    try {
      chrome.storage.local.get([ACTIVE_USER_KEY], (res) => {
        if (chrome.runtime.lastError || isBridgeDestroyed) return;
        const storedUserId = res?.[ACTIVE_USER_KEY] || null;
        if (storedUserId) {
          cachedActiveUserId = storedUserId;
          deliverDataForActiveUser(storedUserId);
        }
      });
    } catch (_) {}
  }

  function handleFocus() {
    if (isBridgeDestroyed) return;
    sendStoredData();
  }

  function handleVisibilityChange() {
    if (isBridgeDestroyed) return;
    if (document.visibilityState === 'visible') {
      sendStoredData();
    }
  }

  function handleWindowMessage(event) {
    if (isBridgeDestroyed || !isExtensionContextValid()) return;
    if (event.data && event.data.source === 'QG_WEB_APP') {
      if (event.data.type === 'SET_ACTIVE_USER') {
        const nextUserId = event.data.payload?.userId || null;
        const nextUserLabel = event.data.payload?.userLabel || event.data.payload?.userEmail || '';
        switchUserBucket(nextUserId, ({ userId }) => {
          if (userId) deliverDataForActiveUser(userId);
        }, nextUserLabel);
      }

      if (event.data.type === 'USER_SIGNED_OUT') {
        switchUserBucket(null);
      }

      if (event.data.type === 'FETCH_CAVEIRA_DATA') {
        sendStoredData(event.data.payload?.userId || null);
      }

      if (event.data.type === 'OPEN_CAVEIRA_PRACTICE') {
        const subject = event.data.payload?.subject || '';
        const topic = event.data.payload?.topic || '';
        const lessons = Array.isArray(event.data.payload?.lessons) ? event.data.payload.lessons : [];
        const fallbackTopic = event.data.payload?.fallbackTopic || '';
        const subtopics = Array.isArray(event.data.payload?.subtopics) ? event.data.payload.subtopics : [];
        const rawIndexText = String(event.data.payload?.rawIndexText || '');
        const examBoards = Array.isArray(event.data.payload?.examBoards) ? event.data.payload.examBoards.map(String) : undefined;
        const numberAlternatives = Array.isArray(event.data.payload?.numberAlternatives) ? event.data.payload.numberAlternatives.map(Number).filter(Number.isFinite) : undefined;
        const filterData = { subject, topic, lessons, fallbackTopic, subtopics, rawIndexText, examBoards, numberAlternatives, createdAt: Date.now() };
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
      }

      if (event.data.type === 'UPDATE_CAVEIRA_QUESTION' && event.data.payload?.id && event.data.payload?.updates) {
        const { id, updates } = event.data.payload;
        try {
          chrome.storage.local.get([STORAGE_KEY], (res) => {
            if (chrome.runtime.lastError || isBridgeDestroyed) return;
            const list = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
            const updatedList = list.map(q => (q && q.id === id) ? { ...q, ...updates } : q);
            chrome.storage.local.set({ [STORAGE_KEY]: updatedList });
          });
        } catch (_) {}
      }

      if (event.data.type === 'DELETE_CAVEIRA_QUESTION' && event.data.payload?.id) {
        const targetId = event.data.payload.id;
        try {
          chrome.storage.local.get([STORAGE_KEY], (res) => {
            if (chrome.runtime.lastError || isBridgeDestroyed) return;
            const list = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
            const filtered = list.filter(q => q && q.id !== targetId);
            chrome.storage.local.set({ [STORAGE_KEY]: filtered });
          });
        } catch (_) {}
      }

      if (event.data.type === 'REPLACE_CAVEIRA_QUESTIONS' && Array.isArray(event.data.payload?.questions)) {
        const newQuestions = compactQuestionsForStorage(event.data.payload.questions);
        const today = getTodaySessionDate();
        const hits = newQuestions.filter(q => q && q.hit).length;
        const errors = newQuestions.length - hits;
        try {
          chrome.storage.local.set({
            [STORAGE_KEY]: newQuestions,
            [SESSION_KEY]: { date: today, total: newQuestions.length, hits, errors }
          });
        } catch (_) {}
      }

      if (event.data.type === 'CLEAR_SESSION') {
        const today = getTodaySessionDate();
        try {
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: { date: today, hits: 0, errors: 0, total: 0 }
          }, () => {
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'SESSION_CLEARED'
            }, '*');
          });
        } catch (_) {}
      }
    }
  }

  // Sincroniza sempre que o usuário focar/voltar para a aba do QG da PRF
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('message', handleWindowMessage);

  function teardownBridge() {
    isBridgeDestroyed = true;
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('message', handleWindowMessage);
  }

  window.addEventListener('qg-bridge-teardown', teardownBridge, { once: true });

  if (isExtensionContextValid() && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (isBridgeDestroyed || !isExtensionContextValid()) return;
        if (area === 'local') {
          if (changes[ACTIVE_USER_KEY]) {
            cachedActiveUserId = changes[ACTIVE_USER_KEY].newValue || null;
          }
          if (changes[STORAGE_KEY] && cachedActiveUserId) {
            const newQuestions = changes[STORAGE_KEY].newValue || [];
            postSyncUpdate(newQuestions, cachedActiveUserId);
          }
          if (changes[COURSE_INDEX_CACHE_KEY]) {
            deliverCourseIndexCache(changes[COURSE_INDEX_CACHE_KEY].newValue || { latest: null, byLesson: {} });
          }
        }
      });
    } catch (_) {}
  }

  if (isExtensionContextValid() && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (isBridgeDestroyed || !isExtensionContextValid()) return;
        if (msg && msg.type === 'PUSH_CAVEIRA_SYNC' && msg.payload && cachedActiveUserId) {
          postSyncUpdate(msg.payload.questions || [], cachedActiveUserId);
        }
      });
    } catch (_) {}
  }
})();
