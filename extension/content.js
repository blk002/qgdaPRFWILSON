// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (Versão Estável & Silenciosa)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira ativo em:', window.location.href);

  const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';
  const STORAGE_KEY = 'qg_caveira_questions';
  const SESSION_KEY = 'qg_caveira_session';

  let currentQuestionId = null;
  let timerSeconds = 0;
  let isTimerRunning = false;
  let timerInterval = null;
  let promptDismissTimer = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;
  let scanDebounceTimer = null;

  // Rastreia questões já processadas nesta aba para garantir ZERO loops
  const processedInSession = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    total: 0,
    hits: 0,
    errors: 0
  };

  // Remove duplicatas ou entradas falsas geradas por sub-elementos do DOM
  function cleanQuestionsList(list) {
    if (!Array.isArray(list)) return [];
    const byId = new Map();
    const realContentSet = new Set();

    // Primeiro registra todos os conteúdos que possuem disciplina real identificada
    list.forEach(q => {
      if (q && q.content && q.subject && q.subject !== 'Geral') {
        realContentSet.add(q.content.slice(0, 80));
      }
    });

    list.forEach(q => {
      if (!q || !q.id) return;
      // Descarta fragmento órfão de seção se for 'Geral' sem tópico real
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

  // Sincroniza estado inicial direto do chrome.storage.local
  function loadInitialState() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const rawQuestions = res[STORAGE_KEY] || [];
        const questions = cleanQuestionsList(rawQuestions);
        let session = res[SESSION_KEY] || { hits: 0, errors: 0, total: 0 };

        // Se a lista tinha lixo de sub-seções, salva a lista limpa
        if (questions.length !== rawQuestions.length) {
          chrome.storage.local.set({ [STORAGE_KEY]: questions });
        }

        // Se há questões salvas e a sessão está zerada sem ter sido resetada manualmente, sincroniza com o histórico
        if (session.total === 0 && questions.length > 0 && !session.wasExplicitlyReset) {
          const hits = questions.filter(q => q.hit).length;
          const errors = questions.length - hits;
          session = { total: questions.length, hits, errors, wasExplicitlyReset: false };
          chrome.storage.local.set({ [SESSION_KEY]: session });
        }

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

  // Escuta mudanças no storage (ex: se o usuário clicar em "Zerar Sessão" no popup da extensão)
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
            setTimeout(dismissPrompt, 600);
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
          setTimeout(dismissPrompt, 600);
        }
      });
    });

    startTimerInterval();
  }

  // --- 2. CRONÔMETRO DE QUESTÃO COM PAUSA AUTOMÁTICA ---
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
    if (!newQId) return;
    if (currentQuestionId === newQId) return;

    console.log(`💀 [QG da PRF] Foco na questão: ${newQId}. Cronômetro iniciado.`);
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

  // --- 4. SELEÇÃO ESTRITA DE CARDS DE QUESTÃO RAIZ ---
  // Importante: usa apenas '.q-card' real (nunca [class*="q-card"] que pegava .q-card__section!)
  function getQuestionCards() {
    const allCards = document.querySelectorAll('.q-card');
    return Array.from(allCards).filter(card => {
      if (card.closest('#qg-caveira-hud')) return false;
      // Garante que não é um card aninhado dentro de outro .q-card
      if (card.parentElement && card.parentElement.closest('.q-card')) return false;
      // Tem que possuir número da questão e alternativas
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

  function isCardAnswered(card) {
    if (!card) return false;

    if (card.querySelector('.stats-box')) return true;
    if (card.querySelector('.alternative-letter.bg-correct-2, .alternative-letter.bg-incorrect-2, .bg-correct-1, .bg-incorrect-1')) {
      return true;
    }
    if (card.querySelector('.error-percentage')) return true;

    const text = card.textContent || '';
    if (text.includes('PARABÉNS!') || text.includes('Você acertou!') || text.includes('Você errou!')) {
      return true;
    }

    return false;
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

    // Análise de Acerto / Erro
    const statsBox = card.querySelector('.stats-box');
    const cardText = card.textContent || '';
    
    const isSuccessBanner = (statsBox && (statsBox.querySelector('.bg-correct-1') || statsBox.textContent.includes('PARABÉNS') || statsBox.textContent.includes('acertou'))) ||
                            cardText.includes('PARABÉNS!') || cardText.includes('Você acertou!');
                            
    const isErrorBanner = (statsBox && (statsBox.querySelector('.bg-incorrect-1') || statsBox.textContent.includes('ERROU') || statsBox.textContent.includes('Resposta correta'))) ||
                          cardText.includes('Você errou!') || cardText.includes('QUE PENA');

    let detectedCorrectLetter = null;
    let detectedIncorrectLetter = null;

    // Alternativas
    const altContainers = card.querySelectorAll('.alternative');
    altContainers.forEach(alt => {
      const letterEl = alt.querySelector('.alternative-letter');
      const letter = letterEl ? letterEl.textContent.trim() : null;
      if (!letter || letter.length > 2) return;

      const isGreen = alt.querySelector('.bg-correct-2, .bg-correct-1') || (letterEl && (letterEl.classList.contains('bg-correct-2') || letterEl.classList.contains('bg-correct-1')));
      const isRed = alt.querySelector('.bg-incorrect-2, .bg-incorrect-1') || (letterEl && (letterEl.classList.contains('bg-incorrect-2') || letterEl.classList.contains('bg-incorrect-1')));

      if (isGreen) detectedCorrectLetter = letter;
      if (isRed) detectedIncorrectLetter = letter;
    });

    let isCorrect = false;
    let userChoice = 'C';
    let correctChoice = 'C';

    if (isSuccessBanner) {
      isCorrect = true;
      userChoice = detectedCorrectLetter || lastUserClickedChoice || 'C';
      correctChoice = userChoice;
    } else if (isErrorBanner) {
      isCorrect = false;
      userChoice = detectedIncorrectLetter || lastUserClickedChoice || (detectedCorrectLetter === 'C' ? 'E' : 'C');
      correctChoice = detectedCorrectLetter || (userChoice === 'C' ? 'E' : 'C');
    } else {
      if (detectedIncorrectLetter) {
        isCorrect = false;
        userChoice = detectedIncorrectLetter;
        correctChoice = detectedCorrectLetter || (userChoice === 'C' ? 'E' : 'C');
      } else if (detectedCorrectLetter) {
        isCorrect = true;
        userChoice = detectedCorrectLetter;
        correctChoice = detectedCorrectLetter;
      }
    }

    const durationSeconds = Math.max(3, timerSeconds || 12);

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

  // --- 5. SALVAR QUESTÃO DIRETO NO STORAGE E ATUALIZAR HUD + POPUP ---
  function saveQuestion(question, isMetadataUpdateOnly = false) {
    console.log('💀 [QG da PRF] Salvando questão:', question.id, question.hit ? 'ACERTO' : 'ERRO', isMetadataUpdateOnly ? '(atualizando tag)' : '(nova resposta)');

    // 1. Se não for apenas atualização de tag de confiança, incrementa imediatamente no HUD local
    if (!isMetadataUpdateOnly) {
      sessionStats.total += 1;
      if (question.hit) sessionStats.hits += 1;
      else sessionStats.errors += 1;
      updateHudStats();
    }

    // 2. Grava diretamente no chrome.storage.local (para o Popup e o QG Bridge lerem na hora)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY], (res) => {
        const questions = cleanQuestionsList(res[STORAGE_KEY] || []);
        const existingIdx = questions.findIndex(q => q.id === question.id);

        if (existingIdx >= 0) {
          questions[existingIdx] = { ...questions[existingIdx], ...question };
        } else {
          questions.unshift(question);
        }

        const updatedSession = {
          total: sessionStats.total,
          hits: sessionStats.hits,
          errors: sessionStats.errors,
          wasExplicitlyReset: false
        };

        chrome.storage.local.set({
          [STORAGE_KEY]: questions,
          [SESSION_KEY]: updatedSession
        }, () => {
          // Notifica background apenas para atualizar o badge do ícone da extensão
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

    // Fecha automaticamente após 10s se o usuário não clicar
    promptDismissTimer = setTimeout(() => {
      dismissPrompt();
    }, 10000);
  }

  // --- 7. VARREDURA DE CARDS (SEM REPETIÇÃO E SEM SOM) ---
  function scanCards() {
    createHud();

    const cards = getQuestionCards();
    if (!cards || cards.length === 0) return;

    let firstUnansweredQId = null;

    cards.forEach(card => {
      const qId = extractQuestionId(card);
      if (!qId) return;

      const answered = isCardAnswered(card);

      if (!answered) {
        if (!firstUnansweredQId) {
          firstUnansweredQId = qId;
        }
        // Se o card na tela está não-respondido (ex: usuário clicou em refazer), libera para quando responder
        if (processedInSession.has(qId)) {
          processedInSession.delete(qId);
        }
      } else {
        // O card está respondido! Se ainda não foi processado nesta sessão:
        if (!processedInSession.has(qId)) {
          processedInSession.add(qId);
          console.log(`💀 [QG da PRF] Questão resolvida detectada: ${qId}!`);

          // Pausa o cronômetro no tempo exato da resolução
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

    // Quando avançar para uma nova questão não respondida, reinicia o cronômetro para ela
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
      if (card && !card.parentElement?.closest('.q-card')) {
        const cardQId = extractQuestionId(card);
        if (cardQId && cardQId !== currentQuestionId && !isCardAnswered(card)) {
          resetAndStartTimerForQuestion(cardQId);
        }
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
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter') {
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
