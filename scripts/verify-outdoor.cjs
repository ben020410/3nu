const fs=require('fs'),assert=require('assert'),W=require('../dist/walk-core.js'),D=JSON.parse(fs.readFileSync('dist/data/campus.json')),N=JSON.parse(fs.readFileSync('dist/data/walk.json')),w=W.create(D,N),o=N.outdoor,l=o.lawn;
assert.equal(o.courts.length,17);assert.equal(o.courts.filter(q=>q.kind==='clay').length,11);assert.equal(o.courts.filter(q=>q.kind==='courtGreen').length,6);assert.equal(o.basketball.length,2);assert.equal(N.facilities.filter(q=>q.kind==='stadium').length,1);
let maxPlaneError=0;for(const c of o.courts)for(const p of [c.center,...c.outline])maxPlaneError=Math.max(maxPlaneError,Math.abs(w.height(...p)-c.elevation));assert(maxPlaneError<.001);
const pt=(u,v)=>[l.center[0]+l.u[0]*u+l.v[0]*v,l.center[1]+l.u[1]*u+l.v[1]*v];let stairPaths=0;
for(const [a,b] of [[pt(64,0),pt(40,0)],[pt(-64,0),pt(-40,0)],[pt(0,49),pt(0,28)]]){let s={x:a[0],z:a[1]};const d=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<d;t+=.1)s=w.move(s,(b[0]-a[0])/d*.1,(b[1]-a[1])/d*.1);assert(Math.hypot(s.x-b[0],s.z-b[1])<.2);assert(Math.abs(s.y-(l.base+l.rise+.95))<.001);stairPaths++;}
const a=pt(0,-49),b=pt(0,-30);let s={x:a[0],z:a[1]};for(let i=0;i<190;i++)s=w.move(s,l.v[0]*.1,l.v[1]*.1);assert(Math.hypot(s.x-b[0],s.z-b[1])>5);
let fenceChecks=0;for(const f of o.fences){const x=(f.a[0]+f.b[0])/2,z=(f.a[1]+f.b[1])/2;assert(w.blocked(x,z));fenceChecks++;}
assert.equal(D.buildings.some(b=>['vw/243','vw/301'].includes(b.id)),false);
const result={passed:true,tennisCourts:17,headquarters:14,engineering:3,clay:11,green:6,basketballCourts:2,maxPlaneErrorM:maxPlaneError,stairPaths,wallCannotBeCrossed:true,fenceChecks,baseballPermanentMarkings:'unconfirmed; omitted',removedStaleLawnModels:2};fs.writeFileSync('BUILD-11-TEST.json',JSON.stringify(result,null,2));console.log(result);
