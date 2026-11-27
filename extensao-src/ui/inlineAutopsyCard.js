// Card tático inline em Shadow DOM dentro dos cards de questão do Projeto Caveira (v3.4.9)

export const INLINE_AUTOPSY_CLASS = 'qg-inline-autopsy-host';

const SANS_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const AUTOPSY_ERROR_CAUSES = [
  {
    id: 'leitura',
    icon: '👀',
    accent: '#fbbf24',
    label: 'Leitura / Desatenção',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  },
  {
    id: 'decoreba',
    icon: '🧠',
    accent: '#a78bfa',
    label: 'Decoreba / Prazo / Pena',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
  },
  {
    id: 'pegadinha',
    icon: '🪤',
    accent: '#38bdf8',
    label: 'Pegadinha da banca',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  },
  {
    id: 'base',
    icon: '📚',
    accent: '#fb7185',
    label: 'Falta de base',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
  },
  {
    id: 'cansaco',
    icon: '😵',
    accent: '#94a3b8',
    label: 'Cansaço / Chute',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  },
];

export const CONFIDENCE_OPTIONS = [
  {
    id: 'sabia',
    icon: '🎯',
    accent: '#34d399',
    label: 'Sabia',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
  },
  {
    id: 'duvida',
    icon: '🤔',
    accent: '#fbbf24',
    label: 'Dúvida (+FSRS)',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  },
  {
    id: 'chute',
    icon: '🎲',
    accent: '#38bdf8',
    label: 'Chute (+FSRS)',
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="3"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M9 15h.01"/><path d="M15 15h.01"/><path d="M12 12h.01"/></svg>',
  },
];

const CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

const INLINE_CARD_CSS = `
:host {
  all: initial;
  display: block;
  font-family: ${SANS_STACK};
  color: #f8fafc;
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: border-box;
  font-family: ${SANS_STACK};
}
.qg-inline-card {
  position: relative;
  overflow: hidden;
  font-family: ${SANS_STACK};
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  background: #141821;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 14px 32px -12px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(15, 23, 42, 0.4);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qg-inline-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #f43f5e;
}
.qg-inline-card.is-hit::before {
  background: #10b981;
}
.qg-inline-card.is-collapsed {
  padding: 8px 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.qg-inline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.qg-inline-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.qg-status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.3;
  flex-shrink: 0;
}
.qg-status-pill.is-error {
  background: rgba(244, 63, 94, 0.18);
  color: #fecdd3;
  border: 1px solid rgba(244, 63, 94, 0.35);
}
.qg-status-pill.is-hit {
  background: rgba(16, 185, 129, 0.18);
  color: #a7f3d0;
  border: 1px solid rgba(16, 185, 129, 0.35);
}
.qg-inline-question {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  letter-spacing: -0.01em;
  line-height: 1.3;
}
.qg-inline-close {
  appearance: none;
  font-family: ${SANS_STACK};
  background: transparent;
  border: none;
  color: #94a3b8;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.14s ease, color 0.14s ease;
}
.qg-inline-close svg {
  width: 14px;
  height: 14px;
}
.qg-inline-close:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #f8fafc;
}
.qg-inline-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.qg-pill-btn {
  appearance: none;
  font-family: ${SANS_STACK};
  background: #1e2433;
  border: 1px solid rgba(255, 255, 255, 0.13);
  color: #f8fafc;
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.14s ease, border-color 0.14s ease, transform 0.1s ease;
}
.qg-pill-btn:hover {
  background: #283145;
  border-color: var(--qg-accent, rgba(148, 163, 184, 0.45));
  color: #ffffff;
}
.qg-pill-btn:active {
  transform: scale(0.98);
}
.qg-pill-btn.active {
  background: rgba(56, 189, 248, 0.18);
  border-color: var(--qg-accent, #38bdf8);
  color: #ffffff;
}
.qg-inline-card.is-error .qg-pill-btn.active {
  background: rgba(244, 63, 94, 0.2);
}
.qg-inline-card.is-hit .qg-pill-btn.active {
  background: rgba(16, 185, 129, 0.2);
}
.qg-pill-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--qg-accent, #94a3b8);
  flex-shrink: 0;
}
.qg-pill-ico svg {
  width: 14px;
  height: 14px;
}
.qg-badge-summary {
  font-size: 12px;
  font-weight: 600;
  color: #f8fafc;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.qg-badge-check {
  width: 15px;
  height: 15px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(244, 63, 94, 0.2);
  color: #fda4af;
}
.qg-inline-card.is-hit .qg-badge-check {
  background: rgba(16, 185, 129, 0.22);
  color: #6ee7b7;
}
.qg-badge-check svg {
  width: 10px;
  height: 10px;
}
.qg-badge-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.qg-link-btn {
  appearance: none;
  font-family: ${SANS_STACK};
  background: #1e2433;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}
.qg-link-btn:hover {
  background: #283145;
  color: #dbeafe;
}
`;

function canPlaceCardOnRight(altsEl) {
  if (!altsEl) return false;
  const altsRect = altsEl.getBoundingClientRect();
  if (!altsRect || altsRect.width < 700) return false;

  let maxLeftContentRight = altsRect.left;
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
      if (r && r.width > 0 && r.height > 0 && r.right > maxLeftContentRight) {
        maxLeftContentRight = r.right;
      }
    }
    altsEl.querySelectorAll('.q-linear-progress, [role="progressbar"]').forEach((bar) => {
      if (bar.closest(`.${INLINE_AUTOPSY_CLASS}`)) return;
      const br = bar.getBoundingClientRect();
      if (br && br.width > 0 && br.width < altsRect.width * 0.6 && br.right > maxLeftContentRight) {
        maxLeftContentRight = br.right;
      }
    });
  } catch (_) {
    return false;
  }

  return (altsRect.right - maxLeftContentRight) >= 445;
}

function getSelectedItem(state) {
  if (!state.hit) {
    return AUTOPSY_ERROR_CAUSES.find((c) => c.id === state.errorReason) || null;
  }
  return CONFIDENCE_OPTIONS.find((c) => c.id === state.confidence) || null;
}

function renderShadowContent(shadowRoot, state, callbacks, host) {
  const isError = !state.hit;
  const variantClass = isError ? 'is-error' : 'is-hit';
  const selectedItem = getSelectedItem(state);
  const isCollapsed = Boolean(state.collapsed && selectedItem);

  shadowRoot.innerHTML = '';
  const styleEl = document.createElement('style');
  styleEl.textContent = INLINE_CARD_CSS;

  const cardEl = document.createElement('div');
  cardEl.className = `qg-inline-card ${variantClass}${isCollapsed ? ' is-collapsed' : ''}`;

  if (isCollapsed) {
    const summaryEl = document.createElement('span');
    summaryEl.className = 'qg-badge-summary';

    const checkEl = document.createElement('span');
    checkEl.className = 'qg-badge-check';
    checkEl.innerHTML = CHECK_SVG;

    const icoEl = document.createElement('span');
    icoEl.className = 'qg-pill-ico';
    icoEl.style.setProperty('--qg-accent', selectedItem.accent);
    icoEl.innerHTML = selectedItem.svg;

    const txtEl = document.createElement('span');
    txtEl.textContent = isError
      ? `Autópsia: ${selectedItem.label}`
      : selectedItem.label;

    summaryEl.appendChild(checkEl);
    summaryEl.appendChild(icoEl);
    summaryEl.appendChild(txtEl);

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
    closeBtn.innerHTML = CLOSE_SVG;
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

    const headLeft = document.createElement('div');
    headLeft.className = 'qg-inline-head-left';

    const statusPill = document.createElement('span');
    statusPill.className = `qg-status-pill ${variantClass}`;
    statusPill.textContent = isError ? 'ERROU' : 'ACERTOU';

    const questionEl = document.createElement('span');
    questionEl.className = 'qg-inline-question';
    questionEl.textContent = isError ? 'Por que você errou?' : 'Como você acertou?';

    headLeft.appendChild(statusPill);
    headLeft.appendChild(questionEl);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'qg-inline-close';
    closeBtn.innerHTML = CLOSE_SVG;
    closeBtn.title = 'Fechar';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      host.remove();
    });

    headEl.appendChild(headLeft);
    headEl.appendChild(closeBtn);

    const pillsEl = document.createElement('div');
    pillsEl.className = 'qg-inline-pills';

    const items = isError ? AUTOPSY_ERROR_CAUSES : CONFIDENCE_OPTIONS;
    const currentSelected = isError ? state.errorReason : state.confidence;

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `qg-pill-btn${currentSelected === item.id ? ' active' : ''}`;
      btn.style.setProperty('--qg-accent', item.accent);

      const ico = document.createElement('span');
      ico.className = 'qg-pill-ico';
      ico.innerHTML = item.svg;

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;

      btn.appendChild(ico);
      btn.appendChild(labelSpan);

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
      'all: initial; position: absolute; top: 12px; right: 14px; width: min(430px, 46%); z-index: 25; pointer-events: auto;'
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
