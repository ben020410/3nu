#!/usr/bin/env python3
"""Create file:// QA pages from exact runtime files. No server/network required.

Only the generated QA HTML receives in-memory fetch, asset inlining and review
camera injection. Production source, immutable BUILD35 and geometry stay intact.
"""
from pathlib import Path
import base64
import hashlib
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT.parent / "work/build36"
CONFIG = json.loads((ROOT / "reports/build36/cameras.json").read_text())


def js(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def data_url(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode()


CONTROLS = r'''
(() => {
  'use strict';
  const config=window.__qa36Config, stage=window.__offline36Stage, records=[];
  const width=config.capture.width,height=config.capture.height;
  const panel=document.createElement('aside'); panel.id='offline36-panel';
  panel.style.cssText='position:fixed;bottom:22px;left:12px;z-index:99999;width:330px;padding:12px;border-radius:12px;background:#fffef7f2;color:#15342c;font:12px/1.45 system-ui;box-shadow:0 2px 15px #0004;max-height:46vh;overflow:auto';
  panel.innerHTML=`<strong>${stage==='before'?'BUILD35 기준':'BUILD36 현재'} · 오프라인 검증</strong><div>동일 소스·데이터 인라인 · 네트워크 요청 없음</div><label>검증 시점 <select id="offline36-view" aria-label="오프라인 검증 카메라"></select></label><div style="display:flex;gap:5px;flex-wrap:wrap;margin:6px 0"><button id="offline36-shot">현재 PNG 생성</button><button id="offline36-batch">전체 카메라 촬영</button><button id="offline36-movement">왕복 검사 화면</button><button id="offline36-result">보행 결과 생성</button><button id="offline36-bundle">결과 묶음 JSON 생성</button><button id="offline36-zip">모든 결과 ZIP 생성</button></div><div id="offline36-status" role="status">장면 준비 중…</div><div id="offline36-downloads"></div><details><summary>임시 버스 검증 상자</summary><label><input type="checkbox" id="offline36-bus"> 버스 상자 표시</label><select id="offline36-lane" aria-label="차량 검증 차로"></select><div id="offline36-bus-info"></div></details>`;
  document.body.appendChild(panel);
  const $=id=>document.getElementById(id),status=$('offline36-status'),select=$('offline36-view'),links=$('offline36-downloads');
  for(const[key,v]of Object.entries(config.views))select.add(new Option(v.label,key));
  const wait=ms=>new Promise(r=>setTimeout(r,ms)); let busy=false,busBox=null;
  function report(s){status.textContent=s;}
  function lock(){const c=window.__campus;if(!c)return;const canvas=c.engine.getRenderingCanvas(),ratio=width/height,w=Math.min(innerWidth,innerHeight*ratio),h=w/ratio;canvas.style.cssText+=`;position:fixed!important;left:${(innerWidth-w)/2}px!important;top:${(innerHeight-h)/2}px!important;width:${w}px!important;height:${h}px!important;right:auto!important;bottom:auto!important`;c.engine.setHardwareScalingLevel(1);c.engine.setSize(width,height);}
  async function ready(){const t=performance.now();while(!window.__campus?.scene?.isReady()){if(performance.now()-t>10000){const c=window.__campus,scene=c?.scene,unready=(scene?.textures||[]).filter(q=>typeof q.isReady==='function'&&!q.isReady()).map(q=>({name:q.name,url:q.url||null,ready:q.isReady()}));report('장면 준비 진단 '+JSON.stringify({campus:!!c,sceneReady:scene?.isReady(),waiting:scene?.getWaitingItemsCount?.(),unreadyTextures:unready.slice(0,12)}));}const e=$('error');if(e&&!e.hidden&&e.textContent.trim())throw Error(e.textContent);if(performance.now()-t>300000)throw Error('장면 준비 시간 초과');await wait(250);}const q=$('quality');if(q&&q.value!==config.capture.quality){q.value=config.capture.quality;q.dispatchEvent(new Event('change',{bubbles:true}));}lock();}
  function frames(n=30){return new Promise((resolve,reject)=>{const s=window.__campus.scene;let k=0;const timeout=setTimeout(()=>{s.onAfterRenderObservable.remove(observer);reject(Error('렌더 프레임 대기 시간 초과'));},120000);const observer=s.onAfterRenderObservable.add(()=>{if(++k>=n){clearTimeout(timeout);s.onAfterRenderObservable.remove(observer);resolve();}});});}
  function link(name,blob){const old=records.findIndex(r=>r.name===name);if(old>=0){URL.revokeObjectURL(records[old].url);records.splice(old,1);}const url=URL.createObjectURL(blob);records.push({name,blob,url});renderLinks();return{name,blob,url};}
  function renderLinks(){links.replaceChildren();for(const r of records){const a=document.createElement('a');a.href=r.url;a.download=r.name;a.textContent='다운로드: '+r.name;a.style.cssText='display:block;color:#166a5d;padding:2px 0';links.appendChild(a);}}
  function jsonLink(name,value){return link(name,new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));}
  function view(key){const p=$('reviewSelect');if(!p)throw Error('비교 카메라 컨트롤이 없습니다.');p.value=key;p.dispatchEvent(new Event('change',{bubbles:true}));select.value=key;}
  async function capture(key){await ready();view(key);await frames(config.capture.settleRenderedFrames);const {scene,engine,nav}=window.__campus,camera=scene.activeCamera,canvas=engine.getRenderingCanvas(),expected=config.views[key],eye=camera.position.asArray(),look=camera.getTarget().asArray(),delta=look.map((v,i)=>v-eye[i]),length=Math.hypot(...delta),direction=delta.map(v=>v/length),ed=expected.at.map((v,i)=>v-expected.eye[i]),el=Math.hypot(...ed),error=Math.max(...eye.map((v,i)=>Math.abs(v-expected.eye[i])),...direction.map((v,i)=>Math.abs(v-ed[i]/el)));
    if(error>.001||Math.abs(camera.fov-config.capture.fovRadians)>.0001)throw Error('동일 카메라 검증 실패: '+error);
    if(canvas.width!==width||canvas.height!==height)throw Error('캔버스 해상도 불일치');
    const name=stage+'-'+key;const metadata={stage,view:key,filename:name+'.png',source:'Self-contained offline QA from exact project runtime; only loader and controls added',sourceManifest:window.__offline36Manifest,capturedAt:new Date().toISOString(),width,height,eye,actualLookTarget:look,lookDirection:direction,referenceTarget:expected.at,expectedCamera:expected,expectedCameraMaxDifference:error,quality:$('quality')?.value,fovRadians:camera.fov,browserViewport:[innerWidth,innerHeight],renderWidth:engine.getRenderWidth(),renderHeight:engine.getRenderHeight(),settledRenderedFrames:config.capture.settleRenderedFrames,engineering35RenderStats:nav.engineering35?.renderStats||null,engineering36RenderStats:nav.engineering36?.renderStats||null,vehicleEnvelopeVisible:!!busBox,observedPerformance:{engineFps:engine.getFps(),note:'Single capture observation, not a controlled benchmark.'}};
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG 생성 실패')),'image/png'));link(name+'.png',blob);jsonLink(name+'.json',metadata);return metadata;
  }
  async function task(action){if(busy)return;busy=true;try{await action();}catch(e){report(e.message);}finally{busy=false;}}
  select.onchange=()=>task(async()=>{await ready();view(select.value);report(config.views[select.value].label);});
  $('offline36-shot').onclick=()=>task(async()=>{await capture(select.value);report('PNG·카메라 기록 생성 완료. 아래 링크로 다운로드하세요.');});
  $('offline36-batch').onclick=()=>task(async()=>{const keys=Object.keys(config.views);for(let i=0;i<keys.length;i++){report(`동일 카메라 촬영 ${i+1}/${keys.length} · ${config.views[keys[i]].label}`);await capture(keys[i]);}await bundle();report(`${keys.length}장 생성 완료. 결과 묶음 JSON 다운로드 링크를 눌러 저장하세요.`);});
  $('offline36-movement').onclick=()=>{const u=new URL(location.href);u.search='?'+(stage==='after'?'qa36':'qa35');location.href=u.href;};
  async function movement(){await ready();const text=$('qa25status')?.textContent;if(!text)throw Error('왕복 검사 화면에서 실제 검사를 실행해 주세요.');const snapshot=JSON.parse(text),routes=window.__offline36Routes,key=r=>JSON.stringify([r.zone,r.road,!!r.reverse]),expected=routes.flatMap(r=>[false,true].map(reverse=>({...r,reverse}))),keys=new Set(snapshot.results.map(key)),complete=!snapshot.running&&snapshot.remaining===0&&snapshot.results.length===expected.length&&keys.size===expected.length&&expected.every(r=>keys.has(key(r)));await frames(1);const{scene,engine,nav}=window.__campus,canvas=engine.getRenderingCanvas(),camera=scene.activeCamera;const summary={expectedRoutes:routes.length,expectedDirections:expected.length,recordedDirections:snapshot.results.length,completed:complete,passed:complete&&snapshot.results.every(r=>r.passed===true),failedDirections:snapshot.results.filter(r=>r.passed!==true).length};
    jsonLink('browser-movement.json',{schema:'3NU-BUILD36-browser-movement/1',source:'Actual browser app #qa25status JSON; offline exact-source loader; no synthetic execution',savedAt:new Date().toISOString(),sourceManifest:window.__offline36Manifest,summary,expectedRoutes:routes,runtimeSnapshot:snapshot,engineering35RenderStats:nav.engineering35?.renderStats||null,engineering36RenderStats:nav.engineering36?.renderStats||null,capture:{file:'browser-movement.png',width:canvas.width,height:canvas.height,eye:camera.position.asArray(),lookTarget:camera.getTarget().asArray(),fovRadians:camera.fov}});const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));link('browser-movement.png',blob);report(`실제 보행 ${summary.recordedDirections}/${summary.expectedDirections}방향 · ${summary.completed?(summary.passed?'모두 통과':'실패 포함'):'부분 기록'}`);
  }
  $('offline36-result').onclick=()=>task(async()=>{await movement();await bundle();});
  async function bundle(){const entries=records.filter(r=>!r.name.endsWith('.zip')&&!r.name.endsWith('-bundle.json')),files=[];for(const r of entries){const bytes=new Uint8Array(await r.blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));files.push({name:r.name,mime:r.blob.type,bytes:bytes.length,base64:btoa(binary)});}jsonLink('build36-'+stage+'-bundle.json',{schema:'3NU-BUILD36-offline-evidence-bundle/1',stage,sourceManifest:window.__offline36Manifest,createdAt:new Date().toISOString(),files});}
  $('offline36-bundle').onclick=()=>task(async()=>{await bundle();report('결과 묶음 JSON 생성 완료. 다운로드 링크를 눌러 저장하세요.');});
  // A small stored ZIP encoder keeps downloads local and needs no library fetch.
  const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  const crc32=a=>{let c=0xffffffff;for(const b of a)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
  function header(n,fields){const a=new Uint8Array(n),v=new DataView(a.buffer);for(const[offset,size,value]of fields)size===2?v.setUint16(offset,value,true):v.setUint32(offset,value,true);return a;}
  async function zip(){const entries=records.filter(r=>!r.name.endsWith('.zip')),local=[],central=[];let offset=0,centralSize=0;for(const e of entries){const bytes=new Uint8Array(await e.blob.arrayBuffer()),name=new TextEncoder().encode(e.name),crc=crc32(bytes),h=header(30,[[0,4,0x04034b50],[4,2,20],[6,2,0x800],[14,4,crc],[18,4,bytes.length],[22,4,bytes.length],[26,2,name.length]]),c=header(46,[[0,4,0x02014b50],[4,2,20],[6,2,20],[8,2,0x800],[16,4,crc],[20,4,bytes.length],[24,4,bytes.length],[28,2,name.length],[42,4,offset]]);local.push(h,name,bytes);central.push(c,name);offset+=h.length+name.length+bytes.length;centralSize+=c.length+name.length;}const end=header(22,[[0,4,0x06054b50],[8,2,entries.length],[10,2,entries.length],[12,4,centralSize],[16,4,offset]]);link('build36-'+stage+'-browser-evidence.zip',new Blob([...local,...central,end],{type:'application/zip'}));}
  $('offline36-zip').onclick=()=>task(async()=>{await zip();report('모든 현재 결과를 ZIP으로 묶었습니다. 다운로드 링크를 눌러 저장하세요.');});
  const busToggle=$('offline36-bus'),lane=$('offline36-lane'),info=$('offline36-bus-info');
  async function bus(){if(busBox){busBox.dispose();busBox=null;}if(!busToggle.checked)return;try{await ready();const report=window.__offline36Vehicle,measured=stage==='before'?report?.before:report?.current;if(!measured)throw Error('이 HTML 생성 시점에는 차량 검사 결과가 없습니다.');if(!lane.options.length)measured.lanes.forEach((q,i)=>lane.add(new Option('차로 '+(i+1)+' · '+q.laneOffset+'m',i)));const q=measured.lanes[+lane.value||0],at=q.minimumClearHeightAt,d=report.vehicle,{scene,nav}=window.__campus,B=BABYLON;let heading=at.heading;if(!heading){let best=Infinity;for(let i=1;i<nav.ring33.route.length;i++){const a=nav.ring33.route[i-1],b=nav.ring33.route[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(!l)continue;const t=Math.max(0,Math.min(1,((at.center[0]-a[0])*dx+(at.center[1]-a[1])*dz)/(l*l))),dist=Math.hypot(at.center[0]-a[0]-t*dx,at.center[1]-a[1]-t*dz);if(dist<best){best=dist;heading=[dx/l,dz/l];}}}busBox=B.MeshBuilder.CreateBox('offline36-bus-envelope',{width:d.width,height:d.height,depth:d.length},scene);busBox.position.set(at.center[0],at.roadY+d.height/2,at.center[1]);busBox.rotation.y=Math.atan2(heading[0],heading[1]);const m=new B.StandardMaterial('offline36-bus-material',scene);m.diffuseColor=B.Color3.FromHexString('#20a8b8');m.alpha=.25;m.backFaceCulling=false;busBox.material=m;busBox.isPickable=false;busBox.enableEdgesRendering();busBox.edgesColor=new B.Color4(.05,.4,.45,1);busBox.onDisposeObservable.add(()=>m.dispose());info.textContent=`${d.length}×${d.width}×${d.height}m · 확보 높이 ${q.minimumClearHeight.toFixed(2)}m · 버스 상부 ${q.minimumBusRoofMargin.toFixed(2)}m. 게임 구현값.`;}catch(e){info.textContent=e.message;}}
  busToggle.onchange=bus;lane.onchange=bus;
  addEventListener('resize',()=>requestAnimationFrame(lock));
  ready().then(()=>{const p=$('reviewSelect');if(p){for(const o of [...p.options])if(!config.views[o.value])o.remove();p.style.display='none';select.value=p.value||'36-deck-overview';}report('준비 완료 · PNG에는 캔버스만 저장됩니다.');}).catch(e=>report(e.message));
})();
'''


def build(stage, directory):
    raw = (directory / "index.html").read_text()
    manifest = {"index.html": hashlib.sha256((directory / "index.html").read_bytes()).hexdigest()}
    def read(path):
        payload = path.read_bytes()
        manifest[str(path.relative_to(directory))] = hashlib.sha256(payload).hexdigest()
        return payload
    # Include only actual runtime data; raw OSM and previous report images are not runtime inputs.
    data = {}
    for path in sorted((directory / "data").glob("*")):
        if path.suffix not in (".json", ".bin"):
            continue
        data["data/"+path.name] = base64.b64encode(read(path)).decode()
    routes_path = directory / ("data/qa36-routes.json" if stage == "after" else "data/qa35-routes.json")
    routes = json.loads(routes_path.read_text()) if routes_path.exists() else []
    vehicle_path = ROOT / "reports/build36/vehicle.json"
    vehicle = json.loads(vehicle_path.read_text()) if vehicle_path.exists() else None
    def asset(value):
        local = value.split("?")[0]
        path = directory / local
        if path.is_file():
            read(path)
            return data_url(path)
        return value
    def css(match):
        path = directory / match.group(1).split("?")[0]
        content = read(path).decode()
        content = re.sub(r'url\([\'\"]?([^\)\'\"]+)[\'\"]?\)', lambda m:'url("'+asset(m.group(1))+'")', content)
        return "<style>" + content.replace("</style", "<\\/style") + "</style>"
    raw = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, raw)
    raw = re.sub(r'((?:src|href)=")((?:assets/|favicon)[^"]+)(")', lambda m:m.group(1)+asset(m.group(2))+m.group(3), raw)
    def script(match):
        relative = match.group(1).split("?")[0]
        source = read(directory / relative).decode()
        if relative == "app.js":
            marker = "let reviewView=reviewViews"
            if marker not in source:
                raise RuntimeError("Review injection marker missing")
            source = source.replace(marker, "Object.assign(reviewViews,window.__qa36Config.views);"+marker, 1)
            source = source.replace("reviewViews[new URLSearchParams(location.search).get('review')]", "reviewViews[new URLSearchParams(location.search).get('review')||'36-deck-overview']", 1)
            source = source.replace("picker.value=new URLSearchParams(location.search).get('review');", "picker.value=new URLSearchParams(location.search).get('review')||'36-deck-overview';", 1)
        # Literal asset URLs are embedded for Image/Texture loaders as well as DOM images.
        source = re.sub(r'([\'\"])([^\'\"\n]+\.(?:png|jpe?g|webp|svg|woff2?|ttf)(?:\?[^\'\"\n]*)?)\1', lambda m:m.group(1)+asset(m.group(2))+m.group(1), source)
        return '<script data-offline-source="'+relative+'">'+source.replace('</script', '<\\/script')+'</script>'
    raw = re.sub(r'<script src="([^"]+)"></script>', script, raw)
    boot = r'''window.__qa36Config=CONFIG;window.__offline36Stage=STAGE;window.__offline36Manifest=MANIFEST;window.__offline36Routes=ROUTES;window.__offline36Vehicle=VEHICLE;
try{localStorage.setItem('gwanak.quality',window.__qa36Config.capture.quality)}catch{}
(() => {const data=DATA;window.fetch=async(input)=>{const text=typeof input==='string'?input:input.url;const url=new URL(text,location.href);const key='data/'+url.pathname.split('/').at(-1);if(!(key in data))throw Error('Offline QA has no embedded response: '+text);const raw=atob(data[key]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Response(bytes,{status:200,headers:{'Content-Type':key.endsWith('.json')?'application/json':'application/octet-stream'}});};})();'''
    boot = boot.replace('CONFIG',js(CONFIG)).replace('STAGE',js(stage)).replace('MANIFEST',js(manifest)).replace('ROUTES',js(routes)).replace('VEHICLE',js(vehicle)).replace('DATA',js(data))
    raw = raw.replace('</head>', '<script>'+boot+'</script></head>', 1)
    raw = raw.replace('</body>', '<script>'+CONTROLS+'</script></body>', 1)
    # No external resource requests are permitted by this offline QA wrapper.
    csp = '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39; &#39;unsafe-eval&#39; data: blob:; style-src &#39;unsafe-inline&#39; data:; img-src data: blob:; font-src data:; connect-src &#39;none&#39;; worker-src blob:;">'
    raw = raw.replace('<head>', '<head>'+csp, 1)
    out = WORK / ('offline-'+stage+'.html')
    out.write_text(raw)
    (WORK / ('offline-'+stage+'-manifest.json')).write_text(json.dumps({'stage':stage,'sourceDirectory':str(directory),'sha256':manifest,'generatedHtmlSha256':hashlib.sha256(raw.encode()).hexdigest(),'offlineChanges':['Inline original scripts/styles/assets','In-memory Response for exact data bytes','Inject BUILD36 camera registry and default review camera','Visible PNG/ZIP/movement export controls'],'runtimeGeometryChanged':False},indent=2)+'\n')
    return {'stage':stage,'path':str(out),'bytes':out.stat().st_size,'sourceFiles':len(manifest)}


if __name__ == '__main__':
    WORK.mkdir(parents=True,exist_ok=True)
    print(json.dumps([build('before',WORK/'baseline35/dist'),build('after',ROOT/'dist')],indent=2))
