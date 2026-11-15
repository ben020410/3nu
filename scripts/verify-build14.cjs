const fs=require('fs'),vm=require('vm'),assert=require('assert'),B=require('../dist/vendor/babylon.js'),C=require('../dist/walk-core.js');
const data=JSON.parse(fs.readFileSync('dist/data/campus.json')),nav=JSON.parse(fs.readFileSync('dist/data/walk.json')),world=C.create(data,nav),scene=new B.Scene(new B.NullEngine()),ctx={BABYLON:B,earcut:require('../dist/vendor/earcut.js')};
for(const file of ['pungsan.js','review-buildings.js'])vm.runInNewContext(fs.readFileSync('dist/'+file,'utf8'),ctx);
assert.equal(new Set(data.buildings.map(b=>b.id)).size,data.buildings.length,'duplicate building ids');
const result={models:[],gate:{height:16.6*nav.gate.modelScale,width:20.95*nav.gate.modelScale,avatar:1.79},passed:false};
for(const b of data.buildings.filter(b=>b.photoVerification14||b.pungsan13||b.parts14||b.terraceOffsets14)){
 b.center=b.p.reduce((a,q)=>[a[0]+q[0]/b.p.length,a[1]+q[1]/b.p.length],[0,0]);const start=scene.meshes.length;ctx.buildReviewBuilding(B,scene,b,world.height);const meshes=scene.meshes.slice(start);assert(meshes.length>0,b.id);for(const m of meshes){m.computeWorldMatrix(true);const a=m.getBoundingInfo().boundingBox;assert(Number.isFinite(a.maximumWorld.y));}result.models.push({id:b.id,name:b.name,meshes:meshes.length,structureHeight:b.top-world.height(...b.center),triangles:meshes.reduce((a,m)=>a+m.getTotalIndices()/3,0)});
}
const g=nav.gate,gs=g.modelScale,a=Math.PI+.105,pt=(x,z)=>[g.center[0]+Math.cos(a)*x-Math.sin(a)*z,g.center[1]+Math.sin(a)*x+Math.cos(a)*z];
assert(world.blocked(...pt(8.9*gs,0)));assert(!world.blocked(...pt(0,0)));for(const side of [-1,1])for(const x of [-1.5,1.5])for(const z of [-1.9,1.9])assert(world.blocked(...pt((side*8.9+x)*gs,z*gs)));
result.gate.pillarBollardCollision=true;result.gate.openCenter=true;result.passed=true;fs.writeFileSync('BUILD14-TEST.json',JSON.stringify(result,null,2));console.log(result);scene.dispose();
