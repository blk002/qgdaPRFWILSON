// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (v3.1 — Detecção Inteligente por Scroll & Viewport)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira v1.2.22 ativo em:', window.location.href);

  // Encerra eventual instância anterior do content script (quando a extensão é recarregada)
  try {
    window.dispatchEvent(new CustomEvent('qg-caveira-teardown'));
    const oldHud = document.getElementById('qg-caveira-hud');
    if (oldHud) oldHud.remove();
  } catch (_) {}

  const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';
  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';
  const SCHEMA_KEY = 'qg_caveira_schema_v3';
  const GOAL_KEY = 'qg_caveira_daily_goal';
  const ACTIVE_USER_KEY = 'qg_active_user_id';
  const ACTIVE_USER_LABEL_KEY = 'qg_active_user_label';
  const PENDING_FILTER_KEY = 'qg_pending_caveira_filter';
  const COURSE_INDEX_CACHE_KEY = 'qg_caveira_course_index_cache';
  const MAX_BUCKET_QUESTIONS = 1500;
  let cachedDailyGoal = 50;
  let cachedActiveUserId = null;
  let cachedActiveUserLabel = '';
  let activePracticeFilter = null;
  let isApplyingFilter = false;
  let filterStatusMessage = '';
  let lastCapturedCourseSignature = '';
  let currentCourseIndexStatus = null;
  const peekedCourseUrls = new Set();

  function isCoursePage() {
    try {
      return window.location.pathname.includes('/courses');
    } catch (_) {
      return false;
    }
  }

  function compactQuestionsForStorage(questions, maxItems = MAX_BUCKET_QUESTIONS) {
    if (!Array.isArray(questions)) return [];
    return questions.slice(0, maxItems).map((q, idx) => {
      if (!q || idx < 150) return q;
      const compacted = { ...q };
      if (typeof compacted.content === 'string' && compacted.content.length > 400) {
        compacted.content = compacted.content.slice(0, 400);
      }
      if (typeof compacted.teacherComment === 'string' && compacted.teacherComment.length > 500) {
        compacted.teacherComment = compacted.teacherComment.slice(0, 500);
      }
      if (Array.isArray(compacted.alternatives) && compacted.alternatives.length > 6) {
        compacted.alternatives = compacted.alternatives.slice(0, 6);
      }
      return compacted;
    });
  }

  let isDestroyed = false;
  let isStorageLoaded = false;
  let currentQuestionId = null;
  let timerSeconds = 0;
  let isTimerRunning = false;
  let timerInterval = null;
  let scanIntervalId = null;
  let domObserver = null;
  let promptDismissTimer = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;
  let scanDebounceTimer = null;
  let scrollRafId = null;

  // Cache em memória da lista de questões para evitar condição de corrida em escritas simultâneas
  let questionsCache = [];

  // Armazena o tempo individual de cada questão (permite rolar entre questões sem perder a contagem de cada uma)
  const questionTimers = new Map();
  // Rastreia questões já contabilizadas nesta sessão da página
  const processedInSession = new Set();
  // Rastreia questões nas quais o usuário REALMENTE clicou em "Responder"
  const pendingAnswerQIds = new Set();
  // Cache de questões já salvas no storage local do Chrome
  const savedQuestionIds = new Set();
  // Questões já salvas anteriormente que ainda não possuem o texto das alternativas
  const savedQuestionsMissingAlts = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    date: getTodaySessionDate(),
    total: 0,
    hits: 0,
    errors: 0
  };

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
      return {
        date: today,
        total: 0,
        hits: 0,
        errors: 0
      };
    }
    return {
      date: today,
      total: Number(rawSession.total) || 0,
      hits: Number(rawSession.hits) || 0,
      errors: Number(rawSession.errors) || 0
    };
  }

  function checkDailySessionReset() {
    const today = getTodaySessionDate();
    if (sessionStats.date !== today) {
      sessionStats = { date: today, total: 0, hits: 0, errors: 0 };
      if (isExtensionContextValid()) {
        chrome.storage.local.set({ [SESSION_KEY]: sessionStats });
      }
      updateHudStats();
    }
  }

  function isExtensionContextValid() {
    try {
      return !isDestroyed && Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local);
    } catch (_) {
      return false;
    }
  }

  let handleScrollUpdateRef = null;
  let handlePopstateHashRef = null;
  let handleDocumentClickRef = null;
  let handleDocumentKeydownRef = null;

  function teardownInstance() {
    isDestroyed = true;
    if (timerInterval) clearInterval(timerInterval);
    if (scanIntervalId) clearInterval(scanIntervalId);
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    if (promptDismissTimer) clearTimeout(promptDismissTimer);
    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = null;
    }
    if (domObserver) domObserver.disconnect();
    if (handleScrollUpdateRef) {
      window.removeEventListener('scroll', handleScrollUpdateRef, { capture: true });
      window.removeEventListener('wheel', handleScrollUpdateRef);
    }
    if (handlePopstateHashRef) {
      window.removeEventListener('popstate', handlePopstateHashRef);
      window.removeEventListener('hashchange', handlePopstateHashRef);
    }
    if (handleDocumentClickRef) {
      document.removeEventListener('click', handleDocumentClickRef, true);
    }
    if (handleDocumentKeydownRef) {
      document.removeEventListener('keydown', handleDocumentKeydownRef);
    }
  }

  window.addEventListener('qg-caveira-teardown', teardownInstance, { once: true });

  function loadInitialState() {
    if (!isExtensionContextValid()) return;
    try {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, SCHEMA_KEY, GOAL_KEY, ACTIVE_USER_KEY, ACTIVE_USER_LABEL_KEY, PENDING_FILTER_KEY], (res) => {
        if (chrome.runtime.lastError || isDestroyed) return;
        cachedActiveUserId = res?.[ACTIVE_USER_KEY] || null;
        cachedActiveUserLabel = res?.[ACTIVE_USER_LABEL_KEY] || '';
        updateHudUser();
        const pendingFilter = res?.[PENDING_FILTER_KEY];
        if (!isCoursePage() && pendingFilter && (pendingFilter.topic || (Array.isArray(pendingFilter.lessons) && pendingFilter.lessons.length > 0)) && (Date.now() - (pendingFilter.createdAt || 0)) < 180000) {
          setTimeout(() => applyCaveiraPracticeFilter(pendingFilter), 900);
        }
        if (res && res[GOAL_KEY]) {
          cachedDailyGoal = Number(res[GOAL_KEY]) || 50;
        }
        const today = getTodaySessionDate();
        if (res[SCHEMA_KEY] !== 'v3_strict_clean') {
          const cleanSession = { date: today, total: 0, hits: 0, errors: 0 };
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: cleanSession,
            [SCHEMA_KEY]: 'v3_strict_clean'
          });
          questionsCache = [];
          sessionStats = cleanSession;
          isStorageLoaded = true;
          updateHudStats();
          scanCards();
          return;
        }

        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        questionsCache = [...questions];
        questions.forEach(q => {
          if (q && q.id) {
            savedQuestionIds.add(q.id);
            if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every(a => !a.text || a.text === a.letter)) {
              savedQuestionsMissingAlts.add(q.id);
            }
          }
        });

        const rawSession = res[SESSION_KEY];
        sessionStats = normalizeSession(rawSession);
        if (!rawSession || rawSession.date !== today) {
          chrome.storage.local.set({ [SESSION_KEY]: sessionStats });
        }
        isStorageLoaded = true;
        updateHudStats();
        scanCards();
      });
    } catch (_) {}
  }

  loadInitialState();

  if (isExtensionContextValid() && chrome.storage.onChanged) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (!isExtensionContextValid()) {
          teardownInstance();
          return;
        }
        if (area === 'local') {
          if (changes[STORAGE_KEY]) {
            const updatedList = Array.isArray(changes[STORAGE_KEY].newValue) ? changes[STORAGE_KEY].newValue : [];
            questionsCache = [...updatedList];
            savedQuestionIds.clear();
            savedQuestionsMissingAlts.clear();
            updatedList.forEach(q => {
              if (q && q.id) {
                savedQuestionIds.add(q.id);
                if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every(a => !a.text || a.text === a.letter)) {
                  savedQuestionsMissingAlts.add(q.id);
                }
              }
            });
            for (const pId of Array.from(processedInSession)) {
              if (!savedQuestionIds.has(pId)) {
                processedInSession.delete(pId);
              }
            }
            if (currentQuestionId) {
              const activeCard = getQuestionCards().find(c => extractQuestionId(c) === currentQuestionId);
              renderQuestionHistory(currentQuestionId, activeCard ? isCardAnswered(activeCard) : false);
            }
          }
          if (changes[SESSION_KEY]) {
            sessionStats = normalizeSession(changes[SESSION_KEY].newValue);
            updateHudStats();
          }
          if (changes[ACTIVE_USER_KEY]) {
            cachedActiveUserId = changes[ACTIVE_USER_KEY].newValue || null;
            updateHudUser();
          }
          if (changes[ACTIVE_USER_LABEL_KEY]) {
            cachedActiveUserLabel = changes[ACTIVE_USER_LABEL_KEY].newValue || '';
            updateHudUser();
          }
          if (changes[GOAL_KEY]) {
            cachedDailyGoal = Number(changes[GOAL_KEY].newValue) || 50;
            updateHudGoal();
          }
        }
      });
    } catch (_) {}
  }

  if (isExtensionContextValid() && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.type === 'FORCE_SCAN_NOW') {
          scanCards();
          sendResponse({ ok: true });
        }
        if (msg && msg.type === 'APPLY_CAVEIRA_FILTER' && msg.payload) {
          applyCaveiraPracticeFilter(msg.payload);
          sendResponse({ ok: true });
        }
      });
    } catch (_) {}
  }

  // --- 1. CRIAÇÃO DO HUD FLUTUANTE ---
  function createHud() {
    if (document.getElementById('qg-caveira-hud')) return;

    const extVersion = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest)
      ? chrome.runtime.getManifest().version
      : '1.0.1';

    const hud = document.createElement('div');
    hud.id = 'qg-caveira-hud';
    hud.innerHTML = `
      <div class="qg-hud-header">
        <div class="qg-hud-title">
          <span class="qg-hud-pulse"></span>
          <span>💀 QG PRF • CAVEIRA <small style="opacity:0.65;font-size:9px;margin-left:3px;">v${extVersion}</small></span>
        </div>
        <div class="qg-hud-controls">
          <button class="qg-hud-btn-icon" id="qg-btn-min" title="Minimizar / Expandir">_</button>
        </div>
      </div>

      <div id="qg-hud-user-bar" style="display:flex;align-items:center;justify-content:space-between;padding:5px 14px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;font-weight:700;color:#94a3b8;">
        <span id="qg-hud-user-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🟡 Conecte sua conta no QG</span>
      </div>

      <div id="qg-hud-filter-banner" style="display:none;align-items:center;justify-content:space-between;gap:6px;padding:6px 14px;background:rgba(37,99,235,0.14);border-bottom:1px solid rgba(59,130,246,0.3);font-size:10px;font-weight:700;color:#bfdbfe;">
        <span id="qg-hud-filter-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">🎯 Filtro</span>
        <button type="button" id="qg-btn-refilter" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:2px 6px;font-size:9px;font-weight:800;cursor:pointer;flex-shrink:0;" title="Aplicar filtro novamente">🔄</button>
        <button type="button" id="qg-btn-close-filter" style="background:none;color:#94a3b8;border:none;font-size:11px;cursor:pointer;padding:0 2px;flex-shrink:0;" title="Fechar aviso">✕</button>
      </div>

      <div class="qg-hud-body">
        <div class="qg-hud-stats-grid">
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Feitas</span>
            <span class="qg-hud-stat-value blue" id="qg-stat-total">${sessionStats.total}</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Certas</span>
            <span class="qg-hud-stat-value green" id="qg-stat-hits">${sessionStats.hits}</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Erradas</span>
            <span class="qg-hud-stat-value red" id="qg-stat-errors">${sessionStats.errors}</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Acerto</span>
            <span class="qg-hud-stat-value gold" id="qg-stat-net">${sessionStats.total > 0 ? Math.round((sessionStats.hits / sessionStats.total) * 100) : 0}%</span>
          </div>
        </div>

        <div class="qg-hud-goal-box" style="margin-top: 7px; margin-bottom: 7px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 5px 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 3px;">
            <span style="color: #94a3b8; display: flex; align-items: center; gap: 3px;">🎯 <span>Meta Diária</span></span>
            <span id="qg-hud-goal-ratio" style="color: #38bdf8;">${sessionStats.total} / ${cachedDailyGoal} (${Math.min(100, Math.round((sessionStats.total / cachedDailyGoal) * 100))}%)</span>
          </div>
          <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
            <div id="qg-hud-goal-bar" style="width: ${Math.min(100, Math.round((sessionStats.total / cachedDailyGoal) * 100))}%; height: 100%; background: linear-gradient(90deg, #0284c7, #10b981); border-radius: 999px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div class="qg-hud-current">
          <span id="qg-current-q-id">Aguardando questão...</span>
          <span class="qg-hud-timer" id="qg-timer">00:00</span>
        </div>

        <div id="qg-hud-history-box" style="display: none;"></div>
      </div>

      <div class="qg-hud-prompt" id="qg-prompt-box" style="display: none;">
        <div class="qg-prompt-title">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span id="qg-prompt-status-badge" class="qg-prompt-badge hit">ACERTO</span>
            <span>Autoavaliação Tática</span>
          </div>
          <button type="button" id="qg-prompt-close" style="background: none; border: none; color: #94a3b8; font-size: 13px; cursor: pointer; padding: 2px 6px; border-radius: 4px;">✕</button>
        </div>

        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 700;">CONFIANÇA (Dúvida/Chute vai p/ FSRS):</div>
        <div class="qg-prompt-buttons">
          <button class="qg-btn-tag" data-confidence="sabia">🎯 Sabia</button>
          <button class="qg-btn-tag" data-confidence="duvida" title="Envia para a fila de Revisão FSRS mesmo acertando">🤔 Dúvida</button>
          <button class="qg-btn-tag" data-confidence="chute" title="Envia para a fila de Revisão FSRS mesmo acertando">🎲 Chute</button>
          <button class="qg-btn-tag" id="qg-btn-priority" data-priority="true" title="Marcar para revisão urgente no FSRS do QG">🔥 Prioridade</button>
        </div>

        <div id="qg-error-reasons" style="display: none;">
          <div style="font-size: 10px; color: #ef4444; margin-bottom: 4px; font-weight: 700;">MOTIVO DO ERRO:</div>
          <div class="qg-prompt-buttons">
            <button class="qg-btn-tag" data-reason="conteudo">📚 Teoria</button>
            <button class="qg-btn-tag" data-reason="atencao">⚠️ Atenção</button>
            <button class="qg-btn-tag" data-reason="interpretacao">🔍 Enunciado</button>
          </div>
        </div>
      </div>

      <div class="qg-hud-footer">
        <a href="${QG_WEB_URL}" target="_blank" class="qg-btn-qg-link" id="qg-open-link">
          <span>Abrir Diagnóstico QG</span>
          <span>→</span>
        </a>
      </div>
    `;

    document.body.appendChild(hud);
    updateHudUser();
    updateHudStats();
    renderFilterBanner();

    hud.querySelector('#qg-btn-refilter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activePracticeFilter) applyCaveiraPracticeFilter(activePracticeFilter);
    });

    hud.querySelector('#qg-btn-close-filter')?.addEventListener('click', (e) => {
      e.stopPropagation();
      activePracticeFilter = null;
      filterStatusMessage = '';
      renderFilterBanner('');
    });

    const btnMin = hud.querySelector('#qg-btn-min');
    btnMin.addEventListener('click', (e) => {
      e.stopPropagation();
      hud.classList.toggle('minimized');
      btnMin.textContent = hud.classList.contains('minimized') ? '□' : '_';
    });

    hud.addEventListener('click', () => {
      if (hud.classList.contains('minimized')) {
        hud.classList.remove('minimized');
        btnMin.textContent = '_';
      }
    });

    hud.querySelector('#qg-prompt-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPrompt();
    });

    hud.querySelectorAll('[data-confidence]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.querySelectorAll('[data-confidence]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          const conf = btn.dataset.confidence;
          activeQuestionData.confidence = conf;
          activeQuestionData.fsrsRequested = (conf === 'chute' || conf === 'duvida');
          saveQuestion(activeQuestionData, true);
          const badge = document.getElementById('qg-prompt-status-badge');
          if (badge && activeQuestionData.hit && (conf === 'chute' || conf === 'duvida')) {
            badge.textContent = '🃏 +FSRS AGENDADO';
          }
          if (activeQuestionData.hit) {
            setTimeout(dismissPrompt, 650);
          }
        }
      });
    });

    hud.querySelector('#qg-btn-priority')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const isNowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', isNowActive);
      if (activeQuestionData) {
        activeQuestionData.priorityReview = isNowActive;
        if (isNowActive) activeQuestionData.fsrsRequested = true;
        saveQuestion(activeQuestionData, true);
        const badge = document.getElementById('qg-prompt-status-badge');
        if (badge && isNowActive) {
          badge.textContent = '🔥 REVISÃO PRIORITÁRIA';
        }
      }
    });

    hud.querySelectorAll('[data-reason]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.querySelectorAll('[data-reason]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          activeQuestionData.errorReason = btn.dataset.reason;
          saveQuestion(activeQuestionData, true);
          setTimeout(dismissPrompt, 500);
        }
      });
    });

    startTimerInterval();
  }

  // --- 2. CRONÔMETRO POR QUESTÃO ---
  function normalizeFilterText(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function renderFilterBanner(customText = '') {
    const banner = document.getElementById('qg-hud-filter-banner');
    const textEl = document.getElementById('qg-hud-filter-text');
    if (!banner || !textEl) return;
    if (customText !== undefined && customText !== null && customText !== '') {
      filterStatusMessage = customText;
    }
    if (activePracticeFilter && (activePracticeFilter.topic || activePracticeFilter.subject)) {
      const baseLabel = [activePracticeFilter.subject, activePracticeFilter.topic].filter(Boolean).join(' • ');
      const displayLabel = filterStatusMessage || `🎯 ${baseLabel}`;
      textEl.textContent = displayLabel;
      textEl.title = baseLabel;
      banner.style.display = 'flex';
    } else {
      filterStatusMessage = '';
      banner.style.display = 'none';
    }
  }

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || '1') > 0;
  }

  function setNativeInputValue(input, value) {
    if (!input) return;
    const proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
    const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
    if (descriptor && typeof descriptor.set === 'function') {
      descriptor.set.call(input, value);
    } else {
      input.value = value;
    }
    try {
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
    } catch (_) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  function sleepMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function clickElementRealistically(el) {
    if (!el) return;
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch (_) {}
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + Math.min(rect.width / 2, 16);
    const clientY = rect.top + rect.height / 2;
    const evtInit = { bubbles: true, cancelable: true, view: window, clientX, clientY };
    try { el.dispatchEvent(new PointerEvent('pointerdown', evtInit)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('mousedown', evtInit)); } catch (_) {}
    try { el.dispatchEvent(new MouseEvent('mouseup', evtInit)); } catch (_) {}
    el.click();
  }

  function isOptionRowChecked(rowEl) {
    if (!rowEl) return false;
    const checkboxChild = rowEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox__inner');
    return Boolean(
      rowEl.getAttribute('aria-checked') === 'true' ||
      rowEl.getAttribute('aria-selected') === 'true' ||
      rowEl.getAttribute('data-state') === 'checked' ||
      rowEl.classList.contains('q-checkbox--truthy') ||
      (checkboxChild && (
        checkboxChild.checked === true ||
        checkboxChild.getAttribute('aria-checked') === 'true' ||
        checkboxChild.classList.contains('q-checkbox__inner--truthy')
      ))
    );
  }

  function clickOptionRow(rowEl) {
    if (!rowEl) return;
    if (isOptionRowChecked(rowEl)) return;
    const checkboxChild = rowEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox__inner');
    const target = checkboxChild || rowEl;
    clickElementRealistically(target);
  }

  const GENERIC_MATCH_WORDS = new Set([
    'legislacao',
    'direito',
    'direitos',
    'nocao',
    'nocoes',
    'codigo',
    'codigos',
    'lei',
    'leis',
    'lingua',
    'linguas',
    'estatuto',
    'estatutos',
    'curso',
    'cursos',
    'conhecimento',
    'conhecimentos',
    'administracao',
    'processo',
    'processos',
    'geral',
    'gerais',
    'publica',
    'publico',
    'publicas',
    'publicos',
    'crime',
    'crimes',
    'contra',
    'sobre',
    'entre',
    'para',
    'pelo',
    'pela',
    'pelos',
    'pelas',
    'com',
    'sem',
    'dos',
    'das',
    'nos',
    'nas',
    'uma',
    'uns',
    'umas',
    'parte',
    'partes',
    'aula',
    'aulas',
    'modulo',
    'modulos',
    'bloco',
    'blocos'
  ]);

  const CONFLICTING_QUALIFIER_FAMILIES = [
    ['estadual'],
    ['municipal'],
    ['distrital', 'distrito'],
    ['eleitoral'],
    ['tributario', 'tributaria'],
    ['previdenciario', 'previdenciaria'],
    ['trabalhista'],
    ['mulher', 'mulheres', 'maria', 'penha', '11340', 'feminicidio']
  ];

  const SPECIAL_LAW_RULES = [
    {
      id: 'eca',
      lawDigits: '8069',
      test: (norm) =>
        /\beca\b/.test(norm) ||
        norm.includes('crianca e do adolescente') ||
        norm.includes('crianca e o adolescente') ||
        norm.includes('estatuto da crianca') ||
        norm.includes('8.069') ||
        norm.includes('8069'),
      terms: [
        '8.069',
        'estatuto da crianca',
        'estatuto da crianca e do adolescente',
        'eca',
        'crianca e do adolescente',
        '8069'
      ]
    },
    {
      id: 'henry_borel',
      lawDigits: '14344',
      test: (norm) =>
        norm.includes('henry borel') ||
        norm.includes('14.344') ||
        norm.includes('14344'),
      terms: ['14.344', 'henry borel', 'lei henry borel', '14344']
    },
    {
      id: 'escuta_especializada',
      lawDigits: '13431',
      test: (norm) =>
        norm.includes('escuta especializada') ||
        norm.includes('depoimento especial') ||
        norm.includes('13.431') ||
        norm.includes('13431'),
      terms: ['13.431', 'escuta especializada', 'depoimento especial', '13431']
    },
    {
      id: 'drogas',
      lawDigits: '11343',
      test: (norm) =>
        /\bdrogas?\b|\bsisnad\b|entorpecente/.test(norm) ||
        norm.includes('11.343') ||
        norm.includes('11343'),
      terms: ['11.343', 'lei de drogas', 'drogas', 'sisnad', '11343']
    },
    {
      id: 'desarmamento',
      lawDigits: '10826',
      test: (norm) =>
        norm.includes('desarmamento') ||
        /\barmas?\b/.test(norm) ||
        norm.includes('sinarm') ||
        norm.includes('10.826') ||
        norm.includes('10826'),
      terms: ['10.826', 'estatuto do desarmamento', 'desarmamento', 'arma de fogo', '10826']
    },
    {
      id: 'abuso_autoridade',
      lawDigits: '13869',
      test: (norm) =>
        norm.includes('abuso de autoridade') ||
        norm.includes('13.869') ||
        norm.includes('13869'),
      terms: ['13.869', 'abuso de autoridade', '13869']
    },
    {
      id: 'tortura',
      lawDigits: '9455',
      test: (norm) =>
        norm.includes('tortura') ||
        norm.includes('9.455') ||
        norm.includes('9455'),
      terms: ['9.455', 'tortura', 'lei de tortura', 'crimes de tortura', '9455']
    },
    {
      id: 'hediondos',
      lawDigits: '8072',
      test: (norm) =>
        norm.includes('hediondo') ||
        norm.includes('8.072') ||
        norm.includes('8072'),
      terms: ['8.072', 'crimes hediondos', 'hediondos', '8072']
    },
    {
      id: 'orcrim',
      lawDigits: '12850',
      test: (norm) =>
        norm.includes('organizacao criminosa') ||
        norm.includes('organizacoes criminosas') ||
        /\borcrim\b/.test(norm) ||
        norm.includes('12.850') ||
        norm.includes('12850'),
      terms: ['12.850', 'organizacoes criminosas', 'organizacao criminosa', '12850']
    },
    {
      id: 'maria_da_penha',
      lawDigits: '11340',
      test: (norm) =>
        norm.includes('maria da penha') ||
        (norm.includes('violencia domestica') && /\bmulher(?:es)?\b/.test(norm)) ||
        norm.includes('feminicidio') ||
        norm.includes('11.340') ||
        norm.includes('11340'),
      terms: [
        '11.340',
        'maria da penha',
        'lei maria da penha',
        'violencia domestica e familiar contra a mulher',
        '11340'
      ]
    },
    {
      id: 'crimes_ambientais',
      lawDigits: '9605',
      test: (norm) =>
        norm.includes('meio ambiente') ||
        norm.includes('ambienta') ||
        norm.includes('9.605') ||
        norm.includes('9605'),
      terms: ['9.605', 'crimes ambientais', 'lei ambiental', 'meio ambiente', '9605']
    },
    {
      id: 'interceptacao',
      lawDigits: '9296',
      test: (norm) =>
        norm.includes('interceptacao') ||
        norm.includes('9.296') ||
        norm.includes('9296'),
      terms: ['9.296', 'interceptacao telefonica', '9296']
    },
    {
      id: 'jecrim',
      lawDigits: '9099',
      test: (norm) =>
        norm.includes('juizado') ||
        /\bjecrim\b/.test(norm) ||
        norm.includes('9.099') ||
        norm.includes('9099'),
      terms: ['9.099', 'juizados especiais', 'juizado especial', 'jecrim', '9099']
    },
    {
      id: 'lavagem',
      lawDigits: '9613',
      test: (norm) =>
        norm.includes('lavagem') ||
        norm.includes('9.613') ||
        norm.includes('9613'),
      terms: ['9.613', 'lavagem de dinheiro', 'lavagem de capitais', '9613']
    },
    {
      id: 'racismo',
      lawDigits: '7716',
      test: (norm) =>
        norm.includes('racismo') ||
        norm.includes('7.716') ||
        norm.includes('7716'),
      terms: ['7.716', 'racismo', 'crimes de racismo', '7716']
    },
    {
      id: 'lep',
      lawDigits: '7210',
      test: (norm) =>
        /\blep\b/.test(norm) ||
        norm.includes('execucao penal') ||
        norm.includes('7.210') ||
        norm.includes('7210'),
      terms: ['7.210', 'execucao penal', 'lei de execucao penal', 'lep', '7210']
    },
    {
      id: 'prisao_temporaria',
      lawDigits: '7960',
      test: (norm) =>
        norm.includes('prisao temporaria') ||
        norm.includes('7.960') ||
        norm.includes('7960'),
      terms: ['7.960', 'prisao temporaria', '7960']
    },
    {
      id: 'idoso',
      lawDigits: '10741',
      test: (norm) =>
        norm.includes('idoso') ||
        norm.includes('pessoa idosa') ||
        norm.includes('10.741') ||
        norm.includes('10741'),
      terms: ['10.741', 'estatuto do idoso', 'estatuto da pessoa idosa', '10741']
    },
    {
      id: 'anticrime',
      lawDigits: '13964',
      test: (norm) =>
        norm.includes('pacote anticrime') ||
        /\banticrime\b/.test(norm) ||
        norm.includes('13.964') ||
        norm.includes('13964'),
      terms: ['13.964', 'pacote anticrime', '13964']
    },
    {
      id: 'igualdade_racial',
      lawDigits: '12288',
      test: (norm) =>
        norm.includes('igualdade racial') ||
        norm.includes('12.288') ||
        norm.includes('12288'),
      terms: ['12.288', 'estatuto da igualdade racial', 'igualdade racial', '12288']
    },
    {
      id: 'pcd',
      lawDigits: '13146',
      test: (norm) =>
        norm.includes('pessoa com deficiencia') ||
        /\blbi\b/.test(norm) ||
        norm.includes('13.146') ||
        norm.includes('13146'),
      terms: ['13.146', 'estatuto da pessoa com deficiencia', 'pessoa com deficiencia', '13146']
    },
    {
      id: 'ctb',
      lawDigits: '9503',
      test: (norm) =>
        /\bctb\b/.test(norm) ||
        norm.includes('codigo de transito') ||
        norm.includes('9.503') ||
        norm.includes('9503'),
      terms: ['9.503', 'codigo de transito brasileiro', 'ctb', '9503']
    },
    {
      id: 'lia',
      lawDigits: '8429',
      test: (norm) =>
        /\blia\b/.test(norm) ||
        norm.includes('improbidade administrativa') ||
        norm.includes('8.429') ||
        norm.includes('8429'),
      terms: ['8.429', 'improbidade administrativa', 'lei de improbidade administrativa', '8429']
    }
  ];

  function normalizeStemText(str) {
    return normalizeFilterText(str)
      .replace(/[()[\],;:!?"'“”]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => {
        if (w.length >= 5 && w.endsWith('ais')) return `${w.slice(0, -3)}al`;
        if (w.length >= 5 && (w.endsWith('oes') || w.endsWith('aes'))) return `${w.slice(0, -3)}ao`;
        if (w.length >= 5 && w.endsWith('res')) return w.slice(0, -2);
        if (w.length >= 4 && w.endsWith('ns')) return `${w.slice(0, -2)}m`;
        if (w.length >= 4 && w.endsWith('s')) return w.slice(0, -1);
        return w;
      })
      .join(' ');
  }

  function isOnlyGenericWords(phrase) {
    const tokens = normalizeFilterText(phrase).split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.length === 0) return true;
    return tokens.every(w => {
      if (w.length <= 2) return true;
      const stem = normalizeStemText(w);
      return GENERIC_MATCH_WORDS.has(w) || (stem && GENERIC_MATCH_WORDS.has(stem));
    });
  }

  function restoreCommonPortugueseAccents(str) {
    const raw = String(str || '').trim();
    if (!raw) return '';
    const wordMap = {
      crianca: 'criança',
      criancas: 'crianças',
      lingua: 'língua',
      portugues: 'português',
      raciocinio: 'raciocínio',
      logico: 'lógico',
      logica: 'lógica',
      matematica: 'matemática',
      fisica: 'física',
      etica: 'ética',
      geopolitica: 'geopolítica',
      informatica: 'informática',
      transito: 'trânsito',
      codigo: 'código',
      publico: 'público',
      publica: 'pública',
      publicos: 'públicos',
      publicas: 'públicas',
      orgao: 'órgão',
      orgaos: 'órgãos',
      juridico: 'jurídico',
      juridica: 'jurídica',
      politico: 'político',
      politica: 'política',
      economico: 'econômico',
      economica: 'econômica',
      tributario: 'tributário',
      tributaria: 'tributária',
      previdenciario: 'previdenciário',
      previdenciaria: 'previdenciária',
      inquerito: 'inquérito',
      ilicito: 'ilícito',
      ilicitos: 'ilícitos',
      unico: 'único',
      unica: 'única',
      numero: 'número',
      veiculo: 'veículo',
      veiculos: 'veículos',
      servico: 'serviço',
      servicos: 'serviços',
      comercio: 'comércio',
      exercicio: 'exercício',
      exercicios: 'exercícios',
      beneficio: 'benefício',
      beneficios: 'benefícios',
      principio: 'princípio',
      principios: 'princípios',
      seguranca: 'segurança',
      violencia: 'violência',
      domestica: 'doméstica',
      domestico: 'doméstico',
      estatistica: 'estatística',
      tecnica: 'técnica',
      tecnico: 'técnico',
      pratica: 'prática',
      pratico: 'prático',
      mecanica: 'mecânica',
      cinematica: 'cinemática',
      dinamica: 'dinâmica',
      telefonica: 'telefônica',
      nao: 'não',
      sao: 'são',
      familia: 'família',
      saude: 'saúde',
      medio: 'médio',
      media: 'média',
      historia: 'história',
      memoria: 'memória',
      materia: 'matéria',
      patrimonio: 'patrimônio',
      homicidio: 'homicídio',
      suicidio: 'suicídio',
      auxilio: 'auxílio',
      justica: 'justiça',
      forca: 'força',
      licenca: 'licença',
      rodoviario: 'rodoviário',
      rodoviaria: 'rodoviária',
      extraordinario: 'extraordinário',
      extraordinaria: 'extraordinária',
      sumario: 'sumário',
      sumaria: 'sumária',
      ordinario: 'ordinário',
      ordinaria: 'ordinária'
    };

    return raw
      .split(/\s+/)
      .map(token => {
        const lower = token.toLowerCase();
        if (wordMap[lower]) return wordMap[lower];
        if (/^[a-z]+cao$/.test(lower)) return `${lower.slice(0, -3)}ção`;
        if (/^[a-z]+coes$/.test(lower)) return `${lower.slice(0, -4)}ções`;
        if (/^[a-z]{2,}sao$/.test(lower)) return `${lower.slice(0, -3)}são`;
        if (/^[a-z]{2,}encia$/.test(lower)) return `${lower.slice(0, -5)}ência`;
        if (/^[a-z]{2,}encias$/.test(lower)) return `${lower.slice(0, -6)}ências`;
        if (/^[a-z]{2,}ario$/.test(lower)) return `${lower.slice(0, -4)}ário`;
        return token;
      })
      .join(' ');
  }

  function stripAmendedLawTail(rawText) {
    const norm = normalizeFilterText(rawText);
    if (!norm) return '';
    return norm
      .replace(/\b(?:e\s+)?(?:altera|modifica|acrescenta|revoga|da\s+nova\s+redacao)\s+(?:a\s+|o\s+|os\s+|as\s+|dispositivos\s+da\s+)?(?:lei|decreto|codigo|estatuto)\b.*$/i, '')
      .trim();
  }

  function extractLeadingLawDigits(rawText) {
    const base = stripAmendedLawTail(rawText) || normalizeFilterText(rawText);
    if (!base) return '';
    const match = base.match(/\b(?:lei|decreto(?:-lei)?|lc)\s*(?:complementar\s*)?(?:n\.?[oº°.]?\s*|numero\s+)?(\d{1,2}\.?\d{3})\b/i);
    return match ? match[1].replace(/\D/g, '') : '';
  }

  function getMatchingSpecialLawIds(rawText, opts = {}) {
    const primaryOnly = Boolean(opts && opts.primaryOnly);
    const sourceText = primaryOnly ? (stripAmendedLawTail(rawText) || rawText) : rawText;
    const norm = normalizeFilterText(sourceText)
      .replace(/[-–—:|/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!norm) return [];
    const leadingDigits = primaryOnly ? extractLeadingLawDigits(sourceText) : '';
    const ids = [];
    for (const rule of SPECIAL_LAW_RULES) {
      if (!rule.id || !rule.test(norm)) continue;
      if (primaryOnly && leadingDigits && rule.lawDigits && rule.lawDigits !== leadingDigits) {
        continue;
      }
      if (!ids.includes(rule.id)) {
        ids.push(rule.id);
      }
    }
    if (primaryOnly && leadingDigits) {
      const key = `lei_${leadingDigits}`;
      if (!ids.includes(key)) ids.push(key);
    } else {
      const lawRegex = /\blei\s+(?:n\.?[oº°.]?\s*|numero\s+)?(\d{1,2}\.?\d{3})\b/gi;
      let match;
      while ((match = lawRegex.exec(norm)) !== null) {
        const digits = match[1].replace(/\D/g, '');
        if (digits.length >= 4 && digits.length <= 5) {
          const key = `lei_${digits}`;
          if (!ids.includes(key)) ids.push(key);
        }
      }
    }
    return ids;
  }

  function getSpecialLawSearchTerms(rawText) {
    const norm = normalizeFilterText(rawText)
      .replace(/[-–—:|/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!norm) return [];
    const results = [];
    const pushTerm = (t) => {
      if (t && !results.includes(t)) results.push(t);
    };

    for (const rule of SPECIAL_LAW_RULES) {
      if (rule.test(norm)) {
        for (const t of rule.terms) {
          pushTerm(t);
        }
      }
    }

    // Extrai números de leis explícitos no texto (ex.: "Lei nº 14.344/2022" -> "lei 14.344", "14.344", "14344")
    const lawRegex = /\blei\s+(?:n[oº°.]?\s*)?(\d{1,2}\.?\d{3})\b/gi;
    let match;
    while ((match = lawRegex.exec(norm)) !== null) {
      const digits = match[1].replace(/\D/g, '');
      if (digits.length >= 4 && digits.length <= 5) {
        const dotted = digits.replace(/^(\d+)(\d{3})$/, '$1.$2');
        pushTerm(`lei ${dotted}`);
        pushTerm(dotted);
        pushTerm(digits);
      }
    }

    return results;
  }

  function getSubjectSearchTerms(subject) {
    const norm = normalizeFilterText(subject);
    if (!norm) return [];
    const specialLegislationTerms = [
      'legislacao penal especial',
      'legislacao especial',
      'leis penais especiais',
      'leis especiais',
      'legislacao extravagante',
      'direito penal especial',
      'penal especial',
      'especial',
      'especiais',
      'extravagante'
    ];
    const aliases = {
      'portugues': ['lingua portuguesa', 'portugues'],
      'lingua portuguesa': ['lingua portuguesa', 'portugues'],
      'legislacao de transito': ['codigo de transito brasileiro', 'ctb', 'transito'],
      'transito': ['codigo de transito brasileiro', 'ctb', 'transito'],
      'ctb': ['codigo de transito brasileiro', 'ctb'],
      'raciocinio logico': ['raciocinio logico', 'matematica'],
      'rlm': ['raciocinio logico', 'matematica'],
      'processo penal': ['direito processual penal', 'processo penal'],
      'direito processual penal': ['direito processual penal', 'processo penal'],
      'legislacao especial': specialLegislationTerms,
      'legislacao penal especial': specialLegislationTerms,
      'leis especiais': specialLegislationTerms,
      'leis penais especiais': specialLegislationTerms,
      'informatica': ['informatica', 'nocoes de informatica'],
      'etica': ['etica no servico publico', 'etica'],
      'fisica': ['fisica']
    };
    const list = aliases[norm] ? [...aliases[norm]] : [norm];
    if (!list.includes(norm)) list.push(norm);
    return list;
  }

  function getTopicSearchTerms(topic) {
    const norm = normalizeFilterText(topic);
    if (!norm) return [];
    const terms = [];
    const pushUnique = (t) => {
      const s = String(t || '').trim();
      if (s && !terms.includes(s)) terms.push(s);
    };

    const cleaned = norm
      .replace(/\b(de nivelamento|nivelamento|bases da|bases do|nocoes de|introducao a|introducao ao|parte \d+|aula \d+|modulo \d+)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    pushUnique(norm);
    pushUnique(cleaned);

    getSpecialLawSearchTerms(norm).forEach(t => pushUnique(t));
    if (cleaned && cleaned !== norm) {
      getSpecialLawSearchTerms(cleaned).forEach(t => pushUnique(t));
    }

    // Gera variante plural simples caso o assunto do QG esteja no singular (ex.: "conceito iniciais" -> "conceitos iniciais")
    const cleanedWords = cleaned.split(' ').filter(Boolean);
    if (cleanedWords.length >= 2 && cleanedWords[1].length >= 3) {
      const pair = `${cleanedWords[0]} ${cleanedWords[1]}`;
      if (!isOnlyGenericWords(pair)) {
        pushUnique(pair);
        if (!cleanedWords[0].endsWith('s') && cleanedWords[0].length >= 4 && !isOnlyGenericWords(cleanedWords[0])) {
          pushUnique(`${cleanedWords[0]}s ${cleanedWords[1]}`);
        }
      }
    }

    const sigWords = cleanedWords.filter(w => w.length >= 4 && !isOnlyGenericWords(w));
    sigWords.sort((a, b) => b.length - a.length);
    sigWords.forEach(w => pushUnique(w));
    return terms;
  }

  function getLessonSearchTerms(lessonTitle) {
    const raw = String(lessonTitle || '').trim();
    if (!raw) return [];
    const terms = [];
    const pushUnique = (t) => {
      const s = normalizeFilterText(t)
        .replace(/\b(aula|parte|bloco|modulo|capitulo)\s*\d+\b/g, ' ')
        .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (s && !terms.includes(s)) terms.push(s);
    };

    pushUnique(raw);

    // Subdivisões por hífen / travessão (ex.: "VELOCIDADE ESCALAR MÉDIA - CASOS PARTICULARES")
    const dashParts = raw.split(/\s*[-–—:]\s*/).map(p => p.trim()).filter(Boolean);
    if (dashParts.length > 1) {
      dashParts.forEach(part => pushUnique(part));
    }

    // Expansão de siglas e nomes de leis especiais (ex.: "Crimes contra a Criança e o Adolescente" -> ECA / 8.069)
    getSpecialLawSearchTerms(raw).forEach(t => pushUnique(t));

    // Múltiplos tópicos na mesma aula (ex.: "INTERJEIÇÃO, NUMERAL E PREPOSIÇÃO")
    const listParts = raw.split(/\s*,\s*|\s+\be\b\s+/i).map(p => p.trim()).filter(Boolean);
    if (listParts.length > 1) {
      listParts.forEach(part => {
        const cleanPart = normalizeFilterText(part);
        if (cleanPart.length >= 3 && !isOnlyGenericWords(cleanPart)) pushUnique(part);
      });
    }

    // Variantes sem palavras genéricas e palavras-chave significativas (>= 4 letras)
    const expanded = [...terms];
    expanded.forEach(t => {
      const words = t.split(' ').filter(Boolean);
      if (words.length >= 2 && words[1].length >= 3) {
        const pair = `${words[0]} ${words[1]}`;
        if (!isOnlyGenericWords(pair)) {
          pushUnique(pair);
          if (!words[0].endsWith('s') && words[0].length >= 4 && !isOnlyGenericWords(words[0])) {
            pushUnique(`${words[0]}s ${words[1]}`);
          }
        }
      }
      words
        .filter(w => w.length >= 4 && !isOnlyGenericWords(w))
        .sort((a, b) => b.length - a.length)
        .forEach(w => pushUnique(w));
    });

    return terms;
  }

  function findAppliedFiltersSection() {
    const label = Array.from(document.querySelectorAll('div, span, p, h1, h2, h3, h4, label, strong'))
      .find(el => {
        if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === 'filtros aplicados' || txt === 'filtros aplicados:';
      });
    if (!label) return null;
    const labelRect = label.getBoundingClientRect();
    let container = label.parentElement;
    while (container && container !== document.body) {
      const r = container.getBoundingClientRect();
      if (r.height >= 45 && r.height <= 460 && r.width >= 260) {
        return { container, labelRect };
      }
      container = container.parentElement;
    }
    return { container: label.parentElement, labelRect };
  }

  function findFilterDropdownTrigger(labelWord) {
    const targetNorm = normalizeFilterText(labelWord);
    const targetPrefix = targetNorm.slice(0, Math.min(6, targetNorm.length));
    const appliedInfo = findAppliedFiltersSection();

    const matches = Array.from(document.querySelectorAll('button, [role="button"], [role="combobox"], .q-select, .q-field, div, span'))
      .filter(el => {
        if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
        if (appliedInfo) {
          const r = el.getBoundingClientRect();
          if (r.top >= appliedInfo.labelRect.top - 4) return false;
          if (appliedInfo.container && appliedInfo.container.contains(el)) return false;
        }
        const txt = normalizeFilterText(el.innerText || el.textContent);
        if (!txt || txt.length > 60 || txt.includes('filtros aplicados')) return false;
        return (
          txt === targetNorm ||
          txt.startsWith(`${targetNorm} `) ||
          txt.startsWith(`${targetNorm}\n`) ||
          (targetPrefix.length >= 5 && txt.startsWith(targetPrefix) && /\bselecionad/.test(txt))
        );
      });

    const containers = [];
    for (const el of matches) {
      let cur = el;
      let chosen = null;
      for (let depth = 0; depth < 5 && cur && cur !== document.body; depth++) {
        const r = cur.getBoundingClientRect();
        if (r.width >= 110 && r.width <= 420 && r.height >= 28 && r.height <= 65) {
          if (cur.matches('button, [role="button"], [role="combobox"], .q-select, .q-field, div')) {
            chosen = cur;
            if (cur.matches('button, [role="button"], [role="combobox"], .q-select, .q-field')) break;
          }
        }
        cur = cur.parentElement;
      }
      if (chosen) containers.push(chosen);
    }

    const unique = Array.from(new Set(containers));
    unique.sort((a, b) => {
      const aClickable = a.matches('button, [role="button"], [role="combobox"], .q-select, .q-field') ? 0 : 1;
      const bClickable = b.matches('button, [role="button"], [role="combobox"], .q-select, .q-field') ? 0 : 1;
      if (aClickable !== bClickable) return aClickable - bClickable;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    return unique[0] || null;
  }

  function findMenuFilterInput() {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'))
      .filter(el => !el.closest('#qg-caveira-hud') && isElementVisible(el));
    return inputs.find(el => {
      const meta = normalizeFilterText(`${el.placeholder || ''} ${el.getAttribute('aria-label') || ''} ${el.name || ''}`);
      if (!meta || meta.includes('filtrar carreiras') || meta.includes('palavra chave')) return false;
      return meta.includes('digite para filtrar');
    }) || null;
  }

  function getMenuContainer(filterInput) {
    if (!filterInput) return null;
    let container = filterInput.closest('.q-menu, [role="listbox"], .v-menu__content, .dropdown-menu');
    if (!container) {
      let cur = filterInput.parentElement;
      for (let depth = 0; depth < 6 && cur && cur !== document.body; depth++) {
        const r = cur.getBoundingClientRect();
        if (r.height >= 100 && r.width >= 160 && r.width <= 650) {
          container = cur;
          break;
        }
        cur = cur.parentElement;
      }
    }
    return container;
  }

  function hasNoSearchResultsInMenu(filterInput) {
    const container = getMenuContainer(filterInput) || filterInput?.parentElement?.parentElement;
    if (!container) return false;
    const txt = normalizeFilterText(container.innerText || container.textContent);
    return txt.includes('pesquisa sem resultados') || txt.includes('nenhum resultado');
  }

  function findDropdownOptionElements(filterInput) {
    const container = getMenuContainer(filterInput);
    if (!container) return [];

    const inputRect = filterInput.getBoundingClientRect();
    const candidates = Array.from(container.querySelectorAll('label, li, [role="option"], [role="menuitem"], [role="checkbox"], .q-item, div'))
      .filter(el => {
        if (!el || el.closest('#qg-caveira-hud') || el === filterInput || el.contains(filterInput) || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.top < inputRect.bottom - 4) return false;
        if (r.width < 80 || r.height < 18 || r.height > 84) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        if (!txt || txt === 'digite para filtrar') return false;
        return true;
      });

    // Mantém apenas linhas-folha (não contêm outro candidato com texto diferente)
    return candidates.filter(el => {
      const elTxt = normalizeFilterText(el.innerText || el.textContent);
      return !candidates.some(other => {
        if (other === el || !el.contains(other)) return false;
        const otherTxt = normalizeFilterText(other.innerText || other.textContent);
        return Boolean(otherTxt && otherTxt !== elTxt);
      });
    });
  }

  function hasWholeStartMatch(text, term) {
    if (!text || !term) return false;
    if (!text.startsWith(term)) return false;
    if (term.length > 4 || text.length === term.length) return true;
    return /[^a-z0-9]/.test(text.charAt(term.length));
  }

  function hasWholeTermMatch(text, term) {
    if (!text || !term) return false;
    if (term.length <= 4) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(text);
    }
    return text.includes(term);
  }

  function scoreOptionMatch(optionText, searchTerms, opts = {}) {
    const primaryOptionText = stripAmendedLawTail(optionText) || optionText;
    const normOpt = normalizeFilterText(primaryOptionText);
    const stemOpt = normalizeStemText(primaryOptionText);
    if (!normOpt) return 0;

    const validTerms = Array.isArray(searchTerms)
      ? searchTerms.map(t => normalizeFilterText(t)).filter(Boolean)
      : [];
    if (validTerms.length === 0) return 0;

    // Guarda de Lei Específica: avalia a lei principal da opção (sem a cauda "e altera a Lei...")
    const optLawIds = getMatchingSpecialLawIds(primaryOptionText, { primaryOnly: true });
    if (optLawIds.length > 0) {
      if (opts.allowedLawIds instanceof Set && opts.allowedLawIds.size > 0) {
        if (!optLawIds.some(id => opts.allowedLawIds.has(id))) {
          return 0;
        }
      }
      const searchLawIds = getMatchingSpecialLawIds(validTerms.join(' '));
      if (!optLawIds.some(id => searchLawIds.includes(id))) {
        return 0;
      }
    }

    // Rejeita qualificadores conflitantes (ex.: "Legislação Estadual" quando busca "Legislação Especial")
    const optStemWords = new Set(normalizeStemText(normOpt.replace(/[^a-z0-9]+/g, ' ')).split(' ').filter(Boolean));
    const searchStemJoined = normalizeStemText(validTerms.join(' ').replace(/[^a-z0-9]+/g, ' '));
    const searchStemWords = new Set(searchStemJoined.split(' ').filter(Boolean));
    for (const family of CONFLICTING_QUALIFIER_FAMILIES) {
      const optHasFamily = family.some(w => optStemWords.has(w));
      if (optHasFamily && !family.some(w => searchStemWords.has(w))) {
        return 0;
      }
    }

    const normOptWithoutLeiPrefix = normOpt
      .replace(/^(?:lei|decreto(?:-lei)?|lc)\s*(?:complementar\s*)?(?:n\.?[oº°.]?\s*|numero\s+)?/, '')
      .trim();
    const stemOptWithoutLeiPrefix = normalizeStemText(normOptWithoutLeiPrefix);

    let best = 0;
    let additionalTermMatches = 0;
    for (let i = 0; i < validTerms.length; i++) {
      const term = validTerms[i];
      const stemTerm = normalizeStemText(term);
      if (!term) continue;
      if (normOpt === term || (stemTerm && stemOpt === stemTerm)) return 1000 - i;
      if (
        (normOptWithoutLeiPrefix && hasWholeStartMatch(normOptWithoutLeiPrefix, term)) ||
        (stemOptWithoutLeiPrefix && stemTerm && hasWholeStartMatch(stemOptWithoutLeiPrefix, stemTerm))
      ) {
        best = Math.max(best, 900 - i);
        if (i > 0) additionalTermMatches += 1;
      } else if (hasWholeStartMatch(normOpt, term) || (stemTerm && hasWholeStartMatch(stemOpt, stemTerm))) {
        best = Math.max(best, 800 - i);
        if (i > 0) additionalTermMatches += 1;
      } else if (hasWholeTermMatch(normOpt, term) || (stemTerm && hasWholeTermMatch(stemOpt, stemTerm))) {
        best = Math.max(best, 600 - i);
        if (i > 0) additionalTermMatches += 1;
      } else {
        const words = (stemTerm || term).split(' ').filter(w => w.length >= 3);
        const hits = words.filter(w => hasWholeTermMatch(stemOpt, w) || hasWholeTermMatch(normOpt, w)).length;
        if (hits > 0) {
          const specificWords = words.filter(w => !GENERIC_MATCH_WORDS.has(w));
          if (specificWords.length > 0) {
            const specificHits = specificWords.filter(
              w => hasWholeTermMatch(stemOpt, w) || hasWholeTermMatch(normOpt, w)
            ).length;
            if (specificHits === 0) continue;
          }
          best = Math.max(best, Math.round((hits / Math.max(1, words.length)) * 450) - i);
        }
      }
    }

    if (best > 0 && additionalTermMatches > 0) {
      best += Math.min(60, additionalTermMatches * 15);
    }
    return best;
  }

  async function closeOpenDropdown(trigger, filterInput) {
    if (!findMenuFilterInput()) return;

    if (filterInput && hasNoSearchResultsInMenu(filterInput)) {
      setNativeInputValue(filterInput, '');
      await sleepMs(160);
    }

    const activeInput = findMenuFilterInput() || filterInput;
    if (activeInput) {
      activeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await sleepMs(150);
    if (!findMenuFilterInput()) return;

    const menuContainer = getMenuContainer(findMenuFilterInput() || filterInput);
    const neutralHeading = Array.from(document.querySelectorAll('h1, h2, h3, h4, div, span, p'))
      .find(el => {
        if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
        if (menuContainer && menuContainer.contains(el)) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === 'banco de questoes' || txt === 'carreiras' || txt === 'filtros';
      });
    if (neutralHeading) {
      clickElementRealistically(neutralHeading);
      await sleepMs(150);
    }

    if (findMenuFilterInput()) {
      const pointEl = document.elementFromPoint(15, 150);
      if (
        pointEl &&
        !pointEl.closest('#qg-caveira-hud') &&
        (!menuContainer || !menuContainer.contains(pointEl)) &&
        !pointEl.closest('a, button')
      ) {
        clickElementRealistically(pointEl);
        await sleepMs(150);
      }
    }

    if (findMenuFilterInput()) {
      const bodyEvt = { bubbles: true, cancelable: true, view: window, clientX: 15, clientY: 150 };
      try { document.body.dispatchEvent(new MouseEvent('mousedown', bodyEvt)); } catch (_) {}
      try { document.body.dispatchEvent(new MouseEvent('mouseup', bodyEvt)); } catch (_) {}
      document.body.click();
      await sleepMs(180);
    }

    if (findMenuFilterInput() && trigger && (!menuContainer || !trigger.contains(menuContainer))) {
      clickElementRealistically(trigger);
      await sleepMs(180);
    }
  }

  const GENERIC_INDEX_LINES = new Set([
    'introducao',
    'apresentacao',
    'abertura',
    'encerramento',
    'conclusao',
    'finalizacao',
    'consideracoes finais',
    'duvidas',
    'recados',
    'avisos',
    'revisao',
    'resumo',
    'exercicios',
    'questoes',
    'simulado',
    'inicio',
    'fim',
    'boas vindas'
  ]);

  const LEADING_INDEX_FILLER_REGEX = /^(?:conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das)|aspectos?\s+(?:gerais|iniciais|principais)\s+(?:de|da|do|dos|das)|vis[aã]o\s+geral\s+(?:de|da|do)|entendendo\s+(?:a|o|as|os)|compreendendo\s+(?:a|o|as|os)|o\s+que\s+[eé])\s+/i;

  const BROAD_PARENT_PREFIX_REGEX = /^(?:organiza[cç][aã]o\s+(?:da|do|de)|conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das))\s+/i;

  function normalizeCourseIndexKey(str) {
    return normalizeFilterText(str)
      .replace(/[-–—:|/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const PURE_ARTICLE_LINE_REGEX = /^(?:revoga[cç][aã]o\s+(?:do|da|dos|das)\s+|leitura\s+(?:do|da|dos|das)\s+|coment[aá]rios?\s+(?:ao|sobre|do|dos)\s+|an[aá]lise\s+(?:do|dos)\s+)?art(?:igo)?s?\.?\s*(\d+)/i;

  function buildBroadParentNorms(contextNames = []) {
    const broad = new Set();
    for (const name of (Array.isArray(contextNames) ? contextNames : [contextNames])) {
      const raw = String(name || '').trim();
      if (!raw) continue;
      const stripped = raw
        .replace(/\s*[-–—]\s*(?:parte|aula|bloco|modulo)\s*\d+\s*$/i, '')
        .trim();
      for (const candidate of [raw, stripped]) {
        if (getSpecialLawSearchTerms(candidate).length > 0) continue;
        const norm = normalizeCourseIndexKey(candidate);
        if (norm) broad.add(norm);
        let cur = candidate;
        for (let i = 0; i < 2; i++) {
          const next = cur.replace(BROAD_PARENT_PREFIX_REGEX, '').trim();
          const nextNorm = normalizeCourseIndexKey(next);
          if (nextNorm && nextNorm !== normalizeCourseIndexKey(cur)) {
            if (getSpecialLawSearchTerms(next).length === 0) {
              broad.add(nextNorm);
            }
            cur = next;
          } else {
            break;
          }
        }
      }
    }
    return broad;
  }

  const PROSE_NOTE_PREFIX_REGEX = /^(?:obs(?:erva[cç][aã]o)?|aten[cç][aã]o|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|s[uú]mula|importante)\s*[:\-–]/i;

  function parseCourseIndexSubtopics(rawText, contextNames = []) {
    const input = String(rawText || '').trim();
    if (!input) return [];

    const normalizedBlock = input.replace(/([^\n])\s*(\[\d{1,2}:\d{2}(?::\d{2})?\])/g, '$1\n$2');
    const rawLines = normalizedBlock.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const mergedLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      const cur = rawLines[i];
      if (/^[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?$/.test(cur) && i + 1 < rawLines.length) {
        mergedLines.push(`${cur} ${rawLines[i + 1]}`);
        i += 1;
      } else {
        mergedLines.push(cur);
      }
    }

    const broadContext = buildBroadParentNorms(contextNames);
    const contextText = (Array.isArray(contextNames) ? contextNames : [contextNames]).filter(Boolean).join(' ');
    const mainLawIds = new Set(getMatchingSpecialLawIds(contextText));
    const results = [];
    const seenNorm = new Set();

    for (const rawLine of mergedLines) {
      const rawNorm = normalizeCourseIndexKey(rawLine);
      if (
        !rawNorm ||
        rawNorm === 'indice' ||
        rawNorm === 'charlie' ||
        rawNorm === 'bizus' ||
        rawNorm === 'arquivos' ||
        rawNorm === 'comentarios'
      ) {
        continue;
      }

      const hadIntroPrefix = /^(?:[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*)?introdu[cç][aã]o\b/i.test(rawLine);
      let cleaned = rawLine
        .replace(/^[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*[-–—:|]*\s*/, '')
        .replace(/^(?:[-•*●▪◦]|\d+[.)-])\s+/, '')
        .replace(/\bademi\s+publica\b/gi, 'Administração Pública')
        .replace(/\bademi\b/gi, 'Administração')
        .replace(/\badm\.?\s+publica\b/gi, 'Administração Pública')
        .replace(/\badm\.?\b/gi, 'Administração')
        .replace(/\bconst\.?\s+federal\b/gi, 'Constituição Federal')
        .replace(/\bcf\b(?=\s|$|[.,])/gi, 'Constituição Federal')
        .replace(/\bctb\b(?=\s|$|[.,])/gi, 'Código de Trânsito Brasileiro')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleaned) continue;

      if (PROSE_NOTE_PREFIX_REGEX.test(cleaned)) continue;
      if (cleaned.length > 85 || (/\.\s*$/.test(cleaned) && cleaned.split(/\s+/).length > 8)) {
        continue;
      }

      if (mainLawIds.size > 0) {
        const lineLawIds = getMatchingSpecialLawIds(cleaned);
        if (lineLawIds.some(id => !mainLawIds.has(id))) {
          continue;
        }
      }

      let norm = normalizeCourseIndexKey(cleaned);
      if (
        !norm ||
        norm.length < 3 ||
        GENERIC_INDEX_LINES.has(norm) ||
        /^(?:parte|aula|bloco|modulo)\s*\d+$/.test(norm) ||
        broadContext.has(norm)
      ) {
        continue;
      }

      const artMatch = cleaned.match(PURE_ARTICLE_LINE_REGEX);
      if (artMatch) {
        const artNum = artMatch[1];
        const isLandmarkArticle = ['5', '37', '144'].includes(artNum);
        const hasSpecialLawMention = getSpecialLawSearchTerms(cleaned).length > 0;
        if (!isLandmarkArticle && !hasSpecialLawMention) {
          continue;
        }
      }

      const strippedCore = cleaned.replace(LEADING_INDEX_FILLER_REGEX, '').trim();
      const strippedNorm = normalizeCourseIndexKey(strippedCore);
      if (strippedCore && strippedNorm.length >= 4) {
        if (hadIntroPrefix && strippedNorm.split(' ').length === 1 && strippedNorm.length < 10) {
          continue;
        }
        cleaned = strippedCore;
        norm = strippedNorm;
      }

      if (!norm || norm.length < 3 || GENERIC_INDEX_LINES.has(norm) || broadContext.has(norm)) {
        continue;
      }

      const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      if (!seenNorm.has(norm)) {
        seenNorm.add(norm);
        results.push(formatted);
      }
    }

    return results;
  }

  function expandSubtopicToSearchGroups(subtopic) {
    const clean = normalizeFilterText(subtopic)
      .replace(/\bademi\b/g, 'administracao')
      .replace(/\badm\b/g, 'administracao')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return { primary: [], splitFallbacks: [] };

    const primary = [clean];
    const extraSplits = [];

    if (clean.includes('administracao publica direta e indireta')) {
      primary.push('administracao direta e indireta');
    }
    if (clean.includes('teoria do orgao')) {
      primary.push('orgaos publicos', 'orgao publico');
    }
    if (clean.includes('terceiro setor')) {
      primary.push('terceiro setor', 'entidades paraestatais', 'paraestatais');
    }
    if (clean.includes('por servico')) {
      primary.push('outorga', 'descentralizacao por servico');
    }
    if (clean.includes('por colaboracao')) {
      primary.push('delegacao', 'descentralizacao por colaboracao');
    }
    if (clean.includes('ministerios')) {
      primary.push('ministerios');
    }

    const lawTerms = getSpecialLawSearchTerms(clean);
    if (lawTerms.length > 0) {
      if (/\beca\b/.test(clean)) {
        primary.push(clean.replace(/\beca\b/g, 'estatuto da crianca e do adolescente'));
        if (/\bcrimes?\b/.test(clean)) {
          primary.push('crimes contra a crianca e o adolescente');
        }
      } else if (/\bctb\b/.test(clean)) {
        primary.push(clean.replace(/\bctb\b/g, 'codigo de transito brasileiro'));
      } else if (/\blep\b/.test(clean)) {
        primary.push(clean.replace(/\blep\b/g, 'lei de execucao penal'));
      } else if (/\blia\b/.test(clean)) {
        primary.push(clean.replace(/\blia\b/g, 'improbidade administrativa'));
      }
      lawTerms.forEach(t => {
        primary.push(t);
        extraSplits.push([t]);
      });
    }

    // Se o subtópico combina 2 conceitos-chave de edital, gera buscas específicas adicionais caso apareçam separados no Caveira
    if (clean.includes('direta') && clean.includes('indireta')) {
      extraSplits.push(['administracao direta'], ['administracao indireta']);
    }
    if (clean.includes('desconcentracao') && (clean.includes('descentralizacao') || clean.includes('orgao'))) {
      extraSplits.push(['desconcentracao']);
      if (clean.includes('descentralizacao')) extraSplits.push(['descentralizacao']);
      if (clean.includes('orgao')) extraSplits.push(['orgaos publicos', 'teoria do orgao']);
    } else if (clean.includes('concentracao') && clean.includes('descentralizacao')) {
      extraSplits.push(['concentracao', 'centralizacao'], ['descentralizacao']);
    }
    if (clean.includes('terceiro setor') && clean.includes('entidades')) {
      extraSplits.push(['terceiro setor', 'paraestatais']);
    }

    return { primary: Array.from(new Set(primary)), splitFallbacks: extraSplits };
  }

  async function matchOptionInOpenDropdown(filterInput, searchTerms, opts = {}) {
    const forbiddenNorms = opts.forbiddenNorms instanceof Set ? opts.forbiddenNorms : null;
    const excludeNorms = opts.excludeNorms instanceof Set ? opts.excludeNorms : null;
    const minScore = typeof opts.minScore === 'number' ? opts.minScore : 200;
    const allowEmptyFallback = opts.allowEmptyFallback !== false;

    let matched = null;
    let bestScore = 0;

    for (const term of searchTerms) {
      if (filterInput) {
        const accented = restoreCommonPortugueseAccents(term);
        const primaryQuery = (accented && accented !== term) ? accented : term;

        filterInput.focus();
        setNativeInputValue(filterInput, primaryQuery);
        await sleepMs(420);

        if (hasNoSearchResultsInMenu(filterInput) && primaryQuery !== term) {
          filterInput.focus();
          setNativeInputValue(filterInput, term);
          await sleepMs(420);
        }
      }

      if (filterInput && hasNoSearchResultsInMenu(filterInput)) {
        continue;
      }

      const options = findDropdownOptionElements(filterInput);
      bestScore = 0;
      matched = null;
      for (const opt of options) {
        const optNorm = normalizeCourseIndexKey(opt.innerText || opt.textContent);
        if (!optNorm) continue;
        if (forbiddenNorms && forbiddenNorms.has(optNorm)) continue;
        if (excludeNorms && excludeNorms.has(optNorm)) continue;

        const sc = scoreOptionMatch(opt.innerText || opt.textContent, [term, ...searchTerms], opts);
        if (sc > bestScore) {
          bestScore = sc;
          matched = opt;
        }
      }
      if (matched && bestScore >= minScore) break;
      matched = null;
    }

    if ((!matched || (filterInput && hasNoSearchResultsInMenu(filterInput))) && filterInput && allowEmptyFallback) {
      setNativeInputValue(filterInput, '');
      await sleepMs(320);
      const allOptions = findDropdownOptionElements(filterInput);
      let bestFallbackScore = 0;
      for (const opt of allOptions) {
        const optNorm = normalizeCourseIndexKey(opt.innerText || opt.textContent);
        if (!optNorm) continue;
        if (forbiddenNorms && forbiddenNorms.has(optNorm)) continue;
        if (excludeNorms && excludeNorms.has(optNorm)) continue;

        const sc = scoreOptionMatch(opt.innerText || opt.textContent, searchTerms, opts);
        if (sc > bestFallbackScore) {
          bestFallbackScore = sc;
          matched = opt;
        }
      }
      if (bestFallbackScore < Math.max(150, minScore)) matched = null;
    }

    return matched;
  }

  async function selectCaveiraDropdownOption(labelWord, searchTerms) {
    if (isDestroyed || !searchTerms || searchTerms.length === 0) return false;
    const trigger = findFilterDropdownTrigger(labelWord);
    if (!trigger) return false;

    clickElementRealistically(trigger);
    await sleepMs(320);

    let filterInput = findMenuFilterInput();
    if (!filterInput) {
      clickElementRealistically(trigger);
      await sleepMs(350);
      filterInput = findMenuFilterInput();
    }

    const matched = await matchOptionInOpenDropdown(filterInput, searchTerms);
    if (matched) {
      clickOptionRow(matched);
      await sleepMs(220);
    }

    await closeOpenDropdown(trigger, filterInput);
    await sleepMs(200);
    return Boolean(matched);
  }

  function isSpecialLegislationSubjectName(subjectName) {
    const norm = normalizeFilterText(subjectName);
    if (!norm) return false;
    return (
      norm === 'legislacao especial' ||
      norm === 'legislacao penal especial' ||
      norm === 'leis especiais' ||
      norm === 'leis penais especiais' ||
      norm === 'legislacao extravagante' ||
      norm === 'direito penal especial' ||
      norm === 'penal especial' ||
      (norm.includes('legislacao') && (norm.includes('especial') || norm.includes('extravagante')))
    );
  }

  async function selectCaveiraLessonsInDropdown(lessonsList, fallbackTopic, subtopicsList = [], subjectName = '') {
    const validLessons = (Array.isArray(lessonsList) ? lessonsList : []).filter(Boolean);
    const validSubtopics = (Array.isArray(subtopicsList) ? subtopicsList : []).filter(Boolean);
    const hasFallback = Boolean(String(fallbackTopic || '').trim());
    if (isDestroyed || (validLessons.length === 0 && validSubtopics.length === 0 && !hasFallback)) return false;

    const trigger = findFilterDropdownTrigger('Assunto');
    if (!trigger) return false;

    clickElementRealistically(trigger);
    await sleepMs(320);

    let filterInput = findMenuFilterInput();
    if (!filterInput) {
      clickElementRealistically(trigger);
      await sleepMs(350);
      filterInput = findMenuFilterInput();
    }

    let matchedCount = 0;
    const selectedOptionNorms = new Set();

    const mainContextText = [fallbackTopic, ...validLessons].filter(Boolean).join(' ');
    const mainLawIds = getMatchingSpecialLawIds(mainContextText);
    const mainLawTerms = getSpecialLawSearchTerms(mainContextText);
    const allowedLawIds = mainLawIds.length > 0 ? new Set(mainLawIds) : null;

    const trySelectWithTerms = async (terms, matchOpts = {}) => {
      if (!terms || terms.length === 0) return false;
      const effectiveOpts = {
        ...matchOpts,
        ...(allowedLawIds ? { allowedLawIds } : {}),
        excludeNorms: selectedOptionNorms
      };
      const matched = await matchOptionInOpenDropdown(filterInput, terms, effectiveOpts);
      if (!matched) return false;
      const matchedNorm = normalizeCourseIndexKey(matched.innerText || matched.textContent);
      if (matchedNorm && selectedOptionNorms.has(matchedNorm)) return false;
      if (matchedNorm) selectedOptionNorms.add(matchedNorm);
      if (!isOptionRowChecked(matched)) {
        clickOptionRow(matched);
        matchedCount += 1;
        await sleepMs(180);
      } else {
        matchedCount += 1;
      }
      return true;
    };

    // 1A. Prioridade máxima: se o card/aula já define uma Lei Principal (ex.: ECA), marca essa lei imediatamente
    if (mainLawTerms.length > 0) {
      await trySelectWithTerms(mainLawTerms, {
        minScore: 220,
        allowEmptyFallback: true,
        allowedLawIds
      });

      if (matchedCount > 0 && isSpecialLegislationSubjectName(subjectName)) {
        await closeOpenDropdown(trigger, filterInput);
        await sleepMs(200);
        return true;
      }
    }

    // 1. Subassuntos do Índice/Bizus da aula: marca apenas subpastas específicas compatíveis
    if (validSubtopics.length > 0) {
      const forbiddenParentNorms = buildBroadParentNorms([subjectName, fallbackTopic, ...validLessons]);
      for (const subtopic of validSubtopics) {
        if (isDestroyed) break;

        if (allowedLawIds) {
          const subLawIds = getMatchingSpecialLawIds(subtopic);
          if (subLawIds.some(id => !allowedLawIds.has(id))) {
            continue;
          }
        }

        const expanded = expandSubtopicToSearchGroups(subtopic);
        if (!expanded || !expanded.primary || expanded.primary.length === 0) continue;

        const directHit = await trySelectWithTerms(expanded.primary, {
          forbiddenNorms: forbiddenParentNorms,
          minScore: 420,
          allowEmptyFallback: false,
          allowedLawIds
        });

        if (!directHit && Array.isArray(expanded.splitFallbacks) && expanded.splitFallbacks.length > 0) {
          for (const splitTerms of expanded.splitFallbacks) {
            if (isDestroyed) break;
            if (allowedLawIds) {
              const splitLawIds = getMatchingSpecialLawIds(splitTerms.join(' '));
              if (splitLawIds.some(id => !allowedLawIds.has(id))) {
                continue;
              }
            }
            await trySelectWithTerms(splitTerms, {
              forbiddenNorms: forbiddenParentNorms,
              minScore: 420,
              allowEmptyFallback: false,
              allowedLawIds
            });
          }
        }
      }
    }

    // 1B. Caso não houvesse lei principal no título/tópico, verifica se o contexto geral revelou uma única lei específica
    if (mainLawTerms.length === 0) {
      const allContextText = [fallbackTopic, ...validLessons, ...validSubtopics].filter(Boolean).join(' ');
      const allContextLawTerms = getSpecialLawSearchTerms(allContextText);
      if (allContextLawTerms.length > 0) {
        const hasContextLawSelected = Array.from(selectedOptionNorms).some(
          selNorm => scoreOptionMatch(selNorm, allContextLawTerms) >= 400
        );
        if (!hasContextLawSelected) {
          await trySelectWithTerms(allContextLawTerms, { minScore: 220, allowEmptyFallback: true });
        }
      }
    }

    // 2. Fallback seguro: se não havia índice ou nenhum subassunto específico casou na árvore, filtra pelo título da aula
    if (matchedCount === 0) {
      for (const lessonTitle of validLessons) {
        if (isDestroyed) break;
        const lessonTerms = getLessonSearchTerms(lessonTitle);
        if (lessonTerms.length === 0) continue;
        await trySelectWithTerms(lessonTerms, { minScore: 200, allowEmptyFallback: true, allowedLawIds });
      }
    }

    if (matchedCount === 0 && hasFallback) {
      const fallbackTerms = getTopicSearchTerms(fallbackTopic);
      await trySelectWithTerms(fallbackTerms, { minScore: 200, allowEmptyFallback: true, allowedLawIds });
    }

    await closeOpenDropdown(trigger, filterInput);
    await sleepMs(200);
    return matchedCount > 0;
  }

  function findCaveiraClearFiltersButton() {
    const rawCandidates = Array.from(
      document.querySelectorAll('button, [role="button"], .q-btn, a, div, span')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 55 || r.width > 340 || r.height < 18 || r.height > 64) return false;

      let txt = normalizeFilterText(el.innerText || el.textContent);
      txt = txt
        .replace(/\b(refresh|sync|clear|close|restart_alt|autorenew|delete_sweep|replay)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return txt === 'limpar filtros' || txt === 'limpar filtro';
    });

    const resolved = [];
    for (const el of rawCandidates) {
      let clickable = el.closest('button, [role="button"], .q-btn, a');
      if (!clickable) {
        let cur = el;
        for (let depth = 0; depth < 4 && cur && cur !== document.body; depth++) {
          const r = cur.getBoundingClientRect();
          const cursorStyle = window.getComputedStyle(cur).cursor;
          if (r.height >= 20 && r.height <= 64 && r.width >= 55 && r.width <= 340 && (cursorStyle === 'pointer' || depth === 0)) {
            clickable = cur;
            if (cursorStyle === 'pointer') break;
          }
          cur = cur.parentElement;
        }
      }
      if (clickable && !clickable.closest('#qg-caveira-hud') && isElementVisible(clickable)) {
        resolved.push(clickable);
      }
    }

    const unique = Array.from(new Set(resolved));
    unique.sort((a, b) => {
      const aNative = a.matches('button, [role="button"], .q-btn, a') ? 0 : 1;
      const bNative = b.matches('button, [role="button"], .q-btn, a') ? 0 : 1;
      if (aNative !== bNative) return aNative - bNative;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    return unique[0] || null;
  }

  function hasActiveCaveiraFilters() {
    for (const labelWord of ['Disciplina', 'Assunto', 'Caderno', 'Banca', 'Nivel', 'Ano', 'Dificuldade']) {
      const trigger = findFilterDropdownTrigger(labelWord);
      if (trigger) {
        const txt = normalizeFilterText(trigger.innerText || trigger.textContent);
        if (/\b\d+\s+selecionad/.test(txt)) return true;
      }
    }
    const appliedInfo = findAppliedFiltersSection();
    if (appliedInfo && appliedInfo.container) {
      const cTxt = normalizeFilterText(appliedInfo.container.innerText || appliedInfo.container.textContent);
      if (/\b(disciplina|assunto|caderno|banca|nivel|ano|dificuldade|palavra)\b/.test(cTxt)) {
        return true;
      }
    }
    return false;
  }

  async function removeAppliedFilterChipsFallback() {
    const appliedInfo = findAppliedFiltersSection();
    if (!appliedInfo || !appliedInfo.container) return;

    const removeIcons = Array.from(
      appliedInfo.container.querySelectorAll('button, [role="button"], .q-chip__icon--remove, svg, i, span')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 10 || r.width > 34 || r.height < 10 || r.height > 34) return false;
      const parentBtn = el.closest('button, [role="button"], a');
      if (parentBtn) {
        const pTxt = normalizeFilterText(parentBtn.innerText || parentBtn.textContent);
        if (
          pTxt.includes('limpar filtros') ||
          pTxt.includes('filtrar') ||
          pTxt.includes('simulado') ||
          pTxt.includes('mostrar filtros')
        ) {
          return false;
        }
      }
      const txt = normalizeFilterText(el.innerText || el.textContent);
      return !txt || txt === 'x' || txt === 'close' || txt === 'cancel' || txt === 'clear';
    });

    for (const icon of removeIcons.slice(0, 25)) {
      if (isDestroyed || !icon.isConnected || !isElementVisible(icon)) continue;
      const clickable = icon.closest('button, [role="button"]') || icon;
      clickElementRealistically(clickable);
      await sleepMs(80);
    }
  }

  async function clearPreviousCaveiraFilters() {
    if (isDestroyed) return;
    const clearBtn = findCaveiraClearFiltersButton();
    const hasActiveBefore = hasActiveCaveiraFilters() || Boolean(findAppliedFiltersSection());
    if (!clearBtn && !hasActiveBefore) return;

    if (clearBtn) {
      try {
        clearBtn.scrollIntoView({ block: 'center', inline: 'nearest' });
      } catch (_) {}
      await sleepMs(100);
      clickElementRealistically(clearBtn);
      const nestedBtn = !clearBtn.matches('button, [role="button"], .q-btn')
        ? clearBtn.querySelector('button, [role="button"], .q-btn')
        : null;
      if (nestedBtn && nestedBtn !== clearBtn) {
        clickElementRealistically(nestedBtn);
      }
      for (let i = 0; i < 8; i++) {
        if (isDestroyed) return;
        await sleepMs(180);
        if (!hasActiveCaveiraFilters()) break;
      }
    }

    if (hasActiveCaveiraFilters()) {
      const retryBtn = findCaveiraClearFiltersButton();
      if (retryBtn) {
        clickElementRealistically(retryBtn);
        await sleepMs(350);
      }
      if (hasActiveCaveiraFilters()) {
        await removeAppliedFilterChipsFallback();
        await sleepMs(250);
      }
    }
  }

  async function selectUnresolvedQuestionsFilter() {
    if (isDestroyed) return false;
    const rawCandidates = Array.from(
      document.querySelectorAll('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label, div, span, a')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.width > 260 || r.height < 18 || r.height > 60) return false;
      const txt = normalizeFilterText(el.innerText || el.textContent);
      return txt === 'nao resolvidas' || txt === 'nao resolvida';
    });

    const pills = [];
    for (const el of rawCandidates) {
      const target = el.closest('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') || el;
      if (!target || target.closest('#qg-caveira-hud') || !isElementVisible(target)) continue;
      const tr = target.getBoundingClientRect();
      if (tr.width < 40 || tr.width > 260 || tr.height < 18 || tr.height > 60) continue;
      const targetTxt = normalizeFilterText(target.innerText || target.textContent);
      if (targetTxt !== 'nao resolvidas' && targetTxt !== 'nao resolvida') continue;
      if (!pills.includes(target)) pills.push(target);
    }

    if (pills.length === 0) return false;

    pills.sort((a, b) => {
      const aInteractive = a.matches('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') ? 0 : 1;
      const bInteractive = b.matches('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') ? 0 : 1;
      if (aInteractive !== bInteractive) return aInteractive - bInteractive;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });

    const pill = pills[0];
    if (
      pill.getAttribute('aria-pressed') === 'true' ||
      pill.getAttribute('aria-selected') === 'true' ||
      pill.getAttribute('aria-checked') === 'true'
    ) {
      return true;
    }

    clickElementRealistically(pill);
    await sleepMs(250);
    return true;
  }

  function resolveSubtopicsFromCourseCache(lessonsList, fallbackTopic, subjectName) {
    return new Promise((resolve) => {
      if (!isExtensionContextValid()) {
        resolve({ subtopics: [], rawIndexText: '' });
        return;
      }
      try {
        chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
          if (chrome.runtime.lastError || isDestroyed) {
            resolve({ subtopics: [], rawIndexText: '' });
            return;
          }
          const cache = res?.[COURSE_INDEX_CACHE_KEY];
          if (!cache || typeof cache !== 'object') {
            resolve({ subtopics: [], rawIndexText: '' });
            return;
          }

          const byLesson = (cache.byLesson && typeof cache.byLesson === 'object') ? cache.byLesson : {};
          const candidates = [...(Array.isArray(lessonsList) ? lessonsList : []), fallbackTopic].filter(Boolean);
          let matchedEntry = null;

          // 1. Chave exata
          for (const c of candidates) {
            const k = normalizeCourseIndexKey(c);
            if (k && byLesson[k]?.rawIndexText) {
              matchedEntry = byLesson[k];
              break;
            }
          }

          // 2. Correspondência canônica parcial
          if (!matchedEntry) {
            const canon = (s) => normalizeCourseIndexKey(s).replace(/\bparte\s*0*(\d+)\b/g, 'parte $1').replace(/\baula\s*0*(\d+)\b/g, 'aula $1').trim();
            const candCanon = candidates.map(canon).filter(Boolean);
            for (const [k, entry] of Object.entries(byLesson)) {
              if (!entry?.rawIndexText) continue;
              const eCanon = canon(entry.lessonTitle || k);
              if (!eCanon) continue;
              if (candCanon.some(c => c === eCanon || (c.length >= 10 && eCanon.includes(c)) || (eCanon.length >= 10 && c.includes(eCanon)))) {
                matchedEntry = entry;
                break;
              }
            }
          }

          // 3. Fallback opcional: último índice capturado recentemente se compartilhar palavras-chave relevantes com a aula
          if (!matchedEntry && cache.latest?.rawIndexText && (Date.now() - (cache.latest.capturedAt || 0)) < 1800000) {
            const latestCanon = normalizeCourseIndexKey(cache.latest.lessonTitle || '');
            const combinedCand = candidates.map(normalizeCourseIndexKey).join(' ');
            const sigWords = combinedCand.split(' ').filter(w => w.length >= 5);
            if (latestCanon && sigWords.some(w => latestCanon.includes(w))) {
              matchedEntry = cache.latest;
            }
          }

          if (!matchedEntry) {
            resolve({ subtopics: [], rawIndexText: '' });
            return;
          }

          const parsed = matchedEntry.rawIndexText
            ? parseCourseIndexSubtopics(matchedEntry.rawIndexText, [subjectName, fallbackTopic, ...(Array.isArray(lessonsList) ? lessonsList : [])])
            : (Array.isArray(matchedEntry.subtopics) ? matchedEntry.subtopics : []);
          resolve({ subtopics: parsed, rawIndexText: matchedEntry.rawIndexText || '' });
        });
      } catch (_) {
        resolve({ subtopics: [], rawIndexText: '' });
      }
    });
  }

  async function applyCaveiraPracticeFilter(filterObj) {
    if (isDestroyed || !filterObj || isApplyingFilter) return;
    const subject = String(filterObj.subject || '').trim();
    const lessons = Array.isArray(filterObj.lessons) ? filterObj.lessons.map(l => String(l || '').trim()).filter(Boolean) : [];
    const topic = String(filterObj.topic || '').trim();
    const fallbackTopic = String(filterObj.fallbackTopic || topic || '').trim();
    const effectiveLessons = lessons.length > 0 ? lessons : (topic ? [topic] : []);
    const displayTarget = effectiveLessons.join(' • ') || fallbackTopic;
    if (!subject && !displayTarget) return;

    const rawIndexText = String(filterObj.rawIndexText || '').trim();
    const rawSubtopicsInput = Array.isArray(filterObj.subtopics)
      ? filterObj.subtopics.map(s => String(s || '').trim()).filter(Boolean)
      : [];

    const sourceTextForParse = rawIndexText || rawSubtopicsInput.join('\n');
    let effectiveSubtopics = sourceTextForParse
      ? parseCourseIndexSubtopics(sourceTextForParse, [subject, fallbackTopic, ...effectiveLessons])
      : [];

    if (effectiveSubtopics.length === 0 && !rawIndexText) {
      const cached = await resolveSubtopicsFromCourseCache(effectiveLessons, fallbackTopic, subject);
      if (cached.subtopics.length > 0) {
        effectiveSubtopics = cached.subtopics;
      }
    }

    isApplyingFilter = true;
    activePracticeFilter = {
      subject,
      lessons: effectiveLessons,
      topic: displayTarget,
      fallbackTopic,
      subtopics: effectiveSubtopics,
      rawIndexText
    };
    renderFilterBanner('⏳ Abrindo Banco de Questões...');

    try {
      chrome.storage.local.remove([PENDING_FILTER_KEY]);
    } catch (_) {}

    try {
      // 1. Se ainda não estiver no Banco de Questões (sem dropdown Disciplina), navega para a aba Questões
      if (!findFilterDropdownTrigger('Disciplina')) {
        const navCandidates = Array.from(document.querySelectorAll('a, button, [role="tab"], .q-tab, .q-item'));
        const questTab = navCandidates.find(el => {
          if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
          const txt = normalizeFilterText(el.innerText || el.textContent);
          return txt === 'questoes' || txt === 'banco de questoes' || txt === 'resolver questoes';
        });
        if (questTab) {
          clickElementRealistically(questTab);
        }
      }

      // Aguarda até ~5s o dropdown de Disciplina aparecer
      for (let waitIdx = 0; waitIdx < 14; waitIdx++) {
        if (isDestroyed) return;
        if (findFilterDropdownTrigger('Disciplina')) break;
        await sleepMs(350);
      }

      // Limpa quaisquer filtros anteriores (de aulas passadas) antes de aplicar os novos
      renderFilterBanner('⏳ Limpando filtros anteriores...');
      await clearPreviousCaveiraFilters();
      await sleepMs(200);

      // Sempre marca o filtro de questões "Não resolvidas" antes de abrir os dropdowns
      renderFilterBanner('⏳ Marcando: Não resolvidas...');
      const unresolvedOk = await selectUnresolvedQuestionsFilter();

      let subjectOk = true;
      let topicOk = true;

      // 2. Seleciona Disciplina primeiro (pois libera/carrega os Assuntos no Caveira)
      if (subject) {
        renderFilterBanner(`⏳ Selecionando Disciplina: ${subject}...`);
        const subjectTerms = getSubjectSearchTerms(subject);
        subjectOk = await selectCaveiraDropdownOption('Disciplina', subjectTerms);
        await sleepMs(500);
      }

      // 3. Seleciona Assunto(s) pelos subassuntos do Índice (quando houver) ou pelo título da(s) aula(s)
      if (effectiveSubtopics.length > 0 || effectiveLessons.length > 0 || fallbackTopic) {
        if (effectiveSubtopics.length > 0) {
          renderFilterBanner(`⏳ Filtrando ${effectiveSubtopics.length} subassuntos do Índice...`);
        } else {
          renderFilterBanner(`⏳ Selecionando Aula(s): ${displayTarget}...`);
        }
        topicOk = await selectCaveiraLessonsInDropdown(effectiveLessons, fallbackTopic, effectiveSubtopics, subject);
        await sleepMs(300);
      }

      // 4. Localiza e aciona o botão explícito de busca/filtragem (inclui .q-btn, div/span estilizados e texto com ícones)
      await sleepMs(250);
      const applyBtn = findCaveiraFilterSubmitButton();
      if (applyBtn) {
        try {
          applyBtn.scrollIntoView({ block: 'center', inline: 'nearest' });
        } catch (_) {}
        await sleepMs(120);
        clickElementRealistically(applyBtn);
        const nestedBtn = applyBtn.querySelector('button, [role="button"], .q-btn');
        if (nestedBtn && nestedBtn !== applyBtn) {
          clickElementRealistically(nestedBtn);
        }
        await sleepMs(300);
      }
      try {
        window.scrollBy({ top: 260, behavior: 'smooth' });
      } catch (_) {}

      const summary = [subject, displayTarget].filter(Boolean).join(' • ');
      const subtag = effectiveSubtopics.length > 0 ? ` • ${effectiveSubtopics.length} subassuntos` : '';
      if (subjectOk && topicOk && applyBtn) {
        const statusTag = unresolvedOk ? 'Não resolvidas' : 'Não resolvidas pendente';
        renderFilterBanner(`✅ Filtro aplicado (${statusTag}${subtag}): ${summary}`);
      } else if (subjectOk && topicOk) {
        renderFilterBanner(`⚠️ Selecionado (clique em Filtrar): ${summary}`);
      } else {
        renderFilterBanner(`⚠️ Parcial (${subjectOk ? 'Disciplina OK' : 'Disciplina não encontrada'} / ${topicOk ? 'Assunto OK' : 'Selecione o assunto'})`);
      }
    } finally {
      isApplyingFilter = false;
    }
  }

  function findCaveiraFilterSubmitButton() {
    const allowedExact = ['filtrar', 'filtrar questoes', 'aplicar', 'aplicar filtros', 'buscar', 'buscar questoes', 'pesquisar'];
    const blockedWords = ['carreiras', 'digite', 'limpar', 'salvar', 'caderno', 'filtros'];

    const rawCandidates = Array.from(
      document.querySelectorAll('button, [role="button"], .q-btn, a, input[type="button"], input[type="submit"], div, span')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 36 || r.width > 380 || r.height < 20 || r.height > 72) return false;

      let txt = normalizeFilterText(el.tagName === 'INPUT' ? el.value : (el.innerText || el.textContent));
      txt = txt
        .replace(/\b(filter_alt|filter_list|search|tune|find_in_page)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!txt || txt.length > 40) return false;
      if (blockedWords.some(bw => txt.includes(bw))) return false;

      return allowedExact.includes(txt) || txt.startsWith('filtrar ') || txt.endsWith(' filtrar');
    });

    const resolved = [];
    for (const el of rawCandidates) {
      let clickable = el.closest('button, [role="button"], .q-btn, a, input[type="button"], input[type="submit"]');
      if (!clickable) {
        let cur = el;
        for (let depth = 0; depth < 4 && cur && cur !== document.body; depth++) {
          const r = cur.getBoundingClientRect();
          const cursorStyle = window.getComputedStyle(cur).cursor;
          if (r.height >= 28 && r.height <= 60 && r.width >= 36 && r.width <= 380 && (cursorStyle === 'pointer' || depth === 0)) {
            clickable = cur;
            if (cursorStyle === 'pointer') break;
          }
          cur = cur.parentElement;
        }
      }
      if (clickable && !clickable.closest('#qg-caveira-hud') && isElementVisible(clickable)) {
        resolved.push(clickable);
      }
    }

    const unique = Array.from(new Set(resolved));
    unique.sort((a, b) => {
      const aNative = a.matches('button, [role="button"], .q-btn, input[type="submit"], input[type="button"]') ? 0 : 1;
      const bNative = b.matches('button, [role="button"], .q-btn, input[type="submit"], input[type="button"]') ? 0 : 1;
      if (aNative !== bNative) return aNative - bNative;
      const aExact = normalizeFilterText(a.innerText || a.textContent || a.value || '') === 'filtrar' ? 0 : 1;
      const bExact = normalizeFilterText(b.innerText || b.textContent || b.value || '') === 'filtrar' ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    return unique[0] || null;
  }

  function updateHudUser() {
    const userTextEl = document.getElementById('qg-hud-user-text');
    const userBarEl = document.getElementById('qg-hud-user-bar');
    if (!userTextEl || !userBarEl) return;
    if (cachedActiveUserId) {
      const label = (cachedActiveUserLabel || '').trim() || `ID ${String(cachedActiveUserId).slice(0, 8)}...`;
      userTextEl.textContent = `👤 ${label}`;
      userTextEl.title = label;
      userBarEl.style.color = '#86efac';
      userBarEl.style.background = 'rgba(16, 185, 129, 0.08)';
    } else {
      userTextEl.textContent = '🟡 Faça login no QG para vincular';
      userTextEl.title = 'Nenhuma conta vinculada';
      userBarEl.style.color = '#fde68a';
      userBarEl.style.background = 'rgba(251, 191, 36, 0.06)';
    }
  }

  function startTimerInterval() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      checkDailySessionReset();
      // Só cronometra se a aba estiver visível, o timer estiver ativo e houver questão ativa na tela
      if (document.visibilityState === 'visible' && isTimerRunning && currentQuestionId) {
        timerSeconds = (questionTimers.get(currentQuestionId) || 0) + 1;
        questionTimers.set(currentQuestionId, timerSeconds);
        renderTimerDisplay();
      }
    }, 1000);
  }

  function renderTimerDisplay() {
    const timerEl = document.getElementById('qg-timer');
    if (!timerEl) return;
    const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
    if (isTimerRunning) {
      timerEl.style.opacity = '1';
      timerEl.style.color = timerSeconds >= 150 ? '#ef4444' : timerSeconds >= 90 ? '#f97316' : '#fbbf24';
    } else {
      timerEl.style.opacity = '0.7';
    }
  }

  function pauseTimer() {
    isTimerRunning = false;
  }

  function clearActiveQuestionState() {
    if (!currentQuestionId && !isTimerRunning) {
      if (isCoursePage() && currentCourseIndexStatus?.count > 0) {
        const currentQEl = document.getElementById('qg-current-q-id');
        if (currentQEl) {
          currentQEl.textContent = `📑 Índice capturado (${currentCourseIndexStatus.count} subassuntos)`;
          currentQEl.title = currentCourseIndexStatus.preview || '';
        }
      }
      return;
    }
    isTimerRunning = false;
    currentQuestionId = null;
    timerSeconds = 0;
    dismissPrompt();
    renderTimerDisplay();
    renderQuestionHistory(null, false);
    const currentQEl = document.getElementById('qg-current-q-id');
    if (currentQEl) {
      if (isCoursePage() && currentCourseIndexStatus?.count > 0) {
        currentQEl.textContent = `📑 Índice capturado (${currentCourseIndexStatus.count} subassuntos)`;
        currentQEl.title = currentCourseIndexStatus.preview || '';
      } else {
        currentQEl.textContent = 'Aguardando questão...';
      }
    }
  }

  // --- MEMÓRIA TÁTICA / ALERTA DE QUESTÃO REPETIDA (#9) ---
  function renderQuestionHistory(qId, isCurrentQuestionAnswered = false) {
    const box = document.getElementById('qg-hud-history-box');
    if (!box) return;

    if (!qId) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    const previousData = questionsCache.find(q => q && q.id === qId);
    if (!previousData || !previousData.timestamp) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    const qDate = new Date(previousData.timestamp);
    const now = new Date();
    const diffMs = Math.max(0, now - qDate);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const timeLabel = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'ontem' : `há ${diffDays} dias`;

    const isHit = Boolean(previousData.hit);
    const statusText = isHit
      ? (previousData.confidence === 'chute' ? 'ACERTOU NO CHUTE 🎲' : previousData.confidence === 'duvida' ? 'ACERTOU COM DÚVIDA 🤔' : 'ACERTOU ANTERIORMENTE ✓')
      : `ERROU ANTERIORMENTE ✗ (${previousData.errorReason === 'atencao' ? 'Atenção' : previousData.errorReason === 'interpretacao' ? 'Interpretação' : 'Teoria'})`;

    const bizuHtml = previousData.userNote
      ? `<div class="qg-history-bizu">💡 <strong>Seu Bizu:</strong> ${escapeHtml(previousData.userNote)}</div>`
      : '';

    // Anti-spoiler: só exibe o que marcou e o gabarito quando a questão já estiver respondida nesta tentativa
    let choicesHtml = '';
    if (isCurrentQuestionAnswered) {
      const activeChoice = (activeQuestionData && activeQuestionData.id === qId) ? activeQuestionData.userChoice : null;
      const activeGabarito = (activeQuestionData && activeQuestionData.id === qId) ? activeQuestionData.correctChoice : null;
      const userChoice = activeChoice || previousData.userChoice || '?';
      const gabarito = activeGabarito || previousData.correctChoice || '?';
      choicesHtml = `<div style="font-size: 9px; opacity: 0.85; margin-top: 1px;">Você marcou: <strong>${userChoice}</strong> | Gabarito: <strong>${gabarito}</strong></div>`;
    }

    box.className = `qg-hud-history ${isHit ? 'hit-history' : 'error-history'}`;
    box.innerHTML = `
      <div>
        <span class="qg-history-badge">${isHit ? '✓ HISTÓRICO' : '⚠️ ATENÇÃO: REPETIDA'}</span>
        <div style="font-weight: 700;">${statusText} (${timeLabel})</div>
        ${choicesHtml}
      </div>
      ${bizuHtml}
    `;
    box.style.display = 'block';
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function switchActiveQuestion(newQId, isAlreadyAnswered = false) {
    if (!newQId) return;
    const isDifferentQuestion = currentQuestionId !== newQId;
    if (!isDifferentQuestion && isTimerRunning === !isAlreadyAnswered) return;

    currentQuestionId = newQId;
    timerSeconds = questionTimers.get(newQId) || 0;
    isTimerRunning = !isAlreadyAnswered;

    if (isDifferentQuestion) {
      lastUserClickedChoice = null;
      // Se o usuário rolou para outra questão diferente da que acabou de responder, fecha o prompt anterior
      if (!activeQuestionData || activeQuestionData.id !== newQId) {
        dismissPrompt();
      }
    }

    renderQuestionHistory(newQId, isAlreadyAnswered);
    renderTimerDisplay();

    const currentQEl = document.getElementById('qg-current-q-id');
    if (currentQEl) {
      currentQEl.textContent = isAlreadyAnswered ? `${newQId} ✓` : newQId;
    }
  }

  // --- 3. ATUALIZAÇÃO VISUAL DAS ESTATÍSTICAS ---
  function updateHudGoal() {
    const elRatio = document.getElementById('qg-hud-goal-ratio');
    const elBar = document.getElementById('qg-hud-goal-bar');
    if (!elRatio || !elBar) return;

    const current = Number(sessionStats.total) || 0;
    const goal = cachedDailyGoal || 50;
    const pct = Math.min(100, Math.round((current / goal) * 100));

    if (current >= goal) {
      elRatio.innerHTML = `<span style="color:#10b981;">🏆 ${current}/${goal} (100%)</span>`;
      elBar.style.background = '#10b981';
      elBar.style.width = '100%';
    } else {
      elRatio.textContent = `${current} / ${goal} (${pct}%)`;
      elBar.style.background = 'linear-gradient(90deg, #0284c7, #10b981)';
      elBar.style.width = `${pct}%`;
    }
  }

  function updateHudStats() {
    const elTotal = document.getElementById('qg-stat-total');
    const elHits = document.getElementById('qg-stat-hits');
    const elErrors = document.getElementById('qg-stat-errors');
    const elNet = document.getElementById('qg-stat-net');
    if (!elTotal) return;

    elTotal.textContent = sessionStats.total;
    elHits.textContent = sessionStats.hits;
    elErrors.textContent = sessionStats.errors;
    const rate = sessionStats.total > 0 ? Math.round((sessionStats.hits / sessionStats.total) * 100) : 0;
    elNet.textContent = `${rate}%`;
    elNet.className = `qg-hud-stat-value ${rate >= 70 ? 'green' : rate >= 50 ? 'gold' : sessionStats.total === 0 ? 'gold' : 'red'}`;

    updateHudGoal();
  }

  // --- 4. SELEÇÃO DE CARDS E DETECÇÃO POR VIEWPORT (SCROLL) ---
  function getQuestionCards() {
    const allCards = document.querySelectorAll('.q-card');
    return Array.from(allCards).filter(card => {
      if (card.closest('#qg-caveira-hud')) return false;
      if (card.parentElement && card.parentElement.closest('.q-card')) return false;
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const hasNumber = Boolean(card.querySelector('.number'));
      const hasAlternatives = Boolean(card.querySelector('.question-alternatives, .alternative, .alternative-letter'));
      return hasNumber && hasAlternatives;
    });
  }

  // Identifica qual card de questão está no centro de leitura da tela durante a rolagem
  function findCardInViewport(cards) {
    if (!cards || cards.length === 0) return null;
    if (cards.length === 1) return cards[0];

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    // Ponto focal de leitura do olho humano (cerca de 38% a partir do topo da janela)
    const focalY = viewportHeight * 0.38;

    let bestCard = null;
    let bestDistance = Infinity;

    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      // Ignora cards que estão totalmente fora da tela
      if (rect.bottom < 40 || rect.top > viewportHeight - 40) continue;

      // Se o card atravessa a linha de leitura principal (focalY), ele é o card ativo imediato
      if (rect.top <= focalY && rect.bottom >= focalY) {
        return card;
      }

      // Caso contrário, pega o card mais próximo da linha focal de leitura
      const cardCenter = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(cardCenter - focalY);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestCard = card;
      }
    }

    return bestCard || cards[0];
  }

  function extractQuestionId(card) {
    if (!card) return null;
    const numberEl = card.querySelector('.number');
    if (numberEl) {
      const match = numberEl.textContent.match(/Q\s*[:.-]?\s*(\d{2,9})/i);
      if (match) return `Q${match[1]}`;
    }
    return null;
  }

  function isCardAnswered(card) {
    if (!card) return false;

    // Regra 1: O box de estatísticas com feedback oficial de resposta
    const statsBox = card.querySelector('.stats-box');
    if (statsBox) {
      const text = (statsBox.textContent || '').toUpperCase();
      if (
        Boolean(statsBox.querySelector('.bg-correct-1, .bg-correct-2, .bg-incorrect-1, .bg-incorrect-2, .title-stats')) ||
        text.includes('PARABÉNS') ||
        text.includes('ERROU') ||
        text.includes('VOCÊ ACERTOU') ||
        text.includes('VOCÊ ERROU') ||
        text.includes('RESPOSTA CORRETA') ||
        text.includes('GABARITO DEFINITIVO')
      ) {
        return true;
      }
    }

    // Regra 2: Alternativas marcadas com a cor verde ou vermelha do gabarito (dentro de .question-alternatives ou .alternative)
    // ATENÇÃO: NÃO usar [class*="correct"] genérico porque classes do Quasar como "items-start" ou "justify-start" ou outras do Quasar podem dar falso positivo!
    const altScope = card.querySelector('.question-alternatives') || card;
    const hasColoredAlternative = Boolean(
      altScope.querySelector(
        '.alternative.bg-correct-1, .alternative.bg-correct-2, .alternative.bg-incorrect-1, .alternative.bg-incorrect-2, ' +
        '.alternative-letter.bg-correct-1, .alternative-letter.bg-correct-2, .alternative-letter.bg-incorrect-1, .alternative-letter.bg-incorrect-2, ' +
        '.bg-positive, .bg-negative, .text-positive, .text-negative'
      )
    );
    if (hasColoredAlternative) return true;

    return false;
  }

  function classifyPRFCategory(subject, topic, content) {
    const s = (subject || '').toLowerCase();
    const t = (topic || '').toLowerCase();
    const c = (content || '').toLowerCase();
    const full = `${s} ${t} ${c}`;

    // REGRA DE OURO 1: Se a matéria informada pelo Caveira já for expressamente uma disciplina do Bloco I
    if (s.includes('informática') || s.includes('informatica') || t.includes('informática') || t.includes('segurança da informação') || t.includes('redes')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Informática' };
    }
    if (s.includes('português') || s.includes('portuguesa') || s.includes('língua portuguesa')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Língua Portuguesa' };
    }
    if (s.includes('raciocínio lógico') || s.includes('raciocinio logico') || s.includes('rlm') || s.includes('matemática') || s.includes('física') || s.includes('fisica')) {
      return { bloco: 'Bloco I', canonicalSubject: s.includes('física') || s.includes('fisica') ? 'Física' : 'Raciocínio Lógico-Matemático' };
    }
    if (s.includes('ética') || s.includes('etica') || s.includes('geopolítica') || s.includes('geopolitica') || s.includes('inglês') || s.includes('espanhol')) {
      const canonical = s.includes('ética') || s.includes('etica') ? 'Ética e Cidadania' : s.includes('geopolítica') || s.includes('geopolitica') ? 'Geopolítica' : 'Língua Estrangeira';
      return { bloco: 'Bloco I', canonicalSubject: canonical };
    }

    // REGRA DE OURO 2: Se for expressamente Legislação de Trânsito
    if (s.includes('trânsito') || s.includes('transito') || s.includes('ctb') || s.includes('contran')) {
      const subCat = (full.includes('contran') || full.includes('resolução') || full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes'))
        ? 'Resoluções do CONTRAN'
        : 'Legislação de Trânsito (CTB)';
      return { bloco: 'Bloco II', canonicalSubject: subCat };
    }

    // REGRA DE OURO 3: Se a matéria for Direito específico
    if (s.includes('constitucional')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Constitucional' };
    if (s.includes('administrativo')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Administrativo' };
    if (s.includes('processual penal')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Processual Penal' };
    if (s.includes('penal especial') || s.includes('legislação especial') || s.includes('leis especiais')) return { bloco: 'Bloco III', canonicalSubject: 'Legislação Penal Especial' };
    if (s.includes('direitos humanos')) return { bloco: 'Bloco III', canonicalSubject: 'Direitos Humanos' };
    if (s.includes('direito penal')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Penal' };

    // BLOCO II — Legislação de Trânsito
    if (
      full.includes('trânsito') || full.includes('transito') || full.includes('ctb') ||
      full.includes('9.503') || full.includes('contran') || full.includes('resolução') ||
      full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes') ||
      full.includes('sinalização') || full.includes('habilitação') || full.includes('sinistro')
    ) {
      const subCat = (full.includes('contran') || full.includes('resolução') || full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes'))
        ? 'Resoluções do CONTRAN'
        : 'Legislação de Trânsito (CTB)';
      return { bloco: 'Bloco II', canonicalSubject: subCat };
    }

    // BLOCO III — Direito e Conhecimentos Específicos
    if (full.includes('constitucional') || full.includes('constituição') || full.includes('art. 5') || full.includes('art. 144')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Constitucional' };
    }
    if (full.includes('administrativo') || full.includes('8.112') || full.includes('improbidade') || full.includes('8.429') || full.includes('14.133') || full.includes('licitaç') || full.includes('atos administrativos') || full.includes('poderes administrativos')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Administrativo' };
    }
    if (full.includes('processual penal') || full.includes('processo penal') || full.includes('inquérito') || full.includes('prisão em flagrante') || full.includes('ação penal')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Processual Penal' };
    }
    if (
      full.includes('legislação especial') || full.includes('leis especiais') || full.includes('11.343') ||
      full.includes('drogas') || full.includes('10.826') || full.includes('desarmamento') || full.includes('armas') ||
      full.includes('13.869') || full.includes('abuso de autoridade') || full.includes('9.455') || full.includes('tortura') ||
      full.includes('8.072') || full.includes('hediondos') || full.includes('12.850') || full.includes('organizações criminosas') ||
      full.includes('9.099') || full.includes('maria da penha') || full.includes('9.605') || full.includes('meio ambiente') ||
      full.includes('estatuto da criança') || full.includes('eca')
    ) {
      return { bloco: 'Bloco III', canonicalSubject: 'Legislação Penal Especial' };
    }
    if (full.includes('direitos humanos') || full.includes('pacto de san josé') || full.includes('declaração universal')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direitos Humanos' };
    }
    if (full.includes('direito penal') || full.includes('código penal') || full.includes('teoria do crime') || full.includes('crimes contra') || full.includes('peculato') || full.includes('homicídio')) {
      return { bloco: 'Bloco III', canonicalSubject: 'Direito Penal' };
    }

    // BLOCO I — Conhecimentos Básicos
    if (full.includes('português') || full.includes('portuguesa') || full.includes('gramática') || full.includes('redação oficial') || full.includes('sintaxe') || full.includes('crase') || full.includes('pontuação') || full.includes('concordância') || full.includes('regência')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Língua Portuguesa' };
    }
    if (full.includes('raciocínio lógico') || full.includes('rlm') || full.includes('matemática') || full.includes('probabilidade') || full.includes('estatística') || full.includes('combinatória') || full.includes('proposiç')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Raciocínio Lógico-Matemático' };
    }
    if (full.includes('informática') || full.includes('redes de computadores') || full.includes('segurança da informação') || full.includes('windows') || full.includes('linux') || full.includes('internet') || full.includes('malware') || full.includes('código de verificação') || full.includes('hash')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Informática' };
    }
    if (full.includes('física') || full.includes('cinemática') || full.includes('dinâmica') || full.includes('energia mecânica') || full.includes('colisões') || full.includes('quantidade de movimento')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Física' };
    }
    if (full.includes('ética') || full.includes('1.171') || full.includes('cidadania')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Ética e Cidadania' };
    }
    if (full.includes('geopolítica') || full.includes('geografia')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Geopolítica' };
    }
    if (full.includes('inglês') || full.includes('espanhol') || full.includes('língua estrangeira')) {
      return { bloco: 'Bloco I', canonicalSubject: 'Língua Estrangeira' };
    }

    return { bloco: 'Bloco I', canonicalSubject: subject || 'Geral' };
  }

  function extractQuestionData(card, qId) {
    if (!card) return null;

    // Busca disciplina e assunto pelo seletor específico ou vasculha a linha do cabeçalho ao lado do número
    let subject = 'Geral';
    let topic = 'Geral';

    const subjectEl = card.querySelector('.subject, [class*="subject"], [class*="disciplina"]');
    let rawSubjectText = subjectEl ? subjectEl.textContent.trim() : '';

    if (!rawSubjectText) {
      // Tenta achar na barra superior do card (onde fica o Q112072)
      const numberEl = card.querySelector('.number');
      const headerRow = numberEl ? (numberEl.closest('.row, .q-card__section, div') || numberEl.parentElement) : null;
      if (headerRow) {
        // Pega todos os textos da linha do cabeçalho que contenham '->'
        const possibleElements = headerRow.querySelectorAll('div, span, p');
        for (const el of possibleElements) {
          if (el.textContent && el.textContent.includes('->')) {
            rawSubjectText = el.textContent.trim();
            break;
          }
        }
      }
    }

    if (rawSubjectText) {
      const parts = rawSubjectText.split('->').map(s => s.trim()).filter(Boolean);
      subject = parts[0] || 'Geral';
      topic = parts.slice(1).join(' ➔ ') || subject;
    }

    const infoText = card.querySelector('.question-info')?.textContent || '';
    const bancaMatch = infoText.match(/Banca:\s*([^Ano\n]+)/i);
    const anoMatch = infoText.match(/Ano:\s*(\d+)/i);
    const diffMatch = infoText.match(/Dificuldade:\s*([^\n]+)/i);

    const banca = bancaMatch ? bancaMatch[1].trim() : 'CAVEIRA';
    const ano = anoMatch ? anoMatch[1].trim() : '2026';
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Média';

    const content = card.querySelector('.content')?.innerText?.trim() || '';
    const { bloco, canonicalSubject } = classifyPRFCategory(subject, topic, content);

    const statsBox = card.querySelector('.stats-box');
    const statsText = statsBox ? statsBox.textContent : '';

    let correctLetterFromDom = null;
    let incorrectLetterFromDom = null;
    const altScope = card.querySelector('.question-alternatives') || card;
    const altItems = altScope.querySelectorAll('.alternative, [class*="alternative"]');

    altItems.forEach(altEl => {
      const letterEl = altEl.querySelector('.alternative-letter, [class*="letter"]') || altEl;
      let rawLetter = (altEl.querySelector('.alternative-letter, [class*="letter"]')?.textContent || '').trim().toUpperCase();
      if (!rawLetter || rawLetter.length > 2) {
        // Fallback: tenta pegar do início do texto ou atributo
        const match = (altEl.textContent || '').trim().match(/^([A-E])\b/i);
        if (match) rawLetter = match[1].toUpperCase();
      }
      if (!rawLetter || rawLetter.length > 2) return;

      const combinedClasses = `${altEl.className || ''} ${letterEl.className || ''} ${altEl.parentElement?.className || ''}`;
      const styleAttr = `${altEl.getAttribute('style') || ''} ${letterEl.getAttribute('style') || ''}`;

      const isRed =
        /\b(bg-incorrect(?:-\d+)?|incorrect|is-wrong|wrong|bg-negative|text-negative|danger)\b/i.test(combinedClasses) ||
        styleAttr.includes('rgb(239, 68, 68)') ||
        styleAttr.includes('#ef4444') ||
        styleAttr.includes('red');

      const isGreen =
        !isRed && (
          /\b(bg-correct(?:-\d+)?|correct|is-correct|bg-positive|text-positive|success)\b/i.test(combinedClasses) ||
          styleAttr.includes('rgb(16, 185, 129)') ||
          styleAttr.includes('#10b981') ||
          styleAttr.includes('green')
        );

      if (isRed) {
        incorrectLetterFromDom = rawLetter;
      } else if (isGreen) {
        correctLetterFromDom = rawLetter;
      }
    });

    // Também verifica se há indicação de resposta no texto do card ou box de estatísticas
    const fullCardText = card.innerText || card.textContent || '';
    const statsAnswerMatch = statsText.match(/(?:Resposta correta|Gabarito|Alternativa correta|Gabarito definitivo|Resposta)\s*[:=]?\s*\(?([A-E])\)?/i) ||
                             fullCardText.match(/(?:Resposta correta|Gabarito|Alternativa correta|Gabarito definitivo|Resposta)\s*[:=]?\s*\(?([A-E])\)?/i);

    const hasStatsIncorrect =
      Boolean(statsBox?.querySelector('.bg-incorrect-1, .bg-incorrect-2, .bg-negative, .text-negative')) ||
      /\b(VOC[EÊ]\s+ERROU|ERROU|INCORRETA|RESPOSTA\s+ERRADA)\b/i.test(statsText);

    const hasStatsCorrect =
      !hasStatsIncorrect && (
        Boolean(statsBox?.querySelector('.bg-correct-1, .bg-correct-2, .bg-positive, .text-positive')) ||
        /\b(PARAB[EÉ]NS|VOC[EÊ]\s+ACERTOU|ACERTOU)\b/i.test(statsText)
      );

    const isCorrect = (incorrectLetterFromDom || hasStatsIncorrect)
      ? false
      : (hasStatsCorrect || (Boolean(correctLetterFromDom) && !statsText.toUpperCase().includes('RESPOSTA CORRETA')));

    // Identifica o que o usuário marcou
    const userSelectedEl = altScope.querySelector('.q-radio[aria-checked="true"], .q-radio--active, [class*="selected"], [class*="active"], input:checked');
    let userChoiceFromRadio = null;
    if (userSelectedEl) {
      const parentAlt = userSelectedEl.closest('.alternative, [class*="alternative"]') || userSelectedEl.parentElement;
      const l = (parentAlt?.querySelector('.alternative-letter, [class*="letter"]')?.textContent || '').trim().toUpperCase();
      if (l && l.length <= 2) userChoiceFromRadio = l;
    }

    const userChoice = incorrectLetterFromDom ||
                       (isCorrect ? correctLetterFromDom : null) ||
                       userChoiceFromRadio ||
                       lastUserClickedChoice ||
                       (isCorrect ? (correctLetterFromDom || 'C') : 'E');

    let correctChoice = correctLetterFromDom;
    if (statsAnswerMatch) {
      correctChoice = statsAnswerMatch[1].toUpperCase();
    } else if (isCorrect) {
      correctChoice = userChoice;
    } else if (!correctChoice) {
      // Se errou e não achou a letra verde explícita no DOM, busca nas alternativas qual tem ícone de check ou classe correta
      const checkIconEl = Array.from(altScope.querySelectorAll('.material-icons, [class*="check"]'))
        .find(el => (el.classList && Array.from(el.classList).some(c => c.includes('check'))) || (el.textContent || '').trim().toLowerCase() === 'check');
      const checkIconAlt = checkIconEl?.closest('.alternative');
      const checkLetter = (checkIconAlt?.querySelector('.alternative-letter')?.textContent || '').trim().toUpperCase();
      if (checkLetter && checkLetter.length <= 2) {
        correctChoice = checkLetter;
      } else {
        // Cebraspe padrão: se o usuário marcou C e errou, é E; se marcou E e errou, é C
        correctChoice = userChoice === 'C' ? 'E' : 'C';
      }
    }

    function cleanAlternativeText(rawText, letter) {
      if (!rawText || typeof rawText !== 'string') return '';
      let clean = rawText.trim();
      const safeLetter = (letter && /^[A-Za-z0-9]$/.test(String(letter).trim())) ? String(letter).trim() : '[A-E]';
      const letterPrefixRegex = new RegExp(`^\\(?\\s*${safeLetter}\\s*[\\).\\-–—:]?\\s+`, 'i');
      clean = clean.replace(letterPrefixRegex, '').trim();
      const isOnlyPercentage = /^\d+(?:[.,]\d+)?\s*%\s*$/.test(clean);
      if (!isOnlyPercentage) {
        clean = clean.replace(/^\s*\d{1,3}(?:[.,]\d+)?\s*%\s*/, '').trim();
        clean = clean.replace(/\s*\d{1,3}(?:[.,]\d+)?\s*%\s*$/, '').trim();
      }
      return clean || rawText;
    }

    const alternatives = [];
    const seenLetters = new Set();
    const altScopeForText = card.querySelector('.question-alternatives') || card;

    // Estratégia 1: Busca a partir de cada caixinha de letra (.alternative-letter) e extrai o texto irmão na linha
    const letterNodes = altScopeForText.querySelectorAll('.alternative-letter');
    letterNodes.forEach(letterNode => {
      const rawLetter = (letterNode.textContent || '').trim().replace(/[^A-Za-z]/g, '').toUpperCase();
      if (!rawLetter || rawLetter.length > 2 || seenLetters.has(rawLetter)) return;

      const rowEl = letterNode.closest('.alternative') || letterNode.parentElement;
      if (!rowEl) return;

      const clone = rowEl.cloneNode(true);
      clone.querySelectorAll('.alternative-letter, .q-radio__inner, button, .q-icon, i.material-icons, .q-badge, .q-linear-progress, .q-tooltip, [class*="percent"], [class*="badge"], [class*="stat"], [class*="progress"]').forEach(el => el.remove());
      let altText = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
      // Remove eventual letra solta duplicada no começo ou porcentagem de estatística
      altText = cleanAlternativeText(altText, rawLetter);

      if (altText) {
        seenLetters.add(rawLetter);
        alternatives.push({
          letter: rawLetter,
          text: altText
        });
      }
    });

    // Estratégia 2 (Fallback): Busca direto nos elementos .alternative caso não haja .alternative-letter
    if (alternatives.length === 0) {
      const altEls = altScopeForText.querySelectorAll('.alternative');
      altEls.forEach((altEl, idx) => {
        const defaultLetters = ['A', 'B', 'C', 'D', 'E'];
        const clone = altEl.cloneNode(true);
        clone.querySelectorAll('.alternative-letter, .q-radio__inner, button, .q-icon, i.material-icons, .q-badge, .q-linear-progress, .q-tooltip, [class*="percent"], [class*="badge"], [class*="stat"], [class*="progress"]').forEach(el => el.remove());
        const rawText = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
        if (!rawText) return;
        const match = rawText.match(/^([A-E])[\s.)-]+(.*)$/i);
        const letter = match ? match[1].toUpperCase() : (defaultLetters[idx] || String(idx + 1));
        const text = cleanAlternativeText(match ? match[2].trim() : rawText, letter);
        if (!seenLetters.has(letter) && text) {
          seenLetters.add(letter);
          alternatives.push({ letter, text });
        }
      });
    }

    const elapsedForThisQ = questionTimers.get(qId) || timerSeconds || 10;
    const durationSeconds = Math.max(3, elapsedForThisQ);

    // Captura Comentário do Professor caso esteja aberto no card
    let teacherComment = '';
    const commentNodes = card.querySelectorAll(
      '.teacher-comment, .comment-teacher, .professor-comment, .comentario-professor, [class*="teacher-comment"], [class*="comentario"], .q-tab-panel'
    );
    for (const node of commentNodes) {
      const txt = (node.innerText || node.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
      if (txt.length > 50 && !txt.toUpperCase().startsWith('SELECIONE') && !txt.includes('Estatísticas da questão')) {
        teacherComment = txt.slice(0, 2500);
        break;
      }
    }

    return {
      id: qId,
      bloco,
      canonicalSubject,
      subject,
      topic,
      banca,
      ano,
      difficulty,
      content: content.slice(0, 1000),
      alternatives: alternatives.length > 0 ? alternatives : null,
      teacherComment: teacherComment || undefined,
      userChoice,
      correctChoice,
      hit: isCorrect,
      durationSeconds,
      confidence: isCorrect ? 'sabia' : 'duvida',
      errorReason: isCorrect ? null : 'conteudo',
      fsrsRequested: false,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // --- 5. SALVAR QUESTÃO DIRETO NO STORAGE (SEM RACE CONDITION) ---
  function saveQuestion(question, isMetadataUpdateOnly = false) {
    if (!isExtensionContextValid()) {
      teardownInstance();
      return;
    }

    checkDailySessionReset();

    if (!isMetadataUpdateOnly) {
      sessionStats.total += 1;
      if (question.hit) sessionStats.hits += 1;
      else sessionStats.errors += 1;
      updateHudStats();
    }

    const nowIso = new Date().toISOString();
    const resolvedOwnerId = cachedActiveUserId || question.ownerUserId || null;
    const existingIdx = questionsCache.findIndex(q => q && q.id === question.id);
    if (existingIdx >= 0) {
      const prev = questionsCache[existingIdx];
      questionsCache[existingIdx] = {
        ...prev,
        ...question,
        ...(resolvedOwnerId ? { ownerUserId: resolvedOwnerId } : {}),
        teacherComment: question.teacherComment || prev.teacherComment || '',
        userNote: question.userNote !== undefined ? question.userNote : (prev.userNote || ''),
        alternatives: (Array.isArray(question.alternatives) && question.alternatives.length > 0)
          ? question.alternatives
          : (prev.alternatives || null),
        updatedAt: nowIso
      };
    } else {
      questionsCache.unshift({
        ...question,
        ...(resolvedOwnerId ? { ownerUserId: resolvedOwnerId } : {}),
        updatedAt: question.updatedAt || nowIso
      });
    }

    savedQuestionIds.add(question.id);
    if (Array.isArray(question.alternatives) && question.alternatives.length > 0) {
      savedQuestionsMissingAlts.delete(question.id);
    }

    const updatedSession = {
      date: sessionStats.date || getTodaySessionDate(),
      total: sessionStats.total,
      hits: sessionStats.hits,
      errors: sessionStats.errors
    };

    questionsCache = compactQuestionsForStorage(questionsCache);

    try {
      chrome.storage.local.set({
        [STORAGE_KEY]: questionsCache,
        [SESSION_KEY]: updatedSession
      }, () => {
        if (chrome.runtime.lastError) return;
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'UPDATE_BADGE_ONLY',
            payload: { session: updatedSession }
          }).catch(() => {});
        }
      });
    } catch (_) {}
  }

  // --- 6. EXIBIR E FECHAR PROMPT TÁTICO ---
  function dismissPrompt() {
    if (promptDismissTimer) {
      clearTimeout(promptDismissTimer);
      promptDismissTimer = null;
    }
    const promptBox = document.getElementById('qg-prompt-box');
    if (promptBox) {
      promptBox.style.display = 'none';
    }
  }

  function showPrompt(question) {
    dismissPrompt();

    const promptBox = document.getElementById('qg-prompt-box');
    const badge = document.getElementById('qg-prompt-status-badge');
    const errorSection = document.getElementById('qg-error-reasons');
    if (!promptBox || !badge || !errorSection) return;

    badge.className = `qg-prompt-badge ${question.hit ? 'hit' : 'error'}`;
    badge.textContent = question.hit ? '✓ ACERTOU' : '✗ ERROU';

    if (question.hit) {
      errorSection.style.display = 'none';
    } else {
      errorSection.style.display = 'block';
    }

    promptBox.querySelectorAll('.qg-btn-tag').forEach(b => b.classList.remove('active'));
    promptBox.style.display = 'block';

    promptDismissTimer = setTimeout(() => {
      dismissPrompt();
    }, 10000);
  }

  function extractCourseLessonTitle() {
    const ignored = new Set([
      'indice', 'charlie', 'bizus', 'arquivos', 'comentarios', 'comentario',
      'voltar', 'cursos', 'aulas', 'modulos', 'projeto caveira', 'digite para pesquisar'
    ]);
    const candidates = Array.from(
      document.querySelectorAll('h1, h2, h3, [aria-current="page"], [aria-current="true"], [class*="active"], [class*="selected"], [class*="lesson"] [class*="title"], [class*="video"] [class*="title"]')
    ).filter(el => {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
      const txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (txt.length < 4 || txt.length > 140) return false;
      if (/^[\[(]?\d{1,2}:\d{2}/.test(txt)) return false;
      const norm = normalizeCourseIndexKey(txt);
      if (!norm || ignored.has(norm)) return false;
      if (/^\d+\s+[a-z]/.test(norm) && !norm.includes('parte') && !norm.includes('aula')) return false;
      return true;
    });

    candidates.sort((a, b) => {
      const aTxt = normalizeCourseIndexKey(a.innerText || a.textContent);
      const bTxt = normalizeCourseIndexKey(b.innerText || b.textContent);
      const aPart = /\bparte\s*\d+\b|\baula\s*\d+\b/.test(aTxt) ? 0 : 1;
      const bPart = /\bparte\s*\d+\b|\baula\s*\d+\b/.test(bTxt) ? 0 : 1;
      if (aPart !== bPart) return aPart - bPart;
      const aHeading = a.matches('h1, h2, h3') ? 0 : 1;
      const bHeading = b.matches('h1, h2, h3') ? 0 : 1;
      return aHeading - bHeading;
    });

    if (candidates[0]) {
      return (candidates[0].innerText || candidates[0].textContent || '').replace(/\s+/g, ' ').trim();
    }

    const docTitle = String(document.title || '')
      .replace(/\s*[|\-–]\s*projeto\s*caveira.*$/i, '')
      .replace(/\s*[|\-–]\s*caveira.*$/i, '')
      .trim();
    return docTitle.length >= 4 && !ignored.has(normalizeCourseIndexKey(docTitle)) ? docTitle : '';
  }

  function isCourseTabActive(el) {
    if (!el) return false;
    const cls = String(el.className || '');
    return Boolean(
      el.getAttribute('aria-selected') === 'true' ||
      el.getAttribute('data-state') === 'active' ||
      el.classList.contains('q-tab--active') ||
      /\bactive\b/i.test(cls)
    );
  }

  function findCourseTabElement(tabNameNorm) {
    return Array.from(document.querySelectorAll('button, [role="tab"], .q-tab, a, div, span')).find(el => {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 32 || r.width > 200 || r.height < 20 || r.height > 58) return false;
      const txt = normalizeFilterText(el.innerText || el.textContent);
      return txt === tabNameNorm;
    }) || null;
  }

  function extractCourseIndexRawTextFromDom() {
    const tsRegex = /\[\d{1,2}:\d{2}(?::\d{2})?\]/g;
    const containers = [];
    for (const el of document.querySelectorAll('div, ul, ol, section, aside, main')) {
      if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) continue;
      const txt = el.innerText || el.textContent || '';
      const matches = txt.match(tsRegex);
      if (matches && matches.length >= 2) {
        containers.push({ el, count: matches.length, len: txt.length, txt });
      }
    }

    if (containers.length === 0) return '';

    containers.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.len - b.len;
    });

    const best = containers[0];
    const rawLines = best.txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tsLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      const cur = rawLines[i];
      if (/^\[\d{1,2}:\d{2}(?::\d{2})?\]$/.test(cur) && i + 1 < rawLines.length) {
        tsLines.push(`${cur} ${rawLines[i + 1]}`);
        i += 1;
      } else if (/^\[\d{1,2}:\d{2}(?::\d{2})?\]\s*\S+/.test(cur)) {
        tsLines.push(cur);
      }
    }
    return tsLines.join('\n');
  }

  function extractCourseBizusRawTextFromDom() {
    const bizusTab = findCourseTabElement('bizus');
    if (!bizusTab || !isCourseTabActive(bizusTab)) return '';

    const tabRect = bizusTab.getBoundingClientRect();
    let panelEl = null;

    const ariaControls = bizusTab.getAttribute('aria-controls');
    if (ariaControls) {
      const target = document.getElementById(ariaControls);
      if (target && isElementVisible(target)) panelEl = target;
    }

    if (!panelEl) {
      const panels = Array.from(document.querySelectorAll('.q-tab-panel, [role="tabpanel"], section, div'))
        .filter(el => {
          if (!el || el.closest('#qg-caveira-hud') || !isElementVisible(el)) return false;
          if (el.contains(bizusTab)) return false;
          const r = el.getBoundingClientRect();
          if (r.top < tabRect.bottom - 6) return false;
          if (r.width < 220 || r.height < 60) return false;
          const txt = (el.innerText || el.textContent || '').trim();
          return txt.length >= 15 && txt.length <= 8000;
        })
        .sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return Math.abs(ra.top - tabRect.bottom) - Math.abs(rb.top - tabRect.bottom) || (ra.width * ra.height) - (rb.width * rb.height);
        });
      panelEl = panels[0] || null;
    }

    if (!panelEl) return '';

    // Extrai preferencialmente títulos e marcadores curtos de tópicos dentro da aba Bizus
    const structuredNodes = Array.from(panelEl.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, li'))
      .filter(el => isElementVisible(el));
    const lines = [];
    const seen = new Set();

    const pushCandidate = (rawLine) => {
      const line = String(rawLine || '').replace(/\s+/g, ' ').trim();
      if (!line || line.length < 4 || line.length > 85) return;
      const key = normalizeCourseIndexKey(line);
      if (!key || key === 'bizus' || key === 'indice' || key === 'charlie' || key === 'arquivos' || key === 'comentarios') return;
      if (!seen.has(key)) {
        seen.add(key);
        lines.push(line);
      }
    };

    for (const node of structuredNodes) {
      const nodeText = node.innerText || node.textContent || '';
      nodeText.split(/\r?\n/).forEach(pushCandidate);
    }

    if (lines.length === 0) {
      const rawTxt = panelEl.innerText || panelEl.textContent || '';
      rawTxt.split(/\r?\n/).forEach(pushCandidate);
    }

    return lines.slice(0, 20).join('\n');
  }

  function scanCourseVideoIndex() {
    if (isDestroyed || !isCoursePage()) return;

    let captureSource = 'indice';
    let rawIndexText = extractCourseIndexRawTextFromDom();
    if (!rawIndexText) {
      const bizusText = extractCourseBizusRawTextFromDom();
      if (bizusText) {
        rawIndexText = bizusText;
        captureSource = 'bizus';
      }
    }

    if (!rawIndexText) {
      const currentUrl = window.location.href;
      const bizusTab = findCourseTabElement('bizus');
      if (!peekedCourseUrls.has(currentUrl) && (!bizusTab || !isCourseTabActive(bizusTab))) {
        const indexTab = findCourseTabElement('indice');
        if (indexTab) {
          peekedCourseUrls.add(currentUrl);
          clickElementRealistically(indexTab);
          setTimeout(scanCourseVideoIndex, 450);
        }
      }
      return;
    }

    const lessonTitle = extractCourseLessonTitle();
    const subtopics = parseCourseIndexSubtopics(rawIndexText, lessonTitle ? [lessonTitle] : []);
    if (subtopics.length === 0) return;

    currentCourseIndexStatus = {
      count: subtopics.length,
      lessonTitle,
      source: captureSource,
      preview: `${lessonTitle ? lessonTitle + ': ' : ''}${subtopics.slice(0, 6).join(' • ')}`
    };

    const currentQEl = document.getElementById('qg-current-q-id');
    if (currentQEl) {
      const label = captureSource === 'bizus' ? 'Bizus capturado' : 'Índice capturado';
      currentQEl.textContent = `📑 ${label} (${subtopics.length} subassuntos)`;
      currentQEl.title = currentCourseIndexStatus.preview;
    }

    const signature = `${captureSource}|${window.location.href}|${lessonTitle}|${rawIndexText}`;
    if (signature === lastCapturedCourseSignature || !isExtensionContextValid()) return;
    lastCapturedCourseSignature = signature;

    let videoId = '';
    try {
      videoId = new URL(window.location.href).searchParams.get('course_video_id') || '';
    } catch (_) {}

    const entry = {
      url: window.location.href,
      videoId,
      lessonTitle,
      source: captureSource,
      rawIndexText,
      subtopics,
      capturedAt: Date.now()
    };

    try {
      chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
        if (chrome.runtime.lastError || isDestroyed) return;
        const prev = (res?.[COURSE_INDEX_CACHE_KEY] && typeof res[COURSE_INDEX_CACHE_KEY] === 'object')
          ? res[COURSE_INDEX_CACHE_KEY]
          : { latest: null, byLesson: {} };
        const nextByLesson = { ...(prev.byLesson || {}) };
        const lessonKey = normalizeCourseIndexKey(lessonTitle);
        if (lessonKey) {
          const existing = nextByLesson[lessonKey];
          if (existing && existing.source === 'indice' && captureSource === 'bizus') {
            nextByLesson[lessonKey] = {
              ...existing,
              bizusRawText: rawIndexText,
              bizusSubtopics: subtopics,
              capturedAt: Date.now()
            };
          } else {
            nextByLesson[lessonKey] = entry;
          }
        }
        // Mantém no máximo 40 aulas mais recentes em cache
        const ordered = Object.entries(nextByLesson)
          .sort((a, b) => (b[1]?.capturedAt || 0) - (a[1]?.capturedAt || 0))
          .slice(0, 40);
        const compactedByLesson = Object.fromEntries(ordered);
        chrome.storage.local.set({
          [COURSE_INDEX_CACHE_KEY]: {
            latest: (lessonKey && compactedByLesson[lessonKey]) || entry,
            byLesson: compactedByLesson
          }
        });
      });
    } catch (_) {}
  }

  // --- 7. VARREDURA DE CARDS E DETECÇÃO DE VIEWPORT ---
  function scanCards() {
    if (!isExtensionContextValid()) {
      teardownInstance();
      return;
    }
    createHud();
    if (!isStorageLoaded) return;

    if (isCoursePage()) {
      scanCourseVideoIndex();
    }

    const cards = getQuestionCards();
    if (!cards || cards.length === 0) {
      clearActiveQuestionState();
      return;
    }

    cards.forEach(card => {
      const qId = extractQuestionId(card);
      if (!qId) return;

      // Se a questão já estava salva antes da v1.1.4 sem o texto das alternativas, enriquece automaticamente!
      if (savedQuestionsMissingAlts.has(qId)) {
        const enriched = extractQuestionData(card, qId);
        if (enriched && Array.isArray(enriched.alternatives) && enriched.alternatives.length > 0) {
          savedQuestionsMissingAlts.delete(qId);
          const existing = questionsCache.find(item => item && item.id === qId) || {};
          saveQuestion({
            ...existing,
            id: qId,
            alternatives: enriched.alternatives,
            subject: (existing.subject && existing.subject !== 'Geral') ? existing.subject : enriched.subject,
            topic: (existing.topic && existing.topic !== 'Geral') ? existing.topic : enriched.topic,
            canonicalSubject: enriched.canonicalSubject || existing.canonicalSubject,
            bloco: enriched.bloco || existing.bloco,
            content: enriched.content || existing.content
          }, true);
        }
      }

      // Se a questão já estava salva e o usuário abriu o Comentário do Professor depois, enriquece automaticamente!
      if (savedQuestionIds.has(qId)) {
        const existing = questionsCache.find(item => item && item.id === qId);
        if (existing && !existing.teacherComment) {
          const commentNodes = card.querySelectorAll(
            '.teacher-comment, .comment-teacher, .professor-comment, .comentario-professor, [class*="teacher-comment"], [class*="comentario"], .q-tab-panel'
          );
          for (const node of commentNodes) {
            const txt = (node.innerText || node.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
            if (txt.length > 50 && !txt.toUpperCase().startsWith('SELECIONE') && !txt.includes('Estatísticas da questão')) {
              saveQuestion({ ...existing, teacherComment: txt.slice(0, 2500) }, true);
              break;
            }
          }
        }
      }

      const answered = isCardAnswered(card);

      if (!answered) {
        processedInSession.delete(qId);
      } else {
        // A questão está respondida no Caveira!
        // Se ela ainda não está salva no storage do QG ou se o usuário acabou de clicar em Responder, captura imediatamente!
        const shouldCapture = !savedQuestionIds.has(qId) || pendingAnswerQIds.has(qId);

        if (shouldCapture && !processedInSession.has(qId)) {
          processedInSession.add(qId);
          pendingAnswerQIds.delete(qId);

          pauseTimer();

          const currentQEl = document.getElementById('qg-current-q-id');
          if (currentQEl) {
            currentQEl.textContent = `${qId} ✓`;
          }

          const questionData = extractQuestionData(card, qId);
          if (questionData) {
            activeQuestionData = questionData;
            saveQuestion(questionData, false);
            renderQuestionHistory(qId, true);
            showPrompt(questionData);
          }
        }
      }
    });

    // Atualiza a questão ativa de acordo com o card que está visível no centro da tela (scroll)
    const focusedCard = findCardInViewport(cards);
    if (focusedCard) {
      const focusedQId = extractQuestionId(focusedCard);
      const focusedAnswered = isCardAnswered(focusedCard);
      if (focusedQId) {
        switchActiveQuestion(focusedQId, focusedAnswered);
      }
    }
  }

  function scheduleScan(delay = 40) {
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(scanCards, delay);
  }

  // Handler leve para rolagem da página (detecta imediatamente quando o usuário rola para a questão de baixo)
  function handleScrollUpdate() {
    if (isDestroyed) return;
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      if (isDestroyed) return;
      const cards = getQuestionCards();
      if (!cards || cards.length === 0) {
        clearActiveQuestionState();
        return;
      }
      const focusedCard = findCardInViewport(cards);
      if (focusedCard) {
        const focusedQId = extractQuestionId(focusedCard);
        const focusedAnswered = isCardAnswered(focusedCard);
        if (focusedQId) {
          switchActiveQuestion(focusedQId, focusedAnswered);
        }
      }
    });
  }

  // --- 8. GATILHOS DE INTERAÇÃO E ROLAGEM (SCROLL) ---
  function setupTriggers() {
    handleScrollUpdateRef = handleScrollUpdate;
    handlePopstateHashRef = () => scheduleScan(50);

    // 1. Detecção em tempo real ao rolar a página e ao trocar de rota na SPA
    window.addEventListener('scroll', handleScrollUpdateRef, { capture: true, passive: true });
    window.addEventListener('wheel', handleScrollUpdateRef, { passive: true });
    window.addEventListener('popstate', handlePopstateHashRef);
    window.addEventListener('hashchange', handlePopstateHashRef);

    // 2. Cliques do usuário
    handleDocumentClickRef = (e) => {
      if (isDestroyed) return;
      if (e.target.closest('#qg-caveira-hud')) return;

      const card = e.target.closest('.q-card');
      const rootCard = (card && card.parentElement?.closest('.q-card')) ? card.parentElement.closest('.q-card') : card;
      const clickedCardQId = rootCard ? extractQuestionId(rootCard) : null;

      if (rootCard && clickedCardQId) {
        switchActiveQuestion(clickedCardQId, isCardAnswered(rootCard));
      }

      const alt = e.target.closest('.alternative');
      if (alt) {
        const letter = alt.querySelector('.alternative-letter')?.textContent?.trim();
        if (letter && letter.length <= 2) {
          lastUserClickedChoice = letter;
        }
      }

      const btn = e.target.closest('button, .q-btn, a');
      if (btn) {
        const text = (btn.textContent || '').trim();
        const textUpper = text.toUpperCase();
        if (
          textUpper.includes('RESPONDER') ||
          textUpper.includes('CONFIRMAR') ||
          btn.classList.contains('light-mode-answer-btn') ||
          (btn.getAttribute('aria-label') || '').toUpperCase().includes('RESPONDER')
        ) {
          const targetQId = clickedCardQId || currentQuestionId;
          const targetCard = rootCard || getQuestionCards().find(c => extractQuestionId(c) === targetQId);
          if (targetQId && targetCard && !isCardAnswered(targetCard)) {
            processedInSession.delete(targetQId);
            pendingAnswerQIds.add(targetQId);
          }
          // Varreduras rápidas e estendidas para cobrir qualquer atraso de rede da API do Caveira
          [40, 100, 200, 400, 800, 1500, 2500, 4000].forEach(delay => setTimeout(scanCards, delay));

          // Tentativa de auto-carregar o Comentário do Professor em segundo plano sem quebrar a visão do usuário
          setTimeout(() => {
            try {
              if (rootCard) {
                const tabs = rootCard.querySelectorAll('.q-tab, [role="tab"], button, .q-btn');
                for (const t of tabs) {
                  const tText = (t.textContent || '').toLowerCase();
                  if (tText.includes('comentário') || tText.includes('comentario') || tText.includes('professor')) {
                    // Se o comentário ainda não foi carregado e a aba existe, dá um toque para disparar a busca
                    if (!rootCard.querySelector('.teacher-comment, [class*="teacher-comment"]')) {
                      // Dispara clique na aba do comentário
                      t.click();
                      // E após carregar o comentário, varre os cards
                      setTimeout(scanCards, 300);
                      setTimeout(scanCards, 800);
                    }
                    break;
                  }
                }
              }
            } catch (_) {}
          }, 450);
        }

        if (
          textUpper.includes('PRÓXIMA') ||
          textUpper.includes('AVANÇAR') ||
          btn.querySelector('.material-icons')?.textContent?.includes('chevron_right') ||
          btn.querySelector('.material-icons')?.textContent?.includes('navigate_next')
        ) {
          setTimeout(scanCards, 80);
          setTimeout(scanCards, 300);
        }
      }
    };
    document.addEventListener('click', handleDocumentClickRef, true);

    // 3. Teclado (Enter, Setas, PageDown/PageUp)
    handleDocumentKeydownRef = (e) => {
      if (isDestroyed) return;
      if (e.key === 'Enter' && currentQuestionId) {
        const focusedCard = getQuestionCards().find(c => extractQuestionId(c) === currentQuestionId);
        if (focusedCard && !isCardAnswered(focusedCard)) {
          processedInSession.delete(currentQuestionId);
          pendingAnswerQIds.add(currentQuestionId);
          setTimeout(scanCards, 80);
          setTimeout(scanCards, 350);
        }
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'PageUp') {
        setTimeout(handleScrollUpdate, 60);
        setTimeout(scanCards, 200);
      }
    };
    document.addEventListener('keydown', handleDocumentKeydownRef);

    // 4. MutationObserver para capturar respostas instantaneamente
    domObserver = new MutationObserver((mutations) => {
      const isInternal = mutations.every(m => m.target.closest && m.target.closest('#qg-caveira-hud'));
      if (isInternal) return;
      scheduleScan(40);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled']
    });

    scanIntervalId = setInterval(scanCards, 1500);
    scanCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createHud();
      setupTriggers();
    });
  } else {
    createHud();
    setupTriggers();
  }
})();
