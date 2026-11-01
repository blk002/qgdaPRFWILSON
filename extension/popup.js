// Popup Script — QG da PRF Rastreador Caveira

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';

function cleanQuestionsList(list) {
  if (!Array.isArray(list)) return [];
  const byId = new Map();
  const realContentSet = new Set();

  list.forEach(q => {
    if (q && q.content && q.subject && q.subject !== 'Geral') {
      realContentSet.add(q.content.slice(0, 80));
    }
  });

  list.forEach(q => {
    if (!q || !q.id) return;
    if (q.subject === 'Geral' && q.topic === 'Geral') {
      const snippet = (q.content || '').slice(0, 80);
      if (!snippet || realContentSet.has(snippet)) return;
    }
    if (!byId.has(q.id)) {
      byId.set(q.id, q);
    }
  });

  return Array.from(byId.values());
}

function renderPopupStats(questions, session) {
  let hits = Number(session?.hits) || 0;
  let errors = Number(session?.errors) || 0;
  let total = Number(session?.total) || 0;

  // Se existem questões salvas e a sessão não foi zerada manualmente, reflete o total real
  if (total === 0 && questions.length > 0 && !session?.wasExplicitlyReset) {
    hits = questions.filter(q => q.hit).length;
    errors = questions.length - hits;
    total = questions.length;
  }

  document.getElementById('stat-hits').textContent = hits;
  document.getElementById('stat-errors').textContent = errors;
  const net = hits - errors;
  const elNet = document.getElementById('stat-net');
  elNet.textContent = net > 0 ? `+${net}` : `${net}`;
  elNet.className = `stat-value ${net > 0 ? 'green' : net < 0 ? 'red' : 'gold'}`;

  document.getElementById('txt-total-saved').textContent = `${questions.length} salvas no total`;
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
    const rawQuestions = res[STORAGE_KEY] || [];
    const questions = cleanQuestionsList(rawQuestions);
    const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };

    if (questions.length !== rawQuestions.length) {
      chrome.storage.local.set({ [STORAGE_KEY]: questions });
    }

    renderPopupStats(questions, session);
  });

  // Atualização em tempo real caso o popup esteja aberto
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const questions = cleanQuestionsList(res[STORAGE_KEY] || []);
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
      const questions = cleanQuestionsList(res[STORAGE_KEY] || []);
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
    const resetSession = { hits: 0, errors: 0, total: 0, wasExplicitlyReset: true };
    chrome.storage.local.set({ [SESSION_KEY]: resetSession }, () => {
      chrome.runtime.sendMessage({ type: 'CLEAR_CAVEIRA_SESSION' }).catch(() => {});
      document.getElementById('stat-hits').textContent = '0';
      document.getElementById('stat-errors').textContent = '0';
      document.getElementById('stat-net').textContent = '0';
      document.getElementById('stat-net').className = 'stat-value gold';
    });
  });
});
