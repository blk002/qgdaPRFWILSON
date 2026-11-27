// Card tático inline em Shadow DOM dentro dos cards de questão do Projeto Caveira (v3.4.8)

export const INLINE_AUTOPSY_CLASS = 'qg-inline-autopsy-host';

export const AUTOPSY_ERROR_CAUSES = [
  { id: 'leitura', icon: '👀', label: 'Leitura / Desatenção' },
  { id: 'decoreba', icon: '🧠', label: 'Decoreba / Prazo / Pena' },
  { id: 'pegadinha', icon: '🪤', label: 'Pegadinha da banca' },
  { id: 'base', icon: '📚', label: 'Falta de base' },
  { id: 'cansaco', icon: '😵', label: 'Cansaço / Chute' },
];

export const CONFIDENCE_OPTIONS = [
  { id: 'sabia', icon: '🎯', label: 'Sabia' },
  { id: 'duvida', icon: '🤔', label: 'Dúvida (+FSRS)' },
  { id: 'chute', icon: '🎲', label: 'Chute (+FSRS)' },
];

const INLINE_CARD_CSS = `
:host {
  all: initial;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #f4f4f5;
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: border-box;
}
.qg-inline-card {
  background: rgba(24, 24, 27, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 10px 26px -10px rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qg-inline-card.is-error {
  border-color: rgba(239, 68, 68, 0.42);
}
.qg-inline-card.is-hit {
  border-color: rgba(16, 185, 129, 0.42);
}
.qg-inline-card.is-collapsed {
  padding: 7px 11px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.qg-inline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.qg-inline-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.qg-inline-title.is-error {
  color: #fca5a5;
}
.qg-inline-title.is-hit {
  color: #6ee7b7;
}
.qg-inline-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 6px;
  cursor: pointer;
}
.qg-inline-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}
.qg-inline-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.qg-pill-btn {
  appearance: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.11);
  color: #e4e4e7;
  border-radius: 8px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: background 0.14s ease, border-color 0.14s ease, transform 0.1s ease;
}
.qg-pill-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.qg-pill-btn:active {
  transform: scale(0.97);
}
.qg-pill-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.65);
  color: #e0f2fe;
}
.qg-inline-card.is-error .qg-pill-btn.active {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(248, 113, 113, 0.7);
  color: #fee2e2;
}
.qg-inline-card.is-hit .qg-pill-btn.active {
  background: rgba(16, 185, 129, 0.22);
  border-color: rgba(52, 211, 153, 0.7);
  color: #d1fae5;
}
.qg-badge-summary {
  font-size: 11px;
  font-weight: 700;
  color: #e4e4e7;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.qg-badge-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  shrink: 0;
}
.qg-link-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #93c5fd;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  cursor: pointer;
}
.qg-link-btn:hover {
  background: rgba(56, 189, 248, 0.14);
  color: #dbeafe;
}
`;

function canPlaceCardOnRight(altsEl) {
  if (!altsEl) return false;
  const altsRect = altsEl.getBoundingClientRect();
  if (!altsRect || altsRect.width < 640) return false;

  const altCount = altsEl.children ? altsEl.children.length : 0;
  if (altCount === 2) {
    return true;
  }

  let maxGlyphRight = altsRect.left;
  try {
    const walker = document.createTreeWalker(altsEl, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      const parent = node.parentElement;
      if (parent && parent.closest(`.${INLINE_AUTOPSY_CLASS}`)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0 && r.right > maxGlyphRight) {
        maxGlyphRight = r.right;
      }
    }
  } catch (_) {
    return false;
  }

  return (altsRect.right - maxGlyphRight) >= 380;
}

function getLabelForSelection(state) {
  if (!state.hit) {
    const found = AUTOPSY_ERROR_CAUSES.find((c) => c.id === state.errorReason);
    return found ? `✓ Autópsia: ${found.icon} ${found.label}` : '';
  }
  const found = CONFIDENCE_OPTIONS.find((c) => c.id === state.confidence);
  return found ? `✓ ${found.icon} ${found.label}` : '';
}

function renderShadowContent(shadowRoot, state, callbacks, host) {
  const isError = !state.hit;
  const variantClass = isError ? 'is-error' : 'is-hit';
  const summaryLabel = getLabelForSelection(state);
  const isCollapsed = Boolean(state.collapsed && summaryLabel);

  shadowRoot.innerHTML = '';
  const styleEl = document.createElement('style');
  styleEl.textContent = INLINE_CARD_CSS;

  const cardEl = document.createElement('div');
  cardEl.className = `qg-inline-card ${variantClass}${isCollapsed ? ' is-collapsed' : ''}`;

  if (isCollapsed) {
    const summaryEl = document.createElement('span');
    summaryEl.className = 'qg-badge-summary';
    summaryEl.textContent = summaryLabel;

    const actionsEl = document.createElement('div');
    actionsEl.className = 'qg-badge-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'qg-link-btn';
    editBtn.textContent = 'Alterar';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.collapsed = false;
      renderShadowContent(shadowRoot, state, callbacks, host);
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'qg-inline-close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Fechar';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      host.remove();
    });

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(closeBtn);
    cardEl.appendChild(summaryEl);
    cardEl.appendChild(actionsEl);
  } else {
    const headEl = document.createElement('div');
    headEl.className = 'qg-inline-head';

    const titleEl = document.createElement('span');
    titleEl.className = `qg-inline-title ${variantClass}`;
    titleEl.textContent = isError
      ? '✗ ERROU · Por que você errou?'
      : '✓ ACERTOU · Como você acertou?';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'qg-inline-close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Fechar';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      host.remove();
    });

    headEl.appendChild(titleEl);
    headEl.appendChild(closeBtn);

    const pillsEl = document.createElement('div');
    pillsEl.className = 'qg-inline-pills';

    const items = isError ? AUTOPSY_ERROR_CAUSES : CONFIDENCE_OPTIONS;
    const currentSelected = isError ? state.errorReason : state.confidence;

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `qg-pill-btn${currentSelected === item.id ? ' active' : ''}`;
      btn.textContent = `${item.icon} ${item.label}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isError) {
          state.errorReason = item.id;
          state.collapsed = true;
          callbacks?.onSelectErrorReason?.(state.qId, item.id);
        } else {
          state.confidence = item.id;
          state.collapsed = true;
          callbacks?.onSelectConfidence?.(state.qId, item.id);
        }
        renderShadowContent(shadowRoot, state, callbacks, host);
      });
      pillsEl.appendChild(btn);
    });

    cardEl.appendChild(headEl);
    cardEl.appendChild(pillsEl);
  }

  shadowRoot.appendChild(styleEl);
  shadowRoot.appendChild(cardEl);
}

export function mountInlineAutopsyCard(card, questionData, callbacks = {}) {
  if (!card || !questionData?.id) return false;
  const altsEl = card.querySelector('.question-alternatives');
  if (!altsEl) return false;

  const qId = String(questionData.id);
  const existing = card.querySelector(`.${INLINE_AUTOPSY_CLASS}[data-qg-qid="${qId}"]`);
  if (existing) {
    existing.remove();
  }

  const placeRight = canPlaceCardOnRight(altsEl);
  const host = document.createElement('div');
  host.className = INLINE_AUTOPSY_CLASS;
  host.setAttribute('data-qg-qid', qId);

  if (placeRight) {
    try {
      if (getComputedStyle(altsEl).position === 'static') {
        altsEl.style.position = 'relative';
      }
    } catch (_) {}
    host.setAttribute(
      'style',
      'all: initial; position: absolute; top: 4px; right: 12px; width: min(450px, 49%); z-index: 25; pointer-events: auto;'
    );
    altsEl.appendChild(host);
  } else {
    host.setAttribute(
      'style',
      'all: initial; display: block; width: 100%; margin-top: 10px; pointer-events: auto;'
    );
    const btnRow = altsEl.nextElementSibling;
    if (btnRow && btnRow.parentElement) {
      btnRow.insertAdjacentElement('afterend', host);
    } else {
      altsEl.insertAdjacentElement('afterend', host);
    }
  }

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const state = {
    qId,
    hit: Boolean(questionData.hit),
    errorReason: questionData.errorReason || '',
    confidence: questionData.hit ? (questionData.confidence || '') : '',
    collapsed: false,
  };
  host.__qgState = state;
  host.__qgCallbacks = callbacks;

  host.addEventListener('click', (e) => e.stopPropagation());
  renderShadowContent(shadowRoot, state, callbacks, host);
  return true;
}

export function updateInlineAutopsyBadge(qId, patch = {}) {
  if (!qId) return false;
  const host = document.querySelector(`.${INLINE_AUTOPSY_CLASS}[data-qg-qid="${String(qId)}"]`);
  if (!host || !host.shadowRoot || !host.__qgState) return false;

  const state = host.__qgState;
  if (typeof patch.hit === 'boolean') state.hit = patch.hit;
  if (patch.errorReason !== undefined) state.errorReason = patch.errorReason;
  if (patch.confidence !== undefined) state.confidence = patch.confidence;
  state.collapsed = true;
  renderShadowContent(host.shadowRoot, state, host.__qgCallbacks || {}, host);
  return true;
}

export function destroyAllInlineAutopsyCards() {
  try {
    document.querySelectorAll(`.${INLINE_AUTOPSY_CLASS}`).forEach((el) => el.remove());
  } catch (_) {}
}
