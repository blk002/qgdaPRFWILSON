import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Library, Award, BrainCircuit, BarChart2, BookOpen, Dumbbell, Crosshair,
  Dog, Store, Settings, Shield, RefreshCw, Clock, HelpCircle,
  Coins, Sun, Moon, LogOut, LayoutGrid, X, ChevronDown, Target, Sparkles
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import RankBadge from '../RankBadge';
import { startInteractiveTour } from '../../lib/interactiveTour';
import { APP_VERSION } from '../../version';
import prfBrasaoOficial from '../../assets/images/prf-brasao-oficial.png';

const MOBILE_SECONDARY_IDS = new Set(['/estatisticas', '/taf', '/duelo', '/pet', '/loja', '/config']);

export default function AppNavigation({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const location = useLocation();
  const desktopNavRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const coins = useStore((s) => s.coins);
  const userStats = useStore((s) => s.userStats);
  const subjects = useStore((s) => s.subjects);
  const targetExamDate = useStore((s) => s.targetExamDate);
  const getEstimatedCompletionDate = useStore((s) => s.getEstimatedCompletionDate);
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

  const subjectsList = useMemo(() => Object.values(subjects || {}), [subjects]);
  const { totalLessons, completedLessons, completionPct } = useMemo(() => {
    let total = 0;
    let done = 0;
    subjectsList.forEach((sub) => {
      (sub.topics || []).forEach((t) => {
        const tTotal = Number(t.total) || 0;
        const tDone = Math.min(tTotal, Number(t.completed) || 0);
        total += tTotal;
        done += tDone;
      });
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { totalLessons: total, completedLessons: done, completionPct: pct };
  }, [subjectsList]);

  const estimatedDate = getEstimatedCompletionDate ? getEstimatedCompletionDate() : null;
  const examDateConfigured = Boolean(targetExamDate && targetExamDate !== '2026-08-15');

  useEffect(() => {
    if (!openDropdown) return undefined;

    const handlePointerDown = (event) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  const navGroups = useMemo(
    () => [
      {
        key: 'estudo',
        title: 'Estudo',
        collapsible: false,
        items: [{ id: '/estudos', label: 'Central de Estudos', icon: Library }],
      },
      {
        key: 'desempenho',
        title: 'Desempenho',
        icon: Target,
        collapsible: true,
        badgeCount: dueReviewsCount,
        items: [
          { id: '/revisoes', label: 'Revisões', icon: BrainCircuit, count: dueReviewsCount },
          { id: '/edital', label: 'Edital', icon: BookOpen },
          { id: '/estatisticas', label: 'Histórico', icon: BarChart2 },
          { id: '/taf', label: 'Treino TAF', icon: Dumbbell },
          { id: '/duelo', label: 'Duelo CTB', icon: Crosshair },
        ],
      },
      {
        key: 'extras',
        title: 'Carreira & Extras',
        icon: Sparkles,
        collapsible: true,
        badgeCount: 0,
        items: [
          { id: '/carreira', label: 'Carreira', icon: Award },
          { id: '/pet', label: 'Mascote K9', icon: Dog },
          { id: '/loja', label: 'Loja', icon: Store },
        ],
      },
      {
        key: 'sistema',
        title: 'Sistema',
        collapsible: false,
        items: [{ id: '/config', label: 'Ajustes', icon: Settings }],
      },
    ],
    [dueReviewsCount]
  );

  const tabs = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);
  const currentPatente = getCurrentPatente();
  const currentTabMeta = tabs.find((t) => location.pathname.startsWith(t.id)) || tabs[0];
  const xpProgressPct = Math.min(100, ((userStats?.xp || 0) % 1000) / 10);

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
      {/* MENU SUPERIOR COMPACTO (DESKTOP) */}
      <header className="hidden md:block sticky top-0 z-40 w-full h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-full max-w-[1640px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between gap-4">
          {/* Esquerda: Marca + Navegação Horizontal */}
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/"
              onClick={() => setOpenDropdown(null)}
              className="flex items-center gap-2.5 shrink-0 group"
              title="QG da PRF"
            >
              <div className="w-8 h-9 flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-[1.04]">
                <img
                  src={prfBrasaoOficial}
                  alt="Brasão Oficial da PRF"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-wide text-slate-900 dark:text-white leading-none whitespace-nowrap">
                  QG DA PRF
                </span>
                {isSyncing && <RefreshCw className="w-3 h-3 text-sky-400 animate-spin shrink-0" />}
              </div>
            </Link>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            <nav
              ref={desktopNavRef}
              aria-label="Navegação principal"
              className="flex items-center gap-1"
            >
              {navGroups
                .filter((group) => group.key !== 'sistema')
                .map((group) => {
                const isCollapsible = Boolean(group.collapsible);
                const isDropdownOpen = openDropdown === group.key;
                const hasActiveChild = group.items.some((item) => location.pathname.startsWith(item.id));
                const GroupIcon = group.icon;

                if (!isCollapsible) {
                  return group.items.map((tab) => (
                    <NavLink
                      key={tab.id}
                      to={tab.id}
                      data-tour={tab.id === '/estudos' ? 'nav-estudos' : undefined}
                      onClick={() => setOpenDropdown(null)}
                      className={({ isActive }) =>
                        `relative h-9 px-3 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'opacity-80'}`} />
                          <span>{tab.label}</span>
                          {tab.count > 0 && (
                            <span className="bg-red-500/15 text-red-600 dark:text-red-400 text-[11px] min-w-[18px] h-4.5 px-1.5 flex items-center justify-center rounded-md font-mono font-semibold tabular-nums">
                              {tab.count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ));
                }

                return (
                  <div key={group.key} className="relative">
                    <button
                      type="button"
                      data-tour={`nav-${group.key}`}
                      onClick={() => setOpenDropdown((prev) => (prev === group.key ? null : group.key))}
                      aria-expanded={isDropdownOpen}
                      aria-haspopup="menu"
                      className={`h-9 px-3 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                        hasActiveChild
                          ? 'bg-sky-500/12 text-sky-700 dark:text-sky-300'
                          : isDropdownOpen
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {GroupIcon && (
                        <GroupIcon
                          className={`w-4 h-4 shrink-0 ${
                            hasActiveChild ? 'text-sky-600 dark:text-sky-400' : 'opacity-80'
                          }`}
                        />
                      )}
                      <span>{group.title}</span>
                      {group.badgeCount > 0 && (
                        <span className="bg-red-500/15 text-red-600 dark:text-red-400 text-[11px] min-w-[18px] h-4.5 px-1.5 flex items-center justify-center rounded-md font-mono font-semibold tabular-nums">
                          {group.badgeCount}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          key={`${group.key}-dropdown`}
                          role="menu"
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.14, ease: 'easeOut' }}
                          className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/45 p-1.5 z-50"
                        >
                          <div className="space-y-0.5">
                            {group.items.map((tab) => (
                              <NavLink
                                key={tab.id}
                                to={tab.id}
                                role="menuitem"
                                onClick={() => setOpenDropdown(null)}
                                className={({ isActive }) =>
                                  `relative flex items-center justify-between gap-2 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                                    isActive
                                      ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                                  }`
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <tab.icon
                                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'opacity-80'}`}
                                      />
                                      <span className="truncate">{tab.label}</span>
                                    </div>
                                    {tab.count > 0 && (
                                      <span className="bg-red-500/15 text-red-600 dark:text-red-400 text-[11px] min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-md font-mono font-semibold tabular-nums shrink-0">
                                        {tab.count}
                                      </span>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Progresso do Edital integrado no menu superior */}
          <Link
            to="/edital"
            data-tour="nav-edital-progress"
            onClick={() => setOpenDropdown(null)}
            title={`Edital: ${completionPct}% · ${completedLessons}/${totalLessons} aulas · ${subjectsList.length} ${subjectsList.length === 1 ? 'disciplina' : 'disciplinas'}${estimatedDate?.short ? ` · Previsão: ${estimatedDate.short}` : ''}`}
            className="hidden md:flex flex-col justify-center ml-auto flex-1 min-w-0 max-w-[225px] h-9 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-1 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] leading-none min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Edital
                </span>
                <span className="font-mono font-bold tabular-nums text-sky-600 dark:text-sky-400">
                  {completionPct}%
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] shrink-0 whitespace-nowrap">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {estimatedDate?.short ? (
                  <strong
                    className={`font-semibold tabular-nums ${
                      examDateConfigured && estimatedDate.isLate
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {estimatedDate.short}
                  </strong>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Sem previsão</span>
                )}
              </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200/90 dark:bg-slate-700/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400 dark:from-sky-500 dark:to-cyan-400 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </Link>

          {/* Direita: Patente, Moedas, Tutorial, Atualização, Tema, Sair e Ajustes */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/carreira"
              data-tour="nav-rank-coins"
              onClick={() => setOpenDropdown(null)}
              title={`${currentPatente.name} · ${(userStats?.xp || 0).toLocaleString()} XP · ${coins} moedas`}
              className="h-9 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5"
            >
              <RankBadge level={currentPatente.level} size={22} />
              <div className="hidden 2xl:flex flex-col min-w-0 w-28">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                  {currentPatente.name}
                </span>
                <div className="w-full bg-slate-200/90 dark:bg-slate-700/80 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${xpProgressPct}%` }}
                  />
                </div>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700/80" />
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 shrink-0">
                <Coins className="w-3.5 h-3.5" />
                <span className="font-mono font-semibold text-xs tabular-nums">{coins}</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                startInteractiveTour();
              }}
              title="Iniciar tutorial interativo passo a passo"
              aria-label="Iniciar tutorial interativo"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleForceCacheRefresh}
              title={`Versão ${APP_VERSION} · Forçar atualização e limpar cache`}
              aria-label="Forçar atualização e limpar cache"
              className="h-9 px-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden 2xl:inline font-mono text-xs">{APP_VERSION}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              aria-label={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={signOut}
              title="Sair da conta"
              aria-label="Sair da conta"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <NavLink
              to="/config"
              data-tour="nav-ajustes"
              onClick={() => setOpenDropdown(null)}
              className={({ isActive }) =>
                `h-9 px-3 rounded-lg flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'opacity-80'}`} />
                  <span>Ajustes</span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </header>

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
              data-tour={`mobile-${tab.id.replace('/', '')}`}
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

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    startInteractiveTour();
                  }}
                  className="h-10 px-3 rounded-lg text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Tutorial</span>
                </button>
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
