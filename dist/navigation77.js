/* BUILD77: preserve the existing stairs, avoid their side guard, use the front approach. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.Navigation77=factory()})(this,()=>{
function prepare(nav){
 if(nav.navigation77)return nav.navigation77;
 const blocked=new Set(['15093:15094','15094:15095','15096:15097']),removed=[];
 nav.edges=nav.edges.filter(e=>{const key=[...e].sort((a,b)=>a-b).join(':');if(blocked.has(key)){removed.push(e);return false;}return true;});
 nav.anchors['167598095']=4000;
 // The two isolated old side-crossing points remain auditable, not route-start candidates.
 return nav.navigation77={removed,excludedNearest:[15095,15096],destination:4000};
}
return{prepare};
});
