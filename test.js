import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const treeMatcherCode = fs.readFileSync(new URL('./extensao PC/treeMatcher.js', import.meta.url), 'utf8');
const contentCode = fs.readFileSync(new URL('./extensao PC/content.js', import.meta.url), 'utf8');
const backgroundCode = fs.readFileSync(new URL('./extensao PC/background.js', import.meta.url), 'utf8');

vm.runInThisContext(treeMatcherCode);
const treeMatcher = globalThis.QGCaveiraTreeMatcher;

// --- 1. Testes unitários do treeMatcher (v1.3.5) ---
assert.deepEqual(treeMatcher.canon('Leis Especiais').tokens, ['lei', 'especiail'].length ? ['lei', 'especial'] : []);
assert.equal(treeMatcher.canon('leis').tokens[0], 'lei');
assert.equal(treeMatcher.canon('poderes').tokens[0], 'poder');
assert.equal(treeMatcher.canon('condutores').tokens[0], 'condutor');

// Aliases de stem (administrativo/administração, parar/parada, constitucional/constituição)
assert.equal(treeMatcher.canon('administrativo').stems[0], treeMatcher.canon('administracao').stems[0]);
assert.equal(treeMatcher.canon('parar').stems[0], treeMatcher.canon('parada').stems[0]);
assert.equal(treeMatcher.canon('constitucional').stems[0], treeMatcher.canon('constituicao').stems[0]);

const ctbNodes = [
  'Código de Trânsito Brasileiro - CTB (Lei nº. 9.503/97)',
  'Anexo I',
  'Capítulo I - Disposições Preliminares',
  'Art. 1º',
  '§ 5º',
  'Capítulo X - Da Parada e do Estacionamento',
  'Seção II - Da Segurança dos Veículos',
  'Poder Constituinte'
];
const idx = treeMatcher.buildBm25Index(ctbNodes);

// (f) índice BM25 sem folhas Art./§
assert.equal(idx.nodes.some(n => n.isLeaf), false, 'Índice BM25 não deve conter folhas Art./§');

// (a) empate exato entre 3 "Disposições Gerais" não passa margem 1.12
const tieIdx = treeMatcher.buildBm25Index([
  'Capítulo I - Disposições Gerais',
  'Capítulo II - Disposições Gerais',
  'Capítulo III - Disposições Gerais'
]);
const tieRes = treeMatcher.scoreTreeNodesBm25('Disposições Gerais', tieIdx);
assert.equal(tieRes.length, 3);
assert.equal(tieRes[0].score >= tieRes[1].score * 1.12, false, 'Empate exato não pode passar margem');

// (b) "Segurança no trânsito e responsabilidade dos órgãos" não pode marcar "Seção II - Da Segurança dos Veículos"
const segRes = treeMatcher.scoreTreeNodesBm25('Segurança no trânsito e responsabilidade dos órgãos', idx);
assert.equal(segRes.some(r => r.node.label === 'Seção II - Da Segurança dos Veículos'), false);

// (c) "Poder constitucional" não pode marcar "Poder Constituinte"
const constRes = treeMatcher.scoreTreeNodesBm25('Poder constitucional', idx);
assert.equal(constRes.some(r => r.node.label === 'Poder Constituinte' && r.coverage >= 0.9), false);

// (d) + (e) "anexo 1 do Código de Trânsito Brasileiro" -> "Anexo I" com excludeTokens da disciplina
const ctbExclude = new Set(['codigo', 'transito', 'brasileiro', 'ctb']);
const anexoRes = treeMatcher.scoreTreeNodesBm25('anexo 1 do Código de Trânsito Brasileiro', idx, { excludeTokens: ctbExclude });
assert.equal(anexoRes[0].node.label, 'Anexo I');
assert.equal(anexoRes[0].coverage, 1);

// "Parar e estacionar" -> "Capítulo X - Da Parada e do Estacionamento"
const pararRes = treeMatcher.scoreTreeNodesBm25('Parar e estacionar', idx);
assert.equal(pararRes[0].node.label, 'Capítulo X - Da Parada e do Estacionamento');

// (g) background.js reinjeta treeMatcher.js + content.js
assert.ok(backgroundCode.includes("files: ['treeMatcher.js', 'content.js']"), 'background.js deve reinjetar treeMatcher.js e content.js');

// --- 2. Simulação integrada de selectCaveiraLessonsInDropdown (Âncora + Nível C chegando ao fluxo antigo) ---
function extractBetween(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error(`Start marker not found: ${startMarker}`);
  const end = src.indexOf(endMarker, start);
  if (end === -1) throw new Error(`End marker not found: ${endMarker}`);
  return src.slice(start, end);
}

const helpersSlice = extractBetween(contentCode, 'const PENDING_FILTER_KEY =', 'function findFilterDropdownTrigger(');
const scoreSlice = extractBetween(contentCode, 'function hasWholeStartMatch(', 'function findScrollableMenuElement(');
const treeAndSelectSlice = extractBetween(contentCode, 'function findScrollableMenuElement(', 'function findCaveiraClearFiltersButton(');

// Árvore mockada: tem "Capítulo I - Disposições Preliminares" (Âncora A), "Anexo I" (BM25),
// e "Vias Terrestres" (que no nosso mock não casa no BM25 para "Trânsito e vias terrestres" se exigirmos termos raros,
// ou casa no fluxo antigo via expandSubtopicToSearchGroups -> "vias terrestres").
const mockRows = [
  'Código de Trânsito Brasileiro - CTB (Lei nº. 9.503/97)',
  'Capítulo I - Disposições Preliminares',
  'Anexo I',
  'Da Classificação das Vias Terrestres',
  'Intranet'
].map(label => ({
  innerText: label,
  textContent: label,
  isConnected: true,
  _checked: false,
  getAttribute: () => '',
  querySelector: () => null,
  click() { this._checked = !this._checked; }
}));

const mockFilterInput = {
  value: '',
  focus: () => {},
  _menu: {
    scrollHeight: 200,
    clientHeight: 200,
    scrollTop: 0,
    querySelectorAll: () => [],
    closest: () => null
  }
};

const sandbox = {
  console,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Date,
  Math,
  RegExp,
  Promise,
  JSON,
  setTimeout,
  clearTimeout,
  QGCaveiraTreeMatcher: treeMatcher,
  isDestroyed: false,
  isApplyingFilter: false,
  activePracticeFilter: null,
  lastFilterDiagnosticLog: null,
  window: { addEventListener: () => {} },
  document: { querySelectorAll: () => [], addEventListener: () => {} },
  chrome: { runtime: { id: 'test' }, storage: { local: { get: (_k, cb) => cb({}), set: (_o, cb) => cb && cb() } } }
};

vm.createContext(sandbox);
vm.runInContext(`${helpersSlice}\n${scoreSlice}\n${treeAndSelectSlice}`, sandbox);

// Stubs de interação DOM após carregar o contexto
sandbox.isExtensionContextValid = () => true;
sandbox.isElementVisible = () => true;
sandbox.sleepMs = async () => {};
sandbox.setNativeInputValue = (el, v) => { el.value = v; };
sandbox.findFilterDropdownTrigger = () => ({ click: () => {} });
sandbox.findMenuFilterInput = () => mockFilterInput;
sandbox.getMenuContainer = (inp) => inp._menu;
sandbox.findDropdownOptionElements = (inp) => {
  const q = sandbox.normalizeFilterText(inp?.value || '');
  if (!q) return mockRows;
  return mockRows.filter(r => sandbox.normalizeFilterText(r.innerText).includes(q));
};
sandbox.hasNoSearchResultsInMenu = (inp) => sandbox.findDropdownOptionElements(inp).length === 0;
sandbox.clickElementRealistically = (el) => { if (el && el.click) el.click(); };
sandbox.clickOptionRow = (el) => { if (el && el.click) el.click(); };
sandbox.isOptionRowChecked = (el) => Boolean(el && el._checked);
sandbox.closeOpenDropdown = async () => {};

const diagLog = { queries: [], selectedLabels: [] };
// "Da Classificação das Vias Terrestres" vs subtópico nível C "Trânsito e vias terrestres":
// Com CTB/Trânsito excluídos ou baixa cobertura no BM25, "Vias Terrestres" vai para o fluxo antigo (expandSubtopicToSearchGroups -> "vias terrestres")!
const ok = await sandbox.selectCaveiraLessonsInDropdown(
  ['DISPOSIÇÕES PRELIMINARES'],
  'CTB',
  [
    'Estudo do anexo 1 do Código de Trânsito Brasileiro',
    'Trânsito e vias terrestres',
    'Definições de Redes - Internet, Intranet e Extranet',
    'Revisões e anotações pessoais'
  ],
  'TRÂNSITO',
  { diagLog }
);

assert.equal(ok, true, 'selectCaveiraLessonsInDropdown deve retornar true');
assert.ok(diagLog.selectedLabels.includes('Capítulo I - Disposições Preliminares'), 'Âncora Nível A deve ser marcada');
assert.ok(diagLog.selectedLabels.includes('Anexo I'), 'Subtópico Anexo 1 deve ser marcado');
assert.ok(diagLog.selectedLabels.includes('Da Classificação das Vias Terrestres'), 'Subtópico Vias Terrestres deve ser marcado');
assert.ok(diagLog.selectedLabels.includes('Intranet'), 'Subtópico Nível C sem match no BM25 deve cair no fluxo antigo e marcar Intranet');
assert.ok(diagLog.bizusFilter && diagLog.bizusFilter.discarded.some(d => d.reason === 'noise'), 'Log deve registrar ruído descartado');
assert.ok(Array.isArray(diagLog.subtopicOutcomes) && diagLog.subtopicOutcomes.length === 3, 'Log deve registrar 1 linha por subtópico');
assert.ok(diagLog.subtopicOutcomes.some(o => o.outcome === 'legacy-selected'), 'Log deve registrar legacy-selected quando o fluxo antigo decidir');

console.log('✅ ALL TESTS PASSED (v1.3.5)', {
  selectedLabels: diagLog.selectedLabels,
  bizusFilter: diagLog.bizusFilter,
  subtopicOutcomes: diagLog.subtopicOutcomes.map(o => `${o.level}:${o.subtopic} => ${o.outcome} (${o.selectedLabel || '-'})`)
});
