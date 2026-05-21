import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';

const seedStudyHistory = (totalStudyMinutes) => {
  const history = {};
  if (!totalStudyMinutes || totalStudyMinutes <= 0) return history;
  let remainingMinutes = totalStudyMinutes;
  const today = new Date();
  for (let i = 25; i >= 0 && remainingMinutes > 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (Math.random() > 0.3) {
      const sessionMins = Math.min(remainingMinutes, Math.floor(Math.random() * 61) + 30);
      history[dateStr] = sessionMins;
      remainingMinutes -= sessionMins;
    }
  }
  if (remainingMinutes > 0) {
    const todayStr = today.toISOString().split('T')[0];
    history[todayStr] = (history[todayStr] || 0) + remainingMinutes;
  }
  return history;
};

const getCleanInitialState = () => ({
  subjects: {},
  cycle: [],
  currentDayIndex: 0,
  completedToday: [],
  targetExamDate: '2026-08-15',
  coins: 250,
  userStats: { xp: 0, medals: [], totalStudyMinutes: 0, avatar: '/assets/gamification/avatar_male.png' },
  streakData: { currentStreak: 0, lastCheckDate: null },
  enableSounds: true,
  weeklySprint: { goalHours: 35, currentMinutes: 0, weekStart: new Date().toISOString() },
  reviews: [],
  reviewStats: { totalDone: 0, correct: 0, streak: 0 },
  simulados: [],
  tafHistory: [],
  tafTrainingStatus: { lastDoneDate: null },
  studyHistory: {},
  isDarkMode: true,
  activeTab: 'carreira',
  // todayStr removido do estado — agora é computado via getLocalDateStr()
  calendarDate: new Date(),
  reviewCalendarDate: new Date(),
  seasonalData: {
    currentSeason: 1,
    seasonName: "Recruta Operacional",
    seasonXp: 0,
    seasonGoalXp: 5000,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  weeklyMissions: [
    { id: 'm1', title: 'Cérebro Ativo', description: 'Complete 10 revisões FSRS', goal: 10, current: 0, xpReward: 150, coinReward: 50, type: 'review', completed: false, claimed: false },
    { id: 'm2', title: 'Combatente Físico', description: 'Registre 2 treinos TAF', goal: 2, current: 0, xpReward: 100, coinReward: 30, type: 'taf', completed: false, claimed: false },
    { id: 'm3', title: 'Simulado de Elite', description: 'Registre 1 novo Simulado', goal: 1, current: 0, xpReward: 120, coinReward: 40, type: 'simulado', completed: false, claimed: false },
    { id: 'm4', title: 'Persistência Total', description: 'Assista 4 aulas de teoria', goal: 4, current: 0, xpReward: 200, coinReward: 60, type: 'study', completed: false, claimed: false },
  ],
  unlockedAvatars: [
    '/assets/gamification/avatar_male.png',
    '/assets/gamification/avatar_female.png'
  ],
  dailyMissions: [],
  lastDailyResetDate: null,
});

export const useStore = create(
    (set, get) => ({
      // --- ESTADOS INICIAIS (NUVEM) ---
      ...getCleanInitialState(),
      isSyncing: true,

      // --- ESTADOS VOLÁTEIS (INTERFACE) ---
      globalModal: null,
      reviewModal: null,
      classConfirmModal: null,
      replaceSubjectModal: null,

      // --- SUPABASE / CLOUD ---
      session: null,
      user: null,
      setSession: (session) => set({ session, user: session?.user ?? null }),
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
        localStorage.removeItem('prf-qg-storage');
        window.location.reload();
      },

      loadFromCloud: async (retryCount = 0) => {
        const { user, isLoadingFromCloud } = get();
        if (!user) return false;
        if (isLoadingFromCloud && retryCount === 0) return false;

        if (retryCount === 0) {
          console.log('☁️ [Nuvem] Iniciando carregamento de dados seguros...');
          set({ isSyncing: true, isLoadingFromCloud: true });
        }

        try {
          // Timeout ultra-rápido de 2.5 segundos para não travar o usuário
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 2500)
          );

          const fetchPromise = supabase.from('profiles').select('full_data').eq('id', user.id).limit(1);
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

          if (error) throw error;
          
          if (data && data.length > 0 && data[0].full_data) {
            console.log("✅ [Nuvem] Dados sincronizados com sucesso.");
            const { isSyncing: _, ...cleanData } = data[0].full_data;
            if (cleanData.calendarDate) cleanData.calendarDate = new Date(cleanData.calendarDate);
            if (cleanData.reviewCalendarDate) cleanData.reviewCalendarDate = new Date(cleanData.reviewCalendarDate);
            
            if (!cleanData.studyHistory || Object.keys(cleanData.studyHistory).length === 0) {
              const totalMins = cleanData.userStats?.totalStudyMinutes || 0;
              if (totalMins > 0) {
                cleanData.studyHistory = seedStudyHistory(totalMins);
              }
            }

            // Retrocompatibilidade para gamificação/avatares/missões diárias
            if (!cleanData.unlockedAvatars || cleanData.unlockedAvatars.length === 0) {
              cleanData.unlockedAvatars = [
                '/assets/gamification/avatar_male.png',
                '/assets/gamification/avatar_female.png'
              ];
            }
            if (!cleanData.dailyMissions) {
              cleanData.dailyMissions = [];
            }
            if (!cleanData.lastDailyResetDate) {
              cleanData.lastDailyResetDate = null;
            }
            if (cleanData.userStats && !cleanData.userStats.avatar) {
              cleanData.userStats.avatar = '/assets/gamification/avatar_male.png';
            }
            
            set({ ...cleanData, isSyncing: false, isLoadingFromCloud: false });
            return true;
          }
          console.log('ℹ️ [Nuvem] Perfil pronto para uso.');
        } catch (error) {
          if (retryCount < 2) {
            console.warn(`⚠️ [Nuvem] Tentativa ${retryCount + 1} falhou (ou timeout). Tentando novamente...`);
            return await get().loadFromCloud(retryCount + 1);
          }
          console.error('❌ [Nuvem] Falha após retentativas:', error.message);
          toast.error("O Supabase está demorando para responder. Tente atualizar a página (F5).");
        } finally {
          if (retryCount >= 2 || !get().isLoadingFromCloud) {
             set({ isSyncing: false, isLoadingFromCloud: false });
          }
        }
        return false;
      },

      saveToCloud: async () => {
        const { user, isLoadingFromCloud, ...state } = get();
        if (!user || isLoadingFromCloud) return;

        console.log('📤 [Nuvem] Despachando dados para o servidor...');
        
        const persistedKeys = [
          'subjects', 'cycle', 'currentDayIndex', 'completedToday', 'targetExamDate', 
          'coins', 'userStats', 'streakData', 'weeklySprint', 'reviews', 
          'reviewStats', 'simulados', 'tafHistory', 'tafTrainingStatus', 
          'isDarkMode', 'activeTab', 'calendarDate', 'reviewCalendarDate', 
          'seasonalData', 'weeklyMissions', 'studyHistory',
          'unlockedAvatars', 'dailyMissions', 'lastDailyResetDate'
        ];
        
        const dataToSave = {};
        persistedKeys.forEach(key => { if (state[key] !== undefined) dataToSave[key] = state[key]; });

        try {
          // Timeout de 5 segundos para o salvamento
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Nuvem")), 5000));
          
          const savePromise = (async () => {
             const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ full_data: dataToSave, updated_at: new Date().toISOString() })
              .eq('id', user.id)
              .select();

            if (updateError) throw updateError;

            if (!updateData || updateData.length === 0) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({ id: user.id, full_data: dataToSave, updated_at: new Date().toISOString() });
              if (insertError) throw insertError;
            }
          })();

          await Promise.race([savePromise, timeoutPromise]);
          toast.success("Nuvem atualizada! ☁️", { duration: 800 });
        } catch (error) {
          console.error('❌ [Nuvem] Erro no Upload:', error.message);
          // Omitimos o toast de erro para não poluir a interface se for apenas oscilação
        }
      },

      getPendingReviews: () => {
        const { reviews, getLocalDateStr } = get();
        const today = getLocalDateStr();
        return reviews.filter(r => r.nextDateStr <= today);
      },

      // --- SETTERS BÁSICOS ---
      setSubjects: (subjects) => set((state) => ({ subjects: typeof subjects === 'function' ? subjects(state.subjects) : subjects })),
      setCycle: (cycle) => set((state) => ({ cycle: typeof cycle === 'function' ? cycle(state.cycle) : cycle })),
      setCoins: (coins) => set((state) => ({ coins: typeof coins === 'function' ? coins(state.coins) : coins })),
      setUserStats: (userStats) => set((state) => ({ userStats: typeof userStats === 'function' ? userStats(state.userStats) : userStats })),
      setStreakData: (streakData) => set((state) => ({ streakData: typeof streakData === 'function' ? streakData(state.streakData) : streakData })),
      
      getTodayDate: () => {
        const today = get().getLocalDateStr();
        return new Date(`${today}T12:00:00`);
      },

      // --- MOTOR FSRS v6 (21 PARÂMETROS) ---
      // Pesos padrão otimizados para v6
      fsrs_w: [
        0.4025, 1.4612, 3.3458, 15.6965, // S0
        5.8659, 1.3411, 1.0142,          // D0, D_change
        0.2233, 2.3081, 0.1332, 1.0772,  // Success Stability terms
        2.2131, 0.1174, 0.3134, 1.5852,  // Failure Stability terms
        0.2272, 2.8804,                  // Unused/Metadata
        0.449, 1.66,                     // Curve Shape
        0.44, 0.98, 0.58                 // Extra/Revised weights for v6 (21 total)
      ],
      retention_target: 0.88,

      calculateNextInterval: (stability) => {
        const { retention_target } = get();
        // Fórmula de intervalo FSRS: S * ( (R^-1/w18 - 1) / (0.9^-1/w18 - 1) )
        // Simplificada para w18 = -0.5 (padrão): S * (R - 1) / (0.9 - 1)
        // Aqui usamos a fórmula direta de v6
        const interval = stability * (Math.pow(retention_target, 1 / -0.5) - 1) / (Math.pow(0.9, 1 / -0.5) - 1);
        return Math.max(1, Math.round(interval));
      },

      updateFsrsCard: (card, rating) => {
        const { fsrs_w, getTodayDate } = get();
        const w = fsrs_w;
        const g = rating; // 1: Again, 2: Hard, 3: Good, 4: Easy
        
        let s = card.stability || 0;
        let d = card.difficulty || 0;
        const today = getTodayDate();
        const lastDate = card.lastReviewDate ? new Date(card.lastReviewDate) : today;
        const t = Math.max(0, Math.floor((today - lastDate) / (1000 * 60 * 60 * 24)));

        // Probabilidade de Retenção Atual (R) baseado no Fator Exato para 90% em t=S
        const factor = Math.pow(0.9, 1 / -0.5) - 1; 
        const retrievability = s === 0 ? 1 : Math.pow(1 + factor * t / s, -0.5);

        if (s === 0) {
          // Inicialização (Primeira Vez)
          s = w[g - 1];
          d = w[4] - w[5] * (g - 3);
        } else {
          // Atualização de Dificuldade
          d = d - w[6] * (g - 3);
          d = Math.min(10, Math.max(1, d + w[6] * (w[4] - d) / 10)); // Mean reversion

          if (g > 1) {
            // Sucesso
            const s_growth = (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - retrievability)) - 1));
            s = s * s_growth;
          } else {
            // Falha (Again)
            const s_forget = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
            s = Math.min(s, s_forget);
          }
        }

        return {
          stability: s,
          difficulty: d,
          nextInterval: get().calculateNextInterval(s),
          lastReviewDate: today.toISOString()
        };
      },
      setWeeklySprint: (weeklySprint) => set((state) => ({ weeklySprint: typeof weeklySprint === 'function' ? weeklySprint(state.weeklySprint) : weeklySprint })),
      setReviews: (reviews) => set((state) => ({ reviews: typeof reviews === 'function' ? reviews(state.reviews) : reviews })),
      setReviewStats: (reviewStats) => set((state) => ({ reviewStats: typeof reviewStats === 'function' ? reviewStats(state.reviewStats) : reviewStats })),
      setSimulados: (simulados) => set((state) => ({ simulados: typeof simulados === 'function' ? simulados(state.simulados) : simulados })),
      setTafHistory: (tafHistory) => set((state) => ({ tafHistory: typeof tafHistory === 'function' ? tafHistory(state.tafHistory) : tafHistory })),
      setTafTrainingStatus: (tafTrainingStatus) => set({ tafTrainingStatus }),
      setGlobalModal: (globalModal) => set({ globalModal }),
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
      setTargetExamDate: (targetExamDate) => set({ targetExamDate }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setCurrentDayIndex: (currentDayIndex) => set({ currentDayIndex }),
      setCompletedToday: (completedToday) => set((state) => ({ completedToday: typeof completedToday === 'function' ? completedToday(state.completedToday) : completedToday })),
      setCalendarDate: (calendarDate) => set({ calendarDate }),
      setReviewCalendarDate: (reviewCalendarDate) => set({ reviewCalendarDate }),
      setSeasonalData: (seasonalData) => set((state) => ({ seasonalData: typeof seasonalData === 'function' ? seasonalData(state.seasonalData) : seasonalData })),
      setWeeklyMissions: (weeklyMissions) => set((state) => ({ weeklyMissions: typeof weeklyMissions === 'function' ? weeklyMissions(state.weeklyMissions) : weeklyMissions })),
      setReviewModal: (reviewModal) => set({ reviewModal }),
      setClassConfirmModal: (classConfirmModal) => set({ classConfirmModal }),
      setReplaceSubjectModal: (replaceSubjectModal) => set({ replaceSubjectModal }),
      setEnableSounds: (enableSounds) => set({ enableSounds }),

      // --- SINALIZADOR DE ÁUDIO NO NAVEGADOR ---
      playSound: (type) => {
        const { enableSounds } = get();
        if (!enableSounds) return;
        
        const sounds = {
          xp: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
          coin: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
          levelUp: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
          click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
        };
        
        const url = sounds[type];
        if (url) {
          const audio = new Audio(url);
          audio.volume = 0.4;
          audio.play().catch(() => {}); // Ignora erro de auto-play bloqueado
        }
      },

      // --- AÇÕES LÓGICAS ---

      addXP: (amount, message = "") => {
        get().playSound('xp');
        set((state) => ({
          userStats: { ...state.userStats, xp: state.userStats.xp + amount },
          seasonalData: { ...state.seasonalData, seasonXp: state.seasonalData.seasonXp + amount }
        }));
        if (message) {
          toast.success(message);
        }
      },

      unlockMedal: (medalId) => {
        const { userStats } = get();
        if (!userStats.medals.includes(medalId)) {
          set((state) => ({
            userStats: { ...state.userStats, medals: [...state.userStats.medals, medalId] }
          }));
          return true;
        }
        return false;
      },

      completeTafTraining: () => {
        const { getLocalDateStr, tafTrainingStatus, addXP, setCoins, setTafTrainingStatus, updateMissionProgress } = get();
        const today = getLocalDateStr();
        if (tafTrainingStatus.lastDoneDate === today) return false;

        addXP(50, "Treino Físico do Dia concluído");
        get().playSound('coin');
        setCoins(prev => prev + 30);
        setTafTrainingStatus({ lastDoneDate: today });
        updateMissionProgress('taf', 1);
        get().updateDailyMissionProgress('taf', 1);
        return true; 
      },

      handleReviewSubmit: (reviewId, performance) => {
        const { reviews, getLocalDateStr, addXP, setCoins, updateMissionProgress, setReviews, setReviewStats, updateFsrsCard } = get();
        const reviewIndex = reviews.findIndex(r => r.id === reviewId);
        if (reviewIndex === -1) return;

        const review = reviews[reviewIndex];
        
        // Mapear Performance para Notas FSRS (1-4)
        let rating = 3; // Default Good
        if (performance >= 1.0) rating = 4; // Easy
        else if (performance >= 0.80) rating = 3; // Good
        else if (performance >= 0.60) rating = 2; // Hard
        else rating = 1; // Again

        const fsrsUpdate = updateFsrsCard(review, rating);
        const nextDate = get().getTodayDate(); 
        nextDate.setDate(nextDate.getDate() + fsrsUpdate.nextInterval);

        const newReviews = [...reviews];
        newReviews[reviewIndex] = {
          ...review,
          stability: fsrsUpdate.stability,
          difficulty: fsrsUpdate.difficulty,
          interval: fsrsUpdate.nextInterval,
          nextDateStr: getLocalDateStr(nextDate),
          lastReviewDate: fsrsUpdate.lastReviewDate,
          lastPerformance: performance,
          trend: performance - (review.lastPerformance || 0.75)
        };

        setReviews(newReviews);
        setReviewStats(prev => ({
          totalDone: prev.totalDone + 1,
          correct: rating > 1 ? prev.correct + 1 : prev.correct,
          streak: rating > 1 ? prev.streak + 1 : 0
        }));

        addXP(rating > 1 ? 30 : 10, "Auditoria FSRS v6");
        
        const todayStr = getLocalDateStr(get().getTodayDate());
        set(state => ({
          studyHistory: {
            ...state.studyHistory,
            [todayStr]: (state.studyHistory?.[todayStr] || 0) + 2
          }
        }));

        if (rating > 1) {
          get().playSound('coin');
          setCoins(c => c + 5);
          updateMissionProgress('review', 1);
          get().updateDailyMissionProgress('review', 1);
        }
      },

      handleReplaceSubject: (dayIndex, slotIndex, oldSubjectId, newSubjectId) => {
        if (!newSubjectId) return;
        set(state => {
          const newCycle = state.cycle.map((daySlots, dIdx) => {
            if (dIdx !== dayIndex) return daySlots;
            return daySlots.map((subId, sIdx) => 
              sIdx === slotIndex && subId === oldSubjectId ? newSubjectId : subId
            );
          });
          return { cycle: newCycle };
        });
      },

      getLocalDateStr: (date) => {
        if (!date) return new Date().toISOString().split('T')[0]; // Sempre usa data real do sistema
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
      },

      watchClass: (subjectId, slotIndex, amountWatched = 1) => {
        const { subjects, getActiveTopic, addXP, setUserStats, setWeeklySprint, setReviews, setCoins, setCompletedToday, getLocalDateStr } = get();
        const activeTopic = getActiveTopic(subjectId);
        if (!activeTopic) return;

        const newSubjects = { ...subjects };
        const subject = { ...newSubjects[subjectId] };
        const topics = [...subject.topics];
        const topicIndex = topics.findIndex(t => t.id === activeTopic.id);
        
        if (topicIndex !== -1) {
          const currentCompleted = topics[topicIndex].completed;
          const total = topics[topicIndex].total;
          const newCompleted = Math.min(total, currentCompleted + amountWatched);
          
          if (newCompleted > currentCompleted) {
            const addedMinutes = 60 * (newCompleted - currentCompleted);
            addXP(100 * (newCompleted - currentCompleted), "Progresso em disciplina");
            setUserStats(prev => ({ ...prev, totalStudyMinutes: prev.totalStudyMinutes + addedMinutes }));
            setWeeklySprint(prev => ({ ...prev, currentMinutes: prev.currentMinutes + addedMinutes }));
            
            const todayStr = getLocalDateStr(get().getTodayDate());
            set(state => ({
              studyHistory: {
                ...state.studyHistory,
                [todayStr]: (state.studyHistory?.[todayStr] || 0) + addedMinutes
              }
            }));
            get().updateDailyMissionProgress('minutes', addedMinutes);
          }

          topics[topicIndex] = { ...topics[topicIndex], completed: newCompleted };
          
          if (newCompleted === total && currentCompleted < total) {
            const tomorrow = get().getTodayDate(); 
            tomorrow.setDate(tomorrow.getDate() + 1);
            setReviews(rPrev => [...rPrev, {
              id: 'rev_' + Date.now(),
              subjectId: subjectId,
              topicName: topics[topicIndex].name,
              nextDateStr: getLocalDateStr(tomorrow), 
              interval: 0,
              stability: 0,
              difficulty: 0,
              lastReviewDate: null,
              lastPerformance: 0.75 
            }]);
          }
        }
        subject.topics = topics;
        newSubjects[subjectId] = subject;
        
        set({ subjects: newSubjects });
        setCoins(prev => prev + (10 * amountWatched));
        setCompletedToday(prev => !prev.includes(slotIndex) ? [...prev, slotIndex] : prev);
        get().updateMissionProgress('study', amountWatched);
        get().updateDailyMissionProgress('study', amountWatched);
      },

      advanceDay: () => {
        const { cycle, getLocalDateStr, streakData, setStreakData, setCoins, currentDayIndex, setCurrentDayIndex, setCompletedToday } = get();
        if (cycle.length === 0) return;
        
        const today = getLocalDateStr();
        const lastCheckDate = streakData.lastCheckDate;
        let newStreak = streakData.currentStreak;

        if (lastCheckDate !== today) {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getLocalDateStr(yesterday);
          if (lastCheckDate === yesterdayStr) newStreak += 1;
          else newStreak = 1;

          setStreakData({ lastCheckDate: today, currentStreak: newStreak });
          if (newStreak === 7) {
            setCoins(c => c + 100);
          }
        }

        const nextIndex = (currentDayIndex + 1) % cycle.length;
        setCurrentDayIndex(nextIndex);
        setCompletedToday([]);
      },

      handleBulkAddConfirm: (subjectId, bulkText) => {
        const topics = bulkText.split('\n')
          .filter(line => line.trim() !== '')
          .map((line, idx) => ({
            id: 't_' + Date.now() + '_' + idx,
            name: line.trim(),
            total: 10,
            completed: 0
          }));

        set(state => {
          const newSubjects = { ...state.subjects };
          if (newSubjects[subjectId]) {
            newSubjects[subjectId].topics = [...newSubjects[subjectId].topics, ...topics];
          }
          return { subjects: newSubjects };
        });
      },

      executeTacticalReset: async () => {
        set((state) => ({
          subjects: {},
          cycle: [],
          simulados: [],
          tafHistory: [],
          reviews: [],
          coins: 0,
          currentDayIndex: 0,
          // todayStr dinâmico via getLocalDateStr()
          calendarDate: new Date(),
          reviewCalendarDate: new Date(),
          userStats: { xp: 0, medals: [], totalStudyMinutes: 0 },
          reviewStats: { totalDone: 0, correct: 0, streak: 0 },
          streakData: { currentStreak: 0, lastCheckDate: null },
          weeklySprint: { ...state.weeklySprint, currentMinutes: 0 },
          completedToday: [],
          tafTrainingStatus: { lastDoneDate: null },
          seasonalData: { ...state.seasonalData, seasonXp: 0 },
          weeklyMissions: state.weeklyMissions.map(m => ({ ...m, current: 0, completed: false, claimed: false }))
        }));
        
        // Sincroniza o reset com a nuvem imediatamente
        const { saveToCloud } = get();
        await saveToCloud();
      },

      executeTotalWipe: async () => {
        const { user } = get();
        console.log("🔴 PROTOCOLO DE DESTRUIÇÃO ABSOLUTA INICIADO...");
        
        const cleanState = getCleanInitialState();

        // 1. Limpa memória imediatamente
        set(cleanState);

        // 2. Força sobrescrita na nuvem (Supabase) como fonte da verdade
        if (user) {
          try {
            const { data: updateData, error: updateError } = await supabase
              .from('profiles')
              .update({ 
                full_data: cleanState, 
                updated_at: new Date().toISOString() 
              })
              .eq('id', user.id)
              .select();
            
            if (updateError) throw updateError;
            
            if (!updateData || updateData.length === 0) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  full_data: cleanState,
                  updated_at: new Date().toISOString()
                });
                
              if (insertError) throw insertError;
            }
            console.log("✅ Nuvem purificada com sucesso.");
          } catch (error) {
            console.error('❌ Erro crítico ao limpar nuvem:', error);
            alert("Erro ao limpar dados na nuvem. Verifique sua conexão.");
            return;
          }
        }

        // 3. Recarregamento limpo para garantir integridade
        window.location.reload();
      },

      updateMissionProgress: (type, amount) => {
        const { weeklyMissions, setWeeklyMissions, setGlobalModal } = get();
        const updatedMissions = weeklyMissions.map(mission => {
          if (mission.type === type && !mission.completed) {
            const newCurrent = Math.min(mission.goal, mission.current + amount);
            const isNowCompleted = newCurrent >= mission.goal;
            
            if (isNowCompleted && !mission.completed) {
              // Notificar via modal global
              setGlobalModal({
                title: "🎯 Missão Cumprida!",
                message: `Você completou a missão: ${mission.title}. Resgate sua recompensa no Painel!`,
                isAlert: true
              });
            }
            
            return { ...mission, current: newCurrent, completed: isNowCompleted };
          }
          return mission;
        });
        setWeeklyMissions(updatedMissions);
      },

      claimMissionReward: (missionId) => {
        const { weeklyMissions, setWeeklyMissions, addXP, setCoins } = get();
        const missionIndex = weeklyMissions.findIndex(m => m.id === missionId);
        if (missionIndex === -1 || !weeklyMissions[missionIndex].completed || weeklyMissions[missionIndex].claimed) return;

        const mission = weeklyMissions[missionIndex];
        addXP(mission.xpReward, `Recompensa de Missão: ${mission.title}`);
        get().playSound('coin');
        setCoins(c => c + mission.coinReward);

        const updatedMissions = [...weeklyMissions];
        updatedMissions[missionIndex] = { ...mission, claimed: true };
        setWeeklyMissions(updatedMissions);
      },

      unlockAvatar: (avatarPath, cost) => {
        const { coins, unlockedAvatars, setCoins } = get();
        if (coins < cost) {
          toast.error("Moedas insuficientes para desbloquear este avatar!");
          return false;
        }
        if (unlockedAvatars.includes(avatarPath)) {
          toast.error("Avatar já desbloqueado!");
          return false;
        }
        setCoins(c => c - cost);
        set(state => ({
          unlockedAvatars: [...state.unlockedAvatars, avatarPath]
        }));
        toast.success("Avatar desbloqueado com sucesso! 🎉");
        get().playSound('levelUp');
        return true;
      },

      selectAvatar: (avatarPath) => {
        const { unlockedAvatars } = get();
        if (!unlockedAvatars.includes(avatarPath)) {
          toast.error("Você precisa desbloquear este avatar antes de equipá-lo!");
          return false;
        }
        set(state => ({
          userStats: {
            ...state.userStats,
            avatar: avatarPath
          }
        }));
        toast.success("Avatar equipado com sucesso! 🛡️");
        return true;
      },

      checkAndResetDailyMissions: () => {
        const { getLocalDateStr, lastDailyResetDate } = get();
        const todayStr = getLocalDateStr();
        if (lastDailyResetDate !== todayStr) {
          const defaultDaily = [
            { id: 'd1', title: 'Foco Diário', description: 'Estude por 30 minutos', goal: 30, current: 0, xpReward: 30, coinReward: 10, type: 'minutes', completed: false, claimed: false },
            { id: 'd2', title: 'Aula Concluída', description: 'Marque uma aula como concluída', goal: 1, current: 0, xpReward: 20, coinReward: 5, type: 'study', completed: false, claimed: false },
            { id: 'd3', title: 'Revisão Tática', description: 'Realize 1 revisão FSRS', goal: 1, current: 0, xpReward: 15, coinReward: 5, type: 'review', completed: false, claimed: false },
          ];
          set({
            dailyMissions: defaultDaily,
            lastDailyResetDate: todayStr
          });
          return true;
        }
        return false;
      },

      updateDailyMissionProgress: (type, amount) => {
        const { checkAndResetDailyMissions } = get();
        checkAndResetDailyMissions();
        const currentDailyMissions = get().dailyMissions;
        
        const updated = currentDailyMissions.map(m => {
          if (m.type === type && !m.completed) {
            const newCurrent = Math.min(m.goal, m.current + amount);
            const isCompleted = newCurrent >= m.goal;
            if (isCompleted) {
              toast.success(`Contrato Diário cumprido: ${m.title}! 🎯`);
            }
            return { ...m, current: newCurrent, completed: isCompleted };
          }
          return m;
        });
        set({ dailyMissions: updated });
      },

      claimDailyMissionReward: (missionId) => {
        const { dailyMissions, addXP, setCoins } = get();
        const index = dailyMissions.findIndex(m => m.id === missionId);
        if (index === -1 || !dailyMissions[index].completed || dailyMissions[index].claimed) return;

        const mission = dailyMissions[index];
        addXP(mission.xpReward, `Contrato Cumprido: ${mission.title}`);
        get().playSound('coin');
        setCoins(c => c + mission.coinReward);

        const updated = [...dailyMissions];
        updated[index] = { ...mission, claimed: true };
        set({ dailyMissions: updated });
      },

      // --- HELPERS ---
      getThermometer: (perf) => {
        if (perf === undefined) return { label: 'Inédito', color: 'bg-slate-100 text-slate-400', icon: '❄️' };
        if (perf >= 0.9) return { label: 'Blindado', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: '🔋' };
        if (perf >= 0.7) return { label: 'Estável', color: 'bg-blue-100 text-blue-600 border-blue-200', icon: '📡' };
        return { label: 'Crítico', color: 'bg-red-100 text-red-600 border-red-200', icon: '⚠️' };
      },

      getActiveTopic: (subjectId) => {
        const { subjects } = get();
        const subject = subjects[subjectId];
        if (!subject) return null;
        return (subject.topics || []).find(t => t.completed < t.total) || null;
      },

      getCurrentPatente: () => {
        const { userStats } = get();
        const sorted = [...PATENTES].reverse();
        return sorted.find(p => userStats.xp >= p.minXp) || PATENTES[0];
      },

      getSubjectProgress: (subId) => {
        const { subjects } = get();
        const s = subjects[subId];
        if (!s) return 0;
        let t = 0; let c = 0;
        (s.topics || []).forEach(x => { t += x.total; c += x.completed; });
        return t === 0 ? 0 : Math.round((c / t) * 100);
      },

      getRelativeDateInfo: (idx) => {
        const { currentDayIndex, cycle } = get();
        const today = new Date();
        let offset = idx - currentDayIndex;
        if (offset < 0) offset += cycle.length; 
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + offset);
        const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
        return { 
          title: offset === 0 ? 'HOJE' : diasSemana[targetDate.getDay()], 
          dateStr: `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`, 
          isToday: offset === 0 
        };
      },

      getSubjectEstimates: () => {
        const { subjects, cycle, currentDayIndex, completedToday } = get();
        const estimates = [];
        const remainingClasses = {};

        Object.values(subjects).forEach(subject => {
          let remaining = 0;
          (subject.topics || []).forEach(t => remaining += (t.total - (t.completed || 0)));
          remainingClasses[subject.id] = remaining;

          if (remaining === 0) {
            estimates.push({ ...subject, remaining: 0, dateStr: 'Concluído', dateObj: new Date(0) });
          }
        });

        const endDaysOffset = {};
        const simulatedRemaining = { ...remainingClasses };
        
        let dayOffset = 0;
        let allDone = false;
        const maxSimulationDays = 1500; 

        const subjectsInCycle = new Set(cycle.flat());

        if (cycle.length > 0) {
          while (!allDone && dayOffset < maxSimulationDays) {
            const cycleIndex = (currentDayIndex + dayOffset) % cycle.length;
            const daySubjects = cycle[cycleIndex] || [];
            
            daySubjects.forEach((subId, slotIdx) => {
              if (dayOffset === 0 && completedToday.includes(slotIdx)) return; 
              
              if (simulatedRemaining[subId] > 0) {
                simulatedRemaining[subId] -= 1;
                if (simulatedRemaining[subId] === 0 && endDaysOffset[subId] === undefined) {
                  endDaysOffset[subId] = dayOffset;
                }
              }
            });

            allDone = Object.keys(simulatedRemaining).every(subId => 
                simulatedRemaining[subId] === 0 || !subjectsInCycle.has(subId)
            );
            if (!allDone) dayOffset++;
          }
        }

        const today = get().getTodayDate();
        const todayDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        Object.values(subjects).forEach(sub => {
          if (remainingClasses[sub.id] > 0) {
            const daysToFinish = endDaysOffset[sub.id] !== undefined ? endDaysOffset[sub.id] : 999;
            const completionDate = new Date(todayDateObj);
            completionDate.setDate(completionDate.getDate() + daysToFinish);

            const mesesNomesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const dia = String(completionDate.getDate()).padStart(2, '0');
            const ano = completionDate.getFullYear();

            if(!estimates.some(e => e.id === sub.id)) {
               estimates.push({
                 ...sub,
                 remaining: remainingClasses[sub.id],
                 dateStr: `${dia}/${mesesNomesShort[completionDate.getMonth()]}/${ano}`,
                 dateObj: completionDate
               });
            }
          }
        });

        return estimates.sort((a, b) => {
          if (a.remaining === 0) return -1;
          if (b.remaining === 0) return 1;
          return a.dateObj - b.dateObj;
        });
      },

      getEstimatedCompletionDate: () => {
        const { getSubjectEstimates, targetExamDate } = get();
        const subjectEstimates = getSubjectEstimates();
        const unfinished = subjectEstimates.filter(e => e.remaining > 0);
        if (unfinished.length === 0) return { short: "Concluído", full: "Edital Concluído", isLate: false };

        const lastSubject = unfinished[unfinished.length - 1];
        const completionDate = lastSubject.dateObj;
        const examDateObj = new Date(`${targetExamDate}T00:00:00`);
        
        const isLate = completionDate > examDateObj;
        const daysDiff = Math.round((completionDate - examDateObj) / (1000 * 60 * 60 * 24));

        const mesesNomesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mesesNomesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return {
          short: `${String(completionDate.getDate()).padStart(2, '0')}/${mesesNomesShort[completionDate.getMonth()]}/${completionDate.getFullYear()}`,
          full: `${String(completionDate.getDate()).padStart(2, '0')} de ${mesesNomesFull[completionDate.getMonth()]} de ${completionDate.getFullYear()}`,
          isLate: isLate,
          daysDiff: daysDiff,
          examDateFormatted: `${String(examDateObj.getDate()).padStart(2, '0')}/${mesesNomesShort[examDateObj.getMonth()]}/${examDateObj.getFullYear()}`
        };
      }
    })
);

// Motor de replicação em nuvem em Segundo Plano - AGORA INSTANTÂNEO
const persistedKeysParaMonitorar = [
  'subjects', 'cycle', 'currentDayIndex', 'completedToday', 'targetExamDate', 
  'coins', 'userStats', 'streakData', 'weeklySprint', 'reviews', 
  'reviewStats', 'simulados', 'tafHistory', 'tafTrainingStatus', 
  'isDarkMode', 'activeTab', 'calendarDate', 'reviewCalendarDate', 
  'seasonalData', 'weeklyMissions', 'studyHistory',
  'unlockedAvatars', 'dailyMissions', 'lastDailyResetDate'
];

let pendingSaves = 0;

// Proteção ativa contra fechamento/F5 da aba durante um salvamento em andamento
window.addEventListener('beforeunload', (e) => {
  if (pendingSaves > 0) {
    e.preventDefault();
    e.returnValue = "Seus dados ainda estão sendo enviados para a Nuvem de forma 100% online. Fechar agora cancelará o envio.";
    return e.returnValue;
  }
});

useStore.subscribe((state, prevState) => {
  if (state.isLoadingFromCloud || !state.user) return;

  const sofreuAlteracao = persistedKeysParaMonitorar.some(key => state[key] !== prevState[key]);
  
  if (sofreuAlteracao) {
    clearTimeout(useStore._debounceTimer);
    useStore._debounceTimer = setTimeout(() => {
      pendingSaves++;
      state.saveToCloud().finally(() => {
        pendingSaves = Math.max(0, pendingSaves - 1);
      });
    }, 1500);
  }
});

