import { normalizeCourseLookupKey } from '../lib/courseIndexParser';

const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'para', 'com', 'sem', 'sobre', 'entre',
  'que', 'uma', 'umo', 'uns', 'umas', 'nao', 'por', 'pela', 'pelo', 'pelas',
  'pelos', 'nos', 'nas', 'aos', 'das', 'como', 'mais', 'menos', 'direito',
  'nocoes', 'legislacao', 'parte', 'aula', 'bloco', 'questao', 'geral'
]);

const tokenize = (str) =>
  normalizeCourseLookupKey(str)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

export function formatSecondsAsClock(totalSec) {
  const safe = Math.max(0, Math.round(Number(totalSec) || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function appendTimestampToUrl(rawUrl, seconds) {
  if (!rawUrl) return '';
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
  if (sec <= 0) return rawUrl;
  try {
    const u = new URL(rawUrl);
    u.searchParams.set('t', String(sec));
    return u.toString();
  } catch (_) {
    const sep = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${sep}t=${sec}`;
  }
}

export function findCourseVideoMatch(question, caveiraCourseIndexMap = {}) {
  if (!question) return null;

  if (question.courseVideoUrl) {
    const sec = Math.max(0, Number(question.courseTimestampSec) || 0);
    return {
      url: appendTimestampToUrl(question.courseVideoUrl, sec),
      mmss: formatSecondsAsClock(sec),
      seconds: sec,
      lessonTitle: question.topic || question.subject || 'Aula vinculada',
      topicLabel: question.topic || ''
    };
  }

  const entries = Object.values(caveiraCourseIndexMap || {}).filter((e) => e && e.url);
  if (entries.length === 0) return null;

  const qSubNorm = normalizeCourseLookupKey(question.canonicalSubject || question.subject || '');
  const qTopicNorm = normalizeCourseLookupKey(question.topic || '');
  const qTokens = tokenize(`${question.canonicalSubject || ''} ${question.subject || ''} ${question.topic || ''} ${(question.content || '').slice(0, 180)}`);
  if (qTokens.length === 0 && !qSubNorm) return null;

  let bestEntry = null;
  let bestTopic = null;
  let bestScore = 0;

  entries.forEach((entry) => {
    const eSubNorm = normalizeCourseLookupKey(`${entry.subject || ''} ${entry.moduleName || ''} ${entry.title || ''}`);
    let entryBaseScore = 0;

    if (qSubNorm && eSubNorm) {
      if (eSubNorm.includes(qSubNorm) || qSubNorm.includes(eSubNorm)) {
        entryBaseScore += 4;
      }
    }
    if (qTopicNorm && normalizeCourseLookupKey(entry.title || '').includes(qTopicNorm)) {
      entryBaseScore += 4;
    }

    const eTokens = new Set(tokenize(`${entry.subject || ''} ${entry.moduleName || ''} ${entry.title || ''}`));
    qTokens.forEach((tok) => {
      if (eTokens.has(tok)) entryBaseScore += 1.5;
    });

    const topicsList = Array.isArray(entry.topics) ? entry.topics : [];
    if (topicsList.length > 0) {
      topicsList.forEach((tp) => {
        if (!tp || !tp.label) return;
        const tLabelNorm = normalizeCourseLookupKey(tp.label);
        const tTokens = new Set(tokenize(tp.label));
        let tScore = entryBaseScore;
        if (qTopicNorm && (tLabelNorm.includes(qTopicNorm) || qTopicNorm.includes(tLabelNorm))) {
          tScore += 5;
        }
        qTokens.forEach((tok) => {
          if (tTokens.has(tok)) tScore += 2;
        });
        if (tScore > bestScore && tScore >= 3) {
          bestScore = tScore;
          bestEntry = entry;
          bestTopic = tp;
        }
      });
    } else if (entryBaseScore > bestScore && entryBaseScore >= 4) {
      bestScore = entryBaseScore;
      bestEntry = entry;
      bestTopic = null;
    }
  });

  if (!bestEntry || !bestEntry.url) return null;

  const seconds = Math.max(0, Number(bestTopic?.seconds) || 0);
  return {
    url: appendTimestampToUrl(bestEntry.url, seconds),
    mmss: bestTopic?.mmss || formatSecondsAsClock(seconds),
    seconds,
    lessonTitle: bestEntry.title || 'Aula do Caveira',
    topicLabel: bestTopic?.label || bestEntry.title || ''
  };
}

export function computeOvercomingStats(questions = []) {
  let retriedCount = 0;
  let initiallyMissedRetried = 0;
  let overcomeCount = 0;

  (Array.isArray(questions) ? questions : []).forEach((q) => {
    if (!q || !Array.isArray(q.attempts) || q.attempts.length < 2) return;
    retriedCount += 1;
    const hadPriorError = q.attempts.slice(0, -1).some((a) => !a?.hit);
    const latestHit = Boolean(q.attempts[q.attempts.length - 1]?.hit);
    if (hadPriorError) {
      initiallyMissedRetried += 1;
      if (latestHit) {
        overcomeCount += 1;
      }
    }
  });

  const ratePct = initiallyMissedRetried > 0
    ? Math.round((overcomeCount / initiallyMissedRetried) * 100)
    : 0;

  return { retriedCount, initiallyMissedRetried, overcomeCount, ratePct };
}

export function computeForgettingCurveByDiscipline(questions = []) {
  const nowMs = Date.now();
  const byDisc = {};

  const makeBucket = () => ({ total: 0, hits: 0, pct: null });

  (Array.isArray(questions) ? questions : []).forEach((q) => {
    if (!q) return;
    const ts = new Date(q.timestamp || q.updatedAt || 0).getTime();
    if (!Number.isFinite(ts) || ts <= 0) return;

    const ageDays = Math.max(0, (nowMs - ts) / 86400000);
    let bucketKey = 'b30p';
    if (ageDays <= 7) bucketKey = 'b0_7';
    else if (ageDays <= 15) bucketKey = 'b8_15';
    else if (ageDays <= 30) bucketKey = 'b16_30';

    const disc = q.canonicalSubject || q.subject || 'Outras';
    if (!byDisc[disc]) {
      byDisc[disc] = {
        discipline: disc,
        total: 0,
        hits: 0,
        buckets: {
          b0_7: makeBucket(),
          b8_15: makeBucket(),
          b16_30: makeBucket(),
          b30p: makeBucket()
        }
      };
    }

    const row = byDisc[disc];
    row.total += 1;
    if (q.hit) row.hits += 1;
    row.buckets[bucketKey].total += 1;
    if (q.hit) row.buckets[bucketKey].hits += 1;
  });

  return Object.values(byDisc)
    .map((row) => {
      ['b0_7', 'b8_15', 'b16_30', 'b30p'].forEach((k) => {
        const b = row.buckets[k];
        b.pct = b.total > 0 ? Math.round((b.hits / b.total) * 100) : null;
      });
      const orderedPcts = ['b0_7', 'b8_15', 'b16_30', 'b30p']
        .map((k) => row.buckets[k].pct)
        .filter((v) => v !== null);
      const decayDelta = orderedPcts.length >= 2
        ? orderedPcts[orderedPcts.length - 1] - orderedPcts[0]
        : null;
      const overallPct = row.total > 0 ? Math.round((row.hits / row.total) * 100) : 0;
      return { ...row, overallPct, decayDelta };
    })
    .sort((a, b) => (a.decayDelta ?? 0) - (b.decayDelta ?? 0) || a.overallPct - b.overallPct);
}

const MEMORIZATION_RULES = [
  {
    category: 'Prazo',
    regex: /\b(\d+\s*(?:dias?(?:\s+[úu]teis|\s+corridos)?|mes(?:es)?|anos?|horas?|minutos?))\b/gi
  },
  {
    category: 'Multa/CTB',
    regex: /\b((?:infra[çc][aã]o\s+)?grav[ií]ssima(?:\s*(?:x|\*)\s*\d+|\s*\d+x)?|fator\s+multiplicador\s*(?:de\s*)?\d+x?|suspens[aã]o\s+do\s+direito\s+de\s+dirigir|cassa[çc][aã]o\s+da\s+(?:cnh|carteira)|reten[çc][aã]o\s+do\s+ve[íi]culo|remo[çc][aã]o\s+do\s+ve[íi]culo|\d+\s*pontos?\s+na\s+(?:cnh|carteira))\b/gi
  },
  {
    category: 'Pena',
    regex: /\b((?:pena\s+de\s+)?(?:reclus[aã]o|deten[çc][aã]o|pris[aã]o\s+simples)\s*,?\s*de\s+[^.;,\n]{3,45})/gi
  }
];

export function extractPrfMemorizationRows(questions = []) {
  const rows = [];
  const seen = new Set();

  const sorted = [...(Array.isArray(questions) ? questions : [])]
    .filter(Boolean)
    .sort((a, b) => {
      if (Boolean(a.hit) !== Boolean(b.hit)) return a.hit ? 1 : -1;
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

  sorted.forEach((q) => {
    const sources = [
      { label: 'Bizu', text: q.userNote || '' },
      { label: 'Comentário', text: q.teacherComment || '' },
      { label: 'Enunciado', text: q.content || '' }
    ].filter((s) => s.text && s.text.trim().length > 0);

    sources.forEach((src) => {
      const text = src.text.replace(/\s+/g, ' ').trim();
      MEMORIZATION_RULES.forEach((rule) => {
        const matches = text.matchAll(rule.regex);
        for (const m of matches) {
          const highlight = String(m[1] || m[0] || '').trim();
          if (!highlight || highlight.length < 3) continue;
          const dedupKey = `${q.id}|${rule.category}|${highlight.toLowerCase()}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          const startIdx = Math.max(0, (m.index || 0) - 42);
          const endIdx = Math.min(text.length, (m.index || 0) + highlight.length + 58);
          const snippet = `${startIdx > 0 ? '...' : ''}${text.slice(startIdx, endIdx).trim()}${endIdx < text.length ? '...' : ''}`;

          rows.push({
            id: dedupKey,
            questionId: q.id,
            subject: q.canonicalSubject || q.subject || 'PRF',
            topic: q.topic || '',
            hit: Boolean(q.hit),
            sourceLabel: src.label,
            category: rule.category,
            highlight,
            snippet
          });
          if (rows.length >= 160) break;
        }
      });
    });
  });

  return rows;
}
