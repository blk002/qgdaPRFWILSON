import React, { useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { startInteractiveTour } from '../lib/interactiveTour';
import AbaHoje from '../components/AbaHoje';
import {
  Zap, Repeat, Calendar as CalendarIcon, CalendarClock,
  Settings, HelpCircle, Skull, Clock, Target, FileText
} from 'lucide-react';

const Ciclo = React.lazy(() => import('./Ciclo'));
const RaioXCaveira = React.lazy(() => import('./RaioXCaveira'));
const Calendario = React.lazy(() => import('./Calendario'));
const Simulados = React.lazy(() => import('./Simulados'));
const RotinaVida = React.lazy(() => import('./RotinaVida'));
const AbaDiscursiva = React.lazy(() => import('../components/AbaDiscursiva'));

const VALID_TABS = new Set(['hoje', 'cronograma', 'rotina', 'caveira', 'calendario', 'simulados', 'discursiva']);

const TAB_CONFIG = [
  { id: 'hoje', label: 'Hoje', icon: Zap, tutorialStep: 1 },
  { id: 'cronograma', label: 'Cronograma', icon: Repeat, tutorialStep: 2 },
  { id: 'rotina', label: 'Rotina de Vida', icon: CalendarClock, tutorialStep: 2 },
  { id: 'caveira', label: 'Raio-X Caveira', icon: Skull, tutorialStep: 3 },
  { id: 'calendario', label: 'Calendário', icon: CalendarIcon, tutorialStep: 4 },
  { id: 'simulados', label: 'Simulados', icon: Target, tutorialStep: 5 },
  { id: 'discursiva', label: 'Discursiva', icon: FileText, tutorialStep: 6 }
];

export default function CentralEstudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.has(rawTab) ? rawTab : 'hoje';

  const {
    subjects = {},
    targetExamDate,
    getEstimatedCompletionDate
  } = useStore();

  const subjectsList = useMemo(() => Object.values(subjects || {}), [subjects]);

  const { totalLessons, completedLessons, completionPct } = useMemo(() => {
    let total = 0;
    let done = 0;
    subjectsList.forEach(sub => {
      (sub.topics || []).forEach(t => {
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
  const currentTabMeta = TAB_CONFIG.find(t => t.id === activeTab) || TAB_CONFIG[0];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="fade-in w-full pb-6 space-y-5">
      {/* Cabeçalho Unificado com Progresso do Edital */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-x-5 gap-y-3">
        <div className="order-1 min-w-0 shrink-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Central de Estudos
          </h1>
        </div>

        {/* Progresso do Edital (apenas mobile; no desktop fica no menu superior) */}
        <div className="md:hidden order-3 w-full min-w-0 pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                Edital
              </span>
              <span className="font-mono font-bold tabular-nums text-sky-600 dark:text-sky-400 shrink-0">
                {completionPct}%
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">·</span>
              <span className="tabular-nums truncate">
                {completedLessons}/{totalLessons} aulas
              </span>
              <span aria-hidden="true" className="hidden sm:inline text-slate-300 dark:text-slate-700 shrink-0">·</span>
              <span className="hidden sm:inline tabular-nums shrink-0">
                {subjectsList.length} {subjectsList.length === 1 ? 'disciplina' : 'disciplinas'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs shrink-0 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {estimatedDate?.short ? (
                <span className={
                  examDateConfigured && estimatedDate.isLate
                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                }>
                  <span className="hidden sm:inline">Previsão: </span>
                  <strong className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {estimatedDate.short}
                  </strong>
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Sem previsão</span>
              )}
            </div>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400 dark:from-sky-500 dark:to-cyan-400 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="order-2 lg:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => startInteractiveTour()}
            className="h-9 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tutorial</span>
          </button>
          <button
            type="button"
            data-tour="central-ajustar-edital"
            onClick={() => navigate('/config')}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustar edital</span>
          </button>
        </div>
      </div>

      {/* Abas Horizontais Limpas */}
      <div
        data-tour="central-tabs"
        className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {TAB_CONFIG.map((tabItem) => {
            const TabIcon = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                data-tour={`tab-${tabItem.id}`}
                onClick={() => handleTabChange(tabItem.id)}
                className={`flex items-center gap-2 px-3.5 pb-2.5 pt-1 border-b-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-sky-500 dark:border-sky-400 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-500 dark:text-sky-400' : 'opacity-75'}`} />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      <div>
        {activeTab === 'hoje' ? (
          <AbaHoje onGoToTab={handleTabChange} />
        ) : (
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Carregando {currentTabMeta.label}...
                  </span>
                </div>
              </div>
            }
          >
            {activeTab === 'cronograma' && <Ciclo />}
            {activeTab === 'rotina' && <RotinaVida />}
            {activeTab === 'caveira' && <RaioXCaveira />}
            {activeTab === 'calendario' && <Calendario />}
            {activeTab === 'simulados' && <Simulados />}
            {activeTab === 'discursiva' && <AbaDiscursiva />}
          </Suspense>
        )}
      </div>
    </div>
  );
}
