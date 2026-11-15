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
    .replace(/^(?:[-•*●▪◦]|\d{1,2}\s*[.)\-–—])\s+/, '')
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
  'boas vindas',
  'bizus da aula',
  'resumo da aula',
  'topicos da aula',
  'assuntos da aula',
  'pontos importantes',
  'quadro resumo',
  'mapa mental'
]);

const LEADING_FILLER_REGEX = /^(?:(?:diferen[cç]as?|distin[cç][aã]o|compara[cç][aã]o)\s+entre|comparativo\s+(?:entre|de|da|do)|quadro\s+comparativo\s+(?:entre|de|da|do)|rela[cç][aã]o\s+entre|conceitos?\s+e\s+caracter[ií]sticas\s+(?:de|da|do|dos|das)|conceitos?\s+(?:de|da|do|dos|das|sobre)|defini[cç][aã]o\s+(?:de|da|do|dos|das)|defini[cç][oõ]es\s+(?:de|da|do|dos|das)|resumo\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das)|aspectos?\s+(?:gerais|iniciais|principais)\s+(?:de|da|do|dos|das)|vis[aã]o\s+geral\s+(?:de|da|do)|entendendo\s+(?:a|o|as|os)|compreendendo\s+(?:a|o|as|os)|o\s+que\s+[eé])\s+/i;

const BROAD_PREFIX_REGEX = /^(?:organiza[cç][aã]o\s+(?:da|do|de)|conceitos?\s+(?:de|da|do|dos|das|sobre)|no[cç][oõ]es?\s+(?:de|da|do|dos|das|gerais\s+de)|introdu[cç][aã]o\s+(?:[aà]|ao|aos|[aà]s|de|sobre)|estrutura\s+(?:da|do|de|dos|das))\s+/i;

const PURE_ARTICLE_LINE_REGEX = /^(?:revoga[cç][aã]o\s+(?:do|da|dos|das)\s+|leitura\s+(?:do|da|dos|das)\s+|coment[aá]rios?\s+(?:ao|sobre|do|dos)\s+|an[aá]lise\s+(?:do|dos)\s+)?art(?:igo)?s?\.?\s*(\d+)/i;

const PROSE_NOTE_PREFIX_REGEX = /^(?:obs(?:erva[cç][aã]o)?|aten[cç][aã]o|cuidado|dica|bizu|ex(?:emplo)?|stf|stj|s[uú]mula|importante)\s*[:\-–]/i;

const EXPLICIT_LAW_MENTION_REGEX = /\b(?:eca|ctb|lep|lia|jecrim|orcrim|sinarm|sisnad|lbi|henry borel|maria da penha|estatuto|constituicao|codigo)\b|\blei\s+(?:n[oº°.]?\s*)?\d|\b\d{1,2}\.\d{3}\b/i;

const COURSE_SPECIAL_LAW_PATTERNS = [
  { id: 'eca', test: (norm) => /\beca\b/.test(norm) || norm.includes('crianca e do adolescente') || norm.includes('crianca e o adolescente') || norm.includes('estatuto da crianca') || norm.includes('8.069') || norm.includes('8069') },
  { id: 'henry_borel', test: (norm) => norm.includes('henry borel') || norm.includes('14.344') || norm.includes('14344') },
  { id: 'escuta_especializada', test: (norm) => norm.includes('escuta especializada') || norm.includes('depoimento especial') || norm.includes('13.431') || norm.includes('13431') },
  { id: 'drogas', test: (norm) => /\bdrogas?\b|\bsisnad\b|entorpecente/.test(norm) || norm.includes('11.343') || norm.includes('11343') },
  { id: 'desarmamento', test: (norm) => norm.includes('desarmamento') || /\barmas?\b/.test(norm) || norm.includes('sinarm') || norm.includes('10.826') || norm.includes('10826') },
  { id: 'abuso_autoridade', test: (norm) => norm.includes('abuso de autoridade') || norm.includes('13.869') || norm.includes('13869') },
  { id: 'tortura', test: (norm) => norm.includes('tortura') || norm.includes('9.455') || norm.includes('9455') },
  { id: 'hediondos', test: (norm) => norm.includes('hediondo') || norm.includes('8.072') || norm.includes('8072') },
  { id: 'orcrim', test: (norm) => norm.includes('organizacao criminosa') || norm.includes('organizacoes criminosas') || /\borcrim\b/.test(norm) || norm.includes('12.850') || norm.includes('12850') },
  { id: 'maria_da_penha', test: (norm) => norm.includes('maria da penha') || (norm.includes('violencia domestica') && /\bmulher(?:es)?\b/.test(norm)) || norm.includes('feminicidio') || norm.includes('11.340') || norm.includes('11340') },
  { id: 'crimes_ambientais', test: (norm) => norm.includes('meio ambiente') || norm.includes('ambienta') || norm.includes('9.605') || norm.includes('9605') },
  { id: 'interceptacao', test: (norm) => norm.includes('interceptacao') || norm.includes('9.296') || norm.includes('9296') },
  { id: 'jecrim', test: (norm) => norm.includes('juizado') || /\bjecrim\b/.test(norm) || norm.includes('9.099') || norm.includes('9099') },
  { id: 'lavagem', test: (norm) => norm.includes('lavagem') || norm.includes('9.613') || norm.includes('9613') },
  { id: 'racismo', test: (norm) => norm.includes('racismo') || norm.includes('7.716') || norm.includes('7716') },
  { id: 'lep', test: (norm) => /\blep\b/.test(norm) || norm.includes('execucao penal') || norm.includes('7.210') || norm.includes('7210') },
  { id: 'prisao_temporaria', test: (norm) => norm.includes('prisao temporaria') || norm.includes('7.960') || norm.includes('7960') },
  { id: 'idoso', test: (norm) => norm.includes('idoso') || norm.includes('pessoa idosa') || norm.includes('10.741') || norm.includes('10741') },
  { id: 'anticrime', test: (norm) => norm.includes('pacote anticrime') || /\banticrime\b/.test(norm) || norm.includes('13.964') || norm.includes('13964') },
  { id: 'igualdade_racial', test: (norm) => norm.includes('igualdade racial') || norm.includes('12.288') || norm.includes('12288') },
  { id: 'pcd', test: (norm) => norm.includes('pessoa com deficiencia') || /\blbi\b/.test(norm) || norm.includes('13.146') || norm.includes('13146') },
  { id: 'ctb', test: (norm) => /\bctb\b/.test(norm) || norm.includes('codigo de transito') || norm.includes('9.503') || norm.includes('9503') },
  { id: 'lia', test: (norm) => /\blia\b/.test(norm) || norm.includes('improbidade administrativa') || norm.includes('8.429') || norm.includes('8429') }
];

function getCourseContextLawIds(rawText) {
  const norm = normalizeCourseLookupKey(rawText);
  if (!norm) return [];
  const ids = [];
  for (const rule of COURSE_SPECIAL_LAW_PATTERNS) {
    if (rule.test(norm) && !ids.includes(rule.id)) {
      ids.push(rule.id);
    }
  }
  const lawRegex = /\blei\s+(?:n[oº°.]?\s*)?(\d{1,2}\.?\d{3})\b/gi;
  let match;
  while ((match = lawRegex.exec(norm)) !== null) {
    const digits = match[1].replace(/\D/g, '');
    if (digits.length >= 4 && digits.length <= 5) {
      const key = `lei_${digits}`;
      if (!ids.includes(key)) ids.push(key);
    }
  }
  return ids;
}

export function buildBroadContextSet(contextNames = []) {
  const broad = new Set();
  for (const name of (Array.isArray(contextNames) ? contextNames : [contextNames])) {
    const raw = String(name || '').trim();
    if (!raw) continue;
    const stripped = raw
      .replace(/\s*[-–—]\s*(?:parte|aula|bloco|modulo)\s*\d+\s*$/i, '')
      .trim();
    for (const candidate of [raw, stripped]) {
      if (getCourseContextLawIds(candidate).length > 0) continue;
      const norm = normalizeCourseLookupKey(candidate);
      if (norm) broad.add(norm);
      let cur = candidate;
      for (let i = 0; i < 2; i++) {
        const next = cur.replace(BROAD_PREFIX_REGEX, '').trim();
        const nextNorm = normalizeCourseLookupKey(next);
        if (nextNorm && nextNorm !== normalizeCourseLookupKey(cur)) {
          if (getCourseContextLawIds(next).length === 0) {
            broad.add(nextNorm);
          }
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

  // Junta linhas em que o timestamp ou número (ex.: "1.") ficou sozinho numa linha e o título veio na linha seguinte
  const mergedLines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const cur = rawLines[i];
    if (
      (/^[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?$/.test(cur) || /^\d{1,2}\s*[.)\-–—]$/.test(cur)) &&
      i + 1 < rawLines.length
    ) {
      mergedLines.push(`${cur} ${rawLines[i + 1]}`);
      i += 1;
    } else {
      mergedLines.push(cur);
    }
  }

  // Modo Bizus numerado (ex.: "1. Desconcentração", "2. Descentralização" copiado com explicações e bullets):
  // mantém apenas as linhas numeradas dos títulos de assunto e descarta parágrafos/bullets explicativos.
  const hasTimestamps = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(input);
  const isNumberedBizusFormat =
    !hasTimestamps &&
    mergedLines.some(l => /^\s*\d{1,2}\s*[.)\-–—]\s+[A-Za-zÀ-ÿ]/.test(l));
  const linesToProcess = isNumberedBizusFormat
    ? mergedLines.filter(l => /^\s*\d{1,2}\s*[.)\-–—]\s+\S+/.test(l))
    : mergedLines;

  const broadContext = buildBroadContextSet(contextNames);
  const contextText = (Array.isArray(contextNames) ? contextNames : [contextNames]).filter(Boolean).join(' ');
  const mainLawIds = new Set(getCourseContextLawIds(contextText));
  const results = [];
  const seenNorm = new Set();

  for (const rawLine of linesToProcess) {
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

    const hadIntroPrefix = /^(?:[\[(]?\d{1,2}:\d{2}(?::\d{2})?[\])]?\s*|\d{1,2}\s*[.)\-–—]\s*)?introdu[cç][aã]o\b/i.test(rawLine);
    let cleaned = normalizeCourseIndexLineText(rawLine);
    if (!cleaned) continue;

    if (PROSE_NOTE_PREFIX_REGEX.test(cleaned)) continue;

    if (isNumberedBizusFormat) {
      let didTruncateColon = false;
      const colonIdx = cleaned.indexOf(':');
      if (colonIdx > 2 && colonIdx < cleaned.length - 1) {
        const beforeColon = cleaned.slice(0, colonIdx).trim();
        const afterColon = cleaned.slice(colonIdx + 1).trim();
        const afterWords = afterColon.split(/\s+/).filter(Boolean).length;
        if (normalizeCourseLookupKey(beforeColon).length >= 3 && (afterColon.length > 25 || afterWords > 4)) {
          cleaned = beforeColon;
          didTruncateColon = true;
        }
      }
      if (!didTruncateColon) {
        const dashMatch = cleaned.match(/^(.+?)\s+[-–—]\s+(.+)$/);
        if (dashMatch) {
          const beforeDash = dashMatch[1].trim();
          const afterDash = dashMatch[2].trim();
          const beforeNorm = normalizeCourseLookupKey(beforeDash);
          const afterWords = afterDash.split(/\s+/).filter(Boolean).length;
          if (
            beforeNorm.length >= 4 &&
            !PURE_ARTICLE_LINE_REGEX.test(beforeDash) &&
            !LEADING_FILLER_REGEX.test(beforeDash) &&
            !GENERIC_EXACT_LINES.has(beforeNorm) &&
            !PROSE_NOTE_PREFIX_REGEX.test(beforeDash) &&
            (afterDash.length > 35 || afterWords > 6)
          ) {
            cleaned = beforeDash;
          }
        }
      }
      cleaned = cleaned.replace(/\s*\([^()]{28,}\)\s*$/g, '').trim();
      cleaned = cleaned.replace(/[:;.\-–—]+$/g, '').trim();
      if (!cleaned) continue;
    }

    if (cleaned.length > 85 || (/\.\s*$/.test(cleaned) && cleaned.split(/\s+/).length > 8)) {
      continue;
    }

    if (mainLawIds.size > 0) {
      const lineLawIds = getCourseContextLawIds(cleaned);
      if (lineLawIds.some(id => !mainLawIds.has(id))) {
        continue;
      }
    }

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
    const manualRaw = manualIndexMap[key]?.bizusRawText || manualIndexMap[key]?.rawIndexText;
    if (manualRaw) {
      return { source: 'manual', ...manualIndexMap[key], rawIndexText: manualRaw };
    }
    const extRaw = byLesson[key]?.bizusRawText || byLesson[key]?.rawIndexText;
    if (extRaw) {
      return { source: 'extension', ...byLesson[key], rawIndexText: extRaw };
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
      const entryRaw = entry?.bizusRawText || entry?.rawIndexText;
      if (!entryRaw) continue;
      const entryCanon = canonicalizeLesson(entry.lessonTitle || k);
      if (!entryCanon) continue;
      if (candCanonical.some(c => c === entryCanon || (c.length >= 10 && entryCanon.includes(c)) || (entryCanon.length >= 10 && c.includes(entryCanon)))) {
        return { source, ...entry, rawIndexText: entryRaw };
      }
    }
  }

  return null;
}
