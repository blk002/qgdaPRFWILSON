// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (Versão de Alta Precisão & Performance)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira ativo em:', window.location.href);

  const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';

  let currentQuestionId = null;
  let timerSeconds = 0;
  let isTimerRunning = false;
  let timerInterval = null;
  let promptDismissTimer = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;
  let scanDebounceTimer = null;

  // Rastreia questões já processadas NESTA PÁGINA para garantir ZERO loops repetitivos
  const processedInSession = new Set();
  // Rastreia questões vistas como não-respondidas para detectar a transição exata para respondida
  const seenUnansweredIds = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    total: 0,
    hits: 0,
    errors: 0
  };

  // Carregar dados existentes da sessão
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (res) => {
      if (res && res.session) {
        sessionStats = {
          total: Number(res.session.total) || 0,
          hits: Number(res.session.hits) || 0,
          errors: Number(res.session.errors) || 0
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
          saveQuestion(activeQuestionData);
          if (activeQuestionData.hit) {
            setTimeout(dismissPrompt, 900);
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
          saveQuestion(activeQuestionData);
          setTimeout(dismissPrompt, 900);
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
    if (currentQuestionId === newQId && isTimerRunning) return;

    console.log(`💀 [QG da PRF] Foco na questão: ${newQId}. Cronômetro reiniciado.`);
    currentQuestionId = newQId;
    timerSeconds = 0;
    isTimerRunning = true;
    lastUserClickedChoice = null;
    activeQuestionData = null;

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

  // --- 4. IDENTIFICAÇÃO E EXTRAÇÃO DA QUESTÃO ---
  function extractQuestionId(card) {
    if (!card) return null;

    // 1. Número específico no cabeçalho Quasar/Caveira
    const numberEl = card.querySelector('.number, [class*="number"]');
    if (numberEl) {
      const match = numberEl.textContent.match(/Q\s*[:.-]?\s*(\d{3,9})/i);
      if (match) return `Q${match[1]}`;
    }

    // 2. Busca qualquer padrão Q... no card
    const cardText = card.textContent || '';
    const matchAny = cardText.match(/\bQ\s*[:.-]?\s*(\d{3,9})\b/i);
    if (matchAny) return `Q${matchAny[1]}`;

    // 3. Fallback: "Questão 12345"
    const matchQuestao = cardText.match(/Quest[ãa]o\s*[:.-]?\s*(\d{3,9})/i);
    if (matchQuestao) return `Q${matchQuestao[1]}`;

    // 4. Fallback determinístico caso o ID numérico não esteja explícito
    const content = card.querySelector('.content, [class*="content"]')?.textContent?.trim();
    if (content && content.length > 15) {
      let hash = 0;
      for (let i = 0; i < Math.min(content.length, 60); i++) {
        hash = ((hash << 5) - hash) + content.charCodeAt(i);
        hash |= 0;
      }
      return `Q${Math.abs(hash)}`;
    }

    return null;
  }

  function isCardAnswered(card) {
    if (!card) return false;

    // Indicador oficial do Caveira: banner de estatísticas pós-resposta
    if (card.querySelector('.stats-box, [class*="stats-box"]')) return true;

    // Indicador de alternativa colorida pelo resultado oficial
    if (card.querySelector('.alternative-letter.bg-correct-2, .alternative-letter.bg-incorrect-2, .bg-correct-1, .bg-incorrect-1')) {
      return true;
    }

    // Gráfico de percentual de erro das alternativas
    if (card.querySelector('.error-percentage, [class*="error-percentage"]')) {
      return true;
    }

    // Texto explícito
    const text = card.textContent || '';
    if (text.includes('PARABÉNS!') || text.includes('Você acertou!') || text.includes('Você errou!') || text.includes('Resposta correta')) {
      return true;
    }

    return false;
  }

  function extractQuestionData(card, qId) {
    if (!card) return null;

    // Disciplina e Tópico
    const subjectEl = card.querySelector('.subject, [class*="subject"]');
    let subject = 'Geral';
    let topic = 'Geral';
    if (subjectEl) {
      const text = subjectEl.textContent.trim();
      const parts = text.split('->');
      subject = parts[0]?.trim() || 'Geral';
      topic = parts.slice(1).join('->').trim() || subject;
    }

    // Metadados (Banca, Ano, Dificuldade)
    const infoText = card.querySelector('.question-info, [class*="question-info"]')?.textContent || '';
    const bancaMatch = infoText.match(/Banca:\s*([^Ano\n]+)/i);
    const anoMatch = infoText.match(/Ano:\s*(\d+)/i);
    const diffMatch = infoText.match(/Dificuldade:\s*([^\n]+)/i);

    const banca = bancaMatch ? bancaMatch[1].trim() : 'CAVEIRA';
    const ano = anoMatch ? anoMatch[1].trim() : '2026';
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Média';

    // Enunciado
    const content = card.querySelector('.content, [class*="content"]')?.innerText?.trim() || '';

    // Análise de Acerto / Erro
    const statsBox = card.querySelector('.stats-box, [class*="stats-box"]');
    const cardText = card.textContent || '';
    
    const isSuccessBanner = (statsBox && (statsBox.querySelector('.bg-correct-1') || statsBox.textContent.includes('PARABÉNS') || statsBox.textContent.includes('acertou'))) ||
                            cardText.includes('PARABÉNS!') || cardText.includes('Você acertou!');
                            
    const isErrorBanner = (statsBox && (statsBox.querySelector('.bg-incorrect-1') || statsBox.textContent.includes('ERROU') || statsBox.textContent.includes('Resposta correta'))) ||
                          cardText.includes('Você errou!') || cardText.includes('QUE PENA');

    let detectedCorrectLetter = null;
    let detectedIncorrectLetter = null;

    // Alternativas
    const altContainers = card.querySelectorAll('.alternative, [class*="alternative"]');
    altContainers.forEach(alt => {
      const letterEl = alt.querySelector('.alternative-letter, [class*="alternative-letter"]');
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

    // Tempo cronometrado real para esta questão
    const durationSeconds = Math.max(3, timerSeconds || 15);

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

  // --- 5. SALVAR QUESTÃO E TRANSMITIR ---
  function saveQuestion(question) {
    console.log('💀 [QG da PRF] Salvando questão:', question.id, question.hit ? 'ACERTO' : 'ERRO');
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'CAVEIRA_QUESTION_ANSWERED',
        payload: question
      }, (res) => {
        if (res && res.session) {
          sessionStats = {
            total: Number(res.session.total) || 0,
            hits: Number(res.session.hits) || 0,
            errors: Number(res.session.errors) || 0
          };
          updateHudStats();
        }
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

    // Fecha após 12s se o usuário não interagir
    promptDismissTimer = setTimeout(() => {
      dismissPrompt();
    }, 12000);
  }

  // --- 7. VARREDURA INTELIGENTE DE CARDS ---
  function scanCards() {
    createHud();

    const cards = document.querySelectorAll('.q-card, [class*="q-card"]');
    if (!cards || cards.length === 0) return;

    let firstUnansweredQId = null;

    cards.forEach(card => {
      const qId = extractQuestionId(card);
      if (!qId) return;

      const answered = isCardAnswered(card);

      if (!answered) {
        seenUnansweredIds.add(qId);
        if (!firstUnansweredQId) {
          firstUnansweredQId = qId;
        }
        // Se a questão estava marcada como processada mas agora está não-respondida (ex: refazer), limpa
        if (processedInSession.has(qId)) {
          processedInSession.delete(qId);
        }
      }

      // Se a questão foi respondida e AINDA NÃO FOI PROCESSADA NESTA SESSÃO:
      if (answered && !processedInSession.has(qId)) {
        processedInSession.add(qId); // NUNCA MAIS PROCESSA ESTA QUESTÃO NESTA SESSÃO (Zero loops)
        console.log(`💀 [QG da PRF] Questão resolvida detectada: ${qId}!`);

        // Congela o cronômetro para esta questão
        pauseTimer();

        const questionData = extractQuestionData(card, qId);
        if (questionData) {
          activeQuestionData = questionData;
          saveQuestion(questionData);
          showPrompt(questionData);
          playTacticalTone(questionData.hit);
        }
      }
    });

    // Se há uma nova questão não respondida visível e o usuário não está focado nela:
    if (firstUnansweredQId && firstUnansweredQId !== currentQuestionId) {
      resetAndStartTimerForQuestion(firstUnansweredQId);
    }
  }

  function scheduleScan(delay = 40) {
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(scanCards, delay);
  }

  // --- 8. GATILHOS E EVENTOS DE ALTA VELOCIDADE ---
  function setupTriggers() {
    // 1. Cliques do usuário
    document.addEventListener('click', (e) => {
      // Ignora cliques no próprio HUD
      if (e.target.closest('#qg-caveira-hud')) return;

      // Foco manual ao clicar em qualquer card de questão
      const card = e.target.closest('.q-card, [class*="q-card"]');
      if (card) {
        const cardQId = extractQuestionId(card);
        if (cardQId && cardQId !== currentQuestionId && !isCardAnswered(card)) {
          resetAndStartTimerForQuestion(cardQId);
        }
      }

      // Registro da alternativa clicada
      const alt = e.target.closest('.alternative, [class*="alternative"]');
      if (alt) {
        const letter = alt.querySelector('.alternative-letter, [class*="alternative-letter"]')?.textContent?.trim();
        if (letter && letter.length <= 2) {
          lastUserClickedChoice = letter;
          console.log(`💀 [QG da PRF] Alternativa selecionada: ${letter}`);
        }
      }

      // Clique em qualquer botão de Responder
      const btn = e.target.closest('button, .q-btn, a');
      if (btn) {
        const text = btn.textContent || '';
        if (text.includes('Responder') || btn.classList.contains('light-mode-answer-btn')) {
          console.log('💀 [QG da PRF] Botão Responder acionado! Micro-verificações ativadas...');
          // Fila rápida para resposta quase instantânea (< 50ms)
          setTimeout(scanCards, 40);
          setTimeout(scanCards, 120);
          setTimeout(scanCards, 240);
          setTimeout(scanCards, 450);
          setTimeout(scanCards, 800);
          setTimeout(scanCards, 1500);
          setTimeout(scanCards, 2500);
        }

        // Clique em botões de navegação (Próxima, Avançar, etc.)
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

    // 2. Atalhos de teclado (ex: avançar com setas)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setTimeout(scanCards, 100);
        setTimeout(scanCards, 400);
      }
    });

    // 3. Observador de mutações do Quasar / Vue (ignora HUD, reage imediatamente)
    const observer = new MutationObserver((mutations) => {
      const isInternal = mutations.every(m => m.target.closest && m.target.closest('#qg-caveira-hud'));
      if (isInternal) return;

      scheduleScan(30);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'disabled']
    });

    // 4. Polling de contingência a cada 1.2s
    setInterval(scanCards, 1200);

    // Execução inicial
    scanCards();
  }

  // Feedback de áudio Web Audio API (Tático)
  function playTacticalTone(isSuccess) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (_) {}
  }

  // Inicialização
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
