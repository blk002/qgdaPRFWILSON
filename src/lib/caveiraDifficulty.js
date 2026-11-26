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
  const summary =
    sampleSize === 0
      ? `Sem histórico neste tema — sugerido começar em ${level.label}.`
      : `Baseado em ${sampleSize} ${sampleSize === 1 ? 'questão' : 'questões'} (${accuracyPct}% de acerto no ${scope}) → sugerido ${level.label}.`;

  return {
    recommendedId,
    level,
    sampleSize,
    accuracyPct,
    scope,
    summary,
  };
}
