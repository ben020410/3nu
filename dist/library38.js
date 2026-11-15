/* BUILD38: local finish repairs. BUILD37 architectural design is retained. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Library38=api;})(this,()=>{
 function local(s,p){const x=p[0]-s.origin[0],z=p[1]-s.origin[1];return [x*s.u[0]+z*s.u[1],x*s.v[0]+z*s.v[1]];}
 function prepare(data,nav){const s=nav.library17;if(s.revision38)return s;const point=(a,d)=>[s.origin[0]+s.u[0]*a+s.v[0]*d,s.origin[1]+s.u[1]*a+s.v[1]*d],rect=(a,d,w,h)=>[point(a,d),point(a+w,d),point(a+w,d+h),point(a,d+h)];
 s.plazas38=nav.ownedPlazas38||[];
 // Canonical low-to-high construction keeps each tread above its earth support.
 const sideFlight=s.surfaces.find(q=>q.id==='wing-side-path-2');if(sideFlight&&sideFlight.lo>sideFlight.hi){[sideFlight.from,sideFlight.to]=[sideFlight.to,sideFlight.from];[sideFlight.lo,sideFlight.hi]=[sideFlight.hi,sideFlight.lo];}
 // These two old landing rails run into the roof interior, not along a drop.
 s.rails=s.rails.filter(r=>!(Math.abs(r.y-22)<.001&&[r.a,r.b].every(p=>{const [a,d]=local(s,p);return a>=101.9&&a<=106.1&&(Math.abs(d-17)<.01||Math.abs(d-27)<.01);})))
 s.groundSolids=s.groundSolids.filter(q=>!['landing28-guard-14','landing28-guard-15'].includes(q.id));
 const edgeAt=d=>105.06926533159138+(104.79415400660213-105.06926533159138)*(d-29.588639145972593)/(2.6743883177084555-29.588639145972593);
 const addRail=(id,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*.04,nz=dx/len*.04;s.rails.push({id,a,b,y:22});s.groundSolids.push({id,p:[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]],lo:22,hi:23.1});};
 // Guard only the exposed notch returns, leaving the full 10m stair mouth open.
 addRail('roof38-north-return',point(edgeAt(17),17),point(106,17));addRail('roof38-south-return',point(106,27),point(edgeAt(27),27));
 s.screens38=[[40,24],[92,24],[84,16]];
 for(const [i,[a,d]]of s.screens38.entries())s.groundSolids.push({id:'service-screen38-'+i,p:rect(a,d,4.3,4),lo:22,hi:24.8});
 for(const [i,d]of [68,52,35].entries())s.groundSolids.push({id:'court-planter38-'+i,p:rect(-14.8,d-3,3.6,6),lo:4.45,hi:4.97});
 s.revision38='finish38-r1';s.audit38={removedRails:['landing28-guard-14','landing28-guard-15'],movedScreen:{from:[103,24],to:[84,16],size:[4.3,4,2.8]},roofStepTop:22,roofLandingTop:22,landingClearRectangle:[102,17,106,27],plazaIds:s.plazas38.map(q=>q.id)};return s;
 }
 function ground(s,x,z,y){for(const q of s.plazas38||[])if(Library17.inside?Library17.inside(x,z,q.outer):inside(x,z,q.outer)){if(!(q.holes||[]).some(p=>inside(x,z,p)))return q.groundY;}return y;}
 function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!=(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])c=!c;return c;}
 // Cut the raised coping out of the arrival opening, not the roof floor itself.
 function coping(s,a,b){const A=local(s,a),C=local(s,b);if(Math.max(A[0],C[0])<104||Math.min(A[0],C[0])>107)return [[a,b]];const delta=C[1]-A[1];if(Math.abs(delta)<1e-8)return [[a,b]];let lo=(16.99-A[1])/delta,hi=(27.01-A[1])/delta;if(lo>hi)[lo,hi]=[hi,lo];lo=Math.max(0,lo);hi=Math.min(1,hi);if(lo>=hi)return [[a,b]];const at=t=>a.map((v,i)=>v+(b[i]-v)*t),out=[];if(lo>0)out.push([a,at(lo)]);if(hi<1)out.push([at(hi),b]);return out;}
 function pierHeight(s,p,y,h){const [a,d]=local(s,p);return Math.abs(y+h-22)<1e-6&&a>104&&a<107&&d>16.8&&d<27.2?h-.30:h;}
 function protectTrees(nav,state){const s=nav.library17;const add=(id,p,lo,hi,pad)=>{const e={id,building:'library38',p,holes:[],lo,hi,pad,kind:'library-walking-clearance',bounds:[Math.min(...p.map(q=>q[0]))-pad,Math.min(...p.map(q=>q[1]))-pad,Math.max(...p.map(q=>q[0]))+pad,Math.max(...p.map(q=>q[1]))+pad]},index=state.exclusions.push(e)-1;for(let x=Math.floor(e.bounds[0]/state.cell);x<=Math.floor(e.bounds[2]/state.cell);x++)for(let z=Math.floor(e.bounds[1]/state.cell);z<=Math.floor(e.bounds[3]/state.cell);z++){const k=x+','+z;if(!state.grid.has(k))state.grid.set(k,[]);state.grid.get(k).push(index);}};
 for(const q of s.plazas38||[])add(q.id,q.outer,q.groundY-.2,q.groundY+3,.35);
 for(const q of s.surfaces)if([q.id,...q.sources||[]].some(id=>/right-third|wing-side-path/.test(id)))add(q.id,q.p,s.base+q.lo-.2,s.base+Math.max(q.hi,q.lo)+3,.65);
 return state;
 }
 return {prepare,ground,coping,pierHeight,protectTrees,local};
});
