import { extractTreeNodesFromApiJson } from '../tree/dynamicTreeManager.js';

// Sniffer passivo da API do Projeto Caveira (MAIN world — somente leitura de respostas JSON) — #2 e #7
(function () {
  if (window.__qgCaveiraApiSnifferInstalled) return;
  window.__qgCaveiraApiSnifferInstalled = true;

  const replayBuffer = [];
  const MAX_BUFFER = 80;

  function emit(type, payload) {
    try {
      if (type === 'API_COURSE_CATALOG' && payload && Array.isArray(payload.modules)) {
        const idx = replayBuffer.findIndex(
          (item) => item.type === 'API_COURSE_CATALOG' &&
            item.payload?.courseId === payload.courseId &&
            item.payload.modules?.map((m) => m.name).join('|') === payload.modules.map((m) => m.name).join('|')
        );
        if (idx >= 0) {
          replayBuffer[idx] = { type, payload };
        } else {
          replayBuffer.push({ type, payload });
        }
      } else {
        replayBuffer.push({ type, payload });
      }
      if (replayBuffer.length > MAX_BUFFER) {
        replayBuffer.splice(0, replayBuffer.length - MAX_BUFFER);
      }
      window.postMessage({ source: 'QG_CAVEIRA_API_SNIFFER', type, payload }, '*');
    } catch (_) {}
  }

  window.addEventListener('message', (ev) => {
    if (ev.source !== window || ev.data?.source !== 'QG_CAVEIRA_CONTENT' || ev.data?.type !== 'REQUEST_SNIFFER_REPLAY') {
      return;
    }
    replayBuffer.forEach((item) => {
      try {
        window.postMessage({ source: 'QG_CAVEIRA_API_SNIFFER', type: item.type, payload: item.payload }, '*');
      } catch (_) {}
    });
  });

  function stripHtml(raw) {
    if (!raw || typeof raw !== 'string') return '';
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function normalizeQuestionNode(item) {
    if (!item || typeof item !== 'object') return null;
    const rawId = item.code || item.question_code || (item.id ? `Q${String(item.id).replace(/^Q/i, '')}` : '');
    if (!rawId || !/^Q\d{3,}$/i.test(String(rawId))) {
      if (!item.enunciado && !item.statement && !item.question && !item.teacher_comment && !item.comentario_professor) {
        return null;
      }
    }
    const id = String(rawId || item.id).toUpperCase().startsWith('Q')
      ? String(rawId || item.id).toUpperCase()
      : `Q${rawId || item.id}`;

    const teacherRaw =
      item.teacher_comment ||
      item.teacherComment ||
      item.comentario_professor ||
      item.comment_teacher ||
      item.gabarito_comentado ||
      '';
    const charlieRaw = item.charlie_comment || item.charlie || item.ai_explanation || '';
    const commentText = stripHtml(typeof teacherRaw === 'string' ? teacherRaw : (teacherRaw?.text || teacherRaw?.content || ''))
      || stripHtml(typeof charlieRaw === 'string' ? charlieRaw : (charlieRaw?.text || charlieRaw?.content || ''));
    const commentSource = teacherRaw ? 'professor' : (charlieRaw ? 'charlie' : '');

    const stats = item.statistics || item.stats || item.estatisticas || {};
    let corrPct = Number(stats.correct_percentage ?? stats.hits_percentage ?? item.correct_percentage ?? item.hits_percentage);
    if (!Number.isFinite(corrPct)) {
      const tot = Number(stats.total ?? stats.answered ?? item.total_answers);
      const hits = Number(stats.hits ?? stats.correct ?? item.correct_answers);
      if (Number.isFinite(tot) && tot > 0 && Number.isFinite(hits) && hits >= 0) {
        corrPct = Math.round((hits / tot) * 100);
      }
    }
    const hasPct = Number.isFinite(corrPct) && corrPct >= 0 && corrPct <= 100;

    const noteRaw = item.user_note || item.userNote || item.note || item.anotacao || '';
    const banca = String(item.board?.name || item.banca?.name || item.banca || '').trim();
    const ano = String(item.year || item.ano || '').trim();

    if (!commentText && !hasPct && !noteRaw && !banca && !ano) return null;
    return {
      id,
      ...(commentText ? { teacherComment: commentText.slice(0, 2500), commentSource } : {}),
      ...(hasPct ? { communityCorrectPct: Math.round(corrPct), communityErrorPct: Math.max(0, 100 - Math.round(corrPct)) } : {}),
      ...(noteRaw ? { userNote: stripHtml(String(noteRaw)).slice(0, 1000) } : {}),
      ...(banca ? { banca } : {}),
      ...(ano ? { ano } : {}),
    };
  }

  function normalizeDurationMin(val) {
    if (!val) return 0;
    if (typeof val === 'number') {
      return val > 300 ? Math.max(1, Math.round(val / 60)) : Math.max(1, Math.round(val));
    }
    const str = String(val).trim();
    const m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      if (m[3] !== undefined) return Math.round(Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60);
      return Math.max(1, Math.round(Number(m[1]) + Number(m[2]) / 60));
    }
    return Math.max(0, Math.round(Number(str) || 0));
  }

  function inspectApiPayload(url, data) {
    if (!data || typeof data !== 'object') return;
    const root = (data.data && typeof data.data === 'object') ? data.data : data;

    // 0. #7 Auto-descoberta da Árvore Dinâmica (disciplinas/tópicos/subtópicos)
    const treeRows = extractTreeNodesFromApiJson(url, data);
    if (treeRows.length > 0) {
      emit('API_SUBJECT_TREE_DATA', { nodes: treeRows });
    }

    // 1. Detectar catálogo de curso / módulos / videoaulas
    const urlStr = String(url || '');
    const courseIdMatch = urlStr.match(/\/courses\/(\d+)/i) || window.location.pathname.match(/\/courses\/(\d+)/i);
    const modIdMatch = urlStr.match(/\/modules\/(\d+)/i) || window.location.pathname.match(/\/modules\/(\d+)/i);
    const modIdFromUrl = modIdMatch?.[1] || '';

    const multiModulesCandidate =
      root.modules ||
      root.course_modules ||
      root.course?.modules ||
      root.disciplines ||
      root.subjects ||
      root.sections ||
      (Array.isArray(root) && root[0] && (
        root[0].videos ||
        root[0].course_videos ||
        root[0].lessons ||
        root[0].contents ||
        root[0].items ||
        root[0].topics ||
        root[0].submodules ||
        root[0].course_module_videos ||
        (/\/courses\/\d+\/modules/i.test(urlStr) && root[0].id && (root[0].name || root[0].title))
      ) ? root : null);

    const singleVideoList =
      root.videos ||
      root.course_videos ||
      root.lessons ||
      root.contents ||
      root.course_module_videos ||
      (Array.isArray(root) && root[0] && (
        root[0].course_video_id !== undefined ||
        root[0].video_id !== undefined ||
        root[0].vimeo_id !== undefined ||
        root[0].bunny_id !== undefined ||
        root[0].embed_url !== undefined ||
        root[0].duration_seconds !== undefined
      ) ? root : null);

    const modulesArr = (Array.isArray(multiModulesCandidate) && multiModulesCandidate.length > 0)
      ? multiModulesCandidate
      : (Array.isArray(singleVideoList) && singleVideoList.length > 0)
      ? [{
          id: (!Array.isArray(root) && root.id) ? root.id : (modIdFromUrl || '0'),
          name: (!Array.isArray(root) ? (root.name || root.title || root.module?.name || root.module?.title) : '') || document.querySelector('h1, h2, .text-h6')?.textContent?.trim() || 'Módulo Atual',
          videos: singleVideoList,
        }]
      : null;

    if (modulesArr && modulesArr.length > 0) {
      const courseId = String(
        (!Array.isArray(root) ? (root.course_id || root.course?.id || (Array.isArray(root.modules) || Array.isArray(root.course_modules) ? root.id : '')) : '') ||
        courseIdMatch?.[1] ||
        '12'
      );
      const courseName = String((!Array.isArray(root) ? (root.course?.name || root.course?.title || root.name || root.title) : '') || 'Curso Caveira').trim();
      const parsedModules = modulesArr.map((mod) => {
        const modName = String(mod?.name || mod?.title || '').trim();
        if (!modName) return null;
        const modId = mod?.id ? String(mod.id) : modIdFromUrl;
        const moduleUrl = (courseId && modId && modId !== '0')
          ? `${window.location.origin}/courses/${courseId}/modules/${modId}/playground`
          : (courseId ? `${window.location.origin}/courses/${courseId}` : '');
        const rawLessons = [];
        const seenVids = new Set();
        const pushLesson = (v) => {
          if (!v || typeof v !== 'object') return;
          const vid = String(v.course_video_id || v.video_id || v.id || '');
          const title = String(v.title || v.name || v.label || '').trim();
          if (!title) return;
          const dedup = vid ? `id:${vid}` : `t:${title.toLowerCase()}`;
          if (seenVids.has(dedup)) return;
          seenVids.add(dedup);
          const urlPath = (courseId && vid)
            ? `${window.location.origin}/courses/${courseId}/modules/${modId || '0'}/playground?course_video_id=${vid}`
            : moduleUrl;
          rawLessons.push({
            id: vid || null,
            title,
            durationMin: normalizeDurationMin(v.duration || v.duration_seconds || v.duration_minutes || v.time || v.length),
            completed: Boolean(v.completed || v.is_completed || v.watched || v.concluded || v.finished),
            url: urlPath,
          });
        };
        (mod.videos || mod.course_videos || mod.lessons || mod.contents || mod.items || mod.course_module_videos || []).forEach(pushLesson);
        (mod.topics || mod.submodules || []).forEach((tp) => {
          (tp?.videos || tp?.course_videos || tp?.lessons || tp?.contents || []).forEach(pushLesson);
        });
        if (rawLessons.length === 0 && !/\/courses\/\d+/i.test(urlStr)) return null;
        return { id: modId || null, name: modName, moduleUrl, lessons: rawLessons };
      }).filter(Boolean);

      if (parsedModules.length > 0) {
        emit('API_COURSE_CATALOG', { courseId, courseName, modules: parsedModules });
        return;
      }
    }

    // 1B. Extrator profundo de datas de tentativa/liberação e detalhamento /enjoyment
    const normalizeExtractedDate = (val) => {
      if (typeof val !== 'string') return null;
      const iso = val.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
      if (iso) {
        const yr = Number(iso[1]);
        if (yr >= 2018 && yr <= 2035) return `${iso[1]}-${iso[2]}-${iso[3]}`;
      }
      const br = val.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
      if (br) {
        const yr = Number(br[3]);
        if (yr >= 2018 && yr <= 2035) return `${br[3]}-${br[2]}-${br[1]}`;
      }
      return null;
    };

    const extractSimuladoDatesDeep = (obj) => {
      let attemptDate = null;
      let releaseDate = null;
      const visited = new Set();

      const walk = (node, depth = 0, parentContext = '') => {
        if (!node || typeof node !== 'object' || depth > 5 || visited.has(node)) return;
        visited.add(node);

        if (Array.isArray(node)) {
          if (node.length > 0 && typeof node[0] === 'object' && node[0] && (node[0].position !== undefined || node[0].rank !== undefined || node[0].nickname)) {
            return;
          }
          node.slice(0, 12).forEach((child) => walk(child, depth + 1, parentContext));
          return;
        }

        const keys = Object.keys(node);
        for (const k of keys) {
          const kl = k.toLowerCase();
          if (/(?:ranking|rankings|leaderboard|participants|members|others|candidates)/i.test(kl)) continue;
          const v = node[k];
          if (typeof v === 'string') {
            const parsed = normalizeExtractedDate(v);
            if (!parsed) continue;
            const isAttemptKey = /^(?:finished|completed|answered|submitted|concluded|solved|done|realized|execution|performed|taken)_?(?:at|date)?$/i.test(kl)
              || (/^(?:created_at|updated_at|date)$/i.test(kl) && /(?:user|attempt|answer|result|enjoyment|submission|my_)/i.test(parentContext));
            const isReleaseKey = /^(?:release|released|available|publish|published|start|starts)_?(?:at|date)?$/i.test(kl)
              || (depth === 0 && /^(?:created_at|date)$/i.test(kl));

            if (isAttemptKey && !attemptDate) {
              attemptDate = parsed;
            } else if (isReleaseKey && !releaseDate) {
              releaseDate = parsed;
            }
          } else if (v && typeof v === 'object') {
            walk(v, depth + 1, `${parentContext}.${kl}`);
          }
        }
      };

      walk(obj, 0, '');
      return { attemptDate, releaseDate };
    };

    const enjoyMatch = String(url || '').match(/\/practice-exams?\/(\d+)\/enjoyment/i);
    if (enjoyMatch) {
      const rawBlocks = root.blocks || root.blocos || root.groups || root.by_block || root.blocks_performance || [];
      const rawSubjects = root.subjects || root.disciplines || root.disciplinas || root.by_subject || root.disciplines_performance || [];
      const mapScoreRow = (item) => {
        const hitsVal = Number(item?.hits ?? item?.correct ?? item?.correct_answers ?? item?.acertos ?? 0);
        const errorsVal = Number(item?.errors ?? item?.wrong ?? item?.wrong_answers ?? item?.erros ?? 0);
        const blankVal = Number(item?.blank ?? item?.not_answered ?? item?.em_branco ?? item?.unanswered ?? 0);
        const totalVal = Number(item?.total ?? item?.questions_count ?? (hitsVal + errorsVal + blankVal));
        const netVal = item?.net_score !== undefined
          ? Number(item.net_score)
          : (item?.score !== undefined
          ? Number(item.score)
          : (item?.liquida !== undefined ? Number(item.liquida) : (hitsVal - errorsVal)));
        const rawPct = item?.percentage ?? item?.accuracy ?? item?.enjoyment ?? item?.user_percentage;
        const rawOthers = item?.others_percentage ?? item?.members_percentage ?? item?.others ?? item?.average_others;
        const pctVal = rawPct !== undefined ? Math.round(Number(rawPct)) : (totalVal > 0 ? Math.round((hitsVal / totalVal) * 100) : 0);
        const othersNum = rawOthers !== undefined && rawOthers !== null && rawOthers !== '' ? Number(rawOthers) : undefined;
        return {
          name: String(item?.name || item?.title || item?.subject || item?.discipline || '').trim(),
          hits: hitsVal,
          errors: errorsVal,
          blank: blankVal,
          total: totalVal,
          liquida: netVal,
          pct: pctVal,
          ...(Number.isFinite(othersNum) ? { othersPct: Math.round(othersNum * 100) / 100 } : {}),
        };
      };
      const blocks = (Array.isArray(rawBlocks) ? rawBlocks : []).map(mapScoreRow).filter((r) => r.name);
      const subjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map(mapScoreRow).filter((r) => r.name);
      const dates = extractSimuladoDatesDeep(root);
      if (blocks.length > 0 || subjects.length > 0 || dates.attemptDate || dates.releaseDate) {
        emit('API_SIMULADO_ENJOYMENT', {
          caveiraId: `sim_${enjoyMatch[1]}`,
          examId: enjoyMatch[1],
          blocks,
          subjects,
          attemptDate: dates.attemptDate,
          releaseDate: dates.releaseDate,
        });
        return;
      }
    }

    const examDatesMatch = String(url || '').match(/\/practice-exams?\/(\d+)(?:\/questions\/revision)?(?:[?#]|$)/i);
    if (examDatesMatch && !/\/(?:ranking|rankings|leaderboard)/i.test(String(url || ''))) {
      const dates = extractSimuladoDatesDeep(root);
      if (dates.attemptDate || dates.releaseDate) {
        emit('API_SIMULADO_DATES', {
          examId: examDatesMatch[1],
          caveiraId: `sim_${examDatesMatch[1]}`,
          attemptDate: dates.attemptDate,
          releaseDate: dates.releaseDate,
        });
      }
    }

    // 2. Detectar simulados / exames / turmas (bloqueando rankings/classificações de outros candidatos)
    const isRankingUrl = /\/(?:ranking|rankings|leaderboard|classificacao|classification|participants|students|users|positions|podium|top-?\d*)\b|[?&](?:ranking|leaderboard|page_ranking)=/i.test(String(url || ''));

    const looksLikeRankingRow = (item, isFromArray = false) => {
      if (!item || typeof item !== 'object') return true;
      const rawTitle = String(
        item.title ||
        item.exam_name ||
        item.practice_exam?.title ||
        item.practice_exam?.name ||
        item.name ||
        ''
      ).trim();
      if (/^#?\d{1,5}\s*[º°ª]?$/.test(rawTitle) || /^caveira\s+\d{3,}$/i.test(rawTitle)) {
        return true;
      }

      const hasExplicitExamSignals = Boolean(
        Array.isArray(item.subjects) ||
        Array.isArray(item.disciplines) ||
        item.exam_name ||
        item.practice_exam ||
        /simulado|exame|prova|prf|pol[ií]cia|turma/i.test(rawTitle)
      );

      const hasCandidateField = Boolean(
        item.nickname ||
        item.username ||
        item.avatar ||
        item.avatar_url ||
        item.student ||
        item.student_name ||
        item.candidate ||
        (item.user_name && !hasExplicitExamSignals)
      );
      if (hasCandidateField && !hasExplicitExamSignals) return true;

      if (hasExplicitExamSignals) return false;

      const hasPositionField = Boolean(
        item.position !== undefined ||
        item.rank !== undefined ||
        item.ranking !== undefined ||
        item.placement !== undefined ||
        item.colocacao !== undefined
      );
      const hasAnyExamField = Boolean(
        item.exam_id ||
        item.practice_exam_id ||
        item.total_questions !== undefined ||
        item.questions_count !== undefined
      );
      if (isFromArray && hasPositionField && !hasAnyExamField) return true;
      if (!hasAnyExamField && !item.finished_at && !item.completed_at && !item.started_at) return true;
      return false;
    };

    const singlePersonalWrapper = (!Array.isArray(root) && [
      root.practice_exam,
      root.exam,
      root.my_result,
      root.user_result,
      root.attempt,
      root.result,
    ].find((obj) => obj && typeof obj === 'object' && !Array.isArray(obj) && (
      obj.hits !== undefined ||
      obj.correct_answers !== undefined ||
      obj.net_score !== undefined ||
      obj.score !== undefined ||
      Array.isArray(obj.subjects) ||
      Array.isArray(obj.disciplines)
    ))) || null;

    let simArr = isRankingUrl
      ? null
      : Array.isArray(root.practice_exams)
      ? root.practice_exams
      : Array.isArray(root.exams)
      ? root.exams
      : (Array.isArray(root) && root[0] && (root[0].hits !== undefined || root[0].correct_answers !== undefined || root[0].score !== undefined || root[0].net_score !== undefined) && !root[0].alternatives)
      ? root
      : singlePersonalWrapper
      ? [singlePersonalWrapper]
      : (/practice-exam|team|simulado/i.test(url) && !Array.isArray(root) && (root.hits !== undefined || root.correct_answers !== undefined || root.net_score !== undefined || root.score !== undefined || Array.isArray(root.subjects) || Array.isArray(root.disciplines)))
      ? [root]
      : null;

    const isArrayPayload = Array.isArray(simArr) && (simArr === root || simArr === root.practice_exams || simArr === root.exams || simArr.length > 1);
    if (simArr && simArr.length > 1) {
      const distinctUsers = new Set(simArr.map((x) => x?.user_id ?? x?.student_id ?? x?.participant_id).filter(Boolean));
      if (distinctUsers.size > 1) {
        simArr = null;
      }
    }

    if (simArr && simArr.length > 0) {
      const normalizedSims = simArr.map((sim) => {
        if (!sim || typeof sim !== 'object' || looksLikeRankingRow(sim, isArrayPayload)) return null;
        const hits = Number(sim.hits ?? sim.correct_answers ?? sim.correct ?? 0);
        const errorsRaw = sim.errors ?? sim.wrong_answers;
        const liquidaVal = sim.net_score !== undefined ? Number(sim.net_score) : (sim.score !== undefined ? Number(sim.score) : undefined);
        let total = Number(sim.total_questions ?? sim.questions_count ?? sim.total ?? 0);
        if (!total || total <= 0) {
          const sumKnown = hits + (Number(errorsRaw) || 0) + (Number(sim.blank) || 0);
          if (sumKnown > 0) total = sumKnown;
          else if (Number.isFinite(liquidaVal)) total = 120;
        }
        if (!total || total <= 0) return null;
        const errors = errorsRaw !== undefined ? Number(errorsRaw) : Math.max(0, total - hits);
        const pct = Number(sim.percentage ?? sim.accuracy ?? Math.round((hits / total) * 100));
        const liquida = Number.isFinite(liquidaVal) ? liquidaVal : (hits - errors);
        const { attemptDate, releaseDate } = extractSimuladoDatesDeep(sim);
        const rawDate = String(sim.finished_at || sim.completed_at || sim.answered_at || sim.created_at || sim.date || '').slice(0, 10);
        const resolvedDate = attemptDate || releaseDate || (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : undefined);
        const dateSource = attemptDate ? 'attempt' : (releaseDate ? 'release' : undefined);
        const subjectScores = Array.isArray(sim.subjects || sim.disciplines)
          ? (sim.subjects || sim.disciplines).map((s) => ({
              name: String(s?.name || s?.subject || '').trim(),
              hits: Number(s?.hits ?? s?.correct ?? 0),
              errors: Number(s?.errors ?? s?.wrong ?? 0),
              blank: Number(s?.blank ?? s?.not_answered ?? 0),
              liquida: s?.net_score !== undefined ? Number(s.net_score) : (Number(s?.hits ?? s?.correct ?? 0) - Number(s?.errors ?? s?.wrong ?? 0)),
            }))
          : [];
        const title = String(
          sim.title ||
          sim.exam_name ||
          sim.practice_exam?.title ||
          sim.practice_exam?.name ||
          sim.name ||
          'Simulado Caveira'
        ).trim();
        return {
          caveiraId: sim.id ? `sim_${sim.id}` : undefined,
          title,
          data: resolvedDate,
          ...(dateSource ? { dateSource } : {}),
          ...(releaseDate ? { releasedAt: releaseDate } : {}),
          total,
          hits,
          errors,
          pct: Math.round(pct),
          liquida,
          subjectScores,
        };
      }).filter(Boolean);

      if (normalizedSims.length > 0) {
        emit('API_SIMULADOS_DATA', { simulados: normalizedSims });
        return;
      }
    }

    // 3. Detectar questão isolada ou lista de questões
    const candidates = Array.isArray(root)
      ? root
      : Array.isArray(root.questions)
      ? root.questions
      : Array.isArray(root.items)
      ? root.items
      : [root];

    const parsedQuestions = candidates.map(normalizeQuestionNode).filter(Boolean);
    if (parsedQuestions.length > 0) {
      emit('API_QUESTION_DATA', { questions: parsedQuestions });
    }
  }

  const shouldInspectUrl = (urlStr) => {
    const s = String(urlStr || '').toLowerCase();
    if (!s || /\.(png|jpg|jpeg|svg|webp|woff2?|css|js|mp4|m3u8|ts)(\?|$)/.test(s)) return false;
    return s.includes('caveira') || s.startsWith('/') || s.includes('/api/');
  };

  // Wrapper passivo de fetch
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (...args) {
      const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const promise = origFetch.apply(this, args);
      if (shouldInspectUrl(reqUrl)) {
        promise.then((res) => {
          try {
            if (!res || !res.ok) return;
            const ct = res.headers?.get('content-type') || '';
            if (!ct.includes('json')) return;
            res.clone().json().then((json) => inspectApiPayload(reqUrl, json)).catch(() => {});
          } catch (_) {}
        }).catch(() => {});
      }
      return promise;
    };
  }

  // Wrapper passivo de XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__qgUrl = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (shouldInspectUrl(this.__qgUrl)) {
      this.addEventListener('load', () => {
        try {
          const ct = this.getResponseHeader('content-type') || '';
          if (ct.includes('json') && typeof this.responseText === 'string' && (this.responseText.trim().startsWith('{') || this.responseText.trim().startsWith('['))) {
            const json = JSON.parse(this.responseText);
            inspectApiPayload(this.__qgUrl, json);
          }
        } catch (_) {}
      });
    }
    return origSend.apply(this, args);
  };
})();
