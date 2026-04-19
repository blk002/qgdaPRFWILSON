import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Dumbbell, Plus, TrendingUp, Edit2, Trash2, Calendar as CalendarIcon, Check, Play, BarChart2, Trophy, Activity, Info } from 'lucide-react';

// --- TAF Calculation Helpers ---
const calcBarra = (val, isM) => {
  if (isM) {
    if (val < 3) return 0; if (val === 3) return 2; if (val === 4) return 2.5;
    if (val === 5) return 3; if (val === 6) return 3.5; if (val === 7) return 4;
    if (val === 8) return 4.5; return 5;
  } else {
    if (val < 10) return 0; if (val < 13) return 2; if (val < 16) return 2.5;
    if (val < 19) return 3; if (val < 22) return 3.5; if (val < 25) return 4;
    if (val < 28) return 4.5; return 5;
  }
};

const calcAbdominal = (val, isM) => {
  if (isM) {
    if (val < 35) return 0; if (val <= 38) return 2; if (val <= 42) return 2.5;
    if (val <= 46) return 3; if (val <= 50) return 3.5; if (val <= 54) return 4;
    if (val <= 58) return 4.5; return 5;
  } else {
    if (val < 28) return 0; if (val <= 30) return 2; if (val <= 33) return 2.5;
    if (val <= 36) return 3; if (val <= 39) return 3.5; if (val <= 42) return 4;
    if (val <= 45) return 4.5; return 5;
  }
};

const calcImpulsao = (val, isM) => {
  if (isM) {
    if (val <= 2.00) return 0; if (val <= 2.05) return 2; if (val <= 2.10) return 2.5;
    if (val <= 2.15) return 3; if (val <= 2.20) return 3.5; if (val <= 2.25) return 4;
    if (val <= 2.30) return 4.5; return 5;
  } else {
    if (val <= 1.60) return 0; if (val <= 1.65) return 2; if (val <= 1.70) return 2.5;
    if (val <= 1.75) return 3; if (val <= 1.80) return 3.5; if (val <= 1.85) return 4;
    if (val <= 1.90) return 4.5; return 5;
  }
};

const calcCorrida = (val, isM) => {
  if (isM) {
    if (val <= 2300) return 0; if (val <= 2400) return 2; if (val <= 2500) return 2.5;
    if (val <= 2600) return 3; if (val <= 2700) return 3.5; if (val <= 2800) return 4;
    if (val <= 2900) return 4.5; return 5;
  } else {
    if (val <= 2000) return 0; if (val <= 2100) return 2; if (val <= 2200) return 2.5;
    if (val <= 2300) return 3; if (val <= 2400) return 3.5; if (val <= 2500) return 4;
    if (val <= 2600) return 4.5; return 5;
  }
};

const calcShuttle = (val, isM) => {
  if (isM) {
    if (val >= 14) return 0; if (val >= 13.5) return 2; if (val >= 13) return 2.5;
    if (val >= 12.5) return 3; if (val >= 12) return 3.5; if (val >= 11.5) return 4;
    if (val >= 11) return 4.5; return 5;
  } else {
    if (val >= 16) return 0; if (val >= 15.5) return 2; if (val >= 15) return 2.5;
    if (val >= 14.5) return 3; if (val >= 14) return 3.5; if (val >= 13.5) return 4;
    if (val >= 13) return 4.5; return 5;
  }
};

export default function TreinoTAF() {
  const {
    tafHistory,
    setTafHistory,
    tafTrainingStatus,
    getLocalDateStr,
    completeTafTraining,
    addXP,
    unlockMedal
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingTaf, setEditingTaf] = useState(null);

  const totalSimuladosTaf = tafHistory.length;
  const mediaPts = totalSimuladosTaf > 0 ? (tafHistory.reduce((acc, sim) => acc + sim.totalPts, 0) / totalSimuladosTaf).toFixed(1) : 0;
  const recordePts = totalSimuladosTaf > 0 ? Math.max(...tafHistory.map(s => s.totalPts)) : 0;
  
  let weakTest = "Aguardando Simulados";
  if (totalSimuladosTaf > 0) {
    const avgBarra = tafHistory.reduce((acc, sim) => acc + sim.ptsBarra, 0);
    const avgAbdominal = tafHistory.reduce((acc, sim) => acc + sim.ptsAbdominal, 0);
    const avgImpulsao = tafHistory.reduce((acc, sim) => acc + sim.ptsImpulsao, 0);
    const avgCorrida = tafHistory.reduce((acc, sim) => acc + sim.ptsCorrida, 0);
    const avgShuttle = tafHistory.reduce((acc, sim) => acc + sim.ptsShuttle, 0);

    const avgs = [
      { name: "Barra Fixa", val: avgBarra },
      { name: "Abdominal", val: avgAbdominal },
      { name: "Impulsão", val: avgImpulsao },
      { name: "Corrida", val: avgCorrida },
      { name: "Shuttle", val: avgShuttle }
    ];
    avgs.sort((a, b) => a.val - b.val);
    weakTest = avgs[0].name;
  }

  const chartHeight = 420;
  const chartWidth = 800;
  const maxPts = 25;
  const notaCorte = 12;

  const getChartData = () => {
    if (totalSimuladosTaf === 0) return { line: "", area: "", points: [] };
    if (totalSimuladosTaf === 1) {
       const y = chartHeight - (tafHistory[0].totalPts / maxPts) * chartHeight;
       return {
          line: `0,${y} ${chartWidth},${y}`,
          area: `0,${chartHeight} 0,${y} ${chartWidth},${y} ${chartWidth},${chartHeight}`,
          points: [{ x: chartWidth/2, y, val: tafHistory[0].totalPts }]
       };
    }
    const ptsObj = tafHistory.map((sim, index) => {
      const x = (index / (totalSimuladosTaf - 1)) * chartWidth;
      const y = chartHeight - (sim.totalPts / maxPts) * chartHeight;
      return { x, y, val: sim.totalPts };
    });
    const lineStr = ptsObj.map(p => `${p.x},${p.y}`).join(" ");
    const areaStr = `0,${chartHeight} ${lineStr} ${chartWidth},${chartHeight}`;
    return { line: lineStr, area: areaStr, points: ptsObj };
  };

  const chartData = getChartData();
  const targetY = chartHeight - (notaCorte / maxPts) * chartHeight;

  const renderMetricSparkline = (label, metricKey, color, maxValue) => {
    if (totalSimuladosTaf < 2) return null;
    
    const sparkHeight = 40;
    const sparkWidth = 120;
    const pts = tafHistory.map((sim, index) => {
      const x = (index / (totalSimuladosTaf - 1)) * sparkWidth;
      const y = sparkHeight - (sim[metricKey] / maxValue) * sparkHeight;
      return `${x},${y}`;
    }).join(" ");

    const lastVal = tafHistory[tafHistory.length - 1][metricKey];
    const prevVal = tafHistory[tafHistory.length - 2][metricKey];
    const improved = metricKey === 'shuttle' ? prevVal > lastVal : lastVal > prevVal;

    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase block leading-none mb-1">{label}</span>
          <div className="flex items-baseline gap-1">
             <span className="text-sm font-black text-slate-700 dark:text-slate-200">{lastVal}</span>
             {improved && <span className="text-[10px] text-emerald-500 font-bold">▲</span>}
          </div>
        </div>
        <div className="flex-1 h-[40px]">
          <svg viewBox={"0 0 " + sparkWidth + " " + sparkHeight} className="w-full h-full overflow-hidden">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={sparkWidth - 2} cy={sparkHeight - (lastVal / maxValue) * sparkHeight} r="3" fill={color} />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full shrink-0"><Dumbbell className="text-orange-600 w-6 h-6 sm:w-8 sm:h-8" /></div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Evolução Analítica do TAF</h2>
                <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">Tabelas oficiais PRF (Máximo: 25 pts | Mínimo: 12 pts).</p>
              </div>
            </div>
            <button onClick={() => { setEditingTaf(null); setShowModal(true); }} className="w-full sm:w-auto justify-center bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md transition-colors">
              <Plus className="w-4 h-4" /> Registrar Simulado Físico
            </button>
          </div>
          
          {totalSimuladosTaf > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
               <div className="flex justify-between items-end mb-6">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2 dark:text-slate-200"><TrendingUp className="w-5 h-5 text-orange-500"/> Curva de Desempenho (Pontuação TAF)</h3>
               </div>
               
               <div className="relative w-full h-[420px] mt-4">
                  <div className="absolute w-full border-t-2 border-dashed border-red-400 z-0 flex items-end justify-end" style={{ top: `${targetY}px` }}>
                     <span className="text-[11px] sm:text-xs font-black text-red-500 bg-white px-2 -mt-2.5 sm:-mt-3 absolute left-0 sm:left-auto sm:right-0 dark:bg-slate-900">Corte Mínimo Global (12 pts)</span>
                  </div>
                  
                  <svg viewBox={"0 0 " + chartWidth + " " + chartHeight} preserveAspectRatio="none" className="w-full h-full overflow-visible z-10 relative">
                     <defs>
                        <linearGradient id="chartFillTaf" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25"/>
                           <stop offset="100%" stopColor="#ea580c" stopOpacity="0"/>
                        </linearGradient>
                     </defs>
                     
                     <polyline points={chartData.area} fill="url(#chartFillTaf)" />
                     <polyline points={chartData.line} fill="none" stroke="#ea580c" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                     
                     {chartData.points.map((p, index) => (
                        <g key={index}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#ea580c" strokeWidth="3" className="hover:r-[7px] transition-all cursor-pointer"/>
                          <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#475569" fontSize="14" fontWeight="900" className="drop-shadow-sm">{p.val}</text>
                        </g>
                     ))}
                  </svg>
               </div>
               <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2 border-t border-slate-100 pt-2 px-1 dark:border-slate-800">
                  <span>Mais antigo</span>
                  <span>Mais recente</span>
               </div>

               <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {renderMetricSparkline("Barra Fixa", "barra", "#f97316", 15)}
                  {renderMetricSparkline("Abdominal", "abdominal", "#8b5cf6", 60)}
                  {renderMetricSparkline("Impulsão", "impulsao", "#10b981", 3)}
                  {renderMetricSparkline("Corrida (m)", "corrida", "#3b82f6", 3200)}
                  {renderMetricSparkline("Shuttle (s)", "shuttle", "#ef4444", 15)}
               </div>
            </div>
          )}

          {tafHistory.length === 0 ? (
            <div className="text-center p-10 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 mb-8">
              Nenhum TAF registrado. Execute seu primeiro simulado físico para analisar seus pontos e traçar o gráfico.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto mb-8 dark:bg-slate-900 dark:border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800">
                  <tr>
                    <th className="p-3 sm:p-4 font-bold">Data</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Barra</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Abd.</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Imp.</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Corr.</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Shuttle</th>
                    <th className="p-3 sm:p-4 font-black text-center text-orange-600">Total</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Status</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tafHistory.map(sim => {
                    const reprovouCorte = (sim.ptsBarra === 0 || sim.ptsAbdominal === 0 || sim.ptsImpulsao === 0 || sim.ptsCorrida === 0 || sim.ptsShuttle === 0 || sim.totalPts < notaCorte);
                    return (
                    <tr key={sim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors dark:bg-slate-950">
                      <td className="p-3 sm:p-4 font-semibold text-slate-700 dark:text-slate-200">{sim.data}</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${sim.ptsBarra === 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.ptsBarra}p</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${sim.ptsAbdominal === 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.ptsAbdominal}p</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${sim.ptsImpulsao === 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.ptsImpulsao}p</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${sim.ptsCorrida === 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.ptsCorrida}p</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${sim.ptsShuttle === 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.ptsShuttle}p</td>
                      <td className="p-3 sm:p-4 text-center font-black text-slate-800 dark:text-slate-100">{sim.totalPts}</td>
                      <td className="p-3 sm:p-4 text-center">
                        {reprovouCorte ? 
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase">F</span> : 
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase">P</span>
                        }
                      </td>
                      <td className="p-3 sm:p-4 text-center flex justify-center gap-1">
                        <button onClick={() => { setEditingTaf(sim); setShowModal(true); }} className="p-1 text-slate-400 hover:text-orange-600 transition-colors" title="Editar"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => { if (window.confirm('Excluir?')) setTafHistory(prev => prev.filter(s => s.id !== sim.id)); }} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Excluir"><Trash2 className="w-3 h-3" /></button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 dark:text-slate-200 dark:border-slate-800"><CalendarIcon className="w-5 h-5 text-slate-400"/> Rotina de Treinos de Base</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { day: 'Seg', type: 'Tiros/HIIT', icon: '🏃\u200d\u2642\ufe0f' },
              { day: 'Ter', type: 'Força Superior', icon: '💪' },
              { day: 'Qua', type: 'Rodagem', icon: '🏃\u200d\u2642\ufe0f' },
              { day: 'Qui', type: 'Força Inferior', icon: '🦵' },
              { day: 'Sex', type: 'Tempo Run', icon: '⏱\ufe0f' },
              { day: 'Sáb', type: 'Livre/Futebol', icon: '⚽' },
              { day: 'Dom', type: 'Descanso', icon: '🛌' }
            ].map((item, idx) => {
              const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
              const todayName = days[new Date().getDay()];
              const isToday = item.day === todayName;
              const alreadyDone = tafTrainingStatus.lastDoneDate === getLocalDateStr();

              return (
                <div key={idx} className={`p-3 rounded-xl border transition-all ${isToday ? 'border-orange-500 bg-orange-50/30 ring-1 ring-orange-500/20' : 'border-slate-200 bg-white'} shadow-sm flex items-center justify-between gap-3 dark:bg-slate-900 dark:border-slate-800`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase">{item.day}</span>
                        {isToday && <span className="text-[8px] bg-orange-500 text-white px-1 rounded font-black">HOJE</span>}
                      </div>
                      <h3 className="font-bold text-slate-700 text-[13px] dark:text-slate-200 leading-tight">{item.type}</h3>
                    </div>
                  </div>
                  
                  {isToday && (
                    <button 
                      disabled={alreadyDone}
                      onClick={completeTafTraining}
                      className={`p-2 rounded-lg transition-all ${alreadyDone ? 'bg-emerald-100 text-emerald-600 cursor-default' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm active:scale-90'}`}
                    >
                      {alreadyDone ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-all hover:border-orange-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-lg"><BarChart2 className="w-6 h-6 text-orange-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Média Geral</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{mediaPts} <span className="text-xs text-slate-400">/25</span></p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(mediaPts/25)*100}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-all hover:border-emerald-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg"><Trophy className="w-6 h-6 text-emerald-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Recorde Atual</p>
                <p className="text-2xl font-black text-emerald-600 leading-none">{recordePts} <span className="text-xs text-slate-400">/25</span></p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(recordePts/25)*100}%` }}></div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm dark:bg-slate-900 dark:border-red-900/30 transition-all hover:bg-red-100/50">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg"><Activity className="w-6 h-6 text-red-600" /></div>
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Gargalo Físico</p>
                <p className="text-lg font-black text-red-700 dark:text-red-400 leading-tight">{weakTest}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl mt-2">
             <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <Info className="w-3 h-3"/> Dica de Treino
             </h4>
             <p className="text-xs text-slate-400 leading-relaxed">
               Foque em evoluir no seu gargalo (**{weakTest}**) para garantir que a soma global ultrapasse os 12 pontos com folga.
             </p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[60] p-4 fade-in backdrop-blur-sm">
          <form onSubmit={(e) => {
            e.preventDefault();
            const dataVal = e.target.data.value;
            const genero = e.target.genero.value;
            const isM = genero === 'masculino';
            
            const barra = parseFloat(e.target.barra.value) || 0;
            const abdominal = parseFloat(e.target.abdominal.value) || 0;
            const impulsao = parseFloat(e.target.impulsao.value) || 0;
            const corrida = parseFloat(e.target.corrida.value) || 0;
            const shuttle = parseFloat(e.target.shuttle.value) || 0;

            const ptsBarra = calcBarra(barra, isM);
            const ptsAbdominal = calcAbdominal(abdominal, isM);
            const ptsImpulsao = calcImpulsao(impulsao, isM);
            const ptsCorrida = calcCorrida(corrida, isM);
            const ptsShuttle = calcShuttle(shuttle, isM);
            
            const totalPts = ptsBarra + ptsAbdominal + ptsImpulsao + ptsCorrida + ptsShuttle;

            const payload = {
              data: dataVal, genero, barra, abdominal, impulsao, corrida, shuttle,
              ptsBarra, ptsAbdominal, ptsImpulsao, ptsCorrida, ptsShuttle, totalPts
            };

            if (editingTaf) {
              setTafHistory(prev => prev.map(s => s.id === editingTaf.id ? { ...s, ...payload } : s));
            } else {
              setTafHistory(prev => [...prev, { id: Date.now(), ...payload }]);
              addXP(300, "Simulado TAF registrado");
              if (payload.totalPts >= 25) unlockMedal('ironman');
            }
            setShowModal(false);
            setEditingTaf(null);
          }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] dark:bg-slate-900">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black flex items-center gap-2"><Dumbbell className="w-5 h-5 text-orange-600"/> {editingTaf ? 'Editar TAF' : 'Registrar TAF'}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 dark:text-slate-400">Insira as marcas reais. O sistema fará a conversão oficial de pontos.</p>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 block mb-1 dark:text-slate-400">Data</label>
                  <input name="data" type="text" required defaultValue={editingTaf ? editingTaf.data : new Date().toLocaleDateString('pt-BR')} className="w-full border-2 border-slate-200 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:border-orange-400 dark:text-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"/>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 block mb-1 dark:text-slate-400">Gênero</label>
                  <select name="genero" defaultValue={editingTaf ? editingTaf.genero : 'masculino'} className="w-full border-2 border-slate-200 p-2.5 rounded-lg font-bold text-slate-800 outline-none focus:border-orange-400 dark:text-slate-100 dark:border-slate-800 text-sm">
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 dark:text-slate-400" title="Masculino: Repetições | Feminino: Segundos de Isometria">Barra (Reps/Segs)</label>
                  <input name="barra" type="number" step="0.1" min="0" required defaultValue={editingTaf?.barra ?? ''} className="w-full border-2 border-slate-200 p-2 rounded-lg font-bold text-slate-700 outline-none focus:border-orange-400 text-center dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 dark:text-slate-400">Abdominal (Reps)</label>
                  <input name="abdominal" type="number" min="0" required defaultValue={editingTaf?.abdominal ?? ''} className="w-full border-2 border-slate-200 p-2 rounded-lg font-bold text-slate-700 outline-none focus:border-orange-400 text-center dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 dark:text-slate-400">Impulsão (Metros)</label>
                  <input name="impulsao" type="number" step="0.01" min="0" required defaultValue={editingTaf?.impulsao ?? ''} className="w-full border-2 border-slate-200 p-2 rounded-lg font-bold text-slate-700 outline-none focus:border-orange-400 text-center dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"/>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 dark:text-slate-400">Corrida (Metros)</label>
                  <input name="corrida" type="number" min="0" required defaultValue={editingTaf?.corrida ?? ''} className="w-full border-2 border-slate-200 p-2 rounded-lg font-bold text-slate-700 outline-none focus:border-orange-400 text-center dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"/>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 dark:text-slate-400">Shuttle Run (Segundos)</label>
                  <input name="shuttle" type="number" step="0.01" min="0" required defaultValue={editingTaf?.shuttle ?? ''} className="w-full border-2 border-slate-200 p-2 rounded-lg font-bold text-slate-700 outline-none focus:border-orange-400 text-center dark:text-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:border-slate-700"/>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-200 dark:bg-slate-950 dark:border-slate-800">
              <button type="button" onClick={() => { setShowModal(false); setEditingTaf(null); }} className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors dark:bg-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">Abortar</button>
              <button type="submit" className="flex-1 py-3 font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 shadow-md transition-colors">Avaliar Pontuação</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
