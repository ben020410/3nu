/* 3NU shuttle UI. Controller owns F-key, simulation, modal priority and route-card visibility. */
(function(root){'use strict';
function etaText(seconds,present){
 if(present)return '순환셔틀이 도착했어요. 문 가까이에서 F로 탑승하세요.';
 if(!Number.isFinite(seconds))return '다음 순환셔틀 도착 시간을 확인하고 있어요.';
 const s=Math.max(0,Math.ceil(seconds));if(s<10)return '다음 순환셔틀이 곧 도착해요.';
 const m=Math.floor(s/60),r=s%60;return '다음 순환셔틀은 약 '+(m?m+'분 ':'')+(r?r+'초 ':'')+'후 도착해요.';
}
function createShuttleUI(options){
 const {mount,overlayMount=document.body,stops=[],route=[],buildings=[],onAction=()=>{}}=options;
 if(!mount)throw new Error('ShuttleUI: mount required');
 const card=document.createElement('section');card.className='nuShuttleCard';card.hidden=true;card.setAttribute('aria-label','순환셔틀 안내');
 card.innerHTML='<header><strong>순환셔틀</strong><button type="button" data-action="map">정류장 지도 보기</button></header><div class="nuShuttleStatus"></div><h3></h3><p class="nuShuttleMessage" aria-live="polite"></p><div class="nuShuttleProgress"><ol class="nuShuttleStops"></ol><span class="nuShuttleVehicle" aria-label="버스 진행 위치" hidden></span></div><p class="nuShuttleNotice" hidden>정차하면 승강장으로 내려요.</p><button type="button" class="nuShuttleAction"><kbd>F</kbd><span></span></button><button type="button" class="nuShuttleCancel" hidden>대기 그만하기</button>';
 mount.append(card);card.querySelector('.nuShuttleStops').before(card.querySelector('.nuShuttleAction'));card.querySelector('.nuShuttleAction').after(card.querySelector('.nuShuttleCancel'));
 const map=document.createElement('dialog');map.className='nuShuttleMap';map.setAttribute('aria-label','순환셔틀 전체 정류장 지도');
 map.innerHTML='<header><div><h2>순환셔틀 정류장 지도</h2><p>반시계방향 순환</p></div><button type="button" class="nuShuttleMapClose" aria-label="지도 닫기">×</button></header><div class="nuShuttleLegend"><span class="bus">■ 버스</span><span>○ 정류장</span><span class="player">● 내 위치</span></div><canvas role="img" aria-label="순환도로의 정류장, 운행 버스와 내 위치"></canvas>';
 overlayMount.append(map);const get=s=>card.querySelector(s),mg=s=>map.querySelector(s);

 let state={mode:'hidden',vehicles:[]},selected=stops[0]?.id,action=null,lastSignature='',mapPoints=[],lastMap=0;
 const name=id=>stops.find(s=>s.id===id)?.name||'';
 function update(next){state={...state,...next};card.hidden=state.mode==='hidden';
  const present=!!state.busPresent,mode=state.mode,at=name(state.stopId)||'정류장',to=name(state.nextStopId)||'다음 정류장';
  const states={near:['정류장 근처',at,etaText(state.etaSeconds,present),'정류장 안내','openStop'],menu:['정류장 안내',at,etaText(state.etaSeconds,present),'버스 대기하기','wait'],waiting:['자동 탑승 대기',at,(state.waitingPaused?'창을 닫으면 자동 탑승을 이어가요.':etaText(state.etaSeconds,false)+' 도착하면 자동으로 탑승해요.'),'자동 탑승 대기 중',null],boarding:['탑승 가능',at,etaText(0,true),'버스 타기','board'],riding:['탑승 중','다음은 '+to,etaText(state.etaSeconds,false).replace('다음 순환셔틀은 ','다음 정류장에 '),'다음 정거장에서 내리기','requestAlight'],requested:['하차 예약','다음은 '+to,(name(state.requestedStopId)||to)+'에서 내려요.','하차 예약 취소','cancelAlight'],stopped:['정차 중',at+'에 정차 중','F를 누르면 여기서 내릴 수 있어요.','여기서 내리기','alight'],alighted:['하차 완료',at+'에 도착했어요.','보행로에서 자유롭게 둘러보세요.','정류장 안내 보기','openStop']};
  const d=states[mode]||states.near;action=d[4];const sig=JSON.stringify([mode,...d,state.stopId,state.nextStopId,state.requestedStopId]);
  if(sig!==lastSignature){lastSignature=sig;get('.nuShuttleStatus').textContent=d[0];get('h3').textContent=d[1];get('.nuShuttleMessage').textContent=d[2];get('.nuShuttleAction span').textContent=d[3];get('.nuShuttleAction').disabled=!action;get('kbd').hidden=['menu','waiting'].includes(mode);card.dataset.mode=mode;get('.nuShuttleNotice').hidden=mode!=='requested';get('.nuShuttleCancel').hidden=!['menu','waiting','boarding'].includes(mode);get('.nuShuttleCancel').textContent=mode==='boarding'?'버스 대기하기':mode==='menu'?'닫기':'대기 그만하기';
   const list=get('ol');list.replaceChildren();list.hidden=['near','menu','alighted','hidden'].includes(mode);const id=['riding','requested','stopped'].includes(mode)?state.nextStopId:state.stopId;let i=stops.findIndex(s=>s.id===id);if(i<0)i=0;if(['riding','requested'].includes(mode))i=(i-1+stops.length)%stops.length;for(let n=0;n<Math.min(4,stops.length);n++){const s=stops[(i+n)%stops.length],li=document.createElement('li');li.textContent=s.name;if(n===(['riding','requested'].includes(mode)?1:0)){li.className='current';const t=document.createElement('small');t.textContent=['riding','requested','stopped'].includes(mode)?'다음':'현재';li.append(t);}list.append(li);}
  }
  const marker=get('.nuShuttleVehicle');marker.hidden=!['riding','requested'].includes(mode);if(!marker.hidden){const items=get('ol').children;if(items.length>1){const y0=items[0].offsetTop+items[0].offsetHeight/2,y1=items[1].offsetTop+items[1].offsetHeight/2;marker.style.top=(y0+(y1-y0)*Math.max(0,Math.min(1,Number(state.segmentProgress)||0))-9)+'px';}}
  if(map.open&&performance.now()-lastMap>250){drawMap();lastMap=performance.now();}
 }
 function openMap(){if(map.open)return;map.showModal();onAction('mapOpened');drawMap();}
 function closeMap(){if(map.open)map.close();}
 const click=e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;if(b.dataset.action==='map')openMap();else if(b.classList.contains('nuShuttleAction')&&action)onAction(action);else if(b.classList.contains('nuShuttleCancel'))onAction(state.mode==='boarding'?'wait':state.mode==='menu'?'closeStop':'cancelWait');};
 card.addEventListener('click',click);mg('.nuShuttleMapClose').onclick=closeMap;map.addEventListener('close',()=>onAction('mapClosed'));
 // The selected name owns a reserved gutter. Clip campus geometry to the map pane.
 // This keeps labels off buildings, vehicle marks and station circles even on a 390px screen.
 let layout=null;
 function drawMap(){if(!map.open)return;const canvas=mg('canvas'),w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);const points=route.length?route:stops.map(s=>[s.platform.x,s.platform.z]);if(!points.length)return;
  const gutter=Math.min(156,Math.max(112,w*.28)),pane=w-gutter-12,xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),x0=Math.min(...xs)-35,x1=Math.max(...xs)+35,z0=Math.min(...zs)-70,z1=Math.max(...zs)+70,scale=Math.min((pane-24)/(x1-x0),(h-40)/(z1-z0)),xy=(x,z)=>[pane/2+(x-(x0+x1)/2)*scale,h/2-(z-(z0+z1)/2)*scale];
  const path=(p,fill,stroke,lw=1)=>{if(!p?.length)return;c.beginPath();p.forEach((v,i)=>i?c.lineTo(...xy(v[0],v[1])):c.moveTo(...xy(v[0],v[1])));if(fill){c.closePath();c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}};
  c.save();c.beginPath();c.rect(0,28,pane,h-28);c.clip();buildings.forEach(b=>path(b.p,'#d8e0db'));path(points,null,'#286f9c',3);c.font='700 11px sans-serif';c.textAlign='center';c.textBaseline='middle';mapPoints=[];
  stops.forEach((s,i)=>{const a=xy(s.platform.x,s.platform.z);mapPoints.push({id:s.id,x:a[0],y:a[1]});c.beginPath();c.arc(...a,selected===s.id?11:8,0,Math.PI*2);c.fillStyle=selected===s.id?'#142f3a':'#faf9f4';c.fill();c.strokeStyle='#286f9c';c.lineWidth=2;c.stroke();c.fillStyle=selected===s.id?'white':'#142f3a';c.fillText(String(i+1),...a)});
  (state.vehicles||[]).forEach((b,i)=>{const a=xy(b.x,b.z);c.fillStyle='#286f9c';c.fillRect(a[0]-9,a[1]-7,18,14);c.fillStyle='white';c.fillText(String(i+1),...a)});
  if(state.player){const a=xy(state.player.x,state.player.z);c.beginPath();c.arc(...a,6,0,Math.PI*2);c.fillStyle='#e34c47';c.fill();c.strokeStyle='white';c.lineWidth=2;c.stroke();}c.restore();
  const chosen=mapPoints.find(p=>p.id===selected);let label=null;
  if(chosen){const maxWidth=gutter-24;c.font='700 13px sans-serif';const lines=[];let line='';for(const word of name(selected).split(/(?<=·)|(?<= )/)){if(c.measureText(word).width<=maxWidth){if(line&&c.measureText(line+word).width>maxWidth){lines.push(line);line='';}line+=word;}else for(const char of word){if(line&&c.measureText(line+char).width>maxWidth){lines.push(line);line=char;}else line+=char;}}if(line)lines.push(line);const boxH=lines.length*20+20,y=Math.max(36,Math.min(h-boxH-8,chosen.y-boxH/2));
   // Bring the gutter callout closer only where this horizontal band contains no map geometry.
   let occupied=chosen.x+12;const cover=(x0,y0,x1,y1)=>{if(y1>=y-5&&y0<=y+boxH+5&&x1>0&&x0<pane)occupied=Math.max(occupied,Math.min(pane,x1));};
   buildings.forEach(b=>{const p=b.p.map(v=>xy(...v));cover(Math.min(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[0])),Math.max(...p.map(v=>v[1])))});
   const pathPoints=points.map(v=>xy(...v));for(let i=1;i<pathPoints.length;i++){const a=pathPoints[i-1],b=pathPoints[i];cover(Math.min(a[0],b[0])-3,Math.min(a[1],b[1])-3,Math.max(a[0],b[0])+3,Math.max(a[1],b[1])+3);}
   mapPoints.forEach(p=>cover(p.x-12,p.y-12,p.x+12,p.y+12));(state.vehicles||[]).forEach(v=>{const p=xy(v.x,v.z);cover(p[0]-10,p[1]-8,p[0]+10,p[1]+8)});if(state.player){const p=xy(state.player.x,state.player.z);cover(p[0]-7,p[1]-7,p[0]+7,p[1]+7);}
   const x=Math.min(pane+12,occupied+12);label={x,y,width:gutter-8,height:boxH,clearOfMap:x>occupied};c.strokeStyle='#286f9c';c.lineWidth=1.2;c.beginPath();c.moveTo(chosen.x+11,chosen.y);c.lineTo(x-6,chosen.y);c.lineTo(x,y+boxH/2);c.stroke();c.fillStyle='#e7eff3';c.fillRect(x,y,gutter-8,boxH);c.fillStyle='#193f56';c.textAlign='left';c.textBaseline='middle';lines.forEach((text,i)=>c.fillText(text,x+8,y+20+i*20));c.beginPath();c.arc(chosen.x,chosen.y,12,0,Math.PI*2);c.stroke();}
  c.fillStyle='#243e48';c.textAlign='left';c.font='700 11px sans-serif';c.fillText('N ↑',12,17);layout={width:w,height:h,pane,label,selected,points:mapPoints.map(p=>({...p})),vehicles:(state.vehicles||[]).length};canvas.setAttribute('aria-label','정류장 지도, 선택: '+name(selected)+'. 좌우 방향키로 정류장 선택');
 }
 const canvas=mg('canvas');canvas.tabIndex=0;canvas.onclick=e=>{const r=e.target.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=mapPoints.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(p?.d<=24){selected=p.id;drawMap()}};
 canvas.onkeydown=e=>{if(!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const i=stops.findIndex(s=>s.id===selected),d=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;selected=stops[(i+d+stops.length)%stops.length].id;drawMap()};
 const resize=new ResizeObserver(()=>{if(map.open)requestAnimationFrame(drawMap)});resize.observe(mg('canvas'));
 return {getState:()=>({...state}),auditMap:()=>layout,update,openMap,closeMap,isMapOpen:()=>map.open,getAction:()=>action,element:card,destroy(){resize.disconnect();closeMap();card.remove();map.remove();}};
}
root.ShuttleUI={create:createShuttleUI,etaText};
})(globalThis);
