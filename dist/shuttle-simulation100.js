/* Pure timetable; presentation, player input and frame rate never advance vehicle state. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.ShuttleSimulation100=factory()})(globalThis,()=>{
 const mod=(a,n)=>((a%n)+n)%n;
 function create({length,stops,speed,count=6}){
  if(!(length>0&&speed>0&&stops.length))throw Error('Invalid shuttle route');
  const ordered=stops.map(s=>({...s,distance:mod(s.distance,length)})).sort((a,b)=>a.distance-b.distance),origin=ordered[0].distance,segments=[];let cursor=0;
  ordered.forEach((s,i)=>{const next=ordered[(i+1)%ordered.length],travel=mod(next.distance-s.distance,length)/speed;segments.push({s,next,arrive:cursor,depart:cursor+s.dwell,travel});cursor+=s.dwell+travel});const cycle=cursor;
  function vehicle(time,index){const phase=mod(time+index*cycle/count,cycle),q=segments.find(q=>phase<q.depart+q.travel)||segments.at(-1),dwell=phase<q.depart,progress=dwell?0:(phase-q.depart)/q.travel;return{id:'shuttle-'+(index+1),phase,stopId:dwell?q.s.id:null,previousStopId:q.s.id,nextStopId:dwell?q.next.id:q.next.id,dwell,remaining:dwell?q.depart-phase:q.depart+q.travel-phase,distance:mod(q.s.distance+(dwell?0:(phase-q.depart)*speed),length),segmentProgress:progress};}
  function eta(time,id){const q=segments.find(q=>q.s.id===id);if(!q)return Infinity;let best=Infinity;for(let i=0;i<count;i++){const v=vehicle(time,i);if(v.stopId===id)return 0;best=Math.min(best,mod(q.arrive-v.phase,cycle))}return best;}
  return{cycle,segments,stops:ordered,length,speed,count,vehicle,eta,states:time=>Array.from({length:count},(_,i)=>vehicle(time,i))};
 }return{create,mod};
});
