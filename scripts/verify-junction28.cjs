const fs=require('fs');global.Library17=require('../dist/library17');const D=require('../dist/data/campus.json'),N=require('../dist/data/walk.json');const S=Library17.prepare(D,N);require('../dist/student22').prepare(D,N);const W=require('../dist/walk-core').create(D,N);const routes=require('../dist/data/qa28-routes.json');
const local=(x,z)=>[(x-S.origin[0])*S.u[0]+(z-S.origin[1])*S.u[1],(x-S.origin[0])*S.v[0]+(z-S.origin[1])*S.v[1]];
const results=[];
for(const r of routes)for(const reverse of [false,true]){const ps=reverse?r.coords.slice().reverse():r.coords;let state={x:ps[0][0],z:ps[0][1],y:(reverse?r.endFeet:r.startFeet)+.95},fail=null,maxDelta=0;
 for(let i=1;i<ps.length;i++){const end=ps[i];let guard=0;while(Math.hypot(end[0]-state.x,end[1]-state.z)>.035&&guard++<5000){let dx=end[0]-state.x,dz=end[1]-state.z,len=Math.hypot(dx,dz),step=Math.min(.06,len);const next=W.move(state,dx/len*step,dz/len*step);maxDelta=Math.max(maxDelta,Math.abs(next.y-state.y));if(next.distance<step*.1){fail={segment:i,local:local(state.x,state.z),feet:state.y-.95-S.base,nextFloor:W.floorAt(state.x+dx/len*step,state.z+dz/len*step,state.y-.95)-S.base,blocked:W.blocked(state.x+dx/len*step,state.z+dz/len*step,.42,state.y-.95)};break;}state=next;}if(fail)break;}
 results.push({route:r.road,reverse,passed:!fail,fail,maxDelta,finalHeight:state.y-.95-S.base});
}
fs.writeFileSync('BUILD28-WALKS.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
fs.writeFileSync('BUILD28-AFTER-SPEC.json',JSON.stringify(S,null,2));if(results.some(q=>!q.passed))process.exitCode=1;
