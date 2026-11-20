import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ChevronLeft, ChevronRight, Sparkles, BookOpen, Repeat,
  BrainCircuit, Calendar, BarChart2, CheckCircle, ArrowRight, Target, Info
} from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    id: 'intro',
    tabId: null,
    badge: 'Visão Geral',
    title: 'Bem-vindo à Central de Estudos',
    subtitle: 'Tudo o que você precisa para estudar no dia a dia, organizado por tipo em um só lugar.',
    icon: Sparkles,
    accentClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    description:
      'Para facilitar sua rotina, reunimos as 5 ferramentas principais de estudo em abas logo no topo: Cronograma, Revisões, Histórico, Calendário e Edital.',
    bullets: [
      'Acompanhe na barra superior quantas aulas do edital você já concluiu e a data prevista para terminar.',
      'Alterne entre as abas sem perder o contexto — ideal para seguir uma rotina simples todos os dias.',
      'Use os atalhos no cabeçalho para acessar rapidamente Raio-X Caveira, Simulados e Duelo CTB.'
    ],
    proTip: 'Rotina recomendada para iniciantes: 1) Zere suas Revisões → 2) Estude os blocos do Cronograma → 3) Confira seu progresso no Histórico.'
  },
  {
    id: 'edital',
    tabId: 'edital',
    badge: 'Passo 1 • Base',
    title: 'Aba Edital — Seu Mapa Completo',
    subtitle: 'Visualize todas as disciplinas e assuntos que faltam até fechar o edital da PRF.',
    icon: BookOpen,
    accentClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    description:
      'Aqui você enxerga cada disciplina organizada por Bloco (B1, B2 ou B3), filtra matérias específicas e expande cada cartão para conferir o progresso aula por aula.',
    bullets: [
      'Clique em uma matéria para abrir todos os tópicos e ver quantas aulas já foram concluídas.',
      'Filtre por Bloco (B1, B2, B3) ou digite o nome de um assunto na busca para achar rápido.',
      'Precisa adicionar matérias, links de aulas ou ajustar sua velocidade? Clique em "Gerenciar / Adicionar Matérias".'
    ],
    proTip: 'Se você ainda não cadastrou matérias, comece pela aba Edital ou clique em "Ajustar Edital" no canto superior direito.'
  },
  {
    id: 'cronograma',
    tabId: 'cronograma',
    badge: 'Passo 2 • Execução Diária',
    title: 'Aba Cronograma — O Que Estudar Hoje',
    subtitle: 'Siga os blocos programados para o dia e registre cada aula assistida.',
    icon: Repeat,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    description:
      'O Cronograma mostra exatamente quais disciplinas estão escaladas para hoje e para a semana. É aqui que você marca os blocos concluídos e registra suas aulas.',
    bullets: [
      'Cada card representa um bloco de estudo do seu dia com a próxima aula da fila já selecionada.',
      'Ao finalizar uma aula, registre a conclusão para avançar no Edital, ganhar XP e alimentar seu histórico.',
      'Você pode reordenar blocos, usar o ciclo semanal ou flexível e ajustar sua meta diária.'
    ],
    proTip: 'Mantenha o Cronograma como sua aba padrão ao abrir o aplicativo pela manhã.'
  },
  {
    id: 'revisoes',
    tabId: 'revisoes',
    badge: 'Passo 3 • Retenção FSRS',
    title: 'Aba Revisões — Nunca Mais Esqueça a Matéria',
    subtitle: 'O sistema calcula automaticamente o dia certo de revisar cada questão ou assunto.',
    icon: BrainCircuit,
    accentClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    description:
      'Sempre que houver revisões pendentes para hoje, um contador aparecerá diretamente na aba Revisões. Resolver essa fila antes da teoria evita o esquecimento.',
    bullets: [
      'Filtre por disciplina ou alterne entre revisões do Projeto Caveira e revisões do Ciclo.',
      'Avalie o nível de dificuldade ao responder (Fácil, Bom, Difícil, Errei) para o algoritmo FSRS recalcular o próximo intervalo.',
      'Use o termômetro de retenção para identificar tópicos que precisam de reforço.'
    ],
    proTip: 'Tente manter o contador de revisões zerado todos os dias — poucos minutos garantem alta pontuação na prova.'
  },
  {
    id: 'calendario',
    tabId: 'calendario',
    badge: 'Passo 4 • Planejamento',
    title: 'Aba Calendário — Previsão e Ajustes no Mês',
    subtitle: 'Saiba em que data cada matéria termina e personalize dias específicos.',
    icon: Calendar,
    accentClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    description:
      'O Calendário projeta suas aulas futuras dia a dia com base no seu ciclo atual, mostrando o nome das aulas previstas e a data estimada de término.',
    bullets: [
      'Em "Fim das Disciplinas", clique em qualquer matéria para destacá-la em todo o calendário mensal (e oculte o painel quando quiser mais espaço).',
      'Clique em qualquer dia futuro para abrir "Gerenciar Dia" e adaptar a programação daquela data ou do futuro.',
      'Use as setas ← e → do teclado dentro do modal para trocar de dia rapidamente e ative o salvamento automático se preferir.'
    ],
    proTip: 'Verifique a barra de atraso/risco comparando sua previsão de término com a Data Alvo da Prova.'
  },
  {
    id: 'historico',
    tabId: 'historico',
    badge: 'Passo 5 • Métricas',
    title: 'Aba Histórico — Seus Dados e Evolução',
    subtitle: 'Analise horas estudadas, ritmo semanal e domínio por disciplina.',
    icon: BarChart2,
    accentClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    description:
      'No Histórico você acompanha sua evolução em gráficos de estudo diário (7, 15 ou 30 dias), equilíbrio entre matérias e anotações de revisão.',
    bullets: [
      'Alterne o período do gráfico para acompanhar sua média de minutos diários.',
      'Expanda qualquer disciplina para ler suas anotações pessoais de revisão.',
      'Cruze esses dados com seus Simulados para ajustar o tempo dedicado às matérias com menor percentual.'
    ],
    proTip: 'Use o Histórico uma vez por semana (por exemplo, no domingo) para recalibrar seu ciclo.'
  }
];

function TutorialDialogBody({ initialStep = 0, onClose, onGoToTab }) {
  const safeInitial = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Number(initialStep) || 0));
  const [stepIndex, setStepIndex] = useState(safeInitial);

  const current = TUTORIAL_STEPS[stepIndex];
  const StepIcon = current.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  const progressPct = Math.round(((stepIndex + 1) / TUTORIAL_STEPS.length) * 100);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setStepIndex(prev => (prev < TUTORIAL_STEPS.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="central-tutorial-title"
      >
        {/* Barra de Progresso no Topo */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Cabeçalho */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${current.accentClass}`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/70">
                  {current.badge}
                </span>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                  {stepIndex + 1} de {TUTORIAL_STEPS.length}
                </span>
              </div>
              <h2 id="central-tutorial-title" className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {current.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar tutorial"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {current.description}
          </p>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-500" /> Como aproveitar na prática
            </span>
            <ul className="space-y-2">
              {current.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong className="font-black">Dica de Ouro: </strong>
              {current.proTip}
            </p>
          </div>
        </div>

        {/* Indicadores de Passo + Ações */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Dots clicáveis */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStepIndex(idx)}
                title={st.title}
                aria-label={`Ir para passo ${idx + 1}: ${st.title}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === stepIndex
                    ? 'w-6 bg-blue-600 dark:bg-blue-400'
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Botões de Navegação */}
          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            {current.tabId && onGoToTab && (
              <button
                type="button"
                onClick={() => onGoToTab(current.tabId)}
                className="h-9 px-3 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Abrir esta aba</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
              disabled={isFirst}
              className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Concluir Tutorial</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex(prev => Math.min(TUTORIAL_STEPS.length - 1, prev + 1))}
                className="h-9 px-4 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CentralEstudosTutorialModal({ isOpen, initialStep = 0, onClose, onGoToTab }) {
  if (!isOpen) return null;
  return (
    <TutorialDialogBody
      key={initialStep}
      initialStep={initialStep}
      onClose={onClose}
      onGoToTab={onGoToTab}
    />
  );
}
