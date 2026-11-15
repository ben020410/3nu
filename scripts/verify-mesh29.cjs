// Cast against actual rendered geometry, independently of floorAt lookup.
const B=require('../dist/vendor/babylon'),fs=require('fs'),vm=require('vm'),assert=require('assert'),engine=new B.NullEngine(),scene=new B.Scene(engine);
const ctx={earcut:require('../dist/vendor/earcut')};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/library17.js','utf8'),ctx);const S=require('../dist/data/walk.json').precinct29.library;ctx.buildLibrary17(B,scene,S);
const meshes=scene.meshes.filter(m=>m.metadata?.category29==='stairs');meshes.forEach(m=>m.computeWorldMatrix(true));let maxError=0,misses=[],upNormals=1,samples=0;
for(const s of S.surfaces.filter(s=>s.steps&&s.owner!=='structure'))for(const across of[-.33,0,.33])for(let k=0;k<s.steps;k++){
 const t=(k+.51)/s.steps,dx=s.to[0]-s.from[0],dz=s.to[1]-s.from[1],len=Math.hypot(dx,dz),x=s.from[0]+t*dx-dz/len*s.width*across,z=s.from[1]+t*dz+dx/len*s.width*across,y=S.base+s.lo+(s.hi-s.lo)*(k+1)/s.steps;
 const ray=new B.Ray(new B.Vector3(x,S.base+Math.max(s.lo,s.hi)+2,z),new B.Vector3(0,-1,0),Math.abs(s.hi-s.lo)+5),hits=meshes.map(m=>ray.intersectsMesh(m)).filter(p=>p.hit).sort((a,b)=>a.distance-b.distance),hit=hits[0];samples++;
 if(!hit){misses.push([s.id,k,across]);continue;}const error=Math.abs(hit.pickedPoint.y-y);maxError=Math.max(maxError,error);upNormals=Math.min(upNormals,hit.getNormal(true).y);if(error>.002)misses.push([s.id,k,across,error]);
}
const out={renderedTreadSamples:samples,maxRenderFloorErrorM:maxError,minimumTreadNormalY:upNormals,failures:misses,libraryRenderMeshes:scene.meshes.length,passed:!misses.length&&upNormals>.99};fs.writeFileSync('BUILD29-MESH.json',JSON.stringify(out,null,2));console.log(out);assert(out.passed);engine.dispose();
