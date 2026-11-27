// Bridge para o iframe do player de vídeo (Bunny Stream / mediadelivery.net)
// Responsável por sincronizar velocidade configurada no QG, resolução máxima e sinalizar término de aula.

(function() {
  if (window.__QG_PLAYER_BRIDGE_INSTALLED__) return;
  window.__QG_PLAYER_BRIDGE_INSTALLED__ = true;

  const SPEED_KEY = 'qg_player_target_speed';
  const SEEK_KEY = 'qg_player_pending_seek';
  const RESUME_KEY = 'qg_video_resume_positions';
  let desiredSpeed = 1;
  let forceMaxQuality = true;
  let lastCourseId = null;
  let lastBoundVideo = null;
  let endedNotified = false;
  let lastResumeSave = 0;

  function clampSpeed(val) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0.5 || n > 4) return 1;
    return Math.round(n * 100) / 100;
  }

  function extractCourseIdFromRef() {
    try {
      const m = String(document.referrer || '').match(/\/courses\/(\d+)/i);
      return m ? m[1] : null;
    } catch (_) {
      return null;
    }
  }

  function postSettingsToMain(force = false) {
    try {
      window.postMessage(
        {
          source: 'QG_PLAYER_BRIDGE',
          type: 'QG_APPLY_PLAYER_SETTINGS',
          payload: {
            speed: clampSpeed(desiredSpeed),
            forceMaxQuality,
            force: Boolean(force),
          },
        },
        window.location.origin
      );
    } catch (_) {}
  }

  function applyTargetSpeed(video, force = false) {
    const speed = clampSpeed(desiredSpeed);
    postSettingsToMain(force);
    if (!video) return;
    try {
      if (Math.abs((video.defaultPlaybackRate || 1) - speed) > 0.005) {
        video.defaultPlaybackRate = speed;
      }
      if (Math.abs((video.playbackRate || 1) - speed) > 0.005) {
        video.playbackRate = speed;
      }
    } catch (_) {}
  }

  function getResumeVideoKey() {
    try {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const vidId = parts[parts.length - 1] || '';
      if (vidId && vidId.length > 6) return `vid_${vidId}`;
    } catch (_) {}
    return '';
  }

  function saveResumePosition(video) {
    if (!video || !Number.isFinite(video.currentTime) || !Number.isFinite(video.duration)) return;
    if (video.duration < 30) return;
    const key = getResumeVideoKey();
    if (!key) return;
    const now = Date.now();
    if (now - lastResumeSave < 5000 && !video.ended) return;
    lastResumeSave = now;
    try {
      const ratio = video.currentTime / video.duration;
      chrome.storage.local.get([RESUME_KEY], (res) => {
        if (chrome.runtime?.lastError) return;
        const map = (res && res[RESUME_KEY] && typeof res[RESUME_KEY] === 'object') ? { ...res[RESUME_KEY] } : {};
        if (ratio >= 0.96 || video.ended) {
          delete map[key];
        } else if (video.currentTime >= 15) {
          map[key] = { time: Math.floor(video.currentTime), duration: Math.floor(video.duration), updatedAt: now };
        }
        const entries = Object.entries(map);
        if (entries.length > 100) {
          entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0));
          const pruned = Object.fromEntries(entries.slice(0, 100));
          chrome.storage.local.set({ [RESUME_KEY]: pruned });
        } else {
          chrome.storage.local.set({ [RESUME_KEY]: map });
        }
      });
    } catch (_) {}
  }

  function checkAndApplySeek(video) {
    if (!video) return;
    try {
      chrome.storage.local.get([SEEK_KEY], (res) => {
        if (chrome.runtime?.lastError) return;
        const item = res?.[SEEK_KEY];
        if (!item || typeof item !== 'object') return;
        const age = Date.now() - (Number(item.updatedAt) || 0);
        if (age > 45000) return;
        const targetSec = Number(item.seconds);
        if (!Number.isFinite(targetSec) || targetSec < 0) return;

        const doSeek = () => {
          try {
            if (Number.isFinite(video.duration) && targetSec < video.duration) {
              video.currentTime = targetSec;
              chrome.storage.local.remove(SEEK_KEY);
              video.play?.().catch(() => {});
            } else if (!Number.isFinite(video.duration) || video.duration === 0) {
              setTimeout(() => {
                if (Number.isFinite(video.duration) && targetSec < video.duration) {
                  video.currentTime = targetSec;
                  chrome.storage.local.remove(SEEK_KEY);
                  video.play?.().catch(() => {});
                }
              }, 1200);
            }
          } catch (_) {}
        };

        if (video.readyState >= 1) doSeek();
        else video.addEventListener('loadedmetadata', doSeek, { once: true });
      });
    } catch (_) {}
  }

  function tryAutoResumePosition(video) {
    if (!video || video.__qgResumedOnce) return;
    const key = getResumeVideoKey();
    if (!key) return;
    try {
      chrome.storage.local.get([RESUME_KEY, SEEK_KEY], (res) => {
        if (chrome.runtime?.lastError) return;
        const seekItem = res?.[SEEK_KEY];
        if (seekItem && (Date.now() - (Number(seekItem.updatedAt) || 0)) < 45000) return;
        const saved = res?.[RESUME_KEY]?.[key];
        if (!saved || !Number.isFinite(saved.time) || saved.time < 15) return;
        video.__qgResumedOnce = true;
        const applyResume = () => {
          if (video.currentTime < 5 && Number.isFinite(video.duration) && saved.time < video.duration - 10) {
            video.currentTime = saved.time;
          }
        };
        if (video.readyState >= 1) applyResume();
        else video.addEventListener('loadedmetadata', applyResume, { once: true });
      });
    } catch (_) {}
  }

  function bindVideoElement() {
    const video = document.querySelector('video');
    if (!video || video === lastBoundVideo) return;
    lastBoundVideo = video;
    endedNotified = false;

    video.addEventListener('loadedmetadata', () => {
      applyTargetSpeed(video, false);
      tryAutoResumePosition(video);
    });
    video.addEventListener('canplay', () => applyTargetSpeed(video, false));
    video.addEventListener('playing', () => applyTargetSpeed(video, false));
    video.addEventListener('timeupdate', () => saveResumePosition(video));
    video.addEventListener('pause', () => {
      lastResumeSave = 0;
      saveResumePosition(video);
    });
    video.addEventListener('ended', () => {
      lastResumeSave = 0;
      saveResumePosition(video);
      if (endedNotified) return;
      endedNotified = true;
      try {
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ type: 'PLAYER_VIDEO_ENDED', payload: { endedAt: Date.now() } }).catch(() => {});
        }
      } catch (_) {}
    });

    applyTargetSpeed(video, false);
    checkAndApplySeek(video);
    tryAutoResumePosition(video);
  }

  function initSpeedFromStorage() {
    try {
      chrome.storage.local.get([SPEED_KEY], (res) => {
        if (chrome.runtime?.lastError) return;
        const item = res?.[SPEED_KEY];
        if (item && typeof item === 'object') {
          const refCid = extractCourseIdFromRef();
          const age = Date.now() - (Number(item.updatedAt) || 0);
          const sameCourse = !refCid || !item.courseId || String(refCid) === String(item.courseId);
          if (sameCourse || age < 600000) {
            desiredSpeed = clampSpeed(item.speed);
            if (typeof item.forceMaxQuality === 'boolean') {
              forceMaxQuality = item.forceMaxQuality;
            }
            lastCourseId = item.courseId || null;
            applyTargetSpeed(document.querySelector('video'), true);
          }
        }
      });
    } catch (_) {}
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes[SPEED_KEY]?.newValue) {
        const item = changes[SPEED_KEY].newValue;
        desiredSpeed = clampSpeed(item.speed);
        if (typeof item.forceMaxQuality === 'boolean') {
          forceMaxQuality = item.forceMaxQuality;
        }
        lastCourseId = item.courseId || lastCourseId;
        applyTargetSpeed(document.querySelector('video'), true);
      }
      if (changes[SEEK_KEY]?.newValue) {
        checkAndApplySeek(document.querySelector('video'));
      }
    });
  } catch (_) {}

  try {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg && msg.type === 'APPLY_PLAYER_SPEED' && msg.payload) {
        desiredSpeed = clampSpeed(msg.payload.speed);
        if (typeof msg.payload.forceMaxQuality === 'boolean') {
          forceMaxQuality = msg.payload.forceMaxQuality;
        }
        applyTargetSpeed(document.querySelector('video'), true);
        sendResponse({ ok: true, applied: desiredSpeed, forceMaxQuality });
      }
      if (msg && msg.type === 'SEEK_VIDEO_TO') {
        checkAndApplySeek(document.querySelector('video'));
        sendResponse({ ok: true });
      }
    });
  } catch (_) {}

  initSpeedFromStorage();
  bindVideoElement();

  // Notifica a aba pai (Caveira) que o player iframe está pronto para receber velocidade + qualidade máxima
  try {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'PLAYER_BRIDGE_READY' }).catch(() => {});
    }
  } catch (_) {}

  const observer = new MutationObserver(() => bindVideoElement());
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  const poll = setInterval(() => {
    bindVideoElement();
    postSettingsToMain(false);
    if (lastBoundVideo) clearInterval(poll);
  }, 800);
  setTimeout(() => clearInterval(poll), 20000);
})();
