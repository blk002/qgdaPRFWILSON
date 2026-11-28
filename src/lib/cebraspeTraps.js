// Motor de Impressão Digital da Pegadinha Cebraspe (#2)
// Identifica termos restritivos, exceções, vedações e absolutos nos enunciados e mede a taxa pessoal de erro.

export const CEBRASPE_TRAP_PATTERNS = [
  { id: 'exclusivamente', label: 'exclusivamente', category: 'Restrição', regex: /\bexclusivamente\b/gi },
  { id: 'somente', label: 'somente', category: 'Restrição', regex: /\bsomente\b/gi },
  { id: 'apenas', label: 'apenas', category: 'Restrição', regex: /\bapenas\b/gi },
  { id: 'unicamente', label: 'unicamente', category: 'Restrição', regex: /\bunicamente\b/gi },
  { id: 'isoladamente', label: 'isoladamente', category: 'Restrição', regex: /\bisoladamente\b/gi },

  { id: 'salvo', label: 'salvo', category: 'Exceção', regex: /\bsalvo\b/gi },
  { id: 'exceto', label: 'exceto', category: 'Exceção', regex: /\bexceto\b/gi },
  { id: 'ressalvado', label: 'ressalvado(a)', category: 'Exceção', regex: /\bressalvad[oa]s?\b/gi },
  { id: 'em_regra', label: 'em regra', category: 'Exceção', regex: /\bem\s+regra\b/gi },
  { id: 'ainda_que', label: 'ainda que', category: 'Exceção', regex: /\bainda\s+que\b/gi },
  { id: 'mesmo_que', label: 'mesmo que', category: 'Exceção', regex: /\bmesmo\s+que\b/gi },

  { id: 'vedado', label: 'vedado(a)', category: 'Vedação / Dever', regex: /\bvedad[oa]s?\b/gi },
  { id: 'proibido', label: 'proibido(a)', category: 'Vedação / Dever', regex: /\bproibid[oa]s?\b/gi },
  { id: 'obrigatorio', label: 'obrigatório(a)', category: 'Vedação / Dever', regex: /\bobrigat[óo]ri[oa]s?\b/gi },
  { id: 'obrigatoriamente', label: 'obrigatoriamente', category: 'Vedação / Dever', regex: /\bobrigatoriamente\b/gi },
  { id: 'facultativo', label: 'facultativo(a)', category: 'Vedação / Dever', regex: /\bfacultativ[oa]s?\b/gi },
  { id: 'nao_admite', label: 'não admite/cabe', category: 'Vedação / Dever', regex: /\bn[ãa]o\s+(?:admite|comporta|permite|cabe)\b/gi },
  { id: 'sob_pena_de', label: 'sob pena de', category: 'Vedação / Dever', regex: /\bsob\s+pena\s+de\b/gi },

  { id: 'prescindivel', label: 'prescindível', category: 'Dispensa / Condição', regex: /\bprescind[íi]ve(?:l|is)\b/gi },
  { id: 'imprescindivel', label: 'imprescindível', category: 'Dispensa / Condição', regex: /\bimprescind[íi]ve(?:l|is)\b/gi },
  { id: 'independe', label: 'independe', category: 'Dispensa / Condição', regex: /\bindepende(?:m|r|ndo)?\b/gi },
  { id: 'independentemente', label: 'independentemente', category: 'Dispensa / Condição', regex: /\bindependentemente\b/gi },
  { id: 'dispensa', label: 'dispensa', category: 'Dispensa / Condição', regex: /\bdispensa(?:m|da|do|ndo|r)?\b/gi },
  { id: 'suficiente', label: 'suficiente / bastando', category: 'Dispensa / Condição', regex: /\b(?:suficiente|bastando)\b/gi },
  { id: 'automaticamente', label: 'automaticamente', category: 'Dispensa / Condição', regex: /\bautomaticamente\b/gi },

  { id: 'sempre', label: 'sempre', category: 'Universalidade / Rol', regex: /\bsempre\b/gi },
  { id: 'nunca', label: 'nunca', category: 'Universalidade / Rol', regex: /\bnunca\b/gi },
  { id: 'jamais', label: 'jamais', category: 'Universalidade / Rol', regex: /\bjamais\b/gi },
  { id: 'qualquer_hipotese', label: 'em qualquer hipótese', category: 'Universalidade / Rol', regex: /\bem\s+qualquer\s+hip[óo]tese\b/gi },
  { id: 'nenhuma_hipotese', label: 'em nenhuma hipótese', category: 'Universalidade / Rol', regex: /\bem\s+nenhuma\s+hip[óo]tese\b/gi },
  { id: 'todos_os_casos', label: 'em todos os casos', category: 'Universalidade / Rol', regex: /\bem\s+todos\s+os\s+casos\b/gi },
  { id: 'taxativo', label: 'taxativo(a)', category: 'Universalidade / Rol', regex: /\btaxativ[oa]s?\b/gi },
  { id: 'exemplificativo', label: 'exemplificativo(a)', category: 'Universalidade / Rol', regex: /\bexemplificativ[oa]s?\b/gi },
];

export function detectTrapTermsInText(rawText) {
  const text = typeof rawText === 'string' ? rawText : String(rawText || '');
  if (!text) return [];

  const found = [];
  for (const pat of CEBRASPE_TRAP_PATTERNS) {
    const rx = new RegExp(pat.regex.source, pat.regex.flags);
    const matches = [];
    let m;
    while ((m = rx.exec(text)) !== null) {
      if (!m[0]) break;
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
      });
      if (matches.length >= 12) break;
    }
    if (matches.length > 0) {
      found.push({
        id: pat.id,
        label: pat.label,
        category: pat.category,
        matches,
      });
    }
  }
  return found;
}

function classifyRiskLevel(errors, total, errorRate) {
  if (errors === 0) return 'dominado';
  if (errors >= 2 && errorRate >= 65) return 'critico';
  if (errorRate >= 50) return 'alerta';
  return 'monitorando';
}

export function buildTrapFingerprint(questions = []) {
  const list = Array.isArray(questions) ? questions : [];
  const termMap = new Map();
  let totalQuestionsAnalyzed = 0;
  let totalTrapQuestions = 0;
  let trapErrors = 0;
  let nonTrapQuestions = 0;
  let nonTrapErrors = 0;

  for (const q of list) {
    if (!q || !q.content) continue;
    totalQuestionsAnalyzed += 1;
    const isError = !q.hit;
    const detected = detectTrapTermsInText(q.content);

    if (detected.length > 0) {
      totalTrapQuestions += 1;
      if (isError) trapErrors += 1;
    } else {
      nonTrapQuestions += 1;
      if (isError) nonTrapErrors += 1;
    }

    const subjName = q.canonicalSubject || q.subject || 'Geral';
    for (const term of detected) {
      let stat = termMap.get(term.id);
      if (!stat) {
        stat = {
          id: term.id,
          label: term.label,
          category: term.category,
          total: 0,
          errors: 0,
          hits: 0,
          subjectsSet: new Set(),
          questionIds: [],
          errorQuestionIds: [],
        };
        termMap.set(term.id, stat);
      }
      stat.total += 1;
      if (isError) {
        stat.errors += 1;
        if (q.id) stat.errorQuestionIds.push(q.id);
      } else {
        stat.hits += 1;
      }
      stat.subjectsSet.add(subjName);
      if (q.id) stat.questionIds.push(q.id);
    }
  }

  const terms = Array.from(termMap.values())
    .map((stat) => {
      const errorRate = stat.total > 0 ? Math.round((stat.errors / stat.total) * 100) : 0;
      return {
        id: stat.id,
        label: stat.label,
        category: stat.category,
        total: stat.total,
        errors: stat.errors,
        hits: stat.hits,
        errorRate,
        riskLevel: classifyRiskLevel(stat.errors, stat.total, errorRate),
        subjects: Array.from(stat.subjectsSet),
        questionIds: stat.questionIds,
        errorQuestionIds: stat.errorQuestionIds,
      };
    })
    .sort((a, b) => {
      const aHasErr = a.errors > 0 ? 0 : 1;
      const bHasErr = b.errors > 0 ? 0 : 1;
      if (aHasErr !== bHasErr) return aHasErr - bHasErr;
      if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate;
      if (b.errors !== a.errors) return b.errors - a.errors;
      return b.total - a.total;
    });

  const overallTrapErrorRate =
    totalTrapQuestions > 0 ? Math.round((trapErrors / totalTrapQuestions) * 100) : 0;
  const overallNonTrapErrorRate =
    nonTrapQuestions > 0 ? Math.round((nonTrapErrors / nonTrapQuestions) * 100) : 0;
  const trapPenaltyDelta =
    totalTrapQuestions > 0 && nonTrapQuestions > 0
      ? overallTrapErrorRate - overallNonTrapErrorRate
      : 0;

  return {
    terms,
    totalQuestionsAnalyzed,
    totalTrapQuestions,
    overallTrapErrorRate,
    overallNonTrapErrorRate,
    trapPenaltyDelta,
  };
}

export function matchTextTrapsAgainstFingerprint(rawText, fingerprint) {
  const terms = Array.isArray(fingerprint?.terms) ? fingerprint.terms : [];
  if (!rawText || terms.length === 0) return [];

  const statById = new Map(terms.map((t) => [t.id, t]));
  const detected = detectTrapTermsInText(rawText);
  const dangerHits = [];

  for (const d of detected) {
    const stat = statById.get(d.id);
    if (!stat || stat.errors < 1 || stat.errorRate < 50) continue;
    dangerHits.push({
      id: stat.id,
      label: stat.label,
      category: stat.category,
      total: stat.total,
      errors: stat.errors,
      errorRate: stat.errorRate,
      riskLevel: stat.riskLevel,
      matches: d.matches,
    });
  }

  return dangerHits.sort((a, b) => b.errorRate - a.errorRate || b.errors - a.errors);
}

export function splitTextByTrapMatches(rawText, matchedTerms = []) {
  const text = typeof rawText === 'string' ? rawText : String(rawText || '');
  if (!text) return [];
  const list = Array.isArray(matchedTerms) ? matchedTerms : [];
  if (list.length === 0) return [{ text, trap: null }];

  const rawSpans = [];
  for (const term of list) {
    for (const m of term.matches || []) {
      if (Number.isFinite(m.start) && Number.isFinite(m.end) && m.end > m.start) {
        rawSpans.push({ start: m.start, end: m.end, trap: term });
      }
    }
  }

  if (rawSpans.length === 0) return [{ text, trap: null }];

  rawSpans.sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlapping = [];
  let cursor = 0;
  for (const sp of rawSpans) {
    if (sp.start < cursor) continue;
    nonOverlapping.push(sp);
    cursor = sp.end;
  }

  const segments = [];
  let pos = 0;
  for (const sp of nonOverlapping) {
    if (sp.start > pos) {
      segments.push({ text: text.slice(pos, sp.start), trap: null });
    }
    segments.push({ text: text.slice(sp.start, sp.end), trap: sp.trap });
    pos = sp.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), trap: null });
  }
  return segments;
}
