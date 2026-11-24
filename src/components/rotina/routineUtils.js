export const WEEK_DAYS = [
  { key: 'seg', short: 'Seg', label: 'Segunda', fullLabel: 'Segunda-feira', jsDay: 1 },
  { key: 'ter', short: 'Ter', label: 'Terça', fullLabel: 'Terça-feira', jsDay: 2 },
  { key: 'qua', short: 'Qua', label: 'Quarta', fullLabel: 'Quarta-feira', jsDay: 3 },
  { key: 'qui', short: 'Qui', label: 'Quinta', fullLabel: 'Quinta-feira', jsDay: 4 },
  { key: 'sex', short: 'Sex', label: 'Sexta', fullLabel: 'Sexta-feira', jsDay: 5 },
  { key: 'sab', short: 'Sáb', label: 'Sábado', fullLabel: 'Sábado', jsDay: 6 },
  { key: 'dom', short: 'Dom', label: 'Domingo', fullLabel: 'Domingo', jsDay: 0 },
];

export const ROUTINE_CATEGORIES = [
  {
    id: 'study',
    label: 'Estudos',
    shortLabel: 'Estudo',
    defaultTitle: 'Estudos',
    suggestions: ['Estudo Teórico', 'Questões / Caveira', 'Revisão FSRS', 'Simulado', 'Leitura Lei Seca'],
    strokeColor: '#0ea5e9',
    barClass: 'bg-sky-500',
    indicatorClass: 'bg-sky-500 dark:bg-sky-400',
    blockClass:
      'bg-sky-50/95 dark:bg-sky-950/60 border-sky-200/90 dark:border-sky-800/80 text-sky-950 dark:text-sky-100 hover:border-sky-400/80 dark:hover:border-sky-500/70 hover:bg-sky-50 dark:hover:bg-sky-950/80',
    accentTextClass: 'text-sky-700 dark:text-sky-300',
    subTextClass: 'text-sky-700/80 dark:text-sky-300/75',
    activeBtnClass:
      'bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500',
    swatchClass: 'bg-sky-500',
  },
  {
    id: 'work',
    label: 'Trabalho',
    shortLabel: 'Trabalho',
    defaultTitle: 'Trabalho',
    suggestions: ['Expediente', 'Plantão', 'Home Office', 'Deslocamento', 'Turnos / Reuniões'],
    strokeColor: '#f59e0b',
    barClass: 'bg-amber-500',
    indicatorClass: 'bg-amber-500 dark:bg-amber-400',
    blockClass:
      'bg-amber-50/95 dark:bg-amber-950/50 border-amber-200/90 dark:border-amber-800/70 text-amber-950 dark:text-amber-100 hover:border-amber-400/80 dark:hover:border-amber-500/70 hover:bg-amber-50 dark:hover:bg-amber-950/75',
    accentTextClass: 'text-amber-700 dark:text-amber-300',
    subTextClass: 'text-amber-800/75 dark:text-amber-300/75',
    activeBtnClass:
      'bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500',
    swatchClass: 'bg-amber-500',
  },
  {
    id: 'training',
    label: 'Treino / TAF',
    shortLabel: 'Treino',
    defaultTitle: 'Treino / TAF',
    suggestions: ['Corrida TAF', 'Academia', 'Barra / Flexão', 'Natação / Ciclismo', 'Alongamento'],
    strokeColor: '#10b981',
    barClass: 'bg-emerald-500',
    indicatorClass: 'bg-emerald-500 dark:bg-emerald-400',
    blockClass:
      'bg-emerald-50/95 dark:bg-emerald-950/50 border-emerald-200/90 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100 hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/75',
    accentTextClass: 'text-emerald-700 dark:text-emerald-300',
    subTextClass: 'text-emerald-800/75 dark:text-emerald-300/75',
    activeBtnClass:
      'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500',
    swatchClass: 'bg-emerald-500',
  },
  {
    id: 'other',
    label: 'Outra Atividade',
    shortLabel: 'Outra',
    defaultTitle: 'Outra Atividade',
    suggestions: ['Faculdade', 'Família', 'Igreja / Comunidade', 'Curso / Idiomas', 'Compromisso Pessoal'],
    strokeColor: '#8b5cf6',
    barClass: 'bg-violet-500',
    indicatorClass: 'bg-violet-500 dark:bg-violet-400',
    blockClass:
      'bg-violet-50/95 dark:bg-violet-950/50 border-violet-200/90 dark:border-violet-800/70 text-violet-950 dark:text-violet-100 hover:border-violet-400/80 dark:hover:border-violet-500/70 hover:bg-violet-50 dark:hover:bg-violet-950/75',
    accentTextClass: 'text-violet-700 dark:text-violet-300',
    subTextClass: 'text-violet-800/75 dark:text-violet-300/75',
    activeBtnClass:
      'bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:text-slate-950 dark:border-violet-500',
    swatchClass: 'bg-violet-500',
  },
  {
    id: 'rest',
    label: 'Sono / Pausa',
    shortLabel: 'Sono',
    defaultTitle: 'Sono / Descanso',
    suggestions: ['Sono', 'Almoço', 'Descanso', 'Lazer / Família', 'Preparo / Rotina'],
    strokeColor: '#94a3b8',
    barClass: 'bg-slate-400 dark:bg-slate-500',
    indicatorClass: 'bg-slate-400 dark:bg-slate-500',
    blockClass:
      'bg-slate-100/90 dark:bg-slate-800/75 border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 hover:border-slate-400/80 dark:hover:border-slate-500/80 hover:bg-slate-100 dark:hover:bg-slate-800',
    accentTextClass: 'text-slate-600 dark:text-slate-300',
    subTextClass: 'text-slate-600/85 dark:text-slate-400',
    activeBtnClass:
      'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-950 dark:border-slate-200',
    swatchClass: 'bg-slate-400 dark:bg-slate-500',
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  ROUTINE_CATEGORIES.map((c) => [c.id, c])
);

export function getCategoryMeta(id) {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other;
}

export function createBlockId() {
  return `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getTodayDayKey() {
  const dow = new Date().getDay();
  const found = WEEK_DAYS.find((d) => d.jsDay === dow);
  return found ? found.key : 'seg';
}

export function minutesToTimeStr(totalMinutes) {
  const safe = Math.max(0, Math.min(1440, Math.round(Number(totalMinutes) || 0)));
  if (safe === 1440) return '24:00';
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutesToInputTime(totalMinutes) {
  const safe = Math.max(0, Math.min(1439, Math.round(Number(totalMinutes) || 0)));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseTimeStrToMinutes(timeStr, allow24 = false) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  if (allow24 && h === 24 && m === 0) return 1440;
  return Math.max(0, Math.min(1440, h * 60 + m));
}

export function formatMinutesCompact(totalMinutes) {
  const safe = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function getEmptyRoutineDays() {
  return {
    seg: [],
    ter: [],
    qua: [],
    qui: [],
    sex: [],
    sab: [],
    dom: [],
  };
}

export function normalizeRoutine(routine) {
  const baseDays = getEmptyRoutineDays();
  const incomingDays = routine && typeof routine === 'object' && routine.days ? routine.days : {};
  const normalizedDays = {};

  WEEK_DAYS.forEach(({ key }) => {
    const rawList = Array.isArray(incomingDays[key]) ? incomingDays[key] : [];
    normalizedDays[key] = rawList
      .filter((b) => b && typeof b === 'object')
      .map((b) => {
        const startMin = Math.max(0, Math.min(1425, Math.round(Number(b.startMin) || 0)));
        const endMin = Math.max(
          startMin + 15,
          Math.min(1440, Math.round(Number(b.endMin) || startMin + 60))
        );
        const normalized = {
          id: b.id || createBlockId(),
          category: CATEGORY_MAP[b.category] ? b.category : 'other',
          label: String(b.label || getCategoryMeta(b.category).defaultTitle).trim(),
          startMin,
          endMin,
          note: String(b.note || '').trim(),
        };
        if (b.source === 'cronograma') normalized.source = 'cronograma';
        if (b.source === 'taf_app') normalized.source = 'taf_app';
        if (b.dateIso) normalized.dateIso = String(b.dateIso);
        if (b.isPlanned) normalized.isPlanned = true;
        if (b.subjectId) normalized.subjectId = String(b.subjectId);
        if (Number.isFinite(Number(b.partIndex))) normalized.partIndex = Number(b.partIndex);
        if (Number.isFinite(Number(b.partTotal))) normalized.partTotal = Number(b.partTotal);
        return normalized;
      })
      .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  });

  const preferredLayout = routine?.preferredLayout === 'by_subject' ? 'by_subject' : 'blocks';

  const clampInt = (val, min, max, fallback) => {
    if (val === undefined || val === null || val === '') return fallback;
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  };

  return {
    days: { ...baseDays, ...normalizedDays },
    startHour: routine?.startHour === 0 ? 0 : 5,
    autoSyncLessons: routine?.autoSyncLessons !== false,
    preferredLayout,
    blocksPerDay: clampInt(routine?.blocksPerDay, 1, 8, 1),
    blockBreakMin: clampInt(routine?.blockBreakMin, 0, 120, 30),
    subjectBreakMin: clampInt(routine?.subjectBreakMin, 0, 120, 15),
    syncedSignatures:
      routine?.syncedSignatures && typeof routine.syncedSignatures === 'object'
        ? { ...routine.syncedSignatures }
        : {},
  };
}

/**
 * Checks whether [startMin, endMin) overlaps any existing block in `dayBlocks`
 * (optionally ignoring `excludeId`).
 */
export function findOverlappingBlock(dayBlocks, startMin, endMin, excludeId = null) {
  return (dayBlocks || []).find(
    (b) => b.id !== excludeId && startMin < b.endMin && endMin > b.startMin
  ) || null;
}

/**
 * Clamps a dragged interval [anchorMin, currentMin] so it stays within [minBound, maxBound]
 * and never invades adjacent existing blocks on the day column.
 */
export function clampDragInterval(dayBlocks, anchorMin, targetMin, stepMin = 30, minBound = 0, maxBound = 1440) {
  const blocks = [...(dayBlocks || [])].sort((a, b) => a.startMin - b.startMin);
  const draggingDown = targetMin >= anchorMin;

  if (draggingDown) {
    let start = Math.max(minBound, anchorMin);
    let end = Math.min(maxBound, Math.max(start + stepMin, targetMin));
    const nextBlock = blocks.find((b) => b.startMin >= start);
    if (nextBlock && end > nextBlock.startMin) {
      end = nextBlock.startMin;
    }
    if (end - start < stepMin) return null;
    return { startMin: start, endMin: end };
  }

  let end = Math.min(maxBound, anchorMin + stepMin);
  let start = Math.max(minBound, Math.min(end - stepMin, targetMin));
  const prevBlocks = blocks.filter((b) => b.endMin <= end);
  const prevBlock = prevBlocks.length > 0 ? prevBlocks[prevBlocks.length - 1] : null;
  if (prevBlock && start < prevBlock.endMin) {
    start = prevBlock.endMin;
  }
  if (end - start < stepMin) return null;
  return { startMin: start, endMin: end };
}

export function computeDayStats(dayBlocks) {
  const totals = {
    study: 0,
    work: 0,
    training: 0,
    other: 0,
    rest: 0,
    totalAllocated: 0,
  };

  (dayBlocks || []).forEach((b) => {
    const dur = Math.max(0, (Number(b.endMin) || 0) - (Number(b.startMin) || 0));
    if (totals[b.category] !== undefined) {
      totals[b.category] += dur;
    } else {
      totals.other += dur;
    }
    totals.totalAllocated += dur;
  });

  totals.free = Math.max(0, 1440 - totals.totalAllocated);
  return totals;
}

export function computeWeeklyStats(routineDays) {
  const byDay = {};
  const totals = {
    study: 0,
    work: 0,
    training: 0,
    other: 0,
    rest: 0,
    totalAllocated: 0,
    free: 0,
    studyDaysCount: 0,
    workDaysCount: 0,
    totalBlocks: 0,
  };

  WEEK_DAYS.forEach(({ key }) => {
    const list = routineDays?.[key] || [];
    const ds = computeDayStats(list);
    byDay[key] = ds;
    totals.study += ds.study;
    totals.work += ds.work;
    totals.training += ds.training;
    totals.other += ds.other;
    totals.rest += ds.rest;
    totals.totalAllocated += ds.totalAllocated;
    totals.free += ds.free;
    if (ds.study > 0) totals.studyDaysCount += 1;
    if (ds.work > 0) totals.workDaysCount += 1;
    totals.totalBlocks += list.length;
  });

  totals.avgStudyPerDay = Math.round(totals.study / 7);
  totals.avgStudyOnStudyDays =
    totals.studyDaysCount > 0 ? Math.round(totals.study / totals.studyDaysCount) : 0;

  return { byDay, totals };
}

export function findCurrentOrNextBlock(dayBlocks, nowMinutes) {
  const sorted = [...(dayBlocks || [])].sort((a, b) => a.startMin - b.startMin);
  const active = sorted.find((b) => nowMinutes >= b.startMin && nowMinutes < b.endMin) || null;
  if (active) {
    return { status: 'active', block: active, remainingMin: active.endMin - nowMinutes };
  }
  const next = sorted.find((b) => b.startMin > nowMinutes) || null;
  if (next) {
    return { status: 'upcoming', block: next, startsInMin: next.startMin - nowMinutes };
  }
  return { status: 'none', block: null };
}

function makePresetBlocks(specs) {
  return specs.map(([category, label, startH, endH, note = '']) => ({
    id: createBlockId(),
    category,
    label,
    startMin: Math.round(startH * 60),
    endMin: Math.round(endH * 60),
    note,
  }));
}

export const ROUTINE_PRESETS = [
  {
    id: 'work_8h_study',
    name: 'Trabalho 8h + Estudos',
    description: 'Seg–Sex expediente comercial, estudo antes/depois do trabalho + reforço no fim de semana.',
    buildDays: () => {
      const weekday = () =>
        makePresetBlocks([
          ['study', 'Estudo Manhã (Teoria)', 5.5, 7, 'Bloco focado antes do expediente'],
          ['work', 'Trabalho', 8, 12, 'Turno manhã'],
          ['rest', 'Almoço / Revisão leve', 12, 13, ''],
          ['work', 'Trabalho', 13, 17, 'Turno tarde'],
          ['training', 'Treino TAF / Academia', 17.5, 18.5, ''],
          ['study', 'Estudo Noite (Questões)', 19.5, 22, 'Revisão + questões do dia'],
        ]);
      const saturday = () =>
        makePresetBlocks([
          ['study', 'Simulado / Revisão Geral', 8, 12, ''],
          ['training', 'Corrida TAF', 16, 17, ''],
          ['study', 'Correção + Caderno de Erros', 17.5, 19.5, ''],
        ]);
      const sunday = () =>
        makePresetBlocks([
          ['study', 'Revisão Semanal + Lei Seca', 9, 12, ''],
          ['rest', 'Descanso / Família', 14, 19, 'Recarregar energia'],
        ]);
      return {
        seg: weekday(),
        ter: weekday(),
        qua: weekday(),
        qui: weekday(),
        sex: weekday(),
        sab: saturday(),
        dom: sunday(),
      };
    },
  },
  {
    id: 'half_shift',
    name: 'Meio Período + Estudos',
    description: 'Trabalho em um turno (manhã) e tarde livre para blocos sólidos de estudo e TAF.',
    buildDays: () => {
      const weekday = () =>
        makePresetBlocks([
          ['work', 'Trabalho (Meio Período)', 8, 12.5, ''],
          ['rest', 'Almoço / Pausa', 12.5, 14, ''],
          ['study', 'Estudo Teórico', 14, 17, ''],
          ['training', 'Treino TAF', 17.5, 18.5, ''],
          ['study', 'Questões e Revisão', 19.5, 21.5, ''],
        ]);
      const saturday = () =>
        makePresetBlocks([
          ['study', 'Simulado + Análise', 8.5, 12.5, ''],
          ['other', 'Atividade Pessoal / Família', 15, 19, ''],
        ]);
      const sunday = () =>
        makePresetBlocks([
          ['study', 'Revisão Leve', 9.5, 11.5, ''],
          ['rest', 'Descanso', 13, 18, ''],
        ]);
      return {
        seg: weekday(),
        ter: weekday(),
        qua: weekday(),
        qui: weekday(),
        sex: weekday(),
        sab: saturday(),
        dom: sunday(),
      };
    },
  },
  {
    id: 'full_time_study',
    name: 'Dedicação Integral',
    description: 'Foco total nos estudos com blocos manhã/tarde, treino físico diário e pausas estruturadas.',
    buildDays: () => {
      const weekday = () =>
        makePresetBlocks([
          ['study', 'Teoria — Bloco 1', 8, 11.5, 'Matérias de maior peso'],
          ['rest', 'Almoço e Descanso', 11.5, 13.5, ''],
          ['study', 'Questões e Revisão — Bloco 2', 13.5, 16.5, ''],
          ['training', 'Treino TAF', 17, 18.5, ''],
          ['study', 'Lei Seca / Resumos', 19.5, 21, ''],
        ]);
      const saturday = () =>
        makePresetBlocks([
          ['study', 'Simulado Completo', 8, 12.5, ''],
          ['study', 'Correção e Raio-X', 14.5, 16.5, ''],
          ['other', 'Lazer / Social', 18, 22, ''],
        ]);
      const sunday = () =>
        makePresetBlocks([
          ['study', 'Revisão FSRS', 9, 11, ''],
          ['rest', 'Descanso Total', 12, 20, ''],
        ]);
      return {
        seg: weekday(),
        ter: weekday(),
        qua: weekday(),
        qui: weekday(),
        sex: weekday(),
        sab: saturday(),
        dom: sunday(),
      };
    },
  },
];

function formatLocalIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Merges workout blocks from the Android TAF app (`tafAppData.routineBlocks`) into
 * the current week's Rotina de Vida days without overwriting manual study/work blocks.
 */
export function mergeTafAppRoutineBlocks(currentDays, tafRoutineBlocks, prevTafSignature = '') {
  const incoming = Array.isArray(tafRoutineBlocks) ? tafRoutineBlocks : [];

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (todayMidnight.getDay() + 6) % 7;
  const monday = new Date(todayMidnight);
  monday.setDate(todayMidnight.getDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const minIso = formatLocalIsoDate(monday);
  const maxIso = formatLocalIsoDate(sunday);

  const validDayKeys = new Set(WEEK_DAYS.map((d) => d.key));
  const weekBlocks = incoming.filter((b) => {
    if (!b || !b.id || !validDayKeys.has(b.dayKey)) return false;
    if (!b.dateIso) return true;
    return b.dateIso >= minIso && b.dateIso <= maxIso;
  });

  const nextSignature = weekBlocks
    .map((b) => `${b.id}:${b.dayKey}:${b.startMin}:${b.endMin}:${b.label}:${b.note || ''}:${b.isPlanned ? 'P' : 'C'}`)
    .sort()
    .join('|');

  const hasExistingTafBlocks = WEEK_DAYS.some(({ key }) =>
    (currentDays?.[key] || []).some((b) => b.source === 'taf_app')
  );

  if (nextSignature === prevTafSignature && (weekBlocks.length > 0 || !hasExistingTafBlocks)) {
    return { changed: false, nextDays: currentDays, nextSignature: prevTafSignature };
  }

  const nextDays = { ...currentDays };
  const findFreeSlot = (dayList, preferredStart, duration) => {
    const dur = Math.max(15, Math.min(240, duration));
    const clampStart = Math.max(0, Math.min(1440 - dur, preferredStart));
    if (!findOverlappingBlock(dayList, clampStart, clampStart + dur)) {
      return { startMin: clampStart, endMin: clampStart + dur };
    }
    for (let s = clampStart + 15; s + dur <= 1440; s += 15) {
      if (!findOverlappingBlock(dayList, s, s + dur)) {
        return { startMin: s, endMin: s + dur };
      }
    }
    for (let s = clampStart - 15; s >= 0; s -= 15) {
      if (!findOverlappingBlock(dayList, s, s + dur)) {
        return { startMin: s, endMin: s + dur };
      }
    }
    return null;
  };

  WEEK_DAYS.forEach(({ key }) => {
    const existingDay = nextDays[key] || [];
    const existingManual = existingDay.filter((b) => b.source !== 'taf_app');
    const prevTafById = new Map(
      existingDay.filter((b) => b.source === 'taf_app').map((b) => [b.id, b])
    );
    const dayIncoming = weekBlocks.filter((b) => b.dayKey === key);

    if (dayIncoming.length === 0) {
      if (existingDay.length !== existingManual.length) {
        nextDays[key] = existingManual;
      }
      return;
    }

    const placed = [...existingManual];

    dayIncoming.forEach((raw) => {
      const rawStart = Math.max(0, Math.min(1425, Math.round(Number(raw.startMin) || 0)));
      const rawEnd = Math.max(rawStart + 15, Math.min(1440, Math.round(Number(raw.endMin) || rawStart + 30)));
      const dur = Math.max(15, Math.min(240, rawEnd - rawStart));
      const prevMatch = prevTafById.get(String(raw.id));
      const preferredStart = prevMatch ? prevMatch.startMin : rawStart;
      const slot = findFreeSlot(placed, preferredStart, dur);
      if (!slot) return;
      placed.push({
        id: String(raw.id),
        category: 'training',
        label: String(raw.label || 'Treino TAF').trim(),
        startMin: slot.startMin,
        endMin: slot.endMin,
        note: String(raw.note || '').trim(),
        source: 'taf_app',
        dateIso: raw.dateIso ? String(raw.dateIso) : undefined,
        ...(raw.isPlanned ? { isPlanned: true } : {}),
      });
    });

    nextDays[key] = placed.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  });

  return { changed: true, nextDays, nextSignature };
}
