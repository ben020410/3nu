/* Reattach only junctions proven by the BUILD31 graph; never nearest unrelated roads. */
const fs=require('fs');global.Library17=require('../dist/library17');const B=require('../reports/build32/source-data/walk.json'),D=require('../dist/data/campus.json'),N=JSON.parse(fs.readFileSync('reports/build32/prepared-walk.json'));const runtime=structuredClone(N);Library17.prepare(D,runtime);require('../dist/student22').prepare(D,runtime);require('../dist/landmarks30').prepare(D,runtime);const C=require('../dist/walk-core'),W=C.create(D,runtime),adj=B.points.map(()=>[]),adjNew=N.points.map(()=>[]);
for(const[a,b]of B.edges){adj[a].push(b);adj[b].push(a)}for(const[a,b]of N.edges){adjNew[a].push(b);adjNew[b].push(a)}
const changes=B.roads.map((a,i)=>({a,b:N.roads[i],i})).filter(({a,b})=>JSON.stringify(a.p)!==JSON.stringify(b.p));
function project(p,r){let best=null;for(let j=1;j<r.p.length;j++){let s=C.segment(...p,r.p[j-1],r.p[j]);if(!best||s.d<best.d)best={...s,segment:j,p:[s.x,s.z]}}return best;}
function floor(p){return W.floorAt(...p,W.terrain(...p))}
function clear(a,b,feet=floor(a)){let y=feet,n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.12);for(let i=0;i<=n;i++){const t=n?i/n:0,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,h=W.floorAt(x,z,y);if(W.blocked(x,z,.48,y)||Math.abs(h-y)>.25)return null;y=h;}return y;}
let attachments=[],unresolved=[];
for(let id=0;id<B.points.length;id++){
 if(adj[id].length<3||adjNew[id]?.length>=adj[id].length)continue;
 const original=B.points[id].slice(0,2),current=N.points[id].slice(0,2),owners=changes.filter(({a})=>project(original,a).d<.035);if(!owners.length)continue;
 const projections=owners.map(o=>({...o,q:project(current,o.b)}));
 // Keep the former branch vertex if it still owns untouched edges. Otherwise
 // meet at the first revised corridor, so no obsolete junction is resurrected.
 const anchor=adjNew[id]?.length?current:projections[0].q.p;
 for(const o of projections){const p=o.q.p,d=Math.hypot(p[0]-anchor[0],p[1]-anchor[1]);
 const h=clear(anchor,p),ok=h!==null&&Math.abs(h-floor(p))<.26;
 const row={node:id,ownerIndex:o.i,owner:o.a.id,from:anchor,to:p,distance:d,original,existingBranches:adjNew[id]?.length||0,passed:ok,startFeet:floor(anchor),endFeet:h};
 if(!ok){unresolved.push(row);continue;}attachments.push(row);
 }
}
fs.writeFileSync('reports/build32/junction-attachments.json',JSON.stringify({attachments,unresolved},null,2));console.log(JSON.stringify({attachments,unresolved},null,2));
