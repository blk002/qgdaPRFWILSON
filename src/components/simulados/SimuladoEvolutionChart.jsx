import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus } from 'lucide-react';

const SERIES_CONFIG = {
  geral: {
    id: 'geral',
    label: 'Nota Líquida',
    shortLabel: 'Geral',
    max: 120,
    cutoff: 75,
    cutoffLabel: 'Zona de corte (75)',
    minCutoff: 50,
    stroke: '#0284c7',
    fillId: 'simChartFillGeral',
    hasVal: (sim) => sim?.liquida != null && Number.isFinite(Number(sim.liquida)),
    getVal: (sim) => Number(sim.liquida) || 0,
    ticks: [0, 30, 60, 75, 90, 120]
  },
  b1: {
    id: 'b1',
    label: 'Bloco I · Básicas',
    shortLabel: 'B1',
    max: 55,
    cutoff: 15,
    cutoffLabel: 'Mínimo B1 (15)',
    stroke: '#2563eb',
    fillId: 'simChartFillB1',
    hasVal: (sim) => sim?.b1Liquida != null && Number.isFinite(Number(sim.b1Liquida)),
    getVal: (sim) => Number(sim.b1Liquida) || 0,
    ticks: [0, 15, 30, 45, 55]
  },
  b2: {
    id: 'b2',
    label: 'Bloco II · Trânsito',
    shortLabel: 'B2',
    max: 30,
    cutoff: 10,
    cutoffLabel: 'Mínimo B2 (10)',
    stroke: '#d97706',
    fillId: 'simChartFillB2',
    hasVal: (sim) => sim?.b2Liquida != null && Number.isFinite(Number(sim.b2Liquida)),
    getVal: (sim) => Number(sim.b2Liquida) || 0,
    ticks: [0, 10, 20, 30]
  },
  b3: {
    id: 'b3',
    label: 'Bloco III · Direito',
    shortLabel: 'B3',
    max: 35,
    cutoff: 10,
    cutoffLabel: 'Mínimo B3 (10)',
    stroke: '#059669',
    fillId: 'simChartFillB3',
    hasVal: (sim) => sim?.b3Liquida != null && Number.isFinite(Number(sim.b3Liquida)),
    getVal: (sim) => Number(sim.b3Liquida) || 0,
    ticks: [0, 10, 20, 35]
  }
};

function formatBrDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function formatShortDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  const brParts = dateStr.split('/');
  if (brParts.length === 3) return `${brParts[0]}/${brParts[1]}`;
  return dateStr;
}

function getBezierCurvePath(points, width) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M 0 ${points[0].y} L ${width} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 3;
    const cp1y = curr.y;
    const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
    const cp2y = next.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return d;
}

export default function SimuladoEvolutionChart({ simulados, onOpenNew }) {
  const [seriesKey, setSeriesKey] = useState('geral');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const cfg = SERIES_CONFIG[seriesKey] || SERIES_CONFIG.geral;
  const chartWidth = 760;
  const chartHeight = 280;
  const padX = 24;
  const padY = 16;
  const plotW = chartWidth - padX * 2;
  const plotH = chartHeight - padY * 2;

  const seriesSimulados = useMemo(
    () => (simulados || []).filter((sim) => cfg.hasVal(sim)),
    [simulados, cfg]
  );

  const { line, area, points, cutoffY } = useMemo(() => {
    const total = seriesSimulados.length;
    const toY = (val) => {
      const clamped = Math.max(0, Math.min(cfg.max, Number(val) || 0));
      return padY + plotH - (clamped / cfg.max) * plotH;
    };

    const nextCutoffY = toY(cfg.cutoff);

    if (total === 0) {
      return { line: '', area: '', points: [], cutoffY: nextCutoffY };
    }

    if (total === 1) {
      const val = cfg.getVal(seriesSimulados[0]);
      const y = toY(val);
      const midX = padX + plotW / 2;
      return {
        line: `M ${padX} ${y} L ${padX + plotW} ${y}`,
        area: `M ${padX} ${y} L ${padX + plotW} ${y} L ${padX + plotW} ${padY + plotH} L ${padX} ${padY + plotH} Z`,
        points: [{ x: midX, y, val, sim: seriesSimulados[0], index: 0 }],
        cutoffY: nextCutoffY
      };
    }

    const pts = seriesSimulados.map((sim, index) => {
      const val = cfg.getVal(sim);
      const x = padX + (index / (total - 1)) * plotW;
      const y = toY(val);
      return { x, y, val, sim, index };
    });

    const linePath = getBezierCurvePath(pts, plotW);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padY + plotH} L ${pts[0].x} ${padY + plotH} Z`;

    return { line: linePath, area: areaPath, points: pts, cutoffY: nextCutoffY };
  }, [seriesSimulados, cfg, padX, padY, plotW, plotH]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 h-full">
      {/* Cabeçalho do gráfico + seletor de série */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500 shrink-0" />
            <span>Curva de Evolução</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {cfg.label} · referência em {cfg.cutoff} pts (máx. {cfg.max})
          </p>
        </div>

        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70">
          {Object.values(SERIES_CONFIG).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSeriesKey(item.id);
                setHoveredPoint(null);
              }}
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

      {simulados.length === 0 ? (
        <div className="flex-1 min-h-[260px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center gap-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Nenhum simulado registrado ainda
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Registre sua primeira nota por bloco para acompanhar sua evolução líquida em relação à zona de corte da PRF.
          </p>
          <button
            type="button"
            onClick={onOpenNew}
            className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar primeiro simulado
          </button>
        </div>
      ) : seriesSimulados.length === 0 ? (
        <div className="flex-1 min-h-[260px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center gap-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Sem detalhamento para {cfg.label}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Os simulados salvos não possuem nota individual registrada para este bloco. Selecione &ldquo;Geral&rdquo; ou edite um simulado para incluir os blocos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative flex items-stretch gap-2">
            {/* Eixo Y */}
            <div className="w-8 shrink-0 relative h-[280px] select-none">
              {cfg.ticks.map((tick) => {
                const topPct = ((padY + plotH - (tick / cfg.max) * plotH) / chartHeight) * 100;
                const isCutoffTick = tick === cfg.cutoff;
                return (
                  <span
                    key={tick}
                    style={{ top: `${topPct}%` }}
                    className={`absolute right-0 -translate-y-1/2 text-[10px] font-mono tabular-nums ${
                      isCutoffTick
                        ? 'font-bold text-amber-600 dark:text-amber-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {tick}
                  </span>
                );
              })}
            </div>

            {/* Canvas SVG */}
            <div className="relative flex-1 h-[280px] min-w-0">
              {/* Rótulo da linha de corte */}
              <div
                className="absolute right-1 z-10 pointer-events-none"
                style={{ top: `${(cutoffY / chartHeight) * 100}%`, transform: 'translateY(-115%)' }}
              >
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded">
                  {cfg.cutoffLabel}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id={cfg.fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.stroke} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={cfg.stroke} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Linhas horizontais de grade */}
                {cfg.ticks.map((tick) => {
                  const y = padY + plotH - (tick / cfg.max) * plotH;
                  const isCutoff = tick === cfg.cutoff;
                  return (
                    <line
                      key={tick}
                      x1={padX}
                      x2={chartWidth - padX}
                      y1={y}
                      y2={y}
                      stroke={isCutoff ? '#f59e0b' : 'currentColor'}
                      strokeOpacity={isCutoff ? 0.75 : 0.12}
                      strokeWidth={isCutoff ? 1.5 : 1}
                      strokeDasharray={isCutoff ? '6 5' : '3 4'}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  );
                })}

                {/* Área e Curva */}
                <path d={area} fill={`url(#${cfg.fillId})`} />
                <path
                  d={line}
                  fill="none"
                  stroke={cfg.stroke}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Pontos interativos */}
                {points.map((p) => {
                  const isHovered = hoveredPoint?.index === p.index;
                  const belowCutoff = p.val < cfg.cutoff;
                  return (
                    <g key={p.index}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6.5 : 4.5}
                        fill={belowCutoff ? '#ef4444' : cfg.stroke}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip interativo */}
              {hoveredPoint && (() => {
                const xPct = (hoveredPoint.x / chartWidth) * 100;
                const yPct = (hoveredPoint.y / chartHeight) * 100;
                const isLeftEdge = xPct <= 20;
                const isRightEdge = xPct >= 80;
                const isNearTop = yPct < 38;
                const translateX = isLeftEdge ? '-10px' : isRightEdge ? 'calc(-100% + 10px)' : '-50%';
                const translateY = isNearTop ? '0%' : '-100%';

                return (
                  <div
                    className="absolute bg-slate-900 dark:bg-slate-950 border border-slate-700 text-white rounded-xl p-3 shadow-xl z-40 pointer-events-none min-w-[190px] flex flex-col gap-1.5"
                    style={{
                      left: `${xPct}%`,
                      top: isNearTop ? `calc(${yPct}% + 14px)` : `calc(${yPct}% - 14px)`,
                      transform: `translate(${translateX}, ${translateY})`
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                      <span className="font-semibold text-slate-200">
                        Simulado #{hoveredPoint.index + 1}
                      </span>
                      <span className="font-mono tabular-nums">{formatBrDate(hoveredPoint.sim.data)}</span>
                    </div>

                    {hoveredPoint.sim.title && (
                      <p className="text-[11px] text-slate-300 truncate max-w-[200px]">
                        {hoveredPoint.sim.title}
                      </p>
                    )}

                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-slate-400">{cfg.label}</span>
                      <span className="text-sm font-mono font-bold tabular-nums text-sky-400">
                        {hoveredPoint.val} pts
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800 text-[11px] font-mono tabular-nums">
                      <div className="text-center">
                        <span className="block text-[10px] font-sans text-slate-500">B1</span>
                        <span className={hoveredPoint.sim.b1Liquida != null && hoveredPoint.sim.b1Liquida < 15 ? 'text-red-400 font-bold' : 'text-slate-200 font-semibold'}>
                          {hoveredPoint.sim.b1Liquida ?? '—'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-sans text-slate-500">B2</span>
                        <span className={hoveredPoint.sim.b2Liquida != null && hoveredPoint.sim.b2Liquida < 10 ? 'text-red-400 font-bold' : 'text-slate-200 font-semibold'}>
                          {hoveredPoint.sim.b2Liquida ?? '—'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-sans text-slate-500">B3</span>
                        <span className={hoveredPoint.sim.b3Liquida != null && hoveredPoint.sim.b3Liquida < 10 ? 'text-red-400 font-bold' : 'text-slate-200 font-semibold'}>
                          {hoveredPoint.sim.b3Liquida ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Rodapé cronológico do eixo X */}
          <div className="pl-10 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span>{formatShortDate(seriesSimulados[0]?.data)}</span>
            {seriesSimulados.length > 2 && (
              <span>{formatShortDate(seriesSimulados[Math.floor(seriesSimulados.length / 2)]?.data)}</span>
            )}
            <span>{formatShortDate(seriesSimulados[seriesSimulados.length - 1]?.data)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
