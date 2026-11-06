import { useStore, getCleanInitialState, PERSISTED_KEYS } from '../store/useStore';
import { assetUrl } from '../lib/assets';
import { toast } from 'sonner';
import { Target, AlertTriangle, Clock, Settings, Plus, Edit2, Trash2, Calendar, Sun, X, Save, User, Volume2, VolumeX, Shield, CheckCircle, Check, Camera, BookOpen, ScanLine, ChevronUp, ChevronDown, Zap, FastForward, Layers, RotateCcw, RefreshCw, Shuffle } from 'lucide-react';
import ImportOCR from '../components/ImportOCR';
import TopicLessonScanner from '../components/TopicLessonScanner';
import SelectiveResetModal from '../components/SelectiveResetModal';
import { parseDurationToSeconds, formatSecondsToClock, formatSecondsToFriendly, getSubjectVideoStats, formatMinutesToFriendly, calculateLessonsForGoal } from '../lib/durationHelpers';
import { APP_VERSION } from '../version';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const notificationsSupported = typeof Notification !== 'undefined';

export default function Config({
  availableColors
}) {
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [draftSubject, setDraftSubject] = useState(null);
  const [showImportOCR, setShowImportOCR] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  // Scanner de aulas por assunto
  const [scannerTopicIdx, setScannerTopicIdx] = useState(null); // índice do tópico sendo escaneado
  const modalBodyRef = useRef(null);

  const {
    cycle,
    setCycle,
    subjects,
    setSubjects,
    setSubjectSpeed,
    targetExamDate,
    setTargetExamDate,
    setGlobalModal,
    setReviews,
    currentDayIndex,
    setCurrentDayIndex,
    executeTacticalReset,
    executeTotalWipe,
    userStats,
    enableSounds,
    setEnableSounds,
    dailyGoalMinutes,
    setDailyGoalMinutes,
    subjectGoals,
    setSubjectGoal,
    subjectTimeGoal,
    setSubjectTimeGoal,
    pushSettings,
    setPushSettings,
    pushTime,
    setPushTime,
    cycleScheduleType,
    setCycleScheduleType,
    cycleWeekStart,
    setCycleWeekStart,
    fillFullWeekCycle,
    getRelativeDateInfo
  } = useStore();

  const handleForceUpdate = async () => {
    toast.loading("Limpando caches e forçando atualização...", { id: 'force-update' });
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      toast.success("Caches limpos! Recarregando página...", { id: 'force-update' });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      window.location.reload();
    }
  };

  const flatCycle = cycle.flat();
  const totalSlots = flatCycle.length;
  
  let b1Count = 0; let b2Count = 0; let b3Count = 0;
  
  flatCycle.forEach(subId => {
    const sub = subjects[subId];
    if (sub) {
      if (sub.block === 'B1') b1Count++;
      else if (sub.block === 'B2') b2Count++;
      else if (sub.block === 'B3') b3Count++;
    }
  });

  const b1Percent = totalSlots > 0 ? Math.round((b1Count / totalSlots) * 100) : 0;
  const b2Percent = totalSlots > 0 ? Math.round((b2Count / totalSlots) * 100) : 0;
  const b3Percent = totalSlots > 0 ? Math.round((b3Count / totalSlots) * 100) : 0;

  const isB2TooLow = b2Percent > 0 && 15 > b2Percent;
  const isB2TooHigh = b2Percent > 40; 
  const isB1TooLow = b1Percent > 0 && 35 > b1Percent;

  return (
    <div className="fade-in w-full pb-10">
      
      <div className="bg-slate-900 p-5 sm:p-6 rounded-xl shadow-lg border border-slate-800 mb-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
          <Target className="text-blue-400 w-5 h-5"/> Auditoria do Ciclo (Curva ABC)
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          O seu cronograma possui <strong className="text-white">{totalSlots} vagas (slots)</strong>. Veja como o seu esforço está distribuído em relação ao peso real do edital da PRF.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-300 uppercase">Bloco I (Básicas)</span>
                <span className="text-xs font-bold text-slate-500">Alvo: ~46%</span>
             </div>
             <div className="flex items-end gap-2 mb-2">
               <span className={`text-2xl font-black ${isB1TooLow ? 'text-red-400' : 'text-blue-400'}`}>{b1Percent}%</span>
               <span className="text-xs text-slate-400 mb-1">({b1Count} vagas)</span>
             </div>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
               <div className={`h-1.5 rounded-full ${isB1TooLow ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${b1Percent}%` }}></div>
             </div>
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-300 uppercase">Bloco II (Trânsito)</span>
                <span className="text-xs font-bold text-slate-500">Alvo: ~25%</span>
             </div>
             <div className="flex items-end gap-2 mb-2">
               <span className={`text-2xl font-black ${(isB2TooLow || isB2TooHigh) ? 'text-red-400' : 'text-blue-400'}`}>{b2Percent}%</span>
               <span className="text-xs text-slate-400 mb-1">({b2Count} vagas)</span>
             </div>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
               <div className={`h-1.5 rounded-full ${(isB2TooLow || isB2TooHigh) ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${b2Percent}%` }}></div>
             </div>
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-300 uppercase">Bloco III (Direito)</span>
                <span className="text-xs font-bold text-slate-500">Alvo: ~29%</span>
             </div>
             <div className="flex items-end gap-2 mb-2">
               <span className="text-2xl font-black text-purple-400">{b3Percent}%</span>
               <span className="text-xs text-slate-400 mb-1">({b3Count} vagas)</span>
             </div>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
               <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${b3Percent}%` }}></div>
             </div>
          </div>
        </div>

        {(isB1TooLow || isB2TooLow || isB2TooHigh) && (
          <div className="bg-red-900/40 border border-red-800 p-3 rounded-lg flex items-start gap-3 mt-4">
            <AlertTriangle className="text-red-400 w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-300 uppercase mb-1">Risco Tático Detetado</p>
              <p className="text-xs text-red-200/80">
                {isB2TooHigh && "O seu cronograma está excessivamente focado no Trânsito. Embora importante, o Bloco I pode eliminá-lo se não dedicar o volume necessário de horas."}
                {isB2TooLow && "Pouca alocação no Trânsito. Sendo a disciplina mais pesada do concurso, você precisa de aumentar a cadência no Bloco II."}
                {isB1TooLow && !isB2TooHigh && "O volume do Bloco I (Básicas) está perigosamente baixo. Lembre-se que o mínimo para não reprovar é 15 pontos num universo de 55 questões."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 border-l-4 border-l-blue-500 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2 dark:text-slate-100">
          <Clock className="text-blue-600 w-5 h-5"/> Data Alvo da Prova
        </h3>
        <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">O sistema usará esta data para cruzar com o seu ritmo de estudos e alertar se você corre risco de não fechar o edital a tempo.</p>
        <div className="flex items-center gap-4">
           <input 
              type="date" 
              value={targetExamDate} 
              onChange={(e) => setTargetExamDate(e.target.value)}
              className="border-2 border-slate-200 p-2.5 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-400 dark:text-slate-200 dark:border-slate-800"
           />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100"><Settings className="text-slate-600 w-5 h-5 dark:text-slate-300"/> Minhas Disciplinas</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowImportOCR(true)}
            className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg font-bold flex items-center gap-1 text-xs sm:text-sm dark:bg-emerald-900/30 dark:text-emerald-400 hover:scale-105 transition-transform">
            <Camera className="w-4 h-4" /> Importar
          </button>
          <button onClick={() => {
              const newId = 'sub_' + Date.now();
              const defaultColor = (availableColors && availableColors[0]?.color) || 'bg-blue-600 text-white';
              setDraftSubject({ 
                id: newId, 
                name: '', 
                color: defaultColor, 
                block: 'B1', 
                speed: 1, 
                timeGoalMinutes: 0,
                onCompleteAction: 'double_remaining',
                replacementSubjectId: '',
                topics: [] 
              });
              setEditingSubjectId(newId);
            }} 
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold flex items-center gap-1 text-xs sm:text-sm">
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(subjects || {}).map(sub => {
          const st = getSubjectVideoStats(sub);
          const currentSpeed = Number(sub.speed) || 1;
          const currentTimeGoal = Number(sub.timeGoalMinutes || subjectTimeGoal?.[sub.id]) || 0;

          return (
            <div key={sub.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3 bg-slate-50 hover:border-blue-400 transition-colors dark:bg-slate-950 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${sub.color}`}>
                    {sub.name} <span className="opacity-60 ml-1">({sub.block})</span>
                  </span>
                  {currentSpeed > 1 && (
                    <span className="text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-200 dark:border-blue-900" title={`Aceleração configurada: ${currentSpeed}x`}>
                      <Zap className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" /> {currentSpeed}x
                    </span>
                  )}
                  {currentTimeGoal > 0 && (
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-200 dark:border-emerald-900" title={`Meta de tempo por bloco: ${currentTimeGoal} min`}>
                      <Target className="w-2.5 h-2.5" /> {formatMinutesToFriendly(currentTimeGoal)}/bloco
                    </span>
                  )}
                  {sub.onCompleteAction === 'replace' && sub.replacementSubjectId && subjects[sub.replacementSubjectId] ? (
                    <span className="text-[9px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-purple-200 dark:border-purple-900" title={`Substitui por ${subjects[sub.replacementSubjectId].name} ao concluir`}>
                      <Shuffle className="w-2.5 h-2.5 text-purple-400" /> ➔ {subjects[sub.replacementSubjectId].name}
                    </span>
                  ) : sub.onCompleteAction === 'ask' ? (
                    <span className="text-[9px] font-black bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-slate-300 dark:border-slate-700" title="Decidir no dia da conclusão">
                      <Clock className="w-2.5 h-2.5 text-slate-400" /> Decidir ao fim
                    </span>
                  ) : (
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-amber-200 dark:border-amber-900" title="Dobra matérias restantes do ciclo ao concluir">
                      <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Dobra Restantes
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {
                    setDraftSubject({ 
                      ...sub, 
                      speed: sub.speed || 1,
                      timeGoalMinutes: currentTimeGoal,
                      onCompleteAction: sub.onCompleteAction || 'double_remaining',
                      replacementSubjectId: sub.replacementSubjectId || ''
                    });
                    setEditingSubjectId(sub.id);
                  }} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => {
                    setGlobalModal({
                      title: "Excluir Disciplina",
                      message: `Você tem certeza que deseja excluir a matéria "${sub.name}" permanentemente do seu planejamento?`,
                      onConfirm: () => {
                        setSubjects(prev => { const c = {...prev}; delete c[sub.id]; return c; });
                        setCycle(prev => prev.map(day => day.filter(sId => sId !== sub.id)));
                        setReviews(prev => prev.filter(r => r.subjectId !== sub.id)); 
                      }
                    });
                  }} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-red-600 rounded dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium dark:text-slate-400">
                <span>{sub.topics?.length || 0} {sub.topics?.length === 1 ? 'assunto' : 'assuntos'}</span>
                <span className="text-[10px] font-mono text-slate-400" title={`Sem aceleração: ${st.totalFriendly} | Acelerado: ${st.acceleratedFriendly}`}>
                  {st.acceleratedFriendly} {currentSpeed > 1 && `(${currentSpeed}x)`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ⚡ SEÇÃO: ACELERAÇÃO DE VÍDEO-AULAS POR DISCIPLINA */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 mt-8 mb-6 border-l-4 border-l-yellow-500 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 dark:text-slate-100">
              <Zap className="text-yellow-500 w-5 h-5 fill-yellow-500"/> Aceleração de Vídeo-Aulas & Economia de Tempo
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Defina a velocidade em que você assiste as aulas de cada matéria (1x, 1.25x, 1.5x, 1.75x, 2x). O sistema calcula os tempos reais e o total de horas poupadas na sua preparação.
            </p>
          </div>
        </div>

        {/* Banner Geral de Economia de Tempo */}
        {(() => {
          let globalLessons = 0;
          let globalOriginalSec = 0;
          let globalAccelSec = 0;

          Object.values(subjects || {}).forEach(sub => {
            const st = getSubjectVideoStats(sub);
            globalLessons += st.totalLessons;
            globalOriginalSec += st.totalSeconds;
            globalAccelSec += st.acceleratedSeconds;
          });

          const globalSavedSec = Math.max(0, globalOriginalSec - globalAccelSec);
          const globalPercentSaved = globalOriginalSec > 0 ? Math.round((globalSavedSec / globalOriginalSec) * 100) : 0;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl mb-6 shadow-md border border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aulas no Edital</span>
                <span className="text-xl font-black text-white mt-0.5">{globalLessons} aulas</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sem Aceleração (1x)</span>
                <span className="text-xl font-black text-slate-300 mt-0.5">{formatSecondsToFriendly(globalOriginalSec)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Com Acelerações</span>
                <span className="text-xl font-black text-blue-400 mt-0.5">{formatSecondsToFriendly(globalAccelSec)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Tempo Poupado</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5">
                  {globalSavedSec > 0 ? `-${formatSecondsToFriendly(globalSavedSec)} (${globalPercentSaved}%)` : '0m'}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Lista de Disciplinas com Seletor Rápido e Comparativo */}
        <div className="space-y-3">
          {Object.values(subjects || {}).map(sub => {
            const st = getSubjectVideoStats(sub);
            const currentSpeed = Number(sub.speed) || 1;
            const currentTimeGoal = Number(sub.timeGoalMinutes || subjectTimeGoal?.[sub.id]) || 0;

            return (
              <div key={sub.id} className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all">
                {/* Info da Disciplina */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${sub.color}`}>
                      {sub.name}
                    </span>
                    <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                      {sub.block}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                      {st.totalLessons} {st.totalLessons === 1 ? 'aula' : 'aulas'}
                    </span>
                    {currentTimeGoal > 0 && (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-200 dark:border-emerald-800">
                        <Target className="w-2.5 h-2.5" /> Bloco: {formatMinutesToFriendly(currentTimeGoal)}
                      </span>
                    )}
                  </div>

                  {/* Comparativo de Tempos */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Tempo Normal:</span> {st.totalFriendly}
                    </div>
                    <div className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span>Com Aceleração ({currentSpeed}x):</span> {st.acceleratedFriendly}
                    </div>
                    {currentSpeed > 1 && (
                      <div className="text-emerald-600 dark:text-emerald-400 font-black">
                        Economia: -{st.savedFriendly} (-{st.percentSaved}%)
                      </div>
                    )}
                  </div>
                </div>

                {/* Seletores Rápidos: Velocidade e Meta por Bloco */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 self-start lg:self-center">
                  {/* Velocidade */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase px-1 hidden sm:inline">Velocidade:</span>
                    {[1, 1.25, 1.5, 1.75, 2].map(spd => {
                      const isSelected = currentSpeed === spd;
                      return (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => {
                            setSubjectSpeed(sub.id, spd);
                            toast.success(`${sub.name}: Velocidade definida em ${spd}x!`, { duration: 1200 });
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-2 ring-blue-400'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {spd}x
                        </button>
                      );
                    })}
                  </div>

                  {/* Meta por Bloco */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase px-1 flex items-center gap-0.5">
                      <Target className="w-2.5 h-2.5 text-emerald-500" /> Bloco:
                    </span>
                    {[
                      { label: '1 aula', val: 0 },
                      { label: '45m', val: 45 },
                      { label: '1h', val: 60 },
                      { label: '1h30', val: 90 },
                      { label: '2h', val: 120 }
                    ].map(preset => {
                      const isSel = currentTimeGoal === preset.val;
                      return (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setSubjectTimeGoal(sub.id, preset.val);
                            toast.success(`${sub.name}: Meta por bloco definida em ${preset.label}!`, { duration: 1200 });
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                            isSel
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 ring-2 ring-emerald-400'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {Object.values(subjects || {}).length === 0 && (
            <p className="text-xs font-bold text-slate-500 italic text-center py-6">
              Nenhuma disciplina cadastrada para configurar aceleração.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mt-8 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
              <Calendar className="text-blue-600 w-5 h-5" /> Meu Cronograma
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure sua rotina de estudos organizada por dias da semana ou por ciclo sequencial contínuo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Modo: Dias da Semana vs Ciclo Sequencial */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setCycleScheduleType('weekly');
                  if (cycle.length < 7) {
                    fillFullWeekCycle(cycleWeekStart || 'sunday');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  cycleScheduleType === 'weekly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Dias da Semana
              </button>
              <button
                type="button"
                onClick={() => setCycleScheduleType('numeric')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  cycleScheduleType !== 'weekly'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Ciclo Sequencial
              </button>
            </div>

            {cycleScheduleType !== 'weekly' && (
              <button 
                onClick={() => cycle.length < 7 && setCycle([...cycle, []])} 
                disabled={cycle.length >= 7}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-xs transition-all ${
                  cycle.length >= 7 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Dia {cycle.length >= 7 && '(Limite 7)'}
              </button>
            )}
          </div>
        </div>

        {/* Sub-barra de opções quando "Dias da Semana" está selecionado */}
        {cycleScheduleType === 'weekly' && (
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 sm:p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 dark:bg-blue-950/20 dark:border-blue-900/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ordem da Semana:
              </span>
              <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setCycleWeekStart('sunday')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    (cycleWeekStart || 'sunday') === 'sunday'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Domingo a Sábado
                </button>
                <button
                  type="button"
                  onClick={() => setCycleWeekStart('monday')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    cycleWeekStart === 'monday'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Segunda a Domingo
                </button>
              </div>
            </div>

            {cycle.length < 7 && (
              <button
                type="button"
                onClick={() => fillFullWeekCycle(cycleWeekStart || 'sunday')}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Preencher 7 Dias Completos
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {cycle.map((daySubjects, dayIndex) => {
            const dateInfo = getRelativeDateInfo(dayIndex);
            const isTodayInCalendar = cycleScheduleType === 'weekly' && dateInfo.isToday;
            const cardTitle = cycleScheduleType === 'weekly' 
              ? (dateInfo.weekDayName || `Dia ${dayIndex + 1}`) 
              : `DIA ${dayIndex + 1}`;

            return (
              <div 
                key={dayIndex} 
                className={`bg-slate-50 border rounded-xl flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md dark:bg-slate-950 ${
                  isTodayInCalendar 
                    ? 'border-blue-500 ring-2 ring-blue-400/40 dark:border-blue-500 dark:ring-blue-900/40' 
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className={`p-2 sm:p-2.5 flex justify-between items-center border-b ${
                  isTodayInCalendar
                    ? 'bg-blue-100/70 border-blue-200 dark:bg-blue-950/60 dark:border-blue-900/60'
                    : 'bg-slate-200/70 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
                }`}>
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className={`font-black text-xs uppercase tracking-wider truncate ${
                      isTodayInCalendar ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {cardTitle}
                    </span>
                    {isTodayInCalendar && (
                      <span className="shrink-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        Hoje
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => {
                        setGlobalModal({
                          title: `Limpar ${cardTitle}?`,
                          message: "Isso removerá todas as matérias escaladas para este dia. O dia voltará a ser 'Livre / Descanso'.",
                          onConfirm: () => {
                            setCycle(prev => {
                              const newCycle = [...prev];
                              newCycle[dayIndex] = [];
                              return newCycle;
                            });
                          }
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors dark:bg-slate-900" title="Limpar Dia (Tornar Livre / Descanso)"
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (cycleScheduleType === 'weekly') {
                          setGlobalModal({
                            title: `Remover ${cardTitle}?`,
                            message: "Em modo semanal, você pode deixar o dia livre (sem aulas) ou remover este slot do cronograma. Deseja remover o dia?",
                            onConfirm: () => {
                              setCycle(prev => {
                                const newCycle = prev.filter((_, i) => i !== dayIndex);
                                if (currentDayIndex >= newCycle.length) setCurrentDayIndex(0);
                                return newCycle;
                              });
                            }
                          });
                        } else {
                          setCycle(prev => {
                            const newCycle = prev.filter((_, i) => i !== dayIndex);
                            if (currentDayIndex >= newCycle.length) setCurrentDayIndex(0);
                            return newCycle;
                          });
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors dark:bg-slate-900" title="Remover Dia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-2 sm:p-2.5 flex flex-col gap-1.5 min-h-[120px]">
                  {daySubjects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg bg-white/50 dark:bg-slate-900 dark:border-slate-800">
                      <Sun className="w-8 h-8 text-orange-400 opacity-40 mb-2 drop-shadow-sm" />
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dia Livre / Descanso</span>
                    </div>
                  ) : (
                    daySubjects.map((subId, slotIndex) => {
                      const subject = subjects[subId];
                      return (
                        <div key={slotIndex} className="flex items-center gap-2">
                          <select 
                            value={subId}
                            onChange={(e) => {
                              setCycle(prev => {
                                const newCycle = [...prev];
                                const newDay = [...newCycle[dayIndex]];
                                if (e.target.value === '') {
                                  newCycle[dayIndex] = newDay.filter((_, i) => i !== slotIndex);
                                } else {
                                  newDay[slotIndex] = e.target.value;
                                  newCycle[dayIndex] = newDay;
                                }
                                return newCycle;
                              });
                            }}
                            className={`flex-1 text-[13px] font-bold p-2 rounded-md border border-slate-300 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-colors cursor-pointer ${subject ? subject.color : 'bg-white text-slate-900'}`}
                          >
                            <option value="" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">- Remover Aula -</option>
                            {Object.values(subjects).map(s => (
                              <option key={s.id} value={s.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">{s.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
              
                <button 
                  onClick={() => {
                    if (Object.keys(subjects).length === 0) {
                      toast.error("Cadastre pelo menos uma disciplina primeiro!");
                      return;
                    }
                    setCycle(prev => {
                      const newCycle = [...prev];
                      const firstSub = Object.keys(subjects)[0];
                      if (firstSub) {
                        newCycle[dayIndex] = [...newCycle[dayIndex], firstSub];
                      }
                      return newCycle;
                    });
                  }}
                  className="mt-1 w-full py-2 border-2 border-dashed border-slate-300 bg-white text-slate-500 font-bold text-[11px] rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all flex items-center justify-center gap-1 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                >
                  <Plus className="w-3 h-3" /> Adicionar Bloco
                </button>
              </div>
            </div>
            );
          })}

          {cycle.length === 0 && (
            <div className="col-span-full text-center py-12 px-4 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800 flex flex-col items-center justify-center gap-3">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Nenhum dia configurado no cronograma.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Você pode criar uma grade completa de Domingo a Sábado com um clique, ou adicionar dias sequenciais manualmente.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => fillFullWeekCycle(cycleWeekStart || 'sunday')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Criar Grade Semanal (Domingo a Sábado)
                </button>
                <button
                  type="button"
                  onClick={() => setCycle([[]])}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-700"
                >
                  <Plus className="w-4 h-4" /> Adicionar Dia Avulso
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 👤 SEÇÃO: IDENTIDADE E PREFERÊNCIAS */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6 dark:text-slate-100">
          <User className="text-blue-600 w-5 h-5"/> Identidade e Preferências
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload de Foto */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Foto de Perfil</label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg bg-slate-800">
                  {userStats.avatar ? (
                    <img src={assetUrl(userStats.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 text-center">
                  Enviar Foto
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 500 * 1024) {
                        setGlobalModal({ title: 'Arquivo Grande', message: 'A imagem deve ter no máximo 500KB. Tente uma foto mais leve.', isAlert: true });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        useStore.setState(s => ({ userStats: { ...s.userStats, avatar: reader.result } }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {userStats.avatar && (
                  <button 
                    onClick={() => useStore.setState(s => ({ userStats: { ...s.userStats, avatar: '' } }))}
                    className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>
            <p className="text-[9px] text-slate-500 mt-3 font-bold">Formato: JPG, PNG. Máximo: 500KB.</p>
          </div>

          {/* Configuração de Som */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Feedback Auditivo</label>
            <button 
              onClick={() => setEnableSounds(!enableSounds)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all w-full max-w-xs ${enableSounds ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}
            >
              <div className={`p-2 rounded-lg ${enableSounds ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'}`}>
                {enableSounds ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase">{enableSounds ? 'Sons Ativados' : 'Sons Desativados'}</p>
                <p className="text-[10px] font-bold opacity-70">Feedback tático ao ganhar XP e moedas.</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 SEÇÃO: METAS DE ESTUDO DIÁRIAS */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6 dark:text-slate-100">
          <Clock className="text-blue-600 w-5 h-5"/> Metas de Estudo Operacionais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Meta Diária Global */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Meta Diária Global (Minutos)</label>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                min="10" 
                max="1440"
                value={dailyGoalMinutes} 
                onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value) || 0)} 
                className="w-32 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-white"
              />
              <span className="text-xs text-slate-500 font-bold dark:text-slate-400">minutos sugeridos de estudo por dia.</span>
            </div>
            <div className="flex gap-2 mt-3">
              {[60, 120, 180, 240, 300, 360].map(mins => (
                <button
                  key={mins}
                  onClick={() => setDailyGoalMinutes(mins)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${dailyGoalMinutes === mins ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'}`}
                >
                  {mins / 60}h
                </button>
              ))}
            </div>
          </div>

          {/* Metas Individuais por Matéria */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Metas de Teoria por Disciplina (Minutos por Dia)</label>
            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {Object.values(subjects).map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${sub.color?.split(' ')[0] || 'bg-slate-500'}`}></div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-44">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={subjectGoals?.[sub.id] || ''}
                      onChange={(e) => setSubjectGoal(sub.id, parseInt(e.target.value) || 0)}
                      className="w-20 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-black text-slate-800 dark:text-white"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">min</span>
                  </div>
                </div>
              ))}
              {Object.values(subjects).length === 0 && (
                <p className="text-[11px] font-bold text-slate-500 italic text-center py-4">Nenhuma disciplina cadastrada para definir metas.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔔 SEÇÃO: NOTIFICAÇÕES PUSH */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6 dark:text-slate-100">
          <Shield className="text-blue-600 w-5 h-5"/> Notificações e Lembretes Operacionais
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-bold leading-relaxed">
              Ative notificações no navegador para receber alertas operacionais e manter a consistência da sua farda. O sistema enviará lembretes de revisões FSRS e alertas quando seu streak diário estiver sob perigo de quebra.
            </p>
            {notificationsSupported && Notification.permission === 'default' && (
              <button
                onClick={() => {
                  Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                      setPushSettings({ ...pushSettings, enabled: true });
                      toast.success("Notificações autorizadas com sucesso! 🛡️");
                    } else {
                      toast.error("Permissão de notificações recusada.");
                    }
                  });
                }}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                Ativar Notificações no Navegador
              </button>
            )}
            {notificationsSupported && Notification.permission === 'granted' && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 rounded-lg px-4 py-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" /> Permissão Concedida pelo Navegador
              </div>
            )}
            {notificationsSupported && Notification.permission === 'denied' && (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 rounded-lg px-4 py-2 text-red-700 dark:text-red-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" /> Notificações bloqueadas nas configurações do seu navegador.
              </div>
            )}
            {!notificationsSupported && (
              <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-500 dark:text-slate-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" /> Seu navegador não suporta notificações nativas.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Toggle Geral */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Alertas Ativos</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Ativa ou desativa todo o fluxo de notificações.</p>
              </div>
              <input 
                type="checkbox"
                checked={pushSettings.enabled}
                disabled={!notificationsSupported || Notification.permission !== 'granted'}
                onChange={(e) => setPushSettings({ ...pushSettings, enabled: e.target.checked })}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            {/* Seletor de Horário para o Pomodoro Push */}
            {pushSettings.enabled && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 animate-fade-in-down">
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Horário de Estudo</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Defina o horário diário para receber o lembrete.</p>
                </div>
                <input 
                  type="time"
                  value={pushTime || '08:00'}
                  onChange={(e) => setPushTime(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Toggle Streak Warning */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Streak em Perigo</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Aviso no fim do dia se você ainda não queimou teoria ou revisou.</p>
              </div>
              <input 
                type="checkbox"
                checked={pushSettings.streakWarning}
                disabled={!pushSettings.enabled}
                onChange={(e) => setPushSettings({ ...pushSettings, streakWarning: e.target.checked })}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            {/* Toggle Reviews Pending */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Revisões Acumuladas</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Alerta inteligente se você tiver mais de 5 revisões pendentes FSRS.</p>
              </div>
              <input 
                type="checkbox"
                checked={pushSettings.reviewsPending}
                disabled={!pushSettings.enabled}
                onChange={(e) => setPushSettings({ ...pushSettings, reviewsPending: e.target.checked })}
                className="w-5 h-5 rounded accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 p-5 sm:p-6 rounded-xl shadow-sm border border-emerald-200 mt-8 mb-6 relative overflow-hidden dark:bg-emerald-950/20 dark:border-emerald-900/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-lg font-black text-emerald-800 flex items-center gap-2 mb-2 dark:text-emerald-400">
          <Save className="text-emerald-600 w-5 h-5"/> Centro de Backup e Segurança
        </h3>
        <p className="text-sm text-emerald-700 mb-4 max-w-3xl dark:text-emerald-500/70">
          Proteja o seu progresso. Exporte os seus dados para um arquivo local ou restaure um backup anterior. Recomendamos fazer um backup semanal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              const state = useStore.getState();
              const dataToExport = {};
              PERSISTED_KEYS.forEach(key => { if (state[key] !== undefined) dataToExport[key] = state[key]; });
              
              const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `qg-prf-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Backup exportado com sucesso!");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4"/> Exportar Backup (.json)
          </button>
          
          <label className="bg-white hover:bg-slate-50 text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer dark:bg-slate-900 dark:border-emerald-800">
            <Plus className="w-4 h-4"/> Importar Backup
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const content = event.target.result;
                    const parsed = JSON.parse(content);

                    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                      throw new Error('formato inválido');
                    }
                    // Exige ao menos uma chave reconhecida para não sobrescrever tudo com um arquivo vazio
                    if (!PERSISTED_KEYS.some(k => parsed[k] !== undefined)) {
                      throw new Error('backup sem dados reconhecíveis');
                    }

                    // Mescla sobre os defaults: chaves ausentes no backup não ficam undefined
                    const merged = { ...getCleanInitialState() };
                    PERSISTED_KEYS.forEach(k => { if (parsed[k] !== undefined) merged[k] = parsed[k]; });

                    // Hidratar dates
                    if (merged.calendarDate) merged.calendarDate = new Date(merged.calendarDate);
                    if (merged.reviewCalendarDate) merged.reviewCalendarDate = new Date(merged.reviewCalendarDate);

                    useStore.setState(merged);
                    await useStore.getState().saveToCloud();
                    toast.success("Backup restaurado com sucesso!");
                  } catch {
                    toast.error("Arquivo de backup inválido.");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Central de Versão e Atualizações */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mt-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Versão do Aplicativo
            </h3>
            <span className="font-mono font-bold text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {APP_VERSION}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Se uma atualização recente não carregar automaticamente, use o botão ao lado para limpar o cache local e forçar o recarregamento.
          </p>
        </div>
        <button
          onClick={handleForceUpdate}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Forçar Atualização / Limpar Cache
        </button>
      </div>

      <div className="bg-red-50 p-5 sm:p-6 rounded-xl shadow-sm border border-red-200 mt-4 mb-6 relative overflow-hidden dark:bg-red-950/20 dark:border-red-900/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-lg font-black text-red-800 flex items-center gap-2 mb-2 dark:text-red-400">
          <AlertTriangle className="text-red-600 w-5 h-5"/> Zona de Perigo (Reset & Purga de Dados)
        </h3>
        <p className="text-sm text-red-700 mb-4 max-w-3xl dark:text-red-500/70">
          Gerenciamento modular de dados: selecione exatamente o que deseja apagar (tudo, somente disciplinas, somente Raio-X Caveira, somente FSRS, dados do Duelo CTB, carreira do zero, mascote K9 ou moedas/recompensas).
        </p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowResetModal(true)} 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Configurar Reset de Dados
          </button>

          <button onClick={() => {
              setGlobalModal({
                title: "⚠️ RESET ABSOLUTO ⚠️",
                message: "ESTA AÇÃO É IRREVERSÍVEL! Isto apagará TUDO: matérias, assuntos, histórico, moedas e progresso. O sistema voltará a uma tela em branco (vazia). Deseja DESTRUIR todos os dados?",
                onConfirm: () => {
                  executeTotalWipe();
                  toast.error("SISTEMA ZERADO ABSOLUTAMENTE.");
                }
              });
            }} 
            className="w-full sm:w-auto bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-500/10 px-5 py-2.5 rounded-lg font-black transition-colors cursor-pointer"
          >
            Zerar Tudo Imediatamente
          </button>
        </div>
      </div>
      {/* Modal de Edição de Disciplina (Estilo Compacto Centralizado) */}
      {editingSubjectId && draftSubject && createPortal((
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[120] p-3 sm:p-6 overflow-y-auto fade-in">
          <div className="bg-[#0f172a] rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-800 relative overflow-hidden flex flex-col h-[90vh] max-h-[90vh] my-auto">
            
            {/* Barra de Progresso Topo */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 opacity-80 z-10"></div>

            {/* Cabeçalho Fixo */}
            <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-[22px] font-black text-white uppercase tracking-tight leading-none mb-1">
                  Configurar Disciplina
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  ID: {draftSubject.id}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (draftSubject.name && draftSubject.name.trim() !== "") {
                    setSubjects(prev => ({ ...prev, [draftSubject.id]: draftSubject }));
                  }
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                }}
                className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo com rolagem independente */}
            <div ref={modalBodyRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nome Operacional</label>
                <input 
                  type="text" 
                  value={draftSubject.name}
                  onChange={(e) => setDraftSubject(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 font-bold text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="EX: PORTUGUÊS..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Alocação de Bloco</label>
                <select 
                  value={draftSubject.block}
                  onChange={(e) => setDraftSubject(prev => ({ ...prev, block: e.target.value }))}
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 font-bold text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="B1">Bloco I (Básicas)</option>
                  <option value="B2">Bloco II (Trânsito)</option>
                  <option value="B3">Bloco III (Direito)</option>
                </select>
              </div>
            </div>

            {/* Cores */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Identidade Visual ({availableColors?.length || 18} Cores Disponíveis)
                </label>
                {draftSubject.color && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-xs ${draftSubject.color}`}>
                    Cor Selecionada
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                {availableColors.map(c => {
                  const isSelected = draftSubject.color === c.color;
                  const isDarkText = c.color.includes('text-slate-950') || c.color.includes('text-slate-900');
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraftSubject(prev => ({ ...prev, color: c.color }))}
                      title={c.label}
                      className={`h-9 rounded-lg transition-all relative flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a] shadow-lg scale-105 z-10' 
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-full h-full rounded-lg ${c.color.split(' ')[0]} flex items-center justify-center shadow-xs`}>
                        {isSelected && (
                          <Check className={`w-4 h-4 stroke-[3] ${isDarkText ? 'text-slate-950' : 'text-white'}`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Velocidade de Vídeo-Aula (Aceleração Padrão) */}
            <div className="mb-6 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FastForward className="w-3.5 h-3.5 text-blue-400" /> Velocidade de Reprodução Padrão (Aceleração)
                </label>
                <span className="text-xs font-black text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                  {draftSubject.speed || 1}x
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Defina em qual velocidade você assiste as videoaulas desta matéria. O sistema recalcula os tempos reais de estudo.
              </p>
              <div className="flex gap-2 mb-3">
                {[1, 1.25, 1.5, 1.75, 2].map(s => {
                  const isSel = (draftSubject.speed || 1) === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDraftSubject(prev => ({ ...prev, speed: s }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {s}x
                    </button>
                  );
                })}
              </div>

              {/* Comparativo de Tempo da Matéria */}
              {(() => {
                const stats = getSubjectVideoStats(draftSubject);
                return (
                  <div className="grid grid-cols-3 gap-2 bg-[#020617] p-2.5 rounded-lg border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase block">Sem Aceleração</span>
                      <span className="text-xs font-black text-slate-300">{stats.totalFriendly}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-blue-400 uppercase block">Com Aceleração ({(draftSubject.speed || 1)}x)</span>
                      <span className="text-xs font-black text-blue-400">{stats.acceleratedFriendly}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-emerald-400 uppercase block">Tempo Economizado</span>
                      <span className="text-xs font-black text-emerald-400">
                        {stats.savedSeconds > 0 ? `-${stats.savedFriendly} (${stats.percentSaved}%)` : '0m'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Meta de Tempo por Bloco de Estudo no Ciclo */}
            <div className="mb-6 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" /> Meta de Tempo por Bloco no Ciclo (Distribuição Automática)
                </label>
                <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                  {draftSubject.timeGoalMinutes > 0 ? formatMinutesToFriendly(draftSubject.timeGoalMinutes) : 'Sem meta (1 aula)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Defina quanto tempo você quer estudar desta matéria em cada bloco do seu cronograma (ex: 1h30). O sistema agrupará as videoaulas calculando o tempo acelerado até completar a meta.
              </p>
              
              {/* Presets Rápidos */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {[
                  { label: '1 Aula', val: 0 },
                  { label: '45m', val: 45 },
                  { label: '1h', val: 60 },
                  { label: '1h 30m', val: 90 },
                  { label: '2h', val: 120 }
                ].map(preset => {
                  const isSel = (draftSubject.timeGoalMinutes || 0) === preset.val;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setDraftSubject(prev => ({ ...prev, timeGoalMinutes: preset.val }))}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                        isSel
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Input customizado de minutos */}
              <div className="flex items-center justify-between bg-[#020617] p-2.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 font-bold">Tempo personalizado (em minutos):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="360"
                    step="5"
                    value={draftSubject.timeGoalMinutes || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setDraftSubject(prev => ({ ...prev, timeGoalMinutes: val }));
                    }}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-black text-emerald-400 outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-500 font-bold">min</span>
                </div>
              </div>

              {/* Preview de quantas aulas cabem */}
              {draftSubject.timeGoalMinutes > 0 && (() => {
                const firstTopic = (draftSubject.topics || []).find(t => (t.lessons && t.lessons.length > 0) || t.total > 0);
                const spd = draftSubject.speed || 1;
                const sample = firstTopic
                  ? calculateLessonsForGoal(firstTopic.lessons || [], 0, spd, draftSubject.timeGoalMinutes, firstTopic.total)
                  : null;
                return (
                  <div className="mt-3 p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-[11px] text-emerald-300 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Com a meta de <strong>{formatMinutesToFriendly(draftSubject.timeGoalMinutes)}</strong> a <strong>{spd}x</strong>, 
                      cada bloco agrupará <strong>~{sample?.count || 2} aulas</strong> no cronograma.
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Transição ao Concluir Edital / Aulas */}
            <div className="mb-6 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" /> Transição ao Concluir Conteúdo (O Que Fazer com a Vaga?)
                </label>
                <span className="text-[10px] font-black text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded uppercase">
                  {draftSubject.onCompleteAction === 'replace' ? 'Substituir' : draftSubject.onCompleteAction === 'ask' ? 'Perguntar' : 'Dobrar Restantes'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Quando todas as aulas desta matéria forem concluídas, o que o cronograma e o calendário devem fazer com os blocos vagos?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                {/* Opção 1: Dobrar */}
                <button
                  type="button"
                  onClick={() => setDraftSubject(prev => ({ ...prev, onCompleteAction: 'double_remaining' }))}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    (draftSubject.onCompleteAction || 'double_remaining') === 'double_remaining'
                      ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Dobrar Restantes
                    </span>
                    {(draftSubject.onCompleteAction || 'double_remaining') === 'double_remaining' && (
                      <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    A vaga é absorvida pelas outras matérias pendentes (ex: 2 aulas de Física por dia).
                  </p>
                </button>

                {/* Opção 2: Substituir */}
                <button
                  type="button"
                  onClick={() => setDraftSubject(prev => ({ ...prev, onCompleteAction: 'replace' }))}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    draftSubject.onCompleteAction === 'replace'
                      ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Shuffle className="w-3.5 h-3.5 text-emerald-400" /> Nova Disciplina
                    </span>
                    {draftSubject.onCompleteAction === 'replace' && (
                      <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Uma matéria cadastrada entrará no lugar desta assim que suas aulas acabarem.
                  </p>
                </button>

                {/* Opção 3: Perguntar */}
                <button
                  type="button"
                  onClick={() => setDraftSubject(prev => ({ ...prev, onCompleteAction: 'ask' }))}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                    draftSubject.onCompleteAction === 'ask'
                      ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> Perguntar Depois
                    </span>
                    {draftSubject.onCompleteAction === 'ask' && (
                      <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    O sistema pausará o bloco e perguntará a sua decisão quando a última aula for assistida.
                  </p>
                </button>
              </div>

              {/* Se escolher substituir por outra matéria, exibe o seletor */}
              {draftSubject.onCompleteAction === 'replace' && (
                <div className="bg-[#020617] p-3 rounded-lg border border-slate-800 mt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
                    Qual disciplina deve entrar nesta vaga quando concluir?
                  </label>
                  <select
                    value={draftSubject.replacementSubjectId || ''}
                    onChange={(e) => setDraftSubject(prev => ({ ...prev, replacementSubjectId: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Selecione uma matéria substituta --</option>
                    {Object.values(subjects || {})
                      .filter(s => s.id !== draftSubject.id)
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.topics?.reduce((acc, t) => acc + (t.total || 0), 0) || 0} aulas cadastradas)
                        </option>
                      ))}
                  </select>
                  {(!draftSubject.replacementSubjectId || !subjects[draftSubject.replacementSubjectId]) && (
                    <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Selecione uma disciplina acima para assumir a vaga automaticamente.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Assuntos */}
            <div>
              <div className="flex justify-between items-end mb-3 border-b border-slate-800 pb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Conteúdo Programático (Assuntos)</label>
                <button 
                  onClick={() => {
                    setDraftSubject(prev => {
                      const newTopics = [...(prev.topics || [])];
                      newTopics.push({ id: 't' + Date.now(), name: 'NOVO ASSUNTO', total: 0, completed: 0, lessons: [] });
                      return { ...prev, topics: newTopics };
                    });
                    setTimeout(() => {
                      if (modalBodyRef.current) {
                        modalBodyRef.current.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' });
                      }
                    }, 60);
                  }}
                  className="flex items-center gap-1 text-[9px] font-black text-blue-500 bg-blue-900/30 px-2 py-1 rounded tracking-widest uppercase hover:text-white hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3"/> Add Assunto
                </button>
              </div>
              
              <div className="space-y-3">
                {(draftSubject.topics || []).map((topic, idx) => (
                  <div key={topic.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    {/* Linha do nome do assunto */}
                    <div className="flex gap-2 items-center mb-2">
                      <input 
                        type="text" 
                        value={topic.name}
                        onChange={(e) => setDraftSubject(prev => {
                          const newTopics = [...prev.topics];
                          newTopics[idx] = { ...newTopics[idx], name: e.target.value };
                          return { ...prev, topics: newTopics };
                        })}
                        className="flex-1 bg-transparent border-b border-slate-700 pb-1 font-bold text-xs text-white outline-none focus:border-blue-500 transition-colors"
                        placeholder="Nome do Assunto..."
                      />
                      {/* Botão escanear aulas */}
                      <button
                        onClick={() => setScannerTopicIdx(idx)}
                        title="Adicionar aulas via Vision AI"
                        className="flex items-center gap-1 text-[9px] font-black text-violet-400 bg-violet-900/30 px-2 py-1 rounded tracking-widest uppercase hover:text-white hover:bg-violet-600 transition-colors shrink-0"
                      >
                        <ScanLine className="w-3 h-3"/> Scan
                      </button>
                      <button 
                        onClick={() => setDraftSubject(prev => ({
                          ...prev,
                          topics: prev.topics.filter((_, i) => i !== idx)
                        }))}
                        className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>

                    {/* Lista de aulas internas */}
                    {(topic.lessons && topic.lessons.length > 0) ? (
                      <div className="space-y-1 mt-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {topic.lessons.length} aula{topic.lessons.length !== 1 ? 's' : ''} cadastrada{topic.lessons.length !== 1 ? 's' : ''}
                        </p>
                        {topic.lessons.map((lesson, lIdx) => {
                          const isFirst = lIdx === 0;
                          const isLast = lIdx === topic.lessons.length - 1;
                          const moveLesson = (from, to) => setDraftSubject(prev => {
                            const newTopics = [...prev.topics];
                            const newLessons = [...(newTopics[idx].lessons || [])];
                            const [moved] = newLessons.splice(from, 1);
                            newLessons.splice(to, 0, moved);
                            newTopics[idx] = { ...newTopics[idx], lessons: newLessons };
                            return { ...prev, topics: newTopics };
                          });
                          const insertAfter = (afterIdx) => setDraftSubject(prev => {
                            const newTopics = [...prev.topics];
                            const newLessons = [...(newTopics[idx].lessons || [])];
                            newLessons.splice(afterIdx + 1, 0, { name: 'NOVA AULA', duration: '00:00' });
                            newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                            return { ...prev, topics: newTopics };
                          });
                          return (
                            <div key={lIdx}>
                              <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5">
                                {/* Controles de ordem */}
                                <div className="flex flex-col gap-0.5 shrink-0">
                                  <button
                                    onClick={() => moveLesson(lIdx, lIdx - 1)}
                                    disabled={isFirst}
                                    className="p-0.5 text-slate-600 hover:text-blue-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                    title="Mover para cima"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => moveLesson(lIdx, lIdx + 1)}
                                    disabled={isLast}
                                    className="p-0.5 text-slate-600 hover:text-blue-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                    title="Mover para baixo"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 shrink-0 w-4 text-right">{lIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={lesson.name}
                                  onPaste={(e) => e.stopPropagation()}
                                  onChange={(e) => setDraftSubject(prev => {
                                    const newTopics = [...prev.topics];
                                    const newLessons = [...(newTopics[idx].lessons || [])];
                                    newLessons[lIdx] = { ...newLessons[lIdx], name: e.target.value };
                                    newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                                    return { ...prev, topics: newTopics };
                                  })}
                                  className="flex-1 bg-transparent text-[11px] font-bold text-slate-200 outline-none border-b border-transparent focus:border-violet-500 pb-0.5 transition-colors min-w-0"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <input
                                    type="text"
                                    value={lesson.duration || '00:00'}
                                    onPaste={(e) => e.stopPropagation()}
                                    onChange={(e) => setDraftSubject(prev => {
                                      const newTopics = [...prev.topics];
                                      const newLessons = [...(newTopics[idx].lessons || [])];
                                      newLessons[lIdx] = { ...newLessons[lIdx], duration: e.target.value };
                                      newTopics[idx] = { ...newTopics[idx], lessons: newLessons };
                                      return { ...prev, topics: newTopics };
                                    })}
                                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-[10px] font-mono text-emerald-400 outline-none"
                                  />
                                  {draftSubject.speed && draftSubject.speed > 1 && lesson.duration && lesson.duration !== '00:00' && (
                                    <span 
                                      className="text-[9px] font-mono font-bold text-blue-400 bg-blue-950/80 px-1 py-0.5 rounded border border-blue-900"
                                      title={`Com aceleração de ${draftSubject.speed}x`}
                                    >
                                      ⚡{formatSecondsToClock(Math.round(parseDurationToSeconds(lesson.duration) / draftSubject.speed))}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setDraftSubject(prev => {
                                    const newTopics = [...prev.topics];
                                    const newLessons = (newTopics[idx].lessons || []).filter((_, i) => i !== lIdx);
                                    newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                                    return { ...prev, topics: newTopics };
                                  })}
                                  className="p-0.5 text-slate-600 hover:text-red-400 transition-colors shrink-0"
                                  title="Remover aula"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Inserir aula abaixo deste item */}
                              <button
                                onClick={() => insertAfter(lIdx)}
                                className="w-full flex items-center justify-center gap-1 text-[8px] font-black text-slate-700 hover:text-violet-400 hover:bg-violet-900/10 py-0.5 rounded transition-all group mt-0.5"
                                title="Inserir aula aqui"
                              >
                                <div className="flex-1 h-px bg-slate-800 group-hover:bg-violet-800/50 transition-colors" />
                                <Plus className="w-2.5 h-2.5" />
                                <span className="uppercase tracking-widest">inserir aqui</span>
                                <div className="flex-1 h-px bg-slate-800 group-hover:bg-violet-800/50 transition-colors" />
                              </button>
                            </div>
                          );
                        })}
                        {/* Adicionar aula manual */}
                        <button
                          onClick={() => setDraftSubject(prev => {
                            const newTopics = [...prev.topics];
                            const newLessons = [...(newTopics[idx].lessons || []), { name: 'NOVA AULA', duration: '00:00' }];
                            newTopics[idx] = { ...newTopics[idx], lessons: newLessons, total: newLessons.length };
                            return { ...prev, topics: newTopics };
                          })}
                          className="flex items-center gap-1 text-[9px] font-black text-slate-500 hover:text-white px-2 py-1 rounded transition-colors mt-1"
                        >
                          <Plus className="w-3 h-3" /> Adicionar aula manualmente
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-slate-600 italic">Nenhuma aula. Use o botão Scan ou adicione manualmente.</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-slate-500 uppercase font-black">Qtd manual:</span>
                          <input 
                            type="number" 
                            value={topic.total || 0}
                            min={0}
                            onChange={(e) => setDraftSubject(prev => {
                              const newTopics = [...prev.topics];
                              newTopics[idx] = { ...newTopics[idx], total: parseInt(e.target.value) || 0 };
                              return { ...prev, topics: newTopics };
                            })}
                            className="w-12 bg-[#020617] border border-slate-800 rounded px-1 py-1 text-center text-xs font-black text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(draftSubject.topics || []).length === 0 && (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    <p className="text-[11px] font-bold text-slate-500 italic">Nenhum assunto cadastrado. Clique no botão abaixo para adicionar.</p>
                  </div>
                )}
              </div>

              {/* Botão Adicionar Assunto no Final da Lista de Aulas/Tópicos */}
              <button
                type="button"
                onClick={() => {
                  setDraftSubject(prev => {
                    const newTopics = [...(prev.topics || [])];
                    newTopics.push({ id: 't' + Date.now(), name: 'NOVO ASSUNTO', total: 0, completed: 0, lessons: [] });
                    return { ...prev, topics: newTopics };
                  });
                  setTimeout(() => {
                    if (modalBodyRef.current) {
                      modalBodyRef.current.scrollTo({ top: modalBodyRef.current.scrollHeight, behavior: 'smooth' });
                    }
                  }, 60);
                }}
                className="w-full mt-4 py-3.5 bg-blue-600/15 hover:bg-blue-600/25 border-2 border-dashed border-blue-500/40 hover:border-blue-400 text-blue-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer group"
              >
                <Plus className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>+ Adicionar Assunto</span>
              </button>
            </div>

            {/* Fim do Conteúdo Rolável */}
            </div>

            {/* Ações Fixas no Rodapé */}
            <div className="p-6 pt-3 border-t border-slate-800 bg-[#0f172a] shrink-0 flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  if (!draftSubject.name || draftSubject.name.trim() === "") {
                    toast.error("Por favor, defina um nome para a disciplina.");
                    return;
                  }
                  setSubjects(prev => ({ ...prev, [draftSubject.id]: draftSubject }));
                  if (draftSubject.timeGoalMinutes !== undefined) {
                    setSubjectTimeGoal(draftSubject.id, draftSubject.timeGoalMinutes || 0);
                  }
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                  toast.success("Disciplina salva com sucesso!");
                }}
                className="w-full py-3.5 bg-[#1d4ed8] hover:bg-blue-600 outline-none focus:ring-4 focus:ring-blue-500/50 text-white font-black rounded-xl shadow-[0_0_20px_rgba(29,78,216,0.3)] transition-all transform active:scale-[0.99] flex items-center justify-center uppercase tracking-widest text-sm cursor-pointer"
              >
                Salvar Configurações
              </button>
              <button 
                onClick={() => {
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                }}
                className="w-full py-2 text-slate-400 font-bold hover:text-white transition-colors uppercase text-[10px] tracking-widest cursor-pointer"
              >
                Cancelar Edição
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Scanner de aulas para assunto específico */}
      {scannerTopicIdx !== null && draftSubject && (
        <TopicLessonScanner
          topicName={(draftSubject.topics || [])[scannerTopicIdx]?.name || 'Assunto'}
          onClose={() => setScannerTopicIdx(null)}
          onConfirm={(newLessons, newTopicName) => {
            setDraftSubject(prev => {
              const newTopics = [...(prev.topics || [])];
              const existing = newTopics[scannerTopicIdx].lessons || [];
              const merged = [...existing, ...newLessons];
              newTopics[scannerTopicIdx] = {
                ...newTopics[scannerTopicIdx],
                name: (newTopicName && newTopicName.trim()) ? newTopicName.trim() : newTopics[scannerTopicIdx].name,
                lessons: merged,
                total: merged.length
              };
              return { ...prev, topics: newTopics };
            });
            setScannerTopicIdx(null);
            if (newTopicName && newTopicName.trim()) {
              toast.success(`Assunto renomeado para "${newTopicName.trim()}" e ${newLessons.length} aula(s) adicionada(s)!`);
            } else {
              toast.success(`${newLessons.length} aula(s) adicionada(s) ao assunto!`);
            }
          }}
        />
      )}

      {showImportOCR && (
        <ImportOCR
          subjects={subjects}
          setSubjects={setSubjects}
          availableColors={availableColors}
          onClose={() => setShowImportOCR(false)}
        />
      )}

      {showResetModal && (
        <SelectiveResetModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
        />
      )}

    </div>
  );
}
