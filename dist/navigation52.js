/* Guidance only: no navigation graph, terrain or building mutations. */
const Navigation52=(()=>{
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function nextStep(points,p,from=1){
  if(!points||points.length<2)return null;
  let best=null;
  for(let i=Math.max(1,from-1);i<points.length;i++){
   const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],len2=dx*dx+dz*dz;if(len2<1e-8)continue;
   const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.z-a[1])*dz)/len2)),x=a[0]+dx*t,z=a[1]+dz*t;
   const y=(a[2]??p.y)+((b[2]??p.y)-(a[2]??p.y))*t;
   const d=(x-p.x)**2+(z-p.z)**2+Math.min(100,(y-p.y)**2);
   if(!best||d<best.d)best={i,t,d};
  }
  if(!best)return null;
  let i=best.i;while(i<points.length-1&&Math.hypot(points[i][0]-p.x,points[i][1]-p.z)<1.2)i++;
  const to=points[i],dx=to[0]-p.x,dz=to[1]-p.z;if(Math.hypot(dx,dz)<.05)return null;
  return {index:i,to,bearing:Math.atan2(dx,dz)};
 }
 const arrived=(p,d)=>!!d&&Math.hypot(p.x-d[0],p.z-d[1])<3&&Math.abs(p.y-d[2])<2.5;
 function create(B,scene){
  const V=(x,y,z)=>new B.Vector3(x,y,z),root=new B.TransformNode('guidance52-arrow',scene),pin=new B.TransformNode('guidance52-destination',scene);
  const material=(name,color,alpha=1)=>{const m=new B.StandardMaterial(name,scene);m.disableLighting=true;m.emissiveColor=B.Color3.FromHexString(color);m.diffuseColor=m.emissiveColor;m.alpha=alpha;m.backFaceCulling=false;return m;};
  const blue=material('guidance52-blue','#2576ac'),white=material('guidance52-white','#f3fbff'),glow=material('guidance52-glow','#669ec2',.17);
  const shape=[[-.6,-1.3],[.6,-1.3],[.6,.1],[1.3,.1],[0,1.8],[-1.3,.1],[-.6,.1]];
  const arrow=B.MeshBuilder.ExtrudePolygon('guidance52-arrow-fill',{shape:shape.map(p=>V(p[0],0,p[1])),depth:.16,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);arrow.parent=root;arrow.material=white;
  const edge=B.MeshBuilder.CreateLines('guidance52-arrow-edge',{points:[...shape,shape[0]].map(p=>V(p[0],.025,p[1]))},scene);edge.parent=root;edge.color=B.Color3.FromHexString('#236d9c');arrow.rotation.x=-Math.PI/2;edge.rotation.x=-Math.PI/2;
  const pole=B.MeshBuilder.CreateCylinder('guidance52-pin-post',{height:3.2,diameter:.1,tessellation:6},scene);pole.parent=pin;pole.position.y=1.6;pole.material=blue;
  const flag=B.MeshBuilder.CreatePlane('guidance52-pin-flag',{width:1.4,height:.85,sideOrientation:B.Mesh.DOUBLESIDE},scene);flag.parent=pin;flag.position.set(.7,2.7,0);flag.material=blue;flag.billboardMode=B.Mesh.BILLBOARDMODE_Y;
  const beam=B.MeshBuilder.CreateCylinder('guidance52-beam',{height:8,diameter:.45,tessellation:8},scene);beam.parent=pin;beam.position.y=4;beam.material=glow;
  const meshes=[arrow,edge,pole,flag,beam];for(const m of meshes){m.isPickable=false;m.checkCollisions=false;m.receiveShadows=false;m.metadata={navigationOverlay52:true};}
  root.setEnabled(false);pin.setEnabled(false);let bearing=null;
  function update({active,player,camera,step,destination,dt,flight,ceiling=Infinity}){
   const visible=!!(active&&step&&destination);root.setEnabled(visible);pin.setEnabled(visible);if(!visible){bearing=null;return null;}
   const wanted=step.bearing;bearing=bearing===null?wanted:bearing+wrap(wanted-bearing)*(1-Math.exp(-12*Math.min(.1,dt)));
   const distance=B.Vector3.Distance(camera.position,player),size=Math.min(Math.max(.65,Math.min(2.4,distance*.055)),Math.max(.25,(ceiling-player.y-.2)/6.6),Number.isFinite(ceiling)?.35:Infinity);
   const forward=camera.getForwardRay().direction,flat=Math.hypot(forward.x,forward.z)||1;
   root.position.set(player.x+forward.x/flat*size*2,player.y+size*4.8,player.z+forward.z/flat*size*2);
   root.scaling.setAll(size);
   // Keep the arrow readable above the avatar; project the real route bearing
   // into the camera plane instead of showing a horizontal face edge-on.
   const direction=V(Math.sin(bearing),0,Math.cos(bearing)),right=camera.getDirection(B.Axis.X),up=camera.getDirection(B.Axis.Y);
   const sx=B.Vector3.Dot(direction,right),sy=B.Vector3.Dot(direction,up),ahead=(direction.x*forward.x+direction.z*forward.z)/flat;
   const screenAngle=Math.atan2(sx,Math.abs(sy)>.12?sy:ahead*.25);
   root.rotationQuaternion=B.Quaternion.FromRotationMatrix(camera.getWorldMatrix().getRotationMatrix()).multiply(B.Quaternion.RotationAxis(B.Axis.Z,-screenAngle));
   pin.position.set(destination[0],destination[2]+.08,destination[1]);
   return {bearing,wanted,screenAngle,index:step.index,to:step.to,position:[root.position.x,root.position.y,root.position.z],objects:meshes.length,mode:flight?'destination':'route'};
  }
  return {update,objectCount:meshes.length};
 }
 return {nextStep,arrived,wrap,create};
})();
if(typeof module!=='undefined')module.exports=Navigation52;
