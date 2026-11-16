/* Approved facility recognition only. No mesh or collision changes; destinations reuse the existing walking graph. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.FacilityLabels=api;})(this,()=>{
 const ids=['stadium','baseball-field','headquarters-tennis','engineering-tennis','jahayon','waterfall73','place-acro'];
 const contains=(x,z,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.001)return true;if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const matches=(q,x,z)=>q.polygons.some((p,i)=>contains(x,z,p)&&!(q.holes[i]||[]).some(h=>contains(x,z,h)));
 function prepare(data,nav,world){const byId=new Map(data.buildings.map(b=>[b.id,b]));
  data.facilityLabels=ids.map(id=>{let model=byId.get(id),polygons,holes=[];
   if(id==='waterfall73'){if(!nav.waterfall73)return null;polygons=[nav.waterfall73.outer];const approach=polygons[0].reduce((a,p)=>p[0]>a[0]?p:a),anchor=world.nearest(...approach,true);if(anchor!==null)nav.anchors[id]=anchor;model={id,name:'공대폭포',facility:true,p:polygons[0],label49:{id,name:'공대폭포',displayName:'공대폭포'}};}
   else if(!model?.label49)return null;
   else if(id==='place-acro'){const stairs=nav.library17.surfaces.filter(q=>q.id.startsWith('main-front-')||(q.sources||[]).some(s=>s.startsWith('main-front-')));polygons=stairs.map(q=>q.p);holes=stairs.map(q=>q.holes||[]);}
   else polygons=[nav.facilities.find(f=>f.id===id)?.outer||model.p];
   if(!polygons?.length)return null;const points=polygons.flat(),bounds=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))],point=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2];
   if(id==='waterfall73')model.center=point;
   return{id,model,record:model.label49,polygons,holes,bounds,point};
  }).filter(Boolean);return data.facilityLabels;
 }
 // Candidate set is built once. Existing physical meshes remain non-colliding/non-walkable as before.
 function picker(scene,entries){const meshes=new Set();function register(m){const surface=m.name.startsWith('terrain-')||(m.metadata?.library17&&['walkway','stairs'].includes(m.metadata.category29)),fall=m.name.startsWith('waterfall83-')&&(/rock|core|falling-water/.test(m.name));if(!surface&&!fall)return;const b=m.getBoundingInfo().boundingBox;if(entries.some(q=>q.bounds[0]<=b.maximumWorld.x&&q.bounds[2]>=b.minimumWorld.x&&q.bounds[1]<=b.maximumWorld.z&&q.bounds[3]>=b.minimumWorld.z))meshes.add(m);}for(const m of scene.meshes)register(m);const pending=new Set();scene.onNewMeshAddedObservable.add(m=>pending.add(m));scene.onMeshRemovedObservable.add(m=>{pending.delete(m);meshes.delete(m);});scene.onBeforeRenderObservable.add(()=>{for(const m of pending)if(!m.isDisposed())register(m);pending.clear();});
  const predicate=m=>meshes.has(m)&&m.isEnabled()&&m.isVisible&&m.visibility>0;
  const resolve=hit=>hit?.hit&&predicate(hit.pickedMesh)?entries.find(q=>matches(q,hit.pickedPoint.x,hit.pickedPoint.z))?.record||null:null;
  return{predicate,resolve};
 }
 return{ids,contains,matches,prepare,picker};
});
