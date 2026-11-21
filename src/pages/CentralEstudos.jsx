import React, { useState, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CentralEstudosTutorialModal from '../components/CentralEstudosTutorialModal';
import {
  Repeat, BrainCircuit, BarChart2, Calendar as CalendarIcon, BookOpen,
  Settings, Info, Sparkles, Search, ChevronDown, ChevronUp, ArrowLeft,
  Skull, Target, Crosshair, Award, Clock, CheckCircle, X, Plus
} from 'lucide-react';

const Ciclo = React.lazy(() => import('./Ciclo'));
const Revisoes = React.lazy(() => import('./Revisoes'));
const Estatisticas = React.lazy(() => import('./Estatisticas'));
const Calendario = React.lazy(() => import('./Calendario'));

const TUTORIAL_SEEN_KEY = 'qg_central_tutorial_seen';

const VALID_TABS = new Set(['cronograma', 'revisoes', 'historico', 'calendario', 'edital']);

const TAB_CONFIG = [
  { id: 'cronograma', label: 'Cronograma', icon: Repeat, tutorialStep: 2 },
  { id: 'revisoes', label: 'Revisões', icon: BrainCircuit, tutorialStep: 3 },
  { id: 'historico', label: 'Histórico', icon: BarChart2, tutorialStep: 5 },
  { id: 'calendario', label: 'Calendário', icon: CalendarIcon, tutorialStep: 4 },
  { id: 'edital', label: 'Edital', icon: BookOpen, tutorialStep: 1 }
];

function EditalVerticalizadoView({ subjectsList, onOpenConfig }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState('ALL');
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const toggleSubjectExpand = (subId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return subjectsList.filter((sub) => {
      if (blockFilter !== 'ALL' && (sub.block || 'B1') !== blockFilter) {
        return false;
      }
      if (!query) return true;
      const matchesSubject = (sub.name || '').toLowerCase().includes(query);
      const matchesTopic = (sub.topics || []).some(t => (t.name || '').toLowerCase().includes(query));
      return matchesSubject || matchesTopic;
    });
  }, [subjectsList, blockFilter, searchQuery]);

  if (subjectsList.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center flex flex-col items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="max-w-md space-y-0.5">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
            Seu Edital ainda está vazio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastre suas disciplinas e assuntos (ou importe sua grade) na tela de Ajustes para acompanhar seu progresso completo por aqui.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConfig}
          className="h-8 px-3.5 rounded-lg text-xs font-black bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Disciplinas</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Barra de Filtros Compacta */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar disciplina ou assunto..."
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'B1', label: 'Bloco 1' },
              { id: 'B2', label: 'Bloco 2' },
              { id: 'B3', label: 'Bloco 3' }
            ].map((blk) => (
              <button
                key={blk.id}
                type="button"
                onClick={() => setBlockFilter(blk.id)}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  blockFilter === blk.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-850 dark:text-white dark:border-slate-600'
                    : 'bg-transparent text-slate-500 border-slate-200 hover:border-slate-300 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {blk.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenConfig}
          className="h-8 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Gerenciar Matérias</span>
        </button>
      </div>

      {/* Lista de Disciplinas */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Nenhuma disciplina ou tópico encontrado para os filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSubjects.map((sub) => {
            const topics = sub.topics || [];
            const subTotal = topics.reduce((acc, t) => acc + (Number(t.total) || 0), 0);
            const subDone = topics.reduce(
              (acc, t) => acc + Math.min(Number(t.total) || 0, Number(t.completed) || 0),
              0
            );
            const subPct = subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0;
            const isExpanded = Boolean(expandedSubjects[sub.id]) || Boolean(searchQuery.trim());

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2.5"
              >
                <div
                  onClick={() => toggleSubjectExpand(sub.id)}
                  className="flex items-start justify-between gap-2.5 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${sub.color || 'bg-slate-700 text-white'}`}>
                        {sub.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {sub.block || 'B1'}
                      </span>
                      {subPct === 100 && subTotal > 0 && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Concluída
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{topics.length} {topics.length === 1 ? 'tópico' : 'tópicos'}</span>
                      <span>•</span>
                      <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        {subDone}/{subTotal} aulas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black tabular-nums text-sky-600 dark:text-sky-400">
                      {subPct}%
                    </span>
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Recolher tópicos' : 'Expandir tópicos'}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Barra da Disciplina */}
                <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      subPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-teal-400'
                    }`}
                    style={{ width: `${subPct}%` }}
                  />
                </div>

                {/* Tópicos Expansíveis */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    {topics.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum assunto cadastrado nesta matéria.</p>
                    ) : (
                      topics.map((topic, idx) => {
                        const tTotal = Number(topic.total) || 0;
                        const tDone = Math.min(tTotal, Number(topic.completed) || 0);
                        const tPct = tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0;
                        const isDone = tTotal > 0 && tDone >= tTotal;
                        return (
                          <div
                            key={`${sub.id}-t-${idx}`}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {isDone ? (
                                  <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : (
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span className={`text-[11px] font-bold truncate ${isDone ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {topic.name || `Assunto ${idx + 1}`}
                                </span>
                              </div>
                              <div className="mt-1 w-full bg-slate-200/80 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-500 to-teal-400'}`}
                                  style={{ width: `${tPct}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] font-black tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                              {tDone}/{tTotal}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CentralEstudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.has(rawTab) ? rawTab : 'cronograma';

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
    reviews = [],
    targetExamDate,
    getLocalDateStr,
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

  const todayStr = getLocalDateStr ? getLocalDateStr() : '';
  const dueReviewsCount = useMemo(
    () => (reviews || []).filter(r => r && (!todayStr || r.nextDateStr <= todayStr)).length,
    [reviews, todayStr]
  );

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
    if (VALID_TABS.has(tabId)) {
      setSearchParams({ tab: tabId });
    }
  };

  const quickModuleLinks = [
    { label: 'Raio-X Caveira', path: '/caveira', icon: Skull },
    { label: 'Simulados', path: '/simulados', icon: Target },
    { label: 'Duelo CTB', path: '/duelo', icon: Crosshair },
    { label: 'Carreira', path: '/', icon: Award }
  ];

  return (
    <div className="fade-in w-full pb-6 space-y-2.5">
      {/* Cabeçalho Clean sem Caixa Pesada */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
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

        {/* Atalhos Discretos em Linha */}
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          {quickModuleLinks.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                <ItemIcon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
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
                {tabItem.id === 'revisoes' && dueReviewsCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none tabular-nums bg-red-500 text-white">
                    {dueReviewsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      <div>
        {activeTab === 'edital' ? (
          <EditalVerticalizadoView
            subjectsList={subjectsList}
            onOpenConfig={() => navigate('/config')}
          />
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
            {activeTab === 'revisoes' && <Revisoes />}
            {activeTab === 'historico' && <Estatisticas />}
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
