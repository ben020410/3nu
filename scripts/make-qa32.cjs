// One on-screen walking sample in every 400m road zone, plus existing layered
// architectural routes. Full centerlines are checked separately, not conflated.
const fs=require('fs');
global.Library17=require('../dist/library17');
const D=require('../dist/data/campus.json');
const N=JSON.parse(fs.readFileSync('reports/build32/prepared-walk.json'));
Library17.prepare(D,N);require('../dist/student22').prepare(D,N);require('../dist/landmarks30').prepare(D,N);
const W=require('../dist/walk-core').create(D,N),old=require('../reports/build32/source-data/walk.json');
const changed=new Set(N.roads.filter((r,i)=>!old.roads[i]||JSON.stringify(r.p)!==JSON.stringify(old.roads[i].p)).map(r=>r.id));
const len=r=>r.p.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-r.p[i][0],p[1]-r.p[i][1]),0);
const zones={};N.roads.forEach(r=>{const zone=r.p[0].map(v=>Math.floor(v/400)).join(',');(zones[zone]??=[]).push(r)});
const routes=[];
for(const [zone,roads]of Object.entries(zones)){
 const score=r=>(changed.has(r.id)?50:0)+(r.category==='road'?8:0)-(r.kind==='steps'?100:0)-Math.abs(Math.min(len(r),100)-70);
 const r=roads.slice().sort((a,b)=>score(b)-score(a))[0];let coords=[r.p[0]],left=110;
 for(let i=1;i<r.p.length&&left>0;i++){const a=r.p[i-1],b=r.p[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);coords.push(d<=left?b:[a[0]+(b[0]-a[0])*left/d,a[1]+(b[1]-a[1])*left/d]);left-=d;}
 let st={x:coords[0][0],z:coords[0][1],y:(r.startFeet??W.floorAt(...coords[0],W.terrain(...coords[0])))+.95};const startFeet=st.y-.95;
 for(const p of coords.slice(1)){const d=Math.hypot(p[0]-st.x,p[1]-st.z),k=Math.ceil(d/.1),dx=(p[0]-st.x)/k,dz=(p[1]-st.z)/k;for(let j=0;j<k;j++)st=W.move(st,dx,dz)}
 routes.push({zone:'도로 구역 '+zone,road:r.id,coords,startFeet,endFeet:st.y-.95});
}
for(const version of [28,30,31])for(const source of require('../dist/data/qa'+version+'-routes.json')){
 const r=structuredClone(source);
 // Preserve the selected architectural layer; ground-only routes start at
 // the current graded surface rather than an obsolete BUILD31 foot height.
 r.startFeet=W.floorAt(...r.coords[0],r.startFeet);
 r.endFeet=W.floorAt(...r.coords.at(-1),r.endFeet);
 routes.push(r);
}
fs.writeFileSync('dist/data/qa32-routes.json',JSON.stringify(routes,null,2));
fs.writeFileSync('reports/build32/browser-route-plan.json',JSON.stringify({zones:Object.keys(zones),routes:routes.map(r=>({zone:r.zone,road:r.road,length:len({p:r.coords})})),note:`27 spatial representatives plus 28 existing architecture/land-use routes. Full ${N.roads.length} road records tested separately.`},null,2));
console.log('Browser walking routes',routes.length,'directions',routes.length*2);
