// Background Service Worker — QG da PRF Rastreador Caveira

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';

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

// Reinjetar scripts automaticamente em abas já abertas ao instalar/atualizar a extensão
async function reinjectOpenTabs() {
  if (!chrome.scripting || !chrome.tabs) return;
  try {
    const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
    for (const tab of qgTabs) {
      if (tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['qg_bridge.js']
        }).catch(() => {});
      }
    }

    const caveiraTabs = await chrome.tabs.query({ url: CAVEIRA_URL_PATTERNS });
    for (const tab of caveiraTabs) {
      if (tab.id) {
        chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content.css']
        }).catch(() => {});
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

// Notifica todas as abas abertas do QG da PRF imediatamente quando novas questões são salvas
async function broadcastToQgTabs(questions, session) {
  if (!chrome.tabs) return;
  try {
    const qgTabs = await chrome.tabs.query({ url: QG_URL_PATTERNS });
    for (const tab of qgTabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'PUSH_CAVEIRA_SYNC',
          payload: { questions, session }
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

    if (changes[STORAGE_KEY]) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const session = normalizeSession(res[SESSION_KEY]);
        broadcastToQgTabs(res[STORAGE_KEY] || [], session);
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
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      broadcastToQgTabs(res[STORAGE_KEY] || [], session);
    });
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
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const session = normalizeSession(res[SESSION_KEY]);
        if (res[SESSION_KEY]?.date !== session.date) {
          chrome.storage.local.set({ [SESSION_KEY]: session });
        }
        sendResponse({
          questions: res[STORAGE_KEY] || [],
          session
        });
      });
    }, 150);
    return true;
  }

  if (message.type === 'CLEAR_CAVEIRA_SESSION') {
    const today = getTodaySessionDate();
    const cleanSession = { date: today, hits: 0, errors: 0, total: 0, wasExplicitlyReset: true };
    chrome.storage.local.set({ [SESSION_KEY]: cleanSession }, () => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
    });
    return true;
  }
});
