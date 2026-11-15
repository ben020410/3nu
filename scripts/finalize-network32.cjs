const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..');
const N=JSON.parse(fs.readFileSync(R+'/reports/build32/prepared-walk.json')),D=JSON.parse(fs.readFileSync(R+'/dist/data/campus.json'));
global.Library17=require(R+'/dist/library17.js');const runtime=structuredClone(N);Library17.prepare(D,runtime);require(R+'/dist/student22').prepare(D,runtime);require(R+'/dist/landmarks30').prepare(D,runtime);
const W=require(R+'/dist/walk-core').create(D,runtime);
for(const p of N.points)p[2]=W.terrain(p[0],p[1]);
// An anchor is an arrival point on the graph, not a new entrance or a path
// through a building. Preserve building IDs and rebind only retired/blocked
// graph nodes to nearby, walkable existing nodes.
const rebound=[];
for(const [id,oldNode] of Object.entries(N.anchors)){
 if(W.adj[oldNode].length)continue;
 const p=N.points[oldNode];
 const options=N.points.map((q,i)=>({i,q,d:Math.hypot(q[0]-p[0],q[1]-p[1])}))
  .filter(o=>o.d<=30&&W.adj[o.i].length&&!W.blocked(o.q[0],o.q[1],.5,W.terrain(o.q[0],o.q[1])))
  .sort((a,b)=>a.d-b.d);
 if(!options.length)throw Error('No safe existing arrival node for '+id);
 const next=options[0];N.anchors[id]=next.i;
 rebound.push({id,oldNode,newNode:next.i,distance:next.d,from:p.slice(0,2),to:next.q.slice(0,2)});
}
fs.writeFileSync(R+'/reports/build32/arrival-node-repairs.json',JSON.stringify(rebound,null,2));
fs.writeFileSync(R+'/reports/build32/prepared-walk.json',JSON.stringify(N));
console.log('Updated navigation elevations and '+rebound.length+' arrival nodes; layered walking surfaces remain independent.');
