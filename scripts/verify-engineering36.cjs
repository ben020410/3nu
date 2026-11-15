/* BUILD36 focused integration checks: run the real ground controller in both directions. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const D=read('dist/data/campus.json'),N=read('dist/data/walk.json');
const baseline=path.resolve(root,'../work/build36/baseline35');
const BN=JSON.parse(fs.readFileSync(path.join(baseline,'dist/data/walk.json')));
global.Library17=require('../dist/library17.js');
Library17.prepare(D,N);require('../dist/student22.js').prepare(D,N);
const E=require('../dist/engineering35.js'),state=E.prepare(D,N);
const E36=require('../dist/engineering36.js'),state36=E36.prepare(D,N);
require('../dist/landmarks30.js').prepare(D,N);
const W=require('../dist/walk-core.js').create(D,N),S=N.landmarks30,G=state.ground,T=state.deck;
const anchors=state.anchors,point=p=>[p[0],p[2]],local=(n,p)=>point(state.models.find(m=>m.number===n).world(p));
const routes=[],floorSamples=[];
function route(name,coords,startFeet,endFeet=startFeet){routes.push({name,coords,startFeet,endFeet});}
route('shared B stairs → 303 entry',[[7,-1003],[7,-1001],[7,-986],[7,-981],[7,-969],[7,-967],[-15,-966.75],point(anchors['303'].entry),point(anchors['303'].vestibule)],G,T);
route('shared deck → 301 entry',[[7,-967],[12,-954],[17,-948],[25,-946],[31,-944.6],[36,-944.6],point(anchors['301'].entry),point(anchors['301'].entryInside)],T);
route('301 retained tower-side entrance',[[6,-1065],[8,-1065],[12,-1065],point(anchors['301'].sideEntry),point(anchors['301'].sideInside)],G,anchors['301'].sideEntry[1]);
route('302 west stairs → entry',[[3,-1132],[5,-1132],[13,-1132],[21,-1132],point(anchors['302'].entry),point(anchors['302'].entryInside)],G,anchors['302'].entry[1]);
route('302 north stairs → west landing',[[15.5,-1101],[15.5,-1103],[15.5,-1115],[15.5,-1132],[21,-1132],point(anchors['302'].entryInside)],G,anchors['302'].entryInside[1]);
route('300 F1 → E2 → F2 → E1 → lobby',[
 [-55,-37,-25],[-55,-30,-25],[-55,-26,-25],[-47,-8,-14],[-47,1,-14],[-35,1,-14],[-35,-8,-14],[0,-13,-14],[80,-28,-14],[112,-46,-14],[160,-78,-14],[183,-80,-14],[183,-78,-14],[183,-24,0],[183,-18,0],[178,-14,0],[130,-25,0],[110,-20,0],[90,-10,0],[64,-4,0],[64,6,0],[64,12,0]
].map(p=>local('300',p)),G,anchors['300'].entry[1]);
route('300 retained shared access',[[29,-931],[27,-932],[17,-937],[14,-941],[7,-945],[0,-948]],G,T);
route('312 retained shared access',[[-49,-925],[-47,-925],[-29,-925],[-21.5,-925],[-21.5,-954],[-16,-954]],G,T);
// The road keeps its original curved centreline. Interpolate the retained profile,
// rather than walking a straight chord through a pier or stair.
const ring=N.ring33.route.filter(p=>p[0]>-30&&p[1]>=-1005&&p[1]<=-930);
route('15 m road beneath shared deck',ring,G);

function blockers(x,z,feet){return {
 solids:S.volumes.filter(q=>Library17.blocked({...S,volumes:[q],surfaces:[]},x,z,.42,feet)).map(q=>q.id),
 stairs:S.surfaces.filter(q=>q.from&&Library17.blocked({...S,volumes:[],surfaces:[q]},x,z,.42,feet)).map(q=>q.id)
};}
function walk(r,reverse){
 const coords=reverse?r.coords.slice().reverse():r.coords;
 let p={x:coords[0][0],z:coords[0][1],y:(reverse?r.endFeet:r.startFeet)+.95};
 let failure=null,steps=0,distance=0,maxStepHeight=0,maxFloorError=0,minHeadroom=Infinity;
 floorSamples.push({route:r.name,reverse,p:[p.x,p.y-.95,p.z],sample:'route-start'});
 for(let i=1;i<coords.length&&!failure;i++){
  const end=coords[i];let guard=0;
  while(Math.hypot(end[0]-p.x,end[1]-p.z)>.035&&guard++<10000){
   const dx=end[0]-p.x,dz=end[1]-p.z,len=Math.hypot(dx,dz),amount=Math.min(.065,len);
   const next=W.move(p,dx/len*amount,dz/len*amount),feet=p.y-.95;
   maxStepHeight=Math.max(maxStepHeight,Math.abs(next.y-p.y));steps++;distance+=next.distance;
   const floor=W.floorAt(next.x,next.z,next.y-.95);maxFloorError=Math.max(maxFloorError,Math.abs(floor-(next.y-.95)));
   minHeadroom=Math.min(minHeadroom,W.ceilingAt(next.x,next.z,next.y-.95)-(next.y-.95));
   if(steps%19===0||Math.abs(next.y-p.y)>.025)floorSamples.push({route:r.name,reverse,p:[next.x,next.y-.95,next.z],sample:Math.abs(next.y-p.y)>.025?'height-change':'regular'});
   if(next.distance<amount*.1){const x=p.x+dx/len*amount,z=p.z+dz/len*amount;failure={segment:i,position:[p.x,feet,p.z],target:end,next:[x,z],nextFloor:W.floorAt(x,z,feet),terrain:W.terrain(x,z),blocked:W.blocked(x,z,.42,feet),...blockers(x,z,feet)};break;}
   p=next;
  }
  if(guard>=10000)failure={segment:i,reason:'iteration bound',position:[p.x,p.y-.95,p.z]};
  floorSamples.push({route:r.name,reverse,p:[p.x,p.y-.95,p.z],sample:'waypoint'});
 }
 const target=coords.at(-1),endError=Math.abs(p.y-.95-(reverse?r.startFeet:r.endFeet)),positionError=Math.hypot(p.x-target[0],p.z-target[1]);
 return {route:r.name,reverse,passed:!failure&&endError<.12&&positionError<.05&&maxFloorError<1e-6&&maxStepHeight<=.260001&&minHeadroom>=1.79,steps,distance,maxStepHeight,maxFloorError,minHeadroom:Number.isFinite(minHeadroom)?minHeadroom:null,endError,positionError,final:[p.x,p.y-.95,p.z],failure};
}
// BUILD36 publishes the actual circulation topology for deterministic UI QA.
for(const r of state36.qaRoutes||[]){const i=routes.findIndex(q=>q.name===r.name);if(i>=0)routes[i]=r;else routes.push(r);}
// Complete journeys cross both the turned stair landing and the threshold in
// one controller run; the plaza loop explicitly crosses the former deck slit.
const stairTo303=routes.find(r=>r.name==='shared B stairs → 303 entry');
const plazaTo301=routes.find(r=>r.name==='shared deck → 301 entry');
const hubIndex=stairTo303.coords.findIndex(p=>Math.hypot(p[0]-plazaTo301.coords[0][0],p[1]-plazaTo301.coords[0][1])<1e-8);
if(hubIndex<0)throw Error('Shared stair and301 route topology do not share a physical waypoint');
route('ground stairs → plaza → 301 entry complete',[...stairTo303.coords.slice(0,hubIndex+1),...plazaTo301.coords.slice(1)],G,T);
route('303 vestibule → plaza → 301 vestibule',[...stairTo303.coords.slice(hubIndex).reverse(),...plazaTo301.coords.slice(1)],T,T);
route('continuous plaza loop across former slit',[[12,-970],[-16,-970],[-15,-955],[0,-949],[8,-957],[12,-970]],T,T);
const movement=routes.flatMap(r=>[walk(r,false),walk(r,true)]);
// Read the actual immutable ground mesh, plus the exact primitive descriptions
// consumed by Engineering35.build. This catches controller-only invisible floors.
const rendered=[];
const inPoly=(x,z,p)=>Library17.floor({base:0,surfaces:[{p,lo:0}]},x,z,0)!==null;
function addFlat(id,p,y,holes=[]){rendered.push({id,p,y,holes});}
function addStair(id,a,b,width,lo,hi,steps){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length*width/2,nz=dx/length*width/2;rendered.push({id,p:[[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz]],a,b,lo,hi,steps});}
for(const q of S.volumes)if(!q.hidden)addFlat(q.id,q.p,q.hi,q.holes||[]);
for(const q of S.surfaces)if(q.from&&!q.engineering35)addStair(q.id,q.from,q.to,Math.hypot(q.p[0][0]-q.p[1][0],q.p[0][1]-q.p[1][1]),q.lo,q.hi,q.steps);
const renderModels=[...new Set([...state.models,...(state36.models||[])])];
for(const m of renderModels)for(const q of m.geometry){
 if(q.kind==='quad'){const p=q.p.map(m.world);if(p.every(v=>Math.abs(v[1]-p[0][1])<1e-8))addFlat('eng35-'+m.number+'-'+q.name,p.map(point),p[0][1]);}
 if(q.kind==='slab'&&q.topFace!==false)addFlat('eng35-'+m.number+'-'+q.name,q.p.map(p=>point(m.world([...p,0]))),m.fit.datum+m.fit.scale*q.hi);
 if(q.kind==='quad'&&q.name.startsWith('paver-')){const p=q.p.map(m.world);if(p.every(v=>Math.abs(v[1]-p[0][1])<1e-8))for(let i=1;i<p.length-1;i++)addFlat('eng35-'+m.number+'-'+q.name+'-triangle-'+i,[p[0],p[i],p[i+1]].map(point),p[0][1]);}
 if(q.kind==='stair')addStair('eng35-'+m.number+'-'+q.name,point(m.world([...q.a,0])),point(m.world([...q.b,0])),q.width*m.fit.scale,m.fit.datum+q.lo*m.fit.scale,m.fit.datum+q.hi*m.fit.scale,q.steps);
}
const groundMeta=read('dist/data/ground.json'),gb=fs.readFileSync(path.join(root,'dist/data/ground.bin')),ib=fs.readFileSync(path.join(root,'dist/data/ground-indices.bin'));
const ground=new Float32Array(gb.buffer,gb.byteOffset,gb.byteLength/4),indices=new Uint32Array(ib.buffer,ib.byteOffset,ib.byteLength/4),groundGrid=new Map();
const bounds=[Math.min(...floorSamples.map(q=>q.p[0]))-1,Math.min(...floorSamples.map(q=>q.p[2]))-1,Math.max(...floorSamples.map(q=>q.p[0]))+1,Math.max(...floorSamples.map(q=>q.p[2]))+1];
for(const chunk of groundMeta.chunks){
 let minx=Infinity,minz=Infinity,maxx=-Infinity,maxz=-Infinity;
 for(let i=0;i<chunk.count;i++){const o=chunk.offset+i*3;minx=Math.min(minx,ground[o]);maxx=Math.max(maxx,ground[o]);minz=Math.min(minz,ground[o+2]);maxz=Math.max(maxz,ground[o+2]);}
 if(maxx<bounds[0]||minx>bounds[2]||maxz<bounds[1]||minz>bounds[3])continue;
 for(let i=chunk.indexOffset;i<chunk.indexOffset+chunk.indexCount;i+=3){const ps=[indices[i],indices[i+1],indices[i+2]].map(j=>{const o=chunk.offset+j*3;return[ground[o],ground[o+1],ground[o+2]];});
  const x0=Math.min(...ps.map(p=>p[0])),x1=Math.max(...ps.map(p=>p[0])),z0=Math.min(...ps.map(p=>p[2])),z1=Math.max(...ps.map(p=>p[2]));
  if(x1<bounds[0]||x0>bounds[2]||z1<bounds[1]||z0>bounds[3])continue;
  for(let x=Math.floor(x0/4);x<=Math.floor(x1/4);x++)for(let z=Math.floor(z0/4);z<=Math.floor(z1/4);z++){const k=x+','+z;if(!groundGrid.has(k))groundGrid.set(k,[]);groundGrid.get(k).push(ps);}
 }
}
function meshGroundAt(x,z){let best=null;for(const [a,b,c]of groundGrid.get(Math.floor(x/4)+','+Math.floor(z/4))||[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7){const y=u*a[1]+v*b[1]+(1-u-v)*c[1];if(best===null||y>best)best=y;}}return best;}
const visibleFailures=[],stepEdges=[];let maxVisibleError=0;
for(const sample of floorSamples){const [x,feet,z]=sample.p,candidates=[];const gy=meshGroundAt(x,z);if(gy!==null&&gy<=feet+.24)candidates.push({y:gy,id:'ground.bin'});
 for(const q of rendered)if(inPoly(x,z,q.p)&&!(q.holes||[]).some(p=>inPoly(x,z,p))){let y=q.y,edge=false;if(q.a){const dx=q.b[0]-q.a[0],dz=q.b[1]-q.a[1],t=Math.max(0,Math.min(1,((x-q.a[0])*dx+(z-q.a[1])*dz)/(dx*dx+dz*dz))),f=t*q.steps;edge=Math.abs(f-Math.round(f))<1e-6;y=q.lo+(q.hi-q.lo)*Math.min(q.steps,Math.floor(f)+1)/q.steps;}if(y<=feet+.24)candidates.push({y,id:q.id,edge});}
 const actual=candidates.sort((a,b)=>b.y-a.y)[0],error=actual?Math.abs(actual.y-feet):Infinity;
 if(error>.025){if(actual?.edge&&error<=.181)stepEdges.push({...sample,error,source:actual.id});else visibleFailures.push({...sample,error:Number.isFinite(error)?error:null,source:actual?.id||null,visible:actual?.y||null});}
 if(!(actual?.edge&&error<=.181))maxVisibleError=Math.max(maxVisibleError,error);
}
const renderedFloors={method:'Barycentric ground.bin/ground-indices.bin triangle sampling plus exact authored slab, horizontal finish quad and stair top faces; samples every 1.235 m of controller travel, every height transition over 0.025 m, every waypoint and route start',samples:floorSamples.length,maxError:maxVisibleError,stairBoundarySamples:stepEdges.length,failures:visibleFailures,passed:visibleFailures.length===0};
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const preservation=[];
for(const key of ['ring33','roads','points','edges','groundProfiles32','roadGrades32','surfaces','terrain'])preservation.push({item:key,passed:JSON.stringify(N[key])===JSON.stringify(BN[key])});
for(const file of ['ground.json','ground.bin','ground-indices.bin','ring-lanes33.json']){const a=fs.readFileSync(path.join(root,'dist/data',file)),b=fs.readFileSync(path.join(baseline,'dist/data',file));preservation.push({item:file,passed:digest(a)===digest(b),sha256:digest(a)});}
preservation.push({item:'ring carriageway and lanes',passed:N.ring33.carriageway===15&&N.ring33.laneOffsets.length===4&&N.ring33.laneWidth===3.3});
const BE=require(path.join(baseline,'dist/engineering35.js'));
for(const number of ['300','301','302','303']){
 const before=BE.collect(number,require(path.join(baseline,'dist/engineering35-'+number+'.js'))),after=state.models.find(m=>m.number===number);
 const signature=m=>JSON.stringify({fit:m.fit,geometry:m.geometry.filter(q=>q.name!=='301-number'),volumes:m.volumes,surfaces:m.surfaces});
 preservation.push({item:number+' authored building except replaced 301 facade digits',passed:!!after&&signature(before)===signature(after),primitivesBefore:before.geometry.filter(q=>q.name!=='301-number').length,primitivesAfter:after?.geometry.filter(q=>q.name!=='301-number').length});
}

const targets=Object.values(E.fits).map(f=>f.id),ownership=[];
for(const id of targets){const b=D.buildings.find(q=>q.id===id);ownership.push({item:id+' generic-body disabled',passed:!!b.landmark30&&!!b.engineering35&&!b.renderParts&&!b.collisionPolygons});}
const buildingModels=state.models.filter(m=>['300','301','302','303'].includes(m.number));
ownership.push({item:'all four authored models',passed:buildingModels.length===4&&buildingModels.every(m=>m.geometry.length>0&&m.volumes.length>0)});
const retiredBody=/^(301-(south-tower|long-low-wing|recess-|entry-wall|entry-side|east-service-return)|302-(south-glass-tower|banded-north-wing|low-recessed-floor|recessed-link|x-recess|col-)|303-(atrium-|north-|south-|interior-))/;
ownership.push({item:'retired exterior/collision bodies removed',passed:!S.volumes.some(q=>retiredBody.test(q.id))});
const layers=[[-4.4,-968],[-3,-959],[0,-952]].map(p=>{const lower=W.floorAt(...p,G),upper=W.floorAt(...p,T),ceiling=W.ceilingAt(...p,lower);return {p,lower,upper,headroom:ceiling-lower,passed:Math.abs(lower-G)<1e-6&&upper-lower>4.7&&ceiling-lower>2.8&&!W.blocked(...p,.42,lower)};});
// Landing support is checked independently of the public-access routes. A flight
// descent may land on these visible ledges/roofs even though they have no stairs.
function quadYAt(x,z,p){for(let i=1;i<p.length-1;i++){const a=p[0],b=p[i],c=p[i+1],den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7)return u*a[1]+v*b[1]+(1-u-v)*c[1];}return null;}
const landings=[];
function landing(number,name,localPoint,renderName,settleDirection=[.01,0]){
 const m=state.models.find(q=>q.number===number),p=m.world(localPoint),x=p[0],feet=p[1],z=p[2],floor=W.floorAt(x,z,feet+.15),blocked=W.blocked(x,z,.42,feet);
 const next=W.move({x,z,y:feet+.15+.95},...settleDirection),settledFeet=next.y-.95;
 const renderedHeights=m.geometry.filter(q=>q.name===renderName).map(q=>q.kind==='slab'?(inPoly(x,z,q.p.map(v=>point(m.world([...v,0]))))?m.fit.datum+m.fit.scale*q.hi:null):q.kind==='quad'?quadYAt(x,z,q.p.map(m.world)):null).filter(q=>q!==null);
 const renderError=renderedHeights.length?Math.min(...renderedHeights.map(y=>Math.abs(y-feet))):Infinity;
 const nextRendered=m.geometry.filter(q=>q.name===renderName).map(q=>q.kind==='slab'?(inPoly(next.x,next.z,q.p.map(v=>point(m.world([...v,0]))))?m.fit.datum+m.fit.scale*q.hi:null):q.kind==='quad'?quadYAt(next.x,next.z,q.p.map(m.world)):null).filter(q=>q!==null);
 const settledRenderError=nextRendered.length?Math.min(...nextRendered.map(y=>Math.abs(y-settledFeet))):Infinity;
 landings.push({building:number,name,local:localPoint,world:p,floor,blocked,settledFeet,moveDistance:next.distance,renderError,settledRenderError,passed:Math.abs(floor-feet)<1e-6&&!blocked&&next.distance>.009&&renderError<1e-6&&settledRenderError<1e-6});
}
for(const h of [10,21,32,43])for(const[name,x,y]of [['L',28.6,16],['R',60.4,16],['rear',44.5,42]])landing('303','gallery '+name+' height '+h,[x,y,h],name==='rear'?'303-C-rear-gallery':'303-C-side-gallery-'+name);
for(const y of [1,10,21])landing('303','front slope roof '+y,[44.5,y,57.5+(y+.7)*3.1/22.7],'303-C-front-roof-top');
for(const y of [23,35,47])landing('303','high slope roof '+y,[44.5,y,68-(y-21.8)*3.6/26.8],'303-C-high-roof-top');
landing('303','A roof cap',[.5,20,62.55],'303-A-roof-cap');
landing('303','A roof inset',[14,20,62.68],'303-A-roof-inset');
landing('303','B roof cap',[62.5,20,55.55],'303-B-roof-cap');
landing('303','B roof inset',[80,20,55.68],'303-B-roof-inset');
landing('300','upper roof edge',[2,40,60.15],'A-roof-edge');
landing('300','upper roof cap',[50,40,60.7],'A-recessed-roof');
landing('300','round pavilion roof',[158,5,18.5],'D-roof-cap');
for(const[name,p,renderName]of [
 ['tower end cap',[5,330,191],'301-end-roof-thickness'],
 ['central tower roof',[50,330,180.4],'301-central-roof'],
 ['podium roof cap',[20,150,46.6],'301-low-roof-left'],
 ['barrel crest',[50,150,54],'301-barrel-glass'],
 ['front chamfer strip',[5,283,190],'301-tower-left'],
 ['central roof margin',[50,285.5,180],'301-tower-central'],
 ['central podium tail',[50,279,46],'301-podium-centre-back'],
 ['steep side glazing slope',[20,20,6+23*20/39.8],'301-left-sloped-glass-glass'],
 ['central glazing slope',[50,10,6+13*10/39.8],'301-central-sloped-glass-glass'],
 ['small entrance canopy',[45,-4,9.5],'301-canopy-left']
])landing('301',name,p,renderName,name==='barrel crest'?[0,.01]:[.01,0]);
const columns=[],m300=state.models.find(m=>m.number==='300');
for(const q of m300.geometry.filter(q=>q.kind==='cylinder'&&/^B-(front|interior)-column-/.test(q.name))){
 const center=m300.world([q.x,q.y,0]),start=m300.world([q.x-5,q.y,0]),solid=m300.volumes.find(v=>v.id==='eng35-300-'+q.name),feet=center[1];
 const isolatedBlocked=!!solid&&Library17.blocked({...S,volumes:[solid],surfaces:[]},center[0],center[2],.42,feet),blocked=W.blocked(center[0],center[2],.42,feet);
 const moved=W.move({x:start[0],z:start[2],y:feet+.95},center[0]-start[0],center[2]-start[2]),standoff=Math.hypot(moved.x-center[0],moved.z-center[2]),minimumStandoff=q.r*m300.fit.scale+.42;
 columns.push({name:q.name,center,isolatedBlocked,blocked,attemptDistance:5*m300.fit.scale,movedDistance:moved.distance,standoff,minimumStandoff,passed:isolatedBlocked&&blocked&&moved.distance>.1&&moved.distance<1.4&&standoff>=minimumStandoff-.015});
}
const m301=state.models.find(m=>m.number==='301'),slopePoint=m301.world([20,20,6+23*20/39.8]),atriumPoint=state.models.find(m=>m.number==='303').world([44.5,10,0]);
const roofClearance=[
 {name:'301 sloped envelope remains solid from below',point:slopePoint,feet:slopePoint[1]-.5,passed:W.blocked(slopePoint[0],slopePoint[2],.42,slopePoint[1]-.5)},
 {name:'303 atrium stays open beneath roof',point:atriumPoint,feet:atriumPoint[1],passed:!W.blocked(atriumPoint[0],atriumPoint[2],.42,atriumPoint[1])&&W.ceilingAt(atriumPoint[0],atriumPoint[2],atriumPoint[1])-atriumPoint[1]>20}
];
const supplemental={landings,columns,roofClearance,passed:landings.every(q=>q.passed)&&columns.length===8&&columns.every(q=>q.passed)&&roofClearance.every(q=>q.passed)};
// A second prepare on the same scene must be a no-op; a fresh rebuild must
// reproduce the same owned solids, surfaces and authored primitive counts.
function ownedSnapshot(nav){const s=nav.landmarks30;return {
 volumes:s.volumes.filter(q=>q.engineering36||q.building==='engineering-common36'),
 surfaces:s.surfaces.filter(q=>q.engineering36||q.building==='engineering-common36'),
 models:(nav.engineering36?.models||[]).map(m=>({number:m.number,fit:m.fit,geometry:m.geometry,volumes:m.volumes,surfaces:m.surfaces}))
};}
const firstSnapshot=ownedSnapshot(N),beforeRepeat=JSON.stringify(firstSnapshot);
const repeatState=E36.prepare(D,N);
const repeatSnapshot=JSON.stringify(ownedSnapshot(N));
const freshD=read('dist/data/campus.json'),freshN=read('dist/data/walk.json');
Library17.prepare(freshD,freshN);require('../dist/student22.js').prepare(freshD,freshN);
E.prepare(freshD,freshN);E36.prepare(freshD,freshN);require('../dist/landmarks30.js').prepare(freshD,freshN);
const freshSnapshot=JSON.stringify(ownedSnapshot(freshN));
const ownedIds=[...firstSnapshot.volumes,...firstSnapshot.surfaces].map(q=>q.id);
const duplicateOwnedIds=ownedIds.filter((id,i)=>ownedIds.indexOf(id)!==i);
const rebuild={sameStateObject:repeatState===state36,repeatPrepareStable:beforeRepeat===repeatSnapshot,freshRebuildStable:beforeRepeat===freshSnapshot,ownedVolumes:firstSnapshot.volumes.length,ownedSurfaces:firstSnapshot.surfaces.length,duplicateOwnedIds,passed:repeatState===state36&&beforeRepeat===repeatSnapshot&&beforeRepeat===freshSnapshot&&duplicateOwnedIds.length===0&&firstSnapshot.volumes.length>0};
const polygonChecks=[];
const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
for(const m of state36.models||[])for(const q of m.geometry||[])if(q.kind==='slab'){
 const p=q.p;let area=0;const crossings=[];
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length];area+=a[0]*b[1]-b[0]*a[1];
  for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;const c=p[j],d=p[(j+1)%p.length];if(turn(a,b,c)*turn(a,b,d)<-1e-10&&turn(c,d,a)*turn(c,d,b)<-1e-10)crossings.push([i,j]);}
 }
 polygonChecks.push({name:q.name,area:Math.abs(area/2),crossings,passed:p.length>=3&&p.flat().every(Number.isFinite)&&Number.isFinite(q.lo)&&Number.isFinite(q.hi)&&q.hi>=q.lo&&Math.abs(area)>1e-7&&!crossings.length});
}
const authoredPolygons={count:polygonChecks.length,failures:polygonChecks.filter(q=>!q.passed),passed:polygonChecks.length>0&&polygonChecks.every(q=>q.passed)};
// Broad plaza support and obstruction checks complement prescribed paths.
const plaza=state36.plazaOutline,plazaTop=state36.deck;
function pointEdgeDistance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
function edgeDistance(p,poly){return Math.min(...poly.map((a,i)=>pointEdgeDistance(p,a,poly[(i+1)%poly.length])));}
const plazaFailures=[],plazaBounds=[Math.min(...plaza.map(p=>p[0])),Math.min(...plaza.map(p=>p[1])),Math.max(...plaza.map(p=>p[0])),Math.max(...plaza.map(p=>p[1]))];
let plazaSamples=0,planterExcluded=0;const retainedCanopyPosts=[];
for(let x=plazaBounds[0]+.375;x<plazaBounds[2];x+=.75)for(let z=plazaBounds[1]+.375;z<plazaBounds[3];z+=.75){
 if(!inPoly(x,z,plaza)||edgeDistance([x,z],plaza)<.5)continue;
 if(state36.planters.some(q=>inPoly(x,z,q.p)||edgeDistance([x,z],q.p)<.45)){planterExcluded++;continue;}
 const floor=W.floorAt(x,z,plazaTop),blocked=W.blocked(x,z,.42,plazaTop);plazaSamples++;
 if(Math.abs(floor-plazaTop)>1e-6||blocked){const hit=blockers(x,z,plazaTop);if(Math.abs(floor-plazaTop)<=1e-6&&hit.solids.length&&hit.solids.every(id=>id==='eng35-301-301-canopy-post')&&!hit.stairs.length)retainedCanopyPosts.push({p:[x,plazaTop,z],solids:hit.solids});else plazaFailures.push({p:[x,plazaTop,z],floor,blocked,...hit});}
}
const plazaSupport={gridSpacing:.75,edgeInset:.5,planterBuffer:.45,samples:plazaSamples,planterExcluded,retainedCanopyPosts,failures:plazaFailures,passed:plazaSamples>100&&plazaFailures.length===0};
const railSamples=[];
for(const rail of state36.rails)for(const t of [.25,.5,.75]){
 const p=rail.a.map((v,i)=>v+(rail.b[i]-v)*t),barriers=S.volumes.filter(q=>q.engineering36&&q.id.includes(rail.name+'-barrier-'));
 const isolatedBlocked=Library17.blocked({...S,volumes:barriers,surfaces:[]},p[0],p[1],.42,p[2]);
 railSamples.push({name:rail.name,t,p:[p[0],p[2],p[1]],barriers:barriers.length,passed:barriers.length>0&&isolatedBlocked});
}
const railCollision={samples:railSamples.length,failures:railSamples.filter(q=>!q.passed),passed:railSamples.length>0&&railSamples.every(q=>q.passed)};
const pavingFailures=[];let pavingTriangles=0,pavingArea=0;
for(const m of state36.models)for(const q of m.geometry.filter(q=>q.kind==='quad'&&q.name.startsWith('paver-'))){
 // Exact fan triangles used by Engineering35.build for these convex pieces.
 for(let i=1;i<q.p.length-1;i++){
  const [a,b,c]=[q.p[0],q.p[i],q.p[i+1]],area=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;if(area<1e-8)continue;pavingTriangles++;pavingArea+=area;
  for(const[u,v]of [[1/3,1/3],[.8,.1],[.1,.8],[.1,.1]]){
   const p=[a[0]*u+b[0]*v+c[0]*(1-u-v),a[1]*u+b[1]*v+c[1]*(1-u-v)];
   if(!inPoly(...p,plaza))pavingFailures.push({name:q.name,triangle:i,p});
  }
 }
}
const plazaArea=Math.abs(plaza.reduce((sum,a,i)=>{const b=plaza[(i+1)%plaza.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2,pavingAreaError=Math.abs(pavingArea-plazaArea);
const pavingContainment={triangles:pavingTriangles,samplesPerTriangle:4,plazaArea,pavingTriangleArea:pavingArea,areaError:pavingAreaError,areaTolerance:1e-7,failures:pavingFailures,passed:pavingTriangles>0&&!pavingFailures.length&&pavingAreaError<1e-7};
const retiredIds=new Set([...state36.retired.volumes,...state36.retired.surfaces]);
const retiredRemnants=[...S.volumes,...S.surfaces].filter(q=>retiredIds.has(q.id)).map(q=>q.id);
const retirement={removedIds:retiredIds.size,remnants:retiredRemnants,passed:retiredIds.size>0&&!retiredRemnants.length};
const out={build:36,method:'WalkCore.move at 0.065 m increments, real 0.42 m radius ground controller; no flying/teleport within routes',routes,movement,renderedFloors,plazaSupport,railCollision,pavingContainment,retirement,preservation,ownership,layers,supplemental,rebuild,authoredPolygons,passed:plazaSupport.passed&&railCollision.passed&&pavingContainment.passed&&retirement.passed&&authoredPolygons.passed&&rebuild.passed&&movement.every(q=>q.passed)&&renderedFloors.passed&&preservation.every(q=>q.passed)&&ownership.every(q=>q.passed)&&layers.every(q=>q.passed)&&supplemental.passed};
fs.mkdirSync(path.join(root,'reports/build36'),{recursive:true});fs.writeFileSync(path.join(root,'reports/build36/movement.json'),JSON.stringify(out,null,2)+'\n');
fs.writeFileSync(path.join(root,'dist/data/qa36-routes.json'),JSON.stringify(routes.map(r=>({zone:r.name,road:'BUILD36',coords:r.coords,startFeet:r.startFeet,endFeet:r.endFeet})),null,2)+'\n');
console.log(JSON.stringify({passed:out.passed,movementPasses:movement.filter(q=>q.passed).length,movementTotal:movement.length,movementFailures:movement.filter(q=>!q.passed),renderedFloors,plazaSupport,railCollision,pavingContainment,retirement,preservationFailures:preservation.filter(q=>!q.passed),ownershipFailures:ownership.filter(q=>!q.passed),layers,supplemental:{passed:supplemental.passed,landings:landings.length,columnTests:columns.length,roofClearance:roofClearance.length,failures:[...landings,...columns,...roofClearance].filter(q=>!q.passed)},rebuild,authoredPolygons},null,2));
if(!out.passed)process.exitCode=1;
