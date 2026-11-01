// Bridge entre a Extensão e a aplicação Web QG da PRF

(function() {
  // Marca que a extensão está instalada no navegador
  document.documentElement.setAttribute('data-qg-caveira-extension-installed', 'true');
  window.postMessage({ source: 'QG_CAVEIRA_EXTENSION', type: 'EXTENSION_DETECTED' }, '*');

  // Ouvir mensagens vindas do Background da extensão
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'QG_CAVEIRA_SYNC_UPDATE') {
      window.postMessage({
        source: 'QG_CAVEIRA_EXTENSION',
        type: 'SYNC_UPDATE',
        payload: message.payload
      }, '*');
    }
  });

  // Ouvir requisições da página React do QG
  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'QG_WEB_APP') {
      if (event.data.type === 'FETCH_CAVEIRA_DATA') {
        chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (response) => {
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'CAVEIRA_DATA_RESPONSE',
            payload: response
          }, '*');
        });
      }

      if (event.data.type === 'CLEAR_SESSION') {
        chrome.runtime.sendMessage({ type: 'CLEAR_CAVEIRA_SESSION' }, () => {
          window.postMessage({
            source: 'QG_CAVEIRA_EXTENSION',
            type: 'SESSION_CLEARED'
          }, '*');
        });
      }
    }
  });
})();
