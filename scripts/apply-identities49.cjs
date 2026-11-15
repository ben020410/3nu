/* Reapply approved identities after any scoped rebuild. Never discover/approve new labels. */
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),D=root+'/dist',P=JSON.parse(fs.readFileSync(root+'/sources/identities49/policy.json')),I=require(D+'/identity49.js');
const read=f=>JSON.parse(fs.readFileSync(D+'/data/'+f)),write=(f,x)=>fs.writeFileSync(D+'/data/'+f,JSON.stringify(x));
const data=read('campus.json'),places=read('places.json'),nav=read('walk.json');I.apply(data,places,nav,P);
// User-visible source fields are canonical, historic identities are kept only in reports.
const strip=o=>{for(const k of Object.keys(o))if(/^(sourceName|previousName|previousIdentity|sourceNumber|sourceAttributes)/.test(k))delete o[k];};
for(const b of data.buildings)if(P.unregisteredIds.includes(b.id)||P.renames[b.id])strip(b);
for(const p of places)if(P.renames[p.id])strip(p);
write('campus.json',data);write('places.json',places);write('walk.json',nav);write('identities49.json',P);
console.log({models:data.buildings.length,approvedLabels:P.approvedLabels.length,removedModels:P.removedModelIds.length});
