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
  ShieldCheck,
  BookOpen,
  Zap
} from 'lucide-react';

function CustomDisciplineTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 dark:bg-slate-950 text-white border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <p className="font-display font-bold text-sm text-white">{d.fullName}</p>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-400">Aproveitamento:</span>
        <span
          className={`font-bold ${
            d.grossPercent >= 75
              ? 'text-emerald-400'
              : d.grossPercent >= 50
                ? 'text-amber-400'
                : 'text-red-400'
          }`}
        >
          {d.grossPercent}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-400">Placar:</span>
        <span>
          <strong className="text-emerald-400">{d.hits}C</strong> /{' '}
          <strong className="text-red-400">{d.errors}E</strong> ({d.total}q)
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
  const hitPercent = stats.total > 0 ? (stats.hits / stats.total) * 100 : 0;
  const hitPercentText = hitPercent.toFixed(1);
  const errorPercent = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0;

  const chartData = subjectGroups.slice(0, 8).map((s) => ({
    name: s.name.length > 13 ? `${s.name.slice(0, 12)}…` : s.name,
    fullName: s.name,
    grossPercent: s.grossPercent,
    hits: s.hits,
    errors: s.errors,
    total: s.total,
    avgTime: s.avgTime
  }));

  const topCritical = topicRankings.mostErrored[0] || null;
  const totalErrors = Math.max(1, stats.errors);

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
      id: 'interpretation',
      label: 'Interpretação',
      count: stats.errorReasons.interpretacao,
      pct: stats.errors > 0 ? Math.round((stats.errorReasons.interpretacao / totalErrors) * 100) : 0,
      barClass: 'bg-sky-500',
      textClass: 'text-sky-600 dark:text-sky-400'
    }
  ];

  const decayingDisciplines = forgettingCurveRows.filter(
    (r) => r.decayDelta !== null && r.decayDelta < -5
  ).length;

  return (
    <div className="space-y-5">
      {/* FAIXA 1: Placar Cebraspe + Perfil por Disciplina & Blocos */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-12">
          {/* Esquerda (5 cols): Placar Cebraspe direto e legível */}
          <div className="xl:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-5 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Desempenho Cebraspe · {selectedBloco === 'all' ? 'Geral PRF' : selectedBloco}
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-1">
                    <span
                      className={`font-mono text-4xl sm:text-5xl font-bold tabular-nums tracking-tight leading-none ${
                        stats.total === 0
                          ? 'text-slate-400'
                          : hitPercent >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : hitPercent >= 55
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {hitPercentText}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      ({stats.total} {stats.total === 1 ? 'questão' : 'questões'})
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums shrink-0">
                  <span className="block text-[10px] font-sans uppercase tracking-wider text-slate-400">
                    Saldo Líq.
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      stats.netScore > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : stats.netScore < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500'
                    }`}
                  >
                    {stats.netScore > 0 ? `+${stats.netScore}` : stats.netScore}
                  </span>
                </div>
              </div>

              {/* Barra de proporção Acertos vs Erros */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {stats.hits} acertos
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {stats.errors} erros
                  </span>
                </div>
                <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
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
                  {/* Marcador da meta de 75% */}
                  <div
                    style={{ left: '75%' }}
                    title="Meta de blindagem: 75%"
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900/50 dark:bg-white/60"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Meta de blindagem: 75%</span>
                  <span className="font-mono tabular-nums">Líquido: {stats.netRate}%</span>
                </div>
              </div>
            </div>

            {/* 3 Blocos do Edital PRF (lista limpa clicável com divisórias finas) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Blocos do Edital (clique para filtrar)
                </span>
                {selectedBloco !== 'all' && (
                  <button
                    type="button"
                    onClick={() => onSelectBloco('all')}
                    className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Ver todos
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {blocoStats.map((b) => {
                  const isSelected = selectedBloco === b.blocoKey;
                  return (
                    <button
                      key={b.blocoKey}
                      type="button"
                      onClick={() => onSelectBloco(isSelected ? 'all' : b.blocoKey)}
                      className={`w-full py-2.5 px-2 -mx-2 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50/80 dark:bg-sky-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {b.title}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                            {b.hits}C / {b.errors}E
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full ${
                              b.grossRate >= 75
                                ? 'bg-emerald-500'
                                : b.grossRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${b.total > 0 ? Math.max(4, b.grossRate) : 0}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold tabular-nums w-10 text-right shrink-0 ${
                          b.total === 0
                            ? 'text-slate-400'
                            : b.grossRate >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : b.grossRate >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {b.total > 0 ? `${b.grossRate}%` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Direita (7 cols): Gráfico por Disciplina + 3 Telemetrias de Ritmo */}
          <div className="xl:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Aproveitamento por Disciplina
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ordenadas da mais crítica para a mais forte · clique na barra para abrir os assuntos
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('diagnostics')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Ver todas ({subjectGroups.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {chartData.length === 0 ? (
              <div className="flex-1 min-h-[210px] flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                Sem dados de disciplinas neste bloco.
              </div>
            ) : (
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 2 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(148,163,184,0.18)"
                    />
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
                    <Tooltip
                      content={<CustomDisciplineTooltip />}
                      cursor={{ fill: 'rgba(148,163,184,0.10)' }}
                    />
                    <ReferenceLine
                      y={75}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeOpacity={0.7}
                    />
                    <Bar
                      dataKey="grossPercent"
                      radius={[5, 5, 0, 0]}
                      maxBarSize={36}
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

            {/* Rodapé tabular de ritmo & superação */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Ritmo médio
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {stats.avgTimeSec}s / q
                </span>
              </div>
              <div className="sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Acerto vs Erro
                </span>
                <span className="text-sm font-mono font-bold tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {stats.avgHitTimeSec}s
                  </span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-red-600 dark:text-red-400">{stats.avgErrorTimeSec}s</span>
                </span>
              </div>
              <div className="sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Superação
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {overcomingStats.initiallyMissedRetried > 0
                    ? `${overcomingStats.ratePct}%`
                    : '—'}
                </span>
              </div>
              <div className="sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Tempo total
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatDurationHMS(stats.totalSeconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA 2: O Que Atacar Agora (Prioridade #1 — Theme-aware Light + Dark) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center shrink-0 mt-0.5 text-red-600 dark:text-red-400">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Prioridade #1 para subir nota agora
              </span>
              {topCritical && (
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  · {topCritical.subject} · {topCritical.errors}{' '}
                  {topCritical.errors === 1 ? 'erro' : 'erros'} ({topCritical.errorPercent}% erro)
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
              {topCritical
                ? topCritical.topic
                : 'Nenhuma vulnerabilidade crítica no recorte atual'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {topCritical
                ? 'Refazer as erradas deste tópico entrega o ganho mais rápido no saldo líquido Cebraspe.'
                : 'Continue resolvendo questões no Projeto Caveira ou pratique no Duelo FPS.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {topCritical && (
            <>
              <button
                type="button"
                onClick={() => onTriggerPractice(topCritical.subject, [topCritical.topic], 'wrong')}
                className="h-9 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refazer erradas</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onTriggerPractice(topCritical.subject, [topCritical.topic], 'not_resolved')
                }
                className="h-9 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Treinar inéditas</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenNotebookWithFilter({ topic: topCritical.topic, filterType: 'errors' })
                }
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Caderno</span>
              </button>
            </>
          )}
          <a
            href="#/duelo"
            className="h-9 px-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Duelo FPS</span>
          </a>
        </div>
      </section>

      {/* FAIXA 3: Diagnóstico em 2 colunas limpas (Autópsia + Pontos de Atenção) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Esquerda (5 cols): Por que você está errando */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Por que você está errando</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clique em qualquer item para revisar essas questões no Caderno
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums shrink-0">
                {stats.errors} erros
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
                      {row.count}{' '}
                      <span className="text-slate-400 font-normal">({row.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.barClass} transition-all`}
                      style={{ width: `${row.count > 0 ? Math.max(4, row.pct) : 0}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* 3 filtros rápidos de vulnerabilidade com divisórias finas */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onOpenNotebookWithFilter({ filterType: 'avoidable' })}
                className="pr-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="block font-mono text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {avoidableCount}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Evitáveis →
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenNotebookWithFilter({ filterType: 'pegadinha' })}
                className="px-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="block font-mono text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
                  {pegadinhaCount}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Pegadinhas →
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenNotebookWithFilter({ filterType: 'guesses' })}
                className="pl-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="block font-mono text-xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
                  {stats.guessesOrDoubtsTotal}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Chutes →
                </span>
              </button>
            </div>
          </div>

          {/* Atalho limpo para Retenção e Decoreba */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                {decayingDisciplines > 0 ? (
                  <strong className="text-red-600 dark:text-red-400 font-semibold">
                    {decayingDisciplines} em queda
                  </strong>
                ) : (
                  <span>Retenção estável</span>
                )}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{decorebaRows.length} prazos/penas</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('intelligence')}
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Abrir Lei Seca</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Direita (7 cols): Top Assuntos Críticos + Lei Seca mais cobrada */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subcoluna A: Top Assuntos Críticos */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Assuntos mais errados</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab('diagnostics')}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Mapa completo →
                </button>
              </div>

              {topicRankings.mostErrored.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                  Sem assuntos críticos no filtro atual.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {topicRankings.mostErrored.slice(0, 4).map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() =>
                        onOpenNotebookWithFilter({ topic: t.topic, filterType: 'errors' })
                      }
                      className="w-full py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
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

            {/* Subcoluna B: Top Lei Seca */}
            <div className="md:pl-6 md:border-l border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Lei seca em alerta</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab('intelligence')}
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Ver todas ({legalRadarList.length}) →
                </button>
              </div>

              {legalRadarList.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                  Nenhum artigo ou lei detectado ainda.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {legalRadarList.slice(0, 4).map((dev) => (
                    <button
                      key={dev.key}
                      type="button"
                      onClick={() => onOpenNotebookWithFilter({ legalDevice: dev })}
                      className="w-full py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {dev.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {dev.category} · {dev.total}q
                        </p>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold shrink-0 tabular-nums ${
                          dev.errors > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {dev.errors > 0 ? `${dev.errors}E` : '100%'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                  {topicRankings.shieldedCount}
                </strong>{' '}
                assuntos blindados (≥75%)
              </span>
            </span>
            <span className="font-mono tabular-nums">
              {overcomingStats.overcomeCount}/{overcomingStats.initiallyMissedRetried} erros
              superados
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
