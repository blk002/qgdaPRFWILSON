import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import {
  Dumbbell,
  Plus,
  TrendingUp,
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  Check,
  Play,
  Info,
  X
} from 'lucide-react';

// --- TAF Calculation Helpers (Tabelas oficiais PRF) ---
const calcBarra = (val, isM) => {
  if (isM) {
    if (val < 3) return 0; if (val === 3) return 2; if (val === 4) return 2.5;
    if (val === 5) return 3; if (val === 6) return 3.5; if (val === 7) return 4;
    if (val === 8) return 4.5; return 5;
  } else {
    if (val < 10) return 0; if (val < 13) return 2; if (val < 16) return 2.5;
    if (val < 19) return 3; if (val < 22) return 3.5; if (val < 25) return 4;
    if (val < 28) return 4.5; return 5;
  }
};

const calcAbdominal = (val, isM) => {
  if (isM) {
    if (val < 35) return 0; if (val <= 38) return 2; if (val <= 42) return 2.5;
    if (val <= 46) return 3; if (val <= 50) return 3.5; if (val <= 54) return 4;
    if (val <= 58) return 4.5; return 5;
  } else {
    if (val < 28) return 0; if (val <= 30) return 2; if (val <= 33) return 2.5;
    if (val <= 36) return 3; if (val <= 39) return 3.5; if (val <= 42) return 4;
    if (val <= 45) return 4.5; return 5;
  }
};

const calcImpulsao = (val, isM) => {
  if (isM) {
    if (val <= 2.00) return 0; if (val <= 2.05) return 2; if (val <= 2.10) return 2.5;
    if (val <= 2.15) return 3; if (val <= 2.20) return 3.5; if (val <= 2.25) return 4;
    if (val <= 2.30) return 4.5; return 5;
  } else {
    if (val <= 1.60) return 0; if (val <= 1.65) return 2; if (val <= 1.70) return 2.5;
    if (val <= 1.75) return 3; if (val <= 1.80) return 3.5; if (val <= 1.85) return 4;
    if (val <= 1.90) return 4.5; return 5;
  }
};

const calcCorrida = (val, isM) => {
  if (isM) {
    if (val <= 2300) return 0; if (val <= 2400) return 2; if (val <= 2500) return 2.5;
    if (val <= 2600) return 3; if (val <= 2700) return 3.5; if (val <= 2800) return 4;
    if (val <= 2900) return 4.5; return 5;
  } else {
    if (val <= 2000) return 0; if (val <= 2100) return 2; if (val <= 2200) return 2.5;
    if (val <= 2300) return 3; if (val <= 2400) return 3.5; if (val <= 2500) return 4;
    if (val <= 2600) return 4.5; return 5;
  }
};

const calcShuttle = (val, isM) => {
  if (!val || val <= 0) return 0;
  if (isM) {
    if (val >= 14) return 0; if (val >= 13.5) return 2; if (val >= 13) return 2.5;
    if (val >= 12.5) return 3; if (val >= 12) return 3.5; if (val >= 11.5) return 4;
    if (val >= 11) return 4.5; return 5;
  } else {
    if (val >= 16) return 0; if (val >= 15.5) return 2; if (val >= 15) return 2.5;
    if (val >= 14.5) return 3; if (val >= 14) return 3.5; if (val >= 13.5) return 4;
    if (val >= 13) return 4.5; return 5;
  }
};

const BASE_ROUTINES = [
  { day: 'Seg', type: 'Tiros / HIIT', detail: 'Velocidade e VO2' },
  { day: 'Ter', type: 'Força Superior', detail: 'Barra fixa e core' },
  { day: 'Qua', type: 'Rodagem', detail: 'Resistência aeróbica' },
  { day: 'Qui', type: 'Força Inferior', detail: 'Impulsão e potência' },
  { day: 'Sex', type: 'Tempo Run', detail: 'Ritmo de 12 minutos' },
  { day: 'Sáb', type: 'Livre / Agilidade', detail: 'Shuttle run ou esporte' },
  { day: 'Dom', type: 'Descanso', detail: 'Recuperação muscular' }
];

export default function TreinoTAF() {
  const {
    tafHistory,
    setTafHistory,
    tafTrainingStatus,
    getLocalDateStr,
    completeTafTraining,
    addXP,
    unlockMedal,
    setGlobalModal,
    isDarkMode
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingTaf, setEditingTaf] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const totalSimuladosTaf = tafHistory.length;
  const mediaPts = totalSimuladosTaf > 0
    ? (tafHistory.reduce((acc, sim) => acc + sim.totalPts, 0) / totalSimuladosTaf).toFixed(1)
    : '0.0';
  const recordePts = totalSimuladosTaf > 0 ? Math.max(...tafHistory.map(s => s.totalPts)) : 0;

  let weakTest = 'Aguardando simulados';
  if (totalSimuladosTaf > 0) {
    const avgs = [
      { name: 'Barra Fixa', val: tafHistory.reduce((acc, sim) => acc + sim.ptsBarra, 0) },
      { name: 'Abdominal', val: tafHistory.reduce((acc, sim) => acc + sim.ptsAbdominal, 0) },
      { name: 'Impulsão', val: tafHistory.reduce((acc, sim) => acc + sim.ptsImpulsao, 0) },
      { name: 'Corrida', val: tafHistory.reduce((acc, sim) => acc + sim.ptsCorrida, 0) },
      { name: 'Shuttle Run', val: tafHistory.reduce((acc, sim) => acc + sim.ptsShuttle, 0) }
    ];
    avgs.sort((a, b) => a.val - b.val);
    weakTest = avgs[0].name;
  }

  const chartHeight = 320;
  const chartWidth = 800;
  const maxPts = 25;
  const notaCorte = 12;

  const getBezierCurvePath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M 0 ${points[0].y} L ${chartWidth} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const getBezierAreaPath = (points, height) => {
    if (points.length === 0) return '';
    const curve = getBezierCurvePath(points);
    return `${curve} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  };

  const getChartData = () => {
    if (totalSimuladosTaf === 0) return { line: '', area: '', points: [] };

    const ptsObj = tafHistory.map((sim, index) => {
      const x = (index / (totalSimuladosTaf - 1 || 1)) * chartWidth;
      const y = chartHeight - (sim.totalPts / maxPts) * chartHeight;
      return { x, y, val: sim.totalPts, sim };
    });

    if (totalSimuladosTaf === 1) {
      const y = ptsObj[0].y;
      return {
        line: `M 0 ${y} L ${chartWidth} ${y}`,
        area: `M 0 ${y} L ${chartWidth} ${y} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`,
        points: [{ x: chartWidth / 2, y, val: ptsObj[0].val, sim: ptsObj[0].sim }]
      };
    }

    return {
      line: getBezierCurvePath(ptsObj),
      area: getBezierAreaPath(ptsObj, chartHeight),
      points: ptsObj
    };
  };

  const chartData = getChartData();
  const targetY = chartHeight - (notaCorte / maxPts) * chartHeight;

  const renderMetricSparkline = (label, metricKey, color, maxValue) => {
    if (totalSimuladosTaf < 2) return null;

    const sparkHeight = 34;
    const sparkWidth = 100;
    const pts = tafHistory.map((sim, index) => {
      const x = (index / (totalSimuladosTaf - 1)) * sparkWidth;
      const clamped = Math.min(maxValue, Math.max(0, Number(sim[metricKey]) || 0));
      const y = sparkHeight - (clamped / maxValue) * sparkHeight;
      return `${x},${y}`;
    }).join(' ');

    const lastVal = tafHistory[tafHistory.length - 1][metricKey];
    const prevVal = tafHistory[tafHistory.length - 2][metricKey];
    const improved = metricKey === 'shuttle' ? prevVal > lastVal : lastVal > prevVal;
    const lastClamped = Math.min(maxValue, Math.max(0, Number(lastVal) || 0));

    return (
      <div className="p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
            {label}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
              {lastVal}
            </span>
            {improved && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">▲</span>
            )}
          </div>
        </div>
        <div className="w-20 h-[34px] shrink-0">
          <svg viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="w-full h-full overflow-visible">
            <polyline
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={sparkWidth}
              cy={sparkHeight - (lastClamped / maxValue) * sparkHeight}
              r="2.75"
              fill={color}
            />
          </svg>
        </div>
      </div>
    );
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const todayName = daysOfWeek[new Date().getDay()];
  const alreadyDoneToday = tafTrainingStatus.lastDoneDate === getLocalDateStr();

  return (
    <div className="fade-in w-full pb-10 space-y-6">
      {/* Cabeçalho transparente padronizado */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Treino TAF
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Tabelas oficiais PRF · Máximo 25 pts · Corte mínimo 12 pts
            {totalSimuladosTaf > 0 && ` · ${totalSimuladosTaf} ${totalSimuladosTaf === 1 ? 'simulado' : 'simulados'}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTaf(null);
            setShowModal(true);
          }}
          className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar simulado
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Coluna principal */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Curva de desempenho */}
          {totalSimuladosTaf > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-500" />
                  <span>Evolução da pontuação</span>
                </h2>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  Corte: 12 / 25 pts
                </span>
              </div>

              <div className="p-5">
                <div className="relative w-full h-[320px]">
                  <div
                    className="absolute w-full border-t border-dashed border-rose-400/70 dark:border-rose-500/60 z-0 flex items-end justify-end"
                    style={{ top: `${targetY}px` }}
                  >
                    <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-1.5 -mt-2.5">
                      Corte mínimo (12 pts)
                    </span>
                  </div>

                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible z-10 relative"
                  >
                    <defs>
                      <linearGradient id="chartFillTaf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <path d={chartData.area} fill="url(#chartFillTaf)" />
                    <path
                      d={chartData.line}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />

                    {chartData.points.map((p, index) => (
                      <g key={index}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5"
                          fill={isDarkMode ? '#0f172a' : '#ffffff'}
                          stroke="#0284c7"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPoint({ ...p, index })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </svg>

                  {hoveredPoint && (
                    <div
                      className="absolute bg-slate-900 text-white border border-slate-700 rounded-xl p-3 shadow-lg z-50 pointer-events-none min-w-[190px]"
                      style={{
                        left: `${Math.min(85, Math.max(15, (hoveredPoint.x / chartWidth) * 100))}%`,
                        top: `${Math.max(18, (hoveredPoint.y / chartHeight) * 100 - 4)}%`,
                        transform: 'translate(-50%, -100%)'
                      }}
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1.5 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-200">Simulado #{hoveredPoint.index + 1}</span>
                        <span className="font-mono tabular-nums">{hoveredPoint.sim.data}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-slate-300">Total</span>
                        <span className="font-mono font-bold text-sky-400 tabular-nums">{hoveredPoint.val} pts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 tabular-nums">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Barra:</span>
                          <span className="font-mono text-white">{hoveredPoint.sim.ptsBarra}p</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Abd.:</span>
                          <span className="font-mono text-white">{hoveredPoint.sim.ptsAbdominal}p</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Imp.:</span>
                          <span className="font-mono text-white">{hoveredPoint.sim.ptsImpulsao}p</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Corr.:</span>
                          <span className="font-mono text-white">{hoveredPoint.sim.ptsCorrida}p</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-slate-400">Shuttle:</span>
                          <span className="font-mono text-white">{hoveredPoint.sim.shuttle}s ({hoveredPoint.sim.ptsShuttle}p)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Mais antigo</span>
                  <span>Mais recente</span>
                </div>
              </div>

              {totalSimuladosTaf >= 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-slate-100 dark:border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                  {renderMetricSparkline('Barra fixa', 'barra', '#0284c7', 15)}
                  {renderMetricSparkline('Abdominal', 'abdominal', '#8b5cf6', 60)}
                  {renderMetricSparkline('Impulsão (m)', 'impulsao', '#10b981', 3)}
                  {renderMetricSparkline('Corrida (m)', 'corrida', '#f59e0b', 3200)}
                  {renderMetricSparkline('Shuttle (s)', 'shuttle', '#ef4444', 15)}
                </div>
              )}
            </section>
          )}

          {/* Histórico de simulados */}
          {tafHistory.length === 0 ? (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 text-center">
              <Dumbbell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhum simulado registrado
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Registre seu primeiro simulado físico para calcular a pontuação nas tabelas oficiais da PRF e acompanhar sua curva de evolução.
              </p>
            </section>
          ) : (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Histórico de simulados
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {tafHistory.length} {tafHistory.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-3 py-3 font-semibold text-center">Barra</th>
                      <th className="px-3 py-3 font-semibold text-center">Abd.</th>
                      <th className="px-3 py-3 font-semibold text-center">Imp.</th>
                      <th className="px-3 py-3 font-semibold text-center">Corr.</th>
                      <th className="px-3 py-3 font-semibold text-center">Shuttle</th>
                      <th className="px-3 py-3 font-semibold text-center">Total</th>
                      <th className="px-3 py-3 font-semibold text-center">Resultado</th>
                      <th className="px-4 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tafHistory.map(sim => {
                      const reprovouCorte =
                        sim.ptsBarra === 0 ||
                        sim.ptsAbdominal === 0 ||
                        sim.ptsImpulsao === 0 ||
                        sim.ptsCorrida === 0 ||
                        sim.ptsShuttle === 0 ||
                        sim.totalPts < notaCorte;

                      return (
                        <tr
                          key={sim.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                            {sim.data}
                          </td>
                          <td className={`px-3 py-3 text-center font-mono tabular-nums ${sim.ptsBarra === 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {sim.ptsBarra}p
                          </td>
                          <td className={`px-3 py-3 text-center font-mono tabular-nums ${sim.ptsAbdominal === 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {sim.ptsAbdominal}p
                          </td>
                          <td className={`px-3 py-3 text-center font-mono tabular-nums ${sim.ptsImpulsao === 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {sim.ptsImpulsao}p
                          </td>
                          <td className={`px-3 py-3 text-center font-mono tabular-nums ${sim.ptsCorrida === 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {sim.ptsCorrida}p
                          </td>
                          <td className={`px-3 py-3 text-center font-mono tabular-nums ${sim.ptsShuttle === 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                            {sim.ptsShuttle}p
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {sim.totalPts}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-xs font-semibold ${reprovouCorte ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {reprovouCorte ? 'Abaixo' : 'Apto'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTaf(sim);
                                  setShowModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGlobalModal({
                                    title: 'Excluir simulado?',
                                    message: 'Esta ação remove os pontos deste simulado do seu histórico.',
                                    onConfirm: () => setTafHistory(prev => prev.filter(s => s.id !== sim.id))
                                  });
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Rotina de treinos de base */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span>Rotina semanal de base</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Hoje: {todayName}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {BASE_ROUTINES.map((item) => {
                const isToday = item.day === todayName;
                return (
                  <div
                    key={item.day}
                    className={`px-5 py-3 flex items-center justify-between gap-4 ${
                      isToday ? 'bg-sky-50/60 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className={`w-9 text-xs font-mono font-semibold shrink-0 ${
                          isToday ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.day}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {item.type}
                          {isToday && (
                            <span className="ml-2 text-xs font-medium text-sky-600 dark:text-sky-400">
                              · Hoje
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {item.detail}
                        </p>
                      </div>
                    </div>

                    {isToday && (
                      <button
                        type="button"
                        disabled={alreadyDoneToday}
                        onClick={completeTafTraining}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
                          alreadyDoneToday
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-default'
                            : 'bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 cursor-pointer'
                        }`}
                      >
                        {alreadyDoneToday ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Concluído</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Concluir</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Coluna lateral */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            <div className="p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Média geral</span>
                <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {mediaPts}
                  <span className="text-xs font-normal text-slate-400"> / 25</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (Number(mediaPts) / 25) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recorde atual</span>
                <span className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {recordePts}
                  <span className="text-xs font-normal text-slate-400"> / 25</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (recordePts / 25) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                Gargalo físico
              </span>
              <p className={`mt-1 text-sm font-semibold ${totalSimuladosTaf > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {weakTest}
              </p>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-sky-500" />
              <span>Recomendação</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {totalSimuladosTaf > 0 ? (
                <>
                  Priorize evolução em <strong className="text-slate-900 dark:text-white">{weakTest}</strong> para garantir nota acima do corte mínimo sem zerar nenhuma prova.
                </>
              ) : (
                'Registre seu primeiro simulado para identificar automaticamente o exercício com menor pontuação entre os 5 testes da PRF.'
              )}
            </p>
          </section>
        </aside>
      </div>

      {/* Modal de registro/edição de simulado */}
      {showModal && createPortal(
        <div className={`${isDarkMode ? 'dark' : ''} fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[999] p-4 fade-in`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const dataVal = e.target.data.value;
              const genero = e.target.genero.value;
              const isM = genero === 'masculino';

              const barra = parseFloat(e.target.barra.value) || 0;
              const abdominal = parseFloat(e.target.abdominal.value) || 0;
              const impulsao = parseFloat(e.target.impulsao.value) || 0;
              const corrida = parseFloat(e.target.corrida.value) || 0;
              const shuttle = parseFloat(e.target.shuttle.value) || 0;

              const ptsBarra = calcBarra(barra, isM);
              const ptsAbdominal = calcAbdominal(abdominal, isM);
              const ptsImpulsao = calcImpulsao(impulsao, isM);
              const ptsCorrida = calcCorrida(corrida, isM);
              const ptsShuttle = calcShuttle(shuttle, isM);

              const totalPts = ptsBarra + ptsAbdominal + ptsImpulsao + ptsCorrida + ptsShuttle;

              const payload = {
                data: dataVal,
                genero,
                barra,
                abdominal,
                impulsao,
                corrida,
                shuttle,
                ptsBarra,
                ptsAbdominal,
                ptsImpulsao,
                ptsCorrida,
                ptsShuttle,
                totalPts
              };

              if (editingTaf) {
                setTafHistory(prev => prev.map(s => s.id === editingTaf.id ? { ...s, ...payload } : s));
              } else {
                setTafHistory(prev => [...prev, { id: Date.now(), ...payload }]);
                addXP(300, 'Simulado TAF registrado');
                if (payload.totalPts >= 25) unlockMedal('ironman');
              }
              setShowModal(false);
              setEditingTaf(null);
            }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-[1000]"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {editingTaf ? 'Editar simulado TAF' : 'Registrar simulado TAF'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Informe as marcas obtidas para cálculo automático nas tabelas da PRF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingTaf(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[65vh] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Data
                  </label>
                  <input
                    name="data"
                    type="text"
                    required
                    defaultValue={editingTaf ? editingTaf.data : new Date().toLocaleDateString('pt-BR')}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-medium text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Tabela de referência
                  </label>
                  <select
                    name="genero"
                    defaultValue={editingTaf ? editingTaf.genero : 'masculino'}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-medium text-slate-900 dark:text-white focus:border-sky-500 outline-none cursor-pointer"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                    title="Masculino: repetições | Feminino: segundos de isometria"
                  >
                    Barra fixa (reps / seg)
                  </label>
                  <input
                    name="barra"
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    defaultValue={editingTaf?.barra ?? ''}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:border-sky-500 outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Abdominal (reps)
                  </label>
                  <input
                    name="abdominal"
                    type="number"
                    min="0"
                    required
                    defaultValue={editingTaf?.abdominal ?? ''}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:border-sky-500 outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Impulsão horizontal (m)
                  </label>
                  <input
                    name="impulsao"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={editingTaf?.impulsao ?? ''}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:border-sky-500 outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Corrida 12 min (m)
                  </label>
                  <input
                    name="corrida"
                    type="number"
                    min="0"
                    required
                    defaultValue={editingTaf?.corrida ?? ''}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:border-sky-500 outline-none tabular-nums"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Shuttle Run (segundos)
                  </label>
                  <input
                    name="shuttle"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={editingTaf?.shuttle ?? ''}
                    className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:border-sky-500 outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingTaf(null);
                }}
                className="h-9 px-4 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
              >
                {editingTaf ? 'Salvar alterações' : 'Salvar simulado'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
