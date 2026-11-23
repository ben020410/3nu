/* Local leisure UI, grounded seats and on-demand photos. No labels or graph registrations. */
// Feet must be on the lawn side of the deck. In air the same reach includes height.
function beanbagInReach97(position,bag,airborne){
 const height=position.y-.95-bag.y;
 if(height<-.55||(!airborne&&height>.55))return false;
 return Math.hypot(position.x-bag.x,position.z-bag.z,airborne?height:0)<=2.6;
}
if(typeof module==='object'&&module.exports)module.exports={beanbagInReach97};

async function createLeisure97(B,scene,engine,rig,world,nav,hooks){
 const $=id=>document.getElementById(id),V=(x,y,z)=>new B.Vector3(x,y,z),player=rig.player;
 const placements=await fetch('data/beanbags97.json').then(r=>r.json()),l=nav.outdoor.lawn,bags=[],rejected=[];
 const source=B.MeshBuilder.CreateSphere('beanbag97-source',{diameter:2,segments:20,updatable:true},scene),pp=source.getVerticesData(B.VertexBuffer.PositionKind);
 for(let k=0;k<pp.length;k+=3){const x=pp[k],y=pp[k+1],z=pp[k+2],top=Math.max(0,y);pp[k]=x*.78;pp[k+2]=z*.93;pp[k+1]=Math.max(0,.40+y*.48-.23*Math.exp(-(x*x/.3+(z-.17)**2/.4))*top+Math.max(0,-z)*top*.42);}
 source.updateVerticesData(B.VertexBuffer.PositionKind,pp);const normals=[];B.VertexData.ComputeNormals(pp,source.getIndices(),normals);source.updateVerticesData(B.VertexBuffer.NormalKind,normals);source.refreshBoundingInfo();source.isVisible=false;source.isPickable=false;
 const materials=new Map();for(const q of placements){if(!materials.has(q.color)){const m=new B.StandardMaterial('beanbag97-'+q.color,scene);m.diffuseColor=B.Color3.FromHexString(q.color);m.specularColor=B.Color3.FromHexString('#171717');m.specularPower=12;materials.set(q.color,m);}}
 // Use current lawn axes, inspect actual upward surface and check walking height at all footprint corners.
 function ground(x,z){const h=world.floorAt(x,z,l.base+l.rise);const hit=scene.pickWithRay(new B.Ray(V(x,h+2,z),V(0,-1,0),4),m=>m.isEnabled()&&m.isVisible&&!m.name.startsWith('walker')&&!m.name.startsWith('beanbag97')&&!m.name.startsWith('cloud97'));return hit?.hit&&Math.abs(hit.pickedPoint.y-h)<.18?hit.pickedPoint.y:null;}
 const adjusted=[];
 for(const q of placements){let placed=false;
  for(const [du,dv]of [[0,0],[0,-4*Math.sign(q.v)],[3,-4*Math.sign(q.v)],[-3,-4*Math.sign(q.v)],[0,-7*Math.sign(q.v)]]){
   const u=q.u+du,v=q.v+dv,x=l.center[0]+l.u[0]*u+l.v[0]*v,z=l.center[1]+l.u[1]*u+l.v[1]*v,y=ground(x,z),bear=l.bear15;
   const safe=y!==null&&Math.abs(u)<l.innerU-2&&Math.abs(v)<l.innerV-2&&Math.hypot(x-bear.center[0],z-bear.center[1])>12&&!world.blocked(x,z,.95,y)&&!bags.some(b=>Math.hypot(b.x-x,b.z-z)<2.3)&&[[.65,.65],[-.65,.65],[.65,-.65],[-.65,-.65]].every(([dx,dz])=>{const g=ground(x+dx,z+dz);return g!==null&&Math.abs(g-y)<.08;});
   if(!safe)continue;
   const m=source.clone('beanbag97-'+q.id);m.isVisible=true;m.position.set(x,y,z);m.rotation.y=q.angle;m.material=materials.get(q.color);m.isPickable=true;m.receiveShadows=true;m.freezeWorldMatrix();bags.push({id:q.id,x,y,z,angle:q.angle,mesh:m});if(du||dv)adjusted.push({id:q.id,du,dv});placed=true;break;
  }if(!placed)rejected.push(q.id);
 }
 $('guide').hidden=true;
 const prompt=document.createElement('button');prompt.id='interact97';prompt.hidden=true;prompt.innerHTML='<kbd>F</kbd> <span>앉기</span>';document.body.append(prompt);
 // Clone title cards so names, images and descriptions have one source of truth.
 for(const card of document.querySelectorAll('#startForm .characterCard')){const c=card.cloneNode(true),input=c.querySelector('input');const portrait=c.querySelector('img[data-settings-src]');if(portrait)portrait.src=portrait.dataset.settingsSrc;input.name='character97';input.onchange=()=>{hooks.character(input.value);sync()};$('settingsCharacters').append(c);}
 document.querySelectorAll('[name=quality97]').forEach(e=>e.onchange=()=>{hooks.quality(e.value);sync()});
 function sync(){const s=hooks.state();document.querySelectorAll('[name=character97]').forEach(e=>e.checked=e.value===s.character);document.querySelectorAll('[name=quality97]').forEach(e=>e.checked=e.value===hooks.getQuality());}
 $('openSettings').addEventListener('click',sync);$('settings').addEventListener('toggle',sync);
 let pendingSeat=false;let seat=null,near=null,last=0,photoBusy=false,blob=null,url=null;
 function safeStand(b){for(const angle of [0,Math.PI/2,-Math.PI/2,Math.PI]){const a=b.angle+angle,x=b.x+Math.sin(a)*1.65,z=b.z+Math.cos(a)*1.65,y=ground(x,z);if(y!==null&&Math.abs(y-b.y)<.2&&!world.blocked(x,z,.45,y)&&!bags.some(q=>q!==b&&Math.hypot(x-q.x,z-q.z)<1.15))return V(x,y+.95,z);}return null;}
 function stand(){if(!seat)return true;const p=safeStand(seat);if(!p)return false;player.position.copyFrom(p);seat=null;hooks.releaseSeat?.();$('autoWalk').disabled=false;hooks.stop();return true;}
 function available(s){return s.playing&&!s.paused&&!s.riding&&!photoBusy&&!photo.open;}
 async function sitAt(candidate,wanted=()=>true){
  const s=hooks.state();
  if(pendingSeat||!available(s))return;
  if(seat)return;
  if(!candidate||!beanbagInReach97(player.position,candidate,s.airborne)||!safeStand(candidate))return;
  pendingSeat=true;
  try{
   if(!await(hooks.claimSeat?.('beanbag:'+candidate.id)??true))return;
   const next=hooks.state();
   if(!wanted()||!available(next)||!beanbagInReach97(player.position,candidate,next.airborne)){
    hooks.releaseSeat?.();return;
   }
   seat=candidate;
   player.position.set(seat.x+Math.sin(seat.angle)*.12,seat.y+1.2,seat.z+Math.cos(seat.angle)*.12);
   player.rotation.y=seat.angle;
   hooks.stop();hooks.groundSeat();
   $('autoWalk').disabled=true;return true;
  }finally{pendingSeat=false;}
 }
 function interact(){if(seat){if(available(hooks.state()))stand();return;}return sitAt(near);}
 $('world').addEventListener('campus-interact',interact);prompt.onclick=()=>{document.activeElement.blur();interact();$('world').focus()};
 $('returnTitle').onclick=()=>{if(!stand())return;closePhoto();hooks.title();};
 const photo=document.createElement('dialog');photo.id='photo97';photo.setAttribute('aria-label','찍은 사진');photo.innerHTML='<header><div><small>3NU · PHOTO</small><h2>캠퍼스의 한 장면</h2></div><button id="closePhoto97" aria-label="사진 닫기">✕</button></header><img id="photoImage97" alt="실시간 캠퍼스 촬영 사진"><footer><button id="share97">공유하기</button><button id="save97">이미지 저장</button></footer><p id="photoStatus97" role="status"></p>';document.body.append(photo);
 const flash=document.createElement('div');flash.id='flash97';document.body.append(flash);
 const reply=PhotoReply126.install(photo,{place:hooks.placePhotoReply,clear:hooks.clearInput,paused:()=>!!hooks.state().paused,capture:()=>capture()});
 const editor=createPhotoEditor103(photo,newBlob=>{if(url)URL.revokeObjectURL(url);blob=newBlob;reply.setBlob(blob);url=URL.createObjectURL(blob);$('photoImage97').src=url;});
 function release(){editor.clear();if(url)URL.revokeObjectURL(url);url=null;blob=null;$('photoImage97').removeAttribute('src');}
 function closePhoto(){photo.close();release();hooks.clearInput();$('world').focus();}
 photo.addEventListener('close',()=>{release();hooks.clearInput();$('world').focus()});$('closePhoto97').onclick=closePhoto;
 function download(){if(!url)return;const a=document.createElement('a');a.href=url;a.download=reply.active?'3NU-photo-reply.png':'3NU-photo.png';a.click();$('photoStatus97').textContent='이미지를 저장해 원하는 곳에 공유하세요.';}
 $('save97').onclick=download;$('share97').onclick=async()=>{if(!blob)return;$('photoStatus97').textContent='';const file=new File([blob],reply.active?'3NU-photo-reply.png':'3NU-photo.png',{type:'image/png'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'3NU · 캠퍼스의 한 장면'})}catch(e){if(e.name==='AbortError')$('photoStatus97').textContent='공유를 취소했어요.';else download()}}else download();};
 async function capture(){if(photoBusy||!hooks.state().playing||hooks.state().paused)return;photoBusy=true;const capturedMeta={place:hooks.location?.()||'서울대학교 캠퍼스',date:new Date().toLocaleDateString('ko-KR')};hooks.clearInput();release();try{const A=window.AudioContext||window.webkitAudioContext;if(A){const a=new A(),o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(720,a.currentTime);o.frequency.exponentialRampToValueAtTime(130,a.currentTime+.065);g.gain.setValueAtTime(.035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.09);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.095);o.onended=()=>a.close();}}catch{}document.body.classList.add('capturing97');
  try{const copy=document.createElement('canvas');copy.width=engine.getRenderWidth();copy.height=engine.getRenderHeight();
   await new Promise(resolve=>{scene.onBeforeRenderObservable.addOnce(()=>{const meshes=[...new Set(hooks.photoMeshes())],saved=meshes.map(m=>[m,m.isVisible]);for(const [m]of saved)m.isVisible=false;scene.onAfterRenderObservable.addOnce(()=>{copy.getContext('2d').drawImage($('world'),0,0);reply.setShot(PhotoReply126.shotFrom(scene.activeCamera,engine,player,hooks.state().flying));for(const [m,v]of saved)m.isVisible=v;resolve()})})});
   const result=reply.finish(copy);if(result!==copy)copy.width=copy.height=0;await editor.set(result,capturedMeta);photo.querySelector('h2').textContent=reply.active?'한 자리, 두 장의 사진':'캠퍼스의 한 장면';if(!blob)throw Error('사진 저장 실패');$('photoStatus97').textContent='';flash.animate([{opacity:.8},{opacity:0}],{duration:180});photo.showModal();
  }catch(e){$('photoStatus97').textContent='촬영하지 못했어요. 다시 시도해주세요.';photo.showModal();}finally{document.body.classList.remove('capturing97');photoBusy=false;}
 }
 return{bags,rejected,editor,reply,interact,sitAt,get nearby(){return !!near},get seated(){return !!seat},get busy(){return photoBusy||photo.open||reply.busy},stand,capture,update(now){if(now-last<120)return;last=now;reply.ready();const s=hooks.state();near=null;if(s.playing&&!s.paused&&!s.riding&&!photoBusy&&!photo.open){let best=2.6;for(const b of bags){const d=Math.hypot(player.position.x-b.x,player.position.z-b.z);if(d<=best&&beanbagInReach97(player.position,b,s.airborne)){near=b;best=d;}}}const visible=s.playing&&!s.paused&&!s.riding&&!photo.open&&!photoBusy&&(seat||near);prompt.hidden=!visible;const text=seat?'일어나기':'앉기';if(prompt.lastElementChild.textContent!==text)prompt.lastElementChild.textContent=text;},audit:()=>({count:bags.length,rejected,adjusted,seated:seat?.id||null,near:near?.id||null,photo:photo.open,url:!!url})};
}
