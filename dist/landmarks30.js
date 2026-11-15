/* Individually authored BUILD30 landmarks. Physical floors and solids share one spec.
   Source photographs are never used as distributable textures. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Landmarks30=api;})(this,()=>{
function prepare(data,nav){const s=nav.landmarks30;if(!s)return null;const ids=new Set(Object.keys(s.buildings));for(const b of data.buildings)if(ids.has(b.id)){b.landmark30=true;b.base=s.buildings[b.id].base;b.top=Math.max(...s.volumes.filter(q=>q.building===b.id).map(q=>q.hi));b.heightRecord={groundDatum:b.base,roofElevation:b.top,structureHeight:b.top-b.base,note:s.buildings[b.id].note};delete b.collisionPolygons;}
// Old photo-mass clones used parentId but render-building generations have varied.
data.renderBuildings=(data.renderBuildings||data.buildings).filter(b=>!(ids.has(b.parentId)||ids.has(b.sourceBuildingId)||ids.has(b.originalId)||[...ids].some(id=>b.id!==id&&String(b.id).startsWith(id+'-'))));for(const b of data.renderBuildings)if(ids.has(b.id))b.landmark30=true;return s;}
return{prepare};});
function buildLandmarks30(B,scene,spec){if(!spec)return;const V=(x,y,z)=>new B.Vector3(x,y,z),groups=new Map();
const colors={stone:'#c3cbce',concrete:'#dfe3df',ivory:'#eeeae1',blueGlass:'#86b2ca',lightGlass:'#a6cad5',bronzeGlass:'#8caaa9',darkGlass:'#536f7a',darkStone:'#737e81',metal:'#83989e',frame:'#526b76',paving:'#b9bdb9',timber:'#ad805b',red:'#b35c61',roof:'#536471',screen:'#9ba8a1',planting:'#658f63',atrium:'#a3c9d4'};
const mats={};for(const [k,c]of Object.entries(colors)){const m=new B.StandardMaterial('landmark30-'+k,scene);m.diffuseColor=B.Color3.FromHexString(c);m.specularColor=new B.Color3(...(/Glass|atrium/.test(k)?[.22,.27,.30]:[.045,.045,.045]));m.specularPower=50;m.backFaceCulling=false;mats[k]=m;}
mats.atrium.alpha=.29;mats.atrium.specularColor=new B.Color3(.16,.18,.2);mats.atrium.needDepthPrePass=true;
const add=(m,k,id,category='body')=>{m.material=mats[k];m.metadata={facilityId:id,landmark30:true,category30:category};m.isPickable=true;const key=id+'|'+k+'|'+category;if(!groups.has(key))groups.set(key,{meshes:[],id,k,category});groups.get(key).meshes.push(m);return m;};
function shell(name,ps,idx,k,id,category){const m=new B.Mesh(name,scene),v=new B.VertexData();v.positions=ps.flat();v.indices=idx;v.normals=[];B.VertexData.ComputeNormals(v.positions,idx,v.normals);v.uvs=ps.flatMap(()=>[0,0]);v.applyToMesh(m);return add(m,k,id,category);}
function slab(name,p,lo,hi,k,id,holes=[]){const m=B.MeshBuilder.ExtrudePolygon(name,{shape:p.map(q=>V(q[0],0,q[1])),holes:holes.map(r=>r.map(q=>V(q[0],0,q[1]))),depth:hi-lo,sideOrientation:B.Mesh.FRONTSIDE},scene,earcut);m.position.y=hi;return add(m,k,id);}
function bar(name,a,b,y,h,w,k,id){if(h<=0)return;const m=B.MeshBuilder.CreateBox(name,{width:Math.hypot(b[0]-a[0],b[1]-a[1]),height:h,depth:w},scene);m.position=V((a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2);m.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);return add(m,k,id);}
function rod(name,a,b,r,k,id){return add(B.MeshBuilder.CreateTube(name,{path:[V(...a),V(...b)],radius:r,tessellation:6,cap:B.Mesh.CAP_ALL},scene),k,id);}
function quad(name,a,b,c,d,k,id){const ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);return shell(name,[a,b,c,d],ny<0?[2,1,0,3,2,0]:[0,1,2,0,2,3],k,id);}
function facade(q){const f=q.facade;if(!f)return;const rows=f.rows,height=q.hi-q.lo,fh=height/rows,sign=Math.sign(q.p.reduce((s,a,i)=>{const b=q.p[(i+1)%q.p.length];return s+a[0]*b[1]-b[0]*a[1]},0));
for(let e=0;e<q.p.length;e++){const a=q.p[e],b=q.p[(e+1)%q.p.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<1)continue;const at=(t,o=.08)=>[a[0]+dx*t/len+sign*dz/len*o,a[1]+dz*t/len-sign*dx/len*o];
if(f.style==='curtain'){
 const cols=Math.max(2,Math.round(len/f.spacing));for(let j=0;j<=cols;j++){const t=len*j/cols;bar('curtain-mullion',at(t,.22),at(t+.12,.22),q.lo,height,.22,'frame',q.building);}for(let r=0;r<=rows*3;r++)bar('curtain-transom',at(0,.22),at(len,.22),q.lo+height*r/(rows*3),r%3===0?.18:.10,.22,'frame',q.building);
}else for(let r=0;r<rows;r++){
 const lo=q.lo+r*fh,cols=Math.max(1,Math.round(len/f.spacing)),sill=f.sill??(f.style==='ribbon'?.65:.9),wh=f.style==='small'?1:fh-sill-.7;
 if(f.style==='ribbon'){bar('ribbon-glass',at(.25),at(len-.25),lo+sill,wh,.14,'blueGlass',q.building);for(let j=1;j<cols*2;j++){const t=len*j/(cols*2);bar('ribbon-mullion',at(t,.2),at(t+.06,.2),lo+sill,wh,.16,'frame',q.building);}bar('grey-spandrel',at(0,.16),at(len,.16),lo+fh-.5,.5,.22,'stone',q.building);}
 else for(let j=0;j<cols;j++){const pitch=len/cols,w=f.style==='haedong'?Math.min(1.25,pitch*.38):pitch*.55,mid=pitch*(j+.5);bar('punched-reveal',at(mid-w/2-.1,.12),at(mid+w/2+.1,.12),lo+sill-.1,wh+.2,.25,'frame',q.building);bar('punched-glass',at(mid-w/2,.27),at(mid+w/2,.27),lo+sill,wh,.09,r%2===0?'blueGlass':'bronzeGlass',q.building);if(f.style==='haedong')bar('deep-stone-sill',at(mid-w/2-.15,.3),at(mid+w/2+.15,.3),lo+sill-.18,.16,.5,'ivory',q.building);}
 }
}}
function tapered(q){
 const p=q.p,c=p.reduce((a,b)=>[a[0]+b[0]/p.length,a[1]+b[1]/p.length],[0,0]),top=p.map(v=>[c[0]+(v[0]-c[0])*q.taper,q.hi,c[1]+(v[1]-c[1])*q.taper]),bottom=p.map(v=>[v[0],q.lo,v[1]]);
 for(let i=0;i<p.length;i++)quad(q.id+'-facet',bottom[i],bottom[(i+1)%p.length],top[(i+1)%p.length],top[i],q.material,q.building);
 slab(q.id+'-roof',top.map(v=>[v[0],v[2]]),q.hi-.12,q.hi,'roof',q.building);
 // Inset continuous clerestory and three horizontal roof cornices distinguish
 // the auditorium shells from the glazed public pavilions.
 for(let k=0;k<3;k++){const f=q.taper+(1-q.taper)*(3-k)/10,pp=p.map(v=>[c[0]+(v[0]-c[0])*f,c[1]+(v[1]-c[1])*f]),y=q.hi-2.7+k*.9;
 for(let i=0;i<p.length;i++)bar('hall-clerestory',pp[i],pp[(i+1)%p.length],y,.55,.2,'blueGlass',q.building);
 for(let i=0;i<p.length;i++)bar('hall-cornice',pp[i],pp[(i+1)%p.length],y+.55,.25,.45,'ivory',q.building);
 }
}
for(const q of spec.volumes){if(q.hidden)continue;if(q.taper)tapered(q);else slab(q.id,q.p,q.lo,q.hi,q.material,q.building,q.holes);facade(q);}
// Closed stair shell, not a slanted road or a stacked duplicate ramp.
for(const s of spec.surfaces.filter(q=>q.from)){const a=s.from,b=s.to,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,w=Math.hypot(s.p[0][0]-s.p[1][0],s.p[0][1]-s.p[1][1]),ps=[],ix=[];
 const point=(t,y,side)=>[a[0]+dx*t+nx*w/2*side,y,a[1]+dz*t+nz*w/2*side];
 const face=(p,want)=>{const a=p[0],ab=p[1].map((v,i)=>v-a[i]),ac=p[2].map((v,i)=>v-a[i]),n=[ab[2]*ac[1]-ab[1]*ac[2],ab[0]*ac[2]-ab[2]*ac[0],ab[1]*ac[0]-ab[0]*ac[1]];if(n.reduce((s,v,i)=>s+v*want[i],0)<0)p=p.slice().reverse();const i=ps.length;ps.push(...p);ix.push(i,i+1,i+2,i,i+2,i+3);};
 for(let k=0;k<s.steps;k++){const t0=k/s.steps,t1=(k+1)/s.steps,lo=s.lo+(s.hi-s.lo)*k/s.steps,hi=s.lo+(s.hi-s.lo)*(k+1)/s.steps;face([point(t0,lo,-1),point(t0,lo,1),point(t0,hi,1),point(t0,hi,-1)],[-dx/len,0,-dz/len]);face([point(t0,hi,-1),point(t0,hi,1),point(t1,hi,1),point(t1,hi,-1)],[0,1,0]);
 for(const side of[-1,1])face([point(t0,s.foundation29,side),point(t1,s.foundation29,side),point(t1,hi,side),point(t0,hi,side)],[nx*side,0,nz*side]);}
 face([point(0,s.foundation29,-1),point(0,s.foundation29,1),point(1,s.foundation29,1),point(1,s.foundation29,-1)],[0,-1,0]);face([point(1,s.foundation29,-1),point(1,s.hi,-1),point(1,s.hi,1),point(1,s.foundation29,1)],[dx/len,0,dz/len]);shell(s.id,ps,ix,'paving',s.building,'stairs');}
for(const r of spec.rails){const a=r.a,b=r.b;rod('handrail',[a[0],a[1]+1.05,a[2]],[b[0],b[1]+1.05,b[2]],.045,'frame',r.building);const n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/1.7);for(let k=0;k<=n;k++){const p=a.map((v,i)=>v+(b[i]-v)*k/n);rod('rail-post',p,[p[0],p[1]+1.05,p[2]],.035,'frame',r.building);}}
for(const d of spec.details){const id=d.building;
 if(d.kind==='cylinder'){const m=B.MeshBuilder.CreateCylinder('column',{height:d.hi-d.lo,diameter:d.r*2,tessellation:16},scene);m.position=V(d.p[0],(d.hi+d.lo)/2,d.p[1]);add(m,'concrete',id);}
 if(d.kind==='louvres')for(let i=0;i<d.count;i++){const y=d.a[1]+(d.b[1]-d.a[1])*i/d.count;bar('recess-louvre',[d.a[0],d.a[2]],[d.b[0],d.b[2]],y,.18,.28,'frame',id);}
 if(d.kind==='brace'){const z=d.z;for(const [a,b]of [[[d.x,d.lo,z],[d.x,d.hi,z+d.w]],[[d.x,d.lo,z+d.w],[d.x,d.hi,z]]])rod('302-red-X',a,b,.29,'red',id);for(const [a,b]of [[[d.x,d.lo,z],[d.x,d.hi,z]],[[d.x,d.lo,z+d.w],[d.x,d.hi,z+d.w]],[[d.x,d.hi,z],[d.x,d.hi,z+d.w]],[[d.x,d.lo,z],[d.x,d.lo,z+d.w]]])rod('302-X-frame',a,b,.24,'red',id);}
 if(d.kind==='barrel'){const n=24,m=16,ps=[],idx=[];for(let k=0;k<=m;k++)for(let j=0;j<=n;j++){const th=j/n*Math.PI;ps.push([d.x+Math.cos(th)*d.r,d.base+Math.sin(th)*d.r*.75,d.z0+(d.z1-d.z0)*k/m]);}for(let k=0;k<m;k++)for(let j=0;j<n;j++){const a=k*(n+1)+j;idx.push(a,a+1,a+n+2,a,a+n+2,a+n+1);}shell('301-barrel-roof',ps,idx,'blueGlass',id);for(let k=0;k<=m;k++){const path=ps.slice(k*(n+1),(k+1)*(n+1)).map(q=>V(...q));add(B.MeshBuilder.CreateTube('barrel-rib',{path,radius:.09,tessellation:5},scene),'frame',id);}for(let j=0;j<=n;j+=3)rod('barrel-long-mullion',ps[j],ps[m*(n+1)+j],.07,'frame',id);}
 if(d.kind==='canopy'){const p=d.p,pts=[[p[0][0],d.back,p[0][1]],[p[1][0],d.back,p[1][1]],[p[2][0],d.front,p[2][1]],[p[3][0],d.front,p[3][1]]];quad('301-sloped-entry',...pts,'blueGlass',id);const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);for(let i=0;i<=12;i++)rod('canopy-frame',lerp(pts[0],pts[1],i/12),lerp(pts[3],pts[2],i/12),.11,'frame',id);for(let i=0;i<=6;i++)rod('canopy-transom',lerp(pts[0],pts[3],i/6),lerp(pts[1],pts[2],i/6),.08,'frame',id);}
 if(d.kind==='atrium-wall'){
 const a=d.a,b=d.b,len=Math.hypot(b[0]-a[0],b[1]-a[1]),at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],ta=.56-2.2/len,tb=.56+2.2/len,head=d.lo+3.4;
 if(d.roofA!==undefined){quad('303-sloping-glass-head',[a[0],d.hi,a[1]],[b[0],d.hi,b[1]],[b[0],d.roofB,b[1]],[a[0],d.roofA,a[1]],'atrium',id);for(let j=0;j<=12;j++){const t=j/12,p=at(t),h=d.roofA+(d.roofB-d.roofA)*t;if(h>d.hi+.01)rod('303-head-mullion',[p[0],d.hi,p[1]],[p[0],h,p[1]],.055,'frame',id);}}
 const glass=(t0,t1,lo,hi)=>{const p=at(t0),q=at(t1);quad('303-glazed-void',[p[0],lo,p[1]],[q[0],lo,q[1]],[q[0],hi,q[1]],[p[0],hi,p[1]],'atrium',id);};
 if(d.door){glass(0,ta,d.lo,d.hi);glass(tb,1,d.lo,d.hi);glass(ta,tb,head,d.hi);for(const t of[ta,tb]){const p=at(t);rod('entry-jamb',[p[0],d.lo,p[1]],[p[0],head,p[1]],.08,'frame',id);}const p=at(ta),q=at(tb);rod('entry-header',[p[0],head,p[1]],[q[0],head,q[1]],.09,'frame',id);}else glass(0,1,d.lo,d.hi);
 for(let i=0;i<=12;i++){const t=i/12,p=at(t),lo=d.door&&t>ta&&t<tb?head:d.lo;rod('atrium-mullion',[p[0],lo,p[1]],[p[0],d.hi,p[1]],.055,'frame',id);}
 for(let y=d.lo;y<d.hi;y+=2)for(const[t0,t1]of(d.door&&y<head?[[0,ta],[tb,1]]:[[0,1]])){const p=at(t0),q=at(t1);rod('atrium-transom',[p[0],y,p[1]],[q[0],y,q[1]],.055,'frame',id);}
 }
 if(d.kind==='atrium-roof'){const ps=d.p.map((p,i)=>[p[0],(i<2)!==!!d.northLow?d.hi:d.lo,p[1]]);quad('303-sloped-courtyard-roof',...ps,'atrium',id);for(let j=0;j<=8;j++){const t=j/8,a=ps[0].map((v,i)=>v+(ps[3][i]-v)*t),b=ps[1].map((v,i)=>v+(ps[2][i]-v)*t);rod('303-timber-rafter',a,b,.14,'timber',id);}}
 if(d.kind==='timber-v'){rod('303-timber-upright',[d.x,d.lo,d.z],[d.x,d.hi,d.z],.22,'timber',id);rod('303-timber-diagonal',[d.x,d.lo,d.z],[d.x,d.hi,d.z+7],.24,'timber',id);}
 if(d.kind==='roof-garden'){slab('roof-planting',d.p,d.y,d.y+.22,'planting',id);}
 if(d.kind==='hall-roof'){const p=d.p,c=p.reduce((a,q)=>[a[0]+q[0]/p.length,a[1]+q[1]/p.length],[0,0]);slab('hall-recessed-roof',p.map(q=>[c[0]+(q[0]-c[0])*.88,c[1]+(q[1]-c[1])*.88]),d.y,d.y+.25,'roof',id);}
 if(d.kind==='korean-roof'&&id==='238935852')Kyu79.build(B,scene);
}
for(const g of groups.values())if(g.meshes.length){const m=B.Mesh.MergeMeshes(g.meshes,true,true,undefined,false,false);m.name='building-'+g.id+'-landmark30-'+(g.k==='frame'?'detail-':'')+g.k+'-'+g.category;m.material=mats[g.k];m.metadata={facilityId:g.id,landmark30:true,category30:g.category};m.freezeWorldMatrix();}
}
if(typeof module==='object')module.exports.build=buildLandmarks30;
