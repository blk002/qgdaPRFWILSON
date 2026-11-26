import { normalizeCourseLookupKey } from '../lib/courseIndexParser.js';

const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'para', 'com', 'sem', 'sobre', 'entre',
  'que', 'uma', 'umo', 'uns', 'umas', 'nao', 'por', 'pela', 'pelo', 'pelas',
  'pelos', 'nos', 'nas', 'aos', 'como', 'mais', 'menos', 'direito', 'nocoes',
  'legislacao', 'parte', 'aula', 'bloco', 'questao', 'geral', 'codigo',
  'transito', 'brasileiro', 'ctb', 'lei', 'art', 'artigo', 'artigos',
  'capitulo', 'secao', 'titulo', 'disposicoes', 'conceito', 'conceitos',
  'introducao', 'saudacao', 'saudacoes', 'apresentacao', 'boas', 'vindas',
  'encerramento', 'consideracoes', 'finais', 'conclusao', 'inicio',
  'revisao', 'resumo', 'exercicios', 'questoes', 'modulo', 'tema', 'topico',
  'normas', 'gerais', 'regras'
]);

const GENERIC_TIMESTAMP_LABEL_RX = /^(?:saudac(?:ao|oes)(?:\s+iniciais?)?|introducao(?:\s+(?:geral|inicial|(?:a|ao|da|do)\s+(?:aula|tema|modulo|disciplina|curso|ctb)))?|apresentacao(?:\s+(?:inicial|geral|da\s+aula|do\s+tema|do\s+curso))?|boas[\s-]+vindas|abertura|inicio(?:\s+da\s+aula)?|encerramento|consideracoes\s+finais|conclusao|finalizacao|despedida|avisos?(?:\s+gerais|\s+importantes)?)$/i;

const DOMAIN_WEAK_TOKENS = new Set([
  'veiculo', 'veiculos', 'condutor', 'condutores', 'via', 'vias', 'pista',
  'circulacao', 'crime', 'crimes', 'pena', 'penas', 'processo', 'acao',
  'estado', 'publico', 'publica', 'servidor', 'servidores', 'administracao',
  'federal', 'nacional', 'sistema', 'seguranca', 'texto', 'frase', 'palavra',
  'palavras', 'oracao', 'oracoes'
]);

const tokenize = (str) =>
  normalizeCourseLookupKey(str)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

function inferSubjectFamily(rawStr = '') {
  const s = normalizeCourseLookupKey(rawStr);
  if (!s) return '';
  if (/\b(?:transito|ctb|contran|9503)\b/.test(s)) return 'transito';
  if (/\b(?:processo penal|processual penal|cpp|inquerito policial|prisao)\b/.test(s)) return 'processual_penal';
  if (/\b(?:direito penal|codigo penal|teoria do crime|crimes contra)\b/.test(s)) return 'penal';
  if (/\b(?:constitucional|constituicao federal)\b/.test(s)) return 'constitucional';
  if (/\b(?:administrativo|administracao publica|improbidade|licitac|poderes administrativos|atos administrativos)\b/.test(s)) return 'administrativo';
  if (/\b(?:direitos humanos|pacto de san jose|dudh)\b/.test(s)) return 'direitos_humanos';
  if (/\b(?:legislacao especial|legislacao extravagante|leis especiais|eca|desarmamento|drogas|abuso de autoridade|maria da penha|tortura)\b/.test(s)) return 'legislacao_especial';
  if (/\b(?:portugues|lingua portuguesa|gramatica|sintaxe|morfologia|interpretacao de texto|redacao oficial|crase|regencia|concordancia)\b/.test(s)) return 'portugues';
  if (/\b(?:informatica|computador|redes|seguranca da informacao|linux|windows|malware|nuvem|internet)\b/.test(s)) return 'informatica';
  if (/\b(?:raciocinio logico|rlm|matematica|logica|probabilidade|combinatoria)\b/.test(s)) return 'rlm';
  if (/\b(?:fisica|cinematica|dinamica|energia mecanica|colisoes)\b/.test(s)) return 'fisica';
  if (/\b(?:etica|1171|cidadania)\b/.test(s)) return 'etica';
  if (/\b(?:geopolitica|geografia)\b/.test(s)) return 'geopolitica';
  if (/\b(?:ingles|english)\b/.test(s)) return 'ingles';
  if (/\b(?:espanhol|spanish)\b/.test(s)) return 'espanhol';
  return '';
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
  const matched = [];
  for (const tok of tokens) {
    if (tokenMatchesTarget(tok, targetSet)) {
      hits += 1;
      if (tok.length > maxLen) maxLen = tok.length;
      matched.push(tok);
    }
  }
  return { hits, maxLen, matched };
}

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

  const qSubjectRaw = `${question.canonicalSubject || ''} ${question.subject || ''}`;
  const qSubNorm = normalizeCourseLookupKey(qSubjectRaw);
  const qFamily = inferSubjectFamily(`${qSubjectRaw} ${question.topic || ''} ${question.subtopicPath || ''}`);

  // Extrai o(s) segmento(s) folha específicos do assunto (removendo prefixo genérico da disciplina/código)
  const rawSegments = String(question.subtopicPath || question.topic || '')
    .split(/->|➔|›|>/)
    .map((s) => s.trim())
    .filter(Boolean);
  const specificSegments = rawSegments.filter((seg, idx) => {
    const segNorm = normalizeCourseLookupKey(seg);
    if (!segNorm) return false;
    if (idx === 0 && rawSegments.length > 1) {
      if (qSubNorm && (qSubNorm.includes(segNorm) || segNorm.includes(qSubNorm))) return false;
      if (/\b(?:codigo de transito|constituicao federal|codigo penal|codigo de processo)\b/.test(segNorm)) return false;
    }
    return true;
  });
  const leafRaw = specificSegments.length > 0
    ? specificSegments[specificSegments.length - 1]
    : (question.topic || '');
  const specificRaw = specificSegments.length > 0 ? specificSegments.join(' ') : (question.topic || '');
  const leafNorm = normalizeCourseLookupKey(leafRaw)
    .replace(/^(?:capitulo|secao|titulo|modulo)\s+[ivxlcdm\d]+\s*/i, '')
    .trim();
  const specificPhrases = Array.from(new Set([
    normalizeCourseLookupKey(leafRaw),
    leafNorm,
  ].filter((p) => p && p.length >= 6)));

  const qSubTokens = new Set(tokenize(qSubjectRaw));
  const specificTopicTokens = Array.from(new Set(tokenize(specificRaw)))
    .filter((tok) => !qSubTokens.has(tok) || tokenize(leafRaw).includes(tok));
  if (specificTopicTokens.length === 0) return null;

  const strongTopicTokens = specificTopicTokens.filter((tok) => !DOMAIN_WEAK_TOKENS.has(tok));
  const contentTokens = Array.from(new Set(tokenize((question.content || '').slice(0, 220))))
    .filter((tok) => !specificTopicTokens.includes(tok));

  let bestEntry = null;
  let bestTopic = null;
  let bestScore = 0;

  entries.forEach((entry) => {
    const eHeaderRaw = `${entry.subject || ''} ${entry.moduleName || ''} ${entry.title || ''}`;
    const eSubNorm = normalizeCourseLookupKey(eHeaderRaw);
    const entryFamily = inferSubjectFamily(eHeaderRaw);
    if (qFamily && entryFamily && qFamily !== entryFamily) return;

    const sameDiscipline = Boolean(
      (qFamily && entryFamily && qFamily === entryFamily) ||
      (qSubNorm && eSubNorm && (eSubNorm.includes(qSubNorm) || qSubNorm.includes(eSubNorm)))
    );

    const entryTitleNorm = normalizeCourseLookupKey(entry.title || '');
    const titlePhraseMatch = specificPhrases.some((p) => (
      entryTitleNorm.includes(p) || (entryTitleNorm.length >= 8 && p.includes(entryTitleNorm))
    ));
    const entryTitleTokenSet = new Set(tokenize(`${entry.title || ''} ${entry.moduleName || ''}`));
    const entryTitleMatch = collectTokenMatches(specificTopicTokens, entryTitleTokenSet);
    const entryTitleStrongMatch = collectTokenMatches(strongTopicTokens, entryTitleTokenSet);

    const topicsList = Array.isArray(entry.topics) ? entry.topics : [];
    let matchedInsideTopics = false;

    if (topicsList.length > 0) {
      topicsList.forEach((tp) => {
        if (!tp || !tp.label) return;
        const tLabelNorm = normalizeCourseLookupKey(tp.label);
        if (!tLabelNorm || GENERIC_TIMESTAMP_LABEL_RX.test(tLabelNorm)) return;

        const tLabelTokenSet = new Set(tokenize(tp.label));
        if (tLabelTokenSet.size === 0) return;

        const labelPhraseMatch = specificPhrases.some((p) => (
          tLabelNorm.includes(p) || (tLabelNorm.length >= 8 && p.includes(tLabelNorm))
        ));
        const labelMatch = collectTokenMatches(specificTopicTokens, tLabelTokenSet);
        const labelStrongMatch = collectTokenMatches(strongTopicTokens, tLabelTokenSet);
        const contentMatchOnLabel = collectTokenMatches(contentTokens, tLabelTokenSet);

        let qualified = false;
        if (strongTopicTokens.length > 0) {
          qualified = Boolean(
            labelPhraseMatch ||
            (titlePhraseMatch && labelStrongMatch.hits >= 1) ||
            labelStrongMatch.hits >= 2 ||
            (labelStrongMatch.hits === 1 && (labelMatch.hits >= 2 || entryTitleMatch.hits >= 1 || contentMatchOnLabel.hits >= 1))
          );
        } else {
          const weakCoverage = specificTopicTokens.length > 0 ? (labelMatch.hits / specificTopicTokens.length) : 0;
          qualified = Boolean(
            labelPhraseMatch ||
            (titlePhraseMatch && labelMatch.hits >= 1) ||
            (labelMatch.hits >= 2 && weakCoverage >= 0.6)
          );
        }
        if (!qualified) return;

        matchedInsideTopics = true;
        const score =
          (labelPhraseMatch ? 14 : 0) +
          (titlePhraseMatch ? 6 : 0) +
          labelStrongMatch.hits * 6 +
          entryTitleStrongMatch.hits * 3 +
          labelMatch.hits * 2 +
          entryTitleMatch.hits * 1.5 +
          Math.min(contentMatchOnLabel.hits, 3) * 1.5 +
          (sameDiscipline ? 1 : 0);

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
      if (strongTopicTokens.length > 0) {
        qualifiedLessonOnly = Boolean(
          titlePhraseMatch ||
          (entryTitleStrongMatch.hits >= 1 && entryTitleMatch.hits >= 2) ||
          (entryTitleStrongMatch.hits >= 1 && entryTitleStrongMatch.maxLen >= 7 && sameDiscipline && (contentMatchOnTitle.hits >= 1 || entryTitleStrongMatch.maxLen >= 8))
        );
      } else {
        const weakTitleCoverage = specificTopicTokens.length > 0 ? (entryTitleMatch.hits / specificTopicTokens.length) : 0;
        qualifiedLessonOnly = Boolean(
          titlePhraseMatch ||
          (entryTitleMatch.hits >= 2 && weakTitleCoverage >= 0.6)
        );
      }
      if (qualifiedLessonOnly) {
        const lessonScore =
          (titlePhraseMatch ? 12 : 0) +
          entryTitleStrongMatch.hits * 5 +
          entryTitleMatch.hits * 2 +
          Math.min(contentMatchOnTitle.hits, 2) * 1.5 +
          (sameDiscipline ? 1 : 0);
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
  let targetUrl = appendTimestampToUrl(bestEntry.url, seconds);
  if (bestEntry.title && !String(targetUrl).includes('#qg_lesson=')) {
    const cleanUrl = String(targetUrl).split('#')[0];
    const subjectHint = question.canonicalSubject || question.subject || bestEntry.subject || '';
    targetUrl = `${cleanUrl}#qg_lesson=${encodeURIComponent(bestEntry.title)}${subjectHint ? `&qg_subject=${encodeURIComponent(subjectHint)}` : ''}`;
  }

  return {
    url: targetUrl,
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
        ? orderedPcts[0] - orderedPcts[orderedPcts.length - 1]
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
