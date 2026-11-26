import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import StudyConsistencyHeatmap from '../components/StudyConsistencyHeatmap';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { FastForward, BarChart2, Printer } from 'lucide-react';

export default function Estatisticas() {
  const { subjects, weeklySprint, userStats, studyHistory = {}, getLocalDateStr, isSyncing, isDarkMode } = useStore();
  const [chartDays, setChartDays] = useState(15);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateStr(d);
      const minutes = studyHistory[dateStr] || 0;
      const day = d.getDate().toString().padStart(2, '0');
      data.push({
        dateKey: dateStr,
        label: `${day}/${monthsShort[d.getMonth()]}`,
        minutes,
        hours: parseFloat((minutes / 60).toFixed(1))
      });
    }
    return data;
  }, [studyHistory, chartDays, getLocalDateStr]);

  let totalEdital = 0;
  let completedEdital = 0;
  let subjectsFinished = 0;
  let b1C = 0, b1T = 0, b2C = 0, b2T = 0, b3C = 0, b3T = 0;

  const stats = Object.values(subjects || {})
    .map((sub) => {
      let subTotal = 0;
      let subCompleted = 0;
      (sub.topics || []).forEach((t) => {
        subTotal += t.total;
        subCompleted += t.completed;
      });
      totalEdital += subTotal;
      completedEdital += subCompleted;
      if (subTotal > 0 && subCompleted === subTotal) subjectsFinished++;

      if (sub.block === 'B1') { b1C += subCompleted; b1T += subTotal; }
      else if (sub.block === 'B2') { b2C += subCompleted; b2T += subTotal; }
      else if (sub.block === 'B3') { b3C += subCompleted; b3T += subTotal; }

      return {
        ...sub,
        total: subTotal,
        completed: subCompleted,
        progress: subTotal === 0 ? 0 : Math.round((subCompleted / subTotal) * 100)
      };
    })
    .sort((a, b) => b.progress - a.progress);

  const b1Percent = b1T === 0 ? 0 : Math.round((b1C / b1T) * 100);
  const b2Percent = b2T === 0 ? 0 : Math.round((b2C / b2T) * 100);
  const b3Percent = b3T === 0 ? 0 : Math.round((b3C / b3T) * 100);

  const overallProgress = totalEdital === 0 ? 0 : Math.round((completedEdital / totalEdital) * 100);
  const subjectsPercent = stats.length === 0 ? 0 : Math.round((subjectsFinished / stats.length) * 100);
  const sprintProgress =
    weeklySprint.goalHours > 0 ? (weeklySprint.currentMinutes / (weeklySprint.goalHours * 60)) * 100 : 0;
  const xpProgress = Math.min(100, (userStats.xp / 10000) * 100);
  const sprintCompleted = weeklySprint.goalHours > 0 && weeklySprint.currentMinutes >= weeklySprint.goalHours * 60;

  const radarData = [
    { subject: 'Bloco 1', A: b1Percent, fullMark: 100 },
    { subject: 'Bloco 2', A: b2Percent, fullMark: 100 },
    { subject: 'Bloco 3', A: b3Percent, fullMark: 100 },
    { subject: 'Sprint', A: Math.min(100, sprintProgress), fullMark: 100 },
    { subject: 'XP Total', A: xpProgress, fullMark: 100 },
  ];

  const renderCircularChart = (progress, label, valueText, subText, color) => {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(100, progress) / 100) * circumference;

    return (
      <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="transform -rotate-90 w-16 h-16" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5.5"
              fill="transparent"
              className="text-slate-100 dark:text-slate-850"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={color}
              strokeWidth="5.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute font-mono text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {progress}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{label}</span>
          <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white leading-tight tabular-nums block mt-0.5">
            {valueText}
          </span>
          {subText && (
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">{subText}</span>
          )}
        </div>
      </div>
    );
  };

  if (isSyncing) {
    return (
      <div className="fade-in w-full pb-10 space-y-5 animate-pulse">
        <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          <div className="h-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in w-full pb-8 space-y-5">
      {/* Cabeçalho Unificado Transparente */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Histórico e Desempenho
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>Edital {overallProgress}% concluído</span>
            <span aria-hidden="true">·</span>
            <span>{completedEdital}/{totalEdital} aulas</span>
            <span aria-hidden="true">·</span>
            <span>{userStats.xp.toLocaleString()} XP acumulado</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print h-9 px-3.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Printer className="w-3.5 h-3.5 text-sky-500" />
          <span>Exportar PDF</span>
        </button>
      </div>

      {/* KPI Strip — 3 Colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {renderCircularChart(overallProgress, 'Avanço geral', `${overallProgress}%`, 'Edital verticalizado', '#0ea5e9')}
        {renderCircularChart(overallProgress, 'Aulas concluídas', `${completedEdital}`, `de ${totalEdital} teóricas`, '#14b8a6')}
        {renderCircularChart(subjectsPercent, 'Disciplinas fechadas', `${subjectsFinished}`, `de ${stats.length} matérias`, '#f59e0b')}
      </div>

      {/* Radar + Sprint Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="mb-2">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Equilíbrio entre frentes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribuição do progresso nos blocos do edital, sprint e XP.
            </p>
          </div>
          {stats.length > 0 ? (
            <div className="w-full h-[210px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 400, height: 210 }}>
                <RadarChart cx="50%" cy="50%" outerRadius="74%" data={radarData}>
                  <PolarGrid stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Evolução" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BarChart2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Sem dados suficientes para o radar</p>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FastForward className="w-4 h-4 text-sky-500" />
                <span>Sprint semanal</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Meta de {weeklySprint.goalHours}h semanais de estudo líquido.
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                sprintCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              {sprintCompleted ? 'Meta atingida' : 'Em andamento'}
            </span>
          </div>

          <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Realizado na semana</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {Math.floor(weeklySprint.currentMinutes / 60)}h {weeklySprint.currentMinutes % 60}min
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Meta semanal</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {weeklySprint.goalHours}h
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Saldo de XP</span>
                <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                  {userStats.xp.toLocaleString()} XP
                </span>
              </div>
            </div>

            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-850"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#0ea5e9"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 - (Math.min(100, sprintProgress) / 100) * (2 * Math.PI * 40)}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {Math.round(sprintProgress)}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Meta</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Gráfico de Evolução Temporal */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Evolução diária de estudos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Minutos registrados por dia no período selecionado.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 no-print">
            {[7, 15, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setChartDays(days)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  chartDays === days
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-[220px] sm:h-[250px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 600, height: 220 }}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartMinutesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
                unit="m"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
                        <p className="text-slate-400 font-mono">{data.dateKey}</p>
                        <p className="font-mono font-bold text-sky-400 mt-0.5 tabular-nums">
                          {data.minutes} min ({data.hours}h)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#chartMinutesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Mapa de Consistência */}
      <StudyConsistencyHeatmap />
    </div>
  );
}
