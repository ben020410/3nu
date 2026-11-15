/* BUILD76: explicit missing connections on the existing Red Plaza east paving. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.Navigation76=factory()})(this,()=>{
function prepare(nav){
 if(nav.navigation76)return nav.navigation76;
 const addedNodes=[],addedEdges=[];
 for(const [a,b] of [[6263,11368],[11368,6087]]){
  const A=nav.points[a],B=nav.points[b];
  if(!A||!B)throw new Error('Red Plaza source nodes missing');
  const count=Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1])/3);let prev=a;
  for(let k=1;k<=count;k++){
   const next=k===count?b:nav.points.length;
   if(k<count){nav.points.push(A.map((v,i)=>v+(B[i]-v)*k/count));addedNodes.push(next);}
   nav.edges.push([prev,next]);addedEdges.push([prev,next]);prev=next;
  }
 }
 return nav.navigation76={addedNodes,addedEdges,anchor:6085};
}
return {prepare};
});
