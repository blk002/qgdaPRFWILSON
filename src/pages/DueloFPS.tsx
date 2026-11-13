import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Skull,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Scale,
  Search
} from 'lucide-react';
import {
  LEI_SECA_CTB,
  LEI_SECA_CONTRAN,
  ArtigoLeiSeca,
  ArtigoLeiSecaCONTRAN,
  ActiveRoundQuestion,
  QuestionCategory,
  PRF_TOPICS_CATALOG,
  getRandomPrfTopic,
  getRandomCtbArticle,
  getRandomContranArticle,
  PRFTopicMetadata,
  generateProceduralQuestionFromCtbArticle,
  generateProceduralQuestionFromContranArticle,
  generateProceduralQuestionFromContranTopic,
  getRandomCuratedQuestion,
} from '../data/questionsBank';
import { TacticalRange3D, ShotTriggerCommand } from '../components/TacticalRange3D';
import { soundFX } from '../utils/soundEffects';
import { useStore } from '../store/useStore';

interface AnsweredHistoryItem {
  round: number;
  question: ActiveRoundQuestion;
  playerChoice: boolean | null;
  survived: boolean;
  timeSpent: number;
}

const SEEN_STRINGS_STORAGE_KEY = 'alvo_legal_seen_statements_v1';
const HIGH_SCORE_STORAGE_KEY = 'alvo_legal_high_score_v1';
const FPS_TOPIC_STATS_KEY = 'qg_duelo_fps_topic_stats_v1';

export default function DueloFPS() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'executing' | 'gameover'>('menu');
  const [activeTab, setActiveTab] = useState<'arena' | 'vademecum' | 'historico' | 'raiox' | 'guia'>('arena');
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
  const [vadeMecumSearch, setVadeMecumSearch] = useState<string>('');

  // Registro de assertivas já vistas para evitar repetição 100% igual
  const seenStatementsRef = useRef<Set<string>>(new Set());
  const seenCuratedIdsRef = useRef<Set<string>>(new Set());
  const usedBaseIdsInCycleRef = useRef<{ CTB: Set<string>; CONTRAN: Set<string> }>({
    CTB: new Set(),
    CONTRAN: new Set(),
  });
  const totalGeneratedCountRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const executionTimerRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (executionTimerRef.current !== null) {
        window.clearTimeout(executionTimerRef.current);
      }
    };
  }, []);

  // Estatísticas de tópicos locais para a aba Raio-X
  const [fpsTopicStatsVersion, setFpsTopicStatsVersion] = useState<number>(0);

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

  // Registra a questão respondida no useStore (Raio-X Caveira) e no agregador de tópicos
  const recordQuestionAttempt = useCallback(
    (
      question: ActiveRoundQuestion,
      playerChoice: boolean | null,
      isHit: boolean,
      spentSeconds: number,
      reason?: 'WRONG_TARGET' | 'TIMEOUT'
    ) => {
      // 1. Envia ao Raio-X Caveira oficial (useStore)
      try {
        const addCaveira = (useStore.getState() as any).addCaveiraQuestion;
        if (typeof addCaveira === 'function') {
          const nowIso = new Date().toISOString();
          addCaveira({
            id: `fps-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            subject: question.category === 'CTB' ? 'Legislação de Trânsito (CTB)' : 'Resoluções do CONTRAN',
            canonicalSubject: question.category === 'CTB' ? 'Legislação de Trânsito (CTB)' : 'Resoluções do CONTRAN',
            bloco: 'Bloco II',
            topic: question.topic || (question.category === 'CTB' ? 'CTB - Geral' : 'CONTRAN - Geral'),
            content: question.statement,
            statement: question.statement,
            userChoice: playerChoice === true ? 'C' : playerChoice === false ? 'E' : '-',
            correctChoice: question.answer ? 'C' : 'E',
            userAnswer: playerChoice === true ? 'CERTO' : playerChoice === false ? 'ERRADO' : 'TEMPO_ESGOTADO',
            correctAnswer: question.answer ? 'CERTO' : 'ERRADO',
            correct: isHit,
            hit: isHit,
            durationSeconds: Math.round(spentSeconds),
            timestamp: nowIso,
            date: nowIso,
            confidence: playerChoice === null ? 'duvida' : 'sabia',
            errorReason: reason === 'TIMEOUT' ? 'atencao' : 'conteudo',
            explanation: `${question.explanation} [Base Legal: ${question.legalBasis}]`,
            teacherComment: question.explanation,
            source: 'Duelo FPS (Alvo Legal)',
            origin: 'Duelo FPS 3D',
            legalBasis: question.legalBasis,
          });
        }
      } catch (err) {
        console.warn('Erro ao sincronizar questão com useStore:', err);
      }

      // 2. Persiste métricas por tópico no agregador de estatísticas do Duelo
      try {
        const raw = localStorage.getItem(FPS_TOPIC_STATS_KEY);
        const stats = raw ? JSON.parse(raw) : { topics: {}, totalShots: 0, totalHits: 0, totalErrors: 0 };
        stats.totalShots = (stats.totalShots || 0) + 1;
        if (isHit) stats.totalHits = (stats.totalHits || 0) + 1;
        else stats.totalErrors = (stats.totalErrors || 0) + 1;

        const topicKey = question.topic || (question.category === 'CTB' ? 'CTB - Geral' : 'CONTRAN - Geral');
        if (!stats.topics[topicKey]) {
          stats.topics[topicKey] = {
            topic: topicKey,
            category: question.category,
            legalBasis: question.legalBasis,
            total: 0,
            hits: 0,
            errors: 0,
            totalTime: 0,
          };
        }
        const t = stats.topics[topicKey];
        t.total += 1;
        t.totalTime += spentSeconds;
        if (isHit) t.hits += 1;
        else t.errors += 1;

        localStorage.setItem(FPS_TOPIC_STATS_KEY, JSON.stringify(stats));
        setFpsTopicStatsVersion((v) => v + 1);
      } catch (_) {}
    },
    []
  );

  // Constrói questão priorizando o banco de questões de elite Cebraspe PRF
  const buildUniqueQuestion = useCallback(
    (targetCategory: QuestionCategory, topicOverride?: PRFTopicMetadata): ActiveRoundQuestion => {
      totalGeneratedCountRef.current += 1;

      // 1. Prioriza banco curado de elite Cebraspe PRF dos 10 tópicos mais cobrados
      if (!topicOverride) {
        const curated = getRandomCuratedQuestion(targetCategory, seenCuratedIdsRef.current);
        if (curated) {
          seenCuratedIdsRef.current.add(curated.id);
          persistSeenStatement(curated.statement);
          return curated;
        }
      }

      // 2. Gerador inteligente contextual como contingência (infração completa, crime ou parent-child inciso)
      if (targetCategory === 'CTB') {
        const artigo = getRandomCtbArticle(topicOverride?.name);
        const q = generateProceduralQuestionFromCtbArticle(artigo);
        persistSeenStatement(q.statement);
        return q;
      } else {
        const artigo = getRandomContranArticle(topicOverride?.name);
        const q = generateProceduralQuestionFromContranArticle(artigo);
        persistSeenStatement(q.statement);
        return q;
      }
    },
    [persistSeenStatement]
  );

  // Alternância Estrita: Rodada 1 = CTB, Rodada 2 = CONTRAN...
  const getCategoryForRound = (round: number): QuestionCategory => {
    return round % 2 === 1 ? 'CTB' : 'CONTRAN';
  };

  const startNewGame = useCallback(() => {
    if (executionTimerRef.current !== null) {
      window.clearTimeout(executionTimerRef.current);
      executionTimerRef.current = null;
    }
    soundFX.playWeaponReady();
    setActiveTab('arena');
    setScore(0);
    setRoundNumber(1);
    setRunHistory([]);
    setDeathReason(null);
    setLastFeedbackBanner(null);
    seenCuratedIdsRef.current.clear();

    const firstCategory: QuestionCategory = 'CTB';
    const firstQ = buildUniqueQuestion(firstCategory);

    setCurrentQuestion(firstQ);
    setTimeLeft(24.0);
    setGameState('playing');
  }, [buildUniqueQuestion]);

  // Execução do NPC quando o jogador erra ou estoura o tempo
  const triggerNpcExecution = useCallback(
    (reason: 'WRONG_TARGET' | 'TIMEOUT', playerChoice: boolean | null) => {
      if (!currentQuestion) return;
      soundFX.playNpcExecutionShot();
      setDeathReason(reason);
      setGameState('executing');

      const spent = Math.min(24, Math.max(0.1, 24 - timeLeft));
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

      // Registra no Raio-X Caveira e no banco de tópicos
      recordQuestionAttempt(currentQuestion, playerChoice, false, spent, reason);

      if (executionTimerRef.current !== null) {
        window.clearTimeout(executionTimerRef.current);
      }
      executionTimerRef.current = window.setTimeout(() => {
        executionTimerRef.current = null;
        setGameState('gameover');
      }, 1250);
    },
    [currentQuestion, roundNumber, timeLeft, recordQuestionAttempt]
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

        // Registra acerto no Raio-X Caveira e estatísticas de tópicos
        recordQuestionAttempt(currentQuestion, choice, true, spent);

        setLastFeedbackBanner({
          text: `ALVO CORRETO (${currentQuestion.answer ? 'CERTO' : 'ERRADO'})`,
          legalBasis: currentQuestion.legalBasis,
        });

        const nextRound = roundNumber + 1;
        const nextCat = getCategoryForRound(nextRound);
        const nextQ = buildUniqueQuestion(nextCat);

        setRoundNumber(nextRound);
        setCurrentQuestion(nextQ);
        setTimeLeft(24.0);
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
      triggerNpcExecution,
      recordQuestionAttempt,
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

  // Checagem de estouro do tempo de 24s
  useEffect(() => {
    if (gameState === 'playing' && timeLeft <= 0) {
      triggerNpcExecution('TIMEOUT', null);
    }
  }, [gameState, timeLeft, triggerNpcExecution]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFX.muted = next;
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Teclas de atalho para atirar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'h') {
        setDockCollapsed((prev) => !prev);
        return;
      }

      if (key === 'f') {
        toggleFullscreen();
        return;
      }

      if (activeTab !== 'arena') return;

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
  }, [gameState, activeTab, startNewGame, toggleFullscreen]);

  const filteredVadeMecum = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'CTB' | 'CONTRAN';
      title: string;
      subtitle: string;
      content: string;
    }> = [];

    if (vadeMecumFilter === 'ALL' || vadeMecumFilter === 'CTB') {
      LEI_SECA_CTB.forEach((a) => {
        list.push({
          id: a.id,
          category: 'CTB',
          title: a.dispositivo,
          subtitle: a.capitulo,
          content: a.texto,
        });
      });
    }

    if (vadeMecumFilter === 'ALL' || vadeMecumFilter === 'CONTRAN') {
      LEI_SECA_CONTRAN.forEach((a) => {
        list.push({
          id: a.id,
          category: 'CONTRAN',
          title: a.dispositivo,
          subtitle: `${a.resolucao} · ${a.assunto}`,
          content: a.texto,
        });
      });
    }

    if (!vadeMecumSearch.trim()) return list;
    const q = vadeMecumSearch.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q)
    );
  }, [vadeMecumFilter, vadeMecumSearch]);

  // Computa o ranking dos assuntos mais errados e mais acertados no Duelo FPS
  const fpsTopicReport = useMemo(() => {
    try {
      const raw = localStorage.getItem(FPS_TOPIC_STATS_KEY);
      if (!raw) return { mostErrored: [], mostHit: [], totalShots: 0, totalHits: 0, totalErrors: 0 };
      const stats = JSON.parse(raw);
      const list = Object.values(stats.topics || {}).map((t: any) => {
        const grossRate = t.total > 0 ? Math.round((t.hits / t.total) * 100) : 0;
        const errorRate = 100 - grossRate;
        const avgTime = t.total > 0 && typeof t.totalTime === 'number' && !isNaN(t.totalTime) ? (t.totalTime / t.total).toFixed(1) : '0.0';
        return {
          ...t,
          grossRate,
          errorRate,
          avgTime,
        };
      });

      const mostErrored = [...list]
        .filter((t) => t.errors > 0)
        .sort((a, b) => b.errors - a.errors || b.errorRate - a.errorRate);

      const mostHit = [...list]
        .filter((t) => t.hits > 0)
        .sort((a, b) => b.hits - a.hits || b.grossRate - a.grossRate);

      return {
        mostErrored,
        mostHit,
        totalShots: stats.totalShots || 0,
        totalHits: stats.totalHits || 0,
        totalErrors: stats.totalErrors || 0,
      };
    } catch {
      return { mostErrored: [], mostHit: [], totalShots: 0, totalHits: 0, totalErrors: 0 };
    }
  }, [fpsTopicStatsVersion]);

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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-400">
                PRF 24s
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Duelo Tático: Todo o CTB & Resoluções CONTRAN</p>
          </div>
        </div>

        {/* Navegação entre Abas */}
        <nav className="hidden sm:flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-zinc-400">
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
            onClick={() => setActiveTab('guia')}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guia' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Guia PRF (Mais Cobrados)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raiox')}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'raiox' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Raio-X de Assuntos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vademecum')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'vademecum' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            Base Legal ({filteredVadeMecum.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'historico' ? 'text-amber-400 underline underline-offset-8' : 'hover:text-zinc-100'
            }`}
          >
            Bateria Atual ({runHistory.length})
          </button>
        </nav>

        {/* Controles & Botões da Direita */}
        <div className="flex items-center gap-2.5 shrink-0">
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

      {/* ÁREA CENTRAL PRINCIPAL */}
      <main className="flex-1 relative overflow-hidden bg-black">
        {/* ABA 1: ESTANDE 3D */}
        <div className={`absolute inset-0 z-0 ${activeTab === 'arena' ? 'block' : 'hidden'}`}>
          <TacticalRange3D
            gameState={gameState}
            currentQuestion={currentQuestion}
            timeLeft={timeLeft}
            roundNumber={roundNumber}
            isExecuting={gameState === 'executing'}
            isPlayerAlive={gameState !== 'gameover'}
            hoveredTarget={hoveredTarget}
            onShootTarget={handleShootTarget}
            onHoverTargetChange={setHoveredTarget}
            externalShotCommand={externalShotCommand}
          />
        </div>

        {activeTab === 'arena' && (
          <>
            {/* HUD SUPERIOR: CRONÔMETRO DE 24S + PLACAR */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
              {/* Placar de Rodadas */}
              <div className="flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-zinc-800 text-xs font-mono">
                <span className="text-zinc-500 uppercase text-[10px] font-bold">Rodada</span>
                <span className="text-amber-400 font-black">#{roundNumber}</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">Score: <strong className="text-zinc-100">{score}</strong></span>
              </div>

              {/* Cronômetro Central de 24 Segundos */}
              <div
                className={`px-4 py-1.5 rounded-2xl border font-mono font-black text-sm flex items-center gap-2 backdrop-blur-md transition-all shadow-lg ${
                  timeLeft <= 5
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse shadow-red-500/30'
                    : timeLeft <= 10
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-amber-500/20'
                    : 'bg-zinc-950/90 border-zinc-800 text-zinc-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="tabular-nums text-base">{(typeof timeLeft === 'number' && !isNaN(timeLeft) ? timeLeft : 24.0).toFixed(1)}s</span>
              </div>

              {/* Categoria Atual (Alternância Estrita) */}
              {currentQuestion && (
                <div
                  className={`px-3 py-1.5 rounded-2xl border text-[11px] font-bold uppercase backdrop-blur-md ${
                    currentQuestion.category === 'CTB'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  }`}
                >
                  {currentQuestion.category}
                </div>
              )}
            </div>

            {/* FEEDBACK BANNER (QUANDO ACERTA) */}
            {lastFeedbackBanner && gameState === 'playing' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lastFeedbackBanner.text}</span>
              </div>
            )}

            {/* DOCK INFERIOR: PAINEL DA ASSERTIVA CEBRASPE */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-20">
              <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-4 shadow-2xl space-y-3">
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-bold text-zinc-300">
                      {currentQuestion?.topic || 'SITUAÇÃO DE FISCALIZAÇÃO'}
                    </span>
                    {currentQuestion?.wasAiRewritten && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        IA Inédita
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDockCollapsed((prev) => !prev)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    title={dockCollapsed ? 'Expandir HUD' : 'Recolher HUD (H)'}
                  >
                    {dockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {!dockCollapsed && (
                  <>
                    {/* Enunciado Cebraspe */}
                    <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                      <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-relaxed">
                        {currentQuestion ? (
                          currentQuestion.statement
                        ) : (
                          <span className="text-zinc-500 italic">
                            Aguardando início. Pressione Enter ou clique em Iniciar para carregar o primeiro item...
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Botões Táticos de Tiro (Alvos Certo / Errado) */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        disabled={gameState !== 'playing'}
                        onMouseEnter={() => setHoveredTarget('CERTO')}
                        onMouseLeave={() => setHoveredTarget(null)}
                        onClick={() => handleShootTarget(true)}
                        className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                          gameState === 'playing'
                            ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/40 active:scale-95 shadow-lg shadow-emerald-950/40'
                            : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Disparar em CERTO (C / 1)</span>
                      </button>

                      <button
                        type="button"
                        disabled={gameState !== 'playing'}
                        onMouseEnter={() => setHoveredTarget('ERRADO')}
                        onMouseLeave={() => setHoveredTarget(null)}
                        onClick={() => handleShootTarget(false)}
                        className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                          gameState === 'playing'
                            ? 'bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border-red-500/40 active:scale-95 shadow-lg shadow-red-950/40'
                            : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                        }`}
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>Disparar em ERRADO (E / 2)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* OVERLAY DE MORTE / GAME OVER */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 z-40 bg-red-950/85 backdrop-blur-md flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-zinc-950 border border-red-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8 animate-pulse" />
                  </div>

                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider text-red-400">
                      {deathReason === 'TIMEOUT' ? 'TEMPO ESGOTADO: VOCÊ FOI ABATIDO!' : 'ALVO ERRADO: DISPARO FATAL DO NPC!'}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      {deathReason === 'TIMEOUT'
                        ? 'Os 24 segundos esgotaram antes que você realizasse o disparo.'
                        : 'O operador tático reagiu instantaneamente ao seu tiro incorreto.'}
                    </p>
                  </div>

                  {currentQuestion && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-left text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-amber-400 font-bold">{currentQuestion.category} · {currentQuestion.legalBasis}</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold">
                          Gabarito: {currentQuestion.answer ? 'CERTO' : 'ERRADO'}
                        </span>
                      </div>
                      <p className="text-zinc-300 italic">"{currentQuestion.statement}"</p>
                      <p className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/80">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 py-1 font-mono text-center">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px]">Sobreviveu</span>
                      <strong className="text-xl text-zinc-100 font-black">{score} rodadas</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px]">Recorde Pessoal</span>
                      <strong className="text-xl text-amber-400 font-black">{highScore} rodadas</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('raiox')}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Raio-X
                    </button>
                    <button
                      type="button"
                      onClick={startNewGame}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
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

        {/* ABA 2: RAIO-X DE ASSUNTOS (MAIS ERRADOS vs MAIS ACERTADOS NO DUELO) */}
        {activeTab === 'raiox' && (
          <div className="absolute inset-0 z-20 bg-zinc-950 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6 pb-16">
              {/* Cabeçalho */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <Skull className="w-5 h-5 text-red-500" />
                    RAIO-X DE ASSUNTOS: DUELO FPS 3D
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Mapeamento tático dos assuntos que você mais erra e mais acerta no CTB e Resoluções CONTRAN.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = '#/caveira';
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <span>Ver Raio-X Caveira Global</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('arena')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase cursor-pointer"
                  >
                    Voltar ao Tiro
                  </button>
                </div>
              </div>

              {/* KPIs de Desempenho do Duelo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total de Disparos</span>
                  <span className="text-2xl font-black text-zinc-100">{fpsTopicReport.totalShots}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Precisão Geral</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {fpsTopicReport.totalShots > 0
                      ? `${Math.round((fpsTopicReport.totalHits / fpsTopicReport.totalShots) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assuntos Críticos</span>
                  <span className="text-2xl font-black text-red-400">{fpsTopicReport.mostErrored.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assuntos Blindados</span>
                  <span className="text-2xl font-black text-cyan-400">{fpsTopicReport.mostHit.length}</span>
                </div>
              </div>

              {/* Duas Colunas: Mais Errados vs Mais Acertados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Coluna 1: Assuntos Mais Errados (Zona Crítica) */}
                <div className="p-4 rounded-3xl bg-zinc-900/80 border border-red-500/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-black uppercase text-red-400 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      ZONA CRÍTICA: ASSUNTOS MAIS ERRADOS ({fpsTopicReport.mostErrored.length})
                    </h3>
                    <span className="text-[10px] text-zinc-400">Alerta de Eliminação</span>
                  </div>

                  {fpsTopicReport.mostErrored.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      Nenhum erro registrado ainda. Continue disparando para mapear seus pontos fracos!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {fpsTopicReport.mostErrored.map((t: any, idx: number) => (
                        <div
                          key={t.topic}
                          className="p-3 rounded-2xl bg-zinc-950 border border-red-500/20 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-lg bg-red-500/20 text-red-400 font-mono text-[10px] flex items-center justify-center font-black">
                                #{idx + 1}
                              </span>
                              {t.topic}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold text-[10px]">
                              {t.errors} {t.errors === 1 ? 'erro' : 'erros'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>{t.category} · {t.legalBasis || 'Dispositivo Legal'}</span>
                            <span className="font-mono text-red-400 font-bold">{t.errorRate}% letal</span>
                          </div>

                          {/* Barra de erro */}
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-red-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, t.errorRate)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coluna 2: Assuntos Mais Acertados (Zona Blindada) */}
                <div className="p-4 rounded-3xl bg-zinc-900/80 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      ZONA BLINDADA: ASSUNTOS MAIS ACERTADOS ({fpsTopicReport.mostHit.length})
                    </h3>
                    <span className="text-[10px] text-zinc-400">Pontaria Afiada</span>
                  </div>

                  {fpsTopicReport.mostHit.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      Nenhum acerto registrado ainda. Inicie sua bateria no Estande 3D!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {fpsTopicReport.mostHit.map((t: any, idx: number) => (
                        <div
                          key={t.topic}
                          className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/20 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-black">
                                #{idx + 1}
                              </span>
                              {t.topic}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                              {t.hits} {t.hits === 1 ? 'acerto' : 'acertos'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span>{t.category} · {t.legalBasis || 'Dispositivo Legal'}</span>
                            <span className="font-mono text-emerald-400 font-bold">{t.grossRate}% precisão</span>
                          </div>

                          {/* Barra de acerto */}
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, t.grossRate)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: GUIA ESTRATÉGICO PRF (ASSUNTOS MAIS COBRADOS - SLIDES 1 A 10) */}
        {activeTab === 'guia' && (
          <div className="absolute inset-0 z-20 bg-zinc-950 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6 pb-16">
              {/* Cabeçalho */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    GUIA TÁTICO: O QUE MAIS CAI NO BLOCO II (TRÂNSITO NA PRF)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Mapeamento estatístico dos 195 itens de CTB e 71 itens de Resoluções cobrados pelo Cebraspe nas provas da PRF.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('arena')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase cursor-pointer"
                  >
                    Voltar ao Tiro
                  </button>
                </div>
              </div>

              {/* Status do Algoritmo de Ponderação Ativo */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-amber-300 uppercase tracking-wide">
                    Motor de Amostragem Ponderada Ativo no Aplicativo
                  </p>
                  <p className="text-zinc-400 mt-0.5">
                    As questões sorteadas no <strong>Estande 3D</strong> e nos <strong>Simulados</strong> já obedecem exatamente a estas proporções estatísticas. Tópicos de alta incidência (como Art. 20, Crimes e Cargas) caem com prioridade máxima.
                  </p>
                </div>
              </div>

              {/* Grid das 3 Fases Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FASE 1: O CTB QUE MAIS CAI */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      Fase 1
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">195 itens de CTB</span>
                  </div>
                  <h3 className="text-base font-black text-zinc-100">O CTB Que Mais Cai na PRF</h3>
                  <p className="text-xs text-zinc-400">
                    Mais da metade de tudo que já caiu de CTB nas provas da PRF está concentrado em apenas 3 grandes blocos:
                  </p>
                  <ul className="space-y-2 text-xs font-mono">
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Infrações + Penalidades e Medidas</span>
                      <span className="text-amber-400 font-black">50 itens (25,6%)</span>
                    </li>
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Normas Gerais de Circulação (Arts. 26 a 67)</span>
                      <span className="text-amber-400 font-black">29 itens (14,8%)</span>
                    </li>
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Sinalização de Trânsito (Arts. 80 a 90)</span>
                      <span className="text-amber-400 font-black">22 itens (11,3%)</span>
                    </li>
                  </ul>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                    <strong>💡 O Segredo da Ordem:</strong> Estude <em>Penalidade e Medida</em> antes da infração. Se você já domina suspensão, retenção e remoção, a lista de infrações vira simples leitura.
                  </div>
                </div>

                {/* FASE 2: OS CRIMES QUE MAIS CAEM */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-red-400 bg-red-400/10 px-2.5 py-1 rounded-lg border border-red-400/20">
                      Fase 2
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">28 itens de Crime (9 em 2019)</span>
                  </div>
                  <h3 className="text-base font-black text-zinc-100">Os Crimes de Trânsito Mais Cobrados</h3>
                  <p className="text-xs text-zinc-400">
                    No concurso da PRF de 2019, 9 de 40 itens foram de crimes. Os principais alvos da banca:
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    <li className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <strong className="text-red-400 font-mono">Art. 302:</strong> Homicídio culposo (causas de aumento na faixa e na calçada).
                    </li>
                    <li className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <strong className="text-red-400 font-mono">Art. 311:</strong> Velocidade incompatível perto de escolas/hospitais (exige perigo de dano).
                    </li>
                    <li className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <strong className="text-red-400 font-mono">Art. 298:</strong> Circunstâncias agravantes genéricas de trânsito.
                    </li>
                    <li className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <strong className="text-red-400 font-mono">Art. 306:</strong> Embriaguez ao volante (crime de perigo abstrato).
                    </li>
                    <li className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <strong className="text-red-400 font-mono">Art. 312:</strong> Fraude processual (alterar local do sinistro para enganar perícia).
                    </li>
                  </ul>
                  <p className="text-[11px] text-zinc-400 italic">
                    Depois: Arts. 303 (lesão culposa), 304 (omissão de socorro), 308 (racha), 309 (sem CNH gerando perigo de dano) e 310 (entregar direção a inabilitado).
                  </p>
                </div>

                {/* FASE 2: O QUE MAIS DERRUBA */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                      Fase 2
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">Pegadinhas Cebraspe</span>
                  </div>
                  <h3 className="text-base font-black text-zinc-100">O Que Mais Derruba na PRF</h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-emerald-400 font-mono">Art. 20 (Competências da PRF)</strong>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">5 das 7 provas</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Patrulhamento ostensivo, fiscalizar, multar, aplicar medidas administrativas, levantamento de sinistro, <strong>suspender o direito de dirigir</strong> quando prevista pra infração (Lei 14.071/2020) e <strong>perícia administrativa</strong> no local do sinistro (Lei 14.229/2021).
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                      <strong className="text-emerald-400 font-mono">Habilitação (Arts. 140 a 160)</strong>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Permissão para Dirigir (Art. 148), requisitos (140), categorias (143), exames de aptidão e validade (147), exame toxicológico (148-A) e CNH como identidade oficial (159).
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                      <strong className="text-emerald-400 font-mono">Registro Veicular (Art. 123)</strong>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Hipóteses de expedição de novo CRV. Procedimento de transferência de propriedade 100% eletrônico (Lei 15.153/2025).
                      </p>
                    </div>
                  </div>
                </div>

                {/* FASE 3: AS RESOLUÇÕES QUE VALEM HOJE */}
                <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-lg border border-purple-400/20">
                      Fase 3
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400">71 itens de Resoluções</span>
                  </div>
                  <h3 className="text-base font-black text-zinc-100">Resoluções Mais Cobradas por Tema</h3>
                  <p className="text-xs text-zinc-400">
                    Estude por tema e exclusivamente na versão vigente que vale hoje:
                  </p>
                  <ul className="space-y-1.5 text-xs font-mono">
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Cargas, Peso e Amarração (Res. 882, 945, 946)</span>
                      <span className="text-purple-400 font-black">16 itens</span>
                    </li>
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Registro, Documentos e Placas (Res. 1027, 968, 969)</span>
                      <span className="text-purple-400 font-black">15 itens</span>
                    </li>
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Segurança e Equipamentos (Res. 960, 970, 993)</span>
                      <span className="text-purple-400 font-black">9 itens</span>
                    </li>
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Fiscalização Eletrônica / Radares (Res. 798, 909)</span>
                      <span className="text-purple-400 font-black">6 itens</span>
                    </li>
                    <li className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <span className="text-zinc-300 font-bold">Motorista Profissional e Tacógrafo (Res. 938, 918)</span>
                      <span className="text-purple-400 font-black">6 itens</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Tabela De-Para: O que caiu em 2021 vs O que vale hoje */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-cyan-400" />
                    TABELA DE-PARA: EDITAL PRF 2021 ➔ ATUALIZADO HOJE
                  </h3>
                  <span className="text-xs text-zinc-400 font-mono">27 revogadas / 7 mantidas</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Tema / Assunto</th>
                        <th className="py-2.5 px-3">Resolução 2021 (Desatualizada)</th>
                        <th className="py-2.5 px-3">Resolução Vigente Atualizada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Fiscalização de Álcool e Drogas</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 432/2013</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 1.031/2026</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Processo de Habilitação e Exames</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resoluções 789/2020 e 360/2010</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 1.020/2025</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Registro, CRLV-e e Transferência</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 809/2020</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 1.027/2026 (fim do CRV papel)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Sistemas de Iluminação e Faróis</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resoluções 227/2007 e 667/2017</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 970/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Equipamentos Obrigatórios</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 14/1998</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 993/2023</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Amarração e Fixação de Cargas</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 552/2015</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 945/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Cargas a Granel (Lonas)</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 441/2013</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 946/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Pesos e Dimensões / CVC</td>
                        <td className="py-2 px-3 text-red-400 line-through">Res. 210, 211, 290, 520, 803</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 882/2021</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Vidros e Películas (Insulfilm)</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resoluções 216, 253 e 254</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 960/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Identificação Veicular (Chassi/VIN)</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 24/1998</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 968/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Placas de Identificação Mercosul</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 780/2019</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 969/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Cronotacógrafo (Velocímetro/Tempo)</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 92/1999</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 938/2022</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-zinc-300 font-sans font-bold">Videomonitoramento em Rodovias</td>
                        <td className="py-2 px-3 text-red-400 line-through">Resolução 471/2013</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">Resolução CONTRAN 909/2022</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Novidades Normativas 2025/2026 */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  GRANDES NOVIDADES 2025 E 2026 (QUESTÕES ALTAMENTE PROVÁVEIS)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">Lei 15.153/2025</span>
                    <strong className="text-zinc-200">Art. 123 do CTB:</strong> Transferência do veículo 100% eletrônica. Extingue qualquer exigência física presencial.
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">Lei 15.503/2026</span>
                    <strong className="text-zinc-200">Art. 143 do CTB:</strong> Condutor de categoria B autorizado a conduzir veículo elétrico ou híbrido com PBT de até 4.250 kg.
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">Lei 15.153/2025</span>
                    <strong className="text-zinc-200">Art. 148-A do CTB:</strong> Exame toxicológico estendido e exigido também na primeira habilitação para categorias A e B.
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">Lei 15.428/2026</span>
                    <strong className="text-zinc-200">Art. 159 do CTB:</strong> CNH física ou digital expressamente reconhecida e válida como documento oficial de identidade nacional.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: BASE LEGAL (VADE MECUM CTB & CONTRAN - LEI SECA OFICIAL) */}
        {activeTab === 'vademecum' && (
          <div className="absolute inset-0 z-20 bg-zinc-950 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4 pb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-400" />
                    VADE MECUM DA LEI SECA: CTB & CONTRAN
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Texto oficial compilado do Planalto (Lei nº 9.503/1997) e Resoluções CONTRAN que alimentam a IA.
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

              {/* Barra de Busca Rápida na Lei Seca */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por artigo (ex: Art. 29, Art. 165), tema (álcool, velocidade, CNH) ou termo da lei..."
                  value={vadeMecumSearch}
                  onChange={(e) => setVadeMecumSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {filteredVadeMecum.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                  Nenhum dispositivo legal encontrado para a busca "{vadeMecumSearch}".
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredVadeMecum.slice(0, 100).map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                          item.category === 'CTB' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-zinc-200 font-bold">{item.title}</span>
                      </div>
                      <div className="text-xs text-zinc-400 font-medium">{item.subtitle}</div>
                      <div className="text-xs text-zinc-300 whitespace-pre-line bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/60 leading-relaxed font-sans max-h-60 overflow-y-auto">
                        {item.content}
                      </div>
                    </div>
                  ))}
                  {filteredVadeMecum.length > 100 && (
                    <div className="text-center py-2 text-xs text-zinc-500">
                      Mostrando os primeiros 100 de {filteredVadeMecum.length} artigos encontrados. Refine sua busca acima para encontrar artigos específicos.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 4: HISTÓRICO DA BATERIA */}
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
                          {item.survived ? '✓ SOBREVIVEU' : item.playerChoice === null ? '✕ TEMPO ESGOTADO' : '✕ TIRO ERRADO'} ({(typeof item.timeSpent === 'number' && !isNaN(item.timeSpent) ? item.timeSpent : 0).toFixed(1)}s)
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
    </div>
  );
}
