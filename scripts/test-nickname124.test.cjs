'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {openCommunity,GAP,DAY}=require('../server/community107.cjs'),{createVisitLog}=require('../server/visit-log123.cjs');
test('exact test nickname excludes only its visit, including title/active/CSV, with persistent future-entry option',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'3nu-test-name124-')),file=path.join(dir,'data.sqlite');let time=Date.UTC(2026,10,18),store=openCommunity(file,{now:()=>time,environment:'test'}),log=createVisitLog(store,()=>time);
 const enter=(id,name,kind='enter')=>{const p={tab:'validtab1',visible:true,kind,name};store.track(id,p);log.remember(id,p)};
 try{
 assert.equal(log.options().enabled,true);enter('tester',undefined,'title');assert.equal(store.stats().visits,1);time+=1000;enter('tester','테스트');time+=5000;enter('tester','테스트','heartbeat');
 let s=store.stats();assert.equal(s.visits,0);assert.equal(s.active,0);assert.equal(s.totalVisits,0);assert.equal(s.averageActiveMs,0);assert.equal(log.list(new URLSearchParams()).total,0);let r=log.list(new URLSearchParams('excluded=1')).items[0];assert.equal(r.testVisit,1);assert.equal(r.name,'테스트');assert.equal(r.excluded,1);assert.equal(store.db.prepare('SELECT excluded FROM visitors').get().excluded,0);assert(store.csv(1).includes('"기간 전체","0","0","0","0","0.0"'));
 enter('normal','테스트중');assert.equal(store.stats().visits,1);assert.equal(store.stats().active,1);enter('legacy',undefined);assert.equal(log.list(new URLSearchParams()).items[0].name,null);
 enter('tester','일반 이름');assert.equal(store.stats().visits,2);time+=GAP+1;enter('tester','일반 이름');s=store.stats();assert.equal(s.visits,3);assert.equal(s.returningVisitors,0);assert.equal(s.active,1);
 log.setOptions({enabled:false});assert.throws(()=>log.setOptions({enabled:'false'}),e=>e.status===400);enter('off','테스트');assert.equal(store.stats().visits,4);store.close();store=openCommunity(file,{now:()=>time,environment:'test'});log=createVisitLog(store,()=>time);assert.equal(log.options().enabled,false);assert.equal(store.stats().visits,4);
 log.setOptions({enabled:true});enter('off','테스트','heartbeat');assert.equal(store.stats().visits,4);enter('newtest','테스트');assert.equal(store.stats().visits,4);assert.equal(log.list(new URLSearchParams('excluded=1')).items.filter(x=>x.testVisit).length,2);
 // Retention must never reintroduce excluded test visits into archived totals.
 time+=95*DAY;const plan=store.retention.preview({enabled:true});assert.equal(plan.days.reduce((n,x)=>n+x.visits,0),4);
 const id=store.db.prepare('SELECT visit FROM test_visits124 LIMIT 1').get().visit;store.db.prepare('DELETE FROM visits WHERE id=?').run(id);assert.equal(store.db.prepare('SELECT count(*) n FROM test_visits124 WHERE visit=?').get(id).n,0);
 }finally{store.close();fs.rmSync(dir,{recursive:true,force:true})}
});
