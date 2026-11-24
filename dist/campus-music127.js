/* Optional campus soundtrack. Keep the AAC compressed and use the native
   player to decode it as it plays instead of decoding the whole loop in RAM. */
(() => {
  'use strict';
  const preference = '3nu.music127';
  const track = new URL('assets/music127/lawn-afternoon.m4a?v=127-walk110', document.baseURI);
  const volumePreference = '3nu.music127.volume';
  const gains = [0, .10, .19, .30, .46, .64];
  let lastVolume = 5;
  const unlockSound = 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=';
  let enabled = true;
  try {
    enabled = localStorage.getItem(preference) !== 'off';
    const saved = Number(localStorage.getItem(volumePreference));
    if (Number.isInteger(saved) && saved >= 1 && saved <= 5) lastVolume = saved;
  } catch {}
  const getVolume = () => enabled ? lastVolume : 0;
  let state = enabled ? 'waiting' : 'off';
  let audio = null, context = null, gain = null;
  let objectURL = '', download = null, pauseTimer = 0, attempt = 0;
  let started = false, parked = false, inGame = false;

  const canPlay = () => enabled && inGame && !parked && !document.hidden;
  function setState(next, force = false) {
    if (state === next && !force) return;
    state = next;
    window.dispatchEvent(new CustomEvent('campus-music-change', {detail: {enabled, volume: getVolume(), state}}));
  }
  function remember() {
    try {
      localStorage.setItem(volumePreference, String(lastVolume));
      localStorage.setItem(preference, enabled ? 'on' : 'off');
    } catch {}
  }
  function ramp(target, seconds) {
    if (!audio) return;
    if (!gain) {
      audio.volume = target;
      return;
    }
    const now = context.currentTime, parameter = gain.gain;
    if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
    else {
      const previous = parameter.value;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(previous, now);
    }
    if (seconds) parameter.linearRampToValueAtTime(target, now + seconds);
    else parameter.setValueAtTime(target, now);
  }
  function dispose() {
    if (audio) {
      audio.onplaying = audio.onpause = audio.onerror = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio = null;
    }
    if (context) {
      context.onstatechange = null;
      context.close().catch(() => {});
      context = gain = null;
    }
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = '';
  }
  function stopDownload() {
    if (download) download.controller.abort();
    download = null;
  }
  function failed() {
    ++attempt;
    enabled = false; // A playback failure applies only to this visit.
    stopDownload();
    dispose();
    setState('error', true);
  }
  function syncPlayback() {
    if (!canPlay() || !audio || !objectURL || audio.src !== objectURL) return;
    if (context && context.state !== 'running') setState('waiting');
    else if (!audio.paused && audio.readyState >= 2) setState('playing');
  }
  function makePlayer() {
    audio = new Audio();
    audio.preload = 'none';
    audio.onplaying = syncPlayback;
    audio.onpause = () => {
      if (canPlay() && objectURL && audio.src === objectURL) setState('waiting');
    };
    audio.onerror = () => { if (canPlay() && objectURL && audio.src === objectURL) failed(); };
    const AudioGraph = window.AudioContext || window.webkitAudioContext;
    if (AudioGraph) {
      try {
        context = new AudioGraph();
        const mix = context.createGain();
        mix.gain.value = 0;
        context.createMediaElementSource(audio).connect(mix);
        mix.connect(context.destination);
        gain = mix;
        context.onstatechange = syncPlayback;
      } catch {
        context?.close().catch(() => {});
        context = gain = null;
      }
    }
    if (!gain) audio.volume = gains[lastVolume];
  }
  function readyPlayer(fromGesture) {
    if (!audio) makePlayer();
    // A valid Start tap can precede the game by several seconds on a phone.
    // Unlock this element now without requesting the soundtrack on the title.
    if (fromGesture && !objectURL && audio.paused && audio.src !== unlockSound) {
      audio.src = unlockSound;
      audio.play().catch(() => {});
    }
    if (context && context.state !== 'running') context.resume().catch(() => {});
  }
  function prepareEntry() {
    if (!enabled || parked || document.hidden) return;
    try { readyPlayer(true); } catch { failed(); }
  }
  function getTrack() {
    if (download) return download.promise;
    const controller = new AbortController();
    const promise = (async () => {
      const response = await fetch(track, {signal: controller.signal});
      if (!response.ok) throw new Error('Music unavailable');
      const blob = await response.blob();
      if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      objectURL = URL.createObjectURL(blob.type === 'audio/mp4' ? blob : blob.slice(0, blob.size, 'audio/mp4'));
    })().finally(() => {
      if (download?.controller === controller) download = null;
    });
    download = {controller, promise};
    return promise;
  }
  async function start(fromGesture) {
    if (!canPlay() || state === 'playing') return;
    clearTimeout(pauseTimer);
    const current = ++attempt;
    started = true;
    setState('loading');
    try {
      readyPlayer(fromGesture);
      if (!objectURL) await getTrack();
      if (current !== attempt || !canPlay()) return;
      if (audio.src !== objectURL) {
        audio.loop = true;
        audio.src = objectURL;
      }
      ramp(gains[lastVolume], .72);
      await audio.play();
      if (current === attempt) syncPlayback();
    } catch (err) {
      if (current !== attempt || !canPlay()) return;
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') setState('waiting');
      else failed();
    }
  }
  function setEnabled(value) {
    const next = Boolean(value);
    if (enabled === next) {
      if (next && state === 'waiting') start(true);
      return enabled;
    }
    enabled = next;
    remember();
    ++attempt;
    clearTimeout(pauseTimer);
    if (enabled) {
      setState('waiting', true);
      if (canPlay()) start(true);
    } else {
      stopDownload();
      setState('off', true);
      if (audio && !audio.paused && !document.hidden) {
        ramp(0, .24);
        pauseTimer = setTimeout(() => { if (!enabled) dispose(); }, 270);
      } else dispose();
    }
    return enabled;
  }
  function setVolume(value) {
    const step = Number(value);
    if (!Number.isInteger(step) || step < 0 || step > 5) return getVolume();
    if (step === 0) setEnabled(false);
    else {
      const changed = lastVolume !== step;
      lastVolume = step;
      if (!enabled) setEnabled(true);
      else if (changed) {
        remember();
        if (canPlay() && objectURL && audio?.src === objectURL) ramp(gains[step], .12);
        setState(state, true);
      }
    }
    return getVolume();
  }
  function pauseForPage() {
    ++attempt;
    clearTimeout(pauseTimer);
    stopDownload();
    if (!enabled) { dispose(); return; }
    if (audio) {
      ramp(0, 0);
      audio.pause();
      if (context?.state === 'running') context.suspend().catch(() => {});
    }
    setState('waiting');
  }
  function userGesture(event) {
    if (state === 'waiting' && canPlay() && !event.repeat) start(true);
  }
  document.addEventListener('pointerup', userGesture, {capture: true, passive: true});
  document.addEventListener('keydown', userGesture, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseForPage();
    else if (started && canPlay()) start(false);
  });
  window.addEventListener('pagehide', () => { parked = true; pauseForPage(); });
  window.addEventListener('pageshow', () => {
    parked = false;
    if (started && canPlay()) start(false);
  });
  function enter() {
    inGame = true;
    start(true);
  }
  function leave() {
    inGame = false;
    pauseForPage();
  }
  window.CampusMusic127 = {prepareEntry, enter, leave, isEnabled: () => enabled, setEnabled, getVolume, setVolume, getState: () => state};
})();
