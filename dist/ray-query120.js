/* Broad phase for the three campus camera/flight/name-occlusion queries only.
 * Native mesh triangle intersection, predicates, world transforms and tie order
 * remain unchanged. Rendering distance never owns collision candidates.
 * New/removed meshes are tracked. Ordinary moving meshes use current transforms;
 * thin instances/skinned geometry retain native scene picking.
 * Call invalidate() when editing a frozen building/terrain geometry at runtime. */
function createCampusRayQuery120(B,scene){
 const size=64,grid=new Map(),records=new Map(),wide=new Set(),dynamic=new Set(),pending=new Set();let ranks=new Map(),rankDirty=true,disposed=false,knownCount=scene.meshes.length;
 const native=(ray,predicate)=>scene.pickWithRay(ray,predicate),inverse=B.Matrix.Identity(),local=B.Ray.Zero();
 const physical=m=>m.name.startsWith('building-')||m.name.startsWith('roof-')||m.name.startsWith('terrain-')||m.name.startsWith('gate-')||m.metadata?.solid15||m.metadata?.facilityId==='snubear';
 const stats={queries:0,candidates:0,triangleMeshes:0,fallbacks:0,staticMeshes:0,dynamicMeshes:0,dynamicDirect125:0,dynamicNative125:0};
 function remove(m){const r=records.get(m);if(r){for(const key of r.cells){const bucket=grid.get(key);bucket?.delete(r);if(!bucket?.size)grid.delete(key);}wide.delete(r);records.delete(m);}dynamic.delete(m);}
 function register(m){remove(m);if(m.isDisposed()||!physical(m))return;
  if(!m.isWorldMatrixFrozen||m.hasThinInstances||m.skeleton||m.morphTargetManager||m.getClassName()!=='Mesh'||m.getVerticesDataKinds().some(k=>m.getVertexBuffer(k)?.isUpdatable())){dynamic.add(m);return;}
  const b=m.getBoundingInfo().boundingBox,r={mesh:m,min:b.minimumWorld.clone(),max:b.maximumWorld.clone(),cells:[]};records.set(m,r);
  const x0=Math.floor(r.min.x/size),x1=Math.floor(r.max.x/size),z0=Math.floor(r.min.z/size),z1=Math.floor(r.max.z/size);
  if(![x0,x1,z0,z1].every(Number.isFinite)||(x1-x0+1)*(z1-z0+1)>256){wide.add(r);return;}
  for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){const key=x+','+z;r.cells.push(key);if(!grid.has(key))grid.set(key,new Set());grid.get(key).add(r);}
 }
 function flush(){if(scene.meshes.length!==knownCount){for(let i=Math.min(knownCount,scene.meshes.length);i<scene.meshes.length;i++)pending.add(scene.meshes[i]);knownCount=scene.meshes.length;rankDirty=true;}for(const m of pending)register(m);pending.clear();if(rankDirty){ranks=new Map(scene.meshes.map((m,i)=>[m,i]));rankDirty=false;}stats.staticMeshes=records.size;stats.dynamicMeshes=dynamic.size;}
 for(const m of scene.meshes)register(m);flush();
 const added=scene.onNewMeshAddedObservable.add(m=>{pending.add(m);rankDirty=true;}),removed=scene.onMeshRemovedObservable.add(m=>{pending.delete(m);remove(m);rankDirty=true;});
 // Epsilon is deliberately conservative: it can include extra meshes, never trim a hit.
 function overlaps(ray,r){let lo=0,hi=ray.length;for(const a of ['x','y','z']){const d=ray.direction[a],o=ray.origin[a],min=r.min[a]-.02,max=r.max[a]+.02;if(Math.abs(d)<1e-15){if(o<min||o>max)return false;}else{let t0=(min-o)/d,t1=(max-o)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;}}return true;}
 function pick(ray,predicate){
  if(disposed||!Number.isFinite(ray.length)||ray.length<0||ray.length>256||Math.abs(ray.direction.lengthSquared()-1)>1e-6||scene.activeCameras?.length>1){stats.fallbacks++;return native(ray,predicate);}
  flush();stats.queries++;const end=ray.origin.add(ray.direction.scale(ray.length)),found=new Set(wide);
  for(let x=Math.floor((Math.min(ray.origin.x,end.x)-.02)/size);x<=Math.floor((Math.max(ray.origin.x,end.x)+.02)/size);x++)for(let z=Math.floor((Math.min(ray.origin.z,end.z)-.02)/size);z<=Math.floor((Math.max(ray.origin.z,end.z)+.02)/size);z++)for(const r of grid.get(x+','+z)||[])found.add(r);
  const list=[];for(const r of found)if(!r.mesh.isDisposed()&&predicate(r.mesh,-1)&&overlaps(ray,r))list.push(r.mesh);
  // Ordinary dynamic meshes use the same triangle test and current matrix. Unsupported geometry stays native.
  let best=null;const nativeDynamic=[];
  for(const m of dynamic){if(m.isDisposed()||!predicate(m,ranks.get(m)))continue;if(m.getClassName()==='Mesh'&&!m.hasThinInstances&&!m.skeleton&&!m.morphTargetManager){list.push(m);stats.dynamicDirect125++;}else nativeDynamic.push(m);}
  if(nativeDynamic.length){stats.fallbacks++;stats.dynamicNative125++;const selected=new Set(nativeDynamic),hit=native(ray,(m,i)=>selected.has(m)&&predicate(m,i));if(hit?.hit)best=hit;}
  list.sort((a,b)=>ranks.get(a)-ranks.get(b));stats.candidates+=found.size;
  for(const mesh of list){const matrix=mesh.computeWorldMatrix(false,scene.cameraToUseForPointers||scene.activeCamera);matrix.invertToRef(inverse);B.Ray.TransformToRef(ray,inverse,local);stats.triangleMeshes++;const hit=mesh.intersects(local,false,undefined,false,matrix);if(hit?.hit&&(!best||hit.distance<best.distance||hit.distance===best.distance&&ranks.get(mesh)<ranks.get(best.pickedMesh)))best=hit;}
  best=best||new B.PickingInfo();best.ray=ray;return best;
 }
 function invalidate(mesh){if(mesh)pending.add(mesh);else for(const m of scene.meshes)pending.add(m);rankDirty=true;}
 function dispose(){disposed=true;scene.onNewMeshAddedObservable.remove(added);scene.onMeshRemovedObservable.remove(removed);grid.clear();records.clear();wide.clear();dynamic.clear();pending.clear();ranks.clear();}
 scene.onDisposeObservable.addOnce(dispose);return{pick,invalidate,stats,dispose};
}
