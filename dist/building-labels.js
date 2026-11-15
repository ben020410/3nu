/* The closest visible surface occludes labels, whether it has a registered label or not. */
function createBuildingLabels(B,scene,engine,camera,data,container,height){
 const canvas=engine.getRenderingCanvas(),label=document.createElement('div');label.className='buildingLabel';label.hidden=true;container.replaceChildren(label);let pointer=null,down=null,last=0;
 const byMesh=Identity49.bindMeshes(scene,data,data.identity49),byId=new Map(data.buildings.map(b=>[b.id,b])),areas=data.labels49.filter(p=>byId.get(p.id)?.facility).map(p=>({record:p,model:byId.get(p.id)}));
 const occluder=m=>m.isEnabled()&&m.isVisible&&m.visibility>0&&(m.isPickable||m.metadata?.library17)&&!m.metadata?.character;
 function resolve(hit){if(!hit?.hit)return null;const registered=byMesh.get(hit.pickedMesh);if(registered)return registered;if(hit.pickedMesh.name.startsWith('terrain-')||(!registered&&Math.abs(hit.pickedPoint.y-height(hit.pickedPoint.x,hit.pickedPoint.z))<.2))return areas.find(q=>WalkCore.inside(hit.pickedPoint.x,hit.pickedPoint.z,q.model.p))?.record||null;return null;}
 // Same picker is used by the UI and focused ray regression checks.
 scene.metadata={...scene.metadata,label49:{byMesh,occluder,resolve,count:data.labels49.length}};
 const hide=()=>{pointer=null;label.hidden=true;container.dataset.selected='';container.removeAttribute('aria-label');};
 canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now(),type:e.pointerType};if(e.pointerType!=='mouse')hide()});
 canvas.addEventListener('pointermove',e=>{if(e.buttons){hide();return}if(e.pointerType==='mouse')pointer={x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8&&performance.now()-down.time<600)pointer={x:e.clientX,y:e.clientY};down=null;});
 canvas.addEventListener('pointerleave',hide);canvas.addEventListener('pointercancel',hide);window.addEventListener('blur',hide);document.addEventListener('pointermove',e=>{if(e.target!==canvas&&e.pointerType==='mouse')hide()});document.addEventListener('pointerdown',e=>{if(e.target!==canvas)hide()});
 return function(now){if(now-last<80)return;last=now;label.hidden=true;container.dataset.selected='';container.removeAttribute('aria-label');if(!pointer||!document.body.classList.contains('playing'))return;if(document.elementFromPoint(pointer.x,pointer.y)!==canvas)return;
 const r=canvas.getBoundingClientRect(),x=pointer.x-r.left,y=pointer.y-r.top,hit=scene.pick(x,y,occluder,false,camera),p=resolve(hit);if(!p)return;
 label.textContent=p.displayName;label.style.left=Math.max(80,Math.min(container.clientWidth-80,x))+'px';label.style.top=Math.max(90,y-14)+'px';label.hidden=false;container.dataset.selected=p.id;container.setAttribute('aria-label','선택한 건물: '+p.displayName);
 };
}
