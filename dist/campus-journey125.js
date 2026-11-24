/* Local campus rehearsal. Geometry is model-verified, not a surveyed real-world route. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CampusJourney125=api;})(globalThis,()=>{
'use strict';
const IDS={start:'228476658',end:'482207537'};
const xyz=p=>[p[0],p[2],p[1]];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function course(nav){
 const model=nav.engineering35;if(!model?.anchors?.['301']||!model.anchors['302'])return null;
 const G=model.ground,D=model.deck,A=model.anchors;
 const deck=[[36,-945.28,D],[36,-944.6,D],[24,-944.6,D],[14,-949,D],[8,-957,D],[12,-970,D],[12,-974,D],[12,-985,G+2.4],[12,-987,G+2.4],[7,-987,G+2.4],[7,-989,G+2.4],[7,-1001,G],[7,-1003,G]];
 // Existing pedestrian alignment, with clearance around the 301 side-entry landing.
 const side=[[14.639,-1002.132],[15.428,-1031.591],[9.9281,-1051.5494],[8.3567,-1057.2518],[6.5,-1060],[6.5,-1073],[10.7,-1078],[13.0160477707,-1085.61616242]].map(([x,z])=>[x,z,G]);
 const entry=[side.at(-1),[15.5,-1102,G],[15.5,-1116,G+2.4],xyz(A['302'].approach),[23,-1132.01,G+2.4]];
 return{id:'engineering-301-302',start:xyz(A['301'].entryApproach),end:entry.at(-1),ground:deck.at(-1),fork:side.at(-1),deck,side,entry,
  segments:[[...deck,...side],entry],label:'301동 → 302동',verification:'건물 위치·외관: 자료 대조 / 입구·계단 높이·통행 경로: 현재 3NU 모델 기준. 최신 현장 통행은 미확인.'};
}
function checkWalk(world,coords,tolerance=.3){
 if(!coords?.length||coords.some(p=>p.length!==3||!p.every(Number.isFinite)))return{ok:false,reason:'invalid-points'};
 let p={x:coords[0][0],z:coords[0][1],y:coords[0][2]+.95};let walked=0;
 if(world.blocked(p.x,p.z,.42,p.y-.95))return{ok:false,reason:'blocked-start'};
 for(let i=1;i<coords.length;i++){
  const goal=coords[i];let n=0;
  while(Math.hypot(p.x-goal[0],p.z-goal[1])>.055&&n++<10000){
   const dx=goal[0]-p.x,dz=goal[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(.12,d),q=world.move(p,dx/d*step,dz/d*step);
   if(q.distance<.001)return{ok:false,reason:'blocked-segment',segment:i,at:[p.x,p.z,p.y-.95]};
   walked+=q.distance;p=q;
  }
  if(n>=10000||Math.abs(p.y-.95-goal[2])>tolerance)return{ok:false,reason:'wrong-level',segment:i,at:[p.x,p.z,p.y-.95]};
 }
 return{ok:true,distance:walked,end:[p.x,p.z,p.y-.95]};
}
function stopOrder(stops,state,selectedId){
 const selected=stops.findIndex(s=>s.id===selectedId),start=stops.findIndex(s=>s.id===(state.dwell?state.stopId:state.nextStopId));
 if(start<0||selected<0)return null;
 return{count:(selected-start+stops.length)%stops.length+(state.dwell?0:1),now:state.dwell&&state.stopId===selectedId};
}
function create({B,scene,world,nav,data,player,shuttle,hooks,enableClassRoute=false}){
 const route=course(nav);if(!route)return null;
 const status=()=>{const s=hooks.state();return{...s,route:s.route||{moving:s.moving,arrived:s.arrived}};};
 const doc=document,css=doc.createElement('link');css.rel='stylesheet';css.href='campus-journey125.css?v=125';doc.head.append(css);
 let panel=null,launcher=null,resume=null;
 if(enableClassRoute){
  panel=doc.createElement('section');panel.className='nuJourney125';panel.hidden=true;panel.setAttribute('aria-label','첫 수업길 미리 가보기');
  panel.innerHTML='<header><span class="journey-tag125">첫 수업길</span><button data-do="dismiss" aria-label="수업길 안내 접기" data-centered-icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 12h12"/></svg></button></header><ol class="journey-steps125" aria-label="진행 단계"><li>301동 입구</li><li>갈림길</li><li>302동 입구</li></ol><h2></h2><p class="journey-copy125" aria-live="polite"></p><p class="journey-tip125"></p><div class="journey-actions125"></div><details><summary>이 길의 확인 범위</summary><p>'+route.verification+'</p><a href="https://eng.snu.ac.kr/communication/notice/notice?bbsidx=4957&amp;md=v" target="_blank" rel="noopener">공대 공식 301·302동 안내 ↗</a></details>';
  doc.body.append(panel);
  launcher=doc.createElement('button');launcher.type='button';launcher.className='nuJourneyLaunch125';launcher.innerHTML='<span class="journey-pictures125"><img src="assets/building-profiles95/'+IDS.start+'.jpg" alt=""><img src="assets/building-profiles95/'+IDS.end+'.jpg" alt=""></span><span><small>첫 수업길 미리 가보기</small><strong>301동에서 302동까지</strong><span>입구 확인 · 갈림길 선택 · 도착</span></span><b aria-hidden="true">↗</b>';
  const host=doc.querySelector('#nu-next .place-list');if(host?.querySelector('.search-box'))host.querySelector('.search-box').after(launcher);else(host||doc.body).append(launcher);
  resume=doc.createElement('button');resume.type='button';resume.className='nuJourneyResume125';resume.hidden=true;resume.textContent='수업길 이어보기';doc.body.append(resume);
  panel.onclick=e=>{const b=e.target.closest('[data-do]');if(b)action(b.dataset.do);};launcher.onclick=open;resume.onclick=()=>{folded=false;draw()};
 }
 const dialog=doc.createElement('dialog');dialog.className='nuJourneyStop125';dialog.setAttribute('aria-labelledby','journey-stop-title125');
 dialog.innerHTML='<header><span class="journey-tag125">셔틀로 둘러보기</span><button data-close aria-label="하차 선택 닫기" data-centered-icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><h2 id="journey-stop-title125"></h2><p class="stop-copy125" aria-live="polite"></p><div class="stop-choice125"></div><p class="journey-footnote125">3NU 안에서 운행 중인 정류장 기준입니다. 실제 학교 셔틀의 정차 지점·시간과 다를 수 있어요.</p>';
 doc.body.append(dialog);
 const trip=doc.createElement('section');trip.className='nuJourneyTrip125';trip.hidden=true;trip.setAttribute('aria-label','선택한 건물 하차 안내');trip.innerHTML='<span class="journey-tag125">하차 후 목적지</span><strong></strong><p aria-live="polite"></p><div></div>';doc.body.append(trip);
 let active=false,folded=false,stage='intro',travel=null,stageAfter=null,returnStage=null,lastTick=0,signature='',goal=null,reservation=null,pendingWalk=null,pickerToken=0,disposed=false,trace=[],lastPlaying=false,expectedTarget=null;
 const point=()=>[player.position.x,player.position.z,player.position.y-.95],near=(p,r=1.1)=>Math.hypot(point()[0]-p[0],point()[1]-p[1])<r&&Math.abs(point()[2]-p[2])<.4;
 const record=(type,more={})=>{trace.push({type,time:performance.now(),position:point(),...more});if(trace.length>250)trace.shift();};
 const message=text=>hooks.notice?.(text);
 const name=b=>(b.place?.name||b.name||'건물')+(b.place?.number?'('+b.place.number+'동)':'');
 function buttons(specs){const box=panel.querySelector('.journey-actions125');box.replaceChildren();for(const [label,action,secondary]of specs){const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.do=action;if(secondary)b.className='secondary';box.append(b);}}
 function draw(){
  if(!panel)return;
  const state=status(),hidden=!active||folded||!state.playing||state.paused||shuttle.riding;
  panel.hidden=hidden;resume.hidden=!active||!folded||!state.playing||state.paused||shuttle.riding;
  const sig=stage+'|'+!!travel;if(signature===sig)return;signature=sig;
  const content={intro:['301동 입구에서 만나요','301동에서 302동까지, 밖으로 걸어가는 길을 미리 익혀보세요.','실내 강의실까지 들어가는 코스는 아니에요.',[['출발 입구로 가기','gather']]],gather:['301동 입구로 이동 중','높은 데크의 아치형 입구 앞이 출발점이에요.','도착하면 주변을 둘러보고 출발하세요.',[['멈추기','pause']]],start:['여기가 301동 출발 입구예요','이제 데크에서 계단으로 내려가 302동 방향으로 걸어볼까요?','301동과 302동은 서로 다른 건물이에요.',[['갈림길까지 걷기','walk']]],walking:['302동 쪽으로 걷고 있어요','계단을 내려간 뒤 건물 옆길을 따라가요.','시점을 돌려 주변을 봐도 이동은 계속돼요.',[['멈추기','pause']]],fork:['여기서 어느 쪽으로 갈까요?','다음 목적지는 제2공학관, 302동입니다. 건물 번호를 보고 방향을 골라보세요.','선택하기 전에는 자동으로 출발하지 않아요.',[['302동 계단 쪽','finish'],['301동으로 돌아가는 쪽','wrong',true]]],wrong:['그쪽은 지나온 301동 방향이에요','302동은 붉은 X 프레임이 있는 건물이에요. 그 건물 쪽 계단을 찾아보세요.','입구에 도착하면 건물 번호를 한 번 더 확인해요.',[['다시 고르기','retry']]],finishing:['302동 입구로 올라가요','계단 위 보행면을 따라 입구 앞까지 이동해요.','계단과 입구 높이는 현재 모델 기준이에요.',[['멈추기','pause']]],paused:['수업길을 잠시 멈췄어요','직접 움직여도 괜찮아요. 준비되면 남은 길을 이어가세요.','멀리 벗어나면 출발 입구부터 다시 시작할 수 있어요.',[['이어서 걷기','resume'],['처음부터','restart',true]]],complete:['302동 입구 앞에 도착했어요','301동 출발 입구 → 외부 계단 → 갈림길 → 302동 입구를 걸었어요.','실제 수업 전에는 강의실 번호와 현장 출입 안내도 확인해 주세요.',[['탐방 계속하기','end'],['한 번 더 걷기','restart',true]]]};
  const [title,copy,tip,actions]=content[stage]||content.intro;panel.querySelector('h2').textContent=title;panel.querySelector('.journey-copy125').textContent=copy;panel.querySelector('.journey-tip125').textContent=tip;buttons(actions);
  panel.querySelectorAll('li').forEach((el,i)=>el.classList.toggle('current',i===(['fork','wrong','finishing'].includes(stage)?1:stage==='complete'?2:0)));
 }
 function open(){if(disposed||!panel)return;hooks.closePanels?.();if(shuttle.riding||shuttle.waiting){message('셔틀에서 내린 뒤 수업길을 시작해 주세요.');return;}active=true;folded=false;draw();}
 function stop(){hooks.stop();travel=null;goal=null;}
 function launchPath(coords,next,visualStage){
  if(hooks.state().flying||hooks.state().seated){message('지상에 서서 시작해 주세요.');return false;}
  const path=[point(),...coords];const check=checkWalk(world,path);
  if(!check.ok){message('이 구간으로 바로 이어갈 수 없어요. 출발점으로 돌아가거나 직접 보행로로 이동해 주세요.');record('path-rejected',check);return false;}
  const r=hooks.navigatePath?.(path,'수업길 · '+(next==='fork'?'302동 방향':'입구 안내'));
  if(!r?.ok){message(r?.error||'현재 위치에서 안내를 시작할 수 없어요.');return false;}
  expectedTarget=status().targetId;travel=path;goal=path.at(-1);stageAfter=next;stage=visualStage;record('walk-start',{next,points:path.length});draw();return true;
 }
 function gather(){
  if(hooks.state().flying||hooks.state().seated){message('지상에 서서 시작해 주세요.');return;}
  if(near(route.start)){stage='start';draw();return;}
  // Use the lower stair approach first: the legacy building anchor is not this entrance.
  if(near(route.ground,2)){launchPath([...route.deck].reverse(),'start','gather');return;}
  const r=hooks.navigatePoint(route.ground,'301동 출발 계단');if(!r?.ok){message(r?.error||'출발 계단까지 연결되는 길을 찾지 못했어요.');return;}
  expectedTarget=status().targetId;travel=[];goal=route.ground;stageAfter='gather-up';stage='gather';record('gather-start');draw();
 }
 function action(a){
  if(a==='dismiss'){folded=true;draw();return;}
  if(a==='end'){stop();active=false;folded=false;stage='intro';draw();return;}
  if(a==='restart'){stop();stage='intro';draw();return;}
  if(a==='gather')return gather();
  if(a==='walk')return launchPath(route.segments[0],'fork','walking');
  if(a==='finish')return launchPath(route.entry,'complete','finishing');
  if(a==='wrong'){stage='wrong';record('fork-choice',{choice:'301'});draw();return;}
  if(a==='retry'){stage='fork';draw();return;}
  if(a==='pause'){returnStage=stage;hooks.stop();stage='paused';record('paused');draw();return;}
  if(a==='resume'){
   if(travel?.length){let best=0,d=Infinity;travel.forEach((p,i)=>{const n=distance(point(),p);if(n<d){d=n;best=i;}});if(d>10){message('코스에서 멀어졌어요. 처음부터 다시 시작해 주세요.');return;}launchPath(travel.slice(best+1),stageAfter,returnStage||'walking');}
   else gather();
  }
 }
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{pickerToken++;doc.getElementById('world')?.focus({preventScroll:true});});
 function tripUI(){
  const s=status();trip.hidden=!reservation||!s.playing||s.paused||dialog.open;if(!reservation)return;
  trip.querySelector('strong').textContent=reservation.name;
  trip.querySelector('p').textContent=reservation.status==='walking'?'셔틀에서 내렸어요. 입구 쪽 보행 지점으로 안내합니다.':reservation.status==='arrived'?'목적지 앞에 도착했어요.':reservation.status==='walkFailed'?'하차했어요. 자동 길안내를 시작하지 못해 현재 위치에 머물러 있어요.':reservation.status==='walkPaused'?'도보 안내를 멈췄어요. 준비되면 이어가세요.':reservation.stop.name+'에서 내릴 예정이에요.';
  const box=trip.querySelector('div'),sig=reservation.status;if(box.dataset.state===sig)return;box.dataset.state=sig;box.replaceChildren();if(sig==='reserved')return;const b=doc.createElement('button');b.type='button';b.textContent=['walkFailed','walkPaused'].includes(sig)?'길안내 다시 시작':sig==='walking'?'길안내 멈추기':sig==='arrived'?'닫기':'예약 취소';b.onclick=()=>{if(['walkFailed','walkPaused'].includes(reservation?.status)){pendingWalk=reservation;return;}if(reservation?.status==='walking'){hooks.stop();reservation.status='walkPaused';tripUI();return;}if(shuttle.riding)shuttle.act('cancelAlight');reservation=null;pendingWalk=null;tripUI();};box.append(b);
 }
 function graphPath(start,end){const a=world.nearest(start[0],start[1],true),b=world.nearest(end[0],end[1],true);if(a==null||b==null)return null;const r=world.path(a,b);if(!r)return null;return[start,...r.nodes.map(id=>nav.points[id]),end];}
 function walkingPath(stop,b){
  const start=[stop.approach.x,stop.approach.z,stop.approach.y];let end;
  if(b.id===IDS.start){end=route.ground;const p=graphPath(start,end);return p&&[...p,...[...route.deck].reverse()];}
  if(b.id===IDS.end){const G=nav.engineering35.ground;end=[5,-1132,G];const p=graphPath(start,end);return p&&[...p,[13.4,-1132,G+2.4],route.end];}
  end=nav.points[nav.anchors[b.id]];if(!end)return null;return graphPath(start,end);
 }
 async function handleBuildingTap(id){
  if(!shuttle.riding)return false;
  const b=data.buildings.find(b=>String(b.id)===String(id));if(!b||b.landmarkOnly)return false;
  const token=++pickerToken;hooks.closePanels?.();dialog.querySelector('h2').textContent=name(b);dialog.querySelector('.stop-copy125').textContent='내린 뒤 걸어갈 수 있는 정류장을 확인하고 있어요.';dialog.querySelector('.stop-choice125').replaceChildren();if(!dialog.open)dialog.showModal();record('window-select',{buildingId:b.id});
  const center=b.p.reduce((a,p)=>[a[0]+p[0]/b.p.length,a[1]+p[1]/b.p.length],[0,0]);
  // Inspect every operating stop, shortest validated walking path wins. Never invent a stop.
  const candidates=[];
  for(const s of [...shuttle.stops].sort((a,b)=>Math.hypot(a.approach.x-center[0],a.approach.z-center[1])-Math.hypot(b.approach.x-center[0],b.approach.z-center[1]))){
   await new Promise(r=>setTimeout(r,0));if(token!==pickerToken||!shuttle.riding)return true;
   const path=walkingPath(s,b);if(!path)continue;const verified=checkWalk(world,path);if(verified.ok)candidates.push({stop:s,path,distance:verified.distance});
  }
  if(token!==pickerToken||!shuttle.riding)return true;
  candidates.sort((a,b)=>a.distance-b.distance);const chosen=candidates[0];
  const text=dialog.querySelector('.stop-copy125'),box=dialog.querySelector('.stop-choice125');
  if(!chosen){text.textContent='현재 모델에서 정류장부터 이 건물까지 이어지는 보행 경로를 확인하지 못했어요. 다른 건물을 선택하거나 정류장 지도에서 내려 주세요.';record('no-walkable-stop',{buildingId:b.id});return true;}
  const order=stopOrder(shuttle.stops,shuttle.transitState(),chosen.stop.id);
  text.textContent=chosen.stop.name+'에서 내려 걸어갈 수 있어요. '+(order?.now?'지금 정차 중인 정류장이에요.':order?order.count+'개 정류장을 지나 내려요.':'운행 방향을 확인하고 있어요.');
  const button=doc.createElement('button');button.type='button';button.textContent=chosen.stop.name+' 하차 예약';button.onclick=()=>{
   dialog.close();const r=shuttle.requestStop(chosen.stop.id);if(!r.ok){message(r.error);return;}
   reservation={buildingId:b.id,name:name(b),stop:chosen.stop,path:chosen.path,status:'reserved'};pendingWalk=null;record('reserved',{buildingId:b.id,stopId:chosen.stop.id,walkDistance:chosen.distance});tripUI();
  };box.append(button);return true;
 }
 // Synchronous dispatch for the world's tap controller; async validation stays internal.
 function tap(id){if(!shuttle.riding||!data.buildings.some(b=>String(b.id)===String(id)&&!b.landmarkOnly))return false;handleBuildingTap(id).catch(()=>{dialog.querySelector('.stop-copy125').textContent='경로 확인을 마치지 못했어요. 다시 선택해 주세요.';});return true;}
 const unsubscribe=shuttle.subscribe?.(event=>{
  if(event.type==='alight'){
   if(reservation&&event.stopId===reservation.stop.id){pendingWalk=reservation;reservation.status='walking';record('alighted',{buildingId:reservation.buildingId,stopId:event.stopId});}
   else{reservation=null;pendingWalk=null;}
  }else if(event.type==='cancel'||event.type==='reset'||event.type==='board'||event.type==='request'&&reservation&&event.stopId!==reservation.stop.id){reservation=null;pendingWalk=null;}
  tripUI();
 });
 function update(now){
  if(disposed||now-lastTick<180)return;lastTick=now;let s=status();
  if(lastPlaying&&!s.playing){stop();active=false;reservation=null;pendingWalk=null;if(dialog.open)dialog.close();stage='intro';}lastPlaying=s.playing;
  if(dialog.open&&!shuttle.riding)dialog.close();
  if(s.playing&&!s.paused&&!shuttle.riding){
   if(pendingWalk){const r=pendingWalk;pendingWalk=null;const path=[point(),...r.path.slice(1)],check=checkWalk(world,path),result=check.ok?hooks.navigatePath?.(path,r.name):{ok:false};r.status=result?.ok?'walking':'walkFailed';record('post-alight-route',{ok:!!result?.ok,stopId:r.stop.id});s=status();}
   if(reservation?.status==='walking'&&near(reservation.path.at(-1),1.3)){reservation.status='arrived';record('building-arrival',{buildingId:reservation.buildingId});}
   else if(reservation?.status==='walking'&&s.route&&!s.route.moving&&!s.route.arrived){reservation.status='walkPaused';}
   if(active&&travel&&stage!=='paused'&&goal&&near(goal)){
    const next=stageAfter;travel=null;goal=null;record('checkpoint',{next});
    if(next==='gather-up')launchPath([...route.deck].reverse(),'start','gather');else{hooks.stop();stage=next;if(next==='complete')record('course-complete');}
   }else if(active&&travel&&stage!=='paused'&&((expectedTarget&&s.targetId!==expectedTarget)||(s.route&&!s.route.moving&&!s.route.arrived))){returnStage=stage;stage='paused';record('manual-or-blocked-pause');}
  }
  draw();tripUI();
 }
 return{open,update,handleBuildingTap:tap,get busy(){return dialog.open},get active(){return active},course:route,audit:()=>({active,stage,folded,goal,reservation:reservation&&{buildingId:reservation.buildingId,stopId:reservation.stop.id,status:reservation.status},trace:trace.slice()}),dispose(){if(disposed)return;disposed=true;pickerToken++;unsubscribe?.();if(active)hooks.stop();for(const el of [panel,dialog,trip,launcher,resume,css])el?.remove();}};
}
return{create,course,checkWalk,stopOrder};
});
