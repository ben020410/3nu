/* BUILD19: official https://lib.snu.ac.kr/vr/ observations only. Local a=NE, d=NW towards main-library front.
   All dimensions are model estimates, not measurements from VR. Prior dimensions are retained only as provisional world scale. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Library17=api;})(this,()=>{
function prepare(data,nav){
 // Compiled once offline: no legacy routes, replacement passes or competing
 // foundation patches are generated in the browser.
 const spec=nav.precinct29.library;
 const main=data.buildings.find(b=>b.id==='148286730'),newer=data.buildings.find(b=>b.id==='329398175');
 main.library17=true;newer.library17=true;main.walkableRoof15=spec.base+spec.levels.mainRoof;
 main.h=spec.levels.mainRoof;newer.h=spec.levels.roof;main.holes=[];
 nav.library17=spec;nav.library15=null;return spec;
}
function floor(spec,x,z,feet=Infinity){let out=null;for(const s of spec.surfaces){if(!inside(x,z,s.p)||(s.holes||[]).some(p=>inside(x,z,p)))continue;let h=s.lo;if(s.from){const dx=s.to[0]-s.from[0],dz=s.to[1]-s.from[1],t=Math.max(0,Math.min(1,((x-s.from[0])*dx+(z-s.from[1])*dz)/(dx*dx+dz*dz)));h=s.lo+(s.hi-s.lo)*(s.steps?Math.ceil(t*s.steps)/s.steps:t);}h+=spec.base;if(h<=feet+.26&&(out===null||h>out))out=h;}return out;}
function inside(x,z,p){for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.015)return true;}let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i][1]>z)!=(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;}return c;}
function blocked(spec,x,z,r,feet){if(!Number.isFinite(feet))feet=spec.base;
 // Earth stair shell and collision use the same foundation and stepped top.
 for(const q of spec.surfaces||[]){if(q.foundation29==null)continue;
  const dx=q.to[0]-q.from[0],dz=q.to[1]-q.from[1],len=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((x-q.from[0])*dx+(z-q.from[1])*dz)/(len*len))),top=spec.base+q.lo+(q.hi-q.lo)*Math.ceil(t*q.steps)/q.steps;
  if(feet>=top-.24||feet+1.79<=spec.base+q.foundation29)continue;
  if(inside(x,z,q.p))return true;
  for(let i=0;i<q.p.length;i++){const a=q.p[i],b=q.p[(i+1)%q.p.length],vx=b[0]-a[0],vz=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz)));if(Math.hypot(x-a[0]-u*vx,z-a[1]-u*vz)<r)return true;}
 }
for(const q of [...spec.volumes,...spec.groundSolids||[]]){
 // BUILD35 roof slices share one exact support plane. Use the surface beneath
 // the avatar centre, so its radius does not hit a taller neighbouring slice.
 // From below, the same thin volumes still provide collision and headroom.
 if(q.rail37){const r=q.rail37,dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],t=Math.max(0,Math.min(1,((x-r.a[0])*dx+(z-r.a[1])*dz)/(dx*dx+dz*dz)));const y=spec.base+r.y0+(r.y1-r.y0)*t;if(feet+1.79<=y||feet>=y+1.1)continue;}
 if(q.slope35){const s=q.slope35,dx=s.to[0]-s.from[0],dz=s.to[1]-s.from[1],t=Math.max(0,Math.min(1,((x-s.from[0])*dx+(z-s.from[1])*dz)/(dx*dx+dz*dz)));if(feet>=spec.base+s.lo+(s.hi-s.lo)*t-.24)continue;}
 if(feet>=spec.base+q.hi-.24||feet+1.79<=spec.base+q.lo)continue;if(inside(x,z,q.p)&&!(q.holes||[]).some(p=>inside(x,z,p)))return true;for(const p of [q.p,...q.holes||[]])for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<r)return true;}}return false;}
return{prepare,floor,blocked};});
function buildLibrary17(B,scene,spec){
 const V=(x,y,z)=>new B.Vector3(x,y,z),base=spec.base,point=(a,d)=>[spec.origin[0]+spec.u[0]*a+spec.v[0]*d,spec.origin[1]+spec.u[1]*a+spec.v[1]*d],rect=(a,d,w,h)=>[point(a,d),point(a+w,d),point(a+w,d+h),point(a,d+h)],groups=new Map();
 const mat=(n,c,s=.05)=>{const m=new B.StandardMaterial('library17-'+n,scene);m.diffuseColor=B.Color3.FromHexString(c);m.specularColor=new B.Color3(s,s,s);m.backFaceCulling=false;return m},mats={concrete:mat('concrete','#c9c9bf'),stone:mat('stone','#a7afb3'),metal:mat('metal','#c5c4b7',.32),glass:mat('glass','#7a9fb4',.65),ivory:mat('ivory','#e1e1d7'),paving:mat('paving','#b9bdb9'),soil:mat('soil','#718459'),rail:mat('rail','#647375',.2),timber:mat('timber','#99755c'),roof:mat('roof','#878d85'),solar:mat('solar','#4a5961',.25)};
 Library37.materials(B,scene,mats);if(spec.acro39)Acro39.materials(B,scene,mats);
 function add(mesh,material,id='329398175'){mesh.material=material;mesh.name='building-'+id+'-'+mesh.name;const cat=mesh.metadata?.category29||(/stair|landing|planter|garden|covered-seat|roof-tree/.test(mesh.name)?'unlabelled':'building');mesh.metadata={facilityId:id,library17:true,category29:cat||'building'};mesh.isPickable=true;const category=mesh.metadata?.category29||'building';mesh.metadata.category29=category;const key=id+'|'+material.name+'|'+category;if(!groups.has(key))groups.set(key,{material,id,category,meshes:[]});groups.get(key).meshes.push(mesh);return mesh;}
 // Single watertight polygon shell. Adjacent faces share boundaries; optional
 // top omission makes an architectural floor the sole visible roof finish.
 function shell(name,positions,indices,material,id,category='building',colors=null){
  const m=new B.Mesh(name,scene),vd=new B.VertexData();vd.positions=positions;vd.indices=indices;vd.normals=[];
  if(colors)vd.colors=colors;
  vd.uvs=[];for(let j=0;j<positions.length;j+=3){const dx=positions[j]-spec.origin[0],dz=positions[j+2]-spec.origin[1];vd.uvs.push((dx*spec.u[0]+dz*spec.u[1])/4,(dx*spec.v[0]+dz*spec.v[1]+(material.name.startsWith('acro39-')?0:positions[j+1]-base))/4);}B.VertexData.ComputeNormals(positions,indices,vd.normals);vd.applyToMesh(m);
  m.metadata={category29:category};return add(m,material,id);
 }
 function slab(name,p,lo,hi,material,id,options={}){
  const rings=[p,...options.holes||[]],pts=rings.flat(),xy=pts.flat(),holes=[];let n=p.length;
  for(const r of rings.slice(1)){holes.push(n);n+=r.length;}
  const tri=earcut(xy,holes,2),positions=[],indices=[];
  const face=(ps,want)=>{const a=ps[0],b=ps[1],c=ps[2],ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),normal=[ab[2]*ac[1]-ab[1]*ac[2],ab[0]*ac[2]-ab[2]*ac[0],ab[1]*ac[0]-ab[0]*ac[1]];if(normal.reduce((v,n,i)=>v+n*want[i],0)<0)ps=ps.slice().reverse();const start=positions.length/3;for(const [x,y,z]of ps)positions.push(x,base+y,z);for(let i=1;i<ps.length-1;i++)indices.push(start,start+i,start+i+1);};
  for(let i=0;i<tri.length;i+=3){const q=tri.slice(i,i+3).map(j=>pts[j]);if(!options.omitTop)face(q.map(([x,z])=>[x,hi,z]),[0,1,0]);face(q.map(([x,z])=>[x,lo,z]),[0,-1,0]);}
  for(const [ri,r]of rings.entries()){const sign=Math.sign(r.reduce((s,a,i)=>{const b=r[(i+1)%r.length];return s+a[0]*b[1]-b[0]*a[1]},0))*(ri?-1:1);for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];face([[a[0],lo,a[1]],[b[0],lo,b[1]],[b[0],hi,b[1]],[a[0],hi,a[1]]],[sign*(b[1]-a[1]),0,-sign*(b[0]-a[0])]);}}
  return shell(name,positions,indices,material,id,options.category);
 }
 function box(name,a,d,w,depth,lo,hi,material,id){return slab(name,rect(a,d,w,depth),lo,hi,material,id);}
 function bar(name,a,b,y,h,depth,material,id){const dx=b[0]-a[0],dz=b[1]-a[1],mesh=B.MeshBuilder.CreateBox(name,{width:Math.hypot(dx,dz),height:h,depth},scene);mesh.position=V((a[0]+b[0])/2,base+y+h/2,(a[1]+b[1])/2);mesh.rotation.y=-Math.atan2(dz,dx);return add(mesh,material,id);}
 for(const q of spec.volumes){const id=q.facilityId|| (q.id.startsWith('annex20')?'annex20':q.id.startsWith('main')||q.id.startsWith('roof-room')?'148286730':'329398175');if(q.id==='upper'||q.id==='right-wing'){const [a,d,w,h]=q.local;slab(q.id+'-recessed-core37',rect(a+.65,d+.65,w-1.3,h-1.3),q.lo+.13,q.hi-.13,mats.core,id);slab(q.id+'-roof-edge37',q.p,q.hi-.13,q.hi,mats.metal,id);}else slab(q.id,q.p,q.lo,q.hi,mats[q.material],id,{omitTop:q.omitTop29,holes:q.holes});if(q.id.startsWith('roof-room'))slab('roof-cap',q.p,q.hi,q.hi+.15,mats.ivory,id);}
 for(const a of[55,61]){bar('bridge20-rail',point(a,-26),point(a,-12.5),8,.08,.08,mats.rail,'annex20');for(let d=-26;d<=-12.5;d+=2)bar('bridge20-post',point(a,d),point(a+.05,d),7,1,.05,mats.rail,'annex20');}
 // VR third-entry: the near end of the opposite building is stone, with inset openings.
 for(const [a,w,y,h]of[[25.2,5,.2,3.4],[31.5,6,.2,3.4],[25.2,5,5.2,2.5],[31.5,6,5.2,2.5]]){
  bar('annex22-window',point(a,-25.87),point(a+w,-25.87),y,h,.12,mats.glass,'annex20');
  for(let x=a;x<a+w;x+=1.7)bar('annex22-frame',point(x,-25.78),point(x+.07,-25.78),y,h,.14,mats.rail,'annex20');
 }
 Library37.facades({B,scene,spec,point,slab,bar,box,shell,add,mats});
 // Recessed glazing mullions and stone joints are only on the supported lower volumes.
 for(const q of spec.volumes.filter(q=>q.material==='glass'))for(let side=0;side<4;side++){const a=q.p[side],b=q.p[(side+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);for(let t=0;t<len;t+=2.5){const p=[a[0]+dx*t/len,a[1]+dz*t/len];bar('glass-mullion',p,[p[0]+dx*.08/len,p[1]+dz*.08/len],q.lo,q.hi-q.lo,.12,mats.rail,q.facilityId||(q.id.startsWith('annex20')?'annex20':'329398175'));}bar('glass-transom',a,b,(q.lo+q.hi)/2,.10,.15,mats.rail,q.facilityId||(q.id.startsWith('annex20')?'annex20':'329398175'));}
 const main=spec.volumes.find(q=>q.id==='main-body');
 // Each merged landing and each stepped flight is built once from the same
 // polygon/level record used by Library17.floor. No boxes plus inclined overlay.
 for(const s of spec.surfaces){
  if(s.owner==='structure')continue;
  const id=s.facilityId||((s.sources||[s.id]).some(q=>/main|roof|garden/.test(q))?'148286730':'329398175');
  if(!s.steps){slab(s.id,s.p,s.lo-.3,s.lo,s.finish39?mats.acroPaving:mats[s.material||'paving'],id,{holes:s.holes,category:'walkway'});continue;}
  const dx=s.to[0]-s.from[0],dz=s.to[1]-s.from[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,n=s.steps,positions=[],indices=[],colors=[],thickness=s.earthSupported28?.3:.45;
  const at=(t,side,h)=>[s.from[0]+dx*t+nx*s.width*.5*side,base+h,s.from[1]+dz*t+nz*s.width*.5*side];
  const face=(ps,want,shade=1)=>{const a=ps[0],b=ps[1],c=ps[2],ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),normal=[ab[2]*ac[1]-ab[1]*ac[2],ab[0]*ac[2]-ab[2]*ac[0],ab[1]*ac[0]-ab[0]*ac[1]];if(normal.reduce((v,n,i)=>v+n*want[i],0)<0)ps=ps.slice().reverse();const j=positions.length/3;for(const p of ps){positions.push(...p);colors.push(shade,shade,shade,1);}for(let k=1;k<ps.length-1;k++)indices.push(j,j+k,j+k+1);};
  const bottom0=s.foundation29??s.lo-thickness,bottom1=s.foundation29??s.hi-thickness,profile=[[0,bottom0],[0,s.lo]];
  for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n,prev=i?s.lo+(s.hi-s.lo)*a:bottom0,h=s.lo+(s.hi-s.lo)*b;
   face([at(a,-1,prev),at(a,1,prev),at(a,1,h),at(a,-1,h)],[-dx,0,-dz],s.finish39?.86:.8);
   // A seven-centimetre stone nosing is part of the tread's own triangulation;
   // no coplanar strip, decal or raised overlay is generated.
   const edge=a+Math.min(.07/len,(b-a)*.18);
   face([at(a,-1,h),at(a,1,h),at(edge,1,h),at(edge,-1,h)],[0,1,0],s.finish39?.97:.68);
   face([at(edge,-1,h),at(edge,1,h),at(b,1,h),at(b,-1,h)],[0,1,0]);
   profile.push([a,h],[b,h]);
  }
  profile.push([1,bottom1]);
  face([at(0,1,bottom0),at(0,-1,bottom0),at(1,-1,bottom1),at(1,1,bottom1)],[0,-1,0]);
  face([at(1,-1,s.hi),at(1,1,s.hi),at(1,1,bottom1),at(1,-1,bottom1)],[dx,0,dz]);
  const sideTri=earcut(profile.flat(),null,2);
  for(const sign of[-1,1])for(let i=0;i<sideTri.length;i+=3)face(sideTri.slice(i,i+3).map(j=>at(profile[j][0],sign,profile[j][1])),[nx*sign,0,nz*sign]);
  // Vertices above already include base; shell adds no second transform.
  shell(s.id,positions,indices,s.finish39?mats.acroSteps:mats.paving,id,'stairs',colors);
  for(const sign of[-1,1]){const path=[];for(let i=0;i<=n;i++){const t=i/n,h=s.lo+(s.hi-s.lo)*t,q=at(t,sign,h+1.05);path.push(V(...q));if(i%Math.max(1,Math.round(n/8))===0)bar('stair-post',[q[0],q[2]],[q[0]+.055,q[2]],h,1.05,.055,mats.rail,id);}const rail=B.MeshBuilder.CreateTube('stair-handrail',{path,radius:s.finish39?.032:.045,tessellation:6},scene);rail.metadata={category29:'stairs'};add(rail,mats.rail,id);}
 }
 for(const r of spec.rails||[]){const len=Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]);bar('landing-handrail',r.a,r.b,r.y+1.05,.07,.07,mats.rail);for(let k=0;k<=Math.ceil(len/2);k++){const t=k/Math.ceil(len/2),q=[r.a[0]+(r.b[0]-r.a[0])*t,r.a[1]+(r.b[1]-r.a[1])*t];bar('landing-post',q,[q[0]+.05,q[1]],r.y,1.05,.05,mats.rail);}}
 // Forecourt recessed entry and independent upper-side entrance.
 bar('forecourt-door',point(-4,14.6),point(4,14.6),4.45,4,.12,mats.glass);
 box('forecourt-door-jamb-left',-5,17.55,1,1.1,4.45,8.65,mats.stone);box('forecourt-door-jamb-right',4,17.55,1,1.1,4.45,8.65,mats.stone);
 bar('third-side-door',point(12.15,9),point(12.15,16),0,4,.13,mats.glass);
 bar('education-door',point(128,12.15),point(134,12.15),4.45,4,.13,mats.glass);
 for(const y of[10,15,20])bar('education-louver',point(128,14.2),point(134,14.2),y,.8,.16,mats.rail);
 // Front reading-room entrance is glazed; side piloti remains open.
 box('main-entry-canopy',58,69,15,7,5.3,5.65,mats.ivory,'148286730');
 for(const a of[58,72])box('main-entry-post',a,74.5,.35,.35,0,5.3,mats.concrete,'148286730');
 // Rectangular-pane side facade differs from the staggered broad faces in the VR aerial.
 const leaf=mat('garden-tree','#718563'),trunk=mat('garden-trunk','#8b806a');
 for(const [a,d]of[...(spec.acro39?[]:[[65,118],[65,104],[65,91]]),[-13,68],[-13,52],[-13,35],[145,67],[145,48],[143,29]]){const q=point(a,d),treeBase=a<0?spec.levels.forecourt:a===65?(122-d)/34*2.2:4.45;box('stair-edge-planter',a-1.8,d-3,3.6,6,treeBase,treeBase+.45,mats.stone);box('stair-edge-soil',a-1.6,d-2.8,3.2,5.6,treeBase+.45,treeBase+.52,mats.soil);bar('garden-tree-trunk',q,[q[0]+.18,q[1]],treeBase+.5,6,.18,trunk);for(let j=0;j<3;j++){const m=B.MeshBuilder.CreateSphere('garden-tree-crown',{diameter:1,segments:8},scene);m.position=V(q[0]+Math.sin(j*2.1)*1.1,base+treeBase+6+j*.7,q[1]+Math.cos(j*2.1)*1.1);m.scaling=V(4+j*.3,4.8,4);add(m,leaf);}}
 // Main piloti is now a ground-owned paving domain.
 // Two front service rooms, rear garden strips and three smaller service heads in photo 4.
 for(const [a,d,w,h]of spec.beds37){box('roof-planter-edge',a,d,w,h,22,22.25,mats.ivory,'148286730');box('roof-garden',a+.2,d+.2,w-.4,h-.4,22.25,22.45,mats.soil,'148286730');}
 // Roof finish partition is emitted by the canonical floor atlas at exactly +22m.

 for(const [a,d] of [[34,27],[53,33],[79,30],[99,34]]){box('garden-island',a-2,d-2,4,4,22.08,22.45,mats.soil,'148286730');const q=point(a,d);bar('roof-tree-trunk',q,[q[0]+.13,q[1]],22.45,3,.13,trunk,'148286730');const crown=B.MeshBuilder.CreateSphere('roof-tree',{diameter:3.5,segments:8},scene);crown.position=V(q[0],base+26,q[1]);add(crown,leaf,'148286730');}
 for(const a of[29,42,55,68,81]){box('covered-seat',a,1,2.6,.55,22,22.45,mats.timber,'148286730');}
 // BUILD37 equipment screens are emitted once by finish().
 for(let i=0;i<5;i++)box('main-roof-equipment',86+i*1.9,70,1.1,2,22,23.5,mats.ivory,'148286730');
 for(let i=0;i<13;i++)box('roof-long-array',-8,-10.5+i*1.65,127,1.25,spec.levels.roof+.2,spec.levels.roof+.4,mats.solar);
 box('roof-plant-enclosure',123,-8,20,22,spec.levels.roof+.1,spec.levels.roof+1,mats.roof);
 // Garden perimeter rail is interrupted at both side-stair entrances.
 for(let i=0;i<main.p.length;i++){const a=main.p[i],b=main.p[(i+1)%main.p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<5)continue;const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],d=(mid[0]-spec.origin[0])*spec.v[0]+(mid[1]-spec.origin[1])*spec.v[1];if(d<28)continue;bar('garden-rail',a,b,23,.07,.07,mats.rail,'148286730');for(let k=0;k<len;k+=3){const q=[a[0]+(b[0]-a[0])*k/len,a[1]+(b[1]-a[1])*k/len];bar('garden-rail-post',q,[q[0]+.05,q[1]],22,1,.05,mats.rail,'148286730');}}
 Library37.finish({B,scene,spec,point,slab,bar,box,shell,add,mats});if(spec.acro39)Acro39.finish({B,scene,spec,point,slab,bar,box,shell,add,mats});
 for(const {material,id,category,meshes}of groups.values()){const mesh=B.Mesh.MergeMeshes(meshes,true,true);mesh.name='building-'+id+'-'+material.name;mesh.material=material;mesh.metadata={library17:true,facilityId:id,category29:category};mesh.isPickable=true;mesh.receiveShadows=true;mesh.freezeWorldMatrix();}
}
