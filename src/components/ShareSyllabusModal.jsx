import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Share2, Download, Copy, Check, FileText, CheckSquare, 
  Square, RefreshCw, UploadCloud, AlertCircle, Sparkles, BookOpen, 
  Clock, Video, MessageCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { formatSecondsToFriendly, parseDurationToSeconds } from '../lib/durationHelpers';
import { getSafeExternalUrl } from '../lib/safeUrl';
import { useStore } from '../store/useStore';

function cleanCaveiraStr(val) {
  return val !== undefined && val !== null ? String(val).trim() : '';
}

function cleanCaveiraUrl(val) {
  const s = cleanCaveiraStr(val);
  return s ? getSafeExternalUrl(s, '') : '';
}

/**
 * Codifica objeto em Base64 seguro para UTF-8 (compatível com acentos em português)
 */
function encodePayload(data) {
  const jsonStr = JSON.stringify(data);
  const bytes = new TextEncoder().encode(jsonStr);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'QGPRF-GRADE-' + btoa(binary);
}

/**
 * Decodifica Base64 UTF-8 ou JSON puro
 */
function decodePayload(raw) {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('QGPRF-GRADE-')) {
    cleaned = cleaned.replace(/^QGPRF-GRADE-/, '');
  }
  
  // Tenta Base64
  try {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (_) {
    // Se não for Base64, tenta JSON direto
    return JSON.parse(raw);
  }
}

/**
 * Normaliza os dados importados para um mapa padronizado de subjects
 */
function normalizeSubjectsData(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  let rawMap = null;
  if (parsed.type === 'QG_PRF_SYLLABUS' && parsed.subjects && typeof parsed.subjects === 'object') {
    rawMap = parsed.subjects;
  } else if (parsed.subjects && typeof parsed.subjects === 'object') {
    rawMap = parsed.subjects;
  } else if (Array.isArray(parsed)) {
    rawMap = {};
    parsed.forEach((s, idx) => {
      if (s && typeof s === 'object' && s.name) {
        const id = s.id || `sub_import_${Date.now()}_${idx}`;
        rawMap[id] = { ...s, id };
      }
    });
  } else {
    // Possivelmente já é o mapa direto de subjects
    const vals = Object.values(parsed);
    if (vals.length > 0 && vals[0] && typeof vals[0] === 'object' && vals[0].name) {
      rawMap = parsed;
    }
  }

  if (!rawMap || Object.keys(rawMap).length === 0) return null;

  // Sanitiza cada matéria para garantir integridade
  const sanitized = {};
  Object.entries(rawMap).forEach(([id, sub]) => {
    if (!sub || typeof sub !== 'object' || !sub.name) return;
    const subId = sub.id || id;
    const subCourseId = cleanCaveiraStr(sub.caveiraCourseId);
    const subCourseName = cleanCaveiraStr(sub.caveiraCourseName);
    const subModuleUrl = cleanCaveiraUrl(sub.caveiraModuleUrl);
    sanitized[subId] = {
      id: subId,
      name: String(sub.name || 'Nova Matéria').trim(),
      color: sub.color || 'bg-blue-600 text-white',
      block: sub.block || 'B1',
      speed: Number(sub.speed) || 1,
      timeGoalMinutes: Number(sub.timeGoalMinutes) || 0,
      lessonsPerBlock: Number(sub.lessonsPerBlock) || 0,
      onCompleteAction: sub.onCompleteAction || 'keep_fixed',
      replacementSubjectId: sub.replacementSubjectId || '',
      ...(subCourseId ? { caveiraCourseId: subCourseId } : {}),
      ...(subCourseName ? { caveiraCourseName: subCourseName } : {}),
      ...(subModuleUrl ? { caveiraModuleUrl: subModuleUrl } : {}),
      topics: Array.isArray(sub.topics) ? sub.topics.map((t, tIdx) => {
        const topicCourseId = cleanCaveiraStr(t.caveiraCourseId);
        const topicCourseName = cleanCaveiraStr(t.caveiraCourseName);
        const topicModuleUrl = cleanCaveiraUrl(t.caveiraModuleUrl);
        return {
          id: t.id || `t_${Date.now()}_${tIdx}`,
          name: String(t.name || 'Assunto').trim(),
          total: Number(t.total) || (Array.isArray(t.lessons) ? t.lessons.length : 0),
          completed: Number(t.completed) || 0,
          notes: t.notes || '',
          ...(topicCourseId ? { caveiraCourseId: topicCourseId } : {}),
          ...(topicCourseName ? { caveiraCourseName: topicCourseName } : {}),
          ...(topicModuleUrl ? { caveiraModuleUrl: topicModuleUrl } : {}),
          lessons: Array.isArray(t.lessons) ? t.lessons.map((l, lIdx) => {
            const lessonName = String(l.name || l.title || `Aula ${lIdx + 1}`).trim();
            const lessonUrl = cleanCaveiraUrl(l.caveiraUrl || l.url);
            const lessonVideoId = cleanCaveiraStr(l.caveiraVideoId);
            const lessonCourseId = cleanCaveiraStr(l.caveiraCourseId);
            const lessonCourseName = cleanCaveiraStr(l.caveiraCourseName);
            return {
              id: l.id || `l_${Date.now()}_${lIdx}`,
              name: lessonName,
              title: lessonName,
              duration: l.duration !== undefined && l.duration !== null && String(l.duration).trim() !== '' ? String(l.duration) : '60:00',
              completed: Boolean(l.completed),
              ...(lessonUrl ? { caveiraUrl: lessonUrl } : {}),
              ...(lessonVideoId ? { caveiraVideoId: lessonVideoId } : {}),
              ...(lessonCourseId ? { caveiraCourseId: lessonCourseId } : {}),
              ...(lessonCourseName ? { caveiraCourseName: lessonCourseName } : {}),
            };
          }) : []
        };
      }) : []
    };
  });

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

export default function ShareSyllabusModal({
  subjects,
  setSubjects,
  initialSubjectId = null,
  initialTab = 'share',
  onClose
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'share' | 'import'

  // --- ESTADO DA ABA COMPARTILHAR ---
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(() => {
    if (initialSubjectId && subjects[initialSubjectId]) {
      return [initialSubjectId];
    }
    return Object.keys(subjects || {});
  });
  const [resetProgressOnExport, setResetProgressOnExport] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // --- ESTADO DA ABA IMPORTAR ---
  const [importInputText, setImportInputText] = useState('');
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'

  // Selecionar/deselecionar matérias na exportação
  const allSubjectIds = useMemo(() => Object.keys(subjects || {}), [subjects]);
  const isAllSelected = selectedSubjectIds.length === allSubjectIds.length && allSubjectIds.length > 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds([...allSubjectIds]);
    }
  };

  const toggleSubject = (id) => {
    setSelectedSubjectIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Estatísticas das matérias selecionadas para exportação
  const exportStats = useMemo(() => {
    let topicsCount = 0;
    let lessonsCount = 0;
    let totalSecs = 0;

    selectedSubjectIds.forEach(id => {
      const sub = subjects[id];
      if (!sub) return;
      (sub.topics || []).forEach(t => {
        topicsCount++;
        if (Array.isArray(t.lessons) && t.lessons.length > 0) {
          lessonsCount += t.lessons.length;
          t.lessons.forEach(l => {
            totalSecs += parseDurationToSeconds(l.duration) || (Number(l.duration) || 3600);
          });
        } else {
          const count = Number(t.total) || 0;
          lessonsCount += count;
          totalSecs += count * 3600;
        }
      });
    });

    return {
      subjectsCount: selectedSubjectIds.length,
      topicsCount,
      lessonsCount,
      totalFriendly: formatSecondsToFriendly(totalSecs)
    };
  }, [selectedSubjectIds, subjects]);

  // Constrói o pacote de exportação
  const buildExportData = () => {
    const exportedMap = {};

    selectedSubjectIds.forEach(id => {
      const sub = subjects[id];
      if (!sub) return;

      const cloned = JSON.parse(JSON.stringify(sub));
      if (resetProgressOnExport && Array.isArray(cloned.topics)) {
        cloned.topics = cloned.topics.map(topic => {
          const resetLessons = Array.isArray(topic.lessons)
            ? topic.lessons.map(l => ({ ...l, completed: false }))
            : [];
          return {
            ...topic,
            completed: 0,
            lessons: resetLessons
          };
        });
      }
      exportedMap[cloned.id] = cloned;
    });

    return {
      type: 'QG_PRF_SYLLABUS',
      version: '1.0',
      createdAt: new Date().toISOString(),
      source: 'QG da PRF — Grade de Estudos',
      stats: exportStats,
      subjects: exportedMap
    };
  };

  // Ações de Compartilhamento
  const handleCopyCode = () => {
    if (selectedSubjectIds.length === 0) {
      toast.error("Selecione ao menos uma disciplina para compartilhar.");
      return;
    }
    const data = buildExportData();
    const code = encodePayload(data);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    toast.success("Código de compartilhamento copiado com sucesso!");
  };

  const handleCopyWhatsAppMessage = () => {
    if (selectedSubjectIds.length === 0) {
      toast.error("Selecione ao menos uma disciplina para compartilhar.");
      return;
    }
    const data = buildExportData();
    const code = encodePayload(data);
    
    const subjectNames = selectedSubjectIds.map(id => subjects[id]?.name).filter(Boolean).slice(0, 5).join(', ');
    const moreCount = selectedSubjectIds.length > 5 ? ` e mais ${selectedSubjectIds.length - 5} matérias` : '';

    const message = 
`👮 *GRADE DE ESTUDOS — QG DA PRF* 🦅
Olá! Estou compartilhando minha grade de matérias organizada com você:

📚 *${exportStats.subjectsCount} Disciplina(s):* ${subjectNames}${moreCount}
📑 *${exportStats.topicsCount} Assuntos* organizados
🎬 *${exportStats.lessonsCount} Videoaulas* cadastradas (~${exportStats.totalFriendly})

👉 *Como carregar no seu QG da PRF:*
1. Acesse o QG da PRF (no PC ou celular).
2. Vá em *Configurações* ➔ *Minhas Disciplinas* ➔ *Compartilhar / Importar*.
3. Na aba *Importar*, cole o código abaixo e clique em *Confirmar e Aplicar*:

\`\`\`
${code}
\`\`\``;

    navigator.clipboard.writeText(message);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
    toast.success("Mensagem completa para WhatsApp copiada!");
  };

  const handleDownloadJson = () => {
    if (selectedSubjectIds.length === 0) {
      toast.error("Selecione ao menos uma disciplina para exportar.");
      return;
    }
    const data = buildExportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const nowLocal = new Date();
    const localDateStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
    const filename = selectedSubjectIds.length === 1 
      ? `grade-${(subjects[selectedSubjectIds[0]]?.name || 'materia').toLowerCase().replace(/\s+/g, '-')}.json`
      : `grade-estudos-prf-${localDateStr}.json`;

    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Arquivo ${filename} baixado com sucesso!`);
  };

  // --- PARSE E PREVIEW DA IMPORTAÇÃO ---
  const { parsedImportedSubjects, fileError } = useMemo(() => {
    if (!importInputText.trim()) return { parsedImportedSubjects: null, fileError: null };
    try {
      const parsed = decodePayload(importInputText);
      const normalized = normalizeSubjectsData(parsed);
      if (!normalized) {
        return {
          parsedImportedSubjects: null,
          fileError: "O código ou arquivo não contém dados de matérias válidos do QG da PRF."
        };
      }
      return { parsedImportedSubjects: normalized, fileError: null };
    } catch {
      return {
        parsedImportedSubjects: null,
        fileError: "Código ou arquivo inválido. Verifique se copiou o texto completo."
      };
    }
  }, [importInputText]);

  // Estatísticas dos dados a importar
  const importStats = useMemo(() => {
    if (!parsedImportedSubjects) return null;
    const list = Object.values(parsedImportedSubjects);
    let topics = 0;
    let lessons = 0;
    let totalSecs = 0;

    list.forEach(s => {
      (s.topics || []).forEach(t => {
        topics++;
        if (Array.isArray(t.lessons) && t.lessons.length > 0) {
          lessons += t.lessons.length;
          t.lessons.forEach(l => {
            totalSecs += parseDurationToSeconds(l.duration) || (Number(l.duration) || 3600);
          });
        } else {
          const count = Number(t.total) || 0;
          lessons += count;
          totalSecs += count * 3600;
        }
      });
    });

    return {
      subjectsCount: list.length,
      topicsCount: topics,
      lessonsCount: lessons,
      totalFriendly: formatSecondsToFriendly(totalSecs),
      list
    };
  }, [parsedImportedSubjects]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setImportInputText(content);
      }
    };
    reader.readAsText(file);
  };

  // Aplicação da Importação
  const handleApplyImport = () => {
    if (!parsedImportedSubjects) return;

    if (importMode === 'replace') {
      const validIds = new Set(Object.keys(parsedImportedSubjects));
      const st = useStore.getState();
      const newCycle = (st.cycle || []).map(day => (day || []).filter(sId => validIds.has(sId)));
      const newCycleSlotCounts = (st.cycleSlotCounts || []).map((counts, dIdx) => {
        const day = st.cycle?.[dIdx] || [];
        return (counts || []).filter((_, sIdx) => validIds.has(day[sIdx]));
      });
      const newOverrides = {};
      const newOverrideCounts = {};
      Object.entries(st.calendarOverrides || {}).forEach(([dateKey, arr]) => {
        const filtered = (arr || []).filter(sId => validIds.has(sId));
        if (filtered.length > 0 || (arr || []).length === 0) {
          newOverrides[dateKey] = filtered;
          if (st.calendarOverrideCounts?.[dateKey]) {
            newOverrideCounts[dateKey] = st.calendarOverrideCounts[dateKey].filter((_, sIdx) => validIds.has((arr || [])[sIdx]));
          }
        }
      });
      const newRules = (st.futureScheduleRules || []).map(rule => {
        const slots = rule.daySlots || rule.subjects || [];
        return {
          ...rule,
          daySlots: slots.filter(sId => validIds.has(sId)),
          slotCounts: (rule.slotCounts || []).filter((_, sIdx) => validIds.has(slots[sIdx]))
        };
      });
      const todayStr = useStore.getState().getLocalDateStr?.() || null;
      useStore.setState({
        subjects: parsedImportedSubjects,
        cycle: newCycle,
        cycleSlotCounts: newCycleSlotCounts,
        calendarOverrides: newOverrides,
        calendarOverrideCounts: newOverrideCounts,
        futureScheduleRules: newRules,
        completedToday: [],
        cycleCarryoverOffset: 0,
        lastCarryoverCheckDate: todayStr
      });
      toast.success(`Grade de estudos substituída com sucesso! (${importStats?.subjectsCount} disciplinas)`);
      onClose();
    } else {
      // Modo Mesclar (Merge)
      setSubjects(prev => {
        const merged = { ...(prev || {}) };

        Object.values(parsedImportedSubjects).forEach(importedSub => {
          // Procura se já existe matéria com mesmo id ou mesmo nome
          const existingKey = Object.keys(merged).find(
            k => k === importedSub.id || merged[k]?.name?.toLowerCase() === importedSub.name.toLowerCase()
          );

          if (existingKey) {
            // Mescla tópicos e aulas
            const cur = merged[existingKey];
            const curTopics = [...(cur.topics || [])];
            
            (importedSub.topics || []).forEach(impTopic => {
              const curTopicIdx = curTopics.findIndex(t => (t.name || '').toLowerCase() === (impTopic.name || '').toLowerCase());
              if (curTopicIdx >= 0) {
                // Mescla aulas do tópico
                const existingLessons = curTopics[curTopicIdx].lessons || [];
                const importedLessons = impTopic.lessons || [];
                
                // Adiciona aulas novas e faz backfill de links Caveira em aulas existentes
                const newLessons = [...existingLessons];
                importedLessons.forEach(il => {
                  const ilName = (il.name || il.title || '').trim().toLowerCase();
                  const existingIdx = newLessons.findIndex(
                    el => (el.name || el.title || '').trim().toLowerCase() === ilName
                  );
                  if (existingIdx < 0) {
                    newLessons.push(il);
                  } else {
                    const ex = newLessons[existingIdx];
                    newLessons[existingIdx] = {
                      ...ex,
                      ...(!ex.caveiraUrl && il.caveiraUrl ? { caveiraUrl: il.caveiraUrl } : {}),
                      ...(!ex.caveiraVideoId && il.caveiraVideoId ? { caveiraVideoId: il.caveiraVideoId } : {}),
                      ...(!ex.caveiraCourseId && il.caveiraCourseId ? { caveiraCourseId: il.caveiraCourseId } : {}),
                      ...(!ex.caveiraCourseName && il.caveiraCourseName ? { caveiraCourseName: il.caveiraCourseName } : {}),
                    };
                  }
                });

                curTopics[curTopicIdx] = {
                  ...curTopics[curTopicIdx],
                  ...(!curTopics[curTopicIdx].caveiraCourseId && impTopic.caveiraCourseId ? { caveiraCourseId: impTopic.caveiraCourseId } : {}),
                  ...(!curTopics[curTopicIdx].caveiraCourseName && impTopic.caveiraCourseName ? { caveiraCourseName: impTopic.caveiraCourseName } : {}),
                  ...(!curTopics[curTopicIdx].caveiraModuleUrl && impTopic.caveiraModuleUrl ? { caveiraModuleUrl: impTopic.caveiraModuleUrl } : {}),
                  lessons: newLessons,
                  total: Math.max(curTopics[curTopicIdx].total || 0, newLessons.length, impTopic.total || 0),
                  notes: curTopics[curTopicIdx].notes || impTopic.notes || ''
                };
              } else {
                curTopics.push(impTopic);
              }
            });

            merged[existingKey] = {
              ...cur,
              ...(!cur.caveiraCourseId && importedSub.caveiraCourseId ? { caveiraCourseId: importedSub.caveiraCourseId } : {}),
              ...(!cur.caveiraCourseName && importedSub.caveiraCourseName ? { caveiraCourseName: importedSub.caveiraCourseName } : {}),
              ...(!cur.caveiraModuleUrl && importedSub.caveiraModuleUrl ? { caveiraModuleUrl: importedSub.caveiraModuleUrl } : {}),
              topics: curTopics,
              speed: cur.speed || importedSub.speed,
              timeGoalMinutes: cur.timeGoalMinutes || importedSub.timeGoalMinutes
            };
          } else {
            // Nova matéria
            merged[importedSub.id] = importedSub;
          }
        });

        return merged;
      });

      toast.success(`Grade mesclada com sucesso! (${importStats?.subjectsCount} disciplinas processadas)`);
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-syllabus-title"
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="share-syllabus-title" className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Compartilhar grade de estudos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Envie suas disciplinas e videoaulas para outro usuário ou carregue a grade de um colega.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-950/40 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'share'
                ? 'border-sky-600 dark:border-sky-400 text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar / Exportar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'import'
                ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Importar grade recebida
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">

          {/* ==================== ABA 1: COMPARTILHAR ==================== */}
          {activeTab === 'share' && (
            <div className="space-y-4">

              {/* Seleção de Disciplinas */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Disciplinas a compartilhar ({selectedSubjectIds.length}/{allSubjectIds.length})
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isAllSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {isAllSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {allSubjectIds.map(id => {
                    const sub = subjects[id];
                    if (!sub) return null;
                    const isChecked = selectedSubjectIds.includes(id);
                    const subTopicsCount = sub.topics?.length || 0;
                    const subLessonsCount = (sub.topics || []).reduce((acc, t) => acc + (t.lessons?.length || t.total || 0), 0);

                    return (
                      <div
                        key={id}
                        onClick={() => toggleSubject(id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-sky-50/80 dark:bg-sky-950/35 border-sky-300 dark:border-sky-700/70 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                          )}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${sub.color}`}>
                            {sub.block || 'B1'}
                          </span>
                          <span className="text-xs font-semibold truncate">{sub.name}</span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-1">
                          {subTopicsCount}ass · {subLessonsCount}aul
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo Operacional */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 p-3 rounded-xl text-center">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Disciplinas</span>
                  <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">{exportStats.subjectsCount}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Assuntos</span>
                  <span className="text-base font-bold tabular-nums text-sky-600 dark:text-sky-400">{exportStats.topicsCount}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Videoaulas</span>
                  <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{exportStats.lessonsCount}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Carga estimada</span>
                  <span className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">{exportStats.totalFriendly}</span>
                </div>
              </div>

              {/* Opção de Zerar Progresso */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={resetProgressOnExport}
                  onChange={(e) => setResetProgressOnExport(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-sky-600 shrink-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                    Zerar progresso das aulas (recomendado para o colega iniciar do zero)
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Mantém todos os nomes de matérias, assuntos, títulos de aulas e durações, mas desmarca as aulas concluídas para que o colega registre o próprio avanço.
                  </p>
                </div>
              </label>

              {/* Botões de Ação para Compartilhar */}
              <div className="pt-1 space-y-2.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  Escolha como deseja enviar
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppMessage}
                    className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/55 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs">{copiedMsg ? 'Mensagem copiada' : 'Enviar no WhatsApp'}</span>
                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-normal">Texto + código</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/35 hover:bg-sky-100/80 dark:hover:bg-sky-950/55 border border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300 flex flex-col items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
                    <span className="text-xs">{copiedCode ? 'Código copiado' : 'Copiar código'}</span>
                    <span className="text-[11px] text-sky-700/80 dark:text-sky-400/80 font-normal">Código compacto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    <span className="text-xs">Baixar arquivo</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Arquivo .json</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ==================== ABA 2: IMPORTAR ==================== */}
          {activeTab === 'import' && (
            <div className="space-y-4">

              {/* Opções de Entrada: Arquivo ou Código */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Cole o código de compartilhamento ou envie o arquivo
                  </label>

                  {/* Upload de Arquivo */}
                  <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 flex items-center gap-1.5 cursor-pointer transition-colors bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Carregar arquivo .json
                    <input
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  value={importInputText}
                  onChange={(e) => setImportInputText(e.target.value)}
                  placeholder="Cole aqui o código de compartilhamento (começa com QGPRF-GRADE-...) ou o conteúdo do arquivo .json..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />

                {fileError && (
                  <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5 mt-1 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {fileError}
                  </p>
                )}
              </div>

              {/* Preview dos dados detectados */}
              {importStats && (
                <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-emerald-300/80 dark:border-emerald-500/35 rounded-xl p-4 space-y-3 fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Grade detectada com sucesso
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {importStats.subjectsCount} matéria(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Assuntos</span>
                      <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{importStats.topicsCount}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Aulas totais</span>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{importStats.lessonsCount}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Carga estimada</span>
                      <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{importStats.totalFriendly}</span>
                    </div>
                  </div>

                  {/* Lista de Matérias que vieram no pacote */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {importStats.list.map(s => (
                      <div key={s.id} className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${s.color}`}>
                            {s.block || 'B1'}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">{s.name}</span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                          {s.topics?.length || 0} assuntos · {(s.topics || []).reduce((acc, t) => acc + (t.lessons?.length || t.total || 0), 0)} aulas
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Escolha do Modo de Importação */}
                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                      Como deseja aplicar na sua grade
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        importMode === 'merge'
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 accent-emerald-600 shrink-0"
                        />
                        <div>
                          <span className="text-xs font-semibold block">Mesclar com minhas disciplinas</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Mantém suas matérias atuais e adiciona as novas ou complementa tópicos faltantes.</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        importMode === 'replace'
                          ? 'bg-red-50/80 dark:bg-red-950/30 border-red-400 dark:border-red-600 text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 accent-red-600 shrink-0"
                        />
                        <div>
                          <span className="text-xs font-semibold block">Substituir todas as disciplinas</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Substitui completamente sua lista de matérias pela nova grade recebida.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Botão de Aplicação */}
                  <button
                    type="button"
                    onClick={handleApplyImport}
                    className="w-full mt-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar e aplicar grade de estudos
                  </button>
                </div>
              )}

              {!importStats && !fileError && (
                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cole o código do seu colega ou envie o arquivo .json acima</p>
                  <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-500">O sistema analisará as matérias, assuntos e aulas automaticamente antes de aplicar.</p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé Informativo */}
        <div className="px-5 py-3.5 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Compartilha apenas a estrutura pedagógica (matérias, assuntos e durações).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
