const fs=require('fs');
global.Library17=require('../dist/library17');
const D=require('../dist/data/campus.json'),N=JSON.parse(fs.readFileSync('dist/data/walk.json'));
Library17.prepare(D,N);require('../dist/student22').prepare(D,N);require('../dist/landmarks30').prepare(D,N);
const W=require('../dist/walk-core').create(D,N),samples=[];
for(const r of N.roads)for(let i=1;i<r.p.length;i++){
 const a=r.p[i-1],b=r.p[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),count=Math.ceil(len/2);if(!len)continue;
 for(let j=0;j<count;j++)for(const lateral of [0,-.35,.35]){
  const t=(j+.5)/count,off=lateral*r.width,x=a[0]+dx*t-dz/len*off,z=a[1]+dz*t+dx/len*off;
  samples.push({id:r.id,x,z,y:W.terrain(x,z)});
 }
}
fs.writeFileSync('reports/build32/ground-samples.json',JSON.stringify(samples));
console.log('sampled',samples.length);
