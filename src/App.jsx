import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import { useStore } from './store/useStore';
import Dashboard from './pages/Dashboard';
import ClassCompletionModal from './components/ClassCompletionModal';

// Code-splitting: páginas carregadas sob demanda
const TreinoTAF = React.lazy(() => import('./pages/TreinoTAF'));
const Simulados = React.lazy(() => import('./pages/Simulados'));
const Estatisticas = React.lazy(() => import('./pages/Estatisticas'));
const Loja = React.lazy(() => import('./pages/Loja'));
const Revisoes = React.lazy(() => import('./pages/Revisoes'));
const Ciclo = React.lazy(() => import('./pages/Ciclo'));
const Calendario = React.lazy(() => import('./pages/Calendario'));
const Config = React.lazy(() => import('./pages/Config'));
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, Library, Clock, Calendar as CalendarIcon, Repeat, Dumbbell, 
  Target as TargetIcon, BarChart2, Store, Settings, Award, BrainCircuit, 
  X, Check, ArrowRight, ShieldCheck, Trophy, Sun, Moon, Coins, 
  AlertTriangle, Info, LogOut, Shield 
} from 'lucide-react';
import { PATENTES } from './hooks/useGamification';

const availableColors = [
  { id: 'slate', color: 'bg-slate-200 text-slate-900', label: 'Cinza' },
  { id: 'blue', color: 'bg-blue-200 text-blue-900', label: 'Azul' },
  { id: 'emerald', color: 'bg-emerald-200 text-emerald-900', label: 'Esmeralda' },
  { id: 'red', color: 'bg-red-200 text-red-900', label: 'Vermelho' },
  { id: 'yellow', color: 'bg-yellow-200 text-yellow-900', label: 'Amarelo' },
  { id: 'purple', color: 'bg-purple-200 text-purple-900', label: 'Roxo' },
  { id: 'orange', color: 'bg-orange-200 text-orange-900', label: 'Laranja' },
  { id: 'indigo', color: 'bg-indigo-700 text-white', label: 'Anil' },
  { id: 'rose', color: 'bg-rose-700 text-white', label: 'Rosa' },
  { id: 'cyan', color: 'bg-cyan-700 text-white', label: 'Ciano' }
];

export default function App() {
  const {
    coins,
    userStats,
    isDarkMode, setIsDarkMode,
    getCurrentPatente,
    getLocalDateStr, globalModal, setGlobalModal,
    reviews,
    reviewModal, setReviewModal,
    classConfirmModal, setClassConfirmModal,
    replaceSubjectModal, setReplaceSubjectModal,
    handleReviewSubmit, watchClass, handleReplaceSubject,
    subjects, isSyncing,
    session, setSession, loadFromCloud, signOut,
    getCurrentPatente, playSound
  } = useStore();
  
  const [promotionModal, setPromotionModal] = useState(null);
  const lastPatenteId = useRef(null);

  const [reviewInputs, setReviewInputs] = useState({ total: 10, correct: 0 });
  const location = useLocation();

  // Memoizar predição FSRS para evitar recalcular 4x por render
  const fsrsPrediction = useMemo(() => {
    if (!reviewModal || reviewInputs.total <= 0) return null;
    const perf = reviewInputs.correct / reviewInputs.total;
    let rating = 3;
    if (perf >= 1.0) rating = 4;
    else if (perf >= 0.80) rating = 3;
    else if (perf >= 0.60) rating = 2;
    else rating = 1;
    const { updateFsrsCard } = useStore.getState();
    return updateFsrsCard(reviewModal, rating);
  }, [reviewModal, reviewInputs.correct, reviewInputs.total]);

  // Sincronizar o tema escuro com o elemento raiz para suportar Portais
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- AUTH & INITIALIZATION ---
  // PONTO ÚNICO DE INICIALIZAÇÃO: onAuthStateChange dispara INITIAL_SESSION automaticamente
  // Isso elimina a race condition causada pela dupla chamada de loadFromCloud
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log(`🔐 [Auth] Evento detectado: ${event}`);

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setSession(session);
        if (session?.user) {
          // Bloqueio de segurança: se já estivermos carregando, não dispare de novo
          if (!useStore.getState().isLoadingFromCloud) {
             // Pequeno delay para evitar Lock contention do Supabase na largada
             setTimeout(async () => {
                await loadFromCloud();
             }, 400);
          } else {
             console.log('⏳ [Auth] Carregamento já em curso, ignorando disparo duplo.');
          }
        } else {
          useStore.setState({ isSyncing: false, isLoadingFromCloud: false });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        useStore.setState({ isSyncing: false, isLoadingFromCloud: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, loadFromCloud]);

  // --- MONITOR DE PROMOÇÃO ---
  useEffect(() => {
    const currentP = getCurrentPatente();
    if (!lastPatenteId.current) {
      lastPatenteId.current = currentP.id;
      return;
    }
    
    if (currentP.id !== lastPatenteId.current) {
      const oldIdx = PATENTES.findIndex(p => p.id === lastPatenteId.current);
      const newIdx = PATENTES.findIndex(p => p.id === currentP.id);
      
      if (newIdx > oldIdx) {
        setPromotionModal(currentP);
        playSound('levelUp');
      }
      lastPatenteId.current = currentP.id;
    }
  }, [userStats.xp, getCurrentPatente, playSound]);

  if (!session) {
    return <Login />;
  }

  const todayStr = getLocalDateStr();
  const allDueToday = reviews.filter(r => r.nextDateStr <= todayStr);

  const tabs = [
    { id: '/', label: 'Carreira', icon: Award },
    { id: '/revisoes', label: 'Revisões', icon: BrainCircuit, count: allDueToday.length },
    { id: '/ciclo', label: 'Ciclo', icon: Repeat },
    { id: '/calendario', label: 'Calendário', icon: CalendarIcon },
    { id: '/taf', label: 'Treino TAF', icon: Dumbbell },
    { id: '/simulados', label: 'Simulados', icon: TargetIcon },
    { id: '/estatisticas', label: 'Estatísticas', icon: BarChart2 },
    { id: '/loja', label: 'Loja', icon: Store },
    { id: '/config', label: 'Ajustes', icon: Settings },
  ];

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-right" richColors closeButton />
      
      <header className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900'} text-white shadow-md sticky top-0 z-50`}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <Award className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
            <h1 className="text-lg sm:text-xl font-bold tracking-wider text-white">QG DA PRF</h1>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Patente Badge */}
            <div className={`hidden lg:flex flex-col items-center gap-1 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700 shadow-sm ${getCurrentPatente().color}`}>
               <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{getCurrentPatente().icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{getCurrentPatente().name}</span>
               </div>
               <div className="w-24 bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-current h-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                    style={{ width: `${Math.min(100, (userStats.xp % 1000) / 10)}%` }}
                  ></div>
               </div>
            </div>


            {/* Coins */}
            <div className="flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-sm">
              <Coins className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-black text-sm sm:text-lg text-white">{coins}</span>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={signOut}
              className="p-2 sm:p-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-full border border-red-500/20 transition-all"
              title="Sair do QG"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Dark Mode Toggle */}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 sm:p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all text-white">
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        <nav className="max-w-[1400px] mx-auto px-2 sm:px-4 overflow-x-auto no-scrollbar border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            {tabs.map(tab => (
              <NavLink 
                key={tab.id}
                to={tab.id}
                className={({ isActive }) => `flex items-center gap-2 py-3 sm:py-4 px-1 border-b-4 transition-all whitespace-nowrap text-sm font-black uppercase tracking-tighter sm:tracking-normal ${
                  isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                    {tab.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-10">
        {isSyncing ? (
          <div className="flex flex-col items-center justify-center p-20 text-center opacity-80 animate-pulse">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
               <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Sincronizando Nuvem...</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">Puxando seus dados seguros em tempo real.</p>
            <button 
              onClick={() => useStore.setState({ isSyncing: false })} 
              className="mt-8 text-[11px] font-black tracking-widest uppercase text-slate-400 hover:text-blue-500 transition-colors underline decoration-slate-300 dark:decoration-slate-700"
            >
              Acesso de Emergência (Pular Sincronização)
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Carregando módulo...</span>
                  </div>
                </div>
              }>
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/revisoes" element={<Revisoes />} />
                  <Route path="/ciclo" element={<Ciclo />} />
                  <Route path="/calendario" element={<Calendario />} />
                  <Route path="/taf" element={<TreinoTAF />} />
                  <Route path="/simulados" element={<Simulados />} />
                  <Route path="/estatisticas" element={<Estatisticas />} />
                  <Route path="/loja" element={<Loja />} />
                  <Route path="/config" element={<Config availableColors={availableColors} />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Modais do Sistema - Renderizados via Portal para garantir z-index absoluto */}
      
      {/* 1. Modal de Avaliação de Revisão */}
      {reviewModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4 fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-black mb-1 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BrainCircuit className="text-red-500 w-6 h-6" /> Avaliar Retenção
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider">{reviewModal.topicName}</p>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Total de Questões</label>
                  <input 
                    type="number" 
                    min="1"
                    value={reviewInputs.total}
                    onChange={(e) => setReviewInputs(prev => ({ ...prev, total: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 font-black text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Acertos</label>
                  <input 
                    type="number" 
                    min="0"
                    max={reviewInputs.total}
                    value={reviewInputs.correct}
                    onChange={(e) => setReviewInputs(prev => ({ ...prev, correct: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 font-black text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {reviewInputs.total > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Aproveitamento</span>
                    <span className={`text-sm font-black ${ (reviewInputs.correct / reviewInputs.total) >= 0.8 ? 'text-emerald-500' : (reviewInputs.correct / reviewInputs.total) >= 0.6 ? 'text-blue-500' : 'text-red-500'}`}>
                      {Math.round((reviewInputs.correct / reviewInputs.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${ (reviewInputs.correct / reviewInputs.total) >= 0.8 ? 'bg-emerald-500' : (reviewInputs.correct / reviewInputs.total) >= 0.6 ? 'bg-blue-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (reviewInputs.correct / reviewInputs.total) * 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Métricas Técnicas FSRS */}
                  <div className="mt-3 flex justify-between px-1">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Dificuldade</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {fsrsPrediction ? fsrsPrediction.difficulty.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Estabilidade</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {fsrsPrediction ? fsrsPrediction.stability.toFixed(1) + 'd' : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Intervalo</p>
                      <p className="text-xs font-black text-blue-600">
                        {fsrsPrediction ? fsrsPrediction.nextInterval + 'd' : '—'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Previsão de Próxima Revisão */}
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <CalendarIcon className="w-3 h-3" />
                    <span>Próxima revisão estimada em: </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {fsrsPrediction ? (() => {
                        const target = useStore.getState().getTodayDate();
                        target.setDate(target.getDate() + fsrsPrediction.nextInterval);
                        return target.toLocaleDateString();
                      })() : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <button 
                disabled={reviewInputs.total <= 0}
                onClick={() => {
                  handleReviewSubmit(reviewModal.id, reviewInputs.correct / reviewInputs.total);
                  setReviewModal(null);
                  setReviewInputs({ total: 10, correct: 0 });
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                Finalizar Auditoria
              </button>
              <button 
                onClick={() => setReviewModal(null)} 
                className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Modal de Confirmação de Aula (Componente Externo) */}
      <ClassCompletionModal 
        key={classConfirmModal?.subjectId || 'none'}
        isOpen={Boolean(classConfirmModal)}
        topicName={classConfirmModal?.topicName}
        maxClasses={classConfirmModal?.maxClasses}
        onClose={() => setClassConfirmModal(null)}
        onConfirm={(amount) => {
          watchClass(classConfirmModal.subjectId, classConfirmModal.slotIndex, amount);
          setClassConfirmModal(null);
        }}
      />

      {/* 3. Modal de Substituição de Matéria no Ciclo */}
      {replaceSubjectModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4 fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-black mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Repeat className="text-blue-500 w-6 h-6" /> Ajuste de Cronograma
            </h3>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {Object.values(subjects).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => {
                    handleReplaceSubject(replaceSubjectModal.dayIndex, replaceSubjectModal.slotIndex, replaceSubjectModal.oldSubjectId, sub.id);
                    setReplaceSubjectModal(null);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${sub.id === replaceSubjectModal.oldSubjectId ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 hover:border-slate-300 dark:border-slate-800'}`}
                >
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${sub.color}`}>{sub.name}</span>
                  <p className="text-[9px] text-slate-400 mt-1 font-bold">Trocar por esta</p>
                </button>
              ))}
            </div>
            <button onClick={() => setReplaceSubjectModal(null)} className="w-full mt-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px]">Manter Atual</button>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Modal Global de Alertas e Confirmações (Reset, Erros, etc.) */}
      {globalModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[120] p-4 fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 dark:border-slate-800 relative">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              globalModal.onConfirm 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.2)]' 
                : globalModal.isAlert 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {globalModal.onConfirm ? <AlertTriangle className="w-8 h-8" /> : globalModal.isAlert ? <Info className="w-8 h-8" /> : <Check className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-slate-100">{globalModal.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-bold text-sm">{globalModal.message}</p>
            
            <div className="flex flex-col gap-3">
              {globalModal.onConfirm ? (
                <>
                  <button 
                    onClick={() => {
                      globalModal.onConfirm();
                      setGlobalModal(null);
                    }}
                    className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all transform active:scale-95"
                  >
                    CONFIRMAR OPERAÇÃO
                  </button>
                  <button 
                    onClick={() => setGlobalModal(null)}
                    className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px]"
                  >
                    Abortar Missão
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setGlobalModal(null)}
                  className="w-full py-3 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/10"
                >
                  Ciente, Operacional!
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🎖️ MODAL DE CELEBRAÇÃO DE PROMOÇÃO */}
      <AnimatePresence>
        {promotionModal && createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="bg-slate-900 border-4 border-blue-500 rounded-[2rem] p-8 max-w-sm w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none"></div>
              
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6 relative z-10 drop-shadow-2xl flex justify-center"
              >
                {promotionModal.icon}
              </motion.div>
              
              <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Promoção de Carreira</h2>
              <h1 className={`text-4xl font-black uppercase mb-4 tracking-tighter ${promotionModal.color}`}>
                {promotionModal.name}
              </h1>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">
                Parabéns, combatente! Sua dedicação e disciplina elevaram seu status operacional. Um novo patamar de honra foi alcançado.
              </p>
              
              <button 
                onClick={() => setPromotionModal(null)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
              >
                Assumir Posto
              </button>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}