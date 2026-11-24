import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { getSafeExternalUrl } from '../lib/safeUrl';
import {
  EIXOS_PRF,
  TIPOS_REPERTORIO,
  CURATED_REPERTORIOS,
  CEBRASPE_SKELETON,
  CEBRASPE_REGRAS_OURO,
  CEBRASPE_CONECTIVOS
} from '../data/discursivaRepertorios';
import {
  checkIsDiscursivaAdmin,
  fetchLiveRepertorios,
  readCachedLiveRepertorios,
  subscribeLiveRepertorios,
  upsertLiveRepertorio,
  approvePendingRepertorio,
  archiveLiveRepertorio,
  deleteLiveRepertorio,
  seedBaseCatalogToSupabase
} from '../services/discursivaService';
import {
  BookMarked,
  Calculator,
  Search,
  X,
  Star,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Pencil,
  Trash2,
  Scale,
  FileText,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Globe,
  Clock,
  Inbox,
  Database
} from 'lucide-react';

const EIXO_MAP = Object.fromEntries(EIXOS_PRF.map((e) => [e.id, e]));
const TIPO_MAP = Object.fromEntries(TIPOS_REPERTORIO.map((t) => [t.id, t]));
const RECENT_DAYS_THRESHOLD = 7;

const EMPTY_FORM = {
  eixo: 'seguranca_viaria',
  tipo: 'legislacao',
  titulo: '',
  fonte: '',
  fonteUrl: '',
  dataReferencia: '',
  aspectoTipico: '',
  resumo: '',
  comoUsar: '',
  palavrasChaveText: ''
};

function isPublishedRecently(isoString) {
  if (!isoString) return false;
  const ts = Date.parse(isoString);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= RECENT_DAYS_THRESHOLD * 24 * 60 * 60 * 1000;
}

function formatShortDate(dateValue) {
  if (!dateValue) return '';
  const clean = String(dateValue).slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return clean;
}

function buildInitialForm(initialItem) {
  if (!initialItem) return EMPTY_FORM;
  return {
    eixo: initialItem.eixo || 'seguranca_viaria',
    tipo: initialItem.tipo || 'legislacao',
    titulo: initialItem.titulo || '',
    fonte: initialItem.fonte || '',
    fonteUrl: initialItem.fonteUrl || '',
    dataReferencia: initialItem.dataReferencia ? String(initialItem.dataReferencia).slice(0, 10) : '',
    aspectoTipico: initialItem.aspectoTipico || '',
    resumo: initialItem.resumo || '',
    comoUsar: initialItem.comoUsar || '',
    palavrasChaveText: Array.isArray(initialItem.palavrasChave)
      ? initialItem.palavrasChave.join(', ')
      : ''
  };
}

function RepertorioFormDialog({ initialItem, mode = 'personal', isSaving = false, onClose, onSave }) {
  const [form, setForm] = useState(() => buildInitialForm(initialItem));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, isSaving]);

  const isGlobalMode = mode === 'global' || mode === 'approve_pending';
  const isApproveMode = mode === 'approve_pending';
  const isEditing = Boolean(initialItem);

  const modalTitle = isApproveMode
    ? 'Revisar e publicar repertório do radar'
    : isGlobalMode
      ? isEditing
        ? 'Editar repertório global'
        : 'Publicar no catálogo global'
      : isEditing
        ? 'Editar repertório pessoal'
        : 'Novo repertório pessoal';

  const modalSubtitle = isApproveMode
    ? 'Confira a precisão jurídica e dos dados antes de liberar no banco vivo.'
    : isGlobalMode
      ? 'Publicado imediatamente no Supabase para todos os usuários da aba Discursiva.'
      : 'Salvo na sua conta pessoal para revisar rapidamente antes da prova.';

  const submitLabel = isSaving
    ? 'Salvando...'
    : isApproveMode
      ? 'Aprovar e publicar agora'
      : isGlobalMode
        ? isEditing
          ? 'Salvar e atualizar catálogo'
          : 'Publicar agora'
        : isEditing
          ? 'Salvar alterações'
          : 'Adicionar repertório';

  const handleSubmit = (e) => {
    e.preventDefault();
    const titulo = form.titulo.trim();
    const fonte = form.fonte.trim();
    const comoUsar = form.comoUsar.trim();
    const resumo = form.resumo.trim();
    const rawUrl = form.fonteUrl.trim();
    const safeUrl = rawUrl ? getSafeExternalUrl(rawUrl, '') : '';

    if (!titulo || !fonte || !comoUsar) {
      toast.error('Preencha título, fonte/base legal e a frase de aplicação.');
      return;
    }

    if (rawUrl && !safeUrl) {
      toast.error('Informe um link oficial válido começando com https:// ou http://.');
      return;
    }

    const palavrasChave = form.palavrasChaveText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      id: initialItem?.id || (isGlobalMode ? `live_rep_${Date.now()}` : `custom_rep_${Date.now()}`),
      eixo: form.eixo,
      tipo: form.tipo,
      titulo,
      fonte,
      fonteUrl: safeUrl,
      dataReferencia: form.dataReferencia || null,
      aspectoTipico: form.aspectoTipico.trim() || (isGlobalMode ? 'Atualidade oficial' : 'Repertório pessoal'),
      resumo: resumo || comoUsar,
      comoUsar,
      palavrasChave,
      origem: initialItem?.origem || (isGlobalMode ? 'admin' : 'personal'),
      isCustom: !isGlobalMode
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[120] p-3 sm:p-4 fade-in font-sans"
      onClick={() => !isSaving && onClose()}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] w-full max-w-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repertorio-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 flex items-center justify-center shrink-0 mt-0.5 text-sky-600 dark:text-sky-400">
              {isGlobalMode ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2
                id="repertorio-modal-title"
                className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight"
              >
                {modalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {modalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-5 py-4 overflow-y-auto custom-scrollbar space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Eixo temático PRF
                </span>
                <select
                  value={form.eixo}
                  onChange={(e) => setForm((prev) => ({ ...prev, eixo: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                >
                  {EIXOS_PRF.map((eixo) => (
                    <option key={eixo.id} value={eixo.id}>
                      {eixo.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipo de repertório
                </span>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                >
                  {TIPOS_REPERTORIO.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Título objetivo <span className="text-rose-500">*</span>
              </span>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex.: Integração entre PRF e Polícia Federal na Faixa de Fronteira"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                required
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fonte / Artigo / Órgão <span className="text-rose-500">*</span>
                </span>
                <input
                  type="text"
                  value={form.fonte}
                  onChange={(e) => setForm((prev) => ({ ...prev, fonte: e.target.value }))}
                  placeholder="Ex.: Art. 144, CF/88 · Agência PRF"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aspecto típico no comando
                </span>
                <input
                  type="text"
                  value={form.aspectoTipico}
                  onChange={(e) => setForm((prev) => ({ ...prev, aspectoTipico: e.target.value }))}
                  placeholder="Ex.: Fundamentação legal / Proposta"
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Link da fonte oficial (opcional)
                </span>
                <input
                  type="url"
                  value={form.fonteUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, fonteUrl: e.target.value }))}
                  placeholder="https://www.gov.br/prf/..."
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data do dado
                </span>
                <input
                  type="date"
                  value={form.dataReferencia}
                  onChange={(e) => setForm((prev) => ({ ...prev, dataReferencia: e.target.value }))}
                  className="w-full h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Resumo conceitual
              </span>
              <textarea
                rows={2}
                value={form.resumo}
                onChange={(e) => setForm((prev) => ({ ...prev, resumo: e.target.value }))}
                placeholder="Ideia central ou dado objetivo que você precisa lembrar na hora da prova."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 resize-none"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Frase-modelo no padrão Cebraspe <span className="text-rose-500">*</span>
              </span>
              <textarea
                rows={3}
                value={form.comoUsar}
                onChange={(e) => setForm((prev) => ({ ...prev, comoUsar: e.target.value }))}
                placeholder="Escreva um período direto e adaptável pronto para usar em um parágrafo de desenvolvimento..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 resize-none"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Palavras-chave (separadas por vírgula)
              </span>
              <input
                type="text"
                value={form.palavrasChaveText}
                onChange={(e) => setForm((prev) => ({ ...prev, palavrasChaveText: e.target.value }))}
                placeholder="Ex.: fronteira, integração, inteligência, crime organizado"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
              />
            </label>
          </div>

          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 shrink-0 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function RepertorioFormModal({ isOpen, initialItem, mode, isSaving, onClose, onSave }) {
  if (!isOpen) return null;
  return (
    <RepertorioFormDialog
      key={`${mode}_${initialItem?.id || 'new'}`}
      initialItem={initialItem}
      mode={mode}
      isSaving={isSaving}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

export default function AbaDiscursiva() {
  const { discursivaData, setDiscursivaData, user } = useStore();

  const { favorites, mastered, customRepertorios } = useMemo(
    () => ({
      favorites: Array.isArray(discursivaData?.favorites) ? discursivaData.favorites : [],
      mastered: Array.isArray(discursivaData?.mastered) ? discursivaData.mastered : [],
      customRepertorios: Array.isArray(discursivaData?.customRepertorios)
        ? discursivaData.customRepertorios
        : []
    }),
    [discursivaData]
  );

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const masteredSet = useMemo(() => new Set(mastered), [mastered]);

  // Estado do catálogo vivo no Supabase + Curadoria Admin
  const [livePublished, setLivePublished] = useState(() => readCachedLiveRepertorios());
  const [livePending, setLivePending] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [busyActionId, setBusyActionId] = useState(null);

  const [subView, setSubView] = useState('repertorios'); // 'repertorios' | 'modelo' | 'curadoria'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEixo, setSelectedEixo] = useState('todos');
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'pendentes' | 'dominados'
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [onlyRecent, setOnlyRecent] = useState(false);

  const [copiedId, setCopiedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, item: null, mode: 'personal' });

  // Calculadora Cebraspe: ND = NC - 2 * (NE / TL)
  const [calcNC, setCalcNC] = useState(17.5);
  const [calcNE, setCalcNE] = useState(5);
  const [calcTL, setCalcTL] = useState(29);

  const fetchAndApplyLive = useCallback(async (userId) => {
    const adminCheck = userId
      ? await checkIsDiscursivaAdmin()
      : { isAdmin: false, schemaMissing: false };

    const result = await fetchLiveRepertorios({ includePending: adminCheck.isAdmin });
    return {
      isAdmin: adminCheck.isAdmin,
      published: result.published,
      pending: adminCheck.isAdmin ? result.pending : [],
      connected: result.connected
    };
  }, []);

  const loadLiveCatalog = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setIsRefreshingLive(true);
      try {
        const snapshot = await fetchAndApplyLive(user?.id);
        setIsAdmin(snapshot.isAdmin);
        setLivePublished(snapshot.published);
        setLivePending(snapshot.pending);
        setLiveConnected(snapshot.connected);
      } finally {
        if (!silent) setIsRefreshingLive(false);
      }
    },
    [fetchAndApplyLive, user?.id]
  );

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const snapshot = await fetchAndApplyLive(user?.id);
      if (!active) return;
      setIsAdmin(snapshot.isAdmin);
      setLivePublished(snapshot.published);
      setLivePending(snapshot.pending);
      setLiveConnected(snapshot.connected);
    };

    sync();
    const unsubscribe = subscribeLiveRepertorios(() => {
      sync();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [fetchAndApplyLive, user?.id]);

  // Mescla: pessoais -> publicados ao vivo no Supabase -> curados locais (sem duplicar IDs)
  const allRepertorios = useMemo(() => {
    const seen = new Set();
    const merged = [];

    const pushUnique = (item) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.add(item.id);
      merged.push(item);
    };

    livePublished.forEach((item) => pushUnique({ ...item, isLive: true }));
    customRepertorios.forEach((item) => pushUnique({ ...item, isCustom: true }));
    CURATED_REPERTORIOS.forEach((item) => pushUnique(item));

    return merged;
  }, [livePublished, customRepertorios]);

  const recentCount = useMemo(
    () => allRepertorios.filter((r) => isPublishedRecently(r.publishedAt)).length,
    [allRepertorios]
  );

  const eixoCounts = useMemo(() => {
    const counts = { todos: allRepertorios.length };
    EIXOS_PRF.forEach((e) => {
      counts[e.id] = 0;
    });
    allRepertorios.forEach((r) => {
      if (counts[r.eixo] !== undefined) counts[r.eixo] += 1;
    });
    return counts;
  }, [allRepertorios]);

  const filteredRepertorios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRepertorios.filter((item) => {
      if (selectedEixo !== 'todos' && item.eixo !== selectedEixo) return false;
      if (selectedTipo !== 'todos' && item.tipo !== selectedTipo) return false;
      if (onlyFavorites && !favoriteSet.has(item.id)) return false;
      if (onlyCustom && !item.isCustom) return false;
      if (onlyRecent && !isPublishedRecently(item.publishedAt)) return false;
      if (statusFilter === 'dominados' && !masteredSet.has(item.id)) return false;
      if (statusFilter === 'pendentes' && masteredSet.has(item.id)) return false;

      if (!q) return true;
      const haystack = [
        item.titulo,
        item.fonte,
        item.aspectoTipico,
        item.resumo,
        item.comoUsar,
        ...(Array.isArray(item.palavrasChave) ? item.palavrasChave : [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [
    allRepertorios,
    searchQuery,
    selectedEixo,
    selectedTipo,
    onlyFavorites,
    onlyCustom,
    onlyRecent,
    statusFilter,
    favoriteSet,
    masteredSet
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (selectedEixo !== 'todos') count += 1;
    if (selectedTipo !== 'todos') count += 1;
    if (statusFilter !== 'todos') count += 1;
    if (onlyFavorites) count += 1;
    if (onlyCustom) count += 1;
    if (onlyRecent) count += 1;
    return count;
  }, [searchQuery, selectedEixo, selectedTipo, statusFilter, onlyFavorites, onlyCustom, onlyRecent]);

  const masteredValidCount = useMemo(
    () => allRepertorios.filter((r) => masteredSet.has(r.id)).length,
    [allRepertorios, masteredSet]
  );

  const favoritesValidCount = useMemo(
    () => allRepertorios.filter((r) => favoriteSet.has(r.id)).length,
    [allRepertorios, favoriteSet]
  );

  const updateDiscursiva = (updater) => {
    const current = {
      favorites,
      mastered,
      customRepertorios
    };
    const next = typeof updater === 'function' ? updater(current) : updater;
    setDiscursivaData(next);
  };

  const handleToggleFavorite = (id) => {
    const isFav = favoriteSet.has(id);
    updateDiscursiva((prev) => ({
      ...prev,
      favorites: isFav
        ? prev.favorites.filter((x) => x !== id)
        : [...prev.favorites, id]
    }));
  };

  const handleToggleMastered = (id) => {
    const isDone = masteredSet.has(id);
    updateDiscursiva((prev) => ({
      ...prev,
      mastered: isDone
        ? prev.mastered.filter((x) => x !== id)
        : [...prev.mastered, id]
    }));
  };

  const handleCopyText = async (id, text, successMsg = 'Frase copiada para a área de transferência') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(successMsg);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalState({ isOpen: true, item, mode });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, item: null, mode: 'personal' });
  };

  const handleSaveModal = async (payload) => {
    const mode = modalState.mode;

    if (mode === 'global' || mode === 'approve_pending') {
      setIsSavingGlobal(true);
      try {
        await upsertLiveRepertorio(payload, 'published', payload.origem || 'admin');
        await loadLiveCatalog({ silent: true });
        handleCloseModal();
        toast.success(
          mode === 'approve_pending'
            ? 'Repertório aprovado e publicado ao vivo!'
            : 'Catálogo global atualizado em tempo real.'
        );
      } catch (err) {
        toast.error(err?.message || 'Não foi possível salvar no catálogo global.');
      } finally {
        setIsSavingGlobal(false);
      }
      return;
    }

    const exists = customRepertorios.some((r) => r.id === payload.id);
    updateDiscursiva((prev) => ({
      ...prev,
      customRepertorios: exists
        ? prev.customRepertorios.map((r) => (r.id === payload.id ? payload : r))
        : [payload, ...prev.customRepertorios]
    }));
    handleCloseModal();
    toast.success(exists ? 'Repertório pessoal atualizado.' : 'Repertório adicionado à sua conta.');
  };

  const handleDeleteCustom = (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
      }, 3500);
      return;
    }
    updateDiscursiva((prev) => ({
      favorites: prev.favorites.filter((x) => x !== id),
      mastered: prev.mastered.filter((x) => x !== id),
      customRepertorios: prev.customRepertorios.filter((r) => r.id !== id)
    }));
    setConfirmDeleteId(null);
    toast.success('Repertório removido.');
  };

  const handleQuickApprovePending = async (item) => {
    setBusyActionId(item.id);
    try {
      await approvePendingRepertorio(item.id);
      await loadLiveCatalog({ silent: true });
      toast.success('Repertório aprovado e publicado no banco vivo!');
    } catch (err) {
      toast.error(err?.message || 'Erro ao aprovar repertório.');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleArchivePending = async (item) => {
    setBusyActionId(item.id);
    try {
      await archiveLiveRepertorio(item.id);
      await loadLiveCatalog({ silent: true });
      toast.success('Rascunho descartado da fila.');
    } catch (err) {
      toast.error(err?.message || 'Erro ao descartar rascunho.');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDeleteGlobal = async (item) => {
    if (confirmDeleteId !== item.id) {
      setConfirmDeleteId(item.id);
      setTimeout(() => {
        setConfirmDeleteId((prev) => (prev === item.id ? null : prev));
      }, 3500);
      return;
    }
    setBusyActionId(item.id);
    try {
      await deleteLiveRepertorio(item.id);
      await loadLiveCatalog({ silent: true });
      setConfirmDeleteId(null);
      toast.success('Repertório removido do catálogo global.');
    } catch (err) {
      toast.error(err?.message || 'Erro ao remover repertório global.');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleSeedBaseCatalog = async () => {
    setBusyActionId('seed_base');
    try {
      const count = await seedBaseCatalogToSupabase(CURATED_REPERTORIOS);
      await loadLiveCatalog({ silent: true });
      toast.success(`${count} repertórios base sincronizados no Supabase.`);
    } catch (err) {
      toast.error(err?.message || 'Erro ao sincronizar base inicial no Supabase.');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedEixo('todos');
    setSelectedTipo('todos');
    setStatusFilter('todos');
    setOnlyFavorites(false);
    setOnlyCustom(false);
    setOnlyRecent(false);
  };

  // Cálculo oficial Cebraspe PRF
  const safeNC = Math.max(0, Math.min(20, Number(calcNC) || 0));
  const safeNE = Math.max(0, Math.min(60, Number(calcNE) || 0));
  const safeTL = Math.max(1, Math.min(30, Number(calcTL) || 1));
  const descontoErros = (2 * safeNE) / safeTL;
  const pesoPorErro = 2 / safeTL;
  const notaFinal = Math.max(0, safeNC - descontoErros);
  const notaSe30Linhas = Math.max(0, safeNC - (2 * safeNE) / 30);
  const ganhoCom30 = Math.max(0, notaSe30Linhas - notaFinal);

  const scoreTone =
    notaFinal < 10
      ? {
          label: 'Abaixo do mínimo eliminatório (10,00 pts)',
          textClass: 'text-rose-600 dark:text-rose-400',
          boxClass: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
        }
      : notaFinal < 17
        ? {
            label: 'Aprovado no mínimo · Busque 17+ para disputar vagas',
            textClass: 'text-amber-700 dark:text-amber-400',
            boxClass: 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/60'
          }
        : {
            label: 'Faixa competitiva para aprovação na PRF',
            textClass: 'text-emerald-700 dark:text-emerald-400',
            boxClass: 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-900/60'
          };

  return (
    <div className="space-y-5">
      {/* Barra superior: sub-navegação, métricas inline e ações */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSubView('repertorios')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                subView === 'repertorios'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Banco de Repertórios</span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('modelo')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                subView === 'modelo'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Modelo Cebraspe & Calculadora</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setSubView('curadoria')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  subView === 'curadoria'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Curadoria</span>
                {livePending.length > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold tabular-nums inline-flex items-center justify-center">
                    {livePending.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {allRepertorios.length}
              </strong>{' '}
              repertórios
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="tabular-nums">
              Dominados:{' '}
              <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                {masteredValidCount}/{allRepertorios.length}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="tabular-nums">
              Favoritos:{' '}
              <strong className="font-semibold text-amber-600 dark:text-amber-400">
                {favoritesValidCount}
              </strong>
            </span>
            {customRepertorios.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="tabular-nums">
                  Próprios:{' '}
                  <strong className="font-semibold text-sky-600 dark:text-sky-400">
                    {customRepertorios.length}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
          {liveConnected && (
            <button
              type="button"
              onClick={() => loadLiveCatalog({ silent: false })}
              disabled={isRefreshingLive}
              title="Atualizar banco vivo"
              className="h-9 px-3 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleOpenModal('global', null)}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publicar global</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenModal('personal', null)}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo repertório</span>
          </button>
        </div>
      </div>

      {subView === 'repertorios' && (
        <div className="space-y-4">
          {/* Filtros e Busca */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-2.5">
              {/* Campo de busca */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por lei, artigo, tema, autor ou palavra-chave (ex.: PNATRANS, art. 144, SUSP, Mapear)..."
                  className="w-full h-9 pl-9 pr-8 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/35 focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tipo + Favoritos + Status */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filtrar por tipo de repertório"
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/35 cursor-pointer"
                >
                  <option value="todos">Todos os tipos</option>
                  {TIPOS_REPERTORIO.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.label}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filtrar por domínio"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/35 cursor-pointer"
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendentes">Ainda não dominados</option>
                  <option value="dominados">Já dominados</option>
                </select>

                <button
                  type="button"
                  onClick={() => setOnlyFavorites((prev) => !prev)}
                  className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    onlyFavorites
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>Favoritos</span>
                </button>

                {recentCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setOnlyRecent((prev) => !prev)}
                    className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      onlyRecent
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recentes ({recentCount})</span>
                  </button>
                )}

                {customRepertorios.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOnlyCustom((prev) => !prev)}
                    className={`h-9 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      onlyCustom
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700/80 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Meus ({customRepertorios.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Eixos temáticos da PRF */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedEixo('todos')}
                className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedEixo === 'todos'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                    : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>Todos os eixos</span>
                <span className="opacity-70 tabular-nums">{eixoCounts.todos}</span>
              </button>

              {EIXOS_PRF.map((eixo) => {
                const isSelected = selectedEixo === eixo.id;
                return (
                  <button
                    key={eixo.id}
                    type="button"
                    onClick={() => setSelectedEixo(eixo.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      isSelected
                        ? `${eixo.softBgClass} ${eixo.textClass}`
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${eixo.dotClass}`} />
                    <span>{eixo.shortLabel}</span>
                    <span className="opacity-70 tabular-nums">{eixoCounts[eixo.id] || 0}</span>
                  </button>
                );
              })}

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Lista de Repertórios */}
          {filteredRepertorios.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Nenhum repertório encontrado
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Ajuste os filtros ativos ou cadastre um novo repertório personalizado para este tema.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 px-3.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal('personal', null)}
                  className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                >
                  Criar repertório
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredRepertorios.map((item) => {
                const eixo = EIXO_MAP[item.eixo] || EIXOS_PRF[0];
                const tipo = TIPO_MAP[item.tipo] || TIPOS_REPERTORIO[0];
                const isFav = favoriteSet.has(item.id);
                const isMastered = masteredSet.has(item.id);
                const isCopied = copiedId === item.id;
                const isConfirmingDelete = confirmDeleteId === item.id;
                const isRecent = isPublishedRecently(item.publishedAt);
                const safeFonteUrl = getSafeExternalUrl(item.fonteUrl, '');
                const canAdminEdit = isAdmin && item.isLive;

                return (
                  <article
                    key={item.id}
                    className={`bg-white dark:bg-slate-900/90 border rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-colors ${
                      isMastered
                        ? 'border-emerald-300/90 dark:border-emerald-800/70'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {/* Metadados + Ações */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
                        <span className={`inline-flex items-center gap-1.5 ${eixo.textClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${eixo.dotClass}`} />
                          {eixo.shortLabel}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-600 dark:text-slate-300">{tipo.label}</span>
                        {item.aspectoTipico && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {item.aspectoTipico}
                            </span>
                          </>
                        )}
                        {isRecent && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-emerald-600 dark:text-emerald-400">Recente</span>
                          </>
                        )}
                        {item.isCustom && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-sky-600 dark:text-sky-400">Pessoal</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item.id)}
                          title={isFav ? 'Remover dos favoritos' : 'Favoritar repertório'}
                          aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar repertório'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            isFav
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleMastered(item.id)}
                          title={isMastered ? 'Marcar como pendente' : 'Marcar como dominado'}
                          aria-label={isMastered ? 'Marcar como pendente' : 'Marcar como dominado'}
                          className={`h-7 px-2 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                            isMastered
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isMastered ? 'Dominado' : 'Dominar'}</span>
                        </button>

                        {(item.isCustom || canAdminEdit) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenModal(canAdminEdit ? 'global' : 'personal', item)}
                              title="Editar repertório"
                              aria-label="Editar repertório"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busyActionId === item.id}
                              onClick={() =>
                                canAdminEdit ? handleDeleteGlobal(item) : handleDeleteCustom(item.id)
                              }
                              title={isConfirmingDelete ? 'Clique novamente para excluir' : 'Excluir repertório'}
                              aria-label="Excluir repertório"
                              className={`h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 ${
                                isConfirmingDelete
                                  ? 'px-2 bg-rose-600 text-white text-[11px] font-semibold'
                                  : 'w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {isConfirmingDelete ? 'Excluir?' : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Título e Fonte */}
                    <div className="space-y-1">
                      <h3 className="font-display text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug">
                        {item.titulo}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{item.fonte}</span>
                        </span>
                        {item.dataReferencia && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                            ({formatShortDate(item.dataReferencia)})
                          </span>
                        )}
                        {safeFonteUrl && (
                          <a
                            href={safeFonteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <span>Fonte oficial</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Resumo */}
                    {item.resumo && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.resumo}
                      </p>
                    )}

                    {/* Bloco de Aplicação Cebraspe */}
                    <div className="mt-auto bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/90 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          Como aplicar (padrão Cebraspe)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.id, item.comoUsar)}
                          className={`h-7 px-2.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400 dark:hover:border-sky-600'
                          }`}
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copiado' : 'Copiar frase'}</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed">
                        “{item.comoUsar}”
                      </p>
                    </div>

                    {/* Palavras-chave discretas */}
                    {Array.isArray(item.palavrasChave) && item.palavrasChave.length > 0 && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {item.palavrasChave.slice(0, 5).map((kw) => `#${kw}`).join('  ·  ')}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subView === 'modelo' && (
        /* Sub-view 2: Modelo Cebraspe, Esqueleto de 30 linhas, Calculadora e Conectivos */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Coluna Esquerda: Esqueleto 30 linhas + Regras de Ouro */}
          <div className="lg:col-span-7 space-y-5">
            <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Esqueleto Estratégico de 30 Linhas (Cebraspe PRF)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No Cebraspe, a correção segue um espelho objetivo de quesitos. Distribua o espaço proporcionalmente à pontuação de cada aspecto do comando.
                </p>
              </div>

              <div className="space-y-3">
                {CEBRASPE_SKELETON.map((bloco, index) => (
                  <div
                    key={bloco.parte}
                    className="p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-400 text-[11px] font-bold font-mono tabular-nums flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {bloco.parte}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-400">
                        {bloco.linhas}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {bloco.objetivo}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">Na prática: </strong>
                      {bloco.dica}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Regras de Ouro da Banca Cebraspe
                </h2>
              </div>
              <ul className="space-y-2.5">
                {CEBRASPE_REGRAS_OURO.map((regra, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold font-mono tabular-nums flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{regra}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Coluna Direita: Calculadora Oficial + Conectivos */}
          <div className="lg:col-span-5 space-y-5">
            <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Calculadora Oficial Cebraspe
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    ND = NC − 2 × (NE / TL)
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  Máx. 20,00 pts
                </span>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-nc" className="font-semibold text-slate-700 dark:text-slate-300">
                      Nota de Conteúdo (NC)
                    </label>
                    <input
                      id="calc-nc"
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={calcNC}
                      onChange={(e) => setCalcNC(e.target.value)}
                      className="w-20 h-8 px-2 rounded-lg text-right font-mono font-bold tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.25"
                    value={safeNC}
                    onChange={(e) => setCalcNC(Number(e.target.value))}
                    className="w-full accent-sky-600 dark:accent-sky-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-ne" className="font-semibold text-slate-700 dark:text-slate-300">
                      Total de Erros Gramaticais (NE)
                    </label>
                    <input
                      id="calc-ne"
                      type="number"
                      min="0"
                      max="60"
                      step="1"
                      value={calcNE}
                      onChange={(e) => setCalcNE(e.target.value)}
                      className="w-20 h-8 px-2 rounded-lg text-right font-mono font-bold tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={Math.min(30, safeNE)}
                    onChange={(e) => setCalcNE(Number(e.target.value))}
                    className="w-full accent-rose-600 dark:accent-rose-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-tl" className="font-semibold text-slate-700 dark:text-slate-300">
                      Total de Linhas Escritas (TL)
                    </label>
                    <input
                      id="calc-tl"
                      type="number"
                      min="1"
                      max="30"
                      step="1"
                      value={calcTL}
                      onChange={(e) => setCalcTL(e.target.value)}
                      className="w-20 h-8 px-2 rounded-lg text-right font-mono font-bold tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={Math.max(10, safeTL)}
                    onChange={(e) => setCalcTL(Number(e.target.value))}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Resultado */}
              <div className={`rounded-xl border p-4 space-y-2.5 ${scoreTone.boxClass}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nota Final Estimada (ND)
                  </span>
                  <div className="text-right">
                    <span className={`font-display text-2xl sm:text-3xl font-extrabold tabular-nums ${scoreTone.textClass}`}>
                      {notaFinal.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                      / 20,00
                    </span>
                  </div>
                </div>

                <p className={`text-xs font-semibold ${scoreTone.textClass}`}>
                  {scoreTone.label}
                </p>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                  <span>
                    Desconto total: <strong className="text-slate-900 dark:text-slate-100">-{descontoErros.toFixed(2).replace('.', ',')} pts</strong>
                  </span>
                  <span>
                    Cada erro custa: <strong className="text-slate-900 dark:text-slate-100">-{pesoPorErro.toFixed(3).replace('.', ',')} pts</strong>
                  </span>
                </div>

                {safeTL < 30 && safeNE > 0 && ganhoCom30 >= 0.01 && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Com os mesmos {safeNE} erros em 30 linhas, sua nota subiria para{' '}
                    <strong className="tabular-nums text-slate-900 dark:text-white">
                      {notaSe30Linhas.toFixed(2).replace('.', ',')}
                    </strong>{' '}
                    (+{ganhoCom30.toFixed(2).replace('.', ',')} pts).
                  </p>
                )}
              </div>
            </section>

            {/* Conectivos de Precisão */}
            <section className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
                <div>
                  <h2 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Conectivos de Precisão
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clique em qualquer expressão para copiar e treinar coesão objetiva.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {CEBRASPE_CONECTIVOS.map((grupo) => (
                  <div key={grupo.categoria} className="space-y-1.5">
                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {grupo.categoria}
                    </h3>
                    <div className="space-y-1">
                      {grupo.itens.map((frase, idx) => {
                        const keyId = `con_${grupo.categoria}_${idx}`;
                        const isCopied = copiedId === keyId;
                        return (
                          <button
                            key={keyId}
                            type="button"
                            onClick={() => handleCopyText(keyId, frase, 'Conectivo copiado')}
                            className="w-full text-left px-3 py-2 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 hover:bg-sky-50/70 dark:hover:bg-sky-950/30 border border-slate-200/70 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <span className="leading-snug">{frase}</span>
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {subView === 'curadoria' && isAdmin && (
        /* Sub-view 3: Painel de Curadoria Admin (Fila do Radar + Publicação Imediata) */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Curadoria do Banco Vivo (Admin)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Aprove rascunhos captados diariamente pelo radar de fontes oficiais ou publique novos repertórios em tempo real para todos os alunos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {livePublished.length < CURATED_REPERTORIOS.length && (
                <button
                  type="button"
                  disabled={busyActionId === 'seed_base'}
                  onClick={handleSeedBaseCatalog}
                  className="h-9 px-3.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    {busyActionId === 'seed_base' ? 'Importando...' : 'Importar 24 base para nuvem'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenModal('global', null)}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publicar repertório imediato</span>
              </button>
            </div>
          </div>

          {livePending.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Fila de aprovação zerada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Assim que o radar diário captar novos dados oficiais ou leis relevantes para a PRF, os rascunhos aparecerão aqui para sua aprovação em 1 clique.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {livePending.map((item) => {
                const eixo = EIXO_MAP[item.eixo] || EIXOS_PRF[0];
                const tipo = TIPO_MAP[item.tipo] || TIPOS_REPERTORIO[0];
                const safeFonteUrl = getSafeExternalUrl(item.fonteUrl, '');
                const isBusy = busyActionId === item.id;

                return (
                  <article
                    key={item.id}
                    className="bg-white dark:bg-slate-900/90 border border-amber-300/80 dark:border-amber-800/70 rounded-xl p-4 sm:p-5 flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
                        <span className="text-amber-700 dark:text-amber-400">Pendente · Radar</span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className={`inline-flex items-center gap-1.5 ${eixo.textClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${eixo.dotClass}`} />
                          {eixo.shortLabel}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-600 dark:text-slate-300">{tipo.label}</span>
                      </div>

                      {item.dataReferencia && (
                        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {formatShortDate(item.dataReferencia)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug">
                        {item.titulo}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{item.fonte}</span>
                        {safeFonteUrl && (
                          <a
                            href={safeFonteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            <span>Verificar matéria original</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.resumo}
                    </p>

                    <div className="bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/90 rounded-lg p-3 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Sugestão de aplicação Cebraspe
                      </span>
                      <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed">
                        “{item.comoUsar}”
                      </p>
                    </div>

                    <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleArchivePending(item)}
                        className="h-8 px-3 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleOpenModal('approve_pending', item)}
                        className="h-8 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Revisar e editar</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickApprovePending(item)}
                        className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBusy ? 'Publicando...' : 'Aprovar e publicar'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <RepertorioFormModal
        isOpen={modalState.isOpen}
        initialItem={modalState.item}
        mode={modalState.mode}
        isSaving={isSavingGlobal}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
      />
    </div>
  );
}
