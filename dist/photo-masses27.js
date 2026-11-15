/* Two dedicated massing studies. Original georeferenced footprint preserved; inferred split is documented. */
function preparePhotoMasses27(data){
 const clip=(p,axis,t,low)=>{let out=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ia=low?a[axis]<=t:a[axis]>=t,ib=low?b[axis]<=t:b[axis]>=t;if(ia)out.push(a);if(ia!==ib){const f=(t-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);}}return out;};
 for(const b of data.buildings){const s=b.officialProfile,q=s?.mass27;if(!q)continue;const axis=q.axis==='x'?0:1,high=clip(b.p,axis,q.cut,q.highSide==='low'),low=clip(b.p,axis,q.cut,q.highSide!=='low');if(high.length<3||low.length<3)continue;
 const upper={...s,mass27:null,roof27:q.roof==='hip'?{rise:q.roofRise}:null};
 b.renderParts=[{p:high,officialProfile:upper},{p:low,officialProfile:{...s,mass27:null,height:q.lowHeight,rows:2,floorHeights:[q.lowHeight/2,q.lowHeight/2],style:q.raisedAt?'glass':'band',eaveDepth:.7}}];
 if(q.raisedAt)b.renderParts[0].officialProfile={...upper,lowerGlassHeight:q.raisedAt};
 }
}
