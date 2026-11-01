/**
 * Utilitários para cálculo e formatação de durações e aceleração de vídeo-aulas
 */

/**
 * Converte string de duração ('MM:SS', 'HH:MM:SS' ou minutos) em segundos totais
 */
export const parseDurationToSeconds = (dur) => {
  if (!dur) return 0;
  if (typeof dur === 'number') return Math.round(dur * 60);
  const str = String(dur).trim();
  if (!str || str === '00:00') return 0;

  const parts = str.split(':').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && !parts.some(isNaN)) {
    return parts[0] * 60 + parts[1];
  }
  const numeric = parseFloat(str);
  if (!isNaN(numeric)) return Math.round(numeric * 60);
  return 0;
};

/**
 * Formata segundos no formato de relógio 'HH:MM:SS' ou 'MM:SS'
 */
export const formatSecondsToClock = (totalSec) => {
  if (!totalSec || isNaN(totalSec) || totalSec <= 0) return '00:00';
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
};

/**
 * Formata segundos em texto amigável 'Xh Ym' ou 'Xm'
 */
export const formatSecondsToFriendly = (totalSec) => {
  if (!totalSec || isNaN(totalSec) || totalSec <= 0) return '0m';
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0) {
    return `${m}m`;
  }
  return `${s}s`;
};

/**
 * Calcula a comparação entre tempo original e tempo acelerado
 */
export const calculateSpeedComparison = (originalSec, speed = 1) => {
  const orig = Math.max(0, Math.round(originalSec || 0));
  const spd = Math.max(0.5, Number(speed) || 1);
  const accel = Math.max(0, Math.round(orig / spd));
  const saved = Math.max(0, orig - accel);
  const percentSaved = spd > 1 ? Math.round((1 - 1 / spd) * 100) : 0;

  return {
    originalSeconds: orig,
    acceleratedSeconds: accel,
    savedSeconds: saved,
    originalClock: formatSecondsToClock(orig),
    acceleratedClock: formatSecondsToClock(accel),
    savedClock: formatSecondsToClock(saved),
    originalFriendly: formatSecondsToFriendly(orig),
    acceleratedFriendly: formatSecondsToFriendly(accel),
    savedFriendly: formatSecondsToFriendly(saved),
    percentSaved,
    speed: spd
  };
};

/**
 * Calcula o total de tempo de todas as aulas de uma disciplina (bruto e acelerado)
 */
export const getSubjectVideoStats = (subject, overrideSpeed = null) => {
  if (!subject) {
    return {
      totalLessons: 0,
      totalSeconds: 0,
      acceleratedSeconds: 0,
      savedSeconds: 0,
      speed: 1,
      totalFriendly: '0m',
      acceleratedFriendly: '0m',
      savedFriendly: '0m',
      percentSaved: 0
    };
  }

  const speed = overrideSpeed !== null ? Number(overrideSpeed) : (Number(subject.speed) || 1);
  let totalSeconds = 0;
  let totalLessons = 0;

  (subject.topics || []).forEach(topic => {
    if (topic.lessons && topic.lessons.length > 0) {
      topic.lessons.forEach(lesson => {
        totalLessons += 1;
        const sec = parseDurationToSeconds(lesson.duration || '00:00');
        // Se a duração for 00:00, fallback de 60 min por aula
        totalSeconds += sec > 0 ? sec : 3600;
      });
    } else if (topic.total > 0) {
      // Se não tiver lessons cadastradas, usa topic.total * 60 min
      totalLessons += topic.total;
      totalSeconds += topic.total * 3600;
    }
  });

  const comparison = calculateSpeedComparison(totalSeconds, speed);

  return {
    totalLessons,
    totalSeconds,
    acceleratedSeconds: comparison.acceleratedSeconds,
    savedSeconds: comparison.savedSeconds,
    speed,
    totalFriendly: comparison.originalFriendly,
    acceleratedFriendly: comparison.acceleratedFriendly,
    savedFriendly: comparison.savedFriendly,
    percentSaved: comparison.percentSaved
  };
};

/**
 * Formata minutos em texto amigável (ex: 90 -> '1h 30m', 60 -> '1h', 45 -> '45m')
 */
export const formatMinutesToFriendly = (mins) => {
  const m = Number(mins) || 0;
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h > 0) {
    return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
  }
  return `${remM}m`;
};

/**
 * Calcula quantas aulas cabem em um tempo meta (usando duração acelerada).
 * Agrupa aulas até atingir ou aproximar a meta estipulada pelo usuário.
 * @param {Array} lessons - Array de aulas [{duration, name}] do tópico
 * @param {number} startIndex - Índice da primeira aula a considerar (ex: completed)
 * @param {number} speed - Velocidade de reprodução (ex: 1.5)
 * @param {number} goalMinutes - Meta de tempo em minutos por bloco
 * @param {number|null} totalClassesCount - Total de aulas cadastradas no tópico
 * @returns {{ count: number, totalAccelSec: number, totalOrigSec: number, fits: boolean, lessonsList: Array }}
 */
export const calculateLessonsForGoal = (lessons = [], startIndex = 0, speed = 1, goalMinutes = 0, totalClassesCount = null) => {
  if (!goalMinutes || goalMinutes <= 0) {
    return { count: 1, totalAccelSec: 0, totalOrigSec: 0, fits: true, lessonsList: [] };
  }

  const spd = Math.max(0.5, Number(speed) || 1);
  const goalSec = goalMinutes * 60;
  
  const maxAvailable = totalClassesCount !== null 
    ? Math.max(0, totalClassesCount - startIndex) 
    : (Array.isArray(lessons) ? Math.max(0, lessons.length - startIndex) : 0);

  if (maxAvailable <= 0) {
    return { count: 0, totalAccelSec: 0, totalOrigSec: 0, fits: false, lessonsList: [] };
  }

  let totalAccelSec = 0;
  let totalOrigSec = 0;
  let count = 0;
  const pickedLessons = [];

  for (let i = 0; i < maxAvailable; i++) {
    const lessonIdx = startIndex + i;
    const lesson = lessons?.[lessonIdx];
    const durStr = typeof lesson === 'object' ? (lesson?.duration || '') : String(lesson || '');
    const origSec = parseDurationToSeconds(durStr);
    const effectiveOrig = origSec > 0 ? origSec : 3600; // fallback 60 min se não preenchido
    const accelSec = Math.round(effectiveOrig / spd);

    // Primeira aula sempre é incluída
    if (count === 0) {
      count++;
      totalAccelSec += accelSec;
      totalOrigSec += effectiveOrig;
      pickedLessons.push({
        index: lessonIdx,
        name: lesson?.name || `Aula ${lessonIdx + 1}`,
        origSec: effectiveOrig,
        accelSec,
        durStr: durStr || '60:00'
      });
      continue;
    }

    // Se já estamos em >= 85% da meta e a próxima aula causaria estouro superior a 20%, interrompe
    const currentRatio = totalAccelSec / goalSec;
    const projectedAccelSec = totalAccelSec + accelSec;
    const projectedOvershoot = (projectedAccelSec - goalSec) / goalSec;

    if (currentRatio >= 0.85 && projectedOvershoot > 0.20) {
      break;
    }

    if (totalAccelSec < goalSec) {
      count++;
      totalAccelSec += accelSec;
      totalOrigSec += effectiveOrig;
      pickedLessons.push({
        index: lessonIdx,
        name: lesson?.name || `Aula ${lessonIdx + 1}`,
        origSec: effectiveOrig,
        accelSec,
        durStr: durStr || '60:00'
      });
    } else {
      break;
    }
  }

  return {
    count,
    totalAccelSec,
    totalOrigSec,
    fits: totalAccelSec <= goalSec * 1.15,
    lessonsList: pickedLessons
  };
};

