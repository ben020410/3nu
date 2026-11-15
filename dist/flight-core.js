/* Swept, substepped flight in metres. The renderer supplies mesh collision queries. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.FlightCore=factory()})(this,()=>({
 move(state,delta,bounds,height,blocked){
  const count=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.y,delta.z)/.2));let p={x:state.x,y:state.y,z:state.z},distance=0;
  for(let i=0;i<count;i++){
   const q={x:Math.max(bounds[0]+1,Math.min(bounds[2]-1,p.x+delta.x/count)),z:Math.max(bounds[1]+1,Math.min(bounds[3]-1,p.z+delta.z/count)),y:p.y+delta.y/count};
   q.y=Math.max(height(q.x,q.z)+.95,Math.min(600,q.y));
   if(!blocked(p,q)){distance+=Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z);p=q;}
  }return {...p,distance};
 }
}));
