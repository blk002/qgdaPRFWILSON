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
      if (blockFilter !== 'ALL' && (sub.block || 'B1') !== blockFilter) {
        return false;
      }
      if (!query) return true;
      const matchesSubject = (sub.name || '').toLowerCase().includes(query);
      const matchesTopic = (sub.topics || []).some((t) => (t.name || '').toLowerCase().includes(query));
      return matchesSubject || matchesTopic;
    });
  }, [subjectsList, blockFilter, searchQuery]);

  const onOpenConfig = () => navigate('/config');

  return (
    <div className="fade-in w-full pb-10 space-y-2.5">
      {/* Cabeçalho Compacto */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 p-2 rounded-lg shrink-0">
            <BookOpen className="text-sky-600 dark:text-sky-400 w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
              Edital Verticalizado • PRF
            </h2>
            <p className="text-slate-500 text-xs dark:text-slate-400 tabular-nums">
              {completedLessons} de {totalLessons} aulas concluídas ({completionPct}%) • {subjectsList.length} {subjectsList.length === 1 ? 'disciplina' : 'disciplinas'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          className="h-8 px-3 rounded-lg text-xs font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>+ Ajustar Edital</span>
        </button>
      </div>

      {subjectsList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center flex flex-col items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="max-w-md space-y-0.5">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
              Seu Edital ainda está vazio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadastre suas disciplinas e assuntos (ou importe sua grade) na tela de Ajustes para acompanhar seu progresso completo por aqui.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenConfig}
            className="h-8 px-3.5 rounded-lg text-xs font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Disciplinas</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Barra de Filtros Compacta */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar disciplina ou assunto..."
                  className="w-full h-8 pl-8 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 flex-wrap">
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
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      blockFilter === blk.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-850 dark:text-white dark:border-slate-600'
                        : 'bg-transparent text-slate-500 border-slate-200 hover:border-slate-300 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {blk.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenConfig}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gerenciar Matérias</span>
            </button>
          </div>

          {/* Lista de Disciplinas */}
          {filteredSubjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Nenhuma disciplina ou tópico encontrado para os filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSubjects.map((sub) => {
                const topics = sub.topics || [];
                const subTotal = topics.reduce((acc, t) => acc + (Number(t.total) || 0), 0);
                const subDone = topics.reduce(
                  (acc, t) => acc + Math.min(Number(t.total) || 0, Number(t.completed) || 0),
                  0
                );
                const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
                const isExpanded = Boolean(expandedSubjects[sub.id]) || Boolean(searchQuery.trim());

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2.5"
                  >
                    <div
                      onClick={() => toggleSubjectExpand(sub.id)}
                      className="flex items-start justify-between gap-2.5 cursor-pointer select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${sub.color || 'bg-slate-700 text-white'}`}>
                            {sub.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {sub.block || 'B1'}
                          </span>
                          {subPct === 100 && subTotal > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Concluída
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{topics.length} {topics.length === 1 ? 'tópico' : 'tópicos'}</span>
                          <span>•</span>
                          <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                            {subDone}/{subTotal} aulas
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-black tabular-nums text-sky-600 dark:text-sky-400">
                          {subPct}%
                        </span>
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Recolher tópicos' : 'Expandir tópicos'}
                          className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Barra da Disciplina */}
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          subPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-teal-400'
                        }`}
                        style={{ width: `${subPct}%` }}
                      />
                    </div>

                    {/* Tópicos Expansíveis */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        {topics.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nenhum assunto cadastrado nesta matéria.</p>
                        ) : (
                          topics.map((topic, idx) => {
                            const tTotal = Number(topic.total) || 0;
                            const tDone = Math.min(tTotal, Number(topic.completed) || 0);
                            const tPct = tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0;
                            const isDone = tTotal > 0 && tDone >= tTotal;
                            return (
                              <div
                                key={`${sub.id}-t-${idx}`}
                                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    {isDone ? (
                                      <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    )}
                                    <span className={`text-[11px] font-bold truncate ${isDone ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {topic.name || `Assunto ${idx + 1}`}
                                    </span>
                                  </div>
                                  <div className="mt-1 w-full bg-slate-200/80 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-teal-400'}`}
                                      style={{ width: `${tPct}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-[10px] font-black tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
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
