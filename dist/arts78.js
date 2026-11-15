/* Architectural reconstruction: dimensions and vegetation placement are model estimates. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Arts78=api;})(this,()=>{
const ID='439693758',D=88.65926319928778;
const C={"main":[[51.187,314.258],[81.849,346.956],[121.799,334.017],[117.8,321.65],[86.1,332.0],[60.7,305.3]],"v":{"R0":[60.7,14.5,305.3],"R1":[73.4,16.4,318.65],"R2":[86.1,21.0,332],"R3":[102,20.2,326.82],"R4":[117.8,16,321.65],"F0":[68,0.25,294],"F1":[84,7.6,302],"F2":[99,16.2,305],"F3":[108,8.8,306],"F4":[118.4,13.8,310],"G0":[68,0,294],"G1":[84,2,302],"G2":[99,4,305],"G3":[108,5.5,306],"G4":[118.4,6,310],"G_R0":[60.7,0,305.3],"G_R4":[117.8,6,321.65]},"roof":[["R0","R1","F1"],["R1","F2","F1"],["R1","R2","F2"],["R2","R3","F2"],["R3","F3","F2"],["R3","F4","F3"],["R3","R4","F4"]],"glass":[["R0","F0","F1"],["F1","F2","G2"],["F1","G2","G1"],["F2","F3","G3"],["F2","G3","G2"],["F3","F4","G4"],["F3","G4","G3"],["R0","G_R0","F0"],["F0","G1","F1"],["R4","G4","F4"],["R4","G_R4","G4"]],"mask":[[52,237],[88,239],[125,267],[136,298],[118,310],[94,303],[68,292],[57,268]],"windows":[[0.12,0.42,0.56,0.88],[0.12,0.42,0.56,0.88],[0.42,0.56,0.88],[0.12,0.25,0.76,0.89]]};

const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)},inside=(x,z,p)=>{let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
function distance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
const atrium=['G_R0','G0','G1','G2','G3','G4','G_R4'].map(k=>[C.v[k][0],C.v[k][2]]);
let paths=[],trees=[],oldTrees=[];
function roadClear(x,z){return paths.reduce((v,r)=>Math.min(v,distance(x,z,r.a,r.b)-r.w),Infinity);}
function prepare(data,nav){if(nav.arts78)return;paths=[];for(const r of nav.roads)for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i];if(Math.max(a[0],b[0])>35&&Math.min(a[0],b[0])<145&&Math.max(a[1],b[1])>220&&Math.min(a[1],b[1])<360)paths.push({a,b,w:r.width/2});}
 const b=data.buildings.find(b=>b.id===ID);b.p=[...C.main.slice(0,4),...['G4','G3','G2','G1','G0','G_R0'].map(k=>[C.v[k][0],C.v[k][2]])];b.collisionPolygons=[C.main,atrium];b.h=21;b.levels=4;b.arts78=true;
 oldTrees=(nav.trees||[]).filter(t=>t[0]>35&&t[0]<145&&t[1]>220&&t[1]<350);let seed=740109,rand=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);trees=[];
 for(let n=0;n<4000&&trees.length<40;n++){const x=51+rand()*84,z=237+rand()*70,h=5.6+rand()*3.5,r=1.8+rand()*1.1,pine=rand()>.72;
 if(!inside(x,z,C.mask)||roadClear(x,z)<r+1.6||inside(x,z,atrium)||Math.hypot(x-64.6,z-300.2)<7||data.buildings.some(b=>inside(x,z,b.p)||b.p.some((a,i)=>distance(x,z,a,b.p[(i+1)%b.p.length])<r+1))||trees.some(t=>Math.hypot(x-t.x,z-t.z)<r+t.r*.6)||oldTrees.some(t=>Math.hypot(x-t[0],z-t[1])<5.5))continue;
 trees.push({x,z,h,r,pine});}
 // Reuse an existing outside junction and add only the entrance's short approach.
 const entry=[63.2,299.1,D],near=nav.points.map((p,i)=>[Math.hypot(p[0]-56.456,p[1]-297.581),i]).sort((a,b)=>a[0]-b[0])[0][1];
 const anchor=nav.points.length;nav.points.push(entry);nav.edges.push([near,anchor]);nav.anchors[ID]=anchor;
 // Old speculative path segments inside the new atrium cannot be advertised as through-routes.
 const removed=[];nav.edges=nav.edges.filter(e=>{const a=nav.points[e[0]],b=nav.points[e[1]],hit=[.2,.5,.8].some(t=>inside(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,atrium));if(hit)removed.push(e);return!hit;});
 nav.arts78={trees,anchor,near,removed,originalAnchor:6469,polygons:[C.main,atrium]};
}
function offset(x,z){if(x<48||x>140||z<232||z>313||!inside(x,z,C.mask))return 0;const edge=C.mask.reduce((m,a,i)=>Math.min(m,distance(x,z,a,C.mask[(i+1)%C.mask.length])),Infinity),clear=roadClear(x,z);const bump=3.1*Math.exp(-(((x-101)/24)**2+((z-275)/26)**2));return bump*smooth(edge/8)*smooth((clear-3)/7);}

// One piecewise-linear 2m triangulated field is used for rendering and walking.
function height(x,z,y){const gx=Math.floor(x/2)*2,gz=Math.floor(z/2)*2,u=(x-gx)/2,v=(z-gz)/2,a=offset(gx,gz),b=offset(gx+2,gz),c=offset(gx,gz+2),d=offset(gx+2,gz+2);return y+(u+v<=1?a+u*(b-a)+v*(c-a):d+(1-u)*(c-d)+(1-v)*(b-d));}
function partition(pos,indices,kind){if(!pos.some((v,i)=>i%3===0&&v>44&&v<146&&pos[i+2]>228&&pos[i+2]<316))return{pos,indices};const out=[],ix=[];
 const clip=(p,a,b)=>{const result=[],dist=v=>(b[0]-a[0])*(v[2]-a[1])-(b[1]-a[1])*(v[0]-a[0]);for(let i=0;i<p.length;i++){const A=p[i],B=p[(i+1)%p.length],da=dist(A),db=dist(B);if(da>=-1e-8)result.push(A);if(da*db< -1e-14){const t=da/(da-db);result.push(A.map((v,j)=>v+t*(B[j]-v)));}}return result;};
 function put(p){if(p.length<3)return;const n=out.length/3;for(const q of p)out.push(q[0],height(q[0],q[2],q[1]),q[2]);for(let i=1;i<p.length-1;i++)ix.push(n,n+i,n+i+1);}
 for(let i=0;i<indices.length;i+=3){const t=Array.from(indices.slice(i,i+3),j=>Array.from(pos.slice(j*3,j*3+3))),minx=Math.min(...t.map(p=>p[0])),maxx=Math.max(...t.map(p=>p[0])),minz=Math.min(...t.map(p=>p[2])),maxz=Math.max(...t.map(p=>p[2]));if(minx>142||maxx<46||minz>316||maxz<230){put(t);continue;}
 // Split the entire intersecting triangle; the field is zero outside its local footprint.
 for(let x=Math.floor(minx/2)*2;x<maxx+1e-7;x+=2)for(let z=Math.floor(minz/2)*2;z<maxz+1e-7;z+=2)for(const cell of[[[x,z],[x+2,z],[x,z+2]],[[x+2,z+2],[x,z+2],[x+2,z]]]){let p=t;for(let j=0;j<3&&p.length>=3;j++)p=clip(p,cell[j],cell[(j+1)%3]);put(p);}}
 return{pos:out,indices:ix};}
function treeHit(x,z,r=0){return[C.main,atrium].some(p=>inside(x,z,p)||p.some((a,i)=>distance(x,z,a,p[(i+1)%p.length])<r+.5));}
function blocked(x,z,r){return trees.some(t=>Math.hypot(x-t.x,z-t.z)<r+.22);}
function build(B,scene,b,ground){if(b.id!==ID)return false;const V=(x,y,z)=>new B.Vector3(x,y,z),palette={terra:'#c77b53',glass:'#527e8b',frost:'#d8e1df',frame:'#e3e5df',mullion:'#3d555a',roof:'#9fa89f',stone:'#9a9e92',shadow:'#354b50',wood:'#746c55',leaf:'#658a51',pine:'#496f55'};
 const mats={},groups={};function mat(k){if(mats[k])return mats[k];const m=new B.StandardMaterial('arts78-'+k,scene);m.diffuseColor=B.Color3.FromHexString(palette[k]);m.specularColor=k==='glass'?new B.Color3(.25,.31,.32):new B.Color3(.04,.04,.04);m.metadata={facade53:true};
 if(['terra','frost','stone'].includes(k)){const tex=new B.DynamicTexture('arts78-finish-'+k,{width:512,height:512},scene,true),ctx=tex.getContext();ctx.fillStyle=palette[k];ctx.fillRect(0,0,512,512);const rows=k==='terra'?16:k==='frost'?16:8,cols=k==='stone'?6:k==='terra'?4:3;for(let y=0;y<rows;y++)for(let x=-1;x<=cols;x++){const w=512/cols,h=512/rows,xx=x*w+(k==='stone'&&y%2?w/2:0);ctx.fillStyle=(x+y)%3?'rgba(255,255,255,.015)':'rgba(20,30,25,.015)';ctx.fillRect(xx,y*h,w,h);ctx.strokeStyle=k==='terra'?'rgba(80,49,35,.23)':'rgba(80,92,87,.14)';ctx.lineWidth=k==='frost'?.8:1;ctx.strokeRect(xx+.5,y*h+.5,w-1,h-1);}tex.update();tex.anisotropicFilteringLevel=4;tex.wrapU=tex.wrapV=B.Texture.WRAP_ADDRESSMODE;m.diffuseTexture=tex;m.diffuseColor=B.Color3.White();}
 return mats[k]=m;}
 function add(k,p,ix,uv){const g=groups[k]||(groups[k]={p:[],i:[],uv:[]}),n=g.p.length/3;g.p.push(...p);g.i.push(...ix.map(i=>i+n));g.uv.push(...(uv||p.flatMap((v,i)=>i%3===0?[v/4,p[i+2]/4]:[])));}
 function box(k,x,y,z,w,h,d,angle=0){const vd=B.VertexData.CreateBox({width:w,height:h,depth:d}),m=B.Matrix.RotationY(angle).multiply(B.Matrix.Translation(x,y,z));add(k,vd.positions.flatMap((v,i)=>i%3===0?B.Vector3.TransformCoordinates(V(...vd.positions.slice(i,i+3)),m).asArray():[]),vd.indices,vd.uvs);}
 function beam(k,a,b,w){const va=V(...a),vb=V(...b),vd=B.VertexData.CreateBox({width:w,height:vb.subtract(va).length(),depth:w}),q=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,vb.subtract(va).normalize(),new B.Quaternion()),m=B.Matrix.Compose(V(1,1,1),q,va.add(vb).scale(.5));add(k,vd.positions.flatMap((v,i)=>i%3===0?B.Vector3.TransformCoordinates(V(...vd.positions.slice(i,i+3)),m).asArray():[]),vd.indices,vd.uvs);}
 function quad(k,a,b,c,d,uv){const pts=[a,b,c,d],normal=B.Vector3.Cross(V(...b).subtract(V(...a)),V(...c).subtract(V(...a))),center=pts.reduce((s,p)=>s.add(V(...p)),V(0,0,0)).scale(.25);const reverse=normal.x*(center.x-90)+normal.z*(center.z-320)<0;add(k,pts.flat(),reverse?[0,1,2,0,2,3]:[0,2,1,0,3,2],uv||[0,0,1,0,1,1,0,1]);}
 function solid(poly,lo,hi,k){const m=B.MeshBuilder.ExtrudePolygon('building-'+ID+'-arts78-'+k,{shape:(poly.reduce((s,a,i)=>s+a[0]*poly[(i+1)%poly.length][1]-poly[(i+1)%poly.length][0]*a[1],0)<0?poly.slice().reverse():poly).map(p=>V(p[0],0,p[1])),depth:hi-lo},scene,earcut);m.position.y=hi;m.material=mat(k);m.metadata={buildingId:ID,labelSurfaceId49:ID,solid15:true,exterior78:true};m.freezeWorldMatrix();}
 const p=C.main,sg=p.reduce((s,a,i)=>s+a[0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*a[1],0)>0?1:-1;
 function edge(i){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),point=(t,o)=>[a[0]+dx*t+sg*dz/len*o,a[1]+dz*t-sg*dx/len*o];const bar=(k,t,y,w,h,dep=.18,o=.13)=>{const q=point(t,o);box(k,q[0],D+y+h/2,q[1],w,h,dep,angle);};
 function face(k,t,y,w,h,o=.045){const q=point(t-w/len/2,o),r=point(t+w/len/2,o);quad(k,[q[0],D+y,q[1]],[r[0],D+y,r[1]],[r[0],D+y+h,r[1]],[q[0],D+y+h,q[1]],[0,0,w/6,0,w/6,h/4,0,h/4]);}
 function window(t,y,w,h,projection=0){face('shadow',t,y-.09,w+.18,h+.18,.05+projection);face('glass',t,y,w,h,.075+projection);for(const s of[-1,1])bar('mullion',t+s*(w+.08)/len/2,y,.08,h,.24,.17+projection);bar('mullion',t,y-.08,w+.16,.08,.24,.17+projection);bar('frame',t,y+h,w+.2,.09,.29,.18+projection);if(w>2)for(let j=1;j<Math.ceil(w/2.3);j++)bar('mullion',t-w/len/2+j*w/Math.ceil(w/2.3)/len,y,.07,h,.14,.13+projection);}
 return{len,bar,face,window};}
 solid(p,D-1,D+19.2,'terra');solid(p,D+19.2,D+19.35,'roof');
 for(let i=0;i<p.length;i++){const e=edge(i);e.face('terra',.5,0,e.len,19.2,.02);e.bar('terra',.5,19.3,e.len,.45,.24,.01);e.bar('frame',.5,19.75,e.len,.09,.35,.03);if(i<2){e.window(.575,10.1,e.len*.75,3,.65);e.bar('terra',.575,9.55,e.len*.77,.55,.8,.35);e.window(.425,14.7,e.len*.75,2.9);for(const y of[.9,5.4])for(let j=0;j<9;j++)if(j%4!==1)e.window((j+.7)/10,y,.9,2.6);}else if(i===5){for(let row=0;row<4;row++)for(const t of C.windows[row])e.window(t,.9+row*4.4,.85,2.6);}else if(i===2){for(let row=0;row<4;row++)for(const t of[.2,.43,.7])e.window(t,.9+row*4.4,.85,2.6);}else{e.window(.5,15.3,e.len*.8,2);}}
 // Joined roof and glazing share one vertex table. All outward faces use geometric normals.
 const verts=Object.fromEntries(Object.entries(C.v).map(([k,v])=>[k,[v[0],D+v[1],v[2]]]));
 function triangle(k,names,roof=false){let pts=names.map(n=>verts[n]),a=V(...pts[0]),normal=B.Vector3.Cross(V(...pts[1]).subtract(a),V(...pts[2]).subtract(a)),c=pts.reduce((s,p)=>s.add(V(...p)),V(0,0,0)).scale(1/3);if(roof?normal.y>0:normal.x*(c.x-91)+normal.z*(c.z-321)>0)pts=[pts[0],pts[2],pts[1]];add(k,pts.flat(),[0,1,2],pts.flatMap(v=>[v[0]/5,(roof?v[2]:v[1])/5]));if(roof){const under=pts.map(v=>[v[0],v[1]-.18,v[2]]);add('frost',under.flat(),[0,2,1],under.flatMap(v=>[v[0]/5,v[2]/5]));for(let i=0;i<3;i++)quad('frame',pts[i],pts[(i+1)%3],under[(i+1)%3],under[i]);}}
 C.roof.forEach(f=>triangle('frost',f,true));C.glass.filter(f=>!f.includes('G_R0')).forEach(f=>triangle('glass',f));

 // Close the clerestory where the folded roof rises above the main wing parapet.
 for(const pair of[['R1','R2'],['R2','R3'],['R3','R4']]){let a=verts[pair[0]].slice(),b=verts[pair[1]].slice(),y=D+19.2;if(a[1]<=y&&b[1]<=y)continue;if(a[1]<y){const t=(y-a[1])/(b[1]-a[1]);a=a.map((v,j)=>v+t*(b[j]-v));}if(b[1]<y){const t=(y-b[1])/(a[1]-b[1]);b=b.map((v,j)=>v+t*(a[j]-v));}quad('glass',[a[0],y,a[2]],[b[0],y,b[2]],b,a);}
 // Southwest triangular entry facade: actual opening in the glazing, recessed door behind it.
 const a=verts.G_R0,bv=verts.F0,dx=bv[0]-a[0],dz=bv[2]-a[2],len=Math.hypot(dx,dz),pt=(t,h,o=0)=>[a[0]+dx*t+dz/len*o,D+h,a[2]+dz*t-dx/len*o],top=t=>14.5*(1-t)+.25*t,l=.42,r=.62;
 quad('glass',pt(0,0),pt(l,0),pt(l,top(l)),pt(0,14.5));quad('glass',pt(l,3.2),pt(r,3.2),pt(r,top(r)),pt(l,top(l)));quad('glass',pt(r,0),pt(1,0),pt(1,.25),pt(r,top(r)));
 quad('shadow',pt(l,0,-.3),pt(r,0,-.3),pt(r,3.2,-.3),pt(l,3.2,-.3));quad('glass',pt(l+.014,.08,-.28),pt(r-.014,.08,-.28),pt(r-.014,3.07,-.28),pt(l+.014,3.07,-.28));for(const t of[l,(l+r)/2,r])beam('mullion',pt(t,0),pt(t,3.2),.085);beam('frame',pt(l,3.2),pt(r,3.2),.13);


 // Reveal surfaces seal the gap around the inset doors when viewed obliquely.
 for(const t of[l,r])quad('mullion',pt(t,0),pt(t,0,-.32),pt(t,3.2,-.32),pt(t,3.2));quad('mullion',pt(l,3.2),pt(r,3.2),pt(r,3.2,-.32),pt(l,3.2,-.32));quad('stone',pt(l,0),pt(r,0),pt(r,0,-.32),pt(l,0,-.32));
 // Vertical/horizontal divisions on the entry triangle stop at the recessed door opening.
 for(let t=.12;t<.99;t+=.16){const low=t>l&&t<r?3.2:0;if(top(t)>low+.1)beam('mullion',pt(t,low,.04),pt(t,top(t),.04),.075);}
 for(let y=3.2;y<14.5;y+=3.2){const end=(14.5-y)/14.25;beam('mullion',pt(0,y,.04),pt(end,y,.04),.075);}
 // Fine mullions clipped independently inside each triangular plane.
 for(const f of C.glass.filter(f=>!f.includes('G_R0'))){const pts=f.map(n=>verts[n]);for(const axis of[0,1]){const lo=Math.min(...pts.map(p=>p[axis])),hi=Math.max(...pts.map(p=>p[axis])),pitch=axis===0?2.5:3.4;for(let value=Math.ceil(lo/pitch)*pitch;value<hi-.1;value+=pitch){const hits=[];for(let i=0;i<3;i++){const a=pts[i],b=pts[(i+1)%3];if((a[axis]<value)!==(b[axis]<value)){const t=(value-a[axis])/(b[axis]-a[axis]);hits.push(a.map((v,j)=>v+t*(b[j]-v)));}}if(hits.length===2)beam('mullion',hits[0],hits[1],.065);}}}
 const edges=new Set();for(const face of[...C.roof,...C.glass])for(let i=0;i<3;i++){const a=face[i],b=face[(i+1)%3],key=[a,b].sort().join(':');if(edges.has(key))continue;edges.add(key);beam('frame',verts[a],verts[b],a.startsWith('G')&&b.startsWith('G')?.14:.25);}
 // Sloping foundation closes glazing to current grade; muted stone and irregular stones at the east end.
 const groundNames=['G0','G1','G2','G3','G4','G_R4'];for(let i=1;i<groundNames.length;i++){const a=verts[groundNames[i-1]],b=verts[groundNames[i]],aa=[a[0],D-.15,a[2]],bb=[b[0],D-.15,b[2]];quad('stone',aa,bb,b,a,[0,0,Math.hypot(b[0]-a[0],b[2]-a[2])/4,0,Math.hypot(b[0]-a[0],b[2]-a[2])/4,(b[1]-D)/3,0,(a[1]-D)/3]);}
 // Simple interior floor silhouettes; no new public interior route.
 solid(atrium,D-.08,D+.02,'stone');

 // A few low irregular foundation stones articulate the actual wall foot, away from the east path.
 for(let i=0;i<16;i++){const t=i/15,x=85+33*t,z=299.5+8.5*t;if(roadClear(x,z)<2)continue;const vd=B.VertexData.CreateSphere({segments:4,diameter:1}),sx=1.25+.55*Math.sin(i*2.1),sy=.65+.25*Math.cos(i),sz=.8+.2*Math.sin(i),m=B.Matrix.Compose(V(sx,sy,sz),B.Quaternion.RotationYawPitchRoll(i*.7,.2,.15),V(x,ground(x,z)+sy*.32,z));add('stone',vd.positions.flatMap((v,j)=>j%3===0?B.Vector3.TransformCoordinates(V(...vd.positions.slice(j,j+3)),m).asArray():[]),vd.indices,vd.uvs);}
 for(const[k,g]of Object.entries(groups)){const m=new B.Mesh('building-'+ID+'-detail-arts78-'+k,scene),v=new B.VertexData(),n=[];B.VertexData.ComputeNormals(g.p,g.i,n);v.positions=g.p;v.indices=g.i;v.normals=n;v.uvs=g.uv;v.applyToMesh(m);m.material=mat(k);m.metadata={buildingId:ID,labelSurfaceId49:ID,solid15:true,exterior78:true};m.freezeWorldMatrix();}
 b.base=D;b.top=D+21;b.facade53=true;b.h=21;b.levels=4;
 // A small set of shared geometries gives trees branching crowns, instead of a uniform sphere grid.
 const buffers={trunk:[],leaf:[],pine:[]},colors={leaf:[],pine:[]};function instance(k,x,y,z,sx,sy,sz,yaw=0){buffers[k].push(...B.Matrix.Compose(V(sx,sy,sz),B.Quaternion.RotationYawPitchRoll(yaw,0,0),V(x,y,z)).toArray());if(colors[k])colors[k].push(.88+.08*Math.sin(x),.94,.84,1);}
 for(const t of trees){const y=ground(t.x,t.z);instance('trunk',t.x,y+t.h*.42,t.z,.34,t.h*.84,.34);if(t.pine){for(let i=0;i<3;i++)instance('pine',t.x,y+t.h*(.48+i*.19),t.z,t.r*(1-i*.18),t.h*.28,t.r*(1-i*.18));}else{for(let i=0;i<5;i++){const a=i*2.4;instance('leaf',t.x+Math.cos(a)*t.r*.48,y+t.h*(.66+(i%2)*.13),t.z+Math.sin(a)*t.r*.48,t.r*.8,t.r*(.9+i%2*.2),t.r*.8,a);}}}
 for(let i=0;i<trees.length;i+=2){const t=trees[i],x=t.x+1.7,z=t.z-.7;if(roadClear(x,z)>3&&!treeHit(x,z,1))for(let j=0;j<3;j++)instance('leaf',x+j*.65,ground(x+j*.65,z)+.45,z,.75,.55,.7);}
 for(const k of Object.keys(buffers)){const m=k==='trunk'?B.MeshBuilder.CreateCylinder('arts78-tree-stems',{height:1,diameter:1,tessellation:6},scene):k==='pine'?B.MeshBuilder.CreateCylinder('arts78-pine-crowns',{height:1,diameterTop:.16,diameterBottom:2,tessellation:9},scene):B.MeshBuilder.CreateIcoSphere('arts78-leaf-crowns',{radius:1,subdivisions:2,flat:false},scene);m.material=mat(k==='trunk'?'wood':k);m.isPickable=false;m.thinInstanceSetBuffer('matrix',new Float32Array(buffers[k]),16,true);if(colors[k])m.thinInstanceSetBuffer('color',new Float32Array(colors[k]),4,true);}
 scene.metadata={...scene.metadata,arts78:{trees:trees.length,buildingId:ID,roofFaces:C.roof.length,glassFaces:C.glass.length,drawGroups:Object.keys(groups).length}};return true;
}
function routes(world,nav){const ids=['168003059','168003064'],out=ids.map(id=>({zone:'74동 주변',road:id,coords:nav.roads.find(r=>r.id===id).p.map(p=>p.slice(0,2))}));out[0].coords=out[0].coords.slice(0,-1);const a=nav.arts78;out.push({zone:'74동 현관',road:'entry',coords:[world.points[a.near].slice(0,2),world.points[a.anchor].slice(0,2)]});for(const r of out){r.startFeet=world.floorAt(...r.coords[0]);r.endFeet=world.floorAt(...r.coords.at(-1));}return out;}
return{prepare,build,height,partition,treeHit,blocked,routes,config:C,datum:D};});
