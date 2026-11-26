import { normalizeCourseIndexKey } from './utils.js';

const EXCLUDED_CAVEIRA_HOST_RX = /^(?:loja|checkout|blog|pay|pagamentos?|www)\./i;

export function isExcludedCaveiraHost(hostname = '') {
  return EXCLUDED_CAVEIRA_HOST_RX.test(String(hostname || '').trim());
}

export function stripCaveiraLessonUiNoise(txt = '') {
  return String(txt || '')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(
      /\b(?:assistir|conclu[íi]d[oa]s?|novo|novos\s+conte[úu]dos?|play_arrow|play_circle|ondemand_video|smart_display|check_circle|check_box|done|task_alt|colapso)\b/gi,
      ' '
    )
    .replace(/[·•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function stripLeadingIndexPrefix(txt = '') {
  return String(txt || '')
    .replace(/^\s*(?:aula|bloco|parte|m[oó]dulo)\s*\d+\s*[-–—:|.]*\s*/i, '')
    .replace(/^\s*\d{1,3}\s*[-–—:|.]+\s*/, '')
    .trim();
}

function stripLawYearSuffixes(txt = '') {
  return String(txt || '').replace(/\b(\d{1,5}(?:\.\d{3})*)\/\d{2,4}\b/g, '$1');
}

export function extractLessonPartNum(txt = '') {
  const clean = normalizeCourseIndexKey(stripLawYearSuffixes(stripCaveiraLessonUiNoise(txt)));
  if (!clean) return '';

  const mNum = clean.match(/\b(?:parte|pt)\s*0*(\d{1,2})\b/);
  if (mNum) return String(Number(mNum[1]));

  const mRom = clean.match(/\b(?:parte|pt)\s*(viii|vii|vi|iv|v|iii|ii|i)\b/);
  if (mRom && ROMAN_PART_MAP[mRom[1]]) return ROMAN_PART_MAP[mRom[1]];

  const stripped = normalizeCourseIndexKey(
    stripLeadingIndexPrefix(stripLawYearSuffixes(stripCaveiraLessonUiNoise(txt)))
  );
  if (!stripped) return '';

  const protectedPrefixRx = /\b(?:art|artigo|lei|decreto|aula|bloco|modulo|anexo|capitulo|titulo)\s+(?:\d{1,2}|viii|vii|vi|iv|v|iii|ii|i)$/;
  if (!protectedPrefixRx.test(stripped)) {
    const mEnd = stripped.match(/\b0*(\d{1,2})$/);
    if (mEnd) return String(Number(mEnd[1]));
    const mEndRom = stripped.match(/\b(viii|vii|vi|iv|v|iii|ii|i)$/);
    if (mEndRom && ROMAN_PART_MAP[mEndRom[1]]) return ROMAN_PART_MAP[mEndRom[1]];
  }

  return '';
}

export function stemPtToken(w = '') {
  if (!w || w.length < 5) return w;
  if (/(?:oes|aes|aos)$/.test(w)) return `${w.slice(0, -3)}ao`;
  if (w.endsWith('s') && !/(?:ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

export function canonicalizeLessonText(txt = '') {
  const norm = normalizeCourseIndexKey(stripLeadingIndexPrefix(stripCaveiraLessonUiNoise(txt)))
    .replace(/\b0+(\d+)\b/g, '$1')
    .trim();
  if (!norm) return '';
  return norm
    .split(' ')
    .filter(Boolean)
    .map(stemPtToken)
    .join(' ');
}

export function scoreCaveiraLessonCandidate(candidateText = '', targetLesson = '') {
  const cleanCand = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(candidateText));
  const cleanTarget = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetLesson));
  if (!cleanCand || !cleanTarget) return 0;

  const partCand = extractLessonPartNum(candidateText);
  const partTgt = extractLessonPartNum(targetLesson);
  if (partCand !== partTgt) return 0;

  if (cleanCand === cleanTarget) return 100;

  const canonCand = canonicalizeLessonText(candidateText);
  const canonTarget = canonicalizeLessonText(targetLesson);
  if (!canonCand || !canonTarget) return 0;
  if (canonCand === canonTarget) return 95;

  if (
    (canonTarget.length >= 6 && canonCand.includes(canonTarget)) ||
    (canonCand.length >= 6 && canonTarget.includes(canonCand))
  ) {
    return 80;
  }

  const tok = (s) => s.split(' ').filter((w) => w.length >= 3 || /^\d+$/.test(w));
  const tTgt = tok(canonTarget);
  const tCand = new Set(tok(canonCand));
  if (tTgt.length === 0 || tCand.size === 0) return 0;
  const hits = tTgt.filter((w) => tCand.has(w)).length;
  const ratio = hits / Math.max(tTgt.length, tCand.size);
  return ratio >= 0.65 ? Math.round(ratio * 75) : 0;
}

const COURSE_TRACK_KEYWORDS = [
  'iniciante',
  'nivelamento',
  'isolad',
  'extensivo',
  'intensivo',
  'prf',
  'redacao',
];

export function scoreCaveiraCourseCandidate(
  courseTitle = '',
  { targetCourse = '', targetTopic = '', targetSubject = '' } = {}
) {
  const candNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(courseTitle));
  if (!candNorm) return 0;

  const queryPrimary = String(targetCourse || targetTopic || '').trim();
  const queryPart = queryPrimary ? extractLessonPartNum(queryPrimary) : '';
  const candPart = extractLessonPartNum(courseTitle);
  if (queryPart && candPart && queryPart !== candPart) {
    return 0;
  }

  const candCanon = canonicalizeLessonText(courseTitle);
  const courseNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetCourse));
  const topicNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetTopic));
  const subNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetSubject));

  let score = 0;

  if (courseNorm) {
    const courseCanon = canonicalizeLessonText(targetCourse);
    if (candNorm.includes(courseNorm) || (courseCanon && candCanon.includes(courseCanon))) {
      score += 100;
    }
  }

  if (topicNorm) {
    const topicCanon = canonicalizeLessonText(targetTopic);
    if (candNorm.includes(topicNorm) || (topicCanon && candCanon.includes(topicCanon))) {
      score += 80;
    }
  }

  const combinedQuery = queryPrimary || targetSubject;
  if (combinedQuery) {
    const qCanon = canonicalizeLessonText(combinedQuery) || normalizeCourseIndexKey(combinedQuery);
    const qTokens = qCanon.split(' ').filter((w) => w.length >= 3 || /^\d+$/.test(w));
    const cTokens = new Set((candCanon || candNorm).split(' ').filter((w) => w.length >= 3 || /^\d+$/.test(w)));
    if (qTokens.length > 0 && cTokens.size > 0) {
      const hits = qTokens.filter((t) => cTokens.has(t)).length;
      score += Math.round((hits / qTokens.length) * 70);
    }
  }

  const queryAllNorm = `${courseNorm} ${topicNorm} ${subNorm}`.trim();
  for (const kw of COURSE_TRACK_KEYWORDS) {
    if (queryAllNorm.includes(kw) && candNorm.includes(kw)) {
      score += 40;
    }
  }

  const queryIsStandalone =
    queryAllNorm.includes('iniciante') ||
    queryAllNorm.includes('isolad') ||
    queryAllNorm.includes('nivelamento');
  if (queryIsStandalone && candNorm.includes('prf') && !candNorm.includes('iniciante')) {
    score -= 40;
  }

  return Math.max(0, score);
}

export function scoreCaveiraModuleCandidate(
  moduleText = '',
  { targetSubject = '', targetTopic = '', targetLesson = '' } = {}
) {
  const cleanedModule = String(moduleText || '')
    .replace(/\b\d+\s+aulas?\b/gi, ' ')
    .replace(/\b\d+\s+conclu[íi]d[oa]s?\b/gi, ' ')
    .replace(/\bem\s+grava[çc][ãa]o\b/gi, ' ')
    .replace(/\bnovo\b/gi, ' ')
    .replace(/[,·•()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const modNorm = normalizeCourseIndexKey(cleanedModule);
  if (!modNorm) return 0;

  const modCanon = canonicalizeLessonText(cleanedModule);
  const subNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetSubject));
  const subCanon = canonicalizeLessonText(targetSubject);
  const topicNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetTopic));
  const topicCanon = canonicalizeLessonText(targetTopic);
  const lesNorm = normalizeCourseIndexKey(stripCaveiraLessonUiNoise(targetLesson));

  let score = 0;

  if (subNorm) {
    if (modNorm === subNorm || (subCanon && modCanon === subCanon)) {
      score += 100;
    } else if (
      modNorm.includes(subNorm) ||
      subNorm.includes(modNorm) ||
      (subCanon && modCanon && (modCanon.includes(subCanon) || subCanon.includes(modCanon)))
    ) {
      score += 85;
    } else {
      const sTokens = (subCanon || subNorm).split(' ').filter((w) => w.length >= 3);
      const mTokens = new Set((modCanon || modNorm).split(' ').filter((w) => w.length >= 3));
      if (sTokens.length > 0 && mTokens.size > 0) {
        const hits = sTokens.filter((t) => mTokens.has(t)).length;
        score += Math.round((hits / sTokens.length) * 75);
      }
    }
  }

  if (topicNorm) {
    if (modNorm.includes(topicNorm) || (topicCanon && modCanon.includes(topicCanon))) {
      score += 70;
    } else {
      const tTokens = (topicCanon || topicNorm).split(' ').filter((w) => w.length >= 4);
      const mTokens = new Set((modCanon || modNorm).split(' ').filter((w) => w.length >= 4));
      if (tTokens.length > 0 && mTokens.size > 0) {
        const hits = tTokens.filter((t) => mTokens.has(t)).length;
        score += Math.round((hits / tTokens.length) * 45);
      }
    }
  }

  if (lesNorm) {
    const lTokens = lesNorm.split(' ').filter((w) => w.length >= 4);
    const mTokens = new Set(modNorm.split(' ').filter((w) => w.length >= 4));
    if (lTokens.length > 0 && mTokens.size > 0) {
      const hits = lTokens.filter((t) => mTokens.has(t)).length;
      score += Math.round((hits / lTokens.length) * 40);
    }
  }

  return score;
}
