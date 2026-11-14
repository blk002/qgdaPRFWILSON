import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Share2, Download, Copy, Check, FileText, CheckSquare, 
  Square, RefreshCw, UploadCloud, AlertCircle, Sparkles, BookOpen, 
  Clock, Video, MessageCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { formatSecondsToFriendly, parseDurationToSeconds } from '../lib/durationHelpers';
import { useStore } from '../store/useStore';

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
      topics: Array.isArray(sub.topics) ? sub.topics.map((t, tIdx) => ({
        id: t.id || `t_${Date.now()}_${tIdx}`,
        name: String(t.name || 'Assunto').trim(),
        total: Number(t.total) || (Array.isArray(t.lessons) ? t.lessons.length : 0),
        completed: Number(t.completed) || 0,
        notes: t.notes || '',
        lessons: Array.isArray(t.lessons) ? t.lessons.map((l, lIdx) => {
          const lessonName = String(l.name || l.title || `Aula ${lIdx + 1}`).trim();
          return {
            id: l.id || `l_${Date.now()}_${lIdx}`,
            name: lessonName,
            title: lessonName,
            duration: l.duration !== undefined && l.duration !== null && String(l.duration).trim() !== '' ? String(l.duration) : '60:00',
            completed: Boolean(l.completed)
          };
        }) : []
      })) : []
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
                
                // Adiciona apenas aulas que não existem ainda
                const newLessons = [...existingLessons];
                importedLessons.forEach(il => {
                  const ilName = (il.name || il.title || '').toLowerCase();
                  if (!newLessons.some(el => (el.name || el.title || '').toLowerCase() === ilName)) {
                    newLessons.push(il);
                  }
                });

                curTopics[curTopicIdx] = {
                  ...curTopics[curTopicIdx],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Compartilhar Grade de Estudos
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full">
                  Matérias, Assuntos & Aulas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Envie suas disciplinas e videoaulas para outro usuário ou carregue a grade de um colega.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de Navegação */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-lg transition-all border-b-2 ${
              activeTab === 'share'
                ? 'border-blue-500 text-blue-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            1. Compartilhar / Exportar
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-lg transition-all border-b-2 ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            2. Importar Grade Recebida
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* ==================== ABA 1: COMPARTILHAR ==================== */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              
              {/* Seleção de Disciplinas */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" /> Disciplinas a Compartilhar ({selectedSubjectIds.length}/{allSubjectIds.length})
                  </span>
                  <button 
                    onClick={toggleSelectAll}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    {isAllSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {isAllSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
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
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-blue-950/40 border-blue-700/60 text-white' 
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${sub.color}`}>
                            {sub.block || 'B1'}
                          </span>
                          <span className="text-xs font-bold truncate">{sub.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                          {subTopicsCount}ass · {subLessonsCount}aul
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo Operacional */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#020617] border border-slate-800 p-3 rounded-xl text-center">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Disciplinas</span>
                  <span className="text-base font-black text-white">{exportStats.subjectsCount}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Assuntos</span>
                  <span className="text-base font-black text-blue-400">{exportStats.topicsCount}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Videoaulas</span>
                  <span className="text-base font-black text-emerald-400">{exportStats.lessonsCount}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">Carga Estimada</span>
                  <span className="text-base font-black text-amber-400">{exportStats.totalFriendly}</span>
                </div>
              </div>

              {/* Opção de Zerar Progresso (Recomendado para amigos) */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <input 
                  type="checkbox"
                  checked={resetProgressOnExport}
                  onChange={(e) => setResetProgressOnExport(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 border-slate-700 bg-slate-900 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    Zerar progresso das aulas (Recomendado para o colega iniciar do zero)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Mantém todos os nomes de matérias, assuntos, títulos de aulas e durações, mas desmarca todas as aulas como concluídas para que seu colega possa registrar o próprio avanço.
                  </p>
                </div>
              </label>

              {/* Botões de Ação para Compartilhar */}
              <div className="pt-2 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Escolha como deseja enviar:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Botão Copiar Mensagem WhatsApp */}
                  <button
                    onClick={handleCopyWhatsAppMessage}
                    className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 font-bold transition-all group"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs">{copiedMsg ? 'Mensagem Copiada!' : 'Enviar no WhatsApp'}</span>
                    <span className="text-[9px] text-emerald-400/80 font-normal">Texto explicativo + Código</span>
                  </button>

                  {/* Botão Copiar Código */}
                  <button
                    onClick={handleCopyCode}
                    className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 flex flex-col items-center justify-center gap-1.5 font-bold transition-all group"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />}
                    <span className="text-xs">{copiedCode ? 'Código Copiado!' : 'Copiar Código'}</span>
                    <span className="text-[9px] text-blue-400/80 font-normal">Código tático compacto</span>
                  </button>

                  {/* Botão Baixar JSON */}
                  <button
                    onClick={handleDownloadJson}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 flex flex-col items-center justify-center gap-1.5 font-bold transition-all group"
                  >
                    <Download className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform" />
                    <span className="text-xs">Baixar Arquivo</span>
                    <span className="text-[9px] text-slate-400 font-normal">Arquivo .json de grade</span>
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" /> Cole o Código de Compartilhamento ou envie o Arquivo:
                  </label>
                  
                  {/* Upload de Arquivo */}
                  <label className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
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
                  className="w-full bg-[#020617] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />

                {fileError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1 bg-red-950/40 p-2 rounded-lg border border-red-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {fileError}
                  </p>
                )}
              </div>

              {/* Preview dos dados detectados */}
              {importStats && (
                <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Grade Detectada com Sucesso!
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {importStats.subjectsCount} matéria(s) encontradas
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#020617] p-2.5 rounded-lg border border-slate-800 text-center">
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block">Assuntos</span>
                      <span className="text-sm font-black text-white">{importStats.topicsCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block">Aulas Totais</span>
                      <span className="text-sm font-black text-emerald-400">{importStats.lessonsCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block">Carga Estimada</span>
                      <span className="text-sm font-black text-amber-400">{importStats.totalFriendly}</span>
                    </div>
                  </div>

                  {/* Lista de Matérias que vieram no pacote */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {importStats.list.map(s => (
                      <div key={s.id} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${s.color}`}>
                            {s.block || 'B1'}
                          </span>
                          <span className="font-bold text-white">{s.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {s.topics?.length || 0} assuntos · {(s.topics || []).reduce((acc, t) => acc + (t.lessons?.length || t.total || 0), 0)} aulas
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Escolha do Modo de Importação */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Como deseja aplicar no seu QG:
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        importMode === 'merge' 
                          ? 'bg-emerald-950/30 border-emerald-600 text-white' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input 
                          type="radio" 
                          name="importMode" 
                          value="merge" 
                          checked={importMode === 'merge'} 
                          onChange={() => setImportMode('merge')} 
                          className="mt-0.5 text-emerald-600"
                        />
                        <div>
                          <span className="text-xs font-black block">Mesclar com minhas disciplinas</span>
                          <span className="text-[10px] text-slate-400">Mantém suas matérias atuais e adiciona as novas ou complementa tópicos faltantes.</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        importMode === 'replace' 
                          ? 'bg-red-950/30 border-red-600 text-white' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}>
                        <input 
                          type="radio" 
                          name="importMode" 
                          value="replace" 
                          checked={importMode === 'replace'} 
                          onChange={() => setImportMode('replace')} 
                          className="mt-0.5 text-red-600"
                        />
                        <div>
                          <span className="text-xs font-black block">Substituir todas as disciplinas</span>
                          <span className="text-[10px] text-slate-400">Substitui completamente sua lista de matérias pela nova grade que você recebeu.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Botão de Aplicação */}
                  <button
                    onClick={handleApplyImport}
                    className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar e Aplicar Grade de Estudos
                  </button>
                </div>
              )}

              {!importStats && !fileError && (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">Cole o código do seu colega ou envie o arquivo .json acima</p>
                  <p className="text-[10px] mt-1 text-slate-600">O sistema analisará as matérias, assuntos e aulas automaticamente antes de aplicar.</p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé Informativo */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>🔒 Compartilha apenas a estrutura pedagógica (matérias, assuntos e durações).</span>
          <button 
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
