/* Quality settings alter actual render targets, AA and shadow resources. No runtime CDN. */
function createCampusRendering(B,scene,engine,camera,sun,control){
 const coarse=matchMedia('(pointer:coarse)').matches;let quality=coarse?'standard':'high';try{const q=localStorage.getItem('gwanak.quality');if(['standard','high'].includes(q))quality=q;}catch{}
 const pipe=new B.DefaultRenderingPipeline('campus-quality',false,scene,[camera]);pipe.bloomEnabled=false;pipe.depthOfFieldEnabled=false;pipe.fxaaEnabled=true;
 const ic=scene.imageProcessingConfiguration;// Avoid notifying every existing material when its image-processing values already match.
 for(const [key,value]of Object.entries({toneMappingEnabled:false,toneMappingType:B.ImageProcessingConfiguration.TONEMAPPING_STANDARD,exposure:1,contrast:1}))if(ic[key]!==value)ic[key]=value;
 engine.renderEvenInBackground=false;
 const isCaster123=m=>(m.name.startsWith('building-')&&!m.name.includes('-detail-')||m.name.startsWith('gate-')||m.name.startsWith('walker-')||m.metadata?.facilityId==='snubear'||m.metadata?.facilityId==='main-lawn'||m.metadata?.humanities45===true||m.metadata?.pungsan48Tree===true||m.name==='walker'||m.name==='head'||m.name==='backpack')&&!/[-](glass|solar|stone-joint)$/.test(m.material?.name||'');
 let shadows=null,settings={},frames=[],previous=performance.now(),started=previous;
 function apply(q){quality=q;engine.maxFPS=coarse&&q==='standard'?30:60;control.value=q;frames=[];started=previous=performance.now();const high=q==='high';const dpr=Math.min(devicePixelRatio||1,coarse?(high?1.5:1):(high?2:1.25));engine.setHardwareScalingLevel(1/dpr);pipe.samples=high&&!coarse?Math.min(4,engine.getCaps().maxMSAASamples||1):1;
  if(shadows)shadows.dispose();const size=coarse?(high?1024:512):(high?2048:1024);
  if(B.CascadedShadowGenerator.IsSupported){shadows=new B.CascadedShadowGenerator(size,sun);shadows.numCascades=coarse?2:(high?3:2);shadows.shadowMaxZ=coarse?(high?350:200):(high?1000:600);shadows.lambda=.4;shadows.stabilizeCascades=true;shadows.cascadeBlendPercentage=.05;shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=high?B.ShadowGenerator.QUALITY_MEDIUM:B.ShadowGenerator.QUALITY_LOW;shadows.bias=.001;shadows.normalBias=.2;shadows.setDarkness(.2);
   const casters=scene.meshes.filter(isCaster123);for(const m of casters)shadows.addShadowCaster(m,false);shadows.getShadowMap()._sourceCasters123=casters;
  }
  for(const m of scene.meshes)m.receiveShadows=!m.name.startsWith('route')&&!m.name.startsWith('cloud97');for(const t of scene.textures)t.anisotropicFilteringLevel=high?8:4;
  settings={quality:q,resolution:engine.getRenderWidth()+'×'+engine.getRenderHeight(),msaa:pipe.samples,fxaa:true,shadowSize:shadows?size:0,cascades:shadows?shadows.numCascades:0};engine.resize();try{localStorage.setItem('gwanak.quality',q)}catch{}
 }
 control.onchange=e=>apply(e.target.value);apply(quality);
 // New static units arrive after initial quality setup. Keep caster sources current.
 if(scene.metadata?.residency123){const added123=new Set();scene.onNewMeshAddedObservable.add(m=>added123.add(m));
 scene.onMeshRemovedObservable.add(m=>{added123.delete(m);if(shadows){shadows.removeShadowCaster(m,false);const map=shadows.getShadowMap();if(map)map._sourceCasters123=(map._sourceCasters123||[]).filter(q=>q!==m);}});
 scene.onBeforeRenderObservable.add(()=>{if(!added123.size)return;const map=shadows?.getShadowMap();for(const m of added123){if(m.isDisposed())continue;m.receiveShadows=!m.name.startsWith('route')&&!m.name.startsWith('cloud97');for(const t of m.material?.getActiveTextures()||[])t.anisotropicFilteringLevel=quality==='high'?8:4;if(shadows&&isCaster123(m)){shadows.addShadowCaster(m,false);map._sourceCasters123.push(m);}}added123.clear();});}

 return {cadence(occluded){const limit=occluded?15:coarse&&quality==='standard'?30:60;if(engine.maxFPS!==limit)engine.maxFPS=limit;},sample(){const now=performance.now(),dt=now-previous;previous=now;if(dt<500&&now-started>2000){frames.push(dt);if(frames.length>600)frames.shift();}},metrics(){const sorted=[...frames].sort((a,b)=>a-b),avg=frames.reduce((s,v)=>s+v,0)/(frames.length||1);return{...settings,resolution:engine.getRenderWidth()+'×'+engine.getRenderHeight(),frameLimit:engine.maxFPS,samples:frames.length,meanMs:+avg.toFixed(2),p95Ms:+(sorted[Math.floor(sorted.length*.95)]||0).toFixed(2),fps:avg?+(1000/avg).toFixed(1):0,activeMeshes:scene.getActiveMeshes().length,activeTriangles:Math.round(scene.getActiveIndices()/3)};}};
}

/* BUILD117: pack completed VertexData before its first GPU upload.
 * Do not intercept Geometry.setVerticesData: Babylon's polygon builder appends
 * back faces after that call. Those small polygon arrays deliberately stay native.
 * CPU picking/collision data stays available; no shape/index/material is removed. */
function compactBootGeometry117(B,scene){
 const mobile=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
 const original=B.VertexData.prototype.applyToMesh,stats={attributes:0,sourceBytes:0,packedBytes:0,terrainVerticesBefore:0,terrainVerticesAfter:0,indexSourceBytes:0,indexPackedBytes:0};let installed=true;
 function apply(mesh,updatable){
  if(mesh.getScene()===scene)for(const key of ['positions','normals','uvs','uvs2','uvs3','uvs4','uvs5','uvs6','colors','matricesIndices','matricesWeights','matricesIndicesExtra','matricesWeightsExtra']){
   const data=this[key];if(!Array.isArray(data))continue;
   stats.attributes++;stats.sourceBytes+=data.length*8;this[key]=new Float32Array(data);stats.packedBytes+=this[key].byteLength;
  }
  if(mobile&&mesh.getScene()===scene){
   if(mesh.name?.startsWith('terrain-')&&!updatable){const n=this.positions?.length/3||0;stats.terrainVerticesBefore+=n;compactTerrain118(this);stats.terrainVerticesAfter+=this.positions?.length/3||0;}
   if(this.indices?.length){const input=this.indices,Index=(this.positions?.length/3||0)<65536?Uint16Array:Uint32Array;stats.indexSourceBytes+=input.byteLength??input.length*8;if(!(input instanceof Index))this.indices=new Index(input);stats.indexPackedBytes+=this.indices.byteLength;}
  }
  return original.call(this,mesh,updatable);
 }
 B.VertexData.prototype.applyToMesh=apply;
 function release(){if(!installed)return;installed=false;if(B.VertexData.prototype.applyToMesh===apply)B.VertexData.prototype.applyToMesh=original;}
 scene.onDisposeObservable.addOnce(release);return{stats,release};
}

/* Exact GPU-attribute indexing for the single-material terrain producer only.
 * Index order/winding and every float32 position/normal/UV are preserved. Never
 * weld across hard normals, UV seams, materials, skinning or builder submeshes. */
function compactTerrain118(vd){
 const n=vd.positions?.length/3||0;if(n<1024||!vd.indices?.length||vd.materialInfos?.length)return;
 const fields=[];for(const [key,stride] of Object.entries({positions:3,normals:3,uvs:2,uvs2:2,uvs3:2,uvs4:2,uvs5:2,uvs6:2,colors:4,matricesIndices:4,matricesWeights:4,matricesIndicesExtra:4,matricesWeightsExtra:4})){
  if(!vd[key])continue;const data=vd[key];if(!(data instanceof Float32Array)||data.length!==n*stride)return;
  fields.push({key,stride,data,bits:new Uint32Array(data.buffer,data.byteOffset,data.length)});
 }
 let capacity=1;while(capacity<n*2)capacity*=2;const table=new Uint32Array(capacity),remap=new Uint32Array(n),mask=capacity-1;let unique=0;
 for(let i=0;i<n;i++){
  let hash=2166136261;for(const f of fields)for(let k=0;k<f.stride;k++)hash=Math.imul(hash^f.bits[i*f.stride+k],16777619);
  let slot=hash&mask,found=-1;
  while(table[slot]){const candidate=table[slot]-1;let same=true;
   for(const f of fields){for(let k=0;k<f.stride;k++)if(f.bits[i*f.stride+k]!==f.bits[candidate*f.stride+k]){same=false;break;}if(!same)break;}
   if(same){found=candidate;break;}slot=(slot+1)&mask;
  }
  if(found<0){found=unique++;table[slot]=found+1;for(const f of fields)for(let k=0;k<f.stride;k++)f.bits[found*f.stride+k]=f.bits[i*f.stride+k];}
  remap[i]=found;
 }
 if(unique===n)return;
 const indices=new Uint32Array(vd.indices.length);for(let i=0;i<indices.length;i++)indices[i]=remap[vd.indices[i]];
 vd.indices=indices;for(const f of fields)vd[f.key]=f.data.slice(0,unique*f.stride);
}
