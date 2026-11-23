import React, { useState } from 'react';
import {
  X,
  Trash2,
  Copy,
  BookOpen,
  Briefcase,
  Dumbbell,
  Sparkles,
  Moon,
  Clock,
  AlertTriangle,
  Check,
  Scissors,
  Layers
} from 'lucide-react';
import {
  WEEK_DAYS,
  ROUTINE_CATEGORIES,
  getCategoryMeta,
  minutesToInputTime,
  minutesToTimeStr,
  parseTimeStrToMinutes,
  formatMinutesCompact,
  findOverlappingBlock
} from './routineUtils';
import { splitDurationEvenly } from './scheduleSync';

const CATEGORY_ICONS = {
  study: BookOpen,
  work: Briefcase,
  training: Dumbbell,
  other: Sparkles,
  rest: Moon,
};

const QUICK_DURATIONS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '1h30', mins: 90 },
  { label: '2h', mins: 120 },
  { label: '4h', mins: 240 },
  { label: '8h', mins: 480 },
];

export function RoutineBlockModal(props) {
  if (!props.isOpen) return null;
  const formKey = `${props.mode}-${props.initialDayKey || 'seg'}-${props.initialBlock?.id || 'new'}-${props.initialBlock?.startMin ?? 480}-${props.initialBlock?.endMin ?? 600}`;
  return <RoutineBlockModalContent key={formKey} {...props} />;
}

function RoutineBlockModalContent({
  mode, // 'create' | 'edit'
  initialDayKey,
  initialBlock,
  routineDays,
  onClose,
  onSave,
  onDelete,
  onOpenSplit,
}) {
  const initialCat = initialBlock?.category || 'study';
  const initialMeta = getCategoryMeta(initialCat);
  const initialEndVal = initialBlock?.endMin ?? 600;

  const [category, setCategory] = useState(initialCat);
  const [label, setLabel] = useState(initialBlock?.label || initialMeta.defaultTitle);
  const [startStr, setStartStr] = useState(minutesToInputTime(initialBlock?.startMin ?? 480));
  const [endStr, setEndStr] = useState(
    initialEndVal >= 1440 ? '23:59' : minutesToInputTime(initialEndVal)
  );
  const [note, setNote] = useState(initialBlock?.note || '');
  const [selectedDays, setSelectedDays] = useState([initialDayKey || 'seg']);
  const [errorMsg, setErrorMsg] = useState('');

  const catMeta = getCategoryMeta(category);
  const startMin = parseTimeStrToMinutes(startStr);
  let endMin = parseTimeStrToMinutes(endStr);
  if (endStr === '23:59') endMin = 1440;
  const durationMin = Math.max(0, endMin - startMin);

  const toggleDay = (dayKey) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayKey)) {
        return prev.length > 1 ? prev.filter((d) => d !== dayKey) : prev;
      }
      return [...prev, dayKey];
    });
  };

  const handleCategoryChange = (newCat) => {
    const prevMeta = getCategoryMeta(category);
    const nextMeta = getCategoryMeta(newCat);
    setCategory(newCat);
    if (!label.trim() || label.trim() === prevMeta.defaultTitle || prevMeta.suggestions.includes(label.trim())) {
      setLabel(nextMeta.defaultTitle);
    }
  };

  const applyQuickDuration = (mins) => {
    const nextEnd = Math.min(1440, startMin + mins);
    setEndStr(nextEnd >= 1440 ? '23:59' : minutesToInputTime(nextEnd));
    setErrorMsg('');
  };

  const overlapDays = selectedDays.filter((dKey) => {
    const ignoreId = mode === 'edit' && dKey === initialDayKey ? initialBlock?.id : null;
    return Boolean(findOverlappingBlock(routineDays?.[dKey] || [], startMin, endMin, ignoreId));
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (endMin <= startMin) {
      setErrorMsg('O horário final deve ser posterior ao horário inicial.');
      return;
    }
    if (endMin - startMin < 15) {
      setErrorMsg('A duração mínima de um bloco é de 15 minutos.');
      return;
    }
    if (selectedDays.length === 0) {
      setErrorMsg('Selecione pelo menos um dia da semana.');
      return;
    }

    onSave({
      id: mode === 'edit' ? initialBlock?.id : null,
      originalDayKey: initialDayKey,
      targetDays: selectedDays,
      category,
      label: label.trim() || catMeta.defaultTitle,
      startMin,
      endMin,
      note: note.trim(),
      ...(initialBlock?.source ? { source: initialBlock.source } : {}),
      ...(initialBlock?.subjectId ? { subjectId: initialBlock.subjectId } : {}),
      ...(initialBlock?.partIndex ? { partIndex: initialBlock.partIndex, partTotal: initialBlock.partTotal } : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              {mode === 'edit' ? 'Editar bloco da rotina' : 'Novo bloco na rotina'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defina atividade, horário e os dias em que ela se repete.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Tipo / Categoria */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tipo de atividade
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROUTINE_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] || Sparkles;
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`h-9 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                      active
                        ? cat.activeBtnClass
                        : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nome da atividade + sugestões rápidas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nome do bloco
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Ex: ${catMeta.suggestions[0]}`}
              maxLength={60}
              className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {catMeta.suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setLabel(sug)}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Horários + atalhos de duração */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Início
                </label>
                <input
                  type="time"
                  value={startStr}
                  onChange={(e) => {
                    setStartStr(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Término
                </label>
                <input
                  type="time"
                  value={endStr}
                  onChange={(e) => {
                    setEndStr(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Duração rápida:</span>
                {QUICK_DURATIONS.map((qd) => (
                  <button
                    key={qd.label}
                    type="button"
                    onClick={() => applyQuickDuration(qd.mins)}
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 hover:bg-sky-500/15 hover:text-sky-700 dark:bg-slate-800 dark:hover:bg-sky-500/20 dark:hover:text-sky-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {qd.label}
                  </button>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold tabular-nums text-slate-700 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {durationMin > 0 ? formatMinutesCompact(durationMin) : '—'}
              </span>
            </div>
          </div>

          {/* Dias da semana */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {mode === 'edit' ? 'Aplicar também em outros dias' : 'Dias da semana'}
              </label>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedDays(['seg', 'ter', 'qua', 'qui', 'sex'])}
                  className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Seg–Sex
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedDays(['sab', 'dom'])}
                  className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Sáb–Dom
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => setSelectedDays(WEEK_DAYS.map((d) => d.key))}
                  className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Todos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`h-9 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 border-sky-600 text-white dark:bg-sky-500 dark:border-sky-500 dark:text-slate-950'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observação <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Priorizar Direito Penal ou simulado cronometrado"
              maxLength={120}
              className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          {/* Aviso de sobreposição */}
          {overlapDays.length > 0 && (
            <div className="px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Este horário sobrepõe um bloco já existente em{' '}
                <strong>
                  {overlapDays
                    .map((k) => WEEK_DAYS.find((d) => d.key === k)?.short)
                    .filter(Boolean)
                    .join(', ')}
                </strong>
                . Ao salvar, o bloco conflitante será substituído ou ajustado automaticamente.
              </span>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{errorMsg}</p>
          )}

          {/* Rodapé de ações */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            {mode === 'edit' ? (
              <div className="flex items-center gap-1">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(initialDayKey, initialBlock?.id)}
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
                {onOpenSplit && initialBlock && (initialBlock.endMin - initialBlock.startMin) >= 30 && (
                  <button
                    type="button"
                    onClick={() => onOpenSplit(initialDayKey, initialBlock)}
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Dividir</span>
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{mode === 'edit' ? 'Salvar alterações' : 'Adicionar bloco'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CopyDayModal(props) {
  if (!props.isOpen) return null;
  return <CopyDayModalContent key={props.sourceDayKey || 'seg'} {...props} />;
}

function CopyDayModalContent({ sourceDayKey, routineDays, onClose, onConfirm }) {
  const initialSource = sourceDayKey || 'seg';
  const [fromDay, setFromDay] = useState(initialSource);
  const [targets, setTargets] = useState(() =>
    WEEK_DAYS.filter((d) => d.key !== initialSource && d.key !== 'sab' && d.key !== 'dom').map(
      (d) => d.key
    )
  );

  const sourceCount = (routineDays?.[fromDay] || []).length;

  const toggleTarget = (key) => {
    if (key === fromDay) return;
    setTargets((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-sky-500" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Replicar rotina de um dia
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Copiar blocos de:
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS.map((day) => {
                const active = fromDay === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => {
                      setFromDay(day.key);
                      setTargets((prev) => prev.filter((k) => k !== day.key));
                    }}
                    className={`h-9 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {sourceCount === 0
                ? 'Este dia não possui blocos cadastrados ainda.'
                : `${sourceCount} ${sourceCount === 1 ? 'bloco será copiado' : 'blocos serão copiados'}.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Colar nos dias:
              </label>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() =>
                    setTargets(['seg', 'ter', 'qua', 'qui', 'sex'].filter((k) => k !== fromDay))
                  }
                  className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Dias úteis
                </button>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setTargets(WEEK_DAYS.map((d) => d.key).filter((k) => k !== fromDay))
                  }
                  className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Todos
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS.map((day) => {
                const isSource = day.key === fromDay;
                const isSelected = targets.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={isSource}
                    onClick={() => toggleTarget(day.key)}
                    className={`h-9 rounded-lg border text-xs font-bold transition-colors ${
                      isSource
                        ? 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                        : isSelected
                          ? 'bg-sky-600 border-sky-600 text-white dark:bg-sky-500 dark:border-sky-500 dark:text-slate-950 cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={targets.length === 0}
              onClick={() => onConfirm(fromDay, targets)}
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 cursor-pointer"
            >
              Replicar rotina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SplitBlockModal(props) {
  if (!props.isOpen || !props.block) return null;
  const splitKey = `${props.dayKey}-${props.block.id}-${props.block.startMin}-${props.block.endMin}`;
  return <SplitBlockModalContent key={splitKey} {...props} />;
}

function SplitBlockModalContent({ dayKey, block, dayPlan, onClose, onConfirmSplit }) {
  const totalMin = Math.max(30, (block.endMin || 0) - (block.startMin || 0));
  const minPart = 15;
  const maxFirst = Math.max(minPart, totalMin - minPart);
  const defaultFirst = Math.max(
    minPart,
    Math.min(maxFirst, Math.round(totalMin / 2 / 5) * 5)
  );
  const [customFirstMin, setCustomFirstMin] = useState(defaultFirst);

  const dayMeta = WEEK_DAYS.find((d) => d.key === dayKey);
  const parts2 = splitDurationEvenly(totalMin, 2);
  const parts3 = totalMin >= 45 ? splitDurationEvenly(totalMin, 3) : null;
  const canSplitBySubject =
    block.category === 'study' &&
    Array.isArray(dayPlan?.items) &&
    dayPlan.items.length >= 2;
  const customSecondMin = totalMin - customFirstMin;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Scissors className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                Dividir bloco
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono tabular-nums">
                {dayMeta?.label} · {block.label} ({minutesToTimeStr(block.startMin)}–{minutesToTimeStr(block.endMin)} · {formatMinutesCompact(totalMin)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Opções rápidas */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Divisão rápida
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onConfirmSplit(dayKey, block.id, { type: 'parts', count: 2 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-sky-500/60 hover:bg-sky-500/[0.06] text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300">
                    Dividir em 2 blocos
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dois blocos livres para encaixar em turnos diferentes
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-sky-700 dark:text-sky-300 shrink-0">
                  {parts2.map((m) => formatMinutesCompact(m)).join(' + ')}
                </span>
              </button>

              {parts3 && (
                <button
                  type="button"
                  onClick={() => onConfirmSplit(dayKey, block.id, { type: 'parts', count: 3 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:border-sky-500/60 hover:bg-sky-500/[0.06] text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300">
                      Dividir em 3 blocos
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Blocos menores distribuídos ao longo do dia
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-sky-700 dark:text-sky-300 shrink-0">
                    {parts3.map((m) => formatMinutesCompact(m)).join(' + ')}
                  </span>
                </button>
              )}

              {canSplitBySubject && (
                <button
                  type="button"
                  onClick={() =>
                    onConfirmSplit(dayKey, block.id, {
                      type: 'by_subject',
                      items: dayPlan.items,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800/70 bg-sky-50/60 dark:bg-sky-950/35 hover:border-sky-500/70 hover:bg-sky-500/[0.1] text-left space-y-1.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 dark:text-sky-200">
                      <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      Separar por matéria do cronograma ({dayPlan.items.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dayPlan.items.map((item, idx) => (
                      <span
                        key={`${item.subjectId}-${idx}`}
                        className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-white/85 dark:bg-slate-900/75 border border-sky-200/80 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 font-mono tabular-nums"
                      >
                        {item.subjectName} · {formatMinutesCompact(item.minutes)}
                      </span>
                    ))}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Corte personalizado */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Corte personalizado
              </label>
              <span className="font-mono text-xs font-bold tabular-nums text-slate-800 dark:text-slate-200">
                {formatMinutesCompact(customFirstMin)} + {formatMinutesCompact(customSecondMin)}
              </span>
            </div>

            <input
              type="range"
              min={minPart}
              max={maxFirst}
              step={5}
              value={customFirstMin}
              onChange={(e) => setCustomFirstMin(Number(e.target.value))}
              className="w-full accent-sky-600 dark:accent-sky-400 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>Parte 1: {formatMinutesCompact(customFirstMin)}</span>
              <span>Parte 2: {formatMinutesCompact(customSecondMin)}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  onConfirmSplit(dayKey, block.id, {
                    type: 'custom',
                    firstMin: customFirstMin,
                  })
                }
                className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Aplicar corte</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
