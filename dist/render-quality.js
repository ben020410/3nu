/* Quality settings alter actual render targets, AA and shadow resources. No runtime CDN. */
function createCampusRendering(B,scene,engine,camera,sun,control){
 const coarse=matchMedia('(pointer:coarse)').matches;let quality=coarse?'standard':'high';try{const q=localStorage.getItem('gwanak.quality');if(['standard','high'].includes(q))quality=q;}catch{}
 const pipe=new B.DefaultRenderingPipeline('campus-quality',false,scene,[camera]);pipe.bloomEnabled=false;pipe.depthOfFieldEnabled=false;pipe.fxaaEnabled=true;
 const ic=scene.imageProcessingConfiguration;ic.toneMappingEnabled=false;ic.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_STANDARD;ic.exposure=1.0;ic.contrast=1.0;
 let shadows=null,settings={},frames=[],previous=performance.now(),started=previous;
 function apply(q){quality=q;control.value=q;frames=[];started=previous=performance.now();const high=q==='high';const dpr=Math.min(devicePixelRatio||1,high?2:1.25);engine.setHardwareScalingLevel(1/dpr);pipe.samples=high?Math.min(4,engine.getCaps().maxMSAASamples||1):1;
  if(shadows)shadows.dispose();const size=high?2048:1024;
  if(B.CascadedShadowGenerator.IsSupported){shadows=new B.CascadedShadowGenerator(size,sun);shadows.numCascades=high?3:2;shadows.shadowMaxZ=high?1000:600;shadows.lambda=.4;shadows.stabilizeCascades=true;shadows.cascadeBlendPercentage=.05;shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=high?B.ShadowGenerator.QUALITY_MEDIUM:B.ShadowGenerator.QUALITY_LOW;shadows.bias=.001;shadows.normalBias=.2;shadows.setDarkness(.2);
   const casters=scene.meshes.filter(m=>m.name.startsWith('building-')&&!m.name.includes('-detail-')||m.name.startsWith('gate-')||m.name.startsWith('walker-')||m.metadata?.facilityId==='snubear'||m.metadata?.facilityId==='main-lawn'||m.metadata?.humanities45===true||m.metadata?.pungsan48Tree===true||m.name==='walker'||m.name==='head'||m.name==='backpack');for(const m of casters)if(!/[-](glass|solar|stone-joint)$/.test(m.material?.name||''))shadows.addShadowCaster(m,false);
  }
  for(const m of scene.meshes)m.receiveShadows=!m.name.startsWith('route');for(const t of scene.textures)t.anisotropicFilteringLevel=high?8:4;
  settings={quality:q,resolution:engine.getRenderWidth()+'×'+engine.getRenderHeight(),msaa:pipe.samples,fxaa:true,shadowSize:shadows?size:0,cascades:shadows?shadows.numCascades:0};engine.resize();try{localStorage.setItem('gwanak.quality',q)}catch{}
 }
 control.onchange=e=>apply(e.target.value);apply(quality);
 return {sample(){const now=performance.now(),dt=now-previous;previous=now;if(dt<500&&now-started>2000){frames.push(dt);if(frames.length>600)frames.shift();}},metrics(){const sorted=[...frames].sort((a,b)=>a-b),avg=frames.reduce((s,v)=>s+v,0)/(frames.length||1);return{...settings,resolution:engine.getRenderWidth()+'×'+engine.getRenderHeight(),samples:frames.length,meanMs:+avg.toFixed(2),p95Ms:+(sorted[Math.floor(sorted.length*.95)]||0).toFixed(2),fps:avg?+(1000/avg).toFixed(1):0,activeMeshes:scene.getActiveMeshes().length,activeTriangles:Math.round(scene.getActiveIndices()/3)};}};
}
