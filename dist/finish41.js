/* BUILD41: local ground ownership and narrowly scoped planting clearance. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Finish41=api;})(this,()=>{
function prepare(data,nav,spec){if(nav.finish41)return nav.finish41;nav.finish41=spec;spec.clearance=spec.treeClearance.map(q=>({...q,bounds:[Math.min(...q.outer.map(p=>p[0])),Math.min(...q.outer.map(p=>p[1])),Math.max(...q.outer.map(p=>p[0])),Math.max(...q.outer.map(p=>p[1]))]}));return spec;}
function inside(x,z,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function treeHit(spec,x,z,r){if(!spec)return false;for(const q of spec.clearance){const [a,b,c,d]=q.bounds;if(x+r<a||x-r>c||z+r<b||z-r>d)continue;if(inside(x,z,q.outer)&&!q.holes.some(p=>inside(x,z,p)))return true;for(const p of [q.outer,...q.holes])for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<r)return true;}}return false;}
return {prepare,treeHit};});
