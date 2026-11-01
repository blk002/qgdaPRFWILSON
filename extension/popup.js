// Popup Script — QG da PRF Rastreador Caveira (v3 Strict)

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';
const SCHEMA_KEY = 'qg_caveira_schema_v3';

function renderPopupStats(questions, session) {
  const hits = Number(session?.hits) || 0;
  const errors = Number(session?.errors) || 0;

  document.getElementById('stat-hits').textContent = hits;
  document.getElementById('stat-errors').textContent = errors;
  const net = hits - errors;
  const elNet = document.getElementById('stat-net');
  elNet.textContent = net > 0 ? `+${net}` : `${net}`;
  elNet.className = `stat-value ${net > 0 ? 'green' : net < 0 ? 'red' : 'gold'}`;

  document.getElementById('txt-total-saved').textContent = `${questions.length} salvas no total`;
}

document.addEventListener('DOMContentLoaded', () => {
  const versionEl = document.getElementById('ext-version');
  if (versionEl && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
  }

  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, SCHEMA_KEY], (res) => {
    if (res[SCHEMA_KEY] !== 'v3_strict_clean') {
      const cleanSession = { total: 0, hits: 0, errors: 0 };
      chrome.storage.local.set({
        [STORAGE_KEY]: [],
        [SESSION_KEY]: cleanSession,
        [SCHEMA_KEY]: 'v3_strict_clean'
      }, () => {
        renderPopupStats([], cleanSession);
      });
      return;
    }

    const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
    const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };
    renderPopupStats(questions, session);
  });

  // Atualização em tempo real caso o popup esteja aberto
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };
        renderPopupStats(questions, session);
      });
    }
  });

  // Botão Abrir QG da PRF
  document.getElementById('btn-open-qg').addEventListener('click', () => {
    const targetUrl = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';
    chrome.tabs.create({ url: targetUrl });
  });

  // Botão Copiar JSON
  document.getElementById('btn-copy-json').addEventListener('click', () => {
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
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
    const resetSession = { hits: 0, errors: 0, total: 0 };
    chrome.storage.local.set({ [SESSION_KEY]: resetSession }, () => {
      chrome.runtime.sendMessage({ type: 'CLEAR_CAVEIRA_SESSION' }).catch(() => {});
      document.getElementById('stat-hits').textContent = '0';
      document.getElementById('stat-errors').textContent = '0';
      document.getElementById('stat-net').textContent = '0';
      document.getElementById('stat-net').className = 'stat-value gold';
    });
  });
});
