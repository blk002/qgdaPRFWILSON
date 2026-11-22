// Mapeador estruturado de questões para a árvore oficial do Caveira (v3.1.0)
import { classifySubjectBloco, getTodaySessionDate, normalizeFilterText } from './utils.js';

function cleanSegment(seg) {
  return String(seg || '').replace(/\s+/g, ' ').trim();
}

export function parseLastAnswerStatus(rawStatus) {
  if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
    return { hit: null, recognized: true, rawValue: null };
  }
  if (typeof rawStatus === 'boolean') {
    return { hit: rawStatus, recognized: true, rawValue: rawStatus };
  }
  if (typeof rawStatus === 'number') {
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

export function resolveTreeIdsForQuestion(tree, { subject = '', subtopic = '', subtopicPath = '' } = {}) {
  if (!tree || !tree.subjects) {
    return { subjectId: null, subtopicId: null, subjectName: subject || '', subtopicName: subtopic || '', matchMethod: 'no_tree' };
  }

  const rawSegments = String(subtopicPath || '')
    .split(/->|➔|›|>|\//)
    .map(cleanSegment)
    .filter(Boolean);

  const discCandidate = cleanSegment(subject) || rawSegments[0] || '';
  const resolver = typeof globalThis !== 'undefined' ? globalThis.QGCaveiraResolver : null;
  let subjObj = null;

  if (resolver && typeof resolver.resolveSubject === 'function') {
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
    return { subjectId: null, subtopicId: null, subjectName: discCandidate, subtopicName: subtopic || '', matchMethod: 'subject_unmatched' };
  }

  const candidateNames = [];
  if (subtopic) candidateNames.push(cleanSegment(subtopic));
  // Tenta do segmento mais específico (folha) para o mais genérico (pulando o índice 0 se igual à disciplina)
  for (let i = rawSegments.length - 1; i >= 0; i -= 1) {
    const seg = rawSegments[i];
    if (i === 0 && normalizeFilterText(seg) === normalizeFilterText(subjObj.name)) continue;
    if (seg && !candidateNames.includes(seg)) candidateNames.push(seg);
  }

  let matchedNode = null;
  let matchMethod = 'subject_only';

  // 1. Casamento exato normalizado dentro da disciplina
  for (const cand of candidateNames) {
    const candNorm = normalizeFilterText(cand);
    if (!candNorm) continue;
    const exact = subjObj.nodes.find((n) => normalizeFilterText(n.name) === candNorm);
    if (exact) {
      matchedNode = exact;
      matchMethod = cand === cleanSegment(subtopic) ? 'exact_subtopic' : 'exact_path_segment';
      break;
    }
  }

  // 2. Fallback por inclusão/tokens dentro da disciplina
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
          matchMethod = 'fuzzy_within_subject';
        }
      }
    }
  }

  // 3. Fallback usando QGCaveiraResolver se houver texto suficiente
  if (!matchedNode && resolver && candidateNames.length > 0) {
    const res = resolver.resolveLesson(tree, {
      subjectName: subjObj.name,
      lessons: candidateNames.slice(0, 1),
      topic: rawSegments.slice(1).join(' '),
      subtopics: candidateNames,
    });
    if (res && Array.isArray(res.ids) && res.ids.length > 0) {
      const n = subjObj.byId.get(res.ids[0]);
      if (n) {
        matchedNode = n;
        matchMethod = `resolver_${res.confidence || 'fallback'}`;
      }
    }
  }

  return {
    subjectId: subjObj.id,
    subtopicId: matchedNode ? matchedNode.id : null,
    subjectName: subjObj.name,
    subtopicName: matchedNode ? matchedNode.name : (subtopic || ''),
    matchMethod,
  };
}

export function buildStructuredTelemetryRecord({
  apiId = null,
  subjectId = null,
  subtopicId = null,
  banca = '',
  ano = '',
  acertou = null,
  data = '',
} = {}) {
  return {
    apiId: Number.isFinite(Number(apiId)) && Number(apiId) > 0 ? Number(apiId) : null,
    subjectId: Number.isFinite(Number(subjectId)) && Number(subjectId) > 0 ? Number(subjectId) : null,
    subtopicId: Number.isFinite(Number(subtopicId)) && Number(subtopicId) > 0 ? Number(subtopicId) : null,
    banca: String(banca || '').trim(),
    ano: String(ano || '').trim(),
    acertou: acertou === null || acertou === undefined ? null : Boolean(acertou),
    data: data || getTodaySessionDate(),
  };
}

export function inferSubjectFallbackFromApi(subjectStr = '', subtopicPath = '') {
  const firstFromPath = String(subtopicPath || '').split(/->|➔|›|>/)[0] || '';
  const name = cleanSegment(subjectStr) || cleanSegment(firstFromPath);
  return {
    name,
    bloco: classifySubjectBloco(name),
  };
}
