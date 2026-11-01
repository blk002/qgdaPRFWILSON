// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (Otimizado e Seguro)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira ativado em:', window.location.href);

  const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/caveira';

  let currentQuestionId = null;
  let questionStartTime = Date.now();
  let timerInterval = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;
  let scanDebounceTimer = null;

  // Conjunto de questões já processadas nesta aba para evitar reprocessamento ou loop
  const processedQuestions = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    total: 0,
    hits: 0,
    errors: 0
  };

  // Carregar sessão salva da extensão
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (res) => {
      if (res) {
        if (res.session) {
          sessionStats = res.session;
          updateHudStats();
        }
        if (Array.isArray(res.questions)) {
          res.questions.forEach(q => {
            if (q.id) processedQuestions.add(q.id);
          });
        }
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
          <span id="qg-prompt-status-badge" class="qg-prompt-badge hit">ACERTO</span>
          <span>Autoavaliação Tática:</span>
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

    // Eventos do HUD
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

    // Botões de confiança e motivo do erro
    hud.querySelectorAll('[data-confidence]').forEach(btn => {
      btn.addEventListener('click', () => {
        hud.querySelectorAll('[data-confidence]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          activeQuestionData.confidence = btn.dataset.confidence;
          saveQuestion(activeQuestionData);
        }
      });
    });

    hud.querySelectorAll('[data-reason]').forEach(btn => {
      btn.addEventListener('click', () => {
        hud.querySelectorAll('[data-reason]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (activeQuestionData) {
          activeQuestionData.errorReason = btn.dataset.reason;
          saveQuestion(activeQuestionData);
        }
      });
    });

    startTimer();
  }

  // --- 2. CRONÔMETRO DE QUESTÃO ---
  function startTimer() {
    if (timerInterval) return; // Evita múltiplos intervals
    timerInterval = setInterval(() => {
      const timerEl = document.getElementById('qg-timer');
      if (!timerEl) return;
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function resetTimer() {
    questionStartTime = Date.now();
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

  // --- 4. EXTRAÇÃO INTELIGENTE DA QUESTÃO ---
  function extractQuestionData(card) {
    if (!card) return null;

    // 1. ID da Questão (ex: Q111494)
    const idEl = card.querySelector('.number span, .number, [class*="number"]');
    const idText = idEl ? idEl.textContent.trim() : '';
    const matchId = idText.match(/Q\d+/i) || card.textContent.match(/\b(Q\d{4,8})\b/i);
    const qId = matchId ? matchId[0].toUpperCase() : `Q_${Date.now()}`;

    // 2. Disciplina e Tópico
    const subjectEl = card.querySelector('.subject, [class*="subject"]');
    let subject = 'Geral';
    let topic = 'Geral';
    if (subjectEl) {
      const text = subjectEl.textContent.trim();
      const parts = text.split('->');
      subject = parts[0]?.trim() || 'Geral';
      topic = parts.slice(1).join('->').trim() || subject;
    }

    // 3. Metadados (Banca, Ano, Dificuldade)
    const infoText = card.querySelector('.question-info, [class*="question-info"]')?.textContent || '';
    const bancaMatch = infoText.match(/Banca:\s*([^Ano\n]+)/i);
    const anoMatch = infoText.match(/Ano:\s*(\d+)/i);
    const diffMatch = infoText.match(/Dificuldade:\s*([^\n]+)/i);

    const banca = bancaMatch ? bancaMatch[1].trim() : 'CAVEIRA';
    const ano = anoMatch ? anoMatch[1].trim() : '2026';
    const difficulty = diffMatch ? diffMatch[1].trim() : 'Média';

    // 4. Enunciado (limitado a 500 caracteres)
    const content = card.querySelector('.content, [class*="content"]')?.innerText?.trim() || '';

    // 5. Análise de Acerto / Erro e Alternativas
    const statsBox = card.querySelector('.stats-box, [class*="stats-box"]');
    const cardText = card.textContent || '';
    
    const isSuccessBanner = (statsBox && (statsBox.querySelector('.bg-correct-1') || statsBox.textContent.includes('PARABÉNS') || statsBox.textContent.includes('acertou'))) ||
                            cardText.includes('PARABÉNS!') || cardText.includes('Você acertou!');
                            
    const isErrorBanner = (statsBox && (statsBox.querySelector('.bg-incorrect-1') || statsBox.textContent.includes('ERROU') || statsBox.textContent.includes('Resposta correta'))) ||
                          cardText.includes('Você errou!') || cardText.includes('QUE PENA');

    let detectedCorrectLetter = null;
    let detectedIncorrectLetter = null;

    // Varre todas as alternativas
    const altContainers = card.querySelectorAll('.alternative, [class*="alternative"]');
    altContainers.forEach(alt => {
      const letterEl = alt.querySelector('.alternative-letter, [class*="alternative-letter"]');
      const letter = letterEl ? letterEl.textContent.trim() : null;
      if (!letter || letter.length > 2) return;

      const isGreen = alt.querySelector('.bg-correct-2, .bg-correct-1') || (letterEl && (letterEl.classList.contains('bg-correct-2') || letterEl.classList.contains('bg-correct-1')));
      const isRed = alt.querySelector('.bg-incorrect-2, .bg-incorrect-1') || (letterEl && (letterEl.classList.contains('bg-incorrect-2') || letterEl.classList.contains('bg-incorrect-1')));

      if (isGreen) {
        detectedCorrectLetter = letter;
      }
      if (isRed) {
        detectedIncorrectLetter = letter;
      }
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

    const durationSeconds = Math.max(3, Math.floor((Date.now() - questionStartTime) / 1000));

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
    console.log('💀 [QG da PRF] Salvando questão:', question);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'CAVEIRA_QUESTION_ANSWERED',
        payload: question
      }, (res) => {
        if (res && res.session) {
          sessionStats = res.session;
          updateHudStats();
        }
      });
    }
  }

  // --- 6. EXIBIR PROMPT TÁTICO NO HUD ---
  function showPrompt(question) {
    const promptBox = document.getElementById('qg-prompt-box');
    const badge = document.getElementById('qg-prompt-status-badge');
    const errorSection = document.getElementById('qg-error-reasons');
    if (!promptBox) return;

    badge.className = `qg-prompt-badge ${question.hit ? 'hit' : 'error'}`;
    badge.textContent = question.hit ? '✓ ACERTOU' : '✗ ERROU';

    if (question.hit) {
      errorSection.style.display = 'none';
    } else {
      errorSection.style.display = 'block';
    }

    // Reset botões ativos
    promptBox.querySelectorAll('.qg-btn-tag').forEach(b => b.classList.remove('active'));
    promptBox.style.display = 'block';

    // Fecha automaticamente após 15s se não interagir
    setTimeout(() => {
      if (promptBox && promptBox.style.display === 'block') {
        promptBox.style.display = 'none';
      }
    }, 15000);
  }

  // --- 7. VARREDURA SEGURA E DEBOUNCED DE QUESTÕES ---
  function scanCards() {
    createHud();

    const cards = document.querySelectorAll('.q-card, [class*="q-card"]');
    if (cards.length === 0) return;

    // Atualiza a questão ativa no HUD baseada no último clique ou na primeira da lista
    let activeCard = null;
    cards.forEach(card => {
      const idEl = card.querySelector('.number span, .number, [class*="number"]');
      const idText = idEl ? idEl.textContent.trim() : '';
      const matchId = idText.match(/Q\d+/i) || card.textContent.match(/\b(Q\d{4,8})\b/i);
      if (!matchId) return;
      const qId = matchId[0].toUpperCase();

      if (!activeCard) activeCard = qId;

      // Se a questão já foi processada nesta sessão, não repete
      if (processedQuestions.has(qId)) return;

      // Checa se tem banner ou classe de resultado
      const statsBox = card.querySelector('.stats-box, [class*="stats-box"]');
      const hasCorrectBanner = card.querySelector('.bg-correct-1, .bg-correct-2');
      const hasIncorrectBanner = card.querySelector('.bg-incorrect-1, .bg-incorrect-2');
      const hasResult = statsBox || hasCorrectBanner || hasIncorrectBanner || 
                        card.textContent.includes('PARABÉNS') || 
                        card.textContent.includes('acertou!') || 
                        card.textContent.includes('Você errou');

      if (hasResult) {
        processedQuestions.add(qId);
        console.log(`💀 [QG da PRF] Questão ${qId} finalizada! Processando...`);

        const questionData = extractQuestionData(card);
        if (questionData) {
          activeQuestionData = questionData;
          saveQuestion(questionData);
          showPrompt(questionData);
          playTacticalTone(questionData.hit);
        }
      }
    });

    // Atualiza a label do HUD apenas se mudou (sem forçar mutação contínua)
    if (activeCard && activeCard !== currentQuestionId) {
      currentQuestionId = activeCard;
      const currentQEl = document.getElementById('qg-current-q-id');
      if (currentQEl && currentQEl.textContent !== activeCard) {
        currentQEl.textContent = activeCard;
        resetTimer();
      }
    }
  }

  // Debounce para evitar sobrecarga de chamadas
  function scheduleScan(delay = 250) {
    if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
    scanDebounceTimer = setTimeout(scanCards, delay);
  }

  // --- 8. CONFIGURAÇÃO DOS GATILHOS E EVENTOS ---
  function setupObserver() {
    // 1. Cliques do usuário nas alternativas
    document.addEventListener('click', (e) => {
      // Ignora cliques que acontecem dentro do nosso HUD
      if (e.target.closest('#qg-caveira-hud')) return;

      const alt = e.target.closest('.alternative, [class*="alternative"]');
      if (alt) {
        const letter = alt.querySelector('.alternative-letter, [class*="alternative-letter"]')?.textContent?.trim();
        if (letter && letter.length <= 2) {
          lastUserClickedChoice = letter;
          console.log(`💀 [QG da PRF] Alternativa clicada: ${letter}`);
        }
      }

      // Clique no botão "Responder"
      const btn = e.target.closest('button, .q-btn');
      if (btn && (btn.textContent.includes('Responder') || btn.classList.contains('light-mode-answer-btn'))) {
        console.log('💀 [QG da PRF] Botão Responder acionado.');
        scheduleScan(300);
        scheduleScan(800);
        scheduleScan(1500);
      }
    }, true);

    // 2. MutationObserver no DOM com filtro anti-loop
    const observer = new MutationObserver((mutations) => {
      // Se TODAS as mutações forem do nosso próprio HUD, ignora completamente!
      const isInternal = mutations.every(m => m.target.closest && m.target.closest('#qg-caveira-hud'));
      if (isInternal) return;

      // Agendar varredura debounced (evita loop e acúmulo de memória)
      scheduleScan(300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false // Não precisa observar atributos no body inteiro (evita milhares de eventos)
    });

    // 3. Varredura inicial suave
    scheduleScan(500);
  }

  // Feedback de áudio Web Audio API
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

  // Inicialização após o DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createHud();
      setupObserver();
    });
  } else {
    createHud();
    setupObserver();
  }
})();
