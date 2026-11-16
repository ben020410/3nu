/* Browser-local drafts: no credentials, origin + confirmed environment + form/post scope. */
(()=>{'use strict';const TTL=24*60*60*1000,prefix='3nu.drafts113.',memory=new Map();let persistent=true,environment='unverified';
try{const h=JSON.parse(localStorage.getItem(prefix+'environment'));if(h&&Date.now()-h.at<TTL)environment=h.value}catch{}
function bucket(){return prefix+environment}
function read(){let rows=memory.get(bucket())||{};try{const raw=persistent?localStorage.getItem(bucket()):null;if(raw)rows=JSON.parse(raw)}catch{persistent=false}
 if(!rows||Array.isArray(rows)||typeof rows!=='object')rows={};const now=Date.now();for(const [slot,d]of Object.entries(rows))if(!d||typeof d.body!=='string'||d.body.length>5000||typeof d.key!=='string'||!Number.isFinite(d.created)||now-d.created>=TTL||d.created>now+60000)delete rows[slot];memory.set(bucket(),rows);return rows}
function save(rows){memory.set(bucket(),rows);try{localStorage.setItem(bucket(),JSON.stringify(rows))}catch{persistent=false}return persistent}
function get(slot){const rows=read();save(rows);return rows[slot]?structuredClone(rows[slot]):null}
function put(slot,value){const rows=read(),record={...value,created:value.created||Date.now()};rows[slot]=record;const keys=Object.keys(rows).sort((a,b)=>rows[a].created-rows[b].created);while(keys.length>24)delete rows[keys.shift()];save(rows);return structuredClone(record)}
function clear(slot,key){const rows=read();if(!key||rows[slot]?.key===key){delete rows[slot];save(rows)}}
function configure(value){if(!['development','test','production'].includes(value))return;environment=value;try{localStorage.setItem(prefix+'environment',JSON.stringify({value,at:Date.now()}))}catch{persistent=false}read()}
window.Drafts113={get,put,clear,configure,get scope(){return environment},get persistent(){return persistent},fresh(body=''){return{body,key:crypto.randomUUID(),created:Date.now(),pending:false}},message(){return persistent?'초안은 이 브라우저에 최대 24시간 보관해요. 저장 완료·초안 삭제 시 지워집니다. 공용 기기에서는 초안을 삭제해 주세요.':'브라우저 저장을 사용할 수 없어 이 화면에서만 초안을 유지해요. 새로고침 전에 내용을 복사해 주세요.'}};
})();
