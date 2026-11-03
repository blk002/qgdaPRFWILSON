import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Target, AlertTriangle, ShieldCheck, TrendingUp, Clock, 
  RefreshCw, Download, Upload, Trash2, CheckCircle2, XCircle,
  BookOpen, ChevronDown, ChevronUp, Copy, Check,
  BrainCircuit, Skull, Search, MessageSquarePlus, Save, Scale, Layers, Sparkles
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
    short: 'B-I',
    title: 'Bloco I • Básicas',
    subtitle: 'Português, RLM, Informática, Física, Ética, Geopolítica e Língua Estrangeira',
    examWeight: '55 itens',
    badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    activeClass: 'bg-sky-600 text-white border-sky-500 shadow-sm',
    accentBorder: 'border-sky-500/40'
  },
  'Bloco II': {
    short: 'B-II',
    title: 'Bloco II • Trânsito',
    subtitle: 'Código de Trânsito Brasileiro (CTB) e Resoluções do CONTRAN',
    examWeight: '30 itens',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    activeClass: 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm',
    accentBorder: 'border-amber-500/40'
  },
  'Bloco III': {
    short: 'B-III',
    title: 'Bloco III • Direito',
    subtitle: 'Penal, Processo Penal, Leg. Especial, Constitucional, Administrativo e DH',
    examWeight: '35 itens',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    activeClass: 'bg-purple-600 text-white border-purple-500 shadow-sm',
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
  const [filterType, setFilterType] = useState('all'); // 'all' | 'errors' | 'hits' | 'guesses' | 'attention' | 'theory'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copiedExtensionPath, setCopiedExtensionPath] = useState(false);
  const [selectedLegalDevice, setSelectedLegalDevice] = useState(null);

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
        guessesOrDoubtsTotal: 0,
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

    const guessesOrDoubtsTotal = list.filter(q => q.confidence === 'chute' || q.confidence === 'duvida').length;

    const errorReasons = {
      conteudo: errorList.filter(q => !q.errorReason || q.errorReason === 'conteudo').length,
      atencao: errorList.filter(q => q.errorReason === 'atencao').length,
      interpretacao: errorList.filter(q => q.errorReason === 'interpretacao').length
    };

    return {
      total, hits, errors, netScore, grossRate, netRate,
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

      const topicLabel = (q.topic && q.topic !== q.subject)
        ? q.topic
        : (q.topic || q.subject || 'Geral');

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

  // Lista de Questões Filtrada para o Caderno Tático
  const filteredQuestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return blockScopedQuestions.filter(q => {
      if (selectedLegalDevice && !selectedLegalDevice.questionIds.includes(q.id)) return false;
      if (selectedSubject !== 'all' && q.canonicalSubject !== selectedSubject) return false;
      if (selectedTopic !== 'all') {
        const topicLabel = (q.topic && q.topic !== q.subject)
          ? q.topic
          : (q.topic || q.subject || 'Geral');
        if (topicLabel !== selectedTopic) return false;
      }

      if (filterType === 'errors' && q.hit) return false;
      if (filterType === 'hits' && !q.hit) return false;
      if (filterType === 'guesses' && q.confidence !== 'chute' && q.confidence !== 'duvida') return false;
      if (filterType === 'attention' && (q.hit || q.errorReason !== 'atencao')) return false;
      if (filterType === 'theory' && (q.hit || (q.errorReason && q.errorReason !== 'conteudo'))) return false;

      if (query) {
        const hay = `${q.id} ${q.canonicalSubject} ${q.subject} ${q.topic} ${q.content} ${q.userNote || ''} ${q.teacherComment || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });
  }, [blockScopedQuestions, selectedLegalDevice, selectedSubject, selectedTopic, filterType, searchQuery]);

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

  const toggleComment = (qId) => {
    setExpandedComments(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const hasActiveFilters = selectedBloco !== 'all' || selectedSubject !== 'all' || selectedTopic !== 'all' || filterType !== 'all' || Boolean(searchQuery) || Boolean(selectedLegalDevice);

  const resetAllFilters = () => {
    setSelectedBloco('all');
    setSelectedSubject('all');
    setSelectedTopic('all');
    setFilterType('all');
    setSearchQuery('');
    setSelectedLegalDevice(null);
  };

  const handleResetAll = () => {
    if (caveiraQuestions.length === 0) return;
    useStore.getState().setGlobalModal({
      title: 'Zerar Questões Resolvidas?',
      message: 'Esta ação removerá todas as questões resolvidas do histórico do Raio-X Caveira.',
      onConfirm: () => clearCaveiraQuestions()
    });
  };

  const handleResetHits = () => {
    if (stats.hits === 0) return;
    useStore.getState().setGlobalModal({
      title: 'Zerar Acertos?',
      message: `Deseja zerar os ${stats.hits} acertos registrados no histórico?`,
      onConfirm: () => {
        const remaining = caveiraQuestions.filter(q => {
          const classified = classifyPRFCategory(q.subject, q.topic, q.content);
          const qBloco = q.bloco || classified.bloco;
          if (selectedBloco !== 'all' && qBloco !== selectedBloco) return true;
          return !q.hit;
        });
        useStore.setState({ caveiraQuestions: remaining });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(remaining)); } catch (_) {}
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'REPLACE_CAVEIRA_QUESTIONS', payload: { questions: remaining } }, '*'); } catch (_) {}
        toast.info('Acertos zerados.');
      }
    });
  };

  const handleResetErrors = () => {
    if (stats.errors === 0) return;
    useStore.getState().setGlobalModal({
      title: 'Zerar Erros?',
      message: `Deseja zerar os ${stats.errors} erros registrados no histórico?`,
      onConfirm: () => {
        const remaining = caveiraQuestions.filter(q => {
          const classified = classifyPRFCategory(q.subject, q.topic, q.content);
          const qBloco = q.bloco || classified.bloco;
          if (selectedBloco !== 'all' && qBloco !== selectedBloco) return true;
          return Boolean(q.hit);
        });
        useStore.setState({ caveiraQuestions: remaining });
        try { localStorage.setItem('prf_caveira_questions', JSON.stringify(remaining)); } catch (_) {}
        try { window.postMessage({ source: 'QG_WEB_APP', type: 'REPLACE_CAVEIRA_QUESTIONS', payload: { questions: remaining } }, '*'); } catch (_) {}
        toast.info('Erros zerados.');
      }
    });
  };

  return (
    <div className="fade-in w-full pb-12 font-sans space-y-4">

      {/* 1. BARRA EXECUTIVA DE COMANDO + SELETOR DE BLOCOS INTEGRADO */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-[#2E3236] shadow-lg space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Título e Status da Extensão */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-red-950 border border-red-500/40 flex items-center justify-center text-xl shadow-sm shrink-0">
              💀
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  Raio-X Projeto Caveira
                </h1>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  extensionDetected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${extensionDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {extensionDetected ? 'Sincronizado' : 'Extensão Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A0AAB2]">
                Diagnóstico tático de questões, disciplinas, artigos de lei e caderno de erros.
              </p>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            {extensionDetected ? (
              <button
                onClick={handleRequestSync}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
              </button>
            ) : (
              <button
                onClick={() => setShowInstallModal(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Ativar Extensão
              </button>
            )}

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#26292C] hover:bg-slate-200 dark:hover:bg-[#32363A] text-slate-700 dark:text-slate-200 font-bold text-xs uppercase px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#383C42] transition-all cursor-pointer"
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
                className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition-all cursor-pointer"
                title="Limpar histórico do Caveira"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SELETOR DE BLOCOS DO EDITAL PRF (INTEGRADO E CONCISO) */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-[#2E3236] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedBloco('all');
                setSelectedSubject('all');
                setSelectedTopic('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                selectedBloco === 'all'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-[#1E2022] text-slate-600 dark:text-[#A0AAB2] border-slate-200 dark:border-[#32363A] hover:text-white'
              }`}
            >
              Todos os Blocos ({enrichedQuestions.length})
            </button>

            {blocoStats.map(b => {
              const isSelected = selectedBloco === b.blocoKey;
              return (
                <button
                  key={b.blocoKey}
                  type="button"
                  onClick={() => {
                    setSelectedBloco(isSelected ? 'all' : b.blocoKey);
                    setSelectedSubject('all');
                    setSelectedTopic('all');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                    isSelected
                      ? b.activeClass
                      : 'bg-slate-100 dark:bg-[#1E2022] text-slate-700 dark:text-[#F1F5F9] border-slate-200 dark:border-[#32363A] hover:border-slate-500'
                  }`}
                >
                  <span className="uppercase">{b.title}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-black ${
                    isSelected
                      ? 'bg-black/20 text-current'
                      : b.total === 0
                      ? 'bg-slate-200 dark:bg-[#26292C] text-slate-400'
                      : b.grossRate >= 75
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : b.grossRate >= 50
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {b.total > 0 ? `${b.grossRate}% (${b.hits}C/${b.errors}E)` : '0q'}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-bold uppercase text-amber-400 hover:underline cursor-pointer px-2 py-1"
            >
              Limpar Filtros Ativos ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. FAIXA DE INDICADORES (MODELO PROJETO CAVEIRA: RESOLVIDAS • ACERTOS • ERROS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Questões Resolvidas */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] text-center flex flex-col items-center justify-center space-y-1">
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-[#F1F5F9]">
            Questões Resolvidas
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {stats.total}
          </span>
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer pt-0.5"
          >
            Zerar
          </button>
        </div>

        {/* Card 2: Acertos */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] text-center flex flex-col items-center justify-center space-y-1">
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-[#F1F5F9]">
            Acertos
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-500 leading-tight">
            {stats.hits}
          </span>
          <button
            type="button"
            onClick={handleResetHits}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer pt-0.5"
          >
            Zerar
          </button>
        </div>

        {/* Card 3: Erros */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] text-center flex flex-col items-center justify-center space-y-1">
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-[#F1F5F9]">
            Erros
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-red-500 leading-tight">
            {stats.errors}
          </span>
          <button
            type="button"
            onClick={handleResetErrors}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline cursor-pointer pt-0.5"
          >
            Zerar
          </button>
        </div>
      </div>

      {/* 3. PAINÉIS ANALÍTICOS LADO A LADO: DISCIPLINAS (ESQUERDA) + RADAR DE LEI SECA (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

        {/* COLUNA ESQUERDA: DESEMPENHO POR DISCIPLINA (LISTA HORIZONTAL DE ALTA LEITURA) */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/70 dark:border-[#2E3236]">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> Desempenho por Disciplina ({subjectGroups.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#A0AAB2]">
                  Ordenado da matéria mais crítica para a mais forte. Clique para ver os tópicos.
                </p>
              </div>
              {selectedSubject !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('all');
                    setSelectedTopic('all');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold uppercase cursor-pointer shrink-0"
                >
                  {selectedSubject} ✕
                </button>
              )}
            </div>

            {subjectGroups.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Skull className="w-9 h-9 mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-xs uppercase">Nenhuma disciplina registrada</p>
                <p className="text-xs mt-1 text-slate-500">
                  Resolva questões no Projeto Caveira para alimentar o diagnóstico.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[430px] overflow-y-auto custom-scrollbar pr-1">
                {subjectGroups.map(sub => {
                  const isExpanded = expandedSubject === sub.name;
                  const isFiltered = selectedSubject === sub.name;
                  const blocoMeta = BLOCO_METADATA[sub.bloco] || BLOCO_METADATA['Bloco I'];

                  return (
                    <div
                      key={sub.name}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isFiltered
                          ? 'border-blue-500 bg-blue-500/5 dark:bg-[#1E2229]'
                          : sub.status === 'vulnerabilidade'
                          ? 'border-red-500/25 bg-white dark:bg-[#1E2022]'
                          : 'border-slate-200 dark:border-[#32363A] bg-white dark:bg-[#1E2022]'
                      }`}
                    >
                      {/* Linha Principal da Disciplina */}
                      <div
                        onClick={() => setExpandedSubject(isExpanded ? null : sub.name)}
                        className="p-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-[#26292C]/70 transition-colors flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${blocoMeta.badgeClass}`}>
                              {blocoMeta.short}
                            </span>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#F1F5F9] truncate">
                              {sub.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-medium text-slate-400">
                              <strong className="text-emerald-400">{sub.hits}C</strong> / <strong className="text-red-400">{sub.errors}E</strong>
                              <span className="text-slate-500 ml-1">({sub.total}q • {sub.avgTime}s)</span>
                            </span>

                            <span className={`text-sm font-black min-w-[40px] text-right ${
                              sub.grossPercent >= 75 ? 'text-emerald-400' : sub.grossPercent >= 50 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {sub.grossPercent}%
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubject(isFiltered ? 'all' : sub.name);
                                setSelectedTopic('all');
                              }}
                              className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                isFiltered
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-slate-100 dark:bg-[#26292C] text-slate-400 border-slate-300 dark:border-[#383C42] hover:text-white'
                              }`}
                            >
                              {isFiltered ? '✓ Ativo' : 'Filtrar'}
                            </button>

                            <div className="text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progresso Limpa */}
                        <div className="w-full bg-slate-200 dark:bg-[#26292C] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              sub.grossPercent >= 75 ? 'bg-emerald-500' : sub.grossPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(4, Math.min(100, sub.grossPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Sub-tópicos Expandidos */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-200 dark:border-[#2E3236] p-3 bg-slate-50 dark:bg-[#17191B] space-y-1.5"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Assuntos da Disciplina ({sub.topicsList.length}) — Clique para filtrar:
                              </span>
                              {selectedTopic !== 'all' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTopic('all')}
                                  className="text-[10px] font-bold uppercase text-blue-400 hover:underline cursor-pointer"
                                >
                                  Mostrar todos
                                </button>
                              )}
                            </div>

                            {sub.topicsList.map(topic => {
                              const isTopicActive = selectedTopic === topic.name && selectedSubject === sub.name;
                              return (
                                <div
                                  key={topic.name}
                                  onClick={() => {
                                    setSelectedSubject(sub.name);
                                    setSelectedTopic(isTopicActive ? 'all' : topic.name);
                                  }}
                                  className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    isTopicActive
                                      ? 'bg-blue-500/15 border-blue-500 text-white'
                                      : 'bg-white dark:bg-[#1E2022] border-slate-200 dark:border-[#2E3236] hover:border-slate-500'
                                  }`}
                                >
                                  <span className="text-xs font-medium text-slate-700 dark:text-[#F1F5F9] leading-snug">
                                    {topic.name}
                                  </span>
                                  <div className="flex items-center gap-2.5 shrink-0 text-xs">
                                    <span className="text-slate-400 font-medium">
                                      {topic.hits}C / {topic.errors}E
                                    </span>
                                    <span className={`font-black min-w-[34px] text-right ${
                                      topic.grossPercent >= 75 ? 'text-emerald-400' : topic.grossPercent >= 50 ? 'text-amber-400' : 'text-red-400'
                                    }`}>
                                      {topic.grossPercent}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: RADAR DE LEI SECA (LISTA HORIZONTAL SEM TRUNCAMENTO) */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/70 dark:border-[#2E3236]">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" /> Radar de Lei Seca ({legalRadarList.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#A0AAB2]">
                  Leis, artigos e súmulas mais cobrados ou errados. Clique para filtrar o Caderno.
                </p>
              </div>
              {selectedLegalDevice && (
                <button
                  type="button"
                  onClick={() => setSelectedLegalDevice(null)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase cursor-pointer shrink-0"
                >
                  Filtro Ativo ✕
                </button>
              )}
            </div>

            {legalRadarList.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Scale className="w-9 h-9 mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-xs uppercase">Nenhum dispositivo legal detectado neste filtro</p>
                <p className="text-xs mt-1 text-slate-500">
                  Artigos, leis e resoluções citados nas questões aparecerão listados aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[430px] overflow-y-auto custom-scrollbar pr-1">
                {legalRadarList.slice(0, 15).map((dev, idx) => {
                  const isSelected = selectedLegalDevice?.key === dev.key;
                  const hasErrors = dev.errors > 0;
                  return (
                    <button
                      key={dev.key}
                      type="button"
                      onClick={() => setSelectedLegalDevice(isSelected ? null : dev)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-500/30'
                          : hasErrors
                          ? 'bg-white dark:bg-[#1E2022] border-red-500/25 hover:border-red-400/60'
                          : 'bg-white dark:bg-[#1E2022] border-slate-200 dark:border-[#32363A] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono font-black text-amber-400 flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#F1F5F9] block leading-snug">
                            {dev.label}
                          </span>
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            {dev.category} • {dev.total} {dev.total === 1 ? 'questão' : 'questões'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
                        {dev.errors > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/25">
                            ✗ {dev.errors} {dev.errors === 1 ? 'erro' : 'erros'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            ✓ 100%
                          </span>
                        )}
                        {dev.guessesOrDoubts > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25" title="Respondida com dúvida ou chute">
                            🎲 {dev.guessesOrDoubts}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. CADERNO DE QUESTÕES (LAYOUT LIMPO, ESCANEÁVEL E SEM POLUIÇÃO VISUAL) */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#2E3236] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-[#2E3236]">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> Caderno Tático de Questões ({filteredQuestions.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#A0AAB2]">
              Enunciados completos, revisão de erros, bizus pessoais e envio para o FSRS.
            </p>
          </div>

          {/* Busca e Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código, lei ou palavra-chave..."
                className="w-full bg-slate-100 dark:bg-[#1E2022] border border-slate-200 dark:border-[#32363A] rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-[#F1F5F9] outline-none focus:border-purple-500"
              />
            </div>

            {[
              { id: 'all', label: `Todas (${blockScopedQuestions.length})` },
              { id: 'errors', label: `✗ Erros (${stats.errors})` },
              { id: 'hits', label: `✓ Acertos (${stats.hits})` },
              { id: 'guesses', label: `🎲 Dúvida/Chute (${stats.guessesOrDoubtsTotal})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer border ${
                  filterType === f.id
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#1E2022] text-slate-500 dark:text-[#A0AAB2] border-slate-200 dark:border-[#32363A] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badges de Filtros Específicos Ativos */}
        {(selectedSubject !== 'all' || selectedTopic !== 'all' || selectedLegalDevice) && (
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-[#191B1D] p-2.5 rounded-xl border border-slate-200 dark:border-[#2E3236]">
            <span className="text-[11px] font-bold uppercase text-slate-400">Filtrando por:</span>
            {selectedSubject !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                Disciplina: {selectedSubject}
                <button onClick={() => { setSelectedSubject('all'); setSelectedTopic('all'); }} className="hover:text-white cursor-pointer">✕</button>
              </span>
            )}
            {selectedTopic !== 'all' && (
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5">
                Assunto: {selectedTopic}
                <button onClick={() => setSelectedTopic('all')} className="hover:text-white cursor-pointer">✕</button>
              </span>
            )}
            {selectedLegalDevice && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                Dispositivo: {selectedLegalDevice.label}
                <button onClick={() => setSelectedLegalDevice(null)} className="hover:text-white cursor-pointer">✕</button>
              </span>
            )}
          </div>
        )}

        {/* Lista de Questões */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-bold text-xs uppercase">Nenhuma questão encontrada para este filtro</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQuestions.slice(0, 80).map(q => {
              const blocoMeta = BLOCO_METADATA[q.bloco] || BLOCO_METADATA['Bloco I'];
              const isEditingThisNote = editingNoteId === q.id;
              const isCommentOpen = Boolean(expandedComments[q.id]);
              const cleanTopic = (q.topic && q.topic !== q.subject && q.topic !== q.canonicalSubject) ? q.topic : null;

              return (
                <div
                  key={q.id + (q.timestamp || '')}
                  className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-[#1E2022] border-slate-200 dark:border-[#32363A] border-l-4 ${
                    q.hit ? 'border-l-emerald-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Cabeçalho Conciso da Questão */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${
                          q.hit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          {q.hit ? '✓ Acerto' : '✗ Erro'}
                        </span>

                        <span className="font-mono text-xs font-black text-white bg-slate-800 dark:bg-[#26292C] border border-slate-700 dark:border-[#383C42] px-2 py-0.5 rounded-md">
                          {q.id}
                        </span>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${blocoMeta.badgeClass}`}>
                          {blocoMeta.short}
                        </span>

                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-[#F1F5F9]">
                          {q.canonicalSubject}
                        </span>

                        {cleanTopic && (
                          <span className="text-xs text-slate-500 dark:text-[#A0AAB2] truncate max-w-md" title={cleanTopic}>
                            ➔ {cleanTopic}
                          </span>
                        )}
                      </div>

                      {/* Direita: Gabarito + Tempo + Ações */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <div className="text-xs font-semibold bg-slate-100 dark:bg-[#26292C] border border-slate-200 dark:border-[#383C42] px-2.5 py-1 rounded-lg">
                          <span className="text-slate-400">Marcou: </span>
                          <strong className={q.hit ? 'text-emerald-400' : 'text-red-400'}>{q.userChoice || '?'}</strong>
                          <span className="text-slate-600 mx-1.5">|</span>
                          <span className="text-slate-400">Gabarito: </span>
                          <strong className="text-emerald-400">{q.correctChoice || '?'}</strong>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-[#26292C] px-2 py-1 rounded-lg">
                          ⏱️ {q.durationSeconds}s
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(isEditingThisNote ? null : q.id);
                            setNoteDraft(q.userNote || '');
                          }}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            q.userNote
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-slate-100 dark:bg-[#26292C] text-slate-400 border-slate-200 dark:border-[#383C42] hover:text-amber-400'
                          }`}
                          title="Adicionar ou editar Bizu Tático"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => createFsrsCardFromCaveira(q)}
                          className={`${
                            q.fsrsCreated
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          } font-bold text-[11px] uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1`}
                          title="Enviar questão para revisão espaçada FSRS"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" /> {q.fsrsCreated ? 'FSRS ✓' : '+FSRS'}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCaveiraQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir questão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Enunciado de Alta Legibilidade */}
                    <div className="text-[15px] font-medium text-slate-800 dark:text-[#F1F5F9] leading-relaxed bg-slate-50 dark:bg-[#26292C] p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-[#34383D]">
                      {q.content}
                    </div>

                    {/* Bizu Pessoal Salvo */}
                    {q.userNote && !isEditingThisNote && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-200 flex items-center justify-between gap-2">
                        <span>💡 <strong>Seu Bizu:</strong> {q.userNote}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(q.id);
                            setNoteDraft(q.userNote || '');
                          }}
                          className="text-xs font-bold uppercase text-amber-400 hover:underline shrink-0 cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    )}

                    {/* Editor de Bizu */}
                    {isEditingThisNote && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Anote a pegadinha, artigo de lei ou mnemônico desta questão..."
                          className="flex-1 bg-slate-100 dark:bg-[#26292C] border border-amber-500/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-[#F1F5F9] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(q.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Salvar
                        </button>
                      </div>
                    )}

                    {/* Barra Inferior Unificada: Classificação Tática + Botão de Comentário do Professor */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-[#2E3236]">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Seletor Único de Confiança */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Confiança:</span>
                          {[
                            { id: 'sabia', label: '🎯 Sabia' },
                            { id: 'duvida', label: '🤔 Dúvida' },
                            { id: 'chute', label: '🎲 Chute' }
                          ].map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => updateCaveiraQuestion(q.id, {
                                confidence: c.id,
                                ...(c.id === 'chute' || c.id === 'duvida' ? { fsrsRequested: true } : {})
                              })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                (q.confidence || 'sabia') === c.id
                                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-100 dark:bg-[#26292C] text-slate-500 dark:text-[#A0AAB2] hover:text-white'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>

                        {/* Seletor Único de Causa do Erro (se errou) */}
                        {!q.hit && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold uppercase text-red-400 mr-1">Causa:</span>
                            {[
                              { id: 'conteudo', label: '📚 Teoria' },
                              { id: 'atencao', label: '⚠️ Atenção' },
                              { id: 'interpretacao', label: '🔍 Interpr.' }
                            ].map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => updateCaveiraQuestion(q.id, { errorReason: r.id })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  (q.errorReason || 'conteudo') === r.id
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-[#26292C] text-slate-500 dark:text-[#A0AAB2] hover:text-white'
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Botão para Expandir/Recolher Comentário do Professor */}
                      {q.teacherComment && (
                        <button
                          type="button"
                          onClick={() => toggleComment(q.id)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          🎓 {isCommentOpen ? 'Ocultar Comentário do Professor' : 'Ver Comentário do Professor'}
                          {isCommentOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Comentário do Professor (Recolhível para manter leitura concisa) */}
                    <AnimatePresence>
                      {q.teacherComment && isCommentOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line overflow-hidden"
                        >
                          <span className="font-bold text-blue-300 block mb-1">🎓 Comentário do Professor / Gabarito:</span>
                          {q.teacherComment}
                        </motion.div>
                      )}
                    </AnimatePresence>
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
