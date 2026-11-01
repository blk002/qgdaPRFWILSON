// Popup Script — QG da PRF Rastreador Caveira

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
    const questions = res[STORAGE_KEY] || [];
    const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };

    document.getElementById('stat-hits').textContent = session.hits;
    document.getElementById('stat-errors').textContent = session.errors;
    const net = session.hits - session.errors;
    const elNet = document.getElementById('stat-net');
    elNet.textContent = net > 0 ? `+${net}` : `${net}`;
    elNet.className = `stat-value ${net > 0 ? 'green' : net < 0 ? 'red' : 'gold'}`;

    document.getElementById('txt-total-saved').textContent = `${questions.length} salvas no total`;
  });

  // Botão Abrir QG da PRF
  document.getElementById('btn-open-qg').addEventListener('click', () => {
    const targetUrl = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';
    chrome.tabs.create({ url: targetUrl });
  });

  // Botão Copiar JSON
  document.getElementById('btn-copy-json').addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      const questions = res[STORAGE_KEY] || [];
      navigator.clipboard.writeText(JSON.stringify(questions, null, 2)).then(() => {
        const btn = document.getElementById('btn-copy-json');
        const orig = btn.innerHTML;
        btn.innerHTML = '<span>Copiado com Sucesso!</span> <span>✓</span>';
        setTimeout(() => { btn.innerHTML = orig; }, 1800);
      });
    });
  });

  // Botão Zerar Sessão
  document.getElementById('btn-reset-session').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_CAVEIRA_SESSION' }, () => {
      document.getElementById('stat-hits').textContent = '0';
      document.getElementById('stat-errors').textContent = '0';
      document.getElementById('stat-net').textContent = '0';
      document.getElementById('stat-net').className = 'stat-value gold';
    });
  });
});
