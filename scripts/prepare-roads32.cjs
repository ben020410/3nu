/* Reconcile legacy OSM navigation with the already-rendered architectural routes.
   No changes to library/deck geometry, building location, or collision tolerances. */
const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..');
const N=JSON.parse(fs.readFileSync(R+'/reports/build32/source-data/walk.json')),D=JSON.parse(fs.readFileSync(R+'/reports/build32/source-data/campus.json'));
const original=structuredClone(N);global.Library17=require(R+'/dist/library17.js');const runtime=structuredClone(N);Library17.prepare(D,runtime);require(R+'/dist/student22.js').prepare(D,runtime);require(R+'/dist/landmarks30.js').prepare(D,runtime);const W=require(R+'/dist/walk-core.js').create(D,runtime);
const fixes=JSON.parse(fs.readFileSync(R+'/reports/build32/route-patches.json')).changed,Q=JSON.parse(fs.readFileSync(R+'/dist/data/qa28-routes.json'));
const byName=n=>Q.find(q=>q.road.includes(n));console.log(Q.map(q=>q.road));
const graded=new Set(['167982833','167984621','455468341']);
const manual={
'37929026':{q:'right-third',kind:'steps'},
'167597860':{q:'pharmacy-near23',kind:'steps',reverse:true},
'847953678':{q:'right-approach',kind:'steps'},
};
let changes=[],moved=new Map();
for(const r of N.roads){let patch=fixes.find(p=>p.id===r.id&&JSON.stringify(p.before)===JSON.stringify(r.p));if(graded.has(r.id))patch=null;
 if(manual[r.id]){const spec=manual[r.id],q=byName(spec.q);if(!q)throw Error(spec.q);patch={after:spec.reverse?q.coords.slice().reverse():q.coords,startFeet:spec.reverse?q.endFeet:q.startFeet,endFeet:spec.reverse?q.startFeet:q.endFeet};}
 if(!patch)continue;const before=structuredClone(r.p);r.p=patch.after;r.startFeet=patch.startFeet;r.endFeet=patch.endFeet;
 if(r.kind==='steps'&&!manual[r.id]){r.kind='footway';r.category='path';r.width=3.2;}
 for(const e of [0,-1]){const a=before.at(e),b=r.p.at(e);if(Math.hypot(a[0]-b[0],a[1]-b[1])>.001)moved.set(JSON.stringify(a),b);}
 changes.push({id:r.id,before,after:r.p,kind:r.kind,reason:manual[r.id]?'Rebind to existing architectural stair/landing, preserve separate levels':'Local clearance around existing new building; no moved buildings'});
}
// The old short stair junctions now join the foot of the authored right-hand stair.
let rjoin=N.roads.find(r=>r.id==='847953677');if(rjoin){let before=rjoin.p;const a=byName('right-approach').coords.at(-1),b=byName('right-third').coords[0];rjoin.p=[a,b];rjoin.startFeet=rjoin.endFeet=byName('right-approach').endFeet;changes.push({id:rjoin.id,before,after:rjoin.p,kind:'pedestrian',reason:'Level forecourt joins the two distinct existing stair runs'});moved.set(JSON.stringify(before[0]),a);moved.set(JSON.stringify(before.at(-1)),b);}
// Resolve shared endpoints once. Do not move building geometry or teleport a floor.
for(const r of N.roads){r.p=r.p.map(p=>moved.get(JSON.stringify(p))||p);}
// Two baseline paths were inside the student front stairs: use the clear lower forecourt.
const second=JSON.parse(fs.readFileSync(R+'/reports/build32/secondary-patches.json'));
for(const patch of second.changed){const r=N.roads.find(r=>r.id===patch.id);if(!r)throw Error(patch.id);const before=structuredClone(r.p);r.p=patch.after;r.startFeet=patch.startFeet;r.endFeet=patch.endFeet;changes.push({id:r.id,before,after:r.p,kind:r.kind,reason:'Clear ground route at authored stair edge; keep stairs and upper floors separate'});}
for(const r of N.roads)r.p=r.p.map(p=>second.moved[p.join(',')]||p);
// Actual sub-metre break at the main-gate approach, not a new arbitrary route.
const gap=N.roads.find(r=>r.id==='605434647-outside');if(gap){const before=structuredClone(gap.p);gap.p[0]=[-371.400143,924.555196];changes.push({id:gap.id,before,after:gap.p,kind:gap.kind,reason:'0.473 m endpoint gap at existing gate junction'});}
// Ground road grades replace the local first-match discontinuity inside a corridor.
// Outside the corridor shoulders all BUILD31 height constraints remain intact.
N.roadGrades32=[];
for(const r of N.roads.filter(r=>graded.has(r.id))){let points=[],cum=[0];for(let i=1;i<r.p.length;i++)cum.push(cum.at(-1)+Math.hypot(r.p[i][0]-r.p[i-1][0],r.p[i][1]-r.p[i-1][1]));const len=cum.at(-1),count=Math.ceil(len/1.5);for(let j=0;j<=count;j++){const d=len*j/count;let i=1;while(cum[i]<d&&i<r.p.length-1)i++;const t=(d-cum[i-1])/(cum[i]-cum[i-1]||1),a=r.p[i-1],b=r.p[i],x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;points.push([x,z,W.terrain(x,z)]);}
 const raw=points.map(p=>p[2]),radius=Math.min(10,Math.ceil(count/3));let sm=raw.map((v,i)=>{let sum=0,w=0;for(let j=Math.max(0,i-radius);j<=Math.min(count,i+radius);j++){const k=Math.exp(-(((j-i)/Math.max(1,radius*.5))**2));sum+=raw[j]*k;w+=k;}return sum/w;});const e0=raw[0]-sm[0],e1=raw.at(-1)-sm.at(-1);for(let j=0;j<=count;j++){const t=j/count;sm[j]+=e0*(1-t)+e1*t;}
 points.forEach((p,i)=>p[2]=sm[i]);N.roadGrades32.push({id:r.id,profile:points,halfWidth:r.width/2+1.5,shoulder:8,reason:'Smooth existing hard height-patch boundary across the road and shoulder; estimated grade'});
}
// Proven former branch junctions, checked for actual walking clearance. The
// short links restore old topology after moving an obstructed route locally.
const junctionFile=R+'/reports/build32/junction-attachments.json';
if(fs.existsSync(junctionFile))for(const q of JSON.parse(fs.readFileSync(junctionFile)).attachments){
 if(q.distance<=.02)continue;
 N.roads.push({id:`junction32-${q.node}-${q.ownerIndex}`,kind:'footway',category:'path',width:3.2,p:[q.from,q.to],startFeet:q.startFeet,endFeet:q.endFeet,source:'BUILD31 junction '+q.node,ownerRoad:q.owner,topologyRepair32:true});
}
fs.writeFileSync(R+'/reports/build32/route-actions.json',JSON.stringify(changes,null,2));fs.writeFileSync(R+'/reports/build32/prepared-walk.json',JSON.stringify(N));
console.log('actions',changes.length,'grades',N.roadGrades32.length);
