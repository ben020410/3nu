/* One default/migration source. Stored valid choices survive every load. */
window.NUSettings=(()=>{
 const defaults=Object.freeze({speed:1,cameraStep:4,camera:6+4*59/9,distance:3});
 const keys={speed:'gwanak.speed',camera:'3nu.camera',distance:'3nu.viewDistance'};
 function normalize(k,v){const n=Number(v);if(v===null||v===''||!Number.isFinite(n))return defaults[k];if(k==='speed')return [.5,1,1.5,2,2.5,3].includes(n)?n:defaults.speed;if(k==='camera')return n>=6&&n<=65?6+Math.round((n-6)/59*9)*59/9:defaults.camera;return Number.isInteger(n)&&n>=1&&n<=5?n:defaults.distance;}
 function read(k){try{return normalize(k,localStorage.getItem(keys[k]));}catch{return defaults[k];}}
 function reset(){for(const k of Object.keys(keys))try{localStorage.setItem(keys[k],defaults[k]);}catch{}window.dispatchEvent(new Event('campus-settings-reset'));}
 return{defaults,read,normalize,reset};
})();
