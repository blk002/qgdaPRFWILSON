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
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      key: 'calendarSchedule',
      title: 'Matérias do Calendário & Ciclo',
      desc: 'Remove todas as matérias colocadas no ciclo semanal, regras futuras e edições do calendário, MANTENDO suas disciplinas cadastradas.',
      badge: calendarBadge,
      icon: CalendarX,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      key: 'raioXCaveira',
      title: 'Informações do Raio-X Caveira',
      desc: 'Apaga todas as questões sincronizadas da extensão, métricas e radar de lei seca.',
      badge: `${caveiraCount} questão${caveiraCount !== 1 ? 'ões' : ''}`,
      icon: Skull,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      key: 'fsrs',
      title: 'Revisões FSRS (Repetição Espaçada)',
      desc: 'Zera todos os cards de revisão agendados, estabilidade e histórico de repetições.',
      badge: `${reviewsCount} card${reviewsCount !== 1 ? 's' : ''}`,
      icon: Brain,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      key: 'dueloCTB',
      title: 'Dados do Duelo CTB (Alvo Legal 3D)',
      desc: 'Zera o recorde (High Score), assertivas já vistas e estatísticas de erros/acertos do CTB.',
      badge: dueloScore > 0 ? `Recorde: ${dueloScore} pts` : 'Sem partidas',
      icon: Target,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      key: 'career',
      title: 'Dados da Carreira (Começar do Zero)',
      desc: 'Zera XP acumulado, patentes militares, histórico semanal, streaks e missões.',
      badge: `${xpCount.toLocaleString()} XP acumulado`,
      icon: Trophy,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      key: 'mascot',
      title: 'Resetar Mascote (Recruta K9)',
      desc: 'Restaura o K9 ao nível 1 com atributos iniciais, limpando inventário de comidas e roupinhas.',
      badge: `Nível ${petLevel}`,
      icon: Dog,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
      key: 'coinsRewards',
      title: 'Moedas & Recompensas da Loja',
      desc: 'Restaura saldo para 250 moedas, remove temas extras e avatares desbloqueados.',
      badge: `${coins} moedas`,
      icon: Coins,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      key: 'subjects',
      title: 'APAGAR TODAS as Disciplinas Cadastradas',
      desc: 'CUIDADO: Exclui permanentemente todas as matérias, assuntos e aulas da aba "Minhas Disciplinas" (além de ciclo e calendário). Para zerar apenas aulas ou calendário sem perder matérias, use as 2 primeiras opções.',
      badge: `DESTRUTIVO • ${subjectsCount} matéria${subjectsCount !== 1 ? 's' : ''}`,
      icon: BookOpen,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10 border-red-500/30'
    }
  ];

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[150] p-3 sm:p-6 overflow-y-auto fade-in">
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl max-w-2xl w-full border border-red-900/60 relative overflow-hidden flex flex-col h-[90vh] max-h-[90vh] my-auto">
        
        {/* Barra de Perigo no Topo */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 z-10 animate-pulse"></div>

        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-[#0f172a] via-[#1e1424] to-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center shadow-lg shadow-red-900/30">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                Central de Reset de Dados
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Gerenciamento seletivo e purga do sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Rolagem */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {!confirmStep ? (
            <>
              {/* Opção Master: APAGAR TUDO */}
              <div
                onClick={() => toggleAll(!selected.all)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  selected.all
                    ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-red-900/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleAll(!selected.all); }}
                    className="mt-0.5 shrink-0"
                  >
                    {selected.all ? (
                      <CheckSquare className="w-5 h-5 text-red-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Opção: Apagar Tudo (Reset Total do Sistema)
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-700/60">
                        Destrutivo Absoluto
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Zera o sistema inteiro para o estado limpo de fábrica: apaga disciplinas, questões do Caveira, revisões FSRS, dados do Duelo CTB, carreira, mascote K9 e moedas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de Seleção Rápida */}
              <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-800">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Selecione uma ou mais opções:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAll(true)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white uppercase transition-colors"
                  >
                    Marcar Todas
                  </button>
                  <span className="text-slate-600 text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white uppercase transition-colors"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>

              {/* Lista das 7 Opções Granulares */}
              <div className="space-y-2.5">
                {resetOptions.map((opt) => {
                  const isChecked = selected[opt.key];
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => toggleItem(opt.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-slate-900 border-red-500/70 shadow-sm shadow-red-950'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleItem(opt.key); }}
                        className="mt-0.5 shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-red-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${opt.iconBg}`}>
                        <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-black text-slate-200">
                            {opt.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
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
            <div className="space-y-5 py-2">
              <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-600/50 flex items-center justify-center mx-auto text-red-400 animate-pulse">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-white uppercase tracking-tight">
                  Confirmação de Segurança
                </h4>
                <p className="text-xs text-red-200/90 leading-relaxed max-w-md mx-auto">
                  Você está prestes a apagar permanentemente os dados selecionados. Esta ação <strong>NÃO PODERÁ SER DESFEITA</strong> e será sincronizada com a nuvem.
                </p>
              </div>

              {/* Resumo do que será apagado */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Itens selecionados para exclusão:
                </span>
                <ul className="space-y-1.5">
                  {selected.all ? (
                    <li className="text-xs font-black text-red-400 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      SISTEMA COMPLETO (TODOS OS DADOS E HISTÓRICOS)
                    </li>
                  ) : (
                    resetOptions.filter(o => selected[o.key]).map(o => (
                      <li key={o.key} className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{o.title}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({o.badge})</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {selected.all && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Digite a palavra <span className="font-mono text-red-400 font-black">RESET</span> abaixo para autorizar:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DIGITE RESET"
                    className="w-full bg-[#020617] border border-red-800 focus:border-red-500 rounded-xl px-4 py-3 font-mono font-black text-sm text-center text-red-400 outline-none uppercase tracking-widest"
                  />
                </div>
              )}

              {!selected.all && selected.subjects && (
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/50 border border-red-700/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmSubjectsDelete}
                    onChange={(e) => setConfirmSubjectsDelete(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-red-500 shrink-0"
                  />
                  <span className="text-xs text-red-200 leading-snug">
                    <strong>Confirmo que quero apagar todas as {subjectsCount} matérias cadastradas</strong> em &quot;Minhas Disciplinas&quot;. (Se queria zerar apenas aulas assistidas ou calendário, clique em <em>Voltar à Seleção</em> e desmarque a última opção.)
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Rodapé Fixo com Ações */}
        <div className="p-6 pt-3 border-t border-slate-800 bg-[#0f172a] shrink-0 flex flex-col gap-2.5">
          {!confirmStep ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors border border-slate-800 rounded-xl hover:bg-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartConfirmation}
                disabled={selectedCount === 0}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Continuar ({selectedCount} selecionado{selectedCount !== 1 ? 's' : ''})
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmStep(false)}
                disabled={isExecuting}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors border border-slate-800 rounded-xl hover:bg-slate-900"
              >
                Voltar à Seleção
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={
                  isExecuting ||
                  (selected.all && confirmText.trim().toUpperCase() !== 'RESET') ||
                  (!selected.all && selected.subjects && !confirmSubjectsDelete)
                }
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Purificando Dados...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar e Apagar
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
