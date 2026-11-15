const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..'),O=R+'/reports/build33';
const N=JSON.parse(fs.readFileSync(R+'/dist/data/walk.json')),D=JSON.parse(fs.readFileSync(R+'/dist/data/campus.json'));
global.Library17=require(R+'/dist/library17');const runtime=structuredClone(N);Library17.prepare(D,runtime);require(R+'/dist/student22').prepare(D,runtime);require(R+'/dist/landmarks30').prepare(D,runtime);
const W=require(R+'/dist/walk-core').create(D,runtime),RR=require(R+'/dist/ring-road33'),ring=RR.alignment(N.ring33.route,true),entry=RR.alignment(N.ring33.approach);
for(const p of N.points)p[2]=W.terrain(p[0],p[1]);
const lanes=[];
for(const direction of[1,-1])for(const [lane,offset]of [[1,-direction*1.65],[2,-direction*4.95]]){
 const count=Math.ceil(ring.length/2),points=[];
 for(let i=0;i<=count;i++){const s=direction===1?i*ring.length/count:(count-i)*ring.length/count,p=ring.at(s,offset);points.push([p.x,W.terrain(p.x,p.z),p.z]);}
 lanes.push({id:`ring-${direction===1?'forward':'reverse'}-${lane}`,direction,side:'right-hand traffic',lane,offsetMetres:offset,width:3.3,closed:true,points});
}
const bus={version:1,units:'metres',axes:{x:'east',y:'up',z:'north'},adaptation:'15m / 4 lanes requested by user, not surveyed',roadWidth:15,laneWidth:3.3,edgeMargin:.9,routeOrder:N.ring33.orderedIds,route:N.ring33.profile.map(p=>[p[0],p[2],p[1]]),length:ring.length,lanes,junctions:N.ring33.junctions,approach:N.ring33.approachProfile.map(p=>[p[0],p[2],p[1]]),sourceMapping:JSON.parse(fs.readFileSync(O+'/alignment.json')).mapping};
fs.writeFileSync(R+'/dist/data/ring-lanes33.json',JSON.stringify(bus));
// Whole-loop tests use actual movement controller, no teleport except test start.
const routes=[{zone:'순환 전체 · 바깥 차로',road:'21구간',coords:lanes.find(l=>l.direction===1&&l.lane===2).points.map(p=>[p[0],p[2]])},{zone:'정문 진입 연결',road:'468202819',coords:N.ring33.approach.concat(N.ring33.route.slice(1,80))}];
for(const r of routes){r.startFeet=W.terrain(...r.coords[0]);r.endFeet=W.terrain(...r.coords.at(-1));}
fs.writeFileSync(R+'/dist/data/qa33-routes.json',JSON.stringify(routes));
fs.writeFileSync(R+'/dist/data/walk.json',JSON.stringify(N));
console.log('Bus lanes',lanes.length,'route length',ring.length,'QA routes',routes.length);
