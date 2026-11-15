/* Explicit approval registry. Model ownership and interaction never create labels. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Identity49=api;})(typeof window==='object'?window:globalThis,()=>{
function apply(data,places,nav,policy){
 const removed=new Set(policy.removedModelIds),unregistered=new Set(policy.unregisteredIds),order=new Map(policy.modelOrder.map((id,i)=>[id,i]));
 data.buildings=data.buildings.filter(b=>!removed.has(b.id));
 for(const b of data.buildings){b.renderStyleIndex49=policy.renderStyleIndices?.[b.id]??order.get(b.id);delete b.place;delete b.label49;const q=policy.renames[b.id];if(q){b.name=q.name;b.officialNumber=q.number;}if(unregistered.has(b.id)){delete b.name;delete b.aliases;}}
 for(let i=places.length-1;i>=0;i--)if(removed.has(places[i].id)||unregistered.has(places[i].id))places.splice(i,1);else if(policy.renames[places[i].id]){Object.assign(places[i],policy.renames[places[i].id]);places[i].aliases=[];}
 nav.extraPlaces=(nav.extraPlaces||[]).filter(p=>!removed.has(p.id)&&!unregistered.has(p.id));for(const p of nav.extraPlaces)if(policy.renames[p.id])Object.assign(p,policy.renames[p.id]);
 for(const id of removed)delete nav.anchors[id];
 for(const b of nav.grading?.blocks||[])if(b.buildings)b.buildings=b.buildings.filter(id=>!removed.has(id));
 for(const f of [...nav.facilities||[],...nav.reviewFacilities||[]]){if(policy.renames[f.id])f.name=policy.renames[f.id].name;if(unregistered.has(f.id))delete f.name;}
}
function register(data,places,nav,policy){
 const byId=new Map(data.buildings.map(b=>[b.id,b]));places.length=0;
 for(const b of data.buildings){delete b.place;delete b.label49;}
 for(const p of policy.approvedLabels){const b=byId.get(p.id);if(!b)throw Error('Approved label missing model: '+p.id);const record={...p,aliases:[...p.aliases]};b.label49=record;b.place=record;places.push(record);}
 data.labels49=places;data.identity49=policy;
}
function meshKey(m){return JSON.stringify([m.name,m.metadata?.category29||'',m.metadata?.facilityId||'']);}
function bindMeshes(scene,data,policy){const labels=new Map(data.labels49.map(p=>[p.id,p])),approved=new Map((policy.meshBindings||[]).map(b=>[b.key,b.id])),result=new Map();for(const m of scene.meshes){const id=m.metadata?.labelSurfaceId49||approved.get(meshKey(m));if(id&&labels.has(id))result.set(m,labels.get(id));}return result;}
// Migration is a review tool only. Its output must be saved explicitly; runtime never calls it.
function proposeExistingBindings(scene,data){const buildings=[...data.buildings].sort((a,b)=>b.id.length-a.id.length),labels=new Set(data.labels49.map(p=>p.id)),out=[];for(const m of scene.meshes){if(m.metadata?.library17&&m.metadata.category29!=='building')continue;let b=buildings.find(b=>m.metadata?.facilityId===b.id||m.name==='building-'+b.id||m.name.startsWith('building-'+b.id+'-')||m.name==='roof-'+b.id||m.name.startsWith('roof-'+b.id+'-'));if(!b&&m.name.startsWith('building-museum-'))b=buildings.find(b=>b.id==='252233408');if(!b&&m.name.startsWith('gate-'))b=buildings.find(b=>b.id==='gate');if(b&&labels.has(b.id))out.push({key:meshKey(m),id:b.id});}return [...new Map(out.map(q=>[q.key,q])).values()];}
return{apply,register,meshKey,bindMeshes,proposeExistingBindings};});
