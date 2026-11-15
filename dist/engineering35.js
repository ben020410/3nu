/* BUILD35. Authored engineering models: one local design coordinate system per building.
 * World fits are implementation estimates, never surveyed dimensions. The BUILD34
 * terrain, road graph and ring road data are deliberately untouched by this module.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Engineering35=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const G=95.47306874492949,D=G+4.8;
const fits={
 '300':{id:'430289534',scale:.30,origin:[62,-869],u:[0,-1],v:[1,0],datum:G+7.62},
 '301':{id:'228476658',scale:.34,origin:[53,-948],u:[-1,0],v:[0,-1],datum:D},
 '302':{id:'482207537',scale:.62,origin:[18,-1110],u:[0,-1],v:[1,0],datum:G+2.4},
 '303':{id:'official-303',scale:.50,origin:[-25,-989],u:[0,1],v:[-1,0],datum:D}
};
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
function collect(number,recipe,fit=fits[number]){
 const geometry=[],volumes=[],surfaces=[],anchors={},id=fit.id,s=fit.scale;
 const world=p=>[fit.origin[0]+s*(p[0]*fit.u[0]+p[1]*fit.v[0]),fit.datum+s*p[2],fit.origin[1]+s*(p[0]*fit.u[1]+p[1]*fit.v[1])];
 const poly=p=>p.map(q=>{const a=world([...q,0]);return[a[0],a[2]];});
 const solid=(name,p,lo,hi)=>volumes.push({id:'eng35-'+number+'-'+name,building:id,p:poly(p),lo:fit.datum+s*lo,hi:fit.datum+s*hi,material:'stone',hidden:true,engineering35:true});
 const add=(kind,name,material,props)=>geometry.push({kind,name,material,...props});
 const H={scale:s,groundZ:(G-fit.datum)/s,box(name,x0,y0,z0,x1,y1,z1,material){add('slab',name,material,{p:rect(x0,y0,x1,y1),lo:z0,hi:z1});},
 slab(name,p,lo,hi,material){add('slab',name,material,{p,lo,hi});},quad(name,p,material){add('quad',name,material,{p});},
 ellipsoid(name,center,radii,material){add('ellipsoid',name,material,{center,radii});},beam(name,a,b,width,material){add('beam',name,material,{a,b,width});},cylinder(name,x,y,lo,hi,r,material){add('cylinder',name,material,{x,y,lo,hi,r});},solid,
 floor(name,p,z){surfaces.push({id:'eng35-'+number+'-'+name,building:id,p:poly(p),lo:fit.datum+s*z,engineering35:true});solid(name+'-floor-thickness',p,z-.16/s,z);},
 slopeFloor(name,p,a,b,lo,hi,thickness=.3){
  const aa=world([...a,lo]),bb=world([...b,hi]),dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  const fraction=q=>((q[0]-a[0])*dx+(q[1]-a[1])*dy)/den;
  surfaces.push({id:'eng35-'+number+'-'+name,building:id,p:poly(p),lo:aa[1],hi:bb[1],from:[aa[0],aa[2]],to:[bb[0],bb[2]],engineering35:true});
  // Thin, finely segmented roof volumes retain the open atrium underneath.
  // The top is continuously interpolated by the walking floor solver.
  function clip(points,t,greater){const out=[];for(let i=0;i<points.length;i++){const u=points[i],v=points[(i+1)%points.length],fu=fraction(u)-t,fv=fraction(v)-t,iu=greater?fu>=-1e-9:fu<=1e-9,iv=greater?fv>=-1e-9:fv<=1e-9;if(iu)out.push(u);if(iu!==iv){const r=fu/(fu-fv);out.push([u[0]+(v[0]-u[0])*r,u[1]+(v[1]-u[1])*r]);}}return out;}
  const n=Math.max(1,Math.ceil(Math.abs(hi-lo)*s/.08)),plane={from:[aa[0],aa[2]],to:[bb[0],bb[2]],lo:aa[1],hi:bb[1]};
  for(let i=0;i<n;i++){const q=clip(clip(p,i/n,true),(i+1)/n,false);if(q.length<3)continue;const z0=lo+(hi-lo)*i/n,z1=lo+(hi-lo)*(i+1)/n;solid(name+'-roof-thickness-'+i,q,Math.min(z0,z1)-thickness,Math.max(z0,z1));volumes[volumes.length-1].slope35=plane;}
 },
 stair(name,a,b,width,lo,hi,steps,material){steps=Math.max(steps,Math.ceil(Math.abs(hi-lo)*s/.18));add('stair',name,material,{a,b,width,lo,hi,steps});const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*width/2,ny=dx/l*width/2;
 const p=[[a[0]+nx,a[1]+ny],[a[0]-nx,a[1]-ny],[b[0]-nx,b[1]-ny],[b[0]+nx,b[1]+ny]],aa=world([...a,lo]),bb=world([...b,hi]);
 surfaces.push({id:'eng35-'+number+'-'+name,building:id,p:poly(p),lo:aa[1],hi:bb[1],from:[aa[0],aa[2]],to:[bb[0],bb[2]],steps,foundation29:Math.min(aa[1],bb[1])-.3,engineering35:true});},
 rail(name,a,b){const h=1.05/s;H.beam(name+'-cap',[a[0],a[1],a[2]+h],[b[0],b[1],b[2]+h],.055/s,'frame');const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(len*s/1.5));
 for(let i=0;i<=n;i++){const p=a.map((v,j)=>v+(b[j]-v)*i/n);H.beam(name+'-post'+i,p,[p[0],p[1],p[2]+h],.045/s,'frame');}
 for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,aa=a.map((v,j)=>v+(b[j]-v)*t0),bb=a.map((v,j)=>v+(b[j]-v)*t1),dx=bb[0]-aa[0],dy=bb[1]-aa[1],l=Math.hypot(dx,dy),nx=-dy/l*.06/s,ny=dx/l*.06/s;solid(name+'-barrier'+i,[[aa[0]+nx,aa[1]+ny],[aa[0]-nx,aa[1]-ny],[bb[0]-nx,bb[1]-ny],[bb[0]+nx,bb[1]+ny]],Math.min(aa[2],bb[2]),Math.max(aa[2],bb[2])+h);}},
 anchor(name,p){anchors[name]=world(p);}};
 recipe(H);
 // Foundations are the building's own lower wall courses; no terrain-covering plates.
 if(number==='302')for(const[name,p]of [['lower-core',rect(0,9.68,100,64.52)],['tower',rect(119.35,4.84,166.13,69.36)],['link',rect(100,20.97,119.35,48.39)]]){const lo=(G-fit.datum)/s-.2;H.slab('foundation-'+name,p,lo,0,'darkStone');solid('foundation-'+name,p,lo,0);}
 return{number,fit,geometry,volumes,surfaces,anchors,world};
}
function prepare(data,nav,recipes){
 if(nav.engineering35)return nav.engineering35;
 recipes=recipes||(typeof require==='function'?Object.fromEntries(['300','301','302','303'].map(n=>[n,require('./engineering35-'+n+'.js')])):globalThis.Engineering35Recipes);
 const targets=new Set(Object.values(fits).map(f=>f.id)),spec=nav.landmarks30;
 const sharedVolume=q=>/^(engineering-deck-|deck-)/.test(q.id),oldFloors=spec.surfaces.filter(q=>targets.has(q.building)),oldVolumes=spec.volumes.filter(q=>targets.has(q.building));
 const keptShared=oldVolumes.filter(sharedVolume).map(q=>({...q,building:'engineering-common35'}));
 // Retain original circulation footprints, including the existing 312 branch. The
 // north entry landing is part of the same deck mesh, extended to the new threshold.
 const deck=keptShared.find(q=>q.id.startsWith('engineering-deck-'));
 if(deck){
  deck.p=deck.p.map(p=>(p[1]===-949&&p[0]>=27.5)?[p[0],-943.8]:[Math.max(p[0],-25),p[1]]);
  // Trim the original slab at the new 301 facade instead of layering another
  // finish beneath its vestibule. The 303 edge likewise ends at its threshold.
  const at=deck.p.findIndex(p=>p[0]===50&&p[1]===-956);
  if(at>=0)deck.p.splice(at,3,[50,-948],[19,-948],[19,-964.5]);
 }
 const keepStairs=oldFloors.filter(q=>q.from).map(q=>({...q,building:q.id.startsWith('deck-')?'engineering-common35':q.building}));
 const keepOwnFloors=oldFloors.filter(q=>q.id==='merged-floor-96.67307-0'||q.id==='merged-floor-97.87307-0');
 const ownSlabs=oldVolumes.filter(q=>/^(301-tower-doorstep|302-front-terrace|302-door-landing)/.test(q.id));
 spec.volumes=spec.volumes.filter(q=>!targets.has(q.building));
 spec.surfaces=spec.surfaces.filter(q=>!targets.has(q.building));
 spec.details=spec.details.filter(q=>!targets.has(q.building));
 // Existing rails are kept on retained stairs/deck, and 301/302 side access.
 const retainedRails=spec.rails.filter(q=>targets.has(q.building));spec.rails=spec.rails.filter(q=>!targets.has(q.building));
 spec.volumes.push(...keptShared,...ownSlabs);
 spec.surfaces.push(...keepStairs,...keepOwnFloors,...keptShared.filter(q=>!/^deck-(pier|beam)/.test(q.id)).map(q=>({id:'eng35-shared-floor-'+q.id,building:'engineering-common35',p:q.p,holes:q.holes||[],lo:q.hi})));
 const models=Object.keys(fits).map(n=>collect(n,recipes[n]));
 for(const m of models){spec.volumes.push(...m.volumes);spec.surfaces.push(...m.surfaces);const b=data.buildings.find(q=>q.id===m.fit.id);if(!b)throw Error('Missing engineering building '+m.number);b.landmark30=true;b.engineering35=true;b.base=m.fit.datum;b.top=Math.max(...m.volumes.map(q=>q.hi));delete b.collisionPolygons;delete b.renderParts;spec.buildings[b.id]={number:m.number,name:b.name,base:b.base,sourceOutline:b.p,note:'BUILD35 final-r1 design. Uniform scale and datum are implementation fit, not survey.'};}
 data.renderBuildings=(data.renderBuildings||data.buildings).filter(b=>!targets.has(b.parentId)&&!targets.has(b.originalId)&&!targets.has(b.sourceBuildingId));
 // Rail openings follow stair and landing footprints, including the pre-existing 312 exit.
 const openings=[...keepStairs.map(q=>q.p),...keptShared.filter(q=>/^deck-(300|312)-head/.test(q.id)).map(q=>q.p)];
 function nearPolygon(p,poly,r=.65){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t)<r)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
 const common=collect('shared',H=>{for(const[r,q]of retainedRails.entries()){
 const a=[q.a[0],q.a[2],q.a[1]],b=[q.b[0],q.b[2],q.b[1]],lerp=t=>a.map((v,j)=>v+(b[j]-v)*t),flat=Math.abs(a[2]-b[2])<.01;
 const spans=[];if(q.building==='official-303'&&flat){const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15);let begin=null;for(let i=0;i<n;i++){const p=lerp((i+.5)/n),open=openings.some(poly=>nearPolygon(p,poly));if(!open&&begin===null)begin=i/n;if((open||i===n-1)&&begin!==null){spans.push([begin,open?i/n:1]);begin=null;}}}else spans.push([0,1]);
 for(const[k,[t0,t1]]of spans.entries()){const aa=lerp(t0),bb=lerp(t1);if(Math.hypot(bb[0]-aa[0],bb[1]-aa[1])<.1)continue;H.rail('retained-rail-'+r+'-'+k,aa,bb);if(q.building==='official-303'&&flat)H.beam('timber-deck-edge-'+r+'-'+k,[aa[0],aa[1],aa[2]-.23],[bb[0],bb[1],bb[2]-.23],.24,'timber');}
 }},{id:'engineering-common35',scale:1,origin:[0,0],u:[1,0],v:[0,1],datum:0});
 spec.volumes.push(...common.volumes);models.push(common);
 const state={build:35,models,fits,ground:G,deck:D,anchors:Object.fromEntries(models.map(m=>[m.number,m.anchors])),removed:{volumes:oldVolumes.length,surfaces:oldFloors.length},source:'3NU-engineering-final-r1',fitStatus:'implementation-estimate-not-survey'};
 nav.engineering35=state;return state;
}
function build(B,scene,state){
 if(!state)return;const palette={stone:'#bfc5c5',ivory:'#edece3',concrete:'#dce0dc',glass:'#7c9eaf',glassLight:'#9ab8c6',glassClear:'#a1bec9',glassDark:'#344e5a',frame:'#526770',metal:'#96a5aa',roof:'#a1afb3',timber:'#986337',timberLight:'#ba7f47',red:'#b84a48',paving:'#c3bfb2',darkStone:'#879293',plazaStone:'#c9c4b9',plazaJoint:'#d6d4c9',plazaLight:'#c0beb4',plazaWarm:'#beaf98',plazaBand:'#a49782',railBrown:'#775038',soil36:'#5b5740',leaf36:'#658341',leafLight36:'#8ba650'};
 const materials={};for(const [k,c]of Object.entries(palette)){const m=new B.StandardMaterial('engineering35-'+k,scene);m.diffuseColor=B.Color3.FromHexString(c);m.specularColor=B.Color3.FromHexString(k.startsWith('glass')?'#354958':'#101419');m.specularPower=64;m.backFaceCulling=false;m.twoSidedLighting=true;m.metadata={engineering35:true,glassClear:k==='glassClear'};if(k==='glassClear'){m.alpha=.27;m.transparencyMode=B.Material.MATERIAL_ALPHABLEND;m.needDepthPrePass=false;}materials[k]=m;}
 const stats={buildings:[],meshes:0,triangles:0};
 for(const model of state.models){const groups=new Map();
 function face(points,mat){if(points.length<3)return;let g=groups.get(mat);if(!g){g={positions:[],indices:[]};groups.set(mat,g);}const off=g.positions.length/3;for(const p of points)g.positions.push(...p);for(let i=1;i<points.length-1;i++)g.indices.push(off,off+i,off+i+1);}
 function slab(p,lo,hi,mat,topFace=true){const pp=p.map(q=>model.world([...q,lo])),top=p.map(q=>model.world([...q,hi])),idx=earcut(p.flat(),null,2);for(let i=0;i<idx.length;i+=3){if(topFace)face([top[idx[i]],top[idx[i+1]],top[idx[i+2]]],mat);face([pp[idx[i+2]],pp[idx[i+1]],pp[idx[i]]],mat);}for(let i=0;i<p.length;i++){const j=(i+1)%p.length;face([pp[i],pp[j],top[j],top[i]],mat);}}
 function beam(a,b,width,mat){const aa=model.world(a),bb=model.world(b),d=bb.map((v,i)=>v-aa[i]),l=Math.hypot(...d);if(l<1e-6)return;const n=d.map(v=>v/l),ref=Math.abs(n[1])>.9?[1,0,0]:[0,1,0],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],r0=cross(n,ref),rl=Math.hypot(...r0),r=r0.map(v=>v/rl*width*model.fit.scale/2),t=cross(n,r),v=[];for(const p of[aa,bb])for(const[x,y]of[[-1,-1],[1,-1],[1,1],[-1,1]])v.push(p.map((q,i)=>q+x*r[i]+y*t[i]));for(const f of[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])face(f.map(i=>v[i]),mat);}
 for(const q of model.geometry){const mat=q.material||'concrete';if(q.kind==='slab')slab(q.p,q.lo,q.hi,mat,q.topFace!==false);else if(q.kind==='quad')face(q.p.map(model.world),mat);else if(q.kind==='beam')beam(q.a,q.b,q.width,mat);else if(q.kind==='ellipsoid'){const [x,y,z]=q.center,[rx,ry,rz]=q.radii;const v=(a,b)=>[x+rx*Math.cos(a)*Math.cos(b),y+ry*Math.cos(a)*Math.sin(b),z+rz*Math.sin(a)];for(let i=0;i<8;i++)for(let j=0;j<12;j++){const a=-Math.PI/2+i*Math.PI/8,b=j*Math.PI/6,c=a+Math.PI/8,d=b+Math.PI/6;face([v(a,b),v(a,d),v(c,d),v(c,b)].map(model.world),mat);}}else if(q.kind==='cylinder'){const p=Array.from({length:16},(_,i)=>[q.x+Math.cos(i*Math.PI/8)*q.r,q.y+Math.sin(i*Math.PI/8)*q.r]);slab(p,q.lo,q.hi,mat);}else if(q.kind==='stair'){const dx=q.b[0]-q.a[0],dy=q.b[1]-q.a[1],l=Math.hypot(dx,dy),nx=-dy/l*q.width/2,ny=dx/l*q.width/2;for(let i=0;i<q.steps;i++){const t=i/q.steps,u=(i+1)/q.steps,aa=[q.a[0]+dx*t,q.a[1]+dy*t],bb=[q.a[0]+dx*u,q.a[1]+dy*u];slab([[aa[0]+nx,aa[1]+ny],[aa[0]-nx,aa[1]-ny],[bb[0]-nx,bb[1]-ny],[bb[0]+nx,bb[1]+ny]],Math.min(q.lo,q.hi)-.3/model.fit.scale,q.lo+(q.hi-q.lo)*u,mat);}}}
 let triangles=0;for(const[k,g]of groups){const mesh=new B.Mesh('building-'+model.fit.id+'-engineering35-'+k,scene),v=new B.VertexData();v.positions=g.positions;v.indices=g.indices;v.normals=[];B.VertexData.ComputeNormals(g.positions,g.indices,v.normals);v.uvs=g.positions.flatMap((_,i)=>i%3===0?[0,0]:[]);v.applyToMesh(mesh);mesh.material=materials[k];mesh.metadata={facilityId:model.fit.id,engineering35:true,category30:'building',primitiveCount:model.geometry.filter(q=>q.material===k).length};mesh.isPickable=true;mesh.freezeWorldMatrix();triangles+=g.indices.length/3;stats.meshes++;}stats.triangles+=triangles;stats.buildings.push({number:model.number,primitives:model.geometry.length,triangles,drawGroups:groups.size});
 }
 state.renderStats=stats;return stats;
}
return{prepare,collect,build,fits};
});
