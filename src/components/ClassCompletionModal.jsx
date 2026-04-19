import React, { useState } from 'react';
import { Play } from 'lucide-react';

export default function ClassCompletionModal({ isOpen, onClose, onConfirm, topicName, maxClasses }) {
  const [numClasses, setNumClasses] = useState(1);

  if (!isOpen) return null;

  const currentNum = Number(numClasses) || 0;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4 fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-50"></div>
        
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Play className="w-8 h-8 fill-current" />
        </div>
        
        <h3 className="text-xl font-black mb-1 text-slate-800 dark:text-slate-100 tracking-tight uppercase">Queimar Teoria?</h3>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Matéria: {topicName}</p>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase">Quantidade de Aulas</span>
            <input 
              type="number" 
              min="1" 
              max={maxClasses} 
              value={numClasses}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setNumClasses('');
                } else {
                  const n = parseInt(val);
                  if (!isNaN(n)) {
                    setNumClasses(Math.max(1, Math.min(maxClasses, n)));
                  }
                }
              }}
              onBlur={() => {
                if (numClasses === '') setNumClasses(1);
              }}
              className="w-16 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-center font-black text-blue-600 dark:text-blue-400 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <input 
            type="range" 
            min="1" 
            max={maxClasses} 
            value={Number(numClasses) || 1}
            onChange={(e) => setNumClasses(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600 mb-6"
          />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase">Ganho Total XP</span>
              <span className="text-sm font-black text-emerald-600">+{currentNum * 100}</span>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[8px] font-black text-slate-400 uppercase">Moedas Totais</span>
               <span className="text-sm font-black text-yellow-500">+{currentNum * 10}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onConfirm(currentNum || 1)}
            disabled={!numClasses}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            CONFIRMAR {currentNum || 1} AULAS
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}