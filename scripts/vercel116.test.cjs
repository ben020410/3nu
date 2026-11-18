'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),{WebSocket}=require('ws');
const {createRequestPolicy}=require('../server/request-policy111.cjs'),{createLocal107}=require('../server/local107.cjs'),{createGateway}=require('../server/vercel-gateway116.cjs'),{configure}=require('./vercel-build116.cjs');
// Use raw HTTP so test Host headers model Nginx/Vercel exactly; Node fetch replaces Host.
function rawFetch(url,options={}){return new Promise((resolve,reject)=>{const q=http.request(url,{method:options.method||'GET',headers:{...options.headers,...options.body!==undefined?{'Content-Length':Buffer.byteLength(options.body)}:{}}},r=>{const chunks=[];r.on('data',c=>chunks.push(c));r.on('end',()=>{const headers=new Headers();for(let i=0;i<r.rawHeaders.length;i+=2)headers.append(r.rawHeaders[i],r.rawHeaders[i+1]);resolve(new Response(Buffer.concat(chunks),{status:r.statusCode,headers}))})});q.on('error',reject);q.end(options.body)})}
const browser='https://3nu.vercel.app',upstream='https://165.22.247.213',secret='ab'.repeat(32);
const base={environment:'production',publicOrigin:upstream,browserOrigin:browser,edgeProxySecret:secret,trustProxy:['127.0.0.1']};
const ingress={'host':'165.22.247.213','x-forwarded-proto':'https','x-forwarded-for':'198.51.100.20'};
function req(headers={},url='/api/session',peer='127.0.0.1'){return {url,headers:{...ingress,...headers},socket:{remoteAddress:peer}}}
test('116 split-hosting API requires a gateway key, trustworthy ingress and one valid client IP',()=>{
 const p=createRequestPolicy(base),h={origin:browser,'x-3nu-edge-key':secret,'x-3nu-client-ip':'203.0.113.7'};
 assert.deepEqual(p.inspect(req(h)),{secure:true,origin:browser,address:'203.0.113.7'});
 for(const patch of [{'x-3nu-edge-key':'ff'.repeat(32)},{'x-3nu-edge-key':undefined},{'x-3nu-client-ip':undefined},{'x-3nu-client-ip':'1.2.3.4, 5.6.7.8'}, {origin:'https://evil.example'},{'sec-fetch-site':'cross-site'}])assert.throws(()=>p.inspect(req({...h,...patch})));
 assert.throws(()=>p.inspect(req(h,'/ready')));assert.throws(()=>p.inspect(req(h,'/api/session','198.51.100.1')));
 assert.throws(()=>p.inspect(req({origin:browser})));
 const original=createRequestPolicy({...base,browserOrigin:undefined,edgeProxySecret:undefined});assert.throws(()=>original.inspect(req(h)));
 assert.equal(original.inspect(req({origin:upstream})).origin,upstream);
 assert.throws(()=>createRequestPolicy({...base,edgeProxySecret:undefined}));assert.throws(()=>createRequestPolicy({...base,browserOrigin:'http://3nu.vercel.app'}));
});
test('116 browser WebSocket exception is exact-origin and cannot authorize HTTP or privileged gateways',()=>{
 const p=createRequestPolicy(base),h={origin:browser,'sec-fetch-site':'cross-site'};
 assert.equal(p.inspect(req(h,'/multiplayer'),{websocket:true}).origin,browser);
 assert.throws(()=>p.inspect(req(h)));
 for(const origin of [undefined,'null','https://evil.example','https://3nu.vercel.app.evil.example'])assert.throws(()=>p.inspect(req({...h,origin},'/multiplayer'),{websocket:true}));
 assert.throws(()=>p.inspect(req({...h,'x-3nu-edge-key':secret,'x-3nu-client-ip':'203.0.113.1'},'/multiplayer'),{websocket:true}));
});
test('116 Vercel gateway preserves sessions, CSRF, spam limits, private feedback and admin authorization',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'3nu116-gateway-'));
 execFileSync(process.execPath,[path.resolve('scripts/setup-community107.cjs'),directory]);
 const backend=createLocal107({...base,directory}),address=await backend.listen(0);let forwarded=[];
 const gateway=createGateway({publicOrigin:browser,upstreamOrigin:upstream,secret,fetchImpl:async(url,options)=>{
  forwarded.push({url,method:options.method,ip:options.headers['X-3NU-Client-IP']});
  return rawFetch('http://127.0.0.1:'+address.port+new URL(url).pathname+new URL(url).search,{...options,headers:{...options.headers,...ingress}})
 }});
 const front=http.createServer((r,s)=>gateway(r,s));await new Promise(r=>front.listen(0,'127.0.0.1',r));
 async function call(j,route,method='GET',body,extra={}){
  const response=await rawFetch('http://127.0.0.1:'+front.address().port+route,{method,headers:{host:'3nu.vercel.app',Origin:browser,'x-vercel-forwarded-for':j.ip||'203.0.113.7','sec-fetch-site':'same-origin',Cookie:j.cookie||'',...method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':j.csrf||''}:{},...extra},body:method==='GET'?undefined:JSON.stringify(body)});
  const cookies=response.headers.getSetCookie();j.jar??={};for(const c of cookies){const [pair]=c.split(';'),i=pair.indexOf('=');j.jar[pair.slice(0,i)]=pair.slice(i+1)}j.cookie=Object.entries(j.jar).map(([k,v])=>k+'='+v).join('; ');
  const text=await response.text();if(!text)throw Error('Empty test response: '+method+' '+route+' status '+response.status);return {status:response.status,headers:response.headers,cookies,data:JSON.parse(text)};
 }
 try{
  const owner={},other={ip:'203.0.113.8'},admin={};const s=await call(owner,'/api/session');owner.csrf=s.data.csrf;assert.equal(s.status,200);assert.equal(s.cookies.length,2);assert(s.cookies.every(c=>c.includes('Secure')&&c.includes('HttpOnly')&&c.includes('SameSite=Strict')&&!c.includes('Domain=')));assert.equal(s.headers.get('cache-control'),'no-store');
  other.csrf=(await call(other,'/api/gateway?__3nu_path=session')).data.csrf;assert.equal(forwarded.at(-1).url,upstream+'/api/session');assert.equal(forwarded.at(-1).ip,other.ip);
  assert.equal((await call(owner,'/api/admin/stats')).status,401);assert.equal((await call(owner,'/api/admin/visits')).status,401);
  const entry={key:crypto.randomUUID(),name:'배포검증',character:'rio',body:'공개 전 격리 테스트'};
  const created=await call(owner,'/api/posts','POST',entry);assert.equal(created.status,201);
  assert.equal((await call(owner,'/api/posts','POST',entry)).data.id,created.data.id);
  assert.equal((await call(owner,'/api/posts','POST',{...entry,key:crypto.randomUUID(),body:'연속 작성'})).status,429);
  assert.equal((await call(owner,'/api/posts/'+created.data.id,'DELETE',{}, {'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await call(other,'/api/posts/'+created.data.id,'DELETE',{})).status,403);
  assert.equal((await call(owner,'/api/posts/'+created.data.id,'DELETE',{})).status,200);
  assert.equal((await call(owner,'/api/feedback','POST',{key:crypto.randomUUID(),body:'비공개 피드백'})).status,201);
  assert.equal((await call(other,'/api/feedback')).status,404);
  const password=fs.readFileSync(path.join(directory,'ADMIN-PASSWORD.txt'),'utf8').trim();const login=await call(admin,'/api/admin/login','POST',{password});assert.equal(login.status,200);admin.csrf=login.data.csrf;
  assert.equal((await call(owner,'/api/admin/test-nickname-exclusion','POST',{enabled:false})).status,401);
  assert.equal((await call(admin,'/api/admin/test-nickname-exclusion','POST',{enabled:false},{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await call(admin,'/api/admin/test-nickname-exclusion','POST',{enabled:'false'})).status,400);
  assert.equal((await call(admin,'/api/admin/stats')).data.testNicknameExclusion,true);
  assert.equal((await call(admin,'/api/admin/test-nickname-exclusion','POST',{enabled:false})).data.enabled,false);
  assert.equal((await call(admin,'/api/admin/stats')).data.testNicknameExclusion,false);
  assert.equal((await call(admin,'/api/admin/test-nickname-exclusion','POST',{enabled:true})).data.enabled,true);

  assert.equal((await call(admin,'/api/admin/stats')).status,200);assert.equal((await call(admin,'/api/admin/feedback')).data.items.length,1);
  assert.equal((await call(owner,'/api/visits','POST',{tab:'visitlog123',kind:'enter',visible:true,name:'테스트 방문'})).status,200);
  const visits=await call(admin,'/api/gateway?__3nu_path=admin/visits');assert.equal(visits.status,200);assert.equal(visits.data.items[0].name,'테스트 방문');assert.equal(visits.headers.get('cache-control'),'no-store');assert.equal((await call(admin,'/api/admin/visits?from=bad')).status,400);assert.equal((await call(owner,'/api/admin/visits')).status,401);
  const before=forwarded.length;for(const bad of ['/api/gateway?__3nu_path=..%2Fprivate.json','/api/gateway?__3nu_path=session&__3nu_path=admin/stats','/private.json','/api/gateway?__3nu_path=https://evil.example'])assert.notEqual((await call(owner,bad)).status,200);
  assert.equal((await call(owner,'/api/session','GET',undefined,{Origin:'https://evil.example'})).status,403);
  assert.equal((await call(owner,'/api/session','GET',undefined,{'sec-fetch-site':'cross-site'})).status,403);
  assert.equal((await call(owner,'/api/session','GET',undefined,{host:'other.vercel.app'})).status,403);
  assert.equal((await call(owner,'/api/session','GET',undefined,{'x-vercel-forwarded-for':'1.2.3.4, 5.6.7.8'})).status,503);
  assert.equal(forwarded.length,before);
  const direct=await rawFetch('http://127.0.0.1:'+address.port+'/api/session',{headers:{...ingress,origin:browser}});assert.equal(direct.status,403);
  const ws=new WebSocket('ws://127.0.0.1:'+address.port+'/multiplayer',{headers:{...ingress,origin:browser,'sec-fetch-site':'cross-site'}});
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
  ws.send(JSON.stringify({type:'hello',state:{x:0,y:100,z:200,yaw:0,name:'연결검증',character:'rio',action:'idle',moving:false,bus:null}}));
  const welcome=await new Promise(r=>ws.once('message',x=>r(JSON.parse(x))));assert.equal(welcome.type,'welcome');ws.close();
 }finally{await new Promise(r=>front.close(r));await backend.close();fs.rmSync(directory,{recursive:true,force:true})}
});
test('116 gateway timeouts/redirects expose no secrets and do not retry writes',async()=>{
 for(const result of ['timeout','redirect']){
  let count=0;const gateway=createGateway({publicOrigin:browser,upstreamOrigin:upstream,secret,fetchImpl:async()=>{count++;if(result==='timeout')throw Error('contains '+secret);return new Response('bad',{status:302,headers:{Location:'https://evil.example'}})}});
  const server=http.createServer((r,s)=>gateway(r,s));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const r=await rawFetch('http://127.0.0.1:'+server.address().port+'/api/posts',{method:'POST',headers:{host:'3nu.vercel.app',Origin:browser,'x-vercel-forwarded-for':'203.0.113.7','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,result==='timeout'?503:502);assert(!(await r.text()).includes(secret));assert.equal(count,1)}finally{await new Promise(r=>server.close(r))}
 }
});
test('116 Vercel build fails closed without release flag and never writes gateway key to static assets',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'3nu116-build-'));fs.mkdirSync(path.join(root,'dist'));const html='<meta content="https://165.22.247.213/"><script defer src="multiplayer106.js?v=113"></script>';
 const env={CAMPUS_BROWSER_ORIGIN:browser,CAMPUS_UPSTREAM_ORIGIN:upstream,CAMPUS_EDGE_PROXY_SECRET:secret};fs.writeFileSync(path.join(root,'dist/index.html'),html);
 try{assert.throws(()=>configure(root,env),/Publication/);assert.equal(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),html);
 configure(root,{...env,CAMPUS_RELEASE_APPROVED:'116'});const after=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),runtime=fs.readFileSync(path.join(root,'dist/hosting116.js'),'utf8');assert(after.includes(browser));assert(after.indexOf('hosting116.js')<after.indexOf('multiplayer106.js'));assert(runtime.includes('wss://165.22.247.213/multiplayer'));assert(!runtime.includes(secret)&&!after.includes(secret));
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'0.0.117'}));assert.throws(()=>configure(root,{...env,CAMPUS_RELEASE_APPROVED:'116'}),/Publication/);configure(root,{...env,CAMPUS_RELEASE_APPROVED:'117'});const next=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');assert(next.includes('hosting116.js?v=117'));assert.equal((next.match(/src="hosting116\.js/g)||[]).length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});

test('122 Vercel config precedes deferred campus loader without activating runtime',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'3nu122-build-'));fs.mkdirSync(path.join(root,'dist'));
 const marker='<script type="application/x-3nu-runtime" data-runtime-src="multiplayer106.js?v=113"></script>';
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({version:'0.0.122'}));
 fs.writeFileSync(path.join(root,'dist/index.html'),marker+'<script defer src="startup122.js?v=122"></script>');
 try{configure(root,{CAMPUS_BROWSER_ORIGIN:browser,CAMPUS_UPSTREAM_ORIGIN:upstream,CAMPUS_EDGE_PROXY_SECRET:secret,CAMPUS_RELEASE_APPROVED:'122'});const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');assert(html.includes(marker));assert(html.indexOf('hosting116.js?v=122')<html.indexOf('startup122.js'));assert(!html.includes('<script defer src="multiplayer106.js'));assert(!html.includes(secret));}finally{fs.rmSync(root,{recursive:true,force:true})}
});
