/* BUILD33: one metre-based alignment for the carriageway, paint and future lanes.
 * Road paint is batched in 160 m spatial cells; it is not a second road surface.
 */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.RingRoad33=factory();})(this,()=>{
function createGrade(spec){
 const grid=new Map(),cell=24,half=7.65,shoulder=10,radius=half+shoulder;
 for(const path of [spec?.profile||[],spec?.approachProfile||[]])for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],q={a,b};
  for(let x=Math.floor((Math.min(a[0],b[0])-radius)/cell);x<=Math.floor((Math.max(a[0],b[0])+radius)/cell);x++)for(let z=Math.floor((Math.min(a[1],b[1])-radius)/cell);z<=Math.floor((Math.max(a[1],b[1])+radius)/cell);z++){
   const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(q);
  }
 }
 function sample(x,z){let d=Infinity,y=0;for(const {a,b}of grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]){
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1))),dd=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(dd<d){d=dd;y=a[2]+(b[2]-a[2])*t;}
 }const t=Math.max(0,Math.min(1,(d-half)/shoulder));return{d,y,weight:1-t*t*(3-2*t)};}
 return {sample,apply(x,z,base){const q=sample(x,z);return base*(1-q.weight)+q.y*q.weight;}};
}
function alignment(points,closed=false){const cumulative=[0];for(let i=1;i<points.length;i++)cumulative.push(cumulative.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));const length=cumulative.at(-1);
 const tangent=points.map((p,i)=>{const last=points.length-1,ai=i===0?(closed?last-1:0):i-1,bi=i===last?(closed?1:last):i+1,a=points[ai],b=points[bi],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;return[dx/len,dz/len];});
 function at(distance,offset=0){let s=closed?((distance%length)+length)%length:Math.max(0,Math.min(length,distance)),lo=1,hi=points.length-1;while(lo<hi){const m=(lo+hi)>>1;if(cumulative[m]<s)lo=m+1;else hi=m;}
  const i=lo,a=points[i-1],b=points[i],t=(s-cumulative[i-1])/(cumulative[i]-cumulative[i-1]||1),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
  const ax=tangent[i-1][0]*(1-t)+tangent[i][0]*t,az=tangent[i-1][1]*(1-t)+tangent[i][1]*t,tl=Math.hypot(ax,az)||1,tx=ax/tl,tz=az/tl;
  return{x:a[0]+t*dx-tz*offset,z:a[1]+t*dz+tx*offset,tx,tz,s};
 }return{at,length,cumulative};
}
function build(B,scene,spec,height){if(!spec)return{meshes:0};const groups=new Map(),materials={};
 for(const [k,color]of [['yellow',spec.centerMark.color],['white',spec.laneMark.color]]){const m=new B.StandardMaterial('ring33-paint-'+k,scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=B.Color3.Black();m.backFaceCulling=false;materials[k]=m;}
 const ring=alignment(spec.route,true),entry=alignment(spec.approach),period=spec.laneMark.dash+spec.laneMark.gap;
 function junction(s){return spec.junctions.some(j=>Math.min(Math.abs(s-j.s),ring.length-Math.abs(s-j.s))<j.halfGap);}
 function face(path,s0,s1,offset,width,color){const a=path.at(s0,offset-width/2),b=path.at(s0,offset+width/2),c=path.at(s1,offset+width/2),d=path.at(s1,offset-width/2),key=Math.floor(a.x/160)+','+Math.floor(a.z/160)+','+color;
  if(!groups.has(key))groups.set(key,{p:[],i:[],color});const g=groups.get(key),base=g.p.length/3;
  for(const p of[a,b,c,d])g.p.push(p.x,height(p.x,p.z)+.035,p.z);g.i.push(base,base+2,base+1,base,base+3,base+2);
 }
 function paint(path,phase,isRing){for(let s=0;s<path.length-.001;){
  // Boundaries at every dash start/end, independently of source road records.
  const u=((s+phase)%period+period)%period,edge=u<spec.laneMark.dash?spec.laneMark.dash:period,step=Math.min(.65,edge-u,path.length-s),end=s+Math.max(.001,step),mid=(s+end)/2;
  const blocked=isRing?junction(mid):mid>path.length-13;
  if(!blocked){for(const sign of[-1,1])face(path,s,end,sign*spec.centerMark.offset,spec.centerMark.width,'yellow');
   if(u<spec.laneMark.dash-.0001)for(const sign of[-1,1])face(path,s,end,sign*spec.laneWidth,spec.laneMark.width,'white');
   for(const sign of[-1,1])face(path,s,end,sign*spec.edgeMark.offset,spec.edgeMark.width,'white');
  }s=end;
 }}
 paint(ring,0,true);paint(entry,-entry.length,false);
 let vertices=0;for(const [key,g]of groups){const m=new B.Mesh('ring33-paint-'+key,scene),v=new B.VertexData();v.positions=g.p;v.indices=g.i;v.normals=[];B.VertexData.ComputeNormals(g.p,g.i,v.normals);v.applyToMesh(m);m.material=materials[g.color];m.isPickable=false;m.receiveShadows=true;m.freezeWorldMatrix();vertices+=g.p.length/3;}
 return{meshes:groups.size,vertices,dashPeriod:period};
}
return{createGrade,alignment,build};});
