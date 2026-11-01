// Bridge entre a Extensão e a aplicação Web QG da PRF (v3 Strict)

(function() {
  console.log('💀 [QG Bridge] Inicializado na aplicação web.');

  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';
  const SCHEMA_KEY = 'qg_caveira_schema_v3';

  // Marca que a extensão está instalada no navegador
  document.documentElement.setAttribute('data-qg-caveira-extension-installed', 'true');
  window.postMessage({ source: 'QG_CAVEIRA_EXTENSION', type: 'EXTENSION_DETECTED' }, '*');

  function sendStoredData() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, SCHEMA_KEY], (res) => {
        if (res[SCHEMA_KEY] !== 'v3_strict_clean') {
          const cleanSession = { total: 0, hits: 0, errors: 0 };
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: cleanSession,
            [SCHEMA_KEY]: 'v3_strict_clean'
          }, () => {
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'RESET_CORRUPTED_DATA'
            }, '*');
          });
          return;
        }

        const questions = res[STORAGE_KEY] || [];
        const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };
        window.postMessage({
          source: 'QG_CAVEIRA_EXTENSION',
          type: 'CAVEIRA_DATA_RESPONSE',
          payload: { questions, session }
        }, '*');
      });
    }
  }

  sendStoredData();
  setTimeout(sendStoredData, 800);

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
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
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'QG_WEB_APP') {
      if (event.data.type === 'FETCH_CAVEIRA_DATA') {
        sendStoredData();
      }

      if (event.data.type === 'CLEAR_SESSION') {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: { hits: 0, errors: 0, total: 0 }
          }, () => {
            window.postMessage({
              source: 'QG_CAVEIRA_EXTENSION',
              type: 'SESSION_CLEARED'
            }, '*');
          });
        }
      }
    }
  });
})();
