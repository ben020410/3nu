"use strict";
const {Problem,DAY,LEASE}=require('./community107.cjs');
const Player=require('../dist/player-state.js');
// Additive side table: old servers ignore it; deleting a retained visit also deletes its name.
function createVisitLog(store,now=()=>Date.now()){
 const db=store.db;
 db.exec(`CREATE TABLE IF NOT EXISTS visit_names123(visit INTEGER PRIMARY KEY REFERENCES visits(id) ON DELETE CASCADE,name TEXT NOT NULL,updated INTEGER NOT NULL)`);
 db.exec(`CREATE TABLE IF NOT EXISTS analytics_options124(key TEXT PRIMARY KEY,value INTEGER NOT NULL CHECK(value IN (0,1)));
 CREATE TABLE IF NOT EXISTS test_visits124(visit INTEGER PRIMARY KEY REFERENCES visits(id) ON DELETE CASCADE);
 INSERT OR IGNORE INTO analytics_options124(key,value) VALUES('excludeTestNickname',1)`);
 function options(){return{enabled:!!db.prepare("SELECT value FROM analytics_options124 WHERE key='excludeTestNickname'").get().value}}
 function setOptions(input){if(typeof input.enabled!=='boolean')throw new Problem(400,'설정을 확인해 주세요.');db.prepare("UPDATE analytics_options124 SET value=? WHERE key='excludeTestNickname'").run(+input.enabled);return options()}
 function remember(visitor,presence){
  if(!presence.visible||!['enter','heartbeat'].includes(presence.kind)||typeof presence.name!=='string')return;
  const name=Player.nickname(presence.name);if(Player.validate(name))return;
  // Exclude this visit only, never every future visit from the same browser.
  // Sticky within the existing 30-minute session, including its title/active time.
  if(name==='테스트'&&options().enabled){
   const r=db.prepare('SELECT r.id FROM visitors v JOIN visits r ON r.id=v.session WHERE v.id=? AND r.environment=?').get(visitor,store.environment);
   if(r&&(presence.kind==='enter'||!db.prepare('SELECT 1 FROM visit_names123 WHERE visit=?').get(r.id))){db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE visits SET excluded=1 WHERE id=?').run(r.id);db.prepare('INSERT OR IGNORE INTO test_visits124(visit) VALUES(?)').run(r.id);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}
  }
  db.prepare(`INSERT INTO visit_names123(visit,name,updated)
   SELECT r.id,?,? FROM visitors v JOIN visits r ON r.id=v.session
   WHERE v.id=? AND r.environment=?
   ON CONFLICT(visit) DO UPDATE SET name=excluded.name,updated=excluded.updated`).run(name,now(),visitor,store.environment);
 }
 function list(params){
  const date=(key,fallback)=>{const s=params.get(key);if(!s)return fallback;const n=Date.parse(s+'T00:00:00+09:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(n)||new Date(n+9*3600000).toISOString().slice(0,10)!==s)throw new Problem(400,'날짜를 확인해 주세요.');return n};
  const start=date('from',0),end=date('to',253402182000000)+DAY;
  if(start>=end)throw new Problem(400,'시작일과 종료일을 확인해 주세요.');
  const cursor=params.get('before'),before=cursor===null?Number.MAX_SAFE_INTEGER:Number(cursor);
  if(!Number.isSafeInteger(before)||before<1)throw new Problem(400,'잘못된 페이지입니다.');
  const excluded=params.get('excluded')||'0';if(!['0','1'].includes(excluded))throw new Problem(400,'제외 조건을 확인해 주세요.');
  const asOf=now(),filter='r.environment=? AND r.start>=? AND r.start<? AND (?=1 OR r.excluded=0)',args=[store.environment,start,end,Number(excluded)];
  const summary=db.prepare(`SELECT count(*) total,min(r.start) oldest FROM visits r WHERE ${filter}`).get(...args);
  const rows=db.prepare(`SELECT r.id,n.name,r.start,r.last,r.explored,r.returning_visit AS returningVisit,r.excluded,EXISTS(SELECT 1 FROM test_visits124 x WHERE x.visit=r.id) AS testVisit,
   r.active_ms+CASE WHEN v.session=r.id THEN max(0,min(?,coalesce((SELECT max(t.last) FROM tabs t WHERE t.visitor=r.visitor AND t.playing=1 AND t.visible=1),-9007199254740991)+?)-v.accounted) ELSE 0 END AS activeMs
   FROM visits r LEFT JOIN visit_names123 n ON n.visit=r.id LEFT JOIN visitors v ON v.id=r.visitor
   WHERE ${filter} AND r.id<? ORDER BY r.id DESC LIMIT 51`).all(asOf,LEASE,...args,before);
  const more=rows.length>50,items=rows.slice(0,50);
  return{items,next:more?items.at(-1).id:null,...summary,asOf,environment:store.environment};
 }
 return{remember,list,options,setOptions};
}
module.exports={createVisitLog};
