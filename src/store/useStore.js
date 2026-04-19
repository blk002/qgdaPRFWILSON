import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PATENTES, MEDALHAS } from '../hooks/useGamification';
import { supabase } from '../lib/supabaseClient';

const initialSubjects = {};
const initialCycle = [];

export const useStore = create(
  persist(
    (set, get) => ({
      // --- ESTADOS ---
      subjects: initialSubjects,
      cycle: initialCycle,
      currentDayIndex: 0,
      completedToday: [],
      targetExamDate: '2026-08-15',
      coins: 250,
      userStats: { xp: 0, medals: [], totalStudyMinutes: 0 },
      streakData: { currentStreak: 0, lastCheckDate: null },
      weeklySprint: { goalHours: 35, currentMinutes: 0, weekStart: new Date().toISOString() },
      reviews: [], // Reset absoluto para o novo motor FSRS v6
      reviewStats: { totalDone: 0, correct: 0, streak: 0 },
      simulados: [],
      tafHistory: [],
      tafTrainingStatus: { lastDoneDate: null },
      globalModal: null,
      isDarkMode: true,
      activeTab: 'carreira',
      todayStr: '2026-05-28', // Viagem no tempo para testes
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

      loadFromCloud: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_data')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          
          if (data?.full_data) {
            set(data.full_data);
            return true;
          }
        } catch (error) {
          console.error('Erro ao carregar dados da nuvem:', error);
        }
        return false;
      },

      saveToCloud: async () => {
        const { user, ...state } = get();
        if (!user) return;

        // Limpar dados voláteis antes de salvar
        const persistedKeys = [
          'subjects', 'cycle', 'currentDayIndex', 'completedToday', 'targetExamDate', 
          'coins', 'userStats', 'streakData', 'weeklySprint', 'reviews', 
          'reviewStats', 'simulados', 'tafHistory', 'tafTrainingStatus', 
          'isDarkMode', 'activeTab', 'calendarDate', 'reviewCalendarDate', 
          'seasonalData', 'weeklyMissions'
        ];
        
        const dataToSave = {};
        persistedKeys.forEach(key => {
          if (state[key] !== undefined) dataToSave[key] = state[key];
        });

        try {
          const { error } = await supabase
            .from('profiles')
            .upsert({ 
              id: user.id, 
              full_data: dataToSave,
              updated_at: new Date().toISOString()
            });

          if (error) throw error;
        } catch (error) {
          console.error('Erro ao salvar dados na nuvem:', error);
        }
      },

      getPendingReviews: () => {
        const { reviews, todayStr } = get();
        return reviews.filter(r => r.nextDateStr <= todayStr);
      },

      // --- SETTERS BÁSICOS ---
      setSubjects: (subjects) => set((state) => ({ subjects: typeof subjects === 'function' ? subjects(state.subjects) : subjects })),
      setCycle: (cycle) => set((state) => ({ cycle: typeof cycle === 'function' ? cycle(state.cycle) : cycle })),
      setCoins: (coins) => set((state) => ({ coins: typeof coins === 'function' ? coins(state.coins) : coins })),
      setUserStats: (userStats) => set((state) => ({ userStats: typeof userStats === 'function' ? userStats(state.userStats) : userStats })),
      setStreakData: (streakData) => set((state) => ({ streakData: typeof streakData === 'function' ? streakData(state.streakData) : streakData })),
      
      getTodayDate: () => {
        const { todayStr } = get();
        return new Date(`${todayStr}T12:00:00`);
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

      // --- AÇÕES LÓGICAS ---

      addXP: (amount, message = "") => {
        set((state) => ({
          userStats: { ...state.userStats, xp: state.userStats.xp + amount },
          seasonalData: { ...state.seasonalData, seasonXp: state.seasonalData.seasonXp + amount }
        }));
        // Opcional: Aqui poderia ser disparado um toast com o 'message'
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
        setCoins(prev => prev + 30);
        setTafTrainingStatus({ lastDoneDate: today });
        updateMissionProgress('taf', 1);
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
        if (rating > 1) {
          setCoins(c => c + 5);
          updateMissionProgress('review', 1);
        }
      },

      handleReplaceSubject: (dayIndex, slotIndex, oldSubjectId, newSubjectId) => {
        if (!newSubjectId) return;
        set(state => ({
          cycle: state.cycle.map(daySlots => 
            daySlots.map(subId => subId === oldSubjectId ? newSubjectId : subId)
          )
        }));
      },

      getLocalDateStr: (date) => {
        if (!date) return get().todayStr; // Se não passar data, usa a simulada do sistema
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
            addXP(100 * (newCompleted - currentCompleted), "Progresso em disciplina");
            setUserStats(prev => ({ ...prev, totalStudyMinutes: prev.totalStudyMinutes + (60 * (newCompleted - currentCompleted)) }));
            setWeeklySprint(prev => ({ ...prev, currentMinutes: prev.currentMinutes + (60 * (newCompleted - currentCompleted)) }));
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

      executeTacticalReset: () => {
        const realToday = new Date().toISOString().split('T')[0];
        set((state) => ({
          subjects: {},
          cycle: [],
          simulados: [],
          tafHistory: [],
          reviews: [],
          coins: 0,
          currentDayIndex: 0,
          todayStr: realToday,
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
      },

      executeTotalWipe: () => {
        if (window.confirm("🔴 PROTOCOLO DE DESTRUIÇÃO 🔴\n\nIsto apagará permanentemente todos os seus dados. Deseja prosseguir?")) {
          localStorage.removeItem('prf-qg-storage');
          window.location.reload();
        }
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
        setCoins(c => c + mission.coinReward);

        const updatedMissions = [...weeklyMissions];
        updatedMissions[missionIndex] = { ...mission, claimed: true };
        setWeeklyMissions(updatedMissions);
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
    }),
    {
      name: 'prf-qg-storage',
      partialize: (state) => {
        const persistedKeys = [
          'subjects', 'cycle', 'currentDayIndex', 'completedToday', 'targetExamDate', 
          'coins', 'userStats', 'streakData', 'weeklySprint', 'reviews', 
          'reviewStats', 'simulados', 'tafHistory', 'tafTrainingStatus', 
          'isDarkMode', 'activeTab', 'calendarDate', 'reviewCalendarDate', 
          'seasonalData', 'weeklyMissions', 'session', 'user'
        ];
        const data = {};
        persistedKeys.forEach(key => {
          if (state[key] !== undefined && typeof state[key] !== 'function') {
            data[key] = state[key];
          }
        });
        return data;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Hydrate Dates
          if (state.calendarDate) state.calendarDate = new Date(state.calendarDate);
          if (state.reviewCalendarDate) state.reviewCalendarDate = new Date(state.reviewCalendarDate);
          
          // Migration: Expand Abbreviations
          const nameMapping = {
            'LIN. POR': 'PORTUGUÊS',
            'DIR. ADM': 'DIREITO ADM.',
            'RLM': 'RAC. LÓGICO',
            'LEG. ESPECIAL': 'LEGISLAÇÃO ESP.',
            'RES. CONTRAN': 'CONTRAN',
            'CTB': 'CÓD. TRÂNSITO'
          };
          
          state.userStats = {
            xp: state.userStats?.xp ?? 0,
            medals: state.userStats?.medals ?? [],
            totalStudyMinutes: state.userStats?.totalStudyMinutes ?? 0,
          };
          
          state.seasonalData = {
            currentSeason: state.seasonalData?.currentSeason ?? 1,
            seasonName: state.seasonalData?.seasonName ?? "Recruta Operacional",
            seasonXp: state.seasonalData?.seasonXp ?? 0,
            seasonGoalXp: state.seasonalData?.seasonGoalXp ?? 5000,
            startDate: state.seasonalData?.startDate ?? new Date().toISOString(),
            endDate: state.seasonalData?.endDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

          state.streakData = { 
            currentStreak: state.streakData?.currentStreak ?? 0, 
            lastCheckDate: state.streakData?.lastCheckDate ?? null 
          };
          
          state.reviewStats = { 
            totalDone: state.reviewStats?.totalDone ?? 0, 
            correct: state.reviewStats?.correct ?? 0, 
            streak: state.reviewStats?.streak ?? 0 
          };
          
          state.weeklySprint = { 
            goalHours: state.weeklySprint?.goalHours ?? 35, 
            currentMinutes: state.weeklySprint?.currentMinutes ?? 0, 
            weekStart: state.weeklySprint?.weekStart ?? new Date().toISOString() 
          };
          
          state.coins = typeof state.coins === 'number' ? state.coins : 250;
          state.currentDayIndex = typeof state.currentDayIndex === 'number' ? state.currentDayIndex : 0;
          state.targetExamDate = state.targetExamDate || '2026-08-15';

          if (!state.subjects || typeof state.subjects !== 'object') {
            state.subjects = {};
          } else {
            Object.values(state.subjects).forEach(sub => {
              if (nameMapping[sub.name]) {
                sub.name = nameMapping[sub.name];
              }
            });
          }

          if (!Array.isArray(state.cycle)) {
            state.cycle = [];
          }
          if (!Array.isArray(state.reviews)) {
            state.reviews = [];
          }
          if (!Array.isArray(state.completedToday)) {
            state.completedToday = [];
          }

          // Migration: Weekly Missions check (Pomodoro Removal)
          if (state.weeklyMissions) {
            const hasPomodoro = state.weeklyMissions.some(m => m.id === 'm3' && m.type === 'pomodoro');
            if (hasPomodoro) {
              state.weeklyMissions = state.weeklyMissions.map(m => 
                m.id === 'm3' ? { id: 'm3', title: 'Simulado de Elite', description: 'Registre 1 novo Simulado', goal: 1, current: 0, xpReward: 120, coinReward: 40, type: 'simulado', completed: false, claimed: false } : m
              );
            }
          } else {
            state.weeklyMissions = [
              { id: 'm1', title: 'Cérebro Ativo', description: 'Complete 10 revisões FSRS', goal: 10, current: 0, xpReward: 150, coinReward: 50, type: 'review', completed: false, claimed: false },
              { id: 'm2', title: 'Combatente Físico', description: 'Registre 2 treinos TAF', goal: 2, current: 0, xpReward: 100, coinReward: 30, type: 'taf', completed: false, claimed: false },
              { id: 'm3', title: 'Simulado de Elite', description: 'Registre 1 novo Simulado', goal: 1, current: 0, xpReward: 120, coinReward: 40, type: 'simulado', completed: false, claimed: false },
              { id: 'm4', title: 'Persistência Total', description: 'Assista 4 aulas de teoria', goal: 4, current: 0, xpReward: 200, coinReward: 60, type: 'study', completed: false, claimed: false },
            ];
          }

          // Force delete pomodoro state
          if (state.pomodoro) delete state.pomodoro;
        }
      }
    }
  )
);
