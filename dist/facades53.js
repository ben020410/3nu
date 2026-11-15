/* Scoped exterior schedules. Existing site polygons, arrival anchors and terrain are authoritative. */
const Facades53=(()=>{
 const ids=new Set(['439693757','386891006','456356713','439687811','167663930','386891016','439687810','439687809']);
 const handles=b=>ids.has(b.id.split('-part')[0]);
 function build(B,scene,b,height){
  if(!handles(b))return false;
  const id=b.id.split('-part')[0],V=(x,y,z)=>new B.Vector3(x,y,z),p=b.p,c=b.center,datum=b.siteDatum??height(...c),base=b.foundationDatum46??Math.min(...p.map(q=>height(...q)))-.7;
  const palette={stone:'#d4d0c2',brick:'#b68e70',white:'#dfdfd4',glass:'#66898d',frame:'#495d60',dark:'#414c50',roof:'#b6bcb6',metal:'#bec9c8',tile:'#d8d0bb',rubble:'#b3ac92'};
  const cache=scene._facades53Materials||(scene._facades53Materials={});
  function material(k){if(cache[k])return cache[k];const m=new B.StandardMaterial('exterior53-'+k,scene);m.diffuseColor=B.Color3.FromHexString(palette[k]);m.specularColor=k==='glass'?new B.Color3(.24,.28,.28):k==='metal'?new B.Color3(.25,.25,.25):new B.Color3(.03,.03,.03);m.backFaceCulling=false;m.metadata={facade53:true};
   if(['stone','brick','tile','rubble'].includes(k)){const t=new B.DynamicTexture('finish53-'+k,{width:512,height:512},scene,true),ctx=t.getContext();ctx.fillStyle=palette[k];ctx.fillRect(0,0,512,512);let seed=41;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);const rows=k==='brick'?32:k==='tile'?24:k==='rubble'?7:4,cols=k==='brick'?10:k==='tile'?12:k==='rubble'?6:3,h=512/rows,w=512/cols;
    for(let y=0;y<rows;y++)for(let x=-1;x<=cols;x++){const a=x*w+(y%2&&k!=='stone'?w/2:0),v=rand();ctx.fillStyle=v>.5?'rgba(255,255,250,.055)':'rgba(53,62,59,.045)';ctx.fillRect(a,y*h,w,h);ctx.strokeStyle=k==='brick'?'rgba(235,220,198,.24)':'rgba(75,80,72,.16)';ctx.lineWidth=k==='rubble'?2:1;ctx.strokeRect(a+.5,y*h+.5,w-1,h-1);}t.update();t.anisotropicFilteringLevel=4;t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;m.diffuseColor=B.Color3.White();m.diffuseTexture=t;
   }cache[k]=m;return m;
  }
  const groups={};
  function append(k,pos,ix,uv){const g=groups[k]||(groups[k]={p:[],i:[],uv:[]}),off=g.p.length/3;g.p.push(...pos);g.i.push(...ix.map(i=>i+off));g.uv.push(...(uv||Array(pos.length/3*2).fill(0)));}
  function box(k,x,y,z,w,h,d,angle=0){if(Math.min(w,h,d)<=0)return;const v=B.VertexData.CreateBox({width:w,height:h,depth:d}),m=B.Matrix.RotationY(angle).multiply(B.Matrix.Translation(x,y,z)),pos=[];for(let i=0;i<v.positions.length;i+=3)pos.push(...B.Vector3.TransformCoordinates(V(...v.positions.slice(i,i+3)),m).asArray());append(k,pos,v.indices,v.uvs);}
  function beam(k,a,d,w){const v=B.VertexData.CreateBox({width:w,height:B.Vector3.Distance(a,d),depth:w}),r=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,d.subtract(a).normalize(),new B.Quaternion()),m=B.Matrix.Compose(V(1,1,1),r,a.add(d).scale(.5)),pos=[];for(let i=0;i<v.positions.length;i+=3)pos.push(...B.Vector3.TransformCoordinates(V(...v.positions.slice(i,i+3)),m).asArray());append(k,pos,v.indices,v.uvs);}
  function quad(k,a,d,e,f,uv){append(k,[...a,...d,...e,...f],[0,1,2,0,2,3],uv);}
  function slab(poly,lo,hi,k){const shape=poly.map(q=>V(q[0],0,q[1])),m=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-shell53',{shape,holes:(b.holes||[]).map(h=>h.map(q=>V(q[0],0,q[1]))),depth:hi-lo,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);m.position.y=hi;const sk='solid-'+k;if(!cache[sk]){const sm=new B.StandardMaterial('exterior53-'+sk,scene);sm.diffuseColor=B.Color3.FromHexString(palette[k]);sm.specularColor=new B.Color3(.025,.025,.025);cache[sk]=sm;}m.material=cache[sk];m.metadata={buildingId:id,labelSurfaceId49:id,solid15:true,exterior53:true};m.freezeWorldMatrix();return m;}
  const sign=p.reduce((s,q,i)=>s+q[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*q[1],0)>0?1:-1;
  function edge(i,poly=p){const a=poly[i],d=poly[(i+1)%poly.length],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx),pt=(t,o=0)=>[a[0]+dx*t+sign*dz/len*o,a[1]+dz*t-sign*dx/len*o];
   const bar=(k,t,y,w,h,dep=.18,o=.13)=>{const q=pt(t,o);box(k,q[0],y+h/2,q[1],w,h,dep,ang);};
   const face=(k,t,y,w,h,o=.055)=>{const q=pt(t-w/len/2,o),r=pt(t+w/len/2,o);quad(k,[q[0],y,q[1]],[r[0],y,r[1]],[r[0],y+h,r[1]],[q[0],y+h,q[1]],[0,0,w/6,0,w/6,h/6,0,h/6]);};
   const window=(t,y,w,h,frame='frame',depth=.32)=>{face('glass',t,y,w,h,.055);bar(frame,t,y-.09,w+.2,.10,depth,.16);bar(frame,t,y+h,w+.2,.1,depth,.16);for(const s of[-1,1])bar(frame,t+s*(w+.1)/len/2,y,.10,h,depth,.16);if(w>2.8)bar(frame,t,y,.065,h,.19,.17);if(h>3.6)bar(frame,t,y+h*.55,w,.06,.2,.17);};
   return{a,d,len,pt,bar,face,window};
  }
  function ribbon(e,lo,hi,spacing=3.8,k='frame',inset=.1){const n=Math.max(1,Math.round(e.len/spacing)),w=e.len/n;for(let j=0;j<n;j++)e.window((j+.5)/n,lo,w-inset,hi-lo,k);}
  function finish(top){for(const [k,g]of Object.entries(groups)){const m=new B.Mesh('building-'+b.id+'-detail-exterior53-'+k,scene),vd=new B.VertexData(),n=[];B.VertexData.ComputeNormals(g.p,g.i,n);vd.positions=g.p;vd.indices=g.i;vd.normals=n;vd.uvs=g.uv;vd.applyToMesh(m);m.material=material(k);m.metadata={buildingId:id,labelSurfaceId49:id,exterior53:true};m.freezeWorldMatrix();}b.base=base;b.top=top;b.facade53=true;b.heightRecord={groundDatum:datum,roofElevation:top,structureHeight:top-datum,uncertainty:'Existing model datum; facade depths and photo-relative proportions are design estimates'};return true;}
  if(id==='439687811'){
   const s=b.officialProfile,[cx,cz,ux,uz,zm,width]=s.roofFrame,vx=-uz,vz=ux,local=q=>[(q[0]-cx)*ux+(q[1]-cz)*uz,(q[0]-cx)*vx+(q[1]-cz)*vz],lp=p.map(local),amin=Math.min(...lp.map(q=>q[0])),amax=Math.max(...lp.map(q=>q[0])),span=amax-amin;
   const pos=s.roofVertices.map((v,i)=>i%3===1?v+datum:v),ix=s.roofIndices;
   const roofGroups={metal:{p:[],i:[]},glass:{p:[],i:[]}},ucuts=[amin-1,amin+span*.46,amin+span*.59,amax+1],vcut=zm-width*.365;
   function cut(poly,axis,value,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],d=poly[(i+1)%poly.length],av=local([a[0],a[2]])[axis],dv=local([d[0],d[2]])[axis],ia=greater?av>=value:av<=value,ib=greater?dv>=value:dv<=value;if(ia)out.push(a);if(ia!==ib){const t=(value-av)/(dv-av);out.push(a.map((v,k)=>v+(d[k]-v)*t));}}return out;}
   for(let i=0;i<ix.length;i+=3){const tri=ix.slice(i,i+3).map(j=>pos.slice(j*3,j*3+3));for(let u=0;u<3;u++)for(const side of[false,true]){let poly=cut(cut(cut(tri,0,ucuts[u],true),0,ucuts[u+1],false),1,vcut,side);if(poly.length<3)continue;const g=roofGroups[u===1||!side?'glass':'metal'],off=g.p.length/3;g.p.push(...poly.flat());for(let j=1;j<poly.length-1;j++)g.i.push(off,off+j,off+j+1);}}
   for(const[k,g]of Object.entries(roofGroups)){const m=new B.Mesh('building-'+b.id+'-roof-shell53-'+k,scene),vd=new B.VertexData(),norm=[];for(let i=0;i<g.p.length;i+=3){const v=Math.max(-.9999,Math.min(.9999,(local([g.p[i],g.p[i+2]])[1]-zm)/(width/2))),slope=-24*v/(width*Math.sqrt(1-v*v));norm.push(...V(slope*uz,1,-slope*ux).normalize().asArray());}vd.positions=g.p;vd.indices=g.i;vd.normals=norm;vd.uvs=Array(g.p.length/3*2).fill(0);vd.applyToMesh(m);m.material=material(k);m.metadata={buildingId:id,labelSurfaceId49:id,exterior53:true};m.freezeWorldMatrix();}
   const at=(a,t,r=0)=>V(cx+ux*a+vx*(zm+(width/2+r)*Math.cos(t)),datum+6.5+(12+r)*Math.sin(t),cz+uz*a+vz*(zm+(width/2+r)*Math.cos(t)));
   for(let a=amin;a<=amax+.01;a+=2.2){if(a>amin+span*.46&&a<amin+span*.59)continue;for(let j=0;j<32;j++)beam(j>24?'frame':'metal',at(a,Math.PI*j/32,.045),at(a,Math.PI*(j+1)/32,.045),j>24?.065:.085);}
   for(const a of[amin,amax,amin+span*.46,amin+span*.59])for(let j=0;j<32;j++)beam('frame',at(a,Math.PI*j/32,.055),at(a,Math.PI*(j+1)/32,.055),a===amin||a===amax?.16:.10);
   for(let j=1;j<12;j++)beam('frame',at(amin+span*.46,Math.PI*j/12,.06),at(amin+span*.59,Math.PI*j/12,.06),.065);
   for(const t of[2.40,2.62,2.84,3.06])beam('metal',at(amin,t,.06),at(amax,t,.06),.075);
   const level=(x,z)=>datum+6.5+12*Math.sqrt(Math.max(0,1-((-(x-cx)*uz+(z-cz)*ux-zm)/(width/2))**2));
   for(let i=0;i<p.length;i++){const e=edge(i),n=Math.ceil(e.len/2.7);for(let j=0;j<n;j++){const a=e.pt(j/n),d=e.pt((j+1)/n),ya=level(...a),yd=level(...d);quad('glass',[...a.slice(0,1),datum+1,a[1]],[d[0],datum+1,d[1]],[d[0],yd,d[1]],[a[0],ya,a[1]]);beam('frame',V(a[0],datum+1,a[1]),V(a[0],ya,a[1]),.09);}for(let y=datum+3;y<datum+18;y+=2.9){for(let j=0;j<n;j++){const a=e.pt(j/n,.06),d=e.pt((j+1)/n,.06);if(level(...a)>y&&level(...d)>y)beam('metal',V(a[0],y,a[1]),V(d[0],y,d[1]),.08);}}e.bar('stone',.5,base,e.len,datum+1-base,.16,0);}
   return finish(datum+18.5);
  }
  if(id==='439693757'){
   const low=b.id.endsWith('part1'),h=low?6.6:14.4,top=datum+h;slab(p,base,top,'stone');slab(p,top,top+.22,'roof');
   for(let i=0;i<p.length;i++){const e=edge(i);if(e.len<1)continue;e.face('stone',.5,datum,e.len,h-.18,.015);e.bar('dark',.5,top-.15,e.len,.4,.24,0);if(low&&e.len>34){ribbon(e,datum+.25,top-1.2,4.5);e.bar('white',.5,top-1.05,e.len,.55,.65,.15);}else if(!low&&e.len>60&&Math.abs(e.d[1]-e.a[1])<12){ribbon(e,top-2.6,top-.65,4.6);}}
   return finish(top+.22);
  }
  if(id==='386891006'){
   const top=datum+20;const cutEdge=edge(8),distance=q=>{const a=cutEdge.a,d=cutEdge.d,dx=d[0]-a[0],dz=d[1]-a[1];return -sign*((q[0]-a[0])*dz-(q[1]-a[1])*dx)/cutEdge.len;},clip=(greater)=>{const out=[];for(let i=0;i<p.length;i++){const a=p[i],d=p[(i+1)%p.length],av=distance(a),dv=distance(d),ia=greater?av>=9:av<=9,ib=greater?dv>=9:dv<=9;if(ia)out.push(a);if(ia!==ib){const t=(9-av)/(dv-av);out.push([a[0]+t*(d[0]-a[0]),a[1]+t*(d[1]-a[1])]);}}return out;};const wing=clip(false),main=clip(true);slab(main,base,top,'tile');slab(main,top,top+.15,'roof');slab(wing,base,datum+8.1,'tile');slab(wing,datum+8.1,datum+8.35,'roof');
   for(let i=0;i<p.length;i++){const e=edge(i),eh=distance(e.pt(.5))<9?8.1:20;e.face('tile',.5,datum,e.len,eh,.015);e.bar('white',.5,datum+eh-.3,e.len,.35,.55,0);if([0,1,2,3,4,5,7,8,12].includes(i)){e.bar('stone',.5,datum+7.6,e.len,.28,.4,.1);if([4,8,12].includes(i)){const n=Math.round(e.len/5);for(let j=0;j<n;j++){if(i===8&&j>1&&j<n-2)continue;e.window((j+.5)/n,datum+2.1,2.2,2.5);}}}}
   // Restrained canopy on the existing recessed facade; no new ground opening or stair.
   const e=edge(8),w=Math.min(30,e.len-1);e.bar('dark',.5,datum+6.25,w,.22,2.8,1.1);const q1=e.pt(.5-w/e.len/2,2.2),q2=e.pt(.5+w/e.len/2,2.2);for(let j=0;j<8;j++){const t=j/8,u=(j+1)/8,a=[q1[0]+(q2[0]-q1[0])*t,q1[1]+(q2[1]-q1[1])*t],d=[q1[0]+(q2[0]-q1[0])*u,q1[1]+(q2[1]-q1[1])*u];beam('metal',V(a[0],datum+5.4,a[1]),V((a[0]+d[0])/2,datum+6.2,(a[1]+d[1])/2),.1);beam('metal',V((a[0]+d[0])/2,datum+6.2,(a[1]+d[1])/2),V(d[0],datum+5.4,d[1]),.1);}e.face('glass',.5,datum+.3,w-1,4.7);for(let j=0;j<8;j++)e.bar('frame',.5+(j-3.5)*(w-1)/8/e.len,datum+.3,.11,4.7,.25,.17);
   return finish(top+.15);
  }
  if(id==='456356713'){
   const top=datum+19.5,inset=p.map(q=>[c[0]+(q[0]-c[0])*.92,c[1]+(q[1]-c[1])*.92]);slab(inset,base,datum+3.8,'glass');slab(p,datum+3.8,datum+15.1,'white');slab(p,datum+15.1,datum+19.1,'dark');slab(p,datum+19.1,top,'metal');
   for(let i=0;i<p.length;i++){const e=edge(i),n=Math.max(1,Math.round(e.len/3.8));for(let row=0;row<3;row++){for(let j=0;j<n;j++){const w=j%3===0?1.05:1.9;e.window((j+.5)/n,datum+4.65+row*3.7,w,2.8,'metal',.33);}e.bar('stone',.5,datum+3.8+row*3.7,e.len,.12,.18,.08);}for(let j=0;j<n;j++){e.window((j+.5)/n,datum+15.45,2.15,3.25,'frame',.24);e.bar('dark',(j+.06)/n,datum+15.1,.42,4,.42,.18);}const ground=edge(i,inset);ribbon(ground,datum+.1,datum+3.6,3.4,'frame');const cols=Math.round(e.len/7);for(let j=0;j<=cols;j++)e.bar('dark',j/cols,datum,.6,3.8,.6,0);}
   return finish(top);
  }
  const s=b.officialProfile,h=s.height,top=datum+h,isBrick=id==='386891016'||id==='439687809',wall=isBrick?'brick':id==='439687810'?'rubble':'stone';slab(p,base,top,wall);slab(p,top,top+.15,'roof');
  for(let i=0;i<p.length;i++){
   const e=edge(i);if(e.len<.5)continue;e.face(wall,.5,datum,e.len,h,.015);
   if(id==='439687810'){
    const front=i===1;for(let r=0;r<2;r++){const lo=datum+r*h/2+.25,hi=datum+(r+1)*h/2-.65;if(i===3)continue;const n=Math.max(1,Math.round(e.len/3.5));for(let j=0;j<n;j++){if(front&&j<Math.ceil(n*.4)||i===2&&r===0&&j<2)continue;e.window((j+.5)/n,lo,e.len/n-.22,hi-lo,'dark',.42);}e.bar('dark',.5,datum+(r+1)*h/2-.6,e.len,.62,.64,.2);}e.bar('dark',.5,top-.45,e.len+.3,.65,1.1,.14);if(front)for(const t of[.12,.38]){const q=e.pt(t,.23),vd=B.VertexData.CreateCylinder({height:h/2-.6,diameter:.42,tessellation:12}),pos=[];for(let n=0;n<vd.positions.length;n+=3)pos.push(vd.positions[n]+q[0],vd.positions[n+1]+datum+h*.75,vd.positions[n+2]+q[1]);append('dark',pos,vd.indices,vd.uvs);}
   }else if(id==='439687809'){
    // Preserve the stepped footprint; front protrusion keeps its original ground contact.
    const front=i===3;if(front){const w=e.len*.72;e.face('glass',.5,datum+.1,w,4.2);for(let j=0;j<4;j++)e.bar('metal',.5+(j-1.5)*w/4/e.len,datum+.1,.08,4.2,.24,.16);const a=e.pt(.14,.70),d=e.pt(.86,.70),aa=e.pt(.26,.10),dd=e.pt(.74,.10);quad('dark',[a[0],datum+4.3,a[1]],[d[0],datum+4.3,d[1]],[dd[0],datum+8.7,dd[1]],[aa[0],datum+8.7,aa[1]]);for(let r=2;r<5;r++)e.window(.5,datum+r*3.6+1,Math.max(2,e.len*.65),2.5,'metal',.42);}
    else{const n=Math.max(1,Math.round(e.len/5.4));for(let r=0;r<s.rows;r++){const y=datum+s.floorHeights.slice(0,r).reduce((a,b)=>a+b,0);for(let j=0;j<n;j++){const end=e.len<10;e.window((j+.5)/n,y+.95,e.len/n*(end?.38:.62),2.1,'metal',.38);}e.bar('white',.5,y+3.55,e.len,.2,.5,.14);}}
   }else if(id==='386891016'&&i===5){
    e.face('glass',.5,datum+3.5,e.len*.18,h-4);for(let y=datum+4.5;y<top;y+=4)e.bar('metal',.5,y,e.len*.18,.12,.22,.15);for(const t of[.32,.68]){e.face('dark',t,datum+3.5,e.len*.10,h-4.5);for(let y=datum+4.5;y<top-1;y+=4)e.bar('stone',t,y,e.len*.11,.18,.5,.14);}for(const t of[.20,.80]){const w=e.len*.34;for(let j=0;j<16;j++){const x0=-w/2+w*j/16,x1=-w/2+w*(j+1)/16,y0=top+.20+.42*(1-(2*x0/w)**2),y1=top+.20+.42*(1-(2*x1/w)**2),a=e.pt(t+x0/e.len,-.1),d=e.pt(t+x1/e.len,-.1),aa=e.pt(t+x0/e.len,-2.0),dd=e.pt(t+x1/e.len,-2.0);quad('metal',[a[0],y0,a[1]],[d[0],y1,d[1]],[dd[0],y1,dd[1]],[aa[0],y0,aa[1]]);} }
   }else{
    let y=datum;for(let r=0;r<s.rows;r++){const fh=s.floorHeights[r],endGlass=id==='167663930'&&[0,1,2,10,11].includes(i),n=Math.max(1,Math.round(e.len/s.windowSpacing)),ww=e.len/n*(endGlass?.96:s.style==='band'?.92:.58),wh=endGlass?fh-.5:1.85;for(let j=0;j<n;j++)e.window((j+.5)/n,y+(endGlass?.22:1.05),ww,wh,'metal',.3);if(id==='167663930')e.bar('white',.5,y+fh-.35,e.len,.32,endGlass?.35:1.05,.2);y+=fh;}
   }
   e.bar(id==='439687810'?'dark':'white',.5,top-.12,e.len+.1,.25,id==='167663930'?1.1:.65,.12);
  }
  return finish(top+.15);
 }
 function routes(world,nav){return [...ids].map(id=>{const a=nav.anchors[id],seen=new Set([a]),path=[world.points[a]],q=[];let at=a,length=0;while(length<14){const next=world.adj[at].filter(([i])=>!seen.has(i)).sort((a,b)=>a[1]-b[1])[0];if(!next)break;const[i,len]=next;seen.add(i);const prev=path.at(-1),end=world.points[i];if(length+len>18){const t=(18-length)/len;path.push([prev[0]+(end[0]-prev[0])*t,prev[1]+(end[1]-prev[1])*t]);break;}path.push(end);length+=len;at=i;}const coords=path.map(p=>p.slice(0,2)).reverse();return{zone:'local facade check',road:id,coords,startFeet:world.floorAt(...coords[0]),endFeet:world.floorAt(...coords.at(-1))};});}
 return{handles,build,routes};
})();
if(typeof module==='object')module.exports=Facades53;
