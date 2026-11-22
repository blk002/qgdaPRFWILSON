import { createClient } from '@supabase/supabase-js';
import {
  getPendingOutbox,
  clearOutboxSeqs,
  bulkUpsertQuestionsFull,
  mergeQuestionRecords,
  getMeta,
  setMeta,
} from '../db/extensionDb.js';

const CLOUD_AUTH_KEY = 'qg_cloud_auth';
const DIRECT_SYNC_LAST_KEY = 'qg_last_direct_cloud_sync';
const SYNC_MODE_KEY = 'qg_sync_mode';
const FILTER_ID_MEMORY_KEY = 'qg_caveira_filter_id_memory_v1';

const QG_URL_PATTERNS = [
  'https://blk002.github.io/*',
  'http://localhost:*/*',
  'http://127.0.0.1:*/*',
];

let cachedClient = null;
let cachedTokenKey = '';
let hasIncrementalTable = null; // null = não testado | true | false
let isFlushing = false;
let isPulling = false;

async function getValidCloudContext() {
  const store = await chrome.storage.local.get([CLOUD_AUTH_KEY, 'qg_active_user_id']);
  const auth = store?.[CLOUD_AUTH_KEY];
  const activeUserId = store?.qg_active_user_id || auth?.userId;
  if (!auth || !auth.supabaseUrl || !auth.anonKey || !auth.userId || (!auth.accessToken && !auth.refreshToken)) {
    return null;
  }
  if (activeUserId && activeUserId !== auth.userId) return null;

  let token = auth.accessToken;
  const nowSec = Math.floor(Date.now() / 1000);
  if ((!token || (auth.expiresAt && nowSec >= Number(auth.expiresAt) - 60)) && auth.refreshToken) {
    try {
      const refreshRes = await fetch(`${auth.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: auth.anonKey,
        },
        body: JSON.stringify({ refresh_token: auth.refreshToken }),
      });
      if (!refreshRes.ok) return null;
      const refreshed = await refreshRes.json();
      if (!refreshed?.access_token) return null;
      token = refreshed.access_token;
      await chrome.storage.local.set({
        [CLOUD_AUTH_KEY]: {
          ...auth,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || auth.refreshToken,
          expiresAt: refreshed.expires_at || (nowSec + (Number(refreshed.expires_in) || 3600)),
          updatedAt: Date.now(),
        },
      });
    } catch (_) {
      return null;
    }
  }

  if (!token) return null;
  const tokenKey = `${auth.supabaseUrl}|${auth.userId}|${token}`;
  if (!cachedClient || cachedTokenKey !== tokenKey) {
    cachedClient = createClient(auth.supabaseUrl, auth.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    cachedTokenKey = tokenKey;
  }

  return { supabase: cachedClient, userId: auth.userId, auth };
}

async function detectIncrementalTable(supabase) {
  if (hasIncrementalTable !== null) return hasIncrementalTable;
  try {
    const { error } = await supabase.from('caveira_question_events').select('question_id').limit(1);
    if (!error) {
      hasIncrementalTable = true;
      return true;
    }
    hasIncrementalTable = false;
    return false;
  } catch (_) {
    hasIncrementalTable = false;
    return false;
  }
}

async function syncOutboxIncrementalRows(supabase, userId, outboxRows) {
  if (!(await detectIncrementalTable(supabase))) return false;
  if (!outboxRows || outboxRows.length === 0) return true;

  const latestByQId = new Map();
  outboxRows.forEach((row) => {
    if (row.entityType === 'question_upsert' || row.entityType === 'question_delete') {
      latestByQId.set(row.entityId, row);
    }
  });
  if (latestByQId.size === 0) return true;

  const upsertRows = [];
  const deleteIds = [];
  latestByQId.forEach((row) => {
    if (row.entityType === 'question_delete') {
      deleteIds.push(row.entityId);
    } else {
      upsertRows.push({
        user_id: userId,
        question_id: row.entityId,
        action: 'upsert',
        payload: row.payload || {},
        updated_at: row.payload?.updatedAt || row.createdAt || new Date().toISOString(),
      });
    }
  });

  if (upsertRows.length > 0) {
    const { error } = await supabase
      .from('caveira_question_events')
      .upsert(upsertRows, { onConflict: 'user_id,question_id' });
    if (error) return false;
  }

  if (deleteIds.length > 0) {
    const { error } = await supabase
      .from('caveira_question_events')
      .delete()
      .eq('user_id', userId)
      .in('question_id', deleteIds);
    if (error) return false;
  }

  return true;
}

export async function flushOutboxToSupabase({ onlyWhenQgClosed = true } = {}) {
  if (isFlushing) return { flushed: 0, mode: 'busy' };
  isFlushing = true;
  try {
    const ctx = await getValidCloudContext();
    if (!ctx) return { flushed: 0, mode: 'unauthenticated' };
    const { supabase, userId } = ctx;

    const pending = await getPendingOutbox(userId);
    const openQg = chrome.tabs ? await chrome.tabs.query({ url: QG_URL_PATTERNS }) : [];
    const qgIsOpen = Boolean(openQg && openQg.length > 0);

    // 1. Se a tabela incremental existir, envia apenas o delta leve mesmo com o QG aberto
    const incrementalOk = await syncOutboxIncrementalRows(supabase, userId, pending);

    // 2. Se o QG está fechado (ou forçado), aplica o delta de questões + memória de filtros em profiles.full_data
    if (qgIsOpen && onlyWhenQgClosed) {
      if (incrementalOk && pending.length > 0) {
        await clearOutboxSeqs(pending.map((r) => r.seq));
        await chrome.storage.local.set({
          [DIRECT_SYNC_LAST_KEY]: Date.now(),
          [SYNC_MODE_KEY]: 'incremental-realtime',
        });
        return { flushed: pending.length, mode: 'incremental-realtime' };
      }
      return { flushed: 0, mode: 'deferred-to-open-qg' };
    }

    const filterStore = await chrome.storage.local.get([FILTER_ID_MEMORY_KEY]);
    const localFilterMem = (filterStore?.[FILTER_ID_MEMORY_KEY] && typeof filterStore[FILTER_ID_MEMORY_KEY] === 'object')
      ? filterStore[FILTER_ID_MEMORY_KEY]
      : {};

    const questionEvents = pending.filter((r) => r.entityType === 'question_upsert' || r.entityType === 'question_delete');
    if (questionEvents.length === 0 && Object.keys(localFilterMem).length === 0) {
      return { flushed: 0, mode: 'nothing-pending' };
    }

    const { data: rows, error: getErr } = await supabase
      .from('profiles')
      .select('full_data, updated_at')
      .eq('id', userId)
      .limit(1);

    if (getErr || !Array.isArray(rows) || !rows[0]?.full_data) {
      return { flushed: 0, mode: 'fetch-failed' };
    }

    const row = rows[0];
    const remoteData = { ...row.full_data };
    const mergedMap = new Map();
    (Array.isArray(remoteData.caveiraQuestions) ? remoteData.caveiraQuestions : []).forEach((q) => {
      if (q?.id) mergedMap.set(q.id, q);
    });

    let hasDiff = false;
    questionEvents.forEach((evt) => {
      if (evt.entityType === 'question_delete') {
        if (mergedMap.has(evt.entityId)) {
          mergedMap.delete(evt.entityId);
          hasDiff = true;
        }
      } else if (evt.entityType === 'question_upsert' && evt.payload?.id) {
        const prevRemote = mergedMap.get(evt.payload.id) || null;
        const mergedQ = mergeQuestionRecords(prevRemote, evt.payload);
        mergedMap.set(mergedQ.id, mergedQ);
        hasDiff = true;
      }
    });

    const remoteMem = (remoteData.caveiraFilterMemory && typeof remoteData.caveiraFilterMemory === 'object')
      ? { ...remoteData.caveiraFilterMemory }
      : {};
    let memChanged = false;
    Object.entries(localFilterMem).forEach(([k, v]) => {
      if (!v || typeof v !== 'object') return;
      if (!remoteMem[k] || (Number(v.updatedAt) || 0) > (Number(remoteMem[k].updatedAt) || 0)) {
        remoteMem[k] = v;
        memChanged = true;
      }
    });

    if (!hasDiff && !memChanged) {
      if (pending.length > 0) await clearOutboxSeqs(pending.map((r) => r.seq));
      return { flushed: 0, mode: 'already-in-sync' };
    }

    const nowIso = new Date().toISOString();
    const nextTimestamps = { ...(remoteData._keyTimestamps || {}) };
    if (hasDiff) nextTimestamps.caveiraQuestions = nowIso;
    if (memChanged) nextTimestamps.caveiraFilterMemory = nowIso;

    const nextFullData = {
      ...remoteData,
      caveiraQuestions: Array.from(mergedMap.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)),
      caveiraFilterMemory: remoteMem,
      _keyTimestamps: nextTimestamps,
    };

    let patchQ = supabase
      .from('profiles')
      .update({ full_data: nextFullData, updated_at: nowIso })
      .eq('id', userId);
    if (row.updated_at) {
      patchQ = patchQ.eq('updated_at', row.updated_at);
    }
    const { error: patchErr } = await patchQ;
    if (patchErr) {
      return { flushed: 0, mode: 'patch-conflict' };
    }

    if (pending.length > 0) {
      await clearOutboxSeqs(pending.map((r) => r.seq));
    }
    await setMeta('lastPulledUpdatedAt', nowIso);
    const syncMode = incrementalOk ? 'incremental+profile' : 'profile-delta';
    await chrome.storage.local.set({
      [DIRECT_SYNC_LAST_KEY]: Date.now(),
      [SYNC_MODE_KEY]: syncMode,
    });
    return { flushed: pending.length, mode: syncMode };
  } catch (_) {
    return { flushed: 0, mode: 'error' };
  } finally {
    isFlushing = false;
  }
}

export async function pullDeltaFromSupabase() {
  if (isPulling) return { pulled: 0 };
  isPulling = true;
  try {
    const ctx = await getValidCloudContext();
    if (!ctx) return { pulled: 0 };
    const { supabase, userId } = ctx;

    const { data: metaRows, error: metaErr } = await supabase
      .from('profiles')
      .select('updated_at')
      .eq('id', userId)
      .limit(1);
    if (metaErr || !Array.isArray(metaRows) || !metaRows[0]?.updated_at) return { pulled: 0 };

    const remoteTs = metaRows[0].updated_at;
    const lastPulled = await getMeta('lastPulledUpdatedAt');
    if (lastPulled && remoteTs <= lastPulled) {
      return { pulled: 0 };
    }

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('full_data, updated_at')
      .eq('id', userId)
      .limit(1);
    if (error || !Array.isArray(rows) || !rows[0]?.full_data) return { pulled: 0 };

    const fullData = rows[0].full_data;
    const remoteQuestions = Array.isArray(fullData.caveiraQuestions) ? fullData.caveiraQuestions : [];
    const scoped = remoteQuestions
      .filter((q) => q && q.id)
      .map((q) => ({ ...q, ownerUserId: q.ownerUserId || userId }));

    if (scoped.length > 0) {
      await bulkUpsertQuestionsFull(scoped, { enqueueOutbox: false });
    }

    if (fullData.caveiraFilterMemory && typeof fullData.caveiraFilterMemory === 'object') {
      const filterStore = await chrome.storage.local.get([FILTER_ID_MEMORY_KEY]);
      const localMem = (filterStore?.[FILTER_ID_MEMORY_KEY] && typeof filterStore[FILTER_ID_MEMORY_KEY] === 'object')
        ? { ...filterStore[FILTER_ID_MEMORY_KEY] }
        : {};
      let changed = false;
      Object.entries(fullData.caveiraFilterMemory).forEach(([k, v]) => {
        if (!v || typeof v !== 'object') return;
        if (!localMem[k] || (Number(v.updatedAt) || 0) > (Number(localMem[k].updatedAt) || 0)) {
          localMem[k] = v;
          changed = true;
        }
      });
      if (changed) {
        await chrome.storage.local.set({ [FILTER_ID_MEMORY_KEY]: localMem });
      }
    }

    await setMeta('lastPulledUpdatedAt', rows[0].updated_at || remoteTs);
    return { pulled: scoped.length };
  } catch (_) {
    return { pulled: 0 };
  } finally {
    isPulling = false;
  }
}
