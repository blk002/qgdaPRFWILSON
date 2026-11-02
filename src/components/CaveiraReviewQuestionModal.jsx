import React, { useState, useMemo, useEffect } from 'react';
import { useStore, cleanAlternativeText } from '../store/useStore';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, Calendar, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KNOWN_CAVEIRA_ALTERNATIVES = {
  Q111903: [
    { letter: 'A', text: 'Integrated Development Environment.' },
    { letter: 'B', text: 'Infrastructure as a Service.' },
    { letter: 'C', text: 'Platform as a Service.' },
    { letter: 'D', text: 'Azure Cloud Services.' },
    { letter: 'E', text: 'Software as a Service.' }
  ],
  Q112072: [
    { letter: 'A', text: 'Resumo de mensagem.' },
    { letter: 'B', text: 'Certificado digital.' },
    { letter: 'C', text: 'Envelope digital.' },
    { letter: 'D', text: 'Cifragem simétrica.' },
    { letter: 'E', text: 'Senha de uso único.' }
  ]
};

export default function CaveiraReviewQuestionModal({ review, onClose, inline = false, onCompleted }) {
  const { handleReviewSubmit, caveiraQuestions = [], updateCaveiraQuestion, updateFsrsCard, getLocalDateStr, getTodayDate } = useStore();

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

    const rawAlts = storeMatch?.alternatives || review.questionData?.alternatives || KNOWN_CAVEIRA_ALTERNATIVES[qId] || null;
    const validAlts = Array.isArray(rawAlts) && rawAlts.some(a => a && a.text && a.text.trim() !== '' && a.text.trim().toUpperCase() !== a.letter)
      ? rawAlts.map(alt => ({
          ...alt,
          text: cleanAlternativeText(alt?.text || alt?.label || '', alt?.letter)
        }))
      : (KNOWN_CAVEIRA_ALTERNATIVES[qId] || null);

    return {
      id: qId,
      content: storeMatch?.content || review.questionData?.content || parsedContent || rawTitleClean,
      alternatives: validAlts,
      userChoice: storeMatch?.userChoice || review.questionData?.userChoice || parsedUser,
      correctChoice: storeMatch?.correctChoice || review.questionData?.correctChoice || parsedCorrect,
      subject: storeMatch?.subject || review.questionData?.subject || fallbackSub,
      topic: storeMatch?.topic || review.questionData?.topic || fallbackTop,
      canonicalSubject: review.customSubjectName || storeMatch?.canonicalSubject || review.questionData?.canonicalSubject || fallbackSub,
      banca: storeMatch?.banca || review.questionData?.banca || '',
      ano: storeMatch?.ano || review.questionData?.ano || '',
      hit: storeMatch ? Boolean(storeMatch.hit) : Boolean(review.questionData?.hit),
      confidence: storeMatch?.confidence || review.questionData?.confidence || 'sabia',
      userNote: storeMatch?.userNote || review.questionData?.userNote || '',
      teacherComment: storeMatch?.teacherComment || review.questionData?.teacherComment || ''
    };
  }, [review, caveiraQuestions]);
  
  // Opção marcada nesta rodada de revisão
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isEditingBizu, setIsEditingBizu] = useState(false);
  const [bizuDraft, setBizuDraft] = useState('');
  const [isEditingTeacherComment, setIsEditingTeacherComment] = useState(false);
  const [teacherCommentDraft, setTeacherCommentDraft] = useState('');

  const correctChoice = (qData.correctChoice || 'C').toUpperCase();
  const userPrevChoice = (qData.userChoice || '').toUpperCase();
  const hasFullAlternatives = Array.isArray(qData.alternatives) && qData.alternatives.length > 2;
  const bancaUpper = (qData.banca || '').toUpperCase();
  const isKnownMultipleChoiceBanca = ['FGV', 'FCC', 'VUNESP', 'CESGRANRIO', 'IBFC', 'AOCP', 'IDECAN', 'QUADRIX', 'CONSULPLAN', 'OBJETIVA', 'FUNDATEC'].some(b => bancaUpper.includes(b));
  const isMultipleChoiceLetters =
    hasFullAlternatives ||
    ['A', 'B', 'D'].includes(correctChoice) ||
    ['A', 'B', 'D'].includes(userPrevChoice) ||
    isKnownMultipleChoiceBanca;
  const isCebraspeStyle = !isMultipleChoiceLetters;
  const isHit = selectedChoice === correctChoice;

  // Simulação do agendamento FSRS para todos os graus (1: Repetir, 2: Difícil, 3: Bom, 4: Fácil)
  const fsrsOptions = useMemo(() => {
    if (!hasSubmitted) return null;
    const buildOption = (rating) => {
      const pred = updateFsrsCard(review, rating);
      const nextDate = getTodayDate ? getTodayDate() : new Date();
      nextDate.setDate(nextDate.getDate() + pred.nextInterval);
      const nextDateStr = getLocalDateStr(nextDate);
      const [y, m, d] = nextDateStr.split('-');
      return {
        ...pred,
        formattedDate: `${d}/${m}/${y}`,
        shortDate: `${d}/${m}`
      };
    };
    return {
      1: buildOption(1), // Repetir (performance 0.0)
      2: buildOption(2), // Difícil (performance 0.65)
      3: buildOption(3), // Bom (performance 0.85)
      4: buildOption(4)  // Fácil (performance 1.0)
    };
  }, [hasSubmitted, review, updateFsrsCard, getLocalDateStr, getTodayDate]);

  const fsrsPreview = fsrsOptions ? (isHit ? fsrsOptions[3] : fsrsOptions[1]) : null;

  const handleSubmitAnswer = () => {
    if (!selectedChoice) return;
    setHasSubmitted(true);
  };

  const handleFinishReview = (customPerformance) => {
    // 1.0 = Fácil (rating 4), 0.85 = Bom (rating 3), 0.65 = Difícil (rating 2), 0.0 = Repetir (rating 1)
    const performance = typeof customPerformance === 'number'
      ? customPerformance
      : (isHit ? 0.85 : 0.0);
    handleReviewSubmit(review.id, performance);
    if (onCompleted) onCompleted();
    if (onClose) onClose();
  };

  // Atalhos de teclado (A-E / C-E para selecionar, Enter para confirmar, 1/2/3/Enter para graduar FSRS)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key.toUpperCase();
      if (!hasSubmitted) {
        if (isCebraspeStyle && (key === 'C' || key === 'E')) {
          e.preventDefault();
          setSelectedChoice(key);
        } else if (!isCebraspeStyle && ['A', 'B', 'C', 'D', 'E'].includes(key)) {
          e.preventDefault();
          setSelectedChoice(key);
        } else if (e.key === 'Enter' && selectedChoice) {
          e.preventDefault();
          setHasSubmitted(true);
        }
      } else {
        if (isHit && key === '1') {
          e.preventDefault();
          handleReviewSubmit(review.id, 0.65);
          if (onCompleted) onCompleted();
          if (onClose) onClose();
        } else if (isHit && key === '2') {
          e.preventDefault();
          handleReviewSubmit(review.id, 0.85);
          if (onCompleted) onCompleted();
          if (onClose) onClose();
        } else if (isHit && key === '3') {
          e.preventDefault();
          handleReviewSubmit(review.id, 1.0);
          if (onCompleted) onCompleted();
          if (onClose) onClose();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const performance = isHit ? 0.85 : 0.0;
          handleReviewSubmit(review.id, performance);
          if (onCompleted) onCompleted();
          if (onClose) onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasSubmitted, isCebraspeStyle, selectedChoice, isHit, review.id, handleReviewSubmit, onCompleted, onClose]);

  const handleSaveBizu = () => {
    if (qData.id) {
      updateCaveiraQuestion(qData.id, { userNote: bizuDraft.trim() });
    }
    setIsEditingBizu(false);
  };

  const handleSaveTeacherComment = () => {
    if (qData.id) {
      updateCaveiraQuestion(qData.id, { teacherComment: teacherCommentDraft.trim() });
    }
    setIsEditingTeacherComment(false);
  };

  const cardInner = (
    <motion.div
      initial={{ scale: inline ? 0.99 : 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: inline ? 0.99 : 0.95, opacity: 0 }}
      className={`bg-white dark:bg-[#1E2022] border border-slate-200 dark:border-[#383D43] rounded-3xl shadow-2xl w-full p-5 sm:p-7 flex flex-col font-sans ${
        inline ? '' : 'max-w-2xl max-h-[92vh] overflow-y-auto custom-scrollbar'
      }`}
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
            {qData.hit && qData.confidence === 'chute' ? (
              <span className="text-[11px] font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                🎲 Acertou no Chute
              </span>
            ) : qData.hit && qData.confidence === 'duvida' ? (
              <span className="text-[11px] font-black uppercase bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2.5 py-1 rounded-lg">
                🤔 Acertou com Dúvida
              </span>
            ) : (
              <span className="text-[11px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-lg">
                ✗ Errou no Caveira
              </span>
            )}
          </div>

          {!inline && onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm p-1 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
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
                    <span className="leading-snug">{cleanAlternativeText(alt.text || alt.label || alt.letter, alt.letter)}</span>
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

              {/* Comentário do Professor / Gabarito Comentado */}
              {!isEditingTeacherComment ? (
                <div className="mt-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-blue-300 flex items-center gap-1.5">
                      🎓 Comentário do Professor / Gabarito Comentado:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherCommentDraft(qData.teacherComment || '');
                        setIsEditingTeacherComment(true);
                      }}
                      className="text-[11px] font-bold uppercase tracking-wider text-blue-300 hover:text-white underline shrink-0 cursor-pointer"
                    >
                      {qData.teacherComment ? 'Editar Comentário' : '+ Colar Comentário'}
                    </button>
                  </div>
                  {qData.teacherComment ? (
                    <div className="text-slate-200 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto custom-scrollbar pr-1 mt-1">
                      {qData.teacherComment}
                    </div>
                  ) : (
                    <p className="text-[11px] text-blue-200/70 italic">
                      Nenhum comentário salvo ainda. Ao abrir a aba &ldquo;Comentário do Professor&rdquo; no Projeto Caveira, a extensão captura automaticamente — ou clique em &ldquo;+ Colar Comentário&rdquo; acima.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 space-y-2 bg-black/30 p-3 rounded-xl border border-blue-500/40">
                  <textarea
                    rows={4}
                    autoFocus
                    value={teacherCommentDraft}
                    onChange={(e) => setTeacherCommentDraft(e.target.value)}
                    placeholder="Cole ou digite aqui o comentário do professor / fundamentação legal do gabarito..."
                    className="w-full bg-black/40 border border-blue-500/30 rounded-xl p-2.5 text-xs text-white outline-none resize-y"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingTeacherComment(false)}
                      className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTeacherComment}
                      className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Salvar Comentário
                    </button>
                  </div>
                </div>
              )}

              {!isEditingBizu ? (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-center justify-between gap-2">
                  <span>
                    💡 <strong>Seu Bizu Tático:</strong>{' '}
                    {qData.userNote || <em className="opacity-70">Nenhum bizu salvo nesta questão.</em>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setBizuDraft(qData.userNote || '');
                      setIsEditingBizu(true);
                    }}
                    className="text-[11px] font-bold uppercase tracking-wider text-amber-300 hover:text-white underline shrink-0 cursor-pointer"
                  >
                    {qData.userNote ? 'Editar Bizu' : '+ Adicionar Bizu'}
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={bizuDraft}
                    onChange={(e) => setBizuDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBizu()}
                    placeholder="Anote a pegadinha ou artigo da lei para a próxima revisão..."
                    className="flex-1 bg-black/30 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBizu}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de Ação / Graduação FSRS */}
        <div className="mt-auto pt-2">
          {!hasSubmitted ? (
            <button
              disabled={!selectedChoice}
              onClick={handleSubmitAnswer}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:grayscale text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Confirmar Resposta (Enter)
            </button>
          ) : isHit && fsrsOptions ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Avalie o grau de esforço desta questão para agendar no FSRS (Teclas 1, 2 ou 3):
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleFinishReview(0.65)}
                  className="py-3 px-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-md"
                >
                  <span className="text-xs font-black uppercase tracking-wider">😓 Difícil (1)</span>
                  <span className="text-[11px] font-bold text-amber-300">
                    +{fsrsOptions[2].nextInterval}d ({fsrsOptions[2].shortDate})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishReview(0.85)}
                  className="py-3 px-2 rounded-xl border border-emerald-500/50 bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-lg ring-2 ring-emerald-500/30"
                >
                  <span className="text-xs font-black uppercase tracking-wider">🎯 Bom (2 / Enter)</span>
                  <span className="text-[11px] font-bold text-emerald-100">
                    +{fsrsOptions[3].nextInterval}d ({fsrsOptions[3].shortDate})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinishReview(1.0)}
                  className="py-3 px-2 rounded-xl border border-blue-500/40 bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-md"
                >
                  <span className="text-xs font-black uppercase tracking-wider">⚡ Fácil (3)</span>
                  <span className="text-[11px] font-bold text-blue-300">
                    +{fsrsOptions[4].nextInterval}d ({fsrsOptions[4].shortDate})
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleFinishReview(0.0)}
              className="w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white"
            >
              <span>
                🔁 Reagendar para Amanhã (+{fsrsOptions?.[1]?.nextInterval || 1}d) e Ir para a Próxima (Enter)
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
    </motion.div>
  );

  if (inline) {
    return cardInner;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[130] p-3 sm:p-4 font-sans">
      {cardInner}
    </div>
  );
}
