import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ChevronLeft, ChevronRight, Sparkles, BookOpen, Repeat,
  BrainCircuit, Calendar, CheckCircle, ArrowRight, Target, Info, Zap, Skull
} from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    id: 'intro',
    tabId: null,
    badge: 'Visão Geral',
    title: 'Bem-vindo à Central de Estudos',
    subtitle: 'Sua estação diária de execução com 4 abas integradas: Hoje, Cronograma, Raio-X Caveira e Calendário.',
    icon: Sparkles,
    accentClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    description:
      'A Central de Estudos reúne as 4 abas operacionais do seu dia a dia (Hoje, Cronograma, Raio-X Caveira e Calendário), enquanto Revisões FSRS, Histórico, Edital, Simulados, Treino TAF e Duelo CTB ficam acessíveis com um clique no menu lateral.',
    bullets: [
      'Acompanhe na faixa superior quantas aulas do edital você já concluiu e a data prevista de fechamento.',
      'Comece pela aba Hoje para executar imediatamente suas aulas do dia, revisões pendentes e conferir sua consistência.',
      'Use o menu lateral esquerdo a qualquer momento para abrir Revisões FSRS, Histórico, Edital e Simulados.'
    ],
    proTip: 'Rotina recomendada: 1) Abra a aba Hoje → 2) Zere suas Revisões FSRS → 3) Assista às aulas do dia e clique em "Exercícios da Aula".'
  },
  {
    id: 'hoje',
    tabId: 'hoje',
    badge: 'Passo 1 • Foco do Dia',
    title: 'Aba Hoje — Execução Rápida sem Distrações',
    subtitle: 'Veja apenas o que precisa ser feito hoje: blocos de teoria, revisões e consistência.',
    icon: Zap,
    accentClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    description:
      'A aba Hoje mostra lado a lado seus blocos de teoria escalados para o dia, seu painel de Revisão FSRS e, na base, seu Heatmap de Consistência junto ao resumo de questões do Caveira.',
    bullets: [
      'Clique em "Aula Assistida" para registrar a conclusão da videoaula, ganhar XP/moedas e alimentar o histórico.',
      'Clique em "Exercícios da Aula" para abrir o Projeto Caveira já filtrado nos subassuntos daquela aula.',
      'Acompanhe seus quadradinhos de estudo dos últimos 12 meses e sua taxa de acertos em questões.'
    ],
    proTip: 'Use o botão "Colar Bizus" ao concluir uma aula para salvar os subassuntos e filtrar questões automaticamente.'
  },
  {
    id: 'cronograma',
    tabId: 'cronograma',
    badge: 'Passo 2 • Visão Semanal',
    title: 'Aba Cronograma — Seus Dias em 3 Colunas',
    subtitle: 'Navegue pelos dias da semana com visão ampla dos títulos completos das aulas.',
    icon: Repeat,
    accentClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    description:
      'O Cronograma exibe 3 colunas largas por vez para que os nomes completos das disciplinas, tópicos e aulas fiquem sempre legíveis, com rolagem horizontal fluida entre os 7 dias.',
    bullets: [
      'Use as pílulas dos dias no topo (DOM, SEG, TER...) para saltar instantaneamente para qualquer dia da semana.',
      'Reordene blocos, personalize o ciclo semanal ou flexível e registre aulas de dias anteriores se necessário.',
      'Veja o tempo total original e acelerado (ex.: 1.5x) de cada dia antes mesmo de começar.'
    ],
    proTip: 'Se você perder um dia de estudo, a reposição automática desloca a fila para você não deixar nenhuma matéria para trás.'
  },
  {
    id: 'caveira',
    tabId: 'caveira',
    badge: 'Passo 3 • Questões & Diagnóstico',
    title: 'Aba Raio-X Caveira — Caderno Tático de Questões',
    subtitle: 'Sincronize questões resolvidas no Caveira e descubra seus pontos fortes e críticos.',
    icon: Skull,
    accentClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    description:
      'O Raio-X Caveira consolida todas as questões que você resolveu, calculando aproveitamento líquido, tempo médio por questão e ranking de assuntos mais errados vs. mais acertados.',
    bullets: [
      'Filtre por período (Hoje, 7 dias, 30 dias), disciplina, assunto ou modalidade (Certo/Errado vs. Múltipla Escolha).',
      'Expanda qualquer disciplina em "Desempenho por Disciplina" para ver a precisão assunto por assunto.',
      'Questões erradas podem entrar automaticamente na sua fila de Revisões FSRS para retenção espaçada.'
    ],
    proTip: 'Antes de iniciar um bloco de teoria, confira no Raio-X Caveira quais subassuntos daquela matéria estão na Zona Crítica.'
  },
  {
    id: 'calendario',
    tabId: 'calendario',
    badge: 'Passo 4 • Planejamento Mensal',
    title: 'Aba Calendário — Previsão de Término do Edital',
    subtitle: 'Saiba em que data cada matéria termina e personalize qualquer dia futuro.',
    icon: Calendar,
    accentClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    description:
      'O Calendário projeta todas as aulas restantes dia a dia com base no seu ritmo atual, exibindo quais aulas serão vistas em cada data e quando cada disciplina será concluída.',
    bullets: [
      'Em "Fim das Disciplinas", clique em uma matéria para destacá-la no mês inteiro.',
      'Clique em qualquer célula do calendário para abrir o modal "Gerenciar Dia" em 2 colunas (sem rolagem).',
      'Use as setas ← e → do teclado dentro do modal para navegar entre dias rapidamente.'
    ],
    proTip: 'Compare a Previsão de Fechamento do Edital com a Data Alvo da Prova para saber se precisa aumentar o ritmo.'
  },
  {
    id: 'revisoes',
    tabId: 'revisoes',
    badge: 'Passo 5 • Desempenho & Edital',
    title: 'Menu Lateral — Revisões FSRS, Histórico e Edital',
    subtitle: 'Acesse suas ferramentas de retenção e evolução na seção Desempenho da barra lateral.',
    icon: BrainCircuit,
    accentClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    description:
      'Para manter a Central de Estudos limpa e rápida, os módulos analíticos ficam organizados na seção "Desempenho" do menu lateral esquerdo.',
    bullets: [
      'Revisões: resolva sua fila diária calculada pelo algoritmo FSRS v6 e veja o mapa de carga dos próximos 7 dias.',
      'Histórico: acompanhe seus gráficos de horas estudadas (7, 15 ou 30 dias) e distribuição de tempo por matéria.',
      'Edital: consulte o edital verticalizado completo da PRF por Bloco (B1, B2 e B3) e busque qualquer tópico.'
    ],
    proTip: 'Clique no botão ao lado para abrir diretamente o Centro de Comando de Retenção (Revisões FSRS).'
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
