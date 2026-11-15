/* BUILD21. Photo 1/3 structure; user satellite 4/5 footprint. All heights estimated. */
(function(root){const api={prepare(data,nav){const b=data.buildings.find(b=>b.id==='167607356'),c=nav.student21,s=nav.library17,pt=(x,z)=>[c.origin[0]+c.u[0]*x+c.v[0]*z,c.origin[1]+c.u[1]*x+c.v[1]*z],local=p=>[(p[0]-c.origin[0])*c.u[0]+(p[1]-c.origin[1])*c.u[1],(p[0]-c.origin[0])*c.v[0]+(p[1]-c.origin[1])*c.v[1]],rect=(x,z,w,d)=>[pt(28-x,17-z),pt(28-x-w,17-z),pt(28-x-w,17-z-d),pt(28-x,17-z-d)];
function clip(p,k,limit,above){let out=[];for(let i=0;i<p.length;i++){let a=p[i],b=p[(i+1)%p.length],av=local(a)[k],bv=local(b)[k],ia=above?av>=limit:av<=limit,ib=above?bv>=limit:bv<=limit;if(ia)out.push(a);if(ia!==ib){let t=(limit-av)/(bv-av);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out;}
const vol=(id,p,lo,hi,material='concrete')=>{if(p.length>2)s.volumes.push({id:'student21-'+id,p,lo,hi,material,facilityId:b.id});},box=(id,x,z,w,d,lo,hi,m)=>vol(id,rect(x,z,w,d),lo,hi,m),surf=(id,p,h)=>s.surfaces.push({id:'student21-'+id,p,lo:h,hi:h,facilityId:b.id,steps:0});
const north=clip(b.p,0,0,false),south=clip(b.p,0,0,true).map(p=>{const q=local(p);return q[0]>26?pt(28,q[1]):p;});vol('north',north,0,16.3);vol('south-upper',south,8,17.8);vol('south-recess',clip(south,0,22,false),0,8,'glass');vol('roof-north',north,16.3,16.55,'stone');vol('roof-south',south,17.8,18.1,'stone');
for(const z of[1,13,29,37])box('column',.3,z,.75,.75,0,8);box('end-core',0,30,5,8,0,8,'glass');
for(const z of[1,13,25]){box('projecting-bay',-1.4,z,1.5,10,8,9.1);box('bay-glass',-1.48,z+.35,.1,9.3,8.8,10.9,'glass');}
// Recessed landing and entrance stair share collision and rendered treads.
surf('entry-landing',rect(-1,15,6,13),4.3);box('landing-slab',-1,15,6,13,3.9,4.3,'stone');
function stairs(id,x,z,w,d,from,to){const n=Math.ceil(Math.abs(to-from)/.17);for(let i=0;i<n;i++){const y=from+(to-from)*(i+1)/n,p=rect(x,z+d*i/n,w,d/n);surf(id+'-'+i,p,y);vol(id+'-riser-'+i,p,-.15,y,'stone');}}
// Central stair rises across courtyard toward covered entry, not to roof.
const count=26;for(let i=0;i<count;i++){const x=-17+i*16/count,y=4.3*(i+1)/count,p=rect(x,16,16/count,11);surf('central-stair-'+i,p,y);vol('central-riser-'+i,p,-.15,y,'stone');}
const oldrect=(x,z,w,d)=>[pt(x,z),pt(x+w,z),pt(x+w,z+d),pt(x,z+d)];for(let i=0;i<26;i++){const p=oldrect(19,-23-(i+1)*16/26,8,16/26),y=4.3*(i+1)/26;surf('external-stair-'+i,p,y);vol('external-riser-'+i,p,-.15,y,'stone');}surf('external-upper',oldrect(7,-44,20,5),4.3);vol('external-platform',oldrect(7,-44,20,5),-.15,4.3,'stone');
const annex=data.buildings.find(q=>q.id==='vw/298');if(annex){annex.library17=true;vol('low-annex',annex.p,0,4.3,'stone');surf('low-annex-roof',annex.p,4.3);}
b.library17=true;b.h=18.1;b.student21=true;nav.student21.footprint=b.p;nav.student21.south=south;nav.student21.north=north;
}};if(typeof module==='object')module.exports=api;else root.Student21=api;})(this);
function buildStudent21(B,scene,c){const mats={},groups=new Map(),pt=(a,d)=>[c.origin[0]+c.u[0]*a+c.v[0]*d,c.origin[1]+c.u[1]*a+c.v[1]*d],V=(x,y,z)=>new B.Vector3(x,y,z);for(const [n,col]of Object.entries({ivory:'#e1e2d8',glass:'#526f77',frame:'#465250',wood:'#a87946',roof:'#656c63',paving:'#bcb9ae'})){const m=new B.StandardMaterial('student21-'+n,scene);m.diffuseColor=B.Color3.FromHexString(col);m.specularColor=new B.Color3(.05,.05,.05);mats[n]=m;}
function box(name,a,d,w,depth,y,h,material){const p=pt(28-a-w/2,17-d-depth/2),m=B.MeshBuilder.CreateBox(name,{width:w,depth,height:h},scene);m.position=V(p[0],c.base+y+h/2,p[1]);m.rotation.y=-Math.atan2(c.u[1],c.u[0]);m.material=mats[material];if(!groups.has(material))groups.set(material,[]);groups.get(material).push(m);}
// Photo-backed façade hierarchy: large upper windows, projecting middle bays, open lower frontage.
for(let z=-20.4;z<38;z+=10.2){box('upper-glass',-.07,z+.45,.12,Math.min(9.3,38-z-.45),12,4.4,'glass');for(let j=0;j<4&&z+.45+j*3.05<38;j++)box('upper-mullion',-.16,z+.45+j*3.05,.12,.1,12,4.4,'frame');for(const h of[13.4,14.9])box('upper-transom',-.18,z+.45,.12,Math.min(9.3,38-z-.45),h,.12,'frame');}
for(let z=-20.4;z<38;z+=10.2)box('upper-pier',-.3,z,.6,.55,11.5,6.3,'ivory');
for(let x=0;x<27;x+=9){box('end-upper-glass',x+.45,38.1,8.1,.12,12,4.4,'glass');for(const h of[13.4,14.9])box('end-transom',x+.45,38.2,8.1,.12,h,.12,'frame');box('end-mid-window',x+.45,38.1,8.1,.12,8.8,2.1,'glass');}
box('roof-overhang',-1.3,-21.4,29,60,18.1,.32,'roof');
for(let z=30;z<38;z+=.45)box('vertical-louver',-.15,z,.35,.16,.2,7.8,'wood');
for(let z=-51;z<-23;z+=7){for(const [y,h]of[[1,2.2],[5.1,2.6],[9,2.6],[12.8,2.5]])box('north-court-window',19.8,17-z-6.5,.14,6.5,y,h,'glass');}
// Stair sidewalls and upper landing parapet.
for(const z of[15.75,27])for(let i=0;i<26;i++)box('entry-sidewall',-17+i*16/26,z,16/26,.25,4.3*(i+1)/26,.55,'ivory');
box('landing-parapet',-1,14.8,6,.25,4.3,.7,'ivory');
for(const [material,list]of groups){const m=B.Mesh.MergeMeshes(list,true,true);m.name='building-167607356-student21-'+material;m.material=mats[material];m.metadata={facilityId:'167607356'};m.receiveShadows=true;m.freezeWorldMatrix();}
}
