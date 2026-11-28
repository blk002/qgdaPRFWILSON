// Seletor de Questão-Espelho (#8) — ranqueia candidatas do mesmo subtópico e mesma pegadinha Cebraspe
import { detectTrapTermsInText } from './cebraspeTraps.js';
import { normalizeFilterText } from './utils.js';

const MIRROR_STOP_WORDS = new Set([
  'para', 'como', 'sobre', 'entre', 'apos', 'antes', 'contra', 'desde', 'durante',
  'mediante', 'perante', 'segundo', 'conforme', 'acerca', 'quanto', 'mesmo', 'mesma',
  'ainda', 'outro', 'outra', 'outros', 'outras', 'todos', 'todas', 'qualquer',
  'nenhum', 'nenhuma', 'julgue', 'item', 'proximo', 'seguinte', 'subsequente',
  'relativo', 'respeito', 'acordo', 'termos', 'situacao', 'correto', 'errado', 'certo'
]);

function extractLeafSubtopic(q) {
  const path = String(q?.subtopicPath || q?.topic || '');
  const parts = path.split(/->|➔|›|>/).map((s) => s.trim()).filter(Boolean);
  return normalizeFilterText(q?.subtopic || parts[parts.length - 1] || '');
}

function extractSigTokens(text) {
  return new Set(
    normalizeFilterText(text)
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !MIRROR_STOP_WORDS.has(w))
  );
}

export function pickBestMirrorCandidate(missedQuestion, candidates = [], answeredIdSet = new Set()) {
  if (!missedQuestion || !Array.isArray(candidates) || candidates.length === 0) return null;

  const missedCode = String(missedQuestion.id || '').toUpperCase();
  const missedApiId = Number(missedQuestion.apiId || String(missedQuestion.id || '').replace(/^Q/i, '')) || 0;
  const missedLeaf = extractLeafSubtopic(missedQuestion);
  const missedBanca = normalizeFilterText(missedQuestion.banca || '');
  const missedTraps = new Set(detectTrapTermsInText(missedQuestion.content || '').map((t) => t.id));
  const missedTokens = extractSigTokens(missedQuestion.content || '');

  let best = null;

  for (const cand of candidates) {
    if (!cand) continue;
    const candApiId = Number(cand.apiId || cand.id) || 0;
    const candCode = String(cand.code || (candApiId ? `Q${candApiId}` : '')).toUpperCase();
    if (!candCode && !candApiId) continue;
    if (missedCode && candCode === missedCode) continue;
    if (missedApiId && candApiId === missedApiId) continue;
    if (answeredIdSet && (answeredIdSet.has(candCode) || (candApiId && answeredIdSet.has(`Q${candApiId}`)))) continue;

    const candLeaf = extractLeafSubtopic(cand);
    const sameSubtopic = Boolean(missedLeaf && candLeaf && (candLeaf === missedLeaf || candLeaf.includes(missedLeaf) || missedLeaf.includes(candLeaf)));

    const candTrapList = detectTrapTermsInText(cand.content || '');
    const sharedTraps = candTrapList.filter((t) => missedTraps.has(t.id)).map((t) => t.label);

    const candTokens = extractSigTokens(cand.content || '');
    let sharedTokenCount = 0;
    for (const tok of missedTokens) {
      if (candTokens.has(tok)) sharedTokenCount += 1;
    }

    const candBanca = normalizeFilterText(cand.banca || '');
    const sameBanca = Boolean(missedBanca && candBanca && candBanca === missedBanca);

    const score =
      (sameSubtopic ? 14 : 0) +
      sharedTraps.length * 10 +
      Math.min(sharedTokenCount, 5) * 3 +
      (sameBanca ? 2 : 0) +
      (cand.content ? 1 : 0);

    if (!best || score > best.score) {
      best = {
        candidate: {
          ...cand,
          id: candCode || `Q${candApiId}`,
          apiId: candApiId || Number(String(candCode).replace(/^Q/i, '')) || null,
        },
        sharedTraps,
        sameSubtopic,
        score,
      };
    }
  }

  return best;
}
