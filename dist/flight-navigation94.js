/* Local, static corridor planning. Route coordinates are [x,z,feetY].
   Geometry is inspected only on plan requests, never in the movement loop. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.FlightNavigation94=factory();})(this,()=>{
 const R=.7,HEAD=2.15,CLEAR=1.2;
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 function clip(poly,axis,value,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-value)*sign,db=(b[axis]-value)*sign;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}return out;}
 function clipped(tri,box){let p=tri;for(const [axis,v,sign]of [[0,box[0],1],[0,box[2],-1],[1,box[1],1],[1,box[3],-1]]){p=clip(p,axis,v,sign);if(!p.length)break;}return p;}
 function plan({start,end,bounds,terrain,triangles,landingSafe=()=>true}){
  const fail=reason=>({ok:false,reason});
  if(![...start,...end].every(Number.isFinite))return fail('도착 지점의 높이를 확인할 수 없어요.');
  if([start,end].some(p=>p[0]<bounds[0]+1||p[0]>bounds[2]-1||p[1]<bounds[1]+1||p[1]>bounds[3]-1))return fail('비행 가능한 캠퍼스 범위를 벗어나요.');
  if(!landingSafe(end))return fail('등록된 도착 지점에 안전하게 착륙할 공간이 없어요. 보행 안내를 이용해 주세요.');
  const dx=end[0]-start[0],dz=end[1]-start[1],length=Math.hypot(dx,dz),ux=length?dx/length:1,uz=length?dz/length:0;
  let top=-Infinity;
  const count=Math.max(1,Math.ceil(length));
  for(let i=0;i<=count;i++)for(const side of [-R,0,R]){const t=i/count;top=Math.max(top,terrain(start[0]+dx*t-uz*side,start[1]+dz*t+ux*side));}
  const startBox=[start[0]-R,start[1]-R,start[0]+R,start[1]+R],endBox=[end[0]-R,end[1]-R,end[0]+R,end[1]+R],columns=[[],[]];
  for(const tri of triangles){
   const local=tri.map(p=>[(p[0]-start[0])*ux+(p[1]-start[1])*uz,-(p[0]-start[0])*uz+(p[1]-start[1])*ux,p[2]]),cut=clipped(local,[-R,-R,length+R,R]);
   for(const p of cut)top=Math.max(top,p[2]);
   for(const [i,box]of [startBox,endBox].entries()){const p=clipped(tri,box);if(p.length)columns[i].push([Math.min(...p.map(v=>v[2])),Math.max(...p.map(v=>v[2]))]);}
  }
  const cruise=Math.max(start[2],end[2],top+CLEAR);
  if(!Number.isFinite(cruise)||cruise+HEAD>600)return fail('장애물 위 안전 고도가 비행 범위를 넘어 안내를 시작할 수 없어요.');
  // A swept upright avatar occupies the entire launch/landing column.
  for(const [i,p]of [start,end].entries())if(columns[i].some(([lo,hi])=>hi>p[2]+.12&&lo<cruise+HEAD))return fail(i?'도착 지점 위 구조물 때문에 안전하게 하강할 수 없어요. 보행 안내를 이용해 주세요.':'머리 위 구조물을 통과할 수 없어요. 열린 공간으로 이동한 뒤 다시 시작해 주세요.');
  const coords=[start.slice()];for(const p of [[start[0],start[1],cruise],[end[0],end[1],cruise],end.slice()])if(distance(coords.at(-1),p)>.01)coords.push(p);
  if(coords.length===1)coords.push(end.slice());
  return{ok:true,mode:'flight',coords,distance:coords.slice(1).reduce((n,p,i)=>n+distance(coords[i],p),0),cruise,ascent:Math.max(0,cruise-start[2]),horizontal:length,descent:Math.max(0,cruise-end[2]),reason:''};
 }
 function create(B,scene,world,nav){
  let sources=null,lastKey='',lastResult=null;const geometry=new WeakMap();
  const physical=m=>m.isEnabled()&&m.isVisible&&!m.metadata?.navigationOverlay52&&(m.name.startsWith('building-')||m.name.startsWith('roof-')||m.name.startsWith('gate-')||m.metadata?.solid15||m.metadata?.facilityId==='snubear');
  function sourceList(){if(!sources)sources=scene.meshes.filter(physical).map(mesh=>{mesh.computeWorldMatrix(true);const b=mesh.getBoundingInfo().boundingBox;return{mesh,min:b.minimumWorld.clone(),max:b.maximumWorld.clone()};});return sources;}
  function* corridor(start,end){const box=[Math.min(start[0],end[0])-R,Math.min(start[1],end[1])-R,Math.max(start[0],end[0])+R,Math.max(start[1],end[1])+R];
   for(const {mesh,min,max}of sourceList()){
    if(max.x<box[0]||min.x>box[2]||max.z<box[1]||min.z>box[3])continue;
    let g=geometry.get(mesh);if(!g){const pos=mesh.getVerticesData(B.VertexBuffer.PositionKind),idx=mesh.getIndices();if(!pos||!idx)continue;const out=new Float32Array(pos.length),matrix=mesh.getWorldMatrix();for(let i=0;i<pos.length;i+=3){const p=B.Vector3.TransformCoordinates(new B.Vector3(pos[i],pos[i+1],pos[i+2]),matrix);out[i]=p.x;out[i+1]=p.z;out[i+2]=p.y;}g={pos:out,idx};geometry.set(mesh,g);}
    const {pos,idx}=g;for(let i=0;i<idx.length;i+=3){const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3;if(Math.max(pos[a],pos[b],pos[c])<box[0]||Math.min(pos[a],pos[b],pos[c])>box[2]||Math.max(pos[a+1],pos[b+1],pos[c+1])<box[1]||Math.min(pos[a+1],pos[b+1],pos[c+1])>box[3])continue;yield [[pos[a],pos[a+1],pos[a+2]],[pos[b],pos[b+1],pos[b+2]],[pos[c],pos[c+1],pos[c+2]]];}
   }
  }
  return{plan(start,end){const key=JSON.stringify([start,end]);if(key===lastKey)return lastResult;const before=performance.now();lastResult=plan({start,end,bounds:nav.bounds,terrain:world.terrain,triangles:corridor(start,end),landingSafe:p=>!world.blocked(p[0],p[1],.5,p[2])&&Math.abs(world.floorAt(p[0],p[1],p[2])-p[2])<.15&&world.ceilingAt(p[0],p[1],p[2])-p[2]>HEAD});lastResult.planMs=performance.now()-before;lastKey=key;return lastResult;}};
 }
 function remaining(coords,index,p){let n=0,a=p;for(let i=index;i<coords.length;i++){n+=distance(a,coords[i]);a=coords[i];}return n;}
 return{plan,create,remaining,distance,clipped};
});
