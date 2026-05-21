import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Store, Coins, Sparkles, Coffee, Gamepad2, Heart, Zap, Gift, Crown, Star, Lock, User } from 'lucide-react';

const STORE_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'lazer', label: 'Lazer', icon: Gamepad2 },
  { id: 'bem-estar', label: 'Bem-Estar', icon: Heart },
  { id: 'bonus', label: 'Bônus', icon: Zap },
  { id: 'customizacao', label: 'Customização', icon: User },
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
  
  // Customização (Avatares)
  { id: 20, title: 'Guerreiro Phoenix', desc: 'Avatar lendário Phoenix da inteligência.', cost: 800, icon: '🔥', category: 'customizacao', rarity: 'legendary', avatarPath: '/assets/gamification/phoenix.png' },
  { id: 21, title: 'Atirador Sniper', desc: 'Avatar do grupo de atiradores de elite.', cost: 500, icon: '🎯', category: 'customizacao', rarity: 'epic', avatarPath: '/assets/gamification/sniper.png' },
  { id: 22, title: 'Muralha Operacional', desc: 'Avatar com escudo tático pesado.', cost: 300, icon: '🛡️', category: 'customizacao', rarity: 'rare', avatarPath: '/assets/gamification/wall.png' },
  { id: 23, title: 'Investidor PRF', desc: 'Avatar exclusivo da divisão financeira.', cost: 400, icon: '💼', category: 'customizacao', rarity: 'rare', avatarPath: '/assets/gamification/investor.png' },
  { id: 24, title: 'Agente de Ferro', desc: 'Avatar especial blindado com exoesqueleto.', cost: 1000, icon: '🤖', category: 'customizacao', rarity: 'legendary', avatarPath: '/assets/gamification/ironman.png' },
  { id: 25, title: 'Diretor Geral', desc: 'Avatar máximo do comando central da PRF.', cost: 1500, icon: '🦁', category: 'customizacao', rarity: 'legendary', avatarPath: '/assets/gamification/diretor_geral.png' },
  { id: 11, title: 'Jantar Especial', desc: 'Restaurante ou delivery premium.', cost: 1500, icon: '🥂', category: 'premium', rarity: 'epic' },
  { id: 12, title: 'Item de Desejo', desc: 'Compre algo que você quiser.', cost: 3000, icon: '🎁', category: 'premium', rarity: 'legendary' },
];

const RARITY_STYLES = {
  common: { 
    border: 'border-slate-200 dark:border-slate-800/60', 
    glow: 'hover:shadow-slate-500/10 dark:hover:shadow-slate-500/5', 
    cardBg: 'hover:bg-gradient-to-b hover:from-slate-500/5 hover:to-transparent',
    neonGlow: 'hover:border-slate-400 dark:hover:border-slate-600',
    label: 'Comum', 
    labelColor: 'text-slate-400 bg-slate-100 dark:bg-slate-800' 
  },
  uncommon: { 
    border: 'border-emerald-200 dark:border-emerald-950/60', 
    glow: 'hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10', 
    cardBg: 'hover:bg-gradient-to-b hover:from-emerald-500/5 hover:to-transparent',
    neonGlow: 'hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    label: 'Incomum', 
    labelColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' 
  },
  rare: { 
    border: 'border-blue-200 dark:border-blue-950/60', 
    glow: 'hover:shadow-blue-500/30 dark:hover:shadow-blue-500/15', 
    cardBg: 'hover:bg-gradient-to-b hover:from-blue-500/5 hover:to-transparent',
    neonGlow: 'hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    label: 'Raro', 
    labelColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50' 
  },
  epic: { 
    border: 'border-purple-200 dark:border-purple-950/60', 
    glow: 'hover:shadow-purple-500/40 dark:hover:shadow-purple-500/20', 
    cardBg: 'hover:bg-gradient-to-b hover:from-purple-500/5 hover:to-transparent',
    neonGlow: 'hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    label: 'Épico', 
    labelColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50' 
  },
  legendary: { 
    border: 'border-amber-200 dark:border-amber-950/60', 
    glow: 'hover:shadow-amber-500/50 dark:hover:shadow-amber-500/25', 
    cardBg: 'hover:bg-gradient-to-b hover:from-amber-500/10 hover:to-transparent',
    neonGlow: 'hover:border-amber-500 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]',
    label: 'Lendário', 
    labelColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50' 
  },
};

export default function Loja() {
  const { coins, setCoins, setUserStats, unlockMedal, setGlobalModal, unlockAvatar, unlockedAvatars = [] } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!triggerConfetti) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
    const particles = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationFrameId;
    let startTime = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r/3) * 15;

        if (p.y <= canvas.height) {
          active = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active && Date.now() - startTime < 2500) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        setTriggerConfetti(false);
      }
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [triggerConfetti]);

  const filteredRewards = activeCategory === 'all' 
    ? REWARDS 
    : REWARDS.filter(r => r.category === activeCategory);

  const handlePurchase = (rew) => {
    if (rew.category === 'customizacao') {
      const success = unlockAvatar(rew.avatarPath, rew.cost);
      if (success) {
        setTriggerConfetti(true);
      }
      return;
    }

    if (coins >= rew.cost) {
      setCoins(prev => prev - rew.cost);
      setUserStats(prev => {
        const newPurchases = (prev.totalPurchases || 0) + 1;
        if (newPurchases >= 5) unlockMedal('investidor');
        return { ...prev, totalPurchases: newPurchases };
      });
      setTriggerConfetti(true);
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
    <div className="fade-in w-full pb-10 px-4">

      {/* Header Premium Glassmorphic */}
      <section className="relative mb-8 mt-6">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-blue-500/10 blur-3xl rounded-[2rem] -z-10"></div>
        <div className="glass-card rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 glow-blue">
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-yellow-500/10 p-3.5 rounded-2xl border border-yellow-500/20 shadow-md">
                <Store className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Arsenal de Recompensas</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Converta seu suor e dedicação em conquistas tangíveis</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 shadow-inner">
              <Coins className="text-yellow-500 w-8 h-8 drop-shadow-[0_0_8px_rgba(234,179,8,0.35)]" />
              <div>
                <span className="text-3xl font-black text-slate-800 dark:text-white block leading-none">{coins}</span>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-1">Moedas Disponíveis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros por Categoria em Cápsula */}
      <div className="glass-card rounded-[1.5rem] p-1.5 mb-8 overflow-x-auto no-scrollbar max-w-max border border-slate-200/50 dark:border-slate-800/50 shadow-md">
        <div className="flex gap-1">
          {STORE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade de Itens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map(rew => {
          const rarity = RARITY_STYLES[rew.rarity];
          const isUnlockedAvatar = rew.category === 'customizacao' && unlockedAvatars.includes(rew.avatarPath);
          const canAfford = coins >= rew.cost;
          
          return (
            <div 
              key={rew.id} 
              className={`group relative glass-card glass-card-hover rounded-2xl border-2 ${rarity.border} ${rarity.glow} ${rarity.cardBg} ${rarity.neonGlow} overflow-hidden`}
            >
              {/* Rarity Indicator */}
              <div className="absolute top-3 right-3 z-10">
                <span className={`text-[8px] font-black uppercase tracking-widest ${rarity.labelColor} px-2.5 py-1 rounded-full border border-slate-200/30 dark:border-slate-800/40 shadow-sm`}>
                  {rarity.label}
                </span>
              </div>

              <div className="p-6 flex flex-col items-center text-center relative z-10 h-full justify-between">
                <div className="flex flex-col items-center w-full">
                  {/* Ícone ou Imagem de Avatar com efeito hover */}
                  {rew.category === 'customizacao' && rew.avatarPath ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-blue-500/20 dark:border-blue-500/30 mb-4 transform group-hover:scale-105 group-hover:border-blue-500 transition-all duration-300 shadow-lg bg-slate-800 relative">
                      <img src={rew.avatarPath} alt={rew.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-4xl mb-4 transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-md">
                      {rew.icon}
                    </div>
                  )}
                  
                  {/* Info */}
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight mb-1.5">{rew.title}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-normal mb-4 min-h-[32px] px-2">{rew.desc}</p>
                </div>
                
                <div className="w-full flex flex-col items-center">
                  {/* Preço */}
                  <div className="flex items-center gap-1.5 mb-4 bg-slate-50 dark:bg-slate-800/30 px-3.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                    <Coins className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.2)]" />
                    <span className={`text-base font-black ${isUnlockedAvatar ? 'text-slate-400 dark:text-slate-600 line-through' : canAfford ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400'}`}>
                      {rew.cost}
                    </span>
                  </div>
                  
                  {/* Botão */}
                  <button 
                    disabled={isUnlockedAvatar}
                    onClick={() => handlePurchase(rew)}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                      isUnlockedAvatar
                        ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-250 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-default'
                        : canAfford 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/20' 
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {isUnlockedAvatar ? (
                      <span className="flex items-center justify-center gap-2">
                        Adquirido ✓
                      </span>
                    ) : canAfford ? (
                      <span className="flex items-center justify-center gap-2">
                        <Gift className="w-4 h-4 animate-bounce" /> Resgatar
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5" /> Saldo Insuficiente
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Gameplay Badge */}
              {rew.isGameplay && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[8px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3 text-blue-500 fill-current" /> Gameplay
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé Informativo */}
      <div className="mt-12 text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
          Ganhe moedas completando revisões FSRS, treinos TAF e missões semanais.
        </p>
      </div>

      {/* Canvas do Confete de Sucesso */}
      {triggerConfetti && (
        <canvas 
          ref={canvasRef} 
          className="fixed inset-0 pointer-events-none z-50 w-full h-full"
        />
      )}
    </div>
  );
}
