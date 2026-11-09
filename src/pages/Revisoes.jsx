import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import CaveiraReviewQuestionModal from '../components/CaveiraReviewQuestionModal';
import { 
  BrainCircuit, AlertTriangle, Target as TargetIcon, Clock, 
  ChevronLeft, ChevronRight, CalendarDays, Layers, CheckCircle, 
  TrendingUp, TrendingDown, Zap, Activity
} from 'lucide-react';

export default function Revisoes() {
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('ALL'); // 'ALL' | 'CAVEIRA' | 'CICLO'
  const {
    reviews,
    caveiraQuestions = [],
    reviewStats,
    subjects,
    getThermometer,
    getLocalDateStr,
    getTodayDate,
    getPendingReviews,
    reviewCalendarDate,
    setReviewCalendarDate,
    setReviewModal,
    syncAndRepairCaveiraReviews,
    advanceFutureReviews
  } = useStore();

  useEffect(() => {
    syncAndRepairCaveiraReviews?.();
  }, [reviews.length, caveiraQuestions.length, syncAndRepairCaveiraReviews]);

  const caveiraTimeMap = useMemo(() => {
    const map = new Map();
    caveiraQuestions.forEach((q, idx) => {
      if (q && q.id) {
        const ts = q.timestamp ? new Date(q.timestamp).getTime() : NaN;
        // caveiraQuestions é salvo do mais novo (idx 0) para o mais antigo (idx final)
        map.set(String(q.id).toUpperCase(), {
          ts: Number.isFinite(ts) ? ts : null,
          reverseOrder: caveiraQuestions.length - idx
        });
      }
    });
    return map;
  }, [caveiraQuestions]);
  
  if (!reviewCalendarDate) return null; // Safety check
  const todayStr = getLocalDateStr();

  const isCaveiraCard = (rev) => Boolean(
    rev.isCaveiraQuestion ||
    rev.questionData ||
    String(rev.id || '').startsWith('rev_caveira_') ||
    String(rev.topicName || '').startsWith('[Caveira')
  );

  const getReviewSubjectMeta = (rev) => {
    const sub = subjects[rev.subjectId];
    const caveira = isCaveiraCard(rev);
    if (caveira) {
      const name =
        rev.customSubjectName ||
        rev.questionData?.canonicalSubject ||
        rev.questionData?.subject ||
        sub?.name ||
        'Questão Caveira';
      const color = sub?.color || 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      return { id: `caveira_${name}`, name, color, isCaveira: true };
    }
    return {
      id: rev.subjectId || 'geral',
      name: sub?.name || rev.customSubjectName || 'Geral',
      color: sub?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      isCaveira: false
    };
  };

  // Ordena estritamente dos MAIS ANTIGOS para os MAIS NOVOS
  const allDueToday = getPendingReviews()
    .slice()
    .sort((a, b) => {
      const dateA = String(a.nextDateStr || '');
      const dateB = String(b.nextDateStr || '');
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const getSortMeta = (rev) => {
        const idMatch =
          String(rev.caveiraQuestionId || '').match(/Q(\d+)/i) ||
          String(rev.questionData?.id || '').match(/Q(\d+)/i) ||
          String(rev.id || '').match(/Q(\d+)/i) ||
          String(rev.topicName || '').match(/Q(\d+)/i);
        const qId = idMatch ? `Q${idMatch[1]}`.toUpperCase() : null;
        const qNum = idMatch ? parseInt(idMatch[1], 10) : Number.MAX_SAFE_INTEGER;
        const mapEntry = qId ? caveiraTimeMap.get(qId) : null;
        const rawTs = rev.createdAt || rev.questionData?.timestamp || rev.lastReviewDate || null;
        const parsedTs = rawTs ? new Date(rawTs).getTime() : NaN;
        const ts = Number.isFinite(parsedTs) ? parsedTs : (mapEntry?.ts ?? null);
        return {
          ts,
          reverseOrder: mapEntry?.reverseOrder ?? Number.MAX_SAFE_INTEGER,
          qNum
        };
      };

      const metaA = getSortMeta(a);
      const metaB = getSortMeta(b);

      if (metaA.ts !== null && metaB.ts !== null && metaA.ts !== metaB.ts) {
        return metaA.ts - metaB.ts; // Mais antigo primeiro
      }
      if (metaA.reverseOrder !== metaB.reverseOrder) {
        return metaA.reverseOrder - metaB.reverseOrder; // Mais antigo no histórico primeiro
      }
      if (metaA.qNum !== metaB.qNum) {
        return metaA.qNum - metaB.qNum; // Menor ID numérico primeiro
      }
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

  const caveiraDueCount = allDueToday.filter(rev => isCaveiraCard(rev)).length;
  const cicloDueCount = allDueToday.length - caveiraDueCount;

  const typeFilteredDueToday = allDueToday.filter(rev => {
    if (reviewTypeFilter === 'CAVEIRA') return isCaveiraCard(rev);
    if (reviewTypeFilter === 'CICLO') return !isCaveiraCard(rev);
    return true;
  });

  const filteredDueToday = selectedSubjectFilter === 'ALL'
    ? typeFilteredDueToday
    : typeFilteredDueToday.filter(rev => getReviewSubjectMeta(rev).id === selectedSubjectFilter);

  const safeCardIdx = filteredDueToday.length > 0
    ? Math.min(currentCardIdx, filteredDueToday.length - 1)
    : 0;
  const activeRev = filteredDueToday[safeCardIdx] || null;
  const backlogCount = Math.max(0, allDueToday.length - 12);
  const isProcrastinating = backlogCount > 5;

  const subjectsDueMap = {};
  typeFilteredDueToday.forEach(rev => {
    const meta = getReviewSubjectMeta(rev);
    if (!subjectsDueMap[meta.id]) {
      subjectsDueMap[meta.id] = { subject: meta, count: 0 };
    }
    subjectsDueMap[meta.id].count += 1;
  });
  const activeReviewSubjects = Object.values(subjectsDueMap)
    .sort((a, b) => b.count - a.count);

  const perfReviews = reviews.filter(r => r.lastPerformance !== undefined);
  const avgMemoryHealth = perfReviews.length > 0 
    ? Math.round((perfReviews.reduce((acc, r) => acc + r.lastPerformance, 0) / perfReviews.length) * 100) 
    : 0;

  const rawRevDate = reviewCalendarDate ? new Date(reviewCalendarDate) : new Date();
  const safeRevDate = isNaN(rawRevDate.getTime()) ? new Date() : rawRevDate;
  const rYear = safeRevDate.getFullYear();
  const rMonth = safeRevDate.getMonth();
  const rDaysInMonth = new Date(rYear, rMonth + 1, 0).getDate();
  const rFirstDayIndex = new Date(rYear, rMonth, 1).getDay();
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const rBlanks = Array(rFirstDayIndex).fill(null);
  const rDays = Array.from({ length: rDaysInMonth }, (_, i) => i + 1);

  // --- PREVISÃO DE CARGA FSRS (PRÓXIMOS 7 DIAS) & CURVA DE ESQUECIMENTO ---
  const baseToday = getTodayDate ? getTodayDate() : new Date();
  const next7DaysForecast = Array.from({ length: 7 }, (_, i) => {
    const offset = i + 1;
    const d = new Date(baseToday);
    d.setDate(d.getDate() + offset);
    const dateStr = getLocalDateStr(d);
    const dayRevs = reviews.filter(r => r.nextDateStr === dateStr);
    const caveiraCount = dayRevs.filter(r => isCaveiraCard(r)).length;
    const cicloCount = dayRevs.length - caveiraCount;
    const dayName = diasSemana[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    return {
      offset,
      dateStr,
      label: offset === 1 ? 'Amanhã' : `${dayName} (${dayNum}/${monthNum})`,
      shortDate: `${dayNum}/${monthNum}`,
      total: dayRevs.length,
      caveiraCount,
      cicloCount
    };
  });
  const maxForecastCount = Math.max(5, ...next7DaysForecast.map(f => f.total));
  const totalNext7Days = next7DaysForecast.reduce((acc, f) => acc + f.total, 0);

  // Estabilidade média real dos cartões já revisados (ou 3.5d inicial) para a Curva de Esquecimento FSRS R(t) = (1 + t/(9*S))^-1
  const cardsWithStability = reviews.filter(r => Number(r.stability) > 0);
  const avgStabilityDays = cardsWithStability.length > 0
    ? cardsWithStability.reduce((acc, r) => acc + Number(r.stability || 0), 0) / cardsWithStability.length
    : 3.5;

  const forgettingCurvePoints = [0, 1, 3, 7, 14, 30].map(daysElapsed => {
    const retention = Math.round(Math.pow(1 + daysElapsed / (9 * Math.max(0.5, avgStabilityDays)), -1) * 100);
    return {
      daysElapsed,
      label: daysElapsed === 0 ? 'Hoje (0d)' : `+${daysElapsed}d`,
      retention: Math.max(15, Math.min(100, retention))
    };
  });

  return (
    <div className="fade-in w-full pb-10">
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full shrink-0"><BrainCircuit className="text-red-600 w-6 h-6 sm:w-8 sm:h-8" /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">C.C.R. (Centro de Comando de Retenção)</h2>
            <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">Auditoria do Algoritmo FSRS de Espaçamento.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex-1 min-w-[100px] lg:w-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center dark:bg-slate-950 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Acerto Global</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              {reviewStats.totalDone > 0 ? Math.round((reviewStats.correct / reviewStats.totalDone) * 100) : 0}%
            </p>
          </div>
          <div className="flex-1 min-w-[100px] lg:w-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center dark:bg-slate-950 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" title="Média de todas as revisões feitas">Saúde da Memória</p>
            <p className={`text-xl sm:text-2xl font-black ${avgMemoryHealth >= 80 ? 'text-emerald-500' : avgMemoryHealth >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
              {avgMemoryHealth}%
            </p>
          </div>
          <div className="flex-1 min-w-[100px] lg:w-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center dark:bg-slate-950 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sequência</p>
            <p className="text-xl sm:text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
              🔥 {reviewStats.streak}
            </p>
          </div>
        </div>
      </div>

      {isProcrastinating && (
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-md mb-6 flex items-center justify-between border-2 border-red-800 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-300" />
            <div>
              <h3 className="font-black uppercase tracking-wider text-sm">Multa de Procrastinação Ativada</h3>
              <p className="text-xs text-red-100 mt-0.5">Você acumulou {backlogCount} revisões ignoradas. Suas moedas estão sendo drenadas até que limpe a fila.</p>
            </div>
          </div>
        </div>
      )}

      {allDueToday.length > 0 ? (
        <>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 dark:text-slate-200">
                <TargetIcon className="w-5 h-5 text-red-500"/> Fila Estratégica de Hoje (1 por 1)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exibindo um cartão por vez • Ordem cronológica: <strong>do mais antigo para o mais novo</strong>
              </p>
            </div>
            <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60">
              Restam {allDueToday.length} Cartões
            </span>
          </div>

          {/* Filtro por Tipo de Revisão: Todas | Questões Caveira | Aulas do Ciclo */}
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { id: 'ALL', label: 'Todas as Revisões', count: allDueToday.length, activeClass: 'bg-slate-800 text-white border-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:border-white' },
              { id: 'CAVEIRA', label: '💀 Questões Caveira', count: caveiraDueCount, activeClass: 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-500/30' },
              { id: 'CICLO', label: '📚 Aulas do Ciclo', count: cicloDueCount, activeClass: 'bg-red-600 text-white border-red-500 ring-2 ring-red-500/30' }
            ].map(tab => {
              const isSelected = reviewTypeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setReviewTypeFilter(tab.id);
                    setSelectedSubjectFilter('ALL');
                    setCurrentCardIdx(0);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? tab.activeClass
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-[#1E2022] dark:text-slate-300 dark:border-[#34383D] dark:hover:bg-[#26292C]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${isSelected ? 'bg-black/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeReviewSubjects.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 snap-x items-center">
              <div className="flex items-center justify-center px-1 shrink-0" title="Filtrar por Disciplina">
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <button
                onClick={() => { setSelectedSubjectFilter('ALL'); setCurrentCardIdx(0); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm shrink-0 snap-start transition-all cursor-pointer ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                <span className="text-[12px] font-black uppercase tracking-wider">Todas</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded text-[11px] font-black">{typeFilteredDueToday.length}</span>
              </button>
              {activeReviewSubjects.map(({ subject, count }) => {
                const isSelected = selectedSubjectFilter === subject.id;
                return (
                  <button
                    key={subject.id}
                    onClick={() => { setSelectedSubjectFilter(isSelected ? 'ALL' : subject.id); setCurrentCardIdx(0); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm shrink-0 snap-start transition-all cursor-pointer ${subject.color} ${
                      isSelected ? 'ring-2 ring-purple-400 scale-105' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[12px] font-black uppercase tracking-wider">{subject.name}</span>
                    <span className="bg-white/40 px-1.5 py-0.5 rounded text-[11px] font-black backdrop-blur-sm border border-white/20 dark:bg-slate-900">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {!activeRev && (
            <div className="bg-white dark:bg-[#1E2022] border border-slate-200 dark:border-[#34383D] rounded-2xl p-6 text-center mb-8">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Nenhum cartão pendente neste filtro.
              </p>
              <button
                onClick={() => { setReviewTypeFilter('ALL'); setSelectedSubjectFilter('ALL'); setCurrentCardIdx(0); }}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-black uppercase bg-purple-600 text-white hover:bg-purple-500 cursor-pointer"
              >
                Mostrar Todas as Revisões ({allDueToday.length})
              </button>
            </div>
          )}

          {activeRev && (
            <div className="max-w-3xl mx-auto mb-8">
              {/* Barra de Progresso e Navegação 1 por 1 */}
              <div className="bg-white dark:bg-[#1E2022] border border-slate-200 dark:border-[#34383D] rounded-2xl p-3.5 sm:p-4 mb-4 shadow-sm flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/25">
                      Cartão {safeCardIdx + 1} de {filteredDueToday.length}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {safeCardIdx === 0 ? '⏳ Mais antigo da fila' : safeCardIdx === filteredDueToday.length - 1 ? '🆕 Mais recente da fila' : 'Ordem: Mais antigo ➔ Mais novo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={safeCardIdx <= 0}
                      onClick={() => setCurrentCardIdx(Math.max(0, safeCardIdx - 1))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-[#383D43] bg-slate-50 dark:bg-[#26292C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#303438] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button
                      disabled={safeCardIdx >= filteredDueToday.length - 1}
                      onClick={() => setCurrentCardIdx(Math.min(filteredDueToday.length - 1, safeCardIdx + 1))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-[#383D43] bg-slate-50 dark:bg-[#26292C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#303438] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Próximo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-[#26292C] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300"
                    style={{ width: `${Math.round(((safeCardIdx + 1) / filteredDueToday.length) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Cartão Único Ativo */}
              {(() => {
                const meta = getReviewSubjectMeta(activeRev);
                if (meta.isCaveira) {
                  return (
                    <CaveiraReviewQuestionModal
                      key={activeRev.id}
                      review={activeRev}
                      inline={true}
                    />
                  );
                }

                const thermo = getThermometer(activeRev.lastPerformance);
                return (
                  <div key={activeRev.id} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-between dark:bg-[#1E2022] dark:border-[#383D43]">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase border leading-tight ${meta.color}`}>
                          {meta.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${thermo.color}`} title="Termômetro de Memória">
                            {thermo.icon} {Math.round(activeRev.lastPerformance * 100 || 0)}%
                          </div>
                          {activeRev.trend !== 0 && activeRev.trend !== undefined && (
                            <div className={`flex items-center gap-0.5 text-[10px] font-black uppercase ${activeRev.trend > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                              {activeRev.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {activeRev.trend > 0 ? 'Melhora' : 'Queda'}
                            </div>
                          )}
                        </div>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-slate-800 leading-snug mb-4 dark:text-slate-100">
                        {activeRev.topicName}
                      </h4>

                      {activeRev.notes && (
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#26292C] p-4 rounded-2xl border border-slate-200/80 dark:border-[#34383D] mb-4 whitespace-pre-line">
                          {activeRev.notes}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-400 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100 dark:bg-[#26292C] dark:border-[#34383D]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>Intervalo Atual: <strong className="text-blue-500">{activeRev.interval} {activeRev.interval === 1 ? 'dia' : 'dias'}</strong></span>
                        </div>
                        <div>
                          <span>Estabilidade: <strong className="text-slate-700 dark:text-slate-200">{activeRev.stability?.toFixed(1) || 0}d</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setReviewModal(activeRev)}
                      className="mt-5 w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer bg-red-600 hover:bg-red-500 text-white"
                    >
                      Avaliar Retenção FSRS
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      ) : (
        <div className="text-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500 flex flex-col items-center mb-8 shadow-sm dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
          <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Missões Concluídas!</h3>
          <p className="text-sm mt-1">O seu cérebro está aquecido. Vá para o seu Ciclo avançar o edital.</p>
        </div>
      )}

      {/* PAINEL #13: PREVISÃO DE CARGA FSRS (7 DIAS) + ADIANTAMENTO TÁTICO + CURVA DE ESQUECIMENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Previsão de 7 Dias + Adiantamento Tático */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2022] rounded-2xl shadow-lg border border-slate-200 dark:border-[#34383D] p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Previsão de Carga FSRS (Próximos 7 Dias)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total agendado na semana: <strong>{totalNext7Days} cartões</strong> • Clique em <strong>⚡ Adiantar</strong> para puxar um dia pesado para hoje.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 items-end pt-4">
            {next7DaysForecast.map(day => {
              const barHeightPct = day.total > 0 ? Math.max(18, Math.round((day.total / maxForecastCount) * 100)) : 8;
              const isHeavy = day.total >= 10;
              return (
                <div
                  key={day.dateStr}
                  className="flex flex-col items-center bg-slate-50 dark:bg-[#26292C] border border-slate-200/80 dark:border-[#34383D] rounded-xl p-2 transition-all"
                >
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {day.offset === 1 ? 'Amanhã' : day.label.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mb-2">{day.shortDate}</span>

                  <div className="w-full h-24 bg-slate-200/60 dark:bg-[#1E2022] rounded-lg flex flex-col justify-end p-1 overflow-hidden relative">
                    <div
                      className={`w-full rounded-md transition-all duration-300 ${
                        day.total === 0
                          ? 'bg-slate-300 dark:bg-slate-800'
                          : isHeavy
                          ? 'bg-gradient-to-t from-red-600 to-amber-500'
                          : 'bg-gradient-to-t from-purple-600 to-blue-500'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                    <span className="absolute inset-x-0 top-1.5 text-center font-black text-xs text-slate-800 dark:text-white">
                      {day.total}
                    </span>
                  </div>

                  <div className="text-[9px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
                    <span title="Questões Caveira">💀{day.caveiraCount}</span>
                    <span>•</span>
                    <span title="Aulas do Ciclo">📚{day.cicloCount}</span>
                  </div>

                  <button
                    type="button"
                    disabled={day.total === 0}
                    onClick={() => advanceFutureReviews(day.dateStr)}
                    title={day.total > 0 ? `Adiantar ${day.total} revisões de ${day.shortDate} para hoje` : 'Sem revisões agendadas'}
                    className="mt-2 w-full py-1 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    ⚡ Adiantar
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curva de Esquecimento de Ebbinghaus / FSRS */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E2022] rounded-2xl shadow-lg border border-slate-200 dark:border-[#34383D] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Curva de Esquecimento FSRS
              </h3>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Estab. Média: {typeof avgStabilityDays === 'number' && !isNaN(avgStabilityDays) ? avgStabilityDays.toFixed(1) : '0.0'}d
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Projeção de retenção da sua memória ao longo dos dias sem revisar (Meta FSRS: revisar ao atingir <strong>90%</strong>).
            </p>
          </div>

          <div className="space-y-2.5 my-auto">
            {forgettingCurvePoints.map(pt => {
              const isAboveTarget = pt.retention >= 90;
              const isWarning = pt.retention >= 75 && pt.retention < 90;
              return (
                <div key={pt.daysElapsed} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300 font-mono">{pt.label}</span>
                    <span className={isAboveTarget ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400'}>
                      {pt.retention}% de retenção estimada
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-[#26292C] rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAboveTarget ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pt.retention}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2E3236] flex items-center justify-between text-[11px] text-slate-400">
            <span>🎯 Gatilho ideal de revisão: <strong>90%</strong></span>
            <span>🃏 Cartões monitorados: <strong>{reviews.length}</strong></span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden mt-6">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400"/> Mapeamento FSRS (Heatmap)
          </h3>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{mesesNomes[rMonth]} {rYear}</span>
            <div className="flex gap-1">
              <button onClick={() => setReviewCalendarDate(new Date(rYear, rMonth - 1, 1))} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setReviewCalendarDate(new Date(rYear, rMonth + 1, 1))} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {diasSemana.map(dia => <div key={dia} className="text-center font-black text-slate-500 uppercase tracking-widest text-[9px] sm:text-xs dark:text-slate-400">{dia}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {rBlanks.map((_, i) => <div key={`blank-${i}`} className="min-h-[4rem] sm:min-h-[6rem] bg-slate-800/30 rounded-lg"></div>)}
            {rDays.map(day => {
              const d = new Date(rYear, rMonth, day);
              const dateStr = getLocalDateStr(d);
              const dayRevs = reviews.filter(r => r.nextDateStr === dateStr);
              const isTodayStr = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              
              let heatClass = "bg-slate-800 border-slate-700";
              if (isTodayStr) heatClass = "bg-blue-900/40 border-blue-500 ring-1 ring-blue-500/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]";
              else if (isPast) heatClass = "bg-slate-800/30 border-slate-800 opacity-60";
              else if (dayRevs.length > 8) heatClass = "bg-red-900/20 border-red-800 shadow-[inset_0_0_10px_rgba(220,38,38,0.15)]";
              else if (dayRevs.length > 4) heatClass = "bg-orange-900/20 border-orange-800/60";

              return (
                <div key={day} className={`min-h-[4.5rem] sm:min-h-[6rem] p-1.5 sm:p-2 rounded-lg flex flex-col border transition-all ${heatClass}`}>
                  <div className="flex justify-between items-start mb-1 gap-1">
                    <span className={`font-black text-[10px] sm:text-xs ${isTodayStr ? 'text-blue-400' : isPast ? 'text-slate-500' : 'text-slate-300'}`}>{day}</span>
                    {dayRevs.length > 0 && (
                      <span className={`text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded shadow-sm ${isPast ? 'bg-slate-700 text-slate-400' : dayRevs.length > 8 ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
                        {dayRevs.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-0.5 mt-auto overflow-hidden">
                    {(() => {
                      if (dayRevs.length === 0) return null;
                      const subjectCounts = {};
                      dayRevs.forEach(r => {
                        const meta = getReviewSubjectMeta(r);
                        if (!subjectCounts[meta.id]) {
                          subjectCounts[meta.id] = { name: meta.name, color: meta.color, count: 0 };
                        }
                        subjectCounts[meta.id].count += 1;
                      });
                      
                      const items = Object.values(subjectCounts);

                      return (
                        <>
                          {items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between text-[9px] sm:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded-sm leading-none mb-0.5 ${item.color}`} title={`${item.name} (${item.count} resoluções)`}>
                              <span className="truncate flex-1 uppercase">{item.name}</span>
                              <span className="shrink-0 ml-1 opacity-70">({item.count})</span>
                            </div>
                          ))}
                          {items.length > 3 && (
                            <span className="text-[7px] font-bold text-slate-500 ml-3 dark:text-slate-400">+{items.length - 3}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
