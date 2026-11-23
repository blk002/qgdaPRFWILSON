import React, { useState } from 'react';
import { Edit3, Star, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { formatSecondsToFriendly } from '../../lib/durationHelpers';
import { getSubjectTextColorClass } from '../../lib/subjectColors';

const DIAS_SEMANA_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export default function CalendarioAgendaView({
  year,
  month,
  days,
  todayDateObj,
  subjects,
  futureSchedule,
  calendarOverrides,
  remainingLessonsQueue,
  getDaySubjectsForDate,
  highlightedSubjectId,
  onOpenDayManager
}) {
  const [showRestDays, setShowRestDays] = useState(false);
  const todayTime = todayDateObj.getTime();

  const agendaRows = days
    .map((day) => {
      const cellDateObj = new Date(year, month, day);
      const diffDays = Math.round((cellDateObj.getTime() - todayTime) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return null;

      const cellDateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isTodayReal = diffDays === 0;
      const isOverridden = Boolean(calendarOverrides && calendarOverrides[cellDateKey]);

      let items = [];
      if (futureSchedule[cellDateKey] !== undefined) {
        items = futureSchedule[cellDateKey];
      } else {
        const baseIds = getDaySubjectsForDate(cellDateObj, cellDateKey);
        items = baseIds
          .filter((id) => (remainingLessonsQueue[id]?.length || 0) > 0)
          .map((id) => ({ id, isLast: false, isTransitioned: false, lessons: [] }));
      }

      if (highlightedSubjectId) {
        items = items.filter((it) => it?.id === highlightedSubjectId);
      }

      const accelSec = items.reduce((acc, it) => acc + (Number(it?.accelSec) || 0), 0);
      const totalLessons = items.reduce((acc, it) => acc + (Number(it?.count) || it?.lessons?.length || 0), 0);

      return {
        day,
        cellDateObj,
        cellDateKey,
        weekday: DIAS_SEMANA_FULL[cellDateObj.getDay()],
        isTodayReal,
        isOverridden,
        items,
        accelSec,
        totalLessons
      };
    })
    .filter(Boolean)
    .filter((row) => (showRestDays ? true : row.items.length > 0));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/50">
        <span className="text-xs text-slate-600 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-slate-100 tabular-nums">{agendaRows.length}</strong>{' '}
          {agendaRows.length === 1 ? 'dia restante exibido' : 'dias restantes exibidos'}
        </span>

        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showRestDays}
            onChange={(e) => setShowRestDays(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <span>Mostrar dias livres</span>
        </label>
      </div>

      {agendaRows.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Nenhuma aula programada para os dias restantes deste mês.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Marque &ldquo;Mostrar dias livres&rdquo; acima ou alterne para Mês para programar blocos.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
          {agendaRows.map((row) => (
            <div
              key={row.cellDateKey}
              className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-start gap-3.5 transition-colors ${
                row.isTodayReal
                  ? 'bg-sky-50/45 dark:bg-sky-950/15'
                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
              }`}
            >
              {/* Data e total do dia */}
              <div className="md:w-44 shrink-0 flex flex-row md:flex-col items-center md:items-start justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        row.isTodayReal
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {String(row.day).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{row.weekday}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {row.isTodayReal && (
                      <span className="font-semibold text-sky-600 dark:text-sky-400">Hoje ·</span>
                    )}
                    <span className="tabular-nums">
                      {row.totalLessons > 0
                        ? `${row.totalLessons} ${row.totalLessons === 1 ? 'aula' : 'aulas'}`
                        : 'Livre'}
                    </span>
                    {row.isOverridden && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">· Editado</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {row.accelSec > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300">
                      <Clock className="w-3.5 h-3.5" />
                      {formatSecondsToFriendly(row.accelSec)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenDayManager(row.cellDateObj, row.cellDateKey)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-sky-400 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3 h-3" /> Editar
                  </button>
                </div>
              </div>

              {/* Blocos do dia */}
              <div className="flex-1 min-w-0">
                {row.items.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-0.5">
                    Dia livre — clique em Editar para adicionar blocos.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {row.items.map((item, idx) => {
                      const sub = subjects[item.id];
                      if (!sub) return null;
                      const textColorClass = getSubjectTextColorClass(sub.color);
                      const lessonsList = Array.isArray(item.lessons) ? item.lessons : [];
                      const blockTime = Number(item.accelSec) > 0 ? formatSecondsToFriendly(item.accelSec) : '';

                      return (
                        <div
                          key={`${item.id}-${idx}`}
                          className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-950/45 p-2.5 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-xs font-bold truncate ${textColorClass}`}>
                                {sub.name}
                              </span>
                              {item.isTransitioned && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                                  · Subst.
                                </span>
                              )}
                              {item.isLast && (
                                <Star
                                  className="w-3 h-3 text-emerald-500 fill-emerald-500 shrink-0"
                                  title="Última aula desta disciplina"
                                />
                              )}
                            </div>

                            {blockTime && (
                              <span className="text-[11px] font-mono font-bold tabular-nums text-amber-600 dark:text-amber-300 shrink-0">
                                {blockTime}
                              </span>
                            )}
                          </div>

                          {lessonsList.length > 0 ? (
                            <ul className="flex flex-col gap-0.5">
                              {lessonsList.map((les, lIdx) => (
                                <li
                                  key={lIdx}
                                  className="flex items-baseline justify-between gap-2 text-xs text-slate-700 dark:text-slate-300"
                                >
                                  <span className="min-w-0 break-words leading-snug">· {les.name}</span>
                                  {les.duration && les.duration !== '00:00' && (
                                    <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                                      {les.duration}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : item.count >= 1 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {item.count} {item.count === 1 ? 'aula prevista' : 'aulas previstas'}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
