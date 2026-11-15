/* BUILD36: local crown-aware planting exclusions from the actual engineering
 * building, stair and deck geometry. Does not change the source forest layout. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Landscape36=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const targets=new Set(['430289534','228476658','482207537','official-303','engineering-common35','engineering-common36']);
 const pointIn=(x,z,p)=>{let inRing=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inRing=!inRing;}return inRing;};
 function prepare(nav){
  const spec=nav.landmarks30||{volumes:[],surfaces:[],base:0},base=spec.base||0,exclusions=[],grid=new Map(),cell=20;
  const selected=q=>targets.has(q.building)||q.engineering36===true;
  function add(q,lo,hi,pad,kind){
   if(!Array.isArray(q.p)||q.p.length<3||!Number.isFinite(lo)||!Number.isFinite(hi))return;
   const e={id:q.id,building:q.building,p:q.p,holes:q.holes||[],lo,hi,pad,kind,bounds:[Math.min(...q.p.map(p=>p[0]))-pad,Math.min(...q.p.map(p=>p[1]))-pad,Math.max(...q.p.map(p=>p[0]))+pad,Math.max(...q.p.map(p=>p[1]))+pad]};
   const index=exclusions.push(e)-1;
   for(let x=Math.floor(e.bounds[0]/cell);x<=Math.floor(e.bounds[2]/cell);x++)for(let z=Math.floor(e.bounds[1]/cell);z<=Math.floor(e.bounds[3]/cell);z++){const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(index);}
  }
  for(const q of spec.volumes||[])if(selected(q))add(q,base+q.lo,base+q.hi,.25,'structure');
  // The clear walking envelope also protects landings/entry approaches, where
  // leaves can obscure a stair without physically reaching its concrete slab.
  for(const q of spec.surfaces||[])if(selected(q)){const a=base+q.lo,b=base+(q.hi??q.lo);add(q,Math.min(a,b)-.20,Math.max(a,b)+3.0,.65,'walking-clearance');}
  const state={build:36,exclusions,grid,cell,stats:{candidates:0,kept:0,removed:0,removedTrees:[]}};
  nav.landscape36=state;return state;
 }
 function describeTree(x,y,z,h,sx,sy,sz,yaw){return {crowns:[{center:[x,y+h*.8,z],radii:[sx,sy,sz],yaw},{center:[x+h*.18,y+h*.91,z-h*.13],radii:[h*.31,h*.36,h*.32],yaw:0}],trunk:{center:[x,z],radius:.225,lo:y,hi:y+h}};}
 function ellipseTouches(e,crown){
  const [cx,cy,cz]=crown.center,[rx,ry,rz]=crown.radii;
  const nearestY=Math.max(e.lo,Math.min(e.hi,cy)),v=(nearestY-cy)/ry;
  if(Math.abs(v)>1)return false;
  const section=Math.sqrt(Math.max(0,1-v*v)),ax=rx*section+e.pad,az=rz*section+e.pad,co=Math.cos(crown.yaw||0),si=Math.sin(crown.yaw||0);
  // Inverse Babylon Y rotation; a unit circle in these coordinates is the
  // exact horizontal cross-section of the rendered rotated ellipsoid.
  const local=p=>{const dx=p[0]-cx,dz=p[1]-cz;return[(co*dx-si*dz)/ax,(si*dx+co*dz)/az];};
  if(pointIn(cx,cz,e.p)&&!e.holes.some(p=>pointIn(cx,cz,p)))return true;
  for(const ring of[e.p,...e.holes])for(let i=0;i<ring.length;i++){const a=local(ring[i]),b=local(ring[(i+1)%ring.length]),dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(a[0]+dx*t,a[1]+dz*t)<=1)return true;}
  return false;
 }
 function interferes(state,tree){
  const parts=tree.crowns.map((c,i)=>({...c,part:'crown-'+i}));
  if(tree.trunk){const t=tree.trunk;parts.push({center:[t.center[0],(t.lo+t.hi)/2,t.center[1]],radii:[t.radius,(t.hi-t.lo)/2,t.radius],yaw:0,part:'trunk',cylinder:true});}
  for(const p of parts){
   const [x,y,z]=p.center,[rx,ry,rz]=p.radii,r=Math.max(rx,rz),seen=new Set();
   for(let gx=Math.floor((x-r)/state.cell);gx<=Math.floor((x+r)/state.cell);gx++)for(let gz=Math.floor((z-r)/state.cell);gz<=Math.floor((z+r)/state.cell);gz++)for(const index of state.grid.get(gx+','+gz)||[]){
    if(seen.has(index))continue;seen.add(index);const e=state.exclusions[index];
    if(x+r<e.bounds[0]||x-r>e.bounds[2]||z+r<e.bounds[1]||z-r>e.bounds[3]||y+ry<e.lo||y-ry>e.hi)continue;
    const q=p.cylinder?{...p,center:[x,Math.max(e.lo,Math.min(e.hi,y)),z]}:p;
    if(ellipseTouches(e,q))return {id:e.id,building:e.building,kind:e.kind,part:p.part};
   }
  }
  return null;
 }
 return {prepare,describeTree,interferes};
});
