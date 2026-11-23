import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabaseClient';
import {
  createLocalTestSession,
  hasStoredLocalTestSession,
  isLocalTestUser,
} from './lib/localTestAuth';
import { availableColors } from './lib/subjectColors';
import { useStore } from './store/useStore';
import Login from './components/Login';
import TacticalCountdownBanner from './components/TacticalCountdownBanner';
import AppNavigation from './components/layout/AppNavigation';
import SyncStatusBanner from './components/layout/SyncStatusBanner';
import GlobalAppModals from './components/modals/GlobalAppModals';
import { useConfetti } from './hooks/useConfetti';
import { useExtensionBridge } from './hooks/useExtensionBridge';
import { PATENTES } from './hooks/useGamification';

// Code-splitting: todas as páginas carregadas sob demanda
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CentralEstudos = React.lazy(() => import('./pages/CentralEstudos'));
const Revisoes = React.lazy(() => import('./pages/Revisoes'));
const Estatisticas = React.lazy(() => import('./pages/Estatisticas'));
const Edital = React.lazy(() => import('./pages/Edital'));
const TreinoTAF = React.lazy(() => import('./pages/TreinoTAF'));
const Loja = React.lazy(() => import('./pages/Loja'));
const Config = React.lazy(() => import('./pages/Config'));
const Pet = React.lazy(() => import('./pages/Pet'));
const DueloFPS = React.lazy(() => import('./pages/DueloFPS'));

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function App() {
  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);
  const loadFromCloud = useStore((s) => s.loadFromCloud);
  const isDarkMode = useStore((s) => s.isDarkMode);
  const activeTheme = useStore((s) => s.activeTheme);
  const isSyncing = useStore((s) => s.isSyncing);
  const userXp = useStore((s) => s.userStats?.xp);
  const pushSettings = useStore((s) => s.pushSettings);
  const pushTime = useStore((s) => s.pushTime);
  const getLocalDateStr = useStore((s) => s.getLocalDateStr);

  const [promotionModal, setPromotionModal] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('qg_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const lastPatenteId = useRef(null);
  const location = useLocation();
  const { setTriggerConfetti, ConfettiCanvas } = useConfetti();

  const {
    courseIndexCache,
    manualLessonIndexMap,
    saveManualLessonIndex,
  } = useExtensionBridge();

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('qg_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (promotionModal) setTriggerConfetti(true);
  }, [promotionModal, setTriggerConfetti]);

  // Sincronizar o tema escuro no elemento raiz (suporta Portais)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(isDarkMode));
  }, [isDarkMode]);

  // Sincronizar o tema de cores ativo
  useEffect(() => {
    if (activeTheme) {
      useStore.getState().applyTheme(activeTheme);
    }
  }, [activeTheme]);

  // Lembrete diário de estudos
  useEffect(() => {
    if (!pushSettings?.enabled || !pushTime) return;

    const checkTime = () => {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const lastNotifiedDate = localStorage.getItem('lastPushNotificationDate');
      const todayStr = getLocalDateStr(now);

      if (currentTimeStr === pushTime && lastNotifiedDate !== todayStr) {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Hora de estudar!', {
            body: 'Seu bloco de estudos está aguardando. Vamos bater a meta de hoje?',
            icon: '/favicon.ico',
          });
        } else {
          toast('Hora de estudar!', {
            description: 'Seu lembrete diário de estudos está ativo.',
            duration: 10000,
          });
        }
        localStorage.setItem('lastPushNotificationDate', todayStr);
      }
    };

    if (typeof Notification !== 'undefined' && Notification.permission === 'default' && pushSettings?.enabled) {
      Notification.requestPermission();
    }

    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, [pushSettings?.enabled, pushTime, getLocalDateStr]);

  // Virada de dia com o app aberto
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

  // Auth & Inicialização única
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!authSession && event === 'INITIAL_SESSION' && hasStoredLocalTestSession()) {
          const localSession = createLocalTestSession();
          setSession(localSession);
          if (!useStore.getState().isLoadingFromCloud) {
            setTimeout(async () => {
              await loadFromCloud();
            }, 150);
          }
          return;
        }
        setSession(authSession);
        if (authSession?.user) {
          if (!useStore.getState().isLoadingFromCloud) {
            setTimeout(async () => {
              await loadFromCloud();
            }, 400);
          }
        } else {
          useStore.setState({ isSyncing: false, isLoadingFromCloud: false });
        }
      } else if (event === 'SIGNED_OUT') {
        if (isLocalTestUser(useStore.getState().user) && hasStoredLocalTestSession()) {
          return;
        }
        useStore.getState().unsubscribeFromCloudRealtime?.();
        setSession(null);
        useStore.setState({ isSyncing: false, isLoadingFromCloud: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, loadFromCloud]);

  // Supabase Realtime + Delta Check
  useEffect(() => {
    const userId = session?.user?.id;
    const isLocalTest = isLocalTestUser(useStore.getState().user);
    const ready = useStore.getState().hasCompletedInitialCloudSync;
    if (!userId || isLocalTest || isSyncing || !ready) {
      if (!userId) {
        useStore.getState().unsubscribeFromCloudRealtime?.();
      }
      return undefined;
    }

    useStore.getState().subscribeToCloudRealtime?.();

    const triggerDeltaCheck = () => {
      useStore.getState().checkCloudDeltaIfNewer?.();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') triggerDeltaCheck();
    };

    window.addEventListener('focus', triggerDeltaCheck);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', triggerDeltaCheck);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [session?.user?.id, isSyncing]);

  // Monitor de Promoção de Patente
  useEffect(() => {
    const ready = useStore.getState().hasCompletedInitialCloudSync;
    if (isSyncing || (session && !ready)) {
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
      const oldIdx = PATENTES.findIndex((p) => p.id === lastPatenteId.current);
      const newIdx = PATENTES.findIndex((p) => p.id === currentP.id);
      if (newIdx > oldIdx) {
        setPromotionModal(currentP);
        useStore.getState().playSound('levelUp');
      }
      lastPatenteId.current = currentP.id;
    }
  }, [userXp, isSyncing, session]);

  if (!session) {
    return <Login />;
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 relative overflow-x-hidden flex flex-col md:flex-row ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <ConfettiCanvas />
      <div className="fixed inset-0 tactical-grid pointer-events-none -z-20" />
      <Toaster position="top-right" richColors closeButton />
      <TacticalCountdownBanner />

      <AppNavigation
        isSidebarCollapsed={isSidebarCollapsed}
        toggleSidebarCollapsed={toggleSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <div className={`flex-1 min-w-0 w-full transition-all duration-200 ${isSidebarCollapsed ? 'md:pl-16' : 'md:pl-60'}`}>
        <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12">
          <SyncStatusBanner />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={PAGE_VARIANTS}
              transition={{ duration: 0.16 }}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Carregando módulo...
                      </span>
                    </div>
                  </div>
                }
              >
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
                  <Route path="/simulados" element={<Navigate to="/estudos?tab=simulados" replace />} />
                  <Route path="/caveira" element={<Navigate to="/estudos?tab=caveira" replace />} />
                  <Route path="/pet" element={<Pet />} />
                  <Route path="/loja" element={<Loja />} />
                  <Route path="/config" element={<Config availableColors={availableColors} />} />
                  <Route path="*" element={<Navigate to="/estudos?tab=hoje" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <GlobalAppModals
        courseIndexCache={courseIndexCache}
        manualLessonIndexMap={manualLessonIndexMap}
        saveManualLessonIndex={saveManualLessonIndex}
        promotionModal={promotionModal}
        setPromotionModal={setPromotionModal}
      />
    </div>
  );
}