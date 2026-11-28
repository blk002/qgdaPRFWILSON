import { extractTreeNodesFromApiJson } from '../tree/dynamicTreeManager.js';

// Sniffer 100% passivo da API do Projeto Caveira (MAIN world — somente leitura de respostas JSON; zero requisições ativas e zero leitura de tokens) — v3.6.1
(function () {
  if (/^(?:loja|checkout|blog|pay|pagamentos?|www)\./i.test(window.location.hostname || '')) return;
  if (window.__qgCaveiraApiSnifferInstalled) return;
  window.__qgCaveiraApiSnifferInstalled = true;

  const replayBuffer = [];
  const MAX_BUFFER = 80;
  let channelNonce = null;
  let allowNextNonceInit = true;
  let diagnosticMode = false;

  const SENSITIVE_KEY_RX = /(?:token|auth|cookie|password|passwd|secret|jwt|bearer|authorization|refresh_token|access_token|apikey|api_key|email|cpf|phone|video_url|embed_url|signed|signature)/i;
  const JWT_RX = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]+)?/g;

  function safeUrlPath(rawUrl) {
    try {
      const u = new URL(String(rawUrl || ''), window.location.origin);
      return `${u.origin}${u.pathname}`;
    } catch (_) {
      return String(rawUrl || '').split('?')[0].slice(0, 140);
    }
  }

  function summarizeShape(val, depth = 0, keyHint = '') {
    if (keyHint && SENSITIVE_KEY_RX.test(keyHint)) return '[REDACTED]';
    if (depth > 4) return '[depth-limit]';
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    const t = typeof val;
    if (t === 'boolean' || t === 'number') return `${t}:${val}`;
    if (t === 'string') {
      const cleaned = val.replace(JWT_RX, '[REDACTED_JWT]');
      const preview = cleaned.slice(0, 36).replace(/\s+/g, ' ');
      return `string(${val.length}): "${preview}${cleaned.length > 36 ? '...' : ''}"`;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return 'array(0)';
      return [`array(${val.length})`, summarizeShape(val[0], depth + 1, keyHint)];
    }
    if (t === 'object') {
      const keys = Object.keys(val).slice(0, 28);
      const out = {};
      for (const k of keys) {
        out[k] = summarizeShape(val[k], depth + 1, k);
      }
      if (Object.keys(val).length > 28) {
        out.__moreKeys = Object.keys(val).length - 28;
      }
      return out;
    }
    return t;
  }

  function postVerifiedMessage(type, payload) {
    if (!channelNonce) return;
    try {
      window.postMessage(
        { source: 'QG_CAVEIRA_API_SNIFFER', nonce: channelNonce, type, payload },
        window.location.origin
      );
    } catch (_) {}
  }

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
      } else if (type === 'API_COURSES_LIST' && payload && Array.isArray(payload.courses)) {
        const idx = replayBuffer.findIndex((item) => item.type === 'API_COURSES_LIST');
        if (idx >= 0) {
          const mergedById = new Map();
          (replayBuffer[idx].payload?.courses || []).forEach((c) => {
            if (c?.id) mergedById.set(String(c.id), c);
          });
          payload.courses.forEach((c) => {
            if (c?.id) mergedById.set(String(c.id), c);
          });
          replayBuffer[idx] = { type, payload: { courses: Array.from(mergedById.values()) } };
        } else {
          replayBuffer.push({ type, payload });
        }
      } else {
        replayBuffer.push({ type, payload });
      }
      if (replayBuffer.length > MAX_BUFFER) {
        replayBuffer.splice(0, replayBuffer.length - MAX_BUFFER);
      }
      postVerifiedMessage(type, payload);
    } catch (_) {}
  }

  function emitDiagnosticShape(kind, url, extra = {}) {
    if (!diagnosticMode) return;
    postVerifiedMessage('API_DIAGNOSTIC_SHAPE', {
      at: new Date().toISOString(),
      kind,
      url: safeUrlPath(url),
      ...extra,
    });
  }

  window.addEventListener('qg-caveira-teardown', () => {
    allowNextNonceInit = true;
    channelNonce = null;
  });

  window.addEventListener('qg-caveira-sniffer-init', (ev) => {
    const detail = ev?.detail;
    if (!detail || typeof detail.nonce !== 'string' || detail.nonce.length < 16) return;
    if (!allowNextNonceInit && channelNonce && detail.nonce !== channelNonce) return;
    const isFreshInit = allowNextNonceInit || !channelNonce;
    channelNonce = detail.nonce;
    allowNextNonceInit = false;
    if (typeof detail.diagnosticMode === 'boolean') {
      diagnosticMode = detail.diagnosticMode;
    }
    if (isFreshInit) {
      replayBuffer.forEach((item) => postVerifiedMessage(item.type, item.payload));
    }
  });

  window.addEventListener('message', (ev) => {
    if (
      ev.source !== window ||
      ev.origin !== window.location.origin ||
      ev.data?.source !== 'QG_CAVEIRA_CONTENT' ||
      !channelNonce ||
      ev.data?.nonce !== channelNonce
    ) {
      return;
    }
    if (ev.data.type === 'REQUEST_SNIFFER_REPLAY') {
      replayBuffer.forEach((item) => postVerifiedMessage(item.type, item.payload));
      return;
    }
    if (ev.data.type === 'SET_DIAGNOSTIC_MODE') {
      diagnosticMode = Boolean(ev.data.payload?.enabled);
    }
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

    const numericId = Number(item.id);
    const apiId = Number.isFinite(numericId) && numericId > 0 ? numericId : null;
    const rawExplicitCode = String(item.code || item.question_code || '').trim();
    const explicitCode = rawExplicitCode
      ? (rawExplicitCode.toUpperCase().startsWith('Q') ? rawExplicitCode.toUpperCase() : `Q${rawExplicitCode}`)
      : null;

    const contentText = stripHtml(item.content || item.enunciado || item.statement || item.question || '').slice(0, 2500);
    const supportingText = stripHtml(item.supporting_content || item.supportingContent || '').slice(0, 1500);

    const subjectStr = String(
      item.subject?.name || item.subject?.title || (typeof item.subject === 'string' ? item.subject : '') ||
      item.discipline?.name || (typeof item.discipline === 'string' ? item.discipline : '') || ''
    ).trim();
    const subtopicStr = String(
      item.subtopic?.name || item.subtopic?.title || (typeof item.subtopic === 'string' ? item.subtopic : '') ||
      item.topic?.name || (typeof item.topic === 'string' ? item.topic : '') || ''
    ).trim();
    const subtopicPathStr = String(item.subtopic_path || item.subtopicPath || '').trim();

    if (!apiId && !explicitCode && !contentText && !subtopicPathStr) {
      return null;
    }

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
    const banca = String(
      item.examining_board?.name ||
      (typeof item.examining_board === 'string' ? item.examining_board : '') ||
      item.board?.name ||
      item.banca?.name ||
      item.banca ||
      ''
    ).trim();
    const ano = item.year !== undefined && item.year !== null
      ? String(item.year).trim()
      : String(item.ano || '').trim();

    const alternatives = Array.isArray(item.alternatives)
      ? item.alternatives.map((alt) => ({
          answer: alt?.answer ?? alt?.letter ?? '',
          letter: String(alt?.letter ?? alt?.answer ?? '').trim(),
          text: stripHtml(alt?.content || alt?.text || '').slice(0, 800),
          ...(alt?.is_correct !== undefined ? { isCorrect: Boolean(alt.is_correct) } : {}),
        })).filter((a) => a.letter || a.text)
      : [];

    const lastStatus = item.last_answer_status !== undefined ? item.last_answer_status : (item.lastAnswerStatus ?? null);
    if (
      diagnosticMode &&
      lastStatus !== null &&
      lastStatus !== undefined &&
      typeof lastStatus !== 'boolean' &&
      !/^(?:correct|wrong|incorrect|hit|error|acerto|erro|acertou|errou|0|1|true|false)$/i.test(String(lastStatus))
    ) {
      emitDiagnosticShape('unknown_answer_status', window.location.pathname, {
        apiId,
        rawType: typeof lastStatus,
        preview: String(lastStatus).slice(0, 60),
      });
    }

    const hasQuestionSignal = Boolean(
      explicitCode ||
      contentText ||
      subtopicPathStr ||
      alternatives.length > 0 ||
      commentText ||
      banca ||
      hasPct ||
      item.last_answer_status !== undefined ||
      item.question_code
    );
    if (!hasQuestionSignal) {
      return null;
    }

    return {
      ...(apiId ? { apiId } : {}),
      ...(explicitCode ? { code: explicitCode, id: explicitCode } : {}),
      ...(contentText ? { content: contentText } : {}),
      ...(supportingText ? { supportingContent: supportingText } : {}),
      ...(subjectStr ? { subject: subjectStr } : {}),
      ...(subtopicStr ? { subtopic: subtopicStr } : {}),
      ...(subtopicPathStr ? { subtopicPath: subtopicPathStr } : {}),
      ...(item.difficulty !== undefined && item.difficulty !== null ? { difficulty: String(item.difficulty).trim() } : {}),
      ...(item.difficulty_ids !== undefined ? { difficultyIds: item.difficulty_ids } : {}),
      ...(item.situation !== undefined ? { situation: item.situation } : {}),
      ...(item.outdated !== undefined ? { outdated: Boolean(item.outdated) } : {}),
      ...(item.has_comment !== undefined ? { hasComment: Boolean(item.has_comment) } : {}),
      ...(item.video_url || item.has_video ? { hasVideo: true } : {}),
      ...(alternatives.length > 0 ? { alternatives } : {}),
      ...(item.user_answer !== undefined && item.user_answer !== null ? { userAnswer: item.user_answer } : {}),
      ...(item.user_assurance !== undefined && item.user_assurance !== null ? { userAssurance: String(item.user_assurance).trim() } : {}),
      ...(lastStatus !== undefined && lastStatus !== null ? { lastAnswerStatus: lastStatus } : {}),
      ...(commentText ? { teacherComment: commentText, commentSource } : {}),
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

    // 1. Detectar catálogo de curso / módulos / videoaulas (ignorar rotas de simulados/turmas)
    const urlStr = String(url || '');
    const isSimuladoOrTeamUrl = /(?:practice-exam|simulado|enjoyment|ranking|\/teams\/\d+)/i.test(urlStr);

    if (
      !isSimuladoOrTeamUrl &&
      !/\/courses\/\d+/i.test(urlStr) &&
      /\/courses(?:\?|$|\/(?:me|my|student|list|catalog|categories|favorites|all)\b)/i.test(urlStr)
    ) {
      const coursesById = new Map();
      const seenObjs = new Set();
      const walkCourses = (node, depth = 0) => {
        if (!node || typeof node !== 'object' || depth > 5 || seenObjs.has(node)) return;
        seenObjs.add(node);
        if (Array.isArray(node)) {
          node.forEach((item) => walkCourses(item, depth + 1));
          return;
        }
        const isVideoObj =
          node.course_video_id !== undefined ||
          node.video_id !== undefined ||
          node.duration_seconds !== undefined ||
          node.embed_url !== undefined;
        const cId = node.id ?? node.course_id;
        const cTitle = String(node.name || node.title || '').trim();
        if (
          !isVideoObj &&
          cId !== undefined &&
          cId !== null &&
          cId !== '' &&
          cTitle &&
          !Array.isArray(node.courses) &&
          !Array.isArray(node.items)
        ) {
          coursesById.set(String(cId), { id: String(cId), name: cTitle });
        }
        for (const key of ['courses', 'items', 'favorites', 'categories', 'data', 'results']) {
          if (node[key] && typeof node[key] === 'object') {
            walkCourses(node[key], depth + 1);
          }
        }
      };
      walkCourses(root, 0);
      if (coursesById.size > 0) {
        emit('API_COURSES_LIST', { courses: Array.from(coursesById.values()) });
      }
    }

    const courseIdMatch = urlStr.match(/\/courses\/(\d+)/i) || window.location.pathname.match(/\/courses\/(\d+)/i);
    const modIdMatch = urlStr.match(/\/modules\/(\d+)/i) || window.location.pathname.match(/\/modules\/(\d+)/i);
    const modIdFromUrl = modIdMatch?.[1] || '';

    const multiModulesCandidate = isSimuladoOrTeamUrl
      ? null
      : root.modules ||
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

    const singleVideoList = isSimuladoOrTeamUrl
      ? null
      : root.videos ||
      root.course_videos ||
      (root.course_video && typeof root.course_video === 'object' ? [root.course_video] : null) ||
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
      : (!isSimuladoOrTeamUrl && !Array.isArray(root) && Array.isArray(root.submodules) && root.submodules.length > 0)
      ? [{
          id: root.id || modIdFromUrl || '0',
          name: root.name || root.title || document.querySelector('h1, h2, .text-h6')?.textContent?.trim() || 'Módulo Atual',
          submodules: root.submodules,
        }]
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
        ''
      );
      const isSingleModulePayload = Boolean(!Array.isArray(multiModulesCandidate) || Array.isArray(root));
      const courseName = isSingleModulePayload
        ? String((!Array.isArray(root) ? (root.course?.name || root.course?.title) : '') || '').trim()
        : String((!Array.isArray(root) ? (root.course?.name || root.course?.title || root.name || root.title) : '') || '').trim();
      const currentUrlVideoId = (() => {
        try {
          return new URLSearchParams(window.location.search || '').get('course_video_id') || '';
        } catch (_) {
          return '';
        }
      })();
      const parsedModules = modulesArr.map((mod) => {
        const modName = String(mod?.name || mod?.title || '').trim();
        if (!modName) return null;
        const modId = mod?.id ? String(mod.id) : modIdFromUrl;
        const moduleUrl = (courseId && modId && modId !== '0')
          ? `${window.location.origin}/courses/${courseId}/modules/${modId}/playground`
          : (courseId ? `${window.location.origin}/courses/${courseId}` : '');
        const rawItems = [
          ...(mod.videos || mod.course_videos || mod.lessons || mod.contents || mod.items || mod.course_module_videos || []),
          ...((mod.topics || mod.submodules || []).flatMap((tp) => tp?.videos || tp?.course_videos || tp?.lessons || tp?.contents || [])),
        ].filter((v) => v && typeof v === 'object');

        const idMatchesCurrentUrl = Boolean(
          currentUrlVideoId &&
          rawItems.some((v) => String(v.id || '') === currentUrlVideoId && String(v.video_id || '') !== currentUrlVideoId)
        );

        const rawLessons = [];
        const seenVids = new Set();
        const pushLesson = (v) => {
          if (!v || typeof v !== 'object') return;
          const verifiedVid = v.course_video_id
            ? String(v.course_video_id)
            : (idMatchesCurrentUrl && v.id ? String(v.id) : '');
          const title = String(v.title || v.name || v.label || '').trim();
          if (!title) return;
          const dedup = verifiedVid ? `id:${verifiedVid}` : `t:${title.toLowerCase()}`;
          if (seenVids.has(dedup)) return;
          seenVids.add(dedup);
          const hasVerifiedUrl = Boolean(courseId && verifiedVid);
          const urlPath = hasVerifiedUrl
            ? `${window.location.origin}/courses/${courseId}/modules/${modId || '0'}/playground?course_video_id=${verifiedVid}`
            : moduleUrl;
          const rawDesc = typeof v.description === 'string' ? v.description.trim() : '';
          const hasTimestampIndex = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(rawDesc);
          rawLessons.push({
            id: verifiedVid || null,
            verifiedVideoUrl: hasVerifiedUrl,
            title,
            durationMin: normalizeDurationMin(v.duration || v.duration_seconds || v.duration_minutes || v.time || v.length),
            completed: Boolean(v.completed || v.is_completed || v.watched || v.concluded || v.finished),
            url: urlPath,
            ...(hasTimestampIndex ? { rawIndexText: rawDesc.slice(0, 4000) } : {}),
          });
        };
        rawItems.forEach(pushLesson);
        if (rawLessons.length === 0 && !/\/courses\/\d+/i.test(urlStr)) return null;
        return { id: modId || null, name: modName, moduleUrl, lessons: rawLessons };
      }).filter(Boolean);

      if (parsedModules.length > 0) {
        emit('API_COURSE_CATALOG', { courseId, courseName, modules: parsedModules });
        return;
      }
    }

    // 1B. Extrator profundo de datas de tentativa/liberação e detalhamento /enjoyment
    const normalizeExtractedDate = (val, keyHint = '') => {
      if (typeof val === 'number' && Number.isFinite(val) && /(?:date|at|time|data|liber|realiz|finish|complet)/i.test(keyHint)) {
        const ms = val > 1e12 ? val : (val > 1e9 ? val * 1000 : 0);
        if (ms > 0) {
          const d = new Date(ms);
          const yr = d.getUTCFullYear();
          if (yr >= 2018 && yr <= 2035) return d.toISOString().slice(0, 10);
        }
        return null;
      }
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

    const extractSimuladoDatesDeep = (obj, urlContext = '') => {
      let attemptDate = null;
      let attemptField = null;
      let releaseDate = null;
      let releaseField = null;
      let anyDate = null;
      let anyField = null;
      const visited = new Set();
      const isAttemptEndpoint = /\/(?:enjoyment|revision|result|attempt)/i.test(String(urlContext || ''));

      const walk = (node, depth = 0, parentContext = '') => {
        if (!node || typeof node !== 'object' || depth > 6 || visited.has(node)) return;
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
          if (typeof v === 'string' || typeof v === 'number') {
            const parsed = normalizeExtractedDate(v, kl);
            if (!parsed) continue;
            const pathLabel = parentContext ? `${parentContext}.${k}` : k;
            const isAttemptKey = /(?:finish|complet|answer|submit|conclud|solv|done|realiz|execut|perform|taken|finaliz|sent|end|respon|feito|resolved)/i.test(kl)
              || (/^(?:created_at|updated_at|date|data)$/i.test(kl) && (isAttemptEndpoint || /(?:user|attempt|answer|result|enjoyment|submission|pivot|student|my_|response|revision)/i.test(parentContext)));
            const isReleaseKey = /(?:releas|liber|availab|publish|start|open|begin|schedul|applied|exam_date|data_prova)/i.test(kl)
              || (depth <= 2 && /^(?:created_at|date)$/i.test(kl));

            if (isAttemptKey && !attemptDate) {
              attemptDate = parsed;
              attemptField = pathLabel;
            } else if (isReleaseKey && !releaseDate) {
              releaseDate = parsed;
              releaseField = pathLabel;
            }
            if (!anyDate) {
              anyDate = parsed;
              anyField = pathLabel;
            }
          } else if (v && typeof v === 'object') {
            walk(v, depth + 1, parentContext ? `${parentContext}.${kl}` : kl);
          }
        }
      };

      walk(obj, 0, '');
      return { attemptDate, attemptField, releaseDate, releaseField, anyDate, anyField };
    };

    // 0B. Estatísticas da questão com IDs exatos da árvore (/skull/question-database/{id}/statistics)
    const qStatsMatch = urlStr.match(/\/question-database\/(\d+)\/statistics(?:[?#]|$)/i);
    if (qStatsMatch && root && !Array.isArray(root)) {
      const apiId = Number(qStatsMatch[1]);
      const latestHist = Array.isArray(root.history) && root.history.length > 0 ? root.history[0] : null;
      const statsObj = root.stats && typeof root.stats === 'object' ? root.stats : null;
      const commCorr = Number(statsObj?.correct ?? statsObj?.right);
      const commErr = Number(statsObj?.incorrect ?? statsObj?.wrong);
      const commTot = (Number.isFinite(commCorr) && Number.isFinite(commErr)) ? (commCorr + commErr) : 0;
      const commPct = commTot > 0 ? Math.round((commCorr / commTot) * 100) : undefined;
      emit('API_QUESTION_STATISTICS', {
        apiId: Number.isFinite(apiId) && apiId > 0 ? apiId : (Number(latestHist?.question_id) || null),
        subjectId: Number(latestHist?.subject_id) || null,
        subtopicId: Number(latestHist?.topic_id) || null,
        correctAnswer: root.correct_answer || null,
        userAnswer: latestHist?.answer || null,
        answerStatus: latestHist?.answer_status || null,
        answeredAt: latestHist?.answered_at || null,
        ...(commPct !== undefined ? { communityCorrectPct: commPct, communityErrorPct: Math.max(0, 100 - commPct) } : {}),
      });
      return;
    }

    // 0C. Desempenho real por disciplina e assunto (/skull/performance/questions/{dias}/{de}/{ate})
    if (root && !Array.isArray(root) && root.subjects_and_topics_performance && typeof root.subjects_and_topics_performance === 'object') {
      const perfMatch = urlStr.match(/\/performance\/questions\/(\d+)\/(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})/i);
      emit('API_PERFORMANCE_DATA', {
        subjectsAndTopicsPerformance: root.subjects_and_topics_performance,
        correctHistory: Array.isArray(root.correct_history) ? root.correct_history : [],
        incorrectHistory: Array.isArray(root.incorrect_history) ? root.incorrect_history : [],
        rangeDays: perfMatch ? Number(perfMatch[1]) : null,
        fromDate: perfMatch ? perfMatch[2] : null,
        toDate: perfMatch ? perfMatch[3] : null,
        capturedAt: new Date().toISOString(),
      });
      return;
    }

    const enjoyMatch = urlStr.match(/\/practice-exams?\/(\d+)\/enjoyment/i);
    if (enjoyMatch) {
      const teamIdMatch = urlStr.match(/\/teams\/(\d+)/i);
      const rawBlocks = root.blocks || root.blocos || root.groups || root.by_block || root.blocks_performance || [];
      const rawSubjects = root.subjects || root.disciplines || root.disciplinas || root.by_subject || root.disciplines_performance || [];
      const mapScoreRow = (item) => {
        const hitsVal = Number(item?.right ?? item?.hits ?? item?.correct ?? item?.correct_answers ?? item?.acertos ?? 0);
        const errorsVal = Number(item?.wrong ?? item?.errors ?? item?.wrong_answers ?? item?.erros ?? 0);
        const blankVal = Number(item?.blank ?? item?.not_answered ?? item?.em_branco ?? item?.unanswered ?? 0);
        const canceledVal = Number(item?.canceled ?? item?.anuladas ?? 0);
        const totalVal = Number(item?.count ?? item?.total ?? item?.questions_count ?? (hitsVal + errorsVal + blankVal + canceledVal));
        const netVal = item?.net_score !== undefined
          ? Number(item.net_score)
          : (item?.score !== undefined
          ? Number(item.score)
          : (item?.liquida !== undefined ? Number(item.liquida) : (hitsVal - errorsVal)));
        const rawPct = item?.enjoyment ?? item?.percentage ?? item?.accuracy ?? item?.user_percentage;
        const rawOthers = item?.others ?? item?.others_percentage ?? item?.members_percentage ?? item?.average_others;
        const pctVal = rawPct !== undefined ? Math.round(Number(rawPct)) : (totalVal > 0 ? Math.round((hitsVal / totalVal) * 100) : 0);
        const othersNum = rawOthers !== undefined && rawOthers !== null && rawOthers !== '' ? Number(rawOthers) : undefined;
        const subjectIdVal = Number(item?.id);
        return {
          ...(Number.isFinite(subjectIdVal) && subjectIdVal > 0 ? { subjectId: subjectIdVal } : {}),
          name: String(item?.name || item?.title || item?.subject || item?.discipline || '').trim(),
          hits: hitsVal,
          errors: errorsVal,
          blank: blankVal,
          ...(canceledVal > 0 ? { canceled: canceledVal } : {}),
          total: totalVal,
          liquida: netVal,
          pct: pctVal,
          ...(Number.isFinite(othersNum) ? { othersPct: Math.round(othersNum * 100) / 100 } : {}),
        };
      };
      const blocks = (Array.isArray(rawBlocks) ? rawBlocks : []).map(mapScoreRow).filter((r) => r.name);
      const subjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map(mapScoreRow).filter((r) => r.name);
      let aggHits = 0; let aggErrors = 0; let aggBlank = 0; let aggCanceled = 0; let aggTotal = 0; let aggLiquida = 0;
      subjects.forEach((s) => {
        aggHits += s.hits || 0;
        aggErrors += s.errors || 0;
        aggBlank += s.blank || 0;
        aggCanceled += s.canceled || 0;
        aggTotal += s.total || 0;
        aggLiquida += s.liquida !== undefined ? s.liquida : ((s.hits || 0) - (s.errors || 0));
      });
      const dates = extractSimuladoDatesDeep(root, urlStr);
      if (blocks.length > 0 || subjects.length > 0 || dates.attemptDate || dates.releaseDate || dates.anyDate) {
        emit('API_SIMULADO_ENJOYMENT', {
          caveiraId: `sim_${enjoyMatch[1]}`,
          examId: enjoyMatch[1],
          ...(teamIdMatch?.[1] ? { teamId: teamIdMatch[1] } : {}),
          blocks,
          subjects,
          ...(subjects.length > 0 ? {
            hits: aggHits,
            errors: aggErrors,
            blank: aggBlank,
            canceled: aggCanceled,
            total: aggTotal,
            liquida: aggLiquida,
            pct: aggTotal > 0 ? Math.round((aggHits / aggTotal) * 100) : 0,
          } : {}),
          attemptDate: dates.attemptDate,
          releaseDate: dates.releaseDate,
          anyDate: dates.anyDate,
          dateField: dates.attemptField || dates.releaseField || dates.anyField || null,
        });
        return;
      }
    }

    const examDatesMatch = urlStr.match(/\/practice-exams?\/(\d+)(?:\/questions\/revision)?(?:[?#]|$)/i);
    if (examDatesMatch && !/\/(?:ranking|rankings|leaderboard)/i.test(urlStr)) {
      const pe = root.practice_exam && typeof root.practice_exam === 'object' ? root.practice_exam : root;
      const dates = extractSimuladoDatesDeep(root, urlStr);
      const numQ = Number(pe?.number_questions || pe?.total_questions);
      if (dates.attemptDate || dates.releaseDate || dates.anyDate || pe?.title) {
        emit('API_SIMULADO_DATES', {
          examId: examDatesMatch[1],
          caveiraId: `sim_${examDatesMatch[1]}`,
          ...(pe?.title ? { title: String(pe.title).trim() } : {}),
          ...(Number.isFinite(numQ) && numQ > 0 ? { numberQuestions: numQ } : {}),
          ...(pe?.total_points !== undefined ? { totalPoints: Number(pe.total_points) } : {}),
          ...(pe?.performance_released !== undefined ? { performanceReleased: Boolean(pe.performance_released) } : {}),
          attemptDate: dates.attemptDate,
          releaseDate: dates.releaseDate,
          anyDate: dates.anyDate,
          dateField: dates.attemptField || dates.releaseField || dates.anyField || null,
        });
      }
    }

    const teamOverviewMatch = urlStr.match(/\/teams\/(\d+)(?:[?#]|$)/i);
    if (teamOverviewMatch) {
      const teamSimsRaw = root.practice_exams || root.exams || root.simulados || root.team?.practice_exams || (Array.isArray(root) ? root : []);
      if (Array.isArray(teamSimsRaw) && teamSimsRaw.length > 0) {
        const batchItems = teamSimsRaw.map((simObj) => {
          if (!simObj || typeof simObj !== 'object') return null;
          const d = extractSimuladoDatesDeep(simObj, urlStr);
          const tName = String(simObj.title || simObj.name || simObj.exam_name || '').trim();
          const eId = simObj.id ? String(simObj.id) : null;
          const numQ = Number(simObj.number_questions || simObj.total_questions);
          if (!tName && !eId) return null;
          if (!d.attemptDate && !d.releaseDate && !d.anyDate && !(Number.isFinite(numQ) && numQ > 0)) return null;
          return {
            examId: eId,
            title: tName,
            ...(Number.isFinite(numQ) && numQ > 0 ? { numberQuestions: numQ } : {}),
            ...(simObj.total_points !== undefined ? { totalPoints: Number(simObj.total_points) } : {}),
            ...(simObj.performance_released !== undefined ? { performanceReleased: Boolean(simObj.performance_released) } : {}),
            attemptDate: d.attemptDate,
            releaseDate: d.releaseDate,
            anyDate: d.anyDate,
            dateField: d.attemptField || d.releaseField || d.anyField || null,
          };
        }).filter(Boolean);
        if (batchItems.length > 0) {
          emit('API_SIMULADO_DATES_BATCH', { teamId: teamOverviewMatch[1], items: batchItems });
        }
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

    const hasSimMetrics = (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      const resObj = obj.result || obj.summary || obj.stats || obj.metrics || obj.enjoyment || obj.performance || {};
      return Boolean(
        obj.right !== undefined ||
        obj.wrong !== undefined ||
        obj.hits !== undefined ||
        obj.correct_answers !== undefined ||
        obj.net_score !== undefined ||
        obj.score !== undefined ||
        resObj.right !== undefined ||
        resObj.wrong !== undefined ||
        resObj.hits !== undefined ||
        resObj.correct !== undefined ||
        resObj.correct_answers !== undefined ||
        resObj.net_score !== undefined ||
        resObj.score !== undefined ||
        Array.isArray(obj.subjects) ||
        Array.isArray(obj.disciplines)
      );
    };

    const singlePersonalWrapper = (!Array.isArray(root) && [
      root.practice_exam,
      root.exam,
      root.my_result,
      root.user_result,
      root.attempt,
      root.result,
    ].find((obj) => hasSimMetrics(obj))) || null;

    let simArr = isRankingUrl
      ? null
      : Array.isArray(root.practice_exams)
      ? root.practice_exams
      : Array.isArray(root.exams)
      ? root.exams
      : (Array.isArray(root) && root[0] && hasSimMetrics(root[0]) && !root[0].alternatives)
      ? root
      : singlePersonalWrapper
      ? [singlePersonalWrapper]
      : (/practice-exam|team|simulado/i.test(urlStr) && !Array.isArray(root) && hasSimMetrics(root))
      ? [root]
      : null;

    if (diagnosticMode && /(?:practice-exam|simulado|enjoyment|ranking|\/teams\/)/i.test(urlStr)) {
      emitDiagnosticShape('simulado_api_response', urlStr, {
        isRankingUrl,
        matchedCount: Array.isArray(simArr) ? simArr.length : 0,
        shape: summarizeShape(root),
      });
    }

    const isArrayPayload = Array.isArray(simArr) && (simArr === root || simArr === root.practice_exams || simArr === root.exams || simArr.length > 1);
    if (simArr && simArr.length > 1) {
      const distinctUsers = new Set(simArr.map((x) => x?.user_id ?? x?.student_id ?? x?.participant_id).filter(Boolean));
      if (distinctUsers.size > 1) {
        simArr = null;
      }
    }

    const pickNum = (vals) => {
      for (const v of vals) {
        if (v === undefined || v === null || v === '') continue;
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
      return null;
    };

    if (simArr && simArr.length > 0) {
      const normalizedSims = simArr.map((sim) => {
        if (!sim || typeof sim !== 'object' || looksLikeRankingRow(sim, isArrayPayload)) return null;
        const nestedRes = (sim.result && typeof sim.result === 'object') ? sim.result
          : (sim.summary && typeof sim.summary === 'object') ? sim.summary
          : (sim.stats && typeof sim.stats === 'object') ? sim.stats
          : (sim.enjoyment && typeof sim.enjoyment === 'object') ? sim.enjoyment
          : {};
        const nestedExam = (sim.practice_exam && typeof sim.practice_exam === 'object') ? sim.practice_exam
          : (sim.exam && typeof sim.exam === 'object') ? sim.exam
          : {};

        const estimatedFields = [];
        const estimatedReasons = [];

        const hitsRaw = pickNum([sim.right, sim.hits, sim.correct_answers, sim.correct, nestedRes.right, nestedRes.hits, nestedRes.correct, nestedRes.correct_answers, nestedRes.acertos]);
        const errorsRaw = pickNum([sim.wrong, sim.errors, sim.wrong_answers, nestedRes.wrong, nestedRes.errors, nestedRes.wrong_answers, nestedRes.erros]);
        const blankRaw = pickNum([sim.blank, sim.not_answered, sim.unanswered, nestedRes.blank, nestedRes.not_answered, nestedRes.unanswered]);
        const canceledRaw = pickNum([sim.canceled, nestedRes.canceled]);
        const liquidaRaw = pickNum([sim.net_score, sim.score, sim.liquida, nestedRes.net_score, nestedRes.score, nestedRes.liquida]);
        const totalRaw = pickNum([sim.number_questions, sim.total_questions, sim.questions_count, sim.count, sim.total, nestedExam.number_questions, nestedExam.total_questions, nestedExam.questions_count, nestedRes.number_questions, nestedRes.total_questions, nestedRes.questions_count, nestedRes.count, nestedRes.total]);
        const pctRaw = pickNum([sim.percentage, sim.accuracy, sim.user_percentage, nestedRes.enjoyment, nestedRes.percentage, nestedRes.accuracy]);

        if (hitsRaw === null && errorsRaw === null && liquidaRaw === null) {
          return null;
        }

        let total = totalRaw !== null && totalRaw > 0 ? totalRaw : null;
        if (total === null && hitsRaw !== null && errorsRaw !== null) {
          total = hitsRaw + errorsRaw + (blankRaw ?? 0);
          estimatedFields.push('total');
          estimatedReasons.push('total somado a partir de acertos + erros + brancos');
        } else if (total === null) {
          estimatedFields.push('total');
          estimatedReasons.push('total_questions ausente na resposta da API (não inventado)');
        }

        let hits = hitsRaw;
        let errors = errorsRaw;
        if (hits === null) {
          estimatedFields.push('hits');
          estimatedReasons.push('hits ausente na resposta da API');
        }
        if (errors === null) {
          if (hits !== null && liquidaRaw !== null) {
            errors = Math.max(0, hits - liquidaRaw);
            estimatedFields.push('errors');
            estimatedReasons.push('errors inferido de hits - líquida');
          } else {
            estimatedFields.push('errors');
            estimatedReasons.push('errors ausente na resposta da API');
          }
        }

        let liquida = liquidaRaw;
        if (liquida === null && hits !== null && errors !== null) {
          liquida = hits - errors;
          estimatedFields.push('liquida');
          estimatedReasons.push('liquida calculada por hits - errors');
        }

        let pct = pctRaw !== null ? Math.round(pctRaw) : null;
        if (pct === null && hits !== null && total !== null && total > 0) {
          pct = Math.round((hits / total) * 100);
          estimatedFields.push('pct');
          estimatedReasons.push('pct calculado por hits / total');
        }

        const { attemptDate, attemptField, releaseDate, releaseField, anyDate, anyField } = extractSimuladoDatesDeep(sim, urlStr);
        const rawDate = String(sim.finished_at || sim.completed_at || sim.answered_at || sim.created_at || sim.date || nestedRes.finished_at || '').slice(0, 10);
        const resolvedDate = attemptDate || releaseDate || anyDate || (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : undefined);
        const dateSource = attemptDate ? 'attempt' : (releaseDate ? 'release' : (anyDate ? 'api_date' : undefined));
        const dateField = attemptField || releaseField || anyField || null;
        const rawSubs = sim.subjects || sim.disciplines || nestedRes.subjects || nestedRes.disciplines;
        const subjectScores = Array.isArray(rawSubs)
          ? rawSubs.map((s) => {
              const sId = Number(s?.id);
              const sH = pickNum([s?.right, s?.hits, s?.correct, s?.acertos]) ?? 0;
              const sE = pickNum([s?.wrong, s?.errors, s?.erros]) ?? 0;
              const sB = pickNum([s?.blank, s?.not_answered]) ?? 0;
              const sCanc = pickNum([s?.canceled]) ?? 0;
              const sTot = pickNum([s?.count, s?.total, s?.questions_count]) ?? (sH + sE + sB + sCanc);
              const sLiq = pickNum([s?.net_score, s?.score, s?.liquida]);
              const sOthers = pickNum([s?.others, s?.others_percentage, s?.members_percentage]);
              return {
                ...(Number.isFinite(sId) && sId > 0 ? { subjectId: sId } : {}),
                name: String(s?.name || s?.subject || s?.discipline || '').trim(),
                hits: sH,
                errors: sE,
                blank: sB,
                ...(sCanc > 0 ? { canceled: sCanc } : {}),
                total: sTot,
                liquida: sLiq !== null ? sLiq : (sH - sE),
                ...(sOthers !== null ? { othersPct: Math.round(sOthers * 100) / 100 } : {}),
              };
            }).filter((s) => s.name)
          : [];
        const title = String(
          sim.title ||
          sim.exam_name ||
          nestedExam.title ||
          nestedExam.name ||
          sim.name ||
          'Simulado Caveira'
        ).trim();
        const examIdVal = sim.id || sim.practice_exam_id || nestedExam.id || null;
        return {
          caveiraId: examIdVal ? `sim_${examIdVal}` : undefined,
          title,
          data: resolvedDate,
          ...(dateSource ? { dateSource } : {}),
          ...(dateField ? { dateField } : {}),
          ...(releaseDate ? { releasedAt: releaseDate } : {}),
          dataSource: 'api',
          estimated: estimatedFields.length > 0,
          ...(estimatedFields.length > 0 ? { estimatedFields, estimatedReason: estimatedReasons.join('; ') } : {}),
          ...(total !== null ? { total } : {}),
          ...(hits !== null ? { hits } : {}),
          ...(errors !== null ? { errors } : {}),
          ...(blankRaw !== null ? { blank: blankRaw } : {}),
          ...(canceledRaw !== null && canceledRaw > 0 ? { canceled: canceledRaw } : {}),
          ...(pct !== null ? { pct } : {}),
          ...(liquida !== null ? { liquida } : {}),
          subjectScores,
        };
      }).filter(Boolean);

      if (normalizedSims.length > 0) {
        emit('API_SIMULADOS_DATA', { simulados: normalizedSims });
        return;
      }
    }

    // 3. Detectar questão isolada ou lista de questões (ignora endpoints não-questão)
    if (/(?:^|\/)(?:courses|teams|notifications|auth|me|subjects|subtopics)(?:\/|\?|$)/i.test(urlStr)) {
      return;
    }
    const candidates = Array.isArray(root)
      ? root
      : Array.isArray(root.data)
      ? root.data
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

  function inspectAnswerMutation(method, reqUrl, reqBody, resJson) {
    const m = String(method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH'].includes(m)) return;
    const urlStr = String(reqUrl || '');
    const root = (resJson?.data && typeof resJson.data === 'object') ? resJson.data : (resJson || {});
    let parsedReq = null;
    try {
      if (typeof reqBody === 'string' && (reqBody.trim().startsWith('{') || reqBody.trim().startsWith('['))) {
        parsedReq = JSON.parse(reqBody);
      } else if (reqBody && typeof reqBody === 'object' && !(reqBody instanceof FormData)) {
        parsedReq = reqBody;
      }
    } catch (_) {}

    const hasField = (v) => v !== undefined && v !== null;
    const parseBoolVal = (v) => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v === 1;
      const s = String(v ?? '').trim().toLowerCase();
      if (/^(?:true|1|correct|hit|acerto|acertou)$/.test(s)) return true;
      if (/^(?:false|0|wrong|incorrect|error|erro|errou)$/.test(s)) return false;
      return Boolean(v);
    };

    const urlQuestionIdMatch = urlStr.match(/\/question-database\/(\d+)(?:[?#]|$)/i);
    const recognizedAnswer = Boolean(
      /(?:question|answer|resol|respond|attempt|alternative)/i.test(urlStr) &&
      (hasField(root?.answer_status) || hasField(root?.is_correct) || hasField(root?.correct) || hasField(root?.hit) || hasField(root?.acertou))
    );
    if (recognizedAnswer) {
      const qApiId = Number(urlQuestionIdMatch?.[1] || root.question_id || root.id || parsedReq?.question_id || parsedReq?.id);
      const hitVal = hasField(root.answer_status)
        ? /^(?:correct|hit|acerto|acertou|1|true)$/i.test(String(root.answer_status))
        : (hasField(root.is_correct)
            ? parseBoolVal(root.is_correct)
            : (hasField(root.correct)
                ? parseBoolVal(root.correct)
                : parseBoolVal(hasField(root.hit) ? root.hit : root.acertou)));
      const genStats = root.general_stats && typeof root.general_stats === 'object' ? root.general_stats : null;
      const gCorr = Number(genStats?.correct);
      const gErr = Number(genStats?.incorrect);
      const gTot = (Number.isFinite(gCorr) && Number.isFinite(gErr)) ? (gCorr + gErr) : 0;
      const commPct = gTot > 0 ? Math.round((gCorr / gTot) * 100) : undefined;
      emit('API_ANSWER_SUBMITTED', {
        apiId: Number.isFinite(qApiId) && qApiId > 0 ? qApiId : null,
        hit: hitVal,
        answerStatus: root.answer_status ?? null,
        userAnswer: parsedReq?.answer ?? parsedReq?.alternative ?? root?.user_answer ?? null,
        correctAnswer: root.correct_answer ?? null,
        ...(genStats ? { generalStats: genStats } : {}),
        ...(commPct !== undefined ? { communityCorrectPct: commPct, communityErrorPct: Math.max(0, 100 - commPct) } : {}),
        url: safeUrlPath(urlStr),
      });
      return;
    }

    if (diagnosticMode) {
      emitDiagnosticShape('unrecognized_mutation', urlStr, {
        method: m,
        reqShape: parsedReq ? summarizeShape(parsedReq) : (reqBody ? typeof reqBody : 'empty'),
        resShape: resJson ? summarizeShape(resJson) : 'non-json',
      });
    }
  }

  const shouldInspectUrl = (urlStr) => {
    const s = String(urlStr || '').toLowerCase();
    if (!s || /\.(png|jpg|jpeg|svg|webp|woff2?|css|js|mp4|m3u8|ts)(\?|$)/.test(s)) return false;
    return s.includes('caveira') || s.startsWith('/') || s.includes('/api/');
  };

  // Wrapper passivo de fetch (somente leitura de respostas JSON; zero leitura de Authorization)
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function (...args) {
      const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const reqMethod = String(args[1]?.method || args[0]?.method || 'GET').toUpperCase();
      const reqBody = args[1]?.body;
      const promise = origFetch.apply(this, args);
      if (shouldInspectUrl(reqUrl)) {
        promise.then((res) => {
          try {
            if (!res || !res.ok) return;
            const ct = res.headers?.get('content-type') || '';
            if (!ct.includes('json')) {
              if (['POST', 'PUT', 'PATCH'].includes(reqMethod)) {
                inspectAnswerMutation(reqMethod, reqUrl, reqBody, null);
              }
              return;
            }
            res.clone().json().then((json) => {
              inspectApiPayload(reqUrl, json);
              if (['POST', 'PUT', 'PATCH'].includes(reqMethod)) {
                inspectAnswerMutation(reqMethod, reqUrl, reqBody, json);
              }
            }).catch(() => {});
          } catch (_) {}
        }).catch(() => {});
      }
      return promise;
    };
  }

  // Wrapper passivo de XMLHttpRequest (suporta responseType === 'json' usado por Axios/Quasar!)
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__qgMethod = String(method || 'GET').toUpperCase();
    this.__qgUrl = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (body, ...rest) {
    const reqMethod = this.__qgMethod || 'GET';
    if (shouldInspectUrl(this.__qgUrl)) {
      this.addEventListener('load', () => {
        if (this.status < 200 || this.status >= 300) return;
        try {
          let json = null;
          if ((this.responseType === 'json' || !this.responseType) && this.response && typeof this.response === 'object') {
            json = this.response;
          } else if (!this.responseType || this.responseType === 'text') {
            const ct = this.getResponseHeader('content-type') || '';
            const txt = typeof this.responseText === 'string' ? this.responseText.trim() : '';
            if ((ct.includes('json') || txt.startsWith('{') || txt.startsWith('[')) && (txt.startsWith('{') || txt.startsWith('['))) {
              json = JSON.parse(txt);
            }
          }
          if (json) {
            inspectApiPayload(this.__qgUrl, json);
          }
          if (['POST', 'PUT', 'PATCH'].includes(reqMethod)) {
            inspectAnswerMutation(reqMethod, this.__qgUrl, body, json);
          }
        } catch (_) {}
      }, { once: true });
    }
    return origSend.call(this, body, ...rest);
  };
})();
