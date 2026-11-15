/* BUILD39: exterior connections only. G/B3/R5 and approved facades are retained.
 * Terrain is compiled as exclusive patches. Material joints are texture pixels.
 */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Acro39=api;})(this,()=>{
function local(s,x,z){const dx=x-s.origin[0],dz=z-s.origin[1];return [dx*s.u[0]+dz*s.u[1],dx*s.v[0]+dz*s.v[1]];}
function inside(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz)<.00002)return true;if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function prepare(data,nav){const s=nav.library17;if(!nav.acro39||s.revision39)return;s.acro39=nav.acro39;s.revision39=nav.acro39.revision;const c=s.acro39;c.grid=new Map();for(const p of c.patches){const xs=p.outer.map(p=>p[0]),zs=p.outer.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/8);x<=Math.floor(Math.max(...xs)/8);x++)for(let z=Math.floor(Math.min(...zs)/8);z<=Math.floor(Math.max(...zs)/8);z++){const k=x+','+z;if(!c.grid.has(k))c.grid.set(k,[]);c.grid.get(k).push(p);}}
 const pt=(a,d)=>[s.origin[0]+s.u[0]*a+s.v[0]*d,s.origin[1]+s.u[1]*a+s.v[1]*d];
 // Landing rails complete each central stair edge without crossing its mouths.
 for(const q of s.surfaces.filter(q=>q.finish39&&!q.steps&&(q.sources||[]).some(x=>x.startsWith('main-front')))){
  const ps=q.p.map(p=>local(s,...p)),a0=Math.min(...ps.map(p=>p[0])),a1=Math.max(...ps.map(p=>p[0])),d0=Math.min(...ps.map(p=>p[1])),d1=Math.max(...ps.map(p=>p[1]));
  for(const a of [a0,a1]){const A=pt(a,d0),B=pt(a,d1);s.rails.push({id:q.id+'-rail39-'+a,a:A,b:B,y:q.lo});const p=[pt(a-.04,d0),pt(a+.04,d0),pt(a+.04,d1),pt(a-.04,d1)];s.groundSolids.push({id:q.id+'-rail39-'+a,p,lo:q.lo,hi:q.lo+1.1});}
 }
 const borders=[...[36.82,61.18,69.82,94.18].map(a=>[a,[[122,0],[114,.74],[108,.74],[100,1.48],[94,1.48],[88,2.2]]]),...[-3.18,15.18].map(a=>[a,[[112,0],[98,1.6],[88,1.6],[73,4.45]]])];
 for(const [a,nodes]of borders)for(let i=1;i<nodes.length;i++){const[d0,y0]=nodes[i-1],[d1,y1]=nodes[i],p=[pt(a-.12,d0),pt(a+.12,d0),pt(a+.12,d1),pt(a-.12,d1)],from=pt(a,d0),to=pt(a,d1),id='acro39-border-'+a+'-'+i;s.surfaces.push({id,p,lo:y0+.18,hi:y1+.18,from,to,steps:0,owner:'structure'});s.groundSolids.push({id,p,lo:y0-.04,hi:y1+.18,slope35:{from,to,lo:y0+.18,hi:y1+.18}});}
 c.trees=[[28,111,4.8],[28,95,5.4],[101,113,5.2],[101,96,4.6],[-7,84,4.8],[-7,102,4.2]];
 for(const [i,[a,d,h]]of c.trees.entries()){const p=pt(a,d),y=ground(s,...p)-s.base,r=.22;s.groundSolids.push({id:'acro39-tree-'+i,p:[pt(a-r,d-r),pt(a+r,d-r),pt(a+r,d+r),pt(a-r,d+r)],lo:y,hi:y+h});}
}
function ground(s,x,z){if(s?.finish43){const h=(typeof require==='function'?require('./finish43.js'):globalThis.Finish43).height({finish43:s.finish43},x,z);if(h!==null)return h;}if(!s?.acro39)return null;const [a,d]=local(s,x,z);for(const p of s.acro39.grid.get(Math.floor(x/8)+','+Math.floor(z/8))||[])if(inside(x,z,p.outer)&&!(p.holes||[]).some(h=>inside(x,z,h))){const c=p.plane39;return s.base+a*c[0]+d*c[1]+c[2];}return null;}
function material(B,scene,kind){const cached=scene.getMaterialByName('acro39-'+kind);if(cached)return cached;const m=new B.StandardMaterial('acro39-'+kind,scene),t=new B.DynamicTexture('acro39-4m-'+kind,{width:512,height:512},scene,true),ctx=t.getContext();let seed=39;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const rgb=kind==='lawn'?[110,149,89]:kind==='steps'?[192,195,189]:[192,195,190];ctx.fillStyle=`rgb(${rgb})`;ctx.fillRect(0,0,512,512);
 if(kind==='paving'){for(let y=0;y<512;y+=32)for(let x=-64;x<512;x+=64){const dx=x+(y/32%2)*32,k=(rnd()-.5)*7;ctx.fillStyle=`rgb(${rgb.map(v=>v+k)})`;ctx.fillRect(dx+1,y+1,62.8,30.8);}}
 const im=ctx.getImageData(0,0,512,512);for(let i=0;i<im.data.length;i+=4){const n=(rnd()-.5)*(kind==='lawn'?12:7);for(let k=0;k<3;k++)im.data[i+k]+=n;}ctx.putImageData(im,0,0);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=8;m.diffuseTexture=t;m.diffuseColor=B.Color3.White();m.specularColor=new B.Color3(.035,.035,.035);m.backFaceCulling=false;return m;}
function materials(B,scene,mats){mats.acroPaving=material(B,scene,'paving');mats.acroSteps=material(B,scene,'steps');}
function finish({B,scene,spec:s,point,slab,bar,box,shell,add,mats}){
 if(!s.acro39)return;
 // Quiet low stone borders follow the same grades as the stairs, never a covering floor.
 const C=[[122,0],[114,.74],[108,.74],[100,1.48],[94,1.48],[88,2.2]],D=[[112,0],[98,1.6],[88,1.6],[73,4.45]];
 function border(a,nodes){for(let i=1;i<nodes.length;i++){const[d0,y0]=nodes[i-1],[d1,y1]=nodes[i],P=[],I=[],face=ps=>{const n=P.length/3;P.push(...ps.flat());I.push(n,n+1,n+2,n,n+2,n+3);},p=(x,d,y)=>{const q=point(x,d);return[q[0],s.base+y,q[1]];};face([p(a-.12,d0,y0+.18),p(a+.12,d0,y0+.18),p(a+.12,d1,y1+.18),p(a-.12,d1,y1+.18)]);for(const sign of[-1,1])face([p(a+sign*.12,d0,y0-.04),p(a+sign*.12,d0,y0+.18),p(a+sign*.12,d1,y1+.18),p(a+sign*.12,d1,y1-.04)]);shell('acro39-low-stone-border',P,I,mats.acroSteps,'148286730','walkway');}}
 for(const a of[36.82,61.18,69.82,94.18])border(a,C);for(const a of[-3.18,15.18])border(a,D);
 // Recessed front doors stay within the existing glass envelope and canopy.
 for(const a of[60.5,63,65.5,68,70.5])bar('acro39-entry-frame',point(a,69.16),point(a+.07,69.16),2.2,3,.1,mats.frame,'148286730');bar('acro39-entry-transom',point(60.5,69.16),point(70.57,69.16),4.7,.07,.1,mats.frame,'148286730');
 // Shared low-poly foliage geometry: a few specimen trees and open groundcover, off walkways.
 const leafMat=new B.StandardMaterial('acro39-leaves',scene);leafMat.diffuseColor=B.Color3.FromHexString('#789262');leafMat.specularColor=B.Color3.Black();const trunkMat=new B.StandardMaterial('acro39-bark',scene);trunkMat.diffuseColor=B.Color3.FromHexString('#857968');trunkMat.specularColor=B.Color3.Black();const leaf=B.MeshBuilder.CreateIcoSphere('acro39-tree-canopies',{radius:1,subdivisions:2,flat:false},scene),trunk=B.MeshBuilder.CreateCylinder('acro39-trunks',{height:1,diameter:1,tessellation:6},scene),shrubs=B.MeshBuilder.CreateIcoSphere('acro39-groundcover',{radius:1,subdivisions:1,flat:false},scene);leaf.material=shrubs.material=leafMat;trunk.material=trunkMat;const ls=[],ts=[],ss=[],V=(...x)=>new B.Vector3(...x),matrix=(arr,x,y,z,sx,sy,sz)=>arr.push(...B.Matrix.Compose(V(sx,sy,sz),B.Quaternion.Identity(),V(x,y,z)).toArray());
 for(const[a,d,h]of s.acro39.trees){const[x,z]=point(a,d),y=ground(s,x,z);matrix(ts,x,y+h*.44,z,.25,h*.88,.25);for(let j=0;j<3;j++){const k=j*2.1;matrix(ls,x+Math.cos(k)*.65,y+h*.76+j*.25,z+Math.sin(k)*.65,h*.28,h*.30,h*.27);}}
 for(const[a,d,count]of[[64,116,7],[67,104,6],[64,93,6],[25,105,9],[31,91,5],[103,107,8],[99,89,6],[-7,93,5]])for(let j=0;j<count;j++){const aa=a+Math.sin(j*2.4)*1.1,dd=d+Math.cos(j*2.4)*1.7,[x,z]=point(aa,dd),y=ground(s,x,z),h=.3+(j%3)*.08;matrix(ss,x,y+h*.7,z,h*1.5,h,h*1.35);}
 for(const[m,a]of[[leaf,ls],[trunk,ts],[shrubs,ss]]){m.thinInstanceSetBuffer('matrix',new Float32Array(a),16,true);m.isPickable=false;m.receiveShadows=true;m.freezeWorldMatrix();}
}
return{prepare,ground,local,materials,material,finish};});
