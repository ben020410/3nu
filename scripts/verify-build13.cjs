const fs=require('fs'),assert=require('assert'),core=require('../dist/walk-core.js');
const c=JSON.parse(fs.readFileSync('dist/data/campus.json')),n=JSON.parse(fs.readFileSync('dist/data/walk.json')),w=core.create(c,n),p=n.pungsan13;
for(let k=0;k<p.tiers;k++){const r=p.innerRadius+(k+.5)*p.tread,x=p.center[0]+p.front[0]*r,z=p.center[1]+p.front[1]*r;assert(Math.abs(w.height(x,z)-(w.terrain(...p.center)+(k+1)*p.rise))<1e-5);}
let s={x:p.center[0]+p.front[0]*11.9,z:p.center[1]+p.front[1]*11.9};for(let i=0;i<140;i++)s=w.move(s,p.front[0]*.1,p.front[1]*.1);assert(Math.hypot(s.x-p.center[0],s.z-p.center[1])>25.8);
const before=JSON.parse(fs.readFileSync('data-sources/build13-campus-before.json'));assert(c.buildings.length===before.buildings.length);for(const b of c.buildings)assert.deepStrictEqual(b.p,before.buildings.find(o=>o.id===b.id).p);
assert(w.blocked(303,-61));
console.log(JSON.stringify({passed:true,tiers:p.tiers,tierHeightAligned:true,tierWalking:true,footprintCount:c.buildings.length,deletedFootprints:0,unchangedPlanPolygons:true},null,2));
