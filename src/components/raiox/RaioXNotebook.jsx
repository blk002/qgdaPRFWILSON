import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ERROR_CAUSES, normalizeErrorReason } from '../../lib/errorAutopsy';
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
  SlidersHorizontal,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getSafeExternalUrl } from '../../lib/safeUrl';
import { CAVEIRA_DIFFICULTY_LEVELS, classifyQuestionDifficulty } from '../../lib/caveiraDifficulty';

const NOTEBOOK_DIFF_BADGE = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  orange: 'text-orange-600 dark:text-orange-400',
  rose: 'text-rose-600 dark:text-rose-400',
};

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
  selectedDifficulty = 'all',
  setSelectedDifficulty,
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
    { id: 'hits', label: 'Acertos', count: stats.hits },
    { id: 'avoidable', label: 'Evitáveis', count: avoidableCount },
    { id: 'pegadinha', label: 'Pegadinhas', count: pegadinhaCount },
    { id: 'guesses', label: 'Chute/Dúvida', count: stats.guessesOrDoubtsTotal },
    ...ERROR_CAUSES.map((c) => ({
      id: c.filterId,
      label: `${c.icon} ${c.shortLabel}`,
      count: Number(stats.errorReasons?.[c.id]) || 0
    }))
  ];

  const displayedQuestions = filteredQuestions.slice(0, visibleCount);

  return (
    <div id="caderno-questoes" className="space-y-4">
      {/* Barra de Filtros Limpa e Direta */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Caderno de Questões</span>
              <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums">
                ({filteredQuestions.length})
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Revise enunciados, registre bizus pessoais, classifique erros e envie para revisão espaçada FSRS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px] sm:w-60 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(30);
                }}
                placeholder="Buscar código, lei ou termo..."
                className="w-full h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-8 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
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
              className="h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 max-w-[190px]"
            >
              <option value="all">Todas disciplinas</option>
              {subjectGroups.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.total})
                </option>
              ))}
            </select>

            {/* Seletor de Assunto */}
            {topicOptions.length > 0 && (
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setVisibleCount(30);
                }}
                aria-label="Filtrar por assunto"
                className="h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 max-w-[200px]"
              >
                <option value="all">Todos assuntos</option>
                {topicOptions.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.total})
                  </option>
                ))}
              </select>
            )}

            {/* Seletor de Dificuldade */}
            {typeof setSelectedDifficulty === 'function' && (
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setVisibleCount(30);
                }}
                aria-label="Filtrar por dificuldade"
                className="h-9 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 max-w-[195px]"
              >
                <option value="all">Todas dificuldades</option>
                {CAVEIRA_DIFFICULTY_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={String(lvl.id)}>
                    {lvl.label} ({lvl.rateLabel})
                  </option>
                ))}
              </select>
            )}

            {/* Toggle Densidade */}
            <button
              type="button"
              onClick={() => setCompactMode((v) => !v)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                compactMode
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Alternar visualização compacta"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{compactMode ? 'Compacto' : 'Detalhado'}</span>
            </button>
          </div>
        </div>

        {/* Filtros rápidos em faixa limpa */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 border-t border-slate-100 dark:border-slate-800/80">
          {filterChips.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterType(f.id);
                setVisibleCount(30);
              }}
              className={`h-7 px-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950'
                  : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span className="font-mono text-[11px] opacity-70 tabular-nums">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Recorte específico ativo */}
        {(selectedSubject !== 'all' || selectedTopic !== 'all' || selectedDifficulty !== 'all' || selectedLegalDevice) && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Filtro ativo:</span>
              {selectedSubject !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('all');
                    setSelectedTopic('all');
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <span>{selectedSubject}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {selectedTopic !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedTopic('all')}
                  className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <span>· {selectedTopic}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {selectedDifficulty !== 'all' && typeof setSelectedDifficulty === 'function' && (
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('all')}
                  className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <span>
                    ·{' '}
                    {CAVEIRA_DIFFICULTY_LEVELS.find((l) => String(l.id) === String(selectedDifficulty))
                      ?.label || `Nível ${selectedDifficulty}`}
                  </span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {selectedLegalDevice && (
                <button
                  type="button"
                  onClick={() => setSelectedLegalDevice(null)}
                  className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <span>· {selectedLegalDevice.label}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {/* Lista de Questões */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-14 px-6 text-slate-500 dark:text-slate-400 text-xs space-y-2">
          <CheckCircle2 className="w-9 h-9 mx-auto text-slate-400 opacity-70" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            Nenhuma questão encontrada neste recorte
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="mt-1 h-8 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
          >
            Redefinir filtros
          </button>
        </div>
      ) : (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {displayedQuestions.map((q) => {
            const bMeta = blocoMetadata[q.bloco] || blocoMetadata['Bloco I'];
            const isEditingThisNote = editingNoteId === q.id;
            const isCommentOpen = Boolean(expandedComments[q.id]);
            const cleanTopic =
              q.topic && q.topic !== q.subject && q.topic !== q.canonicalSubject ? q.topic : null;
            const videoMatch = findCourseVideoMatch(q, caveiraCourseIndexMap);
            const safeVideoUrl = videoMatch ? getSafeExternalUrl(videoMatch.url) : '';
            const isAvoidable =
              q.isAvoidableError || (!q.hit && Number(q.communityCorrectPct) >= 65);
            const isPegadinha = q.isPegadinha || Number(q.communityErrorPct) >= 65;
            const diffInfo = classifyQuestionDifficulty(q);

            return (
              <article
                key={q.id + (q.timestamp || '')}
                className={`${
                  compactMode ? 'p-4 space-y-2.5' : 'p-4 sm:p-5 space-y-3.5'
                } transition-colors`}
              >
                {/* Cabeçalho limpo sem empilhamento de pílulas */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold ${
                        q.hit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          q.hit ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {q.hit ? 'Acerto' : 'Erro'}
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">·</span>

                    <span className="font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {q.id}
                    </span>

                    <span className="text-slate-300 dark:text-slate-700">·</span>

                    <span className="font-mono text-[11px] font-semibold text-slate-400">
                      {bMeta.short}
                    </span>

                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {q.canonicalSubject}
                    </span>

                    {cleanTopic && (
                      <span
                        className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md"
                        title={cleanTopic}
                      >
                        / {cleanTopic}
                      </span>
                    )}

                    {isAvoidable && (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        · Evitável ({q.communityCorrectPct}% acertam)
                      </span>
                    )}

                    {isPegadinha && (
                      <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                        · Pegadinha ({q.communityErrorPct}% erram)
                      </span>
                    )}

                    {diffInfo && (
                      <span
                        className={`text-[11px] font-semibold ${NOTEBOOK_DIFF_BADGE[diffInfo.tone] || 'text-slate-500 dark:text-slate-400'}`}
                        title={`Dificuldade Caveira: ${diffInfo.label} (${diffInfo.rateLabel} de acertos)`}
                      >
                        · {diffInfo.label}
                        {typeof q.communityCorrectPct === 'number' ? ` (${q.communityCorrectPct}%)` : ''}
                      </span>
                    )}

                    {Array.isArray(q.attempts) && q.attempts.length >= 2 && (
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        · {q.attempts.slice(-4).map((a) => (a?.hit ? '✓' : '✗')).join('→')} (
                        {q.attempts.length}x)
                      </span>
                    )}
                  </div>

                  {/* Gabarito + Tempo + Ações */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
                      <span>
                        Marcou{' '}
                        <strong
                          className={
                            q.hit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {q.userChoice || '?'}
                        </strong>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span>
                        Gab{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {q.correctChoice || '?'}
                        </strong>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <span className="inline-flex items-center gap-0.5 text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {q.durationSeconds}s
                      </span>
                    </div>

                    {videoMatch && safeVideoUrl && (
                      <a
                        href={safeVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          try {
                            navigator.clipboard?.writeText(
                              `${videoMatch.mmss} ${videoMatch.topicLabel}`
                            );
                          } catch (_) {
                            /* ignore */
                          }
                          toast.info(`Abrindo aula em ${videoMatch.mmss}`);
                        }}
                        className="group h-7 pl-1.5 pr-2 rounded-lg border border-sky-500/25 dark:border-sky-400/25 bg-sky-500/[0.06] dark:bg-sky-400/[0.07] hover:bg-sky-500/[0.14] dark:hover:bg-sky-400/[0.16] hover:border-sky-500/45 dark:hover:border-sky-400/45 hover:shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 text-sky-700 dark:text-sky-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                        title={`Rever em ${videoMatch.lessonTitle} (${videoMatch.topicLabel || videoMatch.mmss})`}
                      >
                        <span className="w-5 h-5 rounded-full bg-sky-500/15 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 dark:group-hover:bg-sky-400 group-hover:text-white dark:group-hover:text-slate-950 group-hover:scale-110 flex items-center justify-center shrink-0 transition-all duration-200">
                          <Video className="w-3 h-3" />
                        </span>
                        <span className="font-mono group-hover:translate-x-0.5 transition-transform duration-200">
                          {videoMatch.mmss}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(isEditingThisNote ? null : q.id);
                        setNoteDraft(q.userNote || '');
                      }}
                      className={`h-7 px-2 rounded-md border text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                        q.userNote
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Adicionar ou editar Bizu Tático"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bizu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => createFsrsCardFromCaveira(q)}
                      className={`h-7 px-2.5 rounded-md font-semibold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                        q.fsrsCreated
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                          : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 dark:border-sky-500'
                      }`}
                      title="Enviar questão para revisão espaçada FSRS"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>{q.fsrsCreated ? 'FSRS ✓' : '+FSRS'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCaveiraQuestion(q.id)}
                      className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center transition-colors cursor-pointer"
                      title="Excluir questão"
                      aria-label="Excluir questão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Enunciado com leitura confortável */}
                <p
                  className={`text-slate-800 dark:text-slate-100 leading-relaxed ${
                    compactMode ? 'text-xs sm:text-sm line-clamp-3' : 'text-sm sm:text-[15px]'
                  }`}
                >
                  {q.content}
                </p>

                {/* Bizu Pessoal Salvo */}
                {q.userNote && !isEditingThisNote && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start sm:items-center justify-between gap-2">
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNote(q.id);
                        }
                      }}
                      placeholder="Anote a pegadinha, artigo de lei ou mnemônico desta questão..."
                      className="flex-1 h-9 bg-white dark:bg-slate-950 border border-amber-400 dark:border-amber-700 rounded-lg px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none"
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
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium text-slate-400 mr-1">
                        Confiança:
                      </span>
                      <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                        {[
                          { id: 'sabia', label: 'Sabia', icon: <Target className="w-3 h-3" /> },
                          { id: 'duvida', label: 'Dúvida', icon: <HelpCircle className="w-3 h-3" /> },
                          { id: 'chute', label: 'Chute', icon: <Dices className="w-3 h-3" /> }
                        ].map(({ id, label, icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              updateCaveiraQuestion(q.id, {
                                confidence: id,
                                fsrsRequested: id === 'chute' || id === 'duvida'
                              })
                            }
                            className={`h-6 px-2 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                              (q.confidence || 'sabia') === id
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {icon}
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {!q.hit && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-medium text-red-500 dark:text-red-400 mr-1">
                          Autópsia:
                        </span>
                        <div className="inline-flex flex-wrap items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 gap-0.5">
                          {ERROR_CAUSES.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => updateCaveiraQuestion(q.id, { errorReason: r.id })}
                              title={r.label}
                              className={`h-6 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                normalizeErrorReason(q.errorReason) === r.id
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {r.icon} {r.shortLabel}
                            </button>
                          ))}
                        </div>
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
                            ? 'Explicação Charlie IA'
                            : q.commentSource === 'aluno'
                              ? 'Comentário da comunidade'
                              : 'Comentário do professor'}
                      </span>
                      {isCommentOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
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
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        <span className="font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5 mb-1.5">
                          {q.commentSource === 'charlie' ? (
                            <>
                              <Bot className="w-4 h-4" />
                              Explicação Charlie IA
                            </>
                          ) : q.commentSource === 'aluno' ? (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              Comentário mais curtido da comunidade
                            </>
                          ) : (
                            <>
                              <GraduationCap className="w-4 h-4" />
                              Comentário do professor / gabarito
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
            <div className="p-4 flex justify-center bg-slate-50/50 dark:bg-slate-950/30">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 30)}
                className="h-9 px-5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Carregar mais questões ({filteredQuestions.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
