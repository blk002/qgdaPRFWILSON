// Background Service Worker — QG da PRF Rastreador Caveira

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';
const ACTIVE_USER_KEY = 'qg_active_user_id';
const USER_BUCKETS_KEY = 'qg_caveira_user_buckets';
const GOAL_KEY = 'qg_caveira_daily_goal';

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
            files: ['treeMatcher.js', 'caveiraResolver.js', 'content.js']
          });
        } catch (_) {}
      }
    }
  } catch (_) {}
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

// Inicializar armazenamento
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
    if (!res[STORAGE_KEY]) {
      chrome.storage.local.set({ [STORAGE_KEY]: [] });
    }
    const session = normalizeSession(res[SESSION_KEY]);
    chrome.storage.local.set({ [SESSION_KEY]: session });
  });
  reinjectOpenTabs();
});

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
  }
});

// Ouvir mensagens de content scripts ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
