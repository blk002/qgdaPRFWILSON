import React, { useState, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CentralEstudosTutorialModal from '../components/CentralEstudosTutorialModal';
import {
  Library, Repeat, BrainCircuit, BarChart2, Calendar as CalendarIcon, BookOpen,
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
  {
    id: 'cronograma',
    label: 'Cronograma',
    icon: Repeat,
    tutorialStep: 2,
    hint: 'Veja os blocos planejados para hoje, acompanhe a semana e registre cada aula assistida.'
  },
  {
    id: 'revisoes',
    label: 'Revisões',
    icon: BrainCircuit,
    tutorialStep: 3,
    hint: 'Zere sua fila de retenção FSRS primeiro para blindar a memória antes de avançar na teoria.'
  },
  {
    id: 'historico',
    label: 'Histórico',
    icon: BarChart2,
    tutorialStep: 5,
    hint: 'Analise seus minutos estudados por dia, equilíbrio por matéria e anotações pessoais.'
  },
  {
    id: 'calendario',
    label: 'Calendário',
    icon: CalendarIcon,
    tutorialStep: 4,
    hint: 'Confira a previsão mensal das aulas, destaque disciplinas e personalize dias específicos.'
  },
  {
    id: 'edital',
    label: 'Edital',
    icon: BookOpen,
    tutorialStep: 1,
    hint: 'Explore todas as matérias e tópicos do seu edital verticalizado por Bloco (B1, B2 e B3).'
  }
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
            Seu Edital ainda está vazio
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cadastre suas disciplinas e assuntos (ou importe sua grade) na tela de Ajustes para acompanhar seu progresso completo por aqui.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConfig}
          className="h-10 px-4 rounded-xl text-xs sm:text-sm font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Disciplinas em Ajustes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Ação */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar disciplina ou assunto do edital..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'Todos Blocos' },
              { id: 'B1', label: 'Bloco 1' },
              { id: 'B2', label: 'Bloco 2' },
              { id: 'B3', label: 'Bloco 3' }
            ].map((blk) => (
              <button
                key={blk.id}
                type="button"
                onClick={() => setBlockFilter(blk.id)}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  blockFilter === blk.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800'
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
          className="h-9 px-3.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-slate-700/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Gerenciar / Adicionar Matérias</span>
        </button>
      </div>

      {/* Lista de Disciplinas */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma disciplina ou tópico encontrado para os filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3"
              >
                <div
                  onClick={() => toggleSubjectExpand(sub.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${sub.color || 'bg-blue-600 text-white'}`}>
                        {sub.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
                        {sub.block || 'B1'}
                      </span>
                      {subPct === 100 && subTotal > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Concluída
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{topics.length} {topics.length === 1 ? 'tópico' : 'tópicos'}</span>
                      <span>•</span>
                      <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        {subDone}/{subTotal} aulas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black tabular-nums text-blue-600 dark:text-blue-400">
                      {subPct}%
                    </span>
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Recolher tópicos' : 'Expandir tópicos'}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Barra da Disciplina */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      subPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${subPct}%` }}
                  />
                </div>

                {/* Tópicos Expansíveis */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
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
                            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {isDone ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span className={`text-xs font-bold truncate ${isDone ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {topic.name || `Assunto ${idx + 1}`}
                                </span>
                              </div>
                              <div className="mt-1.5 w-full bg-slate-200/80 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${tPct}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-[11px] font-black tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
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
    <div className="fade-in w-full pb-10 space-y-5">
      {/* Cabeçalho Unificado */}
      <section className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Carreira</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Hub Operacional
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                  Central de Estudos • PRF
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Cronograma diário, revisões FSRS, histórico, calendário e edital integrados em uma única tela.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => handleOpenTutorial(0)}
              className="h-9 px-3.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/80 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Tutorial da Central</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/config')}
              className="h-9 px-3.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Ajustar Edital</span>
            </button>
          </div>
        </div>

        {/* Atalhos Rápidos de Módulos Complementares */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
            Atalhos rápidos:
          </span>
          {quickModuleLinks.map((item) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ItemIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Faixa Global de Progresso do Edital */}
        <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-slate-700 dark:text-slate-200">
                Conteúdos concluídos {completionPct}%
              </span>
              <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                ({completedLessons} de {totalLessons} aulas • {subjectsList.length} {subjectsList.length === 1 ? 'disciplina' : 'disciplinas'})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              {estimatedDate?.short ? (
                <span className={`font-bold ${
                  examDateConfigured && estimatedDate.isLate
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}>
                  Conclusão estimada: <strong className="font-black">{estimatedDate.short}</strong>
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Sem previsão calculada</span>
              )}
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Banner de Onboarding para Novatos */}
      {showOnboardingBanner && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-emerald-500/10 border border-blue-300/70 dark:border-blue-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                Primeira vez na Central de Estudos?
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Veja em 1 minuto como combinar Cronograma, Revisões FSRS, Calendário, Histórico e Edital na ordem certa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenTutorial(0)}
              className="h-8 px-3.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              Iniciar Tutorial
            </button>
            <button
              type="button"
              onClick={markTutorialSeen}
              className="h-8 px-3 rounded-xl text-xs font-bold bg-white/80 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Já sei usar
            </button>
          </div>
        </div>
      )}

      {/* Barra de 5 Abas por Tipo + Dica Contextual */}
      <div className="space-y-2.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max sm:grid sm:grid-cols-5 sm:min-w-0">
            {TAB_CONFIG.map((tabItem) => {
              const TabIcon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => handleTabChange(tabItem.id)}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tabItem.label}</span>
                  {tabItem.id === 'revisoes' && dueReviewsCount > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none tabular-nums ${
                        isActive
                          ? 'bg-white text-blue-700'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {dueReviewsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dica Didática Contextual da Aba Selecionada */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>{currentTabMeta.hint}</span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenTutorial(currentTabMeta.tutorialStep)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
          >
            Como usar esta aba?
          </button>
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
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
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
