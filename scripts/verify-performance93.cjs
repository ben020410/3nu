// Node CPU comparison only; not browser loading, GPU, frame-time or mobile evidence.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{performance}=require('perf_hooks');
const fixture=require('./facility-labels-fixture.cjs');
const baselinePath=process.argv[2];if(!baselinePath)throw Error('Usage: node scripts/verify-performance93.cjs <baseline-walk-core.js>');
const before=fs.readFileSync(baselinePath,'utf8'),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const runs={before:[],after:[]};let reference,referenceNav,firstBefore,firstAfter;
(async()=>{
 for(let round=0;round<3;round++)for(const variant of round%2?['after','before']:['before','after']){
  const t=performance.now();const f=await fixture(variant==='before'?{walkCoreSource:before}:{});const ms=performance.now()-t;
  const graph=hash(f.world.adj),navHash=hash(f.nav);if(reference){assert.equal(graph,reference,'all adjacency entries and weights');assert.equal(navHash,referenceNav,'prepared navigation data');}else{reference=graph;referenceNav=navHash;}
  runs[variant].push(ms);if(variant==='before'&&!firstBefore)firstBefore=f;if(variant==='after'&&!firstAfter)firstAfter=f;
 }
 const a=firstBefore,b=firstAfter,segments=[];let seed=93;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(const fence of a.nav.outdoor.fences||[])for(const offset of[-.51,-.5,-.49,0,.49,.5,.51,2]){const x=fence.a[0]+offset,z=fence.a[1]+offset;segments.push([[x-1,z],[x+1,z+1]]);}
 for(let i=0;i<120;i++){const p=a.nav.points[Math.floor(random()*a.nav.points.length)],q=a.nav.points[Math.floor(random()*a.nav.points.length)];segments.push([p,[p[0]+(q[0]-p[0])*.02,p[1]+(q[1]-p[1])*.02]]);}
 let checks=0;for(const [p,q]of segments){assert.equal(a.world.clearLine(p,q),b.world.clearLine(p,q),'clearLine');const y=a.world.floorAt(p[0],p[1]);assert.equal(y,b.world.floorAt(p[0],p[1]));assert.deepEqual(JSON.parse(JSON.stringify(a.world.move({x:p[0],z:p[1],y:y+.95},.12,-.08))),JSON.parse(JSON.stringify(b.world.move({x:p[0],z:p[1],y:y+.95},.12,-.08))));checks++;}
 const median=v=>[...v].sort((a,b)=>a-b)[1];
 console.log(JSON.stringify({kind:'Node initialization CPU; browser unavailable',node:process.version,platform:process.platform,architecture:process.arch,runsMs:runs,medianMs:{before:median(runs.before),after:median(runs.after)},allGraphEntriesIdentical:true,preparedNavigationIdentical:true,adjacencyHash:reference,points:a.nav.points.length,edges:a.nav.edges.length,fences:a.nav.outdoor.fences.length,clearLineFloorMovePairs:checks,browserFrameMs:null,browserInteractiveMs:null,gpuMemory:null},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
