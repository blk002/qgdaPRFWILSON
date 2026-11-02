import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { BrainCircuit, CheckCircle2, XCircle, RotateCcw, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CaveiraReviewQuestionModal({ review, onClose }) {
  const { handleReviewSubmit, useStore: store } = useStore();
  const qData = review.questionData || {};
  
  // Opção marcada nesta rodada de revisão
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isCebraspeStyle = !qData.alternatives || qData.alternatives.length === 0;
  const correctChoice = (qData.correctChoice || 'C').toUpperCase();
  const isHit = selectedChoice === correctChoice;

  const handleSubmitAnswer = () => {
    if (!selectedChoice) return;
    setHasSubmitted(true);
  };

  const handleFinishReview = () => {
    // 1.0 para acerto no FSRS (nota 4 Easy ou 3 Good), 0.0 para erro (nota 1 Again)
    const performance = isHit ? 1.0 : 0.0;
    handleReviewSubmit(review.id, performance);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[130] p-3 sm:p-4 font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#1E2022] border border-slate-200 dark:border-[#383D43] rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Cabeçalho do Card de Revisão */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-[#2E3236]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-purple-600/15 text-purple-400 border border-purple-500/25 text-xs font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" /> FSRS • Refazer Questão
            </span>
            <span className="font-mono text-xs font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              {qData.id || review.id}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-[#26292C] px-2.5 py-1 rounded-lg">
              {qData.canonicalSubject || qData.subject || 'PRF'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm p-1 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Trilha do Assunto */}
        <p className="text-xs font-normal normal-case text-slate-500 dark:text-[#A0AAB2] mb-3">
          📂 {qData.subject} {qData.topic && qData.topic !== qData.subject ? `➔ ${qData.topic}` : ''}
        </p>

        {/* Enunciado da Questão */}
        <div className="text-[15px] sm:text-[16px] font-medium text-slate-800 dark:text-[#F1F5F9] leading-[1.6] bg-slate-50 dark:bg-[#26292C] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-[#34383D] mb-5">
          {qData.content || 'Sem texto de enunciado cadastrado.'}
        </div>

        {/* Alternativas Interativas */}
        <div className="space-y-2.5 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Selecione a alternativa correta:
          </p>

          {isCebraspeStyle ? (
            /* Estilo Cebraspe: Certo / Errado */
            <div className="grid grid-cols-2 gap-3">
              {[
                { letter: 'C', label: 'Certo' },
                { letter: 'E', label: 'Errado' }
              ].map(opt => {
                const isSelected = selectedChoice === opt.letter;
                let btnStyle = 'border-slate-200 dark:border-[#383D43] bg-slate-50 dark:bg-[#26292C] hover:border-slate-400';

                if (hasSubmitted) {
                  if (opt.letter === correctChoice) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40';
                  } else if (isSelected && !isHit) {
                    btnStyle = 'border-red-500 bg-red-500/20 text-red-300 ring-2 ring-red-500/40';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-purple-500 bg-purple-500/20 text-white ring-2 ring-purple-500/40';
                }

                return (
                  <button
                    key={opt.letter}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedChoice(opt.letter)}
                    className={`p-4 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-md bg-black/20 flex items-center justify-center font-mono text-xs">
                      {opt.letter}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Estilo Múltipla Escolha (A, B, C, D, E) */
            <div className="space-y-2">
              {qData.alternatives.map(alt => {
                const isSelected = selectedChoice === alt.letter;
                let btnStyle = 'border-slate-200 dark:border-[#383D43] bg-slate-50 dark:bg-[#26292C] hover:border-slate-400 text-slate-700 dark:text-[#E2E8F0]';

                if (hasSubmitted) {
                  if (alt.letter === correctChoice) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40';
                  } else if (isSelected && !isHit) {
                    btnStyle = 'border-red-500 bg-red-500/20 text-red-300 ring-2 ring-red-500/40';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-purple-500 bg-purple-500/20 text-white ring-2 ring-purple-500/40';
                }

                return (
                  <button
                    key={alt.letter}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedChoice(alt.letter)}
                    className={`w-full p-3 sm:p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-start gap-3 ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-md bg-black/20 shrink-0 flex items-center justify-center font-mono font-bold text-xs mt-0.5">
                      {alt.letter}
                    </span>
                    <span className="leading-snug">{alt.text || alt.label || alt.letter}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Imediato pós-resposta */}
        <AnimatePresence>
          {hasSubmitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className={`p-4 rounded-2xl border mb-5 ${
                isHit
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/40 bg-red-500/10 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 font-black text-sm">
                {isHit ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>PARABÉNS! VOCÊ ACERTOU NA REVISÃO!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>ATENÇÃO! VOCÊ ERROU NOVAMENTE!</span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Gabarito oficial: <strong>{correctChoice}</strong>.
                {isHit
                  ? ' O FSRS calculou um aumento de estabilidade. Esta questão será espaçada para os próximos dias.'
                  : ' O FSRS resetou a estabilidade para esta questão. Ela voltará para a fila de amanhã para fixação.'}
              </p>

              {qData.userNote && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
                  💡 <strong>Seu Bizu Tático:</strong> {qData.userNote}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de Ação */}
        <div className="mt-auto pt-2">
          {!hasSubmitted ? (
            <button
              disabled={!selectedChoice}
              onClick={handleSubmitAnswer}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:grayscale text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Confirmar Resposta
            </button>
          ) : (
            <button
              onClick={handleFinishReview}
              className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isHit
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <span>Concluir Revisão e Agendar FSRS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
