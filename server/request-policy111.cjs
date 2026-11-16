'use strict';
const {isIP}=require('node:net');
const {timingSafeEqual}=require('node:crypto');
const normal=address=>String(address||'').replace(/^::ffff:/,'');
function createRequestPolicy({environment='development',publicOrigin,trustProxy=[],browserOrigin,edgeProxySecret}={}){
 const production=environment==='production';let origin;
 if(production){if(!publicOrigin)throw Error('Production requires CAMPUS_PUBLIC_ORIGIN');const u=new URL(publicOrigin);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('Public origin must be an HTTPS origin');origin=u.origin;if(publicOrigin!==origin)throw Error('Use an origin without trailing slash');}
 // Optional split hosting: API requests cross an authenticated server-side gateway.
 // Browser cookies stay first-party on browserOrigin; WebSockets carry no cookies/auth.
 if(browserOrigin||edgeProxySecret){
  if(!production||!browserOrigin||!/^[a-f0-9]{64}$/.test(edgeProxySecret||''))throw Error('Split hosting needs production, browser origin and a 32-byte secret');
  const u=new URL(browserOrigin);if(u.protocol!=='https:'||u.origin!==browserOrigin||u.username||u.password||browserOrigin===origin)throw Error('Invalid browser origin');
 }
 const trusted=new Set(trustProxy.map(normal));for(const ip of trusted)if(!isIP(ip))throw Error('Trusted proxies must be explicit IP addresses');
 function inspect(req,{websocket=false}={}){
  const peer=normal(req.socket.remoteAddress),proxy=trusted.has(peer),host=req.headers.host||'';
  let secure=!!req.socket.encrypted,address=peer;
  // Only an explicitly trusted ingress may provide these single, overwritten headers.
  if(production&&proxy){if(req.headers['x-forwarded-proto']!=='https')throw Error('HTTPS proxy required');const ip=req.headers['x-forwarded-for'];if(typeof ip!=='string'||!isIP(ip))throw Error('Proxy must overwrite X-Forwarded-For with one client IP');secure=true;address=normal(ip)}
  let expected=production?origin:(secure?'https://':'http://')+host;
  if(production){if(!secure||host!==new URL(origin).host)throw Error('Invalid public ingress')}
  else if(!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host))throw Error('Local host required');
  const key=req.headers['x-3nu-edge-key'],client=req.headers['x-3nu-client-ip'];
  let browserSocket=false;
  if(key!==undefined||client!==undefined){
   if(websocket||!production||!browserOrigin||!proxy||typeof key!=='string'||!/^[a-f0-9]{64}$/.test(key)||!timingSafeEqual(Buffer.from(key),Buffer.from(edgeProxySecret))||typeof client!=='string'||!isIP(client)||!req.url?.startsWith('/api/'))throw Error('Invalid API gateway');
   expected=browserOrigin;address=normal(client);
  }else if(production&&websocket&&browserOrigin&&req.headers.origin===browserOrigin){
   expected=browserOrigin;browserSocket=true;
  }
  if(req.headers.origin&&req.headers.origin!==expected||(!browserSocket&&req.headers['sec-fetch-site']==='cross-site')||production&&websocket&&!req.headers.origin)throw Error('Same-origin request required');
  return{origin:expected,secure,address};
 }
 return{inspect,production,origin};
}
module.exports={createRequestPolicy};
