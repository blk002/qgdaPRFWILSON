import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import CaveiraReviewQuestionModal from '../components/CaveiraReviewQuestionModal';
import ActiveMissionBanner from '../components/ActiveMissionBanner';
import ProgressiveReviewCard from '../components/ProgressiveReviewCard';
import {
  AlertTriangle, Clock, ChevronLeft, ChevronRight, CalendarDays,
  CheckCircle, TrendingUp, TrendingDown, Zap, Activity, Flame
} from 'lucide-react';

export default function Revisoes() {
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('ALL');
  const {
    reviews,
    progressiveReviews = [],
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
    advanceFutureReviews,
    startPracticeMission,
    advanceProgressiveReviewToToday,
    deleteProgressiveReview,
    todayKey
  } = useStore();

  useEffect(() => {
    setReviewCalendarDate(new Date());
  }, [setReviewCalendarDate]);

  useEffect(() => {
    syncAndRepairCaveiraReviews?.();
  }, [reviews.length, caveiraQuestions.length, syncAndRepairCaveiraReviews]);

  const caveiraTimeMap = useMemo(() => {
    const map = new Map();
    caveiraQuestions.forEach((q, idx) => {
      if (q && q.id) {
        const ts = q.timestamp ? new Date(q.timestamp).getTime() : NaN;
        map.set(String(q.id).toUpperCase(), {
          ts: Number.isFinite(ts) ? ts : null,
          reverseOrder: caveiraQuestions.length - idx
        });
      }
    });
    return map;
  }, [caveiraQuestions]);

  if (!reviewCalendarDate) return null;
  void todayKey;
  const todayStr = getLocalDateStr();

  const isCaveiraCard = (rev) =>
    Boolean(
      rev.isCaveiraQuestion ||
        rev.questionData ||
        String(rev.id || '').startsWith('rev_caveira_') ||
        String(rev.topicName || '').startsWith('[Caveira')
    );

  const getReviewSubjectMeta = (rev) => {
    const sub = subjects[rev.subjectId];
    if (rev.isProgressiveReview) {
      return {
        id: rev.subjectId || `prog_${rev.subjectName || 'geral'}`,
        name: sub?.name || rev.subjectName || 'Aula',
        color: sub?.color || 'bg-sky-500 text-white',
        isCaveira: false,
        isProgressive: true,
      };
    }
    const caveira = isCaveiraCard(rev);
    if (caveira) {
      const name =
        rev.customSubjectName ||
        rev.questionData?.canonicalSubject ||
        rev.questionData?.subject ||
        sub?.name ||
        'Questão Caveira';
      const color = sub?.color || 'bg-purple-600 text-white';
      return { id: `caveira_${name}`, name, color, isCaveira: true };
    }
    return {
      id: rev.subjectId || 'geral',
      name: sub?.name || rev.customSubjectName || 'Geral',
      color: sub?.color || 'bg-slate-600 text-white',
      isCaveira: false
    };
  };

  const dueProgressive = (progressiveReviews || [])
    .filter((r) => r && r.nextDateStr <= todayStr)
    .map((r) => ({ ...r, isProgressiveReview: true }))
    .sort((a, b) => String(a.nextDateStr || '').localeCompare(String(b.nextDateStr || '')));

  const fsrsDueSorted = getPendingReviews()
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

      if (metaA.ts !== null && metaB.ts !== null && metaA.ts !== metaB.ts) return metaA.ts - metaB.ts;
      if (metaA.reverseOrder !== metaB.reverseOrder) return metaA.reverseOrder - metaB.reverseOrder;
      if (metaA.qNum !== metaB.qNum) return metaA.qNum - metaB.qNum;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

  const allDueToday = [...dueProgressive, ...fsrsDueSorted];
  const progressiveDueCount = dueProgressive.length;
  const caveiraDueCount = fsrsDueSorted.filter((rev) => isCaveiraCard(rev)).length;

  const typeFilteredDueToday = allDueToday.filter((rev) => {
    if (reviewTypeFilter === 'PROGRESSIVE') return Boolean(rev.isProgressiveReview);
    if (reviewTypeFilter === 'CAVEIRA') return isCaveiraCard(rev);
    return true;
  });

  const filteredDueToday =
    selectedSubjectFilter === 'ALL'
      ? typeFilteredDueToday
      : typeFilteredDueToday.filter((rev) => getReviewSubjectMeta(rev).id === selectedSubjectFilter);

  const safeCardIdx =
    filteredDueToday.length > 0 ? Math.min(currentCardIdx, filteredDueToday.length - 1) : 0;
  const activeRev = filteredDueToday[safeCardIdx] || null;
  const backlogCount = Math.max(0, allDueToday.length - 12);
  const isProcrastinating = backlogCount > 5;

  const subjectsDueMap = {};
  typeFilteredDueToday.forEach((rev) => {
    const meta = getReviewSubjectMeta(rev);
    if (!subjectsDueMap[meta.id]) {
      subjectsDueMap[meta.id] = { subject: meta, count: 0 };
    }
    subjectsDueMap[meta.id].count += 1;
  });
  const activeReviewSubjects = Object.values(subjectsDueMap).sort((a, b) => b.count - a.count);

  const perfReviews = reviews.filter((r) => r.lastPerformance !== undefined);
  const avgMemoryHealth =
    perfReviews.length > 0
      ? Math.round((perfReviews.reduce((acc, r) => acc + r.lastPerformance, 0) / perfReviews.length) * 100)
      : 0;
  const globalHitRate =
    reviewStats.totalDone > 0 ? Math.round((reviewStats.correct / reviewStats.totalDone) * 100) : 0;

  const rawRevDate = reviewCalendarDate ? new Date(reviewCalendarDate) : new Date();
  const safeRevDate = isNaN(rawRevDate.getTime()) ? new Date() : rawRevDate;
  const rYear = safeRevDate.getFullYear();
  const rMonth = safeRevDate.getMonth();
  const rDaysInMonth = new Date(rYear, rMonth + 1, 0).getDate();
  const rFirstDayIndex = new Date(rYear, rMonth, 1).getDay();
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const rBlanks = Array(rFirstDayIndex).fill(null);
  const rDays = Array.from({ length: rDaysInMonth }, (_, i) => i + 1);

  const baseToday = getTodayDate ? getTodayDate() : new Date();
  const next7DaysForecast = Array.from({ length: 7 }, (_, i) => {
    const offset = i + 1;
    const d = new Date(baseToday);
    d.setDate(d.getDate() + offset);
    const dateStr = getLocalDateStr(d);
    const dayRevs = reviews.filter((r) => r.nextDateStr === dateStr);
    const dayProg = (progressiveReviews || []).filter((r) => r && r.nextDateStr === dateStr);
    const caveiraCount = dayRevs.filter((r) => isCaveiraCard(r)).length;
    const dayName = diasSemana[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    return {
      offset,
      dateStr,
      label: offset === 1 ? 'Amanhã' : dayName,
      shortDate: `${dayNum}/${monthNum}`,
      total: dayRevs.length + dayProg.length,
      caveiraCount
    };
  });
  const maxForecastCount = Math.max(5, ...next7DaysForecast.map((f) => f.total));
  const totalNext7Days = next7DaysForecast.reduce((acc, f) => acc + f.total, 0);

  const cardsWithStability = reviews.filter((r) => Number(r.stability) > 0);
  const avgStabilityDays =
    cardsWithStability.length > 0
      ? cardsWithStability.reduce((acc, r) => acc + Number(r.stability || 0), 0) / cardsWithStability.length
      : 3.5;

  const forgettingCurvePoints = [0, 1, 3, 7, 14, 30].map((daysElapsed) => {
    const retention = Math.round(Math.pow(1 + daysElapsed / (9 * Math.max(0.5, avgStabilityDays)), -1) * 100);
    return {
      daysElapsed,
      label: daysElapsed === 0 ? 'Hoje (0d)' : `+${daysElapsed}d`,
      retention: Math.max(15, Math.min(100, retention))
    };
  });

  return (
    <div className="fade-in w-full pb-8 space-y-5">
      {/* Cabeçalho Unificado Transparente */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Revisões FSRS
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Espaçamento inteligente</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {allDueToday.length === 0
                ? 'Fila zerada'
                : `${allDueToday.length} ${allDueToday.length === 1 ? 'cartão pendente' : 'cartões pendentes'}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{reviews.length} monitorados</span>
          </div>
        </div>

        {/* Métricas Inline */}
        <div className="flex items-center gap-5 shrink-0 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Acerto global</span>
            <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
              {globalHitRate}%
            </span>
          </div>
          <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Retenção</span>
            <span
              className={`font-mono text-base font-bold tabular-nums ${
                avgMemoryHealth >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : avgMemoryHealth >= 70
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {avgMemoryHealth}%
            </span>
          </div>
          <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Sequência</span>
            <span className="font-mono text-base font-bold tabular-nums text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              {reviewStats.streak}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de acúmulo */}
      <ActiveMissionBanner />
      {isProcrastinating && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-red-800 dark:text-red-300">
              Acúmulo de {backlogCount} revisões atrasadas
            </p>
            <p className="text-red-700/80 dark:text-red-300/80 mt-0.5">
              Limpe a fila de hoje para interromper a penalidade de moedas e proteger sua retenção.
            </p>
          </div>
        </div>
      )}

      {/* Fila Estratégica de Hoje */}
      {allDueToday.length > 0 ? (
        <section className="space-y-4">
          {/* Controles de Filtro */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              {[
                { id: 'ALL', label: 'Todas', count: allDueToday.length },
                { id: 'PROGRESSIVE', label: 'Revisões de Aula (5q)', count: progressiveDueCount },
                { id: 'CAVEIRA', label: 'Questões Caveira', count: caveiraDueCount }
              ].map((tab) => {
                const isSelected = reviewTypeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setReviewTypeFilter(tab.id);
                      setSelectedSubjectFilter('ALL');
                      setCurrentCardIdx(0);
                    }}
                    className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="font-mono text-[11px] tabular-nums opacity-70">{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {activeReviewSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectFilter('ALL');
                    setCurrentCardIdx(0);
                  }}
                  className={`h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedSubjectFilter === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  Todas ({typeFilteredDueToday.length})
                </button>
                {activeReviewSubjects.map(({ subject, count }) => {
                  const isSelected = selectedSubjectFilter === subject.id;
                  const dotClass = String(subject.color || '').split(' ')[0] || 'bg-sky-500';
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubjectFilter(isSelected ? 'ALL' : subject.id);
                        setCurrentCardIdx(0);
                      }}
                      className={`h-8 px-2.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/40'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                      <span>{subject.name}</span>
                      <span className="font-mono text-[11px] tabular-nums opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!activeRev ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nenhum cartão pendente neste filtro.
              </p>
              <button
                type="button"
                onClick={() => {
                  setReviewTypeFilter('ALL');
                  setSelectedSubjectFilter('ALL');
                  setCurrentCardIdx(0);
                }}
                className="mt-3 h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
              >
                Mostrar todas ({allDueToday.length})
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Barra de Navegação 1 por 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      Cartão {safeCardIdx + 1} de {filteredDueToday.length}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Ordem cronológica (mais antigo primeiro)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeCardIdx <= 0}
                      onClick={() => setCurrentCardIdx(Math.max(0, safeCardIdx - 1))}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      disabled={safeCardIdx >= filteredDueToday.length - 1}
                      onClick={() => setCurrentCardIdx(Math.min(filteredDueToday.length - 1, safeCardIdx + 1))}
                      className="h-8 px-2.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Próximo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${Math.round(((safeCardIdx + 1) / filteredDueToday.length) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Cartão Ativo */}
              {(() => {
                if (activeRev.isProgressiveReview) {
                  return (
                    <ProgressiveReviewCard
                      key={activeRev.id}
                      review={activeRev}
                      subjectColor={subjects?.[activeRev.subjectId]?.color}
                      todayStr={todayStr}
                      onStartMission={startPracticeMission}
                      onAdvanceToToday={advanceProgressiveReviewToToday}
                      onDelete={deleteProgressiveReview}
                    />
                  );
                }
                const meta = getReviewSubjectMeta(activeRev);
                if (meta.isCaveira) {
                  return <CaveiraReviewQuestionModal key={activeRev.id} review={activeRev} inline={true} />;
                }

                const thermo = getThermometer(activeRev.lastPerformance);
                const dotClass = String(meta.color || '').split(' ')[0] || 'bg-sky-500';
                return (
                  <div
                    key={activeRev.id}
                    className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Retenção {Math.round(activeRev.lastPerformance * 100 || 0)}%
                        </span>
                      </div>

                      {activeRev.trend !== 0 && activeRev.trend !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            activeRev.trend > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {activeRev.trend > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          {activeRev.trend > 0 ? 'Melhora' : 'Queda'}
                        </span>
                      )}
                    </div>

                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {activeRev.topicName}
                    </h2>

                    {activeRev.notes && (
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850/60 p-4 rounded-lg border border-slate-200/70 dark:border-slate-800 whitespace-pre-line">
                        {activeRev.notes}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                          Intervalo:{' '}
                          <strong className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {activeRev.interval} {activeRev.interval === 1 ? 'dia' : 'dias'}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Estabilidade:{' '}
                          <strong className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            {activeRev.stability?.toFixed(1) || 0}d
                          </strong>
                        </span>
                        {thermo?.label && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{thermo.label}</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setReviewModal(activeRev)}
                        className="h-9 px-4 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors cursor-pointer"
                      >
                        Avaliar retenção
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      ) : (
        <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Fila de hoje concluída
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Todas as revisões FSRS programadas para hoje estão em dia.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            100% em dia
          </span>
        </div>
      )}

      {/* Trilha de Maestria das Aulas */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Trilha de Maestria das Aulas (5 níveis · 5q · 100%)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {(progressiveReviews || []).length > 0
                ? `${(progressiveReviews || []).length} ${(progressiveReviews || []).length === 1 ? 'aula monitorada' : 'aulas monitoradas'} · Suba de nível ao gabaritar 5/5 questões inéditas.`
                : 'Nenhuma aula monitorada ainda · Conclua a fixação inicial de 10 questões (Muito fácil) ao assistir uma aula para iniciar a trilha.'}
            </p>
          </div>
        </div>
        {(progressiveReviews || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(progressiveReviews || []).slice(0, 6).map((progRev) => (
              <ProgressiveReviewCard
                key={progRev.id}
                review={progRev}
                subjectColor={subjects?.[progRev.subjectId]?.color}
                todayStr={todayStr}
                compact
                onStartMission={startPracticeMission}
                onAdvanceToToday={advanceProgressiveReviewToToday}
                onDelete={deleteProgressiveReview}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            Assim que você concluir a última parte de uma aula e finalizar as 10 questões de fixação, a primeira revisão de 5 questões será agendada automaticamente aqui.
          </div>
        )}
      </section>

      {/* Previsão de 7 Dias + Curva de Esquecimento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Previsão de 7 Dias */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-500" />
                <span>Previsão dos próximos 7 dias</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {totalNext7Days} cartões programados · Adiante revisões de dias futuros quando tiver folga.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end">
            {next7DaysForecast.map((day) => {
              const barHeightPct =
                day.total > 0 ? Math.max(18, Math.round((day.total / maxForecastCount) * 100)) : 6;
              const isHeavy = day.total >= 10;
              return (
                <div key={day.dateStr} className="min-w-0 flex flex-col items-center gap-1.5">
                  <div className="text-center">
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block truncate">
                      {day.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">{day.shortDate}</span>
                  </div>

                  <div className="w-full h-16 bg-slate-100 dark:bg-slate-850 rounded-lg flex flex-col justify-end p-1 relative overflow-hidden">
                    <div
                      className={`w-full rounded-sm transition-all duration-300 ${
                        day.total === 0
                          ? 'bg-slate-200 dark:bg-slate-800'
                          : isHeavy
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                    <span className="absolute inset-x-0 top-1 text-center font-mono font-bold text-xs tabular-nums text-slate-800 dark:text-slate-100">
                      {day.total}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={day.total === 0}
                    onClick={() => advanceFutureReviews(day.dateStr)}
                    title={
                      day.total > 0
                        ? `Adiantar ${day.total} revisões de ${day.shortDate} para hoje`
                        : 'Sem revisões agendadas'
                    }
                    className="w-full h-7 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-sky-600 text-slate-700 hover:text-white dark:bg-slate-850 dark:hover:bg-sky-500 dark:text-slate-300 dark:hover:text-slate-950 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    Adiantar
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Curva de Esquecimento FSRS */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Curva de retenção FSRS</span>
              </h2>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                Estab. {typeof avgStabilityDays === 'number' && !isNaN(avgStabilityDays) ? avgStabilityDays.toFixed(1) : '0.0'}d
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Projeção média de memória (gatilho de revisão em 90%).
            </p>
          </div>

          <div className="space-y-2">
            {forgettingCurvePoints.map((pt) => {
              const isAboveTarget = pt.retention >= 90;
              const isWarning = pt.retention >= 75 && pt.retention < 90;
              return (
                <div key={pt.daysElapsed} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-mono tabular-nums">{pt.label}</span>
                    <span
                      className={`font-mono font-semibold tabular-nums ${
                        isAboveTarget
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isWarning
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {pt.retention}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAboveTarget ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pt.retention}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Calendário Mensal de Revisões (Light + Dark Mode Completo) */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-sky-500" />
            <span>Calendário de revisões</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {mesesNomes[rMonth]} {rYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setReviewCalendarDate(new Date(rYear, rMonth - 1, 1))}
                aria-label="Mês anterior"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setReviewCalendarDate(new Date())}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setReviewCalendarDate(new Date(rYear, rMonth + 1, 1))}
                aria-label="Próximo mês"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="text-center text-xs font-medium text-slate-400 dark:text-slate-500"
              >
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {rBlanks.map((_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-[3.75rem] sm:min-h-[4.5rem] bg-slate-50/50 dark:bg-slate-950/30 rounded-lg"
              />
            ))}
            {rDays.map((day) => {
              const d = new Date(rYear, rMonth, day);
              const dateStr = getLocalDateStr(d);
              const dayRevs = [
                ...(reviews || []).filter((r) => r && r.nextDateStr === dateStr),
                ...(progressiveReviews || [])
                  .filter((r) => r && r.nextDateStr === dateStr)
                  .map((r) => ({ ...r, isProgressiveReview: true })),
              ];
              const isTodayStr = dateStr === todayStr;
              const isPast = dateStr < todayStr;

              let cellClass = 'bg-slate-50/70 dark:bg-slate-850/40 border-slate-200/70 dark:border-slate-800';
              if (isTodayStr) {
                cellClass = 'bg-sky-50 dark:bg-sky-950/30 border-sky-500/60 ring-1 ring-sky-500/30';
              } else if (isPast) {
                cellClass = 'bg-slate-50/40 dark:bg-slate-950/30 border-slate-200/50 dark:border-slate-800/60 opacity-60';
              } else if (dayRevs.length > 8) {
                cellClass = 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/50';
              } else if (dayRevs.length > 4) {
                cellClass = 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50';
              }

              const subjectCounts = {};
              dayRevs.forEach((r) => {
                const meta = getReviewSubjectMeta(r);
                if (!subjectCounts[meta.id]) {
                  subjectCounts[meta.id] = { name: meta.name, color: meta.color, count: 0 };
                }
                subjectCounts[meta.id].count += 1;
              });
              const items = Object.values(subjectCounts);

              return (
                <div
                  key={day}
                  className={`min-h-[3.75rem] sm:min-h-[4.5rem] p-1.5 rounded-lg flex flex-col border transition-colors ${cellClass}`}
                >
                  <div className="flex justify-between items-center mb-1 gap-1">
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        isTodayStr
                          ? 'text-sky-600 dark:text-sky-400'
                          : isPast
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayRevs.length > 0 && (
                      <span
                        className={`font-mono text-[11px] font-bold tabular-nums ${
                          isPast
                            ? 'text-slate-400'
                            : dayRevs.length > 8
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {dayRevs.length}
                      </span>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="flex-1 flex flex-col gap-0.5 mt-auto overflow-hidden">
                      {items.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between text-[10px] font-medium px-1.5 py-0.5 rounded leading-tight ${item.color}`}
                          title={`${item.name} (${item.count})`}
                        >
                          <span className="truncate flex-1">{item.name}</span>
                          <span className="shrink-0 ml-1 font-mono opacity-80">{item.count}</span>
                        </div>
                      ))}
                      {items.length > 2 && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 px-1">
                          +{items.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
