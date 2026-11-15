// Ray-check rendered stair treads and deck floors; independent of navigation lookup.
const B=require('../dist/vendor/babylon'),fs=require('fs'),vm=require('vm'),assert=require('assert');
const engine=new B.NullEngine(),scene=new B.Scene(engine),ctx={earcut:require('../dist/vendor/earcut')};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/landmarks30.js','utf8'),ctx);const S=require('../dist/data/walk.json').landmarks30;ctx.buildLandmarks30(B,scene,S);
scene.meshes.forEach(m=>m.computeWorldMatrix(true));let maxError=0,minNormal=1,samples=0,failures=[];
const meshes=scene.meshes.filter(m=>m.metadata?.category30==='stairs');
for(const s of S.surfaces.filter(s=>s.from))for(const across of[-.32,0,.32])for(let k=0;k<s.steps;k++){
 const t=(k+.51)/s.steps,dx=s.to[0]-s.from[0],dz=s.to[1]-s.from[1],len=Math.hypot(dx,dz),w=Math.hypot(s.p[0][0]-s.p[1][0],s.p[0][1]-s.p[1][1]),x=s.from[0]+dx*t-dz/len*w*across,z=s.from[1]+dz*t+dx/len*w*across,y=s.lo+(s.hi-s.lo)*(k+1)/s.steps;
 const ray=new B.Ray(new B.Vector3(x,s.hi+1,z),new B.Vector3(0,-1,0),s.hi-s.lo+2),hit=meshes.map(m=>ray.intersectsMesh(m)).filter(h=>h.hit).sort((a,b)=>a.distance-b.distance)[0];samples++;
 if(!hit){failures.push([s.id,k,'missing']);continue;}const err=Math.abs(hit.pickedPoint.y-y);maxError=Math.max(maxError,err);minNormal=Math.min(minNormal,hit.getNormal(true).y);if(err>.003||hit.getNormal(true).y<.99)failures.push([s.id,k,across,err,hit.getNormal(true).y]);
}
global.Library17=require('../dist/library17');const D=require('../dist/data/campus.json'),N=require('../dist/data/walk.json');Library17.prepare(D,N);require('../dist/student22').prepare(D,N);require('../dist/landmarks30').prepare(D,N);const W=require('../dist/walk-core').create(D,N);
const layerSamples=[];
for(const [x,z] of [[0,-967],[-21,-934],[22,-952]]){
 const deck=100.27306874492949;
 const down=new B.Ray(new B.Vector3(x,deck+.3,z),new B.Vector3(0,-1,0),.8),up=new B.Ray(new B.Vector3(x,97.2,z),new B.Vector3(0,1,0),3.5);
 const pick=ray=>scene.meshes.map(m=>ray.intersectsMesh(m)).filter(h=>h.hit).sort((a,b)=>a.distance-b.distance)[0];
 const top=pick(down)?.pickedPoint.y,soffit=pick(up)?.pickedPoint.y;
 const ceiling=W.ceilingAt(x,z,95.47306874492949),passed=Math.abs(top-deck)<.001&&Math.abs(soffit-ceiling)<.001&&soffit-95.47306874492949>1.85;
 layerSamples.push({x,z,top,soffit,collisionCeiling:ceiling,clearance:soffit-95.47306874492949,passed});if(!passed)failures.push(['layer',x,z,top,soffit]);
}
const report={layerSamples,samples,maxRenderFloorErrorM:maxError,minimumTreadNormalY:minNormal,failures,meshes:scene.meshes.length,passed:!failures.length};fs.writeFileSync('reports/build30/mesh-check.json',JSON.stringify(report,null,2));console.log({...report,failures:failures.slice(0,4)});engine.dispose();assert(report.passed);
// Standalone solid/floor consistency, including underpass headroom.
