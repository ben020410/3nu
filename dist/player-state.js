/* Local profile; nickname is display text, never identity. */
(function(root,f){if(typeof module==='object')module.exports=f();else root.PlayerState=f()})(this,()=>{
 const key='3nu.player.v1';
 function nickname(value){return String(value||'').normalize('NFC').trim()}
 function validate(value){const n=nickname(value);if(!n)return '닉네임을 입력해 주세요.';if([...n].length>16)return '닉네임은 16자까지 입력해 주세요.';if(!/^[\p{Script=Hangul}A-Za-z0-9 ]+$/u.test(n))return '한글·영문·숫자로 입력해 주세요.';return ''}
 function load(storage){let p={};try{p=JSON.parse(storage.getItem(key)||'{}')}catch{}return{id:typeof p.id==='string'&&p.id?p.id:(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),nickname:validate(p.nickname)?'':nickname(p.nickname),character:p.character==='baekhak'?'baekhak':'rio'}}
 function save(storage,p){try{storage.setItem(key,JSON.stringify({id:p.id,nickname:p.nickname,character:p.character}))}catch{}}
 return{nickname,validate,load,save};
});
