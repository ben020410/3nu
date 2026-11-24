'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{WebSocketServer,WebSocket}=require('ws');
const {selectNearby}=require('./interest110.cjs');
const {beanbagInReach97}=require('../dist/leisure97.js');
const Style125=require('../dist/character-style125.js');
const Sim=require('../dist/shuttle-simulation100.js'),Player=require('../dist/player-state.js'),anchors=require('../source-data/multiplayer106-anchors.json');
function createCampusServer(options={}){
 const root=fs.realpathSync(options.staticRoot||path.resolve(__dirname,'../dist')),originTime=performance.now(),now=options.now||(()=>performance.now()-originTime),epoch=crypto.randomUUID(),sessions=new Map(),seats=new Map(),bySeat=new Map(anchors.seats.map(s=>[s.id,s])),bus=Sim.create(anchors.bus),limit=options.capacity||20,channelIds=options.channels||['01'],metrics={connections:0,messages:0,invalid:0,sentBytes:0,receivedBytes:0,ticks:0,maxTickMs:0,maxRecipients:0,skippedSends:0};
 if(!Number.isInteger(limit)||limit<1||limit>1000||!Array.isArray(channelIds)||!channelIds.length||new Set(channelIds).size!==channelIds.length)throw Error('Invalid channel configuration');
 let interest=new Map(),interestAt=-Infinity,wireSequence=0;const upgrades=new Map();
 const seatKey=(s,id)=>channelIds.length===1?id:s.channel+':'+id;
 function channelList(){return channelIds.map(id=>({id,population:[...sessions.values()].filter(s=>s.ws&&s.channel===id).length,capacity:limit}))}
 function invalidate(){interestAt=-Infinity}

 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.m4a':'audio/mp4','.woff2':'font/woff2','.bin':'application/octet-stream','.md':'text/plain; charset=utf-8','.osm':'application/xml'};
 let draining=false;
 const server=http.createServer((req,res)=>{res.setHeader('Referrer-Policy','same-origin');if(req.url?.split('?')[0]==='/admin107.html'){res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'")}if(draining){res.writeHead(503,{'Retry-After':'5'});return res.end('restarting')}if(options.requestPolicy){try{options.requestPolicy.inspect(req)}catch{res.writeHead(403);return res.end('Forbidden')}}if(req.url==='/ready'){let ok=true;try{ok=options.ready?options.ready():true}catch{ok=false}res.writeHead(ok?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({ok,build:options.build||106}))}if(options.requestHandler?.(req,res))return;if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end()}let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}if(name==='/admin107.html'){res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'")}if(name==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,build:options.build||106,players:[...sessions.values()].filter(s=>s.ws).length,capacity:limit,channels:channelList()}))}const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)||name.split('/').some(part=>part.startsWith('.'))||(!types[path.extname(file)]&&!name.endsWith('/EARCUT-LICENSE'))){res.writeHead(403);return res.end()}fs.realpath(file,(realError,real)=>{if(realError||!real.startsWith(root+path.sep)){res.writeHead(404);return res.end()}fs.stat(real,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();const stream=fs.createReadStream(real);stream.on('error',()=>res.destroy());stream.pipe(res)})})});
 server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxHeadersCount=64;server.maxRequestsPerSocket=1000;
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{let u;try{u=new URL(req.url,'http://localhost')}catch{return socket.destroy()}let policyAllowed=!draining,network=req.socket.remoteAddress;try{network=options.requestPolicy?.inspect(req,{websocket:true}).address||network}catch{policyAllowed=false}const allowed=policyAllowed&&(!!options.requestPolicy||!req.headers.origin||req.headers.origin==='http://'+req.headers.host||(options.origins||[]).includes(req.headers.origin));if(u.pathname!=='/multiplayer'||!allowed||wss.clients.size>=limit*channelIds.length+32){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');return socket.destroy()}const t=now();for(const [k,v]of upgrades)if(v.until<=t)upgrades.delete(k);const rate=upgrades.get(network)||{count:0,until:t+60000};if(rate.count>=600||(!upgrades.has(network)&&upgrades.size>=4096)){socket.end('HTTP/1.1 429 Too Many Requests\r\nRetry-After: 60\r\nConnection: close\r\n\r\n');return}rate.count++;upgrades.set(network,rate);wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req))});
 function send(ws,obj){if(ws?.readyState!==WebSocket.OPEN||ws.bufferedAmount>65536){metrics.skippedSends++;return;}const s=JSON.stringify(obj);metrics.sentBytes+=Buffer.byteLength(s);ws.send(s)}
 function release(s){if(s.seat&&seats.get(seatKey(s,s.seat))===s.id)seats.delete(seatKey(s,s.seat));s.seat=null;if(s.state)s.state.seat=null;}
 function remove(s){release(s);s.ws=null;s.until=now()+60000;invalidate();}
 function busAt(distance){const a=anchors.bus.samples,n=a.length-1,t=Sim.mod(distance,bus.length)/bus.length*n,i=Math.floor(t),f=t-i;return a[i].map((v,k)=>v+(a[i+1][k]-v)*f)}
 function riderPose(s,t){if(!s.state?.bus)return;const v=bus.vehicle(t/1000,s.state.bus.index),q=busAt(v.distance),a=s.state.bus.offset,yaw=Math.atan2(q[3],q[4]);s.state.x=q[0]+Math.cos(yaw)*a[0]+Math.sin(yaw)*a[2];s.state.y=q[1]+a[1];s.state.z=q[2]-Math.sin(yaw)*a[0]+Math.cos(yaw)*a[2];s.state.yaw=yaw;}
 const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 function stateValid(p){const [xmin,zmin,xmax,zmax]=anchors.bounds;return p&&Object.keys(p).every(k=>['x','y','z','yaw','name','character','action','moving','bus','style'].includes(k))&&finite(p.x,xmin-10,xmax+10)&&finite(p.z,zmin-10,zmax+10)&&finite(p.y,-100,3000)&&finite(p.yaw,-100,100)&&typeof p.name==='string'&&!Player.validate(p.name)&&['rio','baekhak','cat'].includes(p.character)&&(p.style===undefined||Style125.valid(p.style))&&['idle','walk','fly','jump','crouch','sit','wave','drink','read','sketch','water','picnic','look','mist','bell','stretch'].includes(p.action)&&typeof p.moving==='boolean'&&(p.bus===null||p.bus&&Number.isInteger(p.bus.index)&&p.bus.index>=0&&p.bus.index<6&&Array.isArray(p.bus.offset)&&p.bus.offset.length===3&&finite(p.bus.offset[0],-1.5,1.5)&&finite(p.bus.offset[1],0,4)&&finite(p.bus.offset[2],-5.5,5.5));}
 function update(s,p,first=false){const t=now();if(!stateValid(p)){metrics.invalid++;return false}if(!first&&s.state){const previous=s.state;if(p.bus&&!previous.bus){const v=bus.vehicle(t/1000,p.bus.index),stop=anchors.bus.stops.find(q=>q.id===v.stopId);if(!v.dwell||!stop||Math.hypot(previous.x-stop.approach.x,previous.z-stop.approach.z)>16||Math.abs(previous.y-.95-stop.approach.y)>2){send(s.ws,{type:'correct',state:previous,reason:'bus'});return false}}
  if(!p.bus&&previous.bus){const v=bus.vehicle(t/1000,previous.bus.index),stop=anchors.bus.stops.find(q=>q.id===v.stopId);if(!v.dwell||!stop||Math.hypot(p.x-stop.approach.x,p.z-stop.approach.z)>16||Math.abs(p.y-.95-stop.approach.y)>2){send(s.ws,{type:'correct',state:previous,reason:'alight'});return false}}
  if(!s.seat&&!p.bus&&!previous.bus){const dt=Math.min(2,Math.max(.05,(t-s.updated)/1000)),distance=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);if(distance>75*dt+3){metrics.invalid++;send(s.ws,{type:'correct',state:previous,reason:'movement'});return false}}
 }
 if(first&&p.bus)p={...p,bus:null,action:'idle'};s.state={...p,name:Player.nickname(p.name),seat:s.seat};if(s.seat){const a=bySeat.get(s.seat);Object.assign(s.state,{x:a.px,y:a.py,z:a.pz,yaw:a.angle,action:'sit',bus:null})}riderPose(s,t);s.updated=t;return true;}
 wss.on('connection',(ws,req)=>{metrics.connections++;let socialOwner=options.socialIdentity?.(req)||null;let owner=null,windowAt=now(),count=0;ws.alive=true;ws.on('pong',()=>ws.alive=true);const joinTimer=setTimeout(()=>{if(!owner)ws.close(1008,'join timeout')},5000);joinTimer.unref();
 ws.on('message',(raw,binary)=>{metrics.receivedBytes+=raw.length;metrics.messages++;const t=now();if(t-windowAt>=1000){windowAt=t;count=0}if(++count>40||binary){metrics.invalid++;return ws.close(1008,'message rate/type')}let m;try{m=JSON.parse(raw.toString())}catch{metrics.invalid++;return ws.close(1008,'invalid json')}
 if(!m||typeof m.type!=='string')return ws.close(1008,'invalid message');
 if(m.type==='hello'&&!owner){
  socialOwner=options.verifySocialToken?.(m.socialToken)||socialOwner;
  if(!stateValid(m.state))return ws.close(1008,'invalid profile');
  const existing=typeof m.token==='string'&&m.token.length<100?[...sessions.values()].find(s=>s.token===m.token&&s.until>t):null;
  if(existing?.ws)return ws.close(1008,'session already connected');
  if(channelIds.length===1&&options.legacyChannels?.includes(m.channel))m.channel=channelIds[0];
  if(m.channel!==undefined&&m.channel!==null&&!channelIds.includes(m.channel))return ws.close(1008,'invalid channel');
  const list=channelList(),requested=existing?.channel||m.channel;
  const target=requested?list.find(c=>c.id===requested):[...list].sort((a,b)=>a.population-b.population||a.id.localeCompare(b.id))[0];
  if(!existing&&sessions.size>=limit*channelIds.length+900){send(ws,{type:'full',channel:target?.id,capacity:limit,channels:list});return ws.close(1013,'resume capacity')}if(!target||target.population>=limit){send(ws,{type:'full',channel:target?.id||requested,capacity:limit,channels:list});return ws.close(1013,'channel full')}
  owner=existing||{id:crypto.randomUUID(),state:null,seat:null,updated:t};release(owner);
  owner.channel=target.id;owner.compact=m.protocol===110||m.protocol===125;owner.appearance125=m.protocol===125;owner.wireId||=++wireSequence;owner.sentPeers=new Map();owner.token=crypto.randomBytes(32).toString('hex');owner.ws=ws;owner.until=Infinity;sessions.set(owner.id,owner);update(owner,m.state,true);invalidate();clearTimeout(joinTimer);
  send(ws,{type:'welcome',id:owner.id,token:owner.token,epoch,time:t,capacity:limit,channel:owner.channel,channels:channelList()});return;
 }
 if(!owner||owner.ws!==ws)return ws.close(1008,'join required');
 if(m.type==='channels')send(ws,{type:'channels',channel:owner.channel,channels:channelList()});
 else if(m.type==='switch'&&typeof m.request==='string'&&m.request.length<40){
  const target=channelList().find(c=>c.id===m.channel);let reason=null;
  if(!target)reason='invalid';else if(owner.seat||owner.state.bus)reason='busy';else if(target.id!==owner.channel&&target.population>=limit)reason='full';
  // Validation and commit run synchronously: no reservation race or intermediate membership.
  if(!reason){release(owner);owner.channel=target.id;owner.sentPeers=new Map();invalidate()}
  send(ws,{type:'switch',request:m.request,ok:!reason,reason,channel:owner.channel,channels:channelList()});
 }
 else if(m.type==='chat'&&typeof m.request==='string'&&/^[a-zA-Z0-9-]{1,48}$/.test(m.request)){
  try{
   if(!options.social)throw Object.assign(Error('지금은 채팅에 연결할 수 없어요.'),{status:503});
   const message=options.social.accept(socialOwner,owner.state.name,owner.channel,m.body);
   const active=[...sessions.values()].filter(s=>s.ws&&s.state);
   if(t-interestAt>=200){interest=selectNearby(active,new Map([...interest].map(([id,v])=>[id,v.ids])));interestAt=t}const nearby=interest;
   // Recipients must already share the server interest scope AND be within speech range.
   for(const s of active)if(s.id===owner.id||s.channel===owner.channel&&nearby.get(s.id)?.ids.includes(owner.id)&&Math.hypot(s.state.x-owner.state.x,s.state.z-owner.state.z)<=36&&Math.abs(s.state.y-owner.state.y)<=12)send(s.ws,{type:'chat',actor:owner.id,...message});
   send(ws,{type:'chat-result',request:m.request,ok:true});
  }catch(e){send(ws,{type:'chat-result',request:m.request,ok:false,error:e.status?e.message:'채팅을 보내지 못했어요.',retryAfter:e.retry||0})}
 }
 else if(m.type==='state')update(owner,m.state);
 else if(m.type==='clock'&&finite(m.client,0,1e15))send(ws,{type:'clock',client:m.client,time:t,epoch});
 else if(m.type==='claim'&&typeof m.request==='string'&&m.request.length<40){const a=bySeat.get(m.seat),p=owner.state,valid=!!a&&!owner.seat&&!p.bus&&(a.kind==='beanbag'?['idle','walk','crouch','fly','jump'].includes(p.action)&&beanbagInReach97(p,a,p.action==='fly'||p.action==='jump'):['idle','walk','crouch','fly'].includes(p.action)&&Math.hypot(p.x-a.x,p.z-a.z)<2.9&&Math.abs(p.y-.95-a.y)<.7)&&!seats.has(seatKey(owner,a.id));if(valid){owner.seat=a.id;seats.set(seatKey(owner,a.id),owner.id);Object.assign(owner.state,{seat:a.id,x:a.px,y:a.py,z:a.pz,yaw:a.angle,action:'sit',bus:null})}send(ws,{type:'claim',request:m.request,ok:valid,seat:valid?a.id:null})}
 else if(m.type==='release')release(owner);
 else if(m.type==='leave'){release(owner);sessions.delete(owner.id);invalidate();ws.close(1000,'title')}
 else if(m.type!=='clock'){metrics.invalid++;ws.close(1008,'unsupported message')}
 });ws.on('close',()=>{clearTimeout(joinTimer);if(owner?.ws===ws)remove(owner)});ws.on('error',()=>{});
 });
 function snapshot(s,t,players,population,nearby){
  if(!s.appearance125)players=players.map(p=>({...p,character:p.character==='cat'?'rio':p.character,style:undefined}));
  if(!s.compact)return send(s.ws,{type:'snapshot',time:t,channel:s.channel,population,capacity:limit,nearby,players});
  // Entries carry identity once. Frequent packets contain quantized poses only when changed.
  if(s.ws.bufferedAmount>65536){metrics.skippedSends++;return}
  const previous=s.sentPeers,seen=new Set(),peers=[],poses=[],left=[];
  for(const p of players){const k=sessions.get(p.id).wireId,meta=JSON.stringify([p.name,p.character,p.style,p.bus,p.seat]),pose=[k,Math.round(p.x*50),Math.round(p.y*50),Math.round(p.z*50),Math.round(p.yaw*100),p.action,p.moving?1:0],signature=JSON.stringify(pose),old=previous.get(k);seen.add(k);
   if(!old||old.meta!==meta)peers.push({k,id:p.id,name:p.name,character:p.character,style:p.style,bus:p.bus,seat:p.seat});
   if(!old||old.pose!==signature)poses.push(pose);previous.set(k,{meta,pose:signature});
  }
  for(const k of previous.keys())if(!seen.has(k)){left.push(k);previous.delete(k)}
  send(s.ws,{type:'snapshot',time:t,channel:s.channel,population,capacity:limit,nearby,peers,poses,left});
 }
 const timer=setInterval(()=>{
  const start=performance.now(),t=now();for(const [id,s]of sessions){if(!s.ws&&s.until<t)sessions.delete(id);else riderPose(s,t)}
  const active=[...sessions.values()].filter(s=>s.ws&&s.state),counts=channelList();
  if(t-interestAt>=200){interest=selectNearby(active,new Map([...interest].map(([id,v])=>[id,v.ids])));interestAt=t}
  for(const s of active){const selected=interest.get(s.id)||{ids:[],nearby:0},players=selected.ids.map(id=>sessions.get(id)).filter(p=>p?.ws&&p.channel===s.channel).map(p=>({id:p.id,...p.state}));metrics.maxRecipients=Math.max(metrics.maxRecipients,players.length);snapshot(s,t,players,counts.find(c=>c.id===s.channel).population,selected.nearby)}
  metrics.ticks++;metrics.maxTickMs=Math.max(metrics.maxTickMs,performance.now()-start)
 },100);timer.unref();
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue}ws.alive=false;ws.ping()}},5000);heartbeat.unref();
 return{server,wss,sessions,seats,metrics,channelList,epoch,now,bus,anchors,listen:(port=8766,host='127.0.0.1')=>new Promise(resolve=>server.listen(port,host,()=>resolve(server.address()))),close:()=>new Promise(resolve=>{draining=true;clearInterval(timer);clearInterval(heartbeat);for(const ws of wss.clients)ws.close(1012,'server restarting');wss.close();server.closeIdleConnections?.();const forced=setTimeout(()=>{for(const ws of wss.clients)ws.terminate();server.closeAllConnections?.()},1500);forced.unref();server.close(()=>{clearTimeout(forced);resolve()})})};
}
module.exports={createCampusServer};
if(require.main===module){const c=createCampusServer({origins:(process.env.CAMPUS_ORIGINS||'').split(',').filter(Boolean)});c.listen(Number(process.env.PORT||8766),process.env.HOST||'127.0.0.1').then(a=>console.log('3NU BUILD106 local http://'+a.address+':'+a.port));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>c.close().then(()=>process.exit(0)))}
