import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, UploadCloud, Camera, Trash2, Loader2, CheckSquare,
  Square, Key, Eye, EyeOff, Plus, AlertTriangle, Check, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const LS_KEY = 'qg_vision_api_key';

/**
 * Mini-scanner de aulas usando Google Cloud Vision API.
 * Abre um modal que permite ao usuário fazer scan de uma screenshot
 * e adicionar as aulas detectadas dentro de um assunto (tópico) específico.
 *
 * Props:
 *  - topicName: string — nome do assunto sendo editado
 *  - onConfirm: (lessons: Array<{name, duration}>) => void
 *  - onClose: () => void
 */
export default function TopicLessonScanner({ topicName, onConfirm, onClose }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'processing' | 'review'

  // Upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [showKey, setShowKey] = useState(false);
  const [editingKey, setEditingKey] = useState(!localStorage.getItem(LS_KEY));

  // OCR
  const [ocrStatus, setOcrStatus] = useState('');
  const [extractedLessons, setExtractedLessons] = useState([]);
  const [detectedTopicName, setDetectedTopicName] = useState('');
  const [applyTopicRename, setApplyTopicRename] = useState(true);
  const [allSelected, setAllSelected] = useState(true);

  // ===== UPLOAD HANDLERS =====

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
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

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  // Paste global (somente imagens)
  useEffect(() => {
    const handlePaste = (e) => {
      if (step !== 'upload') return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          handleFile(item.getAsFile());
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, handleFile]);

  // ===== VISION API =====

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const callGeminiAPI = async (file, key) => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/png';
    const promptText = `Você é um assistente estruturador de dados de estudos e videoaulas de plataformas de concursos e cursos (ex: Gran Cursos, Estratégia, Alfacon, Focus).
Analise a captura de tela fornecida.

REGRAS OBRIGATÓRIAS:
1. IDENTIFICAR O NOME DO ASSUNTO (MÓDULO):
   - Localize o cabeçalho ou título principal do assunto/módulo (geralmente fica no topo da lista ou no cabeçalho do acordeão retrátil).
   - EXEMPLO REAL: se estiver escrito "3 Ortografia e semântica" ou "Módulo 3 - Ortografia e semântica", o número "3" é apenas a numeração/ordem. O NOME DO ASSUNTO É "Ortografia e semântica".
   - Limpe números iniciais, ordens, pontos, hífens ou palavras como "Módulo 3 -", "3.", "03 -", "3 ".
   - Converta o nome do assunto para CAIXA ALTA (ex: "ORTOGRAFIA E SEMÂNTICA").
   - Se não houver cabeçalho explícito com número de módulo, deduza o assunto pelo tema comum das aulas ou deixe vazio "".

2. IDENTIFICAR AS VIDEOAULAS INDIVIDUAIS:
   - Identifique cada aula/linha/card abaixo do cabeçalho. Ignore o cabeçalho principal (não o repita como aula).
   - Extraia o nome da aula (em CAIXA ALTA) e sua duração (formato MM:SS ou H:MM:SS, ex: "31:41", "01:16:49").
   - Se um card indicar múltiplas aulas (exemplos: 'PLANO INCLINADO - AULAS 01 A 03', 'FORÇA - AULAS 02 E 03'), expanda em entradas separadas: uma por aula. A primeira aula recebe o tempo exibido no card; as demais recebem '00:00'.
   - Se o card tiver apenas UMA aula, crie somente uma entrada com o tempo correto.
   - Limpe ícones de play, caixas de seleção (checkbox), badges e status visuais dos nomes.

Retorne SOMENTE um objeto JSON válido (sem blocos de código markdown, sem texto extra):
{
  "topic_name": "NOME DO ASSUNTO EM CAIXA ALTA (SEM O NÚMERO DO MÓDULO)",
  "lessons": [
    { "name": "NOME DA AULA EM CAIXA ALTA", "duration": "MM:SS" }
  ]
}`;

    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: promptText }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    // Tentar modelos com fallback automático (modelos rápidos e modernos)
    const models = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-3.1-flash-lite'
    ];

    let lastError = null;
    let data = null;

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        );

        if (res.ok) {
          data = await res.json();
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          lastError = new Error(errMsg);

          // Se a chave for comprovadamente inválida, interrompe fallback
          if (errMsg.toLowerCase().includes('api key not valid') || errMsg.toLowerCase().includes('api_key_invalid')) {
            throw lastError;
          }
        }
      } catch (e) {
        lastError = e;
        if (e.message && e.message.toLowerCase().includes('api key not valid')) {
          throw e;
        }
      }
    }

    if (!data) {
      throw lastError || new Error('Não foi possível obter resposta dos servidores Gemini.');
    }

    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    try {
      let rawText = jsonText.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      const parsed = JSON.parse(rawText);

      let extractedTopic = '';
      let rawLessons = [];

      if (Array.isArray(parsed)) {
        rawLessons = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (typeof parsed.topic_name === 'string') {
          extractedTopic = parsed.topic_name.trim();
        }
        if (Array.isArray(parsed.lessons)) {
          rawLessons = parsed.lessons;
        }
      }

      // Limpeza aprofundada do título do assunto (remove prefixos como "3 ", "3. ", "03 - ", "Módulo 3 - ")
      if (extractedTopic) {
        extractedTopic = extractedTopic
          .replace(/^(?:m[óo]dulo|assunto|cap[íi]tulo|tema|bloco|aula)?\s*\d+[\s.\-–—:]+/i, '')
          .replace(/^\d+[\s.\-–—:]*/, '')
          .replace(/[.\-–—:]+$/, '')
          .trim()
          .toUpperCase();
      }

      // Dedução de backup: se não encontrou o cabeçalho, deduz pelo padrão das aulas (ex: "ORTOGRAFIA E SEMÂNTICA - PARTE 01")
      if (!extractedTopic && rawLessons.length > 0) {
        const prefixes = rawLessons
          .map(l => {
            const m = String(l?.name || '').match(/^(.*?)\s*[-–—]\s*(?:PARTE|AULA|BLOCO|\d)/i);
            return m ? m[1].trim() : '';
          })
          .filter(Boolean);
        if (prefixes.length > 0) {
          const counts = {};
          for (const p of prefixes) { counts[p] = (counts[p] || 0) + 1; }
          const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
          if (top && top[1] >= 2) {
            extractedTopic = top[0].toUpperCase().trim();
          }
        }
      }

      const lessons = rawLessons
        .filter(item => item && item.name && String(item.name).trim().length > 1)
        .map((item, idx) => ({
          id: 'ls_' + Date.now() + '_' + idx,
          name: String(item.name).toUpperCase().trim(),
          duration: String(item.duration || '00:00').trim(),
          selected: true
        }));

      return { topicTitle: extractedTopic, lessons };
    } catch {
      throw new Error('O modelo não respondeu no formato esperado.');
    }
  };

  const processImage = async () => {
    if (!imageFile) { toast.error('Selecione uma imagem primeiro.'); return; }
    const key = apiKey.trim();
    if (!key) { toast.error('Configure sua chave da API antes de continuar.'); setEditingKey(true); return; }
    localStorage.setItem(LS_KEY, key);
    setStep('processing');
    setOcrStatus('Enviando imagem para a Vision AI do Gemini...');

    try {
      const { topicTitle, lessons } = await callGeminiAPI(imageFile, key);
      if (!lessons.length) {
        toast.error('Nenhuma aula detectada. Tente outra imagem.');
        setStep('upload');
        return;
      }
      setExtractedLessons(lessons);
      setDetectedTopicName(topicTitle || '');
      setApplyTopicRename(Boolean(topicTitle));
      setAllSelected(true);
      setStep('review');
      if (topicTitle) {
        toast.success(`Assunto "${topicTitle}" identificado com ${lessons.length} aula(s)!`);
      } else {
        toast.success(`${lessons.length} aula(s) detectada(s)! Revise abaixo.`);
      }
    } catch (err) {
      console.error('Gemini API Error:', err);
      toast.error('Erro ao processar: ' + err.message);
      setStep('upload');
    }
  };

  // ===== REVIEW HANDLERS =====

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

  const updateName = (id, name) =>
    setExtractedLessons(prev => prev.map(l => l.id === id ? { ...l, name } : l));

  const updateDuration = (id, duration) =>
    setExtractedLessons(prev => prev.map(l => l.id === id ? { ...l, duration } : l));

  const removeLesson = (id) =>
    setExtractedLessons(prev => prev.filter(l => l.id !== id));

  const addManual = () => {
    const id = 'ls_manual_' + Date.now();
    setExtractedLessons(prev => [...prev, { id, name: 'NOVA AULA', duration: '00:00', selected: true }]);
  };

  const handleConfirm = () => {
    const selected = extractedLessons.filter(l => l.selected);
    if (!selected.length) { toast.error('Selecione pelo menos uma aula.'); return; }
    const newTopicName = (applyTopicRename && detectedTopicName.trim()) ? detectedTopicName.trim().toUpperCase() : null;
    onConfirm(selected.map(l => ({ name: l.name, duration: l.duration })), newTopicName);
  };

  const selectedCount = extractedLessons.filter(l => l.selected).length;

  // ===== RENDER =====

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-scanner-title"
        className="relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 ring-1 ring-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="topic-scanner-title" className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Adicionar aulas por imagem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[280px]">
                Assunto: {detectedTopicName && applyTopicRename ? detectedTopicName : topicName}
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

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">

          {/* ===== UPLOAD ===== */}
          {step === 'upload' && (
            <>
              {/* API Key */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Key className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    Google AI Studio — Gemini API Key
                  </label>
                  {!editingKey && (
                    <button
                      type="button"
                      onClick={() => setEditingKey(true)}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors cursor-pointer"
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
                        className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 font-mono text-xs text-slate-900 dark:text-white focus:border-violet-500 outline-none pr-10"
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
                      className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300">
                      {apiKey.slice(0, 8)}{'•'.repeat(16)}{apiKey.slice(-4)}
                    </span>
                  </div>
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
                    ? 'border-violet-500 bg-violet-500/10'
                    : imagePreview
                    ? 'border-violet-500/50 bg-violet-500/5'
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
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clique para trocar a imagem</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Arraste uma screenshot da lista de aulas</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ou cole <kbd className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-slate-800 rounded text-[10px] text-slate-700 dark:text-slate-300 font-mono">Ctrl+V</kbd> ou clique para selecionar
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2.5 bg-violet-50/70 dark:bg-violet-950/25 border border-violet-200/80 dark:border-violet-900/50 rounded-xl p-3.5">
                <AlertTriangle className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-violet-950 dark:text-violet-200/90 leading-relaxed">
                  Capture a <strong>lista de aulas</strong> da plataforma (com o cabeçalho do módulo e as durações) para identificar automaticamente o assunto e extrair cada aula.
                </p>
              </div>
            </>
          )}

          {/* ===== PROCESSING ===== */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-14 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 dark:bg-violet-400/10 ring-1 ring-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{ocrStatus}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Analisando títulos e tempos das aulas...</p>
              </div>
            </div>
          )}

          {/* ===== REVIEW ===== */}
          {step === 'review' && (
            <div className="space-y-3.5">
              {/* Card de Nome do Assunto Detectado */}
              <div className="bg-slate-50/80 dark:bg-slate-950/55 border border-violet-200/90 dark:border-violet-800/60 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-semibold text-violet-800 dark:text-violet-300">
                      Nome do assunto (módulo detectado)
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-violet-700 dark:text-violet-300 select-none">
                    <input
                      type="checkbox"
                      checked={applyTopicRename}
                      onChange={(e) => setApplyTopicRename(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-violet-600 cursor-pointer"
                    />
                    <span>Renomear assunto</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={detectedTopicName}
                  onChange={(e) => setDetectedTopicName(e.target.value.toUpperCase())}
                  onPaste={(e) => e.stopPropagation()}
                  placeholder="Nome do assunto (ex.: ORTOGRAFIA E SEMÂNTICA)..."
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700/60 focus:border-violet-500 rounded-lg px-3 text-xs font-semibold text-slate-900 dark:text-white uppercase outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {detectedTopicName ? (
                    <>Identificado automaticamente na imagem ao lado do número (ex.: <em>3 Ortografia e semântica</em> → <strong>{detectedTopicName}</strong>). O assunto será renomeado ao confirmar.</>
                  ) : (
                    <>Se o cabeçalho tiver um número de módulo (ex.: <em>3 Ortografia e semântica</em>), ele será preenchido aqui para renomear o assunto.</>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {allSelected ? <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" /> : <Square className="w-4 h-4 text-slate-400" />}
                  {allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setStep('upload'); setExtractedLessons([]); }}
                    className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Trocar imagem
                  </button>
                  <button
                    type="button"
                    onClick={addManual}
                    className="flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar manual
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {extractedLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      lesson.selected
                        ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/50'
                        : 'bg-slate-50/30 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-50'
                    }`}
                  >
                    <button type="button" onClick={() => toggleLesson(lesson.id)} className="shrink-0 cursor-pointer">
                      {lesson.selected
                        ? <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        : <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />}
                    </button>
                    <input
                      type="text"
                      value={lesson.name}
                      onChange={(e) => updateName(lesson.id, e.target.value)}
                      onPaste={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-xs font-semibold text-slate-900 dark:text-white outline-none border-b border-transparent focus:border-violet-500 pb-0.5 transition-colors min-w-0"
                    />
                    <input
                      type="text"
                      value={lesson.duration}
                      onChange={(e) => updateDuration(lesson.id, e.target.value)}
                      onPaste={(e) => e.stopPropagation()}
                      className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500 shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => removeLesson(lesson.id)}
                      className="shrink-0 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {extractedLessons.length === 0 && (
                <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nenhuma aula. Clique em &quot;Adicionar manual&quot; para criar uma.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'upload' || step === 'review') && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
            {step === 'upload' ? (
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
                  className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Processar imagem
                </button>
              </div>
            ) : (
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
                  onClick={handleConfirm}
                  disabled={selectedCount === 0}
                  className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Adicionar {selectedCount} aula{selectedCount !== 1 ? 's' : ''} {detectedTopicName && applyTopicRename ? `a "${detectedTopicName}"` : 'ao assunto'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
