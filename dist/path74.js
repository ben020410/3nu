/* Existing graph only. Finite walking preference, not a bus collision system. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Path74=api;})(this,()=>{
function create(nav){const cell=30,grid=new Map(),ring=new Map(),ids=new Set(nav.ring33.orderedIds),half=nav.ring33.carriageway/2-.25;
function add(g,s,pad){for(let x=Math.floor((Math.min(s.a[0],s.b[0])-pad)/cell);x<=Math.floor((Math.max(s.a[0],s.b[0])+pad)/cell);x++)for(let z=Math.floor((Math.min(s.a[1],s.b[1])-pad)/cell);z<=Math.floor((Math.max(s.a[1],s.b[1])+pad)/cell);z++){const k=x+','+z;if(!g.has(k))g.set(k,[]);g.get(k).push(s);}}
for(const r of nav.roads)for(let i=1;i<r.p.length;i++)add(grid,{a:r.p[i-1],b:r.p[i],id:r.id,kind:r.kind},1);
for(let i=1;i<nav.ring33.route.length;i++)add(ring,{a:nav.ring33.route[i-1],b:nav.ring33.route[i]},half);
const dist=(p,s)=>{const x=s.b[0]-s.a[0],z=s.b[1]-s.a[1],t=Math.max(0,Math.min(1,((p[0]-s.a[0])*x+(p[1]-s.a[1])*z)/(x*x+z*z||1)));return Math.hypot(p[0]-s.a[0]-x*t,p[1]-s.a[1]-z*t);},at=(g,p)=>g.get(Math.floor(p[0]/cell)+','+Math.floor(p[1]/cell))||[];
const factors=new Float32Array(nav.edges.length);factors.fill(1);const evidence=[];
nav.edges.forEach(([ai,bi],i)=>{const a=nav.points[ai],b=nav.points[bi],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],near=at(grid,m).map(s=>({s,d:dist(m,s)})).sort((a,b)=>a.d-b.d)[0];if(!near||near.d>.65||!ids.has(near.s.id))return;const s=near.s,dx=b[0]-a[0],dz=b[1]-a[1],sx=s.b[0]-s.a[0],sz=s.b[1]-s.a[1],len=Math.hypot(dx,dz),alignment=Math.abs(dx*sx+dz*sz)/(len*Math.hypot(sx,sz)||1);if(alignment<.8)return;
for(const t of[.2,.5,.8]){const p=[a[0]+dx*t,a[1]+dz*t];if(!at(ring,p).some(q=>dist(p,q)<=half))return;}factors[i]=6;evidence.push({edge:i,a:ai,b:bi,source:s.id,length:len});});return{factors,evidence,multiplier:6};}
return{create};});
