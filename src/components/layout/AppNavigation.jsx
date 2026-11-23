import React, { useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Library, Award, BrainCircuit, BarChart2, BookOpen, Dumbbell, Crosshair,
  Dog, Store, Settings, Shield, RefreshCw, PanelLeftClose, PanelLeftOpen,
  Coins, Sun, Moon, LogOut, LayoutGrid, X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import RankBadge from '../RankBadge';
import { APP_VERSION } from '../../version';

const MOBILE_SECONDARY_IDS = new Set(['/estatisticas', '/taf', '/duelo', '/pet', '/loja', '/config']);

export default function AppNavigation({
  isSidebarCollapsed,
  toggleSidebarCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const location = useLocation();

  const coins = useStore((s) => s.coins);
  const userStats = useStore((s) => s.userStats);
  const isDarkMode = useStore((s) => s.isDarkMode);
  const setIsDarkMode = useStore((s) => s.setIsDarkMode);
  const isSyncing = useStore((s) => s.isSyncing);
  const reviews = useStore((s) => s.reviews);
  const getCurrentPatente = useStore((s) => s.getCurrentPatente);
  const getLocalDateStr = useStore((s) => s.getLocalDateStr);
  const signOut = useStore((s) => s.signOut);

  const todayStr = getLocalDateStr();
  const dueReviewsCount = useMemo(
    () => (reviews || []).filter((r) => r && r.nextDateStr <= todayStr).length,
    [reviews, todayStr]
  );

  const navGroups = useMemo(
    () => [
      {
        title: 'Estudo',
        items: [{ id: '/estudos', label: 'Central de Estudos', icon: Library }],
      },
      {
        title: 'Desempenho',
        items: [
          { id: '/carreira', label: 'Carreira', icon: Award },
          { id: '/revisoes', label: 'Revisões', icon: BrainCircuit, count: dueReviewsCount },
          { id: '/estatisticas', label: 'Histórico', icon: BarChart2 },
          { id: '/edital', label: 'Edital', icon: BookOpen },
          { id: '/taf', label: 'Treino TAF', icon: Dumbbell },
          { id: '/duelo', label: 'Duelo CTB', icon: Crosshair },
        ],
      },
      {
        title: 'Sistema',
        items: [
          { id: '/pet', label: 'Mascote K9', icon: Dog },
          { id: '/loja', label: 'Loja', icon: Store },
          { id: '/config', label: 'Ajustes', icon: Settings },
        ],
      },
    ],
    [dueReviewsCount]
  );

  const tabs = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);
  const currentPatente = getCurrentPatente();
  const currentTabMeta = tabs.find((t) => location.pathname.startsWith(t.id)) || tabs[0];

  const mobilePrimaryTabs = useMemo(
    () => [
      { id: '/estudos', label: 'Estudos', icon: Library },
      { id: '/revisoes', label: 'Revisões', icon: BrainCircuit, count: dueReviewsCount },
      { id: '/edital', label: 'Edital', icon: BookOpen },
      { id: '/carreira', label: 'Carreira', icon: Award },
    ],
    [dueReviewsCount]
  );

  const isSecondaryRouteActive = MOBILE_SECONDARY_IDS.has(location.pathname);

  const handleForceCacheRefresh = async () => {
    toast.loading('Limpando cache...', { id: 'reload-sw' });
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      if ('caches' in window) {
        const ks = await caches.keys();
        await Promise.all(ks.map((k) => caches.delete(k)));
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <>
      {/* MENU LATERAL ESQUERDO (DESKTOP) */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r transition-all duration-200 ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        } ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        {/* Topo da Marca */}
        <div
          className={`h-14 border-b border-slate-200/80 dark:border-slate-800 flex items-center shrink-0 ${
            isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 min-w-0" title="QG da PRF">
            <div className="w-8 h-8 bg-sky-500/10 dark:bg-sky-500/15 rounded-lg border border-sky-500/25 flex items-center justify-center shrink-0">
              <Shield className="text-sky-600 dark:text-sky-400 w-4 h-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-wide text-slate-900 dark:text-white leading-none whitespace-nowrap">
                    QG DA PRF
                  </span>
                  {isSyncing && <RefreshCw className="w-3 h-3 text-sky-400 animate-spin shrink-0" />}
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                  Centro de Comando
                </span>
              </div>
            )}
          </Link>
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title="Recolher menu lateral"
              aria-label="Recolher menu lateral"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botão de expandir quando recolhido */}
        {isSidebarCollapsed && (
          <div className="flex justify-center py-2 border-b border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Resumo Limpo de Patente & Moedas */}
        <Link
          to="/carreira"
          className={`block border-b border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors ${
            isSidebarCollapsed ? 'py-2.5 px-2' : 'px-4 py-3'
          }`}
          title={`${currentPatente.name} · ${coins} moedas`}
        >
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <RankBadge level={currentPatente.level} size={26} />
              <span className="font-mono font-semibold text-[11px] tabular-nums text-amber-600 dark:text-amber-400">
                {coins}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <RankBadge level={currentPatente.level} size={24} />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {currentPatente.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 shrink-0">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="font-mono font-semibold text-xs tabular-nums">{coins}</span>
                </div>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, ((userStats?.xp || 0) % 1000) / 10)}%` }}
                />
              </div>
            </div>
          )}
        </Link>

        {/* Navegação Vertical */}
        <nav
          className={`flex-1 overflow-y-auto custom-scrollbar py-3 ${
            isSidebarCollapsed ? 'px-2 space-y-1.5' : 'px-3 space-y-4'
          }`}
        >
          {navGroups.map((group, gIdx) => (
            <div key={group.title}>
              {!isSidebarCollapsed ? (
                <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 px-2.5 mb-1.5">
                  {group.title}
                </div>
              ) : (
                gIdx > 0 && <div className="h-px bg-slate-200/70 dark:bg-slate-800 mx-2 my-2" />
              )}
              <div className="space-y-0.5">
                {group.items.map((tab) => (
                  <NavLink
                    key={tab.id}
                    to={tab.id}
                    title={tab.label}
                    className={({ isActive }) =>
                      `relative flex items-center ${
                        isSidebarCollapsed ? 'justify-center h-10 px-2' : 'justify-between h-9 px-2.5'
                      } rounded-lg transition-colors duration-150 text-sm font-medium cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-850 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-sky-400" />
                        )}
                        <div className={`flex items-center min-w-0 ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                          <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'opacity-80'}`} />
                          {!isSidebarCollapsed && <span className="truncate whitespace-nowrap">{tab.label}</span>}
                        </div>
                        {tab.count > 0 && (
                          <span
                            className={
                              isSidebarCollapsed
                                ? 'absolute top-1 right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-mono font-bold leading-none'
                                : 'bg-red-500/15 text-red-600 dark:text-red-400 text-xs min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-md font-mono font-semibold tabular-nums shrink-0'
                            }
                          >
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

        {/* Rodapé da Sidebar */}
        <div
          className={`p-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2 ${
            isSidebarCollapsed ? 'flex flex-col items-center px-2' : ''
          }`}
        >
          <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? 'flex-col w-full' : ''}`}>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              className={`h-9 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer ${
                isSidebarCollapsed ? 'w-full px-1.5' : 'flex-1 px-2.5'
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{isDarkMode ? 'Modo claro' : 'Modo escuro'}</span>}
            </button>

            <button
              type="button"
              onClick={signOut}
              className={`h-9 w-9 bg-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg border border-transparent hover:border-red-500/20 transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                isSidebarCollapsed ? 'w-full' : ''
              }`}
              title="Sair da conta"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-1 text-xs text-slate-400 dark:text-slate-500">
              <span>Versão</span>
              <button
                type="button"
                onClick={handleForceCacheRefresh}
                title="Forçar atualização do aplicativo e limpar cache"
                className="font-mono text-xs text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>{APP_VERSION}</span>
                <RefreshCw className="w-3 h-3 opacity-60" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* TOPO COMPACTO (APENAS MOBILE) */}
      <header className="md:hidden sticky top-0 z-40 w-full h-13 px-4 flex items-center justify-between gap-3 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-sky-500/10 dark:bg-sky-500/15 rounded-lg border border-sky-500/25 flex items-center justify-center shrink-0">
            <Shield className="text-sky-600 dark:text-sky-400 w-4 h-4" />
          </div>
          <span className="font-display text-sm font-bold tracking-wide text-slate-900 dark:text-white truncate">
            {currentTabMeta?.label || 'QG DA PRF'}
          </span>
          {isSyncing && <RefreshCw className="w-3 h-3 text-sky-400 animate-spin shrink-0" />}
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/loja"
            className="h-9 px-2.5 flex items-center gap-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Ir para a Loja"
          >
            <Coins className="w-4 h-4" />
            <span className="font-mono font-semibold text-xs tabular-nums">{coins}</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* NAVEGAÇÃO INFERIOR FIXA (MOBILE) */}
      <nav
        aria-label="Navegação principal mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {mobilePrimaryTabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.id}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center h-full gap-1 transition-colors ${
                  isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-b bg-sky-500 dark:bg-sky-400" />
                  )}
                  <div className="relative">
                    <tab.icon className="w-5 h-5" />
                    {tab.count > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full font-mono font-bold leading-none">
                        {tab.count > 99 ? '99+' : tab.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium leading-none">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`relative flex flex-col items-center justify-center h-full gap-1 transition-colors cursor-pointer ${
              isMobileMenuOpen || isSecondaryRouteActive
                ? 'text-sky-600 dark:text-sky-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir mais módulos"
          >
            {(isMobileMenuOpen || isSecondaryRouteActive) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-b bg-sky-500 dark:bg-sky-400" />
            )}
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-none">Mais</span>
          </button>
        </div>
      </nav>

      {/* BOTTOM SHEET DRAWER "MAIS" (MOBILE) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl px-4 pt-3 pb-6 pb-safe max-h-[80vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <RankBadge level={currentPatente.level} size={28} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{currentPatente.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {(userStats?.xp || 0).toLocaleString()} XP · {coins} moedas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {tabs
                  .filter((t) => MOBILE_SECONDARY_IDS.has(t.id))
                  .map((tab) => (
                    <NavLink
                      key={tab.id}
                      to={tab.id}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 h-12 px-3 rounded-xl border text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-sky-500/10 border-sky-500/40 text-sky-600 dark:text-sky-400'
                            : 'bg-slate-50 dark:bg-slate-850/70 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                        }`
                      }
                    >
                      <tab.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </NavLink>
                  ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleForceCacheRefresh}
                  className="h-10 px-3 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="font-mono">{APP_VERSION}</span>
                  <span>· Limpar cache</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="h-10 px-3.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
