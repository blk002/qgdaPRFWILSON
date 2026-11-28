(() => {
  // extensao-src/entries/player_main.entry.js
  (function() {
    if (window.__QG_PLAYER_MAIN_INSTALLED__) return;
    window.__QG_PLAYER_MAIN_INSTALLED__ = true;
    let desiredSpeed = 1;
    let forceMaxQuality = true;
    let manualSpeedOverride = false;
    let manualQualityOverride = false;
    let qualityLockedForVideo = false;
    let lastBoundVideo = null;
    let isApplyingInternally = false;
    let observer = null;
    let bootTimer = null;
    let pendingSeekSec = null;
    let pendingSeekExpiresAt = 0;
    function applyPendingSeekToPlayer() {
      if (!pendingSeekSec || Date.now() > pendingSeekExpiresAt) {
        pendingSeekSec = null;
        return;
      }
      const video = getVideoEl();
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0 || pendingSeekSec >= video.duration) return;
      if (Math.abs(video.currentTime - pendingSeekSec) <= 3) {
        pendingSeekSec = null;
        return;
      }
      const plyr = getPlyrInstance();
      isApplyingInternally = true;
      try {
        if (plyr && typeof plyr.currentTime === "number") {
          plyr.currentTime = pendingSeekSec;
        }
        video.currentTime = pendingSeekSec;
        video.play?.().catch(() => {
        });
      } catch (_) {
      } finally {
        setTimeout(() => {
          isApplyingInternally = false;
        }, 120);
      }
    }
    function notifyManualSpeedOverride(active) {
      try {
        window.postMessage(
          {
            source: "QG_PLAYER_MAIN",
            type: "QG_MANUAL_SPEED_OVERRIDE",
            payload: { active: Boolean(active) }
          },
          window.location.origin
        );
      } catch (_) {
      }
    }
    function clampSpeed(val) {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0.5 || n > 4) return 1;
      return Math.round(n * 100) / 100;
    }
    function getVideoEl() {
      return document.querySelector("video");
    }
    function getPlyrInstance() {
      if (window.plyr && typeof window.plyr === "object") return window.plyr;
      if (window.player && typeof window.player === "object") return window.player;
      const plyrEl = document.querySelector(".plyr");
      if (plyrEl && plyrEl.plyr) return plyrEl.plyr;
      return null;
    }
    function getHlsInstance() {
      if (window.hls && Array.isArray(window.hls.levels)) return window.hls;
      const plyr = getPlyrInstance();
      if (plyr && plyr.hls && Array.isArray(plyr.hls.levels)) return plyr.hls;
      return null;
    }
    function applySpeedControl(forceSpeed = false) {
      if (manualSpeedOverride && !forceSpeed) return;
      const speed = clampSpeed(desiredSpeed);
      const video = getVideoEl();
      const plyr = getPlyrInstance();
      const rateMatches = !video || Math.abs((video.playbackRate || 1) - speed) <= 5e-3 && Math.abs((video.defaultPlaybackRate || 1) - speed) <= 5e-3;
      const plyrSpeedOptions = plyr?.config?.speed?.options || plyr?.options?.speed;
      const hasPresetOption = Array.isArray(plyrSpeedOptions) && plyrSpeedOptions.some((opt) => Math.abs(Number(opt) - speed) <= 5e-3);
      const plyrMatches = !plyr || typeof plyr.speed !== "number" || !hasPresetOption || Math.abs(Number(plyr.speed) - speed) <= 5e-3;
      if (rateMatches && plyrMatches) return;
      isApplyingInternally = true;
      try {
        if (!plyrMatches) {
          try {
            plyr.speed = speed;
          } catch (_) {
          }
        }
        if (video && !rateMatches) {
          try {
            if (Math.abs((video.defaultPlaybackRate || 1) - speed) > 5e-3) {
              video.defaultPlaybackRate = speed;
            }
            if (Math.abs((video.playbackRate || 1) - speed) > 5e-3) {
              video.playbackRate = speed;
            }
          } catch (_) {
          }
        }
      } finally {
        setTimeout(() => {
          isApplyingInternally = false;
        }, 120);
      }
    }
    function applyMaxQualityOnce() {
      if (qualityLockedForVideo || !forceMaxQuality || manualQualityOverride) return;
      const hls = getHlsInstance();
      if (hls && !hls.__qgManifestHooked && typeof hls.on === "function") {
        hls.__qgManifestHooked = true;
        try {
          const manifestEvt = window.Hls?.Events?.MANIFEST_PARSED || "hlsManifestParsed";
          hls.on(manifestEvt, () => applyMaxQualityOnce());
        } catch (_) {
        }
      }
      if (!hls || !Array.isArray(hls.levels) || hls.levels.length === 0) return;
      let maxHeight = 0;
      let bestBitrate = -1;
      let maxIdx = -1;
      hls.levels.forEach((lvl, idx) => {
        const h = Number(lvl?.height) || 0;
        const b = Number(lvl?.bitrate) || 0;
        if (h > maxHeight || h === maxHeight && b > bestBitrate) {
          maxHeight = h;
          bestBitrate = b;
          maxIdx = idx;
        }
      });
      if (maxIdx < 0) return;
      const qButtons = Array.from(document.querySelectorAll('[data-plyr="quality"]'));
      let bestBtn = null;
      let bestBtnHeight = 0;
      qButtons.forEach((btn) => {
        const val = Number(btn.getAttribute("value"));
        if (Number.isFinite(val) && val > bestBtnHeight) {
          bestBtnHeight = val;
          bestBtn = btn;
        }
      });
      qualityLockedForVideo = true;
      isApplyingInternally = true;
      try {
        if (bestBtn) {
          if (bestBtn.getAttribute("aria-checked") !== "true") {
            try {
              bestBtn.click();
            } catch (_) {
            }
          }
        } else if (hls.autoLevelEnabled || hls.loadLevel !== maxIdx) {
          const video = getVideoEl();
          try {
            if (hls.nextLevel !== maxIdx) hls.nextLevel = maxIdx;
            if (hls.loadLevel !== maxIdx) hls.loadLevel = maxIdx;
            if ((!video || video.paused || video.currentTime < 1) && hls.currentLevel !== maxIdx) {
              hls.currentLevel = maxIdx;
            }
          } catch (_) {
          }
        }
        if (pendingSeekSec > 0) {
          setTimeout(applyPendingSeekToPlayer, 350);
        }
      } finally {
        setTimeout(() => {
          isApplyingInternally = false;
        }, 120);
      }
      maybeStopBootWatchers();
    }
    function maybeStopBootWatchers() {
      if (lastBoundVideo && (qualityLockedForVideo || !forceMaxQuality)) {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (bootTimer) {
          clearInterval(bootTimer);
          bootTimer = null;
        }
      }
    }
    function bindVideoAndMenus() {
      const video = getVideoEl();
      if (video && video !== lastBoundVideo) {
        lastBoundVideo = video;
        manualSpeedOverride = false;
        manualQualityOverride = false;
        qualityLockedForVideo = false;
        notifyManualSpeedOverride(false);
        ["loadedmetadata", "canplay", "playing", "play"].forEach((evtName) => {
          video.addEventListener(evtName, () => {
            if (pendingSeekSec > 0) applyPendingSeekToPlayer();
            if (manualSpeedOverride) return;
            const speed = clampSpeed(desiredSpeed);
            if (Math.abs((video.playbackRate || 1) - speed) > 5e-3) {
              applySpeedControl(false);
            }
          });
        });
        video.addEventListener("ratechange", () => {
          if (isApplyingInternally || manualSpeedOverride) return;
          const speed = clampSpeed(desiredSpeed);
          if (Math.abs((video.playbackRate || 1) - speed) > 5e-3) {
            applySpeedControl(false);
          }
        });
        applySpeedControl(false);
      }
      applyMaxQualityOnce();
      maybeStopBootWatchers();
    }
    document.addEventListener("click", (e) => {
      if (isApplyingInternally || !e.isTrusted) return;
      const speedBtn = e.target?.closest?.('[data-plyr="speed"]');
      if (speedBtn) {
        manualSpeedOverride = true;
        notifyManualSpeedOverride(true);
        return;
      }
      const qualBtn = e.target?.closest?.('[data-plyr="quality"]');
      if (qualBtn) {
        manualQualityOverride = true;
        qualityLockedForVideo = true;
      }
    }, true);
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || msg.source !== "QG_PLAYER_BRIDGE") return;
      if (msg.type === "QG_APPLY_PLAYER_SETTINGS" && msg.payload) {
        const nextSpeed = clampSpeed(msg.payload.speed);
        const speedChanged = Math.abs(nextSpeed - desiredSpeed) > 5e-3;
        desiredSpeed = nextSpeed;
        if (typeof msg.payload.forceMaxQuality === "boolean") {
          forceMaxQuality = msg.payload.forceMaxQuality;
        }
        const forceSpeed = Boolean(msg.payload.forceSpeed || msg.payload.force);
        if (speedChanged || forceSpeed) {
          manualSpeedOverride = false;
          notifyManualSpeedOverride(false);
        }
        applySpeedControl(forceSpeed);
        applyMaxQualityOnce();
      }
      if (msg.type === "QG_SEEK_PLAYER" && msg.payload) {
        const sec = Number(msg.payload.seconds);
        if (Number.isFinite(sec) && sec > 0) {
          pendingSeekSec = sec;
          pendingSeekExpiresAt = Date.now() + 15e3;
          applyPendingSeekToPlayer();
        }
      }
    });
    observer = new MutationObserver(() => bindVideoAndMenus());
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    let polls = 0;
    bootTimer = setInterval(() => {
      polls++;
      bindVideoAndMenus();
      if (polls >= 12) {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        clearInterval(bootTimer);
        bootTimer = null;
      }
    }, 500);
  })();
})();
