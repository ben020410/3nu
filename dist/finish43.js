/* Local terrain ownership: one rendered surface and the same float32 walk triangles. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Finish43=api;})(this,()=>{
function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function owns(spec,x,z){return spec.zones.some(q=>inside(x,z,q.outer)&&!(q.holes||[]).some(h=>inside(x,z,h)));}
function prepare(data,nav,spec){if(nav.finish43)return;spec.grid=new Map();for(const t of spec.triangles){const xs=t.map(v=>v[0]),zs=t.map(v=>v[2]);for(let x=Math.floor(Math.min(...xs)/4);x<=Math.floor(Math.max(...xs)/4);x++)for(let z=Math.floor(Math.min(...zs)/4);z<=Math.floor(Math.max(...zs)/4);z++){const k=x+','+z;if(!spec.grid.has(k))spec.grid.set(k,[]);spec.grid.get(k).push(t);}}nav.finish43=spec;nav.library17.finish43=spec;
 spec.normals=new Map();const key=p=>[p[0],p[1],p[2]].map(x=>Math.round(x*10000)).join(',');for(const[a,b,c]of spec.triangles){const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]),n=[u[2]*v[1]-u[1]*v[2],u[0]*v[2]-u[2]*v[0],u[1]*v[0]-u[0]*v[1]];for(const p of[a,b,c]){const k=key(p),q=spec.normals.get(k)||[0,0,0];for(let i=0;i<3;i++)q[i]+=n[i];spec.normals.set(k,q);}}for(const q of spec.normals.values()){const len=Math.hypot(...q)||1;for(let i=0;i<3;i++)q[i]/=len;}
 // The existing S1 rail/planting and local shrubs follow the repaired ground.
 for(const model of nav.civic42.models)if(model.number==='S1'){
  for(const g of Object.values(model.groups))for(let i=0;i<g.positions.length;i+=3)g.positions[i+1]+=delta(nav,g.positions[i],g.positions[i+2]);
  for(const q of model.rails){q.a[1]+=delta(nav,q.a[0],q.a[2]);q.b[1]+=delta(nav,q.b[0],q.b[2]);}
  for(const q of model.volumes){const x=q.p.reduce((s,p)=>s+p[0]/q.p.length,0),z=q.p.reduce((s,p)=>s+p[1]/q.p.length,0),dy=delta(nav,x,z);q.lo+=dy;q.hi+=dy;if(q.rail37){q.rail37.y0+=delta(nav,...q.rail37.a);q.rail37.y1+=delta(nav,...q.rail37.b);}}
 }
 for(const q of nav.library17.groundSolids)if(q.id.startsWith('acro39-tree-')){const x=q.p.reduce((s,p)=>s+p[0]/q.p.length,0),z=q.p.reduce((s,p)=>s+p[1]/q.p.length,0),dy=delta(nav,x,z);q.lo+=dy;q.hi+=dy;}

 // Obsolete vertical closures inside the rebuilt grade have no remaining purpose.
 const old=nav.precinct29.gradeFaces,kept=[];let removed=0;for(let i=0;i<old.length;i+=9){const x=(old[i]+old[i+3]+old[i+6])/3,z=(old[i+2]+old[i+5]+old[i+8])/3;if(owns(spec,x,z))removed++;else kept.push(...old.slice(i,i+9));}nav.precinct29.gradeFaces=kept;
 for(const model of nav.civic42.models)if(model.number==='grade')for(const g of Object.values(model.groups)){const keep=[];for(let i=0;i<g.indices.length;i+=3){const ids=g.indices.slice(i,i+3),x=ids.reduce((s,j)=>s+g.positions[j*3]/3,0),z=ids.reduce((s,j)=>s+g.positions[j*3+2]/3,0);if(owns(spec,x,z))removed++;else keep.push(...ids);}g.indices=keep;}
 spec.removedVerticalTriangles=removed;
}
function sample(nav,x,z,change=false){const spec=nav.finish43;if(!spec)return null;for(const[a,b,c]of spec.grid.get(Math.floor(x/4)+','+Math.floor(z/4))||[]){const dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2],det=dx*ez-dz*ex;if(Math.abs(det)<1e-10)continue;const u=((x-a[0])*ez-(z-a[2])*ex)/det,v=(dx*(z-a[2])-dz*(x-a[0]))/det;if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)return change?(a[1]-a[3])+u*((b[1]-b[3])-(a[1]-a[3]))+v*((c[1]-c[3])-(a[1]-a[3])):a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]);}return null;}
function height(nav,x,z){return sample(nav,x,z);}
function delta(nav,x,z){return sample(nav,x,z,true)||0;}
return{prepare,height,delta,owns};});
