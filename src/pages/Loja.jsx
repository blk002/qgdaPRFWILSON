import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Store, Coins, Sparkles, Coffee, Gamepad2, Heart, Zap, Gift, Crown, Star, Lock } from 'lucide-react';

const STORE_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'lazer', label: 'Lazer', icon: Gamepad2 },
  { id: 'bem-estar', label: 'Bem-Estar', icon: Heart },
  { id: 'bonus', label: 'Bônus', icon: Zap },
  { id: 'premium', label: 'Premium', icon: Crown },
];

const REWARDS = [
  // Lazer
  { id: 1, title: 'Episódio de Série', desc: 'Assista 1 episódio sem culpa.', cost: 150, icon: '📺', category: 'lazer', rarity: 'common' },
  { id: 2, title: 'Hora de Jogo', desc: '1 hora de videogame livre.', cost: 200, icon: '🎮', category: 'lazer', rarity: 'common' },
  { id: 3, title: 'Rolagem Livre', desc: '30 min de redes sociais.', cost: 120, icon: '📱', category: 'lazer', rarity: 'common' },
  { id: 4, title: 'Filme Completo', desc: 'Sessão cinema em casa.', cost: 350, icon: '🎬', category: 'lazer', rarity: 'uncommon' },

  // Bem-Estar
  { id: 5, title: 'Lanche Premium', desc: 'Hambúrguer, pizza ou açaí.', cost: 400, icon: '🍔', category: 'bem-estar', rarity: 'uncommon' },
  { id: 6, title: 'Café Especial', desc: 'Cappuccino ou frappuccino.', cost: 180, icon: '☕', category: 'bem-estar', rarity: 'common' },
  { id: 7, title: 'Soneca Tática', desc: '20 min de descanso extra.', cost: 200, icon: '😴', category: 'bem-estar', rarity: 'common' },
  { id: 8, title: 'Dia de Folga', desc: 'Domingo inteiro sem estudar.', cost: 800, icon: '🏖️', category: 'bem-estar', rarity: 'rare' },

  // Bônus
  { id: 9, title: 'Boost de XP (2x)', desc: 'Próximas 5 ações rendem XP dobrado.', cost: 500, icon: '⚡', category: 'bonus', rarity: 'rare', isGameplay: true },
  { id: 10, title: 'Escudo de Streak', desc: 'Protege sua ofensiva por 1 dia.', cost: 600, icon: '🛡️', category: 'bonus', rarity: 'rare', isGameplay: true },
  
  // Premium
  { id: 11, title: 'Jantar Especial', desc: 'Restaurante ou delivery premium.', cost: 1500, icon: '🥂', category: 'premium', rarity: 'epic' },
  { id: 12, title: 'Item de Desejo', desc: 'Compre algo que você quiser.', cost: 3000, icon: '🎁', category: 'premium', rarity: 'legendary' },
];

const RARITY_STYLES = {
  common:    { border: 'border-slate-200 dark:border-slate-700',    glow: '',                                        label: 'Comum',     labelColor: 'text-slate-400' },
  uncommon:  { border: 'border-emerald-200 dark:border-emerald-800', glow: '',                                        label: 'Incomum',   labelColor: 'text-emerald-500' },
  rare:      { border: 'border-blue-300 dark:border-blue-800',      glow: 'shadow-blue-500/10',                      label: 'Raro',      labelColor: 'text-blue-500' },
  epic:      { border: 'border-purple-300 dark:border-purple-800',  glow: 'shadow-purple-500/15',                    label: 'Épico',     labelColor: 'text-purple-500' },
  legendary: { border: 'border-yellow-300 dark:border-yellow-700',  glow: 'shadow-yellow-500/20 shadow-xl',          label: 'Lendário',  labelColor: 'text-yellow-500' },
};

export default function Loja() {
  const { coins, setCoins, setUserStats, unlockMedal, setGlobalModal } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredRewards = activeCategory === 'all' 
    ? REWARDS 
    : REWARDS.filter(r => r.category === activeCategory);

  const handlePurchase = (rew) => {
    if (coins >= rew.cost) {
      setCoins(prev => prev - rew.cost);
      setUserStats(prev => {
        const newPurchases = (prev.totalPurchases || 0) + 1;
        if (newPurchases >= 5) unlockMedal('investidor');
        return { ...prev, totalPurchases: newPurchases };
      });
      setGlobalModal({
        title: "Resgate Efetuado!",
        message: `Você resgatou com sucesso: "${rew.title}". ${rew.isGameplay ? 'O bônus já está ativo no seu perfil!' : 'Aproveite sua recompensa, combatente!'}`,
        isAlert: true
      });
    } else {
      setGlobalModal({
        title: "Moedas Insuficientes",
        message: `Você precisa de ${rew.cost - coins} moedas a mais para resgatar "${rew.title}". Continue estudando para acumular!`,
        isAlert: true
      });
    }
  };

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10 px-4">

      {/* Header Premium */}
      <div className="relative bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-500/10 p-3 rounded-2xl border border-yellow-500/20">
                <Store className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Arsenal de Recompensas</h2>
                <p className="text-slate-400 text-xs font-bold">Converta sua dedicação em benefícios reais.</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-800/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-slate-700 flex items-center gap-3 shadow-inner">
              <Coins className="text-yellow-400 w-8 h-8 animate-pulse" />
              <div>
                <span className="text-3xl font-black text-white block leading-none">{coins}</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Moedas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros por Categoria */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {STORE_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap border-2 ${
                isActive 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grade de Itens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRewards.map(rew => {
          const rarity = RARITY_STYLES[rew.rarity];
          const canAfford = coins >= rew.cost;
          
          return (
            <div 
              key={rew.id} 
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl border-2 ${rarity.border} ${rarity.glow} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
            >
              {/* Rarity Indicator */}
              <div className="absolute top-3 right-3">
                <span className={`text-[8px] font-black uppercase tracking-widest ${rarity.labelColor} bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700`}>
                  {rarity.label}
                </span>
              </div>

              <div className="p-6 flex flex-col items-center text-center">
                {/* Ícone com efeito hover */}
                <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {rew.icon}
                </div>
                
                {/* Info */}
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight mb-1">{rew.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold leading-snug mb-4 min-h-[28px]">{rew.desc}</p>
                
                {/* Preço */}
                <div className="flex items-center gap-1.5 mb-5">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className={`text-lg font-black ${canAfford ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400'}`}>
                    {rew.cost}
                  </span>
                </div>
                
                {/* Botão */}
                <button 
                  onClick={() => handlePurchase(rew)}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                    canAfford 
                      ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? (
                    <span className="flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4" /> Resgatar
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-3.5 h-3.5" /> Saldo Insuficiente
                    </span>
                  )}
                </button>
              </div>

              {/* Gameplay Badge */}
              {rew.isGameplay && (
                <div className="absolute top-3 left-3">
                  <span className="text-[8px] font-black uppercase tracking-wider text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded-full border border-blue-600/20 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Gameplay
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé Informativo */}
      <div className="mt-10 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Ganhe moedas completando revisões FSRS, treinos TAF e missões semanais.
        </p>
      </div>
    </div>
  );
}
