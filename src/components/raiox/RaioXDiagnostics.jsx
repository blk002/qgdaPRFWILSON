import React, { useState, useMemo } from 'react';
import {
  Target,
  Crosshair,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Skull,
  Clock,
  BookOpen,
  Search,
  ChevronRight,
  LayoutList
} from 'lucide-react';

export default function RaioXDiagnostics({
  initialDiscipline = null,
  enrichedQuestions,
  subjectGroups,
  topicRankings,
  topicReportScope,
  setTopicReportScope,
  blocoMetadata,
  onTriggerPractice,
  onOpenNotebookWithFilter
}) {
  // null = Mapa Geral de Assuntos (Críticos vs Blindados), string = Disciplina específica
  const [selectedDiscName, setSelectedDiscName] = useState(initialDiscipline);
  const [topicTone, setTopicTone] = useState('critical'); // 'critical' | 'shielded'
  const [discSearch, setDiscSearch] = useState('');

  const filteredDisciplines = useMemo(() => {
    const q = discSearch.trim().toLowerCase();
    if (!q) return subjectGroups;
    return subjectGroups.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjectGroups, discSearch]);

  const activeDiscipline = useMemo(() => {
    if (!selectedDiscName) return null;
    return subjectGroups.find((s) => s.name === selectedDiscName) || null;
  }, [subjectGroups, selectedDiscName]);

  if (subjectGroups.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
        <Skull className="w-9 h-9 mx-auto text-slate-400 opacity-60" />
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
          Nenhuma disciplina registrada neste bloco
        </p>
        <p>Resolva questões no Projeto Caveira para alimentar o mapa de disciplinas e assuntos.</p>
      </div>
    );
  }

  const activeTopicList =
    topicTone === 'critical' ? topicRankings.mostErrored : topicRankings.mostHit;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* TRILHO ESQUERDO: Mapa Geral + Lista de Disciplinas (sem sub-abas escondidas!) */}
        <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Navegar por Disciplina
              </span>
              <span className="text-[11px] text-slate-400">crítica → forte</span>
            </div>

            {subjectGroups.length > 5 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={discSearch}
                  onChange={(e) => setDiscSearch(e.target.value)}
                  placeholder="Filtrar disciplina..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[640px] overflow-y-auto custom-scrollbar">
            {/* Item fixo no topo: Ranking Geral de Assuntos */}
            <button
              type="button"
              onClick={() => setSelectedDiscName(null)}
              className={`w-full px-4 py-3.5 text-left transition-colors cursor-pointer relative flex items-center justify-between gap-3 ${
                !activeDiscipline
                  ? 'bg-sky-50/80 dark:bg-sky-950/35'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/35'
              }`}
            >
              {!activeDiscipline && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-sky-500" />
              )}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <LayoutList className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Todos os Assuntos (Ranking)
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {topicRankings.criticalCount} críticos · {topicRankings.shieldedCount} blindados
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 ${
                  !activeDiscipline ? 'text-sky-500' : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            </button>

            {/* Lista de Disciplinas */}
            {filteredDisciplines.map((sub) => {
              const isActive = activeDiscipline?.name === sub.name;
              const bMeta = blocoMetadata[sub.bloco] || blocoMetadata['Bloco I'];
              return (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => setSelectedDiscName(sub.name)}
                  className={`w-full px-4 py-3 text-left transition-colors cursor-pointer relative space-y-1.5 ${
                    isActive
                      ? 'bg-sky-50/80 dark:bg-sky-950/35'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/35'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-sky-500" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-semibold text-slate-400 shrink-0 w-6">
                        {bMeta.short}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {sub.name}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs font-bold shrink-0 tabular-nums ${
                        sub.grossPercent >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : sub.grossPercent >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {sub.grossPercent}%
                    </span>
                  </div>

                  <div className="pl-8 space-y-1">
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sub.grossPercent >= 75
                            ? 'bg-emerald-500'
                            : sub.grossPercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(4, sub.grossPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>
                        {sub.hits}C / {sub.errors}E · {sub.topicsList.length} assuntos
                      </span>
                      <span>{sub.avgTime}s/q</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* PAINEL DIREITO: Ranking Geral de Assuntos OU Dossiê da Disciplina Selecionada */}
        <div className="lg:col-span-8 flex flex-col">
          {!activeDiscipline ? (
            /* VISÃO A: RANKING GERAL DE ASSUNTOS (Críticos / Blindados) */
            <>
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Ranking Geral de Assuntos
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      {topicRankings.totalScoped} questões analisadas · selecione uma disciplina à esquerda para detalhar
                    </p>
                  </div>

                  {topicTone === 'critical' && topicRankings.mostErrored.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const topSubject = topicRankings.mostErrored[0].subject;
                          const sameSubjectCritical = topicRankings.mostErrored
                            .filter((item) => item.subject === topSubject)
                            .slice(0, 3)
                            .map((item) => item.topic);
                          onTriggerPractice(topSubject, sameSubjectCritical, 'wrong');
                        }}
                        className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refazer top erradas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const topSubject = topicRankings.mostErrored[0].subject;
                          const sameSubjectCritical = topicRankings.mostErrored
                            .filter((item) => item.subject === topSubject)
                            .slice(0, 3)
                            .map((item) => item.topic);
                          onTriggerPractice(topSubject, sameSubjectCritical, 'not_resolved');
                        }}
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Treinar inéditas</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Controles de filtro em uma única linha limpa */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70">
                    <button
                      type="button"
                      onClick={() => setTopicTone('critical')}
                      className={`h-7 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        topicTone === 'critical'
                          ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Mais errados ({topicRankings.mostErrored.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopicTone('shielded')}
                      className={`h-7 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        topicTone === 'shielded'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Mais acertados ({topicRankings.mostHit.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70">
                      {[
                        { id: 'all', label: `Todos (${enrichedQuestions.length})` },
                        { id: 'fps', label: `FPS (${topicRankings.fpsCount})` },
                        { id: 'bloco2', label: `Trânsito (${topicRankings.bloco2Count})` }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTopicReportScope(opt.id)}
                          className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            topicReportScope === opt.id
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <a
                      href="#/duelo"
                      className="h-8 px-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>FPS</span>
                    </a>
                  </div>
                </div>
              </div>

              {activeTopicList.length === 0 ? (
                <div className="py-16 px-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto opacity-80" />
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Nenhum assunto encontrado neste filtro
                  </p>
                  <p>Ajuste o recorte acima ou resolva mais questões para popular esta lista.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[540px] overflow-y-auto custom-scrollbar">
                  {activeTopicList.slice(0, 25).map((t, idx) => {
                    const isCriticalMode = topicTone === 'critical';
                    return (
                      <div
                        key={t.key}
                        className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-slate-400 w-5 pt-0.5 shrink-0 tabular-nums">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                {t.topic}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDiscName(t.subject)}
                                  className="hover:text-sky-600 dark:hover:text-sky-400 hover:underline cursor-pointer"
                                >
                                  {t.subject}
                                </button>
                                <span>·</span>
                                <span className="font-mono">{t.avgTime}s/q</span>
                                {t.fpsCount > 0 && (
                                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                                    · {t.fpsCount} FPS
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono tabular-nums">
                            <span
                              className={`text-sm font-bold block ${
                                isCriticalMode
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isCriticalMode ? `${t.errorPercent}% erro` : `${t.grossPercent}%`}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t.hits}C / {t.errors}E
                            </span>
                          </div>
                        </div>

                        <div className="pl-7 space-y-2">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCriticalMode ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(100, isCriticalMode ? t.errorPercent : t.grossPercent)}%`
                              }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {t.errors > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onTriggerPractice(t.subject, [t.topic], 'wrong')}
                                  className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>Refazer erradas</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  onTriggerPractice(t.subject, [t.topic], 'not_resolved')
                                }
                                className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Target className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                <span>Treinar no Caveira</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenNotebookWithFilter({
                                  topic: t.topic,
                                  filterType: isCriticalMode ? 'errors' : 'all'
                                })
                              }
                              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Ver no Caderno</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* VISÃO B: DOSSIÊ DA DISCIPLINA SELECIONADA */
            <>
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-400">
                        {activeDiscipline.bloco}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span
                        className={`font-semibold ${
                          activeDiscipline.status === 'blindagem'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : activeDiscipline.status === 'vulnerabilidade'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {activeDiscipline.status === 'blindagem'
                          ? 'Zona Blindada'
                          : activeDiscipline.status === 'vulnerabilidade'
                            ? 'Zona Vulnerável'
                            : 'Em Evolução'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {activeDiscipline.name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenNotebookWithFilter({
                          subject: activeDiscipline.name,
                          filterType: 'errors'
                        })
                      }
                      className="h-8 px-3 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Erros ({activeDiscipline.errors})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenNotebookWithFilter({
                          subject: activeDiscipline.name,
                          filterType: 'all'
                        })
                      }
                      className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Abrir no Caderno</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Strip tabular de KPIs com divisórias finas (sem cards aninhados) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Aproveitamento
                    </span>
                    <span
                      className={`font-mono text-xl font-bold tabular-nums ${
                        activeDiscipline.grossPercent >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : activeDiscipline.grossPercent >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {activeDiscipline.grossPercent}%
                    </span>
                  </div>
                  <div className="sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Acertos / Erros
                    </span>
                    <span className="font-mono text-xl font-bold tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {activeDiscipline.hits}
                      </span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-red-600 dark:text-red-400">
                        {activeDiscipline.errors}
                      </span>
                    </span>
                  </div>
                  <div className="sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Saldo Cebraspe
                    </span>
                    <span
                      className={`font-mono text-xl font-bold tabular-nums ${
                        activeDiscipline.hits - activeDiscipline.errors >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {activeDiscipline.hits - activeDiscipline.errors > 0
                        ? `+${activeDiscipline.hits - activeDiscipline.errors}`
                        : activeDiscipline.hits - activeDiscipline.errors}
                    </span>
                  </div>
                  <div className="sm:pl-3 sm:border-l border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Ritmo médio
                    </span>
                    <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums inline-flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {activeDiscipline.avgTime}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de Assuntos da Disciplina */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto custom-scrollbar">
                {activeDiscipline.topicsList.map((topic) => (
                  <div
                    key={topic.name}
                    className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {topic.name}
                        </span>
                        <span
                          className={`font-mono text-xs font-bold shrink-0 tabular-nums ${
                            topic.grossPercent >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : topic.grossPercent >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {topic.grossPercent}% · {topic.hits}C/{topic.errors}E
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            topic.grossPercent >= 75
                              ? 'bg-emerald-500'
                              : topic.grossPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(4, topic.grossPercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {topic.errors > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onTriggerPractice(activeDiscipline.name, [topic.name], 'wrong')
                          }
                          className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Refazer erradas no Caveira"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>Refazer</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onTriggerPractice(activeDiscipline.name, [topic.name], 'not_resolved')
                        }
                        className="h-7 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="Treinar inéditas no Caveira"
                      >
                        <Target className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>Treinar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenNotebookWithFilter({
                            subject: activeDiscipline.name,
                            topic: topic.name,
                            filterType: 'all'
                          })
                        }
                        className="h-7 px-2.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Caderno</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
