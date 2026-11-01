// Background Service Worker — QG da PRF Rastreador Caveira

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';

// Inicializar armazenamento
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
    if (!res[STORAGE_KEY]) {
      chrome.storage.local.set({ [STORAGE_KEY]: [] });
    }
    if (!res[SESSION_KEY]) {
      chrome.storage.local.set({ [SESSION_KEY]: { hits: 0, errors: 0, total: 0, wasExplicitlyReset: false } });
    }
  });
});

// Atualiza o badge do ícone da extensão sempre que a sessão mudar no storage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SESSION_KEY]) {
    const session = changes[SESSION_KEY].newValue || { hits: 0, errors: 0, total: 0 };
    const total = Number(session.total) || 0;
    const net = (Number(session.hits) || 0) - (Number(session.errors) || 0);
    if (total > 0) {
      chrome.action.setBadgeText({ text: `${total}` });
      chrome.action.setBadgeBackgroundColor({ color: net >= 0 ? '#10b981' : '#ef4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});

// Ouvir mensagens de content scripts ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE_ONLY') {
    const session = message.payload?.session || { hits: 0, errors: 0, total: 0 };
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
    chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
      sendResponse({
        questions: res[STORAGE_KEY] || [],
        session: res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 }
      });
    });
    return true;
  }

  if (message.type === 'CLEAR_CAVEIRA_SESSION') {
    chrome.storage.local.set({ [SESSION_KEY]: { hits: 0, errors: 0, total: 0, wasExplicitlyReset: true } }, () => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
    });
    return true;
  }
});
