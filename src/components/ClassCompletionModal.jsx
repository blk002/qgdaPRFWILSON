import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Play, FastForward, Clock, Zap, Target, Calendar, Crosshair, ListFilter } from 'lucide-react';
import { parseDurationToSeconds, calculateSpeedComparison, formatSecondsToFriendly, calculateLessonsForGoal } from '../lib/durationHelpers';
import { parseCourseIndexSubtopics } from '../lib/courseIndexParser';

const shiftDateStr = (baseStr, offsetDays) => {
  const base = baseStr && /^\d{4}-\d{2}-\d{2}$/.test(baseStr)
    ? (() => { const [y, m, d] = baseStr.split('-').map(Number); return new Date(y, m - 1, d); })()
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
  onPracticeQuestions = null
}) {
  const todayStr = todayDateStr || shiftDateStr('', 0);
  const yesterdayStr = shiftDateStr(todayStr, -1);
  const resolvedInitialDate = (initialStudyDate && initialStudyDate <= todayStr) ? initialStudyDate : todayStr;

  const initialCount = suggestedClasses ? Math.min(suggestedClasses, maxClasses) : 1;
  const [numClasses, setNumClasses] = useState(initialCount);
  const [speed, setSpeed] = useState(Number(subjectSpeed) || 1);
  const [studyDate, setStudyDate] = useState(resolvedInitialDate);
  const [indexText, setIndexText] = useState(initialIndexText || '');
  const [showIndexEditor, setShowIndexEditor] = useState(Boolean(initialIndexText));
  const [prevProps, setPrevProps] = useState({ subjectSpeed, suggestedClasses, maxClasses, resolvedInitialDate, topicName, initialIndexText, isOpen });

  // Padrão oficial React 19: ajusta o estado durante a renderização quando props mudam, sem causar cascading render
  if (
    prevProps.subjectSpeed !== subjectSpeed ||
    prevProps.suggestedClasses !== suggestedClasses ||
    prevProps.maxClasses !== maxClasses ||
    prevProps.resolvedInitialDate !== resolvedInitialDate ||
    prevProps.topicName !== topicName ||
    prevProps.isOpen !== isOpen
  ) {
    setPrevProps({ subjectSpeed, suggestedClasses, maxClasses, resolvedInitialDate, topicName, initialIndexText, isOpen });
    setSpeed(Number(subjectSpeed) || 1);
    setNumClasses(suggestedClasses ? Math.min(suggestedClasses, maxClasses) : 1);
    setStudyDate(resolvedInitialDate);
    setIndexText(initialIndexText || '');
    setShowIndexEditor(Boolean(initialIndexText));
  } else if (prevProps.initialIndexText !== initialIndexText && !indexText && initialIndexText) {
    setPrevProps({ ...prevProps, initialIndexText });
    setIndexText(initialIndexText);
    setShowIndexEditor(true);
  }

  const currentNum = Math.max(1, Number(numClasses) || 1);
  const activeLessons = useMemo(() => {
    const rem = Array.isArray(allRemainingLessonNames) && allRemainingLessonNames.length > 0
      ? allRemainingLessonNames
      : (Array.isArray(lessonNames) ? lessonNames : []);
    return rem.slice(0, currentNum).filter(Boolean);
  }, [allRemainingLessonNames, lessonNames, currentNum]);

  const parsedSubtopics = useMemo(
    () => parseCourseIndexSubtopics(indexText, [topicName, ...activeLessons]),
    [indexText, topicName, activeLessons]
  );

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (timeGoalMinutes && allLessonsDurations && allLessonsDurations.length > 0) {
      const recalculated = calculateLessonsForGoal(allLessonsDurations, 0, newSpeed, timeGoalMinutes, maxClasses);
      if (recalculated?.count) {
        setNumClasses(Math.min(recalculated.count, maxClasses));
      }
    }
  };

  if (!isOpen) return null;

  const speeds = [1, 1.25, 1.5, 1.75, 2];

  // Cálculo da duração total das aulas selecionadas
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

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[110] p-3 sm:p-4 fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-5 text-left border border-slate-200 dark:border-slate-800 relative max-h-[95vh] overflow-y-auto custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-teal-400 to-sky-500 opacity-70" />

        {/* Cabeçalho Horizontal Compacto */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center shrink-0">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-tight">
              Queimar Teoria?
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={topicName}>
              Matéria: {topicName}
            </p>
          </div>
        </div>

        {/* Banner de Meta por Bloco */}
        {timeGoalMinutes && suggestedClasses && (
          <div className={`mb-2.5 px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 ${
            overGoal
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
          }`}>
            <Target className={`w-4 h-4 shrink-0 ${overGoal ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider ${overGoal ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                Meta por Bloco: {timeGoalMinutes >= 60 ? `${Math.floor(timeGoalMinutes/60)}h${timeGoalMinutes%60>0?` ${timeGoalMinutes%60}m`:''}` : `${timeGoalMinutes}m`}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-snug">
                {overGoal
                  ? `⚠️ ${currentNum} aula${currentNum>1?'s':''} ultrapassa a meta. Sugestão: ${suggestedClasses} aula${suggestedClasses>1?'s':''}.`
                  : `✅ ${suggestedClasses} aula${suggestedClasses>1?'s':''} cabem perfeitamente na sua meta de tempo.`
                }
              </p>
            </div>
            {currentNum !== suggestedClasses && (
              <button
                type="button"
                onClick={() => setNumClasses(Math.min(suggestedClasses, maxClasses))}
                className="shrink-0 text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800 px-2 py-1 rounded-lg hover:bg-sky-200 dark:hover:bg-sky-900 transition-colors uppercase cursor-pointer"
              >
                Usar {suggestedClasses}
              </button>
            )}
          </div>
        )}

        {/* Corpo em Grid de 2 Colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 items-start">
          {/* Coluna Esquerda: Quantidade + Data */}
          <div className="flex flex-col gap-2.5 min-w-0">
            {/* Quantidade de Aulas */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Quantidade de Aulas</span>
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
                      const n = parseInt(val);
                      if (!isNaN(n)) {
                        setNumClasses(Math.max(1, Math.min(maxClasses, n)));
                      }
                    }
                  }}
                  onBlur={() => {
                    if (numClasses === '') setNumClasses(1);
                  }}
                  className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-0.5 px-2 text-center text-sm font-black text-sky-600 dark:text-sky-400 focus:border-sky-500 outline-none transition-all tabular-nums"
                />
              </div>
              
              <input 
                type="range" 
                min="1" 
                max={maxClasses} 
                value={currentNum}
                onChange={(e) => setNumClasses(parseInt(e.target.value) || 1)}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500 mb-2.5"
              />

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase">XP:</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">+{currentNum * 100}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Moedas:</span>
                  <span className="text-xs font-black text-amber-500 dark:text-amber-400 tabular-nums">+{currentNum * 10}</span>
                </div>
              </div>
            </div>

            {/* Data do Estudo (Hoje, Ontem ou Data Retroativa) */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" /> Quando estudou?
                </span>
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400">
                  {studyDate === todayStr ? 'Hoje' : studyDate === yesterdayStr ? 'Ontem' : shortSelectedDate}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => setStudyDate(todayStr)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    studyDate === todayStr
                      ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  Hoje ({formatShortBrDate(todayStr)})
                </button>
                <button
                  type="button"
                  onClick={() => setStudyDate(yesterdayStr)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    studyDate === yesterdayStr
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
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
                className="w-full py-1 px-2.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500"
              />
              {isRetroactive && (
                <p className="mt-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-lg px-2 py-1 leading-snug">
                  Registro em <strong>{shortSelectedDate}</strong>: os minutos entram nessa data e hoje segue livre.
                </p>
              )}
            </div>
          </div>

          {/* Coluna Direita: Velocidade + Bizus */}
          <div className="flex flex-col gap-2.5 min-w-0">
            {/* Velocidade de Reprodução */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <FastForward className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Velocidade do Vídeo</span>
                </div>
                <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 rounded-full">
                  {speed}x
                </span>
              </div>

              <div className="flex justify-center gap-1 mb-2.5">
                {speeds.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedChange(s)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      speed === s 
                        ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400' 
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Comparativo de Tempo com e sem Aceleração */}
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 text-left space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Sem Aceleração (1x):
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {comparison.originalFriendly}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-sky-600 dark:text-sky-400 font-black flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> Com Aceleração ({speed}x):
                  </span>
                  <span className="font-mono font-black text-sky-600 dark:text-sky-400">
                    {comparison.acceleratedFriendly}
                  </span>
                </div>

                {goalSec > 0 && (
                  <div className="pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className={`font-extrabold uppercase tracking-tight ${overGoal ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {overGoal ? '⚠️ Acima da meta:' : '🎯 Meta do bloco:'}
                    </span>
                    <span className={`font-black ${overGoal ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatSecondsToFriendly(goalSec)} {overGoal ? `(+${formatSecondsToFriendly(comparison.acceleratedSeconds - goalSec)})` : '✓'}
                    </span>
                  </div>
                )}

                {speed > 1 && (
                  <div className="pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-tight">
                      🚀 Economia Real:
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      -{comparison.savedFriendly} ({comparison.percentSaved}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bizus / Assuntos da Aula para Filtro Detalhado */}
            {typeof onPracticeQuestions === 'function' && (
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5 min-w-0 truncate">
                    <ListFilter className="w-3.5 h-3.5 text-orange-500 shrink-0" /> Bizus ({parsedSubtopics.length} subassuntos)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIndexEditor(v => !v)}
                    className="text-[10px] font-black text-sky-600 dark:text-sky-400 hover:underline uppercase shrink-0 cursor-pointer"
                  >
                    {showIndexEditor ? 'Ocultar' : 'Colar Bizus'}
                  </button>
                </div>

                {parsedSubtopics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {parsedSubtopics.slice(0, 6).map((sub, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20"
                      >
                        {sub}
                      </span>
                    ))}
                    {parsedSubtopics.length > 6 && (
                      <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">
                        +{parsedSubtopics.length - 6}
                      </span>
                    )}
                  </div>
                )}

                {showIndexEditor && (
                  <div className="space-y-1.5 mt-2">
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
                      placeholder="Cole aqui os assuntos da aba Bizus da aula..."
                      className="w-full text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-700 dark:text-slate-200 focus:border-orange-500 outline-none resize-y"
                    />
                    {latestCapturedCourseIndex?.rawIndexText && latestCapturedCourseIndex.rawIndexText !== indexText && (
                      <button
                        type="button"
                        onClick={() => {
                          const captured = latestCapturedCourseIndex.rawIndexText;
                          setIndexText(captured);
                          if (typeof onSaveLessonIndex === 'function') {
                            onSaveLessonIndex(captured, activeLessons[0] || topicName);
                          }
                        }}
                        className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2 py-1 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        ⚡ Usar Bizus capturados ({latestCapturedCourseIndex.lessonTitle || 'Aula aberta'})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex flex-col gap-2">
          {typeof onPracticeQuestions === 'function' && (
            <button
              type="button"
              onClick={() => onPracticeQuestions(currentNum, parsedSubtopics, indexText)}
              className="w-full py-2 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-black rounded-xl transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 shrink-0" />
              <span>
                {parsedSubtopics.length > 0
                  ? `Ir para Questões (${parsedSubtopics.length} subassuntos)`
                  : 'Ir para Questões desta(s) Aula(s) no Caveira'}
              </span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors uppercase text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onConfirm(currentNum, speed, studyDate)}
              disabled={!numClasses}
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              CONFIRMAR {currentNum} {currentNum === 1 ? 'AULA' : 'AULAS'} ({comparison.acceleratedFriendly}){isRetroactive ? ` • ${shortSelectedDate}` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}