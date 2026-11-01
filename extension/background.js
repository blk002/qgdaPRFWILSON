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
      chrome.storage.local.set({ [SESSION_KEY]: { hits: 0, errors: 0, total: 0 } });
    }
  });
});

// Broadcast para abas do QG da PRF
async function broadcastToQGTabs(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('localhost') || tab.url.includes('github.io/qgdaPRFWILSON'))) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Ignora abas que não estão prontas
        });
      }
    }
  } catch (e) {
    console.error('Erro ao notificar abas do QG:', e);
  }
}

// Ouvir mensagens de content scripts ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAVEIRA_QUESTION_ANSWERED') {
    const question = message.payload;

    chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
      const questions = res[STORAGE_KEY] || [];
      const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };

      // Evitar duplicatas do mesmo ID na mesma sessão recente (em até 30s)
      const existingIdx = questions.findIndex(q => q.id === question.id && Math.abs(new Date(q.timestamp) - new Date(question.timestamp)) < 30000);
      if (existingIdx >= 0) {
        questions[existingIdx] = question;
      } else {
        questions.unshift(question);
        session.total += 1;
        if (question.hit) session.hits += 1;
        else session.errors += 1;
      }

      // Atualiza badge do ícone com saldo líquido ou total
      const net = session.hits - session.errors;
      const badgeText = `${session.total}`;
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: net >= 0 ? '#10b981' : '#ef4444' });

      chrome.storage.local.set({
        [STORAGE_KEY]: questions,
        [SESSION_KEY]: session
      }, () => {
        // Envia notificação para qualquer aba aberta do QG da PRF
        broadcastToQGTabs({
          type: 'QG_CAVEIRA_SYNC_UPDATE',
          payload: {
            newQuestion: question,
            questions: questions.slice(0, 500),
            session
          }
        });

        sendResponse({ success: true, count: questions.length, session });
      });
    });

    return true; // resposta assíncrona
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
    chrome.storage.local.set({ [SESSION_KEY]: { hits: 0, errors: 0, total: 0 } }, () => {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
    });
    return true;
  }
});
