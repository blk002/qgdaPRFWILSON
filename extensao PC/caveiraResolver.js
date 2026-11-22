// QG da PRF — Resolver hierárquico por ids (v2.0)
// Entrada: {subjectName, lessons[], topic, subtopics[]}  ->  Saída: {subject, ids[], picks[], confidence, alternatives[]}
// Usa a árvore oficial do Caveira (caveira_arvore.json). Sem DOM, sem digitar, sem scroll.
(function (root) {
  const TM = (typeof require !== 'undefined' && typeof module !== 'undefined')
    ? require('./treeMatcher.js') : root.QGCaveiraTreeMatcher;
  const { canon, filterAndRankBizusSubtopics } = TM;

  const SUBJECT_ALIASES = {
    'ctb': 8199, 'codigo de transito brasileiro': 8199, 'legislacao de transito': 8199, 'transito': 8199,
    'legislacao especial': 17254, 'legislacao penal especial': 17254, 'leis especiais': 17254,
    'leis penais especiais': 17254, 'legislacao extravagante': 17254,
    'portugues': 4899, 'lingua portuguesa': 4899,
    'informatica': 3989, 'noções de informatica': 3989, 'nocoes de informatica': 3989,
    'rlm': 6209, 'raciocinio logico': 6209, 'raciocinio logico matematico': 6209,
    'matematica': 5718, 'direito administrativo': 1, 'direito constitucional': 1010, 'direito penal': 1490,
    'processo penal': 2373, 'direito processual penal': 2373, 'direitos humanos': 13781,
    'etica': 15444, 'etica e conduta profissional': 15444, 'fisica': 15926, 'geografia': 16375,
    'historia': 16767, 'ingles': 17701, 'lingua inglesa': 17701, 'espanhol': 17647,
    'atualidades': 8054, 'legislacao institucional': 17253, 'medicina legal': 18155,
    'criminologia': 11631, 'redacao oficial': 18321, 'redacao': 18321, 'arquivologia': 7741,
    'administracao geral': 6611, 'administracao publica': 7310, 'estatistica': 15050,
    'tecnologia da informacao': 18746, 'resolucoes do contran': 20363
  };

  const LEAF_RX = /^\s*(?:art\.?\s*\d|§|par[aá]grafo|inciso|al[ií]nea|[ivxlcdm]+\s*$|[a-z]\)\s*$|\d+[.)]?\s*$)/i;
  const isLeafName = (name) => LEAF_RX.test(String(name || ''));

  function norm(s) { return canon(s).norm; }

  function loadTree(json) {
    const subjects = new Map();
    for (const s of json.subjects || []) {
      const nodes = (s.nodes || []).map(n => {
        const c = canon(n.name);
        return { ...n, subjectId: s.id, tokens: c.tokens, stems: c.stems, tokenSet: c.tokenSet, stemSet: c.stemSet, isLeaf: isLeafName(n.name) };
      });
      const byId = new Map(nodes.map(n => [n.id, n]));
      const children = new Map();
      for (const n of nodes) {
        if (!children.has(n.parentId)) children.set(n.parentId, []);
        children.get(n.parentId).push(n);
      }
      subjects.set(s.id, { id: s.id, name: s.name, nodes, byId, children, index: null });
    }
    return { subjects };
  }

  function resolveSubject(tree, subjectName, hintTexts = []) {
    const cands = [subjectName, ...hintTexts].filter(Boolean);
    for (const c of cands) {
      const k = norm(c);
      if (SUBJECT_ALIASES[k] && tree.subjects.has(SUBJECT_ALIASES[k])) return tree.subjects.get(SUBJECT_ALIASES[k]);
    }
    // casamento por nome oficial (tokens)
    for (const c of cands) {
      const q = canon(c);
      if (q.tokens.length === 0) continue;
      let best = null, bestScore = 0;
      for (const s of tree.subjects.values()) {
        const sc = canon(s.name);
        const inter = q.tokens.filter(t => sc.tokenSet.has(t)).length;
        const score = inter / Math.max(q.tokens.length, sc.tokens.length);
        if (score > bestScore) { bestScore = score; best = s; }
      }
      if (best && bestScore >= 0.6) return best;
    }
    return null;
  }

  function buildIndex(subject) {
    if (subject.index) return subject.index;
    const docs = subject.nodes.filter(n => !n.isLeaf && n.depth <= 4);
    const df = new Map(), sdf = new Map();
    let totalLen = 0;
    for (const n of docs) {
      for (const t of n.tokenSet) df.set(t, (df.get(t) || 0) + 1);
      for (const t of n.stemSet) sdf.set(t, (sdf.get(t) || 0) + 1);
      totalLen += n.tokens.length;
    }
    const N = Math.max(1, docs.length), avgLen = totalLen / N || 1;
    const idf = (f) => Math.log(1 + (N - f + 0.5) / (f + 0.5));
    subject.index = { docs, N, avgLen, df, sdf, idf };
    return subject.index;
  }

  function descendantsOf(subject, id) {
    const out = new Set(); const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      for (const ch of subject.children.get(cur) || []) { if (!out.has(ch.id)) { out.add(ch.id); stack.push(ch.id); } }
    }
    return out;
  }

  // BM25 com stem como fallback; exige termo raro; devolve ordenado
  function score(subject, queryText, opts = {}) {
    const idx = buildIndex(subject);
    let q = canon(queryText);
    const ex = opts.excludeTokens;
    if (ex && ex.size && q.tokens.length > 1) {
      const keep = q.tokens.map((t, i) => i).filter(i => !ex.has(q.tokens[i]));
      if (keep.length) q = { norm: keep.map(i => q.tokens[i]).join(' '), tokens: keep.map(i => q.tokens[i]), stems: keep.map(i => q.stems[i]) };
    }
    if (!q.tokens.length) return [];
    const k1 = 1.2, b = 0.5;
    const known = q.tokens.map(t => ({ t, f: idx.df.get(t) || 0 })).filter(x => x.f > 0);
    const maxIdf = known.length ? Math.max(...known.map(x => idx.idf(x.f))) : 0;
    const rare = new Set(known.filter(x => idx.idf(x.f) >= maxIdf * 0.65).map(x => x.t));
    const maxTheo = q.tokens.reduce((a, t) => a + Math.max(idx.idf(idx.df.get(t) || 0), 0.6), 0) || 1;
    const res = [];
    for (const n of idx.docs) {
      if (opts.scope && !opts.scope.has(n.id)) continue;
      if (opts.minDepth && n.depth < opts.minDepth) continue;
      let bm = 0, matched = 0, rareHit = 0;
      for (let i = 0; i < q.tokens.length; i++) {
        const t = q.tokens[i], st = q.stems[i];
        const exact = n.tokenSet.has(t);
        const stem = !exact && st && n.stemSet.has(st);
        if (!exact && !stem) continue;
        matched++; if (rare.has(t)) rareHit++;
        const f = exact ? (idx.df.get(t) || 0) : (idx.sdf.get(st) || 0);
        const w = idx.idf(f) || 0.5;
        const tf = exact ? n.tokens.filter(x => x === t).length : n.stems.filter(x => x === st).length;
        bm += w * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (n.tokens.length / idx.avgLen)))) * (exact ? 1 : 0.85);
      }
      if (!matched) continue;
      if (rare.size && !rareHit) continue;
      const cov = matched / q.tokens.length;
      const nodeCov = matched / Math.max(1, n.tokens.length); // quanto do NOME do nó foi coberto
      const exactName = norm(n.name) === q.norm ? 1 : 0;
      const rel = (bm / maxTheo) * (0.6 + 0.4 * cov) + (exactName ? 0.35 : 0);
      res.push({ node: n, score: +bm.toFixed(3), rel: +rel.toFixed(3), cov: +cov.toFixed(3), nodeCov: +nodeCov.toFixed(3) });
    }
    res.sort((a, b) => b.rel - a.rel || a.node.depth - b.node.depth);
    return res;
  }

  function pickBest(ranked, { minRel, minCov, margin = 1.12 }) {
    const t = ranked[0], t2 = ranked[1];
    if (!t || t.rel < minRel || t.cov < minCov) return { pick: null, ambiguous: false, ranked };
    if (t2 && t.rel < t2.rel * margin) return { pick: null, ambiguous: true, ranked };
    return { pick: t, ambiguous: false, ranked };
  }

  function resolveLesson(tree, input) {
    const lessons = (input.lessons || []).filter(Boolean);
    const topic = input.topic || '';
    const subject = resolveSubject(tree, input.subjectName, [topic, ...lessons]);
    if (!subject) return { subject: null, ids: [], picks: [], confidence: 'none', reason: 'disciplina não identificada' };

    const exclude = new Set();
    [subject.name, input.subjectName].filter(Boolean).forEach(s => canon(s).tokens.forEach(t => exclude.add(t)));
    Object.keys(SUBJECT_ALIASES).filter(k => SUBJECT_ALIASES[k] === subject.id && k.split(' ').length <= 4)
      .forEach(k => canon(k).tokens.forEach(t => exclude.add(t)));
    const subs = filterAndRankBizusSubtopics(input.subtopics || [], [...lessons, topic], input.maxSubtopics || 10);
    const log = { anchors: [], subtopics: [] };

    // 1) Âncora: título da aula / tópico
    const anchorQs = [...lessons, topic].filter(Boolean);
    let anchorRank = [];
    for (const aq of anchorQs) {
      const r = score(subject, aq, { excludeTokens: exclude });
      for (const x of r) { const ex = anchorRank.find(y => y.node.id === x.node.id); if (ex) ex.rel = Math.max(ex.rel, x.rel); else anchorRank.push({ ...x }); }
    }
    anchorRank.sort((a, b) => b.rel - a.rel || a.node.depth - b.node.depth);

    // desempate pela evidência dos subtópicos: cada candidato ganha pontos pelos subtópicos que casam DENTRO da sua subárvore
    const top = anchorRank.slice(0, 5);
    for (const c of top) {
      const scope = descendantsOf(subject, c.node.id);
      let ev = 0;
      for (const s of subs) {
        const r = score(subject, s.cleaned, { scope, excludeTokens: exclude })[0];
        if (r && r.rel >= 0.6 && r.cov >= 0.5) ev += s.weight;
        const own = score(subject, s.cleaned, { excludeTokens: exclude })[0];
        if (own && own.node.id === c.node.id && own.rel >= 0.6) ev += s.weight;
      }
      c.evidence = +ev.toFixed(2);
      c.final = +(c.rel + 0.15 * ev).toFixed(3);
    }
    top.sort((a, b) => b.final - a.final || a.node.depth - b.node.depth);
    log.anchors = top.map(c => ({ id: c.node.id, name: c.node.name, rel: c.rel, evidence: c.evidence, final: c.final }));

    let anchor = null, anchorAmbiguous = false;
    if (top[0] && top[0].rel >= 0.55 && top[0].cov >= 0.5) {
      if (top[1] && top[0].final < top[1].final * 1.12) anchorAmbiguous = true; else anchor = top[0];
    }

    // 2) Subtópicos: dentro do escopo da âncora; fora dele só com confiança alta (sem os termos da própria âncora)
    const picks = [];
    const scope = anchor ? descendantsOf(subject, anchor.node.id) : null;
    const scopedExclude = anchor ? new Set([...exclude, ...anchor.node.tokens]) : exclude; // o escopo já implica o nome da âncora
    const splitEnum = (txt) => String(txt || '').split(/\s*(?:,|;|\be\b|\bou\b)\s*/i).map(x => x.trim()).filter(x => canon(x).tokens.length >= 1);

    const tryQuery = (q, isPart = false) => {
      let chosen = null, where = null, amb = false, scopedTop = [], globalTop = [];
      if (scope && scope.size) {
        const rr = score(subject, q, { scope, excludeTokens: scopedExclude });
        const pk = pickBest(rr, { minRel: 0.6, minCov: 0.5 });
        scopedTop = rr.slice(0, 3).map(x => `${x.node.name} [${x.rel}]`); amb = pk.ambiguous;
        if (pk.pick) { chosen = pk.pick; where = 'dentro-da-ancora'; }
      }
      // parte de enumeração fora da âncora: exige >=2 termos úteis (evita 'Segurança' solto marcar 'Da Segurança dos Veículos')
      const usefulTokens = canon(q).tokens.filter(t => !scopedExclude.has(t)).length;
      if (!chosen && !(isPart && usefulTokens < 2)) {
        const rr = score(subject, q, { excludeTokens: scopedExclude });
        const pk = pickBest(rr, { minRel: 0.9, minCov: 0.6, margin: 1.25 });
        globalTop = rr.slice(0, 3).map(x => `${x.node.name} [${x.rel}]`); amb = amb || pk.ambiguous;
        if (pk.pick) { chosen = pk.pick; where = 'global-forte'; }
      }
      return { chosen, where, amb, scopedTop, globalTop };
    };
    const addPick = (chosen, where, from) => {
      if (chosen && !picks.some(x => x.node.id === chosen.node.id)) picks.push({ ...chosen, where, from });
    };

    let totalWeight = 0, matchedWeight = 0;
    for (const sub of subs) {
      totalWeight += sub.weight;
      const full = tryQuery(sub.cleaned);
      const entry = { q: sub.cleaned, level: sub.level, scoped: full.scopedTop, global: full.globalTop, amb: full.amb, via: 'completo' };
      if (full.chosen) {
        addPick(full.chosen, full.where, sub.cleaned); matchedWeight += sub.weight; entry.selected = full.chosen.node.name;
      } else {
        // enumeração ("A e B", "A, B"): tenta cada parte separadamente
        const parts = splitEnum(sub.cleaned);
        if (parts.length >= 2) {
          let hit = 0; const got = [];
          for (const part of parts) {
            // parte precisa ter >=2 termos úteis (fora o nome da disciplina/âncora); termo solto como "segurança" casa com irmãos errados
            if (canon(part).tokens.filter(t => !scopedExclude.has(t)).length < 2) continue;
            const r = tryQuery(part, true);
            if (r.chosen) { addPick(r.chosen, r.where, part); hit++; got.push(r.chosen.node.name); }
          }
          if (hit) { matchedWeight += sub.weight * (hit / parts.length); entry.via = 'partes'; entry.selected = got.join(' ; '); }
        }
      }
      log.subtopics.push(entry);
    }

    // 3) Montagem dos ids: a pasta pai já inclui os filhos
    let ids = [], reason = '';
    const ratio = totalWeight ? matchedWeight / totalWeight : 0;
    log.matchRatio = +ratio.toFixed(2);
    const inScope = picks.filter(p => p.where === 'dentro-da-ancora');
    const outScope = picks.filter(p => p.where !== 'dentro-da-ancora');
    if (anchor) {
      const exactTitle = anchor.rel >= 1.2; // título da aula == nome da pasta: a pasta inteira é o conteúdo
      if (!exactTitle && picks.length >= 1 && ratio >= 0.6) {
        ids = picks.map(p => p.node.id); reason = 'subassuntos cobrem o conteúdo (âncora ampla)';
      } else {
        ids = [anchor.node.id]; reason = exactTitle ? 'âncora exata (pasta cobre os filhos)' : 'âncora (pasta cobre os filhos)';
        outScope.forEach(p => ids.push(p.node.id));
      }
    } else {
      ids = picks.map(p => p.node.id); reason = ids.length ? 'só subtópicos fortes (sem âncora)' : 'nada decidido';
    }
    ids = Array.from(new Set(ids));
    // remove descendentes quando o ancestral também foi escolhido
    const idSet = new Set(ids);
    ids = ids.filter(id => { let cur = subject.byId.get(id); while (cur && cur.parentId != null) { if (idSet.has(cur.parentId)) return false; cur = subject.byId.get(cur.parentId); } return true; });

    const confidence = anchor && !anchorAmbiguous ? (anchor.rel >= 0.9 ? 'alta' : 'media') : (ids.length ? 'baixa' : 'nenhuma');
    const needAlt = anchorAmbiguous || !ids.length || confidence === 'baixa';
    const alternatives = needAlt ? top.slice(0, 5).map(c => ({ id: c.node.id, name: c.node.name, path: c.node.path.map(p => (subject.byId.get(p) || {}).name || subject.name), final: c.final })) : [];
    return {
      subject: { id: subject.id, name: subject.name }, ids, reason, confidence, anchorAmbiguous, alternatives,
      anchor: anchor ? { id: anchor.node.id, name: anchor.node.name } : null,
      picks: ids.map(id => { const n = subject.byId.get(id); return { id, name: n.name, path: n.path.map(p => (subject.byId.get(p) || {}).name || subject.name) }; }),
      log
    };
  }

  // Ids reais do Caveira (examining-boards): CAVEIRA (Inéditas)=2, CEBRASPE=5, CAVEIRA (ADAPTADA)=12
  const BOARD_KEY_TO_ID = { caveira_ineditas: 2, cebraspe: 5, caveira_adaptadas: 12 };
  const BOARD_LABELS = { caveira_ineditas: 'Caveira Inéditas', cebraspe: 'CEBRASPE', caveira_adaptadas: 'Caveira Adaptadas' };
  const DEFAULT_PREFS = { examBoards: ['cebraspe', 'caveira_ineditas', 'caveira_adaptadas'], numberAlternatives: [2] };

  function boardKeysToIds(keys) {
    const out = [];
    for (const k of Array.isArray(keys) ? keys : []) {
      const id = BOARD_KEY_TO_ID[String(k || '').toLowerCase().trim()];
      if (id && !out.includes(id)) out.push(id);
    }
    return out.sort((a, b) => a - b);
  }
  function sanitizeAlternatives(list) {
    const out = [];
    for (const v of Array.isArray(list) ? list : []) {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 2 && n <= 5 && !out.includes(n)) out.push(n);
    }
    return out.sort((a, b) => a - b);
  }
  function describePrefs(keys, alts) {
    const b = (Array.isArray(keys) ? keys : []).map(k => BOARD_LABELS[k]).filter(Boolean);
    const a = sanitizeAlternatives(alts).map(n => n === 2 ? 'Certo/Errado' : `${n} alternativas`);
    return [b.length ? b.join(' + ') : 'qualquer banca', a.length ? a.join(' / ') : 'qualquer nº de alternativas'].join(' • ');
  }

  // 4º argumento: string (status, compatível com v1.4) ou objeto { status, examBoards:[chaves], numberAlternatives:[2] }
  function buildUrl(origin, subjectId, ids, opts = 'not_resolved') {
    const o = (opts && typeof opts === 'object') ? opts : { status: opts };
    const status = o.status === undefined ? 'not_resolved' : o.status;
    const boardIds = boardKeysToIds(o.examBoards);
    const alts = sanitizeAlternatives(o.numberAlternatives);
    const p = new URLSearchParams({
      career_id: 'all', subject_ids: String(subjectId), subtopic_id: '', subtopic_ids: ids.join(','),
      number_alternatives: alts.join(','), raw_text: '', examining_board_ids: boardIds.join(','), book_ids: '', years: '', education_level_ids: '',
      situation: '', difficulty_ids: '', status: status, question_id: '', ids: '', institution_ids: '',
      occupation_ids: '', has_comment: '', has_video: '', category_ids: ''
    });
    return `${origin || 'https://app.caveira.com'}/questions?${p.toString()}`;
  }

  const api = { loadTree, resolveSubject, resolveLesson, buildUrl, score, isLeafName, boardKeysToIds, sanitizeAlternatives, describePrefs, BOARD_KEY_TO_ID, DEFAULT_PREFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.QGCaveiraResolver = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
