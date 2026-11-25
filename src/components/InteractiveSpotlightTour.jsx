import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Award,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Library,
  Repeat,
  Settings,
  Skull,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { TOUR_COMPLETED_KEY, TOUR_EVENT_NAME } from '../lib/interactiveTour';

const TOUR_STEPS = [
  {
    id: 'nav-estudos',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="nav-estudos"]', '[data-tour="mobile-estudos"]'],
    badge: 'Navegação principal',
    title: 'Central de Estudos',
    description:
      'Sua estação principal de execução diária. Aqui ficam as aulas de hoje, cronograma semanal, rotina de vida, questões do Caveira, calendário, simulados e discursiva.',
    tip: 'Clique aqui sempre que quiser voltar direto para o foco do dia.',
    icon: Library,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'nav-desempenho',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="nav-desempenho"]', '[data-tour="mobile-revisoes"]'],
    badge: 'Menu de evolução',
    title: 'Desempenho e Retenção',
    description:
      'Reúne Revisões FSRS, Edital verticalizado, Histórico de horas, Treino TAF e Duelo CTB. Quando houver revisões pendentes, o contador vermelho aparece aqui.',
    tip: 'Abra este menu diariamente para acompanhar seu progresso e zerar revisões.',
    icon: Target,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'nav-extras',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="nav-extras"]', '[data-tour="mobile-carreira"]'],
    badge: 'Gamificação',
    title: 'Carreira e Extras',
    description:
      'Acompanhe sua subida de patente na PRF, cuide do seu Mascote K9 e troque as moedas conquistadas por recompensas na Loja.',
    tip: 'Manter constância diária acelera seu ganho de XP e desbloqueia novas patentes.',
    icon: Sparkles,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'nav-edital',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="nav-edital-progress"]', '[data-tour="mobile-edital"]'],
    badge: 'Termômetro do edital',
    title: 'Progresso e Previsão de Término',
    description:
      'Mostra a porcentagem concluída do edital e a data estimada de fechamento no seu ritmo atual. Clique neste bloco para abrir o Edital completo.',
    tip: 'A previsão se recalcula automaticamente conforme você conclui aulas.',
    icon: BookOpen,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'nav-rank',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="nav-rank-coins"]'],
    desktopOnly: true,
    badge: 'Sua patente',
    title: 'Patente e Saldo de Moedas',
    description:
      'Exibe sua patente atual e quantas moedas você acumulou com aulas assistidas, revisões e questões resolvidas.',
    tip: 'Clique aqui para ver suas medalhas, metas semanais e histórico de evolução.',
    icon: Award,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'nav-ajustes',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="nav-ajustes"]', '[data-tour="central-ajustar-edital"]'],
    badge: 'Configurações',
    title: 'Ajustes do QG',
    description:
      'Configure matérias, metas de tempo por disciplina, velocidade das videoaulas, data alvo da prova, notificações e backup na nuvem.',
    tip: 'Sempre que quiser adaptar seu edital ou ciclo de estudos, venha por aqui.',
    icon: Settings,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'central-tabs',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="central-tabs"]'],
    badge: 'Estações de estudo',
    title: 'Abas da Central de Estudos',
    description:
      'Alterne rapidamente entre suas 7 frentes de preparação sem perder o contexto. A seguir, vamos destacar os blocos essenciais.',
    tip: 'Você pode trocar de aba a qualquer momento com um clique.',
    icon: Zap,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'hoje-teoria',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="hoje-teoria"]'],
    badge: 'Execução diária',
    title: 'Teoria de Hoje',
    description:
      'Lista apenas as aulas planejadas para hoje, já com duração original e acelerada. Ao terminar, clique em "Aula Assistida" para registrar seu avanço e praticar questões.',
    tip: 'Foque em concluir os blocos deste painel antes de abrir conteúdos extras.',
    icon: BookOpen,
    preferredPlacement: 'right',
    padding: 8,
  },
  {
    id: 'hoje-revisoes',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="hoje-revisoes"]'],
    badge: 'Memória de longo prazo',
    title: 'Fila de Revisão FSRS',
    description:
      'Exibe os assuntos e questões que chegaram ao ponto ideal de revisão. O algoritmo FSRS ajusta o próximo intervalo de acordo com sua taxa de acertos.',
    tip: 'Zerar esta fila logo no começo do dia garante retenção muito maior até a prova.',
    icon: BrainCircuit,
    preferredPlacement: 'left',
    padding: 8,
  },
  {
    id: 'tab-cronograma',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="tab-cronograma"]'],
    badge: 'Visão semanal',
    title: 'Aba Cronograma',
    description:
      'Visualize a grade completa da semana, navegue por semanas futuras, acompanhe a carga horária diária e troque disciplinas concluídas.',
    tip: 'Se perder um dia de estudo, o sistema reorganiza a fila automaticamente.',
    icon: Repeat,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'tab-rotina',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="tab-rotina"]'],
    badge: 'Gestão de horários',
    title: 'Aba Rotina de Vida',
    description:
      'Monte seus horários da semana inteira conciliando trabalho, descanso, blocos de estudo e treinos do TAF sincronizados automaticamente.',
    tip: 'Passe o mouse sobre qualquer dia na grade para adicionar ou ajustar horários.',
    icon: CalendarClock,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'tab-caveira',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="tab-caveira"]'],
    badge: 'Diagnóstico tático',
    title: 'Aba Raio-X Caveira',
    description:
      'Analise suas questões resolvidas por bloco da PRF (B1, B2 e B3), identifique assuntos na zona crítica e acompanhe seu desempenho líquido.',
    tip: 'Questões erradas podem ser enviadas direto para sua fila de revisões FSRS.',
    icon: Skull,
    preferredPlacement: 'bottom',
    padding: 6,
  },
  {
    id: 'tab-discursiva',
    route: '/estudos?tab=hoje',
    selectors: ['[data-tour="tab-discursiva"]'],
    badge: 'Redação Cebraspe',
    title: 'Aba Discursiva PRF',
    description:
      'Consulte repertórios atualizados pelos 5 eixos da PRF, estrutura de 30 linhas no padrão Cebraspe e a calculadora oficial de nota discursiva.',
    tip: 'Favoritar repertórios-chave agiliza a revisão antes de cada simulado de redação.',
    icon: FileText,
    preferredPlacement: 'bottom',
    padding: 6,
  },
];

function findVisibleTarget(selectors) {
  if (!Array.isArray(selectors)) return null;
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return el;
    }
  }
  return null;
}

function computeTooltipPosition(targetRect, cardWidth, cardHeight, preferredPlacement, vw, vh) {
  const margin = 14;
  const gap = 16;

  if (!targetRect) {
    return {
      top: Math.max(margin, Math.round((vh - cardHeight) / 2)),
      left: Math.max(margin, Math.round((vw - cardWidth) / 2)),
      placement: 'center',
      arrowOffset: 0,
    };
  }

  const spaceBottom = vh - targetRect.bottom - margin;
  const spaceTop = targetRect.top - margin;
  const spaceRight = vw - targetRect.right - margin;
  const spaceLeft = targetRect.left - margin;

  const fits = {
    bottom: spaceBottom >= cardHeight + gap,
    top: spaceTop >= cardHeight + gap,
    right: spaceRight >= cardWidth + gap && vw >= 768,
    left: spaceLeft >= cardWidth + gap && vw >= 768,
  };

  const priorityOrder = [
    preferredPlacement,
    'bottom',
    'top',
    'right',
    'left',
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  let chosen = priorityOrder.find((dir) => fits[dir]);
  if (!chosen) {
    // Escolhe o lado vertical com mais espaço disponível
    chosen = spaceBottom >= spaceTop ? 'bottom' : 'top';
  }

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  let top = margin;
  let left = margin;
  let arrowOffset = 0;

  if (chosen === 'bottom' || chosen === 'top') {
    left = Math.max(margin, Math.min(vw - cardWidth - margin, Math.round(targetCenterX - cardWidth / 2)));
    if (chosen === 'bottom') {
      top = Math.min(vh - cardHeight - margin, Math.round(targetRect.bottom + gap));
    } else {
      top = Math.max(margin, Math.round(targetRect.top - cardHeight - gap));
    }
    arrowOffset = Math.max(22, Math.min(cardWidth - 22, Math.round(targetCenterX - left)));
  } else {
    top = Math.max(margin, Math.min(vh - cardHeight - margin, Math.round(targetCenterY - cardHeight / 2)));
    if (chosen === 'right') {
      left = Math.min(vw - cardWidth - margin, Math.round(targetRect.right + gap));
    } else {
      left = Math.max(margin, Math.round(targetRect.left - cardWidth - gap));
    }
    arrowOffset = Math.max(22, Math.min(cardHeight - 22, Math.round(targetCenterY - top)));
  }

  return { top, left, placement: chosen, arrowOffset };
}

export default function InteractiveSpotlightTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  const [targetRect, setTargetRect] = useState(null);
  const [cardSize, setCardSize] = useState({ width: 368, height: 248 });

  const cardRef = useRef(null);
  const activeElementRef = useRef(null);

  const activeSteps = useMemo(() => {
    const isMobile = viewport.w < 768;
    return isMobile ? TOUR_STEPS.filter((s) => !s.desktopOnly) : TOUR_STEPS;
  }, [viewport.w]);

  const safeStepIndex = Math.max(0, Math.min(activeSteps.length - 1, stepIndex));
  const currentStep = activeSteps[safeStepIndex] || activeSteps[0];

  const closeTour = useCallback((completed = false) => {
    setIsOpen(false);
    setTargetRect(null);
    activeElementRef.current = null;
    if (completed) {
      try {
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
      } catch {
        // Ignora erro de localStorage
      }
      toast.success('Tutorial concluído! Você pode repetir quando quiser pelo botão Tutorial.');
    }
  }, []);

  const goNext = useCallback(() => {
    if (safeStepIndex >= activeSteps.length - 1) {
      closeTour(true);
      return;
    }
    setStepIndex((prev) => Math.min(activeSteps.length - 1, prev + 1));
  }, [safeStepIndex, activeSteps.length, closeTour]);

  const goPrev = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Escuta evento global para abrir o tutorial de qualquer lugar do app
  useEffect(() => {
    const handleStart = (event) => {
      const requestedId = event?.detail?.startStepId;
      const isMobile = window.innerWidth < 768;
      const steps = isMobile ? TOUR_STEPS.filter((s) => !s.desktopOnly) : TOUR_STEPS;
      let nextIdx = 0;
      if (requestedId) {
        const foundIdx = steps.findIndex((s) => s.id === requestedId);
        if (foundIdx >= 0) nextIdx = foundIdx;
      }
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setStepIndex(nextIdx);
      setIsOpen(true);
    };

    window.addEventListener(TOUR_EVENT_NAME, handleStart);
    return () => window.removeEventListener(TOUR_EVENT_NAME, handleStart);
  }, []);

  // Navega automaticamente para a rota necessária do passo atual
  useEffect(() => {
    if (!isOpen || !currentStep?.route) return;
    const currentFull = `${location.pathname}${location.search}`;
    if (currentFull !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isOpen, currentStep, location.pathname, location.search, navigate]);

  // Rastreia posição e tamanho do elemento alvo em tempo real
  useEffect(() => {
    if (!isOpen || !currentStep) return undefined;

    let cancelled = false;
    let pollAttempts = 0;
    let pollTimer = null;
    let resizeObserver = null;

    const measureTarget = (shouldScroll = false) => {
      if (cancelled) return false;
      const el = findVisibleTarget(currentStep.selectors);
      if (!el) {
        activeElementRef.current = null;
        return false;
      }

      activeElementRef.current = el;
      const rawRect = el.getBoundingClientRect();

      // Só rola se o elemento estiver fora da área confortável da tela
      if (shouldScroll) {
        const isStickyTop = rawRect.top >= 0 && rawRect.bottom <= 72;
        const isStickyBottom = rawRect.top >= window.innerHeight - 80;
        const outOfView = rawRect.top < 74 || rawRect.bottom > window.innerHeight - 74;
        if (!isStickyTop && !isStickyBottom && outOfView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }

      const pad = currentStep.padding ?? 6;
      const nextRect = {
        top: Math.max(4, Math.round(rawRect.top - pad)),
        left: Math.max(4, Math.round(rawRect.left - pad)),
        width: Math.min(window.innerWidth - 8, Math.round(rawRect.width + pad * 2)),
        height: Math.min(window.innerHeight - 8, Math.round(rawRect.height + pad * 2)),
      };
      nextRect.right = nextRect.left + nextRect.width;
      nextRect.bottom = nextRect.top + nextRect.height;

      setTargetRect(nextRect);

      if (typeof ResizeObserver !== 'undefined' && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          window.requestAnimationFrame(() => measureTarget(false));
        });
        resizeObserver.observe(el);
      }
      return true;
    };

    const locateWithRetry = () => {
      if (cancelled) return;
      const found = measureTarget(pollAttempts === 0);
      if (found) {
        // Re-mede logo após eventual rolagem suave assentar
        pollTimer = window.setTimeout(() => {
          window.requestAnimationFrame(() => measureTarget(false));
        }, 280);
      } else if (pollAttempts < 18) {
        pollAttempts += 1;
        pollTimer = window.setTimeout(locateWithRetry, 70);
      } else {
        setTargetRect(null);
      }
    };

    const rafId = window.requestAnimationFrame(locateWithRetry);

    const handleViewportUpdate = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      window.requestAnimationFrame(() => measureTarget(false));
    };

    window.addEventListener('resize', handleViewportUpdate);
    window.addEventListener('scroll', handleViewportUpdate, true);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      if (pollTimer) window.clearTimeout(pollTimer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleViewportUpdate);
      window.removeEventListener('scroll', handleViewportUpdate, true);
    };
  }, [isOpen, currentStep, location.pathname, location.search]);

  // Mede o card flutuante para posicionamento preciso sem cortes
  useEffect(() => {
    if (!isOpen) return undefined;
    const rafId = window.requestAnimationFrame(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCardSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
        }
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen, safeStepIndex, viewport.w]);

  // Navegação por teclado estilo videogame (← → Enter Esc)
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTour(false);
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goNext, goPrev, closeTour]);

  const cardWidth = Math.min(376, viewport.w - 28);
  const tooltipPos = useMemo(
    () =>
      computeTooltipPosition(
        targetRect,
        cardWidth,
        cardSize.height,
        currentStep?.preferredPlacement || 'bottom',
        viewport.w,
        viewport.h
      ),
    [targetRect, cardWidth, cardSize.height, currentStep?.preferredPlacement, viewport.w, viewport.h]
  );

  if (!isOpen || !currentStep) return null;

  const StepIcon = currentStep.icon || Compass;
  const isFirst = safeStepIndex === 0;
  const isLast = safeStepIndex === activeSteps.length - 1;
  const progressPct = Math.round(((safeStepIndex + 1) / activeSteps.length) * 100);

  return createPortal(
    <div
      className="fixed inset-0 z-[160] font-sans"
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial interativo: ${currentStep.title}`}
    >
      {/* Fundo escurecido com recorte SVG exato sobre o botão destacado */}
      <svg
        className="fixed inset-0 w-screen h-screen pointer-events-auto"
        onClick={() => closeTour(false)}
        aria-hidden="true"
      >
        <defs>
          <mask id="qg-spotlight-cutout-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                ry="12"
                fill="black"
                style={{ transition: 'all 260ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.72)"
          mask="url(#qg-spotlight-cutout-mask)"
        />
      </svg>

      {/* Moldura tática luminosa ao redor do elemento destacado */}
      {targetRect && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none z-[161] rounded-xl border-2 border-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.22),0_0_26px_rgba(14,165,233,0.4)]"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            transition: 'all 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Cantoneiras estilo HUD de jogo */}
          <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white dark:border-sky-200 rounded-tl-md" />
          <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white dark:border-sky-200 rounded-tr-md" />
          <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white dark:border-sky-200 rounded-bl-md" />
          <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white dark:border-sky-200 rounded-br-md" />
        </div>
      )}

      {/* Caixa de diálogo flutuante ancorada ao elemento */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={cardRef}
          key={currentStep.id}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-[165] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-[0_24px_60px_-14px_rgba(2,6,23,0.45)] dark:shadow-[0_24px_60px_-14px_rgba(0,0,0,0.85)] overflow-visible"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: cardWidth,
            transition: 'top 260ms cubic-bezier(0.16, 1, 0.3, 1), left 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Seta apontando para o botão destacado */}
          {targetRect && tooltipPos.placement === 'bottom' && (
            <span
              aria-hidden="true"
              className="absolute -top-[7px] w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-t border-l border-slate-200 dark:border-slate-700/90"
              style={{ left: tooltipPos.arrowOffset - 7 }}
            />
          )}
          {targetRect && tooltipPos.placement === 'top' && (
            <span
              aria-hidden="true"
              className="absolute -bottom-[7px] w-3.5 h-3.5 rotate-45 bg-slate-50 dark:bg-slate-950 border-b border-r border-slate-200 dark:border-slate-700/90"
              style={{ left: tooltipPos.arrowOffset - 7 }}
            />
          )}
          {targetRect && tooltipPos.placement === 'right' && (
            <span
              aria-hidden="true"
              className="absolute -left-[7px] w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-b border-l border-slate-200 dark:border-slate-700/90"
              style={{ top: tooltipPos.arrowOffset - 7 }}
            />
          )}
          {targetRect && tooltipPos.placement === 'left' && (
            <span
              aria-hidden="true"
              className="absolute -right-[7px] w-3.5 h-3.5 rotate-45 bg-white dark:bg-slate-900 border-t border-r border-slate-200 dark:border-slate-700/90"
              style={{ top: tooltipPos.arrowOffset - 7 }}
            />
          )}

          {/* Conteúdo interno com cantos arredondados */}
          <div className="rounded-2xl overflow-hidden">
            {/* Barra de progresso do tutorial */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-sky-500 dark:bg-sky-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Cabeçalho */}
            <div className="px-4 pt-3.5 pb-2.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/12 dark:bg-sky-400/15 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <StepIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] leading-none mb-1">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {currentStep.badge}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="font-mono font-medium tabular-nums text-slate-400 dark:text-slate-500">
                      {safeStepIndex + 1}/{activeSteps.length}
                    </span>
                  </div>
                  <h3 className="font-display text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => closeTour(false)}
                aria-label="Fechar tutorial"
                title="Pular tutorial (Esc)"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explicação + Dica prática */}
            <div className="px-4 pb-3.5 space-y-2.5">
              <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentStep.description}
              </p>

              {currentStep.tip && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800/90">
                  <strong className="font-semibold text-slate-700 dark:text-slate-200">Dica: </strong>
                  {currentStep.tip}
                </p>
              )}
            </div>

            {/* Rodapé com indicadores e navegação */}
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                {activeSteps.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    title={st.title}
                    aria-label={`Ir para passo ${idx + 1}: ${st.title}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === safeStepIndex
                        ? 'w-5 bg-sky-600 dark:bg-sky-400'
                        : idx < safeStepIndex
                          ? 'w-1.5 bg-sky-400/60 dark:bg-sky-500/50'
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={isFirst}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    isLast
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950'
                  }`}
                >
                  {isLast ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concluir</span>
                    </>
                  ) : (
                    <>
                      <span>Próximo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
