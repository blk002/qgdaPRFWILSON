import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  Search,
  ChevronRight,
  Crosshair
} from 'lucide-react';
import SimuladoEvolutionChart from '../components/simulados/SimuladoEvolutionChart';
import SimuladoFormModal from '../components/simulados/SimuladoFormModal';
import {
  NOTA_CORTE_PRF,
  NOTA_MINIMA_GERAL,
  NOTA_ELITE_PRF,
  TOTAL_QUESTOES_PRF,
  PRF_BLOCKS,
  formatBrDate,
  isFiniteNum,
  getEliminationInfo,
  getDateOriginLabel,
  getBlockShortCode
} from '../components/simulados/simuladoUtils';

function clampPct(val, max = TOTAL_QUESTOES_PRF) {
  return Math.max(0, Math.min(100, (Number(val || 0) / max) * 100));
}

export default function Simulados() {
  const {
    simulados = [],
    setSimulados,
    addXP,
    unlockMedal,
    updateMissionProgress,
    setGlobalModal
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingSimulado, setEditingSimulado] = useState(null);
  const [selectedSimId, setSelectedSimId] = useState(null);
  const [chartSeriesKey, setChartSeriesKey] = useState('geral');

  // Filtros do Explorador Master-Detail
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'failed'
  const [sortDesc, setSortDesc] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectorBlockFilter, setInspectorBlockFilter] = useState('all');

  // Filtro da Matriz Consolidada por Matéria
  const [subjectBlockFilter, setSubjectBlockFilter] = useState('all');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Lista enriquecida com índice cronológico, delta anterior e status de eliminação
  const enrichedSimulados = useMemo(() => {
    const toSortableIsoDate = (raw) => {
      const s = String(raw || '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return br ? `${br[3]}-${br[2]}-${br[1]}` : s;
    };
    const sortedList = [...(simulados || [])].sort((a, b) =>
      toSortableIsoDate(a?.data).localeCompare(toSortableIsoDate(b?.data))
    );
    return sortedList.map((sim, index) => {
      const prev = index > 0 ? sortedList[index - 1] : null;
      const liquidaNum = Number(sim?.liquida) || 0;
      const delta = prev !== null ? liquidaNum - (Number(prev?.liquida) || 0) : null;
      const elim = getEliminationInfo(sim);
      return {
        sim,
        index,
        liquidaNum,
        delta,
        elim
      };
    });
  }, [simulados]);

  // Seleção efetiva (sempre aponta para um simulado existente, padrão = mais recente)
  const selectedEntry = useMemo(() => {
    if (enrichedSimulados.length === 0) return null;
    if (selectedSimId !== null) {
      const found = enrichedSimulados.find((e) => e.sim.id === selectedSimId);
      if (found) return found;
    }
    return enrichedSimulados[enrichedSimulados.length - 1];
  }, [enrichedSimulados, selectedSimId]);

  const effectiveSelectedId = selectedEntry?.sim?.id ?? null;

  // Lista filtrada/ordenada para o trilho esquerdo do Explorador
  const visibleEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = enrichedSimulados.filter(({ sim, elim }) => {
      if (statusFilter === 'approved' && elim.failed) return false;
      if (statusFilter === 'failed' && !elim.failed) return false;
      if (q) {
        const hay = `${sim.title || ''} ${formatBrDate(sim.data)} ${sim.source || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return sortDesc ? [...list].reverse() : list;
  }, [enrichedSimulados, statusFilter, searchTerm, sortDesc]);

  // Matérias consolidadas de todos os simulados
  const aggregatedSubjects = useMemo(() => {
    const map = new Map();
    const blocoOrder = { 'Bloco I': 1, 'Bloco II': 2, 'Bloco III': 3 };

    (simulados || []).forEach((sim) => {
      (sim?.subjectScores || []).forEach((sc) => {
        if (!sc || !sc.name) return;
        const key = String(sc.name).trim().toLowerCase();
        const prev = map.get(key) || {
          name: sc.name,
          bloco: sc.bloco || 'Bloco I',
          hits: 0,
          errors: 0,
          blank: 0,
          total: 0,
          liquida: 0,
          count: 0
        };
        const h = Number(sc.hits) || 0;
        const e = Number(sc.errors) || 0;
        const bl = Number(sc.blank) || 0;
        const tot = Number(sc.total) || h + e + bl;
        prev.hits += h;
        prev.errors += e;
        prev.blank += bl;
        prev.total += tot;
        prev.liquida += sc.liquida != null ? Number(sc.liquida) : h - e;
        prev.count += 1;
        map.set(key, prev);
      });
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        pct: item.total > 0 ? Math.round((item.hits / item.total) * 100) : 0,
        blocoRank: blocoOrder[item.bloco] || 9
      }))
      .sort((a, b) => a.pct - b.pct || b.errors - a.errors);
  }, [simulados]);

  const filteredAggregatedSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return aggregatedSubjects.filter((s) => {
      if (subjectBlockFilter !== 'all' && s.bloco !== subjectBlockFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [aggregatedSubjects, subjectBlockFilter, subjectSearch]);

  // Métricas gerais e por bloco
  const metrics = useMemo(() => {
    const total = simulados.length;
    const caveiraCount = simulados.filter((s) => s?.source === 'caveira').length;

    if (total === 0) {
      return {
        total: 0,
        caveiraCount: 0,
        mediaLiquida: 0,
        ultimoLiquida: 0,
        recorde: 0,
        approvedCount: 0,
        approvalRate: 0,
        lastDelta: null,
        weakPoint: 'Aguardando simulados',
        bestHeadroomBlock: null,
        blocks: PRF_BLOCKS.map((b) => ({
          ...b,
          hasData: false,
          avg: 0,
          best: 0,
          pct: 0
        }))
      };
    }

    const mediaLiquida = Math.round(
      simulados.reduce((acc, s) => acc + (Number(s.liquida) || 0), 0) / total
    );
    const ultimoLiquida = Number(simulados[total - 1]?.liquida) || 0;
    const recorde = Math.max(...simulados.map((s) => Number(s.liquida) || 0));
    const approvedCount = enrichedSimulados.filter((e) => !e.elim.failed).length;
    const approvalRate = Math.round((approvedCount / total) * 100);
    const lastDelta =
      total >= 2
        ? (Number(simulados[total - 1].liquida) || 0) - (Number(simulados[total - 2].liquida) || 0)
        : null;

    const calcBlockStats = (field) => {
      const valid = simulados
        .map((s) => s?.[field])
        .filter((v) => isFiniteNum(v))
        .map(Number);
      if (valid.length === 0) return { hasData: false, avg: 0, best: 0 };
      const sum = valid.reduce((acc, v) => acc + v, 0);
      return {
        hasData: true,
        avg: sum / valid.length,
        best: Math.max(...valid)
      };
    };

    const blocks = PRF_BLOCKS.map((b) => {
      const st = calcBlockStats(`${b.key}Liquida`);
      return {
        ...b,
        hasData: st.hasData,
        avg: Math.round(st.avg * 10) / 10,
        best: st.best,
        pct: st.hasData ? Math.round((st.avg / b.total) * 100) : 0,
        headroom: st.hasData ? Math.max(0, Math.round((b.total * 0.75 - st.avg) * 10) / 10) : 0
      };
    });

    const blocksWithData = blocks.filter((b) => b.hasData);
    const weakestBlock =
      blocksWithData.length > 0 ? [...blocksWithData].sort((a, b) => a.pct - b.pct)[0] : null;
    const bestHeadroomBlock =
      blocksWithData.length > 0
        ? [...blocksWithData].sort((a, b) => b.headroom - a.headroom)[0]
        : null;

    return {
      total,
      caveiraCount,
      mediaLiquida,
      ultimoLiquida,
      recorde,
      approvedCount,
      approvalRate,
      lastDelta,
      weakPoint: weakestBlock ? `${weakestBlock.code} · ${weakestBlock.name}` : 'Sem blocos',
      bestHeadroomBlock,
      blocks
    };
  }, [simulados, enrichedSimulados]);

  const handleOpenNew = () => {
    setEditingSimulado(null);
    setShowModal(true);
  };

  const handleEditSimulado = (sim) => {
    setEditingSimulado(sim);
    setShowModal(true);
  };

  const handleDeleteSimulado = (sim) => {
    setGlobalModal({
      type: 'confirm',
      variant: 'danger',
      title: 'Excluir Simulado?',
      message: 'Esta ação removerá permanentemente esta nota do seu histórico de evolução.',
      confirmText: 'Excluir',
      onConfirm: () => setSimulados((prev) => prev.filter((s) => s.id !== sim.id))
    });
  };

  const handleSaveSimulado = (payload) => {
    if (editingSimulado) {
      setSimulados((prev) =>
        prev.map((s) =>
          s.id === editingSimulado.id
            ? {
                ...s,
                ...payload,
                dateSource: 'manual'
              }
            : s
        )
      );
      setSelectedSimId(editingSimulado.id);
    } else {
      const newId = Date.now();
      setSimulados((prev) => [...prev, { id: newId, ...payload }]);
      setSelectedSimId(newId);
      addXP(500, 'Simulado de Prova registrado');
      updateMissionProgress('simulado', 1);
      if (payload.liquida >= NOTA_ELITE_PRF) unlockMedal('elite');
    }
    setShowModal(false);
    setEditingSimulado(null);
  };

  const handleClearCaveira = () => {
    setGlobalModal({
      type: 'confirm',
      variant: 'danger',
      title: 'Limpar Simulados do Caveira',
      message: `Remover os ${metrics.caveiraCount} simulado(s) importados do Caveira? Seus simulados cadastrados manualmente serão mantidos.`,
      confirmText: 'Limpar',
      onConfirm: () => setSimulados((prev) => prev.filter((s) => s?.source !== 'caveira'))
    });
  };

  const weakestSubject = aggregatedSubjects[0] || null;
  const mediaVsCorte = metrics.mediaLiquida - NOTA_CORTE_PRF;
  const selectedSubjects = useMemo(() => {
    const raw = selectedEntry?.sim?.subjectScores;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return [...raw]
      .filter((sc) => inspectorBlockFilter === 'all' || sc.bloco === inspectorBlockFilter)
      .sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0) || (Number(b.errors) || 0) - (Number(a.errors) || 0));
  }, [selectedEntry, inspectorBlockFilter]);

  return (
    <div className="fade-in w-full pb-10 flex flex-col gap-5">
      {/* FAIXA 1: Placar de Prontidão PRF & Régua Cebraspe */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Central de Simulados PRF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Padrão Cebraspe · 120 questões · 1 errada anula 1 certa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {metrics.caveiraCount > 0 && (
              <button
                type="button"
                onClick={handleClearCaveira}
                className="h-9 px-3 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/60 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar Caveira ({metrics.caveiraCount})
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenNew}
              className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Registrar Simulado
            </button>
          </div>
        </div>

        {/* Corpo assimétrico: Placar principal + Régua Cebraspe + Telemetria */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Esquerda: Nota Média & Status frente ao corte */}
          <div className="lg:col-span-4 flex flex-col gap-2 lg:pr-6 lg:border-r border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Média Líquida Atual
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-mono font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {metrics.total > 0 ? metrics.mediaLiquida : '—'}
              </span>
              <span className="text-sm font-mono text-slate-400">/ 120 pts</span>
              {metrics.lastDelta !== null && (
                <span
                  title="Variação no último simulado"
                  className={`ml-auto inline-flex items-center text-xs font-mono font-bold tabular-nums ${
                    metrics.lastDelta >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {metrics.lastDelta >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {metrics.lastDelta >= 0 ? `+${metrics.lastDelta}` : metrics.lastDelta}
                </span>
              )}
            </div>

            <p
              className={`text-xs font-semibold tabular-nums ${
                metrics.total === 0
                  ? 'text-slate-400 dark:text-slate-500'
                  : mediaVsCorte >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : metrics.mediaLiquida < NOTA_MINIMA_GERAL
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {metrics.total === 0
                ? 'Registre seu primeiro simulado para medir sua prontidão.'
                : mediaVsCorte >= 0
                  ? `+${mediaVsCorte} pts acima da zona de corte PRF (75)`
                  : `Faltam ${Math.abs(mediaVsCorte)} pts para atingir o corte PRF (75)`}
            </p>
          </div>

          {/* Direita: Régua de Pontuação Cebraspe (0 -> 120) + 4 indicadores */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Régua visual */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Régua de Prontidão Cebraspe
                </span>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  {metrics.total > 0 && (
                    <>
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        Último: {metrics.ultimoLiquida}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Recorde: {metrics.recorde}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Faixa segmentada */}
              <div className="relative pt-3 pb-5">
                <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                  {/* 0-50 Eliminatório (41.67%) */}
                  <div
                    className="h-full bg-red-500/20 dark:bg-red-500/25 border-r border-white dark:border-slate-900"
                    style={{ width: `${(NOTA_MINIMA_GERAL / TOTAL_QUESTOES_PRF) * 100}%` }}
                  />
                  {/* 50-75 Aprovado nos mínimos (20.83%) */}
                  <div
                    className="h-full bg-amber-500/25 dark:bg-amber-500/25 border-r border-white dark:border-slate-900"
                    style={{
                      width: `${((NOTA_CORTE_PRF - NOTA_MINIMA_GERAL) / TOTAL_QUESTOES_PRF) * 100}%`
                    }}
                  />
                  {/* 75-96 Zona de corte (17.5%) */}
                  <div
                    className="h-full bg-emerald-500/25 dark:bg-emerald-500/30 border-r border-white dark:border-slate-900"
                    style={{
                      width: `${((NOTA_ELITE_PRF - NOTA_CORTE_PRF) / TOTAL_QUESTOES_PRF) * 100}%`
                    }}
                  />
                  {/* 96-120 Elite (20%) */}
                  <div className="h-full flex-1 bg-sky-500/25 dark:bg-sky-500/30" />
                </div>

                {/* Marcadores fixos do edital */}
                {[
                  { pts: 0, label: '0', align: 'left-0 translate-x-0' },
                  { pts: 50, label: '50 mín', align: '-translate-x-1/2' },
                  { pts: 75, label: '75 corte', align: '-translate-x-1/2 font-semibold text-amber-600 dark:text-amber-400' },
                  { pts: 96, label: '96 elite', align: '-translate-x-1/2' },
                  { pts: 120, label: '120', align: '-translate-x-full' }
                ].map((mark) => (
                  <span
                    key={mark.pts}
                    style={{ left: `${(mark.pts / TOTAL_QUESTOES_PRF) * 100}%` }}
                    className={`absolute bottom-0 text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500 whitespace-nowrap ${mark.align}`}
                  >
                    {mark.label}
                  </span>
                ))}

                {/* Marcador do Recorde */}
                {metrics.total > 0 && (
                  <div
                    style={{ left: `${clampPct(metrics.recorde)}%` }}
                    title={`Recorde pessoal: ${metrics.recorde} pts`}
                    className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  >
                    <div className="w-2.5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                  </div>
                )}

                {/* Marcador da Média */}
                {metrics.total > 0 && (
                  <div
                    style={{ left: `${clampPct(metrics.mediaLiquida)}%` }}
                    title={`Média líquida: ${metrics.mediaLiquida} pts`}
                    className="absolute top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  >
                    <div className="w-3.5 h-6 rounded-full bg-sky-600 dark:bg-sky-400 border-2 border-white dark:border-slate-900 shadow-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* 4 métricas compactas com divisórias finas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="min-w-0">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Simulados
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {metrics.total}
                </span>
              </div>

              <div className="min-w-0 sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Aprovados
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {metrics.approvedCount}/{metrics.total}
                  {metrics.total > 0 && (
                    <span className="text-[11px] font-normal text-slate-400 ml-1">
                      ({metrics.approvalRate}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="min-w-0 sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Recorde
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {metrics.total > 0 ? `${metrics.recorde} pts` : '—'}
                </span>
              </div>

              <div className="min-w-0 sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Ponto crítico
                </span>
                <span
                  className={`block text-xs font-bold truncate mt-0.5 ${
                    metrics.total > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  title={metrics.weakPoint}
                >
                  {metrics.weakPoint}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA 2: Trajetória Interativa (8 cols) + Auditoria de Blocos (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8 min-w-0">
          <SimuladoEvolutionChart
            simulados={simulados}
            selectedSimId={effectiveSelectedId}
            onSelectSimulado={(id) => setSelectedSimId(id)}
            seriesKey={chartSeriesKey}
            onSeriesChange={setChartSeriesKey}
            onOpenNew={handleOpenNew}
          />
        </div>

        <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Auditoria por Bloco
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique em um bloco para filtrar a curva
                </p>
              </div>
              {chartSeriesKey !== 'geral' && (
                <button
                  type="button"
                  onClick={() => setChartSeriesKey('geral')}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Ver Geral
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {metrics.blocks.map((blk) => {
                const minPct = Math.round((blk.min / blk.total) * 100);
                const clampedPct = blk.hasData ? Math.max(0, Math.min(100, blk.pct)) : 0;
                const isBelowMin = blk.hasData && blk.avg < blk.min;
                const margin = Math.round((blk.avg - blk.min) * 10) / 10;
                const isActiveSeries = chartSeriesKey === blk.key;

                return (
                  <button
                    key={blk.key}
                    type="button"
                    onClick={() => setChartSeriesKey(isActiveSeries ? 'geral' : blk.key)}
                    className={`w-full text-left py-3 first:pt-1 last:pb-1 transition-colors cursor-pointer rounded-lg px-2 -mx-2 flex flex-col gap-1.5 ${
                      isActiveSeries
                        ? 'bg-sky-50/70 dark:bg-sky-950/35'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: blk.color }}
                        />
                        <span>
                          {blk.code} · {blk.name}
                        </span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {blk.hasData ? blk.avg : '—'}
                        <span className="text-slate-400 font-normal">/{blk.total}</span>
                      </span>
                    </div>

                    <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isBelowMin
                            ? 'bg-red-500'
                            : clampedPct >= 65
                              ? 'bg-emerald-500'
                              : 'bg-sky-500'
                        }`}
                        style={{ width: `${clampedPct}%` }}
                      />
                      <div
                        style={{ left: `${minPct}%` }}
                        title={`Mínimo eliminatório: ${blk.min} pts`}
                        className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-amber-500 dark:bg-amber-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">
                        Mín {blk.min} · Best {blk.hasData ? blk.best : '—'}
                      </span>
                      {blk.hasData ? (
                        <span
                          className={
                            isBelowMin
                              ? 'font-semibold text-red-600 dark:text-red-400'
                              : 'font-medium text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {margin >= 0 ? `+${margin}` : margin} ({clampedPct}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direcionamento tático de ganho */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <Crosshair className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              {metrics.total > 0 ? (
                <>
                  Maior alavanca de nota:{' '}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {metrics.bestHeadroomBlock
                      ? `${metrics.bestHeadroomBlock.code} · ${metrics.bestHeadroomBlock.name}`
                      : metrics.weakPoint}
                  </strong>
                  {weakestSubject ? (
                    <>
                      . Disciplina mais crítica:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {weakestSubject.name}
                      </strong>{' '}
                      ({weakestSubject.pct}%).
                    </>
                  ) : (
                    '. Priorize baterias de questões Cebraspe neste bloco para ampliar margem líquida.'
                  )}
                </>
              ) : (
                'Mínimos eliminatórios PRF: B1 ≥ 15/55, B2 ≥ 10/30, B3 ≥ 10/35 e Geral ≥ 50/120.'
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* FAIXA 3: Explorador Master-Detail de Simulados */}
      {simulados.length > 0 && selectedEntry && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Trilho Esquerdo: Lista Compacta de Simulados */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Histórico ({simulados.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSortDesc((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>{sortDesc ? 'Mais recentes' : 'Mais antigos'}</span>
                  </button>
                </div>

                {/* Filtros rápidos */}
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'approved', label: 'Aprovados' },
                    { id: 'failed', label: 'Reprovados' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStatusFilter(f.id)}
                      className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex-1 whitespace-nowrap ${
                        statusFilter === f.id
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {simulados.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome ou data..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[520px] overflow-y-auto custom-scrollbar">
                {visibleEntries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Nenhum simulado corresponde ao filtro selecionado.
                  </div>
                ) : (
                  visibleEntries.map(({ sim, index, liquidaNum, delta, elim }) => {
                    const isSelected = sim.id === effectiveSelectedId;
                    return (
                      <button
                        key={sim.id}
                        type="button"
                        onClick={() => {
                          setSelectedSimId(sim.id);
                          setInspectorBlockFilter('all');
                        }}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer relative ${
                          isSelected
                            ? 'bg-sky-50/75 dark:bg-sky-950/35'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/35'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-sky-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-mono text-[11px] font-semibold text-slate-400">
                              #{index + 1}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {sim.title || `Simulado ${formatBrDate(sim.data)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            <span>{formatBrDate(sim.data)}</span>
                            {sim.source === 'caveira' && (
                              <span className="font-sans font-semibold text-sky-600 dark:text-sky-400">
                                · Caveira
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-right font-mono tabular-nums">
                            <span
                              className={`block text-sm font-bold leading-none ${
                                elim.failed
                                  ? 'text-red-600 dark:text-red-400'
                                  : liquidaNum >= NOTA_CORTE_PRF
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {liquidaNum}
                            </span>
                            {delta !== null && (
                              <span
                                className={`block text-[10px] font-semibold mt-0.5 ${
                                  delta > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : delta < 0
                                      ? 'text-red-500 dark:text-red-400'
                                      : 'text-slate-400'
                                }`}
                              >
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected
                                ? 'text-sky-600 dark:text-sky-400 translate-x-0.5'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Painel Direito: Raio-X do Simulado Selecionado */}
            <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col gap-5">
              {/* Cabeçalho do simulado inspecionado */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      Simulado #{selectedEntry.index + 1}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {formatBrDate(selectedEntry.sim.data)}
                    </span>
                    {selectedEntry.sim.source === 'caveira' && (
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                        · Caveira
                      </span>
                    )}
                    {getDateOriginLabel(selectedEntry.sim.dateSource) && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        · {getDateOriginLabel(selectedEntry.sim.dateSource)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedEntry.sim.title || `Simulado de ${formatBrDate(selectedEntry.sim.data)}`}
                  </h3>

                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    {selectedEntry.elim.failed ? (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Reprovado nos mínimos ({selectedEntry.elim.reason})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {selectedEntry.liquidaNum >= NOTA_CORTE_PRF
                            ? 'Aprovado dentro da zona de corte PRF (≥ 75)'
                            : `Aprovado nos mínimos · ${NOTA_CORTE_PRF - selectedEntry.liquidaNum} pts p/ corte 75`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditSimulado(selectedEntry.sim)}
                    className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSimulado(selectedEntry.sim)}
                    title="Excluir simulado"
                    aria-label="Excluir simulado"
                    className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Resumo numérico do simulado selecionado */}
              {(() => {
                const s = selectedEntry.sim;
                const hasRawCounts =
                  isFiniteNum(s.b1C) || isFiniteNum(s.b2C) || isFiniteNum(s.b3C);
                const sumC = hasRawCounts
                  ? (Number(s.b1C) || 0) + (Number(s.b2C) || 0) + (Number(s.b3C) || 0)
                  : null;
                const sumE = hasRawCounts
                  ? (Number(s.b1E) || 0) + (Number(s.b2E) || 0) + (Number(s.b3E) || 0)
                  : null;
                const sumB =
                  sumC !== null && sumE !== null
                    ? Math.max(0, TOTAL_QUESTOES_PRF - sumC - sumE)
                    : null;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 px-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800">
                    <div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Nota Líquida
                      </span>
                      <div className="flex items-baseline gap-1.5 font-mono tabular-nums mt-0.5">
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {selectedEntry.liquidaNum}
                        </span>
                        <span className="text-xs text-slate-400">/120</span>
                      </div>
                    </div>

                    <div className="sm:pl-4 sm:border-l border-slate-200/80 dark:border-slate-800">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Variação anterior
                      </span>
                      <span
                        className={`block text-lg font-mono font-bold tabular-nums mt-0.5 ${
                          selectedEntry.delta === null
                            ? 'text-slate-400'
                            : selectedEntry.delta > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : selectedEntry.delta < 0
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-slate-500'
                        }`}
                      >
                        {selectedEntry.delta === null
                          ? '1º reg.'
                          : selectedEntry.delta > 0
                            ? `+${selectedEntry.delta} pts`
                            : `${selectedEntry.delta} pts`}
                      </span>
                    </div>

                    <div className="sm:pl-4 sm:border-l border-slate-200/80 dark:border-slate-800">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Aproveitamento
                      </span>
                      <span className="block text-lg font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                        {Math.round((selectedEntry.liquidaNum / TOTAL_QUESTOES_PRF) * 100)}%
                      </span>
                    </div>

                    <div className="sm:pl-4 sm:border-l border-slate-200/80 dark:border-slate-800">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Balanço (C · E · B)
                      </span>
                      {sumC !== null ? (
                        <span className="block text-sm font-mono font-bold tabular-nums mt-1">
                          <span className="text-emerald-600 dark:text-emerald-400">{sumC}✓</span>{' '}
                          <span className="text-slate-300 dark:text-slate-700">·</span>{' '}
                          <span className="text-red-600 dark:text-red-400">{sumE}✗</span>{' '}
                          <span className="text-slate-300 dark:text-slate-700">·</span>{' '}
                          <span className="text-slate-500">{sumB}○</span>
                        </span>
                      ) : (
                        <span className="block text-xs text-slate-400 mt-1">Apenas líquida</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Desempenho por bloco deste simulado */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Diagnóstico por Bloco neste Simulado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-slate-200 dark:border-slate-800 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
                  {PRF_BLOCKS.map((blk) => {
                    const s = selectedEntry.sim;
                    const liq = s?.[`${blk.key}Liquida`];
                    const hasLiq = isFiniteNum(liq);
                    const liqNum = hasLiq ? Number(liq) : 0;
                    const cVal = isFiniteNum(s?.[`${blk.key}C`]) ? Number(s[`${blk.key}C`]) : null;
                    const eVal = isFiniteNum(s?.[`${blk.key}E`]) ? Number(s[`${blk.key}E`]) : null;
                    const blanks =
                      cVal !== null && eVal !== null ? Math.max(0, blk.total - cVal - eVal) : null;
                    const failedBlock = hasLiq && liqNum < blk.min;

                    const hitPct = cVal !== null ? Math.min(100, (cVal / blk.total) * 100) : 0;
                    const errPct =
                      eVal !== null ? Math.min(100 - hitPct, (eVal / blk.total) * 100) : 0;
                    const netPct = hasLiq ? Math.max(0, Math.min(100, (liqNum / blk.total) * 100)) : 0;

                    return (
                      <div key={blk.key} className="p-3.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {blk.code} · {blk.name}
                          </span>
                          <span
                            className={`text-[11px] font-mono tabular-nums font-semibold ${
                              !hasLiq
                                ? 'text-slate-400'
                                : failedBlock
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {!hasLiq ? '—' : failedBlock ? `< mín ${blk.min}` : `≥ mín ${blk.min}`}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between font-mono tabular-nums">
                          <span
                            className={`text-xl font-bold ${
                              !hasLiq
                                ? 'text-slate-400'
                                : failedBlock
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {hasLiq ? liqNum : '—'}
                            <span className="text-xs font-normal text-slate-400">/{blk.total}</span>
                          </span>
                          {cVal !== null && eVal !== null && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                {cVal}✓
                              </strong>{' '}
                              <strong className="text-red-600 dark:text-red-400">{eVal}✗</strong>{' '}
                              <span>{blanks}○</span>
                            </span>
                          )}
                        </div>

                        {/* Barra proporcional (Certas/Erradas se disponíveis, senão líquida) */}
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                          {cVal !== null && eVal !== null ? (
                            <>
                              <div className="bg-emerald-500 h-full" style={{ width: `${hitPct}%` }} />
                              <div className="bg-red-500 h-full" style={{ width: `${errPct}%` }} />
                            </>
                          ) : (
                            <div
                              className={`h-full ${failedBlock ? 'bg-red-500' : 'bg-sky-500'}`}
                              style={{ width: `${netPct}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detalhamento de matérias do simulado selecionado (quando presente) */}
              {Array.isArray(selectedEntry.sim.subjectScores) &&
              selectedEntry.sim.subjectScores.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Disciplinas neste Simulado ({selectedEntry.sim.subjectScores.length})
                    </h4>
                    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70">
                      {[
                        { id: 'all', label: 'Todas' },
                        { id: 'Bloco I', label: 'B1' },
                        { id: 'Bloco II', label: 'B2' },
                        { id: 'Bloco III', label: 'B3' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setInspectorBlockFilter(tab.id)}
                          className={`h-6 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            inspectorBlockFilter === tab.id
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[280px] overflow-y-auto custom-scrollbar">
                    {selectedSubjects.map((sc, idx) => {
                      const pctNum = Number(sc.pct) || 0;
                      const scLiquida =
                        sc.liquida != null
                          ? Number(sc.liquida)
                          : (Number(sc.hits) || 0) - (Number(sc.errors) || 0);
                      const deltaOthers =
                        sc.othersPct !== undefined && sc.othersPct !== null
                          ? Math.round((pctNum - Number(sc.othersPct)) * 10) / 10
                          : null;

                      return (
                        <div
                          key={`${sc.name}-${idx}`}
                          className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                        >
                          <div className="min-w-0 sm:w-52 shrink-0 flex items-center gap-2 text-xs">
                            <span className="font-mono text-[11px] font-semibold text-slate-400 w-5 shrink-0">
                              {getBlockShortCode(sc.bloco)}
                            </span>
                            <span
                              className="font-semibold text-slate-800 dark:text-slate-200 truncate"
                              title={sc.name}
                            >
                              {sc.name}
                            </span>
                          </div>

                          <div className="flex-1 flex items-center gap-2.5 min-w-0">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pctNum >= 75
                                    ? 'bg-emerald-500'
                                    : pctNum >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100, pctNum))}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-mono font-bold tabular-nums w-10 text-right shrink-0 ${
                                pctNum >= 75
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : pctNum >= 50
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {pctNum}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                            <span>
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                {sc.hits}✓
                              </strong>{' '}
                              <strong className="text-red-600 dark:text-red-400">
                                {sc.errors}✗
                              </strong>{' '}
                              <span>{sc.blank}○</span>
                            </span>
                            <span
                              className={`font-semibold w-12 text-right ${
                                scLiquida > 0
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              Líq {scLiquida}
                            </span>
                            {deltaOthers !== null && (
                              <span
                                title={`Média da turma: ${sc.othersPct}%`}
                                className={`w-16 text-right font-semibold ${
                                  deltaOthers >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-500 dark:text-red-400'
                                }`}
                              >
                                {deltaOthers >= 0 ? `+${deltaOthers}%` : `${deltaOthers}%`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Simulado registrado com totais por bloco. Simulados importados do Caveira exibem também o desempenho individual por disciplina aqui.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAIXA 4: Matriz Consolidada por Disciplina (quando houver dados de disciplinas) */}
      {aggregatedSubjects.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-950/40">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Matriz Consolidada por Disciplina</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {aggregatedSubjects.length} disciplina(s) acumuladas · ordenadas da menor para a maior precisão
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {aggregatedSubjects.length > 6 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Filtrar matéria..."
                    className="h-8 w-40 sm:w-48 pl-8 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'Bloco I', label: 'B1' },
                  { id: 'Bloco II', label: 'B2' },
                  { id: 'Bloco III', label: 'B3' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSubjectBlockFilter(tab.id)}
                    className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      subjectBlockFilter === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5 w-14">Bloco</th>
                  <th className="py-2.5 px-3">Disciplina</th>
                  <th className="py-2.5 px-3 w-48">Aproveitamento</th>
                  <th className="py-2.5 px-3 text-right">C / E / B</th>
                  <th className="py-2.5 px-3 text-right">Questões</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Líquida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredAggregatedSubjects.map((sub) => (
                  <tr
                    key={sub.name}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2.5 px-4 sm:px-5 font-mono font-semibold text-slate-400">
                      {getBlockShortCode(sub.bloco)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {sub.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sub.pct >= 75
                                ? 'bg-emerald-500'
                                : sub.pct >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, sub.pct))}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-bold tabular-nums w-9 text-right ${
                            sub.pct >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : sub.pct >= 60
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {sub.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {sub.hits}✓
                      </span>{' '}
                      <span className="text-slate-300 dark:text-slate-700">·</span>{' '}
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        {sub.errors}✗
                      </span>{' '}
                      <span className="text-slate-300 dark:text-slate-700">·</span>{' '}
                      <span className="text-slate-500">{sub.blank}○</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {sub.total}
                    </td>
                    <td
                      className={`py-2.5 px-4 sm:px-5 text-right font-mono font-bold tabular-nums ${
                        sub.liquida > 0
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {sub.liquida}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal de Registro / Edição */}
      {showModal && (
        <SimuladoFormModal
          key={editingSimulado ? editingSimulado.id : 'new'}
          isOpen={showModal}
          editingSimulado={editingSimulado}
          onClose={() => {
            setShowModal(false);
            setEditingSimulado(null);
          }}
          onSubmit={handleSaveSimulado}
        />
      )}
    </div>
  );
}
