const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const prohibited=['reports','outputs','screenshots','build-logs','dist/reports','dist/gallery','dist/build27'];
const found=prohibited.filter(p=>fs.existsSync(path.join(root,p)));
const source=Array.from({length:6},(_,i)=>`source-data/terrain-layouts/build${85+i}/source-geometry.json`);
const missing=source.filter(p=>!fs.existsSync(path.join(root,p)));
for(const p of source.filter(p=>!missing.includes(p))) JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
console.log(JSON.stringify({passed:!found.length&&!missing.length,generatedOutputFolders:found,missingSourceInputs:missing},null,2));
if(found.length||missing.length)process.exitCode=1;
