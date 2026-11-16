/* Exact build-time static building assets. Mobile avoids procedural temporary
 * arrays; all collision/picking meshes still exist before the title becomes ready.
 * Authoring builders remain the desktop and cache-generation source of truth. */
function useStatic119(){return typeof DecompressionStream==='function'&&matchMedia('(pointer:coarse)').matches&&!new URLSearchParams(location.search).has('bake119');}
async function fetchStatic119(url,signal){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('캠퍼스 자료를 불러오지 못했어요. 다시 시도해 주세요.');const data=await response.arrayBuffer();return data;}finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort);}}
async function jsonStatic119(url){return JSON.parse(new TextDecoder().decode(await fetchStatic119(url)));}
async function binaryStatic119(url,bytes){bytes=bytes||await fetchStatic119(url);return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}

/* Four compressed payloads at a time. Decode/apply exactly one in authoring order.
 * Scene failure/disposal aborts outstanding requests; failures are observed at take().
 * This bounds prefetch memory and avoids hundreds of serial network round trips. */
function createStaticQueue120(files,load,limit=4){
 const slots=new Map(),controller=new AbortController();let next=0,cursor=0,closed=false,buffered=0;
 const stats={requested:0,peakSlots:0,peakBufferedBytes:0};
 function fill(){while(!closed&&slots.size<limit&&next<files.length){const key=files[next++],slot={bytes:0,promise:null};slots.set(key,slot);stats.requested++;stats.peakSlots=Math.max(stats.peakSlots,slots.size);slot.promise=Promise.resolve().then(()=>load(key,controller.signal)).then(data=>{if(!closed&&slots.get(key)===slot){slot.bytes=data.byteLength;buffered+=slot.bytes;stats.peakBufferedBytes=Math.max(stats.peakBufferedBytes,buffered);}return{data};},error=>({error}));}}
 function dispose(){closed=true;controller.abort();slots.clear();buffered=0;}
 fill();return{stats,dispose,async take(key){if(closed)throw Error('Static preparation stopped');if(key!==files[cursor])throw Error('Static asset order changed');const slot=slots.get(key),result=await slot.promise;if(closed)throw Error('Static preparation stopped');if(result.error){dispose();throw result.error;}slots.delete(key);buffered-=slot.bytes;cursor++;fill();return result.data;}};
}

async function createStaticBuildings119(B,scene,buildings){
 if(!useStatic119())return null;
 const manifest=await jsonStatic119('data/static119/manifest.json?v=119'),materials=new Map(),stats={buildings:0,bytes:0,meshes:0};
 const files=(buildings?buildings.map(b=>manifest.buildings[b.id]).filter(Boolean):Object.values(manifest.buildings)).map(e=>e.file),queue=createStaticQueue120(files,(file,signal)=>fetchStatic119('data/static119/'+file+'?v=119',signal));stats.prefetch=queue.stats;scene.onDisposeObservable.addOnce(queue.dispose);
 function material(id){if(!id)return null;const key=id.replace('static119-material-','');if(materials.has(key))return materials.get(key);
  const record=manifest.materials[key];if(!record)throw Error('Invalid static material '+key);
  const parsed={...record};delete parsed._imageProcessingConfiguration;const result=B.Material.Parse(parsed,scene,'');materials.set(key,result);return result;
 }
 return {stats,async build(b){const entry=manifest.buildings[b.id];if(!entry)return false;
  window.Title105?.stage('건물 준비 중… '+(stats.buildings+1)+' / '+Object.keys(manifest.buildings).length);const buffer=await binaryStatic119(null,await queue.take(entry.file));if(buffer.byteLength!==entry.bytes)throw Error('Incomplete static building '+b.id);
  for(const [index,item]of entry.meshes.entries()){
   const vd=new B.VertexData(),kindMap={position:'positions',normal:'normals',uv:'uvs',uv2:'uvs2',color:'colors'};
   for(const [kind,f]of Object.entries(item.geometry.fields)){const key=kindMap[kind];if(!key)throw Error('Unsupported static vertex field '+kind);vd[key]=new Float32Array(buffer,f.data.offset,f.data.count);}
   const ix=item.geometry.indices,Index=ix.type==='Uint16Array'?Uint16Array:Uint32Array;vd.indices=new Index(buffer,ix.offset,ix.count);
   const geometryId='static119-'+b.id+'-'+index;const geometry=new B.Geometry(geometryId,scene,vd,false);scene.pushGeometry(geometry,true);material(item.record.materialId);
   const mesh=B.Mesh.Parse({...item.record,geometryId},scene,'');mesh.material=material(item.record.materialId);mesh.freezeWorldMatrix();stats.meshes++;
  }
  Object.assign(b,entry.changes);stats.buildings++;stats.bytes+=buffer.byteLength;return true;
 }};
}

async function loadStaticGround119(B,scene,yieldWork){
 const manifest=await jsonStatic119('data/static119/ground.json?v=119');let completed=0;const queue=createStaticQueue120(manifest.chunks.map(c=>c.file),(file,signal)=>fetchStatic119('data/static119/'+file+'?v=119',signal));scene.onDisposeObservable.addOnce(queue.dispose);scene.metadata={...scene.metadata,groundPrefetch120:queue.stats};
 for(const chunk of manifest.chunks){await yieldWork(true);window.Title105?.stage('지형 준비 중… '+(++completed)+' / '+manifest.chunks.length);const buffer=await binaryStatic119(null,await queue.take(chunk.file));if(buffer.byteLength!==chunk.bytes)throw Error('Incomplete static terrain');
  for(const item of chunk.meshes){const vd=new B.VertexData(),keys={position:'positions',normal:'normals',uv:'uvs'};
   for(const [kind,f]of Object.entries(item.fields)){if(!keys[kind])throw Error('Unexpected terrain attribute');vd[keys[kind]]=new Float32Array(buffer,f.offset,f.count);}
   const ix=item.indices;vd.indices=new (ix.type==='Uint16Array'?Uint16Array:Uint32Array)(buffer,ix.offset,ix.count);
   const mesh=new B.Mesh(item.name,scene),geometry=new B.Geometry('static119-ground-'+mesh.uniqueId,scene,vd,false,mesh);mesh.material=scene.getMaterialByName(item.material);if(!mesh.material)throw Error('Missing terrain material '+item.material);mesh.isPickable=item.pickable;mesh.metadata=item.metadata;mesh.freezeWorldMatrix();
  }
 }
}
