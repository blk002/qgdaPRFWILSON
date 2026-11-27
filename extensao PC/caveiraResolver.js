// QG da PRF — Resolver hierárquico por ids (v3.5.0)
// Entrada: {subjectName, lessons[], topic, subtopics[]}  ->  Saída: {subject, ids[], picks[], confidence, alternatives[]}
// Usa a árvore oficial do Caveira (caveira_arvore.json). Sem DOM, sem digitar, sem scroll.
(function (root) {
  const TM = (typeof require !== 'undefined' && typeof module !== 'undefined')
    ? require('./treeMatcher.js') : root.QGCaveiraTreeMatcher;
  const { canon, filterAndRankBizusSubtopics, cleanDidacticPrefix } = TM;

  const SUBJECT_ALIASES = {
    'ctb': 8199, 'codigo de transito brasileiro': 8199, 'codigo de transito': 8199, 'legislacao de transito': 8199, 'transito': 8199,
    'legislacao especial': 17254, 'legislacao penal especial': 17254, 'leis especiais': 17254,
    'leis penais especiais': 17254, 'legislacao extravagante': 17254,
    'portugues': 4899, 'lingua portuguesa': 4899,
    'informatica': 3989, 'nocoes de informatica': 3989,
    'rlm': 6209, 'raciocinio logico': 6209, 'raciocinio logico matematico': 6209,
    'matematica': 5718, 'direito administrativo': 1, 'direito constitucional': 1010, 'direito penal': 1490,
    'processo penal': 2373, 'direito processual penal': 2373, 'direitos humanos': 13781,
    'etica': 15444, 'etica e conduta profissional': 15444,
    'fisica': 15926, 'geografia': 16375,
    'historia': 16767, 'ingles': 17701, 'lingua inglesa': 17701, 'espanhol': 17647,
    'atualidades': 8054, 'legislacao institucional': 17253, 'medicina legal': 18155,
    'criminologia': 11631, 'redacao oficial': 18321, 'redacao': 18321, 'arquivologia': 7741,
    'administracao geral': 6611, 'administracao publica': 7310, 'estatistica': 15050,
    'tecnologia da informacao': 18746, 'resolucoes do contran': 20363, 'resolucoes contran': 20363
  };

  // Aliases adicionais (nomes de matérias no QG/editais PRF que também existem como tópicos dentro da árvore)
  // Mantidos fora de `exclude` em `resolveLesson` para não remover palavras-chave de tópicos reais.
  const SUBJECT_TOPIC_SAFE_ALIASES = {
    'legislacao de transito ctb': 8199,
    'etica no servico publico': 15444,
    'etica e cidadania': 15444,
    'etica profissional': 15444,
    'geopolitica': 16375,
    'geopolitica brasileira': 16375
  };

  const COMPANION_SUBJECTS = {
    3989: [18746],
    18746: [3989],
    5718: [6209],
    6209: [5718],
    8199: [20363],
    20363: [8199],
  };

  const LEAF_RX = /^\s*(?:art\.?\s*\d|§|par[aá]grafo|inciso|al[ií]nea|[ivxlcdm]+\s*$|[a-z]\)\s*$|\d+[.)]?\s*$)/i;
  const isLeafName = (name) => LEAF_RX.test(String(name || ''));

  function norm(s) { return canon(s).norm; }

  function stripStructuralPrefix(name) {
    return String(name || '')
      .replace(/^(?:cap[ií]tulo|se[cç][aã]o|subse[cç][aã]o|t[ií]tulo|livro)\s+[\dIVXLC]+(?:\s*-\s*[A-Z])?\s*[-–:]\s*/i, '')
      .replace(/^Lei\s+(?:n[º°.]?\s*)?[\d./]+\s*[–-]\s*/i, '')
      .trim();
  }

  function cleanAnchorQuery(text) {
    let s = String(text || '').trim();
    if (!s) return '';
    // Remove sufixos de aula/parte/bloco/exercícios e caudas didáticas comuns
    s = s
      .replace(/\s*[-–—|:]\s*(?:parte|pt|aula|bloco)\s*0*\d+(?:\s*[-–—|:]\s*(?:exercicios?|teoria|revisao|resolucao|questoes?))?\s*$/i, '')
      .replace(/\s*[-–—|:]\s*(?:exercicios?|teoria|revisao|resolucao)\s*$/i, '')
      .replace(/\s+(?:parte|pt)\s*0*\d+\s*$/i, '')
      .replace(/\be\s+suas\s+altera[cç][oõ]es\b/gi, '')
      .replace(/\bpara\s+iniciantes\b/gi, '')
      .replace(/\bde\s+nivelamento\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (typeof cleanDidacticPrefix === 'function') {
      s = cleanDidacticPrefix(s);
    }
    s = s
      .replace(/^(?:bases\s+(?:da|do|de|das|dos)|conceitos?\s+iniciais?\s+(?:de|da|do|das|dos))\s+/i, '')
      .trim();
    return s;
  }

  function expandQueryVariants(cleanedText) {
    const base = String(cleanedText || '').trim();
    if (!base) return [];
    const n = norm(base);
    const out = [base];
    const push = (v) => {
      if (v && !out.some(x => norm(x) === norm(v))) out.push(v);
    };

    if (/\bmruv\b/i.test(n)) push(base.replace(/\bmruv\b/gi, 'Movimento Retilineo e Uniformemente Variado'));
    if (/\bmru\b/i.test(n)) push(base.replace(/\bmru\b/gi, 'Movimento Retilineo e Uniforme'));
    if (/\bmcu\b/i.test(n)) push(base.replace(/\bmcu\b/gi, 'Movimento Circular e Uniforme'));
    if (/\bjecrim\b/i.test(n)) push('Lei 9099 Juizados Especiais Criminais');
    if (/\beca\b/i.test(n)) push('Lei 8069 Estatuto da Crianca e do Adolescente');
    if (/\b(?:motores?|ferramentas?)\s+de\s+buscas?\b/i.test(n)) push('Ferramentas de Busca e Pesquisa');
    if (/\bnavegacao\s+na\s+internet\b/i.test(n)) push('Navegadores');
    if (/\bsistema\s+internacional\s+de\s+unidades\b/i.test(n)) push('Conceitos Iniciais');
    if (/\bconceito\s+iniciais\b/i.test(n)) push('Conceitos Iniciais');
    if (/\bdivisao\s+diretamente\s+proporcional\b/i.test(n)) push('Partes Diretamente Proporcionais');
    if (/\bconceitos\s+de\s+operacao\b/i.test(n)) push('Intranet Extranet Internet');

    return out;
  }

  function expandEnumeratedTitle(cleanedText) {
    const s = String(cleanedText || '').trim();
    if (!s) return [];
    // Padrão cabeça compartilhada: "Regência verbal e nominal", "Concordância verbal e nominal"
    const sharedHead = s.match(/^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)\s+([A-Za-zÀ-ÿ]+)\s+e\s+([A-Za-zÀ-ÿ]+)$/i);
    if (sharedHead) {
      const head = sharedHead[1].trim();
      const adj1 = sharedHead[2].trim();
      const adj2 = sharedHead[3].trim();
      if (head.length >= 4 && adj1.length >= 4 && adj2.length >= 4) {
        return [`${head} ${adj1}`, `${head} ${adj2}`];
      }
    }
    const parts = s.split(/\s*(?:,|;|\be\b|\/)\s*/i).map(p => p.trim()).filter(p => canon(p).tokens.length >= 1);
    return parts.length >= 2 ? parts : [];
  }

  function loadTree(json) {
    const subjects = new Map();
    for (const s of json.subjects || []) {
      const nodes = (s.nodes || []).map(n => {
        const c = canon(n.name);
        const strippedName = stripStructuralPrefix(n.name);
        const strippedNorm = strippedName && strippedName !== n.name ? norm(strippedName) : '';
        return {
          ...n,
          subjectId: s.id,
          tokens: c.tokens,
          stems: c.stems,
          tokenSet: c.tokenSet,
          stemSet: c.stemSet,
          strippedNorm,
          isLeaf: isLeafName(n.name)
        };
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

  function hasContranSignal(texts) {
    const joined = (texts || []).map(norm).join(' ');
    return /\bcontran\b/.test(joined) || /\bres(?:oluc(?:ao|oes))?\s*(?:n\s*)?\d{2,4}\b/.test(joined);
  }

  function resolveSubject(tree, subjectName, hintTexts = []) {
    const cands = [subjectName, ...hintTexts].filter(Boolean);
    let resolved = null;
    for (const c of cands) {
      const k = norm(c);
      const aliasId = SUBJECT_ALIASES[k] || SUBJECT_TOPIC_SAFE_ALIASES[k];
      if (aliasId && tree.subjects.has(aliasId)) {
        resolved = tree.subjects.get(aliasId);
        break;
      }
    }
    if (!resolved) {
      // casamento por nome oficial (tokens)
      for (const c of cands) {
        const q = canon(c);
        if (q.tokens.length === 0) continue;
        let best = null, bestScore = 0;
        for (const s of tree.subjects.values()) {
          const sc = canon(s.name);
          const inter = q.tokens.filter(t => sc.tokenSet.has(t)).length;
          const scoreVal = inter / Math.max(q.tokens.length, sc.tokens.length);
          if (scoreVal > bestScore) { bestScore = scoreVal; best = s; }
        }
        if (best && bestScore >= 0.6) {
          resolved = best;
          break;
        }
      }
    }
    if (resolved && resolved.id === 8199 && hasContranSignal(cands) && tree.subjects.has(20363)) {
      return tree.subjects.get(20363);
    }
    return resolved;
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

  function isAncestor(subject, ancId, descId) {
    if (!subject || !ancId || !descId || ancId === descId) return false;
    let cur = subject.byId.get(descId);
    while (cur && cur.parentId != null) {
      if (cur.parentId === ancId) return true;
      cur = subject.byId.get(cur.parentId);
    }
    return false;
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
      const nodeCov = matched / Math.max(1, n.tokens.length);
      const exactName = (norm(n.name) === q.norm || (n.strippedNorm && n.strippedNorm === q.norm)) ? 1 : 0;
      const fullNodeBonus = (!exactName && nodeCov >= 0.99 && cov >= 0.5) ? 0.16 : 0;
      const rel = (bm / maxTheo) * (0.6 + 0.4 * cov) + (exactName ? 0.35 : 0) + fullNodeBonus;
      res.push({ node: n, score: +bm.toFixed(3), rel: +rel.toFixed(3), cov: +cov.toFixed(3), nodeCov: +nodeCov.toFixed(3), exactName });
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

  function resolveInSubject(tree, subject, input) {
    const lessons = (input.lessons || []).filter(Boolean);
    const topic = input.topic || '';

    // Caso dedicado: Resoluções do CONTRAN (20363) por número da resolução
    if (subject.id === 20363) {
      const combined = [...lessons, topic].join(' ');
      const nums = Array.from(new Set(Array.from(combined.matchAll(/\b(?:res(?:olu[cç][aã]o)?\.?\s*(?:contran\s*)?(?:n[º°.]?\s*)?)?(\d{2,4})(?:\s*\/\s*\d{2,4})?\b/gi)).map(m => m[1])));
      const matchedNodes = [];
      for (const num of nums) {
        const hit = subject.nodes.find(n => new RegExp(`^res\\.?\\s*0*${num.replace(/^0+/, '')}(?:\\b|\\/|\\.)`, 'i').test(n.name.replace(/\b(\d)\.(\d{3})\b/g, '$1$2')));
        if (hit && !matchedNodes.some(x => x.id === hit.id)) matchedNodes.push(hit);
      }
      if (matchedNodes.length > 0) {
        const ids = matchedNodes.map(n => n.id);
        return {
          subject: { id: subject.id, name: subject.name },
          ids,
          reason: 'resolução CONTRAN identificada pelo número',
          confidence: 'alta',
          anchorAmbiguous: false,
          alternatives: [],
          anchor: { id: matchedNodes[0].id, name: matchedNodes[0].name },
          picks: matchedNodes.map(n => ({ id: n.id, name: n.name, path: n.path.map(p => (subject.byId.get(p) || {}).name || subject.name) })),
          log: { anchors: [], subtopics: [] }
        };
      }
    }

    const exclude = new Set();
    [subject.name, input.subjectName].filter(Boolean).forEach(s => canon(s).tokens.forEach(t => exclude.add(t)));
    Object.keys(SUBJECT_ALIASES).filter(k => SUBJECT_ALIASES[k] === subject.id && k.split(' ').length <= 4)
      .forEach(k => canon(k).tokens.forEach(t => exclude.add(t)));
    const subs = filterAndRankBizusSubtopics(input.subtopics || [], [...lessons, topic], input.maxSubtopics || 10);
    const log = { anchors: [], subtopics: [] };

    // 1) Âncora: título da aula / tópico (com limpeza de ruído + variantes de siglas)
    const rawAnchorInputs = [
      ...lessons.map(t => ({ text: t, isLesson: true })),
      ...(topic ? [{ text: topic, isLesson: false }] : []),
    ];
    const anchorQuerySpecs = [];
    for (const item of rawAnchorInputs) {
      const cleaned = cleanAnchorQuery(item.text);
      const candidates = [item.text, cleaned, ...expandQueryVariants(cleaned)].filter(Boolean);
      const seenNorm = new Set();
      for (const cand of candidates) {
        const n = norm(cand);
        if (!n || seenNorm.has(n)) continue;
        seenNorm.add(n);
        anchorQuerySpecs.push({ query: cand, isLesson: item.isLesson, isTopic: !item.isLesson });
      }
    }

    let anchorRank = [];
    for (const spec of anchorQuerySpecs) {
      const r = score(subject, spec.query, { excludeTokens: exclude });
      for (const x of r) {
        const ex = anchorRank.find(y => y.node.id === x.node.id);
        if (ex) {
          if (spec.isLesson) ex.fromLesson = true;
          if (spec.isTopic) ex.fromTopic = true;
          if (x.rel > ex.rel || (x.rel === ex.rel && x.cov > ex.cov)) {
            ex.rel = x.rel;
            ex.cov = x.cov;
            ex.nodeCov = x.nodeCov;
            ex.score = x.score;
            ex.exactName = Math.max(ex.exactName || 0, x.exactName || 0);
          }
        } else {
          anchorRank.push({
            ...x,
            fromLesson: spec.isLesson,
            fromTopic: spec.isTopic,
          });
        }
      }
    }
    anchorRank.sort((a, b) => b.rel - a.rel || a.node.depth - b.node.depth);

    // desempate pela evidência dos subtópicos
    const top = anchorRank.slice(0, 6);
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
    log.anchors = top.map(c => ({ id: c.node.id, name: c.node.name, rel: c.rel, cov: c.cov, evidence: c.evidence, final: c.final }));

    let anchor = null, anchorAmbiguous = false;
    const duplicateTwinIds = [];
    if (top[0] && top[0].rel >= 0.52 && top[0].cov >= 0.5) {
      let chosen = top[0];
      const top0NameNorm = norm(chosen.node.name);
      // Resolve empates contra irmãos idênticos ou relação ancestral-descendente
      for (let i = 1; i < top.length; i++) {
        const rival = top[i];
        if (chosen.final >= rival.final * 1.12) break;
        const rivalNameNorm = norm(rival.node.name);
        if (rivalNameNorm === top0NameNorm) {
          if (!isAncestor(subject, chosen.node.id, rival.node.id) && !isAncestor(subject, rival.node.id, chosen.node.id)) {
            duplicateTwinIds.push(rival.node.id);
          }
          continue;
        }
        if (isAncestor(subject, chosen.node.id, rival.node.id)) {
          // chosen é pai de rival: se rival casou especificamente na aula (e chosen só no tópico), prefere rival
          if (rival.fromLesson && !chosen.fromLesson && rival.cov >= 0.6) {
            chosen = rival;
          }
          continue;
        }
        if (isAncestor(subject, rival.node.id, chosen.node.id)) {
          // rival é pai de chosen: se chosen casou na aula, mantém chosen; senão prefere o pai
          if (!chosen.fromLesson && rival.fromTopic) {
            chosen = rival;
          }
          continue;
        }
        anchorAmbiguous = true;
        break;
      }
      if (!anchorAmbiguous) {
        anchor = chosen;
      }
    }

    // 2) Subtópicos: dentro do escopo da âncora; fora dele só com confiança alta
    const picks = [];
    const scope = anchor ? descendantsOf(subject, anchor.node.id) : null;
    const scopedExclude = anchor ? new Set([...exclude, ...anchor.node.tokens]) : exclude;
    const splitEnum = (txt) => String(txt || '').split(/\s*(?:,|;|\be\b|\bou\b)\s*/i).map(x => x.trim()).filter(x => canon(x).tokens.length >= 1);

    const tryQuery = (q, isPart = false) => {
      let chosen = null, where = null, amb = false, scopedTop = [], globalTop = [];
      if (scope && scope.size) {
        const rr = score(subject, q, { scope, excludeTokens: scopedExclude });
        const pk = pickBest(rr, { minRel: 0.6, minCov: 0.5 });
        scopedTop = rr.slice(0, 3).map(x => `${x.node.name} [${x.rel}]`); amb = pk.ambiguous;
        if (pk.pick) { chosen = pk.pick; where = 'dentro-da-ancora'; }
      }
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
        const parts = splitEnum(sub.cleaned);
        if (parts.length >= 2) {
          let hit = 0; const got = [];
          for (const part of parts) {
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
    const outScope = picks.filter(p => p.where !== 'dentro-da-ancora');
    if (anchor) {
      const exactTitle = anchor.rel >= 1.2;
      if (!exactTitle && picks.length >= 1 && ratio >= 0.6) {
        ids = picks.map(p => p.node.id); reason = 'subassuntos cobrem o conteúdo (âncora ampla)';
      } else {
        ids = [anchor.node.id, ...duplicateTwinIds]; reason = exactTitle ? 'âncora exata (pasta cobre os filhos)' : 'âncora (pasta cobre os filhos)';
        outScope.forEach(p => ids.push(p.node.id));
      }
    } else {
      // Fallback para títulos enumerados ("Artigo e Adjetivo", "Regência Verbal e Nominal")
      const enumTargets = [...lessons, topic].map(cleanAnchorQuery).filter(Boolean);
      const enumPicks = [];
      for (const rawTitle of enumTargets) {
        const parts = expandEnumeratedTitle(rawTitle);
        if (parts.length < 2) continue;
        for (const part of parts) {
          const rr = score(subject, part, { excludeTokens: exclude });
          const best = rr[0];
          if (best && best.rel >= 0.6 && best.cov >= 0.6 && !enumPicks.some(x => x.node.id === best.node.id)) {
            enumPicks.push(best);
          }
        }
        if (enumPicks.length >= 2) break;
      }
      if (enumPicks.length >= 2) {
        ids = enumPicks.map(p => p.node.id);
        anchorAmbiguous = false;
        reason = 'título composto (múltiplos assuntos combinados)';
        enumPicks.forEach(p => addPick(p, 'titulo-composto', p.node.name));
      } else {
        ids = picks.map(p => p.node.id);
        reason = ids.length ? 'só subtópicos fortes (sem âncora)' : 'nada decidido';
      }
    }

    ids = Array.from(new Set(ids));
    const idSet = new Set(ids);
    ids = ids.filter(id => { let cur = subject.byId.get(id); while (cur && cur.parentId != null) { if (idSet.has(cur.parentId)) return false; cur = subject.byId.get(cur.parentId); } return true; });

    let confidence;
    if (anchor && !anchorAmbiguous) {
      confidence = anchor.rel >= 0.9 ? 'alta' : 'media';
    } else if (ids.length > 0 && !anchorAmbiguous && picks.length > 0 && picks.every(p => p.rel >= 0.85)) {
      confidence = picks.every(p => p.rel >= 0.95) ? 'alta' : 'media';
    } else {
      confidence = ids.length ? 'baixa' : 'nenhuma';
    }

    const needAlt = anchorAmbiguous || !ids.length || confidence === 'baixa';
    const alternatives = needAlt ? top.slice(0, 5).map(c => ({ id: c.node.id, name: c.node.name, path: c.node.path.map(p => (subject.byId.get(p) || {}).name || subject.name), final: c.final })) : [];
    return {
      subject: { id: subject.id, name: subject.name }, ids, reason, confidence, anchorAmbiguous, alternatives,
      anchor: anchor ? { id: anchor.node.id, name: anchor.node.name } : null,
      picks: ids.map(id => { const n = subject.byId.get(id); return { id, name: n.name, path: n.path.map(p => (subject.byId.get(p) || {}).name || subject.name) }; }),
      log
    };
  }

  function resolveLesson(tree, input) {
    const lessons = (input.lessons || []).filter(Boolean);
    const topic = input.topic || '';
    const subject = resolveSubject(tree, input.subjectName, [topic, ...lessons]);
    if (!subject) return { subject: null, ids: [], picks: [], confidence: 'nenhuma', reason: 'disciplina não identificada' };

    const primary = resolveInSubject(tree, subject, input);
    if ((primary.confidence === 'alta' || primary.confidence === 'media') && !primary.anchorAmbiguous && primary.ids.length > 0) {
      return primary;
    }

    const companions = COMPANION_SUBJECTS[subject.id] || [];
    for (const compId of companions) {
      const compSubject = tree.subjects.get(compId);
      if (!compSubject) continue;
      const compRes = resolveInSubject(tree, compSubject, input);
      if ((compRes.confidence === 'alta' || compRes.confidence === 'media') && !compRes.anchorAmbiguous && compRes.ids.length > 0) {
        return compRes;
      }
    }

    return primary;
  }

  // Ids reais do Caveira (examining-boards): CAVEIRA (Inéditas)=2, CEBRASPE=5, CAVEIRA (ADAPTADA)=12
  const BOARD_KEY_TO_ID = { caveira_ineditas: 2, cebraspe: 5, caveira_adaptadas: 12 };
  const BOARD_LABELS = { caveira_ineditas: 'Caveira Inéditas', cebraspe: 'CEBRASPE', caveira_adaptadas: 'Caveira Adaptadas' };
  // Ids reais do Caveira (difficulty_ids): 1=Em definição, 2=Muito fácil (80-100%), 3=Fácil (60-79%), 4=Médio (40-59%), 5=Difícil (20-39%), 6=Muito difícil (<20%)
  const DIFFICULTY_LABELS = {
    1: 'Em definição',
    2: 'Muito fácil',
    3: 'Fácil',
    4: 'Médio',
    5: 'Difícil',
    6: 'Muito difícil'
  };
  const DEFAULT_PREFS = { examBoards: ['cebraspe', 'caveira_ineditas', 'caveira_adaptadas'], numberAlternatives: [2], difficultyIds: [] };

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
  function sanitizeDifficultyIds(list) {
    const out = [];
    for (const v of Array.isArray(list) ? list : []) {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 1 && n <= 6 && !out.includes(n)) out.push(n);
    }
    return out.sort((a, b) => a - b);
  }
  function describePrefs(keys, alts, diffIds) {
    const b = (Array.isArray(keys) ? keys : []).map(k => BOARD_LABELS[k]).filter(Boolean);
    const a = sanitizeAlternatives(alts).map(n => n === 2 ? 'Certo/Errado' : `${n} alternativas`);
    const d = sanitizeDifficultyIds(diffIds).map(id => DIFFICULTY_LABELS[id]).filter(Boolean);
    const parts = [b.length ? b.join(' + ') : 'qualquer banca', a.length ? a.join(' / ') : 'qualquer nº de alternativas'];
    if (d.length) parts.push(d.join(' + '));
    return parts.join(' • ');
  }

  // 4º argumento: string (status, compatível com v1.4) ou objeto { status, examBoards:[chaves], numberAlternatives:[2], difficultyIds:[2..6] }
  function buildUrl(origin, subjectId, ids, opts = 'not_resolved') {
    const o = (opts && typeof opts === 'object') ? opts : { status: opts };
    const status = o.status === undefined ? 'not_resolved' : o.status;
    const boardIds = boardKeysToIds(o.examBoards);
    const alts = sanitizeAlternatives(o.numberAlternatives);
    const diffIds = sanitizeDifficultyIds(o.difficultyIds);
    const p = new URLSearchParams({
      career_id: 'all', subject_ids: String(subjectId), subtopic_id: '', subtopic_ids: ids.join(','),
      number_alternatives: alts.join(','), raw_text: '', examining_board_ids: boardIds.join(','), book_ids: '', years: '', education_level_ids: '',
      situation: '', difficulty_ids: diffIds.join(','), status: status, question_id: '', ids: '', institution_ids: '',
      occupation_ids: '', has_comment: '', has_video: '', category_ids: ''
    });
    return `${origin || 'https://app.caveira.com'}/questions?${p.toString()}`;
  }

  const api = { loadTree, resolveSubject, resolveLesson, buildUrl, score, isLeafName, boardKeysToIds, sanitizeAlternatives, sanitizeDifficultyIds, describePrefs, BOARD_KEY_TO_ID, DIFFICULTY_LABELS, DEFAULT_PREFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.QGCaveiraResolver = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
