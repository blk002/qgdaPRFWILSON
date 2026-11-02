// QG DA PRF — Rastreador Tático de Questões do Projeto Caveira (v3.1 — Detecção Inteligente por Scroll & Viewport)

(function() {
  console.log('💀 [QG da PRF] Rastreador Caveira v3.1 ativo em:', window.location.href);

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
  let scrollRafId = null;

  // Armazena o tempo individual de cada questão (permite rolar entre questões sem perder a contagem de cada uma)
  const questionTimers = new Map();
  // Rastreia questões que já estavam respondidas quando a página carregou
  const preAnsweredOnLoad = new Set();
  // Rastreia questões já contabilizadas nesta sessão da página
  const processedInSession = new Set();
  // Rastreia questões nas quais o usuário REALMENTE clicou em "Responder"
  const pendingAnswerQIds = new Set();
  // Cache de questões já salvas no storage local do Chrome
  const savedQuestionIds = new Set();

  // Estado da Sessão no HUD
  let sessionStats = {
    total: 0,
    hits: 0,
    errors: 0
  };

  function loadInitialState() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, SCHEMA_KEY], (res) => {
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

        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        questions.forEach(q => {
          if (q && q.id) savedQuestionIds.add(q.id);
        });

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
          activeQuestionData.confidence = btn.dataset.confidence;
          saveQuestion(activeQuestionData, true);
          if (activeQuestionData.hit) {
            setTimeout(dismissPrompt, 500);
          }
        }
      });
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
  function startTimerInterval() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
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
  }

  function pauseTimer() {
    isTimerRunning = false;
  }

  function clearActiveQuestionState() {
    if (!currentQuestionId && !isTimerRunning) return;
    isTimerRunning = false;
    currentQuestionId = null;
    timerSeconds = 0;
    dismissPrompt();
    renderTimerDisplay();
    const currentQEl = document.getElementById('qg-current-q-id');
    if (currentQEl) {
      currentQEl.textContent = 'Aguardando questão...';
    }
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

    renderTimerDisplay();

    const currentQEl = document.getElementById('qg-current-q-id');
    if (currentQEl) {
      currentQEl.textContent = isAlreadyAnswered ? `${newQId} ✓` : newQId;
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
    const rate = sessionStats.total > 0 ? Math.round((sessionStats.hits / sessionStats.total) * 100) : 0;
    elNet.textContent = `${rate}%`;
    elNet.className = `qg-hud-stat-value ${rate >= 70 ? 'green' : rate >= 50 ? 'gold' : sessionStats.total === 0 ? 'gold' : 'red'}`;
  }

  // --- 4. SELEÇÃO DE CARDS E DETECÇÃO POR VIEWPORT (SCROLL) ---
  function getQuestionCards() {
    const allCards = document.querySelectorAll('.q-card');
    return Array.from(allCards).filter(card => {
      if (card.closest('#qg-caveira-hud')) return false;
      if (card.parentElement && card.parentElement.closest('.q-card')) return false;
      // Garante que o card está realmente visível na tela atual (ignora abas/rotas em cache ou ocultas)
      if (card.offsetParent === null) return false;
      const rect = card.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const hasNumber = Boolean(card.querySelector('.number'));
      const hasAlternatives = Boolean(card.querySelector('.question-alternatives, .alternative'));
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
    const statsBox = card.querySelector('.stats-box');
    if (statsBox) {
      const text = statsBox.textContent || '';
      if (
        Boolean(statsBox.querySelector('.bg-correct-1, .bg-incorrect-1, .title-stats')) ||
        text.includes('PARABÉNS') ||
        text.includes('ERROU') ||
        text.includes('acertou') ||
        text.includes('Resposta correta')
      ) {
        return true;
      }
    }

    // Fallback: se qualquer alternativa já estiver pintada de verde ou vermelho no DOM
    const hasColoredAlternative = Boolean(
      card.querySelector('.bg-correct-1, .bg-correct-2, .bg-incorrect-1, .bg-incorrect-2')
    );
    if (hasColoredAlternative) return true;

    // Fallback: botão "Responder" ausente ou desabilitado com estatísticas já renderizadas
    const answerBtn = card.querySelector('button.light-mode-answer-btn, .q-btn');
    if (answerBtn && answerBtn.disabled && (card.textContent.includes('Comentários') || card.textContent.includes('Estatísticas'))) {
      return true;
    }

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
      const subCat = (full.includes('contran') || full.includes('resolução'))
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
      full.includes('sinalização') || full.includes('habilitação') || full.includes('sinistro')
    ) {
      const subCat = (full.includes('contran') || full.includes('resolução'))
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

    const subjectEl = card.querySelector('.subject');
    let subject = 'Geral';
    let topic = 'Geral';
    if (subjectEl) {
      const text = subjectEl.textContent.trim();
      const parts = text.split('->').map(s => s.trim()).filter(Boolean);
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

    const isCorrect = Boolean(statsBox?.querySelector('.bg-correct-1')) ||
                      statsText.includes('PARABÉNS') ||
                      statsText.includes('acertou');

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
      const ansMatch = statsText.match(/Resposta correta:\s*([A-E])/i);
      if (ansMatch) {
        correctChoice = ansMatch[1].toUpperCase();
      } else {
        correctChoice = userChoice === 'C' ? 'E' : 'C';
      }
    }

    const elapsedForThisQ = questionTimers.get(qId) || timerSeconds || 10;
    const durationSeconds = Math.max(3, elapsedForThisQ);

    return {
      id: qId,
      bloco,
      canonicalSubject,
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

        savedQuestionIds.add(question.id);

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

  // --- 7. VARREDURA DE CARDS E DETECÇÃO DE VIEWPORT ---
  let isInitialScan = true;

  function scanCards() {
    createHud();

    const cards = getQuestionCards();
    if (!cards || cards.length === 0) {
      clearActiveQuestionState();
      return;
    }

    cards.forEach(card => {
      const qId = extractQuestionId(card);
      if (!qId) return;

      const answered = isCardAnswered(card);

      if (isInitialScan && answered) {
        preAnsweredOnLoad.add(qId);
        processedInSession.add(qId);
        return;
      }

      if (!answered) {
        preAnsweredOnLoad.delete(qId);
        processedInSession.delete(qId);
      } else {
        // A questão está respondida no Caveira.
        // Se ela ainda não foi salva no storage ou foi marcada por clique/foco, ela DEVE ser capturada!
        const wasSolvedNow = pendingAnswerQIds.has(qId) || 
                             (currentQuestionId === qId && !preAnsweredOnLoad.has(qId)) ||
                             (!preAnsweredOnLoad.has(qId) && !isInitialScan) ||
                             (!savedQuestionIds.has(qId) && !preAnsweredOnLoad.has(qId));

        if (wasSolvedNow && !processedInSession.has(qId)) {
          processedInSession.add(qId);
          savedQuestionIds.add(qId);
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
    if (scrollRafId) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
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
    // 1. Detecção em tempo real ao rolar a página e ao trocar de rota na SPA
    window.addEventListener('scroll', handleScrollUpdate, { capture: true, passive: true });
    window.addEventListener('wheel', handleScrollUpdate, { passive: true });
    window.addEventListener('popstate', () => scheduleScan(50));
    window.addEventListener('hashchange', () => scheduleScan(50));

    // 2. Cliques do usuário
    document.addEventListener('click', (e) => {
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
        if (text.includes('Responder') || btn.classList.contains('light-mode-answer-btn') || btn.classList.contains('bg-primary') || btn.getAttribute('aria-label')?.includes('Responder')) {
          const targetQId = clickedCardQId || currentQuestionId;
          if (targetQId) {
            pendingAnswerQIds.add(targetQId);
          }
          // Varreduras rápidas e estendidas para cobrir qualquer atraso de rede da API do Caveira
          [40, 100, 200, 400, 800, 1500, 2500, 4000].forEach(delay => setTimeout(scanCards, delay));
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

    // 3. Teclado (Enter, Setas, PageDown/PageUp)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && currentQuestionId) {
        pendingAnswerQIds.add(currentQuestionId);
        setTimeout(scanCards, 80);
        setTimeout(scanCards, 350);
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'PageUp') {
        setTimeout(handleScrollUpdate, 60);
        setTimeout(scanCards, 200);
      }
    });

    // 4. MutationObserver para capturar respostas instantaneamente
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
