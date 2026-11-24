/* BUILD125: bounded, versioned cosmetics. Names/routes/physics stay outside this model. */
(function(root,f){if(typeof module==='object')module.exports=f();else root.CharacterStyle125=f()})(this,()=>{
 const colors=[{id:'navy',name:'네이비',hex:'#263b70'},{id:'blue',name:'블루',hex:'#6e9fbd'},{id:'cream',name:'크림',hex:'#ded3b7'},{id:'sage',name:'세이지',hex:'#7b9b83'},{id:'red',name:'버건디',hex:'#a15b5f'}],kinds=['rio','baekhak','cat'],wears=['none','scarf','cap'];
 const normalize=s=>({kind:kinds.includes(s?.kind)?s.kind:'rio',wear:wears.includes(s?.wear)?s.wear:'none',color:colors.some(c=>c.id===s?.color)?s.color:'navy'});
 const valid=s=>s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).every(k=>['wear','color'].includes(k))&&wears.includes(s.wear)&&colors.some(c=>c.id===s.color);
 function load(storage,kind){try{return normalize({...JSON.parse(storage.getItem('3nu.style125')||'{}'),kind})}catch{return normalize({kind})}}
 function save(storage,s){try{storage.setItem('3nu.style125',JSON.stringify(normalize(s)));return true}catch{return false}}
 return{colors,kinds,wears,normalize,valid,load,save};
});
function createCastClothes126(B,scene){
 const meta=scene.metadata||(scene.metadata={});
 const materials=meta.castClothMaterials126||(meta.castClothMaterials126=new Map());
 function material(color,wear='scarf'){const key=wear==='cap'?'beanie:'+color:color;if(!materials.has(key)){const m=new B.StandardMaterial('style125-'+key,scene);m.diffuseColor=B.Color3.FromHexString(CharacterStyle125.colors.find(c=>c.id===color).hex);m.specularColor=new B.Color3(.08,.08,.08);if(wear==='cap'){
  m.backFaceCulling=false;m.twoSidedLighting=true;
  let knit=scene.metadata?.beanieKnit125;if(!knit){knit=new B.DynamicTexture('beanie-knit125',{width:128,height:128},scene,true);const ctx=knit.getContext();ctx.fillStyle='#ffffff';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#f5f5f3';ctx.lineWidth=2.1;ctx.lineCap='round';for(let y=-8;y<136;y+=16)for(let x=0;x<128;x+=16){ctx.beginPath();ctx.moveTo(x+3,y);ctx.quadraticCurveTo(x+3,y+6,x+8,y+12);ctx.quadraticCurveTo(x+13,y+6,x+13,y);ctx.stroke()}knit.wrapU=knit.wrapV=B.Texture.WRAP_ADDRESSMODE;knit.update(false);scene.metadata.beanieKnit125=knit;}m.diffuseTexture=knit;m.specularColor.set(.025,.025,.025);
 }materials.set(key,m)}return materials.get(key)}
 // Tailored rigid cloth meshes follow existing head/torso bones; no cloth simulation.
 // Geometry is shared by kind/wear within a scene, including local and remote rigs.
 const geometryCache=scene.metadata?.costumeGeometry125||(scene.metadata={...scene.metadata,costumeGeometry125:new Map()}).costumeGeometry125;
 function custom(name,positions,indices){const m=new B.Mesh(name,scene),v=new B.VertexData(),normals=[];B.VertexData.ComputeNormals(positions,indices,normals);v.positions=positions;v.indices=indices;v.normals=normals;v.uvs=new Array(positions.length/3*2).fill(0);v.applyToMesh(m);return m;}
 function surface(name,rows,cols,point,keep=()=>true){const p=[],idx=[];for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++)p.push(...point(r/rows,c/cols));for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(!keep((r+.5)/rows,(c+.5)/cols))continue;const a=r*(cols+1)+c,b=a+1,d=a+cols+2,e=d-1;idx.push(a,e,b,b,e,d);}return custom(name,p,idx);}
 function flip(m){const idx=Array.from(m.getIndices());for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];const n=[];B.VertexData.ComputeNormals(m.getVerticesData(B.VertexBuffer.PositionKind),idx,n);m.setIndices(idx);m.setVerticesData(B.VertexBuffer.NormalKind,n);return m;}
 function merge(parts,name){const m=B.Mesh.MergeMeshes(parts,true,true);m.name=name;return m;}
 function clothRibbon(path,width){const p=[],idx=[],n=path.length;for(let side=0;side<2;side++)for(let i=0;i<n;i++){const a=path[i],w=width*(1-.30*i/(n-1));for(const sign of [-1,1])p.push(a[0]+sign*w/2,a[1]+sign*.014*i/(n-1),a[2]+(side?-.009:.009));}for(let i=0;i<n-1;i++){const a=i*2,b=a+2,c=a+2*n,d=c+2;idx.push(a,a+1,b,a+1,b+1,b,c,d,c+1,c+1,d,d+1,a,b,c,b,d,c,a+1,c+1,b+1,b+1,c+1,d+1);}idx.push(0,2*n,1,1,2*n,2*n+1,2*n-2,2*n-1,4*n-2,2*n-1,4*n-1,4*n-2);return custom('scarf-soft-end125',p,idx);}
 function makeScarf(type){const cfg={rio:{top:.19,bottom:.035,rx0:.395,rx1:.435,rz0:.345,rz1:.35,z:.01,k:[.285,.075,.285],a:[[.29,.075,.31],[.275,.01,.34],[.245,-.08,.355],[.225,-.18,.34],[.25,-.23,.32]],b:[[.28,.075,.31],[.34,.01,.31],[.355,-.07,.295],[.34,-.125,.275]],width:.115},baekhak:{top:.25,bottom:.135,rx0:.15,rx1:.155,rz0:.176,rz1:.18,z:.01,k:[.12,.17,.14],a:[[.12,.17,.16],[.13,.09,.21],[.12,0,.264],[.105,-.09,.285],[.13,-.16,.284]],b:[[.125,.17,.16],[.18,.10,.205],[.205,.015,.235],[.19,-.045,.26]],width:.082},cat:{top:.465,bottom:.345,rx0:.32,rx1:.275,rz0:.243,rz1:.235,z:.02,k:[.21,.385,.205],a:[[.21,.385,.235],[.20,.33,.25],[.175,.27,.26],[.155,.21,.255],[.17,.17,.245]],b:[[.21,.385,.235],[.25,.33,.23],[.26,.28,.22],[.245,.23,.215]],width:.09}}[type];
  const collar=surface('scarf-wrap125',4,40,(v,u)=>{const a=u*Math.PI*2,rx=cfg.rx0+(cfg.rx1-cfg.rx0)*v,rz=cfg.rz0+(cfg.rz1-cfg.rz0)*v;return[rx*Math.sin(a),cfg.top+(cfg.bottom-cfg.top)*v-.012*Math.cos(a),cfg.z+rz*Math.cos(a)]});
  // Narrow rolled edges keep the wrap soft without a bulky doughnut silhouette.
  const parts=[flip(collar)];for(const v of[0,1]){const path=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;path.push(new B.Vector3((cfg.rx0+(cfg.rx1-cfg.rx0)*v)*Math.sin(a),cfg.top+(cfg.bottom-cfg.top)*v-.012*Math.cos(a),cfg.z+(cfg.rz0+(cfg.rz1-cfg.rz0)*v)*Math.cos(a)))}parts.push(B.MeshBuilder.CreateTube('scarf-hem125',{path,radius:.009,tessellation:5},scene));}
  const knot=B.MeshBuilder.CreateSphere('scarf-knot125',{diameter:1,segments:12},scene);knot.scaling.set(cfg.width*1.08,.075,.058);knot.position.set(...cfg.k);knot.rotation.z=-.38;parts.push(knot,clothRibbon(cfg.a,cfg.width),clothRibbon(cfg.b,cfg.width*.8));return merge(parts,'scarf-tailored125-'+type);
 }
 // Keep the stored/wire identifier "cap" so saved looks remain valid; the visible item is a beanie.
 function makeCap(type){
  const c={rio:{rx:.385,rz:.342,bottom:.215,fold:.325,top:.635},baekhak:{rx:.354,rz:.309,bottom:.16,fold:.26,top:.525},cat:{rx:.572,rz:.415,bottom:.18,fold:.29,top:.605}}[type];
  const coord=(v,u)=>{const a=u*Math.PI*2,r=Math.cos(v*Math.PI/2),soft=1+.012*Math.sin(v*Math.PI),rib=.0022*Math.cos(a*32)*r;return[(c.rx*soft+rib)*r*Math.sin(a),c.fold+(c.top-c.fold)*(1-r*r), (c.rz*soft+rib)*r*Math.cos(a)-.018*(1-r*r)]};
  const crown=flip(surface('beanie-crown125',20,64,coord));const crownUV=[];for(let r=0;r<=20;r++)for(let u=0;u<=64;u++)crownUV.push(u/64*3,r/20);crown.setVerticesData(B.VertexBuffer.UVKind,crownUV);
  // Rounded, folded cuff: one closed surface, shallow ribs, no visor or pompom.
  const profile=[[-.008,.018],[.002,.003],[.018,0],[.028,.016],[.030,.035],[.030,c.fold-c.bottom-.023],[.023,c.fold-c.bottom-.004],[.006,c.fold-c.bottom+.006],[-.008,c.fold-c.bottom-.006],[-.008,.018]];
  const cuff=surface('beanie-fold125',profile.length-1,64,(v,u)=>{const q=profile[Math.round(v*(profile.length-1))],a=u*Math.PI*2,rib=.0025*Math.cos(a*32);return[(c.rx+q[0]+rib)*Math.sin(a),c.bottom+q[1],(c.rz+q[0]+rib)*Math.cos(a)]});
  const cuffUV=[];for(let r=0;r<profile.length;r++)for(let u=0;u<=64;u++)cuffUV.push(u/64*3,r/(profile.length-1)*.45);cuff.setVerticesData(B.VertexBuffer.UVKind,cuffUV);
  // Tone follows the selected material; cuff gets a restrained knitted shadow.
  for(const [m,tone]of [[crown,1],[cuff,.94]]){const colors=[];for(let i=0;i<m.getTotalVertices();i++)colors.push(tone,tone,tone,1);m.setVerticesData(B.VertexBuffer.ColorKind,colors)}
  return merge([crown,cuff],'beanie-tailored125-'+type);
 }
 function garment(type,wear){const key=type+':'+wear,g=geometryCache.get(key);let m;if(g&&!g.isDisposed()){m=new B.Mesh(wear+'-tailored125-'+type,scene);g.applyToMesh(m);}else{m=wear==='cap'?makeCap(type):makeScarf(type);geometryCache.set(key,m.geometry);}m.isPickable=false;m.checkCollisions=false;m.metadata={renderRole99:'actor',cosmetic125:true};return m;}
 return {garment,material};
}
/* One small render target on the EXISTING engine; no second WebGL context or campus copy. */
function createStylePreview125(B,engine,canvas){
 let scene=null,rig=null,target=null,camera=null,pending=false,active=false,last=0,pose='idle',time=0,closed=false;
 function ensure(){if(scene)return;scene=new B.Scene(engine);scene.clearColor=new B.Color4(.97,.97,.95,0);camera=new B.FreeCamera('wardrobe125-camera',new B.Vector3(.35,.9,4.1),scene);camera.setTarget(new B.Vector3(0,0,0));camera.fov=.52;camera.freezeProjectionMatrix(B.Matrix.PerspectiveFovLH(.52,280/340,.1,100));scene.activeCamera=camera;new B.HemisphericLight('wardrobe125-light',new B.Vector3(-.4,1,1),scene).intensity=.95;rig=createWalker15(B,scene);rig.player.rotation.y=.15;target=new B.RenderTargetTexture('wardrobe125-preview',{width:280,height:340},scene,false,true);target.activeCamera=camera;target.clearColor=new B.Color4(0,0,0,0);canvas.width=280;canvas.height=340;}
 function open(style){closed=false;ensure();active=true;set(style)}
 function set(style){ensure();rig.setCharacter(style.kind);rig.setStyle(style);target.renderList=rig.player.getChildMeshes();last=0}
 async function tick(now){if(!active||pending||now-last<100)return;last=now;pending=true;try{time+=.1;rig.animate(.1,pose==='walk',false,false,9,false,false);if(pose==='wave')rig.actionPose('wave',time);target.render();const read=target.readPixels();engine.restoreDefaultFramebuffer();const pixels=await read;if(closed||!pixels)return;const ctx=canvas.getContext('2d'),im=new ImageData(new Uint8ClampedArray(pixels.buffer,pixels.byteOffset,pixels.byteLength),280,340);ctx.putImageData(im,0,0);canvas.style.transform='scaleY(-1)';}finally{engine.restoreDefaultFramebuffer();pending=false;if(closed)destroy()}}
 function destroy(){if(pending)return;rig?.dispose125?.();scene?.dispose();scene=rig=target=camera=null;}
 return{open,set,rotate:dx=>{if(rig){rig.player.rotation.y+=dx*.014;last=0}},pose:v=>{pose=v;last=0},tick,close(){active=false;closed=true;destroy()},audit:()=>({active,pending,context:'shared',size:[280,340]})};
}
