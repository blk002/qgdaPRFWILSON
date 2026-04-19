import { useStore } from '../store/useStore';
import { Store, Coins } from 'lucide-react';

export default function Loja() {
  const {
    coins,
    setCoins,
    setUserStats,
    unlockMedal,
    setGlobalModal
  } = useStore();
  const rewards = [
    { id: 1, title: 'Episódio de Série', cost: 50, icon: '📺' },
    { id: 2, title: 'Lanche sem culpa', cost: 150, icon: '🍔' },
    { id: 3, title: 'Domingo Livre', cost: 300, icon: '🎮' }
  ];

  return (
    <div className="fade-in max-w-[1400px] mx-auto pb-10">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800 mb-8 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-yellow-400 mb-1 flex justify-center items-center gap-2">
          <Store className="w-5 h-5 sm:w-6 sm:h-6" /> Loja do Aprovado
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-4">Gaste as moedas conquistadas.</p>
        <div className="inline-flex items-center gap-2 sm:gap-3 bg-slate-800 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-slate-700">
          <Coins className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-2xl sm:text-3xl font-black">{coins}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {rewards.map(rew => (
          <div key={rew.id} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
            <div className="text-4xl sm:text-5xl mb-4 transform group-hover:scale-110 transition-transform">{rew.icon}</div>
            <h3 className="font-black text-slate-800 mb-1 text-sm sm:text-base dark:text-slate-100 uppercase tracking-tight">{rew.title}</h3>
            <span className="text-xs sm:text-sm font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-1.5 rounded-full mb-5 border border-yellow-200 dark:border-yellow-700/30">
              {rew.cost} pts
            </span>
            <button 
              onClick={() => {
                if (coins >= rew.cost) {
                  setCoins(prev => prev - rew.cost);
                  setUserStats(prev => {
                    const newPurchases = (prev.totalPurchases || 0) + 1;
                    if (newPurchases >= 5) unlockMedal('investidor');
                    return { ...prev, totalPurchases: newPurchases };
                  });
                  setGlobalModal({
                    title: "Resgate Efetuado!",
                    message: `Você resgatou com sucesso a recompensa: "${rew.title}". Aproveite a sua pausa estratégica!`,
                    isAlert: true
                  });
                } else {
                  setGlobalModal({
                    title: "Moedas Insuficientes",
                    message: "Você não possui moedas suficientes para resgatar esta recompensa. Avance no ciclo e faça as revisões FSRS para acumular mais.",
                    isAlert: true
                  });
                }
              }}
              className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-sm border-2 ${
                coins >= rew.cost 
                  ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 hover:scale-[1.02] active:scale-95 shadow-blue-500/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600'
              }`}
            >
              {coins >= rew.cost ? 'Resgatar Agora' : 'Saldo Insuficiente'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
