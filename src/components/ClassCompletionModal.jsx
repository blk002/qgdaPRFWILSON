import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, FastForward, Clock, Zap, Target, Calendar } from 'lucide-react';
import { parseDurationToSeconds, calculateSpeedComparison, formatSecondsToFriendly, calculateLessonsForGoal } from '../lib/durationHelpers';

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
  todayDateStr = ''
}) {
  const todayStr = todayDateStr || shiftDateStr('', 0);
  const yesterdayStr = shiftDateStr(todayStr, -1);
  const resolvedInitialDate = (initialStudyDate && initialStudyDate <= todayStr) ? initialStudyDate : todayStr;

  const initialCount = suggestedClasses ? Math.min(suggestedClasses, maxClasses) : 1;
  const [numClasses, setNumClasses] = useState(initialCount);
  const [speed, setSpeed] = useState(Number(subjectSpeed) || 1);
  const [studyDate, setStudyDate] = useState(resolvedInitialDate);
  const [prevProps, setPrevProps] = useState({ subjectSpeed, suggestedClasses, maxClasses, resolvedInitialDate });

  // Padrão oficial React 19: ajusta o estado durante a renderização quando props mudam, sem causar cascading render
  if (
    prevProps.subjectSpeed !== subjectSpeed ||
    prevProps.suggestedClasses !== suggestedClasses ||
    prevProps.maxClasses !== maxClasses ||
    prevProps.resolvedInitialDate !== resolvedInitialDate
  ) {
    setPrevProps({ subjectSpeed, suggestedClasses, maxClasses, resolvedInitialDate });
    setSpeed(Number(subjectSpeed) || 1);
    setNumClasses(suggestedClasses ? Math.min(suggestedClasses, maxClasses) : 1);
    setStudyDate(resolvedInitialDate);
  }

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

  const currentNum = Math.max(1, Number(numClasses) || 1);
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
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4 fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 text-center border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-50"></div>
        
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner">
          <Play className="w-7 h-7 fill-current ml-0.5" />
        </div>
        
        <h3 className="text-xl font-black mb-1 text-slate-800 dark:text-slate-100 tracking-tight uppercase">Queimar Teoria?</h3>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 truncate px-2" title={topicName}>
          Matéria: {topicName}
        </p>

        {/* Banner de Meta por Bloco */}
        {timeGoalMinutes && suggestedClasses && (
          <div className={`mb-4 p-3 rounded-xl border text-left flex items-start gap-2.5 ${
            overGoal
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
          }`}>
            <Target className={`w-4 h-4 mt-0.5 shrink-0 ${overGoal ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div className="flex-1">
              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${overGoal ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
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
                onClick={() => setNumClasses(Math.min(suggestedClasses, maxClasses))}
                className="shrink-0 text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors uppercase"
              >
                Usar {suggestedClasses}
              </button>
            )}
          </div>
        )}

        {/* Quantidade de Aulas */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase">Quantidade de Aulas</span>
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
              className="w-16 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-center font-black text-blue-600 dark:text-blue-400 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <input 
            type="range" 
            min="1" 
            max={maxClasses} 
            value={currentNum}
            onChange={(e) => setNumClasses(parseInt(e.target.value) || 1)}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600 mb-4"
          />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase">Ganho Total XP</span>
              <span className="text-sm font-black text-emerald-600">+{currentNum * 100}</span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[8px] font-black text-slate-400 uppercase">Moedas Totais</span>
               <span className="text-sm font-black text-yellow-500">+{currentNum * 10}</span>
            </div>
          </div>
        </div>

        {/* Velocidade de Reprodução */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <FastForward className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Velocidade do Vídeo</span>
            </div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
              {speed}x
            </span>
          </div>

          <div className="flex justify-center gap-1.5 mb-3">
            {speeds.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeedChange(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                  speed === s 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Comparativo de Tempo com e sem Aceleração */}
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Sem Aceleração (1x):
              </span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {comparison.originalFriendly}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-blue-600 dark:text-blue-400 font-black flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Com Aceleração ({speed}x):
              </span>
              <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                {comparison.acceleratedFriendly}
              </span>
            </div>

            {/* Indicador visual se ultrapassou a meta */}
            {goalSec > 0 && (
              <div className={`mt-1.5 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]`}>
                <span className={`font-extrabold uppercase tracking-tight ${overGoal ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {overGoal ? '⚠️ Acima da meta:' : '🎯 Meta do bloco:'}
                </span>
                <span className={`font-black ${overGoal ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatSecondsToFriendly(goalSec)} {overGoal ? `(+${formatSecondsToFriendly(comparison.acceleratedSeconds - goalSec)})` : '✓'}
                </span>
              </div>
            )}

            {speed > 1 && (
              <div className="mt-1.5 pt-1 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
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

        {/* Data do Estudo (Hoje, Ontem ou Data Retroativa) */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Quando você estudou?
            </span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">
              {studyDate === todayStr ? 'Hoje' : studyDate === yesterdayStr ? 'Ontem' : shortSelectedDate}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setStudyDate(todayStr)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all ${
                studyDate === todayStr
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              Hoje ({formatShortBrDate(todayStr)})
            </button>
            <button
              type="button"
              onClick={() => setStudyDate(yesterdayStr)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all ${
                studyDate === yesterdayStr
                  ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              Ontem ({formatShortBrDate(yesterdayStr)})
            </button>
            <input
              type="date"
              max={todayStr}
              value={studyDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val <= todayStr) setStudyDate(val);
              }}
              aria-label="Escolher outra data"
              className="py-1 px-1.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
          {isRetroactive && (
            <p className="mt-2 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-lg px-2.5 py-1.5 leading-snug">
              Registro em <strong>{shortSelectedDate}</strong>: os minutos e a revisão FSRS serão contados a partir dessa data, e o bloco de hoje continuará livre para as próximas aulas.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <button 
            onClick={() => onConfirm(currentNum, speed, studyDate)}
            disabled={!numClasses}
            className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            CONFIRMAR {currentNum} {currentNum === 1 ? 'AULA' : 'AULAS'} ({comparison.acceleratedFriendly}){isRetroactive ? ` • ${shortSelectedDate}` : ''}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}