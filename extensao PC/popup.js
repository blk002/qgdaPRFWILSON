// Popup Script — QG da PRF Rastreador Caveira (v3 Strict)

const STORAGE_KEY = 'qg_caveira_questions';
const SESSION_KEY = 'qg_caveira_session';
const SCHEMA_KEY = 'qg_caveira_schema_v3';
const GOAL_KEY = 'qg_caveira_daily_goal';

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
    return { date: today, total: 0, hits: 0, errors: 0 };
  }
  return {
    date: today,
    total: Number(rawSession.total) || 0,
    hits: Number(rawSession.hits) || 0,
    errors: Number(rawSession.errors) || 0,
    ...(rawSession.wasExplicitlyReset ? { wasExplicitlyReset: true } : {})
  };
}

function renderGoal(session, dailyGoal) {
  const hits = Number(session?.hits) || 0;
  const errors = Number(session?.errors) || 0;
  const current = Number(session?.total) || (hits + errors);
  const goal = Number(dailyGoal) || 50;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  const txtRatio = document.getElementById('txt-goal-ratio');
  const barProgress = document.getElementById('bar-goal-progress');
  const txtStatus = document.getElementById('txt-goal-status');
  const inputGoal = document.getElementById('input-daily-goal');

  if (inputGoal && document.activeElement !== inputGoal) {
    inputGoal.value = goal;
  }

  if (txtRatio) {
    txtRatio.textContent = `${current} / ${goal} (${pct}%)`;
    txtRatio.style.color = current >= goal ? '#10b981' : '#f4f4f5';
  }

  if (barProgress) {
    barProgress.style.width = `${pct}%`;
    barProgress.style.background = current >= goal ? '#10b981' : 'linear-gradient(90deg, #2563eb, #10b981)';
  }

  if (txtStatus) {
    if (current >= goal) {
      txtStatus.innerHTML = '<span style="color:#10b981; font-weight:800;">🏆 META CUMPRIDA! Missão dada é cumprida!</span>';
    } else {
      const remaining = goal - current;
      txtStatus.textContent = `Faltam ${remaining} questão(ões) para a meta! 💪`;
      txtStatus.style.color = '#a1a1aa';
    }
  }
}

function renderPopupStats(questions, session, dailyGoal = 50) {
  const hits = Number(session?.hits) || 0;
  const errors = Number(session?.errors) || 0;
  const total = hits + errors;
  const rate = total > 0 ? Math.round((hits / total) * 100) : 0;

  document.getElementById('stat-hits').textContent = hits;
  document.getElementById('stat-errors').textContent = errors;
  const elNet = document.getElementById('stat-net');
  elNet.textContent = `${rate}%`;
  elNet.className = `stat-value ${rate >= 70 ? 'green' : rate >= 50 ? 'gold' : total === 0 ? 'gold' : 'red'}`;

  document.getElementById('txt-total-saved').textContent = `${questions.length} salvas no total`;

  renderGoal(session, dailyGoal);
}

document.addEventListener('DOMContentLoaded', () => {
  const versionEl = document.getElementById('ext-version');
  if (versionEl && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
  }

  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, SCHEMA_KEY, GOAL_KEY], (res) => {
    const today = getTodaySessionDate();
    const dailyGoal = Number(res[GOAL_KEY]) || 50;

    if (res[SCHEMA_KEY] !== 'v3_strict_clean') {
      const cleanSession = { date: today, total: 0, hits: 0, errors: 0 };
      chrome.storage.local.set({
        [STORAGE_KEY]: [],
        [SESSION_KEY]: cleanSession,
        [SCHEMA_KEY]: 'v3_strict_clean',
        [GOAL_KEY]: dailyGoal
      }, () => {
        renderPopupStats([], cleanSession, dailyGoal);
      });
      return;
    }

    const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
    const session = normalizeSession(res[SESSION_KEY]);
    if (res[SESSION_KEY]?.date !== session.date) {
      chrome.storage.local.set({ [SESSION_KEY]: session });
    }
    renderPopupStats(questions, session, dailyGoal);
  });

  // Atualização em tempo real caso o popup esteja aberto
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (res) => {
        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        const session = normalizeSession(res[SESSION_KEY]);
        const dailyGoal = Number(res[GOAL_KEY]) || 50;
        renderPopupStats(questions, session, dailyGoal);
      });
    }
  });

  // Controle de edição da Meta Diária
  const btnEditGoal = document.getElementById('btn-edit-goal');
  const boxEditGoal = document.getElementById('box-edit-goal');
  const btnSaveGoal = document.getElementById('btn-save-goal');
  const inputDailyGoal = document.getElementById('input-daily-goal');

  if (btnEditGoal && boxEditGoal) {
    btnEditGoal.addEventListener('click', () => {
      const isHidden = boxEditGoal.style.display === 'none' || !boxEditGoal.style.display;
      boxEditGoal.style.display = isHidden ? 'flex' : 'none';
      if (isHidden && inputDailyGoal) inputDailyGoal.focus();
    });
  }

  if (btnSaveGoal && inputDailyGoal) {
    btnSaveGoal.addEventListener('click', () => {
      const newGoal = Math.max(5, Math.min(1000, Number(inputDailyGoal.value) || 50));
      chrome.storage.local.set({ [GOAL_KEY]: newGoal }, () => {
        if (boxEditGoal) boxEditGoal.style.display = 'none';
        chrome.storage.local.get([SESSION_KEY], (res) => {
          const session = normalizeSession(res[SESSION_KEY]);
          renderGoal(session, newGoal);
        });
      });
    });
  }

  // Botão Abrir QG da PRF
  document.getElementById('btn-open-qg').addEventListener('click', async () => {
    const targetUrl = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';
    try {
      if (chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({
          url: ['https://blk002.github.io/*', 'http://localhost:*/*', 'http://127.0.0.1:*/*']
        });
        if (tabs && tabs.length > 0 && tabs[0].id) {
          await chrome.tabs.update(tabs[0].id, { active: true, url: targetUrl });
          if (tabs[0].windowId && chrome.windows) {
            chrome.windows.update(tabs[0].windowId, { focused: true });
          }
          return;
        }
      }
    } catch (_) {}
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
    const today = getTodaySessionDate();
    const resetSession = { date: today, hits: 0, errors: 0, total: 0 };
    chrome.storage.local.set({ [SESSION_KEY]: resetSession }, () => {
      chrome.runtime.sendMessage({ type: 'CLEAR_CAVEIRA_SESSION' }).catch(() => {});
      document.getElementById('stat-hits').textContent = '0';
      document.getElementById('stat-errors').textContent = '0';
      document.getElementById('stat-net').textContent = '0%';
      document.getElementById('stat-net').className = 'stat-value gold';
      chrome.storage.local.get([GOAL_KEY], (res) => {
        renderGoal(resetSession, Number(res[GOAL_KEY]) || 50);
      });
    });
  });
});
