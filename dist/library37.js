/* BUILD37: one registered architecture, shared by every camera and walker.
 * A–E are the visual target. Ratios/counts are estimates, not surveyed facts.
 * The existing canonical floor atlas is edited in place, never covered by a slab.
 */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Library37=api;})(this,()=>{
const REV='gwanjeong37-r1';
function prepare(data,nav){
 const s=nav.library17;if(s.revision37===REV)return s;
 const point=(a,d)=>[s.origin[0]+s.u[0]*a+s.v[0]*d,s.origin[1]+s.u[1]*a+s.v[1]*d];
 const rect=(a,d,w,h)=>[point(a,d),point(a+w,d),point(a+w,d+h),point(a,d+h)];
 const count={'right-third-1':25,'right-third-3':28,'left-roof-1':34,'left-roof-3':36,'pharmacy-near23-1':21,'pharmacy-near23-3':23};
 const changed=[];for(const q of s.surfaces)if(count[q.id]){changed.push({id:q.id,oldSteps:q.steps,steps:count[q.id],lo:q.lo,hi:q.hi});q.steps=count[q.id];}
 // Existing landing/roof polygons and all their holes remain the sole floor owners.
 // Replace the bridge's full-width glass blocker with a 3m clear entry opening.
 const removed=s.volumes.filter(q=>['rear-bridge-door','garden-glass-pavilion','third-entry-glass'].includes(q.id)).map(q=>q.id);
 s.volumes=s.volumes.filter(q=>!removed.includes(q.id));
 for(const [id,a,d,w,h,lo,hi,material] of [
 ['pavilion-back37',22,-9,29,.14,22,26,'glass'],['pavilion-left37',22,-9,.14,12,22,26,'glass'],['pavilion-right37',50.86,-9,.14,12,22,26,'glass'],['pavilion-front-left37',22,2.86,14, .14,22,26,'glass'],['pavilion-front-right37',39,2.86,12,.14,22,26,'glass'],['pavilion-entry-head37',36,2.86,3,.14,24.6,26,'glass'],['pavilion-roof37',22,-9,29,12,25.85,26,'metal']])s.volumes.push({id,p:rect(a,d,w,h),lo,hi,material});
 for(const [id,d,h,lo] of [['SC-entry-left37',-8,4,13],['SC-entry-right37',-1,3,13],['SC-entry-head37',-4,3,15.6]])s.volumes.push({id,p:rect(22,d,2,h),lo,hi:22,material:'glass'});
 s.beds37=[[24,32,43,3],[75,32,31,3],[25,39,10,3],[94,39,12,3],[25,48,8,18],[96,48,10,18],[39,42,28,2.5],[75,42,8,2.5]];
 for(const [i,q]of s.beds37.entries())s.groundSolids.push({id:'garden-bed37-'+i,p:rect(...q),lo:22,hi:22.45});

 for(const [id,a,w] of [['bridge-door-left37',55,1.5],['bridge-door-right37',59.5,1.5]])s.volumes.push({id,p:rect(a,-12.4,w,.3),lo:7,hi:10,material:'glass'});
 // Door vestibule lies inside the existing four-metre-deep wall opening.
 s.surfaces.push({id:'bridge-entry-floor37',p:rect(55,-12.5,6,4),lo:7,hi:7,owner:'walkway',material:'paving',sources:['B3-entry37']});
 s.volumes.push({id:'bridge-entry-support37',p:rect(55,-12.5,6,4),lo:6.4,hi:7,omitTop29:true,material:'stone'});
 // Rails use the same endpoints as their visible members. They are narrow
 // vertical prisms, never an invisible full-width wall at a landing.
 const rail=(id,a,b,y0,y1=y0)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*.045,nz=dx/l*.045;
  const p=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
  s.groundSolids.push({id,p,lo:Math.min(y0,y1),hi:Math.max(y0,y1)+1.1,rail37:{a,b,y0,y1}});
 };
 for(const q of s.surfaces.filter(q=>q.steps)){
  const dx=q.to[0]-q.from[0],dz=q.to[1]-q.from[1],l=Math.hypot(dx,dz),nx=-dz/l*q.width/2,nz=dx/l*q.width/2;
  for(const sign of [-1,1])rail('flight-guard37-'+q.id+'-'+sign,[q.from[0]+nx*sign,q.from[1]+nz*sign],[q.to[0]+nx*sign,q.to[1]+nz*sign],q.lo,q.hi);
 }
 for(const a of [55,61])rail('B3-guard37-'+a,point(a,-26),point(a,-12.5),7);
 const main=s.volumes.find(q=>q.id==='main-body');
 for(let i=0;i<main.p.length;i++){const a=main.p[i],b=main.p[(i+1)%main.p.length],len=Math.hypot(a[0]-b[0],a[1]-b[1]);const d=((a[0]+b[0])/2-s.origin[0])*s.v[0]+((a[1]+b[1])/2-s.origin[1])*s.v[1];if(len>=5&&d>=28)rail('R5-guard37-'+i,a,b,22);}
 s.groundEnd37=3.1090739914326235;s.revision37=REV;s.audit37={changedFlights:changed,removedVolumes:removed,retainedUnverifiedConnection:'left-roof-final: existing BUILD36 route retained; no new SD→R5 link',levels:{G:s.base,B3:s.base+7,R5:s.base+22},sourceUpperLength:Math.hypot(s.volumes[0].p[1][0]-s.volumes[0].p[0][0],s.volumes[0].p[1][1]-s.volumes[0].p[0][1])};
 return s;
}
function materials(B,scene,mats){
 const mat=(n,hex)=>{const m=new B.StandardMaterial('gwanjeong37-'+n,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.1,.1,.1);m.metadata={gwanjeong37:true};return m;};
 mats.metal=mat('champagne-metal','#cbbd9d');mats.metal.specularColor=new B.Color3(.48,.43,.34);mats.metal.specularPower=70;
 mats.metalLight=mat('fold-light','#dfd3b7');mats.metalShade=mat('fold-shadow','#ac9f84');
 mats.core=mat('interior-depth','#586970');mats.frame=mat('anodized-frame','#546269');
 mats.glass=mat('recessed-glass','#88aab4');mats.glass.specularColor=new B.Color3(.62,.68,.7);mats.glass.specularPower=110;
 mats.glassLight=mat('sky-glass','#92b5bf');mats.glassDark=mat('inner-glass','#779aa7');
 mats.concrete=mat('concrete','#c7c8bd');mats.ivory=mat('edge-stone','#d4d3c6');mats.stone=mat('basalt','#9ca6a7');
 mats.rail=mat('brushed-steel','#687a7e');mats.timber=mat('timber','#b18c69');mats.paving=mat('stone-paving','#c3c5bf');
 // UVs are local metres. Texture is a finish, not a substitute for depth.
 function texture(m,kind){const t=new B.DynamicTexture('g37-'+kind,{width:512,height:512},scene,true),c=t.getContext();c.fillStyle=kind==='timber'?'#b18c69':kind==='stone'?'#9ca6a7':'#c3c5bf';c.fillRect(0,0,512,512);
  let seed=37;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  if(kind==='timber'){for(let x=0;x<512;x+=32){c.fillStyle=['#b08b67','#ad8563','#b99571','#be9872'][Math.floor(rnd()*4)];c.fillRect(x,0,30,512);c.fillStyle='#77634e';c.fillRect(x+30,0,2,512);for(let k=0;k<8;k++){c.strokeStyle='rgba(68,43,19,.09)';c.beginPath();c.moveTo(x+rnd()*28,0);c.lineTo(x+rnd()*28,512);c.stroke();}}}
  else {const h=kind==='stone'?64:128,w=kind==='stone'?128:256;for(let y=0;y<512;y+=h)for(let x=-w;x<512;x+=w){const ox=x+(y/h%2)*w/2;c.fillStyle=kind==='stone'?['#859095','#91999c','#899297','#818c93'][Math.floor(rnd()*4)]:['#c7c8c1','#bebfb9','#c3c5bf','#cdcdc6'][Math.floor(rnd()*4)];c.fillRect(ox+1,y+1,w-2,h-2);}}
  t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;m.diffuseTexture=t;
 }
 texture(mats.stone,'stone');texture(mats.timber,'timber');texture(mats.paving,'paving');
 mats.lamp=mat('warm-recessed-lamp','#fff0c5');mats.lamp.emissiveColor=B.Color3.FromHexString('#d7c498');
 return mats;
}
function facades(ctx){
 const {B,scene,spec:s,point,slab,bar,box,shell,add,mats}=ctx;
 let cells=0;const base=s.base;
 function skin(q,side,cols,rows,phase){
  const a=q.p[side],b=q.p[(side+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=dz/len,nz=-dx/len,at=(t,o)=>[a[0]+dx*t/len+nx*o,a[1]+dz*t/len+nz*o],w=len/cols,h=(q.hi-q.lo)/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=col*w+.025,y=q.lo+row*h+.025,parity=(row+col+phase)%2,glassA=x+(parity?w*.48:0),metalA=x+(parity?0:w*.48),gw=w*.48-.04,mw=w*.52-.04;
   const gm=[mats.glass,mats.glassLight,mats.glassDark][(col*7+row*5)%3];
   bar('g37-window-inset',at(glassA,-.24),at(glassA+gw,-.24),y+.09,h-.18,.055,gm);
   // Faceted metal prism, full side returns and a flat rear closure.
   const t0=metalA,t1=metalA+mw,tm=metalA+mw*.58,ps=[at(t0,0),at(tm,.31),at(t1,.13),at(t1,-.12),at(t0,-.12)];
   slab('g37-folded-metal',ps,y,y+h-.05,(col+row)%5===0?mats.metalLight:mats.metal);
   for(const t of [glassA,glassA+gw])bar('g37-window-jamb',at(t,-.06),at(t+.045,-.06),y,h-.03,.42,mats.frame);
   for(const yy of [y+.025,y+h-.09])bar('g37-window-sill',at(glassA,-.07),at(glassA+gw,-.07),yy,.055,.45,mats.metalShade);
   // A shaded interior soffit behind each glazed opening catches the sky tint.
   bar('g37-window-inner-head',at(glassA,-.45),at(glassA+gw,-.45),y+h-.22,.08,.32,mats.core);cells++;
  }
  for(const yy of [q.lo,q.hi-.14])bar('g37-edge-return',at(0,.05),at(len,.05),yy,.14,.5,mats.metalLight);
 }
 for(const q of s.volumes.filter(q=>q.id==='upper'||q.id==='right-wing')){
  const upper=q.id==='upper';for(let side=0;side<4;side++)skin(q,side,upper?(side%2?18:96):18,upper?6:8,side%2);
  const [a,d,w,l]=q.local;
  for(let v=d+.3;v<d+l;v+=.48)box('g37-soffit-seam',a,v,w,.025,q.lo-.025,q.lo,mats.metalShade);
  for(let x=a+5;x<a+w-2;x+=12)for(const v of [d+2,d+l-2])box('g37-downlight',x,v,.22,.22,q.lo-.04,q.lo-.02,mats.lamp);
 }
 // A distinctly separate concrete frame, four recessed rows on the main library.
 const main=s.volumes.find(q=>q.id==='main-body'),sign=Math.sign(main.p.reduce((sum,p,i)=>sum+p[0]*main.p[(i+1)%main.p.length][1]-main.p[(i+1)%main.p.length][0]*p[1],0));
 for(let side=0;side<main.p.length;side++){
  const a=main.p[side],b=main.p[(side+1)%main.p.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=sign*dz/l,nz=-sign*dx/l,at=(t,o)=>[a[0]+dx*t/l+nx*o,a[1]+dz*t/l+nz*o];if(l<2)continue;
  const cols=Math.max(1,Math.round(l/2.75)),pitch=l/cols,rh=(main.hi-main.lo)/4;
  for(let row=0;row<4;row++){const y=main.lo+row*rh;bar('g37-main-spandrel',at(0,.24),at(l,.24),y,.72,.68,mats.concrete,'148286730');
   for(let col=0;col<cols;col++){const t=col*pitch;bar('g37-main-inset-window',at(t+.18,.015),at(t+pitch-.18,.015),y+.85,rh-1.05,.045,(col+row)%4?mats.glass:mats.glassLight,'148286730');bar('g37-main-deep-pier',at(t,.27),at(t+.18,.27),y+.65,Library38.pierHeight(s,at(t,.27),y+.65,rh-.65),.72,mats.ivory,'148286730');bar('g37-main-sill',at(t+.18,.24),at(t+pitch-.18,.24),y+.73,.12,.7,mats.ivory,'148286730');}
  }for(const [a,b]of Library38.coping(s,at(0,.16),at(l,.16)))bar('g37-main-coping',a,b,main.hi-.2,.35,.65,mats.ivory,'148286730');
 }
 s.render37={revision:REV,facadeCells:cells,metalFoldDepth:.31,windowRecess:.24,mainWindowRows:4};
}
function finish(ctx){
 const {B,scene,spec:s,point,bar,box,add,mats}=ctx;
 const leaf=new B.StandardMaterial('gwanjeong37-leaf',scene);leaf.diffuseColor=B.Color3.FromHexString('#729449');leaf.specularColor=B.Color3.Black();leaf.metadata={gwanjeong37:true};
 const bloom=new B.StandardMaterial('gwanjeong37-flower',scene);bloom.diffuseColor=B.Color3.FromHexString('#d6b59b');bloom.metadata={gwanjeong37:true};
 // Planting stays inside existing beds; access aisles and door threshold are clear.
 for(const [a,d,w,h] of s.beds37.filter(q=>q[3]<4).map(([a,d,w,h])=>[a+.3,d+.3,w-.6,h-.6]))for(let x=a+.7;x<a+w;x+=1.5)for(let z=d+.5;z<d+h;z+=1.3){const p=point(x,z),m=B.MeshBuilder.CreateIcoSphere('g37-low-shrub',{radius:.5,subdivisions:1},scene);m.position.set(p[0],s.base+22.65,p[1]);m.scaling.set(1.1,.55,.85);add(m,(Math.round(x*3)%7===0)?bloom:leaf,'148286730');}
 for(let a=22;a<=51;a+=2.4)if(a<36||a>39)bar('g37-garden-mullion',point(a,3.03),point(a+.07,3.03),22,3.9,.15,mats.frame,'148286730');
 for(const a of [36,39])bar('g37-garden-door-jamb',point(a,3.1),point(a+.08,3.1),22,2.6,.26,mats.metal,'148286730');
 for(const a of [25,43]){box('g37-reading-desk',a,-3,5,1.2,22.72,22.8,mats.timber);for(const x of [a+.2,a+4.7])box('g37-reading-leg',x,-2.5,.1,.1,22,22.72,mats.rail);}
 // Photo-informed equipment screens replace (not surround) the three old boxes.
 for(const [a,screenD] of s.screens38){
  for(const d of [screenD,screenD+4]){bar('g37-service-screen',point(a,d),point(a+4.3,d),22,2.8,.08,mats.rail,'148286730');for(let x=a;x<a+4.3;x+=.18)bar('g37-screen-fin',point(x,d+.07),point(x+.045,d+.07),22,2.8,.12,mats.metalShade,'148286730');}
  for(const x of [a,a+4.3])bar('g37-service-side',point(x,screenD),point(x,screenD+4),22,2.8,.08,mats.rail,'148286730');
 }
 for(const a of [61,75,89,103]){
  box('g37-table',a,5,1.2,.75,22.68,22.76,mats.timber,'148286730');for(const x of [a+.1,a+1.02])box('g37-table-leg',x,5.3,.06,.06,22,22.68,mats.rail,'148286730');
  for(const d of [4,6.2]){box('g37-seat',a+.16,d,.72,.55,22.42,22.48,mats.timber,'148286730');box('g37-seat-back',a+.16,d+.5,.72,.06,22.48,22.9,mats.rail,'148286730');for(const x of [a+.2,a+.8])box('g37-seat-leg',x,d+.15,.05,.28,22,22.42,mats.rail,'148286730');}
 }
 // Make the covered soffit read as a finished ceiling instead of a gray void.
 for(let a=25;a<120;a+=.55)box('g37-covered-ceiling-seam',a,3,.02,9,26-.018,26,mats.metalShade);
 for(let a=28;a<120;a+=10)box('g37-covered-light',a,8,.24,.24,25.97,25.99,mats.lamp);
}

function groundHeight(s,x,z,y){if(s.acro39){const q=(typeof require==='function'?require('./acro39.js'):globalThis.Acro39).ground(s,x,z);if(q!==null)return y;}
 const dx=x-s.origin[0],dz=z-s.origin[1],a=dx*s.u[0]+dz*s.u[1],d=dx*s.v[0]+dz*s.v[1];
 const ease=q=>{q=Math.max(0,Math.min(1,q));return q*q*(3-2*q);};const foot=(1-ease(Math.max(120-a,a-127,0)/3))*(1-ease(Math.max(60-d,d-64,0)/4));y=y*(1-foot)+(s.base+4.45)*foot;
 const ax=140,ad=60,bx=173,bd=83,vx=bx-ax,vd=bd-ad,l2=vx*vx+vd*vd,t=((a-ax)*vx+(d-ad)*vd)/l2;
 if(t<=0||t>=1)return y;const cross=Math.abs((a-ax)*vd-(d-ad)*vx)/Math.sqrt(l2);if(cross>=6)return y;
 const smooth=q=>{q=Math.max(0,Math.min(1,q));return q*q*(3-2*q);};
 const w=(1-smooth((cross-3)/3))*smooth(t/.10)*smooth((1-t)/.14);
 return y*(1-w)+(s.base+4.45+(s.groundEnd37-4.45)*t)*w;
}
// Physics samples the very same adjusted terrain triangles, including their
// interpolation between vertices; no floating analytical approximation remains.
function reshapeGround(s,pos,indices){
 const changed=new Set();for(let i=0;i<pos.length;i+=3){const y=groundHeight(s,pos[i],pos[i+2],pos[i+1]);if(Math.abs(y-pos[i+1])>1e-6){changed.add(i/3);pos[i+1]=y;}}
 if(!changed.size)return pos;s.meshGround37=s.meshGround37||new Map();
 for(let i=0;i<indices.length;i+=3){if(![0,1,2].some(j=>changed.has(indices[i+j])))continue;
  const p=[0,1,2].map(j=>Array.from(pos.slice(indices[i+j]*3,indices[i+j]*3+3))),xmin=Math.min(...p.map(q=>q[0])),xmax=Math.max(...p.map(q=>q[0])),zmin=Math.min(...p.map(q=>q[2])),zmax=Math.max(...p.map(q=>q[2]));
  for(let x=Math.floor(xmin/4);x<=Math.floor(xmax/4);x++)for(let z=Math.floor(zmin/4);z<=Math.floor(zmax/4);z++){const key=x+','+z;if(!s.meshGround37.has(key))s.meshGround37.set(key,[]);s.meshGround37.get(key).push(p);}
 }return pos;
}
function meshHeight(s,x,z,fallback){
 for(const [a,b,c] of s.meshGround37?.get(Math.floor(x/4)+','+Math.floor(z/4))||[]){const dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2],det=dx*ez-dz*ex;if(Math.abs(det)<1e-10)continue;const u=((x-a[0])*ez-(z-a[2])*ex)/det,v=(dx*(z-a[2])-dz*(x-a[0]))/det;if(u>=-1e-7&&v>=-1e-7&&u+v<=1.0000001)return a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]);}
 return fallback;
}
// Split ownership of existing road triangles at the rear passage boundary.
// Inside triangles replace the road partition; none are drawn twice.
function partitionGround(s,pos,indices,kind){
 if(kind!=='road')return [{kind,pos,indices}];
 const local=p=>{const x=p[0]-s.origin[0],z=p[2]-s.origin[1];return [x*s.u[0]+z*s.u[1],x*s.v[0]+z*s.v[1]];};
 let amin=Infinity,amax=-Infinity,dmin=Infinity,dmax=-Infinity;for(let i=0;i<pos.length;i+=3){const x=pos[i]-s.origin[0],z=pos[i+2]-s.origin[1],a=x*s.u[0]+z*s.u[1],d=x*s.v[0]+z*s.v[1];amin=Math.min(amin,a);amax=Math.max(amax,a);dmin=Math.min(dmin,d);dmax=Math.max(dmax,d);}if(amax<-20||amin>147||dmax<-26||dmin>-12.5)return [{kind,pos,indices}];
 const bounds=[[0,-20,1],[0,147,-1],[1,-26,1],[1,-12.5,-1]];
 const out={road:[],rearPaving:[]};let changed=0;
 const emit=(kind,poly)=>{for(let j=1;j<poly.length-1;j++)out[kind].push(...poly[0],...poly[j],...poly[j+1]);};
 for(let i=0;i<indices.length;i+=3){let poly=[0,1,2].map(k=>Array.from(pos.slice(indices[i+k]*3,indices[i+k]*3+3)));
  if(bounds.some(([axis,v,sign])=>poly.every(p=>(local(p)[axis]-v)*sign<0))){emit('road',poly);continue;}
  for(const [axis,v,sign] of bounds){const inside=[],outside=[];for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length],da=(local(a)[axis]-v)*sign,db=(local(b)[axis]-v)*sign;(da>=0?inside:outside).push(a);if((da>=0)!==(db>=0)){const t=da/(da-db),p=a.map((n,j)=>n+(b[j]-n)*t);inside.push(p);outside.push(p);}}emit('road',outside);poly=inside;if(!poly.length)break;}
  if(poly.length){emit('rearPaving',poly);changed++;}
 }
 if(!changed)return [{kind,pos,indices}];s.groundAudit37=s.groundAudit37||{roadTrianglesReplaced:0};s.groundAudit37.roadTrianglesReplaced+=changed;
 return Object.entries(out).filter(([k,p])=>p.length).map(([kind,pos])=>({kind,pos,indices:Array.from({length:pos.length/3},(_,i)=>i)}));
}
return {prepare,materials,facades,finish,groundHeight,reshapeGround,meshHeight,partitionGround,revision:REV};});
