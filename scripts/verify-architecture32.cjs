/* Compare floor semantics and exercise the real controller in both directions.
 * QA paths are separate from public road data. Geometry checks run separately. */
const fs=require('fs'),assert=require('assert');
global.Library17=require('../dist/library17');
const clone=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function prepare(data,nav){Library17.prepare(data,nav);require('../dist/student22').prepare(data,nav);require('../dist/landmarks30').prepare(data,nav);return require('../dist/walk-core').create(data,nav)}
const D=clone('dist/data/campus.json'),N=clone('dist/data/walk.json'),W=prepare(D,N);
const B=prepare(clone('reports/build32/source-data/campus.json'),clone('reports/build32/source-data/walk.json'));
const routes=[...clone('dist/data/qa31-routes.json'),...clone('dist/data/qa28-routes.json'),...clone('dist/data/qa30-routes.json')];
const results=[];
function intentionalGrade(x,z,feet){
 if(Math.abs(W.floorAt(x,z,feet)-W.terrain(x,z))>.002||Math.abs(B.floorAt(x,z,feet)-B.terrain(x,z))>.002)return false;
 return (N.roadGrades32||[]).some(g=>g.profile.slice(1).some((b,i)=>{
  const a=g.profile[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<g.halfWidth+g.shoulder;
 }));
}
for(const r of routes)for(const reverse of [false,true]){
 const ps=reverse?r.coords.slice().reverse():r.coords;
 const originalFeet=reverse?r.endFeet:r.startFeet,startFeet=W.floorAt(...ps[0],originalFeet);
 let s={x:ps[0][0],z:ps[0][1],y:startFeet+.95},fail=null,maxStep=0,distance=0;
 for(let i=1;i<ps.length;i++){
  const end=ps[i];let guard=0;
  while(Math.hypot(end[0]-s.x,end[1]-s.z)>.025&&guard++<12000){
   const dx=end[0]-s.x,dz=end[1]-s.z,len=Math.hypot(dx,dz),step=Math.min(.10,len),q=W.move(s,dx/len*step,dz/len*step);
   if(q.distance<step*.1){fail={segment:i,position:[s.x,s.y-.95,s.z],reason:'controller blocked'};break}
   maxStep=Math.max(maxStep,Math.abs(q.y-s.y));distance+=q.distance;s=q;
  }
  if(guard>=12000)fail={segment:i,reason:'timeout'};
  if(fail)break;
 }
 const expectedFloor=W.floorAt(s.x,s.z,s.y-.95),baselineFloor=B.floorAt(s.x,s.z,s.y-.95);
 const endError=Math.abs(s.y-.95-expectedFloor),baselineEndError=Math.abs(expectedFloor-baselineFloor);
 // Old QA endpoints on the first tread are one riser above the route's plaza
 // datum. Retain that discrepancy instead of relabelling it as a terrain change.
 const routeDatumDifference=s.y-.95-(reverse?r.startFeet:r.endFeet);
 const approvedGroundGrade=intentionalGrade(s.x,s.z,s.y-.95);
 results.push({zone:r.zone,route:r.road,reverse,passed:!fail&&endError<.002&&(baselineEndError<.002||approvedGroundGrade),maxStep,endError,baselineEndError,approvedGroundGrade,startAdjustment:startFeet-originalFeet,routeDatumDifference,distance,fail});
}
// Compare multiple current floor levels: repainting a roof projection must not
// redirect a person walking under it to the elevated deck.
const heights=[];let maxHeightDifference=0;
for(const a of clone('sources/landuse31.json').areas){
 const xs=a.outer.map(p=>p[0]),zs=a.outer.map(p=>p[1]);
 for(let x=Math.min(...xs);x<=Math.max(...xs);x+=8)for(let z=Math.min(...zs);z<=Math.max(...zs);z+=8){
  const t=B.terrain(x,z);for(const feet of [t,t+4.8,t+15]){
   const delta=Math.abs(W.floorAt(x,z,feet)-B.floorAt(x,z,feet));maxHeightDifference=Math.max(delta,maxHeightDifference);
   if(delta>1e-5)heights.push({id:a.id,x,z,feet,delta,intentionalGrade:intentionalGrade(x,z,feet)});
  }
 }
}
const J=require('../dist/jump-core'),jumps=[];
for(const r of routes.slice(0,9))for(const fps of [30,60,120]){
 const [x,z]=r.coords.at(-1),floor=r.endFeet,s=J.create();let y=floor+.95;J.start(s);
 for(let i=0;i<fps*2;i++)y=J.tick(s,y,1/fps,W.floorAt(x,z,y-.95),W.ceilingAt(x,z,y-.95));
 jumps.push({zone:r.zone,fps,landingError:Math.abs(y-floor-.95),passed:!s.airborne&&Math.abs(y-floor-.95)<.12});
}
const layerProbes=[[0,-967],[-21,-934],[22,-952]].map(p=>{const low=W.floorAt(...p,95.47306874492949),high=W.floorAt(...p,100.27306874492949);return {p,low,high,separate:high-low>4.7}});
const unexpectedHeightChanges=heights.filter(h=>h.delta>.002&&!h.intentionalGrade);
const out={walks:results,heightChanges:heights,unexpectedHeightChanges,maxHeightDifference,jumps,layerProbes,passed:results.every(r=>r.passed)&&!unexpectedHeightChanges.length&&jumps.every(r=>r.passed)&&layerProbes.every(p=>p.separate)};
fs.writeFileSync('reports/build32/architecture-check.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({walks:results.length,walkFailures:results.filter(r=>!r.passed),jumps:jumps.length,jumpFailures:jumps.filter(r=>!r.passed),heightChanges:heights.length,maxHeightDifference,layerProbes,passed:out.passed},null,2));
if(!out.passed)process.exitCode=1;
