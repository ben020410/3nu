'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openCommunity, GAP, DAY } = require('../server/community107.cjs');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), '3nu-stats-period-'));
  const file = path.join(directory, 'community.sqlite');
  let time = Date.parse('2026-11-02T10:00:00+09:00');
  const store = openCommunity(file, { now: () => time, environment: 'test' });
  t.after(() => { store.close(); fs.rmSync(directory, {recursive: true, force: true}); });
  return {
    store, file,
    at: date => { time = Date.parse(date); },
    after: ms => { time += ms; },
    track: (id, kind, excluded = false) => store.track(id, {
      tab: 'periodTab', kind, visible: kind !== 'leave'
    }, excluded)
  };
}

test('all time starts at the first included KST day, deduplicates browsers and fills empty days', t => {
  const f = fixture(t);
  assert.equal(f.store.stats('all').fromDate, null);
  f.track('excluded', 'title', true);
  assert.deepEqual(f.store.stats('all').daily, []);
  const other = openCommunity(f.file, {now: () => Date.parse('2026-11-01T08:00:00+09:00'), environment: 'development'});
  other.track('other-browser', {tab: 'otherTab', kind: 'enter', visible: true});
  other.close();

  f.at('2026-11-08T23:59:55+09:00');
  f.track('visitorA', 'enter');
  f.after(10000);
  f.track('visitorA', 'leave');
  f.at('2026-11-19T00:00:00+09:00');
  f.track('visitorA', 'title');
  f.track('visitorB', 'enter');
  f.after(20000);
  f.track('visitorB', 'leave');
  const stats = f.store.stats('all');
  assert.equal(stats.fromDate, '2026-11-08');
  assert.equal(stats.toDate, '2026-11-19');
  assert.equal(stats.daily.length, 12);
  assert.deepEqual(stats.daily[0], {date: '2026-11-08', visits:1, uniqueVisitors:1, returningVisitors:0, explorations:1, averageActiveMs:10000});
  assert.equal(stats.daily[1].visits, 0);
  assert.equal(stats.visits, 3);
  assert.equal(stats.totalVisits, 3);
  assert.equal(stats.uniqueVisitors, 2);
  assert.equal(stats.returningVisitors, 1);
  assert.equal(stats.explorations, 2);
  assert.equal(stats.averageActiveMs, 15000);
  assert.equal(f.store.stats('1').visits, 2);
  assert.equal(f.store.stats(7).daily.length, 7);
  assert.match(f.store.csv('all'), /"기간 전체","3","2","1","2","15.0"$/);
  assert.throws(() => f.store.stats('garbage'), error => error.status === 400);
});

test('retained day totals and weighted play time are kept; unknown cross-period distinct counts stay unknown', t => {
  const f = fixture(t);
  f.track('visitorA', 'enter');
  f.after(10000); f.track('visitorA', 'leave');
  f.after(GAP + 1); f.track('visitorA', 'title');
  f.after(40 * DAY);
  f.track('visitorA', 'title');
  f.track('visitorB', 'enter');
  f.after(20000); f.track('visitorB', 'leave');
  const before = f.store.stats('all');
  assert.equal(before.uniqueVisitors, 2);
  assert.equal(before.returningVisitors, 1);
  assert.equal(f.store.retention.apply({enabled:true}, {approved:true}).rawVisits, 2);
  const stats = f.store.stats('all');
  assert.deepEqual(stats.daily, before.daily);
  for (const key of ['visits','totalVisits','explorations','averageActiveMs','fromDate','toDate'])
    assert.equal(stats[key], before[key]);
  assert.equal(stats.visits, 4);
  assert.equal(stats.averageActiveMs, 15000);
  assert.equal(stats.uniqueVisitors, null);
  assert.equal(stats.returningVisitors, null);
  assert.ok(stats.definitions.archived);
  assert.match(f.store.csv('all'), /"기간 전체","4","","","2","15.0"$/);
  assert.equal(f.store.stats(7).uniqueVisitors, 2);
  assert.equal(f.store.stats(7).returningVisitors, 1);
});

test('an archived-only day retains exact browser counts and date when raw logs have been removed', t => {
  const f = fixture(t);
  f.track('archiveA', 'title');
  f.track('archiveB', 'title');
  f.after(40 * DAY);
  f.store.retention.apply({enabled:true}, {approved:true});
  const stats = f.store.stats('all');
  assert.equal(stats.fromDate, '2026-11-02');
  assert.equal(stats.visits, 2);
  assert.equal(stats.uniqueVisitors, 2);
  assert.equal(stats.returningVisitors, 0);
  assert.equal(stats.explorations, 0);
  assert.equal(stats.averageActiveMs, 0);
  assert.equal(stats.daily.at(-1).visits, 0);
});
