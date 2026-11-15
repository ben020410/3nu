/* Scoped exterior schedules. Existing site polygons, arrival anchors and terrain are authoritative. */
const Facades63=(()=>{
 const ids=new Set(['238937635','193893590','297047750']);
 const handles=b=>['238937635','193893590'].includes(b.id);
 function build(B,scene,b,height){
  if(!handles(b))return false;
  const id=b.id.split('-part')[0],V=(x,y,z)=>new B.Vector3(x,y,z),p=b.p,c=b.center,datum=b.siteDatum??height(...c),base=b.foundationDatum46??Math.min(...p.map(q=>height(...q)))-.7;
  const palette={stone:'#d4d5ce',brick:'#9b8066',wood:'#a68c67',woodLight:'#b39b77',panel:'#c4c8c4',redbrick:'#635a54',peach:'#c7b1a0',frost:'#b5c9c6',teal:'#6d9499',smoke:'#6c7a7c',blue:'#5c8097',brown:'#675b55',silver:'#d1d5d2',white:'#dfdfd4',glass:'#587981',frame:'#495d61',dark:'#414c50',roof:'#adb4b1',metal:'#bec9c8',tile:'#c2a16e',rubble:'#b3ac92'};
  const cache=scene._facades63Materials||(scene._facades63Materials={});
  function material(k){if(cache[k])return cache[k];const m=new B.StandardMaterial('exterior63-'+k,scene);m.diffuseColor=B.Color3.FromHexString(palette[k]);m.specularColor=k==='glass'?new B.Color3(.24,.28,.28):k==='metal'?new B.Color3(.25,.25,.25):new B.Color3(.03,.03,.03);m.backFaceCulling=false;m.metadata={facade53:true,facade63:true};
   if(['stone','brick','redbrick','silver','tile','rubble'].includes(k)){const t=new B.DynamicTexture('finish63-'+k,{width:512,height:512},scene,true),ctx=t.getContext();ctx.fillStyle=palette[k];ctx.fillRect(0,0,512,512);let seed=41;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);const rows=(k==='brick'||k==='redbrick')?32:k==='tile'?24:k==='rubble'?7:4,cols=(k==='brick'||k==='redbrick')?10:k==='tile'?12:k==='rubble'?6:3,h=512/rows,w=512/cols;
    for(let y=0;y<rows;y++)for(let x=-1;x<=cols;x++){const a=x*w+(y%2&&k!=='stone'?w/2:0),v=rand();ctx.fillStyle=v>.5?'rgba(255,255,250,.055)':'rgba(53,62,59,.045)';ctx.fillRect(a,y*h,w,h);ctx.strokeStyle=(k==='brick'||k==='redbrick')?'rgba(235,220,198,.24)':'rgba(75,80,72,.16)';ctx.lineWidth=k==='rubble'?2:1;ctx.strokeRect(a+.5,y*h+.5,w-1,h-1);}t.update();t.anisotropicFilteringLevel=4;t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;m.diffuseColor=B.Color3.White();m.diffuseTexture=t;
   }cache[k]=m;return m;
  }
  const groups={};
  function append(k,pos,ix,uv){const g=groups[k]||(groups[k]={p:[],i:[],uv:[]}),off=g.p.length/3;g.p.push(...pos);g.i.push(...ix.map(i=>i+off));g.uv.push(...(uv||Array(pos.length/3*2).fill(0)));}
  function box(k,x,y,z,w,h,d,angle=0){if(Math.min(w,h,d)<=0)return;const v=B.VertexData.CreateBox({width:w,height:h,depth:d}),m=B.Matrix.RotationY(angle).multiply(B.Matrix.Translation(x,y,z)),pos=[];for(let i=0;i<v.positions.length;i+=3)pos.push(...B.Vector3.TransformCoordinates(V(...v.positions.slice(i,i+3)),m).asArray());append(k,pos,v.indices,v.uvs);}
  function beam(k,a,d,w){const v=B.VertexData.CreateBox({width:w,height:B.Vector3.Distance(a,d),depth:w}),r=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,d.subtract(a).normalize(),new B.Quaternion()),m=B.Matrix.Compose(V(1,1,1),r,a.add(d).scale(.5)),pos=[];for(let i=0;i<v.positions.length;i+=3)pos.push(...B.Vector3.TransformCoordinates(V(...v.positions.slice(i,i+3)),m).asArray());append(k,pos,v.indices,v.uvs);}
  function quad(k,a,d,e,f,uv){append(k,[...a,...d,...e,...f],[0,1,2,0,2,3],uv);}
  function slab(poly,lo,hi,k){const shape=poly.map(q=>V(q[0],0,q[1])),m=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-shell63',{shape,holes:(b.holes||[]).map(h=>h.map(q=>V(q[0],0,q[1]))),depth:hi-lo,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);m.position.y=hi;const sk='solid-'+k;if(!cache[sk]){const sm=new B.StandardMaterial('exterior63-'+sk,scene);sm.diffuseColor=B.Color3.FromHexString(palette[k]);sm.specularColor=new B.Color3(.025,.025,.025);cache[sk]=sm;}m.material=cache[sk];m.metadata={buildingId:id,labelSurfaceId49:id,solid15:true,exterior63:true};m.freezeWorldMatrix();return m;}
  const sign=p.reduce((s,q,i)=>s+q[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*q[1],0)>0?1:-1;
  function edge(i,poly=p){const a=poly[i],d=poly[(i+1)%poly.length],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx),pt=(t,o=0)=>[a[0]+dx*t+sign*dz/len*o,a[1]+dz*t-sign*dx/len*o];
   const bar=(k,t,y,w,h,dep=.18,o=.13)=>{const q=pt(t,o);box(k,q[0],y+h/2,q[1],w,h,dep,ang);};
   const face=(k,t,y,w,h,o=.055)=>{const q=pt(t-w/len/2,o),r=pt(t+w/len/2,o);quad(k,[q[0],y,q[1]],[r[0],y,r[1]],[r[0],y+h,r[1]],[q[0],y+h,q[1]],[0,0,w/6,0,w/6,h/6,0,h/6]);};
   const window=(t,y,w,h,frame='frame',depth=.32)=>{face('glass',t,y,w,h,.055);bar(frame,t,y-.09,w+.2,.10,depth,.16);bar(frame,t,y+h,w+.2,.1,depth,.16);for(const s of[-1,1])bar(frame,t+s*(w+.1)/len/2,y,.10,h,depth,.16);if(w>2.8)bar(frame,t,y,.065,h,.19,.17);if(h>3.6)bar(frame,t,y+h*.55,w,.06,.2,.17);};
   return{a,d,len,pt,bar,face,window};
  }
  function ribbon(e,lo,hi,spacing=3.8,k='frame',inset=.1){const n=Math.max(1,Math.round(e.len/spacing)),w=e.len/n;for(let j=0;j<n;j++)e.window((j+.5)/n,lo,w-inset,hi-lo,k);}
  function finish(top){for(const [k,g]of Object.entries(groups)){const m=new B.Mesh('building-'+b.id+'-detail-exterior63-'+k,scene),vd=new B.VertexData(),n=[];B.VertexData.ComputeNormals(g.p,g.i,n);vd.positions=g.p;vd.indices=g.i;vd.normals=n;vd.uvs=g.uv;vd.applyToMesh(m);m.material=material(k);m.metadata={buildingId:id,labelSurfaceId49:id,exterior63:true};m.freezeWorldMatrix();}b.base=base;b.top=top;b.facade53=true;b.heightRecord={groundDatum:datum,roofElevation:top,structureHeight:top-datum,uncertainty:'Existing model datum; facade depths and photo-relative proportions are design estimates'};return true;}

  const h=b.h,top=datum+h,rows=Math.max(1,Math.round(h/4)),fh=h/rows,natural=id==='238937635',wall=natural?'redbrick':'panel';
  slab(p,base,top,wall);slab(p,top,top+.1,'roof');
  for(let i=0;i<p.length;i++){
   const e=edge(i);if(e.len<2)continue;e.face(wall,.5,datum,e.len,h,.015);
   // Widened end of the existing footprint; no alteration to its base or opening policy.
   if(!natural && [0,9,10].includes(i)){
    e.face('panel',.5,datum,e.len,h,.04);
    for(const t of [.08,.50,.92]){const ww=Math.min(e.len*.13,2.6);e.face('blue',t,datum+.3,ww,h-.8,.06);for(let row=1;row<rows;row++)e.bar('metal',t,datum+row*fh,ww,.10,.27,.16);e.bar('metal',t-ww/e.len/2,datum+.3,.08,h-.8,.22,.16);e.bar('metal',t+ww/e.len/2,datum+.3,.08,h-.8,.22,.16);}
    e.bar('metal',.5,top-.10,e.len,.16,.40,.16);continue;
   }
   const n=Math.max(1,Math.round(e.len/3.8)),bay=e.len/n;
   for(let row=0;row<rows;row++){
    const y=datum+row*fh;
    for(let j=0;j<n;j++){const t=(j+.5)/n;e.window(t,y+.8,bay*.70,fh*.54,natural?'metal':'frame',.3);}
    e.bar('stone',.5,y+fh-.28,e.len,.28,.4,.18);
   }
   for(let j=0;j<=n;j++)e.bar('stone',j/n,datum,.15,h,.38,.18);
   e.bar('stone',.5,top-.12,e.len,.15,.48,.2);
  }
  return finish(top+.15);
 }
 function routes(world,nav){return [...ids].map(id=>{const a=nav.anchors[id],seen=new Set([a]),path=[world.points[a]];let at=a,length=0;while(length<14){const next=world.adj[at].filter(([i])=>!seen.has(i)).sort((a,b)=>a[1]-b[1])[0];if(!next)break;const[i,len]=next;seen.add(i);const prev=path.at(-1),end=world.points[i];if(length+len>18){const t=(18-length)/len;path.push([prev[0]+(end[0]-prev[0])*t,prev[1]+(end[1]-prev[1])*t]);break;}path.push(end);length+=len;at=i;}const coords=path.map(p=>p.slice(0,2)).reverse();return{zone:'local facade check',road:id,coords,startFeet:world.floorAt(...coords[0]),endFeet:world.floorAt(...coords.at(-1))};});}
 return{handles,build,routes};
})();
if(typeof module==='object')module.exports=Facades63;
