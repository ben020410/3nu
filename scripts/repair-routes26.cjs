// Local, collision-aware corrections of existing failed ground approaches.
// No changes to the multi-level central precinct, buildings or slope limits.
const fs=require('fs');global.Library17=require('../dist/library17');const D=require('../dist/data/campus.json'),N=require('../dist/data/walk.json');Library17.prepare(D,N);require('../dist/student22').prepare(D,N);const W=require('../dist/walk-core').create(D,N);
const ids=new Set(['456358908','478555669','777510058','605434647-outside','1529465159-outside']);let report=[];
function clear(a,b){let st={x:a[0],z:a[1],y:W.terrain(...a)+.95},n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.12);for(let i=1;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n,h=W.floorAt(x,z,st.y-.95);if(W.blocked(x,z,.55,st.y-.95)||Math.abs(h-st.y+.95)>.24)return false;st={x,z,y:h+.95};}return true;}
function free(p){return !W.blocked(...p,.65,W.terrain(...p));}
function nearestFree(p){if(free(p))return p;for(let r=.5;r<=8;r+=.5)for(let a=0;a<Math.PI*2;a+=Math.PI/16){const q=[p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r];if(free(q))return q;}return null;}
for(const r of N.roads.filter(r=>ids.has(r.id))){const old=r.p,start=nearestFree(old[0]),end=nearestFree(old.at(-1));if(!start||!end){report.push({id:r.id,status:'blocked endpoint unresolved'});continue;}
 const origin=start,key=p=>p.join(','),pos=p=>[origin[0]+p[0],origin[1]+p[1]],g=new Map([['0,0',0]]),parent=new Map(),todo=[{p:[0,0],f:0}],visited=new Set();let finish=null;
 const xs=old.map(p=>p[0]),zs=old.map(p=>p[1]),bounds=[Math.min(...xs)-18,Math.min(...zs)-18,Math.max(...xs)+18,Math.max(...zs)+18];
 while(todo.length&&visited.size<15000){todo.sort((a,b)=>b.f-a.f);const cur=todo.pop(),k=key(cur.p);if(visited.has(k))continue;visited.add(k);const a=pos(cur.p);if(Math.hypot(a[0]-end[0],a[1]-end[1])<1.8&&clear(a,end)){finish=cur.p;break;}
 for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const p=[cur.p[0]+dx,cur.p[1]+dz],q=key(p),b=pos(p);if(visited.has(q)||b[0]<bounds[0]||b[1]<bounds[1]||b[0]>bounds[2]||b[1]>bounds[3]||!free(b)||!clear(a,b))continue;const cost=g.get(k)+Math.hypot(dx,dz);if(cost>=(g.get(q)??Infinity))continue;g.set(q,cost);parent.set(q,cur.p);todo.push({p,f:cost+Math.hypot(b[0]-end[0],b[1]-end[1])});}}
 if(!finish){report.push({id:r.id,status:'no safe local route',searched:visited.size});continue;}
 const path=[end];for(let p=finish;p;p=parent.get(key(p)))path.push(pos(p));path.reverse();const simple=[path[0]];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clear(path[i],path[j]))j--;simple.push(path[j]);i=j;}
 r.p=simple;r.correction26='Local existing approach re-routed around solid collision; estimated, not surveyed';report.push({id:r.id,status:'corrected',before:old,after:simple,startShift:Math.hypot(start[0]-old[0][0],start[1]-old[0][1]),endShift:Math.hypot(end[0]-old.at(-1)[0],end[1]-old.at(-1)[1])});
}
// Persist only raw data, not prepared runtime library surfaces.
delete N.library17;fs.writeFileSync('dist/data/walk.json',JSON.stringify(N));fs.writeFileSync('BUILD26-LOCAL-ROUTES.json',JSON.stringify(report,null,2));console.log(report.map(({id,status,startShift,endShift})=>({id,status,startShift,endShift})));
