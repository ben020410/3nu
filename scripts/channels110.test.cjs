'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{WebSocket}=require('ws');
const {createCampusServer}=require('../server/local106.cjs'),{selectNearby}=require('../server/interest110.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function client(url,state,channel,token,protocol){return new Promise((resolve,reject)=>{const ws=new WebSocket(url),messages=[],waiters=[];ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);if(messages.length>100)messages.shift();for(const w of [...waiters])if(w.match(m)){waiters.splice(waiters.indexOf(w),1);clearTimeout(w.timer);w.resolve(m)}});const c={ws,messages,send:m=>ws.send(JSON.stringify(m)),next:match=>new Promise((resolve,reject)=>{const w={match,resolve,timer:setTimeout(()=>reject(Error('packet timeout')),2500)};waiters.push(w)}),close:()=>new Promise(r=>{if(ws.readyState===3)return r();ws.once('close',r);ws.close()})};ws.once('open',()=>{const joined=c.next(m=>m.type==='welcome'||m.type==='full');c.send({type:'hello',state,channel,token,protocol});joined.then(m=>{c.welcome=m;resolve(c)},reject)});})}
function state(a){return{x:a.x+1.3,y:a.y+.95,z:a.z,yaw:0,name:'채널검증',character:'rio',action:'idle',moving:false,bus:null}}
async function request(c,m){const next=c.next(v=>v.type===m.type&&v.request===m.request);c.send(m);return next}
test('channel capacity is atomic; seats, snapshots, switching and reconnect are isolated',async()=>{
 const server=createCampusServer({capacity:2,channels:['01','02','03']}),addr=await server.listen(0),url='ws://127.0.0.1:'+addr.port+'/multiplayer',a=server.anchors.seats[0],p=state(a),clients=[];
 const join=async(channel,token)=>{const c=await client(url,p,channel,token);clients.push(c);return c};
 try{
  const auto=await Promise.all([join(),join(),join()]);assert.deepEqual(auto.map(c=>c.welcome.channel),['01','02','03']);
  const races=await Promise.all([join('01'),join('01')]);assert.equal(races.filter(c=>c.welcome.type==='welcome').length,1);assert.equal(races.filter(c=>c.welcome.type==='full').length,1);assert.equal(server.channelList()[0].population,2);
  const [one,two,three]=auto;const before=server.sessions.get(two.welcome.id).channel;
  let result=await request(two,{type:'switch',request:'full',channel:'01'});assert.equal(result.reason,'full');assert.equal(server.sessions.get(two.welcome.id).channel,before);
  const claims=await Promise.all([one,two,three].map((c,i)=>request(c,{type:'claim',request:'seat'+i,seat:a.id})));assert(claims.every(c=>c.ok));assert.equal(server.seats.size,3);
  result=await request(one,{type:'switch',request:'busy',channel:'02'});assert.equal(result.reason,'busy');assert.equal(server.seats.size,3);
  one.send({type:'release'});result=await request(one,{type:'switch',request:'switch',channel:'02'});assert.equal(result.ok,true);assert.equal(result.channel,'02');assert.equal(server.seats.has('01:'+a.id),false);
  const [snap1,snap2,snap3]=await Promise.all([one,two,three].map(c=>c.next(m=>m.type==='snapshot')));assert(snap1.players.some(v=>v.id===two.welcome.id));assert(snap2.players.some(v=>v.id===one.welcome.id));assert.equal(snap3.players.length,0);
  const id=one.welcome.id,token=one.welcome.token;await one.close();await delay(30);const reconnect=await join('01',token);assert.equal(reconnect.welcome.id,id);assert.equal(reconnect.welcome.channel,'02');assert.notEqual(reconnect.welcome.token,token);
  await reconnect.close();await delay(30);const fill=await join('02');assert.equal(fill.welcome.type,'welcome');const denied=await join('01',reconnect.welcome.token);assert.equal(denied.welcome.type,'full');assert.equal(denied.welcome.channel,'02');
  assert.equal(server.channelList().reduce((n,c)=>n+c.population,0),4);
  for(const c of clients)await c.close();await delay(30);assert(server.channelList().every(c=>c.population===0));assert.equal(server.seats.size,0);
 }finally{for(const c of clients)c.ws.terminate();await server.close()}
});
test('spatial interest excludes distant/other-channel peers and bounds clustered recipients with hysteresis',()=>{
 const at=(id,x,channel='01')=>({id,channel,state:{x,z:0}}),a=at('self',0),near=Array.from({length:99},(_,i)=>at('p'+String(i).padStart(3,'0'),i*.2));const far=at('far',800),other=at('other',1,'02');let result=selectNearby([a,...near,far,other]);assert.equal(result.get('self').ids.length,24);assert.equal(result.get('self').nearby,99);assert(!result.get('self').ids.includes('other'));assert.equal(result.get('far').ids.length,0);
 let old=new Map([['self',['edge']]]);result=selectNearby([a,at('edge',205)],old);assert.deepEqual(result.get('self').ids,['edge']);result=selectNearby([a,at('edge',221)],old);assert.equal(result.get('self').ids.length,0);
});

test('compact snapshots send identity once, update changed poses, and remove departed peers',async()=>{
 const c=createCampusServer({capacity:100,channels:['01','02','03']}),addr=await c.listen(0),url='ws://127.0.0.1:'+addr.port+'/multiplayer',p=state(c.anchors.seats[0]);let a,b;
 try{a=await client(url,p,'01',undefined,110);b=await client(url,{...p,name:'친구'},'01',undefined,110);const first=await a.next(m=>m.type==='snapshot'&&m.peers?.length===1);assert.equal(first.poses.length,1);assert.equal(first.peers[0].name,'친구');const quiet=await a.next(m=>m.type==='snapshot');assert.equal(quiet.peers.length,0);assert.equal(quiet.poses.length,0);
 b.send({type:'state',state:{...p,name:'친구',x:p.x+.1}});const changed=await a.next(m=>m.type==='snapshot'&&m.poses.length);assert.equal(changed.peers.length,0);assert.equal(changed.poses[0][1],Math.round((p.x+.1)*50));const k=first.peers[0].k;
 await b.close();const left=await a.next(m=>m.type==='snapshot'&&m.left.length);assert.deepEqual(left.left,[k]);
 }finally{a?.ws.terminate();b?.ws.terminate();await c.close()}
});
