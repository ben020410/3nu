(()=>{'use strict';const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};let csrf='',next=null,panel='stats';const message=s=>$('adminMessage').textContent=s;
async function api(url,method='GET',body){const r=await fetch(url,{method,cache:'no-store',headers:method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:method==='GET'?undefined:JSON.stringify(body||{})}),data=await r.json();if(!r.ok){if(r.status===401){$('adminContent').hidden=true;$('adminLogin').hidden=false;$('adminLogout').hidden=true}throw Error(data.error+(data.retryAfter?' ('+data.retryAfter+'초 후)':''))}return data}
async function ready(){try{const a=await api('/api/admin/session');csrf=a.csrf;$('adminLogin').hidden=true;$('adminContent').hidden=false;$('adminLogout').hidden=false;message('');await stats()}catch(e){if(csrf)message(e.message)}}
$('adminLogin').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{const a=await api('/api/admin/login','POST',{password:$('adminPassword').value});csrf=a.csrf;$('adminPassword').value='';await ready()}catch(e){message(e.message)}finally{b.disabled=false}};
$('adminLogout').onclick=async()=>{try{await api('/api/admin/logout','POST');csrf='';$('adminContent').hidden=true;$('adminLogin').hidden=false;$('adminLogout').hidden=true;message('로그아웃했습니다.')}catch(e){message(e.message)}};
function duration(ms){return Math.round(ms/1000)+'초'}let statsSerial = 0;
async function stats() {
 const serial = ++statsSerial;
 const period = $('adminDays').value;
 $('adminRange').textContent = '불러오는 중…';
 try {
  const s = await api('/api/admin/stats?days=' + period);
  if (serial !== statsSerial || panel !== 'stats') return;
  $('adminTestNickname124').checked = s.testNicknameExclusion === true;
  const environment = {development:'로컬 개발',test:'검증'}[s.environment] || '별도 환경';
  $('adminEnvironment').textContent = environment + ' 데이터 · KST · ' + new Date(s.asOf).toLocaleTimeString('ko-KR', {timeZone:'Asia/Seoul'});
  const range = s.fromDate === s.toDate ? s.toDate : s.fromDate + ' ~ ' + s.toDate;
  $('adminRange').textContent = s.fromDate ? '조회 기간 · ' + range + ' (KST)' : '집계할 방문이 아직 없습니다.';
  const metrics = [['현재 탐험 중', s.active], ['기간 방문', s.visits], ['기간 고유 브라우저', s.uniqueVisitors],
   ['재방문 브라우저', s.returningVisitors], ['탐험 시작', s.explorations], ['평균 활성 탐험', duration(s.averageActiveMs)], ['누적 방문', s.totalVisits]];
  $('adminMetrics').replaceChildren(...metrics.map(([name, value]) => {
   const card = el('div'); card.className = 'metric107';
   card.append(el('small', name), el('strong', value ?? '—'));
   return card;
  }));
  const rows = document.createDocumentFragment();
  for (const day of s.daily) {
   const row = el('tr');
   for (const value of [day.date, day.visits, day.uniqueVisitors, day.returningVisitors, day.explorations, duration(day.averageActiveMs)])
    row.append(el('td', value ?? '—'));
   rows.append(row);
  }
  $('adminDaily').replaceChildren(rows);
  $('adminDefinitions').replaceChildren(...Object.values(s.definitions).map(t => el('p', t)));
  message('');
 } catch (error) {
  if (serial !== statsSerial || panel !== 'stats') return;
  $('adminRange').textContent = '조회하지 못했습니다. 새로고침해 주세요.';
  $('adminMetrics').replaceChildren(); $('adminDaily').replaceChildren(); $('adminDefinitions').replaceChildren();
  message(error.message);
 }
}
$('adminRefresh').onclick=stats;$('adminDays').onchange=stats;$('adminExport').onclick=async()=>{try{const r=await fetch('/api/admin/export?days='+$('adminDays').value,{cache:'no-store'});if(!r.ok)throw Error('로그인 후 다시 내려받아 주세요.');const url=URL.createObjectURL(await r.blob()),a=el('a');a.href=url;a.download='3nu-visits.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){message(e.message)}};
$('adminExclude').onclick=async()=>{try{await api('/api/admin/exclusion','POST',{exclude:true});message('이 브라우저의 이후 접속을 통계에서 제외합니다. 현재 방문도 다음 heartbeat에 제외됩니다.')}catch(e){message(e.message)}};
async function posts(append=false){try{const r=await api('/api/admin/posts'+(append&&next?'?before='+next:''));if(!append)$('adminPostList').replaceChildren();for(const p of r.posts){const row=el('article');row.className='adminPost';row.append(el('strong',`#${p.id} · ${p.name} · ${p.status==='hidden'?'숨김':'공개'}`),el('p',p.body));for(const report of p.reportDetails){const t=el('p',`${report.reason} · ${report.state==='open'?'확인 전':'처리 완료'} · ${new Date(report.at).toLocaleString('ko-KR')}`);t.className='warning';row.append(t)}for(const [action,label]of[[p.status==='hidden'?'restore':'hide',p.status==='hidden'?'복원':'숨기기'],['resolve','신고 처리 완료'],['delete','삭제']]){const b=el('button',label);b.onclick=async()=>{if(action==='delete'&&!confirm('글 본문을 영구 삭제할까요? 되돌릴 수 없습니다.'))return;b.disabled=true;try{await api('/api/admin/posts/'+p.id,'POST',{action});await posts()}catch(e){message(e.message);b.disabled=false}};row.append(b)}$('adminPostList').append(row)}if(!$('adminPostList').children.length)$('adminPostList').append(el('p','등록된 글이 없습니다.'));next=r.next;$('adminMore').hidden=!next;message('')}catch(e){message(e.message)}}
let visitNext=null,visitSerial=0,visitQuery=new URLSearchParams();
const visitTime=value=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false});
async function visits(append=false){const serial=++visitSerial;$('visitMore123').disabled=true;
 if(!append){visitNext=null;visitQuery=new URLSearchParams({from:$('visitFrom123').value,to:$('visitTo123').value,excluded:$('visitExcluded123').checked?'1':'0'});$('visitRows123').replaceChildren();$('visitMore123').hidden=true;$('visitSummary123').textContent='불러오는 중…';}
 try{const d=await api('/api/admin/visits?'+visitQuery+(append&&visitNext?'&before='+visitNext:''));if(serial!==visitSerial||panel!=='visits')return;
 for(const r of d.items){const row=el('tr');[visitTime(r.start),r.name||'-',visitTime(r.last),duration(r.activeMs),r.explored?'입장':'미입장',r.returningVisit?'재방문':'첫 방문',r.excluded?r.testVisit?'제외 · 테스트':'제외':'포함'].forEach(v=>row.append(el('td',v)));$('visitRows123').append(row)}
 visitNext=d.next;$('visitMore123').hidden=!visitNext;$('visitSummary123').textContent=(!visitQuery.get('from')&&!visitQuery.get('to')?'전체 기간 · ':'')+'총 '+d.total+'건 · '+$('visitRows123').children.length+'건 표시'+(d.oldest!==null?' · 가장 오래된 접속 '+visitTime(d.oldest):'')+' · 조회 '+visitTime(d.asOf);message('');
 }catch(e){if(serial!==visitSerial)return;$('visitSummary123').textContent='조회하지 못했습니다. 조건을 확인하고 다시 조회해 주세요.';message(e.message)}finally{if(serial===visitSerial)$('visitMore123').disabled=false}}
$('visitAllDates').onclick = () => {
 $('visitFrom123').value = '';
 $('visitTo123').value = '';
 visits();
};
$('visitFilters123').onsubmit=e=>{e.preventDefault();visits()};$('visitMore123').onclick=()=>visits(true);
let bulletinNext=null,editId=null,noticeKey=crypto.randomUUID(),loadSerial=0;
function resetNotice(){editId=null;noticeKey=crypto.randomUUID();$('noticeEditor112').reset();$('noticeHeading112').textContent='새 공지'}
$('noticeNew112').onclick=resetNotice;
$('noticeEditor112').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{await api('/api/admin/notices'+(editId?'/'+editId:''),editId?'PUT':'POST',{key:noticeKey,title:$('noticeTitle112').value,body:$('noticeBody112').value,status:$('noticeStatus112').value});resetNotice();await bulletin()}catch(e){message(e.message)}finally{button.disabled=false}};
async function bulletin(append=false){const kind=panel,serial=++loadSerial;if(!append){$('bulletinList112').replaceChildren(el('p','불러오는 중…'));$('bulletinMore112').hidden=true;}$('noticeEditor112').hidden=kind!=='notices';$('bulletinPrivacy112').textContent=kind==='feedback'?'피드백은 관리자에게만 보입니다. 삭제하면 본문을 복구할 수 없습니다.':'공개 상태의 공지만 시작 화면에 표시됩니다.';try{const d=await api('/api/admin/'+kind+(append&&bulletinNext?'?before='+bulletinNext:''));if(serial!==loadSerial||panel!==kind)return;const list=$('bulletinList112');if(!append)list.replaceChildren();for(const item of d.items){const row=el('article');row.className='adminPost bulletin112';row.append(el('strong','#'+item.id+' · '+(item.title||'비공개 피드백')+' · '+({published:'공개',draft:'임시 저장',new:'확인 전',resolved:'처리 완료'}[item.status]||item.status)),el('small',new Date(item.updated).toLocaleString('ko-KR')),el('p',item.body));const actions=kind==='notices'?[['edit','수정'],['delete','삭제']]:[[item.status==='resolved'?'reopen':'resolve',item.status==='resolved'?'다시 열기':'처리 완료'],['delete','삭제']];for(const [action,label]of actions){const b=el('button',label);b.onclick=async()=>{if(action==='edit'){editId=item.id;$('noticeTitle112').value=item.title;$('noticeBody112').value=item.body;$('noticeStatus112').value=item.status;$('noticeHeading112').textContent='공지 #'+item.id+' 수정';$('noticeTitle112').focus();return}if(action==='delete'&&!confirm('본문을 영구 삭제할까요?'))return;b.disabled=true;try{await api('/api/admin/'+kind+'/'+item.id,kind==='notices'?'DELETE':'POST',{action});await bulletin()}catch(e){message(e.message);b.disabled=false}};row.append(b)}list.append(row)}if(!list.children.length)list.append(el('p','등록된 내용이 없습니다.'));bulletinNext=d.next;$('bulletinMore112').hidden=!d.next;message('')}catch(e){message(e.message)}}
$('bulletinMore112').onclick=()=>bulletin(true);
let chatNext=null,chatSerial=0;
async function chats(append=false){const serial=++chatSerial;$('chatMore127').disabled=true;try{const r=await api('/api/admin/chat'+(append&&chatNext?'?before='+chatNext:''));if(serial!==chatSerial||panel!=='chat')return;if(!append)$('chatRows127').replaceChildren();for(const c of r.items){const row=el('article');row.className='adminPost';row.append(el('strong',c.name+' · 채널 '+c.channel),el('small',visitTime(c.at)+' (KST)'),el('p',c.body));$('chatRows127').append(row)}chatNext=r.next;$('chatMore127').hidden=!chatNext;if(!$('chatRows127').children.length)$('chatRows127').append(el('p','보관 중인 채팅이 없습니다.'));message('')}catch(e){message(e.message)}finally{if(serial===chatSerial)$('chatMore127').disabled=false}}
$('chatRefresh127').onclick=()=>chats();$('chatMore127').onclick=()=>chats(true);
$('adminMore').onclick=()=>posts(true);document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{panel=b.dataset.panel;visitSerial++;chatSerial++; document.querySelectorAll('[data-panel]').forEach(n=>n.classList.toggle('selected',n===b));$('adminStats').hidden=panel!=='stats';$('adminVisits').hidden=panel!=='visits';$('adminPosts').hidden=panel!=='posts';$('adminChat127').hidden=panel!=='chat';$('adminBulletin').hidden=!['notices','feedback'].includes(panel);panel==='stats'?stats():panel==='visits'?visits():panel==='posts'?posts():panel==='chat'?chats():bulletin()});ready();

$('adminTestNickname124').onchange=async()=>{const e=$('adminTestNickname124');e.disabled=true;try{const r=await api('/api/admin/test-nickname-exclusion','POST',{enabled:e.checked});e.checked=r.enabled;message('이후 입장부터 적용합니다. 이미 제외한 방문은 유지됩니다.')}catch(err){e.checked=!e.checked;message(err.message)}finally{e.disabled=false}};

})();
