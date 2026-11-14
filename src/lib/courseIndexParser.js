export function normalizeCourseLookupKey(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-–—:|/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCourseIndexLineText(rawLine) {
  let line = String(rawLine || '').trim();
  if (!line) return '';

  // Remove timestamps no início: [00:01:42], (00:01:42), 00:01:42 -
  line = line
    .replace(/^[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*[-–—:|]*\s*/, '')
    .replace(/^(?:[-•*●▪◦]|\d+[.)-])\s+/, '')
    .trim();

  if (!line) return '';

  // Correções comuns de transcrição automática/abreviações em cursos (ex.: "ADEMI Pública", "ADM Pública")
  line = line
    .replace(/\bademi\s+publica\b/gi, 'Administração Pública')
    .replace(/\bademi\b/gi, 'Administração')
    .replace(/\badm\.?\s+publica\b/gi, 'Administração Pública')
    .replace(/\badm\.?\b/gi, 'Administração')
    .replace(/\bconst\.?\s+federal\b/gi, 'Constituição Federal')
    .replace(/\bcf\b(?=\s|$|[.,])/gi, 'Constituição Federal')
    .replace(/\bctb\b(?=\s|$|[.,])/gi, 'Código de Trânsito Brasileiro')
    .replace(/\s+/g, ' ')
    .trim();

  return line;
}

const GENERIC_EXACT_LINES = new Set([
  'introducao',
  'apresentacao',
  'abertura',
  'encerramento',
  'conclusao',
  'finalizacao',
  'consideracoes finais',
  'duvidas',
  'recados',
  'avisos',
  'revisao',
  'resumo',
  'exercicios',
  'questoes',
  'simulado',
  'inicio',
  'fim',
  'boas vindas'
]);

const LEADING_FILLER_REGEX = /^(?:conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das)|aspectos?\s+(?:gerais|iniciais|principais)\s+(?:de|da|do|dos|das)|vis[aã]o\s+geral\s+(?:de|da|do)|entendendo\s+(?:a|o|as|os)|compreendendo\s+(?:a|o|as|os)|o\s+que\s+[eé])\s+/i;

const BROAD_PREFIX_REGEX = /^(?:organiza[cç][aã]o\s+(?:da|do|de)|conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das))\s+/i;

const PURE_ARTICLE_LINE_REGEX = /^(?:revoga[cç][aã]o\s+(?:do|da|dos|das)\s+|leitura\s+(?:do|da|dos|das)\s+|coment[aá]rios?\s+(?:ao|sobre|do|dos)\s+|an[aá]lise\s+(?:do|dos)\s+)?art(?:igo)?s?\.?\s*(\d+)/i;

const EXPLICIT_LAW_MENTION_REGEX = /\b(?:eca|ctb|lep|lia|jecrim|orcrim|sinarm|sisnad|lbi|henry borel|maria da penha|estatuto|constituicao|codigo)\b|\blei\s+(?:n[oº°.]?\s*)?\d|\b\d{1,2}\.\d{3}\b/i;

export function buildBroadContextSet(contextNames = []) {
  const broad = new Set();
  for (const name of (Array.isArray(contextNames) ? contextNames : [contextNames])) {
    const raw = String(name || '').trim();
    if (!raw) continue;
    const stripped = raw
      .replace(/\s*[-–—]\s*(?:parte|aula|bloco|modulo)\s*\d+\s*$/i, '')
      .trim();
    for (const candidate of [raw, stripped]) {
      const norm = normalizeCourseLookupKey(candidate);
      if (norm) broad.add(norm);
      let cur = candidate;
      for (let i = 0; i < 2; i++) {
        const next = cur.replace(BROAD_PREFIX_REGEX, '').trim();
        const nextNorm = normalizeCourseLookupKey(next);
        if (nextNorm && nextNorm !== normalizeCourseLookupKey(cur)) {
          broad.add(nextNorm);
          cur = next;
        } else {
          break;
        }
      }
    }
  }
  return broad;
}

export function parseCourseIndexSubtopics(rawText, contextNames = []) {
  const input = String(rawText || '').trim();
  if (!input) return [];

  // Caso timestamps venham colados na mesma linha, separa antes de cada [mm:ss]
  const normalizedBlock = input.replace(/([^\n])\s*(\[\d{1,2}:\d{2}(?::\d{2})?\])/g, '$1\n$2');
  const rawLines = normalizedBlock.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Junta linhas em que o timestamp ficou sozinho numa linha e o título veio na linha seguinte
  const mergedLines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const cur = rawLines[i];
    if (/^[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?$/.test(cur) && i + 1 < rawLines.length) {
      mergedLines.push(`${cur} ${rawLines[i + 1]}`);
      i += 1;
    } else {
      mergedLines.push(cur);
    }
  }

  const broadContext = buildBroadContextSet(contextNames);
  const results = [];
  const seenNorm = new Set();

  for (const rawLine of mergedLines) {
    // Descarta abas/ruídos comuns caso o usuário copie a caixa inteira da página
    const rawNorm = normalizeCourseLookupKey(rawLine);
    if (
      !rawNorm ||
      rawNorm === 'indice' ||
      rawNorm === 'charlie' ||
      rawNorm === 'bizus' ||
      rawNorm === 'arquivos' ||
      rawNorm === 'comentarios'
    ) {
      continue;
    }

    const hadIntroPrefix = /^(?:[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*)?introdu[cç][aã]o\b/i.test(rawLine);
    let cleaned = normalizeCourseIndexLineText(rawLine);
    if (!cleaned) continue;

    let norm = normalizeCourseLookupKey(cleaned);
    if (
      !norm ||
      norm.length < 3 ||
      GENERIC_EXACT_LINES.has(norm) ||
      /^(?:parte|aula|bloco|modulo)\s*\d+$/.test(norm) ||
      broadContext.has(norm)
    ) {
      continue;
    }

    const artMatch = cleaned.match(PURE_ARTICLE_LINE_REGEX);
    if (artMatch) {
      const artNum = artMatch[1];
      const isLandmarkArticle = ['5', '37', '144'].includes(artNum);
      const normPlain = normalizeCourseLookupKey(cleaned);
      if (!isLandmarkArticle && !EXPLICIT_LAW_MENTION_REGEX.test(normPlain)) {
        continue;
      }
    }

    // Remove prefixos genéricos preservando o núcleo técnico (ex.: "Conceitos de Concentração..." -> "Concentração...")
    const strippedCore = cleaned.replace(LEADING_FILLER_REGEX, '').trim();
    const strippedNorm = normalizeCourseLookupKey(strippedCore);
    if (strippedCore && strippedNorm.length >= 4) {
      // Evita resquício isolado de introdução humorística tipo "Introdução à Dilmona" -> "Dilmona" (apenas 1 palavra desconhecida)
      if (hadIntroPrefix && strippedNorm.split(' ').length === 1 && strippedNorm.length < 10) {
        continue;
      }
      cleaned = strippedCore;
      norm = strippedNorm;
    }

    if (
      !norm ||
      norm.length < 3 ||
      GENERIC_EXACT_LINES.has(norm) ||
      broadContext.has(norm)
    ) {
      continue;
    }

    // Remove prefixo isolado de sigla muito curta se repetido, ou capitaliza primeira letra
    const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    if (!seenNorm.has(norm)) {
      seenNorm.add(norm);
      results.push(formatted);
    }
  }

  return results;
}

export function findMatchingCourseIndexEntry({
  manualIndexMap = {},
  extensionCache = null,
  lessonNames = [],
  topicName = ''
} = {}) {
  const candidates = [...(Array.isArray(lessonNames) ? lessonNames : []), topicName].filter(Boolean);
  const byLesson = extensionCache?.byLesson && typeof extensionCache.byLesson === 'object'
    ? extensionCache.byLesson
    : {};

  // 1. Correspondência direta por nome exato normalizado (manual primeiro, depois extensão)
  for (const name of candidates) {
    const key = normalizeCourseLookupKey(name);
    if (!key) continue;
    if (manualIndexMap[key]?.rawIndexText) {
      return { source: 'manual', ...manualIndexMap[key] };
    }
    if (byLesson[key]?.rawIndexText) {
      return { source: 'extension', ...byLesson[key] };
    }
  }

  // 2. Correspondência parcial por prefixo/parte normalizada (ex.: "Parte 01" / "Parte 1")
  const canonicalizeLesson = (s) =>
    normalizeCourseLookupKey(s)
      .replace(/\bparte\s*0*(\d+)\b/g, 'parte $1')
      .replace(/\baula\s*0*(\d+)\b/g, 'aula $1')
      .trim();

  const candCanonical = candidates.map(canonicalizeLesson).filter(Boolean);
  const allMaps = [
    { source: 'manual', map: manualIndexMap },
    { source: 'extension', map: byLesson }
  ];

  for (const { source, map } of allMaps) {
    for (const [k, entry] of Object.entries(map || {})) {
      if (!entry?.rawIndexText) continue;
      const entryCanon = canonicalizeLesson(entry.lessonTitle || k);
      if (!entryCanon) continue;
      if (candCanonical.some(c => c === entryCanon || (c.length >= 10 && entryCanon.includes(c)) || (entryCanon.length >= 10 && c.includes(entryCanon)))) {
        return { source, ...entry };
      }
    }
  }

  return null;
}
