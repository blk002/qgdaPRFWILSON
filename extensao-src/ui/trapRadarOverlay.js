// Overlay ao vivo do Radar Cebraspe (#2) no Projeto Caveira
// Usa CSS Custom Highlight API + Shadow DOM sem mutar o DOM interno do Vue.

import { buildTrapFingerprint, matchTextTrapsAgainstFingerprint } from '../content/cebraspeTraps.js';

export const TRAP_RADAR_CLASS = 'qg-trap-radar-host';
const HIGHLIGHT_NAME = 'qg-cebraspe-trap';
const STYLE_ID = 'qg-trap-highlight-style';
const SANS_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

let cachedFpSig = '';
let cachedFp = null;
const dismissedTrapCards = new Set();

const TRAP_PILL_CSS = `
:host {
  all: initial;
  display: block;
  margin-bottom: 10px;
  font-family: ${SANS_STACK};
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: border-box;
  font-family: ${SANS_STACK};
}
.qg-trap-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 11px;
  border-radius: 9px;
  background: #1a1611;
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fef3c7;
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.65);
}
.qg-trap-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 0;
}
.qg-trap-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fcd34d;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.qg-trap-msg {
  color: #fde68a;
  font-weight: 600;
}
.qg-trap-msg strong {
  color: #ffffff;
}
.qg-trap-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.22);
  color: #fcd34d;
  font-size: 11px;
  font-weight: 600;
}
.qg-trap-close {
  appearance: none;
  background: transparent;
  border: none;
  color: #a8a29e;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
}
.qg-trap-close:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #ffffff;
}
`;

function ensureHighlightStyle() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `::highlight(${HIGHLIGHT_NAME}) { background-color: rgba(245, 158, 11, 0.24); color: inherit; text-decoration: underline wavy #f59e0b; text-underline-offset: 3px; }`;
  document.head.appendChild(styleEl);
}

function getFingerprintMemoized(questionsCache = []) {
  const arr = Array.isArray(questionsCache) ? questionsCache : [];
  const first = arr[0];
  const sig = `${arr.length}|${first?.id || ''}|${first?.updatedAt || first?.timestamp || ''}`;
  if (!cachedFp || sig !== cachedFpSig) {
    cachedFpSig = sig;
    cachedFp = buildTrapFingerprint(arr);
  }
  return cachedFp;
}

function collectTextNodes(rootEl) {
  const segments = [];
  let fullText = '';
  try {
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const val = node.nodeValue || '';
      if (!val) continue;
      if (node.parentElement && node.parentElement.closest(`.${TRAP_RADAR_CLASS}`)) continue;
      const start = fullText.length;
      fullText += val;
      segments.push({ node, start, end: fullText.length });
    }
  } catch (_) {
    return { fullText: '', segments: [] };
  }
  return { fullText, segments };
}

function buildRangeForOffsets(segments, startOffset, endOffset) {
  let startNode = null;
  let startPos = 0;
  let endNode = null;
  let endPos = 0;

  for (const seg of segments) {
    if (!startNode && startOffset >= seg.start && startOffset < seg.end) {
      startNode = seg.node;
      startPos = startOffset - seg.start;
    }
    if (endOffset > seg.start && endOffset <= seg.end) {
      endNode = seg.node;
      endPos = endOffset - seg.start;
      break;
    }
  }

  if (!startNode || !endNode) return null;
  try {
    const r = document.createRange();
    r.setStart(startNode, startPos);
    r.setEnd(endNode, endPos);
    return r;
  } catch (_) {
    return null;
  }
}

function renderTrapPill(host, qId, hits) {
  const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '';

  const styleEl = document.createElement('style');
  styleEl.textContent = TRAP_PILL_CSS;

  const pill = document.createElement('div');
  pill.className = 'qg-trap-pill';

  const left = document.createElement('div');
  left.className = 'qg-trap-left';

  const badge = document.createElement('span');
  badge.className = 'qg-trap-badge';
  badge.textContent = '⚠ Radar Cebraspe';

  const top = hits[0];
  const msg = document.createElement('span');
  msg.className = 'qg-trap-msg';
  const strongTerm = document.createElement('strong');
  strongTerm.textContent = `"${top.label}"`;
  msg.appendChild(document.createTextNode('Atenção em '));
  msg.appendChild(strongTerm);
  msg.appendChild(
    document.createTextNode(` — você erra ${top.errorRate}% (${top.errors}/${top.total})`)
  );

  left.appendChild(badge);
  left.appendChild(msg);

  hits.slice(1, 3).forEach((extra) => {
    const chip = document.createElement('span');
    chip.className = 'qg-trap-chip';
    chip.textContent = `${extra.label} · ${extra.errorRate}%`;
    left.appendChild(chip);
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'qg-trap-close';
  closeBtn.textContent = '×';
  closeBtn.title = 'Ocultar alerta nesta questão';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissedTrapCards.add(qId);
    host.remove();
  });

  pill.appendChild(left);
  pill.appendChild(closeBtn);
  shadow.appendChild(styleEl);
  shadow.appendChild(pill);
}

export function applyTrapRadarToCards(cards = [], questionsCache = [], extractQuestionIdFn = null) {
  if (!Array.isArray(cards) || cards.length === 0) return;

  const fp = getFingerprintMemoized(questionsCache);
  const hasDangerTerms = Boolean(fp?.terms?.some((t) => t.errors >= 1 && t.errorRate >= 50));
  const supportsCssHighlight =
    typeof CSS !== 'undefined' && Boolean(CSS.highlights) && typeof Highlight !== 'undefined';

  if (!hasDangerTerms) {
    document.querySelectorAll(`.${TRAP_RADAR_CLASS}`).forEach((el) => el.remove());
    if (supportsCssHighlight) {
      try {
        CSS.highlights.delete(HIGHLIGHT_NAME);
      } catch (_) {}
    }
    return;
  }

  if (supportsCssHighlight) {
    ensureHighlightStyle();
  }

  const allRanges = [];

  cards.forEach((card) => {
    if (!card) return;
    const qId = typeof extractQuestionIdFn === 'function' ? extractQuestionIdFn(card) : '';
    const contentEl = card.querySelector('.content');
    if (!qId || !contentEl) return;

    const existingHost = card.querySelector(`.${TRAP_RADAR_CLASS}[data-qg-qid="${qId}"]`);
    if (dismissedTrapCards.has(qId)) {
      if (existingHost) existingHost.remove();
      return;
    }

    const { fullText, segments } = collectTextNodes(contentEl);
    if (!fullText) {
      if (existingHost) existingHost.remove();
      return;
    }

    const hits = matchTextTrapsAgainstFingerprint(fullText, fp);
    if (hits.length === 0) {
      if (existingHost) existingHost.remove();
      return;
    }

    const sig = hits.map((h) => `${h.id}:${h.errors}/${h.total}`).join('|');
    if (!existingHost) {
      const host = document.createElement('div');
      host.className = TRAP_RADAR_CLASS;
      host.setAttribute('data-qg-qid', qId);
      host.setAttribute('data-qg-trap-sig', sig);
      contentEl.insertAdjacentElement('beforebegin', host);
      renderTrapPill(host, qId, hits);
    } else if (existingHost.getAttribute('data-qg-trap-sig') !== sig) {
      existingHost.setAttribute('data-qg-trap-sig', sig);
      renderTrapPill(existingHost, qId, hits);
    }

    if (supportsCssHighlight) {
      for (const hit of hits) {
        for (const m of hit.matches || []) {
          const range = buildRangeForOffsets(segments, m.start, m.end);
          if (range) allRanges.push(range);
        }
      }
    }
  });

  if (supportsCssHighlight) {
    try {
      if (allRanges.length > 0) {
        CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...allRanges));
      } else {
        CSS.highlights.delete(HIGHLIGHT_NAME);
      }
    } catch (_) {}
  }
}

export function destroyTrapRadarOverlays() {
  try {
    document.querySelectorAll(`.${TRAP_RADAR_CLASS}`).forEach((el) => el.remove());
    if (typeof CSS !== 'undefined' && CSS.highlights) {
      CSS.highlights.delete(HIGHLIGHT_NAME);
    }
    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();
  } catch (_) {}
}
