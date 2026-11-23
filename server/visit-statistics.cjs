'use strict';

const DAY = 86400000;
const KST = 9 * 3600000;
const kstMidnight = time => Math.floor((time + KST) / DAY) * DAY - KST;
const dateLabel = time => new Date(time + KST).toISOString().slice(0, 10);

// A raw range has browser IDs; a retained day only has its own distinct counts.
function distinctCount(parts, field) {
  const nonempty = parts.filter(part => part[field] > 0);
  if (nonempty.length > 1) return null;
  return nonempty.length ? nonempty[0][field] : 0;
}

function merge(parts) {
  const sum = field => parts.reduce((value, part) => value + part[field], 0);
  const explorations = sum('explorations');
  return {
    visits: sum('visits'),
    uniqueVisitors: distinctCount(parts, 'uniqueVisitors'),
    returningVisitors: distinctCount(parts, 'returningVisitors'),
    explorations,
    averageActiveMs: explorations ? Math.floor(sum('activeMs') / explorations) : 0
  };
}

function visitStatistics(db, environment, days, now) {
  const today = kstMidnight(now);
  const end = today + DAY;
  const totalVisits = db.prepare(`
    SELECT (SELECT count(*) FROM visits WHERE environment=? AND excluded=0)
         + (SELECT coalesce(sum(visits), 0) FROM analytics_daily112 WHERE environment=?) AS total
  `).get(environment, environment).total;
  let start = today;
  if (days === 'all') {
    const first = db.prepare(`
      SELECT min(first) AS first FROM (
        SELECT min(start) AS first FROM visits WHERE environment=? AND excluded=0 AND start<?
        UNION ALL
        SELECT min(day) AS first FROM analytics_daily112 WHERE environment=? AND visits>0 AND day<?
      )
    `).get(environment, end, environment, end).first;
    if (first === null) return { ...merge([]), totalVisits, fromDate: null, toDate: dateLabel(today), daily: [] };
    start = kstMidnight(first);
  } else {
    start -= (days - 1) * DAY;
  }
  const counts = `count(*) AS visits, count(DISTINCT visitor) AS uniqueVisitors,
    count(DISTINCT CASE WHEN returning_visit=1 THEN visitor END) AS returningVisitors,
    coalesce(sum(explored), 0) AS explorations,
    coalesce(sum(CASE WHEN explored=1 THEN active_ms ELSE 0 END), 0) AS activeMs`;
  const filter = 'FROM visits WHERE environment=? AND excluded=0 AND start>=? AND start<?';
  const args = [environment, start, end];
  const raw = db.prepare(`SELECT ${counts} ${filter}`).get(...args);
  const rawDays = db.prepare(`SELECT ((start+${KST})/${DAY})*${DAY}-${KST} AS day,
    ${counts} ${filter} GROUP BY day`).all(...args);
  const archived = db.prepare(`SELECT day, visits, unique_visitors AS uniqueVisitors,
    returning_visitors AS returningVisitors, explorations, active_ms AS activeMs
    FROM analytics_daily112 WHERE environment=? AND day>=? AND day<? AND visits>0`).all(...args);
  const daysWithData = new Map(rawDays.map(row => [row.day, [row]]));
  for (const row of archived) {
    if (daysWithData.has(row.day)) daysWithData.get(row.day).push(row);
    else daysWithData.set(row.day, [row]);
  }
  const daily = [];
  for (let day = start; day < end; day += DAY) {
    daily.push({ date: dateLabel(day), ...merge(daysWithData.get(day) || []) });
  }
  return { ...merge([raw, ...archived]), totalVisits, fromDate: dateLabel(start), toDate: dateLabel(today), daily };
}

module.exports = { visitStatistics };
