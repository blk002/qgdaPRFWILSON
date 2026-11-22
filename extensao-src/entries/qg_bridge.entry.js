import {
  buildSimuladoKey,
  pruneAndNormalizeQueue,
  enqueueSimuladosIntoQueue,
} from '../content/simuladosHelper.js';
import {
  PENDING_SIMULADOS_QUEUE_KEY,
  SIMULADO_QUEUE_MAX_ATTEMPTS,
} from '../content/utils.js';

// Bridge entre a Extensão e a aplicação Web QG da PRF (v3.1.0 Strict)

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
  const FILTER_ID_MEMORY_KEY = 'qg_caveira_filter_id_memory_v1';
  const FILTER_MEMORY_CLOUD_KEY = 'qg_filter_memory_cloud';
  const TODAY_MISSION_KEY = 'qg_today_mission';
  const SUBJECT_SPEEDS_KEY = 'qg_subject_speeds';
  const PENDING_CATALOG_KEY = 'qg_pending_course_catalog';
  const PENDING_SIMULADOS_KEY = 'qg_pending_simulados_import';
  const PENDING_PDF_KEY = 'qg_pending_pdf_study';
  const REMINDER_STATE_KEY = 'qg_reminder_state';
  const MAX_BUCKET_QUESTIONS = 1500;
  const ALLOWED_WEB_HOSTS = new Set(['blk002.github.io', 'localhost', '127.0.0.1']);
  const SIM_ACK_TIMEOUT_MS = 5000;
  const SIM_BACKOFF_DELAYS_MS = [5000, 15000, 45000];
  let suppressFilterEchoUntil = 0;
  let isBridgeDestroyed = false;
  let cachedActiveUserId = null;
  let lastSyncPayloadJson = '';
  let lastSyncPayloadTime = 0;
  let pendingSimAckTimer = null;
  let pendingSimBackoffTimer = null;
  let activeSimDelivery = null;
  let autoBackoffIndex = 0;

  function getTargetOrigin() {
    try {
      return window.location.origin;
    } catch (_) {
      return 'https://blk002.github.io';
    }
  }

  function isValidWindowEvent(event) {
    try {
      return Boolean(
        event &&
        event.source === window &&
        event.origin === window.location.origin &&
        ALLOWED_WEB_HOSTS.has(window.location.hostname)
      );
    } catch (_) {
      return false;
    }
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

  function postSyncUpdate(questions, userId, extra = {}) {
    if (isBridgeDestroyed || !Array.isArray(questions) || !userId) return;
    const scopedQuestions = questions.filter(q => q && (!q.ownerUserId || q.ownerUserId === userId));
    const now = Date.now();
    let payloadJson = '';
    try {
      payloadJson = JSON.stringify({ userId, scopedQuestions, extra });
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
      payload: {
        questions: scopedQuestions,
        userId,
        ...(extra.session ? { session: normalizeSession(extra.session) } : {}),
        ...(extra.dailyGoal ? { dailyGoal: Number(extra.dailyGoal) || 50 } : {})
      }
    }, getTargetOrigin());
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
  window.postMessage({ source: 'QG_CAVEIRA_EXTENSION', type: 'EXTENSION_DETECTED' }, getTargetOrigin());

  function deliverCourseIndexCache(explicitCache = null) {
    if (isBridgeDestroyed || !isExtensionContextValid()) return;
    if (explicitCache && typeof explicitCache === 'object') {
      window.postMessage({
        source: 'QG_CAVEIRA_EXTENSION',
        type: 'COURSE_INDEX_SYNC',
        payload: explicitCache
      }, getTargetOrigin());
      return;
    }
    try {
      chrome.storage.local.get([COURSE_INDEX_CACHE_KEY, 'qg_pending_course_completion'], (res) => {
        if (chrome.runtime.lastError || isBridgeDestroyed) return;
        const cache = res?.[COURSE_INDEX_CACHE_KEY];
        if (cache && typeof cache === 'object') {
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'COURSE_INDEX_SYNC',
            payload: cache
          }, getTargetOrigin());
        }
        const pendingCourse = res?.qg_pending_course_completion;
        if (pendingCourse && pendingCourse.requestedAt && (Date.now() - pendingCourse.requestedAt) < 120000) {
          chrome.storage.local.remove(['qg_pending_course_completion']);
          setTimeout(() => {
            if (!isBridgeDestroyed) {
              window.postMessage({
                source: 'QG_CAVEIRA_EXTENSION',
                type: 'COURSE_LESSON_COMPLETE_REQUEST',
                payload: pendingCourse
              }, getTargetOrigin());
            }
          }, 900);
        }
      });
    } catch (_) {}
  }

  deliverCourseIndexCache();

  function clearSimTimers() {
    if (pendingSimAckTimer) {
      clearTimeout(pendingSimAckTimer);
      pendingSimAckTimer = null;
    }
    if (pendingSimBackoffTimer) {
      clearTimeout(pendingSimBackoffTimer);
      pendingSimBackoffTimer = null;
    }
  }

  function acknowledgeSimuladosDelivery(payload = {}) {
    clearSimTimers();
    autoBackoffIndex = 0;
    const rawIds = Array.isArray(payload.ids) ? payload.ids.map(String).filter(Boolean) : [];
    const ackedSet = new Set(rawIds);
    if (ackedSet.size === 0 && activeSimDelivery && (!payload.deliveryId || payload.deliveryId === activeSimDelivery.deliveryId)) {
      activeSimDelivery.keys.forEach((k) => ackedSet.add(String(k)));
    }
    activeSimDelivery = null;

    if (!isExtensionContextValid()) return;
    try {
      chrome.storage.local.get([PENDING_SIMULADOS_QUEUE_KEY, PENDING_SIMULADOS_KEY], (res) => {
        if (chrome.runtime.lastError || isBridgeDestroyed) return;
        let queue = pruneAndNormalizeQueue(res?.[PENDING_SIMULADOS_QUEUE_KEY]);
        const beforeCount = queue.items.length;
        const remaining = ackedSet.size > 0
          ? queue.items.filter((it) => !ackedSet.has(String(it.caveiraId)) && !ackedSet.has(String(buildSimuladoKey(it.simulado))))
          : [];
        const confirmedCount = Math.max(0, beforeCount - remaining.length) || ackedSet.size;
        const nextQueue = {
          ...queue,
          items: remaining,
          lastStatus: 'confirmed',
          lastConfirmedAt: Date.now(),
          lastConfirmedCount: confirmedCount,
          lastConfirmedIds: Array.from(ackedSet),
          lastError: null,
          updatedAt: Date.now(),
        };
        chrome.storage.local.set({ [PENDING_SIMULADOS_QUEUE_KEY]: nextQueue }, () => {
          chrome.storage.local.remove([PENDING_SIMULADOS_KEY]);
        });
      });
    } catch (_) {}
  }

  function deliverPendingQgEvents(activeUserId, { forceRetry = false } = {}) {
    if (isBridgeDestroyed || !isExtensionContextValid() || !activeUserId) return;
    try {
      chrome.storage.local.get(
        [PENDING_CATALOG_KEY, PENDING_SIMULADOS_KEY, PENDING_SIMULADOS_QUEUE_KEY, PENDING_PDF_KEY, FILTER_ID_MEMORY_KEY],
        (res) => {
          if (chrome.runtime.lastError || isBridgeDestroyed) return;
          const keysToRemove = [];
          const catalog = res?.[PENDING_CATALOG_KEY];
          if (catalog && typeof catalog === 'object' && Array.isArray(catalog.modules)) {
            keysToRemove.push(PENDING_CATALOG_KEY);
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'COURSE_CATALOG_SYNC',
              payload: { ...catalog, userId: activeUserId }
            }, getTargetOrigin());
          }

          // Fila confiável com ACK, TTL 7d e dedupe por caveiraId
          let simQueue = pruneAndNormalizeQueue(res?.[PENDING_SIMULADOS_QUEUE_KEY]);
          const legacyImport = res?.[PENDING_SIMULADOS_KEY];
          if (legacyImport && Array.isArray(legacyImport.simulados) && legacyImport.simulados.length > 0) {
            simQueue = enqueueSimuladosIntoQueue(simQueue, legacyImport.simulados);
            keysToRemove.push(PENDING_SIMULADOS_KEY);
          }

          if (forceRetry) {
            autoBackoffIndex = 0;
            simQueue = {
              ...simQueue,
              items: simQueue.items.map((it) => ({ ...it, attempts: 0, status: 'saved' })),
            };
          }

          const eligibleItems = simQueue.items.filter((it) => Number(it.attempts || 0) < SIMULADO_QUEUE_MAX_ATTEMPTS);
          if (eligibleItems.length > 0 && (!activeSimDelivery || forceRetry)) {
            const deliveryId = `dlv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const deliveryKeys = eligibleItems.map((it) => it.caveiraId);
            const updatedQueue = {
              ...simQueue,
              lastStatus: 'sending',
              lastDeliveryId: deliveryId,
              updatedAt: Date.now(),
            };
            chrome.storage.local.set({ [PENDING_SIMULADOS_QUEUE_KEY]: updatedQueue });
            activeSimDelivery = { deliveryId, keys: deliveryKeys, sentAt: Date.now() };

            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'SIMULADOS_IMPORT',
              payload: {
                simulados: eligibleItems.map((it) => it.simulado),
                userId: activeUserId,
                deliveryId,
              }
            }, getTargetOrigin());

            if (pendingSimAckTimer) clearTimeout(pendingSimAckTimer);
            pendingSimAckTimer = setTimeout(() => {
              pendingSimAckTimer = null;
              if (isBridgeDestroyed || !activeSimDelivery || activeSimDelivery.deliveryId !== deliveryId) return;
              activeSimDelivery = null;
              chrome.storage.local.get([PENDING_SIMULADOS_QUEUE_KEY], (qRes) => {
                if (chrome.runtime.lastError || isBridgeDestroyed) return;
                const cur = pruneAndNormalizeQueue(qRes?.[PENDING_SIMULADOS_QUEUE_KEY]);
                const nowMs = Date.now();
                const sentKeySet = new Set(deliveryKeys);
                const nextItems = cur.items.map((it) => {
                  if (!sentKeySet.has(it.caveiraId)) return it;
                  const nextAttempts = Number(it.attempts || 0) + 1;
                  return {
                    ...it,
                    attempts: nextAttempts,
                    lastAttemptAt: nowMs,
                    status: nextAttempts >= SIMULADO_QUEUE_MAX_ATTEMPTS ? 'failed' : 'waiting_qg',
                  };
                });
                const hasMoreEligible = nextItems.some((it) => Number(it.attempts || 0) < SIMULADO_QUEUE_MAX_ATTEMPTS);
                chrome.storage.local.set({
                  [PENDING_SIMULADOS_QUEUE_KEY]: {
                    ...cur,
                    items: nextItems,
                    lastStatus: hasMoreEligible ? 'waiting_qg' : 'failed',
                    lastError: 'Sem ACK do site QG no tempo limite',
                    updatedAt: nowMs,
                  }
                });
                if (hasMoreEligible && autoBackoffIndex < SIM_BACKOFF_DELAYS_MS.length) {
                  const delayMs = SIM_BACKOFF_DELAYS_MS[autoBackoffIndex++];
                  pendingSimBackoffTimer = setTimeout(() => {
                    pendingSimBackoffTimer = null;
                    if (!isBridgeDestroyed && cachedActiveUserId) {
                      deliverPendingQgEvents(cachedActiveUserId);
                    }
                  }, delayMs);
                }
              });
            }, SIM_ACK_TIMEOUT_MS);
          }

          const pendingPdf = res?.[PENDING_PDF_KEY];
          if (Array.isArray(pendingPdf) && pendingPdf.length > 0) {
            keysToRemove.push(PENDING_PDF_KEY);
            pendingPdf.forEach((pdfEntry) => {
              if (pdfEntry) {
                window.postMessage({
                  source: 'QG_CAVEIRA_EXTENSION',
                  type: 'PDF_STUDY_LOG',
                  payload: { ...pdfEntry, userId: activeUserId }
                }, getTargetOrigin());
              }
            });
          } else if (pendingPdf && typeof pendingPdf === 'object' && pendingPdf.minutes) {
            keysToRemove.push(PENDING_PDF_KEY);
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'PDF_STUDY_LOG',
              payload: { ...pendingPdf, userId: activeUserId }
            }, getTargetOrigin());
          }

          if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove);
          }

          const filterMem = res?.[FILTER_ID_MEMORY_KEY];
          if (filterMem && typeof filterMem === 'object' && Object.keys(filterMem).length > 0) {
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'FILTER_MEMORY_SYNC',
              payload: { memory: filterMem, userId: activeUserId }
            }, getTargetOrigin());
          }
        }
      );
    } catch (_) {}
  }

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
            if (cleanQuestions.length > 0 && chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'DB_BULK_UPSERT_QUESTIONS',
                payload: { questions: cleanQuestions, enqueueOutbox: false }
              }).catch(() => {});
            }
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
          if (finalQuestions.length > 0 && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'DB_BULK_UPSERT_QUESTIONS',
              payload: { questions: finalQuestions, enqueueOutbox: false }
            }).catch(() => {});
          }
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
    const postFilteredResponse = (rawQuestions, rawSession, rawGoal) => {
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
          session: normalizeSession(rawSession),
          dailyGoal: Number(rawGoal) || 50
        }
      }, getTargetOrigin());
    };

    try {
      deliverPendingQgEvents(activeUserId);
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (response) => {
          if (!chrome.runtime.lastError && response && Array.isArray(response.questions)) {
            postFilteredResponse(response.questions, response.session, response.dailyGoal);
          } else {
            chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (res) => {
              if (chrome.runtime.lastError) return;
              postFilteredResponse(res?.[STORAGE_KEY], res?.[SESSION_KEY], res?.[GOAL_KEY]);
            });
          }
        });
      } else {
        chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (res) => {
          if (chrome.runtime.lastError) return;
          postFilteredResponse(res?.[STORAGE_KEY], res?.[SESSION_KEY], res?.[GOAL_KEY]);
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
    if (!isValidWindowEvent(event)) return;
    if (event.data && event.data.source === 'QG_WEB_APP') {
      if (event.data.type === 'SIMULADOS_IMPORT_ACK' && event.data.payload) {
        acknowledgeSimuladosDelivery(event.data.payload);
        return;
      }

      if (event.data.type === 'SET_ACTIVE_USER') {
        const nextUserId = event.data.payload?.userId || null;
        const nextUserLabel = event.data.payload?.userLabel || event.data.payload?.userEmail || '';
        switchUserBucket(nextUserId, ({ userId }) => {
          if (userId) deliverDataForActiveUser(userId);
        }, nextUserLabel);
      }

      if (event.data.type === 'USER_SIGNED_OUT') {
        switchUserBucket(null);
        try { chrome.storage.local.remove([REMINDER_STATE_KEY]); } catch (_) {}
        try { chrome.runtime?.sendMessage?.({ type: 'CLEAR_CLOUD_AUTH' }).catch(() => {}); } catch (_) {}
      }

      if (event.data.type === 'QG_PRF_SYNC_CLOUD_CREDS' && event.data.payload?.userId) {
        try {
          chrome.runtime?.sendMessage?.({
            type: 'SET_CLOUD_AUTH',
            payload: { ...event.data.payload, updatedAt: Date.now() },
          }).catch(() => {});
        } catch (_) {}
      }

      if (event.data.type === 'QG_PRF_SYNC_REMINDER_STATE' && event.data.payload) {
        try {
          chrome.storage.local.set({ [REMINDER_STATE_KEY]: { ...event.data.payload, updatedAt: Date.now() } });
        } catch (_) {}
      }

      if (event.data.type === 'FETCH_CAVEIRA_DATA') {
        sendStoredData(event.data.payload?.userId || null);
      }

      if (event.data.type === 'QG_PRF_SYNC_TODAY_MISSION' && event.data.payload) {
        try {
          chrome.storage.local.set({ [TODAY_MISSION_KEY]: event.data.payload });
        } catch (_) {}
      }

      if (event.data.type === 'QG_PRF_SYNC_SUBJECT_SPEEDS' && event.data.payload?.speeds) {
        try {
          chrome.storage.local.set({ [SUBJECT_SPEEDS_KEY]: event.data.payload.speeds });
        } catch (_) {}
      }

      if (event.data.type === 'QG_PRF_SYNC_FILTER_MEMORY' && event.data.payload?.memory) {
        try {
          const cloudMem = event.data.payload.memory;
          chrome.storage.local.get([FILTER_ID_MEMORY_KEY], (res) => {
            if (chrome.runtime.lastError || isBridgeDestroyed) return;
            const localMem = (res?.[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === 'object')
              ? { ...res[FILTER_ID_MEMORY_KEY] }
              : {};
            let changed = false;
            Object.entries(cloudMem).forEach(([k, v]) => {
              if (!v || typeof v !== 'object') return;
              const prev = localMem[k];
              if (!prev || (Number(v.updatedAt) || 0) > (Number(prev.updatedAt) || 0)) {
                localMem[k] = v;
                changed = true;
              }
            });
            suppressFilterEchoUntil = Date.now() + 1500;
            const payload = { [FILTER_MEMORY_CLOUD_KEY]: cloudMem };
            if (changed) payload[FILTER_ID_MEMORY_KEY] = localMem;
            chrome.storage.local.set(payload);
          });
        } catch (_) {}
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
          chrome.storage.local.get([STORAGE_KEY, ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
            if (chrome.runtime.lastError || isBridgeDestroyed) return;
            const list = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
            const updatedList = list.map(q => (q && q.id === id) ? { ...q, ...updates } : q);
            const activeUserId = res?.[ACTIVE_USER_KEY] || cachedActiveUserId;
            if (chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'DB_UPSERT_QUESTION',
                payload: {
                  question: {
                    id,
                    ...updates,
                    ...(activeUserId ? { ownerUserId: activeUserId } : {})
                  },
                  enqueueOutbox: false
                }
              }).catch(() => {});
            }
            const payload = { [STORAGE_KEY]: updatedList };
            if (activeUserId && res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object') {
              const buckets = { ...res[USER_BUCKETS_KEY] };
              const prevB = buckets[activeUserId] || {};
              const bList = Array.isArray(prevB.questions) ? prevB.questions : updatedList;
              buckets[activeUserId] = {
                ...prevB,
                questions: compactQuestionsForStorage(bList.map(q => (q && q.id === id) ? { ...q, ...updates } : q))
              };
              payload[USER_BUCKETS_KEY] = buckets;
            }
            chrome.storage.local.set(payload);
          });
        } catch (_) {}
      }

      if (event.data.type === 'DELETE_CAVEIRA_QUESTION' && event.data.payload?.id) {
        const targetId = event.data.payload.id;
        try {
          chrome.storage.local.get([STORAGE_KEY, ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
            if (chrome.runtime.lastError || isBridgeDestroyed) return;
            const list = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
            const filtered = list.filter(q => q && q.id !== targetId);
            const activeUserId = res?.[ACTIVE_USER_KEY] || cachedActiveUserId;
            if (chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'DB_DELETE_QUESTION',
                payload: { id: targetId, userId: activeUserId || null, enqueueOutbox: false }
              }).catch(() => {});
            }
            const payload = { [STORAGE_KEY]: filtered };
            if (activeUserId && res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object') {
              const buckets = { ...res[USER_BUCKETS_KEY] };
              const prevB = buckets[activeUserId] || {};
              const bList = Array.isArray(prevB.questions) ? prevB.questions : filtered;
              buckets[activeUserId] = {
                ...prevB,
                questions: compactQuestionsForStorage(bList.filter(q => q && q.id !== targetId))
              };
              payload[USER_BUCKETS_KEY] = buckets;
            }
            chrome.storage.local.set(payload);
          });
        } catch (_) {}
      }

      if (event.data.type === 'REPLACE_CAVEIRA_QUESTIONS' && Array.isArray(event.data.payload?.questions)) {
        const rawQuestions = event.data.payload.questions;
        const newQuestions = compactQuestionsForStorage(rawQuestions);
        const today = getTodaySessionDate();
        const hits = rawQuestions.filter(q => q && q.hit).length;
        const errors = rawQuestions.length - hits;
        const nextSession = { date: today, total: rawQuestions.length, hits, errors };
        try {
          chrome.storage.local.get([ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
            const activeUserId = res?.[ACTIVE_USER_KEY] || cachedActiveUserId;
            if (chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'DB_BULK_UPSERT_QUESTIONS',
                payload: {
                  questions: rawQuestions.map(q => (q && !q.ownerUserId && activeUserId ? { ...q, ownerUserId: activeUserId } : q)),
                  enqueueOutbox: false
                }
              }).catch(() => {});
            }
            const payload = {
              [STORAGE_KEY]: newQuestions,
              [SESSION_KEY]: nextSession
            };
            if (activeUserId && res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object') {
              const buckets = { ...res[USER_BUCKETS_KEY] };
              buckets[activeUserId] = {
                ...(buckets[activeUserId] || {}),
                questions: newQuestions,
                session: nextSession
              };
              payload[USER_BUCKETS_KEY] = buckets;
            }
            chrome.storage.local.set(payload);
          });
        } catch (_) {}
      }

      if (event.data.type === 'SET_CAVEIRA_DAILY_GOAL' && event.data.payload?.dailyGoal) {
        const newGoal = Math.max(5, Math.min(1000, Number(event.data.payload.dailyGoal) || 50));
        try {
          chrome.storage.local.get([ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
            const activeUserId = res?.[ACTIVE_USER_KEY] || cachedActiveUserId;
            const payload = { [GOAL_KEY]: newGoal };
            if (activeUserId && res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object') {
              const buckets = { ...res[USER_BUCKETS_KEY] };
              buckets[activeUserId] = { ...(buckets[activeUserId] || {}), dailyGoal: newGoal };
              payload[USER_BUCKETS_KEY] = buckets;
            }
            chrome.storage.local.set(payload);
          });
        } catch (_) {}
      }

      if (event.data.type === 'CLEAR_SESSION') {
        const today = getTodaySessionDate();
        const cleanSession = { date: today, hits: 0, errors: 0, total: 0 };
        try {
          chrome.storage.local.get([ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
            const activeUserId = res?.[ACTIVE_USER_KEY] || cachedActiveUserId;
            const payload = {
              [STORAGE_KEY]: [],
              [SESSION_KEY]: cleanSession
            };
            if (activeUserId && res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object') {
              const buckets = { ...res[USER_BUCKETS_KEY] };
              buckets[activeUserId] = {
                ...(buckets[activeUserId] || {}),
                questions: [],
                session: cleanSession
              };
              payload[USER_BUCKETS_KEY] = buckets;
            }
            chrome.storage.local.set(payload, () => {
              window.postMessage({
                source: 'QG_CAVEIRA_EXTENSION',
                type: 'SESSION_CLEARED'
              }, getTargetOrigin());
            });
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
    clearSimTimers();
    activeSimDelivery = null;
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
            if (chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'DB_GET_ALL_QUESTIONS',
                payload: { userId: cachedActiveUserId }
              }, (resp) => {
                if (!chrome.runtime.lastError && resp?.ok && Array.isArray(resp.questions) && resp.questions.length > 0) {
                  postSyncUpdate(resp.questions, cachedActiveUserId);
                } else {
                  postSyncUpdate(newQuestions, cachedActiveUserId);
                }
              });
            } else {
              postSyncUpdate(newQuestions, cachedActiveUserId);
            }
          }
          if ((changes[SESSION_KEY] || changes[GOAL_KEY]) && cachedActiveUserId) {
            chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (res) => {
              if (chrome.runtime.lastError || isBridgeDestroyed) return;
              const fallback = res?.[STORAGE_KEY] || [];
              const extra = { session: res?.[SESSION_KEY], dailyGoal: res?.[GOAL_KEY] };
              if (chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({
                  type: 'DB_GET_ALL_QUESTIONS',
                  payload: { userId: cachedActiveUserId }
                }, (resp) => {
                  const list = (!chrome.runtime.lastError && resp?.ok && Array.isArray(resp.questions) && resp.questions.length > 0)
                    ? resp.questions
                    : fallback;
                  postSyncUpdate(list, cachedActiveUserId, extra);
                });
              } else {
                postSyncUpdate(fallback, cachedActiveUserId, extra);
              }
            });
          }
          if (changes[COURSE_INDEX_CACHE_KEY]) {
            deliverCourseIndexCache(changes[COURSE_INDEX_CACHE_KEY].newValue || { latest: null, byLesson: {} });
          }
          if (changes[FILTER_ID_MEMORY_KEY] && cachedActiveUserId && Date.now() > suppressFilterEchoUntil) {
            const mem = changes[FILTER_ID_MEMORY_KEY].newValue;
            if (mem && typeof mem === 'object') {
              window.postMessage({
                source: 'QG_CAVEIRA_EXTENSION',
                type: 'FILTER_MEMORY_SYNC',
                payload: { memory: mem, userId: cachedActiveUserId }
              }, getTargetOrigin());
            }
          }
        }
      });
    } catch (_) {}
  }

  if (isExtensionContextValid() && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (isBridgeDestroyed || !isExtensionContextValid()) return;
        if (msg && msg.type === 'FLUSH_PENDING_QG_EVENTS') {
          const forceRetry = Boolean(msg.forceRetry);
          if (cachedActiveUserId) {
            deliverPendingQgEvents(cachedActiveUserId, { forceRetry });
          } else {
            chrome.storage.local.get([ACTIVE_USER_KEY], (res) => {
              if (chrome.runtime.lastError || isBridgeDestroyed) return;
              const storedUid = res?.[ACTIVE_USER_KEY] || null;
              if (storedUid) {
                cachedActiveUserId = storedUid;
                deliverPendingQgEvents(storedUid, { forceRetry });
              }
            });
          }
        }
        if (msg && msg.type === 'PUSH_CAVEIRA_SYNC' && msg.payload && cachedActiveUserId) {
          postSyncUpdate(msg.payload.questions || [], cachedActiveUserId, {
            session: msg.payload.session,
            dailyGoal: msg.payload.dailyGoal
          });
        }
        if (msg && msg.type === 'PUSH_COURSE_LESSON_COMPLETE' && msg.payload) {
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'COURSE_LESSON_COMPLETE_REQUEST',
            payload: msg.payload
          }, getTargetOrigin());
        }
      });
    } catch (_) {}
  }
})();
