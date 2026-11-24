/* Title shell and 3D runtime have separate lifetimes. Inert script records are
 * loaded once, in original dependency order, only after mobile Start. */
(()=>{'use strict';
 if(!window.Title105||window.Title105.failedState)return;
 const records=[...document.querySelectorAll('script[data-runtime-src]')],stats={total:records.length,requested:0,loaded:0,batches:0};let task=null;
 function append(record){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.async=false;if(record.dataset.optionalRuntime!==undefined)script.dataset.optionalRuntime='';script.src=record.dataset.runtimeSrc;script.dataset.runtime122='';script.onload=()=>{script.onload=script.onerror=null;stats.loaded++;resolve()};script.onerror=()=>{script.onload=script.onerror=null;if(record.dataset.optionalRuntime!==undefined)resolve();else reject(Error('Runtime script unavailable'))};document.head.append(script);stats.requested++;});}
 function load(){
  if(task)return task;
  task=(async()=>{
   const last=records.length-1;
   for(let at=0;at<last;){
    if(window.Title105?.failedState)throw Error('Startup interrupted');
    window.Title105?.stage('탐방 파일을 불러오고 있어요.');
    // Keep the large engine in its original four-file batch. The remaining
    // scripts are small and ordered, so request eight per network round trip.
    const end=Math.min(last,at+(at===0?4:8));
    stats.batches++;
    await Promise.all(records.slice(at,end).map(append));
    at=end;
   }
   if(window.Title105?.failedState)throw Error('Startup interrupted');
   if(last>=0)await append(records[last]);
   return stats;
  })();
  return task;
 }
 window.CampusRuntime122={load,stats,get started(){return task!==null}};
 window.Title105?.mount();
 if(!window.Title105?.deferredStart)load().catch(()=>window.Title105?.fail('필요한 파일을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.'));
})();
