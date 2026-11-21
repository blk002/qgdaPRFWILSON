import React, { useState, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CentralEstudosTutorialModal from '../components/CentralEstudosTutorialModal';
import AbaHoje from '../components/AbaHoje';
import {
  Zap, Repeat, Calendar as CalendarIcon,
  Settings, Info, Sparkles, ArrowLeft, Skull, Clock
} from 'lucide-react';

const Ciclo = React.lazy(() => import('./Ciclo'));
const RaioXCaveira = React.lazy(() => import('./RaioXCaveira'));
const Calendario = React.lazy(() => import('./Calendario'));

const TUTORIAL_SEEN_KEY = 'qg_central_tutorial_seen';

const VALID_TABS = new Set(['hoje', 'cronograma', 'caveira', 'calendario']);

const TAB_CONFIG = [
  { id: 'hoje', label: 'Hoje', icon: Zap, tutorialStep: 1 },
  { id: 'cronograma', label: 'Cronograma', icon: Repeat, tutorialStep: 2 },
  { id: 'caveira', label: 'Raio-X Caveira', icon: Skull, tutorialStep: 3 },
  { id: 'calendario', label: 'Calendário', icon: CalendarIcon, tutorialStep: 4 }
];

export default function CentralEstudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.has(rawTab) ? rawTab : 'hoje';

  const [tutorialModalState, setTutorialModalState] = useState({ isOpen: false, step: 0 });
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(() => {
    try {
      return localStorage.getItem(TUTORIAL_SEEN_KEY) !== 'true';
    } catch {
      return true;
    }
  });

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

  const markTutorialSeen = () => {
    setShowOnboardingBanner(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  };

  const handleOpenTutorial = (step = 0) => {
    setTutorialModalState({ isOpen: true, step });
  };

  const handleCloseTutorial = () => {
    setTutorialModalState(prev => ({ ...prev, isOpen: false }));
    markTutorialSeen();
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleTutorialGoToTab = (tabId) => {
    handleCloseTutorial();
    if (tabId === 'revisoes') {
      navigate('/revisoes');
      return;
    }
    if (tabId === 'historico') {
      navigate('/estatisticas');
      return;
    }
    if (tabId === 'edital') {
      navigate('/edital');
      return;
    }
    if (VALID_TABS.has(tabId)) {
      setSearchParams({ tab: tabId });
    }
  };

  return (
    <div className="fade-in w-full pb-6 space-y-2.5">
      {/* Cabeçalho Clean sem Caixa Pesada */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/carreira')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Carreira</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">
            Central de Estudos • PRF
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenTutorial(currentTabMeta.tutorialStep)}
            className="h-7 px-2.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Ajuda</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/config')}
            className="h-7 px-3 rounded-lg text-xs font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>+ Ajustar Edital</span>
          </button>
        </div>
      </div>

      {/* Faixa Global Fina de Progresso do Edital */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Conteúdos concluídos <strong className="tabular-nums text-sky-600 dark:text-sky-400">{completionPct}%</strong>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {completedLessons} de {totalLessons} aulas • {subjectsList.length} {subjectsList.length === 1 ? 'disciplina' : 'disciplinas'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0" />
            {estimatedDate?.short ? (
              <span className={`font-medium ${
                examDateConfigured && estimatedDate.isLate
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                Conclusão estimada: <strong className="font-bold text-slate-800 dark:text-slate-100">{estimatedDate.short}</strong>
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Sem previsão calculada</span>
            )}
          </div>
        </div>

        <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400 transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Banner Compacto de Boas-Vindas para Novatos */}
      {showOnboardingBanner && (
        <div className="rounded-lg px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
            <span>
              <strong>Primeira vez aqui?</strong> Faça o guia rápido de 1 minuto para dominar a Central de Estudos.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenTutorial(0)}
              className="h-7 px-2.5 rounded-md text-[11px] font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
            >
              Iniciar Tutorial
            </button>
            <button
              type="button"
              onClick={markTutorialSeen}
              className="h-7 px-2.5 rounded-md text-[11px] font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Já sei usar
            </button>
          </div>
        </div>
      )}

      {/* Abas Horizontais Limpas (Flat Underline) */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {TAB_CONFIG.map((tabItem) => {
            const TabIcon = tabItem.icon;
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => handleTabChange(tabItem.id)}
                className={`flex items-center gap-1.5 px-3 pb-2 pt-1 border-b-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-sky-500 dark:border-sky-400 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-500 dark:text-sky-400' : ''}`} />
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
              <div className="flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Carregando {currentTabMeta.label}...
                  </span>
                </div>
              </div>
            }
          >
            {activeTab === 'cronograma' && <Ciclo />}
            {activeTab === 'caveira' && <RaioXCaveira />}
            {activeTab === 'calendario' && <Calendario />}
          </Suspense>
        )}
      </div>

      {/* Modal de Tutorial Interativo */}
      <CentralEstudosTutorialModal
        isOpen={tutorialModalState.isOpen}
        initialStep={tutorialModalState.step}
        onClose={handleCloseTutorial}
        onGoToTab={handleTutorialGoToTab}
      />
    </div>
  );
}
