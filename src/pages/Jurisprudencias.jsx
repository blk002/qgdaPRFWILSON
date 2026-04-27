import React, { useState, useEffect } from 'react';
import { Scale, Search, ExternalLink, RefreshCw, Filter, BookOpen, AlertTriangle, ChevronDown, ChevronUp, Star, StarOff } from 'lucide-react';
import { useStore } from '../store/useStore';

const TRIBUNAIS = [
  { id: 'stf', name: 'STF', fullName: 'Supremo Tribunal Federal', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-900/30' },
  { id: 'stj', name: 'STJ', fullName: 'Superior Tribunal de Justiça', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-900/30' },
];

const TEMAS_PRF = [
  'Direito Penal', 'Direito Constitucional', 'Direito Administrativo',
  'Legislação de Trânsito', 'Direito Processual Penal', 'Direitos Humanos',
  'Todos'
];

// Jurisprudências recentes relevantes para PRF (dados curados manualmente)
const JURISPRUDENCIAS_CURADAS = [
  {
    id: 1,
    tribunal: 'stf',
    tipo: 'Súmula Vinculante',
    numero: 'SV 11',
    tema: 'Direito Administrativo',
    ementa: 'Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, por parte do preso ou de terceiros.',
    relevancia: 'Diretamente aplicável à atuação policial da PRF em abordagens.',
    data: '2026-04-15',
    destaque: true
  },
  {
    id: 2,
    tribunal: 'stj',
    tipo: 'Informativo',
    numero: 'Info 812',
    tema: 'Legislação de Trânsito',
    ementa: 'A suspensão do direito de dirigir deve ser aplicada de forma autônoma, sem vinculação à pena privativa de liberdade, quando o crime de trânsito é cometido na direção de veículo automotor.',
    relevancia: 'Impacta diretamente a fiscalização de trânsito e autuações da PRF.',
    data: '2026-04-10',
    destaque: true
  },
  {
    id: 3,
    tribunal: 'stf',
    tipo: 'Repercussão Geral',
    numero: 'RE 603.616',
    tema: 'Direito Processual Penal',
    ementa: 'A entrada forçada em domicílio sem mandado judicial só é lícita quando amparada em fundadas razões, devidamente justificadas a posteriori.',
    relevancia: 'Essencial para operações policiais da PRF que envolvam busca domiciliar.',
    data: '2026-04-05',
    destaque: false
  },
  {
    id: 4,
    tribunal: 'stj',
    tipo: 'Tese',
    numero: 'Tema 1087',
    tema: 'Direito Penal',
    ementa: 'O porte de arma de fogo de uso restrito, quando desmuniciada e desmontada, não afasta a tipicidade da conduta prevista no art. 16 do Estatuto do Desarmamento.',
    relevancia: 'Relevante para apreensões de armas em fiscalizações rodoviárias.',
    data: '2026-03-28',
    destaque: true
  },
  {
    id: 5,
    tribunal: 'stf',
    tipo: 'ADI',
    numero: 'ADI 5779',
    tema: 'Legislação de Trânsito',
    ementa: 'É constitucional a exigência de exame toxicológico para motoristas profissionais (categorias C, D e E) no ato da habilitação e da renovação.',
    relevancia: 'Impacta a fiscalização de motoristas profissionais nas rodovias federais.',
    data: '2026-03-20',
    destaque: false
  },
  {
    id: 6,
    tribunal: 'stj',
    tipo: 'Informativo',
    numero: 'Info 805',
    tema: 'Direito Penal',
    ementa: 'O flagrante de tráfico de drogas em rodovias federais é de competência da Justiça Federal, quando a droga é transportada em contexto interestadual.',
    relevancia: 'Define a competência jurisdicional nas apreensões realizadas pela PRF.',
    data: '2026-03-15',
    destaque: true
  },
  {
    id: 7,
    tribunal: 'stf',
    tipo: 'ADPF',
    numero: 'ADPF 635',
    tema: 'Direitos Humanos',
    ementa: 'Operações policiais em comunidades devem observar protocolos de redução de letalidade e uso progressivo da força.',
    relevancia: 'Aplicável a todas as forças policiais, incluindo a PRF em operações integradas.',
    data: '2026-03-10',
    destaque: false
  },
  {
    id: 8,
    tribunal: 'stj',
    tipo: 'Recurso Repetitivo',
    numero: 'Tema 1099',
    tema: 'Direito Administrativo',
    ementa: 'A prerrogativa de foro por exercício de função pública não se estende a atos praticados fora do cargo ou antes da investidura.',
    relevancia: 'Relevante para entender a responsabilização de agentes públicos.',
    data: '2026-03-05',
    destaque: false
  },
  {
    id: 9,
    tribunal: 'stf',
    tipo: 'Súmula Vinculante',
    numero: 'SV 14',
    tema: 'Direito Constitucional',
    ementa: 'É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária.',
    relevancia: 'Importante para a atuação da PRF como polícia judiciária em crimes de trânsito.',
    data: '2026-02-28',
    destaque: false
  },
  {
    id: 10,
    tribunal: 'stj',
    tipo: 'Informativo',
    numero: 'Info 798',
    tema: 'Legislação de Trânsito',
    ementa: 'A recusa do condutor em se submeter ao teste de alcoolemia (bafômetro) pode ser considerada como elemento indiciário para a caracterização da infração prevista no art. 165 do CTB.',
    relevancia: 'Fundamental para a fiscalização de alcoolemia nas rodovias federais.',
    data: '2026-02-20',
    destaque: true
  },
];

export default function Jurisprudencias() {
  const { addXP, updateMissionProgress } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTribunal, setActiveTribunal] = useState('all');
  const [activeTema, setActiveTema] = useState('Todos');
  const [expandedId, setExpandedId] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prf-juris-favs') || '[]'); } catch { return []; }
  });
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  useEffect(() => {
    localStorage.setItem('prf-juris-favs', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFav = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filtered = JURISPRUDENCIAS_CURADAS
    .filter(j => activeTribunal === 'all' || j.tribunal === activeTribunal)
    .filter(j => activeTema === 'Todos' || j.tema === activeTema)
    .filter(j => !showOnlyFavs || favorites.includes(j.id))
    .filter(j => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return j.ementa.toLowerCase().includes(s) || j.numero.toLowerCase().includes(s) || j.tipo.toLowerCase().includes(s) || j.tema.toLowerCase().includes(s);
    });

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10 px-4">

      {/* Header */}
      <div className="relative bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Scale className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Jurisprudências</h2>
              <p className="text-slate-400 text-xs font-bold">STF & STJ — Teses e Súmulas relevantes para PRF</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-emerald-600/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-600/30 font-black uppercase tracking-wider">
              {filtered.length} jurisprudência{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por ementa, número ou tema..."
          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-sm"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Tribunal */}
        <button 
          onClick={() => setActiveTribunal('all')}
          className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${activeTribunal === 'all' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'}`}
        >
          Todos
        </button>
        {TRIBUNAIS.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTribunal(t.id)}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${activeTribunal === t.id ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'}`}
          >
            {t.name}
          </button>
        ))}
        
        <div className="w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
        
        <button 
          onClick={() => setShowOnlyFavs(!showOnlyFavs)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${showOnlyFavs ? 'bg-yellow-500 border-yellow-400 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-yellow-400'}`}
        >
          <Star className="w-3.5 h-3.5" /> Favoritas
        </button>
      </div>

      {/* Filtro de Temas */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {TEMAS_PRF.map(tema => (
          <button 
            key={tema}
            onClick={() => setActiveTema(tema)}
            className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all whitespace-nowrap border ${activeTema === tema ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-emerald-400'}`}
          >
            {tema}
          </button>
        ))}
      </div>

      {/* Lista de Jurisprudências */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Scale className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-black text-sm uppercase tracking-wider">Nenhuma jurisprudência encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros ou o termo de busca.</p>
          </div>
        )}
        
        {filtered.map(j => {
          const trib = TRIBUNAIS.find(t => t.id === j.tribunal);
          const isExpanded = expandedId === j.id;
          const isFav = favorites.includes(j.id);
          
          return (
            <div 
              key={j.id} 
              className={`bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all overflow-hidden ${j.destaque ? 'border-emerald-200 dark:border-emerald-900/50 shadow-sm shadow-emerald-500/5' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <div className="p-5 sm:p-6">
                {/* Header da Jurisprudência */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${trib.bg} ${trib.border} border ${trib.color}`}>
                      {trib.name}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {j.tipo}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{j.numero}</span>
                    {j.destaque && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                        Destaque
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => toggleFav(j.id)}
                      className={`p-1.5 rounded-lg transition-all ${isFav ? 'text-yellow-500 hover:text-yellow-400' : 'text-slate-300 hover:text-yellow-500'}`}
                    >
                      {isFav ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(j.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Tema */}
                <div className="mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{j.tema}</span>
                </div>

                {/* Ementa */}
                <p className={`text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                  {j.ementa}
                </p>

                {/* Relevância (expandido) */}
                {isExpanded && (
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Relevância para PRF</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{j.relevancia}</p>
                  </div>
                )}

                {/* Botão Expandir */}
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : j.id)}
                  className="flex items-center gap-1 mt-3 text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                >
                  {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Recolher</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver Relevância PRF</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé */}
      <div className="mt-10 text-center space-y-2">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Fonte: STF e STJ — Jurisprudências curadas para o concurso PRF
        </p>
        <p className="text-[9px] text-slate-500">
          As ementas são resumos de decisões relevantes. Consulte os inteiros teores nos portais oficiais.
        </p>
      </div>
    </div>
  );
}
