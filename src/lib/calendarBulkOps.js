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

function getRuleDayOfWeek(rule, cycleWeekStart = 'sunday') {
  if (!rule || typeof rule !== 'object') return null;
  if (rule.dayOfWeek !== undefined && rule.dayOfWeek !== null && Number.isFinite(Number(rule.dayOfWeek))) {
    return ((Number(rule.dayOfWeek) % 7) + 7) % 7;
  }
  if (rule.cycleIndex !== undefined && rule.cycleIndex !== null && Number.isFinite(Number(rule.cycleIndex))) {
    const idx = ((Number(rule.cycleIndex) % 7) + 7) % 7;
    return cycleWeekStart === 'monday' ? (idx + 1) % 7 : idx;
  }
  return null;
}

function upsertSubjectInSlotPair(slots = [], counts = [], subjectId, include = false, normalizedCount = 0) {
  const targetIdStr = String(subjectId);
  const nextSlots = [];
  const nextCounts = [];
  let keptOnce = false;

  for (let i = 0; i < slots.length; i++) {
    const matches = String(slots[i]) === targetIdStr;
    if (matches) {
      if (include && !keptOnce) {
        nextSlots.push(slots[i]);
        nextCounts.push(normalizedCount);
        keptOnce = true;
      }
      continue;
    }
    nextSlots.push(slots[i]);
    nextCounts.push(Array.isArray(counts) ? Math.max(0, Math.floor(Number(counts[i]) || 0)) : 0);
  }

  if (include && !keptOnce) {
    nextSlots.push(subjectId);
    nextCounts.push(normalizedCount);
  }

  return { slots: nextSlots, counts: nextCounts };
}

function slotsAndCountsEqual(slotsA = [], countsA = [], slotsB = [], countsB = []) {
  if (slotsA.length !== slotsB.length) return false;
  for (let i = 0; i < slotsA.length; i++) {
    if (String(slotsA[i]) !== String(slotsB[i])) return false;
    const cA = Math.max(0, Math.floor(Number(countsA?.[i]) || 0));
    const cB = Math.max(0, Math.floor(Number(countsB?.[i]) || 0));
    if (cA !== cB) return false;
  }
  return true;
}

export function getScheduledDaysForSubject(state, subjectId, referenceDate = '') {
  if (!state || !subjectId) return { days: [], slotCount: 0 };

  const targetIdStr = String(subjectId);
  const cycle = Array.isArray(state.cycle) ? state.cycle : [];
  const cycleSlotCounts = Array.isArray(state.cycleSlotCounts) ? state.cycleSlotCounts : [];
  const cycleWeekStart = state.cycleWeekStart || 'sunday';
  const rules = Array.isArray(state.futureScheduleRules) ? state.futureScheduleRules : [];
  const refDateStr = /^\d{4}-\d{2}-\d{2}$/.test(String(referenceDate || '')) ? String(referenceDate) : '';

  // Regra v2 mais recente por dia da semana (respeitando referenceDate quando informada)
  const latestRuleByDow = new Map();
  rules.forEach((rule) => {
    if (!rule || rule.v !== 2) return;
    const ruleDate = String(rule.fromDate || rule.effectiveFrom || '');
    if (refDateStr && ruleDate && ruleDate > refDateStr) return;
    const dow = getRuleDayOfWeek(rule, cycleWeekStart);
    if (dow === null) return;
    const prev = latestRuleByDow.get(dow);
    const prevDate = String(prev?.fromDate || prev?.effectiveFrom || '');
    if (!prev || ruleDate >= prevDate) {
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
    const counts = rule && Array.isArray(rule.slotCounts)
      ? rule.slotCounts
      : (rule && Array.isArray(rule.daySlotCounts)
        ? rule.daySlotCounts
        : (Array.isArray(cycleSlotCounts[idx]) ? cycleSlotCounts[idx] : []));

    const pos = slots.findIndex((sId) => String(sId) === targetIdStr);
    if (pos !== -1) {
      days.push(dow);
      if (detectedSlotCount === 0 && Number(counts[pos]) > 0) {
        detectedSlotCount = Math.floor(Number(counts[pos]));
      }
    }
  });

  return { days, slotCount: detectedSlotCount };
}

export function applySubjectDaysToSchedule(state, subjectId, selectedDaysOfWeek = [], slotCount = 0, todayStr = '', fromDate = '') {
  if ((state?.cycleScheduleType || 'weekly') !== 'weekly') {
    return {};
  }
  const targetIdStr = String(subjectId);
  const cycleWeekStart = state?.cycleWeekStart || 'sunday';
  const selectedSet = new Set(
    (Array.isArray(selectedDaysOfWeek) ? selectedDaysOfWeek : [])
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
  const normalizedCount = Math.max(0, Math.min(20, Math.floor(Number(slotCount) || 0)));
  const normalizedFromDate = /^\d{4}-\d{2}-\d{2}$/.test(String(fromDate || '')) ? String(fromDate) : '';

  const prevRules = Array.isArray(state?.futureScheduleRules) ? state.futureScheduleRules : [];
  const prevOverrides = (state?.calendarOverrides && typeof state.calendarOverrides === 'object')
    ? state.calendarOverrides
    : {};
  const prevOverrideCounts = (state?.calendarOverrideCounts && typeof state.calendarOverrideCounts === 'object')
    ? state.calendarOverrideCounts
    : {};
  const nextOverrides = { ...prevOverrides };
  const nextOverrideCounts = { ...prevOverrideCounts };

  if (normalizedFromDate) {
    // Modo "de uma data para frente": preserva cycle base e regras/overrides anteriores a normalizedFromDate
    const exactDateRulesDow = new Set();
    const priorRuleByDow = new Map();

    const nextRules = prevRules.map((rule) => {
      if (!rule || rule.v !== 2) return rule;
      const dow = getRuleDayOfWeek(rule, cycleWeekStart);
      if (dow === null) return rule;
      const rDate = String(rule.fromDate || '');

      if (rDate && rDate < normalizedFromDate) {
        const prevPrior = priorRuleByDow.get(dow);
        if (!prevPrior || rDate >= String(prevPrior.fromDate || '')) {
          priorRuleByDow.set(dow, rule);
        }
        return rule;
      }

      if (rDate === normalizedFromDate) {
        exactDateRulesDow.add(dow);
      }

      const rawCounts = Array.isArray(rule.slotCounts)
        ? rule.slotCounts
        : (Array.isArray(rule.daySlotCounts) ? rule.daySlotCounts : []);
      const updated = upsertSubjectInSlotPair(
        Array.isArray(rule.daySlots) ? rule.daySlots : [],
        rawCounts,
        subjectId,
        selectedSet.has(dow),
        normalizedCount
      );
      const cleanRule = {
        ...rule,
        daySlots: updated.slots,
        slotCounts: updated.counts,
      };
      delete cleanRule.daySlotCounts;
      return cleanRule;
    });

    for (let dow = 0; dow < 7; dow++) {
      if (exactDateRulesDow.has(dow)) continue;
      const idx = getWeekIndexForDayOfWeek(dow, cycleWeekStart);
      const priorRule = priorRuleByDow.get(dow);
      const baseSlots = priorRule && Array.isArray(priorRule.daySlots)
        ? priorRule.daySlots
        : (Array.isArray(state?.cycle?.[idx]) ? state.cycle[idx] : []);
      const baseCounts = priorRule && Array.isArray(priorRule.slotCounts)
        ? priorRule.slotCounts
        : (priorRule && Array.isArray(priorRule.daySlotCounts)
          ? priorRule.daySlotCounts
          : (Array.isArray(state?.cycleSlotCounts?.[idx]) ? state.cycleSlotCounts[idx] : []));

      const updated = upsertSubjectInSlotPair(
        baseSlots,
        baseCounts,
        subjectId,
        selectedSet.has(dow),
        normalizedCount
      );
      if (!slotsAndCountsEqual(baseSlots, baseCounts, updated.slots, updated.counts)) {
        nextRules.push({
          id: `rule_bulk_${Date.now()}_${dow}_${Math.random().toString(36).slice(2, 6)}`,
          v: 2,
          fromDate: normalizedFromDate,
          dayOfWeek: dow,
          cycleIndex: idx,
          daySlots: updated.slots,
          slotCounts: updated.counts,
        });
      }
    }

    Object.entries(prevOverrides).forEach(([dateKey, slots]) => {
      if (!Array.isArray(slots) || dateKey < normalizedFromDate) return;
      const dObj = new Date(`${dateKey}T12:00:00`);
      if (Number.isNaN(dObj.getTime())) return;
      const dow = dObj.getDay();
      const hadSubject = slots.some((sId) => String(sId) === targetIdStr);
      const shouldInclude = selectedSet.has(dow) && (slots.length > 0 || hadSubject);
      const updated = upsertSubjectInSlotPair(
        slots,
        Array.isArray(prevOverrideCounts[dateKey]) ? prevOverrideCounts[dateKey] : [],
        subjectId,
        shouldInclude,
        normalizedCount
      );
      nextOverrides[dateKey] = updated.slots;
      nextOverrideCounts[dateKey] = updated.counts;
    });

    return {
      futureScheduleRules: nextRules,
      calendarOverrides: nextOverrides,
      calendarOverrideCounts: nextOverrideCounts,
    };
  }

  const nextCycle = Array.from({ length: 7 }, (_, i) =>
    Array.isArray(state?.cycle?.[i]) ? [...state.cycle[i]] : []
  );
  const nextCycleSlotCounts = Array.from({ length: 7 }, (_, i) =>
    Array.isArray(state?.cycleSlotCounts?.[i]) ? [...state.cycleSlotCounts[i]] : []
  );

  for (let dow = 0; dow < 7; dow++) {
    const idx = getWeekIndexForDayOfWeek(dow, cycleWeekStart);
    const updated = upsertSubjectInSlotPair(
      nextCycle[idx],
      nextCycleSlotCounts[idx],
      subjectId,
      selectedSet.has(dow),
      normalizedCount
    );
    nextCycle[idx] = updated.slots;
    nextCycleSlotCounts[idx] = updated.counts;
  }

  const nextRules = prevRules.map((rule) => {
    if (!rule || rule.v !== 2) return rule;
    const dow = getRuleDayOfWeek(rule, cycleWeekStart);
    if (dow === null) return rule;
    const rawCounts = Array.isArray(rule.slotCounts)
      ? rule.slotCounts
      : (Array.isArray(rule.daySlotCounts) ? rule.daySlotCounts : []);
    const updated = upsertSubjectInSlotPair(
      Array.isArray(rule.daySlots) ? rule.daySlots : [],
      rawCounts,
      subjectId,
      selectedSet.has(dow),
      normalizedCount
    );
    const cleanRule = {
      ...rule,
      daySlots: updated.slots,
      slotCounts: updated.counts,
    };
    delete cleanRule.daySlotCounts;
    return cleanRule;
  });

  Object.entries(prevOverrides).forEach(([dateKey, slots]) => {
    if (!Array.isArray(slots)) return;
    if (todayStr && dateKey < todayStr) return;
    const dObj = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(dObj.getTime())) return;
    const dow = dObj.getDay();
    const hadSubject = slots.some((sId) => String(sId) === targetIdStr);
    const shouldInclude = selectedSet.has(dow) && (slots.length > 0 || hadSubject);
    const updated = upsertSubjectInSlotPair(
      slots,
      Array.isArray(prevOverrideCounts[dateKey]) ? prevOverrideCounts[dateKey] : [],
      subjectId,
      shouldInclude,
      normalizedCount
    );
    nextOverrides[dateKey] = updated.slots;
    nextOverrideCounts[dateKey] = updated.counts;
  });

  return {
    cycle: nextCycle,
    cycleSlotCounts: nextCycleSlotCounts,
    futureScheduleRules: nextRules,
    calendarOverrides: nextOverrides,
    calendarOverrideCounts: nextOverrideCounts,
  };
}
