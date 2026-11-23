import React, { useState, useMemo } from 'react';
import {
  Target,
  Crosshair,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Skull,
  Clock,
  Layers,
  BookOpen
} from 'lucide-react';

export default function RaioXDiagnostics({
  initialSubView = 'topics',
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
  const [subView, setSubView] = useState(initialSubView);
  const [selectedDiscName, setSelectedDiscName] = useState(initialDiscipline);

  const activeDiscipline = useMemo(() => {
    if (subjectGroups.length === 0) return null;
    if (selectedDiscName) {
      const found = subjectGroups.find((s) => s.name === selectedDiscName);
      if (found) return found;
    }
    return subjectGroups[0];
  }, [subjectGroups, selectedDiscName]);

  return (
    <div className="space-y-4">
      {/* Barra Superior do Diagnóstico: Alternador de Modo + Ações Rápidas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setSubView('topics')}
            className={`h-8 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              subView === 'topics'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-red-500" />
            <span>Zona Crítica vs Blindada</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('disciplines')}
            className={`h-8 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              subView === 'disciplines'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Raio-X por Disciplina ({subjectGroups.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {subView === 'topics' && (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTopicReportScope('all')}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  topicReportScope === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({enrichedQuestions.length})
              </button>
              <button
                type="button"
                onClick={() => setTopicReportScope('fps')}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  topicReportScope === 'fps'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>FPS ({topicRankings.fpsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setTopicReportScope('bloco2')}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  topicReportScope === 'bloco2'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Trânsito ({topicRankings.bloco2Count})
              </button>
            </div>
          )}

          <a
            href="#/duelo"
            className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Jogar Duelo FPS</span>
          </a>
        </div>
      </div>

      {/* MODO A: ZONA CRÍTICA VS ZONA BLINDADA */}
      {subView === 'topics' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {/* COLUNA ESQUERDA: ZONA CRÍTICA */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 bg-red-500/[0.04] dark:bg-red-500/[0.06] border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  <span>Zona crítica ({topicRankings.mostErrored.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {topicRankings.criticalCount} assuntos abaixo de 60% de acerto · {topicRankings.totalScoped} questões analisadas
                </p>
              </div>

              {topicRankings.mostErrored.length > 0 && (
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
                    className="h-8 px-2.5 rounded-lg bg-amber-500/12 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Refazer no Projeto Caveira apenas as questões erradas dos piores assuntos"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refazer erradas</span>
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
                    className="h-8 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Abrir o Projeto Caveira já filtrado nos piores assuntos da sua disciplina mais crítica"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Treinar top críticos</span>
                  </button>
                </div>
              )}
            </div>

            {topicRankings.mostErrored.length === 0 ? (
              <div className="py-14 px-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto opacity-80" />
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Nenhum erro registrado neste filtro
                </p>
                <p>Sua pontaria nos tópicos selecionados está em dia.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topicRankings.mostErrored.slice(0, 20).map((t, idx) => (
                  <div key={t.key} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg w-7 h-7 flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug" title={t.topic}>
                            {t.topic}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{t.subject}</span>
                            <span>·</span>
                            <span className="font-mono">{t.avgTime}s/q</span>
                            {t.fpsCount > 0 && (
                              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                                · {t.fpsCount} no FPS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400 block">
                          {t.errorPercent}% erro
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {t.errors}E / {t.hits}C ({t.total}q)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, t.errorPercent)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onTriggerPractice(t.subject, [t.topic], 'wrong')}
                          className="h-7 px-2.5 rounded-md bg-amber-500/12 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 border border-amber-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refazer erradas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onTriggerPractice(t.subject, [t.topic], 'not_resolved')}
                          className="h-7 px-2.5 rounded-md bg-sky-500/12 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-slate-950 border border-sky-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Target className="w-3 h-3" />
                          <span>Treinar no Caveira</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenNotebookWithFilter({ topic: t.topic, filterType: 'errors' })}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver no Caderno</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* COLUNA DIREITA: ZONA BLINDADA */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-5 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>Zona blindada ({topicRankings.mostHit.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {topicRankings.shieldedCount} assuntos consolidados com ≥75% de acerto
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>

            {topicRankings.mostHit.length === 0 ? (
              <div className="py-14 px-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <Target className="w-9 h-9 text-slate-400 mx-auto opacity-70" />
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Nenhum acerto registrado neste filtro
                </p>
                <p>Resolva questões ou vença rodadas no Duelo FPS para consolidar seus pontos fortes.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topicRankings.mostHit.slice(0, 20).map((t, idx) => (
                  <div key={t.key} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-7 h-7 flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug" title={t.topic}>
                            {t.topic}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{t.subject}</span>
                            <span>·</span>
                            <span className="font-mono">{t.avgTime}s/q</span>
                            {t.fpsCount > 0 && (
                              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                                · {t.fpsCount} no FPS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                          {t.grossPercent}% acerto
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {t.hits}C / {t.errors}E ({t.total}q)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, t.grossPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onOpenNotebookWithFilter({ topic: t.topic, filterType: 'all' })}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver no Caderno</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* MODO B: MASTER-DETAIL POR DISCIPLINA */}
      {subView === 'disciplines' && (
        subjectGroups.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <Skull className="w-9 h-9 mx-auto text-slate-400 opacity-60" />
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Nenhuma disciplina registrada neste bloco
            </p>
            <p>Resolva questões no Projeto Caveira para alimentar o diagnóstico detalhado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Master Sidebar (4 cols) */}
            <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Disciplinas ({subjectGroups.length})
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  crítica → forte
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                {subjectGroups.map((sub) => {
                  const isActive = activeDiscipline?.name === sub.name;
                  const bMeta = blocoMetadata[sub.bloco] || blocoMetadata['Bloco I'];
                  return (
                    <button
                      key={sub.name}
                      type="button"
                      onClick={() => setSelectedDiscName(sub.name)}
                      className={`w-full p-3.5 text-left transition-colors cursor-pointer space-y-2 border-l-3 ${
                        isActive
                          ? 'bg-sky-500/8 dark:bg-sky-500/12 border-l-sky-500'
                          : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-850/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${bMeta.badgeClass}`}>
                            {bMeta.short}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {sub.name}
                          </span>
                        </div>
                        <span className={`font-mono text-sm font-bold shrink-0 tabular-nums ${
                          sub.grossPercent >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : sub.grossPercent >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {sub.grossPercent}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>{sub.hits}C / {sub.errors}E · {sub.topicsList.length} tópicos</span>
                        <span>{sub.avgTime}s/q</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sub.grossPercent >= 75 ? 'bg-emerald-500' : sub.grossPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(4, sub.grossPercent)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Detail Dossier (8 cols) */}
            {activeDiscipline && (
              <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${(blocoMetadata[activeDiscipline.bloco] || blocoMetadata['Bloco I']).badgeClass}`}>
                          {activeDiscipline.bloco}
                        </span>
                        <span className={`text-xs font-semibold ${
                          activeDiscipline.status === 'blindagem'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : activeDiscipline.status === 'vulnerabilidade'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {activeDiscipline.status === 'blindagem'
                            ? 'Zona Blindada'
                            : activeDiscipline.status === 'vulnerabilidade'
                            ? 'Zona Vulnerável'
                            : 'Em Evolução'}
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {activeDiscipline.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenNotebookWithFilter({ subject: activeDiscipline.name, filterType: 'errors' })}
                        className="h-8 px-3 rounded-lg bg-red-500/12 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Erros ({activeDiscipline.errors})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenNotebookWithFilter({ subject: activeDiscipline.name, filterType: 'all' })}
                        className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Abrir no Caderno</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mini Strip de KPIs da Disciplina */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Aproveitamento</span>
                      <span className={`font-mono text-xl font-bold tabular-nums ${
                        activeDiscipline.grossPercent >= 75
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : activeDiscipline.grossPercent >= 50
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {activeDiscipline.grossPercent}%
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Acertos / Erros</span>
                      <span className="font-mono text-xl font-bold tabular-nums">
                        <span className="text-emerald-600 dark:text-emerald-400">{activeDiscipline.hits}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-red-600 dark:text-red-400">{activeDiscipline.errors}</span>
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Saldo Cebraspe</span>
                      <span className={`font-mono text-xl font-bold tabular-nums ${
                        activeDiscipline.hits - activeDiscipline.errors >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {activeDiscipline.hits - activeDiscipline.errors > 0
                          ? `+${activeDiscipline.hits - activeDiscipline.errors}`
                          : activeDiscipline.hits - activeDiscipline.errors}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Ritmo médio</span>
                      <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {activeDiscipline.avgTime}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de Tópicos da Disciplina */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto custom-scrollbar">
                  {activeDiscipline.topicsList.map((topic) => (
                    <div
                      key={topic.name}
                      className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                            {topic.name}
                          </span>
                          <span className={`font-mono text-xs font-bold shrink-0 tabular-nums ${
                            topic.grossPercent >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : topic.grossPercent >= 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {topic.grossPercent}% · {topic.hits}C/{topic.errors}E
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              topic.grossPercent >= 75 ? 'bg-emerald-500' : topic.grossPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(4, topic.grossPercent)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {topic.errors > 0 && (
                          <button
                            type="button"
                            onClick={() => onTriggerPractice(activeDiscipline.name, [topic.name], 'wrong')}
                            className="h-7 px-2.5 rounded-md bg-amber-500/12 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-slate-950 border border-amber-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Refazer erradas no Caveira"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Refazer</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onTriggerPractice(activeDiscipline.name, [topic.name], 'not_resolved')}
                          className="h-7 px-2.5 rounded-md bg-sky-500/12 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-slate-950 border border-sky-500/30 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Treinar inéditas no Caveira"
                        >
                          <Target className="w-3 h-3" />
                          <span>Treinar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenNotebookWithFilter({ subject: activeDiscipline.name, topic: topic.name, filterType: 'all' })}
                          className="h-7 px-2.5 rounded-md bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Caderno</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      )}
    </div>
  );
}
