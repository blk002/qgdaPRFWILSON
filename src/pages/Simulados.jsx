import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { Target, Plus, TrendingUp, Edit2, Trash2, BarChart2, Trophy, Activity, Info } from 'lucide-react';

export default function Simulados() {
  const {
    simulados,
    setSimulados,
    addXP,
    unlockMedal,
    updateMissionProgress,
    setGlobalModal,
    isDarkMode
  } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingSimulado, setEditingSimulado] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const totalSimulados = simulados.length;
  const mediaLiquida = totalSimulados > 0 ? Math.round(simulados.reduce((acc, sim) => acc + sim.liquida, 0) / totalSimulados) : 0;
  const recorde = totalSimulados > 0 ? Math.max(...simulados.map(s => s.liquida)) : 0;
  
  let weakPoint = "Aguardando Simulados";
  if (totalSimulados > 0) {
    const avgB1 = simulados.reduce((acc, sim) => acc + (sim.b1Liquida || 0), 0) / totalSimulados / 55;
    const avgB2 = simulados.reduce((acc, sim) => acc + (sim.b2Liquida || 0), 0) / totalSimulados / 30;
    const avgB3 = simulados.reduce((acc, sim) => acc + (sim.b3Liquida || 0), 0) / totalSimulados / 35;
    
    if (avgB1 > avgB2 && avgB3 > avgB2) weakPoint = "Bloco II (Trânsito)";
    else if (avgB1 > avgB3 && avgB2 > avgB3) weakPoint = "Bloco III (Direito)";
    else weakPoint = "Bloco I (Básicas)";
  }

  const notaCortePRF = 75; 
  const maxScore = 120; 
  const chartHeight = 420;
  const chartWidth = 800;

  const getBezierCurvePath = (points) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M 0 ${points[0].y} L ${chartWidth} ${points[0].y}`;
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const getBezierAreaPath = (points, height) => {
    if (points.length === 0) return "";
    const curve = getBezierCurvePath(points);
    return `${curve} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  };

  const getChartData = () => {
    if (totalSimulados === 0) return { line: "", area: "", points: [] };
    
    const ptsObj = simulados.map((sim, index) => {
      const x = (index / (totalSimulados - 1 || 1)) * chartWidth;
      const y = chartHeight - (sim.liquida / maxScore) * chartHeight;
      return { x, y, val: sim.liquida, sim };
    });
    
    if (totalSimulados === 1) {
       const y = ptsObj[0].y;
       return {
          line: `M 0 ${y} L ${chartWidth} ${y}`,
          area: `M 0 ${y} L ${chartWidth} ${y} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`,
          points: [{ x: chartWidth/2, y, val: ptsObj[0].val, sim: ptsObj[0].sim }]
       };
    }
    
    const linePath = getBezierCurvePath(ptsObj);
    const areaPath = getBezierAreaPath(ptsObj, chartHeight);
    return { line: linePath, area: areaPath, points: ptsObj };
  };

  const chartData = getChartData();
  const targetY = chartHeight - (notaCortePRF / maxScore) * chartHeight;

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-full shrink-0"><Target className="text-purple-600 w-6 h-6 sm:w-8 sm:h-8" /></div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Evolução Estratégica em Simulados</h2>
                <p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">Sistema Cebraspe (Certa anula Errada).</p>
              </div>
            </div>
            <button onClick={() => { setEditingSimulado(null); setShowModal(true); }} className="w-full sm:w-auto justify-center bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md transition-colors">
              <Plus className="w-4 h-4" /> Registrar Nota
            </button>
          </div>

          {totalSimulados > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
               <div className="flex justify-between items-end mb-6">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2 dark:text-slate-200"><TrendingUp className="w-5 h-5 text-purple-500"/> Curva de Evolução (Nota Líquida)</h3>
               </div>
               
               <div className="relative w-full h-[420px] mt-4">
                  <div className="absolute w-full border-t-2 border-dashed border-red-400/50 z-0 flex items-end justify-end" style={{ top: `${targetY}px` }}>
                     <span className="text-[10px] sm:text-xs font-black text-red-500 bg-white px-2 -mt-2.5 sm:-mt-3 absolute left-0 sm:left-auto sm:right-0 dark:bg-slate-900">Zona de Corte (~{notaCortePRF} pts)</span>
                  </div>
                  
                  <svg viewBox={"0 0 " + chartWidth + " " + chartHeight} preserveAspectRatio="none" className="w-full h-full overflow-visible z-10 relative">
                     <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25"/>
                           <stop offset="100%" stopColor="#9333ea" stopOpacity="0"/>
                        </linearGradient>
                     </defs>
                     
                     <path d={chartData.area} fill="url(#chartFill)" />
                     <path d={chartData.line} fill="none" stroke="#9333ea" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                     
                     {chartData.points.map((p, index) => (
                        <g key={index}>
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="5" 
                            fill="#fff" 
                            stroke="#9333ea" 
                            strokeWidth="3" 
                            className="hover:r-[7px] hover:stroke-purple-500 transition-all cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ ...p, index })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                     ))}
                  </svg>

                  {hoveredPoint && (
                    <div 
                      className="absolute bg-slate-900/95 border border-purple-500/50 text-white rounded-xl p-3 shadow-2xl z-50 pointer-events-none transition-all duration-200 backdrop-blur-md flex flex-col gap-1 min-w-[160px]"
                      style={{
                        left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                        top: `${(hoveredPoint.y / chartHeight) * 100 - 4}%`,
                        transform: 'translate(-50%, -100%)',
                      }}
                    >
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900" />
                      
                      <div className="flex justify-between items-center border-b border-slate-700/50 pb-1 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Simulado #{hoveredPoint.index + 1}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{hoveredPoint.sim.data.split('-').reverse().join('/')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">Nota Líquida:</span>
                        <span className="text-sm font-black text-purple-400">{hoveredPoint.val} pts</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
                        <div className="flex flex-col items-center bg-slate-800/40 rounded p-1">
                          <span className="font-bold text-slate-400">B1</span>
                          <span className="font-black text-blue-400">{hoveredPoint.sim.b1Liquida}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-800/40 rounded p-1">
                          <span className="font-bold text-slate-400">B2</span>
                          <span className="font-black text-yellow-400">{hoveredPoint.sim.b2Liquida}</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-800/40 rounded p-1">
                          <span className="font-bold text-slate-400">B3</span>
                          <span className="font-black text-emerald-400">{hoveredPoint.sim.b3Liquida}</span>
                        </div>
                      </div>
                    </div>
                  )}
               </div>
               <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2 border-t border-slate-100 pt-2 px-1 dark:border-slate-800">
                  <span>Mais antigo</span>
                  <span>Mais recente</span>
               </div>
            </div>
          )}

          {simulados.length === 0 ? (
            <div className="text-center p-10 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
              Nenhum simulado registrado. Insira seus resultados por bloco para ativar o motor de diagnóstico de eliminação.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto mb-8 dark:bg-slate-900 dark:border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800">
                  <tr>
                    <th className="p-3 sm:p-4 font-bold">Data</th>
                    <th className="p-3 sm:p-4 font-bold text-center" title="Básicas - 55 Questões (Mínimo: 15)">B1 (55)</th>
                    <th className="p-3 sm:p-4 font-bold text-center" title="Trânsito - 30 Questões (Mínimo: 10)">B2 (30)</th>
                    <th className="p-3 sm:p-4 font-bold text-center" title="Direito - 35 Questões (Mínimo: 10)">B3 (35)</th>
                    <th className="p-3 sm:p-4 font-black text-center text-purple-700">Líquida</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Status</th>
                    <th className="p-3 sm:p-4 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {simulados.map(sim => {
                    const reprovouCorte = (15 > sim.b1Liquida) || (10 > sim.b2Liquida) || (10 > sim.b3Liquida) || (50 > sim.liquida);
                    
                    return (
                    <tr key={sim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors dark:bg-slate-950">
                      <td className="p-3 sm:p-4 font-semibold text-slate-700 dark:text-slate-200">{sim.data}</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${(15 > sim.b1Liquida) ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.b1Liquida !== undefined ? sim.b1Liquida : '-'}</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${(10 > sim.b2Liquida) ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.b2Liquida !== undefined ? sim.b2Liquida : '-'}</td>
                      <td className={`p-3 sm:p-4 text-center font-bold ${(10 > sim.b3Liquida) ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{sim.b3Liquida !== undefined ? sim.b3Liquida : '-'}</td>
                      <td className="p-3 sm:p-4 text-center font-black text-base sm:text-lg text-slate-800 dark:text-slate-100">{sim.liquida}</td>
                      <td className="p-3 sm:p-4 text-center">
                        {reprovouCorte ? 
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase">Reprovado</span> : 
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase">Aprovado</span>
                        }
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => { setEditingSimulado(sim); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white rounded transition-all dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-blue-100" title="Editar"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={() => {
                             setGlobalModal({
                               title: "Excluir Simulado?",
                               message: "Esta ação removerá permanentemente a nota do seu histórico de evolução estratégica.",
                               onConfirm: () => setSimulados(prev => prev.filter(s => s.id !== sim.id))
                             });
                           }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded transition-all dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-red-100" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar de Estatísticas */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-all hover:border-purple-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-100 p-3 rounded-lg"><BarChart2 className="w-6 h-6 text-purple-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Média Líquida</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{mediaLiquida} <span className="text-xs text-slate-400">pts</span></p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(mediaLiquida/120)*100}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-all hover:border-emerald-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg"><Trophy className="w-6 h-6 text-emerald-600" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Recorde Pessoal</p>
                <p className="text-2xl font-black text-emerald-600 leading-none">{recorde} <span className="text-xs text-slate-400">pts</span></p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(recorde/120)*100}%` }}></div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm dark:bg-slate-900 dark:border-red-900/30 transition-all hover:bg-red-100/50">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-lg"><Activity className="w-6 h-6 text-red-600" /></div>
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Ponto Crítico</p>
                <p className="text-lg font-black text-red-700 dark:text-red-400 leading-tight">{weakPoint}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl mt-2">
             <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               <Info className="w-3 h-3"/> Diagnóstico Cebraspe
             </h4>
             <p className="text-xs text-slate-400 leading-relaxed">
               O seu bloco mais fraco atualmente é o <strong className="text-white">{weakPoint}</strong>. Foque em exercícios de fixação para subir sua média líquida geral.
             </p>
          </div>
        </div>
      </div>

      {showModal && createPortal(
        <div className={`${isDarkMode ? 'dark' : ''} fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[999] p-4 fade-in backdrop-blur-sm`}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const dataVal = e.target.data.value;
            
            const b1C = parseInt(e.target.b1C.value) || 0;
            const b1E = parseInt(e.target.b1E.value) || 0;
            const b2C = parseInt(e.target.b2C.value) || 0;
            const b2E = parseInt(e.target.b2E.value) || 0;
            const b3C = parseInt(e.target.b3C.value) || 0;
            const b3E = parseInt(e.target.b3E.value) || 0;

            const b1Liquida = b1C - b1E;
            const b2Liquida = b2C - b2E;
            const b3Liquida = b3C - b3E;
            const liquida = b1Liquida + b2Liquida + b3Liquida;

            if (editingSimulado) {
              setSimulados(prev => prev.map(s => s.id === editingSimulado.id ? { ...s, data: dataVal, b1C, b1E, b2C, b2E, b3C, b3E, b1Liquida, b2Liquida, b3Liquida, liquida } : s));
            } else {
              setSimulados(prev => [...prev, { id: Date.now(), data: dataVal, b1C, b1E, b2C, b2E, b3C, b3E, b1Liquida, b2Liquida, b3Liquida, liquida }]);
              addXP(500, "Simulado de Prova registrado");
              updateMissionProgress('simulado', 1);
              const MAX_PONTOS = 120;
              const LIMIAR_ELITE = MAX_PONTOS * 0.8;
              if (liquida >= LIMIAR_ELITE) unlockMedal('elite');
            }
            setShowModal(false);
            setEditingSimulado(null);
          }} className="bg-[#0f172a] rounded-2xl shadow-2xl max-w-lg w-full p-8 border border-slate-800 relative overflow-hidden flex flex-col">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-400 to-purple-600 opacity-80"></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[22px] font-black text-white uppercase tracking-tight flex items-center gap-2 leading-none mb-1">
                  <Target className="w-6 h-6 text-purple-500"/> {editingSimulado ? 'Corrigir Simulado' : 'Registro de Combate'}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  Insira seus erros e acertos segmentados. Auditoria de eliminação ativa.
                </p>
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar pr-2 max-h-[60vh] flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data de Execução</label>
                <input name="data" type="text" required defaultValue={editingSimulado ? editingSimulado.data : new Date().toLocaleDateString('pt-BR')} className="w-full bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 font-bold text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-600"/>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Bloco I - Básicas</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Tot: 55 | Min: 15</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-emerald-500 uppercase mb-1 block">Certas</label>
                    <input name="b1C" type="number" min="0" max="55" required defaultValue={editingSimulado?.b1C ?? ''} className="w-full bg-[#020617] border border-slate-800 p-2.5 rounded-lg font-black text-emerald-400 text-center text-sm outline-none focus:border-emerald-500 transition-colors"/>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-red-500 uppercase mb-1 block">Erradas</label>
                    <input name="b1E" type="number" min="0" max="55" required defaultValue={editingSimulado?.b1E ?? ''} className="w-full bg-[#020617] border border-slate-800 p-2.5 rounded-lg font-black text-red-400 text-center text-sm outline-none focus:border-red-500 transition-colors"/>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Bloco II - Trânsito</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Tot: 30 | Min: 10</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-emerald-500 uppercase mb-1 block">Certas</label>
                    <input name="b2C" type="number" min="0" max="30" required defaultValue={editingSimulado?.b2C ?? ''} className="w-full bg-[#020617] border border-slate-800 p-2.5 rounded-lg font-black text-emerald-400 text-center text-sm outline-none focus:border-emerald-500 transition-colors"/>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-red-500 uppercase mb-1 block">Erradas</label>
                    <input name="b2E" type="number" min="0" max="30" required defaultValue={editingSimulado?.b2E ?? ''} className="w-full bg-[#020617] border border-slate-800 p-2.5 rounded-lg font-black text-red-400 text-center text-sm outline-none focus:border-red-500 transition-colors"/>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Bloco III - Direito</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase">Tot: 35 | Min: 10</span>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-emerald-500 uppercase mb-1 block">Certas</label>
                    <input name="b3C" type="number" min="0" max="35" required defaultValue={editingSimulado?.b3C ?? ''} className="w-full bg-[#020617] border border-slate-800 p-2.5 rounded-lg font-black text-emerald-400 text-center text-sm outline-none focus:border-emerald-500 transition-colors"/>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-red-500 uppercase mb-1 block">Erradas</label>
                    <input name="b3E" type="number" min="0" max="35" required defaultValue={editingSimulado?.b3E ?? ''} className="w-full bg-[#020617] border border-slate-800 p-2.5 rounded-lg font-black text-red-400 text-center text-sm outline-none focus:border-red-500 transition-colors"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button type="submit" className="w-full py-4 bg-[#9333ea] hover:bg-purple-600 outline-none focus:ring-4 focus:ring-purple-500/50 text-white font-black rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all transform active:scale-95 flex items-center justify-center uppercase tracking-widest text-sm">
                Executar Auditoria
              </button>
              <button type="button" onClick={() => { setShowModal(false); setEditingSimulado(null); }} className="w-full py-2 text-slate-400 font-bold hover:text-white transition-colors uppercase text-[10px] tracking-widest">
                Abortar Missão
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
