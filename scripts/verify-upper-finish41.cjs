const fs=require('fs'),R=require('path').resolve(__dirname,'../dist');
const D=JSON.parse(fs.readFileSync(R+'/data/campus.json')),N=JSON.parse(fs.readFileSync(R+'/data/walk.json')),spec=JSON.parse(fs.readFileSync(R+'/data/engineering40.json'));
global.Library17=require(R+'/library17.js');Library17.prepare(D,N);for(const n of ['library37','library38','acro39','student22','engineering35','engineering36','landmarks30'])require(R+'/'+n+'.js').prepare(D,N);require(R+'/engineering40.js').prepare(D,N,spec);
const W=require(R+'/walk-core.js').create(D,N),out=[];
for(const r of JSON.parse(fs.readFileSync(R+'/data/qa41-routes.json')))for(const reverse of [false,true]){const ps=reverse?r.coords.slice().reverse():r.coords;let state={x:ps[0][0],z:ps[0][1],y:(reverse?r.endFeet:r.startFeet)+.95},failure=null,maxStep=0;
 for(let i=1;i<ps.length&&!failure;i++)for(let k=0;Math.hypot(state.x-ps[i][0],state.z-ps[i][1])>.035;k++){
 const dx=ps[i][0]-state.x,dz=ps[i][1]-state.z,len=Math.hypot(dx,dz),amount=Math.min(.065,len),next=W.move(state,dx/len*amount,dz/len*amount);maxStep=Math.max(maxStep,Math.abs(next.y-state.y));
 if(next.distance<amount*.1||k>5000){const x=state.x+dx/len*amount,z=state.z+dz/len*amount;failure={segment:i,at:state,floor:W.floorAt(x,z,state.y-.95),blocked:W.blocked(x,z,.42,state.y-.95),solids:spec.models.flatMap(m=>m.volumes).filter(v=>Library17.blocked({base:0,volumes:[v],surfaces:[]},x,z,.42,state.y-.95)).map(q=>q.id)};break;}state=next;}
 const error=Math.abs(state.y-.95-(reverse?r.startFeet:r.endFeet));out.push({route:r.road,reverse,passed:!failure&&error<.12,maxStep,error,failure});}
fs.writeFileSync(R+'/../reports/build41/movement.json',JSON.stringify({results:out,passed:out.every(q=>q.passed)},null,2));console.log(JSON.stringify(out,null,2));
