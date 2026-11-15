/* Ballistic ground jump, analytic substeps; rendering-independent and repeat-key safe. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.JumpCore=factory()})(this,()=>{
const gravity=20,launch=7.2;
function create(){return{velocity:0,airborne:false}}
function start(s){if(s.airborne)return false;s.velocity=launch;s.airborne=true;return true}
function reset(s){s.velocity=0;s.airborne=false}
function tick(s,y,dt,floor,ceiling=Infinity){for(let t=0;t<dt;){const h=Math.min(1/120,dt-t);t+=h;const next=y+s.velocity*h-gravity*h*h/2;s.velocity-=gravity*h;y=next;if(y+.84>ceiling){y=ceiling-.84;s.velocity=Math.min(0,s.velocity)}if(y<=floor+.95){y=floor+.95;reset(s);}else s.airborne=true;}return y}
return{create,start,reset,tick,gravity,launch};});
