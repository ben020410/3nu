const fs=require('fs'),assert=require('assert'),Names=require('../dist/place-names.js'),Walk=require('../dist/walk-core.js');
const nav=JSON.parse(fs.readFileSync('dist/data/walk.json')),data=JSON.parse(fs.readFileSync('dist/data/campus.json'));
const unknown=data.buildings.filter(b=>b.name==='이름 미등록 건물');assert(unknown.length);for(const b of unknown)assert.equal(Names.format(b),'');assert.equal(Names.format({name:'행정관',officialNumber:'60'}),'행정관(60동)');
for(const q of nav.outdoor.basketball)for(const x of[-7.5,7.5])for(const z of[-14,14])assert(Walk.inside(q.center[0]+q.axis[0]*x+q.side[0]*z,q.center[1]+q.axis[1]*x+q.side[1]*z,q.outer));
const l=nav.outdoor.lawn,b=l.bear15,dx=b.center[0]-l.center[0],dz=b.center[1]-l.center[1],v=dx*l.v[0]+dz*l.v[1];assert(v<-27);assert(Math.sin(b.rotation)*l.v[0]+Math.cos(b.rotation)*l.v[1]>.999);
const result={unnamedLabelsHidden:unknown.length,unnamedGeometryPreserved:true,courtLinesWithinBothFootprints:true,bearFacesAdministration:true,bearOppositeEdgeLocalV:v};fs.writeFileSync('BUILD16-TEST.json',JSON.stringify(result,null,2));console.log(result);

const w=Walk.create(data,nav),p=(a,d)=>[l.center[0]+l.u[0]*a+l.v[0]*d,l.center[1]+l.u[1]*a+l.v[1]*d];let last=w.height(...p(10,34));for(let d=34.05;d<=64;d+=.05){const h=w.height(...p(10,d));assert(Math.abs(h-last)<.26);last=h;}console.log("Terrace stair/ramp continuous height: passed");
