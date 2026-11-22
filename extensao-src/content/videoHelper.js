// Helpers de velocidade por disciplina e duração de videoaulas (v3.1.0)
import { normalizeFilterText } from './utils.js';

export function resolveSubjectSpeedForContext(cachedSubjectSpeeds, contextTitle = '', inferSubjectFn = null) {
  if (!cachedSubjectSpeeds || typeof cachedSubjectSpeeds !== 'object') return 1;
  const normCtx = normalizeFilterText(contextTitle);
  const inferred = typeof inferSubjectFn === 'function' ? (inferSubjectFn([contextTitle], contextTitle) || '') : '';
  const normInf = normalizeFilterText(inferred);
  for (const [subName, spd] of Object.entries(cachedSubjectSpeeds)) {
    const sNorm = normalizeFilterText(subName);
    if (!sNorm) continue;
    if (
      (normInf && (sNorm === normInf || sNorm.includes(normInf) || normInf.includes(sNorm))) ||
      (normCtx && (normCtx.includes(sNorm) || sNorm.includes(normCtx)))
    ) {
      const num = Number(spd);
      if (Number.isFinite(num) && num >= 0.5 && num <= 4) return num;
    }
  }
  return 1;
}
