/* Entry geometry and tab-local mobile recovery. Only save a settled player pose. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.CampusSession126 = api;
})(globalThis, () => {
  const key = '3nu.mobilePose126';
  const maxAge = 6 * 60 * 60 * 1000;
  function inCampus(point, bounds) {
    return point && Number.isFinite(point.x) && Number.isFinite(point.z) &&
      point.x >= bounds[0] + 1 && point.x <= bounds[2] - 1 &&
      point.z >= bounds[1] + 1 && point.z <= bounds[3] - 1;
  }
  function readPose(storage, bounds, world, now = Date.now()) {
    try {
      const p = JSON.parse(storage.getItem(key));
      if (!inCampus(p, bounds) || ![p.y, p.yaw, p.pitch, p.facing, p.at].every(Number.isFinite) ||
          now < p.at || now - p.at > maxAge || p.y > 600 || typeof p.flying !== 'boolean') return null;
      const feet = p.y - .95, floor = world.floorAt(p.x, p.z, feet);
      if (!Number.isFinite(floor) || feet < floor - .3 ||
          (!p.flying && (Math.abs(feet - floor) > .55 || world.blocked(p.x, p.z, .42, floor)))) return null;
      return {...p, y: p.flying ? Math.max(p.y, floor + .95) : floor + .95};
    } catch { return null; }
  }
  function entry(nav, world) {
    const params = new URLSearchParams(location.search);
    const diagnostic = [...params.keys()].some(k => /^(spawn|review|bake|audit|qa|debug)/.test(k));
    if (diagnostic) return null;
    const invite = window.PhotoReply126?.entryPoint?.();
    if (inCampus(invite, nav.bounds)) return {kind:'photo', ...invite};
    if (matchMedia('(pointer:coarse)').matches) {
      let pose;
      try { pose = readPose(sessionStorage, nav.bounds, world); } catch {}
      if (pose) return {kind:'resume', ...pose};
    }
    const [x,z] = nav.outdoor.lawn.center;
    return {kind:'lawn', x, z};
  }
  function lawnPose(bags, lawn, world) {
    for (const bag of bags) {
      const away = Math.atan2(bag.x - lawn.center[0], bag.z - lawn.center[1]);
      for (const turn of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
        const angle = away + turn, x = bag.x + Math.sin(angle) * 2.15, z = bag.z + Math.cos(angle) * 2.15;
        const floor = world.floorAt(x, z, bag.y);
        if (!Number.isFinite(floor) || Math.abs(floor - bag.y) > .18 || world.blocked(x,z,.48,floor) ||
            bags.some(other => other !== bag && Math.hypot(x - other.x, z - other.z) < 1.1)) continue;
        // Frame the nearest seat beside the avatar so its surface stays tappable.
        const facing = Math.atan2(bag.x-x, bag.z-z);
        return {x, z, y:floor + .95, facing, yaw:facing + .72};
      }
    }
    return null;
  }
  function attach({engine, scene, residency, state, restorePage}) {
    let lastCheck = -Infinity, previous = '', lost = false, timer, panel;
    const events = new AbortController(), options = {signal:events.signal};
    function checkpoint(now, force = false) {
      if (!force && now-lastCheck < 4000) return;
      lastCheck = now;
      const pose = state();
      if (!pose) return;
      const encoded = JSON.stringify(pose);
      if (!force && encoded === previous) return;
      try { sessionStorage.setItem(key, JSON.stringify({...pose, at:Date.now()})); previous = encoded; } catch {}
    }
    function clear() { try { sessionStorage.removeItem(key); } catch {} previous = ''; }
    function visibility() {
      if (document.hidden) checkpoint(performance.now(), true);
      residency?.pause(document.hidden || lost);
    }
    function contextLost() {
      if (!state() && !document.body.classList.contains('playing')) return;
      lost = true;
      checkpoint(performance.now(), true);
      residency?.pause(true);
      if (!panel) {
        panel = document.createElement('section');
        panel.setAttribute('role','status');
        panel.style.cssText='position:fixed;inset:0;z-index:99999;background:#f7f6ef;color:#173e42;display:grid;align-content:center;justify-items:center;gap:12px;padding:24px;text-align:center;font:16px system-ui';
        const label = document.createElement('strong'), detail = document.createElement('span'), retry = document.createElement('button');
        label.textContent = '탐방 화면을 복구하고 있어요';
        detail.textContent = '잠시만 기다려 주세요.';
        retry.type = 'button'; retry.textContent = '다시 열기'; retry.hidden = true;
        retry.onclick = () => location.reload();
        panel.append(label, detail, retry); document.body.append(panel);
        timer = setTimeout(() => {detail.textContent = '화면이 돌아오지 않으면 캠퍼스를 다시 열어 주세요.'; retry.hidden = false;}, 5000);
      }
    }
    function contextRestored() {
      if (!lost) return;
      lost = false;
      residency?.pause(document.hidden);
      scene.onAfterRenderObservable.addOnce(() => {
        if (lost) return;
        clearTimeout(timer); panel?.remove(); panel = null;
      });
      engine.resize();
    }
    document.addEventListener('visibilitychange', visibility, options);
    window.addEventListener('pagehide', () => {checkpoint(performance.now(), true); residency?.pause(true);}, options);
    window.addEventListener('pageshow', e => {visibility(); if (e.persisted) {engine.resize(); restorePage();}}, options);
    engine.onContextLostObservable.add(contextLost);
    engine.onContextRestoredObservable.add(contextRestored);
    scene.onDisposeObservable.addOnce(() => {events.abort();clearTimeout(timer);panel?.remove();engine.onContextLostObservable.removeCallback(contextLost);engine.onContextRestoredObservable.removeCallback(contextRestored);});
    return {checkpoint, clear};
  }
  return {entry, readPose, lawnPose, attach};
});
