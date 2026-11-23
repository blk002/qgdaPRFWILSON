import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  BookOpen, Search, X, Settings, CheckCircle, ChevronUp, ChevronDown, Clock, Plus
} from 'lucide-react';

export default function Edital() {
  const navigate = useNavigate();
  const { subjects = {} } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const subjectsList = useMemo(() => Object.values(subjects || {}), [subjects]);

  const { totalLessons, completedLessons, completionPct } = useMemo(() => {
    let total = 0;
    let done = 0;
    subjectsList.forEach((sub) => {
      (sub.topics || []).forEach((t) => {
        const tTotal = Number(t.total) || 0;
        const tDone = Math.min(tTotal, Number(t.completed) || 0);
        total += tTotal;
        done += tDone;
      });
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { totalLessons: total, completedLessons: done, completionPct: pct };
  }, [subjectsList]);

  const toggleSubjectExpand = (subId) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return subjectsList.filter((sub) => {
      if (blockFilter !== 'ALL' && (sub.block || 'B1') !== blockFilter) return false;
      if (!query) return true;
      const matchesSubject = (sub.name || '').toLowerCase().includes(query);
      const matchesTopic = (sub.topics || []).some((t) => (t.name || '').toLowerCase().includes(query));
      return matchesSubject || matchesTopic;
    });
  }, [subjectsList, blockFilter, searchQuery]);

  const onOpenConfig = () => navigate('/config');

  return (
    <div className="fade-in w-full pb-8 space-y-5">
      {/* Cabeçalho Unificado com Progresso Integrado (mesmo padrão da Central de Estudos) */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-5 gap-y-3">
        <div className="order-1 min-w-0 shrink-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Edital Verticalizado
          </h1>
        </div>

        <div className="order-3 lg:order-2 w-full lg:w-auto lg:flex-1 min-w-0 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-x border-slate-200/80 dark:border-slate-800 lg:px-5 space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">Progresso</span>
              <span className="font-mono font-bold tabular-nums text-sky-600 dark:text-sky-400 shrink-0">
                {completionPct}%
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">·</span>
              <span className="tabular-nums truncate">
                {completedLessons}/{totalLessons} aulas
              </span>
            </div>
            <span className="tabular-nums shrink-0 whitespace-nowrap">
              {subjectsList.length} {subjectsList.length === 1 ? 'disciplina' : 'disciplinas'}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="order-2 lg:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenConfig}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustar edital</span>
          </button>
        </div>
      </div>

      {subjectsList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-8 text-center flex flex-col items-center gap-3">
          <BookOpen className="w-8 h-8 text-slate-400" />
          <div className="max-w-md space-y-1">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Seu edital ainda está vazio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadastre suas disciplinas e assuntos (ou importe sua grade) em Ajustes para acompanhar seu avanço por aqui.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenConfig}
            className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar disciplinas</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtros Limpa */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar disciplina ou assunto..."
                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-start">
                {[
                  { id: 'ALL', label: 'Todos' },
                  { id: 'B1', label: 'Bloco 1' },
                  { id: 'B2', label: 'Bloco 2' },
                  { id: 'B3', label: 'Bloco 3' }
                ].map((blk) => (
                  <button
                    key={blk.id}
                    type="button"
                    onClick={() => setBlockFilter(blk.id)}
                    className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      blockFilter === blk.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {blk.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const allIds = {};
                  filteredSubjects.forEach((s) => { allIds[s.id] = true; });
                  setExpandedSubjects(allIds);
                }}
                className="h-9 px-3 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expandir todos</span>
              </button>
              {Object.values(expandedSubjects).some(Boolean) && (
                <button
                  type="button"
                  onClick={() => setExpandedSubjects({})}
                  className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </button>
              )}
            </div>
          </div>

          {/* Grade de Disciplinas */}
          {filteredSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Nenhuma disciplina ou tópico encontrado para os filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {filteredSubjects.map((sub) => {
                const topics = sub.topics || [];
                const subTotal = topics.reduce((acc, t) => acc + (Number(t.total) || 0), 0);
                const subDone = topics.reduce(
                  (acc, t) => acc + Math.min(Number(t.total) || 0, Number(t.completed) || 0),
                  0
                );
                const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
                const isExpanded = Boolean(expandedSubjects[sub.id]) || Boolean(searchQuery.trim());
                const dotClass = String(sub.color || '').split(' ')[0] || 'bg-sky-500';

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubjectExpand(sub.id)}
                      className="w-full text-left flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
                            {sub.name}
                          </h2>
                          {subPct === 100 && subTotal > 0 && (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{sub.block || 'B1'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{topics.length} {topics.length === 1 ? 'tópico' : 'tópicos'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                            {subDone}/{subTotal} aulas
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            subPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {subPct}%
                        </span>
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </button>

                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          subPct === 100 ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${subPct}%` }}
                      />
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
                        {topics.length === 0 ? (
                          <p className="py-2 text-xs text-slate-400">Nenhum assunto cadastrado nesta matéria.</p>
                        ) : (
                          topics.map((topic, idx) => {
                            const tTotal = Number(topic.total) || 0;
                            const tDone = Math.min(tTotal, Number(topic.completed) || 0);
                            const tPct = tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0;
                            const isDone = tTotal > 0 && tDone >= tTotal;
                            return (
                              <div key={`${sub.id}-t-${idx}`} className="py-2.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isDone ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs font-medium truncate ${
                                        isDone
                                          ? 'text-slate-400 dark:text-slate-500 line-through'
                                          : 'text-slate-700 dark:text-slate-200'
                                      }`}
                                    >
                                      {topic.name || `Assunto ${idx + 1}`}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-1 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-sky-500'}`}
                                      style={{ width: `${tPct}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="font-mono text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                  {tDone}/{tTotal}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
