// Local repairs use the same swept footprint, storey and step height as manual walking.
// Work is resumed by the movement loop so a blocked street never monopolizes a frame.
export function* detour(world,start,goal){
 const stride=1.5,limit=1200,frontier=[],costs=new Map();
 const gap=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1]);
 function trace(from,to){
  const p=world.move({x:from[0],z:from[1],y:from[2]+.95},to[0]-from[0],to[1]-from[1]);
  return Math.hypot(p.x-to[0],p.z-to[1])<.035?[p.x,p.z,p.y-.95]:null;
 }
 const initial={p:start,cost:0,i:0,j:0,score:gap(start,goal)};
 frontier.push(initial);
 for(let visits=0;frontier.length&&visits<limit;visits++){
  yield;
  let best=0;for(let i=1;i<frontier.length;i++)if(frontier[i].score<frontier[best].score)best=i;
  const cur=frontier[best];frontier[best]=frontier.at(-1);frontier.pop();
  if(cur.cost>(costs.get(cur.key)??0))continue;
  const d=gap(cur.p,goal);
  if(d<stride*2){
   const end=trace(cur.p,goal);
   if(end&&Math.abs(end[2]-goal[2])<.4){
    const path=[end];for(let n=cur;n.parent;n=n.parent)path.push(n.p);
    return path.reverse();
   }
  }
  for(const [di,dj] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const i=cur.i+di,j=cur.j+dj,key=i+','+j+','+Math.round(cur.p[2]),cost=cur.cost+stride*Math.hypot(di,dj);
   if(cost>=(costs.get(key)??Infinity)||cost>gap(start,goal)+58)continue;
   const p=trace(cur.p,[start[0]+i*stride,start[1]+j*stride]);
   if(!p)continue;
   costs.set(key,cost);frontier.push({i,j,key,p,cost,parent:cur,score:cost+1.35*gap(p,goal)});
  }
 }
 return null;
}

export function createWorldPicking({B,scene,player,world,shuttle,leisure,nav,flying,enabled,start,notice}){
 const bagByMesh=new Map(leisure.bags.map(b=>[b.mesh,b])),stopByMesh=new Map();
 for(const s of shuttle.stops)for(const m of s.visual.renderMeshes)stopByMesh.set(m,s);
 let serial=0,marker=null,markerId=null,markerUntil=0;
 function footprint(hit,id){
  if(!marker){
   const tex=new B.DynamicTexture('footsteps125',128,scene,false);tex.hasAlpha=true;
   const ctx=tex.getContext();ctx.clearRect(0,0,128,128);ctx.lineWidth=5;ctx.strokeStyle='#ffffff';ctx.fillStyle='#275b77';
   for(const [cx,cy,angle] of [[45,75,-.18],[83,47,.18]]){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);
    for(const [y,rx,ry] of [[-9,11,17],[16,9,7]]){ctx.beginPath();ctx.ellipse(0,y,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.fill();}
    ctx.restore();
   }
   tex.update();const mat=new B.StandardMaterial('footsteps125',scene);mat.diffuseTexture=tex;mat.useAlphaFromDiffuseTexture=true;mat.disableLighting=true;mat.emissiveColor=B.Color3.White();mat.backFaceCulling=false;
   marker=B.MeshBuilder.CreateGround('guidance52-footsteps',{width:1.5,height:1.5},scene);
   marker.material=mat;marker.metadata={navigationOverlay52:true,renderRole99:'actor'};marker.isPickable=false;
  }
  const n=hit.getNormal(true)||B.Axis.Y;
  marker.position.copyFrom(hit.pickedPoint).addInPlace(n.scale(.045));
  marker.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,n,new B.Quaternion());
  markerId=id;markerUntil=performance.now()+1500;marker.setEnabled(true);
 }
 function pick(x,y){
  const picker=scene.metadata.label49,hit=picker.pick(x,y);
  if(!enabled())return hit;
  // Stop furniture and resident ground chunks may be deliberately excluded from hover labels.
  const visible=scene.pick(x,y,m=>m.isEnabled()&&m.isVisible&&m.visibility>0&&!m.metadata?.navigationOverlay52&&!m.metadata?.character&&m.metadata?.renderRole99!=='actor'&&m.name!=='route'&&!m.name.startsWith('guidance52')&&!m.isDescendantOf(player)&&!m.metadata?.renderProxy99&&(!scene.metadata.viewRange99||scene.metadata.viewRange99.isMeshShown(m)),false,scene.activeCamera);
  return visible?.hit&&(!hit?.hit||visible.distance<hit.distance+.02)?visible:hit;
 }
 function handle(hit){
  if(!enabled()||!hit?.hit)return;
  const mesh=hit.pickedMesh,bag=bagByMesh.get(mesh),stop=stopByMesh.get(mesh);
  let point,name,kind;
  if(bag){
   point=[bag.x,bag.z,bag.y];name='빈백';kind='bag';
  }else if(stop){
   const a=stop.approach;point=[a.x,a.z,a.y];name=stop.name+' 정류장';kind='stop';
  }else{
   const {x,y,z}=hit.pickedPoint,[xmin,zmin,xmax,zmax]=nav.bounds;
   const floor=world.floorAt(x,z,y),normal=hit.getNormal(true);
   if(!normal||normal.y<.5||Math.abs(y-floor)>.45||x<xmin+1||x>xmax-1||z<zmin+1||z>zmax-1||world.blocked(x,z,.42,floor)||world.ceilingAt(x,z,floor)-floor<1.8||/water|fountain|pond-water/i.test(mesh.name)){
    notice('이곳에는 이동할 수 없어요. 길이나 잔디를 선택해 주세요.');return;
   }
   point=[x,z,flying()?player.position.y-.95:floor];name='선택한 위치';kind=flying()?'level':'ground';
  }
  const id='walk-point-'+(++serial);const result=start({id,displayName:name,point125:point,kind125:kind,bag125:bag,stop125:stop});
  if(result?.ok&&!bag&&!stop)footprint(hit,id);
 }
 return {pick,handle,clearMarker(current){if(marker?.isEnabled()&&(markerId!==current||performance.now()>=markerUntil))marker.setEnabled(false);},isInteraction:hit=>bagByMesh.has(hit?.pickedMesh)||stopByMesh.has(hit?.pickedMesh)||hit?.pickedMesh?.name.startsWith('outdoor-central-lawn')};
}
