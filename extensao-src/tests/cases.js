// Casos de regressão com gabarito (ids resolvidos por nome na árvore real)
const { loadExtensionResolver } = require('./loadResolver.js');
const { R, treeJson } = loadExtensionResolver();
const tree = R.loadTree(treeJson);
const subj = (id) => tree.subjects.get(id);
const find = (sid, rx, parentRx, depth) => {
  const s = subj(sid); const out = s.nodes.filter(n => rx.test(n.name) && (depth == null || n.depth === depth) &&
    (!parentRx || (s.byId.get(n.parentId) && parentRx.test(s.byId.get(n.parentId).name))));
  if (!out.length) throw new Error('não achei ' + rx + ' em ' + sid);
  return out[0].id;
};
const IDS = { CTB: 8199, ESP: 17254, INF: 3989, PORT: 4899, ADM: 1, DPP: 2373, DP: 1490, FIS: 15926 };
const CASES = [
  { nome: 'Informática: Redes + Internet/Intranet/Extranet', input: { subjectName: 'Informática', lessons: ['Redes de computadores'], topic: '', subtopics: ['Definições de Redes - Internet, Intranet e Extranet', 'Classificação de Redes'] },
    expected: () => [find(IDS.INF, /^Classificação de Redes/), find(IDS.INF, /^Intranet x Extranet x Internet/)] },
  { nome: 'Informática: Segurança da Informação', input: { subjectName: 'Informática', lessons: ['Segurança da Informação'], topic: '', subtopics: ['Conceitos básicos de segurança da informação', 'Assinatura digital e certificado digital', 'Ameaças, malwares e ataques'] },
    expected: () => [find(IDS.INF, /^Conceitos Básicos/, /Segurança da Informação/), find(IDS.INF, /^Assinatura Digital/), find(IDS.INF, /^Certificado Digital/), find(IDS.INF, /^Ameaças, Malwares/)] },
  { nome: 'Informática: Nuvem', input: { subjectName: 'Informática', lessons: ['Computação em nuvem'], topic: '', subtopics: ['Tipos de nuvem', 'Armazenamento em nuvem'] },
    expected: () => [find(IDS.INF, /^Tipos de Nuvem/), find(IDS.INF, /^Armazenamento em Nuvem/)] },
  { nome: 'Informática: e-mail', input: { subjectName: 'Informática', lessons: ['Correio eletrônico'], topic: '', subtopics: ['Protocolos de e-mail'] },
    expected: () => [find(IDS.INF, /^Protocolos de E-Mail/)] },
  { nome: 'Português: pronome relativo', input: { subjectName: 'Português', lessons: ['Pronome relativo e conjunção integrante'], topic: '', subtopics: [] },
    expected: () => [find(IDS.PORT, /^Pronome relativo e Conjunção integrante/)] },
  { nome: 'Adm: Poderes (4 poderes)', input: { subjectName: 'Direito Administrativo', lessons: ['Poderes administrativos'], topic: 'Poderes e Deveres da Administração', subtopics: ['Poder disciplinar', 'Poder hierárquico', 'Poder regulamentar', 'Poder de polícia'] },
    expected: () => [find(IDS.ADM, /^Poder disciplinar/i), find(IDS.ADM, /^Poder hierárquico/i), find(IDS.ADM, /^Poder regulamentar/i), find(IDS.ADM, /^Poder de pol[ií]cia/i)] },
  { nome: 'Adm: Responsabilidade civil do Estado', input: { subjectName: 'Direito Administrativo', lessons: ['Responsabilidade civil do Estado'], topic: '', subtopics: [] },
    expected: () => [742] },
  { nome: 'DPP: Provas', input: { subjectName: 'Direito Processual Penal', lessons: ['Provas'], topic: '', subtopics: ['Provas ilícitas', 'Prova testemunhal', 'Interrogatório do acusado'] },
    expected: () => [2802] },
  { nome: 'CTB: Disposições preliminares + Anexo I', input: { subjectName: 'Código de Trânsito Brasileiro - CTB (Lei nº. 9.503/97)', lessons: ['DISPOSIÇÕES PRELIMINARES'], topic: 'CTB', subtopics: ['Código de Trânsito Brasileiro e disposições preliminares', 'Estudo do anexo 1 do Código de Trânsito Brasileiro'] },
    expected: () => [8200, 9761] },
  { nome: 'CTB: Sinalização', input: { subjectName: 'CTB', lessons: ['Sinalização de trânsito'], topic: 'CTB', subtopics: [] },
    expected: () => [find(IDS.CTB, /^Capítulo VII - Da Sinalização/)] },
  { nome: 'CTB: Infrações', input: { subjectName: 'CTB', lessons: ['Das infrações'], topic: 'CTB', subtopics: [] },
    expected: () => [find(IDS.CTB, /^Capítulo XV - Das Infrações/)] },
  { nome: 'ECA crimes (com tópico)', input: { subjectName: 'Legislação Especial', lessons: ['Crimes contra a criança e o adolescente'], topic: 'ECA', subtopics: ['Crimes previstos no ECA'] },
    expected: () => [17458] },
  // Casos de precisão exata em Física (v3.6.4)
  { nome: '13. MRUV - Gráfico da Posição (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Cinemática Escalar', lessons: ['MRUV - AULA 06 - GRÁFICO DA POSIÇÃO'], subtopics: [] },
    expected: () => [15967] },
  { nome: '14. MRUV - Gráfico da Aceleração (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Cinemática Escalar', lessons: ['MRUV - AULA 07 - GRÁFICO DA ACELERAÇÃO'], subtopics: [] },
    expected: () => [15967] },
  { nome: '15. MRUV - Função Horária (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Cinemática Escalar', lessons: ['MRUV - AULA 01 - FUNÇÃO HORÁRIA'], subtopics: [] },
    expected: () => [15964, 15965] },
  { nome: '16. MRUV - Equação de Torricelli (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Cinemática Escalar', lessons: ['MRUV - AULA 04 - EQUAÇÃO DE TORRICELLI'], subtopics: [] },
    expected: () => [15966] },
  { nome: '17. MRU - Gráfico da Posição (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Cinemática Escalar', lessons: ['MRU - AULA 03 - GRÁFICO DA POSIÇÃO'], subtopics: [] },
    expected: () => [15955] },
  { nome: '18. Leis de Newton - Lei da Inércia (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Dinâmica', lessons: ['LEIS DE NEWTON - AULA 01 - LEI DA INÉRCIA'], subtopics: [] },
    expected: () => [16009] },
  { nome: '19. Leis de Newton - 2ª Lei de Newton (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Dinâmica', lessons: ['LEIS DE NEWTON - AULA 02 - 2ª LEI DE NEWTON'], subtopics: [] },
    expected: () => [16010] },
  { nome: '20. Dinâmica - Força de Atrito (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Dinâmica', lessons: ['DINÂMICA - AULA 04 - FORÇA DE ATRITO'], subtopics: [] },
    expected: () => [16017] },
  { nome: '21. Energia Mecânica - Energia Cinética (exato)', exactIds: true,
    input: { subjectName: 'FÍSICA', topic: 'Energia', lessons: ['ENERGIA MECÂNICA - AULA 01 - ENERGIA CINÉTICA'], subtopics: [] },
    expected: () => [16050] }
];
function covered(s, resultIds, id) { let c = s.byId.get(id); while (c) { if (resultIds.includes(c.id)) return true; c = s.byId.get(c.parentId); } return false; }
function underOrAbove(s, expIds, id) { // resultado relacionado ao gabarito?
  return expIds.some(e => { let c = s.byId.get(e); while (c) { if (c.id === id) return true; c = s.byId.get(c.parentId); }
    c = s.byId.get(id); while (c) { if (c.id === e) return true; c = s.byId.get(c.parentId); } return false; });
}
let okCases = 0, tot = 0, rec = 0, recTot = 0, outs = 0;
for (const c of CASES) {
  const r = R.resolveLesson(tree, c.input); const exp = c.expected(); tot++;
  if (!r.subject) { console.log('✖', c.nome, '→ disciplina não resolvida'); continue; }
  const s = subj(r.subject.id);
  const hit = c.exactIds ? exp.filter(e => r.ids.includes(e)) : exp.filter(e => covered(s, r.ids, e));
  const out = c.exactIds ? r.ids.filter(id => !exp.includes(id)) : r.ids.filter(id => !underOrAbove(s, exp, id));
  rec += hit.length; recTot += exp.length; outs += out.length;
  const ok = hit.length === exp.length && out.length === 0; if (ok) okCases++;
  const names = r.ids.map(id => (s.byId.get(id) || {}).name).map(n => (n || '').slice(0, 34));
  console.log(ok ? '✔' : '✖', c.nome, '| conf:', r.confidence, '| cobertura', hit.length + '/' + exp.length, out.length ? '| FORA: ' + out : '', '\n    →', names.join(' ; '));
}
console.log(`\nCasos OK: ${okCases}/${tot} | cobertura dos esperados: ${rec}/${recTot} | ids fora do gabarito: ${outs}`);
if (okCases !== tot || outs !== 0) process.exitCode = 1;
