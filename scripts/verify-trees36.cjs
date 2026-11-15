'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..'),BASELINE=path.resolve(ROOT,'../work/build36/baseline35');
const WalkCore=require(path.join(ROOT,'dist/walk-core.js')),Landscape36=require(path.join(ROOT,'dist/landscape36.js'));
function prepareScene(directory,current){
 const data=JSON.parse(fs.readFileSync(path.join(directory,'dist/data/campus.json'))),nav=JSON.parse(fs.readFileSync(path.join(directory,'dist/data/walk.json')));
 global.Library17=require(path.join(directory,'dist/library17.js'));Library17.prepare(data,nav);require(path.join(directory,'dist/student22.js')).prepare(data,nav);require(path.join(directory,'dist/engineering35.js')).prepare(data,nav);
 if(current&&fs.existsSync(path.join(directory,'dist/engineering36.js')))require(path.join(directory,'dist/engineering36.js')).prepare(data,nav);
 require(path.join(directory,'dist/landmarks30.js')).prepare(data,nav);
 return {data,nav,world:WalkCore.create(data,nav)};
}
const prior=prepareScene(BASELINE,false),currentScene=prepareScene(ROOT,true),N=currentScene.nav;
const B=require(path.join(ROOT,'dist/vendor/babylon.js'));
const unitCrown=B.VertexData.CreateIcoSphere({radius:1,subdivisions:2,flat:false});let unitCrownVertexRadius=0;
for(let i=0;i<unitCrown.positions.length;i+=3)unitCrownVertexRadius=Math.max(unitCrownVertexRadius,Math.hypot(...unitCrown.positions.slice(i,i+3)));
const matrices=[];const MeshBuilder={CreateIcoSphere:()=>({thinInstanceSetBuffer:(k,v)=>{if(k==='matrix')matrices.push(v);},dispose(){}}),CreateCylinder:()=>({thinInstanceSetBuffer(){},dispose(){}})};
function treeRun(source,sceneState,coarse=false){
 const code=source.slice(source.indexOf(' // Instanced landscaping'),source.indexOf('\n if(treeMats.length)'));
 const {nav,world}=sceneState;
 const ctx={B:{...B,MeshBuilder},V:(x,y,z)=>new B.Vector3(x,y,z),make:()=>({}),scene:{},nav,height:world.height,window:{campusWorld:world},WalkCore,Landscape36,matchMedia:()=>({matches:coarse}),Float32Array,console};
 vm.createContext(ctx);vm.runInContext(code+'\nglobalThis.out={matrices:treeMats,colors:treeColors,trunks:trunkMats,stats:typeof planting!==\'undefined\'?planting.stats:null};',ctx);return ctx.out;
}
const baseline=fs.readFileSync(path.join(BASELINE,'dist/scene-details.js'),'utf8'),current=fs.readFileSync(path.join(ROOT,'dist/scene-details.js'),'utf8');
const before=treeRun(baseline,prior),after=treeRun(current,currentScene),repeat=treeRun(current,currentScene),coarse=treeRun(current,currentScene,true);
const groups=r=>Array.from({length:r.trunks.length/16},(_,i)=>({matrix:r.matrices.slice(i*32,i*32+32),trunk:r.trunks.slice(i*16,i*16+16),color:r.colors.slice(i*8,i*8+8)}));
const bg=groups(before),ag=groups(after),byPosition=new Map(bg.map(q=>[q.trunk[12]+','+q.trunk[14],q]));
const positionKey=q=>q.trunk[12]+','+q.trunk[14],afterKeys=new Set(ag.map(positionKey));
const drift=ag.filter(q=>byPosition.has(positionKey(q))&&JSON.stringify(q)!==JSON.stringify(byPosition.get(positionKey(q))));
const added=ag.filter(q=>!byPosition.has(positionKey(q))),removedPositions=bg.filter(q=>!afterKeys.has(positionKey(q))).map(q=>[q.trunk[12],q.trunk[14]]);
// Independently reconstruct the ellipsoid descriptor from the actual Babylon
// instance matrix and compare with the whole prepared planting envelope.
const state=Landscape36.prepare(N),remaining=[];
for(const q of ag){const crowns=[];for(let off=0;off<32;off+=16){const m=q.matrix.slice(off,off+16),sx=Math.hypot(m[0],m[1],m[2]),sy=Math.hypot(m[4],m[5],m[6]),sz=Math.hypot(m[8],m[9],m[10]);crowns.push({center:[m[12],m[13],m[14]],radii:[sx,sy,sz],yaw:Math.atan2(-m[2],m[0])});}const t=q.trunk,h=Math.hypot(t[4],t[5],t[6]),tree={crowns,trunk:{center:[t[12],t[14]],radius:Math.hypot(t[0],t[1],t[2])*.5,lo:t[13]-h/2,hi:t[13]+h/2}},hit=Landscape36.interferes(state,tree);if(hit)remaining.push({p:[t[12],t[14]],hit});}
// Authored plaza planting: inspect the exact ellipsoid primitives consumed by
// the renderer, not just the convenience crownRadius in the planter metadata.
let authoredPlanting36=null;
if(N.engineering36){
 const plaza=N.engineering36,plazaModel=plaza.models[0],leaves=plazaModel.geometry.filter(q=>q.kind==='ellipsoid'&&/^leaf/.test(q.material));
 const shapes=leaves.map(q=>({name:q.name,center:plazaModel.world(q.center),radii:[q.radii[0],q.radii[2],q.radii[1]].map(v=>v*plazaModel.fit.scale)}));
 const crownShapes=shapes.filter(q=>q.name.includes('-crown')),structuralHits=[];
 for(const planter of plaza.planters){
  const exclusions=Landscape36.prepare({landmarks30:{...N.landmarks30,surfaces:[],volumes:N.landmarks30.volumes.filter(q=>!q.id.includes(planter.name+'-body'))}});
  for(const shape of shapes.filter(q=>q.name.startsWith(planter.name+'-'))){const hit=Landscape36.interferes(exclusions,{crowns:[{...shape,yaw:0}]});if(hit)structuralHits.push({plant:shape.name,hit});}
 }
 const pathHits=[];let sampledPositions=0,minCrownUndersideAboveDeck=Infinity,minimumTrunkRouteClearance=Infinity;
 const trunks=plazaModel.geometry.filter(q=>q.kind==='cylinder'&&q.name.endsWith('-trunk')),branches=plazaModel.geometry.filter(q=>q.kind==='beam'&&q.name.endsWith('-branch'));
 const minimumBranchUndersideAboveDeck=Math.min(...branches.map(q=>Math.min(plazaModel.world(q.a)[1],plazaModel.world(q.b)[1])-q.width*plazaModel.fit.scale/2-plaza.deck));
 for(const shape of crownShapes)minCrownUndersideAboveDeck=Math.min(minCrownUndersideAboveDeck,shape.center[1]-shape.radii[1]-plaza.deck);
 const intersectsAvatar=(shape,p)=>{
  // The real controller is a radius .42 m cylinder. Its .84 m square envelope
  // is conservative; an empty result proves foliage cannot enter the avatar.
  const feet=p.y-.95,head=feet+1.79,delta=[Math.max(Math.abs(p.x-shape.center[0])-.42,0),Math.max(feet-shape.center[1],shape.center[1]-head,0),Math.max(Math.abs(p.z-shape.center[2])-.42,0)];
  return delta.reduce((sum,d,i)=>sum+(d/shape.radii[i])**2,0)<=1;
 };
 for(const route of plaza.qaRoutes){
  let p={x:route.coords[0][0],z:route.coords[0][1],y:route.startFeet+.95};
  for(let i=1;i<route.coords.length;i++){
   const target=route.coords[i];let guard=0;
   while(Math.hypot(target[0]-p.x,target[1]-p.z)>.04&&guard++<5000){
    sampledPositions++;for(const trunk of trunks){const center=plazaModel.world([trunk.x,trunk.y,0]),feet=p.y-.95;if(feet+1.79>=trunk.lo&&feet<=trunk.hi)minimumTrunkRouteClearance=Math.min(minimumTrunkRouteClearance,Math.hypot(p.x-center[0],p.z-center[2])-.42-trunk.r);}
    for(const shape of shapes)if(intersectsAvatar(shape,p))pathHits.push({route:route.name,plant:shape.name,position:[p.x,p.y-.95,p.z]});
    const dx=target[0]-p.x,dz=target[1]-p.z,len=Math.hypot(dx,dz),amount=Math.min(.15,len),next=currentScene.world.move(p,dx/len*amount,dz/len*amount);if(next.distance<.001)break;p=next;
   }
  }
 }
 authoredPlanting36={trees:plaza.planters.filter(q=>q.treeCenter).length,planters:plaza.planters.length,foliagePrimitives:shapes.length,routeSamples:sampledPositions,avatarRadius:.42,avatarHeight:1.79,conservativeAvatarEnvelope:'0.84 m square horizontal envelope',minimumCrownUndersideAboveDeck:minCrownUndersideAboveDeck,minimumBranchUndersideAboveDeck,minimumTrunkRouteClearance,structuralHits,pathHits,passed:!structuralHits.length&&!pathHits.length&&minimumTrunkRouteClearance>0&&minimumBranchUndersideAboveDeck>1.79};
}
const result={build:36,source:'Actual baseline and current scene-details tree generation executed against separately prepared worlds using Babylon Matrix.Compose; rendered instance matrices decoded for crown checks',preparedEngineering:N.engineering36?36:35,authoredPlanting36,renderedCrownEnvelope:{unitCrownVertexRadius,ellipsoidRadius:1,conservative:unitCrownVertexRadius<=1.0000001},beforeTrees:bg.length,afterTrees:ag.length,removedTrees:removedPositions.length,removedPositions,newUnexpectedTrees:added.length,crownRuleRemovedTrees:after.stats.removed,removed:after.stats.removedTrees,survivingTreesWithChangedTransformOrColour:drift.length,remainingCrownIntersections:remaining,rebuildDeterministic:JSON.stringify(after)===JSON.stringify(repeat),coarsePointer:{candidates:coarse.stats.candidates,kept:coarse.stats.kept,removed:coarse.stats.removed},preservesSourceTreeCoordinates:JSON.stringify(prior.nav.trees)===JSON.stringify(N.trees),exclusionShapesByBuilding:Object.fromEntries([...new Set(state.exclusions.map(q=>q.building))].map(id=>[id,state.exclusions.filter(q=>q.building===id).length])),clearance:{structurePadding_m:.25,walkFootprintPadding_m:.65,clearAboveWalkSurface_m:3},passed:(!authoredPlanting36||authoredPlanting36.passed)&&unitCrownVertexRadius<=1.0000001&&added.length===0&&JSON.stringify(prior.nav.trees)===JSON.stringify(N.trees)&&drift.length===0&&remaining.length===0&&JSON.stringify(after)===JSON.stringify(repeat)&&after.stats.removed>0};
fs.mkdirSync(path.join(ROOT,'reports/build36'),{recursive:true});fs.writeFileSync(path.join(ROOT,'reports/build36/tree-notes.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({preparedEngineering:result.preparedEngineering,beforeTrees:result.beforeTrees,afterTrees:result.afterTrees,removedTrees:result.removedTrees,drift:drift.length,remaining:remaining.length,deterministic:result.rebuildDeterministic,coarse:result.coarsePointer,authoredPlanting36,passed:result.passed},null,2));
if(!result.passed)process.exitCode=1;
