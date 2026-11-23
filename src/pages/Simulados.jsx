import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import SimuladoEvolutionChart from '../components/simulados/SimuladoEvolutionChart';
import SimuladoFormModal from '../components/simulados/SimuladoFormModal';

const NOTA_CORTE_PRF = 75;

function formatBrDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function getEliminationInfo(sim) {
  const hasBlocks =
    sim.b1Liquida !== undefined && sim.b2Liquida !== undefined && sim.b3Liquida !== undefined;
  if (!hasBlocks) {
    const failed = sim.pct !== undefined ? Number(sim.pct) < 50 : 50 > (Number(sim.liquida) || 0);
    return { failed, reason: failed ? 'Abaixo de 50%' : 'Aprovado' };
  }
  const reasons = [];
  if (sim.b1Liquida < 15) reasons.push('B1 < 15');
  if (sim.b2Liquida < 10) reasons.push('B2 < 10');
  if (sim.b3Liquida < 10) reasons.push('B3 < 10');
  if (sim.liquida < 50) reasons.push('Total < 50');
  return {
    failed: reasons.length > 0,
    reason: reasons.length > 0 ? reasons.join(' · ') : 'Aprovado nos mínimos'
  };
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
  const [expandedSimId, setExpandedSimId] = useState(null);
  const [subjectBlockFilter, setSubjectBlockFilter] = useState('all'); // 'all' | 'Bloco I' | 'Bloco II' | 'Bloco III'

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
        prev.liquida += sc.liquida !== undefined ? Number(sc.liquida) : h - e;
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
    if (subjectBlockFilter === 'all') return aggregatedSubjects;
    return aggregatedSubjects.filter((s) => s.bloco === subjectBlockFilter);
  }, [aggregatedSubjects, subjectBlockFilter]);

  const metrics = useMemo(() => {
    const total = simulados.length;
    const caveiraCount = simulados.filter((s) => s?.source === 'caveira').length;
    if (total === 0) {
      return {
        total: 0,
        caveiraCount: 0,
        mediaLiquida: 0,
        recorde: 0,
        approvedCount: 0,
        lastDelta: null,
        weakPoint: 'Aguardando simulados',
        blocks: [
          { id: 'b1', code: 'B1', name: 'Básicas', totalQ: 55, min: 15, avg: 0, pct: 0, hasData: false },
          { id: 'b2', code: 'B2', name: 'Trânsito', totalQ: 30, min: 10, avg: 0, pct: 0, hasData: false },
          { id: 'b3', code: 'B3', name: 'Direito', totalQ: 35, min: 10, avg: 0, pct: 0, hasData: false }
        ]
      };
    }

    const mediaLiquida = Math.round(
      simulados.reduce((acc, s) => acc + (Number(s.liquida) || 0), 0) / total
    );
    const recorde = Math.max(...simulados.map((s) => Number(s.liquida) || 0));
    const approvedCount = simulados.filter((s) => !getEliminationInfo(s).failed).length;
    const lastDelta =
      total >= 2
        ? (Number(simulados[total - 1].liquida) || 0) - (Number(simulados[total - 2].liquida) || 0)
        : null;

    const calcBlockAvg = (field) => {
      const valid = simulados
        .map((s) => s?.[field])
        .filter((v) => v !== undefined && v !== null && Number.isFinite(Number(v)))
        .map(Number);
      if (valid.length === 0) return { hasData: false, avg: 0 };
      const sum = valid.reduce((acc, v) => acc + v, 0);
      return { hasData: true, avg: sum / valid.length };
    };

    const b1Stat = calcBlockAvg('b1Liquida');
    const b2Stat = calcBlockAvg('b2Liquida');
    const b3Stat = calcBlockAvg('b3Liquida');

    const blocks = [
      { id: 'b1', code: 'B1', name: 'Básicas', totalQ: 55, min: 15, hasData: b1Stat.hasData, avg: Math.round(b1Stat.avg * 10) / 10, pct: b1Stat.hasData ? Math.round((b1Stat.avg / 55) * 100) : 0 },
      { id: 'b2', code: 'B2', name: 'Trânsito', totalQ: 30, min: 10, hasData: b2Stat.hasData, avg: Math.round(b2Stat.avg * 10) / 10, pct: b2Stat.hasData ? Math.round((b2Stat.avg / 30) * 100) : 0 },
      { id: 'b3', code: 'B3', name: 'Direito', totalQ: 35, min: 10, hasData: b3Stat.hasData, avg: Math.round(b3Stat.avg * 10) / 10, pct: b3Stat.hasData ? Math.round((b3Stat.avg / 35) * 100) : 0 }
    ];

    const blocksWithData = blocks.filter((b) => b.hasData);
    const weakestBlock = blocksWithData.length > 0
      ? [...blocksWithData].sort((a, b) => a.pct - b.pct)[0]
      : null;
    const weakPoint = weakestBlock ? `${weakestBlock.code} · ${weakestBlock.name}` : 'Sem detalhamento por bloco';

    return {
      total,
      caveiraCount,
      mediaLiquida,
      recorde,
      approvedCount,
      lastDelta,
      weakPoint,
      blocks
    };
  }, [simulados]);

  const handleOpenNew = () => {
    setEditingSimulado(null);
    setShowModal(true);
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
    } else {
      setSimulados((prev) => [...prev, { id: Date.now(), ...payload }]);
      addXP(500, 'Simulado de Prova registrado');
      updateMissionProgress('simulado', 1);
      if (payload.liquida >= 120 * 0.8) unlockMedal('elite');
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

  return (
    <div className="fade-in w-full pb-8 flex flex-col gap-4">
      {/* ZONA 1: Cabeçalho Estratégico + 4 KPIs Tabulares */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                Evolução em Simulados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Padrão Cebraspe · 120 questões · Certa anula errada
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {metrics.caveiraCount > 0 && (
              <button
                type="button"
                onClick={handleClearCaveira}
                className="h-9 px-3 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
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

        {/* 4 KPIs tabulares com divisórias finas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="min-w-0">
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Média líquida</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {metrics.mediaLiquida}
              </span>
              <span className="text-xs text-slate-400">pts</span>
            </div>
            <span
              className={`block text-[11px] font-medium mt-0.5 tabular-nums ${
                metrics.total === 0
                  ? 'text-slate-400'
                  : mediaVsCorte >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {metrics.total === 0
                ? 'Sem histórico'
                : mediaVsCorte >= 0
                  ? `+${mediaVsCorte} pts acima do corte (75)`
                  : `${mediaVsCorte} pts abaixo do corte (75)`}
            </span>
          </div>

          <div className="min-w-0 lg:pl-4 lg:border-l border-slate-200/80 dark:border-slate-800">
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Recorde pessoal</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {metrics.recorde}
              </span>
              <span className="text-xs text-slate-400">pts</span>
            </div>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {metrics.total > 0
                ? `${Math.round((metrics.recorde / 120) * 100)}% da prova máxima`
                : 'Meta inicial: 75 pts'}
            </span>
          </div>

          <div className="min-w-0 lg:pl-4 lg:border-l border-slate-200/80 dark:border-slate-800">
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              Aprovação &amp; ritmo
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {metrics.approvedCount}/{metrics.total}
              </span>
              {metrics.lastDelta !== null && (
                <span
                  className={`inline-flex items-center text-xs font-mono font-bold tabular-nums ${
                    metrics.lastDelta >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {metrics.lastDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {metrics.lastDelta >= 0 ? `+${metrics.lastDelta}` : metrics.lastDelta}
                </span>
              )}
            </div>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {metrics.lastDelta !== null ? 'Variação no último simulado' : 'Aprovados nos mínimos'}
            </span>
          </div>

          <div className="min-w-0 lg:pl-4 lg:border-l border-slate-200/80 dark:border-slate-800">
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Ponto crítico</span>
            <span
              className={`block text-base sm:text-lg font-bold leading-snug mt-0.5 truncate ${
                metrics.total > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
              }`}
              title={metrics.weakPoint}
            >
              {metrics.weakPoint}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {weakestSubject
                ? `Matéria mais crítica: ${weakestSubject.name} (${weakestSubject.pct}%)`
                : 'Menor aproveitamento médio'}
            </span>
          </div>
        </div>
      </section>

      {/* ZONA 2: Curva de Evolução (8 cols) + Raio-X dos Blocos Cebraspe (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-8 min-w-0">
          <SimuladoEvolutionChart simulados={simulados} onOpenNew={handleOpenNew} />
        </div>

        <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Auditoria por Bloco (PRF)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Média líquida comparada ao mínimo eliminatório
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {metrics.blocks.map((blk) => {
                const minPct = Math.round((blk.min / blk.totalQ) * 100);
                const clampedPct = blk.hasData ? Math.max(0, Math.min(100, blk.pct)) : 0;
                const isBelowMin = blk.hasData && blk.avg < blk.min;
                const margin = Math.round((blk.avg - blk.min) * 10) / 10;

                return (
                  <div key={blk.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {blk.code} · {blk.name}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {blk.hasData ? blk.avg : '—'}
                        <span className="text-slate-400 font-normal">/{blk.totalQ}</span>
                      </span>
                    </div>

                    {/* Barra com marcador vertical do mínimo eliminatório */}
                    <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-visible">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isBelowMin ? 'bg-red-500' : clampedPct >= 65 ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${clampedPct}%` }}
                      />
                      <div
                        style={{ left: `${minPct}%` }}
                        title={`Mínimo eliminatório: ${blk.min} pts`}
                        className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-amber-500 dark:bg-amber-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400">
                        Mínimo: {blk.min} pts
                      </span>
                      {blk.hasData ? (
                        <span
                          className={
                            isBelowMin
                              ? 'font-semibold text-red-600 dark:text-red-400'
                              : 'font-medium text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {margin >= 0 ? `+${margin} acima` : `${margin} abaixo`} ({clampedPct}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {metrics.total > 0 ? (
              <>
                Prioridade recomendada:{' '}
                <strong className="text-slate-900 dark:text-slate-100">{metrics.weakPoint}</strong>
                {weakestSubject ? (
                  <>
                    {' '}— atenção especial em{' '}
                    <strong className="text-slate-900 dark:text-slate-100">{weakestSubject.name}</strong> (
                    {weakestSubject.pct}% de acertos).
                  </>
                ) : (
                  '. Reforce baterias de questões estilo Cebraspe para elevar sua margem líquida.'
                )}
              </>
            ) : (
              'Registre seu primeiro simulado para destravar o diagnóstico automático de eliminação por bloco.'
            )}
          </div>
        </aside>
      </div>

      {/* ZONA 3: Histórico de Simulados */}
      {simulados.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Histórico de Simulados
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {simulados.length} {simulados.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-950/30">
                <tr>
                  <th className="py-2.5 px-4">Simulado &amp; Data</th>
                  <th className="py-2.5 px-3 text-center" title="Básicas — 55 questões (Mínimo: 15)">
                    B1 (55)
                  </th>
                  <th className="py-2.5 px-3 text-center" title="Trânsito — 30 questões (Mínimo: 10)">
                    B2 (30)
                  </th>
                  <th className="py-2.5 px-3 text-center" title="Direito — 35 questões (Mínimo: 10)">
                    B3 (35)
                  </th>
                  <th className="py-2.5 px-3 text-center">Líquida</th>
                  <th className="py-2.5 px-3 text-center">Resultado</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                {simulados.map((sim, index) => {
                  const hasSubjectScores = Array.isArray(sim.subjectScores) && sim.subjectScores.length > 0;
                  const isExpanded = expandedSimId === sim.id;
                  const elim = getEliminationInfo(sim);
                  const prevSim = index > 0 ? simulados[index - 1] : null;
                  const delta = prevSim !== null ? (Number(sim.liquida) || 0) - (Number(prevSim.liquida) || 0) : null;

                  const sortedSubjects = hasSubjectScores
                    ? [...sim.subjectScores].sort((a, b) => {
                        const ord = { 'Bloco I': 1, 'Bloco II': 2, 'Bloco III': 3 };
                        return (ord[a.bloco] || 9) - (ord[b.bloco] || 9) || (a.pct || 0) - (b.pct || 0);
                      })
                    : [];

                  const dateNote =
                    sim.dateSource === 'release'
                      ? 'liberação'
                      : sim.dateSource === 'api_date'
                        ? 'API'
                        : sim.dateSource === 'import'
                          ? 'importado'
                          : '';

                  return (
                    <React.Fragment key={sim.id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {formatBrDate(sim.data)}
                              </span>
                              {sim.source === 'caveira' && (
                                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                                  · Caveira
                                </span>
                              )}
                              {dateNote && (
                                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                                  · {dateNote}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {sim.title && (
                                <span
                                  className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[260px]"
                                  title={sim.title}
                                >
                                  {sim.title}
                                </span>
                              )}
                              {hasSubjectScores && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedSimId((prev) => (prev === sim.id ? null : sim.id))}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                                >
                                  <span>Matérias ({sim.subjectScores.length})</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          className={`py-3 px-3 text-center font-mono font-bold tabular-nums ${
                            sim.b1Liquida != null && sim.b1Liquida < 15
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sim.b1Liquida != null ? sim.b1Liquida : '—'}
                        </td>
                        <td
                          className={`py-3 px-3 text-center font-mono font-bold tabular-nums ${
                            sim.b2Liquida != null && sim.b2Liquida < 10
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sim.b2Liquida != null ? sim.b2Liquida : '—'}
                        </td>
                        <td
                          className={`py-3 px-3 text-center font-mono font-bold tabular-nums ${
                            sim.b3Liquida != null && sim.b3Liquida < 10
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sim.b3Liquida != null ? sim.b3Liquida : '—'}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-baseline gap-1.5 font-mono tabular-nums">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {sim.liquida}
                            </span>
                            {delta !== null && (
                              <span
                                className={`text-[11px] font-semibold ${
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
                        </td>

                        <td className="py-3 px-3 text-center">
                          {elim.failed ? (
                            <span
                              title={elim.reason}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Reprovado</span>
                            </span>
                          ) : (
                            <span
                              title={elim.reason}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                            >
                              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Aprovado</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSimulado(sim);
                                setShowModal(true);
                              }}
                              title="Editar simulado"
                              aria-label="Editar simulado"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGlobalModal({
                                  title: 'Excluir Simulado?',
                                  message:
                                    'Esta ação removerá permanentemente esta nota do seu histórico de evolução.',
                                  onConfirm: () => setSimulados((prev) => prev.filter((s) => s.id !== sim.id))
                                });
                              }}
                              title="Excluir simulado"
                              aria-label="Excluir simulado"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && hasSubjectScores && (
                        <tr className="bg-slate-50/75 dark:bg-slate-950/60">
                          <td colSpan={7} className="p-4 border-t border-slate-200/70 dark:border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {sortedSubjects.map((sc, sIdx) => {
                                const bShort =
                                  sc.bloco === 'Bloco III' ? 'B3' : sc.bloco === 'Bloco II' ? 'B2' : 'B1';
                                const pctNum = Number(sc.pct) || 0;
                                const scLiquida =
                                  sc.liquida != null ? Number(sc.liquida) : (Number(sc.hits) || 0) - (Number(sc.errors) || 0);
                                const deltaOthers =
                                  sc.othersPct !== undefined
                                    ? Math.round((pctNum - Number(sc.othersPct)) * 10) / 10
                                    : null;

                                return (
                                  <div
                                    key={`${sc.name}-${sIdx}`}
                                    className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1 text-xs">
                                        <span className="font-mono font-semibold text-slate-400 mr-1.5">
                                          {bShort}
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 break-words">
                                          {sc.name}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
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

                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

                                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                      <span>
                                        <strong className="text-emerald-600 dark:text-emerald-400">{sc.hits}✓</strong> ·{' '}
                                        <strong className="text-red-600 dark:text-red-400">{sc.errors}✗</strong> ·{' '}
                                        <span>{sc.blank}○</span> ·{' '}
                                        <strong
                                          className={
                                            scLiquida > 0
                                              ? 'text-slate-800 dark:text-slate-200'
                                              : 'text-red-600 dark:text-red-400'
                                          }
                                        >
                                          Líq {scLiquida}
                                        </strong>
                                      </span>
                                      {deltaOthers !== null && (
                                        <span
                                          title={`Média Caveira: ${sc.othersPct}%`}
                                          className={
                                            deltaOthers >= 0
                                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                              : 'text-red-500 dark:text-red-400 font-semibold'
                                          }
                                        >
                                          {deltaOthers >= 0 ? `+${deltaOthers}%` : `${deltaOthers}%`} vs turma
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ZONA 4: Raio-X Consolidado por Matéria (quando disponível) */}
      {aggregatedSubjects.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Raio-X por Matéria nos Simulados</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consolidado de {aggregatedSubjects.length} disciplina(s) · ordenado da mais crítica para a mais forte
              </p>
            </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAggregatedSubjects.map((sub) => {
              const bShort = sub.bloco === 'Bloco III' ? 'B3' : sub.bloco === 'Bloco II' ? 'B2' : 'B1';
              return (
                <div
                  key={sub.name}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/45 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="font-mono font-semibold text-slate-400 mr-1.5">{bShort}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {sub.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
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

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.pct >= 75 ? 'bg-emerald-500' : sub.pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, sub.pct))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{sub.hits}✓</strong> ·{' '}
                      <strong className="text-red-600 dark:text-red-400">{sub.errors}✗</strong> ·{' '}
                      <span>{sub.blank}○</span> ({sub.total}q)
                    </span>
                    <span
                      className={
                        sub.liquida > 0
                          ? 'text-slate-800 dark:text-slate-200 font-semibold'
                          : 'text-red-600 dark:text-red-400 font-semibold'
                      }
                    >
                      Líq {sub.liquida}
                    </span>
                  </div>
                </div>
              );
            })}
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
