// Bridge entre a Extensão e a aplicação Web QG da PRF (v3 Strict)

(function() {
  console.log('💀 [QG Bridge] Inicializado na aplicação web.');

  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';

  // Marca que a extensão está instalada no navegador
  document.documentElement.setAttribute('data-qg-caveira-extension-installed', 'true');
  window.postMessage({ source: 'QG_CAVEIRA_EXTENSION', type: 'EXTENSION_DETECTED' }, '*');

  function isExtensionContextValid() {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local);
    } catch (_) {
      return false;
    }
  }

  // Limpa cache de Service Worker antigo (pré-v50) que impedia o site de carregar os novos deploys
  if ('caches' in window) {
    caches.keys().then((names) => {
      const staleCaches = names.filter(n => n.startsWith('qg-prf-cache-') && n !== 'qg-prf-cache-v50');
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

  function sendStoredData() {
    if (!isExtensionContextValid()) return;
    try {
      // Pede ao background para varrer abas abertas do Caveira e retornar a lista atualizada
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (response) => {
          if (!chrome.runtime.lastError && response && Array.isArray(response.questions)) {
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'CAVEIRA_DATA_RESPONSE',
              payload: {
                questions: response.questions,
                session: response.session || { hits: 0, errors: 0, total: 0 }
              }
            }, '*');
            return;
          }
        });
      }

      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        if (chrome.runtime.lastError) return;
        const questions = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        const session = res?.[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };
        window.postMessage({
          source: 'QG_CAVEIRA_EXTENSION',
          type: 'CAVEIRA_DATA_RESPONSE',
          payload: { questions, session }
        }, '*');
      });
    } catch (_) {}
  }

  // Dispara em múltiplos intervalos no carregamento (para garantir entrega após login/hidratação da nuvem)
  sendStoredData();
  setTimeout(sendStoredData, 800);
  setTimeout(sendStoredData, 2000);
  setTimeout(sendStoredData, 4000);

  // Sincroniza sempre que o usuário focar/voltar para a aba do QG da PRF
  window.addEventListener('focus', sendStoredData);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      sendStoredData();
    }
  });

  if (isExtensionContextValid() && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[STORAGE_KEY]) {
          const newQuestions = changes[STORAGE_KEY].newValue || [];
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'SYNC_UPDATE',
            payload: { questions: newQuestions }
          }, '*');
        }
      });
    } catch (_) {}
  }

  if (isExtensionContextValid() && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.type === 'PUSH_CAVEIRA_SYNC' && msg.payload) {
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'SYNC_UPDATE',
            payload: { questions: msg.payload.questions || [] }
          }, '*');
        }
      });
    } catch (_) {}
  }

  window.addEventListener('message', (event) => {
    if (!isExtensionContextValid()) return;
    if (event.data && event.data.source === 'QG_WEB_APP') {
      if (event.data.type === 'FETCH_CAVEIRA_DATA') {
        sendStoredData();
      }

      if (event.data.type === 'CLEAR_SESSION') {
        try {
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: { hits: 0, errors: 0, total: 0 }
          }, () => {
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'SESSION_CLEARED'
            }, '*');
          });
        } catch (_) {}
      }
    }
  });
})();
