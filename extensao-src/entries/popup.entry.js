import {
  getAllQuestionsFull,
  searchQuestionsOffline,
  getDbStats,
  exportAllDataForBackup,
  importBackupData,
} from '../db/extensionDb.js';
import {
  STORAGE_KEY,
  SESSION_KEY,
  GOAL_KEY,
  ACTIVE_USER_KEY,
  ACTIVE_USER_LABEL_KEY,
  DEFAULT_PREFS_KEY,
  PENDING_SIMULADOS_QUEUE_KEY,
  DIAGNOSTIC_MODE_KEY,
  DIAGNOSTIC_EVENTS_KEY,
  SNIFFER_RECENT_EVENTS_KEY,
  LAST_FILTER_DIAG_KEY,
  TREE_META_KEY,
  PERFORMANCE_SNAPSHOT_KEY,
  getTodaySessionDate,
  normalizeSession,
  sanitizeDiagnosticData,
} from '../content/utils.js';
import {
  formatSimuladoDeliveryStatus,
  pruneAndNormalizeQueue,
} from '../content/simuladosHelper.js';

// Popup Script — QG da PRF Rastreador Caveira (v3.2.0 — Dexie + Diagnóstico + Fila ACK + API Real)
const USER_BUCKETS_KEY = 'qg_caveira_user_buckets';
const FIRST_PREFS = { examBoards: ['cebraspe', 'caveira_ineditas', 'caveira_adaptadas'], numberAlternatives: [2], status: 'not_resolved', difficultyIds: [] };
const TREE_STALE_DAYS = 30;

function renderAccountStatus(activeUserId, activeUserLabel) {
  const pill = document.getElementById('account-status-pill');
  if (!pill) return;
  pill.textContent = '';
  const iconSpan = document.createElement('span');
  const textSpan = document.createElement('span');
  textSpan.style.overflow = 'hidden';
  textSpan.style.textOverflow = 'ellipsis';
  textSpan.style.whiteSpace = 'nowrap';

  if (activeUserId) {
    const label = (activeUserLabel || '').trim() || `ID ${String(activeUserId).slice(0, 8)}...`;
    pill.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    pill.style.background = 'rgba(16, 185, 129, 0.08)';
    pill.style.color = '#86efac';
    iconSpan.textContent = '🟢';
    textSpan.textContent = `Conta: ${label}`;
    textSpan.title = label;
  } else {
    pill.style.borderColor = 'rgba(251, 191, 36, 0.35)';
    pill.style.background = 'rgba(251, 191, 36, 0.08)';
    pill.style.color = '#fde68a';
    iconSpan.textContent = '🟡';
    textSpan.textContent = 'Abra o QG da PRF e faça login';
  }
  pill.appendChild(iconSpan);
  pill.appendChild(textSpan);
}

function renderGoal(session, dailyGoal) {
  const hits = Number(session?.hits) || 0;
  const errors = Number(session?.errors) || 0;
  const current = Number(session?.total) || (hits + errors);
  const goal = Number(dailyGoal) || 50;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  const txtRatio = document.getElementById('txt-goal-ratio');
  const barProgress = document.getElementById('bar-goal-progress');
  const txtStatus = document.getElementById('txt-goal-status');
  const inputGoal = document.getElementById('input-daily-goal');

  if (inputGoal && document.activeElement !== inputGoal) {
    inputGoal.value = goal;
  }

  if (txtRatio) {
    txtRatio.textContent = `${current} / ${goal} (${pct}%)`;
    txtRatio.style.color = current >= goal ? '#10b981' : '#f4f4f5';
  }

  if (barProgress) {
    barProgress.style.width = `${pct}%`;
    barProgress.style.background = current >= goal ? '#10b981' : 'linear-gradient(90deg, #2563eb, #10b981)';
  }

  if (txtStatus) {
    if (current >= goal) {
      txtStatus.textContent = '🏆 META CUMPRIDA! Missão dada é cumprida!';
      txtStatus.style.color = '#10b981';
      txtStatus.style.fontWeight = '800';
    } else {
      const remaining = goal - current;
      txtStatus.textContent = `Faltam ${remaining} questão(ões) para a meta! 💪`;
      txtStatus.style.color = '#a1a1aa';
      txtStatus.style.fontWeight = '700';
    }
  }
}

function formatBrDate(isoOrMs) {
  if (!isoOrMs) return null;
  const dt = new Date(isoOrMs);
  if (!Number.isFinite(dt.getTime())) return null;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return { formatted: `${dd}/${mm}/${yyyy}`, ms: dt.getTime() };
}

let cachedBaselineTreeDate = '';
async function getBaselineTreeDateFallback() {
  if (cachedBaselineTreeDate) return cachedBaselineTreeDate;
  try {
    const resp = await fetch(chrome.runtime.getURL('caveira_arvore.json'));
    if (!resp.ok) return '';
    const data = await resp.json();
    cachedBaselineTreeDate = String(data?.geradoEm || '');
    return cachedBaselineTreeDate;
  } catch (_) {
    return '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const manifestVer = chrome.runtime?.getManifest?.().version || '3.6.0';
  const verEl = document.getElementById('ext-version');
  if (verEl) verEl.textContent = `v${manifestVer}`;

  let currentUserId = null;

  const setBackupStatus = (text, color = '#6ee7b7') => {
    const el = document.getElementById('backup-status');
    if (!el) return;
    el.textContent = text;
    el.style.color = color;
  };

  const renderPopupStats = async (legacyQuestions, session, dailyGoal) => {
    let totalSaved = legacyQuestions.length;
    let dbStats = null;
    try {
      dbStats = await getDbStats(currentUserId);
      if (dbStats && dbStats.totalQuestions > 0) {
        totalSaved = Math.max(totalSaved, dbStats.totalQuestions);
      }
    } catch (_) {}

    const hits = Number(session?.hits) || 0;
    const errors = Number(session?.errors) || 0;
    const total = hits + errors;
    const netRate = total > 0 ? Math.round((hits / total) * 100) : 0;

    document.getElementById('stat-hits').textContent = hits;
    document.getElementById('stat-errors').textContent = errors;
    document.getElementById('stat-net').textContent = `${netRate}%`;
    document.getElementById('txt-total-saved').textContent = `${totalSaved} no histórico`;

    const netEl = document.getElementById('stat-net');
    netEl.className = `stat-value ${netRate >= 70 ? 'green' : netRate >= 50 ? 'gold' : 'red'}`;

    const dbPill = document.getElementById('db-infra-status');
    if (dbPill && dbStats) {
      const outboxTag = dbStats.pendingOutbox > 0 ? ` • 📤 ${dbStats.pendingOutbox} na fila` : ' • ✓ Fila limpa';
      const treeTag = dbStats.dynamicNodesCount > 0 ? ` • 🌳 +${dbStats.dynamicNodesCount} tópicos` : '';
      dbPill.textContent = `💾 IndexedDB: ${dbStats.totalQuestions} integrais${outboxTag}${treeTag}`;
    }

    renderGoal(session, dailyGoal);
  };

  const renderDiagnosticsAndQueue = () => {
    chrome.storage.local.get(
      [
        PENDING_SIMULADOS_QUEUE_KEY,
        DIAGNOSTIC_MODE_KEY,
        DIAGNOSTIC_EVENTS_KEY,
        SNIFFER_RECENT_EVENTS_KEY,
        LAST_FILTER_DIAG_KEY,
        TREE_META_KEY,
        PERFORMANCE_SNAPSHOT_KEY,
      ],
      async (r) => {
        if (chrome.runtime?.lastError) return;
        try {
          const queue = pruneAndNormalizeQueue(r?.[PENDING_SIMULADOS_QUEUE_KEY]);
        const delivery = formatSimuladoDeliveryStatus(queue);

        const queueEl = document.getElementById('simulados-queue-status');
        if (queueEl) {
          queueEl.textContent = delivery.label || '📊 Simulados: fila vazia (nenhum pendente)';
          queueEl.style.color = delivery.isDone
            ? '#6ee7b7'
            : queue.items.length > 0
            ? '#fbbf24'
            : '#94a3b8';
        }

        const badgeEl = document.getElementById('diag-pending-badge');
        if (badgeEl) {
          badgeEl.textContent = `${queue.items.length} pendente(s)`;
          badgeEl.style.color = queue.items.length > 0 ? '#fbbf24' : '#6ee7b7';
        }

        const diagCb = document.getElementById('pref-diagnostic-mode');
        if (diagCb) {
          diagCb.checked = Boolean(r[DIAGNOSTIC_MODE_KEY]);
        }

        const snifferEvents = Array.isArray(r[SNIFFER_RECENT_EVENTS_KEY]) ? r[SNIFFER_RECENT_EVENTS_KEY] : [];
        const diagShapes = Array.isArray(r[DIAGNOSTIC_EVENTS_KEY]) ? r[DIAGNOSTIC_EVENTS_KEY] : [];
        const perfSnap = r[PERFORMANCE_SNAPSHOT_KEY];
        const perfSubjCount = perfSnap?.subjectsAndTopicsPerformance ? Object.keys(perfSnap.subjectsAndTopicsPerformance).length : 0;
        const snifferSummaryEl = document.getElementById('diag-sniffer-summary');
        if (snifferSummaryEl) {
          const lastEv = snifferEvents[snifferEvents.length - 1];
          const lastEvStr = lastEv ? `${lastEv.type}` : 'nenhum ainda';
          const perfPart = perfSubjCount > 0 ? ` • Desempenho: ${perfSubjCount} disc.` : '';
          snifferSummaryEl.textContent = `Sniffer: ${snifferEvents.length} evento(s) (${lastEvStr}) • ${diagShapes.length} forma(s)${perfPart}`;
        }

        const lastFilter = r[LAST_FILTER_DIAG_KEY];
        const resolverSummaryEl = document.getElementById('diag-resolver-summary');
        if (resolverSummaryEl) {
          if (lastFilter?.diagLog) {
            const d = lastFilter.diagLog;
            const idsCount = Array.isArray(d.ids) ? d.ids.length : (Array.isArray(lastFilter.expectedFilter?.ids) ? lastFilter.expectedFilter.ids.length : 0);
            resolverSummaryEl.textContent = `Resolver: ${d.method || 'auto'} • ${d.confidence || '-'} • ${idsCount} ID(s) • ${lastFilter.activePracticeFilter?.subject || ''}`.trim();
          } else {
            resolverSummaryEl.textContent = 'Resolver: sem filtro recente';
          }
        }

        const treeEl = document.getElementById('tree-meta-status');
        if (treeEl) {
          const meta = r[TREE_META_KEY] || {};
          let dateRaw = meta.mergedDate || meta.baselineDate || '';
          if (!dateRaw) {
            dateRaw = await getBaselineTreeDateFallback();
          }
          const parsed = formatBrDate(dateRaw);
          const dynCount = Number(meta.dynamicNodeCount) || 0;
          const dynSuffix = dynCount > 0 ? ` (+${dynCount} din.)` : '';
          if (parsed) {
            const ageDays = Math.floor((Date.now() - parsed.ms) / 86400000);
            if (ageDays > TREE_STALE_DAYS) {
              treeEl.textContent = `⚠️ Árvore Caveira: ${parsed.formatted} (${ageDays}d atrás — atualize)${dynSuffix}`;
              treeEl.style.color = '#fbbf24';
            } else {
              treeEl.textContent = `🌳 Árvore Caveira: ${parsed.formatted}${dynSuffix}`;
              treeEl.style.color = '#94a3b8';
            }
          } else {
            treeEl.textContent = `⚠️ Árvore Caveira: data desconhecida${dynSuffix}`;
            treeEl.style.color = '#fbbf24';
          }
        }
        } catch (_) {}
      }
    );
  };

  chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY, ACTIVE_USER_KEY, ACTIVE_USER_LABEL_KEY], (res) => {
    currentUserId = res[ACTIVE_USER_KEY] || null;
    renderAccountStatus(currentUserId, res[ACTIVE_USER_LABEL_KEY] || '');

    const dailyGoal = Number(res[GOAL_KEY]) || 50;
    if (!res[GOAL_KEY]) {
      chrome.storage.local.set({ [GOAL_KEY]: 50 });
    }

    const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
    const session = normalizeSession(res[SESSION_KEY]);
    if (res[SESSION_KEY]?.date !== session.date) {
      chrome.storage.local.set({ [SESSION_KEY]: session });
    }
    renderPopupStats(questions, session, dailyGoal);
    renderDiagnosticsAndQueue();
  });

  chrome.storage.onChanged.addListener((_, area) => {
    if (area === 'local') {
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY, ACTIVE_USER_KEY, ACTIVE_USER_LABEL_KEY], (res) => {
        currentUserId = res[ACTIVE_USER_KEY] || null;
        const questions = Array.isArray(res[STORAGE_KEY]) ? res[STORAGE_KEY] : [];
        const session = normalizeSession(res[SESSION_KEY]);
        const dailyGoal = Number(res[GOAL_KEY]) || 50;
        renderAccountStatus(currentUserId, res[ACTIVE_USER_LABEL_KEY] || '');
        renderPopupStats(questions, session, dailyGoal);
        renderDiagnosticsAndQueue();
      });
    }
  });

  // Busca offline instantânea via MiniSearch + IndexedDB
  const searchInput = document.getElementById('popup-offline-search');
  const searchResultsEl = document.getElementById('popup-search-results');
  if (searchInput && searchResultsEl) {
    let searchTimer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const q = searchInput.value.trim();
      if (!q) {
        searchResultsEl.style.display = 'none';
        searchResultsEl.textContent = '';
        return;
      }
      searchTimer = setTimeout(async () => {
        try {
          const rows = await searchQuestionsOffline(q, currentUserId, 8);
          searchResultsEl.style.display = 'flex';
          searchResultsEl.textContent = '';
          if (!rows || rows.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'font-size:10px;color:#71717a;padding:4px;';
            empty.textContent = 'Nenhuma questão encontrada no IndexedDB.';
            searchResultsEl.appendChild(empty);
            return;
          }
        rows.forEach((r) => {
          const item = document.createElement('div');
          item.style.cssText = 'padding:6px 8px;border-radius:7px;background:#18181f;border:1px solid rgba(255,255,255,0.06);font-size:10px;line-height:1.35;';
          const head = document.createElement('div');
          head.style.cssText = 'display:flex;justify-content:space-between;font-weight:800;margin-bottom:2px;';
          const left = document.createElement('span');
          left.style.color = r.hit ? '#10b981' : '#ef4444';
          left.textContent = `${r.hit ? '✓' : '✗'} ${r.id} • ${r.canonicalSubject || r.subject || 'PRF'}`;
          head.appendChild(left);
          const body = document.createElement('div');
          body.style.color = '#d4d4d8';
          const preview = r.userNote ? `💡 ${r.userNote}` : String(r.content || '').slice(0, 110);
          body.textContent = preview + (preview.length >= 110 ? '...' : '');
          item.appendChild(head);
          item.appendChild(body);
          searchResultsEl.appendChild(item);
        });
        } catch (_) {}
      }, 140);
    });
  }

  // Controle de edição da Meta Diária
  const btnEditGoal = document.getElementById('btn-edit-goal');
  const boxEditGoal = document.getElementById('box-edit-goal');
  const btnSaveGoal = document.getElementById('btn-save-goal');
  const inputDailyGoal = document.getElementById('input-daily-goal');

  if (btnEditGoal && boxEditGoal) {
    btnEditGoal.addEventListener('click', () => {
      const isHidden = boxEditGoal.style.display === 'none' || !boxEditGoal.style.display;
      boxEditGoal.style.display = isHidden ? 'flex' : 'none';
      if (isHidden && inputDailyGoal) inputDailyGoal.focus();
    });
  }

  if (btnSaveGoal && inputDailyGoal) {
    btnSaveGoal.addEventListener('click', () => {
      const newGoal = Math.max(5, Math.min(1000, Number(inputDailyGoal.value) || 50));
      chrome.storage.local.get([ACTIVE_USER_KEY, USER_BUCKETS_KEY], (res) => {
        const activeUserId = res?.[ACTIVE_USER_KEY] || null;
        const payload = { [GOAL_KEY]: newGoal };
        if (activeUserId) {
          const buckets = (res?.[USER_BUCKETS_KEY] && typeof res[USER_BUCKETS_KEY] === 'object')
            ? { ...res[USER_BUCKETS_KEY] }
            : {};
          buckets[activeUserId] = { ...(buckets[activeUserId] || {}), dailyGoal: newGoal };
          payload[USER_BUCKETS_KEY] = buckets;
        }
        chrome.storage.local.set(payload, () => {
          if (boxEditGoal) boxEditGoal.style.display = 'none';
          chrome.storage.local.get([SESSION_KEY], (sRes) => {
            const session = normalizeSession(sRes[SESSION_KEY]);
            renderGoal(session, newGoal);
          });
        });
      });
    });
  }

  // Filtros padrão
  (function initPrefs() {
    const boxes = Array.from(document.querySelectorAll('.pref-board'));
    const sel = document.getElementById('pref-alts');
    const statusSel = document.getElementById('pref-status');
    if (!boxes.length || !sel) return;
    let cachedDifficultyIds = [];
    const sanitizeDiffs = (list) => (Array.isArray(list)
      ? Array.from(new Set(list.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 6))).sort((a, b) => a - b)
      : []);
    const render = (p) => {
      cachedDifficultyIds = sanitizeDiffs(p?.difficultyIds);
      boxes.forEach((b) => { b.checked = (p.examBoards || []).includes(b.value); });
      sel.value = (p.numberAlternatives && p.numberAlternatives[0]) ? String(p.numberAlternatives[0]) : '';
      if (statusSel) {
        statusSel.value = typeof p.status === 'string' ? p.status : 'not_resolved';
      }
    };
    const save = () => {
      const p = {
        examBoards: boxes.filter((b) => b.checked).map((b) => b.value),
        numberAlternatives: sel.value ? [Number(sel.value)] : [],
        difficultyIds: cachedDifficultyIds,
        status: statusSel ? statusSel.value : 'not_resolved',
      };
      chrome.storage.local.set({ [DEFAULT_PREFS_KEY]: p });
    };
    chrome.storage.local.get([DEFAULT_PREFS_KEY], (r) => render(r[DEFAULT_PREFS_KEY] || FIRST_PREFS));
    if (chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes[DEFAULT_PREFS_KEY]) {
          render(changes[DEFAULT_PREFS_KEY].newValue || FIRST_PREFS);
        }
      });
    }
    boxes.forEach((b) => b.addEventListener('change', save));
    sel.addEventListener('change', save);
    if (statusSel) statusSel.addEventListener('change', save);
  })();

  // Alertas FSRS & Status Sync Direto (tokens vivem somente em chrome.storage.session via background)
  (function initBackgroundFeatures() {
    const notifCb = document.getElementById('pref-notifications');
    const syncEl = document.getElementById('direct-sync-status');

    const renderStatus = () => {
      chrome.storage.local.get(['qg_notifications_enabled', 'qg_last_direct_cloud_sync', 'qg_sync_mode', 'qg_cloud_auth_meta'], (r) => {
        if (notifCb) {
          notifCb.checked = r.qg_notifications_enabled !== false;
        }
        chrome.runtime.sendMessage({ type: 'GET_CLOUD_AUTH_STATUS' }, (authRes) => {
          if (!syncEl) return;
          const isAuth = Boolean(!chrome.runtime?.lastError && (authRes?.authenticated || r.qg_cloud_auth_meta?.authenticated));
          if (isAuth) {
            const last = r.qg_last_direct_cloud_sync;
            const modeLabel = r.qg_sync_mode === 'incremental+profile' || r.qg_sync_mode === 'incremental-realtime'
              ? 'Incremental'
              : 'Delta';
            if (last) {
              const dt = new Date(last);
              const hm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
              syncEl.textContent = `☁️ Sync ${modeLabel} Supabase: Ativo (${hm})`;
            } else {
              syncEl.textContent = `☁️ Sync ${modeLabel} Supabase: Pronto`;
            }
            syncEl.style.color = '#6ee7b7';
          } else {
            syncEl.textContent = '☁️ Sync Direto: abra o QG 1x para vincular';
            syncEl.style.color = '#fbbf24';
          }
        });
      });
    };

    renderStatus();
    if (notifCb) {
      notifCb.addEventListener('change', () => {
        chrome.storage.local.set({ qg_notifications_enabled: notifCb.checked });
      });
    }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.qg_cloud_auth_meta || changes.qg_last_direct_cloud_sync || changes.qg_notifications_enabled || changes.qg_sync_mode)) {
        renderStatus();
      }
    });
  })();

  // Modo Diagnóstico, Reenvio Simulados & Backup (#P0-1, #P0-2, #P2-11)
  const diagCb = document.getElementById('pref-diagnostic-mode');
  if (diagCb) {
    diagCb.addEventListener('change', () => {
      chrome.storage.local.set({ [DIAGNOSTIC_MODE_KEY]: diagCb.checked }, () => {
        setBackupStatus(diagCb.checked ? 'Modo Diagnóstico ATIVADO.' : 'Modo Diagnóstico desativado.', '#38bdf8');
      });
    });
  }

  document.getElementById('btn-retry-simulados')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'FLUSH_PENDING_QG_EVENTS', forceRetry: true }, (resp) => {
      if (chrome.runtime?.lastError || !resp?.success) {
        setBackupStatus('Falha ao acionar reenvio — verifique se a aba do QG está aberta.', '#f87171');
        return;
      }
      if (!resp.tabs) {
        setBackupStatus('Nenhuma aba do QG da PRF aberta. Abra o QG e faça login.', '#fbbf24');
      } else {
        setBackupStatus(`Reenvio enviado para ${resp.tabs} aba(s) do QG!`, '#6ee7b7');
      }
      setTimeout(renderDiagnosticsAndQueue, 400);
    });
  });

  document.getElementById('btn-copy-diagnostic')?.addEventListener('click', async () => {
    try {
      const rawStore = await new Promise((resolve) => {
        chrome.storage.local.get([
          PENDING_SIMULADOS_QUEUE_KEY,
          DIAGNOSTIC_MODE_KEY,
          DIAGNOSTIC_EVENTS_KEY,
          SNIFFER_RECENT_EVENTS_KEY,
          LAST_FILTER_DIAG_KEY,
          TREE_META_KEY,
          PERFORMANCE_SNAPSHOT_KEY,
          'qg_cloud_auth_meta',
        ], resolve);
      });
      const dbStats = await getDbStats(currentUserId).catch(() => null);
      const perfSnap = rawStore?.[PERFORMANCE_SNAPSHOT_KEY];
      const payload = sanitizeDiagnosticData({
        version: manifestVer,
        capturedAt: new Date().toISOString(),
        diagnosticMode: Boolean(rawStore?.[DIAGNOSTIC_MODE_KEY]),
        treeMeta: rawStore?.[TREE_META_KEY] || null,
        authMeta: rawStore?.qg_cloud_auth_meta || null,
        performanceSnapshotSummary: perfSnap ? {
          capturedAt: perfSnap.capturedAt || null,
          rangeDays: perfSnap.rangeDays || null,
          subjectsCount: perfSnap.subjectsAndTopicsPerformance ? Object.keys(perfSnap.subjectsAndTopicsPerformance).length : 0,
        } : null,
        dbStats,
        pendingSimuladosQueue: pruneAndNormalizeQueue(rawStore?.[PENDING_SIMULADOS_QUEUE_KEY]),
        recentSnifferEvents: (rawStore?.[SNIFFER_RECENT_EVENTS_KEY] || []).slice(-20),
        diagnosticShapes: (rawStore?.[DIAGNOSTIC_EVENTS_KEY] || []).slice(-30),
        lastFilterDiag: rawStore?.[LAST_FILTER_DIAG_KEY] || null,
      });
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setBackupStatus('Diagnóstico copiado (tokens/credenciais removidos).', '#6ee7b7');
    } catch (err) {
      setBackupStatus(`Erro ao copiar diagnóstico: ${err?.message || 'permissão negada'}`, '#f87171');
    }
  });

  document.getElementById('btn-export-backup')?.addEventListener('click', async () => {
    try {
      const backup = await exportAllDataForBackup(currentUserId);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qg-prf-backup-${getTodaySessionDate()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setBackupStatus(`Backup exportado (${backup.questions.length} questões).`, '#6ee7b7');
    } catch (err) {
      setBackupStatus(`Erro ao exportar: ${err?.message || 'desconhecido'}`, '#f87171');
    }
  });

  const importInput = document.getElementById('input-import-backup');
  document.getElementById('btn-import-backup')?.addEventListener('click', () => {
    importInput?.click();
  });
  importInput?.addEventListener('change', async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await importBackupData(parsed, currentUserId);
      setBackupStatus(
        `Importado: ${res.importedQuestions} questão(ões), ${res.importedNodes} nó(s), ${res.filterMemoryCount} memória(s).`,
        '#6ee7b7'
      );
      chrome.storage.local.get([STORAGE_KEY, SESSION_KEY, GOAL_KEY], (s) => {
        renderPopupStats(Array.isArray(s[STORAGE_KEY]) ? s[STORAGE_KEY] : [], normalizeSession(s[SESSION_KEY]), Number(s[GOAL_KEY]) || 50);
      });
    } catch (err) {
      setBackupStatus(`Backup inválido: ${err?.message || 'erro ao importar'}`, '#f87171');
    } finally {
      importInput.value = '';
    }
  });

  document.getElementById('btn-open-qg').addEventListener('click', async () => {
    const targetUrl = 'https://blk002.github.io/qgdaPRFWILSON/#/estudos?tab=caveira';
    try {
      if (chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({
          url: ['https://blk002.github.io/*'],
        });
        if (tabs && tabs.length > 0 && tabs[0].id) {
          await chrome.tabs.update(tabs[0].id, { active: true });
          if (tabs[0].windowId && chrome.windows) {
            await chrome.windows.update(tabs[0].windowId, { focused: true }).catch(() => {});
          }
          return;
        }
      }
    } catch (_) {}
    chrome.tabs.create({ url: targetUrl }).catch(() => {});
  });

  document.getElementById('btn-copy-json').addEventListener('click', async () => {
    try {
      const questions = await getAllQuestionsFull(currentUserId);
      const fallback = await new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (r) => resolve(Array.isArray(r?.[STORAGE_KEY]) ? r[STORAGE_KEY] : []));
      });
      const finalList = questions.length > 0 ? questions : fallback;
      await navigator.clipboard.writeText(JSON.stringify(finalList, null, 2));
      const btn = document.getElementById('btn-copy-json');
      const orig = btn.textContent;
      btn.textContent = 'Copiado com Sucesso! ✓';
      setTimeout(() => { btn.textContent = orig; }, 1800);
    } catch (_) {}
  });

  document.getElementById('btn-reset-session').addEventListener('click', () => {
    const today = getTodaySessionDate();
    const resetSession = { date: today, hits: 0, errors: 0, total: 0, wasExplicitlyReset: true };
    chrome.runtime.sendMessage({ type: 'CLEAR_CAVEIRA_SESSION' }, () => {
      document.getElementById('stat-hits').textContent = '0';
      document.getElementById('stat-errors').textContent = '0';
      document.getElementById('stat-net').textContent = '0%';
      document.getElementById('stat-net').className = 'stat-value gold';
      chrome.storage.local.get([GOAL_KEY], (res) => {
        renderGoal(resetSession, Number(res[GOAL_KEY]) || 50);
      });
    });
  });
});
