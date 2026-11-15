/* BUILD09 individual massing. Measured identity, photo-informed form, estimated dimensions. */
function buildReviewBuilding(B,scene,b,height){
 if(b.pungsan13)return buildPungsan(B,scene,b,height);
 const V=(x,y,z)=>new B.Vector3(x,y,z),kind=b.reviewModel,groups=new Map(),p=b.p,c=b.center,datum=b.fixedDatum21??height(...c),base=b.fixedDatum21!=null?b.fixedDatum21-.6:Math.min(...p.map(q=>height(...q)))-.6;
 const mat=(n,color,alpha=1)=>{const m=new B.StandardMaterial('review-'+b.id+'-'+n,scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=n==='glass'?new B.Color3(.3,.35,.35):new B.Color3(.03,.03,.03);m.alpha=alpha;return m};
 const white=mat('white','#deded5'),glass=mat('glass','#577278'),dark=mat('stone','#656f70'),brick=mat('brick','#786b60'),metal=mat('metal','#c5c6bb'),wood=mat('wood','#a18b61');
 let u=kind.startsWith('science18')||kind.startsWith('science19')||kind==='scienceConnector'?[-.09,.9959418]:kind==='apartmentF'?[.80,.60]:kind==='coway945'?[.755,-.656]:kind==='samsung944'?[.739,.674]:kind==='power330'?[0,1]:kind==='garage331'?[0,1]:kind==='lecture28'?[.951,-.309]:kind==='science500head'?[.28,.96]:kind==='science500wing'?[.988,.154]:kind==='engineer310'?[0,1]:kind==='sports71'?[.373,-.928]:kind==='haedong'?[.25,-.9682458]:kind==='physics'?[.946,-.324]:kind==='administration09'?[.721,.693]:kind==='pungsan'?[1,0]:[.743,.669];const v=[-u[1],u[0]],local=q=>[(q[0]-c[0])*u[0]+(q[1]-c[1])*u[1],(q[0]-c[0])*v[0]+(q[1]-c[1])*v[1]],at=(a,d)=>[c[0]+u[0]*a+v[0]*d,c[1]+u[1]*a+v[1]*d],lp=p.map(local),umin=Math.min(...lp.map(q=>q[0])),umax=Math.max(...lp.map(q=>q[0])),vmin=Math.min(...lp.map(q=>q[1])),vmax=Math.max(...lp.map(q=>q[1]));
 function clip(poly,axis,limit,greater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],d=poly[(i+1)%poly.length],av=local(a)[axis],dv=local(d)[axis],ia=greater?av>=limit:av<=limit,ib=greater?dv>=limit:dv<=limit;if(ia)out.push(a);if(ia!==ib){const t=(limit-av)/(dv-av);out.push([a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t]);}}return out;}
 function portion(a0,a1,d0=vmin,d1=vmax){return clip(clip(clip(clip(p,0,a0,true),0,a1,false),1,d0,true),1,d1,false);}
 const add=(m,material)=>{m.material=material;if(!groups.has(material))groups.set(material,[]);groups.get(material).push(m);return m};
 function slab(name,poly,lo,hi,material){if(poly.length<3||hi<=lo)return;const m=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-'+name,{shape:poly.map(q=>V(q[0],0,q[1])),depth:hi-lo,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);m.position.y=hi;return add(m,material);}
 function bar(name,a,d,y,h,w,material){const m=B.MeshBuilder.CreateBox('building-'+b.id+'-'+name,{width:Math.hypot(d[0]-a[0],d[1]-a[1]),height:h,depth:w},scene);m.position=V((a[0]+d[0])/2,y+h/2,(a[1]+d[1])/2);m.rotation.y=-Math.atan2(d[1]-a[1],d[0]-a[0]);return add(m,material);}
 function facade(poly,lo,rows,fh,spacing,ww,wh,system='punched'){
 const area=poly.reduce((s,q,i)=>s+q[0]*poly[(i+1)%poly.length][1]-poly[(i+1)%poly.length][0]*q[1],0),sign=area>0?1:-1;
 for(let e=0;e<poly.length;e++){const a=poly[e],d=poly[(e+1)%poly.length],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz);if(len<2)continue;const pt=(t,o)=>[a[0]+dx*t+sign*dz/len*o,a[1]+dz*t-sign*dx/len*o],count=Math.max(1,Math.round(len/spacing));
 for(let row=0;row<rows;row++){const y=lo+row*fh;if(system==='curtain'){bar('curtain',pt(.01,.04),pt(.99,.04),y+.2,fh-.35,.12,glass);bar('transom',pt(0,.16),pt(1,.16),y+fh-.14,.14,.15,metal);}else for(let j=0;j<count;j++){const t=(j+.5)/count,half=Math.min(ww/2,len/count*.37)/len;bar('window',pt(t-half,.07),pt(t+half,.07),y+.8,wh,.16,glass);bar('reveal',pt(t-half-.07/len,.13),pt(t+half+.07/len,.13),y+.65,.15,.3,metal);}
 }
 if(system==='curtain')for(let j=0;j<=count;j++)bar('mullion',pt(Math.max(0,j/count-.06/len),.18),pt(Math.min(1,j/count+.06/len),.18),lo,rows*fh,.16,metal);
 }}
 let top=datum+b.h;
 if(kind==='scienceConnector'){
 slab('white-connector',p,base,datum+11.7,white);facade(p,datum+.4,3,3.8,2,1.6,2.4,'curtain');slab('connector-roof',p,datum+11.7,datum+12,metal);top=datum+12;
 }else if(kind==='science18'||kind==='science19'){
 brick.diffuseColor=B.Color3.FromHexString('#a46953');const eighteen=kind==='science18',h=b.h,rows=eighteen?5:4,fh=(h-.8)/rows;slab('brick-mass',p,base,datum+h-.3,brick);slab('flat-roof-cap',p,datum+h-.3,datum+h,metal);
 const columns=eighteen?16:10,step=(umax-umin)/columns,stair=(umin+umax)/2;
 for(const side of [vmax+.12,vmin-.12]){
 const back=side<vmin;
 for(let j=0;j<columns;j++){const x=umin+(j+.5)*step;if(eighteen&&Math.abs(x-stair)<step*1.1)continue;
 for(let r=0;r<rows;r++){
 const topRow=r>=rows-(eighteen?2:1),y=datum+r*fh+(topRow?.65:1.35),wh=r===0?1.05:fh-(topRow?1.3:1.6),w=step*(eighteen?.66:.77);
 if(!topRow)bar('white-spandrel',at(x-w/2,side),at(x+w/2,side),datum+r*fh,1.35,.2,white);
 if(!eighteen&&topRow){for(const d of [-w*.26,w*.26])bar('paired-top-window',at(x+d-w*.22,side),at(x+d+w*.22,side),y,wh,.18,glass);}
 else bar('facade-window',at(x-w/2,side),at(x+w/2,side),y,wh,.18,glass);
 bar('deep-window-lintel',at(x-w/2-.08,side),at(x+w/2+.08,side),y+wh+.08,.12,.36,dark);bar('window-centre-mullion',at(x-.035,side),at(x+.035,side),y,wh,.25,metal);
 }
 }
 if(eighteen){bar('central-stair-glass',at(stair-step,side),at(stair+step,side),datum+.2,h-1.2,.3,glass);for(let y=1;y<h-1;y+=1.4)bar('stair-transom',at(stair-step,side),at(stair+step,side),datum+y,.075,.36,dark);for(let x=stair-step;x<=stair+step;x+=1.2)bar('stair-mullion',at(x-.035,side),at(x+.035,side),datum+.2,h-1.2,.36,dark);}
 if(!back){bar('entrance-canopy',at(stair-3.5,side+.8),at(stair+3.5,side+.8),datum+3.1,.5,2.2,white);bar('entrance-glass',at(stair-2,side+.12),at(stair+2,side+.12),datum,3.1,.2,glass);}
 }
 if(eighteen){for(const range of [[umin+1,umin+12],[umax-12,umax-1]]){slab('solar-roof',portion(range[0],range[1],vmin+1,vmax-1),datum+h+.03,datum+h+.1,dark);for(let x=range[0];x<range[1];x+=1.8)bar('solar-roof-frame',at(x,vmin+1),at(x,vmax-1),datum+h+.11,.04,.05,metal);}}
 top=datum+h;
 }else if(kind==='warehouse506'){
 slab('concrete-store',p,base,datum+3.6,metal);slab('flat-roof',p,datum+3.6,datum+3.75,white);
 for(let e=0;e<p.length;e++){const a=p[e],z=p[(e+1)%p.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);for(let y=.2;y<1;y+=.18)bar('roof-horizontal-screen',a,z,datum+3.6+y,.08,.12,white);if(len>15){const q=t=>[a[0]+(z[0]-a[0])*t,a[1]+(z[1]-a[1])*t-.1];bar('metal-door',q(.68),q(.79),datum+.05,2.5,.2,dark);bar('door-seam',q(.734),q(.736),datum+.05,2.5,.24,metal);}}
 const a=p[3],z=p[2],dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz),q=t=>[a[0]+dx*t,a[1]+dz*t-.3];for(const t of [.05,.085])bar('ladder-side',q(t-.002),q(t+.002),datum,4.3,.07,dark);for(let y=.3;y<4.3;y+=.32)bar('ladder-rung',q(.05),q(.085),datum+y,.045,.09,dark);top=datum+4.6;
 }else if(kind==='apartmentF'){
 glass.diffuseColor=B.Color3.FromHexString('#829c9d');const split=umax-9,high=portion(umin,split),low=portion(split,umax);
 slab('high-block',high,base,datum+18.4,white);slab('lower-roadside-block',low,base,datum+15.3,white);slab('high-overhang',high,datum+18.4,datum+18.8,dark);slab('lower-overhang',low,datum+15.3,datum+15.7,dark);
 for(let e=0;e<p.length;e++){const a=p[e],z=p[(e+1)%p.length],dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz);const pt=(t,o=.14)=>[a[0]+dx*t+dz/len*o,a[1]+dz*t-dx/len*o],count=Math.max(2,Math.round(len/4.6));
 for(let j=0;j<count;j++){const t=(j+.5)/count,lowPart=local(pt(t,0))[0]>split;for(let r=0;r<(lowPart?4:5);r++){const y=datum+2.7+r*3.1,half=.43/count;bar('balcony-glazing',pt(t-half),pt(t+half),y,2.55,.16,glass);bar('white-transom',pt(t-half,.3),pt(t+half,.3),y-.18,.18,.4,white);for(const side of [-1,1])bar('white-pier',pt(t+side*half-.004,.28),pt(t+side*half+.004,.28),y,2.9,.4,white);bar('glass-mullion',pt(t-.002,.34),pt(t+.002,.34),y,2.55,.1,metal);bar('balcony-railing',pt(t-half,.53),pt(t+half,.53),y+.9,.06,.08,dark);}}
 }
 top=datum+18.8;
 }else if(kind==='apartmentD'){
 brick.diffuseColor=B.Color3.FromHexString('#9b8a72');glass.diffuseColor=B.Color3.FromHexString('#8ca9aa');
 slab('lower-brick',p,base,datum+12.8,brick);slab('upper-pale',p,datum+12.8,datum+19.1,white);slab('flat-roof',p,datum+19.1,datum+19.5,metal);
 const a=p[2],z=p[3],dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz),pt=(t,o=.12)=>[a[0]+dx*t+dz/len*o,a[1]+dz*t-dx/len*o];
 bar('garage-recess',pt(.36),pt(.75),datum+.1,3,.18,dark);bar('garage-lintel',pt(.32,.28),pt(.79,.28),datum+3.05,.3,.6,white);
 for(let row=0;row<5;row++){
 const y=datum+3.65+row*3.1;
 for(const [i,t]of [.12,.36,.60,.85].entries()){
 if(row===0&&i!==2)continue;
 const half=(i===1?.057:.102);bar('glazed-opening',pt(t-half,.17),pt(t+half,.17),y,2.35,.15,glass);
 bar('window-sill',pt(t-half,.28),pt(t+half,.28),y-.13,.13,.4,white);
 bar('window-mullion',pt(t-.003,.31),pt(t+.003,.31),y,2.35,.15,white);
 if(i!==1&&row>0){bar('balcony-slab',pt(t-half,.55),pt(t+half,.55),y-.2,.2,1,metal);bar('balcony-handrail',pt(t-half,1.05),pt(t+half,1.05),y+.92,.065,.07,dark);for(let j=0;j<=12;j++){const tt=t-half+2*half*j/12;bar('balcony-rail',pt(tt-.0015,1.05),pt(tt+.0015,1.05),y,.92,.045,dark);}}
 }
 }
 // Unseen sides remain restrained estimates, separately documented.
 for(let e=0;e<2;e++){const aa=p[e],zz=p[e+1],l=Math.hypot(zz[0]-aa[0],zz[1]-aa[1]);if(l<20)continue;for(let t=.12;t<.95;t+=.18)for(let r=0;r<5;r++){const q=x=>[aa[0]+(zz[0]-aa[0])*x-.1,aa[1]+(zz[1]-aa[1])*x];bar('unverified-side-window',q(t-.045),q(t+.045),datum+3.7+r*3.1,2.2,.16,glass);}}
 top=datum+19.5;
 }else if(kind==='cowayFountain'){
 const water=mat('water','#5c9daa');slab('pool-base',p,base,datum+.55,white);for(let i=0;i<p.length;i++)bar('pool-rim',p[i],p[(i+1)%p.length],datum+.55,.16,.3,white);const inner=p.map(q=>[c[0]+(q[0]-c[0])*.89,c[1]+(q[1]-c[1])*.89]);slab('water',inner,datum+.56,datum+.64,water);
 const r=3.4,apex=V(c[0],datum+5.5,c[1]),ring=Array.from({length:6},(_,i)=>V(c[0]+r*Math.cos(i*Math.PI/3),datum+.7,c[1]+r*Math.sin(i*Math.PI/3)));
 const pos=[],ix=[],uv=[];for(let i=0;i<6;i++){const k=pos.length/3;for(const q of [ring[i],ring[(i+1)%6],apex])pos.push(...q.asArray());ix.push(k,k+1,k+2);uv.push(0,0,1,0,.5,1);add(B.MeshBuilder.CreateTube('building-'+b.id+'-pyramid-frame',{path:[ring[i],apex],radius:.07,tessellation:5},scene),dark);}const m=new B.Mesh('building-'+b.id+'-pyramid-glazing',scene),vd=new B.VertexData(),norm=[];B.VertexData.ComputeNormals(pos,ix,norm);vd.positions=pos;vd.indices=ix;vd.normals=norm;vd.uvs=uv;vd.applyToMesh(m);glass.backFaceCulling=false;add(m,glass);top=datum+5.5;
 }else if(kind==='coway945'){
 brick.diffuseColor=B.Color3.FromHexString('#8d5746');glass.diffuseColor=B.Color3.FromHexString('#74a7b3');slab('brick-volume',p,base,datum+b.h,brick);
 const front=umin-.12,len=vmax-vmin,mid0=vmin+len*.38,mid1=vmin+len*.59;
 bar('central-glass',at(front,mid0),at(front,mid1),datum+.9,b.h-2,.18,glass);
 for(let y=3;y<b.h-1;y+=3.9)bar('central-floor',at(front-.12,mid0),at(front-.12,mid1),datum+y,.18,.2,metal);
 for(let d=mid0;d<mid1;d+=2.5)bar('central-mullion',at(front-.15,d-.045),at(front-.15,d+.045),datum+.9,b.h-2,.12,metal);
 for(const [i,t]of [.09,.20,.31,.76,.90].entries()){
  const paths=[];for(let j=0;j<=24;j++){const y=b.h*j/24,curve=Math.pow(Math.max(0,1-y/12),2)*(i<2?-.9:.8),dd=vmin+t*len+curve,aa=at(front-.02,dd-.42),bb=at(front-.02,dd+.42);paths.push([V(aa[0],datum+y,aa[1]),V(bb[0],datum+y,bb[1])]);}add(B.MeshBuilder.CreateRibbon('building-'+b.id+'-curved-glass-ribbon',{pathArray:paths,sideOrientation:B.Mesh.DOUBLESIDE},scene),glass);
 }
 slab('roof-green-zone',portion(umin+1,umax-1,vmin+1,vmax-1),datum+b.h,datum+b.h+.08,mat('roof','#83a292'));slab('roof-deck',portion(umax-12,umax-1,vmin+1,vmax-1),datum+b.h+.09,datum+b.h+.16,wood);slab('roof-dark-inset',portion(umin+12,umax-12,vmin+4,vmin+14),datum+b.h+.1,datum+b.h+.18,dark);
 bar('entrance-canopy',at(front-1,mid0-1),at(front-1,mid1+1),datum+3.5,.35,2.5,white);top=datum+b.h+.18;
 }else if(kind==='samsung944'){
 brick.diffuseColor=B.Color3.FromHexString('#a87754');const lower=portion(umin,umax),south=portion(umin,umin+55),north=portion(umax-32,umax),garden=portion(umin+55,umax-32);
 slab('connected-podium',lower,base,datum+9.2,glass);facade(lower,datum,2,4.6,3.1,2.2,3.4,'curtain');slab('podium-overhang',lower,datum+8.9,datum+9.5,dark);slab('roof-garden-terrace',garden,datum+9.5,datum+9.6,white);slab('roof-garden-planting',portion(umin+58,umax-35,vmin+3,vmax-3),datum+9.61,datum+9.68,mat('roof-garden','#91a26c'));
 for(const [poly,tag]of [[south,'south'],[north,'north']]){
  slab(tag+'-tower',poly,datum+9.2,datum+39.8,glass);facade(poly,datum+9.2,8,3.825,3.2,2.3,2.5,'curtain');slab(tag+'-roof',poly,datum+39.8,datum+40.4,metal);
  for(let e=0;e<poly.length;e++){const a=poly[e],z=poly[(e+1)%poly.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);if(len<5)continue;const q=t=>[a[0]+(z[0]-a[0])*t,a[1]+(z[1]-a[1])*t];if(local([(a[0]+z[0])/2,(a[1]+z[1])/2])[1]<vmin+3)for(let x=2;x<len;x+=3.8)bar('upper-terracotta-panel',q(Math.max(0,(x-.9)/len)),q(Math.min(1,(x+.9)/len)),datum+9.5,30.3,.4,brick);for(let x=1;x<len;x+=6.2){bar('terracotta-fin',q(Math.max(0,(x-.35)/len)),q(Math.min(1,(x+.35)/len)),datum,39.8,.35,brick);for(let y=.5;y<8.6;y+=.35)bar('vent-louver',q(Math.max(0,(x+1)/len)),q(Math.min(1,(x+2.3)/len)),datum+y,.06,.22,dark);}}
 }
 const sp=portion(umin+2,umin+53,vmin+2,vmax-2);slab('south-solar-field',sp,datum+40.42,datum+40.48,dark);for(let x=umin+4;x<umin+53;x+=4)bar('solar-frame',at(x,vmin+2),at(x,vmax-2),datum+40.5,.05,.06,metal);top=datum+40.4;
 }else if(kind==='power330'){
 slab('concrete-body',p,base,datum+12.8,metal);const a0=umin+8,a1=umax-6,d0=vmax-9,d1=vmax-2,r=(d1-d0)/2,mid=(d0+d1)/2;
 const paths=[];for(let j=0;j<=20;j++){const angle=Math.PI*j/20,d=mid+r*Math.cos(angle),y=datum+12.8+3.2*Math.sin(angle);paths.push([V(...[at(a0,d)[0],y,at(a0,d)[1]]),V(...[at(a1,d)[0],y,at(a1,d)[1]])]);}add(B.MeshBuilder.CreateRibbon('building-'+b.id+'-barrel-glazing',{pathArray:paths,sideOrientation:B.Mesh.DOUBLESIDE},scene),glass);
 for(let j=0;j<=20;j+=4){const angle=Math.PI*j/20,d=mid+r*Math.cos(angle);bar('roof-long-mullion',at(a0,d),at(a1,d),datum+12.8+3.2*Math.sin(angle),.12,.12,dark);}
 for(let x=a0;x<=a1;x+=4)for(let j=0;j<20;j++){const t0=Math.PI*j/20,t1=Math.PI*(j+1)/20,q0=at(x,mid+r*Math.cos(t0)),q1=at(x,mid+r*Math.cos(t1)),y0=datum+12.8+3.2*Math.sin(t0),y1=datum+12.8+3.2*Math.sin(t1);const pts=[V(q0[0],y0,q0[1]),V(q1[0],y1,q1[1])];add(B.MeshBuilder.CreateTube('building-'+b.id+'-roof-rib',{path:pts,radius:.07,tessellation:4},scene),dark);}
 for(let x=umin+4;x<umax-3;x+=7)bar('high-side-window',at(x-.7,vmax+.1),at(x+.7,vmax+.1),datum+8.7,2.2,.16,glass);top=datum+16;
 }else if(kind==='garage331'){
 const front=vmax,back=vmin,split=umin+(umax-umin)*.78;
 slab('rear-service-core',portion(umin,umax,back,front-5.5),base,datum+6.5,dark);slab('upper-office',p,datum+6.5,datum+11.2,white);
 for(const x of [umin+.3,split,umax-.3])bar('garage-pier',at(x-.3,front-.3),at(x+.3,front-.3),datum,6.5,.6,white);
 for(const [t,w]of [[.17,1.4],[.38,1.4],[.65,3.1]]){const x=umin+(umax-umin)*t;bar('upper-window',at(x-w/2,front+.1),at(x+w/2,front+.1),datum+8.3,1.5,.18,glass);}
 bar('garage-door-header',at(umin,front),at(umax,front),datum+5.8,.7,.6,white);
 // Side stair is represented within the current footprint; exact landing depth remains estimated.
 for(let j=0;j<18;j++){const y=j*.2,x=umax-2.1,d=back+1+j*.26;bar('side-stair',at(x,d),at(umax-.2,d),datum+y,.2,.3,metal);}top=datum+11.2;
 }else if(kind==='lecture28'){
 glass.diffuseColor=B.Color3.FromHexString('#607e85');const deepFrame=mat('deep-frame64','#394c52');
 const width=umax-umin,split=umin+width*.47,lower=p.map(q=>[c[0]+(q[0]-c[0])*.84,c[1]+(q[1]-c[1])*.84]);
 slab('pale-ground',p,base,datum+4.6,white);facade(p,datum,1,4.6,4.8,3.8,3.4,'curtain');slab('terrace-floor',p,datum+4.6,datum+5.1,white);
 slab('recessed-middle',lower,datum+5.1,datum+10,glass);facade(lower,datum+5.1,1,4.9,3.2,2.4,3.5,'curtain');
 const body=portion(umin,umax,vmin,vmax),left=portion(umin,split),right=portion(split,umax,vmin+2,vmax);
 slab('main-upper',body,datum+10,datum+19.8,white);slab('upper-left',left,datum+19.8,datum+26,white);slab('upper-right',right,datum+19.8,datum+23.5,white);
 // South-facing openings are drawn as distinct bands, not a full repeated facade texture.
 for(const [a0,a1,y,h,n] of [[umin+1,split-1,11.3,7.2,12],[umin+1,split-1,20.4,5,11],[split+1,umax-1,20.5,2.5,12]]){
  for(let j=0;j<n;j++){const x=a0+(a1-a0)*(j+.5)/n,d=vmin+(y>20&&a0>split?2:0)-.1;bar('vertical-glass',at(x-.34,d),at(x+.34,d),datum+y,h,.18,glass);}
 }
 bar('large-south-glazing',at(split+1,vmin-.1),at(umax-6,vmin-.1),datum+11,7.1,.2,glass);
 for(let x=split+1;x<umax-6;x+=3.2)bar('south-mullion',at(x-.08,vmin-.22),at(x+.08,vmin-.22),datum+11,7.1,.22,deepFrame);
 for(const y of[10.8,18.1])bar('glazing-frame64',at(split+.8,vmin-.27),at(umax-5.8,vmin-.27),datum+y,.2,.44,deepFrame);
 for(const x of[split+.9,umax-5.9])bar('glazing-jamb64',at(x-.1,vmin-.27),at(x+.1,vmin-.27),datum+11,7.1,.44,deepFrame);
 for(const x of [umin+1,split-1,umax-1])bar('middle-pier',at(x-.28,vmin+1),at(x+.28,vmin+1),datum+5.1,4.9,.7,white);
 slab('left-roof',left,datum+26,datum+26.3,metal);const canopy=portion(umin+.6,split-.6,vmin+1,vmax-1);slab('solar-canopy',canopy,datum+26.65,datum+26.9,dark);for(let x=umin+1;x<split;x+=3)bar('canopy-frame',at(x,vmin+1),at(x,vmax-1),datum+26.91,.05,.08,metal);top=datum+26.9;
 }else if(kind==='science500head'){
 brick.diffuseColor=B.Color3.FromHexString('#a87961');glass.diffuseColor=B.Color3.FromHexString('#709092');const split=umax-12,body=portion(umin,split),corner=portion(split,umax-3),porch=portion(umax-3,umax);
 slab('tall-glazed-ground',p,base,datum+5.8,glass);facade(p,datum,1,5.8,3.2,2.7,4.3,'curtain');slab('brick-upper',body,datum+5.8,datum+18.2,brick);facade(body,datum+5.8,3,4.1,6.8,5.05,1.8); // Horizontal paired window groups; existing floor/terrace geometry retained.
slab('top-glazing',body,datum+18.2,datum+21.1,glass);facade(body,datum+18.2,1,3,3.8,2.9,2,'curtain');
 slab('glazed-corner',corner,datum+5.8,datum+21.1,glass);facade(corner,datum+5.8,4,3.8,3.2,2.6,2.7,'curtain');for(let k=0;k<5;k++)slab('open-terrace-'+k,porch,datum+5.8+k*3.7,datum+6.05+k*3.7,white);slab('roof',body,datum+21.1,datum+21.6,white);top=datum+21.6;
 }else if(kind==='science500wing'){
 const h=b.h;slab('retained-wing',p,base,datum+h,brick);facade(p,datum,Math.max(1,Math.round(h/4)),4,3.8,2.3,2);const inner=portion(umin+7,umax-7,vmin+6,vmax-6);slab('roof-inset',inner,datum+h,datum+h+.06,dark);
 for(const q of [portion(umin,umin+7),portion(umax-7,umax),portion(umin+7,umax-7,vmin,vmin+6),portion(umin+7,umax-7,vmax-6,vmax)])slab('roof-rim',q,datum+h,datum+h+.7,metal);top=datum+h+.7;
 }else if(kind==='engineer310'){
  // The official AIP exterior photograph shows a low hall under a steep metal roof,
  // a central glazed roof strip and exposed white triangular frames.
  slab('ground-hall',p,base,datum+4.1,glass);facade(p,datum,1,4.1,3,2.5,2.8,'curtain');slab('eaves',p,datum+4.1,datum+4.45,white);
  const ridge=(vmin+vmax)/2,roofY=d=>datum+4.45+6.4*(1-Math.abs(d-ridge)/((vmax-vmin)/2));
  const beam3=(name,a,d,w,material)=>{const direction=d.subtract(a),m=B.MeshBuilder.CreateBox('building-'+b.id+'-'+name,{height:direction.length(),width:w,depth:w},scene);m.position=a.add(d).scale(.5);m.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,direction.normalize(),new B.Quaternion());add(m,material)};
  const pt=(x,y,d)=>{const q=at(x,d);return V(q[0],y,q[1])};
  for(const [lo,hi] of [[umin,(umin+umax)/2-7],[(umin+umax)/2-7,(umin+umax)/2+7],[(umin+umax)/2+7,umax]])for(const [d0,d1] of [[vmin,ridge],[ridge,vmax]]){
   const m=B.MeshBuilder.CreateRibbon('building-'+b.id+'-pitched-roof',{pathArray:[[pt(lo,roofY(d0),d0),pt(hi,roofY(d0),d0)],[pt(lo,roofY(d1),d1),pt(hi,roofY(d1),d1)]],sideOrientation:B.Mesh.DOUBLESIDE},scene);add(m,Math.abs((lo+hi)/2-(umin+umax)/2)<1?glass:metal);
  }
  for(const end of [umin,umax]){const points=[pt(end,datum+4.45,vmin),pt(end,datum+10.85,ridge),pt(end,datum+4.45,vmax)],m=new B.Mesh('building-'+b.id+'-glazed-gable',scene),vd=new B.VertexData(),pos=points.flatMap(q=>q.asArray()),norm=[];B.VertexData.ComputeNormals(pos,[0,1,2],norm);vd.positions=pos;vd.indices=[0,1,2];vd.normals=norm;vd.uvs=[0,0,.5,1,1,0];vd.applyToMesh(m);glass.backFaceCulling=false;add(m,glass);for(let j=1;j<8;j++){const d=vmin+(vmax-vmin)*j/8;beam3('gable-mullion',pt(end,datum+4.45,d),pt(end,roofY(d),d),.16,white);}for(let y=6;y<10.8;y+=1.6){const half=(vmax-vmin)/2*(10.85-y)/6.4;beam3('gable-transom',pt(end,datum+y,ridge-half),pt(end,datum+y,ridge+half),.15,white);}}
  for(let x=umin;x<=umax+.1;x+=6){
   for(const d of [vmin,vmax]){beam3('roof-frame',pt(x,datum+4.45,d),pt(x,datum+12.3,ridge),.35,white);beam3('porch-brace',pt(x,datum,d),pt(Math.min(umax,x+3),datum+4.1,d),.28,white);}
  }
  beam3('ridge',pt(umin,datum+12.3,ridge),pt(umax,datum+12.3,ridge),.32,white);top=datum+12.3;
 }else if(kind==='sports71'){
  const inset=p.map(q=>[c[0]+(q[0]-c[0])*.92,c[1]+(q[1]-c[1])*.92]);
  slab('recessed-ground',inset,base,datum+3.8,glass);facade(inset,datum,1,3.8,3.4,2.5,2.8,'curtain');
  slab('pale-upper',p,datum+3.8,datum+15.1,white);facade(p,datum+3.9,3,3.7,3.8,2.0,2.8);
  slab('dark-top',p,datum+15.1,datum+19.1,dark);facade(p,datum+15.1,1,4,3.8,2.4,3,'curtain');slab('roof',p,datum+19.1,datum+19.5,metal);
  for(let e=0;e<p.length;e++){const a=p[e],d=p[(e+1)%p.length],len=Math.hypot(d[0]-a[0],d[1]-a[1]),n=Math.max(1,Math.round(len/7));for(let j=0;j<=n;j++){const t=j/n,q=[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t];bar('pilotis-column',[q[0]-.3,q[1]],[q[0]+.3,q[1]],datum,3.8,.6,dark);}}top=datum+19.5;
 }else if(kind==='science13'){brick.name='science13-masonry';brick.diffuseColor=B.Color3.FromHexString('#5e5852');
  const ground=p.map(q=>[c[0]+(q[0]-c[0])*.9,c[1]+(q[1]-c[1])*.9]);slab('recessed-ground',ground,base,datum+3.7,glass);slab('brick-body',p,datum+3.7,datum+15.1,brick);slab('white-overhang',p,datum+15.1,datum+15.7,white);
  for(let e=0;e<p.length;e++){const a=p[e],d=p[(e+1)%p.length],len=Math.hypot(d[0]-a[0],d[1]-a[1]);if(len<28){if(e===0||e===2){const q=t=>[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t];bar('end-stair-glazing',q(.06),q(.28),datum,14.8,.2,glass);}continue;}const q=t=>[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t];for(let row=1;row<4;row++){bar('white-floor-beam',a,d,datum+row*3.7,.3,.42,white);const count=Math.round(len/4.6);for(let j=0;j<count;j++)bar('paired-windows',q((j+.2)/count),q((j+.75)/count),datum+row*3.7+1,1.8,.16,glass);}for(let j=0;j<=Math.round(len/9.2);j++){const t=j/Math.round(len/9.2);bar('deep-frame',q(Math.max(0,t-.22/len)),q(Math.min(1,t+.22/len)),datum,15.1,.7,white);}}
  top=datum+15.7;
 }else if(kind==='education12'){
  const pc=poly=>poly.map(q=>[c[0]+(q[0]-c[0])*.78,c[1]+(q[1]-c[1])*.78]),lower=pc(p);slab('recessed-ground',lower,base,datum+4,glass);facade(lower,datum,1,4,3,2.5,2.9,'curtain');slab('open-terrace-floor',p,datum+4,datum+4.35,white);
  // Rounded metal fascia replaces the former rectangular fascia; terrace and columns stay intact.
  dark.diffuseColor=B.Color3.FromHexString('#687276');dark.specularColor=new B.Color3(.18,.18,.18);
  const insetPoly=p.map(q=>[c[0]+(q[0]-c[0])*.983,c[1]+(q[1]-c[1])*.983]);slab('upper-metal-core',insetPoly,datum+8,datum+9.6,dark);
  const bandPaths=[];for(let j=0;j<=8;j++){const t=j/8,scale=.983+.017*Math.sin(t*Math.PI*.5);bandPaths.push(p.map(q=>V(c[0]+(q[0]-c[0])*scale,datum+8+1.6*t,c[1]+(q[1]-c[1])*scale)));}add(B.MeshBuilder.CreateRibbon('building-'+b.id+'-rounded-fascia62',{pathArray:bandPaths,closePath:true,sideOrientation:B.Mesh.DOUBLESIDE},scene),dark);
  slab('upper-white-body',p,datum+9.6,datum+15.6,white);facade(p,datum+9.2,1,3,3.4,2.5,2.5);facade(p,datum+12.7,1,3,3.4,2.5,1.3);slab('roof',p,datum+15.6,datum+16,white);
  for(let e=0;e<p.length;e++){const a=p[e],d=p[(e+1)%p.length],len=Math.hypot(d[0]-a[0],d[1]-a[1]);if(len<4)continue;const q=t=>[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t],count=Math.max(1,Math.round(len/6));for(let j=0;j<count;j++){const t=(j+.5)/count;bar('pilotis',q(t-.17/len),q(t+.17/len),datum+4.35,3.65,.5,white);}for(let j=0;j<=Math.round(len/3.4);j++){const t=j/Math.round(len/3.4);bar('upper-deep-fin',q(Math.max(0,t-.12/len)),q(Math.min(1,t+.12/len)),datum+9.5,6.1,1.05,white);}for(const y of [4.7,4.95,5.2,5.45])bar('terrace-rail',a,d,datum+y,.045,.06,metal);}top=datum+16;
 }else if(kind==='faculty65'){brick.diffuseColor=B.Color3.FromHexString('#9c6d54');dark.name='faculty65-metal';dark.diffuseColor=B.Color3.FromHexString('#41484b');metal.diffuseColor=B.Color3.White();brick.diffuseColor=B.Color3.FromHexString('#8d6352');
  const stoneTex62=new B.DynamicTexture('faculty65-stone62',{width:512,height:512},scene,true),ctx62=stoneTex62.getContext();ctx62.fillStyle='#aaa795';ctx62.fillRect(0,0,512,512);for(let y=0;y<10;y++)for(let x=-1;x<9;x++){ctx62.fillStyle=(x+y)%3?'#aaa795':'#a3a08f';ctx62.fillRect(x*64+(y%2)*32,y*51,63,50);ctx62.strokeStyle='rgba(65,67,61,.28)';ctx62.strokeRect(x*64+(y%2)*32,y*51,63,50);}stoneTex62.update();metal.diffuseTexture=stoneTex62;
  const main=[p[0],p[12],p[13],p[14]],round=p.slice(0,13);
  for(const [poly,h,tag] of [[main,10.9,'main'],[round,8.8,'rounded-wing']]){
   slab(tag+'-stone-ground',poly,base,datum+6.1,metal);const pc=poly.reduce((a,q)=>[a[0]+q[0]/poly.length,a[1]+q[1]/poly.length],[0,0]),core=poly.map(q=>[pc[0]+(q[0]-pc[0])*.94,pc[1]+(q[1]-pc[1])*.94]);slab(tag+'-brick-upper',core,datum+6.1,datum+h-.3,brick);slab(tag+'-projecting-metal-band',poly,datum+5.5,datum+7.0,dark);slab(tag+'-roof',core,datum+h-.3,datum+h,dark);
   for(let e=0;e<poly.length;e++){const a=poly[e],d=poly[(e+1)%poly.length],len=Math.hypot(d[0]-a[0],d[1]-a[1]);if(len<6)continue;const q=t=>[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t],n=Math.max(1,Math.round(len/9));for(let j=0;j<n;j++){const t=(j+.5)/n;bar('tall-ground-glass',q(t-1/len),q(t+1/len),datum+.2,5.2,.18,glass);bar('stone-pier',q(t+1.2/len),q(t+1.55/len),datum,5.5,.5,white);}if(len>28){const aa=core[e],dd=core[(e+1)%core.length];bar('upper-ribbon-glazing',aa,dd,datum+7.25,Math.max(.8,h-8.1),.18,glass);}}
  }top=datum+10.9;
 }else if(kind==='physics'){
  brick.diffuseColor=B.Color3.FromHexString('#d2d0c6');white.diffuseColor=B.Color3.FromHexString('#e1e1d9');glass.diffuseColor=B.Color3.FromHexString('#627a7e');metal.diffuseColor=B.Color3.FromHexString('#687b7d');
  const stoneTex=new B.DynamicTexture('physics-stone64',{width:256,height:256},scene,true),ctx64=stoneTex.getContext();ctx64.fillStyle='#d2d0c6';ctx64.fillRect(0,0,256,256);for(let j=0;j<24;j++){ctx64.fillStyle=j%2?'rgba(255,255,255,.08)':'rgba(65,70,64,.04)';ctx64.fillRect((j*47)%256,(j*31)%256,20,12);}ctx64.strokeStyle='rgba(80,85,80,.12)';for(let y=0;y<256;y+=64){ctx64.beginPath();ctx64.moveTo(0,y);ctx64.lineTo(256,y);ctx64.stroke();}stoneTex.update();brick.diffuseTexture=stoneTex;brick.diffuseColor=B.Color3.White();

  const east=umax-8;slab('brick-wing',portion(east,umax),base,datum+23.4,brick);facade(portion(east,umax),datum,6,3.8,4,1.5,1.5);
  for(let f=0;f<6;f++){const front=vmin+(b.terraceOffsets14||[0,2,4,3,5,6])[f],poly=portion(umin,east,front,vmax),room=portion(umin+1,east,front+2.7,vmax-.5),y=datum+f*3.8;slab('floor-'+f,poly,y,y+.32,white);slab('glazed-room-'+f,room,y+.32,y+3.55,glass);facade(room,y+.35,1,3.1,3.6,2.2,2.3,'curtain');bar('balcony-rail',at(umin,front+.2),at(east,front+.2),y+.6,.8,.08,metal);}
  slab('roof',portion(umin,east,vmin+6,vmax),datum+22.8,datum+23.15,white);top=datum+23.4;
 }else if(kind==='haedong'&&b.parts14){
  const solar=mat('solar','#334b56');
  for(const part of b.parts14){const poly=part.p,h=part.h;if(part.name==='atrium'){slab('atrium',poly,base,datum+h,glass);facade(poly,datum,6,4.3,3.5,2.3,3,'curtain');slab('atrium-skylight',poly,datum+h,datum+h+.18,glass);}else{slab(part.name+'-base',poly,base,datum+5.5,glass);slab(part.name,poly,datum+5.5,datum+h,white);facade(poly,datum+5.7,part.rows,(h-5.7)/part.rows,3.6,1.35,2.1);slab(part.name+'-roof',poly,datum+h,datum+h+.3,white);
  // Solar fields are inset from each verified wing outline, not a common whole-campus texture.
  const pc=poly.reduce((s,q)=>[s[0]+q[0]/poly.length,s[1]+q[1]/poly.length],[0,0]),inset=poly.map(q=>[pc[0]+(q[0]-pc[0])*.86,pc[1]+(q[1]-pc[1])*.86]);slab(part.name+'-solar',inset,datum+h+.32,datum+h+.45,solar);}}
  top=datum+b.h;
 }else if(kind==='haedong'){
  const split1=umin+(umax-umin)*.29,split2=umin+(umax-umin)*.68;
  for(const [idx,poly,h,rows]of [[0,portion(umin,split1),29,5],[1,portion(split2,umax),23,3]]){slab('glazed-plinth'+idx,poly,base,datum+5.5,glass);slab('white-wing'+idx,poly,datum+5.5,datum+h,white);facade(poly,datum+6,rows,3.7,3.6,1.2,2.35);facade(poly,datum+2,1,3,2,1.6,2,'curtain');slab('roof'+idx,poly,datum+h,datum+h+.35,metal);}
  const atrium=portion(split1,split2,vmin+3,vmax);slab('atrium',atrium,base,datum+30,glass);facade(atrium,datum,7,4.2,3.2,2.5,3,'curtain');
  for(let y=4;y<29;y+=4.2)bar('wood-floor',at(split1,vmin+3.2),at(split2,vmin+3.2),datum+y,.35,.28,wood);
  top=datum+30;
 }else if(kind==='administration09'){
  slab('upper-offices',p,datum+4.5,datum+18.5,white);facade(p,datum+4.5,4,3.5,3.1,1.9,1.85);slab('roof',p,datum+18.5,datum+18.9,metal);
  const front=vmax,back=vmin;slab('ground-glass',portion(umin+1,umax-1,back+1,front-2),base,datum+4.5,glass);
  for(let x=umin+1;x<umax;x+=6.2)for(const d of[back+.2,front-.3])bar('porch-column',at(x-.4,d),at(x+.4,d),datum,4.5,.8,dark);
  // Lower library-side entry and upper lawn-side entry have distinct thresholds.
  for(const [d,h,sgn]of[[back,0,-1],[front,4.3,1]]){
   bar('entry-glass',at(-5,d+sgn*.08),at(5,d+sgn*.08),datum+h+.1,3.1,.12,glass);
   for(const x of[-5,0,5])bar('door-mullion',at(x-.045,d+sgn*.02),at(x+.045,d+sgn*.02),datum+h+.1,3.1,.12,dark);
   bar('entry-canopy',at(-6,d+sgn*.5),at(6,d+sgn*.5),datum+h+3.3,.25,2.4,metal);
  }
  top=datum+18.9;
 }else if(kind==='pharmacy143'){
  const lower=portion(umin,umax,vmin+2,vmax);slab('recessed-lower',lower,base,datum+12,glass);facade(lower,datum,3,4,4.3,3,2.8,'curtain');slab('upper-volume',p,datum+12,datum+25.4,metal);facade(p,datum+12,3,4.3,4.3,3,3,'curtain');
  wood.diffuseColor=B.Color3.FromHexString('#ac9871');glass.diffuseColor=B.Color3.FromHexString('#4f6870');
  const ringSign=p.reduce((s,a,i)=>s+a[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*a[1],0)>0?1:-1;
  for(let e=0;e<p.length;e++){const a=p[e],d=p[(e+1)%p.length],dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz),nx=ringSign*dz/len,nz=-ringSign*dx/len;if(len<2||nx*v[0]+nz*v[1]>-.25)continue;const q=t=>[a[0]+dx*t+nx*.23,a[1]+dz*t+nz*.23],count=Math.max(1,Math.round(len/1.7));for(let row=0;row<3;row++){const y=datum+12+row*4.3;for(let j=0;j<=count;j++){const t=j/count;bar('upper-fin',q(Math.max(0,t-.08/len)),q(Math.min(1,t+.08/len)),y+.16,4.0,.7,wood);}bar('floor-rim62',q(0),q(1),y+.02,.16,.48,metal);}}
  for(let x=umin+1;x<umax;x+=5)bar('lower-pier',at(x-.3,vmin),at(x+.3,vmin),datum,12,.65,white);top=datum+25.4;
 }else if(kind==='pungsan'){
  const roofP=clip(p,1,0,true),pos=[],ix=[],n=roofP.length;const roofHeight=(x,z)=>{const [a,d]=local([x,z]);return datum+3.4+5.1*Math.sin(Math.PI*Math.max(0,Math.min(1,(a-umin)/(umax-umin))))+1.5*(d-vmin)/(vmax-vmin)};
  // Tessellated sweeping shell above a partial enclosed glass stage, not a solid oval box.
  const center=roofP.reduce((s,q)=>[s[0]+q[0]/n,s[1]+q[1]/n],[0,0]);
  function shellTri(a,b,c,depth){if(depth){const ab=a.map((v,i)=>(v+b[i])/2),bc=b.map((v,i)=>(v+c[i])/2),ca=c.map((v,i)=>(v+a[i])/2);shellTri(a,ab,ca,depth-1);shellTri(ab,b,bc,depth-1);shellTri(ca,bc,c,depth-1);shellTri(ab,bc,ca,depth-1);return;}const k=pos.length/3;for(const r of [a,b,c])pos.push(r[0],roofHeight(...r),r[1]);ix.push(k,k+1,k+2);}
  for(let i=0;i<n;i++)shellTri(center,roofP[i],roofP[(i+1)%n],4);
  const m=new B.Mesh('building-'+b.id+'-shell',scene),vd=new B.VertexData(),norm=[];B.VertexData.ComputeNormals(pos,ix,norm);for(let i=0;i<norm.length;i+=3)if(norm[i+1]<0){norm[i]*=-1;norm[i+1]*=-1;norm[i+2]*=-1;}vd.positions=pos;vd.indices=ix;vd.normals=norm;vd.uvs=Array(pos.length/3*2).fill(0);vd.applyToMesh(m);white.backFaceCulling=false;add(m,white);
  const enclosed=portion(0,umax,0,vmax-2);slab('glass-hall',enclosed,datum,datum+4.3,glass);facade(enclosed,datum,1,4.3,3,2.4,3,'curtain');slab('stage',roofP,datum-.2,datum+.25,metal);top=datum+9;
  for(let j=0;j<5;j++){const d=vmin+2+j*2;bar('audience-bench',at(umin+5,d),at(umax-5,d),height(...at(0,d))+.05,.25,.65,metal);}
 }
 for(const [material,list]of groups){const merged=B.Mesh.MergeMeshes(list,true,true);if(merged){merged.name='building-'+b.id+'-review-'+material.name;if(['education12','faculty65','pharmacy143','science500head','lecture28','physics'].includes(kind))merged.metadata={buildingId:b.id,labelSurfaceId49:b.id,exterior62:true};merged.freezeWorldMatrix();}}
 b.base=base;b.top=top;b.heightRecord={groundDatum:datum,structureHeight:top-datum,roofElevation:top,source:b.officialDetail,uncertainty:'Photo proportions; detailed dimensions and unseen faces estimated'};
}

if(typeof module!=="undefined")module.exports={buildReviewBuilding};
