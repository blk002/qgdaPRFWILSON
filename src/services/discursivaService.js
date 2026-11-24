import { supabase } from '../lib/supabaseClient';
import { getSafeExternalUrl } from '../lib/safeUrl';

const LIVE_CACHE_KEY = 'qg_discursiva_live_cache_v1';

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

export function mapDbRowToRepertorio(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: String(row.id),
    eixo: VALID_EIXOS.has(row.eixo) ? row.eixo : 'seguranca_viaria',
    tipo: VALID_TIPOS.has(row.tipo) ? row.tipo : 'dado_oficial',
    titulo: String(row.titulo || '').trim(),
    fonte: String(row.fonte || '').trim(),
    fonteUrl: getSafeExternalUrl(row.fonte_url, ''),
    dataReferencia: row.data_referencia ? String(row.data_referencia) : null,
    aspectoTipico: String(row.aspecto_tipico || 'Atualidade / Repertório').trim(),
    resumo: String(row.resumo || '').trim(),
    comoUsar: String(row.como_usar || '').trim(),
    palavrasChave: Array.isArray(row.palavras_chave)
      ? row.palavras_chave.map((k) => String(k).trim()).filter(Boolean)
      : [],
    status: row.status || 'published',
    origem: row.origem || 'curado',
    publishedAt: row.published_at || row.created_at || null,
    createdAt: row.created_at || null,
    isLive: true
  };
}

function mapRepertorioToDbPayload(item, status = 'published', origem = 'admin') {
  const safeUrl = getSafeExternalUrl(item.fonteUrl || item.fonte_url || '', '');
  const nowIso = new Date().toISOString();
  return {
    id: String(item.id || `live_rep_${Date.now()}`),
    eixo: VALID_EIXOS.has(item.eixo) ? item.eixo : 'seguranca_viaria',
    tipo: VALID_TIPOS.has(item.tipo) ? item.tipo : 'dado_oficial',
    titulo: String(item.titulo || '').trim(),
    fonte: String(item.fonte || '').trim(),
    fonte_url: safeUrl || null,
    data_referencia: item.dataReferencia || item.data_referencia || null,
    aspecto_tipico: String(item.aspectoTipico || item.aspecto_tipico || 'Atualidade / Repertório').trim(),
    resumo: String(item.resumo || '').trim(),
    como_usar: String(item.comoUsar || item.como_usar || '').trim(),
    palavras_chave: Array.isArray(item.palavrasChave)
      ? item.palavrasChave.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
      : [],
    status,
    origem: item.origem || origem,
    published_at: status === 'published' ? (item.publishedAt || nowIso) : null
  };
}

export function readCachedLiveRepertorios() {
  try {
    const raw = localStorage.getItem(LIVE_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function writeCachedLiveRepertorios(items) {
  try {
    localStorage.setItem(
      LIVE_CACHE_KEY,
      JSON.stringify({ updatedAt: Date.now(), items })
    );
  } catch {
    // ignore storage quota errors
  }
}

function isMissingSchemaError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === '42883' ||
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist')
  );
}

export async function checkIsDiscursivaAdmin() {
  try {
    const { data, error } = await supabase.rpc('is_discursiva_admin');
    if (error) {
      return { isAdmin: false, schemaMissing: isMissingSchemaError(error) };
    }
    return { isAdmin: Boolean(data), schemaMissing: false };
  } catch {
    return { isAdmin: false, schemaMissing: false };
  }
}

export async function fetchLiveRepertorios({ includePending = false } = {}) {
  try {
    let query = supabase
      .from('discursiva_repertorios')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!includePending) {
      query = query.eq('status', 'published');
    } else {
      query = query.in('status', ['published', 'pending']);
    }

    const { data, error } = await query;

    if (error) {
      return {
        published: readCachedLiveRepertorios(),
        pending: [],
        connected: false,
        schemaMissing: isMissingSchemaError(error),
        error
      };
    }

    const mapped = (data || []).map(mapDbRowToRepertorio).filter(Boolean);
    const published = mapped.filter((item) => item.status === 'published');
    const pending = mapped.filter((item) => item.status === 'pending');

    writeCachedLiveRepertorios(published);

    return {
      published,
      pending,
      connected: true,
      schemaMissing: false,
      error: null
    };
  } catch (error) {
    return {
      published: readCachedLiveRepertorios(),
      pending: [],
      connected: false,
      schemaMissing: false,
      error
    };
  }
}

export function subscribeLiveRepertorios(onChange) {
  try {
    const channel = supabase
      .channel('discursiva-repertorios-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discursiva_repertorios' },
        () => {
          onChange?.();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore unsubscribe errors
      }
    };
  } catch {
    return () => {};
  }
}

export async function upsertLiveRepertorio(item, status = 'published', origem = 'admin') {
  const payload = mapRepertorioToDbPayload(item, status, origem);
  const { data, error } = await supabase
    .from('discursiva_repertorios')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return mapDbRowToRepertorio(data);
}

export async function approvePendingRepertorio(id) {
  const { data, error } = await supabase
    .from('discursiva_repertorios')
    .update({
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbRowToRepertorio(data);
}

export async function archiveLiveRepertorio(id) {
  const { error } = await supabase
    .from('discursiva_repertorios')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteLiveRepertorio(id) {
  const { error } = await supabase
    .from('discursiva_repertorios')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function seedBaseCatalogToSupabase(curatedList) {
  if (!Array.isArray(curatedList) || curatedList.length === 0) return 0;
  const nowIso = new Date().toISOString();
  const rows = curatedList.map((item) => ({
    id: item.id,
    eixo: item.eixo,
    tipo: item.tipo,
    titulo: item.titulo,
    fonte: item.fonte,
    fonte_url: null,
    data_referencia: null,
    aspecto_tipico: item.aspectoTipico || 'Fundamentação',
    resumo: item.resumo,
    como_usar: item.comoUsar,
    palavras_chave: Array.isArray(item.palavrasChave) ? item.palavrasChave : [],
    status: 'published',
    origem: 'curado',
    published_at: nowIso
  }));

  const { error } = await supabase
    .from('discursiva_repertorios')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

  if (error) throw error;
  return rows.length;
}
