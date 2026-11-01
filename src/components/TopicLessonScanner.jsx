import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, UploadCloud, Camera, Trash2, Loader2, CheckSquare,
  Square, Key, Eye, EyeOff, Plus, AlertTriangle, Check
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

  const normalizeDuration = (raw) => {
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
  };

  const cleanName = (str) => {
    let s = str
      .replace(/^[\s\-=*|\\/"":;.,!?#@&()\[\]{}<>_~`^+%$]+/, '')
      .replace(/[\s\-=*|\\/"":;.,!?#@&()\[\]{}<>_~`^+%$]+$/, '')
      .replace(/^[^A-ZÀ-Üa-zà-ü]*?(?=[A-ZÀ-Ü]{2,})/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    s = s.replace(/^[A-ZÀ-Ü0-9]{1}\s*[|)\]}\s]\s*(?=[A-ZÀ-Ü]{2,}.{3,})/, '');
    if (s.length < 3) s = str.toUpperCase().replace(/[^A-ZÀ-Ü0-9\s\-]/g, '').trim();
    s = s.replace(/[.,;:!?|]+$/, '').trim();
    return s;
  };

  const parseOCRText = (text) => {
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
          results.push({ id: 'ls_' + Date.now() + '_' + results.length, name: cleaned, duration: ld.duration, selected: true });
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
            results.push({ id: 'ls_' + Date.now() + '_' + results.length, name: cleaned, duration: ld.duration, selected: true });
            usedNameLines.add(j);
          }
          break;
        }
      }
    }

    const seen = new Set();
    return results.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true; });
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const callGeminiAPI = async (file, key) => {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/png';
    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: "Você é um assistente estruturador de dados de estudos. Analise a imagem fornecida, que é uma captura de tela de uma lista de aulas de uma plataforma de cursos.\n\nREGRAS IMPORTANTES:\n1. Identifique cada card/item de aula visível.\n2. Se um card tiver um título indicando múltiplas aulas (exemplos: 'PLANO INCLINADO - AULAS 01 A 03', 'FORÇA - AULAS 02 E 03', 'TEMA X - AULAS 01-04'), você DEVE expandir em entradas separadas: uma por aula. A primeira aula recebe o tempo exibido no card; as demais recebem '00:00'. O nome de cada entrada deve identificar a aula individual (ex: 'PLANO INCLINADO - AULA 01', 'PLANO INCLINADO - AULA 02', 'PLANO INCLINADO - AULA 03').\n3. Se o card tiver apenas UMA aula, crie somente uma entrada com o tempo correto.\n4. Converta todos os nomes para CAIXA ALTA, preservando acentos.\n5. Limpe badges de progresso, ícones e elementos visuais dos nomes.\n6. A duração deve estar no formato MM:SS ou H:MM:SS.\n\nRetorne SOMENTE um array JSON válido (sem texto extra, sem blocos de código):\n[\n  { \"name\": \"NOME DA AULA EM CAIXA ALTA\", \"duration\": \"MM:SS\" }\n]" }
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
      throw new Error(err?.error?.message || 'Erro na API do Gemini');
    }

    const data = await res.json();
    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item.name && item.name.trim().length > 1)
          .map((item, idx) => ({
            id: 'ls_' + Date.now() + '_' + idx,
            name: String(item.name).toUpperCase().trim(),
            duration: String(item.duration || '00:00').trim(),
            selected: true
          }));
      }
      return [];
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
    setOcrStatus('Enviando imagem para o Gemini...');

    try {
      const lessons = await callGeminiAPI(imageFile, key);
      if (!lessons.length) {
        toast.error('Nenhuma aula detectada. Tente outra imagem.');
        setStep('upload');
        return;
      }
      setExtractedLessons(lessons);
      setAllSelected(true);
      setStep('review');
      toast.success(`${lessons.length} aula(s) detectada(s)! Revise abaixo.`);
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
    onConfirm(selected.map(l => ({ name: l.name, duration: l.duration })));
  };

  const selectedCount = extractedLessons.filter(l => l.selected).length;

  // ===== RENDER =====

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#0f172a] to-[#1e293b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Adicionar Aulas via Vision AI</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[220px]">
                Assunto: {topicName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">

          {/* ===== UPLOAD ===== */}
          {step === 'upload' && (
            <>
              {/* API Key */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Key className="w-3 h-3 text-violet-400" /> Google AI Studio — Gemini API Key
                  </label>
                  {!editingKey && (
                    <button onClick={() => setEditingKey(true)} className="text-[10px] font-bold text-slate-500 hover:text-violet-400 transition-colors uppercase">
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
                        className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:border-violet-500 outline-none pr-10"
                      />
                      <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (!apiKey.trim()) { toast.error('Digite uma chave válida.'); return; }
                        localStorage.setItem(LS_KEY, apiKey.trim());
                        setEditingKey(false);
                        toast.success('Chave salva!');
                      }}
                      className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-300">
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
                    ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
                    : imagePreview
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-900/30'
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
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-lg border border-slate-700" />
                    <p className="text-xs text-slate-400 font-medium">Clique para trocar a imagem</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center">
                      <UploadCloud className="w-7 h-7 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-300">Arraste uma screenshot da lista de aulas</p>
                      <p className="text-xs text-slate-500 mt-1">
                        ou cole <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">Ctrl+V</kbd> ou clique
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2 bg-violet-900/20 border border-violet-800/30 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-violet-300/80 font-medium leading-relaxed">
                  Tire uma screenshot da <strong>lista de aulas</strong> da plataforma (com nome e duração visíveis) e a Vision AI vai extrair automaticamente.
                </p>
              </div>

              {/* Botão processar */}
              <button
                onClick={processImage}
                disabled={!imageFile}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Processar com Gemini AI
              </button>
            </>
          )}

          {/* ===== PROCESSING ===== */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-pulse">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-white">{ocrStatus}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Gemini Flash — leva apenas 2-3 segundos</p>
              </div>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ===== REVIEW ===== */}
          {step === 'review' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button onClick={toggleAll} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-violet-400" /> : <Square className="w-4 h-4" />}
                  {allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setStep('upload'); setExtractedLessons([]); }}
                    className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    ← Trocar imagem
                  </button>
                  <button
                    onClick={addManual}
                    className="flex items-center gap-1 text-[10px] font-black text-violet-400 hover:text-white bg-violet-900/30 px-2 py-1 rounded transition-colors uppercase"
                  >
                    <Plus className="w-3 h-3" /> Adicionar manual
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {extractedLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      lesson.selected
                        ? 'bg-violet-900/20 border-violet-800/50'
                        : 'bg-slate-900/30 border-slate-800/50 opacity-50'
                    }`}
                  >
                    <button onClick={() => toggleLesson(lesson.id)} className="shrink-0">
                      {lesson.selected
                        ? <CheckSquare className="w-4 h-4 text-violet-400" />
                        : <Square className="w-4 h-4 text-slate-600" />}
                    </button>
                    <input
                      type="text"
                      value={lesson.name}
                      onChange={(e) => updateName(lesson.id, e.target.value)}
                      onPaste={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent text-xs font-bold text-white outline-none border-b border-transparent focus:border-violet-500 pb-0.5 transition-colors min-w-0"
                    />
                    <input
                      type="text"
                      value={lesson.duration}
                      onChange={(e) => updateDuration(lesson.id, e.target.value)}
                      onPaste={(e) => e.stopPropagation()}
                      className="w-14 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-center text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500 shrink-0"
                    />
                    <button onClick={() => removeLesson(lesson.id)} className="shrink-0 p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {extractedLessons.length === 0 && (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500 font-bold">Nenhuma aula. Clique em "Adicionar manual" para criar uma.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="px-5 pb-5 pt-3 border-t border-slate-800 shrink-0">
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Adicionar {selectedCount} aula{selectedCount !== 1 ? 's' : ''} ao assunto
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
