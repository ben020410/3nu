/* BUILD11: geometric outdoor facilities; coordinates in metres, evidence in outdoor data. */
function buildOutdoor(B,scene,nav,height){
 const o=nav.outdoor;if(!o)return;const V=(x,y,z)=>new B.Vector3(x,y,z),groups=new Map();
 function mat(n,c){const m=new B.StandardMaterial('outdoor-'+n,scene);m.diffuseColor=B.Color3.FromHexString(c);m.specularColor=B.Color3.Black();return m;}
 const white=mat('lines','#f0ede1'),stone=mat('stone','#c7c6b9'),wall=mat('wall','#afafa4'),green=mat('lawn','#78964c'),soil=mat('bed','#5f714c'),metal=mat('fence','#53685d'),wood=mat('seat','#958167'),bark=mat('trunk','#716b52'),leaf=mat('leaf','#6b854e');
 const turfTex=new B.DynamicTexture('lawn-fine-grain',256,scene,true),ctx=turfTex.getContext();ctx.fillStyle='#78964c';ctx.fillRect(0,0,256,256);let seed=317;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};for(let i=0;i<16000;i++){ctx.fillStyle=i%2?'#819e56':'#728e49';ctx.fillRect(rnd()*256,rnd()*256,1,1)}turfTex.update();turfTex.wrapU=turfTex.wrapV=B.Texture.WRAP_ADDRESSMODE;turfTex.anisotropicFilteringLevel=8;green.diffuseTexture=turfTex;
 function add(m,mtrl){m.material=mtrl;m.isPickable=false;if(!groups.has(mtrl))groups.set(mtrl,[]);groups.get(mtrl).push(m);return m;}
 function box(name,p,y,w,h,d,rot,m){const mesh=B.MeshBuilder.CreateBox('outdoor-'+name,{width:w,height:h,depth:d},scene);mesh.position=V(p[0],y+h/2,p[1]);mesh.rotation.y=rot;return add(mesh,m);}
 function beam(name,a,b,width,m){const d=b.subtract(a),mesh=B.MeshBuilder.CreateCylinder('outdoor-'+name,{height:d.length(),diameter:width,tessellation:5},scene);mesh.position=a.add(b).scale(.5);mesh.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,d.normalize(),new B.Quaternion());return add(mesh,m);}
 function line(ps,y,width=.14){for(let i=1;i<ps.length;i++)beam('line',V(ps[i-1][0],y,ps[i-1][1]),V(ps[i][0],y,ps[i][1]),width,white);}
 Tennis81.build(B,scene,nav,height);
 for(const f of o.fences){if(Tennis81.selectedFence(f))continue;const d=Math.hypot(f.b[0]-f.a[0],f.b[1]-f.a[1]),y=height(...f.a),p=t=>[f.a[0]+(f.b[0]-f.a[0])*t,f.a[1]+(f.b[1]-f.a[1])*t],ls=[];for(let x=0;x<=d;x+=.4){const c=p(x/d);ls.push([V(c[0],y+.15,c[1]),V(c[0],y+f.h,c[1])]);}for(let h=.15;h<=f.h;h+=.4)ls.push([V(f.a[0],y+h,f.a[1]),V(f.b[0],y+h,f.b[1])]);for(let x=0;x<=d;x+=4){const c=p(x/d);beam('fence-post',V(c[0],y,c[1]),V(c[0],y+f.h,c[1]),.07,metal);}const net=B.MeshBuilder.CreateLineSystem('outdoor-fence-mesh',{lines:ls},scene);net.color=B.Color3.FromHexString('#687c69');net.isPickable=false;}
 for(const q of o.basketball||[]){const p=(x,z)=>[q.center[0]+q.axis[0]*x+q.side[0]*z,q.center[1]+q.axis[1]*x+q.side[1]*z],y=q.elevation+.04;line([p(-7.5,-14),p(7.5,-14),p(7.5,14),p(-7.5,14),p(-7.5,-14)],y);line([p(-7.5,0),p(7.5,0)],y);line(Array.from({length:49},(_,i)=>p(1.8*Math.cos(i*Math.PI/24),1.8*Math.sin(i*Math.PI/24))),y);for(const z of[-12.4,12.4]){const c=p(0,z),d=p(0,z+Math.sign(z)*1.8);beam('hoop-support',V(d[0],y,d[1]),V(d[0],y+3.5,d[1]),.15,metal);beam('hoop-arm',V(d[0],y+3.5,d[1]),V(c[0],y+3.5,c[1]),.12,metal);box('backboard',c,y+2.9,1.8,1.05,.08,-Math.atan2(q.axis[1],q.axis[0]),white);const rim=B.MeshBuilder.CreateTorus('basketball-rim',{diameter:.45,thickness:.035,tessellation:16},scene);rim.position=V(c[0],y+3.05,c[1]);add(rim,wood);}}
 const l=o.lawn;if(l){const stone=mat('lawn-stone42','#c8cac2'),green=mat('lawn-green42','#88a36d');stone.metadata={gwanjeong37:true};green.metadata={gwanjeong37:true};green.diffuseTexture=turfTex;green.diffuseColor=B.Color3.White();const p=(u,v)=>[l.center[0]+l.u[0]*u+l.v[0]*v,l.center[1]+l.u[1]*u+l.v[1]*v],rot=-Math.atan2(l.u[1],l.u[0]);
 const tile=new B.DynamicTexture('lawn-stone-joints42',512,scene,false),tc=tile.getContext();tc.fillStyle='#c8cac2';tc.fillRect(0,0,512,512);tc.strokeStyle='#b3b7b0';tc.lineWidth=.7;for(let i=0;i<=512;i+=128){tc.beginPath();tc.moveTo(i,0);tc.lineTo(i,512);tc.moveTo(0,i);tc.lineTo(512,i);tc.stroke();}tile.update(false);tile.uScale=tile.vScale=2;stone.diffuseTexture=tile;stone.diffuseColor=B.Color3.White();function slab(a,b,w,d,y,m,name){const stair=name.includes('stair'),bottom=stair?l.base:y-.55;if(m===green){box(name+'-slab',p(a+w/2,b+d/2),bottom,w,y-bottom-.06,d,rot,stone);return box(name,p(a+w/2,b+d/2),y-.06,w,.06,d,rot,m)}const mesh=box(name,p(a+w/2,b+d/2),bottom,w,y-bottom,d,rot,m);if(m===stone){const uv=mesh.getVerticesData(B.VertexBuffer.UVKind),ps=mesh.getVerticesData(B.VertexBuffer.PositionKind),ns=mesh.getVerticesData(B.VertexBuffer.NormalKind);for(let i=0;i<uv.length/2;i++){uv[i*2]=(Math.abs(ns[i*3+1])>.5?ps[i*3]+a+w/2:ps[i*3]+ps[i*3+2])/4;uv[i*2+1]=(Math.abs(ns[i*3+1])>.5?ps[i*3+2]+b+d/2:ps[i*3+1])/4;}mesh.setVerticesData(B.VertexBuffer.UVKind,uv);}return mesh;}
 for(const q of l.columns15||[])box('parking-column',q,l.base,1.1,l.rise-.55,1.1,rot,stone);
 // Parking markings are a visual approximation, not an asserted parking-bay count.
 for(const a of [-42,-34,-26,-18,-10,-2,6,14,22,30,38])for(const v of [-35,29]){line([p(a,v),p(a,v+5.5)],l.base+.045,.09);}
 // Partition the raised floor into central lawn, perimeter walks, planting strips, stairs.
 for(const [a,b,w,d]of[[-49,-34,98,7],[-49,27,98,7],[-49,-27,4,54],[45,-27,4,54]])slab(a,b,w,d,l.base+l.rise,stone,'lawn-perimeter-paving');slab(-45,-27,90,54,l.base+l.rise,green,'central-lawn');
 for(const s of [-1,1]){const b=s<0?-44:34;slab(-49,b,37,10,l.base+l.rise,stone,'terrace');slab(12,b,37,10,l.base+l.rise,stone,'terrace');if(s<0)slab(-12,b,24,10,l.base+l.rise,stone,'terrace');}
 
 for(let i=0;i<24;i++){const d=10/24,y=l.base+l.rise*(i+1)/24;const u=59-(i+1)*d,landing=l.cultureLanding;
  if(!landing||u>=landing.endU){slab(u,-44,d,78,y,stone,'east-stair');}
  else{
   slab(u,-44,d,landing.minV+44,y,stone,'east-stair');
   slab(u,landing.maxV,d,34-landing.maxV,y,stone,'east-stair');
   if(u+d>landing.endU)slab(landing.endU,landing.minV,u+d-landing.endU,landing.maxV-landing.minV,y,stone,'east-stair');
  }
  slab(-59+i*d,-44,d,78,y,stone,'west-stair');const sy=l.base+l.rise+(24-i)*1.8/24;slab(-12,44-(i+1)*d,5,d,sy,stone,'south-stair');slab(7,44-(i+1)*d,5,d,sy,stone,'south-stair');}
 // Replace the middle treads at the culture entrance with the registered landing.
 const landing=l.cultureLanding;
 if(landing)slab(49,landing.minV,landing.endU-49,landing.maxV-landing.minV,landing.y,stone,'east-stair-landing');
 // BUILD16: LAK December 2023, central reflecting basin and stepped water axis.
 const pool=mat('reflecting-water','#678b8a');pool.specularColor=new B.Color3(.3,.35,.35);
 // Replace central stair strip with water; side strips remain pedestrian routes.
 box('mirror-pool-rim',p(0,31),l.base+l.rise,18,.22,5,rot,stone);
 box('mirror-pool-water',p(0,31),l.base+l.rise+.225,17.4,.025,4.4,rot,pool);
 for(let i=0;i<8;i++){const z=35+i,y=l.base+l.rise+(i+1)*1.8/8;box('water-cascade',p(0,z),y,13,.12,.8,rot,pool);}
 // Gradual access behind the raised central terrace, shared with walking height.
 for(const a of[-59,49])slab(a,34,10,10,l.base+l.rise,stone,'admin-level-join');
 const rampPos=[],rampIx=[];for(let i=0;i<=20;i++){const z=44+i,y=l.base+l.rise+1.8*(1-i/20);for(const a of[-12,12]){const q=p(a,z);rampPos.push(q[0],y,q[1]);}if(i<20){const k=i*2;rampIx.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const ramp=new B.Mesh('honors-terrace-access-ramp',scene),rd=new B.VertexData(),rn=[];B.VertexData.ComputeNormals(rampPos,rampIx,rn);Object.assign(rd,{positions:rampPos,indices:rampIx,normals:rn,uvs:Array(rampPos.length/3*2).fill(0)});rd.applyToMesh(ramp);stone.backFaceCulling=false;add(ramp,stone);
 // Narrow joints, seats and planting islands follow observed edge composition; dimensions estimated.
 for(const s of[-1,1])for(const a of[-40,-22,22,40]){const b=s<0?-41:38;box('planter',p(a,b),l.base+l.rise,a%3===0?8:10,.28,3,rot,soil);box('bench',p(a,b-s*2.2),l.base+l.rise+.35,6,.12,.65,rot,wood);for(const dx of[-2,2])box('bench-leg',p(a+dx,b-s*2.2),l.base+l.rise,.15,.35,.5,rot,metal);}
 for(const a of[-43,-28,-13,2,17,32,45]){const b=-40.5,q=p(a,b),y=l.base+l.rise;beam('plaza-tree',V(q[0],y,q[1]),V(q[0],y+4.6,q[1]),.18,bark);const m=B.MeshBuilder.CreateIcoSphere('plaza-tree-crown',{radius:1,subdivisions:2,flat:false},scene);m.position=V(q[0],y+5.1,q[1]);m.scaling=V(1.8,2.5,1.7);add(m,leaf);}
 // LAK photographs: offset rectangular planting / timber seating modules, not a uniform ring.
 for(const side of[-1,1])for(let row=0;row<3;row++)for(let col=0;col<3;col++){
 const a=side*(19+col*10+row*1.4),d=28.2+row*2.15,y=l.base+l.rise;
 box('honors-terrace-planter',p(a,d),y,7.5,.18+row*.08,1.5,rot,stone);
 box('honors-terrace-planting',p(a,d),y+.18+row*.08,7,.12,1.1,rot,soil);for(const dx of[-2.6,-1.3,0,1.3,2.6]){const q=p(a+dx,d),shrub=B.MeshBuilder.CreateIcoSphere('lawn-low-shrub42',{radius:1,subdivisions:1},scene);shrub.position=V(q[0],y+.56+row*.08,q[1]);shrub.scaling=V(.48,.32,.43);add(shrub,leaf);}
 box('honors-timber-seat',p(a,d-1),y+.3,5.6,.18,.62,rot,wood);
 }
 for(const a of[-35,-18,15,32]){box('front-garden-border',p(a,-30.7),l.base+l.rise,10,.2,4,rot,stone);box('front-garden',p(a,-30.7),l.base+l.rise+.2,9.5,.1,3.5,rot,soil);}
 // Low glass pavilion beside a perimeter walkway, with a slim projecting roof.
 const pavilionGlass=mat('pavilion-glass','#91aba5');pavilionGlass.alpha=.62;
 const pc=p(-43,30);box('lawn-pavilion',pc,l.base+l.rise,5,2.8,4,rot,pavilionGlass);box('lawn-pavilion-roof',pc,l.base+l.rise+2.8,6,.18,5,rot,metal);
 // Safety rail on the road-facing wall; openings coincide with the usable stairs.
 for(const [a,b]of[[p(-59,-44),p(49,-44)]]){const d=Math.hypot(b[0]-a[0],b[1]-a[1]),y=l.base+l.rise;beam('rail',V(a[0],y+1.05,a[1]),V(b[0],y+1.05,b[1]),.055,metal);for(let k=0;k<=d;k+=1.5){const t=k/d;beam('rail-upright',V(a[0]+(b[0]-a[0])*t,y,a[1]+(b[1]-a[1])*t),V(a[0]+(b[0]-a[0])*t,y+1.05,a[1]+(b[1]-a[1])*t),.04,metal);}}
 }
 if(o.baseball){const f=o.baseball,y=f.elevation+.035;for(const ps of f.lines)line(ps,y,.09);for(const p of f.bases)box('base',p,y,.5,.06,.5,0,white);}
 for(const [m,list]of groups){if(!list.length)continue;const mesh=B.Mesh.MergeMeshes(list,true,true);mesh.material=m;mesh.metadata={solid15:true,...(m===stone||m===green||m===soil?{facilityId:'main-lawn'}:{})};mesh.isPickable=true;mesh.freezeWorldMatrix();}
}
