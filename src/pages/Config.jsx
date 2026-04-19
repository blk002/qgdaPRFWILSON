import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { Target, AlertTriangle, Clock, Settings, Plus, Edit2, Trash2, Calendar, Sun, X, Save } from 'lucide-react';

import { useState } from 'react';

export default function Config({
  availableColors
}) {
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [draftSubject, setDraftSubject] = useState(null);

  const {
    cycle,
    setCycle,
    subjects,
    setSubjects,
    targetExamDate,
    setTargetExamDate,
    setGlobalModal,
    setReviews,
    currentDayIndex,
    setCurrentDayIndex,
    executeTacticalReset,
    executeTotalWipe
  } = useStore();
  const flatCycle = cycle.flat();
  const totalSlots = flatCycle.length;
  
  let b1Count = 0; let b2Count = 0; let b3Count = 0;
  
  flatCycle.forEach(subId => {
    const sub = subjects[subId];
    if (sub) {
      if (sub.block === 'B1') b1Count++;
      else if (sub.block === 'B2') b2Count++;
      else if (sub.block === 'B3') b3Count++;
    }
  });

  const b1Percent = totalSlots > 0 ? Math.round((b1Count / totalSlots) * 100) : 0;
  const b2Percent = totalSlots > 0 ? Math.round((b2Count / totalSlots) * 100) : 0;
  const b3Percent = totalSlots > 0 ? Math.round((b3Count / totalSlots) * 100) : 0;

  const isB2TooLow = b2Percent > 0 && 15 > b2Percent;
  const isB2TooHigh = b2Percent > 40; 
  const isB1TooLow = b1Percent > 0 && 35 > b1Percent;

  return (
    <div className="fade-in max-w-[1400px] px-2 sm:px-4 mx-auto pb-10">
      
      <div className="bg-slate-900 p-5 sm:p-6 rounded-xl shadow-lg border border-slate-800 mb-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
          <Target className="text-blue-400 w-5 h-5"/> Auditoria do Ciclo (Curva ABC)
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          O seu cronograma possui <strong className="text-white">{totalSlots} vagas (slots)</strong>. Veja como o seu esforço está distribuído em relação ao peso real do edital da PRF.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-300 uppercase">Bloco I (Básicas)</span>
                <span className="text-xs font-bold text-slate-500">Alvo: ~46%</span>
             </div>
             <div className="flex items-end gap-2 mb-2">
               <span className={`text-2xl font-black ${isB1TooLow ? 'text-red-400' : 'text-blue-400'}`}>{b1Percent}%</span>
               <span className="text-xs text-slate-400 mb-1">({b1Count} vagas)</span>
             </div>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
               <div className={`h-1.5 rounded-full ${isB1TooLow ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${b1Percent}%` }}></div>
             </div>
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-300 uppercase">Bloco II (Trânsito)</span>
                <span className="text-xs font-bold text-slate-500">Alvo: ~25%</span>
             </div>
             <div className="flex items-end gap-2 mb-2">
               <span className={`text-2xl font-black ${(isB2TooLow || isB2TooHigh) ? 'text-red-400' : 'text-blue-400'}`}>{b2Percent}%</span>
               <span className="text-xs text-slate-400 mb-1">({b2Count} vagas)</span>
             </div>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
               <div className={`h-1.5 rounded-full ${(isB2TooLow || isB2TooHigh) ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${b2Percent}%` }}></div>
             </div>
          </div>

          <div className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-lg">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-300 uppercase">Bloco III (Direito)</span>
                <span className="text-xs font-bold text-slate-500">Alvo: ~29%</span>
             </div>
             <div className="flex items-end gap-2 mb-2">
               <span className="text-2xl font-black text-purple-400">{b3Percent}%</span>
               <span className="text-xs text-slate-400 mb-1">({b3Count} vagas)</span>
             </div>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
               <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${b3Percent}%` }}></div>
             </div>
          </div>
        </div>

        {(isB1TooLow || isB2TooLow || isB2TooHigh) && (
          <div className="bg-red-900/40 border border-red-800 p-3 rounded-lg flex items-start gap-3 mt-4">
            <AlertTriangle className="text-red-400 w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-300 uppercase mb-1">Risco Tático Detetado</p>
              <p className="text-xs text-red-200/80">
                {isB2TooHigh && "O seu cronograma está excessivamente focado no Trânsito. Embora importante, o Bloco I pode eliminá-lo se não dedicar o volume necessário de horas."}
                {isB2TooLow && "Pouca alocação no Trânsito. Sendo a disciplina mais pesada do concurso, você precisa de aumentar a cadência no Bloco II."}
                {isB1TooLow && !isB2TooHigh && "O volume do Bloco I (Básicas) está perigosamente baixo. Lembre-se que o mínimo para não reprovar é 15 pontos num universo de 55 questões."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mb-6 border-l-4 border-l-blue-500 dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2 dark:text-slate-100">
          <Clock className="text-blue-600 w-5 h-5"/> Data Alvo da Prova
        </h3>
        <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">O sistema usará esta data para cruzar com o seu ritmo de estudos e alertar se você corre risco de não fechar o edital a tempo.</p>
        <div className="flex items-center gap-4">
           <input 
              type="date" 
              value={targetExamDate} 
              onChange={(e) => setTargetExamDate(e.target.value)}
              className="border-2 border-slate-200 p-2.5 rounded-lg font-bold text-slate-700 outline-none focus:border-blue-400 dark:text-slate-200 dark:border-slate-800"
           />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center dark:bg-slate-900 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100"><Settings className="text-slate-600 w-5 h-5 dark:text-slate-300"/> Minhas Disciplinas</h3>
        <button onClick={() => {
            const newId = 'sub_' + Date.now();
            setDraftSubject({ id: newId, name: '', color: 'bg-slate-200 text-slate-900', block: 'B1', topics: [] });
            setEditingSubjectId(newId);
          }} 
          className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold flex items-center gap-1 text-xs sm:text-sm">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(subjects || {}).map(sub => (
          <div key={sub.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3 bg-slate-50 hover:border-blue-400 transition-colors dark:bg-slate-950 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${sub.color}`}>{sub.name} <span className="opacity-60 ml-1">({sub.block})</span></span>
              <div className="flex gap-1">
                <button onClick={() => {
                  setDraftSubject({ ...sub });
                  setEditingSubjectId(sub.id);
                }} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => {
                  setGlobalModal({
                    title: "Excluir Disciplina",
                    message: `Você tem certeza que deseja excluir a matéria "${sub.name}" permanentemente do seu planejamento?`,
                    onConfirm: () => {
                      setSubjects(prev => { const c = {...prev}; delete c[sub.id]; return c; });
                      setCycle(prev => prev.map(day => day.filter(sId => sId !== sub.id)));
                      setReviews(prev => prev.filter(r => r.subjectId !== sub.id)); 
                    }
                  });
                }} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-red-600 rounded dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium dark:text-slate-400">
              {sub.topics?.length || 0} {sub.topics?.length === 1 ? 'assunto cadastrado' : 'assuntos cadastrados'}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-8 mb-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
            <Calendar className="text-blue-600 w-5 h-5" /> Meu Cronograma
          </h3>
          <button 
            onClick={() => cycle.length < 7 && setCycle([...cycle, []])} 
            disabled={cycle.length >= 7}
            className={`w-full sm:w-auto justify-center px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-all ${
              cycle.length >= 7 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60'
            }`}
          >
            <Plus className="w-4 h-4" /> Adicionar Dia {cycle.length >= 7 && '(Limite)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {cycle.map((daySubjects, dayIndex) => (
            <div key={dayIndex} className="bg-slate-50 border border-slate-300 rounded-xl flex flex-col overflow-hidden shadow-sm dark:bg-slate-950 dark:border-slate-700 transition-all hover:shadow-md">
              <div className="bg-slate-200/70 p-2 sm:p-2.5 flex justify-between items-center border-b border-slate-300 dark:bg-slate-800 dark:border-slate-700">
                <span className="font-black text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">DIA {dayIndex + 1}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      if (window.confirm(`Limpar todos os blocos do DIA ${dayIndex + 1}?`)) {
                        setCycle(prev => {
                          const newCycle = [...prev];
                          newCycle[dayIndex] = [];
                          return newCycle;
                        });
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors dark:bg-slate-900" title="Limpar Dia (Livre)"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setCycle(prev => prev.filter((_, i) => i !== dayIndex));
                      if (currentDayIndex >= cycle.length - 1) setCurrentDayIndex(0);
                    }} 
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors dark:bg-slate-900" title="Remover Dia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-2 sm:p-2.5 flex flex-col gap-1.5 min-h-[120px]">
                {daySubjects.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg bg-white/50 dark:bg-slate-900 dark:border-slate-800">
                    <Sun className="w-8 h-8 text-orange-400 opacity-40 mb-2 drop-shadow-sm" />
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Dia Livre / Descanso</span>
                  </div>
                ) : (
                  daySubjects.map((subId, slotIndex) => {
                    const subject = subjects[subId];
                    return (
                      <div key={slotIndex} className="flex items-center gap-2">
                        <select 
                          value={subId}
                          onChange={(e) => {
                            setCycle(prev => {
                              const newCycle = [...prev];
                              const newDay = [...newCycle[dayIndex]];
                              if (e.target.value === '') {
                                newCycle[dayIndex] = newDay.filter((_, i) => i !== slotIndex);
                              } else {
                                newDay[slotIndex] = e.target.value;
                                newCycle[dayIndex] = newDay;
                              }
                              return newCycle;
                            });
                          }}
                          className={`flex-1 text-[13px] font-bold p-2 rounded-md border border-slate-300 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-colors cursor-pointer ${subject ? subject.color : 'bg-white text-slate-900'}`}
                        >
                          <option value="" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">- Remover Aula -</option>
                          {Object.values(subjects).map(s => (
                            <option key={s.id} value={s.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">{s.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })
                )}
            
              <button 
                onClick={() => {
                  if (Object.keys(subjects).length === 0) {
                    toast.error("Cadastre pelo menos uma disciplina primeiro!");
                    return;
                  }
                  setCycle(prev => {
                    const newCycle = [...prev];
                    const firstSub = Object.keys(subjects)[0];
                    if (firstSub) {
                      newCycle[dayIndex] = [...newCycle[dayIndex], firstSub];
                    }
                    return newCycle;
                  });
                }}
                className="mt-1 w-full py-2 border-2 border-dashed border-slate-300 bg-white text-slate-500 font-bold text-[11px] rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all flex items-center justify-center gap-1 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
              >
                <Plus className="w-3 h-3" /> Adicionar Bloco
              </button>
            </div>
          </div>
        ))}
        {cycle.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
            Cronograma vazio. Adicione um dia para começar.
          </div>
        )}
        </div>
      </div>

      <div className="bg-emerald-50 p-5 sm:p-6 rounded-xl shadow-sm border border-emerald-200 mt-8 mb-6 relative overflow-hidden dark:bg-emerald-950/20 dark:border-emerald-900/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-lg font-black text-emerald-800 flex items-center gap-2 mb-2 dark:text-emerald-400">
          <Save className="text-emerald-600 w-5 h-5"/> Centro de Backup e Segurança
        </h3>
        <p className="text-sm text-emerald-700 mb-4 max-w-3xl dark:text-emerald-500/70">
          Proteja o seu progresso. Exporte os seus dados para um arquivo local ou restaure um backup anterior. Recomendamos fazer um backup semanal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              const data = localStorage.getItem('prf-qg-storage');
              if (!data) {
                toast.error("Nenhum dado encontrado para backup.");
                return;
              }
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `qg-prf-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              toast.success("Backup exportado com sucesso!");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4"/> Exportar Backup (.json)
          </button>
          
          <label className="bg-white hover:bg-slate-50 text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer dark:bg-slate-900 dark:border-emerald-800">
            <Plus className="w-4 h-4"/> Importar Backup
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const content = event.target.result;
                    JSON.parse(content); // Validate JSON
                    localStorage.setItem('prf-qg-storage', content);
                    toast.success("Backup restaurado! A página será recarregada.");
                    setTimeout(() => window.location.reload(), 1500);
                  } catch {
                    toast.error("Arquivo de backup inválido.");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>
      </div>

      <div className="bg-red-50 p-5 sm:p-6 rounded-xl shadow-sm border border-red-200 mt-4 mb-6 relative overflow-hidden dark:bg-red-950/20 dark:border-red-900/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full pointer-events-none"></div>
        <h3 className="text-lg font-black text-red-800 flex items-center gap-2 mb-2 dark:text-red-400">
          <AlertTriangle className="text-red-600 w-5 h-5"/> Zona de Perigo (Reset Tático)
        </h3>
        <p className="text-sm text-red-700 mb-4 max-w-3xl dark:text-red-500/70">
          Use este botão para apagar todos os dados de teste (Simulados, TAF, Revisões, Moedas e Ciclo) e zerar o progresso das disciplinas. Apenas a estrutura das matérias e assuntos será preservada. Esta ação é irreversível.
        </p>
          <button onClick={() => {
              setGlobalModal({
                title: "Protocolo de Limpeza",
                message: "ATENÇÃO: Isto apagará permanentemente simulados, TAF, revisões FSRS, moedas e limpará o seu ciclo. O progresso das aulas nas matérias voltará a ZERO. Confirma a limpeza total dos dados?",
                onConfirm: () => {
                  executeTacticalReset();
                  toast.warning("Dados resetados para o padrão operacional.");
                }
              });
            }} 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm"
          >
            Expurgar Dados Falsos
          </button>

          <button onClick={() => {
              setGlobalModal({
                title: "⚠️ RESET ABSOLUTO ⚠️",
                message: "ESTA AÇÃO É IRREVERSÍVEL! Isto apagará TUDO: matérias, assuntos, histórico, moedas e progresso. O sistema voltará a uma tela em branco (vazia). Deseja DESTRUIR todos os dados?",
                onConfirm: () => {
                  executeTotalWipe();
                  toast.error("SISTEMA ZERADO ABSOLUTAMENTE.");
                }
              });
            }} 
            className="w-full sm:w-auto bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-lg font-black transition-colors shadow-sm"
          >
            Zerar Sistema Completo
          </button>
      </div>
      {/* Modal de Edição de Disciplina */}
      {editingSubjectId && draftSubject && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 animate-scale-in overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-tighter">
                <Edit2 className="w-5 h-5 text-blue-600" /> Detalhes da Disciplina
              </h3>
              <button 
                onClick={() => { setEditingSubjectId(null); setDraftSubject(null); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Nome e Bloco */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome Operacional</label>
                  <input 
                    type="text" 
                    value={draftSubject.name}
                    onChange={(e) => setDraftSubject(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Alocação de Bloco</label>
                  <select 
                    value={draftSubject.block}
                    onChange={(e) => setDraftSubject(prev => ({ ...prev, block: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-black text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="B1">Bloco I (Básicas)</option>
                    <option value="B2">Bloco II (Trânsito)</option>
                    <option value="B3">Bloco III (Direito)</option>
                  </select>
                </div>
              </div>

              {/* Seletor de Cores Táticas */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1">Identidade Visual (Cor)</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {availableColors.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setDraftSubject(prev => ({ ...prev, color: c.color }))}
                      className={`h-10 rounded-lg border-4 transition-all ${draftSubject.color === c.color ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-transparent'}`}
                    >
                      <div className={`w-full h-full rounded-sm ${c.color.split(' ')[0]}`}></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gestão de Tópicos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conteúdo Programático (Assuntos)</label>
                  <button 
                    onClick={() => setDraftSubject(prev => {
                      const newTopics = [...(prev.topics || [])];
                      newTopics.push({ id: 't' + Date.now(), name: 'NOVO ASSUNTO', total: 5, completed: 0 });
                      return { ...prev, topics: newTopics };
                    })}
                    className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded tracking-widest uppercase transition-all"
                  >
                    <Plus className="w-3 h-3"/> Add Assunto
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {(draftSubject.topics || []).map((topic, idx) => (
                    <div key={topic.id} className="group flex flex-col sm:flex-row gap-2 items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                      <div className="flex-1 w-full">
                        <input 
                          type="text" 
                          value={topic.name}
                          onChange={(e) => setDraftSubject(prev => {
                            const newTopics = [...prev.topics];
                            newTopics[idx] = { ...newTopics[idx], name: e.target.value };
                            return { ...prev, topics: newTopics };
                          })}
                          className="w-full bg-transparent border-none p-0 font-bold text-xs text-slate-700 dark:text-slate-300 outline-none focus:text-blue-600 transition-colors"
                          placeholder="Nome do Assunto..."
                        />
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1 group/input">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Aulas:</span>
                          <input 
                            type="number" 
                            value={topic.total}
                            onChange={(e) => setDraftSubject(prev => {
                              const newTopics = [...prev.topics];
                              newTopics[idx] = { ...newTopics[idx], total: parseInt(e.target.value) || 0 };
                              return { ...prev, topics: newTopics };
                            })}
                            className="w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-black p-1"
                          />
                        </div>
                        <button 
                          onClick={() => setDraftSubject(prev => {
                            const newTopics = prev.topics.filter((_, i) => i !== idx);
                            return { ...prev, topics: newTopics };
                          })}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(draftSubject.topics || []).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 italic">Nenhum assunto cadastrado para esta matéria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => {
                  if (!draftSubject.name || draftSubject.name.trim() === "" || draftSubject.name === "NOVA MATÉRIA") {
                    toast.error("Por favor, defina um nome real para a disciplina.");
                    return;
                  }
                  setSubjects(prev => ({ ...prev, [draftSubject.id]: draftSubject }));
                  setEditingSubjectId(null);
                  setDraftSubject(null);
                }}
                className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                Salvar Configurações <Save className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
