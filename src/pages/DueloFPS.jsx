import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Crosshair, ShieldAlert, Skull, Play, RotateCcw, Volume2, VolumeX, 
  Flame, Award, AlertTriangle, Maximize2, Minimize2, CheckCircle2, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SISTEMA DE ÁUDIO PROCEDURAL TÁTICO (WEB AUDIO API NATIVA) ---
class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tiro do Jogador
  playPlayerShot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Ruído explosivo (white noise)
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Oscilador grave de punch (impacto seco de 9mm / calibre policial)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Tiro Fatal do NPC Inimigo
  playNpcExecution() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Disparo ensurdecedor e violento
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Zumbido agudo no ouvido pós-disparo (tinnitus de morte)
    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(4200, now + 0.05);
    toneGain.gain.setValueAtTime(0.25, now + 0.05);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    tone.connect(toneGain);
    toneGain.connect(this.ctx.destination);
    tone.start(now + 0.05);
    tone.stop(now + 1.2);
  }

  // Impacto Metálico na Placa
  playPlacaImpact(isCorrect) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCorrect ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isCorrect ? 880 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(isCorrect ? 1320 : 110, now + 0.15);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Batimento cardíaco acelerado de estresse (quando timer < 8s)
  playHeartbeat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

const audio = new TacticalAudio();

// --- MOTOR GERADOR DE QUESTÕES (CTB & CONTRAN COM ANTI-REPETIÇÃO) ---
const CTB_TEMPLATES = [
  {
    topic: 'Alcoolemia e Crime de Trânsito',
    legalRef: 'CTB, art. 306 e art. 165',
    generate: (variant) => {
      const isCorrect = variant % 2 === 0;
      const veiculos = ['automóvel de passeio', 'caminhão de carga', 'motocicleta', 'veículo de transporte escolar'];
      const veic = veiculos[variant % veiculos.length];
      const niveis = isCorrect 
        ? 'concentração de álcool por litro de sangue igual ou superior a 6 decigramas, ou igual ou superior a 0,3 miligrama por litro de ar alveolar'
        : 'concentração igual ou superior a 0,2 miligrama por litro de ar alveolar ou qualquer quantidade constatada por bafômetro';

      return {
        statement: `O condutor de ${veic} que for flagrado pela fiscalização rodoviária conduzindo veículo com ${niveis} comete crime de trânsito, sujeito às penas de detenção, multa e suspensão ou proibição de se obter a CNH.`,
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: O art. 306 do CTB tipifica como crime a condução com concentração igual ou superior a 6 dg/L de sangue ou igual ou superior a 0,30 mg/L de ar alveolar.'
          : 'ERRADO: O patamar do crime exige pelo menos 0,30 mg/L de ar alveolar (ou 6 dg/L de sangue). Valores inferiores (com margem regulamentar) configuram infração administrativa do art. 165, e não crime.'
      };
    }
  },
  {
    topic: 'Recusa ao Teste do Bafômetro',
    legalRef: 'CTB, art. 165-A',
    generate: (variant) => {
      const isCorrect = variant % 2 === 1;
      const locais = ['em rodovia federal', 'em rodovia estadual pavimentada', 'durante comando de fiscalização da PRF'];
      const loc = locais[variant % locais.length];

      return {
        statement: isCorrect
          ? `Ao condutor abordado ${loc} que recusar submeter-se a teste, exame clínico ou perícia para certificação de embriaguez, aplicam-se as mesmas penalidades de multa (dez vezes) e suspensão do direito de dirigir por doze meses previstas para quem dirige embriagado.`
          : `Ao condutor abordado ${loc} que recusar submeter-se ao teste do etilômetro, não poderá ser lavrada autuação por recusa se ele não apresentar qualquer sinal visível de alteração psicomotora, sendo a recusa um direito constitucional ao silêncio.`,
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: O art. 165-A do CTB expressamente comina para a recusa as mesmíssimas penalidades e medidas administrativas da alcoolemia comprovada (multa de 10x e suspensão por 12 meses).'
          : 'ERRADO: Conforme jurisprudência pacífica do STF (Tema 1079), a infração do art. 165-A é autônoma e objetiva. A recusa por si só basta para a autuação, independentemente de sinais de alteração.'
      };
    }
  },
  {
    topic: 'Excesso de Velocidade e Suspensão',
    legalRef: 'CTB, art. 218',
    generate: (variant) => {
      const isCorrect = variant % 2 === 0;
      const vias = [
        { nome: 'rodovia com velocidade máxima de 110 km/h', limite: 110, velExcess: 170, pct: 'mais de 50%' },
        { nome: 'via arterial com limite de 60 km/h', limite: 60, velExcess: 95, pct: 'mais de 50%' }
      ];
      const via = vias[variant % vias.length];

      return {
        statement: isCorrect
          ? `Transitar em velocidade superior à máxima permitida para ${via.nome} em ${via.pct} configura infração gravíssima punida com multa multiplicada por três e suspensão direta do direito de dirigir.`
          : `Transitar em velocidade superior à máxima permitida em ${via.nome} em mais de 50% é infração grave, exigindo prévia reincidência no período de doze meses para ensejar a suspensão do direito de dirigir.`,
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: O art. 218, III do CTB prevê expressamente: velocidade superior à máxima em mais de 50% é gravíssima, multa (3x) e suspensão imediata do direito de dirigir.'
          : 'ERRADO: É infração gravíssima e acarreta a suspensão do direito de dirigir de forma direta (autossuspensiva), sem necessidade de reincidência.'
      };
    }
  },
  {
    topic: 'Medidas Administrativas vs Penalidades',
    legalRef: 'CTB, art. 256 e art. 269',
    generate: (variant) => {
      const isCorrect = variant % 2 === 1;
      return {
        statement: isCorrect
          ? 'A retenção do veículo e o recolhimento do documento de habilitação constituem medidas administrativas adotadas de imediato pela autoridade ou agente policial de trânsito, ao passo que a suspensão do direito de dirigir e a cassação da CNH são penalidades.'
          : 'A retenção e a remoção de veículo para o depósito público configuram penalidades formais de trânsito que só podem ser aplicadas pelo Diretor-Geral da Polícia Rodoviária Federal após o trânsito em julgado administrativo.',
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: O art. 269 lista as medidas administrativas (retenção, remoção, recolhimento), enquanto o art. 256 lista as penalidades (multa, suspensão, cassação).'
          : 'ERRADO: Retenção e remoção são medidas administrativas (art. 269), e não penalidades. Podem e devem ser aplicadas de plano pelo agente em fiscalização de campo.'
      };
    }
  },
  {
    topic: 'Ultrapassagem em Pista Simples',
    legalRef: 'CTB, art. 203',
    generate: (variant) => {
      const isCorrect = variant % 2 === 0;
      return {
        statement: isCorrect
          ? 'Ultrapassar outro veículo pela contramão em curvas, aclives ou declives sem visibilidade suficiente constitui infração de natureza gravíssima com aplicação de fator multiplicador de cinco vezes sobre o valor da multa.'
          : 'Ultrapassar pela contramão nas pontes, viadutos ou túneis é classificado como infração de natureza média, permitindo-se a conversão da multa em advertência por escrito se o condutor não for reincidente.',
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: Art. 203, V do CTB: Ultrapassar pela contramão em curvas/declives sem visibilidade é infração gravíssima, com multa agravada em 5 vezes.'
          : 'ERRADO: Ultrapassar pela contramão em pontes, viadutos e túneis é infração gravíssima com multa (5x), dada a extrema periculosidade da manobra.'
      };
    }
  }
];

const CONTRAN_TEMPLATES = [
  {
    topic: 'Resolução CONTRAN nº 928 (Transporte de Crianças)',
    legalRef: 'Resolução CONTRAN 928/2022',
    generate: (variant) => {
      const isCorrect = variant % 2 === 0;
      const casos = [
        { idade: 'criança com 3 anos de idade', disp: 'dispositivo de retenção denominado cadeirinha' },
        { idade: 'criança de 6 anos de idade que não tenha atingido 1,45 m de altura', disp: 'assento de elevação' }
      ];
      const c = casos[variant % casos.length];

      return {
        statement: isCorrect
          ? `Nos termos da Resolução CONTRAN nº 928/2022, o transporte de ${c.idade} em veículos automotores particulares deve ser realizado obrigatoriamente no banco traseiro com a utilização de ${c.disp}.`
          : `De acordo com a Resolução CONTRAN nº 928/2022, crianças que já tenham completado 7 anos de idade estão dispensadas de qualquer dispositivo especial de retenção, podendo viajar no banco dianteiro apenas com o cinto de segurança padrão de três pontos.`,
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: A Resolução 928/2022 exige bebê conforto (até 1 ano), cadeirinha (1 a 4 anos) e assento de elevação (4 a 7 anos e meio ou até 1,45 m). Crianças menores de 10 anos vão sempre no banco traseiro.'
          : 'ERRADO: O transporte no banco dianteiro só é permitido para crianças com idade superior a 10 anos (ou com altura superior a 1,45 m).'
      };
    }
  },
  {
    topic: 'Resolução CONTRAN nº 432 (Fiscalização de Alcoolemia)',
    legalRef: 'Resolução CONTRAN 432/2013',
    generate: (variant) => {
      const isCorrect = variant % 2 === 1;
      return {
        statement: isCorrect
          ? 'Para a caracterização do crime de embriaguez ao volante pelo teste de etilômetro, deve ser considerado o valor medido descontada a margem de erro metrológica, sendo exigido valor considerado igual ou superior a 0,34 mg/L de ar alveolar.'
          : 'Na fiscalização da alcoolemia com etilômetro, a constatação de qualquer valor medido superior a 0,01 mg/L, mesmo sem aplicação de margem de erro, autoriza imediatamente a prisão em flagrante por crime de trânsito.',
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: Conforme a Resolução CONTRAN 432/2013 (Tabela de Margem de Erro), para alcançar o patamar penal de 0,30 mg/L considerado, a medição do etilômetro deve indicar no mínimo 0,34 mg/L.'
          : 'ERRADO: O crime de trânsito exige 0,34 mg/L medido (0,30 mg/L considerado). Valores abaixo disso configuram infração administrativa (art. 165), jamais crime imediato.'
      };
    }
  },
  {
    topic: 'Resolução CONTRAN nº 798 (Radares e Medidores de Velocidade)',
    legalRef: 'Resolução CONTRAN 798/2020',
    generate: (variant) => {
      const isCorrect = variant % 2 === 0;
      return {
        statement: isCorrect
          ? 'É expressamente vedada pela Resolução CONTRAN nº 798/2020 a utilização de medidores de velocidade de tipo fixo ou portátil instalados de forma oculta, camuflada ou escondida atrás de árvores e muretas.'
          : 'A autoridade de trânsito tem permissão legal expressa para utilizar radares portáteis camuflados em viaturas descaracterizadas nas rodovias federais sem necessidade de divulgação prévia de trecho fiscalizado.',
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: O art. 5º da Res. 798/2020 veda categoricamente a instalação de radares em locais onde não estejam visíveis aos condutores (proibição de radar oculto/pegadinha).'
          : 'ERRADO: A Resolução 798/2020 proíbe expressamente radares camuflados ou escondidos, exigindo publicidade prévia e visibilidade aos motoristas.'
      };
    }
  },
  {
    topic: 'Resolução CONTRAN nº 996 (Ciclomotores e Bicicletas Elétricas)',
    legalRef: 'Resolução CONTRAN 996/2023',
    generate: (variant) => {
      const isCorrect = variant % 2 === 1;
      return {
        statement: isCorrect
          ? 'Bicicletas elétricas dotadas de motor auxiliar de até 1.000 W que funcionem apenas com pedalada assistida (sem acelerador manual) e com velocidade máxima de até 32 km/h não são equiparadas a ciclomotores e dispensam emplacamento e habilitação ACC.'
          : 'Toda bicicleta com motor elétrico, independentemente da potência ou de possuir apenas pedal assistido, é classificada como ciclomotor e exige obrigatoriamente CNH categoria A e emplacamento no Detran.',
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: A Resolução 996/2023 pacificou: bicicleta elétrica sem acelerador, até 1000W e máxima de 32 km/h é equiparada à bicicleta comum, dispensando registro, emplacamento e habilitação.'
          : 'ERRADO: A Res. 996/2023 distinguiu claramente bicicletas elétricas de ciclomotores. Nem toda bike elétrica é ciclomotor.'
      };
    }
  },
  {
    topic: 'Resolução CONTRAN nº 912 (Equipamentos Obrigatórios)',
    legalRef: 'Resolução CONTRAN 912/2022',
    generate: (variant) => {
      const isCorrect = variant % 2 === 0;
      return {
        statement: isCorrect
          ? 'Para automóveis, camionetas e caminhonetes, o extintor de incêndio com carga de pó ABC é equipamento de uso facultativo, embora a sua manutenção em desacordo com as normas enseje autuação caso o proprietário opte por utilizá-lo.'
          : 'O extintor de incêndio permanece equipamento estritamente obrigatório para todos os veículos de passeio particulares, sob pena de infração gravíssima e remoção do veículo.',
        isCorrect,
        explanation: isCorrect
          ? 'CERTO: Conforme a Resolução 912/2022 (e histórico desde a Res. 556), o extintor é facultativo para veículos de passeio, utilitários e camionetas. Se estiver a bordo, porém, deve estar válido.'
          : 'ERRADO: O extintor é facultativo para carros de passeio comuns. Só é obrigatório para veículos de transporte coletivo de passageiros, escolares e de carga inflamável.'
      };
    }
  }
];

export default function DueloFPS() {
  const [gameState, setGameState] = useState('lobby'); // 'lobby' | 'playing' | 'survived_round' | 'dead'
  const [roundNumber, setRoundNumber] = useState(1);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('qg_duelo_highscore')) || 0;
    } catch (_) {
      return 0;
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(24.0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animações e Feedback Visual FPS
  const [isGunRecoiling, setIsGunRecoiling] = useState(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const [npcGunFiring, setNpcGunFiring] = useState(false);
  const [bloodSplatter, setBloodSplatter] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [shotImpact, setShotImpact] = useState(null); // { x, y, isCerto }
  const [npcState, setNpcState] = useState('aiming'); // 'aiming' | 'hesitating' | 'shooting'

  const arenaRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const questionVariantSeed = useRef(Math.floor(Math.random() * 1000));

  // Sincroniza áudio mudo
  useEffect(() => {
    audio.muted = muted;
  }, [muted]);

  // Alternância Estrita: Rodada Ímpar = CTB, Rodada Par = CONTRAN
  const pickNextQuestion = useCallback((round) => {
    questionVariantSeed.current += 1;
    const isCtbRound = round % 2 === 1;

    let pool = isCtbRound ? CTB_TEMPLATES : CONTRAN_TEMPLATES;
    const templateIndex = Math.floor(Math.random() * pool.length);
    const chosenTemplate = pool[templateIndex];

    const generated = chosenTemplate.generate(questionVariantSeed.current);

    return {
      category: isCtbRound ? 'CTB • Código de Trânsito Brasileiro' : 'RESOLUÇÃO DO CONTRAN',
      categoryTag: isCtbRound ? 'CTB' : 'CONTRAN',
      topic: chosenTemplate.topic,
      legalRef: chosenTemplate.legalRef,
      statement: generated.statement,
      isCorrect: generated.isCorrect,
      explanation: generated.explanation,
      round
    };
  }, []);

  // Iniciar Nova Partida
  const startGame = () => {
    audio.init();
    setRoundNumber(1);
    setStreak(0);
    setBloodSplatter(false);
    setNpcGunFiring(false);
    setNpcState('aiming');

    const firstQ = pickNextQuestion(1);
    setCurrentQuestion(firstQ);
    setTimeLeft(24.0);
    setGameState('playing');
  };

  // Temporizador de 24 segundos
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const interval = 100; // a cada 0.1s
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const nextTime = Math.max(0, Number((prev - 0.1).toFixed(1)));

        // Batimento cardíaco de estresse nos últimos 8 segundos
        if (nextTime <= 8.0 && nextTime > 0 && Math.round(nextTime * 10) % 8 === 0) {
          audio.playHeartbeat();
        }

        // Tempo esgotou: NPC atira e elimina o jogador!
        if (nextTime <= 0) {
          clearInterval(timerIntervalRef.current);
          handleTimeoutDeath();
          return 0;
        }
        return nextTime;
      });
    }, interval);

    return () => clearInterval(timerIntervalRef.current);
  }, [gameState]);

  // Morte por Timeout (Tempo Esgotado)
  const handleTimeoutDeath = () => {
    setNpcState('shooting');
    setNpcGunFiring(true);
    setScreenShake(true);
    setBloodSplatter(true);
    audio.playNpcExecution();

    setTimeout(() => {
      setScreenShake(false);
      setGameState('dead');
    }, 450);
  };

  // Disparo do Jogador em uma Placa (Certo ou Errado)
  const handleShootPlate = (userChoice, e) => {
    if (gameState !== 'playing') return;

    // Posição de impacto visual
    const rect = e.currentTarget.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;
    setShotImpact({ x: hitX, y: hitY, choice: userChoice });

    // Animação de tiro da arma do jogador
    setIsGunRecoiling(true);
    setMuzzleFlash(true);
    audio.playPlayerShot();

    setTimeout(() => setMuzzleFlash(false), 70);
    setTimeout(() => setIsGunRecoiling(false), 140);

    const isAnswerCorrect = (userChoice === 'CERTO' && currentQuestion.isCorrect) ||
                            (userChoice === 'ERRADO' && !currentQuestion.isCorrect);

    audio.playPlacaImpact(isAnswerCorrect);

    if (isAnswerCorrect) {
      // SOBREVIVEU! NPC recua, pontuação sobe, próxima rodada
      setNpcState('hesitating');
      const newStreak = streak + 1;
      setStreak(newStreak);

      if (newStreak > highScore) {
        setHighScore(newStreak);
        try {
          localStorage.setItem('qg_duelo_highscore', String(newStreak));
        } catch (_) {}
      }

      setGameState('survived_round');

      setTimeout(() => {
        const nextRound = roundNumber + 1;
        setRoundNumber(nextRound);
        setCurrentQuestion(pickNextQuestion(nextRound));
        setTimeLeft(24.0);
        setNpcState('aiming');
        setShotImpact(null);
        setGameState('playing');
      }, 1200);

    } else {
      // ERROU: NPC atira de volta instantaneamente!
      setTimeout(() => {
        setNpcState('shooting');
        setNpcGunFiring(true);
        setScreenShake(true);
        setBloodSplatter(true);
        audio.playNpcExecution();

        setTimeout(() => {
          setScreenShake(false);
          setGameState('dead');
        }, 500);
      }, 150);
    }
  };

  // Alternar tela cheia na arena
  const toggleFullscreen = () => {
    if (!arenaRef.current) return;
    if (!document.fullscreenElement) {
      arenaRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Barra de Status Superior */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl glass-card border border-red-500/30 bg-slate-900/90 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400">
            <Crosshair className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
              DUELO TÁTICO • ROOFTOPS FPS
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                CTB & CONTRAN
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Atire na placa certa em 24 segundos. Se errar ou o tempo acabar, o suspeito atira.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak e Recorde */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Streak:</span>
            <strong className="text-amber-400 font-black">{streak}</strong>
            <span className="text-slate-600">|</span>
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Recorde:</span>
            <strong className="text-emerald-400 font-black">{highScore}</strong>
          </div>

          {/* Áudio Toggle */}
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title={muted ? 'Ativar Áudio' : 'Mutar Áudio'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* ARENA DE TIRO FPS */}
      <div 
        ref={arenaRef}
        className={`relative w-full overflow-hidden rounded-3xl border-2 border-red-950/80 bg-black select-none shadow-[0_0_50px_rgba(0,0,0,0.9)] ${
          screenShake ? 'animate-bounce' : ''
        }`}
        style={{ minHeight: isFullscreen ? '100vh' : '620px' }}
      >
        {/* Luz ambiente de galpão tático abandonado à noite */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0c10] to-[#040507]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[130px] pointer-events-none" />

        {/* Efeito de Sangue / Morte na Tela */}
        <AnimatePresence>
          {bloodSplatter && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 pointer-events-none bg-radial from-red-600/30 via-red-950/80 to-black/95 mix-blend-multiply flex items-center justify-center"
            >
              <div className="text-center p-6 border-4 border-red-600 rounded-3xl bg-black/90 shadow-[0_0_80px_rgba(220,38,38,0.8)]">
                <Skull className="w-16 h-16 text-red-500 mx-auto animate-pulse mb-2" />
                <h2 className="text-3xl sm:text-5xl font-black text-red-500 tracking-widest uppercase font-mono">
                  VOCÊ MORREU
                </h2>
                <p className="text-sm font-bold text-slate-300 mt-2">
                  O suspeito disparou contra você.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Efeito de Muzzle Flash do NPC */}
        {npcGunFiring && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-200 blur-2xl z-30 animate-ping opacity-90" />
        )}

        {/* --- TELA 1: LOBBY / INÍCIO --- */}
        {gameState === 'lobby' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-md">
            <div className="p-4 rounded-3xl bg-red-600/10 border-2 border-red-500/30 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <Skull className="w-16 h-16 text-red-500 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-widest">
              OPERAÇÃO EMBOSCADA: CTB & CONTRAN
            </h2>
            <p className="max-w-lg text-xs sm:text-sm text-slate-400 mt-2 font-medium">
              Um suspeito armado está com a pistola apontada para a sua cabeça. A cada rodada surge uma questão inédita (alternando rigorosamente entre <strong>CTB</strong> e <strong>Resoluções do CONTRAN</strong>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 max-w-xl w-full text-left">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="block font-black text-amber-400 uppercase text-[10px]">Tempo Limite</span>
                <span className="text-slate-200 font-bold">24 Segundos</span> para mirar e atirar.
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="block font-black text-blue-400 uppercase text-[10px]">Alternância</span>
                <span className="text-slate-200 font-bold">CTB ↔ CONTRAN</span> a cada tiro.
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <span className="block font-black text-red-400 uppercase text-[10px]">Regra Fatal</span>
                <span className="text-slate-200 font-bold">Errou = Morte</span> imediata.
              </div>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all cursor-pointer flex items-center gap-2 group"
            >
              <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              <span>SACAR ARMA & INICIAR DUELO</span>
            </button>
          </div>
        )}

        {/* --- TELA 2: GAMEPLAY ATIVA --- */}
        {(gameState === 'playing' || gameState === 'survived_round') && currentQuestion && (
          <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 z-10">
            {/* Topo: Categoria, Rodada e Cronômetro de 24 segundos */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 sm:px-5 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  currentQuestion.categoryTag === 'CTB' 
                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' 
                    : 'bg-purple-600/30 text-purple-400 border border-purple-500/40'
                }`}>
                  RODADA {roundNumber} • {currentQuestion.categoryTag}
                </span>
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                  {currentQuestion.legalRef}
                </span>
              </div>

              {/* CRONÔMETRO TENSO DE 24 SEGUNDOS */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-400">TEMPO:</span>
                <div className={`px-4 py-1 rounded-xl font-mono text-2xl font-black tabular-nums border shadow-inner ${
                  timeLeft <= 5.0 
                    ? 'bg-red-950 text-red-500 border-red-500 animate-ping'
                    : timeLeft <= 10.0
                    ? 'bg-amber-950/80 text-amber-400 border-amber-500'
                    : 'bg-slate-900 text-emerald-400 border-emerald-500/40'
                }`}>
                  {timeLeft.toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Painel Central com a Questão Cebraspe */}
            <div className="max-w-3xl mx-auto my-auto w-full text-center space-y-4">
              <div className="glass-card rounded-3xl p-5 sm:p-7 border border-slate-700/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                
                <span className="text-[11px] font-black uppercase tracking-widest text-red-400 block mb-1">
                  {currentQuestion.topic}
                </span>

                <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed text-justify sm:text-center">
                  {currentQuestion.statement}
                </p>
              </div>

              {/* NPC SUSPEITO ARMADO (No centro da mira) */}
              <div className="relative flex flex-col items-center justify-center my-2 pointer-events-none select-none">
                {/* Silhueta / Visual do Inimigo com Arma Apontada */}
                <div className={`relative transition-all duration-300 ${
                  npcState === 'hesitating' ? 'scale-95 translate-y-3 opacity-60' : 'scale-100'
                }`}>
                  {/* Cabeça do NPC com máscara tática */}
                  <div className="w-14 h-16 rounded-2xl bg-neutral-800 border-2 border-neutral-600 mx-auto flex items-center justify-center shadow-lg relative">
                    {/* Olhos focados */}
                    <div className="flex gap-2">
                      <span className="w-2 h-1 bg-red-500 rounded-full animate-pulse" />
                      <span className="w-2 h-1 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  </div>
                  {/* Ombros e Torso */}
                  <div className="w-28 h-16 bg-neutral-900 border-2 border-neutral-700 rounded-t-3xl mx-auto mt-1 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-neutral-500 font-black">SUSPEITO</span>
                  </div>

                  {/* Arma do NPC Apontada para o Jogador */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black border-4 border-neutral-500 shadow-2xl flex items-center justify-center">
                    {/* Cano da pistola mirando na sua cara */}
                    <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-400" />
                  </div>
                </div>

                <div className="mt-1 text-[10px] font-black tracking-widest uppercase text-red-500">
                  {npcState === 'hesitating' ? '⚠️ SUSPEITO HESITOU' : '🚨 ARMA APONTADA PARA VOCÊ'}
                </div>
              </div>

              {/* AS DUAS PLACAS DE TIRO: [ CERTO ] e [ ERRADO ] */}
              <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-xl mx-auto pt-2">
                {/* PLACA ALVO CERTO */}
                <button
                  type="button"
                  onClick={(e) => handleShootPlate('CERTO', e)}
                  className="group relative p-6 sm:p-8 rounded-3xl border-3 border-emerald-500/60 bg-gradient-to-b from-slate-900 to-emerald-950/40 hover:border-emerald-400 hover:from-slate-800 hover:to-emerald-900/60 transition-all cursor-crosshair shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95 flex flex-col items-center justify-center"
                >
                  <span className="absolute -top-3 px-3 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    ALVO A
                  </span>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1 group-hover:scale-125 transition-transform" />
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-widest uppercase">
                    CERTO
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400/80 mt-1 uppercase">
                    [ CLIQUE PARA DISPARAR ]
                  </span>
                </button>

                {/* PLACA ALVO ERRADO */}
                <button
                  type="button"
                  onClick={(e) => handleShootPlate('ERRADO', e)}
                  className="group relative p-6 sm:p-8 rounded-3xl border-3 border-red-500/60 bg-gradient-to-b from-slate-900 to-red-950/40 hover:border-red-400 hover:from-slate-800 hover:to-red-900/60 transition-all cursor-crosshair shadow-[0_0_30px_rgba(239,68,68,0.2)] active:scale-95 flex flex-col items-center justify-center"
                >
                  <span className="absolute -top-3 px-3 py-0.5 rounded-full bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    ALVO B
                  </span>
                  <XCircle className="w-8 h-8 text-red-400 mb-1 group-hover:scale-125 transition-transform" />
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-widest uppercase">
                    ERRADO
                  </span>
                  <span className="text-[10px] font-bold text-red-400/80 mt-1 uppercase">
                    [ CLIQUE PARA DISPARAR ]
                  </span>
                </button>
              </div>
            </div>

            {/* ARMA DO JOGADOR EM PRIMEIRA PESSOA (FPS GUN NO CANTO INFERIOR DIREITO) */}
            <div className="relative w-full flex justify-end pointer-events-none select-none">
              <div className={`relative transition-transform duration-75 ${
                isGunRecoiling ? '-translate-y-6 rotate-3 scale-105' : 'translate-y-0 rotate-0'
              }`}>
                {/* Muzzle flash no cano */}
                {muzzleFlash && (
                  <div className="absolute -top-8 -left-4 w-16 h-16 bg-amber-300 rounded-full blur-md animate-ping" />
                )}
                {/* Modelo visual 2D estilizado da pistola policial */}
                <div className="w-28 sm:w-36 h-28 sm:h-36 relative flex items-end">
                  <div className="w-full h-24 bg-gradient-to-t from-slate-950 via-slate-800 to-slate-700 rounded-t-2xl border-4 border-slate-900 shadow-2xl relative">
                    <div className="absolute top-1 left-2 right-2 h-3 bg-slate-600 rounded-t-lg" />
                    <div className="absolute top-4 left-4 w-4 h-4 bg-emerald-500/50 rounded-full blur-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TELA 3: MORTO / GAME OVER --- */}
        {gameState === 'dead' && currentQuestion && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center bg-black/95 backdrop-blur-xl overflow-y-auto">
            <div className="p-3 rounded-full bg-red-600/20 border-2 border-red-500 mb-3 animate-bounce">
              <Skull className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-red-500 tracking-widest uppercase font-mono">
              FIM DA LINHA, POLICIAL
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-1">
              {timeLeft <= 0 ? 'Tempo de 24 segundos esgotado!' : 'Você disparou na placa errada.'}
            </p>

            {/* Gabarito Comentado Cebraspe */}
            <div className="my-4 max-w-2xl w-full p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
                <span className="text-red-400 uppercase">GABARITO OFICIAL: {currentQuestion.isCorrect ? 'CERTO' : 'ERRADO'}</span>
                <span className="text-slate-400">{currentQuestion.legalRef}</span>
              </div>
              <p className="text-xs text-slate-300 italic">
                "{currentQuestion.statement}"
              </p>
              <p className="text-xs font-semibold text-emerald-400 pt-1">
                {currentQuestion.explanation}
              </p>
            </div>

            {/* Placar Final */}
            <div className="flex items-center gap-6 my-2 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">SOBREVIVEU:</span>
                <strong className="text-xl text-white font-black">{streak} rodadas</strong>
              </div>
              <div>
                <span className="text-slate-400 block">RECORDE:</span>
                <strong className="text-xl text-amber-400 font-black">{highScore} rodadas</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="mt-4 px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TENTAR NOVAMENTE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
