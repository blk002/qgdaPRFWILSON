#!/usr/bin/env node
/**
 * Radar Automático de Repertórios Cebraspe PRF
 *
 * Monitora fontes oficiais brasileiras (RSS da Agência Brasil, Câmara dos Deputados,
 * Senado Federal e portais Gov.br), filtra notícias dos últimos 3 dias ligadas aos
 * 5 eixos temáticos da PRF e usa o SDK @google/genai para estruturar rascunhos
 * factuais no padrão Cebraspe, inserindo-os com status='pending' no Supabase
 * para aprovação em 1 clique no painel de curadoria do QG DA PRF.
 *
 * Uso local:
 *   node scripts/radar-discursiva.mjs           (grava pendentes no Supabase)
 *   node scripts/radar-discursiva.mjs --dry-run (apenas imprime os rascunhos)
 */

import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

const DRY_RUN = process.argv.includes('--dry-run');
const LOOKBACK_DAYS = Math.max(1, Math.min(14, Number(process.env.RADAR_LOOKBACK_DAYS || 3)));
const MAX_CANDIDATES_TO_ANALYZE = 18;
const MAX_DRAFTS_PER_RUN = 5;
const DEFAULT_GEMINI_MODELS = [
  'gemini-4-hydrogen',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];
const MAX_RETRIES_PER_MODEL = 3;
const RETRY_DELAYS_MS = [5000, 12000];

// Lista fechada (allowlist) de fontes oficiais e institucionais brasileiras
const OFFICIAL_FEEDS = [
  {
    name: 'Agência Brasil — Justiça',
    url: 'https://agenciabrasil.ebc.com.br/rss/justica/feed.xml',
    allowedHost: 'agenciabrasil.ebc.com.br'
  },
  {
    name: 'Agência Brasil — Geral',
    url: 'https://agenciabrasil.ebc.com.br/rss/geral/feed.xml',
    allowedHost: 'agenciabrasil.ebc.com.br'
  },
  {
    name: 'Agência Brasil — Direitos Humanos',
    url: 'https://agenciabrasil.ebc.com.br/rss/direitos-humanos/feed.xml',
    allowedHost: 'agenciabrasil.ebc.com.br'
  },
  {
    name: 'Agência Câmara — Segurança',
    url: 'https://www.camara.leg.br/noticias/rss/dinamico/SEGURANCA',
    allowedHost: 'www.camara.leg.br'
  },
  {
    name: 'Agência Câmara — Transporte e Trânsito',
    url: 'https://www.camara.leg.br/noticias/rss/dinamico/TRANSPORTE-E-TRANSITO',
    allowedHost: 'www.camara.leg.br'
  },
  {
    name: 'Agência Câmara — Meio Ambiente',
    url: 'https://www.camara.leg.br/noticias/rss/dinamico/MEIO-AMBIENTE',
    allowedHost: 'www.camara.leg.br'
  },
  {
    name: 'Agência Senado — Notícias',
    url: 'https://www12.senado.leg.br/noticias/feed/todasnoticias/RSS',
    allowedHost: 'www12.senado.leg.br'
  }
];

const PRF_RELEVANCE_TERMS = [
  'prf',
  'polícia rodoviária',
  'policia rodoviaria',
  'rodovia',
  'rodovias',
  'trânsito',
  'transito',
  'ctb',
  'contran',
  'senatran',
  'pnatrans',
  'sinistro',
  'sinistros',
  'acidente',
  'lei seca',
  'embriaguez',
  'velocidade',
  'segurança pública',
  'seguranca publica',
  'susp',
  'crime organizado',
  'narcotráfico',
  'narcotrafico',
  'tráfico de drogas',
  'trafico de drogas',
  'armas',
  'contrabando',
  'descaminho',
  'fronteira',
  'trabalho escravo',
  'trabalho análogo',
  'tráfico de pessoas',
  'trafico de pessoas',
  'exploração sexual',
  'exploracao sexual',
  'direitos humanos',
  'uso da força',
  'abuso de autoridade',
  'câmeras corporais',
  'cameras corporais',
  'inteligência policial',
  'sinesp',
  'reconhecimento facial',
  'lgpd',
  'crime ambiental',
  'crimes ambientais',
  'desmatamento',
  'ibama',
  'fauna',
  'garimpo',
  'produtos perigosos',
  'antt'
];

const VALID_EIXOS = new Set([
  'seguranca_viaria',
  'seguranca_publica',
  'direitos_humanos',
  'tecnologia_gestao',
  'meio_ambiente'
]);

const VALID_TIPOS = new Set([
  'legislacao',
  'politica_publica',
  'dado_oficial',
  'conceito_autor'
]);

function stripHtml(text) {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = block.match(regex);
  return match ? stripHtml(match[1]) : '';
}

function parseRssItems(xml, feedName) {
  const items = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const rawItem of itemMatches) {
    const title = extractTag(rawItem, 'title');
    const link = extractTag(rawItem, 'link');
    const description = extractTag(rawItem, 'description');
    const pubDateStr = extractTag(rawItem, 'pubDate') || extractTag(rawItem, 'dc:date');

    if (!title || !link) continue;

    let parsedUrl;
    try {
      parsedUrl = new URL(link);
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') continue;
    } catch {
      continue;
    }

    const parsedDate = pubDateStr ? new Date(pubDateStr) : new Date();
    const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    items.push({
      feedName,
      title,
      link: parsedUrl.href,
      description: description.slice(0, 700),
      pubDate: validDate
    });
  }
  return items;
}

function computeSourceHash(url) {
  return crypto.createHash('sha256').update(String(url).trim().toLowerCase()).digest('hex').slice(0, 32);
}

function scorePrfRelevance(item) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  let hits = 0;
  for (const term of PRF_RELEVANCE_TERMS) {
    if (haystack.includes(term)) hits += 1;
  }
  return hits;
}

async function fetchOfficialNews() {
  const cutoffMs = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const collected = [];

  for (const feed of OFFICIAL_FEEDS) {
    try {
      const parsedFeedUrl = new URL(feed.url);
      if (parsedFeedUrl.hostname !== feed.allowedHost || parsedFeedUrl.protocol !== 'https:') {
        continue;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(parsedFeedUrl.href, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'QG-PRF-Radar/1.0 (+https://github.com)'
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[Radar] Aviso ao ler ${feed.name}: HTTP ${response.status}`);
        continue;
      }

      const xml = await response.text();
      const items = parseRssItems(xml, feed.name);

      for (const item of items) {
        if (item.pubDate.getTime() < cutoffMs) continue;
        const relevanceScore = scorePrfRelevance(item);
        if (relevanceScore > 0) {
          collected.push({
            ...item,
            relevanceScore,
            sourceHash: computeSourceHash(item.link)
          });
        }
      }
    } catch (err) {
      console.warn(`[Radar] Falha ao consultar ${feed.name}: ${err.message}`);
    }
  }

  // Deduplica por sourceHash e ordena pelos mais relevantes e recentes
  const byHash = new Map();
  for (const item of collected) {
    const existing = byHash.get(item.sourceHash);
    if (!existing || item.relevanceScore > existing.relevanceScore) {
      byHash.set(item.sourceHash, item);
    }
  }

  return Array.from(byHash.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, MAX_CANDIDATES_TO_ANALYZE);
}

export function resolveGeminiModels(env = process.env) {
  const modelsEnv = String(env.GEMINI_MODELS || '').trim();
  const singleEnv = String(env.GEMINI_MODEL || '').trim();

  let list;
  if (modelsEnv) {
    list = modelsEnv
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
  } else if (singleEnv) {
    list = [singleEnv, ...DEFAULT_GEMINI_MODELS];
  } else {
    list = [...DEFAULT_GEMINI_MODELS];
  }

  return Array.from(new Set(list));
}

export function classifyGeminiError(err) {
  const status = Number(err?.status ?? err?.code ?? 0);
  const msg = String(err?.message || err || '');

  if (/API_KEY_INVALID|API key not valid|invalid api key/i.test(msg)) {
    return 'fatal';
  }

  if (
    [429, 500, 502, 503, 504].includes(status) ||
    /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|DEADLINE_EXCEEDED|high demand|overloaded|try again later|fetch failed|ETIMEDOUT|ECONNRESET/i.test(
      msg
    )
  ) {
    return 'retryable';
  }

  return 'fallback';
}

export function parseDraftsFromRawJson(rawText, candidates) {
  const cleaned = String(rawText || '[]')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  const drafts = [];
  const seenHashes = new Set();

  for (const item of parsed) {
    if (drafts.length >= MAX_DRAFTS_PER_RUN) break;

    const idx = Number(item?.candidateIndex) - 1;
    const candidate = candidates[idx];
    if (!candidate || seenHashes.has(candidate.sourceHash)) continue;

    const eixo = VALID_EIXOS.has(item.eixo) ? item.eixo : 'seguranca_publica';
    const tipo = VALID_TIPOS.has(item.tipo) ? item.tipo : 'dado_oficial';

    const titulo = String(item.titulo || '').trim();
    const fonte = String(item.fonte || candidate.feedName).trim();
    const resumo = String(item.resumo || '').trim();
    const comoUsar = String(item.comoUsar || '').trim();

    if (!titulo || !resumo || !comoUsar) continue;

    seenHashes.add(candidate.sourceHash);
    drafts.push({
      id: `radar_${candidate.sourceHash.slice(0, 16)}`,
      eixo,
      tipo,
      titulo,
      fonte,
      fonte_url: candidate.link,
      data_referencia: candidate.pubDate.toISOString().slice(0, 10),
      aspecto_tipico: String(item.aspectoTipico || 'Atualidade oficial').trim(),
      resumo,
      como_usar: comoUsar,
      palavras_chave: Array.isArray(item.palavrasChave)
        ? item.palavrasChave
            .map((k) => String(k).trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 6)
        : [],
      status: 'pending',
      origem: 'radar',
      source_hash: candidate.sourceHash
    });
  }

  return drafts;
}

export async function callGeminiWithRetryAndFallback({
  generate,
  candidates,
  models = resolveGeminiModels(),
  maxRetries = MAX_RETRIES_PER_MODEL,
  retryDelaysMs = RETRY_DELAYS_MS,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  logger = console
}) {
  const errors = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await generate(model);
        const drafts = parseDraftsFromRawJson(response?.text || '[]', candidates);
        logger.log(`[Radar Discursiva PRF] Curadoria concluída via modelo: ${model}`);
        return drafts;
      } catch (err) {
        const errMsg = String(err?.message || err);
        errors.push(`${model}#${attempt}: ${errMsg}`);

        if (err instanceof SyntaxError) {
          logger.warn(
            `[Radar Discursiva PRF] JSON inválido do modelo ${model} (tentativa ${attempt}/${maxRetries}).`
          );
          if (attempt < maxRetries) {
            await sleep(retryDelaysMs[attempt - 1] ?? 5000);
            continue;
          }
          break;
        }

        const kind = classifyGeminiError(err);
        if (kind === 'fatal') {
          throw err;
        }

        if (kind === 'retryable' && attempt < maxRetries) {
          const delay =
            retryDelaysMs[attempt - 1] ?? retryDelaysMs[retryDelaysMs.length - 1] ?? 5000;
          logger.warn(
            `[Radar Discursiva PRF] Modelo ${model} indisponível (tentativa ${attempt}/${maxRetries}). Nova tentativa em ${Math.round(delay / 1000)}s...`
          );
          await sleep(delay);
          continue;
        }

        logger.warn(
          `[Radar Discursiva PRF] Modelo ${model} falhou (${kind}): ${errMsg.slice(0, 180)}. Tentando próximo modelo...`
        );
        break;
      }
    }
  }

  throw new Error(
    `Todos os modelos Gemini falharam (${models.join(', ')}). Último erro: ${errors[errors.length - 1] || 'desconhecido'}`
  );
}

async function synthesizeRepertoriosWithGemini(candidates) {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const newsBlock = candidates
    .map(
      (c, idx) =>
        `[${idx + 1}] Fonte: ${c.feedName} | Data: ${c.pubDate.toISOString().slice(0, 10)} | URL: ${c.link}\nTítulo: ${c.title}\nResumo: ${c.description}`
    )
    .join('\n\n');

  const prompt = `Analise as notícias oficiais brasileiras abaixo e selecione NO MÁXIMO ${MAX_DRAFTS_PER_RUN} itens que realmente sirvam como repertório factual, jurídico ou estatístico de alto valor para uma redação discursiva da banca Cebraspe para a Polícia Rodoviária Federal (PRF).

Regras obrigatórias:
- Ignore fofocas políticas, notas protocolares sem dado concreto, eventos locais irrelevantes ou assuntos fora dos 5 eixos da PRF.
- Só aproveite uma notícia se ela trouxer nova lei/projeto relevante aprovado, política pública concreta, decisão relevante ou dado oficial aproveitável em prova.
- NÃO invente números, artigos de lei ou estatísticas que não estejam explicitamente no texto fornecido.
- Use exatamente o candidateIndex (1 a ${candidates.length}) correspondente à notícia escolhida.
- Escreva "comoUsar" em português formal, objetivo, em ordem direta (estilo Cebraspe, 2 a 4 linhas), pronto para adaptar em parágrafo de desenvolvimento.

Notícias coletadas:
${newsBlock}`;

  const config = {
    systemInstruction:
      'Você é um curador especialista em provas discursivas da banca Cebraspe para o concurso da Polícia Rodoviária Federal (PRF). Seja extremamente rigoroso com precisão factual e utilidade para redação.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          candidateIndex: { type: Type.INTEGER },
          eixo: {
            type: Type.STRING,
            description:
              'Um dentre: seguranca_viaria, seguranca_publica, direitos_humanos, tecnologia_gestao, meio_ambiente'
          },
          tipo: {
            type: Type.STRING,
            description:
              'Um dentre: legislacao, politica_publica, dado_oficial, conceito_autor'
          },
          titulo: { type: Type.STRING },
          fonte: { type: Type.STRING },
          aspectoTipico: { type: Type.STRING },
          resumo: { type: Type.STRING },
          comoUsar: { type: Type.STRING },
          palavrasChave: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: [
          'candidateIndex',
          'eixo',
          'tipo',
          'titulo',
          'fonte',
          'aspectoTipico',
          'resumo',
          'comoUsar',
          'palavrasChave'
        ]
      }
    }
  };

  return callGeminiWithRetryAndFallback({
    candidates,
    models: resolveGeminiModels(),
    generate: (model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config
      })
  });
}

function normalizeSupabaseUrl(rawUrl) {
  const cleaned = String(rawUrl || '').trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned) return '';

  // Se o usuário colou a URL do painel do Supabase (ex.: https://supabase.com/dashboard/project/<ref>/...)
  const dashboardMatch = cleaned.match(/supabase\.com\/dashboard\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  try {
    const withProto = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    const parsed = new URL(withProto);
    return parsed.origin;
  } catch {
    return cleaned.replace(/\/+(rest|auth|storage|realtime)\/v1\/?.*$/i, '').replace(/\/+$/, '');
  }
}

async function main() {
  console.log(`[Radar Discursiva PRF] Iniciando varredura dos últimos ${LOOKBACK_DAYS} dias...`);

  const candidates = await fetchOfficialNews();
  console.log(`[Radar Discursiva PRF] ${candidates.length} notícias oficiais relevantes encontradas.`);

  if (candidates.length === 0) {
    console.log('[Radar Discursiva PRF] Nenhum candidato novo no período. Encerrando.');
    return;
  }

  let supabase = null;
  let newCandidates = candidates;

  if (!DRY_RUN) {
    const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
    const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '')
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas secrets para gravar no Supabase.');
    }

    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const hashes = candidates.map((c) => c.sourceHash);
    const { data: existingRows, error: existingErr } = await supabase
      .from('discursiva_repertorios')
      .select('source_hash')
      .in('source_hash', hashes);

    if (existingErr) {
      throw new Error(`Erro ao checar duplicatas no Supabase: ${existingErr.message}`);
    }

    const existingSet = new Set((existingRows || []).map((r) => r.source_hash));
    newCandidates = candidates.filter((c) => !existingSet.has(c.sourceHash));
    console.log(`[Radar Discursiva PRF] ${newCandidates.length} notícias inéditas para curadoria IA.`);

    if (newCandidates.length === 0) {
      console.log('[Radar Discursiva PRF] Todas as notícias do período já foram processadas.');
      return;
    }
  }

  const drafts = await synthesizeRepertoriosWithGemini(newCandidates);
  console.log(`[Radar Discursiva PRF] ${drafts.length} rascunhos de alto valor estruturados.`);

  if (drafts.length === 0) return;

  if (DRY_RUN) {
    console.log(JSON.stringify(drafts, null, 2));
    return;
  }

  const { error: upsertErr } = await supabase
    .from('discursiva_repertorios')
    .upsert(drafts, { onConflict: 'source_hash', ignoreDuplicates: true });

  if (upsertErr) {
    throw new Error(`Erro ao inserir rascunhos no Supabase: ${upsertErr.message}`);
  }

  console.log(`[Radar Discursiva PRF] ${drafts.length} rascunhos enviados para a fila de aprovação (status='pending').`);
}

const isMainModule =
  Boolean(process.argv[1]) &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  main().catch((err) => {
    console.error('[Radar Discursiva PRF] Erro fatal:', err.message);
    process.exit(1);
  });
}
