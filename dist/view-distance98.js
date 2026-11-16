/* Render residency only. Physics, ray collision, navigation and model identity never depend on this list.
   Static groups are indexed once; dynamic actors remain resident unless explicitly registered later. */
function createViewDistance98(B,scene,player,data){
 const cellSize=128,ranges=[180,320,550,900,6000],groups=new Map(),grid=new Map(),always=new Set(),active=new Set(),meshGroup=new Map(),shadowLists=new WeakMap();let level=2,last=-Infinity,lastX=Infinity,lastZ=Infinity,lastCount=scene.meshes.length,dirty=true,candidates={data:[],length:0},enabled=true,revision=0;
 const original=scene.getActiveMeshCandidates.bind(scene),buildings=data.renderBuildings.map(b=>({id:String(b.id),x0:Math.min(...b.p.map(p=>p[0]))-3,x1:Math.max(...b.p.map(p=>p[0]))+3,z0:Math.min(...b.p.map(p=>p[1]))-3,z1:Math.max(...b.p.map(p=>p[1]))+3}));
 const dynamic=m=>/^(walker|route|guidance52|sky-|cloud97|beanbag97)/.test(m.name)||m.skeleton||m.morphTargetManager;
 function bounds(m){m.computeWorldMatrix(true);const b=m.getBoundingInfo().boundingBox;return{x0:b.minimumWorld.x,x1:b.maximumWorld.x,z0:b.minimumWorld.z,z1:b.maximumWorld.z};}
 // Whole merged meshes are indivisible. A group crossing several buildings joins those buildings.
 const parent=new Map();function find(k){if(!parent.has(k))parent.set(k,k);if(parent.get(k)!==k)parent.set(k,find(parent.get(k)));return parent.get(k);}function union(a,b){parent.set(find(b),find(a));}
 const records=[];
 for(const m of scene.meshes){if(dynamic(m)||m.name==='tree-crown'||m.name==='tree-trunk'||!m.getTotalVertices()){always.add(m);continue;}const b=bounds(m);if(!Number.isFinite(b.x0)||/terrain|ground|road|surface|paving|plaza|lawn|water|track|path/i.test(m.name)){always.add(m);continue;}
  const matches=buildings.filter(q=>b.x0<=q.x1&&b.x1>=q.x0&&b.z0<=q.z1&&b.z1>=q.z0);let k=matches.length?'building:'+matches[0].id:'mesh:'+m.uniqueId;
  if(m.metadata?.facilityId)k='facility:'+m.metadata.facilityId;else if(m.parent){let p=m.parent;while(p.parent)p=p.parent;k='parent:'+p.uniqueId;}
  find(k);for(const q of matches)union(k,'building:'+q.id);records.push({m,b,k});
 }
 for(const {m,b,k}of records){const id=find(k);let g=groups.get(id);if(!g){g={id,meshes:[],x0:Infinity,x1:-Infinity,z0:Infinity,z1:-Infinity};groups.set(id,g);}g.meshes.push(m);meshGroup.set(m,g);g.x0=Math.min(g.x0,b.x0);g.x1=Math.max(g.x1,b.x1);g.z0=Math.min(g.z0,b.z0);g.z1=Math.max(g.z1,b.z1);}
 for(const g of groups.values())for(let x=Math.floor(g.x0/cellSize);x<=Math.floor(g.x1/cellSize);x++)for(let z=Math.floor(g.z0/cellSize);z<=Math.floor(g.z1/cellSize);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,new Set());grid.get(k).add(g);}
 const leaf=scene.getMeshByName('tree-crown'),trunk=scene.getMeshByName('tree-trunk'),forest=new Map();let forestSignature='';const forestActive=new Set();
 let forestData=null;
 if(leaf?.thinInstanceCount===trunk?.thinInstanceCount*2&&trunk?.thinInstanceCount){
  const lm=Float32Array.from(leaf.thinInstanceGetWorldMatrices().flatMap(m=>Array.from(m.asArray()))),tm=Float32Array.from(trunk.thinInstanceGetWorldMatrices().flatMap(m=>Array.from(m.asArray()))),colors=leaf._userThinInstanceBuffersStorage?.data?.color;
  forestData={lm,tm,colors:colors?Float32Array.from(colors):null,lo:new Float32Array(lm.length),to:new Float32Array(tm.length),co:colors?new Float32Array(colors.length):null};
  for(let i=0;i<tm.length/16;i++){const x=Math.floor(tm[i*16+12]/cellSize),z=Math.floor(tm[i*16+14]/cellSize),k=x+','+z;if(!forest.has(k))forest.set(k,{x,z,ids:[]});forest.get(k).ids.push(i);}
 }
 function updateForest(x,z,r){if(!forestData)return;const dist=c=>Math.hypot(Math.max(c.x*cellSize-x,0,x-(c.x+1)*cellSize),Math.max(c.z*cellSize-z,0,z-(c.z+1)*cellSize));for(const c of forestActive)if(level!==5&&dist(c)>r+180)forestActive.delete(c);for(const c of forest.values())if(level===5||dist(c)<=r+100)forestActive.add(c);const selected=[...forestActive];
  const sig=selected.map(c=>c.x+','+c.z).join(';');if(sig===forestSignature)return;forestSignature=sig;const d=forestData;let n=0;for(const c of selected)for(const i of c.ids){d.to.set(d.tm.subarray(i*16,i*16+16),n*16);d.lo.set(d.lm.subarray(i*32,i*32+32),n*32);if(d.co)d.co.set(d.colors.subarray(i*8,i*8+8),n*8);n++;}
  leaf.thinInstanceSetBuffer('matrix',d.lo,16,false);trunk.thinInstanceSetBuffer('matrix',d.to,16,false);if(d.co)leaf.thinInstanceSetBuffer('color',d.co,4,false);leaf.thinInstanceCount=n*2;trunk.thinInstanceCount=n;
 }
 const ui=document.createElement('section');ui.id='viewDistance98';ui.innerHTML='<label for="distance98">표시 거리 <output id="distanceValue98"></output></label><input id="distance98" type="range" min="1" max="5" step="1"><div class="rangeEnds"><span>가까이</span><span>멀리</span></div><p>가까이 설정하면 먼 풍경을 덜 표시해 성능을 높여요.</p>';document.getElementById('returnTitle').before(ui);const slider=ui.querySelector('input'),output=ui.querySelector('output');
 try{const v=Number(localStorage.getItem('3nu.viewDistance'));if(v>=1&&v<=5)level=Math.round(v);}catch{}
 function set(v,persist=true){level=Math.max(1,Math.min(5,Math.round(v)));slider.value=level;output.textContent=level+' / 5';slider.setAttribute('aria-valuetext',level+'단계');dirty=true;if(persist)try{localStorage.setItem('3nu.viewDistance',level)}catch{}}
 slider.oninput=()=>set(Number(slider.value));set(level,false);
 const css=document.createElement('style');css.textContent='#viewDistance98{margin:20px 0}#viewDistance98>label{display:flex;justify-content:space-between;font-weight:700}#viewDistance98 input{width:100%;accent-color:#15166a}#viewDistance98 output{color:#15166a;background:#eff0fa;border-radius:6px;padding:2px 7px}#viewDistance98 p{font-size:12px;color:#657780;line-height:1.5;margin:8px 0}';document.head.append(css);
 scene.getActiveMeshCandidates=()=>enabled?candidates:original();
 const distance=(g,x,z)=>Math.hypot(Math.max(g.x0-x,0,x-g.x1),Math.max(g.z0-z,0,z-g.z1));
 function update(now){if(!dirty&&now-last<250)return;const x=player.position.x,z=player.position.z;if(!dirty&&Math.hypot(x-lastX,z-lastZ)<8&&lastCount===scene.meshes.length)return;
  const dt=Math.max(.25,(now-last)/1000),vx=Number.isFinite(lastX)?Math.max(-100,Math.min(100,(x-lastX)/dt*1.5)):0,vz=Number.isFinite(lastZ)?Math.max(-100,Math.min(100,(z-lastZ)/dt*1.5)):0;last=now;lastX=x;lastZ=z;dirty=false;lastCount=scene.meshes.length;
  const r=ranges[level-1];updateForest(x,z,enabled?r:Infinity);if(level===5){active.clear();for(const g of groups.values())active.add(g);}else{
   for(const g of active)if(distance(g,x,z)>r+180)active.delete(g);
   const enter=r+100;for(let cx=Math.floor((x+vx-enter)/cellSize);cx<=Math.floor((x+vx+enter)/cellSize);cx++)for(let cz=Math.floor((z+vz-enter)/cellSize);cz<=Math.floor((z+vz+enter)/cellSize);cz++)for(const g of grid.get(cx+','+cz)||[])if(distance(g,x,z)<=enter||distance(g,x+vx,z+vz)<=enter)active.add(g);
  }
  const a=[...always].filter(m=>!m.isDisposed()&&(!forestData||m!==leaf&&m!==trunk||m.thinInstanceCount>0));for(const g of active)for(const m of g.meshes)if(!m.isDisposed()&&!always.has(m))a.push(m);candidates={data:a,length:a.length};revision++;
 }
 scene.onNewMeshAddedObservable.add(m=>{if(!m.isDisposed())always.add(m);dirty=true;});
 scene.onMeshRemovedObservable.add(m=>{always.delete(m);meshGroup.delete(m);dirty=true;});
 // Filter shadow casters before each render without changing collision visibility or original ownership.
 scene.onBeforeRenderObservable.add(()=>{for(const light of scene.lights){const map=light.getShadowGenerator?.()?.getShadowMap?.();if(!map?.renderList)continue;let saved=shadowLists.get(map);if(!saved){saved=map.renderList;shadowLists.set(map,saved);}if(map._view98===revision)continue;map._view98=revision;map.renderList=enabled?saved.filter(m=>!meshGroup.has(m)||active.has(meshGroup.get(m))):saved;}});
 update(performance.now());return{set,update,setEnabled(v){enabled=v;dirty=true;},audit:()=>({level,range:ranges[level-1],buffer:100,releaseBuffer:180,cells:grid.size,groups:groups.size,activeGroups:active.size,candidates:candidates.length,total:scene.meshes.length,always:always.size,trees:trunk?.thinInstanceCount,forestCells:forest.size,enabled}),pin(m){always.add(m);dirty=true;}};
}
