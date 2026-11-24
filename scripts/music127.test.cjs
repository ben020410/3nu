'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const controller = fs.readFileSync('dist/campus-music127.js', 'utf8');
const key = '3nu.music127';

function visit(storage = new Map(), responseOK = true, graph = false) {
  const document = new EventTarget();
  document.baseURI = 'http://localhost/';
  const window = new EventTarget();
  const requests = [], players = [], ramps = [];
  if (graph) window.AudioContext = class {
    state = 'running';
    currentTime = 0;
    createMediaElementSource() { return {connect() {}}; }
    createGain() { return {connect() {}, gain: {value: 0, cancelAndHoldAtTime() {},
      setValueAtTime(value) { ramps.push(value); }, linearRampToValueAtTime(value) { ramps.push(value); }}}; }
    close() { return Promise.resolve(); }
  };
  class Audio {
    constructor() { players.push(this); }
    paused = true;
    readyState = 4;
    src = '';
    async play() { this.paused = false; this.onplaying?.(); }
    pause() { this.paused = true; this.onpause?.(); }
    removeAttribute() { this.src = ''; }
    load() {}
  }
  vm.runInNewContext(controller, {
    window, document, Audio, URL, CustomEvent, AbortController, DOMException, setTimeout, clearTimeout,
    localStorage: {getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v)},
    fetch: async url => {
      requests.push(url.href);
      return {ok: responseOK, blob: async () => new Blob(['music'], {type: 'audio/mp4'})};
    },
  });
  return {music: window.CampusMusic127, requests, players, ramps};
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('a new visitor hears music on entry, including after the title gesture and game startup are separated', async () => {
  const {music, requests} = visit();
  assert.equal(music.isEnabled(), true);
  music.prepareEntry();
  await settle();
  assert.equal(requests.length, 0);
  music.enter();
  await settle();
  assert.equal(requests.length, 1);
  assert.equal(music.getState(), 'playing');
  music.leave();
  assert.equal(music.getState(), 'waiting');
  music.enter();
  await settle();
  assert.equal(music.getState(), 'playing');
  assert.equal(requests.length, 1);
});

test('a saved mute survives entry and reload, and explicit unmuting starts playback', async () => {
  const preference = new Map();
  visit(preference).music.setEnabled(false);
  assert.equal(preference.get(key), 'off');
  const {music, requests} = visit(preference);
  music.prepareEntry();
  music.enter();
  await settle();
  assert.equal(music.getState(), 'off');
  assert.equal(requests.length, 0);
  music.setEnabled(true);
  await settle();
  assert.equal(preference.get(key), 'on');
  assert.equal(music.getState(), 'playing');
});

test('an unavailable soundtrack does not save a permanent opt-out', async () => {
  const preference = new Map();
  const {music} = visit(preference, false);
  music.enter();
  await settle();
  assert.equal(music.getState(), 'error');
  assert.equal(preference.has(key), false);
  assert.equal(visit(preference).music.isEnabled(), true);
});

for (const graph of [false, true]) {
  test('five audible steps and last volume survive mute, slider zero and reload, audio graph ' + graph, async () => {
    const store = new Map();
    const first = visit(store, true, graph), music = first.music;
    assert.equal(music.getVolume(), 5);
    music.enter();
    await settle();
    const applied = () => graph ? first.ramps.at(-1) : first.players.at(-1).volume;
    const gains = [];
    for (const level of [1, 2, 3, 4, 5]) {
      assert.equal(music.setVolume(level), level);
      gains.push(applied());
    }
    assert(gains.every((gain, i) => gain > 0 && (!i || gain > gains[i - 1])));
    assert.equal(first.requests.length, 1);
    music.setVolume(4);
    music.setEnabled(false);
    music.setEnabled(true);
    await settle();
    assert.equal(music.getVolume(), 4);
    assert.equal(applied(), gains[3]);
    music.setVolume(0);
    const next = visit(store, true, graph);
    next.music.enter();
    assert.equal(next.music.getVolume(), 0);
    assert.equal(next.requests.length, 0);
    next.music.setEnabled(true);
    await settle();
    assert.equal(next.music.getVolume(), 4);
    assert.equal(graph ? next.ramps.at(-1) : next.players[0].volume, gains[3]);
    next.music.setVolume(0);
    assert.equal(next.music.setVolume(2), 2);
    await settle();
    assert.equal(next.music.getState(), 'playing');
    assert.equal(visit(store).music.getVolume(), 2);
  });
}
test('old mute persists and invalid saved levels fall back to the default', () => {
  const legacy = visit(new Map([[key, 'off'], [key + '.volume', '9']])).music;
  assert.equal(legacy.getVolume(), 0);
  legacy.setEnabled(true);
  assert.equal(legacy.getVolume(), 5);
  for (const invalid of [2.5, 7, 'abc', -1]) assert.equal(legacy.setVolume(invalid), 5);
});
