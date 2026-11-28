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
const INTRO_PREFIX_AT_START_RX = /^(?:introducao|apresentacao|saudac|boas[\s-]+vindas|abertura|encerramento|consideracoes\s+finais|conclusao|finalizacao|avisos?)\b/i;

const DOMAIN_WEAK_TOKENS = new Set([
  'publico', 'publica', 'federal', 'nacional', 'sistema',
  'texto', 'frase', 'palavra', 'palavras', 'oracao', 'oracoes',
  'conceito', 'conceitos', 'geral', 'basico', 'basicos'
]);

const tokenize = (str) =>
  normalizeCourseIndexKey(str)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

function cleanCourseEntryTitle(str = '') {
  return String(str || '')
    .replace(/\b(?:play_circle(?:_outline|_filled)?|check_circle|ondemand_video|smart_display|lock|schedule)\b/gi, ' ')
    .replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLessonPartSuffix(str = '') {
  return cleanCourseEntryTitle(str)
    .replace(/\s*[-–—:|]?\s*(?:parte|pt\.?|aula|bloco)\s*(?:\d+|[ivxlcdm]+)\s*$/i, '')
    .trim();
}

function extractPartNumber(str = '') {
  const m = String(str || '').match(/\b(?:parte|pt\.?|aula|bloco)\s*(\d+)\b/i);
  return m ? Number(m[1]) : 99;
}

function sanitizeCourseBaseUrl(rawUrl = '') {
  if (!rawUrl) return '';
  try {
    const u = new URL(String(rawUrl));
    u.hash = '';
    u.searchParams.delete('t');
    return u.toString();
  } catch (_) {
    return String(rawUrl).split('#')[0].replace(/([?&])t=\d+&?/g, '$1').replace(/[?&]$/, '');
  }
}

function extractLawOrResolutionNumbers(rawStr = '') {
  const norm = normalizeCourseIndexKey(rawStr);
  const contranNums = new Set();
  const lawNums = new Set();
  const contranRx = /\b(?:resoluc(?:ao|oes)?\s*(?:contran|do\s+contran)?|contran)\s*(?:n[°ºo.]*\s*)?(\d+(?:\.\d+)?)\b/gi;
  let m;
  while ((m = contranRx.exec(norm)) !== null) {
    const cleanNum = m[1].replace(/\./g, '');
    if (cleanNum) contranNums.add(cleanNum);
  }
  const leiRx = /\blei\s*(?:n[°ºo.]*\s*)?(\d+(?:\.\d+)?)\b/gi;
  while ((m = leiRx.exec(norm)) !== null) {
    const cleanNum = m[1].replace(/\./g, '');
    if (cleanNum && cleanNum.length >= 3) lawNums.add(cleanNum);
  }
  return { contranNums, lawNums };
}

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
  const leafWithoutParens = leafRaw
    .replace(/\([^)]*(?:art|arts|lei|ctb|decreto|cf|resoluc)[^)]*\)/gi, '')
    .trim();
  const specificRaw = specificSegments.length > 0 ? specificSegments.join(' ') : (question.topic || '');
  const leafNorm = normalizeCourseIndexKey(leafWithoutParens || leafRaw)
    .replace(/^(?:capitulo|secao|titulo|modulo)\s+[ivxlcdm\d]+\s*/i, '')
    .trim();
  const specificPhrases = Array.from(new Set([
    normalizeCourseIndexKey(leafRaw),
    normalizeCourseIndexKey(leafWithoutParens),
    leafNorm,
  ].filter((p) => p && p.length >= 6)));

  const qLawNums = extractLawOrResolutionNumbers(`${qSubjectRaw} ${specificRaw}`);
  const qAllowsIntroTimestamp = /\b(?:introduc|definic|conceitos?\s+basicos?|nocoes?\s+iniciais?)\b/i.test(leafNorm);

  const qSubTokens = new Set(tokenize(qSubjectRaw));
  const specificTopicTokens = Array.from(new Set(tokenize(specificRaw)))
    .filter((tok) => !qSubTokens.has(tok) || tokenize(leafRaw).includes(tok));
  const specificTopicWordTokens = specificTopicTokens.filter((tok) => !/^\d+$/.test(tok));
  if (specificTopicWordTokens.length === 0 && qLawNums.contranNums.size === 0 && qLawNums.lawNums.size === 0) return null;

  const strongTopicTokens = specificTopicWordTokens.filter((tok) => !DOMAIN_WEAK_TOKENS.has(tok));
  const contentTokens = Array.from(new Set(tokenize(`${(question.content || '').slice(0, 320)} ${(question.teacherComment || '').slice(0, 220)}`)))
    .filter((tok) => !specificTopicWordTokens.includes(tok));

  let bestEntry = null;
  let bestTopic = null;
  let bestScore = 0;

  entries.forEach((entry) => {
    const entryTitle = cleanCourseEntryTitle(entry.title || entry.lessonTitle || '');
    const eHeaderRaw = `${entry.subject || ''} ${entry.moduleName || ''} ${entryTitle}`;
    const eSubNorm = normalizeCourseIndexKey(eHeaderRaw);
    const entryFamily = inferSubjectFamily(eHeaderRaw);
    if (qFamily && entryFamily && qFamily !== entryFamily) return;

    const eLawNums = extractLawOrResolutionNumbers(`${entry.moduleName || ''} ${entryTitle}`);
    if (qLawNums.contranNums.size > 0 && eLawNums.contranNums.size > 0) {
      const hasSharedContran = Array.from(qLawNums.contranNums).some((n) => eLawNums.contranNums.has(n));
      if (!hasSharedContran) return;
    }
    const sharedContran = qLawNums.contranNums.size > 0 && Array.from(qLawNums.contranNums).some((n) => eLawNums.contranNums.has(n));
    const sharedLawNum = qLawNums.lawNums.size > 0 && Array.from(qLawNums.lawNums).some((n) => eLawNums.lawNums.has(n));

    const sameDiscipline = Boolean(
      (qFamily && entryFamily && qFamily === entryFamily) ||
      (qSubNorm && eSubNorm && (eSubNorm.includes(qSubNorm) || qSubNorm.includes(eSubNorm)))
    );

    const entryTitleNorm = normalizeCourseIndexKey(entryTitle);
    const entryTitleBaseNorm = normalizeCourseIndexKey(stripLessonPartSuffix(entryTitle));
    const titlePhraseMatch = specificPhrases.some((p) => (
      entryTitleNorm.includes(p) ||
      (entryTitleBaseNorm && (entryTitleBaseNorm.includes(p) || (entryTitleBaseNorm.length >= 7 && p.includes(entryTitleBaseNorm)))) ||
      (entryTitleNorm.length >= 8 && p.includes(entryTitleNorm))
    ));
    const entryTitleTokenSet = new Set(tokenize(`${entryTitle} ${entry.moduleName || ''}`));
    const entryTitleMatch = collectTokenMatches(specificTopicWordTokens, entryTitleTokenSet);
    const entryTitleStrongMatch = collectTokenMatches(strongTopicTokens, entryTitleTokenSet);
    const partNum = extractPartNumber(entryTitle);
    const partTieBias = partNum === 1 ? 0.45 : (partNum < 99 ? Math.max(0, 0.35 - partNum * 0.05) : 0.15);

    const topicsList = (Array.isArray(entry.topics) && entry.topics.length > 0)
      ? entry.topics
      : parseTimestampTopicsFromText(entry.indiceRawText || entry.rawIndexText || '');

    let matchedInsideTopics = false;

    if (topicsList.length > 0) {
      topicsList.forEach((tp) => {
        if (!tp || !tp.label) return;
        const tLabelNorm = normalizeCourseIndexKey(tp.label);
        if (!tLabelNorm || GENERIC_TIMESTAMP_LABEL_RX.test(tLabelNorm)) return;
        if (!qAllowsIntroTimestamp && Number(tp.seconds) <= 15 && INTRO_PREFIX_AT_START_RX.test(tLabelNorm)) return;

        const tLabelTokenSet = new Set(tokenize(tp.label));
        if (tLabelTokenSet.size === 0) return;

        const labelPhraseMatch = specificPhrases.some((p) => (
          tLabelNorm.includes(p) || (tLabelNorm.length >= 8 && p.includes(tLabelNorm))
        ));
        const labelMatch = collectTokenMatches(specificTopicWordTokens, tLabelTokenSet);
        const labelStrongMatch = collectTokenMatches(strongTopicTokens, tLabelTokenSet);
        const contentMatchOnLabel = collectTokenMatches(contentTokens, tLabelTokenSet);

        let qualified = false;
        if (strongTopicTokens.length > 0) {
          qualified = Boolean(
            labelPhraseMatch ||
            (titlePhraseMatch && (labelStrongMatch.hits >= 1 || contentMatchOnLabel.hits >= 2)) ||
            (sameDiscipline && entryTitleStrongMatch.hits >= 1 && contentMatchOnLabel.hits >= 2) ||
            labelStrongMatch.hits >= 2 ||
            (labelStrongMatch.hits === 1 && (labelMatch.hits >= 2 || entryTitleMatch.hits >= 1 || contentMatchOnLabel.hits >= 1))
          );
        } else {
          const weakCoverage = specificTopicWordTokens.length > 0 ? (labelMatch.hits / specificTopicWordTokens.length) : 0;
          qualified = Boolean(
            labelPhraseMatch ||
            sharedContran ||
            sharedLawNum ||
            (titlePhraseMatch && (labelMatch.hits >= 1 || contentMatchOnLabel.hits >= 2)) ||
            (labelMatch.hits >= 2 && weakCoverage >= 0.6)
          );
        }
        if (!qualified) return;

        matchedInsideTopics = true;
        const score =
          (sharedContran ? 18 : 0) +
          (sharedLawNum ? 10 : 0) +
          (labelPhraseMatch ? 14 : 0) +
          (titlePhraseMatch ? 6 : 0) +
          labelStrongMatch.hits * 6 +
          entryTitleStrongMatch.hits * 3 +
          labelMatch.hits * 2 +
          entryTitleMatch.hits * 1.5 +
          Math.min(contentMatchOnLabel.hits, 3) * 2.2 +
          (sameDiscipline ? 1.5 : 0) +
          (Number(tp.seconds) > 0 ? 0.5 : 0) +
          partTieBias;

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
          titlePhraseMatch ||
          (entryTitleStrongMatch.hits >= 1 && entryTitleMatch.hits >= 2) ||
          (entryTitleStrongMatch.hits >= 1 && entryTitleStrongMatch.maxLen >= 6 && sameDiscipline && (contentMatchOnTitle.hits >= 1 || entryTitleStrongMatch.maxLen >= 7))
        );
      } else {
        const weakTitleCoverage = specificTopicWordTokens.length > 0 ? (entryTitleMatch.hits / specificTopicWordTokens.length) : 0;
        qualifiedLessonOnly = Boolean(
          titlePhraseMatch ||
          (entryTitleMatch.hits >= 2 && weakTitleCoverage >= 0.6)
        );
      }
      if (qualifiedLessonOnly) {
        const lessonScore =
          (sharedContran ? 18 : 0) +
          (sharedLawNum ? 10 : 0) +
          (titlePhraseMatch ? 12 : 0) +
          entryTitleStrongMatch.hits * 5 +
          entryTitleMatch.hits * 2 +
          Math.min(contentMatchOnTitle.hits, 2) * 1.5 +
          (sameDiscipline ? 1.5 : 0) -
          (entry.isFallbackSubjectLesson ? 0.5 : 0) +
          partTieBias;
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
  const lessonTitle = cleanCourseEntryTitle(bestEntry.title || bestEntry.lessonTitle || 'Aula do Caveira');
  const cleanBaseUrl = sanitizeCourseBaseUrl(bestEntry.url);
  let targetUrl = appendTimestampToUrl(cleanBaseUrl, seconds);
  if (lessonTitle) {
    const cleanUrl = String(targetUrl).split('#')[0];
    const subjectHint = question.canonicalSubject || question.subject || bestEntry.subject || '';
    targetUrl = `${cleanUrl}#qg_lesson=${encodeURIComponent(lessonTitle)}${subjectHint ? `&qg_subject=${encodeURIComponent(subjectHint)}` : ''}${seconds > 0 ? `&qg_t=${seconds}` : ''}`;
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
