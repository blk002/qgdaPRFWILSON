// Operações em lote para atribuição e remoção de disciplinas no Calendário

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_LABELS = {
  0: { short: 'Dom', full: 'Domingo' },
  1: { short: 'Seg', full: 'Segunda-feira' },
  2: { short: 'Ter', full: 'Terça-feira' },
  3: { short: 'Qua', full: 'Quarta-feira' },
  4: { short: 'Qui', full: 'Quinta-feira' },
  5: { short: 'Sex', full: 'Sexta-feira' },
  6: { short: 'Sáb', full: 'Sábado' },
};

export function getWeekIndexForDayOfWeek(dayOfWeek, cycleWeekStart = 'sunday') {
  const dow = ((Number(dayOfWeek) % 7) + 7) % 7;
  return cycleWeekStart === 'monday' ? (dow + 6) % 7 : dow;
}

function removeSubjectFromSlotPair(slots = [], counts = [], subjectId) {
  const nextSlots = [];
  const nextCounts = [];
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === subjectId) continue;
    nextSlots.push(slots[i]);
    nextCounts.push(Array.isArray(counts) ? (Number(counts[i]) || 0) : 0);
  }
  return { slots: nextSlots, counts: nextCounts };
}

export function getScheduledDaysForSubject(state, subjectId) {
  if (!state || !subjectId) return { days: [], slotCount: 0 };

  const cycle = Array.isArray(state.cycle) ? state.cycle : [];
  const cycleSlotCounts = Array.isArray(state.cycleSlotCounts) ? state.cycleSlotCounts : [];
  const cycleWeekStart = state.cycleWeekStart || 'sunday';
  const rules = Array.isArray(state.futureScheduleRules) ? state.futureScheduleRules : [];

  // Regra v2 mais recente por dia da semana, se existir
  const latestRuleByDow = new Map();
  rules.forEach((rule) => {
    if (!rule || rule.v !== 2 || !Number.isFinite(Number(rule.dayOfWeek))) return;
    const dow = Number(rule.dayOfWeek);
    const prev = latestRuleByDow.get(dow);
    if (!prev || String(rule.effectiveFrom || '') >= String(prev.effectiveFrom || '')) {
      latestRuleByDow.set(dow, rule);
    }
  });

  const days = [];
  let detectedSlotCount = 0;

  WEEKDAY_ORDER.forEach((dow) => {
    const idx = getWeekIndexForDayOfWeek(dow, cycleWeekStart);
    const rule = latestRuleByDow.get(dow);
    const slots = rule && Array.isArray(rule.daySlots)
      ? rule.daySlots
      : (Array.isArray(cycle[idx]) ? cycle[idx] : []);
    const counts = rule && Array.isArray(rule.daySlotCounts)
      ? rule.daySlotCounts
      : (Array.isArray(cycleSlotCounts[idx]) ? cycleSlotCounts[idx] : []);

    const pos = slots.indexOf(subjectId);
    if (pos !== -1) {
      days.push(dow);
      if (detectedSlotCount === 0 && Number(counts[pos]) > 0) {
        detectedSlotCount = Number(counts[pos]);
      }
    }
  });

  return { days, slotCount: detectedSlotCount };
}

export function applySubjectDaysToSchedule(state, subjectId, selectedDaysOfWeek = [], slotCount = 0, todayStr = '') {
  const cycleWeekStart = state?.cycleWeekStart || 'sunday';
  const selectedSet = new Set(
    (Array.isArray(selectedDaysOfWeek) ? selectedDaysOfWeek : [])
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
  const normalizedCount = Math.max(0, Math.min(20, Math.floor(Number(slotCount) || 0)));

  const nextCycle = Array.from({ length: 7 }, (_, i) =>
    Array.isArray(state?.cycle?.[i]) ? [...state.cycle[i]] : []
  );
  const nextCycleSlotCounts = Array.from({ length: 7 }, (_, i) =>
    Array.isArray(state?.cycleSlotCounts?.[i]) ? [...state.cycleSlotCounts[i]] : []
  );

  for (let dow = 0; dow < 7; dow++) {
    const idx = getWeekIndexForDayOfWeek(dow, cycleWeekStart);
    const cleaned = removeSubjectFromSlotPair(nextCycle[idx], nextCycleSlotCounts[idx], subjectId);
    if (selectedSet.has(dow)) {
      cleaned.slots.push(subjectId);
      cleaned.counts.push(normalizedCount);
    }
    nextCycle[idx] = cleaned.slots;
    nextCycleSlotCounts[idx] = cleaned.counts;
  }

  const prevRules = Array.isArray(state?.futureScheduleRules) ? state.futureScheduleRules : [];
  const nextRules = prevRules.map((rule) => {
    if (!rule || rule.v !== 2 || !Number.isFinite(Number(rule.dayOfWeek))) return rule;
    const dow = Number(rule.dayOfWeek);
    const cleaned = removeSubjectFromSlotPair(
      Array.isArray(rule.daySlots) ? rule.daySlots : [],
      Array.isArray(rule.daySlotCounts) ? rule.daySlotCounts : [],
      subjectId
    );
    if (selectedSet.has(dow)) {
      cleaned.slots.push(subjectId);
      cleaned.counts.push(normalizedCount);
    }
    return {
      ...rule,
      daySlots: cleaned.slots,
      daySlotCounts: cleaned.counts,
    };
  });

  const prevOverrides = (state?.calendarOverrides && typeof state.calendarOverrides === 'object')
    ? state.calendarOverrides
    : {};
  const prevOverrideCounts = (state?.calendarOverrideCounts && typeof state.calendarOverrideCounts === 'object')
    ? state.calendarOverrideCounts
    : {};
  const nextOverrides = { ...prevOverrides };
  const nextOverrideCounts = { ...prevOverrideCounts };

  Object.entries(prevOverrides).forEach(([dateKey, slots]) => {
    if (!Array.isArray(slots)) return;
    if (todayStr && dateKey < todayStr) return;
    const dObj = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(dObj.getTime())) return;
    const dow = dObj.getDay();
    const cleaned = removeSubjectFromSlotPair(
      slots,
      Array.isArray(prevOverrideCounts[dateKey]) ? prevOverrideCounts[dateKey] : [],
      subjectId
    );
    if (selectedSet.has(dow) && slots.length > 0) {
      cleaned.slots.push(subjectId);
      cleaned.counts.push(normalizedCount);
    }
    nextOverrides[dateKey] = cleaned.slots;
    nextOverrideCounts[dateKey] = cleaned.counts;
  });

  return {
    cycle: nextCycle,
    cycleSlotCounts: nextCycleSlotCounts,
    futureScheduleRules: nextRules,
    calendarOverrides: nextOverrides,
    calendarOverrideCounts: nextOverrideCounts,
  };
}
