import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, Camera, Check, Trash2, RefreshCw, AlertTriangle, Loader2, CheckSquare, Square, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const LS_KEY = 'qg_vision_api_key';

/** Normaliza duração para MM:SS */
function normalizeDuration(raw) {
  const d = raw.replace(/[;.,]/g, ':');
  const parts = d.split(':').map(p => parseInt(p, 10));
  if (parts.length === 3) {
    const totalMin = parts[0] * 60 + parts[1];
    const secs = parts[2];
    if (secs >= 60) return null;
    return String(totalMin).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  } else if (parts.length === 2) {
    const [mins, secs] = parts;
    if (secs >= 60 || mins >= 2020 || mins > 180) return null;
    if ((mins === 23 || mins === 24) && secs <= 10) return null;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }
  return null;
}

/** Limpa nome extraído pelo OCR */
function cleanName(str) {
  let s = str
    .replace(/^[\s\-=*|\\/""":;.,!?#@&()[\]{}<>_~`^+%$]+/, '')
    .replace(/[\s\-=*|\\/""":;.,!?#@&()[\]{}<>_~`^+%$]+$/, '')
    .replace(/^[^A-ZÀ-Üa-zà-ü]*?(?=[A-ZÀ-Ü]{2,})/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  // Remove apenas caractere único de lixo no início
  s = s.replace(/^[A-ZÀ-Ü0-9]{1}\s*[|)\]}\s]\s*(?=[A-ZÀ-Ü]{2,}.{3,})/, '');

  if (s.length < 3) s = str.toUpperCase().replace(/[^A-ZÀ-Ü0-9\s-]/g, '').trim();
  s = s.replace(/[.,;:!?|]+$/, '').trim();

  // Correções comuns de OCR
  s = s.replace(/\bAULA\s+OL\b/g, 'AULA 01');
  s = s.replace(/\bAULA\s+O(\d)\b/g, 'AULA 0$1');
  s = s.replace(/\bAULA\s+I\b/g, 'AULA 01');

  return s;
}

/** Parseia o texto retornado pela API e extrai pares (nome, duração) */
function parseOCRText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const durRegex = /\b(\d{1,3}[:;.,]\d{2}(?:[:;.,]\d{2})?)\b/;
  const ignoreRegex = /disponível|disponivel|dispon[ií]vel|cispon|dispon|até\s+\d|^\d{2}\/\d{2}|^às\s|^\d+%$|^0%$/i;

  const lineData = lines.map((line, idx) => {
    const isIgnored = ignoreRegex.test(line);
    const durMatch = line.match(durRegex);
    const duration = durMatch ? normalizeDuration(durMatch[1]) : null;
    const nameText = durMatch ? line.replace(durRegex, '').trim() : line;
    const isNameCandidate = !isIgnored && nameText.length > 3 && /[A-ZÀ-Ü]{3,}/.test(nameText);
    return { line, idx, isIgnored, duration, nameText, isNameCandidate };
  });

  const results = [];
  const usedNameLines = new Set();

  for (let i = 0; i < lineData.length; i++) {
    const ld = lineData[i];
    if (!ld.duration) continue;

    if (ld.isNameCandidate && ld.nameText.length > 3) {
      const cleaned = cleanName(ld.nameText);
      if (cleaned.length >= 3 && !results.some(r => r.name === cleaned)) {
        results.push({ id: 'ocr_' + Date.now() + '_' + results.length, name: cleaned, duration: ld.duration, selected: true });
        usedNameLines.add(i);
        continue;
      }
    }

    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      const prev = lineData[j];
      if (usedNameLines.has(j) || prev.isIgnored) continue;
      if (prev.duration && !prev.isNameCandidate) continue;
      if (prev.isNameCandidate) {
        const cleaned = cleanName(prev.nameText);
        if (cleaned.length >= 3 && !results.some(r => r.name === cleaned)) {
          results.push({ id: 'ocr_' + Date.now() + '_' + results.length, name: cleaned, duration: ld.duration, selected: true });
          usedNameLines.add(j);
        }
        break;
      }
    }
  }

  // Deduplicação
  const seen = new Set();
  return results.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
}

/**
 * Componente de importação de aulas via screenshot.
 * Usa a Google Cloud Vision API para extrair texto com alta precisão.
 */
export default function ImportOCR({ subjects, setSubjects, _availableColors, onClose }) {
  // Estado do fluxo
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'review'

  // Upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Disciplina
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectBlock] = useState('B1');
  const [newSubjectColor] = useState('bg-blue-600 text-white');
  const [createNew, setCreateNew] = useState(Object.keys(subjects || {}).length === 0);

  // API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [showKey, setShowKey] = useState(false);
  const [editingKey, setEditingKey] = useState(!localStorage.getItem(LS_KEY));

  // OCR
  const [ocrStatus, setOcrStatus] = useState('');

  // Resultados
  const [extractedLessons, setExtractedLessons] = useState([]);
  const [allSelected, setAllSelected] = useState(true);

  // ===== HANDLERS DE UPLOAD =====

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  // Colar imagem ou texto
  useEffect(() => {
    const handlePaste = (e) => {
      if (step !== 'upload') return;
      // Não interceptar se o foco estiver em um campo de texto (ex: campo da API key)
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          setImageFile(blob);
          setImagePreview(URL.createObjectURL(blob));
          return;
        }
      }
      const text = e.clipboardData.getData('text');
      if (text?.trim()) {
        setStep('processing');
        setOcrStatus('Analisando texto colado...');
        setTimeout(() => {
          const lessons = parseOCRText(text);
          if (!lessons.length) {
            toast.error('Nenhuma aula encontrada no texto colado.');
            setStep('upload');
          } else {
            setExtractedLessons(lessons);
            setAllSelected(true);
            setStep('review');
            toast.success(`${lessons.length} aula(s) importada(s) do texto!`);
          }
        }, 400);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ===== GOOGLE VISION API =====

  /** Converte File para base64 sem o prefixo data:... */
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  /** Chama a Gemini API (Google AI Studio) para extrair aulas da imagem */
  const callGeminiAPI = async (file, key) => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/png';
    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: "Você é um assistente estruturador de dados de estudos. Analise a imagem fornecida, que é uma captura de tela de uma lista de aulas de uma plataforma de cursos.\n\nREGRAS IMPORTANTES:\n1. Identifique cada card/item de aula visível na imagem.\n2. ATENÇÃO - cards com múltiplas aulas: se o título de um card indicar um intervalo de aulas (exemplos: 'PLANO INCLINADO - AULAS 01 A 03', 'FORÇA - AULAS 02 E 03', 'TEMA X - AULAS 01-04'), você DEVE expandir em entradas separadas, uma por aula. A PRIMEIRA aula do grupo recebe o tempo exibido no card; as DEMAIS recebem '00:00'. Nomeie cada entrada identificando a aula individual (ex: 'PLANO INCLINADO - AULA 01', 'PLANO INCLINADO - AULA 02', 'PLANO INCLINADO - AULA 03').\n3. Se o card tiver apenas UMA aula, crie somente uma entrada com o nome e o tempo correto.\n4. Converta todos os nomes para CAIXA ALTA, preservando acentos e caracteres especiais.\n5. Limpe badges de progresso, ícones de thumbnail e elementos visuais dos nomes.\n6. A duração deve estar no formato MM:SS ou H:MM:SS.\n\nRetorne SOMENTE um array JSON válido (sem explicações, sem blocos de código markdown):\n[\n  { \"name\": \"NOME DA AULA EM CAIXA ALTA\", \"duration\": \"MM:SS\" }\n]" }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const err = await res.json();
      const msg = err?.error?.message || 'Erro desconhecido na API do Gemini';
      throw new Error(msg);
    }

    const data = await res.json();
    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item.name && String(item.name).trim().length > 1)
          .map((item, idx) => ({
            id: 'ocr_' + Date.now() + '_' + idx,
            name: String(item.name || '').toUpperCase().trim(),
            duration: String(item.duration || '00:00').trim(),
            selected: true
          }));
      }
      return [];
    } catch {
      throw new Error('O modelo não respondeu no formato esperado.');
    }
  };

  /** Processa a imagem usando Gemini API */
  const processImage = async () => {
    if (!imageFile) { toast.error('Selecione uma imagem primeiro.'); return; }
    if (createNew && !newSubjectName.trim()) { toast.error('Digite o nome da nova disciplina.'); return; }
    if (!createNew && !selectedSubjectId) { toast.error('Selecione uma disciplina.'); return; }

    const key = apiKey.trim();
    if (!key) { toast.error('Configure sua chave da API antes de continuar.'); setEditingKey(true); return; }

    // Salvar chave no localStorage
    localStorage.setItem(LS_KEY, key);

    setStep('processing');
    setOcrStatus('Enviando imagem para o Gemini Flash...');

    try {
      const lessons = await callGeminiAPI(imageFile, key);

      if (!lessons.length) {
        toast.error('Não foi possível extrair aulas. Tente colar o texto diretamente (Ctrl+V).');
        setStep('upload');
        return;
      }

      setExtractedLessons(lessons);
      setAllSelected(true);
      setStep('review');
      toast.success(`${lessons.length} aula(s) encontrada(s)! Revise e importe.`);
    } catch (error) {
      console.error('Gemini API Error:', error);
      const msg = error.message || '';
      if (msg.includes('API_KEY') || msg.includes('key') || msg.includes('credentials') || msg.includes('403') || msg.includes('not valid') || msg.includes('invalid')) {
        toast.error('Chave inválida. Verifique sua chave no Google AI Studio (aistudio.google.com).');
      } else {
        toast.error('Erro ao processar imagem: ' + msg);
      }
      setStep('upload');
    }
  };

  // ===== LESSON HANDLERS =====

  const toggleLesson = (id) => {
    setExtractedLessons(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, selected: !l.selected } : l);
      setAllSelected(updated.every(l => l.selected));
      return updated;
    });
  };

  const toggleAll = () => {
    const newVal = !allSelected;
    setExtractedLessons(prev => prev.map(l => ({ ...l, selected: newVal })));
    setAllSelected(newVal);
  };

  const updateLessonName = (id, name) =>
    setExtractedLessons(prev => prev.map(l => l.id === id ? { ...l, name } : l));

  const updateLessonDuration = (id, duration) =>
    setExtractedLessons(prev => prev.map(l => l.id === id ? { ...l, duration } : l));

  const removeLesson = (id) =>
    setExtractedLessons(prev => prev.filter(l => l.id !== id));

  const handleConfirm = () => {
    const selected = extractedLessons.filter(l => l.selected);
    if (!selected.length) { toast.error('Selecione pelo menos uma aula.'); return; }
    if (createNew && !newSubjectName.trim()) {
      toast.error('Digite o nome da nova disciplina antes de importar.');
      setStep('upload');
      return;
    }
    if (!createNew && (!selectedSubjectId || !subjects?.[selectedSubjectId])) {
      toast.error('Selecione uma disciplina de destino antes de importar.');
      setStep('upload');
      return;
    }

    const newTopics = selected.map((lesson, idx) => ({
      id: 't' + Date.now() + '_' + idx,
      name: lesson.name,
      total: 1,
      completed: 0,
      duration: lesson.duration,
      lessons: [{
        id: 'l_' + Date.now() + '_' + idx,
        name: lesson.name,
        title: lesson.name,
        duration: lesson.duration || '60:00',
        completed: false
      }],
      notes: ''
    }));

    if (createNew) {
      const newId = 'sub_' + Date.now();
      const newSubject = {
        id: newId,
        name: newSubjectName.toUpperCase().trim(),
        color: newSubjectColor,
        block: newSubjectBlock,
        topics: newTopics
      };
      setSubjects(prev => ({ ...prev, [newId]: newSubject }));
      toast.success(`Disciplina "${newSubject.name}" criada com ${newTopics.length} aula(s)!`);
    } else {
      setSubjects(prev => {
        const updated = { ...prev };
        const subject = { ...updated[selectedSubjectId] };
        subject.topics = [...(subject.topics || []), ...newTopics];
        updated[selectedSubjectId] = subject;
        return updated;
      });
      toast.success(`${newTopics.length} aula(s) adicionada(s) a "${subjects[selectedSubjectId]?.name}"!`);
    }
    onClose();
  };

  const selectedCount = extractedLessons.filter(l => l.selected).length;

  // ===== RENDER =====

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-ocr-title"
        className="relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 ring-1 ring-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="import-ocr-title" className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Importar aulas por imagem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {step === 'upload' && 'Passo 1 — Fonte de dados e captura'}
                {step === 'processing' && 'Analisando imagem...'}
                {step === 'review' && `Passo 2 — Revisão (${selectedCount} selecionada${selectedCount !== 1 ? 's' : ''})`}
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

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">

          {/* ===== STEP: UPLOAD ===== */}
          {step === 'upload' && (
            <div className="space-y-4">

              {/* API Key */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Key className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Gemini API Key (Google AI Studio)
                  </label>
                  {!editingKey && (
                    <button
                      type="button"
                      onClick={() => setEditingKey(true)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline transition-colors cursor-pointer"
                    >
                      Trocar
                    </button>
                  )}
                </div>

                {editingKey ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onPaste={(e) => e.stopPropagation()}
                        placeholder="AIza..."
                        className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 font-mono text-xs text-slate-900 dark:text-white focus:border-sky-500 outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!apiKey.trim()) { toast.error('Digite uma chave válida.'); return; }
                        localStorage.setItem(LS_KEY, apiKey.trim());
                        setEditingKey(false);
                        toast.success('Chave salva!');
                      }}
                      className="h-10 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300">
                      {apiKey.slice(0, 8)}{'•'.repeat(20)}{apiKey.slice(-4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Disciplina */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  Disciplina de destino
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setCreateNew(false)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      !createNew
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateNew(true)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      createNew
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    + Nova disciplina
                  </button>
                </div>
                {!createNew ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 font-medium text-xs text-slate-900 dark:text-white focus:border-sky-500 outline-none transition-colors cursor-pointer"
                  >
                    <option value="">— Selecione uma disciplina —</option>
                    {Object.values(subjects || {}).map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.block})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value.toUpperCase())}
                    onPaste={(e) => e.stopPropagation()}
                    className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 font-semibold text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                    placeholder="Nome da disciplina..."
                  />
                )}
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : imagePreview
                    ? 'border-sky-500/50 bg-sky-500/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="space-y-3">
                    <img src={imagePreview} alt="Preview" className="max-h-60 mx-auto rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clique para trocar a imagem</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Arraste uma screenshot aqui</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ou cole <kbd className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded text-[10px] text-slate-700 dark:text-slate-300 font-mono">Ctrl+V</kbd> ou clique para selecionar
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">PNG, JPG ou WEBP</p>
                  </div>
                )}
              </div>

              {/* Dica */}
              <div className="flex items-start gap-2.5 bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200/80 dark:border-sky-900/50 rounded-xl p-3.5">
                <AlertTriangle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-950 dark:text-sky-200/90 leading-relaxed">
                  Processamento inteligente de imagens e aulas com <strong>Gemini Vision</strong>. Obtenha sua chave gratuita no <strong>Google AI Studio</strong>; ela fica salva apenas no seu navegador.
                </p>
              </div>
            </div>
          )}

          {/* ===== STEP: PROCESSING ===== */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-14 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-sky-400/10 ring-1 ring-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{ocrStatus}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extraindo títulos e durações — leva apenas alguns segundos.
                </p>
              </div>
            </div>
          )}

          {/* ===== STEP: REVIEW ===== */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {allSelected ? <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                  {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('upload'); setExtractedLessons([]); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reprocessar
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[28px_1fr_84px_28px] gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span></span>
                  <span>Nome da aula</span>
                  <span className="text-center">Duração</span>
                  <span></span>
                </div>

                {extractedLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`grid grid-cols-[28px_1fr_84px_28px] gap-2 items-center px-3 py-2 rounded-xl border transition-all ${
                      lesson.selected
                        ? 'bg-slate-50/80 dark:bg-slate-950/55 border-slate-200 dark:border-slate-700/80'
                        : 'bg-slate-50/30 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-50'
                    }`}
                  >
                    <button type="button" onClick={() => toggleLesson(lesson.id)} className="flex items-center justify-center cursor-pointer">
                      {lesson.selected
                        ? <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />}
                    </button>

                    <input
                      type="text"
                      value={lesson.name}
                      onChange={(e) => updateLessonName(lesson.id, e.target.value)}
                      onPaste={(e) => e.stopPropagation()}
                      className="bg-transparent border-none outline-none text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 w-full"
                      placeholder="Nome da aula..."
                    />

                    <input
                      type="text"
                      value={lesson.duration}
                      onChange={(e) => updateLessonDuration(lesson.id, e.target.value)}
                      onPaste={(e) => e.stopPropagation()}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 text-center outline-none focus:border-emerald-500 w-full"
                      placeholder="00:00"
                    />

                    <button
                      type="button"
                      onClick={() => removeLesson(lesson.id)}
                      className="flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {extractedLessons.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nenhuma aula encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          {step === 'upload' && (
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={processImage}
                disabled={!imageFile}
                className={`h-10 px-5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                  imageFile
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Camera className="w-4 h-4" />
                Processar imagem
              </button>
            </div>
          )}

          {step === 'review' && (
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { setStep('upload'); setExtractedLessons([]); }}
                className="h-10 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className={`h-10 px-5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                  selectedCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Importar {selectedCount} aula{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
