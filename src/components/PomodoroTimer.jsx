import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';

export default function PomodoroTimer() {
  const { addStudyMinutes, enableSounds } = useStore();
  const [mode, setMode] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(25);

  const timerRef = useRef(null);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    addStudyMinutes(sessionMinutes);

    if (enableSounds) {
      const audio = new Audio(`${import.meta.env.BASE_URL}sounds/level-up.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignora falha de auto-play / arquivo ausente
    }

    toast.success(`Sessão de ${sessionMinutes}m concluída! XP contabilizado no histórico diário.`);
    setTimeLeft(mode * 60);
  }, [addStudyMinutes, sessionMinutes, enableSounds, mode]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused, handleComplete]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  const handlePause = () => setIsPaused(true);

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(mode * 60);
  };



  const changeMode = (mins) => {
    setMode(mins);
    setSessionMinutes(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
    setIsPaused(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((sessionMinutes * 60 - timeLeft) / (sessionMinutes * 60)) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 mb-6 w-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
        
        {/* Lado Esquerdo - Título e Controles de Modo */}
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-500" /> Pomodoro Tático
          </h3>
          <div className="flex gap-2">
            {[25, 50, 90].map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                disabled={isRunning}
                className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all ${
                  mode === m 
                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400' 
                    : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50'
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>

        {/* Centro - O Timer Real */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" fill="transparent" />
              <circle 
                cx="50" cy="50" r="45" 
                className="stroke-rose-500 transition-all duration-1000 ease-linear" 
                strokeWidth="6" fill="transparent" 
                strokeDasharray="282.7"
                strokeDashoffset={282.7 - (282.7 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-2xl font-black text-slate-800 dark:text-white tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Lado Direito - Controles Play/Pause */}
        <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
          {(!isRunning || isPaused) ? (
            <button 
              onClick={handleStart}
              className="flex-1 sm:flex-none w-32 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-3 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4" fill="currentColor" /> {isPaused ? 'Retomar' : 'Iniciar'}
            </button>
          ) : (
            <button 
              onClick={handlePause}
              className="flex-1 sm:flex-none w-32 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-5 py-3 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Pause className="w-4 h-4" fill="currentColor" /> Pausar
            </button>
          )}
          
          <button 
            onClick={handleStop}
            disabled={!isRunning && timeLeft === mode * 60}
            className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
