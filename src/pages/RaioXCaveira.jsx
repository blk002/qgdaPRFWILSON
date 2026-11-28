import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ERROR_CAUSES, normalizeErrorReason } from '../lib/errorAutopsy';
import { buildTrapFingerprint } from '../lib/cebraspeTraps';
import {
  Target, RefreshCw, Download, Upload, Trash2,
  BookOpen, Copy, Check, Skull, Scale, X,
  LayoutDashboard, Crosshair
} from 'lucide-react';
import {
  findCourseVideoMatch,
  computeOvercomingStats,
  computeForgettingCurveByDiscipline,
  extractPrfMemorizationRows
} from '../utils/caveiraAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import RaioXOverview from '../components/raiox/RaioXOverview';
import RaioXDiagnostics from '../components/raiox/RaioXDiagnostics';
import RaioXIntelligence from '../components/raiox/RaioXIntelligence';
import RaioXNotebook from '../components/raiox/RaioXNotebook';
import CaveiraDifficultySelector from '../components/CaveiraDifficultySelector';
import {
  DEFAULT_CAVEIRA_QUESTION_PREFS,
  classifyQuestionDifficulty,
  formatDifficultyIdsLabel,
  recommendDifficultyForTopic,
  resolveEffectiveDifficultyIds,
  sanitizeDifficultyIds,
} from '../lib/caveiraDifficulty';

// Classificador Inteligente para a Estrutura Oficial do Edital PRF (Cebraspe)
function classifyPRFCategory(subject, topic, content) {
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
    const subCat = (full.includes('contran') || full.includes('resolução') || full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes'))
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
    full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes') ||
    full.includes('sinalização') || full.includes('habilitação') || full.includes('sinistro')
  ) {
    const subCat = (full.includes('contran') || full.includes('resolução') || full.includes('resolucao') || full.includes('resoluções') || full.includes('resolucoes'))
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
    short: 'B-I',
    title: 'Bloco I · Básicas',
    subtitle: 'Português, RLM, Informática, Física, Ética, Geopolítica e Língua Estrangeira',
    examWeight: '55 itens',
    badgeClass: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/30',
    activeClass: 'bg-sky-600 text-white border-sky-500 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-400',
    accentBorder: 'border-sky-500/40'
  },
  'Bloco II': {
    short: 'B-II',
    title: 'Bloco II · Trânsito',
    subtitle: 'Código de Trânsito Brasileiro (CTB) e Resoluções do CONTRAN',
    examWeight: '30 itens',
    badgeClass: 'bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/30',
    activeClass: 'bg-amber-500 text-slate-950 border-amber-400',
    accentBorder: 'border-amber-500/40'
  },
  'Bloco III': {
    short: 'B-III',
    title: 'Bloco III · Direito',
    subtitle: 'Penal, Processo Penal, Leg. Especial, Constitucional, Administrativo e DH',
    examWeight: '35 itens',
    badgeClass: 'bg-purple-500/12 text-purple-700 dark:text-purple-400 border-purple-500/30',
    activeClass: 'bg-purple-600 text-white border-purple-500',
    accentBorder: 'border-purple-500/40'
  }
};

function formatDurationHMS(totalSec) {
  const safe = Math.max(0, Number(totalSec) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RaioXCaveira() {
  const {
    caveiraQuestions = [],
    caveiraCourseIndexMap = {},
    subjects = {},
    caveiraQuestionPrefs = DEFAULT_CAVEIRA_QUESTION_PREFS,
    setCaveiraQuestionPrefs,
    importCaveiraQuestions,
    updateCaveiraQuestion,
    deleteCaveiraQuestion,
    clearCaveiraQuestions,
    createFsrsCardFromCaveira
  } = useStore();

  const [extensionDetected, setExtensionDetected] = useState(() => {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true';
  });
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'diagnostics' | 'intelligence' | 'notebook'
  const [inspectedDiscipline, setInspectedDiscipline] = useState(null);
  const [selectedBloco, setSelectedBloco] = useState('all'); // 'all' | 'Bloco I' | 'Bloco II' | 'Bloco III'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all'); // 'all' | '2' | '3' | '4' | '5' | '6'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'errors' | 'hits' | 'guesses' | 'avoidable' | 'pegadinha' | 'attention' | 'theory'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copiedExtensionPath, setCopiedExtensionPath] = useState(false);
  const [selectedLegalDevice, setSelectedLegalDevice] = useState(null);
  const [selectedTrapTerm, setSelectedTrapTerm] = useState(null);
  const [topicReportScope, setTopicReportScope] = useState('all'); // 'all' | 'bloco2' | 'fps'
  const [decorebaCategory, setDecorebaCategory] = useState('Todos');
  const [decorebaSearch, setDecorebaSearch] = useState('');

  // Escuta detecção e reset da extensão via bridge (sincronização centralizada em App.jsx)
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event || event.source !== window || event.origin !== window.location.origin) return;
      if (event.data && event.data.source === 'QG_CAVEIRA_EXTENSION') {
        if (['EXTENSION_DETECTED', 'SYNC_UPDATE', 'CAVEIRA_DATA_RESPONSE'].includes(event.data.type)) {
          setExtensionDetected(true);
        }
        if (event.data.type === 'RESET_CORRUPTED_DATA') {
          setExtensionDetected(true);
          useStore.getState().clearCaveiraQuestions();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    const activeUserId = useStore.getState().user?.id;
    if (activeUserId && useStore.getState().hasCompletedInitialCloudSync) {
      window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA', payload: { userId: activeUserId } }, window.location.origin);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!showInstallModal && !showImportModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowInstallModal(false);
        setShowImportModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showInstallModal, showImportModal]);

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
        guessesOrDoubtsTotal: 0,
        errorReasons: { leitura: 0, decoreba: 0, pegadinha: 0, base: 0, cansaco: 0 }
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
    const avgTimeSec = total > 0 ? Math.round(totalSeconds / total) : 0;

    const avgHitTimeSec = hits > 0
      ? Math.round(hitList.reduce((acc, q) => acc + (q.durationSeconds || 0), 0) / hits)
      : 0;
    const avgErrorTimeSec = errors > 0
      ? Math.round(errorList.reduce((acc, q) => acc + (q.durationSeconds || 0), 0) / errors)
      : 0;

    const guessesOrDoubtsTotal = list.filter(q => q.confidence === 'chute' || q.confidence === 'duvida').length;

    const errorReasons = {
      leitura: 0,
      decoreba: 0,
      pegadinha: 0,
      base: 0,
      cansaco: 0
    };
    errorList.forEach(q => {
      const norm = normalizeErrorReason(q.errorReason);
      errorReasons[norm] = (errorReasons[norm] || 0) + 1;
    });

    return {
      total, hits, errors, netScore, grossRate, netRate,
      totalSeconds,
      avgTimeSec, avgHitTimeSec, avgErrorTimeSec,
      guessesOrDoubtsTotal,
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
      const grossRate = total > 0 ? Math.round((hits / total) * 100) : 0;
      return {
        blocoKey,
        ...BLOCO_METADATA[blocoKey],
        total,
        hits,
        errors,
        grossRate
      };
    });
  }, [enrichedQuestions]);

  const getQuestionTopicLabel = (q) =>
    (q?.topic && q.topic !== q.subject && q.topic !== q.canonicalSubject)
      ? q.topic
      : (q?.topic || q?.canonicalSubject || q?.subject || 'Geral');

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
          totalTime: 0,
          topics: {}
        };
      }

      groups[subName].total += 1;
      groups[subName].totalTime += (q.durationSeconds || 0);
      if (q.hit) groups[subName].hits += 1;
      else groups[subName].errors += 1;

      const topicLabel = getQuestionTopicLabel(q);

      if (!groups[subName].topics[topicLabel]) {
        groups[subName].topics[topicLabel] = {
          name: topicLabel,
          total: 0,
          hits: 0,
          errors: 0
        };
      }

      const t = groups[subName].topics[topicLabel];
      t.total += 1;
      if (q.hit) t.hits += 1;
      else t.errors += 1;
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

  // --- RADAR DE LEI SECA: RASTREADOR AUTOMÁTICO DE ARTIGOS, LEIS, SÚMULAS E RESOLUÇÕES ---
  const legalRadarList = useMemo(() => {
    const deviceMap = {};

    const registerDevice = (key, label, category, q) => {
      if (!deviceMap[key]) {
        deviceMap[key] = {
          key,
          label,
          category,
          subject: q.canonicalSubject || q.subject || 'Direito / Legislação',
          total: 0,
          errors: 0,
          guessesOrDoubts: 0,
          hits: 0,
          questionIds: new Set()
        };
      }
      const entry = deviceMap[key];
      if (!entry.questionIds.has(q.id)) {
        entry.questionIds.add(q.id);
        entry.total += 1;
        if (!q.hit) entry.errors += 1;
        else entry.hits += 1;
        if (q.confidence === 'chute' || q.confidence === 'duvida') {
          entry.guessesOrDoubts += 1;
        }
      }
    };

    const KNOWN_LAWS = [
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?9\.?503(?:\s*\/\s*\d{2,4})?|c[óo]digo\s+de\s+tr[âa]nsito|ctb)\b/i, key: 'LEI_9503', label: 'Lei 9.503/97 (CTB)', cat: 'Trânsito' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?11\.?343(?:\s*\/\s*\d{2,4})?|lei\s+de\s+drogas)\b/i, key: 'LEI_11343', label: 'Lei 11.343/06 (Lei de Drogas)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?10\.?826(?:\s*\/\s*\d{2,4})?|estatuto\s+do\s+desarmamento)\b/i, key: 'LEI_10826', label: 'Lei 10.826/03 (Desarmamento)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?13\.?869(?:\s*\/\s*\d{2,4})?|abuso\s+de\s+autoridade)\b/i, key: 'LEI_13869', label: 'Lei 13.869/19 (Abuso de Autoridade)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?8\.?112(?:\s*\/\s*\d{2,4})?)\b/i, key: 'LEI_8112', label: 'Lei 8.112/90 (Servidores Públicos)', cat: 'Administrativo' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?8\.?429(?:\s*\/\s*\d{2,4})?|improbidade\s+administrativa)\b/i, key: 'LEI_8429', label: 'Lei 8.429/92 (Improbidade)', cat: 'Administrativo' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?14\.?133(?:\s*\/\s*\d{2,4})?)\b/i, key: 'LEI_14133', label: 'Lei 14.133/21 (Licitações)', cat: 'Administrativo' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?9\.?784(?:\s*\/\s*\d{2,4})?)\b/i, key: 'LEI_9784', label: 'Lei 9.784/99 (Processo Administrativo)', cat: 'Administrativo' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?12\.?850(?:\s*\/\s*\d{2,4})?|organiza[çc][õo]es\s+criminosas)\b/i, key: 'LEI_12850', label: 'Lei 12.850/13 (Org. Criminosas)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?9\.?455(?:\s*\/\s*\d{2,4})?|crime[s]?\s+de\s+tortura)\b/i, key: 'LEI_9455', label: 'Lei 9.455/97 (Lei de Tortura)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?8\.?072(?:\s*\/\s*\d{2,4})?|crimes?\s+hediondos?)\b/i, key: 'LEI_8072', label: 'Lei 8.072/90 (Crimes Hediondos)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?11\.?340(?:\s*\/\s*\d{2,4})?|maria\s+da\s+penha)\b/i, key: 'LEI_11340', label: 'Lei 11.340/06 (Maria da Penha)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?9\.?099(?:\s*\/\s*\d{2,4})?|juizados?\s+especiais?)\b/i, key: 'LEI_9099', label: 'Lei 9.099/95 (JECRIM)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?9\.?605(?:\s*\/\s*\d{2,4})?|crimes?\s+ambientais?)\b/i, key: 'LEI_9605', label: 'Lei 9.605/98 (Crimes Ambientais)', cat: 'Leg. Especial' },
      { regex: /\b(?:lei\s*(?:n[º°.]?\s*)?8\.?069(?:\s*\/\s*\d{2,4})?|\beca\b|estatuto\s+da\s+crian[çc]a)\b/i, key: 'LEI_8069', label: 'Lei 8.069/90 (ECA)', cat: 'Leg. Especial' },
      { regex: /\b(?:decreto\s*(?:n[º°.]?\s*)?1\.?171(?:\s*\/\s*\d{2,4})?)\b/i, key: 'DEC_1171', label: 'Decreto 1.171/94 (Ética)', cat: 'Ética' }
    ];

    blockScopedQuestions.forEach(q => {
      const fullText = `${q.subject || ''} ${q.topic || ''} ${q.content || ''} ${q.teacherComment || ''} ${q.userNote || ''}`;
      const shortContext = q.canonicalSubject || q.subject || 'Lei Seca';

      KNOWN_LAWS.forEach(law => {
        if (law.regex.test(fullText)) {
          registerDevice(law.key, law.label, law.cat, q);
        }
      });

      const genericLawMatches = fullText.matchAll(/\blei(?:\s+complementar|\s+estadual|\s+federal)?\s*(?:n[º°.]?\s*)?(\d{1,2}\.?\d{3}(?:\s*\/\s*\d{2,4})?)/gi);
      for (const m of genericLawMatches) {
        const rawNum = m[1].replace(/\s+/g, '');
        const cleanDigits = rawNum.split('/')[0].replace(/\D/g, '');
        const alreadyKnown = KNOWN_LAWS.some(kl => kl.key.endsWith(cleanDigits));
        if (!alreadyKnown && cleanDigits.length >= 3) {
          registerDevice(`LEI_${cleanDigits}`, `Lei ${rawNum} • ${shortContext}`, 'Lei Seca', q);
        }
      }

      const artMatches = fullText.matchAll(/\bart(?:igo)?\.?\s*(\d{1,4})(?:\s*[º°]|-[A-Za-z])?/gi);
      for (const m of artMatches) {
        const artNum = m[1];
        const key = `ART_${artNum}_${shortContext}`;
        registerDevice(key, `Art. ${artNum} • ${shortContext}`, 'Artigo', q);
      }

      const resMatches = fullText.matchAll(/\bresolu[çc][ãa]o(?:\s+do)?(?:\s+contran)?\s*(?:n[º°.]?\s*)?(\d{2,4}(?:\s*\/\s*\d{2,4})?)/gi);
      for (const m of resMatches) {
        const resNum = m[1].replace(/\s+/g, '');
        registerDevice(`RES_CONTRAN_${resNum}`, `Resolução CONTRAN ${resNum}`, 'CONTRAN', q);
      }

      const sumMatches = fullText.matchAll(/\bs[úu]mula\s*(vinculante)?\s*(?:n[º°.]?\s*)?(\d{1,4})/gi);
      for (const m of sumMatches) {
        const isVinc = Boolean(m[1]);
        const sumNum = m[2];
        const key = isVinc ? `SUM_VINC_${sumNum}` : `SUM_${sumNum}`;
        const label = isVinc ? `Súmula Vinculante ${sumNum}` : `Súmula ${sumNum} • ${shortContext}`;
        registerDevice(key, label, 'Súmula', q);
      }
    });

    return Object.values(deviceMap)
      .map(d => ({
        ...d,
        questionIds: Array.from(d.questionIds),
        criticalScore: d.errors * 3 + d.guessesOrDoubts * 2 + d.total
      }))
      .sort((a, b) => b.errors - a.errors || b.guessesOrDoubts - a.guessesOrDoubts || b.total - a.total);
  }, [blockScopedQuestions]);

  // Relatório Tático de Assuntos Mais Errados vs Mais Acertados
  const topicRankings = useMemo(() => {
    let source = blockScopedQuestions;
    if (topicReportScope === 'fps') {
      source = blockScopedQuestions.filter(q => q.source?.includes('Duelo FPS') || q.origin?.includes('FPS') || q.id?.startsWith('fps-'));
    } else if (topicReportScope === 'bloco2') {
      source = blockScopedQuestions.filter(q => q.bloco === 'Bloco II');
    }

    const map = {};
    source.forEach(q => {
      const topicLabel = getQuestionTopicLabel(q);

      const key = `${q.canonicalSubject || q.subject || 'Outras'}|||${topicLabel}`;
      if (!map[key]) {
        map[key] = {
          key,
          subject: q.canonicalSubject || q.subject || 'Outras',
          topic: topicLabel,
          bloco: q.bloco || 'Bloco I',
          total: 0,
          hits: 0,
          errors: 0,
          totalTime: 0,
          fpsCount: 0
        };
      }
      const t = map[key];
      t.total += 1;
      t.totalTime += (q.durationSeconds || 0);
      if (q.hit) t.hits += 1;
      else t.errors += 1;

      if (q.source?.includes('Duelo FPS') || q.id?.startsWith('fps-')) {
        t.fpsCount += 1;
      }
    });

    const allTopics = Object.values(map).map(t => {
      const grossPercent = t.total > 0 ? Math.round((t.hits / t.total) * 100) : 0;
      const errorPercent = 100 - grossPercent;
      const avgTime = t.total > 0 ? Math.round(t.totalTime / t.total) : 0;
      return {
        ...t,
        grossPercent,
        errorPercent,
        avgTime
      };
    });

    const mostErrored = [...allTopics]
      .filter(t => t.errors > 0)
      .sort((a, b) => b.errors - a.errors || b.errorPercent - a.errorPercent);

    const mostHit = [...allTopics]
      .filter(t => t.hits > 0)
      .sort((a, b) => b.hits - a.hits || b.grossPercent - a.grossPercent);

    const fpsCount = enrichedQuestions.filter(q => q.source?.includes('Duelo FPS') || q.id?.startsWith('fps-')).length;
    const bloco2Count = enrichedQuestions.filter(q => q.bloco === 'Bloco II').length;

    const criticalCount = allTopics.filter(t => t.errors > 0 && t.grossPercent < 60).length;
    const shieldedCount = allTopics.filter(t => t.hits >= 1 && t.grossPercent >= 75).length;

    return {
      totalScoped: source.length,
      fpsCount,
      bloco2Count,
      mostErrored,
      mostHit,
      criticalCount,
      shieldedCount
    };
  }, [blockScopedQuestions, enrichedQuestions, topicReportScope]);

  // Estatísticas derivadas: Superação (#73), Erros Evitáveis & Pegadinhas (#12), Mapa de Esquecimento (#63), Tabela Decoreba (#74)
  const overcomingStats = useMemo(() => computeOvercomingStats(blockScopedQuestions), [blockScopedQuestions]);
  const avoidableCount = useMemo(
    () => blockScopedQuestions.filter(q => q.isAvoidableError || (!q.hit && Number(q.communityCorrectPct) >= 65)).length,
    [blockScopedQuestions]
  );
  const pegadinhaCount = useMemo(
    () => blockScopedQuestions.filter(q => q.isPegadinha || Number(q.communityErrorPct) >= 65).length,
    [blockScopedQuestions]
  );
  const forgettingCurveRows = useMemo(
    () => computeForgettingCurveByDiscipline(blockScopedQuestions),
    [blockScopedQuestions]
  );
  const decorebaRows = useMemo(
    () => extractPrfMemorizationRows(blockScopedQuestions),
    [blockScopedQuestions]
  );
  const filteredDecorebaRows = useMemo(() => {
    const qLower = decorebaSearch.trim().toLowerCase();
    return decorebaRows.filter(row => {
      if (decorebaCategory !== 'Todos' && row.category !== decorebaCategory) return false;
      if (qLower) {
        const hay = `${row.highlight} ${row.snippet} ${row.subject} ${row.questionId}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [decorebaRows, decorebaCategory, decorebaSearch]);

  const trapFingerprint = useMemo(
    () => buildTrapFingerprint(blockScopedQuestions),
    [blockScopedQuestions]
  );

  // Lista de Questões Filtrada para o Caderno Tático
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return blockScopedQuestions.filter(q => {
      if (selectedLegalDevice && !selectedLegalDevice.questionIds.includes(q.id)) return false;
      if (selectedTrapTerm && !selectedTrapTerm.questionIds.includes(q.id)) return false;
      if (selectedSubject !== 'all' && q.canonicalSubject !== selectedSubject) return false;
      if (selectedTopic !== 'all') {
        const topicLabel = getQuestionTopicLabel(q);
        if (topicLabel !== selectedTopic) return false;
      }
      if (selectedDifficulty !== 'all') {
        const diff = classifyQuestionDifficulty(q);
        if (!diff || String(diff.id) !== String(selectedDifficulty)) return false;
      }

      if (filterType === 'errors' && q.hit) return false;
      if (filterType === 'hits' && !q.hit) return false;
      if (filterType === 'guesses' && q.confidence !== 'chute' && q.confidence !== 'duvida') return false;
      if (filterType === 'avoidable' && !(q.isAvoidableError || (!q.hit && Number(q.communityCorrectPct) >= 65))) return false;
      if (filterType === 'pegadinha' && !(q.isPegadinha || Number(q.communityErrorPct) >= 65)) return false;
      if (filterType === 'attention' && (q.hit || normalizeErrorReason(q.errorReason) !== 'leitura')) return false;
      if (filterType === 'interpretation' && (q.hit || normalizeErrorReason(q.errorReason) !== 'pegadinha')) return false;
      if (filterType === 'theory' && (q.hit || normalizeErrorReason(q.errorReason) !== 'base')) return false;
      if (ERROR_CAUSES.some(c => c.filterId === filterType)) {
        const expectedId = filterType.replace(/^cause_/, '');
        if (q.hit || normalizeErrorReason(q.errorReason) !== expectedId) return false;
      }

      if (query) {
        const hay = `${q.id} ${q.canonicalSubject} ${q.subject} ${q.topic} ${q.content} ${q.userNote || ''} ${q.teacherComment || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });
    }, [blockScopedQuestions, selectedLegalDevice, selectedTrapTerm, selectedSubject, selectedTopic, selectedDifficulty, filterType, searchQuery]);

  const handleRequestSync = () => {
    const activeUserId = useStore.getState().user?.id;
    if (!activeUserId) return;
    window.postMessage({ source: 'QG_WEB_APP', type: 'FETCH_CAVEIRA_DATA', payload: { userId: activeUserId } }, window.location.origin);
    toast.info('Sincronizando questões com a extensão...');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      const list = rawList.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
      if (list.length === 0) {
        toast.error('Nenhuma questão válida encontrada no JSON.');
        return;
      }
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
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      const list = rawList.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
      if (list.length === 0) {
        toast.error('Nenhuma questão válida encontrada na área de transferência.');
        return;
      }
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

  const toggleComment = (qId) => {
    setExpandedComments(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const hasActiveFilters = selectedBloco !== 'all' || selectedSubject !== 'all' || selectedTopic !== 'all' || selectedDifficulty !== 'all' || filterType !== 'all' || Boolean(searchQuery) || Boolean(selectedLegalDevice) || Boolean(selectedTrapTerm);

  const resetAllFilters = () => {
    setSelectedBloco('all');
    setSelectedSubject('all');
    setSelectedTopic('all');
    setSelectedDifficulty('all');
    setFilterType('all');
    setSearchQuery('');
    setSelectedLegalDevice(null);
    setSelectedTrapTerm(null);
  };

  const triggerCriticalTopicPractice = (subjectName = '', topicsList = [], questionStatus = 'not_resolved', difficultyIds = null) => {
    const cleanTopics = (Array.isArray(topicsList) ? topicsList : [topicsList])
      .map(t => String(t || '').trim())
      .filter(Boolean);
    const primaryTopic = cleanTopics[0] || '';
    const subtopics = cleanTopics.flatMap(t =>
      t.split(/\s*(?:➔|->|•|\|)\s*/).map(s => s.trim()).filter(Boolean)
    );
    const uniqueSubtopics = Array.from(new Set(subtopics.length > 0 ? subtopics : cleanTopics));
    const recommendation = recommendDifficultyForTopic(caveiraQuestions, subjectName, primaryTopic, cleanTopics);
    const cleanDifficultyIds = Array.isArray(difficultyIds)
      ? sanitizeDifficultyIds(difficultyIds)
      : resolveEffectiveDifficultyIds(caveiraQuestionPrefs, recommendation);
    const hasCustomQgPrefs = Boolean(caveiraQuestionPrefs && Number(caveiraQuestionPrefs.updatedAt) > 0);
    const hasExt = typeof document !== 'undefined' && document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true';
    if (navigator.clipboard && (uniqueSubtopics[0] || primaryTopic || subjectName)) {
      navigator.clipboard.writeText(uniqueSubtopics[0] || primaryTopic || subjectName).catch(() => {});
    }
    if (hasExt) {
      window.postMessage({
        source: 'QG_WEB_APP',
        type: 'OPEN_CAVEIRA_PRACTICE',
        payload: {
          subject: subjectName,
          lessons: cleanTopics,
          topic: cleanTopics.slice(0, 3).join(' • '),
          fallbackTopic: primaryTopic,
          subtopics: uniqueSubtopics,
          rawIndexText: uniqueSubtopics.map((s, idx) => `${idx + 1}. ${s}`).join('\n'),
          status: questionStatus,
          difficultyIds: cleanDifficultyIds,
          ...(hasCustomQgPrefs
            ? {
                examBoards: Array.isArray(caveiraQuestionPrefs.examBoards) ? caveiraQuestionPrefs.examBoards : [],
                numberAlternatives: Array.isArray(caveiraQuestionPrefs.numberAlternatives) ? caveiraQuestionPrefs.numberAlternatives : [],
              }
            : {})
        }
      }, window.location.origin);
      const statusTag = questionStatus === 'wrong' ? ' (só erradas)' : questionStatus === 'right' ? ' (só certas)' : '';
      const diffLabel = formatDifficultyIdsLabel(cleanDifficultyIds);
      const diffTag = diffLabel
        ? caveiraQuestionPrefs?.difficultyMode === 'auto' && !Array.isArray(difficultyIds)
          ? ` (⚡ Auto: ${diffLabel})`
          : ` (${diffLabel})`
        : '';
      toast.success(`Abrindo Caveira${statusTag}${diffTag} na Zona Crítica: ${cleanTopics.slice(0, 2).join(' • ')}`);
    } else {
      window.open('https://app.caveira.com/questions', '_blank', 'noopener');
      toast.info('Extensão não detectada nesta aba. Assunto crítico copiado para a área de transferência!');
    }
  };

  const handleNavigateTab = (tab) => {
    if (tab === 'diagnostics') setInspectedDiscipline(null);
    setActiveTab(tab);
  };

  const handleInspectDiscipline = (disciplineName) => {
    setInspectedDiscipline(disciplineName);
    setActiveTab('diagnostics');
  };

  const handleOpenNotebookWithFilter = ({
    subject,
    topic,
    filterType: nextFilterType,
    searchQuery: nextSearch,
    legalDevice,
    trapTerm
  } = {}) => {
    setSelectedSubject(subject !== undefined ? subject : 'all');
    setSelectedTopic(topic !== undefined ? topic : 'all');
    setSelectedLegalDevice(legalDevice !== undefined ? legalDevice : null);
    setSelectedTrapTerm(trapTerm !== undefined ? trapTerm : null);
    if (nextFilterType !== undefined) setFilterType(nextFilterType);
    if (nextSearch !== undefined) setSearchQuery(nextSearch);
    else if (legalDevice || trapTerm || topic || subject) setSearchQuery('');
    setActiveTab('notebook');
  };

  const workspaceTabs = [
    {
      id: 'overview',
      label: 'Resumo',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      count: stats.total > 0 ? `${stats.grossRate}%` : null
    },
    {
      id: 'diagnostics',
      label: 'Disciplinas & Assuntos',
      icon: <Target className="w-3.5 h-3.5" />,
      count: `${subjectGroups.length}`
    },
    {
      id: 'intelligence',
      label: 'Lei Seca & Retenção',
      icon: <Scale className="w-3.5 h-3.5" />,
      count: legalRadarList.length > 0 ? `${legalRadarList.length}` : null
    },
    {
      id: 'notebook',
      label: 'Caderno',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      count: `${filteredQuestions.length}`
    }
  ];

  return (
    <div className="fade-in w-full pb-12 font-sans space-y-5">
      {/* CABEÇALHO LIMPO + NAVEGAÇÃO DIRETA + FILTRO DE BLOCO */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/60 flex items-center justify-center shrink-0">
              <Skull className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Raio-X Caveira
                </h1>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span
                  className={`text-xs font-semibold ${
                    extensionDetected
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {extensionDetected ? 'Extensão conectada' : 'Extensão desconectada'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Diagnóstico de questões Cebraspe, pontos fracos por assunto, lei seca e caderno de revisão.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {extensionDetected ? (
              <button
                type="button"
                onClick={handleRequestSync}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowInstallModal(true)}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ativar extensão</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Importar questões via JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar JSON</span>
            </button>

            {caveiraQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  useStore.getState().setGlobalModal({
                    type: 'confirm',
                    variant: 'danger',
                    title: 'Limpar Histórico do Caveira?',
                    message: 'Esta ação removerá todas as questões sincronizadas do Raio-X Caveira e seus respectivos cartões FSRS.',
                    confirmText: 'Limpar tudo',
                    onConfirm: () => clearCaveiraQuestions()
                  });
                }}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center justify-center transition-colors cursor-pointer"
                title="Limpar histórico do Caveira"
                aria-label="Limpar histórico do Caveira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Nível Padrão do Caveira (5 níveis oficiais + Auto) */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/35 dark:bg-slate-950/20 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Nível padrão para praticar no Caveira
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 ml-2">
              Sincronizado com a extensão e aulas
            </span>
          </div>
          <CaveiraDifficultySelector
            compact
            mode={caveiraQuestionPrefs?.difficultyMode || 'manual'}
            onChangeMode={(nextMode, nextIds) => {
              setCaveiraQuestionPrefs?.({
                difficultyMode: nextMode,
                ...(Array.isArray(nextIds) ? { difficultyIds: nextIds } : {}),
              });
            }}
            selectedIds={caveiraQuestionPrefs?.difficultyIds || []}
            onChangeIds={(nextIds) => setCaveiraQuestionPrefs?.({ difficultyMode: 'manual', difficultyIds: nextIds })}
            includeUndefined={Boolean(caveiraQuestionPrefs?.includeUndefined)}
            onChangeIncludeUndefined={(val) => setCaveiraQuestionPrefs?.({ includeUndefined: val })}
          />
        </div>

        {/* Barra Integrada de Seções + Escopo de Bloco PRF */}
        {caveiraQuestions.length > 0 && (
          <div className="px-4 sm:px-6 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/35 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <nav
              aria-label="Seções do Raio-X Caveira"
              className="flex items-center gap-1 overflow-x-auto no-scrollbar"
            >
              {workspaceTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleNavigateTab(tab.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count && (
                      <span className="font-mono text-[11px] opacity-70 tabular-nums">
                        ({tab.count})
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Seletor Compacto de Bloco PRF */}
            <div className="flex items-center gap-2 self-start xl:self-auto">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBloco('all');
                    setSelectedSubject('all');
                    setSelectedTopic('all');
                  }}
                  className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedBloco === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos
                </button>

                {blocoStats.map((b) => {
                  const isSelected = selectedBloco === b.blocoKey;
                  const shortCode = b.blocoKey === 'Bloco I' ? 'B1' : b.blocoKey === 'Bloco II' ? 'B2' : 'B3';
                  return (
                    <button
                      key={b.blocoKey}
                      type="button"
                      onClick={() => {
                        setSelectedBloco(isSelected ? 'all' : b.blocoKey);
                        setSelectedSubject('all');
                        setSelectedTopic('all');
                      }}
                      title={b.subtitle}
                      className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{shortCode}</span>
                      {b.total > 0 && (
                        <span
                          className={`font-mono text-[10px] tabular-nums ${
                            b.grossRate >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : b.grossRate >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {b.grossRate}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-7 px-2 rounded-md text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Limpar todos os filtros ativos"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ESTADO VAZIO (ONBOARDING TÁTICO) */}
      {caveiraQuestions.length === 0 ? (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto">
            <Skull className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Conecte seu Projeto Caveira ao QG da PRF
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Cada questão respondida no Projeto Caveira ou no Duelo FPS é classificada automaticamente nos 3 blocos do edital PRF, gerando saldo Cebraspe, radar de lei seca, curva de esquecimento e caderno de erros.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {extensionDetected ? (
              <button
                type="button"
                onClick={handleRequestSync}
                className="h-10 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sincronizar questões agora</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowInstallModal(true)}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Instalar extensão no Chrome</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="h-10 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar backup JSON</span>
            </button>
            <a
              href="#/duelo"
              className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition-colors"
            >
              <Crosshair className="w-4 h-4" />
              <span>Jogar Duelo FPS</span>
            </a>
          </div>
        </section>
      ) : (
        /* WORKSPACE ATIVO */
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14 }}
          >
            {activeTab === 'overview' && (
              <RaioXOverview
                stats={stats}
                blocoStats={blocoStats}
                selectedBloco={selectedBloco}
                onSelectBloco={(blocoKey) => {
                  setSelectedBloco(blocoKey);
                  setSelectedSubject('all');
                  setSelectedTopic('all');
                }}
                subjectGroups={subjectGroups}
                topicRankings={topicRankings}
                legalRadarList={legalRadarList}
                overcomingStats={overcomingStats}
                avoidableCount={avoidableCount}
                pegadinhaCount={pegadinhaCount}
                forgettingCurveRows={forgettingCurveRows}
                decorebaRows={decorebaRows}
                trapFingerprint={trapFingerprint}
                formatDurationHMS={formatDurationHMS}
                onTriggerPractice={triggerCriticalTopicPractice}
                onOpenNotebookWithFilter={handleOpenNotebookWithFilter}
                onNavigateTab={handleNavigateTab}
                onInspectDiscipline={handleInspectDiscipline}
              />
            )}

            {activeTab === 'diagnostics' && (
              <RaioXDiagnostics
                key={inspectedDiscipline || 'ranking'}
                initialDiscipline={inspectedDiscipline}
                enrichedQuestions={enrichedQuestions}
                subjectGroups={subjectGroups}
                topicRankings={topicRankings}
                topicReportScope={topicReportScope}
                setTopicReportScope={setTopicReportScope}
                blocoMetadata={BLOCO_METADATA}
                onTriggerPractice={triggerCriticalTopicPractice}
                onOpenNotebookWithFilter={handleOpenNotebookWithFilter}
              />
            )}

            {activeTab === 'intelligence' && (
              <RaioXIntelligence
                forgettingCurveRows={forgettingCurveRows}
                legalRadarList={legalRadarList}
                selectedLegalDevice={selectedLegalDevice}
                decorebaRows={decorebaRows}
                filteredDecorebaRows={filteredDecorebaRows}
                decorebaCategory={decorebaCategory}
                setDecorebaCategory={setDecorebaCategory}
                decorebaSearch={decorebaSearch}
                setDecorebaSearch={setDecorebaSearch}
                trapFingerprint={trapFingerprint}
                onOpenNotebookWithFilter={handleOpenNotebookWithFilter}
              />
            )}

            {activeTab === 'notebook' && (
              <RaioXNotebook
                filteredQuestions={filteredQuestions}
                blockScopedQuestions={blockScopedQuestions}
                subjectGroups={subjectGroups}
                stats={stats}
                avoidableCount={avoidableCount}
                pegadinhaCount={pegadinhaCount}
                blocoMetadata={BLOCO_METADATA}
                caveiraCourseIndexMap={caveiraCourseIndexMap}
                subjects={subjects}
                findCourseVideoMatch={findCourseVideoMatch}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                selectedTopic={selectedTopic}
                setSelectedTopic={setSelectedTopic}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                selectedLegalDevice={selectedLegalDevice}
                setSelectedLegalDevice={setSelectedLegalDevice}
                selectedTrapTerm={selectedTrapTerm}
                setSelectedTrapTerm={setSelectedTrapTerm}
                trapFingerprint={trapFingerprint}
                onTriggerPractice={triggerCriticalTopicPractice}
                editingNoteId={editingNoteId}
                setEditingNoteId={setEditingNoteId}
                noteDraft={noteDraft}
                setNoteDraft={setNoteDraft}
                expandedComments={expandedComments}
                toggleComment={toggleComment}
                handleSaveNote={handleSaveNote}
                updateCaveiraQuestion={updateCaveiraQuestion}
                createFsrsCardFromCaveira={createFsrsCardFromCaveira}
                deleteCaveiraQuestion={deleteCaveiraQuestion}
                resetAllFilters={resetAllFilters}
              />
            )}
          </motion.div>
      )}

      {/* MODAL DE INSTALAÇÃO DA EXTENSÃO (LIGHT + DARK) */}
      <AnimatePresence>
        {showInstallModal && (
          <div
            onClick={() => setShowInstallModal(false)}
            className="fixed inset-0 z-[150] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                aria-label="Fechar modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/12 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Instalar extensão no Chrome
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ativação em menos de 30 segundos
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px] shrink-0 font-mono font-bold">1</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-900 dark:text-white font-semibold mb-0.5">Abra as extensões do navegador</p>
                    <p className="text-slate-500 dark:text-slate-400">Digite na barra de endereços do Chrome ou Edge:</p>
                    <code className="text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded text-[11px] block mt-1.5 select-all font-mono">
                      chrome://extensions
                    </code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px] shrink-0 font-mono font-bold">2</span>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold mb-0.5">Ative o &quot;Modo do desenvolvedor&quot;</p>
                    <p className="text-slate-500 dark:text-slate-400">Localizado no canto superior direito da página de extensões.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px] shrink-0 font-mono font-bold">3</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-900 dark:text-white font-semibold mb-0.5">Clique em &quot;Carregar sem compactação&quot;</p>
                    <p className="text-slate-500 dark:text-slate-400 mb-1.5">Selecione a pasta raiz da extensão:</p>
                    <div className="flex items-center gap-1.5">
                      <code className="text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded text-[11px] truncate block font-mono flex-1">
                        C:\Users\wilso\Downloads\teste\extensao PC
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('C:\\Users\\wilso\\Downloads\\teste\\extensao PC');
                          setCopiedExtensionPath(true);
                          setTimeout(() => setCopiedExtensionPath(false), 2000);
                        }}
                        className="h-7 w-7 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-md inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Copiar caminho da pasta"
                      >
                        {copiedExtensionPath ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  className="h-9 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE IMPORTAÇÃO JSON (LIGHT + DARK) */}
      <AnimatePresence>
        {showImportModal && (
          <div
            onClick={() => setShowImportModal(false)}
            className="fixed inset-0 z-[150] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                aria-label="Fechar modal"
                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">
                Importar questões (JSON)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Cole aqui o JSON gerado no popup da extensão ou arquivo de backup:
              </p>

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="[ { id: 'Q111494', ... } ]"
                rows={8}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="h-9 px-3 rounded-lg bg-amber-500/12 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-500/30 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Colar do clipboard</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="h-9 px-4 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImportJson}
                    className="h-9 px-5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 font-semibold text-xs cursor-pointer"
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
