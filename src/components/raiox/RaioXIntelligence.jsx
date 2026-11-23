import React from 'react';
import {
  Clock,
  Scale,
  Search,
  ArrowRight,
  Dices,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

export default function RaioXIntelligence({
  forgettingCurveRows,
  legalRadarList,
  selectedLegalDevice,
  decorebaRows,
  filteredDecorebaRows,
  decorebaCategory,
  setDecorebaCategory,
  decorebaSearch,
  setDecorebaSearch,
  onOpenNotebookWithFilter
}) {
  const renderHeatCell = (b) => {
    if (!b || b.pct === null) {
      return (
        <span className="inline-flex items-center justify-center w-20 h-8 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 text-slate-400 dark:text-slate-600 font-mono text-xs">
          —
        </span>
      );
    }
    const tone = b.pct >= 80
      ? 'bg-emerald-500/18 text-emerald-800 dark:text-emerald-300 border-emerald-500/35'
      : b.pct >= 65
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
      : b.pct >= 50
      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35'
      : 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35';

    return (
      <span className={`inline-flex flex-col items-center justify-center w-20 h-9 rounded-lg border font-mono leading-none tabular-nums ${tone}`}>
        <span className="text-xs font-bold">{b.pct}%</span>
        <span className="text-[10px] opacity-75 mt-0.5">{b.total}q</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. HEATMAP DA CURVA DE ESQUECIMENTO REAL */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Heatmap de esquecimento real por disciplina</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compare sua retenção recente (0–7d) com questões antigas (16–30d / 30d+). Quedas indicam urgência de revisão.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/60" /> ≥65%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/60" /> 50–64%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-500/60" /> &lt;50%
            </span>
          </div>
        </div>

        {forgettingCurveRows.length === 0 ? (
          <div className="py-12 px-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <Clock className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Ainda não há janelas temporais suficientes
            </p>
            <p>Resolva questões ao longo dos dias para visualizar o decaimento de retenção por disciplina.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 pl-5 pr-3">Disciplina</th>
                  <th className="py-3 px-2 text-center">0–7 dias</th>
                  <th className="py-3 px-2 text-center">8–15 dias</th>
                  <th className="py-3 px-2 text-center">16–30 dias</th>
                  <th className="py-3 px-2 text-center">30d+</th>
                  <th className="py-3 pl-2 pr-5 text-right">Tendência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {forgettingCurveRows.map((row) => (
                  <tr
                    key={row.discipline}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-850/40 transition-colors"
                  >
                    <td className="py-2.5 pl-5 pr-3">
                      <button
                        type="button"
                        onClick={() => onOpenNotebookWithFilter({ subject: row.discipline, filterType: 'all' })}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 text-left cursor-pointer"
                      >
                        {row.discipline}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-center">{renderHeatCell(row.buckets.b0_7)}</td>
                    <td className="py-2.5 px-2 text-center">{renderHeatCell(row.buckets.b8_15)}</td>
                    <td className="py-2.5 px-2 text-center">{renderHeatCell(row.buckets.b16_30)}</td>
                    <td className="py-2.5 px-2 text-center">{renderHeatCell(row.buckets.b30p)}</td>
                    <td className="py-2.5 pl-2 pr-5 text-right font-mono font-bold tabular-nums">
                      {row.decayDelta === null ? (
                        <span className="text-slate-400">—</span>
                      ) : row.decayDelta < -5 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/12 text-red-600 dark:text-red-400 border border-red-500/25">
                          <AlertTriangle className="w-3 h-3" />
                          {row.decayDelta}% ↓
                        </span>
                      ) : row.decayDelta > 5 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                          +{row.decayDelta}% ↑
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Estável</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2. SPLIT INFERIOR: RADAR DE LEI SECA + TABELA DECOREBA PRF */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        {/* Esquerda: Radar de Lei Seca */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Radar de Lei Seca ({legalRadarList.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Artigos, leis, súmulas e resoluções CONTRAN mais cobrados. Clique para abrir no Caderno.
              </p>
            </div>
          </div>

          {legalRadarList.length === 0 ? (
            <div className="my-auto py-14 px-6 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1.5">
              <Scale className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Nenhum dispositivo legal detectado
              </p>
              <p>Artigos, leis e resoluções citados nas questões aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto custom-scrollbar">
              {legalRadarList.slice(0, 25).map((dev, idx) => {
                const isSelected = selectedLegalDevice?.key === dev.key;
                const errorPct = dev.total > 0 ? Math.round((dev.errors / dev.total) * 100) : 0;
                return (
                  <button
                    key={dev.key}
                    type="button"
                    onClick={() => onOpenNotebookWithFilter({ legalDevice: dev })}
                    className={`w-full p-3.5 sm:px-5 text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block truncate">
                          {dev.label}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {dev.category} · {dev.total} {dev.total === 1 ? 'questão' : 'questões'}
                          </span>
                          <div className="hidden sm:block w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={dev.errors > 0 ? 'h-full bg-red-500' : 'h-full bg-emerald-500'}
                              style={{ width: `${dev.errors > 0 ? Math.max(15, errorPct) : 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono font-semibold tabular-nums">
                      {dev.errors > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-500/12 text-red-600 dark:text-red-400 border border-red-500/25">
                          {dev.errors} {dev.errors === 1 ? 'erro' : 'erros'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                          100%
                        </span>
                      )}
                      {dev.guessesOrDoubts > 0 && (
                        <span
                          className="px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25 inline-flex items-center gap-1"
                          title="Respondida com dúvida ou chute"
                        >
                          <Dices className="w-3 h-3" />
                          {dev.guessesOrDoubts}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Direita: Tabela Decoreba PRF */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Tabela Decoreba PRF ({decorebaRows.length})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prazos, multas e penas extraídos automaticamente dos seus bizus, enunciados e comentários.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['Todos', 'Prazo', 'Multa/CTB', 'Pena'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDecorebaCategory(cat)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    decorebaCategory === cat
                      ? 'bg-teal-600 text-white border-teal-500 dark:bg-teal-500 dark:text-slate-950 dark:border-teal-400'
                      : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <div className="relative flex-1 min-w-[150px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={decorebaSearch}
                  onChange={(e) => setDecorebaSearch(e.target.value)}
                  placeholder="Filtrar prazo ou valor..."
                  className="w-full h-8 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {filteredDecorebaRows.length === 0 ? (
            <div className="my-auto py-14 px-6 text-center text-slate-500 dark:text-slate-400 text-xs">
              Nenhum prazo, multa ou pena encontrado neste filtro.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredDecorebaRows.map((row) => (
                <div
                  key={row.id}
                  className="p-3.5 sm:px-5 hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-teal-500/12 text-teal-700 dark:text-teal-400 border border-teal-500/25 font-semibold text-[11px]">
                        {row.category}
                      </span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {row.highlight}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {row.subject} ({row.sourceLabel})
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-snug">
                      {row.snippet}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenNotebookWithFilter({ searchQuery: row.questionId, filterType: 'all' })}
                    className="shrink-0 h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-850 hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 self-start sm:self-center"
                  >
                    <span>{row.questionId}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
