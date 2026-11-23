import { PERSISTED_KEYS } from '../store/storeConfig';

export const BACKUPS_STORAGE_KEY = 'prf_qg_backups';
const MAX_LOCAL_BACKUPS = 8;

const REASON_LABELS = {
  manual: 'Backup manual',
  cloud_sync: 'Sincronização automática',
  pre_selective_reset: 'Antes de reset seletivo',
  pre_total_wipe: 'Antes de zerar sistema',
  pre_import_backup: 'Antes de importar backup',
  pre_delete_subject: 'Antes de excluir disciplina',
  pre_restore: 'Antes de restaurar ponto',
  auto: 'Snapshot automático',
};

export function hasMeaningfulBackupData(data) {
  if (!data || typeof data !== 'object') return false;
  const hasSubjects = data.subjects && Object.keys(data.subjects).length > 0;
  const hasReviews = Array.isArray(data.reviews) && data.reviews.length > 0;
  const hasCycle = Array.isArray(data.cycle) && data.cycle.some(d => Array.isArray(d) && d.length > 0);
  const hasHistory = data.studyHistory && Object.keys(data.studyHistory).length > 0;
  const hasXp = (data.userStats?.xp || 0) > 0 || (data.userStats?.totalStudyMinutes || 0) > 0;
  return Boolean(hasSubjects || hasReviews || hasCycle || hasHistory || hasXp);
}

export function extractPersistedData(state) {
  const payload = {};
  if (!state || typeof state !== 'object') return payload;
  PERSISTED_KEYS.forEach((key) => {
    if (state[key] !== undefined) payload[key] = state[key];
  });
  return payload;
}

export function computeBackupSummary(data) {
  const subjectsCount = data?.subjects && typeof data.subjects === 'object'
    ? Object.keys(data.subjects).length
    : 0;
  const reviewsCount = Array.isArray(data?.reviews) ? data.reviews.length : 0;
  const xp = Number(data?.userStats?.xp) || 0;
  let completedLessons = 0;
  Object.values(data?.subjects || {}).forEach((sub) => {
    (sub?.topics || []).forEach((t) => {
      completedLessons += Math.min(Number(t?.total) || 0, Number(t?.completed) || 0);
    });
  });
  return { subjectsCount, reviewsCount, xp, completedLessons };
}

export function formatBackupReasonLabel(reason, customLabel = '') {
  if (customLabel && String(customLabel).trim()) return String(customLabel).trim();
  return REASON_LABELS[reason] || 'Ponto de restauração';
}

export function readRawLocalBackups() {
  try {
    const raw = localStorage.getItem(BACKUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry, idx) => ({
      ...entry,
      id: entry?.id || `bk_${entry?.timestamp || Date.now()}_${idx}`,
      reason: entry?.reason || 'auto',
      label: formatBackupReasonLabel(entry?.reason, entry?.label),
      summary: entry?.summary || computeBackupSummary(entry?.data),
    }));
  } catch {
    return [];
  }
}

export function listLocalRestorePoints(userId = null) {
  const all = readRawLocalBackups();
  return all
    .filter((b) => b?.data && (!userId || !b.userId || b.userId === userId))
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
}

export function saveLocalRestorePoint(data, { reason = 'auto', label = '', userId = null, force = false } = {}) {
  if (!force && !hasMeaningfulBackupData(data)) return null;
  try {
    const existing = readRawLocalBackups();
    // Avoid flooding with consecutive identical cloud_sync backups within 5 minutes
    if (reason === 'cloud_sync' && existing.length > 0) {
      const latest = existing[0];
      if (
        latest?.reason === 'cloud_sync' &&
        latest?.userId === (userId || null) &&
        Date.now() - (Number(latest.timestamp) || 0) < 5 * 60 * 1000
      ) {
        return latest;
      }
    }

    const entry = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      reason,
      label: formatBackupReasonLabel(reason, label),
      userId: userId || null,
      summary: computeBackupSummary(data),
      data,
    };

    const next = [entry, ...existing].slice(0, MAX_LOCAL_BACKUPS);
    // Try saving; if quota exceeded, trim oldest entries gracefully
    for (let limit = next.length; limit >= 1; limit--) {
      try {
        localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(next.slice(0, limit)));
        return entry;
      } catch (quotaErr) {
        if (limit === 1) throw quotaErr;
      }
    }
    return entry;
  } catch (err) {
    console.warn('Falha ao salvar ponto de restauração local:', err?.name || err?.message);
    return null;
  }
}

export function removeLocalRestorePoint(pointId) {
  try {
    const existing = readRawLocalBackups();
    const filtered = existing.filter((b) => b.id !== pointId);
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return readRawLocalBackups();
  }
}
