const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||path.resolve(__dirname,'../dist');
const D=JSON.parse(fs.readFileSync(ROOT+'/data/campus.json')),N=JSON.parse(fs.readFileSync(ROOT+'/data/walk.json'));
global.Library17=require(ROOT+'/library17.js');Library17.prepare(D,N);if(fs.existsSync(ROOT+'/library37.js'))require(ROOT+'/library37.js').prepare(D,N);require(ROOT+'/library38.js').prepare(D,N);require(ROOT+'/acro39.js').prepare(D,N);
require(ROOT+'/student22.js').prepare(D,N);require(ROOT+'/engineering35.js').prepare(D,N);require(ROOT+'/engineering36.js').prepare(D,N);require(ROOT+'/landmarks30.js').prepare(D,N);
const W=require(ROOT+'/walk-core.js').create(D,N),S=N.library17;

if(S.revision37){const L=require(ROOT+'/library37.js'),m=JSON.parse(fs.readFileSync(ROOT+'/data/ground.json')),r=fs.readFileSync(ROOT+'/data/ground.bin'),ii=fs.readFileSync(ROOT+'/data/ground-indices.bin'),pp=new Float32Array(r.buffer,r.byteOffset,r.length/4),ix=new Uint32Array(ii.buffer,ii.byteOffset,ii.length/4);for(const c of m.chunks)L.reshapeGround(S,pp.slice(c.offset,c.offset+c.count*3),ix.slice(c.indexOffset,c.indexOffset+c.indexCount));}
const p=(a,d)=>[S.origin[0]+S.u[0]*a+S.v[0]*d,S.origin[1]+S.u[1]*a+S.v[1]*d];
const routes=[];function add(name,nodes){routes.push({zone:'관정관 BUILD38',road:name,coords:nodes.map(q=>p(...q)),startFeet:S.base+nodes[0][2],endFeet:S.base+nodes.at(-1)[2]});}
for(const k of ['main-front-49','main-front-82','right-approach','right-third']){const nodes=JSON.parse(JSON.stringify(S.routes[k]));const a=nodes[0],b=nodes[1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);nodes.unshift([a[0]-(b[0]-a[0])*.6/l,a[1]-(b[1]-a[1])*.6/l,a[2]]);add(k,nodes);}
add('cross-court main to SC',[[65,80,2.2],[40,80,2.575],[29,75,3.4],[22,70,4.45],[7,70,4.45],[7,64,4.45]]);
add('main side court',[[7,55,4.45],[20,55,4.45],[23,56,4.45],[29.5,66,3.25],[29.5,73,3.325],[34,75,2.65],[40,80,2.575]]);
add('main front door',[[49,80,2.2],[65,80,2.2],[65,70,2.2]]);
add('lower court admin approach',[[6,120,0],[65,125,0],[65,136,0]]);
add('G lower passage',[[-12,-24.5,0],[1,-24.5,0],[3,-20,0],[20,-20,0],[58,-20,0],[118,-20,0],[140,-20,0]]);
add('B3 bridge',[[58,-10,7],[58,-44,7]]);
add('R5 garden',[[99,22,22],[83,22,22],[60,22,22],[55,15,22],[37.5,12,22],[37.5,0,22]]);
add('SC lower door',[[7,70,4.45],[-4,66,4.45],[-4,30,4.45],[0,25,4.45],[0,15,4.45]]);
const result=[];
for(const r of routes)for(const reverse of [false,true]){
 const coords=reverse?r.coords.slice().reverse():r.coords;let state={x:coords[0][0],z:coords[0][1],y:(reverse?r.endFeet:r.startFeet)+.95},failure=null,maxStep=0,minHeadroom=Infinity,count=0;
 for(let i=1;i<coords.length&&!failure;i++){
  for(let guard=0;Math.hypot(state.x-coords[i][0],state.z-coords[i][1])>.035;guard++){
   const dx=coords[i][0]-state.x,dz=coords[i][1]-state.z,l=Math.hypot(dx,dz),amount=Math.min(.065,l),next=W.move(state,dx/l*amount,dz/l*amount),feet=state.y-.95;count++;
   maxStep=Math.max(maxStep,Math.abs(next.y-state.y));minHeadroom=Math.min(minHeadroom,W.ceilingAt(next.x,next.z,next.y-.95)-(next.y-.95));
   if(next.distance<amount*.1||guard>15000){const x=state.x+dx/l*amount,z=state.z+dz/l*amount;failure={segment:i,at:[state.x,feet,state.z],nextFloor:W.floorAt(x,z,feet),terrain:W.terrain(x,z),blocked:W.blocked(x,z,.42,feet),solids:[...S.volumes,...S.groundSolids].filter(q=>Library17.blocked({...S,volumes:[q],groundSolids:[],surfaces:[]},x,z,.42,feet)).map(q=>q.id)};break;}state=next;
  }
 }
 const endError=Math.abs(state.y-.95-(reverse?r.startFeet:r.endFeet));result.push({name:r.road,reverse,passed:!failure&&endError<.12&&minHeadroom>=1.79,maxStep,minHeadroom,endError,count,failure});
}
const out={revision:S.revision39,routes,results:result,passed:result.every(q=>q.passed),summary:{passed:result.filter(q=>q.passed).length,total:result.length},audit:S.audit37,finishAudit:S.audit38};
fs.writeFileSync(path.resolve(__dirname,'../reports/build39/movement.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({summary:out.summary,failures:result.filter(q=>!q.passed)},null,2));
