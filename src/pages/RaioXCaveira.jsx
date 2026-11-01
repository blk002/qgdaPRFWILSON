import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Target, AlertTriangle, ShieldCheck, TrendingUp, Clock, 
  HelpCircle, RefreshCw, Download, Upload, Trash2, CheckCircle2, 
  XCircle, Zap, BookOpen, ChevronDown, ChevronUp, Copy, Check,
  ExternalLink, Sparkles, Filter, Award, BrainCircuit, Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function RaioXCaveira() {
  const {
    caveiraQuestions = [],
    addCaveiraQuestion,
    importCaveiraQuestions,
    deleteCaveiraQuestion,
    clearCaveiraQuestions,
    createFsrsCardFromCaveira,
    isDarkMode
  } = useStore();

  const [extensionDetected, setExtensionDetected] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'errors' | 'guesses' | 'hits'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copiedExtensionPath, setCopiedExtensionPath] = useState(false);

  // Escuta detecção e sincronização da extensão via bridge (apenas 1 vez no mount)
  useEffect(() => {
    // Checa atributo inserido pelo bridge
    if (document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true') {
      setExtensionDetected(true);
    }

    const handleMessage = (event) => {
      if (event.data && event.data.source === 'QG_CAVEIRA_EXTENSION') {
        if (event.data.type === 'EXTENSION_DETECTED') {
          setExtensionDetected(true);
        }
        if (event.data.type === 'SYNC_UPDATE' && event.data.payload) {
          setExtensionDetected(true);
          const { newQuestion, questions } = event.data.payload;
          if (newQuestion) {
            useStore.getState().addCaveiraQuestion(newQuestion);
          } else if (questions) {
            useStore.getState().importCaveiraQuestions(questions, false);
          }
        }
        if (event.data.type === 'CAVEIRA_DATA_RESPONSE' && event.data.payload) {
          setExtensionDetected(true);
          if (event.data.payload.questions && event.data.payload.questions.length > 0) {
            useStore.getState().importCaveiraQuestions(event.data.payload.questions, false);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Solicita dados para a extensão se estiver ativa
    window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Estatísticas Globais
  const stats = useMemo(() => {
    const total = caveiraQuestions.length;
    if (total === 0) {
      return {
        total: 0, hits: 0, errors: 0, netScore: 0, grossRate: 0, netRate: 0,
        avgTimeSec: 0, guessesTotal: 0, guessesNet: 0, errorReasons: {}
      };
    }

    const hits = caveiraQuestions.filter(q => q.hit).length;
    const errors = total - hits;
    const netScore = hits - errors; // Modelo Cebraspe: 1 errada anula 1 certa
    const grossRate = Math.round((hits / total) * 100);
    const netRate = Math.max(0, Math.round((netScore / total) * 100));

    const totalSeconds = caveiraQuestions.reduce((acc, q) => acc + (q.durationSeconds || 0), 0);
    const avgTimeSec = Math.round(totalSeconds / total);

    // Chutes
    const guesses = caveiraQuestions.filter(q => q.confidence === 'chute');
    const guessHits = guesses.filter(q => q.hit).length;
    const guessErrors = guesses.length - guessHits;
    const guessesNet = guessHits - guessErrors;

    // Motivos de Erro
    const errorReasons = {
      conteudo: caveiraQuestions.filter(q => !q.hit && q.errorReason === 'conteudo').length,
      atencao: caveiraQuestions.filter(q => !q.hit && q.errorReason === 'atencao').length,
      interpretacao: caveiraQuestions.filter(q => !q.hit && q.errorReason === 'interpretacao').length,
      nao_especificado: caveiraQuestions.filter(q => !q.hit && !q.errorReason).length
    };

    return {
      total, hits, errors, netScore, grossRate, netRate,
      avgTimeSec, guessesTotal: guesses.length, guessesNet, errorReasons
    };
  }, [caveiraQuestions]);

  // Agrupamento por Disciplina e Assunto
  const subjectGroups = useMemo(() => {
    const groups = {};

    caveiraQuestions.forEach(q => {
      const subName = q.subject || 'Outras';
      if (!groups[subName]) {
        groups[subName] = {
          name: subName,
          total: 0,
          hits: 0,
          errors: 0,
          topics: {}
        };
      }

      groups[subName].total += 1;
      if (q.hit) groups[subName].hits += 1;
      else groups[subName].errors += 1;

      // Agrupamento por tópico
      const topicName = q.topic || 'Geral';
      if (!groups[subName].topics[topicName]) {
        groups[subName].topics[topicName] = {
          name: topicName,
          total: 0,
          hits: 0,
          errors: 0,
          questions: []
        };
      }
      groups[subName].topics[topicName].total += 1;
      if (q.hit) groups[subName].topics[topicName].hits += 1;
      else groups[subName].topics[topicName].errors += 1;
      groups[subName].topics[topicName].questions.push(q);
    });

    // Calcular notas e status
    return Object.values(groups).map(g => {
      const net = g.hits - g.errors;
      const netPercent = g.total > 0 ? Math.round((net / g.total) * 100) : 0;
      const grossPercent = g.total > 0 ? Math.round((g.hits / g.total) * 100) : 0;

      // Status Tático:
      // Blindagem: > 70% líquida com >= 5 questões
      // Vulnerabilidade: < 50% líquida
      // Em disputa: meio termo
      let status = 'disputa';
      if (g.total >= 5 && netPercent >= 70) status = 'blindagem';
      else if (netPercent < 50) status = 'vulnerabilidade';

      const topicsList = Object.values(g.topics).map(t => {
        const tNet = t.hits - t.errors;
        const tNetPct = t.total > 0 ? Math.round((tNet / t.total) * 100) : 0;
        return { ...t, net: tNet, netPercent: tNetPct };
      }).sort((a, b) => a.netPercent - b.netPercent); // Piores tópicos primeiro!

      return {
        ...g,
        net,
        netPercent,
        grossPercent,
        status,
        topicsList
      };
    }).sort((a, b) => a.netPercent - b.netPercent); // Matérias com maior sangria primeiro!
  }, [caveiraQuestions]);

  // Lista de Questões Filtrada
  const filteredQuestions = useMemo(() => {
    return caveiraQuestions.filter(q => {
      if (filterType === 'errors' && q.hit) return false;
      if (filterType === 'hits' && !q.hit) return false;
      if (filterType === 'guesses' && q.confidence !== 'chute') return false;
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
      return true;
    });
  }, [caveiraQuestions, filterType, selectedSubject]);

  // Sincronizar via Bridge
  const handleRequestSync = () => {
    window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA' }, '*');
    toast.info('Solicitando questões atualizadas para a extensão...');
  };

  // Importar JSON manual
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const count = importCaveiraQuestions(list, false);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (e) {
      toast.error('JSON inválido! Verifique a formatação.');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      importCaveiraQuestions(list, false);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (e) {
      toast.error('Não foi possível ler JSON válido da área de transferência.');
    }
  };

  return (
    <div className="fade-in w-full pb-14 font-sans space-y-6">

      {/* HEADER DA SEÇÃO */}
      <div className="glass-card rounded-[2.2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-red-950 border-2 border-red-500/40 flex items-center justify-center text-3xl shadow-lg shadow-red-500/20 shrink-0">
              💀
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  Raio-X Projeto Caveira
                </h1>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                  extensionDetected
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${extensionDetected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {extensionDetected ? 'Extensão Conectada' : 'Extensão Pendente'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                Auditoria questão por questão com pontuação líquida Cebraspe e diagnóstico de sangria de pontos.
              </p>
            </div>
          </div>

          {/* BOTÕES DE CONTROLE */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {extensionDetected ? (
              <button
                onClick={handleRequestSync}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Sincronizar
              </button>
            ) : (
              <button
                onClick={() => setShowInstallModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase px-4 py-2.5 rounded-xl shadow-lg shadow-red-500/25 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Ativar Extensão
              </button>
            )}

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Importar questões via JSON"
            >
              <Upload className="w-4 h-4" /> Importar
            </button>

            {caveiraQuestions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Deseja limpar todo o histórico de questões do Caveira?')) {
                    clearCaveiraQuestions();
                  }
                }}
                className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all cursor-pointer"
                title="Limpar histórico do Caveira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI CARDS (MODELO CEBRASPE REAL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total e Tempo Médio */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Questões Auditadas</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-800 dark:text-white">
              {stats.total}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Média: {Math.floor(stats.avgTimeSec / 60)}m {stats.avgTimeSec % 60}s / questão
          </span>
        </div>

        {/* Nota Líquida Cebraspe */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Líquida Cebraspe</span>
            <Skull className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${stats.netScore >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {stats.netScore > 0 ? `+${stats.netScore}` : stats.netScore}
            </span>
            <span className="text-xs font-bold text-slate-400">pts</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            {stats.hits} certas - {stats.errors} erradas
          </span>
        </div>

        {/* Bruto vs Líquido */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Aproveitamento</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">{stats.netRate}%</span>
            <span className="text-xs font-bold text-slate-400">líquido</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            Bruto: {stats.grossRate}% (Perda de {Math.max(0, stats.grossRate - stats.netRate)}%)
          </span>
        </div>

        {/* Eficiência do Chute */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Saldo dos Chutes</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${stats.guessesNet >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
              {stats.guessesNet > 0 ? `+${stats.guessesNet}` : stats.guessesNet}
            </span>
            <span className="text-xs font-bold text-slate-400">pts</span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            {stats.guessesTotal} chutes • {stats.guessesNet < 0 ? '⚠️ Deixar em branco renderia mais!' : '✓ Chutes com saldo positivo'}
          </span>
        </div>
      </div>

      {/* MATRIZ DE PONTOS FORTES E VULNERABILIDADES */}
      <div className="glass-card rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> Matriz de Combate por Disciplina
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
              Disciplinas ranqueadas pela necessidade de resgate urgente.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-black uppercase">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Blindagem
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Disputa
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Vulnerabilidade
            </span>
          </div>
        </div>

        {subjectGroups.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Skull className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-black text-sm uppercase">Nenhuma questão registrada ainda</p>
            <p className="text-xs font-bold mt-1 text-slate-500">
              Abra o Projeto Caveira com a extensão ativada para iniciar o rastreamento automático.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjectGroups.map(sub => {
              const isExpanded = expandedSubject === sub.name;
              return (
                <div 
                  key={sub.name}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    sub.status === 'vulnerabilidade'
                      ? 'border-red-500/30 bg-red-500/5'
                      : sub.status === 'blindagem'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                  }`}
                >
                  <div 
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.name)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          sub.status === 'vulnerabilidade'
                            ? 'bg-red-500 text-white'
                            : sub.status === 'blindagem'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-slate-950'
                        }`}>
                          {sub.status === 'vulnerabilidade' ? 'Sangria de Pontos' : sub.status === 'blindagem' ? 'Blindado' : 'Em Disputa'}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase">
                          {sub.name}
                        </h3>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {sub.total} questões • {sub.hits} acertos • {sub.errors} erros
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase block">Saldo Cebraspe</span>
                        <span className={`text-xl font-black ${sub.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {sub.net > 0 ? `+${sub.net}` : sub.net} pts ({sub.netPercent}%)
                        </span>
                      </div>

                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* SUB-TÓPICOS DETALHADOS DA MATÉRIA */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 dark:border-slate-800/80 p-4 sm:p-5 bg-white/40 dark:bg-slate-950/40 space-y-3"
                      >
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          Diagnóstico por Tópico no Caveira:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {sub.topicsList.map(topic => (
                            <div 
                              key={topic.name}
                              className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase line-clamp-2">
                                    {topic.name}
                                  </h5>
                                  <span className={`text-[10px] font-black shrink-0 ${topic.net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {topic.net > 0 ? `+${topic.net}` : topic.net} pts
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${topic.netPercent >= 70 ? 'bg-emerald-500' : topic.netPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.max(5, Math.min(100, topic.netPercent))}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase mt-3">
                                <span>{topic.total} questões ({topic.hits}C / {topic.errors}E)</span>
                                {topic.errors > 0 && (
                                  <span className="text-red-400">
                                    ⚠️ {topic.errors} erros a resgatar
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CADERNO DE ERROS E HISTÓRICO DE QUESTÕES */}
      <div className="glass-card rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" /> Caderno Tático de Questões & Erros
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">
              Crie flashcards de revisão no FSRS diretamente a partir de questões erradas.
            </p>
          </div>

          {/* FILTROS */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'errors', label: 'Apenas Erros' },
              { id: 'guesses', label: 'Chutes' },
              { id: 'hits', label: 'Acertos' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-tight transition-all cursor-pointer ${
                  filterType === f.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-bold text-xs uppercase">Nenhuma questão com os filtros selecionados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuestions.slice(0, 50).map(q => (
              <div
                key={q.id + q.timestamp}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                      {q.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      q.hit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {q.hit ? 'Acertou' : 'Errou'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                      {q.banca} • {q.ano}
                    </span>
                    {q.confidence === 'chute' && (
                      <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded uppercase">
                        🎲 Chute
                      </span>
                    )}
                    {q.errorReason && (
                      <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded uppercase">
                        Motivo: {q.errorReason}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                    {q.subject} ➔ {q.topic}
                  </p>

                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-2 italic">
                    "{q.content}"
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 dark:border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Marcou: <strong className="text-white">{q.userChoice}</strong> | Gabarito: <strong className="text-emerald-400">{q.correctChoice}</strong>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      ⏱️ {q.durationSeconds}s
                    </div>
                  </div>

                  {!q.hit && (
                    <button
                      onClick={() => createFsrsCardFromCaveira(q)}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase px-3 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      title="Criar Flashcard no FSRS"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" /> FSRS
                    </button>
                  )}

                  <button
                    onClick={() => deleteCaveiraQuestion(q.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Excluir questão do histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE INSTRUÇÃO DE INSTALAÇÃO DA EXTENSÃO */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase">Instalar Extensão no Chrome</h3>
                  <p className="text-xs font-bold text-slate-400">Ativação em menos de 30 segundos</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">1</span>
                  <div>
                    <p className="text-white font-black uppercase mb-0.5">Abra as Extensões do Chrome</p>
                    <p className="text-slate-400">Digite na barra de endereços do Chrome ou Edge:</p>
                    <code className="text-blue-400 bg-slate-900 px-2 py-0.5 rounded text-[11px] block mt-1 select-all font-mono">chrome://extensions</code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">2</span>
                  <div>
                    <p className="text-white font-black uppercase mb-0.5">Ative o "Modo do Desenvolvedor"</p>
                    <p className="text-slate-400">Fica no canto superior direito da tela de extensões.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">3</span>
                  <div>
                    <p className="text-white font-black uppercase mb-0.5">Clique em "Carregar sem compactação"</p>
                    <p className="text-slate-400 mb-1">Selecione a pasta raiz da extensão (NÃO entre na pasta icons):</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <code className="text-amber-400 bg-slate-900 px-2 py-1 rounded text-[10px] truncate block font-mono flex-1">
                        C:\Users\wilso\Downloads\teste\extension
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('C:\\Users\\wilso\\Downloads\\teste\\extension');
                          setCopiedExtensionPath(true);
                          setTimeout(() => setCopiedExtensionPath(false), 2000);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white p-1 rounded-md transition-colors"
                        title="Copiar caminho da pasta"
                      >
                        {copiedExtensionPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-400/90 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      💡 Dica: Na janela de escolha de pasta, apenas clique uma vez sobre a pasta "extension" e clique em "Selecionar Pasta".
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Entendido!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE IMPORTAÇÃO JSON */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl"
            >
              <h3 className="text-base font-black text-white uppercase mb-2">Importar Questões (JSON)</h3>
              <p className="text-xs text-slate-400 mb-4 font-bold">
                Cole aqui o JSON gerado no popup da extensão ou backup:
              </p>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="[ { id: 'Q111494', ... } ]"
                rows={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-black text-xs uppercase px-3 py-2 rounded-xl border border-amber-500/30 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Colar do Clipboard
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase px-4 py-2 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImportJson}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase px-6 py-2 rounded-xl shadow-lg"
                  >
                    Importar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
