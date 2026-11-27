(() => {
  // extensao-src/entries/player_main.entry.js
  (function() {
    if (window.__QG_PLAYER_MAIN_INSTALLED__) return;
    window.__QG_PLAYER_MAIN_INSTALLED__ = true;
    let desiredSpeed = 1;
    let forceMaxQuality = true;
    let manualSpeedOverride = false;
    let manualQualityOverride = false;
    let lastBoundVideo = null;
    let lastQualityApplied = null;
    let isApplyingInternally = false;
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
    function applySpeedControl(force = false) {
      if (manualSpeedOverride && !force) return;
      const speed = clampSpeed(desiredSpeed);
      const video = getVideoEl();
      const plyr = getPlyrInstance();
      isApplyingInternally = true;
      try {
        const plyrSpeedOptions = plyr?.config?.speed?.options || plyr?.options?.speed;
        const hasPresetOption = Array.isArray(plyrSpeedOptions) && plyrSpeedOptions.some((opt) => Math.abs(Number(opt) - speed) <= 5e-3);
        if (plyr && typeof plyr.speed === "number" && hasPresetOption) {
          try {
            if (Math.abs(Number(plyr.speed) - speed) > 5e-3) {
              plyr.speed = speed;
            }
          } catch (_) {
          }
        }
        if (video) {
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
    function applyMaxQualityControl(force = false) {
      if (!forceMaxQuality || manualQualityOverride && !force) return;
      const hls = getHlsInstance();
      const plyr = getPlyrInstance();
      isApplyingInternally = true;
      try {
        let maxHeight = 0;
        let maxIdx = -1;
        if (hls && !hls.__qgManifestHooked && typeof hls.on === "function") {
          hls.__qgManifestHooked = true;
          try {
            const manifestEvt = window.Hls?.Events?.MANIFEST_PARSED || "hlsManifestParsed";
            hls.on(manifestEvt, () => applyMaxQualityControl(false));
          } catch (_) {
          }
        }
        if (hls && Array.isArray(hls.levels) && hls.levels.length > 0) {
          let bestBitrate = -1;
          hls.levels.forEach((lvl, idx) => {
            const h = Number(lvl?.height) || 0;
            const b = Number(lvl?.bitrate) || 0;
            if (h > maxHeight || h === maxHeight && b > bestBitrate) {
              maxHeight = h;
              bestBitrate = b;
              maxIdx = idx;
            }
          });
          if (maxIdx >= 0) {
            try {
              if (hls.currentLevel !== maxIdx) hls.currentLevel = maxIdx;
              if (hls.nextLevel !== maxIdx) hls.nextLevel = maxIdx;
              if (hls.loadLevel !== maxIdx) hls.loadLevel = maxIdx;
            } catch (_) {
            }
          }
        }
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
        const targetQuality = maxHeight > 0 ? maxHeight : bestBtnHeight;
        if (targetQuality > 0) {
          if (plyr && "quality" in plyr && Number(plyr.quality) !== targetQuality) {
            try {
              plyr.quality = targetQuality;
            } catch (_) {
            }
          }
          if (bestBtn && bestBtn.getAttribute("aria-checked") !== "true" && lastQualityApplied !== targetQuality) {
            lastQualityApplied = targetQuality;
            try {
              bestBtn.click();
            } catch (_) {
            }
          }
        }
      } finally {
        setTimeout(() => {
          isApplyingInternally = false;
        }, 120);
      }
    }
    function applyAll(force = false) {
      applySpeedControl(force);
      applyMaxQualityControl(force);
    }
    function bindVideoAndMenus() {
      const video = getVideoEl();
      if (video && video !== lastBoundVideo) {
        lastBoundVideo = video;
        manualSpeedOverride = false;
        manualQualityOverride = false;
        lastQualityApplied = null;
        ["loadedmetadata", "canplay", "playing", "play"].forEach((evtName) => {
          video.addEventListener(evtName, () => applyAll(false));
        });
        video.addEventListener("ratechange", () => {
          if (isApplyingInternally || manualSpeedOverride) return;
          const target = clampSpeed(desiredSpeed);
          if (Math.abs((video.playbackRate || 1) - target) > 5e-3) {
            applySpeedControl(false);
          }
        });
        applyAll(false);
      }
    }
    document.addEventListener("click", (e) => {
      if (isApplyingInternally || !e.isTrusted) return;
      const speedBtn = e.target?.closest?.('[data-plyr="speed"]');
      if (speedBtn) {
        manualSpeedOverride = true;
        return;
      }
      const qualBtn = e.target?.closest?.('[data-plyr="quality"]');
      if (qualBtn) {
        manualQualityOverride = true;
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
        if (speedChanged || msg.payload.force) {
          manualSpeedOverride = false;
        }
        if (msg.payload.force) {
          manualQualityOverride = false;
          lastQualityApplied = null;
        }
        applyAll(Boolean(msg.payload.force));
      }
    });
    const observer = new MutationObserver(() => bindVideoAndMenus());
    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    let polls = 0;
    const bootTimer = setInterval(() => {
      polls++;
      bindVideoAndMenus();
      applyAll(false);
      if (polls >= 30) clearInterval(bootTimer);
    }, 500);
  })();
})();
