import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function StudyConsistencyHeatmap() {
  const { studyHistory = {}, caveiraQuestions = [], getLocalDateStr } = useStore();

  const questionsByDate = useMemo(() => {
    const map = {};
    (Array.isArray(caveiraQuestions) ? caveiraQuestions : []).forEach((q) => {
      if (!q) return;
      const rawTs = q.timestamp || q.updatedAt;
      if (!rawTs) return;
      const d = new Date(rawTs);
      if (isNaN(d.getTime())) return;
      const dateStr = getLocalDateStr
        ? getLocalDateStr(d)
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateStr]) map[dateStr] = { total: 0, hits: 0 };
      map[dateStr].total += 1;
      if (q.hit) map[dateStr].hits += 1;
    });
    return map;
  }, [caveiraQuestions, getLocalDateStr]);

  const heatmapDataObj = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 52 semanas atrás
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // Ajusta para domingo
    startDate.setHours(0, 0, 0, 0);

    const days = [];
    const weeks = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 371; i++) {
      const d = new Date(currentDate);
      days.push(d);
      if (i % 7 === 0) {
        weeks.push(d);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { days, weeks };
  }, []);

  const totalHours = Math.round(
    Object.values(studyHistory || {}).reduce((acc, val) => acc + (Number(val) || 0), 0) / 60
  );
  const totalCaveiraCount = Array.isArray(caveiraQuestions) ? caveiraQuestions.length : 0;
  const nowRef = new Date();

  return (
    <div className="w-fit max-w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest dark:text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Consistência de Estudos (Últimos 12 Meses)
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5 dark:text-slate-400 font-bold uppercase tracking-wide">
            Teoria + Questões do Caveira integradas por dia
          </p>
        </div>
        <div className="shrink-0 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 px-3 py-1 rounded-lg border border-sky-500/25 uppercase tracking-wider tabular-nums">
            {totalHours} {totalHours === 1 ? 'hora total' : 'horas totais'}
          </span>
          {totalCaveiraCount > 0 && (
            <span className="text-[11px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-lg border border-teal-500/25 uppercase tracking-wider tabular-nums">
              {totalCaveiraCount} {totalCaveiraCount === 1 ? 'questão' : 'questões'}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar md:overflow-visible pt-2.5 pb-1">
        <div className="w-max">
          {/* Linha de Meses */}
          <div className="flex items-end mb-1.5 select-none">
            <div className="w-8 shrink-0 pr-2" />
            <div
              className="grid gap-[3px] h-3.5"
              style={{ gridTemplateColumns: 'repeat(53, 12px)' }}
            >
              {heatmapDataObj.weeks.map((weekStart, colIdx) => {
                const isFirstWeekOfMonth =
                  colIdx === 0 ||
                  weekStart.getMonth() !== heatmapDataObj.weeks[colIdx - 1].getMonth();

                const collidesWithNextMonth =
                  colIdx === 0 &&
                  heatmapDataObj.weeks[1] &&
                  heatmapDataObj.weeks[1].getMonth() !== weekStart.getMonth();

                return (
                  <div key={colIdx} className="relative">
                    {isFirstWeekOfMonth && !collidesWithNextMonth && (
                      <span className="absolute left-0 top-0 whitespace-nowrap text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {MESES_ABREV[weekStart.getMonth()]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rótulos da semana + Grade de quadradinhos (371 células: 7 linhas x 53 colunas) */}
          <div className="flex items-start">
            <div
              className="w-8 shrink-0 pr-2 grid gap-[3px] text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none text-right"
              style={{ gridTemplateRows: 'repeat(7, 12px)' }}
            >
              <div className="flex items-center justify-end leading-none" />
              <div className="flex items-center justify-end leading-none">Seg</div>
              <div className="flex items-center justify-end leading-none" />
              <div className="flex items-center justify-end leading-none">Qua</div>
              <div className="flex items-center justify-end leading-none" />
              <div className="flex items-center justify-end leading-none">Sex</div>
              <div className="flex items-center justify-end leading-none" />
            </div>

            <div
              className="grid grid-flow-col gap-[3px]"
              style={{
                gridTemplateColumns: 'repeat(53, 12px)',
                gridTemplateRows: 'repeat(7, 12px)'
              }}
            >
              {heatmapDataObj.days.map((cellDate, idx) => {
                const dateStr = getLocalDateStr(cellDate);
                const minutes = studyHistory[dateStr] || 0;
                const qDay = questionsByDate[dateStr] || { total: 0, hits: 0 };
                const effectiveLoad = minutes + qDay.total * 2;
                const qAccPct = qDay.total > 0 ? Math.round((qDay.hits / qDay.total) * 100) : 0;
                const isFuture = cellDate > nowRef;

                let heatClass = 'bg-slate-200/60 border-slate-300/20 dark:bg-slate-850 dark:border-slate-800';
                if (isFuture) {
                  heatClass = 'bg-slate-100/10 border-dashed border-slate-200/5 dark:bg-slate-800/5 dark:border-slate-700/5 opacity-15 pointer-events-none';
                } else if (effectiveLoad > 0 && effectiveLoad <= 30) {
                  heatClass = 'bg-sky-500/20 border-transparent';
                } else if (effectiveLoad > 30 && effectiveLoad <= 60) {
                  heatClass = 'bg-sky-500/40 border-transparent';
                } else if (effectiveLoad > 60 && effectiveLoad <= 120) {
                  heatClass = 'bg-sky-500/70 border-transparent';
                } else if (effectiveLoad > 120) {
                  heatClass = 'bg-gradient-to-br from-sky-400 to-teal-400 border-transparent shadow-[0_0_8px_rgba(56,189,248,0.28)]';
                }

                const monthName = MESES_NOMES[cellDate.getMonth()];
                const dayNum = cellDate.getDate();

                const colIdx = Math.floor(idx / 7);
                const rowIdx = idx % 7;
                let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
                if (colIdx < 8) {
                  tooltipAlignClass = 'left-0';
                } else if (colIdx > 43) {
                  tooltipAlignClass = 'right-0 left-auto';
                }

                const tooltipVerticalClass =
                  rowIdx < 2
                    ? 'top-full mt-2'
                    : 'bottom-full mb-2';

                return (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-[3px] border flex items-center justify-center transition-all group/cell relative cursor-default hover:scale-110 hover:z-30 ${heatClass}`}
                  >
                    {!isFuture && (
                      <div
                        className={`hidden group-hover/cell:block pointer-events-none absolute ${tooltipVerticalClass} ${tooltipAlignClass} w-max bg-slate-950/95 text-white text-[10.5px] font-semibold py-1.5 px-3 rounded-lg z-50 shadow-lg border border-slate-800 text-center`}
                      >
                        <p className="text-slate-200 font-bold">
                          {dayNum} de {monthName} de {cellDate.getFullYear()}
                        </p>
                        {minutes > 0 && (
                          <p className="text-sky-400 font-extrabold mt-0.5">
                            ⚡ {minutes} min estudados
                          </p>
                        )}
                        {qDay.total > 0 && (
                          <p className="text-teal-400 font-extrabold mt-0.5">
                            🎯 {qDay.total} {qDay.total === 1 ? 'questão' : 'questões'} Caveira ({qAccPct}% acerto)
                          </p>
                        )}
                        {minutes === 0 && qDay.total === 0 && (
                          <p className="text-slate-400 font-bold mt-0.5">
                            💤 Nenhum estudo registrado
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda de intensidades */}
      <div className="flex flex-wrap items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
        <span>Menos</span>
        <div className="w-3 h-3 rounded-[3px] bg-slate-200/60 dark:bg-slate-850 border border-slate-300/20 dark:border-slate-800"></div>
        <div className="w-3 h-3 rounded-[3px] bg-sky-500/20"></div>
        <div className="w-3 h-3 rounded-[3px] bg-sky-500/40"></div>
        <div className="w-3 h-3 rounded-[3px] bg-sky-500/70"></div>
        <div className="w-3 h-3 rounded-[3px] bg-gradient-to-br from-sky-400 to-teal-400 shadow-[0_0_8px_rgba(56,189,248,0.28)]"></div>
        <span>Mais</span>
      </div>
    </div>
  );
}
