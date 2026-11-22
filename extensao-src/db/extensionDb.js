import Dexie from 'dexie';
import MiniSearch from 'minisearch';

const db = new Dexie('QGPrfCaveiraDB');

db.version(1).stores({
  questions: '&id, ownerUserId, subject, canonicalSubject, bloco, hit, updatedAt, timestamp',
  outbox: '++seq, entityType, entityId, userId, createdAt, status',
  dynamicTreeNodes: '&key, subjectId, nodeId, updatedAt',
  meta: '&key',
});

let miniIndex = null;
let indexedUserId = null;

export function normalizeSearchText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function createMiniIndex() {
  return new MiniSearch({
    fields: ['id', 'subject', 'canonicalSubject', 'topic', 'content', 'userNote', 'teacherComment'],
    storeFields: ['id', 'subject', 'canonicalSubject', 'topic', 'hit', 'userChoice', 'correctChoice', 'userNote', 'content', 'timestamp'],
    processTerm: (term) => normalizeSearchText(term),
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { id: 4, userNote: 3, topic: 2.5, canonicalSubject: 2, content: 1.5 },
    },
  });
}

function toIndexDoc(q) {
  return {
    id: String(q.id || ''),
    subject: String(q.subject || ''),
    canonicalSubject: String(q.canonicalSubject || ''),
    topic: String(q.topic || ''),
    content: String(q.content || ''),
    userNote: String(q.userNote || ''),
    teacherComment: String(q.teacherComment || ''),
    hit: Boolean(q.hit),
    userChoice: String(q.userChoice || ''),
    correctChoice: String(q.correctChoice || ''),
    timestamp: q.timestamp || q.updatedAt || '',
  };
}

function mergeAttempts(prev = null, incoming = {}) {
  const list = [];
  const pushUnique = (entry) => {
    if (!entry || typeof entry !== 'object') return;
    const ts = entry.timestamp || new Date().toISOString();
    const tsMs = new Date(ts).getTime() || 0;
    const hit = Boolean(entry.hit);
    const userChoice = String(entry.userChoice || '');
    const durationSeconds = Number(entry.durationSeconds) || 0;
    const dup = list.some((ex) => {
      const exMs = new Date(ex.timestamp || 0).getTime() || 0;
      return Math.abs(exMs - tsMs) <= 5000 && Boolean(ex.hit) === hit && String(ex.userChoice || '') === userChoice;
    });
    if (!dup) list.push({ timestamp: ts, hit, userChoice, durationSeconds });
  };

  if (prev) {
    if (Array.isArray(prev.attempts) && prev.attempts.length > 0) {
      prev.attempts.forEach(pushUnique);
    } else if (prev.timestamp || prev.updatedAt || prev.userChoice) {
      pushUnique({
        timestamp: prev.timestamp || prev.updatedAt,
        hit: prev.hit,
        userChoice: prev.userChoice,
        durationSeconds: prev.durationSeconds,
      });
    }
  }

  if (Array.isArray(incoming.attempts) && incoming.attempts.length > 0) {
    incoming.attempts.forEach(pushUnique);
  } else if (incoming.timestamp || incoming.userChoice !== undefined || incoming.hit !== undefined) {
    const incomingTs = incoming.timestamp || incoming.updatedAt || new Date().toISOString();
    const incomingMs = new Date(incomingTs).getTime() || 0;
    const latest = list.length > 0 ? list[list.length - 1] : null;
    const latestMs = latest ? (new Date(latest.timestamp || 0).getTime() || 0) : 0;
    const changed = latest && (Boolean(latest.hit) !== Boolean(incoming.hit) || String(latest.userChoice || '') !== String(incoming.userChoice || ''));
    if (!latest || Math.abs(incomingMs - latestMs) > 5000 || (changed && incomingMs >= latestMs)) {
      pushUnique({
        timestamp: incomingTs,
        hit: incoming.hit,
        userChoice: incoming.userChoice,
        durationSeconds: incoming.durationSeconds,
      });
    }
  }

  return list.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}

export function mergeQuestionRecords(prev = null, incoming = {}) {
  const nowIso = new Date().toISOString();
  const base = prev ? { ...prev, ...incoming } : { ...incoming };
  const attempts = mergeAttempts(prev, incoming);

  const pickRicherText = (prevText, incText) => {
    const p = String(prevText || '');
    const i = String(incText || '');
    if (!i) return p;
    if (!p) return i;
    return p.length > i.length + 25 ? p : i;
  };

  const content = pickRicherText(prev?.content, incoming.content);
  const teacherComment = pickRicherText(prev?.teacherComment, incoming.teacherComment);
  const userNote = (incoming.userNote !== undefined && incoming.userNote !== '')
    ? incoming.userNote
    : (prev?.userNote || '');
  const alternatives = (Array.isArray(incoming.alternatives) && incoming.alternatives.length > 0 && (!Array.isArray(prev?.alternatives) || incoming.alternatives.length >= prev.alternatives.length))
    ? incoming.alternatives
    : (prev?.alternatives || null);

  const communityCorrectPct = incoming.communityCorrectPct !== undefined && incoming.communityCorrectPct !== null
    ? Number(incoming.communityCorrectPct)
    : (prev?.communityCorrectPct !== undefined && prev?.communityCorrectPct !== null ? Number(prev.communityCorrectPct) : undefined);
  const communityErrorPct = incoming.communityErrorPct !== undefined && incoming.communityErrorPct !== null
    ? Number(incoming.communityErrorPct)
    : (communityCorrectPct !== undefined ? Math.max(0, Math.min(100, Math.round(100 - communityCorrectPct))) : prev?.communityErrorPct);

  const hitVal = Boolean(base.hit);
  return {
    ...base,
    ...(content ? { content } : {}),
    attempts,
    teacherComment,
    commentSource: incoming.commentSource || prev?.commentSource || (teacherComment ? 'professor' : ''),
    userNote,
    alternatives,
    ...(communityCorrectPct !== undefined ? { communityCorrectPct } : {}),
    ...(communityErrorPct !== undefined ? { communityErrorPct } : {}),
    isPegadinha: communityErrorPct !== undefined ? communityErrorPct >= 65 : Boolean(base.isPegadinha),
    isAvoidableError: communityCorrectPct !== undefined ? (!hitVal && communityCorrectPct >= 65) : Boolean(base.isAvoidableError),
    timestamp: base.timestamp || prev?.timestamp || nowIso,
    updatedAt: incoming.updatedAt || nowIso,
  };
}

export async function enqueueOutboxEvent(entityType, entityId, userId, payload) {
  if (!entityId) return null;
  return db.outbox.add({
    entityType,
    entityId: String(entityId),
    userId: userId || null,
    payload: payload || {},
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
}

export async function upsertQuestionFull(question, { enqueueOutbox = true } = {}) {
  if (!question || !question.id) return null;
  const prev = await db.questions.get(question.id);
  const merged = mergeQuestionRecords(prev, question);
  await db.questions.put(merged);

  if (miniIndex && (!indexedUserId || !merged.ownerUserId || merged.ownerUserId === indexedUserId)) {
    try {
      const doc = toIndexDoc(merged);
      if (miniIndex.has(doc.id)) miniIndex.replace(doc);
      else miniIndex.add(doc);
    } catch (_) {
      miniIndex = null;
    }
  }

  if (enqueueOutbox) {
    await enqueueOutboxEvent('question_upsert', merged.id, merged.ownerUserId || null, merged);
  }
  return merged;
}

export async function bulkUpsertQuestionsFull(questions = [], { enqueueOutbox = false } = {}) {
  if (!Array.isArray(questions) || questions.length === 0) return [];
  const valid = questions.filter((q) => q && q.id);
  if (valid.length === 0) return [];

  const existing = await db.questions.bulkGet(valid.map((q) => q.id));
  const mergedList = valid.map((q, idx) => mergeQuestionRecords(existing[idx] || null, q));
  await db.questions.bulkPut(mergedList);
  miniIndex = null;

  if (enqueueOutbox) {
    await db.outbox.bulkAdd(
      mergedList.map((m) => ({
        entityType: 'question_upsert',
        entityId: String(m.id),
        userId: m.ownerUserId || null,
        payload: m,
        createdAt: new Date().toISOString(),
        status: 'pending',
      }))
    );
  }
  return mergedList;
}

export async function deleteQuestionFull(id, userId = null, { enqueueOutbox = true } = {}) {
  if (!id) return false;
  const prev = await db.questions.get(id);
  await db.questions.delete(id);
  if (miniIndex) {
    try {
      if (miniIndex.has(id)) miniIndex.discard(id);
    } catch (_) {
      miniIndex = null;
    }
  }
  if (enqueueOutbox) {
    await enqueueOutboxEvent('question_delete', id, userId || prev?.ownerUserId || null, { id });
  }
  return true;
}

export async function getAllQuestionsFull(userId = null) {
  const all = await db.questions.toArray();
  const scoped = userId
    ? all.filter((q) => q && (!q.ownerUserId || q.ownerUserId === userId))
    : all;
  return scoped.sort((a, b) => new Date(b.timestamp || b.updatedAt || 0) - new Date(a.timestamp || a.updatedAt || 0));
}

async function ensureSearchIndex(userId = null) {
  if (miniIndex && indexedUserId === userId) return miniIndex;
  const idx = createMiniIndex();
  const list = await getAllQuestionsFull(userId);
  idx.addAll(list.map(toIndexDoc));
  miniIndex = idx;
  indexedUserId = userId;
  return miniIndex;
}

export async function searchQuestionsOffline(query, userId = null, limit = 25) {
  const clean = normalizeSearchText(query);
  if (!clean) {
    const recent = await getAllQuestionsFull(userId);
    return recent.slice(0, limit);
  }
  const idx = await ensureSearchIndex(userId);
  const hits = idx.search(clean);
  if (hits.length > 0) {
    return hits.slice(0, limit);
  }
  // Fallback substring simples para códigos parciais (ex: "1143" ou art.)
  const list = await getAllQuestionsFull(userId);
  return list
    .filter((q) => {
      const hay = normalizeSearchText(`${q.id} ${q.subject} ${q.canonicalSubject} ${q.topic} ${q.content} ${q.userNote} ${q.teacherComment}`);
      return hay.includes(clean);
    })
    .slice(0, limit)
    .map((q) => ({ ...toIndexDoc(q), score: 1 }));
}

export async function getPendingOutbox(userId = null) {
  const rows = await db.outbox.orderBy('seq').toArray();
  return userId ? rows.filter((r) => !r.userId || r.userId === userId) : rows;
}

export async function clearOutboxSeqs(seqs = []) {
  if (!Array.isArray(seqs) || seqs.length === 0) return;
  await db.outbox.bulkDelete(seqs);
}

export async function mergeDynamicTreeNodes(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return 0;
  const now = Date.now();
  const normalized = [];
  for (const e of entries) {
    if (!e || !e.subjectId || !e.nodeId || !e.name) continue;
    normalized.push({
      key: `${e.subjectId}:${e.nodeId}`,
      subjectId: Number(e.subjectId),
      subjectName: String(e.subjectName || ''),
      nodeId: Number(e.nodeId),
      parentId: Number(e.parentId || e.subjectId),
      depth: Number(e.depth) || 1,
      name: String(e.name).trim(),
      path: Array.isArray(e.path) ? e.path.map(Number) : [Number(e.subjectId), Number(e.nodeId)],
      updatedAt: now,
    });
  }
  if (normalized.length === 0) return 0;
  await db.dynamicTreeNodes.bulkPut(normalized);
  return normalized.length;
}

export async function getAllDynamicTreeNodes() {
  return db.dynamicTreeNodes.toArray();
}

export async function getMeta(key) {
  const row = await db.meta.get(key);
  return row ? row.value : undefined;
}

export async function setMeta(key, value) {
  await db.meta.put({ key, value, updatedAt: Date.now() });
}

export async function getDbStats(userId = null) {
  const [questions, pending, treeNodes] = await Promise.all([
    getAllQuestionsFull(userId),
    getPendingOutbox(userId),
    db.dynamicTreeNodes.count(),
  ]);
  return {
    totalQuestions: questions.length,
    pendingOutbox: pending.length,
    dynamicNodesCount: treeNodes,
  };
}

export async function migrateLegacyChromeStorageToDexie(rawQuestions = []) {
  const alreadyMigrated = await getMeta('legacyMigratedV3');
  if (alreadyMigrated) return 0;
  let imported = 0;
  if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
    const valid = rawQuestions.filter((q) => q && q.id);
    if (valid.length > 0) {
      await bulkUpsertQuestionsFull(valid, { enqueueOutbox: false });
      imported = valid.length;
    }
  }
  await setMeta('legacyMigratedV3', true);
  return imported;
}

export { db };
