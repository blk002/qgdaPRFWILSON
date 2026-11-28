(() => {
  // extensao PC/content.css
  var content_default = `/* Estilos do HUD Tático — QG da PRF no Projeto Caveira */\r
@import url('https://fonts.googleapis.com/css2?family=Saira:wght@400;600;700;800;900&display=swap');\r
\r
#qg-caveira-hud {\r
  position: fixed;\r
  bottom: 24px;\r
  right: 24px;\r
  width: 320px;\r
  background: rgba(10, 10, 14, 0.96);\r
  backdrop-filter: blur(14px);\r
  border: 1px solid rgba(255, 255, 255, 0.12);\r
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.6);\r
  border-radius: 18px;\r
  z-index: 9999999;\r
  font-family: 'Saira', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\r
  color: #f4f4f5;\r
  font-size: 13px;\r
  overflow: hidden;\r
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);\r
  user-select: none;\r
}\r
\r
#qg-caveira-hud.minimized {\r
  width: auto;\r
  padding: 8px 14px;\r
  border-radius: 30px;\r
  cursor: pointer;\r
}\r
\r
#qg-caveira-hud.minimized .qg-hud-body,\r
#qg-caveira-hud.minimized .qg-hud-prompt {\r
  display: none !important;\r
}\r
\r
/* Header */\r
.qg-hud-header {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  padding: 10px 14px;\r
  background: #14151a;\r
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\r
}\r
\r
.qg-hud-title {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  font-weight: 800;\r
  font-size: 11px;\r
  letter-spacing: 0.8px;\r
  text-transform: uppercase;\r
  color: #f4f4f5;\r
}\r
\r
.qg-hud-pulse {\r
  width: 7px;\r
  height: 7px;\r
  border-radius: 50%;\r
  background: #10b981;\r
  box-shadow: 0 0 8px #10b981;\r
  animation: qgPulse 2s infinite;\r
}\r
\r
@keyframes qgPulse {\r
  0% { transform: scale(0.95); opacity: 0.8; }\r
  50% { transform: scale(1.3); opacity: 1; }\r
  100% { transform: scale(0.95); opacity: 0.8; }\r
}\r
\r
.qg-hud-controls {\r
  display: flex;\r
  gap: 6px;\r
}\r
\r
.qg-hud-btn-icon {\r
  background: transparent;\r
  border: none;\r
  color: #a1a1aa;\r
  cursor: pointer;\r
  padding: 2px 4px;\r
  border-radius: 6px;\r
  font-size: 12px;\r
  line-height: 1;\r
}\r
\r
.qg-hud-btn-icon:hover {\r
  color: #fff;\r
  background: rgba(255, 255, 255, 0.1);\r
}\r
\r
/* Body / Stats */\r
.qg-hud-body {\r
  padding: 12px 14px;\r
}\r
\r
.qg-hud-stats-grid {\r
  display: grid;\r
  grid-template-columns: repeat(4, 1fr);\r
  gap: 6px;\r
  text-align: center;\r
  margin-bottom: 10px;\r
}\r
\r
.qg-hud-stat-box {\r
  background: #16161c;\r
  border: 1px solid rgba(255, 255, 255, 0.06);\r
  border-radius: 10px;\r
  padding: 6px 4px;\r
}\r
\r
.qg-hud-stat-label {\r
  font-size: 9px;\r
  font-weight: 700;\r
  text-transform: uppercase;\r
  color: #a1a1aa;\r
  display: block;\r
}\r
\r
.qg-hud-stat-value {\r
  font-size: 15px;\r
  font-weight: 900;\r
  display: block;\r
  margin-top: 2px;\r
}\r
\r
.qg-hud-stat-value.green { color: #10b981; }\r
.qg-hud-stat-value.red { color: #ef4444; }\r
.qg-hud-stat-value.blue { color: #38bdf8; }\r
.qg-hud-stat-value.gold { color: #fbbf24; }\r
\r
/* Status da Questão Atual */\r
.qg-hud-current {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  padding: 6px 10px;\r
  background: #181920;\r
  border: 1px solid rgba(255, 255, 255, 0.08);\r
  border-radius: 10px;\r
  font-size: 11px;\r
}\r
\r
.qg-hud-timer {\r
  font-family: 'Saira', monospace;\r
  font-weight: 700;\r
  color: #fbbf24;\r
}\r
\r
/* Alerta de Questão Repetida / Memória Tática (Funcionalidade #9) */\r
.qg-hud-history {\r
  margin-top: 8px;\r
  padding: 8px 10px;\r
  border-radius: 8px;\r
  font-size: 10px;\r
  line-height: 1.4;\r
  border: 1px solid rgba(255, 255, 255, 0.1);\r
  animation: qgSlideUp 0.25s ease;\r
}\r
\r
.qg-hud-history.error-history {\r
  background: rgba(239, 68, 68, 0.12);\r
  border-color: rgba(239, 68, 68, 0.35);\r
  color: #fca5a5;\r
}\r
\r
.qg-hud-history.hit-history {\r
  background: rgba(16, 185, 129, 0.12);\r
  border-color: rgba(16, 185, 129, 0.35);\r
  color: #86efac;\r
}\r
\r
.qg-history-badge {\r
  font-weight: 900;\r
  text-transform: uppercase;\r
  font-size: 9px;\r
  padding: 1px 5px;\r
  border-radius: 4px;\r
  display: inline-block;\r
  margin-bottom: 3px;\r
}\r
\r
.error-history .qg-history-badge {\r
  background: rgba(239, 68, 68, 0.25);\r
  color: #ef4444;\r
}\r
\r
.hit-history .qg-history-badge {\r
  background: rgba(16, 185, 129, 0.25);\r
  color: #10b981;\r
}\r
\r
.qg-history-bizu {\r
  margin-top: 5px;\r
  padding: 5px 7px;\r
  background: rgba(0, 0, 0, 0.35);\r
  border-left: 2px solid #fbbf24;\r
  border-radius: 4px;\r
  color: #fef08a;\r
  font-weight: 600;\r
  font-size: 9.5px;\r
  word-break: break-word;\r
}\r
\r
/* Prompt Tático de Avaliação Rápida */\r
.qg-hud-prompt {\r
  background: #0f1014;\r
  border-top: 1px solid rgba(255, 255, 255, 0.1);\r
  padding: 12px 14px;\r
  animation: qgSlideUp 0.3s ease;\r
}\r
\r
@keyframes qgSlideUp {\r
  from { opacity: 0; transform: translateY(10px); }\r
  to { opacity: 1; transform: translateY(0); }\r
}\r
\r
.qg-prompt-title {\r
  font-size: 11px;\r
  font-weight: 800;\r
  text-transform: uppercase;\r
  color: #e2e8f0;\r
  margin-bottom: 8px;\r
  display: flex;\r
  align-items: center;\r
  gap: 6px;\r
}\r
\r
.qg-prompt-badge {\r
  padding: 2px 6px;\r
  border-radius: 4px;\r
  font-size: 9px;\r
  font-weight: 900;\r
}\r
\r
.qg-prompt-badge.hit { background: rgba(16, 185, 129, 0.2); color: #10b981; }\r
.qg-prompt-badge.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }\r
\r
.qg-prompt-buttons {\r
  display: flex;\r
  gap: 6px;\r
  margin-bottom: 8px;\r
}\r
\r
.qg-btn-tag {\r
  flex: 1;\r
  background: #181920;\r
  border: 1px solid rgba(255, 255, 255, 0.08);\r
  color: #d4d4d8;\r
  padding: 6px 4px;\r
  border-radius: 8px;\r
  font-size: 10px;\r
  font-weight: 700;\r
  cursor: pointer;\r
  transition: all 0.2s;\r
  text-align: center;\r
}\r
\r
.qg-btn-tag:hover {\r
  background: #2563eb;\r
  color: #fff;\r
  border-color: #3b82f6;\r
  transform: translateY(-1px);\r
}\r
\r
.qg-btn-tag.active {\r
  background: #2563eb;\r
  color: #fff;\r
  border-color: #60a5fa;\r
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);\r
}\r
\r
/* Footer / Ação QG */\r
.qg-hud-footer {\r
  padding: 8px 14px 12px;\r
  display: flex;\r
  gap: 6px;\r
}\r
\r
.qg-btn-qg-link {\r
  width: 100%;\r
  background: #2563eb;\r
  color: #fff;\r
  text-decoration: none;\r
  font-weight: 800;\r
  font-size: 11px;\r
  text-transform: uppercase;\r
  padding: 8px;\r
  border-radius: 10px;\r
  text-align: center;\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 6px;\r
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);\r
  transition: all 0.2s;\r
  cursor: pointer;\r
  border: none;\r
}\r
\r
.qg-btn-qg-link:hover {\r
  background: #1d4ed8;\r
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.5);\r
  transform: translateY(-1px);\r
}\r
`;

  // extensao-src/ui/shadowHudHost.js
  var SHADOW_HOST_ID = "qg-caveira-shadow-host";
  var EXTRA_SHADOW_CSS = `
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
  var activeShadowRoot = null;
  function destroyShadowHud() {
    try {
      document.getElementById(SHADOW_HOST_ID)?.remove();
      document.getElementById("qg-caveira-hud")?.remove();
    } catch (_) {
    }
    activeShadowRoot = null;
  }
  function mountShadowHud(innerHtml) {
    const existing = document.getElementById(SHADOW_HOST_ID);
    if (existing && existing.shadowRoot) {
      const hudExisting = existing.shadowRoot.getElementById("qg-caveira-hud");
      if (hudExisting) {
        activeShadowRoot = existing.shadowRoot;
        return { host: existing, shadowRoot: existing.shadowRoot, hud: hudExisting, created: false };
      }
    }
    destroyShadowHud();
    const host = document.createElement("div");
    host.id = SHADOW_HOST_ID;
    host.setAttribute(
      "style",
      "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;"
    );
    const shadowRoot = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = `${content_default}
${EXTRA_SHADOW_CSS}`;
    const hud = document.createElement("div");
    hud.id = "qg-caveira-hud";
    hud.innerHTML = innerHtml;
    shadowRoot.appendChild(styleEl);
    shadowRoot.appendChild(hud);
    (document.body || document.documentElement).appendChild(host);
    activeShadowRoot = shadowRoot;
    return { host, shadowRoot, hud, created: true };
  }
  function getHudEl(id) {
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
  function isEventInsideHud(event) {
    if (!event) return false;
    if (typeof event.composedPath === "function") {
      const path = event.composedPath();
      if (path.some((node) => node && (node.id === SHADOW_HOST_ID || node.id === "qg-caveira-hud" || node.classList?.contains("qg-inline-autopsy-host")))) {
        return true;
      }
    }
    return Boolean(event.target?.closest && event.target.closest(`#${SHADOW_HOST_ID}, #qg-caveira-hud, .qg-inline-autopsy-host`));
  }
  function isMutationInsideHud(mutation) {
    if (!mutation || !mutation.target) return false;
    const target = mutation.target;
    if (target.id === SHADOW_HOST_ID || target.id === "qg-caveira-hud" || target.classList?.contains("qg-inline-autopsy-host")) return true;
    if (activeShadowRoot && target.getRootNode && target.getRootNode() === activeShadowRoot) return true;
    return Boolean(target.closest && target.closest(`#${SHADOW_HOST_ID}, #qg-caveira-hud, .qg-inline-autopsy-host`));
  }

  // extensao-src/ui/inlineAutopsyCard.js
  var INLINE_AUTOPSY_CLASS = "qg-inline-autopsy-host";
  var SANS_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  var AUTOPSY_ERROR_CAUSES = [
    {
      id: "leitura",
      icon: "👀",
      accent: "#fbbf24",
      label: "Leitura / Desatenção",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
    },
    {
      id: "decoreba",
      icon: "🧠",
      accent: "#a78bfa",
      label: "Decoreba / Prazo / Pena",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>'
    },
    {
      id: "pegadinha",
      icon: "🪤",
      accent: "#38bdf8",
      label: "Pegadinha da banca",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
    },
    {
      id: "base",
      icon: "📚",
      accent: "#fb7185",
      label: "Falta de base",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>'
    },
    {
      id: "cansaco",
      icon: "😵",
      accent: "#94a3b8",
      label: "Cansaço / Chute",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
    }
  ];
  var CONFIDENCE_OPTIONS = [
    {
      id: "sabia",
      icon: "🎯",
      accent: "#34d399",
      label: "Sabia",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>'
    },
    {
      id: "duvida",
      icon: "🤔",
      accent: "#fbbf24",
      label: "Dúvida (+FSRS)",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>'
    },
    {
      id: "chute",
      icon: "🎲",
      accent: "#38bdf8",
      label: "Chute (+FSRS)",
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="3"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M9 15h.01"/><path d="M15 15h.01"/><path d="M12 12h.01"/></svg>'
    }
  ];
  var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var INLINE_CARD_CSS = `
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
.qg-extras-stack {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.qg-extra-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  font-size: 11.5px;
  line-height: 1.3;
}
.qg-extra-row.is-video {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #e0f2fe;
}
.qg-extra-row.is-mirror {
  background: rgba(34, 211, 238, 0.09);
  border: 1px solid rgba(34, 211, 238, 0.24);
  color: #cffafe;
}
.qg-extra-row.is-proven {
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #d1fae5;
}
.qg-extra-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.qg-extra-title {
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qg-extra-sub {
  font-size: 10.5px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qg-extra-btn {
  appearance: none;
  font-family: ${SANS_STACK};
  background: #0284c7;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 0.14s ease, transform 0.1s ease;
}
.qg-extra-btn:hover {
  background: #0ea5e9;
}
.qg-extra-btn.is-mirror-btn {
  background: #0891b2;
}
.qg-extra-btn.is-mirror-btn:hover {
  background: #06b6d4;
}
.qg-mirror-banner {
  font-family: ${SANS_STACK};
  background: #0f1c24;
  border: 1px solid rgba(34, 211, 238, 0.38);
  color: #cffafe;
  border-radius: 9px;
  padding: 8px 11px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.qg-mirror-banner.is-proven {
  background: #0f241c;
  border-color: rgba(16, 185, 129, 0.45);
  color: #d1fae5;
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
      while (node = walker.nextNode()) {
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
    return altsRect.right - maxLeftContentRight >= 445;
  }
  function getSelectedItem(state) {
    if (!state.hit) {
      return AUTOPSY_ERROR_CAUSES.find((c) => c.id === state.errorReason) || null;
    }
    return CONFIDENCE_OPTIONS.find((c) => c.id === state.confidence) || null;
  }
  function buildExtrasSection(state, callbacks) {
    if (state.hit) return null;
    const vm = state.videoMatch;
    const ms = state.mirrorState;
    const hasMirror = ms && ms.status && ms.status !== "idle";
    if (!vm && !hasMirror) return null;
    const stack = document.createElement("div");
    stack.className = "qg-extras-stack";
    if (vm && vm.url) {
      const row = document.createElement("div");
      row.className = "qg-extra-row is-video";
      const txt = document.createElement("div");
      txt.className = "qg-extra-text";
      const title = document.createElement("span");
      title.className = "qg-extra-title";
      const shortLesson = String(vm.lessonTitle || "Aula do Caveira").slice(0, 34);
      title.textContent = vm.seconds > 0 ? `🎬 ${shortLesson} · aos ${vm.mmss}` : `🎬 ${shortLesson}`;
      txt.appendChild(title);
      if (vm.topicLabel && vm.topicLabel !== vm.lessonTitle) {
        const sub = document.createElement("span");
        sub.className = "qg-extra-sub";
        sub.textContent = vm.topicLabel;
        txt.appendChild(sub);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qg-extra-btn";
      btn.textContent = vm.seconds > 0 ? "Abrir no ponto ↗" : "Rever aula ↗";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks?.onOpenVideoTimestamp?.(vm);
      });
      row.appendChild(txt);
      row.appendChild(btn);
      stack.appendChild(row);
    }
    if (hasMirror) {
      const row = document.createElement("div");
      if (ms.status === "proven") {
        row.className = "qg-extra-row is-proven";
        const txt = document.createElement("div");
        txt.className = "qg-extra-text";
        const title = document.createElement("span");
        title.className = "qg-extra-title";
        title.textContent = `✅ Espelho ${ms.mirrorQId || ""} superado · FSRS rebaixado`;
        txt.appendChild(title);
        row.appendChild(txt);
        stack.appendChild(row);
      } else if (ms.status === "loading") {
        row.className = "qg-extra-row is-mirror";
        const txt = document.createElement("div");
        txt.className = "qg-extra-text";
        const title = document.createElement("span");
        title.className = "qg-extra-title";
        title.textContent = "🪞 Buscando questão-espelho...";
        txt.appendChild(title);
        row.appendChild(txt);
        stack.appendChild(row);
      } else if (ms.status === "ready" && ms.candidate) {
        row.className = "qg-extra-row is-mirror";
        const txt = document.createElement("div");
        txt.className = "qg-extra-text";
        const title = document.createElement("span");
        title.className = "qg-extra-title";
        const trapHint = Array.isArray(ms.sharedTraps) && ms.sharedTraps.length > 0 ? `mesma pegadinha "${ms.sharedTraps[0]}"` : ms.sameSubtopic ? "mesmo subtópico" : "mesma disciplina";
        title.textContent = `🪞 Espelho ${ms.candidate.id} · ${trapHint}`;
        txt.appendChild(title);
        if (ms.candidate.content) {
          const sub = document.createElement("span");
          sub.className = "qg-extra-sub";
          sub.textContent = ms.candidate.content.slice(0, 72);
          txt.appendChild(sub);
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "qg-extra-btn is-mirror-btn";
        btn.textContent = "Prove que entendeu →";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          callbacks?.onStartMirror?.(ms.candidate, state.qId);
        });
        row.appendChild(txt);
        row.appendChild(btn);
        stack.appendChild(row);
      }
    }
    return stack.childElementCount > 0 ? stack : null;
  }
  function renderShadowContent(shadowRoot, state, callbacks, host) {
    const isError = !state.hit;
    const variantClass = isError ? "is-error" : "is-hit";
    const selectedItem = getSelectedItem(state);
    const isCollapsed = Boolean(state.collapsed && selectedItem);
    shadowRoot.innerHTML = "";
    const styleEl = document.createElement("style");
    styleEl.textContent = INLINE_CARD_CSS;
    const cardEl = document.createElement("div");
    cardEl.className = `qg-inline-card ${variantClass}${isCollapsed ? " is-collapsed" : ""}`;
    if (isCollapsed) {
      const summaryEl = document.createElement("span");
      summaryEl.className = "qg-badge-summary";
      const checkEl = document.createElement("span");
      checkEl.className = "qg-badge-check";
      checkEl.innerHTML = CHECK_SVG;
      const icoEl = document.createElement("span");
      icoEl.className = "qg-pill-ico";
      icoEl.style.setProperty("--qg-accent", selectedItem.accent);
      icoEl.innerHTML = selectedItem.svg;
      const txtEl = document.createElement("span");
      txtEl.textContent = isError ? `Autópsia: ${selectedItem.label}` : selectedItem.label;
      summaryEl.appendChild(checkEl);
      summaryEl.appendChild(icoEl);
      summaryEl.appendChild(txtEl);
      const actionsEl = document.createElement("div");
      actionsEl.className = "qg-badge-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "qg-link-btn";
      editBtn.textContent = "Alterar";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.collapsed = false;
        renderShadowContent(shadowRoot, state, callbacks, host);
      });
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "qg-inline-close";
      closeBtn.innerHTML = CLOSE_SVG;
      closeBtn.title = "Fechar";
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        host.remove();
      });
      if (isError && state.videoMatch?.url) {
        const vidQuickBtn = document.createElement("button");
        vidQuickBtn.type = "button";
        vidQuickBtn.className = "qg-link-btn";
        vidQuickBtn.textContent = state.videoMatch.seconds > 0 ? `🎬 ${state.videoMatch.mmss}` : "🎬 Aula";
        vidQuickBtn.title = `Abrir ${state.videoMatch.lessonTitle || "aula"} no ponto`;
        vidQuickBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          callbacks?.onOpenVideoTimestamp?.(state.videoMatch);
        });
        actionsEl.appendChild(vidQuickBtn);
      }
      if (isError && state.mirrorState?.status === "ready" && state.mirrorState?.candidate) {
        const mirrorQuickBtn = document.createElement("button");
        mirrorQuickBtn.type = "button";
        mirrorQuickBtn.className = "qg-link-btn";
        mirrorQuickBtn.textContent = "🪞 Espelho →";
        mirrorQuickBtn.title = `Resolver questão-espelho ${state.mirrorState.candidate.id}`;
        mirrorQuickBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          callbacks?.onStartMirror?.(state.mirrorState.candidate, state.qId);
        });
        actionsEl.appendChild(mirrorQuickBtn);
      }
      actionsEl.appendChild(editBtn);
      actionsEl.appendChild(closeBtn);
      cardEl.appendChild(summaryEl);
      cardEl.appendChild(actionsEl);
    } else {
      const headEl = document.createElement("div");
      headEl.className = "qg-inline-head";
      const headLeft = document.createElement("div");
      headLeft.className = "qg-inline-head-left";
      const statusPill = document.createElement("span");
      statusPill.className = `qg-status-pill ${variantClass}`;
      statusPill.textContent = isError ? "ERROU" : "ACERTOU";
      const questionEl = document.createElement("span");
      questionEl.className = "qg-inline-question";
      questionEl.textContent = isError ? "Por que você errou?" : "Como você acertou?";
      headLeft.appendChild(statusPill);
      headLeft.appendChild(questionEl);
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "qg-inline-close";
      closeBtn.innerHTML = CLOSE_SVG;
      closeBtn.title = "Fechar";
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        host.remove();
      });
      headEl.appendChild(headLeft);
      headEl.appendChild(closeBtn);
      const pillsEl = document.createElement("div");
      pillsEl.className = "qg-inline-pills";
      const items = isError ? AUTOPSY_ERROR_CAUSES : CONFIDENCE_OPTIONS;
      const currentSelected = isError ? state.errorReason : state.confidence;
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `qg-pill-btn${currentSelected === item.id ? " active" : ""}`;
        btn.style.setProperty("--qg-accent", item.accent);
        const ico = document.createElement("span");
        ico.className = "qg-pill-ico";
        ico.innerHTML = item.svg;
        const labelSpan = document.createElement("span");
        labelSpan.textContent = item.label;
        btn.appendChild(ico);
        btn.appendChild(labelSpan);
        btn.addEventListener("click", (e) => {
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
      const extrasEl = buildExtrasSection(state, callbacks);
      if (extrasEl) {
        cardEl.appendChild(extrasEl);
      }
    }
    shadowRoot.appendChild(styleEl);
    shadowRoot.appendChild(cardEl);
  }
  function mountInlineAutopsyCard(card, questionData, callbacks = {}) {
    if (!card || !questionData?.id) return false;
    const altsEl = card.querySelector(".question-alternatives");
    if (!altsEl) return false;
    const qId = String(questionData.id);
    const existing = card.querySelector(`.${INLINE_AUTOPSY_CLASS}[data-qg-qid="${qId}"]`);
    if (existing) {
      existing.remove();
    }
    const placeRight = canPlaceCardOnRight(altsEl);
    const host = document.createElement("div");
    host.className = INLINE_AUTOPSY_CLASS;
    host.setAttribute("data-qg-qid", qId);
    if (placeRight) {
      try {
        if (getComputedStyle(altsEl).position === "static") {
          altsEl.style.position = "relative";
        }
      } catch (_) {
      }
      host.setAttribute(
        "style",
        "all: initial; position: absolute; top: 12px; right: 14px; width: min(430px, 46%); z-index: 25; pointer-events: auto;"
      );
      altsEl.appendChild(host);
    } else {
      host.setAttribute(
        "style",
        "all: initial; display: block; width: 100%; margin-top: 10px; pointer-events: auto;"
      );
      const btnRow = altsEl.nextElementSibling;
      if (btnRow && btnRow.parentElement) {
        btnRow.insertAdjacentElement("afterend", host);
      } else {
        altsEl.insertAdjacentElement("afterend", host);
      }
    }
    const shadowRoot = host.attachShadow({ mode: "open" });
    const state = {
      qId,
      hit: Boolean(questionData.hit),
      errorReason: questionData.errorReason || "",
      confidence: questionData.hit ? questionData.confidence || "" : "",
      videoMatch: questionData.videoMatch || null,
      mirrorState: questionData.mirrorState || null,
      collapsed: false
    };
    host.__qgState = state;
    host.__qgCallbacks = callbacks;
    host.addEventListener("click", (e) => e.stopPropagation());
    renderShadowContent(shadowRoot, state, callbacks, host);
    return true;
  }
  function updateInlineAutopsyBadge(qId, patch = {}) {
    if (!qId) return false;
    const host = document.querySelector(`.${INLINE_AUTOPSY_CLASS}[data-qg-qid="${String(qId)}"]`);
    if (!host || !host.shadowRoot || !host.__qgState) return false;
    const state = host.__qgState;
    if (typeof patch.hit === "boolean") state.hit = patch.hit;
    if (patch.errorReason !== void 0) state.errorReason = patch.errorReason;
    if (patch.confidence !== void 0) state.confidence = patch.confidence;
    state.collapsed = true;
    renderShadowContent(host.shadowRoot, state, host.__qgCallbacks || {}, host);
    return true;
  }
  function updateInlineAutopsyExtras(qId, extras = {}) {
    if (!qId) return false;
    const host = document.querySelector(`.${INLINE_AUTOPSY_CLASS}[data-qg-qid="${String(qId)}"]`);
    if (!host || !host.shadowRoot || !host.__qgState) return false;
    const state = host.__qgState;
    if (extras.videoMatch !== void 0) state.videoMatch = extras.videoMatch;
    if (extras.mirrorState !== void 0) state.mirrorState = extras.mirrorState;
    renderShadowContent(host.shadowRoot, state, host.__qgCallbacks || {}, host);
    return true;
  }
  function mountMirrorChallengeBanner(card, proofMeta) {
    if (!card || !proofMeta?.sourceQId) return false;
    const mirrorQId = String(proofMeta.mirrorQId || "");
    if (card.querySelector(`.qg-mirror-banner-host[data-qg-source="${proofMeta.sourceQId}"]`)) return true;
    const contentEl = card.querySelector(".content") || card.querySelector(".question-alternatives");
    if (!contentEl) return false;
    const host = document.createElement("div");
    host.className = "qg-mirror-banner-host";
    host.setAttribute("data-qg-source", proofMeta.sourceQId);
    host.setAttribute("data-qg-mirror", mirrorQId);
    host.setAttribute("style", "all: initial; display: block; margin-bottom: 10px;");
    const shadow = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = INLINE_CARD_CSS;
    const banner = document.createElement("div");
    banner.className = "qg-mirror-banner";
    banner.textContent = `🪞 Desafio Espelho da ${proofMeta.sourceQId}: acerte esta questão para rebaixar a revisão no FSRS`;
    shadow.appendChild(styleEl);
    shadow.appendChild(banner);
    contentEl.insertAdjacentElement("beforebegin", host);
    return true;
  }
  function showMirrorProvenToastOnCard(card, sourceQId) {
    if (!card) return false;
    const host = card.querySelector(`.qg-mirror-banner-host[data-qg-source="${sourceQId}"]`);
    if (!host || !host.shadowRoot) return false;
    const banner = host.shadowRoot.querySelector(".qg-mirror-banner");
    if (banner) {
      banner.className = "qg-mirror-banner is-proven";
      banner.textContent = `✅ Espelho superado! Erro da ${sourceQId} rebaixado no FSRS (+3 dias).`;
    }
    return true;
  }
  function destroyAllInlineAutopsyCards() {
    try {
      document.querySelectorAll(`.${INLINE_AUTOPSY_CLASS}`).forEach((el) => el.remove());
      document.querySelectorAll(".qg-mirror-banner-host").forEach((el) => el.remove());
    } catch (_) {
    }
  }

  // extensao-src/content/cebraspeTraps.js
  var CEBRASPE_TRAP_PATTERNS = [
    { id: "exclusivamente", label: "exclusivamente", category: "Restrição", regex: /\bexclusivamente\b/gi },
    { id: "somente", label: "somente", category: "Restrição", regex: /\bsomente\b/gi },
    { id: "apenas", label: "apenas", category: "Restrição", regex: /\bapenas\b/gi },
    { id: "unicamente", label: "unicamente", category: "Restrição", regex: /\bunicamente\b/gi },
    { id: "isoladamente", label: "isoladamente", category: "Restrição", regex: /\bisoladamente\b/gi },
    { id: "salvo", label: "salvo", category: "Exceção", regex: /\bsalvo\b/gi },
    { id: "exceto", label: "exceto", category: "Exceção", regex: /\bexceto\b/gi },
    { id: "ressalvado", label: "ressalvado(a)", category: "Exceção", regex: /\bressalvad[oa]s?\b/gi },
    { id: "em_regra", label: "em regra", category: "Exceção", regex: /\bem\s+regra\b/gi },
    { id: "ainda_que", label: "ainda que", category: "Exceção", regex: /\bainda\s+que\b/gi },
    { id: "mesmo_que", label: "mesmo que", category: "Exceção", regex: /\bmesmo\s+que\b/gi },
    { id: "vedado", label: "vedado(a)", category: "Vedação / Dever", regex: /\bvedad[oa]s?\b/gi },
    { id: "proibido", label: "proibido(a)", category: "Vedação / Dever", regex: /\bproibid[oa]s?\b/gi },
    { id: "obrigatorio", label: "obrigatório(a)", category: "Vedação / Dever", regex: /\bobrigat[óo]ri[oa]s?\b/gi },
    { id: "obrigatoriamente", label: "obrigatoriamente", category: "Vedação / Dever", regex: /\bobrigatoriamente\b/gi },
    { id: "facultativo", label: "facultativo(a)", category: "Vedação / Dever", regex: /\bfacultativ[oa]s?\b/gi },
    { id: "nao_admite", label: "não admite/cabe", category: "Vedação / Dever", regex: /\bn[ãa]o\s+(?:admite|comporta|permite|cabe)\b/gi },
    { id: "sob_pena_de", label: "sob pena de", category: "Vedação / Dever", regex: /\bsob\s+pena\s+de\b/gi },
    { id: "prescindivel", label: "prescindível", category: "Dispensa / Condição", regex: /\bprescind[íi]ve(?:l|is)\b/gi },
    { id: "imprescindivel", label: "imprescindível", category: "Dispensa / Condição", regex: /\bimprescind[íi]ve(?:l|is)\b/gi },
    { id: "independe", label: "independe", category: "Dispensa / Condição", regex: /\bindepende(?:m|r|ndo)?\b/gi },
    { id: "independentemente", label: "independentemente", category: "Dispensa / Condição", regex: /\bindependentemente\b/gi },
    { id: "dispensa", label: "dispensa", category: "Dispensa / Condição", regex: /\bdispensa(?:m|da|do|ndo|r)?\b/gi },
    { id: "suficiente", label: "suficiente / bastando", category: "Dispensa / Condição", regex: /\b(?:suficiente|bastando)\b/gi },
    { id: "automaticamente", label: "automaticamente", category: "Dispensa / Condição", regex: /\bautomaticamente\b/gi },
    { id: "sempre", label: "sempre", category: "Universalidade / Rol", regex: /\bsempre\b/gi },
    { id: "nunca", label: "nunca", category: "Universalidade / Rol", regex: /\bnunca\b/gi },
    { id: "jamais", label: "jamais", category: "Universalidade / Rol", regex: /\bjamais\b/gi },
    { id: "qualquer_hipotese", label: "em qualquer hipótese", category: "Universalidade / Rol", regex: /\bem\s+qualquer\s+hip[óo]tese\b/gi },
    { id: "nenhuma_hipotese", label: "em nenhuma hipótese", category: "Universalidade / Rol", regex: /\bem\s+nenhuma\s+hip[óo]tese\b/gi },
    { id: "todos_os_casos", label: "em todos os casos", category: "Universalidade / Rol", regex: /\bem\s+todos\s+os\s+casos\b/gi },
    { id: "taxativo", label: "taxativo(a)", category: "Universalidade / Rol", regex: /\btaxativ[oa]s?\b/gi },
    { id: "exemplificativo", label: "exemplificativo(a)", category: "Universalidade / Rol", regex: /\bexemplificativ[oa]s?\b/gi }
  ];
  function detectTrapTermsInText(rawText) {
    const text = typeof rawText === "string" ? rawText : String(rawText || "");
    if (!text) return [];
    const found = [];
    for (const pat of CEBRASPE_TRAP_PATTERNS) {
      const rx = new RegExp(pat.regex.source, pat.regex.flags);
      const matches = [];
      let m;
      while ((m = rx.exec(text)) !== null) {
        if (!m[0]) break;
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          text: m[0]
        });
        if (matches.length >= 12) break;
      }
      if (matches.length > 0) {
        found.push({
          id: pat.id,
          label: pat.label,
          category: pat.category,
          matches
        });
      }
    }
    return found;
  }
  function classifyRiskLevel(errors, total, errorRate) {
    if (errors === 0) return "dominado";
    if (errors >= 2 && errorRate >= 65) return "critico";
    if (errorRate >= 50) return "alerta";
    return "monitorando";
  }
  function buildTrapFingerprint(questions = []) {
    const list = Array.isArray(questions) ? questions : [];
    const termMap = /* @__PURE__ */ new Map();
    let totalQuestionsAnalyzed = 0;
    let totalTrapQuestions = 0;
    let trapErrors = 0;
    let nonTrapQuestions = 0;
    let nonTrapErrors = 0;
    for (const q of list) {
      if (!q || !q.content) continue;
      totalQuestionsAnalyzed += 1;
      const isError = !q.hit;
      const detected = detectTrapTermsInText(q.content);
      if (detected.length > 0) {
        totalTrapQuestions += 1;
        if (isError) trapErrors += 1;
      } else {
        nonTrapQuestions += 1;
        if (isError) nonTrapErrors += 1;
      }
      const subjName = q.canonicalSubject || q.subject || "Geral";
      for (const term of detected) {
        let stat = termMap.get(term.id);
        if (!stat) {
          stat = {
            id: term.id,
            label: term.label,
            category: term.category,
            total: 0,
            errors: 0,
            hits: 0,
            subjectsSet: /* @__PURE__ */ new Set(),
            questionIds: [],
            errorQuestionIds: []
          };
          termMap.set(term.id, stat);
        }
        stat.total += 1;
        if (isError) {
          stat.errors += 1;
          if (q.id) stat.errorQuestionIds.push(q.id);
        } else {
          stat.hits += 1;
        }
        stat.subjectsSet.add(subjName);
        if (q.id) stat.questionIds.push(q.id);
      }
    }
    const terms = Array.from(termMap.values()).map((stat) => {
      const errorRate = stat.total > 0 ? Math.round(stat.errors / stat.total * 100) : 0;
      return {
        id: stat.id,
        label: stat.label,
        category: stat.category,
        total: stat.total,
        errors: stat.errors,
        hits: stat.hits,
        errorRate,
        riskLevel: classifyRiskLevel(stat.errors, stat.total, errorRate),
        subjects: Array.from(stat.subjectsSet),
        questionIds: stat.questionIds,
        errorQuestionIds: stat.errorQuestionIds
      };
    }).sort((a, b) => {
      const aHasErr = a.errors > 0 ? 0 : 1;
      const bHasErr = b.errors > 0 ? 0 : 1;
      if (aHasErr !== bHasErr) return aHasErr - bHasErr;
      if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate;
      if (b.errors !== a.errors) return b.errors - a.errors;
      return b.total - a.total;
    });
    const overallTrapErrorRate = totalTrapQuestions > 0 ? Math.round(trapErrors / totalTrapQuestions * 100) : 0;
    const overallNonTrapErrorRate = nonTrapQuestions > 0 ? Math.round(nonTrapErrors / nonTrapQuestions * 100) : 0;
    const trapPenaltyDelta = totalTrapQuestions > 0 && nonTrapQuestions > 0 ? overallTrapErrorRate - overallNonTrapErrorRate : 0;
    return {
      terms,
      totalQuestionsAnalyzed,
      totalTrapQuestions,
      overallTrapErrorRate,
      overallNonTrapErrorRate,
      trapPenaltyDelta
    };
  }
  function matchTextTrapsAgainstFingerprint(rawText, fingerprint) {
    const terms = Array.isArray(fingerprint?.terms) ? fingerprint.terms : [];
    if (!rawText || terms.length === 0) return [];
    const statById = new Map(terms.map((t) => [t.id, t]));
    const detected = detectTrapTermsInText(rawText);
    const dangerHits = [];
    for (const d of detected) {
      const stat = statById.get(d.id);
      if (!stat || stat.errors < 1 || stat.errorRate < 50) continue;
      dangerHits.push({
        id: stat.id,
        label: stat.label,
        category: stat.category,
        total: stat.total,
        errors: stat.errors,
        errorRate: stat.errorRate,
        riskLevel: stat.riskLevel,
        matches: d.matches
      });
    }
    return dangerHits.sort((a, b) => b.errorRate - a.errorRate || b.errors - a.errors);
  }

  // extensao-src/ui/trapRadarOverlay.js
  var TRAP_RADAR_CLASS = "qg-trap-radar-host";
  var HIGHLIGHT_NAME = "qg-cebraspe-trap";
  var STYLE_ID = "qg-trap-highlight-style";
  var SANS_STACK2 = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  var cachedFpSig = "";
  var cachedFp = null;
  var dismissedTrapCards = /* @__PURE__ */ new Set();
  var TRAP_PILL_CSS = `
:host {
  all: initial;
  display: block;
  margin-bottom: 10px;
  font-family: ${SANS_STACK2};
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: border-box;
  font-family: ${SANS_STACK2};
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
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.textContent = `::highlight(${HIGHLIGHT_NAME}) { background-color: rgba(245, 158, 11, 0.24); color: inherit; text-decoration: underline wavy #f59e0b; text-underline-offset: 3px; }`;
    document.head.appendChild(styleEl);
  }
  function getFingerprintMemoized(questionsCache = []) {
    const arr = Array.isArray(questionsCache) ? questionsCache : [];
    const first = arr[0];
    const sig = `${arr.length}|${first?.id || ""}|${first?.updatedAt || first?.timestamp || ""}`;
    if (!cachedFp || sig !== cachedFpSig) {
      cachedFpSig = sig;
      cachedFp = buildTrapFingerprint(arr);
    }
    return cachedFp;
  }
  function collectTextNodes(rootEl) {
    const segments = [];
    let fullText = "";
    try {
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
      let node;
      while (node = walker.nextNode()) {
        const val = node.nodeValue || "";
        if (!val) continue;
        if (node.parentElement && node.parentElement.closest(`.${TRAP_RADAR_CLASS}`)) continue;
        const start = fullText.length;
        fullText += val;
        segments.push({ node, start, end: fullText.length });
      }
    } catch (_) {
      return { fullText: "", segments: [] };
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
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    shadow.innerHTML = "";
    const styleEl = document.createElement("style");
    styleEl.textContent = TRAP_PILL_CSS;
    const pill = document.createElement("div");
    pill.className = "qg-trap-pill";
    const left = document.createElement("div");
    left.className = "qg-trap-left";
    const badge = document.createElement("span");
    badge.className = "qg-trap-badge";
    badge.textContent = "⚠ Radar Cebraspe";
    const top = hits[0];
    const msg = document.createElement("span");
    msg.className = "qg-trap-msg";
    const strongTerm = document.createElement("strong");
    strongTerm.textContent = `"${top.label}"`;
    msg.appendChild(document.createTextNode("Atenção em "));
    msg.appendChild(strongTerm);
    msg.appendChild(
      document.createTextNode(` — você erra ${top.errorRate}% (${top.errors}/${top.total})`)
    );
    left.appendChild(badge);
    left.appendChild(msg);
    hits.slice(1, 3).forEach((extra) => {
      const chip = document.createElement("span");
      chip.className = "qg-trap-chip";
      chip.textContent = `${extra.label} · ${extra.errorRate}%`;
      left.appendChild(chip);
    });
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "qg-trap-close";
    closeBtn.textContent = "×";
    closeBtn.title = "Ocultar alerta nesta questão";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissedTrapCards.add(qId);
      host.remove();
    });
    pill.appendChild(left);
    pill.appendChild(closeBtn);
    shadow.appendChild(styleEl);
    shadow.appendChild(pill);
  }
  function applyTrapRadarToCards(cards = [], questionsCache = [], extractQuestionIdFn = null) {
    if (!Array.isArray(cards) || cards.length === 0) return;
    const fp = getFingerprintMemoized(questionsCache);
    const hasDangerTerms = Boolean(fp?.terms?.some((t) => t.errors >= 1 && t.errorRate >= 50));
    const supportsCssHighlight = typeof CSS !== "undefined" && Boolean(CSS.highlights) && typeof Highlight !== "undefined";
    if (!hasDangerTerms) {
      document.querySelectorAll(`.${TRAP_RADAR_CLASS}`).forEach((el) => el.remove());
      if (supportsCssHighlight) {
        try {
          CSS.highlights.delete(HIGHLIGHT_NAME);
        } catch (_) {
        }
      }
      return;
    }
    if (supportsCssHighlight) {
      ensureHighlightStyle();
    }
    const allRanges = [];
    cards.forEach((card) => {
      if (!card) return;
      const qId = typeof extractQuestionIdFn === "function" ? extractQuestionIdFn(card) : "";
      const contentEl = card.querySelector(".content");
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
      const sig = hits.map((h) => `${h.id}:${h.errors}/${h.total}`).join("|");
      if (!existingHost) {
        const host = document.createElement("div");
        host.className = TRAP_RADAR_CLASS;
        host.setAttribute("data-qg-qid", qId);
        host.setAttribute("data-qg-trap-sig", sig);
        contentEl.insertAdjacentElement("beforebegin", host);
        renderTrapPill(host, qId, hits);
      } else if (existingHost.getAttribute("data-qg-trap-sig") !== sig) {
        existingHost.setAttribute("data-qg-trap-sig", sig);
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
      } catch (_) {
      }
    }
  }
  function destroyTrapRadarOverlays() {
    try {
      document.querySelectorAll(`.${TRAP_RADAR_CLASS}`).forEach((el) => el.remove());
      if (typeof CSS !== "undefined" && CSS.highlights) {
        CSS.highlights.delete(HIGHLIGHT_NAME);
      }
      const styleEl = document.getElementById(STYLE_ID);
      if (styleEl) styleEl.remove();
    } catch (_) {
    }
  }

  // extensao-src/content/utils.js
  var QG_WEB_URL = "https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=caveira";
  var STORAGE_KEY = "qg_caveira_questions";
  var SESSION_KEY = "qg_caveira_session";
  var SCHEMA_KEY = "qg_caveira_schema_v3";
  var SCHEMA_VERSION = "3.1.0";
  var GOAL_KEY = "qg_caveira_daily_goal";
  var ACTIVE_USER_KEY = "qg_active_user_id";
  var ACTIVE_USER_LABEL_KEY = "qg_active_user_label";
  var PENDING_FILTER_KEY = "qg_pending_caveira_filter";
  var COURSE_INDEX_CACHE_KEY = "qg_caveira_course_index_cache";
  var FILTER_CORRECTION_MEMORY_KEY = "qg_caveira_filter_memory";
  var FILTER_ID_MEMORY_KEY = "qg_caveira_filter_id_memory_v1";
  var FILTER_MEMORY_CLOUD_KEY = "qg_filter_memory_cloud";
  var TODAY_MISSION_KEY = "qg_today_mission";
  var SUBJECT_SPEEDS_KEY = "qg_subject_speeds";
  var MODULE_SPEEDS_KEY = "qg_module_speeds";
  var PLAYER_SPEED_KEY = "qg_player_target_speed";
  var PLAYER_SEEK_KEY = "qg_player_pending_seek";
  var PENDING_CATALOG_KEY = "qg_pending_course_catalog";
  var PENDING_SIMULADOS_KEY = "qg_pending_simulados_import";
  var PENDING_SIMULADOS_QUEUE_KEY = "qg_pending_simulados_queue";
  var PENDING_PDF_KEY = "qg_pending_pdf_study";
  var LAST_FILTER_DIAG_KEY = "qg_caveira_last_filter_diag";
  var ACTIVE_MISSION_KEY = "qg_active_practice_mission";
  var DEFAULT_PREFS_KEY = "qg_caveira_default_prefs";
  var SUBJECT_TREE_CACHE_KEY = "qg_caveira_subject_tree_cache";
  var DIAGNOSTIC_MODE_KEY = "qg_diagnostic_mode";
  var DIAGNOSTIC_EVENTS_KEY = "qg_diagnostic_events";
  var SNIFFER_RECENT_EVENTS_KEY = "qg_sniffer_recent_events";
  var TREE_META_KEY = "qg_tree_meta";
  var PERFORMANCE_SNAPSHOT_KEY = "qg_caveira_performance_snapshot";
  var COURSE_VIDEO_INDEX_SYNC_KEY = "qg_course_video_index_sync";
  var PENDING_MIRROR_PROOF_KEY = "qg_pending_mirror_proof";
  var SIMULADO_QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
  var SIMULADO_QUEUE_MAX_ATTEMPTS = 10;
  function escapeHtml(text) {
    if (text === void 0 || text === null) return "";
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function normalizeFilterText(str) {
    return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }
  function normalizeCourseIndexKey(str) {
    return normalizeFilterText(str).replace(/[-–—:|/]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function classifySubjectBloco(subjectName = "") {
    const s = normalizeFilterText(subjectName);
    if (!s) return "Bloco I";
    if (/transito|ctb|contran|resoluc(?:ao|oes)|habilitacao|sinalizacao/.test(s)) return "Bloco II";
    if (/constitucional|administrativo|administracao publica|penal|processual|direitos humanos|legislacao especial|legislacao extravagante|legislacao institucional|leis especiais|extravagante/.test(s)) {
      return "Bloco III";
    }
    return "Bloco I";
  }
  function getTodaySessionDate() {
    const now = /* @__PURE__ */ new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function normalizeSession(rawSession) {
    const today = getTodaySessionDate();
    if (!rawSession || rawSession.date !== today) {
      return { date: today, total: 0, hits: 0, errors: 0 };
    }
    return {
      date: today,
      total: Number(rawSession.total) || 0,
      hits: Number(rawSession.hits) || 0,
      errors: Number(rawSession.errors) || 0,
      ...rawSession.wasExplicitlyReset ? { wasExplicitlyReset: true } : {}
    };
  }
  function sleepMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function generateChannelNonce() {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      }
    } catch (_) {
    }
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
  }
  var SENSITIVE_KEY_RX = /(?:token|auth|cookie|password|passwd|secret|jwt|bearer|authorization|refresh_token|access_token|apikey|api_key|video_url|embed_url|signed|signature)/i;
  var JWT_STRING_RX = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]+)?/g;
  function sanitizeDiagnosticData(input, depth = 0) {
    if (depth > 6) return "[depth-limit]";
    if (input === null || input === void 0) return input;
    if (typeof input === "string") {
      const cleaned = input.replace(JWT_STRING_RX, "[REDACTED_JWT]");
      return cleaned.length > 240 ? `${cleaned.slice(0, 240)}...` : cleaned;
    }
    if (typeof input === "number" || typeof input === "boolean") return input;
    if (Array.isArray(input)) {
      return input.slice(0, 15).map((item) => sanitizeDiagnosticData(item, depth + 1));
    }
    if (typeof input === "object") {
      const out = {};
      for (const [k, v] of Object.entries(input)) {
        if (SENSITIVE_KEY_RX.test(k)) {
          out[k] = "[REDACTED]";
        } else {
          out[k] = sanitizeDiagnosticData(v, depth + 1);
        }
      }
      return out;
    }
    return String(input).slice(0, 120);
  }

  // extensao-src/content/courseVideoMatcher.js
  var STOP_WORDS = /* @__PURE__ */ new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "para",
    "com",
    "sem",
    "sobre",
    "entre",
    "que",
    "uma",
    "umo",
    "uns",
    "umas",
    "nao",
    "por",
    "pela",
    "pelo",
    "pelas",
    "pelos",
    "nos",
    "nas",
    "aos",
    "como",
    "mais",
    "menos",
    "direito",
    "nocoes",
    "legislacao",
    "parte",
    "aula",
    "bloco",
    "questao",
    "geral",
    "codigo",
    "transito",
    "brasileiro",
    "ctb",
    "lei",
    "art",
    "artigo",
    "artigos",
    "capitulo",
    "secao",
    "titulo",
    "disposicoes",
    "conceito",
    "conceitos",
    "introducao",
    "saudacao",
    "saudacoes",
    "apresentacao",
    "boas",
    "vindas",
    "encerramento",
    "consideracoes",
    "finais",
    "conclusao",
    "inicio",
    "revisao",
    "resumo",
    "exercicios",
    "questoes",
    "modulo",
    "tema",
    "topico",
    "normas",
    "gerais",
    "regras"
  ]);
  var GENERIC_TIMESTAMP_LABEL_RX = /^(?:saudac(?:ao|oes)(?:\s+iniciais?)?|introducao(?:\s+(?:geral|inicial|(?:a|ao|da|do)\s+(?:aula|tema|modulo|disciplina|curso|ctb)))?|apresentacao(?:\s+(?:inicial|geral|da\s+aula|do\s+tema|do\s+curso))?|boas[\s-]+vindas|abertura|inicio(?:\s+da\s+aula)?|encerramento|consideracoes\s+finais|conclusao|finalizacao|despedida|avisos?(?:\s+gerais|\s+importantes)?)$/i;
  var INTRO_PREFIX_AT_START_RX = /^(?:introducao|apresentacao|saudac|boas[\s-]+vindas|abertura|encerramento|consideracoes\s+finais|conclusao|finalizacao|avisos?)\b/i;
  var DOMAIN_WEAK_TOKENS = /* @__PURE__ */ new Set([
    "publico",
    "publica",
    "federal",
    "nacional",
    "sistema",
    "texto",
    "frase",
    "palavra",
    "palavras",
    "oracao",
    "oracoes",
    "conceito",
    "conceitos",
    "geral",
    "basico",
    "basicos"
  ]);
  var tokenize = (str) => normalizeCourseIndexKey(str).replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  function cleanCourseEntryTitle(str = "") {
    return String(str || "").replace(/\b(?:play_circle(?:_outline|_filled)?|check_circle|ondemand_video|smart_display|lock|schedule)\b/gi, " ").replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/g, "").replace(/\s+/g, " ").trim();
  }
  function stripLessonPartSuffix(str = "") {
    return cleanCourseEntryTitle(str).replace(/\s*[-–—:|]?\s*(?:parte|pt\.?|aula|bloco)\s*(?:\d+|[ivxlcdm]+)\s*$/i, "").trim();
  }
  function extractPartNumber(str = "") {
    const m = String(str || "").match(/\b(?:parte|pt\.?|aula|bloco)\s*(\d+)\b/i);
    return m ? Number(m[1]) : 99;
  }
  function sanitizeCourseBaseUrl(rawUrl = "") {
    if (!rawUrl) return "";
    try {
      const u = new URL(String(rawUrl));
      u.hash = "";
      u.searchParams.delete("t");
      return u.toString();
    } catch (_) {
      return String(rawUrl).split("#")[0].replace(/([?&])t=\d+&?/g, "$1").replace(/[?&]$/, "");
    }
  }
  function extractLawOrResolutionNumbers(rawStr = "") {
    const norm = normalizeCourseIndexKey(rawStr);
    const contranNums = /* @__PURE__ */ new Set();
    const lawNums = /* @__PURE__ */ new Set();
    const contranRx = /\b(?:resoluc(?:ao|oes)?\s*(?:contran|do\s+contran)?|contran)\s*(?:n[°ºo.]*\s*)?(\d+(?:\.\d+)?)\b/gi;
    let m;
    while ((m = contranRx.exec(norm)) !== null) {
      const cleanNum = m[1].replace(/\./g, "");
      if (cleanNum) contranNums.add(cleanNum);
    }
    const leiRx = /\blei\s*(?:n[°ºo.]*\s*)?(\d+(?:\.\d+)?)\b/gi;
    while ((m = leiRx.exec(norm)) !== null) {
      const cleanNum = m[1].replace(/\./g, "");
      if (cleanNum && cleanNum.length >= 3) lawNums.add(cleanNum);
    }
    return { contranNums, lawNums };
  }
  function inferSubjectFamily(rawStr = "") {
    const s = normalizeCourseIndexKey(rawStr);
    if (!s) return "";
    if (/\b(?:transito|ctb|contran|9503)\b/.test(s)) return "transito";
    if (/\b(?:processo penal|processual penal|cpp|inquerito policial|prisao)\b/.test(s)) return "processual_penal";
    if (/\b(?:direito penal|codigo penal|teoria do crime|crimes contra)\b/.test(s)) return "penal";
    if (/\b(?:constitucional|constituicao federal)\b/.test(s)) return "constitucional";
    if (/\b(?:administrativo|administracao publica|improbidade|licitac|poderes administrativos|atos administrativos)\b/.test(s)) return "administrativo";
    if (/\b(?:direitos humanos|pacto de san jose|dudh)\b/.test(s)) return "direitos_humanos";
    if (/\b(?:legislacao especial|legislacao extravagante|leis especiais|eca|desarmamento|drogas|abuso de autoridade|maria da penha|tortura)\b/.test(s)) return "legislacao_especial";
    if (/\b(?:portugues|lingua portuguesa|gramatica|sintaxe|morfologia|interpretacao de texto|redacao oficial|crase|regencia|concordancia)\b/.test(s)) return "portugues";
    if (/\b(?:informatica|computador|redes|seguranca da informacao|linux|windows|malware|nuvem|internet)\b/.test(s)) return "informatica";
    if (/\b(?:raciocinio logico|rlm|matematica|logica|probabilidade|combinatoria)\b/.test(s)) return "rlm";
    if (/\b(?:fisica|cinematica|dinamica|energia mecanica|colisoes)\b/.test(s)) return "fisica";
    if (/\b(?:etica|1171|cidadania)\b/.test(s)) return "etica";
    if (/\b(?:geopolitica|geografia)\b/.test(s)) return "geopolitica";
    if (/\b(?:ingles|english)\b/.test(s)) return "ingles";
    if (/\b(?:espanhol|spanish)\b/.test(s)) return "espanhol";
    return "";
  }
  function tokenMatchesTarget(tok, targetSet) {
    if (!tok || !targetSet || targetSet.size === 0) return false;
    if (targetSet.has(tok)) return true;
    if (tok.length >= 6) {
      const stem = tok.slice(0, 6);
      for (const candidate of targetSet) {
        if (candidate.length >= 6 && candidate.startsWith(stem)) return true;
      }
    }
    return false;
  }
  function collectTokenMatches(tokens, targetSet) {
    let hits = 0;
    let maxLen = 0;
    for (const tok of tokens) {
      if (tokenMatchesTarget(tok, targetSet)) {
        hits += 1;
        if (tok.length > maxLen) maxLen = tok.length;
      }
    }
    return { hits, maxLen };
  }
  function formatSecondsAsClock(totalSec) {
    const safe = Math.max(0, Math.round(Number(totalSec) || 0));
    const h = Math.floor(safe / 3600);
    const m = Math.floor(safe % 3600 / 60);
    const s = safe % 60;
    return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  function appendTimestampToUrl(rawUrl, seconds) {
    if (!rawUrl) return "";
    const sec = Math.max(0, Math.round(Number(seconds) || 0));
    if (sec <= 0) return rawUrl;
    try {
      const u = new URL(rawUrl);
      u.searchParams.set("t", String(sec));
      return u.toString();
    } catch (_) {
      const sep = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${sep}t=${sec}`;
    }
  }
  function parseTimestampTopicsFromText(rawText = "") {
    const lines = String(rawText || "").split(/\r?\n/);
    const parsed = [];
    for (const raw of lines) {
      const m = raw.match(/[[( ]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s*[-–—:|]*\s*(.+)/);
      if (!m) continue;
      const hasHours = m[3] !== void 0;
      const h = hasHours ? Number(m[1]) : 0;
      const min = hasHours ? Number(m[2]) : Number(m[1]);
      const sec = hasHours ? Number(m[3]) : Number(m[2]);
      const seconds = h * 3600 + min * 60 + sec;
      const mmss = hasHours ? `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      const label = String(m[4] || "").trim();
      if (label && seconds >= 0) {
        parsed.push({ label, mmss, seconds });
      }
    }
    return parsed;
  }
  function findCourseVideoMatchForExtension(question, courseIndexMap = {}) {
    if (!question) return null;
    const entries = Object.values(courseIndexMap || {}).filter((e) => e && e.url);
    if (entries.length === 0) return null;
    const qSubjectRaw = `${question.canonicalSubject || ""} ${question.subject || ""}`;
    const qSubNorm = normalizeCourseIndexKey(qSubjectRaw);
    const qFamily = inferSubjectFamily(`${qSubjectRaw} ${question.topic || ""} ${question.subtopicPath || ""}`);
    const rawSegments = String(question.subtopicPath || question.topic || "").split(/->|➔|›|>/).map((s) => s.trim()).filter(Boolean);
    const specificSegments = rawSegments.filter((seg, idx) => {
      const segNorm = normalizeCourseIndexKey(seg);
      if (!segNorm) return false;
      if (idx === 0 && rawSegments.length > 1) {
        if (qSubNorm && (qSubNorm.includes(segNorm) || segNorm.includes(qSubNorm))) return false;
        if (/\b(?:codigo de transito|constituicao federal|codigo penal|codigo de processo)\b/.test(segNorm)) return false;
      }
      return true;
    });
    const leafRaw = specificSegments.length > 0 ? specificSegments[specificSegments.length - 1] : question.topic || "";
    const leafWithoutParens = leafRaw.replace(/\([^)]*(?:art|arts|lei|ctb|decreto|cf|resoluc)[^)]*\)/gi, "").trim();
    const specificRaw = specificSegments.length > 0 ? specificSegments.join(" ") : question.topic || "";
    const leafNorm = normalizeCourseIndexKey(leafWithoutParens || leafRaw).replace(/^(?:capitulo|secao|titulo|modulo)\s+[ivxlcdm\d]+\s*/i, "").trim();
    const specificPhrases = Array.from(new Set([
      normalizeCourseIndexKey(leafRaw),
      normalizeCourseIndexKey(leafWithoutParens),
      leafNorm
    ].filter((p) => p && p.length >= 6)));
    const qLawNums = extractLawOrResolutionNumbers(`${qSubjectRaw} ${specificRaw}`);
    const qAllowsIntroTimestamp = /\b(?:introduc|definic|conceitos?\s+basicos?|nocoes?\s+iniciais?)\b/i.test(leafNorm);
    const qSubTokens = new Set(tokenize(qSubjectRaw));
    const specificTopicTokens = Array.from(new Set(tokenize(specificRaw))).filter((tok) => !qSubTokens.has(tok) || tokenize(leafRaw).includes(tok));
    const specificTopicWordTokens = specificTopicTokens.filter((tok) => !/^\d+$/.test(tok));
    if (specificTopicWordTokens.length === 0 && qLawNums.contranNums.size === 0 && qLawNums.lawNums.size === 0) return null;
    const strongTopicTokens = specificTopicWordTokens.filter((tok) => !DOMAIN_WEAK_TOKENS.has(tok));
    const contentTokens = Array.from(new Set(tokenize(`${(question.content || "").slice(0, 320)} ${(question.teacherComment || "").slice(0, 220)}`))).filter((tok) => !specificTopicWordTokens.includes(tok));
    let bestEntry = null;
    let bestTopic = null;
    let bestScore = 0;
    entries.forEach((entry) => {
      const entryTitle = cleanCourseEntryTitle(entry.title || entry.lessonTitle || "");
      const eHeaderRaw = `${entry.subject || ""} ${entry.moduleName || ""} ${entryTitle}`;
      const eSubNorm = normalizeCourseIndexKey(eHeaderRaw);
      const entryFamily = inferSubjectFamily(eHeaderRaw);
      if (qFamily && entryFamily && qFamily !== entryFamily) return;
      const eLawNums = extractLawOrResolutionNumbers(`${entry.moduleName || ""} ${entryTitle}`);
      if (qLawNums.contranNums.size > 0 && eLawNums.contranNums.size > 0) {
        const hasSharedContran = Array.from(qLawNums.contranNums).some((n) => eLawNums.contranNums.has(n));
        if (!hasSharedContran) return;
      }
      const sharedContran = qLawNums.contranNums.size > 0 && Array.from(qLawNums.contranNums).some((n) => eLawNums.contranNums.has(n));
      const sharedLawNum = qLawNums.lawNums.size > 0 && Array.from(qLawNums.lawNums).some((n) => eLawNums.lawNums.has(n));
      const sameDiscipline = Boolean(
        qFamily && entryFamily && qFamily === entryFamily || qSubNorm && eSubNorm && (eSubNorm.includes(qSubNorm) || qSubNorm.includes(eSubNorm))
      );
      const entryTitleNorm = normalizeCourseIndexKey(entryTitle);
      const entryTitleBaseNorm = normalizeCourseIndexKey(stripLessonPartSuffix(entryTitle));
      const titlePhraseMatch = specificPhrases.some((p) => entryTitleNorm.includes(p) || entryTitleBaseNorm && (entryTitleBaseNorm.includes(p) || entryTitleBaseNorm.length >= 7 && p.includes(entryTitleBaseNorm)) || entryTitleNorm.length >= 8 && p.includes(entryTitleNorm));
      const entryTitleTokenSet = new Set(tokenize(`${entryTitle} ${entry.moduleName || ""}`));
      const entryTitleMatch = collectTokenMatches(specificTopicWordTokens, entryTitleTokenSet);
      const entryTitleStrongMatch = collectTokenMatches(strongTopicTokens, entryTitleTokenSet);
      const partNum = extractPartNumber(entryTitle);
      const partTieBias = partNum === 1 ? 0.45 : partNum < 99 ? Math.max(0, 0.35 - partNum * 0.05) : 0.15;
      const topicsList = Array.isArray(entry.topics) && entry.topics.length > 0 ? entry.topics : parseTimestampTopicsFromText(entry.indiceRawText || entry.rawIndexText || "");
      let matchedInsideTopics = false;
      if (topicsList.length > 0) {
        topicsList.forEach((tp) => {
          if (!tp || !tp.label) return;
          const tLabelNorm = normalizeCourseIndexKey(tp.label);
          if (!tLabelNorm || GENERIC_TIMESTAMP_LABEL_RX.test(tLabelNorm)) return;
          if (!qAllowsIntroTimestamp && Number(tp.seconds) <= 15 && INTRO_PREFIX_AT_START_RX.test(tLabelNorm)) return;
          const tLabelTokenSet = new Set(tokenize(tp.label));
          if (tLabelTokenSet.size === 0) return;
          const labelPhraseMatch = specificPhrases.some((p) => tLabelNorm.includes(p) || tLabelNorm.length >= 8 && p.includes(tLabelNorm));
          const labelMatch = collectTokenMatches(specificTopicWordTokens, tLabelTokenSet);
          const labelStrongMatch = collectTokenMatches(strongTopicTokens, tLabelTokenSet);
          const contentMatchOnLabel = collectTokenMatches(contentTokens, tLabelTokenSet);
          let qualified = false;
          if (strongTopicTokens.length > 0) {
            qualified = Boolean(
              labelPhraseMatch || titlePhraseMatch && (labelStrongMatch.hits >= 1 || contentMatchOnLabel.hits >= 2) || sameDiscipline && entryTitleStrongMatch.hits >= 1 && contentMatchOnLabel.hits >= 2 || labelStrongMatch.hits >= 2 || labelStrongMatch.hits === 1 && (labelMatch.hits >= 2 || entryTitleMatch.hits >= 1 || contentMatchOnLabel.hits >= 1)
            );
          } else {
            const weakCoverage = specificTopicWordTokens.length > 0 ? labelMatch.hits / specificTopicWordTokens.length : 0;
            qualified = Boolean(
              labelPhraseMatch || sharedContran || sharedLawNum || titlePhraseMatch && (labelMatch.hits >= 1 || contentMatchOnLabel.hits >= 2) || labelMatch.hits >= 2 && weakCoverage >= 0.6
            );
          }
          if (!qualified) return;
          matchedInsideTopics = true;
          const score = (sharedContran ? 18 : 0) + (sharedLawNum ? 10 : 0) + (labelPhraseMatch ? 14 : 0) + (titlePhraseMatch ? 6 : 0) + labelStrongMatch.hits * 6 + entryTitleStrongMatch.hits * 3 + labelMatch.hits * 2 + entryTitleMatch.hits * 1.5 + Math.min(contentMatchOnLabel.hits, 3) * 2.2 + (sameDiscipline ? 1.5 : 0) + (Number(tp.seconds) > 0 ? 0.5 : 0) + partTieBias;
          if (score > bestScore) {
            bestScore = score;
            bestEntry = entry;
            bestTopic = tp;
          }
        });
      }
      if (!matchedInsideTopics) {
        const contentMatchOnTitle = collectTokenMatches(contentTokens, entryTitleTokenSet);
        let qualifiedLessonOnly = false;
        if (sharedContran || sharedLawNum) {
          qualifiedLessonOnly = true;
        } else if (strongTopicTokens.length > 0) {
          qualifiedLessonOnly = Boolean(
            titlePhraseMatch || entryTitleStrongMatch.hits >= 1 && entryTitleMatch.hits >= 2 || entryTitleStrongMatch.hits >= 1 && entryTitleStrongMatch.maxLen >= 6 && sameDiscipline && (contentMatchOnTitle.hits >= 1 || entryTitleStrongMatch.maxLen >= 7)
          );
        } else {
          const weakTitleCoverage = specificTopicWordTokens.length > 0 ? entryTitleMatch.hits / specificTopicWordTokens.length : 0;
          qualifiedLessonOnly = Boolean(
            titlePhraseMatch || entryTitleMatch.hits >= 2 && weakTitleCoverage >= 0.6
          );
        }
        if (qualifiedLessonOnly) {
          const lessonScore = (sharedContran ? 18 : 0) + (sharedLawNum ? 10 : 0) + (titlePhraseMatch ? 12 : 0) + entryTitleStrongMatch.hits * 5 + entryTitleMatch.hits * 2 + Math.min(contentMatchOnTitle.hits, 2) * 1.5 + (sameDiscipline ? 1.5 : 0) - (entry.isFallbackSubjectLesson ? 0.5 : 0) + partTieBias;
          if (lessonScore > bestScore) {
            bestScore = lessonScore;
            bestEntry = entry;
            bestTopic = null;
          }
        }
      }
    });
    if (!bestEntry || !bestEntry.url) return null;
    const seconds = Math.max(0, Number(bestTopic?.seconds) || 0);
    const lessonTitle = cleanCourseEntryTitle(bestEntry.title || bestEntry.lessonTitle || "Aula do Caveira");
    const cleanBaseUrl = sanitizeCourseBaseUrl(bestEntry.url);
    let targetUrl = appendTimestampToUrl(cleanBaseUrl, seconds);
    if (lessonTitle) {
      const cleanUrl = String(targetUrl).split("#")[0];
      const subjectHint = question.canonicalSubject || question.subject || bestEntry.subject || "";
      targetUrl = `${cleanUrl}#qg_lesson=${encodeURIComponent(lessonTitle)}${subjectHint ? `&qg_subject=${encodeURIComponent(subjectHint)}` : ""}${seconds > 0 ? `&qg_t=${seconds}` : ""}`;
    }
    const courseIdMatch = String(bestEntry.url || "").match(/\/courses\/(\d+)/i);
    const courseId = String(bestEntry.courseId || courseIdMatch?.[1] || "");
    return {
      url: targetUrl,
      mmss: bestTopic?.mmss || formatSecondsAsClock(seconds),
      seconds,
      lessonTitle,
      topicLabel: bestTopic?.label || lessonTitle,
      courseId
    };
  }

  // extensao-src/content/mirrorHelper.js
  var MIRROR_STOP_WORDS = /* @__PURE__ */ new Set([
    "para",
    "como",
    "sobre",
    "entre",
    "apos",
    "antes",
    "contra",
    "desde",
    "durante",
    "mediante",
    "perante",
    "segundo",
    "conforme",
    "acerca",
    "quanto",
    "mesmo",
    "mesma",
    "ainda",
    "outro",
    "outra",
    "outros",
    "outras",
    "todos",
    "todas",
    "qualquer",
    "nenhum",
    "nenhuma",
    "julgue",
    "item",
    "proximo",
    "seguinte",
    "subsequente",
    "relativo",
    "respeito",
    "acordo",
    "termos",
    "situacao",
    "correto",
    "errado",
    "certo"
  ]);
  function extractLeafSubtopic(q) {
    const path = String(q?.subtopicPath || q?.topic || "");
    const parts = path.split(/->|➔|›|>/).map((s) => s.trim()).filter(Boolean);
    return normalizeFilterText(q?.subtopic || parts[parts.length - 1] || "");
  }
  function extractSigTokens(text) {
    return new Set(
      normalizeFilterText(text).split(/\s+/).filter((w) => w.length >= 5 && !MIRROR_STOP_WORDS.has(w))
    );
  }
  function pickBestMirrorCandidate(missedQuestion, candidates = [], answeredIdSet = /* @__PURE__ */ new Set()) {
    if (!missedQuestion || !Array.isArray(candidates) || candidates.length === 0) return null;
    const missedCode = String(missedQuestion.id || "").toUpperCase();
    const missedApiId = Number(missedQuestion.apiId || String(missedQuestion.id || "").replace(/^Q/i, "")) || 0;
    const missedLeaf = extractLeafSubtopic(missedQuestion);
    const missedBanca = normalizeFilterText(missedQuestion.banca || "");
    const missedTraps = new Set(detectTrapTermsInText(missedQuestion.content || "").map((t) => t.id));
    const missedTokens = extractSigTokens(missedQuestion.content || "");
    let best = null;
    for (const cand of candidates) {
      if (!cand) continue;
      const candApiId = Number(cand.apiId || cand.id) || 0;
      const candCode = String(cand.code || (candApiId ? `Q${candApiId}` : "")).toUpperCase();
      if (!candCode && !candApiId) continue;
      if (missedCode && candCode === missedCode) continue;
      if (missedApiId && candApiId === missedApiId) continue;
      if (answeredIdSet && (answeredIdSet.has(candCode) || candApiId && answeredIdSet.has(`Q${candApiId}`))) continue;
      const candLeaf = extractLeafSubtopic(cand);
      const sameSubtopic = Boolean(missedLeaf && candLeaf && (candLeaf === missedLeaf || candLeaf.includes(missedLeaf) || missedLeaf.includes(candLeaf)));
      const candTrapList = detectTrapTermsInText(cand.content || "");
      const sharedTraps = candTrapList.filter((t) => missedTraps.has(t.id)).map((t) => t.label);
      const candTokens = extractSigTokens(cand.content || "");
      let sharedTokenCount = 0;
      for (const tok of missedTokens) {
        if (candTokens.has(tok)) sharedTokenCount += 1;
      }
      const candBanca = normalizeFilterText(cand.banca || "");
      const sameBanca = Boolean(missedBanca && candBanca && candBanca === missedBanca);
      const score = (sameSubtopic ? 14 : 0) + sharedTraps.length * 10 + Math.min(sharedTokenCount, 5) * 3 + (sameBanca ? 2 : 0) + (cand.content ? 1 : 0);
      if (!best || score > best.score) {
        best = {
          candidate: {
            ...cand,
            id: candCode || `Q${candApiId}`,
            apiId: candApiId || Number(String(candCode).replace(/^Q/i, "")) || null
          },
          sharedTraps,
          sameSubtopic,
          score
        };
      }
    }
    return best;
  }

  // extensao-src/tree/dynamicTreeManager.js
  function mergeBaselineAndDynamicTree(baselineJson, dynamicRows = []) {
    if (!baselineJson || !Array.isArray(baselineJson.subjects)) {
      return { mergedJson: baselineJson, dynamicAddedCount: 0 };
    }
    const subjectsCopy = baselineJson.subjects.map((s) => ({
      ...s,
      nodes: Array.isArray(s.nodes) ? s.nodes.map((n) => ({ ...n })) : []
    }));
    if (!Array.isArray(dynamicRows) || dynamicRows.length === 0) {
      return { mergedJson: { ...baselineJson, subjects: subjectsCopy }, dynamicAddedCount: 0 };
    }
    const bySubjectId = /* @__PURE__ */ new Map();
    subjectsCopy.forEach((s) => {
      const nodeMap = /* @__PURE__ */ new Map();
      s.nodes.forEach((n) => nodeMap.set(Number(n.id), n));
      bySubjectId.set(Number(s.id), { subj: s, nodeMap });
    });
    let dynamicAddedCount = 0;
    dynamicRows.forEach((row) => {
      if (!row || !row.subjectId || !row.nodeId || !row.name) return;
      const sId = Number(row.subjectId);
      const nId = Number(row.nodeId);
      let bucket = bySubjectId.get(sId);
      if (!bucket) {
        const newSubj = {
          id: sId,
          name: row.subjectName || `Disciplina ${sId}`,
          count: 0,
          nodes: []
        };
        subjectsCopy.push(newSubj);
        bucket = { subj: newSubj, nodeMap: /* @__PURE__ */ new Map() };
        bySubjectId.set(sId, bucket);
      } else if (row.subjectName && row.subjectName.length > 2 && !bucket.subj.name) {
        bucket.subj.name = row.subjectName;
      }
      const existing = bucket.nodeMap.get(nId);
      if (existing) {
        if (row.name && existing.name !== row.name) {
          existing.name = row.name;
        }
        return;
      }
      const parentId = Number(row.parentId || sId);
      const parentNode = bucket.nodeMap.get(parentId);
      const computedDepth = parentNode ? (Number(parentNode.depth) || 1) + 1 : Number(row.depth) || 1;
      const computedPath = Array.isArray(row.path) && row.path.length > 0 ? row.path.map(Number) : parentNode && Array.isArray(parentNode.path) ? [...parentNode.path, nId] : [sId, nId];
      const newNode = {
        id: nId,
        parentId,
        depth: computedDepth,
        name: String(row.name).trim(),
        path: computedPath
      };
      bucket.subj.nodes.push(newNode);
      bucket.subj.count = bucket.subj.nodes.length;
      bucket.nodeMap.set(nId, newNode);
      dynamicAddedCount += 1;
    });
    return {
      mergedJson: {
        ...baselineJson,
        subjects: subjectsCopy
      },
      dynamicAddedCount
    };
  }

  // extensao-src/content/simuladosHelper.js
  function isRankingTitleOrRow(rowText = "", titleText = "", allowLoose = false) {
    const tNorm = normalizeCourseIndexKey(titleText);
    if (!tNorm) return !allowLoose;
    if (/^#?\d{1,5}\s*[º°ªoa]?$/.test(tNorm) || /^caveira\s+\d{3,}$/.test(tNorm)) return true;
    if (/\b(?:classificacao|ranking|posicao|colocacao|podium)\b/.test(tNorm)) return true;
    const rNorm = normalizeCourseIndexKey(rowText);
    if (/\b(?:colocacao|classificacao geral)\b/.test(rNorm) && !/simulado/.test(tNorm)) return true;
    return false;
  }
  function buildSimuladoKey(sim) {
    if (!sim || typeof sim !== "object") return "";
    if (sim.caveiraId) return String(sim.caveiraId);
    const titlePart = normalizeCourseIndexKey(sim.title || "").slice(0, 48);
    return titlePart ? `sim_title_${titlePart}` : `sim_${sim.data || "sem_data"}`;
  }
  function pruneAndNormalizeQueue(rawQueue, now = Date.now()) {
    const rawItems = Array.isArray(rawQueue?.items) ? rawQueue.items : Array.isArray(rawQueue?.simulados) ? rawQueue.simulados.map((simulado) => ({
      caveiraId: buildSimuladoKey(simulado),
      simulado,
      savedAt: Number(rawQueue.savedAt) || now,
      attempts: 0,
      lastAttemptAt: 0,
      status: "saved"
    })) : [];
    const deduped = /* @__PURE__ */ new Map();
    for (const item of rawItems) {
      if (!item || !item.simulado) continue;
      const savedAt = Number(item.savedAt) || now;
      if (now - savedAt > SIMULADO_QUEUE_TTL_MS) continue;
      const key = String(item.caveiraId || buildSimuladoKey(item.simulado));
      if (!key) continue;
      const prev = deduped.get(key);
      if (!prev || savedAt >= prev.savedAt) {
        deduped.set(key, {
          caveiraId: key,
          simulado: { ...item.simulado, caveiraId: item.simulado.caveiraId || key },
          savedAt,
          attempts: Number(item.attempts) || 0,
          lastAttemptAt: Number(item.lastAttemptAt) || 0,
          status: item.status || "saved"
        });
      }
    }
    return {
      items: Array.from(deduped.values()),
      lastStatus: rawQueue?.lastStatus || (deduped.size > 0 ? "saved" : "idle"),
      lastDeliveryId: rawQueue?.lastDeliveryId || null,
      lastConfirmedAt: Number(rawQueue?.lastConfirmedAt) || 0,
      lastConfirmedCount: Number(rawQueue?.lastConfirmedCount) || 0,
      lastConfirmedIds: Array.isArray(rawQueue?.lastConfirmedIds) ? rawQueue.lastConfirmedIds : [],
      lastError: rawQueue?.lastError || null,
      updatedAt: Number(rawQueue?.updatedAt) || now
    };
  }
  function enqueueSimuladosIntoQueue(prevQueue, simulados = [], now = Date.now()) {
    const base = pruneAndNormalizeQueue(prevQueue, now);
    const byKey = new Map(base.items.map((it) => [it.caveiraId, it]));
    (Array.isArray(simulados) ? simulados : []).forEach((sim) => {
      if (!sim || typeof sim !== "object") return;
      const key = buildSimuladoKey(sim);
      if (!key) return;
      byKey.set(key, {
        caveiraId: key,
        simulado: { ...sim, caveiraId: sim.caveiraId || key },
        savedAt: now,
        attempts: 0,
        lastAttemptAt: 0,
        status: "saved"
      });
    });
    return {
      ...base,
      items: Array.from(byKey.values()),
      lastStatus: byKey.size > 0 ? "saved" : base.lastStatus,
      lastError: null,
      updatedAt: now
    };
  }
  function formatSimuladoDeliveryStatus(queue) {
    if (!queue || typeof queue !== "object") return { label: "", isDone: false };
    const items = Array.isArray(queue.items) ? queue.items : [];
    const pendingCount = items.filter((i) => Number(i.attempts || 0) < SIMULADO_QUEUE_MAX_ATTEMPTS).length;
    const exhaustedCount = items.length - pendingCount;
    if (queue.lastStatus === "confirmed" && items.length === 0) {
      const cnt = queue.lastConfirmedCount || (queue.lastConfirmedIds?.length || 0);
      return {
        label: cnt > 0 ? `✅ ${cnt} entregue(s) ao QG (confirmado)` : "✅ Entregue ao QG (confirmado)",
        isDone: true
      };
    }
    if (items.length === 0) return { label: "", isDone: false };
    if (queue.lastStatus === "waiting_qg") {
      return {
        label: `⏳ ${items.length} salvo(s) — aguardando o QG (abra o site e faça login)`,
        isDone: false
      };
    }
    if (queue.lastStatus === "sending") {
      return {
        label: `📤 ${items.length} salvo(s) — enviando ao QG...`,
        isDone: false
      };
    }
    if (exhaustedCount > 0 && pendingCount === 0) {
      return {
        label: `⚠️ ${exhaustedCount} pendente(s) após ${SIMULADO_QUEUE_MAX_ATTEMPTS} tentativas — clique "Reenviar" no popup`,
        isDone: false
      };
    }
    return {
      label: `💾 ${items.length} simulado(s) salvo(s) na extensão — enviando ao QG...`,
      isDone: false
    };
  }

  // extensao-src/content/questionMapper.js
  function cleanSegment(seg) {
    return String(seg || "").replace(/\s+/g, " ").trim();
  }
  function parseLastAnswerStatus(rawStatus) {
    if (rawStatus === null || rawStatus === void 0 || rawStatus === "") {
      return { hit: null, recognized: true, rawValue: null };
    }
    if (typeof rawStatus === "boolean") {
      return { hit: rawStatus, recognized: true, rawValue: rawStatus };
    }
    if (typeof rawStatus === "number") {
      if (rawStatus === 1) return { hit: true, recognized: true, rawValue: rawStatus };
      if (rawStatus === 0) return { hit: false, recognized: true, rawValue: rawStatus };
      return { hit: null, recognized: false, rawValue: rawStatus };
    }
    const s = normalizeFilterText(rawStatus);
    if (/^(?:correct|hit|acerto|acertou|right|true|yes|sim|win|1)$/.test(s)) {
      return { hit: true, recognized: true, rawValue: rawStatus };
    }
    if (/^(?:wrong|incorrect|error|erro|errou|miss|false|no|nao|0)$/.test(s)) {
      return { hit: false, recognized: true, rawValue: rawStatus };
    }
    return { hit: null, recognized: false, rawValue: String(rawStatus).slice(0, 80) };
  }
  function resolveTreeIdsForQuestion(tree, { subject = "", subtopic = "", subtopicPath = "" } = {}) {
    if (!tree || !tree.subjects) {
      return { subjectId: null, subtopicId: null, subjectName: subject || "", subtopicName: subtopic || "", matchMethod: "no_tree" };
    }
    const rawSegments = String(subtopicPath || "").split(/->|➔|›|>|\//).map(cleanSegment).filter(Boolean);
    const discCandidate = cleanSegment(subject) || rawSegments[0] || "";
    const resolver = typeof globalThis !== "undefined" ? globalThis.QGCaveiraResolver : null;
    let subjObj = null;
    if (resolver && typeof resolver.resolveSubject === "function") {
      subjObj = resolver.resolveSubject(tree, discCandidate, rawSegments);
    }
    if (!subjObj && discCandidate) {
      const discNorm = normalizeFilterText(discCandidate);
      for (const s of tree.subjects.values()) {
        const sNorm = normalizeFilterText(s.name);
        if (sNorm === discNorm || sNorm.includes(discNorm) || discNorm.includes(sNorm)) {
          subjObj = s;
          break;
        }
      }
    }
    if (!subjObj) {
      return { subjectId: null, subtopicId: null, subjectName: discCandidate, subtopicName: subtopic || "", matchMethod: "subject_unmatched" };
    }
    const candidateNames = [];
    if (subtopic) candidateNames.push(cleanSegment(subtopic));
    for (let i = rawSegments.length - 1; i >= 0; i -= 1) {
      const seg = rawSegments[i];
      if (i === 0 && normalizeFilterText(seg) === normalizeFilterText(subjObj.name)) continue;
      if (seg && !candidateNames.includes(seg)) candidateNames.push(seg);
    }
    let matchedNode = null;
    let matchMethod = "subject_only";
    for (const cand of candidateNames) {
      const candNorm = normalizeFilterText(cand);
      if (!candNorm) continue;
      const exact = subjObj.nodes.find((n) => normalizeFilterText(n.name) === candNorm);
      if (exact) {
        matchedNode = exact;
        matchMethod = cand === cleanSegment(subtopic) ? "exact_subtopic" : "exact_path_segment";
        break;
      }
    }
    if (!matchedNode) {
      const candNorms = candidateNames.map(normalizeFilterText).filter((c) => c.length >= 4);
      let bestScore = 0;
      for (const n of subjObj.nodes) {
        const nNorm = normalizeFilterText(n.name);
        if (!nNorm) continue;
        for (let i = 0; i < candNorms.length; i += 1) {
          const c = candNorms[i];
          let sc = 0;
          if (nNorm.includes(c) || c.includes(nNorm)) {
            sc = Math.min(c.length, nNorm.length) / Math.max(c.length, nNorm.length);
            if (i === 0) sc += 0.2;
          }
          if (sc > bestScore && sc >= 0.55) {
            bestScore = sc;
            matchedNode = n;
            matchMethod = "fuzzy_within_subject";
          }
        }
      }
    }
    if (!matchedNode && resolver && candidateNames.length > 0) {
      const res = resolver.resolveLesson(tree, {
        subjectName: subjObj.name,
        lessons: candidateNames.slice(0, 1),
        topic: rawSegments.slice(1).join(" "),
        subtopics: candidateNames
      });
      if (res && Array.isArray(res.ids) && res.ids.length > 0) {
        const n = subjObj.byId.get(res.ids[0]);
        if (n) {
          matchedNode = n;
          matchMethod = `resolver_${res.confidence || "fallback"}`;
        }
      }
    }
    return {
      subjectId: subjObj.id,
      subtopicId: matchedNode ? matchedNode.id : null,
      subjectName: subjObj.name,
      subtopicName: matchedNode ? matchedNode.name : subtopic || "",
      matchMethod
    };
  }
  function buildStructuredTelemetryRecord({
    apiId = null,
    subjectId = null,
    subtopicId = null,
    banca = "",
    ano = "",
    acertou = null,
    data = ""
  } = {}) {
    return {
      apiId: Number.isFinite(Number(apiId)) && Number(apiId) > 0 ? Number(apiId) : null,
      subjectId: Number.isFinite(Number(subjectId)) && Number(subjectId) > 0 ? Number(subjectId) : null,
      subtopicId: Number.isFinite(Number(subtopicId)) && Number(subtopicId) > 0 ? Number(subtopicId) : null,
      banca: String(banca || "").trim(),
      ano: String(ano || "").trim(),
      acertou: acertou === null || acertou === void 0 ? null : Boolean(acertou),
      data: data || getTodaySessionDate()
    };
  }

  // extensao-src/content/filterGuard.js
  function hasSelectionChanged(proposed, applied) {
    if (!applied || !applied.subjectId || !Array.isArray(applied.ids) || applied.ids.length === 0) {
      return false;
    }
    if (!proposed || !proposed.subjectId || !Array.isArray(proposed.ids) || proposed.ids.length === 0) {
      return true;
    }
    if (Number(proposed.subjectId) !== Number(applied.subjectId)) {
      return true;
    }
    const sortUnique = (arr) => Array.from(new Set(arr.map(Number).filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);
    const pIds = sortUnique(proposed.ids);
    const aIds = sortUnique(applied.ids);
    if (pIds.length !== aIds.length) return true;
    for (let i = 0; i < pIds.length; i += 1) {
      if (pIds[i] !== aIds[i]) return true;
    }
    return false;
  }
  function verifyUrlFilterApplied({ expectedSubjectId, expectedIds, urlSearch = "", appliedDom = null } = {}) {
    if (!expectedSubjectId || !Array.isArray(expectedIds) || expectedIds.length === 0) {
      return { honored: true, reason: "none-expected" };
    }
    let urlSubj = 0;
    let urlIds = [];
    try {
      const params = new URLSearchParams(urlSearch || "");
      urlSubj = Number(String(params.get("subject_ids") || "").split(",")[0] || 0);
      urlIds = String(params.get("subtopic_ids") || "").split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    } catch (_) {
    }
    const urlHasSubject = urlSubj === Number(expectedSubjectId);
    const expectedSet = new Set(expectedIds.map(Number));
    const urlHasAnyTopic = urlIds.some((id) => expectedSet.has(id));
    if (!urlHasSubject || !urlHasAnyTopic) {
      return {
        honored: false,
        reason: "url-params-dropped",
        detail: "O site removeu os parâmetros subject_ids/subtopic_ids da URL ao carregar."
      };
    }
    if (appliedDom) {
      const hasDisciplinaDom = Boolean(appliedDom.disciplina && appliedDom.disciplina.trim());
      const hasAssuntoDom = Array.isArray(appliedDom.assuntos) && appliedDom.assuntos.length > 0;
      if (!hasDisciplinaDom && !hasAssuntoDom) {
        return {
          honored: false,
          reason: "dom-filters-empty",
          detail: "URL contém os IDs, mas os campos Disciplina/Assunto do Caveira parecem vazios."
        };
      }
    }
    return { honored: true, reason: "ok" };
  }

  // extensao-src/content/videoHelper.js
  var SUBJECT_ALIAS_FAMILIES = [
    ["lingua portuguesa", "portugues", "interpretacao de texto", "gramatica"],
    ["raciocinio logico", "matematica", "rlm", "estatistica"],
    ["informatica", "tecnologia da informacao", "ti"],
    ["fisica", "mecanica", "cinematica"],
    ["etica", "etica no servico publico", "cidadania"],
    ["geopolitica", "atualidades", "historia da prf"],
    ["legislacao de transito", "transito", "ctb", "codigo de transito brasileiro", "resolucoes contran", "contran"],
    ["direito administrativo", "administrativo", "ato administrativo", "licitacoes"],
    ["direito constitucional", "constitucional", "constituicao federal"],
    ["direito processual penal", "processual penal", "processo penal", "cpp"],
    ["direito penal", "penal", "codigo penal"],
    ["legislacao especial", "leis penais especiais", "legislacao extravagante"],
    ["direitos humanos", "direitos e garantias fundamentais"],
    ["redacao", "discursiva", "texto dissertativo"]
  ];
  function clampSpeed(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0.5 || num > 4) return null;
    return Math.round(num * 100) / 100;
  }
  function matchesAliasTerm(text, term, family) {
    if (!text || !term) return false;
    if (family.includes("codigo penal") && (text.includes("processual") || text.includes("processo penal"))) {
      return false;
    }
    if (term.length <= 4) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(text);
    }
    return text.includes(term) || text.length >= 5 && term.includes(text);
  }
  function matchAliasFamily(a, b) {
    if (!a || !b) return false;
    for (const family of SUBJECT_ALIAS_FAMILIES) {
      const aHit = family.some((term) => matchesAliasTerm(a, term, family));
      const bHit = family.some((term) => matchesAliasTerm(b, term, family));
      if (aHit && bHit) return true;
    }
    return false;
  }
  function resolveSubjectSpeedForContext(cachedSubjectSpeeds, contextTitleOrList = "", inferSubjectFn = null, options = {}) {
    const explicit = options && options.explicitSpeed !== void 0 && options.explicitSpeed !== null && options.explicitSpeed !== "" ? clampSpeed(options.explicitSpeed) : null;
    if (explicit !== null) return explicit;
    const moduleSpeeds = options?.moduleSpeeds;
    const courseId = String(options?.courseId || "").trim();
    const moduleId = String(options?.moduleId || "").trim();
    if (moduleSpeeds && typeof moduleSpeeds === "object" && courseId) {
      if (moduleId) {
        const byRoute = clampSpeed(moduleSpeeds[`${courseId}:${moduleId}`]);
        if (byRoute !== null) return byRoute;
      }
      const byCourse = clampSpeed(moduleSpeeds[`course:${courseId}`]);
      if (byCourse !== null) return byCourse;
    }
    if (!cachedSubjectSpeeds || typeof cachedSubjectSpeeds !== "object") return 1;
    const contexts = (Array.isArray(contextTitleOrList) ? contextTitleOrList : [contextTitleOrList]).map((item) => String(item || "").trim()).filter(Boolean);
    if (contexts.length === 0) return 1;
    const entries = Object.entries(cachedSubjectSpeeds).map(([subName, spd]) => ({
      norm: normalizeFilterText(subName),
      speed: clampSpeed(spd)
    })).filter((entry) => entry.norm && entry.speed !== null);
    if (entries.length === 0) return 1;
    for (const ctx of contexts) {
      const normCtx = normalizeFilterText(ctx);
      const inferred = typeof inferSubjectFn === "function" ? inferSubjectFn([ctx], ctx) || "" : "";
      const normInf = normalizeFilterText(inferred);
      for (const entry of entries) {
        if (normInf && (entry.norm === normInf || entry.norm.includes(normInf) || normInf.includes(entry.norm)) || normCtx && (entry.norm === normCtx || normCtx.includes(entry.norm) || entry.norm.includes(normCtx))) {
          return entry.speed;
        }
      }
      for (const entry of entries) {
        if (matchAliasFamily(entry.norm, normInf) || matchAliasFamily(entry.norm, normCtx)) {
          return entry.speed;
        }
      }
    }
    return 1;
  }

  // extensao-src/content/courseNavHelper.js
  var EXCLUDED_CAVEIRA_HOST_RX = /^(?:loja|checkout|blog|pay|pagamentos?|www)\./i;
  function isExcludedCaveiraHost(hostname = "") {
    return EXCLUDED_CAVEIRA_HOST_RX.test(String(hostname || "").trim());
  }
  function stripCaveiraLessonUiNoise(txt = "") {
    return String(txt || "").replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, " ").replace(
      /\b(?:assistir|conclu[íi]d[oa]s?|novo|novos\s+conte[úu]dos?|play_arrow|play_circle|ondemand_video|smart_display|check_circle|check_box|done|task_alt|colapso)\b/gi,
      " "
    ).replace(/[·•]/g, " ").replace(/\s+/g, " ").trim();
  }
  var ROMAN_PART_MAP = {
    i: "1",
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8"
  };
  function stripLeadingIndexPrefix(txt = "") {
    return String(txt || "").replace(/^\s*(?:aula|bloco|parte|m[oó]dulo)\s*\d+\s*[-–—:|.]*\s*/i, "").replace(/^\s*\d{1,3}\s*[-–—:|.]+\s*/, "").trim();
  }
  function stripLawYearSuffixes(txt = "") {
    return String(txt || "").replace(/\b(\d{1,5}(?:\.\d{3})*)\/\d{2,4}\b/g, "$1");
  }
  function extractLessonPartNum(txt = "") {
    const clean = normalizeCourseIndexKey(stripLawYearSuffixes(stripCaveiraLessonUiNoise(txt)));
    if (!clean) return "";
    const mNum = clean.match(/\b(?:parte|pt)\s*0*(\d{1,2})\b/);
    if (mNum) return String(Number(mNum[1]));
    const mRom = clean.match(/\b(?:parte|pt)\s*(viii|vii|vi|iv|v|iii|ii|i)\b/);
    if (mRom && ROMAN_PART_MAP[mRom[1]]) return ROMAN_PART_MAP[mRom[1]];
    const stripped = normalizeCourseIndexKey(
      stripLeadingIndexPrefix(stripLawYearSuffixes(stripCaveiraLessonUiNoise(txt)))
    );
    if (!stripped) return "";
    const protectedPrefixRx = /\b(?:art|artigo|lei|decreto|aula|bloco|modulo|anexo|capitulo|titulo)\s+(?:\d{1,2}|viii|vii|vi|iv|v|iii|ii|i)$/;
    if (!protectedPrefixRx.test(stripped)) {
      const mEnd = stripped.match(/\b0*(\d{1,2})$/);
      if (mEnd) return String(Number(mEnd[1]));
      const mEndRom = stripped.match(/\b(viii|vii|vi|iv|v|iii|ii|i)$/);
      if (mEndRom && ROMAN_PART_MAP[mEndRom[1]]) return ROMAN_PART_MAP[mEndRom[1]];
    }
    return "";
  }
  function stemPtToken(w = "") {
    if (!w || w.length < 5) return w;
    if (/(?:oes|aes|aos)$/.test(w)) return `${w.slice(0, -3)}ao`;
    if (w.endsWith("s") && !/(?:ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function canonicalizeLessonText(txt = "") {
    const norm = normalizeCourseIndexKey(stripLeadingIndexPrefix(stripCaveiraLessonUiNoise(txt))).replace(/\b0+(\d+)\b/g, "$1").trim();
    if (!norm) return "";
    return norm.split(" ").filter(Boolean).map(stemPtToken).join(" ");
  }
  function scoreCaveiraLessonCandidate(candidateText = "", targetLesson = "") {
    const cleanCand = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(candidateText));
    const cleanTarget = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetLesson));
    if (!cleanCand || !cleanTarget) return 0;
    const partCand = extractLessonPartNum(candidateText);
    const partTgt = extractLessonPartNum(targetLesson);
    if (partCand !== partTgt) return 0;
    if (cleanCand === cleanTarget) return 100;
    const canonCand = canonicalizeLessonText(candidateText);
    const canonTarget = canonicalizeLessonText(targetLesson);
    if (!canonCand || !canonTarget) return 0;
    if (canonCand === canonTarget) return 95;
    if (canonTarget.length >= 6 && canonCand.includes(canonTarget) || canonCand.length >= 6 && canonTarget.includes(canonCand)) {
      return 80;
    }
    const tok = (s) => s.split(" ").filter((w) => w.length >= 3 || /^\d+$/.test(w));
    const tTgt = tok(canonTarget);
    const tCand = new Set(tok(canonCand));
    if (tTgt.length === 0 || tCand.size === 0) return 0;
    const hits = tTgt.filter((w) => tCand.has(w)).length;
    const ratio = hits / Math.max(tTgt.length, tCand.size);
    return ratio >= 0.65 ? Math.round(ratio * 75) : 0;
  }
  var COURSE_TRACK_KEYWORDS = [
    "iniciante",
    "nivelamento",
    "isolad",
    "extensivo",
    "intensivo",
    "prf",
    "redacao"
  ];
  function scoreCaveiraCourseCandidate(courseTitle = "", { targetCourse = "", targetTopic = "", targetSubject = "" } = {}) {
    const candNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(courseTitle));
    if (!candNorm) return 0;
    const queryPrimary = String(targetCourse || targetTopic || "").trim();
    const queryPart = queryPrimary ? extractLessonPartNum(queryPrimary) : "";
    const candPart = extractLessonPartNum(courseTitle);
    if (queryPart && candPart && queryPart !== candPart) {
      return 0;
    }
    const candCanon = canonicalizeLessonText(courseTitle);
    const courseNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetCourse));
    const topicNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetTopic));
    const subNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetSubject));
    let score = 0;
    if (courseNorm) {
      const courseCanon = canonicalizeLessonText(targetCourse);
      if (candNorm.includes(courseNorm) || courseCanon && candCanon.includes(courseCanon)) {
        score += 100;
      }
    }
    if (topicNorm) {
      const topicCanon = canonicalizeLessonText(targetTopic);
      if (candNorm.includes(topicNorm) || topicCanon && candCanon.includes(topicCanon)) {
        score += 80;
      }
    }
    const combinedQuery = queryPrimary || targetSubject;
    if (combinedQuery) {
      const qCanon = canonicalizeLessonText(combinedQuery) || normalizeCourseIndexKey(combinedQuery);
      const qTokens = qCanon.split(" ").filter((w) => w.length >= 3 || /^\d+$/.test(w));
      const cTokens = new Set((candCanon || candNorm).split(" ").filter((w) => w.length >= 3 || /^\d+$/.test(w)));
      if (qTokens.length > 0 && cTokens.size > 0) {
        const hits = qTokens.filter((t) => cTokens.has(t)).length;
        score += Math.round(hits / qTokens.length * 70);
      }
    }
    const queryAllNorm = `${courseNorm} ${topicNorm} ${subNorm}`.trim();
    for (const kw of COURSE_TRACK_KEYWORDS) {
      if (queryAllNorm.includes(kw) && candNorm.includes(kw)) {
        score += 40;
      }
    }
    const queryIsStandalone = queryAllNorm.includes("iniciante") || queryAllNorm.includes("isolad") || queryAllNorm.includes("nivelamento");
    if (queryIsStandalone && candNorm.includes("prf") && !candNorm.includes("iniciante")) {
      score -= 40;
    }
    if (!queryIsStandalone && !courseNorm && /\bprf\b|policia\s+rodoviaria\s+federal/.test(candNorm)) {
      score += 65;
    }
    return Math.max(0, score);
  }
  function scoreCaveiraModuleCandidate(moduleText = "", { targetSubject = "", targetTopic = "", targetLesson = "" } = {}) {
    const cleanedModule = String(moduleText || "").replace(/\b\d+\s+aulas?\b/gi, " ").replace(/\b\d+\s+conclu[íi]d[oa]s?\b/gi, " ").replace(/\bem\s+grava[çc][ãa]o\b/gi, " ").replace(/\bnovo\b/gi, " ").replace(/[,·•()]+/g, " ").replace(/\s+/g, " ").trim();
    const modNorm = normalizeCourseIndexKey(cleanedModule);
    if (!modNorm) return 0;
    const modCanon = canonicalizeLessonText(cleanedModule);
    const subNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetSubject));
    const subCanon = canonicalizeLessonText(targetSubject);
    const topicNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetTopic));
    const topicCanon = canonicalizeLessonText(targetTopic);
    const lesNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetLesson));
    let score = 0;
    if (subNorm) {
      if (modNorm === subNorm || subCanon && modCanon === subCanon) {
        score += 100;
      } else if (modNorm.includes(subNorm) || subNorm.includes(modNorm) || subCanon && modCanon && (modCanon.includes(subCanon) || subCanon.includes(modCanon))) {
        score += 85;
      } else {
        const sTokens = (subCanon || subNorm).split(" ").filter((w) => w.length >= 3);
        const mTokens = new Set((modCanon || modNorm).split(" ").filter((w) => w.length >= 3));
        if (sTokens.length > 0 && mTokens.size > 0) {
          const hits = sTokens.filter((t) => mTokens.has(t)).length;
          score += Math.round(hits / sTokens.length * 75);
        }
      }
    }
    if (topicNorm) {
      if (modNorm.includes(topicNorm) || topicCanon && modCanon.includes(topicCanon)) {
        score += 70;
      } else {
        const tTokens = (topicCanon || topicNorm).split(" ").filter((w) => w.length >= 4);
        const mTokens = new Set((modCanon || modNorm).split(" ").filter((w) => w.length >= 4));
        if (tTokens.length > 0 && mTokens.size > 0) {
          const hits = tTokens.filter((t) => mTokens.has(t)).length;
          score += Math.round(hits / tTokens.length * 45);
        }
      }
    }
    if (lesNorm) {
      const lTokens = lesNorm.split(" ").filter((w) => w.length >= 4);
      const mTokens = new Set(modNorm.split(" ").filter((w) => w.length >= 4));
      if (lTokens.length > 0 && mTokens.size > 0) {
        const hits = lTokens.filter((t) => mTokens.has(t)).length;
        score += Math.round(hits / lTokens.length * 40);
      }
    }
    return score;
  }

  // extensao-src/entries/content.entry.js
  (function() {
    if (isExcludedCaveiraHost(window.location.hostname)) return;
    const runtimeExtVersion = typeof chrome !== "undefined" && chrome.runtime?.getManifest?.()?.version || "3.6.3";
    console.log(`💀 [QG da PRF] Rastreador Caveira v${runtimeExtVersion} ativo em:`, window.location.href);
    try {
      window.dispatchEvent(new CustomEvent("qg-caveira-teardown"));
      destroyShadowHud();
      destroyAllInlineAutopsyCards();
      destroyTrapRadarOverlays();
    } catch (_) {
    }
    const SCHEMA_VERSION_KEY = "qg_caveira_schema_version";
    const HUD_COURSE_DIFF_KEY = "qg_hud_course_difficulty_ids";
    const DISMISSED_MISSIONS_KEY = "qg_dismissed_mission_ids";
    const TAB_FILTER_DIAG_SESSION_KEY = "qg_tab_last_filter_diag";
    let handleStorageChangedRef = null;
    let hudCourseDifficultyIds = [];
    let renderHudCourseDiffBarRef = null;
    let activePracticeMission = null;
    const MAX_BUCKET_QUESTIONS = 1500;
    const CHANNEL_NONCE = generateChannelNonce();
    let diagnosticModeEnabled = false;
    let cachedDailyGoal = 50;
    let cachedActiveUserId = null;
    let cachedActiveUserLabel = "";
    let activePracticeFilter = null;
    let isApplyingFilter = false;
    let filterStatusMessage = "";
    let lastFilterDiagnosticLog = null;
    let lastResolverProposed = null;
    let cachedCaveiraTree = null;
    let cachedCaveiraTreeGeradoEm = "";
    let pendingResolverResult = null;
    let lastCapturedCourseSignature = "";
    let currentCourseIndexStatus = null;
    let cachedTodayMission = null;
    let todayMissionIdx = 0;
    let cachedSubjectSpeeds = {};
    let cachedModuleSpeeds = {};
    let lastExplicitLessonSpeed = null;
    let lastExplicitLessonUrlSig = "";
    let lastPlaygroundSpeedSig = "";
    let pdfReadingSeconds = 0;
    let pdfTimerInterval = null;
    let lastPlaygroundSpeedApplied = 0;
    let lastSeekUrlApplied = "";
    let apiCourseCatalogCache = null;
    let apiCoursesListCache = [];
    const apiQuestionCache = /* @__PURE__ */ new Map();
    const apiQuestionByApiId = /* @__PURE__ */ new Map();
    const apiQuestionByCode = /* @__PURE__ */ new Map();
    const apiAnswerCache = /* @__PURE__ */ new Map();
    const unansweredObservedQIds = /* @__PURE__ */ new Set();
    const preAnsweredIgnoredQIds = /* @__PURE__ */ new Set();
    let apiSimuladosCache = [];
    const apiSimuladoEnjoymentByExamId = /* @__PURE__ */ new Map();
    const apiSimuladoDatesByExamId = /* @__PURE__ */ new Map();
    const apiSimuladoDatesByTitle = /* @__PURE__ */ new Map();
    let cachedLocalCourseIndexByLesson = {};
    let cachedSyncedVideoIndexMap = {};
    let cachedPendingMirrorProof = null;
    const pendingMirrorRequests = /* @__PURE__ */ new Map();
    const requestedMirrorForQIds = /* @__PURE__ */ new Set();
    function getMergedCourseVideoIndex() {
      return {
        ...cachedSyncedVideoIndexMap || {},
        ...cachedLocalCourseIndexByLesson || {}
      };
    }
    function requestMirrorQuestionFromApi(missedQuestionData) {
      return new Promise((resolve) => {
        if (!missedQuestionData || !missedQuestionData.id) {
          resolve(null);
          return;
        }
        const answeredSet = new Set(
          (questionsCache || []).map((q) => String(q?.id || "").toUpperCase()).filter(Boolean)
        );
        answeredSet.add(String(missedQuestionData.id).toUpperCase());
        const localPool = Array.from(apiQuestionByApiId.values());
        const localPick = pickBestMirrorCandidate(missedQuestionData, localPool, answeredSet);
        if (localPick && localPick.score >= 16) {
          resolve(localPick);
          return;
        }
        const apiMeta = apiQuestionByCode.get(missedQuestionData.id) || apiQuestionCache.get(missedQuestionData.id) || null;
        const numericApiId = Number(apiMeta?.apiId) || Number(String(missedQuestionData.id || "").replace(/^Q/i, "").replace(/\D+/g, "")) || null;
        const resolvedIds = cachedCaveiraTree ? resolveTreeIdsForQuestion(cachedCaveiraTree, {
          subject: missedQuestionData.subject || "",
          subtopic: missedQuestionData.topic || "",
          subtopicPath: apiMeta?.subtopicPath || missedQuestionData.topic || ""
        }) : { subjectId: null, subtopicId: null };
        const subjectId = apiMeta?.subjectId || resolvedIds?.subjectId || null;
        const subtopicId = apiMeta?.subtopicId || resolvedIds?.subtopicId || null;
        if (!subjectId && !subtopicId) {
          resolve(localPick || null);
          return;
        }
        const urlParams = new URLSearchParams(window.location.search || "");
        const urlBoards = (urlParams.get("examining_board_ids") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
        const urlAlts = (urlParams.get("number_alternatives") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
        const reqId = `mir_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const timer = setTimeout(() => {
          pendingMirrorRequests.delete(reqId);
          resolve(localPick || null);
        }, 4500);
        pendingMirrorRequests.set(reqId, (candidates) => {
          clearTimeout(timer);
          const combinedPool = [...Array.isArray(candidates) ? candidates : [], ...localPool];
          const picked = pickBestMirrorCandidate(missedQuestionData, combinedPool, answeredSet);
          resolve(picked || localPick || null);
        });
        postToSniffer("FETCH_MIRROR_QUESTION", {
          requestId: reqId,
          excludeApiId: numericApiId,
          subjectIds: subjectId ? [Number(subjectId)] : [],
          subtopicIds: subtopicId ? [Number(subtopicId)] : [],
          numberAlternatives: urlAlts.length > 0 ? urlAlts : [2],
          examBoardIds: urlBoards.length > 0 ? urlBoards : [2, 5, 12]
        });
      });
    }
    function postToSniffer(type, payload) {
      try {
        window.postMessage(
          { source: "QG_CAVEIRA_CONTENT", nonce: CHANNEL_NONCE, type, payload },
          window.location.origin
        );
      } catch (_) {
      }
    }
    function appendSnifferTelemetryEvent(type, summaryObj = {}) {
      if (!isExtensionContextValid() || !chrome?.storage?.local) return;
      try {
        chrome.storage.local.get([SNIFFER_RECENT_EVENTS_KEY], (res) => {
          if (chrome.runtime?.lastError || isDestroyed) return;
          const prev = Array.isArray(res?.[SNIFFER_RECENT_EVENTS_KEY]) ? res[SNIFFER_RECENT_EVENTS_KEY] : [];
          const next = [
            { at: (/* @__PURE__ */ new Date()).toISOString(), type, ...sanitizeDiagnosticData(summaryObj) },
            ...prev
          ].slice(0, 20);
          chrome.storage.local.set({ [SNIFFER_RECENT_EVENTS_KEY]: next });
        });
      } catch (_) {
      }
    }
    function appendDiagnosticShape(entry) {
      if (!diagnosticModeEnabled || !isExtensionContextValid() || !chrome?.storage?.local) return;
      try {
        chrome.storage.local.get([DIAGNOSTIC_EVENTS_KEY], (res) => {
          if (chrome.runtime?.lastError || isDestroyed) return;
          const prev = Array.isArray(res?.[DIAGNOSTIC_EVENTS_KEY]) ? res[DIAGNOSTIC_EVENTS_KEY] : [];
          const next = [sanitizeDiagnosticData(entry), ...prev].slice(0, 30);
          chrome.storage.local.set({ [DIAGNOSTIC_EVENTS_KEY]: next });
        });
      } catch (_) {
      }
    }
    function mergeSimuladoDateEntry(examId, title, entry = {}) {
      if (!entry || typeof entry !== "object") return;
      const prevById = examId ? apiSimuladoDatesByExamId.get(String(examId)) || {} : {};
      const titleNorm = title ? normalizeCourseIndexKey(title) : "";
      const prevByTitle = titleNorm ? apiSimuladoDatesByTitle.get(titleNorm) || {} : {};
      const merged = {
        title: String(title || prevById.title || prevByTitle.title || "").trim(),
        numberQuestions: Number(entry.numberQuestions || prevById.numberQuestions || prevByTitle.numberQuestions) || null,
        attemptDate: entry.attemptDate || prevById.attemptDate || prevByTitle.attemptDate || null,
        releaseDate: entry.releaseDate || prevById.releaseDate || prevByTitle.releaseDate || null,
        anyDate: entry.anyDate || prevById.anyDate || prevByTitle.anyDate || null,
        dateField: entry.dateField || prevById.dateField || prevByTitle.dateField || null
      };
      if (examId) apiSimuladoDatesByExamId.set(String(examId), merged);
      if (titleNorm) apiSimuladoDatesByTitle.set(titleNorm, merged);
    }
    function requestSimuladoDatesFromSniffer(teamId = "", examId = "", timeoutMs = 2600) {
      return new Promise((resolve) => {
        const requestId = `dates_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        let settled = false;
        const done = (payload = null) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          window.removeEventListener("message", onResult);
          resolve(payload);
        };
        const onResult = (ev) => {
          if (ev.source !== window || ev.origin !== window.location.origin || ev.data?.source !== "QG_CAVEIRA_API_SNIFFER" || ev.data?.nonce !== CHANNEL_NONCE) {
            return;
          }
          if (ev.data?.type === "FETCH_SIMULADO_DATES_RESULT" && ev.data?.payload?.requestId === requestId) {
            done(ev.data.payload);
          }
        };
        const timer = setTimeout(() => done(null), timeoutMs);
        window.addEventListener("message", onResult);
        try {
          postToSniffer("FETCH_SIMULADO_DATES", { requestId, teamId: String(teamId || ""), examId: String(examId || "") });
        } catch (_) {
          done(null);
        }
      });
    }
    let handleApiSnifferMessageRef = null;
    const lessonCompletionStateByUrl = /* @__PURE__ */ new Map();
    const observedVideos = /* @__PURE__ */ new WeakSet();
    const peekedCourseUrls = /* @__PURE__ */ new Set();
    function isCoursePage() {
      try {
        return window.location.pathname.includes("/courses");
      } catch (_) {
        return false;
      }
    }
    function isCoursePlaygroundPage() {
      try {
        return /\/courses\/.*\/playground/i.test(window.location.pathname);
      } catch (_) {
        return false;
      }
    }
    function isCourseCatalogPage() {
      try {
        return /\/courses(?:\/|$)/i.test(window.location.pathname);
      } catch (_) {
        return false;
      }
    }
    function isQuestionsPage() {
      try {
        return /\/questions/i.test(window.location.pathname);
      } catch (_) {
        return false;
      }
    }
    function isSimuladosPage() {
      try {
        return /\/(?:teams|personal-practice-exams|practice-exams|simulados)/i.test(window.location.pathname);
      } catch (_) {
        return false;
      }
    }
    function isPdfSummariesPage() {
      try {
        return /\/(?:smart-summaries|resumos)/i.test(window.location.pathname);
      } catch (_) {
        return false;
      }
    }
    function flushPendingQgEvents() {
      try {
        if (isExtensionContextValid() && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: "FLUSH_PENDING_QG_EVENTS" }).catch(() => {
          });
        }
      } catch (_) {
      }
    }
    function compactQuestionsForStorage(questions, maxItems = MAX_BUCKET_QUESTIONS) {
      if (!Array.isArray(questions)) return [];
      return questions.slice(0, maxItems).map((q, idx) => {
        if (!q || idx < 150) return q;
        const compacted = { ...q };
        if (typeof compacted.content === "string" && compacted.content.length > 400) {
          compacted.content = compacted.content.slice(0, 400);
        }
        if (typeof compacted.teacherComment === "string" && compacted.teacherComment.length > 500) {
          compacted.teacherComment = compacted.teacherComment.slice(0, 500);
        }
        if (Array.isArray(compacted.alternatives) && compacted.alternatives.length > 6) {
          compacted.alternatives = compacted.alternatives.slice(0, 6);
        }
        return compacted;
      });
    }
    let isDestroyed = false;
    let isStorageLoaded = false;
    let currentQuestionId = null;
    let timerSeconds = 0;
    let isTimerRunning = false;
    let timerInterval = null;
    let scanIntervalId = null;
    let domObserver = null;
    let promptDismissTimer = null;
    let lastUserClickedChoice = null;
    let activeQuestionData = null;
    let scanDebounceTimer = null;
    let scrollRafId = null;
    let questionsCache = [];
    const questionTimers = /* @__PURE__ */ new Map();
    const processedInSession = /* @__PURE__ */ new Set();
    const pendingAnswerQIds = /* @__PURE__ */ new Set();
    const savedQuestionIds = /* @__PURE__ */ new Set();
    const savedQuestionsMissingAlts = /* @__PURE__ */ new Set();
    const autoCommentAttemptedQIds = /* @__PURE__ */ new Set();
    let sessionStats = {
      date: getTodaySessionDate(),
      total: 0,
      hits: 0,
      errors: 0
    };
    function checkDailySessionReset() {
      const today = getTodaySessionDate();
      if (sessionStats.date !== today) {
        sessionStats = { date: today, total: 0, hits: 0, errors: 0 };
        if (isExtensionContextValid()) {
          chrome.storage.local.set({ [SESSION_KEY]: sessionStats });
        }
        updateHudStats();
      }
    }
    function isExtensionContextValid() {
      try {
        return !isDestroyed && Boolean(typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local);
      } catch (_) {
        return false;
      }
    }
    function updateSimuladoImportStatusHud(queue) {
      const statusEl = getHudEl("qg-sim-delivery-status");
      const info = formatSimuladoDeliveryStatus(queue);
      if (!statusEl) return;
      if (!info.label) {
        statusEl.style.display = "none";
        statusEl.textContent = "";
        return;
      }
      statusEl.textContent = info.label;
      statusEl.style.color = info.isDone ? "#86efac" : "#fde68a";
      statusEl.style.display = "block";
    }
    let handleScrollUpdateRef = null;
    let handlePopstateHashRef = null;
    let handleDocumentClickRef = null;
    let handleDocumentKeydownRef = null;
    let handleRuntimeMessageRef = null;
    function teardownInstance() {
      isDestroyed = true;
      renderHudCourseDiffBarRef = null;
      if (timerInterval) clearInterval(timerInterval);
      if (pdfTimerInterval) clearInterval(pdfTimerInterval);
      if (scanIntervalId) clearInterval(scanIntervalId);
      if (targetLessonPollTimer) {
        clearInterval(targetLessonPollTimer);
        targetLessonPollTimer = null;
      }
      if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
      if (promptDismissTimer) clearTimeout(promptDismissTimer);
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = null;
      }
      if (domObserver) domObserver.disconnect();
      if (handleScrollUpdateRef) {
        window.removeEventListener("scroll", handleScrollUpdateRef, { capture: true });
        window.removeEventListener("wheel", handleScrollUpdateRef);
      }
      if (handlePopstateHashRef) {
        window.removeEventListener("popstate", handlePopstateHashRef);
        window.removeEventListener("hashchange", handlePopstateHashRef);
      }
      if (handleDocumentClickRef) {
        document.removeEventListener("click", handleDocumentClickRef, true);
      }
      if (handleDocumentKeydownRef) {
        document.removeEventListener("keydown", handleDocumentKeydownRef);
      }
      if (handleApiSnifferMessageRef) {
        window.removeEventListener("message", handleApiSnifferMessageRef);
      }
      if (handleRuntimeMessageRef && chrome?.runtime?.onMessage) {
        try {
          chrome.runtime.onMessage.removeListener(handleRuntimeMessageRef);
        } catch (_) {
        }
      }
      if (handleStorageChangedRef && chrome?.storage?.onChanged) {
        try {
          chrome.storage.onChanged.removeListener(handleStorageChangedRef);
        } catch (_) {
        }
      }
      destroyShadowHud();
      destroyAllInlineAutopsyCards();
      destroyTrapRadarOverlays();
    }
    window.addEventListener("qg-caveira-teardown", teardownInstance, { once: true });
    function loadInitialState() {
      if (!isExtensionContextValid()) return;
      try {
        chrome.storage.local.get(
          [
            STORAGE_KEY,
            SESSION_KEY,
            SCHEMA_KEY,
            SCHEMA_VERSION_KEY,
            GOAL_KEY,
            ACTIVE_USER_KEY,
            ACTIVE_USER_LABEL_KEY,
            PENDING_FILTER_KEY,
            LAST_FILTER_DIAG_KEY,
            TODAY_MISSION_KEY,
            SUBJECT_SPEEDS_KEY,
            MODULE_SPEEDS_KEY,
            FILTER_ID_MEMORY_KEY,
            FILTER_MEMORY_CLOUD_KEY,
            DIAGNOSTIC_MODE_KEY,
            PENDING_SIMULADOS_QUEUE_KEY,
            ACTIVE_MISSION_KEY,
            COURSE_INDEX_CACHE_KEY,
            COURSE_VIDEO_INDEX_SYNC_KEY,
            PENDING_MIRROR_PROOF_KEY
          ],
          (res) => {
            if (chrome.runtime.lastError || isDestroyed) return;
            cachedActiveUserId = res?.[ACTIVE_USER_KEY] || null;
            cachedActiveUserLabel = res?.[ACTIVE_USER_LABEL_KEY] || "";
            const rawBootMission = res?.[ACTIVE_MISSION_KEY] || null;
            activePracticeMission = cachedActiveUserId && rawBootMission && (!rawBootMission.ownerUserId || rawBootMission.ownerUserId === cachedActiveUserId) ? rawBootMission : null;
            diagnosticModeEnabled = Boolean(res?.[DIAGNOSTIC_MODE_KEY]);
            postToSniffer("SET_DIAGNOSTIC_MODE", { enabled: diagnosticModeEnabled });
            if (res?.[PENDING_SIMULADOS_QUEUE_KEY]) {
              updateSimuladoImportStatusHud(res[PENDING_SIMULADOS_QUEUE_KEY]);
            }
            if (res?.[TODAY_MISSION_KEY]) cachedTodayMission = res[TODAY_MISSION_KEY];
            if (res?.[SUBJECT_SPEEDS_KEY] && typeof res[SUBJECT_SPEEDS_KEY] === "object") {
              cachedSubjectSpeeds = res[SUBJECT_SPEEDS_KEY];
            }
            if (res?.[MODULE_SPEEDS_KEY] && typeof res[MODULE_SPEEDS_KEY] === "object") {
              cachedModuleSpeeds = res[MODULE_SPEEDS_KEY];
            }
            if (res?.[COURSE_INDEX_CACHE_KEY]?.byLesson && typeof res[COURSE_INDEX_CACHE_KEY].byLesson === "object") {
              cachedLocalCourseIndexByLesson = res[COURSE_INDEX_CACHE_KEY].byLesson;
            }
            if (res?.[COURSE_VIDEO_INDEX_SYNC_KEY] && typeof res[COURSE_VIDEO_INDEX_SYNC_KEY] === "object") {
              cachedSyncedVideoIndexMap = res[COURSE_VIDEO_INDEX_SYNC_KEY];
            }
            const rawProof = res?.[PENDING_MIRROR_PROOF_KEY];
            if (rawProof && rawProof.mirrorQId && rawProof.sourceQId && Date.now() - (Number(rawProof.at) || 0) < 18e5) {
              cachedPendingMirrorProof = rawProof;
            }
            const cloudMem = res?.[FILTER_MEMORY_CLOUD_KEY];
            if (cloudMem && typeof cloudMem === "object" && Object.keys(cloudMem).length > 0) {
              const localMem = res?.[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === "object" ? { ...res[FILTER_ID_MEMORY_KEY] } : {};
              let mergedChanged = false;
              Object.entries(cloudMem).forEach(([k, v]) => {
                if (!v || typeof v !== "object") return;
                if (!localMem[k] || (Number(v.updatedAt) || 0) > (Number(localMem[k].updatedAt) || 0)) {
                  localMem[k] = v;
                  mergedChanged = true;
                }
              });
              if (mergedChanged) {
                chrome.storage.local.set({ [FILTER_ID_MEMORY_KEY]: localMem });
              }
            }
            updateHudUser();
            updateContextualHud();
            updateHudMission();
            let tabDiag = null;
            try {
              const rawTabDiag = sessionStorage.getItem(TAB_FILTER_DIAG_SESSION_KEY);
              if (rawTabDiag) {
                sessionStorage.removeItem(TAB_FILTER_DIAG_SESSION_KEY);
                const parsedTabDiag = JSON.parse(rawTabDiag);
                if (parsedTabDiag && parsedTabDiag.savedAt && Date.now() - parsedTabDiag.savedAt < 25e3) {
                  tabDiag = parsedTabDiag;
                }
              }
            } catch (_) {
            }
            const globalDiag = res?.[LAST_FILTER_DIAG_KEY];
            let savedDiag = tabDiag;
            if (!savedDiag && globalDiag && globalDiag.savedAt) {
              const isFreshDiag = Date.now() - globalDiag.savedAt < 25e3;
              if (!isFreshDiag) {
                chrome.storage.local.remove([LAST_FILTER_DIAG_KEY]);
              } else {
                const curPathSearch = `${window.location.pathname || ""}${window.location.search || ""}`;
                const urlSubjectId = Number(new URLSearchParams(window.location.search || "").get("subject_ids")?.split(",")[0] || 0);
                const matchesTargetUrl = Boolean(globalDiag.targetUrl && globalDiag.targetUrl === curPathSearch);
                const matchesSubject = Boolean(
                  globalDiag.expectedFilter?.subjectId && urlSubjectId && Number(globalDiag.expectedFilter.subjectId) === urlSubjectId
                );
                if (matchesTargetUrl || matchesSubject) {
                  savedDiag = globalDiag;
                  chrome.storage.local.remove([LAST_FILTER_DIAG_KEY]);
                }
              }
            }
            if (savedDiag) {
              if (savedDiag.diagLog) lastFilterDiagnosticLog = savedDiag.diagLog;
              if (savedDiag.activePracticeFilter) activePracticeFilter = savedDiag.activePracticeFilter;
              if (savedDiag.proposedSelection) lastResolverProposed = savedDiag.proposedSelection;
              if (savedDiag.bannerText) {
                filterStatusMessage = savedDiag.bannerText;
                renderFilterBanner(savedDiag.bannerText);
              }
              if (savedDiag.expectedFilter && isQuestionsPage()) {
                const expectedSnap = savedDiag.expectedFilter;
                setTimeout(() => {
                  if (isDestroyed) return;
                  const check = verifyUrlFilterApplied({
                    expectedSubjectId: expectedSnap.subjectId,
                    expectedIds: expectedSnap.ids,
                    urlSearch: window.location.search || "",
                    appliedDom: readAppliedFiltersFromDom()
                  });
                  if (!check.honored) {
                    renderFilterBanner('⚠️ Filtro por URL não aplicado pelo Caveira — clique 🔄 ou "Tentar modo antigo"');
                  }
                }, 2200);
              }
            }
            if (!isCoursePage()) {
              const pendingFilterFallback = res?.[PENDING_FILTER_KEY];
              const tryRunFilter = (filterObj) => {
                if (!isDestroyed && filterObj && (filterObj.topic || Array.isArray(filterObj.lessons) && filterObj.lessons.length > 0) && Date.now() - (Number(filterObj.createdAt) || 0) < 18e4) {
                  setTimeout(() => applyCaveiraPracticeFilter(filterObj), 900);
                }
              };
              if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({ type: "CONSUME_PENDING_FILTER" }, (consumeResp) => {
                  if (chrome.runtime.lastError) {
                    if (pendingFilterFallback && !pendingFilterFallback.targetTabId) {
                      tryRunFilter(pendingFilterFallback);
                    }
                    return;
                  }
                  if (consumeResp?.filter) {
                    tryRunFilter(consumeResp.filter);
                  }
                });
              } else if (pendingFilterFallback && !pendingFilterFallback.targetTabId) {
                tryRunFilter(pendingFilterFallback);
              }
            }
            if (res && res[GOAL_KEY]) {
              cachedDailyGoal = Number(res[GOAL_KEY]) || 50;
            }
            const today = getTodaySessionDate();
            const rawQuestions = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
            const questions = cachedActiveUserId ? rawQuestions.filter((q) => q && q.ownerUserId === cachedActiveUserId) : [];
            if (res?.[SCHEMA_VERSION_KEY] !== SCHEMA_VERSION || res?.[SCHEMA_KEY] !== "v3_strict_clean") {
              if (questions.length > 0 && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({
                  type: "DB_BULK_UPSERT_QUESTIONS",
                  payload: {
                    questions,
                    enqueueOutbox: false
                  }
                }).catch(() => {
                });
              }
              const nextSession = normalizeSession(res?.[SESSION_KEY]);
              chrome.storage.local.set({
                [STORAGE_KEY]: questions,
                [SESSION_KEY]: nextSession,
                [SCHEMA_KEY]: "v3_strict_clean",
                [SCHEMA_VERSION_KEY]: SCHEMA_VERSION
              });
            }
            questionsCache = [...questions];
            questions.forEach((q) => {
              if (q && q.id) {
                savedQuestionIds.add(q.id);
                if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every((a) => !a.text || a.text === a.letter)) {
                  savedQuestionsMissingAlts.add(q.id);
                }
              }
            });
            const rawSession = res?.[SESSION_KEY];
            sessionStats = normalizeSession(rawSession);
            if (!rawSession || rawSession.date !== today) {
              chrome.storage.local.set({ [SESSION_KEY]: sessionStats });
            }
            isStorageLoaded = true;
            updateHudStats();
            scanCards();
          }
        );
      } catch (_) {
      }
    }
    loadInitialState();
    if (isExtensionContextValid() && chrome.storage.onChanged) {
      try {
        handleStorageChangedRef = (changes, area) => {
          if (!isExtensionContextValid()) {
            teardownInstance();
            return;
          }
          if (area === "local") {
            if (changes[STORAGE_KEY]) {
              const rawList = Array.isArray(changes[STORAGE_KEY].newValue) ? changes[STORAGE_KEY].newValue : [];
              const updatedList = cachedActiveUserId ? rawList.filter((q) => q && q.ownerUserId === cachedActiveUserId) : [];
              questionsCache = [...updatedList];
              savedQuestionIds.clear();
              savedQuestionsMissingAlts.clear();
              updatedList.forEach((q) => {
                if (q && q.id) {
                  savedQuestionIds.add(q.id);
                  if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every((a) => !a.text || a.text === a.letter)) {
                    savedQuestionsMissingAlts.add(q.id);
                  }
                }
              });
              for (const pId of Array.from(processedInSession)) {
                if (!savedQuestionIds.has(pId)) {
                  processedInSession.delete(pId);
                }
              }
              if (currentQuestionId) {
                const activeCard = getQuestionCards().find((c) => extractQuestionId(c) === currentQuestionId);
                renderQuestionHistory(currentQuestionId, activeCard ? isCardAnswered(activeCard) : false);
              }
            }
            if (changes[SESSION_KEY]) {
              sessionStats = normalizeSession(changes[SESSION_KEY].newValue);
              updateHudStats();
            }
            if (changes[ACTIVE_USER_KEY]) {
              const nextUid = changes[ACTIVE_USER_KEY].newValue || null;
              const prevUid = cachedActiveUserId;
              cachedActiveUserId = nextUid;
              if (nextUid !== prevUid) {
                questionsCache = [];
                savedQuestionIds.clear();
                savedQuestionsMissingAlts.clear();
                processedInSession.clear();
                pendingAnswerQIds.clear();
                unansweredObservedQIds.clear();
                preAnsweredIgnoredQIds.clear();
                apiAnswerCache.clear();
                activeQuestionData = null;
                activePracticeMission = null;
                dismissPrompt();
                chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, ACTIVE_MISSION_KEY], (res) => {
                  if (chrome.runtime?.lastError || isDestroyed) return;
                  const rawList = Array.isArray(res?.[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
                  const scoped = nextUid ? rawList.filter((q) => q && q.ownerUserId === nextUid) : [];
                  questionsCache = [...scoped];
                  scoped.forEach((q) => {
                    if (q && q.id) {
                      savedQuestionIds.add(q.id);
                      if (!Array.isArray(q.alternatives) || q.alternatives.length === 0 || q.alternatives.every((a) => !a.text || a.text === a.letter)) {
                        savedQuestionsMissingAlts.add(q.id);
                      }
                    }
                  });
                  sessionStats = normalizeSession(res?.[SESSION_KEY]);
                  const rawM = res?.[ACTIVE_MISSION_KEY] || null;
                  activePracticeMission = nextUid && rawM && (!rawM.ownerUserId || rawM.ownerUserId === nextUid) ? rawM : null;
                  updateHudStats();
                  updateHudUser();
                  updateHudMission();
                });
              }
              updateHudUser();
            }
            if (changes[ACTIVE_USER_LABEL_KEY]) {
              cachedActiveUserLabel = changes[ACTIVE_USER_LABEL_KEY].newValue || "";
              updateHudUser();
            }
            if (changes[GOAL_KEY]) {
              cachedDailyGoal = Number(changes[GOAL_KEY].newValue) || 50;
              updateHudGoal();
            }
            if (changes[TODAY_MISSION_KEY]) {
              cachedTodayMission = changes[TODAY_MISSION_KEY].newValue || null;
              updateContextualHud();
            }
            if (changes[SUBJECT_SPEEDS_KEY]) {
              cachedSubjectSpeeds = changes[SUBJECT_SPEEDS_KEY].newValue || {};
              lastExplicitLessonSpeed = null;
              updateContextualHud();
              applySubjectVideoSpeedInPlayground(true);
            }
            if (changes[MODULE_SPEEDS_KEY]) {
              cachedModuleSpeeds = changes[MODULE_SPEEDS_KEY].newValue || {};
              lastExplicitLessonSpeed = null;
              applySubjectVideoSpeedInPlayground(true);
            }
            if (changes[DIAGNOSTIC_MODE_KEY]) {
              diagnosticModeEnabled = Boolean(changes[DIAGNOSTIC_MODE_KEY].newValue);
              postToSniffer("SET_DIAGNOSTIC_MODE", { enabled: diagnosticModeEnabled });
            }
            if (changes[PENDING_SIMULADOS_QUEUE_KEY]) {
              updateSimuladoImportStatusHud(changes[PENDING_SIMULADOS_QUEUE_KEY].newValue);
            }
            if (changes[DEFAULT_PREFS_KEY]) {
              const nextDiffs = Array.isArray(changes[DEFAULT_PREFS_KEY].newValue?.difficultyIds) ? Array.from(new Set(changes[DEFAULT_PREFS_KEY].newValue.difficultyIds.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 6))).sort((a, b) => a - b) : [];
              hudCourseDifficultyIds = nextDiffs;
              try {
                if (isExtensionContextValid() && chrome?.storage?.local) {
                  chrome.storage.local.set({ [HUD_COURSE_DIFF_KEY]: nextDiffs });
                }
              } catch (_) {
              }
              renderHudCourseDiffBarRef?.();
            }
            if (changes[ACTIVE_MISSION_KEY]) {
              const nextM = changes[ACTIVE_MISSION_KEY].newValue || null;
              activePracticeMission = cachedActiveUserId && nextM && (!nextM.ownerUserId || nextM.ownerUserId === cachedActiveUserId) ? nextM : null;
              updateHudMission();
            }
            if (changes[COURSE_INDEX_CACHE_KEY]) {
              cachedLocalCourseIndexByLesson = changes[COURSE_INDEX_CACHE_KEY].newValue?.byLesson || {};
            }
            if (changes[COURSE_VIDEO_INDEX_SYNC_KEY]) {
              cachedSyncedVideoIndexMap = changes[COURSE_VIDEO_INDEX_SYNC_KEY].newValue || {};
            }
            if (changes[PENDING_MIRROR_PROOF_KEY]) {
              const np = changes[PENDING_MIRROR_PROOF_KEY].newValue || null;
              cachedPendingMirrorProof = np && np.mirrorQId && np.sourceQId && Date.now() - (Number(np.at) || 0) < 18e5 ? np : null;
            }
          }
        };
        chrome.storage.onChanged.addListener(handleStorageChangedRef);
      } catch (_) {
      }
    }
    function applyQuickTag(tag) {
      if (!tag || tag !== "duvida" && tag !== "chute" && tag !== "sabia") return false;
      const hud = getHudEl("qg-caveira-hud");
      if (hud) {
        hud.querySelectorAll("[data-confidence]").forEach((b) => {
          b.classList.toggle("active", b.dataset.confidence === tag);
        });
      }
      let targetQ = activeQuestionData;
      if (!targetQ && currentQuestionId) {
        const fromCache = questionsCache.find((q) => q && q.id === currentQuestionId);
        if (fromCache) {
          targetQ = { ...fromCache };
        } else {
          const card = getQuestionCards().find((c) => extractQuestionId(c) === currentQuestionId);
          if (card) targetQ = extractQuestionData(card, currentQuestionId);
        }
        if (targetQ) activeQuestionData = targetQ;
      }
      if (!targetQ) return false;
      targetQ.confidence = tag;
      targetQ.fsrsRequested = tag === "chute" || tag === "duvida";
      saveQuestion(targetQ, true);
      updateInlineAutopsyBadge(targetQ.id, { hit: Boolean(targetQ.hit), confidence: tag });
      const badge = getHudEl("qg-prompt-status-badge");
      if (badge && targetQ.hit && (tag === "chute" || tag === "duvida")) {
        badge.textContent = "🃏 +FSRS AGENDADO";
      }
      if (hud) {
        const label = tag === "chute" ? "🎲 Marcado: CHUTE (+FSRS)" : tag === "duvida" ? "🤔 Marcado: DÚVIDA (+FSRS)" : "🎯 Marcado: SABIA";
        renderFilterBanner(label);
      }
      return true;
    }
    if (isExtensionContextValid() && chrome.runtime.onMessage) {
      try {
        handleRuntimeMessageRef = (msg, sender, sendResponse) => {
          if (isDestroyed || !isExtensionContextValid()) return false;
          if (msg && msg.type === "FORCE_SCAN_NOW") {
            scanCards();
            sendResponse({ ok: true });
          }
          if (msg && msg.type === "APPLY_CAVEIRA_FILTER" && msg.payload) {
            applyCaveiraPracticeFilter(msg.payload);
            sendResponse({ ok: true });
          }
          if (msg && msg.type === "PLAYER_VIDEO_ENDED") {
            showLessonCompletedBanner();
            sendResponse({ ok: true });
          }
          if (msg && msg.type === "PLAYER_BRIDGE_READY") {
            applySubjectVideoSpeedInPlayground(true);
            sendResponse({ ok: true });
          }
          if (msg && msg.type === "HUD_QUICK_TAG" && msg.payload?.tag) {
            const ok = applyQuickTag(msg.payload.tag);
            sendResponse({ ok });
          }
        };
        chrome.runtime.onMessage.addListener(handleRuntimeMessageRef);
      } catch (_) {
      }
    }
    handleApiSnifferMessageRef = (event) => {
      if (isDestroyed || event.source !== window || event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || msg.source !== "QG_CAVEIRA_API_SNIFFER" || msg.nonce !== CHANNEL_NONCE) return;
      if (msg.type === "API_DIAGNOSTIC_SHAPE" && msg.payload) {
        appendDiagnosticShape(msg.payload);
        return;
      }
      if (msg.type === "API_COURSES_LIST" && msg.payload && Array.isArray(msg.payload.courses)) {
        const byId = /* @__PURE__ */ new Map();
        apiCoursesListCache.forEach((c) => {
          if (c?.id) byId.set(String(c.id), c);
        });
        msg.payload.courses.forEach((c) => {
          if (c?.id) byId.set(String(c.id), c);
        });
        apiCoursesListCache = Array.from(byId.values());
        return;
      }
      if (msg.type === "API_COURSE_CATALOG" && msg.payload && Array.isArray(msg.payload.modules)) {
        appendSnifferTelemetryEvent("API_COURSE_CATALOG", { modules: msg.payload.modules.length });
        const incomingCid = String(msg.payload.courseId || "");
        const prevCid = String(apiCourseCatalogCache?.courseId || "");
        const sameCourse = !incomingCid || !prevCid || incomingCid === prevCid;
        const mergedMap = /* @__PURE__ */ new Map();
        if (sameCourse) {
          (Array.isArray(apiCourseCatalogCache?.modules) ? apiCourseCatalogCache.modules : []).forEach((m) => {
            if (!m || !m.name) return;
            const k = m.id ? `id:${m.id}` : `nm:${normalizeCourseIndexKey(m.name)}`;
            mergedMap.set(k, m);
          });
        }
        msg.payload.modules.forEach((m) => {
          if (!m || !m.name) return;
          const k = m.id ? `id:${m.id}` : `nm:${normalizeCourseIndexKey(m.name)}`;
          const prevM = mergedMap.get(k);
          if (!prevM) {
            mergedMap.set(k, m);
            return;
          }
          const prevLessons = Array.isArray(prevM.lessons) ? prevM.lessons : [];
          const incLessons = Array.isArray(m.lessons) ? m.lessons : [];
          const byLes = /* @__PURE__ */ new Map();
          prevLessons.forEach((l) => {
            if (l?.title) byLes.set(l.id ? `id:${l.id}` : normalizeCourseIndexKey(l.title), l);
          });
          incLessons.forEach((l) => {
            if (l?.title) {
              const lk = l.id ? `id:${l.id}` : normalizeCourseIndexKey(l.title);
              byLes.set(lk, { ...byLes.get(lk) || {}, ...l });
            }
          });
          mergedMap.set(k, {
            ...prevM,
            ...m,
            moduleUrl: m.moduleUrl || prevM.moduleUrl || "",
            lessons: Array.from(byLes.values())
          });
        });
        const incCourseName = String(msg.payload.courseName || "").trim();
        const validIncName = incCourseName && incCourseName !== "Curso Caveira" ? incCourseName : "";
        const prevCourseName = sameCourse ? String(apiCourseCatalogCache?.courseName || "").trim() : "";
        apiCourseCatalogCache = {
          courseId: incomingCid || (sameCourse ? prevCid : ""),
          courseName: validIncName || (prevCourseName && prevCourseName !== "Curso Caveira" ? prevCourseName : "") || "Curso Caveira",
          modules: Array.from(mergedMap.values())
        };
        try {
          const indexLessons = [];
          const resolvedCid = apiCourseCatalogCache.courseId || (window.location.pathname.match(/\/courses\/(\d+)/i)?.[1] || "");
          const resolvedCName = apiCourseCatalogCache.courseName || "";
          msg.payload.modules.forEach((m) => {
            const cleanModName = m?.name && m.name !== "Módulo Atual" ? m.name : "";
            const inferredSubj = resolvedCName && resolvedCName !== "Curso Caveira" && !/extensivo|prf|policia|caveira/i.test(resolvedCName) ? resolvedCName : inferSubjectFromLessons([cleanModName]) || "";
            (m?.lessons || []).forEach((l) => {
              if (l?.title && l?.rawIndexText) {
                const parsedTopics = parseTimestampTopicsFromText(l.rawIndexText);
                const subs = parseCourseIndexSubtopics(l.rawIndexText, [cleanModName, l.title]);
                if (subs.length > 0 || parsedTopics.length > 0) {
                  const lesKey = normalizeCourseIndexKey(l.title);
                  const lesCid = String(resolvedCid || (String(l.url || "").match(/\/courses\/(\d+)/i)?.[1] || ""));
                  const compositeKey = lesCid && lesKey ? `${lesCid}::${lesKey}` : lesKey;
                  const lesSubj = inferredSubj || inferSubjectFromLessons([l.title, cleanModName]) || "";
                  indexLessons.push({
                    key: compositeKey,
                    entry: {
                      url: String(l.url || window.location.href).split("#")[0],
                      courseId: lesCid,
                      courseName: resolvedCName,
                      subject: lesSubj,
                      moduleName: cleanModName,
                      videoId: l.id ? String(l.id) : "",
                      lessonTitle: l.title,
                      source: "indice_api",
                      rawIndexText: l.rawIndexText,
                      indiceRawText: l.rawIndexText,
                      ...parsedTopics.length > 0 ? { topics: parsedTopics } : {},
                      subtopics: subs,
                      capturedAt: Date.now()
                    }
                  });
                }
              }
            });
          });
          if (indexLessons.length > 0 && isExtensionContextValid() && chrome?.storage?.local) {
            chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
              if (chrome.runtime?.lastError || isDestroyed) return;
              const prev = res?.[COURSE_INDEX_CACHE_KEY] && typeof res[COURSE_INDEX_CACHE_KEY] === "object" ? res[COURSE_INDEX_CACHE_KEY] : { latest: null, byLesson: {} };
              const nextBy = { ...prev.byLesson || {} };
              let changed = false;
              indexLessons.forEach(({ key, entry }) => {
                if (!key) return;
                const existing = nextBy[key];
                if (!existing) {
                  nextBy[key] = entry;
                  changed = true;
                } else if (Array.isArray(entry.topics) && entry.topics.length > 0 && (!Array.isArray(existing.topics) || existing.topics.length === 0) || !existing.rawIndexText && entry.rawIndexText) {
                  nextBy[key] = {
                    ...existing,
                    url: existing.url || entry.url,
                    subject: existing.subject || entry.subject || "",
                    moduleName: existing.moduleName && existing.moduleName !== "Módulo Atual" ? existing.moduleName : entry.moduleName || "",
                    indiceRawText: entry.indiceRawText,
                    ...Array.isArray(entry.topics) && entry.topics.length > 0 ? { topics: entry.topics } : {}
                  };
                  changed = true;
                }
              });
              if (changed) {
                const ordered = Object.entries(nextBy).sort((a, b) => (b[1]?.capturedAt || 0) - (a[1]?.capturedAt || 0)).slice(0, 120);
                chrome.storage.local.set({
                  [COURSE_INDEX_CACHE_KEY]: {
                    latest: prev.latest || ordered[0]?.[1] || null,
                    byLesson: Object.fromEntries(ordered)
                  }
                });
              }
            });
          }
        } catch (_) {
        }
        return;
      }
      if (msg.type === "API_ANSWER_SUBMITTED" && msg.payload) {
        const { apiId, hit, answerStatus, userAnswer, correctAnswer, communityCorrectPct, communityErrorPct } = msg.payload;
        appendSnifferTelemetryEvent("API_ANSWER_SUBMITTED", { apiId, hit, answerStatus });
        if (apiId) {
          const numId = Number(apiId);
          apiAnswerCache.set(numId, {
            hit: Boolean(hit),
            answerStatus: answerStatus ?? null,
            userAnswer: userAnswer ?? null,
            correctAnswer: correctAnswer ?? null,
            ...communityCorrectPct !== void 0 ? { communityCorrectPct, communityErrorPct } : {},
            at: Date.now()
          });
          const existing = questionsCache.find((q) => q && (Number(q.apiId) === numId || q.id === `Q${numId}` || q.id === `api_${numId}`));
          if (existing) {
            saveQuestion({
              ...existing,
              apiId: numId,
              hit: Boolean(hit),
              acertou: Boolean(hit),
              ...userAnswer ? { userChoice: String(userAnswer).toUpperCase() } : {},
              ...correctAnswer ? { correctChoice: String(correctAnswer).toUpperCase() } : {},
              ...communityCorrectPct !== void 0 ? { communityCorrectPct, communityErrorPct } : {}
            }, true);
          }
          scheduleScan(120);
        }
        return;
      }
      if (msg.type === "API_QUESTION_STATISTICS" && msg.payload?.apiId) {
        const { apiId, subjectId, subtopicId, correctAnswer, userAnswer, answerStatus, answeredAt, communityCorrectPct, communityErrorPct } = msg.payload;
        const numId = Number(apiId);
        appendSnifferTelemetryEvent("API_QUESTION_STATISTICS", { apiId: numId, subjectId, subtopicId });
        const prev = apiQuestionByApiId.get(numId) || {};
        const nextApi = {
          ...prev,
          apiId: numId,
          ...subjectId ? { subjectId } : {},
          ...subtopicId ? { subtopicId } : {},
          ...correctAnswer ? { correctAnswer } : {},
          ...userAnswer ? { userAnswer } : {},
          ...answerStatus ? { lastAnswerStatus: answerStatus } : {},
          ...answeredAt ? { answeredAt } : {},
          ...communityCorrectPct !== void 0 ? { communityCorrectPct, communityErrorPct } : {}
        };
        apiQuestionByApiId.set(numId, nextApi);
        apiQuestionCache.set(`Q${numId}`, nextApi);
        const existing = questionsCache.find((q) => q && (Number(q.apiId) === numId || q.id === `Q${numId}` || q.id === `api_${numId}`));
        if (existing && (subjectId || subtopicId || correctAnswer || communityCorrectPct !== void 0)) {
          saveQuestion({
            ...existing,
            apiId: numId,
            ...subjectId ? { subjectId } : {},
            ...subtopicId ? { subtopicId } : {},
            ...correctAnswer && !existing.correctChoice ? { correctChoice: String(correctAnswer).toUpperCase() } : {},
            ...communityCorrectPct !== void 0 && existing.communityCorrectPct === void 0 ? { communityCorrectPct, communityErrorPct } : {}
          }, true);
        }
        return;
      }
      if (msg.type === "API_PERFORMANCE_DATA" && msg.payload?.subjectsAndTopicsPerformance) {
        const subjectCount = Object.keys(msg.payload.subjectsAndTopicsPerformance).length;
        appendSnifferTelemetryEvent("API_PERFORMANCE_DATA", { subjects: subjectCount, rangeDays: msg.payload.rangeDays || null });
        if (isExtensionContextValid() && chrome?.storage?.local) {
          chrome.storage.local.set({ [PERFORMANCE_SNAPSHOT_KEY]: msg.payload }, () => {
            flushPendingQgEvents();
          });
        }
        return;
      }
      if (msg.type === "API_QUESTION_DATA" && Array.isArray(msg.payload?.questions)) {
        appendSnifferTelemetryEvent("API_QUESTION_DATA", { count: msg.payload.questions.length });
        msg.payload.questions.forEach((aq) => {
          if (!aq || !aq.apiId && !aq.code && !aq.id) return;
          const numericApiId = aq.apiId ? Number(aq.apiId) : null;
          const explicitCode = aq.code || aq.id || null;
          const mappedIds = cachedCaveiraTree ? resolveTreeIdsForQuestion(cachedCaveiraTree, {
            subject: aq.subject || "",
            subtopic: aq.subtopic || "",
            subtopicPath: aq.subtopicPath || ""
          }) : { subjectId: null, subtopicId: null };
          const statusParsed = parseLastAnswerStatus(aq.lastAnswerStatus);
          if (!statusParsed.recognized && diagnosticModeEnabled) {
            appendDiagnosticShape({
              kind: "unknown_last_answer_status",
              apiId: numericApiId,
              rawType: typeof aq.lastAnswerStatus,
              rawValue: statusParsed.rawValue
            });
          }
          const prevByApi = numericApiId ? apiQuestionByApiId.get(numericApiId) || {} : {};
          const prevByCode = explicitCode ? apiQuestionByCode.get(explicitCode) || {} : {};
          const mergedApi = {
            ...prevByCode,
            ...prevByApi,
            ...aq,
            ...mappedIds.subjectId ? { subjectId: mappedIds.subjectId } : {},
            ...mappedIds.subtopicId ? { subtopicId: mappedIds.subtopicId } : {}
          };
          if (numericApiId) {
            apiQuestionByApiId.set(numericApiId, mergedApi);
            apiQuestionCache.set(`Q${numericApiId}`, mergedApi);
          }
          if (explicitCode) {
            apiQuestionByCode.set(explicitCode, mergedApi);
            apiQuestionCache.set(explicitCode, mergedApi);
          }
          const existing = questionsCache.find((q) => q && (explicitCode && q.id === explicitCode || numericApiId && (Number(q.apiId) === numericApiId || q.id === `Q${numericApiId}` || q.id === `api_${numericApiId}`)));
          if (existing) {
            const needsComment = !existing.teacherComment && mergedApi.teacherComment;
            const needsStats = existing.communityCorrectPct === void 0 && mergedApi.communityCorrectPct !== void 0;
            const needsNote = !existing.userNote && mergedApi.userNote;
            const needsIds = !existing.apiId && numericApiId || !existing.subjectId && mappedIds.subjectId || !existing.subtopicId && mappedIds.subtopicId;
            if (needsComment || needsStats || needsNote || needsIds) {
              saveQuestion({
                ...existing,
                ...numericApiId ? { apiId: numericApiId } : {},
                ...mappedIds.subjectId ? { subjectId: mappedIds.subjectId } : {},
                ...mappedIds.subtopicId ? { subtopicId: mappedIds.subtopicId } : {},
                ...mergedApi.banca && !existing.banca ? { banca: mergedApi.banca } : {},
                ...mergedApi.ano && !existing.ano ? { ano: mergedApi.ano } : {},
                ...needsComment ? { teacherComment: mergedApi.teacherComment, commentSource: mergedApi.commentSource || "professor" } : {},
                ...needsStats ? { communityCorrectPct: mergedApi.communityCorrectPct, communityErrorPct: mergedApi.communityErrorPct } : {},
                ...needsNote ? { userNote: mergedApi.userNote } : {}
              }, true);
            }
          }
        });
        if (!cachedCaveiraTree) loadCaveiraTree();
        return;
      }
      if (msg.type === "API_SIMULADOS_DATA" && Array.isArray(msg.payload?.simulados)) {
        appendSnifferTelemetryEvent("API_SIMULADOS_DATA", { count: msg.payload.simulados.length });
        const nextMap = /* @__PURE__ */ new Map();
        apiSimuladosCache.forEach((s) => {
          if (s && !isRankingTitleOrRow("", s.title || "") && (s.caveiraId || s.title)) {
            nextMap.set(s.caveiraId || s.title, s);
          }
        });
        msg.payload.simulados.forEach((rawSim) => {
          if (!rawSim || isRankingTitleOrRow("", rawSim.title || "")) return;
          let b1 = 0;
          let b2 = 0;
          let b3 = 0;
          let hasBlocks = false;
          if (Array.isArray(rawSim.subjectScores) && rawSim.subjectScores.length > 0) {
            hasBlocks = true;
            rawSim.subjectScores.forEach((sc) => {
              const b = classifySubjectBloco(sc.name);
              const val = Number(sc.liquida) || (Number(sc.hits) || 0) - (Number(sc.errors) || 0);
              if (b === "Bloco I") b1 += val;
              else if (b === "Bloco II") b2 += val;
              else b3 += val;
            });
          }
          const enriched = {
            ...rawSim,
            data: rawSim.data || getTodaySessionDate(),
            dataSource: rawSim.dataSource || "api",
            ...hasBlocks ? { b1Liquida: b1, b2Liquida: b2, b3Liquida: b3 } : {}
          };
          const key = enriched.caveiraId || `${enriched.title}|${enriched.data}`;
          nextMap.set(key, enriched);
        });
        apiSimuladosCache = Array.from(nextMap.values());
        return;
      }
      if (msg.type === "API_SIMULADO_DATES" && msg.payload?.examId) {
        mergeSimuladoDateEntry(msg.payload.examId, msg.payload.title || "", msg.payload);
        return;
      }
      if (msg.type === "API_SIMULADO_DATES_BATCH" && Array.isArray(msg.payload?.items)) {
        msg.payload.items.forEach((it) => {
          if (it) mergeSimuladoDateEntry(it.examId, it.title, it);
        });
        return;
      }
      if (msg.type === "API_SIMULADO_ENJOYMENT" && msg.payload?.examId) {
        appendSnifferTelemetryEvent("API_SIMULADO_ENJOYMENT", { examId: msg.payload.examId, subjects: msg.payload.subjects?.length || 0 });
        const {
          examId,
          blocks = [],
          subjects = [],
          hits: enjoyHits,
          errors: enjoyErrors,
          blank: enjoyBlank,
          canceled: enjoyCanceled,
          total: enjoyTotal,
          liquida: enjoyLiquida,
          pct: enjoyPct,
          attemptDate = null,
          releaseDate = null,
          anyDate = null,
          dateField = null
        } = msg.payload;
        if (attemptDate || releaseDate || anyDate) {
          mergeSimuladoDateEntry(examId, msg.payload.title || "", { attemptDate, releaseDate, anyDate, dateField });
        }
        let b1C = 0;
        let b1E = 0;
        let b2C = 0;
        let b2E = 0;
        let b3C = 0;
        let b3E = 0;
        let b1Liquida = 0;
        let b2Liquida = 0;
        let b3Liquida = 0;
        let hasData = false;
        if (Array.isArray(blocks) && blocks.length > 0) {
          blocks.forEach((bl) => {
            const n = normalizeCourseIndexKey(bl.name || "");
            const h = Number(bl.hits) || 0;
            const e = Number(bl.errors) || 0;
            const liq = bl.liquida !== void 0 ? Number(bl.liquida) : h - e;
            if (/\b(?:bloco\s*)?(?:1|i)\b/.test(n)) {
              b1C += h;
              b1E += e;
              b1Liquida += liq;
              hasData = true;
            } else if (/\b(?:bloco\s*)?(?:2|ii)\b/.test(n)) {
              b2C += h;
              b2E += e;
              b2Liquida += liq;
              hasData = true;
            } else if (/\b(?:bloco\s*)?(?:3|iii)\b/.test(n)) {
              b3C += h;
              b3E += e;
              b3Liquida += liq;
              hasData = true;
            }
          });
        } else if (Array.isArray(subjects) && subjects.length > 0) {
          hasData = true;
          subjects.forEach((sc) => {
            const b = classifySubjectBloco(sc.name);
            const h = Number(sc.hits) || 0;
            const e = Number(sc.errors) || 0;
            const liq = sc.liquida !== void 0 ? Number(sc.liquida) : h - e;
            if (b === "Bloco I") {
              b1C += h;
              b1E += e;
              b1Liquida += liq;
            } else if (b === "Bloco II") {
              b2C += h;
              b2E += e;
              b2Liquida += liq;
            } else {
              b3C += h;
              b3E += e;
              b3Liquida += liq;
            }
          });
        }
        const mappedSubjects = Array.isArray(subjects) ? subjects.map((sc) => {
          const h = Number(sc.hits) || 0;
          const e = Number(sc.errors) || 0;
          const bl = Number(sc.blank) || 0;
          const canc = Number(sc.canceled) || 0;
          const tot = Number(sc.total) || h + e + bl + canc;
          const pct = sc.pct !== void 0 ? Number(sc.pct) : tot > 0 ? Math.round(h / tot * 100) : 0;
          return {
            ...sc.subjectId ? { subjectId: Number(sc.subjectId) } : {},
            name: String(sc.name || "").trim(),
            hits: h,
            errors: e,
            blank: bl,
            ...canc > 0 ? { canceled: canc } : {},
            total: tot,
            liquida: sc.liquida !== void 0 ? Number(sc.liquida) : h - e,
            pct,
            ...sc.othersPct !== void 0 ? { othersPct: Number(sc.othersPct) } : {},
            bloco: classifySubjectBloco(sc.name)
          };
        }).filter((s) => s.name) : [];
        if (hasData || mappedSubjects.length > 0) {
          const blockStats = hasData ? { b1C, b1E, b1Liquida, b2C, b2E, b2Liquida, b3C, b3E, b3Liquida } : {};
          const aggPatch = {
            ...enjoyHits !== void 0 ? { hits: Number(enjoyHits) } : {},
            ...enjoyErrors !== void 0 ? { errors: Number(enjoyErrors) } : {},
            ...enjoyBlank !== void 0 ? { blank: Number(enjoyBlank) } : {},
            ...enjoyCanceled !== void 0 && Number(enjoyCanceled) > 0 ? { canceled: Number(enjoyCanceled) } : {},
            ...enjoyTotal !== void 0 ? { total: Number(enjoyTotal) } : {},
            ...enjoyLiquida !== void 0 ? { liquida: Number(enjoyLiquida) } : {},
            ...enjoyPct !== void 0 ? { pct: Number(enjoyPct) } : {}
          };
          const enjoyObj = {
            ...blockStats,
            ...aggPatch,
            ...mappedSubjects.length > 0 ? { subjectScores: mappedSubjects } : {}
          };
          apiSimuladoEnjoymentByExamId.set(String(examId), enjoyObj);
          let foundInCache = false;
          apiSimuladosCache = apiSimuladosCache.map((s) => {
            if (s && s.caveiraId === `sim_${examId}`) {
              foundInCache = true;
              return {
                ...s,
                ...enjoyObj,
                estimated: false
              };
            }
            return s;
          });
          if (!foundInCache && mappedSubjects.length > 0) {
            const dateMeta = apiSimuladoDatesByExamId.get(String(examId));
            const resolvedDate = dateMeta?.attemptDate || dateMeta?.releaseDate || dateMeta?.anyDate || getTodaySessionDate();
            const dateSource = dateMeta?.attemptDate ? "attempt" : dateMeta?.releaseDate ? "release" : dateMeta?.anyDate ? "api_date" : "import";
            apiSimuladosCache.push({
              caveiraId: `sim_${examId}`,
              title: dateMeta?.title || `Simulado Caveira #${examId}`,
              data: resolvedDate,
              dateSource,
              ...dateMeta?.dateField ? { dateField: dateMeta.dateField } : {},
              ...dateMeta?.releaseDate ? { releasedAt: dateMeta.releaseDate } : {},
              dataSource: "api",
              estimated: false,
              total: enjoyTotal !== void 0 ? Number(enjoyTotal) : dateMeta?.numberQuestions || void 0,
              ...enjoyObj
            });
          }
        }
        return;
      }
      if (msg.type === "FETCH_MIRROR_QUESTION_RESULT" && msg.payload?.requestId) {
        const cb = pendingMirrorRequests.get(msg.payload.requestId);
        if (cb) {
          pendingMirrorRequests.delete(msg.payload.requestId);
          cb(msg.payload.candidates || []);
        }
        return;
      }
      if (msg.type === "API_SUBJECT_TREE_DATA" && Array.isArray(msg.payload?.nodes) && msg.payload.nodes.length > 0) {
        appendSnifferTelemetryEvent("API_SUBJECT_TREE_DATA", { nodes: msg.payload.nodes.length });
        if (isExtensionContextValid() && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            type: "DB_MERGE_TREE_OVERLAY",
            payload: { nodes: msg.payload.nodes }
          }, (resp) => {
            if (!chrome.runtime?.lastError) {
              cachedCaveiraTree = null;
              loadCaveiraTree();
              chrome.storage.local.get([TREE_META_KEY], (mRes) => {
                if (chrome.runtime?.lastError) return;
                const prevMeta = mRes?.[TREE_META_KEY] || {};
                chrome.storage.local.set({
                  [TREE_META_KEY]: {
                    ...prevMeta,
                    baselineDate: cachedCaveiraTreeGeradoEm || prevMeta.baselineDate || "",
                    lastDynamicUpdateAt: Date.now(),
                    dynamicNodeCount: Math.max(Number(prevMeta.dynamicNodeCount) || 0, Number(resp?.added) || 0)
                  }
                });
              });
            }
          });
        }
      }
    };
    window.addEventListener("message", handleApiSnifferMessageRef);
    try {
      window.dispatchEvent(new CustomEvent("qg-caveira-sniffer-init", {
        detail: { nonce: CHANNEL_NONCE, diagnosticMode: diagnosticModeEnabled }
      }));
      setTimeout(() => {
        if (!isDestroyed && !apiCourseCatalogCache && apiSimuladosCache.length === 0) {
          postToSniffer("REQUEST_SNIFFER_REPLAY");
        }
      }, 900);
    } catch (_) {
    }
    function resolveSubjectSpeedForContext2(contextTitle = "", extraContexts = [], options = {}) {
      const contextList = [
        contextTitle,
        ...Array.isArray(extraContexts) ? extraContexts : [extraContexts],
        currentCourseIndexStatus?.courseTitle || "",
        currentCourseIndexStatus?.moduleTitle || "",
        lastOpenedCourseContext?.subject || "",
        lastOpenedCourseContext?.course || "",
        document.title || ""
      ].filter(Boolean);
      const cidMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
      const midMatch = window.location.pathname.match(/\/modules\/(\d+)/i);
      const courseId = options.courseId || (cidMatch ? cidMatch[1] : "");
      const moduleId = options.moduleId || (midMatch ? midMatch[1] : "");
      const currentSig = `${courseId}:${moduleId}`;
      const explicitSpeed = options.explicitSpeed !== void 0 ? options.explicitSpeed : lastExplicitLessonSpeed && lastExplicitLessonUrlSig === currentSig ? lastExplicitLessonSpeed : null;
      return resolveSubjectSpeedForContext(cachedSubjectSpeeds, contextList, inferSubjectFromLessons, {
        moduleSpeeds: cachedModuleSpeeds,
        courseId,
        moduleId,
        explicitSpeed
      });
    }
    function readRequestedSeekSeconds() {
      try {
        const tParam = Number(new URLSearchParams(window.location.search || "").get("t"));
        if (Number.isFinite(tParam) && tParam > 0) return Math.round(tParam);
      } catch (_) {
      }
      try {
        const hashMatch = String(window.location.hash || "").match(/qg_t=(\d+)/);
        if (hashMatch && Number(hashMatch[1]) > 0) return Math.round(Number(hashMatch[1]));
      } catch (_) {
      }
      try {
        const stored = JSON.parse(sessionStorage.getItem("qg_target_lesson_pending") || "null");
        if (stored && Number(stored.seekSec) > 0 && Date.now() - (Number(stored.savedAt) || 0) < 9e4) {
          return Math.round(Number(stored.seekSec));
        }
      } catch (_) {
      }
      return 0;
    }
    function dispatchReadySeek(seekSec, courseId = "") {
      const sec = Math.max(0, Math.round(Number(seekSec) || 0));
      if (sec <= 0 || !isExtensionContextValid() || !chrome?.storage?.local) return;
      const cid = courseId || (window.location.pathname.match(/\/courses\/(\d+)/i)?.[1] || "");
      const fire = () => {
        if (isDestroyed) return;
        const nowTs = Date.now();
        try {
          chrome.storage.local.set({
            [PLAYER_SEEK_KEY]: {
              seconds: sec,
              courseId: cid,
              awaitingTargetLesson: false,
              readyToSeek: true,
              updatedAt: nowTs,
              savedAt: nowTs
            }
          }, () => {
            if (chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({ type: "SEEK_VIDEO_TO", payload: { seconds: sec } }).catch(() => {
              });
            }
          });
        } catch (_) {
        }
      };
      fire();
      setTimeout(fire, 1200);
    }
    function applySubjectVideoSpeedInPlayground(forceSend = false) {
      if (!isCoursePlaygroundPage()) return;
      const lessonTitle = currentCourseIndexStatus?.lessonTitle || extractCourseLessonTitle() || document.title || "";
      const courseTitle = currentCourseIndexStatus?.courseTitle || lastOpenedCourseContext?.course || "";
      const currentCourseId = window.location.pathname.match(/\/courses\/(\d+)/i)?.[1] || "";
      const currentModuleId = window.location.pathname.match(/\/modules\/(\d+)/i)?.[1] || "";
      const targetSpeed = resolveSubjectSpeedForContext2(lessonTitle, [courseTitle], {
        courseId: currentCourseId,
        moduleId: currentModuleId
      });
      const speedBadge = getHudEl("qg-hud-speed-badge");
      if (speedBadge) {
        if (targetSpeed !== 1) {
          speedBadge.style.display = "inline-flex";
          speedBadge.textContent = `⚡ Velocidade QG: ${targetSpeed}x • HD Máx`;
        } else {
          speedBadge.style.display = "inline-flex";
          speedBadge.textContent = "🎬 Qualidade Máxima";
        }
      }
      try {
        let waitingForTargetLesson = false;
        const pendingNav = JSON.parse(sessionStorage.getItem("qg_target_lesson_pending") || "null");
        if (pendingNav && pendingNav.lesson && Date.now() - (Number(pendingNav.savedAt) || 0) < 45e3) {
          const curPlay = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || "";
          if (!curPlay || scoreCaveiraLessonCandidate(curPlay, pendingNav.lesson) < 75) {
            waitingForTargetLesson = true;
          }
        }
        const currentHrefNoHash = window.location.href.split("#")[0];
        if (!waitingForTargetLesson && (currentHrefNoHash !== lastSeekUrlApplied || forceSend)) {
          const seekParam = readRequestedSeekSeconds();
          if (seekParam > 0) {
            lastSeekUrlApplied = currentHrefNoHash;
            dispatchReadySeek(seekParam, currentCourseId);
          }
        }
      } catch (_) {
      }
      const speedSig = `${currentCourseId}:${currentModuleId}:${lessonTitle}:${targetSpeed}`;
      if (forceSend || targetSpeed !== lastPlaygroundSpeedApplied || speedSig !== lastPlaygroundSpeedSig) {
        lastPlaygroundSpeedApplied = targetSpeed;
        lastPlaygroundSpeedSig = speedSig;
        try {
          chrome.storage.local.set(
            {
              [PLAYER_SPEED_KEY]: {
                speed: targetSpeed,
                forceMaxQuality: true,
                courseId: currentCourseId,
                moduleId: currentModuleId,
                updatedAt: Date.now()
              }
            },
            () => {
              if (chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({
                  type: "APPLY_PLAYER_SPEED",
                  payload: { speed: targetSpeed, forceMaxQuality: true }
                }).catch(() => {
                });
              }
            }
          );
        } catch (_) {
        }
      }
      try {
        document.querySelectorAll("video").forEach((v) => {
          if (v && Number.isFinite(targetSpeed) && Math.abs((v.playbackRate || 1) - targetSpeed) > 0.01) {
            v.playbackRate = targetSpeed;
          }
          if (v && !observedVideos.has(v)) {
            observedVideos.add(v);
            v.addEventListener("ended", () => {
              showLessonCompletedBanner();
            });
          }
        });
      } catch (_) {
      }
    }
    function showLessonCompletedBanner() {
      if (isDestroyed) return;
      const actions = getHudEl("qg-hud-course-actions");
      if (actions) actions.style.display = "flex";
      const banner = getHudEl("qg-hud-course-completed-banner");
      if (banner) {
        banner.style.display = "flex";
      }
    }
    function detectCurrentPlaygroundLessonCompleted() {
      try {
        const videoId = new URLSearchParams(window.location.search || "").get("course_video_id") || "";
        const activeItems = Array.from(document.querySelectorAll('.q-item--active, [class*="active-lesson"], [class*="selected"], a[href*="course_video_id"]')).filter((el) => !videoId || String(el.getAttribute("href") || el.innerHTML || "").includes(videoId));
        for (const el of activeItems) {
          const chk = el.querySelector('.q-checkbox[aria-checked="true"], input[type="checkbox"]:checked, .q-toggle[aria-checked="true"]');
          if (chk) return true;
          const icons = Array.from(el.querySelectorAll(".material-icons, i, svg"));
          if (icons.some((ic) => /check_circle|task_alt|done_all/i.test((ic.textContent || "") + " " + (ic.className || "")))) {
            return true;
          }
        }
        const toggleBtns = Array.from(document.querySelectorAll(".q-checkbox[aria-checked], .q-btn, button")).filter((el) => {
          if (el.closest("#qg-caveira-shadow-host, #qg-caveira-hud")) return false;
          const txt = normalizeFilterText(el.innerText || el.textContent || "");
          return txt.includes("aula concluida") || txt.includes("concluida");
        });
        if (toggleBtns.some((b) => b.getAttribute("aria-checked") === "true" || b.classList.contains("bg-positive") || /aula\s+concluida/.test(normalizeFilterText(b.innerText || "")))) {
          return true;
        }
      } catch (_) {
      }
      return false;
    }
    function observeLessonCompletionOnPlayground() {
      if (!isCoursePlaygroundPage()) return;
      const key = window.location.href;
      const isNowCompleted = detectCurrentPlaygroundLessonCompleted();
      const prev = lessonCompletionStateByUrl.get(key);
      if (prev === false && isNowCompleted === true) {
        showLessonCompletedBanner();
      }
      lessonCompletionStateByUrl.set(key, isNowCompleted);
    }
    function scrapeCourseCatalogAndSync() {
      const modulesMap = /* @__PURE__ */ new Map();
      const courseIdMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
      const modIdMatch = window.location.pathname.match(/\/modules\/(\d+)/i);
      const courseId = courseIdMatch ? courseIdMatch[1] : "";
      const currentModId = modIdMatch ? modIdMatch[1] : "";
      const courseName = (document.querySelector("h1, h2, .text-h5, .text-h6")?.innerText || "Curso Caveira").trim();
      const activeModEl = document.querySelector('.q-item--active, [aria-selected="true"].q-item, [class*="module"].active, [class*="breadcrumb"] a:last-child');
      const activeModName = (activeModEl?.innerText || activeModEl?.textContent || "").split(/\r?\n/)[0]?.trim() || courseName;
      const defaultModuleUrl = courseId && currentModId ? `${window.location.origin}/courses/${courseId}/modules/${currentModId}/playground` : courseId ? `${window.location.origin}/courses/${courseId}` : `${window.location.origin}/courses`;
      const lessonLinks = Array.from(document.querySelectorAll('a[href*="course_video_id"], a[href*="/modules/"], [data-course-video-id], .q-expansion-item, .q-item, .q-card, div')).filter((el) => {
        if (el.closest("#qg-caveira-shadow-host, #qg-caveira-hud, header, .q-header, .q-toolbar, aside, nav") || !isElementVisible(el)) return false;
        if (el.tagName !== "DIV") return true;
        const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (!txt || txt.length < 4 || txt.length > 220) return false;
        const hasChk = Boolean(el.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox'));
        const hasDur = /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(txt);
        const isPtr = window.getComputedStyle(el).cursor === "pointer";
        return isPtr && (hasChk || hasDur);
      });
      const lessons = [];
      const seenLessonKeys = /* @__PURE__ */ new Set();
      lessonLinks.forEach((el) => {
        const href = el.getAttribute("href") || el.querySelector('a[href*="course_video_id"], a[href*="/modules/"]')?.getAttribute("href") || "";
        const modHrefMatch = href.match(/\/modules\/(\d+)/i);
        let videoId = el.getAttribute("data-course-video-id") || "";
        if (!videoId && href) {
          const m = href.match(/course_video_id=(\d+)/i);
          if (m) videoId = m[1];
        }
        const rawText = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (!rawText || rawText.length < 4 || rawText.length > 220) return;
        const hasVideoIcon = Array.from(el.querySelectorAll(".material-icons, i")).some(
          (i) => /play_circle|ondemand_video|smart_display|play_arrow|videocam/i.test(i.textContent || "")
        );
        const isLessonItem = Boolean(videoId || /\d{1,2}:\d{2}/.test(rawText) || /\baula\b/i.test(rawText) || hasVideoIcon);
        if (!isLessonItem && (modHrefMatch || el.matches(".q-expansion-item, .q-card") && inferSubjectFromLessons([rawText], rawText))) {
          const modHeading = (el.querySelector("h1, h2, h3, h4, .text-h6, .text-subtitle1, .q-item__label")?.innerText || rawText.split(/\n/)[0] || "").trim();
          if (modHeading.length >= 3 && modHeading.length <= 90) {
            const fullModUrl = href ? href.startsWith("http") ? href : `${window.location.origin}${href.startsWith("/") ? "" : "/"}${href}` : defaultModuleUrl;
            if (!modulesMap.has(modHeading)) {
              modulesMap.set(modHeading, {
                id: modHrefMatch?.[1] || null,
                name: modHeading,
                moduleUrl: fullModUrl,
                lessons: []
              });
            }
          }
          return;
        }
        if (!isLessonItem) return;
        const durMatch = rawText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
        let durationMin = 0;
        if (durMatch) {
          durationMin = durMatch[3] !== void 0 ? Math.round(Number(durMatch[1]) * 60 + Number(durMatch[2]) + Number(durMatch[3]) / 60) : Math.max(1, Math.round(Number(durMatch[1]) + Number(durMatch[2]) / 60));
        }
        const title = stripCaveiraLessonUiNoise(rawText);
        if (!title || title.length < 3) return;
        const dedupKey = videoId ? `vid:${videoId}` : normalizeCourseIndexKey(title);
        if (seenLessonKeys.has(dedupKey)) return;
        seenLessonKeys.add(dedupKey);
        const completed = Boolean(
          el.querySelector('.q-checkbox[aria-checked="true"], input[type="checkbox"]:checked') || Array.from(el.querySelectorAll(".material-icons, i")).some((i) => /check_circle|task_alt|done/i.test(i.textContent || ""))
        );
        const url = href ? href.startsWith("http") ? href : `${window.location.origin}${href.startsWith("/") ? "" : "/"}${href}` : defaultModuleUrl;
        lessons.push({ id: videoId || null, verifiedVideoUrl: Boolean(videoId), title, durationMin, completed, url });
      });
      if (isCoursePlaygroundPage()) {
        const currentTitle = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || currentCourseIndexStatus?.lessonTitle || "";
        const curVidMatch = window.location.search.match(/course_video_id=(\d+)/i);
        const curVid = curVidMatch?.[1] || "";
        const kCur = curVid ? `vid:${curVid}` : normalizeCourseIndexKey(currentTitle);
        if (currentTitle && currentTitle.length >= 3 && !seenLessonKeys.has(kCur)) {
          let cleanPlayUrl = window.location.href.split("#")[0];
          try {
            const u = new URL(cleanPlayUrl);
            u.searchParams.delete("t");
            cleanPlayUrl = u.toString();
          } catch (_) {
          }
          seenLessonKeys.add(kCur);
          lessons.push({
            id: curVid || null,
            verifiedVideoUrl: Boolean(curVid),
            title: currentTitle,
            durationMin: 0,
            completed: detectCurrentPlaygroundLessonCompleted(),
            url: cleanPlayUrl
          });
        }
      }
      const apiMatchesCourse = !courseId || !apiCourseCatalogCache?.courseId || String(apiCourseCatalogCache.courseId) === String(courseId);
      const apiMods = apiMatchesCourse && Array.isArray(apiCourseCatalogCache?.modules) ? apiCourseCatalogCache.modules : [];
      apiMods.forEach((m) => {
        if (m && m.name && (Array.isArray(m.lessons) && (m.lessons.length > 0 || m.moduleUrl))) {
          modulesMap.set(m.name, m);
        }
      });
      if (lessons.length > 0) {
        const existingMod = modulesMap.get(activeModName);
        if (existingMod && Array.isArray(existingMod.lessons)) {
          const byTitle = new Map(existingMod.lessons.map((l) => [normalizeCourseIndexKey(l.title), l]));
          lessons.forEach((l) => {
            const k = normalizeCourseIndexKey(l.title);
            if (!byTitle.has(k)) byTitle.set(k, l);
          });
          modulesMap.set(activeModName, {
            ...existingMod,
            name: activeModName,
            moduleUrl: existingMod.moduleUrl || defaultModuleUrl,
            lessons: Array.from(byTitle.values())
          });
        } else {
          modulesMap.set(activeModName, { name: activeModName, moduleUrl: defaultModuleUrl, lessons });
        }
      }
      const totalLessonsCount = Array.from(modulesMap.values()).reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
      const payload = {
        courseId: courseId || apiCourseCatalogCache?.courseId || "",
        courseName: (apiMatchesCourse ? apiCourseCatalogCache?.courseName : "") || courseName,
        modules: Array.from(modulesMap.values()),
        syncedAt: Date.now()
      };
      if (payload.modules.length > 0) {
        try {
          chrome.storage.local.set({ [PENDING_CATALOG_KEY]: payload }, () => {
            flushPendingQgEvents();
          });
        } catch (_) {
        }
      }
      return { modulesCount: payload.modules.length, lessonsCount: totalLessonsCount };
    }
    let targetLessonPollTimer = null;
    let lastOpenedCourseContext = null;
    function extractCleanTitleFromVideoMainTitle(rawTitle) {
      const raw = String(rawTitle || "").replace(/\s+/g, " ").trim();
      if (!raw || raw.length < 4 || raw.length > 240) return "";
      const sepMatch = raw.match(/\s+[-–—]\s+/);
      if (sepMatch) {
        const idx = sepMatch.index;
        const left = raw.slice(0, idx).trim();
        const right = raw.slice(idx + sepMatch[0].length).trim();
        if (right.length >= 4 && !/^(?:parte|pt|aula|bloco|m[oó]dulo)\s*(?:\d+|[ivx]+)$/i.test(right)) {
          const leftHasSubject = Boolean(matchExactSubjectRule(left));
          const courseMainEl = document.querySelector(".course-main-title");
          const courseNorm = normalizeFilterText(courseMainEl?.innerText || courseMainEl?.textContent || "");
          const leftNorm = normalizeFilterText(left);
          const leftMatchesCourse = Boolean(courseNorm && leftNorm && (leftNorm.includes(courseNorm) || courseNorm.includes(leftNorm)));
          if (leftHasSubject || leftMatchesCourse) {
            return right;
          }
        }
      }
      const stripped = stripSubjectFromLessonTitle(raw);
      if (stripped && stripped !== raw && stripped.length >= 4) {
        return stripped;
      }
      return raw;
    }
    function extractPlayingVideoTitleFromHeader() {
      try {
        const videoMainEl = document.querySelector(".video-main-title");
        if (videoMainEl && !videoMainEl.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(videoMainEl)) {
          const cleanedMain = extractCleanTitleFromVideoMainTitle(videoMainEl.innerText || videoMainEl.textContent || "");
          if (cleanedMain) return cleanedMain;
        }
        const toggleListBtn = Array.from(document.querySelectorAll("button, .q-btn")).find((el) => !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(el) && /(?:ocultar|mostrar)\s+lista/i.test(el.innerText || el.textContent || ""));
        if (toggleListBtn) {
          const bar = toggleListBtn.parentElement;
          const rawBar = (bar?.innerText || bar?.textContent || "").replace(/(?:ocultar|mostrar)\s+lista/gi, "").replace(/\s+/g, " ").trim();
          if (rawBar && rawBar.length <= 240) {
            if (rawBar.includes("|")) {
              const right = rawBar.split("|").slice(1).join("|").trim();
              if (right.length >= 4) return right;
            }
            if (rawBar.includes(" - ")) {
              const right = rawBar.split(" - ").slice(1).join(" - ").trim();
              if (right.length >= 4 && !/^(?:parte|pt|aula|bloco|m[oó]dulo)\s*(?:\d+|[ivx]+)$/i.test(right)) {
                return right;
              }
            }
            if (rawBar.length >= 4) return rawBar;
          }
        }
        const headerCandidates = Array.from(document.querySelectorAll("header, .q-toolbar, .q-header, h1, h2, .text-subtitle1, .text-h6")).filter((el) => !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(el));
        for (const el of headerCandidates) {
          const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
          if (txt.includes("|") && txt.length <= 220) {
            const right = txt.split("|").slice(1).join("|").trim();
            if (right.length >= 4) return right;
          }
        }
      } catch (_) {
      }
      return "";
    }
    function isInsideExcludedUi(el) {
      return Boolean(
        el && el.closest('#qg-caveira-shadow-host, #qg-caveira-hud, header, .q-header, .q-toolbar, aside, nav, [role="tablist"], .q-checkbox, [role="checkbox"], input[type="checkbox"]')
      );
    }
    function isClickableLike(el) {
      if (!el) return false;
      if (el.matches('a, button, .q-item, [role="button"], [data-course-video-id], .cursor-pointer')) return true;
      try {
        return window.getComputedStyle(el).cursor === "pointer";
      } catch (_) {
        return false;
      }
    }
    function findBestClickableLessonRowInDom(targetLesson) {
      const rawNodes = Array.from(
        document.querySelectorAll('a[href*="course_video_id"], [data-course-video-id], .q-item, [role="button"], li, div, span')
      ).filter((el) => !isInsideExcludedUi(el) && isElementVisible(el));
      const matched = [];
      for (const el of rawNodes) {
        const rawTxt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (!rawTxt || rawTxt.length < 3 || rawTxt.length > 200) continue;
        if (/^[([]?\d{1,2}:\d{2}/.test(rawTxt)) continue;
        const clickable = isClickableLike(el) || Boolean(el.parentElement && isClickableLike(el.parentElement)) || Boolean(el.closest('[class*="cursor-pointer"], a, button, .q-item'));
        if (!clickable) continue;
        const sc = scoreCaveiraLessonCandidate(rawTxt, targetLesson);
        if (sc < 75) continue;
        const hasRowSignals = Boolean(
          el.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox') || /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(rawTxt) || el.matches('a[href*="course_video_id"], [data-course-video-id]')
        );
        matched.push({ el, rawTxt, score: sc, hasRowSignals, selfClickable: isClickableLike(el) });
      }
      const specific = matched.filter(
        (a) => !matched.some((b) => b !== a && a.el.contains(b.el) && b.score >= a.score)
      );
      if (specific.length === 0) return null;
      specific.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.hasRowSignals !== a.hasRowSignals) return b.hasRowSignals ? 1 : -1;
        if (a.rawTxt.length !== b.rawTxt.length) return a.rawTxt.length - b.rawTxt.length;
        if (b.selfClickable !== a.selfClickable) return b.selfClickable ? 1 : -1;
        return 0;
      });
      const chosen = specific[0];
      let targetEl = chosen.el;
      if (!isClickableLike(targetEl)) {
        let cur = targetEl.parentElement;
        for (let i = 0; i < 3 && cur && !isInsideExcludedUi(cur); i += 1) {
          if (isClickableLike(cur)) {
            const pTxt = (cur.innerText || cur.textContent || "").replace(/\s+/g, " ").trim();
            if (pTxt.length <= 220 && scoreCaveiraLessonCandidate(pTxt, targetLesson) >= 75) {
              targetEl = cur;
              break;
            }
          }
          cur = cur.parentElement;
        }
      }
      const hasCheckboxChild = targetEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox');
      if (hasCheckboxChild) {
        const safeLabelChild = Array.from(targetEl.children).find(
          (ch) => !ch.matches('input[type="checkbox"], [role="checkbox"], .q-checkbox') && !ch.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox') && scoreCaveiraLessonCandidate((ch.innerText || ch.textContent || "").trim(), targetLesson) >= 75
        );
        if (safeLabelChild && isClickableLike(safeLabelChild)) {
          targetEl = safeLabelChild;
        }
      }
      return targetEl;
    }
    function autoOpenTargetLessonFromHash() {
      if (!isCourseCatalogPage()) return;
      let targetLesson = "";
      let targetSubject = "";
      let targetTopic = "";
      let targetCourse = "";
      let targetSeekSec = 0;
      const safeDecode = (v) => {
        try {
          return decodeURIComponent(v || "").trim();
        } catch (_) {
          return String(v || "").trim();
        }
      };
      try {
        const qT = Number(new URLSearchParams(window.location.search || "").get("t"));
        if (Number.isFinite(qT) && qT > 0) targetSeekSec = Math.round(qT);
      } catch (_) {
      }
      const rawHash = String(window.location.hash || "");
      if (rawHash.includes("qg_lesson=")) {
        const mLes = rawHash.match(/qg_lesson=([^&]+)/);
        const mSub = rawHash.match(/qg_subject=([^&]+)/);
        const mTop = rawHash.match(/qg_topic=([^&]+)/);
        const mCrs = rawHash.match(/qg_course=([^&]+)/);
        const mSpd = rawHash.match(/qg_speed=([^&]+)/);
        const mSeek = rawHash.match(/qg_t=(\d+)/);
        if (mLes) targetLesson = safeDecode(mLes[1]);
        if (mSub) targetSubject = safeDecode(mSub[1]);
        if (mTop) targetTopic = safeDecode(mTop[1]);
        if (mCrs) targetCourse = safeDecode(mCrs[1]);
        if (mSeek && Number(mSeek[1]) > 0) targetSeekSec = Math.round(Number(mSeek[1]));
        if (mSpd) {
          const parsedSpd = Number(safeDecode(mSpd[1]));
          if (Number.isFinite(parsedSpd) && parsedSpd >= 0.5 && parsedSpd <= 4) {
            const cidM = window.location.pathname.match(/\/courses\/(\d+)/i);
            const midM = window.location.pathname.match(/\/modules\/(\d+)/i);
            lastExplicitLessonSpeed = Math.round(parsedSpd * 100) / 100;
            lastExplicitLessonUrlSig = `${cidM ? cidM[1] : ""}:${midM ? midM[1] : ""}`;
          }
        }
        if (targetLesson) {
          try {
            sessionStorage.setItem("qg_target_lesson_pending", JSON.stringify({
              lesson: targetLesson,
              subject: targetSubject,
              topic: targetTopic,
              course: targetCourse,
              speed: lastExplicitLessonSpeed,
              seekSec: targetSeekSec,
              savedAt: Date.now()
            }));
          } catch (_) {
          }
        }
      } else {
        try {
          const stored = JSON.parse(sessionStorage.getItem("qg_target_lesson_pending") || "null");
          if (stored && stored.lesson && Date.now() - (Number(stored.savedAt) || 0) < 45e3) {
            targetLesson = stored.lesson;
            targetSubject = stored.subject || "";
            targetTopic = stored.topic || "";
            targetCourse = stored.course || "";
            if (Number(stored.seekSec) > 0 && targetSeekSec <= 0) targetSeekSec = Math.round(Number(stored.seekSec));
            if (Number.isFinite(Number(stored.speed)) && Number(stored.speed) >= 0.5 && Number(stored.speed) <= 4) {
              const cidM = window.location.pathname.match(/\/courses\/(\d+)/i);
              const midM = window.location.pathname.match(/\/modules\/(\d+)/i);
              lastExplicitLessonSpeed = Math.round(Number(stored.speed) * 100) / 100;
              lastExplicitLessonUrlSig = `${cidM ? cidM[1] : ""}:${midM ? midM[1] : ""}`;
            }
          }
        } catch (_) {
        }
      }
      if (!targetLesson) return;
      try {
        const cidMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
        const midMatch = window.location.pathname.match(/\/modules\/(\d+)/i);
        lastOpenedCourseContext = {
          lesson: targetLesson,
          subject: targetSubject,
          topic: targetTopic,
          course: targetCourse,
          courseId: cidMatch ? cidMatch[1] : "",
          moduleId: midMatch ? midMatch[1] : "",
          savedAt: Date.now()
        };
      } catch (_) {
      }
      let finished = false;
      const clearTargetPending = () => {
        finished = true;
        if (targetLessonPollTimer) {
          clearInterval(targetLessonPollTimer);
          targetLessonPollTimer = null;
        }
        try {
          sessionStorage.removeItem("qg_target_lesson_pending");
        } catch (_) {
        }
        if (window.location.hash && window.location.hash.includes("qg_lesson=")) {
          try {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (_) {
          }
        }
      };
      if (targetLessonPollTimer) {
        clearInterval(targetLessonPollTimer);
        targetLessonPollTimer = null;
      }
      let attempts = 0;
      let lastPathname = window.location.pathname;
      let lastClickAt = 0;
      const clickCounts = /* @__PURE__ */ new WeakMap();
      const clickedModules = /* @__PURE__ */ new Set();
      let clickedListView = false;
      let usedCourseSearch = false;
      let usedCourseDetailSearch = false;
      let navigatedToModuleUrl = "";
      let waitingAfterDomClick = false;
      let urlBeforeDomClick = "";
      let titleBeforeDomClick = "";
      let postNavConfirmTicks = 0;
      const applyPendingSeekIfAny = () => {
        const seekSec = targetSeekSec > 0 ? targetSeekSec : readRequestedSeekSeconds();
        if (seekSec > 0) {
          setTimeout(() => {
            dispatchReadySeek(seekSec);
          }, 450);
        }
      };
      const tryNavigate = () => {
        if (isDestroyed) {
          clearInterval(targetLessonPollTimer);
          targetLessonPollTimer = null;
          return;
        }
        if (window.location.pathname !== lastPathname) {
          lastPathname = window.location.pathname;
          attempts = 0;
          waitingAfterDomClick = false;
          usedCourseDetailSearch = false;
          postNavConfirmTicks = 0;
        }
        attempts += 1;
        const now = Date.now();
        const currentCourseIdMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
        if (!currentCourseIdMatch) {
          const queryAllNorm = normalizeCourseIndexKey(`${targetCourse} ${targetTopic} ${targetSubject}`);
          const queryIsStandalone = /\b(?:iniciante|isolad|nivelamento)\b/.test(queryAllNorm);
          if (attempts === 1 && isExtensionContextValid() && chrome?.storage?.local) {
            try {
              chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
                if (isDestroyed || navigatedToModuleUrl) return;
                const byLesson = res?.[COURSE_INDEX_CACHE_KEY]?.byLesson || {};
                let bestCachedUrl = "";
                let bestCachedScore = 0;
                Object.values(byLesson).forEach((entry) => {
                  if (!entry || !entry.url || !String(entry.url).includes("/courses/")) return;
                  const entryTitle = entry.lessonTitle || entry.title || "";
                  const sc = scoreCaveiraLessonCandidate(entryTitle, targetLesson);
                  if (sc < 85) return;
                  const entryCName = normalizeCourseIndexKey(`${entry.courseName || ""} ${entry.moduleName || ""}`);
                  const entryIsStandalone = /\b(?:iniciante|isolad|nivelamento)\b/.test(entryCName);
                  if (queryIsStandalone !== entryIsStandalone && (targetCourse || queryIsStandalone)) return;
                  if (sc > bestCachedScore) {
                    bestCachedScore = sc;
                    bestCachedUrl = String(entry.url).split("#")[0];
                  }
                });
                if (bestCachedUrl) {
                  const targetDirectUrl = `${bestCachedUrl}${window.location.hash}`;
                  finished = true;
                  navigatedToModuleUrl = targetDirectUrl;
                  if (targetLessonPollTimer) {
                    clearInterval(targetLessonPollTimer);
                    targetLessonPollTimer = null;
                  }
                  window.location.href = targetDirectUrl;
                }
              });
            } catch (_) {
            }
          }
          if (apiCoursesListCache.length === 1 && !queryIsStandalone && apiCoursesListCache[0]?.id) {
            const singleCourseUrl = `${window.location.origin}/courses/${apiCoursesListCache[0].id}${window.location.hash}`;
            if (navigatedToModuleUrl !== singleCourseUrl) {
              finished = true;
              navigatedToModuleUrl = singleCourseUrl;
              if (targetLessonPollTimer) {
                clearInterval(targetLessonPollTimer);
                targetLessonPollTimer = null;
              }
              window.location.href = singleCourseUrl;
            }
            return;
          }
          if (apiCoursesListCache.length > 0) {
            let bestApiCourse = null;
            let bestApiCourseScore = 0;
            apiCoursesListCache.forEach((c) => {
              const sc = scoreCaveiraCourseCandidate(c.name, { targetCourse, targetTopic, targetSubject });
              if (sc > bestApiCourseScore) {
                bestApiCourseScore = sc;
                bestApiCourse = c;
              }
            });
            if (bestApiCourse && bestApiCourseScore >= 60) {
              const targetCourseUrl = `${window.location.origin}/courses/${bestApiCourse.id}${window.location.hash}`;
              if (navigatedToModuleUrl !== targetCourseUrl) {
                finished = true;
                navigatedToModuleUrl = targetCourseUrl;
                if (targetLessonPollTimer) {
                  clearInterval(targetLessonPollTimer);
                  targetLessonPollTimer = null;
                }
                window.location.href = targetCourseUrl;
              }
              return;
            }
          }
          if (!clickedListView) {
            const listToggle = Array.from(document.querySelectorAll("button, .q-btn, div, span")).find((el) => !isInsideExcludedUi(el) && isElementVisible(el) && /^lista$/i.test((el.innerText || el.textContent || "").trim()) && isClickableLike(el));
            if (listToggle) {
              clickedListView = true;
              try {
                listToggle.click();
              } catch (_) {
              }
            }
          }
          if (attempts >= 4 && !usedCourseSearch && (Boolean(targetCourse) || queryIsStandalone)) {
            const searchInput = document.querySelector('input[placeholder*="Pesquisar cursos" i]');
            const courseQuery = targetCourse || targetTopic;
            if (searchInput && courseQuery && isElementVisible(searchInput)) {
              usedCourseSearch = true;
              try {
                setNativeInputValue(searchInput, courseQuery);
              } catch (_) {
              }
            }
          }
          const courseEls = Array.from(document.querySelectorAll('a[href*="/courses/"], .q-card, [role="listitem"], div')).filter((el) => !isInsideExcludedUi(el) && isElementVisible(el) && isClickableLike(el));
          let bestCourseEl = null;
          let bestCourseScore = 0;
          courseEls.forEach((el) => {
            const raw = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
            if (!raw || raw.length > 220) return;
            const sc = scoreCaveiraCourseCandidate(raw, { targetCourse, targetTopic, targetSubject });
            if (sc > bestCourseScore) {
              bestCourseScore = sc;
              bestCourseEl = el;
            }
          });
          if (bestCourseEl && bestCourseScore >= 50 && now - lastClickAt >= 1400) {
            lastClickAt = now;
            try {
              bestCourseEl.scrollIntoView({ behavior: "smooth", block: "center" });
              const innerLink = bestCourseEl.querySelector('a[href*="/courses/"], button');
              (innerLink || bestCourseEl).click();
            } catch (_) {
            }
            return;
          }
          if (attempts >= 24) clearTargetPending();
          return;
        }
        if (isCoursePlaygroundPage()) {
          const curPlayTitle = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || currentCourseIndexStatus?.lessonTitle || "";
          if (curPlayTitle && scoreCaveiraLessonCandidate(curPlayTitle, targetLesson) >= 75) {
            applyPendingSeekIfAny();
            clearTargetPending();
            return;
          }
          if (waitingAfterDomClick && window.location.href !== urlBeforeDomClick && curPlayTitle && curPlayTitle !== titleBeforeDomClick) {
            postNavConfirmTicks += 1;
            if (postNavConfirmTicks >= 2) {
              applyPendingSeekIfAny();
              clearTargetPending();
              return;
            }
          }
        }
        if (isCoursePlaygroundPage() && attempts <= 6 && now - lastClickAt >= 900) {
          const showListBtn = Array.from(document.querySelectorAll("button, .q-btn, span, div")).find((el) => !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(el) && /mostrar\s+lista/i.test(el.innerText || el.textContent || ""));
          if (showListBtn) {
            lastClickAt = now;
            try {
              showListBtn.click();
            } catch (_) {
            }
          }
        }
        const targetEl = findBestClickableLessonRowInDom(targetLesson);
        if (targetEl) {
          const prevCount = clickCounts.get(targetEl) || 0;
          if (prevCount < 2 && now - lastClickAt >= 1400) {
            lastClickAt = now;
            clickCounts.set(targetEl, prevCount + 1);
            waitingAfterDomClick = true;
            urlBeforeDomClick = window.location.href;
            titleBeforeDomClick = extractPlayingVideoTitleFromHeader() || "";
            try {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              const anchorInside = targetEl.querySelector("a");
              (anchorInside || targetEl).click();
              if (isCoursePlaygroundPage()) {
                applyPendingSeekIfAny();
              }
            } catch (_) {
            }
            return;
          }
        }
        if (!isCoursePlaygroundPage()) {
          const collapseBtns = Array.from(document.querySelectorAll('button[aria-expanded="false"], .q-expansion-item')).filter((el) => !isInsideExcludedUi(el) && isElementVisible(el));
          collapseBtns.forEach((el) => {
            const btn = el.matches('button[aria-expanded="false"]') ? el : el.querySelector(':scope > .q-expansion-item__container > .q-item, :scope > .q-item, button[aria-expanded="false"]');
            if (!btn || btn.getAttribute("aria-expanded") === "true") return;
            const hText = (el.innerText || btn.innerText || "").replace(/\s+/g, " ").trim();
            if (!hText) return;
            const matchesSubj = targetSubject && scoreCaveiraModuleCandidate(hText, { targetSubject, targetTopic, targetLesson }) >= 55;
            const matchesTok = scoreCaveiraLessonCandidate(hText, targetLesson) >= 30;
            if (matchesSubj || matchesTok || collapseBtns.length <= 8) {
              try {
                btn.click();
              } catch (_) {
              }
            }
          });
          const moduleCandidates = Array.from(document.querySelectorAll("div, li, a, button, .q-item")).filter((el) => {
            if (isInsideExcludedUi(el) || !isElementVisible(el) || !isClickableLike(el)) return false;
            const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
            return txt.length >= 4 && txt.length <= 140 && /\b\d+\s+aulas?\b/i.test(txt);
          });
          let bestModEl = null;
          let bestModKey = "";
          let bestModScore = 0;
          moduleCandidates.forEach((el) => {
            const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
            if (moduleCandidates.some((other) => other !== el && el.contains(other))) return;
            const sc = scoreCaveiraModuleCandidate(txt, { targetSubject, targetTopic, targetLesson });
            if (sc > bestModScore) {
              bestModScore = sc;
              bestModEl = el;
              bestModKey = normalizeCourseIndexKey(txt);
            }
          });
          if (bestModEl && bestModScore >= 55 && !clickedModules.has(bestModKey) && now - lastClickAt >= 1200) {
            clickedModules.add(bestModKey);
            lastClickAt = now;
            try {
              bestModEl.scrollIntoView({ behavior: "smooth", block: "center" });
              bestModEl.click();
            } catch (_) {
            }
            return;
          }
          if (!bestModEl) {
            const fallbackMods = Array.from(document.querySelectorAll('.q-item, [role="tab"], [role="listitem"], a, button')).filter((el) => {
              if (isInsideExcludedUi(el) || !isElementVisible(el) || !isClickableLike(el)) return false;
              const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
              return txt.length >= 4 && txt.length <= 120;
            });
            let fbModEl = null;
            let fbModKey = "";
            let fbModScore = 0;
            fallbackMods.forEach((el) => {
              const txt = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
              if (fallbackMods.some((other) => other !== el && el.contains(other))) return;
              const sc = scoreCaveiraModuleCandidate(txt, { targetSubject, targetTopic, targetLesson });
              if (sc > fbModScore) {
                fbModScore = sc;
                fbModEl = el;
                fbModKey = normalizeCourseIndexKey(txt);
              }
            });
            if (fbModEl && fbModScore >= 75 && !clickedModules.has(fbModKey) && now - lastClickAt >= 1200) {
              clickedModules.add(fbModKey);
              lastClickAt = now;
              try {
                fbModEl.scrollIntoView({ behavior: "smooth", block: "center" });
                fbModEl.click();
              } catch (_) {
              }
              return;
            }
          }
          if (attempts >= 4 && !usedCourseDetailSearch) {
            const detailSearch = document.querySelector('input[placeholder*="Digite para pesquisar" i]');
            if (detailSearch && isElementVisible(detailSearch)) {
              usedCourseDetailSearch = true;
              const cleanQuery = stripCaveiraLessonUiNoise(targetLesson).replace(/\s*[-–—]\s*parte\s*\d+$/i, "").trim() || targetLesson;
              try {
                setNativeInputValue(detailSearch, cleanQuery);
              } catch (_) {
              }
            }
          }
        }
        const currentCourseId = currentCourseIdMatch[1];
        const apiSameCourse = !apiCourseCatalogCache?.courseId || String(apiCourseCatalogCache.courseId) === String(currentCourseId);
        if (apiSameCourse) {
          const apiMods = Array.isArray(apiCourseCatalogCache?.modules) ? apiCourseCatalogCache.modules : [];
          let bestApiLesson = null;
          let bestApiScore = 0;
          let bestFallbackModuleUrl = "";
          let bestFallbackModScore = 0;
          apiMods.forEach((m) => {
            (m?.lessons || []).forEach((l) => {
              if (!l?.title) return;
              const sc = scoreCaveiraLessonCandidate(l.title, targetLesson);
              if (sc >= 75 && l.url && l.verifiedVideoUrl && String(l.url).includes("course_video_id=")) {
                if (sc > bestApiScore) {
                  bestApiScore = sc;
                  bestApiLesson = l;
                }
              } else if (sc >= 75 && m.moduleUrl && String(m.moduleUrl).includes("/playground")) {
                if (sc > bestFallbackModScore) {
                  bestFallbackModScore = sc;
                  bestFallbackModuleUrl = m.moduleUrl;
                }
              }
            });
          });
          const canUseExactApiUrl = !isCoursePlaygroundPage() && attempts >= 6 || isCoursePlaygroundPage() && attempts >= 10;
          if (bestApiLesson && bestApiScore >= 75 && canUseExactApiUrl) {
            const currentNoHash = window.location.href.split("#")[0];
            let targetUrl = bestApiLesson.url;
            let seekSec = 0;
            try {
              seekSec = Math.max(0, Number(new URLSearchParams(window.location.search || "").get("t")) || 0);
            } catch (_) {
            }
            if (seekSec > 0) {
              try {
                const u = new URL(targetUrl);
                u.searchParams.set("t", String(seekSec));
                targetUrl = u.toString();
              } catch (_) {
                targetUrl = `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}t=${seekSec}`;
              }
            }
            if (targetUrl !== currentNoHash && navigatedToModuleUrl !== targetUrl) {
              finished = true;
              navigatedToModuleUrl = targetUrl;
              if (targetLessonPollTimer) {
                clearInterval(targetLessonPollTimer);
                targetLessonPollTimer = null;
              }
              window.location.href = targetUrl;
            }
            return;
          }
          if (!isCoursePlaygroundPage() && attempts >= 8 && bestFallbackModuleUrl && navigatedToModuleUrl !== bestFallbackModuleUrl && bestFallbackModuleUrl !== window.location.href.split("#")[0]) {
            finished = true;
            navigatedToModuleUrl = bestFallbackModuleUrl;
            if (targetLessonPollTimer) {
              clearInterval(targetLessonPollTimer);
              targetLessonPollTimer = null;
            }
            window.location.href = bestFallbackModuleUrl;
            return;
          }
        }
        if (attempts >= 24) {
          clearTargetPending();
        }
      };
      tryNavigate();
      if (!finished && !isDestroyed) {
        targetLessonPollTimer = setInterval(tryNavigate, 500);
      }
    }
    function parseEnjoymentDialogData() {
      const tables = Array.from(document.querySelectorAll(".q-dialog table, .q-card table")).filter((t) => !t.closest("#qg-caveira-shadow-host, #qg-caveira-hud, .ranking-table-wrap") && isElementVisible(t));
      let blockStats = null;
      const subjectScores = [];
      for (const tbl of tables) {
        const headers = Array.from(tbl.querySelectorAll("thead th")).map((h) => normalizeCourseIndexKey(h.textContent || ""));
        if (headers.some((h) => h.includes("bloco")) && headers.some((h) => h.includes("acerto"))) {
          let b1C = 0;
          let b1E = 0;
          let b2C = 0;
          let b2E = 0;
          let b3C = 0;
          let b3E = 0;
          let found = false;
          tbl.querySelectorAll("tbody tr").forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll("td")).map((c) => (c.textContent || "").trim());
            if (cells.length < 3) return;
            const bName = normalizeCourseIndexKey(cells[0]);
            const hitsVal = parseInt(cells[1], 10) || 0;
            const errVal = parseInt(cells[2], 10) || 0;
            if (/bloco\s*(?:1|i)\b/.test(bName)) {
              b1C = hitsVal;
              b1E = errVal;
              found = true;
            } else if (/bloco\s*(?:2|ii)\b/.test(bName)) {
              b2C = hitsVal;
              b2E = errVal;
              found = true;
            } else if (/bloco\s*(?:3|iii)\b/.test(bName)) {
              b3C = hitsVal;
              b3E = errVal;
              found = true;
            }
          });
          if (found) {
            blockStats = {
              b1C,
              b1E,
              b1Liquida: b1C - b1E,
              b2C,
              b2E,
              b2Liquida: b2C - b2E,
              b3C,
              b3E,
              b3Liquida: b3C - b3E
            };
            break;
          }
        }
      }
      for (const tbl of tables) {
        const headers = Array.from(tbl.querySelectorAll("thead th")).map((h) => normalizeCourseIndexKey(h.textContent || ""));
        if (headers.some((h) => h.includes("disciplina")) && headers.some((h) => h.includes("acerto"))) {
          let b1C = 0;
          let b1E = 0;
          let b2C = 0;
          let b2E = 0;
          let b3C = 0;
          let b3E = 0;
          tbl.querySelectorAll("tbody tr").forEach((tr) => {
            const cells = Array.from(tr.querySelectorAll("td")).map((c) => (c.textContent || "").trim());
            if (cells.length < 4) return;
            const name = cells[0];
            if (!name) return;
            const hitsVal = parseInt(cells[1], 10) || 0;
            const errVal = parseInt(cells[2], 10) || 0;
            const blankVal = parseInt(cells[3], 10) || 0;
            const totalVal = hitsVal + errVal + blankVal;
            const liquidaVal = hitsVal - errVal;
            const pctParsed = cells[4] ? parseFloat(cells[4].replace("%", "").replace(",", ".")) : NaN;
            const pctVal = Number.isFinite(pctParsed) ? Math.round(pctParsed) : totalVal > 0 ? Math.round(hitsVal / totalVal * 100) : 0;
            const othersParsed = cells[5] ? parseFloat(cells[5].replace("%", "").replace(",", ".")) : NaN;
            const bloco = classifySubjectBloco(name);
            subjectScores.push({
              name,
              hits: hitsVal,
              errors: errVal,
              blank: blankVal,
              total: totalVal,
              liquida: liquidaVal,
              pct: pctVal,
              ...Number.isFinite(othersParsed) ? { othersPct: Math.round(othersParsed * 100) / 100 } : {},
              bloco
            });
            if (bloco === "Bloco I") {
              b1C += hitsVal;
              b1E += errVal;
            } else if (bloco === "Bloco II") {
              b2C += hitsVal;
              b2E += errVal;
            } else {
              b3C += hitsVal;
              b3E += errVal;
            }
          });
          if (!blockStats && subjectScores.length > 0) {
            blockStats = {
              b1C,
              b1E,
              b1Liquida: b1C - b1E,
              b2C,
              b2E,
              b2Liquida: b2C - b2E,
              b3C,
              b3E,
              b3Liquida: b3C - b3E
            };
          }
          if (subjectScores.length > 0) break;
        }
      }
      if (!blockStats && subjectScores.length === 0) return null;
      return { blockStats, subjectScores };
    }
    async function scrapeSimuladosAndImport() {
      const results = [];
      const seen = /* @__PURE__ */ new Set();
      const boxUse = document.querySelector(".dash-box-container.box-use");
      if (boxUse && !boxUse.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(boxUse)) {
        const title = (document.querySelector(".brand-container h5, h5.q-mb-sm, h1, h2")?.innerText || "").replace(/\s+/g, " ").trim() || "Simulado Caveira";
        const examIdMatch = window.location.pathname.match(/\/practice-exams?\/(\d+)/i);
        const examId = examIdMatch?.[1] || "";
        let dialogData = parseEnjoymentDialogData();
        let openedDialogProgrammatically = false;
        if (!dialogData || !Array.isArray(dialogData.subjectScores) || dialogData.subjectScores.length === 0) {
          const answersBtn = boxUse.querySelector(".show-answers button");
          if (answersBtn && isElementVisible(answersBtn)) {
            openedDialogProgrammatically = true;
            try {
              answersBtn.click();
            } catch (_) {
            }
            for (let attempt = 0; attempt < 20; attempt += 1) {
              await sleepMs(120);
              if (isDestroyed) break;
              const parsedNow = parseEnjoymentDialogData();
              if (parsedNow && (parsedNow.subjectScores?.length > 0 || parsedNow.blockStats)) {
                dialogData = parsedNow;
                break;
              }
            }
            await sleepMs(150);
            if (openedDialogProgrammatically) {
              try {
                const dialogEl = document.querySelector(".q-dialog");
                const closeBtn = dialogEl ? dialogEl.querySelector('button[aria-label*="close" i], button[aria-label*="fechar" i]') || Array.from(dialogEl.querySelectorAll("button")).find((b) => /close|clear|fechar/i.test((b.textContent || "") + " " + (b.getAttribute("aria-label") || ""))) : null;
                if (closeBtn) {
                  closeBtn.click();
                } else {
                  const backdrop = document.querySelector(".q-dialog__backdrop");
                  if (backdrop) backdrop.click();
                  else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true }));
                }
              } catch (_) {
              }
            }
          }
        }
        const smallTxt = (boxUse.querySelector(".points .small-number")?.textContent || "").trim();
        const smallMatch = smallTxt.match(/(-?\d+)\s*\/\s*(\d+)/);
        const bigTxt = (boxUse.querySelector(".points .big-number")?.textContent || "").trim();
        const bigMatch = bigTxt.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
        const numQuestionsTxt = (document.querySelector(".number-questions")?.textContent || "").trim();
        const totalFromBadge = parseInt(numQuestionsTxt, 10) || 0;
        const apiEnjoy = examId ? apiSimuladoEnjoymentByExamId.get(examId) : null;
        const apiMatchById = examId ? apiSimuladosCache.find((s) => s && s.caveiraId === `sim_${examId}`) : null;
        const estimatedReasons = [];
        const total = smallMatch ? Number(smallMatch[2]) : totalFromBadge || apiEnjoy?.total || (apiMatchById?.total ? Number(apiMatchById.total) : null);
        if (!total) {
          estimatedReasons.push("total de questões ausente na tela e na API (não inventado)");
        }
        const liquidaFromBox = smallMatch ? Number(smallMatch[1]) : apiEnjoy?.liquida ?? apiMatchById?.liquida ?? null;
        const pct = bigMatch ? Math.round(parseFloat(bigMatch[1].replace(",", "."))) : apiEnjoy?.pct ?? (liquidaFromBox !== null && total > 0 ? Math.round(liquidaFromBox / total * 100) : apiMatchById?.pct ?? 0);
        let svgHits = null;
        let svgErrors = null;
        let svgBlank = null;
        const rects = Array.from(boxUse.querySelectorAll(".apexcharts-treemap-series .apexcharts-treemap-rect"));
        const labelGroups = Array.from(boxUse.querySelectorAll(".apexcharts-treemap-series .apexcharts-data-labels"));
        rects.forEach((rect, idx) => {
          const nextEl = rect.nextElementSibling;
          const labelContainer = nextEl && nextEl.classList?.contains("apexcharts-data-labels") ? nextEl : labelGroups[idx];
          const rawVal = labelContainer?.querySelector("tspan, text")?.textContent?.trim();
          const numVal = rawVal !== void 0 ? parseInt(rawVal, 10) : NaN;
          if (!Number.isFinite(numVal)) return;
          const fill = (rect.getAttribute("fill") || "").toLowerCase();
          const jAttr = rect.getAttribute("j");
          if (fill.includes("correct") || jAttr === "0") svgHits = numVal;
          else if (fill.includes("wrong") || jAttr === "1") svgErrors = numVal;
          else if (fill.includes("no-answer") || jAttr === "2") svgBlank = numVal;
        });
        let hits = apiEnjoy?.hits ?? (svgHits !== null ? svgHits : apiMatchById?.hits ?? null);
        let errors = apiEnjoy?.errors ?? (svgErrors !== null ? svgErrors : apiMatchById?.errors ?? null);
        let blank = apiEnjoy?.blank ?? (svgBlank !== null ? svgBlank : apiMatchById?.blank ?? null);
        const canceled = apiEnjoy?.canceled ?? apiMatchById?.canceled ?? null;
        if (hits === null && total !== null && liquidaFromBox !== null) {
          hits = Math.max(0, Math.round((total + liquidaFromBox) / 2));
          estimatedReasons.push("acertos aproximados a partir de líquida e total");
        }
        if (errors === null && hits !== null && liquidaFromBox !== null) {
          errors = Math.max(0, hits - liquidaFromBox);
          estimatedReasons.push("erros inferidos de acertos - líquida");
        }
        if (blank === null && total !== null && hits !== null && errors !== null) {
          blank = Math.max(0, total - hits - errors - (canceled || 0));
        }
        const liquida = apiEnjoy?.liquida ?? (liquidaFromBox !== null ? liquidaFromBox : hits !== null && errors !== null ? hits - errors : 0);
        const blockStats = dialogData?.blockStats || (apiEnjoy?.b1Liquida !== void 0 ? {
          b1C: apiEnjoy.b1C,
          b1E: apiEnjoy.b1E,
          b1Liquida: apiEnjoy.b1Liquida,
          b2C: apiEnjoy.b2C,
          b2E: apiEnjoy.b2E,
          b2Liquida: apiEnjoy.b2Liquida,
          b3C: apiEnjoy.b3C,
          b3E: apiEnjoy.b3E,
          b3Liquida: apiEnjoy.b3Liquida
        } : {});
        const subjectScores = (apiEnjoy?.subjectScores?.length || 0) > 0 ? apiEnjoy.subjectScores : dialogData?.subjectScores || [];
        const teamIdMatch = window.location.pathname.match(/\/teams\/(\d+)/i);
        const teamId = teamIdMatch?.[1] || "";
        let dateInfo = examId ? apiSimuladoDatesByExamId.get(examId) : null;
        if (!dateInfo?.attemptDate && (teamId || examId)) {
          const fetchedDates = await requestSimuladoDatesFromSniffer(teamId, examId, 2600);
          if (fetchedDates) {
            mergeSimuladoDateEntry(examId, title, fetchedDates);
            dateInfo = examId ? apiSimuladoDatesByExamId.get(examId) : apiSimuladoDatesByTitle.get(normalizeCourseIndexKey(title));
          }
        }
        const dateStr = dateInfo?.attemptDate || dateInfo?.releaseDate || dateInfo?.anyDate || getTodaySessionDate();
        const dateSource = dateInfo?.attemptDate ? "attempt" : dateInfo?.releaseDate ? "release" : dateInfo?.anyDate ? "api_date" : "import";
        const dataSource = apiEnjoy || apiMatchById || dateSource !== "import" ? "api+dom" : "dom";
        console.log("📊 [QG Simulado] Extraído:", { examId, dateStr, dateSource, dataSource, estimated: estimatedReasons.length > 0 });
        const caveiraId = examId ? `sim_${examId}` : `sim_title_${normalizeCourseIndexKey(title).slice(0, 48)}`;
        results.push({
          caveiraId,
          title: title.slice(0, 100),
          data: dateStr,
          dateSource,
          dataSource,
          estimated: estimatedReasons.length > 0,
          ...estimatedReasons.length > 0 ? { estimatedReason: estimatedReasons.join("; ") } : {},
          ...dateInfo?.dateField ? { dateField: dateInfo.dateField } : {},
          ...dateInfo?.releaseDate ? { releasedAt: dateInfo.releaseDate } : {},
          ...total !== null ? { total } : {},
          ...hits !== null ? { hits } : {},
          ...errors !== null ? { errors } : {},
          ...blank !== null ? { blank } : {},
          ...canceled ? { canceled } : {},
          pct,
          liquida,
          ...blockStats,
          ...subjectScores.length > 0 ? { subjectScores } : {},
          url: window.location.href
        });
      }
      let domItemsSeen = 0;
      if (results.length === 0) {
        const isPersonalPage = window.location.pathname.includes("/personal-practice-exams");
        const teamIdMatch = window.location.pathname.match(/\/teams\/(\d+)/i);
        const teamId = teamIdMatch?.[1] || "";
        if (teamId && apiSimuladoDatesByTitle.size === 0) {
          await requestSimuladoDatesFromSniffer(teamId, "", 2600);
        }
        const simItems = Array.from(document.querySelectorAll(".simulated-item")).filter((el) => !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud, .ranking-table-wrap, .larger, table") && isElementVisible(el));
        domItemsSeen = simItems.length;
        simItems.forEach((item) => {
          const numEl = item.querySelector(".subtitle--number");
          const pctEl = item.querySelector(".subtitle--percent");
          if (!numEl || !pctEl) return;
          const titleEl = item.querySelector(".simulated--title");
          const rawTitle = titleEl?.getAttribute("title") || titleEl?.innerText || titleEl?.textContent || "";
          const title = String(rawTitle).replace(/●\s*\d+\s*quest[oõ]es/gi, "").replace(/\s+/g, " ").trim().slice(0, 100);
          if (!title || isRankingTitleOrRow("", title, false)) return;
          const numTxt = (numEl.textContent || "").trim();
          const numMatch = numTxt.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
          const pctTxt = (pctEl.textContent || "").trim();
          const pctMatch = pctTxt.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
          if (!numMatch || !pctMatch) return;
          const domHits = Math.round(parseFloat(numMatch[1].replace(",", ".")));
          const domTotal = Math.round(parseFloat(numMatch[2].replace(",", ".")));
          if (!domTotal || domHits > domTotal) return;
          const domPct = Math.round(parseFloat(pctMatch[1].replace(",", ".")));
          const grossPct = Math.round(domHits / domTotal * 100);
          const titleNorm = normalizeCourseIndexKey(title);
          if (seen.has(titleNorm)) return;
          seen.add(titleNorm);
          const apiMatch = apiSimuladosCache.find((s) => s && normalizeCourseIndexKey(s.title || "") === titleNorm);
          const hits = apiMatch?.hits ?? domHits;
          const total = apiMatch?.total ?? domTotal;
          const pct = apiMatch?.pct ?? domPct;
          const domEstimatedReasons = [];
          let liquida = apiMatch?.liquida;
          let errors = apiMatch?.errors;
          let blank = apiMatch?.blank ?? 0;
          if (liquida === void 0 || errors === void 0) {
            if (!isPersonalPage && domPct < grossPct - 1) {
              liquida = Math.round(domPct / 100 * domTotal);
              errors = Math.max(0, domHits - liquida);
              blank = Math.max(0, domTotal - domHits - errors);
              domEstimatedReasons.push("líquida/erros calculados a partir de % exibida e acertos brutos");
            } else {
              errors = Math.max(0, domTotal - domHits);
              liquida = domHits - errors;
              domEstimatedReasons.push("erros inferidos de total - acertos");
            }
          }
          const subText = (item.querySelector(".simulated--subtitle")?.innerText || item.innerText || "").trim();
          const dateMatch = subText.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/) || subText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
          const domDate = dateMatch ? dateMatch[3] ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : dateMatch[1] : null;
          const batchDateMatch = apiSimuladoDatesByTitle.get(titleNorm) || (apiMatch?.caveiraId ? apiSimuladoDatesByExamId.get(String(apiMatch.caveiraId).replace(/^sim_/, "")) : null);
          const apiDate = batchDateMatch?.attemptDate || batchDateMatch?.releaseDate || batchDateMatch?.anyDate || apiMatch?.data || null;
          const apiSource = batchDateMatch?.attemptDate ? "attempt" : batchDateMatch?.releaseDate ? "release" : batchDateMatch?.anyDate ? "api_date" : apiMatch?.dateSource || null;
          const resolvedDate = apiDate || domDate || getTodaySessionDate();
          const dateSource = apiSource || (isPersonalPage && domDate ? "created" : "import");
          const isEst = Boolean(apiMatch?.estimated || domEstimatedReasons.length > 0);
          const estReason = [apiMatch?.estimatedReason, ...domEstimatedReasons].filter(Boolean).join("; ");
          results.push({
            caveiraId: apiMatch?.caveiraId || `sim_title_${titleNorm.slice(0, 48)}`,
            title,
            data: resolvedDate,
            dateSource,
            dataSource: apiMatch ? "api+dom" : "dom",
            estimated: isEst,
            ...estReason ? { estimatedReason: estReason } : {},
            ...batchDateMatch?.dateField || apiMatch?.dateField ? { dateField: batchDateMatch?.dateField || apiMatch?.dateField } : {},
            ...batchDateMatch?.releaseDate || apiMatch?.releasedAt ? { releasedAt: batchDateMatch?.releaseDate || apiMatch?.releasedAt } : {},
            total,
            hits,
            errors,
            blank,
            pct,
            liquida,
            ...apiMatch?.b1Liquida !== void 0 ? { b1C: apiMatch.b1C, b1E: apiMatch.b1E, b1Liquida: apiMatch.b1Liquida, b2C: apiMatch.b2C, b2E: apiMatch.b2E, b2Liquida: apiMatch.b2Liquida, b3C: apiMatch.b3C, b3E: apiMatch.b3E, b3Liquida: apiMatch.b3Liquida } : {},
            ...Array.isArray(apiMatch?.subjectScores) && apiMatch.subjectScores.length > 0 ? { subjectScores: apiMatch.subjectScores } : {}
          });
        });
      }
      if (results.length === 0) {
        apiSimuladosCache.forEach((sim) => {
          if (!sim || isRankingTitleOrRow("", sim.title || "", false)) return;
          const titleNorm = normalizeCourseIndexKey(sim.title || "");
          if (!titleNorm || seen.has(titleNorm)) return;
          seen.add(titleNorm);
          results.push({ ...sim, dataSource: sim.dataSource || "api" });
        });
      }
      if (results.length > 0) {
        try {
          await new Promise((resolve) => {
            chrome.storage.local.get([PENDING_SIMULADOS_QUEUE_KEY], (qRes) => {
              if (chrome.runtime?.lastError || isDestroyed) {
                resolve();
                return;
              }
              const nextQueue = enqueueSimuladosIntoQueue(qRes?.[PENDING_SIMULADOS_QUEUE_KEY], results);
              chrome.storage.local.set({ [PENDING_SIMULADOS_QUEUE_KEY]: nextQueue }, () => {
                chrome.storage.local.remove([PENDING_SIMULADOS_KEY]).catch(() => {
                });
                updateSimuladoImportStatusHud(nextQueue);
                flushPendingQgEvents();
                resolve();
              });
            });
          });
        } catch (_) {
        }
        return { count: results.length, reason: "ok" };
      }
      const reason = domItemsSeen > 0 ? "Simulados visíveis ainda não respondidos (sem nota) e sem dados da API" : "Sem dados da API e seletores da tela (.box-use / .simulated-item) não encontrados";
      return { count: 0, reason };
    }
    function startPdfTimerLoop() {
      if (pdfTimerInterval) return;
      pdfTimerInterval = setInterval(() => {
        if (isDestroyed) return;
        if (isPdfSummariesPage() && !document.hidden) {
          pdfReadingSeconds += 1;
          const timerEl = getHudEl("qg-pdf-timer-text");
          if (timerEl) {
            const m = Math.floor(pdfReadingSeconds / 60);
            const s = pdfReadingSeconds % 60;
            timerEl.textContent = `📄 Lendo PDF • ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
          }
        }
      }, 1e3);
    }
    function updateContextualHud() {
      const ctxBox = getHudEl("qg-hud-contextual-actions");
      if (!ctxBox) return;
      const missionRow = getHudEl("qg-ctx-today-mission");
      const catalogRow = getHudEl("qg-ctx-course-catalog");
      const simRow = getHudEl("qg-ctx-simulados");
      const pdfRow = getHudEl("qg-ctx-pdf-tracker");
      let anyVisible = false;
      if (missionRow) {
        const subjects = Array.isArray(cachedTodayMission?.subjects) ? cachedTodayMission.subjects : [];
        const isHomeOrDashboard = /^\/(?:home|dashboard)(?:\/|$)/i.test(window.location.pathname || "");
        if ((isQuestionsPage() || isHomeOrDashboard) && subjects.length > 0) {
          const pending = subjects.filter((s) => !s.completed);
          const list = pending.length > 0 ? pending : subjects;
          const picked = list[todayMissionIdx % list.length];
          const btn = getHudEl("qg-btn-today-mission");
          if (btn && picked) {
            btn.textContent = `⚡ Missão: ${picked.name}`;
            btn.title = picked.topic ? `${picked.name} → ${picked.topic}` : picked.name;
          }
          const nextBtn = getHudEl("qg-btn-today-next");
          if (nextBtn) nextBtn.style.display = list.length > 1 ? "inline-flex" : "none";
          missionRow.style.display = "flex";
          anyVisible = true;
        } else {
          missionRow.style.display = "none";
        }
      }
      if (catalogRow) {
        if (isCourseCatalogPage()) {
          catalogRow.style.display = "flex";
          anyVisible = true;
        } else {
          catalogRow.style.display = "none";
        }
      }
      if (simRow) {
        if (isSimuladosPage()) {
          simRow.style.display = "flex";
          anyVisible = true;
        } else {
          simRow.style.display = "none";
        }
      }
      if (pdfRow) {
        if (isPdfSummariesPage()) {
          startPdfTimerLoop();
          pdfRow.style.display = "flex";
          anyVisible = true;
        } else {
          pdfRow.style.display = "none";
        }
      }
      ctxBox.style.display = anyVisible ? "flex" : "none";
    }
    function createHud() {
      if (getHudEl("qg-caveira-hud")) return;
      const extVersion = typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest().version : "3.0.0";
      const hudInnerHtml = `
      <div class="qg-hud-header">
        <div class="qg-hud-title">
          <span class="qg-hud-pulse"></span>
          <span>💀 QG PRF • CAVEIRA <small style="opacity:0.65;font-size:9px;margin-left:3px;">v${extVersion}</small></span>
        </div>
        <div class="qg-hud-controls">
          <button type="button" class="qg-hud-btn-icon" id="qg-btn-toggle-search" title="Busca Offline (IndexedDB + MiniSearch)">🔍</button>
          <button type="button" class="qg-hud-btn-icon" id="qg-btn-min" title="Minimizar / Expandir">_</button>
        </div>
      </div>

      <div id="qg-hud-user-bar" style="display:flex;align-items:center;justify-content:space-between;padding:5px 14px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;font-weight:700;color:#94a3b8;">
        <span id="qg-hud-user-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🟡 Conecte sua conta no QG</span>
      </div>

      <div id="qg-hud-filter-banner" style="display:none;align-items:center;justify-content:space-between;gap:6px;padding:6px 14px;background:rgba(37,99,235,0.14);border-bottom:1px solid rgba(59,130,246,0.3);font-size:10px;font-weight:700;color:#bfdbfe;">
        <span id="qg-hud-filter-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">🎯 Filtro</span>
        <button type="button" id="qg-btn-copy-filter-log" style="background:rgba(15,23,42,0.85);color:#cbd5e1;border:1px solid rgba(148,163,184,0.35);border-radius:6px;padding:2px 6px;font-size:9px;font-weight:800;cursor:pointer;flex-shrink:0;" title="Copiar log diagnóstico do último filtro">📋 Log</button>
        <button type="button" id="qg-btn-refilter" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:2px 6px;font-size:9px;font-weight:800;cursor:pointer;flex-shrink:0;" title="Aplicar filtro novamente">🔄</button>
        <button type="button" id="qg-btn-close-filter" style="background:none;color:#94a3b8;border:none;font-size:11px;cursor:pointer;padding:0 2px;flex-shrink:0;" title="Fechar aviso">✕</button>
      </div>

      <div id="qg-hud-resolver-box" style="display:none;flex-direction:column;gap:6px;padding:8px 14px;background:rgba(245,158,11,0.12);border-bottom:1px solid rgba(245,158,11,0.35);font-size:10px;color:#fde68a;">
        <div id="qg-hud-resolver-title" style="font-weight:800;line-height:1.3;">⚠️ Selecione o assunto correto:</div>
        <div id="qg-hud-resolver-list" style="display:flex;flex-direction:column;gap:4px;max-height:150px;overflow-y:auto;"></div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
          <button type="button" id="qg-btn-apply-alt" style="background:#10b981;color:#052e16;border:none;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:800;cursor:pointer;flex:1;">Filtrar</button>
          <button type="button" id="qg-btn-legacy-dom" style="background:rgba(15,23,42,0.85);color:#cbd5e1;border:1px solid rgba(148,163,184,0.35);border-radius:6px;padding:4px 8px;font-size:9px;font-weight:700;cursor:pointer;" title="Usar preenchimento antigo via dropdown">Tentar modo antigo</button>
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
            <span class="qg-hud-stat-value gold" id="qg-stat-net">${sessionStats.total > 0 ? Math.round(sessionStats.hits / sessionStats.total * 100) : 0}%</span>
          </div>
        </div>

        <div class="qg-hud-goal-box" style="margin-top: 7px; margin-bottom: 7px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 5px 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 3px;">
            <span style="color: #94a3b8; display: flex; align-items: center; gap: 3px;">🎯 <span>Meta Diária</span></span>
            <span id="qg-hud-goal-ratio" style="color: #38bdf8;">${sessionStats.total} / ${cachedDailyGoal} (${Math.min(100, Math.round(sessionStats.total / cachedDailyGoal * 100))}%)</span>
          </div>
          <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
            <div id="qg-hud-goal-bar" style="width: ${Math.min(100, Math.round(sessionStats.total / cachedDailyGoal * 100))}%; height: 100%; background: linear-gradient(90deg, #0284c7, #10b981); border-radius: 999px; transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div class="qg-hud-current">
          <span id="qg-current-q-id">Aguardando questão...</span>
          <span class="qg-hud-timer" id="qg-timer">00:00</span>
        </div>

        <div id="qg-hud-mission-box" style="display:none;flex-direction:column;gap:5px;margin-top:8px;padding:7px 9px;border-radius:8px;background:rgba(14,165,233,0.12);border:1px solid rgba(56,189,248,0.35);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
            <span id="qg-mission-title" style="font-size:10px;font-weight:900;color:#e0f2fe;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🎯 Missão Ativa</span>
            <span id="qg-mission-counter" style="font-size:10px;font-weight:900;color:#38bdf8;font-family:monospace;flex-shrink:0;">0/10</span>
          </div>
          <div id="qg-mission-subtitle" style="font-size:9px;font-weight:700;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
          <div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden;">
            <div id="qg-mission-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#0ea5e9,#10b981);border-radius:999px;transition:width 0.25s ease;"></div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;">
            <span id="qg-mission-score" style="font-size:9px;font-weight:800;color:#cbd5e1;">0C / 0E</span>
            <div style="display:flex;align-items:center;gap:4px;">
              <button type="button" id="qg-btn-mission-expand" style="display:none;background:rgba(245,158,11,0.18);color:#fcd34d;border:1px solid rgba(245,158,11,0.4);border-radius:5px;padding:2px 6px;font-size:8.5px;font-weight:800;cursor:pointer;" title="Incluir nível vizinho se faltarem questões">+ Nível vizinho</button>
              <a id="qg-btn-mission-qg" href="${QG_WEB_URL}" target="_blank" style="display:none;background:#10b981;color:#052e16;border:none;border-radius:5px;padding:2px 7px;font-size:8.5px;font-weight:900;text-decoration:none;cursor:pointer;">Abrir QG</a>
              <button type="button" id="qg-btn-mission-dismiss" style="background:rgba(255,255,255,0.08);color:#a1a1aa;border:1px solid rgba(255,255,255,0.14);border-radius:5px;padding:2px 5px;font-size:8.5px;font-weight:800;cursor:pointer;" title="Fechar missão">✕</button>
            </div>
          </div>
        </div>

        <div id="qg-hud-course-actions" style="display:none;flex-direction:column;gap:5px;margin-top:8px;">
          <span id="qg-hud-speed-badge" style="display:none;align-self:flex-start;background:rgba(14,165,233,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.35);border-radius:6px;padding:2px 7px;font-size:9px;font-weight:900;text-transform:uppercase;">⚡ 1.5x</span>
          <div id="qg-hud-course-completed-banner" style="display:none;flex-direction:column;gap:5px;padding:7px 9px;border-radius:8px;background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.45);font-size:10px;font-weight:800;color:#6ee7b7;">
            <span>🎉 Aula concluída detectada!</span>
            <button type="button" id="qg-btn-banner-complete" style="width:100%;background:#10b981;color:#052e16;border:none;border-radius:6px;padding:5px 8px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">✅ Registrar Aula no QG Agora</button>
          </div>
          <div id="qg-hud-course-diff-bar" style="display:flex;flex-wrap:wrap;gap:3px;align-items:center;">
            <button type="button" class="qg-course-diff-pill active" data-diff="" style="font-size:9px;font-weight:800;padding:3px 6px;border-radius:5px;border:1px solid rgba(56,189,248,0.45);background:rgba(14,165,233,0.22);color:#e0f2fe;cursor:pointer;">Todas</button>
            <button type="button" class="qg-course-diff-pill" data-diff="2" title="80–100% acertos" style="font-size:9px;font-weight:800;padding:3px 5px;border-radius:5px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#a1a1aa;cursor:pointer;">M.Fácil</button>
            <button type="button" class="qg-course-diff-pill" data-diff="3" title="60–79% acertos" style="font-size:9px;font-weight:800;padding:3px 5px;border-radius:5px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#a1a1aa;cursor:pointer;">Fácil</button>
            <button type="button" class="qg-course-diff-pill" data-diff="4" title="40–59% acertos" style="font-size:9px;font-weight:800;padding:3px 5px;border-radius:5px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#a1a1aa;cursor:pointer;">Médio</button>
            <button type="button" class="qg-course-diff-pill" data-diff="5" title="20–39% acertos" style="font-size:9px;font-weight:800;padding:3px 5px;border-radius:5px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#a1a1aa;cursor:pointer;">Difícil</button>
            <button type="button" class="qg-course-diff-pill" data-diff="6" title="< 20% acertos" style="font-size:9px;font-weight:800;padding:3px 5px;border-radius:5px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:#a1a1aa;cursor:pointer;">M.Difícil</button>
          </div>
          <button type="button" id="qg-btn-course-practice" style="width:100%;background:linear-gradient(90deg,#0284c7,#2563eb);color:#fff;border:none;border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(2,132,199,0.3);">
            <span>🎯 Resolver Questões desta Aula</span>
          </button>
          <button type="button" id="qg-btn-course-complete" style="width:100%;background:rgba(16,185,129,0.14);color:#6ee7b7;border:1px solid rgba(16,185,129,0.35);border-radius:8px;padding:6px 10px;font-size:10px;font-weight:800;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
            <span>✅ Marcar Aula Assistida no QG</span>
          </button>
        </div>

        <div id="qg-hud-contextual-actions" style="display:none;flex-direction:column;gap:5px;margin-top:8px;">
          <div id="qg-ctx-today-mission" style="display:none;gap:4px;align-items:center;">
            <button type="button" id="qg-btn-today-mission" style="flex:1;background:linear-gradient(90deg,#0ea5e9,#0284c7);color:#fff;border:none;border-radius:8px;padding:6px 9px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">⚡ Missão de Hoje</button>
            <button type="button" id="qg-btn-today-next" style="background:rgba(14,165,233,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.35);border-radius:8px;padding:6px 8px;font-size:10px;font-weight:900;cursor:pointer;" title="Próxima matéria de hoje">↻</button>
          </div>
          <div id="qg-ctx-course-catalog" style="display:none;">
            <button type="button" id="qg-btn-sync-catalog" style="width:100%;background:rgba(14,165,233,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.4);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">🔄 Sincronizar Curso com QG</button>
          </div>
          <div id="qg-ctx-simulados" style="display:none;flex-direction:column;gap:4px;">
            <button type="button" id="qg-btn-import-simulados" style="width:100%;background:rgba(168,85,247,0.2);color:#e9d5ff;border:1px solid rgba(168,85,247,0.45);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">📊 Importar Simulados para o QG</button>
            <span id="qg-sim-delivery-status" style="display:none;font-size:9px;font-weight:700;padding:1px 4px;line-height:1.25;"></span>
          </div>
          <div id="qg-ctx-pdf-tracker" style="display:none;flex-direction:column;gap:4px;padding:7px 9px;border-radius:8px;background:rgba(20,184,166,0.12);border:1px solid rgba(20,184,166,0.35);">
            <span id="qg-pdf-timer-text" style="font-size:10px;font-weight:800;color:#5eead4;">📄 Lendo PDF • 00:00</span>
            <button type="button" id="qg-btn-log-pdf" style="width:100%;background:#14b8a6;color:#042f2e;border:none;border-radius:6px;padding:5px 8px;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">✅ Registrar Estudo por PDF no QG</button>
          </div>
        </div>

        <div id="qg-hud-search-drawer" class="qg-offline-search-box" style="display: none;">
          <input type="search" id="qg-hud-search-input" class="qg-offline-search-input" placeholder="Buscar no banco integral (enunciado, bizu, lei)..." />
          <div id="qg-hud-search-results" class="qg-offline-search-results"></div>
        </div>

        <div id="qg-hud-history-box" style="display: none;"></div>
      </div>

      <div class="qg-hud-prompt" id="qg-prompt-box" style="display: none;">
        <div class="qg-prompt-title">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span id="qg-prompt-status-badge" class="qg-prompt-badge hit">ACERTO</span>
            <span>Autoavaliação Tática</span>
          </div>
          <button type="button" id="qg-prompt-close" style="background: none; border: none; color: #94a3b8; font-size: 13px; cursor: pointer; padding: 2px 6px; border-radius: 4px;">✕</button>
        </div>

        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 4px; font-weight: 700;">CONFIANÇA (Dúvida/Chute vai p/ FSRS):</div>
        <div class="qg-prompt-buttons">
          <button class="qg-btn-tag" data-confidence="sabia">🎯 Sabia</button>
          <button class="qg-btn-tag" data-confidence="duvida" title="Envia para a fila de Revisão FSRS mesmo acertando">🤔 Dúvida</button>
          <button class="qg-btn-tag" data-confidence="chute" title="Envia para a fila de Revisão FSRS mesmo acertando">🎲 Chute</button>
          <button class="qg-btn-tag" id="qg-btn-priority" data-priority="true" title="Marcar para revisão urgente no FSRS do QG">🔥 Prioridade</button>
        </div>

        <div id="qg-error-reasons" style="display: none;">
          <div style="font-size: 10px; color: #ef4444; margin-bottom: 4px; font-weight: 700;">AUTÓPSIA DO ERRO:</div>
          <div class="qg-prompt-buttons">
            <button class="qg-btn-tag" data-reason="leitura">👀 Leitura</button>
            <button class="qg-btn-tag" data-reason="decoreba">🧠 Decoreba</button>
            <button class="qg-btn-tag" data-reason="pegadinha">🪤 Pegadinha</button>
            <button class="qg-btn-tag" data-reason="base">📚 Falta de base</button>
            <button class="qg-btn-tag" data-reason="cansaco">😵 Cansaço</button>
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
      const mounted = mountShadowHud(hudInnerHtml);
      if (!mounted || !mounted.created || !mounted.hud) return;
      const hud = mounted.hud;
      updateHudUser();
      updateHudStats();
      updateHudMission();
      renderFilterBanner();
      hud.querySelector("#qg-btn-mission-expand")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!activePracticeMission || activePracticeMission.status !== "active") return;
        const baseId = Number(activePracticeMission.baseDifficultyId) || 2;
        const cur = Array.isArray(activePracticeMission.activeDifficultyIds) ? activePracticeMission.activeDifficultyIds.map(Number).filter((n) => n >= 2 && n <= 6) : [baseId];
        const active = cur.length > 0 ? [...cur] : [baseId];
        const candidates = baseId === 2 ? [2, 3, 4, 5, 6] : baseId === 6 ? [6, 5, 4, 3, 2] : [baseId - 1, baseId + 1, baseId - 2, baseId + 2, 2, 3, 4, 5, 6].filter((n) => n >= 2 && n <= 6);
        for (const c of candidates) {
          if (!active.includes(c)) {
            active.push(c);
            break;
          }
        }
        const expanded = Array.from(new Set(active)).sort((a, b) => a - b);
        activePracticeMission = {
          ...activePracticeMission,
          activeDifficultyIds: expanded,
          updatedAt: Date.now()
        };
        try {
          if (isExtensionContextValid() && chrome?.storage?.local) {
            chrome.storage.local.set({ [ACTIVE_MISSION_KEY]: activePracticeMission });
          }
        } catch (_) {
        }
        updateHudMission();
        applyCaveiraPracticeFilter({
          subject: activePracticeMission.subjectName || "",
          topic: activePracticeMission.subtopics && activePracticeMission.subtopics.length > 0 ? activePracticeMission.subtopics.slice(0, 3).join(" • ") : (activePracticeMission.lessonNames || []).join(" • ") || activePracticeMission.topicName || "",
          fallbackTopic: activePracticeMission.topicName || "",
          lessons: activePracticeMission.lessonNames || [],
          subtopics: activePracticeMission.subtopics || [],
          rawIndexText: activePracticeMission.rawIndexText || "",
          status: "not_resolved",
          difficultyIds: expanded
        });
      });
      hud.querySelector("#qg-btn-mission-dismiss")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const dismissedId = activePracticeMission?.id ? String(activePracticeMission.id) : null;
        activePracticeMission = null;
        try {
          if (isExtensionContextValid() && chrome?.storage?.local) {
            if (dismissedId) {
              chrome.storage.local.get([DISMISSED_MISSIONS_KEY], (res) => {
                if (chrome.runtime?.lastError || isDestroyed) return;
                const nowMs = Date.now();
                const prevList = Array.isArray(res?.[DISMISSED_MISSIONS_KEY]) ? res[DISMISSED_MISSIONS_KEY] : [];
                const nextList = [
                  { id: dismissedId, at: nowMs },
                  ...prevList.filter((d) => d && d.id && String(d.id) !== dismissedId && nowMs - (Number(d.at) || 0) < 6e5)
                ].slice(0, 20);
                chrome.storage.local.set({ [DISMISSED_MISSIONS_KEY]: nextList }, () => {
                  chrome.storage.local.remove([ACTIVE_MISSION_KEY]);
                });
              });
            } else {
              chrome.storage.local.remove([ACTIVE_MISSION_KEY]);
            }
          }
        } catch (_) {
        }
        updateHudMission();
      });
      const handleOpenOrFocusQg = (e) => {
        if (!isExtensionContextValid() || !chrome?.runtime?.sendMessage) return;
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({
          type: "OPEN_OR_FOCUS_QG",
          payload: { url: QG_WEB_URL }
        }).catch(() => {
          window.open(QG_WEB_URL, "_blank");
        });
      };
      hud.querySelector("#qg-open-link")?.addEventListener("click", handleOpenOrFocusQg);
      hud.querySelector("#qg-btn-mission-qg")?.addEventListener("click", handleOpenOrFocusQg);
      hud.querySelector("#qg-btn-copy-filter-log")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const payload = lastFilterDiagnosticLog ? JSON.stringify(lastFilterDiagnosticLog, null, 2) : JSON.stringify({ message: "Nenhum filtro executado ainda nesta aba.", activePracticeFilter }, null, 2);
        let copied = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(payload);
            copied = true;
          }
        } catch (_) {
        }
        if (!copied) {
          try {
            const ta = document.createElement("textarea");
            ta.value = payload;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            copied = document.execCommand("copy");
            ta.remove();
          } catch (_) {
          }
        }
        if (btn) {
          const prev = btn.textContent;
          btn.textContent = copied ? "✅ Copiado" : "⚠️ Erro";
          setTimeout(() => {
            if (btn && btn.isConnected) btn.textContent = prev || "📋 Log";
          }, 1800);
        }
      });
      hud.querySelector("#qg-btn-refilter")?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activePracticeFilter) applyCaveiraPracticeFilter(activePracticeFilter);
      });
      hud.querySelector("#qg-btn-close-filter")?.addEventListener("click", (e) => {
        e.stopPropagation();
        activePracticeFilter = null;
        pendingResolverResult = null;
        filterStatusMessage = "";
        renderFilterBanner("");
        const box = hud.querySelector("#qg-hud-resolver-box");
        if (box) box.style.display = "none";
      });
      hud.querySelector("#qg-btn-apply-alt")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const box = hud.querySelector("#qg-hud-resolver-box");
        if (!box || !pendingResolverResult) return;
        const checked = Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => Number(cb.getAttribute("data-subtopic-id"))).filter((n) => Number.isFinite(n) && n > 0);
        if (checked.length === 0) return;
        const subjId = pendingResolverResult.subject?.id || Number(box.querySelector('input[type="checkbox"]:checked')?.getAttribute("data-subject-id"));
        if (!subjId) return;
        const selectedAlts = (pendingResolverResult.alternatives || []).filter((a) => checked.includes(a.id));
        const picks = selectedAlts.map((a) => ({ id: a.id, name: a.name, path: a.path || [a.name] }));
        if (activePracticeFilter) {
          saveFilterIdMemory(activePracticeFilter, {
            subjectId: subjId,
            subjectName: pendingResolverResult.subject?.name || activePracticeFilter.subject || "",
            ids: checked,
            picks
          });
        }
        if (lastFilterDiagnosticLog) {
          lastFilterDiagnosticLog.manualSelection = { subjectId: subjId, ids: checked, picks };
          lastFilterDiagnosticLog.ids = checked;
          lastFilterDiagnosticLog.picks = picks;
        }
        box.style.display = "none";
        lastResolverProposed = { subjectId: subjId, ids: checked };
        const summary = [pendingResolverResult.subject?.name || activePracticeFilter?.subject, activePracticeFilter?.topic].filter(Boolean).join(" • ");
        await navigateToCaveiraDeepLink(subjId, checked, `✅ Filtro aplicado (seleção manual): ${summary}`);
      });
      hud.querySelector("#qg-btn-legacy-dom")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const box = hud.querySelector("#qg-hud-resolver-box");
        if (box) box.style.display = "none";
        if (activePracticeFilter) {
          applyCaveiraPracticeFilterLegacyDom(activePracticeFilter);
        }
      });
      const diffAccentStyles = {
        "": { border: "rgba(56,189,248,0.55)", bg: "rgba(14,165,233,0.24)", color: "#e0f2fe" },
        "2": { border: "rgba(16,185,129,0.55)", bg: "rgba(16,185,129,0.22)", color: "#a7f3d0" },
        "3": { border: "rgba(56,189,248,0.55)", bg: "rgba(14,165,233,0.22)", color: "#bae6fd" },
        "4": { border: "rgba(245,158,11,0.55)", bg: "rgba(245,158,11,0.22)", color: "#fde68a" },
        "5": { border: "rgba(249,115,22,0.55)", bg: "rgba(249,115,22,0.22)", color: "#fed7aa" },
        "6": { border: "rgba(244,63,94,0.55)", bg: "rgba(244,63,94,0.22)", color: "#fecdd3" }
      };
      const renderCourseDiffBar = () => {
        const bar = hud.querySelector("#qg-hud-course-diff-bar");
        if (!bar) return;
        const pills = bar.querySelectorAll(".qg-course-diff-pill");
        pills.forEach((pill) => {
          const val = pill.getAttribute("data-diff") || "";
          const isActive = val === "" ? hudCourseDifficultyIds.length === 0 : hudCourseDifficultyIds.includes(Number(val));
          pill.classList.toggle("active", isActive);
          if (isActive) {
            const st = diffAccentStyles[val] || diffAccentStyles[""];
            pill.style.borderColor = st.border;
            pill.style.background = st.bg;
            pill.style.color = st.color;
          } else {
            pill.style.borderColor = "rgba(255,255,255,0.12)";
            pill.style.background = "rgba(255,255,255,0.04)";
            pill.style.color = "#a1a1aa";
          }
        });
      };
      renderHudCourseDiffBarRef = renderCourseDiffBar;
      try {
        if (isExtensionContextValid() && chrome?.storage?.local) {
          chrome.storage.local.get([HUD_COURSE_DIFF_KEY, DEFAULT_PREFS_KEY], (res) => {
            if (chrome.runtime?.lastError || isDestroyed) return;
            const rawDiffs = Array.isArray(res?.[HUD_COURSE_DIFF_KEY]) ? res[HUD_COURSE_DIFF_KEY] : res?.[DEFAULT_PREFS_KEY]?.difficultyIds;
            const savedDiffs = Array.isArray(rawDiffs) ? Array.from(new Set(rawDiffs.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 6))).sort((a, b) => a - b) : [];
            hudCourseDifficultyIds = savedDiffs;
            renderCourseDiffBar();
          });
        }
      } catch (_) {
      }
      hud.querySelector("#qg-hud-course-diff-bar")?.addEventListener("click", (e) => {
        const pill = e.target?.closest?.(".qg-course-diff-pill");
        if (!pill) return;
        e.stopPropagation();
        const raw = pill.getAttribute("data-diff") || "";
        if (!raw) {
          hudCourseDifficultyIds = [];
        } else {
          const num = Number(raw);
          if (hudCourseDifficultyIds.includes(num)) {
            hudCourseDifficultyIds = hudCourseDifficultyIds.filter((id) => id !== num);
          } else {
            hudCourseDifficultyIds = [...hudCourseDifficultyIds, num].sort((a, b) => a - b);
          }
        }
        renderCourseDiffBar();
        try {
          if (isExtensionContextValid() && chrome?.storage?.local) {
            chrome.storage.local.set({ [HUD_COURSE_DIFF_KEY]: hudCourseDifficultyIds });
          }
        } catch (_) {
        }
      });
      hud.querySelector("#qg-btn-course-practice")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        let liveTitle = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || "";
        const isMatchingStatus = (st, title) => Boolean(
          st && title && normalizeCourseIndexKey(st.lessonTitle || "") === normalizeCourseIndexKey(title)
        );
        if (liveTitle && !isMatchingStatus(currentCourseIndexStatus, liveTitle)) {
          try {
            scanCourseVideoIndex();
          } catch (_) {
          }
          liveTitle = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || liveTitle;
        }
        const statusMatchesLive = !liveTitle || isMatchingStatus(currentCourseIndexStatus, liveTitle);
        const lessonTitle = liveTitle || currentCourseIndexStatus?.lessonTitle || "";
        if (!lessonTitle) return;
        const subtopics = statusMatchesLive && Array.isArray(currentCourseIndexStatus?.subtopics) ? currentCourseIndexStatus.subtopics : [];
        const rawIndexText = statusMatchesLive ? currentCourseIndexStatus?.rawIndexText || "" : "";
        const inferredSubject = extractCourseSubjectFromPage(lessonTitle);
        const topicValue = lastOpenedCourseContext?.topic && normalizeCourseIndexKey(lastOpenedCourseContext.lesson) === normalizeCourseIndexKey(lessonTitle) ? lastOpenedCourseContext.topic : lessonTitle;
        const filterData = {
          subject: inferredSubject,
          topic: topicValue,
          lessons: lessonTitle ? [lessonTitle] : [],
          fallbackTopic: topicValue,
          subtopics,
          rawIndexText,
          difficultyIds: [...hudCourseDifficultyIds],
          createdAt: Date.now()
        };
        const origHtml = btn ? btn.innerHTML : "";
        if (btn) btn.innerHTML = "<span>⏳ Abrindo questões...</span>";
        const restoreBtn = () => {
          if (btn && btn.isConnected && origHtml) {
            setTimeout(() => {
              if (btn && btn.isConnected) btn.innerHTML = origHtml;
            }, 2200);
          }
        };
        const openQuestionsFallback = () => {
          try {
            if (isExtensionContextValid() && chrome?.storage?.local) {
              chrome.storage.local.set({ [PENDING_FILTER_KEY]: filterData }, () => {
                window.open(`${window.location.origin}/questions`, "_blank");
              });
            } else {
              window.open(`${window.location.origin}/questions`, "_blank");
            }
            if (btn && btn.isConnected) btn.innerHTML = "<span>✓ Filtro enviado!</span>";
          } catch (_) {
          }
          restoreBtn();
        };
        try {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: "OPEN_CAVEIRA_PRACTICE",
              payload: filterData
            }).then((resp) => {
              if (!resp || !resp.success) {
                openQuestionsFallback();
                return;
              }
              if (btn && btn.isConnected) btn.innerHTML = "<span>✓ Filtro enviado!</span>";
              restoreBtn();
            }).catch(() => {
              openQuestionsFallback();
            });
          } else {
            openQuestionsFallback();
          }
        } catch (_) {
          openQuestionsFallback();
        }
      });
      hud.querySelector("#qg-btn-course-complete")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        let liveTitle = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || "";
        const isMatchingStatus = (st, title) => Boolean(
          st && title && normalizeCourseIndexKey(st.lessonTitle || "") === normalizeCourseIndexKey(title)
        );
        if (liveTitle && !isMatchingStatus(currentCourseIndexStatus, liveTitle)) {
          try {
            scanCourseVideoIndex();
          } catch (_) {
          }
          liveTitle = extractPlayingVideoTitleFromHeader() || extractCourseLessonTitle() || liveTitle;
        }
        const statusMatchesLive = !liveTitle || isMatchingStatus(currentCourseIndexStatus, liveTitle);
        const lessonTitle = liveTitle || currentCourseIndexStatus?.lessonTitle || "";
        const subtopics = statusMatchesLive && Array.isArray(currentCourseIndexStatus?.subtopics) ? currentCourseIndexStatus.subtopics : [];
        const rawIndexText = statusMatchesLive ? currentCourseIndexStatus?.rawIndexText || "" : "";
        const inferredSubject = extractCourseSubjectFromPage(lessonTitle);
        const payload = {
          subject: inferredSubject,
          lessonTitle,
          subtopics,
          rawIndexText,
          url: window.location.href,
          requestedAt: Date.now()
        };
        try {
          chrome.storage.local.set({ qg_pending_course_completion: payload }, () => {
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: "OPEN_QG_LESSON_COMPLETE",
                payload
              }).catch(() => {
              });
            }
          });
        } catch (_) {
        }
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = "<span>✓ Enviado para o QG da PRF!</span>";
          setTimeout(() => {
            if (btn && btn.isConnected) btn.innerHTML = orig;
          }, 2e3);
        }
      });
      hud.querySelector("#qg-btn-banner-complete")?.addEventListener("click", (e) => {
        e.stopPropagation();
        hud.querySelector("#qg-btn-course-complete")?.click();
        const banner = getHudEl("qg-hud-course-completed-banner");
        if (banner) banner.style.display = "none";
      });
      hud.querySelector("#qg-btn-today-next")?.addEventListener("click", (e) => {
        e.stopPropagation();
        todayMissionIdx += 1;
        updateContextualHud();
      });
      hud.querySelector("#qg-btn-today-mission")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const subjects = Array.isArray(cachedTodayMission?.subjects) ? cachedTodayMission.subjects : [];
        if (subjects.length === 0) return;
        const pending = subjects.filter((s) => !s.completed);
        const list = pending.length > 0 ? pending : subjects;
        const picked = list[todayMissionIdx % list.length];
        if (picked) {
          const filterPayload = {
            subject: picked.name,
            topic: picked.topic || "",
            lessons: picked.lesson ? [picked.lesson] : [],
            fallbackTopic: picked.topic || "",
            createdAt: Date.now()
          };
          if (isQuestionsPage()) {
            applyCaveiraPracticeFilter(filterPayload);
          } else {
            try {
              chrome.storage.local.set({ [PENDING_FILTER_KEY]: filterPayload }, () => {
                window.location.href = `${window.location.origin}/questions`;
              });
            } catch (_) {
              window.location.href = `${window.location.origin}/questions`;
            }
          }
        }
      });
      hud.querySelector("#qg-btn-sync-catalog")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const res = scrapeCourseCatalogAndSync();
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = res.lessonsCount > 0 ? `✓ ${res.modulesCount} mód. / ${res.lessonsCount} aulas enviadas!` : res.modulesCount > 0 ? `✓ ${res.modulesCount} módulo(s) vinculados ao QG!` : "⚠️ Abra um curso/módulo no Caveira";
          setTimeout(() => {
            if (btn && btn.isConnected) btn.textContent = orig;
          }, 2500);
        }
      });
      hud.querySelector("#qg-btn-import-simulados")?.addEventListener("click", async (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const orig = btn ? btn.textContent : "";
        if (btn) {
          btn.disabled = true;
          btn.textContent = "⏳ Lendo matérias e notas...";
        }
        try {
          const res = await scrapeSimuladosAndImport();
          const count = Number(res?.count) || 0;
          if (btn) {
            btn.textContent = count > 0 ? `💾 ${count} salvo(s) na extensão — enviando...` : `⚠️ ${res?.reason || "Nenhum simulado encontrado nesta tela"}`;
          }
        } catch (_) {
          if (btn) btn.textContent = "⚠️ Erro ao importar simulados";
        } finally {
          if (btn) {
            btn.disabled = false;
            setTimeout(() => {
              if (btn && btn.isConnected) btn.textContent = orig;
            }, 3200);
          }
        }
      });
      hud.querySelector("#qg-btn-log-pdf")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const mins = Math.max(1, Math.round(pdfReadingSeconds / 60));
        const heading = (document.querySelector("h1, h2, .text-h5, .text-h6")?.innerText || document.title || "PDF Interativo Caveira").trim();
        const subject = inferSubjectFromLessons([heading], heading) || "";
        const logItem = { title: heading, subject, minutes: mins, url: window.location.href, loggedAt: Date.now() };
        try {
          chrome.storage.local.get([PENDING_PDF_KEY], (res) => {
            const prevArr = Array.isArray(res?.[PENDING_PDF_KEY]) ? res[PENDING_PDF_KEY] : [];
            chrome.storage.local.set({ [PENDING_PDF_KEY]: [...prevArr, logItem] }, () => {
              flushPendingQgEvents();
            });
          });
        } catch (_) {
        }
        pdfReadingSeconds = 0;
        const timerEl = getHudEl("qg-pdf-timer-text");
        if (timerEl) timerEl.textContent = "📄 Lendo PDF • 00:00";
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = `✓ +${mins} min enviados ao QG!`;
          setTimeout(() => {
            if (btn && btn.isConnected) btn.textContent = orig;
          }, 2200);
        }
      });
      updateContextualHud();
      const btnMin = hud.querySelector("#qg-btn-min");
      btnMin.addEventListener("click", (e) => {
        e.stopPropagation();
        hud.classList.toggle("minimized");
        btnMin.textContent = hud.classList.contains("minimized") ? "□" : "_";
      });
      const btnToggleSearch = hud.querySelector("#qg-btn-toggle-search");
      const searchDrawer = hud.querySelector("#qg-hud-search-drawer");
      const searchInput = hud.querySelector("#qg-hud-search-input");
      const searchResults = hud.querySelector("#qg-hud-search-results");
      if (btnToggleSearch && searchDrawer && searchInput && searchResults) {
        let hudSearchTimer = null;
        btnToggleSearch.addEventListener("click", (e) => {
          e.stopPropagation();
          if (hud.classList.contains("minimized")) {
            hud.classList.remove("minimized");
            btnMin.textContent = "_";
          }
          const isOpen = searchDrawer.style.display === "flex";
          searchDrawer.style.display = isOpen ? "none" : "flex";
          if (!isOpen) setTimeout(() => searchInput.focus(), 40);
        });
        searchInput.addEventListener("click", (e) => e.stopPropagation());
        searchInput.addEventListener("keydown", (e) => e.stopPropagation());
        searchInput.addEventListener("input", () => {
          clearTimeout(hudSearchTimer);
          const query = searchInput.value.trim();
          if (!query) {
            searchResults.textContent = "";
            return;
          }
          hudSearchTimer = setTimeout(() => {
            if (!isExtensionContextValid() || !chrome.runtime?.sendMessage) return;
            chrome.runtime.sendMessage({
              type: "DB_SEARCH_QUESTIONS",
              payload: { query, userId: cachedActiveUserId || null, limit: 15 }
            }, (resp) => {
              if (chrome.runtime?.lastError || isDestroyed) return;
              searchResults.textContent = "";
              const rows = Array.isArray(resp?.results) ? resp.results : [];
              if (rows.length === 0) {
                const emptyEl = document.createElement("div");
                emptyEl.style.cssText = "color:#94a3b8;font-size:10px;padding:4px 2px;";
                emptyEl.textContent = "Nenhum resultado encontrado.";
                searchResults.appendChild(emptyEl);
                return;
              }
              rows.forEach((r) => {
                const card = document.createElement("div");
                card.className = "qg-offline-search-item";
                const head = document.createElement("div");
                head.className = "qg-offline-search-head";
                const tag = document.createElement("span");
                tag.style.color = r.hit ? "#10b981" : "#ef4444";
                tag.textContent = `${r.hit ? "✓" : "✗"} ${r.id} • ${r.canonicalSubject || r.subject || "PRF"}`;
                head.appendChild(tag);
                const body = document.createElement("div");
                body.style.color = "#cbd5e1";
                const preview = r.userNote ? `💡 ${r.userNote}` : String(r.content || "").slice(0, 120);
                body.textContent = preview + (preview.length >= 120 ? "..." : "");
                card.appendChild(head);
                card.appendChild(body);
                searchResults.appendChild(card);
              });
            });
          }, 140);
        });
      }
      hud.addEventListener("click", () => {
        if (hud.classList.contains("minimized")) {
          hud.classList.remove("minimized");
          btnMin.textContent = "_";
        }
      });
      hud.querySelector("#qg-prompt-close")?.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissPrompt();
      });
      hud.querySelectorAll("[data-confidence]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const conf = btn.dataset.confidence;
          if (applyQuickTag(conf) && activeQuestionData?.hit) {
            setTimeout(dismissPrompt, 650);
          }
        });
      });
      hud.querySelector("#qg-btn-priority")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        const isNowActive = !btn.classList.contains("active");
        btn.classList.toggle("active", isNowActive);
        if (activeQuestionData) {
          activeQuestionData.priorityReview = isNowActive;
          if (isNowActive) activeQuestionData.fsrsRequested = true;
          saveQuestion(activeQuestionData, true);
          const badge = getHudEl("qg-prompt-status-badge");
          if (badge && isNowActive) {
            badge.textContent = "🔥 REVISÃO PRIORITÁRIA";
          }
        }
      });
      hud.querySelectorAll("[data-reason]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          hud.querySelectorAll("[data-reason]").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          if (activeQuestionData) {
            activeQuestionData.errorReason = btn.dataset.reason;
            saveQuestion(activeQuestionData, true);
            setTimeout(dismissPrompt, 500);
          }
        });
      });
      startTimerInterval();
    }
    function renderFilterBanner(customText = "") {
      const banner = getHudEl("qg-hud-filter-banner");
      const textEl = getHudEl("qg-hud-filter-text");
      if (!banner || !textEl) return;
      if (customText !== void 0 && customText !== null && customText !== "") {
        filterStatusMessage = customText;
      }
      if (activePracticeFilter && (activePracticeFilter.topic || activePracticeFilter.subject) || filterStatusMessage) {
        const baseLabel = activePracticeFilter ? [activePracticeFilter.subject, activePracticeFilter.topic].filter(Boolean).join(" • ") : "";
        const displayLabel = filterStatusMessage || `🎯 ${baseLabel}`;
        textEl.textContent = displayLabel;
        textEl.title = baseLabel || displayLabel;
        banner.style.display = "flex";
      } else {
        filterStatusMessage = "";
        banner.style.display = "none";
      }
    }
    function isElementVisible(el) {
      if (!el || !el.isConnected) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const style = window.getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity || "1") > 0;
    }
    function setNativeInputValue(input, value) {
      if (!input) return;
      const proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
      const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
      if (descriptor && typeof descriptor.set === "function") {
        descriptor.set.call(input, value);
      } else {
        input.value = value;
      }
      try {
        input.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
      } catch (_) {
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }
    function clickElementRealistically(el) {
      if (!el) return;
      try {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      } catch (_) {
      }
      const rect = el.getBoundingClientRect();
      const clientX = rect.left + Math.min(rect.width / 2, 16);
      const clientY = rect.top + rect.height / 2;
      const evtInit = { bubbles: true, cancelable: true, view: window, clientX, clientY };
      try {
        el.dispatchEvent(new PointerEvent("pointerdown", evtInit));
      } catch (_) {
      }
      try {
        el.dispatchEvent(new MouseEvent("mousedown", evtInit));
      } catch (_) {
      }
      try {
        el.dispatchEvent(new MouseEvent("mouseup", evtInit));
      } catch (_) {
      }
      el.click();
    }
    function findCheckboxInRowOrParent(rowEl) {
      if (!rowEl) return null;
      const selector = 'input[type="checkbox"], [role="checkbox"], .q-checkbox, .q-checkbox__inner';
      const direct = rowEl.querySelector(selector);
      if (direct) return direct;
      const parent = rowEl.parentElement;
      if (parent && normalizeFilterText(parent.innerText || parent.textContent) === normalizeFilterText(rowEl.innerText || rowEl.textContent)) {
        return parent.querySelector(selector);
      }
      return null;
    }
    function isOptionRowChecked(rowEl) {
      if (!rowEl) return false;
      const checkboxChild = rowEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox__inner') || findCheckboxInRowOrParent(rowEl);
      return Boolean(
        rowEl.getAttribute("aria-checked") === "true" || rowEl.getAttribute("aria-selected") === "true" || rowEl.getAttribute("data-state") === "checked" || rowEl.classList.contains("q-checkbox--truthy") || checkboxChild && (checkboxChild.checked === true || checkboxChild.getAttribute("aria-checked") === "true" || checkboxChild.classList.contains("q-checkbox--truthy") || checkboxChild.classList.contains("q-checkbox__inner--truthy"))
      );
    }
    function clickOptionRow(rowEl) {
      if (!rowEl) return;
      if (isOptionRowChecked(rowEl)) return;
      const checkboxChild = rowEl.querySelector('input[type="checkbox"], [role="checkbox"], .q-checkbox__inner') || findCheckboxInRowOrParent(rowEl);
      const target = checkboxChild || rowEl;
      clickElementRealistically(target);
    }
    const GENERIC_MATCH_WORDS = /* @__PURE__ */ new Set([
      "legislacao",
      "direito",
      "direitos",
      "nocao",
      "nocoes",
      "codigo",
      "codigos",
      "lei",
      "leis",
      "lingua",
      "linguas",
      "estatuto",
      "estatutos",
      "curso",
      "cursos",
      "conhecimento",
      "conhecimentos",
      "administracao",
      "administrativo",
      "administrativa",
      "administrativos",
      "administrativas",
      "processo",
      "processos",
      "geral",
      "gerais",
      "publica",
      "publico",
      "publicas",
      "publicos",
      "crime",
      "crimes",
      "contra",
      "sobre",
      "entre",
      "para",
      "pelo",
      "pela",
      "pelos",
      "pelas",
      "com",
      "sem",
      "dos",
      "das",
      "nos",
      "nas",
      "uma",
      "uns",
      "umas",
      "parte",
      "partes",
      "aula",
      "aulas",
      "modulo",
      "modulos",
      "bloco",
      "blocos",
      "definicao",
      "definicoes",
      "conceito",
      "conceitos",
      "introducao",
      "aspecto",
      "aspectos",
      "estudo",
      "classificacao",
      "tipo",
      "tipos",
      "especie",
      "especies",
      "inicial",
      "iniciais",
      "basico",
      "basica",
      "basicos",
      "basicas",
      "acerca",
      "tema",
      "temas",
      "topico",
      "topicos",
      "assunto",
      "assuntos",
      "capitulo",
      "capitulos",
      "secao",
      "secoes",
      "resumo",
      "visao",
      "quadro",
      "esquema",
      "tabela",
      "observacao",
      "observacoes",
      "importante",
      "importantes",
      "diferenca",
      "diferencas",
      "distincao",
      "comparacao",
      "comparativo"
    ]);
    const CONCEPT_STOP_WORDS = /* @__PURE__ */ new Set([
      "x",
      "vs",
      "versus",
      "e",
      "ou",
      "de",
      "da",
      "do",
      "dos",
      "das",
      "em",
      "na",
      "no",
      "nas",
      "nos",
      "para",
      "por",
      "com",
      "sem",
      "sobre",
      "entre",
      "ao",
      "aos",
      "as",
      "os",
      "um",
      "uma"
    ]);
    let stemmedGenericMatchWordsCache = null;
    function getStemmedGenericMatchWords() {
      if (!stemmedGenericMatchWordsCache) {
        stemmedGenericMatchWordsCache = /* @__PURE__ */ new Set();
        for (const gw of GENERIC_MATCH_WORDS) {
          stemmedGenericMatchWordsCache.add(gw);
          const st = normalizeStemText(gw);
          if (st) {
            for (const sw of st.split(" ")) {
              if (sw) stemmedGenericMatchWordsCache.add(sw);
            }
          }
        }
      }
      return stemmedGenericMatchWordsCache;
    }
    function extractConceptWords(str) {
      const rawNorm = normalizeFilterText(String(str || "")).replace(/[^a-z0-9]+/g, " ").trim();
      if (!rawNorm) return [];
      const genericStems = getStemmedGenericMatchWords();
      const seen = /* @__PURE__ */ new Set();
      const result = [];
      for (const rawWord of rawNorm.split(/\s+/)) {
        if (!rawWord) continue;
        if (CONCEPT_STOP_WORDS.has(rawWord) || GENERIC_MATCH_WORDS.has(rawWord)) continue;
        const stemmed = normalizeStemText(rawWord).trim() || rawWord;
        if (!stemmed || stemmed.length < 3) continue;
        if (CONCEPT_STOP_WORDS.has(stemmed) || genericStems.has(stemmed)) continue;
        if (!seen.has(stemmed)) {
          seen.add(stemmed);
          result.push(stemmed);
        }
      }
      return result;
    }
    const CONFLICTING_QUALIFIER_FAMILIES = [
      ["estadual"],
      ["municipal"],
      ["distrital", "distrito"],
      ["eleitoral"],
      ["tributario", "tributaria"],
      ["previdenciario", "previdenciaria"],
      ["trabalhista"],
      ["mulher", "mulheres", "maria", "penha", "11340", "feminicidio"]
    ];
    const SPECIAL_LAW_RULES = [
      {
        id: "eca",
        lawDigits: "8069",
        test: (norm) => /\beca\b/.test(norm) || norm.includes("crianca e do adolescente") || norm.includes("crianca e o adolescente") || norm.includes("estatuto da crianca") || norm.includes("8.069") || norm.includes("8069"),
        terms: [
          "8.069",
          "estatuto da crianca",
          "estatuto da crianca e do adolescente",
          "eca",
          "crianca e do adolescente",
          "8069"
        ]
      },
      {
        id: "henry_borel",
        lawDigits: "14344",
        test: (norm) => norm.includes("henry borel") || norm.includes("14.344") || norm.includes("14344"),
        terms: ["14.344", "henry borel", "lei henry borel", "14344"]
      },
      {
        id: "escuta_especializada",
        lawDigits: "13431",
        test: (norm) => norm.includes("escuta especializada") || norm.includes("depoimento especial") || norm.includes("13.431") || norm.includes("13431"),
        terms: ["13.431", "escuta especializada", "depoimento especial", "13431"]
      },
      {
        id: "drogas",
        lawDigits: "11343",
        test: (norm) => /\bdrogas?\b|\bsisnad\b|entorpecente/.test(norm) || norm.includes("11.343") || norm.includes("11343"),
        terms: ["11.343", "lei de drogas", "drogas", "sisnad", "11343"]
      },
      {
        id: "desarmamento",
        lawDigits: "10826",
        test: (norm) => norm.includes("desarmamento") || /\barmas?\b/.test(norm) || norm.includes("sinarm") || norm.includes("10.826") || norm.includes("10826"),
        terms: ["10.826", "estatuto do desarmamento", "desarmamento", "arma de fogo", "10826"]
      },
      {
        id: "abuso_autoridade",
        lawDigits: "13869",
        test: (norm) => norm.includes("abuso de autoridade") || norm.includes("13.869") || norm.includes("13869"),
        terms: ["13.869", "abuso de autoridade", "13869"]
      },
      {
        id: "tortura",
        lawDigits: "9455",
        test: (norm) => norm.includes("tortura") || norm.includes("9.455") || norm.includes("9455"),
        terms: ["9.455", "tortura", "lei de tortura", "crimes de tortura", "9455"]
      },
      {
        id: "hediondos",
        lawDigits: "8072",
        test: (norm) => norm.includes("hediondo") || norm.includes("8.072") || norm.includes("8072"),
        terms: ["8.072", "crimes hediondos", "hediondos", "8072"]
      },
      {
        id: "orcrim",
        lawDigits: "12850",
        test: (norm) => norm.includes("organizacao criminosa") || norm.includes("organizacoes criminosas") || /\borcrim\b/.test(norm) || norm.includes("12.850") || norm.includes("12850"),
        terms: ["12.850", "organizacoes criminosas", "organizacao criminosa", "12850"]
      },
      {
        id: "maria_da_penha",
        lawDigits: "11340",
        test: (norm) => norm.includes("maria da penha") || norm.includes("violencia domestica") && /\bmulher(?:es)?\b/.test(norm) || norm.includes("feminicidio") || norm.includes("11.340") || norm.includes("11340"),
        terms: [
          "11.340",
          "maria da penha",
          "lei maria da penha",
          "violencia domestica e familiar contra a mulher",
          "11340"
        ]
      },
      {
        id: "crimes_ambientais",
        lawDigits: "9605",
        test: (norm) => norm.includes("meio ambiente") || norm.includes("ambienta") || norm.includes("9.605") || norm.includes("9605"),
        terms: ["9.605", "crimes ambientais", "lei ambiental", "meio ambiente", "9605"]
      },
      {
        id: "interceptacao",
        lawDigits: "9296",
        test: (norm) => norm.includes("interceptacao") || norm.includes("9.296") || norm.includes("9296"),
        terms: ["9.296", "interceptacao telefonica", "9296"]
      },
      {
        id: "jecrim",
        lawDigits: "9099",
        test: (norm) => norm.includes("juizado") || /\bjecrim\b/.test(norm) || norm.includes("9.099") || norm.includes("9099"),
        terms: ["9.099", "juizados especiais", "juizado especial", "jecrim", "9099"]
      },
      {
        id: "lavagem",
        lawDigits: "9613",
        test: (norm) => norm.includes("lavagem") || norm.includes("9.613") || norm.includes("9613"),
        terms: ["9.613", "lavagem de dinheiro", "lavagem de capitais", "9613"]
      },
      {
        id: "racismo",
        lawDigits: "7716",
        test: (norm) => norm.includes("racismo") || norm.includes("7.716") || norm.includes("7716"),
        terms: ["7.716", "racismo", "crimes de racismo", "7716"]
      },
      {
        id: "lep",
        lawDigits: "7210",
        test: (norm) => /\blep\b/.test(norm) || norm.includes("execucao penal") || norm.includes("7.210") || norm.includes("7210"),
        terms: ["7.210", "execucao penal", "lei de execucao penal", "lep", "7210"]
      },
      {
        id: "prisao_temporaria",
        lawDigits: "7960",
        test: (norm) => norm.includes("prisao temporaria") || norm.includes("7.960") || norm.includes("7960"),
        terms: ["7.960", "prisao temporaria", "7960"]
      },
      {
        id: "idoso",
        lawDigits: "10741",
        test: (norm) => norm.includes("idoso") || norm.includes("pessoa idosa") || norm.includes("10.741") || norm.includes("10741"),
        terms: ["10.741", "estatuto do idoso", "estatuto da pessoa idosa", "10741"]
      },
      {
        id: "anticrime",
        lawDigits: "13964",
        test: (norm) => norm.includes("pacote anticrime") || /\banticrime\b/.test(norm) || norm.includes("13.964") || norm.includes("13964"),
        terms: ["13.964", "pacote anticrime", "13964"]
      },
      {
        id: "igualdade_racial",
        lawDigits: "12288",
        test: (norm) => norm.includes("igualdade racial") || norm.includes("12.288") || norm.includes("12288"),
        terms: ["12.288", "estatuto da igualdade racial", "igualdade racial", "12288"]
      },
      {
        id: "pcd",
        lawDigits: "13146",
        test: (norm) => norm.includes("pessoa com deficiencia") || /\blbi\b/.test(norm) || norm.includes("13.146") || norm.includes("13146"),
        terms: ["13.146", "estatuto da pessoa com deficiencia", "pessoa com deficiencia", "13146"]
      },
      {
        id: "ctb",
        lawDigits: "9503",
        test: (norm) => /\bctb\b/.test(norm) || norm.includes("codigo de transito") || norm.includes("9.503") || norm.includes("9503"),
        terms: ["9.503", "codigo de transito brasileiro", "ctb", "9503"]
      },
      {
        id: "lia",
        lawDigits: "8429",
        test: (norm) => /\blia\b/.test(norm) || norm.includes("improbidade administrativa") || norm.includes("8.429") || norm.includes("8429"),
        terms: ["8.429", "improbidade administrativa", "lei de improbidade administrativa", "8429"]
      }
    ];
    function normalizeStemText(str) {
      return normalizeFilterText(str).replace(/[()[\],;:!?"'“”]+/g, " ").split(/\s+/).filter(Boolean).map((w) => {
        if (w.length >= 5 && w.endsWith("ais")) return `${w.slice(0, -3)}al`;
        if (w.length >= 5 && (w.endsWith("oes") || w.endsWith("aes"))) return `${w.slice(0, -3)}ao`;
        if (w.length >= 5 && w.endsWith("res")) return w.slice(0, -2);
        if (w.length >= 4 && w.endsWith("ns")) return `${w.slice(0, -2)}m`;
        if (w.length >= 4 && w.endsWith("s")) return w.slice(0, -1);
        return w;
      }).join(" ");
    }
    function isOnlyGenericWords(phrase) {
      const tokens = normalizeFilterText(phrase).split(/[^a-z0-9]+/).filter(Boolean);
      if (tokens.length === 0) return true;
      return tokens.every((w) => {
        if (w.length <= 2) return true;
        const stem = normalizeStemText(w);
        return GENERIC_MATCH_WORDS.has(w) || stem && GENERIC_MATCH_WORDS.has(stem);
      });
    }
    function restoreCommonPortugueseAccents(str) {
      const raw = String(str || "").trim();
      if (!raw) return "";
      const wordMap = {
        crianca: "criança",
        criancas: "crianças",
        lingua: "língua",
        portugues: "português",
        raciocinio: "raciocínio",
        logico: "lógico",
        logica: "lógica",
        matematica: "matemática",
        fisica: "física",
        etica: "ética",
        geopolitica: "geopolítica",
        informatica: "informática",
        transito: "trânsito",
        codigo: "código",
        publico: "público",
        publica: "pública",
        publicos: "públicos",
        publicas: "públicas",
        orgao: "órgão",
        orgaos: "órgãos",
        juridico: "jurídico",
        juridica: "jurídica",
        politico: "político",
        politica: "política",
        economico: "econômico",
        economica: "econômica",
        tributario: "tributário",
        tributaria: "tributária",
        previdenciario: "previdenciário",
        previdenciaria: "previdenciária",
        inquerito: "inquérito",
        ilicito: "ilícito",
        ilicitos: "ilícitos",
        unico: "único",
        unica: "única",
        numero: "número",
        veiculo: "veículo",
        veiculos: "veículos",
        servico: "serviço",
        servicos: "serviços",
        comercio: "comércio",
        exercicio: "exercício",
        exercicios: "exercícios",
        beneficio: "benefício",
        beneficios: "benefícios",
        principio: "princípio",
        principios: "princípios",
        seguranca: "segurança",
        violencia: "violência",
        domestica: "doméstica",
        domestico: "doméstico",
        estatistica: "estatística",
        tecnica: "técnica",
        tecnico: "técnico",
        pratica: "prática",
        pratico: "prático",
        mecanica: "mecânica",
        cinematica: "cinemática",
        dinamica: "dinâmica",
        telefonica: "telefônica",
        nao: "não",
        sao: "são",
        familia: "família",
        saude: "saúde",
        medio: "médio",
        media: "média",
        historia: "história",
        memoria: "memória",
        materia: "matéria",
        patrimonio: "patrimônio",
        homicidio: "homicídio",
        suicidio: "suicídio",
        auxilio: "auxílio",
        justica: "justiça",
        forca: "força",
        licenca: "licença",
        rodoviario: "rodoviário",
        rodoviaria: "rodoviária",
        extraordinario: "extraordinário",
        extraordinaria: "extraordinária",
        sumario: "sumário",
        sumaria: "sumária",
        ordinario: "ordinário",
        ordinaria: "ordinária",
        policia: "polícia",
        judiciaria: "judiciária",
        discricionaria: "discricionária",
        temporaria: "temporária",
        necessaria: "necessária",
        subsidiaria: "subsidiária",
        solidaria: "solidária",
        estatutaria: "estatutária",
        hierarquico: "hierárquico",
        hierarquica: "hierárquica",
        especie: "espécie",
        especies: "espécies",
        proprio: "próprio",
        propria: "própria",
        proprios: "próprios",
        proprias: "próprias",
        ministerio: "ministério",
        ministerios: "ministérios",
        consorcio: "consórcio",
        consorcios: "consórcios",
        sumula: "súmula",
        sumulas: "súmulas",
        eletronico: "eletrônico",
        eletronica: "eletrônica",
        virus: "vírus",
        dominio: "domínio",
        analise: "análise",
        combinatoria: "combinatória",
        fonetica: "fonética",
        semantica: "semântica",
        concordancia: "concordância",
        adverbio: "advérbio",
        adverbios: "advérbios",
        periodo: "período",
        genero: "gênero",
        generos: "gêneros",
        sinonimos: "sinônimos",
        antonimos: "antônimos",
        homonimos: "homônimos",
        paronimos: "parônimos",
        politicos: "políticos",
        politicas: "políticas",
        democraticas: "democráticas",
        fe: "fé",
        reu: "réu",
        juizo: "juízo"
      };
      return raw.split(/\s+/).map((token) => {
        const lower = token.toLowerCase();
        if (wordMap[lower]) return wordMap[lower];
        if (/^[a-z]+cao$/.test(lower)) return `${lower.slice(0, -3)}ção`;
        if (/^[a-z]+coes$/.test(lower)) return `${lower.slice(0, -4)}ções`;
        if (/^[a-z]{2,}sao$/.test(lower)) return `${lower.slice(0, -3)}são`;
        if (/^[a-z]{2,}soes$/.test(lower)) return `${lower.slice(0, -4)}sões`;
        if (/^[a-z]{2,}encia$/.test(lower)) return `${lower.slice(0, -5)}ência`;
        if (/^[a-z]{2,}encias$/.test(lower)) return `${lower.slice(0, -6)}ências`;
        if (/^[a-z]{2,}ario$/.test(lower)) return `${lower.slice(0, -4)}ário`;
        if (/^[a-z]{2,}arios$/.test(lower)) return `${lower.slice(0, -5)}ários`;
        return token;
      }).join(" ");
    }
    function stripAmendedLawTail(rawText) {
      const norm = normalizeFilterText(rawText);
      if (!norm) return "";
      return norm.replace(/\b(?:e\s+)?(?:altera|modifica|acrescenta|revoga|da\s+nova\s+redacao)\s+(?:a\s+|o\s+|os\s+|as\s+|dispositivos\s+da\s+)?(?:lei|decreto|codigo|estatuto)\b.*$/i, "").trim();
    }
    function extractLeadingLawDigits(rawText) {
      const base = stripAmendedLawTail(rawText) || normalizeFilterText(rawText);
      if (!base) return "";
      const match = base.match(/\b(?:lei|decreto(?:-lei)?|lc)\s*(?:complementar\s*)?(?:n\.?[oº°.]?\s*|numero\s+)?(\d{1,2}\.?\d{3})\b/i);
      return match ? match[1].replace(/\D/g, "") : "";
    }
    function getMatchingSpecialLawIds(rawText, opts = {}) {
      const primaryOnly = Boolean(opts && opts.primaryOnly);
      const sourceText = primaryOnly ? stripAmendedLawTail(rawText) || rawText : rawText;
      const norm = normalizeFilterText(sourceText).replace(/[-–—:|/]+/g, " ").replace(/\s+/g, " ").trim();
      if (!norm) return [];
      const leadingDigits = primaryOnly ? extractLeadingLawDigits(sourceText) : "";
      const ids = [];
      for (const rule of SPECIAL_LAW_RULES) {
        if (!rule.id || !rule.test(norm)) continue;
        if (primaryOnly && leadingDigits && rule.lawDigits && rule.lawDigits !== leadingDigits) {
          continue;
        }
        if (!ids.includes(rule.id)) {
          ids.push(rule.id);
        }
      }
      if (primaryOnly && leadingDigits) {
        const key = `lei_${leadingDigits}`;
        if (!ids.includes(key)) ids.push(key);
      } else {
        const lawRegex = /\blei\s+(?:n\.?[oº°.]?\s*|numero\s+)?(\d{1,2}\.?\d{3})\b/gi;
        let match;
        while ((match = lawRegex.exec(norm)) !== null) {
          const digits = match[1].replace(/\D/g, "");
          if (digits.length >= 4 && digits.length <= 5) {
            const key = `lei_${digits}`;
            if (!ids.includes(key)) ids.push(key);
          }
        }
      }
      return ids;
    }
    function getSpecialLawSearchTerms(rawText) {
      const norm = normalizeFilterText(rawText).replace(/[-–—:|/]+/g, " ").replace(/\s+/g, " ").trim();
      if (!norm) return [];
      const results = [];
      const pushTerm = (t) => {
        if (t && !results.includes(t)) results.push(t);
      };
      for (const rule of SPECIAL_LAW_RULES) {
        if (rule.test(norm)) {
          for (const t of rule.terms) {
            pushTerm(t);
          }
        }
      }
      const lawRegex = /\blei\s+(?:n[oº°.]?\s*)?(\d{1,2}\.?\d{3})\b/gi;
      let match;
      while ((match = lawRegex.exec(norm)) !== null) {
        const digits = match[1].replace(/\D/g, "");
        if (digits.length >= 4 && digits.length <= 5) {
          const dotted = digits.replace(/^(\d+)(\d{3})$/, "$1.$2");
          pushTerm(`lei ${dotted}`);
          pushTerm(dotted);
          pushTerm(digits);
        }
      }
      return results;
    }
    const KNOWN_SUBJECT_RULES = [
      {
        canonical: "Direito Processual Penal",
        exactPatterns: ["direito processual penal", "processual penal", "processo penal", "dpp"],
        inlineRegex: /\b(?:direito\s+processual\s+penal|processo\s+penal)\b/i
      },
      {
        canonical: "Legislação Especial",
        exactPatterns: [
          "legislacao penal especial",
          "legislacao especial",
          "legislacao extravagante",
          "leis penais especiais",
          "leis especiais",
          "direito penal especial",
          "penal especial"
        ],
        inlineRegex: /\b(?:legislacao\s+(?:penal\s+)?especial|legislacao\s+extravagante|leis\s+(?:penais\s+)?especiais)\b/i
      },
      {
        canonical: "Direito Constitucional",
        exactPatterns: ["direito constitucional", "constitucional", "dir constitucional"],
        inlineRegex: /\bdireito\s+constitucional\b/i
      },
      {
        canonical: "Direito Administrativo",
        exactPatterns: ["direito administrativo", "administrativo", "dir administrativo"],
        inlineRegex: /\bdireito\s+administrativo\b/i
      },
      {
        canonical: "Direito Penal",
        exactPatterns: ["direito penal", "penal", "dir penal"],
        inlineRegex: /\bdireito\s+penal\b/i
      },
      {
        canonical: "Legislação de Trânsito",
        exactPatterns: [
          "legislacao de transito",
          "codigo de transito brasileiro",
          "codigo de transito",
          "ctb",
          "transito"
        ],
        inlineRegex: /\b(?:legislacao\s+de\s+transito|codigo\s+de\s+transito(?:\s+brasileiro)?|ctb)\b/i
      },
      {
        canonical: "Língua Portuguesa",
        exactPatterns: ["lingua portuguesa", "portugues", "gramatica", "interpretacao de texto", "interpretacao textual"],
        inlineRegex: /\b(?:lingua\s+portuguesa|portugues)\b/i
      },
      {
        canonical: "Raciocínio Lógico",
        exactPatterns: ["raciocinio logico matematico", "raciocinio logico", "rlm", "matematica"],
        inlineRegex: /\b(?:raciocinio\s+logico(?:\s+matematico)?|rlm)\b/i
      },
      {
        canonical: "Informática",
        exactPatterns: ["nocoes de informatica", "informatica"],
        inlineRegex: /\binformatica\b/i
      },
      {
        canonical: "Ética no Serviço Público",
        exactPatterns: ["etica no servico publico", "etica profissional", "etica e cidadania", "etica"],
        inlineRegex: /\betica\s+no\s+servico\s+publico\b/i
      },
      {
        canonical: "Direitos Humanos",
        exactPatterns: ["direitos humanos", "cidadania e direitos humanos"],
        inlineRegex: /\bdireitos\s+humanos\b/i
      },
      {
        canonical: "Física",
        exactPatterns: ["fisica aplicada", "fisica"],
        inlineRegex: /\bfisica\b/i
      },
      {
        canonical: "Geopolítica",
        exactPatterns: ["geopolitica brasileira", "geopolitica"],
        inlineRegex: /\bgeopolitica\b/i
      },
      {
        canonical: "Direito Civil",
        exactPatterns: ["direito civil"],
        inlineRegex: /\bdireito\s+civil\b/i
      },
      {
        canonical: "Redação",
        exactPatterns: ["redacao discursiva", "redacao oficial", "redacao"],
        inlineRegex: /\bredacao(?:\s+(?:discursiva|oficial))?\b/i
      }
    ];
    function matchExactSubjectRule(segment) {
      const norm = normalizeFilterText(String(segment || "").replace(/\([^)]*\)/g, " ")).replace(/^(?:nocoes\s+de|disciplina\s*:?|materia\s*:?)\s+/i, "").replace(/\b(?:aula|parte|bloco|modulo)\s*\d+\b/gi, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (!norm) return null;
      for (const rule of KNOWN_SUBJECT_RULES) {
        if (rule.exactPatterns.includes(norm)) {
          return rule.canonical;
        }
      }
      return null;
    }
    function extractSubjectFromLessonTitle(lessonTitle) {
      const raw = String(lessonTitle || "").trim();
      if (!raw) return { subject: "", cleanedTitle: "" };
      const bracketMatch = raw.match(/^\s*[[(]([^\]()]{3,45})[\])]\s*[-–—:|]*\s*(.+)$/);
      if (bracketMatch) {
        const bracketSubject = matchExactSubjectRule(bracketMatch[1]);
        if (bracketSubject) {
          const rest = bracketMatch[2].trim();
          return {
            subject: bracketSubject,
            cleanedTitle: rest || raw
          };
        }
      }
      const segments = raw.split(/\s*(?:[-–—:|])\s*/).map((s) => s.trim()).filter(Boolean);
      if (segments.length >= 2) {
        const stripLeadingOrder = (s) => s.replace(/^(?:aula|modulo|bloco)\s*\d+\s*/i, "").trim();
        const firstCand = stripLeadingOrder(segments[0]) || segments[0];
        const firstSubject = matchExactSubjectRule(firstCand);
        if (firstSubject) {
          const remaining = segments.slice(1).join(" - ").trim();
          return {
            subject: firstSubject,
            cleanedTitle: remaining && !/^(?:aula|parte|bloco|modulo)\s*\d+$/i.test(normalizeFilterText(remaining)) ? remaining : raw
          };
        }
        if (segments.length >= 3 && /^(?:aula|modulo|bloco)\s*\d+$/i.test(normalizeFilterText(segments[0]))) {
          const secondSubject = matchExactSubjectRule(segments[1]);
          if (secondSubject) {
            const remaining = segments.slice(2).join(" - ").trim();
            return {
              subject: secondSubject,
              cleanedTitle: remaining || raw
            };
          }
        }
        const lastSubject = matchExactSubjectRule(segments[segments.length - 1]);
        if (lastSubject) {
          const remaining = segments.slice(0, -1).join(" - ").trim();
          return {
            subject: lastSubject,
            cleanedTitle: remaining && !/^(?:aula|parte|bloco|modulo)\s*\d+$/i.test(normalizeFilterText(remaining)) ? remaining : raw
          };
        }
      }
      const normRaw = normalizeFilterText(raw);
      for (const rule of KNOWN_SUBJECT_RULES) {
        if (rule.inlineRegex && rule.inlineRegex.test(normRaw)) {
          return { subject: rule.canonical, cleanedTitle: raw };
        }
      }
      return { subject: "", cleanedTitle: raw };
    }
    function inferSubjectFromLessons(lessonsList = [], fallbackTopic = "") {
      const candidates = [...Array.isArray(lessonsList) ? lessonsList : [lessonsList], fallbackTopic].filter(Boolean);
      for (const cand of candidates) {
        const { subject } = extractSubjectFromLessonTitle(cand);
        if (subject) return subject;
      }
      return "";
    }
    function extractCourseSubjectFromPage(lessonTitle = "") {
      const candidates = [];
      try {
        const videoMain = document.querySelector(".video-main-title");
        const videoMainTxt = (videoMain?.innerText || videoMain?.textContent || "").replace(/\s+/g, " ").trim();
        if (videoMainTxt) candidates.push(videoMainTxt);
        const courseMain = document.querySelector(".course-main-title");
        const courseMainTxt = (courseMain?.innerText || courseMain?.textContent || "").replace(/\s+/g, " ").trim();
        if (courseMainTxt) candidates.push(courseMainTxt);
        const toggleListBtn = Array.from(document.querySelectorAll("button, .q-btn")).find((el) => !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(el) && /(?:ocultar|mostrar)\s+lista/i.test(el.innerText || el.textContent || ""));
        if (toggleListBtn?.parentElement) {
          const rawBar = (toggleListBtn.parentElement.innerText || toggleListBtn.parentElement.textContent || "").replace(/(?:ocultar|mostrar)\s+lista/gi, "").replace(/\s+/g, " ").trim();
          if (rawBar && rawBar.length <= 240) candidates.push(rawBar);
        }
        const midMatch = window.location.pathname.match(/\/modules\/(\d+)/i);
        const curModuleId = midMatch ? midMatch[1] : "";
        if (curModuleId && Array.isArray(apiCourseCatalogCache?.modules)) {
          const mod = apiCourseCatalogCache.modules.find((m) => String(m?.id || m?.moduleId || "") === curModuleId);
          if (mod?.title || mod?.name) candidates.push(String(mod.title || mod.name).trim());
        }
      } catch (_) {
      }
      if (lessonTitle) candidates.push(lessonTitle);
      let contextSubject = "";
      if (lastOpenedCourseContext?.subject) {
        const cidMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
        const midMatch = window.location.pathname.match(/\/modules\/(\d+)/i);
        const sameCourse = !lastOpenedCourseContext.courseId || !cidMatch || lastOpenedCourseContext.courseId === cidMatch[1];
        const sameModule = !lastOpenedCourseContext.moduleId || !midMatch || lastOpenedCourseContext.moduleId === midMatch[1];
        if (sameCourse && sameModule) {
          contextSubject = lastOpenedCourseContext.subject;
        }
      }
      return inferSubjectFromLessons(candidates, contextSubject) || contextSubject || "";
    }
    function stripSubjectFromLessonTitle(lessonTitle, subjectName = "") {
      const raw = String(lessonTitle || "").trim();
      if (!raw) return "";
      const extracted = extractSubjectFromLessonTitle(raw);
      if (extracted.cleanedTitle && extracted.cleanedTitle !== raw) {
        return extracted.cleanedTitle;
      }
      if (subjectName) {
        const targetCanon = matchExactSubjectRule(subjectName) || normalizeFilterText(subjectName);
        const segments = raw.split(/\s*(?:[-–—:|])\s*/).map((s) => s.trim()).filter(Boolean);
        if (segments.length >= 2) {
          const firstCanon = matchExactSubjectRule(segments[0]) || normalizeFilterText(segments[0]);
          if (firstCanon && firstCanon === targetCanon) {
            const rest = segments.slice(1).join(" - ").trim();
            if (rest && !/^(?:aula|parte|bloco|modulo)\s*\d+$/i.test(normalizeFilterText(rest))) {
              return rest;
            }
          }
        }
      }
      return raw;
    }
    function isGenericSubjectName(subject) {
      const norm = normalizeFilterText(subject);
      if (!norm) return true;
      return /^(?:geral|edital|revisao|simulado|curso|modulo|modulos|aula|aulas|bateria|questoes|nivelamento)$/.test(norm);
    }
    function getSubjectSearchTerms(subject) {
      const norm = normalizeFilterText(subject);
      if (!norm) return [];
      const specialLegislationTerms = [
        "legislacao penal especial",
        "legislacao especial",
        "leis penais especiais",
        "leis especiais",
        "legislacao extravagante",
        "direito penal especial",
        "penal especial",
        "especial",
        "especiais",
        "extravagante"
      ];
      const aliases = {
        "portugues": ["lingua portuguesa", "portugues"],
        "lingua portuguesa": ["lingua portuguesa", "portugues"],
        "legislacao de transito": ["codigo de transito brasileiro", "ctb", "transito", "legislacao de transito"],
        "transito": ["codigo de transito brasileiro", "ctb", "transito"],
        "ctb": ["codigo de transito brasileiro", "ctb"],
        "raciocinio logico": ["raciocinio logico", "matematica"],
        "rlm": ["raciocinio logico", "matematica"],
        "processo penal": ["direito processual penal", "processo penal"],
        "direito processual penal": ["direito processual penal", "processo penal"],
        "direito penal": ["direito penal", "penal"],
        "penal": ["direito penal", "penal"],
        "direito constitucional": ["direito constitucional", "constitucional"],
        "constitucional": ["direito constitucional", "constitucional"],
        "direito administrativo": ["direito administrativo", "administrativo"],
        "administrativo": ["direito administrativo", "administrativo"],
        "direitos humanos": ["direitos humanos"],
        "direito civil": ["direito civil"],
        "legislacao especial": specialLegislationTerms,
        "legislacao penal especial": specialLegislationTerms,
        "leis especiais": specialLegislationTerms,
        "leis penais especiais": specialLegislationTerms,
        "informatica": ["informatica", "nocoes de informatica"],
        "etica": ["etica no servico publico", "etica"],
        "etica no servico publico": ["etica no servico publico", "etica"],
        "fisica": ["fisica"],
        "geopolitica": ["geopolitica"],
        "redacao": ["redacao"]
      };
      const list = aliases[norm] ? [...aliases[norm]] : [norm];
      if (!list.includes(norm)) list.push(norm);
      return list;
    }
    function getTopicSearchTerms(topic) {
      const norm = normalizeFilterText(topic);
      if (!norm) return [];
      const terms = [];
      const pushUnique = (t) => {
        const s = String(t || "").trim();
        if (s && !terms.includes(s)) terms.push(s);
      };
      const cleaned = norm.replace(/\b(de nivelamento|nivelamento|bases da|bases do|nocoes de|introducao a|introducao ao|parte \d+|aula \d+|modulo \d+)\b/g, " ").replace(/\s+/g, " ").trim();
      pushUnique(norm);
      pushUnique(cleaned);
      getSpecialLawSearchTerms(norm).forEach((t) => pushUnique(t));
      if (cleaned && cleaned !== norm) {
        getSpecialLawSearchTerms(cleaned).forEach((t) => pushUnique(t));
      }
      const cleanedWords = cleaned.split(" ").filter(Boolean);
      if (cleanedWords.length >= 2 && cleanedWords[1].length >= 3) {
        const pair = `${cleanedWords[0]} ${cleanedWords[1]}`;
        if (!isOnlyGenericWords(pair)) {
          pushUnique(pair);
          if (!cleanedWords[0].endsWith("s") && cleanedWords[0].length >= 4 && !isOnlyGenericWords(cleanedWords[0])) {
            pushUnique(`${cleanedWords[0]}s ${cleanedWords[1]}`);
          }
        }
      }
      const sigWords = cleanedWords.filter((w) => w.length >= 4 && !isOnlyGenericWords(w));
      sigWords.sort((a, b) => b.length - a.length);
      sigWords.forEach((w) => pushUnique(w));
      return terms;
    }
    function extractEnumeratedSubitemsFromLesson(lessonTitle) {
      const strippedSubject = stripSubjectFromLessonTitle(lessonTitle);
      const cleaned = String(strippedSubject || lessonTitle || "").replace(/\b(?:aula|parte|bloco|m[oó]dulo|cap[ií]tulo)\s*\d+\b/gi, " ").replace(/\s+/g, " ").replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "").trim();
      if (!cleaned) return [];
      const dashParts = cleaned.split(/\s*[-–—:]\s*/).map((p) => p.trim()).filter(Boolean);
      const targetParts = dashParts.length > 1 ? dashParts.slice(1) : [cleaned];
      const rawItems = [];
      const seenNorm = /* @__PURE__ */ new Set();
      const headNouns = /* @__PURE__ */ new Set([
        "administracao",
        "atos",
        "ato",
        "principios",
        "principio",
        "controle",
        "poder",
        "poderes",
        "competencia",
        "competencias",
        "orgaos",
        "agentes",
        "servicos",
        "responsabilidade",
        "acao",
        "prisao",
        "crimes"
      ]);
      for (const part of targetParts) {
        const strippedPart = part.replace(/^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o|comparativo|quadro\s+comparativo|rela[cç][aã]o)\s+(?:entre|de|da|do)\s+|(?:conceitos?|no[cç][oõ]es|defini[cç][oõ]es|defini[cç][aã]o|esp[eé]cies|formas|tipos|classifica[cç][aã]o|caracter[ií]sticas)\s+(?:de|da|do|dos|das)\s+)/i, "").replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
        if (!strippedPart) continue;
        const splitItems = strippedPart.split(/\s*,\s*|\s+\be\b\s+|\s+\bx\b\s+|\s+\b(?:vs\.?|versus)\b\s+|(?<=[a-zA-ZÀ-ÿ])\s*\/\s*(?=[a-zA-ZÀ-ÿ])/i).map((p) => p.trim()).filter(Boolean);
        if (splitItems.length < 2) continue;
        if (splitItems.length === 2) {
          const firstWords = splitItems[0].split(/\s+/).filter(Boolean);
          const secondWords = splitItems[1].split(/\s+/).filter(Boolean);
          if (firstWords.length >= 2 && secondWords.length === 1 && headNouns.has(normalizeFilterText(firstWords[0]))) {
            splitItems[1] = `${firstWords[0]} ${splitItems[1]}`;
          }
        }
        splitItems.forEach((item, idx) => {
          const cleanNorm = normalizeFilterText(item).replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "").replace(/\s+/g, " ").trim();
          if (cleanNorm.length >= 3 && !isOnlyGenericWords(cleanNorm) && !seenNorm.has(cleanNorm)) {
            seenNorm.add(cleanNorm);
            rawItems.push({ raw: item.trim(), norm: cleanNorm, idx });
          }
        });
      }
      rawItems.sort((a, b) => b.norm.length - a.norm.length || b.idx - a.idx);
      return rawItems.map((entry) => entry.raw);
    }
    function getLessonSearchTerms(lessonTitle) {
      const withoutSubject = stripSubjectFromLessonTitle(lessonTitle);
      const cleanedRaw = String(withoutSubject || lessonTitle || "").replace(/\b(?:aula|parte|bloco|m[oó]dulo|cap[ií]tulo)\s*\d+\b/gi, " ").replace(/\s+/g, " ").replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "").trim();
      if (!cleanedRaw) return [];
      const terms = [];
      const pushUnique = (t) => {
        const s = normalizeFilterText(t).replace(/\b(aula|parte|bloco|modulo|capitulo)\s*\d+\b/g, " ").replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "").replace(/\s+/g, " ").trim();
        if (s && !terms.includes(s)) terms.push(s);
      };
      const pushEnumeratedFromPart = (part) => {
        const listParts = part.split(/\s*,\s*|\s+\be\b\s+|\s+\bx\b\s+/i).map((p) => p.trim()).filter(Boolean);
        if (listParts.length > 1) {
          const specificParts = [];
          listParts.forEach((sub, idx) => {
            const cleanPart = normalizeFilterText(sub);
            if (cleanPart.length >= 3 && !isOnlyGenericWords(cleanPart)) {
              specificParts.push({ cleanPart, idx });
            }
          });
          specificParts.sort((a, b) => b.cleanPart.length - a.cleanPart.length || b.idx - a.idx);
          specificParts.forEach((entry) => pushUnique(entry.cleanPart));
        }
      };
      const dashParts = cleanedRaw.split(/\s*[-–—:]\s*/).map((p) => p.trim()).filter(Boolean);
      if (dashParts.length > 1) {
        const rightParts = dashParts.slice(1);
        const leftPart = dashParts[0];
        rightParts.forEach((part) => {
          const cleanPart = normalizeFilterText(part);
          if (cleanPart.length >= 3 && !isOnlyGenericWords(cleanPart)) {
            pushUnique(part);
          }
          getSpecialLawSearchTerms(part).forEach((t) => pushUnique(t));
          pushEnumeratedFromPart(part);
        });
        pushUnique(cleanedRaw);
        getSpecialLawSearchTerms(cleanedRaw).forEach((t) => pushUnique(t));
        const cleanLeft = normalizeFilterText(leftPart);
        if (cleanLeft.length >= 3 && !isOnlyGenericWords(cleanLeft)) {
          pushUnique(leftPart);
        }
        getSpecialLawSearchTerms(leftPart).forEach((t) => pushUnique(t));
        pushEnumeratedFromPart(leftPart);
      } else {
        pushUnique(cleanedRaw);
        getSpecialLawSearchTerms(cleanedRaw).forEach((t) => pushUnique(t));
        pushEnumeratedFromPart(cleanedRaw);
      }
      const expanded = [...terms];
      expanded.forEach((t) => {
        const words = t.split(" ").filter(Boolean);
        if (words.length >= 2 && words[1].length >= 3) {
          const pair = `${words[0]} ${words[1]}`;
          if (!isOnlyGenericWords(pair)) {
            pushUnique(pair);
            if (!words[0].endsWith("s") && words[0].length >= 4 && !isOnlyGenericWords(words[0])) {
              pushUnique(`${words[0]}s ${words[1]}`);
            }
          }
        }
        words.filter((w) => w.length >= 4 && !isOnlyGenericWords(w)).sort((a, b) => b.length - a.length).forEach((w) => pushUnique(w));
      });
      return terms;
    }
    function findAppliedFiltersSection() {
      const label = Array.from(document.querySelectorAll("div, span, p, h1, h2, h3, h4, label, strong")).find((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === "filtros aplicados" || txt === "filtros aplicados:";
      });
      if (!label) return null;
      const labelRect = label.getBoundingClientRect();
      let container = label.parentElement;
      while (container && container !== document.body) {
        const r = container.getBoundingClientRect();
        if (r.height >= 45 && r.height <= 460 && r.width >= 260) {
          return { container, labelRect };
        }
        container = container.parentElement;
      }
      return { container: label.parentElement, labelRect };
    }
    function findFilterDropdownTrigger(labelWord) {
      const targetNorm = normalizeFilterText(labelWord);
      const targetPrefix = targetNorm.slice(0, Math.min(6, targetNorm.length));
      const appliedInfo = findAppliedFiltersSection();
      const matches = Array.from(document.querySelectorAll('button, [role="button"], [role="combobox"], .q-select, .q-field, div, span')).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        if (appliedInfo) {
          const r = el.getBoundingClientRect();
          if (r.top >= appliedInfo.labelRect.top - 4) return false;
          if (appliedInfo.container && appliedInfo.container.contains(el)) return false;
        }
        const txt = normalizeFilterText(el.innerText || el.textContent);
        if (!txt || txt.length > 60 || txt.includes("filtros aplicados")) return false;
        return txt === targetNorm || txt.startsWith(`${targetNorm} `) || txt.startsWith(`${targetNorm}
`) || targetPrefix.length >= 5 && txt.startsWith(targetPrefix) && /\bselecionad/.test(txt);
      });
      const containers = [];
      for (const el of matches) {
        let cur = el;
        let chosen = null;
        for (let depth = 0; depth < 5 && cur && cur !== document.body; depth++) {
          const r = cur.getBoundingClientRect();
          if (r.width >= 110 && r.width <= 420 && r.height >= 28 && r.height <= 65) {
            if (cur.matches('button, [role="button"], [role="combobox"], .q-select, .q-field, div')) {
              chosen = cur;
              if (cur.matches('button, [role="button"], [role="combobox"], .q-select, .q-field')) break;
            }
          }
          cur = cur.parentElement;
        }
        if (chosen) containers.push(chosen);
      }
      const unique = Array.from(new Set(containers));
      unique.sort((a, b) => {
        const aClickable = a.matches('button, [role="button"], [role="combobox"], .q-select, .q-field') ? 0 : 1;
        const bClickable = b.matches('button, [role="button"], [role="combobox"], .q-select, .q-field') ? 0 : 1;
        if (aClickable !== bClickable) return aClickable - bClickable;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.width * ra.height - rb.width * rb.height;
      });
      return unique[0] || null;
    }
    function findMenuFilterInput() {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"])')).filter((el) => !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(el));
      return inputs.find((el) => {
        const meta = normalizeFilterText(`${el.placeholder || ""} ${el.getAttribute("aria-label") || ""} ${el.name || ""}`);
        if (!meta || meta.includes("filtrar carreiras") || meta.includes("palavra chave")) return false;
        return meta.includes("digite para filtrar");
      }) || null;
    }
    function getMenuContainer(filterInput) {
      if (!filterInput) return null;
      let container = filterInput.closest('.q-menu, [role="listbox"], .v-menu__content, .dropdown-menu');
      if (!container) {
        let cur = filterInput.parentElement;
        for (let depth = 0; depth < 6 && cur && cur !== document.body; depth++) {
          const r = cur.getBoundingClientRect();
          if (r.height >= 100 && r.width >= 160 && r.width <= 650) {
            container = cur;
            break;
          }
          cur = cur.parentElement;
        }
      }
      return container;
    }
    function hasNoSearchResultsInMenu(filterInput) {
      const container = getMenuContainer(filterInput) || filterInput?.parentElement?.parentElement;
      if (!container) return false;
      const txt = normalizeFilterText(container.innerText || container.textContent);
      return txt.includes("pesquisa sem resultados") || txt.includes("nenhum resultado");
    }
    function findDropdownOptionElements(filterInput) {
      const container = getMenuContainer(filterInput);
      if (!container) return [];
      const inputRect = filterInput.getBoundingClientRect();
      const rawCandidates = Array.from(container.querySelectorAll('label, li, [role="option"], [role="menuitem"], [role="checkbox"], .q-item, div')).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || el === filterInput || el.contains(filterInput) || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.top < inputRect.bottom - 4) return false;
        if (r.width < 80 || r.height < 18 || r.height > 84) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        if (!txt || txt === "digite para filtrar") return false;
        return true;
      });
      const checkboxSel = 'input[type="checkbox"], [role="checkbox"], .q-checkbox, .q-checkbox__inner';
      const candidates = Array.from(new Set(rawCandidates.map((el) => {
        if (el.querySelector(checkboxSel)) return el;
        const elNorm = normalizeFilterText(el.innerText || el.textContent);
        let parent = el.parentElement;
        for (let depth = 0; depth < 2 && parent && parent !== container && container.contains(parent); depth++) {
          if (parent !== filterInput && !parent.contains(filterInput) && !parent.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(parent) && normalizeFilterText(parent.innerText || parent.textContent) === elNorm && parent.querySelector(checkboxSel)) {
            return parent;
          }
          parent = parent.parentElement;
        }
        return el;
      })));
      const leafCandidates = candidates.filter((el) => {
        const elTxt = normalizeFilterText(el.innerText || el.textContent);
        return !candidates.some((other) => {
          if (other === el || !el.contains(other)) return false;
          const otherTxt = normalizeFilterText(other.innerText || other.textContent);
          return Boolean(otherTxt && otherTxt !== elTxt);
        });
      });
      const anyHasCheckbox = leafCandidates.some((el) => Boolean(findCheckboxInRowOrParent(el)));
      if (anyHasCheckbox) {
        return leafCandidates.filter((el) => Boolean(findCheckboxInRowOrParent(el)));
      }
      return leafCandidates;
    }
    function hasWholeStartMatch(text, term) {
      if (!text || !term) return false;
      if (!text.startsWith(term)) return false;
      if (term.length > 4 || text.length === term.length) return true;
      return /[^a-z0-9]/.test(text.charAt(term.length));
    }
    function hasWholeTermMatch(text, term) {
      if (!text || !term) return false;
      if (term.length <= 4) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(text);
      }
      return text.includes(term);
    }
    function scoreOptionMatch(optionText, searchTerms, opts = {}) {
      const primaryOptionText = stripAmendedLawTail(optionText) || optionText;
      const normOpt = normalizeFilterText(primaryOptionText);
      const stemOpt = normalizeStemText(primaryOptionText);
      if (!normOpt) return 0;
      const validTerms = Array.isArray(searchTerms) ? searchTerms.map((t) => normalizeFilterText(t)).filter(Boolean) : [];
      if (validTerms.length === 0) return 0;
      const optLawIds = getMatchingSpecialLawIds(primaryOptionText, { primaryOnly: true });
      if (optLawIds.length > 0) {
        if (opts.allowedLawIds instanceof Set && opts.allowedLawIds.size > 0) {
          if (!optLawIds.some((id) => opts.allowedLawIds.has(id))) {
            return 0;
          }
        }
        const searchLawIds = getMatchingSpecialLawIds(validTerms.join(" "));
        if (!optLawIds.some((id) => searchLawIds.includes(id))) {
          return 0;
        }
      }
      const optStemWords = new Set(normalizeStemText(normOpt.replace(/[^a-z0-9]+/g, " ")).split(" ").filter(Boolean));
      const searchStemJoined = normalizeStemText(validTerms.join(" ").replace(/[^a-z0-9]+/g, " "));
      const searchStemWords = new Set(searchStemJoined.split(" ").filter(Boolean));
      for (const family of CONFLICTING_QUALIFIER_FAMILIES) {
        const optHasFamily = family.some((w) => optStemWords.has(w));
        if (optHasFamily && !family.some((w) => searchStemWords.has(w))) {
          return 0;
        }
      }
      const normOptWithoutLeiPrefix = normOpt.replace(/^(?:lei|decreto(?:-lei)?|lc)\s*(?:complementar\s*)?(?:n\.?[oº°.]?\s*|numero\s+)?/, "").trim();
      const stemOptWithoutLeiPrefix = normalizeStemText(normOptWithoutLeiPrefix);
      const normOptBase = normOpt.replace(/\s*\([^)]*\)/g, " ").replace(/[.;:]+$/g, "").replace(/\s+/g, " ").trim();
      const stemOptBase = normalizeStemText(normOptBase);
      const optParenAliases = [];
      const parenRegex = /\(([^()]{2,35})\)/g;
      let pm;
      while ((pm = parenRegex.exec(normOpt)) !== null) {
        const pa = pm[1].trim();
        if (pa && !isOnlyGenericWords(pa)) optParenAliases.push(pa);
      }
      const targetConcepts = opts.targetConcepts instanceof Set && opts.targetConcepts.size > 0 ? opts.targetConcepts : new Set(extractConceptWords(validTerms[0] || ""));
      const searchConcepts = new Set(extractConceptWords(validTerms.join(" ")));
      const lessonConcepts = opts.lessonConcepts instanceof Set && opts.lessonConcepts.size > 0 ? opts.lessonConcepts : null;
      const allowedConcepts = /* @__PURE__ */ new Set([
        ...targetConcepts,
        ...searchConcepts,
        ...lessonConcepts ? lessonConcepts : []
      ]);
      const optConcepts = extractConceptWords(normOptBase || primaryOptionText);
      const matchedConcepts = optConcepts.filter((c) => targetConcepts.has(c));
      const matchedAllowed = optConcepts.filter((c) => allowedConcepts.has(c));
      const missingTargetCount = Array.from(targetConcepts).filter((c) => !optConcepts.includes(c)).length;
      const foreignConcepts = optConcepts.filter((c) => !allowedConcepts.has(c));
      const hasExactParenAliasMatch = optConcepts.length <= 1 && validTerms.some((term) => {
        const stemTerm = normalizeStemText(term);
        return optParenAliases.some((a) => a === term || stemTerm && normalizeStemText(a) === stemTerm);
      });
      if (optLawIds.length === 0 && targetConcepts.size > 0 && !hasExactParenAliasMatch) {
        if (optConcepts.length > 0 && matchedAllowed.length === 0) {
          return 0;
        }
        if (missingTargetCount > 0 && foreignConcepts.length > 0) {
          return 0;
        }
        if (targetConcepts.size >= 3 && matchedConcepts.length <= 1 && optConcepts.some((c) => !targetConcepts.has(c))) {
          return 0;
        }
      }
      const isPureConceptSubset = optConcepts.length > 0 && matchedConcepts.length === optConcepts.length;
      const isSinglePartialConcept = targetConcepts.size >= 2 && optConcepts.length === 1 && matchedConcepts.length === 1;
      const compositeConceptScore = matchedConcepts.length >= 2 && isPureConceptSubset ? 1e3 + matchedConcepts.length * 80 : 0;
      let best = 0;
      let additionalTermMatches = 0;
      for (let i = 0; i < validTerms.length; i++) {
        const term = validTerms[i];
        const stemTerm = normalizeStemText(term);
        if (!term) continue;
        if (normOpt === term || stemTerm && stemOpt === stemTerm || normOptBase && (normOptBase === term || stemTerm && stemOptBase === stemTerm)) {
          if (foreignConcepts.length === 0) {
            if (!isSinglePartialConcept && compositeConceptScore === 0) {
              return 1e3 - i;
            }
            best = Math.max(best, isSinglePartialConcept ? Math.max(1, 720 - i) : 1e3 - i);
            continue;
          }
          best = Math.max(best, 920 - i);
          continue;
        }
        if (optConcepts.length <= 1 && optParenAliases.some((a) => a === term || stemTerm && normalizeStemText(a) === stemTerm)) {
          if (foreignConcepts.length === 0) {
            if (!isSinglePartialConcept && compositeConceptScore === 0) {
              return 950 - i;
            }
            best = Math.max(best, isSinglePartialConcept ? Math.max(1, 720 - i) : 950 - i);
            continue;
          }
          best = Math.max(best, 900 - i);
          continue;
        }
        if (normOptWithoutLeiPrefix && hasWholeStartMatch(normOptWithoutLeiPrefix, term) || stemOptWithoutLeiPrefix && stemTerm && hasWholeStartMatch(stemOptWithoutLeiPrefix, stemTerm)) {
          best = Math.max(best, 900 - i);
          if (i > 0) additionalTermMatches += 1;
        } else if (hasWholeStartMatch(normOpt, term) || stemTerm && hasWholeStartMatch(stemOpt, stemTerm) || normOptBase && (hasWholeStartMatch(normOptBase, term) || stemTerm && hasWholeStartMatch(stemOptBase, stemTerm))) {
          best = Math.max(best, 800 - i);
          if (i > 0) additionalTermMatches += 1;
        } else if (hasWholeTermMatch(normOpt, term) || stemTerm && hasWholeTermMatch(stemOpt, stemTerm) || normOptBase && (hasWholeTermMatch(normOptBase, term) || stemTerm && hasWholeTermMatch(stemOptBase, stemTerm))) {
          best = Math.max(best, 600 - i);
          if (i > 0) additionalTermMatches += 1;
        } else if (normOpt.length >= 4 && !isOnlyGenericWords(normOpt) && isPureConceptSubset && (hasWholeTermMatch(term, normOpt) || stemTerm && stemOpt && hasWholeTermMatch(stemTerm, stemOpt))) {
          best = Math.max(best, 700 - i);
          if (i > 0) additionalTermMatches += 1;
        } else {
          const words = (stemTerm || term).split(" ").filter((w) => w.length >= 3);
          const hits = words.filter((w) => hasWholeTermMatch(stemOpt, w) || hasWholeTermMatch(normOpt, w)).length;
          if (hits > 0) {
            const specificWords = words.filter((w) => !GENERIC_MATCH_WORDS.has(w));
            if (specificWords.length > 0) {
              const specificHits = specificWords.filter(
                (w) => hasWholeTermMatch(stemOpt, w) || hasWholeTermMatch(normOpt, w)
              ).length;
              if (specificHits === 0) continue;
            }
            best = Math.max(best, Math.round(hits / Math.max(1, words.length) * 450) - i);
          }
        }
      }
      if (best > 0) {
        if (additionalTermMatches > 0) {
          best += Math.min(60, additionalTermMatches * 15);
        }
        if (compositeConceptScore > 0) {
          best = Math.max(best, compositeConceptScore);
        }
        if (optLawIds.length === 0 && targetConcepts.size > 0 && matchedConcepts.length === 0 && !hasExactParenAliasMatch) {
          best = Math.min(best, 350);
        }
        if (missingTargetCount === 0 && foreignConcepts.length > 0 && compositeConceptScore === 0 && best > 500) {
          best -= Math.min(120, foreignConcepts.length * 25);
        }
        if (isSinglePartialConcept && best > 720) {
          best = 720;
        }
      }
      return best;
    }
    async function closeOpenDropdown(trigger, filterInput) {
      if (!findMenuFilterInput()) return;
      if (filterInput && hasNoSearchResultsInMenu(filterInput)) {
        setNativeInputValue(filterInput, "");
        await sleepMs(160);
      }
      const activeInput = findMenuFilterInput() || filterInput;
      if (activeInput) {
        activeInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
      }
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
      await sleepMs(150);
      if (!findMenuFilterInput()) return;
      const menuContainer = getMenuContainer(findMenuFilterInput() || filterInput);
      const neutralHeading = Array.from(document.querySelectorAll("h1, h2, h3, h4, div, span, p")).find((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        if (menuContainer && menuContainer.contains(el)) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === "banco de questoes" || txt === "carreiras" || txt === "filtros";
      });
      if (neutralHeading) {
        clickElementRealistically(neutralHeading);
        await sleepMs(150);
      }
      if (findMenuFilterInput()) {
        const pointEl = document.elementFromPoint(15, 150);
        if (pointEl && !pointEl.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && (!menuContainer || !menuContainer.contains(pointEl)) && !pointEl.closest("a, button")) {
          clickElementRealistically(pointEl);
          await sleepMs(150);
        }
      }
      if (findMenuFilterInput()) {
        const bodyEvt = { bubbles: true, cancelable: true, view: window, clientX: 15, clientY: 150 };
        try {
          document.body.dispatchEvent(new MouseEvent("mousedown", bodyEvt));
        } catch (_) {
        }
        try {
          document.body.dispatchEvent(new MouseEvent("mouseup", bodyEvt));
        } catch (_) {
        }
        document.body.click();
        await sleepMs(180);
      }
      if (findMenuFilterInput() && trigger && (!menuContainer || !trigger.contains(menuContainer))) {
        clickElementRealistically(trigger);
        await sleepMs(180);
      }
    }
    const GENERIC_INDEX_LINES = /* @__PURE__ */ new Set([
      "introducao",
      "apresentacao",
      "abertura",
      "encerramento",
      "conclusao",
      "finalizacao",
      "consideracoes finais",
      "duvidas",
      "recados",
      "avisos",
      "revisao",
      "resumo",
      "exercicios",
      "questoes",
      "simulado",
      "inicio",
      "fim",
      "boas vindas",
      "bizus da aula",
      "resumo da aula",
      "topicos da aula",
      "assuntos da aula",
      "pontos importantes",
      "quadro resumo",
      "mapa mental"
    ]);
    const LEADING_INDEX_FILLER_REGEX = /^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o)\s+entre|comparativo\s+(?:entre|de|da|do)|quadro\s+comparativo\s+(?:entre|de|da|do)|rela[cç][aã]o\s+entre|conceitos?\s+e\s+caracter[ií]sticas\s+(?:de|da|do|dos|das)|conceitos?\s+(?:de|da|do|dos|das|sobre)|defini[cç][aã]o\s+(?:de|da|do|dos|das)|defini[cç][oõ]es\s+(?:de|da|do|dos|das)|resumo\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das)|aspectos?\s+(?:gerais|iniciais|principais)\s+(?:de|da|do|dos|das)|vis[aã]o\s+geral\s+(?:de|da|do)|entendendo\s+(?:a|o|as|os)|compreendendo\s+(?:a|o|as|os)|o\s+que\s+[eé])\s+/i;
    const BROAD_PARENT_PREFIX_REGEX = /^(?:organiza[cç][aã]o\s+(?:da|do|de)|conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das))\s+/i;
    const PURE_ARTICLE_LINE_REGEX = /^(?:revoga[cç][aã]o\s+(?:do|da|dos|das)\s+|leitura\s+(?:do|da|dos|das)\s+|coment[aá]rios?\s+(?:ao|sobre|do|dos)\s+|an[aá]lise\s+(?:do|dos)\s+)?art(?:igo)?s?\.?\s*(\d+)/i;
    function buildBroadParentNorms(contextNames = []) {
      const broad = /* @__PURE__ */ new Set();
      for (const name of Array.isArray(contextNames) ? contextNames : [contextNames]) {
        const raw = String(name || "").trim();
        if (!raw) continue;
        const stripped = raw.replace(/\s*[-–—]\s*(?:parte|aula|bloco|modulo)\s*\d+\s*$/i, "").trim();
        for (const candidate of [raw, stripped]) {
          if (getSpecialLawSearchTerms(candidate).length > 0) continue;
          const norm = normalizeCourseIndexKey(candidate);
          if (norm) broad.add(norm);
          let cur = candidate;
          for (let i = 0; i < 2; i++) {
            const next = cur.replace(BROAD_PARENT_PREFIX_REGEX, "").trim();
            const nextNorm = normalizeCourseIndexKey(next);
            if (nextNorm && nextNorm !== normalizeCourseIndexKey(cur)) {
              if (getSpecialLawSearchTerms(next).length === 0) {
                broad.add(nextNorm);
              }
              cur = next;
            } else {
              break;
            }
          }
        }
      }
      return broad;
    }
    const PROSE_NOTE_PREFIX_REGEX = /^(?:obs(?:erva[cç][aã]o)?|aten[cç][aã]o|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|s[uú]mula|importante)\s*[:\-–]/i;
    function parseCourseIndexSubtopics(rawText, contextNames = []) {
      const input = String(rawText || "").trim();
      if (!input) return [];
      const normalizedBlock = input.replace(/([^\n])\s*(\[\d{1,2}:\d{2}(?::\d{2})?\])/g, "$1\n$2");
      const rawLines = normalizedBlock.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const mergedLines = [];
      for (let i = 0; i < rawLines.length; i++) {
        const cur = rawLines[i];
        if ((/^[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?$/.test(cur) || /^\d{1,2}\s*[.)\-–—]$/.test(cur)) && i + 1 < rawLines.length) {
          mergedLines.push(`${cur} ${rawLines[i + 1]}`);
          i += 1;
        } else {
          mergedLines.push(cur);
        }
      }
      const hasTimestamps = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(input);
      const isNumberedBizusFormat = !hasTimestamps && mergedLines.some((l) => /^\s*\d{1,2}\s*[.)\-–—]\s+[A-Za-zÀ-ÿ]/.test(l));
      const linesToProcess = isNumberedBizusFormat ? mergedLines.filter((l) => /^\s*\d{1,2}\s*[.)\-–—]\s+\S+/.test(l)) : mergedLines;
      const broadContext = buildBroadParentNorms(contextNames);
      const contextText = (Array.isArray(contextNames) ? contextNames : [contextNames]).filter(Boolean).join(" ");
      const mainLawIds = new Set(getMatchingSpecialLawIds(contextText));
      const results = [];
      const seenNorm = /* @__PURE__ */ new Set();
      for (const rawLine of linesToProcess) {
        const rawNorm = normalizeCourseIndexKey(rawLine);
        if (!rawNorm || rawNorm === "indice" || rawNorm === "charlie" || rawNorm === "bizus" || rawNorm === "arquivos" || rawNorm === "comentarios") {
          continue;
        }
        const hadIntroPrefix = /^(?:[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*|\d{1,2}\s*[.)\-–—]\s*)?introdu[cç][aã]o\b/i.test(rawLine);
        let cleaned = rawLine.replace(/^[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*[-–—:|]*\s*/, "").replace(/^(?:[-•*●▪◦]|\d{1,2}\s*[.)\-–—])\s+/, "").replace(/\bademi\s+publica\b/gi, "Administração Pública").replace(/\bademi\b/gi, "Administração").replace(/\badm\.?\s+publica\b/gi, "Administração Pública").replace(/\badm\.?\b/gi, "Administração").replace(/\bconst\.?\s+federal\b/gi, "Constituição Federal").replace(/\bcf\b(?=\s|$|[.,])/gi, "Constituição Federal").replace(/\bctb\b(?=\s|$|[.,])/gi, "Código de Trânsito Brasileiro").replace(/\s+/g, " ").trim();
        if (!cleaned) continue;
        if (PROSE_NOTE_PREFIX_REGEX.test(cleaned)) continue;
        if (isNumberedBizusFormat) {
          let didTruncateColon = false;
          const colonIdx = cleaned.indexOf(":");
          if (colonIdx > 2 && colonIdx < cleaned.length - 1) {
            const beforeColon = cleaned.slice(0, colonIdx).trim();
            const afterColon = cleaned.slice(colonIdx + 1).trim();
            const afterWords = afterColon.split(/\s+/).filter(Boolean).length;
            if (normalizeCourseIndexKey(beforeColon).length >= 3 && (afterColon.length > 25 || afterWords > 4)) {
              cleaned = beforeColon;
              didTruncateColon = true;
            }
          }
          if (!didTruncateColon) {
            const dashMatch = cleaned.match(/^(.+?)\s+[-–—]\s+(.+)$/);
            if (dashMatch) {
              const beforeDash = dashMatch[1].trim();
              const afterDash = dashMatch[2].trim();
              const beforeNorm = normalizeCourseIndexKey(beforeDash);
              const afterWords = afterDash.split(/\s+/).filter(Boolean).length;
              if (beforeNorm.length >= 4 && !PURE_ARTICLE_LINE_REGEX.test(beforeDash) && !LEADING_INDEX_FILLER_REGEX.test(beforeDash) && !isOnlyGenericWords(beforeDash) && (afterDash.length > 35 || afterWords > 6)) {
                cleaned = beforeDash;
              }
            }
          }
          cleaned = cleaned.replace(/\s*\([^()]{28,}\)\s*$/g, "").trim();
          cleaned = cleaned.replace(/[:;.\-–—]+$/g, "").trim();
          if (!cleaned) continue;
        }
        if (cleaned.length > 85 || /\.\s*$/.test(cleaned) && cleaned.split(/\s+/).length > 8) {
          continue;
        }
        if (mainLawIds.size > 0) {
          const lineLawIds = getMatchingSpecialLawIds(cleaned);
          if (lineLawIds.some((id) => !mainLawIds.has(id))) {
            continue;
          }
        }
        let norm = normalizeCourseIndexKey(cleaned);
        if (!norm || norm.length < 3 || GENERIC_INDEX_LINES.has(norm) || /^(?:parte|aula|bloco|modulo)\s*\d+$/.test(norm) || broadContext.has(norm)) {
          continue;
        }
        const artMatch = cleaned.match(PURE_ARTICLE_LINE_REGEX);
        if (artMatch) {
          const artNum = artMatch[1];
          const isLandmarkArticle = ["5", "37", "144"].includes(artNum);
          const hasSpecialLawMention = getSpecialLawSearchTerms(cleaned).length > 0;
          if (!isLandmarkArticle && !hasSpecialLawMention) {
            continue;
          }
        }
        const strippedCore = cleaned.replace(LEADING_INDEX_FILLER_REGEX, "").trim();
        const strippedNorm = normalizeCourseIndexKey(strippedCore);
        if (strippedCore && strippedNorm.length >= 4) {
          if (hadIntroPrefix && strippedNorm.split(" ").length === 1 && strippedNorm.length < 10) {
            continue;
          }
          cleaned = strippedCore;
          norm = strippedNorm;
        }
        if (!norm || norm.length < 3 || GENERIC_INDEX_LINES.has(norm) || broadContext.has(norm)) {
          continue;
        }
        const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        if (!seenNorm.has(norm)) {
          seenNorm.add(norm);
          results.push(formatted);
        }
      }
      return results;
    }
    function expandSubtopicToSearchGroups(subtopic) {
      const clean = normalizeFilterText(subtopic).replace(/\bademi\b/g, "administracao").replace(/\badm\b/g, "administracao").replace(/\s+/g, " ").trim();
      if (!clean) return { primary: [], splitFallbacks: [] };
      const primary = [];
      const pushPrimary = (t) => {
        const s = normalizeFilterText(t).replace(/\s+/g, " ").trim();
        if (s && !primary.includes(s)) primary.push(s);
      };
      const extraSplits = [];
      const seenSplitKeys = /* @__PURE__ */ new Set();
      const pushSplit = (arr) => {
        const cleanArr = (Array.isArray(arr) ? arr : [arr]).map((x) => normalizeFilterText(x).replace(/\s+/g, " ").trim()).filter(Boolean);
        if (cleanArr.length === 0) return;
        const key = cleanArr.join("|");
        if (!seenSplitKeys.has(key)) {
          seenSplitKeys.add(key);
          extraSplits.push(cleanArr);
        }
      };
      const lawTerms = getSpecialLawSearchTerms(clean);
      const withoutParens = clean.replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
      const parenTerms = [];
      for (const pm of clean.matchAll(/\(([^()]{3,35})\)/g)) {
        const pt = pm[1].replace(/\s+/g, " ").trim();
        if (pt && pt.length >= 3 && !isOnlyGenericWords(pt) && !parenTerms.includes(pt)) {
          parenTerms.push(pt);
        }
      }
      const dashParts = String(subtopic || "").split(/\s*[-–—:]\s*/).map((p) => normalizeFilterText(p).replace(/\bademi\b/g, "administracao").replace(/\badm\b/g, "administracao").replace(/\s+/g, " ").trim()).filter(Boolean);
      if (dashParts.length > 1) {
        const leftIsGeneric = isOnlyGenericWords(dashParts[0]) || LEADING_INDEX_FILLER_REGEX.test(dashParts[0]);
        if (!leftIsGeneric && dashParts[0].length >= 3) {
          pushPrimary(dashParts[0]);
          const leftNoParen = dashParts[0].replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
          if (leftNoParen && leftNoParen !== dashParts[0] && !isOnlyGenericWords(leftNoParen)) {
            pushPrimary(leftNoParen);
          }
        }
        const rightJoined = dashParts.slice(1).join(" ").trim();
        if (rightJoined.length >= 3 && !isOnlyGenericWords(rightJoined)) {
          pushPrimary(rightJoined);
        }
      }
      pushPrimary(clean);
      if (withoutParens && withoutParens !== clean && withoutParens.length >= 3 && !isOnlyGenericWords(withoutParens)) {
        pushPrimary(withoutParens);
      }
      const descriptivePrefixRegex = /^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o)\s+entre|comparativo\s+(?:entre|de|da|do)|quadro\s+comparativo\s+(?:entre|de|da|do)|rela[cç][aã]o\s+entre|conceitos?\s+e\s+caracter[ií]sticas\s+(?:de|da|do|dos|das)|conceitos?|nocoes|definicoes|definicao|especies|formas|tipos|classificacao|caracteristicas|atributos|elementos|requisitos|regras|modalidades|principios|aspectos|estudo|teoria\s+geral)\s+(?:de|da|do|dos|das|sobre|entre)?\s*/i;
      const prefixLessCandidates = [];
      for (const candidate of [clean, withoutParens]) {
        if (!candidate) continue;
        const withoutPrefix = candidate.replace(descriptivePrefixRegex, "").trim();
        if (withoutPrefix && withoutPrefix !== candidate && withoutPrefix.length >= 4 && !isOnlyGenericWords(withoutPrefix)) {
          pushPrimary(withoutPrefix);
          if (!prefixLessCandidates.includes(withoutPrefix)) prefixLessCandidates.push(withoutPrefix);
        }
      }
      const trailingSubjectQualifierRegex = /\s+(?:administrativa|administrativo|publica|publico|constitucional|penal|processual|civil|especial|geral|gerais)$/i;
      for (const candidate of [clean, withoutParens, ...prefixLessCandidates]) {
        if (!candidate) continue;
        const withoutSuffix = candidate.replace(trailingSubjectQualifierRegex, "").trim();
        if (withoutSuffix && withoutSuffix !== candidate && withoutSuffix.length >= 4 && !isOnlyGenericWords(withoutSuffix)) {
          pushPrimary(withoutSuffix);
        }
      }
      if (lawTerms.length === 0) {
        parenTerms.forEach((pt) => {
          pushPrimary(pt);
          pushSplit([pt]);
        });
        for (const candidate of [withoutParens, ...prefixLessCandidates, clean]) {
          if (!candidate) continue;
          const prepMatch = candidate.match(/^(.+?)\s+(?:por|em|nos?|nas?|quanto\s+a)\s+(.+)$/i);
          if (prepMatch) {
            const coreConcept = prepMatch[1].trim();
            if (coreConcept.length >= 5 && !isOnlyGenericWords(coreConcept)) {
              pushPrimary(coreConcept);
              pushSplit([coreConcept]);
            }
          }
        }
      }
      if (lawTerms.length === 0) {
        const enumItems = extractEnumeratedSubitemsFromLesson(subtopic);
        if (enumItems.length >= 2) {
          enumItems.forEach((item) => {
            pushPrimary(item);
            pushSplit([item]);
          });
        }
      }
      if (clean.includes("administracao publica direta e indireta")) {
        pushPrimary("administracao direta e indireta");
      }
      if (clean.includes("teoria do orgao")) {
        pushPrimary("orgaos publicos");
        pushPrimary("orgao publico");
      }
      if (clean.includes("terceiro setor")) {
        pushPrimary("terceiro setor");
        pushPrimary("entidades paraestatais");
        pushPrimary("paraestatais");
      }
      if (clean.includes("por servico")) {
        pushPrimary("outorga");
        pushPrimary("descentralizacao por servico");
      }
      if (clean.includes("por colaboracao")) {
        pushPrimary("delegacao");
        pushPrimary("descentralizacao por colaboracao");
      }
      if (clean.includes("ministerios")) {
        pushPrimary("ministerios");
      }
      if (clean.includes("poder regulamentar")) {
        pushPrimary("poder normativo");
        pushSplit(["poder normativo"]);
      } else if (clean.includes("poder normativo")) {
        pushPrimary("poder regulamentar");
        pushSplit(["poder regulamentar"]);
      }
      if (/\bnavegador(?:es)?\b/.test(clean)) {
        pushPrimary("browsers");
      } else if (/\bbrowsers?\b/.test(clean)) {
        pushPrimary("navegadores");
      }
      if (clean.includes("correio eletronico")) {
        pushPrimary("e-mail");
        pushPrimary("webmail");
      } else if (/\b(?:e-?mail|webmail)\b/.test(clean)) {
        pushPrimary("correio eletronico");
      }
      if (clean.includes("computacao em nuvem")) {
        pushPrimary("cloud computing");
      } else if (clean.includes("cloud computing")) {
        pushPrimary("computacao em nuvem");
      }
      if (clean.includes("copia de seguranca")) {
        pushPrimary("backup");
      } else if (/\bbackup\b/.test(clean)) {
        pushPrimary("copia de seguranca");
      }
      if (clean.includes("excludentes de ilicitude") || clean.includes("excludente de ilicitude")) {
        pushPrimary("exclusao da ilicitude");
        pushPrimary("causas de exclusao da ilicitude");
      } else if (clean.includes("exclusao da ilicitude")) {
        pushPrimary("excludentes de ilicitude");
      }
      if (clean.includes("concurso de pessoas")) {
        pushPrimary("coautoria e participacao");
      } else if (clean.includes("coautoria") && clean.includes("participacao")) {
        pushPrimary("concurso de pessoas");
      }
      if (lawTerms.length > 0) {
        if (/\beca\b/.test(clean)) {
          pushPrimary(clean.replace(/\beca\b/g, "estatuto da crianca e do adolescente"));
          if (/\bcrimes?\b/.test(clean)) {
            pushPrimary("crimes contra a crianca e o adolescente");
          }
        } else if (/\bctb\b/.test(clean)) {
          pushPrimary(clean.replace(/\bctb\b/g, "codigo de transito brasileiro"));
        } else if (/\blep\b/.test(clean)) {
          pushPrimary(clean.replace(/\blep\b/g, "lei de execucao penal"));
        } else if (/\blia\b/.test(clean)) {
          pushPrimary(clean.replace(/\blia\b/g, "improbidade administrativa"));
        }
        lawTerms.forEach((t) => {
          pushPrimary(t);
          pushSplit([t]);
        });
      }
      if (clean.includes("direta") && clean.includes("indireta")) {
        pushSplit(["administracao direta"]);
        pushSplit(["administracao indireta"]);
      }
      if (clean.includes("desconcentracao") && (clean.includes("descentralizacao") || clean.includes("orgao"))) {
        pushSplit(["desconcentracao"]);
        if (clean.includes("descentralizacao")) pushSplit(["descentralizacao"]);
        if (clean.includes("orgao")) pushSplit(["orgaos publicos", "teoria do orgao"]);
      } else if (clean.includes("concentracao") && clean.includes("descentralizacao")) {
        pushSplit(["concentracao", "centralizacao"]);
        pushSplit(["descentralizacao"]);
      }
      if (clean.includes("terceiro setor") && clean.includes("entidades")) {
        pushSplit(["terceiro setor", "paraestatais"]);
      }
      return { primary, splitFallbacks: extraSplits };
    }
    function findScrollableMenuElement(filterInput) {
      const container = getMenuContainer(filterInput);
      if (!container) return null;
      const candidates = [container, ...Array.from(container.querySelectorAll("div, ul, section"))];
      for (const el of candidates) {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud")) continue;
        if ((el.scrollHeight || 0) > (el.clientHeight || 0) + 8) {
          return el;
        }
      }
      return container;
    }
    function buildTreeCacheHash(options) {
      const list = Array.isArray(options) ? options : [];
      const first = list[0]?.norm || "";
      const last = list[list.length - 1]?.norm || "";
      return `${list.length}:${first}:${last}`;
    }
    function loadSubjectTreeCache(subjectName) {
      return new Promise((resolve) => {
        try {
          const key = normalizeCourseIndexKey(subjectName || "");
          if (!key || !isExtensionContextValid() || !chrome?.storage?.local) {
            resolve(null);
            return;
          }
          chrome.storage.local.get([SUBJECT_TREE_CACHE_KEY], (res) => {
            const store = res && res[SUBJECT_TREE_CACHE_KEY] && typeof res[SUBJECT_TREE_CACHE_KEY] === "object" ? res[SUBJECT_TREE_CACHE_KEY] : {};
            const entry = store[key];
            const maxAgeMs = 14 * 24 * 60 * 60 * 1e3;
            if (entry && Array.isArray(entry.nodes) && entry.nodes.length > 0 && Date.now() - (entry.scannedAt || 0) < maxAgeMs) {
              resolve(entry);
              return;
            }
            resolve(null);
          });
        } catch (_) {
          resolve(null);
        }
      });
    }
    function saveSubjectTreeCache(subjectName, options) {
      try {
        const key = normalizeCourseIndexKey(subjectName || "");
        if (!key || !Array.isArray(options) || options.length < 3 || !isExtensionContextValid() || !chrome?.storage?.local) return;
        const treeMatcher = typeof globalThis !== "undefined" && globalThis.QGCaveiraTreeMatcher ? globalThis.QGCaveiraTreeMatcher : null;
        const nonLeafNodes = options.filter((o) => !treeMatcher || !treeMatcher.isLeafArticleLabel(o.label)).map((o) => ({ label: o.label, norm: o.norm }));
        if (nonLeafNodes.length < 2) return;
        chrome.storage.local.get([SUBJECT_TREE_CACHE_KEY], (res) => {
          if (chrome.runtime?.lastError) return;
          const store = res && res[SUBJECT_TREE_CACHE_KEY] && typeof res[SUBJECT_TREE_CACHE_KEY] === "object" ? { ...res[SUBJECT_TREE_CACHE_KEY] } : {};
          store[key] = {
            subjectName,
            scannedAt: Date.now(),
            hash: buildTreeCacheHash(nonLeafNodes),
            nodes: nonLeafNodes
          };
          const entries = Object.entries(store);
          const payload = entries.length > 35 ? Object.fromEntries(entries.sort((a, b) => (b[1]?.scannedAt || 0) - (a[1]?.scannedAt || 0)).slice(0, 35)) : store;
          chrome.storage.local.set({ [SUBJECT_TREE_CACHE_KEY]: payload }, () => {
            void chrome.runtime?.lastError;
          });
        });
      } catch (_) {
      }
    }
    async function collectAllDropdownOptionsByScroll(filterInput, subjectName = "") {
      if (!filterInput) return { options: [], scrollSteps: 0, isVirtualized: false, fromCache: false };
      try {
        if (filterInput.value) {
          filterInput.focus();
          setNativeInputValue(filterInput, "");
          await sleepMs(260);
        }
      } catch (_) {
      }
      const initialVisible = findDropdownOptionElements(filterInput);
      const firstVisibleNorm = initialVisible[0] ? normalizeCourseIndexKey(initialVisible[0].innerText || initialVisible[0].textContent) : "";
      if (subjectName) {
        const cached = await loadSubjectTreeCache(subjectName);
        if (cached && Array.isArray(cached.nodes) && cached.nodes.length >= 3) {
          const cachedFirst = cached.nodes[0]?.norm || "";
          if (!firstVisibleNorm || !cachedFirst || firstVisibleNorm === cachedFirst) {
            return {
              options: cached.nodes.map((n) => ({ label: n.label, norm: n.norm, el: null })),
              scrollSteps: 0,
              isVirtualized: true,
              fromCache: true
            };
          }
        }
      }
      const collected = /* @__PURE__ */ new Map();
      const collectVisible = () => {
        const visible = findDropdownOptionElements(filterInput);
        for (const el of visible) {
          const label = String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
          const norm = normalizeCourseIndexKey(label);
          if (!norm) continue;
          if (!collected.has(norm)) {
            collected.set(norm, { label, norm, el });
          } else {
            const prev = collected.get(norm);
            if (!prev.el || !prev.el.isConnected) prev.el = el;
          }
        }
        return visible.length;
      };
      collectVisible();
      const scrollEl = findScrollableMenuElement(filterInput);
      let scrollSteps = 0;
      let isVirtualized = false;
      if (scrollEl && (scrollEl.scrollHeight || 0) > (scrollEl.clientHeight || 0) + 8) {
        const stepPx = Math.max(120, Math.floor((scrollEl.clientHeight || 240) * 0.75));
        const maxScrollTop = Math.max(0, (scrollEl.scrollHeight || 0) - (scrollEl.clientHeight || 0));
        let prevTop = -1;
        let curTop = scrollEl.scrollTop || 0;
        for (let i = 0; i < 45 && curTop < maxScrollTop - 2; i++) {
          if (isDestroyed) break;
          const nextTop = Math.min(maxScrollTop, curTop + stepPx);
          if (nextTop === prevTop || nextTop === curTop) break;
          prevTop = curTop;
          scrollEl.scrollTop = nextTop;
          scrollSteps += 1;
          await sleepMs(55);
          collectVisible();
          curTop = scrollEl.scrollTop || nextTop;
        }
        try {
          scrollEl.scrollTop = 0;
          await sleepMs(40);
        } catch (_) {
        }
        for (const entry of collected.values()) {
          if (!entry.el || !entry.el.isConnected) {
            isVirtualized = true;
            break;
          }
        }
      }
      const finalOptions = Array.from(collected.values());
      if (subjectName && finalOptions.length >= 3) {
        saveSubjectTreeCache(subjectName, finalOptions);
      }
      return {
        options: finalOptions,
        scrollSteps,
        isVirtualized,
        fromCache: false
      };
    }
    function readAppliedFiltersFromDom() {
      const result = { status: "", disciplina: "", assuntos: [] };
      const appliedInfo = findAppliedFiltersSection();
      if (!appliedInfo || !appliedInfo.container) return result;
      const cleanChipText = (raw) => String(raw || "").replace(/\b(close|cancel|clear|highlight_off)\b/gi, " ").replace(/[✕×]/g, " ").replace(/\s+/g, " ").trim();
      const blocks = Array.from(appliedInfo.container.querySelectorAll("div, span, li, p")).filter((el) => el && !el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(el));
      const seenAssuntos = /* @__PURE__ */ new Set();
      for (const block of blocks) {
        const rawText = String(block.innerText || block.textContent || "").replace(/\s+/g, " ").trim();
        const strippedRaw = rawText.replace(/^(?:close|cancel|clear|highlight_off|✕|×|x)\s+/i, "").trim();
        const norm = normalizeFilterText(strippedRaw);
        if (!norm || norm === "filtros aplicados" || norm === "filtros aplicados:") continue;
        if (/^disciplina\b/.test(norm) && strippedRaw.length < 180) {
          const val = cleanChipText(strippedRaw.replace(/^disciplina\s*:?\s*/i, ""));
          if (val && !result.disciplina) result.disciplina = val;
        } else if (/^status\b/.test(norm) && strippedRaw.length < 100) {
          const val = cleanChipText(strippedRaw.replace(/^status\s*:?\s*/i, ""));
          if (val && !result.status) result.status = val;
        } else if (/^assunto\b/.test(norm) && strippedRaw.length < 360) {
          const childChips = Array.from(block.querySelectorAll('.q-chip, [class*="chip"], [class*="badge"], [class*="tag"], button, span, div')).filter((ch) => {
            if (!ch || ch === block || !isElementVisible(ch)) return false;
            const ct = cleanChipText(ch.innerText || ch.textContent);
            const cn = normalizeFilterText(ct);
            if (!cn || cn === "assunto" || cn.startsWith("assunto ") || cn.length < 3) return false;
            return ch.children.length <= 2;
          }).map((ch) => cleanChipText(ch.innerText || ch.textContent)).filter(Boolean);
          if (childChips.length > 0) {
            for (const chip of childChips) {
              const cn = normalizeCourseIndexKey(chip);
              if (cn && !seenAssuntos.has(cn)) {
                seenAssuntos.add(cn);
                result.assuntos.push(chip);
              }
            }
          } else {
            const val = cleanChipText(strippedRaw.replace(/^assunto\s*:?\s*/i, ""));
            const vn = normalizeCourseIndexKey(val);
            if (vn && !seenAssuntos.has(vn)) {
              seenAssuntos.add(vn);
              result.assuntos.push(val);
            }
          }
        }
      }
      return result;
    }
    function buildFilterMemoryKeys(subject, lessonsList, fallbackTopic) {
      const keys = [];
      const pushKey = (raw) => {
        const k = normalizeCourseIndexKey(raw);
        if (k && !keys.includes(k)) keys.push(k);
      };
      const subjNorm = normalizeFilterText(subject || "");
      const lessons = Array.isArray(lessonsList) ? lessonsList.filter(Boolean) : [];
      const combined = lessons.join(" | ") || String(fallbackTopic || "").trim();
      if (combined) {
        if (subjNorm) pushKey(`${subjNorm}::${combined}`);
        pushKey(combined);
      }
      for (const l of lessons) {
        if (subjNorm) pushKey(`${subjNorm}::${l}`);
        pushKey(l);
      }
      if (fallbackTopic) {
        if (subjNorm) pushKey(`${subjNorm}::${fallbackTopic}`);
        pushKey(fallbackTopic);
      }
      return keys;
    }
    function loadFilterCorrectionMemory(subject, lessonsList, fallbackTopic) {
      return new Promise((resolve) => {
        try {
          if (!isExtensionContextValid() || !chrome?.storage?.local) {
            resolve(null);
            return;
          }
          const keys = buildFilterMemoryKeys(subject, lessonsList, fallbackTopic);
          if (keys.length === 0) {
            resolve(null);
            return;
          }
          chrome.storage.local.get([FILTER_CORRECTION_MEMORY_KEY], (res) => {
            const store = res && res[FILTER_CORRECTION_MEMORY_KEY] && typeof res[FILTER_CORRECTION_MEMORY_KEY] === "object" ? res[FILTER_CORRECTION_MEMORY_KEY] : {};
            for (const k of keys) {
              if (store[k] && Array.isArray(store[k].assuntos) && store[k].assuntos.length > 0) {
                resolve({ key: k, ...store[k] });
                return;
              }
            }
            resolve(null);
          });
        } catch (_) {
          resolve(null);
        }
      });
    }
    function saveFilterCorrectionMemory(filterCtx, appliedFilters) {
      try {
        if (!isExtensionContextValid() || !chrome?.storage?.local) return;
        if (!filterCtx || !appliedFilters || !Array.isArray(appliedFilters.assuntos) || appliedFilters.assuntos.length === 0) return;
        const effectiveSubject = appliedFilters.disciplina || filterCtx.subject || "";
        const keys = buildFilterMemoryKeys(effectiveSubject, filterCtx.lessons, filterCtx.fallbackTopic);
        if (keys.length === 0) return;
        const primaryKey = keys[0];
        chrome.storage.local.get([FILTER_CORRECTION_MEMORY_KEY], (res) => {
          const store = res && res[FILTER_CORRECTION_MEMORY_KEY] && typeof res[FILTER_CORRECTION_MEMORY_KEY] === "object" ? { ...res[FILTER_CORRECTION_MEMORY_KEY] } : {};
          store[primaryKey] = {
            subject: effectiveSubject,
            assuntos: appliedFilters.assuntos.slice(0, 12),
            lessonTitle: filterCtx.topic || filterCtx.fallbackTopic || "",
            updatedAt: Date.now()
          };
          const entries = Object.entries(store);
          if (entries.length > 300) {
            entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0));
            const trimmed = Object.fromEntries(entries.slice(0, 300));
            chrome.storage.local.set({ [FILTER_CORRECTION_MEMORY_KEY]: trimmed });
          } else {
            chrome.storage.local.set({ [FILTER_CORRECTION_MEMORY_KEY]: store });
          }
        });
      } catch (_) {
      }
    }
    async function loadCaveiraTree() {
      if (cachedCaveiraTree) return cachedCaveiraTree;
      const resolver = typeof globalThis !== "undefined" && globalThis.QGCaveiraResolver ? globalThis.QGCaveiraResolver : null;
      if (!resolver || !isExtensionContextValid() || !chrome?.runtime?.getURL) return null;
      try {
        const url = chrome.runtime.getURL("caveira_arvore.json");
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const json = await resp.json();
        let dynamicNodes = [];
        try {
          if (chrome.runtime?.sendMessage) {
            const overlayResp = await new Promise((resolve) => {
              chrome.runtime.sendMessage({ type: "DB_GET_TREE_OVERLAY" }, (r) => {
                if (chrome.runtime?.lastError) resolve(null);
                else resolve(r);
              });
            });
            if (overlayResp?.ok && Array.isArray(overlayResp.nodes)) {
              dynamicNodes = overlayResp.nodes;
            }
          }
        } catch (_) {
        }
        const { mergedJson } = mergeBaselineAndDynamicTree(json, dynamicNodes);
        cachedCaveiraTreeGeradoEm = String(mergedJson?.geradoEm || json?.geradoEm || "");
        cachedCaveiraTree = resolver.loadTree(mergedJson);
        try {
          if (chrome?.storage?.local) {
            chrome.storage.local.get([TREE_META_KEY], (mRes) => {
              if (chrome.runtime?.lastError) return;
              const prevMeta = mRes?.[TREE_META_KEY] || {};
              chrome.storage.local.set({
                [TREE_META_KEY]: {
                  ...prevMeta,
                  baselineDate: String(json?.geradoEm || cachedCaveiraTreeGeradoEm || prevMeta.baselineDate || ""),
                  mergedDate: cachedCaveiraTreeGeradoEm || prevMeta.mergedDate || "",
                  dynamicNodeCount: Math.max(dynamicNodes.length, Number(prevMeta.dynamicNodeCount) || 0),
                  loadedAt: Date.now()
                }
              });
            });
          }
        } catch (_) {
        }
        return cachedCaveiraTree;
      } catch (_) {
        return null;
      }
    }
    function stripLessonPartSuffixForMemory(txt) {
      return String(txt || "").replace(/\s*[-–—|:]\s*(?:parte|pt|aula|bloco)\s*0*\d+(?:\s*[-–—|:]\s*(?:exercicios?|teoria|revisao|resolucao))?\s*$/i, "").replace(/\s+(?:parte|pt)\s*0*\d+\s*$/i, "").trim();
    }
    function buildFilterIdMemoryKey(subject, lessonsList, fallbackTopic) {
      const subjNorm = normalizeCourseIndexKey(subject || "");
      const lessonsNorm = (Array.isArray(lessonsList) ? lessonsList : []).map(normalizeCourseIndexKey).filter(Boolean).join("|");
      const topicNorm = normalizeCourseIndexKey(fallbackTopic || "");
      return `${subjNorm}::${lessonsNorm}::${topicNorm}`;
    }
    function loadFilterIdMemory(subject, lessonsList, fallbackTopic) {
      return new Promise((resolve) => {
        try {
          if (!isExtensionContextValid() || !chrome?.storage?.local) {
            resolve(null);
            return;
          }
          const rawLessons = Array.isArray(lessonsList) ? lessonsList : [];
          const baseLessons = rawLessons.map(stripLessonPartSuffixForMemory).filter(Boolean);
          const primaryKey = buildFilterIdMemoryKey(subject, rawLessons, fallbackTopic);
          const basePrimaryKey = buildFilterIdMemoryKey(subject, baseLessons, fallbackTopic);
          const fallbackKey = buildFilterIdMemoryKey(subject, rawLessons, "");
          const baseFallbackKey = buildFilterIdMemoryKey(subject, baseLessons, "");
          chrome.storage.local.get([FILTER_ID_MEMORY_KEY], (res) => {
            if (chrome.runtime?.lastError) {
              resolve(null);
              return;
            }
            const store = res && res[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === "object" ? res[FILTER_ID_MEMORY_KEY] : {};
            const candidateKeys = [primaryKey, basePrimaryKey, fallbackKey, baseFallbackKey].filter(Boolean);
            let matchedKey = null;
            let entry = null;
            for (const k of candidateKeys) {
              if (store[k] && store[k].subjectId && Array.isArray(store[k].ids) && store[k].ids.length > 0) {
                matchedKey = k;
                entry = store[k];
                break;
              }
            }
            if (entry) {
              resolve({ key: matchedKey, ...entry });
              return;
            }
            resolve(null);
          });
        } catch (_) {
          resolve(null);
        }
      });
    }
    function saveFilterIdMemory(filterCtx, data) {
      try {
        if (!isExtensionContextValid() || !chrome?.storage?.local || !filterCtx || !data) return;
        const subjectId = Number(data.subjectId);
        const ids = Array.isArray(data.ids) ? data.ids.map(Number).filter((n) => Number.isFinite(n) && n > 0) : [];
        if (!subjectId || ids.length === 0) return;
        const rawLessons = filterCtx.lessons || [];
        const baseLessons = rawLessons.map(stripLessonPartSuffixForMemory).filter(Boolean);
        const key = buildFilterIdMemoryKey(
          filterCtx.subject || data.subjectName || "",
          rawLessons,
          filterCtx.fallbackTopic || ""
        );
        const baseKey = buildFilterIdMemoryKey(
          filterCtx.subject || data.subjectName || "",
          baseLessons,
          filterCtx.fallbackTopic || ""
        );
        chrome.storage.local.get([FILTER_ID_MEMORY_KEY], (res) => {
          if (chrome.runtime?.lastError) return;
          const store = res && res[FILTER_ID_MEMORY_KEY] && typeof res[FILTER_ID_MEMORY_KEY] === "object" ? { ...res[FILTER_ID_MEMORY_KEY] } : {};
          const entryObj = {
            subjectId,
            subjectName: data.subjectName || filterCtx.subject || "",
            ids,
            picks: Array.isArray(data.picks) ? data.picks : [],
            lessonTitle: filterCtx.topic || filterCtx.fallbackTopic || "",
            updatedAt: Date.now()
          };
          store[key] = entryObj;
          if (baseKey && baseKey !== key) {
            store[baseKey] = entryObj;
          }
          const entries = Object.entries(store);
          const payload = entries.length > 400 ? Object.fromEntries(entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0)).slice(0, 400)) : store;
          chrome.storage.local.set({ [FILTER_ID_MEMORY_KEY]: payload }, () => {
            void chrome.runtime?.lastError;
          });
        });
      } catch (_) {
      }
    }
    async function resolveIdsFromUrlOrDom(appliedDom) {
      try {
        const params = new URLSearchParams(window.location.search || "");
        const rawSubj = params.get("subject_ids") || "";
        const rawIds = params.get("subtopic_ids") || "";
        const subjectId = Number(rawSubj.split(",")[0]);
        const urlIds = rawIds.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
        if (subjectId && urlIds.length > 0) {
          const tree = await loadCaveiraTree();
          const subjObj = tree?.subjects?.get(subjectId);
          const picks = urlIds.map((id) => {
            const n = subjObj?.byId?.get(id);
            return n ? { id, name: n.name, path: n.path || [n.name] } : { id, name: String(id), path: [] };
          });
          return { subjectId, subjectName: subjObj?.name || appliedDom?.disciplina || "", ids: urlIds, picks };
        }
        if (appliedDom && appliedDom.assuntos && appliedDom.assuntos.length > 0) {
          const tree = await loadCaveiraTree();
          if (tree) {
            const resolver = globalThis.QGCaveiraResolver;
            const discNorm = normalizeCourseIndexKey(appliedDom.disciplina || "");
            let subjObj = null;
            for (const s of tree.subjects.values()) {
              if (normalizeCourseIndexKey(s.name) === discNorm) {
                subjObj = s;
                break;
              }
            }
            if (!subjObj && resolver) {
              const tempRes = resolver.resolveLesson(tree, { subjectName: appliedDom.disciplina || "", lessons: [], topic: "", subtopics: [] });
              if (tempRes?.subject?.id) subjObj = tree.subjects.get(tempRes.subject.id) || null;
            }
            if (subjObj) {
              const picks = [];
              for (const label of appliedDom.assuntos) {
                const lNorm = normalizeCourseIndexKey(label);
                const found = subjObj.nodes.find((n) => normalizeCourseIndexKey(n.name) === lNorm);
                if (found) picks.push({ id: found.id, name: found.name, path: found.path || [found.name] });
              }
              if (picks.length > 0) {
                return { subjectId: subjObj.id, subjectName: subjObj.name, ids: picks.map((p) => p.id), picks };
              }
            }
          }
        }
      } catch (_) {
      }
      return null;
    }
    const VALID_QUESTION_STATUSES = /* @__PURE__ */ new Set(["not_resolved", "resolved", "right", "wrong", ""]);
    const STATUS_LABELS = {
      not_resolved: "Não resolvidas",
      resolved: "Todas resolvidas",
      right: "Só certas",
      wrong: "Só erradas",
      "": "Todas as questões"
    };
    async function getEffectiveQuestionPrefs(filterCtx) {
      const resolver = typeof globalThis !== "undefined" && globalThis.QGCaveiraResolver ? globalThis.QGCaveiraResolver : null;
      const fromSiteStatus = typeof filterCtx?.status === "string" && VALID_QUESTION_STATUSES.has(filterCtx.status) ? filterCtx.status : null;
      const fromSite = filterCtx && (Array.isArray(filterCtx.examBoards) || Array.isArray(filterCtx.numberAlternatives));
      const fallback = resolver?.DEFAULT_PREFS || { examBoards: [], numberAlternatives: [], difficultyIds: [] };
      let saved = null;
      try {
        if (isExtensionContextValid() && chrome?.storage?.local) {
          saved = await new Promise((res) => chrome.storage.local.get([DEFAULT_PREFS_KEY], (r) => res(r?.[DEFAULT_PREFS_KEY] || null)));
        }
      } catch (_) {
      }
      const savedStatus = typeof saved?.status === "string" && VALID_QUESTION_STATUSES.has(saved.status) ? saved.status : "not_resolved";
      const status = fromSiteStatus !== null ? fromSiteStatus : savedStatus;
      const sanitizeDiff = (arr) => Array.isArray(arr) ? Array.from(new Set(arr.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 6))).sort((a, b) => a - b) : null;
      const fromSiteDiff = sanitizeDiff(filterCtx?.difficultyIds);
      const savedDiff = sanitizeDiff(saved?.difficultyIds) || [];
      const difficultyIds = fromSiteDiff !== null ? fromSiteDiff : savedDiff;
      if (fromSite) {
        return { examBoards: filterCtx.examBoards || [], numberAlternatives: filterCtx.numberAlternatives || [], difficultyIds, status, source: "site" };
      }
      if (saved && (Array.isArray(saved.examBoards) || Array.isArray(saved.numberAlternatives))) {
        return { examBoards: saved.examBoards || [], numberAlternatives: saved.numberAlternatives || [], difficultyIds, status, source: "popup" };
      }
      return { examBoards: fallback.examBoards, numberAlternatives: fallback.numberAlternatives, difficultyIds, status, source: "padrao" };
    }
    async function navigateToCaveiraDeepLink(subjectId, ids, bannerText) {
      const resolver = typeof globalThis !== "undefined" && globalThis.QGCaveiraResolver ? globalThis.QGCaveiraResolver : null;
      if (!resolver || !subjectId || !Array.isArray(ids) || ids.length === 0) return false;
      const prefs = await getEffectiveQuestionPrefs(activePracticeFilter);
      const url = resolver.buildUrl(window.location.origin, subjectId, ids, { status: prefs.status, examBoards: prefs.examBoards, numberAlternatives: prefs.numberAlternatives, difficultyIds: prefs.difficultyIds });
      const basePrefsLabel = resolver.describePrefs ? resolver.describePrefs(prefs.examBoards, prefs.numberAlternatives, prefs.difficultyIds) : "";
      const statusLabel = prefs.status !== "not_resolved" ? STATUS_LABELS[prefs.status] || prefs.status : "";
      const prefsLabel = [statusLabel, basePrefsLabel].filter(Boolean).join(" • ");
      if (bannerText && prefsLabel) bannerText = `${bannerText} • ${prefsLabel}`;
      if (lastFilterDiagnosticLog) {
        lastFilterDiagnosticLog.examBoards = prefs.examBoards;
        lastFilterDiagnosticLog.numberAlternatives = prefs.numberAlternatives;
        lastFilterDiagnosticLog.difficultyIds = prefs.difficultyIds;
        lastFilterDiagnosticLog.status = prefs.status;
        lastFilterDiagnosticLog.prefsSource = prefs.source;
        lastFilterDiagnosticLog.url = url;
      }
      let targetUrlPathSearch = "";
      try {
        const parsedUrl = new URL(url, window.location.origin);
        targetUrlPathSearch = `${parsedUrl.pathname || ""}${parsedUrl.search || ""}`;
      } catch (_) {
      }
      const diagRecord = {
        savedAt: Date.now(),
        targetUrl: targetUrlPathSearch,
        diagLog: lastFilterDiagnosticLog,
        activePracticeFilter,
        bannerText: bannerText || "",
        expectedFilter: { subjectId: Number(subjectId), ids: ids.map(Number) },
        proposedSelection: lastResolverProposed
      };
      try {
        sessionStorage.setItem(TAB_FILTER_DIAG_SESSION_KEY, JSON.stringify(diagRecord));
      } catch (_) {
      }
      try {
        if (isExtensionContextValid() && chrome?.storage?.local) {
          await new Promise((res) => {
            chrome.storage.local.set({ [LAST_FILTER_DIAG_KEY]: diagRecord }, () => res());
          });
        }
      } catch (_) {
      }
      if (bannerText) renderFilterBanner(bannerText);
      window.location.assign(url);
      return true;
    }
    function renderResolverAlternativesBox(res, filterCtx) {
      const box = getHudEl("qg-hud-resolver-box");
      const titleEl = getHudEl("qg-hud-resolver-title");
      const listEl = getHudEl("qg-hud-resolver-list");
      if (!box || !titleEl || !listEl) return;
      pendingResolverResult = res;
      let alts = Array.isArray(res?.alternatives) ? res.alternatives : [];
      let fromPicks = false;
      if (alts.length === 0 && Array.isArray(res?.picks) && res.picks.length > 0) {
        alts = res.picks.map((p) => ({ id: p.id, name: p.name, path: p.path }));
        fromPicks = true;
      }
      const subjName = res?.subject?.name || filterCtx?.subject || "";
      if (alts.length === 0) {
        titleEl.textContent = `⚠️ Não foi possível decidir automaticamente${subjName ? ` (${subjName})` : ""}.`;
        listEl.innerHTML = `<div style="color:#cbd5e1;font-size:10px;">Nenhuma alternativa segura encontrada para "${escapeHtml(filterCtx?.topic || "")}".</div>`;
        const applyAltBtn = box.querySelector("#qg-btn-apply-alt");
        if (applyAltBtn) applyAltBtn.style.display = "none";
      } else {
        const applyAltBtn = box.querySelector("#qg-btn-apply-alt");
        if (applyAltBtn) applyAltBtn.style.display = "block";
        titleEl.textContent = res?.anchorAmbiguous ? `⚠️ Múltiplas pastas compatíveis (${subjName}). Escolha:` : `⚠️ Confiança ${res?.confidence || "baixa"} (${subjName}). Escolha:`;
        listEl.innerHTML = alts.map((alt, idx) => {
          const fullPath = Array.isArray(alt.path) && alt.path.length > 0 ? alt.path.join(" › ") : alt.name;
          return `
          <label style="display:flex;align-items:flex-start;gap:6px;padding:4px 6px;border-radius:6px;background:rgba(15,23,42,0.7);border:1px solid rgba(255,255,255,0.08);cursor:pointer;">
            <input type="checkbox" data-subtopic-id="${Number(alt.id)}" data-subject-id="${Number(res?.subject?.id || 0)}" ${fromPicks || idx === 0 && alts.length === 1 ? "checked" : ""} style="margin-top:2px;flex-shrink:0;" />
            <span style="display:flex;flex-direction:column;gap:1px;line-height:1.25;">
              <strong style="color:#f8fafc;font-size:10px;">${escapeHtml(alt.name)}</strong>
              <span style="color:#94a3b8;font-size:9px;">${escapeHtml(fullPath)}</span>
            </span>
          </label>
        `;
        }).join("");
      }
      const hudEl = getHudEl("qg-caveira-hud");
      if (hudEl && hudEl.classList.contains("minimized")) {
        hudEl.classList.remove("minimized");
      }
      box.style.display = "flex";
    }
    function setupManualFilterCorrectionListener() {
      if (typeof document === "undefined" || !document.addEventListener) return;
      const onDocClick = (e) => {
        if (isDestroyed || isApplyingFilter || !activePracticeFilter) return;
        const target = e.target;
        if (!target || isEventInsideHud(e)) return;
        const btn = target.closest ? target.closest('button, [role="button"], .q-btn') : null;
        if (!btn) return;
        const txt = normalizeFilterText(btn.innerText || btn.textContent);
        const allowed = ["filtrar", "filtrar questoes", "aplicar", "aplicar filtros", "buscar", "buscar questoes", "pesquisar"];
        if (!allowed.includes(txt)) return;
        const ctxSnapshot = { ...activePracticeFilter };
        setTimeout(async () => {
          if (isDestroyed || isApplyingFilter) return;
          const applied = readAppliedFiltersFromDom();
          const resolvedIds = await resolveIdsFromUrlOrDom(applied);
          if (resolvedIds && resolvedIds.subjectId && resolvedIds.ids.length > 0) {
            if (!hasSelectionChanged(lastResolverProposed, resolvedIds)) {
              renderFilterBanner(`ℹ️ Seleção igual à proposta (nada memorizado): ${ctxSnapshot.topic || ctxSnapshot.subject}`);
              return;
            }
            saveFilterIdMemory(ctxSnapshot, resolvedIds);
            lastResolverProposed = { subjectId: resolvedIds.subjectId, ids: resolvedIds.ids };
            if (lastFilterDiagnosticLog) {
              lastFilterDiagnosticLog.manualCorrectionSaved = {
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                subjectId: resolvedIds.subjectId,
                ids: resolvedIds.ids,
                picks: resolvedIds.picks
              };
            }
            renderFilterBanner(`💾 Correção memorizada (${resolvedIds.ids.length} ID(s)): ${ctxSnapshot.topic || ctxSnapshot.subject}`);
          } else if (applied.assuntos && applied.assuntos.length > 0) {
            const proposedNames = (lastFilterDiagnosticLog?.picks || []).map((p) => normalizeFilterText(p.name || p)).filter(Boolean).sort();
            const appliedNames = applied.assuntos.map((a) => normalizeFilterText(a)).filter(Boolean).sort();
            if (proposedNames.length > 0 && proposedNames.join("|") === appliedNames.join("|")) {
              renderFilterBanner(`ℹ️ Seleção igual à proposta (nada memorizado): ${ctxSnapshot.topic || ctxSnapshot.subject}`);
              return;
            }
            saveFilterCorrectionMemory(ctxSnapshot, applied);
            renderFilterBanner(`💾 Correção memorizada (${applied.assuntos.length} assunto(s)): ${ctxSnapshot.topic || ctxSnapshot.subject}`);
          }
        }, 450);
      };
      document.addEventListener("click", onDocClick, true);
      window.addEventListener("qg-caveira-teardown", () => {
        document.removeEventListener("click", onDocClick, true);
      }, { once: true });
    }
    setupManualFilterCorrectionListener();
    async function matchOptionInOpenDropdown(filterInput, searchTerms, opts = {}) {
      const forbiddenNorms = opts.forbiddenNorms instanceof Set ? opts.forbiddenNorms : null;
      const excludeNorms = opts.excludeNorms instanceof Set ? opts.excludeNorms : null;
      const minScore = typeof opts.minScore === "number" ? opts.minScore : 200;
      const allowEmptyFallback = opts.allowEmptyFallback !== false;
      const preScannedOptions = Array.isArray(opts.preScannedOptions) ? opts.preScannedOptions : null;
      const diagLog = opts.diagLog && Array.isArray(opts.diagLog.queries) ? opts.diagLog : null;
      let matched = null;
      let bestScore = 0;
      if (preScannedOptions && preScannedOptions.length > 0) {
        const scored = [];
        let bestEntry = null;
        for (const entry of preScannedOptions) {
          if (!entry || !entry.norm) continue;
          if (forbiddenNorms && forbiddenNorms.has(entry.norm)) continue;
          if (excludeNorms && excludeNorms.has(entry.norm)) continue;
          const sc = scoreOptionMatch(entry.label, searchTerms, opts);
          if (sc > 0) scored.push({ label: entry.label, score: sc });
          if (sc > bestScore) {
            bestScore = sc;
            bestEntry = entry;
          }
        }
        scored.sort((a, b) => b.score - a.score);
        if (diagLog) {
          diagLog.queries.push({
            source: opts.diagSource || "tree-scan",
            terms: searchTerms.slice(0, 6),
            minScore,
            top5: scored.slice(0, 5),
            selected: bestEntry && bestScore >= minScore ? bestEntry.label : null
          });
        }
        if (bestEntry && bestScore >= minScore) {
          const liveOptions = findDropdownOptionElements(filterInput);
          const liveMatch = liveOptions.find((el) => normalizeCourseIndexKey(el.innerText || el.textContent) === bestEntry.norm);
          if (liveMatch) return liveMatch;
          if (bestEntry.el && bestEntry.el.isConnected && normalizeCourseIndexKey(bestEntry.el.innerText || bestEntry.el.textContent) === bestEntry.norm) {
            return bestEntry.el;
          }
          if (filterInput) {
            const revealQuery = bestEntry.label.slice(0, 48).trim();
            filterInput.focus();
            setNativeInputValue(filterInput, revealQuery);
            await sleepMs(320);
            const visible = findDropdownOptionElements(filterInput);
            const exactEl = visible.find((el) => normalizeCourseIndexKey(el.innerText || el.textContent) === bestEntry.norm);
            if (exactEl) return exactEl;
          }
        }
      }
      const typedTerms = preScannedOptions && preScannedOptions.length > 0 ? searchTerms.filter((t) => String(t || "").trim().split(/\s+/).length >= 2 || !(opts.targetConcepts && opts.targetConcepts.size >= 3)).slice(0, 2) : searchTerms;
      for (const term of typedTerms) {
        if (filterInput) {
          const accented = restoreCommonPortugueseAccents(term);
          const primaryQuery = accented && accented !== term ? accented : term;
          filterInput.focus();
          setNativeInputValue(filterInput, primaryQuery);
          await sleepMs(420);
          if (hasNoSearchResultsInMenu(filterInput) && primaryQuery !== term) {
            filterInput.focus();
            setNativeInputValue(filterInput, term);
            await sleepMs(420);
          }
        }
        if (filterInput && hasNoSearchResultsInMenu(filterInput)) {
          continue;
        }
        const options = findDropdownOptionElements(filterInput);
        bestScore = 0;
        matched = null;
        const typedScored = [];
        for (const opt of options) {
          const label = opt.innerText || opt.textContent;
          const optNorm = normalizeCourseIndexKey(label);
          if (!optNorm) continue;
          if (forbiddenNorms && forbiddenNorms.has(optNorm)) continue;
          if (excludeNorms && excludeNorms.has(optNorm)) continue;
          const sc = scoreOptionMatch(label, searchTerms, opts);
          if (sc > 0) typedScored.push({ label: String(label).replace(/\s+/g, " ").trim(), score: sc });
          if (sc > bestScore) {
            bestScore = sc;
            matched = opt;
          }
        }
        if (diagLog && typedScored.length > 0) {
          typedScored.sort((a, b) => b.score - a.score);
          diagLog.queries.push({
            source: `${opts.diagSource || "typed"}:${term}`,
            terms: [term],
            minScore,
            top5: typedScored.slice(0, 5),
            selected: matched && bestScore >= minScore ? String(matched.innerText || matched.textContent).replace(/\s+/g, " ").trim() : null
          });
        }
        if (matched && bestScore >= minScore) break;
        matched = null;
      }
      if ((!matched || filterInput && hasNoSearchResultsInMenu(filterInput)) && filterInput && allowEmptyFallback) {
        setNativeInputValue(filterInput, "");
        await sleepMs(320);
        const allOptions = findDropdownOptionElements(filterInput);
        let bestFallbackScore = 0;
        for (const opt of allOptions) {
          const optNorm = normalizeCourseIndexKey(opt.innerText || opt.textContent);
          if (!optNorm) continue;
          if (forbiddenNorms && forbiddenNorms.has(optNorm)) continue;
          if (excludeNorms && excludeNorms.has(optNorm)) continue;
          const sc = scoreOptionMatch(opt.innerText || opt.textContent, searchTerms, opts);
          if (sc > bestFallbackScore) {
            bestFallbackScore = sc;
            matched = opt;
          }
        }
        if (bestFallbackScore < Math.max(150, minScore)) matched = null;
      }
      return matched;
    }
    async function selectCaveiraDropdownOption(labelWord, searchTerms) {
      if (isDestroyed || !searchTerms || searchTerms.length === 0) return false;
      const trigger = findFilterDropdownTrigger(labelWord);
      if (!trigger) return false;
      clickElementRealistically(trigger);
      await sleepMs(320);
      let filterInput = findMenuFilterInput();
      if (!filterInput) {
        clickElementRealistically(trigger);
        await sleepMs(350);
        filterInput = findMenuFilterInput();
      }
      const matched = await matchOptionInOpenDropdown(filterInput, searchTerms);
      if (matched) {
        clickOptionRow(matched);
        await sleepMs(220);
      }
      await closeOpenDropdown(trigger, filterInput);
      await sleepMs(200);
      return Boolean(matched);
    }
    function isSpecialLegislationSubjectName(subjectName) {
      const norm = normalizeFilterText(subjectName);
      if (!norm) return false;
      return norm === "legislacao especial" || norm === "legislacao penal especial" || norm === "leis especiais" || norm === "leis penais especiais" || norm === "legislacao extravagante" || norm === "direito penal especial" || norm === "penal especial" || norm.includes("legislacao") && (norm.includes("especial") || norm.includes("extravagante"));
    }
    async function selectCaveiraLessonsInDropdown(lessonsList, fallbackTopic, subtopicsList = [], subjectName = "", extraOpts = {}) {
      const validLessons = (Array.isArray(lessonsList) ? lessonsList : []).filter(Boolean);
      const validSubtopics = (Array.isArray(subtopicsList) ? subtopicsList : []).filter(Boolean);
      const savedMemoryAssuntos = Array.isArray(extraOpts.savedMemoryAssuntos) ? extraOpts.savedMemoryAssuntos.filter(Boolean) : [];
      const diagLog = extraOpts.diagLog || null;
      const hasFallback = Boolean(String(fallbackTopic || "").trim());
      if (isDestroyed || validLessons.length === 0 && validSubtopics.length === 0 && savedMemoryAssuntos.length === 0 && !hasFallback) return false;
      const trigger = findFilterDropdownTrigger("Assunto");
      if (!trigger) return false;
      clickElementRealistically(trigger);
      await sleepMs(320);
      let filterInput = findMenuFilterInput();
      if (!filterInput) {
        clickElementRealistically(trigger);
        await sleepMs(350);
        filterInput = findMenuFilterInput();
      }
      const treeScan = await collectAllDropdownOptionsByScroll(filterInput, subjectName);
      const preScannedOptions = treeScan.options || [];
      const treeMatcher = typeof globalThis !== "undefined" && globalThis.QGCaveiraTreeMatcher ? globalThis.QGCaveiraTreeMatcher : null;
      const bm25Index = treeMatcher && preScannedOptions.length > 0 ? treeMatcher.buildBm25Index(preScannedOptions) : null;
      if (diagLog) {
        diagLog.treeScan = {
          scannedCount: preScannedOptions.length,
          scrollSteps: treeScan.scrollSteps,
          isVirtualized: treeScan.isVirtualized,
          fromCache: Boolean(treeScan.fromCache),
          sampleOptions: preScannedOptions.slice(0, 60).map((o) => o.label)
        };
      }
      let matchedCount = 0;
      const selectedOptionNorms = /* @__PURE__ */ new Set();
      const coveredConcepts = /* @__PURE__ */ new Set();
      const lessonTargetConcepts = /* @__PURE__ */ new Set();
      const buildConceptSetFromSource = (text, preferRightDash = false) => {
        const conceptSet = /* @__PURE__ */ new Set();
        const withoutSubject = stripSubjectFromLessonTitle(text, subjectName);
        const rawStr = String(withoutSubject || text || "").replace(/\b(?:aula|parte|p[aá]gina|bloco|m[oó]dulo|cap[ií]tulo)\s*\d+\b/gi, " ").replace(/\s+/g, " ").replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "").trim();
        if (!rawStr) return conceptSet;
        let scopeText = rawStr;
        if (preferRightDash) {
          const dashParts = rawStr.split(/\s*[-–—:]\s*/).map((p) => p.trim()).filter(Boolean);
          if (dashParts.length > 1) {
            const leftIsGeneric = isOnlyGenericWords(dashParts[0]) || LEADING_INDEX_FILLER_REGEX.test(dashParts[0]);
            const rightJoined = dashParts.slice(1).join(" ");
            if (leftIsGeneric && extractConceptWords(rightJoined).length > 0) {
              scopeText = rightJoined;
            }
          }
        }
        extractConceptWords(scopeText).forEach((c) => conceptSet.add(c));
        return conceptSet;
      };
      const addConceptsFromSource = (text, preferRightDash = false) => {
        buildConceptSetFromSource(text, preferRightDash).forEach((c) => lessonTargetConcepts.add(c));
      };
      if (validSubtopics.length > 0) {
        validSubtopics.forEach((sub) => addConceptsFromSource(sub, true));
      } else {
        validLessons.forEach((lesson) => addConceptsFromSource(lesson, true));
      }
      const mainContextText = [fallbackTopic, ...validLessons].filter(Boolean).join(" ");
      const mainLawIds = getMatchingSpecialLawIds(mainContextText);
      const subjectOwnLawIds = new Set(getMatchingSpecialLawIds(`${subjectName || ""} ${fallbackTopic === "CTB" ? "ctb" : ""}`.trim()));
      const isSpecialSubject = isSpecialLegislationSubjectName(subjectName);
      const mainLawTerms = isSpecialSubject || !mainLawIds.every((id) => subjectOwnLawIds.has(id)) ? getSpecialLawSearchTerms(mainContextText) : [];
      const allowedLawIds = mainLawIds.length > 0 ? new Set(mainLawIds) : null;
      const trySelectWithTerms = async (terms, matchOpts = {}) => {
        if (!terms || terms.length === 0) return false;
        const effectiveOpts = {
          ...matchOpts,
          ...allowedLawIds ? { allowedLawIds } : {},
          ...matchOpts.targetConcepts !== void 0 ? {} : lessonTargetConcepts.size > 0 ? { targetConcepts: lessonTargetConcepts } : {},
          excludeNorms: selectedOptionNorms,
          preScannedOptions,
          diagLog
        };
        const matched = await matchOptionInOpenDropdown(filterInput, terms, effectiveOpts);
        if (!matched) return false;
        const matchedLabel = matched.innerText || matched.textContent;
        const matchedNorm = normalizeCourseIndexKey(matchedLabel);
        if (matchedNorm && selectedOptionNorms.has(matchedNorm)) return false;
        if (matchedNorm) selectedOptionNorms.add(matchedNorm);
        extractConceptWords(matchedLabel).forEach((c) => coveredConcepts.add(c));
        if (!isOptionRowChecked(matched)) {
          clickOptionRow(matched);
          matchedCount += 1;
          await sleepMs(180);
        } else {
          matchedCount += 1;
        }
        if (diagLog && Array.isArray(diagLog.selectedLabels)) {
          diagLog.selectedLabels.push(String(matchedLabel).replace(/\s+/g, " ").trim());
        }
        return true;
      };
      const selectOptionByExactLabel = async (label, norm) => {
        if (!label || !norm || selectedOptionNorms.has(norm)) return false;
        const liveOptions = findDropdownOptionElements(filterInput);
        let targetEl = liveOptions.find((el) => normalizeCourseIndexKey(el.innerText || el.textContent) === norm) || null;
        if (!targetEl && filterInput) {
          const revealQuery = String(label).replace(/^[\s_]+/, "").slice(0, 48).trim();
          filterInput.focus();
          setNativeInputValue(filterInput, revealQuery);
          await sleepMs(320);
          const visible = findDropdownOptionElements(filterInput);
          targetEl = visible.find((el) => normalizeCourseIndexKey(el.innerText || el.textContent) === norm) || null;
        }
        if (!targetEl) return false;
        selectedOptionNorms.add(norm);
        extractConceptWords(label).forEach((c) => coveredConcepts.add(c));
        if (!isOptionRowChecked(targetEl)) {
          clickOptionRow(targetEl);
          matchedCount += 1;
          await sleepMs(180);
        } else {
          matchedCount += 1;
        }
        if (diagLog && Array.isArray(diagLog.selectedLabels)) {
          diagLog.selectedLabels.push(String(label).replace(/\s+/g, " ").trim());
        }
        return true;
      };
      if (savedMemoryAssuntos.length > 0) {
        for (const memAssunto of savedMemoryAssuntos) {
          if (isDestroyed) break;
          await trySelectWithTerms([memAssunto], {
            minScore: 420,
            allowEmptyFallback: true,
            targetConcepts: null,
            diagSource: "correction-memory"
          });
        }
        if (matchedCount > 0) {
          await closeOpenDropdown(trigger, filterInput);
          await sleepMs(200);
          return true;
        }
      }
      if (mainLawTerms.length > 0) {
        await trySelectWithTerms(mainLawTerms, {
          minScore: 220,
          allowEmptyFallback: true,
          allowedLawIds,
          targetConcepts: null
        });
        if (matchedCount > 0 && isSpecialLegislationSubjectName(subjectName)) {
          await closeOpenDropdown(trigger, filterInput);
          await sleepMs(200);
          return true;
        }
      }
      const subjectExcludeTokens = /* @__PURE__ */ new Set();
      if (treeMatcher && subjectName) {
        const subjectTokensSources = [subjectName, ...getSubjectSearchTerms(subjectName)].filter(Boolean);
        for (const src of subjectTokensSources) {
          treeMatcher.canon(src).tokens.forEach((t) => subjectExcludeTokens.add(t));
        }
      }
      if (bm25Index && !isSpecialSubject) {
        const anchorQueries = [...validLessons, fallbackTopic].filter(Boolean);
        for (const rawAnchorQ of anchorQueries) {
          if (isDestroyed) break;
          const cleanedAnchor = (stripSubjectFromLessonTitle(rawAnchorQ, subjectName) || rawAnchorQ).replace(/\((?:aula|parte|bloco|m[oó]dulo)[^)]*\)/gi, " ").replace(/\b(?:aula|parte|bloco|m[oó]dulo)\s*\d+\b/gi, " ").replace(/\s*[-–—:|]+\s*$/g, "").replace(/\s+/g, " ").trim();
          const anchorQ = cleanedAnchor || rawAnchorQ;
          const ranked = treeMatcher.scoreTreeNodesBm25(anchorQ, bm25Index, {
            excludeNorms: selectedOptionNorms,
            excludeTokens: subjectExcludeTokens
          });
          const top1 = ranked[0];
          const top2 = ranked[1];
          if (diagLog && Array.isArray(diagLog.queries) && ranked.length > 0) {
            diagLog.queries.push({
              source: `bm25-anchor-A:${anchorQ}`,
              terms: [anchorQ],
              minRelScore: 0.55,
              top5: ranked.slice(0, 5).map((r) => ({ label: r.node.label, score: r.score, relScore: r.relScore, coverage: r.coverage })),
              selected: null
            });
          }
          const hasMargin = !top2 || top1.score >= top2.score * 1.12;
          const passesScore = top1 && top1.relScore >= 0.55;
          if (passesScore && !top1.node.isLeaf && top1.coverage >= 0.5 && hasMargin) {
            const ok = await selectOptionByExactLabel(top1.node.label, top1.node.norm);
            if (ok) {
              if (diagLog && diagLog.queries.length > 0) {
                diagLog.queries[diagLog.queries.length - 1].selected = top1.node.label;
              }
            }
          }
        }
      }
      const bizusAudit = treeMatcher && validSubtopics.length > 0 ? treeMatcher.filterAndRankBizusSubtopicsWithAudit ? treeMatcher.filterAndRankBizusSubtopicsWithAudit(validSubtopics, [...validLessons, fallbackTopic], 10) : { kept: treeMatcher.filterAndRankBizusSubtopics(validSubtopics, [...validLessons, fallbackTopic], 10), discarded: [] } : { kept: validSubtopics.map((s) => ({ raw: s, cleaned: s, level: "B", weight: 0.75 })), discarded: [] };
      const rankedSubtopics = bizusAudit.kept;
      if (diagLog) {
        diagLog.bizusFilter = {
          inputCount: validSubtopics.length,
          keptCount: rankedSubtopics.length,
          kept: rankedSubtopics.map((s) => `[${s.level}] ${s.cleaned || s.raw}`),
          discarded: bizusAudit.discarded || []
        };
        if (!Array.isArray(diagLog.subtopicOutcomes)) diagLog.subtopicOutcomes = [];
      }
      const recordSubtopicOutcome = (subtopic, level, outcome, selectedLabel = null, top5 = []) => {
        if (diagLog && Array.isArray(diagLog.subtopicOutcomes)) {
          diagLog.subtopicOutcomes.push({
            subtopic,
            level,
            outcome,
            selectedLabel: selectedLabel || null,
            top5
          });
        }
      };
      if (rankedSubtopics.length > 0) {
        const forbiddenParentNorms = buildBroadParentNorms([subjectName, fallbackTopic, ...validLessons]);
        for (const subEntry of rankedSubtopics) {
          if (isDestroyed) break;
          const subtopic = subEntry.cleaned || subEntry.raw;
          const isLevelC = subEntry.level === "C";
          if (allowedLawIds) {
            const subLawIds = getMatchingSpecialLawIds(subtopic);
            if (subLawIds.some((id) => !allowedLawIds.has(id))) {
              recordSubtopicOutcome(subtopic, subEntry.level, "skipped-law-lock");
              continue;
            }
          }
          const subConcepts = extractConceptWords(subtopic);
          if (subConcepts.length > 0 && subConcepts.every((c) => coveredConcepts.has(c))) {
            recordSubtopicOutcome(subtopic, subEntry.level, "skipped-covered");
            continue;
          }
          let bm25Top5 = [];
          if (bm25Index) {
            const bm25Query = stripSubjectFromLessonTitle(subtopic, subjectName) || subtopic;
            const ranked = treeMatcher.scoreTreeNodesBm25(bm25Query, bm25Index, {
              excludeNorms: selectedOptionNorms,
              excludeTokens: subjectExcludeTokens
            });
            const top1 = ranked[0];
            const top2 = ranked[1];
            bm25Top5 = ranked.slice(0, 5).map((r) => ({ label: r.node.label, score: r.score, relScore: r.relScore, coverage: r.coverage }));
            const relThreshold = isLevelC ? 0.55 : 0.5;
            const hasMargin = !top2 || top1.score >= top2.score * 1.15;
            const passesScore = top1 && top1.relScore >= relThreshold;
            if (passesScore && !top1.node.isLeaf && top1.coverage >= 0.45 && hasMargin) {
              const ok = await selectOptionByExactLabel(top1.node.label, top1.node.norm);
              if (diagLog && Array.isArray(diagLog.queries)) {
                diagLog.queries.push({
                  source: `bm25-${subEntry.level}:${bm25Query}`,
                  terms: [bm25Query],
                  minRelScore: relThreshold,
                  top5: bm25Top5,
                  selected: ok ? top1.node.label : null
                });
              }
              if (ok) {
                recordSubtopicOutcome(subtopic, subEntry.level, "bm25-selected", top1.node.label, bm25Top5);
                continue;
              }
            }
            if (passesScore && !hasMargin && top1.coverage >= 0.45) {
              if (diagLog && Array.isArray(diagLog.queries)) {
                diagLog.queries.push({
                  source: `bm25-${subEntry.level}-tie-skip:${bm25Query}`,
                  terms: [bm25Query],
                  minRelScore: relThreshold,
                  top5: bm25Top5,
                  selected: null
                });
              }
              recordSubtopicOutcome(subtopic, subEntry.level, "bm25-tie-skip", null, bm25Top5);
              continue;
            }
          }
          const expanded = expandSubtopicToSearchGroups(subtopic);
          if (!expanded || !expanded.primary || expanded.primary.length === 0) {
            recordSubtopicOutcome(subtopic, subEntry.level, bm25Top5.length > 0 ? "bm25-no-candidate" : "legacy-no-match", null, bm25Top5);
            continue;
          }
          const selectedBeforeCount = selectedOptionNorms.size;
          const subConceptSet = new Set(extractConceptWords(subtopic));
          const directHit = await trySelectWithTerms(expanded.primary, {
            forbiddenNorms: forbiddenParentNorms,
            minScore: 420,
            allowEmptyFallback: false,
            allowedLawIds,
            targetConcepts: subConceptSet.size > 0 ? subConceptSet : lessonTargetConcepts,
            lessonConcepts: lessonTargetConcepts
          });
          const hasUncoveredSplits = Array.isArray(expanded.splitFallbacks) && expanded.splitFallbacks.length > 0 && (!directHit || expanded.splitFallbacks.some((splitTerms) => {
            const sc = extractConceptWords(splitTerms.join(" "));
            return sc.length > 0 && !sc.every((c) => coveredConcepts.has(c));
          }));
          if (hasUncoveredSplits) {
            for (const splitTerms of expanded.splitFallbacks) {
              if (isDestroyed) break;
              const splitConcepts = extractConceptWords(splitTerms.join(" "));
              if (splitConcepts.length > 0 && splitConcepts.every((c) => coveredConcepts.has(c))) {
                continue;
              }
              const splitLawIds = getMatchingSpecialLawIds(splitTerms.join(" "));
              if (allowedLawIds && splitLawIds.some((id) => !allowedLawIds.has(id))) {
                continue;
              }
              if (directHit && splitLawIds.length > 0 && Array.from(selectedOptionNorms).some(
                (sel) => splitLawIds.every((id) => getMatchingSpecialLawIds(sel, { primaryOnly: true }).includes(id))
              )) {
                continue;
              }
              const splitConceptSet = new Set(splitConcepts);
              await trySelectWithTerms(splitTerms, {
                forbiddenNorms: forbiddenParentNorms,
                minScore: 420,
                allowEmptyFallback: false,
                allowedLawIds,
                targetConcepts: splitConceptSet.size > 0 ? splitConceptSet : subConceptSet.size > 0 ? subConceptSet : lessonTargetConcepts,
                lessonConcepts: lessonTargetConcepts
              });
            }
          }
          const newlySelected = Array.from(selectedOptionNorms).slice(selectedBeforeCount);
          recordSubtopicOutcome(
            subtopic,
            subEntry.level,
            newlySelected.length > 0 ? "legacy-selected" : "legacy-no-match",
            newlySelected.length > 0 ? newlySelected.join(", ") : null,
            bm25Top5
          );
        }
      }
      if (mainLawTerms.length === 0 && isSpecialSubject) {
        const allContextText = [fallbackTopic, ...validLessons, ...validSubtopics].filter(Boolean).join(" ");
        const allContextLawTerms = getSpecialLawSearchTerms(allContextText);
        if (allContextLawTerms.length > 0) {
          const hasContextLawSelected = Array.from(selectedOptionNorms).some(
            (selNorm) => scoreOptionMatch(selNorm, allContextLawTerms) >= 400
          );
          if (!hasContextLawSelected) {
            await trySelectWithTerms(allContextLawTerms, {
              minScore: 220,
              allowEmptyFallback: true,
              targetConcepts: null
            });
          }
        }
      }
      if (matchedCount === 0) {
        for (const lessonTitle of validLessons) {
          if (isDestroyed) break;
          const lessonTerms = getLessonSearchTerms(lessonTitle);
          const singleLessonConcepts = buildConceptSetFromSource(lessonTitle, true);
          if (lessonTerms.length > 0) {
            await trySelectWithTerms(lessonTerms, {
              minScore: 200,
              allowEmptyFallback: true,
              allowedLawIds,
              targetConcepts: singleLessonConcepts
            });
          }
          const enumItems = extractEnumeratedSubitemsFromLesson(lessonTitle);
          if (enumItems.length >= 2) {
            for (const item of enumItems) {
              if (isDestroyed) break;
              const itemConcepts = extractConceptWords(item);
              if (itemConcepts.length > 0 && itemConcepts.every((c) => coveredConcepts.has(c))) {
                continue;
              }
              const itemConceptSet = new Set(itemConcepts);
              await trySelectWithTerms([item], {
                minScore: 200,
                allowEmptyFallback: false,
                allowedLawIds,
                targetConcepts: itemConceptSet,
                lessonConcepts: singleLessonConcepts
              });
            }
          }
        }
      }
      if (matchedCount === 0 && hasFallback) {
        const fallbackTerms = getTopicSearchTerms(fallbackTopic);
        await trySelectWithTerms(fallbackTerms, {
          minScore: 200,
          allowEmptyFallback: true,
          allowedLawIds,
          targetConcepts: new Set(extractConceptWords(fallbackTopic))
        });
      }
      await closeOpenDropdown(trigger, filterInput);
      await sleepMs(200);
      return matchedCount > 0;
    }
    function findCaveiraClearFiltersButton() {
      const rawCandidates = Array.from(
        document.querySelectorAll('button, [role="button"], .q-btn, a, div, span')
      ).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 55 || r.width > 340 || r.height < 18 || r.height > 64) return false;
        let txt = normalizeFilterText(el.innerText || el.textContent);
        txt = txt.replace(/\b(refresh|sync|clear|close|restart_alt|autorenew|delete_sweep|replay)\b/g, " ").replace(/\s+/g, " ").trim();
        return txt === "limpar filtros" || txt === "limpar filtro";
      });
      const resolved = [];
      for (const el of rawCandidates) {
        let clickable = el.closest('button, [role="button"], .q-btn, a');
        if (!clickable) {
          let cur = el;
          for (let depth = 0; depth < 4 && cur && cur !== document.body; depth++) {
            const r = cur.getBoundingClientRect();
            const cursorStyle = window.getComputedStyle(cur).cursor;
            if (r.height >= 20 && r.height <= 64 && r.width >= 55 && r.width <= 340 && (cursorStyle === "pointer" || depth === 0)) {
              clickable = cur;
              if (cursorStyle === "pointer") break;
            }
            cur = cur.parentElement;
          }
        }
        if (clickable && !clickable.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(clickable)) {
          resolved.push(clickable);
        }
      }
      const unique = Array.from(new Set(resolved));
      unique.sort((a, b) => {
        const aNative = a.matches('button, [role="button"], .q-btn, a') ? 0 : 1;
        const bNative = b.matches('button, [role="button"], .q-btn, a') ? 0 : 1;
        if (aNative !== bNative) return aNative - bNative;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.width * ra.height - rb.width * rb.height;
      });
      return unique[0] || null;
    }
    function hasActiveCaveiraFilters() {
      for (const labelWord of ["Disciplina", "Assunto", "Caderno", "Banca", "Nivel", "Ano", "Dificuldade"]) {
        const trigger = findFilterDropdownTrigger(labelWord);
        if (trigger) {
          const txt = normalizeFilterText(trigger.innerText || trigger.textContent);
          if (/\b\d+\s+selecionad/.test(txt)) return true;
        }
      }
      const appliedInfo = findAppliedFiltersSection();
      if (appliedInfo && appliedInfo.container) {
        const cTxt = normalizeFilterText(appliedInfo.container.innerText || appliedInfo.container.textContent);
        if (/\b(disciplina|assunto|caderno|banca|nivel|ano|dificuldade|palavra)\b/.test(cTxt)) {
          return true;
        }
      }
      return false;
    }
    async function removeAppliedFilterChipsFallback() {
      const appliedInfo = findAppliedFiltersSection();
      if (!appliedInfo || !appliedInfo.container) return;
      const removeIcons = Array.from(
        appliedInfo.container.querySelectorAll('button, [role="button"], .q-chip__icon--remove, svg, i, span')
      ).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 10 || r.width > 34 || r.height < 10 || r.height > 34) return false;
        const parentBtn = el.closest('button, [role="button"], a');
        if (parentBtn) {
          const pTxt = normalizeFilterText(parentBtn.innerText || parentBtn.textContent);
          if (pTxt.includes("limpar filtros") || pTxt.includes("filtrar") || pTxt.includes("simulado") || pTxt.includes("mostrar filtros")) {
            return false;
          }
        }
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return !txt || txt === "x" || txt === "close" || txt === "cancel" || txt === "clear";
      });
      for (const icon of removeIcons.slice(0, 25)) {
        if (isDestroyed || !icon.isConnected || !isElementVisible(icon)) continue;
        const clickable = icon.closest('button, [role="button"]') || icon;
        clickElementRealistically(clickable);
        await sleepMs(80);
      }
    }
    async function clearPreviousCaveiraFilters() {
      if (isDestroyed) return;
      const clearBtn = findCaveiraClearFiltersButton();
      const hasActiveBefore = hasActiveCaveiraFilters() || Boolean(findAppliedFiltersSection());
      if (!clearBtn && !hasActiveBefore) return;
      if (clearBtn) {
        try {
          clearBtn.scrollIntoView({ block: "center", inline: "nearest" });
        } catch (_) {
        }
        await sleepMs(100);
        clickElementRealistically(clearBtn);
        const nestedBtn = !clearBtn.matches('button, [role="button"], .q-btn') ? clearBtn.querySelector('button, [role="button"], .q-btn') : null;
        if (nestedBtn && nestedBtn !== clearBtn) {
          clickElementRealistically(nestedBtn);
        }
        for (let i = 0; i < 8; i++) {
          if (isDestroyed) return;
          await sleepMs(180);
          if (!hasActiveCaveiraFilters()) break;
        }
      }
      if (hasActiveCaveiraFilters()) {
        const retryBtn = findCaveiraClearFiltersButton();
        if (retryBtn) {
          clickElementRealistically(retryBtn);
          await sleepMs(350);
        }
        if (hasActiveCaveiraFilters()) {
          await removeAppliedFilterChipsFallback();
          await sleepMs(250);
        }
      }
    }
    async function selectUnresolvedQuestionsFilter() {
      if (isDestroyed) return false;
      const rawCandidates = Array.from(
        document.querySelectorAll('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label, div, span, a')
      ).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.width > 260 || r.height < 18 || r.height > 60) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === "nao resolvidas" || txt === "nao resolvida";
      });
      const pills = [];
      for (const el of rawCandidates) {
        const target = el.closest('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') || el;
        if (!target || target.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(target)) continue;
        const tr = target.getBoundingClientRect();
        if (tr.width < 40 || tr.width > 260 || tr.height < 18 || tr.height > 60) continue;
        const targetTxt = normalizeFilterText(target.innerText || target.textContent);
        if (targetTxt !== "nao resolvidas" && targetTxt !== "nao resolvida") continue;
        if (!pills.includes(target)) pills.push(target);
      }
      if (pills.length === 0) return false;
      pills.sort((a, b) => {
        const aInteractive = a.matches('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') ? 0 : 1;
        const bInteractive = b.matches('button, [role="button"], [role="radio"], [role="tab"], .q-btn, .q-chip, label') ? 0 : 1;
        if (aInteractive !== bInteractive) return aInteractive - bInteractive;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.width * ra.height - rb.width * rb.height;
      });
      const pill = pills[0];
      if (pill.getAttribute("aria-pressed") === "true" || pill.getAttribute("aria-selected") === "true" || pill.getAttribute("aria-checked") === "true") {
        return true;
      }
      clickElementRealistically(pill);
      await sleepMs(250);
      return true;
    }
    function resolveSubtopicsFromCourseCache(lessonsList, fallbackTopic, subjectName) {
      return new Promise((resolve) => {
        if (!isExtensionContextValid()) {
          resolve({ subtopics: [], rawIndexText: "" });
          return;
        }
        try {
          chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
            if (chrome.runtime.lastError || isDestroyed) {
              resolve({ subtopics: [], rawIndexText: "" });
              return;
            }
            const cache = res?.[COURSE_INDEX_CACHE_KEY];
            if (!cache || typeof cache !== "object") {
              resolve({ subtopics: [], rawIndexText: "" });
              return;
            }
            const byLesson = cache.byLesson && typeof cache.byLesson === "object" ? cache.byLesson : {};
            const candidates = [...Array.isArray(lessonsList) ? lessonsList : [], fallbackTopic].filter(Boolean);
            let matchedEntry = null;
            for (const c of candidates) {
              const k = normalizeCourseIndexKey(c);
              if (!k) continue;
              const exact = byLesson[k] || Object.entries(byLesson).find(([bk]) => bk.endsWith(`::${k}`))?.[1];
              if (exact && (exact.bizusRawText || exact.rawIndexText)) {
                matchedEntry = exact;
                break;
              }
            }
            if (!matchedEntry) {
              const canon = (s) => normalizeCourseIndexKey(s).replace(/\bparte\s*0*(\d+)\b/g, "parte $1").replace(/\baula\s*0*(\d+)\b/g, "aula $1").trim();
              const candCanon = candidates.map(canon).filter(Boolean);
              for (const [k, entry] of Object.entries(byLesson)) {
                if (!(entry?.bizusRawText || entry?.rawIndexText)) continue;
                const eCanon = canon(entry.lessonTitle || k);
                if (!eCanon) continue;
                if (candCanon.some((c) => c === eCanon || c.length >= 10 && eCanon.includes(c) || eCanon.length >= 10 && c.includes(eCanon))) {
                  matchedEntry = entry;
                  break;
                }
              }
            }
            if (!matchedEntry && (cache.latest?.bizusRawText || cache.latest?.rawIndexText) && Date.now() - (cache.latest.capturedAt || 0) < 18e5) {
              const latestCanon = normalizeCourseIndexKey(cache.latest.lessonTitle || "");
              const combinedCand = candidates.map(normalizeCourseIndexKey).join(" ");
              const sigWords = combinedCand.split(" ").filter((w) => w.length >= 5);
              if (latestCanon && sigWords.some((w) => latestCanon.includes(w))) {
                matchedEntry = cache.latest;
              }
            }
            if (!matchedEntry) {
              resolve({ subtopics: [], rawIndexText: "" });
              return;
            }
            const effectiveRaw = matchedEntry.bizusRawText || matchedEntry.rawIndexText || "";
            const parsed = effectiveRaw ? parseCourseIndexSubtopics(effectiveRaw, [subjectName, fallbackTopic, ...Array.isArray(lessonsList) ? lessonsList : []]) : Array.isArray(matchedEntry.bizusSubtopics) && matchedEntry.bizusSubtopics.length > 0 ? matchedEntry.bizusSubtopics : Array.isArray(matchedEntry.subtopics) ? matchedEntry.subtopics : [];
            resolve({ subtopics: parsed, rawIndexText: effectiveRaw });
          });
        } catch (_) {
          resolve({ subtopics: [], rawIndexText: "" });
        }
      });
    }
    async function applyCaveiraPracticeFilter(filterObj) {
      if (isDestroyed || !filterObj || isApplyingFilter) return;
      const rawSubject = String(filterObj.subject || "").trim();
      const lessons = Array.isArray(filterObj.lessons) ? filterObj.lessons.map((l) => String(l || "").trim()).filter(Boolean) : [];
      const topic = String(filterObj.topic || "").trim();
      const rawFallbackTopic = String(filterObj.fallbackTopic || topic || "").trim();
      const rawLessons = lessons.length > 0 ? lessons : topic ? [topic] : [];
      const inferredSubject = inferSubjectFromLessons(rawLessons, rawFallbackTopic);
      const subject = (!rawSubject || isGenericSubjectName(rawSubject)) && inferredSubject ? inferredSubject : rawSubject;
      const effectiveLessons = rawLessons.map((l) => stripSubjectFromLessonTitle(l, subject || inferredSubject)).filter(Boolean);
      const fallbackTopic = stripSubjectFromLessonTitle(rawFallbackTopic, subject || inferredSubject) || rawFallbackTopic;
      const displayTarget = effectiveLessons.join(" • ") || fallbackTopic;
      if (!subject && !displayTarget) return;
      const rawIndexText = String(filterObj.rawIndexText || "").trim();
      const rawSubtopicsInput = Array.isArray(filterObj.subtopics) ? filterObj.subtopics.map((s) => String(s || "").trim()).filter(Boolean) : [];
      const sourceTextForParse = rawIndexText || rawSubtopicsInput.join("\n");
      let effectiveSubtopics = sourceTextForParse ? parseCourseIndexSubtopics(sourceTextForParse, [subject, inferredSubject, fallbackTopic, ...effectiveLessons, ...rawLessons]) : [];
      if (effectiveSubtopics.length === 0 && !rawIndexText) {
        const cached = await resolveSubtopicsFromCourseCache(rawLessons, fallbackTopic, subject || inferredSubject);
        if (cached.subtopics.length > 0) {
          effectiveSubtopics = cached.subtopics;
        }
      }
      isApplyingFilter = true;
      activePracticeFilter = {
        subject: subject || inferredSubject,
        lessons: effectiveLessons,
        topic: displayTarget,
        fallbackTopic,
        subtopics: effectiveSubtopics,
        rawIndexText,
        examBoards: Array.isArray(filterObj.examBoards) ? filterObj.examBoards : void 0,
        numberAlternatives: Array.isArray(filterObj.numberAlternatives) ? filterObj.numberAlternatives : void 0,
        ...Array.isArray(filterObj.difficultyIds) ? { difficultyIds: filterObj.difficultyIds } : {},
        ...typeof filterObj.status === "string" ? { status: filterObj.status } : {}
      };
      const resolverBox = getHudEl("qg-hud-resolver-box");
      if (resolverBox) resolverBox.style.display = "none";
      renderFilterBanner("⏳ Resolvendo filtro por IDs...");
      try {
        chrome.storage.local.remove([PENDING_FILTER_KEY]);
      } catch (_) {
      }
      try {
        const idMemHit = await loadFilterIdMemory(subject || inferredSubject, effectiveLessons, fallbackTopic);
        if (idMemHit && idMemHit.subjectId && Array.isArray(idMemHit.ids) && idMemHit.ids.length > 0) {
          lastFilterDiagnosticLog = {
            version: "1.5.0",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            geradoEm: cachedCaveiraTreeGeradoEm || "",
            mode: "id-memory",
            input: { rawSubject, rawLessons, rawFallbackTopic, rawSubtopicsCount: rawSubtopicsInput.length },
            resolvedSubject: { id: idMemHit.subjectId, name: idMemHit.subjectName || subject || "" },
            confidence: "alta",
            reason: "memória de correções por ID",
            ids: idMemHit.ids,
            picks: idMemHit.picks || []
          };
          const summary = [idMemHit.subjectName || subject, displayTarget].filter(Boolean).join(" • ");
          lastResolverProposed = { subjectId: idMemHit.subjectId, ids: idMemHit.ids };
          await navigateToCaveiraDeepLink(idMemHit.subjectId, idMemHit.ids, `✅ Filtro aplicado (💾 Memória IDs): ${summary}`);
          return;
        }
        const resolver = typeof globalThis !== "undefined" && globalThis.QGCaveiraResolver ? globalThis.QGCaveiraResolver : null;
        const tree = resolver ? await loadCaveiraTree() : null;
        if (!resolver || !tree) {
          lastFilterDiagnosticLog = {
            version: "1.5.0",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            geradoEm: cachedCaveiraTreeGeradoEm || "",
            mode: "resolver-unavailable",
            reason: !resolver ? "QGCaveiraResolver não carregado" : "Falha ao carregar caveira_arvore.json"
          };
          renderResolverAlternativesBox({ subject: null, alternatives: [], confidence: "nenhuma", reason: lastFilterDiagnosticLog.reason }, activePracticeFilter);
          renderFilterBanner(`⚠️ Árvore indisponível — tente o modo antigo`);
          return;
        }
        const res = resolver.resolveLesson(tree, {
          subjectName: subject || inferredSubject,
          lessons: effectiveLessons,
          topic: fallbackTopic,
          subtopics: effectiveSubtopics
        });
        lastFilterDiagnosticLog = {
          version: "1.5.0",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          geradoEm: cachedCaveiraTreeGeradoEm || "",
          mode: "resolver-id",
          input: { rawSubject, rawLessons, rawFallbackTopic, rawSubtopicsCount: rawSubtopicsInput.length, effectiveSubtopics },
          resolvedSubject: res.subject ? { id: res.subject.id, name: res.subject.name } : null,
          anchor: res.anchor || null,
          anchorsRanking: res.log?.anchors || [],
          reason_detail: res.reason || "",
          confidence: res.confidence,
          anchorAmbiguous: Boolean(res.anchorAmbiguous),
          reason: res.reason,
          ids: res.ids || [],
          picks: (res.picks || []).map((p) => ({ id: p.id, name: p.name, path: p.path })),
          alternatives: (res.alternatives || []).map((a) => ({ id: a.id, name: a.name, path: a.path })),
          subtopicsLog: res.log?.subtopics || []
        };
        const canAutoNavigate = (res.confidence === "alta" || res.confidence === "media") && !res.anchorAmbiguous && Array.isArray(res.ids) && res.ids.length > 0 && res.subject && res.subject.id;
        if (canAutoNavigate) {
          const summary = [res.subject.name, displayTarget].filter(Boolean).join(" • ");
          const tag = `${res.ids.length} assunto(s) • ${res.confidence}`;
          lastResolverProposed = { subjectId: res.subject.id, ids: res.ids };
          await navigateToCaveiraDeepLink(res.subject.id, res.ids, `✅ Filtro aplicado (${tag}): ${summary}`);
          return;
        }
        lastResolverProposed = null;
        renderResolverAlternativesBox(res, activePracticeFilter);
        renderFilterBanner(`⚠️ Confirme no HUD (${res.confidence}${res.anchorAmbiguous ? " • ambíguo" : ""}): ${displayTarget || res.subject?.name || ""}`);
      } finally {
        isApplyingFilter = false;
      }
    }
    async function applyCaveiraPracticeFilterLegacyDom(filterObj) {
      if (isDestroyed || !filterObj || isApplyingFilter) return;
      const rawSubject = String(filterObj.subject || "").trim();
      const lessons = Array.isArray(filterObj.lessons) ? filterObj.lessons.map((l) => String(l || "").trim()).filter(Boolean) : [];
      const topic = String(filterObj.topic || "").trim();
      const rawFallbackTopic = String(filterObj.fallbackTopic || topic || "").trim();
      const rawLessons = lessons.length > 0 ? lessons : topic ? [topic] : [];
      const inferredSubject = inferSubjectFromLessons(rawLessons, rawFallbackTopic);
      const subject = (!rawSubject || isGenericSubjectName(rawSubject)) && inferredSubject ? inferredSubject : rawSubject;
      const effectiveLessons = rawLessons.map((l) => stripSubjectFromLessonTitle(l, subject || inferredSubject)).filter(Boolean);
      const fallbackTopic = stripSubjectFromLessonTitle(rawFallbackTopic, subject || inferredSubject) || rawFallbackTopic;
      const displayTarget = effectiveLessons.join(" • ") || fallbackTopic;
      if (!subject && !displayTarget) return;
      const rawIndexText = String(filterObj.rawIndexText || "").trim();
      const rawSubtopicsInput = Array.isArray(filterObj.subtopics) ? filterObj.subtopics.map((s) => String(s || "").trim()).filter(Boolean) : [];
      const sourceTextForParse = rawIndexText || rawSubtopicsInput.join("\n");
      let effectiveSubtopics = sourceTextForParse ? parseCourseIndexSubtopics(sourceTextForParse, [subject, inferredSubject, fallbackTopic, ...effectiveLessons, ...rawLessons]) : [];
      if (effectiveSubtopics.length === 0 && !rawIndexText) {
        const cached = await resolveSubtopicsFromCourseCache(rawLessons, fallbackTopic, subject || inferredSubject);
        if (cached.subtopics.length > 0) {
          effectiveSubtopics = cached.subtopics;
        }
      }
      const filterStartedAt = Date.now();
      const memoryHit = await loadFilterCorrectionMemory(subject || inferredSubject, effectiveLessons, fallbackTopic);
      const effectiveSubjectForFilter = memoryHit && memoryHit.subject && (!subject || isGenericSubjectName(subject)) ? memoryHit.subject : subject;
      lastFilterDiagnosticLog = {
        version: "1.5.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        input: {
          rawSubject,
          rawLessons,
          rawFallbackTopic,
          rawSubtopicsCount: rawSubtopicsInput.length,
          hasRawIndexText: Boolean(rawIndexText)
        },
        inferred: {
          subject: effectiveSubjectForFilter,
          inferredSubject,
          effectiveLessons,
          fallbackTopic,
          effectiveSubtopics
        },
        memory: memoryHit ? { hit: true, key: memoryHit.key, savedSubject: memoryHit.subject || "", savedAssuntos: memoryHit.assuntos || [] } : { hit: false },
        discipline: { ok: null, terms: [] },
        treeScan: null,
        queries: [],
        selectedLabels: [],
        final: null
      };
      isApplyingFilter = true;
      activePracticeFilter = {
        subject: effectiveSubjectForFilter,
        lessons: effectiveLessons,
        topic: displayTarget,
        fallbackTopic,
        subtopics: effectiveSubtopics,
        rawIndexText
      };
      renderFilterBanner("⏳ Abrindo Banco de Questões...");
      try {
        chrome.storage.local.remove([PENDING_FILTER_KEY]);
      } catch (_) {
      }
      try {
        if (!findFilterDropdownTrigger("Disciplina")) {
          const navCandidates = Array.from(document.querySelectorAll('a, button, [role="tab"], .q-tab, .q-item'));
          const questTab = navCandidates.find((el) => {
            if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
            const txt = normalizeFilterText(el.innerText || el.textContent);
            return txt === "questoes" || txt === "banco de questoes" || txt === "resolver questoes";
          });
          if (questTab) {
            clickElementRealistically(questTab);
          }
        }
        for (let waitIdx = 0; waitIdx < 14; waitIdx++) {
          if (isDestroyed) return;
          if (findFilterDropdownTrigger("Disciplina")) break;
          await sleepMs(350);
        }
        renderFilterBanner("⏳ Limpando filtros anteriores...");
        await clearPreviousCaveiraFilters();
        await sleepMs(200);
        renderFilterBanner("⏳ Marcando: Não resolvidas...");
        const unresolvedOk = await selectUnresolvedQuestionsFilter();
        let subjectOk = true;
        let topicOk = true;
        if (effectiveSubjectForFilter) {
          renderFilterBanner(`⏳ Selecionando Disciplina: ${effectiveSubjectForFilter}...`);
          const subjectTerms = getSubjectSearchTerms(effectiveSubjectForFilter);
          if (lastFilterDiagnosticLog) lastFilterDiagnosticLog.discipline.terms = subjectTerms;
          subjectOk = await selectCaveiraDropdownOption("Disciplina", subjectTerms);
          if (!subjectOk && inferredSubject && normalizeFilterText(inferredSubject) !== normalizeFilterText(effectiveSubjectForFilter)) {
            renderFilterBanner(`⏳ Tentando Disciplina inferida da aula: ${inferredSubject}...`);
            const inferredTerms = getSubjectSearchTerms(inferredSubject);
            if (lastFilterDiagnosticLog) lastFilterDiagnosticLog.discipline.terms = inferredTerms;
            subjectOk = await selectCaveiraDropdownOption("Disciplina", inferredTerms);
          }
          if (lastFilterDiagnosticLog) lastFilterDiagnosticLog.discipline.ok = subjectOk;
          await sleepMs(500);
        }
        if (memoryHit && memoryHit.assuntos?.length > 0 || effectiveSubtopics.length > 0 || effectiveLessons.length > 0 || fallbackTopic) {
          if (memoryHit && memoryHit.assuntos?.length > 0) {
            renderFilterBanner(`💾 Aplicando correção memorizada (${memoryHit.assuntos.length})...`);
          } else if (effectiveSubtopics.length > 0) {
            renderFilterBanner(`⏳ Filtrando ${effectiveSubtopics.length} subassuntos do Índice...`);
          } else {
            renderFilterBanner(`⏳ Selecionando Aula(s): ${displayTarget}...`);
          }
          topicOk = await selectCaveiraLessonsInDropdown(effectiveLessons, fallbackTopic, effectiveSubtopics, effectiveSubjectForFilter, {
            savedMemoryAssuntos: memoryHit ? memoryHit.assuntos : [],
            diagLog: lastFilterDiagnosticLog
          });
          await sleepMs(300);
        }
        await sleepMs(250);
        const applyBtn = findCaveiraFilterSubmitButton();
        if (applyBtn) {
          try {
            applyBtn.scrollIntoView({ block: "center", inline: "nearest" });
          } catch (_) {
          }
          await sleepMs(120);
          clickElementRealistically(applyBtn);
          const nestedBtn = applyBtn.querySelector('button, [role="button"], .q-btn');
          if (nestedBtn && nestedBtn !== applyBtn) {
            clickElementRealistically(nestedBtn);
          }
          await sleepMs(300);
        }
        try {
          window.scrollBy({ top: 260, behavior: "smooth" });
        } catch (_) {
        }
        if (lastFilterDiagnosticLog) {
          lastFilterDiagnosticLog.final = {
            subjectOk,
            topicOk,
            unresolvedOk,
            applyBtnFound: Boolean(applyBtn),
            appliedDom: readAppliedFiltersFromDom(),
            elapsedMs: Date.now() - filterStartedAt
          };
        }
        const summary = [effectiveSubjectForFilter, displayTarget].filter(Boolean).join(" • ");
        const memTag = memoryHit && memoryHit.assuntos?.length > 0 ? " • 💾 Memória" : "";
        const subtag = effectiveSubtopics.length > 0 ? ` • ${effectiveSubtopics.length} subassuntos` : "";
        if (subjectOk && topicOk && applyBtn) {
          const statusTag = unresolvedOk ? "Não resolvidas" : "Não resolvidas pendente";
          renderFilterBanner(`✅ Filtro aplicado (${statusTag}${memTag}${subtag}): ${summary}`);
        } else if (subjectOk && topicOk) {
          renderFilterBanner(`⚠️ Selecionado (clique em Filtrar): ${summary}`);
        } else {
          renderFilterBanner(`⚠️ Parcial (${subjectOk ? "Disciplina OK" : "Disciplina não encontrada"} / ${topicOk ? "Assunto OK" : "Selecione o assunto"})`);
        }
      } finally {
        isApplyingFilter = false;
      }
    }
    function findCaveiraFilterSubmitButton() {
      const allowedExact = ["filtrar", "filtrar questoes", "aplicar", "aplicar filtros", "buscar", "buscar questoes", "pesquisar"];
      const blockedWords = ["carreiras", "digite", "limpar", "salvar", "caderno", "filtros"];
      const rawCandidates = Array.from(
        document.querySelectorAll('button, [role="button"], .q-btn, a, input[type="button"], input[type="submit"], div, span')
      ).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 36 || r.width > 380 || r.height < 20 || r.height > 72) return false;
        let txt = normalizeFilterText(el.tagName === "INPUT" ? el.value : el.innerText || el.textContent);
        txt = txt.replace(/\b(filter_alt|filter_list|search|tune|find_in_page)\b/g, " ").replace(/\s+/g, " ").trim();
        if (!txt || txt.length > 40) return false;
        if (blockedWords.some((bw) => txt.includes(bw))) return false;
        return allowedExact.includes(txt) || txt.startsWith("filtrar ") || txt.endsWith(" filtrar");
      });
      const resolved = [];
      for (const el of rawCandidates) {
        let clickable = el.closest('button, [role="button"], .q-btn, a, input[type="button"], input[type="submit"]');
        if (!clickable) {
          let cur = el;
          for (let depth = 0; depth < 4 && cur && cur !== document.body; depth++) {
            const r = cur.getBoundingClientRect();
            const cursorStyle = window.getComputedStyle(cur).cursor;
            if (r.height >= 28 && r.height <= 60 && r.width >= 36 && r.width <= 380 && (cursorStyle === "pointer" || depth === 0)) {
              clickable = cur;
              if (cursorStyle === "pointer") break;
            }
            cur = cur.parentElement;
          }
        }
        if (clickable && !clickable.closest("#qg-caveira-shadow-host, #qg-caveira-hud") && isElementVisible(clickable)) {
          resolved.push(clickable);
        }
      }
      const unique = Array.from(new Set(resolved));
      unique.sort((a, b) => {
        const aNative = a.matches('button, [role="button"], .q-btn, input[type="submit"], input[type="button"]') ? 0 : 1;
        const bNative = b.matches('button, [role="button"], .q-btn, input[type="submit"], input[type="button"]') ? 0 : 1;
        if (aNative !== bNative) return aNative - bNative;
        const aExact = normalizeFilterText(a.innerText || a.textContent || a.value || "") === "filtrar" ? 0 : 1;
        const bExact = normalizeFilterText(b.innerText || b.textContent || b.value || "") === "filtrar" ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return ra.width * ra.height - rb.width * rb.height;
      });
      return unique[0] || null;
    }
    function updateHudUser() {
      const userTextEl = getHudEl("qg-hud-user-text");
      const userBarEl = getHudEl("qg-hud-user-bar");
      if (!userTextEl || !userBarEl) return;
      if (cachedActiveUserId) {
        const label = (cachedActiveUserLabel || "").trim() || `ID ${String(cachedActiveUserId).slice(0, 8)}...`;
        userTextEl.textContent = `👤 ${label}`;
        userTextEl.title = label;
        userBarEl.style.color = "#86efac";
        userBarEl.style.background = "rgba(16, 185, 129, 0.08)";
      } else {
        userTextEl.textContent = "🟡 Faça login no QG para vincular";
        userTextEl.title = "Nenhuma conta vinculada";
        userBarEl.style.color = "#fde68a";
        userBarEl.style.background = "rgba(251, 191, 36, 0.06)";
      }
    }
    function startTimerInterval() {
      if (timerInterval) return;
      timerInterval = setInterval(() => {
        checkDailySessionReset();
        if (document.visibilityState === "visible" && isTimerRunning && currentQuestionId) {
          timerSeconds = (questionTimers.get(currentQuestionId) || 0) + 1;
          questionTimers.set(currentQuestionId, timerSeconds);
          renderTimerDisplay();
        }
      }, 1e3);
    }
    function renderTimerDisplay() {
      const timerEl = getHudEl("qg-timer");
      if (!timerEl) return;
      const mins = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
      const secs = String(timerSeconds % 60).padStart(2, "0");
      timerEl.textContent = `${mins}:${secs}`;
      if (isTimerRunning) {
        timerEl.style.opacity = "1";
        timerEl.style.color = timerSeconds >= 150 ? "#ef4444" : timerSeconds >= 90 ? "#f97316" : "#fbbf24";
      } else {
        timerEl.style.opacity = "0.7";
      }
    }
    function pauseTimer() {
      isTimerRunning = false;
    }
    function clearActiveQuestionState() {
      if (!currentQuestionId && !isTimerRunning) {
        if (isCoursePage() && currentCourseIndexStatus?.count > 0) {
          const currentQEl2 = getHudEl("qg-current-q-id");
          if (currentQEl2) {
            const capLabel = currentCourseIndexStatus.source === "bizus" ? "Bizus capturado" : "Índice capturado";
            currentQEl2.textContent = `📑 ${capLabel} (${currentCourseIndexStatus.count} subassuntos)`;
            currentQEl2.title = currentCourseIndexStatus.preview || "";
          }
        }
        return;
      }
      isTimerRunning = false;
      currentQuestionId = null;
      timerSeconds = 0;
      dismissPrompt();
      renderTimerDisplay();
      renderQuestionHistory(null, false);
      const currentQEl = getHudEl("qg-current-q-id");
      if (currentQEl) {
        if (isCoursePage() && currentCourseIndexStatus?.count > 0) {
          const capLabel = currentCourseIndexStatus.source === "bizus" ? "Bizus capturado" : "Índice capturado";
          currentQEl.textContent = `📑 ${capLabel} (${currentCourseIndexStatus.count} subassuntos)`;
          currentQEl.title = currentCourseIndexStatus.preview || "";
        } else {
          currentQEl.textContent = "Aguardando questão...";
        }
      }
    }
    function renderQuestionHistory(qId, isCurrentQuestionAnswered = false) {
      const box = getHudEl("qg-hud-history-box");
      if (!box) return;
      if (!qId) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
      }
      const previousData = questionsCache.find((q) => q && q.id === qId);
      if (!previousData || !previousData.timestamp) {
        box.style.display = "none";
        box.innerHTML = "";
        return;
      }
      const qDate = new Date(previousData.timestamp);
      const now = /* @__PURE__ */ new Date();
      const diffMs = Math.max(0, now - qDate);
      const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
      const timeLabel = diffDays === 0 ? "hoje" : diffDays === 1 ? "ontem" : `há ${diffDays} dias`;
      const isHit = Boolean(previousData.hit);
      const statusText = isHit ? previousData.confidence === "chute" ? "ACERTOU NO CHUTE 🎲" : previousData.confidence === "duvida" ? "ACERTOU COM DÚVIDA 🤔" : "ACERTOU ANTERIORMENTE ✓" : `ERROU ANTERIORMENTE ✗ (${previousData.errorReason === "atencao" ? "Atenção" : previousData.errorReason === "interpretacao" ? "Interpretação" : "Teoria"})`;
      const bizuHtml = previousData.userNote ? `<div class="qg-history-bizu">💡 <strong>Seu Bizu:</strong> ${escapeHtml(previousData.userNote)}</div>` : "";
      let choicesHtml = "";
      if (isCurrentQuestionAnswered) {
        const activeChoice = activeQuestionData && activeQuestionData.id === qId ? activeQuestionData.userChoice : null;
        const activeGabarito = activeQuestionData && activeQuestionData.id === qId ? activeQuestionData.correctChoice : null;
        const userChoice = activeChoice || previousData.userChoice || "?";
        const gabarito = activeGabarito || previousData.correctChoice || "?";
        choicesHtml = `<div style="font-size: 9px; opacity: 0.85; margin-top: 1px;">Você marcou: <strong>${escapeHtml(userChoice)}</strong> | Gabarito: <strong>${escapeHtml(gabarito)}</strong></div>`;
      }
      box.className = `qg-hud-history ${isHit ? "hit-history" : "error-history"}`;
      box.innerHTML = `
      <div>
        <span class="qg-history-badge">${isHit ? "✓ HISTÓRICO" : "⚠️ ATENÇÃO: REPETIDA"}</span>
        <div style="font-weight: 700;">${escapeHtml(statusText)} (${escapeHtml(timeLabel)})</div>
        ${choicesHtml}
      </div>
      ${bizuHtml}
    `;
      box.style.display = "block";
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
        if (!activeQuestionData || activeQuestionData.id !== newQId) {
          dismissPrompt();
        }
      }
      renderQuestionHistory(newQId, isAlreadyAnswered);
      renderTimerDisplay();
      const currentQEl = getHudEl("qg-current-q-id");
      if (currentQEl) {
        currentQEl.textContent = isAlreadyAnswered ? `${newQId} ✓` : newQId;
      }
    }
    function updateHudGoal() {
      const elRatio = getHudEl("qg-hud-goal-ratio");
      const elBar = getHudEl("qg-hud-goal-bar");
      if (!elRatio || !elBar) return;
      const current = Number(sessionStats.total) || 0;
      const goal = cachedDailyGoal || 50;
      const pct = Math.min(100, Math.round(current / goal * 100));
      if (current >= goal) {
        elRatio.innerHTML = `<span style="color:#10b981;">🏆 ${current}/${goal} (100%)</span>`;
        elBar.style.background = "#10b981";
        elBar.style.width = "100%";
      } else {
        elRatio.textContent = `${current} / ${goal} (${pct}%)`;
        elBar.style.background = "linear-gradient(90deg, #0284c7, #10b981)";
        elBar.style.width = `${pct}%`;
      }
    }
    function updateHudStats() {
      const elTotal = getHudEl("qg-stat-total");
      const elHits = getHudEl("qg-stat-hits");
      const elErrors = getHudEl("qg-stat-errors");
      const elNet = getHudEl("qg-stat-net");
      if (!elTotal) return;
      elTotal.textContent = sessionStats.total;
      elHits.textContent = sessionStats.hits;
      elErrors.textContent = sessionStats.errors;
      const rate = sessionStats.total > 0 ? Math.round(sessionStats.hits / sessionStats.total * 100) : 0;
      elNet.textContent = `${rate}%`;
      elNet.className = `qg-hud-stat-value ${rate >= 70 ? "green" : rate >= 50 ? "gold" : sessionStats.total === 0 ? "gold" : "red"}`;
      updateHudGoal();
    }
    function updateHudMission() {
      const box = getHudEl("qg-hud-mission-box");
      if (!box) return;
      if (!activePracticeMission || !activePracticeMission.id) {
        box.style.display = "none";
        return;
      }
      const m = activePracticeMission;
      const count = Array.isArray(m.answeredQuestionIds) ? m.answeredQuestionIds.length : 0;
      const target = Math.max(1, Number(m.targetCount) || 1);
      const hits = Number(m.hits) || 0;
      const errors = Number(m.errors) || 0;
      const pct = Math.min(100, Math.round(count / target * 100));
      const isCompleted = m.status === "completed" || count >= target;
      const diffNames = { 1: "Em definição", 2: "Muito fácil", 3: "Fácil", 4: "Médio", 5: "Difícil", 6: "Muito difícil" };
      const diffLabel = (Array.isArray(m.activeDifficultyIds) ? m.activeDifficultyIds : []).map((id) => diffNames[Number(id)]).filter(Boolean).join(" + ") || "Muito fácil";
      const titleEl = getHudEl("qg-mission-title");
      const counterEl = getHudEl("qg-mission-counter");
      const subEl = getHudEl("qg-mission-subtitle");
      const barEl = getHudEl("qg-mission-bar");
      const scoreEl = getHudEl("qg-mission-score");
      const expandBtn = getHudEl("qg-btn-mission-expand");
      const qgBtn = getHudEl("qg-btn-mission-qg");
      box.style.display = "flex";
      if (isCompleted) {
        box.style.background = "rgba(16,185,129,0.16)";
        box.style.borderColor = "rgba(16,185,129,0.45)";
        if (titleEl) {
          if (m.type === "progressive_review") {
            titleEl.textContent = hits === target ? "🏆 Revisão 100%! Subiu de nível!" : `🔁 Revisão ${hits}/${target} — Mesmo nível`;
          } else {
            titleEl.textContent = `✅ Fixação ${count}/${target} concluída!`;
          }
          titleEl.style.color = "#6ee7b7";
        }
        if (subEl) subEl.textContent = `${m.title || m.topicName || "Aula"} • Sincronizado com o QG`;
        if (counterEl) {
          counterEl.textContent = `${count}/${target}`;
          counterEl.style.color = "#6ee7b7";
        }
        if (barEl) {
          barEl.style.width = "100%";
          barEl.style.background = "#10b981";
        }
        if (scoreEl) scoreEl.textContent = `${hits}C / ${errors}E`;
        if (expandBtn) expandBtn.style.display = "none";
        if (qgBtn) qgBtn.style.display = "inline-block";
      } else {
        box.style.background = "rgba(14,165,233,0.12)";
        box.style.borderColor = "rgba(56,189,248,0.35)";
        if (titleEl) {
          titleEl.textContent = m.type === "progressive_review" ? `🔁 Revisão · ${diffLabel}` : `🎯 Fixação · ${diffLabel}`;
          titleEl.style.color = "#e0f2fe";
        }
        if (subEl) {
          const goalNote = m.type === "progressive_review" ? " • Meta: 100%" : "";
          subEl.textContent = `${m.title || m.topicName || "Aula"}${goalNote}`;
        }
        if (counterEl) {
          counterEl.textContent = `${count}/${target}`;
          counterEl.style.color = "#38bdf8";
        }
        if (barEl) {
          barEl.style.width = `${pct}%`;
          barEl.style.background = "linear-gradient(90deg,#0ea5e9,#10b981)";
        }
        if (scoreEl) scoreEl.textContent = `${hits}C / ${errors}E`;
        if (expandBtn) expandBtn.style.display = "inline-block";
        if (qgBtn) qgBtn.style.display = "none";
      }
    }
    function getQuestionCards() {
      const allCards = document.querySelectorAll(".q-card");
      return Array.from(allCards).filter((card) => {
        if (card.closest("#qg-caveira-shadow-host, #qg-caveira-hud")) return false;
        if (card.parentElement && card.parentElement.closest(".q-card")) return false;
        const rect = card.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const hasNumber = Boolean(card.querySelector(".number"));
        const hasAlternatives = Boolean(card.querySelector(".question-alternatives, .alternative, .alternative-letter"));
        return hasNumber && hasAlternatives;
      });
    }
    function findCardInViewport(cards) {
      if (!cards || cards.length === 0) return null;
      if (cards.length === 1) return cards[0];
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const focalY = viewportHeight * 0.38;
      let bestCard = null;
      let bestDistance = Infinity;
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (rect.bottom < 40 || rect.top > viewportHeight - 40) continue;
        if (rect.top <= focalY && rect.bottom >= focalY) {
          return card;
        }
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
      const numberEl = card.querySelector(".number");
      if (numberEl) {
        const match = numberEl.textContent.match(/Q\s*[:.-]?\s*(\d{2,9})/i);
        if (match) return `Q${match[1]}`;
      }
      return null;
    }
    function isCardAnswered(card) {
      if (!card) return false;
      const statsBox = card.querySelector(".stats-box");
      if (statsBox) {
        const text = (statsBox.textContent || "").toUpperCase();
        if (Boolean(statsBox.querySelector(".bg-correct-1, .bg-correct-2, .bg-incorrect-1, .bg-incorrect-2, .title-stats")) || text.includes("PARABÉNS") || text.includes("ERROU") || text.includes("VOCÊ ACERTOU") || text.includes("VOCÊ ERROU") || text.includes("RESPOSTA CORRETA") || text.includes("GABARITO DEFINITIVO")) {
          return true;
        }
      }
      const altScope = card.querySelector(".question-alternatives") || card;
      const hasColoredAlternative = Boolean(
        altScope.querySelector(
          ".alternative.bg-correct-1, .alternative.bg-correct-2, .alternative.bg-incorrect-1, .alternative.bg-incorrect-2, .alternative-letter.bg-correct-1, .alternative-letter.bg-correct-2, .alternative-letter.bg-incorrect-1, .alternative-letter.bg-incorrect-2, .bg-positive, .bg-negative, .text-positive, .text-negative"
        )
      );
      if (hasColoredAlternative) return true;
      return false;
    }
    function classifyPRFCategory(subject, topic, content) {
      const s = (subject || "").toLowerCase();
      const t = (topic || "").toLowerCase();
      const c = (content || "").toLowerCase();
      const full = `${s} ${t} ${c}`;
      if (s.includes("informática") || s.includes("informatica") || t.includes("informática") || t.includes("segurança da informação") || t.includes("redes")) {
        return { bloco: "Bloco I", canonicalSubject: "Informática" };
      }
      if (s.includes("português") || s.includes("portuguesa") || s.includes("língua portuguesa")) {
        return { bloco: "Bloco I", canonicalSubject: "Língua Portuguesa" };
      }
      if (s.includes("raciocínio lógico") || s.includes("raciocinio logico") || s.includes("rlm") || s.includes("matemática") || s.includes("física") || s.includes("fisica")) {
        return { bloco: "Bloco I", canonicalSubject: s.includes("física") || s.includes("fisica") ? "Física" : "Raciocínio Lógico-Matemático" };
      }
      if (s.includes("ética") || s.includes("etica") || s.includes("geopolítica") || s.includes("geopolitica") || s.includes("inglês") || s.includes("espanhol")) {
        const canonical = s.includes("ética") || s.includes("etica") ? "Ética e Cidadania" : s.includes("geopolítica") || s.includes("geopolitica") ? "Geopolítica" : "Língua Estrangeira";
        return { bloco: "Bloco I", canonicalSubject: canonical };
      }
      if (s.includes("trânsito") || s.includes("transito") || s.includes("ctb") || s.includes("contran")) {
        const subCat = full.includes("contran") || full.includes("resolução") || full.includes("resolucao") || full.includes("resoluções") || full.includes("resolucoes") ? "Resoluções do CONTRAN" : "Legislação de Trânsito (CTB)";
        return { bloco: "Bloco II", canonicalSubject: subCat };
      }
      if (s.includes("constitucional")) return { bloco: "Bloco III", canonicalSubject: "Direito Constitucional" };
      if (s.includes("administrativo")) return { bloco: "Bloco III", canonicalSubject: "Direito Administrativo" };
      if (s.includes("processual penal")) return { bloco: "Bloco III", canonicalSubject: "Direito Processual Penal" };
      if (s.includes("penal especial") || s.includes("legislação especial") || s.includes("leis especiais")) return { bloco: "Bloco III", canonicalSubject: "Legislação Penal Especial" };
      if (s.includes("direitos humanos")) return { bloco: "Bloco III", canonicalSubject: "Direitos Humanos" };
      if (s.includes("direito penal")) return { bloco: "Bloco III", canonicalSubject: "Direito Penal" };
      if (full.includes("trânsito") || full.includes("transito") || full.includes("ctb") || full.includes("9.503") || full.includes("contran") || full.includes("resolução") || full.includes("resolucao") || full.includes("resoluções") || full.includes("resolucoes") || full.includes("sinalização") || full.includes("habilitação") || full.includes("sinistro")) {
        const subCat = full.includes("contran") || full.includes("resolução") || full.includes("resolucao") || full.includes("resoluções") || full.includes("resolucoes") ? "Resoluções do CONTRAN" : "Legislação de Trânsito (CTB)";
        return { bloco: "Bloco II", canonicalSubject: subCat };
      }
      if (full.includes("constitucional") || full.includes("constituição") || full.includes("art. 5") || full.includes("art. 144")) {
        return { bloco: "Bloco III", canonicalSubject: "Direito Constitucional" };
      }
      if (full.includes("administrativo") || full.includes("8.112") || full.includes("improbidade") || full.includes("8.429") || full.includes("14.133") || full.includes("licitaç") || full.includes("atos administrativos") || full.includes("poderes administrativos")) {
        return { bloco: "Bloco III", canonicalSubject: "Direito Administrativo" };
      }
      if (full.includes("processual penal") || full.includes("processo penal") || full.includes("inquérito") || full.includes("prisão em flagrante") || full.includes("ação penal")) {
        return { bloco: "Bloco III", canonicalSubject: "Direito Processual Penal" };
      }
      if (full.includes("legislação especial") || full.includes("leis especiais") || full.includes("11.343") || full.includes("drogas") || full.includes("10.826") || full.includes("desarmamento") || full.includes("armas") || full.includes("13.869") || full.includes("abuso de autoridade") || full.includes("9.455") || full.includes("tortura") || full.includes("8.072") || full.includes("hediondos") || full.includes("12.850") || full.includes("organizações criminosas") || full.includes("9.099") || full.includes("maria da penha") || full.includes("9.605") || full.includes("meio ambiente") || full.includes("estatuto da criança") || full.includes("eca")) {
        return { bloco: "Bloco III", canonicalSubject: "Legislação Penal Especial" };
      }
      if (full.includes("direitos humanos") || full.includes("pacto de san josé") || full.includes("declaração universal")) {
        return { bloco: "Bloco III", canonicalSubject: "Direitos Humanos" };
      }
      if (full.includes("direito penal") || full.includes("código penal") || full.includes("teoria do crime") || full.includes("crimes contra") || full.includes("peculato") || full.includes("homicídio")) {
        return { bloco: "Bloco III", canonicalSubject: "Direito Penal" };
      }
      if (full.includes("português") || full.includes("portuguesa") || full.includes("gramática") || full.includes("redação oficial") || full.includes("sintaxe") || full.includes("crase") || full.includes("pontuação") || full.includes("concordância") || full.includes("regência")) {
        return { bloco: "Bloco I", canonicalSubject: "Língua Portuguesa" };
      }
      if (full.includes("raciocínio lógico") || full.includes("rlm") || full.includes("matemática") || full.includes("probabilidade") || full.includes("estatística") || full.includes("combinatória") || full.includes("proposiç")) {
        return { bloco: "Bloco I", canonicalSubject: "Raciocínio Lógico-Matemático" };
      }
      if (full.includes("informática") || full.includes("redes de computadores") || full.includes("segurança da informação") || full.includes("windows") || full.includes("linux") || full.includes("internet") || full.includes("malware") || full.includes("código de verificação") || full.includes("hash")) {
        return { bloco: "Bloco I", canonicalSubject: "Informática" };
      }
      if (full.includes("física") || full.includes("cinemática") || full.includes("dinâmica") || full.includes("energia mecânica") || full.includes("colisões") || full.includes("quantidade de movimento")) {
        return { bloco: "Bloco I", canonicalSubject: "Física" };
      }
      if (full.includes("ética") || full.includes("1.171") || full.includes("cidadania")) {
        return { bloco: "Bloco I", canonicalSubject: "Ética e Cidadania" };
      }
      if (full.includes("geopolítica") || full.includes("geografia")) {
        return { bloco: "Bloco I", canonicalSubject: "Geopolítica" };
      }
      if (full.includes("inglês") || full.includes("espanhol") || full.includes("língua estrangeira")) {
        return { bloco: "Bloco I", canonicalSubject: "Língua Estrangeira" };
      }
      return { bloco: "Bloco I", canonicalSubject: subject || "Geral" };
    }
    function extractQuestionData(card, qId) {
      if (!card) return null;
      const numericFromQId = Number(String(qId || "").replace(/^Q/i, "").replace(/\D+/g, ""));
      const apiData = apiQuestionByCode.get(qId) || (Number.isFinite(numericFromQId) && numericFromQId > 0 ? apiQuestionByApiId.get(numericFromQId) : null) || apiQuestionCache.get(qId) || null;
      let subject = "Geral";
      let topic = "Geral";
      const subjectEl = card.querySelector('.subject, [class*="subject"], [class*="disciplina"]');
      let rawSubjectText = subjectEl ? subjectEl.textContent.trim() : "";
      if (!rawSubjectText) {
        const numberEl = card.querySelector(".number");
        const headerRow = numberEl ? numberEl.closest(".row, .q-card__section, div") || numberEl.parentElement : null;
        if (headerRow) {
          const possibleElements = headerRow.querySelectorAll("div, span, p");
          for (const el of possibleElements) {
            if (el.textContent && el.textContent.includes("->")) {
              rawSubjectText = el.textContent.trim();
              break;
            }
          }
        }
      }
      if (rawSubjectText) {
        const parts = rawSubjectText.split("->").map((s) => s.trim()).filter(Boolean);
        subject = parts[0] || "Geral";
        topic = parts.slice(1).join(" ➔ ") || subject;
      }
      if (subject === "Geral" && apiData?.subject) {
        subject = apiData.subject;
      }
      if (topic === "Geral" && (apiData?.subtopic || apiData?.subtopicPath)) {
        if (apiData.subtopic) {
          topic = apiData.subtopic;
        } else {
          const pathParts = String(apiData.subtopicPath).split(/->|➔|›|>/).map((s) => s.trim()).filter(Boolean);
          topic = pathParts.slice(1).join(" ➔ ") || pathParts[0] || topic;
        }
      }
      const subtopicPath = apiData?.subtopicPath || rawSubjectText || "";
      const infoText = card.querySelector(".question-info")?.textContent || "";
      const bancaMatch = infoText.match(/Banca:\s*(.+?)(?=\s*(?:Ano:|Dificuldade:|Órgão:|Cargo:|\n|$))/i);
      const anoMatch = infoText.match(/Ano:\s*(\d+)/i);
      const diffMatch = infoText.match(/Dificuldade:\s*([^\n]+)/i);
      const banca = bancaMatch && bancaMatch[1].trim() || apiData?.banca || "CAVEIRA";
      const ano = anoMatch ? anoMatch[1].trim() : apiData?.ano || "2026";
      const difficulty = diffMatch ? diffMatch[1].trim() : apiData?.difficulty || "Média";
      const domContent = card.querySelector(".content")?.innerText?.trim() || "";
      const content = domContent || apiData?.content || "";
      const { bloco, canonicalSubject } = classifyPRFCategory(subject, topic, content);
      const statsBox = card.querySelector(".stats-box");
      const statsText = statsBox ? statsBox.textContent : "";
      let correctLetterFromDom = null;
      let incorrectLetterFromDom = null;
      const altScope = card.querySelector(".question-alternatives") || card;
      const altItems = altScope.querySelectorAll('.alternative, [class*="alternative"]');
      altItems.forEach((altEl) => {
        const letterEl = altEl.querySelector('.alternative-letter, [class*="letter"]') || altEl;
        let rawLetter = (altEl.querySelector('.alternative-letter, [class*="letter"]')?.textContent || "").trim().toUpperCase();
        if (!rawLetter || rawLetter.length > 2) {
          const match = (altEl.textContent || "").trim().match(/^([A-E])\b/i);
          if (match) rawLetter = match[1].toUpperCase();
        }
        if (!rawLetter || rawLetter.length > 2) return;
        const combinedClasses = `${altEl.className || ""} ${letterEl.className || ""} ${altEl.parentElement?.className || ""}`;
        const styleAttr = `${altEl.getAttribute("style") || ""} ${letterEl.getAttribute("style") || ""}`;
        const isRed = /\b(bg-incorrect(?:-\d+)?|incorrect|is-wrong|wrong|bg-negative|text-negative|danger)\b/i.test(combinedClasses) || styleAttr.includes("rgb(239, 68, 68)") || styleAttr.includes("#ef4444") || styleAttr.includes("red");
        const isGreen = !isRed && (/\b(bg-correct(?:-\d+)?|correct|is-correct|bg-positive|text-positive|success)\b/i.test(combinedClasses) || styleAttr.includes("rgb(16, 185, 129)") || styleAttr.includes("#10b981") || styleAttr.includes("green"));
        if (isRed) {
          incorrectLetterFromDom = rawLetter;
        } else if (isGreen) {
          correctLetterFromDom = rawLetter;
        }
      });
      const fullCardText = card.innerText || card.textContent || "";
      const statsAnswerMatch = statsText.match(/(?:Resposta correta|Gabarito|Alternativa correta|Gabarito definitivo|Resposta)\s*[:=]?\s*\(?([A-E])\)?/i) || fullCardText.match(/(?:Resposta correta|Gabarito|Alternativa correta|Gabarito definitivo|Resposta)\s*[:=]?\s*\(?([A-E])\)?/i);
      const hasStatsIncorrect = Boolean(statsBox?.querySelector(".bg-incorrect-1, .bg-incorrect-2, .bg-negative, .text-negative")) || /\b(VOC[EÊ]\s+ERROU|ERROU|INCORRETA|RESPOSTA\s+ERRADA)\b/i.test(statsText);
      const hasStatsCorrect = !hasStatsIncorrect && (Boolean(statsBox?.querySelector(".bg-correct-1, .bg-correct-2, .bg-positive, .text-positive")) || /\b(PARAB[EÉ]NS|VOC[EÊ]\s+ACERTOU|ACERTOU)\b/i.test(statsText));
      const rawApiAns = (apiData?.apiId ? apiAnswerCache.get(Number(apiData.apiId)) : null) || (Number.isFinite(numericFromQId) && numericFromQId > 0 ? apiAnswerCache.get(numericFromQId) : null) || null;
      const apiAns = rawApiAns && Date.now() - Number(rawApiAns.at || 0) < 18e4 ? rawApiAns : null;
      const domIsCorrect = incorrectLetterFromDom || hasStatsIncorrect ? false : hasStatsCorrect || Boolean(correctLetterFromDom) && !statsText.toUpperCase().includes("RESPOSTA CORRETA");
      const isCorrect = apiAns ? Boolean(apiAns.hit) : domIsCorrect;
      const userSelectedEl = altScope.querySelector('.q-radio[aria-checked="true"], .q-radio--active, [class*="selected"], [class*="active"], input:checked');
      let userChoiceFromRadio = null;
      if (userSelectedEl) {
        const parentAlt = userSelectedEl.closest('.alternative, [class*="alternative"]') || userSelectedEl.parentElement;
        const l = (parentAlt?.querySelector('.alternative-letter, [class*="letter"]')?.textContent || "").trim().toUpperCase();
        if (l && l.length <= 2) userChoiceFromRadio = l;
      }
      const userChoice = (apiAns?.userAnswer ? String(apiAns.userAnswer).toUpperCase() : null) || incorrectLetterFromDom || (isCorrect ? correctLetterFromDom : null) || userChoiceFromRadio || lastUserClickedChoice || (isCorrect ? correctLetterFromDom || "C" : "E");
      let correctChoice = (apiAns?.correctAnswer ? String(apiAns.correctAnswer).toUpperCase() : null) || (apiData?.correctAnswer ? String(apiData.correctAnswer).toUpperCase() : null) || correctLetterFromDom;
      if (!correctChoice && statsAnswerMatch) {
        correctChoice = statsAnswerMatch[1].toUpperCase();
      } else if (!correctChoice && isCorrect) {
        correctChoice = userChoice;
      } else if (!correctChoice) {
        const checkIconEl = Array.from(altScope.querySelectorAll('.material-icons, [class*="check"]')).find((el) => el.classList && Array.from(el.classList).some((c) => c.includes("check")) || (el.textContent || "").trim().toLowerCase() === "check");
        const checkIconAlt = checkIconEl?.closest(".alternative");
        const checkLetter = (checkIconAlt?.querySelector(".alternative-letter")?.textContent || "").trim().toUpperCase();
        if (checkLetter && checkLetter.length <= 2) {
          correctChoice = checkLetter;
        } else {
          correctChoice = userChoice === "C" ? "E" : "C";
        }
      }
      function cleanAlternativeText(rawText, letter) {
        if (!rawText || typeof rawText !== "string") return "";
        let clean = rawText.trim();
        const safeLetter = letter && /^[A-Za-z0-9]$/.test(String(letter).trim()) ? String(letter).trim() : "[A-E]";
        const letterPrefixRegex = new RegExp(`^\\(?\\s*${safeLetter}\\s*[\\).\\-–—:]?\\s+`, "i");
        clean = clean.replace(letterPrefixRegex, "").trim();
        const isOnlyPercentage = /^\d+(?:[.,]\d+)?\s*%\s*$/.test(clean);
        if (!isOnlyPercentage) {
          clean = clean.replace(/^\s*\d{1,3}(?:[.,]\d+)?\s*%\s*/, "").trim();
          clean = clean.replace(/\s*\d{1,3}(?:[.,]\d+)?\s*%\s*$/, "").trim();
        }
        return clean || rawText;
      }
      const alternatives = [];
      const seenLetters = /* @__PURE__ */ new Set();
      const altScopeForText = card.querySelector(".question-alternatives") || card;
      const letterNodes = altScopeForText.querySelectorAll(".alternative-letter");
      letterNodes.forEach((letterNode) => {
        const rawLetter = (letterNode.textContent || "").trim().replace(/[^A-Za-z]/g, "").toUpperCase();
        if (!rawLetter || rawLetter.length > 2 || seenLetters.has(rawLetter)) return;
        const rowEl = letterNode.closest(".alternative") || letterNode.parentElement;
        if (!rowEl) return;
        const clone = rowEl.cloneNode(true);
        clone.querySelectorAll('.alternative-letter, .q-radio__inner, button, .q-icon, i.material-icons, .q-badge, .q-linear-progress, .q-tooltip, [class*="percent"], [class*="badge"], [class*="stat"], [class*="progress"]').forEach((el) => el.remove());
        let altText = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
        altText = cleanAlternativeText(altText, rawLetter);
        if (altText) {
          seenLetters.add(rawLetter);
          alternatives.push({
            letter: rawLetter,
            text: altText
          });
        }
      });
      if (alternatives.length === 0) {
        const altEls = altScopeForText.querySelectorAll(".alternative");
        altEls.forEach((altEl, idx) => {
          const defaultLetters = ["A", "B", "C", "D", "E"];
          const clone = altEl.cloneNode(true);
          clone.querySelectorAll('.alternative-letter, .q-radio__inner, button, .q-icon, i.material-icons, .q-badge, .q-linear-progress, .q-tooltip, [class*="percent"], [class*="badge"], [class*="stat"], [class*="progress"]').forEach((el) => el.remove());
          const rawText = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
          if (!rawText) return;
          const match = rawText.match(/^([A-E])[\s.)-]+(.*)$/i);
          const letter = match ? match[1].toUpperCase() : defaultLetters[idx] || String(idx + 1);
          const text = cleanAlternativeText(match ? match[2].trim() : rawText, letter);
          if (!seenLetters.has(letter) && text) {
            seenLetters.add(letter);
            alternatives.push({ letter, text });
          }
        });
      }
      const elapsedForThisQ = questionTimers.get(qId) || timerSeconds || 10;
      const durationSeconds = Math.max(3, elapsedForThisQ);
      const teacherComment = extractTeacherCommentFromCard(card) || apiData?.teacherComment || "";
      const finalAlternatives = alternatives.length > 0 ? alternatives : Array.isArray(apiData?.alternatives) && apiData.alternatives.length > 0 ? apiData.alternatives.map((a) => ({ letter: String(a.letter || a.answer || "").toUpperCase(), text: a.text || "" })).filter((a) => a.letter || a.text) : null;
      const treeMapped = cachedCaveiraTree ? resolveTreeIdsForQuestion(cachedCaveiraTree, {
        subject,
        subtopic: apiData?.subtopic || topic,
        subtopicPath
      }) : { subjectId: apiData?.subjectId || null, subtopicId: apiData?.subtopicId || null };
      const resolvedSubjectId = apiData?.subjectId || treeMapped.subjectId || null;
      const resolvedSubtopicId = apiData?.subtopicId || treeMapped.subtopicId || null;
      const commCorrectPct = apiAns?.communityCorrectPct ?? apiData?.communityCorrectPct;
      const commErrorPct = apiAns?.communityErrorPct ?? apiData?.communityErrorPct;
      const telemetry = buildStructuredTelemetryRecord({
        apiId: apiData?.apiId || (Number.isFinite(numericFromQId) && numericFromQId > 0 ? numericFromQId : null),
        subjectId: resolvedSubjectId,
        subtopicId: resolvedSubtopicId,
        banca,
        ano,
        acertou: isCorrect,
        data: getTodaySessionDate()
      });
      return {
        id: qId,
        ...apiData?.code ? { code: apiData.code } : {},
        ...telemetry,
        bloco,
        canonicalSubject,
        subject,
        topic,
        ...subtopicPath ? { subtopicPath } : {},
        difficulty,
        content: content.slice(0, 1e3),
        ...apiData?.supportingContent ? { supportingContent: apiData.supportingContent.slice(0, 1e3) } : {},
        alternatives: finalAlternatives,
        teacherComment: teacherComment || void 0,
        ...commCorrectPct !== void 0 ? { communityCorrectPct: commCorrectPct, communityErrorPct: commErrorPct } : {},
        ...apiData?.userNote ? { userNote: apiData.userNote } : {},
        ...apiData?.outdated !== void 0 ? { outdated: Boolean(apiData.outdated) } : {},
        userChoice,
        correctChoice,
        hit: isCorrect,
        durationSeconds,
        confidence: isCorrect ? "sabia" : "duvida",
        errorReason: isCorrect ? null : "conteudo",
        fsrsRequested: false,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    function saveQuestion(question, isMetadataUpdateOnly = false) {
      if (!isExtensionContextValid()) {
        teardownInstance();
        return;
      }
      const resolvedOwnerId = cachedActiveUserId || null;
      if (!resolvedOwnerId) {
        updateHudUser();
        return;
      }
      if (question?.ownerUserId && question.ownerUserId !== resolvedOwnerId) {
        return;
      }
      checkDailySessionReset();
      if (!isMetadataUpdateOnly) {
        sessionStats.total += 1;
        if (question.hit) sessionStats.hits += 1;
        else sessionStats.errors += 1;
        updateHudStats();
      }
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const buildAttemptsList = (prevObj, nextObj) => {
        const list = [];
        const addAttempt = (a) => {
          if (!a) return;
          const ts = a.timestamp || nowIso;
          const ms = new Date(ts).getTime() || 0;
          const hit = Boolean(a.hit);
          const userChoice = String(a.userChoice || "");
          const durationSeconds = Number(a.durationSeconds) || 0;
          const dup = list.some((ex) => {
            const exMs = new Date(ex.timestamp || 0).getTime() || 0;
            return Math.abs(exMs - ms) <= 5e3 && Boolean(ex.hit) === hit && String(ex.userChoice || "") === userChoice;
          });
          if (!dup) list.push({ timestamp: ts, hit, userChoice, durationSeconds });
        };
        if (prevObj) {
          if (Array.isArray(prevObj.attempts) && prevObj.attempts.length > 0) {
            prevObj.attempts.forEach(addAttempt);
          } else if (prevObj.timestamp || prevObj.userChoice) {
            addAttempt({
              timestamp: prevObj.timestamp || prevObj.updatedAt,
              hit: prevObj.hit,
              userChoice: prevObj.userChoice,
              durationSeconds: prevObj.durationSeconds
            });
          }
        }
        if (!isMetadataUpdateOnly) {
          addAttempt({
            timestamp: nextObj.timestamp || nowIso,
            hit: nextObj.hit,
            userChoice: nextObj.userChoice,
            durationSeconds: nextObj.durationSeconds
          });
        }
        return list;
      };
      const existingIdx = questionsCache.findIndex((q) => q && q.id === question.id);
      if (existingIdx >= 0) {
        const prev = questionsCache[existingIdx];
        const communityCorrectPct = question.communityCorrectPct !== void 0 ? question.communityCorrectPct : prev.communityCorrectPct;
        const communityErrorPct = question.communityErrorPct !== void 0 ? question.communityErrorPct : communityCorrectPct !== void 0 && communityCorrectPct !== null ? Math.max(0, Math.min(100, Math.round(100 - communityCorrectPct))) : prev.communityErrorPct;
        const hitVal = Boolean(question.hit !== void 0 ? question.hit : prev.hit);
        questionsCache[existingIdx] = {
          ...prev,
          ...question,
          ...resolvedOwnerId ? { ownerUserId: resolvedOwnerId } : {},
          attempts: buildAttemptsList(prev, question),
          teacherComment: question.teacherComment || prev.teacherComment || "",
          commentSource: question.commentSource || prev.commentSource || (question.teacherComment || prev.teacherComment ? "professor" : ""),
          userNote: question.userNote !== void 0 && question.userNote !== "" ? question.userNote : prev.userNote || "",
          ...communityCorrectPct !== void 0 && communityCorrectPct !== null ? { communityCorrectPct, communityErrorPct, isPegadinha: communityErrorPct >= 65, isAvoidableError: !hitVal && communityCorrectPct >= 65 } : {},
          alternatives: Array.isArray(question.alternatives) && question.alternatives.length > 0 ? question.alternatives : prev.alternatives || null,
          updatedAt: nowIso
        };
      } else {
        questionsCache.unshift({
          ...question,
          ...resolvedOwnerId ? { ownerUserId: resolvedOwnerId } : {},
          attempts: buildAttemptsList(null, question),
          updatedAt: question.updatedAt || nowIso
        });
      }
      savedQuestionIds.add(question.id);
      if (Array.isArray(question.alternatives) && question.alternatives.length > 0) {
        savedQuestionsMissingAlts.delete(question.id);
      }
      const updatedSession = {
        date: sessionStats.date || getTodaySessionDate(),
        total: sessionStats.total,
        hits: sessionStats.hits,
        errors: sessionStats.errors
      };
      function normalizeMissionSubjectToken(raw = "") {
        return String(raw || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      }
      function getMissionSubjectFamily(raw = "") {
        const norm = normalizeMissionSubjectToken(raw);
        if (!norm || norm === "geral") return "";
        if (/(?:transito|ctb|contran|9503)/.test(norm)) return "transito";
        if (/(?:informatica|redes|computador|internet|seguranca da informacao)/.test(norm)) return "informatica";
        if (/(?:portugues|lingua portuguesa|gramatica)/.test(norm)) return "portugues";
        if (/redacao/.test(norm)) return "redacao";
        if (/(?:raciocinio logico|matematica|\brlm\b)/.test(norm)) return "rlm";
        if (/fisica/.test(norm)) return "fisica";
        if (/(?:etica|cidadania)/.test(norm)) return "etica";
        if (/(?:geopolitica|geografia)/.test(norm)) return "geopolitica";
        if (/(?:ingles|espanhol|lingua estrangeira)/.test(norm)) return "lingua_estrangeira";
        if (/constitucional/.test(norm)) return "constitucional";
        if (/administrativo/.test(norm)) return "administrativo";
        if (/processual penal|processo penal/.test(norm)) return "processual_penal";
        if (/(?:legislacao especial|penal especial|leis especiais|extravagante|eca)/.test(norm)) return "legislacao_especial";
        if (/direitos humanos/.test(norm)) return "direitos_humanos";
        if (/(?:direito penal|\bpenal\b)/.test(norm)) return "penal";
        return "";
      }
      function doesQuestionMatchMissionSubject(q, m) {
        const mRaw = m?.subjectName || "";
        const qRaw = q?.canonicalSubject || q?.subject || "";
        const mNorm = normalizeMissionSubjectToken(mRaw);
        const qNorm = normalizeMissionSubjectToken(qRaw);
        if (!mNorm || !qNorm || qNorm === "geral") return true;
        const mFam = getMissionSubjectFamily(mRaw);
        const qFam = getMissionSubjectFamily(qRaw);
        if (mFam && qFam) return mFam === qFam;
        if (mFam || qFam) return false;
        return qNorm === mNorm || qNorm.includes(mNorm) || mNorm.includes(qNorm);
      }
      if (!isMetadataUpdateOnly && activePracticeMission && activePracticeMission.status === "active" && question?.id && doesQuestionMatchMissionSubject(question, activePracticeMission) && (!activePracticeMission.ownerUserId || activePracticeMission.ownerUserId === resolvedOwnerId)) {
        const qKey = String(question.id);
        const answered = Array.isArray(activePracticeMission.answeredQuestionIds) ? [...activePracticeMission.answeredQuestionIds] : [];
        if (!answered.includes(qKey)) {
          answered.push(qKey);
          const nextHits = (Number(activePracticeMission.hits) || 0) + (question.hit ? 1 : 0);
          const nextErrors = (Number(activePracticeMission.errors) || 0) + (question.hit ? 0 : 1);
          const targetCount = Math.max(1, Number(activePracticeMission.targetCount) || 1);
          const isDone = answered.length >= targetCount;
          activePracticeMission = {
            ...activePracticeMission,
            ownerUserId: resolvedOwnerId,
            answeredQuestionIds: answered,
            hits: nextHits,
            errors: nextErrors,
            status: isDone ? "completed" : "active",
            completedAt: isDone ? Date.now() : null,
            finalizedInQg: false,
            updatedAt: Date.now()
          };
          try {
            chrome.storage.local.set({ [ACTIVE_MISSION_KEY]: activePracticeMission });
          } catch (_) {
          }
          updateHudMission();
        }
      }
      const fullQuestionForDb = existingIdx >= 0 ? questionsCache[existingIdx] : questionsCache[0];
      if (fullQuestionForDb && fullQuestionForDb.id) {
        try {
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: "DB_UPSERT_QUESTION",
              payload: {
                question: fullQuestionForDb,
                enqueueOutbox: true
              }
            }).catch(() => {
            });
          }
        } catch (_) {
        }
      }
      questionsCache = compactQuestionsForStorage(questionsCache);
      try {
        chrome.storage.local.set({
          [STORAGE_KEY]: questionsCache,
          [SESSION_KEY]: updatedSession
        }, () => {
          if (chrome.runtime.lastError) return;
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: "UPDATE_BADGE_ONLY",
              payload: { session: updatedSession }
            }).catch(() => {
            });
          }
        });
      } catch (_) {
      }
    }
    function dismissPrompt() {
      if (promptDismissTimer) {
        clearTimeout(promptDismissTimer);
        promptDismissTimer = null;
      }
      const promptBox = getHudEl("qg-prompt-box");
      if (promptBox) {
        promptBox.style.display = "none";
      }
    }
    function showPrompt(question) {
      dismissPrompt();
      const promptBox = getHudEl("qg-prompt-box");
      const badge = getHudEl("qg-prompt-status-badge");
      const errorSection = getHudEl("qg-error-reasons");
      if (!promptBox || !badge || !errorSection) return;
      badge.className = `qg-prompt-badge ${question.hit ? "hit" : "error"}`;
      badge.textContent = question.hit ? "✓ ACERTOU" : "✗ ERROU";
      if (question.hit) {
        errorSection.style.display = "none";
      } else {
        errorSection.style.display = "block";
      }
      promptBox.querySelectorAll(".qg-btn-tag").forEach((b) => b.classList.remove("active"));
      promptBox.style.display = "block";
      promptDismissTimer = setTimeout(() => {
        dismissPrompt();
      }, 1e4);
    }
    function cleanExtractedLessonTitle(raw = "") {
      return String(raw || "").replace(/\b(?:play_circle(?:_outline|_filled)?|check_circle|ondemand_video|smart_display|lock|schedule)\b/gi, " ").replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/g, "").replace(/\s+/g, " ").trim();
    }
    function extractCourseLessonTitle() {
      const headerTitle = extractPlayingVideoTitleFromHeader();
      if (headerTitle) return cleanExtractedLessonTitle(headerTitle);
      const ignored = /* @__PURE__ */ new Set([
        "indice",
        "charlie",
        "bizus",
        "arquivos",
        "comentarios",
        "comentario",
        "voltar",
        "cursos",
        "aulas",
        "modulos",
        "projeto caveira",
        "digite para pesquisar"
      ]);
      const candidates = Array.from(
        document.querySelectorAll('h1, h2, h3, [aria-current="page"], [aria-current="true"], [class*="active"], [class*="selected"], [class*="lesson"] [class*="title"], [class*="video"] [class*="title"]')
      ).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const txt = cleanExtractedLessonTitle(el.innerText || el.textContent || "");
        if (txt.length < 4 || txt.length > 140) return false;
        if (/^[[(]?\d{1,2}:\d{2}/.test(txt)) return false;
        const norm = normalizeCourseIndexKey(txt);
        if (!norm || ignored.has(norm)) return false;
        if (/^\d+\s+[a-z]/.test(norm) && !norm.includes("parte") && !norm.includes("aula")) return false;
        return true;
      });
      candidates.sort((a, b) => {
        const aTxt = normalizeCourseIndexKey(a.innerText || a.textContent);
        const bTxt = normalizeCourseIndexKey(b.innerText || b.textContent);
        const aPart = /\bparte\s*\d+\b|\baula\s*\d+\b/.test(aTxt) ? 0 : 1;
        const bPart = /\bparte\s*\d+\b|\baula\s*\d+\b/.test(bTxt) ? 0 : 1;
        if (aPart !== bPart) return aPart - bPart;
        const aHeading = a.matches("h1, h2, h3") ? 0 : 1;
        const bHeading = b.matches("h1, h2, h3") ? 0 : 1;
        return aHeading - bHeading;
      });
      if (candidates[0]) {
        return cleanExtractedLessonTitle(candidates[0].innerText || candidates[0].textContent || "");
      }
      const docTitle = String(document.title || "").replace(/\s*[|\-–]\s*projeto\s*caveira.*$/i, "").replace(/\s*[|\-–]\s*caveira.*$/i, "").trim();
      return docTitle.length >= 4 && !ignored.has(normalizeCourseIndexKey(docTitle)) ? docTitle : "";
    }
    function isCourseTabActive(el) {
      if (!el) return false;
      const cls = String(el.className || "");
      return Boolean(
        el.getAttribute("aria-selected") === "true" || el.getAttribute("data-state") === "active" || el.classList.contains("q-tab--active") || /\bactive\b/i.test(cls)
      );
    }
    function findCourseTabElement(tabNameNorm) {
      return Array.from(document.querySelectorAll('button, [role="tab"], .q-tab, a, div, span')).find((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 32 || r.width > 200 || r.height < 20 || r.height > 58) return false;
        const txt = normalizeFilterText(el.innerText || el.textContent);
        return txt === tabNameNorm;
      }) || null;
    }
    function extractCourseIndexRawTextFromDom() {
      const indexTab = findCourseTabElement("indice");
      if (indexTab && !isCourseTabActive(indexTab)) return "";
      const tsRegex = /(?:^|\n)\s*[[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?(?:\s*[-–—:|]?\s*[^\n]+)?/gm;
      const containers = [];
      for (const el of document.querySelectorAll('.q-tab-panel, [role="tabpanel"], div, ul, ol, section, aside, main')) {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) continue;
        const txt = el.innerText || el.textContent || "";
        if (/\bplay_circle\b/i.test(txt)) continue;
        const matches = txt.match(tsRegex);
        if (matches && matches.length >= 2) {
          containers.push({ el, count: matches.length, len: txt.length, txt });
        }
      }
      if (containers.length === 0) return "";
      containers.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.len - b.len;
      });
      const best = containers[0];
      const rawLines = best.txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const tsLines = [];
      const bareTsRx = /^[[(]?(\d{1,2}:\d{2}(?::\d{2})?)[\])]?$/;
      const leadTsRx = /^[[(]?(\d{1,2}:\d{2}(?::\d{2})?)[\])]?\s*[-–—:|]*\s*(\S.*)$/;
      for (let i = 0; i < rawLines.length; i++) {
        const cur = rawLines[i];
        const bareM = cur.match(bareTsRx);
        if (bareM && i + 1 < rawLines.length) {
          tsLines.push(`[${bareM[1]}] ${rawLines[i + 1]}`);
          i += 1;
        } else {
          const leadM = cur.match(leadTsRx);
          if (leadM) {
            tsLines.push(`[${leadM[1]}] ${leadM[2]}`);
          }
        }
      }
      return tsLines.length >= 2 ? tsLines.join("\n") : "";
    }
    function extractCourseBizusRawTextFromDom() {
      const bizusTab = findCourseTabElement("bizus");
      if (!bizusTab || !isCourseTabActive(bizusTab)) return "";
      const tabRect = bizusTab.getBoundingClientRect();
      let panelEl = null;
      const ariaControls = bizusTab.getAttribute("aria-controls");
      if (ariaControls) {
        const target = document.getElementById(ariaControls);
        if (target && isElementVisible(target)) panelEl = target;
      }
      if (!panelEl) {
        const panels = Array.from(document.querySelectorAll('.q-tab-panel, [role="tabpanel"], section, div')).filter((el) => {
          if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
          if (el.contains(bizusTab)) return false;
          const r = el.getBoundingClientRect();
          if (r.top < tabRect.bottom - 6) return false;
          if (r.width < 220 || r.height < 60) return false;
          const txt = (el.innerText || el.textContent || "").trim();
          return txt.length >= 15 && txt.length <= 8e3;
        }).sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return Math.abs(ra.top - tabRect.bottom) - Math.abs(rb.top - tabRect.bottom) || ra.width * ra.height - rb.width * rb.height;
        });
        panelEl = panels[0] || null;
      }
      if (!panelEl) return "";
      const titles = [];
      const seen = /* @__PURE__ */ new Set();
      const cleanBizusTitleCandidate = (rawStr) => {
        let s = String(rawStr || "").replace(/\s+/g, " ").trim();
        if (!s) return "";
        s = s.replace(/^(?:[-•*●▪◦]|\d{1,2}\s*[.)\-–—]|[IVXLCDM]{1,5}\s*[.)\-–—])\s+/i, "").trim();
        if (!s) return "";
        let didTruncateColon = false;
        const colonIdx = s.indexOf(":");
        if (colonIdx > 2 && colonIdx < s.length - 1) {
          const beforeColon = s.slice(0, colonIdx).trim();
          const afterColon = s.slice(colonIdx + 1).trim();
          const afterWords = afterColon.split(/\s+/).filter(Boolean).length;
          const beforeNorm = normalizeFilterText(beforeColon);
          if (beforeNorm.length >= 4 && !/^(?:obs(?:ervacao)?|atencao|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|sumula|importante)$/.test(beforeNorm) && (afterColon.length > 25 || afterWords > 4)) {
            s = beforeColon;
            didTruncateColon = true;
          }
        }
        if (!didTruncateColon) {
          const dashMatch = s.match(/^(.+?)\s+[-–—]\s+(.+)$/);
          if (dashMatch) {
            const beforeDash = dashMatch[1].trim();
            const afterDash = dashMatch[2].trim();
            const beforeNorm = normalizeCourseIndexKey(beforeDash);
            const afterWords = afterDash.split(/\s+/).filter(Boolean).length;
            if (beforeNorm.length >= 4 && !PURE_ARTICLE_LINE_REGEX.test(beforeDash) && !LEADING_INDEX_FILLER_REGEX.test(beforeDash) && !isOnlyGenericWords(beforeDash) && !/^(?:obs(?:ervacao)?|atencao|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|sumula|importante)$/.test(beforeNorm) && (afterDash.length > 35 || afterWords > 6)) {
              s = beforeDash;
            }
          }
        }
        s = s.replace(/\s*\([^()]{28,}\)\s*$/g, "").trim();
        s = s.replace(/[:;.\-–—]+$/g, "").trim();
        return s;
      };
      const pushBizusTitle = (rawCandidate) => {
        const rawTrimmed = String(rawCandidate || "").replace(/\s+/g, " ").trim();
        if (!rawTrimmed) return false;
        const title = cleanBizusTitleCandidate(rawTrimmed);
        if (!title || title.length < 3 || title.length > 85) return false;
        if (/\.\s*$/.test(rawTrimmed) && title.split(/\s+/).length > 8 && rawTrimmed.length > 85) return false;
        if (PROSE_NOTE_PREFIX_REGEX.test(title) || PROSE_NOTE_PREFIX_REGEX.test(rawTrimmed)) return false;
        const key = normalizeCourseIndexKey(title);
        if (!key || key.length < 3 || key === "bizus" || key === "indice" || key === "charlie" || key === "arquivos" || key === "comentarios" || GENERIC_INDEX_LINES.has(key)) {
          return false;
        }
        if (!seen.has(key)) {
          seen.add(key);
          titles.push(title);
          return true;
        }
        return false;
      };
      const structuralNodes = Array.from(panelEl.querySelectorAll("h1, h2, h3, h4, h5, h6, li, p, div, span")).filter((el) => el && isElementVisible(el));
      for (const el of structuralNodes) {
        const tag = (el.tagName || "").toUpperCase();
        if (/^H[1-6]$/.test(tag)) {
          pushBizusTitle(el.innerText || el.textContent || "");
          continue;
        }
        if (tag === "LI" && el.parentElement && (el.parentElement.tagName || "").toUpperCase() === "OL") {
          const liText = (el.innerText || el.textContent || "").trim();
          const leadNode = Array.from(el.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b")).find((child) => !child.closest("ul") && child.closest("ol, ul") === el.parentElement && isElementVisible(child));
          if (leadNode) {
            const leadText = (leadNode.innerText || leadNode.textContent || "").replace(/\s+/g, " ").trim();
            const liNorm = normalizeFilterText(liText).replace(/^\d{1,2}\s*[.)\-–—]\s*/, "").trim();
            const leadNorm = normalizeFilterText(leadText);
            if (leadText && leadText.length <= 85 && leadNorm && liNorm.startsWith(leadNorm)) {
              pushBizusTitle(leadText);
              continue;
            }
          }
          const firstLine = (liText.split(/\r?\n/)[0] || "").trim();
          if (firstLine && firstLine.length <= 85 && !(/\.\s*$/.test(firstLine) && firstLine.split(/\s+/).length > 8)) {
            pushBizusTitle(firstLine);
          }
          continue;
        }
        if (tag === "P" || tag === "DIV" || tag === "LI" || tag === "SPAN") {
          if (tag === "DIV" && el.querySelector("p, div, ol, ul, h1, h2, h3, h4, h5, h6")) {
            continue;
          }
          if (el.closest("ul")) {
            continue;
          }
          if (tag !== "LI" && el.closest("ol")) {
            continue;
          }
          const blockText = (el.innerText || el.textContent || "").trim();
          const firstLine = (blockText.split(/\r?\n/)[0] || "").trim();
          const numMatch = firstLine.match(/^\s*(\d{1,2}\s*[.)\-–—]\s+)(.+)$/);
          if (numMatch) {
            const afterNumber = numMatch[2].trim();
            const boldNode = Array.from(el.querySelectorAll("strong, b")).find((child) => !child.closest("ul") && isElementVisible(child));
            if (boldNode) {
              const boldText = (boldNode.innerText || boldNode.textContent || "").replace(/\s+/g, " ").trim();
              const afterNorm = normalizeFilterText(afterNumber);
              const boldNorm = normalizeFilterText(boldText);
              if (boldText && boldText.length <= 85 && boldNorm && afterNorm.startsWith(boldNorm)) {
                pushBizusTitle(boldText);
                continue;
              }
            }
            if (afterNumber.length <= 85 || afterNumber.includes(":")) {
              pushBizusTitle(firstLine);
            }
          }
        }
      }
      const rawPanelText = (panelEl.innerText || panelEl.textContent || "").trim();
      if (rawPanelText) {
        for (const line of rawPanelText.split(/\r?\n/)) {
          const trimmedLine = line.trim();
          if (!/^\s*\d{1,2}\s*[.)\-–—]\s+[A-Za-zÀ-ÿ]/.test(trimmedLine)) continue;
          const candidate = cleanBizusTitleCandidate(trimmedLine);
          const candidateKey = normalizeCourseIndexKey(candidate);
          if (!candidateKey) continue;
          const alreadyCoveredByShortTitle = titles.some((t) => {
            const tk = normalizeCourseIndexKey(t);
            return tk && (candidateKey === tk || candidateKey.startsWith(`${tk} `));
          });
          if (alreadyCoveredByShortTitle) continue;
          pushBizusTitle(trimmedLine);
        }
      }
      if (titles.length === 0) {
        const boldNodes = Array.from(panelEl.querySelectorAll("strong, b")).filter((el) => el && isElementVisible(el));
        for (const boldEl of boldNodes) {
          if (boldEl.closest("ul")) continue;
          const parentBlock = boldEl.closest("p, div, li") || boldEl.parentElement;
          if (!parentBlock) continue;
          const parentFirstLine = ((parentBlock.innerText || parentBlock.textContent || "").split(/\r?\n/)[0] || "").trim();
          const boldText = (boldEl.innerText || boldEl.textContent || "").replace(/\s+/g, " ").trim();
          if (!boldText || boldText.length > 80) continue;
          const cleanParentKey = normalizeCourseIndexKey(cleanBizusTitleCandidate(parentFirstLine));
          const cleanBoldKey = normalizeCourseIndexKey(cleanBizusTitleCandidate(boldText));
          if (cleanParentKey && cleanParentKey === cleanBoldKey) {
            pushBizusTitle(boldText);
          }
        }
      }
      if (titles.length === 0) return "";
      return titles.slice(0, 20).map((t, idx) => `${idx + 1}. ${t}`).join("\n");
    }
    let lastCapturedIndiceState = { lessonKey: "", digest: "", at: 0 };
    function scanCourseVideoIndex() {
      if (isDestroyed || !isCoursePage()) return;
      const lessonTitle = cleanExtractedLessonTitle(extractCourseLessonTitle());
      const courseIdMatch = window.location.pathname.match(/\/courses\/(\d+)/i);
      const courseId = courseIdMatch ? courseIdMatch[1] : "";
      const rawLessonKey = normalizeCourseIndexKey(lessonTitle);
      const lessonKey = courseId && rawLessonKey ? `${courseId}::${rawLessonKey}` : rawLessonKey;
      const peekKey = `${window.location.href.split("#")[0]}|${lessonTitle}`;
      const rawBizusText = extractCourseBizusRawTextFromDom();
      const rawIndiceText = extractCourseIndexRawTextFromDom();
      if (rawIndiceText && lessonKey) {
        const digest = `${rawIndiceText.length}:${rawIndiceText.slice(0, 120)}:${rawIndiceText.slice(-80)}`;
        if (lastCapturedIndiceState.lessonKey && lastCapturedIndiceState.lessonKey !== lessonKey && lastCapturedIndiceState.digest === digest && Date.now() - lastCapturedIndiceState.at < 12e4) {
          setTimeout(scanCourseVideoIndex, 650);
          return;
        }
        lastCapturedIndiceState = { lessonKey, digest, at: Date.now() };
      }
      let captureSource = rawBizusText ? "bizus" : rawIndiceText ? "indice" : "bizus";
      let rawIndexText = rawBizusText || rawIndiceText;
      if (!rawIndexText) {
        const bizusTab = findCourseTabElement("bizus");
        if (bizusTab && !isCourseTabActive(bizusTab) && !peekedCourseUrls.has(peekKey)) {
          peekedCourseUrls.add(peekKey);
          clickElementRealistically(bizusTab);
          setTimeout(scanCourseVideoIndex, 450);
          setTimeout(scanCourseVideoIndex, 950);
          return;
        }
        const indexTab = findCourseTabElement("indice");
        const indicePeekKey = `${peekKey}|indice`;
        if (indexTab && !isCourseTabActive(indexTab) && !peekedCourseUrls.has(indicePeekKey)) {
          peekedCourseUrls.add(indicePeekKey);
          clickElementRealistically(indexTab);
          setTimeout(scanCourseVideoIndex, 550);
        }
        return;
      }
      const parsedTopics = rawIndiceText ? parseTimestampTopicsFromText(rawIndiceText) : [];
      const existingCachedForLesson = lessonKey ? cachedLocalCourseIndexByLesson?.[lessonKey] : null;
      const hasTopicsAlready = parsedTopics.length > 0 || Array.isArray(existingCachedForLesson?.topics) && existingCachedForLesson.topics.length > 0;
      if (rawBizusText && !rawIndiceText && !hasTopicsAlready) {
        const indexTab = findCourseTabElement("indice");
        const indicePeekKey = `${peekKey}|indice_ts`;
        if (indexTab && !isCourseTabActive(indexTab) && !peekedCourseUrls.has(indicePeekKey)) {
          peekedCourseUrls.add(indicePeekKey);
          clickElementRealistically(indexTab);
          setTimeout(scanCourseVideoIndex, 550);
        }
      }
      const subtopics = parseCourseIndexSubtopics(rawIndexText, lessonTitle ? [lessonTitle] : []);
      if (subtopics.length === 0) return;
      currentCourseIndexStatus = {
        count: subtopics.length,
        lessonTitle,
        source: captureSource,
        subtopics,
        rawIndexText,
        preview: `${lessonTitle ? lessonTitle + ": " : ""}${subtopics.slice(0, 6).join(" • ")}`
      };
      const currentQEl = getHudEl("qg-current-q-id");
      if (currentQEl) {
        const label = captureSource === "bizus" ? "Bizus capturado" : "Índice capturado";
        currentQEl.textContent = `📑 ${label} (${subtopics.length} subassuntos)`;
        currentQEl.title = currentCourseIndexStatus.preview;
      }
      const courseActionsEl = getHudEl("qg-hud-course-actions");
      if (courseActionsEl) {
        courseActionsEl.style.display = "flex";
      }
      const signature = `${captureSource}|${window.location.href.split("#")[0]}|${lessonTitle}|${rawIndexText}|${parsedTopics.length}`;
      if (signature === lastCapturedCourseSignature || !isExtensionContextValid()) return;
      lastCapturedCourseSignature = signature;
      let videoId = "";
      try {
        videoId = new URL(window.location.href).searchParams.get("course_video_id") || "";
      } catch (_) {
      }
      const sameCourseApi = !courseId || !apiCourseCatalogCache?.courseId || String(apiCourseCatalogCache.courseId) === String(courseId);
      const courseName = sameCourseApi ? apiCourseCatalogCache?.courseName || "" : "";
      const cleanEntryUrl = (() => {
        try {
          const u = new URL(window.location.href);
          u.hash = "";
          u.searchParams.delete("t");
          return u.toString();
        } catch (_) {
          return String(window.location.href).split("#")[0];
        }
      })();
      const inferredSubject = lastOpenedCourseContext?.courseId === courseId && lastOpenedCourseContext?.subject || inferSubjectFromLessons([lessonTitle, courseName]) || "";
      const entry = {
        url: cleanEntryUrl,
        courseId,
        courseName,
        subject: inferredSubject,
        videoId,
        lessonTitle,
        source: captureSource,
        rawIndexText,
        ...rawIndiceText ? { indiceRawText: rawIndiceText } : {},
        ...parsedTopics.length > 0 ? { topics: parsedTopics } : {},
        ...captureSource === "bizus" ? { bizusRawText: rawIndexText, bizusSubtopics: subtopics } : {},
        subtopics,
        capturedAt: Date.now()
      };
      try {
        chrome.storage.local.get([COURSE_INDEX_CACHE_KEY], (res) => {
          if (chrome.runtime.lastError || isDestroyed) return;
          const prev = res?.[COURSE_INDEX_CACHE_KEY] && typeof res[COURSE_INDEX_CACHE_KEY] === "object" ? res[COURSE_INDEX_CACHE_KEY] : { latest: null, byLesson: {} };
          const nextByLesson = { ...prev.byLesson || {} };
          const rawLessonKey2 = normalizeCourseIndexKey(lessonTitle);
          const lessonKey2 = courseId && rawLessonKey2 ? `${courseId}::${rawLessonKey2}` : rawLessonKey2;
          if (lessonKey2) {
            const existing = nextByLesson[lessonKey2];
            const mergedTopics = parsedTopics.length > 0 ? parsedTopics : existing?.topics || [];
            const mergedIndiceRaw = rawIndiceText || existing?.indiceRawText || "";
            if (captureSource === "bizus") {
              nextByLesson[lessonKey2] = {
                ...existing || {},
                ...entry,
                ...mergedIndiceRaw ? { indiceRawText: mergedIndiceRaw } : {},
                ...mergedTopics.length > 0 ? { topics: mergedTopics } : {}
              };
            } else if (existing && existing.source === "bizus") {
              nextByLesson[lessonKey2] = {
                ...existing,
                ...mergedIndiceRaw ? { indiceRawText: mergedIndiceRaw } : {},
                ...mergedTopics.length > 0 ? { topics: mergedTopics } : {}
              };
            } else {
              nextByLesson[lessonKey2] = {
                ...existing || {},
                ...entry,
                ...mergedIndiceRaw ? { indiceRawText: mergedIndiceRaw } : {},
                ...mergedTopics.length > 0 ? { topics: mergedTopics } : {}
              };
            }
          }
          const ordered = Object.entries(nextByLesson).sort((a, b) => (b[1]?.capturedAt || 0) - (a[1]?.capturedAt || 0)).slice(0, 120);
          const compactedByLesson = Object.fromEntries(ordered);
          cachedLocalCourseIndexByLesson = compactedByLesson;
          const latestEntry = prev.latest && prev.latest.source === "bizus" && captureSource === "indice" && rawLessonKey2 && normalizeCourseIndexKey(prev.latest.lessonTitle || "") === rawLessonKey2 ? prev.latest : lessonKey2 && compactedByLesson[lessonKey2] || entry;
          chrome.storage.local.set({
            [COURSE_INDEX_CACHE_KEY]: {
              latest: latestEntry,
              byLesson: compactedByLesson
            }
          });
        });
      } catch (_) {
      }
    }
    function extractTeacherCommentFromCard(card) {
      if (!card) return "";
      const commentNodes = card.querySelectorAll(
        '.teacher-comment, .comment-teacher, .professor-comment, .comentario-professor, [class*="teacher-comment"], [class*="comentario"], [class*="gabarito-comentado"], .q-tab-panel'
      );
      for (const node of commentNodes) {
        const txt = (node.innerText || node.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
        if (!txt || txt.length <= 45) continue;
        const upper = txt.toUpperCase();
        if (upper.startsWith("SELECIONE") || txt.includes("Estatísticas da questão") || txt.includes("Acertos e erros") || txt.includes("Digite seu comentário") || txt.includes("Nenhum comentário ainda")) {
          continue;
        }
        return txt.slice(0, 2500);
      }
      return "";
    }
    function extractCommunityStatsFromNode(rootNode) {
      if (!rootNode) return null;
      const text = (rootNode.innerText || rootNode.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return null;
      let correctPct = null;
      let errorPct = null;
      const corrMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:acert|corret)|(?:acertos?|acertaram)[^%\d]{0,20}(\d{1,3}(?:[.,]\d+)?)\s*%/i);
      if (corrMatch) {
        correctPct = Math.round(parseFloat((corrMatch[1] || corrMatch[2]).replace(",", ".")));
      }
      const errMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:err|incorret)|(?:erros?|erraram)[^%\d]{0,20}(\d{1,3}(?:[.,]\d+)?)\s*%/i);
      if (errMatch) {
        errorPct = Math.round(parseFloat((errMatch[1] || errMatch[2]).replace(",", ".")));
      }
      if (correctPct !== null && (correctPct < 0 || correctPct > 100)) correctPct = null;
      if (errorPct !== null && (errorPct < 0 || errorPct > 100)) errorPct = null;
      if (correctPct === null && errorPct !== null) correctPct = Math.max(0, Math.min(100, 100 - errorPct));
      if (errorPct === null && correctPct !== null) errorPct = Math.max(0, Math.min(100, 100 - correctPct));
      if (correctPct === null) return null;
      return { communityCorrectPct: correctPct, communityErrorPct: errorPct };
    }
    function extractPrivateNoteFromCard(card) {
      if (!card) return "";
      const panels = Array.from(card.querySelectorAll('.q-tab-panel, [role="tabpanel"]'));
      for (const p of panels) {
        if (!isElementVisible(p)) continue;
        const ta = p.querySelector("textarea");
        if (ta && ta.value && ta.value.trim().length > 2) {
          return ta.value.trim().slice(0, 1e3);
        }
        const ce = p.querySelector('[contenteditable="true"]');
        if (ce && ce.innerText && ce.innerText.trim().length > 2) {
          return ce.innerText.trim().slice(0, 1e3);
        }
        const savedNote = p.querySelector(".note-content, .anotacao, p, .q-item__label");
        if (savedNote && savedNote.innerText) {
          const t = savedNote.innerText.trim();
          if (t.length > 3 && !/nenhuma anota|digite sua anota|adicionar anota/i.test(t)) {
            return t.slice(0, 1e3);
          }
        }
      }
      return "";
    }
    function extractCharlieOrStudentCommentFromCard(card) {
      if (!card) return "";
      const panels = Array.from(card.querySelectorAll('.q-tab-panel, [role="tabpanel"], .comments-list, .q-list'));
      for (const node of panels) {
        if (!isElementVisible(node)) continue;
        const txt = (node.innerText || node.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
        if (!txt || txt.length <= 50) continue;
        if (/^(?:carregando|gerando|nenhum coment|pergunte ao charlie|digite seu coment)/i.test(txt) || txt.includes("Estatísticas da questão")) {
          continue;
        }
        return txt.slice(0, 2500);
      }
      return "";
    }
    function triggerSilentTeacherCommentCapture(card, qId) {
      if (!card || !qId || autoCommentAttemptedQIds.has(qId)) return;
      if (!isCardAnswered(card) || !savedQuestionIds.has(qId)) return;
      autoCommentAttemptedQIds.add(qId);
      const tabs = Array.from(card.querySelectorAll('.q-tab, [role="tab"], button, .q-btn')).filter((el) => {
        if (!el || el.closest("#qg-caveira-shadow-host, #qg-caveira-hud") || !isElementVisible(el)) return false;
        const r = el.getBoundingClientRect();
        return r.width >= 30 && r.height >= 18 && r.height <= 56;
      });
      const findTab = (matcher) => tabs.find((t) => matcher(normalizeFilterText(t.innerText || t.textContent)));
      const teacherTab = findTab(
        (tText) => tText === "comentario do professor" || tText === "comentarios do professor" || tText === "gabarito comentado" || tText === "professor" || tText.includes("comentario") && tText.includes("professor") || tText === "comentario"
      );
      const charlieTab = findTab((tText) => tText.includes("charlie"));
      const studentTab = findTab((tText) => tText === "comentarios" || tText === "comentarios alunos" || tText.includes("coment") && !tText.includes("professor"));
      const notesTab = findTab((tText) => tText.includes("anotac"));
      const statsTab = findTab((tText) => tText.includes("estatist"));
      const activeTabBefore = tabs.find(
        (t) => t.getAttribute("aria-selected") === "true" || t.classList.contains("q-tab--active") || /\bactive\b/i.test(t.className || "")
      ) || null;
      const patch = {};
      const numericFromQId = Number(String(qId || "").replace(/^Q/i, "").replace(/\D+/g, ""));
      const apiData = apiQuestionByCode.get(qId) || (Number.isFinite(numericFromQId) && numericFromQId > 0 ? apiQuestionByApiId.get(numericFromQId) : null) || apiQuestionCache.get(qId);
      if (apiData) {
        if (apiData.teacherComment) {
          patch.teacherComment = apiData.teacherComment;
          patch.commentSource = apiData.commentSource || "professor";
        }
        if (apiData.communityCorrectPct !== void 0) {
          patch.communityCorrectPct = apiData.communityCorrectPct;
          patch.communityErrorPct = apiData.communityErrorPct;
        }
        if (apiData.userNote) {
          patch.userNote = apiData.userNote;
        }
      }
      const inlineStats = extractCommunityStatsFromNode(card.querySelector(".stats-box") || card);
      if (inlineStats && patch.communityCorrectPct === void 0) Object.assign(patch, inlineStats);
      const immediateProf = extractTeacherCommentFromCard(card);
      if (immediateProf && !patch.teacherComment) {
        patch.teacherComment = immediateProf;
        patch.commentSource = "professor";
      }
      const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
      let didClickTab = false;
      const saveScrollAndClick = async (tabEl, delay = 260) => {
        if (!tabEl || !card.isConnected || isDestroyed) return false;
        const yBefore = window.scrollY;
        didClickTab = true;
        tabEl.click();
        if (Math.abs(window.scrollY - yBefore) > 4) window.scrollTo({ top: yBefore, behavior: "instant" });
        await waitMs(delay);
        return !isDestroyed && card.isConnected;
      };
      (async () => {
        try {
          const existing = questionsCache.find((item) => item && item.id === qId) || {};
          if (!patch.teacherComment && !existing.teacherComment && teacherTab && teacherTab !== activeTabBefore) {
            if (await saveScrollAndClick(teacherTab, 320)) {
              const profTxt = extractTeacherCommentFromCard(card);
              if (profTxt) {
                patch.teacherComment = profTxt;
                patch.commentSource = "professor";
              }
            }
          }
          if (!patch.teacherComment && !existing.teacherComment && charlieTab) {
            if (await saveScrollAndClick(charlieTab, 300)) {
              const cTxt = extractCharlieOrStudentCommentFromCard(card);
              if (cTxt) {
                patch.teacherComment = cTxt;
                patch.commentSource = "charlie";
              }
            }
          }
          if (!patch.teacherComment && !existing.teacherComment && studentTab) {
            if (await saveScrollAndClick(studentTab, 280)) {
              const sTxt = extractCharlieOrStudentCommentFromCard(card);
              if (sTxt) {
                patch.teacherComment = sTxt;
                patch.commentSource = "aluno";
              }
            }
          }
          if (notesTab && !patch.userNote && !existing.userNote) {
            if (await saveScrollAndClick(notesTab, 220)) {
              const noteTxt = extractPrivateNoteFromCard(card);
              if (noteTxt) patch.userNote = noteTxt;
            }
          }
          if (patch.communityCorrectPct === void 0 && existing.communityCorrectPct === void 0 && statsTab) {
            if (await saveScrollAndClick(statsTab, 220)) {
              const st = extractCommunityStatsFromNode(card.querySelector(".q-tab-panel") || card);
              if (st) Object.assign(patch, st);
            }
          }
          if (didClickTab && activeTabBefore && activeTabBefore.isConnected) {
            const yBefore = window.scrollY;
            activeTabBefore.click();
            if (Math.abs(window.scrollY - yBefore) > 4) window.scrollTo({ top: yBefore, behavior: "instant" });
          }
          if (Object.keys(patch).length > 0 && card.isConnected && !isDestroyed) {
            const latest = questionsCache.find((item) => item && item.id === qId);
            if (latest) {
              saveQuestion({ ...latest, ...patch }, true);
            }
          }
        } catch (_) {
        }
      })();
    }
    function scanCards() {
      if (isDestroyed) return;
      if (!isExtensionContextValid()) {
        teardownInstance();
        return;
      }
      createHud();
      if (!isStorageLoaded) return;
      updateContextualHud();
      if (isCoursePage()) {
        const curCourseHref = window.location.href.split("#")[0];
        if (curCourseHref !== lastSeekUrlApplied && isCoursePlaygroundPage()) {
          currentCourseIndexStatus = null;
          const doneBanner = getHudEl("qg-hud-course-completed-banner");
          if (doneBanner) doneBanner.style.display = "none";
        }
        if (isCoursePlaygroundPage()) {
          const courseActionsEl = getHudEl("qg-hud-course-actions");
          if (courseActionsEl) courseActionsEl.style.display = "flex";
        }
        scanCourseVideoIndex();
        applySubjectVideoSpeedInPlayground();
        observeLessonCompletionOnPlayground();
      } else {
        currentCourseIndexStatus = null;
        const courseActionsEl = getHudEl("qg-hud-course-actions");
        if (courseActionsEl) courseActionsEl.style.display = "none";
      }
      const cards = getQuestionCards();
      if (!cards || cards.length === 0) {
        clearActiveQuestionState();
        return;
      }
      applyTrapRadarToCards(cards, questionsCache, extractQuestionId);
      cards.forEach((card) => {
        const qId = extractQuestionId(card);
        if (!qId) return;
        if (cachedPendingMirrorProof && String(cachedPendingMirrorProof.mirrorQId) === String(qId)) {
          mountMirrorChallengeBanner(card, cachedPendingMirrorProof);
        }
        if (savedQuestionsMissingAlts.has(qId)) {
          const enriched = extractQuestionData(card, qId);
          if (enriched && Array.isArray(enriched.alternatives) && enriched.alternatives.length > 0) {
            savedQuestionsMissingAlts.delete(qId);
            const existing = questionsCache.find((item) => item && item.id === qId) || {};
            saveQuestion({
              ...existing,
              id: qId,
              alternatives: enriched.alternatives,
              subject: existing.subject && existing.subject !== "Geral" ? existing.subject : enriched.subject,
              topic: existing.topic && existing.topic !== "Geral" ? existing.topic : enriched.topic,
              canonicalSubject: enriched.canonicalSubject || existing.canonicalSubject,
              bloco: enriched.bloco || existing.bloco,
              content: enriched.content || existing.content
            }, true);
          }
        }
        if (savedQuestionIds.has(qId)) {
          const existing = questionsCache.find((item) => item && item.id === qId);
          if (existing && (!existing.teacherComment || existing.communityCorrectPct === void 0)) {
            const commentTxt = !existing.teacherComment ? extractTeacherCommentFromCard(card) : "";
            if (commentTxt) {
              saveQuestion({ ...existing, teacherComment: commentTxt, commentSource: "professor" }, true);
            } else if (isCardAnswered(card) && !autoCommentAttemptedQIds.has(qId)) {
              setTimeout(() => triggerSilentTeacherCommentCapture(card, qId), 350);
            }
          }
        }
        const answered = isCardAnswered(card);
        if (!answered) {
          unansweredObservedQIds.add(qId);
          preAnsweredIgnoredQIds.delete(qId);
          processedInSession.delete(qId);
        } else {
          const apiMeta = apiQuestionByCode.get(qId) || apiQuestionCache.get(qId);
          const numericApiId = Number(apiMeta?.apiId) || Number(String(qId || "").replace(/^Q/i, ""));
          const recentApiAns = Number.isFinite(numericApiId) && numericApiId > 0 ? apiAnswerCache.get(numericApiId) : null;
          const hasRecentApiAns = Boolean(recentApiAns && Date.now() - (Number(recentApiAns.at) || 0) <= 3e4);
          const observedLiveAnswer = unansweredObservedQIds.has(qId) || pendingAnswerQIds.has(qId) || hasRecentApiAns;
          if (!observedLiveAnswer) {
            preAnsweredIgnoredQIds.add(qId);
          } else if (!processedInSession.has(qId)) {
            const questionData = extractQuestionData(card, qId);
            if (questionData) {
              processedInSession.add(qId);
              pendingAnswerQIds.delete(qId);
              unansweredObservedQIds.delete(qId);
              preAnsweredIgnoredQIds.delete(qId);
              pauseTimer();
              const currentQEl = getHudEl("qg-current-q-id");
              if (currentQEl) {
                currentQEl.textContent = `${qId} ✓`;
              }
              activeQuestionData = questionData;
              saveQuestion(questionData, false);
              renderQuestionHistory(qId, true);
              const videoMatch = !questionData.hit ? findCourseVideoMatchForExtension(questionData, getMergedCourseVideoIndex()) : null;
              const mountedInline = mountInlineAutopsyCard(
                card,
                {
                  ...questionData,
                  videoMatch,
                  mirrorState: !questionData.hit ? { status: "loading" } : null
                },
                {
                  onSelectErrorReason: (targetId, reasonId) => {
                    const latest = questionsCache.find((q) => q && q.id === targetId) || questionData;
                    const updated = { ...latest, errorReason: reasonId };
                    if (activeQuestionData && activeQuestionData.id === targetId) {
                      activeQuestionData = updated;
                    }
                    saveQuestion(updated, true);
                  },
                  onSelectConfidence: (targetId, confId) => {
                    const latest = questionsCache.find((q) => q && q.id === targetId) || questionData;
                    const updated = {
                      ...latest,
                      confidence: confId,
                      fsrsRequested: confId === "chute" || confId === "duvida"
                    };
                    if (activeQuestionData && activeQuestionData.id === targetId) {
                      activeQuestionData = updated;
                    }
                    saveQuestion(updated, true);
                  },
                  onOpenVideoTimestamp: (vm) => {
                    if (!vm || !vm.url) return;
                    try {
                      if (vm.seconds > 0 && isExtensionContextValid() && chrome?.storage?.local) {
                        const nowTs = Date.now();
                        chrome.storage.local.set({
                          [PLAYER_SEEK_KEY]: {
                            seconds: vm.seconds,
                            courseId: vm.courseId || "",
                            lessonTitle: vm.lessonTitle || "",
                            topicLabel: vm.topicLabel || "",
                            awaitingTargetLesson: Boolean(vm.lessonTitle),
                            readyToSeek: !vm.lessonTitle,
                            updatedAt: nowTs,
                            savedAt: nowTs
                          }
                        });
                      }
                    } catch (_) {
                    }
                    window.open(vm.url, "_blank", "noopener");
                  },
                  onStartMirror: (cand, sourceQId) => {
                    if (!cand || !cand.id) return;
                    const proof = { sourceQId, mirrorQId: cand.id, at: Date.now() };
                    cachedPendingMirrorProof = proof;
                    try {
                      if (isExtensionContextValid() && chrome?.storage?.local) {
                        chrome.storage.local.set({ [PENDING_MIRROR_PROOF_KEY]: proof });
                      }
                    } catch (_) {
                    }
                    const inDomCard = getQuestionCards().find((c) => extractQuestionId(c) === cand.id);
                    if (inDomCard) {
                      mountMirrorChallengeBanner(inDomCard, proof);
                      inDomCard.scrollIntoView({ behavior: "smooth", block: "center" });
                      return;
                    }
                    const targetUrl = cand.apiId ? `https://app.caveira.com/questions?question_id=${cand.apiId}` : `https://app.caveira.com/questions?raw_text=${encodeURIComponent(cand.id)}`;
                    window.open(targetUrl, "_blank", "noopener");
                  }
                }
              );
              if (!questionData.hit && mountedInline && !requestedMirrorForQIds.has(qId)) {
                requestedMirrorForQIds.add(qId);
                requestMirrorQuestionFromApi(questionData).then((mirrorResult) => {
                  if (isDestroyed) return;
                  if (mirrorResult && mirrorResult.candidate) {
                    updateInlineAutopsyExtras(qId, {
                      mirrorState: {
                        status: "ready",
                        candidate: mirrorResult.candidate,
                        sharedTraps: mirrorResult.sharedTraps || [],
                        sameSubtopic: Boolean(mirrorResult.sameSubtopic)
                      }
                    });
                  } else {
                    updateInlineAutopsyExtras(qId, { mirrorState: { status: "empty" } });
                  }
                });
              }
              if (questionData.hit && cachedPendingMirrorProof && String(cachedPendingMirrorProof.mirrorQId) === String(qId)) {
                const sourceQId = cachedPendingMirrorProof.sourceQId;
                const sourceQ = questionsCache.find((q) => q && q.id === sourceQId);
                if (sourceQ) {
                  saveQuestion(
                    {
                      ...sourceQ,
                      mirrorProven: true,
                      mirrorQuestionId: qId,
                      mirrorProvenAt: (/* @__PURE__ */ new Date()).toISOString()
                    },
                    true
                  );
                }
                cachedPendingMirrorProof = null;
                try {
                  if (isExtensionContextValid() && chrome?.storage?.local) {
                    chrome.storage.local.remove([PENDING_MIRROR_PROOF_KEY]).catch(() => {
                    });
                  }
                } catch (_) {
                }
                showMirrorProvenToastOnCard(card, sourceQId);
                updateInlineAutopsyExtras(sourceQId, {
                  mirrorState: { status: "proven", mirrorQId: qId }
                });
              }
              if (!mountedInline) {
                showPrompt(questionData);
              }
              if (!questionData.teacherComment || questionData.communityCorrectPct === void 0 || !questionData.userNote) {
                setTimeout(() => triggerSilentTeacherCommentCapture(card, qId), 380);
              }
            }
          }
        }
      });
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
    function handleScrollUpdate() {
      if (isDestroyed) return;
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        if (isDestroyed) return;
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
    function setupTriggers() {
      handleScrollUpdateRef = handleScrollUpdate;
      handlePopstateHashRef = () => {
        scheduleScan(50);
        setTimeout(() => {
          updateContextualHud();
          autoOpenTargetLessonFromHash();
        }, 250);
      };
      setTimeout(autoOpenTargetLessonFromHash, 500);
      window.addEventListener("scroll", handleScrollUpdateRef, { capture: true, passive: true });
      window.addEventListener("wheel", handleScrollUpdateRef, { passive: true });
      window.addEventListener("popstate", handlePopstateHashRef);
      window.addEventListener("hashchange", handlePopstateHashRef);
      handleDocumentClickRef = (e) => {
        if (isDestroyed) return;
        if (isEventInsideHud(e)) return;
        const card = e.target.closest(".q-card");
        const rootCard = card && card.parentElement?.closest(".q-card") ? card.parentElement.closest(".q-card") : card;
        const clickedCardQId = rootCard ? extractQuestionId(rootCard) : null;
        if (rootCard && clickedCardQId) {
          switchActiveQuestion(clickedCardQId, isCardAnswered(rootCard));
        }
        const alt = e.target.closest(".alternative");
        if (alt) {
          const letter = alt.querySelector(".alternative-letter")?.textContent?.trim();
          if (letter && letter.length <= 2) {
            lastUserClickedChoice = letter;
          }
        }
        const btn = e.target.closest("button, .q-btn, a");
        if (btn) {
          const text = (btn.textContent || "").trim();
          const textUpper = text.toUpperCase();
          if (textUpper.includes("RESPONDER") || textUpper.includes("CONFIRMAR") || btn.classList.contains("light-mode-answer-btn") || (btn.getAttribute("aria-label") || "").toUpperCase().includes("RESPONDER")) {
            const targetQId = clickedCardQId || currentQuestionId;
            const targetCard = rootCard || getQuestionCards().find((c) => extractQuestionId(c) === targetQId);
            if (targetQId && targetCard && !isCardAnswered(targetCard)) {
              processedInSession.delete(targetQId);
              pendingAnswerQIds.add(targetQId);
            }
            [40, 100, 200, 400, 800, 1500, 2500, 4e3].forEach((delay) => setTimeout(scanCards, delay));
            setTimeout(() => {
              if (targetCard && targetQId) {
                triggerSilentTeacherCommentCapture(targetCard, targetQId);
              }
            }, 420);
          }
          if (textUpper.includes("PRÓXIMA") || textUpper.includes("AVANÇAR") || btn.querySelector(".material-icons")?.textContent?.includes("chevron_right") || btn.querySelector(".material-icons")?.textContent?.includes("navigate_next")) {
            setTimeout(scanCards, 80);
            setTimeout(scanCards, 300);
          }
        }
      };
      document.addEventListener("click", handleDocumentClickRef, true);
      handleDocumentKeydownRef = (e) => {
        if (isDestroyed) return;
        if (e.key === "Enter" && currentQuestionId) {
          const focusedCard = getQuestionCards().find((c) => extractQuestionId(c) === currentQuestionId);
          if (focusedCard && !isCardAnswered(focusedCard)) {
            processedInSession.delete(currentQuestionId);
            pendingAnswerQIds.add(currentQuestionId);
            setTimeout(scanCards, 80);
            setTimeout(scanCards, 350);
          }
        }
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "PageDown" || e.key === "PageUp") {
          setTimeout(handleScrollUpdate, 60);
          setTimeout(scanCards, 200);
        }
      };
      document.addEventListener("keydown", handleDocumentKeydownRef);
      domObserver = new MutationObserver((mutations) => {
        const isInternal = mutations.every((m) => isMutationInsideHud(m));
        if (isInternal) return;
        scheduleScan(40);
      });
      domObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "disabled"]
      });
      scanIntervalId = setInterval(scanCards, 1500);
      scanCards();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        createHud();
        setupTriggers();
      });
    } else {
      createHud();
      setupTriggers();
    }
  })();
})();
