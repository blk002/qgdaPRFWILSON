import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import PouMascot from '../components/PouMascot';
import K9RodoviaRun from '../components/K9RodoviaRun';
import {
  PET_FOODS,
  PET_ACCESSORIES,
  PET_LEVELS,
  RARITY_BADGES
} from '../data/petConstants';
import {
  Utensils,
  Bath,
  Moon,
  Sun,
  Gamepad2,
  Shirt,
  Heart,
  Zap,
  Sparkles,
  Coins,
  Pencil,
  Check,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

const ROOMS = [
  { id: 'kitchen', label: 'Cozinha', icon: Utensils },
  { id: 'bath', label: 'Banheiro', icon: Bath },
  { id: 'bedroom', label: 'Quarto', icon: Moon },
  { id: 'play', label: 'Pátio & Jogos', icon: Gamepad2 },
  { id: 'wardrobe', label: 'Guarda-Roupa', icon: Shirt },
];

export default function Pet() {
  const {
    petData,
    coins,
    feedPet,
    buyPetFood,
    washPet,
    togglePetSleep,
    petThePet,
    playWithPet,
    equipPetItem,
    buyPetAccessory,
    renamePet
  } = useStore();

  const [activeRoom, setActiveRoom] = useState('kitchen');
  const [actionState, setActionState] = useState('idle');
  const [showMinigame, setShowMinigame] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(petData?.name || 'Recruta K9');
  const [prevPetName, setPrevPetName] = useState(petData?.name);

  if (petData?.name !== prevPetName) {
    setPrevPetName(petData?.name);
    if (!isEditingName) {
      setTempName(petData?.name || 'Recruta K9');
    }
  }

  const currentLevelInfo = PET_LEVELS.find(l => l.level === (petData?.level || 1)) || PET_LEVELS[0];
  const nextLevelInfo = PET_LEVELS.find(l => l.level === (petData?.level || 1) + 1);
  const levelSpan = nextLevelInfo ? Math.max(1, nextLevelInfo.minXp - currentLevelInfo.minXp) : 1;
  const progressToNextLevel = nextLevelInfo
    ? Math.max(0, Math.min(100, Math.round((((petData?.xp || 0) - currentLevelInfo.minXp) / levelSpan) * 100)))
    : 100;

  const handleSaveName = () => {
    if (tempName.trim()) {
      renamePet(tempName.trim());
      setIsEditingName(false);
      toast.success(`Nome atualizado para ${tempName.trim()}.`);
    }
  };

  const handleFeed = (food) => {
    const invCount = petData?.foodInventory?.[food.id] || 0;
    if (invCount <= 0) {
      if (coins < food.cost) {
        toast.error(`Moedas insuficientes para comprar ${food.name}.`);
        return;
      }
      buyPetFood(food.id, 1);
    }

    setActionState('eating');
    feedPet(food.id);
    toast.success(`${petData?.name || 'O pet'} adorou ${food.name}!`);

    setTimeout(() => {
      setActionState('idle');
    }, 1400);
  };

  const handleWash = () => {
    setActionState('washing');
    washPet();
    toast.success(`${petData?.name || 'O pet'} está limpo e pronto.`);
    setTimeout(() => {
      setActionState('happy');
      setTimeout(() => setActionState('idle'), 1200);
    }, 800);
  };

  const handlePetInteraction = () => {
    petThePet();
    setActionState('happy');
    setTimeout(() => setActionState('idle'), 1000);
  };

  const handleMinigameOver = (score, coinsEarned) => {
    playWithPet(score, coinsEarned);
    toast.success(`Treino finalizado! +${coinsEarned} moedas creditadas.`);
  };

  const vitals = [
    { label: 'Nutrição', value: petData?.hunger || 0, icon: Utensils, color: 'text-amber-500', bar: 'bg-amber-500' },
    { label: 'Energia', value: petData?.energy || 0, icon: Zap, color: 'text-sky-500', bar: 'bg-sky-500' },
    { label: 'Higiene', value: petData?.hygiene || 0, icon: Bath, color: 'text-emerald-500', bar: 'bg-emerald-500' },
    { label: 'Moral', value: petData?.fun || 0, icon: Heart, color: 'text-rose-500', bar: 'bg-rose-500' },
  ];

  const roomStageBg =
    activeRoom === 'bedroom' && petData?.isSleeping
      ? 'bg-slate-950 border-slate-800'
      : activeRoom === 'kitchen'
        ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 border-slate-800'
        : activeRoom === 'bath'
          ? 'bg-gradient-to-b from-sky-500/10 via-slate-900 to-slate-950 border-slate-800'
          : activeRoom === 'bedroom'
            ? 'bg-gradient-to-b from-indigo-500/10 via-slate-900 to-slate-950 border-slate-800'
            : 'bg-gradient-to-b from-emerald-500/10 via-slate-900 to-slate-950 border-slate-800';

  return (
    <div className="fade-in w-full pb-12 space-y-6">
      {/* Cabeçalho transparente padronizado */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  maxLength={18}
                  className="font-display text-lg sm:text-xl font-bold bg-transparent border-b-2 border-sky-500 text-slate-900 dark:text-white outline-none w-48"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="w-8 h-8 bg-sky-600 text-white rounded-lg hover:bg-sky-500 flex items-center justify-center cursor-pointer"
                  aria-label="Salvar nome"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="text-xl leading-none">{currentLevelInfo.icon}</span>
                <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {petData?.name || 'Recruta K9'}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-sky-500 transition-colors rounded-md cursor-pointer"
                  title="Renomear mascote"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Nível {petData?.level || 1} · {currentLevelInfo.name} · {(petData?.xp || 0).toLocaleString()} XP · {coins.toLocaleString()} moedas
          </p>
        </div>

        {/* Progresso de nível compacto */}
        <div className="w-full md:w-64 space-y-1.5 shrink-0">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>Progresso de nível</span>
            {nextLevelInfo ? (
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {petData?.xp || 0} / {nextLevelInfo.minXp} XP
              </span>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Nível máximo</span>
            )}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
        </div>
      </header>

      {/* Strip único de status vitais */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
        {vitals.map((v) => {
          const Icon = v.icon;
          const isLow = v.value < 35;
          return (
            <div key={v.label} className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${v.color}`} />
                  {v.label}
                </span>
                <span className={`font-mono font-semibold tabular-nums ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {v.value}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isLow ? 'bg-rose-500' : v.bar}`}
                  style={{ width: `${v.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Navegação por cômodos (underline) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {ROOMS.map(room => {
            const Icon = room.icon;
            const isActive = activeRoom === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoom(room.id);
                  setShowMinigame(false);
                }}
                className={`relative px-3.5 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{room.label}</span>
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cenário interativo + Painel da sala */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda: palco interativo */}
        <div className="lg:col-span-7">
          <div className={`relative h-[440px] rounded-xl border flex flex-col items-center justify-between p-6 overflow-hidden transition-colors duration-500 ${roomStageBg}`}>
            {activeRoom === 'bedroom' && (
              <div className="w-full flex justify-between items-start z-20">
                <span className="text-xs font-medium text-indigo-300">
                  {petData?.isSleeping ? 'Soneca ativa' : 'Luz acesa'}
                </span>

                <button
                  type="button"
                  onClick={togglePetSleep}
                  className="flex flex-col items-center group cursor-pointer"
                  title="Puxar cordinha para apagar ou acender a luz"
                >
                  <div className="w-0.5 h-10 bg-slate-500 group-hover:h-12 transition-all" />
                  <div className={`p-2 rounded-full transition-transform group-hover:scale-105 active:scale-95 ${
                    petData?.isSleeping
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-slate-800 text-amber-400 border border-slate-700'
                  }`}>
                    {petData?.isSleeping ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                </button>
              </div>
            )}

            {activeRoom === 'bath' && (
              <div className="w-full flex justify-between items-center z-20">
                <span className="text-xs font-medium text-sky-300">Box de higienização</span>
                <button
                  type="button"
                  onClick={handleWash}
                  className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bath className="w-3.5 h-3.5" />
                  Dar banho
                </button>
              </div>
            )}

            <div className="my-auto z-10 flex flex-col items-center">
              <PouMascot
                petData={petData}
                actionState={actionState}
                onPetClick={handlePetInteraction}
                isSleeping={Boolean(petData?.isSleeping)}
              />
              <span className="text-xs text-slate-400 mt-4">
                Toque no {petData?.name || 'K9'} para dar carinho
              </span>
            </div>

            <div className="w-full pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500 z-10">
              <span>QG Central PRF</span>
              <span>{ROOMS.find(r => r.id === activeRoom)?.label}</span>
            </div>
          </div>
        </div>

        {/* Coluna direita: painel da sala */}
        <div className="lg:col-span-5">
          {activeRoom === 'kitchen' && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl h-full flex flex-col justify-between overflow-hidden">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-500" />
                    <span>Despensa</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Alimente seu mascote para repor nutrição e energia.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {PET_FOODS.map(food => {
                    const invCount = petData?.foodInventory?.[food.id] || 0;
                    return (
                      <div key={food.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{food.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {food.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              +{food.hunger}% fome · +{food.energy}% energia
                            </p>
                          </div>
                        </div>

                        {invCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleFeed(food)}
                            className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                          >
                            <span>Alimentar</span>
                            <span className="font-mono text-[11px] opacity-80">x{invCount}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleFeed(food)}
                            className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-mono tabular-nums">{food.cost}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Estudar no ciclo gera moedas para adquirir suprimentos.
              </div>
            </section>
          )}

          {activeRoom === 'bath' && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl h-full flex flex-col justify-between overflow-hidden">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bath className="w-4 h-4 text-sky-500" />
                    <span>Higiene</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mantenha a higiene em dia para preservar a moral do K9.
                  </p>
                </div>

                <div className="p-6 text-center flex flex-col items-center">
                  <span className="text-4xl mb-3">🧼</span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Banho completo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-xs">
                    Restaura a barra de higiene para 100% imediatamente.
                  </p>
                  <button
                    type="button"
                    onClick={handleWash}
                    className="h-9 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Lavar mascote
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Higiene alta evita queda na motivação do mascote.
              </div>
            </section>
          )}

          {activeRoom === 'bedroom' && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl h-full flex flex-col justify-between overflow-hidden">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Repouso</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Apague a luz para recuperar energia continuamente.
                  </p>
                </div>

                <div className="p-6 text-center flex flex-col items-center">
                  <span className="text-4xl mb-3">{petData?.isSleeping ? '😴' : '🐕'}</span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {petData?.isSleeping ? 'Em sono reparador' : 'Acordado e alerta'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-xs">
                    {petData?.isSleeping
                      ? 'O K9 está descansando e regenerando energia vital.'
                      : 'Coloque o mascote para dormir para restaurar 100% da disposição.'}
                  </p>
                  <button
                    type="button"
                    onClick={togglePetSleep}
                    className={`h-9 px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      petData?.isSleeping
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950'
                    }`}
                  >
                    {petData?.isSleeping ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>{petData?.isSleeping ? 'Acordar mascote' : 'Colocar para dormir'}</span>
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Você também pode puxar o interruptor no canto superior direito do quarto.
              </div>
            </section>
          )}

          {activeRoom === 'play' && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl h-full flex flex-col justify-between overflow-hidden">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-emerald-500" />
                    <span>Pátio & Minigame</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Treine no pátio para elevar a moral e ganhar moedas extras.
                  </p>
                </div>

                <div className="p-6 text-center flex flex-col items-center">
                  <span className="text-4xl mb-3">🚧 🐕</span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    K9 Rodovia Run
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-xs">
                    Desvie dos cones e radares na rodovia e acumule moedas para o seu saldo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMinigame(true)}
                    className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Jogar agora
                  </button>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Fazer carinho direto no mascote também aumenta a moral.
              </div>
            </section>
          )}

          {activeRoom === 'wardrobe' && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl h-full flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-purple-500" />
                  <span>Guarda-Roupa</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Equipe acessórios e pelagens usando suas moedas.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[360px] divide-y divide-slate-100 dark:divide-slate-800">
                {PET_ACCESSORIES.map(acc => {
                  const isUnlocked = petData?.unlockedItems?.includes(acc.id) || acc.cost === 0;
                  const isEquipped =
                    (acc.type === 'hat' && petData?.hat === acc.id.replace('hat:', '')) ||
                    (acc.type === 'outfit' && petData?.outfit === acc.id.replace('outfit:', '')) ||
                    (acc.type === 'skin' && petData?.skin === acc.id.replace('skin:', ''));
                  const badge = RARITY_BADGES[acc.rarity];

                  return (
                    <div
                      key={acc.id}
                      className={`px-5 py-3 flex items-center justify-between gap-3 ${
                        isEquipped ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{acc.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {acc.name}
                            </p>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                              {badge?.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {acc.desc}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Equipado
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              equipPetItem(acc.type, acc.id.replace(`${acc.type}:`, ''));
                              toast.success(`${acc.name} equipado.`);
                            }}
                            className="h-8 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Equipar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (coins < acc.cost) {
                                toast.error(`Moedas insuficientes (${coins}/${acc.cost}).`);
                                return;
                              }
                              buyPetAccessory(acc);
                            }}
                            className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-mono tabular-nums">{acc.cost}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modal do Minigame K9 Rodovia Run */}
      <AnimatePresence>
        {showMinigame && (
          <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <K9RodoviaRun
                petSkin={petData?.skin || 'caramel'}
                onClose={() => setShowMinigame(false)}
                onGameOver={handleMinigameOver}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
