/* BUILD34 regression: immutable BUILD33 ring, actual mesh, paint and controller.
 * Read-only except reports/build34/ring-regression.json. Internal road widths
 * are deliberately not invariants: BUILD34 is allowed to reorganize them.
 */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.resolve(__dirname,'..'),O=R+'/reports/build34';
const baseline=path.resolve(R,'../../work/baseline34/dist'),current=R+'/dist';
const quick=process.argv.includes('--quick'),read=p=>JSON.parse(fs.readFileSync(p));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function runtime(dir){const nav=read(dir+'/data/walk.json'),data=read(dir+'/data/campus.json');
 global.Library17=require(dir+'/library17');Library17.prepare(data,nav);
 require(dir+'/student22').prepare(data,nav);require(dir+'/landmarks30').prepare(data,nav);
 return{nav,W:require(dir+'/walk-core').create(data,nav),RR:require(dir+'/ring-road33')};
}
function paint(runtime){const meshes=[];
 class Mesh{constructor(name){this.name=name;meshes.push(this)}freezeWorldMatrix(){}}
 class VertexData{applyToMesh(m){m.p=this.positions;m.i=this.indices}static ComputeNormals(){}}
 const B={Mesh,VertexData,StandardMaterial:class{},Color3:{FromHexString:x=>x,Black:()=>0}};
 const summary=runtime.RR.build(B,{},runtime.nav.ring33,(x,z)=>runtime.W.terrain(x,z));
 return{summary,meshes};
}
function queries(spec,RR){const out=[];
 for(const [name,p,closed]of[['ring',spec.route,true],['approach',spec.approach,false]]){
  const A=RR.alignment(p,closed),n=Math.ceil(A.length/2);
  for(let i=0;i<=n;i++)for(const offset of[-7.42,0,7.42]){const q=A.at(i*A.length/n,offset);out.push({name,s:q.s,offset,x:q.x,z:q.z});}
 }return out;
}
function meshSamples(dir,qs){const meta=read(dir+'/data/ground.json'),vb=fs.readFileSync(dir+'/data/ground.bin'),ib=fs.readFileSync(dir+'/data/ground-indices.bin');
 const v=new Float32Array(vb.buffer,vb.byteOffset,vb.length/4),ix=new Uint32Array(ib.buffer,ib.byteOffset,ib.length/4);
 const cell=16,grid=new Map(),found=qs.map(()=>({count:0,y:0}));
 qs.forEach((p,i)=>{const key=Math.floor(p.x/cell)+','+Math.floor(p.z/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i)});
 let roadTriangles=0;
 for(const c of meta.chunks){if(c.kind!=='road')continue;
  for(let j=c.indexOffset;j<c.indexOffset+c.indexCount;j+=3){roadTriangles++;
   const a=c.offset+ix[j]*3,b=c.offset+ix[j+1]*3,d=c.offset+ix[j+2]*3;
   const ax=v[a],az=v[a+2],bx=v[b],bz=v[b+2],cx=v[d],cz=v[d+2];
   const xmin=Math.min(ax,bx,cx),xmax=Math.max(ax,bx,cx),zmin=Math.min(az,bz,cz),zmax=Math.max(az,bz,cz);
   const den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-10)continue;
   for(let gx=Math.floor(xmin/cell);gx<=Math.floor(xmax/cell);gx++)for(let gz=Math.floor(zmin/cell);gz<=Math.floor(zmax/cell);gz++)for(const k of grid.get(gx+','+gz)||[]){
    const p=qs[k];if(p.x<xmin-1e-5||p.x>xmax+1e-5||p.z<zmin-1e-5||p.z>zmax+1e-5)continue;
    const u=((bz-cz)*(p.x-cx)+(cx-bx)*(p.z-cz))/den,w=((cz-az)*(p.x-cx)+(ax-cx)*(p.z-cz))/den,t=1-u-w;
    if(u>=-1e-6&&w>=-1e-6&&t>=-1e-6){const y=u*v[a+1]+w*v[b+1]+t*v[d+1];found[k].y+=y;found[k].count++;}
   }
  }
 }
 for(const p of found)if(p.count)p.y/=p.count;
 return{found,roadTriangles,bytes:{ground:vb.length,indices:ib.length}};
}
const start=Date.now(),rawB=read(baseline+'/data/walk.json'),rawN=read(current+'/data/walk.json');
const invariantKeys=['version','units','carriageway','laneWidth','edgeMargin','laneOffsets','centerMark','laneMark','edgeMark','route','approach','orderedIds','length','attachments','junctions','profile','approachProfile','grade','surfaceReplacement'];
const changedRingFields=invariantKeys.filter(k=>JSON.stringify(rawB.ring33[k])!==JSON.stringify(rawN.ring33[k]));
const ids=rawB.ring33.orderedIds,roads=[];
for(const id of ids){const b=rawB.roads.find(r=>String(r.id)===String(id)),n=rawN.roads.find(r=>String(r.id)===String(id));
 const differences=['p','width','widthProfile32','ring33','ringOrder33','chainage33'].filter(k=>JSON.stringify(b?.[k])!==JSON.stringify(n?.[k]));
 roads.push({id,present:!!n,width:n?.width,profile:n?.widthProfile32,changed: differences});
}
const files=['ring-road33.js','data/ring-lanes33.json'].map(file=>({file,unchanged:hash(fs.readFileSync(baseline+'/'+file))===hash(fs.readFileSync(current+'/'+file))}));
function constants(dir){const s=fs.readFileSync(dir+'/walk-core.js','utf8');return{
 radius:/let radius=([\d.]+)/.exec(s)?.[1],substep:/Math\.ceil\(distance\/([\d.]+)\)/.exec(s)?.[1],
 heightThreshold:/Math\.abs\(nextFloor-feet\)>([\d.]+)/.exec(s)?.[1],feetOffset:/state\.y-([\d.]+)/.exec(s)?.[1]};}
const controller={baseline:constants(baseline),current:constants(current)};controller.unchanged=JSON.stringify(controller.baseline)===JSON.stringify(controller.current);
if(Object.values(controller.current).some(v=>v==null))throw Error('Movement constant audit could not locate a constant');
console.log('Sampling immutable baseline mesh and paint');
const old=runtime(baseline),qs=queries(rawB.ring33,old.RR),before=meshSamples(baseline,qs),oldPaint=paint(old);
console.log('Sampling candidate mesh and paint');
const now=runtime(current),after=meshSamples(current,qs),newPaint=paint(now),W=now.W,N=now.nav,A=now.RR.alignment(N.ring33.route,true);
const meshFailures=[],baselineMissing=[];let maxHeightDelta=0;
for(let i=0;i<qs.length;i++){const b=before.found[i],n=after.found[i];if(!b.count){baselineMissing.push(qs[i]);continue;}
 const delta=n.count?Math.abs(n.y-b.y):null;if(delta!=null)maxHeightDelta=Math.max(maxHeightDelta,delta);
 if(!n.count||delta>.002)meshFailures.push({...qs[i],baselineY:b.y,currentY:n.count?n.y:null,delta});
}
let maxPaintHeightDelta=0,paintCoordinateDifferences=0;const newMeshes=new Map(newPaint.meshes.map(m=>[m.name,m]));
for(const b of oldPaint.meshes){const n=newMeshes.get(b.name);if(!n||n.p.length!==b.p.length||JSON.stringify(n.i)!==JSON.stringify(b.i)){paintCoordinateDifferences++;continue;}
 for(let i=0;i<b.p.length;i++)if(i%3===1)maxPaintHeightDelta=Math.max(maxPaintHeightDelta,Math.abs(b.p[i]-n.p[i]));else if(Math.abs(b.p[i]-n.p[i])>1e-9)paintCoordinateDifferences++;
}
const paintCheck={before:oldPaint.summary,after:newPaint.summary,coordinateDifferences:paintCoordinateDifferences,maxHeightDelta:maxPaintHeightDelta,
 passed:JSON.stringify(oldPaint.summary)===JSON.stringify(newPaint.summary)&&!paintCoordinateDifferences&&maxPaintHeightDelta<.002};
const tests=[],skippedAttachments=[];
function walk(name,points,reverse=false,startFeet){const ps=reverse?points.slice().reverse():points;let s={x:ps[0][0],z:ps[0][1],y:(startFeet??W.terrain(...ps[0]))+.95},distance=0,maxStep=0,fail=null;
 for(let i=1;i<ps.length&&!fail;i++){let n=0;while(Math.hypot(ps[i][0]-s.x,ps[i][1]-s.z)>.02&&n++<5000){const dx=ps[i][0]-s.x,dz=ps[i][1]-s.z,len=Math.hypot(dx,dz),step=Math.min(.12,len),q=W.move(s,step*dx/len,step*dz/len);
   if(q.distance<step*.1){fail={segment:i,at:[s.x,s.y-.95,s.z],next:ps[i],reason:'blocked'};break;}maxStep=Math.max(maxStep,Math.abs(q.y-s.y));distance+=q.distance;s=q;
  }if(n>=5000)fail={segment:i,reason:'timeout'};
 }const result={name,reverse,distance,maxStep,end:[s.x,s.y-.95,s.z],passed:!fail,fail};tests.push(result);console.log(name,reverse,result.passed,distance.toFixed(1),fail||'');return result;
}
if(!quick){for(const offset of[0,-4.95,-1.65,1.65,4.95]){const points=[];for(let i=0;i<=Math.ceil(A.length/2);i++){const p=A.at(i*A.length/Math.ceil(A.length/2),offset);points.push([p.x,p.z]);}for(const rev of[false,true])walk('ring '+offset,points,rev);}
 for(const rev of[false,true])walk('gate approach',N.ring33.approach.concat(N.ring33.route.slice(1,80)),rev);
 for(const a of N.ring33.attachments){const r=N.roads.find(r=>r.id===a.road),i=r?.p.findIndex(p=>Math.hypot(p[0]-a.after[0],p[1]-a.after[1])<.01);
  if(!r||i<0){skippedAttachments.push({id:a.road,reason:'Internal branch replaced or attachment vertex changed; verify via BUILD34 routes'});continue;}
  for(const next of[r.p[i-1],r.p[i+1]]){if(!next)continue;const d=Math.hypot(next[0]-a.after[0],next[1]-a.after[1]);if(d<1e-6)continue;const len=Math.min(d,15),p=[a.after[0]+(next[0]-a.after[0])*len/d,a.after[1]+(next[1]-a.after[1])*len/d];for(const rev of[false,true])walk('branch '+a.road,[p,a.after],rev);}
 }
}
let minRadius=Infinity,maxSlope=0;for(let s=0;s<A.length;s+=.5){const a=A.at(s-.5),b=A.at(s+.5),angle=Math.acos(Math.max(-1,Math.min(1,a.tx*b.tx+a.tz*b.tz)));minRadius=Math.min(minRadius,1/(angle||1e-10));maxSlope=Math.max(maxSlope,Math.abs(W.terrain(b.x,b.z)-W.terrain(a.x,a.z))/Math.hypot(b.x-a.x,b.z-a.z));}
const dataPassed=!changedRingFields.length&&files.every(f=>f.unchanged)&&roads.length===21&&roads.every(r=>r.present&&r.width===15&&r.profile?.every(p=>p[1]===15)&&!r.changed.length)&&controller.unchanged;
const geometryPassed=!meshFailures.length&&paintCheck.passed;
const report={baseline:'Immutable work/baseline34/dist (BUILD33)',mode:quick?'geometry only; walking NOT RUN':'full ring both directions',
 data:{passed:dataPassed,changedRingFields,files,roads,controller,carriageway:N.ring33.carriageway,composition:[.9,3.3,3.3,3.3,3.3,.9],note:'Nonring width changes are intentional and not asserted'},
 mesh:{samples:qs.length,beforeTriangles:before.roadTriangles,afterTriangles:after.roadTriangles,maxHeightDelta,failed:meshFailures.length,failures:meshFailures.slice(0,100),baselineUncovered:baselineMissing.length,baselineUncoveredExamples:baselineMissing.slice(0,20),bytes:after.bytes},
 paint:paintCheck,minCenterRadius:minRadius,maxGrade:maxSlope,tests,skippedAttachments,
 geometryPassed,walkingPassed:quick?null:tests.length>=12&&tests.every(t=>t.passed),
 passed:dataPassed&&geometryPassed&&!quick&&tests.length>=12&&tests.every(t=>t.passed),elapsedSeconds:(Date.now()-start)/1000};
fs.mkdirSync(O,{recursive:true});fs.writeFileSync(O+'/ring-regression'+(quick?'-geometry':'')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,dataPassed,geometryPassed,walkingPassed:report.walkingPassed,meshFailures:meshFailures.length,tests:tests.length,failed:tests.filter(t=>!t.passed),seconds:report.elapsedSeconds}));
if(!dataPassed||!geometryPassed||(!quick&&!report.walkingPassed))process.exitCode=1;
