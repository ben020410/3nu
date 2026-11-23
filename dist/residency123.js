/* Mobile rendering residency. Navigation/state remain independent and fully loaded.
 * Whole static files own their CPU/GPU geometry. No geometry simplification. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Residency123=api;})(globalThis,()=>{
 const ranges=[60,110,180,450,6000];
 function create({disposeMeshes,onChange=()=>{},onError=()=>{},nearFirst=false}){
  const units=new Map(),listeners=new Set();let focus=[],level=3,closed=false,running=false,last=-Infinity,lastPoint=null,revision=0,started=false,prepared=true;
  const stats={loads:0,unloads:0,failures:0,peakResidentBytes:0};
  const distance=(u,points=focus)=>Math.min(...points.map(p=>Math.hypot(Math.max(u.bounds[0]-p.x,0,p.x-u.bounds[2]),Math.max(u.bounds[1]-p.z,0,p.z-u.bounds[3]))));
  const range=u=>u.kind==='ground'?Math.max(160,ranges[level-1]):ranges[level-1];
  let paused=false, streamOuter=!nearFirst;
  const required=u=>nearFirst?distance(u)<=(u.kind==='ground'?75:42):wanted(u,26);
  const wanted=(u,pad)=>level===5||distance(u)<=range(u)+pad;
  function notify(){prepared=!closed&&[...units.values()].every(u=>!required(u)||u.state==='ready');revision++;onChange();for(const f of [...listeners])f();}
  function release(u){if(u.state==='loading'){u.controller?.abort();return;}if(u.state!=='ready')return;disposeMeshes(u.meshes);u.meshes=[];u.state='absent';stats.unloads++;}
  async function pump(){if(running||closed||paused||!focus.length)return;running=true;
   try{while(!closed&&!paused){const next=[...units.values()].filter(u=>u.state==='absent'&&(required(u)||(streamOuter&&wanted(u,122)))).sort((a,b)=>(required(a)?0:1)-(required(b)?0:1)||distance(a)-distance(b))[0];if(!next)break;
    next.state='loading';next.controller=new AbortController();notify();
    try{const meshes=await next.load(next.controller.signal);if(closed||next.controller.signal.aborted||!wanted(next,202)){disposeMeshes(meshes);next.state='absent';}else{next.meshes=meshes;next.state='ready';stats.loads++;stats.peakResidentBytes=Math.max(stats.peakResidentBytes,audit().residentBytes);}}
    catch(error){if(closed||next.controller.signal.aborted){next.state='absent';}else{next.state='failed';next.error=error;stats.failures++;onError(error,next);}}
    finally{next.controller=null;notify();}
    await new Promise(resolve=>setTimeout(resolve,0));
   }}finally{running=false;notify();}
  }
  function refresh(){for(const u of units.values())if(!wanted(u,202)){release(u);if(u.state==='failed')u.state='absent';}notify();pump();}
  function setFocus(points,nextLevel=level,now=performance.now(),force=false){if(closed)return;nextLevel=Math.max(1,Math.min(5,Math.round(nextLevel)||3));const p=points[0];if(!p)return;
   if(!force&&nextLevel===level&&now-last<200)return;
   if(!force&&nextLevel===level&&lastPoint&&Math.hypot(p.x-lastPoint.x,p.z-lastPoint.z)<4&&focus[1]&&points[1]&&Math.hypot(points[1].x-focus[1].x,points[1].z-focus[1].z)<4)return;
   const dt=Math.max(.2,(now-last)/1000),dx=lastPoint?p.x-lastPoint.x:0,dz=lastPoint?p.z-lastPoint.z:0,len=Math.hypot(dx,dz);focus=points.map(v=>({x:v.x,z:v.z}));if(len>0&&len<100){const ahead=Math.min(120,len/dt*2);focus.push({x:p.x+dx/len*ahead,z:p.z+dz/len*ahead});}last=now;lastPoint={x:p.x,z:p.z};level=nextLevel;refresh();
  }
  function register(id,bounds,kind,bytes,load){if(units.has(id))throw Error('Duplicate residency unit '+id);if(!bounds?.every(Number.isFinite))throw Error('Invalid residency bounds '+id);units.set(id,{id,bounds,kind,bytes,load,state:'absent',meshes:[]});if(started&&(!nearFirst||streamOuter))refresh();}
  function ready(){return prepared;}
  function failure(){return[...units.values()].find(u=>required(u)&&u.state==='failed');}
  async function warm(){started=true;notify();pump();while(!ready()){if(closed)throw Error('Residency disposed');const failed=failure();if(failed)throw failed.error;await new Promise(resolve=>listeners.add(function changed(){listeners.delete(changed);resolve();}));}}
  function retry(){for(const u of units.values())if(u.state==='failed'){u.state='absent';u.error=null;}refresh();}
  function audit(){const all=[...units.values()],resident=all.filter(u=>u.state==='ready');return{...stats,revision,level,paused,streamOuter,units:all.length,residentUnits:resident.length,residentBytes:resident.reduce((n,u)=>n+u.bytes,0),residentMeshes:resident.reduce((n,u)=>n+u.meshes.length,0),requiredPending:all.filter(u=>required(u)&&u.state!=='ready').map(u=>u.id),loading:all.filter(u=>u.state==='loading').map(u=>u.id),failed:all.filter(u=>u.state==='failed').map(u=>u.id),focus:focus.map(p=>({...p})),closed};}
  function dispose(){if(closed)return;closed=true;for(const u of units.values()){u.controller?.abort();release(u);}units.clear();notify();listeners.clear();}
  function startStreaming(){if(!streamOuter){streamOuter=true;refresh();}}
  function pause(value){if(paused===!!value)return;paused=!!value;if(paused){for(const u of units.values())u.controller?.abort();}else pump();}
  return{register,setFocus,warm,ready,retry,failure,audit,dispose,startStreaming,pause};
 }
 async function attach(scene,nav){if(scene.metadata?.residency123)return scene.metadata.residency123;const bounds=await jsonStatic119('data/residency123.json?v=123'),ui=document.createElement('div');ui.id='residency123';ui.hidden=true;ui.setAttribute('role','status');ui.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:95;max-width:90vw;padding:12px 16px;border-radius:12px;background:#fbfaf6;color:#173e42;box-shadow:0 4px 20px #0002;font:14px system-ui;text-align:center';const text=document.createElement('span'),button=document.createElement('button');button.type='button';button.textContent='다시 시도';button.style.cssText='margin-left:10px;padding:8px;border:1px solid #c7d5d9;border-radius:8px;background:white;color:#173e42';ui.append(text,button);document.body.append(ui);
  const api=create({nearFirst:!!scene.metadata?.entry126,onChange:()=>{if(!window.Title105?.readyState)window.Title105?.stage('주변 공간 준비 중…');},disposeMeshes:meshes=>{for(const m of meshes)if(!m.isDisposed())m.dispose(false,false);}});api.bounds=bounds;button.onclick=()=>api.retry();let shown='';api.showStatus=active=>{const error=active&&!api.ready()?api.failure():null,state=active&&!api.ready()?(error?'error':'loading'):'';if(state===shown)return;shown=state;ui.hidden=!state;text.textContent=error?'주변 공간을 불러오지 못했어요.':'주변 캠퍼스를 불러오는 중…';button.hidden=!error;};
  const bootVisibility=()=>{if(!window.Title105?.readyState)api.pause(document.hidden);};
  document.addEventListener('visibilitychange',bootVisibility);bootVisibility();
  const spawn=nav.points[nav.spawn],gate=nav.gate.center;const entry=scene.metadata?.entry126;api.setFocus(entry?[entry]:[{x:spawn[0],z:spawn[1]},{x:gate[0]+1,z:gate[1]+150}],NUSettings.read('distance'),performance.now(),true);scene.metadata={...scene.metadata,residency123:api};scene.onDisposeObservable.addOnce(()=>{document.removeEventListener('visibilitychange',bootVisibility);api.dispose();ui.remove();});return api;
 }
 return{create,attach};
});
