const {fs,R,D,N,world}=require('./junction46-context.cjs'),P=require(R+'/pungsan48.js'),C=JSON.parse(fs.readFileSync(R+'/data/pungsan48.json'));P.prepare(D,N,C);const w=require(R+'/walk-core.js').create(D,N),f=C.front,u=[-f[1],f[0]],pt=(a,d)=>[302+u[0]*a+f[0]*d,-66+u[1]*a+f[1]*d];
const routes=[{zone:'BUILD48',road:'outer approach / perimeter',coords:[[350,-118],[337,-113],[328,-104]]}];
function route(name,p){routes.push({zone:'BUILD48',road:name,coords:p.map(q=>pt(...q))});}
route('entry to stage apron',[[26,-2],[24,5],[18,8],[11,9],[0,11]]);
for(const theta of [-.75,0,.75])route('radial aisle '+theta,Array.from({length:49},(_,i)=>{const r=11+i*.49;return [Math.sin(theta)*r,5+Math.cos(theta)*r]}));

for(const side of [-1,1])route('end access '+side,Array.from({length:45},(_,i)=>{const t=side*(1.18-i*.01);return [Math.sin(t)*34.4,5+Math.cos(t)*34.4]}));
route('apron to lawn east',[[25,-3],[31,-3],[40,-2],[52,3]]);
routes.push({zone:'BUILD48',road:'existing road / rear apron / stage',coords:[[279,-34],[294,-46],[315,-40],[329,-48],[330,-57],pt(24,5),pt(11,9),pt(0,11)]});
for(const theta of [-1.1,1.1])route('tier width junction '+theta,Array.from({length:49},(_,i)=>{const r=11+i*.49;return [Math.sin(theta)*r,5+Math.cos(theta)*r]}));
for(const t of C.trees.filter(q=>['T03','T16'].includes(q.id)))routes.push({zone:'BUILD48',road:'tree trunk clearance '+t.id,coords:Array.from({length:25},(_,i)=>[t.x+1.6*Math.cos(i*Math.PI/12),t.z+1.6*Math.sin(i*Math.PI/12)])});
const results=[];for(const r of routes){r.startFeet=w.floorAt(...r.coords[0]);r.endFeet=w.floorAt(...r.coords.at(-1));for(const reverse of [false,true]){const path=reverse?r.coords.slice().reverse():r.coords;let st={x:path[0][0],z:path[0][1],y:w.floorAt(...path[0])+.95},passed=true,maxStep=0;for(const p of path.slice(1)){let count=0;while(Math.hypot(p[0]-st.x,p[1]-st.z)>.035&&count++<5000){const dx=p[0]-st.x,dz=p[1]-st.z,len=Math.hypot(dx,dz),am=Math.min(.065,len),n=w.move(st,dx/len*am,dz/len*am);maxStep=Math.max(maxStep,Math.abs(n.y-st.y));if(n.distance<am*.1){passed=false;break;}st=n;}if(!passed||count>=5000){passed=false;break;}}results.push({route:r.road,reverse,passed,maxStep,end:st});}}
const out=require('path').join(__dirname,'../reports/build48');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/qa48-routes.json',JSON.stringify(routes));fs.writeFileSync(out+'/movement48.json',JSON.stringify(results,null,2));console.log(results);console.log({passed:results.filter(r=>r.passed).length,total:results.length});
