import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Target,
  AlertTriangle,
  Loader2,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { formatSecondsToFriendly } from '../../lib/durationHelpers';
import {
  WEEKDAY_ORDER,
  WEEKDAY_LABELS,
  getScheduledDaysForSubject
} from '../../lib/calendarBulkOps';

const DIAS_SEMANA_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

function formatMinutesToFriendly(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`;
  if (hours > 0) return `${hours}h`;
  return `${remainingMins}m`;
}

function getWeekdayPluralAgreement(dayOfWeek) {
  const map = {
    0: { nextPrep: 'nos próximos', allPrep: 'em todos os', plural: 'Domingos' },
    1: { nextPrep: 'nas próximas', allPrep: 'em todas as', plural: 'Segundas-feiras' },
    2: { nextPrep: 'nas próximas', allPrep: 'em todas as', plural: 'Terças-feiras' },
    3: { nextPrep: 'nas próximas', allPrep: 'em todas as', plural: 'Quartas-feiras' },
    4: { nextPrep: 'nas próximas', allPrep: 'em todas as', plural: 'Quintas-feiras' },
    5: { nextPrep: 'nas próximas', allPrep: 'em todas as', plural: 'Sextas-feiras' },
    6: { nextPrep: 'nos próximos', allPrep: 'em todos os', plural: 'Sábados' }
  };
  return map[dayOfWeek] || { nextPrep: 'nos próximos', allPrep: 'em todos os', plural: 'dias' };
}

export function DayManagerModal({
  managingDay,
  onClose,
  canGoPrevDay,
  onNavigateDay,
  autoSaveOnNavigate,
  setAutoSaveOnNavigate,
  isDayDirty,
  daySlots,
  setDaySlots,
  daySlotCounts,
  setDaySlotCounts,
  subjects,
  subjectTimeGoal,
  initialSubjectQueues,
  managingDayPreviewLessons,
  saveMode,
  setSaveMode,
  onSave,
  onResetToDefault
}) {
  if (!managingDay) return null;

  const dayAgr = getWeekdayPluralAgreement(managingDay.dayOfWeek);
  const allSubjectIds = Object.keys(subjects || {});
  const usedSubjectSet = new Set(daySlots);
  const availableSubjectIds = allSubjectIds.filter((id) => !usedSubjectSet.has(id));
  const nextAvailableSubId =
    availableSubjectIds.find((id) => (initialSubjectQueues?.[id]?.length || 0) > 0) ||
    availableSubjectIds[0] ||
    '';

  const totalPreviewAccelSec = (managingDayPreviewLessons || []).reduce((dayAcc, list) => {
    const blockSec = (list || []).reduce((bAcc, les) => bAcc + Math.round((Number(les?.accelMins) || 0) * 60), 0);
    return dayAcc + blockSec;
  }, 0);

  const totalPreviewLessons = (managingDayPreviewLessons || []).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 w-full max-w-4xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] relative flex flex-col gap-3.5 max-h-[94vh] overflow-y-auto custom-scrollbar"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar gerenciador de dia"
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho de Navegação Diária */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 pr-8">
            <button
              type="button"
              onClick={() => onNavigateDay(-1)}
              disabled={!canGoPrevDay}
              title="Dia anterior (←)"
              aria-label="Dia anterior"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
              <CalendarIcon className="w-4 h-4 text-sky-500 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {managingDay.dateKey} · {DIAS_SEMANA_FULL[managingDay.dateObj.getDay()]}
              </h3>
              {totalPreviewAccelSec > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  {formatSecondsToFriendly(totalPreviewAccelSec)}
                  <span className="text-slate-400 dark:text-slate-500 font-sans font-normal">
                    ({totalPreviewLessons} {totalPreviewLessons === 1 ? 'aula' : 'aulas'})
                  </span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateDay(1)}
              title="Próximo dia (→)"
              aria-label="Próximo dia"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-0.5">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSaveOnNavigate}
                onChange={(e) => setAutoSaveOnNavigate(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span>Salvar automaticamente ao trocar de dia com as setas ← →</span>
            </label>
            {isDayDirty && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Alterações não salvas
              </span>
            )}
          </div>
        </div>

        {/* Corpo em 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Coluna Esquerda (7 cols): Lista de Blocos */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Blocos de estudo agendados ({daySlots.length})
              </span>
              <button
                type="button"
                disabled={!nextAvailableSubId}
                title={
                  nextAvailableSubId
                    ? `Adicionar ${subjects[nextAvailableSubId]?.name || 'nova disciplina'}`
                    : 'Todas as disciplinas já foram adicionadas neste dia'
                }
                onClick={() => {
                  if (!nextAvailableSubId) {
                    toast.info('Todas as disciplinas já foram adicionadas neste dia.');
                    return;
                  }
                  setDaySlots([...daySlots, nextAvailableSubId]);
                  setDaySlotCounts([...(daySlotCounts || []), 0]);
                }}
                className="px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar ({daySlots.length + 1}º Bloco)
              </button>
            </div>

            {daySlots.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhum bloco agendado para este dia (Dia de Descanso).
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[54vh] overflow-y-auto custom-scrollbar pr-1">
                {daySlots.map((subId, idx) => {
                  const sub = subjects[subId];
                  const slotCountVal = Math.max(0, Math.floor(Number(daySlotCounts?.[idx]) || 0));
                  const defaultLabel = sub
                    ? Number(sub.lessonsPerBlock) > 0
                      ? `Padrão (${sub.lessonsPerBlock}a)`
                      : Number(sub.timeGoalMinutes || subjectTimeGoal?.[subId]) > 0
                        ? `Padrão (${formatMinutesToFriendly(Number(sub.timeGoalMinutes || subjectTimeGoal?.[subId]))})`
                        : 'Padrão (1a)'
                    : 'Padrão';

                  const updateSlotCount = (val) => {
                    const next = [...daySlotCounts];
                    while (next.length < daySlots.length) next.push(0);
                    next[idx] = Math.min(50, Math.max(0, Math.floor(Number(val) || 0)));
                    setDaySlotCounts(next);
                  };

                  const previewLessons = managingDayPreviewLessons[idx] || [];
                  const blockAccelSec = previewLessons.reduce(
                    (acc, les) => acc + Math.round((Number(les?.accelMins) || 0) * 60),
                    0
                  );

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 bg-slate-50/75 dark:bg-slate-800/45 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center tabular-nums">
                          {idx + 1}.
                        </span>
                        <select
                          value={subId}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            const alreadyUsed = daySlots.some(
                              (otherId, otherIdx) => otherIdx !== idx && otherId === nextId
                            );
                            if (alreadyUsed) {
                              toast.info('Esta disciplina já está adicionada neste dia.');
                              return;
                            }
                            const newSlots = [...daySlots];
                            newSlots[idx] = nextId;
                            setDaySlots(newSlots);
                          }}
                          className={`flex-1 text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none cursor-pointer ${
                            sub ? sub.color : 'bg-white text-slate-800'
                          }`}
                        >
                          {Object.values(subjects).map((s) => {
                            const isUsedInOtherSlot = daySlots.some(
                              (otherId, otherIdx) => otherIdx !== idx && otherId === s.id
                            );
                            return (
                              <option
                                key={s.id}
                                value={s.id}
                                disabled={isUsedInOtherSlot}
                                className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100"
                              >
                                {isUsedInOtherSlot ? `${s.name} (já no dia)` : s.name}
                              </option>
                            );
                          })}
                        </select>

                        {blockAccelSec > 0 && (
                          <span className="text-[11px] font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300 shrink-0">
                            {formatSecondsToFriendly(blockAccelSec)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setDaySlots(daySlots.filter((_, i) => i !== idx));
                            setDaySlotCounts((daySlotCounts || []).filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Remover este bloco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantidade de aulas */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pl-6 pr-1 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/60">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Quantidade de aulas
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateSlotCount(0)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                              slotCountVal === 0
                                ? 'bg-sky-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Usar a configuração padrão da disciplina"
                          >
                            {defaultLabel}
                          </button>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => updateSlotCount(n)}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                                slotCountVal === n
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {n}a
                            </button>
                          ))}
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                              slotCountVal > 5
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                            title="Digitar outra quantidade de aulas para este dia"
                          >
                            <input
                              type="number"
                              min="0"
                              max="50"
                              placeholder="Nº"
                              value={slotCountVal > 0 ? slotCountVal : ''}
                              onChange={(e) =>
                                updateSlotCount(e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0)
                              }
                              className="w-7 bg-transparent text-center text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 outline-none"
                            />
                            <span className="text-[10px] text-slate-400">aulas</span>
                          </div>
                        </div>
                      </div>

                      {/* Prévia das aulas */}
                      <div className="pl-6 pr-1 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/60">
                        {previewLessons.length > 0 ? (
                          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                            {previewLessons.map((les, lIdx) => (
                              <div
                                key={lIdx}
                                className="flex items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-200"
                              >
                                <p className="font-medium truncate flex-1" title={les.name}>
                                  · {les.name}
                                </p>
                                {les.duration && les.duration !== '00:00' && (
                                  <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                    {les.duration}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400">
                            Todas as aulas desta disciplina já foram concluídas antes desta data.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna Direita (5 cols): Escopo e Salvamento */}
          <div className="lg:col-span-5 flex flex-col gap-3 bg-slate-50/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-sky-500" /> Onde aplicar estas alterações?
            </span>

            <div className="flex flex-col gap-2">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                  saveMode === 'future'
                    ? 'bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/35 dark:border-emerald-600'
                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="saveModeRadio"
                  value="future"
                  checked={saveMode === 'future'}
                  onChange={() => setSaveMode('future')}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Padrão para o futuro (a partir de {managingDay.dateKey})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Aplica esta programação {dayAgr.nextPrep} <strong>{dayAgr.plural}</strong> desta data em diante. Dias anteriores não mudam.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                  saveMode === 'single'
                    ? 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/35 dark:border-sky-600'
                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="saveModeRadio"
                  value="single"
                  checked={saveMode === 'single'}
                  onChange={() => setSaveMode('single')}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Apenas neste dia ({managingDay.dateKey})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Modifica exclusivamente esta data, sem alterar semanas seguintes.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                  saveMode === 'all'
                    ? 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/35 dark:border-amber-600'
                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="saveModeRadio"
                  value="all"
                  checked={saveMode === 'all'}
                  onChange={() => setSaveMode('all')}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Fixar {dayAgr.allPrep} {dayAgr.plural} do Ciclo Base
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Atualiza o ciclo semanal inteiro (incluindo semanas anteriores a esta data).
                  </span>
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onSave}
                className={`w-full py-2.5 px-4 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  saveMode === 'future'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : saveMode === 'all'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                {saveMode === 'future'
                  ? `Aplicar de ${managingDay.dateKey} para o Futuro`
                  : saveMode === 'all'
                    ? `Fixar ${dayAgr.allPrep} ${dayAgr.plural} do Ciclo`
                    : `Salvar Apenas neste Dia (${managingDay.dateKey})`}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {daySlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDaySlots([]);
                      setDaySlotCounts([]);
                      toast.info('Blocos removidos. Clique no botão de salvar acima para confirmar este dia livre.');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar Dia
                  </button>
                )}

                {managingDay.isCustomized && (
                  <button
                    type="button"
                    onClick={onResetToDefault}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function TransitionRuleModal({
  editingTransitionSub,
  onClose,
  tempAction,
  setTempAction,
  tempRepId,
  setTempRepId,
  subjects,
  onSave
}) {
  if (!editingTransitionSub) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] relative flex flex-col gap-4"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar regra de transição"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            {editingTransitionSub.name}
          </p>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
            Regra ao concluir conteúdo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quando você terminar todas as aulas desta matéria, o que deve acontecer com os blocos nos dias seguintes?
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <label
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              tempAction === 'keep_fixed'
                ? 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/40 dark:border-sky-600'
                : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="modalAction"
              value="keep_fixed"
              checked={tempAction === 'keep_fixed'}
              onChange={() => setTempAction('keep_fixed')}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Encerrar matéria na data de término (liberar vaga)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Assim que a última aula for concluída, a matéria deixa de aparecer nos dias seguintes.
              </span>
            </div>
          </label>

          <label
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              tempAction === 'double_remaining'
                ? 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/40 dark:border-sky-600'
                : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="modalAction"
              value="double_remaining"
              checked={tempAction === 'double_remaining'}
              onChange={() => setTempAction('double_remaining')}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Dobrar outra matéria do dia
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                A outra disciplina programada no mesmo dia assume a vaga deixada até concluir.
              </span>
            </div>
          </label>

          <label
            className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              tempAction === 'replace'
                ? 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/40 dark:border-sky-600'
                : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="modalAction"
              value="replace"
              checked={tempAction === 'replace'}
              onChange={() => setTempAction('replace')}
              className="mt-0.5"
            />
            <div className="flex flex-col flex-1 gap-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Ingressar nova disciplina
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Uma disciplina cadastrada que ainda tem aulas pendentes entra no lugar.
              </span>

              {tempAction === 'replace' && (
                <select
                  value={tempRepId}
                  onChange={(e) => setTempRepId(e.target.value)}
                  className="mt-1 text-xs font-semibold p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Selecione a disciplina substituta --</option>
                  {Object.values(subjects)
                    .filter((s) => s.id !== editingTransitionSub.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Salvar Regra
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ResetCalendarModal({
  isOpen,
  onClose,
  resetMode,
  setResetMode,
  isResettingCalendar,
  onConfirm
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm fade-in font-sans"
      onClick={() => !isResettingCalendar && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 w-full max-w-lg shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75)] ring-1 ring-slate-950/5 dark:ring-white/[0.04] relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button
          type="button"
          onClick={() => !isResettingCalendar && onClose()}
          disabled={isResettingCalendar}
          aria-label="Fechar redefinição"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/70 text-red-600 dark:text-red-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Redefinir Calendário
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escolha o que deseja redefinir no planejamento do calendário.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label
            className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              resetMode === 'overrides'
                ? 'bg-sky-50/70 border-sky-500 dark:bg-sky-950/40 dark:border-sky-600'
                : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="resetCalendarMode"
              value="overrides"
              checked={resetMode === 'overrides'}
              onChange={() => setResetMode('overrides')}
              className="mt-1"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Restaurar padrão do ciclo semanal (limpar edições avulsas)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Remove personalizações manuais de dias avulsos, regras futuras e deslocamentos de reposição, voltando ao ciclo semanal base.
              </span>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              resetMode === 'clear_all'
                ? 'bg-red-50/70 border-red-500 dark:bg-red-950/40 dark:border-red-600'
                : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="resetCalendarMode"
              value="clear_all"
              checked={resetMode === 'clear_all'}
              onChange={() => setResetMode('clear_all')}
              className="mt-1"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Zerar toda a grade do calendário e ciclo (limpar todos os dias)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Remove todas as matérias agendadas nos dias do calendário e do ciclo semanal,{' '}
                <strong>mantendo intactas</strong> todas as matérias e aulas em &ldquo;Minhas Disciplinas&rdquo;.
              </span>
            </div>
          </label>

          <label
            className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
              resetMode === 'reset_progress'
                ? 'bg-amber-50/70 border-amber-500 dark:bg-amber-950/40 dark:border-amber-600'
                : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="resetCalendarMode"
              value="reset_progress"
              checked={resetMode === 'reset_progress'}
              onChange={() => setResetMode('reset_progress')}
              className="mt-1"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Reiniciar aulas no calendário (voltar para a Aula 1)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Desmarca as aulas concluídas para que o calendário reprograme todas as matérias desde a primeira aula, mantendo a grade e as disciplinas.
              </span>
            </div>
          </label>
        </div>

        {resetMode !== 'overrides' && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>
              {resetMode === 'clear_all'
                ? 'Atenção: todos os blocos do calendário e do ciclo semanal ficarão vazios para você montar do zero.'
                : 'Atenção: o progresso de aulas concluídas será zerado e sincronizado com a nuvem.'}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isResettingCalendar}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isResettingCalendar}
            className={`px-4 py-2 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              resetMode === 'clear_all'
                ? 'bg-red-600 hover:bg-red-700'
                : resetMode === 'reset_progress'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {isResettingCalendar ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redefinindo...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" /> Confirmar Redefinição
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function BulkScheduleModal(props) {
  if (!props.isOpen) return null;
  const modalKey = `${props.initialSubjectId || 'first'}:${(props.futureScheduleRules || []).length}`;
  return <BulkScheduleModalContent key={modalKey} {...props} />;
}

function BulkScheduleModalContent({
  onClose,
  subjects = {},
  initialSubjectId = '',
  cycle = [],
  cycleSlotCounts = [],
  cycleWeekStart = 'sunday',
  futureScheduleRules = [],
  onApplySubjectDays,
  onClearAllCalendar
}) {
  const subjectList = useMemo(() => {
    return Object.values(subjects || {})
      .filter((s) => s && s.id && s.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  }, [subjects]);

  const initialId = (initialSubjectId && subjects?.[initialSubjectId]?.id) || subjectList[0]?.id || '';
  const initialDetected = getScheduledDaysForSubject(
    { cycle, cycleSlotCounts, cycleWeekStart, futureScheduleRules },
    initialId
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState(initialId);
  const [selectedDays, setSelectedDays] = useState(initialDetected.days);
  const [slotCount, setSlotCount] = useState(initialDetected.slotCount || 0);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const handleSubjectChange = (nextId) => {
    setSelectedSubjectId(nextId);
    const detected = getScheduledDaysForSubject(
      { cycle, cycleSlotCounts, cycleWeekStart, futureScheduleRules },
      nextId
    );
    setSelectedDays(detected.days);
    setSlotCount(detected.slotCount || 0);
    setConfirmClearAll(false);
  };

  const activeSubject = subjects?.[selectedSubjectId] || null;
  const activeSubjectName = activeSubject?.name || 'Matéria';

  const toggleDay = (dow) => {
    setSelectedDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gerenciar Matérias no Calendário
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Adicione uma disciplina em vários dias da semana de uma só vez, ou remova uma matéria ou toda a grade em um clique.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {subjectList.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            Nenhuma disciplina cadastrada ainda. Cadastre matérias em Configurações para programá-las aqui.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="bulk-calendar-subject-select"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Disciplina
              </label>
              <select
                id="bulk-calendar-subject-select"
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                {subjectList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dias da semana para estudar
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Seg a Sex
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6])}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Seg a Sáb
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 0])}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([])}
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_ORDER.map((dow) => {
                  const active = selectedDays.includes(dow);
                  return (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => toggleDay(dow)}
                      aria-pressed={active}
                      className={`h-10 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                        active
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sky-400'
                      }`}
                    >
                      {WEEKDAY_LABELS[dow].short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Aulas por dia (opcional)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  0 usa a meta/padrão da disciplina
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="20"
                value={slotCount}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setSlotCount(Number.isFinite(n) ? Math.max(0, Math.min(20, Math.floor(n))) : 0);
                }}
                className="w-20 h-9 px-2.5 text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => onApplySubjectDays(selectedSubjectId, [], 0)}
                className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/70 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover {activeSubjectName} do calendário
              </button>

              <button
                type="button"
                onClick={() => onApplySubjectDays(selectedSubjectId, selectedDays, slotCount)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Aplicar dias de {activeSubjectName}
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          {!confirmClearAll ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Quer começar a grade semanal do zero?
              </span>
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover todas do calendário
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-800/70 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-red-800 dark:text-red-200">
                Confirmar remoção de todas as matérias da grade? (Suas disciplinas cadastradas serão mantidas.)
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onClearAllCalendar}
                  className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirmar remoção total
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
