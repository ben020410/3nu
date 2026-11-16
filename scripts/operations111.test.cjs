'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),{execFileSync}=require('node:child_process'),{WebSocket}=require('ws');
const {createRequestPolicy}=require('../server/request-policy111.cjs'),{createLocal107}=require('../server/local107.cjs');
const fake=(headers={},address='127.0.0.1',encrypted=false)=>({headers:{host:'campus.example',...headers},socket:{remoteAddress:address,encrypted}});
test('explicit HTTPS origin and proxy trust, no arbitrary forwarding or cross-origin WebSocket',()=>{
 assert.throws(()=>createRequestPolicy({environment:'production'}));assert.throws(()=>createRequestPolicy({environment:'production',publicOrigin:'http://campus.example'}));
 const p=createRequestPolicy({environment:'production',publicOrigin:'https://campus.example',trustProxy:['127.0.0.1']});
 const h={'x-forwarded-proto':'https','x-forwarded-for':'203.0.113.8',origin:'https://campus.example'};
 assert.deepEqual(p.inspect(fake(h),{websocket:true}),{secure:true,address:'203.0.113.8',origin:'https://campus.example'});
 assert.throws(()=>p.inspect(fake(h,'198.51.100.2')));assert.throws(()=>p.inspect(fake({...h,'x-forwarded-for':'1.2.3.4, 5.6.7.8'})));assert.throws(()=>p.inspect(fake({...h,origin:'https://evil.example'}),{websocket:true}));assert.throws(()=>p.inspect(fake({...h,host:'internal.example'})));assert.throws(()=>p.inspect(fake({...h,origin:undefined}),{websocket:true}));
 const local=createRequestPolicy();assert.equal(local.inspect(fake({...h,host:'localhost:8766',origin:'http://localhost:8766'})).secure,false);
});
const pool=new http.Agent({keepAlive:true,maxSockets:48});
function get(port,url,headers){return new Promise((resolve,reject)=>{const q=http.get({host:'127.0.0.1',port,path:url,headers,agent:pool},r=>{let body='';r.on('data',s=>body+=s);r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body}))});q.on('error',reject)})}
test('production cookie, readiness, shared NAT arrival and consistent backup/restore',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'3nu-ops111-')),backup=directory+'-backup',restore=directory+'-restore';execFileSync(process.execPath,[path.resolve('scripts/setup-community107.cjs'),directory]);const options={directory,environment:'production',publicOrigin:'https://campus.example',trustProxy:['127.0.0.1']};let c=createLocal107(options);const a=await c.listen(0),h={host:'campus.example','x-forwarded-proto':'https','x-forwarded-for':'203.0.113.8',origin:'https://campus.example'};
 try{
  assert.equal((await get(a.port,'/ready',h)).status,200);assert.equal((await get(a.port,'/api/session',{...h,origin:'https://other.example'})).status,403);
  console.log('ops: sessions');const sessions=await Promise.all(Array.from({length:300},()=>get(a.port,'/api/session',h)));assert(sessions.every(r=>r.status===200));assert(sessions.every(r=>r.headers['set-cookie'].every(v=>v.includes('; Secure')&&v.includes('SameSite=Strict')&&v.includes('HttpOnly'))));
  console.log('ops: sessions OK');const rows=c.api.store.db.prepare('SELECT count(*) n FROM owners').get().n;assert.equal(rows,300);
  execFileSync(process.execPath,[path.resolve('scripts/backup-community107.cjs'),'backup',directory,backup]);execFileSync(process.execPath,[path.resolve('scripts/backup-community107.cjs'),'restore',backup,restore]);
  console.log('ops: backup OK');const anchors=c.anchors.seats[0],ws=new WebSocket('ws://127.0.0.1:'+a.port+'/multiplayer',{headers:h});await new Promise((resolve,reject)=>{ws.once('error',reject);ws.once('open',resolve)});ws.send(JSON.stringify({type:'hello',state:{x:anchors.x,y:anchors.y+.95,z:anchors.z,yaw:0,name:'정상종료',character:'rio',action:'idle',moving:false,bus:null}}));await new Promise(r=>ws.once('message',r));const closed=new Promise(r=>ws.once('close',code=>r(code)));await c.close();assert.equal(await closed,1012);
  c=createLocal107({...options,directory:restore});await c.listen(0);assert.equal(c.api.store.db.prepare('SELECT count(*) n FROM owners').get().n,rows);assert.equal(c.api.store.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 }finally{await c.close();pool.destroy();for(const folder of [directory,backup,restore])fs.rmSync(folder,{recursive:true,force:true})}
});
