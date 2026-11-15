/* Geometry and actual walking controller checks are independent of screenshots. */
const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..'),O=R+'/reports/build33';
const read=p=>JSON.parse(fs.readFileSync(p));const N=read(R+'/dist/data/walk.json'),D=read(R+'/dist/data/campus.json'),B=read(O+'/source-data/walk.json');
global.Library17=require(R+'/dist/library17');Library17.prepare(D,N);require(R+'/dist/student22').prepare(D,N);require(R+'/dist/landmarks30').prepare(D,N);
const W=require(R+'/dist/walk-core').create(D,N),RR=require(R+'/dist/ring-road33'),A=RR.alignment(N.ring33.route,true);
const widths=N.roads.filter(r=>r.ring33).map(r=>({id:r.id,width:r.width,profile:r.widthProfile32}));
const otherWidths=N.roads.filter(r=>!r.ring33&&r.width!==B.roads.find(b=>b.id===r.id)?.width);
const tests=[];
function walk(name,points,reverse=false,startFeet){const ps=reverse?points.slice().reverse():points;let s={x:ps[0][0],z:ps[0][1],y:(startFeet??W.terrain(...ps[0]))+.95},distance=0,maxStep=0,fail=null;
 for(let i=1;i<ps.length&&!fail;i++){let n=0;while(Math.hypot(ps[i][0]-s.x,ps[i][1]-s.z)>.02&&n++<5000){const dx=ps[i][0]-s.x,dz=ps[i][1]-s.z,len=Math.hypot(dx,dz),step=Math.min(.12,len),q=W.move(s,step*dx/len,step*dz/len);if(q.distance<step*.1){fail={segment:i,at:[s.x,s.y-.95,s.z],next:ps[i],reason:'blocked'};break;}maxStep=Math.max(maxStep,Math.abs(q.y-s.y));distance+=q.distance;s=q;}
 if(n>=5000)fail={segment:i,reason:'timeout'};}
 const result={name,reverse,distance,maxStep,end:[s.x,s.y-.95,s.z],passed:!fail,fail};tests.push(result);console.log(name,reverse,result.passed,distance.toFixed(1),fail||'');return result;
}
for(const offset of [0,-4.95,-1.65,1.65,4.95]){const points=[];for(let i=0;i<=Math.ceil(A.length/2);i++){const p=A.at(i*A.length/Math.ceil(A.length/2),offset);points.push([p.x,p.z]);}for(const rev of[false,true])walk('ring '+offset,points,rev);}
for(const rev of[false,true])walk('gate approach',N.ring33.approach.concat(N.ring33.route.slice(1,80)),rev);
// Reattached branches: approach from 8m outside the edge, then turn onto ring.
for(const a of N.ring33.attachments){const r=N.roads.find(r=>r.id===a.road),i=r.p.findIndex(p=>Math.hypot(p[0]-a.after[0],p[1]-a.after[1])<.01);if(i<0)continue;for(const next of[r.p[i-1],r.p[i+1]]){if(!next)continue;const d=Math.hypot(next[0]-a.after[0],next[1]-a.after[1]),len=Math.min(d,15),p=[a.after[0]+(next[0]-a.after[0])*len/d,a.after[1]+(next[1]-a.after[1])*len/d];for(const rev of[false,true])walk('branch '+a.road,[p,a.after],rev);}}
let minRadius=Infinity,maxSlope=0;
for(let s=0;s<A.length;s+=.5){const p=A.at(s),a=A.at(s-.5),b=A.at(s+.5),angle=Math.acos(Math.max(-1,Math.min(1,a.tx*b.tx+a.tz*b.tz)));minRadius=Math.min(minRadius,1/(angle||1e-10));maxSlope=Math.max(maxSlope,Math.abs(W.terrain(b.x,b.z)-W.terrain(a.x,a.z))/Math.hypot(b.x-a.x,b.z-a.z));}
const out={widths,unintendedBranchWidthChanges:otherWidths.length,laneWidths:[.9,3.3,3.3,3.3,3.3,.9],minCenterRadius:minRadius,maxGrade:maxSlope,tests,passed:!otherWidths.length&&widths.length===21&&widths.every(w=>w.width===15&&w.profile.every(p=>p[1]===15))&&tests.every(t=>t.passed)};
fs.writeFileSync(O+'/movement.json',JSON.stringify(out,null,2));console.log(JSON.stringify({passed:out.passed,tests:tests.length,failed:tests.filter(t=>!t.passed),minRadius,maxSlope}));if(!out.passed)process.exitCode=1;
