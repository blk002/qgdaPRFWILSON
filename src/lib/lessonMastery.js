import {
  normalizeLessonTitleKey,
  stripLessonLeadingPrefix,
  canonicalizeLessonPhrase,
} from './caveiraLessonLinks.js';
import { sanitizeDifficultyIds } from './caveiraDifficulty.js';

export const INITIAL_FIXATION_TARGET = 10;
export const INITIAL_FIXATION_DIFFICULTY_ID = 2; // Muito fácil
export const PROGRESSIVE_REVIEW_TARGET = 5;
export const FIRST_REVIEW_DIFFICULTY_ID = 3; // Fácil
export const MAX_DIFFICULTY_ID = 6; // Muito difícil
export const LEVEL_UP_MIN_INTERVALS = {
  3: 3,
  4: 7,
  5: 14,
  6: 30,
};

const ROMAN_PART_MAP = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
};

const LEGAL_OR_STRUCTURAL_BEFORE_NUM_RE =
  /\b(?:art|artigo|lei|decreto|resolucao|sumula|inciso|paragrafo|titulo|capitulo|secao|anexo|aula|modulo|bloco)\s*$/i;

function cleanRawLessonTitle(rawTitle = '') {
  return String(rawTitle || '')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\bconclu[íi]d[oa]s?\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractLessonSeriesInfo(rawTitle = '') {
  const cleaned = cleanRawLessonTitle(rawTitle);
  if (!cleaned) {
    return {
      rawTitle: String(rawTitle || ''),
      seriesBaseKey: '',
      displayTitle: '',
      partNum: null,
      hasExplicitPart: false,
    };
  }

  let partNum = null;
  let hasExplicitPart = false;
  let withoutMarker = cleaned;

  const explicitNumRe = /(?:[-–—:|(\s]|^)(?:parte|pt\.?|bloco)\s*0*(\d{1,2})\b\)?/i;
  const explicitRomanRe = /(?:[-–—:|(\s]|^)(?:parte|pt\.?|bloco)\s*(viii|vii|vi|iv|v|iii|ii|i)\b\)?/i;

  const mNum = cleaned.match(explicitNumRe);
  if (mNum) {
    const parsed = Number(mNum[1]);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 20) {
      partNum = parsed;
      hasExplicitPart = true;
      withoutMarker = cleaned.replace(explicitNumRe, ' ').replace(/[-–—:|()\s]+$/g, '').trim();
    }
  } else {
    const mRom = cleaned.match(explicitRomanRe);
    if (mRom) {
      const parsed = ROMAN_PART_MAP[String(mRom[1] || '').toLowerCase()];
      if (parsed) {
        partNum = parsed;
        hasExplicitPart = true;
        withoutMarker = cleaned.replace(explicitRomanRe, ' ').replace(/[-–—:|()\s]+$/g, '').trim();
      }
    }
  }

  if (partNum !== null) {
    const seriesBaseKey =
      canonicalizeLessonPhrase(withoutMarker) || normalizeLessonTitleKey(withoutMarker);
    return {
      rawTitle: String(rawTitle || ''),
      seriesBaseKey,
      displayTitle: withoutMarker || cleaned,
      partNum,
      hasExplicitPart,
    };
  }

  const stripped = stripLessonLeadingPrefix(cleaned);
  if (stripped) {
    const mEndRoman = stripped.match(/^(.*?)\s+(viii|vii|vi|iv|v|iii|ii|i)$/i);
    if (mEndRoman) {
      const prefix = mEndRoman[1].trim();
      const parsed = ROMAN_PART_MAP[String(mEndRoman[2] || '').toLowerCase()];
      if (prefix.length >= 3 && parsed && !LEGAL_OR_STRUCTURAL_BEFORE_NUM_RE.test(prefix)) {
        const seriesBaseKey = canonicalizeLessonPhrase(prefix) || normalizeLessonTitleKey(prefix);
        const displayTitle = cleaned
          .replace(/(?:[-–—:|(\s]+)(?:viii|vii|vi|iv|v|iii|ii|i)\)?$/i, '')
          .trim();
        return {
          rawTitle: String(rawTitle || ''),
          seriesBaseKey,
          displayTitle: displayTitle || cleaned,
          partNum: parsed,
          hasExplicitPart: false,
        };
      }
    }

    const mEndNum = stripped.match(/^(.*?)\s+0*(\d{1,2})$/);
    if (mEndNum) {
      const prefix = mEndNum[1].trim();
      const parsed = Number(mEndNum[2]);
      if (
        prefix.length >= 3 &&
        Number.isInteger(parsed) &&
        parsed >= 1 &&
        parsed <= 20 &&
        !LEGAL_OR_STRUCTURAL_BEFORE_NUM_RE.test(prefix)
      ) {
        const seriesBaseKey = canonicalizeLessonPhrase(prefix) || normalizeLessonTitleKey(prefix);
        const displayTitle = cleaned
          .replace(/(?:[-–—:|(\s]+)0*\d{1,2}\)?$/i, '')
          .trim();
        return {
          rawTitle: String(rawTitle || ''),
          seriesBaseKey,
          displayTitle: displayTitle || cleaned,
          partNum: parsed,
          hasExplicitPart: false,
        };
      }
    }
  }

  const seriesBaseKey = canonicalizeLessonPhrase(cleaned) || normalizeLessonTitleKey(cleaned);
  return {
    rawTitle: String(rawTitle || ''),
    seriesBaseKey,
    displayTitle: cleaned,
    partNum: null,
    hasExplicitPart: false,
  };
}

export function makeLessonSeriesKey(subjectId = '', topicIdOrName = '', seriesBaseKey = '') {
  const subPart = String(subjectId || '').trim();
  const topPart = normalizeLessonTitleKey(topicIdOrName || '');
  const basePart = normalizeLessonTitleKey(seriesBaseKey || '');
  return `${subPart}::${topPart}::${basePart}`;
}

function belongsToSameSeries(infoA, infoB) {
  return Boolean(
    infoA?.seriesBaseKey &&
      infoA.seriesBaseKey.length >= 3 &&
      infoA.seriesBaseKey === infoB?.seriesBaseKey &&
      (infoA.partNum !== null || infoB?.partNum !== null)
  );
}

export function analyzeLessonFixationRequirement(
  topic,
  startIdx = 0,
  amount = 1,
  existingProgressiveReviews = [],
  subjectId = ''
) {
  const safeStart = Math.max(0, Math.floor(Number(startIdx) || 0));
  const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
  const reviews = Array.isArray(existingProgressiveReviews) ? existingProgressiveReviews : [];
  const lessons = Array.isArray(topic?.lessons) ? topic.lessons : [];
  const topicIdentifier = topic?.id || topic?.name || '';

  if (lessons.length === 0) {
    const title = `${topic?.name || 'Aula'} - Aula ${safeStart + 1}`;
    const info = extractLessonSeriesInfo(title);
    const seriesKey = makeLessonSeriesKey(
      subjectId,
      topicIdentifier,
      info.seriesBaseKey || normalizeLessonTitleKey(title)
    );
    const alreadyFixated = reviews.some((r) => r?.seriesKey === seriesKey);
    const seriesItem = {
      seriesKey,
      title: info.displayTitle || title,
      lessonNames: [title],
      partCount: 1,
      alreadyFixated,
    };
    return {
      requiresFixation: !alreadyFixated,
      isIntermediatePartOnly: false,
      intermediateInfo: null,
      finishedSeries: [seriesItem],
      primarySeries: seriesItem,
      alreadyFixated,
    };
  }

  const endIdx = Math.min(lessons.length - 1, safeStart + safeAmount - 1);
  if (safeStart >= lessons.length) {
    return {
      requiresFixation: false,
      isIntermediatePartOnly: false,
      intermediateInfo: null,
      finishedSeries: [],
      primarySeries: null,
      alreadyFixated: false,
    };
  }

  const infos = lessons.map((l, idx) =>
    extractLessonSeriesInfo(l?.name || `${topic?.name || 'Aula'} - Aula ${idx + 1}`)
  );

  const finishedMap = new Map();
  let intermediateInfo = null;

  for (let i = safeStart; i <= endIdx; i++) {
    const curInfo = infos[i];
    const seriesIndices = [];
    for (let j = 0; j < infos.length; j++) {
      if (i === j || belongsToSameSeries(curInfo, infos[j])) {
        seriesIndices.push(j);
      }
    }

    const maxSeriesIdx = Math.max(...seriesIndices);
    if (seriesIndices.length > 1 && maxSeriesIdx > endIdx) {
      const posInSeries = seriesIndices.indexOf(i) + 1;
      intermediateInfo = {
        currentPart: curInfo.partNum || posInSeries,
        totalParts: seriesIndices.length,
        remainingParts: seriesIndices.filter((idx) => idx > endIdx).length,
        seriesTitle: curInfo.displayTitle || curInfo.rawTitle,
      };
      continue;
    }

    const seriesBase =
      curInfo.seriesBaseKey || normalizeLessonTitleKey(curInfo.rawTitle) || `aula_${i + 1}`;
    const seriesKey = makeLessonSeriesKey(subjectId, topicIdentifier, seriesBase);
    if (!finishedMap.has(seriesKey)) {
      const lessonNames = seriesIndices.map((idx) => lessons[idx]?.name).filter(Boolean);
      const alreadyFixated = reviews.some((r) => r?.seriesKey === seriesKey);
      finishedMap.set(seriesKey, {
        seriesKey,
        title: curInfo.displayTitle || lessonNames[0] || curInfo.rawTitle,
        lessonNames,
        partCount: seriesIndices.length,
        alreadyFixated,
      });
    }
  }

  const finishedSeries = Array.from(finishedMap.values());
  const requiresFixation = finishedSeries.some((s) => !s.alreadyFixated);
  const isIntermediatePartOnly = finishedSeries.length === 0 && Boolean(intermediateInfo);
  const alreadyFixated = finishedSeries.length > 0 && finishedSeries.every((s) => s.alreadyFixated);
  const primarySeries = finishedSeries.find((s) => !s.alreadyFixated) || finishedSeries[0] || null;

  return {
    requiresFixation,
    isIntermediatePartOnly,
    intermediateInfo,
    finishedSeries,
    primarySeries,
    alreadyFixated,
  };
}

export function getExpandedDifficultyIds(currentIds = [], baseId = INITIAL_FIXATION_DIFFICULTY_ID) {
  const safeBase =
    Number.isInteger(Number(baseId)) && Number(baseId) >= 2 && Number(baseId) <= MAX_DIFFICULTY_ID
      ? Number(baseId)
      : INITIAL_FIXATION_DIFFICULTY_ID;
  const cur = sanitizeDifficultyIds(currentIds).filter((n) => n >= 2);
  const active = cur.length > 0 ? [...cur] : [safeBase];

  if (safeBase === 2) {
    for (const candidate of [2, 3, 4, 5, 6]) {
      if (!active.includes(candidate)) {
        active.push(candidate);
        break;
      }
    }
    return sanitizeDifficultyIds(active);
  }

  if (safeBase === MAX_DIFFICULTY_ID) {
    for (const candidate of [6, 5, 4, 3, 2]) {
      if (!active.includes(candidate)) {
        active.push(candidate);
        break;
      }
    }
    return sanitizeDifficultyIds(active);
  }

  const candidates = [];
  for (let delta = 1; delta <= 4; delta++) {
    if (safeBase - delta >= 2) candidates.push(safeBase - delta);
    if (safeBase + delta <= MAX_DIFFICULTY_ID) candidates.push(safeBase + delta);
  }
  for (const candidate of candidates) {
    if (!active.includes(candidate)) {
      active.push(candidate);
      break;
    }
  }
  return sanitizeDifficultyIds(active);
}

export function addDaysToLocalDateStr(baseDateStr = '', days = 1) {
  const safeDays = Math.round(Number(days) || 0);
  let base;
  if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    const [y, m, d] = baseDateStr.split('-').map(Number);
    base = new Date(y, m - 1, d + safeDays);
  } else {
    const now = new Date();
    base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + safeDays);
  }
  const yy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function computeNextProgressiveReviewState(
  review,
  { hits = 0, total = 0, todayDateStr = '', updateFsrsCardFn = null } = {}
) {
  const safeHits = Math.max(0, Number(hits) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);
  const passed = safeTotal > 0 && safeHits === safeTotal;
  const prevDiff =
    Number.isInteger(Number(review?.currentDifficultyId)) &&
    Number(review.currentDifficultyId) >= 2 &&
    Number(review.currentDifficultyId) <= MAX_DIFFICULTY_ID
      ? Number(review.currentDifficultyId)
      : FIRST_REVIEW_DIFFICULTY_ID;

  let leveledUp = false;
  let nextDifficultyId = prevDiff;
  let mastered = Boolean(review?.mastered);
  let nextInterval = 1;
  let fsrs = null;

  if (passed) {
    leveledUp = prevDiff < MAX_DIFFICULTY_ID;
    nextDifficultyId = leveledUp ? prevDiff + 1 : MAX_DIFFICULTY_ID;
    mastered = Boolean(review?.mastered || (!leveledUp && prevDiff >= MAX_DIFFICULTY_ID));
    fsrs = typeof updateFsrsCardFn === 'function' ? updateFsrsCardFn(review, 4) : null;
    const minInterval = LEVEL_UP_MIN_INTERVALS[nextDifficultyId] || 7;
    nextInterval = Math.max(minInterval, Number(fsrs?.nextInterval) || minInterval);
  } else {
    leveledUp = false;
    nextDifficultyId = prevDiff;
    mastered = false;
    fsrs = typeof updateFsrsCardFn === 'function' ? updateFsrsCardFn(review, 1) : null;
    nextInterval = 1;
  }

  const nextDateStr = addDaysToLocalDateStr(todayDateStr, nextInterval);
  const history = Array.isArray(review?.history) ? [...review.history] : [];
  history.push({
    date: todayDateStr || addDaysToLocalDateStr('', 0),
    difficultyId: prevDiff,
    hits: safeHits,
    total: safeTotal,
    passed,
  });

  const updatedReview = {
    ...review,
    currentDifficultyId: nextDifficultyId,
    targetQuestions: Number(review?.targetQuestions) || PROGRESSIVE_REVIEW_TARGET,
    mastered,
    stability: fsrs?.stability ?? review?.stability ?? 1,
    difficulty: fsrs?.difficulty ?? review?.difficulty ?? 5,
    interval: nextInterval,
    nextDateStr,
    lastReviewDate: todayDateStr || addDaysToLocalDateStr('', 0),
    lastPerformance: safeTotal > 0 ? safeHits / safeTotal : 0,
    history: history.slice(-15),
    updatedAt: Date.now(),
  };

  return {
    updatedReview,
    passed,
    leveledUp,
    previousDifficultyId: prevDiff,
    nextDifficultyId,
    nextInterval,
    nextDateStr,
    newlyMastered: Boolean(!review?.mastered && mastered),
  };
}

/**
 * Serializa uma missão ativa removendo callbacks ou valores não-clonáveis
 * (ex: `lessonContext.onConfirmed`) antes de trafegar por `window.postMessage`.
 */
export function serializeMissionForBridge(mission) {
  if (!mission || typeof mission !== 'object') return null;

  const { lessonContext, finishedSeries, ...rest } = mission;
  const serialized = { ...rest };

  if (Array.isArray(finishedSeries)) {
    serialized.finishedSeries = finishedSeries.map((item) => ({
      seriesKey: String(item?.seriesKey || ''),
      title: String(item?.title || ''),
      lessonNames: Array.isArray(item?.lessonNames) ? item.lessonNames.map(String).filter(Boolean) : [],
      partCount: Number.isFinite(Number(item?.partCount)) ? Number(item.partCount) : 1,
      alreadyFixated: Boolean(item?.alreadyFixated),
    }));
  }

  if (lessonContext && typeof lessonContext === 'object') {
    const { onConfirmed: _ignoredOnConfirmed, ...safeCtx } = lessonContext;
    const cleanCtx = {};
    for (const [key, val] of Object.entries(safeCtx)) {
      if (typeof val !== 'function' && val !== undefined) {
        cleanCtx[key] = val;
      }
    }
    serialized.lessonContext = cleanCtx;
  }

  return serialized;
}

export function getMissionRevisionTs(mission) {
  if (!mission || typeof mission !== 'object') return 0;
  return Math.max(Number(mission.updatedAt) || 0, Number(mission.startedAt) || 0);
}

export function isMissionNewerThan(candidate, current) {
  if (!candidate || !candidate.id) return false;
  if (!current || !current.id) return true;
  if (String(candidate.id) === String(current.id)) return false;

  const candTs = getMissionRevisionTs(candidate);
  const curTs = getMissionRevisionTs(current);
  if (candTs !== curTs) return candTs > curTs;

  const candStart = Number(candidate.startedAt) || 0;
  const curStart = Number(current.startedAt) || 0;
  if (candStart !== curStart) return candStart > curStart;

  return String(candidate.id) > String(current.id);
}

export function getMissionSyncSignature(mission) {
  if (!mission || !mission.id) return '';
  const answered = Array.isArray(mission.answeredQuestionIds)
    ? Array.from(new Set(mission.answeredQuestionIds.map(String))).sort().join(',')
    : '';
  const diffs = Array.isArray(mission.activeDifficultyIds)
    ? Array.from(new Set(mission.activeDifficultyIds.map(Number).filter(Number.isFinite)))
        .sort((a, b) => a - b)
        .join(',')
    : '';
  return [
    String(mission.id),
    mission.status || 'active',
    Number(mission.hits) || 0,
    Number(mission.errors) || 0,
    answered,
    diffs,
    Number(mission.targetCount) || 0,
  ].join('|');
}
