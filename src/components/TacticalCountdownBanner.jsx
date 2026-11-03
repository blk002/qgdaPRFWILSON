import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Settings, ChevronDown, ChevronUp, 
  Target, Flame, ShieldAlert, Check, X, Sparkles, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'qg_tactical_countdown_config';

function getDefaultTargetDate() {
  // Padrão: 180 dias a partir de hoje às 08:00
  const d = new Date();
  d.setDate(d.getDate() + 180);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

export default function TacticalCountdownBanner() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          title: parsed.title || 'OPERAÇÃO PRF • CONTAGEM REGRESSIVA',
          targetDate: parsed.targetDate || getDefaultTargetDate(),
          isCollapsed: Boolean(parsed.isCollapsed)
        };
      }
    } catch (_) {}
    return {
      title: 'OPERAÇÃO PRF • CONTAGEM REGRESSIVA',
      targetDate: getDefaultTargetDate(),
      isCollapsed: false
    };
  });

  const [now, setNow] = useState(() => Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(config.title);
  const [draftDate, setDraftDate] = useState(() => {
    try {
      const d = new Date(config.targetDate);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch (_) {
      return '';
    }
  });

  // Tique do relógio a cada 1 segundo
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saveConfig = (newCfg) => {
    setConfig(newCfg);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCfg));
    } catch (_) {}
  };

  const toggleCollapsed = () => {
    saveConfig({ ...config, isCollapsed: !config.isCollapsed });
  };

  const handleOpenModal = () => {
    setDraftTitle(config.title);
    try {
      const d = new Date(config.targetDate);
      setDraftDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } catch (_) {
      setDraftDate('');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e) => {
    e?.preventDefault();
    if (!draftDate) return;
    const targetISO = new Date(draftDate).toISOString();
    saveConfig({
      ...config,
      title: draftTitle.trim() || 'OPERAÇÃO PRF • CONTAGEM REGRESSIVA',
      targetDate: targetISO
    });
    setIsModalOpen(false);
  };

  const setPreset = (days, label) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(8, 0, 0, 0);
    setDraftTitle(label);
    setDraftDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  // Cálculo da contagem regressiva
  const timeRemaining = useMemo(() => {
    const targetTime = new Date(config.targetDate).getTime();
    const diff = targetTime - now;

    if (isNaN(diff) || diff <= 0) {
      return { diff: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
    }

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return { diff, days, hours, minutes, seconds, isPassed: false };
  }, [config.targetDate, now]);

  const formattedTargetDate = useMemo(() => {
    try {
      const d = new Date(config.targetDate);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '';
    }
  }, [config.targetDate]);

  return (
    <>
      <div className="mb-4 w-full">
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 dark:border-blue-500/30 bg-slate-900/90 dark:bg-[#121417]/95 shadow-lg shadow-blue-500/5 backdrop-blur-xl transition-all duration-300">
          {/* Luz ambiente sutil de fundo */}
          <div className="absolute top-0 right-1/4 w-72 h-16 bg-blue-500/10 blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-1/4 w-72 h-16 bg-emerald-500/10 blur-3xl pointer-events-none -z-0" />

          {/* Barra Superior / Header */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black tracking-wider uppercase text-blue-400 flex items-center gap-1.5 truncate">
                <Target className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                <span className="truncate">{config.title}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Configurar Data da Prova / Meta"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title={config.isCollapsed ? 'Expandir Painel' : 'Minimizar'}
              >
                {config.isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Corpo do Timer */}
          <AnimatePresence initial={false}>
            {!config.isCollapsed ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Bloco de Dígitos Táticos */}
                  {timeRemaining.isPassed ? (
                    <div className="flex items-center gap-3 py-2 text-emerald-400">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <div>
                        <div className="text-lg font-black uppercase">O DIA DA MISSÃO CHEGOU!</div>
                        <div className="text-xs text-slate-400">Hora de buscar a sua farda. Vá e vença!</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full md:w-auto">
                      {/* DIAS */}
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 sm:p-3 text-center min-w-[70px] sm:min-w-[85px] shadow-inner">
                        <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight font-mono">
                          {String(timeRemaining.days).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                          Dias
                        </div>
                      </div>

                      {/* HORAS */}
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 sm:p-3 text-center min-w-[70px] sm:min-w-[85px] shadow-inner">
                        <div className="text-2xl sm:text-3xl font-black text-blue-400 tabular-nums tracking-tight font-mono">
                          {String(timeRemaining.hours).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                          Horas
                        </div>
                      </div>

                      {/* MINUTOS */}
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 sm:p-3 text-center min-w-[70px] sm:min-w-[85px] shadow-inner">
                        <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight font-mono">
                          {String(timeRemaining.minutes).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                          Minutos
                        </div>
                      </div>

                      {/* SEGUNDOS */}
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-2.5 sm:p-3 text-center min-w-[70px] sm:min-w-[85px] shadow-inner">
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums tracking-tight font-mono">
                          {String(timeRemaining.seconds).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                          Segundos
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações da Meta e Botão de Ação */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 text-center md:text-right border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                    <div>
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-center md:justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>Alvo: {formattedTargetDate}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {timeRemaining.days > 0 
                          ? `${timeRemaining.days} dias de preparação restante` 
                          : 'Reta final da preparação!'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenModal}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Alterar Meta</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Versão Compacta / Minimizada
              <div className="px-4 py-2 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {timeRemaining.isPassed ? (
                      <span className="text-emerald-400 font-bold">MISSÃO CHEGOU!</span>
                    ) : (
                      <>
                        <strong className="text-white font-bold">{timeRemaining.days}d</strong>{' '}
                        <strong className="text-blue-400 font-bold">{timeRemaining.hours}h</strong>{' '}
                        <span className="text-slate-400">{timeRemaining.minutes}m</span>{' '}
                        <span className="text-amber-400 font-bold">{timeRemaining.seconds}s</span>{' '}
                        <span className="text-slate-500">restantes</span>
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="text-[11px] font-sans font-bold text-blue-400 hover:underline"
                >
                  Expandir ⌄
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Configuração da Data da Prova / Meta */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 font-black uppercase text-sm">
                  <Target className="w-4 h-4" />
                  <span>Definir Contagem Regressiva</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Nome da Missão / Concurso
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Ex: OPERAÇÃO PRF • PROVA OBJETIVA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Data e Horário Alvo
                  </label>
                  <input
                    type="datetime-local"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Atalhos Rápidos de Planejamento */}
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                    Atalhos Rápidos de Meta:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreset(90, 'FECHAR EDITAL • 90 DIAS')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-300 text-center transition-colors"
                    >
                      🎯 90 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreset(180, 'OPERAÇÃO PRF • 6 MESES')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-300 text-center transition-colors"
                    >
                      ⚡ 6 Meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreset(365, 'PROVA PRF • ESTIMATIVA 1 ANO')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-300 text-center transition-colors"
                    >
                      🏆 1 Ano
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
                  >
                    Salvar Meta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
