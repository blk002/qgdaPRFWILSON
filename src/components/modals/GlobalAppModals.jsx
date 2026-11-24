import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit, Calendar as CalendarIcon, Crosshair, ListFilter, Skull,
  ArrowRight, Check, Repeat, AlertTriangle, Info, X
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

  const [reviewInputs, setReviewInputs] = useState({ total: 10, correct: 0 });
  const [dismissedPrePromptModalRef, setDismissedPrePromptModalRef] = useState(null);
  const [prePromptIndexText, setPrePromptIndexText] = useState('');
  const [prePromptQuestionStatus, setPrePromptQuestionStatus] = useState('not_resolved');
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
    setShowPrePromptIndexBox(false);
  }

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
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-[110] p-4 fade-in font-sans">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BrainCircuit className="text-sky-500 w-5 h-5" />
                      <span>Avaliar retenção</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{reviewModal.topicName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModal(null);
                      setReviewInputs({ total: 10, correct: 0 });
                    }}
                    aria-label="Fechar"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 mb-5">
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

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewModal(null);
                      setReviewInputs({ total: 10, correct: 0 });
                    }}
                    className="h-9 px-4 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
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
                    className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors disabled:opacity-50 cursor-pointer"
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
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-[120] p-4 fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-sky-500" />
                    <span>Praticar questões antes?</span>
                  </h3>
                  {subjects?.[classConfirmModal.subjectId]?.name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {subjects[classConfirmModal.subjectId].name}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setClassConfirmModal(null)}
                  aria-label="Fechar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Conteúdo:{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {classConfirmModal.lessonNames?.length
                    ? classConfirmModal.lessonNames.join(' · ')
                    : classConfirmModal.topicName}
                </strong>
                . Deseja abrir o Projeto Caveira com esse filtro antes de registrar a aula?
              </p>

              {/* Subassuntos do Índice da Aula */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ListFilter className="w-3.5 h-3.5 text-sky-500" />
                    {prePromptSubtopics.length > 0
                      ? `Índice (${prePromptSubtopics.length} subassuntos)`
                      : 'Índice da aula (opcional)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPrePromptIndexBox((v) => !v)}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {showPrePromptIndexBox ? 'Ocultar' : prePromptIndexText ? 'Editar índice' : 'Colar índice'}
                  </button>
                </div>

                {prePromptSubtopics.length > 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {prePromptSubtopics.slice(0, 6).join(' · ')}
                    {prePromptSubtopics.length > 6 ? ` · +${prePromptSubtopics.length - 6}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
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
                      className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 hover:bg-emerald-500/15 transition-colors w-full text-left truncate cursor-pointer"
                      title={courseIndexCache.latest.lessonTitle || ''}
                    >
                      Usar índice aberto no Caveira (
                      {courseIndexCache.latest.lessonTitle ||
                        `${courseIndexCache.latest.subtopics?.length || 0} tópicos`}
                      )
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
                    className="mt-2 w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-200 focus:border-sky-500 outline-none resize-y"
                  />
                )}
              </div>

              <div className="mb-4">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Filtro de status no Caveira
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'not_resolved', label: 'Não resolvidas' },
                    { value: 'wrong', label: 'Só erradas' },
                    { value: 'right', label: 'Só certas' },
                    { value: 'resolved', label: 'Resolvidas' },
                    { value: '', label: 'Todas' },
                  ].map((opt) => {
                    const active = prePromptQuestionStatus === opt.value;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setPrePromptQuestionStatus(opt.value)}
                        className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                          active
                            ? 'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
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
                      prePromptQuestionStatus
                    );
                    setClassConfirmModal(null);
                  }}
                  className="w-full h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                  className="w-full h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Continuar para confirmar aula</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClassConfirmModal(null)}
                  className="w-full h-9 px-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
            prePromptQuestionStatus
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
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-[110] p-4 fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Repeat className="text-sky-500 w-5 h-5" />
                  <span>Trocar disciplina</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setReplaceSubjectModal(null)}
                  aria-label="Fechar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
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
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      sub.id === replaceSubjectModal.oldSubjectId
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
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
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReplaceSubjectModal(null)}
                  className="h-9 px-4 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-[120] p-4 fade-in font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3.5 mb-4">
                <div
                  className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center ${
                    globalModal.onConfirm
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : globalModal.isAlert
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {globalModal.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {globalModal.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {globalModal.onConfirm ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setGlobalModal(null)}
                      className="h-9 px-4 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        globalModal.onConfirm();
                        setGlobalModal(null);
                      }}
                      className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setGlobalModal(null)}
                    className="h-9 px-4 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 max-w-sm w-full text-center shadow-2xl"
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
                  className="w-full h-10 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
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
