// Helpers de velocidade por disciplina e duração de videoaulas (v3.4.6)
import { normalizeFilterText } from './utils.js';

const SUBJECT_ALIAS_FAMILIES = [
  ['lingua portuguesa', 'portugues', 'interpretacao de texto', 'gramatica'],
  ['raciocinio logico', 'matematica', 'rlm', 'estatistica'],
  ['informatica', 'tecnologia da informacao', 'ti'],
  ['fisica', 'mecanica', 'cinematica'],
  ['etica', 'etica no servico publico', 'cidadania'],
  ['geopolitica', 'atualidades', 'historia da prf'],
  ['legislacao de transito', 'transito', 'ctb', 'codigo de transito brasileiro', 'resolucoes contran', 'contran'],
  ['direito administrativo', 'administrativo', 'ato administrativo', 'licitacoes'],
  ['direito constitucional', 'constitucional', 'constituicao federal'],
  ['direito processual penal', 'processual penal', 'processo penal', 'cpp'],
  ['direito penal', 'penal', 'codigo penal'],
  ['legislacao especial', 'leis penais especiais', 'legislacao extravagante'],
  ['direitos humanos', 'direitos e garantias fundamentais'],
  ['redacao', 'discursiva', 'texto dissertativo'],
];

function clampSpeed(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0.5 || num > 4) return null;
  return Math.round(num * 100) / 100;
}

function matchesAliasTerm(text, term, family) {
  if (!text || !term) return false;
  if (family.includes('codigo penal') && (text.includes('processual') || text.includes('processo penal'))) {
    return false;
  }
  if (term.length <= 4) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(text);
  }
  return text.includes(term) || (text.length >= 5 && term.includes(text));
}

function matchAliasFamily(a, b) {
  if (!a || !b) return false;
  for (const family of SUBJECT_ALIAS_FAMILIES) {
    const aHit = family.some((term) => matchesAliasTerm(a, term, family));
    const bHit = family.some((term) => matchesAliasTerm(b, term, family));
    if (aHit && bHit) return true;
  }
  return false;
}

export function resolveSubjectSpeedForContext(
  cachedSubjectSpeeds,
  contextTitleOrList = '',
  inferSubjectFn = null,
  options = {}
) {
  const explicit = options && options.explicitSpeed !== undefined && options.explicitSpeed !== null && options.explicitSpeed !== ''
    ? clampSpeed(options.explicitSpeed)
    : null;
  if (explicit !== null) return explicit;

  const moduleSpeeds = options?.moduleSpeeds;
  const courseId = String(options?.courseId || '').trim();
  const moduleId = String(options?.moduleId || '').trim();
  if (moduleSpeeds && typeof moduleSpeeds === 'object' && courseId) {
    if (moduleId) {
      const byRoute = clampSpeed(moduleSpeeds[`${courseId}:${moduleId}`]);
      if (byRoute !== null) return byRoute;
    }
    const byCourse = clampSpeed(moduleSpeeds[`course:${courseId}`]);
    if (byCourse !== null) return byCourse;
  }

  if (!cachedSubjectSpeeds || typeof cachedSubjectSpeeds !== 'object') return 1;

  const contexts = (Array.isArray(contextTitleOrList) ? contextTitleOrList : [contextTitleOrList])
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (contexts.length === 0) return 1;

  const entries = Object.entries(cachedSubjectSpeeds)
    .map(([subName, spd]) => ({
      norm: normalizeFilterText(subName),
      speed: clampSpeed(spd),
    }))
    .filter((entry) => entry.norm && entry.speed !== null);

  if (entries.length === 0) return 1;

  for (const ctx of contexts) {
    const normCtx = normalizeFilterText(ctx);
    const inferred = typeof inferSubjectFn === 'function' ? (inferSubjectFn([ctx], ctx) || '') : '';
    const normInf = normalizeFilterText(inferred);

    // 1. Match exato ou por inferencia direta
    for (const entry of entries) {
      if (
        (normInf && (entry.norm === normInf || entry.norm.includes(normInf) || normInf.includes(entry.norm))) ||
        (normCtx && (entry.norm === normCtx || normCtx.includes(entry.norm) || entry.norm.includes(normCtx)))
      ) {
        return entry.speed;
      }
    }

    // 2. Match por familia de aliases da PRF
    for (const entry of entries) {
      if (matchAliasFamily(entry.norm, normInf) || matchAliasFamily(entry.norm, normCtx)) {
        return entry.speed;
      }
    }
  }

  return 1;
}
