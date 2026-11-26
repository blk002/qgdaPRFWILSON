// Helpers tolerantes para captura e fila confiável de simulados (v3.1.0)
import {
  classifySubjectBloco,
  normalizeCourseIndexKey,
  SIMULADO_QUEUE_MAX_ATTEMPTS,
  SIMULADO_QUEUE_TTL_MS,
} from './utils.js';

export function isRankingTitleOrRow(rowText = '', titleText = '', allowLoose = false) {
  const tNorm = normalizeCourseIndexKey(titleText);
  if (!tNorm) return !allowLoose;
  if (/^#?\d{1,5}\s*[º°ªoa]?$/.test(tNorm) || /^caveira\s+\d{3,}$/.test(tNorm)) return true;
  if (/\b(?:classificacao|ranking|posicao|colocacao|podium)\b/.test(tNorm)) return true;
  const rNorm = normalizeCourseIndexKey(rowText);
  if (/\b(?:colocacao|classificacao geral)\b/.test(rNorm) && !/simulado/.test(tNorm)) return true;
  return false;
}

export function buildSimuladoKey(sim) {
  if (!sim || typeof sim !== 'object') return '';
  if (sim.caveiraId) return String(sim.caveiraId);
  const titlePart = normalizeCourseIndexKey(sim.title || '').slice(0, 48);
  return titlePart ? `sim_title_${titlePart}` : `sim_${sim.data || 'sem_data'}`;
}

export function pruneAndNormalizeQueue(rawQueue, now = Date.now()) {
  const rawItems = Array.isArray(rawQueue?.items)
    ? rawQueue.items
    : Array.isArray(rawQueue?.simulados)
    ? rawQueue.simulados.map((simulado) => ({
        caveiraId: buildSimuladoKey(simulado),
        simulado,
        savedAt: Number(rawQueue.savedAt) || now,
        attempts: 0,
        lastAttemptAt: 0,
        status: 'saved',
      }))
    : [];

  const deduped = new Map();
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
        status: item.status || 'saved',
      });
    }
  }

  return {
    items: Array.from(deduped.values()),
    lastStatus: rawQueue?.lastStatus || (deduped.size > 0 ? 'saved' : 'idle'),
    lastDeliveryId: rawQueue?.lastDeliveryId || null,
    lastConfirmedAt: Number(rawQueue?.lastConfirmedAt) || 0,
    lastConfirmedCount: Number(rawQueue?.lastConfirmedCount) || 0,
    lastConfirmedIds: Array.isArray(rawQueue?.lastConfirmedIds) ? rawQueue.lastConfirmedIds : [],
    lastError: rawQueue?.lastError || null,
    updatedAt: Number(rawQueue?.updatedAt) || now,
  };
}

export function enqueueSimuladosIntoQueue(prevQueue, simulados = [], now = Date.now()) {
  const base = pruneAndNormalizeQueue(prevQueue, now);
  const byKey = new Map(base.items.map((it) => [it.caveiraId, it]));

  (Array.isArray(simulados) ? simulados : []).forEach((sim) => {
    if (!sim || typeof sim !== 'object') return;
    const key = buildSimuladoKey(sim);
    if (!key) return;
    byKey.set(key, {
      caveiraId: key,
      simulado: { ...sim, caveiraId: sim.caveiraId || key },
      savedAt: now,
      attempts: 0,
      lastAttemptAt: 0,
      status: 'saved',
    });
  });

  return {
    ...base,
    items: Array.from(byKey.values()),
    lastStatus: byKey.size > 0 ? 'saved' : base.lastStatus,
    lastError: null,
    updatedAt: now,
  };
}

export function formatSimuladoDeliveryStatus(queue) {
  if (!queue || typeof queue !== 'object') return { label: '', isDone: false };
  const items = Array.isArray(queue.items) ? queue.items : [];
  const pendingCount = items.filter((i) => Number(i.attempts || 0) < SIMULADO_QUEUE_MAX_ATTEMPTS).length;
  const exhaustedCount = items.length - pendingCount;

  if (queue.lastStatus === 'confirmed' && items.length === 0) {
    const cnt = queue.lastConfirmedCount || (queue.lastConfirmedIds?.length || 0);
    return {
      label: cnt > 0 ? `✅ ${cnt} entregue(s) ao QG (confirmado)` : '✅ Entregue ao QG (confirmado)',
      isDone: true,
    };
  }
  if (items.length === 0) return { label: '', isDone: false };

  if (queue.lastStatus === 'waiting_qg') {
    return {
      label: `⏳ ${items.length} salvo(s) — aguardando o QG (abra o site e faça login)`,
      isDone: false,
    };
  }
  if (queue.lastStatus === 'sending') {
    return {
      label: `📤 ${items.length} salvo(s) — enviando ao QG...`,
      isDone: false,
    };
  }
  if (exhaustedCount > 0 && pendingCount === 0) {
    return {
      label: `⚠️ ${exhaustedCount} pendente(s) após ${SIMULADO_QUEUE_MAX_ATTEMPTS} tentativas — clique "Reenviar" no popup`,
      isDone: false,
    };
  }
  return {
    label: `💾 ${items.length} simulado(s) salvo(s) na extensão — enviando ao QG...`,
    isDone: false,
  };
}

export function computeBlockTotalsFromSubjects(subjectScores = []) {
  if (!Array.isArray(subjectScores) || subjectScores.length === 0) return {};
  let b1C = 0; let b1E = 0; let b1Liquida = 0;
  let b2C = 0; let b2E = 0; let b2Liquida = 0;
  let b3C = 0; let b3E = 0; let b3Liquida = 0;
  subjectScores.forEach((sc) => {
    const b = sc.bloco || classifySubjectBloco(sc.name);
    const h = Number(sc.hits) || 0;
    const e = Number(sc.errors) || 0;
    const liq = sc.liquida !== undefined && sc.liquida !== null ? Number(sc.liquida) : (h - e);
    if (b === 'Bloco I') { b1C += h; b1E += e; b1Liquida += liq; }
    else if (b === 'Bloco II') { b2C += h; b2E += e; b2Liquida += liq; }
    else { b3C += h; b3E += e; b3Liquida += liq; }
  });
  return { b1C, b1E, b1Liquida, b2C, b2E, b2Liquida, b3C, b3E, b3Liquida };
}

export function pickFiniteNumber(candidates = []) {
  for (const val of candidates) {
    if (val === undefined || val === null || val === '') continue;
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return null;
}
