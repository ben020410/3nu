/* 3NU shuttle visuals. ES module. Babylon.js supplied by caller; no runtime globals. */
const pools = new WeakMap();
export const SHUTTLE_SPEC = Object.freeze({length:10.5,width:2.5,height:3.35,wheelRadius:.49,wheelbase:6.4,frontAxleZ:3.25,rearAxleZ:-3.15,doorCentersZ:[4.05,-.65],doorWidth:1.3,floorY:.52,axis:'+Z forward, +X doors/right, +Y up',units:'model meters / design estimates'});
function pool(B,scene){
 let p=pools.get(scene);if(p)return p;
 p={B,scene,refs:0,serial:0,materials:new Map(),textures:[],multiMaterials:[],templates:new Map()};pools.set(scene,p);
 p.mat=(key,color,alpha=1)=>{if(p.materials.has(key))return p.materials.get(key);const m=new B.StandardMaterial('shuttle.shared.'+key,scene);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=new B.Color3(.13,.15,.18);m.alpha=alpha;m.backFaceCulling=false;p.materials.set(key,m);return m;};
 p.label=(text,bg='#123568',fg='#ffffff',aspect=4)=>{const key='label:'+text+bg+fg+aspect.toFixed(2);if(p.materials.has(key))return p.materials.get(key);const tw=1024,th=Math.max(64,Math.min(512,Math.round(tw/aspect)));const t=new B.DynamicTexture(key,{width:tw,height:th},scene,false);const c=t.getContext();c.fillStyle=bg;c.fillRect(0,0,tw,th);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';let size=Math.floor(th*.65);c.font=`bold ${size}px sans-serif`;while(c.measureText(text).width>tw*.92&&size>16){size-=2;c.font=`bold ${size}px sans-serif`;}c.fillText(text,tw/2,th/2);t.update(true);const m=p.mat(key,'#ffffff');m.diffuseTexture=t;m.emissiveColor=new B.Color3(.35,.35,.35);p.textures.push(t);return m;};
 p.release=()=>{if(--p.refs!==0)return;for(const t of p.templates.values())t.root.dispose(false,false);for(const m of p.multiMaterials)m.dispose(false,false);for(const m of p.materials.values())m.dispose(false,false);for(const t of p.textures)t.dispose();pools.delete(scene);};return p;
}
function builder(p,key){
 const {B,scene}=p,root=new B.TransformNode('shuttle.template.'+key,scene),parts=[];let moving=null;
 const white=p.mat('white','#f0f1ed'),blue=p.mat('blue','#155ac5'),dark=p.mat('dark','#172b3c'),steel=p.mat('steel','#30465c'),rubber=p.mat('rubber','#20262d'),silver=p.mat('silver','#a5b1bb'),wood=p.mat('wood','#c49054'),glass=p.mat('glass','#8ab4c0',.26);
 function add(m,mat){m.material=mat;m.parent=root;m.isPickable=false;m.checkCollisions=false;m.metadata={part:moving||'static'};parts.push(m);return m;}
 function box(n,x,y,z,w,h,d,mat){const m=B.MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);return add(m,mat);}
 function sign(n,text,x,y,z,w,h,rot=0,bg,fg){const m=B.MeshBuilder.CreatePlane(n,{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);m.position.set(x,y,z);m.rotation.y=rot;return add(m,p.label(text,bg,fg,w/h));}
 function finish(){
  const grouped=new Map();for(const m of parts){const k=(m.metadata.part==='static'?'static:'+m.material.uniqueId:m.metadata.part);if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(m);}
  const meshes=[];for(const [k,ms] of grouped){const merged=B.Mesh.MergeMeshes(ms,true,true,undefined,false,true);if(merged.material instanceof B.MultiMaterial)p.multiMaterials.push(merged.material);merged.name=key+'.'+k;merged.parent=root;merged.metadata={part:k};merged.isPickable=false;merged.checkCollisions=false;meshes.push(merged);}
  root.setEnabled(false);const result={root,meshes};p.templates.set(key,result);return result;
 }
 return {B,scene,root,box,sign,add,finish,white,blue,dark,steel,rubber,silver,wood,glass,setPart:v=>moving=v};
}
function busTemplate(p){
 if(p.templates.has('bus'))return p.templates.get('bus');const q=builder(p,'bus');const {B,box,sign,white,blue,dark,steel,rubber,silver}=q;
 box('underbody',0,.58,0,2.24,.22,10.1,dark);box('interior-floor',0,.55,0,2.36,.08,10.1,dark);
 box('roof',0,3.08,0,2.5,.22,10.5,white);box('rear-roof',0,3.09,-3.48,2.51,.23,3.54,blue);box('hvac',0,3.29,-.7,1.48,.12,2.6,white);
 box('rear',0,1.79,-5.17,2.5,2.44,.16,blue);box('rear-glass',0,2.39,-5.26,2.13,.96,.025,dark);
 box('front-lower',0,.96,5.16,2.5,.84,.18,white);box('windscreen',0,2.12,5.17,2.3,1.53,.06,dark);box('header',0,2.94,5.18,2.5,.26,.1,white);
 sign('destination','순환셔틀',0,2.81,5.26,1.7,.29,Math.PI,'#172b3c','#f9f0c5');sign('front-brand','3NU',0,1.04,5.26,.65,.25,Math.PI,'#f0f1ed','#174891');
 for(const x of [-.88,.88])box('headlamp',x,.78,5.265,.42,.19,.035,p.mat('light','#fff3cf'));
 box('bumper',0,.51,5.25,2.42,.15,.1,silver);
 // Side panels are segmented around real door openings. Windows have distinct pillars.
 for(const side of [-1,1]){
  const cuts=side===1?[[-5.25,-1.3],[0,3.4],[4.7,5.25]]:[[-5.25,5.25]];
  for(const [a,b] of cuts){const boundaries=[a,...[-1.8].filter(z=>z>a&&z<b),b];for(let i=1;i<boundaries.length;i++){const u=boundaries[i-1],v=boundaries[i];box('side-body',side*1.205,1.02,(u+v)/2,.09,.93,v-u,v<=-1.8?blue:white);}
   box('window-band',side*1.255,2.22,(a+b)/2,.025,1.42,b-a,dark);
   for(let z=a+.13;z<b;z+=1.35)box('window-pillar',side*1.275,2.22,z,.035,1.46,.055,steel);
  }
  box('roof-edge',side*1.25,2.99,0,.06,.12,10.3,white);
  sign('side-brand','3NU',side*1.26,1.13,1.45,1.25,.4,side===1?-Math.PI/2:Math.PI/2,'#f0f1ed','#174891');
  for(const z of [-3.15,3.25]){
   q.setPart(`wheel:${side}:${z}`);const tire=B.MeshBuilder.CreateCylinder('tire',{diameter:.98,height:.24,tessellation:16},q.scene);tire.position.set(side*1.21,.49,z);tire.rotation.z=Math.PI/2;q.add(tire,rubber);
   const hub=B.MeshBuilder.CreateCylinder('hub',{diameter:.52,height:.25,tessellation:12},q.scene);hub.position.set(side*1.25,.49,z);hub.rotation.z=Math.PI/2;q.add(hub,silver);q.setPart(null);
  }
 }
 for(let i=0;i<2;i++){const z=SHUTTLE_SPEC.doorCentersZ[i];box('step',1.04,.48,z,.44,.08,1.3,silver);box('yellow-sill',1.27,.54,z,.035,.045,1.3,p.mat('yellow','#e7bc45'));
  for(const half of [-1,1]){q.setPart(`door:${i}:${half}`);box('door-frame',1.267,1.73,z+half*.325,.09,2.36,.64,steel);box('door-glass',1.318,1.83,z+half*.325,.014,1.95,.54,dark);box('door-handle',1.334,1.55,z+half*.08,.035,.38,.035,silver);q.setPart(null);}
 }
 for(const x of [-1,1]){box('mirror-arm',x*1.32,2.55,4.94,.3,.06,.06,steel);box('mirror',x*1.49,2.4,4.94,.12,.34,.19,dark);}
 return q.finish();
}
const STOP_SPECS={standard:{width:4.8,depth:2.4,height:2.8,benches:1},large:{width:8,depth:3,height:3,benches:2},compact:{width:2.8,depth:1.65,height:2.7,benches:1},poleOnly:{width:.6,depth:.24,height:2.9,benches:0}};
function stopTemplate(p,variant,name){
 const key=`stop:${variant}:${name}`;if(p.templates.has(key))return p.templates.get(key);const q=builder(p,key),{box,sign,steel,white,wood,glass}=q,s=STOP_SPECS[variant],w=s.width,d=s.depth;
 // Local +Z faces the road, X runs along the shelter, root Y is the existing paving.
 if(variant!=='poleOnly'){
  for(const x of [-w/2+.1,w/2-.1])for(const z of [-d/2+.1,d/2-.1])box('column',x,s.height/2,z,.11,s.height,.11,steel);
  box('roof',0,s.height,0,w+.24,.14,d+.18,steel);box('roof-soffit',0,s.height-.085,0,w-.1,.025,d-.12,white);
  box('back-glass',0,s.height/2,-d/2+.11,w-.34,s.height-.36,.025,glass);
  for(const x of [-w/2+.1,w/2-.1])box('side-glass',x,s.height/2,-.1,.025,s.height-.36,d-.48,glass);
  const benchWidth=variant==='large'?2.35:variant==='compact'?1.9:2.6;
  for(let i=0;i<s.benches;i++){const x=s.benches===2?(i?2.05:-2.05):0,z=-d/2+.6;box('bench-seat',x,.48,z,benchWidth,.1,.48,wood);box('bench-back',x,.79,z-.22,benchWidth,.36,.075,wood);for(const k of [-1,1])box('bench-leg',x+k*(benchWidth/2-.22),.23,z,.07,.46,.35,steel);}
  sign('shelter-header',variant==='large'?'3NU 순환셔틀 · '+name:'순환셔틀 · '+name,0,s.height-.23,d/2+.11,Math.min(w-.2,6.8),.33,Math.PI);
  sign('route-map','● ─ ● ─ ● ─ ●',0,1.7,-d/2+.14,variant==='large'?1.9:1.2,.48,Math.PI,'#f0f1ed','#174891');
 }
 const px=variant==='poleOnly'?0:w/2+.45;box('name-pole',px,1.35,.12,.08,2.7,.08,steel);box('name-board',px,2.49,.12,.58,.82,.09,white);sign('pole-name',name,px,2.35,.175,.54,.23,Math.PI,'#f0f1ed','#174891');sign('pole-shuttle','순환셔틀',px,2.65,.175,.54,.26,Math.PI);
 return q.finish();
}
function instantiate(p,t,options){
 const {B,scene}=p; p.refs++;const root=new B.TransformNode(options.name||'3NU-visual-'+(++p.serial),scene);if(options.position)root.position.copyFrom(options.position);root.rotation.y=Number.isFinite(options.rotationY)?options.rotationY:0;
 const renderMeshes=t.meshes.map(m=>{const c=m.clone(root.name+'.'+m.name,root,true);c.setEnabled(true);c.isVisible=true;c.checkCollisions=false;c.isPickable=false;c.metadata={...m.metadata};return c;});
 let disposed=false;root.onDisposeObservable.addOnce(()=>{disposed=true;p.release();});
 return {root,renderMeshes,setOpacity(value){if(disposed)return;const v=Number.isFinite(value)?Math.max(0,Math.min(1,value)):1;for(const m of renderMeshes)m.visibility=v;},setEnabled(value){if(!disposed)root.setEnabled(!!value);},dispose(){if(!disposed)root.dispose(false,false);}};
}
function anchor(B,scene,root,name,x,y,z){const a=new B.TransformNode(root.name+'.'+name,scene);a.parent=root;a.position.set(x,y,z);return a;}
export function createShuttleVisual(B,scene,options={}){
 const p=pool(B,scene),v=instantiate(p,busTemplate(p),options);v.dimensions={...SHUTTLE_SPEC};v.wheels=v.renderMeshes.filter(m=>m.metadata.part.startsWith('wheel:'));v.doors=[0,1].map(i=>v.renderMeshes.filter(m=>m.metadata.part.startsWith('door:'+i+':')));
 v.wheelPivots=v.wheels.map(m=>{const bits=m.metadata.part.split(':');const side=Number(bits[1]),z=Number(bits[2]);const a=anchor(B,scene,v.root,'wheel-pivot-'+side+'-'+z,side*1.21,.49,z);m.parent=a;m.position.set(-side*1.21,-.49,-z);return a;});
 v.boardingAnchors=SHUTTLE_SPEC.doorCentersZ.map((z,i)=>anchor(B,scene,v.root,'boarding-'+i,1.85,0,z));v.thresholdAnchors=SHUTTLE_SPEC.doorCentersZ.map((z,i)=>anchor(B,scene,v.root,'threshold-'+i,1.25,.52,z));
 v.seatAnchors=[];for(const z of [2, .55,-2.05,-3.45,-4.45])for(const x of [-.65,.65])v.seatAnchors.push(anchor(B,scene,v.root,'seat-'+v.seatAnchors.length,x,.98,z));
 v.driverAnchor=anchor(B,scene,v.root,'driver',-.65,.98,4.25);v.doorOpen=[0,0];
 v.setDoorOpen=(amount,index)=>{const a=Number.isFinite(amount)?Math.max(0,Math.min(1,amount)):0;for(const i of index===undefined?[0,1]:[index]){if(i!==0&&i!==1)throw new RangeError('door index must be 0 or 1');v.doorOpen[i]=a;for(const m of v.doors[i]){const half=Number(m.metadata.part.split(':')[2]);m.position.x=.14*a;m.position.z=half*.66*a;}}};
 return v;
}
export function createShuttleStopVisual(B,scene,options={}){
 const variant=options.poleOnly?'poleOnly':options.variant||(options.compact?'compact':'standard');if(!STOP_SPECS[variant])throw new RangeError('Unknown shelter variant '+variant);
 const name=String(options.stopName||'순환 정류소').slice(0,24),p=pool(B,scene),v=instantiate(p,stopTemplate(p,variant,name),options);v.dimensions={...STOP_SPECS[variant],units:'design meters; roof/pole overhang excluded'};v.variant=variant;v.waitingAnchor=anchor(B,scene,v.root,'waiting',0,0,variant==='poleOnly'?.6:STOP_SPECS[variant].depth/2+.3);return v;
}
