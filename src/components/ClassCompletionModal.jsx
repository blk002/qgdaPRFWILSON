import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  FastForward,
  Clock,
  Zap,
  Target,
  Calendar,
  Crosshair,
  ListFilter,
  X,
  Minus,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Coins
} from 'lucide-react';
import {
  parseDurationToSeconds,
  calculateSpeedComparison,
  formatSecondsToFriendly,
  calculateLessonsForGoal
} from '../lib/durationHelpers';
import { parseCourseIndexSubtopics } from '../lib/courseIndexParser';
import CaveiraDifficultySelector from './CaveiraDifficultySelector';
import {
  analyzeLessonFixationRequirement,
  INITIAL_FIXATION_TARGET,
} from '../lib/lessonMastery';

const shiftDateStr = (baseStr, offsetDays) => {
  const base =
    baseStr && /^\d{4}-\d{2}-\d{2}$/.test(baseStr)
      ? (() => {
          const [y, m, d] = baseStr.split('-').map(Number);
          return new Date(y, m - 1, d);
        })()
      : new Date();
  base.setDate(base.getDate() + offsetDays);
  const offset = base.getTimezoneOffset();
  return new Date(base.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

const formatShortBrDate = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

export default function ClassCompletionModal({
  isOpen,
  onClose,
  onConfirm,
  topicName,
  maxClasses,
  subjectSpeed = 1,
  lessonDuration = '',
  allLessonsDurations = [],
  suggestedClasses = null,
  timeGoalMinutes = null,
  initialStudyDate = null,
  todayDateStr = '',
  lessonNames = [],
  allRemainingLessonNames = [],
  initialIndexText = '',
  latestCapturedCourseIndex = null,
  onSaveLessonIndex = null,
  onPracticeQuestions = null,
  selectedDifficultyIds = [],
  onChangeDifficultyIds = null,
  difficultyRecommendation = null,
  subjectId = '',
  subjectName = '',
  topicObj = null,
  progressiveReviews = [],
  activePracticeMission = null,
  lessonFixationRequired = true,
  onStartFixationMission = null,
  onBypassFixation = null,
}) {
  void subjectName;
  const todayStr = todayDateStr || shiftDateStr('', 0);
  const yesterdayStr = shiftDateStr(todayStr, -1);
  const resolvedInitialDate =
    initialStudyDate && initialStudyDate <= todayStr ? initialStudyDate : todayStr;

  const initialCount = suggestedClasses ? Math.min(suggestedClasses, maxClasses) : 1;
  const [numClasses, setNumClasses] = useState(initialCount);
  const [speed, setSpeed] = useState(Number(subjectSpeed) || 1);
  const [studyDate, setStudyDate] = useState(resolvedInitialDate);
  const [indexText, setIndexText] = useState(initialIndexText || '');
  const [showIndexEditor, setShowIndexEditor] = useState(Boolean(initialIndexText));
  const [confirmBypass, setConfirmBypass] = useState(false);
  const [prevProps, setPrevProps] = useState({
    subjectSpeed,
    suggestedClasses,
    maxClasses,
    resolvedInitialDate,
    topicName,
    initialIndexText,
    isOpen
  });

  if (
    prevProps.subjectSpeed !== subjectSpeed ||
    prevProps.suggestedClasses !== suggestedClasses ||
    prevProps.maxClasses !== maxClasses ||
    prevProps.resolvedInitialDate !== resolvedInitialDate ||
    prevProps.topicName !== topicName ||
    prevProps.isOpen !== isOpen
  ) {
    setPrevProps({
      subjectSpeed,
      suggestedClasses,
      maxClasses,
      resolvedInitialDate,
      topicName,
      initialIndexText,
      isOpen
    });
    setSpeed(Number(subjectSpeed) || 1);
    setNumClasses(suggestedClasses ? Math.min(suggestedClasses, maxClasses) : 1);
    setStudyDate(resolvedInitialDate);
    setIndexText(initialIndexText || '');
    setShowIndexEditor(Boolean(initialIndexText));
    setConfirmBypass(false);
  } else if (prevProps.initialIndexText !== initialIndexText && !indexText && initialIndexText) {
    setPrevProps({ ...prevProps, initialIndexText });
    setIndexText(initialIndexText);
    setShowIndexEditor(true);
  }

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const currentNum = Math.max(1, Number(numClasses) || 1);
  const activeLessons = useMemo(() => {
    const rem =
      Array.isArray(allRemainingLessonNames) && allRemainingLessonNames.length > 0
        ? allRemainingLessonNames
        : Array.isArray(lessonNames)
          ? lessonNames
          : [];
    return rem.slice(0, currentNum).filter(Boolean);
  }, [allRemainingLessonNames, lessonNames, currentNum]);

  const parsedSubtopics = useMemo(
    () => parseCourseIndexSubtopics(indexText, [topicName, ...activeLessons]),
    [indexText, topicName, activeLessons]
  );

  const fixationAnalysis = useMemo(
    () =>
      analyzeLessonFixationRequirement(
        topicObj,
        topicObj?.completed || 0,
        currentNum,
        progressiveReviews,
        subjectId
      ),
    [topicObj, currentNum, progressiveReviews, subjectId]
  );

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (timeGoalMinutes && allLessonsDurations && allLessonsDurations.length > 0) {
      const recalculated = calculateLessonsForGoal(
        allLessonsDurations,
        0,
        newSpeed,
        timeGoalMinutes,
        maxClasses
      );
      if (recalculated?.count) {
        setNumClasses(Math.min(recalculated.count, maxClasses));
      }
    }
  };

  if (!isOpen) return null;

  const speeds = [1, 1.25, 1.5, 1.75, 2];

  let totalOriginalSec = 0;
  if (allLessonsDurations && allLessonsDurations.length > 0) {
    for (let i = 0; i < currentNum; i++) {
      const dur = allLessonsDurations[i];
      const sec = parseDurationToSeconds(dur);
      totalOriginalSec += sec > 0 ? sec : 3600;
    }
  } else if (lessonDuration) {
    const sec = parseDurationToSeconds(lessonDuration);
    totalOriginalSec = (sec > 0 ? sec : 3600) * currentNum;
  } else {
    totalOriginalSec = 3600 * currentNum;
  }

  const comparison = calculateSpeedComparison(totalOriginalSec, speed);
  const goalSec = timeGoalMinutes ? timeGoalMinutes * 60 : 0;
  const overGoal = goalSec > 0 && comparison.acceleratedSeconds > goalSec;
  const isRetroactive = studyDate < todayStr;
  const shortSelectedDate = formatShortBrDate(studyDate);
  const mustFixate = Boolean(
    lessonFixationRequired &&
      !isRetroactive &&
      fixationAnalysis.requiresFixation &&
      typeof onStartFixationMission === 'function'
  );
  const activeMissionMatchesThisLesson = Boolean(
    activePracticeMission &&
      activePracticeMission.status === 'active' &&
      activePracticeMission.type === 'lesson_fixation' &&
      activePracticeMission.subjectId === subjectId &&
      activePracticeMission.topicName === topicName
  );
  const activeMissionCount = Array.isArray(activePracticeMission?.answeredQuestionIds)
    ? activePracticeMission.answeredQuestionIds.length
    : 0;

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-4 fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-completion-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-2xl w-full text-left border border-slate-200/90 dark:border-slate-800 relative max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Cabeçalho unificado */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 dark:ring-sky-400/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div className="min-w-0">
              <h3
                id="class-completion-title"
                className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug"
              >
                Confirmar aula assistida
              </h3>
              <p
                className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate"
                title={topicName}
              >
                {topicName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com rolagem */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {lessonFixationRequired && !isRetroactive && fixationAnalysis.isIntermediatePartOnly && fixationAnalysis.intermediateInfo && (
            <div className="px-3.5 py-2.5 rounded-xl border bg-sky-50/70 dark:bg-sky-500/[0.08] border-sky-200/80 dark:border-sky-500/25 flex items-start gap-2.5 text-xs text-sky-800 dark:text-sky-200">
              <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Parte {fixationAnalysis.intermediateInfo.currentPart} de {fixationAnalysis.intermediateInfo.totalParts} detectada
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Você pode concluir esta parte normalmente. A fixação obrigatória de {INITIAL_FIXATION_TARGET} questões (Muito fácil) será cobrada apenas ao concluir a última parte.
                </p>
              </div>
            </div>
          )}

          {mustFixate && (
            <div className="px-3.5 py-2.5 rounded-xl border bg-amber-50/75 dark:bg-amber-500/[0.08] border-amber-200/80 dark:border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <Target className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  1ª conclusão: Fixação obrigatória ({INITIAL_FIXATION_TARGET}q · Muito fácil)
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {activeMissionMatchesThisLesson
                    ? `Missão em andamento: ${activeMissionCount}/${INITIAL_FIXATION_TARGET} questões respondidas. Complete no Caveira para concluir a aula automaticamente.`
                    : `Responda ${INITIAL_FIXATION_TARGET} questões no nível Muito fácil para concluir a aula automaticamente e agendar a 1ª revisão (Fácil · 5q).`}
                </p>
              </div>
            </div>
          )}

          {/* Banner de meta por bloco */}
          {timeGoalMinutes && suggestedClasses && (
            <div
              className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-3 ${
                overGoal
                  ? 'bg-amber-50/70 dark:bg-amber-500/[0.08] border-amber-200/80 dark:border-amber-500/25'
                  : 'bg-emerald-50/70 dark:bg-emerald-500/[0.08] border-emerald-200/80 dark:border-emerald-500/25'
              }`}
            >
              {overGoal ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold ${
                    overGoal
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  Meta do bloco:{' '}
                  <span className="font-mono tabular-nums">
                    {timeGoalMinutes >= 60
                      ? `${Math.floor(timeGoalMinutes / 60)}h${timeGoalMinutes % 60 > 0 ? ` ${timeGoalMinutes % 60}m` : ''}`
                      : `${timeGoalMinutes}m`}
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">
                  {overGoal
                    ? `${currentNum} ${currentNum > 1 ? 'aulas ultrapassam' : 'aula ultrapassa'} a meta. Sugestão: ${suggestedClasses} ${suggestedClasses > 1 ? 'aulas' : 'aula'}.`
                    : `${suggestedClasses} ${suggestedClasses > 1 ? 'aulas cabem' : 'aula cabe'} na sua meta de tempo.`}
                </p>
              </div>
              {currentNum !== suggestedClasses && (
                <button
                  type="button"
                  onClick={() => setNumClasses(Math.min(suggestedClasses, maxClasses))}
                  className="shrink-0 h-7 px-2.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors cursor-pointer"
                >
                  Usar {suggestedClasses}
                </button>
              )}
            </div>
          )}

          {/* Grid principal em 2 colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            {/* Coluna Esquerda: Quantidade + Data */}
            <div className="space-y-3.5 min-w-0">
              {/* Quantidade de aulas */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Quantidade de aulas
                  </span>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentNum <= 1}
                      onClick={() => setNumClasses(Math.max(1, currentNum - 1))}
                      aria-label="Diminuir quantidade"
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxClasses}
                      value={numClasses}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setNumClasses('');
                        } else {
                          const n = parseInt(val, 10);
                          if (!isNaN(n)) {
                            setNumClasses(Math.max(1, Math.min(maxClasses, n)));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (numClasses === '') setNumClasses(1);
                      }}
                      className="w-12 h-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-sm font-mono font-bold text-sky-600 dark:text-sky-400 focus:border-sky-500 outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      disabled={currentNum >= maxClasses}
                      onClick={() => setNumClasses(Math.min(maxClasses, currentNum + 1))}
                      aria-label="Aumentar quantidade"
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {maxClasses > 1 && (
                  <input
                    type="range"
                    min="1"
                    max={maxClasses}
                    value={currentNum}
                    onChange={(e) => setNumClasses(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500"
                  />
                )}

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">XP</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{currentNum * 100}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-xs border-l border-slate-200/70 dark:border-slate-800">
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400">Moedas</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      +{currentNum * 10}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data do estudo */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>Data do estudo</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                    {studyDate === todayStr
                      ? 'Hoje'
                      : studyDate === yesterdayStr
                        ? 'Ontem'
                        : shortSelectedDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStudyDate(todayStr)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      studyDate === todayStr
                        ? 'bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 border-sky-600 dark:border-sky-500 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    Hoje ({formatShortBrDate(todayStr)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyDate(yesterdayStr)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      studyDate === yesterdayStr
                        ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 border-amber-600 dark:border-amber-500 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    Ontem ({formatShortBrDate(yesterdayStr)})
                  </button>
                </div>

                <input
                  type="date"
                  max={todayStr}
                  value={studyDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val <= todayStr) setStudyDate(val);
                  }}
                  aria-label="Escolher outra data"
                  className="w-full h-9 px-3 rounded-lg text-xs font-mono font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 transition-colors"
                />

                {isRetroactive && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/25 rounded-lg px-2.5 py-1.5 leading-snug">
                    Registro em <strong className="font-semibold">{shortSelectedDate}</strong>: os minutos entram nessa data e hoje permanece livre.
                  </p>
                )}
              </div>
            </div>

            {/* Coluna Direita: Velocidade + Bizus */}
            <div className="space-y-3.5 min-w-0">
              {/* Velocidade de reprodução */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FastForward className="w-3.5 h-3.5 text-sky-500" />
                    <span>Velocidade do vídeo</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {speed}x
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className={`h-8 rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer border ${
                        speed === s
                          ? 'bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 border-sky-600 dark:border-sky-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Comparativo de duração */}
                <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duração real (1x)</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {comparison.originalFriendly}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>Tempo efetivo ({speed}x)</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {comparison.acceleratedFriendly}
                    </span>
                  </div>

                  {goalSec > 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                      <span
                        className={`font-medium flex items-center gap-1 ${
                          overGoal
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <Target className="w-3 h-3" />
                        <span>{overGoal ? 'Acima da meta' : 'Dentro da meta'}</span>
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          overGoal
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatSecondsToFriendly(goalSec)}
                        {overGoal ? ` (+${formatSecondsToFriendly(comparison.acceleratedSeconds - goalSec)})` : ''}
                      </span>
                    </div>
                  )}

                  {speed > 1 && (
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Economia de tempo
                      </span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        -{comparison.savedFriendly} ({comparison.percentSaved}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bizus / Subassuntos da aula */}
              {typeof onPracticeQuestions === 'function' && (
                <div className="bg-slate-50/80 dark:bg-slate-950/55 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 min-w-0 truncate">
                      <ListFilter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">
                        Índice da aula{parsedSubtopics.length > 0 ? ` (${parsedSubtopics.length})` : ''}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIndexEditor((v) => !v)}
                      className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline shrink-0 cursor-pointer"
                    >
                      {showIndexEditor ? 'Ocultar' : 'Colar índice'}
                    </button>
                  </div>

                  {parsedSubtopics.length > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {parsedSubtopics.slice(0, 6).join(' · ')}
                      {parsedSubtopics.length > 6 ? ` · +${parsedSubtopics.length - 6}` : ''}
                    </p>
                  )}

                  {showIndexEditor && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={2}
                        value={indexText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIndexText(val);
                          if (typeof onSaveLessonIndex === 'function') {
                            onSaveLessonIndex(val, activeLessons[0] || topicName);
                          }
                        }}
                        placeholder="Cole aqui os subassuntos da aba Índice/Bizus da aula..."
                        className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-700 dark:text-slate-200 focus:border-sky-500 outline-none resize-y"
                      />
                      {latestCapturedCourseIndex?.rawIndexText &&
                        latestCapturedCourseIndex.rawIndexText !== indexText && (
                          <button
                            type="button"
                            onClick={() => {
                              const captured = latestCapturedCourseIndex.rawIndexText;
                              setIndexText(captured);
                              if (typeof onSaveLessonIndex === 'function') {
                                onSaveLessonIndex(captured, activeLessons[0] || topicName);
                              }
                            }}
                            className="w-full text-left truncate text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 hover:bg-emerald-500/15 transition-colors cursor-pointer"
                          >
                            Usar índice capturado ({latestCapturedCourseIndex.lessonTitle || 'Aula aberta'})
                          </button>
                        )}
                    </div>
                  )}

                  {typeof onChangeDifficultyIds === 'function' && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/80 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Nível (Caveira)
                      </div>
                      <CaveiraDifficultySelector
                        compact
                        selectedIds={selectedDifficultyIds}
                        onChangeIds={onChangeDifficultyIds}
                        recommendation={difficultyRecommendation}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé unificado */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          {typeof onPracticeQuestions === 'function' ? (
            <button
              type="button"
              onClick={() => onPracticeQuestions(currentNum, parsedSubtopics, indexText)}
              className="h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="truncate">
                {parsedSubtopics.length > 0
                  ? `Questões (${parsedSubtopics.length} tópicos)`
                  : 'Praticar no Caveira'}
              </span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2 flex-wrap">
            {mustFixate && typeof onBypassFixation === 'function' && (
              confirmBypass ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmBypass(false);
                    onBypassFixation(currentNum, speed, studyDate, parsedSubtopics, indexText, fixationAnalysis);
                  }}
                  className="h-10 px-3 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                >
                  Confirmar sem fixação
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmBypass(true)}
                  title="Use apenas se não houver questões suficientes no banco"
                  className="h-10 px-3 rounded-xl text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Sem questões? Concluir
                </button>
              )
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            {mustFixate ? (
              <button
                type="button"
                onClick={() => onStartFixationMission(currentNum, speed, studyDate, parsedSubtopics, indexText, fixationAnalysis)}
                disabled={!numClasses}
                className="h-10 px-4 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>
                  {activeMissionMatchesThisLesson
                    ? `Continuar Fixação (${activeMissionCount}/${INITIAL_FIXATION_TARGET})`
                    : `Iniciar Fixação (${INITIAL_FIXATION_TARGET}q · Muito fácil)`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onConfirm(currentNum, speed, studyDate)}
                disabled={!numClasses}
                className="h-10 px-4 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <span>
                  Confirmar {currentNum} {currentNum === 1 ? 'aula' : 'aulas'}
                </span>
                <span className="font-mono opacity-85">
                  · {comparison.acceleratedFriendly}
                  {isRetroactive ? ` (${shortSelectedDate})` : ''}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}