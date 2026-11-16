"use strict";
const {isIP}=require('node:net');
// This file runs only on Vercel. The shared key must never enter dist/ or the browser.
function createGateway({publicOrigin,upstreamOrigin,secret,fetchImpl=fetch}={}){
 const publicURL=new URL(publicOrigin),upstream=new URL(upstreamOrigin);
 if(publicURL.protocol!=='https:'||publicURL.origin!==publicOrigin||upstream.protocol!=='https:'||upstream.origin!==upstreamOrigin||publicURL.username||upstream.username||publicOrigin===upstreamOrigin||!/^[a-f0-9]{64}$/.test(secret||''))throw Error('Invalid gateway configuration');
 const routes=/^\/api\/(?:session|visits|notices|feedback|posts(?:\/\d+(?:\/report)?)?|admin\/(?:login|logout|session|exclusion|stats|export|posts(?:\/\d+)?|feedback(?:\/\d+)?|notices(?:\/\d+)?))$/;
 return async function gateway(req,res){
  const fail=(code,message)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({error:message}))};
  try{
   if(req.headers.host!==publicURL.host||req.headers.origin&&req.headers.origin!==publicOrigin||req.headers['sec-fetch-site']==='cross-site')return fail(403,'허용된 사이트에서 다시 시도해 주세요.');
   const method=req.method;if(!['GET','POST','PUT','DELETE'].includes(method))return fail(405,'지원하지 않는 요청입니다.');
   if(method!=='GET'&&(req.headers.origin!==publicOrigin||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')))return fail(403,'같은 사이트에서 다시 시도해 주세요.');
   const u=new URL(req.url,publicOrigin);
   // Vercel's rewrite may expose the original URL or the destination URL.
   // Accept the reserved routing field only once, and still apply the strict API allowlist.
   const values=u.searchParams.getAll('__3nu_path');if(values.length>1)return fail(400,'잘못된 경로입니다.');
   let route=req.query?.__3nu_path??values[0];
   if(route!==undefined){if(typeof route!=='string'||!route||/[\\%?#]|(?:^|\/)\.{1,2}(?:\/|$)/.test(route))return fail(400,'잘못된 경로입니다.');u.pathname='/api/'+route}
   u.searchParams.delete('__3nu_path');if(!routes.test(u.pathname))return fail(404,'경로를 찾을 수 없습니다.');
   // Vercel overwrites this platform header; never accept a client-supplied custom IP header.
   const ip=req.headers['x-vercel-forwarded-for'];if(typeof ip!=='string'||!isIP(ip))return fail(503,'연결 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
   const headers={'Origin':publicOrigin,'X-3NU-Edge-Key':secret,'X-3NU-Client-IP':ip};
   for(const name of ['cookie','content-type','x-csrf-token','user-agent','sec-fetch-site'])if(typeof req.headers[name]==='string')headers[name]=req.headers[name];
   let body;
   if(method!=='GET'){
    if(req.body!==undefined)body=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));
    else{const chunks=[];let length=0;for await(const chunk of req){length+=Buffer.byteLength(chunk);if(length>16384)return fail(413,'요청이 너무 커요.');chunks.push(Buffer.from(chunk))}body=Buffer.concat(chunks)}
    if(body.length>16384)return fail(413,'요청이 너무 커요.');
   }
   const response=await fetchImpl(upstream.origin+u.pathname+u.search,{method,headers,body,redirect:'manual',signal:AbortSignal.timeout(8000)});
   // Never retry writes automatically and never follow a redirect carrying credentials.
   if(response.status>=300&&response.status<400)return fail(502,'서버 연결을 확인하지 못했어요.');
   const parts=[];let length=0;for await(const chunk of response.body||[]){length+=chunk.length;if(length>4*1024*1024)return fail(502,'응답이 너무 커요.');parts.push(Buffer.from(chunk))}
   const out={'Cache-Control':'no-store','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
   for(const name of ['content-type','retry-after','content-disposition'])if(response.headers.has(name))out[name]=response.headers.get(name);
   const cookies=response.headers.getSetCookie();if(cookies.length)out['Set-Cookie']=cookies;
   res.writeHead(response.status,out);res.end(Buffer.concat(parts));
  }catch{return fail(503,'서버에 연결하지 못했어요. 작성 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.')}
 };
}
let instance;
module.exports=async(req,res)=>{
 try{instance??=createGateway({publicOrigin:process.env.CAMPUS_BROWSER_ORIGIN,upstreamOrigin:process.env.CAMPUS_UPSTREAM_ORIGIN,secret:process.env.CAMPUS_EDGE_PROXY_SECRET})}
 catch{res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'서버 연결 준비 중입니다.'}))}
 return instance(req,res);
};
module.exports.createGateway=createGateway;
