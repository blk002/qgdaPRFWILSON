import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, Plus } from 'lucide-react';
import {
  formatBrDate,
  formatShortDate,
  isFiniteNum,
  NOTA_CORTE_PRF,
  NOTA_MINIMA_GERAL
} from './simuladoUtils';

const SERIES_CONFIG = {
  geral: {
    id: 'geral',
    label: 'Nota Líquida Geral',
    shortLabel: 'Geral',
    max: 120,
    cutoff: NOTA_CORTE_PRF,
    cutoffLabel: 'Corte PRF (75)',
    minLine: NOTA_MINIMA_GERAL,
    minLineLabel: 'Mín. 50',
    stroke: '#0284c7',
    fillId: 'simChartFillGeral',
    hasVal: (sim) => isFiniteNum(sim?.liquida),
    getVal: (sim) => Number(sim.liquida) || 0,
    ticks: [0, 30, 50, 75, 96, 120]
  },
  b1: {
    id: 'b1',
    label: 'Bloco I · Básicas',
    shortLabel: 'B1',
    max: 55,
    cutoff: 15,
    cutoffLabel: 'Mín. B1 (15)',
    minLine: null,
    stroke: '#2563eb',
    fillId: 'simChartFillB1',
    hasVal: (sim) => isFiniteNum(sim?.b1Liquida),
    getVal: (sim) => Number(sim.b1Liquida) || 0,
    ticks: [0, 15, 30, 45, 55]
  },
  b2: {
    id: 'b2',
    label: 'Bloco II · Trânsito',
    shortLabel: 'B2',
    max: 30,
    cutoff: 10,
    cutoffLabel: 'Mín. B2 (10)',
    minLine: null,
    stroke: '#d97706',
    fillId: 'simChartFillB2',
    hasVal: (sim) => isFiniteNum(sim?.b2Liquida),
    getVal: (sim) => Number(sim.b2Liquida) || 0,
    ticks: [0, 10, 20, 30]
  },
  b3: {
    id: 'b3',
    label: 'Bloco III · Direito',
    shortLabel: 'B3',
    max: 35,
    cutoff: 10,
    cutoffLabel: 'Mín. B3 (10)',
    minLine: null,
    stroke: '#059669',
    fillId: 'simChartFillB3',
    hasVal: (sim) => isFiniteNum(sim?.b3Liquida),
    getVal: (sim) => Number(sim.b3Liquida) || 0,
    ticks: [0, 10, 20, 35]
  }
};

function getSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 3;
    const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
    d += ` C ${cp1x} ${curr.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export default function SimuladoEvolutionChart({
  simulados = [],
  selectedSimId = null,
  onSelectSimulado,
  seriesKey: controlledSeriesKey,
  onSeriesChange,
  onOpenNew
}) {
  const [internalSeriesKey, setInternalSeriesKey] = useState('geral');
  const [chartMode, setChartMode] = useState('line'); // 'line' | 'bar'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const seriesKey = controlledSeriesKey || internalSeriesKey;
  const setSeriesKey = (next) => {
    setHoveredPoint(null);
    if (onSeriesChange) onSeriesChange(next);
    else setInternalSeriesKey(next);
  };

  const cfg = SERIES_CONFIG[seriesKey] || SERIES_CONFIG.geral;
  const chartWidth = 760;
  const chartHeight = 264;
  const padX = 28;
  const padY = 16;
  const plotW = chartWidth - padX * 2;
  const plotH = chartHeight - padY * 2;

  const seriesEntries = useMemo(() => {
    return (simulados || [])
      .map((sim, origIndex) => ({ sim, origIndex }))
      .filter(({ sim }) => cfg.hasVal(sim));
  }, [simulados, cfg]);

  const { line, area, points, cutoffY, minLineY, avgVal, avgY, barWidth } = useMemo(() => {
    const total = seriesEntries.length;
    const toY = (val) => {
      const clamped = Math.max(0, Math.min(cfg.max, Number(val) || 0));
      return padY + plotH - (clamped / cfg.max) * plotH;
    };

    const nextCutoffY = toY(cfg.cutoff);
    const nextMinLineY = cfg.minLine != null ? toY(cfg.minLine) : null;

    if (total === 0) {
      return {
        line: '',
        area: '',
        points: [],
        cutoffY: nextCutoffY,
        minLineY: nextMinLineY,
        avgVal: null,
        avgY: null,
        barWidth: 28
      };
    }

    const sum = seriesEntries.reduce((acc, item) => acc + cfg.getVal(item.sim), 0);
    const mean = Math.round((sum / total) * 10) / 10;
    const meanY = toY(mean);

    const computedBarW = Math.max(12, Math.min(44, (plotW / Math.max(total, 1)) * 0.56));

    if (total === 1) {
      const { sim, origIndex } = seriesEntries[0];
      const val = cfg.getVal(sim);
      const y = toY(val);
      const midX = padX + plotW / 2;
      return {
        line: `M ${padX} ${y} L ${padX + plotW} ${y}`,
        area: `M ${padX} ${y} L ${padX + plotW} ${y} L ${padX + plotW} ${padY + plotH} L ${padX} ${padY + plotH} Z`,
        points: [{ x: midX, y, val, sim, index: 0, origIndex, prevDelta: null }],
        cutoffY: nextCutoffY,
        minLineY: nextMinLineY,
        avgVal: mean,
        avgY: meanY,
        barWidth: computedBarW
      };
    }

    const pts = seriesEntries.map(({ sim, origIndex }, index) => {
      const val = cfg.getVal(sim);
      const prevVal = index > 0 ? cfg.getVal(seriesEntries[index - 1].sim) : null;
      const x =
        chartMode === 'bar'
          ? padX + ((index + 0.5) / total) * plotW
          : padX + (index / (total - 1)) * plotW;
      const y = toY(val);
      return {
        x,
        y,
        val,
        sim,
        index,
        origIndex,
        prevDelta: prevVal !== null ? Math.round((val - prevVal) * 10) / 10 : null
      };
    });

    const linePath = getSmoothPath(pts);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padY + plotH} L ${pts[0].x} ${padY + plotH} Z`;

    return {
      line: linePath,
      area: areaPath,
      points: pts,
      cutoffY: nextCutoffY,
      minLineY: nextMinLineY,
      avgVal: mean,
      avgY: meanY,
      barWidth: computedBarW
    };
  }, [seriesEntries, cfg, padX, padY, plotW, plotH, chartMode]);

  const handlePointSelect = (sim) => {
    if (onSelectSimulado && sim?.id != null) {
      onSelectSimulado(sim.id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 h-full">
      {/* Cabeçalho + controles de série e visualização */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Trajetória de Desempenho
            </h3>
            {avgVal !== null && (
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                · média {avgVal} pts
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {cfg.label} · clique em qualquer ponto para abrir o raio-x abaixo
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Modo: Curva ou Barras */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70">
            <button
              type="button"
              onClick={() => {
                setChartMode('line');
                setHoveredPoint(null);
              }}
              title="Visualização em curva"
              aria-label="Visualização em curva"
              className={`h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${
                chartMode === 'line'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Curva</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setChartMode('bar');
                setHoveredPoint(null);
              }}
              title="Visualização em barras"
              aria-label="Visualização em barras"
              className={`h-7 px-2 rounded-md inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Barras</span>
            </button>
          </div>

          {/* Seletor de série */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70">
            {Object.values(SERIES_CONFIG).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSeriesKey(item.id)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  seriesKey === item.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {simulados.length === 0 ? (
        <div className="flex-1 min-h-[250px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Sua curva de evolução começa no 1º simulado
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Lance suas notas líquidas nos 3 blocos do edital PRF para acompanhar a distância até o corte de 75 pontos.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNew}
            className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Registrar primeiro simulado
          </button>
        </div>
      ) : seriesEntries.length === 0 ? (
        <div className="flex-1 min-h-[250px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center gap-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sem detalhamento para {cfg.label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Os simulados salvos não possuem nota individual registrada para este bloco. Selecione &ldquo;Geral&rdquo; ou edite um simulado para incluir os blocos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 justify-between">
          <div className="relative flex items-stretch gap-2">
            {/* Eixo Y */}
            <div className="w-8 shrink-0 relative h-[264px] select-none">
              {cfg.ticks.map((tick) => {
                const topPct = ((padY + plotH - (tick / cfg.max) * plotH) / chartHeight) * 100;
                const isCutoffTick = tick === cfg.cutoff;
                const isMinTick = cfg.minLine != null && tick === cfg.minLine;
                return (
                  <span
                    key={tick}
                    style={{ top: `${topPct}%` }}
                    className={`absolute right-0 -translate-y-1/2 text-[10px] font-mono tabular-nums ${
                      isCutoffTick
                        ? 'font-bold text-amber-600 dark:text-amber-400'
                        : isMinTick
                          ? 'font-semibold text-red-500 dark:text-red-400'
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {tick}
                  </span>
                );
              })}
            </div>

            {/* Canvas SVG */}
            <div className="relative flex-1 h-[264px] min-w-0">
              {/* Rótulo da linha de corte */}
              <div
                className="absolute right-1 z-10 pointer-events-none"
                style={{ top: `${(cutoffY / chartHeight) * 100}%`, transform: 'translateY(-115%)' }}
              >
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded">
                  {cfg.cutoffLabel}
                </span>
              </div>

              {/* Rótulo da linha eliminatória (apenas Geral) */}
              {minLineY !== null && (
                <div
                  className="absolute right-1 z-10 pointer-events-none"
                  style={{ top: `${(minLineY / chartHeight) * 100}%`, transform: 'translateY(-115%)' }}
                >
                  <span className="text-[10px] font-medium text-red-500 dark:text-red-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded">
                    {cfg.minLineLabel}
                  </span>
                </div>
              )}

              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id={cfg.fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.stroke} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={cfg.stroke} stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Linhas horizontais de grade */}
                {cfg.ticks.map((tick) => {
                  const y = padY + plotH - (tick / cfg.max) * plotH;
                  const isCutoff = tick === cfg.cutoff;
                  const isMin = cfg.minLine != null && tick === cfg.minLine;
                  return (
                    <line
                      key={tick}
                      x1={padX}
                      x2={chartWidth - padX}
                      y1={y}
                      y2={y}
                      stroke={isCutoff ? '#f59e0b' : isMin ? '#ef4444' : 'currentColor'}
                      strokeOpacity={isCutoff ? 0.75 : isMin ? 0.45 : 0.12}
                      strokeWidth={isCutoff ? 1.5 : 1}
                      strokeDasharray={isCutoff ? '6 5' : isMin ? '4 4' : '3 4'}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  );
                })}

                {/* Linha sutil da média do usuário */}
                {avgY !== null && seriesEntries.length >= 2 && (
                  <line
                    x1={padX}
                    x2={chartWidth - padX}
                    y1={avgY}
                    y2={avgY}
                    stroke={cfg.stroke}
                    strokeOpacity={0.35}
                    strokeWidth={1.25}
                    strokeDasharray="2 4"
                  />
                )}

                {chartMode === 'line' ? (
                  <>
                    <path d={area} fill={`url(#${cfg.fillId})`} />
                    <path
                      d={line}
                      fill="none"
                      stroke={cfg.stroke}
                      strokeWidth="2.75"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />

                    {points.map((p) => {
                      const isSelected = selectedSimId != null && p.sim.id === selectedSimId;
                      const isHovered = hoveredPoint?.index === p.index;
                      const belowMin =
                        cfg.minLine != null ? p.val < cfg.minLine : p.val < cfg.cutoff;
                      const reachedTarget = p.val >= cfg.cutoff;
                      const fill = belowMin ? '#ef4444' : reachedTarget ? '#10b981' : cfg.stroke;

                      return (
                        <g
                          key={p.sim.id ?? p.index}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() => handlePointSelect(p.sim)}
                        >
                          {/* Área de clique ampliada */}
                          <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                          {isSelected && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="10"
                              fill={fill}
                              fillOpacity="0.18"
                              stroke={fill}
                              strokeWidth="1.5"
                            />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered || isSelected ? 6 : 4.5}
                            fill={fill}
                            stroke="#ffffff"
                            strokeWidth="2.25"
                          />
                        </g>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {points.map((p) => {
                      const isSelected = selectedSimId != null && p.sim.id === selectedSimId;
                      const isHovered = hoveredPoint?.index === p.index;
                      const belowMin =
                        cfg.minLine != null ? p.val < cfg.minLine : p.val < cfg.cutoff;
                      const reachedTarget = p.val >= cfg.cutoff;
                      const barFill = belowMin ? '#ef4444' : reachedTarget ? '#10b981' : cfg.stroke;
                      const barH = Math.max(3, padY + plotH - p.y);

                      return (
                        <g
                          key={p.sim.id ?? p.index}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() => handlePointSelect(p.sim)}
                        >
                          <rect
                            x={p.x - barWidth / 2}
                            y={p.y}
                            width={barWidth}
                            height={barH}
                            rx="4"
                            fill={barFill}
                            fillOpacity={isSelected || isHovered ? 0.95 : 0.72}
                            stroke={isSelected ? '#0f172a' : 'none'}
                            strokeWidth={isSelected ? 1.5 : 0}
                          />
                        </g>
                      );
                    })}
                  </>
                )}
              </svg>

              {/* Tooltip interativo */}
              {hoveredPoint && (() => {
                const xPct = (hoveredPoint.x / chartWidth) * 100;
                const yPct = (hoveredPoint.y / chartHeight) * 100;
                const isLeftEdge = xPct <= 22;
                const isRightEdge = xPct >= 78;
                const isNearTop = yPct < 42;
                const translateX = isLeftEdge ? '-10px' : isRightEdge ? 'calc(-100% + 10px)' : '-50%';
                const translateY = isNearTop ? '0%' : '-100%';

                return (
                  <div
                    className="absolute bg-slate-900 dark:bg-slate-950 border border-slate-700 text-white rounded-xl p-3 shadow-xl z-40 pointer-events-none min-w-[205px] flex flex-col gap-1.5"
                    style={{
                      left: `${xPct}%`,
                      top: isNearTop ? `calc(${yPct}% + 14px)` : `calc(${yPct}% - 14px)`,
                      transform: `translate(${translateX}, ${translateY})`
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                      <span className="font-semibold text-slate-200">
                        Simulado #{hoveredPoint.origIndex + 1}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatBrDate(hoveredPoint.sim.data)}
                      </span>
                    </div>

                    {hoveredPoint.sim.title && (
                      <p className="text-[11px] text-slate-300 truncate max-w-[210px]">
                        {hoveredPoint.sim.title}
                      </p>
                    )}

                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-slate-400">{cfg.shortLabel}</span>
                      <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                        <span className="text-sm font-bold text-sky-400">
                          {hoveredPoint.val} pts
                        </span>
                        {hoveredPoint.prevDelta !== null && (
                          <span
                            className={`text-[11px] font-semibold ${
                              hoveredPoint.prevDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {hoveredPoint.prevDelta >= 0
                              ? `+${hoveredPoint.prevDelta}`
                              : hoveredPoint.prevDelta}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800 text-[11px] font-mono tabular-nums">
                      <div className="text-center">
                        <span className="block text-[10px] font-sans text-slate-500">B1</span>
                        <span
                          className={
                            isFiniteNum(hoveredPoint.sim.b1Liquida) &&
                            Number(hoveredPoint.sim.b1Liquida) < 15
                              ? 'text-red-400 font-bold'
                              : 'text-slate-200 font-semibold'
                          }
                        >
                          {hoveredPoint.sim.b1Liquida ?? '—'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-sans text-slate-500">B2</span>
                        <span
                          className={
                            isFiniteNum(hoveredPoint.sim.b2Liquida) &&
                            Number(hoveredPoint.sim.b2Liquida) < 10
                              ? 'text-red-400 font-bold'
                              : 'text-slate-200 font-semibold'
                          }
                        >
                          {hoveredPoint.sim.b2Liquida ?? '—'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-sans text-slate-500">B3</span>
                        <span
                          className={
                            isFiniteNum(hoveredPoint.sim.b3Liquida) &&
                            Number(hoveredPoint.sim.b3Liquida) < 10
                              ? 'text-red-400 font-bold'
                              : 'text-slate-200 font-semibold'
                          }
                        >
                          {hoveredPoint.sim.b3Liquida ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Rodapé cronológico + legenda compacta */}
          <div className="pl-10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span>{formatShortDate(seriesEntries[0]?.sim?.data)}</span>
              {seriesEntries.length > 2 && (
                <span>
                  {formatShortDate(seriesEntries[Math.floor(seriesEntries.length / 2)]?.sim?.data)}
                </span>
              )}
              {seriesEntries.length > 1 && (
                <span>{formatShortDate(seriesEntries[seriesEntries.length - 1]?.sim?.data)}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>≥ {cfg.cutoff}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Abaixo mín.</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
