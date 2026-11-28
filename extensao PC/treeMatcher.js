// QG da PRF — Tree Matcher & BM25 Local (v1.3.0)
// Módulo compartilhado para normalização (Romanos<->Arábicos), filtro de ruído do Bizus e ranking BM25 sobre a árvore do Caveira.

(function (root) {
  const ROMAN_MAP = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
    xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20
  };

  const STOP_WORDS = new Set([
    'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'na', 'no', 'nas', 'nos',
    'para', 'por', 'com', 'sem', 'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'ao', 'aos', 'a', 'as', 'se', 'ou', 'que', 'sobre', 'entre', 'ate', 'sob'
  ]);

  const NOISE_SUBTOPICS = [
    /^revis[oõ]es?\s*(e\s*anota[cç][oõ]es\s*pessoais)?$/i,
    /^anota[cç][oõ]es\s*(pessoais)?$/i,
    /^introdu[cç][aã]o(\s+ao\s+tema|\s+geral)?$/i,
    /^resumo(\s+geral|\s+final|\s+da\s+aula)?$/i,
    /^dicas?\s*(de\s+prova|finais|importantes)?$/i,
    /^quest[oõ]es\s*(comentadas|de\s+prova|in[eé]ditas)?$/i,
    /^encerramento$/i,
    /^apresenta[cç][aã]o$/i,
    /^boas\s+vindas$/i,
    /^bibliografia$/i,
    /^considera[cç][oõ]es\s*(iniciais|finais)$/i
  ];

  const DIDACTIC_PREFIX_REGEX = /^(?:estudo\s+(?:do|da|dos|das|de)|defini[cç][oõ]es\s+(?:de|da|do|das|dos)|no[cç][oõ]es\s+(?:de|da|do|das|dos|sobre)|conceitos?\s+(?:de|da|do|das|dos)|introdu[cç][aã]o\s+(?:a|ao|[àa]s|aos|de|da|do)|aspectos\s+(?:gerais|introdut[oó]rios)\s+(?:de|da|do|das|dos)|vis[aã]o\s+geral\s+(?:de|da|do))\s+/i;

  function stripAccentsLower(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function romanToArabicInText(str) {
    // Substitui numerais romanos em contextos estruturais ou isolados (ex: "anexo i" -> "anexo 1", "capitulo iv" -> "capitulo 4")
    return String(str || '').replace(
      /\b(anexo|capitulo|secao|subsecao|titulo|livro|parte|inciso|tabela|quadro)\s+(xx|xix|xviii|xvii|xvi|xv|xiv|xiii|xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/gi,
      (_, prefix, rom) => `${prefix} ${ROMAN_MAP[rom.toLowerCase()] || rom}`
    );
  }

  function singularizePtWord(w) {
    if (!w || w.length < 4) return w;
    if (w === 'leis') return 'lei';
    if (w.endsWith('oes')) return w.slice(0, -3) + 'ao';
    if (w.endsWith('aes')) return w.slice(0, -3) + 'ao';
    if (w.endsWith('eis') && w.length >= 5) return w.slice(0, -3) + 'el';
    if (w.endsWith('is') && w.length >= 5) return w.slice(0, -2) + 'l';
    if (/(?:r|z|n|l)es$/.test(w) && w.length >= 6) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
    return w;
  }

  function stemPtWord(w) {
    if (!w || w.length < 4) return w;
    const s = singularizePtWord(w);
    const suffixes = [
      'amentos', 'amento', 'imentos', 'imento', 'acoes', 'acao', 'icoes', 'icao',
      'ada', 'ida', 'ar', 'er', 'ir'
    ];
    for (const suf of suffixes) {
      if (s.length > suf.length + 3 && s.endsWith(suf)) {
        const candidate = s.slice(0, -suf.length);
        if (candidate.length >= 4) return candidate;
      }
    }
    return s;
  }

  function canon(text) {
    let s = stripAccentsLower(text);
    s = s
      .replace(/\b(\d{1,2})\.(\d{3})\b/g, '$1$2')
      .replace(/\/(?:19|20)(\d{2})\b/g, ' $1')
      .replace(/\bn[º°.]?\s*(?=\d)/g, '')
      .replace(/(\d+)\s*[º°ª]/g, '$1')
      .replace(/[_|/\\–—-]+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    s = romanToArabicInText(s);

    const rawTokens = s.split(' ').filter(Boolean);
    const tokens = [];
    const stems = [];
    for (const tok of rawTokens) {
      if (STOP_WORDS.has(tok)) continue;
      if (tok.length === 1 && !/^\d$/.test(tok)) continue;
      const sing = singularizePtWord(tok);
      tokens.push(sing);
      stems.push(stemPtWord(sing));
    }
    return {
      norm: s,
      tokens,
      tokenSet: new Set(tokens),
      stems,
      stemSet: new Set(stems)
    };
  }

  function isLeafArticleLabel(label) {
    const s = stripAccentsLower(label).replace(/^[\s_]+/, '').trim();
    return /^(?:art\.?|§|paragrafo|inciso|alinea)\b/.test(s);
  }

  function isNoiseSubtopic(text) {
    const raw = String(text || '').trim();
    if (!raw || raw.length < 3) return true;
    const noAcc = stripAccentsLower(raw).replace(/\s+/g, ' ').trim();
    return NOISE_SUBTOPICS.some(rx => rx.test(raw) || rx.test(noAcc));
  }

  function cleanDidacticPrefix(text) {
    let s = String(text || '').trim();
    let prev = '';
    while (s !== prev) {
      prev = s;
      s = s.replace(DIDACTIC_PREFIX_REGEX, '').trim();
    }
    return s;
  }

  function filterAndRankBizusSubtopics(subtopics, anchorTitles = [], maxCount = 6) {
    const list = Array.isArray(subtopics) ? subtopics : [];
    const anchorTokens = new Set();
    for (const a of (Array.isArray(anchorTitles) ? anchorTitles : [anchorTitles])) {
      canon(a).tokens.forEach(t => anchorTokens.add(t));
    }

    const candidates = [];
    for (const raw of list) {
      if (isNoiseSubtopic(raw)) continue;
      const cleaned = cleanDidacticPrefix(raw);
      if (isNoiseSubtopic(cleaned)) continue;
      const c = canon(cleaned);
      if (c.tokens.length === 0) continue;

      const sharedWithAnchor = c.tokens.filter(t => anchorTokens.has(t)).length;
      const level = sharedWithAnchor > 0 ? 'B' : 'C';
      const weight = level === 'B' ? 0.75 + Math.min(0.2, sharedWithAnchor * 0.08) : 0.35;
      candidates.push({
        raw: String(raw).trim(),
        cleaned,
        tokens: c.tokens,
        tokenSet: c.tokenSet,
        level,
        weight
      });
    }

    // Ordena por peso (B antes de C) e especificidade (mais tokens informativos)
    candidates.sort((a, b) => (b.weight - a.weight) || (b.tokens.length - a.tokens.length));

    // Deduplicação por similaridade (> 70% de interseção)
    const selected = [];
    for (const cand of candidates) {
      const isDup = selected.some(sel => {
        let inter = 0;
        for (const t of cand.tokenSet) {
          if (sel.tokenSet.has(t)) inter += 1;
        }
        const minSize = Math.min(cand.tokenSet.size, sel.tokenSet.size);
        return minSize > 0 && (inter / minSize) >= 0.72;
      });
      if (!isDup) {
        selected.push(cand);
        if (selected.length >= maxCount) break;
      }
    }
    return selected;
  }

  function buildBm25Index(rawNodes) {
    const nodes = [];
    const df = new Map();
    const stemDf = new Map();
    let totalLen = 0;

    for (const item of (Array.isArray(rawNodes) ? rawNodes : [])) {
      const label = typeof item === 'string' ? item : (item?.label || '');
      if (!label || isLeafArticleLabel(label)) continue;
      const c = canon(label);
      const uniqueTokens = Array.from(c.tokenSet);
      for (const tok of uniqueTokens) {
        df.set(tok, (df.get(tok) || 0) + 1);
      }
      for (const st of Array.from(c.stemSet)) {
        stemDf.set(st, (stemDf.get(st) || 0) + 1);
      }
      totalLen += c.tokens.length;
      nodes.push({
        label,
        norm: (typeof item === 'object' && item?.norm) ? item.norm : c.norm,
        romanNorm: c.norm,
        tokens: c.tokens,
        tokenSet: c.tokenSet,
        stems: c.stems,
        stemSet: c.stemSet,
        isLeaf: isLeafArticleLabel(label)
      });
    }

    const N = Math.max(1, nodes.length);
    const avgLen = totalLen / N || 1;
    const idf = new Map();
    for (const [tok, freq] of df.entries()) {
      idf.set(tok, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
    }
    const stemIdf = new Map();
    for (const [st, freq] of stemDf.entries()) {
      stemIdf.set(st, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
    }

    return { N, avgLen, df, idf, stemIdf, nodes };
  }

  function scoreTreeNodesBm25(queryText, index, opts = {}) {
    if (!index || !Array.isArray(index.nodes) || index.nodes.length === 0) return [];
    let q = canon(queryText);
    if (opts.excludeTokens instanceof Set && opts.excludeTokens.size > 0 && q.tokens.length > 1) {
      const keptIdx = [];
      for (let i = 0; i < q.tokens.length; i++) {
        if (!opts.excludeTokens.has(q.tokens[i])) keptIdx.push(i);
      }
      if (keptIdx.length > 0) {
        q = {
          norm: keptIdx.map(i => q.tokens[i]).join(' '),
          tokens: keptIdx.map(i => q.tokens[i]),
          tokenSet: new Set(keptIdx.map(i => q.tokens[i])),
          stems: keptIdx.map(i => q.stems[i]),
          stemSet: new Set(keptIdx.map(i => q.stems[i]))
        };
      }
    }
    if (q.tokens.length === 0) return [];

    const k1 = 1.2;
    const b = 0.5;
    const queryWantsArticle = isLeafArticleLabel(queryText) || /\bart(?:igo)?\s*\d+/i.test(String(queryText || ''));
    const excludeNorms = opts.excludeNorms instanceof Set ? opts.excludeNorms : null;

    // Identifica termos raros da query presentes no vocabulário da árvore
    const queryTokenIdfs = q.tokens.map(tok => ({
      tok,
      idf: index.idf.get(tok) || 0,
      df: index.df.get(tok) || 0
    }));
    const knownIdfs = queryTokenIdfs.filter(x => x.df > 0).map(x => x.idf);
    const maxIdf = knownIdfs.length > 0 ? Math.max(...knownIdfs) : 0;
    const rareTokens = queryTokenIdfs.filter(x => x.df > 0 && x.idf >= maxIdf * 0.65).map(x => x.tok);

    const results = [];
    const maxTheoreticalIdf = q.tokens.reduce((acc, tok, qi) => {
      const stIdf = (index.stemIdf && q.stems[qi]) ? (index.stemIdf.get(q.stems[qi]) || 0) : 0;
      return acc + Math.max(index.idf.get(tok) || 0, stIdf, 0.6);
    }, 0) || 1;
    for (const node of index.nodes) {
      if (excludeNorms && excludeNorms.has(node.norm)) continue;

      let bm25 = 0;
      let matchedCount = 0;
      let matchedRare = 0;

      for (let qi = 0; qi < q.tokens.length; qi++) {
        const tok = q.tokens[qi];
        const qStem = q.stems[qi];
        const exactHit = node.tokenSet.has(tok);
        const stemHit = !exactHit && qStem && node.stemSet && node.stemSet.has(qStem);
        if (!exactHit && !stemHit) continue;

        matchedCount += 1;
        if (rareTokens.includes(tok)) matchedRare += 1;
        const stIdf = (index.stemIdf && qStem) ? (index.stemIdf.get(qStem) || 0) : 0;
        const tokIdf = exactHit ? (index.idf.get(tok) || 0.5) : Math.max(stIdf, 0.5);
        const tf = exactHit
          ? node.tokens.filter(t => t === tok).length
          : node.stems.filter(st => st === qStem).length;
        const denom = tf + k1 * (1 - b + b * (node.tokens.length / index.avgLen));
        const stemFactor = exactHit ? 1.0 : 0.85;
        bm25 += tokIdf * ((tf * (k1 + 1)) / (denom || 1)) * stemFactor;
      }

      if (matchedCount === 0) continue;

      // Exige cobertura de pelo menos 1 termo raro quando a query possui termos raros conhecidos
      if (rareTokens.length > 0 && matchedRare === 0) continue;

      // Bônus por substring exata após normalização romano<->arábico
      let phraseBonus = 0;
      if (node.romanNorm === q.norm) {
        phraseBonus = 8;
      } else if (q.norm.length >= 6 && node.romanNorm.includes(q.norm)) {
        phraseBonus = 4;
      } else if (node.romanNorm.length >= 6 && q.norm.includes(node.romanNorm)) {
        phraseBonus = 3;
      }

      // Penalidade leve para folhas (Art. X) quando a query não pediu artigo específico
      const leafPenalty = (!queryWantsArticle && node.isLeaf) ? 0.55 : 1.0;

      const coverage = matchedCount / q.tokens.length;
      const minCov = typeof opts.minCoverage === 'number' ? opts.minCoverage : (q.tokens.length >= 3 ? 0.35 : 0.25);
      if (coverage < minCov) continue;

      const finalScore = (bm25 + phraseBonus) * (0.65 + 0.35 * coverage) * leafPenalty;
      const relScore = (bm25 / maxTheoreticalIdf) + (phraseBonus > 0 ? 0.35 : 0);

      results.push({
        node,
        score: Number(finalScore.toFixed(3)),
        relScore: Number(relScore.toFixed(3)),
        coverage: Number(coverage.toFixed(3)),
        matchedRare
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  const api = {
    canon,
    romanToArabicInText,
    isLeafArticleLabel,
    isNoiseSubtopic,
    cleanDidacticPrefix,
    filterAndRankBizusSubtopics,
    buildBm25Index,
    scoreTreeNodesBm25
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.QGCaveiraTreeMatcher = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
