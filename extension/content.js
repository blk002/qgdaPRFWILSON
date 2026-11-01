// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira ativado.');

  let currentQuestionId = null;
  let questionStartTime = Date.now();
  let timerInterval = null;
  let lastCapturedQuestionId = null;
  let lastUserClickedChoice = null;
  let activeQuestionData = null;

  // Estado da Sessão no HUD
  let sessionStats = {
    total: 0,
    hits: 0,
    errors: 0
  };

  // Carregar sessão salva da extensão
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ type: 'GET_CAVEIRA_QUESTIONS' }, (res) => {
      if (res && res.session) {
        sessionStats = res.session;
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
            <span class="qg-hud-stat-value blue" id="qg-stat-total">0</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Certas</span>
            <span class="qg-hud-stat-value green" id="qg-stat-hits">0</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Erradas</span>
            <span class="qg-hud-stat-value red" id="qg-stat-errors">0</span>
          </div>
          <div class="qg-hud-stat-box">
            <span class="qg-hud-stat-label">Líquida</span>
            <span class="qg-hud-stat-value gold" id="qg-stat-net">0</span>
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
        <a href="http://localhost:5173/#/caveira" target="_blank" class="qg-btn-qg-link" id="qg-open-link">
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

    // Botoes de confianca e motivo
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
    if (timerInterval) clearInterval(timerInterval);
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

  // --- 4. EXTRAÇÃO INTELIGENTE DA QUESTÃO DO PROJETO CAVEIRA ---
  function extractQuestionData(card) {
    if (!card) return null;

    // ID da Questão (ex: Q111494)
    const idEl = card.querySelector('.number span');
    const qId = idEl ? idEl.textContent.trim() : `Q_${Date.now()}`;

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

    // Alternativas e Escolha do Usuário
    let userChoice = lastUserClickedChoice || 'C';
    let isCorrect = false;
    let correctChoice = 'C';

    // Identificar qual alternativa foi marcada
    const altLetters = card.querySelectorAll('.alternative-letter');
    altLetters.forEach(al => {
      const letter = al.textContent.trim();
      if (al.classList.contains('bg-correct-2')) {
        userChoice = letter;
        isCorrect = true;
        correctChoice = letter;
      } else if (al.classList.contains('bg-incorrect-2')) {
        userChoice = letter;
        isCorrect = false;
      }
    });

    // Análise da caixa de resultado (Stats Box)
    const statsBox = card.querySelector('.stats-box');
    if (statsBox) {
      const titleText = statsBox.querySelector('.title-stats')?.textContent || '';
      const subText = statsBox.querySelector('.subtitle-stats')?.textContent || '';

      if (titleText.includes('PARABÉNS') || subText.includes('acertou')) {
        isCorrect = true;
        correctChoice = userChoice;
      } else if (titleText.includes('ERROU') || subText.includes('correta')) {
        isCorrect = false;
        const matchCorrect = subText.match(/Resposta correta:\s*([A-E])/i);
        if (matchCorrect) {
          correctChoice = matchCorrect[1].trim();
        } else {
          // Se o usuário marcou E e errou, a certa é C (e vice-versa em Cebraspe)
          correctChoice = userChoice === 'C' ? 'E' : 'C';
        }
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
      confidence: isCorrect ? 'sabia' : 'duvida', // padrão inicial
      errorReason: isCorrect ? null : 'conteudo',  // padrão inicial se errou
      timestamp: new Date().toISOString()
    };
  }

  // --- 5. SALVAR QUESTÃO E TRANSMITIR ---
  function saveQuestion(question) {
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

    // Fecha automaticamente após 12s se não interagir
    setTimeout(() => {
      if (promptBox && promptBox.style.display === 'block') {
        promptBox.style.display = 'none';
      }
    }, 12000);
  }

  // --- 7. OBSERVAÇÃO DE MUTAÇÃO (QUANDO A QUESTÃO É RESPONDIDA) ---
  function setupObserver() {
    // Monitorar cliques em alternativas para registrar a intenção antes do envio
    document.addEventListener('click', (e) => {
      const alt = e.target.closest('.alternative');
      if (alt) {
        const letter = alt.querySelector('.alternative-letter')?.textContent?.trim();
        if (letter) {
          lastUserClickedChoice = letter;
        }
      }
    }, true);

    const observer = new MutationObserver(() => {
      // Procurar todos os cards de questão
      const cards = document.querySelectorAll('.q-card');
      cards.forEach(card => {
        const qIdEl = card.querySelector('.number span');
        if (!qIdEl) return;
        const qId = qIdEl.textContent.trim();

        // Atualizar indicador da questão atual no HUD
        const currentQEl = document.getElementById('qg-current-q-id');
        if (currentQEl && currentQuestionId !== qId) {
          currentQuestionId = qId;
          currentQEl.textContent = qId;
          resetTimer();
        }

        // Checar se a questão foi respondida (presença de .stats-box ou badges coloridos)
        const statsBox = card.querySelector('.stats-box');
        const hasResult = statsBox || card.querySelector('.bg-correct-1') || card.querySelector('.bg-incorrect-1');

        if (hasResult && lastCapturedQuestionId !== qId) {
          lastCapturedQuestionId = qId;
          console.log(`💀 [QG da PRF] Questão ${qId} detectada e resolvida!`);

          const questionData = extractQuestionData(card);
          if (questionData) {
            activeQuestionData = questionData;
            saveQuestion(questionData);
            showPrompt(questionData);

            // Tocar feedback sonoro tático
            playTacticalTone(questionData.hit);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // Feedback de áudio sintético Web Audio API (sem dependências externas)
  function playTacticalTone(isSuccess) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
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

  // Iniciar após carregar o DOM
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
