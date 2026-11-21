import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import { useStore } from './store/useStore';
import Dashboard from './pages/Dashboard';
import ClassCompletionModal from './components/ClassCompletionModal';
import CaveiraReviewQuestionModal from './components/CaveiraReviewQuestionModal';
import RankBadge from './components/RankBadge';
import TacticalCountdownBanner from './components/TacticalCountdownBanner';
import { useConfetti } from './hooks/useConfetti';

// Code-splitting: páginas carregadas sob demanda
const TreinoTAF = React.lazy(() => import('./pages/TreinoTAF'));
const Simulados = React.lazy(() => import('./pages/Simulados'));
const Loja = React.lazy(() => import('./pages/Loja'));
const CentralEstudos = React.lazy(() => import('./pages/CentralEstudos'));
const Revisoes = React.lazy(() => import('./pages/Revisoes'));
const Estatisticas = React.lazy(() => import('./pages/Estatisticas'));
const Edital = React.lazy(() => import('./pages/Edital'));
const Config = React.lazy(() => import('./pages/Config'));
const Pet = React.lazy(() => import('./pages/Pet'));
const DueloFPS = React.lazy(() => import('./pages/DueloFPS'));

import { Routes, Route, Link, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, Library, Clock, Calendar as CalendarIcon, Repeat, Dumbbell, 
  Target as TargetIcon, Store, Settings, Award, BrainCircuit, BarChart2, BookOpen,
  X, Check, ArrowRight, ShieldCheck, Trophy, Sun, Moon, Coins, 
  AlertTriangle, Info, LogOut, Shield, RefreshCw, Dog, Skull, Crosshair, ListFilter,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import {
  parseCourseIndexSubtopics,
  findMatchingCourseIndexEntry,
  normalizeCourseLookupKey
} from './lib/courseIndexParser';
import { PATENTES } from './hooks/useGamification';
import { APP_VERSION } from './version';

const availableColors = [
  { id: 'blue', color: 'bg-blue-600 text-white', label: 'Azul Real' },
  { id: 'emerald', color: 'bg-emerald-500 text-slate-950', label: 'Verde Esmeralda' },
  { id: 'red', color: 'bg-red-600 text-white', label: 'Vermelho Fogo' },
  { id: 'amber', color: 'bg-amber-400 text-slate-950', label: 'Amarelo Ouro' },
  { id: 'purple', color: 'bg-purple-600 text-white', label: 'Roxo Elétrico' },
  { id: 'orange', color: 'bg-orange-500 text-white', label: 'Laranja Chama' },
  { id: 'cyan', color: 'bg-cyan-400 text-slate-950', label: 'Ciano Neon' },
  { id: 'pink', color: 'bg-pink-500 text-white', label: 'Rosa Choque' },
  { id: 'lime', color: 'bg-lime-400 text-slate-950', label: 'Verde Lima Fluor' },
  { id: 'indigo', color: 'bg-indigo-700 text-white', label: 'Índigo Profundo' },
  { id: 'fuchsia', color: 'bg-fuchsia-600 text-white', label: 'Fúcsia Magenta' },
  { id: 'teal', color: 'bg-teal-600 text-white', label: 'Verde Petróleo' },
  { id: 'sky', color: 'bg-sky-400 text-slate-950', label: 'Azul Céu' },
  { id: 'rose', color: 'bg-rose-500 text-white', label: 'Coral Vivo' },
  { id: 'forest', color: 'bg-green-700 text-white', label: 'Verde Floresta' },
  { id: 'brown', color: 'bg-amber-800 text-white', label: 'Marrom Bronze' },
  { id: 'wine', color: 'bg-rose-900 text-white', label: 'Vinho Bordô' },
  { id: 'slate', color: 'bg-slate-500 text-white', label: 'Cinza Chumbo' }
];

// Classes legadas mantidas para compatibilidade retroativa com dados existentes:
// bg-slate-200 text-slate-900 bg-blue-200 text-blue-900 bg-emerald-200 text-emerald-900 bg-red-200 text-red-900
// bg-yellow-200 text-yellow-900 bg-purple-200 text-purple-900 bg-orange-200 text-orange-900 bg-rose-700 bg-cyan-700

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
    activeTheme,
    pushSettings, pushTime
  } = useStore();
  
  const [promotionModal, setPromotionModal] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('qg_sidebar_collapsed') === 'true';
    } catch (_) {
      return false;
    }
  });
  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('qg_sidebar_collapsed', String(next)); } catch (_) {}
      return next;
    });
  };
  const [dismissedPrePromptModalRef, setDismissedPrePromptModalRef] = useState(null);
  const [courseIndexCache, setCourseIndexCache] = useState({ latest: null, byLesson: {} });
  const [manualLessonIndexMap, setManualLessonIndexMap] = useState(() => {
    try {
      const saved = localStorage.getItem('qg_lesson_index_map_v1');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });
  const [prePromptIndexText, setPrePromptIndexText] = useState('');
  const [showPrePromptIndexBox, setShowPrePromptIndexBox] = useState(false);
  const [prevPrePromptModalRef, setPrevPrePromptModalRef] = useState(null);
  const lastPatenteId = useRef(null);

  const saveManualLessonIndex = (rawText, lessonKeyName) => {
    const key = normalizeCourseLookupKey(lessonKeyName);
    if (!key) return;
    setManualLessonIndexMap(prev => {
      const next = { ...(prev || {}) };
      if (!String(rawText || '').trim()) {
        delete next[key];
      } else {
        next[key] = {
          lessonTitle: lessonKeyName,
          rawIndexText: String(rawText),
          updatedAt: Date.now()
        };
      }
      try {
        localStorage.setItem('qg_lesson_index_map_v1', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const matchedModalIndexEntry = useMemo(() => {
    if (!classConfirmModal) return null;
    return findMatchingCourseIndexEntry({
      manualIndexMap: manualLessonIndexMap,
      extensionCache: courseIndexCache,
      lessonNames: classConfirmModal.lessonNames || classConfirmModal.allRemainingLessonNames || [],
      topicName: classConfirmModal.topicName || ''
    });
  }, [classConfirmModal, manualLessonIndexMap, courseIndexCache]);

  if (prevPrePromptModalRef !== classConfirmModal) {
    setPrevPrePromptModalRef(classConfirmModal);
    const autoText = matchedModalIndexEntry?.rawIndexText || '';
    setPrePromptIndexText(autoText);
    setShowPrePromptIndexBox(false);
  }

  const prePromptSubtopics = useMemo(() => {
    if (!classConfirmModal) return [];
    const subjectName = subjects[classConfirmModal.subjectId]?.name || '';
    return parseCourseIndexSubtopics(prePromptIndexText, [
      subjectName,
      classConfirmModal.topicName,
      ...(classConfirmModal.lessonNames || [])
    ]);
  }, [classConfirmModal, prePromptIndexText, subjects]);

  const triggerCaveiraPractice = (subjectName = '', lessonNames = [], topicName = '', subtopics = [], rawIndexText = '') => {
    const isGenericLesson = (name) => {
      const clean = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      return !clean || /^testes?\s+propostos?$/.test(clean) || /^exercicios?(\s+de\s+fixacao)?$/.test(clean) || /^simulado$/.test(clean) || /^revisao$/.test(clean);
    };
    const cleanedLessons = (Array.isArray(lessonNames) ? lessonNames : [])
      .map(l => String(l || '').replace(/\s*[-–]\s*aula\s*\d+\s*$/i, '').trim())
      .filter(l => l && !isGenericLesson(l));
    const primaryLessons = cleanedLessons.length > 0 ? cleanedLessons : (topicName ? [topicName] : []);
    const cleanSubtopics = (Array.isArray(subtopics) ? subtopics : [])
      .map(s => String(s || '').trim())
      .filter(Boolean);
    const displayFilterLabel = cleanSubtopics.length > 0
      ? cleanSubtopics.slice(0, 3).join(' • ') + (cleanSubtopics.length > 3 ? ` (+${cleanSubtopics.length - 3})` : '')
      : primaryLessons.join(' • ');
    const copyText = cleanSubtopics[0] || primaryLessons[0] || topicName || subjectName;

    const hasExt = document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true';
    if (navigator.clipboard && copyText) {
      navigator.clipboard.writeText(copyText).catch(() => {});
    }
    if (hasExt) {
      window.postMessage({
        source: 'QG_WEB_APP',
        type: 'OPEN_CAVEIRA_PRACTICE',
        payload: {
          subject: subjectName,
          lessons: primaryLessons,
          topic: displayFilterLabel,
          fallbackTopic: topicName,
          subtopics: cleanSubtopics,
          rawIndexText: String(rawIndexText || '')
        }
      }, '*');
      toast.success(
        cleanSubtopics.length > 0
          ? `Abrindo Caveira com ${cleanSubtopics.length} subassuntos do Índice`
          : `Abrindo Caveira com filtro: ${displayFilterLabel || subjectName}`
      );
    } else {
      window.open('https://app.caveira.com/', '_blank', 'noopener');
      toast.info('Extensão não detectada nesta aba. Conteúdo copiado para a área de transferência!');
    }
  };

  const [reviewInputs, setReviewInputs] = useState({ total: 10, correct: 0 });
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  const { setTriggerConfetti, ConfettiCanvas } = useConfetti();

  useEffect(() => {
    if (promotionModal) {
      setTriggerConfetti(true);
    }
  }, [promotionModal, setTriggerConfetti]);

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

  // Sincronizar o tema de cores ativo
  useEffect(() => {
    if (activeTheme) {
      useStore.getState().applyTheme(activeTheme);
    }
  }, [activeTheme]);

  // --- PUSH NOTIFICATIONS (Local Simulation) ---
  useEffect(() => {
    if (!pushSettings?.enabled || !pushTime) return;

    const checkTime = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      
      const lastNotifiedDate = localStorage.getItem('lastPushNotificationDate');
      const todayStr = getLocalDateStr(now);

      if (currentTimeStr === pushTime && lastNotifiedDate !== todayStr) {
        // Trigger notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Hora de Estudar!', {
            body: 'O seu Pomodoro Tático está aguardando você. Vamos bater a meta?',
            icon: '/favicon.ico' // using default favicon if any
          });
        } else {
          // Se não tiver permissão nativa, tenta usar um toast de sistema (na UI já usa toast)
          toast('📢 Hora de Estudar!', {
            description: 'Seu lembrete de estudos diário! Vamos nessa?',
            duration: 10000,
            icon: '⏰'
          });
        }
        localStorage.setItem('lastPushNotificationDate', todayStr);
      }
    };

    // Solicita permissão apenas se estiver ativado
    if (typeof Notification !== 'undefined' && Notification.permission === 'default' && pushSettings?.enabled) {
      Notification.requestPermission();
    }

    const interval = setInterval(checkTime, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [pushSettings?.enabled, pushTime, getLocalDateStr]);

  // --- VIRADA DE DIA COM O APP ABERTO ---
  // Verifica a cada 60s e quando a aba volta a ficar visível se o dia real mudou.
  // Ao mudar: zera os blocos concluídos de ontem, reseta semana/missões e atualiza o todayKey (re-render das telas).
  useEffect(() => {
    let lastSeenDate = useStore.getState().getLocalDateStr();

    const checkDayRollover = () => {
      const state = useStore.getState();
      const currentDate = state.getLocalDateStr();
      if (currentDate !== lastSeenDate) {
        lastSeenDate = currentDate;
        state.syncDayRollover();
        state.checkAndResetWeekly();
        state.checkAndResetDailyMissions();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkDayRollover();
    };

    const interval = setInterval(checkDayRollover, 60000);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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

  // --- PONTE GLOBAL DE SINCRONIZAÇÃO COM A EXTENSÃO CAVEIRA (ATIVA EM TODAS AS ABAS DO SITE) ---
  useEffect(() => {
    const handleExtensionMessage = (event) => {
      if (event.data && event.data.source === 'QG_CAVEIRA_EXTENSION') {
        if (event.data.type === 'COURSE_INDEX_SYNC' && event.data.payload) {
          setCourseIndexCache(event.data.payload);
          return;
        }
        const currentUser = useStore.getState().user;
        const cloudReady = useStore.getState().hasCompletedInitialCloudSync;
        if (!currentUser?.id || !cloudReady) return;
        const msgUserId = event.data.payload?.userId;
        if (msgUserId && msgUserId !== currentUser.id) return;

        if (event.data.type === 'SYNC_UPDATE' && event.data.payload) {
          const { newQuestion, questions } = event.data.payload;
          if (newQuestion) {
            if (newQuestion.ownerUserId && newQuestion.ownerUserId !== currentUser.id) return;
            useStore.getState().addCaveiraQuestion(newQuestion);
          } else if (Array.isArray(questions) && questions.length > 0) {
            const scoped = questions.filter(q => q && (!q.ownerUserId || q.ownerUserId === currentUser.id));
            if (scoped.length > 0) {
              useStore.getState().importCaveiraQuestions(scoped, true);
            }
          }
        }
        if (event.data.type === 'CAVEIRA_DATA_RESPONSE' && event.data.payload) {
          const { questions } = event.data.payload;
          if (Array.isArray(questions) && questions.length > 0) {
            const scoped = questions.filter(q => q && (!q.ownerUserId || q.ownerUserId === currentUser.id));
            if (scoped.length > 0) {
              useStore.getState().importCaveiraQuestions(scoped, true);
            }
          }
        }
      }
    };

    const requestExtensionSync = () => {
      try {
        const currentUser = useStore.getState().user;
        const cloudReady = useStore.getState().hasCompletedInitialCloudSync;
        if (!currentUser?.id || !cloudReady) return;
        const currentStats = useStore.getState().userStats;
        const userLabel = (currentStats?.displayName || currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || currentUser.email || '').trim();
        window.postMessage({ source: 'QG_WEB_APP', type: 'SET_ACTIVE_USER', payload: { userId: currentUser.id, userEmail: currentUser.email || '', userLabel } }, '*');
      } catch (_) {}
    };

    window.addEventListener('message', handleExtensionMessage);
    window.addEventListener('focus', requestExtensionSync);
    requestExtensionSync();
    const syncTimer = setTimeout(requestExtensionSync, 1500);

    return () => {
      window.removeEventListener('message', handleExtensionMessage);
      window.removeEventListener('focus', requestExtensionSync);
      clearTimeout(syncTimer);
    };
  }, [session]);

  // --- MONITOR DE PROMOÇÃO ---
  useEffect(() => {
    const hasCompletedInitialCloudSync = useStore.getState().hasCompletedInitialCloudSync;
    if (isSyncing || (session && !hasCompletedInitialCloudSync)) {
      lastPatenteId.current = null;
      return;
    }
    const currentP = useStore.getState().getCurrentPatente();
    if (!currentP) return;

    if (!lastPatenteId.current) {
      lastPatenteId.current = currentP.id;
      return;
    }
    
    if (currentP.id !== lastPatenteId.current) {
      const oldIdx = PATENTES.findIndex(p => p.id === lastPatenteId.current);
      const newIdx = PATENTES.findIndex(p => p.id === currentP.id);
      
      if (newIdx > oldIdx) {
        setPromotionModal(currentP);
        useStore.getState().playSound('levelUp');
      }
      lastPatenteId.current = currentP.id;
    }
  }, [userStats?.xp, isSyncing, session]);

  if (!session) {
    return <Login />;
  }

  const todayStr = getLocalDateStr();
  const allDueToday = reviews.filter(r => r.nextDateStr <= todayStr);

  const navGroups = [
    {
      title: 'Estudo',
      items: [
        { id: '/estudos', label: 'Central de Estudos', icon: Library },
        { id: '/simulados', label: 'Simulados', icon: TargetIcon },
      ]
    },
    {
      title: 'Desempenho',
      items: [
        { id: '/carreira', label: 'Carreira', icon: Award },
        { id: '/revisoes', label: 'Revisões', icon: BrainCircuit, count: allDueToday.length },
        { id: '/estatisticas', label: 'Histórico', icon: BarChart2 },
        { id: '/edital', label: 'Edital', icon: BookOpen },
        { id: '/taf', label: 'Treino TAF', icon: Dumbbell },
        { id: '/duelo', label: 'Duelo CTB', icon: Crosshair },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: '/pet', label: 'Mascote K9', icon: Dog },
        { id: '/loja', label: 'Loja', icon: Store },
        { id: '/config', label: 'Ajustes', icon: Settings },
      ]
    }
  ];
  const tabs = navGroups.flatMap(g => g.items);

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden flex flex-col md:flex-row ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <ConfettiCanvas />
      {/* Tactical background grid pattern */}
      <div className="fixed inset-0 tactical-grid pointer-events-none -z-20"></div>
      <Toaster position="top-right" richColors closeButton />
      <TacticalCountdownBanner />

      {/* MENU LATERAL ESQUERDO (DESKTOP) */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r transition-all duration-200 ${
        isSidebarCollapsed ? 'w-[60px]' : 'w-56'
      } ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        {/* Logo / Topo */}
        <div className={`py-2.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center ${isSidebarCollapsed ? 'flex-col gap-1.5 px-1.5' : 'justify-between px-3'}`}>
          <Link to="/" className="flex items-center gap-2.5 min-w-0" title="QG da PRF">
            <div className="p-1.5 bg-sky-500/10 dark:bg-sky-500/15 rounded-lg border border-sky-500/25 shrink-0">
              <Award className="text-sky-600 dark:text-sky-400 w-4 h-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black tracking-wider text-slate-800 dark:text-white uppercase leading-none">
                    QG DA PRF
                  </h1>
                  {isSyncing && <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />}
                </div>
                <span className="text-[9px] font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 block mt-0.5">
                  Centro de Comando
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            title={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={isSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer shrink-0"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Card Compacto de Patente & Moedas */}
        <div className={`py-2 border-b border-slate-200/60 dark:border-slate-800 ${isSidebarCollapsed ? 'px-1.5' : 'px-2.5'}`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1" title={`${getCurrentPatente().name} • ${coins} moedas`}>
              <span className="text-base leading-none">{getCurrentPatente().icon}</span>
              <div className="flex items-center gap-0.5 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                <Coins className="text-amber-500 w-2.5 h-2.5" />
                <span className="font-bold text-[9px] tabular-nums text-amber-500">{coins}</span>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col gap-1.5 bg-slate-100/90 dark:bg-slate-850 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 ${getCurrentPatente().color}`}>
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-sm leading-none shrink-0">{getCurrentPatente().icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight leading-tight break-words" title={getCurrentPatente().name}>
                    {getCurrentPatente().name}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                  <Coins className="text-amber-500 w-3 h-3" />
                  <span className="font-bold text-[10px] tabular-nums text-amber-500">{coins}</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-teal-400 h-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (userStats.xp % 1000) / 10)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Links de Navegação Vertical por Categoria */}
        <nav className={`flex-1 overflow-y-auto custom-scrollbar py-2.5 ${isSidebarCollapsed ? 'px-1.5 space-y-1' : 'px-2.5 space-y-3'}`}>
          {navGroups.map((group, gIdx) => (
            <div key={group.title}>
              {!isSidebarCollapsed ? (
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2.5 mb-1">
                  {group.title}
                </div>
              ) : (
                gIdx > 0 && <div className="h-px bg-slate-200/70 dark:bg-slate-800 mx-1.5 my-1.5" />
              )}
              <div className="space-y-0.5">
                {group.items.map(tab => (
                  <NavLink
                    key={tab.id}
                    to={tab.id}
                    title={tab.label}
                    className={({ isActive }) => `relative flex items-center ${isSidebarCollapsed ? 'justify-center py-2 px-1.5' : 'justify-between py-1.5 px-2.5'} rounded-lg transition-colors duration-150 text-xs font-semibold tracking-tight cursor-pointer border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-850 dark:text-white dark:border-slate-700'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-sky-400" />
                        )}
                        <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
                          <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : ''}`} />
                          {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
                        </div>
                        {tab.count > 0 && (
                          <span className={isSidebarCollapsed
                            ? 'absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full font-black leading-none'
                            : 'bg-red-500 text-white text-[9px] min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full font-black shrink-0'
                          }>
                            {tab.count}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Rodapé da Sidebar: Tema & Logout */}
        <div className={`p-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5 ${isSidebarCollapsed ? 'items-center px-1.5' : ''}`}>
          <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? 'flex-col w-full' : ''}`}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              className={`flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase cursor-pointer ${isSidebarCollapsed ? 'w-full px-1.5' : 'flex-1 px-2.5'}`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              {!isSidebarCollapsed && <span>{isDarkMode ? 'Claro' : 'Escuro'}</span>}
            </button>

            <button
              onClick={signOut}
              className={`p-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg border border-red-500/20 transition-colors cursor-pointer flex items-center justify-center ${isSidebarCollapsed ? 'w-full' : ''}`}
              title="Sair do QG"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span className="tracking-wide">Versão</span>
              <button
                type="button"
                onClick={async () => {
                  toast.loading("Limpando cache...", { id: 'reload-sw' });
                  try {
                    if ('serviceWorker' in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      for (const r of regs) await r.unregister();
                    }
                    if ('caches' in window) {
                      const ks = await caches.keys();
                      await Promise.all(ks.map(k => caches.delete(k)));
                    }
                    window.location.reload();
                  } catch {
                    window.location.reload();
                  }
                }}
                title="Clique para forçar atualização do aplicativo e limpar caches"
                className="font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-slate-700 text-[10px] hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{APP_VERSION}</span>
                <RefreshCw className="w-2.5 h-2.5 opacity-60" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* HEADER COMPACTO (APENAS MOBILE) */}
      <header className="md:hidden sticky top-2 z-50 mx-auto w-full px-4 pt-2">
        <div className={`glass-card rounded-2xl ${isDarkMode ? 'bg-slate-900/90 border-slate-800 shadow-2xl' : 'bg-white/90 border-slate-200/80 shadow-lg'} overflow-hidden`}>
          <div className="px-3.5 py-2.5 flex justify-between items-center gap-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600/10 dark:bg-blue-500/15 rounded-xl border border-blue-500/20">
                <Award className="text-blue-600 dark:text-blue-400 w-5 h-5" />
              </div>
              <h1 className="text-sm font-black tracking-wider text-slate-800 dark:text-white uppercase leading-none">QG DA PRF</h1>
            </Link>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  toast.loading("Limpando cache...", { id: 'reload-sw' });
                  try {
                    if ('serviceWorker' in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      for (const r of regs) await r.unregister();
                    }
                    if ('caches' in window) {
                      const ks = await caches.keys();
                      await Promise.all(ks.map(k => caches.delete(k)));
                    }
                    window.location.reload();
                  } catch {
                    window.location.reload();
                  }
                }}
                title="Clique para forçar atualização e limpar cache"
                className="h-8 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-500 flex items-center gap-1 cursor-pointer"
              >
                <span>{APP_VERSION}</span>
                <RefreshCw className="w-2.5 h-2.5 opacity-60" />
              </button>
              <div className="h-8 flex items-center gap-1 bg-yellow-500/10 dark:bg-yellow-500/15 px-2.5 rounded-xl border border-yellow-500/20">
                <Coins className="text-yellow-600 dark:text-yellow-400 w-3.5 h-3.5" />
                <span className="font-black text-xs text-yellow-600 dark:text-yellow-400">{coins}</span>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="h-8 w-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white cursor-pointer">
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button onClick={signOut} className="h-8 w-8 flex items-center justify-center bg-red-600/10 text-red-500 rounded-xl border border-red-500/20 cursor-pointer">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <nav className={`px-3 overflow-x-auto no-scrollbar border-t ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200/60 bg-slate-50/70'}`}>
            <div className="flex gap-1.5 py-2 min-w-max">
              {tabs.map(tab => (
                <NavLink
                  key={tab.id}
                  to={tab.id}
                  className={({ isActive }) => `flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all whitespace-nowrap text-xs font-semibold tracking-tight ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-850 dark:text-sky-400 dark:border dark:border-slate-700 shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                      {tab.count}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className={`flex-1 min-w-0 w-full transition-all duration-200 ${isSidebarCollapsed ? 'md:pl-[60px]' : 'md:pl-56'}`}>
        <main className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-4 pb-24">
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
                  <Route path="/" element={<Navigate to="/estudos?tab=hoje" replace />} />
                  <Route path="/estudos" element={<CentralEstudos />} />
                  <Route path="/carreira" element={<Dashboard />} />
                  <Route path="/duelo" element={<DueloFPS />} />

                  <Route path="/revisoes" element={<Revisoes />} />
                  <Route path="/ciclo" element={<Navigate to="/estudos?tab=cronograma" replace />} />
                  <Route path="/calendario" element={<Navigate to="/estudos?tab=calendario" replace />} />
                  <Route path="/estatisticas" element={<Estatisticas />} />
                  <Route path="/historico" element={<Navigate to="/estatisticas" replace />} />
                  <Route path="/edital" element={<Edital />} />

                  <Route path="/taf" element={<TreinoTAF />} />
                  <Route path="/simulados" element={<Simulados />} />
                  <Route path="/caveira" element={<Navigate to="/estudos?tab=caveira" replace />} />
                  <Route path="/pet" element={<Pet />} />
                  <Route path="/loja" element={<Loja />} />
                  <Route path="/config" element={<Config availableColors={availableColors} />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modais do Sistema - Renderizados via Portal para garantir z-index absoluto */}
      
      {/* 1. Modal de Avaliação de Revisão (Questão Interativa do Caveira OU Auditoria Geral) */}
      {reviewModal && (reviewModal.isCaveiraQuestion || reviewModal.questionData || String(reviewModal.id || '').startsWith('rev_caveira_') || String(reviewModal.topicName || '').startsWith('[Caveira')) ? (
        createPortal(
          <CaveiraReviewQuestionModal review={reviewModal} onClose={() => setReviewModal(null)} />,
          document.body
        )
      ) : reviewModal && createPortal(
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
                    onChange={(e) => {
                      const nextTotal = Math.max(0, parseInt(e.target.value) || 0);
                      setReviewInputs(prev => ({
                        ...prev,
                        total: nextTotal,
                        correct: Math.min(prev.correct, nextTotal)
                      }));
                    }}
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
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setReviewInputs(prev => ({ ...prev, correct: Math.min(val, prev.total) }));
                    }}
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
                        {typeof fsrsPrediction?.difficulty === 'number' ? fsrsPrediction.difficulty.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Estabilidade</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {typeof fsrsPrediction?.stability === 'number' ? fsrsPrediction.stability.toFixed(1) + 'd' : '—'}
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
                onClick={() => {
                  setReviewModal(null);
                  setReviewInputs({ total: 10, correct: 0 });
                }} 
                className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2a. Diálogo Pré-Confirmação: Fazer Questões Antes de Queimar Aula */}
      {classConfirmModal && !classConfirmModal.skipPrePrompt && dismissedPrePromptModalRef !== classConfirmModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[120] p-4 fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 dark:border-slate-800 relative max-h-[92vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-500"></div>

            <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner">
              <Crosshair className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black mb-1 text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              Fazer Questões Agora?
            </h3>

            {subjects[classConfirmModal.subjectId]?.name && (
              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 mb-2">
                {subjects[classConfirmModal.subjectId].name}
              </span>
            )}

            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Conteúdo da(s) aula(s): <span className="text-slate-900 dark:text-white font-black">{classConfirmModal.lessonNames?.length ? classConfirmModal.lessonNames.join(' • ') : classConfirmModal.topicName}</span>. Deseja abrir o Projeto Caveira na aba de questões com esse conteúdo já filtrado?
            </p>

            {/* Subassuntos do Índice da Aula (Automático + Colar Manualmente) */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-4 text-left">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-orange-500" />
                  {prePromptSubtopics.length > 0
                    ? `Índice: ${prePromptSubtopics.length} subassuntos`
                    : 'Índice da Aula (Opcional)'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrePromptIndexBox(v => !v)}
                  className="text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase"
                >
                  {showPrePromptIndexBox ? 'Ocultar' : (prePromptIndexText ? 'Editar Índice' : 'Colar Índice')}
                </button>
              </div>

              {prePromptSubtopics.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {prePromptSubtopics.slice(0, 8).map((sub, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20"
                    >
                      {sub}
                    </span>
                  ))}
                  {prePromptSubtopics.length > 8 && (
                    <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">
                      +{prePromptSubtopics.length - 8}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mb-1">
                  Aulas genéricas ("Parte 01"): cole o Índice da aula ou abra o player do Caveira para filtrar pelos subassuntos específicos.
                </p>
              )}

              {courseIndexCache?.latest?.rawIndexText && courseIndexCache.latest.rawIndexText !== prePromptIndexText && (
                <button
                  type="button"
                  onClick={() => {
                    const captured = courseIndexCache.latest.rawIndexText;
                    setPrePromptIndexText(captured);
                    const lessonKeyTarget = classConfirmModal.lessonNames?.[0] || classConfirmModal.topicName;
                    if (lessonKeyTarget) saveManualLessonIndex(captured, lessonKeyTarget);
                  }}
                  className="mt-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2 py-1 hover:bg-emerald-500/20 transition-colors w-full text-left truncate"
                  title={courseIndexCache.latest.lessonTitle || ''}
                >
                  ⚡ Usar índice aberto no Caveira ({courseIndexCache.latest.lessonTitle || `${courseIndexCache.latest.subtopics?.length || 0} tópicos`})
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
                  className="mt-2 w-full text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-700 dark:text-slate-200 focus:border-orange-500 outline-none resize-y"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const subjectName = subjects[classConfirmModal.subjectId]?.name || '';
                  const lessonNames = classConfirmModal.lessonNames || [];
                  const topicName = classConfirmModal.topicName || '';
                  triggerCaveiraPractice(subjectName, lessonNames, topicName, prePromptSubtopics, prePromptIndexText);
                  setClassConfirmModal(null);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <Skull className="w-4 h-4" />
                <span>
                  {prePromptSubtopics.length > 0
                    ? `Filtrar ${prePromptSubtopics.length} Subassuntos no Caveira`
                    : 'Sim, ir para Questões no Caveira'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDismissedPrePromptModalRef(classConfirmModal)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Continuar para Confirmar Aula</span>
              </button>

              <button
                onClick={() => setClassConfirmModal(null)}
                className="w-full py-2 px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2b. Modal de Confirmação de Aula (Componente Externo) */}
      <ClassCompletionModal 
        key={classConfirmModal ? `${classConfirmModal.subjectId}_${classConfirmModal.initialStudyDate || 'today'}` : 'none'}
        isOpen={Boolean(classConfirmModal && (classConfirmModal.skipPrePrompt || dismissedPrePromptModalRef === classConfirmModal))}
        topicName={classConfirmModal?.topicName}
        maxClasses={classConfirmModal?.maxClasses}
        subjectSpeed={subjects[classConfirmModal?.subjectId]?.speed || 1}
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
          const subjectName = subjects[classConfirmModal?.subjectId]?.name || '';
          const allRem = classConfirmModal?.allRemainingLessonNames || [];
          const count = Math.max(1, Number(selectedCount) || 1);
          const chosenLessons = allRem.length > 0 ? allRem.slice(0, count) : (classConfirmModal?.lessonNames || []);
          const topicName = classConfirmModal?.topicName || '';
          triggerCaveiraPractice(subjectName, chosenLessons, topicName, subtopics, rawIndexText);
        }}
        onClose={() => setClassConfirmModal(null)}
        onConfirm={(amount, speed, studyDate) => {
          watchClass(classConfirmModal.subjectId, classConfirmModal.slotIndex, amount, speed, studyDate);
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
                className="mb-6 relative z-10 flex justify-center"
              >
                <RankBadge level={promotionModal.level || 1} size={120} />
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