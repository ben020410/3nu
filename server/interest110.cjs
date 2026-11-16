"use strict";
// Interest management is server-side; world simulation and occupancy do not depend on rendering.
function selectNearby(active, previous=new Map(), {cellSize=128, enter=180, exit=220, maxPeers=24}={}) {
 const grid=new Map(), result=new Map();
 const key=(channel,x,z)=>channel+":"+x+":"+z;
 for(const s of active){const x=Math.floor(s.state.x/cellSize),z=Math.floor(s.state.z/cellSize),k=key(s.channel,x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s)}
 const radius=Math.ceil(exit/cellSize);
 for(const s of active){const old=new Set(previous.get(s.id)||[]),cx=Math.floor(s.state.x/cellSize),cz=Math.floor(s.state.z/cellSize),candidates=[];
  for(let x=cx-radius;x<=cx+radius;x++)for(let z=cz-radius;z<=cz+radius;z++)for(const t of grid.get(key(s.channel,x,z))||[]){if(t===s)continue;const d=Math.hypot(t.state.x-s.state.x,t.state.z-s.state.z);if(d<=(old.has(t.id)?exit:enter))candidates.push({id:t.id,d,score:d-(old.has(t.id)?20:0)})}
  candidates.sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id));result.set(s.id,{ids:candidates.slice(0,maxPeers).map(t=>t.id),nearby:candidates.length});
 }
 return result;
}
module.exports={selectNearby};
