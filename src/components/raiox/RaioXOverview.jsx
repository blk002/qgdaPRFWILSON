import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Target,
  AlertTriangle,
  Clock,
  Flame,
  Crosshair,
  RotateCcw,
  ArrowRight,
  Scale,
  TrendingDown,
  TrendingUp,
  Dices,
  Zap,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

function CustomDisciplineTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 dark:bg-slate-950 text-white border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <p className="font-display font-bold text-sm text-white">{d.fullName}</p>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-400">Aproveitamento:</span>
        <span className={`font-bold ${
          d.grossPercent >= 75 ? 'text-emerald-400' : d.grossPercent >= 50 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {d.grossPercent}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-400">Placar:</span>
        <span>
          <strong className="text-emerald-400">{d.hits}C</strong> / <strong className="text-red-400">{d.errors}E</strong> ({d.total}q)
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-400">Ritmo médio:</span>
        <span className="text-amber-400">{d.avgTime}s / questão</span>
      </div>
    </div>
  );
}

export default function RaioXOverview({
  stats,
  blocoStats,
  selectedBloco,
  onSelectBloco,
  subjectGroups,
  topicRankings,
  legalRadarList,
  overcomingStats,
  avoidableCount,
  pegadinhaCount,
  forgettingCurveRows,
  decorebaRows,
  formatDurationHMS,
  onTriggerPractice,
  onOpenNotebookWithFilter,
  onNavigateTab,
  onInspectDiscipline
}) {
  const hitPercent = stats.total > 0 ? ((stats.hits / stats.total) * 100) : 0;
  const hitPercentText = hitPercent.toFixed(1);
  const errorPercent = stats.total > 0 ? ((stats.errors / stats.total) * 100) : 0;
  const errorPercentText = errorPercent.toFixed(1);

  // Semicircle SVG Gauge math
  const gaugeRadius = 82;
  const semiCircumference = Math.PI * gaugeRadius;
  const hitDash = stats.total > 0 ? (hitPercent / 100) * semiCircumference : 0;
  const gaugeStrokeColor = hitPercent >= 75 ? '#10b981' : hitPercent >= 55 ? '#f59e0b' : '#ef4444';

  // Data for Recharts bar chart (top 8 subjects by volume/criticality, sorted weakest -> strongest)
  const chartData = subjectGroups.slice(0, 8).map((s) => ({
    name: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name,
    fullName: s.name,
    grossPercent: s.grossPercent,
    hits: s.hits,
    errors: s.errors,
    total: s.total,
    avgTime: s.avgTime
  }));

  const topCritical = topicRankings.mostErrored[0] || null;
  const totalErrors = Math.max(1, stats.errors);
  const maxAvgTime = Math.max(1, stats.avgHitTimeSec || 0, stats.avgErrorTimeSec || 0);

  const errorCauseRows = [
    {
      id: 'theory',
      label: 'Lacuna de teoria',
      count: stats.errorReasons.conteudo,
      pct: stats.errors > 0 ? Math.round((stats.errorReasons.conteudo / totalErrors) * 100) : 0,
      barClass: 'bg-red-500',
      textClass: 'text-red-600 dark:text-red-400'
    },
    {
      id: 'attention',
      label: 'Falta de atenção',
      count: stats.errorReasons.atencao,
      pct: stats.errors > 0 ? Math.round((stats.errorReasons.atencao / totalErrors) * 100) : 0,
      barClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400'
    },
    {
      id: 'errors',
      label: 'Interpretação',
      count: stats.errorReasons.interpretacao,
      pct: stats.errors > 0 ? Math.round((stats.errorReasons.interpretacao / totalErrors) * 100) : 0,
      barClass: 'bg-purple-500',
      textClass: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const decayingDisciplines = forgettingCurveRows.filter(
    (r) => r.decayDelta !== null && r.decayDelta < -5
  ).length;

  return (
    <div className="space-y-5">
      {/* 1. HERO TELEMETRY: CEBRASPE GAUGE + RECHARTS DISCIPLINE PROFILE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Esquerda (5 cols): Medidor Tático Cebraspe */}
        <section className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Índice de prontidão · Cebraspe
              </span>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedBloco === 'all' ? 'Desempenho Geral PRF' : selectedBloco}
              </h2>
            </div>
            <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border tabular-nums ${
              stats.netScore > 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : stats.netScore < 0
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}>
              Saldo {stats.netScore > 0 ? `+${stats.netScore}` : stats.netScore} pts
            </span>
          </div>

          {/* Semicircle Arc Gauge */}
          <div className="relative flex flex-col items-center justify-center py-1">
            <svg viewBox="0 0 200 118" className="w-full max-w-[260px] overflow-visible">
              {/* Background Track */}
              <path
                d="M 18 102 A 82 82 0 0 1 182 102"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                className="text-slate-100 dark:text-slate-800"
              />
              {/* 75% Target Tick */}
              <line
                x1="158"
                y1="44"
                x2="167"
                y2="35"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-500/60"
              />
              {/* Active Progress Arc */}
              {stats.total > 0 && (
                <path
                  d="M 18 102 A 82 82 0 0 1 182 102"
                  fill="none"
                  stroke={gaugeStrokeColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${hitDash} ${semiCircumference}`}
                  className="transition-all duration-700 ease-out"
                />
              )}
            </svg>

            <div className="absolute bottom-1 flex flex-col items-center text-center pointer-events-none">
              <span className="font-mono text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums leading-none">
                {hitPercentText}%
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                aproveitamento bruto · <strong className="font-mono text-slate-700 dark:text-slate-200">{stats.total}</strong> itens
              </span>
            </div>
          </div>

          {/* Split Bar Acertos vs Erros + 3 Mini KPIs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {stats.hits} Acertos ({hitPercentText}%)
                </span>
                <span className="text-red-600 dark:text-red-400 font-bold">
                  {stats.errors} Erros ({errorPercentText}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden flex">
                {stats.hits > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${hitPercent}%` }}
                  />
                )}
                {stats.errors > 0 && (
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${errorPercent}%` }}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="px-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Líquido %</span>
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {stats.netRate}%
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Ritmo / q</span>
                <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {stats.avgTimeSec}s
                </span>
              </div>
              <div className="px-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tempo total</span>
                <span className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatDurationHMS(stats.totalSeconds)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Direita (7 cols): Gráfico Comparativo por Disciplina + Cards dos 3 Blocos */}
        <section className="xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                Raio-X visual · Meta 75%
              </span>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Aproveitamento por disciplina
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('diagnostics', 'disciplines')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas ({subjectGroups.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {chartData.length === 0 ? (
            <div className="flex-1 min-h-[190px] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              Sem dados de disciplinas neste bloco.
            </div>
          ) : (
            <div className="w-full h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomDisciplineTooltip />} cursor={{ fill: 'rgba(148,163,184,0.10)' }} />
                  <ReferenceLine
                    y={75}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeOpacity={0.65}
                  />
                  <Bar
                    dataKey="grossPercent"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                    className="cursor-pointer"
                    onClick={(barData) => {
                      if (barData?.fullName) onInspectDiscipline(barData.fullName);
                    }}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.fullName}
                        fill={
                          entry.grossPercent >= 75
                            ? '#10b981'
                            : entry.grossPercent >= 50
                            ? '#f59e0b'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Barra dos 3 Blocos do Edital PRF (clicável) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {blocoStats.map((b) => {
              const isSelected = selectedBloco === b.blocoKey;
              return (
                <button
                  key={b.blocoKey}
                  type="button"
                  onClick={() => onSelectBloco(isSelected ? 'all' : b.blocoKey)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-sky-500/8 dark:bg-sky-500/12 border-sky-500/50 ring-1 ring-sky-500/25'
                      : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {b.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      {b.examWeight}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 font-mono tabular-nums">
                    <span className={`text-base font-bold ${
                      b.total === 0
                        ? 'text-slate-400'
                        : b.grossRate >= 75
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : b.grossRate >= 50
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {b.total > 0 ? `${b.grossRate}%` : '—'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {b.hits}C / {b.errors}E
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.grossRate >= 75 ? 'bg-emerald-500' : b.grossRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${b.total > 0 ? Math.max(4, b.grossRate) : 0}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* 2. PRÓXIMA MISSÃO TÁTICA (ALVO #1 + AÇÕES DIRETAS) */}
      <section className="bg-slate-900 dark:bg-slate-900 text-white border border-slate-800 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-400">
                Prioridade tática #1
              </span>
              {topCritical && (
                <span className="text-[11px] font-mono text-slate-400">
                  · {topCritical.subject} · {topCritical.errors} {topCritical.errors === 1 ? 'erro' : 'erros'} ({topCritical.errorPercent}% de erro)
                </span>
              )}
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-white truncate mt-0.5">
              {topCritical
                ? topCritical.topic
                : 'Nenhuma vulnerabilidade crítica detectada no momento'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {topCritical
                ? 'Atacar este assunto agora entrega o maior ganho imediato de saldo líquido Cebraspe.'
                : 'Continue resolvendo questões no Projeto Caveira ou desafie-se no Duelo FPS 3D.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {topCritical && (
            <>
              <button
                type="button"
                onClick={() => onTriggerPractice(topCritical.subject, [topCritical.topic], 'wrong')}
                className="h-9 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refazer erradas</span>
              </button>
              <button
                type="button"
                onClick={() => onTriggerPractice(topCritical.subject, [topCritical.topic], 'not_resolved')}
                className="h-9 px-3.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Treinar no Caveira</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenNotebookWithFilter({ topic: topCritical.topic, filterType: 'errors' })}
                className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Caderno</span>
              </button>
            </>
          )}
          <a
            href="#/duelo"
            className="h-9 px-3.5 rounded-lg bg-white/10 hover:bg-white/15 text-amber-300 border border-amber-400/30 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Duelo FPS</span>
          </a>
        </div>
      </section>

      {/* 3. BENTO DE INTELIGÊNCIA (3 COLUNAS: AUTÓPSIA DOS ERROS + RITMO/SUPERAÇÃO + RADAR RÁPIDO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Coluna 1: Autópsia dos Erros */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Autópsia dos erros</span>
              </h3>
              <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                {stats.errors} total
              </span>
            </div>

            <div className="space-y-3">
              {errorCauseRows.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => onOpenNotebookWithFilter({ filterType: row.id })}
                  className="w-full text-left group cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {row.label}
                    </span>
                    <span className={`font-mono font-bold tabular-nums ${row.textClass}`}>
                      {row.count} <span className="text-slate-400 font-normal">({row.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.barClass} transition-all`}
                      style={{ width: `${row.count > 0 ? Math.max(4, row.pct) : 0}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onOpenNotebookWithFilter({ filterType: 'avoidable' })}
              className="p-2.5 rounded-xl bg-amber-500/8 hover:bg-amber-500/15 border border-amber-500/25 text-left transition-colors cursor-pointer"
            >
              <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums block leading-none">
                {avoidableCount}
              </span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 block leading-tight">
                Evitáveis
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNotebookWithFilter({ filterType: 'pegadinha' })}
              className="p-2.5 rounded-xl bg-purple-500/8 hover:bg-purple-500/15 border border-purple-500/25 text-left transition-colors cursor-pointer"
            >
              <span className="font-mono text-lg font-bold text-purple-700 dark:text-purple-400 tabular-nums block leading-none">
                {pegadinhaCount}
              </span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 block leading-tight">
                Pegadinhas
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenNotebookWithFilter({ filterType: 'guesses' })}
              className="p-2.5 rounded-xl bg-sky-500/8 hover:bg-sky-500/15 border border-sky-500/25 text-left transition-colors cursor-pointer"
            >
              <span className="font-mono text-lg font-bold text-sky-700 dark:text-sky-400 tabular-nums block leading-none">
                {stats.guessesOrDoubtsTotal}
              </span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1 block leading-tight flex items-center gap-1">
                <Dices className="w-3 h-3 shrink-0" />
                Chutes
              </span>
            </button>
          </div>
        </section>

        {/* Coluna 2: Ritmo de Prova & Superação */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Ritmo &amp; superação</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                tempo médio
              </span>
            </div>

            {/* Comparativo Tempo Acerto vs Erro */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Quando acerta</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {stats.avgHitTimeSec}s / q
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.max(6, Math.round((stats.avgHitTimeSec / maxAvgTime) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Quando erra</span>
                  <span className="font-mono font-bold text-red-600 dark:text-red-400 tabular-nums">
                    {stats.avgErrorTimeSec}s / q
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.max(6, Math.round((stats.avgErrorTimeSec / maxAvgTime) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Taxa de Superação */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Taxa de superação
                </span>
                <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {overcomingStats.initiallyMissedRetried > 0 ? `${overcomingStats.ratePct}%` : '—'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {overcomingStats.overcomeCount}/{overcomingStats.initiallyMissedRetried} erros virados em acerto · {overcomingStats.retriedCount} refeitas
              </p>
            </div>
          </div>

          {/* Atalhos para Inteligência */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onNavigateTab('intelligence')}
              className="p-2.5 rounded-xl bg-sky-500/8 hover:bg-sky-500/15 border border-sky-500/25 text-left transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 block">
                Esquecimento
              </span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-200 mt-0.5 block">
                {decayingDisciplines > 0 ? `${decayingDisciplines} em queda ↓` : `${forgettingCurveRows.length} mat.`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('intelligence')}
              className="p-2.5 rounded-xl bg-teal-500/8 hover:bg-teal-500/15 border border-teal-500/25 text-left transition-colors cursor-pointer"
            >
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 block">
                Decoreba PRF
              </span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-200 mt-0.5 block">
                {decorebaRows.length} prazos/penas
              </span>
            </button>
          </div>
        </section>

        {/* Coluna 3: Radar Rápido (Top Críticos + Top Lei Seca) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            {/* Top 3 Assuntos Críticos */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span>Top assuntos críticos</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab('diagnostics', 'topics')}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Abrir mapa →
                </button>
              </div>
              {topicRankings.mostErrored.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  Sem assuntos críticos no filtro atual.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {topicRankings.mostErrored.slice(0, 3).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => onOpenNotebookWithFilter({ topic: t.topic, filterType: 'errors' })}
                      className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 hover:bg-red-500/8 border border-slate-200/80 dark:border-slate-800 hover:border-red-500/30 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {t.topic}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {t.subject}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 shrink-0 tabular-nums">
                        {t.errors}E ({t.errorPercent}%)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top 3 Lei Seca */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <span>Lei seca mais cobrada</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab('intelligence')}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Radar completo →
                </button>
              </div>
              {legalRadarList.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                  Nenhum dispositivo legal detectado ainda.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {legalRadarList.slice(0, 3).map((dev) => (
                    <button
                      key={dev.key}
                      type="button"
                      onClick={() => onOpenNotebookWithFilter({ legalDevice: dev })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 hover:bg-amber-500/8 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                        {dev.label}
                      </span>
                      <span className={`font-mono text-[11px] font-bold shrink-0 tabular-nums ${
                        dev.errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {dev.errors > 0 ? `${dev.errors}E / ${dev.total}q` : `100% (${dev.total}q)`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{topicRankings.shieldedCount}</strong> assuntos blindados
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
              <strong className="font-mono text-slate-800 dark:text-slate-200">{subjectGroups.length}</strong> disciplinas
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
