import baseHudCss from '../../extensao PC/content.css';

const SHADOW_HOST_ID = 'qg-caveira-shadow-host';

const EXTRA_SHADOW_CSS = `
:host {
  all: initial;
  font-family: 'Saira', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
#qg-caveira-hud {
  pointer-events: auto;
}
.qg-offline-search-box {
  margin-top: 8px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.qg-offline-search-input {
  width: 100%;
  box-sizing: border-box;
  background: #09090b;
  color: #f4f4f5;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 7px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 600;
  outline: none;
}
.qg-offline-search-input:focus {
  border-color: #38bdf8;
}
.qg-offline-search-results {
  max-height: 170px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.qg-offline-search-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
  padding: 6px 8px;
  font-size: 10px;
  line-height: 1.35;
}
.qg-offline-search-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font-weight: 800;
}
`;

let activeShadowRoot = null;

export function destroyShadowHud() {
  try {
    document.getElementById(SHADOW_HOST_ID)?.remove();
    document.getElementById('qg-caveira-hud')?.remove();
  } catch (_) {}
  activeShadowRoot = null;
}

export function mountShadowHud(innerHtml) {
  const existing = document.getElementById(SHADOW_HOST_ID);
  if (existing && existing.shadowRoot) {
    const hudExisting = existing.shadowRoot.getElementById('qg-caveira-hud');
    if (hudExisting) {
      activeShadowRoot = existing.shadowRoot;
      return { host: existing, shadowRoot: existing.shadowRoot, hud: hudExisting, created: false };
    }
  }

  destroyShadowHud();

  const host = document.createElement('div');
  host.id = SHADOW_HOST_ID;
  host.setAttribute(
    'style',
    'all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;'
  );

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = `${baseHudCss}\n${EXTRA_SHADOW_CSS}`;

  const hud = document.createElement('div');
  hud.id = 'qg-caveira-hud';
  hud.innerHTML = innerHtml;

  shadowRoot.appendChild(styleEl);
  shadowRoot.appendChild(hud);
  (document.body || document.documentElement).appendChild(host);

  activeShadowRoot = shadowRoot;
  return { host, shadowRoot, hud, created: true };
}

export function getHudEl(id) {
  if (activeShadowRoot) {
    const el = activeShadowRoot.getElementById(id);
    if (el) return el;
  }
  const host = document.getElementById(SHADOW_HOST_ID);
  if (host && host.shadowRoot) {
    activeShadowRoot = host.shadowRoot;
    const el = host.shadowRoot.getElementById(id);
    if (el) return el;
  }
  return document.getElementById(id);
}

export function isEventInsideHud(event) {
  if (!event) return false;
  if (typeof event.composedPath === 'function') {
    const path = event.composedPath();
    if (path.some((node) => node && (node.id === SHADOW_HOST_ID || node.id === 'qg-caveira-hud'))) {
      return true;
    }
  }
  return Boolean(event.target?.closest && event.target.closest(`#${SHADOW_HOST_ID}, #qg-caveira-hud`));
}

export function isMutationInsideHud(mutation) {
  if (!mutation || !mutation.target) return false;
  const target = mutation.target;
  if (target.id === SHADOW_HOST_ID || target.id === 'qg-caveira-hud') return true;
  if (activeShadowRoot && target.getRootNode && target.getRootNode() === activeShadowRoot) return true;
  return Boolean(target.closest && target.closest(`#${SHADOW_HOST_ID}, #qg-caveira-hud`));
}
