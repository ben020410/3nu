"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {openCommunity,GAP,DAY}=require('../server/community107.cjs'),{createVisitLog}=require('../server/visit-log123.cjs');
test('admin visit log preserves history, validates filters, pages without identity leakage, and survives old-code reopen',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'3nu-visit-log-')),file=path.join(dir,'community.sqlite');let t=Date.UTC(2026,10,16,15),s=openCommunity(file,{now:()=>t,environment:'test'});
 const presence={tab:'testtab00',kind:'enter',visible:true},track=(id,p=presence,excluded=false)=>s.track(id,p,excluded);
 try{
 track('old');t+=1000;track('old',{...presence,kind:'leave',visible:false});const original=s.db.prepare('SELECT * FROM visits').all();
 let log=createVisitLog(s,()=>t);assert.deepEqual(s.db.prepare('SELECT * FROM visits').all(),original);assert.equal(log.list(new URLSearchParams()).items[0].name,null);
 t+=GAP;track('old');log.remember('old',{...presence,name:'새 방문'});assert.equal(log.list(new URLSearchParams()).items[0].name,'새 방문');assert.equal(log.list(new URLSearchParams()).items[1].name,null);
 t+=15000;assert.equal(log.list(new URLSearchParams()).items[0].activeMs,15000);
 log.remember('old',{...presence,name:'<script>'});assert.equal(log.list(new URLSearchParams()).items[0].name,'새 방문');
 log.remember('old',{...presence,name:'숨김',visible:false});assert.equal(log.list(new URLSearchParams()).items[0].name,'새 방문');
 track('excluded',presence,true);log.remember('excluded',{...presence,name:'제외'});assert.equal(log.list(new URLSearchParams()).total,2);assert.equal(log.list(new URLSearchParams('excluded=1')).total,3);
 assert.equal(log.list(new URLSearchParams('from=2026-11-17&to=2026-11-17')).total,2);assert.equal(log.list(new URLSearchParams('to=2026-11-16')).total,0);
 for(const p of ['from=2026-02-30','before=NaN','before=0','from=2026-11-18&to=2026-11-17','excluded=bad'])assert.throws(()=>log.list(new URLSearchParams(p)),e=>e.status===400);
 for(let i=0;i<55;i++){t++;track('page'+i)}
 const first=log.list(new URLSearchParams()),second=log.list(new URLSearchParams('before='+first.next));assert.equal(first.items.length,50);assert.equal(second.items.length,7);assert(!second.items.some(r=>first.items.some(q=>q.id===r.id)));assert.equal(second.next,null);assert(!JSON.stringify(first).includes('visitor'));assert(!JSON.stringify(first).includes('testtab'));
 s.close();s=openCommunity(file,{now:()=>t,environment:'test'});assert.equal(s.stats(7).visits,57);log=createVisitLog(s,()=>t);assert.equal(log.list(new URLSearchParams()).total,57);
 const named=s.db.prepare('SELECT visit FROM visit_names123 LIMIT 1').get().visit;s.db.prepare('DELETE FROM visits WHERE id=?').run(named);assert.equal(s.db.prepare('SELECT count(*) n FROM visit_names123 WHERE visit=?').get(named).n,0);
 }finally{s.close();fs.rmSync(dir,{recursive:true,force:true})}
});
test('presence sends only entered nickname and supports legacy unnamed entry',async()=>{
 const sent=[],handlers={},ctx={window:{},document:{hidden:false,addEventListener:(k,v)=>handlers[k]=v},addEventListener:()=>{},crypto:{randomUUID:()=> 'testtab00'},AbortController,setTimeout,clearTimeout,setInterval:fn=>{handlers.heartbeat=fn},Drafts113:{configure:()=>{}},fetch:async(url,options)=>{if(url==='/api/session')return{ok:true,json:async()=>({csrf:'test',environment:'test'})};sent.push(JSON.parse(options.body));return{ok:true}}};
 vm.runInNewContext(fs.readFileSync(path.resolve('dist/community107.js'),'utf8'),ctx);await new Promise(r=>setTimeout(r,10));
 ctx.window.Community107.enter('새 이름');await new Promise(r=>setTimeout(r,10));assert.equal(sent.at(-1).name,'새 이름');handlers.heartbeat();await new Promise(r=>setTimeout(r,10));assert.equal(sent.at(-1).name,'새 이름');ctx.window.Community107.leave();await new Promise(r=>setTimeout(r,10));assert.equal(sent.at(-1).name,undefined);ctx.window.Community107.enter();await new Promise(r=>setTimeout(r,10));assert.equal(sent.at(-1).name,'');
});
