// Apply the runtime terrain field only to BUILD34's explicitly selected area.
// Never sample floorAt: roofs, bridges and ground retain their separate floors.
const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..'),O=R+'/reports/build34',args=process.argv.slice(2);
const write=args.includes('--write'),onlyCheck=args.includes('--check');
const data=JSON.parse(fs.readFileSync(R+'/dist/data/campus.json'));
const nav=JSON.parse(fs.readFileSync(R+'/dist/data/walk.json'));
global.Library17=require(R+'/dist/library17');Library17.prepare(data,nav);
require(R+'/dist/student22').prepare(data,nav);require(R+'/dist/landmarks30').prepare(data,nav);
const W=require(R+'/dist/walk-core').create(data,nav);
const buffer=fs.readFileSync(R+'/dist/data/ground.bin');
const vertices=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.length/4);
const selectedBuffer=fs.readFileSync(O+'/mesh-changed-vertices.bin');
const selected=new Uint32Array(selectedBuffer.buffer,selectedBuffer.byteOffset,selectedBuffer.length/4);
const selectedMask=new Uint8Array(vertices.length/3);
let maxChange=0,totalChange=0,changed=0;
for(const id of selected){
  if(id*3+2>=vertices.length)throw new Error('Changed-vertex manifest does not match terrain mesh');
  selectedMask[id]=1;
  const i=id*3,y=W.terrain(vertices[i],vertices[i+2]);
  if(!Number.isFinite(y))throw new Error('Nonfinite terrain height at vertex '+id);
  const delta=Math.abs(y-vertices[i+1]);maxChange=Math.max(maxChange,delta);totalChange+=delta;
  if(delta>1e-5)changed++;
  if(!onlyCheck)vertices[i+1]=y;
}
const meta=JSON.parse(fs.readFileSync(R+'/dist/data/ground.json'));
const indexBuffer=fs.readFileSync(R+'/dist/data/ground-indices.bin');
const indices=new Uint32Array(indexBuffer.buffer,indexBuffer.byteOffset,indexBuffer.length/4);
let candidates=0;
for(const c of meta.chunks){const base=c.offset/3;for(let j=c.indexOffset;j<c.indexOffset+c.indexCount;j+=3){
  if(selectedMask[base+indices[j]]||selectedMask[base+indices[j+1]]||selectedMask[base+indices[j+2]])candidates++;
}}
const stride=Math.max(1,Math.floor(candidates/12000));
let cursor=0,samples=0,maxError=0;const worst=[];
for(const c of meta.chunks){const base=c.offset/3;for(let j=c.indexOffset;j<c.indexOffset+c.indexCount;j+=3){
  const a=base+indices[j],b=base+indices[j+1],d=base+indices[j+2];
  if(!selectedMask[a]&&!selectedMask[b]&&!selectedMask[d])continue;
  if(cursor++%stride)continue;
  const x=(vertices[a*3]+vertices[b*3]+vertices[d*3])/3;
  const z=(vertices[a*3+2]+vertices[b*3+2]+vertices[d*3+2])/3;
  const mesh=(vertices[a*3+1]+vertices[b*3+1]+vertices[d*3+1])/3;
  const floor=W.terrain(x,z),error=Math.abs(mesh-floor);samples++;
  maxError=Math.max(maxError,error);
  if(worst.length<20||error>worst[worst.length-1].error){worst.push({x,z,mesh,floor,error});worst.sort((p,q)=>q.error-p.error);worst.length=Math.min(worst.length,20);}
}}
const report={write,check:onlyCheck,selectedVertices:selected.length,verticesAdjusted:changed,
  maxVertexAdjustment:maxChange,meanVertexAdjustment:totalChange/Math.max(1,selected.length),
  centroidSamples:samples,centroidCandidates:candidates,maxRenderTerrainDifference:maxError,worst,
  sampler:'WalkCore.terrain, restricted to material coverage or explicit gradeAreas',
  note:'Centroid error measures triangulation approximation separately from vertex agreement. Architectural floors are excluded.'};
if(write&&!onlyCheck){
  const temp=R+'/dist/data/ground.bin.build34.tmp';fs.writeFileSync(temp,buffer);fs.renameSync(temp,R+'/dist/data/ground.bin');
}
fs.writeFileSync(O+'/mesh-grade.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
