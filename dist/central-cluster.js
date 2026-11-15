/* BUILD 05: photo-informed massing. Source ground rings NEVER translated/scaled.
 * Upper volumes are separate from ground collision. See UPDATE-05.txt for estimates.
 * Architecture is generated independently; no reference-site code or photos shipped. */
function prepareCentralCluster(data){
 const profiles={'148286730':{kind:'library',levels:6,h:22},'329398175':{kind:'kwanjeong'},'167609409':{kind:'administration',levels:5,h:19},'167607356':{kind:'student',levels:6,h:23}};
 for(const b of data.buildings){if(!profiles[b.id])continue;b.clusterProfile=profiles[b.id];b.modelNote='사진·위성영상으로 주요 형태를 보정했습니다. 정확한 높이·가려진 면·일부 창호는 추정입니다.';if(b.id==='167609409')b.modelNote='60동: 공식 지상 5층 반영. 창호·격자 입면은 외관 사진 참고, 높이 19m는 추정.';}
}
function buildCentralBuilding(B,scene,b,data,height){
 const kind=b.clusterProfile.kind,V=(x,y,z)=>new B.Vector3(x,y,z),meshes=[],groups=new Map();
 const mk=(name,color,spec=.03)=>{const m=new B.StandardMaterial(kind+'-'+name,scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=new B.Color3(spec,spec,spec);m.specularPower=64;return m};
 const concrete=mk('concrete',kind==='student'?'#e7e7df':'#cec8b9'),stone=mk('shade','#bdb9ad'),glass=mk('glass','#45616b',.7),roof=mk('roof','#92958b'),brick=mk('recess','#9a6553'),metal=mk('metal','#cbbc9e',.55),dark=mk('solar','#354b55',.4);
 glass.emissiveColor=new B.Color3(.035,.05,.06);
 function add(m,mat){m.material=mat;meshes.push(m);if(!groups.has(mat))groups.set(mat,[]);groups.get(mat).push(m);return m;}
 function slab(name,p,lo,hi,mat){const m=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-'+name,{shape:p.map(q=>V(q[0],0,q[1])),depth:hi-lo,holes:(kind==='library'&&['body','roof'].includes(name)?[rect(31,55,16,14),rect(66,55,16,14)]:[]).map(r=>r.map(q=>V(q[0],0,q[1]))),sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);m.position.y=hi;return add(m,mat);}
 function bar(name,a,d,y,h,width,mat){const dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz);const m=B.MeshBuilder.CreateBox('building-'+b.id+'-'+name,{width:len,height:h,depth:width},scene);m.position=V((a[0]+d[0])/2,y+h/2,(a[1]+d[1])/2);m.rotation.y=-Math.atan2(dz,dx);return add(m,mat);}
 // Slightly inset window planes and projecting concrete frames supply real silhouette/shadow.
 function facade(p,lo,hi,floors,type){const area=p.reduce((s,q,i)=>s+q[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*q[1],0),sign=area>0?1:-1,fh=(hi-lo)/floors;
 for(let i=0;i<p.length;i++){const a=p[i],d=p[(i+1)%p.length],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz);if(len<2)continue;const n=[sign*dz/len,-sign*dx/len],point=(t,offset)=>[a[0]+dx*t+n[0]*offset,a[1]+dz*t+n[1]*offset];
 for(let f=0;f<floors;f++){const y=lo+f*fh;if(type==='library'){const bays=Math.max(1,Math.round(len/4.1));for(let j=0;j<bays;j++){const c=(j+.5)/bays,w=Math.min(1/bays*.34,1.35/len);bar('brick-window-reveal',point(c-w-.08/len,.04),point(c+w+.08/len,.04),y+fh*.23,fh*.58,.1,brick);bar('glazing',point(c-w,.10),point(c+w,.10),y+fh*.27,fh*.48,.1,glass);}}else bar('glazing',point(.015,.035),point(.985,.035),y+fh*.22,fh*.6,.09,glass);bar('spandrel',point(0,.17),point(1,.17),y+fh*.88,fh*.12,.35,concrete);
 if(type==='library')bar('brick-reveal',point(0,.07),point(1,.07),y+fh*.14,fh*.08,.15,brick);}
 const spacing=type==='student'?5.6:type==='administration'?2.9:4.1,count=Math.max(1,Math.round(len/spacing));for(let j=0;j<=count;j++){const t=j/count;bar('pier',point(Math.max(0,t-.22/len),.22),point(Math.min(1,t+.22/len),.22),lo,hi-lo,.52,concrete);}
 bar('coping',point(0,.1),point(1,.1),hi,.55,.5,stone);
 }}
 const center=b.p.reduce((a,p)=>[a[0]+p[0]/b.p.length,a[1]+p[1]/b.p.length],[0,0]),ground=height(...center),base=Math.min(...b.p.map(p=>height(...p)))-1;
 const k=data.buildings.find(q=>q.id==='329398175'),origin=k.p[0],len=Math.hypot(k.p[1][0]-origin[0],k.p[1][1]-origin[1]),u=[(k.p[1][0]-origin[0])/len,(k.p[1][1]-origin[1])/len],v=[-u[1],u[0]],pt=(a,d)=>[origin[0]+u[0]*a+v[0]*d,origin[1]+u[1]*a+v[1]*d],rect=(a,d,w,h)=>[pt(a,d),pt(a+w,d),pt(a+w,d+h),pt(a,d+h)];
 const lib=data.buildings.find(q=>q.id==='148286730'),lc=lib.p.reduce((a,p)=>[a[0]+p[0]/lib.p.length,a[1]+p[1]/lib.p.length],[0,0]),libraryRoof=height(...lc)+22;
 if(kind==='kwanjeong'){
  // Narrow OSM ring describes the lower spine, not the overhanging reading rooms.
  const bottom=libraryRoof+5,top=bottom+17,upper=rect(-18,-12.5,165,32);
  slab('lower-spine',b.p,base,bottom,glass);slab('west-return',rect(-18,-12.5,22,32),base,bottom,glass);facade(rect(-18,-12.5,22,32),ground,bottom,5,'kwanjeong');facade(b.p,ground,bottom,5,'kwanjeong');
  slab('reading-room-bridge',upper,bottom,top,metal);slab('bridge-roof',upper,top,top+.35,roof);
  // Vertical metal/glass rhythm seen in architect photograph and Naver street view.
  for(let i=0;i<upper.length;i++){const a=upper[i],d=upper[(i+1)%upper.length],dx=d[0]-a[0],dz=d[1]-a[1],l=Math.hypot(dx,dz),nx=dz/l,nz=-dx/l;
   for(let row=0;row<7;row++)for(let x=.1;x<l;x+=1.25){const t=x+((row%2)*.625),end=Math.min(l,t+1.12);if(t>=l)continue;
    const aa=[a[0]+dx*t/l+nx*.20,a[1]+dz*t/l+nz*.20],dd=[a[0]+dx*end/l+nx*.20,a[1]+dz*end/l+nz*.20];
    bar('panel-glass',aa,dd,bottom+row*2.4,.0+2.3,.10,glass);
    const leaf=bar('angled-metal-panel',aa,[aa[0]+dx*(end-t)*.68/l,aa[1]+dz*(end-t)*.68/l],bottom+row*2.4,2.3,.12,metal);leaf.rotation.y+=(row%2?1:-1)*12.5*Math.PI/180;
   }
  }
  // Rooftop arrays are visible in aerial imagery. Count/tilt simplified.
  for(let j=0;j<3;j++)slab('roof-array',rect(0,-8+j*5.8,112,3.8),top+.4,top+.55,dark);
  b.base=base;b.top=top;b.upperOutline=upper;
 }else if(kind==='student'){
  // Split one source polygon into connected north/south wings; union equals source ring.
  function clip(p,z,above){const out=[];for(let i=0;i<p.length;i++){const a=p[i],d=p[(i+1)%p.length],ia=above?a[1]>=z:a[1]<=z,id=above?d[1]>=z:d[1]<=z;if(ia)out.push(a);if(ia!==id){const t=(z-a[1])/(d[1]-a[1]);out.push([a[0]+t*(d[0]-a[0]),z]);}}return out;}
  for(const [idx,poly]of [clip(b.p,30,true),clip(b.p,30,false)].entries()){const top=ground+(idx?16:23);slab('wing'+idx,poly,base,top,concrete);slab('roof'+idx,poly,top,top+.15,roof);facade(poly,ground,top,idx?4:6,'student');}
  b.base=base;b.top=ground+23;
 }else{
  const top=ground+b.clusterProfile.h;slab('body',b.p,base,top,concrete);slab('roof',b.p,top,top+.15,roof);facade(b.p,ground,top,b.clusterProfile.levels,kind);b.base=base;b.top=top;
  if(kind==='library'){
   for(const a of [31,66]){const court=rect(a,55,16,14);facade(court,ground,top,6,'library');}
   const garden=mk('roof-garden','#7b8b62');
   for(const a of [24,91])for(const d of [32,43,61])slab('garden-bed',rect(a,d,12,5),top+.15,top+.45,garden);
   slab('roof-connection',rect(7,0,120,10),top-.4,top,stone);
   // Both exterior stair routes: widths and rise are visual estimates, no measured section available.
   for(const a of [7,121])for(let i=0;i<110;i++){const d=74-(i+1)*64/110,y=ground+(i+1)*22/110;slab('exterior-stair',rect(a,d,6,64/110),ground,y,stone);if(i%10===0){for(const x of[a+.1,a+5.9])bar('stair-rail-post',pt(x,d),pt(x+.06,d),y,1,.06,metal);}}
   for(const a of [7.1,12.9,121.1,126.9]){const aa=pt(a,74),dd=pt(a,10);const rail=B.MeshBuilder.CreateTube('building-'+b.id+'-stair-handrail',{path:[V(aa[0],ground+1,aa[1]),V(dd[0],top+1,dd[1])],radius:.055,tessellation:6},scene);add(rail,metal);}

  }else{
   for(let j=0;j<2;j++)slab('roof-array',rect(33,140+j*7,75,4),top+.2,top+.4,dark);
  }
 }
 // Merge by material, retaining per-building culling and modest draw-call count.
 for(const [mat,list]of groups){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.name='building-'+b.id+'-'+mat.name;merged.material=mat;merged.receiveShadows=true;merged.freezeWorldMatrix();}}
}
