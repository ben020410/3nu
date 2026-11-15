// Apply the exact runtime sampler, rather than approximating grades independently.
const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..');
const N=JSON.parse(fs.readFileSync(R+'/dist/data/walk.json')),D=JSON.parse(fs.readFileSync(R+'/dist/data/campus.json'));
global.Library17=require(R+'/dist/library17');Library17.prepare(D,N);require(R+'/dist/student22').prepare(D,N);require(R+'/dist/landmarks30').prepare(D,N);
const W=require(R+'/dist/walk-core').create(D,N),G=require(R+'/dist/ring-road33').createGrade(N.ring33);
const buf=fs.readFileSync(R+'/dist/data/ground.bin'),v=new Float32Array(buf.buffer,buf.byteOffset,buf.length/4);let count=0,max=0;
for(let i=0;i<v.length;i+=3){const x=v[i],z=v[i+2];if(G.sample(x,z).weight>0){const y=W.terrain(x,z);max=Math.max(max,Math.abs(y-v[i+1]));v[i+1]=y;count++;}}
fs.writeFileSync(R+'/dist/data/ground.bin',buf);fs.writeFileSync(R+'/reports/build33/mesh-grade.json',JSON.stringify({verticesGraded:count,maxExistingVertexAdjustment:max},null,2));console.log('Shared grade applied',count,'max vertex change',max);
