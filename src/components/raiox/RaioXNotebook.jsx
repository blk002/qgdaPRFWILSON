import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  X,
  CheckCircle2,
  Clock,
  Video,
  MessageSquarePlus,
  BrainCircuit,
  Trash2,
  Lightbulb,
  Save,
  Target,
  HelpCircle,
  Dices,
  Bot,
  MessageCircle,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { getSafeExternalUrl } from '../../lib/safeUrl';

export default function RaioXNotebook({
  filteredQuestions,
  blockScopedQuestions,
  subjectGroups,
  stats,
  avoidableCount,
  pegadinhaCount,
  blocoMetadata,
  caveiraCourseIndexMap,
  findCourseVideoMatch,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  selectedSubject,
  setSelectedSubject,
  selectedTopic,
  setSelectedTopic,
  selectedLegalDevice,
  setSelectedLegalDevice,
  editingNoteId,
  setEditingNoteId,
  noteDraft,
  setNoteDraft,
  expandedComments,
  toggleComment,
  handleSaveNote,
  updateCaveiraQuestion,
  createFsrsCardFromCaveira,
  deleteCaveiraQuestion,
  resetAllFilters
}) {
  const [visibleCount, setVisibleCount] = useState(30);
  const [compactMode, setCompactMode] = useState(false);

  const activeSubjectObj = subjectGroups.find((s) => s.name === selectedSubject);
  const topicOptions = activeSubjectObj ? activeSubjectObj.topicsList : [];

  const filterChips = [
    { id: 'all', label: 'Todas', count: blockScopedQuestions.length },
    { id: 'errors', label: 'Erros', count: stats.errors },
    { id: 'avoidable', label: 'Evitáveis', count: avoidableCount },
    { id: 'pegadinha', label: 'Pegadinhas', count: pegadinhaCount },
    { id: 'hits', label: 'Acertos', count: stats.hits },
    { id: 'guesses', label: 'Dúvida/Chute', count: stats.guessesOrDoubtsTotal },
    { id: 'theory', label: 'Teoria', count: stats.errorReasons.conteudo },
    { id: 'attention', label: 'Atenção', count: stats.errorReasons.atencao }
  ];

  const displayedQuestions = filteredQuestions.slice(0, visibleCount);

  return (
    <div id="caderno-questoes" className="space-y-4">
      {/* Barra de Controle e Filtros do Caderno */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Caderno tático de questões</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-200 tabular-nums">
                {filteredQuestions.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Revisão ativa de enunciados, bizus pessoais, diagnóstico de erro e envio para o FSRS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px] sm:w-64 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(30);
                }}
                placeholder="Buscar código, lei ou termo..."
                className="w-full h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-8 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Seletor de Disciplina */}
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('all');
                setVisibleCount(30);
              }}
              aria-label="Filtrar por disciplina"
              className="h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 max-w-[200px]"
            >
              <option value="all">Todas as disciplinas</option>
              {subjectGroups.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.total})
                </option>
              ))}
            </select>

            {/* Seletor de Assunto (quando disciplina selecionada) */}
            {topicOptions.length > 0 && (
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setVisibleCount(30);
                }}
                aria-label="Filtrar por assunto"
                className="h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 max-w-[210px]"
              >
                <option value="all">Todos os assuntos</option>
                {topicOptions.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.total})
                  </option>
                ))}
              </select>
            )}

            {/* Toggle Densidade */}
            <button
              type="button"
              onClick={() => setCompactMode((v) => !v)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                compactMode
                  ? 'bg-sky-500/12 text-sky-700 dark:text-sky-400 border-sky-500/35'
                  : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Alternar visualização compacta"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{compactMode ? 'Compacto' : 'Detalhado'}</span>
            </button>
          </div>
        </div>

        {/* Faixa de Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {filterChips.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterType(f.id);
                setVisibleCount(30);
              }}
              className={`h-8 px-3 rounded-lg font-semibold text-xs transition-colors cursor-pointer border inline-flex items-center gap-1.5 ${
                filterType === f.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-400'
                  : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Chips de Filtros Específicos Ativos */}
        {(selectedSubject !== 'all' || selectedTopic !== 'all' || selectedLegalDevice) && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Recorte ativo:</span>
              {selectedSubject !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-sky-500/12 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-semibold inline-flex items-center gap-1.5">
                  Disciplina: {selectedSubject}
                  <button
                    type="button"
                    onClick={() => { setSelectedSubject('all'); setSelectedTopic('all'); }}
                    className="hover:opacity-70 cursor-pointer"
                    aria-label="Remover filtro de disciplina"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTopic !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-sky-500/12 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-semibold inline-flex items-center gap-1.5">
                  Assunto: {selectedTopic}
                  <button
                    type="button"
                    onClick={() => setSelectedTopic('all')}
                    className="hover:opacity-70 cursor-pointer"
                    aria-label="Remover filtro de assunto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedLegalDevice && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/12 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold inline-flex items-center gap-1.5">
                  Dispositivo: {selectedLegalDevice.label}
                  <button
                    type="button"
                    onClick={() => setSelectedLegalDevice(null)}
                    className="hover:opacity-70 cursor-pointer"
                    aria-label="Remover filtro de dispositivo legal"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </section>

      {/* Lista de Questões */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-14 px-6 text-slate-500 dark:text-slate-400 text-xs space-y-2">
          <CheckCircle2 className="w-9 h-9 mx-auto text-slate-400 opacity-70" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            Nenhuma questão encontrada para este filtro
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-1 h-8 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
          >
            Redefinir filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedQuestions.map((q) => {
            const bMeta = blocoMetadata[q.bloco] || blocoMetadata['Bloco I'];
            const isEditingThisNote = editingNoteId === q.id;
            const isCommentOpen = Boolean(expandedComments[q.id]);
            const cleanTopic = (q.topic && q.topic !== q.subject && q.topic !== q.canonicalSubject) ? q.topic : null;
            const videoMatch = findCourseVideoMatch(q, caveiraCourseIndexMap);
            const safeVideoUrl = videoMatch ? getSafeExternalUrl(videoMatch.url) : '';

            return (
              <article
                key={q.id + (q.timestamp || '')}
                className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 ${
                  q.hit ? 'border-l-emerald-500' : 'border-l-red-500'
                } ${compactMode ? 'p-3.5 space-y-2.5' : 'p-4 sm:p-5 space-y-3.5'} transition-colors`}
              >
                {/* Cabeçalho da Questão */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      q.hit
                        ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-500/12 text-red-700 dark:text-red-400'
                    }`}>
                      {q.hit ? 'Acerto' : 'Erro'}
                    </span>

                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                      {q.id}
                    </span>

                    <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md border ${bMeta.badgeClass}`}>
                      {bMeta.short}
                    </span>

                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {q.canonicalSubject}
                    </span>

                    {cleanTopic && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md" title={cleanTopic}>
                        / {cleanTopic}
                      </span>
                    )}

                    {(q.isAvoidableError || (!q.hit && Number(q.communityCorrectPct) >= 65)) && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Evitável ({q.communityCorrectPct}% acertaram)
                      </span>
                    )}

                    {(q.isPegadinha || Number(q.communityErrorPct) >= 65) && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        Pegadinha ({q.communityErrorPct}% erraram)
                      </span>
                    )}

                    {Array.isArray(q.attempts) && q.attempts.length >= 2 && (
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 tabular-nums">
                        {q.attempts.slice(-4).map((a) => (a?.hit ? '✓' : '✗')).join(' → ')} ({q.attempts.length}x)
                      </span>
                    )}
                  </div>

                  {/* Gabarito + Tempo + Ações */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <div className="h-7 px-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium inline-flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Marcou:</span>
                      <strong className={`font-mono ${q.hit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {q.userChoice || '?'}
                      </strong>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="text-slate-500 dark:text-slate-400">Gab:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">{q.correctChoice || '?'}</strong>
                    </div>

                    <span className="h-7 px-2 rounded-md bg-amber-500/10 border border-amber-500/25 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {q.durationSeconds}s
                    </span>

                    {videoMatch && safeVideoUrl && (
                      <a
                        href={safeVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          try { navigator.clipboard?.writeText(`${videoMatch.mmss} ${videoMatch.topicLabel}`); } catch (_) { /* ignore */ }
                          toast.info(`Abrindo aula em ${videoMatch.mmss}`);
                        }}
                        className="h-7 px-2.5 rounded-md bg-sky-500/12 hover:bg-sky-500/22 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        title={`Rever em ${videoMatch.lessonTitle} (${videoMatch.topicLabel || videoMatch.mmss})`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span className="font-mono">{videoMatch.mmss}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(isEditingThisNote ? null : q.id);
                        setNoteDraft(q.userNote || '');
                      }}
                      className={`h-7 w-7 rounded-md border inline-flex items-center justify-center transition-colors cursor-pointer ${
                        q.userNote
                          ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/35'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-amber-500'
                      }`}
                      title="Adicionar ou editar Bizu Tático"
                      aria-label="Adicionar ou editar Bizu Tático"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => createFsrsCardFromCaveira(q)}
                      className={`h-7 px-2.5 rounded-md font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                        q.fsrsCreated
                          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950'
                      }`}
                      title="Enviar questão para revisão espaçada FSRS"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>{q.fsrsCreated ? 'FSRS ✓' : '+FSRS'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCaveiraQuestion(q.id)}
                      className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-500/10 inline-flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir questão"
                      aria-label="Excluir questão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Enunciado */}
                <div className={`text-slate-800 dark:text-slate-100 leading-relaxed bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800/80 ${
                  compactMode ? 'text-sm p-3 line-clamp-3' : 'text-[15px] p-4'
                }`}>
                  {q.content}
                </div>

                {/* Bizu Pessoal Salvo */}
                {q.userNote && !isEditingThisNote && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold">Seu bizu:</strong> {q.userNote}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(q.id);
                        setNoteDraft(q.userNote || '');
                      }}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0 cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                )}

                {/* Editor de Bizu */}
                {isEditingThisNote && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Anote a pegadinha, artigo de lei ou mnemônico desta questão..."
                      className="flex-1 h-9 bg-white dark:bg-slate-950 border border-amber-500/50 rounded-lg px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNote(q.id)}
                      className="h-9 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </button>
                  </div>
                )}

                {/* Barra Inferior: Confiança + Causa do Erro + Comentário */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">Confiança:</span>
                      {[
                        { id: 'sabia', label: 'Sabia', icon: <Target className="w-3 h-3" /> },
                        { id: 'duvida', label: 'Dúvida', icon: <HelpCircle className="w-3 h-3" /> },
                        { id: 'chute', label: 'Chute', icon: <Dices className="w-3 h-3" /> }
                      ].map(({ id, label, icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => updateCaveiraQuestion(q.id, {
                            confidence: id,
                            fsrsRequested: id === 'chute' || id === 'duvida'
                          })}
                          className={`h-7 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                            (q.confidence || 'sabia') === id
                              ? 'bg-sky-600 text-white border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-400 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {icon}
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>

                    {!q.hit && (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-red-600 dark:text-red-400 mr-1">Causa:</span>
                        {[
                          { id: 'conteudo', label: 'Teoria' },
                          { id: 'atencao', label: 'Atenção' },
                          { id: 'interpretacao', label: 'Interpretação' }
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => updateCaveiraQuestion(q.id, { errorReason: r.id })}
                            className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                              (q.errorReason || 'conteudo') === r.id
                                ? 'bg-red-600 text-white border-red-500 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {q.teacherComment && (
                    <button
                      type="button"
                      onClick={() => toggleComment(q.id)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {q.commentSource === 'charlie' ? (
                        <Bot className="w-3.5 h-3.5" />
                      ) : q.commentSource === 'aluno' ? (
                        <MessageCircle className="w-3.5 h-3.5" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isCommentOpen
                          ? 'Ocultar comentário'
                          : q.commentSource === 'charlie'
                          ? 'Ver explicação Charlie IA'
                          : q.commentSource === 'aluno'
                          ? 'Ver comentário da comunidade'
                          : 'Ver comentário do professor'}
                      </span>
                      {isCommentOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Comentário Expansível */}
                <AnimatePresence>
                  {q.teacherComment && isCommentOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 rounded-xl bg-sky-500/8 border border-sky-500/25 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        <span className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1.5">
                          {q.commentSource === 'charlie' ? (
                            <>
                              <Bot className="w-4 h-4" />
                              Explicação Charlie IA:
                            </>
                          ) : q.commentSource === 'aluno' ? (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              Comentário mais curtido da comunidade:
                            </>
                          ) : (
                            <>
                              <GraduationCap className="w-4 h-4" />
                              Comentário do professor / gabarito:
                            </>
                          )}
                        </span>
                        {q.teacherComment}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}

          {filteredQuestions.length > visibleCount && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 30)}
                className="h-10 px-5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Carregar mais questões ({filteredQuestions.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
