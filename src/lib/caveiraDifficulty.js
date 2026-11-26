/**
 * Níveis oficiais de dificuldade do Projeto Caveira (difficulty_ids),
 * definidos pela taxa global de acertos na plataforma em faixas de 20%.
 */
export const CAVEIRA_DIFFICULTY_LEVELS = [
  { id: 2, label: 'Muito fácil', shortLabel: 'M. fácil', rateLabel: '80–100%', tone: 'emerald' },
  { id: 3, label: 'Fácil', shortLabel: 'Fácil', rateLabel: '60–79%', tone: 'sky' },
  { id: 4, label: 'Médio', shortLabel: 'Médio', rateLabel: '40–59%', tone: 'amber' },
  { id: 5, label: 'Difícil', shortLabel: 'Difícil', rateLabel: '20–39%', tone: 'orange' },
  { id: 6, label: 'Muito difícil', shortLabel: 'M. difícil', rateLabel: '< 20%', tone: 'rose' },
];

export const CAVEIRA_UNDEFINED_DIFFICULTY = {
  id: 1,
  label: 'Em definição',
  rateLabel: 'Novas',
};

export const VALID_EXAM_BOARDS = ['cebraspe', 'caveira_ineditas', 'caveira_adaptadas'];
export const VALID_QUESTION_STATUSES = ['not_resolved', 'wrong', 'right', 'resolved', ''];
export const VALID_NUMBER_ALTERNATIVES = [2, 4, 5];

export const DEFAULT_CAVEIRA_QUESTION_PREFS = {
  difficultyMode: 'manual',
  difficultyIds: [],
  includeUndefined: false,
  status: 'not_resolved',
  examBoards: ['cebraspe', 'caveira_ineditas', 'caveira_adaptadas'],
  numberAlternatives: [2],
  lessonFixationRequired: true,
  updatedAt: 0,
};

const LEVEL_MAP = new Map([
  ...CAVEIRA_DIFFICULTY_LEVELS.map((l) => [l.id, l]),
  [CAVEIRA_UNDEFINED_DIFFICULTY.id, CAVEIRA_UNDEFINED_DIFFICULTY],
]);

export function sanitizeDifficultyIds(list) {
  const out = [];
  for (const v of Array.isArray(list) ? list : []) {
    const n = Number(v);
    if (Number.isInteger(n) && n >= 1 && n <= 6 && !out.includes(n)) {
      out.push(n);
    }
  }
  return out.sort((a, b) => a - b);
}

export function sanitizeCaveiraQuestionPrefs(raw, fallback = DEFAULT_CAVEIRA_QUESTION_PREFS) {
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_CAVEIRA_QUESTION_PREFS;
  const src = raw && typeof raw === 'object' ? raw : {};

  const difficultyMode = src.difficultyMode === 'auto'
    ? 'auto'
    : src.difficultyMode === 'manual'
      ? 'manual'
      : base.difficultyMode === 'auto'
        ? 'auto'
        : 'manual';

  const rawDiffs = Array.isArray(src.difficultyIds)
    ? sanitizeDifficultyIds(src.difficultyIds)
    : sanitizeDifficultyIds(base.difficultyIds);
  const difficultyIds = rawDiffs.filter((id) => id >= 2);
  const includeUndefined = typeof src.includeUndefined === 'boolean'
    ? src.includeUndefined
    : rawDiffs.includes(1)
      ? true
      : Boolean(base.includeUndefined);

  const status = typeof src.status === 'string' && VALID_QUESTION_STATUSES.includes(src.status)
    ? src.status
    : typeof base.status === 'string' && VALID_QUESTION_STATUSES.includes(base.status)
      ? base.status
      : 'not_resolved';

  const examBoards = Array.isArray(src.examBoards)
    ? Array.from(new Set(src.examBoards.map(String).filter((b) => VALID_EXAM_BOARDS.includes(b))))
    : Array.isArray(base.examBoards)
      ? Array.from(new Set(base.examBoards.map(String).filter((b) => VALID_EXAM_BOARDS.includes(b))))
      : [...DEFAULT_CAVEIRA_QUESTION_PREFS.examBoards];

  const numberAlternatives = Array.isArray(src.numberAlternatives)
    ? Array.from(new Set(src.numberAlternatives.map(Number).filter((n) => VALID_NUMBER_ALTERNATIVES.includes(n)))).sort((a, b) => a - b)
    : Array.isArray(base.numberAlternatives)
      ? Array.from(new Set(base.numberAlternatives.map(Number).filter((n) => VALID_NUMBER_ALTERNATIVES.includes(n)))).sort((a, b) => a - b)
      : [...DEFAULT_CAVEIRA_QUESTION_PREFS.numberAlternatives];

  const rawUpdated = Number(src.updatedAt);
  const updatedAt = Number.isFinite(rawUpdated) && rawUpdated >= 0
    ? rawUpdated
    : Number.isFinite(Number(base.updatedAt)) && Number(base.updatedAt) >= 0
      ? Number(base.updatedAt)
      : 0;

  const lessonFixationRequired = typeof src.lessonFixationRequired === 'boolean'
    ? src.lessonFixationRequired
    : typeof base.lessonFixationRequired === 'boolean'
      ? base.lessonFixationRequired
      : true;

  return {
    difficultyMode,
    difficultyIds,
    includeUndefined,
    status,
    examBoards,
    numberAlternatives,
    lessonFixationRequired,
    updatedAt,
  };
}

export function resolveEffectiveDifficultyIds(prefs, recommendation = null) {
  if (!prefs || typeof prefs !== 'object') return [];
  if (prefs.difficultyMode === 'auto') {
    const recId = Number(recommendation?.recommendedId);
    if (Number.isInteger(recId) && recId >= 2 && recId <= 6) {
      return sanitizeDifficultyIds(prefs.includeUndefined ? [recId, 1] : [recId]);
    }
    return [];
  }
  const base = sanitizeDifficultyIds(prefs.difficultyIds).filter((id) => id >= 2);
  if (base.length === 0) return [];
  return sanitizeDifficultyIds(prefs.includeUndefined ? [...base, 1] : base);
}

export function classifyQuestionDifficulty(q) {
  if (!q || typeof q !== 'object') return null;
  const explicitId = Number(q.difficultyId ?? q.difficulty_id);
  if (Number.isInteger(explicitId) && explicitId >= 1 && explicitId <= 6) {
    return LEVEL_MAP.get(explicitId) || null;
  }
  const pct = q.communityCorrectPct;
  if (pct !== undefined && pct !== null && pct !== '') {
    const numPct = Number(pct);
    if (Number.isFinite(numPct) && numPct >= 0 && numPct <= 100) {
      if (numPct >= 80) return LEVEL_MAP.get(2);
      if (numPct >= 60) return LEVEL_MAP.get(3);
      if (numPct >= 40) return LEVEL_MAP.get(4);
      if (numPct >= 20) return LEVEL_MAP.get(5);
      return LEVEL_MAP.get(6);
    }
  }
  return null;
}

export function formatCaveiraPrefsDifficultySummary(prefs) {
  if (!prefs || typeof prefs !== 'object') return '';
  if (prefs.difficultyMode === 'auto') return '⚡ Auto';
  return formatDifficultyIdsLabel(resolveEffectiveDifficultyIds(prefs));
}

export function formatDifficultyIdsLabel(ids) {
  return sanitizeDifficultyIds(ids)
    .map((id) => LEVEL_MAP.get(id)?.label)
    .filter(Boolean)
    .join(' + ');
}

function normalizeMatchText(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Recomenda um dos 5 níveis oficiais do Caveira (2..6) com base no histórico do aluno no Raio-X.
 */
export function recommendDifficultyForTopic(
  caveiraQuestions = [],
  subjectName = '',
  topicName = '',
  lessonNames = []
) {
  const list = Array.isArray(caveiraQuestions) ? caveiraQuestions : [];
  const normSubj = normalizeMatchText(subjectName);
  const normTargets = [topicName, ...(Array.isArray(lessonNames) ? lessonNames : [])]
    .map(normalizeMatchText)
    .filter((s) => s.length >= 4);

  const subjectMatches = normSubj
    ? list.filter((q) => {
        const qs = normalizeMatchText(q?.subject || '');
        return qs && (qs === normSubj || qs.includes(normSubj) || normSubj.includes(qs));
      })
    : [];

  const topicMatches = normTargets.length > 0
    ? (subjectMatches.length > 0 ? subjectMatches : list).filter((q) => {
        const qt = normalizeMatchText(q?.topic || q?.subtopicPath || '');
        if (!qt) return false;
        return normTargets.some((t) => qt.includes(t) || t.includes(qt));
      })
    : [];

  let pool = [];
  let scope = 'novo';
  if (topicMatches.length >= 5) {
    pool = topicMatches;
    scope = 'assunto';
  } else if (subjectMatches.length >= 5) {
    pool = subjectMatches;
    scope = 'disciplina';
  } else if (topicMatches.length > 0) {
    pool = topicMatches;
    scope = 'assunto';
  } else if (subjectMatches.length > 0) {
    pool = subjectMatches;
    scope = 'disciplina';
  }

  const sampleSize = pool.length;
  const hits = pool.filter((q) => q?.hit === true || q?.correct === true).length;
  const accuracyPct = sampleSize > 0 ? Math.round((hits / sampleSize) * 100) : null;

  let recommendedId = 2;
  if (sampleSize < 5 || accuracyPct === null || accuracyPct < 45) {
    recommendedId = 2;
  } else if (accuracyPct < 65) {
    recommendedId = 3;
  } else if (accuracyPct < 80) {
    recommendedId = 4;
  } else if (accuracyPct < 90 || sampleSize < 10) {
    recommendedId = 5;
  } else {
    recommendedId = 6;
  }

  const level = LEVEL_MAP.get(recommendedId) || CAVEIRA_DIFFICULTY_LEVELS[0];
  const scopeLabel = scope === 'disciplina' ? 'na disciplina' : 'no assunto';
  const summary =
    sampleSize === 0
      ? `Sem histórico neste tema — sugerido começar em ${level.label}.`
      : `Baseado em ${sampleSize} ${sampleSize === 1 ? 'questão' : 'questões'} (${accuracyPct}% de acerto ${scopeLabel}) → sugerido ${level.label}.`;

  return {
    recommendedId,
    level,
    sampleSize,
    accuracyPct,
    scope,
    summary,
  };
}
