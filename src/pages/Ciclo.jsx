import { useStore } from '../store/useStore';
import { Target, AlertTriangle, Activity, Trophy, ChevronRight, Flame, Layers, PlayCircle, BrainCircuit, Shuffle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function Ciclo() {
  const navigate = useNavigate();
  const {
    getPendingReviews,
    subjects,
    getThermometer,
    completedToday,
    setCompletedToday,
    cycle,
    currentDayIndex,
    advanceDay,
    getSubjectProgress,
    getRelativeDateInfo,
    getActiveTopic,
    reviews,
    setReviewModal,
    setClassConfirmModal,
    setReplaceSubjectModal
  } = useStore();
  const pendingReviews = getPendingReviews().slice(0, 4);

  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const canvasRef = useRef(null);
  const prevCompletedLength = useRef(completedToday.length);

  useEffect(() => {
    const totalSlots = cycle[currentDayIndex]?.length || 0;
    if (completedToday.length === totalSlots && totalSlots > 0 && prevCompletedLength.current < totalSlots) {
      setTimeout(() => {
        setTriggerConfetti(true);
      }, 0);
    }
    prevCompletedLength.current = completedToday.length;
  }, [completedToday.length, cycle, currentDayIndex]);

  useEffect(() => {
    if (!triggerConfetti) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    let startTime = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r/3) * 15;

        if (p.y <= canvas.height) {
          active = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active && Date.now() - startTime < 2500) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        setTriggerConfetti(false);
      }
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [triggerConfetti]);
  return (
    <div className="fade-in pb-10 max-w-[1400px] px-2 sm:px-4 mx-auto">
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-blue-600 w-7 h-7" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight dark:text-slate-100">Conversor de Edital (Teoria ➔ Questões)</h2>
        </div>

        {pendingReviews.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-5 mb-6 shadow-sm relative overflow-hidden dark:bg-red-950/20 dark:border-red-900/50">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-200 rounded-bl-full opacity-50 pointer-events-none dark:bg-red-900/20"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
              <div>
                <h3 className="font-black text-red-800 flex items-center gap-2 text-lg dark:text-red-400">
                  <AlertTriangle className="w-5 h-5"/> Prioridade Zero: Blindar Memória
                </h3>
                <p className="text-xs text-red-600 mt-1 font-bold max-w-2xl dark:text-red-500/90">
                  A regra de ouro do alto rendimento: limpe a sua fila de revisões FSRS antes de absorver qualquer conteúdo novo. A sua aprovação não está no que estuda hoje, está no que não esquece amanhã.
                </p>
              </div>
              <div className="bg-red-600 text-white text-xs font-black px-4 py-2 rounded-lg whitespace-nowrap shadow-sm self-start sm:self-auto flex flex-col items-center leading-none">
                <span className="text-[10px] opacity-80 mb-0.5">CARTÕES FSRS</span>
                <span className="text-xl">{pendingReviews.length}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
              {pendingReviews.map(rev => {
                const sub = subjects[rev.subjectId];
                const thermo = getThermometer(rev.lastPerformance);
                
                return (
                  <div key={rev.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors dark:bg-slate-900">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase truncate max-w-[60%] ${sub?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {sub?.name}
                        </span>
                        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${thermo.color}`} title={thermo.label}>
                          {thermo.icon} {Math.round(rev.lastPerformance * 100 || 0)}%
                        </div>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-tight mb-2 line-clamp-2 dark:text-slate-100" title={rev.topicName}>{rev.topicName}</p>
                    </div>
                    <button onClick={() => { navigate('/revisoes'); setReviewModal(rev); }} className="mt-2 w-full py-1.5 bg-red-100 hover:bg-red-500 text-red-700 hover:text-white border border-red-200 rounded text-[11px] font-black transition-all flex items-center justify-center gap-1 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white">
                      <Activity className="w-3 h-3"/> Executar Revisão
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {completedToday.length === (cycle[currentDayIndex]?.length || 0) && completedToday.length > 0 && (
        <div className="bg-emerald-500 p-5 md:p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center justify-between gap-5 text-white fade-in border border-emerald-600">
          <div className="text-center md:text-left flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full dark:bg-slate-900"><Trophy className="text-yellow-300 w-8 h-8" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black">Meta Diária Batida!</h2>
              <p className="text-emerald-100 text-sm font-medium">Missão cumprida com excelência. Avance a fila tática quando estiver pronto para o próximo dia.</p>
            </div>
          </div>
          <button 
            onClick={advanceDay} 
            className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-black shadow-sm hover:bg-emerald-50 transition-colors w-full md:w-auto uppercase tracking-wider text-sm flex items-center justify-center gap-2 dark:bg-slate-900"
          >
            Avançar Ciclo <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      )}

      <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800 mb-8 overflow-hidden">
        <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Progresso de Conversão (Teoria ➔ FSRS)
          </h3>
          <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Queimar Teoria: {completedToday.length} / {cycle[currentDayIndex]?.length || 0} Slots
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 pt-2 snap-x">
          {Object.values(subjects).map(sub => {
            const progress = getSubjectProgress(sub.id);
            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;
            const isDone = progress === 100;

            return (
              <div key={sub.id} className={`min-w-[110px] sm:min-w-[120px] shrink-0 snap-start rounded-xl p-3 flex flex-col items-center justify-center gap-3 relative overflow-hidden transition-all shadow-sm border ${isDone ? 'bg-emerald-900/20 border-emerald-800/50 hover:border-emerald-600' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                
                {isDone && <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none"></div>}

                <div className="relative flex items-center justify-center group z-10">
                  <svg className="transform -rotate-90 w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md overflow-visible" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id={`grad-cycle-${sub.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isDone ? '#10b981' : '#c084fc'} />
                        <stop offset="100%" stopColor={isDone ? '#059669' : '#3b82f6'} />
                      </linearGradient>
                      <filter id={`glow-cycle-${sub.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                    <circle 
                      cx="50" cy="50" r={radius} 
                      stroke={`url(#grad-cycle-${sub.id})`} 
                      strokeWidth="8" fill="transparent" 
                      strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out origin-center" 
                      filter={`url(#glow-cycle-${sub.id})`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-[11px] sm:text-xs font-black ${isDone ? 'text-emerald-400' : 'text-white'}`}>{progress}%</span>
                  </div>
                </div>

                <div className="w-full text-center z-10">
                  <span className="text-[9px] font-bold text-slate-300 uppercase truncate block px-1" title={sub.name}>{sub.name}</span>
                </div>
                
              </div>
            );
          })}
        </div>
      </div>

      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Layers className="w-4 h-4" /> Fila de Conteúdo Novo / Avanço
      </h3>

      <div id="cycle-scroll-container" className="overflow-x-auto pt-2 pb-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2.5 sm:gap-4 items-stretch w-full">
          {cycle.length > 0 && cycle.map((daySubjects, dayIndex) => {
            const dateInfo = getRelativeDateInfo(dayIndex);
            const isToday = dateInfo.isToday;
            
            return (
              <div id={`cycle-day-${dayIndex}`} key={dayIndex} className={`flex-1 min-w-[260px] sm:min-w-0 flex flex-col rounded-2xl border-2 transition-all mt-2 ${
                  isToday ? 'border-blue-500 bg-slate-50 shadow-lg ring-4 ring-blue-50 relative dark:bg-slate-900 dark:border-blue-600 dark:ring-blue-900/20' : 'border-slate-200 bg-white opacity-70 hover:opacity-100 scale-[0.98] hover:scale-100 dark:border-slate-800 dark:bg-slate-950'
              }`}>
                {isToday && (
                   <div className="absolute -top-3.5 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-1.5 rounded-full shadow-sm z-10 border-2 border-white dark:border-slate-900 whitespace-nowrap">
                     Ordem do Dia
                   </div>
                )}

                <div className={`p-2.5 sm:p-4 text-center border-b-2 flex flex-col gap-0.5 rounded-t-xl ${isToday ? 'border-blue-200 bg-blue-100/40 pt-5 sm:pt-6 dark:border-blue-900/50 dark:bg-blue-900/20' : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50'}`}>
                  <span className={`text-[9px] sm:text-xs font-black uppercase tracking-widest ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {dateInfo.title} • {dateInfo.dateStr}
                  </span>
                  <span className={`font-black text-lg sm:text-3xl tracking-tighter ${isToday ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    DIA {dayIndex + 1}
                  </span>
                </div>

                <div className="p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 flex-1">
                  {daySubjects.map((subjectId, slotIndex) => {
                    const subject = subjects[subjectId];
                    if (!subject) return null;
                    const activeTopic = getActiveTopic(subjectId);
                    const isSlotCompleted = isToday && completedToday.includes(slotIndex);
                    
                    return (
                      <div key={slotIndex} className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden flex flex-col shadow-sm transition-all ${isSlotCompleted ? 'border-emerald-200 dark:border-emerald-800 opacity-80' : isToday ? 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
                        
                        <div className={`px-2 py-1.5 sm:px-3 sm:py-2 flex justify-between items-center border-b border-black/5 ${subject.color}`}>
                          <span className="font-black text-[9px] sm:text-xs uppercase tracking-wider truncate max-w-[70%]" title={subject.name}>{subject.name}</span>
                          <span className="text-[8px] sm:text-[9px] font-black bg-white/30 dark:bg-slate-900/50 dark:text-white px-1 sm:px-1.5 py-0.5 rounded backdrop-blur-sm shrink-0">{subject.block || 'B?'}</span>
                        </div>

                        <div className="p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-1 justify-center">
                          {isSlotCompleted ? (
                            <div className="text-center py-4 fade-in flex flex-col items-center">
                              <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Teoria Queimada!</span>
                            </div>
                          ) : activeTopic ? (
                            <>
                              <div>
                                <span className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500 shrink-0"/> <span className="truncate">Assunto na Fornalha</span></span>
                                <p className="text-[11px] sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2" title={activeTopic.name}>{activeTopic.name}</p>
                              </div>
                              
                              <div className="bg-slate-50 p-1.5 sm:p-2 rounded-lg border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase dark:text-slate-400">Teoria Restante</span>
                                  <span className="text-[8px] sm:text-[10px] font-black text-blue-600">{activeTopic.completed}/{activeTopic.total} Aulas</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1 dark:bg-slate-800">
                                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(activeTopic.completed / activeTopic.total) * 100}%` }}></div>
                                </div>
                              </div>

                              {isToday && (
                                (() => {
                                  // --- TRAVA DE ILUSÃO DE PROGRESSO ---
                                  const hasRetentionDebt = reviews.some(r => r.subjectId === subjectId && r.lastPerformance !== undefined && r.lastPerformance < 0.70);
                                  
                                  if (hasRetentionDebt) {
                                    return (
                                      <div className="mt-2 text-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-2">
                                        <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                                        <span className="text-[8px] sm:text-[10px] font-black text-red-700 dark:text-red-400 block uppercase">Avanço Bloqueado</span>
                                        <p className="text-[8px] text-red-600 dark:text-red-400/80 mt-1 font-medium leading-tight">Você possui falhas críticas no FSRS desta matéria. Restaure a retenção antes de ver conteúdo novo.</p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <button 
                                      onClick={() => setClassConfirmModal({ subjectId, slotIndex, topicName: activeTopic.name, maxClasses: activeTopic.total - activeTopic.completed })} 
                                      className="mt-1 flex items-center justify-center gap-1 w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-white rounded-lg text-[9px] sm:text-xs font-black transition-all shadow-md border border-slate-200 dark:border-slate-600 hover:border-orange-500 dark:hover:border-orange-500 hover:scale-[1.02] active:scale-95 group"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-orange-400 group-hover:text-white shrink-0" />
                                      <span className="truncate">Queimar Teoria (+1 FSRS)</span>
                                    </button>
                                  );
                                })()
                              )}
                            </>
                          ) : (
                            <div className="text-center py-2 flex flex-col items-center">
                              <div className="bg-emerald-100 dark:bg-emerald-950/50 p-1.5 rounded-full mb-1.5"><BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                              <span className="text-[8px] sm:text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">100% no FSRS (Só Questões)</span>
                              
                              <button onClick={() => setReplaceSubjectModal({ dayIndex, slotIndex, oldSubjectId: subjectId })} className="w-full py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[9px] sm:text-[11px] font-black transition-all flex items-center justify-center gap-1 border border-blue-100 hover:border-blue-600">
                                <Shuffle className="w-3 h-3" /> <span className="truncate">Reestruturar Vaga</span>
                              </button>
                              
                              {isToday && <button onClick={() => setCompletedToday(prev => [...prev, slotIndex])} className="mt-1 text-[8px] sm:text-[10px] font-bold text-slate-400 hover:text-slate-600 underline underline-offset-2 dark:text-slate-300">Pular hoje</button>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Canvas de Confete ao bater a meta */}
      {triggerConfetti && (
        <canvas 
          ref={canvasRef} 
          className="fixed inset-0 pointer-events-none z-50 w-full h-full"
        />
      )}
    </div>
  );
}
