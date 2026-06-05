import React from 'react';
import { Save } from 'lucide-react';

export default function NotesDrawer({ 
  isOpen, 
  onClose, 
  topic, 
  noteContent, 
  setNoteContent, 
  onSave 
}) {
  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Painel lateral (Drawer) */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 z-10 animate-fade-in-right">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/60">
          <div>
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-0.5">
              Anotações Operacionais
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
              {topic.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Caderno de Notas do Tópico
          </label>
          <textarea 
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Digite aqui as suas anotações estratégicas, mnemônicos, leis secas ou pegadinhas de prova observadas neste tópico..."
            className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 resize-none font-medium leading-relaxed custom-scrollbar"
          ></textarea>
        </div>

        {/* Ações */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-950/30">
          <button 
            onClick={onSave}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Salvar Anotações
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
