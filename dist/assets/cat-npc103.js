/* 3NU approved chibi cats. Procedural source + runtime. No global events or textures. */
export const CAT_COATS=['cheese','tuxedo','calico','tabby','black','cream'];
export const CAT_ROLES=['commuter','reader','artist','musician','athlete','relax'];
export const CAT_ACTIONS=['idle','walk','sit','read','sketch','stretch','drink','nod'];
const pools=new WeakMap();
const palette={cheese:['#f8bb65','#b96829','#ffdf9c'],tuxedo:['#494541','#494541','#fff0d4'],calico:['#fff0d3','#49413d','#fff0d3'],tabby:['#b1a69c','#655f5a','#eadcc8'],black:['#393634','#393634','#51443a'],cream:['#f6dfb3','#e5bf82','#ffebca'],snowpoint:['#edf0ee','#8796a7','#fafbf6']};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function acquire(B,scene){let p=pools.get(scene);if(p)return p;const material=new B.StandardMaterial('3NU.cat.shared',scene);material.diffuseColor=B.Color3.White();material.specularColor=new B.Color3(.05,.05,.05);p={B,scene,material,refs:0,templates:new Map(),colors:new Map(),headMaterials:new Map(),textures:[]};pools.set(scene,p);p.color=h=>{if(!p.colors.has(h))p.colors.set(h,B.Color3.FromHexString(h));return p.colors.get(h)};p.headMat=(coat,paint)=>{if(p.headMaterials.has(coat))return p.headMaterials.get(coat);const t=new B.DynamicTexture('cat.shared.head.'+coat,{width:512,height:256},scene,false);const ctx=t.getContext(),im=ctx.createImageData(512,256);for(let y=0;y<256;y++)for(let x=0;x<512;x++){const a=(x+.5)/512*Math.PI*2,b=(y+.5)/256*Math.PI,c=p.color(paint(.5*Math.sin(b)*Math.cos(a),.5*Math.cos(b),-.5*Math.sin(b)*Math.sin(a))),i=(y*512+x)*4;im.data[i]=c.r*255;im.data[i+1]=c.g*255;im.data[i+2]=c.b*255;im.data[i+3]=255}ctx.putImageData(im,0,0);t.update(false);const m=material.clone('cat.head.'+coat);m.diffuseTexture=t;if(coat==='snowpoint'){m.specularColor.set(0,0,0);m.emissiveColor=new B.Color3(.09,.09,.09);}p.headMaterials.set(coat,m);p.textures.push(t);return m;};p.release=()=>{if(--p.refs)return;for(const ms of p.templates.values())for(const m of ms)m.dispose(false,false);for(const m of p.headMaterials.values())m.dispose(false,false);for(const t of p.textures)t.dispose();p.playerMaterial?.dispose();material.dispose();pools.delete(scene)};return p;}
function build(p,key,fn){if(p.templates.has(key))return p.templates.get(key);const {B,scene}=p,groups=new Map();let part='torso';
 const add=(m,col)=>{const pos=m.getVerticesData(B.VertexBuffer.PositionKind),colors=[];for(let i=0;i<pos.length;i+=3){const c=p.color(typeof col==='function'?col(pos[i],pos[i+1],pos[i+2]):col);colors.push(c.r,c.g,c.b,1);}if(!m.getVerticesData(B.VertexBuffer.UVKind))m.setVerticesData(B.VertexBuffer.UVKind,new Array(pos.length/3*2).fill(0));m.setVerticesData(B.VertexBuffer.ColorKind,colors);m.material=p.material;m.isPickable=false;m.checkCollisions=false;if(!groups.has(part))groups.set(part,[]);groups.get(part).push(m);return m;};
 const egg=(n,x,y,z,w,h,d,col,segments=6)=>{const m=B.MeshBuilder.CreateSphere(n,{diameter:1,segments},scene);add(m,col);m.position.set(x,y,z);m.scaling.set(w,h,d);return m};
 const box=(n,x,y,z,w,h,d,col)=>{const m=B.MeshBuilder.CreateBox(n,{width:1,height:1,depth:1},scene);add(m,col);m.position.set(x,y,z);m.scaling.set(w,h,d);return m};
 const tube=(n,points,r,col,tessellation=6)=>{const m=B.MeshBuilder.CreateTube(n,{path:points.map(a=>B.Vector3.FromArray(a)),radius:r,tessellation,cap:B.Mesh.CAP_ALL},scene);return add(m,col)};
 function ear(x,outer,inner,size=1){
  // Rounded triangular pillow, geometry on both sides, no flat billboard ears.
  const corners=[[-.19,0],[.19,0],[.025,.31]],outline=[];
  for(let i=0;i<3;i++){const a=corners[(i+2)%3],b=corners[i],c=corners[(i+1)%3],s=[b[0]*.72+a[0]*.28,b[1]*.72+a[1]*.28],e=[b[0]*.72+c[0]*.28,b[1]*.72+c[1]*.28];for(let j=0;j<5;j++){const t=j/4;outline.push([(1-t)**2*s[0]+2*t*(1-t)*b[0]+t*t*e[0],(1-t)**2*s[1]+2*t*(1-t)*b[1]+t*t*e[1]])}}
  function shape(scale,zdepth,color){const positions=[],indices=[],normals=[];const rings=size===1?[[.72,-zdepth],[1,0],[.72,zdepth]]:[[.68,-zdepth],[.9,-zdepth*.62],[1,0],[.9,zdepth*.62],[.68,zdepth]];for(const [s,z]of rings)for(const [u,v]of outline)positions.push(x+u*scale*s+(size===1?0:Math.sign(x)*v*scale*s*.29),.29+v*scale*s,-.035+z);const n=outline.length;for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const a=r*n+i,b=r*n+(i+1)%n,c=(r+1)*n+i,d=(r+1)*n+(i+1)%n;indices.push(a,b,c,b,d,c)}for(const r of[0,rings.length-1]){const center=positions.length/3;positions.push(x,.39,-.035+(r===0?-zdepth:zdepth));for(let i=0;i<n;i++)indices.push(center,r*n+(r===0?(i+1)%n:i),r*n+(r===0?i:(i+1)%n))}
   // Babylon's left-handed front winding faces outward on the player ear shell.
   if(size!==1)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
   B.VertexData.ComputeNormals(positions,indices,normals);const m=new B.Mesh('rounded-ear',scene),v=new B.VertexData();v.positions=positions;v.indices=indices;v.normals=normals;v.applyToMesh(m);add(m,color);return m}
  const shell=shape(1,.095,outer),inset=shape(.68,size===1?.035:.003,inner);inset.position.z=size===1?.09:.095;if(size!==1){for(const m of [shell,inset]){m.scaling.setAll(size);m.position.x=x*(1-size);m.position.y=0.24-.29*size;m.position.z=m.position.z*size-.035*(1-size);}}
 }
 fn({B,scene,egg,box,tube,ear,setPart:n=>part=n});const result=[];for(const [bone,ms]of groups){const srcMaterial=ms[0].material;const m=B.Mesh.MergeMeshes(ms,true,true);m.name=key+'.'+bone;m.metadata={bone:bone==='headSkin'?'head':bone};m.material=bone==='headSkin'?srcMaterial:p.material;if(key==='coat.snowpoint'){if(bone!=='headSkin'){if(!p.playerMaterial){p.playerMaterial=p.material.clone('cat.player.matte125');p.playerMaterial.specularColor.set(0,0,0);p.playerMaterial.emissiveColor=new B.Color3(.06,.06,.06);}m.material=p.playerMaterial;}const normals=[];B.VertexData.ComputeNormals(m.getVerticesData(B.VertexBuffer.PositionKind),m.getIndices(),normals);m.setVerticesData(B.VertexBuffer.NormalKind,normals);}m.isPickable=false;m.checkCollisions=false;m.setEnabled(false);result.push(m)}p.templates.set(key,result);return result;
}
function coatTemplate(p,coat){return build(p,'coat.'+coat,q=>{const {egg,tube,ear,setPart}=q,[base,stripe,belly]=palette[coat];

 // Cheek width at a given normalized height, shared by the skin and face details.
 const cheekScale=y=>1+.15*Math.exp(-((y+.31)**2)/.12);
 const blush=coat==='snowpoint'?Array.from({length:25},(_,i)=>'#'+[237,240,238].map((v,j)=>Math.round(v+([237,193,184][j]-v)*i/24).toString(16).padStart(2,'0')).join('')):null;
 const paintHead=(x,y,z)=>{x*=2;y*=2;z*=2;if(coat==='snowpoint'){if(z>.2&&y>.38){for(const a of [-.20,0,.20]){if(((x-a*(.6+y))/.053)**2+((y-.91)/(a===0?.48:.33))**2<1)return '#b4bec6';}}const glow=Math.max(0,1-((Math.abs(x)-.54)/.15)**2-((y+.22)/.07)**2);return z>.25?blush[Math.round(glow*24)]:base;}if(coat==='cheese'||coat==='tabby'){if(z>.15&&[0,-.22,.22].some(v=>((x-v)/.065)**2+((y-.68)/.3)**2<1))return stripe;if(Math.abs(x)>.72&&Math.abs(y-.02)<.09||Math.abs(x)>.79&&Math.abs(y+.22)<.055)return stripe;if(z>.1&&y<-.12&&Math.abs(x)<.62)return belly;}if(coat==='tuxedo'&&z>.1&&y<-.1+.28*Math.exp(-Math.abs(x)*7))return belly;if(coat==='calico'){if(y>.15&&x<-.08)return '#f1ad51';if(x>.2&&y>-.22)return '#49413d';}return base;};
 const player=coat==='snowpoint';
 setPart('torso');if(player){egg('little-pear-body',0,.29,0,.56,.54,.45,base,14);}else{egg('plump-body',0,.4,0,.66,.65,.49,base,8);egg('belly',0,.39,.213,.43,.43,.07,belly,6);}
 if(coat==='calico'){egg('orange-body-patch',-.24,.37,.13,.2,.28,.2,'#eda94e');egg('dark-body-patch',.23,.28,.14,.15,.17,.12,'#49413d')}
 setPart('headSkin');const skin=egg('big-round-head',0,0,0,player?1.12:1.14,player?0.788:.87,player?0.778:.81,'#ffffff',player?20:16);
 if(player){
  const positions=skin.getVerticesData(q.B.VertexBuffer.PositionKind);
  for(let i=0;i<positions.length;i+=3)positions[i]*=cheekScale(2*positions[i+1]);
  skin.setVerticesData(q.B.VertexBuffer.PositionKind,positions);
 }
 skin.material=p.headMat(coat,paintHead);setPart('head');ear(player?-.345:-.365,coat==='calico'?'#f1ad51':player?'#abb8c1':base,player?'#efc6bc':'#eea391',player?1.23:1);ear(player?.345:.365,coat==='calico'?'#49413d':player?'#abb8c1':base,player?'#efc6bc':'#eea391',player?1.23:1);
 if(player){
  // Keep the eyes and embroidered features on the same curved face.
  const faceZ=(x,y)=>0.389*Math.sqrt(Math.max(0,1-(x/(.56*cheekScale(y/.394)))**2-(y/0.394)**2));
  const facePatch=(name,x,y,width,height,depth,lift,color,segments)=>{
   const mesh=egg(name,0,0,0,1,1,1,color,segments);
   const vertices=mesh.getVerticesData(q.B.VertexBuffer.PositionKind);
   for(let i=0;i<vertices.length;i+=3){
    const px=x+vertices[i]*width, py=y+vertices[i+1]*height;
    vertices[i+2]=faceZ(px,py)+lift+vertices[i+2]*depth;
    vertices[i]=px; vertices[i+1]=py;
   }
   mesh.setVerticesData(q.B.VertexBuffer.PositionKind,vertices);
  };
  for(const side of [-1,1]){
   const x=side*.198;
   facePatch('soft-eye',x,.010,.139,.146,.010,.003,'#423b3b',12);
   facePatch('pupil',x,.010,.115,.119,.008,.009,'#302d2e',12);
   facePatch('eye-glint',x-.021,.032,.030,.029,.005,.016,'#fff9ee',8);
  }
  for(const side of [-1,1]){
   for(const [x,y] of [[.307,-.075],[.333,-.064],[.312,-.096]])
    facePatch('whisker-dot',side*x,y,.014,.012,.003,.003,'#baaba5',6);
  }
  facePatch('tiny-nose',0,-.050,.060,.038,.011,.003,'#b78582',10);
  const stitch=(name,points)=>tube(name,points.map(([x,y])=>[x,y,faceZ(x,y)+.001]),.007,'#645353',8);
  stitch('mouth-stem',[[0,-.059],[0,-.077]]);
  for(const side of [-1,1])stitch('smile',[[0,-.077],[side*.014,-.097],[side*.032,-.097],[side*.047,-.079]]);
 }else{
  // Preserve the original six NPC faces exactly.
  for(const side of[-1,1]){egg('bean-eye',side*.175,.005,.393,.079,.091,.047,coat==='black'?'#d39536':'#302922',8);if(coat==='black')egg('dark-pupil',side*.175,.005,.418,.044,.057,.015,'#29251f',6);egg('eye-glint',side*.175-.012,.027,coat==='black'?.43:.416,.022,.023,.012,'#fff8e6',4);if(coat!=='black')egg('blush',side*.31,-.12,.345,.125,.071,.025,'#eeb291',6);}
  egg('nose',0,-.071,.419,.062,.043,.034,'#d58f76',6);tube('mouth-stem',[[0,-.09,.421],[0,-.126,.425]],.009,'#513a2b');
  for(const side of[-1,1])tube('smile',[[0,-.125,.425],[side*.026,-.153,.423],[side*.049,-.154,.418],[side*.069,-.138,.412]],.009,'#513a2b');
 }
 for(const side of[-1,1]){setPart(side<0?'rightArm':'leftArm');egg('short-arm',side*.018,player?-.075:-.104,.025,player?.165:.205,player?.21:.29,player?.18:.225,base,player?10:6);egg('paw',side*.018,player?-.14:-.19,.066,player?.16:.195,player?.13:.17,player?.16:.19,player?stripe:belly,player?10:6);setPart(side<0?'rightLeg':'leftLeg');egg('short-leg',0,-.045,0,.235,.22,.25,base,player?10:6);egg('foot',0,-.109,.051,.25,.12,.29,coat==='snowpoint'?stripe:belly,player?10:6);}
 setPart('tail');const path=[];for(let i=0;i<=13;i++){const t=i/13;path.push([.08+(player?.37:.47)*Math.sin(t*1.5),.12+(player?.42:.58)*t,-.17-.15*Math.sin(t*Math.PI)])}tube('thick-curved-tail',path,.105,coat==='snowpoint'?stripe:base,6);egg('tail-tip',...path.at(-1),.207,.207,.207,coat==='snowpoint'?stripe:base,6);
 if(coat==='cheese'||coat==='tabby'){for(const i of[3,6,9])tube('tail-band',path.slice(i,i+2),.109,stripe,10)}
 });}
function propTemplate(p,role){return build(p,'role.'+role,q=>{const {egg,box,tube,setPart}=q;
 if(role==='commuter'||role==='reader'){setPart('torso');egg('backpack',0,.43,-.29,.45,.49,.22,'#246463');box('backpack-pocket',0,.36,-.408,.28,.16,.05,'#1b4c5a');for(const x of[-.19,.19])tube('strap',[[x,.65,-.17],[x,.62,.18],[x,.34,.23]],.035,'#28575b');}
 if(role==='reader'){setPart('prop');const a=box('book-left',-.105,0,0,.22,.29,.035,'#4d825d');a.rotation.y=-.18;const b=box('book-right',.105,0,0,.22,.29,.035,'#4d825d');b.rotation.y=.18;box('pages',0,0,.024,.39,.245,.025,'#f8edcf');setPart('page');box('turning-page',.095,0,0,.19,.242,.008,'#fff7de');}
 if(role==='artist'){setPart('prop');box('sketch-cover',0,0,0,.37,.4,.03,'#976d50');box('paper',0,0,.021,.33,.36,.012,'#fff1d9');tube('sketch-line',[[-.12,-.04,.03],[-.04,.06,.03],[.03,-.005,.03],[.11,.075,.03]],.007,'#897667');setPart('pencil');const m=box('thick-pencil',0,0,0,.035,.26,.035,'#cf9c42');m.rotation.z=-.35;egg('pencil-tip',.045,-.13,0,.025,.045,.025,'#473c30');setPart('head');egg('small-beret',-.15,.4,-.06,.48,.14,.39,'#a55f44');egg('beret-stem',-.16,.48,-.06,.04,.07,.04,'#804730');}
 if(role==='musician'){setPart('torso');egg('instrument-case',.34,.42,-.27,.26,.77,.19,'#354650');box('case-handle',.46,.47,-.25,.06,.15,.08,'#95785b');tube('shoulder-strap',[[-.2,.66,-.13],[-.13,.6,.23],[.23,.29,.21],[.34,.27,-.2]],.027,'#67523d');}
 if(role==='athlete'){setPart('head');const path=[];for(let i=0;i<=24;i++){const a=i*Math.PI*2/24;path.push([.505*Math.cos(a),.205,.354*Math.sin(a)])}tube('mint-headband',path,.035,'#7ac3ae',8);setPart('prop');egg('bottle',0,0,0,.13,.26,.13,'#8ac9bd');box('bottle-cap',0,.15,0,.075,.045,.075,'#3a7c7b');}
 if(role==='relax'){setPart('torso');box('tote',-.32,.36,-.08,.22,.28,.16,'#d7c394');tube('tote-handle',[[-.42,.5,-.08],[-.36,.66,-.08],[-.25,.54,-.08]],.018,'#b69e70');setPart('prop');egg('cup',0,0,0,.17,.18,.17,'#cfa645');egg('cup-rim',0,.08,0,.176,.035,.176,'#ead196');tube('cup-handle',[[.07,.05,0],[.13,.05,0],[.145,-.02,0],[.08,-.045,0]],.018,'#cfa645');}
 });}
function defaultRole(coat){return CAT_ROLES[CAT_COATS.indexOf(coat)]||'commuter'}
function validate(coat,role,playerOnly=false){if(!(playerOnly?coat==='snowpoint':CAT_COATS.includes(coat)))throw new RangeError('Unknown coat '+coat);if(!CAT_ROLES.includes(role))throw new RangeError('Unknown role '+role)}
// The six NPC coats remain unchanged; the player-only seventh appearance is not in CAT_COATS.
export function createCatNPC(B,scene,options={}){return createCatRig(B,scene,options,false)}
export function createPlayerCat125(B,scene,options={}){return createCatRig(B,scene,{...options,coat:'snowpoint',role:'commuter'},true)}
function createCatRig(B,scene,options={},playerOnly=false){
 let coat=options.coat||'cheese',role=options.role||defaultRole(coat);validate(coat,role,playerOnly);const p=acquire(B,scene);p.refs++;const root=new B.TransformNode(options.id||'3NU-cat',scene);root.scaling.setAll(Number.isFinite(options.scale)&&options.scale>0?options.scale:1);
 const bones={};function node(n,x,y,z,parent=root){const a=new B.TransformNode(root.name+'.'+n,scene);a.parent=parent;a.position.set(x,y,z);return a}
 const rig=node('rig',0,0,0);for(const [n,pos]of Object.entries({torso:[0,0,0],head:[0,playerOnly?.86:1.005,.02],rightArm:[playerOnly?-.25:-.29,playerOnly?.40:.57,.015],leftArm:[playerOnly?.25:.29,playerOnly?.40:.57,.015],rightLeg:[-.16,.17,0],leftLeg:[.16,.17,0],tail:[0,0,0],prop:[0,.56,.37],page:[0,.56,.4],pencil:[.25,.57,.4]}))bones[n]=node(n,...pos,rig);
 const anchors={leftHand:node('leftHand',.018,playerOnly?-.14:-.19,.066,bones.leftArm),rightHand:node('rightHand',-.018,playerOnly?-.14:-.19,.066,bones.rightArm),seat:node('seat',0,.25,0,rig),head:node('headAnchor',0,0,0,bones.head)};
 let meshes=[],props=[],enabled=true,disposed=false,propsVisible=true,clock=0,phase=Number.isFinite(options.phase)?options.phase:0,action='idle',seated=false;
 const api={root,anchors,renderMeshes:meshes,coat,role,action};
 function attach(templates,isProp){for(const m of templates){const c=m.clone(root.name+'.'+m.name,bones[m.metadata.bone],true);c.setEnabled(true);c.isPickable=false;c.checkCollisions=false;meshes.push(c);if(isProp)props.push(c)}}
 api.setAppearance=({coat:nextCoat=coat,role:nextRole}={})=>{if(disposed)return;nextRole=nextRole||(nextCoat===coat?role:defaultRole(nextCoat));validate(nextCoat,nextRole,playerOnly);const ct=coatTemplate(p,nextCoat),pt=playerOnly?[]:propTemplate(p,nextRole);for(const m of meshes)m.dispose(false,false);meshes=[];props=[];coat=nextCoat;role=nextRole;attach(ct,false);attach(pt,true);api.renderMeshes=meshes;api.coat=coat;api.role=role;api.setPropsVisible(propsVisible);};
 api.setPropsVisible=v=>{if(disposed)return;propsVisible=!!v;for(const m of props)m.setEnabled(propsVisible)};
 api.setAction=(a,o={})=>{if(disposed)return;if(!CAT_ACTIONS.includes(a))throw new RangeError('Unknown action '+a);action=a;seated=a==='sit'||!!o.seated;api.action=a;};
 api.setEnabled=v=>{enabled=!!v;if(!disposed)root.setEnabled(enabled)};
 api.update=(dt,time)=>{if(disposed||!enabled)return;if(Number.isFinite(time))clock=time;else clock+=Math.max(0,Number.isFinite(dt)?dt:0);const t=clock+phase,s=Math.sin(t*5.5),idle=Math.sin(t*1.6);rig.position.y=seated?-.075:action==='walk'?Math.abs(s)*(playerOnly?.009:.018):idle*(playerOnly?.003:.006);
  bones.head.rotation.set(0,Math.sin(t*.7)*(playerOnly?.025:.055),playerOnly?Math.sin(t*.9)*.015:0);bones.head.position.y=playerOnly?.86:1.005;
  for(const [n,side]of [['leftArm',1],['rightArm',-1]]){bones[n].position.set(side*(playerOnly?.25:.29),playerOnly?.40:.57,.015);bones[n].rotation.set(action==='walk'?s*side*(playerOnly?.25:.38):0,0,side*.06)}
  for(const [n,side]of [['leftLeg',1],['rightLeg',-1]]){bones[n].position.set(side*.16,.17,0);bones[n].rotation.set(seated?-1.1:action==='walk'?-s*side*(playerOnly?.3:.4):0,0,0);if(seated)bones[n].position.y=.19;const a=bones[n].rotation.x,cy=-.109*Math.cos(a)-.051*Math.sin(a),ry=Math.hypot(.06*Math.cos(a),.145*Math.sin(a));bones[n].position.y=Math.max(bones[n].position.y,-rig.position.y-cy+ry+.002,-rig.position.y+.045*Math.cos(a)+Math.hypot(.11*Math.cos(a),.125*Math.sin(a))+.002);}
  bones.tail.position.y=seated?.075:0;bones.tail.rotation.y=Math.sin(t*1.7)*.12;bones.tail.rotation.x=0;
  bones.prop.position.set(0,.56,.37);bones.prop.rotation.set(-.15,0,0);bones.page.position.copyFrom(bones.prop.position);bones.page.position.z+=.027;bones.page.rotation.set(-.15,0,0);bones.pencil.position.set(.25,.57,.4);bones.pencil.rotation.set(0,0,0);
  if(action==='read'||action==='sketch'){bones.head.rotation.x=.09;bones.leftArm.rotation.x=-.8;bones.rightArm.rotation.x=-.8;bones.prop.position.y=.55;if(action==='read')bones.page.rotation.y=-Math.max(0,Math.sin(t*.8))*2.1;else{bones.pencil.position.x=.13+Math.sin(t*3)*.045;bones.pencil.position.y=.59+Math.cos(t*4)*.025;bones.rightArm.rotation.x=-.8+Math.sin(t*4)*.07}}
  if(action==='stretch'){bones.leftArm.rotation.z=2.0+idle*.12;bones.rightArm.rotation.z=-2.0-idle*.12;bones.head.rotation.x=-.08;}
  if(action==='drink'){const lift=.5+.5*Math.sin(t*1.2);bones.prop.position.set(.15,.52+lift*.26,.42);bones.prop.rotation.x=-lift*.45;bones.leftArm.rotation.x=-.7-lift*.65;bones.leftArm.position.y=.57+lift*.18;bones.leftArm.position.x=.29-lift*.12;bones.head.rotation.x=-lift*.04;}
  if(action==='nod'||role==='musician')bones.head.rotation.x=Math.sin(t*3)*.075;
  // Role props at rest sit near hands; the face remains unobstructed.
  if(role==='athlete'&&action!=='drink')bones.prop.position.set(.36,.36,.16);
  if(role==='relax'&&action!=='drink')bones.prop.position.set(.28,.43,.26);
  if(role==='athlete'||role==='relax'){const a=bones.leftArm,q=anchors.leftHand.position,cx=Math.cos(a.rotation.x),sx=Math.sin(a.rotation.x),cz=Math.cos(a.rotation.z),sz=Math.sin(a.rotation.z),y=q.y*cx-q.z*sx,z=q.y*sx+q.z*cx;bones.prop.position.set(a.position.x+q.x*cz-y*sz,a.position.y+q.x*sz+y*cz+.055,a.position.z+z+.06);}
  anchors.seat.position.y=seated?.075:.25;
 };
 api.reset=(o={})=>{if(disposed)return;clock=0;phase=Number.isFinite(o.phase)?o.phase:0;api.setAppearance({coat:o.coat||coat,role:o.role});api.setPropsVisible(true);api.setAction(o.action||'idle');api.setEnabled(true);api.update(0,0)};
 root.onDisposeObservable.addOnce(()=>{disposed=true;p.release()});api.dispose=()=>{if(!disposed)root.dispose(false,false)};
 api.setAppearance({coat,role});api.update(0,0);return api;
}
