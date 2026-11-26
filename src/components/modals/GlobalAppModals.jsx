import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit, Calendar as CalendarIcon, Crosshair, ListFilter, Skull,
  ArrowRight, Check, Repeat, AlertTriangle, Info, X, Zap
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import ClassCompletionModal from '../ClassCompletionModal';
import CaveiraReviewQuestionModal from '../CaveiraReviewQuestionModal';
import RankBadge from '../RankBadge';
import {
  parseCourseIndexSubtopics,
  findMatchingCourseIndexEntry,
} from '../../lib/courseIndexParser';
import { triggerCaveiraPractice } from '../../hooks/useExtensionBridge';
import {
  CAVEIRA_DIFFICULTY_LEVELS,
  CAVEIRA_UNDEFINED_DIFFICULTY,
  recommendDifficultyForTopic,
  sanitizeDifficultyIds,
} from '../../lib/caveiraDifficulty';

const DIFF_TONE_ACTIVE = {
  emerald: {
    card: 'bg-emerald-50/90 text-emerald-900 border-emerald-400/80 ring-1 ring-emerald-500/15 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/50 dark:ring-emerald-400/15',
    sub: 'text-emerald-700/80 dark:text-emerald-300/80',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  sky: {
    card: 'bg-sky-50/90 text-sky-900 border-sky-400/80 ring-1 ring-sky-500/15 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/50 dark:ring-sky-400/15',
    sub: 'text-sky-700/80 dark:text-sky-300/80',
    icon: 'text-sky-600 dark:text-sky-400',
  },
  amber: {
    card: 'bg-amber-50/90 text-amber-900 border-amber-400/80 ring-1 ring-amber-500/15 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/50 dark:ring-amber-400/15',
    sub: 'text-amber-700/80 dark:text-amber-300/80',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  orange: {
    card: 'bg-orange-50/90 text-orange-900 border-orange-400/80 ring-1 ring-orange-500/15 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/50 dark:ring-orange-400/15',
    sub: 'text-orange-700/80 dark:text-orange-300/80',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  rose: {
    card: 'bg-rose-50/90 text-rose-900 border-rose-400/80 ring-1 ring-rose-500/15 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/50 dark:ring-rose-400/15',
    sub: 'text-rose-700/80 dark:text-rose-300/80',
    icon: 'text-rose-600 dark:text-rose-400',
  },
};

export default function GlobalAppModals({
  courseIndexCache,
  manualLessonIndexMap,
  saveManualLessonIndex,
  promotionModal,
  setPromotionModal,
}) {
  const subjects = useStore((s) => s.subjects);
  const globalModal = useStore((s) => s.globalModal);
  const setGlobalModal = useStore((s) => s.setGlobalModal);
  const reviewModal = useStore((s) => s.reviewModal);
  const setReviewModal = useStore((s) => s.setReviewModal);
  const classConfirmModal = useStore((s) => s.classConfirmModal);
  const setClassConfirmModal = useStore((s) => s.setClassConfirmModal);
  const replaceSubjectModal = useStore((s) => s.replaceSubjectModal);
  const setReplaceSubjectModal = useStore((s) => s.setReplaceSubjectModal);
  const handleReviewSubmit = useStore((s) => s.handleReviewSubmit);
  const watchClass = useStore((s) => s.watchClass);
  const handleReplaceSubject = useStore((s) => s.handleReplaceSubject);
  const getLocalDateStr = useStore((s) => s.getLocalDateStr);
  const caveiraQuestions = useStore((s) => s.caveiraQuestions);

  const [reviewInputs, setReviewInputs] = useState({ total: 10, correct: 0 });
  const [dismissedPrePromptModalRef, setDismissedPrePromptModalRef] = useState(null);
  const [prePromptIndexText, setPrePromptIndexText] = useState('');
  const [prePromptQuestionStatus, setPrePromptQuestionStatus] = useState('not_resolved');
  const [prePromptDifficultyIds, setPrePromptDifficultyIds] = useState([]);
  const [showPrePromptIndexBox, setShowPrePromptIndexBox] = useState(false);
  const [prevPrePromptModalRef, setPrevPrePromptModalRef] = useState(null);

  const matchedModalIndexEntry = useMemo(() => {
    if (!classConfirmModal) return null;
    return findMatchingCourseIndexEntry({
      manualIndexMap: manualLessonIndexMap,
      extensionCache: courseIndexCache,
      lessonNames: classConfirmModal.lessonNames || classConfirmModal.allRemainingLessonNames || [],
      topicName: classConfirmModal.topicName || '',
    });
  }, [classConfirmModal, manualLessonIndexMap, courseIndexCache]);

  if (prevPrePromptModalRef !== classConfirmModal) {
    setPrevPrePromptModalRef(classConfirmModal);
    const autoText = matchedModalIndexEntry?.rawIndexText || '';
    setPrePromptIndexText(autoText);
    setPrePromptQuestionStatus('not_resolved');
    setPrePromptDifficultyIds([]);
    setShowPrePromptIndexBox(false);
  }

  const difficultyRecommendation = useMemo(() => {
    if (!classConfirmModal) return null;
    const subjectName = subjects?.[classConfirmModal.subjectId]?.name || '';
    return recommendDifficultyForTopic(
      caveiraQuestions || [],
      subjectName,
      classConfirmModal.topicName || '',
      classConfirmModal.lessonNames || []
    );
  }, [classConfirmModal, caveiraQuestions, subjects]);

  const togglePrePromptDifficulty = (id) => {
    setPrePromptDifficultyIds((prev) => {
      const clean = sanitizeDifficultyIds(prev);
      if (clean.includes(id)) {
        const next = clean.filter((x) => x !== id);
        return next.some((x) => x >= 2) ? next : [];
      }
      return sanitizeDifficultyIds([...clean, id]);
    });
  };

  const prePromptSubtopics = useMemo(() => {
    if (!classConfirmModal) return [];
    const subjectName = subjects?.[classConfirmModal.subjectId]?.name || '';
    return parseCourseIndexSubtopics(prePromptIndexText, [
      subjectName,
      classConfirmModal.topicName,
      ...(classConfirmModal.lessonNames || []),
    ]);
  }, [classConfirmModal, prePromptIndexText, subjects]);

  const fsrsPrediction = useMemo(() => {
    if (!reviewModal || reviewInputs.total <= 0) return null;
    const perf = reviewInputs.correct / reviewInputs.total;
    let rating = 3;
    if (perf >= 1.0) rating = 4;
    else if (perf >= 0.8) rating = 3;
    else if (perf >= 0.6) rating = 2;
    else rating = 1;
    const { updateFsrsCard } = useStore.getState();
    return updateFsrsCard(reviewModal, rating);
  }, [reviewModal, reviewInputs.correct, reviewInputs.total]);

  const isCaveiraReview = Boolean(
    reviewModal &&
      (reviewModal.isCaveiraQuestion ||
        reviewModal.questionData ||
        String(reviewModal.id || '').startsWith('rev_caveira_') ||
        String(reviewModal.topicName || '').startsWith('[Caveira'))
  );

  return (
    <>
      {/* 1. Modal de Avaliação de Revisão */}
      {reviewModal && isCaveiraReview
        ? createPortal(
            <CaveiraReviewQuestionModal review={reviewModal} onClose={() => setReviewModal(null)} />,
            document.body
          )
        : reviewModal &&
          createPortal(
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-4 fade-in font-sans"
              onClick={() => {
                setReviewModal(null);
                setReviewInputs({ total: 10, correct: 0 });
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-md w-full border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
              >
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 dark:ring-sky-400/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                        Avaliar retenção
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{reviewModal.topicName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModal(null);
                      setReviewInputs({ total: 10, correct: 0 });
                    }}
                    aria-label="Fechar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                        Total de questões
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={reviewInputs.total}
                        onChange={(e) => {
                          const nextTotal = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setReviewInputs((prev) => ({
                            ...prev,
                            total: nextTotal,
                            correct: Math.min(prev.correct, nextTotal),
                          }));
                        }}
                        className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Acertos</label>
                      <input
                        type="number"
                        min="0"
                        max={reviewInputs.total}
                        value={reviewInputs.correct}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setReviewInputs((prev) => ({ ...prev, correct: Math.min(val, prev.total) }));
                        }}
                        className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-white focus:border-sky-500 outline-none"
                      />
                    </div>
                  </div>

                  {reviewInputs.total > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Aproveitamento</span>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            reviewInputs.correct / reviewInputs.total >= 0.8
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : reviewInputs.correct / reviewInputs.total >= 0.6
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {Math.round((reviewInputs.correct / reviewInputs.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            reviewInputs.correct / reviewInputs.total >= 0.8
                              ? 'bg-emerald-500'
                              : reviewInputs.correct / reviewInputs.total >= 0.6
                              ? 'bg-sky-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, (reviewInputs.correct / reviewInputs.total) * 100)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-center">
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Dificuldade</p>
                          <p className="text-xs font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                            {typeof fsrsPrediction?.difficulty === 'number' ? fsrsPrediction.difficulty.toFixed(1) : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Estabilidade</p>
                          <p className="text-xs font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                            {typeof fsrsPrediction?.stability === 'number'
                              ? `${fsrsPrediction.stability.toFixed(1)}d`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Intervalo</p>
                          <p className="text-xs font-mono font-semibold tabular-nums text-sky-600 dark:text-sky-400 mt-0.5">
                            {fsrsPrediction ? `${fsrsPrediction.nextInterval}d` : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Próxima revisão:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                          {fsrsPrediction
                            ? (() => {
                                const target = useStore.getState().getTodayDate();
                                target.setDate(target.getDate() + fsrsPrediction.nextInterval);
                                return target.toLocaleDateString('pt-BR');
                              })()
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModal(null);
                      setReviewInputs({ total: 10, correct: 0 });
                    }}
                    className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={reviewInputs.total <= 0}
                    onClick={() => {
                      handleReviewSubmit(reviewModal.id, reviewInputs.correct / reviewInputs.total);
                      setReviewModal(null);
                      setReviewInputs({ total: 10, correct: 0 });
                    }}
                    className="h-9 px-4 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Salvar revisão
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

      {/* 2a. Diálogo Pré-Confirmação: Fazer Questões Antes de Concluir Aula */}
      {classConfirmModal &&
        !classConfirmModal.skipPrePrompt &&
        dismissedPrePromptModalRef !== classConfirmModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[120] p-3 sm:p-4 fade-in font-sans"
            onClick={() => setClassConfirmModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-md w-full border border-slate-200/90 dark:border-slate-800 relative max-h-[92vh] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 dark:ring-sky-400/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      Praticar questões antes?
                    </h3>
                    {subjects?.[classConfirmModal.subjectId]?.name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {subjects[classConfirmModal.subjectId].name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClassConfirmModal(null)}
                  aria-label="Fechar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {/* Contexto da aula */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
                    Conteúdo da aula
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mt-0.5">
                    {classConfirmModal.lessonNames?.length
                      ? classConfirmModal.lessonNames.join(' · ')
                      : classConfirmModal.topicName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Ajuste os filtros abaixo para praticar no Projeto Caveira antes de registrar a aula.
                  </p>
                </div>

                {/* Subassuntos do Índice da Aula */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 min-w-0">
                      <ListFilter className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                      <span className="truncate">Índice da aula</span>
                      <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                        {prePromptSubtopics.length > 0
                          ? `· ${prePromptSubtopics.length} ${prePromptSubtopics.length === 1 ? 'subassunto' : 'subassuntos'}`
                          : '· opcional'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPrePromptIndexBox((v) => !v)}
                      className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors shrink-0 cursor-pointer"
                    >
                      {showPrePromptIndexBox ? 'Ocultar' : prePromptIndexText ? 'Editar índice' : 'Colar índice'}
                    </button>
                  </div>

                  {prePromptSubtopics.length > 0 ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/90 dark:bg-slate-800/40 rounded-lg px-3 py-2 border border-slate-200/70 dark:border-slate-800/80">
                      {prePromptSubtopics.slice(0, 6).join(' · ')}
                      {prePromptSubtopics.length > 6 ? ` · +${prePromptSubtopics.length - 6}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Para aulas genéricas, cole o índice ou abra o player do Caveira para filtrar por subassuntos.
                    </p>
                  )}

                  {courseIndexCache?.latest?.rawIndexText &&
                    courseIndexCache.latest.rawIndexText !== prePromptIndexText && (
                      <button
                        type="button"
                        onClick={() => {
                          const captured = courseIndexCache.latest.rawIndexText;
                          setPrePromptIndexText(captured);
                          const lessonKeyTarget = classConfirmModal.lessonNames?.[0] || classConfirmModal.topicName;
                          if (lessonKeyTarget) saveManualLessonIndex(captured, lessonKeyTarget);
                        }}
                        className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 hover:bg-emerald-500/15 transition-colors w-full text-left flex items-center justify-between gap-2 cursor-pointer"
                        title={courseIndexCache.latest.lessonTitle || ''}
                      >
                        <span className="truncate">
                          Usar índice aberto no Caveira (
                          {courseIndexCache.latest.lessonTitle ||
                            `${courseIndexCache.latest.subtopics?.length || 0} tópicos`}
                          )
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}

                  {showPrePromptIndexBox && (
                    <textarea
                      rows={3}
                      value={prePromptIndexText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrePromptIndexText(val);
                        const lessonKeyTarget = classConfirmModal.lessonNames?.[0] || classConfirmModal.topicName;
                        if (lessonKeyTarget) saveManualLessonIndex(val, lessonKeyTarget);
                      }}
                      placeholder="Cole aqui o texto da aba Índice ([00:01:42] Conceitos...)"
                      className="w-full text-xs font-mono bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none resize-y transition-shadow"
                    />
                  )}
                </div>

                {/* Filtro de status */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Status das questões
                    </span>
                  </div>
                  <div className="bg-slate-100/90 dark:bg-slate-950/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800/80 flex flex-wrap gap-1">
                    {[
                      { value: 'not_resolved', label: 'Não resolvidas' },
                      { value: 'wrong', label: 'Erradas' },
                      { value: 'right', label: 'Certas' },
                      { value: 'resolved', label: 'Resolvidas' },
                      { value: '', label: 'Todas' },
                    ].map((opt) => {
                      const active = prePromptQuestionStatus === opt.value;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setPrePromptQuestionStatus(opt.value)}
                          className={`flex-1 min-w-fit h-8 px-2.5 rounded-lg text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Nível de dificuldade */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Nível de dificuldade
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {prePromptDifficultyIds.length === 0
                          ? '· todos'
                          : `· ${prePromptDifficultyIds.length} ${prePromptDifficultyIds.length === 1 ? 'selecionado' : 'selecionados'}`}
                      </span>
                    </div>
                    {difficultyRecommendation && (() => {
                      const isAutoSelected =
                        prePromptDifficultyIds.length === 1 &&
                        prePromptDifficultyIds[0] === difficultyRecommendation.recommendedId;
                      return (
                        <button
                          type="button"
                          onClick={() => setPrePromptDifficultyIds([difficultyRecommendation.recommendedId])}
                          title={difficultyRecommendation.summary}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors shrink-0 cursor-pointer ${
                            isAutoSelected
                              ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
                              : 'text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/15 border-sky-500/25'
                          }`}
                        >
                          <Zap className="w-3 h-3 shrink-0" />
                          <span>Auto: {difficultyRecommendation.level.label}</span>
                        </button>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrePromptDifficultyIds([])}
                      className={`px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-0.5 ${
                        prePromptDifficultyIds.length === 0
                          ? 'bg-sky-50/90 text-sky-900 border-sky-400/80 ring-1 ring-sky-500/15 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/50 dark:ring-sky-400/15'
                          : 'bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-1 text-xs font-semibold leading-tight">
                        <span>Todos</span>
                        {prePromptDifficultyIds.length === 0 && (
                          <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        )}
                      </span>
                      <span
                        className={`text-[10px] leading-tight ${
                          prePromptDifficultyIds.length === 0
                            ? 'text-sky-700/80 dark:text-sky-300/80'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        Todas as faixas
                      </span>
                    </button>

                    {CAVEIRA_DIFFICULTY_LEVELS.map((lvl) => {
                      const active = prePromptDifficultyIds.includes(lvl.id);
                      const isRecommended = difficultyRecommendation?.recommendedId === lvl.id;
                      const tone = DIFF_TONE_ACTIVE[lvl.tone];
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => togglePrePromptDifficulty(lvl.id)}
                          title={`${lvl.label} (${lvl.rateLabel} de acertos na plataforma)`}
                          className={`px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-0.5 ${
                            active
                              ? tone.card
                              : 'bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-1 text-xs font-semibold leading-tight">
                            <span className="truncate">{lvl.label}</span>
                            {active ? (
                              <Check className={`w-3.5 h-3.5 shrink-0 ${tone.icon}`} />
                            ) : isRecommended ? (
                              <Zap className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0 opacity-80" />
                            ) : null}
                          </span>
                          <span
                            className={`text-[10px] font-mono tabular-nums leading-tight ${
                              active ? tone.sub : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {lvl.rateLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {difficultyRecommendation?.summary && (
                    <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <span>{difficultyRecommendation.summary}</span>
                    </p>
                  )}

                  {prePromptDifficultyIds.some((id) => id >= 2) && (
                    <label className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                      <span className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={prePromptDifficultyIds.includes(CAVEIRA_UNDEFINED_DIFFICULTY.id)}
                          onChange={() => togglePrePromptDifficulty(CAVEIRA_UNDEFINED_DIFFICULTY.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 accent-sky-600 dark:accent-sky-400 cursor-pointer"
                        />
                        <span>Incluir questões novas (&quot;Em definição&quot;)</span>
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {CAVEIRA_UNDEFINED_DIFFICULTY.rateLabel}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const subjectName = subjects?.[classConfirmModal.subjectId]?.name || '';
                    const lessonNames = classConfirmModal.lessonNames || [];
                    const topicName = classConfirmModal.topicName || '';
                    triggerCaveiraPractice(
                      subjectName,
                      lessonNames,
                      topicName,
                      prePromptSubtopics,
                      prePromptIndexText,
                      prePromptQuestionStatus,
                      prePromptDifficultyIds
                    );
                    setClassConfirmModal(null);
                  }}
                  className="w-full h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Skull className="w-4 h-4" />
                  <span>
                    {prePromptSubtopics.length > 0
                      ? `Filtrar ${prePromptSubtopics.length} subassuntos no Caveira`
                      : 'Abrir questões no Caveira'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setDismissedPrePromptModalRef(classConfirmModal)}
                  className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Continuar para confirmar aula</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClassConfirmModal(null)}
                  className="w-full h-9 px-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 2b. Modal de Confirmação de Aula */}
      <ClassCompletionModal
        key={classConfirmModal ? `${classConfirmModal.subjectId}_${classConfirmModal.initialStudyDate || 'today'}` : 'none'}
        isOpen={Boolean(
          classConfirmModal && (classConfirmModal.skipPrePrompt || dismissedPrePromptModalRef === classConfirmModal)
        )}
        topicName={classConfirmModal?.topicName}
        maxClasses={classConfirmModal?.maxClasses}
        subjectSpeed={subjects?.[classConfirmModal?.subjectId]?.speed || 1}
        lessonDuration={classConfirmModal?.lessonDuration}
        allLessonsDurations={classConfirmModal?.allLessonsDurations}
        suggestedClasses={classConfirmModal?.suggestedClasses || null}
        timeGoalMinutes={classConfirmModal?.timeGoalMinutes || null}
        initialStudyDate={classConfirmModal?.initialStudyDate || null}
        todayDateStr={getLocalDateStr ? getLocalDateStr() : ''}
        lessonNames={classConfirmModal?.lessonNames || []}
        allRemainingLessonNames={classConfirmModal?.allRemainingLessonNames || []}
        initialIndexText={prePromptIndexText || matchedModalIndexEntry?.rawIndexText || ''}
        latestCapturedCourseIndex={courseIndexCache?.latest || null}
        selectedDifficultyIds={prePromptDifficultyIds}
        onChangeDifficultyIds={setPrePromptDifficultyIds}
        difficultyRecommendation={difficultyRecommendation}
        onSaveLessonIndex={saveManualLessonIndex}
        onPracticeQuestions={(selectedCount, subtopics = [], rawIndexText = '') => {
          const subjectName = subjects?.[classConfirmModal?.subjectId]?.name || '';
          const allRem = classConfirmModal?.allRemainingLessonNames || [];
          const count = Math.max(1, Number(selectedCount) || 1);
          const chosenLessons = allRem.length > 0 ? allRem.slice(0, count) : classConfirmModal?.lessonNames || [];
          const topicName = classConfirmModal?.topicName || '';
          triggerCaveiraPractice(
            subjectName,
            chosenLessons,
            topicName,
            subtopics,
            rawIndexText,
            prePromptQuestionStatus,
            prePromptDifficultyIds
          );
        }}
        onClose={() => setClassConfirmModal(null)}
        onConfirm={(amount, speed, studyDate) => {
          watchClass(
            classConfirmModal.subjectId,
            classConfirmModal.slotIndex,
            amount,
            speed,
            studyDate,
            classConfirmModal.plannedBlockCount ?? null
          );
          if (typeof classConfirmModal.onConfirmed === 'function') {
            classConfirmModal.onConfirmed();
          }
          setClassConfirmModal(null);
        }}
      />

      {/* 3. Modal de Substituição de Matéria no Ciclo */}
      {replaceSubjectModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-4 fade-in font-sans"
            onClick={() => setReplaceSubjectModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-md w-full border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 dark:ring-sky-400/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      Trocar disciplina
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Escolha a nova matéria para este bloco
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplaceSubjectModal(null)}
                  aria-label="Fechar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.values(subjects || {}).map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        handleReplaceSubject(
                          replaceSubjectModal.dayIndex,
                          replaceSubjectModal.slotIndex,
                          replaceSubjectModal.oldSubjectId,
                          sub.id
                        );
                        setReplaceSubjectModal(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        sub.id === replaceSubjectModal.oldSubjectId
                          ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-500/10'
                          : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sub.color?.split(' ')[0] || 'bg-sky-500'}`} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {sub.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {sub.id === replaceSubjectModal.oldSubjectId ? 'Atual' : 'Selecionar'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setReplaceSubjectModal(null)}
                  className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Manter atual
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 4. Modal Global de Alertas e Confirmações */}
      {globalModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[120] p-3 sm:p-4 fade-in font-sans"
            onClick={() => setGlobalModal(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-sm w-full border border-slate-200/90 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5 flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ring-1 ${
                    globalModal.onConfirm
                      ? 'bg-red-500/10 ring-red-500/20 text-red-600 dark:text-red-400'
                      : globalModal.isAlert
                      ? 'bg-sky-500/10 ring-sky-500/20 text-sky-600 dark:text-sky-400'
                      : 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {globalModal.onConfirm ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : globalModal.isAlert ? (
                    <Info className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {globalModal.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {globalModal.message}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-end gap-2">
                {globalModal.onConfirm ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setGlobalModal(null)}
                      className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        globalModal.onConfirm();
                        setGlobalModal(null);
                      }}
                      className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGlobalModal(null)}
                    className="h-9 px-4 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Entendi
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 5. Modal de Celebração de Promoção */}
      <AnimatePresence>
        {promotionModal &&
          createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
              onClick={() => setPromotionModal(null)}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-7 max-w-sm w-full text-center shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04]"
              >
                <div className="mb-5 flex justify-center">
                  <RankBadge level={promotionModal.level || 1} size={104} />
                </div>

                <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1">Promoção de carreira</p>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                  {promotionModal.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Sua constância nos estudos elevou sua patente no QG da PRF. Continue firme na preparação.
                </p>

                <button
                  type="button"
                  onClick={() => setPromotionModal(null)}
                  className="w-full h-10 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Continuar
                </button>
              </motion.div>
            </div>,
            document.body
          )}
      </AnimatePresence>
    </>
  );
}
