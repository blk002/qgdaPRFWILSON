import { useState } from 'react';
import { useConfetti } from '../hooks/useConfetti';
import { useStore } from '../store/useStore';
import { assetUrl } from '../lib/assets';
import {
  Coins,
  Sparkles,
  Gamepad2,
  Heart,
  Zap,
  Gift,
  Crown,
  Lock,
  User,
  Check
} from 'lucide-react';

const STORE_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'lazer', label: 'Lazer', icon: Gamepad2 },
  { id: 'bem-estar', label: 'Bem-estar', icon: Heart },
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

  // Customização (Avatares & Temas)
  { id: 20, title: 'Guerreiro Phoenix', desc: 'Avatar lendário Phoenix da inteligência.', cost: 800, icon: '🔥', category: 'customizacao', rarity: 'legendary', avatarPath: '/assets/gamification/phoenix.png' },
  { id: 21, title: 'Atirador Sniper', desc: 'Avatar do grupo de atiradores de elite.', cost: 500, icon: '🎯', category: 'customizacao', rarity: 'epic', avatarPath: '/assets/gamification/sniper.png' },
  { id: 22, title: 'Muralha Operacional', desc: 'Avatar com escudo tático pesado.', cost: 300, icon: '🛡️', category: 'customizacao', rarity: 'rare', avatarPath: '/assets/gamification/wall.png' },
  { id: 23, title: 'Investidor PRF', desc: 'Avatar exclusivo da divisão financeira.', cost: 400, icon: '💼', category: 'customizacao', rarity: 'rare', avatarPath: '/assets/gamification/investor.png' },
  { id: 24, title: 'Agente de Ferro', desc: 'Avatar especial blindado com exoesqueleto.', cost: 1000, icon: '🤖', category: 'customizacao', rarity: 'legendary', avatarPath: '/assets/gamification/ironman.png' },
  { id: 25, title: 'Diretor Geral', desc: 'Avatar máximo do comando central da PRF.', cost: 1500, icon: '🦁', category: 'customizacao', rarity: 'legendary', avatarPath: '/assets/gamification/diretor_geral.png' },
  { id: 30, title: 'Tema Forest Green', desc: 'Customização visual verde floresta.', cost: 300, icon: '🌲', category: 'customizacao', rarity: 'uncommon', isTheme: true, themeId: 'forest' },
  { id: 31, title: 'Tema Cyber Purple', desc: 'Customização visual roxa cibernética.', cost: 400, icon: '🔮', category: 'customizacao', rarity: 'rare', isTheme: true, themeId: 'purple' },
  { id: 32, title: 'Tema Obsidian Gold', desc: 'Customização visual ouro obsidiana.', cost: 600, icon: '🔱', category: 'customizacao', rarity: 'epic', isTheme: true, themeId: 'gold' },
  { id: 33, title: 'Tema Crimson Red', desc: 'Customização visual vermelha carmesim.', cost: 500, icon: '🩸', category: 'customizacao', rarity: 'rare', isTheme: true, themeId: 'crimson' },
  { id: 34, title: 'Tema Dark Blue', desc: 'Customização visual padrão azul marinho PRF.', cost: 0, icon: '🔵', category: 'customizacao', rarity: 'common', isTheme: true, themeId: 'blue' },

  // Premium
  { id: 11, title: 'Jantar Especial', desc: 'Restaurante ou delivery premium.', cost: 1500, icon: '🥂', category: 'premium', rarity: 'epic' },
  { id: 12, title: 'Item de Desejo', desc: 'Compre algo que você quiser.', cost: 3000, icon: '🎁', category: 'premium', rarity: 'legendary' },
];

const RARITY_STYLES = {
  common: { label: 'Comum', text: 'text-slate-500 dark:text-slate-400' },
  uncommon: { label: 'Incomum', text: 'text-emerald-600 dark:text-emerald-400' },
  rare: { label: 'Raro', text: 'text-sky-600 dark:text-sky-400' },
  epic: { label: 'Épico', text: 'text-purple-600 dark:text-purple-400' },
  legendary: { label: 'Lendário', text: 'text-amber-600 dark:text-amber-400' },
};

export default function Loja() {
  const {
    coins,
    setGlobalModal,
    unlockedAvatars = [],
    unlockedThemes = [],
    activeTheme,
    buyReward,
    unlockTheme,
    selectTheme
  } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const { setTriggerConfetti, ConfettiCanvas } = useConfetti();

  const filteredRewards = activeCategory === 'all'
    ? REWARDS
    : REWARDS.filter(r => r.category === activeCategory);

  const handlePurchase = (rew) => {
    if (rew.isTheme) {
      const success = unlockTheme(rew.themeId, rew.cost);
      if (success) {
        setTriggerConfetti(true);
        setGlobalModal({
          title: 'Tema adquirido',
          message: `Você desbloqueou o tema "${rew.title}". Já pode equipá-lo quando quiser.`,
          isAlert: true
        });
      } else {
        setGlobalModal({
          title: 'Saldo insuficiente',
          message: `Você precisa de mais ${rew.cost - coins} moedas para resgatar "${rew.title}".`,
          isAlert: true
        });
      }
      return;
    }

    const success = buyReward(rew);
    if (success) {
      setTriggerConfetti(true);
      setGlobalModal({
        title: 'Resgate efetuado',
        message: `Você resgatou "${rew.title}". ${rew.isGameplay ? 'O bônus já está ativo no seu perfil.' : 'Aproveite sua recompensa.'}`,
        isAlert: true
      });
    } else if (coins < rew.cost) {
      setGlobalModal({
        title: 'Saldo insuficiente',
        message: `Você precisa de mais ${rew.cost - coins} moedas para resgatar "${rew.title}".`,
        isAlert: true
      });
    }
  };

  return (
    <div className="fade-in w-full pb-10 space-y-6">
      {/* Cabeçalho transparente */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Loja de Recompensas
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Troque suas moedas por recompensas de lazer, bônus de estudo, avatares e temas visuais.
          </p>
        </div>

        <div className="flex items-center gap-2 text-right shrink-0">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">
            {coins.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">moedas</span>
        </div>
      </header>

      {/* Navegação por categoria (underline padronizada) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {STORE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-3.5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade de itens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRewards.map(rew => {
          const rarity = RARITY_STYLES[rew.rarity];
          const isTheme = rew.isTheme;
          const isUnlocked = isTheme
            ? unlockedThemes.includes(rew.themeId)
            : (rew.avatarPath ? unlockedAvatars.includes(rew.avatarPath) : false);
          const isEquipped = isTheme ? activeTheme === rew.themeId : false;
          const isUnlockedAvatar = Boolean(rew.avatarPath && unlockedAvatars.includes(rew.avatarPath));
          const canAfford = coins >= rew.cost;

          return (
            <div
              key={rew.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className={`font-semibold ${rarity.text}`}>{rarity.label}</span>
                  {rew.isGameplay && (
                    <span className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
                      <Zap className="w-3 h-3" />
                      Bônus ativo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3.5">
                  {rew.category === 'customizacao' && rew.avatarPath ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img src={assetUrl(rew.avatarPath)} alt={rew.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-2xl shrink-0">
                      {rew.icon}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {rew.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {rew.desc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isUnlocked
                        ? 'text-slate-400 dark:text-slate-500 line-through'
                        : canAfford
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {rew.cost}
                  </span>
                </div>

                {isTheme && isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => selectTheme(rew.themeId)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isEquipped
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950'
                    }`}
                  >
                    {isEquipped && <Check className="w-3.5 h-3.5" />}
                    <span>{isEquipped ? 'Equipado' : 'Equipar'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUnlockedAvatar || !canAfford}
                    onClick={() => handlePurchase(rew)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      isUnlockedAvatar
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                        : canAfford
                          ? 'bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isUnlockedAvatar ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Adquirido</span>
                      </>
                    ) : canAfford ? (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        <span>Resgatar</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Indisponível</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
        Ganhe moedas concluindo revisões FSRS, treinos TAF e contratos diários ou semanais.
      </p>

      <ConfettiCanvas />
    </div>
  );
}
