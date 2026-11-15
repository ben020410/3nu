const Facades68=(()=>{
 const ids=new Set(['320669392','93549089','179742154','347806722']);
 const handles=b=>ids.has(b.id);
 function build(B,scene,b,height){if(!handles(b))return false;
 if(b.engineering){const old=b.engineering;b.engineering={...old,finish68:true,...(b.id==='93549089'?{parts:old.parts.map(p=>({...p,bandMaterial:'concrete'}))}:{})};buildEngineering(B,scene,b,height);b.engineering=old;}
 else{const old=b.officialProfile;b.officialProfile={...old,finish68:true};buildOfficialBuilding(B,scene,b,height);b.officialProfile=old;}return true;}
 function routes(world,nav){return [...ids].map(id=>{const a=nav.anchors[id],seen=new Set([a]),path=[world.points[a]];let at=a,length=0;while(length<14){const next=world.adj[at].filter(([i])=>!seen.has(i)).sort((a,b)=>a[1]-b[1])[0];if(!next)break;const[i,len]=next;seen.add(i);const prev=path.at(-1),end=world.points[i];if(length+len>18){const t=(18-length)/len;path.push([prev[0]+(end[0]-prev[0])*t,prev[1]+(end[1]-prev[1])*t]);break;}path.push(end);length+=len;at=i;}const coords=path.map(p=>p.slice(0,2)).reverse();return{zone:'local facade check',road:id,coords,startFeet:world.floorAt(...coords[0]),endFeet:world.floorAt(...coords.at(-1))};});}


 return{handles,build,routes};})();
if(typeof module==='object')module.exports=Facades68;
