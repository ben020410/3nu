/* Static acceleration only: identical vertices, materials, triangle tests and quality. */
(function(root){
function buildTree(positions,indices,indexStart,indexCount){
 const count=indexCount/3,order=Array.from({length:count},(_,i)=>i),bounds=new Float32Array(count*6),centers=new Float32Array(count*3);
 for(let t=0;t<count;t++)for(let a=0;a<3;a++){let min=Infinity,max=-Infinity;for(let j=0;j<3;j++){const v=positions[indices[indexStart+t*3+j]*3+a];min=Math.min(min,v);max=Math.max(max,v);}bounds[t*6+a]=min;bounds[t*6+a+3]=max;centers[t*3+a]=(min+max)*.5;}
 const nodes=[];function build(start,end){const id=nodes.length,n=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity,start,end,-1,-1];nodes.push(n);for(let j=start;j<end;j++)for(let a=0;a<3;a++){n[a]=Math.min(n[a],bounds[order[j]*6+a]);n[a+3]=Math.max(n[a+3],bounds[order[j]*6+a+3]);}if(end-start>24){let axis=0;for(let a=1;a<3;a++)if(n[a+3]-n[a]>n[axis+3]-n[axis])axis=a;const sorted=order.slice(start,end).sort((a,b)=>centers[a*3+axis]-centers[b*3+axis]);for(let i=0;i<sorted.length;i++)order[start+i]=sorted[i];const mid=(start+end)>>1;n[8]=build(start,mid);n[9]=build(mid,end);}return id;}build(0,count);
 return {flat:new Float64Array(nodes.flat()),ids:new Uint32Array(order)};
}
function accelerate(B,scene){
 const started=performance.now(),records=[],stats={submeshes:0,triangles:0,nodes:0,bytes:0,buildMs:0};let enabled=true;
 for(const mesh of scene.meshes){if(!mesh.name.includes('-gwanjeong37-')||mesh.skeleton||mesh.morphTargetManager||mesh.hasThinInstances||mesh.getTotalIndices()<6144||!mesh.isWorldMatrixFrozen)continue;
 const positions=mesh.getVerticesData(B.VertexBuffer.PositionKind),indices=mesh.getIndices();if(!positions||!indices)continue;
 for(const sub of mesh.subMeshes||[]){if(sub.indexCount<6144||sub.getMaterial()?.fillMode!==0)continue;
 const {flat,ids}=buildTree(positions,indices,sub.indexStart,sub.indexCount),native=sub.intersects;

 // Babylon still performs mesh bounds, ray transforms and final PickingInfo assembly.
 // Unsupported modes/predicates/fastCheck retain the exact native path.
 sub.intersects=function(ray,points,ix,fastCheck,predicate){if(!enabled||fastCheck||predicate||this.getMaterial()?.fillMode!==0)return native.call(this,ray,points,ix,fastCheck,predicate);
 let hit=null,bestFace=Infinity;const stack=[0],origin=[ray.origin.x,ray.origin.y,ray.origin.z],direction=[ray.direction.x,ray.direction.y,ray.direction.z];
 while(stack.length){const n=stack.pop()*10;let lo=0,hi=hit?hit.distance:ray.length;for(let a=0;a<3&&lo<=hi;a++){if(Math.abs(direction[a])<1e-15){if(origin[a]<flat[n+a]-.01||origin[a]>flat[n+a+3]+.01){lo=Infinity;break;}}else{let x=(flat[n+a]-.01-origin[a])/direction[a],y=(flat[n+a+3]+.01-origin[a])/direction[a];if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);}}if(lo>hi)continue;
 if(flat[n+8]>=0){stack.push(flat[n+8],flat[n+9]);continue;}
 for(let j=flat[n+6];j<flat[n+7];j++){const face=ids[j],i=this.indexStart+face*3,h=ray.intersectsTriangle(points[ix[i]],points[ix[i+1]],points[ix[i+2]]);if(h&&(!hit||h.distance<hit.distance||h.distance===hit.distance&&face<bestFace)){hit=h;bestFace=face;hit.faceId=face;}}
 }return hit;};records.push({sub,native});stats.submeshes++;stats.triangles+=ids.length;stats.nodes+=flat.length/10;stats.bytes+=flat.byteLength+ids.byteLength;
 }}stats.buildMs=performance.now()-started;
 const dispose=()=>{for(const r of records)r.sub.intersects=r.native;records.length=0;};scene.onDisposeObservable.addOnce(dispose);
 function compare(rays,predicate){const errors=[];let maxDistanceError=0;for(const ray of rays){enabled=false;const a=scene.pickWithRay(ray,predicate);enabled=true;const b=scene.pickWithRay(ray,predicate);const delta=a?.hit&&b?.hit?Math.abs(a.distance-b.distance):0;maxDistanceError=Math.max(maxDistanceError,delta);if(!!a?.hit!==!!b?.hit||a?.hit&&(a.pickedMesh!==b.pickedMesh||delta>1e-6||a.faceId!==b.faceId))errors.push({a:a?.pickedMesh?.name,b:b?.pickedMesh?.name,delta,faces:[a?.faceId,b?.faceId]});}return {rays:rays.length,passed:errors.length===0,maxDistanceError,errors,stats};}
 if(new URLSearchParams(location.search).has('profile38')){const box=document.createElement('details');box.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99;background:white;max-width:500px';box.innerHTML='<summary>정밀 충돌 비교</summary><button>원본 교차 검사 비교</button><pre id="ray38audit"></pre>';document.body.append(box);box.querySelector('button').onclick=()=>{const rays=[];let seed=38;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);for(const {sub}of records){const box=sub.getMesh().getBoundingInfo().boundingBox,c=box.centerWorld,e=box.extendSizeWorld;for(let i=0;i<6;i++){const from=c.add(new B.Vector3((rnd()-.5)*Math.max(e.x,20)*5,(rnd()-.5)*Math.max(e.y,20)*5,(rnd()-.5)*Math.max(e.z,20)*5)),to=c.add(new B.Vector3((rnd()-.5)*e.x,(rnd()-.5)*e.y,(rnd()-.5)*e.z)),d=to.subtract(from);rays.push(new B.Ray(from,d.normalize(),1000));}}box.querySelector('pre').textContent=JSON.stringify(compare(rays,m=>m.isEnabled()&&m.isVisible&&m.isPickable));};}
 return {stats,compare,dispose};
}
root.Optimize38={accelerate};if(typeof module==='object')module.exports=root.Optimize38;
})(typeof window==='object'?window:globalThis);
