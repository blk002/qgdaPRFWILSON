import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { 
  ShieldCheck, CheckCircle2, Flame, Award, BrainCircuit, Activity, 
  PlayCircle, Clock, BookOpen, AlertTriangle, FileText, ClipboardList,
  Sparkles, Save, Edit3, ArrowRight, CheckCircle
} from 'lucide-react';
import NotesDrawer from '../components/NotesDrawer';
import PomodoroTimer from '../components/PomodoroTimer';

export default function Hoje() {
  const {
    subjects,
    cycle,
    currentDayIndex,
    completedToday,
    setClassConfirmModal,
    getPendingReviews,
    dailyReviewStats,
    tafTrainingStatus,
    completeTafTraining,
    dailyMissions,
    claimDailyMissionReward,
    dailyGoalMinutes,
    studyHistory,
    getLocalDateStr,
    reviews,
    saveTopicNotes,
    getActiveTopic
  } = useStore();

  const navigate = useNavigate();
  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [noteContent, setNoteContent] = useState('');

  const todayStr = getLocalDateStr();
  const studiedTodayMinutes = studyHistory?.[todayStr] || 0;
  const pendingReviewsCount = getPendingReviews().length;
  const completedReviewsToday = dailyReviewStats?.[todayStr]?.total || 0;

  // Obter slots do dia atual do ciclo
  const todaySlots = (cycle && cycle.length > 0) ? cycle[currentDayIndex % cycle.length] : [];

  const handleOpenNotes = (subjectId, topic) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopic(topic);
    setNoteContent(topic.notes || '');
    setNoteDrawerOpen(true);
  };

  const handleSaveNotes = () => {
    if (!selectedSubjectId || !selectedTopic) return;
    saveTopicNotes(selectedSubjectId, selectedTopic.id, noteContent);
    setNoteDrawerOpen(false);
  };

  const dailyGoalPercent = Math.min(100, Math.round((studiedTodayMinutes / dailyGoalMinutes) * 100));

  return (
    <div className="fade-in w-full pb-10">
      {/* Cabeçalho */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full shrink-0">
            <ShieldCheck className="text-blue-600 dark:text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Painel Tático de Hoje</h2>
            <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
              Gerenciamento integrado do seu ciclo de estudos, revisões e treino físico para hoje.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] sm:text-xs font-black bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-900/50 uppercase tracking-wider">
            Dia {currentDayIndex + 1} no Ciclo
          </span>
        </div>
      </div>

      {/* Timer Pomodoro */}
      <PomodoroTimer />

      {/* Grid Principal do Topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Card 1: Meta Diária de Minutos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" /> Meta de Estudos
            </h3>
            <div className="flex items-center justify-center py-4">
              {/* Radial Meter */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-slate-100 dark:stroke-slate-800" 
                    strokeWidth="8" fill="transparent" 
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-blue-500 transition-all duration-500" 
                    strokeWidth="8" fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * dailyGoalPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">{studiedTodayMinutes}m</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Meta: {dailyGoalMinutes}m</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {dailyGoalPercent >= 100 ? '🎉 Meta diária batida! Excelente!' : `${100 - dailyGoalPercent}% restante para a meta.`}
            </span>
          </div>
        </div>

        {/* Card 2: FSRS Reviews Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-red-500" /> Revisões FSRS
            </h3>
            <div className="flex flex-col gap-3 py-2">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pendentes para hoje:</span>
                <span className="text-lg font-black text-red-500">{pendingReviewsCount}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concluídas hoje:</span>
                <span className="text-lg font-black text-emerald-500">{completedReviewsToday}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-2">
            <button 
              onClick={() => navigate('/revisoes')}
              className="w-full py-2.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
            >
              Ir para Central de Revisões <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: Treino Físico TAF */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" /> Treino Físico (TAF)
            </h3>
            <div className="flex flex-col items-center justify-center py-4">
              {tafTrainingStatus?.lastDoneDate === todayStr ? (
                <div className="text-center">
                  <div className="bg-emerald-100 dark:bg-emerald-950/30 p-3 rounded-full inline-block mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase">Treino Concluído!</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold">Você ganhou +50 XP e +30 Moedas hoje.</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-amber-100 dark:bg-amber-950/30 p-3 rounded-full inline-block mb-3">
                    <Activity className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase">Ainda Não Treinou</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold">Mantenha a consistência do corpo e mente.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-2">
            {tafTrainingStatus?.lastDoneDate !== todayStr && (
              <button 
                onClick={() => {
                  completeTafTraining();
                  toast.success("Treino físico diário concluído! +50 XP, +30 moedas! 🏃‍♂️");
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1"
              >
                Concluir Treino do Dia
              </button>
            )}
            {tafTrainingStatus?.lastDoneDate === todayStr && (
              <button 
                disabled
                className="w-full py-2.5 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 rounded-lg text-xs font-black uppercase tracking-wider cursor-not-allowed"
              >
                Treino Cumprido
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Secundário: Ciclo de Hoje vs Contratos Diários */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Coluna do Ciclo (3/5) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" /> Slots do Ciclo de Hoje
          </h3>
          
          <div className="flex flex-col gap-4">
            {todaySlots && todaySlots.length > 0 ? (
              todaySlots.map((subjectId, slotIndex) => {
                const subject = subjects[subjectId];
                if (!subject) return null;
                const activeTopic = getActiveTopic(subjectId);
                const isSlotCompleted = completedToday.includes(slotIndex);

                return (
                  <div 
                    key={slotIndex} 
                    className={`border rounded-xl overflow-hidden flex flex-col shadow-sm transition-all ${
                      isSlotCompleted 
                        ? 'border-emerald-200 bg-emerald-50/10 dark:border-emerald-950 opacity-80' 
                        : 'border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {/* Header do Slot */}
                    <div className={`px-3 py-2 flex justify-between items-center border-b border-black/5 ${subject.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                      <span className="font-black text-xs uppercase tracking-wider truncate max-w-[70%]" title={subject.name}>
                        {subject.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] sm:text-[9px] font-black bg-white/30 dark:bg-slate-900/50 dark:text-white px-1.5 py-0.5 rounded backdrop-blur-sm shrink-0">
                          {subject.block || 'B?'}
                        </span>
                      </div>
                    </div>

                    {/* Corpo do Slot */}
                    <div className="p-4 flex flex-col gap-3">
                      {isSlotCompleted ? (
                        <div className="text-center py-4 flex flex-col items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-wider">Teoria Concluída hoje!</span>
                        </div>
                      ) : activeTopic ? (
                        <>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500 shrink-0" /> Assunto na Fornalha
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                                {activeTopic.name}
                              </p>
                            </div>
                            
                            {/* Botão de Anotação */}
                            <button 
                              onClick={() => handleOpenNotes(subjectId, activeTopic)}
                              className="ml-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-blue-500 transition-colors shrink-0"
                              title="Anotações do Tópico"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] text-slate-500 font-bold uppercase dark:text-slate-400">Progresso de Aulas</span>
                              <span className="text-[9px] font-black text-blue-600 dark:text-blue-400">{activeTopic.completed}/{activeTopic.total}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-800">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full" 
                                style={{ width: `${(activeTopic.completed / activeTopic.total) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Travas e Ações */}
                          {(() => {
                            const hasRetentionDebt = reviews.some(r => r.subjectId === subjectId && r.lastPerformance !== undefined && r.lastPerformance < 0.70);
                            
                            if (hasRetentionDebt) {
                              return (
                                <div className="mt-1 text-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-2.5">
                                  <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                                  <span className="text-[9px] font-black text-red-700 dark:text-red-400 block uppercase">Avanço Bloqueado</span>
                                  <p className="text-[9px] text-red-600 dark:text-red-400/80 mt-0.5 font-medium leading-tight">
                                    Retenção do FSRS em queda crítica nesta disciplina. Limpe as revisões pendentes com erro para destravar.
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <button 
                                onClick={() => setClassConfirmModal({ 
                                  subjectId, 
                                  slotIndex, 
                                  topicName: activeTopic.name, 
                                  maxClasses: activeTopic.total - activeTopic.completed 
                                })}
                                className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-white rounded-lg text-xs font-black transition-all shadow-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider group"
                              >
                                <PlayCircle className="w-4 h-4 text-orange-400 group-hover:text-white shrink-0 transition-transform group-hover:scale-110" />
                                <span>Queimar Teoria (+1 FSRS)</span>
                              </button>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Edital Zerado! 🏆</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">Sem slots de estudo para hoje</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Não há cronograma ativo. Crie ou ajuste o seu ciclo de estudos na aba "Ciclo" para começar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna dos Contratos/Missões (2/5) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" /> Contratos Operacionais (Diários)
          </h3>

          <div className="flex flex-col gap-4">
            {dailyMissions && dailyMissions.length > 0 ? (
              dailyMissions.map((mission) => {
                const isClaimed = mission.claimed;
                const isCompleted = mission.completed;
                const progressPercent = Math.min(100, Math.round((mission.current / mission.goal) * 100));

                return (
                  <div 
                    key={mission.id} 
                    className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                      isClaimed 
                        ? 'bg-slate-50/50 border-slate-100 opacity-60 dark:bg-slate-900 dark:border-slate-800/40' 
                        : isCompleted 
                        ? 'border-orange-200 bg-orange-50/10 dark:border-orange-950' 
                        : 'border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                            {mission.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {mission.description}
                          </p>
                        </div>
                        {isClaimed ? (
                          <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded uppercase tracking-wider dark:bg-slate-800 dark:text-slate-600 shrink-0">
                            Resgatado
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider dark:bg-emerald-950/50 dark:text-emerald-400 shrink-0 animate-pulse">
                            Cumprido
                          </span>
                        ) : null}
                      </div>

                      {/* Progresso */}
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1 text-[9px] font-bold text-slate-500">
                          <span>Progresso</span>
                          <span>{mission.current} / {mission.goal}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-orange-500'}`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Resgate */}
                    <div className="mt-4 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                        <span>Recompensa:</span>
                        <span className="text-blue-600 dark:text-blue-400">+{mission.xpReward} XP</span>
                        <span className="text-orange-500">+{mission.coinReward} M</span>
                      </div>
                      
                      {isCompleted && !isClaimed && (
                        <button 
                          onClick={() => {
                            claimDailyMissionReward(mission.id);
                            toast.success(`Recompensa resgatada com sucesso! +${mission.xpReward} XP, +${mission.coinReward} moedas! 🪙`);
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-0.5"
                        >
                          <Sparkles className="w-3 h-3" /> Resgatar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs text-slate-500 font-bold">Nenhum contrato diário ativo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide Drawer de Anotações de Tópico */}
      <NotesDrawer
        isOpen={noteDrawerOpen}
        onClose={() => setNoteDrawerOpen(false)}
        topic={selectedTopic}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        onSave={handleSaveNotes}
      />
    </div>
  );
}
