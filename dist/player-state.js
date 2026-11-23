/* Local profile; nickname is display text, never identity. */
(function(root,f){if(typeof module==='object')module.exports=f();else root.PlayerState=f()})(this,()=>{
 const key='3nu.player.v1';
 function nickname(value){return String(value||'').normalize('NFC').trim()}
 function validate(value){const n=nickname(value);if(!n)return '닉네임을 입력해 주세요.';if([...n].length>16)return '닉네임은 16자까지 입력해 주세요.';if(!/^[\p{Script=Hangul}A-Za-z0-9 ]+$/u.test(n))return '한글·영문·숫자로 입력해 주세요.';return ''}
 function saved(storage){let p={};try{p=JSON.parse(storage.getItem(key)||'{}')}catch{}return p&&typeof p==='object'&&!Array.isArray(p)?p:{}}
 function load(storage){const p=saved(storage);if(Object.hasOwn(p,'nickname')){delete p.nickname;try{storage.setItem(key,JSON.stringify(p))}catch{}}return{id:typeof p.id==='string'&&p.id?p.id:(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),nickname:'',character:['rio','baekhak','cat'].includes(p.character)?p.character:'rio'}}
 function save(storage,p){const previous=saved(storage);delete previous.nickname;try{storage.setItem(key,JSON.stringify({...previous,id:p.id,character:p.character}))}catch{}}
 return{nickname,validate,load,save};
});
