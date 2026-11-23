'use strict';
const {DatabaseSync} = require('node:sqlite');
const fs = require('node:fs');
const {Problem} = require('./community107.cjs');
const BODY_LIMIT = 224 * 1024;
const WEEK = 7 * 86400000;
function invalid() { throw new Problem(400, '사진 정보를 읽지 못했어요. 다시 촬영해 주세요.'); }
function cleanShot(s) {
  const inRange = (x,min,max) => Number.isFinite(x) && x >= min && x <= max;
  const point = p => Array.isArray(p) && p.length === 3 && p.every(x => inRange(x,-5000,5000));
  if (!s || !point(s.eye) || !point(s.at) || !point(s.player) ||
      !inRange(s.facing,-1000000,1000000) || !inRange(s.aspect,0.15,8) ||
      !inRange(s.fov,0.1,2.5) || !inRange(s.span,0,4000) ||
      typeof s.flying !== 'boolean' || Math.hypot(...s.eye.map((x,i)=>x-s.at[i])) < 0.00001) invalid();
  return {eye:s.eye,at:s.at,player:s.player,facing:s.facing,aspect:s.aspect,fov:s.fov,span:s.span,flying:s.flying};
}
// Canvas exports a baseline JPEG. Keep image segments and discard metadata.
function photoBytes(value) {
  if (typeof value !== 'string' || value.length > BODY_LIMIT || !/^[A-Za-z0-9+/]+=*$/.test(value)) invalid();
  const b = Buffer.from(value,'base64');
  if (b.length < 32 || b.readUInt16BE(0) !== 0xffd8) invalid();
  const pieces = [b.subarray(0,2)];
  let dimensions = false;
  for (let start=2; start+4 <= b.length;) {
    if (b[start] !== 255) invalid();
    const marker=b[start+1], size=b.readUInt16BE(start+2), end=start+2+size;
    if (size<2 || end>b.length) invalid();
    if (marker===0xc0) {
      if (size<11 || dimensions || b[start+4]!==8) invalid();
      const h=b.readUInt16BE(start+5), w=b.readUInt16BE(start+7);
      if (!h || !w || Math.max(w,h)>1280) invalid();
      dimensions=true;
    }
    if (marker===0xda) {
      if (!dimensions) invalid();
      // Only entropy-coded pixels, restart markers and a final EOI may follow.
      for (let i=end;i<b.length;i++) {
        if (b[i]!==255) continue;
        const m=b[++i];
        if (m===0 || (m>=0xd0 && m<=0xd7)) continue;
        if (m===0xd9 && i===b.length-1) return Buffer.concat([...pieces,b.subarray(start)]);
        invalid();
      }
      invalid();
    }
    if ([0xc0,0xc4,0xdb,0xdd].includes(marker)) pieces.push(b.subarray(start,end));
    else if (!(marker>=0xe0 && marker<=0xef) && marker!==0xfe) invalid();
    start=end;
  }
  invalid();
}
function openPhotoReplies(file, now) {
  const db=new DatabaseSync(file);
  fs.chmodSync(file,0o600);
  db.exec('PRAGMA secure_delete=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY, expires INTEGER NOT NULL, shot TEXT NOT NULL, photo BLOB NOT NULL); CREATE INDEX IF NOT EXISTS photo_expiry ON photos(expires);');
  const expire=()=>db.prepare('DELETE FROM photos WHERE expires<=?').run(now());
  expire();
  const timer=setInterval(expire,3600000);
  timer.unref();
  return {
    create(body, tokenFor) {
      const shot=JSON.stringify(cleanShot(body.shot)), photo=photoBytes(body.photo);
      const id=tokenFor(shot,photo), expires=now()+WEEK;
      expire();
      const previous=db.prepare('SELECT expires FROM photos WHERE id=?').get(id);
      if(previous) return {id,expires:previous.expires};
      if(db.prepare('SELECT COUNT(*) AS n FROM photos').get().n>=1200)
        throw new Problem(503,'사진 보관함이 가득 찼어요. 지금은 이미지로 저장해 주세요.');
      db.prepare('INSERT INTO photos VALUES(?,?,?,?)').run(id,expires,shot,photo);
      return {id,expires};
    },
    get(id) {
      const row=db.prepare('SELECT expires,shot,photo FROM photos WHERE id=? AND expires>?').get(id,now());
      if(!row) throw new Problem(404,'기간이 지났거나 찾을 수 없는 사진이에요.');
      return {expires:row.expires,shot:JSON.parse(row.shot),photo:Buffer.from(row.photo).toString('base64')};
    },
    close(){clearInterval(timer);db.close();}
  };
}
module.exports={openPhotoReplies,BODY_LIMIT};
