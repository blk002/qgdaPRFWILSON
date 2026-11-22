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
        window.postMessage({ source: "QG_CAVEIRA_API_SNIFFER", type, payload }, "*");
      } catch (_) {
      }
    }
    window.addEventListener("message", (ev) => {
      if (ev.source !== window || ev.data?.source !== "QG_CAVEIRA_CONTENT" || ev.data?.type !== "REQUEST_SNIFFER_REPLAY") {
        return;
      }
      replayBuffer.forEach((item) => {
        try {
          window.postMessage({ source: "QG_CAVEIRA_API_SNIFFER", type: item.type, payload: item.payload }, "*");
        } catch (_) {
        }
      });
    });
    function stripHtml(raw) {
      if (!raw || typeof raw !== "string") return "";
      return raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }
    function normalizeQuestionNode(item) {
      if (!item || typeof item !== "object") return null;
      const rawId = item.code || item.question_code || (item.id ? `Q${String(item.id).replace(/^Q/i, "")}` : "");
      if (!rawId || !/^Q\d{3,}$/i.test(String(rawId))) {
        if (!item.enunciado && !item.statement && !item.question && !item.teacher_comment && !item.comentario_professor) {
          return null;
        }
      }
      const id = String(rawId || item.id).toUpperCase().startsWith("Q") ? String(rawId || item.id).toUpperCase() : `Q${rawId || item.id}`;
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
      const banca = String(item.board?.name || item.banca?.name || item.banca || "").trim();
      const ano = String(item.year || item.ano || "").trim();
      if (!commentText && !hasPct && !noteRaw && !banca && !ano) return null;
      return {
        id,
        ...commentText ? { teacherComment: commentText.slice(0, 2500), commentSource } : {},
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
      const courseIdMatch = urlStr.match(/\/courses\/(\d+)/i) || window.location.pathname.match(/\/courses\/(\d+)/i);
      const modIdMatch = urlStr.match(/\/modules\/(\d+)/i) || window.location.pathname.match(/\/modules\/(\d+)/i);
      const modIdFromUrl = modIdMatch?.[1] || "";
      const multiModulesCandidate = root.modules || root.course_modules || root.course?.modules || root.disciplines || root.subjects || root.sections || (Array.isArray(root) && root[0] && (root[0].videos || root[0].course_videos || root[0].lessons || root[0].contents || root[0].items || root[0].topics || root[0].submodules || root[0].course_module_videos || /\/courses\/\d+\/modules/i.test(urlStr) && root[0].id && (root[0].name || root[0].title)) ? root : null);
      const singleVideoList = root.videos || root.course_videos || root.lessons || root.contents || root.course_module_videos || (Array.isArray(root) && root[0] && (root[0].course_video_id !== void 0 || root[0].video_id !== void 0 || root[0].vimeo_id !== void 0 || root[0].bunny_id !== void 0 || root[0].embed_url !== void 0 || root[0].duration_seconds !== void 0) ? root : null);
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
      const isRankingUrl = /\/(?:ranking|rankings|leaderboard|classificacao|classification|participants|students|users|positions|podium|top-?\d*)\b|[?&](?:ranking|leaderboard|page_ranking)=/i.test(String(url || ""));
      const looksLikeRankingRow = (item) => {
        if (!item || typeof item !== "object") return true;
        const hasRankingOrCandidateField = Boolean(
          item.position !== void 0 || item.rank !== void 0 || item.ranking !== void 0 || item.placement !== void 0 || item.colocacao !== void 0 || item.nickname || item.username || item.avatar || item.avatar_url || item.student || item.student_name || item.candidate || item.user || item.user_name && !item.exam_name && !item.title
        );
        if (hasRankingOrCandidateField) return true;
        const hasExamField = Boolean(
          item.exam_id || item.practice_exam_id || item.exam_name || item.practice_exam || item.finished_at || item.completed_at || item.started_at || item.total_questions !== void 0 || item.questions_count !== void 0 || Array.isArray(item.subjects) || Array.isArray(item.disciplines)
        );
        if (!hasExamField) return true;
        const rawTitle = String(
          item.title || item.exam_name || item.practice_exam?.title || item.practice_exam?.name || item.name || ""
        ).trim();
        if (/^#?\d{1,5}\s*[º°ª]?$/.test(rawTitle) || /^caveira\s+\d{3,}$/i.test(rawTitle)) {
          return true;
        }
        return false;
      };
      let simArr = isRankingUrl ? null : Array.isArray(root.practice_exams) ? root.practice_exams : Array.isArray(root.exams) ? root.exams : Array.isArray(root) && root[0] && (root[0].hits !== void 0 || root[0].correct_answers !== void 0 || root[0].score !== void 0) && !root[0].alternatives ? root : /practice-exam|team|simulado/i.test(url) && (root.hits !== void 0 || root.correct_answers !== void 0 || Array.isArray(root.subjects)) ? [root] : null;
      if (simArr && simArr.length > 1) {
        const distinctUsers = new Set(simArr.map((x) => x?.user_id ?? x?.student_id ?? x?.participant_id).filter(Boolean));
        if (distinctUsers.size > 1) {
          simArr = null;
        }
      }
      if (simArr && simArr.length > 0) {
        const normalizedSims = simArr.map((sim) => {
          if (!sim || typeof sim !== "object" || looksLikeRankingRow(sim)) return null;
          const total = Number(sim.total_questions ?? sim.questions_count ?? sim.total ?? (Number(sim.hits) || 0) + (Number(sim.errors) || 0) + (Number(sim.blank) || 0));
          const hits = Number(sim.hits ?? sim.correct_answers ?? sim.correct ?? 0);
          if (!total || total <= 0) return null;
          const errors = Number(sim.errors ?? sim.wrong_answers ?? Math.max(0, total - hits));
          const pct = Number(sim.percentage ?? sim.accuracy ?? Math.round(hits / total * 100));
          const liquida = sim.net_score !== void 0 ? Number(sim.net_score) : sim.score !== void 0 ? Number(sim.score) : hits - errors;
          const rawDate = String(sim.finished_at || sim.completed_at || sim.created_at || sim.date || "").slice(0, 10);
          const subjectScores = Array.isArray(sim.subjects || sim.disciplines) ? (sim.subjects || sim.disciplines).map((s) => ({
            name: String(s?.name || s?.subject || "").trim(),
            hits: Number(s?.hits ?? s?.correct ?? 0),
            errors: Number(s?.errors ?? s?.wrong ?? 0),
            liquida: s?.net_score !== void 0 ? Number(s.net_score) : Number(s?.hits ?? s?.correct ?? 0) - Number(s?.errors ?? s?.wrong ?? 0)
          })) : [];
          const title = String(
            sim.title || sim.exam_name || sim.practice_exam?.title || sim.practice_exam?.name || sim.name || "Simulado Caveira"
          ).trim();
          return {
            caveiraId: sim.id ? `sim_${sim.id}` : void 0,
            title,
            data: /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : void 0,
            total,
            hits,
            errors,
            pct: Math.round(pct),
            liquida,
            subjectScores
          };
        }).filter(Boolean);
        if (normalizedSims.length > 0) {
          emit("API_SIMULADOS_DATA", { simulados: normalizedSims });
          return;
        }
      }
      const candidates = Array.isArray(root) ? root : Array.isArray(root.questions) ? root.questions : Array.isArray(root.items) ? root.items : [root];
      const parsedQuestions = candidates.map(normalizeQuestionNode).filter(Boolean);
      if (parsedQuestions.length > 0) {
        emit("API_QUESTION_DATA", { questions: parsedQuestions });
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
        const promise = origFetch.apply(this, args);
        if (shouldInspectUrl(reqUrl)) {
          promise.then((res) => {
            try {
              if (!res || !res.ok) return;
              const ct = res.headers?.get("content-type") || "";
              if (!ct.includes("json")) return;
              res.clone().json().then((json) => inspectApiPayload(reqUrl, json)).catch(() => {
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
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this.__qgUrl = url;
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      if (shouldInspectUrl(this.__qgUrl)) {
        this.addEventListener("load", () => {
          try {
            const ct = this.getResponseHeader("content-type") || "";
            if (ct.includes("json") && typeof this.responseText === "string" && (this.responseText.trim().startsWith("{") || this.responseText.trim().startsWith("["))) {
              const json = JSON.parse(this.responseText);
              inspectApiPayload(this.__qgUrl, json);
            }
          } catch (_) {
          }
        });
      }
      return origSend.apply(this, args);
    };
  })();
})();
