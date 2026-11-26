import { getSafeExternalUrl } from './safeUrl.js';

export function extractCourseIdFromUrl(url) {
  const match = String(url || '').match(/\/courses\/(\d+)/i);
  return match ? match[1] : '';
}

export function extractVideoIdFromUrl(url) {
  const match = String(url || '').match(/[?&]course_video_id=(\d+)/i);
  return match ? match[1] : '';
}

export function normalizeLessonTitleKey(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function stripLessonLeadingPrefix(txt) {
  return normalizeLessonTitleKey(
    String(txt || '')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
      .replace(/\bconclu[íi]d[oa]s?\b/gi, ' ')
      .replace(/^\s*(?:aula|bloco|parte|cap[ií]tulo|m[oó]dulo)\s*\d+\s*[-–—:|.]*\s*/i, '')
      .replace(/^\s*\d{1,3}\s*[-–—:|.]+\s*/, '')
      .trim()
  );
}

const ROMAN_PART_MAP = {
  i: '1',
  ii: '2',
  iii: '3',
  iv: '4',
  v: '5',
  vi: '6',
  vii: '7',
  viii: '8',
};

/**
 * Extracts the explicit "Parte N" / trailing part number from a lesson title.
 * Never confuses "Aula 02 - ..." with "Parte 2".
 */
export function extractLessonPartTag(txt) {
  const clean = normalizeLessonTitleKey(
    String(txt || '')
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
      .replace(/\bconclu[íi]d[oa]s?\b/gi, ' ')
  );
  if (!clean) return '';

  const mPartNum = clean.match(/\b(?:parte|pt)\s*0*(\d{1,2})\b/);
  if (mPartNum) return String(Number(mPartNum[1]));

  const mPartRom = clean.match(/\b(?:parte|pt)\s*(viii|vii|vi|iv|v|iii|ii|i)\b/);
  if (mPartRom && ROMAN_PART_MAP[mPartRom[1]]) {
    return ROMAN_PART_MAP[mPartRom[1]];
  }

  const stripped = stripLessonLeadingPrefix(txt);
  if (!stripped) return '';

  if (!/\b(?:art|artigo|lei|decreto|aula|bloco|modulo)\s+\d{1,2}$/.test(stripped)) {
    const mEndNum = stripped.match(/\b0*(\d{1,2})$/);
    if (mEndNum) return String(Number(mEndNum[1]));
  }

  const mEndRom = stripped.match(/\b(viii|vii|vi|iv|v|iii|ii|i)$/);
  if (mEndRom && ROMAN_PART_MAP[mEndRom[1]]) {
    return ROMAN_PART_MAP[mEndRom[1]];
  }

  return '';
}

const stemPtToken = (w) => {
  if (!w || w.length < 5) return w;
  if (/(?:oes|aes|aos)$/.test(w)) return `${w.slice(0, -3)}ao`;
  if (w.endsWith('s') && !/(?:ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
};

export function canonicalizeLessonPhrase(txt) {
  const stripped = stripLessonLeadingPrefix(txt)
    .replace(/\b0+(\d+)\b/g, '$1')
    .trim();
  if (!stripped) return '';
  return stripped
    .split(' ')
    .filter(Boolean)
    .map(stemPtToken)
    .join(' ');
}

const tokenizeLessonTitle = (txt) =>
  String(txt || '')
    .split(' ')
    .map((w) => (/^\d+$/.test(w) ? String(Number(w)) : stemPtToken(w)))
    .filter((w) => w.length >= 3 || /^\d+$/.test(w));

export function scoreLessonTitleMatch(existingName, incomingTitle) {
  const en = normalizeLessonTitleKey(existingName || '');
  const normTitle = normalizeLessonTitleKey(incomingTitle || '');
  if (!en || !normTitle) return 0;

  const partA = extractLessonPartTag(existingName);
  const partB = extractLessonPartTag(incomingTitle);
  if (partA !== partB) return 0;

  if (en === normTitle) return 100;

  const es = canonicalizeLessonPhrase(existingName);
  const strippedTitle = canonicalizeLessonPhrase(incomingTitle);
  if (strippedTitle && es && es === strippedTitle) return 95;

  const subMatch =
    (strippedTitle &&
      es &&
      ((strippedTitle.length >= 6 && es.includes(strippedTitle)) ||
        (es.length >= 6 && strippedTitle.includes(es)))) ||
    (normTitle.length >= 6 && en.includes(normTitle)) ||
    (en.length >= 6 && normTitle.includes(en));
  if (subMatch) return 80;

  const lesTokens = tokenizeLessonTitle(strippedTitle || normTitle);
  const exTokensList = tokenizeLessonTitle(es || en);
  if (lesTokens.length >= 2 && exTokensList.length >= 2) {
    const exSet = new Set(exTokensList);
    const overlap = lesTokens.filter((t) => exSet.has(t)).length;
    const ratio = overlap / Math.max(lesTokens.length, exTokensList.length);
    if (ratio >= 0.65) return Math.round(ratio * 75);
  }

  return 0;
}

export function inferSubjectFamilyKey(rawStr = '') {
  const s = normalizeLessonTitleKey(rawStr);
  if (!s) return '';
  if (/\b(?:transito|ctb|contran|9503)\b/.test(s)) return 'transito';
  if (/\b(?:processo penal|processual penal|cpp|inquerito policial|prisao)\b/.test(s)) return 'processual_penal';
  if (/\b(?:direito penal|codigo penal|teoria do crime|crimes contra)\b/.test(s)) return 'penal';
  if (/\b(?:constitucional|constituicao federal)\b/.test(s)) return 'constitucional';
  if (/\b(?:administrativo|administracao publica|improbidade|licitac|poderes administrativos|atos administrativos)\b/.test(s)) {
    return 'administrativo';
  }
  if (/\b(?:direitos humanos|pacto de san jose|dudh)\b/.test(s)) return 'direitos_humanos';
  if (/\b(?:legislacao especial|legislacao extravagante|leis especiais|eca|desarmamento|drogas|abuso de autoridade|maria da penha|tortura)\b/.test(s)) {
    return 'legislacao_especial';
  }
  if (/\b(?:portugues|lingua portuguesa|gramatica|sintaxe|morfologia|interpretacao de texto|redacao oficial|crase|regencia|concordancia)\b/.test(s)) {
    return 'portugues';
  }
  if (/\b(?:informatica|computador|redes|seguranca da informacao|linux|windows|malware|nuvem|internet)\b/.test(s)) {
    return 'informatica';
  }
  if (/\b(?:raciocinio logico|rlm|matematica|logica|probabilidade|combinatoria)\b/.test(s)) return 'rlm';
  if (/\b(?:fisica|cinematica|dinamica|energia mecanica|colisoes)\b/.test(s)) return 'fisica';
  if (/\b(?:etica|1171|cidadania)\b/.test(s)) return 'etica';
  if (/\b(?:geopolitica|geografia)\b/.test(s)) return 'geopolitica';
  if (/\b(?:redacao|discursiva)\b/.test(s)) return 'redacao';
  return '';
}

const CONTEXT_STOP_WORDS = new Set([
  'para', 'como', 'sobre', 'entre', 'com', 'sem', 'das', 'dos', 'nas', 'nos',
  'aula', 'aulas', 'parte', 'modulo', 'curso', 'nocoes', 'direito', 'geral',
  'lingua', 'portuguesa', 'portugues', 'iniciante', 'basico',
]);

function extractDistinctContextTokens(text, subjectName = '') {
  const subTokens = new Set(normalizeLessonTitleKey(subjectName).split(' ').filter((w) => w.length >= 3));
  return Array.from(
    new Set(
      normalizeLessonTitleKey(text)
        .split(' ')
        .filter((w) => w.length >= 4 && !CONTEXT_STOP_WORDS.has(w) && !subTokens.has(w))
    )
  );
}

/**
 * Resolves the exact Caveira URL for a lesson without ever falling back to
 * an unrelated course (e.g., PRF course) when the lesson belongs to an isolated course.
 */
export function resolveCaveiraLessonHref({
  lessonEntry = null,
  lessonName = '',
  topic = null,
  subject = null,
  caveiraCourseIndexMap = {},
} = {}) {
  const topicCourseId = String(topic?.caveiraCourseId || extractCourseIdFromUrl(topic?.caveiraModuleUrl) || '');
  const subjectCourseId = String(subject?.caveiraCourseId || extractCourseIdFromUrl(subject?.caveiraModuleUrl) || '');
  const topicLooksLikeStandaloneCourse = Boolean(
    topic?.name &&
    /\b(?:iniciantes?|nivelamento|curso\s+isolado|isolado|extensivo|intensivo|combo)\b/i.test(
      normalizeLessonTitleKey(topic.name)
    ) &&
    !normalizeLessonTitleKey(subject?.caveiraCourseName || '').includes(
      normalizeLessonTitleKey(topic.name).match(/\b(?:iniciantes?|nivelamento|curso\s+isolado|isolado|extensivo|intensivo|combo)\b/i)?.[0] || ''
    )
  );
  const boundCourseId = topicCourseId || (topicLooksLikeStandaloneCourse ? '' : subjectCourseId);
  const courseHintName = String(topic?.caveiraCourseName || subject?.caveiraCourseName || '').trim();

  // 1. Direct URL stored on the lesson itself (reject only if topic is explicitly bound to a different course)
  const directEntryUrl = String(lessonEntry?.caveiraUrl || lessonEntry?.url || '').trim();
  let chosenUrl = '';
  if (directEntryUrl) {
    const directCourseId = extractCourseIdFromUrl(directEntryUrl);
    if (!topicCourseId || !directCourseId || directCourseId === topicCourseId) {
      chosenUrl = directEntryUrl;
    }
  }

  // 2. Contextual lookup in caveiraCourseIndexMap
  if (!chosenUrl && lessonName) {
    const subFamily = inferSubjectFamilyKey(subject?.name || '');
    const contextText = `${topic?.name || ''} ${courseHintName}`.trim();
    const distinctCtxTokens = extractDistinctContextTokens(contextText, subject?.name || '');

    let bestEntry = null;
    let bestRank = 0;

    Object.values(caveiraCourseIndexMap || {}).forEach((entry) => {
      if (!entry || !entry.url) return;
      const entryTitle = entry.title || entry.lessonTitle || '';
      const titleScore = scoreLessonTitleMatch(lessonName, entryTitle);
      if (titleScore < 80) return;

      const entryCourseId = String(entry.courseId || extractCourseIdFromUrl(entry.url) || '');
      if (boundCourseId && entryCourseId && entryCourseId !== boundCourseId) return;

      const entryHeader = `${entry.subject || ''} ${entry.moduleName || ''} ${entry.courseName || ''}`;
      const entryFamily = inferSubjectFamilyKey(entryHeader);
      if (subFamily && entryFamily && subFamily !== entryFamily) return;

      const entryHeaderNorm = normalizeLessonTitleKey(entryHeader);
      let contextBonus = 0;
      if (distinctCtxTokens.length > 0) {
        const matchedCtx = distinctCtxTokens.filter((tok) => entryHeaderNorm.includes(tok)).length;
        if (matchedCtx > 0) {
          contextBonus = 50 + matchedCtx * 10;
        } else if (entryHeaderNorm) {
          // Entry explicitly belongs to another course/module (e.g. PRF instead of "Iniciantes")
          contextBonus = -45;
        }
      }

      const finalScore = titleScore + contextBonus;
      if (finalScore < 80) return;

      const hasVideo = extractVideoIdFromUrl(entry.url) ? 1000 : 0;
      const rank = finalScore * 10000 + hasVideo + Math.min(999, Math.floor((Number(entry.updatedAt) || 0) / 1e10));
      if (rank > bestRank) {
        bestRank = rank;
        bestEntry = entry;
      }
    });

    if (bestEntry?.url) {
      chosenUrl = bestEntry.url;
    }
  }

  // 3. Topic-level Caveira binding
  if (!chosenUrl) {
    if (topic?.caveiraModuleUrl) {
      chosenUrl = topic.caveiraModuleUrl;
    } else if (topic?.caveiraCourseId) {
      chosenUrl = `https://app.caveira.com/courses/${topic.caveiraCourseId}`;
    }
  }

  // 4. Subject-level Caveira binding (skip if topic explicitly names a standalone track/course like "Iniciantes")
  if (!chosenUrl && !topicLooksLikeStandaloneCourse) {
    if (subject?.caveiraModuleUrl) {
      chosenUrl = subject.caveiraModuleUrl;
    } else if (subject?.caveiraCourseId) {
      chosenUrl = `https://app.caveira.com/courses/${subject.caveiraCourseId}`;
    }
  }

  // 5. Neutral fallback (never cross-contaminate with another subject's courseId)
  if (!chosenUrl) {
    chosenUrl = 'https://app.caveira.com/courses';
  }

  const safeBaseUrl = getSafeExternalUrl(chosenUrl, 'https://app.caveira.com/courses');
  const cleanBase = safeBaseUrl.split('#')[0];

  if (!lessonName) {
    return cleanBase;
  }

  const params = [`qg_lesson=${encodeURIComponent(lessonName)}`];
  if (subject?.name) params.push(`qg_subject=${encodeURIComponent(subject.name)}`);
  if (topic?.name) params.push(`qg_topic=${encodeURIComponent(topic.name)}`);
  if (courseHintName) params.push(`qg_course=${encodeURIComponent(courseHintName)}`);

  return `${cleanBase}#${params.join('&')}`;
}
