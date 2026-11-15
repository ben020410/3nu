/* BUILD36 static vehicle envelope QA. No vehicle service is implemented here.
 * All dimensions and clearances are game implementation criteria, not surveyed
 * dimensions or a claim of compliance with traffic/building regulations. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),baseline=path.resolve(root,'../work/build36/baseline35');
const vehicle={length:12,width:2.55,height:3.4,units:'metres',source:'explicit temporary game bus envelope; no existing bus asset'};
const criteria={minimumClearHeight:4.15,minimumBusRoofMargin:.75,carriagewayWidth:15,laneWidth:3.3,poseSpacing:.20,footprintBoundarySampling:.5,tolerance:.00002};
const window={minX:-45,maxX:45,minZ:-1020,maxZ:-910},eps=1e-8;
const read=(dir,p)=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8'));
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function pointSegment(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(pointSegment(p,a,b)<eps)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function intersectsSegment(a,b,c,d){if(Math.max(a[0],b[0])+eps<Math.min(c[0],d[0])||Math.max(c[0],d[0])+eps<Math.min(a[0],b[0])||Math.max(a[1],b[1])+eps<Math.min(c[1],d[1])||Math.max(c[1],d[1])+eps<Math.min(a[1],b[1]))return false;return cross(a,b,c)*cross(a,b,d)<=eps&&cross(c,d,a)*cross(c,d,b)<=eps;}
function intersects(a,b){if(a.some(p=>inside(p,b))||b.some(p=>inside(p,a)))return true;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(intersectsSegment(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;return false;}
function distance(a,b){if(intersects(a,b))return 0;let best=Infinity;for(const p of a)for(let j=0;j<b.length;j++)best=Math.min(best,pointSegment(p,b[j],b[(j+1)%b.length]));for(const p of b)for(let j=0;j<a.length;j++)best=Math.min(best,pointSegment(p,a[j],a[(j+1)%a.length]));return best;}
function hull(points){const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lo=[],hi=[];for(const q of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=eps)lo.pop();lo.push(q);}for(const q of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=eps)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const bbox=p=>({minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minZ:Math.min(...p.map(v=>v[1])),maxZ:Math.max(...p.map(v=>v[1]))});
const overlap=(a,b)=>a.minX<=b.maxX&&a.maxX>=b.minX&&a.minZ<=b.maxZ&&a.maxZ>=b.minZ;
function load(dir,build){
 const D=read(dir,'dist/data/campus.json'),N=read(dir,'dist/data/walk.json');
 global.Library17=require(path.join(dir,'dist/library17.js'));Library17.prepare(D,N);require(path.join(dir,'dist/student22.js')).prepare(D,N);
 const E=require(path.join(dir,'dist/engineering35.js')),state35=E.prepare(D,N);
 const state36=build===36?require(path.join(dir,'dist/engineering36.js')).prepare(D,N):null;
 require(path.join(dir,'dist/landmarks30.js')).prepare(D,N);
 return {dir,D,N,states:[state35,state36].filter(Boolean),state35,state36,G:state35.ground};
}
function obstacles(scene){
 const out=[],G=scene.G,add=(id,p,lo,hi,source,holes=[])=>{if(p.length<3||hi<G+.02||lo>G+6)return;const bounds=bbox(p);if(!overlap(bounds,window))return;out.push({id,p,lo,hi,source,holes,bounds});};
 for(const q of scene.N.landmarks30.volumes)add(q.id,q.p,q.lo,q.hi,q.hidden?'collision-volume':'rendered-landmark-slab',q.holes||[]);
 // Existing landmark stairs render closed sides down to foundation29.
 for(const q of scene.N.landmarks30.surfaces)if(q.from&&!q.engineering35){const a=q.from,b=q.to,dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),w=Math.hypot(q.p[0][0]-q.p[1][0],q.p[0][1]-q.p[1][1]),nx=-dz/l*w/2,nz=dx/l*w/2;for(let i=0;i<q.steps;i++){const aa=[a[0]+dx*i/q.steps,a[1]+dz*i/q.steps],bb=[a[0]+dx*(i+1)/q.steps,a[1]+dz*(i+1)/q.steps];add(q.id+'-step-'+i,[[aa[0]+nx,aa[1]+nz],[aa[0]-nx,aa[1]-nz],[bb[0]-nx,bb[1]-nz],[bb[0]+nx,bb[1]+nz]],q.foundation29,q.lo+(q.hi-q.lo)*(i+1)/q.steps,'rendered-landmark-stair');}}
 const renderedModels=new Map();for(const st of scene.states)for(const m of st.models||[])if(!renderedModels.has(m))renderedModels.set(m,st.build);
 for(const [m,build]of renderedModels)for(const q of m.geometry||[]){
  const id='render-'+build+'-'+m.number+'-'+q.name,s=m.fit.scale,world=m.world;
  if(q.kind==='slab'||q.kind==='cylinder'){const p=q.kind==='slab'?q.p:Array.from({length:16},(_,i)=>[q.x+Math.cos(i*Math.PI/8)*q.r,q.y+Math.sin(i*Math.PI/8)*q.r]);add(id,p.map(v=>{const w=world([...v,0]);return[w[0],w[2]];}),m.fit.datum+s*q.lo,m.fit.datum+s*q.hi,'authored-render-'+q.kind);}
  else if(q.kind==='beam'){
   const a=world(q.a),b=world(q.b),d=b.map((v,i)=>v-a[i]),l=Math.hypot(...d);if(l<eps)continue;
   const n=d.map(v=>v/l),ref=Math.abs(n[1])>.9?[1,0,0]:[0,1,0],cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],r0=cross3(n,ref),rl=Math.hypot(...r0),r=r0.map(v=>v/rl*q.width*s/2),t=cross3(n,r),v=[];
   for(const p of[a,b])for(const[x,y]of[[-1,-1],[1,-1],[1,1],[-1,1]])v.push(p.map((c,i)=>c+x*r[i]+y*t[i]));
   add(id,hull(v.map(p=>[p[0],p[2]])),Math.min(...v.map(p=>p[1])),Math.max(...v.map(p=>p[1])),'authored-render-beam');
  }else if(q.kind==='stair'){
   const dx=q.b[0]-q.a[0],dz=q.b[1]-q.a[1],l=Math.hypot(dx,dz),nx=-dz/l*q.width/2,nz=dx/l*q.width/2;
   for(let i=0;i<q.steps;i++){const a=[q.a[0]+dx*i/q.steps,q.a[1]+dz*i/q.steps],b=[q.a[0]+dx*(i+1)/q.steps,q.a[1]+dz*(i+1)/q.steps],p=[[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz]];add(id+'-step-'+i,p.map(v=>{const w=world([...v,0]);return[w[0],w[2]];}),m.fit.datum+Math.min(q.lo,q.hi)*s-.3,m.fit.datum+(q.lo+(q.hi-q.lo)*(i+1)/q.steps)*s,'authored-render-stair');}
  }else if(q.kind==='quad'){const v=q.p.map(world),p=hull(v.map(v=>[v[0],v[2]]));add(id,p,Math.min(...v.map(p=>p[1])),Math.max(...v.map(p=>p[1])),'authored-render-quad');}
 }
 return out;
}
function groundSampler(dir){
 const meta=read(dir,'dist/data/ground.json'),gb=fs.readFileSync(path.join(dir,'dist/data/ground.bin')),ib=fs.readFileSync(path.join(dir,'dist/data/ground-indices.bin'));
 const g=new Float32Array(gb.buffer,gb.byteOffset,gb.byteLength/4),ix=new Uint32Array(ib.buffer,ib.byteOffset,ib.byteLength/4),grid=new Map();
 for(const c of meta.chunks){if(c.kind!=='road')continue;for(let i=c.indexOffset;i<c.indexOffset+c.indexCount;i+=3){const p=[ix[i],ix[i+1],ix[i+2]].map(j=>{const o=c.offset+j*3;return[g[o],g[o+1],g[o+2]];}),b=bbox(p.map(v=>[v[0],v[2]]));if(!overlap(b,window))continue;for(let x=Math.floor(b.minX/5);x<=Math.floor(b.maxX/5);x++)for(let z=Math.floor(b.minZ/5);z<=Math.floor(b.maxZ/5);z++){const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(p);}}}
 return(x,z)=>{let y=null;for(const[a,b,c]of grid.get(Math.floor(x/5)+','+Math.floor(z/5))||[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<eps)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7){const h=u*a[1]+v*b[1]+(1-u-v)*c[1];y=y===null?h:Math.max(y,h);}}return y;};
}
function poses(route,offset){const a=route.filter(p=>p[0]>-40&&p[1]>-1030&&p[1]<-900),poses=[];for(let i=1;i<a.length;i++){const p=a[i-1],q=a[i],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);if(len>10)continue;const n=Math.ceil(len/criteria.poseSpacing);for(let j=0;j<n;j++){const t=j/n,x=p[0]+dx*t,z=p[1]+dz*t;if(z<-1012||z>-918)continue;const tx=dx/len,tz=dz/len,c=[x-tz*offset,z+tx*offset],poly=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([l,w])=>[c[0]+l*tx*vehicle.length/2-w*tz*vehicle.width/2,c[1]+l*tz*vehicle.length/2+w*tx*vehicle.width/2]);poses.push({center:c,heading:[tx,tz],poly,bounds:bbox(poly)});}}return poses;}
function boundary(poly){const p=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/criteria.footprintBoundarySampling);for(let j=0;j<n;j++)p.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}return p;}
function run(scene){
 const all=obstacles(scene),terrain=groundSampler(scene.dir),ring=scene.N.ring33,centerline=ring.route.filter(p=>p[0]>-40&&p[1]>-1040&&p[1]<-890),lanes=[];
 const supports=all.filter(q=>/pier|column/.test(q.id)&&q.lo<scene.G+.5&&q.hi>scene.G+3).map(q=>{let d=Infinity;for(let i=1;i<centerline.length;i++)d=Math.min(d,distance(q.p,[centerline[i-1],centerline[i]]));return{id:q.id,source:q.source,minimumCarriagewayEdgeMargin:d-ring.carriageway/2,passed:d>=ring.carriageway/2};});
 for(const offset of ring.laneOffsets){let minimumClearHeight=Infinity,minimumRoadEdgeMargin=Infinity,minimumObstacleLateralMargin=Infinity,roadYMin=Infinity,roadYMax=-Infinity,underdeckPoses=0,minimumClearHeightAt=null,minimumRoadEdgeAt=null,minimumObstacleLateralAt=null;const collisionIds=new Map(),roadMissing=[],ps=poses(ring.route,offset);
  for(const pose of ps){const points=[pose.center,...boundary(pose.poly)],ground=points.map(p=>terrain(...p)),valid=ground.filter(y=>y!==null);if(valid.length!==points.length&&roadMissing.length<5)roadMissing.push({center:pose.center,missing:ground.filter(y=>y===null).length});if(!valid.length)continue;const floor=Math.max(...valid),roof=floor+vehicle.height;roadYMin=Math.min(roadYMin,...valid);roadYMax=Math.max(roadYMax,...valid);
   for(const p of points){let dist=Infinity;for(let i=1;i<centerline.length;i++)dist=Math.min(dist,pointSegment(p,centerline[i-1],centerline[i]));const margin=ring.carriageway/2-dist;if(margin<minimumRoadEdgeMargin){minimumRoadEdgeMargin=margin;minimumRoadEdgeAt={center:pose.center,boundaryPoint:p};}}
   let overhead=false;
   for(const q of all){if(q.hi<=floor+.015)continue;const intersect=overlap(pose.bounds,q.bounds)&&intersects(pose.poly,q.p)&&!q.holes.some(h=>pose.poly.every(p=>inside(p,h)));
    if(q.lo>=floor+.015){if(intersect){overhead=true;const height=q.lo-floor;if(height<minimumClearHeight){minimumClearHeight=height;minimumClearHeightAt={center:pose.center,heading:pose.heading,footprint:pose.poly,obstacle:q.id,source:q.source,roadY:floor,undersideY:q.lo};}}}
    if(q.lo<roof-eps&&q.hi>floor+.015){const d=distance(pose.poly,q.p);if(d<minimumObstacleLateralMargin){minimumObstacleLateralMargin=d;minimumObstacleLateralAt={center:pose.center,obstacle:q.id,source:q.source};}if(intersect){const key=q.id+'|'+q.source;if(!collisionIds.has(key))collisionIds.set(key,{id:q.id,source:q.source,firstCenter:pose.center,lo:q.lo,hi:q.hi});}}
   }
   if(overhead)underdeckPoses++;
  }
  const collisions=[...collisionIds.values()],minRoof=minimumClearHeight-vehicle.height;
  lanes.push({laneOffset:offset,poses:ps.length,underdeckPoses,roadSurfaceYRange:[roadYMin,roadYMax],minimumClearHeight,minimumBusRoofMargin:minRoof,minimumClearHeightAt,minimumRoadEdgeMargin,minimumRoadEdgeAt,minimumObstacleLateralMargin,minimumObstacleLateralAt,collisions,missingRenderedRoad:roadMissing,passed:ps.length>0&&underdeckPoses>0&&!collisions.length&&!roadMissing.length&&minimumClearHeight>=criteria.minimumClearHeight-criteria.tolerance&&minRoof>=criteria.minimumBusRoofMargin-criteria.tolerance&&minimumRoadEdgeMargin>=0});
 }
 return {build:scene.state36?36:35,obstacles:all.length,supports,lanes,poses:lanes.reduce((s,q)=>s+q.poses,0),minimumClearHeight:Math.min(...lanes.map(q=>q.minimumClearHeight)),minimumBusRoofMargin:Math.min(...lanes.map(q=>q.minimumBusRoofMargin)),minimumRoadEdgeMargin:Math.min(...lanes.map(q=>q.minimumRoadEdgeMargin)),minimumObstacleLateralMargin:Math.min(...lanes.map(q=>q.minimumObstacleLateralMargin)),passed:lanes.every(q=>q.passed)&&supports.length>0&&supports.every(q=>q.passed)};
}
const beforeScene=load(baseline,35),before=run(beforeScene),available=fs.existsSync(path.join(root,'dist/engineering36.js'));
const currentScene=available?load(root,36):null,current=currentScene?run(currentScene):null;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const preservation=['ground.json','ground.bin','ground-indices.bin','ring-lanes33.json'].map(file=>({file,sha256:hash(path.join(root,'dist/data',file)),passed:hash(path.join(root,'dist/data',file))===hash(path.join(baseline,'dist/data',file))}));
const raw=read(root,'dist/data/walk.json'),old=read(baseline,'dist/data/walk.json');
preservation.push({file:'walk.json:ring33',passed:JSON.stringify(raw.ring33)===JSON.stringify(old.ring33)&&raw.ring33.carriageway===15&&raw.ring33.laneOffsets.length===4&&raw.ring33.laneWidth===3.3});
if(currentScene)preservation.push({file:'runtime:ring33',passed:JSON.stringify(currentScene.N.ring33)===JSON.stringify(beforeScene.N.ring33)});
const report={build:36,generatedAt:new Date().toISOString(),scope:'Static geometric bus envelope validation for the shared engineering plaza; no bus operation feature',units:'one world unit = one metre',basis:'Game implementation values only. This is not a site survey or a regulatory compliance assessment.',vehicle,criteria,method:['12 × 2.55 m oriented footprint swept at ≤0.20 m spacing along each original ring-road lane centerline; both travel directions have the same rectangular envelope.','Polygon edge intersection and containment test full vehicle footprints against collision volumes plus exact rendered authored slab, beam, cylinder and stair primitive descriptions. Beam footprints include their true square cross-section.','Rendered road ground.bin triangles sampled barycentrically beneath the center and footprint boundary at ≤0.5 m spacing; maximum sampled surface used for the roof elevation.','Road edge margin uses the original 15 m carriageway boundary; tests the complete bus boundary including corners through the curve.'],roadWindow:window,preservation,before,current,clearHeightImprovement:current?current.minimumClearHeight-before.minimumClearHeight:null,status:current?'verified':'waiting-for-engineering36',passed:!!current&&current.passed&&preservation.every(q=>q.passed)};
fs.mkdirSync(path.join(root,'reports/build36'),{recursive:true});fs.writeFileSync(path.join(root,'reports/build36/vehicle.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,passed:report.passed,before:{minimumClearHeight:before.minimumClearHeight,minimumBusRoofMargin:before.minimumBusRoofMargin,lanes:before.lanes.map(q=>({offset:q.laneOffset,collisions:q.collisions.map(q=>q.id),minimumRoadEdgeMargin:q.minimumRoadEdgeMargin,missingRoad:q.missingRenderedRoad.length}))},current:current&&{minimumClearHeight:current.minimumClearHeight,minimumBusRoofMargin:current.minimumBusRoofMargin,minimumRoadEdgeMargin:current.minimumRoadEdgeMargin,minimumObstacleLateralMargin:current.minimumObstacleLateralMargin,lanes:current.lanes.map(q=>({offset:q.laneOffset,passed:q.passed,minimumClearHeight:q.minimumClearHeight,minimumObstacleLateralAt:q.minimumObstacleLateralAt,collisions:q.collisions.slice(0,8),missingRoad:q.missingRenderedRoad}))}},null,2));
if(current&&!report.passed)process.exitCode=1;
