'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {gunzipSync}=require('node:zlib');
const dir=path.resolve(__dirname,'../dist/assets/cast126');
const players=['jaha','dongdong','seolgi'];
const cast=[...players,'bori','galpi','dahong','dinga','tani','ohu'];

test('all nine character rigs have aligned vertices, valid indices and lossless HTTP fallback',()=>{
  for(const id of cast){
    const bytes=fs.readFileSync(path.join(dir,id+'.bin'));
    assert.deepEqual(gunzipSync(fs.readFileSync(path.join(dir,id+'.packed.bin'))),bytes,id);
    assert.equal(bytes.toString('ascii',0,4),'3NC1');
    const start=16+bytes.readUInt32LE(4),vertices=bytes.readUInt32LE(8),indices=bytes.readUInt32LE(12);
    const joints=JSON.parse(bytes.toString('utf8',16,start)).joints;
    assert(joints.length<=12 && joints[0][1]===-1);
    assert.equal(start+vertices*28+indices*2,bytes.length,id);
    for(let i=0;i<vertices;i++)assert(bytes[start+i*28+9]<joints.length,id);
    for(let i=start+vertices*28;i<bytes.length;i+=2)assert(bytes.readUInt16LE(i)<vertices,id);
    const texture=fs.readFileSync(path.join(dir,id+'.webp'));
    assert.equal(texture.toString('ascii',8,12),'WEBP');
  }
});

test('player previews and flight clips use the same species as their game rigs',()=>{
  for(const id of cast){
    const bytes=fs.readFileSync(path.join(dir,id+'.bin')),model=JSON.parse(bytes.toString('utf8',16,16+bytes.readUInt32LE(4)));
    for(const clip of ['Walk','Signature'])assert(model.clips[clip]?.[0]>0,id);
    if(!players.includes(id))continue;
    assert(model.clips.Flight?.[0]>0,id);
    const title=gunzipSync(fs.readFileSync(path.join(dir,id+'.title.bin')));
    assert.equal(title.readUInt32LE(0),bytes.readUInt32LE(8));assert.equal(title.readUInt32LE(4),bytes.readUInt32LE(12));
    assert.equal(title.length,8+title.readUInt32LE(0)*16+title.readUInt32LE(4)*2,id);
  }
});
