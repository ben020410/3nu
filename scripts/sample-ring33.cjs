const fs=require('fs'),path=require('path'),R=path.resolve(__dirname,'..'),O=R+'/reports/build33';
const N=JSON.parse(fs.readFileSync(O+'/source-data/walk.json')),D=JSON.parse(fs.readFileSync(O+'/source-data/campus.json'));
global.Library17=require(R+'/dist/library17.js');Library17.prepare(D,N);require(R+'/dist/student22.js').prepare(D,N);require(R+'/dist/landmarks30.js').prepare(D,N);
const W=require(R+'/dist/walk-core.js').create(D,N),Q=JSON.parse(fs.readFileSync(O+'/height-query.json'));
for(const k of ['ring','approach'])Q[k]=Q[k].map(p=>[...p,W.terrain(...p)]);
fs.writeFileSync(O+'/height-samples.json',JSON.stringify(Q));
const cams={},locations={gate:[-332,808],transition:[-266,-74],lower:[-175,-500],engineering:[-120,-1310],return:[393,160]};
for(const [k,[x,z]]of Object.entries(locations)){const y=W.terrain(x,z);cams['ring33-'+k]={eye:[x+72,y+68,z+75],at:[x,y,z]};cams['ring33-'+k+'-ground']={eye:[x-5,y+2.2,z+25],at:[x,y+2,z-35]};}
cams['ring33-lower']={eye:[-275,169,-535],at:[-175,89,-500]};
cams['ring33-engineering']={eye:[-138,188,-1210],at:[15,112,-1068]};cams['ring33-engineering-ground']={eye:[-4,97.7,-1145],at:[1,98,-1040]};
cams['ring33-whole']={eye:[20,2000,-230],at:[20,90,-229.999],span:1230};
fs.writeFileSync(O+'/cameras.json',JSON.stringify(cams,null,2));
for(const dir of [R+'/dist',R+'/../../work/baseline33/dist']){let s=fs.readFileSync(dir+'/app.js','utf8');s=s.replace(/Object.assign\(reviewViews,\{"ring33-gate".*?\);let reviewView=/,'let reviewView=');s=s.replace('let reviewView=','Object.assign(reviewViews,'+JSON.stringify(cams)+');let reviewView=');fs.writeFileSync(dir+'/app.js',s);}
console.log('Height range',Math.min(...Q.ring.map(p=>p[2])),Math.max(...Q.ring.map(p=>p[2])),'cameras',Object.keys(cams).length);
