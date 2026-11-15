/* Official facility photos inform appearance; footprint/elevation sources remain explicit. */
function addCampusFacilities(B,scene,data,nav,height){
 const V=(x,y,z)=>new B.Vector3(x,y,z),mat=(n,c)=>{const m=new B.StandardMaterial(n,scene);m.diffuseColor=B.Color3.FromHexString(c);m.specularColor=B.Color3.Black();return m},white=mat('field-lines','#ece9d9'),stone=mat('pond-bank','#737e68'),metal=mat('field-metal','#9ca8a4'),leafMats=['#557448','#6a824a','#456a49'].map((c,i)=>mat('pond-leaf'+i,c));const merged=[];
 function line(name,ps,radius=.055,material=white){const path=[];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.5));for(let j=0;j<n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;path.push(V(x,height(x,z)+.07,z));}}const q=ps[ps.length-1];path.push(V(q[0],height(...q)+.07,q[1]));const m=B.MeshBuilder.CreateTube(name,{path,radius,tessellation:4},scene);m.material=material;m.isPickable=false;merged.push(m);}
 for(const f of nav.facilities||[]){if(f.kind==='pond'){if(nav.landmark44)continue;
  const p=f.outer;line('pond-stone-edge',[...p,p[0]],.38,stone);
  const c=p.reduce((a,q)=>[a[0]+q[0]/p.length,a[1]+q[1]/p.length],[0,0]),spray=new B.StandardMaterial('pond-fountain',scene);spray.diffuseColor=new B.Color3(.72,.85,.81);spray.emissiveColor=new B.Color3(.15,.19,.18);spray.alpha=.45;for(let j=0;j<14;j++){const theta=j*Math.PI/7,path=[];for(let k=0;k<=12;k++){const t=k/12;path.push(V(c[0]+Math.cos(theta)*t*2.1,f.elevation+.13+1.4*4*t*(1-t),c[1]+Math.sin(theta)*t*2.1));}const jet=B.MeshBuilder.CreateTube('pond-fountain-jet',{path,radius:.035,tessellation:4},scene);jet.material=spray;jet.isPickable=false;}

  // Official spring photo shows trees around the bank. Positions/heights are visual estimates;
  // species and seasonal blossom colour are not asserted. Keep access paths clear.
  const bark=mat('pond-bark','#6c6752'),trees=[];
  for(const [i,q] of [[-15,185,7],[-9,197,8],[0,205,7.5],[10,198,6.8],[23,190,7.6],[30,180,6.5],[-6,175,6]].entries()){
   const [x,z,h]=q;if(window.campusWorld.blocked(x,z,.6))continue;const y=height(x,z),tr=B.MeshBuilder.CreateCylinder('pond-tree-trunk',{height:h*.72,diameter:.25+i%3*.06,tessellation:7},scene);tr.position=V(x,y+h*.36,z);tr.material=bark;trees.push(tr);
   for(let j=0;j<3;j++){const m=B.MeshBuilder.CreateIcoSphere('pond-tree-crown',{radius:1,subdivisions:2,flat:false},scene);m.scaling=V(2.5+j*.3,2.3,2.4);m.position=V(x+Math.sin(i+j*2.1)*1.2,y+h*.7+j*.5,z+Math.cos(i+j*2.1)*1.2);m.material=leafMats[i%3];trees.push(m);}
  }for(const material of [bark,...leafMats]){const list=trees.filter(m=>m.material===material);if(list.length){const m=B.Mesh.MergeMeshes(list,true,true);m.isPickable=false;m.freezeWorldMatrix();}}
  // Low irregular rocks follow the OSM footprint, not a rectangular blue decal.
  for(let e=0;e<p.length;e++){const a=p[e],b=p[(e+1)%p.length],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.6);for(let i=0;i<count;i++){const t=i/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,m=B.MeshBuilder.CreateIcoSphere('pond-bank-rock',{radius:.55+(i%3)*.12,subdivisions:1},scene);m.scaling=V(1.4,.8,1);m.position=V(x,height(x,z)+.18,z);m.material=stone;m.rotation.y=i*.67;m.isPickable=false;merged.push(m);}}
 }else if(f.kind==='stadium'){
  const p=f.pitch,c=p.reduce((a,q)=>[a[0]+q[0]/p.length,a[1]+q[1]/p.length],[0,0]);let edge=p.map((a,i)=>({a,b:p[(i+1)%p.length],d:Math.hypot(p[(i+1)%p.length][0]-a[0],p[(i+1)%p.length][1]-a[1])})).sort((a,b)=>b.d-a.d)[0];let ux=(edge.b[0]-edge.a[0])/edge.d,uz=(edge.b[1]-edge.a[1])/edge.d;const coords=p.map(q=>[(q[0]-c[0])*ux+(q[1]-c[1])*uz,-(q[0]-c[0])*uz+(q[1]-c[1])*ux]);let l=Math.max(...coords.map(q=>q[0]))-Math.min(...coords.map(q=>q[0])),w=Math.max(...coords.map(q=>q[1]))-Math.min(...coords.map(q=>q[1]));if(l<w){[ux,uz]=[-uz,ux];[l,w]=[w,l]}l=Math.min(105,l-4);w=Math.min(68,w-4);const point=(x,z)=>[c[0]+ux*x-uz*z,c[1]+uz*x+ux*z];line('pitch-outline',[point(-l/2,-w/2),point(l/2,-w/2),point(l/2,w/2),point(-l/2,w/2),point(-l/2,-w/2)]);line('pitch-half',[point(0,-w/2),point(0,w/2)]);line('pitch-circle',Array.from({length:65},(_,i)=>point(9.15*Math.cos(i*Math.PI/32),9.15*Math.sin(i*Math.PI/32))));for(const s of [-1,1]){line('penalty-area',[point(s*l/2,-20),point(s*(l/2-16.5),-20),point(s*(l/2-16.5),20),point(s*l/2,20)]);const x=s*l/2;for(const z of [-3.66,3.66]){const q=point(x,z),m=B.MeshBuilder.CreateCylinder('goalpost',{height:2.44,diameter:.12,tessellation:6},scene);m.position=V(q[0],height(...q)+1.22,q[1]);m.material=white;m.isPickable=false;merged.push(m);}const a=point(x,-3.66),b=point(x,3.66),m=B.MeshBuilder.CreateTube('goal-crossbar',{path:[V(a[0],height(...a)+2.44,a[1]),V(b[0],height(...b)+2.44,b[1])],radius:.06,tessellation:6},scene);m.material=white;merged.push(m);}
  // Naver aerial image, 2026-11-12: painted white SNU mark in centre circle.
  // Approximate 10 m footprint; orientation NW. A flat ribbon, not a sculpture.
  const logoPaths=[[[-4,-4],[0,1],[4,-4]],[[4,-4],[4,5],[1.5,5]],[[4,2],[6,2]],[[4,0],[6,0]]];
  const transform=([x,z])=>[c[0]+.8*x-.6*z,c[1]+.6*x+.8*z];
  for(const path of (nav.landmark44?[]:logoPaths))for(let i=1;i<path.length;i++){const a=transform(path[i-1]),b=transform(path[i]),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),ox=-dz/len*.22,oz=dx/len*.22,ps=[[a[0]+ox,a[1]+oz],[b[0]+ox,b[1]+oz],[b[0]-ox,b[1]-oz],[a[0]-ox,a[1]-oz]],m=new B.Mesh('pitch-painted-sha',scene),vd=new B.VertexData();vd.positions=ps.flatMap(q=>[q[0],height(...q)+.045,q[1]]);vd.indices=[0,2,1,0,3,2];vd.normals=ps.flatMap(()=>[0,1,0]);vd.uvs=ps.flatMap(()=>[0,0]);vd.applyToMesh(m);m.material=white;m.isPickable=false;merged.push(m);}
  // Nested lanes stay within the actual stadium boundary; shape from OSM, lane widths estimated.
  for(const ring of f.trackLanes||[])line('track-lane',ring,.045);
 }
 }
 // Merge by material to keep draw calls bounded.
 for(const material of [white,stone,metal]){const list=merged.filter(m=>m.material===material);if(list.length){const m=B.Mesh.MergeMeshes(list,true,true);m.isPickable=false;m.freezeWorldMatrix();}}
 return{count:(nav.facilities||[]).length};
}
