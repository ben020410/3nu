'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{WebSocket}=require('ws');
const {openCommunity,DAY,GAP}=require('../server/community107.cjs'),{createSocial127,createVisitorCount127}=require('../server/social127.cjs'),{createVisitLog}=require('../server/visit-log123.cjs'),{createLocal107}=require('../server/local107.cjs'),{createApproachPolicy,bubbleDisposition,matchPlace}=require('../dist/social127.js');
const temporary=()=>fs.mkdtempSync(path.join(os.tmpdir(),'3nu-social127-'));
const presence={tab:'tab12700',visible:true,kind:'enter',name:'방문자'};
function credentials(directory){const salt=crypto.randomBytes(32).toString('hex'),password='local-test-only';fs.writeFileSync(path.join(directory,'private.json'),JSON.stringify({salt,passwordHash:crypto.scryptSync(password,salt,64).toString('hex'),secret:crypto.randomBytes(32).toString('hex')}));return password}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('chat validates text; reconnect/restart cannot bypass repeat/rate limits; logs expire and page at 50',()=>{
 const directory=temporary();let t=Date.now(),store=openCommunity(path.join(directory,'community.sqlite'),{now:()=>t,environment:'test'}),chat=createSocial127(store,()=>t);
 try{
  for(const body of['',' ','x'.repeat(121),'line\nnext','\u200b','\ud800'])assert.throws(()=>chat.accept('invalid','name','01',body),e=>e.status===400);
  const msg=chat.accept('a','이름','01',' <img src=x onerror=alert(1)> ');assert.equal(msg.body,'<img src=x onerror=alert(1)>');assert.equal(chat.list().items.length,1);
  assert.throws(()=>chat.accept('a','다른이름','02','<img src=x onerror=alert(1)>'),e=>e.status===429);
  assert.throws(()=>chat.accept('a','이름','01','다른 말'),e=>e.status===429);chat.close();store.close();
  store=openCommunity(path.join(directory,'community.sqlite'),{now:()=>t,environment:'test'});chat=createSocial127(store,()=>t);
  assert.throws(()=>chat.accept('a','이름','01','다른 말'),e=>e.status===429);t+=3000;
  chat.accept('a','이름','01','다른 말');for(let i=0;i<3;i++){t+=2100;chat.accept('a','이름','01','추가 '+i)}t+=2100;assert.throws(()=>chat.accept('a','이름','01','여섯번째'),e=>e.status===429);
  for(let i=0;i<53;i++)chat.accept('owner'+i,'검증','01','page '+i);
  const one=chat.list(),two=chat.list(one.next);assert.equal(one.items.length,50);assert.equal(two.items.length,8);assert(!one.items.some(a=>two.items.some(b=>a.id===b.id)));assert(!JSON.stringify(one).includes('owner'));assert.throws(()=>chat.list(NaN));
  t+=31*DAY;assert.equal(chat.list().items.length,0);chat.accept('a','이름','01','다른 말');assert.equal(chat.list().items.length,1);
 }finally{chat.close();store.close();fs.rmSync(directory,{recursive:true,force:true})}
});
test('public distinct ledger backfills raw history, excludes test title, survives retention/restart, and isolates environments',()=>{
 const dir=temporary(),file=path.join(dir,'community.sqlite');let t=Date.UTC(2026,10,16),s=openCommunity(file,{now:()=>t,environment:'test'});let log=createVisitLog(s,()=>t);
 const track=(id,p=presence,excluded=false)=>{s.track(id,p,excluded);log.remember(id,p)};
 try{
  track('a');t+=DAY;track('a');track('b');track('excluded',presence,true);track('test',{...presence,name:'테스트'});
  let count=createVisitorCount127(s,()=>t);assert.deepEqual(count.get(),{count:2,since:'2026-11-16'});
  track('new',{...presence,kind:'title',name:undefined});count.remember('new');assert.equal(count.get().count,3);
  track('new',{...presence,name:'테스트'});count.remember('new');assert.equal(count.get().count,2);
  t+=GAP;track('new');count.remember('new');assert.equal(count.get().count,3);
  track('b',presence,true);count.remember('b');assert.equal(count.get().count,2);
  t+=40*DAY;s.retention.apply({enabled:true,rawDays:30},{approved:true});assert.equal(s.db.prepare('SELECT count(*) n FROM visits').get().n,0);s.close();
  s=openCommunity(file,{now:()=>t,environment:'test'});log=createVisitLog(s,()=>t);count=createVisitorCount127(s,()=>t);assert.equal(count.get().count,2);
  track('a');count.remember('a');assert.equal(count.get().count,2);track('c');count.remember('c');assert.equal(count.get().count,3);
  s.close();s=openCommunity(file,{now:()=>t,environment:'development'});assert.equal(createVisitorCount127(s,()=>t).get().count,0);
 }finally{s.close();fs.rmSync(dir,{recursive:true,force:true})}
});
test('partial archives never sum daily unique browsers, including after archived aggregates expire',()=>{
 const dir=temporary();let t=Date.UTC(2026,0,1),s=openCommunity(path.join(dir,'community.sqlite'),{now:()=>t,environment:'test'});
 try{s.track('old',presence);t+=40*DAY;s.retention.apply({enabled:true,rawDays:30,aggregateDays:31},{approved:true});s.track('recent',presence);t+=DAY;s.track('recent',presence);const count=createVisitorCount127(s,()=>t);assert.deepEqual(count.get(),{count:1,since:'2026-02-10'});assert(s.db.prepare('SELECT through FROM retention_watermark127').get().through>0)}finally{s.close();fs.rmSync(dir,{recursive:true,force:true})}
});
test('NPC approach chooses only one visible nearby actor and suppresses menus, repeats and same-area chatter',()=>{
 const p=createApproachPolicy(),n={id:'cat',zone:'인문대·자하연',role:'reader',distance:3,visible:true},other={...n,id:'cat2',distance:4};
 assert.equal(p.step([{...n,visible:false}],0),null);assert.equal(p.step([{...n,distance:20}],0),null);
 const first=p.step([n,other],1);assert.equal(first.id,'cat');assert.equal(p.step([n,other],1000000),null);p.step([],1000001);
 assert.equal(p.step([n],1000002,false),null);assert.equal(p.step([n],1000003,true),null);p.step([],1000004);const second=p.step([n],1000005);assert(second);assert.notEqual(first.body,second.body);
 p.step([],1000006);assert.equal(p.step([other],1001000),null);p.step([],1200000);assert(p.step([other],1200001));
});
function wsClient(base,cookie,state,channel='01'){
 return new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('http:','ws:')+'/multiplayer',{headers:{Origin:base,Cookie:cookie}}),messages=[],waiters=[];ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);for(const w of [...waiters])if(w.match(m)){waiters.splice(waiters.indexOf(w),1);clearTimeout(w.timer);w.resolve(m)}});
 const c={ws,messages,send:m=>ws.send(JSON.stringify(m)),next:match=>new Promise((resolve,reject)=>{const w={match,resolve,timer:setTimeout(()=>reject(Error('packet timeout')),3000)};waiters.push(w)})};ws.once('open',()=>{const ready=c.next(m=>m.type==='welcome');c.send({type:'hello',protocol:125,state,channel});ready.then(m=>{c.welcome=m;resolve(c)},reject)})});
}
test('HTTP/WS: nearby channel-only delivery, cookies survive reconnect, admin-only safe logs, public GET has no visit side effects',async()=>{
 const dir=temporary(),password=credentials(dir);let t=Date.now();const server=createLocal107({directory:dir,environment:'test',now:()=>t,channels:['01','02']}),addr=await server.listen(0),base='http://127.0.0.1:'+addr.port,clients=[];
 async function request(j,url,method='GET',body){const r=await fetch(base+url,{method,headers:{Origin:base,Cookie:j.cookie||'','Content-Type':'application/json','X-CSRF-Token':j.csrf||'','User-Agent':'3NU-local-test'},body:method==='GET'?undefined:JSON.stringify(body)});for(const header of r.headers.getSetCookie()){const kv=header.split(';')[0],i=kv.indexOf('=');j.values??={};j.values[kv.slice(0,i)]=kv.slice(i+1)}j.cookie=Object.entries(j.values||{}).map(([k,v])=>k+'='+v).join('; ');return{status:r.status,data:await r.json()}}
 async function jar(){const j={};j.csrf=(await request(j,'/api/session')).data.csrf;return j}
 try{
  const countBefore=server.api.store.db.prepare('SELECT count(*) n FROM visits').get().n,eventsBefore=server.api.store.db.prepare('SELECT count(*) n FROM events').get().n;
  const publicResult=await request({},'/api/public/visitor-count');assert.equal(publicResult.status,200);assert.deepEqual(Object.keys(publicResult.data).sort(),['count','since']);assert.equal(server.api.store.db.prepare('SELECT count(*) n FROM visits').get().n,countBefore);assert.equal(server.api.store.db.prepare('SELECT count(*) n FROM events').get().n,eventsBefore);
  assert.equal((await request({},'/api/admin/chat')).status,401);
  const jars=await Promise.all(Array.from({length:5},jar)),anchor=server.anchors.seats[0],state={x:anchor.x,y:anchor.y+.95,z:anchor.z,yaw:0,name:'검증',character:'rio',action:'idle',moving:false,bus:null};
  for(const [i,j]of jars.entries())clients.push(await wsClient(base,j.cookie,{...state,x:state.x+(i===2?60:0),y:state.y+(i===3?20:0)},i===4?'02':'01'));
  await delay(250);const speaker=clients[0],near=clients[1],deliver=near.next(m=>m.type==='chat'),ack=speaker.next(m=>m.type==='chat-result');speaker.send({type:'chat',request:'msg1',body:'<img src=x onerror=alert(1)>'});assert((await ack).ok);assert.equal((await deliver).body,'<img src=x onerror=alert(1)>');await delay(150);for(const c of clients.slice(2))assert(!c.messages.some(m=>m.type==='chat'));
  const dropped=new Promise(r=>speaker.ws.once('close',r));speaker.ws.close();await dropped;const again=await wsClient(base,jars[0].cookie,state);clients.push(again);let result=again.next(m=>m.type==='chat-result');again.send({type:'chat',request:'again',body:'<img src=x onerror=alert(1)>'});assert.equal((await result).ok,false);
  t+=3000;result=again.next(m=>m.type==='chat-result');again.send({type:'chat',request:'new',body:'안녕하세요'});assert((await result).ok);
  assert.equal((await request(jars[0],'/api/admin/chat')).status,401);const admin={};const login=await request(admin,'/api/admin/login','POST',{password});assert.equal(login.status,200);admin.csrf=login.data.csrf;const rows=(await request(admin,'/api/admin/chat')).data;assert.equal(rows.items.length,2);assert.equal(rows.items[1].body,'<img src=x onerror=alert(1)>');assert(!JSON.stringify(rows).includes('fingerprint'));
  const a=jars[1];await request(a,'/api/visits','POST',{...presence,kind:'title'});assert.equal((await request({},'/api/public/visitor-count')).data.count,1);await request(a,'/api/visits','POST',{...presence,name:'테스트'});assert.equal((await request({},'/api/public/visitor-count')).data.count,0);
  const adminSession=await request(admin,'/api/session');admin.csrf=adminSession.data.csrf;await request(admin,'/api/visits','POST',presence);assert.equal((await request({},'/api/public/visitor-count')).data.count,0);
  const noCookie=await wsClient(base,'',state);clients.push(noCookie);result=noCookie.next(m=>m.type==='chat-result');noCookie.send({type:'chat',request:'none',body:'익명 위조'});assert.equal((await result).ok,false);
 }finally{for(const c of clients)c.ws.terminate();await server.close();fs.rmSync(dir,{recursive:true,force:true})}
});

test('first speech waits for the first pose without restarting TTL; distance and expiration still clear it',()=>{
 const viewer={x:0,y:1,z:0};assert.equal(bubbleDisposition(10,6500,null,viewer),'wait');assert.equal(bubbleDisposition(900,6500,viewer,viewer),'show');assert.equal(bubbleDisposition(1100,6500,{x:41,y:1,z:0},viewer),'remove');assert.equal(bubbleDisposition(1100,6500,{x:1,y:16,z:0},viewer),'remove');assert.equal(bubbleDisposition(6500,6500,null,viewer),'remove');assert.equal(bubbleDisposition(6500,6500,viewer,viewer),'remove');
});

const placeSpec=require('../dist/data/social-places127.json');
const testPlaces=placeSpec.places.map((p,i)=>({...p,x:i*100,y:10,z:0}));
test('local facts require both actor and viewer inside the same horizontal and feet-height bounds',()=>{
 const p=testPlaces[0],at={x:0,y:10,z:0};
 assert.equal(matchPlace(at,at,testPlaces).id,p.id);
 for(const q of [{x:p.radius+.01,y:10,z:0},{x:0,y:10+p.heightTolerance+.01,z:0},{x:0,y:10-p.heightTolerance-.01,z:0}]){
  assert.equal(matchPlace(at,q,testPlaces),null);assert.equal(matchPlace(q,at,testPlaces),null);
 }
 assert.equal(matchPlace(null,at,testPlaces),null);
 assert.equal(matchPlace(at,{x:100,y:10,z:0},testPlaces),null);
});
test('library approach gives a sourced fact first, cycles by place, and suppresses reapproach and concurrent residents',()=>{
 const policy=createApproachPolicy({places:testPlaces}),viewer={x:0,y:10,z:0},cat={id:'reader',role:'reader',zone:'중앙광장',position:viewer,distance:3,visible:true},second={...cat,id:'other',distance:4};
 const first=policy.step([cat,second],1,true,viewer);assert.equal(first.id,'reader');assert.match(first.body,/박완서/);assert.equal(first.placeId,'library-main-front');
 assert.equal(policy.step([cat,second],1000,true,viewer),null);policy.step([],2000);
 assert.equal(policy.step([cat],16000,true,viewer),null);policy.step([],17000);
 assert.equal(policy.step([second],20000,true,viewer),null);policy.step([],21000);
 const next=policy.step([cat],120001,true,viewer);assert(next);assert.notEqual(first.factId,next.factId);assert.match(next.body,/1975/);
 assert.equal(policy.step([cat],999999,true,viewer),null);
});
test('facts are distinct by actual place; broad zone labels and other floors do not grant a place fact',()=>{
 const bodies=new Set();for(const p of testPlaces){const viewer={x:p.x,y:p.y,z:p.z},cat={id:p.resident.id,role:'reader',zone:'중앙광장',position:viewer,distance:3,visible:true};
 const first=createApproachPolicy({places:testPlaces}).step([cat],1,true,viewer);assert.equal(first.placeId,p.id);bodies.add(first.body);
 const above={...viewer,y:viewer.y+4};const fallback=createApproachPolicy({places:testPlaces}).step([{...cat,position:above}],1,true,above);assert.equal(fallback.factId,null);assert(!/중도|자하연|풍산|샤/.test(fallback.body));
 }assert.equal(bodies.size,4);
});
test('hidden/menu NPCs do not talk; a local fact takes precedence over nearby generic chatter',()=>{
 const viewer={x:0,y:10,z:0},cat={id:'local',role:'reader',zone:'z',position:viewer,distance:4,visible:true};
 assert.equal(createApproachPolicy({places:testPlaces}).step([{...cat,visible:false}],1,true,viewer),null);
 assert.equal(createApproachPolicy({places:testPlaces}).step([cat],1,false,viewer),null);
 const generic={...cat,id:'generic',position:{x:0,y:15,z:0},distance:2};assert.equal(createApproachPolicy({places:testPlaces}).step([generic,cat],1,true,viewer).id,'local');
});
test('landmark data reuses distinct existing residents, provides sources for every fact and stays compact',()=>{
 const residents=require('../dist/data/campus-life103.json').residents;assert.equal(residents.length,180);assert.equal(new Set(placeSpec.places.map(p=>p.resident.id)).size,4);
 for(const p of placeSpec.places){const n=residents.find(n=>n.id===p.resident.id);assert(n);assert(!n.social&&!n.waitPoint);assert(p.radius<=20&&p.heightTolerance<=2);
  for(const line of p.lines){assert(line.sources.length);for(const key of line.sources)assert(placeSpec.sources[key]?.url.startsWith('https://'));for(const text of [line.text,...Object.values(line.variants||{})])assert(text.length<=65);}
 }
});

test('same NPC speaks a different line after 60s and a real exit; early return plus camping never rearms it',()=>{
 const p=createApproachPolicy(),n={id:'same',zone:'area',role:'reader',distance:3,visible:true};
 const first=p.step([n],0);assert(first);assert.equal(p.step([n],60000),null); // Staying is not a revisit.
 p.step([{...n,distance:11}],60001);const second=p.step([n],60002);assert(second);assert.notEqual(first.body,second.body);
 p.step([],60003);assert.equal(p.step([n],90002),null);assert.equal(p.step([n],120002),null); // Early return consumes approach.
 p.step([{...n,distance:10.99}],120003);assert.equal(p.step([n],120004),null);
 p.step([{...n,distance:11}],120005);const third=p.step([n],120006);assert(third);assert.notEqual(second.body,third.body);
});
test('three-line roles remain usable across repeated visits without another role clearing history',()=>{
 const controls={commuter:'표지판',reader:'장소',artist:'바닥',musician:'스피커',athlete:'날기',relax:'빈백'};
 for(const [role,control] of Object.entries(controls)){
  const p=createApproachPolicy(),n={id:'same',zone:'area',role,distance:3,visible:true},bodies=[];
  for(let i=0;i<12;i++){const got=p.step([n],i*60000);assert(got,role+' visit '+i);if(i)assert.notEqual(got.body,bodies.at(-1));bodies.push(got.body);p.step([],i*60000+1)}
  assert.equal(new Set(bodies).size,3);assert(bodies.some(text=>text.includes(control)),role+' tip should mention '+control);
 }
});
test('same-role neighbours share a 30s text suppression while area and global gates stay intact',()=>{
 const p=createApproachPolicy(),n={id:'a',zone:'one',role:'reader',distance:3,visible:true};const a=p.step([n],0);p.step([],1);
 assert.equal(p.step([{...n,id:'b',zone:'two'}],13999),null);p.step([],14000);
 const b=p.step([{...n,id:'b',zone:'two'}],14001);assert(b);assert.notEqual(a.body,b.body);p.step([],14002);
 assert.equal(p.step([{...n,id:'c'}],29999),null);p.step([],30000);
 const c=p.step([{...n,id:'c'}],30001);assert(c);assert.notEqual(c.body,b.body);
});
test('hidden/menu approaches, boundary distance, and simultaneous entrants cannot queue surprise speech',()=>{
 const p=createApproachPolicy(),n={id:'a',zone:'one',role:'artist',distance:7,visible:true};assert.equal(p.step([n],0),null);
 assert.equal(p.step([{...n,distance:6,visible:false}],1),null);
 assert.equal(p.step([{...n,distance:6}],2,false),null);assert.equal(p.step([{...n,distance:6}],65000),null);
 p.step([],65001);const a=p.step([{...n,distance:6},{...n,id:'b',distance:5}],65002);assert.equal(a.id,'b');
 assert.equal(p.step([{...n,distance:6},{...n,id:'b',distance:5}],130002),null);
});
test('place revisits preserve identity and skip the same NPC last line even when neighbours advanced the shared cycle',()=>{
 const place=testPlaces[0],position={x:place.x,y:place.y,z:place.z},p=createApproachPolicy({places:[place]}),n={id:'a',zone:'z',role:'reader',position,distance:3,visible:true};
 const a=p.step([n],0,true,position);assert.equal(a.factId,'library-archive');p.step([],1);
 assert.equal(p.step([n],59999,true,position),null);assert.equal(p.step([n],60000,true,position),null);p.step([],60001);
 const b=p.step([n],60002,true,position);assert.equal(b.placeId,place.id);assert.notEqual(a.body,b.body);p.step([],60003);
 p.step([{...n,id:'other'}],90002,true,position);p.step([],90003);
 p.step([{...n,id:'third'}],120002,true,position);p.step([],120003);
 const returned=p.step([n],150002,true,position);assert(returned);assert.notEqual(returned.body,b.body);assert.equal(returned.placeId,place.id);
});
