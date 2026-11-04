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
  Award, 
  Pencil, 
  Check, 
  ShoppingBag,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

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

  const [activeRoom, setActiveRoom] = useState('kitchen'); // 'kitchen' | 'bath' | 'bedroom' | 'play' | 'wardrobe'
  const [actionState, setActionState] = useState('idle'); // 'idle' | 'eating' | 'washing' | 'happy'
  const [showMinigame, setShowMinigame] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(petData?.name || 'Recruta K9');
  const [prevPetName, setPrevPetName] = useState(petData?.name);

  // Sincroniza nome caso mude externamente na store
  if (petData?.name !== prevPetName) {
    setPrevPetName(petData?.name);
    if (!isEditingName) {
      setTempName(petData?.name || 'Recruta K9');
    }
  }

  // Informações de nível do pet
  const currentLevelInfo = PET_LEVELS.find(l => l.level === (petData?.level || 1)) || PET_LEVELS[0];
  const nextLevelInfo = PET_LEVELS.find(l => l.level === (petData?.level || 1) + 1);
  const progressToNextLevel = nextLevelInfo 
    ? Math.min(100, Math.round(((petData?.xp || 0) / nextLevelInfo.minXp) * 100))
    : 100;

  const handleSaveName = () => {
    if (tempName.trim()) {
      renamePet(tempName.trim());
      setIsEditingName(false);
      toast.success(`Nome atualizado para ${tempName.trim()}!`);
    }
  };

  // Alimentar Pet
  const handleFeed = (food) => {
    const invCount = petData?.foodInventory?.[food.id] || 0;
    if (invCount <= 0) {
      if (coins < food.cost) {
        toast.error(`Moedas insuficientes para comprar ${food.name}! Estude para ganhar mais.`);
        return;
      }
      buyPetFood(food.id, 1);
    }

    setActionState('eating');
    feedPet(food.id);
    toast.success(`${petData?.name || 'O pet'} adorou o ${food.name}!`);

    setTimeout(() => {
      setActionState('idle');
    }, 1400);
  };

  // Ação de dar banho
  const handleWash = () => {
    setActionState('washing');
    washPet();
    toast.success(`${petData?.name || 'O pet'} está brilhando de limpo! ✨`);
    setTimeout(() => {
      setActionState('happy');
      setTimeout(() => setActionState('idle'), 1200);
    }, 800);
  };

  // Carinho no Mascote
  const handlePetInteraction = () => {
    petThePet();
    setActionState('happy');
    setTimeout(() => setActionState('idle'), 1000);
  };

  // Concluir Minigame
  const handleMinigameOver = (score, coinsEarned) => {
    playWithPet(score, coinsEarned);
    toast.success(`Treino finalizado! +${coinsEarned} moedas creditadas e o K9 está revigorado!`);
  };

  const rooms = [
    { id: 'kitchen', label: 'Cozinha', icon: Utensils, desc: 'Alimente com lanches de plantão' },
    { id: 'bath', label: 'Banheiro', icon: Bath, desc: 'Lave e perfume seu parceiro K9' },
    { id: 'bedroom', label: 'Quarto', icon: Moon, desc: 'Apague a luz para a soneca tática' },
    { id: 'play', label: 'Pátio & Jogos', icon: Gamepad2, desc: 'Brinque e jogue Rodovia Run' },
    { id: 'wardrobe', label: 'Guarda-Roupa', icon: Shirt, desc: 'Boinas, óculos e coletes PRF' },
  ];

  return (
    <div className="fade-in w-full pb-14 font-sans">
      
      {/* CABEÇALHO DO MASCOTE (Dossiê, Nível, Nome & Status Vitais) */}
      <div className="glass-card rounded-[2.2rem] p-6 sm:p-8 mb-6 border border-slate-200 dark:border-slate-800/80 shadow-xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          {/* Identificação do Pet */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400/40 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
              {currentLevelInfo.icon}
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      maxLength={18}
                      className="text-xl font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-800 dark:text-white uppercase outline-none border border-blue-500"
                    />
                    <button 
                      onClick={handleSaveName}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      {petData?.name || 'Recruta K9'}
                    </h2>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                      title="Renomear mascote"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                  Nvl {petData?.level || 1}
                </span>
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 flex items-center gap-1 justify-center md:justify-start">
                <span>{currentLevelInfo.badge}</span>
                <span>{currentLevelInfo.name}</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-600 dark:text-blue-400 font-black">{petData?.xp || 0} XP</span>
              </p>
            </div>
          </div>

          {/* Barra de Evolução Canina */}
          <div className="w-full md:w-72 bg-slate-100 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-1.5">
              <span>Carreira do Mascote</span>
              {nextLevelInfo ? (
                <span>{petData?.xp || 0} / {nextLevelInfo.minXp} XP</span>
              ) : (
                <span className="text-emerald-500">Patente Máxima!</span>
              )}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* AS 4 BARRAS VITAIS DO POU (Fome, Energia, Higiene, Moral) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Fome */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-amber-500" /> Nutrição
              </span>
              <span className={`text-xs font-black ${(petData?.hunger || 0) < 35 ? 'text-red-500' : 'text-amber-500'}`}>
                {petData?.hunger || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${(petData?.hunger || 0) < 35 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${petData?.hunger || 0}%` }}
              />
            </div>
          </div>

          {/* Energia */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-500" /> Energia
              </span>
              <span className={`text-xs font-black ${(petData?.energy || 0) < 35 ? 'text-red-500' : 'text-blue-500'}`}>
                {petData?.energy || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${(petData?.energy || 0) < 35 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${petData?.energy || 0}%` }}
              />
            </div>
          </div>

          {/* Higiene */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-emerald-500" /> Higiene
              </span>
              <span className={`text-xs font-black ${(petData?.hygiene || 0) < 35 ? 'text-red-500' : 'text-emerald-500'}`}>
                {petData?.hygiene || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${(petData?.hygiene || 0) < 35 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${petData?.hygiene || 0}%` }}
              />
            </div>
          </div>

          {/* Moral / Felicidade */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Moral
              </span>
              <span className={`text-xs font-black ${(petData?.fun || 0) < 35 ? 'text-red-500' : 'text-rose-500'}`}>
                {petData?.fun || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${(petData?.fun || 0) < 35 ? 'bg-red-500' : 'bg-rose-500'}`}
                style={{ width: `${petData?.fun || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SELETOR DE CÔMODOS / SALAS DO POU */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
        {rooms.map(room => {
          const Icon = room.icon;
          const isActive = activeRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoom(room.id);
                setShowMinigame(false);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{room.label}</span>
            </button>
          );
        })}
      </div>

      {/* ÁREA PRINCIPAL: O CENÁRIO DA SALA E O MASCOTE VIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA: O CENÁRIO INTERATIVO COM O MASCOTE */}
        <div className="lg:col-span-7">
          <div className={`relative h-[480px] rounded-[2.5rem] border-2 flex flex-col items-center justify-between p-8 overflow-hidden transition-all duration-700 shadow-2xl ${
            activeRoom === 'bedroom' && petData?.isSleeping
              ? 'bg-slate-950 border-indigo-950 shadow-indigo-950/40'
              : activeRoom === 'kitchen'
                ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 border-amber-500/20'
                : activeRoom === 'bath'
                  ? 'bg-gradient-to-b from-sky-500/10 via-slate-900 to-slate-950 border-sky-500/20'
                  : activeRoom === 'bedroom'
                    ? 'bg-gradient-to-b from-indigo-500/10 via-slate-900 to-slate-950 border-indigo-500/20'
                    : 'bg-gradient-to-b from-emerald-500/10 via-slate-900 to-slate-950 border-emerald-500/20'
          }`}>
            
            {/* Elementos cenográficos específicos de cada cômodo */}
            {activeRoom === 'bedroom' && (
              <div className="w-full flex justify-between items-start z-20">
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs font-black uppercase text-indigo-400">
                  {petData?.isSleeping ? '🌙 Soneca Tática Ativa' : '☀️ Luz Acesa'}
                </div>

                {/* Cordinha da Lâmpada do Quarto (Interativa!) */}
                <button
                  onClick={togglePetSleep}
                  className="flex flex-col items-center group cursor-pointer"
                  title="Puxar cordinha para apagar/acender a luz"
                >
                  <div className="w-0.5 h-12 bg-slate-400 group-hover:h-14 transition-all" />
                  <div className={`p-2.5 rounded-full shadow-lg transition-transform group-hover:scale-110 active:scale-90 ${petData?.isSleeping ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-amber-400 border border-slate-700'}`}>
                    {petData?.isSleeping ? <Sun className="w-4 h-4 fill-current" /> : <Moon className="w-4 h-4" />}
                  </div>
                </button>
              </div>
            )}

            {activeRoom === 'bath' && (
              <div className="w-full flex justify-between items-center z-20">
                <span className="text-xs font-black uppercase text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
                  🚿 Box de Higienização K9
                </span>
                <button
                  onClick={handleWash}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase px-4 py-2 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Bath className="w-4 h-4" /> Dar Banho Completo
                </button>
              </div>
            )}

            {/* O MASCOTE VIVO (Componente PouMascot) */}
            <div className="my-auto z-10 flex flex-col items-center">
              <PouMascot
                petData={petData}
                actionState={actionState}
                onPetClick={handlePetInteraction}
                isSleeping={Boolean(petData?.isSleeping)}
              />
              
              <span className="text-[11px] font-bold text-slate-400 uppercase mt-4 bg-slate-900/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-800">
                Toque no {petData?.name || 'K9'} para dar carinho ❤️
              </span>
            </div>

            {/* Chão cenográfico */}
            <div className="w-full pt-4 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase z-10">
              <span>QG Central PRF</span>
              <span>Companheiro Fiel do Concurso</span>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: PAINEL DE AÇÃO DA SALA ATIVA */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* COZINHA: DESPENSA E ALIMENTOS */}
          {activeRoom === 'kitchen' && (
            <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-1">
                  <Utensils className="text-amber-500 w-5 h-5" /> Despensa do Plantão
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase mb-4">
                  Clique para dar a comida direto na boca do pet!
                </p>

                <div className="space-y-3">
                  {PET_FOODS.map(food => {
                    const invCount = petData?.foodInventory?.[food.id] || 0;
                    return (
                      <div 
                        key={food.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{food.icon}</span>
                          <div>
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">
                              {food.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold">
                              +{food.hunger}% Fome • +{food.energy}% Energia
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {invCount > 0 ? (
                            <button
                              onClick={() => handleFeed(food)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Alimentar</span>
                              <span className="text-[10px] bg-amber-600/30 px-1.5 py-0.5 rounded-md font-mono">
                                x{invCount}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFeed(food)}
                              className="bg-slate-200 dark:bg-slate-800 hover:bg-amber-500 text-slate-700 dark:text-white hover:text-slate-950 font-black text-xs uppercase px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <Coins className="w-3.5 h-3.5 text-yellow-500" />
                              <span>{food.cost}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase text-center">
                💡 Dica: Estudar no Ciclo gera moedas para comprar mais suprimentos!
              </div>
            </div>
          )}

          {/* BANHEIRO: PRODUTOS DE HIGIENE */}
          {activeRoom === 'bath' && (
            <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-1">
                  <Bath className="text-sky-500 w-5 h-5" /> Tratamento e Limpeza
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase mb-4">
                  Cães operacionais precisam estar sempre com a farda e pelo impecáveis.
                </p>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center flex flex-col items-center">
                    <span className="text-4xl mb-2">🧼</span>
                    <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white mb-1">
                      Banho Geral com Shampoo Tático
                    </h4>
                    <p className="text-xs text-slate-400 font-bold mb-4 max-w-xs">
                      Remove toda a poeira das blitzes e enche a barra de higiene para 100%.
                    </p>
                    <button
                      onClick={handleWash}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Lavar Mascote Agora
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase text-center">
                ✨ Higiene alta previne que o K9 fique triste ou desmotivado.
              </div>
            </div>
          )}

          {/* QUARTO: CONTROLE DE REPOUSO */}
          {activeRoom === 'bedroom' && (
            <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-1">
                  <Moon className="text-indigo-500 w-5 h-5" /> Centro de Repouso Tático
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase mb-4">
                  O descanso é fundamental para a consolidação da memória.
                </p>

                <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center flex flex-col items-center">
                  <span className="text-4xl mb-3">{petData?.isSleeping ? '😴' : '🐕'}</span>
                  <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white mb-1">
                    {petData?.isSleeping ? 'Em Sono Reparador' : 'Pronto para o Descanso'}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mb-6 max-w-xs">
                    {petData?.isSleeping 
                      ? 'O K9 está dormindo e regenerando sua energia vital continuamente.' 
                      : 'Apague a luz para que o mascote durma e restaure 100% da disposição.'}
                  </p>
                  
                  <button
                    onClick={togglePetSleep}
                    className={`font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                      petData?.isSleeping
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                    }`}
                  >
                    {petData?.isSleeping ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span>{petData?.isSleeping ? 'Acordar Mascote' : 'Colocar para Dormir'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase text-center">
                💤 Quando você desliga o app à noite, o pet dorme com você!
              </div>
            </div>
          )}

          {/* PÁTIO DE TREINO: MINIGAME K9 RODOVIA RUN */}
          {activeRoom === 'play' && (
            <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-1">
                  <Gamepad2 className="text-emerald-500 w-5 h-5" /> Pátio Operacional & Treino
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase mb-4">
                  Brinque com o cão para elevar sua moral e ganhar moedas extras!
                </p>

                <div className="space-y-4">
                  {/* Card do Minigame Rodovia Run */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-blue-500/15 border border-emerald-500/30 flex flex-col items-center text-center">
                    <span className="text-4xl mb-2">🚧 🐕</span>
                    <h4 className="text-base font-black uppercase text-slate-800 dark:text-white mb-1">
                      Minigame: K9 Rodovia Run
                    </h4>
                    <p className="text-xs text-slate-400 font-bold mb-5 max-w-xs">
                      Pule os cones da blitz e radares na rodovia! Colete moedas para transferir pro seu saldo do QG.
                    </p>
                    <button
                      onClick={() => setShowMinigame(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" /> Jogar Agora
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase text-center">
                🎾 Fazer carinho direto nele também restaura moral e aproxima vocês!
              </div>
            </div>
          )}

          {/* GUARDA-ROUPA & BOUTIQUE DE ACESSÓRIOS */}
          {activeRoom === 'wardrobe' && (
            <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 h-full flex flex-col">
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase flex items-center gap-2 mb-1">
                <Shirt className="text-purple-500 w-5 h-5" /> Guarda-Roupa Tático
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase mb-3">
                Equipe acessórios oficiais da PRF usando suas moedas.
              </p>

              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2.5 max-h-[380px]">
                {PET_ACCESSORIES.map(acc => {
                  const isUnlocked = petData?.unlockedItems?.includes(acc.id) || acc.cost === 0;
                  const isEquipped = (acc.type === 'hat' && petData?.hat === acc.id.replace('hat:', '')) ||
                                    (acc.type === 'outfit' && petData?.outfit === acc.id.replace('outfit:', '')) ||
                                    (acc.type === 'skin' && petData?.skin === acc.id.replace('skin:', ''));
                  const badge = RARITY_BADGES[acc.rarity];

                  return (
                    <div 
                      key={acc.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        isEquipped 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{acc.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">
                              {acc.name}
                            </h4>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold leading-tight line-clamp-1">
                            {acc.desc}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 block text-center">
                            Equipado
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => {
                              equipPetItem(acc.type, acc.id.replace(`${acc.type}:`, ''));
                              toast.success(`${acc.name} equipado!`);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase px-4 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            Equipar
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (coins < acc.cost) {
                                toast.error(`Moedas insuficientes (${coins}/${acc.cost})! Estude mais para ganhar moedas.`);
                                return;
                              }
                              buyPetAccessory(acc);
                            }}
                            className="bg-slate-200 dark:bg-slate-800 hover:bg-yellow-500 hover:text-slate-950 text-slate-700 dark:text-white font-black text-xs uppercase px-3.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            <span>{acc.cost}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL DO MINIGAME K9 RODOVIA RUN */}
      <AnimatePresence>
        {showMinigame && (
          <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
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
