import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BookOpen, Search, Tag, Trash2, Save, Calendar, ChevronLeft, ChevronRight, PenLine, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUICK_TAGS = [
  { label: 'Direito Penal', color: 'bg-red-500/10 border-red-500/20 text-red-500' },
  { label: 'Direito Constitucional', color: 'bg-blue-500/10 border-blue-500/20 text-blue-500' },
  { label: 'Direito Administrativo', color: 'bg-purple-500/10 border-purple-500/20 text-purple-500' },
  { label: 'Legislação de Trânsito', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500' },
  { label: 'Processo Penal', color: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
  { label: 'TAF', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' },
  { label: 'Revisão FSRS', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' },
  { label: 'Simulado', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500' },
  { label: 'Dificuldade', color: 'bg-rose-500/10 border-rose-500/20 text-rose-500' },
  { label: 'Insight', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' },
];

function getTagStyle(label) {
  return QUICK_TAGS.find(t => t.label === label)?.color || 'bg-slate-500/10 border-slate-500/20 text-slate-400';
}

// Calendário de contribuições estilo GitHub
function ContributionCalendar({ diary }) {
  const today = new Date();
  const cells = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    const entry = diary[key];
    const hasEntry = entry && entry.text?.trim().length > 0;
    const intensity = hasEntry ? Math.min(4, Math.ceil(entry.text.length / 100)) : 0;
    return { key, date: d, hasEntry, intensity, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) };
  });

  const intensityClass = (n) => {
    if (n === 0) return 'bg-slate-800 dark:bg-slate-800';
    if (n === 1) return 'bg-blue-900/60';
    if (n === 2) return 'bg-blue-700/70';
    if (n === 3) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {cells.map(cell => (
          <div key={cell.key} className="relative group" title={cell.label}>
            <div className={`w-6 h-6 rounded-md transition-all cursor-default hover:scale-110 border ${cell.hasEntry ? 'border-blue-500/30' : 'border-slate-700/50'} ${intensityClass(cell.intensity)}`} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-slate-950 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap border border-slate-700">
                {cell.label}{cell.hasEntry ? ' ✓' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px] text-slate-500 font-bold uppercase">Menos</span>
        {[0,1,2,3,4].map(n => <div key={n} className={`w-3.5 h-3.5 rounded-sm ${intensityClass(n)}`} />)}
        <span className="text-[9px] text-slate-500 font-bold uppercase">Mais</span>
      </div>
    </div>
  );
}

export default function DiarioEstudos() {
  const { studyDiary = {}, saveDiaryEntry, deleteDiaryEntry } = useStore();
  
  const todayKey = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [editorText, setEditorText] = useState(studyDiary[todayKey]?.text || '');
  const [selectedTags, setSelectedTags] = useState(studyDiary[todayKey]?.tags || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [saved, setSaved] = useState(false);

  const currentEntry = studyDiary[selectedDate];
  const totalEntries = Object.keys(studyDiary).filter(k => studyDiary[k]?.text?.trim()).length;
  const totalDays = 30;
  const activeDays = Object.keys(studyDiary).filter(k => {
    const d = new Date(k);
    const now = new Date();
    return (now - d) <= 30 * 86400000 && studyDiary[k]?.text?.trim();
  }).length;

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
    const entry = studyDiary[dateKey];
    setEditorText(entry?.text || '');
    setSelectedTags(entry?.tags || []);
    setSaved(false);
  };

  const handleSave = () => {
    if (!editorText.trim()) return;
    saveDiaryEntry(selectedDate, editorText, selectedTags);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    deleteDiaryEntry(selectedDate);
    setEditorText('');
    setSelectedTags([]);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    setSaved(false);
  };

  // Entradas filtradas para o histórico
  const allEntries = useMemo(() => {
    return Object.entries(studyDiary)
      .filter(([, v]) => v?.text?.trim())
      .filter(([, v]) => !searchTerm || v.text.toLowerCase().includes(searchTerm.toLowerCase()) || (v.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
      .sort(([a], [b]) => b.localeCompare(a));
  }, [studyDiary, searchTerm]);

  const formatDate = (key) => {
    const d = new Date(key + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const isToday = selectedDate === todayKey;

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10 px-4">

      {/* Header */}
      <div className="relative bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
              <BookOpen className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Diário de Estudos</h2>
              <p className="text-slate-400 text-xs font-bold">Registre sua jornada dia a dia</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <div className="text-xl font-black text-white">{totalEntries}</div>
              <div className="text-[9px] text-slate-400 font-black uppercase">Entradas</div>
            </div>
            <div className="text-center bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <div className="text-xl font-black text-blue-400">{activeDays}/{totalDays}</div>
              <div className="text-[9px] text-slate-400 font-black uppercase">Dias ativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendário de Contribuições */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
        <h3 className="font-black text-slate-700 dark:text-slate-300 uppercase text-xs mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" /> Atividade — Últimos 30 dias
        </h3>
        <ContributionCalendar diary={studyDiary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Barra de data */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 capitalize">{formatDate(selectedDate)}</span>
                {isToday && <span className="text-[9px] font-black bg-blue-600/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase">Hoje</span>}
              </div>
              <input type="date" value={selectedDate} max={todayKey}
                onChange={e => handleSelectDate(e.target.value)}
                className="text-xs font-bold text-slate-400 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer" />
            </div>

            {/* Tags rápidas */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags Rápidas
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map(tag => (
                  <button key={tag.label} onClick={() => toggleTag(tag.label)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-black transition-all ${selectedTags.includes(tag.label) ? tag.color + ' scale-105' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-400'}`}>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="p-6">
              <textarea
                value={editorText}
                onChange={e => { setEditorText(e.target.value); setSaved(false); }}
                placeholder="O que você estudou hoje? Escreva dificuldades, insights e pontos de atenção..."
                rows={10}
                className="w-full bg-transparent text-slate-700 dark:text-slate-200 text-sm font-medium leading-relaxed outline-none resize-none placeholder:text-slate-400 placeholder:font-normal"
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold">{editorText.length} caracteres</span>
                <div className="flex gap-2">
                  {currentEntry && (
                    <button onClick={handleDelete}
                      className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={handleSave} disabled={!editorText.trim()}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${editorText.trim() ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>
                    {saved ? <><Sparkles className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar no histórico..."
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all" />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            <AnimatePresence>
              {allEntries.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-wider">Nenhuma entrada ainda</p>
                  <p className="text-[10px] mt-1">Comece escrevendo sobre o que estudou hoje!</p>
                </div>
              )}
              {allEntries.map(([key, entry]) => (
                <motion.button key={key} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  onClick={() => handleSelectDate(key)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedDate === key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">
                      {new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {key === todayKey && <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded">HOJE</span>}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-medium leading-relaxed mb-2">{entry.text}</p>
                  {entry.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${getTagStyle(tag)}`}>{tag}</span>
                      ))}
                      {entry.tags.length > 3 && <span className="text-[8px] text-slate-400 font-bold">+{entry.tags.length - 3}</span>}
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
