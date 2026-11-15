// Exercise the usable width, turns, guards, jumps and vertical separation independently.
const fs=require('fs'),assert=require('assert');
global.Library17=require('../dist/library17');
const D=require('../dist/data/campus.json'),N=require('../dist/data/walk.json');
const S=Library17.prepare(D,N);require('../dist/student22').prepare(D,N);
const W=require('../dist/walk-core').create(D,N),J=require('../dist/jump-core');
const point=(a,d)=>[S.origin[0]+S.u[0]*a+S.v[0]*d,S.origin[1]+S.u[1]*a+S.v[1]*d];
const results=[];
function walk(id,nodes){for(const reverse of [false,true]){
 const ns=reverse?nodes.slice().reverse():nodes;let p={x:point(...ns[0])[0],z:point(...ns[0])[1],y:S.base+ns[0][2]+.95};let passed=true;
 for(const node of ns.slice(1)){const end=point(...node);let count=0;
  while(Math.hypot(p.x-end[0],p.z-end[1])>.025&&count++<6000){const dx=end[0]-p.x,dz=end[1]-p.z,len=Math.hypot(dx,dz),step=Math.min(.045,len),q=W.move(p,dx/len*step,dz/len*step);if(q.distance<step*.1){passed=false;break;}p=q;}if(!passed||count>=6000){passed=false;break;}
 }
 results.push({id,reverse,passed,feet:p.y-.95-S.base,position:[(p.x-S.origin[0])*S.u[0]+(p.z-S.origin[1])*S.u[1],(p.x-S.origin[0])*S.v[0]+(p.z-S.origin[1])*S.v[1]]});
}}
for(const [id,offset]of [['right-approach',6],['right-third',3],['left-roof',3],['pharmacy-near23',2.5],['far-stair25',1.8]])for(const side of [-1,1]){
 const nodes=N.junction28.routes[id].slice(0,4).map(n=>[n[0]+offset*side,n[1],n[2]]);walk(id+'-edge-'+side,nodes);
}
walk('third-turn-inner',[[7,29,12.46],[7,24.5,13],[15,24.5,13],[15,15,13],[18,10,13]]);
walk('third-turn-outer',[[9,29,12.46],[9,23,13],[17.5,23,13],[17.5,18,13],[21,18,13],[21,10,13]]);
walk('left-landing-crossing',[[120.5,45,9.9],[126,45,9.9]]);
for(const [id,a,d,y]of [['lower-passage',58,-20,0],['upper-bridge',58,-20,7],['roof-garden',60,14,22],['left-landing',123.5,45,9.9],['rear-landing',12.6,-34,3.4]])for(const fps of [30,60,120]){
 const [x,z]=point(a,d),s=J.create();let yy=S.base+y+.95;J.start(s);
 for(let i=0;i<fps*2;i++)yy=J.tick(s,yy,1/fps,W.floorAt(x,z,yy-.95),W.ceilingAt(x,z,yy-.95));
 results.push({id:'jump-'+id,fps,passed:!s.airborne&&Math.abs(yy-.95-S.base-y)<.02,landingErrorM:yy-.95-S.base-y});
}
// The rails stop lateral motion on elevated landings without bounding-box blocking a turn.
for(const [id,a,d,y,da,dd]of [['left-side',127.8,45,9.9,2,0],['third-side',16.5,26.3,13,0,2]]){
 const [x,z]=point(a,d),v=point(a+da,d+dd),p=W.move({x,z,y:S.base+y+.95},v[0]-x,v[1]-z);
 results.push({id:'guard-'+id,passed:p.distance<.5,distance:p.distance});
}
fs.writeFileSync('BUILD28-EDGES-JUMP.json',JSON.stringify(results,null,2));
console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,failures:results.filter(r=>!r.passed)},null,2));
assert(results.every(r=>r.passed));
