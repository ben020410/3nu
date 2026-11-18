'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRequestPolicy}=require('./request-policy111.cjs');
const {openCommunity,Problem,hash}=require('./community107.cjs');
const {createVisitLog}=require('./visit-log123.cjs');
const defaultDirectory=path.resolve(__dirname,'../../../05-management/local-runtime/development');
function privateConfig(directory=defaultDirectory){const file=path.join(directory,'private.json');if(!fs.existsSync(file))throw Error('Run npm run setup:local first. Private credentials stay outside main.');const config=JSON.parse(fs.readFileSync(file,'utf8'));if(!/^[a-f0-9]{64}$/.test(config.salt)||!/^[a-f0-9]{128}$/.test(config.passwordHash)||!/^[a-f0-9]{64}$/.test(config.secret))throw Error('Invalid private config');return config}
function createCommunityHTTP({directory=defaultDirectory,now=()=>Date.now(),environment='development',publicOrigin,trustProxy=[],requestPolicy}={}){
 directory=path.resolve(directory);const main=path.resolve(__dirname,'..');if(directory===main||directory.startsWith(main+path.sep))throw Error('Private runtime must be outside main');
 const policy=requestPolicy||createRequestPolicy({environment,publicOrigin,trustProxy});
 const config=privateConfig(directory),store=openCommunity(path.join(directory,'community.sqlite'),{now,environment}),admins=new Map(),visitLog=createVisitLog(store,now);let loginJobs=0;
 const hmac=s=>crypto.createHmac('sha256',config.secret).update(s).digest('hex');
 const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
 const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(p=>p.trim().split('=')));const valid=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
 function cookie(res,key,value,age,secure){const a=res.getHeader('Set-Cookie')||[];res.setHeader('Set-Cookie',[...a,`${key}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`])}
 function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))}
 async function body(req,max=4096){let size=0,parts=[];for await(const p of req){size+=p.length;if(size>max)throw new Problem(413,'요청이 너무 커요.');parts.push(p)}try{const value=JSON.parse(Buffer.concat(parts).toString('utf8')||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('object required');return value}catch{throw new Problem(400,'잘못된 요청입니다.')}}
 function auth(c){const a=valid(c.nuAdmin107)&&admins.get(hash(c.nuAdmin107));if(!a||a.until<=now())throw new Problem(401,'관리자 로그인이 필요합니다.');return a}
 async function handle(req,res){let u;try{u=new URL(req.url,'http://localhost')}catch{return false}if(!u.pathname.startsWith('/api/'))return false;
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');let context;try{context=policy.inspect(req)}catch{return json(res,403,{error:'허용된 같은 사이트에서 요청해 주세요.'})}const {secure,origin,address}=context,c=cookies(req);
 // Untrusted forwarding headers never alter identity, protocol or the allowed origin.
 const network=hmac('network:'+Math.floor(now()/86400000)+':'+address);let o=valid(c.nuOwner107)?hash(c.nuOwner107):null;
 try{
  if(o&&!store.db.prepare('SELECT id FROM owners WHERE id=?').get(o))o=null;
  if(req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')throw new Problem(403,'다른 사이트의 요청은 허용하지 않습니다.');
  if(!['GET','POST','PUT','DELETE'].includes(req.method))throw new Problem(405,'지원하지 않는 요청');
  if(req.method!=='GET'&&(req.headers.origin!==origin||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')))throw new Problem(403,'같은 사이트에서 다시 시도해 주세요.');
  store.cleanup();store.rate(network,'request-network',6000,60000);for(const [k,a]of admins)if(a.until<=now())admins.delete(k);
  if(u.pathname==='/api/session'&&req.method==='GET'){
   if(!o){store.rate(network,'credential',600,3600000);const token=crypto.randomBytes(32).toString('hex');cookie(res,'nuOwner107',token,31536000,secure);c.nuOwner107=token;o=hash(token);store.owner(o)}
   if(!valid(c.nuVisitor107)){const id=crypto.randomBytes(32).toString('hex');cookie(res,'nuVisitor107',id,31536000,secure);c.nuVisitor107=id}
   return json(res,200,{csrf:hmac('owner:'+c.nuOwner107),environment,limit:300});
  }
  if(u.pathname==='/api/admin/login'&&req.method==='POST'){
   store.rate(network,'login',10,900000);const b=await body(req);if(typeof b.password!=='string'||b.password.length>256)throw new Problem(401,'로그인 정보를 확인해 주세요.');if(loginJobs>=2)throw new Problem(429,'로그인 요청이 많아요. 잠시 후 다시 시도해 주세요.',3);let digest;loginJobs++;try{digest=await new Promise((resolve,reject)=>crypto.scrypt(b.password,config.salt,64,(e,v)=>e?reject(e):resolve(v.toString('hex'))))}finally{loginJobs--}if(!equal(digest,config.passwordHash))throw new Problem(401,'로그인 정보를 확인해 주세요.');const token=crypto.randomBytes(32).toString('hex');if(valid(c.nuAdmin107))admins.delete(hash(c.nuAdmin107));if(admins.size>=32)throw new Problem(429,'관리자 세션이 많아요. 기존 세션을 종료해 주세요.',60);admins.set(hash(token),{until:now()+8*3600000});cookie(res,'nuAdmin107',token,28800,secure);return json(res,200,{csrf:hmac('admin:'+token)});
  }
  if(u.pathname==='/api/notices'&&req.method==='GET')return json(res,200,store.bulletin.notices({before:before(u)}));
  if(u.pathname.startsWith('/api/admin/')){
   auth(c);if(req.method!=='GET'&&!equal(req.headers['x-csrf-token'],hmac('admin:'+c.nuAdmin107)))throw new Problem(403,'관리자 요청을 다시 열어 주세요.');
   if(u.pathname==='/api/admin/notices'&&req.method==='GET')return json(res,200,store.bulletin.notices({admin:true,before:before(u)}));
   if(u.pathname==='/api/admin/notices'&&req.method==='POST')return json(res,201,store.bulletin.saveNotice(null,await body(req,16384),hash(c.nuAdmin107)));
   const notice=u.pathname.match(/^\/api\/admin\/notices\/(\d+)$/);if(notice&&req.method==='PUT')return json(res,200,store.bulletin.saveNotice(Number(notice[1]),await body(req,16384),hash(c.nuAdmin107)));if(notice&&req.method==='DELETE')return json(res,200,store.bulletin.deleteNotice(Number(notice[1])));
   if(u.pathname==='/api/admin/feedback'&&req.method==='GET')return json(res,200,store.bulletin.feedback(before(u)));
   const feedback=u.pathname.match(/^\/api\/admin\/feedback\/(\d+)$/);if(feedback&&req.method==='POST'){const b=await body(req);return json(res,200,store.bulletin.moderateFeedback(Number(feedback[1]),b.action))}
   if(u.pathname==='/api/admin/session'&&req.method==='GET')return json(res,200,{csrf:hmac('admin:'+c.nuAdmin107)});
   if(u.pathname==='/api/admin/logout'&&req.method==='POST'){admins.delete(hash(c.nuAdmin107));cookie(res,'nuAdmin107','',0,secure);return json(res,200,{ok:true})}
   if(u.pathname==='/api/admin/exclusion'&&req.method==='POST'){const b=await body(req);cookie(res,'nuExclude107',b.exclude?hmac('exclude'):'',b.exclude?31536000:0,secure);return json(res,200,{ok:true,excluded:!!b.exclude})}
   if(u.pathname==='/api/admin/test-nickname-exclusion'&&req.method==='POST')return json(res,200,visitLog.setOptions(await body(req)));
   if(u.pathname==='/api/admin/visits'&&req.method==='GET')return json(res,200,visitLog.list(u.searchParams));
   if(u.pathname==='/api/admin/stats'&&req.method==='GET')return json(res,200,{...store.stats(Number(u.searchParams.get('days')||7)),testNicknameExclusion:visitLog.options().enabled});
   if(u.pathname==='/api/admin/export'&&req.method==='GET'){const csv=store.csv(Number(u.searchParams.get('days')||7));res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="3nu-visits.csv"'});return res.end(csv)}
   if(u.pathname==='/api/admin/posts'&&req.method==='GET'){const r=store.list(o,{admin:true,before:before(u)});for(const p of r.posts)p.reportDetails=store.db.prepare('SELECT reason,state,at FROM reports WHERE post=? ORDER BY at DESC').all(p.id);return json(res,200,r)}
   const match=u.pathname.match(/^\/api\/admin\/posts\/(\d+)$/);if(match&&req.method==='POST'){const b=await body(req);return json(res,200,store.moderate(Number(match[1]),b.action))}
   throw new Problem(404,'관리자 경로를 찾을 수 없습니다.');
  }
  if(!o)throw new Problem(401,'연결을 다시 확인해 주세요.');if(req.method!=='GET'&&!equal(req.headers['x-csrf-token'],hmac('owner:'+c.nuOwner107)))throw new Problem(403,'연결을 다시 열어 주세요.');
  if(u.pathname==='/api/visits'&&req.method==='POST'){if(!valid(c.nuVisitor107))throw new Problem(401,'방문 연결을 다시 열어 주세요.');const b=await body(req);store.rate(o,'heartbeat',20,60000);const excluded=equal(c.nuExclude107,hmac('exclude'))||/HeadlessChrome|Playwright|puppeteer|\bbot\b|crawler/i.test(req.headers['user-agent']||'');const visitor=hash(c.nuVisitor107),result=store.track(visitor,b,excluded);visitLog.remember(visitor,b);return json(res,200,result)}
  if(u.pathname==='/api/feedback'&&req.method==='POST')return json(res,201,store.bulletin.submitFeedback(o,await body(req),network));
  if(u.pathname==='/api/posts'&&req.method==='GET')return json(res,200,store.list(o,{mine:u.searchParams.get('mine')==='1',before:before(u)}));
  if(u.pathname==='/api/posts'&&req.method==='POST'){const b=await body(req);return json(res,201,store.post(o,b.key,b,network))}
  const m=u.pathname.match(/^\/api\/posts\/(\d+)(\/report)?$/);if(m){const id=Number(m[1]);if(m[2]&&req.method==='POST'){const b=await body(req);return json(res,200,store.report(id,o,b.reason))}if(!m[2]&&req.method==='PUT'){const b=await body(req);return json(res,200,store.edit(id,o,b.body,b.key))}if(!m[2]&&req.method==='DELETE')return json(res,200,store.remove(id,o))}
  throw new Problem(404,'경로를 찾을 수 없습니다.');
 }catch(e){let status=e.status||500,retry=e.retry||0;try{store.rate(network,'failures',100,60000)}catch(limit){status=429;retry=limit.retry}if(retry)res.setHeader('Retry-After',retry);if(!res.headersSent)json(res,status,{error:status===500?'저장하지 못했어요. 내용을 유지한 채 다시 시도해 주세요.':e.message,retryAfter:retry,retryAt:retry?now()+retry*1000:null});else res.end();}
 }
 function before(u){const value=u.searchParams.get('before');if(value===null)return Number.MAX_SAFE_INTEGER;const n=Number(value);if(!Number.isSafeInteger(n)||n<1)throw new Problem(400,'잘못된 페이지');return n}
 return{handle:(req,res)=>{if(!req.url.startsWith('/api/'))return false;handle(req,res).catch(()=>{if(!res.headersSent)json(res,500,{error:'요청을 처리하지 못했어요.'});else res.end()});return true},store,close:()=>{admins.clear();store.close()}};
}
module.exports={createCommunityHTTP,defaultDirectory};
