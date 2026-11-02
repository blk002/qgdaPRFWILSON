import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CaveiraReviewQuestionModal({ review, onClose }) {
  const { handleReviewSubmit, caveiraQuestions = [], updateFsrsCard, getLocalDateStr, getTodayDate } = useStore();

  // Resolve dados completos da questão mesmo se o cartão for antigo (pré-migração)
  const qData = useMemo(() => {
    const idMatch =
      String(review.caveiraQuestionId || '').match(/Q\d+/i) ||
      String(review.questionData?.id || '').match(/Q\d+/i) ||
      String(review.id || '').match(/Q\d+/i) ||
      String(review.topicName || '').match(/Q\d+/i);
    const qId = idMatch ? idMatch[0].toUpperCase() : (review.questionData?.id || review.caveiraQuestionId || review.id);

    const storeMatch = caveiraQuestions.find(q => String(q.id || '').toUpperCase() === qId);

    let parsedContent = '';
    let parsedCorrect = 'C';
    let parsedUser = 'E';
    if (review.notes) {
      const enunMatch = review.notes.match(/Enunciado:\s*([\s\S]*?)(?:\nGabarito:|$)/i);
      if (enunMatch) parsedContent = enunMatch[1].trim();
      const gabMatch = review.notes.match(/Gabarito:\s*([A-E])\s*\(Voc[eê] marcou:\s*([A-E])\)/i);
      if (gabMatch) {
        parsedCorrect = gabMatch[1].toUpperCase();
        parsedUser = gabMatch[2].toUpperCase();
      }
    }

    const rawTitleClean = String(review.topicName || '').replace(/^\[Caveira\s*Q?\d*\]\s*/i, '').trim();
    const titleParts = rawTitleClean.split(/\s*(?:->|➔)\s*/);
    const fallbackSub = review.customSubjectName || titleParts[0] || 'Questão Caveira';
    const fallbackTop = titleParts.slice(1).join(' ➔ ') || fallbackSub;

    return {
      id: qId,
      content: storeMatch?.content || review.questionData?.content || parsedContent || rawTitleClean,
      alternatives: storeMatch?.alternatives || review.questionData?.alternatives || null,
      userChoice: storeMatch?.userChoice || review.questionData?.userChoice || parsedUser,
      correctChoice: storeMatch?.correctChoice || review.questionData?.correctChoice || parsedCorrect,
      subject: storeMatch?.subject || review.questionData?.subject || fallbackSub,
      topic: storeMatch?.topic || review.questionData?.topic || fallbackTop,
      canonicalSubject: review.customSubjectName || storeMatch?.canonicalSubject || review.questionData?.canonicalSubject || fallbackSub,
      banca: storeMatch?.banca || review.questionData?.banca || '',
      ano: storeMatch?.ano || review.questionData?.ano || '',
      userNote: storeMatch?.userNote || review.questionData?.userNote || ''
    };
  }, [review, caveiraQuestions]);
  
  // Opção marcada nesta rodada de revisão
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const correctChoice = (qData.correctChoice || 'C').toUpperCase();
  const userPrevChoice = (qData.userChoice || '').toUpperCase();
  const hasFullAlternatives = Array.isArray(qData.alternatives) && qData.alternatives.length > 0;
  const isMultipleChoiceLetters =
    hasFullAlternatives ||
    ['A', 'B', 'D'].includes(correctChoice) ||
    ['A', 'B', 'D'].includes(userPrevChoice) ||
    (qData.banca && !qData.banca.toUpperCase().includes('CEBRASPE') && !qData.banca.toUpperCase().includes('CESPE'));
  const isCebraspeStyle = !isMultipleChoiceLetters;
  const isHit = selectedChoice === correctChoice;

  // Simulação do agendamento FSRS conforme acerto ou erro
  const fsrsPreview = useMemo(() => {
    if (!hasSubmitted) return null;
    const rating = isHit ? 4 : 1;
    const pred = updateFsrsCard(review, rating);
    const nextDate = getTodayDate ? getTodayDate() : new Date();
    nextDate.setDate(nextDate.getDate() + pred.nextInterval);
    const nextDateStr = getLocalDateStr(nextDate);
    const [y, m, d] = nextDateStr.split('-');
    return {
      ...pred,
      formattedDate: `${d}/${m}/${y}`
    };
  }, [hasSubmitted, isHit, review, updateFsrsCard, getLocalDateStr, getTodayDate]);

  const handleSubmitAnswer = () => {
    if (!selectedChoice) return;
    setHasSubmitted(true);
  };

  const handleFinishReview = () => {
    // 1.0 para acerto no FSRS (nota 4 Easy), 0.0 para erro (nota 1 Again)
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
          ) : hasFullAlternatives ? (
            /* Estilo Múltipla Escolha com Texto Completo (A, B, C, D, E) */
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
          ) : (
            /* Estilo Múltipla Escolha (Botões A, B, C, D, E para questões sem texto das alternativas salvo) */
            <div className="grid grid-cols-5 gap-2.5">
              {['A', 'B', 'C', 'D', 'E'].map(letter => {
                const isSelected = selectedChoice === letter;
                let btnStyle = 'border-slate-200 dark:border-[#383D43] bg-slate-50 dark:bg-[#26292C] hover:border-slate-400 text-slate-700 dark:text-[#E2E8F0]';

                if (hasSubmitted) {
                  if (letter === correctChoice) {
                    btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40';
                  } else if (isSelected && !isHit) {
                    btnStyle = 'border-red-500 bg-red-500/20 text-red-300 ring-2 ring-red-500/40';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-purple-500 bg-purple-500/20 text-white ring-2 ring-purple-500/40';
                }

                return (
                  <button
                    key={letter}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedChoice(letter)}
                    className={`p-3.5 rounded-xl border text-center font-mono font-black text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${btnStyle}`}
                  >
                    <span>{letter}</span>
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
                Gabarito oficial: <strong>{correctChoice}</strong> (Você marcou hoje: <strong>{selectedChoice}</strong>).
                {isHit
                  ? ' O FSRS calculou um aumento de estabilidade e espaçou sua próxima revisão.'
                  : ' O FSRS reajustou a estabilidade para fixação prioritária.'}
              </p>

              {fsrsPreview && (
                <div className="mt-3 p-3 rounded-xl bg-black/25 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Dificuldade</span>
                      <span className="font-black text-white">{fsrsPreview.difficulty.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Estabilidade</span>
                      <span className="font-black text-emerald-400">{fsrsPreview.stability.toFixed(1)}d</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Novo Intervalo</span>
                      <span className="font-black text-blue-400">+{fsrsPreview.nextInterval} {fsrsPreview.nextInterval === 1 ? 'dia' : 'dias'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-200 font-bold bg-white/5 px-2.5 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Próxima revisão: <strong>{fsrsPreview.formattedDate}</strong></span>
                  </div>
                </div>
              )}

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
