import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabaseClient';
import { normalizeCourseLookupKey } from '../lib/courseIndexParser';
import {
  formatDifficultyIdsLabel,
  resolveEffectiveDifficultyIds,
  sanitizeDifficultyIds,
} from '../lib/caveiraDifficulty';
import {
  serializeMissionForBridge,
  getMissionSyncSignature,
} from '../lib/lessonMastery';

export function triggerCaveiraPractice(
  subjectName = '',
  lessonNames = [],
  topicName = '',
  subtopics = [],
  rawIndexText = '',
  questionStatus = 'not_resolved',
  difficultyIds = []
) {
  const isGenericLesson = (name) => {
    const clean = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    return (
      !clean ||
      /^testes?\s+propostos?$/.test(clean) ||
      /^exercicios?(\s+de\s+fixacao)?$/.test(clean) ||
      /^simulado$/.test(clean) ||
      /^revisao$/.test(clean)
    );
  };

  const cleanedLessons = (Array.isArray(lessonNames) ? lessonNames : [])
    .map((l) => String(l || '').replace(/\s*[-–]\s*aula\s*\d+\s*$/i, '').trim())
    .filter((l) => l && !isGenericLesson(l));

  const primaryLessons = cleanedLessons.length > 0 ? cleanedLessons : topicName ? [topicName] : [];
  const cleanSubtopics = (Array.isArray(subtopics) ? subtopics : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  const displayFilterLabel =
    cleanSubtopics.length > 0
      ? cleanSubtopics.slice(0, 3).join(' • ') +
        (cleanSubtopics.length > 3 ? ` (+${cleanSubtopics.length - 3})` : '')
      : primaryLessons.join(' • ');

  const copyText = cleanSubtopics[0] || primaryLessons[0] || topicName || subjectName;
  const hasExt = document.documentElement.getAttribute('data-qg-caveira-extension-installed') === 'true';

  if (navigator.clipboard && copyText) {
    navigator.clipboard.writeText(copyText).catch(() => {});
  }

  if (hasExt) {
    const cleanDifficultyIds = sanitizeDifficultyIds(difficultyIds);
    const diffLabel = formatDifficultyIdsLabel(cleanDifficultyIds);
    const savedPrefs = useStore.getState().caveiraQuestionPrefs;
    const hasCustomQgPrefs = Boolean(savedPrefs && Number(savedPrefs.updatedAt) > 0);
    window.postMessage(
      {
        source: 'QG_WEB_APP',
        type: 'OPEN_CAVEIRA_PRACTICE',
        payload: {
          subject: subjectName,
          lessons: primaryLessons,
          topic: displayFilterLabel,
          fallbackTopic: topicName,
          subtopics: cleanSubtopics,
          rawIndexText: String(rawIndexText || ''),
          status: typeof questionStatus === 'string' ? questionStatus : 'not_resolved',
          difficultyIds: cleanDifficultyIds,
          ...(hasCustomQgPrefs
            ? {
                examBoards: Array.isArray(savedPrefs.examBoards) ? savedPrefs.examBoards : [],
                numberAlternatives: Array.isArray(savedPrefs.numberAlternatives)
                  ? savedPrefs.numberAlternatives
                  : [],
              }
            : {}),
        },
      },
      window.location.origin
    );
    const baseToast =
      cleanSubtopics.length > 0
        ? `Abrindo Caveira com ${cleanSubtopics.length} subassuntos do Índice`
        : `Abrindo Caveira com filtro: ${displayFilterLabel || subjectName}`;
    toast.success(diffLabel ? `${baseToast} (${diffLabel})` : baseToast);
  } else {
    window.open('https://app.caveira.com/', '_blank', 'noopener');
    toast.info('Extensão não detectada nesta aba. Conteúdo copiado para a área de transferência.');
  }
}

export function useExtensionBridge() {
  const session = useStore((s) => s.session);
  const hasCompletedInitialCloudSync = useStore((s) => s.hasCompletedInitialCloudSync);
  const subjects = useStore((s) => s.subjects);
  const cycle = useStore((s) => s.cycle);
  const currentDayIndex = useStore((s) => s.currentDayIndex);
  const completedToday = useStore((s) => s.completedToday);
  const completedTodayDate = useStore((s) => s.completedTodayDate);
  const calendarOverrides = useStore((s) => s.calendarOverrides);
  const futureScheduleRules = useStore((s) => s.futureScheduleRules);
  const cycleScheduleType = useStore((s) => s.cycleScheduleType);
  const cycleWeekStart = useStore((s) => s.cycleWeekStart);
  const cycleCarryoverOffset = useStore((s) => s.cycleCarryoverOffset);
  const caveiraFilterMemory = useStore((s) => s.caveiraFilterMemory);
  const caveiraQuestionPrefs = useStore((s) => s.caveiraQuestionPrefs);
  const caveiraCourseIndexMap = useStore((s) => s.caveiraCourseIndexMap);
  const progressiveReviews = useStore((s) => s.progressiveReviews);
  const activePracticeMission = useStore((s) => s.activePracticeMission);
  const reviews = useStore((s) => s.reviews);
  const studyHistory = useStore((s) => s.studyHistory);
  const caveiraDailyGoal = useStore((s) => s.caveiraDailyGoal);
  const getLocalDateStr = useStore((s) => s.getLocalDateStr);
  const getCycleIndexForDate = useStore((s) => s.getCycleIndexForDate);

  const [courseIndexCache, setCourseIndexCache] = useState({ latest: null, byLesson: {} });
  const lastSyncedMissionSigRef = useRef('');
  const lastSyncedVideoIndexSigRef = useRef('');
  const [manualLessonIndexMap, setManualLessonIndexMap] = useState(() => {
    try {
      const saved = localStorage.getItem('qg_lesson_index_map_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveManualLessonIndex = useCallback((rawText, lessonKeyName) => {
    const key = normalizeCourseLookupKey(lessonKeyName);
    if (!key) return;
    setManualLessonIndexMap((prev) => {
      const next = { ...(prev || {}) };
      if (!String(rawText || '').trim()) {
        delete next[key];
      } else {
        next[key] = {
          lessonTitle: lessonKeyName,
          rawIndexText: String(rawText),
          updatedAt: Date.now(),
        };
      }
      try {
        localStorage.setItem('qg_lesson_index_map_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Ponte de recebimento: Extensão -> QG
  useEffect(() => {
    const handleCourseLessonCompleteFromExtension = (payload) => {
      if (!payload) return;
      const rawTitle = String(payload.lessonTitle || '').trim();
      const rawIndexText = String(payload.rawIndexText || '').trim();
      if (rawTitle && rawIndexText) {
        saveManualLessonIndex(rawIndexText, rawTitle);
      }
      const st = useStore.getState();
      const subs = Object.values(st.subjects || {});
      const normTarget = normalizeCourseLookupKey(rawTitle);
      const normSubHint = normalizeCourseLookupKey(payload.subject || '');

      let matchedSub = null;
      let matchedTopic = null;

      if (normTarget) {
        for (const sub of subs) {
          for (const t of sub.topics || []) {
            const lessons = t.lessons || [];
            const hasLessonMatch = lessons.some((l) => {
              const ln = normalizeCourseLookupKey(l?.name || '');
              return ln && (ln === normTarget || ln.includes(normTarget) || normTarget.includes(ln));
            });
            const tn = normalizeCourseLookupKey(t?.name || '');
            const hasTopicMatch = tn && (tn === normTarget || normTarget.includes(tn));
            if (hasLessonMatch || hasTopicMatch) {
              matchedSub = sub;
              matchedTopic = t;
              break;
            }
          }
          if (matchedSub) break;
        }
      }

      if (!matchedSub && normSubHint) {
        matchedSub =
          subs.find((s) => {
            const sn = normalizeCourseLookupKey(s?.name || '');
            return sn && (sn === normSubHint || sn.includes(normSubHint) || normSubHint.includes(sn));
          }) || null;
        if (matchedSub) {
          matchedTopic =
            (matchedSub.topics || []).find((t) => (Number(t.completed) || 0) < (Number(t.total) || 0)) ||
            (matchedSub.topics || [])[0] ||
            null;
        }
      }

      if (matchedSub && matchedTopic) {
        const currentCompleted = Math.min(Number(matchedTopic.total) || 0, Number(matchedTopic.completed) || 0);
        const remLessons = (matchedTopic.lessons || []).slice(currentCompleted, matchedTopic.total);
        const firstLesson = remLessons[0];

        const todayObj = new Date();
        const todayStr = st.getLocalDateStr ? st.getLocalDateStr(todayObj) : '';
        const completedTodayArr = st.completedTodayDate === todayStr && Array.isArray(st.completedToday) ? st.completedToday : [];
        let todaySubjectsList = [];
        if (st.calendarOverrides && Array.isArray(st.calendarOverrides[todayStr])) {
          todaySubjectsList = st.calendarOverrides[todayStr];
        } else {
          const idx =
            st.cycleScheduleType === 'weekly'
              ? st.getCycleIndexForDate
                ? st.getCycleIndexForDate(todayObj, todayObj)
                : ((st.cycleWeekStart === 'monday' ? (todayObj.getDay() + 6) % 7 : todayObj.getDay()) - ((st.cycleCarryoverOffset || 0) > 0 ? st.cycleCarryoverOffset : 0) + 7) % 7
              : st.currentDayIndex || 0;
          todaySubjectsList = Array.isArray(st.cycle?.[idx]) ? st.cycle[idx] : [];
        }
        const matchedSlotIndex = todaySubjectsList.findIndex(
          (sid, sIdx) => sid === matchedSub.id && !completedTodayArr.includes(sIdx)
        );
        const resolvedSlotIndex = matchedSlotIndex >= 0 ? matchedSlotIndex : null;

        st.setClassConfirmModal({
          subjectId: matchedSub.id,
          slotIndex: resolvedSlotIndex,
          topicName: matchedTopic.name,
          lessonNames: rawTitle ? [rawTitle] : firstLesson?.name ? [firstLesson.name] : [matchedTopic.name],
          allRemainingLessonNames: remLessons.map((l) => l?.name).filter(Boolean),
          maxClasses: Math.max(1, (Number(matchedTopic.total) || 1) - currentCompleted),
          lessonDuration: firstLesson?.duration || '60:00',
          allLessonsDurations: remLessons.map((l) => l?.duration || '60:00'),
          suggestedClasses: 1,
          skipPrePrompt: true,
        });
        toast.success(`Aula "${rawTitle || matchedTopic.name}" recebida do Caveira com ${payload.subtopics?.length || 0} subassuntos.`);
      } else {
        toast.info(`Índice da aula "${rawTitle || 'Caveira'}" salvo. Clique em "Aula assistida" na matéria correspondente.`);
      }
    };

    const handleExtensionMessage = (event) => {
      if (!event || event.source !== window || event.origin !== window.location.origin) return;
      if (event.data && event.data.source === 'QG_CAVEIRA_EXTENSION') {
        if (event.data.type === 'COURSE_INDEX_SYNC' && event.data.payload) {
          setCourseIndexCache(event.data.payload);
          if (useStore.getState().hasCompletedInitialCloudSync) {
            useStore.getState().setCaveiraCourseIndexMap?.(event.data.payload);
          }
          return;
        }
        if (event.data.type === 'COURSE_LESSON_COMPLETE_REQUEST' && event.data.payload) {
          handleCourseLessonCompleteFromExtension(event.data.payload);
          return;
        }
        if (event.data.type === 'MISSION_PROGRESS_SYNC' && event.data.payload?.mission) {
          const curUid = useStore.getState().user?.id;
          const cloudReadyNow = useStore.getState().hasCompletedInitialCloudSync;
          const msgUid = event.data.payload?.userId || event.data.payload?.mission?.ownerUserId;
          if (!curUid || !cloudReadyNow || (msgUid && msgUid !== curUid)) return;
          lastSyncedMissionSigRef.current = getMissionSyncSignature(event.data.payload.mission);
          useStore.getState().syncActiveMissionFromExtension?.(event.data.payload.mission);
          return;
        }
        if (event.data.type === 'MISSION_CLEARED_IN_EXTENSION') {
          lastSyncedMissionSigRef.current = '';
          useStore.getState().handleMissionClearedFromExtension?.(event.data.payload?.missionId || null);
          return;
        }
        const currentUser = useStore.getState().user;
        const cloudReady = useStore.getState().hasCompletedInitialCloudSync;
        if (!currentUser?.id || !cloudReady) return;
        const msgUserId = event.data.payload?.userId;
        if (msgUserId && msgUserId !== currentUser.id) return;

        if (event.data.type === 'FILTER_MEMORY_SYNC' && event.data.payload?.memory) {
          useStore.getState().setCaveiraFilterMemory?.(event.data.payload.memory);
          return;
        }
        if (event.data.type === 'PERFORMANCE_SNAPSHOT_SYNC' && event.data.payload) {
          useStore.getState().setCaveiraPerformanceSnapshot?.(event.data.payload);
          return;
        }
        if (event.data.type === 'COURSE_CATALOG_SYNC' && event.data.payload) {
          const stats = useStore.getState().syncCourseCatalogFromCaveira?.(event.data.payload);
          if (stats && stats.matchedSubjects > 0) {
            toast.success(
              `Curso sincronizado: ${stats.matchedSubjects} disciplinas (${stats.updatedLessons} aulas ligadas, ${stats.addedLessons} novas).`
            );
          } else {
            toast.info('Nenhuma disciplina correspondente encontrada para vincular este curso.');
          }
          return;
        }
        if (event.data.type === 'SIMULADOS_IMPORT' && event.data.payload) {
          const rawSimulados = Array.isArray(event.data.payload.simulados) ? event.data.payload.simulados : [];
          const imported = useStore.getState().importCaveiraSimulados?.(rawSimulados);
          const ids = rawSimulados.map((s) => s?.caveiraId || s?.id).filter(Boolean);
          try {
            window.postMessage(
              {
                source: 'QG_WEB_APP',
                type: 'SIMULADOS_IMPORT_ACK',
                payload: {
                  ids,
                  imported: Number(imported) || 0,
                  deliveryId: event.data.payload.deliveryId || null,
                },
              },
              window.location.origin
            );
          } catch {}
          if (imported > 0) {
            toast.success(`${imported} simulado(s) do Caveira importado(s).`);
          } else {
            toast.info('Todos os simulados visíveis já estavam importados.');
          }
          return;
        }
        if (event.data.type === 'PDF_STUDY_LOG' && event.data.payload) {
          useStore.getState().logCaveiraPdfStudy?.(event.data.payload);
          return;
        }
        if (event.data.type === 'SYNC_UPDATE' && event.data.payload) {
          if (event.data.payload.userId !== currentUser.id) return;
          const { newQuestion, questions, session: extSession, dailyGoal: extGoal } = event.data.payload;
          if (extSession) useStore.getState().setCaveiraSessionStats?.(extSession);
          if (extGoal && Number(extGoal) >= 5) {
            const curGoal = useStore.getState().caveiraDailyGoal;
            if (Number(extGoal) !== Number(curGoal)) {
              useStore.setState({ caveiraDailyGoal: Number(extGoal) });
            }
          }
          if (newQuestion) {
            if (newQuestion.ownerUserId !== currentUser.id) return;
            useStore.getState().addCaveiraQuestion(newQuestion);
          } else if (Array.isArray(questions) && questions.length > 0) {
            const scoped = questions.filter((q) => q && q.ownerUserId === currentUser.id);
            if (scoped.length > 0) useStore.getState().importCaveiraQuestions(scoped, true);
          }
        }
        if (event.data.type === 'CAVEIRA_DATA_RESPONSE' && event.data.payload) {
          if (event.data.payload.userId !== currentUser.id) return;
          const { questions, session: extSession, dailyGoal: extGoal } = event.data.payload;
          if (extSession) useStore.getState().setCaveiraSessionStats?.(extSession);
          if (extGoal && Number(extGoal) >= 5) {
            const curGoal = useStore.getState().caveiraDailyGoal;
            if (Number(extGoal) !== Number(curGoal)) {
              useStore.setState({ caveiraDailyGoal: Number(extGoal) });
            }
          }
          if (Array.isArray(questions) && questions.length > 0) {
            const scoped = questions.filter((q) => q && q.ownerUserId === currentUser.id);
            if (scoped.length > 0) useStore.getState().importCaveiraQuestions(scoped, true);
          }
        }
      }
    };

    const requestExtensionSync = () => {
      try {
        const currentUser = useStore.getState().user;
        const cloudReady = useStore.getState().hasCompletedInitialCloudSync;
        if (!currentUser?.id || !cloudReady) return;
        const currentStats = useStore.getState().userStats;
        const userLabel = (
          currentStats?.displayName ||
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split('@')[0] ||
          currentUser.email ||
          ''
        ).trim();
        window.postMessage(
          {
            source: 'QG_WEB_APP',
            type: 'SET_ACTIVE_USER',
            payload: { userId: currentUser.id, userEmail: currentUser.email || '', userLabel },
          },
          window.location.origin
        );
      } catch {}
    };

    window.addEventListener('message', handleExtensionMessage);
    window.addEventListener('focus', requestExtensionSync);
    requestExtensionSync();
    const syncTimer = setTimeout(requestExtensionSync, 1500);

    return () => {
      window.removeEventListener('message', handleExtensionMessage);
      window.removeEventListener('focus', requestExtensionSync);
      clearTimeout(syncTimer);
    };
  }, [session, hasCompletedInitialCloudSync, saveManualLessonIndex]);

  // Vincula imediatamente o usuário ativo e credenciais na extensão (sem esperar o fim do loadFromCloud)
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    try {
      const currentStats = useStore.getState().userStats;
      const userLabel = (
        currentStats?.displayName ||
        session.user.user_metadata?.display_name ||
        session.user.email?.split('@')[0] ||
        session.user.email ||
        ''
      ).trim();
      window.postMessage(
        {
          source: 'QG_WEB_APP',
          type: 'SET_ACTIVE_USER',
          payload: { userId: uid, userEmail: session.user.email || '', userLabel },
        },
        window.location.origin
      );
      if (session?.access_token && SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder')) {
        window.postMessage(
          {
            source: 'QG_WEB_APP',
            type: 'QG_PRF_SYNC_CLOUD_CREDS',
            payload: {
              supabaseUrl: SUPABASE_URL,
              anonKey: SUPABASE_ANON_KEY,
              accessToken: session.access_token,
              refreshToken: session.refresh_token || '',
              expiresAt: session.expires_at || 0,
              userId: uid,
            },
          },
          window.location.origin
        );
      }
    } catch {}
  }, [session?.user?.id, session?.user?.email, session?.user?.user_metadata?.display_name, session?.access_token, session?.refresh_token, session?.expires_at]);

  // Sincroniza índice de aulas do Caveira apenas quando o cache ou sync inicial muda
  useEffect(() => {
    if (!session || !hasCompletedInitialCloudSync) return;
    if (courseIndexCache && (courseIndexCache.latest || Object.keys(courseIndexCache.byLesson || {}).length > 0)) {
      useStore.getState().setCaveiraCourseIndexMap?.(courseIndexCache);
    }
  }, [session, hasCompletedInitialCloudSync, courseIndexCache]);

  // Ponte de envio: QG -> Extensão
  useEffect(() => {
    if (!session || !hasCompletedInitialCloudSync) return;

    try {
      const todayDateStr = getLocalDateStr ? getLocalDateStr() : '';
      const todayObj = new Date();
      let rawDaySubjects = [];

      if (calendarOverrides && Array.isArray(calendarOverrides[todayDateStr])) {
        rawDaySubjects = calendarOverrides[todayDateStr];
      } else {
        const shouldShift = cycleScheduleType === 'weekly' && (cycleCarryoverOffset || 0) > 0;
        const effIdx =
          cycleScheduleType === 'weekly'
            ? getCycleIndexForDate
              ? getCycleIndexForDate(todayObj, todayObj)
              : ((((cycleWeekStart === 'monday' ? (todayObj.getDay() + 6) % 7 : todayObj.getDay()) - (shouldShift ? cycleCarryoverOffset : 0)) % 7) + 7) % 7
            : currentDayIndex || 0;
        const effDateObj = shouldShift
          ? new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() - cycleCarryoverOffset)
          : todayObj;
        const effDateStr = shouldShift && getLocalDateStr ? getLocalDateStr(effDateObj) : todayDateStr;

        if (shouldShift && calendarOverrides && Array.isArray(calendarOverrides[effDateStr])) {
          rawDaySubjects = calendarOverrides[effDateStr];
        } else {
          const effDow = effDateObj.getDay();
          const matchingRules = (futureScheduleRules || [])
            .filter((r) => {
              if (!r || r.v !== 2 || !r.fromDate || r.fromDate > effDateStr) return false;
              if (cycleScheduleType === 'weekly' && r.dayOfWeek !== undefined) return r.dayOfWeek === effDow;
              return r.dayOfWeek === effDow || r.cycleIndex === effIdx;
            })
            .sort((a, b) => b.fromDate.localeCompare(a.fromDate));
          if (matchingRules.length > 0 && Array.isArray(matchingRules[0].daySlots)) {
            rawDaySubjects = matchingRules[0].daySlots;
          } else {
            rawDaySubjects = Array.isArray(cycle?.[effIdx]) ? cycle[effIdx] : [];
          }
        }
      }

      const todayDoneSet = new Set(completedTodayDate === todayDateStr ? completedToday || [] : []);
      const seenSubIds = new Set();
      const missionSubjects = [];
      (rawDaySubjects || []).forEach((sId, idx) => {
        const sub = subjects?.[sId];
        if (!sub || seenSubIds.has(sId)) return;
        seenSubIds.add(sId);
        const activeTopic = (sub.topics || []).find((t) => (Number(t.completed) || 0) < (Number(t.total) || 0)) || null;
        const firstLesson = activeTopic ? activeTopic.lessons?.[Number(activeTopic.completed) || 0] : null;
        missionSubjects.push({
          id: sId,
          name: sub.name,
          topic: activeTopic?.name || '',
          lesson: firstLesson?.name || '',
          completed: todayDoneSet.has(idx),
        });
      });

      window.postMessage(
        {
          source: 'QG_WEB_APP',
          type: 'QG_PRF_SYNC_TODAY_MISSION',
          payload: { date: todayDateStr, subjects: missionSubjects },
        },
        window.location.origin
      );

      const speeds = {};
      const moduleSpeeds = {};
      Object.values(subjects || {}).forEach((sub) => {
        if (!sub?.name) return;
        const speedVal = Math.min(4, Math.max(0.5, Number(sub.speed) || 1));
        speeds[sub.name] = speedVal;
        const urls = [];
        const courseIds = [];
        if (sub.caveiraModuleUrl) urls.push(sub.caveiraModuleUrl);
        if (sub.caveiraCourseId) courseIds.push(String(sub.caveiraCourseId));
        if (Array.isArray(sub.topics)) {
          sub.topics.forEach((topic) => {
            if (topic?.caveiraModuleUrl) urls.push(topic.caveiraModuleUrl);
            if (topic?.caveiraCourseId) courseIds.push(String(topic.caveiraCourseId));
            if (Array.isArray(topic?.lessons)) {
              topic.lessons.forEach((lesson) => {
                if (lesson?.caveiraUrl) urls.push(lesson.caveiraUrl);
                if (lesson?.url) urls.push(lesson.url);
              });
            }
          });
        }
        urls.forEach((rawUrl) => {
          const sUrl = String(rawUrl || '');
          const modMatch = sUrl.match(/\/courses\/(\d+)\/modules\/(\d+)/i);
          if (modMatch) {
            moduleSpeeds[`${modMatch[1]}:${modMatch[2]}`] = speedVal;
          }
          const cidMatch = sUrl.match(/\/courses\/(\d+)/i);
          if (cidMatch) {
            courseIds.push(cidMatch[1]);
          }
        });
        courseIds.forEach((cid) => {
          if (cid && moduleSpeeds[`course:${cid}`] === undefined) {
            moduleSpeeds[`course:${cid}`] = speedVal;
          }
        });
      });
      window.postMessage(
        {
          source: 'QG_WEB_APP',
          type: 'QG_PRF_SYNC_SUBJECT_SPEEDS',
          payload: { speeds, moduleSpeeds },
        },
        window.location.origin
      );

      // Sincroniza índice de aulas + timestamps + aulas vinculadas para "Professor no Timestamp" (#9)
      const moduleUrlToSubject = {};
      Object.values(subjects || {}).forEach((sub) => {
        if (!sub) return;
        const reg = (u, modTitle = '') => {
          const m = String(u || '').match(/\/courses\/(\d+)\/modules\/(\d+)/i);
          if (m && !moduleUrlToSubject[`${m[1]}:${m[2]}`]) {
            moduleUrlToSubject[`${m[1]}:${m[2]}`] = { subject: sub.name || '', moduleName: modTitle || '' };
          }
        };
        reg(sub.caveiraModuleUrl, '');
        (sub.topics || []).forEach((t) => {
          if (!t) return;
          reg(t.caveiraModuleUrl, t.name || '');
          (t.lessons || []).forEach((l) => reg(l?.caveiraUrl || l?.url, t.name || ''));
        });
      });

      const videoIndexOut = {};
      Object.entries(caveiraCourseIndexMap || {}).slice(0, 200).forEach(([k, v]) => {
        if (!v || !v.url) return;
        const cleanTitle = String(v.title || v.lessonTitle || '')
          .replace(/\b(?:play_circle(?:_outline|_filled)?|check_circle|ondemand_video|smart_display|lock|schedule)\b/gi, ' ')
          .replace(/\s+\d{1,2}:\d{2}(?::\d{2})?\s*$/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const modMatch = String(v.url || '').match(/\/courses\/(\d+)\/modules\/(\d+)/i);
        const modMeta = modMatch ? moduleUrlToSubject[`${modMatch[1]}:${modMatch[2]}`] : null;
        const resolvedSubj = v.subject || modMeta?.subject || '';
        const resolvedMod = (v.moduleName && v.moduleName !== 'Módulo Atual') ? v.moduleName : (modMeta?.moduleName || '');
        videoIndexOut[k] = {
          url: String(v.url).split('#')[0].replace(/([?&])t=\d+&?/g, '$1').replace(/[?&]$/, ''),
          courseId: v.courseId || '',
          title: cleanTitle || v.title || v.lessonTitle || '',
          subject: resolvedSubj,
          moduleName: resolvedMod,
          topics: Array.isArray(v.topics) ? v.topics.slice(0, 60) : [],
        };
      });
      Object.values(subjects || {}).forEach((sub) => {
        if (!sub || !Array.isArray(sub.topics)) return;
        sub.topics.forEach((t, tIdx) => {
          if (!t) return;
          const tLessons = Array.isArray(t.lessons) ? t.lessons : [];
          tLessons.forEach((l, lIdx) => {
            const url = l?.caveiraUrl || l?.url || t?.caveiraModuleUrl || sub?.caveiraModuleUrl || '';
            if (url && /^https?:\/\//i.test(String(url))) {
              const key = `sub_${sub.id}_${tIdx}_${lIdx}`;
              videoIndexOut[key] = {
                url,
                title: l?.name || t?.name || sub.name,
                subject: sub.name,
                moduleName: t?.name || '',
                topics: [],
                isFallbackSubjectLesson: true,
              };
            }
          });
        });
      });
      const videoIndexKeys = Object.keys(videoIndexOut);
      const totalTsCount = videoIndexKeys.reduce((acc, k) => acc + (videoIndexOut[k]?.topics?.length || 0), 0);
      const totalSubjCount = videoIndexKeys.reduce((acc, k) => acc + (videoIndexOut[k]?.subject ? 1 : 0), 0);
      const videoIndexSig = `${videoIndexKeys.length}|${totalTsCount}|${totalSubjCount}|${videoIndexKeys.slice(0, 12).join(',')}`;
      if (videoIndexKeys.length > 0 && videoIndexSig !== lastSyncedVideoIndexSigRef.current) {
        lastSyncedVideoIndexSigRef.current = videoIndexSig;
        window.postMessage(
          {
            source: 'QG_WEB_APP',
            type: 'QG_PRF_SYNC_COURSE_VIDEO_INDEX',
            payload: { index: videoIndexOut },
          },
          window.location.origin
        );
      }

      if (caveiraFilterMemory && Object.keys(caveiraFilterMemory).length > 0) {
        window.postMessage(
          {
            source: 'QG_WEB_APP',
            type: 'QG_PRF_SYNC_FILTER_MEMORY',
            payload: { memory: caveiraFilterMemory },
          },
          window.location.origin
        );
      }

      if (caveiraQuestionPrefs && Number(caveiraQuestionPrefs.updatedAt) > 0) {
        window.postMessage(
          {
            source: 'QG_WEB_APP',
            type: 'QG_PRF_SYNC_DEFAULT_PREFS',
            payload: {
              prefs: {
                examBoards: Array.isArray(caveiraQuestionPrefs.examBoards)
                  ? caveiraQuestionPrefs.examBoards
                  : [],
                numberAlternatives: Array.isArray(caveiraQuestionPrefs.numberAlternatives)
                  ? caveiraQuestionPrefs.numberAlternatives
                  : [],
                status:
                  typeof caveiraQuestionPrefs.status === 'string'
                    ? caveiraQuestionPrefs.status
                    : 'not_resolved',
                difficultyIds: resolveEffectiveDifficultyIds(caveiraQuestionPrefs),
                syncBoardsAndAlts: true,
              },
            },
          },
          window.location.origin
        );
      }

      if (session?.access_token && session?.user?.id) {
        if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder')) {
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_SYNC_CLOUD_CREDS',
              payload: {
                supabaseUrl: SUPABASE_URL,
                anonKey: SUPABASE_ANON_KEY,
                accessToken: session.access_token,
                refreshToken: session.refresh_token || '',
                expiresAt: session.expires_at || 0,
                userId: session.user.id,
              },
            },
            window.location.origin
          );
        }
      }

      const dueFsrsCount = (reviews || []).filter((r) => r && r.nextDateStr <= todayDateStr).length;
      const dueProgCount = (progressiveReviews || []).filter((r) => r && r.nextDateStr <= todayDateStr).length;
      const pendingReviewsCount = dueFsrsCount + dueProgCount;
      const streakActiveToday = Boolean((studyHistory?.[todayDateStr] || 0) > 0);
      window.postMessage(
        {
          source: 'QG_WEB_APP',
          type: 'QG_PRF_SYNC_REMINDER_STATE',
          payload: {
            pendingReviewsCount,
            streakActiveToday,
            todayDate: todayDateStr,
            dailyGoal: Number(caveiraDailyGoal) || 50,
          },
        },
        window.location.origin
      );

      if (activePracticeMission && activePracticeMission.id && activePracticeMission.status === 'active') {
        const missionSig = getMissionSyncSignature(activePracticeMission);
        if (
          missionSig &&
          missionSig !== lastSyncedMissionSigRef.current &&
          missionSig !== useStore._lastMissionSyncFromExtSig
        ) {
          lastSyncedMissionSigRef.current = missionSig;
          window.postMessage(
            {
              source: 'QG_WEB_APP',
              type: 'QG_PRF_SYNC_ACTIVE_MISSION',
              payload: {
                mission: serializeMissionForBridge({
                  ...activePracticeMission,
                  ownerUserId: activePracticeMission.ownerUserId || session?.user?.id || null,
                }),
              },
            },
            window.location.origin
          );
        }
      } else if (!activePracticeMission) {
        lastSyncedMissionSigRef.current = '';
      }
    } catch {}
  }, [
    session,
    hasCompletedInitialCloudSync,
    subjects,
    cycle,
    currentDayIndex,
    completedToday,
    completedTodayDate,
    calendarOverrides,
    futureScheduleRules,
    cycleScheduleType,
    cycleWeekStart,
    cycleCarryoverOffset,
    caveiraFilterMemory,
    caveiraQuestionPrefs,
    caveiraCourseIndexMap,
    progressiveReviews,
    activePracticeMission,
    courseIndexCache,
    reviews,
    studyHistory,
    caveiraDailyGoal,
    getLocalDateStr,
    getCycleIndexForDate,
  ]);

  return {
    courseIndexCache,
    manualLessonIndexMap,
    saveManualLessonIndex,
  };
}
