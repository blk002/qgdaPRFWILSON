import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Copy,
  Trash2,
  BookOpen,
  Briefcase,
  Dumbbell,
  Sparkles,
  Moon,
  Clock,
  LayoutGrid,
  List,
  Wand2,
  ChevronDown,
  RotateCcw,
  Target,
  X,
  ArrowRight,
  Scissors,
  Combine,
  RefreshCw,
  CalendarClock
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  WEEK_DAYS,
  ROUTINE_CATEGORIES,
  ROUTINE_PRESETS,
  getCategoryMeta,
  createBlockId,
  getTodayDayKey,
  minutesToTimeStr,
  formatMinutesCompact,
  normalizeRoutine,
  getEmptyRoutineDays,
  clampDragInterval,
  findOverlappingBlock,
  computeWeeklyStats,
  findCurrentOrNextBlock,
  mergeTafAppRoutineBlocks
} from '../components/rotina/routineUtils';
import {
  computeWeeklyLessonPlan,
  buildSyncedStudyBlocksForDay,
  splitSingleBlockInDay,
  mergeStudyBlocksInDay
} from '../components/rotina/scheduleSync';
import {
  RoutineBlockModal,
  CopyDayModal,
  SplitBlockModal
} from '../components/rotina/RoutineBlockModal';

const HOUR_HEIGHT = 48; // px per 60 min (visão geral panorâmica da semana)
const STEP_MIN = 30;
const MOVE_SNAP_MIN = 15;
const WEEK_TOTAL_MIN = 7 * 1440;

const CATEGORY_ICONS = {
  study: BookOpen,
  work: Briefcase,
  training: Dumbbell,
  other: Sparkles,
  rest: Moon,
};

function mergeBlockIntoDay(dayBlocks, incomingBlock, ignoreId = null) {
  const { startMin, endMin } = incomingBlock;
  const filtered = (dayBlocks || []).filter((b) => {
    if (ignoreId && b.id === ignoreId) return false;
    return !(startMin < b.endMin && endMin > b.startMin);
  });
  return [...filtered, incomingBlock].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin
  );
}

/**
 * Clean multi-segment SVG Ring Chart for the 168-hour weekly balance.
 */
function WeeklyBalanceRing({ totals }) {
  const size = 148;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    return ROUTINE_CATEGORIES.reduce(
      (acc, cat) => {
        const mins = totals[cat.id] || 0;
        const frac = mins / WEEK_TOTAL_MIN;
        const dashLen = frac * circumference;
        if (mins > 0) {
          acc.items.push({
            id: cat.id,
            label: cat.label,
            color: cat.strokeColor,
            mins,
            dashLen,
            offset: acc.offset,
          });
        }
        acc.offset += dashLen;
        return acc;
      },
      { items: [], offset: 0 }
    ).items;
  }, [totals, circumference]);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label="Distribuição semanal de horas"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        {segments.map((seg) => (
          <circle
            key={seg.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(0, seg.dashLen - 1.5)} ${circumference}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            className="transition-all duration-300"
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
          Estudos / sem
        </span>
        <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white leading-tight mt-0.5">
          {formatMinutesCompact(totals.study)}
        </span>
        <span className="text-[10px] font-mono tabular-nums text-sky-600 dark:text-sky-400 mt-0.5">
          {formatMinutesCompact(totals.avgStudyPerDay)}/dia
        </span>
      </div>
    </div>
  );
}

export default function RotinaVida() {
  const {
    lifeRoutine,
    setLifeRoutine,
    dailyGoalMinutes = 240,
    setDailyGoalMinutes,
    subjects,
    cycle,
    cycleSlotCounts,
    cycleScheduleType,
    cycleWeekStart,
    cycleCarryoverOffset,
    calendarOverrides,
    calendarOverrideCounts,
    futureScheduleRules,
    subjectTimeGoal,
    currentDayIndex,
    getLocalDateStr,
    tafAppData,
    loadFromCloud,
    isSyncing,
  } = useStore();

  const routine = useMemo(() => normalizeRoutine(lifeRoutine), [lifeRoutine]);
  const todayKey = useMemo(() => getTodayDayKey(), []);
  const { byDay, totals } = useMemo(
    () => computeWeeklyStats(routine.days),
    [routine.days]
  );

  // Calcula automaticamente o tempo real de aulas de cada dia (Seg–Dom) a partir do Cronograma
  const weeklyLessonPlan = useMemo(
    () =>
      computeWeeklyLessonPlan({
        subjects,
        cycle,
        cycleSlotCounts,
        cycleScheduleType,
        cycleWeekStart,
        cycleCarryoverOffset,
        calendarOverrides,
        calendarOverrideCounts,
        futureScheduleRules,
        subjectTimeGoal,
        currentDayIndex,
        getLocalDateStr,
      }),
    [
      subjects,
      cycle,
      cycleSlotCounts,
      cycleScheduleType,
      cycleWeekStart,
      cycleCarryoverOffset,
      calendarOverrides,
      calendarOverrideCounts,
      futureScheduleRules,
      subjectTimeGoal,
      currentDayIndex,
      getLocalDateStr,
    ]
  );

  // Coloca automaticamente o tempo de aula de cada dia no planejador (sem sobrescrever trabalho/treino/ajustes manuais)
  useEffect(() => {
    if (!routine.autoSyncLessons || weeklyLessonPlan.weeklyTotalMinutes <= 0) return;

    const nextDays = { ...routine.days };
    const nextSignatures = { ...(routine.syncedSignatures || {}) };
    let changed = false;

    WEEK_DAYS.forEach(({ key }) => {
      const dayPlan = weeklyLessonPlan.byDay[key];
      if (!dayPlan || dayPlan.totalMinutes <= 0) return;

      const dayBlocks = nextDays[key] || [];
      const studyBlocks = dayBlocks.filter((b) => b.category === 'study');
      const prevSig = nextSignatures[key];

      // Caso 1: Dia ainda não sincronizado e sem blocos de estudo -> coloca automaticamente
      if (!prevSig && studyBlocks.length === 0) {
        const layout = routine.preferredLayout || 'blocks';
        const breakMin =
          layout === 'by_subject'
            ? routine.subjectBreakMin
            : routine.blocksPerDay > 1
              ? routine.blockBreakMin
              : 0;
        nextDays[key] = buildSyncedStudyBlocksForDay(dayBlocks, dayPlan, layout, {
          blocksPerDay: routine.blocksPerDay,
          breakMin,
        });
        nextSignatures[key] = dayPlan.signature;
        changed = true;
        return;
      }

      // Caso 2: Cronograma mudou e o dia possui 1 bloco sincronizado -> atualiza duração mantendo o horário escolhido
      if (
        prevSig &&
        prevSig !== dayPlan.signature &&
        studyBlocks.length === 1 &&
        studyBlocks[0].source === 'cronograma'
      ) {
        nextDays[key] = buildSyncedStudyBlocksForDay(dayBlocks, dayPlan, 'blocks', {
          blocksPerDay: 1,
          preferredStartMin: studyBlocks[0].startMin,
        });
        nextSignatures[key] = dayPlan.signature;
        changed = true;
      }
    });

    if (changed) {
      setLifeRoutine((prev) => {
        const current = normalizeRoutine(prev);
        return {
          ...current,
          days: nextDays,
          syncedSignatures: nextSignatures,
        };
      });
    }
  }, [
    routine.autoSyncLessons,
    routine.days,
    routine.preferredLayout,
    routine.blocksPerDay,
    routine.blockBreakMin,
    routine.subjectBreakMin,
    routine.syncedSignatures,
    weeklyLessonPlan,
    setLifeRoutine,
  ]);

  // Sincroniza automaticamente os blocos de treino enviados pelo App Android TAF (tafAppData.routineBlocks)
  useEffect(() => {
    if (!tafAppData) return;
    const blocks = Array.isArray(tafAppData?.routineBlocks) ? tafAppData.routineBlocks : [];

    const result = mergeTafAppRoutineBlocks(
      routine.days,
      blocks,
      routine.syncedSignatures?._tafApp || ''
    );
    if (!result.changed) return;

    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      return {
        ...current,
        days: result.nextDays,
        syncedSignatures: {
          ...current.syncedSignatures,
          _tafApp: result.nextSignature,
        },
      };
    });
  }, [tafAppData, routine.days, routine.syncedSignatures, setLifeRoutine]);

  const [activeBrush, setActiveBrush] = useState('study');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [hoverSlot, setHoverSlot] = useState(null); // { dayKey, startMin }

  const [blockModal, setBlockModal] = useState({
    isOpen: false,
    mode: 'create',
    dayKey: todayKey,
    block: null,
  });
  const [copyModal, setCopyModal] = useState({
    isOpen: false,
    sourceDayKey: todayKey,
  });
  const [splitModal, setSplitModal] = useState({
    isOpen: false,
    dayKey: todayKey,
    block: null,
  });

  // Unified pointer interaction state: 'paint' | 'resize' | 'move'
  const [dragState, setDragState] = useState(null);
  const dragStateRef = useRef(null);
  const columnRefs = useRef({});
  const presetsMenuRef = useRef(null);

  const startHour = routine.startHour === 0 ? 0 : 5;
  const endHour = 24;
  const visibleStartMin = startHour * 60;
  const visibleEndMin = endHour * 60;
  const visibleTotalMin = visibleEndMin - visibleStartMin;
  const gridHeightPx = (visibleTotalMin / 60) * HOUR_HEIGHT;
  const hoursList = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!showPresetsMenu) return;
    const handleOutside = (e) => {
      if (presetsMenuRef.current && !presetsMenuRef.current.contains(e.target)) {
        setShowPresetsMenu(false);
        setConfirmClear(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showPresetsMenu]);

  const commitRoutineDays = useCallback(
    (updater) => {
      setLifeRoutine((prev) => {
        const current = normalizeRoutine(prev);
        const nextDays = typeof updater === 'function' ? updater(current.days) : updater;
        return { ...current, days: nextDays };
      });
    },
    [setLifeRoutine]
  );

  const toggleFullDayHours = () => {
    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      return { ...current, startHour: current.startHour === 0 ? 5 : 0 };
    });
  };

  const clientYToSlotStart = useCallback(
    (dayKey, clientY) => {
      const el = columnRefs.current[dayKey];
      if (!el) return visibleStartMin;
      const rect = el.getBoundingClientRect();
      const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const rawMin = visibleStartMin + (relY / HOUR_HEIGHT) * 60;
      const snapped = Math.floor(rawMin / STEP_MIN) * STEP_MIN;
      return Math.max(visibleStartMin, Math.min(visibleEndMin - STEP_MIN, snapped));
    },
    [visibleStartMin, visibleEndMin]
  );

  const clientYToSlotEnd = useCallback(
    (dayKey, clientY) => {
      const el = columnRefs.current[dayKey];
      if (!el) return visibleStartMin + STEP_MIN;
      const rect = el.getBoundingClientRect();
      const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const rawMin = visibleStartMin + (relY / HOUR_HEIGHT) * 60;
      const snapped = Math.round(rawMin / STEP_MIN) * STEP_MIN;
      return Math.max(visibleStartMin + STEP_MIN, Math.min(visibleEndMin, snapped));
    },
    [visibleStartMin, visibleEndMin]
  );

  // Detect which day column a pointer clientX is currently over
  const clientXToDayKey = useCallback((clientX, fallbackKey) => {
    for (const day of WEEK_DAYS) {
      const el = columnRefs.current[day.key];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return day.key;
      }
    }
    return fallbackKey;
  }, []);

  // Hover indicator on empty grid slots
  const handleColumnMouseMove = (dayKey, e) => {
    if (dragStateRef.current) {
      if (hoverSlot) setHoverSlot(null);
      return;
    }
    if (e.target.closest('[data-routine-block="true"]')) {
      if (hoverSlot) setHoverSlot(null);
      return;
    }
    const slotMin = clientYToSlotStart(dayKey, e.clientY);
    const occupied = (routine.days[dayKey] || []).some(
      (b) => slotMin >= b.startMin && slotMin < b.endMin
    );
    if (occupied) {
      if (hoverSlot) setHoverSlot(null);
      return;
    }
    if (!hoverSlot || hoverSlot.dayKey !== dayKey || hoverSlot.startMin !== slotMin) {
      setHoverSlot({ dayKey, startMin: slotMin });
    }
  };

  // Start drag-to-paint on empty slot
  const handleColumnPointerDown = (dayKey, e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-routine-block="true"]')) return;
    e.preventDefault();
    setHoverSlot(null);

    const anchorMin = clientYToSlotStart(dayKey, e.clientY);
    const dayBlocks = routine.days[dayKey] || [];
    if (dayBlocks.some((b) => anchorMin >= b.startMin && anchorMin < b.endMin)) return;

    const initialInterval = clampDragInterval(
      dayBlocks,
      anchorMin,
      anchorMin + STEP_MIN,
      STEP_MIN,
      visibleStartMin,
      visibleEndMin
    );
    if (!initialInterval) return;

    const nextDrag = {
      type: 'paint',
      dayKey,
      category: activeBrush,
      anchorMin,
      startClientY: e.clientY,
      hasMoved: false,
      startMin: initialInterval.startMin,
      endMin: initialInterval.endMin,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  // Start drag-to-move on an existing block (click < 6px opens edit modal)
  const handleBlockPointerDown = (dayKey, block, e) => {
    if (e.button !== 0) return;
    if (e.target.closest('[data-no-drag="true"]')) return;
    e.stopPropagation();
    e.preventDefault();
    setHoverSlot(null);

    const el = columnRefs.current[dayKey];
    const rect = el?.getBoundingClientRect();
    const pointerMin = rect
      ? visibleStartMin + ((e.clientY - rect.top) / HOUR_HEIGHT) * 60
      : block.startMin;
    const grabOffsetMin = Math.max(0, pointerMin - block.startMin);

    const nextDrag = {
      type: 'move',
      originDayKey: dayKey,
      targetDayKey: dayKey,
      block,
      durationMin: block.endMin - block.startMin,
      grabOffsetMin,
      startClientX: e.clientX,
      startClientY: e.clientY,
      hasMoved: false,
      startMin: block.startMin,
      endMin: block.endMin,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  // Start drag-to-resize on block bottom edge
  const handleResizePointerDown = (dayKey, block, e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setHoverSlot(null);

    const dayBlocks = (routine.days[dayKey] || []).filter((b) => b.id !== block.id);
    const nextBlock = dayBlocks
      .filter((b) => b.startMin >= block.startMin)
      .sort((a, b) => a.startMin - b.startMin)[0];
    const maxEndMin = nextBlock ? Math.min(visibleEndMin, nextBlock.startMin) : visibleEndMin;

    const nextDrag = {
      type: 'resize',
      dayKey,
      blockId: block.id,
      block,
      startMin: block.startMin,
      endMin: block.endMin,
      maxEndMin,
    };
    dragStateRef.current = nextDrag;
    setDragState(nextDrag);
  };

  // Global pointer move / up handler for paint, move, and resize
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e) => {
      const current = dragStateRef.current;
      if (!current) return;

      if (current.type === 'paint') {
        const moved = current.hasMoved || Math.abs(e.clientY - current.startClientY) >= 8;
        const targetEnd = clientYToSlotEnd(current.dayKey, e.clientY);
        const dayBlocks = routine.days[current.dayKey] || [];
        const clamped = clampDragInterval(
          dayBlocks,
          current.anchorMin,
          targetEnd,
          STEP_MIN,
          visibleStartMin,
          visibleEndMin
        );
        if (!clamped) return;
        const updated = {
          ...current,
          hasMoved: moved,
          startMin: clamped.startMin,
          endMin: clamped.endMin,
        };
        dragStateRef.current = updated;
        setDragState(updated);
      } else if (current.type === 'resize') {
        const targetEnd = clientYToSlotEnd(current.dayKey, e.clientY);
        const clampedEnd = Math.max(
          current.startMin + STEP_MIN,
          Math.min(current.maxEndMin, targetEnd)
        );
        const updated = { ...current, endMin: clampedEnd };
        dragStateRef.current = updated;
        setDragState(updated);
      } else if (current.type === 'move') {
        const dist = Math.hypot(
          e.clientX - current.startClientX,
          e.clientY - current.startClientY
        );
        const moved = current.hasMoved || dist >= 6;
        if (!moved) return;

        const targetDayKey = clientXToDayKey(e.clientX, current.targetDayKey);
        const el = columnRefs.current[targetDayKey];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const rawStart = visibleStartMin + (relY / HOUR_HEIGHT) * 60 - current.grabOffsetMin;
        const snappedStart = Math.round(rawStart / MOVE_SNAP_MIN) * MOVE_SNAP_MIN;
        let clampedStart = Math.max(
          visibleStartMin,
          Math.min(visibleEndMin - current.durationMin, snappedStart)
        );
        let clampedEnd = clampedStart + current.durationMin;

        // Proteção contra sobreposição acidental: tenta encostar na borda livre próxima antes de marcar ocupado
        const targetBlocks = routine.days[targetDayKey] || [];
        let conflict = findOverlappingBlock(targetBlocks, clampedStart, clampedEnd, current.block.id);
        if (conflict) {
          const snapAfter = conflict.endMin;
          const snapBefore = conflict.startMin - current.durationMin;
          const canAfter =
            snapAfter + current.durationMin <= visibleEndMin &&
            Math.abs(snapAfter - clampedStart) <= 30 &&
            !findOverlappingBlock(targetBlocks, snapAfter, snapAfter + current.durationMin, current.block.id);
          const canBefore =
            snapBefore >= visibleStartMin &&
            Math.abs(snapBefore - clampedStart) <= 30 &&
            !findOverlappingBlock(targetBlocks, snapBefore, snapBefore + current.durationMin, current.block.id);

          if (canAfter && (!canBefore || Math.abs(snapAfter - clampedStart) <= Math.abs(snapBefore - clampedStart))) {
            clampedStart = snapAfter;
            clampedEnd = clampedStart + current.durationMin;
            conflict = null;
          } else if (canBefore) {
            clampedStart = snapBefore;
            clampedEnd = clampedStart + current.durationMin;
            conflict = null;
          }
        }

        const updated = {
          ...current,
          hasMoved: true,
          targetDayKey,
          startMin: clampedStart,
          endMin: clampedEnd,
          hasConflict: Boolean(conflict),
        };
        dragStateRef.current = updated;
        setDragState(updated);
      }
    };

    const handlePointerUp = () => {
      const current = dragStateRef.current;
      dragStateRef.current = null;
      setDragState(null);
      if (!current) return;

      if (current.type === 'paint') {
        if (!current.hasMoved) {
          const defaultEnd = Math.min(visibleEndMin, current.startMin + 60);
          const meta = getCategoryMeta(current.category);
          setBlockModal({
            isOpen: true,
            mode: 'create',
            dayKey: current.dayKey,
            block: {
              category: current.category,
              label: meta.defaultTitle,
              startMin: current.startMin,
              endMin: defaultEnd,
              note: '',
            },
          });
          return;
        }

        const meta = getCategoryMeta(current.category);
        const newBlock = {
          id: createBlockId(),
          category: current.category,
          label: meta.defaultTitle,
          startMin: current.startMin,
          endMin: current.endMin,
          note: '',
        };
        commitRoutineDays((prevDays) => ({
          ...prevDays,
          [current.dayKey]: mergeBlockIntoDay(prevDays[current.dayKey], newBlock),
        }));
        const dayLabel = WEEK_DAYS.find((d) => d.key === current.dayKey)?.label || '';
        toast.success(
          `${meta.label} (${minutesToTimeStr(newBlock.startMin)}–${minutesToTimeStr(newBlock.endMin)}) adicionado em ${dayLabel}`
        );
      } else if (current.type === 'resize') {
        if (current.endMin !== current.block.endMin) {
          commitRoutineDays((prevDays) => ({
            ...prevDays,
            [current.dayKey]: (prevDays[current.dayKey] || [])
              .map((b) => (b.id === current.blockId ? { ...b, endMin: current.endMin } : b))
              .sort((a, b) => a.startMin - b.startMin),
          }));
        }
      } else if (current.type === 'move') {
        if (!current.hasMoved) {
          // Simple click -> open edit modal
          setBlockModal({
            isOpen: true,
            mode: 'edit',
            dayKey: current.originDayKey,
            block: current.block,
          });
          return;
        }

        if (current.hasConflict) {
          toast.error('Horário ocupado por outro bloco. Solte em um espaço livre ou divida o bloco.');
          return;
        }

        const changed =
          current.targetDayKey !== current.originDayKey ||
          current.startMin !== current.block.startMin;
        if (!changed) return;

        const movedBlock = {
          ...current.block,
          startMin: current.startMin,
          endMin: current.endMin,
        };
        commitRoutineDays((prevDays) => {
          const nextDays = { ...prevDays };
          nextDays[current.originDayKey] = (nextDays[current.originDayKey] || []).filter(
            (b) => b.id !== current.block.id
          );
          nextDays[current.targetDayKey] = [
            ...(nextDays[current.targetDayKey] || []).filter((b) => b.id !== current.block.id),
            movedBlock,
          ].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
          return nextDays;
        });

        const dayLabel = WEEK_DAYS.find((d) => d.key === current.targetDayKey)?.label || '';
        toast.success(
          `"${movedBlock.label}" movido para ${dayLabel} (${minutesToTimeStr(movedBlock.startMin)}–${minutesToTimeStr(movedBlock.endMin)})`
        );
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [
    dragState,
    routine.days,
    clientYToSlotEnd,
    clientXToDayKey,
    visibleStartMin,
    visibleEndMin,
    commitRoutineDays,
  ]);

  const handleSaveBlock = ({
    id,
    originalDayKey,
    targetDays,
    category,
    label,
    startMin,
    endMin,
    note,
    source,
    subjectId,
    partIndex,
    partTotal,
  }) => {
    commitRoutineDays((prevDays) => {
      const nextDays = { ...prevDays };
      if (id && originalDayKey && !targetDays.includes(originalDayKey)) {
        nextDays[originalDayKey] = (nextDays[originalDayKey] || []).filter((b) => b.id !== id);
      }
      targetDays.forEach((dKey) => {
        const isOriginal = Boolean(id && dKey === originalDayKey);
        const existingBlock = isOriginal
          ? (nextDays[dKey] || []).find((b) => b.id === id)
          : null;
        const blockObj = {
          id: isOriginal ? id : createBlockId(),
          category,
          label,
          startMin,
          endMin,
          note,
          ...(source ? { source } : {}),
          ...(existingBlock?.dateIso ? { dateIso: existingBlock.dateIso } : {}),
          ...(existingBlock?.isPlanned ? { isPlanned: true } : {}),
          ...(subjectId ? { subjectId } : {}),
          ...(partIndex ? { partIndex, partTotal } : {}),
        };
        nextDays[dKey] = mergeBlockIntoDay(nextDays[dKey], blockObj, isOriginal ? id : null);
      });
      return nextDays;
    });

    setBlockModal((prev) => ({ ...prev, isOpen: false }));
    toast.success(
      targetDays.length > 1
        ? `"${label}" aplicado em ${targetDays.length} dias.`
        : `"${label}" salvo na rotina.`
    );
  };

  const handleDeleteBlock = (dayKey, blockId) => {
    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      const nextDayBlocks = (current.days[dayKey] || []).filter((b) => b.id !== blockId);
      const dayPlan = weeklyLessonPlan.byDay[dayKey];
      return {
        ...current,
        days: { ...current.days, [dayKey]: nextDayBlocks },
        // Preserva assinatura para não recriar imediatamente um bloco que o usuário acabou de excluir
        syncedSignatures: dayPlan?.signature
          ? { ...current.syncedSignatures, [dayKey]: dayPlan.signature }
          : current.syncedSignatures,
      };
    });
    setBlockModal((prev) => ({ ...prev, isOpen: false }));
    toast.success('Bloco removido.');
  };

  const handleConfirmSplit = (dayKey, blockId, splitSpec) => {
    commitRoutineDays((prevDays) => ({
      ...prevDays,
      [dayKey]: splitSingleBlockInDay(prevDays[dayKey], blockId, splitSpec),
    }));
    setSplitModal({ isOpen: false, dayKey, block: null });
    setBlockModal((prev) => ({ ...prev, isOpen: false }));
    const dayLabel = WEEK_DAYS.find((d) => d.key === dayKey)?.label || '';
    toast.success(`Bloco dividido em ${dayLabel}. Arraste cada parte livremente pelo dia.`);
  };

  const handleMergeDayStudy = (dayKey) => {
    const dayPlan = weeklyLessonPlan.byDay[dayKey];
    commitRoutineDays((prevDays) => ({
      ...prevDays,
      [dayKey]: mergeStudyBlocksInDay(prevDays[dayKey], dayPlan),
    }));
    const dayLabel = WEEK_DAYS.find((d) => d.key === dayKey)?.label || '';
    toast.success(`Blocos de estudo de ${dayLabel} unidos em 1 bloco só.`);
  };

  const handleSyncSingleDayLessons = (dayKey, mode = routine.preferredLayout || 'blocks') => {
    const dayPlan = weeklyLessonPlan.byDay[dayKey];
    if (!dayPlan || dayPlan.totalMinutes <= 0) {
      toast.info('Não há aulas programadas no cronograma para este dia.');
      return;
    }
    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      const breakMin =
        mode === 'by_subject'
          ? current.subjectBreakMin
          : current.blocksPerDay > 1
            ? current.blockBreakMin
            : 0;
      return {
        ...current,
        days: {
          ...current.days,
          [dayKey]: buildSyncedStudyBlocksForDay(current.days[dayKey], dayPlan, mode, {
            blocksPerDay: current.blocksPerDay,
            breakMin,
          }),
        },
        syncedSignatures: {
          ...current.syncedSignatures,
          [dayKey]: dayPlan.signature,
        },
      };
    });
    const dayLabel = WEEK_DAYS.find((d) => d.key === dayKey)?.label || '';
    toast.success(`Aulas de ${dayLabel} (${formatMinutesCompact(dayPlan.totalMinutes)}) posicionadas na grade.`);
  };

  const handleApplyWeekLessonsLayout = (
    mode,
    { blocksPerDay = null, breakMin = null, silent = false } = {}
  ) => {
    if (weeklyLessonPlan.weeklyTotalMinutes <= 0) {
      if (!silent) {
        toast.info('Adicione matérias no Cronograma para distribuir as aulas automaticamente.');
      }
      return;
    }

    const clampedBlocks =
      blocksPerDay !== null
        ? Math.max(1, Math.min(8, Math.round(Number(blocksPerDay) || 1)))
        : null;
    const clampedBreak =
      breakMin !== null
        ? Math.max(0, Math.min(120, Math.round(Number(breakMin) || 0)))
        : null;

    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      const nextBlocksPerDay =
        mode === 'blocks' && clampedBlocks !== null ? clampedBlocks : current.blocksPerDay;
      const nextSubjectBreak =
        mode === 'by_subject' && clampedBreak !== null ? clampedBreak : current.subjectBreakMin;
      const nextBlockBreak =
        mode === 'blocks' && clampedBreak !== null ? clampedBreak : current.blockBreakMin;
      const activeBreak =
        mode === 'by_subject'
          ? nextSubjectBreak
          : nextBlocksPerDay > 1
            ? nextBlockBreak
            : 0;

      const nextDays = { ...current.days };
      const nextSignatures = { ...current.syncedSignatures };

      WEEK_DAYS.forEach(({ key }) => {
        const dayPlan = weeklyLessonPlan.byDay[key];
        if (!dayPlan || dayPlan.totalMinutes <= 0) return;
        nextDays[key] = buildSyncedStudyBlocksForDay(current.days[key], dayPlan, mode, {
          blocksPerDay: nextBlocksPerDay,
          breakMin: activeBreak,
        });
        nextSignatures[key] = dayPlan.signature;
      });

      return {
        ...current,
        preferredLayout: mode,
        blocksPerDay: nextBlocksPerDay,
        blockBreakMin: nextBlockBreak,
        subjectBreakMin: nextSubjectBreak,
        days: nextDays,
        syncedSignatures: nextSignatures,
      };
    });

    if (!silent) {
      const effectiveBlocks = clampedBlocks !== null ? clampedBlocks : routine.blocksPerDay;
      const effectiveBreak =
        clampedBreak !== null
          ? clampedBreak
          : mode === 'by_subject'
            ? routine.subjectBreakMin
            : routine.blockBreakMin;

      if (mode === 'by_subject') {
        const suffix =
          effectiveBreak > 0 ? ` com intervalo de ${effectiveBreak} min` : ' sem intervalo';
        toast.success(`Aulas organizadas por matéria${suffix}.`);
      } else if (effectiveBlocks === 1) {
        toast.success('Aulas organizadas em 1 bloco por dia.');
      } else {
        const suffix =
          effectiveBreak > 0 ? ` com intervalo de ${effectiveBreak} min` : ' sem intervalo';
        toast.success(`Aulas divididas em ${effectiveBlocks} blocos por dia${suffix}.`);
      }
    }
  };

  const handleToggleAutoSync = () => {
    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      const nextAutoSync = !current.autoSyncLessons;
      if (!nextAutoSync) {
        return { ...current, autoSyncLessons: false };
      }
      const nextSignatures = { ...(current.syncedSignatures || {}) };
      WEEK_DAYS.forEach(({ key }) => {
        const hasStudyBlock = (current.days[key] || []).some((b) => b.category === 'study');
        if (!hasStudyBlock) {
          delete nextSignatures[key];
        }
      });
      return { ...current, autoSyncLessons: true, syncedSignatures: nextSignatures };
    });
  };

  const handleCopyDay = (fromDay, targets) => {
    commitRoutineDays((prevDays) => {
      const sourceBlocks = prevDays[fromDay] || [];
      const nextDays = { ...prevDays };
      targets.forEach((tKey) => {
        nextDays[tKey] = sourceBlocks.map((b) => ({ ...b, id: createBlockId() }));
      });
      return nextDays;
    });
    setCopyModal({ isOpen: false, sourceDayKey: fromDay });
    const srcLabel = WEEK_DAYS.find((d) => d.key === fromDay)?.label || '';
    toast.success(
      `Rotina de ${srcLabel} replicada para ${targets.length} ${targets.length === 1 ? 'dia' : 'dias'}.`
    );
  };

  const handleApplyPreset = (preset) => {
    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      const presetDays = preset.buildDays();
      const nextSignatures = { ...current.syncedSignatures };
      WEEK_DAYS.forEach(({ key }) => {
        const dp = weeklyLessonPlan.byDay[key];
        if (dp?.signature) nextSignatures[key] = dp.signature;
      });
      return { ...current, days: presetDays, syncedSignatures: nextSignatures };
    });
    setShowPresetsMenu(false);
    setConfirmClear(false);
    toast.success(`Modelo "${preset.name}" aplicado.`);
  };

  const handleClearWeek = () => {
    setLifeRoutine((prev) => {
      const current = normalizeRoutine(prev);
      const nextSignatures = {};
      WEEK_DAYS.forEach(({ key }) => {
        const dp = weeklyLessonPlan.byDay[key];
        if (dp?.signature) nextSignatures[key] = dp.signature;
      });
      return { ...current, days: getEmptyRoutineDays(), syncedSignatures: nextSignatures };
    });
    setShowPresetsMenu(false);
    setConfirmClear(false);
    toast.success('Semana limpa.');
  };

  const handleSyncGoal = () => {
    if (!setDailyGoalMinutes || totals.avgStudyPerDay <= 0) return;
    const rounded = Math.max(30, Math.round(totals.avgStudyPerDay / 15) * 15);
    setDailyGoalMinutes(rounded);
    toast.success(`Meta diária atualizada para ${formatMinutesCompact(rounded)}/dia.`);
  };

  const isWeekEmpty = totals.totalBlocks === 0;
  const activeBrushMeta = getCategoryMeta(activeBrush);
  const todayMeta = WEEK_DAYS.find((d) => d.key === todayKey) || WEEK_DAYS[0];
  const todayBlocks = useMemo(
    () => routine.days[todayKey] || [],
    [routine.days, todayKey]
  );
  const todayFocus = useMemo(
    () => findCurrentOrNextBlock(todayBlocks, nowMinutes),
    [todayBlocks, nowMinutes]
  );
  const roundedAvgStudy = Math.max(30, Math.round(totals.avgStudyPerDay / 15) * 15);
  const canSyncGoal =
    totals.avgStudyPerDay >= 30 &&
    Math.abs(roundedAvgStudy - (Number(dailyGoalMinutes) || 0)) >= 15;

  return (
    <div className="space-y-4">
      {/* BARRA DE COMANDO ÚNICA (Pincel + Controles + Ações) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Seletor de Pincel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 xl:pb-0">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 gap-1">
            {ROUTINE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
              const selected = activeBrush === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveBrush(cat.id)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs ring-1 ring-slate-200/90 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${cat.swatchClass}`}
                    aria-hidden="true"
                  />
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${selected ? cat.accentTextClass : 'opacity-70'}`} />
                  <span>{cat.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controles à direita */}
        <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap shrink-0">
          {viewMode === 'grid' && (
            <button
              type="button"
              onClick={toggleFullDayHours}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-mono font-medium tabular-nums text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Alternar faixa horária visível"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{startHour === 0 ? '00h–24h' : '05h–24h'}</span>
            </button>
          )}

          {/* Alternador de Visão */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`h-8 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`h-8 px-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          {/* Menu Modelos */}
          <div className="relative" ref={presetsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowPresetsMenu((v) => !v);
                setConfirmClear(false);
              }}
              className="h-9 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Modelos</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPresetsMenu && (
              <div className="absolute right-0 mt-1.5 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Modelos prontos de rotina
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Carregue uma semana base e personalize arrastando os blocos.
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ROUTINE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
                {!isWeekEmpty && (
                  <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                    {!confirmClear ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="w-full h-8 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Limpar semana</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                          Apagar todos os blocos?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmClear(false)}
                            className="h-7 px-2.5 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            Não
                          </button>
                          <button
                            type="button"
                            onClick={handleClearWeek}
                            className="h-7 px-2.5 rounded-md text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCopyModal({ isOpen: true, sourceDayKey: todayKey })}
            className="h-9 px-3 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Replicar</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setBlockModal({
                isOpen: true,
                mode: 'create',
                dayKey: todayKey,
                block: {
                  category: activeBrush,
                  label: activeBrushMeta.defaultTitle,
                  startMin: 480,
                  endMin: 600,
                  note: '',
                },
              })
            }
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo bloco</span>
          </button>
        </div>
      </div>

      {/* STUDIO PRINCIPAL: CANVAS 7 DIAS À ESQUERDA + PAINEL DE BALANÇO À DIREITA */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_284px] gap-4 items-start">
        {/* COLUNA PRINCIPAL: GRADE SEMANAL OU LISTA POR DIA */}
        {viewMode === 'grid' ? (
          <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
                {/* Cabeçalho dos 7 dias */}
                <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                  <div className="px-2 py-2.5 border-r border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  </div>

                  {WEEK_DAYS.map((day) => {
                    const isToday = day.key === todayKey;
                    const ds = byDay[day.key];
                    const dayPlan = weeklyLessonPlan.byDay[day.key];
                    const dayStudyCount = (routine.days[day.key] || []).filter(
                      (b) => b.category === 'study'
                    ).length;
                    const hasLessonGap =
                      dayPlan &&
                      dayPlan.totalMinutes > 0 &&
                      Math.abs(ds.study - dayPlan.totalMinutes) >= 10;

                    return (
                      <div
                        key={day.key}
                        className={`group/colhead relative flex flex-col justify-between px-2.5 pt-2.5 pb-2 border-r last:border-r-0 border-slate-200/80 dark:border-slate-800 ${
                          isToday ? 'bg-sky-500/[0.06] dark:bg-sky-400/[0.07]' : ''
                        }`}
                      >
                        <div className={`flex items-center gap-1 min-w-0 h-5 ${hasLessonGap ? 'pr-5' : ''}`}>
                          <span
                            className={`text-xs font-bold tracking-tight truncate ${
                              isToday
                                ? 'text-sky-700 dark:text-sky-300'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {day.label}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap shrink-0">
                              · Hoje
                            </span>
                          )}
                        </div>

                        {/* Ações rápidas flutuantes no canto superior direito (não comprimem o título do dia) */}
                        <div
                          className={`absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-md transition-opacity ${
                            hasLessonGap
                              ? 'opacity-100 bg-white/85 dark:bg-slate-900/85 group-hover/colhead:bg-white dark:group-hover/colhead:bg-slate-900 group-hover/colhead:shadow-xs group-hover/colhead:ring-1 group-hover/colhead:ring-slate-200/80 dark:group-hover/colhead:ring-slate-700/80'
                              : 'opacity-0 pointer-events-none group-hover/colhead:opacity-100 group-hover/colhead:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto bg-white/95 dark:bg-slate-900/95 shadow-xs ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                          }`}
                        >
                          {dayStudyCount >= 2 && (
                            <button
                              type="button"
                              onClick={() => handleMergeDayStudy(day.key)}
                              title="Unir blocos de estudo em 1 bloco só"
                              className="hidden group-hover/colhead:inline-flex focus-visible:inline-flex p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                            >
                              <Combine className="w-3 h-3" />
                            </button>
                          )}
                          {hasLessonGap && (
                            <button
                              type="button"
                              onClick={() => handleSyncSingleDayLessons(day.key)}
                              title={`Sincronizar ${formatMinutesCompact(dayPlan.totalMinutes)} de aulas do cronograma`}
                              className="p-1 rounded text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setCopyModal({ isOpen: true, sourceDayKey: day.key })}
                            title={`Replicar ${day.label} para outros dias`}
                            className={`${
                              hasLessonGap ? 'hidden group-hover/colhead:inline-flex focus-visible:inline-flex' : 'inline-flex'
                            } p-1 rounded text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span
                            className={ds.study > 0 ? 'font-semibold text-sky-700 dark:text-sky-300 truncate' : 'truncate'}
                            title={
                              dayPlan?.totalMinutes > 0
                                ? `Cronograma: ${formatMinutesCompact(dayPlan.totalMinutes)} (${dayPlan.totalLessonCount} ${dayPlan.totalLessonCount === 1 ? 'aula' : 'aulas'})`
                                : undefined
                            }
                          >
                            {ds.study > 0
                              ? `${formatMinutesCompact(ds.study)} est.`
                              : dayPlan?.totalMinutes > 0
                                ? `${formatMinutesCompact(dayPlan.totalMinutes)} aulas`
                                : '—'}
                          </span>
                          {ds.work > 0 && (
                            <span className="text-amber-700/90 dark:text-amber-300/90 truncate shrink-0">
                              {formatMinutesCompact(ds.work)} trab.
                            </span>
                          )}
                        </div>

                        {/* Mini barra proporcional do dia */}
                        <div className="mt-2 h-1 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden flex">
                          {ROUTINE_CATEGORIES.map((cat) => {
                            const mins = ds[cat.id] || 0;
                            if (mins <= 0) return null;
                            return (
                              <div
                                key={cat.id}
                                className={`${cat.barClass} h-full`}
                                style={{ width: `${(mins / 1440) * 100}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grade Horária Interativa */}
                <div
                  className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] select-none"
                  onMouseLeave={() => setHoverSlot(null)}
                >
                  {/* Régua de Horas */}
                  <div
                    className="relative border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30"
                    style={{ height: `${gridHeightPx}px` }}
                  >
                    {hoursList.map((hr, idx) => (
                      <div
                        key={hr}
                        className="absolute inset-x-0 flex justify-center pointer-events-none"
                        style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                      >
                        {idx > 0 && (
                          <span className="text-[10px] font-mono font-medium tabular-nums text-slate-400 dark:text-slate-500 -mt-2 px-1">
                            {String(hr).padStart(2, '0')}:00
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Marcador da hora atual na régua */}
                    {nowMinutes >= visibleStartMin && nowMinutes <= visibleEndMin && (
                      <div
                        className="absolute inset-x-1 z-20 -translate-y-1/2 pointer-events-none flex justify-center"
                        style={{
                          top: `${((nowMinutes - visibleStartMin) / 60) * HOUR_HEIGHT}px`,
                        }}
                      >
                        <span className="px-1 py-0.5 rounded bg-sky-600 dark:bg-sky-500 text-white dark:text-slate-950 text-[9px] font-mono font-bold tabular-nums leading-none">
                          {minutesToTimeStr(nowMinutes)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 7 Colunas dos Dias */}
                  {WEEK_DAYS.map((day) => {
                    const isToday = day.key === todayKey;
                    const dayBlocks = routine.days[day.key] || [];
                    const isPaintingThisDay =
                      dragState?.type === 'paint' && dragState.dayKey === day.key;
                    const isMovingTargetThisDay =
                      dragState?.type === 'move' &&
                      dragState.hasMoved &&
                      dragState.targetDayKey === day.key;
                    const isHoveringThisDay =
                      !dragState && hoverSlot && hoverSlot.dayKey === day.key;

                    return (
                      <div
                        key={day.key}
                        ref={(el) => {
                          columnRefs.current[day.key] = el;
                        }}
                        onMouseMove={(e) => handleColumnMouseMove(day.key, e)}
                        onPointerDown={(e) => handleColumnPointerDown(day.key, e)}
                        className={`relative border-r last:border-r-0 border-slate-200/80 dark:border-slate-800 transition-colors ${
                          dragState?.type === 'move' && dragState.hasMoved
                            ? 'cursor-grabbing'
                            : 'cursor-crosshair'
                        } ${
                          isMovingTargetThisDay
                            ? 'bg-sky-500/[0.045] dark:bg-sky-400/[0.05]'
                            : isToday
                              ? 'bg-sky-500/[0.018] dark:bg-sky-400/[0.022]'
                              : ''
                        }`}
                        style={{ height: `${gridHeightPx}px` }}
                      >
                        {/* Linhas da grade */}
                        {hoursList.map((hr, idx) => (
                          <div
                            key={hr}
                            className={`absolute inset-x-0 pointer-events-none ${
                              idx > 0 ? 'border-t border-slate-100 dark:border-slate-800/80' : ''
                            }`}
                            style={{ top: `${idx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                          >
                            <div
                              className="w-full border-t border-dashed border-slate-100/80 dark:border-slate-800/40"
                              style={{ marginTop: `${HOUR_HEIGHT / 2}px` }}
                            />
                          </div>
                        ))}

                        {/* Prévia sutil do slot sob o cursor */}
                        {isHoveringThisDay && (
                          <div
                            className="absolute left-1 right-1 z-5 rounded-md border border-dashed border-slate-300/90 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 px-1.5 flex items-center justify-between pointer-events-none"
                            style={{
                              top: `${((hoverSlot.startMin - visibleStartMin) / 60) * HOUR_HEIGHT + 1}px`,
                              height: `${HOUR_HEIGHT / 2 - 2}px`,
                            }}
                          >
                            <span className="text-[9px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                              {minutesToTimeStr(hoverSlot.startMin)}
                            </span>
                            <span className={`w-1.5 h-1.5 rounded-full ${activeBrushMeta.swatchClass} opacity-75`} />
                          </div>
                        )}

                        {/* Linha da hora atual (hoje) */}
                        {isToday && nowMinutes >= visibleStartMin && nowMinutes <= visibleEndMin && (
                          <div
                            className="absolute inset-x-0 z-20 pointer-events-none flex items-center"
                            style={{
                              top: `${((nowMinutes - visibleStartMin) / 60) * HOUR_HEIGHT}px`,
                            }}
                          >
                            <div className="w-full h-[1.5px] bg-sky-500/85" />
                          </div>
                        )}

                        {/* Blocos existentes */}
                        {dayBlocks.map((block) => {
                          const isBeingMovedAway =
                            dragState?.type === 'move' &&
                            dragState.hasMoved &&
                            dragState.originDayKey === day.key &&
                            dragState.block.id === block.id;
                          const isResizingThis =
                            dragState?.type === 'resize' &&
                            dragState.dayKey === day.key &&
                            dragState.blockId === block.id;
                          const effectiveEnd = isResizingThis ? dragState.endMin : block.endMin;

                          if (effectiveEnd <= visibleStartMin || block.startMin >= visibleEndMin) {
                            return null;
                          }

                          const clippedStart = Math.max(visibleStartMin, block.startMin);
                          const clippedEnd = Math.min(visibleEndMin, effectiveEnd);
                          const topPx = ((clippedStart - visibleStartMin) / 60) * HOUR_HEIGHT;
                          const rawHeightPx = ((clippedEnd - clippedStart) / 60) * HOUR_HEIGHT;
                          const heightPx = Math.max(10, rawHeightPx - 2);
                          const durationMin = effectiveEnd - block.startMin;
                          const meta = getCategoryMeta(block.category);
                          const isCompact = heightPx < 38;

                          return (
                            <div
                              key={block.id}
                              data-routine-block="true"
                              onPointerDown={(e) => handleBlockPointerDown(day.key, block, e)}
                              className={`group/blk absolute left-1 right-1 z-10 rounded-lg border shadow-[0_1px_2px_rgba(15,23,42,0.05)] overflow-hidden transition-shadow ${meta.blockClass} ${
                                block.source === 'taf_app' && block.isPlanned ? 'border-dashed' : ''
                              } ${
                                isBeingMovedAway
                                  ? 'opacity-30 border-dashed'
                                  : 'cursor-grab active:cursor-grabbing hover:shadow-sm'
                              } ${isResizingThis ? 'ring-2 ring-sky-500/60 z-30' : ''}`}
                              style={{
                                top: `${topPx + 1}px`,
                                height: `${heightPx}px`,
                              }}
                              title={`${block.label} (${minutesToTimeStr(block.startMin)}–${minutesToTimeStr(effectiveEnd)})${
                                block.source === 'taf_app'
                                  ? block.isPlanned
                                    ? ' (Planejado · App TAF)'
                                    : ' (Concluído · App TAF)'
                                  : ''
                              }${block.note ? ` · ${block.note}` : ''}`}
                            >
                              {/* Indicador vertical interno elegante */}
                              <span
                                aria-hidden="true"
                                className={`absolute left-1 top-1 bottom-1 w-[3px] rounded-full ${meta.indicatorClass}`}
                              />

                              {/* Ações discretas no hover: Dividir + Excluir */}
                              <div
                                data-no-drag="true"
                                className="opacity-0 group-hover/blk:opacity-100 focus-within:opacity-100 absolute top-1 right-1 flex items-center gap-0.5 transition-opacity z-20"
                              >
                                {durationMin >= 30 && (
                                  <button
                                    type="button"
                                    data-no-drag="true"
                                    aria-label={`Dividir ${block.label}`}
                                    title="Dividir bloco em partes"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSplitModal({ isOpen: true, dayKey: day.key, block });
                                    }}
                                    className="w-4 h-4 rounded bg-white/90 dark:bg-slate-900/90 text-slate-500 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center justify-center cursor-pointer"
                                  >
                                    <Scissors className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  data-no-drag="true"
                                  aria-label={`Remover ${block.label}`}
                                  title="Remover bloco"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBlock(day.key, block.id);
                                  }}
                                  className="w-4 h-4 rounded bg-white/90 dark:bg-slate-900/90 text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              <div
                                className={`h-full pl-3 flex flex-col ${
                                  isCompact ? 'pr-1.5 py-0.5 justify-center' : 'pr-2 py-1 justify-between'
                                }`}
                              >
                                {isCompact ? (
                                  <div className="flex items-center justify-between gap-1.5 text-[10.5px] leading-none">
                                    <span className="font-semibold truncate">{block.label}</span>
                                    <span
                                      className={`ml-auto text-right font-mono text-[9.5px] shrink-0 tabular-nums transition-opacity group-hover/blk:opacity-0 ${meta.subTextClass}`}
                                    >
                                      {minutesToTimeStr(block.startMin)}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="min-w-0 pr-5">
                                      <div className="text-[11px] font-bold leading-tight truncate">
                                        {block.label}
                                      </div>
                                      <div className={`text-[10px] font-mono tabular-nums mt-0.5 ${meta.subTextClass}`}>
                                        {minutesToTimeStr(block.startMin)}–{minutesToTimeStr(effectiveEnd)}
                                        {heightPx >= 52 ? ` · ${formatMinutesCompact(durationMin)}` : ''}
                                      </div>
                                    </div>
                                    {block.note && heightPx >= 64 && (
                                      <p className={`text-[10px] truncate ${meta.subTextClass}`}>
                                        {block.note}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Alça inferior de redimensionamento */}
                              <div
                                data-no-drag="true"
                                onPointerDown={(e) => handleResizePointerDown(day.key, block, e)}
                                title="Arraste para alterar a duração"
                                className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize flex items-center justify-center"
                              >
                                <span className="w-6 h-0.5 rounded-full bg-current opacity-0 group-hover/blk:opacity-40 transition-opacity" />
                              </div>
                            </div>
                          );
                        })}

                        {/* Fantasma ao vivo de drag-to-paint */}
                        {isPaintingThisDay && (() => {
                          const meta = getCategoryMeta(dragState.category);
                          const topPx = ((dragState.startMin - visibleStartMin) / 60) * HOUR_HEIGHT;
                          const heightPx = Math.max(
                            14,
                            ((dragState.endMin - dragState.startMin) / 60) * HOUR_HEIGHT - 2
                          );
                          return (
                            <div
                              className={`absolute left-1 right-1 z-30 rounded-lg border-2 border-dashed pl-3 pr-2 py-1 pointer-events-none shadow-sm ${meta.blockClass}`}
                              style={{ top: `${topPx + 1}px`, height: `${heightPx}px` }}
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute left-1 top-1 bottom-1 w-[3px] rounded-full ${meta.indicatorClass}`}
                              />
                              <div className="text-[11px] font-bold truncate">
                                {meta.defaultTitle}
                              </div>
                              <div className="text-[10px] font-mono tabular-nums">
                                {minutesToTimeStr(dragState.startMin)}–{minutesToTimeStr(dragState.endMin)} ·{' '}
                                {formatMinutesCompact(dragState.endMin - dragState.startMin)}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Fantasma ao vivo de drag-to-move */}
                        {isMovingTargetThisDay && (() => {
                          const meta = getCategoryMeta(dragState.block.category);
                          const topPx = ((dragState.startMin - visibleStartMin) / 60) * HOUR_HEIGHT;
                          const heightPx = Math.max(
                            14,
                            ((dragState.endMin - dragState.startMin) / 60) * HOUR_HEIGHT - 2
                          );
                          const hasConflict = Boolean(dragState.hasConflict);
                          return (
                            <div
                              className={`absolute left-1 right-1 z-30 rounded-lg border-2 pl-3 pr-2 py-1 pointer-events-none shadow-lg ${
                                hasConflict
                                  ? 'border-red-500 bg-red-50/95 dark:bg-red-950/80 text-red-900 dark:text-red-100'
                                  : `border-sky-500 dark:border-sky-400 ${meta.blockClass}`
                              }`}
                              style={{ top: `${topPx + 1}px`, height: `${heightPx}px` }}
                            >
                              <span
                                aria-hidden="true"
                                className={`absolute left-1 top-1 bottom-1 w-[3px] rounded-full ${
                                  hasConflict ? 'bg-red-500' : meta.indicatorClass
                                }`}
                              />
                              <div className="text-[11px] font-bold truncate">
                                {hasConflict ? 'Horário ocupado' : dragState.block.label}
                              </div>
                              <div className="text-[10px] font-mono tabular-nums">
                                {minutesToTimeStr(dragState.startMin)}–{minutesToTimeStr(dragState.endMin)}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rodapé discreto com guia rápido de gestos */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
              <span>
                <strong className="font-semibold text-slate-700 dark:text-slate-200">Arraste blocos</strong> livremente pelo dia ·{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-200">Tesoura</strong> no bloco para dividir ·{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-200">Arraste espaços vazios</strong> para criar
              </span>
              <span className="font-mono tabular-nums text-slate-400">Encaixe de 15 min</span>
            </div>
          </section>
        ) : (
          /* VISÃO EM LISTA POR DIA */
          <div className="space-y-3">
            {WEEK_DAYS.map((day) => {
              const isToday = day.key === todayKey;
              const dayBlocks = routine.days[day.key] || [];
              const ds = byDay[day.key];

              return (
                <section
                  key={day.key}
                  className={`rounded-xl bg-white dark:bg-slate-900 border overflow-hidden ${
                    isToday
                      ? 'border-sky-500/50 dark:border-sky-400/50'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                        {day.fullLabel}
                      </h3>
                      {isToday && (
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                          · Hoje
                        </span>
                      )}
                      <span className="text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                      <span className="text-xs font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-300">
                        {formatMinutesCompact(ds.study)} estudo
                      </span>
                      {ds.work > 0 && (
                        <>
                          <span className="text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                          <span className="text-xs font-mono tabular-nums text-amber-700 dark:text-amber-300">
                            {formatMinutesCompact(ds.work)} trabalho
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {dayBlocks.filter((b) => b.category === 'study').length >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleMergeDayStudy(day.key)}
                          className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Combine className="w-3 h-3" />
                          <span>Unir em 1</span>
                        </button>
                      )}
                      {weeklyLessonPlan.byDay[day.key]?.totalMinutes > 0 &&
                        Math.abs(ds.study - weeklyLessonPlan.byDay[day.key].totalMinutes) >= 10 && (
                          <button
                            type="button"
                            onClick={() => handleSyncSingleDayLessons(day.key)}
                            className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/15 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>
                              Aulas ({formatMinutesCompact(weeklyLessonPlan.byDay[day.key].totalMinutes)})
                            </span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() => setCopyModal({ isOpen: true, sourceDayKey: day.key })}
                        className="h-7 px-2.5 rounded-md text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Replicar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBlockModal({
                            isOpen: true,
                            mode: 'create',
                            dayKey: day.key,
                            block: {
                              category: activeBrush,
                              label: activeBrushMeta.defaultTitle,
                              startMin: 480,
                              endMin: 600,
                              note: '',
                            },
                          })
                        }
                        className="h-7 px-2.5 rounded-md text-[11px] font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  {/* Barra Horizontal 24h */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="relative h-5 w-full rounded-md bg-slate-100 dark:bg-slate-850 overflow-hidden">
                      {dayBlocks.map((block) => {
                        const meta = getCategoryMeta(block.category);
                        const leftPct = (block.startMin / 1440) * 100;
                        const widthPct = Math.max(1.2, ((block.endMin - block.startMin) / 1440) * 100);
                        return (
                          <button
                            key={block.id}
                            type="button"
                            onClick={() =>
                              setBlockModal({ isOpen: true, mode: 'edit', dayKey: day.key, block })
                            }
                            className={`absolute top-0 bottom-0 ${meta.barClass} opacity-90 hover:opacity-100 transition-opacity cursor-pointer border-r border-white/40 dark:border-slate-950/40`}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            title={`${block.label} (${minutesToTimeStr(block.startMin)}–${minutesToTimeStr(block.endMin)})`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400 mt-1">
                      <span>00h</span>
                      <span>06h</span>
                      <span>12h</span>
                      <span>18h</span>
                      <span>24h</span>
                    </div>
                  </div>

                  {/* Lista de Blocos */}
                  <div className="px-4 pb-3">
                    {dayBlocks.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 py-1.5">
                        Nenhum horário cadastrado.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dayBlocks.map((block) => {
                          const meta = getCategoryMeta(block.category);
                          const Icon = CATEGORY_ICONS[block.category] || Sparkles;
                          return (
                            <div key={block.id} className="py-2 flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setBlockModal({ isOpen: true, mode: 'edit', dayKey: day.key, block })
                                }
                                className="flex-1 min-w-0 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-850 -mx-2 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <span className="font-mono text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300 w-24 shrink-0">
                                  {minutesToTimeStr(block.startMin)}–{minutesToTimeStr(block.endMin)}
                                </span>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.swatchClass}`} aria-hidden="true" />
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.accentTextClass}`} />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                                    {block.label}
                                  </span>
                                  {block.note && (
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                                      {block.note}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-mono font-semibold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                  {formatMinutesCompact(block.endMin - block.startMin)}
                                </span>
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                {block.endMin - block.startMin >= 30 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSplitModal({ isOpen: true, dayKey: day.key, block })
                                    }
                                    title="Dividir bloco"
                                    aria-label={`Dividir ${block.label}`}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                                  >
                                    <Scissors className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlock(day.key, block.id)}
                                  aria-label={`Excluir ${block.label}`}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* PAINEL LATERAL DE INTELIGÊNCIA & BALANÇO SEMANAL (STICKY EM DESKTOP) */}
        <aside className="xl:sticky xl:top-4 space-y-4">
          {/* Card 0: Aulas do Cronograma (Sincronização Automática + Dividir / Unir) */}
          {weeklyLessonPlan.weeklyTotalMinutes > 0 && (() => {
            const todayPlan = weeklyLessonPlan.byDay[todayKey];
            const todayStudyBlocks = todayBlocks.filter((b) => b.category === 'study');
            return (
              <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CalendarClock className="w-4 h-4 text-sky-500 shrink-0" />
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
                      Aulas do cronograma
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-300 shrink-0">
                    {formatMinutesCompact(weeklyLessonPlan.weeklyTotalMinutes)}/sem
                  </span>
                </div>

                {todayPlan && todayPlan.totalMinutes > 0 && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Hoje ({todayMeta.short})
                      </span>
                      <span className="font-mono font-bold tabular-nums text-sky-700 dark:text-sky-300">
                        {formatMinutesCompact(todayPlan.totalMinutes)} · {todayPlan.totalLessonCount}{' '}
                        {todayPlan.totalLessonCount === 1 ? 'aula' : 'aulas'}
                      </span>
                    </div>
                    {todayPlan.summaryNote && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {todayPlan.summaryNote}
                      </p>
                    )}
                    <div className="pt-1 flex items-center gap-1.5">
                      {todayStudyBlocks.length === 1 &&
                        todayStudyBlocks[0].endMin - todayStudyBlocks[0].startMin >= 30 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSplitModal({
                                isOpen: true,
                                dayKey: todayKey,
                                block: todayStudyBlocks[0],
                              })
                            }
                            className="h-6 px-2 rounded-md text-[10.5px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500/60 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Scissors className="w-3 h-3" />
                            <span>Dividir hoje</span>
                          </button>
                        )}
                      {todayStudyBlocks.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleMergeDayStudy(todayKey)}
                          className="h-6 px-2 rounded-md text-[10.5px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500/60 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Combine className="w-3 h-3" />
                          <span>Unir em 1 bloco</span>
                        </button>
                      )}
                      {todayStudyBlocks.length === 0 && (
                        <button
                          type="button"
                          onClick={() => handleSyncSingleDayLessons(todayKey)}
                          className="h-6 px-2 rounded-md text-[10.5px] font-semibold bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Colocar hoje</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Modo de distribuição na semana */}
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Organizar aulas na semana:
                    </span>
                    <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      {[
                        { id: 'blocks', label: 'Por blocos' },
                        { id: 'by_subject', label: 'Matérias' },
                      ].map((opt) => {
                        const active = routine.preferredLayout === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleApplyWeekLessonsLayout(opt.id)}
                            className={`h-7 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                              active
                                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Configuração: Quantos blocos quiser por dia */}
                  {routine.preferredLayout === 'blocks' && (
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Blocos por dia
                        </span>
                        <span className="text-[11px] font-mono font-bold tabular-nums text-sky-700 dark:text-sky-300">
                          {routine.blocksPerDay}{' '}
                          {routine.blocksPerDay === 1 ? 'bloco' : 'blocos'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="grid grid-cols-4 gap-1 flex-1">
                          {[1, 2, 3, 4].map((count) => {
                            const selected = routine.blocksPerDay === count;
                            return (
                              <button
                                key={count}
                                type="button"
                                onClick={() =>
                                  handleApplyWeekLessonsLayout('blocks', { blocksPerDay: count })
                                }
                                className={`h-6.5 rounded-md text-[11px] font-mono font-semibold tabular-nums transition-colors cursor-pointer ${
                                  selected
                                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500/50 hover:text-sky-700 dark:hover:text-sky-300'
                                }`}
                              >
                                {count}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="number"
                          aria-label="Quantidade personalizada de blocos por dia"
                          min={1}
                          max={8}
                          value={routine.blocksPerDay}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              Math.min(8, Math.round(Number(e.target.value) || 1))
                            );
                            handleApplyWeekLessonsLayout('blocks', {
                              blocksPerDay: val,
                              silent: true,
                            });
                          }}
                          className="w-12 h-6.5 px-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold tabular-nums text-center text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40 shrink-0"
                        />
                      </div>

                      {/* Intervalo entre blocos quando dividido em 2+ blocos */}
                      {routine.blocksPerDay > 1 && (
                        <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-300">
                              Intervalo entre blocos
                            </span>
                            <span className="text-[10.5px] font-mono font-bold tabular-nums text-sky-700 dark:text-sky-300">
                              {routine.blockBreakMin === 0
                                ? 'Sem pausa'
                                : `${routine.blockBreakMin} min`}
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1">
                            {[0, 10, 15, 30, 60].map((mins) => {
                              const selected = routine.blockBreakMin === mins;
                              return (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() =>
                                    handleApplyWeekLessonsLayout('blocks', { breakMin: mins })
                                  }
                                  className={`h-6 rounded-md text-[10px] font-mono font-semibold tabular-nums transition-colors cursor-pointer ${
                                    selected
                                      ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500/50 hover:text-sky-700 dark:hover:text-sky-300'
                                  }`}
                                >
                                  {mins === 0 ? 'Sem' : `${mins}m`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Configuração: Intervalo entre matérias */}
                  {routine.preferredLayout === 'by_subject' && (
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          Intervalo entre matérias
                        </span>
                        <span className="text-[11px] font-mono font-bold tabular-nums text-sky-700 dark:text-sky-300">
                          {routine.subjectBreakMin === 0
                            ? 'Sem pausa'
                            : `${routine.subjectBreakMin} min`}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1">
                        {[0, 10, 15, 30, 60].map((mins) => {
                          const selected = routine.subjectBreakMin === mins;
                          return (
                            <button
                              key={mins}
                              type="button"
                              onClick={() =>
                                handleApplyWeekLessonsLayout('by_subject', { breakMin: mins })
                              }
                              className={`h-6.5 rounded-md text-[10.5px] font-mono font-semibold tabular-nums transition-colors cursor-pointer ${
                                selected
                                  ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500/50 hover:text-sky-700 dark:hover:text-sky-300'
                              }`}
                            >
                              {mins === 0 ? 'Sem' : `${mins}m`}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <label
                          htmlFor="routine-break-input"
                          className="text-[10.5px] text-slate-500 dark:text-slate-400"
                        >
                          Personalizado:
                        </label>
                        <div className="inline-flex items-center gap-1">
                          <input
                            id="routine-break-input"
                            type="number"
                            min={0}
                            max={120}
                            step={5}
                            value={routine.subjectBreakMin}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                Math.min(120, Math.round(Number(e.target.value) || 0))
                              );
                              handleApplyWeekLessonsLayout('by_subject', {
                                breakMin: val,
                                silent: true,
                              });
                            }}
                            className="w-14 h-6 px-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold tabular-nums text-right text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                          />
                          <span className="text-[10.5px] font-mono text-slate-400">min</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Toggle de sincronização automática */}
                <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer select-none">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Colocar aulas automaticamente
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={routine.autoSyncLessons}
                    onClick={handleToggleAutoSync}
                    className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                      routine.autoSyncLessons
                        ? 'bg-sky-600 dark:bg-sky-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white shadow-xs transition-transform ${
                        routine.autoSyncLessons ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              </section>
            );
          })()}

          {/* Card 0.5: Treinos TAF (App Android) */}
          {(() => {
            const tafBlocks = WEEK_DAYS.flatMap(({ key }) =>
              (routine.days[key] || []).filter((b) => b.source === 'taf_app')
            );
            const tafTotalMin = tafBlocks.reduce(
              (acc, b) => acc + Math.max(0, (Number(b.endMin) || 0) - (Number(b.startMin) || 0)),
              0
            );
            const tafDoneCount = tafBlocks.filter((b) => !b.isPlanned).length;
            const tafPlannedCount = tafBlocks.filter((b) => b.isPlanned).length;

            const handleManualTafSync = async () => {
              await loadFromCloud();
              const latest = useStore.getState();
              const latestBlocks = latest.tafAppData?.routineBlocks || [];
              setLifeRoutine((prev) => {
                const current = normalizeRoutine(prev);
                const res = mergeTafAppRoutineBlocks(current.days, latestBlocks, '');
                if (!res.changed) return current;
                return {
                  ...current,
                  days: res.nextDays,
                  syncedSignatures: {
                    ...current.syncedSignatures,
                    _tafApp: res.nextSignature,
                  },
                };
              });
              if (latestBlocks.length > 0) {
                toast.success(`Treinos TAF sincronizados (${latestBlocks.length} blocos).`);
              } else {
                toast.info('Nenhum treino TAF na nuvem ainda. Sincronize no App Android.');
              }
            };

            return (
              <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Dumbbell className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
                      Treinos TAF (App)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                    {tafTotalMin > 0 ? `${formatMinutesCompact(tafTotalMin)}/sem` : 'Pronto'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tafBlocks.length > 0
                    ? `${tafDoneCount} concluído(s) · ${tafPlannedCount} planejado(s) nesta semana`
                    : 'Conecte sua conta no App Android TAF para ver seus treinos aqui.'}
                </p>

                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleManualTafSync}
                  className="w-full h-7.5 px-2.5 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar treinos'}</span>
                </button>
              </section>
            );
          })()}

          {/* Card 1: Balanço 168h + Gráfico de Anel */}
          <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Balanço da semana
              </h3>
              <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                168h totais
              </span>
            </div>

            <WeeklyBalanceRing totals={totals} />

            {/* Lista Tabular de Categorias */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {ROUTINE_CATEGORIES.map((cat) => {
                const mins = totals[cat.id] || 0;
                const pct = Math.round((mins / WEEK_TOTAL_MIN) * 100);
                return (
                  <div key={cat.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cat.swatchClass}`} aria-hidden="true" />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatMinutesCompact(mins)}
                      </span>
                      <span className="text-[10px] text-slate-400 w-7 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">Tempo livre</span>
                <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {formatMinutesCompact(totals.free)}
                </span>
              </div>
            </div>

            {canSyncGoal && (
              <button
                type="button"
                onClick={handleSyncGoal}
                className="w-full h-9 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/18 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Usar {formatMinutesCompact(roundedAvgStudy)}/dia como meta
                </span>
              </button>
            )}
          </section>

          {/* Card 2: Foco de Hoje (Bloco Atual ou Próximo) */}
          <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Hoje · {todayMeta.label}
              </h3>
              <span className="text-[11px] font-mono tabular-nums text-sky-600 dark:text-sky-400 font-semibold">
                {formatMinutesCompact(byDay[todayKey]?.study || 0)} est.
              </span>
            </div>

            {todayFocus.block ? (() => {
              const meta = getCategoryMeta(todayFocus.block.category);
              return (
                <button
                  type="button"
                  onClick={() =>
                    setBlockModal({
                      isOpen: true,
                      mode: 'edit',
                      dayKey: todayKey,
                      block: todayFocus.block,
                    })
                  }
                  className={`w-full text-left relative rounded-lg border pl-3.5 pr-3 py-2.5 transition-colors cursor-pointer ${meta.blockClass}`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute left-1.5 top-2 bottom-2 w-[3px] rounded-full ${meta.indicatorClass}`}
                  />
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                    {todayFocus.status === 'active'
                      ? `Em andamento · restam ${formatMinutesCompact(todayFocus.remainingMin)}`
                      : `Próximo · em ${formatMinutesCompact(todayFocus.startsInMin)}`}
                  </div>
                  <div className="text-xs font-bold mt-0.5 truncate">
                    {todayFocus.block.label}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums opacity-80 mt-0.5">
                    {minutesToTimeStr(todayFocus.block.startMin)}–{minutesToTimeStr(todayFocus.block.endMin)}
                  </div>
                </button>
              );
            })() : (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {todayBlocks.length === 0
                  ? 'Nenhum bloco planejado para hoje. Arraste na coluna de hoje para começar.'
                  : 'Todos os blocos programados para hoje já passaram.'}
              </p>
            )}

            {/* Modelos rápidos quando a semana está vazia */}
            {isWeekEmpty && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Comece com um modelo pronto:
                </p>
                <div className="space-y-1.5">
                  {ROUTINE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 hover:border-sky-500/50 hover:bg-sky-500/[0.05] text-left flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-sky-700 dark:group-hover:text-sky-300 truncate">
                        {preset.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Modais */}
      <RoutineBlockModal
        isOpen={blockModal.isOpen}
        mode={blockModal.mode}
        initialDayKey={blockModal.dayKey}
        initialBlock={blockModal.block}
        routineDays={routine.days}
        onClose={() => setBlockModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
        onOpenSplit={(dayKey, block) => {
          setBlockModal((prev) => ({ ...prev, isOpen: false }));
          setSplitModal({ isOpen: true, dayKey, block });
        }}
      />

      <SplitBlockModal
        isOpen={splitModal.isOpen}
        dayKey={splitModal.dayKey}
        block={splitModal.block}
        dayPlan={weeklyLessonPlan.byDay[splitModal.dayKey]}
        onClose={() => setSplitModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirmSplit={handleConfirmSplit}
      />

      <CopyDayModal
        isOpen={copyModal.isOpen}
        sourceDayKey={copyModal.sourceDayKey}
        routineDays={routine.days}
        onClose={() => setCopyModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleCopyDay}
      />
    </div>
  );
}
