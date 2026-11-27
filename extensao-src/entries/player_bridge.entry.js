// Bridge dentro do iframe de vídeo (BunnyCDN / mediadelivery.net) — #1
(function () {
  const SPEED_KEY = 'qg_player_target_speed';
  const SEEK_KEY = 'qg_player_pending_seek';
  const RESUME_KEY = 'qg_video_resume_positions';

  let currentVideo = null;
  let targetSpeed = 1;
  let pendingSeekSec = 0;
  let speedLockUntil = 0;
  let lastResumeSavedAt = 0;

  const isContextValid = () => {
    try {
      return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage?.local);
    } catch (_) {
      return false;
    }
  };

  const getVideoKey = () => {
    try {
      const u = new URL(window.location.href);
      return u.pathname.replace(/[^a-zA-Z0-9/_-]/g, '').slice(-80) || 'default_video';
    } catch (_) {
      return 'default_video';
    }
  };

  function applySpeedToVideo(video, speed) {
    if (!video || !Number.isFinite(speed) || speed < 0.5 || speed > 4) return;
    try {
      if (Math.abs((video.playbackRate || 1) - speed) > 0.01) {
        video.playbackRate = speed;
        video.defaultPlaybackRate = speed;
      }
    } catch (_) {}
  }

  function tryApplyPendingSeek(video) {
    if (!video || !pendingSeekSec || pendingSeekSec <= 0) return;
    try {
      if (video.readyState >= 1) {
        const dur = Number(video.duration);
        const safeSec = Number.isFinite(dur) && dur > 0 ? Math.min(dur - 1, pendingSeekSec) : pendingSeekSec;
        if (safeSec > 0) {
          video.currentTime = safeSec;
          pendingSeekSec = 0;
          if (isContextValid()) {
            chrome.storage.local.remove([SEEK_KEY]).catch(() => {});
          }
        }
      }
    } catch (_) {}
  }

  function saveResumePosition(video) {
    if (!video || !isContextValid()) return;
    const now = Date.now();
    if (now - lastResumeSavedAt < 10000) return;
    const cur = Math.floor(Number(video.currentTime) || 0);
    const dur = Math.floor(Number(video.duration) || 0);
    if (cur < 5 || (dur > 0 && cur >= dur - 5)) return;
    lastResumeSavedAt = now;
    try {
      const key = getVideoKey();
      chrome.storage.local.get([RESUME_KEY], (res) => {
        if (chrome.runtime?.lastError || !isContextValid()) return;
        const map = (res?.[RESUME_KEY] && typeof res[RESUME_KEY] === 'object') ? { ...res[RESUME_KEY] } : {};
        map[key] = { currentTime: cur, duration: dur, updatedAt: now };
        const entries = Object.entries(map).sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0)).slice(0, 80);
        chrome.storage.local.set({ [RESUME_KEY]: Object.fromEntries(entries) }).catch(() => {});
      });
    } catch (_) {}
  }

  function bindVideo(video) {
    if (!video || currentVideo === video) return;
    currentVideo = video;

    if (targetSpeed !== 1) {
      speedLockUntil = Date.now() + 8000;
      applySpeedToVideo(video, targetSpeed);
    }
    tryApplyPendingSeek(video);

    video.addEventListener('loadedmetadata', () => {
      if (targetSpeed !== 1) {
        speedLockUntil = Date.now() + 6000;
        applySpeedToVideo(video, targetSpeed);
      }
      tryApplyPendingSeek(video);
    });

    video.addEventListener('canplay', () => {
      tryApplyPendingSeek(video);
    });

    video.addEventListener('play', () => {
      if (targetSpeed !== 1 && Date.now() < speedLockUntil) {
        applySpeedToVideo(video, targetSpeed);
      }
      tryApplyPendingSeek(video);
    });

    video.addEventListener('ratechange', () => {
      if (targetSpeed !== 1 && Date.now() < speedLockUntil && Math.abs((video.playbackRate || 1) - targetSpeed) > 0.01) {
        applySpeedToVideo(video, targetSpeed);
      }
    });

    video.addEventListener('timeupdate', () => {
      if (!video.paused) saveResumePosition(video);
    });

    video.addEventListener('ended', () => {
      if (!isContextValid()) return;
      try {
        chrome.runtime.sendMessage({
          type: 'PLAYER_VIDEO_ENDED',
          payload: { duration: Number(video.duration) || 0, src: window.location.href },
        }).catch(() => {});
      } catch (_) {}
    });
  }

  let scanIntervalId = null;
  function scanForVideo() {
    if (!isContextValid()) {
      try { observer.disconnect(); } catch (_) {}
      if (scanIntervalId) {
        clearInterval(scanIntervalId);
        scanIntervalId = null;
      }
      return;
    }
    const vid = document.querySelector('video');
    if (vid) bindVideo(vid);
  }

  function loadPlayerPrefs() {
    if (!isContextValid()) return;
    try {
      chrome.storage.local.get([SPEED_KEY, SEEK_KEY], (res) => {
        if (chrome.runtime?.lastError || !isContextValid()) return;
        const refCourseId = String(document.referrer || '').match(/\/courses\/(\d+)/i)?.[1] || '';
        const speedObj = res?.[SPEED_KEY];
        const speedCourseId = speedObj?.courseId ? String(speedObj.courseId) : '';
        if (
          speedObj &&
          (!speedCourseId || !refCourseId || speedCourseId === refCourseId) &&
          Number(speedObj.speed) >= 0.5 &&
          (Date.now() - (Number(speedObj.updatedAt) || 0)) < 3600000
        ) {
          targetSpeed = Number(speedObj.speed);
          if (currentVideo) {
            speedLockUntil = Date.now() + 6000;
            applySpeedToVideo(currentVideo, targetSpeed);
          }
        }
        const seekObj = res?.[SEEK_KEY];
        const seekCourseId = seekObj?.courseId ? String(seekObj.courseId) : '';
        if (
          seekObj &&
          (!seekCourseId || !refCourseId || seekCourseId === refCourseId) &&
          Number(seekObj.seconds) > 0 &&
          (Date.now() - (Number(seekObj.savedAt) || 0)) < 90000
        ) {
          pendingSeekSec = Number(seekObj.seconds);
          if (currentVideo) tryApplyPendingSeek(currentVideo);
        }
      });
    } catch (_) {}
  }

  loadPlayerPrefs();

  if (isContextValid() && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !isContextValid()) return;
      if (changes[SPEED_KEY]?.newValue) {
        const sp = changes[SPEED_KEY].newValue;
        const refCourseId = String(document.referrer || '').match(/\/courses\/(\d+)/i)?.[1] || '';
        const speedCourseId = sp?.courseId ? String(sp.courseId) : '';
        if (speedCourseId && refCourseId && speedCourseId !== refCourseId) return;
        const nextSpd = Number(sp.speed);
        if (Number.isFinite(nextSpd) && nextSpd >= 0.5 && nextSpd <= 4) {
          targetSpeed = nextSpd;
          speedLockUntil = Date.now() + 6000;
          if (currentVideo) applySpeedToVideo(currentVideo, targetSpeed);
        }
      }
      if (changes[SEEK_KEY]?.newValue) {
        const s = changes[SEEK_KEY].newValue;
        const refCourseId = String(document.referrer || '').match(/\/courses\/(\d+)/i)?.[1] || '';
        const seekCourseId = s?.courseId ? String(s.courseId) : '';
        if (seekCourseId && refCourseId && seekCourseId !== refCourseId) return;
        if (Number(s.seconds) > 0 && (Date.now() - (Number(s.savedAt) || 0)) < 90000) {
          pendingSeekSec = Number(s.seconds);
          if (currentVideo) tryApplyPendingSeek(currentVideo);
        }
      }
    });
  }

  if (isContextValid() && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg || !isContextValid()) return;
      if (msg.type === 'APPLY_PLAYER_SPEED' && Number(msg.payload?.speed) >= 0.5) {
        targetSpeed = Number(msg.payload.speed);
        speedLockUntil = Date.now() + 6000;
        if (currentVideo) applySpeedToVideo(currentVideo, targetSpeed);
      }
      if (msg.type === 'SEEK_VIDEO_TO' && Number(msg.payload?.seconds) > 0) {
        pendingSeekSec = Number(msg.payload.seconds);
        if (currentVideo) tryApplyPendingSeek(currentVideo);
      }
    });
  }

  const observer = new MutationObserver(() => scanForVideo());
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  scanForVideo();
  scanIntervalId = setInterval(scanForVideo, 1500);
})();
