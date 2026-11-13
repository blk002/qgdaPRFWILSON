import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Settings, ChevronDown, ChevronUp, 
  Target, Sparkles, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'qg_tactical_countdown_config';

function getDefaultTargetDate() {
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
          isCollapsed: parsed.isCollapsed !== undefined ? Boolean(parsed.isCollapsed) : false
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

  const handleOpenModal = (e) => {
    e?.stopPropagation();
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
    let targetISO = '';
    try {
      const parsed = new Date(draftDate);
      if (isNaN(parsed.getTime())) return;
      targetISO = parsed.toISOString();
    } catch (_) {
      return;
    }
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
      {/* WIDGET FIXO NO CANTO INFERIOR DIREITO */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-auto select-none">
        <AnimatePresence mode="wait">
          {!config.isCollapsed ? (
            /* PAINEL EXPANDIDO FLUTUANTE */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-[320px] sm:w-[350px] overflow-hidden rounded-2xl border border-blue-500/30 bg-slate-900/95 dark:bg-[#121417]/95 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            >
              {/* Barra de Título */}
              <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-black tracking-wider uppercase text-blue-400 flex items-center gap-1.5 truncate">
                    <Target className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{config.title}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Configurar Meta / Data"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Minimizar para o canto"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Corpo com Dígitos do Timer */}
              <div className="p-3.5">
                {timeRemaining.isPassed ? (
                  <div className="flex items-center gap-2 text-emerald-400 py-1 text-center justify-center">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-black uppercase">O DIA DA MISSÃO CHEGOU!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {/* DIAS */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 shadow-inner">
                      <div className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight font-mono leading-none">
                        {String(timeRemaining.days).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                        Dias
                      </div>
                    </div>

                    {/* HORAS */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 shadow-inner">
                      <div className="text-xl sm:text-2xl font-black text-blue-400 tabular-nums tracking-tight font-mono leading-none">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                        Horas
                      </div>
                    </div>

                    {/* MINUTOS */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 shadow-inner">
                      <div className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight font-mono leading-none">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                        Min
                      </div>
                    </div>

                    {/* SEGUNDOS */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 shadow-inner">
                      <div className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums tracking-tight font-mono leading-none">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                        Seg
                      </div>
                    </div>
                  </div>
                )}

                {/* Rodapé do Widget */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 truncate">
                    <Calendar className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{formattedTargetDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="text-blue-400 font-bold hover:underline shrink-0"
                  >
                    Editar Meta
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* PÍLULA MINIMIZADA FLUTUANTE */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={toggleCollapsed}
              className="flex items-center gap-2 bg-slate-900/95 dark:bg-[#121417]/95 border border-blue-500/35 hover:border-blue-400 text-white px-3 py-2 rounded-2xl shadow-2xl backdrop-blur-xl cursor-pointer transition-all group"
              title="Clique para expandir o contador tático"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>

              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-blue-400 font-sans font-black text-[10px] uppercase">PRF:</span>
                <span className="font-black text-white">{timeRemaining.days}d</span>
                <span className="font-black text-blue-400">{timeRemaining.hours}h</span>
                <span className="font-bold text-slate-300">{timeRemaining.minutes}m</span>
                <span className="font-black text-amber-400">{timeRemaining.seconds}s</span>
              </div>

              <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0 ml-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Configuração da Data da Prova / Meta */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
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
