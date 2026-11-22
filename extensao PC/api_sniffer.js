(() => {
  // extensao-src/tree/dynamicTreeManager.js
  function extractTreeNodesFromApiJson(url = "", data = null) {
    if (!data || typeof data !== "object") return [];
    const lowerUrl = String(url || "").toLowerCase();
    if (lowerUrl && !/(subject|discipline|topic|subtopic|filter|tree|category)/i.test(lowerUrl)) {
      return [];
    }
    const root = data.data && typeof data.data === "object" ? data.data : data;
    const rows = [];
    const seenKeys = /* @__PURE__ */ new Set();
    const pushNode = (subjectId, subjectName, node, parentId, depth, pathPrefix) => {
      if (!node || typeof node !== "object") return;
      const nodeId = Number(node.id ?? node.subtopic_id ?? node.topic_id);
      const name = String(node.name ?? node.title ?? node.label ?? "").trim();
      if (!Number.isFinite(nodeId) || nodeId <= 0 || !name) return;
      const sId = Number(subjectId || node.subject_id || node.discipline_id || nodeId);
      const pId = Number(node.parent_id ?? node.parentId ?? parentId ?? sId);
      const path = [...pathPrefix, nodeId];
      const key = `${sId}:${nodeId}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        rows.push({
          subjectId: sId,
          subjectName: String(subjectName || "").trim(),
          nodeId,
          parentId: pId,
          depth,
          name,
          path
        });
      }
      const nested = node.children || node.subtopics || node.topics || node.items || [];
      if (Array.isArray(nested)) {
        nested.forEach((ch) => pushNode(sId, subjectName, ch, nodeId, depth + 1, path));
      }
    };
    const subjMatch = lowerUrl.match(/subject[_-]?id[s]?=(\d+)/i) || lowerUrl.match(/\/subjects\/(\d+)/i);
    const urlSubjectId = subjMatch ? Number(subjMatch[1]) : null;
    const list = Array.isArray(root) ? root : Array.isArray(root.subjects) ? root.subjects : Array.isArray(root.disciplines) ? root.disciplines : Array.isArray(root.subtopics) ? root.subtopics : Array.isArray(root.topics) ? root.topics : root.id && (root.subtopics || root.topics || root.children) ? [root] : [];
    list.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const hasChildrenTree = Array.isArray(item.subtopics || item.topics || item.children);
      const looksLikeSubject = hasChildrenTree || Boolean(item.discipline_id === void 0 && !item.subject_id && /subject|discipline/i.test(lowerUrl));
      if (looksLikeSubject) {
        const sId = Number(item.id || item.subject_id);
        const sName = String(item.name || item.title || "").trim();
        const children = item.subtopics || item.topics || item.children || [];
        if (Number.isFinite(sId) && sId > 0 && Array.isArray(children)) {
          children.forEach((ch) => pushNode(sId, sName, ch, sId, 1, [sId]));
        }
      } else if (urlSubjectId || item.subject_id || item.discipline_id) {
        const sId = Number(item.subject_id || item.discipline_id || urlSubjectId);
        const sName = String(item.subject_name || item.subjectName || "").trim();
        if (Number.isFinite(sId) && sId > 0) {
          pushNode(sId, sName, item, item.parent_id || sId, 1, [sId]);
        }
      }
    });
    return rows;
  }

  // extensao-src/entries/api_sniffer.entry.js
  (function() {
    if (window.__qgCaveiraApiSnifferInstalled) return;
    window.__qgCaveiraApiSnifferInstalled = true;
    const replayBuffer = [];
    const MAX_BUFFER = 80;
    let cachedApiAuthHeader = "";
    let channelNonce = null;
    let allowNextNonceInit = true;
    let diagnosticMode = false;
    const SENSITIVE_KEY_RX = /(?:token|auth|cookie|password|passwd|secret|jwt|bearer|authorization|refresh_token|access_token|apikey|api_key|email|cpf|phone)/i;
    const JWT_RX = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]+)?/g;
    function safeUrlPath(rawUrl) {
      try {
        const u = new URL(String(rawUrl || ""), window.location.origin);
        return `${u.origin}${u.pathname}`;
      } catch (_) {
        return String(rawUrl || "").split("?")[0].slice(0, 140);
      }
    }
    function summarizeShape(val, depth = 0, keyHint = "") {
      if (keyHint && SENSITIVE_KEY_RX.test(keyHint)) return "[REDACTED]";
      if (depth > 4) return "[depth-limit]";
      if (val === null) return "null";
      if (val === void 0) return "undefined";
      const t = typeof val;
      if (t === "boolean" || t === "number") return `${t}:${val}`;
      if (t === "string") {
        const cleaned = val.replace(JWT_RX, "[REDACTED_JWT]");
        const preview = cleaned.slice(0, 36).replace(/\s+/g, " ");
        return `string(${val.length}): "${preview}${cleaned.length > 36 ? "..." : ""}"`;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) return "array(0)";
        return [`array(${val.length})`, summarizeShape(val[0], depth + 1, keyHint)];
      }
      if (t === "object") {
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
    function readFallbackAuthHeader() {
      if (cachedApiAuthHeader) return cachedApiAuthHeader;
      try {
        const storages = [window.localStorage, window.sessionStorage];
        for (const st of storages) {
          if (!st) continue;
          for (let i = 0; i < st.length; i += 1) {
            const k = st.key(i);
            if (!k || !/(?:token|auth|jwt|access)/i.test(k)) continue;
            const raw = st.getItem(k) || "";
            const m = raw.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/);
            if (m) return `Bearer ${m[0]}`;
          }
        }
      } catch (_) {
      }
      return "";
    }
    function postVerifiedMessage(type, payload) {
      if (!channelNonce) return;
      try {
        window.postMessage(
          { source: "QG_CAVEIRA_API_SNIFFER", nonce: channelNonce, type, payload },
          window.location.origin
        );
      } catch (_) {
      }
    }
    function emit(type, payload) {
      try {
        if (type === "API_COURSE_CATALOG" && payload && Array.isArray(payload.modules)) {
          const idx = replayBuffer.findIndex(
            (item) => item.type === "API_COURSE_CATALOG" && item.payload?.courseId === payload.courseId && item.payload.modules?.map((m) => m.name).join("|") === payload.modules.map((m) => m.name).join("|")
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
        postVerifiedMessage(type, payload);
      } catch (_) {
      }
    }
    function emitDiagnosticShape(kind, url, extra = {}) {
      if (!diagnosticMode) return;
      postVerifiedMessage("API_DIAGNOSTIC_SHAPE", {
        at: (/* @__PURE__ */ new Date()).toISOString(),
        kind,
        url: safeUrlPath(url),
        ...extra
      });
    }
    window.addEventListener("qg-caveira-teardown", () => {
      allowNextNonceInit = true;
      channelNonce = null;
    });
    window.addEventListener("qg-caveira-sniffer-init", (ev) => {
      const detail = ev?.detail;
      if (!detail || typeof detail.nonce !== "string" || detail.nonce.length < 16) return;
      if (!allowNextNonceInit && channelNonce && detail.nonce !== channelNonce) return;
      const isFreshInit = allowNextNonceInit || !channelNonce;
      channelNonce = detail.nonce;
      allowNextNonceInit = false;
      if (typeof detail.diagnosticMode === "boolean") {
        diagnosticMode = detail.diagnosticMode;
      }
      if (isFreshInit) {
        replayBuffer.forEach((item) => postVerifiedMessage(item.type, item.payload));
      }
    });
    window.addEventListener("message", (ev) => {
      if (ev.source !== window || ev.origin !== window.location.origin || ev.data?.source !== "QG_CAVEIRA_CONTENT" || !channelNonce || ev.data?.nonce !== channelNonce) {
        return;
      }
      if (ev.data.type === "REQUEST_SNIFFER_REPLAY") {
        replayBuffer.forEach((item) => postVerifiedMessage(item.type, item.payload));
        return;
      }
      if (ev.data.type === "SET_DIAGNOSTIC_MODE") {
        diagnosticMode = Boolean(ev.data.payload?.enabled);
      }
    });
    function stripHtml(raw) {
      if (!raw || typeof raw !== "string") return "";
      return raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }
    function normalizeQuestionNode(item) {
      if (!item || typeof item !== "object") return null;
      const numericId = Number(item.id);
      const apiId = Number.isFinite(numericId) && numericId > 0 ? numericId : null;
      const rawExplicitCode = String(item.code || item.question_code || "").trim();
      const explicitCode = rawExplicitCode ? rawExplicitCode.toUpperCase().startsWith("Q") ? rawExplicitCode.toUpperCase() : `Q${rawExplicitCode}` : null;
      const contentText = stripHtml(item.content || item.enunciado || item.statement || item.question || "").slice(0, 2500);
      const supportingText = stripHtml(item.supporting_content || item.supportingContent || "").slice(0, 1500);
      const subjectStr = String(
        item.subject?.name || item.subject?.title || (typeof item.subject === "string" ? item.subject : "") || item.discipline?.name || (typeof item.discipline === "string" ? item.discipline : "") || ""
      ).trim();
      const subtopicStr = String(
        item.subtopic?.name || item.subtopic?.title || (typeof item.subtopic === "string" ? item.subtopic : "") || item.topic?.name || (typeof item.topic === "string" ? item.topic : "") || ""
      ).trim();
      const subtopicPathStr = String(item.subtopic_path || item.subtopicPath || "").trim();
      if (!apiId && !explicitCode && !contentText && !subtopicPathStr) {
        return null;
      }
      const teacherRaw = item.teacher_comment || item.teacherComment || item.comentario_professor || item.comment_teacher || item.gabarito_comentado || "";
      const charlieRaw = item.charlie_comment || item.charlie || item.ai_explanation || "";
      const commentText = stripHtml(typeof teacherRaw === "string" ? teacherRaw : teacherRaw?.text || teacherRaw?.content || "") || stripHtml(typeof charlieRaw === "string" ? charlieRaw : charlieRaw?.text || charlieRaw?.content || "");
      const commentSource = teacherRaw ? "professor" : charlieRaw ? "charlie" : "";
      const stats = item.statistics || item.stats || item.estatisticas || {};
      let corrPct = Number(stats.correct_percentage ?? stats.hits_percentage ?? item.correct_percentage ?? item.hits_percentage);
      if (!Number.isFinite(corrPct)) {
        const tot = Number(stats.total ?? stats.answered ?? item.total_answers);
        const hits = Number(stats.hits ?? stats.correct ?? item.correct_answers);
        if (Number.isFinite(tot) && tot > 0 && Number.isFinite(hits) && hits >= 0) {
          corrPct = Math.round(hits / tot * 100);
        }
      }
      const hasPct = Number.isFinite(corrPct) && corrPct >= 0 && corrPct <= 100;
      const noteRaw = item.user_note || item.userNote || item.note || item.anotacao || "";
      const banca = String(
        item.examining_board?.name || (typeof item.examining_board === "string" ? item.examining_board : "") || item.board?.name || item.banca?.name || item.banca || ""
      ).trim();
      const ano = item.year !== void 0 && item.year !== null ? String(item.year).trim() : String(item.ano || "").trim();
      const alternatives = Array.isArray(item.alternatives) ? item.alternatives.map((alt) => ({
        answer: alt?.answer ?? alt?.letter ?? "",
        letter: String(alt?.letter ?? alt?.answer ?? "").trim(),
        text: stripHtml(alt?.content || alt?.text || "").slice(0, 800),
        ...alt?.is_correct !== void 0 ? { isCorrect: Boolean(alt.is_correct) } : {}
      })).filter((a) => a.letter || a.text) : [];
      const lastStatus = item.last_answer_status !== void 0 ? item.last_answer_status : item.lastAnswerStatus ?? null;
      if (diagnosticMode && lastStatus !== null && lastStatus !== void 0 && typeof lastStatus !== "boolean" && !/^(?:correct|wrong|incorrect|hit|error|acerto|erro|acertou|errou|0|1|true|false)$/i.test(String(lastStatus))) {
        emitDiagnosticShape("unknown_answer_status", window.location.pathname, {
          apiId,
          rawType: typeof lastStatus,
          preview: String(lastStatus).slice(0, 60)
        });
      }
      if (!apiId && !explicitCode && !commentText && !hasPct && !noteRaw && !banca && !ano && !subjectStr && !subtopicPathStr) {
        return null;
      }
      return {
        ...apiId ? { apiId } : {},
        ...explicitCode ? { code: explicitCode, id: explicitCode } : {},
        ...contentText ? { content: contentText } : {},
        ...supportingText ? { supportingContent: supportingText } : {},
        ...subjectStr ? { subject: subjectStr } : {},
        ...subtopicStr ? { subtopic: subtopicStr } : {},
        ...subtopicPathStr ? { subtopicPath: subtopicPathStr } : {},
        ...item.difficulty !== void 0 && item.difficulty !== null ? { difficulty: String(item.difficulty).trim() } : {},
        ...item.difficulty_ids !== void 0 ? { difficultyIds: item.difficulty_ids } : {},
        ...item.situation !== void 0 ? { situation: item.situation } : {},
        ...item.outdated !== void 0 ? { outdated: Boolean(item.outdated) } : {},
        ...item.has_comment !== void 0 ? { hasComment: Boolean(item.has_comment) } : {},
        ...item.video_url ? { videoUrl: String(item.video_url).trim() } : {},
        ...alternatives.length > 0 ? { alternatives } : {},
        ...item.user_answer !== void 0 && item.user_answer !== null ? { userAnswer: item.user_answer } : {},
        ...lastStatus !== void 0 && lastStatus !== null ? { lastAnswerStatus: lastStatus } : {},
        ...commentText ? { teacherComment: commentText, commentSource } : {},
        ...hasPct ? { communityCorrectPct: Math.round(corrPct), communityErrorPct: Math.max(0, 100 - Math.round(corrPct)) } : {},
        ...noteRaw ? { userNote: stripHtml(String(noteRaw)).slice(0, 1e3) } : {},
        ...banca ? { banca } : {},
        ...ano ? { ano } : {}
      };
    }
    function normalizeDurationMin(val) {
      if (!val) return 0;
      if (typeof val === "number") {
        return val > 300 ? Math.max(1, Math.round(val / 60)) : Math.max(1, Math.round(val));
      }
      const str = String(val).trim();
      const m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (m) {
        if (m[3] !== void 0) return Math.round(Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60);
        return Math.max(1, Math.round(Number(m[1]) + Number(m[2]) / 60));
      }
      return Math.max(0, Math.round(Number(str) || 0));
    }
    function inspectApiPayload(url, data) {
      if (!data || typeof data !== "object") return;
      const root = data.data && typeof data.data === "object" ? data.data : data;
      const treeRows = extractTreeNodesFromApiJson(url, data);
      if (treeRows.length > 0) {
        emit("API_SUBJECT_TREE_DATA", { nodes: treeRows });
      }
      const urlStr = String(url || "");
      const isSimuladoOrTeamUrl = /(?:practice-exam|simulado|enjoyment|ranking|\/teams\/\d+)/i.test(urlStr);
      const courseIdMatch = urlStr.match(/\/courses\/(\d+)/i) || window.location.pathname.match(/\/courses\/(\d+)/i);
      const modIdMatch = urlStr.match(/\/modules\/(\d+)/i) || window.location.pathname.match(/\/modules\/(\d+)/i);
      const modIdFromUrl = modIdMatch?.[1] || "";
      const multiModulesCandidate = isSimuladoOrTeamUrl ? null : root.modules || root.course_modules || root.course?.modules || root.disciplines || root.subjects || root.sections || (Array.isArray(root) && root[0] && (root[0].videos || root[0].course_videos || root[0].lessons || root[0].contents || root[0].items || root[0].topics || root[0].submodules || root[0].course_module_videos || /\/courses\/\d+\/modules/i.test(urlStr) && root[0].id && (root[0].name || root[0].title)) ? root : null);
      const singleVideoList = isSimuladoOrTeamUrl ? null : root.videos || root.course_videos || root.lessons || root.contents || root.course_module_videos || (Array.isArray(root) && root[0] && (root[0].course_video_id !== void 0 || root[0].video_id !== void 0 || root[0].vimeo_id !== void 0 || root[0].bunny_id !== void 0 || root[0].embed_url !== void 0 || root[0].duration_seconds !== void 0) ? root : null);
      const modulesArr = Array.isArray(multiModulesCandidate) && multiModulesCandidate.length > 0 ? multiModulesCandidate : Array.isArray(singleVideoList) && singleVideoList.length > 0 ? [{
        id: !Array.isArray(root) && root.id ? root.id : modIdFromUrl || "0",
        name: (!Array.isArray(root) ? root.name || root.title || root.module?.name || root.module?.title : "") || document.querySelector("h1, h2, .text-h6")?.textContent?.trim() || "Módulo Atual",
        videos: singleVideoList
      }] : null;
      if (modulesArr && modulesArr.length > 0) {
        const courseId = String(
          (!Array.isArray(root) ? root.course_id || root.course?.id || (Array.isArray(root.modules) || Array.isArray(root.course_modules) ? root.id : "") : "") || courseIdMatch?.[1] || "12"
        );
        const courseName = String((!Array.isArray(root) ? root.course?.name || root.course?.title || root.name || root.title : "") || "Curso Caveira").trim();
        const parsedModules = modulesArr.map((mod) => {
          const modName = String(mod?.name || mod?.title || "").trim();
          if (!modName) return null;
          const modId = mod?.id ? String(mod.id) : modIdFromUrl;
          const moduleUrl = courseId && modId && modId !== "0" ? `${window.location.origin}/courses/${courseId}/modules/${modId}/playground` : courseId ? `${window.location.origin}/courses/${courseId}` : "";
          const rawLessons = [];
          const seenVids = /* @__PURE__ */ new Set();
          const pushLesson = (v) => {
            if (!v || typeof v !== "object") return;
            const vid = String(v.course_video_id || v.video_id || v.id || "");
            const title = String(v.title || v.name || v.label || "").trim();
            if (!title) return;
            const dedup = vid ? `id:${vid}` : `t:${title.toLowerCase()}`;
            if (seenVids.has(dedup)) return;
            seenVids.add(dedup);
            const urlPath = courseId && vid ? `${window.location.origin}/courses/${courseId}/modules/${modId || "0"}/playground?course_video_id=${vid}` : moduleUrl;
            rawLessons.push({
              id: vid || null,
              title,
              durationMin: normalizeDurationMin(v.duration || v.duration_seconds || v.duration_minutes || v.time || v.length),
              completed: Boolean(v.completed || v.is_completed || v.watched || v.concluded || v.finished),
              url: urlPath
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
          emit("API_COURSE_CATALOG", { courseId, courseName, modules: parsedModules });
          return;
        }
      }
      const normalizeExtractedDate = (val, keyHint = "") => {
        if (typeof val === "number" && Number.isFinite(val) && /(?:date|at|time|data|liber|realiz|finish|complet)/i.test(keyHint)) {
          const ms = val > 1e12 ? val : val > 1e9 ? val * 1e3 : 0;
          if (ms > 0) {
            const d = new Date(ms);
            const yr = d.getUTCFullYear();
            if (yr >= 2018 && yr <= 2035) return d.toISOString().slice(0, 10);
          }
          return null;
        }
        if (typeof val !== "string") return null;
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
      const extractSimuladoDatesDeep = (obj, urlContext = "") => {
        let attemptDate = null;
        let attemptField = null;
        let releaseDate = null;
        let releaseField = null;
        let anyDate = null;
        let anyField = null;
        const visited = /* @__PURE__ */ new Set();
        const isAttemptEndpoint = /\/(?:enjoyment|revision|result|attempt)/i.test(String(urlContext || ""));
        const walk = (node, depth = 0, parentContext = "") => {
          if (!node || typeof node !== "object" || depth > 6 || visited.has(node)) return;
          visited.add(node);
          if (Array.isArray(node)) {
            if (node.length > 0 && typeof node[0] === "object" && node[0] && (node[0].position !== void 0 || node[0].rank !== void 0 || node[0].nickname)) {
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
            if (typeof v === "string" || typeof v === "number") {
              const parsed = normalizeExtractedDate(v, kl);
              if (!parsed) continue;
              const pathLabel = parentContext ? `${parentContext}.${k}` : k;
              const isAttemptKey = /(?:finish|complet|answer|submit|conclud|solv|done|realiz|execut|perform|taken|finaliz|sent|end|respon|feito|resolved)/i.test(kl) || /^(?:created_at|updated_at|date|data)$/i.test(kl) && (isAttemptEndpoint || /(?:user|attempt|answer|result|enjoyment|submission|pivot|student|my_|response|revision)/i.test(parentContext));
              const isReleaseKey = /(?:releas|liber|availab|publish|start|open|begin|schedul|applied|exam_date|data_prova)/i.test(kl) || depth <= 2 && /^(?:created_at|date)$/i.test(kl);
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
            } else if (v && typeof v === "object") {
              walk(v, depth + 1, parentContext ? `${parentContext}.${kl}` : kl);
            }
          }
        };
        walk(obj, 0, "");
        return { attemptDate, attemptField, releaseDate, releaseField, anyDate, anyField };
      };
      const enjoyMatch = urlStr.match(/\/practice-exams?\/(\d+)\/enjoyment/i);
      if (enjoyMatch) {
        const rawBlocks = root.blocks || root.blocos || root.groups || root.by_block || root.blocks_performance || [];
        const rawSubjects = root.subjects || root.disciplines || root.disciplinas || root.by_subject || root.disciplines_performance || [];
        const mapScoreRow = (item) => {
          const hitsVal = Number(item?.hits ?? item?.correct ?? item?.correct_answers ?? item?.acertos ?? 0);
          const errorsVal = Number(item?.errors ?? item?.wrong ?? item?.wrong_answers ?? item?.erros ?? 0);
          const blankVal = Number(item?.blank ?? item?.not_answered ?? item?.em_branco ?? item?.unanswered ?? 0);
          const totalVal = Number(item?.total ?? item?.questions_count ?? hitsVal + errorsVal + blankVal);
          const netVal = item?.net_score !== void 0 ? Number(item.net_score) : item?.score !== void 0 ? Number(item.score) : item?.liquida !== void 0 ? Number(item.liquida) : hitsVal - errorsVal;
          const rawPct = item?.percentage ?? item?.accuracy ?? item?.enjoyment ?? item?.user_percentage;
          const rawOthers = item?.others_percentage ?? item?.members_percentage ?? item?.others ?? item?.average_others;
          const pctVal = rawPct !== void 0 ? Math.round(Number(rawPct)) : totalVal > 0 ? Math.round(hitsVal / totalVal * 100) : 0;
          const othersNum = rawOthers !== void 0 && rawOthers !== null && rawOthers !== "" ? Number(rawOthers) : void 0;
          return {
            name: String(item?.name || item?.title || item?.subject || item?.discipline || "").trim(),
            hits: hitsVal,
            errors: errorsVal,
            blank: blankVal,
            total: totalVal,
            liquida: netVal,
            pct: pctVal,
            ...Number.isFinite(othersNum) ? { othersPct: Math.round(othersNum * 100) / 100 } : {}
          };
        };
        const blocks = (Array.isArray(rawBlocks) ? rawBlocks : []).map(mapScoreRow).filter((r) => r.name);
        const subjects = (Array.isArray(rawSubjects) ? rawSubjects : []).map(mapScoreRow).filter((r) => r.name);
        const dates = extractSimuladoDatesDeep(root, urlStr);
        if (blocks.length > 0 || subjects.length > 0 || dates.attemptDate || dates.releaseDate || dates.anyDate) {
          emit("API_SIMULADO_ENJOYMENT", {
            caveiraId: `sim_${enjoyMatch[1]}`,
            examId: enjoyMatch[1],
            blocks,
            subjects,
            attemptDate: dates.attemptDate,
            releaseDate: dates.releaseDate,
            anyDate: dates.anyDate,
            dateField: dates.attemptField || dates.releaseField || dates.anyField || null
          });
          return;
        }
      }
      const examDatesMatch = urlStr.match(/\/practice-exams?\/(\d+)(?:\/questions\/revision)?(?:[?#]|$)/i);
      if (examDatesMatch && !/\/(?:ranking|rankings|leaderboard)/i.test(urlStr)) {
        const dates = extractSimuladoDatesDeep(root, urlStr);
        if (dates.attemptDate || dates.releaseDate || dates.anyDate) {
          emit("API_SIMULADO_DATES", {
            examId: examDatesMatch[1],
            caveiraId: `sim_${examDatesMatch[1]}`,
            attemptDate: dates.attemptDate,
            releaseDate: dates.releaseDate,
            anyDate: dates.anyDate,
            dateField: dates.attemptField || dates.releaseField || dates.anyField || null
          });
        }
      }
      const teamOverviewMatch = urlStr.match(/\/teams\/(\d+)(?:[?#]|$)/i);
      if (teamOverviewMatch) {
        const teamSimsRaw = root.practice_exams || root.exams || root.simulados || root.team?.practice_exams || (Array.isArray(root) ? root : []);
        if (Array.isArray(teamSimsRaw) && teamSimsRaw.length > 0) {
          const batchItems = teamSimsRaw.map((simObj) => {
            if (!simObj || typeof simObj !== "object") return null;
            const d = extractSimuladoDatesDeep(simObj, urlStr);
            const tName = String(simObj.title || simObj.name || simObj.exam_name || "").trim();
            const eId = simObj.id ? String(simObj.id) : null;
            if (!tName && !eId) return null;
            if (!d.attemptDate && !d.releaseDate && !d.anyDate) return null;
            return {
              examId: eId,
              title: tName,
              attemptDate: d.attemptDate,
              releaseDate: d.releaseDate,
              anyDate: d.anyDate,
              dateField: d.attemptField || d.releaseField || d.anyField || null
            };
          }).filter(Boolean);
          if (batchItems.length > 0) {
            emit("API_SIMULADO_DATES_BATCH", { teamId: teamOverviewMatch[1], items: batchItems });
          }
        }
      }
      const isRankingUrl = /\/(?:ranking|rankings|leaderboard|classificacao|classification|participants|students|users|positions|podium|top-?\d*)\b|[?&](?:ranking|leaderboard|page_ranking)=/i.test(String(url || ""));
      const looksLikeRankingRow = (item, isFromArray = false) => {
        if (!item || typeof item !== "object") return true;
        const rawTitle = String(
          item.title || item.exam_name || item.practice_exam?.title || item.practice_exam?.name || item.name || ""
        ).trim();
        if (/^#?\d{1,5}\s*[º°ª]?$/.test(rawTitle) || /^caveira\s+\d{3,}$/i.test(rawTitle)) {
          return true;
        }
        const hasExplicitExamSignals = Boolean(
          Array.isArray(item.subjects) || Array.isArray(item.disciplines) || item.exam_name || item.practice_exam || /simulado|exame|prova|prf|pol[ií]cia|turma/i.test(rawTitle)
        );
        const hasCandidateField = Boolean(
          item.nickname || item.username || item.avatar || item.avatar_url || item.student || item.student_name || item.candidate || item.user_name && !hasExplicitExamSignals
        );
        if (hasCandidateField && !hasExplicitExamSignals) return true;
        if (hasExplicitExamSignals) return false;
        const hasPositionField = Boolean(
          item.position !== void 0 || item.rank !== void 0 || item.ranking !== void 0 || item.placement !== void 0 || item.colocacao !== void 0
        );
        const hasAnyExamField = Boolean(
          item.exam_id || item.practice_exam_id || item.total_questions !== void 0 || item.questions_count !== void 0
        );
        if (isFromArray && hasPositionField && !hasAnyExamField) return true;
        if (!hasAnyExamField && !item.finished_at && !item.completed_at && !item.started_at) return true;
        return false;
      };
      const hasSimMetrics = (obj) => {
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
        const resObj = obj.result || obj.summary || obj.stats || obj.metrics || obj.enjoyment || obj.performance || {};
        return Boolean(
          obj.hits !== void 0 || obj.correct_answers !== void 0 || obj.net_score !== void 0 || obj.score !== void 0 || resObj.hits !== void 0 || resObj.correct !== void 0 || resObj.correct_answers !== void 0 || resObj.net_score !== void 0 || resObj.score !== void 0 || Array.isArray(obj.subjects) || Array.isArray(obj.disciplines)
        );
      };
      const singlePersonalWrapper = !Array.isArray(root) && [
        root.practice_exam,
        root.exam,
        root.my_result,
        root.user_result,
        root.attempt,
        root.result
      ].find((obj) => hasSimMetrics(obj)) || null;
      let simArr = isRankingUrl ? null : Array.isArray(root.practice_exams) ? root.practice_exams : Array.isArray(root.exams) ? root.exams : Array.isArray(root) && root[0] && hasSimMetrics(root[0]) && !root[0].alternatives ? root : singlePersonalWrapper ? [singlePersonalWrapper] : /practice-exam|team|simulado/i.test(urlStr) && !Array.isArray(root) && hasSimMetrics(root) ? [root] : null;
      if (diagnosticMode && /(?:practice-exam|simulado|enjoyment|ranking|\/teams\/)/i.test(urlStr)) {
        emitDiagnosticShape("simulado_api_response", urlStr, {
          isRankingUrl,
          matchedCount: Array.isArray(simArr) ? simArr.length : 0,
          shape: summarizeShape(root)
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
          if (v === void 0 || v === null || v === "") continue;
          const n = Number(v);
          if (Number.isFinite(n)) return n;
        }
        return null;
      };
      if (simArr && simArr.length > 0) {
        const normalizedSims = simArr.map((sim) => {
          if (!sim || typeof sim !== "object" || looksLikeRankingRow(sim, isArrayPayload)) return null;
          const nestedRes = sim.result && typeof sim.result === "object" ? sim.result : sim.summary && typeof sim.summary === "object" ? sim.summary : sim.stats && typeof sim.stats === "object" ? sim.stats : sim.enjoyment && typeof sim.enjoyment === "object" ? sim.enjoyment : {};
          const nestedExam = sim.practice_exam && typeof sim.practice_exam === "object" ? sim.practice_exam : sim.exam && typeof sim.exam === "object" ? sim.exam : {};
          const estimatedFields = [];
          const estimatedReasons = [];
          const hitsRaw = pickNum([sim.hits, sim.correct_answers, sim.correct, nestedRes.hits, nestedRes.correct, nestedRes.correct_answers, nestedRes.acertos]);
          const errorsRaw = pickNum([sim.errors, sim.wrong_answers, sim.wrong, nestedRes.errors, nestedRes.wrong, nestedRes.wrong_answers, nestedRes.erros]);
          const blankRaw = pickNum([sim.blank, sim.not_answered, sim.unanswered, nestedRes.blank, nestedRes.not_answered, nestedRes.unanswered]);
          const liquidaRaw = pickNum([sim.net_score, sim.score, sim.liquida, nestedRes.net_score, nestedRes.score, nestedRes.liquida]);
          const totalRaw = pickNum([sim.total_questions, sim.questions_count, sim.total, nestedExam.total_questions, nestedExam.questions_count, nestedRes.total_questions, nestedRes.questions_count, nestedRes.total]);
          const pctRaw = pickNum([sim.percentage, sim.accuracy, sim.user_percentage, nestedRes.percentage, nestedRes.accuracy]);
          if (hitsRaw === null && errorsRaw === null && liquidaRaw === null) {
            return null;
          }
          let total = totalRaw !== null && totalRaw > 0 ? totalRaw : null;
          if (total === null && hitsRaw !== null && errorsRaw !== null) {
            total = hitsRaw + errorsRaw + (blankRaw ?? 0);
            estimatedFields.push("total");
            estimatedReasons.push("total somado a partir de acertos + erros + brancos");
          } else if (total === null) {
            estimatedFields.push("total");
            estimatedReasons.push("total_questions ausente na resposta da API (não inventado)");
          }
          let hits = hitsRaw;
          let errors = errorsRaw;
          if (hits === null) {
            estimatedFields.push("hits");
            estimatedReasons.push("hits ausente na resposta da API");
          }
          if (errors === null) {
            if (hits !== null && liquidaRaw !== null) {
              errors = Math.max(0, hits - liquidaRaw);
              estimatedFields.push("errors");
              estimatedReasons.push("errors inferido de hits - líquida");
            } else {
              estimatedFields.push("errors");
              estimatedReasons.push("errors ausente na resposta da API");
            }
          }
          let liquida = liquidaRaw;
          if (liquida === null && hits !== null && errors !== null) {
            liquida = hits - errors;
            estimatedFields.push("liquida");
            estimatedReasons.push("liquida calculada por hits - errors");
          }
          let pct = pctRaw !== null ? Math.round(pctRaw) : null;
          if (pct === null && hits !== null && total !== null && total > 0) {
            pct = Math.round(hits / total * 100);
            estimatedFields.push("pct");
            estimatedReasons.push("pct calculado por hits / total");
          }
          const { attemptDate, attemptField, releaseDate, releaseField, anyDate, anyField } = extractSimuladoDatesDeep(sim, urlStr);
          const rawDate = String(sim.finished_at || sim.completed_at || sim.answered_at || sim.created_at || sim.date || nestedRes.finished_at || "").slice(0, 10);
          const resolvedDate = attemptDate || releaseDate || anyDate || (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : void 0);
          const dateSource = attemptDate ? "attempt" : releaseDate ? "release" : anyDate ? "api_date" : void 0;
          const dateField = attemptField || releaseField || anyField || null;
          const rawSubs = sim.subjects || sim.disciplines || nestedRes.subjects || nestedRes.disciplines;
          const subjectScores = Array.isArray(rawSubs) ? rawSubs.map((s) => {
            const sH = pickNum([s?.hits, s?.correct, s?.acertos]) ?? 0;
            const sE = pickNum([s?.errors, s?.wrong, s?.erros]) ?? 0;
            const sB = pickNum([s?.blank, s?.not_answered]) ?? 0;
            const sLiq = pickNum([s?.net_score, s?.score, s?.liquida]);
            return {
              name: String(s?.name || s?.subject || s?.discipline || "").trim(),
              hits: sH,
              errors: sE,
              blank: sB,
              liquida: sLiq !== null ? sLiq : sH - sE
            };
          }).filter((s) => s.name) : [];
          const title = String(
            sim.title || sim.exam_name || nestedExam.title || nestedExam.name || sim.name || "Simulado Caveira"
          ).trim();
          const examIdVal = sim.id || sim.practice_exam_id || nestedExam.id || null;
          return {
            caveiraId: examIdVal ? `sim_${examIdVal}` : void 0,
            title,
            data: resolvedDate,
            ...dateSource ? { dateSource } : {},
            ...dateField ? { dateField } : {},
            ...releaseDate ? { releasedAt: releaseDate } : {},
            dataSource: "api",
            estimated: estimatedFields.length > 0,
            ...estimatedFields.length > 0 ? { estimatedFields, estimatedReason: estimatedReasons.join("; ") } : {},
            ...total !== null ? { total } : {},
            ...hits !== null ? { hits } : {},
            ...errors !== null ? { errors } : {},
            ...blankRaw !== null ? { blank: blankRaw } : {},
            ...pct !== null ? { pct } : {},
            ...liquida !== null ? { liquida } : {},
            subjectScores
          };
        }).filter(Boolean);
        if (normalizedSims.length > 0) {
          emit("API_SIMULADOS_DATA", { simulados: normalizedSims });
          return;
        }
      }
      const candidates = Array.isArray(root) ? root : Array.isArray(root.data) ? root.data : Array.isArray(root.questions) ? root.questions : Array.isArray(root.items) ? root.items : [root];
      const parsedQuestions = candidates.map(normalizeQuestionNode).filter(Boolean);
      if (parsedQuestions.length > 0) {
        emit("API_QUESTION_DATA", { questions: parsedQuestions });
      }
    }
    function inspectAnswerMutation(method, reqUrl, reqBody, resJson) {
      const m = String(method || "GET").toUpperCase();
      if (!["POST", "PUT", "PATCH"].includes(m)) return;
      const urlStr = String(reqUrl || "");
      const root = resJson?.data && typeof resJson.data === "object" ? resJson.data : resJson || {};
      let parsedReq = null;
      try {
        if (typeof reqBody === "string" && (reqBody.trim().startsWith("{") || reqBody.trim().startsWith("["))) {
          parsedReq = JSON.parse(reqBody);
        } else if (reqBody && typeof reqBody === "object" && !(reqBody instanceof FormData)) {
          parsedReq = reqBody;
        }
      } catch (_) {
      }
      const recognizedAnswer = Boolean(
        /(?:question|answer|resol|respond|attempt|alternative)/i.test(urlStr) && (root?.is_correct !== void 0 || root?.correct !== void 0 || root?.hit !== void 0 || root?.acertou !== void 0)
      );
      if (recognizedAnswer) {
        const qApiId = Number(root.question_id || root.id || parsedReq?.question_id || parsedReq?.id);
        const hitVal = root.is_correct !== void 0 ? Boolean(root.is_correct) : root.correct !== void 0 ? Boolean(root.correct) : Boolean(root.hit ?? root.acertou);
        emit("API_ANSWER_SUBMITTED", {
          apiId: Number.isFinite(qApiId) && qApiId > 0 ? qApiId : null,
          hit: hitVal,
          userAnswer: parsedReq?.answer ?? parsedReq?.alternative ?? root?.user_answer ?? null,
          url: safeUrlPath(urlStr)
        });
        return;
      }
      if (diagnosticMode) {
        emitDiagnosticShape("unrecognized_mutation", urlStr, {
          method: m,
          reqShape: parsedReq ? summarizeShape(parsedReq) : reqBody ? typeof reqBody : "empty",
          resShape: resJson ? summarizeShape(resJson) : "non-json"
        });
      }
    }
    const shouldInspectUrl = (urlStr) => {
      const s = String(urlStr || "").toLowerCase();
      if (!s || /\.(png|jpg|jpeg|svg|webp|woff2?|css|js|mp4|m3u8|ts)(\?|$)/.test(s)) return false;
      return s.includes("caveira") || s.startsWith("/") || s.includes("/api/");
    };
    const origFetch = window.fetch;
    if (typeof origFetch === "function") {
      window.fetch = function(...args) {
        const reqUrl = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
        const reqMethod = String(args[1]?.method || args[0]?.method || "GET").toUpperCase();
        const reqBody = args[1]?.body;
        try {
          const hdrs = args[1]?.headers || args[0]?.headers;
          const authVal = hdrs instanceof Headers ? hdrs.get("Authorization") : hdrs?.Authorization || hdrs?.authorization;
          if (authVal && /Bearer\s+/i.test(String(authVal))) {
            cachedApiAuthHeader = String(authVal);
          }
        } catch (_) {
        }
        const promise = origFetch.apply(this, args);
        if (shouldInspectUrl(reqUrl)) {
          promise.then((res) => {
            try {
              if (!res || !res.ok) return;
              const ct = res.headers?.get("content-type") || "";
              if (!ct.includes("json")) {
                if (["POST", "PUT", "PATCH"].includes(reqMethod)) {
                  inspectAnswerMutation(reqMethod, reqUrl, reqBody, null);
                }
                return;
              }
              res.clone().json().then((json) => {
                inspectApiPayload(reqUrl, json);
                if (["POST", "PUT", "PATCH"].includes(reqMethod)) {
                  inspectAnswerMutation(reqMethod, reqUrl, reqBody, json);
                }
              }).catch(() => {
              });
            } catch (_) {
            }
          }).catch(() => {
          });
        }
        return promise;
      };
    }
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this.__qgMethod = String(method || "GET").toUpperCase();
      this.__qgUrl = url;
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      try {
        if (String(name || "").toLowerCase() === "authorization" && /Bearer\s+/i.test(String(value || ""))) {
          cachedApiAuthHeader = String(value);
        }
      } catch (_) {
      }
      return origSetHeader.call(this, name, value);
    };
    XMLHttpRequest.prototype.send = function(body, ...rest) {
      const reqMethod = this.__qgMethod || "GET";
      if (shouldInspectUrl(this.__qgUrl)) {
        this.addEventListener("load", () => {
          try {
            let json = null;
            if ((this.responseType === "json" || !this.responseType) && this.response && typeof this.response === "object") {
              json = this.response;
            } else if (!this.responseType || this.responseType === "text") {
              const ct = this.getResponseHeader("content-type") || "";
              const txt = typeof this.responseText === "string" ? this.responseText.trim() : "";
              if ((ct.includes("json") || txt.startsWith("{") || txt.startsWith("[")) && (txt.startsWith("{") || txt.startsWith("["))) {
                json = JSON.parse(txt);
              }
            }
            if (json) {
              inspectApiPayload(this.__qgUrl, json);
            }
            if (["POST", "PUT", "PATCH"].includes(reqMethod)) {
              inspectAnswerMutation(reqMethod, this.__qgUrl, body, json);
            }
          } catch (_) {
          }
        });
      }
      return origSend.call(this, body, ...rest);
    };
    window.addEventListener("message", async (ev) => {
      if (ev.source !== window || ev.origin !== window.location.origin || ev.data?.source !== "QG_CAVEIRA_CONTENT" || !channelNonce || ev.data?.nonce !== channelNonce || ev.data?.type !== "FETCH_SIMULADO_DATES") {
        return;
      }
      const { requestId, teamId, examId } = ev.data.payload || {};
      if (!requestId) return;
      const urls = [];
      if (teamId && examId) {
        urls.push(`https://api.caveira.com/api/v1/skull/teams/${teamId}/practice-exam/${examId}`);
        urls.push(`https://api.caveira.com/api/v1/skull/teams/${teamId}/practice-exam/${examId}/enjoyment`);
        urls.push(`https://api.caveira.com/api/v1/skull/teams/${teamId}/practice-exam/${examId}/questions/revision?filters=${encodeURIComponent(JSON.stringify({ status: "all", assurance: "all", subject_id: "all", practice_exam_id: Number(examId) }))}&page=1&rowsPerPage=5&rowsNumber=0`);
      }
      if (teamId) {
        urls.push(`https://api.caveira.com/api/v1/skull/teams/${teamId}`);
      }
      const authHeader = readFallbackAuthHeader();
      const headers = { Accept: "application/json", ...authHeader ? { Authorization: authHeader } : {} };
      const fetchFn = typeof origFetch === "function" ? origFetch.bind(window) : window.fetch.bind(window);
      let attemptDate = null;
      let releaseDate = null;
      let anyDate = null;
      let dateField = null;
      const scanResult = (urlTarget, jsonObj) => {
        if (!jsonObj || typeof jsonObj !== "object") return;
        inspectApiPayload(urlTarget, jsonObj);
        const rootData = jsonObj.data && typeof jsonObj.data === "object" ? jsonObj.data : jsonObj;
        const visitedNodes = /* @__PURE__ */ new Set();
        const isAttemptUrl = /\/(?:enjoyment|revision|result|attempt)/i.test(urlTarget);
        const walkDate = (node, depth = 0, parentCtx = "") => {
          if (!node || typeof node !== "object" || depth > 6 || visitedNodes.has(node)) return;
          visitedNodes.add(node);
          if (Array.isArray(node)) {
            if (node.length > 0 && typeof node[0] === "object" && node[0] && (node[0].position !== void 0 || node[0].rank !== void 0 || node[0].nickname)) return;
            node.slice(0, 12).forEach((c) => walkDate(c, depth + 1, parentCtx));
            return;
          }
          for (const k of Object.keys(node)) {
            const kl = k.toLowerCase();
            if (/(?:ranking|rankings|leaderboard|participants|members|others|candidates)/i.test(kl)) continue;
            const v = node[k];
            if (typeof v === "string") {
              const iso = v.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
              const br = v.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
              const dStr = iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : br ? `${br[3]}-${br[2]}-${br[1]}` : null;
              if (!dStr) continue;
              const pathLbl = parentCtx ? `${parentCtx}.${k}` : k;
              const isAtt = /(?:finish|complet|answer|submit|conclud|solv|done|realiz|execut|perform|taken|finaliz|sent|end|respon|feito|resolved)/i.test(kl) || /^(?:created_at|updated_at|date|data)$/i.test(kl) && (isAttemptUrl || /(?:user|attempt|answer|result|enjoyment|submission|pivot|student|my_|response|revision)/i.test(parentCtx));
              const isRel = /(?:releas|liber|availab|publish|start|open|begin|schedul|applied|exam_date|data_prova)/i.test(kl) || depth <= 2 && /^(?:created_at|date)$/i.test(kl);
              if (isAtt && !attemptDate) {
                attemptDate = dStr;
                dateField = pathLbl;
              } else if (isRel && !releaseDate) {
                releaseDate = dStr;
                if (!attemptDate) dateField = pathLbl;
              }
              if (!anyDate) {
                anyDate = dStr;
                if (!attemptDate && !releaseDate) dateField = pathLbl;
              }
            } else if (v && typeof v === "object") {
              walkDate(v, depth + 1, parentCtx ? `${parentCtx}.${kl}` : kl);
            }
          }
        };
        walkDate(rootData, 0, "");
      };
      try {
        await Promise.allSettled(
          urls.map(async (u) => {
            const res = await fetchFn(u, { method: "GET", headers, credentials: "include" });
            if (res && res.ok) {
              const json = await res.json();
              scanResult(u, json);
            }
          })
        );
      } catch (_) {
      }
      postVerifiedMessage("FETCH_SIMULADO_DATES_RESULT", {
        requestId,
        teamId,
        examId,
        attemptDate,
        releaseDate,
        anyDate,
        dateField
      });
    });
  })();
})();
