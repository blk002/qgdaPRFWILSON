import { useState } from 'react';

export const PATENTES = [
  { id: 'recruta', name: 'Recruta', minXp: 0, color: 'text-slate-400', icon: '🔰' },
  { id: 'agente_3', name: 'Agente (3ª Classe)', minXp: 1000, color: 'text-emerald-500', icon: '👮‍♂️' },
  { id: 'agente_2', name: 'Agente (2ª Classe)', minXp: 5000, color: 'text-blue-500', icon: '🎖️' },
  { id: 'agente_1', name: 'Agente (1ª Classe)', minXp: 15000, color: 'text-purple-500', icon: '🛡️' },
  { id: 'especial', name: 'Agente Especial', minXp: 40000, color: 'text-orange-500', icon: '🔥' },
  { id: 'inspetor', name: 'Inspetor (Lenda)', minXp: 100000, color: 'text-red-600', icon: '👑' },
];

export const MEDALHAS = [
  { id: 'fenix', title: 'Fênix', desc: 'Recuperou uma sequência de 7 dias após uma pausa.', icon: '🔥' },
  { id: 'elite', title: 'Atirador de Elite', desc: 'Nota superior a 80% em um Simulado.', icon: '🎯' },
  { id: 'ironman', title: 'Ironman', desc: 'Nota máxima (25 pts) em um TAF.', icon: '🦾' },
  { id: 'muralha', title: 'Muralha', desc: 'Manteve 100% de revisões por 5 dias.', icon: '🧱' },
  { id: 'investidor', title: 'Investidor', desc: 'Comprou 5 itens na loja de recompensas.', icon: '💰' }
];

export function useGamification(savedData, setGlobalModal) {
  const [coins, setCoins] = useState(() => savedData?.coins ?? 250);
  const [userStats, setUserStats] = useState(() => savedData?.userStats || { xp: 0, medals: [], totalStudyMinutes: 0 });
  const [streakData, setStreakData] = useState(() => savedData?.streakData || { currentStreak: 0, lastCheckDate: null, history: [] });

  const addXP = (amount, reason = "") => {
    setUserStats(prev => ({ ...prev, xp: prev.xp + amount }));
    if (reason) {
       console.log(`+${amount} XP: ${reason}`); // Toast fallback
    }
  };

  const unlockMedal = (medalId) => {
    if (!userStats.medals.includes(medalId)) {
      setUserStats(prev => ({ ...prev, medals: [...prev.medals, medalId] }));
      const medal = MEDALHAS.find(m => m.id === medalId);
      if (setGlobalModal) {
        setGlobalModal({ 
          title: "🏅 Nova Medalha Desbloqueada!", 
          message: `Parabéns combatente! Você conquistou a medalha: ${medal.title} - ${medal.desc}`, 
          isAlert: true 
        });
      }
    }
  };

  const getCurrentPatente = () => {
    const sorted = [...PATENTES].reverse();
    return sorted.find(p => userStats.xp >= p.minXp) || PATENTES[0];
  };

  return { 
    coins, setCoins, 
    userStats, setUserStats, 
    streakData, setStreakData,
    addXP, unlockMedal, getCurrentPatente 
  };
}
