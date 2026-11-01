// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (v3 Strict — Somente Cliques Reais)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira v3 ativo em:', window.location.href);

  const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';
  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';
  const SCHEMA_KEY = 'qg_caveira_schema_v3';

  let currentQuestionId = null;
  let timerSeconds = 0;
  let isTimerRunning = false;
  let timerInterval = null;
  let promptDismissTimer = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;
  let scanDebounceTimer = null;

  // Rastreia questões que já estavam respondidas quando a página carregou (não devem ser contadas de novo)
  const preAnsweredOnLoad = new Set();
  // Rastreia questões já contabilizadas nesta sessão da página
  const processedInSession = new Set();
  // Rastreia questões nas quais o usuário REALMENTE clicou em "Responder"
  const pendingAnswerQIds = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    total: 0,
    hits: 0,
    errors: 0
  };

  // Inicialização e limpeza automática de dados corrompidos de versões anteriores
  function loadInitialState() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, SCHEMA_KEY], (res) => {
        // Migração v3: limpa as 115 questões fantasmas geradas pelo bug anterior da barra de progresso
        if (res[SCHEMA_KEY] !== 'v3_strict_clean') {
          const cleanSession = { total: 0, hits: 0, errors: 0 };
          chrome.storage.local.set({
            [STORAGE_KEY]: [],
            [SESSION_KEY]: cleanSession,
            [SCHEMA_KEY]: 'v3_strict_clean'
          });
          sessionStats = cleanSession;
          updateHudStats();
          return;
        }

        const session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };
        sessionStats = {
          total: Number(session.total) || 0,
          hits: Number(session.hits) || 0,
          errors: Number(session.errors) || 0
        };
        updateHudStats();
      });
    }
  }

  loadInitialState();

  // Escuta mudanças no storage (ex: botão "Zerar Sessão" no popup)
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[SESSION_KEY]) {
        const newSession = changes[SESSION_KEY].newValue || { total: 0, hits: 0, errors: 0 };
        sessionStats = {
          total: Number(newSession.total) || 0,
          hits: Number(newSession.hits) || 0,
          errors: Number(newSession.errors) || 0
        };
        updateHudStats();
      }
    });
  }

  // --- 1. CRIAÇÃO DO HUD FLUTUANTE ---
  function createHud() {
    if (document.getElementById('qg-caveira-hud')) return;

    const hud = document.createElement('div');
    hud.id = 'qg-caveira-hud';
    hud.innerHTML = `
      <div class="qg-hud-header">
        <div class="qg-hud-title">
          <span class="qg-hud-pulse"></span>
          <span>💀 QG PRF • CAVEIRA</span>
        </div>
        <div class="qg-hud-controls">
          <button class="qg-hud-btn-icon" id="qg-btn-min" title="Minimizar / Expandir">_</button>
        </div>
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
            <span class="qg-hud-stat-label">Líquida</span>
            <span class="qg-hud-stat-value gold" id="qg-stat-net">${sessionStats.hits - sessionStats.errors}</span>
          </div>
        </div>

        <div class="qg-hud-current">
          <span id="qg-current-q-id">Aguardando questão...</span>
          <span class="qg-hud-timer" id="qg-timer">00:00</span>
        </div>
      </div>

      <div class="qg-hud-prompt" id="qg-prompt-box" style="display: none;">
        <div class="qg-prompt-title">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span id="qg-prompt-status-badge" class="qg-prompt-badge hit">ACERTO</span>
            <span>Autoavaliação Tática</span>
          </div>
          <button type="button" id="qg-prompt-close" style="background: none; border: none; color: #94a3b8; font-size: 13px; cursor: pointer; padding: 2px 6px; border-radius: 4px;">✕</button>
        </div>

        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 700;">CONFIANÇA:</div>
        <div class="qg-prompt-buttons">
          <button class="qg-btn-tag" data-confidence="sabia">🎯 Sabia</button>
          <button class="qg-btn-tag" data-confidence="duvida">🤔 Dúvida</button>
          <button class="qg-btn-tag" data-confidence="chute">🎲 Chute</button>
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
    updateHudStats();

    // Evento Minimizar / Expandir
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

    // Fechar prompt manualmente
    hud.querySelector('#qg-prompt-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPrompt();
    });

    // Botões de Confiança
    hud.querySelectorAll('[data-confidence]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.querySelectorAll('[data-confidence]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          activeQuestionData.confidence = btn.dataset.confidence;
          saveQuestion(activeQuestionData, true);
          if (activeQuestionData.hit) {
            setTimeout(dismissPrompt, 500);
          }
        }
      });
    });

    // Botões de Motivo do Erro
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

  // --- 2. CRONÔMETRO DE QUESTÃO ---
  function startTimerInterval() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      if (isTimerRunning) {
        timerSeconds++;
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
  }

  function pauseTimer() {
    isTimerRunning = false;
  }

  function resetAndStartTimerForQuestion(newQId) {
    if (!newQId || currentQuestionId === newQId) return;

    currentQuestionId = newQId;
    timerSeconds = 0;
    isTimerRunning = true;
    lastUserClickedChoice = null;
    activeQuestionData = null;

    dismissPrompt();
    renderTimerDisplay();

    const currentQEl = document.getElementById('qg-current-q-id');
    if (currentQEl) {
      currentQEl.textContent = newQId;
    }
  }

  // --- 3. ATUALIZAÇÃO VISUAL DAS ESTATÍSTICAS ---
  function updateHudStats() {
    const elTotal = document.getElementById('qg-stat-total');
    const elHits = document.getElementById('qg-stat-hits');
    const elErrors = document.getElementById('qg-stat-errors');
    const elNet = document.getElementById('qg-stat-net');
    if (!elTotal) return;

    elTotal.textContent = sessionStats.total;
    elHits.textContent = sessionStats.hits;
    elErrors.textContent = sessionStats.errors;
    const net = sessionStats.hits - sessionStats.errors;
    elNet.textContent = (net > 0 ? `+${net}` : `${net}`);
    elNet.className = `qg-hud-stat-value ${net > 0 ? 'green' : net < 0 ? 'red' : 'gold'}`;
  }

  // --- 4. SELEÇÃO E VERIFICAÇÃO ESTRITA DE QUESTÃO ---
  function getQuestionCards() {
    const allCards = document.querySelectorAll('.q-card');
    return Array.from(allCards).filter(card => {
      if (card.closest('#qg-caveira-hud')) return false;
      if (card.parentElement && card.parentElement.closest('.q-card')) return false;
      const hasNumber = Boolean(card.querySelector('.number'));
      const hasAlternatives = Boolean(card.querySelector('.question-alternatives, .alternative'));
      return hasNumber && hasAlternatives;
    });
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

  // IMPORTANTE: No Caveira, barras de progresso (.q-linear-progress) já possuem .error-percentage e .bg-incorrect-2
  // mesmo ANTES de responder! O único indicador real de questão respondida é a existência da .stats-box ("PARABÉNS!" / "ERROU")!
  function isCardAnswered(card) {
    if (!card) return false;
    const statsBox = card.querySelector('.stats-box');
    if (!statsBox) return false;
    const text = statsBox.textContent || '';
    return (
      Boolean(statsBox.querySelector('.bg-correct-1, .bg-incorrect-1, .title-stats')) ||
      text.includes('PARABÉNS') ||
      text.includes('ERROU') ||
      text.includes('acertou') ||
      text.includes('Resposta correta')
    );
  }

  function extractQuestionData(card, qId) {
    if (!card) return null;

    // Disciplina e Tópico
    const subjectEl = card.querySelector('.subject');
    let subject = 'Geral';
    let topic = 'Geral';
    if (subjectEl) {
      const text = subjectEl.textContent.trim();
      const parts = text.split('->');
      subject = parts[0]?.trim() || 'Geral';
      topic = parts.slice(1).join('->').trim() || subject;
    }

    // Metadados (Banca, Ano, Dificuldade)
    const infoText = card.querySelector('.question-info')?.textContent || '';
    const bancaMatch = infoText.match(/Banca:\s*([^Ano\n]+)/i);
    const anoMatch = infoText.match(/Ano:\s*(\d+)/i);
    const diffMatch = infoText.match(/Dificuldade:\s*([^\n]+)/i);

    const banca = bancaMatch ? bancaMatch[1].trim() : 'CAVEIRA';
    const ano = anoMatch ? anoMatch[1].trim() : '2026';
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Média';

    // Enunciado
    const content = card.querySelector('.content')?.innerText?.trim() || '';

    // Análise estrita da .stats-box oficial
    const statsBox = card.querySelector('.stats-box');
    const statsText = statsBox ? statsBox.textContent : '';

    const isCorrect = Boolean(statsBox?.querySelector('.bg-correct-1')) ||
                      statsText.includes('PARABÉNS') ||
                      statsText.includes('acertou');

    // Verifica APENAS a letra da alternativa (.alternative-letter), NUNCA a barra de progresso (.q-linear-progress)
    let markedLetter = null;
    const letterEls = card.querySelectorAll('.alternative-letter');
    letterEls.forEach(letterEl => {
      const letter = letterEl.textContent.trim();
      if (!letter || letter.length > 2) return;
      if (
        letterEl.classList.contains('bg-correct-2') ||
        letterEl.classList.contains('bg-correct-1') ||
        letterEl.classList.contains('bg-incorrect-2') ||
        letterEl.classList.contains('bg-incorrect-1')
      ) {
        markedLetter = letter;
      }
    });

    const userChoice = markedLetter || lastUserClickedChoice || 'C';
    let correctChoice = userChoice;

    if (!isCorrect) {
      // No Caveira, quando erra, a .subtitle-stats diz "Resposta correta: C"
      const ansMatch = statsText.match(/Resposta correta:\s*([A-E])/i);
      if (ansMatch) {
        correctChoice = ansMatch[1].toUpperCase();
      } else {
        correctChoice = userChoice === 'C' ? 'E' : 'C';
      }
    }

    const durationSeconds = Math.max(3, timerSeconds || 10);

    return {
      id: qId,
      subject,
      topic,
      banca,
      ano,
      difficulty,
      content: content.slice(0, 500),
      userChoice,
      correctChoice,
      hit: isCorrect,
      durationSeconds,
      confidence: isCorrect ? 'sabia' : 'duvida',
      errorReason: isCorrect ? null : 'conteudo',
      timestamp: new Date().toISOString()
    };
  }

  // --- 5. SALVAR QUESTÃO DIRETO NO STORAGE ---
  function saveQuestion(question, isMetadataUpdateOnly = false) {
    if (!isMetadataUpdateOnly) {
      sessionStats.total += 1;
      if (question.hit) sessionStats.hits += 1;
      else sessionStats.errors += 1;
      updateHudStats();
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        const existingIdx = questions.findIndex(q => q.id === question.id);

        if (existingIdx >= 0) {
          questions[existingIdx] = { ...questions[existingIdx], ...question };
        } else {
          questions.unshift(question);
        }

        const updatedSession = {
          total: sessionStats.total,
          hits: sessionStats.hits,
          errors: sessionStats.errors
        };

        chrome.storage.local.set({
          [STORAGE_KEY]: questions,
          [SESSION_KEY]: updatedSession
        }, () => {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'UPDATE_BADGE_ONLY',
              payload: { session: updatedSession }
            }).catch(() => {});
          }
        });
      });
    }
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

  // --- 7. VARREDURA DE CARDS ---
  let isInitialScan = true;

  function scanCards() {
    createHud();

    const cards = getQuestionCards();
    if (!cards || cards.length === 0) return;

    let firstUnansweredQId = null;

    cards.forEach(card => {
      const qId = extractQuestionId(card);
      if (!qId) return;

      const answered = isCardAnswered(card);

      // No primeiro scan ao abrir a página, qualquer questão que JÁ esteja respondida na tela
      // é marcada como antiga para não ser contabilizada sem o usuário ter respondido agora
      if (isInitialScan && answered) {
        preAnsweredOnLoad.add(qId);
        processedInSession.add(qId);
        return;
      }

      if (!answered) {
        if (!firstUnansweredQId) {
          firstUnansweredQId = qId;
        }
        // Se a questão está não-respondida na tela, libera caso estivesse em preAnsweredOnLoad
        preAnsweredOnLoad.delete(qId);
        processedInSession.delete(qId);
      } else {
        // Só contabiliza se a questão está respondida, ainda não foi processada nesta sessão,
        // E o usuário realmente clicou em "Responder" nela (ou ela estava ativa no cronômetro como não-respondida)
        const wasSolvedNow = pendingAnswerQIds.has(qId) || (currentQuestionId === qId && !preAnsweredOnLoad.has(qId));

        if (wasSolvedNow && !processedInSession.has(qId)) {
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
            showPrompt(questionData);
          }
        }
      }
    });

    isInitialScan = false;

    if (firstUnansweredQId && firstUnansweredQId !== currentQuestionId) {
      resetAndStartTimerForQuestion(firstUnansweredQId);
    }
  }

  function scheduleScan(delay = 40) {
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(scanCards, delay);
  }

  // --- 8. GATILHOS DE INTERAÇÃO ---
  function setupTriggers() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#qg-caveira-hud')) return;

      const card = e.target.closest('.q-card');
      const rootCard = (card && card.parentElement?.closest('.q-card')) ? card.parentElement.closest('.q-card') : card;
      const clickedCardQId = rootCard ? extractQuestionId(rootCard) : null;

      if (rootCard && clickedCardQId && clickedCardQId !== currentQuestionId && !isCardAnswered(rootCard)) {
        resetAndStartTimerForQuestion(clickedCardQId);
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
        const text = btn.textContent || '';
        if (text.includes('Responder') || btn.classList.contains('light-mode-answer-btn')) {
          const targetQId = clickedCardQId || currentQuestionId;
          if (targetQId) {
            pendingAnswerQIds.add(targetQId);
          }
          setTimeout(scanCards, 40);
          setTimeout(scanCards, 120);
          setTimeout(scanCards, 250);
          setTimeout(scanCards, 500);
          setTimeout(scanCards, 1000);
          setTimeout(scanCards, 2000);
        }

        if (
          text.includes('Próxima') ||
          text.includes('Avançar') ||
          btn.querySelector('.material-icons')?.textContent?.includes('chevron_right') ||
          btn.querySelector('.material-icons')?.textContent?.includes('navigate_next')
        ) {
          setTimeout(scanCards, 80);
          setTimeout(scanCards, 300);
        }
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && currentQuestionId) {
        pendingAnswerQIds.add(currentQuestionId);
        setTimeout(scanCards, 80);
        setTimeout(scanCards, 350);
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setTimeout(scanCards, 80);
        setTimeout(scanCards, 350);
      }
    });

    const observer = new MutationObserver((mutations) => {
      const isInternal = mutations.every(m => m.target.closest && m.target.closest('#qg-caveira-hud'));
      if (isInternal) return;
      scheduleScan(40);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'disabled']
    });

    setInterval(scanCards, 1500);
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
