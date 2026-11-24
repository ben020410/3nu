/* The loading percentage estimates progress. Only a ready campus can reach 100%. */
(()=>{'use strict';const root=document.getElementById('title105'),q=s=>root.querySelector(s),app=q('#titleApp105'),home=q('#titleHome105'),page=q('#titlePage105'),load=q('#titleLoad105'),slides=[...q('.backdrop').querySelectorAll('img')],track=q('.track');let ready=false,failed=false,timer=null,index=0,lastPageButton=null;
// A browser/process restart cannot run our cleanup. Pause an unfinished mobile
// boot on the next navigation instead of allocating the entire scene again.
const bootKey117='3nu.boot117',mobile117=matchMedia('(pointer:coarse)').matches||/iPhone|iPad|iPod/.test(navigator.userAgent);let previous117=null;
try{previous117=JSON.parse(sessionStorage.getItem(bootKey117)||'null')}catch{}
let waiting117=!!(mobile117&&previous117?.pending&&Date.now()-previous117.at>=0&&Date.now()-previous117.at<600000),resume117;
const permission117=waiting117?new Promise(resolve=>resume117=resolve):Promise.resolve();
// Keep the initial mobile title light: no campus data, WebGL scene or collision
// index exists until a validated Start intent. Desktop/review boot is unchanged.
const params121=new URLSearchParams(location.search);
const diagnosticBoot=[...params121.keys()].some(key=>/^(review|bake|audit|debug|spawn)/.test(key));
const lazy121=!['review','bake119','audit49'].some(key=>params121.has(key))&&(mobile117||!diagnosticBoot);
// The browser chooses the phone crop or desktop resolution before downloading.
const cover122=q('.load img.cover');let slideTurn122=0,slideCleanup122=null;
function attachTitleImage(img){
 for(const source of img.parentElement.querySelectorAll('source'))source.srcset=source.dataset.titleSrcset;
 img.src=img.dataset.titleSrc;
}
function releaseTitleImage(img){
 img.removeAttribute('src');
 for(const source of img.parentElement.querySelectorAll('source'))source.removeAttribute('srcset');
}
function releaseSlides122(){
 slideTurn122++;clearTimeout(slideCleanup122);
 slides.forEach(releaseTitleImage);
}
async function showSlide122(next){
 const turn=++slideTurn122,img=slides[next];clearTimeout(slideCleanup122);
 if(!img.hasAttribute('src'))attachTitleImage(img);
 try{await img.decode()}catch{
  if(turn!==slideTurn122)return;
  // If the preferred WebP failed, retry the same view's JPEG.
  for(const source of img.parentElement.querySelectorAll('source'))source.removeAttribute('srcset');
  try{await img.decode()}catch{return}
 }
 if(turn!==slideTurn122)return;
 index=next;slides.forEach((image,i)=>image.classList.toggle('active',i===next));
 const releaseOthers=()=>{if(turn===slideTurn122)slides.forEach((image,i)=>{if(i!==next)releaseTitleImage(image)})};
 if(mobile117)releaseOthers();else slideCleanup122=setTimeout(releaseOthers,1250);
}
let intent121=null,requested121=false,resolve121;const start121=lazy121?new Promise(resolve=>resolve121=resolve):Promise.resolve();
const picker125=createTitlePicker125(q('#startForm'));
function showShell121(){load.hidden=true;releaseTitleImage(cover122);app.hidden=false;q('#start').disabled=false;q('#start').textContent='시작하기';homeView();performance.mark('3nu:title-shell-ready');}
if(lazy121){q('#nickname').style.fontSize='16px';try{const saved=JSON.parse(localStorage.getItem('3nu.player.v1')||'{}');const options=[...root.querySelectorAll('input[name=avatar]')];const selected=options.find(input=>input.value===saved.character);if(selected)selected.checked=true;}catch{}}
q('#startForm').addEventListener('submit',event=>{if(!lazy121||ready)return;event.preventDefault();event.stopImmediatePropagation();if(requested121)return;
 const nickname=window.PlayerState.nickname(q('#nickname').value),error=nickname && window.PlayerState.validate(nickname);q('#nicknameError').textContent=error;q('#nickname').setAttribute('aria-invalid',String(!!error));if(error){q('#nickname').focus();return;}
 window.CampusMusic127?.prepareEntry();
 intent121={nickname,character:root.querySelector('input[name=avatar]:checked')?.value||'rio'};requested121=true;picker125.release();q('#start').disabled=true;pause();attachTitleImage(cover122);app.hidden=true;load.hidden=false;document.activeElement?.blur();
 // Let the title and keyboard settle before allocating the 3D scene.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{releaseSlides122();arm117();resolve121();window.CampusRuntime122?.load().catch(()=>window.Title105?.fail('필요한 파일을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.'));}));
},true);
function checkpoint117(pending,stage){try{sessionStorage.setItem(bootKey117,JSON.stringify({pending,stage,at:Date.now()}))}catch{}}
let stall=null,total=null;function watch(){clearTimeout(stall);if(!document.hidden&&!ready&&!failed&&!waiting117)stall=setTimeout(()=>window.Title105?.fail('파일 준비가 멈췄어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.'),45000)}
const progressText=q('#titleProgress105'),progressBar=q('.bar'),statusText=q('#titleStage105');
const milestones=new Map([['data-ready',14],['world-ready',24],['ground-ready',42],['buildings-ready',66],['facilities-ready',77],['controls-ready',87],['distance-ready',93],['first-frame',96],['scene-ready',98]]);
let caption='캠퍼스 파일을 불러오고 있어요.';
let percent=0,shown=-1,floor=0,elapsed=0,lastTick=0,progressTimer=null;
function paint(value){
 const number=Math.floor(value);
 if(number===shown)return;
 shown=number;progressText.textContent=number+'%';track.setAttribute('aria-valuenow',number);
 progressBar.style.width=number+'%';
}
function pauseProgress(){clearTimeout(progressTimer);progressTimer=null;}
function tickProgress(){
 progressTimer=null;
 if(failed||ready||waiting117||document.hidden||load.hidden)return;
 const now=performance.now(),dt=Math.min(1200,Math.max(0,now-lastTick));lastTick=now;elapsed+=dt;
 const target=Math.min(98,Math.max(floor,99*(1-Math.exp(-elapsed/11500))));
 percent+=Math.min(9,Math.max(0,(target-percent)*(1-Math.exp(-dt/440))));
 paint(percent);
 progressTimer=setTimeout(tickProgress,180);
}
function startProgress(){
 pauseProgress();track.hidden=false;statusText.textContent=caption;
 if(!document.hidden){lastTick=performance.now();percent=Math.max(1,percent);paint(percent);tickProgress();}
}
function stopProgress(){pauseProgress();track.hidden=true;track.removeAttribute('aria-valuenow');progressText.textContent='';}
function arm117(){clearTimeout(total);if(document.hidden)return;startProgress();total=setTimeout(()=>window.Title105?.fail('준비가 오래 걸리고 있어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.'),mobile117?300000:120000);watch()}
if(waiting117){stopProgress();q('#titleLoadLabel105').textContent='준비 중 화면이 다시 열렸어요';const lastStage117={'starting':'파일 준비','data-ready':'이동 경로 준비','world-ready':'지형 준비','ground-ready':'건물 준비','buildings-ready':'시설 준비','facilities-ready':'조작 준비','controls-ready':'표시 범위 준비','distance-ready':'첫 화면 준비','first-frame':'첫 화면 표시','scene-ready':'탐험 시작'}[previous117?.stage];q('#titleStage105').textContent=(lastStage117?lastStage117+' 작업이 중단됐어요. ':'')+'다른 탭과 앱을 닫은 뒤 다시 준비해 주세요. 반복 로딩을 막기 위해 잠시 멈췄어요.';q('#titleProgress105').textContent='';q('#titleRetry105').hidden=false;q('#titleRetry105').textContent='다시 준비하기'}else if(!lazy121)arm117();
function pause(){if(timer!==null)clearTimeout(timer);timer=null;root.classList.add('paused');}
function schedule(){pause();if((!ready&&(!lazy121||requested121))||failed||document.hidden||document.body.classList.contains('playing')||home.hidden)return;root.classList.remove('paused');timer=setTimeout(()=>{showSlide122((index+1)%slides.length);schedule()},10000)}
const menu105=[...root.querySelectorAll('header [data-page]')];
function markMenu105(kind){for(const button of menu105){if(button.dataset.page===kind)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
function homeView(){markMenu105(null);page.hidden=true;home.hidden=false;picker125.show();root.scrollTop=0;if(!slides[index].getAttribute('src'))showSlide122(index);schedule();}
function openPage(kind,button){markMenu105(kind);pause();home.hidden=true;page.hidden=false;root.scrollTop=0;lastPageButton=button;const content=q('#titleContent105');if(kind==='board'){content.innerHTML='<h2>게시판</h2><div class="tabs" role="tablist" aria-label="게시판"><button role="tab" data-tab="notice">공지사항</button><button role="tab" data-tab="help">도움말</button><button role="tab" data-tab="feedback">피드백</button><button role="tab" data-tab="updates">업데이트 내역</button></div><div id="titleBoard105" role="tabpanel"></div>';content.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>board(b.dataset.tab));board('notice')}else content.replaceChildren(q(kind==='guide'?'#titleGuide105':'#titleCredits105').content.cloneNode(true));q('#titleBack105').focus();}
function board(kind){if(kind==='updates'){window.Bulletin112?.unmount?.();q('#titleContent105').querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===kind);b.setAttribute('aria-selected',String(b.dataset.tab===kind))});q('#titleBoard105').replaceChildren(q('#titleUpdates120').content.cloneNode(true));return;}if(kind!=='help'&&window.Bulletin112){q('#titleContent105').querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===kind);b.setAttribute('aria-selected',String(b.dataset.tab===kind))});Bulletin112.mount(kind,q('#titleBoard105'));return;}q('#titleContent105').querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===kind);b.setAttribute('aria-selected',String(b.dataset.tab===kind))});q('#titleBoard105').innerHTML=kind==='notice'?'<div class="entry"><p>등록된 공지사항이 없습니다.</p></div>':kind==='help'?'<details class="entry"><summary>캐릭터는 어디에서 바꾸나요?</summary><p>탐방 메뉴나 설정에서 캐릭터 바꾸기를 열어 자하, 동동, 설기 중 하나를 골라 보세요.</p></details><details class="entry"><summary>화면이 끊겨요.</summary><p>설정에서 표시 거리를 낮추거나 표준 화질을 선택하세요.</p></details><details class="entry"><summary>사진은 어디에 저장되나요?</summary><p>사진 창의 저장 버튼을 누르면 기기의 다운로드 위치에 저장됩니다. 지원되는 환경에서는 기기 공유 기능을 사용할 수 있습니다.</p></details>':'<p class="sub">현재 피드백 전송이 연결되어 있지 않습니다.</p><label for="titleFeedback105">내용</label><textarea id="titleFeedback105" rows="5" placeholder="장소와 발생한 상황을 적어 주세요."></textarea><button class="primary" type="button" disabled>전송 준비 중</button><p class="message">입력한 내용은 전송되거나 저장되지 않습니다.</p>';}
root.addEventListener('click',e=>{const link=e.target.closest('[data-rights-feedback]');if(!link)return;e.preventDefault();openPage('board',root.querySelector('[data-page=credits]'));board('feedback')});
root.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>openPage(b.dataset.page,b));q('#titleBack105').onclick=()=>{homeView();lastPageButton?.focus()};q('#titleRetry105').onclick=()=>{if(!waiting117){checkpoint117(false,'retry');location.reload();return;}waiting117=false;q('#titleRetry105').hidden=true;q('#titleRetry105').textContent='다시 시도';q('#titleLoadLabel105').textContent='캠퍼스 준비 중';statusText.textContent=caption;if(lazy121&&!requested121)showShell121();else arm117();resume117();};document.addEventListener('visibilitychange',()=>{schedule();if(ready||failed||waiting117||lazy121&&!requested121)return;if(document.hidden){clearTimeout(stall);clearTimeout(total);pauseProgress();}else arm117();});
window.Title105={mount(){if(lazy121&&!waiting117&&!requested121)showShell121()},async begin(){if(lazy121&&!waiting117&&!requested121)showShell121();await permission117;await start121;checkpoint117(true,'starting')},get startIntent(){return intent121},get deferredStart(){return lazy121&&!requested121},get waitingState(){return waiting117},get failedState(){return failed},get readyState(){return ready},stage(message){
 if(failed||ready||waiting117)return;
 if(message&&message!==caption){caption=message;statusText.textContent=caption;}
 watch();
},mark(name){
 if(failed||ready||!milestones.has(name))return;
 checkpoint117(true,name);floor=Math.max(floor,milestones.get(name));watch();
},ready(){
 if(failed||ready)return;ready=true;statusText.textContent='탐방을 시작할 준비가 됐어요.';checkpoint117(false,'ready');clearTimeout(stall);clearTimeout(total);
 pauseProgress();performance.mark('3nu:title-ready');
 function enter(){
  if(failed)return;
  load.hidden=true;app.hidden=false;q('#start').disabled=false;q('#start').textContent='시작하기';
  if(lazy121&&intent121)q('#startForm').requestSubmit();else homeView();
 }
 if(document.hidden||load.hidden){paint(100);queueMicrotask(enter);return;}
 const startAt=performance.now(),from=shown,duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:170;
 let delivered=false;
 const finish=()=>{if(delivered||failed)return;delivered=true;clearTimeout(fallback);paint(100);enter();};
 // A short final fill also works when real loading finishes between two UI updates.
 const fallback=setTimeout(finish,duration+100);
 function finishFrame(now){
  if(delivered||failed)return;
  const t=duration?Math.min(1,Math.max(0,(now-startAt)/duration)):1;
  if(t<1){paint(Math.min(99,from+(100-from)*(1-(1-t)*(1-t))));requestAnimationFrame(finishFrame);}
  else{paint(100);requestAnimationFrame(finish);}
 }
 requestAnimationFrame(finishFrame);
},fail(message){if(failed||waiting117)return;if(!mobile117)checkpoint117(false,'failed');failed=true;ready=false;stopProgress();clearTimeout(stall);clearTimeout(total);pause();if(!cover122.hasAttribute('src'))attachTitleImage(cover122);app.hidden=true;load.hidden=false;load.classList.add('failed');q('#titleLoadLabel105').textContent='캠퍼스를 준비하지 못했어요';q('#titleStage105').textContent=String(message||'파일을 불러오지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.');q('#titleProgress105').textContent='';q('#titleRetry105').hidden=false;q('#start').disabled=true;},play(){picker125.release();pause();releaseSlides122();releaseTitleImage(cover122)},home:homeView};
})();

document.addEventListener('DOMContentLoaded',async()=>{
 const el=document.getElementById('visitorCount127');
 try{
  const {r,data}=await Community107.timedJSON('/api/public/visitor-count',{cache:'no-store',credentials:'omit'});
  if(!r.ok||!Number.isSafeInteger(data?.count)||data.count<0)return;
  el.textContent='누적 방문자 수 '+data.count.toLocaleString('ko-KR');el.hidden=false;
 }catch{}
},{once:true});

// On iOS the keyboard can shrink only the visual viewport.
(()=>{
 const viewport=window.visualViewport,input=document.getElementById('nickname'),title=document.getElementById('title105');
 if(!viewport||!matchMedia('(pointer:coarse)').matches)return;
 let fullHeight=0;
 const sync=()=>{
  const editing=document.activeElement===input;
  if(!editing)fullHeight=viewport.height;
  const compact=editing&&Math.max(innerHeight,fullHeight)-viewport.height>80;
  title.classList.toggle('typing127',compact);
  if(compact)title.style.setProperty('--keyboard-space127',Math.floor(viewport.height)+'px');
 };
 sync();input.addEventListener('focus',sync);input.addEventListener('blur',()=>requestAnimationFrame(sync));viewport.addEventListener('resize',sync);
})();
