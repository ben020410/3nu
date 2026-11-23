const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../dist/campus-journey125.js');
const stops=['a','b','c','d'].map(id=>({id}));
test('future reservation respects direction and wrap; stopped here is zero',()=>{
 assert.deepEqual(C.stopOrder(stops,{dwell:false,nextStopId:'d'},'b'),{count:3,now:false});
 assert.deepEqual(C.stopOrder(stops,{dwell:true,stopId:'c',nextStopId:'d'},'c'),{count:0,now:true});
 assert.equal(C.stopOrder(stops,{dwell:false,nextStopId:'a'},'missing'),null);
});
const world={blocked:()=>false,move:(p,dx,dz)=>({...p,x:p.x+dx,z:p.z+dz,distance:Math.hypot(dx,dz)})};
test('route validation rejects an inaccessible level rather than reporting arrival',()=>{assert.equal(C.checkWalk(world,[[0,0,1],[1,0,2]]).ok,false);});
test('route validation rejects an obstacle, NaN and empty coordinates',()=>{
 assert.equal(C.checkWalk({...world,move:p=>({...p,distance:0})},[[0,0,1],[1,0,1]]).reason,'blocked-segment');
 assert.equal(C.checkWalk(world,[[0,0,NaN]]).ok,false);assert.equal(C.checkWalk(world,[]).ok,false);
});
test('walk validation traverses actual points and keeps feet height',()=>{const r=C.checkWalk(world,[[0,0,1],[1,0,1],[1,2,1]]);assert.equal(r.ok,true);assert.ok(Math.abs(r.distance-3)<.1);assert.equal(r.end[2],1);});
