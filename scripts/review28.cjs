// Reapply saved review cameras without mutating the BUILD27 geometry baseline.
const fs=require('fs');
const cameras=require('../BUILD28-CAMERAS.json');
const p='dist/app.js';let s=fs.readFileSync(p,'utf8');
for(const [id,c]of Object.entries(cameras)){
 const re=new RegExp('\"'+id+'\":\\{\"eye\":\\[[^\\]]+\\],\"at\":\\[[^\\]]+\\]\\}');
 if(!re.test(s))throw Error('Missing existing review camera: '+id);
 s=s.replace(re,JSON.stringify(id)+':'+JSON.stringify(c));
}
fs.writeFileSync(p,s);
