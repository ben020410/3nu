/* Short nearby speech; no chat archive or identity is exposed to the game client. */
(function(root){
 'use strict';
 const phrases={
  commuter:['오늘도 잘 다녀와.','정류장 표지판을 누르면 셔틀 안내까지 데려다줘.','천천히 걸어도 돼.'],
  reader:['읽던 데까지만 읽고 갈게.','갈 곳이 궁금하면 아래 ‘장소’에서 찾아봐.','한 장만 더 읽고 갈래.'],
  artist:['이 색 조합 괜찮네.','가까운 바닥을 눌러 봐. 그쪽으로 걸어갈 수 있어.','눈에 담아 두려고.'],
  musician:['자꾸 같은 멜로디가 떠올라.','음악을 잠깐 끄고 싶으면 오른쪽 위 스피커를 눌러 봐.','걸으면서 박자 맞추고 있어.'],
  athlete:['잠깐 몸 좀 풀고 갈게.','아래 ‘날기’로 떠 봐. 내려올 땐 같은 자리의 ‘착륙’이야.','쉬는 것도 운동이지.'],
  relax:['여기서 잠깐 쉬는 중이야.','빈백을 누르면 다가가서 앉을 수 있어. 잠깐 쉬어 가.','아무 생각 안 하는 중.']
 };
 // Geographic facts require both the resident and the viewer on this named ground area.
 function matchPlace(position,viewer,places=[]){if(!position||!viewer)return null;return places.filter(p=>Math.hypot(position.x-p.x,position.z-p.z)<=p.radius&&Math.hypot(viewer.x-p.x,viewer.z-p.z)<=p.radius&&Math.abs(position.y-p.y)<=p.heightTolerance&&Math.abs(viewer.y-p.y)<=p.heightTolerance).sort((a,b)=>Math.hypot(position.x-a.x,position.z-a.z)/a.radius-Math.hypot(position.x-b.x,position.z-b.z)/b.radius)[0]||null}
 function createApproachPolicy({places=[]}={}){
  const inside=new Set(),cooldown=new Map(),zoneUntil=new Map(),recent=new Map(),lastBody=new Map(),localTurns=new Map();let nextAt=0;
  return{step(candidates,now,allowed=true,viewer=null){
   const eligible=candidates.filter(n=>n.distance<7&&n.visible).map(n=>({...n,place:matchPlace(n.position,viewer,places)})),near=new Set(candidates.filter(n=>n.distance<11).map(n=>n.id));
   for(const id of inside)if(!near.has(id))inside.delete(id);
   const entering=eligible.filter(n=>!inside.has(n.id));for(const n of eligible)inside.add(n.id);
   if(!allowed||now<nextAt)return null;
   const area=n=>n.place?.id||n.zone;
   const n=entering.sort((a,b)=>Number(!!b.place)-Number(!!a.place)||a.distance-b.distance).find(n=>now>=(cooldown.get(n.id)||0)&&now>=(zoneUntil.get(area(n))||0));if(!n)return null;
   let body,fact=null;
   if(n.place?.lines?.length){const turn=localTurns.get(n.place.id)||0,lines=n.place.lines;for(let offset=0;offset<lines.length;offset++){const next=lines[(turn+offset)%lines.length],text=next.variants?.[n.role]||next.text;if(text===lastBody.get(n.id))continue;fact=next;body=text;localTurns.set(n.place.id,turn+offset+1);break}if(!body)return null}
   else{const list=phrases[n.role]||phrases.relax,fresh=list.filter(t=>t!==lastBody.get(n.id)&&now>=(recent.get(t)??-Infinity)+30000);if(!fresh.length)return null;fresh.sort((a,b)=>(recent.get(a)??-Infinity)-(recent.get(b)??-Infinity));body=fresh[0];recent.set(body,now)}
   // The old last-five list exhausted a three-line role forever. Time-limited
   // suppression lets genuine revisits speak, without rearming a nearby camper.
   lastBody.set(n.id,body);cooldown.set(n.id,now+60000);zoneUntil.set(area(n),now+30000);nextAt=now+14000;
   return{...n,body,factId:fact?.id||null,placeId:n.place?.id||null};
  }};
 }
 function bubbleDisposition(now,until,p,viewer){if(now>=until)return 'remove';if(!p)return 'wait';return Math.hypot(p.x-viewer.x,p.z-viewer.z)>40||Math.abs(p.y-viewer.y)>14?'remove':'show'}
 let instance=null;
 function create({B,scene,engine,player,multiplayer,life,hooks}){
  instance?.destroy();const policy=createApproachPolicy({places:life?.socialPlaces127||[]}),bubbles=new Map(),layer=document.createElement('div');layer.id='socialBubbles127';layer.setAttribute('aria-hidden','true');document.body.append(layer);
  const dialog=document.createElement('dialog');dialog.id='socialComposer127';dialog.setAttribute('aria-labelledby','socialHeading127');
  dialog.innerHTML='<form><header><strong id="socialHeading127">근처에 한마디</strong><button type="button" data-close aria-label="채팅 닫기" data-centered-icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><p>같은 채널의 가까운 사람에게 보여요.</p><label for="socialText127">보낼 말</label><div class="socialInput127"><input id="socialText127" autocomplete="off" maxlength="240" enterkeyhint="send" placeholder="짧게 인사를 건네 보세요"><button type="submit">보내기</button></div><div class="socialFoot127"><span data-status role="status" aria-live="polite"></span><span data-count>0 / 120</span></div></form>';
  document.body.append(dialog);const input=dialog.querySelector('input'),status=dialog.querySelector('[data-status]'),count=dialog.querySelector('[data-count]'),submit=dialog.querySelector('[type=submit]');let composing=false,compositionEnd=-Infinity,sending=false,lastTick=-Infinity,npc=null,playerUntil=0,destroyed=false;
  function clearBubbles(){for(const q of bubbles.values())q.element.remove();bubbles.clear();npc?.element.remove();npc=null}
  function close(){if(dialog.open)dialog.close();input.blur();hooks.clear?.();hooks.focus?.()}
  let projection=null;
  function position(p){if(!projection)return null;const {w,h,viewport,rect,transform,identity}=projection,q=B.Vector3.Project(new B.Vector3(p.x,p.y+2,p.z),identity,transform,viewport);if(q.z<=0||q.z>=1||q.x<0||q.y<0||q.x>w||q.y>h)return null;return{x:rect.left+q.x/w*rect.width,y:rect.top+q.y/h*rect.height}}
  function bubble(body,isNPC=false){const el=document.createElement('div');el.className='socialBubble127'+(isNPC?' npc127':'');el.textContent=body;el.hidden=true;layer.append(el);return el}
  function place(el,p){const q=p&&position(p);el.hidden=!q;if(q){el.style.left=q.x+'px';el.style.top=q.y+'px'}}
  function viewport(){if(!dialog.open)return;const v=window.visualViewport;dialog.style.top=((v?.offsetTop||0)+(v?.height||innerHeight)-16)+'px';dialog.style.maxHeight=Math.max(100,(v?.height||innerHeight)-24)+'px'}
  const unsubscribe=multiplayer.subscribeSocial(m=>{
   if(m.type==='reset'){clearBubbles();if(dialog.open){status.textContent='연결이 바뀌었어요. 잠시 후 다시 보내 주세요.'}return}
   if(m.type==='left'){bubbles.get(m.actor)?.element.remove();bubbles.delete(m.actor);return}
   if(m.type!=='chat')return;const now=performance.now();bubbles.get(m.actor)?.element.remove();bubbles.set(m.actor,{element:bubble(m.body),until:now+6500});playerUntil=now+7500;npc?.element.remove();npc=null;
  });
  function openChat(){const s=hooks.state();if(destroyed||!s.playing||s.paused&&!dialog.open)return false;if(dialog.open){input.focus();return true}hooks.stop?.();hooks.clear?.();status.textContent=multiplayer.connected?'':'온라인 연결 후 보낼 수 있어요.';dialog.showModal();viewport();input.focus();return true}
  async function send(){if(sending||composing||performance.now()-compositionEnd<40)return;const text=input.value.trim();if(!text||[...text].length>120){status.textContent='1~120자로 입력해 주세요.';return}if(!multiplayer.connected){status.textContent='온라인 연결 후 보낼 수 있어요.';return}sending=true;submit.disabled=true;input.readOnly=true;status.textContent='보내는 중…';const result=await multiplayer.sendChat(text);sending=false;submit.disabled=false;input.readOnly=false;if(destroyed)return;if(result.ok){input.value='';count.textContent='0 / 120';close()}else{status.textContent=result.error||'보내지 못했어요.';if(dialog.open)input.focus()}}
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();send()};dialog.querySelector('[data-close]').onclick=close;
  input.addEventListener('compositionstart',()=>composing=true);input.addEventListener('compositionend',()=>{composing=false;compositionEnd=performance.now()});input.addEventListener('input',()=>{count.textContent=[...input.value].length+' / 120'});
  dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&(e.isComposing||composing||e.keyCode===229||performance.now()-compositionEnd<40))e.preventDefault();if(e.key==='Escape'&&!composing){e.preventDefault();close()}});
  dialog.addEventListener('keyup',e=>e.stopPropagation());dialog.addEventListener('cancel',e=>{e.preventDefault();close()});dialog.addEventListener('close',()=>{hooks.clear?.();hooks.focus?.()});
  window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
  function update(now){if(now-lastTick<100)return;lastTick=now;const s=hooks.state(),allowed=s.playing&&!s.paused&&!dialog.open&&!document.hidden;if(!s.playing){clearBubbles();if(dialog.open)close();return}
   if(!allowed){for(const [id,q]of bubbles){if(now>q.until){q.element.remove();bubbles.delete(id)}else q.element.hidden=true}npc?.element.remove();npc=null;policy.step((life?.socialCandidates?.()||[]).map(n=>({...n,distance:Math.hypot(n.position.x-player.position.x,n.position.z-player.position.z),visible:true})),now,false);return}
   const camera=scene.activeCamera;if(!camera)return;const w=engine.getRenderWidth(),h=engine.getRenderHeight();projection={w,h,viewport:camera.viewport.toGlobal(w,h),rect:engine.getRenderingCanvas().getBoundingClientRect(),transform:scene.getTransformMatrix(),identity:B.Matrix.Identity()};
   for(const [id,q]of bubbles){const p=multiplayer.actorPosition(id),action=bubbleDisposition(now,q.until,p,player.position);if(action==='remove'){q.element.remove();bubbles.delete(id)}else if(action==='wait')q.element.hidden=true;else place(q.element,p)}
   const candidates=(life?.socialCandidates?.()||[]).map(n=>({...n,distance:Math.hypot(n.position.x-player.position.x,n.position.z-player.position.z)})).filter(n=>n.distance<11).map(n=>({...n,visible:Math.abs(n.position.y-player.position.y)<4&&!!position(n.position)}));
   const viewer={x:player.position.x,y:player.position.y-.95,z:player.position.z},chosen=policy.step(candidates,now,allowed&&!s.airborne&&now>=playerUntil,viewer);
   if(npc){const n=candidates.find(n=>n.id===npc.id);if(!allowed||!n?.visible||n.distance>10||now>npc.until||npc.placeId&&matchPlace(n.position,viewer,life?.socialPlaces127)?.id!==npc.placeId){npc.element.remove();npc=null}else place(npc.element,n.position)}
   if(chosen&&!npc){npc={id:chosen.id,placeId:chosen.placeId,element:bubble(chosen.body,true),until:now+Math.min(8500,Math.max(5500,chosen.body.length*125))};place(npc.element,chosen.position)}
  }
  instance={openChat,close,update,get busy(){return dialog.open},destroy(){destroyed=true;unsubscribe();clearBubbles();dialog.remove();layer.remove();window.visualViewport?.removeEventListener('resize',viewport);window.visualViewport?.removeEventListener('scroll',viewport)},audit:()=>({busy:dialog.open,playerBubbles:bubbles.size,npc:npc?.id||null})};return instance;
 }
 const api={create,createApproachPolicy,openChat:()=>instance?.openChat()||false,close:()=>instance?.close(),get busy(){return instance?.busy||false}};root.CampusSocial127=api;if(typeof module!=='undefined')module.exports={createApproachPolicy,bubbleDisposition,matchPlace};
})(typeof window!=='undefined'?window:globalThis);
