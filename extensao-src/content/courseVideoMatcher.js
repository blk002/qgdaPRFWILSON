// Matcher de aula + timestamp para "Professor no Timestamp" (#9) na extensão
import { normalizeCourseIndexKey } from './utils.js';

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
  normalizeCourseIndexKey(str)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

function inferSubjectFamily(rawStr = '') {
  const s = normalizeCourseIndexKey(rawStr);
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
  for (const tok of tokens) {
    if (tokenMatchesTarget(tok, targetSet)) {
      hits += 1;
      if (tok.length > maxLen) maxLen = tok.length;
    }
  }
  return { hits, maxLen };
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

export function parseTimestampTopicsFromText(rawText = '') {
  const lines = String(rawText || '').split(/\r?\n/);
  const parsed = [];
  for (const raw of lines) {
    const m = raw.match(/[[( ]?(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]?\s*[-–—:|]*\s*(.+)/);
    if (!m) continue;
    const hasHours = m[3] !== undefined;
    const h = hasHours ? Number(m[1]) : 0;
    const min = hasHours ? Number(m[2]) : Number(m[1]);
    const sec = hasHours ? Number(m[3]) : Number(m[2]);
    const seconds = h * 3600 + min * 60 + sec;
    const mmss = hasHours
      ? `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const label = String(m[4] || '').trim();
    if (label && seconds >= 0) {
      parsed.push({ label, mmss, seconds });
    }
  }
  return parsed;
}

export function findCourseVideoMatchForExtension(question, courseIndexMap = {}) {
  if (!question) return null;

  const entries = Object.values(courseIndexMap || {}).filter((e) => e && e.url);
  if (entries.length === 0) return null;

  const qSubjectRaw = `${question.canonicalSubject || ''} ${question.subject || ''}`;
  const qSubNorm = normalizeCourseIndexKey(qSubjectRaw);
  const qFamily = inferSubjectFamily(`${qSubjectRaw} ${question.topic || ''} ${question.subtopicPath || ''}`);

  const rawSegments = String(question.subtopicPath || question.topic || '')
    .split(/->|➔|›|>/)
    .map((s) => s.trim())
    .filter(Boolean);
  const specificSegments = rawSegments.filter((seg, idx) => {
    const segNorm = normalizeCourseIndexKey(seg);
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
  const leafNorm = normalizeCourseIndexKey(leafRaw)
    .replace(/^(?:capitulo|secao|titulo|modulo)\s+[ivxlcdm\d]+\s*/i, '')
    .trim();
  const specificPhrases = Array.from(new Set([
    normalizeCourseIndexKey(leafRaw),
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
    const entryTitle = entry.title || entry.lessonTitle || '';
    const eHeaderRaw = `${entry.subject || ''} ${entry.moduleName || ''} ${entryTitle}`;
    const eSubNorm = normalizeCourseIndexKey(eHeaderRaw);
    const entryFamily = inferSubjectFamily(eHeaderRaw);
    if (qFamily && entryFamily && qFamily !== entryFamily) return;

    const sameDiscipline = Boolean(
      (qFamily && entryFamily && qFamily === entryFamily) ||
      (qSubNorm && eSubNorm && (eSubNorm.includes(qSubNorm) || qSubNorm.includes(eSubNorm)))
    );

    const entryTitleNorm = normalizeCourseIndexKey(entryTitle);
    const titlePhraseMatch = specificPhrases.some((p) => (
      entryTitleNorm.includes(p) || (entryTitleNorm.length >= 8 && p.includes(entryTitleNorm))
    ));
    const entryTitleTokenSet = new Set(tokenize(`${entryTitle} ${entry.moduleName || ''}`));
    const entryTitleMatch = collectTokenMatches(specificTopicTokens, entryTitleTokenSet);
    const entryTitleStrongMatch = collectTokenMatches(strongTopicTokens, entryTitleTokenSet);

    const topicsList = (Array.isArray(entry.topics) && entry.topics.length > 0)
      ? entry.topics
      : parseTimestampTopicsFromText(entry.indiceRawText || entry.rawIndexText || '');

    let matchedInsideTopics = false;

    if (topicsList.length > 0) {
      topicsList.forEach((tp) => {
        if (!tp || !tp.label) return;
        const tLabelNorm = normalizeCourseIndexKey(tp.label);
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
          (sameDiscipline ? 1 : 0) -
          (entry.isFallbackSubjectLesson ? 0.5 : 0);
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
  const lessonTitle = bestEntry.title || bestEntry.lessonTitle || 'Aula do Caveira';
  let targetUrl = appendTimestampToUrl(bestEntry.url, seconds);
  if (lessonTitle && !String(targetUrl).includes('#qg_lesson=')) {
    const cleanUrl = String(targetUrl).split('#')[0];
    const subjectHint = question.canonicalSubject || question.subject || bestEntry.subject || '';
    targetUrl = `${cleanUrl}#qg_lesson=${encodeURIComponent(lessonTitle)}${subjectHint ? `&qg_subject=${encodeURIComponent(subjectHint)}` : ''}`;
  }

  const courseIdMatch = String(bestEntry.url || '').match(/\/courses\/(\d+)/i);
  const courseId = String(bestEntry.courseId || courseIdMatch?.[1] || '');

  return {
    url: targetUrl,
    mmss: bestTopic?.mmss || formatSecondsAsClock(seconds),
    seconds,
    lessonTitle,
    topicLabel: bestTopic?.label || lessonTitle,
    courseId,
  };
}
