const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../dist/residency123.js');
const wait=()=>new Promise(r=>setTimeout(r,5));
async function until(check){for(let i=0;i<300;i++){if(check())return;await wait()}throw Error('Timed out')}
function fixture(){let live=0,loads=[];const manager=create({disposeMeshes:meshes=>{live-=meshes.length;}});const add=(id,x,loader)=>manager.register(id,[x,0,x+10,10],'building',100,async signal=>{loads.push(id);if(loader)await loader(signal);live++;return [{}]});return{manager,add,loads,get live(){return live}};}
test('local complete units load, evict and return without accumulating live meshes',async()=>{const f=fixture();f.add('a',0);f.add('b',1000);f.manager.setFocus([{x:0,z:0}],1,0,true);await f.manager.warm();assert.deepEqual(f.loads,['a']);assert.equal(f.live,1);f.manager.setFocus([{x:1000,z:0}],1,1000,true);await f.manager.warm();assert.equal(f.live,1);f.manager.setFocus([{x:0,z:0}],1,2000,true);await f.manager.warm();assert.deepEqual(f.loads,['a','b','a']);assert.equal(f.live,1);f.manager.dispose();assert.equal(f.live,0);});
test('hysteresis retains an old unit outside prepare range, level5 loads every unit and lowering evicts',async()=>{const f=fixture();f.add('a',0);f.add('b',1000);f.manager.setFocus([{x:0,z:0}],1,0,true);await f.manager.warm();f.manager.setFocus([{x:220,z:0}],1,1000,true);assert.equal(f.live,1);f.manager.setFocus([{x:220,z:0}],5,2000,true);await f.manager.warm();assert.equal(f.live,2);f.manager.setFocus([{x:0,z:0}],1,3000,true);await f.manager.warm();assert.equal(f.live,1);f.manager.dispose();});
test('failed required file does not appear ready; explicit retry recovers',async()=>{const f=fixture();let attempts=0;f.add('a',0,async()=>{if(!attempts++)throw Error('offline')});f.manager.setFocus([{x:0,z:0}],1,0,true);await assert.rejects(f.manager.warm(),/offline/);assert(!f.manager.ready());assert(f.manager.failure());f.manager.retry();await f.manager.warm();assert(f.manager.ready());assert.equal(f.live,1);f.manager.dispose();});
test('dispose during outstanding load discards result and has no residual geometry',async()=>{const f=fixture();let finish;f.add('a',0,()=>new Promise(r=>finish=r));f.manager.setFocus([{x:0,z:0}],1,0,true);await until(()=>!!finish);f.manager.dispose();finish();await until(()=>f.manager.audit().loading.length===0&&f.live===0);assert.equal(f.manager.audit().residentBytes,0);assert(f.manager.audit().closed);});

test('shipped residency bounds match the current static manifest and cover every complete unit',()=>{const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),root=path.resolve(__dirname,'../dist/data'),bounds=JSON.parse(fs.readFileSync(path.join(root,'residency123.json')));for(const name of ['manifest.json','ground.json'])assert.equal(bounds.source[name],crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'static119',name))).digest('hex'),'Re-run bake-residency123.cjs after changing '+name);const manifest=JSON.parse(fs.readFileSync(path.join(root,'static119/manifest.json'))),ground=JSON.parse(fs.readFileSync(path.join(root,'static119/ground.json')));assert.deepEqual(Object.keys(bounds.buildings).sort(),Object.keys(manifest.buildings).sort());assert.deepEqual(Object.keys(bounds.ground).sort(),ground.chunks.map(c=>c.file).sort());for(const b of [...Object.values(bounds.buildings),...Object.values(bounds.ground)]){assert.equal(b.length,4);assert(b.every(Number.isFinite));assert(b[0]<=b[2]&&b[1]<=b[3]);}assert(bounds.terrain.length>0);for(const t of bounds.terrain)assert(Object.values(t).every(Number.isFinite));});

test('nearby-first keeps distant units off the entry path, stops work while hidden and starts the full selected range on return',async()=>{
 const loads=[];
 const manager=create({nearFirst:true,disposeMeshes(){}});
 for(const [id,x] of [['far',250],['near',10]])manager.register(id,[x,0,x+1,1],'building',50,async()=>{loads.push(id);return [{}];});
 manager.setFocus([{x:0,z:0}],5,0,true);
 await manager.warm();
 assert.deepEqual(loads,['near']);
 manager.pause(true);
 manager.startStreaming();
 await wait();
 assert.deepEqual(loads,['near']);
 manager.pause(false);
 await until(()=>manager.audit().residentUnits===2);
 assert.deepEqual(loads,['near','far']);
 manager.dispose();
});

test('mobile checkpoint validation rejects stale, non-finite and unsafe grounded positions',()=>{
 const {readPose,lawnPose}=require('../dist/mobile-session126.js');
 const pose={x:20,y:10.95,z:15,yaw:0,pitch:.32,facing:1,flying:false,at:1000};
 const bounds=[0,0,100,100],world={floorAt:()=>10,blocked:()=>false};
 const read=(data,now=1100,w=world)=>readPose({getItem:()=>JSON.stringify(data)},bounds,w,now);
 assert.deepEqual(read(pose),pose);
 assert.equal(read({...pose,x:500}),null);
 assert.equal(read({...pose,y:15}),null);
 assert.equal(read({...pose,pitch:null}),null);
 assert.equal(read(pose,1000+7*3600000),null);
 assert.equal(read(pose,1100,{...world,blocked:()=>true}),null);
 assert.equal(read({...pose,y:15,flying:true}).y,15);
 const bag={x:20,z:15,y:10},entry=lawnPose([bag],{center:[25,25]},world);
 assert(Math.abs(Math.hypot(entry.x-bag.x,entry.z-bag.z)-2.15)<1e-8);
 assert.notEqual(entry.facing,entry.yaw);
 assert.equal(lawnPose([bag],{center:[25,25]},{...world,blocked:()=>true}),null);
});
