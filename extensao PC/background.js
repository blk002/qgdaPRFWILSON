// Background Service Worker — QG da PRF Rastreador Caveira

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';
const ACTIVE_USER_KEY = 'qg_active_user_id';
const USER_BUCKETS_KEY = 'qg_caveira_user_buckets';
const GOAL_KEY = 'qg_caveira_daily_goal';
const FILTER_ID_MEMORY_KEY = 'qg_caveira_filter_id_memory_v1';
const CLOUD_AUTH_KEY = 'qg_cloud_auth';
const REMINDER_STATE_KEY = 'qg_reminder_state';
const DIRECT_SYNC_LAST_KEY = 'qg_last_direct_cloud_sync';
const NOTIF_ENABLED_KEY = 'qg_notifications_enabled';
const LAST_NOTIF_META_KEY = 'qg_last_notification_meta';
const PERIODIC_ALARM_NAME = 'qg_periodic_check';
let directSyncDebounceTimer = null;
let isDirectSyncRunning = false;

const CAVEIRA_URL_PATTERNS = [
  '*://*.caveira.com/*',
  '*://caveira.com/*',
  '*://*.caveira.com.br/*',
  '*://caveira.com.br/*',
  '*://*.projetocaveira.com.br/*',
  '*://projetocaveira.com.br/*',
  '*://*.projetocaveira.com/*',
  '*://projetocaveira.com/*'
];

const QG_URL_PATTERNS = [
  'https://blk002.github.io/*',
  'http://localhost:*/*',
  'http://127.0.0.1:*/*'
];

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
    errors: Number(rawSession.errors) || 0,
    ...(rawSession.wasExplicitlyReset ? { wasExplicitlyReset: true } : {})
  };
}

// Reinjetar scripts automaticamente em abas ativas/carregadas ao instalar/atualizar a extensão (ignora abas descartadas para evitar "An unknown error occurred when fetching the script")
async function reinjectOpenTabs() {
  if (!chrome.scripting || !chrome.tabs) return;
  try {
    const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
    for (const tab of qgTabs) {
      if (tab.id && !tab.discarded && tab.status === 'complete') {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['qg_bridge.js']
          });
        } catch (_) {}
      }
    }

    const caveiraTabs = await chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS });
    for (const tab of caveiraTabs) {
      if (tab.id && !tab.discarded && tab.status === 'complete') {
        try {
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          });
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['api_sniffer.js'],
            world: 'MAIN'
          });
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['treeMatcher.js', 'caveiraResolver.js', 'content.js']
          });
        } catch (_) {}
      }
    }
  } catch (_) {}
}

// #4: Configurar alarme periódico em segundo plano (30 min)
function ensurePeriodicAlarm() {
  if (!chrome.alarms) return;
  try {
    chrome.alarms.get(PERIODIC_ALARM_NAME, (existing) => {
      if (!existing) {
        chrome.alarms.create(PERIODIC_ALARM_NAME, { delayInMinutes: 5, periodInMinutes: 30 });
      }
    });
  } catch (_) {}
}

// #5: Sync direto Extensão -> Supabase quando nenhuma aba do QG estiver aberta
async function syncQuestionsDirectlyToSupabase(forceWhenQgClosed = true) {
  if (isDirectSyncRunning) return false;
  isDirectSyncRunning = true;
  try {
    if (forceWhenQgClosed && chrome.tabs) {
      const openQg = await chrome.tabs.query({ url: QG_URL_PATTERNS });
      if (openQg && openQg.length > 0) {
        // Quando o QG está aberto, a ponte qg_bridge.js já cuida do auto-save sem conflitos
        return false;
      }
    }

    const store = await chrome.storage.local.get([
      CLOUD_AUTH_KEY,
      ACTIVE_USER_KEY,
      STORAGE_KEY,
      FILTER_ID_MEMORY_KEY
    ]);
    const auth = store?.[CLOUD_AUTH_KEY];
    const activeUserId = store?.[ACTIVE_USER_KEY];
    if (!auth || !auth.supabaseUrl || !auth.anonKey || !auth.userId || (!auth.accessToken && !auth.refreshToken)) {
      return false;
    }
    if (activeUserId && activeUserId !== auth.userId) return false;

    const localQuestions = (Array.isArray(store?.[STORAGE_KEY]) ? store[STORAGE_KEY] : [])
      .filter(q => q && q.id && (!q.ownerUserId || q.ownerUserId === auth.userId));
    const localFilterMem = (store?.[FILTER_ID_MEMORY_KEY] && typeof store[FILTER_ID_MEMORY_KEY] === 'object')
      ? store[FILTER_ID_MEMORY_KEY]
      : {};
    if (localQuestions.length === 0 && Object.keys(localFilterMem).length === 0) return false;

    let token = auth.accessToken;
    const nowSec = Math.floor(Date.now() / 1000);
    if ((!token || (auth.expiresAt && nowSec >= Number(auth.expiresAt) - 60)) && auth.refreshToken) {
      const refreshRes = await fetch(`${auth.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: auth.anonKey
        },
        body: JSON.stringify({ refresh_token: auth.refreshToken })
      });
      if (!refreshRes.ok) return false;
      const refreshed = await refreshRes.json();
      if (!refreshed?.access_token) return false;
      token = refreshed.access_token;
      await chrome.storage.local.set({
        [CLOUD_AUTH_KEY]: {
          ...auth,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || auth.refreshToken,
          expiresAt: refreshed.expires_at || (nowSec + (Number(refreshed.expires_in) || 3600)),
          updatedAt: Date.now()
        }
      });
    }

    if (!token) return false;

    const headers = {
      apikey: auth.anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const getRes = await fetch(
      `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(auth.userId)}&select=full_data,updated_at&limit=1`,
      { headers }
    );
    if (!getRes.ok) return false;
    const rows = await getRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !row.full_data || typeof row.full_data !== 'object') return false;

    const remoteData = { ...row.full_data };
    const remoteQuestions = Array.isArray(remoteData.caveiraQuestions) ? remoteData.caveiraQuestions : [];
    const mergedMap = new Map();
    remoteQuestions.forEach(q => { if (q?.id) mergedMap.set(q.id, q); });

    let hasDiff = false;
    localQuestions.forEach((lq) => {
      const rq = mergedMap.get(lq.id);
      if (!rq) {
        mergedMap.set(lq.id, lq);
        hasDiff = true;
      } else {
        const lTs = new Date(lq.updatedAt || lq.timestamp || 0).getTime() || 0;
        const rTs = new Date(rq.updatedAt || rq.timestamp || 0).getTime() || 0;
        const lAtt = Array.isArray(lq.attempts) ? lq.attempts.length : 0;
        const rAtt = Array.isArray(rq.attempts) ? rq.attempts.length : 0;
        const newerLocal = lTs > rTs || lAtt > rAtt || (!rq.teacherComment && lq.teacherComment) || (rq.communityCorrectPct === undefined && lq.communityCorrectPct !== undefined);
        if (newerLocal) {
          mergedMap.set(lq.id, {
            ...rq,
            ...lq,
            userNote: (lq.userNote && lq.userNote.trim()) ? lq.userNote : (rq.userNote || ''),
            teacherComment: lq.teacherComment || rq.teacherComment || '',
            attempts: lAtt >= rAtt ? lq.attempts : rq.attempts
          });
          hasDiff = true;
        }
      }
    });

    const remoteMem = (remoteData.caveiraFilterMemory && typeof remoteData.caveiraFilterMemory === 'object')
      ? { ...remoteData.caveiraFilterMemory }
      : {};
    let memChanged = false;
    Object.entries(localFilterMem).forEach(([k, v]) => {
      if (!v || typeof v !== 'object') return;
      if (!remoteMem[k] || (Number(v.updatedAt) || 0) > (Number(remoteMem[k].updatedAt) || 0)) {
        remoteMem[k] = v;
        memChanged = true;
      }
    });

    if (!hasDiff && !memChanged) return false;

    const nowIso = new Date().toISOString();
    const nextTimestamps = { ...(remoteData._keyTimestamps || {}) };
    if (hasDiff) nextTimestamps.caveiraQuestions = nowIso;
    if (memChanged) nextTimestamps.caveiraFilterMemory = nowIso;

    const nextFullData = {
      ...remoteData,
      caveiraQuestions: Array.from(mergedMap.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)),
      caveiraFilterMemory: remoteMem,
      _keyTimestamps: nextTimestamps
    };

    const lockFilter = row.updated_at ? `&updated_at=eq.${encodeURIComponent(row.updated_at)}` : '';
    const patchRes = await fetch(
      `${auth.supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(auth.userId)}${lockFilter}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ full_data: nextFullData, updated_at: nowIso })
      }
    );
    if (patchRes.ok) {
      await chrome.storage.local.set({ [DIRECT_SYNC_LAST_KEY]: Date.now() });
      return true;
    }
    return false;
  } catch (_) {
    return false;
  } finally {
    isDirectSyncRunning = false;
  }
}

function scheduleDirectCloudSync() {
  if (directSyncDebounceTimer) clearTimeout(directSyncDebounceTimer);
  directSyncDebounceTimer = setTimeout(() => {
    syncQuestionsDirectlyToSupabase(true);
  }, 6000);
}

// #4: Notificações proativas de Revisão FSRS e Risco de Streak
async function checkAndNotifyUser() {
  if (!chrome.notifications) return;
  try {
    const store = await chrome.storage.local.get([
      NOTIF_ENABLED_KEY,
      LAST_NOTIF_META_KEY,
      REMINDER_STATE_KEY,
      SESSION_KEY
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
      message = 'Nenhum estudo ou questão registrada hoje ainda. Resolva 1 bateria rápida!';
    }

    if (!notifKind) return;

    chrome.notifications.create(`qg_prf_${notifKind}_${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title,
      message,
      priority: 1
    });

    await chrome.storage.local.set({
      [LAST_NOTIF_META_KEY]: {
        ...lastMeta,
        sentAt: Date.now(),
        ...(notifKind === 'review' ? { lastReviewDay: today } : {}),
        ...(notifKind === 'streak' ? { lastStreakDay: today } : {})
      }
    });
  } catch (_) {}
}

if (chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === PERIODIC_ALARM_NAME) {
      syncQuestionsDirectlyToSupabase(true);
      checkAndNotifyUser();
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

// Notifica todas as abas abertas do QG da PRF imediatamente quando novas questões ou meta diária são salvas
async function broadcastToQgTabs(questions, session, dailyGoal = 50) {
  if (!chrome.tabs) return;
  try {
    const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
    for (const tab of qgTabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'PUSH_CAVEIRA_SYNC',
          payload: { questions, session, dailyGoal }
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

// Inicializar armazenamento e alarmes
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
    if (!res[STORAGE_KEY]) {
      chrome.storage.local.set({ [STORAGE_KEY]: [] });
    }
    const session = normalizeSession(res[SESSION_KEY]);
    chrome.storage.local.set({ [SESSION_KEY]: session });
  });
  ensurePeriodicAlarm();
  reinjectOpenTabs();
});

if (chrome.runtime?.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    ensurePeriodicAlarm();
    syncQuestionsDirectlyToSupabase(true);
    checkAndNotifyUser();
  });
}
ensurePeriodicAlarm();

// Atualiza o badge do ícone da extensão e faz push para abas do QG sempre que o storage mudar
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
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
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (res) => {
        const session = normalizeSession(res[SESSION_KEY]);
        const dailyGoal = Number(res[GOAL_KEY]) || 50;
        broadcastToQgTabs(res[STORAGE_KEY] || [], session, dailyGoal);
      });
    }

    if (changes[STORAGE_KEY] || changes[FILTER_ID_MEMORY_KEY]) {
      scheduleDirectCloudSync();
    }
  }
});

// Ouvir mensagens de content scripts, player_bridge (iframe) ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // #1 Relay entre top frame (Caveira) e iframe (BunnyCDN mediadelivery.net)
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
    // Solicita varredura imediata nas abas abertas do Projeto Caveira antes de retornar os dados
    if (chrome.tabs) {
      chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS }).then((tabs) => {
        for (const t of tabs) {
          if (t.id) {
            chrome.tabs.sendMessage(t.id, { type: 'FORCE_SCAN_NOW' }).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    setTimeout(() => {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (res) => {
        const session = normalizeSession(res[SESSION_KEY]);
        const dailyGoal = Number(res[GOAL_KEY]) || 50;
        if (res[SESSION_KEY]?.date !== session.date) {
          chrome.storage.local.set({ [SESSION_KEY]: session });
        }
        sendResponse({
          questions: res[STORAGE_KEY] || [],
          session,
          dailyGoal
        });
      });
    }, 150);
    return true;
  }

  if (message.type === 'CLEAR_CAVEIRA_SESSION') {
    const today = getTodaySessionDate();
    const cleanSession = { date: today, hits: 0, errors: 0, total: 0, wasExplicitlyReset: true };
    chrome.storage.local.get([ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
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
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.type === 'OPEN_CAVEIRA_PRACTICE') {
    (async () => {
      try {
        const tabs = chrome.tabs ? await chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS }) : [];
        const nonCourseTabs = (tabs || []).filter(t => t && t.id && !String(t.url || '').includes('/courses'));
        const preferredTab = nonCourseTabs.find(t => /quest/i.test(t.url || '')) || nonCourseTabs[0] || null;

        if (preferredTab && preferredTab.id) {
          await chrome.tabs.update(preferredTab.id, { active: true });
          if (preferredTab.windowId && chrome.windows) {
            chrome.windows.update(preferredTab.windowId, { focused: true }).catch(() => {});
          }
          chrome.tabs.sendMessage(preferredTab.id, {
            type: 'APPLY_CAVEIRA_FILTER',
            payload: message.payload || {}
          }).catch(() => {});
        } else if (chrome.tabs) {
          let targetOrigin = 'https://app.caveira.com';
          if (tabs && tabs.length > 0 && tabs[0].url) {
            try {
              targetOrigin = new URL(tabs[0].url).origin;
            } catch (_) {}
          }
          await chrome.tabs.create({ url: `${targetOrigin}/questions` });
        }
        sendResponse({ success: true });
      } catch (_) {
        sendResponse({ success: false });
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
            chrome.tabs.sendMessage(tab.id, { type: 'FLUSH_PENDING_QG_EVENTS' }).catch(() => {});
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
            payload: message.payload || {}
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
});
