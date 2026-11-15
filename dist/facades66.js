const Facades66=(()=>{
 const ids=new Set(["167660634", "167606938", "179742149", "439703618", "439696422"]);
 const handles=b=>ids.has(b.id);
 function build(B,scene,b,height){if(!handles(b))return false;const old=b.officialProfile;
 const overrides=b.id==='439703618'?{style:'punched',windowSpacing:7.2,windowRatio:.76,windowHeight:1.65}:{};
 b.officialProfile={...old,...overrides,finish66:true};buildOfficialBuilding(B,scene,b,height);b.officialProfile=old;return true;}
 function routes(world,nav){return [...ids].map(id=>{const a=nav.anchors[id],seen=new Set([a]),path=[world.points[a]];let at=a,length=0;while(length<14){const next=world.adj[at].filter(([i])=>!seen.has(i)).sort((a,b)=>a[1]-b[1])[0];if(!next)break;const[i,len]=next;seen.add(i);const prev=path.at(-1),end=world.points[i];if(length+len>18){const t=(18-length)/len;path.push([prev[0]+(end[0]-prev[0])*t,prev[1]+(end[1]-prev[1])*t]);break;}path.push(end);length+=len;at=i;}const coords=path.map(p=>p.slice(0,2)).reverse();return{zone:'local facade check',road:id,coords,startFeet:world.floorAt(...coords[0]),endFeet:world.floorAt(...coords.at(-1))};});}

 return{handles,build,routes};})();
if(typeof module==='object')module.exports=Facades66;
