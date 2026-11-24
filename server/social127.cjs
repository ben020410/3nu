'use strict';
const {Problem,hash}=require('./community107.cjs');
const DAY=86400000,KST=9*3600000;
// Separate from the optional visit archive policy: chat bodies expire after 30 days.
function createSocial127(store,now=Date.now){
 const {db,environment}=store;
 db.exec(`CREATE TABLE IF NOT EXISTS chat127(id INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,at INTEGER NOT NULL,name TEXT NOT NULL,channel TEXT NOT NULL,body TEXT NOT NULL,fingerprint TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS chat127_owner_time ON chat127(owner,at);
 CREATE INDEX IF NOT EXISTS chat127_time ON chat127(at);`);
 let cleaned=-Infinity;
 function cleanup(){if(now()-cleaned<60000)return;db.prepare('DELETE FROM chat127 WHERE at<?').run(now()-30*DAY);cleaned=now()}
 cleanup();const timer=setInterval(cleanup,60000);timer.unref();
 function accept(owner,name,channel,value){
  cleanup();if(!owner)throw new Problem(401,'연결을 새로 열고 다시 시도해 주세요.');
  store.rate(owner,'chat-attempt127',12,10000);
  if(typeof value!=='string'||/[\p{Cc}\p{Cf}\p{Cs}]/u.test(value))throw new Problem(400,'줄바꿈이나 제어문자 없이 입력해 주세요.');
  const body=value.normalize('NFC').trim();if(!body||[...body].length>120)throw new Problem(400,'1~120자로 입력해 주세요.');
  const t=now(),fp=hash(body.normalize('NFKC').replace(/\s+/gu,'').toLocaleLowerCase());
  const recent=db.prepare('SELECT at,fingerprint FROM chat127 WHERE owner=? AND at>? ORDER BY at DESC').all(owner,t-120000);
  if(recent.some(r=>r.fingerprint===fp))throw new Problem(429,'같은 말은 잠시 뒤에 보내 주세요.',120);
  if(recent[0]?.at>t-2000||recent.filter(r=>r.at>t-30000).length>=5)throw new Problem(429,'조금 천천히 보내 주세요.',Math.max(2,Math.ceil((recent.filter(r=>r.at>t-30000).at(-1)?.at+30000-t)/1000)||2));
  const id=Number(db.prepare('INSERT INTO chat127(owner,at,name,channel,body,fingerprint) VALUES(?,?,?,?,?,?)').run(owner,t,name,channel,body,fp).lastInsertRowid);
  return{id,at:t,name,channel,body};
 }
 function list(before=Number.MAX_SAFE_INTEGER){cleanup();if(!Number.isSafeInteger(before)||before<1)throw new Problem(400,'잘못된 페이지');const rows=db.prepare('SELECT id,at,name,channel,body FROM chat127 WHERE id<? AND at>=? ORDER BY id DESC LIMIT 51').all(before,now()-30*DAY);return{items:rows.slice(0,50),next:rows.length>50?rows[49].id:null,retentionDays:30}}
 return{accept,list,close:()=>clearInterval(timer)};
}
// Backfill only the raw range whose identities still exist. Never add daily uniques.
// The separate anonymous ledger survives raw retention; no name/IP/body is stored.
function createVisitorCount127(store,now=Date.now){
 const {db,environment}=store;
 db.exec(`CREATE TABLE IF NOT EXISTS public_count_epoch127(environment TEXT PRIMARY KEY,started INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS public_browsers127(environment TEXT NOT NULL,visitor TEXT NOT NULL,visit INTEGER NOT NULL,confirmed INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(environment,visitor));`);
 if(!db.prepare('SELECT 1 FROM public_count_epoch127 WHERE environment=?').get(environment)){
  db.exec('BEGIN IMMEDIATE');try{
   const archive=db.prepare('SELECT max(day) day FROM analytics_daily112 WHERE environment=?').get(environment).day;
   const markExists=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='retention_watermark127'").get();
   const watermark=markExists?db.prepare('SELECT through FROM retention_watermark127 WHERE environment=?').get(environment)?.through:null;
   const boundary=archive===null&&watermark==null?0:Math.max(archive===null?0:archive+DAY,watermark||0);
   const first=db.prepare('SELECT min(start) first FROM visits WHERE environment=? AND excluded=0 AND start>=?').get(environment,boundary).first;
   const start=first??now();
   db.prepare('INSERT INTO public_count_epoch127 VALUES(?,?)').run(environment,start);
   db.prepare(`INSERT INTO public_browsers127(environment,visitor,visit,confirmed)
    SELECT ?,x.visitor,max(x.id),CASE WHEN count(*)>1 OR max(x.id)!=coalesce(v.session,-1) THEN 1 ELSE 0 END
    FROM visits x JOIN visitors v ON v.id=x.visitor WHERE x.environment=? AND x.excluded=0 AND v.excluded=0 AND x.start>=? GROUP BY x.visitor`).run(environment,environment,start);
   db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e}
 }
 const started=db.prepare('SELECT started FROM public_count_epoch127 WHERE environment=?').get(environment).started;
 const since=new Date(started+KST).toISOString().slice(0,10);
 let count=db.prepare('SELECT count(*) n FROM public_browsers127 WHERE environment=?').get(environment).n;
 function remove(id){count-=Number(db.prepare('DELETE FROM public_browsers127 WHERE environment=? AND visitor=?').run(environment,id).changes)}
 function remember(id){
  const v=db.prepare('SELECT session,excluded FROM visitors WHERE id=?').get(id);if(!v)return;
  if(v.excluded){remove(id);return}
  const visit=db.prepare('SELECT id,excluded,last FROM visits WHERE id=? AND environment=?').get(v.session,environment);if(!visit||visit.last<started)return;
  const old=db.prepare('SELECT visit,confirmed FROM public_browsers127 WHERE environment=? AND visitor=?').get(environment,id);
  if(visit.excluded){if(old&&!old.confirmed&&old.visit===visit.id)remove(id);return}
  if(!old){db.prepare('INSERT INTO public_browsers127 VALUES(?,?,?,0)').run(environment,id,visit.id);count++}
  else if(old.visit!==visit.id)db.prepare('UPDATE public_browsers127 SET visit=?,confirmed=1 WHERE environment=? AND visitor=?').run(visit.id,environment,id);
 }
 // Reconcile sticky exclusions on restart without trying to sum historical daily counts.
 for(const row of db.prepare('SELECT p.visitor FROM public_browsers127 p JOIN visitors v ON v.id=p.visitor WHERE p.environment=?').all(environment))remember(row.visitor);
 return{remember,get:()=>({count,since}),started};
}
module.exports={createSocial127,createVisitorCount127};
