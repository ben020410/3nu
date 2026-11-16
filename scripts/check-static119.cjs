/* Run --record only after both bake commands and procedural/cached equivalence pass. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict'),zlib=require('zlib');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'dist/data/static119'),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function files(base){return fs.readdirSync(base,{withFileTypes:true}).flatMap(d=>d.isDirectory()?(d.name==='static119'?[]:files(path.join(base,d.name))):[path.join(base,d.name)]);}
const inputs=[...files(path.join(root,'dist')).filter(p=>p.endsWith('.js')&&!p.endsWith('/static119.js')),...files(path.join(root,'dist/data')).filter(p=>/\.(json|bin)$/.test(p))].sort();
const source=Object.fromEntries(inputs.map(p=>[path.relative(root,p),hash(p)])),file=path.join(dir,'sources.json');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),g=JSON.parse(fs.readFileSync(path.join(dir,'ground.json')));assert.equal(m.version,119);assert(!m.instancing,'Experimental geometry transforms are not supported');
let meshes=0,bytes=0;const referenced=new Set(['manifest.json','ground.json','sources.json']);
function block(name,size,inspect){assert(/^[\w.-]+$/.test(name));referenced.add(name);const packed=fs.readFileSync(path.join(dir,name)),data=zlib.gunzipSync(packed);assert.equal(data.length,size,name);bytes+=size;inspect(data);}
function range(ref,data){assert(Number.isInteger(ref.offset)&&ref.offset>=0&&ref.offset%4===0);assert(Number.isInteger(ref.count)&&ref.count>=0);assert(['Float32Array','Uint16Array','Uint32Array'].includes(ref.type));const width=ref.type==='Uint16Array'?2:4;assert(ref.offset+ref.count*width<=data.length);}
for(const [id,b]of Object.entries(m.buildings)){block(b.file,b.bytes,data=>{for(const item of b.meshes){assert(!item.instances);meshes++;assert(item.record.name);const attrs=item.geometry.fields;assert(attrs.position&&attrs.normal);for(const f of Object.values(attrs))range(f.data,data);range(item.geometry.indices,data);if(item.record.materialId)assert(m.materials[item.record.materialId.replace('static119-material-','')]);}});}
for(const c of g.chunks)block(c.file,c.bytes,data=>{for(const mesh of c.meshes){meshes++;for(const f of Object.values(mesh.fields))range(f,data);range(mesh.indices,data);assert(mesh.material);}});
for(const name of new Set(Object.values(m.textures))){referenced.add(name);assert(fs.statSync(path.join(dir,name)).size>0);}
for(const name of fs.readdirSync(dir))assert(referenced.has(name),'Unreferenced static artifact '+name);
if(process.argv.includes('--record'))fs.writeFileSync(file,JSON.stringify({version:119,source},null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file)).source,source,'Static geometry inputs changed. Re-bake, compare procedural/cached geometry and materials, then --record.');
console.log(JSON.stringify({ok:true,buildings:Object.keys(m.buildings).length,meshes,decodedBytes:bytes,sourceFiles:inputs.length}));
