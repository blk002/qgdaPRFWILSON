// Bridge entre a Extensão e a aplicação Web QG da PRF

(function() {
  console.log('💀 [QG Bridge] Inicializado na aplicação web.');

  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';

  // Marca que a extensão está instalada no navegador
  document.documentElement.setAttribute('data-qg-caveira-extension-installed', 'true');
  window.postMessage({ source: 'QG_CAVEIRA_EXTENSION', type: 'EXTENSION_DETECTED' }, '*');

  // Envio imediato das questões salvas na inicialização
  function sendStoredData() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const questions = res[STORAGE_KEY] || [];
        const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };
        console.log(`💀 [QG Bridge] Transmitindo ${questions.length} questões armazenadas para o QG.`);
        window.postMessage({
          source: 'QG_CAVEIRA_EXTENSION',
          type: 'CAVEIRA_DATA_RESPONSE',
          payload: { questions, session }
        }, '*');
      });
    }
  }

  // Disparo inicial
  sendStoredData();
  setTimeout(sendStoredData, 800);
  setTimeout(sendStoredData, 2000);

  // Escutar alterações em tempo real no chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY]) {
        const newQuestions = changes[STORAGE_KEY].newValue || [];
        console.log(`💀 [QG Bridge] Nova sincronização em tempo real: ${newQuestions.length} questões.`);
        window.postMessage({
          source: 'QG_CAVEIRA_EXTENSION',
          type: 'SYNC_UPDATE',
          payload: { questions: newQuestions }
        }, '*');
      }
    });
  }

  // Ouvir mensagens vindas do Background da extensão
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'QG_CAVEIRA_SYNC_UPDATE') {
        window.postMessage({
          source: 'QG_CAVEIRA_EXTENSION',
          type: 'SYNC_UPDATE',
          payload: message.payload
        }, '*');
      }
    });
  }

  // Ouvir requisições vindas da aplicação React do QG
  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'QG_WEB_APP') {
      if (event.data.type === 'FETCH_CAVEIRA_DATA') {
        sendStoredData();
      }

      if (event.data.type === 'CLEAR_SESSION') {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [SESSION_KEY]: { hits: 0, errors: 0, total: 0 } }, () => {
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
