// Guardas de memória de correções do filtro (#10) e verificação de URL aplicada (#12)

export function hasSelectionChanged(proposed, applied) {
  if (!applied || !applied.subjectId || !Array.isArray(applied.ids) || applied.ids.length === 0) {
    return false;
  }
  // Se o resolver não propôs uma seleção automática (ex: confiança baixa / ambíguo / memória ausente), a escolha manual é uma correção válida
  if (!proposed || !proposed.subjectId || !Array.isArray(proposed.ids) || proposed.ids.length === 0) {
    return true;
  }
  if (Number(proposed.subjectId) !== Number(applied.subjectId)) {
    return true;
  }
  const sortUnique = (arr) => Array.from(new Set(arr.map(Number).filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);
  const pIds = sortUnique(proposed.ids);
  const aIds = sortUnique(applied.ids);
  if (pIds.length !== aIds.length) return true;
  for (let i = 0; i < pIds.length; i += 1) {
    if (pIds[i] !== aIds[i]) return true;
  }
  return false;
}

export function verifyUrlFilterApplied({ expectedSubjectId, expectedIds, urlSearch = '', appliedDom = null } = {}) {
  if (!expectedSubjectId || !Array.isArray(expectedIds) || expectedIds.length === 0) {
    return { honored: true, reason: 'none-expected' };
  }

  let urlSubj = 0;
  let urlIds = [];
  try {
    const params = new URLSearchParams(urlSearch || '');
    urlSubj = Number(String(params.get('subject_ids') || '').split(',')[0] || 0);
    urlIds = String(params.get('subtopic_ids') || '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch (_) {}

  const urlHasSubject = urlSubj === Number(expectedSubjectId);
  const expectedSet = new Set(expectedIds.map(Number));
  const urlHasAnyTopic = urlIds.some((id) => expectedSet.has(id));

  if (!urlHasSubject || !urlHasAnyTopic) {
    return {
      honored: false,
      reason: 'url-params-dropped',
      detail: 'O site removeu os parâmetros subject_ids/subtopic_ids da URL ao carregar.',
    };
  }

  if (appliedDom) {
    const hasDisciplinaDom = Boolean(appliedDom.disciplina && appliedDom.disciplina.trim());
    const hasAssuntoDom = Array.isArray(appliedDom.assuntos) && appliedDom.assuntos.length > 0;
    if (!hasDisciplinaDom && !hasAssuntoDom) {
      return {
        honored: false,
        reason: 'dom-filters-empty',
        detail: 'URL contém os IDs, mas os campos Disciplina/Assunto do Caveira parecem vazios.',
      };
    }
  }

  return { honored: true, reason: 'ok' };
}
