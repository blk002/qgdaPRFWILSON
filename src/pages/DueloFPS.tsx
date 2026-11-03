import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crosshair,
  Volume2,
  VolumeX,
  ShieldAlert,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Sparkles,
  Key,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  QUESTIONS_BANK,
  BaseLegalQuestion,
  ActiveRoundQuestion,
  QuestionCategory,
  synthesizeUniqueCebraspeStatement,
} from '../data/questionsBank';
import { TacticalRange3D, ShotTriggerCommand } from '../components/TacticalRange3D';
import { soundFX } from '../utils/soundEffects';

interface AnsweredHistoryItem {
  round: number;
  question: ActiveRoundQuestion;
  playerChoice: boolean | null;
  survived: boolean;
  timeSpent: number;
}

const SEEN_STRINGS_STORAGE_KEY = 'alvo_legal_seen_statements_v1';
const HIGH_SCORE_STORAGE_KEY = 'alvo_legal_high_score_v1';
const GEMINI_KEY_STORAGE = 'qg_gemini_api_key';

export default function DueloFPS() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'executing' | 'gameover'>('menu');
  const [activeTab, setActiveTab] = useState<'arena' | 'vademecum' | 'historico'>('arena');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(HIGH_SCORE_STORAGE_KEY) || '0');
    } catch {
      return 0;
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState<ActiveRoundQuestion | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(24.0);
  const [hoveredTarget, setHoveredTarget] = useState<'CERTO' | 'ERRADO' | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [externalShotCommand, setExternalShotCommand] = useState<ShotTriggerCommand | null>(null);
  const [lastFeedbackBanner, setLastFeedbackBanner] = useState<{
    text: string;
    legalBasis: string;
  } | null>(null);
  const [deathReason, setDeathReason] = useState<'WRONG_TARGET' | 'TIMEOUT' | null>(null);
  const [runHistory, setRunHistory] = useState<AnsweredHistoryItem[]>([]);
  const [vadeMecumFilter, setVadeMecumFilter] = useState<'ALL' | 'CTB' | 'CONTRAN'>('ALL');

  // Chave Gemini para geração/reescrita via IA em tempo real
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    } catch {
      return '';
    }
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [draftKey, setDraftKey] = useState<string>(geminiApiKey);

  // Registro de assertivas já vistas para evitar repetição 100% igual
  const seenStatementsRef = useRef<Set<string>>(new Set());
  const usedBaseIdsInCycleRef = useRef<{ CTB: Set<string>; CONTRAN: Set<string> }>({
    CTB: new Set(),
    CONTRAN: new Set(),
  });
  const totalGeneratedCountRef = useRef<number>(1);
  const prewarmedNextRef = useRef<Map<QuestionCategory, ActiveRoundQuestion>>(new Map());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_STRINGS_STORAGE_KEY);
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        parsed.forEach((s) => seenStatementsRef.current.add(s));
        totalGeneratedCountRef.current = parsed.length + 1;
      }
    } catch {}
  }, []);

  const persistSeenStatement = useCallback((stmt: string) => {
    seenStatementsRef.current.add(stmt);
    try {
      const arr = Array.from(seenStatementsRef.current).slice(-300);
      localStorage.setItem(SEEN_STRINGS_STORAGE_KEY, JSON.stringify(arr));
    } catch {}
  }, []);

  // Constrói questão única (com variação sintética garantida)
  const buildUniqueQuestion = useCallback(
    (targetCategory: QuestionCategory): ActiveRoundQuestion => {
      const pool = QUESTIONS_BANK.filter((q) => q.category === targetCategory);
      const usedSet = usedBaseIdsInCycleRef.current[targetCategory];

      let available = pool.filter((q) => !usedSet.has(q.id));
      if (available.length === 0) {
        usedSet.clear();
        available = [...pool];
      }

      const chosenBase: BaseLegalQuestion =
        available[Math.floor(Math.random() * available.length)];
      usedSet.add(chosenBase.id);

      totalGeneratedCountRef.current += 1;
      const statement = synthesizeUniqueCebraspeStatement(
        chosenBase,
        seenStatementsRef.current,
        totalGeneratedCountRef.current
      );
      persistSeenStatement(statement);

      const roundQ: ActiveRoundQuestion = {
        id: chosenBase.id,
        uniqueHash: `${chosenBase.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category: chosenBase.category,
        topic: chosenBase.topic,
        legalBasis: chosenBase.legalBasis,
        statement,
        answer: chosenBase.answer,
        explanation: chosenBase.explanation,
        wasAiRewritten: false,
      };

      return roundQ;
    },
    [persistSeenStatement]
  );

  // Pre-aquece próxima questão com a IA Gemini (ou mantém procedural)
  const prewarmCategoryQuestionWithAI = useCallback(
    async (category: QuestionCategory) => {
      const initialQ = buildUniqueQuestion(category);
      prewarmedNextRef.current.set(category, initialQ);

      const key = geminiApiKey || localStorage.getItem(GEMINI_KEY_STORAGE);
      if (!key) return;

      try {
        const prompt = `Reescreva a seguinte assertiva de prova estilo CEBRASPE (Certo/Errado) sobre ${
          category === 'CTB' ? 'Código de Trânsito Brasileiro (Lei nº 9.503/1997)' : 'Resolução do CONTRAN'
        } de uma maneira inédita, mantendo rigorosamente o mesmo sentido jurídico e o mesmo gabarito (${
          initialQ.answer ? 'CERTO' : 'ERRADO'
        }).
Base legal: ${initialQ.legalBasis}
Assertiva base: "${initialQ.statement}"
Regras:
1. Use linguagem técnica Cebraspe (PRF).
2. Mude a estrutura sintática, ordem das orações ou crie uma situação hipotética curta, mas NUNCA inverta o gabarito (${initialQ.answer ? 'CERTO' : 'ERRADO'}).
3. Limite a no máximo 280 caracteres.
Retorne estritamente um JSON no formato: {"rewrittenText": "..."}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
          }),
        });

        if (!res.ok) return;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed?.rewrittenText && !seenStatementsRef.current.has(parsed.rewrittenText)) {
            persistSeenStatement(parsed.rewrittenText);
            prewarmedNextRef.current.set(category, {
              ...initialQ,
              statement: parsed.rewrittenText.trim(),
              wasAiRewritten: true,
            });
          }
        }
      } catch (err) {
        // Fallback procedural já está salvo em prewarmedNextRef
      }
    },
    [buildUniqueQuestion, persistSeenStatement, geminiApiKey]
  );

  // Alternância Estrita: Rodada 1 = CTB, Rodada 2 = CONTRAN...
  const getCategoryForRound = (round: number): QuestionCategory => {
    return round % 2 === 1 ? 'CTB' : 'CONTRAN';
  };

  const startNewGame = useCallback(() => {
    soundFX.playWeaponReady();
    setActiveTab('arena');
    setScore(0);
    setRoundNumber(1);
    setRunHistory([]);
    setDeathReason(null);
    setLastFeedbackBanner(null);

    const firstCategory: QuestionCategory = 'CTB';
    const firstQ =
      prewarmedNextRef.current.get(firstCategory) || buildUniqueQuestion(firstCategory);
    prewarmedNextRef.current.delete(firstCategory);

    setCurrentQuestion(firstQ);
    setTimeLeft(24.0);
    setGameState('playing');

    // Pré-aquece as próximas rodadas em background
    prewarmCategoryQuestionWithAI('CONTRAN');
    prewarmCategoryQuestionWithAI('CTB');
  }, [buildUniqueQuestion, prewarmCategoryQuestionWithAI]);

  // Execução do NPC quando o jogador erra ou estoura o tempo
  const triggerNpcExecution = useCallback(
    (reason: 'WRONG_TARGET' | 'TIMEOUT', playerChoice: boolean | null) => {
      if (!currentQuestion) return;
      soundFX.playNpcExecutionShot();
      setDeathReason(reason);
      setGameState('executing');

      const spent = Math.min(24, Math.max(0, 24 - timeLeft));
      setRunHistory((prev) => [
        ...prev,
        {
          round: roundNumber,
          question: currentQuestion,
          playerChoice,
          survived: false,
          timeSpent: spent,
        },
      ]);

      window.setTimeout(() => {
        setGameState('gameover');
      }, 1250);
    },
    [currentQuestion, roundNumber, timeLeft]
  );

  // Disparo do jogador no alvo CERTO ou ERRADO
  const handleShootTarget = useCallback(
    (choice: boolean) => {
      if (gameState !== 'playing' || !currentQuestion) return;

      soundFX.playPlayerShot();
      const isCorrect = choice === currentQuestion.answer;
      soundFX.playSteelImpact(isCorrect);

      if (isCorrect) {
        const spent = Math.min(24, Math.max(0.1, 24 - timeLeft));
        const newScore = score + 1;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          try {
            localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(newScore));
          } catch {}
        }

        setRunHistory((prev) => [
          ...prev,
          {
            round: roundNumber,
            question: currentQuestion,
            playerChoice: choice,
            survived: true,
            timeSpent: spent,
          },
        ]);

        setLastFeedbackBanner({
          text: `ALVO CORRETO (${currentQuestion.answer ? 'CERTO' : 'ERRADO'})`,
          legalBasis: currentQuestion.legalBasis,
        });

        const nextRound = roundNumber + 1;
        const nextCat = getCategoryForRound(nextRound);
        const nextQ =
          prewarmedNextRef.current.get(nextCat) || buildUniqueQuestion(nextCat);
        prewarmedNextRef.current.delete(nextCat);

        setRoundNumber(nextRound);
        setCurrentQuestion(nextQ);
        setTimeLeft(24.0);

        prewarmCategoryQuestionWithAI(nextCat);
      } else {
        triggerNpcExecution('WRONG_TARGET', choice);
      }
    },
    [
      gameState,
      currentQuestion,
      timeLeft,
      score,
      highScore,
      roundNumber,
      buildUniqueQuestion,
      prewarmCategoryQuestionWithAI,
      triggerNpcExecution,
    ]
  );

  // Temporizador de 24 segundos com áudio tenso
  const lastTickSecondRef = useRef<number>(24);
  useEffect(() => {
    if (gameState !== 'playing') return;

    lastTickSecondRef.current = 24;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        const ceilSec = Math.ceil(next);
        if (ceilSec < lastTickSecondRef.current && ceilSec > 0) {
          lastTickSecondRef.current = ceilSec;
          soundFX.playTimerTick(ceilSec);
        }
        if (next <= 0) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [gameState, roundNumber]);

  // Checagem de tempo esgotado
  useEffect(() => {
    if (gameState === 'playing' && timeLeft <= 0) {
      triggerNpcExecution('TIMEOUT', null);
    }
  }, [gameState, timeLeft, triggerNpcExecution]);

  // Atalhos de teclado: C/1 = CERTO, E/2 = ERRADO, H = Dock, F = Tela Cheia, Enter = Iniciar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      if (key === 'h') {
        setDockCollapsed((prev) => !prev);
        return;
      }
      if (key === 'f') {
        toggleFullscreen();
        return;
      }

      if (gameState === 'playing') {
        if (key === 'c' || key === '1') {
          setExternalShotCommand({ choice: true, id: Date.now() });
        } else if (key === 'e' || key === '2') {
          setExternalShotCommand({ choice: false, id: Date.now() });
        }
      } else if ((gameState === 'menu' || gameState === 'gameover') && key === 'enter') {
        startNewGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startNewGame]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.muted = next;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const saveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = draftKey.trim();
    setGeminiApiKey(cleanKey);
    try {
      localStorage.setItem(GEMINI_KEY_STORAGE, cleanKey);
    } catch {}
    setShowKeyModal(false);
  };

  const filteredVadeMecum = QUESTIONS_BANK.filter((item) =>
    vadeMecumFilter === 'ALL' ? true : item.category === vadeMecumFilter
  );

  return (
    <div
      ref={containerRef}
      className={`w-full bg-zinc-950 text-zinc-100 flex flex-col rounded-3xl overflow-hidden select-none border border-zinc-800/80 shadow-2xl relative ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'min-h-[720px] h-[82vh]'
      }`}
    >
      {/* BARRA SUPERIOR DO JOGO (HEADER FPS) */}
      <header className="flex items-center justify-between gap-4 px-5 py-3 bg-zinc-950 border-b border-zinc-800/80 z-30 shrink-0">
        {/* Título & Logo */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Crosshair className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2">
              ALVO LEGAL FPS
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-bold">
                CTB & CONTRAN
              </span>
            </h1>
          </div>
        </div>

        {/* Navegação entre Abas do Jogo */}
        <nav className="hidden sm:flex items-center gap-5 text-xs font-semibold text-zinc-400">
          <button
            type="button"
            onClick={() => setActiveTab('arena')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'arena' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            Estande 3D
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vademecum')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'vademecum' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            Base Legal ({QUESTIONS_BANK.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'historico' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            Relatório ({runHistory.length})
          </button>
        </nav>

        {/* Controles & Botões da Direita */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Status / Configuração da IA Gemini */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              geminiApiKey
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
            title="Configurar IA Gemini para gerar questões em tempo real"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{geminiApiKey ? 'IA Gemini Ativa' : 'Configurar IA'}</span>
          </button>

          {/* Áudio Mudo */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Tela Cheia */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Sair da Tela Cheia (F)' : 'Tela Cheia (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Iniciar / Reiniciar Operação */}
          <button
            type="button"
            onClick={startNewGame}
            className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            {gameState === 'playing' ? 'Reiniciar' : 'Iniciar (24s)'}
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL DO JOGO */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* ARENA 3D THREE.JS (Permanece montada para preservar contexto WebGL) */}
        <div className="absolute inset-0 z-0">
          <TacticalRange3D
            gameState={gameState}
            currentQuestion={currentQuestion}
            timeLeft={timeLeft}
            roundNumber={roundNumber}
            externalShotCommand={externalShotCommand}
            onShootTarget={handleShootTarget}
            onHoverTargetChange={setHoveredTarget}
          />
        </div>

        {/* Overlay Balístico Carmesim quando o NPC elimina o jogador */}
        {(gameState === 'executing' || gameState === 'gameover') && (
          <div
            className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle at center, rgba(220,38,38,0.18) 0%, rgba(127,29,29,0.72) 70%, rgba(9,9,11,0.92) 100%)',
            }}
          />
        )}

        {/* ABA 1: ESTANDE 3D */}
        {activeTab === 'arena' && (
          <>
            {/* Top HUD Compacto com Questão e Cronômetro de 24s */}
            {gameState === 'playing' && currentQuestion && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[min(920px,94vw)] pointer-events-none">
                <div className="bg-zinc-950/92 border border-zinc-800 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md">
                  {/* Linha de Metadados: Alternância Rigorosa CTB ↔ CONTRAN */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 mb-1.5">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-zinc-200">
                        Rodada {String(roundNumber).padStart(2, '0')}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          currentQuestion.category === 'CTB'
                            ? 'text-amber-400 font-semibold'
                            : 'text-cyan-400 font-semibold'
                        }
                      >
                        {currentQuestion.category === 'CTB'
                          ? '1º na Ordem: CTB (Lei 9.503/97)'
                          : '2º na Ordem: Resolução CONTRAN'}
                      </span>
                      <span>·</span>
                      <span className="text-zinc-300 truncate max-w-[200px]">{currentQuestion.topic}</span>
                      {currentQuestion.wasAiRewritten && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          IA Live
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span>Streak: <strong className="text-amber-400 font-black">{score}</strong></span>
                      <span>·</span>
                      <span>Recorde: <strong className="text-emerald-400 font-black">{highScore}</strong></span>
                    </div>
                  </div>

                  {/* Enunciado da Assertiva Cebraspe */}
                  <p className="text-sm sm:text-base font-medium text-zinc-100 leading-relaxed text-justify sm:text-center">
                    "{currentQuestion.statement}"
                  </p>

                  {/* Cronômetro Regressivo de 24 segundos */}
                  <div className="mt-2.5 flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 truncate">
                      Base: <strong className="text-zinc-300">{currentQuestion.legalBasis}</strong>
                    </span>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-xs font-bold uppercase text-zinc-400">Tempo:</span>
                      <span
                        className={`text-xl sm:text-2xl font-black tabular-nums ${
                          timeLeft <= 5.0
                            ? 'text-red-500 animate-pulse'
                            : timeLeft <= 10.0
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {timeLeft.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Banner de Feedback ao Acertar */}
            {lastFeedbackBanner && gameState === 'playing' && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-sm animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{lastFeedbackBanner.text}</span>
                  <span className="text-emerald-400/80 font-normal">· {lastFeedbackBanner.legalBasis}</span>
                </div>
              </div>
            )}

            {/* Dock Inferior com Controles e Botões Manuais de Disparo */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(740px,94vw)]">
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-zinc-400 px-2 pb-1.5 border-b border-zinc-800/60 mb-2">
                  <span className="font-semibold text-zinc-300">
                    Controles Táticos: Mire e clique nos alvos 3D ou use os atalhos
                  </span>
                  <button
                    type="button"
                    onClick={() => setDockCollapsed(!dockCollapsed)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5"
                    title="Minimizar barra"
                  >
                    {dockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {!dockCollapsed && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={gameState !== 'playing'}
                      onClick={() => setExternalShotCommand({ choice: true, id: Date.now() })}
                      className="py-2.5 px-4 rounded-xl border-2 border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/60 hover:border-emerald-400 text-emerald-200 font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Atirar em CERTO [C / 1]</span>
                    </button>

                    <button
                      type="button"
                      disabled={gameState !== 'playing'}
                      onClick={() => setExternalShotCommand({ choice: false, id: Date.now() })}
                      className="py-2.5 px-4 rounded-xl border-2 border-red-500/60 bg-red-950/40 hover:bg-red-900/60 hover:border-red-400 text-red-200 font-mono text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
                    >
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Atirar em ERRADO [E / 2]</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tela de Início / Menu */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
                    <Crosshair className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider text-zinc-100">
                      ESTANDE TÁTICO: CTB & CONTRAN
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      O suspeito armado está com a pistola na sua direção. Você tem <strong>24 segundos</strong> para identificar o gabarito Cebraspe e atirar na placa certa.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-left text-xs bg-zinc-950/60 border border-zinc-800 p-3 rounded-2xl">
                    <div>
                      <span className="block text-[10px] font-bold text-amber-400 uppercase">Tempo</span>
                      <strong className="text-zinc-200">24s por tiro</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-cyan-400 uppercase">Ordem</span>
                      <strong className="text-zinc-200">CTB ↔ CONTRAN</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-red-400 uppercase">Falha</span>
                      <strong className="text-zinc-200">Tiro do NPC</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={startNewGame}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>ENTRAR NO ESTANDE & INICIAR (ENTER)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tela de GAME OVER / ELIMINADO */}
            {gameState === 'gameover' && currentQuestion && (
              <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md overflow-y-auto">
                <div className="max-w-xl w-full bg-zinc-900 border border-red-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
                    <ShieldAlert className="w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-red-500 font-mono">
                      FIM DA LINHA, POLICIAL
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 font-semibold">
                      {deathReason === 'TIMEOUT'
                        ? 'O tempo de 24 segundos se esgotou e o suspeito disparou.'
                        : 'Você disparou na placa errada e foi neutralizado.'}
                    </p>
                  </div>

                  {/* Gabarito Comentado Oficial */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold border-b border-zinc-800 pb-2">
                      <span className="text-amber-400 uppercase">
                        Gabarito Oficial: {currentQuestion.answer ? 'CERTO' : 'ERRADO'}
                      </span>
                      <span className="text-zinc-400">{currentQuestion.legalBasis}</span>
                    </div>
                    <p className="text-zinc-300 italic">"{currentQuestion.statement}"</p>
                    <p className="text-emerald-400 leading-relaxed pt-1">{currentQuestion.explanation}</p>
                  </div>

                  {/* Placar da Bateria */}
                  <div className="flex items-center justify-center gap-8 py-1 font-mono text-xs">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px]">Sobreviveu</span>
                      <strong className="text-xl text-zinc-100 font-black">{score} rodadas</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px]">Recorde Pessoal</span>
                      <strong className="text-xl text-amber-400 font-black">{highScore} rodadas</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('historico')}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Ver Relatório Completo
                    </button>
                    <button
                      type="button"
                      onClick={startNewGame}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Tentar Novamente (Enter)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ABA 2: BASE LEGAL (VADE MECUM CTB & CONTRAN) */}
        {activeTab === 'vademecum' && (
          <div className="absolute inset-0 z-20 bg-zinc-950 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-zinc-100">
                    VADE MECUM TÁTICO: CTB & CONTRAN
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Dispositivos e Resoluções integrados ao motor de disparo do jogo.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-bold">
                  {(['ALL', 'CTB', 'CONTRAN'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setVadeMecumFilter(filter)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        vadeMecumFilter === filter
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {filter === 'ALL' ? 'Todos' : filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredVadeMecum.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={item.category === 'CTB' ? 'text-amber-400' : 'text-cyan-400'}>
                        {item.category} · {item.legalBasis}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        item.answer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        GABARITO: {item.answer ? 'CERTO' : 'ERRADO'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-semibold">{item.topic}</div>
                    <p className="text-xs text-zinc-200 italic">"{item.coreStatements[0]}"</p>
                    <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: RELATÓRIO DE DISPAROS */}
        {activeTab === 'historico' && (
          <div className="absolute inset-0 z-20 bg-zinc-950 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4 pb-12">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-zinc-100">
                    RELATÓRIO DE DISPAROS DA BATERIA
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Histórico detalhado das questões respondidas na sessão atual.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('arena')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase cursor-pointer"
                >
                  Voltar ao Estande 3D
                </button>
              </div>

              {runHistory.length === 0 ? (
                <div className="p-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-zinc-400 text-xs">
                  Nenhum disparo registrado nesta sessão. Inicie uma bateria no Estande 3D!
                </div>
              ) : (
                <div className="space-y-3">
                  {runHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-zinc-200">Rodada #{item.round} · {item.question.category}</span>
                        <span className={item.survived ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {item.survived ? '✓ SOBREVIVEU' : item.playerChoice === null ? '✕ TEMPO ESGOTADO' : '✕ TIRO ERRADO'} ({item.timeSpent.toFixed(1)}s)
                        </span>
                      </div>
                      <p className="text-zinc-200">"{item.question.statement}"</p>
                      <p className="text-zinc-400 pt-1 border-t border-zinc-800/60 leading-relaxed">
                        {item.question.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE CONFIGURAÇÃO DA CHAVE GEMINI IA */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400 font-black uppercase text-sm">
                <Sparkles className="w-4 h-4" />
                <span>IA Gemini: Geração ao Vivo</span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Insira sua chave gratuita da <strong>Google Gemini API</strong> (do Google AI Studio). Com ela ativa, a IA reescreve enunciados em segundo plano em tempo real com vocabulário inédito Cebraspe.
            </p>

            <form onSubmit={saveGeminiKey} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  Chave Gemini API (AI Studio)
                </label>
                <input
                  type="password"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-500/20"
                >
                  Salvar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
