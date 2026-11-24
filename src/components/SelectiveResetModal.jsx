import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, AlertTriangle, Trash2, CheckSquare, Square,
  RotateCcw, BookOpen, Skull, Brain, Target, Trophy,
  Dog, Coins, ShieldAlert, Check, Loader2, CheckCircle2, CalendarX
} from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';

const RESET_ITEM_KEYS = [
  'watchedLessons',
  'calendarSchedule',
  'raioXCaveira',
  'fsrs',
  'dueloCTB',
  'career',
  'mascot',
  'coinsRewards',
  'subjects'
];

const buildSelectionMap = (checked) =>
  RESET_ITEM_KEYS.reduce((acc, key) => ({ ...acc, [key]: checked }), { all: checked });

export default function SelectiveResetModal({ isOpen, onClose }) {
  const {
    subjects = {},
    cycle = [],
    calendarOverrides = {},
    futureScheduleRules = [],
    caveiraQuestions = [],
    reviews = [],
    userStats = {},
    petData = {},
    coins = 0,
    executeSelectiveReset
  } = useStore();

  const [selected, setSelected] = useState(() => buildSelectionMap(false));

  const [confirmStep, setConfirmStep] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmSubjectsDelete, setConfirmSubjectsDelete] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  // Contadores dinâmicos para visualização do usuário
  const subjectsCount = Object.keys(subjects).length;
  const watchedCount = Object.values(subjects).reduce(
    (sum, sub) => sum + (sub?.topics || []).reduce((tSum, t) => tSum + (Number(t?.completed) || 0), 0),
    0
  );
  const cycleSlotsCount = (Array.isArray(cycle) ? cycle : []).reduce(
    (sum, day) => sum + (Array.isArray(day) ? day.length : 0),
    0
  );
  const calendarAdjustmentsCount =
    Object.keys(calendarOverrides || {}).length + (Array.isArray(futureScheduleRules) ? futureScheduleRules.length : 0);
  const caveiraCount = caveiraQuestions.length;
  const reviewsCount = reviews.length;
  const xpCount = userStats.xp || 0;
  const petLevel = petData.level || 1;
  let dueloScore = 0;
  try {
    dueloScore = Number(localStorage.getItem('alvo_legal_high_score_v1') || 0);
  } catch (_) {}

  const toggleAll = (checked) => {
    setSelected(buildSelectionMap(checked));
  };

  const toggleItem = (key) => {
    setSelected(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Se desmarcou qualquer item, "all" não pode ser true
      if (prev[key]) {
        next.all = false;
      } else if (RESET_ITEM_KEYS.every(k => next[k])) {
        next.all = true;
      }
      return next;
    });
  };

  const selectedCount = selected.all
    ? RESET_ITEM_KEYS.length
    : RESET_ITEM_KEYS.filter(k => selected[k]).length;

  const handleStartConfirmation = () => {
    if (selectedCount === 0) {
      toast.error('Selecione pelo menos uma opção para resetar.');
      return;
    }
    setConfirmStep(true);
    setConfirmText('');
    setConfirmSubjectsDelete(false);
  };

  const handleExecute = async () => {
    if (selected.all && confirmText.trim().toUpperCase() !== 'RESET') {
      toast.error('Digite a palavra RESET para confirmar a exclusão total.');
      return;
    }
    if (!selected.all && selected.subjects && !confirmSubjectsDelete) {
      toast.error('Confirme a caixa de exclusão das disciplinas cadastradas ou volte e desmarque essa opção.');
      return;
    }

    setIsExecuting(true);
    try {
      const cleaned = await executeSelectiveReset(selected);
      if (selected.all) {
        toast.error('⚠️ Reset absoluto concluído! Recarregando sistema...');
      } else {
        toast.success(`Reset concluído com sucesso: ${cleaned.join(', ')}.`);
        setConfirmStep(false);
        onClose();
      }
    } catch (err) {
      console.error('Erro ao executar reset:', err);
      toast.error('Ocorreu um erro ao processar o reset na nuvem.');
    } finally {
      setIsExecuting(false);
    }
  };

  const calendarBadge = calendarAdjustmentsCount > 0
    ? `${cycleSlotsCount} no ciclo • ${calendarAdjustmentsCount} ajuste${calendarAdjustmentsCount !== 1 ? 's' : ''}`
    : `${cycleSlotsCount} bloco${cycleSlotsCount !== 1 ? 's' : ''} no ciclo`;

  const resetOptions = [
    {
      key: 'watchedLessons',
      title: 'Aulas Assistidas (Zerar Progresso)',
      desc: 'Desmarca todas as aulas concluídas e blocos finalizados hoje, MANTENDO suas matérias, assuntos e aulas cadastradas.',
      badge: `${watchedCount} aula${watchedCount !== 1 ? 's' : ''} assistida${watchedCount !== 1 ? 's' : ''}`,
      icon: CheckCircle2,
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      key: 'calendarSchedule',
      title: 'Matérias do Calendário & Ciclo',
      desc: 'Remove todas as matérias colocadas no ciclo semanal, regras futuras e edições do calendário, MANTENDO suas disciplinas cadastradas.',
      badge: calendarBadge,
      icon: CalendarX,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      key: 'raioXCaveira',
      title: 'Informações do Raio-X Caveira',
      desc: 'Apaga todas as questões sincronizadas da extensão, métricas e radar de lei seca.',
      badge: `${caveiraCount} questão${caveiraCount !== 1 ? 'ões' : ''}`,
      icon: Skull,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      key: 'fsrs',
      title: 'Revisões FSRS (Repetição Espaçada)',
      desc: 'Zera todos os cards de revisão agendados, estabilidade e histórico de repetições.',
      badge: `${reviewsCount} card${reviewsCount !== 1 ? 's' : ''}`,
      icon: Brain,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      key: 'dueloCTB',
      title: 'Dados do Duelo CTB (Alvo Legal 3D)',
      desc: 'Zera o recorde (High Score), assertivas já vistas e estatísticas de erros/acertos do CTB.',
      badge: dueloScore > 0 ? `Recorde: ${dueloScore} pts` : 'Sem partidas',
      icon: Target,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      key: 'career',
      title: 'Dados da Carreira (Começar do Zero)',
      desc: 'Zera XP acumulado, patentes militares, histórico semanal, streaks e missões.',
      badge: `${xpCount.toLocaleString()} XP acumulado`,
      icon: Trophy,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      key: 'mascot',
      title: 'Resetar Mascote (Recruta K9)',
      desc: 'Restaura o K9 ao nível 1 com atributos iniciais, limpando inventário de comidas e roupinhas.',
      badge: `Nível ${petLevel}`,
      icon: Dog,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
      key: 'coinsRewards',
      title: 'Moedas & Recompensas da Loja',
      desc: 'Restaura saldo para 250 moedas, remove temas extras e avatares desbloqueados.',
      badge: `${coins} moedas`,
      icon: Coins,
      iconColor: 'text-amber-600 dark:text-yellow-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      key: 'subjects',
      title: 'Apagar todas as disciplinas cadastradas',
      desc: 'CUIDADO: Exclui permanentemente todas as matérias, assuntos e aulas da aba "Minhas Disciplinas" (além de ciclo e calendário). Para zerar apenas aulas ou calendário sem perder matérias, use as 2 primeiras opções.',
      badge: `Destrutivo · ${subjectsCount} matéria${subjectsCount !== 1 ? 's' : ''}`,
      icon: BookOpen,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-500/10 border-red-500/25'
    }
  ];

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[150] p-3 sm:p-5 overflow-y-auto fade-in font-sans"
      onClick={() => { if (!isExecuting) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="selective-reset-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] max-w-2xl w-full border border-slate-200/90 dark:border-slate-800 relative overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 dark:bg-red-400/10 ring-1 ring-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="selective-reset-title" className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Central de reset de dados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Escolha exatamente quais módulos deseja zerar ou limpar no sistema.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            aria-label="Fechar janela"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com Rolagem */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {!confirmStep ? (
            <>
              {/* Opção Master: APAGAR TUDO */}
              <div
                onClick={() => toggleAll(!selected.all)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selected.all
                    ? 'bg-red-50/90 dark:bg-red-950/35 border-red-400 dark:border-red-500/80 ring-1 ring-red-500/25'
                    : 'bg-slate-50/80 dark:bg-slate-950/55 border-slate-200/80 dark:border-slate-800/90 hover:border-red-300 dark:hover:border-red-900/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleAll(!selected.all); }}
                    className="mt-0.5 shrink-0 cursor-pointer"
                  >
                    {selected.all ? (
                      <CheckSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
                        Apagar tudo (reset total do sistema)
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/70">
                        Destrutivo
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Zera o sistema inteiro para o estado limpo de fábrica: apaga disciplinas, questões do Caveira, revisões FSRS, dados do Duelo CTB, carreira, mascote K9 e moedas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Seleção Rápida */}
              <div className="flex items-center justify-between pt-1 pb-1.5 border-b border-slate-100 dark:border-slate-800/90">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Selecione uma ou mais opções
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAll(true)}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline transition-colors cursor-pointer"
                  >
                    Marcar todas
                  </button>
                  <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Lista das Opções Granulares */}
              <div className="space-y-2">
                {resetOptions.map((opt) => {
                  const isChecked = selected[opt.key];
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => toggleItem(opt.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-500/60'
                          : 'bg-white dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleItem(opt.key); }}
                        className="mt-0.5 shrink-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                        )}
                      </button>

                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${opt.iconBg}`}>
                        <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {opt.title}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Tela de Confirmação de Segurança */
            <div className="space-y-4 py-1">
              <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200/90 dark:border-red-900/60 rounded-xl p-5 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 dark:bg-red-400/10 ring-1 ring-red-500/20 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Confirmação de segurança
                </h4>
                <p className="text-xs text-red-800 dark:text-red-200/90 leading-relaxed max-w-md mx-auto">
                  Você está prestes a apagar permanentemente os dados selecionados. Esta ação <strong>não poderá ser desfeita</strong> e será sincronizada com a nuvem.
                </p>
              </div>

              {/* Resumo do que será apagado */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Itens selecionados para exclusão
                </span>
                <ul className="space-y-2">
                  {selected.all ? (
                    <li className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      Sistema completo (todos os dados e históricos)
                    </li>
                  ) : (
                    resetOptions.filter(o => selected[o.key]).map(o => (
                      <li key={o.key} className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                        <span>{o.title}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">({o.badge})</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {selected.all && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                    Digite a palavra <span className="font-mono text-red-600 dark:text-red-400 font-bold">RESET</span> abaixo para autorizar:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Digite RESET"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-red-300 dark:border-red-800 focus:border-red-500 rounded-xl px-4 py-2.5 font-mono font-bold text-sm text-center text-red-600 dark:text-red-400 outline-none uppercase tracking-widest"
                  />
                </div>
              )}

              {!selected.all && selected.subjects && (
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/35 border border-red-200 dark:border-red-800/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmSubjectsDelete}
                    onChange={(e) => setConfirmSubjectsDelete(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-red-600 shrink-0"
                  />
                  <span className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                    <strong>Confirmo que quero apagar todas as {subjectsCount} matérias cadastradas</strong> em &quot;Minhas Disciplinas&quot;. (Se queria zerar apenas aulas assistidas ou calendário, clique em <em>Voltar à seleção</em> e desmarque a última opção.)
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Rodapé Fixo com Ações */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          {!confirmStep ? (
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartConfirmation}
                disabled={selectedCount === 0}
                className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Continuar ({selectedCount} selecionado{selectedCount !== 1 ? 's' : ''})
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmStep(false)}
                disabled={isExecuting}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
              >
                Voltar à seleção
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={
                  isExecuting ||
                  (selected.all && confirmText.trim().toUpperCase() !== 'RESET') ||
                  (!selected.all && selected.subjects && !confirmSubjectsDelete)
                }
                className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Limpando dados...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar e apagar
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
