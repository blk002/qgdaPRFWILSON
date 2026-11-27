import {
  upsertQuestionFull,
  bulkUpsertQuestionsFull,
  deleteQuestionFull,
  clearUserQuestions,
  replaceUserQuestions,
  getAllQuestionsFull,
  searchQuestionsOffline,
  mergeDynamicTreeNodes,
  getAllDynamicTreeNodes,
  getDbStats,
  migrateLegacyChromeStorageToDexie,
} from '../db/extensionDb.js';
import {
  flushOutboxToSupabase,
  pullDeltaFromSupabase,
} from '../sync/realtimeSync.js';

// Background Service Worker — QG da PRF Rastreador Caveira v3.0.0
const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';
const ACTIVE_USER_KEY = 'qg_active_user_id';
const USER_BUCKETS_KEY = 'qg_caveira_user_buckets';
const GOAL_KEY = 'qg_caveira_daily_goal';
const CLOUD_AUTH_KEY = 'qg_cloud_auth';
const CLOUD_AUTH_META_KEY = 'qg_cloud_auth_meta';
const FILTER_ID_MEMORY_KEY = 'qg_caveira_filter_id_memory_v1';
const FILTER_CORRECTION_MEMORY_KEY = 'qg_caveira_filter_memory';
const REMINDER_STATE_KEY = 'qg_reminder_state';
const NOTIF_ENABLED_KEY = 'qg_notifications_enabled';
const LAST_NOTIF_META_KEY = 'qg_last_notification_meta';
const PENDING_FILTER_KEY = 'qg_pending_caveira_filter';
const PERIODIC_ALARM_NAME = 'qg_periodic_check';
const OUTBOX_FLUSH_ALARM_NAME = 'qg_outbox_flush';
const EXCLUDED_CAVEIRA_HOST_RX = /^(?:loja|checkout|blog|pay|pagamentos?|www)\./i;

function isExcludedCaveiraUrl(urlStr = '') {
  try {
    const u = new URL(String(urlStr || ''));
    return EXCLUDED_CAVEIRA_HOST_RX.test(u.hostname || '');
  } catch (_) {
    return false;
  }
}

let directSyncDebounceTimer = null;

const CAVEIRA_URL_PATTERNS = [
  '*://*.caveira.com/*',
  '*://caveira.com/*',
  '*://*.caveira.com.br/*',
  '*://caveira.com.br/*',
  '*://*.projetocaveira.com.br/*',
  '*://projetocaveira.com.br/*',
  '*://*.projetocaveira.com/*',
  '*://projetocaveira.com/*',
];

const QG_URL_PATTERNS = [
  'https://blk002.github.io/*',
];

async function migrateCloudAuthToSession() {
  try {
    const legacy = await chrome.storage.local.get([CLOUD_AUTH_KEY]);
    const auth = legacy?.[CLOUD_AUTH_KEY];
    if (auth && typeof auth === 'object') {
      if (chrome.storage?.session && (auth.accessToken || auth.refreshToken)) {
        await chrome.storage.session.set({ [CLOUD_AUTH_KEY]: auth });
      }
      await chrome.storage.local.remove([CLOUD_AUTH_KEY]);
      await chrome.storage.local.set({
        [CLOUD_AUTH_META_KEY]: {
          authenticated: Boolean(auth.accessToken && auth.userId),
          userId: auth.userId || null,
          updatedAt: Date.now(),
        },
      });
    }
  } catch (_) {}
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
    errors: Number(rawSession.errors) || 0,
    ...(rawSession.wasExplicitlyReset ? { wasExplicitlyReset: true } : {}),
  };
}

async function ensureMigratedFromLegacyStorage() {
  try {
    const res = await chrome.storage.local.get([STORAGE_KEY, USER_BUCKETS_KEY, ACTIVE_USER_KEY]);
    const list = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
    const activeId = res?.[ACTIVE_USER_KEY] || null;
    const allLegacy = [...list.map((q) => (q && !q.ownerUserId && activeId ? { ...q, ownerUserId: activeId } : q))];
    const buckets = res?.[USER_BUCKETS_KEY];
    if (buckets && typeof buckets === 'object') {
      Object.entries(buckets).forEach(([uid, b]) => {
        (Array.isArray(b?.questions) ? b.questions : []).forEach((q) => {
          if (q?.id) allLegacy.push({ ...q, ownerUserId: q.ownerUserId || uid });
        });
      });
    }
    await migrateLegacyChromeStorageToDexie(allLegacy);
  } catch (_) {}
}

// Reinjetar scripts automaticamente em abas ativas/carregadas ao instalar/atualizar (ignora descartadas; CSS vai no Shadow DOM)
async function reinjectOpenTabs() {
  if (!chrome.scripting || !chrome.tabs) return;
  try {
    const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
    for (const tab of qgTabs) {
      if (tab.id && !tab.discarded && tab.status === 'complete') {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['qg_bridge.js'],
          });
        } catch (_) {}
      }
    }

    const caveiraTabs = await chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS });
    for (const tab of caveiraTabs) {
      if (tab.id && !tab.discarded && tab.status === 'complete' && !isExcludedCaveiraUrl(tab.url)) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['api_sniffer.js'],
            world: 'MAIN',
          });
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['treeMatcher.js', 'caveiraResolver.js', 'content.js'],
          });
        } catch (_) {}
      }
    }
  } catch (_) {}
}

function ensurePeriodicAlarm() {
  if (!chrome.alarms) return;
  try {
    chrome.alarms.get(PERIODIC_ALARM_NAME, (existing) => {
      if (chrome.runtime?.lastError) return;
      if (!existing) {
        chrome.alarms.create(PERIODIC_ALARM_NAME, { delayInMinutes: 5, periodInMinutes: 30 });
      }
    });
  } catch (_) {}
}

function scheduleOutboxFlush() {
  if (directSyncDebounceTimer) clearTimeout(directSyncDebounceTimer);
  directSyncDebounceTimer = setTimeout(() => {
    flushOutboxToSupabase({ onlyWhenQgClosed: true }).catch(() => {});
  }, 4000);
  if (chrome.alarms) {
    try {
      chrome.alarms.create(OUTBOX_FLUSH_ALARM_NAME, { delayInMinutes: 0.5 });
    } catch (_) {}
  }
}

async function broadcastToQgTabs(questions, session, dailyGoal = 50) {
  if (!chrome.tabs) return;
  try {
    const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
    for (const tab of qgTabs) {
      if (tab.id && !tab.discarded) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'PUSH_CAVEIRA_SYNC',
          payload: { questions, session, dailyGoal },
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

async function checkAndNotifyUser() {
  if (!chrome.notifications) return;
  try {
    const store = await chrome.storage.local.get([
      NOTIF_ENABLED_KEY,
      LAST_NOTIF_META_KEY,
      REMINDER_STATE_KEY,
      SESSION_KEY,
    ]);
    if (store?.[NOTIF_ENABLED_KEY] === false) return;

    const now = new Date();
    const hour = now.getHours();
    if (hour < 8 || hour > 22) return;

    const today = getTodaySessionDate();
    const lastMeta = store?.[LAST_NOTIF_META_KEY] || {};
    if (lastMeta.sentAt && (Date.now() - Number(lastMeta.sentAt)) < 4 * 3600 * 1000) {
      return;
    }

    const reminder = store?.[REMINDER_STATE_KEY] || {};
    const session = normalizeSession(store?.[SESSION_KEY]);
    const pendingReviews = Number(reminder.pendingReviewsCount) || 0;
    const streakActive = Boolean(reminder.streakActiveToday && reminder.todayDate === today) || session.total > 0;

    let notifKind = null;
    let title = '';
    let message = '';

    if (pendingReviews > 0 && lastMeta.lastReviewDay !== today) {
      notifKind = 'review';
      title = `🧠 QG da PRF: ${pendingReviews} revisão(ões) FSRS pendente(s)`;
      message = 'Mantenha sua retenção alta revisando as questões vencidas hoje no QG!';
    } else if (hour >= 18 && !streakActive && lastMeta.lastStreakDay !== today) {
      notifKind = 'streak';
      title = '🔥 Proteja seu Streak na PRF hoje!';
      message = 'Nenhuma questão ou estudo registrado hoje ainda. Resolva 1 bateria rápida!';
    }

    if (!notifKind) return;

    chrome.notifications.create(`qg_prf_${notifKind}_${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title,
      message,
      priority: 1,
    });

    await chrome.storage.local.set({
      [LAST_NOTIF_META_KEY]: {
        ...lastMeta,
        sentAt: Date.now(),
        ...(notifKind === 'review' ? { lastReviewDay: today } : {}),
        ...(notifKind === 'streak' ? { lastStreakDay: today } : {}),
      },
    });
  } catch (_) {}
}

if (chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === OUTBOX_FLUSH_ALARM_NAME) {
      flushOutboxToSupabase({ onlyWhenQgClosed: true }).catch(() => {});
      return;
    }
    if (alarm && alarm.name === PERIODIC_ALARM_NAME) {
      flushOutboxToSupabase({ onlyWhenQgClosed: true })
        .then(() => pullDeltaFromSupabase())
        .then(() => checkAndNotifyUser())
        .catch(() => {});
    }
  });
}

if (chrome.notifications?.onClicked) {
  chrome.notifications.onClicked.addListener(async () => {
    try {
      const targetUrl = 'https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=hoje';
      const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
      if (qgTabs && qgTabs.length > 0 && qgTabs[0].id) {
        await chrome.tabs.update(qgTabs[0].id, { active: true });
        if (qgTabs[0].windowId && chrome.windows) {
          chrome.windows.update(qgTabs[0].windowId, { focused: true }).catch(() => {});
        }
      } else {
        await chrome.tabs.create({ url: targetUrl });
      }
    } catch (_) {}
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await migrateCloudAuthToSession();
    const res = await chrome.storage.local.get([STORAGE_KEY, SESSION_KEY]);
    if (!res[STORAGE_KEY]) {
      await chrome.storage.local.set({ [STORAGE_KEY]: [] });
    }
    const session = normalizeSession(res[SESSION_KEY]);
    await chrome.storage.local.set({ [SESSION_KEY]: session });
    await ensureMigratedFromLegacyStorage();
    ensurePeriodicAlarm();
    reinjectOpenTabs();
  } catch (_) {}
});

if (chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(async () => {
    try {
      await migrateCloudAuthToSession();
      await ensureMigratedFromLegacyStorage();
      ensurePeriodicAlarm();
      await flushOutboxToSupabase({ onlyWhenQgClosed: true });
      await pullDeltaFromSupabase();
      await checkAndNotifyUser();
    } catch (_) {}
  });
}

if (chrome.commands?.onCommand) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'mark-doubt' && command !== 'mark-guess') return;
    const tag = command === 'mark-doubt' ? 'duvida' : 'chute';
    try {
      const activeTabs = (await chrome.tabs.query({ active: true, currentWindow: true, url: CAVEIRA_URL_PATTERNS }))
        .filter((t) => t?.id && !isExcludedCaveiraUrl(t.url));
      const allTabs = (await chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS }))
        .filter((t) => t?.id && !isExcludedCaveiraUrl(t.url));
      const targetTab = activeTabs[0] || allTabs[0];
      if (targetTab?.id) {
        chrome.tabs.sendMessage(targetTab.id, { type: 'HUD_QUICK_TAG', payload: { tag } }).catch(() => {});
      }
    } catch (_) {}
  });
}

migrateCloudAuthToSession();
ensurePeriodicAlarm();
ensureMigratedFromLegacyStorage();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes[SESSION_KEY]) {
    const session = normalizeSession(changes[SESSION_KEY].newValue);
    const total = Number(session.total) || 0;
    const net = (Number(session.hits) || 0) - (Number(session.errors) || 0);
    if (total > 0) {
      chrome.action.setBadgeText({ text: `${total}` });
      chrome.action.setBadgeBackgroundColor({ color: net >= 0 ? '#10b981' : '#ef4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }

  if (changes[STORAGE_KEY] || changes[SESSION_KEY] || changes[GOAL_KEY]) {
    chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY, ACTIVE_USER_KEY], async (res) => {
      if (chrome.runtime?.lastError) return;
      try {
        const session = normalizeSession(res?.[SESSION_KEY]);
        const dailyGoal = Number(res?.[GOAL_KEY]) || 50;
        const activeId = res?.[ACTIVE_USER_KEY] || null;
        let fullQuestions = [];
        try {
          fullQuestions = await getAllQuestionsFull(activeId);
        } catch (_) {}
        const listToPush = fullQuestions.length > 0 ? fullQuestions : (res?.[STORAGE_KEY] || []);
        broadcastToQgTabs(listToPush, session, dailyGoal);
      } catch (_) {}
    });
  }

  if (changes[FILTER_ID_MEMORY_KEY]) {
    scheduleOutboxFlush();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  // #2 / #5 RPCs do IndexedDB (Dexie + MiniSearch + Outbox)
  if (message.type === 'DB_UPSERT_QUESTION') {
    (async () => {
      await ensureMigratedFromLegacyStorage();
      const merged = await upsertQuestionFull(message.payload?.question, {
        enqueueOutbox: message.payload?.enqueueOutbox !== false,
      });
      scheduleOutboxFlush();
      sendResponse({ ok: Boolean(merged), question: merged });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DB_BULK_UPSERT_QUESTIONS') {
    (async () => {
      await ensureMigratedFromLegacyStorage();
      const mergedList = await bulkUpsertQuestionsFull(message.payload?.questions || [], {
        enqueueOutbox: Boolean(message.payload?.enqueueOutbox),
      });
      if (message.payload?.enqueueOutbox) scheduleOutboxFlush();
      sendResponse({ ok: true, count: mergedList.length });
    })().catch(() => sendResponse({ ok: false, count: 0 }));
    return true;
  }

  if (message.type === 'DB_DELETE_QUESTION') {
    (async () => {
      await deleteQuestionFull(message.payload?.id, message.payload?.userId || null, {
        enqueueOutbox: message.payload?.enqueueOutbox !== false,
      });
      scheduleOutboxFlush();
      sendResponse({ ok: true });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DB_CLEAR_USER_QUESTIONS') {
    (async () => {
      await clearUserQuestions(message.payload?.userId || null);
      sendResponse({ ok: true });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DB_REPLACE_USER_QUESTIONS') {
    (async () => {
      const count = await replaceUserQuestions(
        message.payload?.userId || null,
        message.payload?.questions || []
      );
      sendResponse({ ok: true, count });
    })().catch(() => sendResponse({ ok: false, count: 0 }));
    return true;
  }

  if (message.type === 'DB_GET_ALL_QUESTIONS') {
    (async () => {
      await ensureMigratedFromLegacyStorage();
      const questions = await getAllQuestionsFull(message.payload?.userId || null);
      sendResponse({ ok: true, questions });
    })().catch(() => sendResponse({ ok: false, questions: [] }));
    return true;
  }

  if (message.type === 'DB_SEARCH_QUESTIONS') {
    (async () => {
      await ensureMigratedFromLegacyStorage();
      const results = await searchQuestionsOffline(
        message.payload?.query || '',
        message.payload?.userId || null,
        message.payload?.limit || 25
      );
      sendResponse({ ok: true, results });
    })().catch(() => sendResponse({ ok: false, results: [] }));
    return true;
  }

  if (message.type === 'DB_GET_STATS') {
    (async () => {
      await ensureMigratedFromLegacyStorage();
      const stats = await getDbStats(message.payload?.userId || null);
      sendResponse({ ok: true, stats });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DB_MERGE_TREE_OVERLAY') {
    (async () => {
      const added = await mergeDynamicTreeNodes(message.payload?.nodes || []);
      sendResponse({ ok: true, added });
    })().catch(() => sendResponse({ ok: false, added: 0 }));
    return true;
  }

  if (message.type === 'DB_GET_TREE_OVERLAY') {
    (async () => {
      const nodes = await getAllDynamicTreeNodes();
      sendResponse({ ok: true, nodes });
    })().catch(() => sendResponse({ ok: false, nodes: [] }));
    return true;
  }

  if (message.type === 'FORCE_DIRECT_SYNC_NOW') {
    (async () => {
      const resFlush = await flushOutboxToSupabase({ onlyWhenQgClosed: false });
      const resPull = await pullDeltaFromSupabase();
      sendResponse({ ok: true, resFlush, resPull });
    })().catch(() => sendResponse({ ok: false }));
    return true;
  }

  // Relay iframe <-> top frame (#1)
  if ((message.type === 'APPLY_PLAYER_SPEED' || message.type === 'SEEK_VIDEO_TO') && sender?.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, message).catch(() => {});
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'PLAYER_VIDEO_ENDED' && sender?.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, message, { frameId: 0 }).catch(() => {});
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'UPDATE_BADGE_ONLY') {
    const session = normalizeSession(message.payload?.session);
    const total = Number(session.total) || 0;
    const net = (Number(session.hits) || 0) - (Number(session.errors) || 0);
    chrome.action.setBadgeText({ text: total > 0 ? `${total}` : '' });
    if (total > 0) {
      chrome.action.setBadgeBackgroundColor({ color: net >= 0 ? '#10b981' : '#ef4444' });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_CAVEIRA_QUESTIONS') {
    if (chrome.tabs) {
      chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS }).then((tabs) => {
        for (const t of tabs) {
          if (t.id && !t.discarded && !isExcludedCaveiraUrl(t.url)) {
            chrome.tabs.sendMessage(t.id, { type: 'FORCE_SCAN_NOW' }).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    setTimeout(async () => {
      try {
        const res = await chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY, ACTIVE_USER_KEY]);
        const session = normalizeSession(res?.[SESSION_KEY]);
        const dailyGoal = Number(res?.[GOAL_KEY]) || 50;
        if (res?.[SESSION_KEY]?.date !== session.date) {
          chrome.storage.local.set({ [SESSION_KEY]: session }).catch(() => {});
        }
        await ensureMigratedFromLegacyStorage();
        const dbQuestions = await getAllQuestionsFull(res?.[ACTIVE_USER_KEY] || null);
        sendResponse({
          questions: dbQuestions.length > 0 ? dbQuestions : (res?.[STORAGE_KEY] || []),
          session,
          dailyGoal,
        });
      } catch (_) {
        sendResponse({
          questions: [],
          session: normalizeSession(null),
          dailyGoal: 50,
        });
      }
    }, 150);
    return true;
  }

  if (message.type === 'CLEAR_CAVEIRA_SESSION') {
    const today = getTodaySessionDate();
    const cleanSession = { date: today, hits: 0, errors: 0, total: 0, wasExplicitlyReset: true };
    chrome.storage.local.get([ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
      if (chrome.runtime?.lastError) {
        sendResponse({ success: false });
        return;
      }
      const activeUserId = res?.[ACTIVE_USER_KEY] || null;
      const payload = { [SESSION_KEY]: cleanSession };
      if (activeUserId && res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object') {
        const buckets = { ...res[USER_BUCKETS_KEY] };
        if (buckets[activeUserId]) {
          buckets[activeUserId] = { ...buckets[activeUserId], session: cleanSession };
          payload[USER_BUCKETS_KEY] = buckets;
        }
      }
      chrome.storage.local.set(payload, () => {
        chrome.action.setBadgeText({ text: '' });
        sendResponse({ success: !chrome.runtime?.lastError });
      });
    });
    return true;
  }

  if (message.type === 'OPEN_CAVEIRA_PRACTICE') {
    (async () => {
      try {
        const lastWin = chrome.windows?.getLastFocused
          ? await chrome.windows.getLastFocused().catch(() => null)
          : null;
        const focusedWinId = lastWin?.id || null;
        const rawTabs = chrome.tabs ? await chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS }) : [];
        const tabs = (rawTabs || []).filter((t) => t && t.id && !isExcludedCaveiraUrl(t.url));
        const nonCourseTabs = tabs.filter((t) => !String(t.url || '').includes('/courses'));
        const scoreTab = (t) => (
          (t.active && focusedWinId && t.windowId === focusedWinId ? 1e15 : 0) +
          (t.active ? 1e14 : 0) +
          (Number(t.lastAccessed) || 0)
        );
        const questTabs = nonCourseTabs
          .filter((t) => /\/questions\b/i.test(t.url || ''))
          .sort((a, b) => scoreTab(b) - scoreTab(a));
        const questTab = questTabs[0] || null;
        const fallbackTabs = [...nonCourseTabs].sort((a, b) => scoreTab(b) - scoreTab(a));
        const fallbackTab = fallbackTabs[0] || null;
        let targetOrigin = 'https://app.caveira.com';
        const originSource = questTab?.url || fallbackTab?.url || tabs[0]?.url;
        if (originSource) {
          try {
            targetOrigin = new URL(originSource).origin;
          } catch (_) {}
        }

        const writePendingForTab = async (tabId) => {
          await chrome.storage.local.set({
            [PENDING_FILTER_KEY]: {
              ...(message.payload || {}),
              targetTabId: tabId || null,
              createdAt: Date.now(),
            },
          });
        };

        if (questTab && questTab.id && !questTab.discarded) {
          await chrome.tabs.update(questTab.id, { active: true });
          if (questTab.windowId && chrome.windows) {
            await chrome.windows.update(questTab.windowId, { focused: true }).catch(() => {});
          }
          let delivered = false;
          try {
            const resp = await chrome.tabs.sendMessage(questTab.id, {
              type: 'APPLY_CAVEIRA_FILTER',
              payload: message.payload || {},
            });
            delivered = Boolean(resp && resp.ok);
          } catch (_) {}
          if (delivered) {
            await chrome.storage.local.remove([PENDING_FILTER_KEY]).catch(() => {});
          } else {
            await writePendingForTab(questTab.id);
            await chrome.tabs.update(questTab.id, { active: true, url: `${targetOrigin}/questions` });
          }
        } else if (fallbackTab && fallbackTab.id) {
          await writePendingForTab(fallbackTab.id);
          await chrome.tabs.update(fallbackTab.id, { active: true, url: `${targetOrigin}/questions` });
          if (fallbackTab.windowId && chrome.windows) {
            await chrome.windows.update(fallbackTab.windowId, { focused: true }).catch(() => {});
          }
        } else if (chrome.tabs) {
          const created = await chrome.tabs.create({ url: `${targetOrigin}/questions`, active: true });
          await writePendingForTab(created?.id || null);
          if (created?.windowId && chrome.windows?.update) {
            await chrome.windows.update(created.windowId, { focused: true }).catch(() => {});
          }
        }
        sendResponse({ success: true });
      } catch (_) {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  if (message.type === 'CONSUME_PENDING_FILTER') {
    (async () => {
      try {
        const res = await chrome.storage.local.get([PENDING_FILTER_KEY]);
        const pending = res?.[PENDING_FILTER_KEY];
        if (!pending) {
          sendResponse({ ok: true, filter: null });
          return;
        }
        if ((Date.now() - (Number(pending.createdAt) || 0)) >= 180000) {
          await chrome.storage.local.remove([PENDING_FILTER_KEY]).catch(() => {});
          sendResponse({ ok: true, filter: null });
          return;
        }
        if (pending.targetTabId && sender?.tab?.id && Number(pending.targetTabId) !== Number(sender.tab.id)) {
          sendResponse({ ok: true, filter: null });
          return;
        }
        await chrome.storage.local.remove([PENDING_FILTER_KEY]).catch(() => {});
        sendResponse({ ok: true, filter: pending });
      } catch (_) {
        sendResponse({ ok: false, filter: null });
      }
    })();
    return true;
  }

  if (message.type === 'OPEN_OR_FOCUS_QG') {
    (async () => {
      try {
        const fallbackUrl = message.payload?.url || 'https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=caveira';
        const qgTabs = chrome.tabs ? await chrome.tabs.query({ url: QG_URL_PATTERNS }) : [];
        if (qgTabs && qgTabs.length > 0) {
          const sorted = [...qgTabs].sort((a, b) => ((b.active ? 1e14 : 0) + (Number(b.lastAccessed) || 0)) - ((a.active ? 1e14 : 0) + (Number(a.lastAccessed) || 0)));
          const tab = sorted[0];
          if (tab?.id) {
            await chrome.tabs.update(tab.id, { active: true });
            if (tab.windowId && chrome.windows?.update) {
              await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
            }
            sendResponse({ success: true, focused: true });
            return;
          }
        }
        if (chrome.tabs) {
          const created = await chrome.tabs.create({ url: fallbackUrl, active: true });
          if (created?.windowId && chrome.windows?.update) {
            await chrome.windows.update(created.windowId, { focused: true }).catch(() => {});
          }
        }
        sendResponse({ success: true, focused: false });
      } catch (_) {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  if (message.type === 'SET_CLOUD_AUTH' && message.payload?.userId) {
    (async () => {
      try {
        const authPayload = { ...message.payload, updatedAt: Date.now() };
        if (chrome.storage?.session) {
          await chrome.storage.session.set({ [CLOUD_AUTH_KEY]: authPayload });
        }
        await chrome.storage.local.remove([CLOUD_AUTH_KEY]);
        await chrome.storage.local.set({
          [CLOUD_AUTH_META_KEY]: {
            authenticated: Boolean(authPayload.accessToken && authPayload.userId),
            userId: authPayload.userId || null,
            updatedAt: Date.now(),
          },
        });
        sendResponse({ ok: true });
      } catch (_) {
        sendResponse({ ok: false });
      }
    })();
    return true;
  }

  if (message.type === 'CLEAR_CLOUD_AUTH') {
    (async () => {
      try {
        if (chrome.storage?.session) {
          await chrome.storage.session.remove([CLOUD_AUTH_KEY]);
        }
        await chrome.storage.local.remove([CLOUD_AUTH_KEY, CLOUD_AUTH_META_KEY]);
        sendResponse({ ok: true });
      } catch (_) {
        sendResponse({ ok: false });
      }
    })();
    return true;
  }

  if (message.type === 'GET_CLOUD_AUTH_STATUS') {
    (async () => {
      try {
        await migrateCloudAuthToSession();
        const sess = chrome.storage?.session ? await chrome.storage.session.get([CLOUD_AUTH_KEY]) : {};
        const auth = sess?.[CLOUD_AUTH_KEY];
        sendResponse({
          ok: true,
          authenticated: Boolean(auth?.accessToken && auth?.userId),
          userId: auth?.userId || null,
        });
      } catch (_) {
        sendResponse({ ok: false, authenticated: false, userId: null });
      }
    })();
    return true;
  }

  if (message.type === 'FLUSH_PENDING_QG_EVENTS') {
    (async () => {
      try {
        const qgTabs = chrome.tabs ? await chrome.tabs.query({ url: QG_URL_PATTERNS }) : [];
        for (const tab of (qgTabs || [])) {
          if (tab.id && !tab.discarded) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'FLUSH_PENDING_QG_EVENTS',
              forceRetry: Boolean(message.forceRetry),
            }).catch(() => {});
          }
        }
        sendResponse({ success: true, tabs: (qgTabs || []).length });
      } catch (_) {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  if (message.type === 'OPEN_QG_LESSON_COMPLETE') {
    (async () => {
      try {
        const targetUrl = 'https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=hoje';
        const qgTabs = chrome.tabs ? await chrome.tabs.query({ url: QG_URL_PATTERNS }) : [];
        if (qgTabs && qgTabs.length > 0 && qgTabs[0].id) {
          const tab = qgTabs[0];
          await chrome.tabs.update(tab.id, { active: true });
          if (tab.windowId && chrome.windows) {
            chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
          }
          chrome.tabs.sendMessage(tab.id, {
            type: 'PUSH_COURSE_LESSON_COMPLETE',
            payload: message.payload || {},
          }).catch(() => {});
        } else if (chrome.tabs) {
          await chrome.tabs.create({ url: targetUrl });
        }
        sendResponse({ success: true });
      } catch (_) {
        sendResponse({ success: false });
      }
    })();
    return true;
  }

  return false;
});
