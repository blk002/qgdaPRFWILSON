// Utilitários compartilhados do content script (v3.1.0)

export const QG_WEB_URL = 'https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=caveira';
export const STORAGE_KEY = 'qg_caveira_questions';
export const SESSION_KEY = 'qg_caveira_session';
export const SCHEMA_KEY = 'qg_caveira_schema_v3';
export const SCHEMA_VERSION = '3.1.0';
export const GOAL_KEY = 'qg_caveira_daily_goal';
export const ACTIVE_USER_KEY = 'qg_active_user_id';
export const ACTIVE_USER_LABEL_KEY = 'qg_active_user_label';
export const PENDING_FILTER_KEY = 'qg_pending_caveira_filter';
export const COURSE_INDEX_CACHE_KEY = 'qg_caveira_course_index_cache';
export const FILTER_CORRECTION_MEMORY_KEY = 'qg_caveira_filter_memory';
export const FILTER_ID_MEMORY_KEY = 'qg_caveira_filter_id_memory_v1';
export const FILTER_MEMORY_CLOUD_KEY = 'qg_filter_memory_cloud';
export const TODAY_MISSION_KEY = 'qg_today_mission';
export const SUBJECT_SPEEDS_KEY = 'qg_subject_speeds';
export const PLAYER_SPEED_KEY = 'qg_player_target_speed';
export const PLAYER_SEEK_KEY = 'qg_player_pending_seek';
export const PENDING_CATALOG_KEY = 'qg_pending_course_catalog';
export const PENDING_SIMULADOS_KEY = 'qg_pending_simulados_import';
export const PENDING_SIMULADOS_QUEUE_KEY = 'qg_pending_simulados_queue';
export const PENDING_PDF_KEY = 'qg_pending_pdf_study';
export const LAST_FILTER_DIAG_KEY = 'qg_caveira_last_filter_diag';
export const DEFAULT_PREFS_KEY = 'qg_caveira_default_prefs';
export const SUBJECT_TREE_CACHE_KEY = 'qg_caveira_subject_tree_cache';
export const DIAGNOSTIC_MODE_KEY = 'qg_diagnostic_mode';
export const DIAGNOSTIC_EVENTS_KEY = 'qg_diagnostic_events';
export const SNIFFER_RECENT_EVENTS_KEY = 'qg_sniffer_recent_events';
export const TREE_META_KEY = 'qg_tree_meta';
export const SIMULADO_QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SIMULADO_QUEUE_MAX_ATTEMPTS = 10;

export function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeFilterText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeCourseIndexKey(str) {
  return normalizeFilterText(str)
    .replace(/[-–—:|/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifySubjectBloco(subjectName = '') {
  const s = normalizeFilterText(subjectName);
  if (!s) return 'Bloco I';
  if (/transito|ctb|contran|resoluc(?:ao|oes)|habilitacao|sinalizacao/.test(s)) return 'Bloco II';
  if (/constitucional|administrativo|administracao publica|penal|processual|direitos humanos|legislacao especial|legislacao extravagante|legislacao institucional|leis especiais|extravagante/.test(s)) {
    return 'Bloco III';
  }
  return 'Bloco I';
}

export function getTodaySessionDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function normalizeSession(rawSession) {
  const today = getTodaySessionDate();
  if (!rawSession || rawSession.date !== today) {
    return { date: today, total: 0, hits: 0, errors: 0 };
  }
  return {
    date: today,
    total: Number(rawSession.total) || 0,
    hits: Number(rawSession.hits) || 0,
    errors: Number(rawSession.errors) || 0,
    ...(rawSession.wasExplicitlyReset ? { wasExplicitlyReset: true } : {}),
  };
}

export function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateChannelNonce() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
}

const SENSITIVE_KEY_RX = /(?:token|auth|cookie|password|passwd|secret|jwt|bearer|authorization|refresh_token|access_token|apikey|api_key)/i;
const JWT_STRING_RX = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]+)?/g;

export function sanitizeDiagnosticData(input, depth = 0) {
  if (depth > 6) return '[depth-limit]';
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') {
    const cleaned = input.replace(JWT_STRING_RX, '[REDACTED_JWT]');
    return cleaned.length > 240 ? `${cleaned.slice(0, 240)}...` : cleaned;
  }
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (Array.isArray(input)) {
    return input.slice(0, 15).map((item) => sanitizeDiagnosticData(item, depth + 1));
  }
  if (typeof input === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      if (SENSITIVE_KEY_RX.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = sanitizeDiagnosticData(v, depth + 1);
      }
    }
    return out;
  }
  return String(input).slice(0, 120);
}
