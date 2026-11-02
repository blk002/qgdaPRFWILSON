import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Target, AlertTriangle, ShieldCheck, TrendingUp, Clock, 
  RefreshCw, Download, Upload, Trash2, CheckCircle2, XCircle,
  Zap, BookOpen, ChevronDown, ChevronUp, Copy, Check,
  BrainCircuit, Skull, Search, Filter, Layers, MessageSquarePlus, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Classificador Inteligente para a Estrutura Oficial do Edital PRF (Cebraspe)
export function classifyPRFCategory(subject, topic, content) {
  const s = (subject || '').toLowerCase();
  const t = (topic || '').toLowerCase();
  const c = (content || '').toLowerCase();
  const full = `${s} ${t} ${c}`;

  // REGRA DE OURO 1: Se a matéria informada pelo Caveira já for expressamente uma disciplina do Bloco I
  if (s.includes('informática') || s.includes('informatica') || t.includes('informática') || t.includes('segurança da informação') || t.includes('redes')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Informática' };
  }
  if (s.includes('português') || s.includes('portuguesa') || s.includes('língua portuguesa')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Língua Portuguesa' };
  }
  if (s.includes('raciocínio lógico') || s.includes('raciocinio logico') || s.includes('rlm') || s.includes('matemática') || s.includes('física') || s.includes('fisica')) {
    return { bloco: 'Bloco I', canonicalSubject: s.includes('física') || s.includes('fisica') ? 'Física' : 'Raciocínio Lógico-Matemático' };
  }
  if (s.includes('ética') || s.includes('etica') || s.includes('geopolítica') || s.includes('geopolitica') || s.includes('inglês') || s.includes('espanhol')) {
    const canonical = s.includes('ética') || s.includes('etica') ? 'Ética e Cidadania' : s.includes('geopolítica') || s.includes('geopolitica') ? 'Geopolítica' : 'Língua Estrangeira';
    return { bloco: 'Bloco I', canonicalSubject: canonical };
  }

  // REGRA DE OURO 2: Se for expressamente Legislação de Trânsito
  if (s.includes('trânsito') || s.includes('transito') || s.includes('ctb') || s.includes('contran')) {
    const subCat = (full.includes('contran') || full.includes('resolução'))
      ? 'Resoluções do CONTRAN'
      : 'Legislação de Trânsito (CTB)';
    return { bloco: 'Bloco II', canonicalSubject: subCat };
  }

  // REGRA DE OURO 3: Se a matéria for Direito específico
  if (s.includes('constitucional')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Constitucional' };
  if (s.includes('administrativo')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Administrativo' };
  if (s.includes('processual penal')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Processual Penal' };
  if (s.includes('penal especial') || s.includes('legislação especial') || s.includes('leis especiais')) return { bloco: 'Bloco III', canonicalSubject: 'Legislação Penal Especial' };
  if (s.includes('direitos humanos')) return { bloco: 'Bloco III', canonicalSubject: 'Direitos Humanos' };
  if (s.includes('direito penal')) return { bloco: 'Bloco III', canonicalSubject: 'Direito Penal' };

  // BLOCO II — Legislação de Trânsito por conteúdo (30 questões na PRF)
  if (
    full.includes('trânsito') || full.includes('transito') || full.includes('ctb') ||
    full.includes('9.503') || full.includes('contran') || full.includes('resolução') ||
    full.includes('sinalização') || full.includes('habilitação') || full.includes('sinistro')
  ) {
    const subCat = (full.includes('contran') || full.includes('resolução'))
      ? 'Resoluções do CONTRAN'
      : 'Legislação de Trânsito (CTB)';
    return { bloco: 'Bloco II', canonicalSubject: subCat };
  }

  // BLOCO III — Direito e Conhecimentos Específicos por conteúdo (35 questões na PRF)
  if (full.includes('constitucional') || full.includes('constituição') || full.includes('art. 5') || full.includes('art. 144')) {
    return { bloco: 'Bloco III', canonicalSubject: 'Direito Constitucional' };
  }
  if (full.includes('administrativo') || full.includes('8.112') || full.includes('improbidade') || full.includes('8.429') || full.includes('14.133') || full.includes('licitaç') || full.includes('atos administrativos') || full.includes('poderes administrativos')) {
    return { bloco: 'Bloco III', canonicalSubject: 'Direito Administrativo' };
  }
  if (full.includes('processual penal') || full.includes('processo penal') || full.includes('inquérito') || full.includes('prisão em flagrante') || full.includes('ação penal')) {
    return { bloco: 'Bloco III', canonicalSubject: 'Direito Processual Penal' };
  }
  if (
    full.includes('legislação especial') || full.includes('leis especiais') || full.includes('11.343') ||
    full.includes('drogas') || full.includes('10.826') || full.includes('desarmamento') || full.includes('armas') ||
    full.includes('13.869') || full.includes('abuso de autoridade') || full.includes('9.455') || full.includes('tortura') ||
    full.includes('8.072') || full.includes('hediondos') || full.includes('12.850') || full.includes('organizações criminosas') ||
    full.includes('9.099') || full.includes('maria da penha') || full.includes('9.605') || full.includes('meio ambiente') ||
    full.includes('estatuto da criança') || full.includes('eca')
  ) {
    return { bloco: 'Bloco III', canonicalSubject: 'Legislação Penal Especial' };
  }
  if (full.includes('direitos humanos') || full.includes('pacto de san josé') || full.includes('declaração universal')) {
    return { bloco: 'Bloco III', canonicalSubject: 'Direitos Humanos' };
  }
  if (full.includes('direito penal') || full.includes('código penal') || full.includes('teoria do crime') || full.includes('crimes contra') || full.includes('peculato') || full.includes('homicídio')) {
    return { bloco: 'Bloco III', canonicalSubject: 'Direito Penal' };
  }

  // BLOCO I — Conhecimentos Básicos por conteúdo (55 questões na PRF)
  if (full.includes('português') || full.includes('portuguesa') || full.includes('gramática') || full.includes('redação oficial') || full.includes('sintaxe') || full.includes('crase') || full.includes('pontuação') || full.includes('concordância') || full.includes('regência')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Língua Portuguesa' };
  }
  if (full.includes('raciocínio lógico') || full.includes('rlm') || full.includes('matemática') || full.includes('probabilidade') || full.includes('estatística') || full.includes('combinatória') || full.includes('proposiç')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Raciocínio Lógico-Matemático' };
  }
  if (full.includes('informática') || full.includes('redes de computadores') || full.includes('segurança da informação') || full.includes('windows') || full.includes('linux') || full.includes('internet') || full.includes('malware') || full.includes('código de verificação') || full.includes('hash')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Informática' };
  }
  if (full.includes('física') || full.includes('cinemática') || full.includes('dinâmica') || full.includes('energia mecânica') || full.includes('colisões') || full.includes('quantidade de movimento')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Física' };
  }
  if (full.includes('ética') || full.includes('1.171') || full.includes('cidadania')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Ética e Cidadania' };
  }
  if (full.includes('geopolítica') || full.includes('geografia')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Geopolítica' };
  }
  if (full.includes('inglês') || full.includes('espanhol') || full.includes('língua estrangeira')) {
    return { bloco: 'Bloco I', canonicalSubject: 'Língua Estrangeira' };
  }

  return { bloco: 'Bloco I', canonicalSubject: subject || 'Outras Disciplinas' };
}

const BLOCO_METADATA = {
  'Bloco I': {
    title: 'Bloco I • Básicas',
    subtitle: 'Português, RLM, Informática, Física, Ética, Geopolítica e Inglês/Espanhol',
    examWeight: '55 itens na PRF',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    accentBorder: 'border-sky-500/40'
  },
  'Bloco II': {
    title: 'Bloco II • Trânsito',
    subtitle: 'Código de Trânsito Brasileiro (CTB) e Resoluções do CONTRAN',
    examWeight: '30 itens na PRF (Peso Crítico)',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    accentBorder: 'border-amber-500/40'
  },
  'Bloco III': {
    title: 'Bloco III • Direito',
    subtitle: 'Penal, Processo Penal, Leg. Especial, Constitucional, Administrativo e DH',
    examWeight: '35 itens na PRF',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    accentBorder: 'border-purple-500/40'
  }
};

export default function RaioXCaveira() {
  const {
    caveiraQuestions = [],
    importCaveiraQuestions,
    updateCaveiraQuestion,
    deleteCaveiraQuestion,
    clearCaveiraQuestions,
    createFsrsCardFromCaveira
  } = useStore();

  const [extensionDetected, setExtensionDetected] = useState(false);
  const [selectedBloco, setSelectedBloco] = useState('all'); // 'all' | 'Bloco I' | 'Bloco II' | 'Bloco III'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'errors' | 'blindspot' | 'guesses' | 'attention' | 'theory' | 'hits'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copiedExtensionPath, setCopiedExtensionPath] = useState(false);

  // Escuta detecção e sincronização da extensão via bridge
  useEffect(() => {
    if (document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true') {
      setExtensionDetected(true);
    }

    const handleMessage = (event) => {
      if (event.data && event.data.source === 'QG_CAVEIRA_EXTENSION') {
        if (event.data.type === 'EXTENSION_DETECTED') {
          setExtensionDetected(true);
        }
        if (event.data.type === 'RESET_CORRUPTED_DATA') {
          setExtensionDetected(true);
          useStore.getState().clearCaveiraQuestions();
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
    window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Enriquecimento automático de cada questão com Bloco PRF e Disciplina Padronizada
  const enrichedQuestions = useMemo(() => {
    return caveiraQuestions.map(q => {
      const classified = classifyPRFCategory(q.subject, q.topic, q.content);
      return {
        ...q,
        bloco: q.bloco || classified.bloco,
        canonicalSubject: q.canonicalSubject || classified.canonicalSubject
      };
    });
  }, [caveiraQuestions]);

  // Questões filtradas pelo Bloco selecionado (para alimentar os painéis analíticos)
  const blockScopedQuestions = useMemo(() => {
    if (selectedBloco === 'all') return enrichedQuestions;
    return enrichedQuestions.filter(q => q.bloco === selectedBloco);
  }, [enrichedQuestions, selectedBloco]);

  // Estatísticas Globais e Diagnóstico Tático Profundo
  const stats = useMemo(() => {
    const list = blockScopedQuestions;
    const total = list.length;
    if (total === 0) {
      return {
        total: 0, hits: 0, errors: 0, netScore: 0, grossRate: 0, netRate: 0,
        avgTimeSec: 0, avgHitTimeSec: 0, avgErrorTimeSec: 0,
        rushedErrors: 0, slowErrors: 0,
        guessesTotal: 0, guessHits: 0, guessErrors: 0, guessesNet: 0,
        solidMastery: 0, blindSpots: 0, insecureHits: 0, insecureErrors: 0,
        errorReasons: { conteudo: 0, atencao: 0, interpretacao: 0 }
      };
    }

    const hitList = list.filter(q => q.hit);
    const errorList = list.filter(q => !q.hit);
    const hits = hitList.length;
    const errors = errorList.length;
    const netScore = hits - errors; // Modelo Cebraspe: 1 errada anula 1 certa
    const grossRate = Math.round((hits / total) * 100);
    const netRate = Math.max(0, Math.round((netScore / total) * 100));

    const totalSeconds = list.reduce((acc, q) => acc + (q.durationSeconds || 0), 0);
    const avgTimeSec = Math.round(totalSeconds / total);

    const avgHitTimeSec = hits > 0
      ? Math.round(hitList.reduce((acc, q) => acc + (q.durationSeconds || 0), 0) / hits)
      : 0;
    const avgErrorTimeSec = errors > 0
      ? Math.round(errorList.reduce((acc, q) => acc + (q.durationSeconds || 0), 0) / errors)
      : 0;

    // Erros por precipitação (< 15s) vs travamento (> 90s)
    const rushedErrors = errorList.filter(q => (q.durationSeconds || 0) < 15).length;
    const slowErrors = errorList.filter(q => (q.durationSeconds || 0) > 90).length;

    // Quadrantes de Confiança vs Resultado
    const solidMastery = list.filter(q => q.hit && (q.confidence === 'sabia' || !q.confidence)).length;
    const blindSpots = list.filter(q => !q.hit && q.confidence === 'sabia').length; // Sabia e Errou!
    const insecureHits = list.filter(q => q.hit && q.confidence === 'duvida').length;
    const insecureErrors = list.filter(q => !q.hit && (q.confidence === 'duvida' || !q.confidence)).length;

    // Auditoria de Chutes
    const guesses = list.filter(q => q.confidence === 'chute');
    const guessHits = guesses.filter(q => q.hit).length;
    const guessErrors = guesses.length - guessHits;
    const guessesNet = guessHits - guessErrors;

    // Causa Raiz dos Erros
    const errorReasons = {
      conteudo: errorList.filter(q => !q.errorReason || q.errorReason === 'conteudo').length,
      atencao: errorList.filter(q => q.errorReason === 'atencao').length,
      interpretacao: errorList.filter(q => q.errorReason === 'interpretacao').length
    };

    return {
      total, hits, errors, netScore, grossRate, netRate,
      avgTimeSec, avgHitTimeSec, avgErrorTimeSec,
      rushedErrors, slowErrors,
      guessesTotal: guesses.length, guessHits, guessErrors, guessesNet,
      solidMastery, blindSpots, insecureHits, insecureErrors,
      errorReasons
    };
  }, [blockScopedQuestions]);

  // Estatísticas por Bloco do Edital PRF (I, II, III)
  const blocoStats = useMemo(() => {
    return ['Bloco I', 'Bloco II', 'Bloco III'].map(blocoKey => {
      const qList = enrichedQuestions.filter(q => q.bloco === blocoKey);
      const total = qList.length;
      const hits = qList.filter(q => q.hit).length;
      const errors = total - hits;
      const net = hits - errors;
      const netRate = total > 0 ? Math.max(0, Math.round((net / total) * 100)) : 0;
      const grossRate = total > 0 ? Math.round((hits / total) * 100) : 0;
      const avgTime = total > 0 ? Math.round(qList.reduce((a, q) => a + (q.durationSeconds || 0), 0) / total) : 0;
      return {
        blocoKey,
        ...BLOCO_METADATA[blocoKey],
        total,
        hits,
        errors,
        net,
        netRate,
        grossRate,
        avgTime
      };
    });
  }, [enrichedQuestions]);

  // Agrupamento Hierárquico por Disciplina Padronizada e Tópico
  const subjectGroups = useMemo(() => {
    const groups = {};

    blockScopedQuestions.forEach(q => {
      const subName = q.canonicalSubject || q.subject || 'Outras';
      if (!groups[subName]) {
        groups[subName] = {
          name: subName,
          bloco: q.bloco || 'Bloco I',
          total: 0,
          hits: 0,
          errors: 0,
          blindSpots: 0,
          totalTime: 0,
          topics: {}
        };
      }

      groups[subName].total += 1;
      groups[subName].totalTime += (q.durationSeconds || 0);
      if (q.hit) groups[subName].hits += 1;
      else {
        groups[subName].errors += 1;
        if (q.confidence === 'sabia') groups[subName].blindSpots += 1;
      }

      const topicLabel = (q.topic && q.topic !== q.subject)
        ? `${q.subject} ➔ ${q.topic}`
        : (q.topic || q.subject || 'Geral');

      if (!groups[subName].topics[topicLabel]) {
        groups[subName].topics[topicLabel] = {
          name: topicLabel,
          shortTopic: q.topic || 'Geral',
          rawSubject: q.subject || 'Geral',
          total: 0,
          hits: 0,
          errors: 0,
          blindSpots: 0,
          questions: []
        };
      }

      const t = groups[subName].topics[topicLabel];
      t.total += 1;
      if (q.hit) t.hits += 1;
      else {
        t.errors += 1;
        if (q.confidence === 'sabia') t.blindSpots += 1;
      }
      t.questions.push(q);
    });

    return Object.values(groups).map(g => {
      const grossPercent = g.total > 0 ? Math.round((g.hits / g.total) * 100) : 0;
      const avgTime = g.total > 0 ? Math.round(g.totalTime / g.total) : 0;

      let status = 'disputa';
      if (g.total >= 2 && grossPercent >= 75) status = 'blindagem';
      else if (grossPercent < 50) status = 'vulnerabilidade';

      const topicsList = Object.values(g.topics).map(t => {
        const tGrossPct = t.total > 0 ? Math.round((t.hits / t.total) * 100) : 0;
        return { ...t, grossPercent: tGrossPct };
      }).sort((a, b) => a.grossPercent - b.grossPercent || b.errors - a.errors);

      return {
        ...g,
        grossPercent,
        avgTime,
        status,
        topicsList
      };
    }).sort((a, b) => a.grossPercent - b.grossPercent || b.errors - a.errors);
  }, [blockScopedQuestions]);

  // Lista de Questões Filtrada para o Caderno Tático
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return blockScopedQuestions.filter(q => {
      if (selectedSubject !== 'all' && q.canonicalSubject !== selectedSubject) return false;
      if (selectedTopic !== 'all') {
        const topicLabel = (q.topic && q.topic !== q.subject)
          ? `${q.subject} ➔ ${q.topic}`
          : (q.topic || q.subject || 'Geral');
        if (topicLabel !== selectedTopic) return false;
      }

      if (filterType === 'errors' && q.hit) return false;
      if (filterType === 'hits' && !q.hit) return false;
      if (filterType === 'blindspot' && (q.hit || q.confidence !== 'sabia')) return false;
      if (filterType === 'guesses' && q.confidence !== 'chute') return false;
      if (filterType === 'attention' && (q.hit || q.errorReason !== 'atencao')) return false;
      if (filterType === 'theory' && (q.hit || (q.errorReason && q.errorReason !== 'conteudo'))) return false;

      if (query) {
        const hay = `${q.id} ${q.canonicalSubject} ${q.subject} ${q.topic} ${q.content} ${q.userNote || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });
  }, [blockScopedQuestions, selectedSubject, selectedTopic, filterType, searchQuery]);

  const handleRequestSync = () => {
    window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA' }, '*');
    toast.info('Sincronizando questões com a extensão...');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      importCaveiraQuestions(list, false);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (_) {
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
    } catch (_) {
      toast.error('Não foi possível ler JSON válido da área de transferência.');
    }
  };

  const handleSaveNote = (qId) => {
    updateCaveiraQuestion(qId, { userNote: noteDraft.trim() });
    setEditingNoteId(null);
    setNoteDraft('');
    toast.success('Bizu tático salvo na questão!');
  };

  return (
    <div className="fade-in w-full pb-12 font-sans space-y-4">

      {/* HEADER DA SEÇÃO */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-900 to-red-950 border border-red-500/40 flex items-center justify-center text-2xl shadow-md shrink-0">
              💀
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  Raio-X Projeto Caveira
                </h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  extensionDetected
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${extensionDetected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {extensionDetected ? 'Conectada' : 'Pendente'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Acompanhamento objetivo de questões por bloco e disciplina da PRF.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {extensionDetected ? (
              <button
                onClick={handleRequestSync}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
              </button>
            ) : (
              <button
                onClick={() => setShowInstallModal(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Ativar Extensão
              </button>
            )}

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title="Importar questões via JSON"
            >
              <Upload className="w-3.5 h-3.5" /> Importar
            </button>

            {caveiraQuestions.length > 0 && (
              <button
                onClick={() => {
                  useStore.getState().setGlobalModal({
                    title: 'Limpar Histórico do Caveira?',
                    message: 'Esta ação removerá todas as questões sincronizadas do Raio-X Caveira e seus respectivos cartões FSRS.',
                    onConfirm: () => clearCaveiraQuestions()
                  });
                }}
                className="p-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all cursor-pointer"
                title="Limpar histórico do Caveira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI CARDS GERAIS (COMPACTOS E HORIZONTAIS — SEM ESPAÇO VAZIO) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Resolvidas ({selectedBloco === 'all' ? 'Geral' : selectedBloco})
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium truncate">⏱️ {stats.avgTimeSec}s/q</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Acertos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-500 leading-tight">{stats.hits}</span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                ({stats.total > 0 ? Math.round((stats.hits / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Erros</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-500 leading-tight">{stats.errors}</span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                ({stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Aproveitamento</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black leading-tight ${stats.grossRate >= 75 ? 'text-emerald-500' : stats.grossRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {stats.grossRate}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {stats.hits}C / {stats.errors}E
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL 1: RADAR DOS 3 BLOCOS DO EDITAL PRF (COMPACTO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {blocoStats.map(b => {
          const isSelected = selectedBloco === b.blocoKey;
          return (
            <div
              key={b.blocoKey}
              onClick={() => {
                setSelectedBloco(isSelected ? 'all' : b.blocoKey);
                setSelectedSubject('all');
                setSelectedTopic('all');
              }}
              className={`glass-card rounded-2xl p-3.5 border transition-all cursor-pointer ${
                isSelected
                  ? `${b.accentBorder} bg-blue-500/10 ring-2 ring-blue-500/30`
                  : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${b.badgeClass}`}>
                    {b.title}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {b.total} feitas ({b.hits}C • {b.errors}E)
                  </span>
                </div>
                <span className={`text-lg font-black ${b.total === 0 ? 'text-slate-400' : b.grossRate >= 75 ? 'text-emerald-500' : b.grossRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {b.grossRate}%
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    b.grossRate >= 75 ? 'bg-emerald-500' : b.grossRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${b.total > 0 ? Math.max(6, Math.min(100, b.grossRate)) : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* PAINEL 2: DESEMPENHO POR DISCIPLINA (EM GRID DE CARDS COMPACTOS) */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" /> Desempenho por Disciplina ({subjectGroups.length})
            </h2>
            <p className="text-xs font-medium text-slate-400">
              Clique em uma matéria para expandir os assuntos ou filtrar questões.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold uppercase">
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &ge;75%
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 50–74%
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500" /> &lt;50%
            </span>
          </div>
        </div>

        {subjectGroups.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Skull className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-black text-xs uppercase">Nenhuma questão registrada neste filtro</p>
            <p className="text-xs mt-1 text-slate-500">
              Resolva questões no Projeto Caveira para alimentar as disciplinas automaticamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjectGroups.map(sub => {
              const isExpanded = expandedSubject === sub.name;
              const blocoMeta = BLOCO_METADATA[sub.bloco] || BLOCO_METADATA['Bloco I'];
              return (
                <div
                  key={sub.name}
                  className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
                  } ${
                    sub.status === 'vulnerabilidade'
                      ? 'border-red-500/30 bg-red-500/5 dark:bg-[#1E2022]'
                      : sub.status === 'blindagem'
                        ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-[#1E2022]'
                        : 'border-slate-200 dark:border-[#32363A] bg-white dark:bg-[#1E2022]'
                  }`}
                >
                  <div
                    onClick={() => setExpandedSubject(isExpanded ? null : sub.name)}
                    className="p-3.5 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-[#26292C]/60 transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-[0.03em] px-2 py-0.5 rounded border ${blocoMeta.badgeClass}`}>
                            {sub.bloco}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-[0.03em] px-2 py-0.5 rounded ${
                            sub.status === 'vulnerabilidade'
                              ? 'bg-red-500 text-white'
                              : sub.status === 'blindagem'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-500 text-slate-950'
                          }`}>
                            {sub.status === 'vulnerabilidade' ? 'Reforço' : sub.status === 'blindagem' ? 'Blindado' : 'Evolução'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-[#F1F5F9] truncate" title={sub.name}>
                          {sub.name}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-lg font-bold leading-none block ${sub.grossPercent >= 75 ? 'text-emerald-500' : sub.grossPercent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {sub.grossPercent}%
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {sub.hits}C / {sub.errors}E
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-[#26292C] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sub.grossPercent >= 75 ? 'bg-emerald-500' : sub.grossPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(5, Math.min(100, sub.grossPercent))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500 dark:text-[#A0AAB2] font-medium">
                        {sub.total} {sub.total === 1 ? 'questão' : 'questões'} • ⏱️ {sub.avgTime}s
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubject(selectedSubject === sub.name ? 'all' : sub.name);
                            setSelectedTopic('all');
                          }}
                          className={`text-[10px] font-semibold uppercase tracking-[0.03em] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            selectedSubject === sub.name
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                        >
                          {selectedSubject === sub.name ? '✓ Filtrado' : 'Filtrar'}
                        </button>
                        <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-[#26292C] flex items-center justify-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
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
                        className="border-t border-slate-200 dark:border-[#2E3236] p-3.5 bg-white/40 dark:bg-[#181A1C] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.03em] text-slate-400">
                            Assuntos Mapeados ({sub.topicsList.length}):
                          </h4>
                          {selectedTopic !== 'all' && (
                            <button
                              onClick={() => setSelectedTopic('all')}
                              className="text-xs font-semibold uppercase tracking-[0.03em] text-blue-400 hover:underline"
                            >
                              Limpar filtro de tópico
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {sub.topicsList.map(topic => {
                            const isTopicActive = selectedTopic === topic.name;
                            return (
                              <div
                                key={topic.name}
                                onClick={() => {
                                  setSelectedSubject(sub.name);
                                  setSelectedTopic(isTopicActive ? 'all' : topic.name);
                                }}
                                className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                  isTopicActive
                                    ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/40'
                                    : 'bg-slate-100 dark:bg-[#1E2022] border-slate-200/60 dark:border-[#32363A] hover:border-slate-600'
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start gap-2">
                                    <h5 className="text-xs font-medium text-slate-800 dark:text-[#F1F5F9] normal-case line-clamp-2 leading-snug">
                                      {topic.name}
                                    </h5>
                                    <span className={`text-xs font-bold shrink-0 ${topic.grossPercent >= 75 ? 'text-emerald-500' : topic.grossPercent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                      {topic.grossPercent}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-[#26292C] h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${topic.grossPercent >= 75 ? 'bg-emerald-500' : topic.grossPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                      style={{ width: `${Math.max(5, Math.min(100, topic.grossPercent))}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 dark:text-[#A0AAB2] mt-2">
                                  <span>{topic.total}q ({topic.hits}C / {topic.errors}E)</span>
                                  {topic.errors > 0 ? (
                                    <span className="text-red-400">⚠️ {topic.errors} erro(s)</span>
                                  ) : (
                                    <span className="text-emerald-400">✓ 100%</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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

      {/* PAINEL 3: CADERNO DE QUESTÕES */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-[#F1F5F9] uppercase tracking-[0.03em] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" /> Caderno de Questões ({filteredQuestions.length})
            </h2>
            <p className="text-xs font-normal text-slate-500 dark:text-[#A0AAB2]">
              Histórico rastreado do Projeto Caveira com filtros rápidos e anotações.
            </p>
          </div>

          {/* BUSCA RÁPIDA E SELETOR DE MATÉRIA */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar Q112415, assunto ou texto..."
                className="w-full bg-slate-100 dark:bg-[#1E2022] border border-slate-200 dark:border-[#32363A] rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-[#F1F5F9] outline-none focus:border-purple-500"
              />
            </div>

            {(selectedBloco !== 'all' || selectedSubject !== 'all' || selectedTopic !== 'all' || filterType !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedBloco('all');
                  setSelectedSubject('all');
                  setSelectedTopic('all');
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold uppercase tracking-[0.03em] text-amber-400 cursor-pointer"
              >
                Limpar Filtros ✕
              </button>
            )}
          </div>
        </div>

        {/* CHIPS DE FILTRO OBJETIVOS */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'errors', label: '✗ Erros' },
            { id: 'hits', label: '✓ Acertos' },
            { id: 'guesses', label: '🎲 Chutes' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs uppercase tracking-[0.03em] transition-all cursor-pointer ${
                filterType === f.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-[#26292C] text-slate-500 dark:text-[#A0AAB2] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-xs uppercase tracking-[0.03em]">Nenhuma questão encontrada para os filtros selecionados</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.slice(0, 80).map(q => {
              const blocoMeta = BLOCO_METADATA[q.bloco] || BLOCO_METADATA['Bloco I'];
              const isEditingThisNote = editingNoteId === q.id;
              return (
                <div
                  key={q.id + (q.timestamp || '')}
                  className={`p-5 sm:p-6 rounded-2xl border shadow-lg transition-all flex flex-col justify-between gap-3.5 ${
                    !q.hit && q.confidence === 'sabia'
                      ? 'border-red-500/40 bg-red-500/5 dark:bg-[#1E2022] shadow-red-950/20'
                      : 'border-slate-200 dark:border-[#383D43] bg-white dark:bg-[#1E2022] shadow-black/40'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans text-xs font-bold tracking-[0.03em] text-white bg-slate-800 dark:bg-[#26292C] border border-slate-700 dark:border-[#383C42] px-2.5 py-1 rounded-md">
                        {q.id}
                      </span>
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.03em] px-2.5 py-1 rounded-md border ${blocoMeta.badgeClass}`}>
                        {q.bloco} • {q.canonicalSubject}
                      </span>
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.03em] px-2.5 py-1 rounded-md ${
                        q.hit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {q.hit ? '✓ Acertou' : '✗ Errou'}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.03em] text-slate-600 dark:text-[#A0AAB2] bg-slate-100 dark:bg-[#26292C] px-2.5 py-1 rounded-md">
                        {q.banca} • {q.ano}
                      </span>
                      <span className="text-[11px] font-semibold tracking-[0.03em] text-slate-600 dark:text-[#A0AAB2] bg-slate-100 dark:bg-[#26292C] px-2.5 py-1 rounded-md">
                        ⏱️ {q.durationSeconds}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      <span className="text-xs font-semibold uppercase tracking-[0.03em] text-slate-500 dark:text-[#A0AAB2] mr-1 whitespace-nowrap">
                        Marcou: <strong className={q.hit ? 'text-emerald-400' : 'text-red-400'}>{q.userChoice}</strong> | Gabarito: <strong className="text-emerald-400">{q.correctChoice}</strong>
                      </span>

                      <button
                        onClick={() => {
                          setEditingNoteId(isEditingThisNote ? null : q.id);
                          setNoteDraft(q.userNote || '');
                        }}
                        className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Adicionar/Editar Bizu ou Anotação na Questão"
                      >
                        <MessageSquarePlus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => createFsrsCardFromCaveira(q)}
                        className={`${
                          q.fsrsCreated
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        } font-semibold text-[11px] uppercase tracking-[0.03em] px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0`}
                        title="Criar Flashcard de Revisão no FSRS"
                      >
                        <BrainCircuit className="w-3.5 h-3.5" /> {q.fsrsCreated ? 'No FSRS ✓' : '+ FSRS'}
                      </button>

                      <button
                        onClick={() => deleteCaveiraQuestion(q.id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Excluir questão do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Trilha Hierárquica do Assunto/Tópico (Caixa mista, peso 400, #A0AAB2, 14px) */}
                  <p className="text-sm font-normal normal-case text-slate-600 dark:text-[#A0AAB2] leading-snug">
                    📂 {q.subject} {q.topic && q.topic !== q.subject ? `➔ ${q.topic}` : ''}
                  </p>

                  {/* Enunciado (16px/16.5px, peso 500, line-height 1.6, #F1F5F9, fundo #26292C, sem aspas) */}
                  <p className="text-[16px] font-medium text-slate-800 dark:text-[#F1F5F9] leading-[1.6] bg-slate-100 dark:bg-[#26292C] p-4 rounded-xl border border-slate-200/70 dark:border-[#34383D]">
                    {q.content}
                  </p>

                  {/* Comentário do Professor / Gabarito Comentado */}
                  {q.teacherComment && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs sm:text-sm text-blue-100">
                      <span className="font-bold text-blue-300 block mb-1">🎓 Comentário do Professor / Gabarito Comentado:</span>
                      <div className="text-slate-200 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {q.teacherComment}
                      </div>
                    </div>
                  )}

                  {/* Anotação Tática / Bizu Salvo */}
                  {q.userNote && !isEditingThisNote && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm text-amber-200 font-medium flex items-center justify-between">
                      <span>💡 <strong>Bizu Tático:</strong> {q.userNote}</span>
                      <button
                        onClick={() => {
                          setEditingNoteId(q.id);
                          setNoteDraft(q.userNote || '');
                        }}
                        className="text-xs font-semibold uppercase tracking-[0.03em] text-amber-400 hover:underline ml-3"
                      >
                        Editar
                      </button>
                    </div>
                  )}

                  {/* Campo de Edição de Nota */}
                  {isEditingThisNote && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Digite a pegadinha da questão, artigo da lei ou bizu de revisão..."
                        className="flex-1 bg-[#26292C] border border-amber-500/40 rounded-xl px-3.5 py-2 text-sm text-[#F1F5F9] outline-none"
                      />
                      <button
                        onClick={() => handleSaveNote(q.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs uppercase tracking-[0.03em] px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Salvar
                      </button>
                    </div>
                  )}

                  {/* Barra Interativa de Reclassificação Tática (Confiança e Motivo do Erro) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/60 dark:border-[#2E3236]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.03em] text-slate-500 dark:text-[#A0AAB2] mr-1">Confiança:</span>
                      {[
                        { id: 'sabia', label: '🎯 Sabia' },
                        { id: 'duvida', label: '🤔 Dúvida' },
                        { id: 'chute', label: '🎲 Chute' }
                      ].map(c => (
                        <button
                          key={c.id}
                          onClick={() => updateCaveiraQuestion(q.id, { confidence: c.id })}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-[0.03em] transition-all cursor-pointer ${
                            q.confidence === c.id
                              ? 'bg-sky-500 text-slate-950 shadow-sm'
                              : 'bg-slate-100 dark:bg-[#26292C] text-slate-500 dark:text-[#A0AAB2] hover:text-white'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {!q.hit && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.03em] text-rose-400 mr-1">Causa do Erro:</span>
                        {[
                          { id: 'conteudo', label: '📚 Teoria / Lei' },
                          { id: 'atencao', label: '⚠️ Atenção' },
                          { id: 'interpretacao', label: '🔍 Interpretação' }
                        ].map(r => (
                          <button
                            key={r.id}
                            onClick={() => updateCaveiraQuestion(q.id, { errorReason: r.id })}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-[0.03em] transition-all cursor-pointer ${
                              (q.errorReason || 'conteudo') === r.id
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-[#26292C] text-slate-500 dark:text-[#A0AAB2] hover:text-white'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                    <p className="text-slate-400 mb-1">Selecione a pasta raiz da extensão:</p>
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
