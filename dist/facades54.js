/* Scoped exterior schedules. Existing site polygons, arrival anchors and terrain are authoritative. */
const Facades54=(()=>{
 const ids=new Set(['relation/9741477','439687814','238937965','439687813','430291669','430291668','439687815','1542788687']);
 const handles=b=>ids.has(b.id.split('-part')[0]);
 function build(B,scene,b,height){
  if(!handles(b))return false;
  const id=b.id.split('-part')[0],V=(x,y,z)=>new B.Vector3(x,y,z),p=b.p,c=b.center,datum=b.siteDatum??height(...c),base=b.foundationDatum46??Math.min(...p.map(q=>height(...q)))-.7;
  const palette={stone:'#d4d0c2',brick:'#8e6d5c',white:'#dfdfd4',glass:'#72979b',frame:'#495d60',dark:'#414c50',roof:'#adb4b1',metal:'#bec9c8',tile:'#c2a16e',rubble:'#b3ac92'};
  const cache=scene._facades54Materials||(scene._facades54Materials={});
  function material(k){if(cache[k])return cache[k];const m=new B.StandardMaterial('exterior54-'+k,scene);m.diffuseColor=B.Color3.FromHexString(palette[k]);m.specularColor=k==='glass'?new B.Color3(.24,.28,.28):k==='metal'?new B.Color3(.25,.25,.25):new B.Color3(.03,.03,.03);m.backFaceCulling=false;m.metadata={facade53:true,facade54:true};
   if(['stone','brick','tile','rubble'].includes(k)){const t=new B.DynamicTexture('finish54-'+k,{width:512,height:512},scene,true),ctx=t.getContext();ctx.fillStyle=palette[k];ctx.fillRect(0,0,512,512);let seed=41;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);const rows=k==='brick'?32:k==='tile'?24:k==='rubble'?7:4,cols=k==='brick'?10:k==='tile'?12:k==='rubble'?6:3,h=512/rows,w=512/cols;
    for(let y=0;y<rows;y++)for(let x=-1;x<=cols;x++){const a=x*w+(y%2&&k!=='stone'?w/2:0),v=rand();ctx.fillStyle=v>.5?'rgba(255,255,250,.055)':'rgba(53,62,59,.045)';ctx.fillRect(a,y*h,w,h);ctx.strokeStyle=k==='brick'?'rgba(235,220,198,.24)':'rgba(75,80,72,.16)';ctx.lineWidth=k==='rubble'?2:1;ctx.strokeRect(a+.5,y*h+.5,w-1,h-1);}t.update();t.anisotropicFilteringLevel=4;t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;m.diffuseColor=B.Color3.White();m.diffuseTexture=t;
   }cache[k]=m;return m;
  }
  const groups={};
  function append(k,pos,ix,uv){const g=groups[k]||(groups[k]={p:[],i:[],uv:[]}),off=g.p.length/3;g.p.push(...pos);g.i.push(...ix.map(i=>i+off));g.uv.push(...(uv||Array(pos.length/3*2).fill(0)));}
  function box(k,x,y,z,w,h,d,angle=0){if(Math.min(w,h,d)<=0)return;const v=B.VertexData.CreateBox({width:w,height:h,depth:d}),m=B.Matrix.RotationY(angle).multiply(B.Matrix.Translation(x,y,z)),pos=[];for(let i=0;i<v.positions.length;i+=3)pos.push(...B.Vector3.TransformCoordinates(V(...v.positions.slice(i,i+3)),m).asArray());append(k,pos,v.indices,v.uvs);}
  function beam(k,a,d,w){const v=B.VertexData.CreateBox({width:w,height:B.Vector3.Distance(a,d),depth:w}),r=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,d.subtract(a).normalize(),new B.Quaternion()),m=B.Matrix.Compose(V(1,1,1),r,a.add(d).scale(.5)),pos=[];for(let i=0;i<v.positions.length;i+=3)pos.push(...B.Vector3.TransformCoordinates(V(...v.positions.slice(i,i+3)),m).asArray());append(k,pos,v.indices,v.uvs);}
  function quad(k,a,d,e,f,uv){append(k,[...a,...d,...e,...f],[0,1,2,0,2,3],uv);}
  function slab(poly,lo,hi,k){const shape=poly.map(q=>V(q[0],0,q[1])),m=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-shell54',{shape,holes:(b.holes||[]).map(h=>h.map(q=>V(q[0],0,q[1]))),depth:hi-lo,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);m.position.y=hi;const sk='solid-'+k;if(!cache[sk]){const sm=new B.StandardMaterial('exterior54-'+sk,scene);sm.diffuseColor=B.Color3.FromHexString(palette[k]);sm.specularColor=new B.Color3(.025,.025,.025);cache[sk]=sm;}m.material=cache[sk];m.metadata={buildingId:id,labelSurfaceId49:id,solid15:true,exterior54:true};m.freezeWorldMatrix();return m;}
  const sign=p.reduce((s,q,i)=>s+q[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*q[1],0)>0?1:-1;
  function edge(i,poly=p){const a=poly[i],d=poly[(i+1)%poly.length],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx),pt=(t,o=0)=>[a[0]+dx*t+sign*dz/len*o,a[1]+dz*t-sign*dx/len*o];
   const bar=(k,t,y,w,h,dep=.18,o=.13)=>{const q=pt(t,o);box(k,q[0],y+h/2,q[1],w,h,dep,ang);};
   const face=(k,t,y,w,h,o=.055)=>{const q=pt(t-w/len/2,o),r=pt(t+w/len/2,o);quad(k,[q[0],y,q[1]],[r[0],y,r[1]],[r[0],y+h,r[1]],[q[0],y+h,q[1]],[0,0,w/6,0,w/6,h/6,0,h/6]);};
   const window=(t,y,w,h,frame='frame',depth=.32)=>{face('glass',t,y,w,h,.055);bar(frame,t,y-.09,w+.2,.10,depth,.16);bar(frame,t,y+h,w+.2,.1,depth,.16);for(const s of[-1,1])bar(frame,t+s*(w+.1)/len/2,y,.10,h,depth,.16);if(w>2.8)bar(frame,t,y,.065,h,.19,.17);if(h>3.6)bar(frame,t,y+h*.55,w,.06,.2,.17);};
   return{a,d,len,pt,bar,face,window};
  }
  function ribbon(e,lo,hi,spacing=3.8,k='frame',inset=.1){const n=Math.max(1,Math.round(e.len/spacing)),w=e.len/n;for(let j=0;j<n;j++)e.window((j+.5)/n,lo,w-inset,hi-lo,k);}
  function finish(top){for(const [k,g]of Object.entries(groups)){const m=new B.Mesh('building-'+b.id+'-detail-exterior54-'+k,scene),vd=new B.VertexData(),n=[];B.VertexData.ComputeNormals(g.p,g.i,n);vd.positions=g.p;vd.indices=g.i;vd.normals=n;vd.uvs=g.uv;vd.applyToMesh(m);m.material=material(k);m.metadata={buildingId:id,labelSurfaceId49:id,exterior54:true};m.freezeWorldMatrix();}b.base=base;b.top=top;b.facade53=true;b.heightRecord={groundDatum:datum,roofElevation:top,structureHeight:top-datum,uncertainty:'Existing model datum; facade depths and photo-relative proportions are design estimates'};return true;}

  const s=b.officialProfile||{height:b.h,rows:3,floorHeights:[b.h/3,b.h/3,b.h/3],windowSpacing:4.4},h=s.height,top=datum+h;
  const brick=['relation/9741477','430291669','430291668','439687815'].includes(id),wall=brick?'brick':'stone';slab(p,base,top,wall);slab(p,top,top+.15,'roof');
  function punched(e,rows=s.rows,ratio=.58,k='frame'){const n=Math.max(1,Math.round(e.len/(s.windowSpacing||4))),fh=h/rows;for(let r=0;r<rows;r++)for(let j=0;j<n;j++)e.window((j+.5)/n,datum+r*fh+.8,e.len/n*ratio,Math.min(2.5,fh-1.25),k,.34);}
  function surround(e,t,y,w,hh,k='stone',d=.65){e.bar(k,t,y-.18,w+.5,.25,d,.3);e.bar(k,t,y+hh,w+.5,.3,d,.3);for(const v of[-1,1])e.bar(k,t+v*(w+.25)/e.len/2,y,.28,hh,d,.3);}
  for(let i=0;i<p.length;i++){
   const e=edge(i);if(e.len<.6)continue;e.face(wall,.5,datum,e.len,h,.015);
   if(id==='relation/9741477'){
    // The new/old hospital footprint correspondence is unconfirmed: retain the existing mass and brick schedule.
    punched(e,s.rows,.48,'metal');for(let r=1;r<s.rows;r++)e.bar('stone',.5,datum+r*h/s.rows-.2,e.len,.12,.22,.09);
   }else if(id==='439687814'){
    if(e.len>30){const n=Math.max(1,Math.round(e.len/4.3)),fh=h/4;for(let r=0;r<3;r++)for(let j=0;j<n;j++){e.window((j+.5)/n,datum+r*fh+.3,e.len/n*.54,fh-.65,'metal',.26);e.bar('white',(j+.82)/n,datum+r*fh+.25,e.len/n*.26,fh-.4,.22,.14);}e.bar('dark',.5,datum+h*.29,e.len,.5,.3,.12);for(let r=1;r<4;r++)e.bar('metal',.5,datum+r*fh-.05,e.len,.12,.45,.18);for(let j=0;j<n;j++)e.bar('metal',(j+.1)/n,datum+h*.77,.12,h*.23,.2,.12);}
    else{const n=Math.max(1,Math.round(e.len/10));for(let j=0;j<n;j++)for(let r=0;r<4;r++)e.window((j+.5)/n,datum+r*h/4+.5,.8,h/4-1,'frame',.24);}
   }else if(id==='238937965'){
    if(i===11){ribbon(e,datum+.25,top-.45,2.5,'frame');for(const t of[.03,.97])e.bar('stone',t,datum,.28,h,.65,.22);}
    else if(i===14){ribbon(e,datum+.3,datum+h*.4,3.3,'frame');const n=Math.max(1,Math.round(e.len/3.8));for(let r=3;r<s.rows;r++)for(let j=0;j<n;j++)e.window((j+.5)/n,datum+r*h/s.rows+.7,e.len/n*.62,2.4,'frame',.32);e.bar('white',.5,datum+h*.4,e.len,.3,.55,.18);}
    else punched(e,s.rows,.60,'frame');
   }else if(id==='439687813'){
    const low=h*.34,upper=h*.58;e.bar('dark',.5,top-h*.08,e.len,h*.08,.25,.1);
    if(i===3){ribbon(e,datum+.25,datum+low-.25,3.4,'frame');const w=e.len*.72,lo=datum+low+.6,hh=upper-.8;e.face('glass',.5,lo,w,hh);surround(e,.5,lo,w,hh,'stone',1.1);const n=7;for(let j=0;j<n;j++)e.bar('tile',.5+(j-(n-1)/2)*w/n/e.len,lo,.35,hh,.8,.38);}
    else if(i===2){ribbon(e,datum+.25,datum+low-.25,3.8,'metal');const n=Math.round(e.len/3.7),fh=upper/3;for(let r=0;r<3;r++)for(let j=0;j<n;j++){const y=datum+low+r*fh+.4;e.window((j+.5)/n,y,e.len/n*.48,fh-.7,'frame',.35);e.bar('tile',(j+.08)/n,y,.36,fh-.4,.65,.32);}for(let r=0;r<=3;r++)e.bar('stone',.5,datum+low+r*fh,e.len,.28,.72,.3);}
    else punched(e,s.rows,.48,'metal');
   }else if(id==='430291669'){
    const n=Math.max(1,Math.round(e.len/6.4)),fh=h/s.rows;for(let r=0;r<s.rows;r++){for(let j=0;j<n;j++)e.window((j+.5)/n,datum+r*fh+.8,e.len/n*.72,fh-1.3,'frame',.32);e.bar('white',.5,datum+(r+1)*fh-.18,e.len,.10,.22,.10);}
    // Unverified arch and bridge directions are not inferred from a generated image.
   }else if(id==='430291668'){
    const fh=h/s.rows,n=Math.max(1,Math.round(e.len/3.6));if([0,5,3].includes(i)){for(let r=0;r<s.rows;r++)for(let j=0;j<n;j++){e.window((j+.5)/n,datum+r*fh+.25,e.len/n-.14,fh*.65,'metal',.25);e.bar('white',(j+.5)/n,datum+r*fh+fh*.72,e.len/n-.14,fh*.22,.20,.11);}for(let r=0;r<s.rows;r++)e.bar('metal',.5,datum+r*fh,e.len,.12,.45,.2);e.bar('brick',.5,top-.8,e.len,.8,.3,.08);}
    else punched(e,s.rows,.52,'metal');
   }else if(id==='439687815'){
    if(i===0){const n=9,fh=h/5;for(let r=0;r<5;r++){for(let j=0;j<n;j++){const recessed=(j===3&&r===2)||(j===5&&r===4)||((j===6||j===7)&&(r===2||r===3));if(!recessed)e.window((j+.5)/n,datum+r*fh+.25,e.len/n*.84,fh*.66,'metal',.3);}if(r===2){const a=(7-.83)/9,b=(7+.83)/9;e.bar('white',a/2,datum+(r+1)*fh-.25,e.len*a,.23,.52,.22);e.bar('white',(1+b)/2,datum+(r+1)*fh-.25,e.len*(1-b),.23,.52,.22);}else e.bar('white',.5,datum+(r+1)*fh-.25,e.len,.23,.52,.22);}for(const q of[[3,2,1,1],[5,4,1,1],[6.5,2,2,2]]){const[j,r,wide,high]=q,t=(j+.5)/n,w=e.len/n*wide*.83,lo=datum+r*fh+.2,hh=fh*high-.65;e.face('dark',t,lo,w,hh,.055);surround(e,t,lo,w,hh,'stone',.85);e.bar('metal',t,lo+.85,w,.06,.14,.4);e.bar('metal',t,lo+.4,w,.045,.14,.4);}for(let j=0;j<=n;j+=3)e.bar('white',j/n,datum,.25,h,.50,.20);}
    else punched(e,s.rows,e.len<25?.38:.64,'metal');
   }else if(id==='1542788687'){
    if(i===5){const fh=h/3;for(let r=0;r<3;r++)for(let j=0;j<4;j++)e.window(.08+j*.11,datum+r*fh+.8,1.15,fh-1.1,'frame',.5);e.window(.59,datum+.2,e.len*.13,h-.7,'metal',.35);const t=.84,w=e.len*.24,lo=datum+h*.27,hh=h*.65;e.face('glass',t,lo,w,hh,.055);surround(e,t,lo,w,hh,'stone',1.0);for(let j=1;j<4;j++)e.bar('metal',t+(j-2)*w/4/e.len,lo,.08,hh,.18,.16);for(let j=1;j<3;j++)e.bar('metal',t,lo+hh*j/3,w,.10,.22,.16);e.window(t,datum+.25,w,lo-datum-.5,'metal',.3);}
    else punched(e,3,.50,'frame');
   }
   e.bar('white',.5,top-.12,e.len,.25,.38,.14);
  }
  return finish(top+.15);
 }
 function routes(world,nav){return [...ids].map(id=>{const a=nav.anchors[id],seen=new Set([a]),path=[world.points[a]];let at=a,length=0;while(length<14){const next=world.adj[at].filter(([i])=>!seen.has(i)).sort((a,b)=>a[1]-b[1])[0];if(!next)break;const[i,len]=next;seen.add(i);const prev=path.at(-1),end=world.points[i];if(length+len>18){const t=(18-length)/len;path.push([prev[0]+(end[0]-prev[0])*t,prev[1]+(end[1]-prev[1])*t]);break;}path.push(end);length+=len;at=i;}const coords=path.map(p=>p.slice(0,2)).reverse();return{zone:'local facade check',road:id,coords,startFeet:world.floorAt(...coords[0]),endFeet:world.floorAt(...coords.at(-1))};});}
 return{handles,build,routes};
})();
if(typeof module==='object')module.exports=Facades54;
