import {
  parseDurationToSeconds,
  calculateLessonsForGoal,
} from '../../lib/durationHelpers';
import {
  WEEK_DAYS,
  createBlockId,
  formatMinutesCompact,
} from './routineUtils';

const MIN_BLOCK_DURATION = 15;

function toLocalDateStr(date, storeFn) {
  if (typeof storeFn === 'function') return storeFn(date);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSubjectDoneWithSim(subject, simMap) {
  const topics = subject?.topics || [];
  if (topics.length === 0 || !topics.some((t) => (Number(t.total) || 0) > 0)) return false;
  const remTotal = topics.reduce(
    (acc, t) => acc + Math.max(0, (Number(t.total) || 0) - (Number(t.completed) || 0)),
    0
  );
  return (simMap?.[subject.id] || 0) >= remTotal;
}

/**
 * Computes the effective subjects and lesson durations for every day of the current week (Seg–Dom),
 * mirroring the exact rules used in Ciclo.jsx (weekly/sequential cycle, overrides, future rules,
 * speed acceleration, subject time goals, fixed lesson counts, and completion replacements).
 */
export function computeWeeklyLessonPlan({
  subjects = {},
  cycle = [],
  cycleSlotCounts = [],
  cycleScheduleType = 'weekly',
  cycleWeekStart = 'sunday',
  cycleCarryoverOffset = 0,
  calendarOverrides = {},
  calendarOverrideCounts = {},
  futureScheduleRules = [],
  subjectTimeGoal = {},
  currentDayIndex = 0,
  getLocalDateStr,
}) {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDow = todayMidnight.getDay();
  const mondayOffset = (todayDow + 6) % 7; // 0 = Seg, 6 = Dom
  const mondayDate = new Date(todayMidnight);
  mondayDate.setDate(todayMidnight.getDate() - mondayOffset);

  const sanitizeSchedule = (rawSubjects, rawCounts) => {
    const validSubjects = [];
    const validCounts = [];
    (rawSubjects || []).forEach((sId, idx) => {
      if (subjects && subjects[sId]) {
        validSubjects.push(sId);
        validCounts.push(rawCounts?.[idx] ?? 0);
      }
    });
    return { daySubjects: validSubjects, daySlotCounts: validCounts };
  };

  const resolveDaySchedule = (targetDate, dayDiff) => {
    const fullDateStr = toLocalDateStr(targetDate, getLocalDateStr);
    const isToday = dayDiff === 0;

    if (calendarOverrides && Array.isArray(calendarOverrides[fullDateStr])) {
      return sanitizeSchedule(
        calendarOverrides[fullDateStr],
        calendarOverrideCounts?.[fullDateStr]
      );
    }

    const targetDow = targetDate.getDay();
    let effectiveCycleIdx = 0;
    let shouldShiftCarryover = false;

    if (cycleScheduleType === 'weekly') {
      const rawIdx = cycleWeekStart === 'monday' ? (targetDow + 6) % 7 : targetDow;
      shouldShiftCarryover = isToday && (cycleCarryoverOffset || 0) > 0;
      effectiveCycleIdx = shouldShiftCarryover
        ? (((rawIdx - cycleCarryoverOffset) % 7) + 7) % 7
        : rawIdx;
    } else {
      const cycleLen = Math.max(1, cycle.length || 1);
      effectiveCycleIdx = (((currentDayIndex + dayDiff) % cycleLen) + cycleLen) % cycleLen;
    }

    let daySubjects = Array.isArray(cycle?.[effectiveCycleIdx]) ? [...cycle[effectiveCycleIdx]] : [];
    let daySlotCounts = Array.isArray(cycleSlotCounts?.[effectiveCycleIdx])
      ? [...cycleSlotCounts[effectiveCycleIdx]]
      : [];

    const effectiveDateObj = shouldShiftCarryover
      ? new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate() - cycleCarryoverOffset
        )
      : targetDate;
    const effectiveDateStr = shouldShiftCarryover
      ? toLocalDateStr(effectiveDateObj, getLocalDateStr)
      : fullDateStr;

    if (
      shouldShiftCarryover &&
      calendarOverrides &&
      Array.isArray(calendarOverrides[effectiveDateStr])
    ) {
      return sanitizeSchedule(
        calendarOverrides[effectiveDateStr],
        calendarOverrideCounts?.[effectiveDateStr]
      );
    }

    const effDow = effectiveDateObj.getDay();
    const matchingRules = (futureScheduleRules || [])
      .filter((r) => {
        if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effectiveDateStr) return false;
        if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) {
          return r.dayOfWeek === effDow;
        }
        return r.dayOfWeek === effDow || r.cycleIndex === effectiveCycleIdx;
      })
      .sort((a, b) => b.fromDate.localeCompare(a.fromDate));

    if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
      daySubjects = [...matchingRules[0].daySlots];
      daySlotCounts = Array.isArray(matchingRules[0].slotCounts)
        ? [...matchingRules[0].slotCounts]
        : [];
    }

    return sanitizeSchedule(daySubjects, daySlotCounts);
  };

  const simulateDaySlots = (daySubjects, daySlotCounts, simMap, mutateSim) => {
    const workingSim = mutateSim ? simMap : { ...simMap };
    const items = [];
    let totalAccelSec = 0;
    let totalOrigSec = 0;
    let totalLessonCount = 0;

    daySubjects.forEach((originalSubId, slotIndex) => {
      let subjectId = originalSubId;
      let subject = subjects[subjectId];
      if (!subject) return;

      const isOriginalDone = isSubjectDoneWithSim(subject, workingSim);
      let isDoubled = false;
      let isReplaced = false;

      if (isOriginalDone) {
        const action = subject.onCompleteAction || 'keep_fixed';
        if (
          action === 'replace' &&
          subject.replacementSubjectId &&
          subjects[subject.replacementSubjectId]
        ) {
          const rep = subjects[subject.replacementSubjectId];
          if (!isSubjectDoneWithSim(rep, workingSim)) {
            subjectId = subject.replacementSubjectId;
            subject = rep;
            isReplaced = true;
          }
        } else if (action === 'double_remaining') {
          const fallbackId = daySubjects.find(
            (sId) =>
              sId !== originalSubId &&
              subjects[sId] &&
              !isSubjectDoneWithSim(subjects[sId], workingSim)
          );
          if (fallbackId && subjects[fallbackId]) {
            subjectId = fallbackId;
            subject = subjects[fallbackId];
            isDoubled = true;
          }
        }
      }

      const topics = subject.topics || [];
      const spd = Math.max(0.5, Number(subject.speed) || 1);
      const customSlotLessons =
        !isDoubled && !isReplaced ? Math.floor(Number(daySlotCounts?.[slotIndex]) || 0) : 0;
      const lessonsN =
        customSlotLessons > 0 ? customSlotLessons : Math.floor(Number(subject.lessonsPerBlock) || 0);
      const goalMin =
        customSlotLessons > 0
          ? 0
          : Number(subject.timeGoalMinutes || subjectTimeGoal?.[subjectId]) || 0;

      let tempIncrement = workingSim[subjectId] || 0;
      let matched = false;
      let blockCount = 0;
      let blockOrigSec = 0;
      let blockAccelSec = 0;
      let lessonNames = [];
      let lessonsDetailed = [];

      for (const topic of topics) {
        const remaining = Math.max(0, (Number(topic.total) || 0) - (Number(topic.completed) || 0));
        if (tempIncrement < remaining) {
          const currentCompleted = (Number(topic.completed) || 0) + tempIncrement;
          if (goalMin > 0 || lessonsN > 0) {
            const remainingInTopic = (Number(topic.total) || 0) - currentCompleted;
            const suggestion = calculateLessonsForGoal(
              topic.lessons || [],
              currentCompleted,
              spd,
              goalMin,
              Number(topic.total) || 0,
              lessonsN
            );
            blockCount = Math.min(remainingInTopic, Math.max(1, suggestion.count));
            blockOrigSec = suggestion.totalOrigSec;
            blockAccelSec = suggestion.totalAccelSec;
            const list = suggestion.lessonsList || [];
            lessonNames = list.map((l) => l.name);
            lessonsDetailed = list.map((l) => ({
              index: l.index,
              name: l.name,
              topicName: topic.name || '',
              subjectId,
              subjectName: subject.name || 'Matéria',
              origSec: l.origSec,
              accelSec: l.accelSec,
              minutes: Math.max(MIN_BLOCK_DURATION, Math.round((l.accelSec || 0) / 60)),
            }));
          } else {
            blockCount = 1;
            const lessonEntry = topic.lessons?.[currentCompleted];
            const durStr = lessonEntry?.duration || '';
            const origSec = parseDurationToSeconds(durStr) || 3600;
            blockOrigSec = origSec;
            blockAccelSec = Math.round(origSec / spd);
            const lName = lessonEntry?.name || `${topic.name} - Aula ${currentCompleted + 1}`;
            lessonNames = [lName];
            lessonsDetailed = [
              {
                index: currentCompleted,
                name: lName,
                topicName: topic.name || '',
                subjectId,
                subjectName: subject.name || 'Matéria',
                origSec: blockOrigSec,
                accelSec: blockAccelSec,
                minutes: Math.max(MIN_BLOCK_DURATION, Math.round(blockAccelSec / 60)),
              },
            ];
          }
          matched = true;
          break;
        } else {
          tempIncrement -= remaining;
        }
      }

      // If subject has no remaining lessons, skip
      if (!matched) {
        return;
      }

      workingSim[subjectId] = (workingSim[subjectId] || 0) + blockCount;
      totalAccelSec += blockAccelSec;
      totalOrigSec += blockOrigSec;
      totalLessonCount += blockCount;

      const accelMin = Math.max(MIN_BLOCK_DURATION, Math.round(blockAccelSec / 60));
      items.push({
        slotIndex,
        subjectId,
        subjectName: subject.name || 'Matéria',
        lessonCount: blockCount,
        minutes: accelMin,
        rawMinutes: blockAccelSec / 60,
        accelSec: blockAccelSec,
        origSec: blockOrigSec,
        lessonNames,
        lessons: lessonsDetailed,
      });
    });

    const totalMinutes =
      totalAccelSec > 0 ? Math.max(MIN_BLOCK_DURATION, Math.round(totalAccelSec / 60)) : 0;

    return {
      items,
      totalAccelSec,
      totalOrigSec,
      totalLessonCount,
      totalMinutes,
    };
  };

  // Build day entries Mon..Sun
  const dayEntries = WEEK_DAYS.map((day, idx) => {
    const targetDate = new Date(mondayDate);
    targetDate.setDate(mondayDate.getDate() + idx);
    const dayDiff = Math.round((targetDate.getTime() - todayMidnight.getTime()) / 86400000);
    const sched = resolveDaySchedule(targetDate, dayDiff);
    return {
      dayKey: day.key,
      dateStr: toLocalDateStr(targetDate, getLocalDateStr),
      dayDiff,
      isPast: dayDiff < 0,
      isToday: dayDiff === 0,
      ...sched,
    };
  });

  // First simulate today -> Sunday sequentially (mutating forward queue just like Ciclo.jsx)
  const forwardSim = {};
  const byDay = {};

  dayEntries
    .filter((d) => !d.isPast)
    .forEach((entry) => {
      const res = simulateDaySlots(entry.daySubjects, entry.daySlotCounts, forwardSim, true);
      byDay[entry.dayKey] = buildDayPlanRecord(entry, res);
    });

  // For earlier days in the same week (Mon..yesterday), compute their scheduled lesson load
  // without consuming today's remaining queue so the full 7-day planner reflects their routine.
  dayEntries
    .filter((d) => d.isPast)
    .forEach((entry) => {
      const res = simulateDaySlots(entry.daySubjects, entry.daySlotCounts, {}, false);
      byDay[entry.dayKey] = buildDayPlanRecord(entry, res);
    });

  let weeklyTotalMinutes = 0;
  let daysWithLessonsCount = 0;
  let weeklyTotalLessons = 0;

  WEEK_DAYS.forEach(({ key }) => {
    const dp = byDay[key];
    if (dp && dp.totalMinutes > 0) {
      weeklyTotalMinutes += dp.totalMinutes;
      daysWithLessonsCount += 1;
      weeklyTotalLessons += dp.totalLessonCount;
    }
  });

  return {
    byDay,
    weeklyTotalMinutes,
    daysWithLessonsCount,
    weeklyTotalLessons,
  };
}

function buildDayPlanRecord(entry, res) {
  const { items, totalAccelSec, totalOrigSec, totalLessonCount, totalMinutes } = res;
  const summaryNote = items
    .map((it) => `${it.subjectName}${it.lessonCount > 1 ? ` (${it.lessonCount})` : ''}`)
    .join(' · ');

  const summaryLabel =
    items.length === 1
      ? `Aulas: ${items[0].subjectName}`
      : items.length > 1
        ? `Aulas do dia (${totalLessonCount})`
        : 'Aulas do dia';

  const lessons = items.flatMap((it) => it.lessons || []);
  const sigParts = items.map((it) => `${it.subjectId}:${it.minutes}:${it.lessonCount}`).join(',');
  const signature = `${totalMinutes}|${sigParts}`;

  return {
    dayKey: entry.dayKey,
    dateStr: entry.dateStr,
    isPast: entry.isPast,
    isToday: entry.isToday,
    totalMinutes,
    totalAccelSec,
    totalOrigSec,
    totalLessonCount,
    items,
    lessons,
    summaryLabel,
    summaryNote,
    signature,
  };
}

/**
 * Returns sorted free intervals [startMin, endMin] within [minBound, maxBound].
 */
export function findFreeWindows(blocks, minBound = 0, maxBound = 1440) {
  const sorted = [...(blocks || [])]
    .filter((b) => b.endMin > minBound && b.startMin < maxBound)
    .sort((a, b) => a.startMin - b.startMin);

  const windows = [];
  let cursor = minBound;

  for (const b of sorted) {
    const start = Math.max(minBound, b.startMin);
    const end = Math.min(maxBound, b.endMin);
    if (start > cursor) {
      windows.push({ startMin: cursor, endMin: start, duration: start - cursor });
    }
    if (end > cursor) cursor = end;
  }

  if (cursor < maxBound) {
    windows.push({ startMin: cursor, endMin: maxBound, duration: maxBound - cursor });
  }

  return windows;
}

/**
 * Finds the best contiguous start minute for a block of `durationMin` inside free windows,
 * optionally preferring `preferredAnchors` (e.g. [480, 1140, 840]).
 */
function pickSlotFromWindows(windows, durationMin, preferredAnchors = []) {
  // First try preferred anchor starts if one fits cleanly inside a free window
  for (const anchor of preferredAnchors) {
    const match = windows.find((w) => anchor >= w.startMin && anchor + durationMin <= w.endMin);
    if (match) return anchor;
  }

  // Next, pick the first free window that can hold the full duration, snapping nicely to 15m
  const fitting = windows.find((w) => w.duration >= durationMin);
  if (fitting) {
    const snapped = Math.ceil(fitting.startMin / 15) * 15;
    if (snapped + durationMin <= fitting.endMin) return snapped;
    return fitting.startMin;
  }

  return null;
}

/**
 * Places a list of incoming study block specs into a day without colliding with `occupiedBlocks`.
 * If a block is larger than the largest single free window, it cleanly splits across available windows.
 */
export function placeStudySpecsInDay(occupiedBlocks, specs, options = {}) {
  const {
    preferredStartMin = null,
    gapBetweenParts = 15,
    sequential = true,
  } = options;

  const safeGap = Math.max(0, Math.min(120, Math.round(Number(gapBetweenParts) || 0)));
  const placed = [];
  const workingOccupied = [...(occupiedBlocks || [])];

  // Preferred anchors for the first block (or spread mode when sequential=false)
  const isMultiple = specs.length > 1;
  const defaultAnchorsByIdx = (idx) => {
    if (preferredStartMin !== null && idx === 0) {
      return [preferredStartMin, 480, 1140, 840, 360];
    }
    if (!sequential && isMultiple) {
      if (idx === 0) return [480, 1140, 840, 360];
      if (idx === 1) return [1140, 840, 600, 1020];
      return [1170, 960, 780, 660];
    }
    return [480, 1140, 840, 1080, 360];
  };

  specs.forEach((spec, idx) => {
    const durationMin = Math.max(MIN_BLOCK_DURATION, Math.round(Number(spec.durationMin) || 60));

    // In sequential mode, always place block idx > 0 right after the previous block + exact break interval
    let anchors = defaultAnchorsByIdx(idx);
    let minAfterPrev = null;
    if (idx > 0 && placed.length > 0 && (sequential || preferredStartMin !== null)) {
      const prevEnd = placed[placed.length - 1].endMin;
      minAfterPrev = prevEnd + safeGap;
      anchors = safeGap > 0
        ? [prevEnd + safeGap, prevEnd, ...anchors]
        : [prevEnd, ...anchors];
    }

    // Search progressively wider day bounds; if sequential, first look for windows starting at/after prevEnd + safeGap
    let chosenStart = null;
    if (minAfterPrev !== null && minAfterPrev + durationMin <= 1440) {
      const afterWindows = findFreeWindows(workingOccupied, minAfterPrev, 1440);
      chosenStart = pickSlotFromWindows(afterWindows, durationMin, [minAfterPrev]);
    }
    if (chosenStart === null) {
      for (const [minB, maxB] of [
        [360, 1380],
        [300, 1440],
        [0, 1440],
      ]) {
        const windows = findFreeWindows(workingOccupied, minB, maxB);
        chosenStart = pickSlotFromWindows(windows, durationMin, anchors);
        if (chosenStart !== null) break;
      }
    }

    if (chosenStart !== null) {
      const blk = {
        id: createBlockId(),
        category: spec.category || 'study',
        label: spec.label || 'Aulas do dia',
        startMin: chosenStart,
        endMin: chosenStart + durationMin,
        note: spec.note || '',
        ...(spec.source ? { source: spec.source } : {}),
        ...(spec.subjectId ? { subjectId: spec.subjectId } : {}),
        ...(spec.partIndex ? { partIndex: spec.partIndex, partTotal: spec.partTotal } : {}),
      };
      placed.push(blk);
      workingOccupied.push(blk);
      return;
    }

    // Fallback: no single contiguous window fits the full duration -> split across largest free windows
    let remaining = durationMin;
    const allWindows = findFreeWindows(workingOccupied, 300, 1440)
      .filter((w) => w.duration >= MIN_BLOCK_DURATION)
      .sort((a, b) => b.duration - a.duration);

    const chunks = [];
    for (const w of allWindows) {
      if (remaining < MIN_BLOCK_DURATION) break;
      const take = Math.min(remaining, w.duration);
      chunks.push({ startMin: w.startMin, endMin: w.startMin + take });
      remaining -= take;
    }

    chunks
      .sort((a, b) => a.startMin - b.startMin)
      .forEach((chunk, cIdx) => {
        const blk = {
          id: createBlockId(),
          category: spec.category || 'study',
          label:
            chunks.length > 1
              ? `${spec.label || 'Aulas do dia'} · Parte ${cIdx + 1}/${chunks.length}`
              : spec.label || 'Aulas do dia',
          startMin: chunk.startMin,
          endMin: chunk.endMin,
          note: spec.note || '',
          ...(spec.source ? { source: spec.source } : {}),
          ...(spec.subjectId ? { subjectId: spec.subjectId } : {}),
          ...(chunks.length > 1 ? { partIndex: cIdx + 1, partTotal: chunks.length } : {}),
        };
        placed.push(blk);
        workingOccupied.push(blk);
      });
  });

  return [...(occupiedBlocks || []), ...placed].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin
  );
}

/**
 * Splits a total duration into `count` integer parts (>= 15m each) summing exactly to `totalMin`.
 */
export function splitDurationEvenly(totalMin, count) {
  const safeTotal = Math.max(MIN_BLOCK_DURATION, Math.round(totalMin));
  const maxParts = Math.max(1, Math.floor(safeTotal / MIN_BLOCK_DURATION));
  const partsCount = Math.max(1, Math.min(count, maxParts));
  if (partsCount === 1) return [safeTotal];

  // Try to make the first parts nice 5-minute multiples when possible while preserving exact sum
  const base = Math.floor(safeTotal / partsCount);
  const roundedBase =
    base >= 20 ? Math.max(MIN_BLOCK_DURATION, Math.round(base / 5) * 5) : base;

  const parts = [];
  let remaining = safeTotal;
  for (let i = 0; i < partsCount - 1; i++) {
    const maxAllowed = remaining - MIN_BLOCK_DURATION * (partsCount - 1 - i);
    const take = Math.max(MIN_BLOCK_DURATION, Math.min(roundedBase, maxAllowed));
    parts.push(take);
    remaining -= take;
  }
  parts.push(remaining);
  return parts;
}

/**
 * Builds synced study blocks for a single day according to `mode`:
 * - 'blocks' (or legacy 'single'): splits dayPlan.totalMinutes into `blocksPerDay` blocks (1..8) spaced by `breakMin`
 * - 'by_subject': 1 block per subject from dayPlan.items spaced by `breakMin`
 * Keeps all non-study blocks (Trabalho, Treino, Outra, Sono) untouched.
 */
export function buildSyncedStudyBlocksForDay(existingDayBlocks, dayPlan, mode = 'blocks', options = {}) {
  const nonStudy = (existingDayBlocks || []).filter((b) => b.category !== 'study');
  if (!dayPlan || dayPlan.totalMinutes <= 0) {
    return nonStudy;
  }

  const existingStudy = (existingDayBlocks || [])
    .filter((b) => b.category === 'study')
    .sort((a, b) => a.startMin - b.startMin);

  const preferredStartMin =
    options.preferredStartMin !== undefined
      ? options.preferredStartMin
      : existingStudy.length > 0
        ? existingStudy[0].startMin
        : null;

  let specs = [];
  let gapMin = 0;

  if (mode === 'by_subject' && dayPlan.items.length > 0) {
    gapMin = options.breakMin !== undefined ? Number(options.breakMin) : 15;
    specs = dayPlan.items.map((item) => ({
      durationMin: item.minutes,
      label: item.subjectName,
      note:
        item.lessonCount === 1
          ? item.lessonNames?.[0] || '1 aula programada'
          : `${item.lessonCount} aulas · ${formatMinutesCompact(item.minutes)}`,
      subjectId: item.subjectId,
      source: 'cronograma',
    }));
  } else {
    const requestedCount = Math.max(1, Math.min(8, Math.round(Number(options.blocksPerDay) || 1)));
    const durations =
      requestedCount > 1 ? splitDurationEvenly(dayPlan.totalMinutes, requestedCount) : [dayPlan.totalMinutes];

    if (durations.length > 1) {
      gapMin = options.breakMin !== undefined ? Number(options.breakMin) : 30;
      specs = durations.map((dur, idx) => ({
        durationMin: dur,
        label: `Aulas do dia · Parte ${idx + 1}/${durations.length}`,
        note: dayPlan.summaryNote,
        source: 'cronograma',
        partIndex: idx + 1,
        partTotal: durations.length,
      }));
    } else {
      specs = [
        {
          durationMin: dayPlan.totalMinutes,
          label: dayPlan.summaryLabel || 'Aulas do dia',
          note: dayPlan.summaryNote,
          source: 'cronograma',
        },
      ];
    }
  }

  return placeStudySpecsInDay(nonStudy, specs, {
    preferredStartMin,
    gapBetweenParts: gapMin,
    sequential: true,
  });
}

/**
 * Splits a single existing block in a day into 2/3 parts, a custom first-part split, or by subjects.
 */
export function splitSingleBlockInDay(dayBlocks, blockId, splitSpec) {
  const list = dayBlocks || [];
  const target = list.find((b) => b.id === blockId);
  if (!target) return list;

  const totalDur = target.endMin - target.startMin;
  if (totalDur < MIN_BLOCK_DURATION * 2) return list;

  const others = list.filter((b) => b.id !== blockId);
  const baseLabel = target.label.replace(/\s*·\s*Parte\s+\d+\/\d+$/i, '').trim() || 'Estudos';

  let specs = [];

  if (splitSpec.type === 'by_subject' && Array.isArray(splitSpec.items) && splitSpec.items.length > 1) {
    specs = splitSpec.items.map((item) => ({
      category: 'study',
      durationMin: item.minutes,
      label: item.subjectName,
      note:
        item.lessonCount === 1
          ? item.lessonNames?.[0] || '1 aula programada'
          : `${item.lessonCount} aulas · ${formatMinutesCompact(item.minutes)}`,
      subjectId: item.subjectId,
      source: target.source || 'cronograma',
    }));
  } else if (splitSpec.type === 'custom') {
    const firstMin = Math.max(
      MIN_BLOCK_DURATION,
      Math.min(totalDur - MIN_BLOCK_DURATION, Math.round(Number(splitSpec.firstMin) || totalDur / 2))
    );
    const secondMin = totalDur - firstMin;
    specs = [
      {
        category: target.category,
        durationMin: firstMin,
        label: `${baseLabel} · Parte 1/2`,
        note: target.note,
        source: target.source,
        partIndex: 1,
        partTotal: 2,
      },
      {
        category: target.category,
        durationMin: secondMin,
        label: `${baseLabel} · Parte 2/2`,
        note: target.note,
        source: target.source,
        partIndex: 2,
        partTotal: 2,
      },
    ];
  } else {
    const count = splitSpec.count === 3 && totalDur >= 45 ? 3 : 2;
    const durations = splitDurationEvenly(totalDur, count);
    specs = durations.map((dur, idx) => ({
      category: target.category,
      durationMin: dur,
      label: `${baseLabel} · Parte ${idx + 1}/${durations.length}`,
      note: target.note,
      source: target.source,
      partIndex: idx + 1,
      partTotal: durations.length,
    }));
  }

  return placeStudySpecsInDay(others, specs, {
    preferredStartMin: target.startMin,
    gapBetweenParts: splitSpec.type === 'by_subject' ? 15 : 30,
  });
}

/**
 * Merges all study blocks in a day back into a single unified block.
 */
export function mergeStudyBlocksInDay(dayBlocks, dayPlan = null) {
  const list = dayBlocks || [];
  const studyBlocks = list
    .filter((b) => b.category === 'study')
    .sort((a, b) => a.startMin - b.startMin);
  if (studyBlocks.length <= 1) return list;

  const nonStudy = list.filter((b) => b.category !== 'study');
  const sumDuration = studyBlocks.reduce((acc, b) => acc + Math.max(0, b.endMin - b.startMin), 0);
  const allFromCronograma = studyBlocks.every((b) => b.source === 'cronograma');
  const mergedDuration = Math.max(
    MIN_BLOCK_DURATION,
    allFromCronograma && dayPlan?.totalMinutes > 0 ? dayPlan.totalMinutes : sumDuration
  );

  const label =
    allFromCronograma && dayPlan?.summaryLabel
      ? dayPlan.summaryLabel
      : studyBlocks[0].label.replace(/\s*·\s*Parte\s+\d+\/\d+$/i, '').trim() || 'Aulas do dia';
  const note =
    allFromCronograma && dayPlan?.summaryNote
      ? dayPlan.summaryNote
      : studyBlocks.map((b) => b.note).filter(Boolean).join(' · ').slice(0, 140);

  return placeStudySpecsInDay(
    nonStudy,
    [
      {
        durationMin: mergedDuration,
        label,
        note,
        source: allFromCronograma ? 'cronograma' : undefined,
      },
    ],
    { preferredStartMin: studyBlocks[0].startMin }
  );
}
