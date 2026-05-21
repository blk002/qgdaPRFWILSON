import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Library, Award, CheckCircle, AlertCircle, RefreshCw, ChevronRight, 
  Sparkles, HelpCircle, ArrowRight, Play, Coins, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';

const SYNTAX_SENTENCES = [
  {
    id: 1,
    sentence: "Os policiais rodoviários federais fiscalizaram a rodovia com rigor ontem.",
    segments: [
      { text: "Os policiais rodoviários federais", role: "Sujeito Simples" },
      { text: "fiscalizaram", role: "Verbo Transitivo Direto" },
      { text: "a rodovia", role: "Objeto Direto" },
      { text: "com rigor", role: "Adjunto Adverbial de Modo" },
      { text: "ontem", role: "Adjunto Adverbial de Tempo" }
    ],
    explanation: [
      { term: "Os policiais rodoviários federais", explanation: "Sujeito Simples: o núcleo é o substantivo 'policiais'. Os termos 'os', 'rodoviários' e 'federais' funcionam como adjuntos adnominais." },
      { term: "fiscalizaram", explanation: "Verbo Transitivo Direto (VTD): a ação de fiscalizar pede um complemento direto, sem preposição obrigatória ('fiscalizaram o quê?')." },
      { term: "a rodovia", explanation: "Objeto Direto: complementa o sentido do verbo transitivo direto 'fiscalizaram' sem preposição." },
      { term: "com rigor", explanation: "Adjunto Adverbial de Modo: expressa a circunstância/maneira como a ação de fiscalizar foi executada." },
      { term: "ontem", explanation: "Adjunto Adverbial de Tempo: indica o momento em que a fiscalização ocorreu." }
    ]
  },
  {
    id: 2,
    sentence: "Os motoristas imprudentes causaram um grave acidente na BR-116.",
    segments: [
      { text: "Os motoristas imprudentes", role: "Sujeito Simples" },
      { text: "causaram", role: "Verbo Transitivo Direto" },
      { text: "um grave acidente", role: "Objeto Direto" },
      { text: "na BR-116", role: "Adjunto Adverbial de Lugar" }
    ],
    explanation: [
      { term: "Os motoristas imprudentes", explanation: "Sujeito Simples: o núcleo do sujeito é o substantivo 'motoristas'. 'Os' e 'imprudentes' são adjuntos adnominais." },
      { term: "causaram", explanation: "Verbo Transitivo Direto: exige complemento sem preposição exigida pelo próprio verbo ('quem causa, causa algo')." },
      { term: "um grave acidente", explanation: "Objeto Direto: é o termo paciente que completa o sentido do VTD 'causaram'." },
      { term: "na BR-116", explanation: "Adjunto Adverbial de Lugar: traz a circunstância de espaço indicando onde o acidente ocorreu." }
    ]
  },
  {
    id: 3,
    sentence: "O inspetor da PRF entregou o relatório de multas ao superintendente.",
    segments: [
      { text: "O inspetor da PRF", role: "Sujeito Simples" },
      { text: "entregou", role: "Verbo Transitivo Direto e Indireto" },
      { text: "o relatório de multas", role: "Objeto Direto" },
      { text: "ao superintendente", role: "Objeto Indireto" }
    ],
    explanation: [
      { term: "O inspetor da PRF", explanation: "Sujeito Simples: o núcleo do sujeito é 'inspetor'. 'Da PRF' é um adjunto adnominal especificando a origem do inspetor." },
      { term: "entregou", explanation: "Verbo Transitivo Direto e Indireto (VTDI): exige dois complementos (um direto/sem preposição e um indireto/com preposição)." },
      { term: "o relatório de multas", explanation: "Objeto Direto: é a coisa entregue (complemento não preposicionado)." },
      { term: "ao superintendente", explanation: "Objeto Indireto: é o destinatário da entrega (introduzido pela preposição 'a' + artigo 'o')." }
    ]
  },
  {
    id: 4,
    sentence: "Durante a noite fria, o motorista cansado dormia profundamente.",
    segments: [
      { text: "Durante a noite fria", role: "Adjunto Adverbial de Tempo" },
      { text: "o motorista cansado", role: "Sujeito Simples" },
      { text: "dormia", role: "Verbo Intransitivo" },
      { text: "profundamente", role: "Adjunto Adverbial de Modo" }
    ],
    explanation: [
      { term: "Durante a noite fria", explanation: "Adjunto Adverbial de Tempo: indica quando a ação ocorreu, anteposto e isolado por vírgula." },
      { term: "o motorista cansado", explanation: "Sujeito Simples: quem realiza a ação de dormir (núcleo: 'motorista')." },
      { term: "dormia", explanation: "Verbo Intransitivo: tem sentido completo e não necessita de objeto direto ou indireto para fazer sentido." },
      { term: "profundamente", explanation: "Adjunto Adverbial de Modo (ou intensidade): indica o modo/intensidade com que o motorista dormia." }
    ]
  },
  {
    id: 5,
    sentence: "A nova viatura foi conduzida pelo policial experiente.",
    segments: [
      { text: "A nova viatura", role: "Sujeito Paciente" },
      { text: "foi conduzida", role: "Locução Verbal Passiva" },
      { text: "pelo policial experiente", role: "Agente da Passiva" }
    ],
    explanation: [
      { term: "A nova viatura", explanation: "Sujeito Paciente: sofre a ação expressa pelo verbo na voz passiva analítica." },
      { term: "foi conduzida", explanation: "Locução Verbal Passiva: formada pelo verbo auxiliar 'ser' + particípio do verbo principal 'conduzir'." },
      { term: "pelo policial experiente", explanation: "Agente da Passiva: termo que executa a ação expressa pela voz passiva analítica." }
    ]
  },
  {
    id: 6,
    sentence: "O tráfego de veículos pesados continuava lento sob a chuva intensa.",
    segments: [
      { text: "O tráfego de veículos pesados", role: "Sujeito Simples" },
      { text: "continuava", role: "Verbo de Ligação" },
      { text: "lento", role: "Predicativo do Sujeito" },
      { text: "sob a chuva intensa", role: "Adjunto Adverbial de Lugar" }
    ],
    explanation: [
      { term: "O tráfego de veículos pesados", explanation: "Sujeito Simples: o núcleo é o substantivo 'tráfego'. 'De veículos pesados' atua como adjunto adnominal." },
      { term: "continuava", explanation: "Verbo de Ligação (VL): apenas liga o sujeito a um estado ou atributo ('lento'), sem indicar ação dinâmica." },
      { term: "lento", explanation: "Predicativo do Sujeito: termo que qualifica o sujeito 'O tráfego de veículos pesados' por meio do verbo de ligação." },
      { term: "sob a chuva intensa", explanation: "Adjunto Adverbial de Lugar/Circunstancial: expressa a circunstância física/espacial sob a qual ocorria o estado lento." }
    ]
  }
];

const AVAILABLE_TAGS = [
  "Sujeito Simples",
  "Sujeito Composto",
  "Sujeito Oculto",
  "Sujeito Indeterminado",
  "Sujeito Paciente",
  "Sujeito Inexistente",
  "Verbo Transitivo Direto",
  "Verbo Transitivo Indireto",
  "Verbo Transitivo Direto e Indireto",
  "Verbo Intransitivo",
  "Verbo de Ligação",
  "Locução Verbal",
  "Locução Verbal Passiva",
  "Objeto Direto",
  "Objeto Indireto",
  "Adjunto Adnominal",
  "Adjunto Adverbial de Modo",
  "Adjunto Adverbial de Tempo",
  "Adjunto Adverbial de Lugar",
  "Adjunto Adverbial de Causa",
  "Adjunto Adverbial de Intensidade",
  "Adjunto Adverbial de Companhia",
  "Adjunto Adverbial de Instrumento",
  "Predicativo do Sujeito",
  "Predicativo do Objeto",
  "Agente da Passiva",
  "Aposto",
  "Vocativo",
  "Complemento Nominal"
];

export default function PortuguesSintaxe() {
  const { addXP, setCoins, playSound } = useStore();
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [assignedTags, setAssignedTags] = useState({});
  const [selectedTag, setSelectedTag] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [results, setResults] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const currentSentence = SYNTAX_SENTENCES[currentSentenceIndex];

  // Carregar progresso local ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem('prf_syntax_level');
    if (saved) {
      const idx = parseInt(saved);
      if (idx < SYNTAX_SENTENCES.length) {
        setCurrentSentenceIndex(idx);
      }
    }
  }, []);

  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    playSound('xp');
  };

  const handleDropToSlot = (slotIndex, tagToAssign) => {
    const tag = tagToAssign || selectedTag;
    if (!tag) return;
    setAssignedTags(prev => ({
      ...prev,
      [slotIndex]: tag
    }));
    setSelectedTag(null);
    playSound('xp');
  };

  const handleClearSlot = (slotIndex) => {
    setAssignedTags(prev => {
      const updated = { ...prev };
      delete updated[slotIndex];
      return updated;
    });
    playSound('xp');
  };

  const handleReset = () => {
    setAssignedTags({});
    setSelectedTag(null);
    setIsVerified(false);
    setResults({});
    setIsSuccess(false);
    setShowExplanation(false);
    setDragOverSlot(null);
  };

  const handleVerify = () => {
    // Verificar se todos os slots foram preenchidos
    const allFilled = currentSentence.segments.every((_, idx) => assignedTags[idx]);
    if (!allFilled) {
      toast.warning("Complete todos os espaços antes de verificar!");
      return;
    }

    const verificationResults = {};
    let correctCount = 0;

    currentSentence.segments.forEach((seg, idx) => {
      const isCorrect = assignedTags[idx] === seg.role;
      verificationResults[idx] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(verificationResults);
    setIsVerified(true);

    const isAllCorrect = correctCount === currentSentence.segments.length;
    setIsSuccess(isAllCorrect);

    if (isAllCorrect) {
      toast.success("Análise Sintática Perfeita! +15 XP | +10 Moedas");
      addXP(15, "Sintaxe PRF Desvendada");
      setCoins(c => c + 10);
      playSound('coin');
    } else {
      toast.error("Alguns termos estão incorretos. Revise o esquema!");
    }
  };

  const handleNext = () => {
    const nextIdx = currentSentenceIndex + 1;
    if (nextIdx < SYNTAX_SENTENCES.length) {
      setCurrentSentenceIndex(nextIdx);
      localStorage.setItem('prf_syntax_level', nextIdx.toString());
      handleReset();
    } else {
      toast.success("🏆 Você concluiu todas as sentenças de Sintaxe!");
      setCurrentSentenceIndex(0);
      localStorage.setItem('prf_syntax_level', '0');
      handleReset();
    }
  };

  return (
    <div className="fade-in w-full max-w-5xl mx-auto pb-12">
      {/* Cabeçalho */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20">
            <Library className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              Análise Sintática
              <span className="text-[10px] bg-blue-500/20 text-blue-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Drag & Drop</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold">Domine a gramática oficial com o método gamificado de trânsito.</p>
          </div>
        </div>

        {/* Nível / Barra de Progresso */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black shadow-sm">
          <span className="text-slate-400 uppercase">Progresso:</span>
          <span className="text-blue-500">{currentSentenceIndex + 1} / {SYNTAX_SENTENCES.length}</span>
          <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${((currentSentenceIndex + 1) / SYNTAX_SENTENCES.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Caixa da Sentença */}
      <section className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 blur-3xl rounded-2xl -z-10"></div>
        <div className="glass-card bg-slate-900/90 dark:bg-slate-950/95 border-2 border-blue-500/30 dark:border-blue-950/70 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-center text-white glow-blue">
          <div className="absolute top-0 right-0 bg-blue-500/10 border-b border-l border-blue-500/20 text-[10px] text-blue-400 font-black px-4 py-2 rounded-bl-xl uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 animate-pulse" /> Caso PRF #{currentSentence.id}
          </div>
          
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Oração sob Investigação Sintática</p>
          <blockquote className="text-lg sm:text-2xl font-black text-blue-100 dark:text-blue-50 tracking-tight leading-relaxed font-display px-2 sm:px-6">
            "{currentSentence.sentence}"
          </blockquote>
        </div>
      </section>

      {/* Slots Interativos */}
      <div className="glass-card rounded-2xl shadow-md p-6 mb-6 border border-slate-200/50 dark:border-slate-800/60">
        <h3 className="text-xs font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500" /> Preencha as Funções Sintáticas
        </h3>

        <div className="space-y-4">
          {currentSentence.segments.map((seg, idx) => {
            const hasAssigned = assignedTags[idx];
            const isCorrect = results[idx];
            const isHovered = dragOverSlot === idx;
            
            return (
              <div 
                key={idx} 
                onDragOver={(e) => {
                  if (!isVerified) e.preventDefault();
                }}
                onDragEnter={() => {
                  if (!isVerified) setDragOverSlot(idx);
                }}
                onDragLeave={() => {
                  if (!isVerified) setDragOverSlot(null);
                }}
                onDrop={(e) => {
                  if (isVerified) return;
                  e.preventDefault();
                  setDragOverSlot(null);
                  const tag = e.dataTransfer.getData("text/plain") || selectedTag;
                  if (tag) {
                    handleDropToSlot(idx, tag);
                  }
                }}
                onClick={() => {
                  if (selectedTag && !isVerified) {
                    handleDropToSlot(idx, selectedTag);
                  }
                }}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  isHovered 
                    ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.01]'
                    : selectedTag && !hasAssigned && !isVerified
                      ? 'border-blue-500/30 bg-blue-500/5 cursor-pointer animate-pulse'
                      : 'border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
                }`}
              >
                {/* Segmento Textual */}
                <div className="md:w-1/2 flex items-start gap-2.5">
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">{seg.text}</p>
                </div>

                {/* Dropzone / Tag Associada */}
                <div className="md:w-1/2 flex justify-end">
                  {hasAssigned ? (
                    <motion.div 
                      layoutId={`tag-${idx}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        isVerified
                          ? isCorrect 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse'
                            : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                          : 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400'
                      }`}
                    >
                      <span>{hasAssigned}</span>
                      {!isVerified && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Evita reatribuição ao clicar na linha
                            handleClearSlot(idx);
                          }}
                          className="hover:scale-110 active:scale-95 transition-transform"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isVerified && (
                        isCorrect 
                          ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                          : <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </motion.div>
                  ) : (
                    <div
                      className={`w-full md:w-auto text-center px-4 py-2.5 border-2 border-dashed rounded-xl text-xs font-bold transition-all ${
                        isHovered
                          ? 'border-blue-500 text-blue-500 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-[1.02]'
                          : selectedTag
                            ? 'border-blue-500/60 text-blue-500 bg-blue-500/5 animate-pulse'
                            : 'border-slate-350 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {selectedTag ? "Toque na linha para colar" : "Arraste / Clique no termo"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Caixa de Etiquetas Disponíveis */}
      {!isVerified && (
        <div className="glass-card rounded-2xl p-6 mb-6 border border-slate-200/50 dark:border-slate-800/60 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" /> Etiquetas de Termos Sintáticos (Arraste ou Toque)
            </h3>
            {selectedTag && (
              <button 
                onClick={() => setSelectedTag(null)}
                className="text-[10px] font-black text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Limpar seleção
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {AVAILABLE_TAGS.map((tag, idx) => {
              const isSelected = selectedTag === tag;
              const isUsed = Object.values(assignedTags).includes(tag);
              
              return (
                <button
                  key={idx}
                  disabled={isUsed}
                  draggable={!isUsed}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", tag);
                    setSelectedTag(tag);
                  }}
                  onClick={() => handleSelectTag(tag)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black border transition-all select-none cursor-grab active:cursor-grabbing hover:scale-[1.03] active:scale-95 ${
                    isUsed 
                      ? 'opacity-30 grayscale border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed hover:scale-100'
                      : isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105'
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 shadow-sm'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!isVerified ? (
          <button 
            onClick={handleVerify}
            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" /> Verificar Análise
          </button>
        ) : (
          <>
            {isSuccess ? (
              <button 
                onClick={handleNext}
                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" /> {currentSentenceIndex + 1 === SYNTAX_SENTENCES.length ? "Reiniciar Trilha" : "Próxima Oração"}
              </button>
            ) : (
              <button 
                onClick={handleReset}
                className="flex-1 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" /> Tentar Novamente
              </button>
            )}
            
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="py-4 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-98 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {showExplanation ? "Ocultar" : "Ver"} Explicação
            </button>
          </>
        )}
      </div>

      {/* Explicação Sintática Detalhada */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mt-6 glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-md"
          >
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
              <Library className="w-5 h-5 text-blue-500" /> Desconstrução Sintática Detalhada
            </h4>
            
            <div className="space-y-4">
              {currentSentence.explanation.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-xs border-l-2 border-blue-500 pl-3">
                  <span className="font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">{item.term}</span>
                  <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{item.explanation}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Ícone X em falta nos imports de lucide-react do arquivo original
function X({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
