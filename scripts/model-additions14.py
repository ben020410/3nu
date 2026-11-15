# coding: utf-8
import json
from pathlib import Path
p=Path('dist/review-buildings.js');s=p.read_text()
s=s.replace("let u=kind==='haedong'?", "let u=kind==='engineer310'?[0,1]:kind==='sports71'?[.373,-.928]:kind==='haedong'?")
branch="""if(kind==='engineer310'){
  // The official AIP exterior photograph shows a low hall under a steep metal roof,
  // a central glazed roof strip and exposed white triangular frames.
  slab('ground-hall',p,base,datum+4.1,glass);facade(p,datum,1,4.1,3,2.5,2.8,'curtain');slab('eaves',p,datum+4.1,datum+4.45,white);
  const ridge=(vmin+vmax)/2,roofY=d=>datum+4.45+6.4*(1-Math.abs(d-ridge)/((vmax-vmin)/2));
  const beam3=(name,a,d,w,material)=>{const direction=d.subtract(a),m=B.MeshBuilder.CreateBox('building-'+b.id+'-'+name,{height:direction.length(),width:w,depth:w},scene);m.position=a.add(d).scale(.5);m.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,direction.normalize(),new B.Quaternion());add(m,material)};
  const pt=(x,y,d)=>{const q=at(x,d);return V(q[0],y,q[1])};
  for(const [lo,hi] of [[umin,(umin+umax)/2-7],[(umin+umax)/2-7,(umin+umax)/2+7],[(umin+umax)/2+7,umax]])for(const [d0,d1] of [[vmin,ridge],[ridge,vmax]]){
   const m=B.MeshBuilder.CreateRibbon('building-'+b.id+'-pitched-roof',{pathArray:[[pt(lo,roofY(d0),d0),pt(hi,roofY(d0),d0)],[pt(lo,roofY(d1),d1),pt(hi,roofY(d1),d1)]],sideOrientation:B.Mesh.DOUBLESIDE},scene);add(m,Math.abs((lo+hi)/2-(umin+umax)/2)<1?glass:metal);
  }
  for(let x=umin;x<=umax+.1;x+=6){
   for(const d of [vmin,vmax]){beam3('roof-frame',pt(x,datum+4.45,d),pt(x,datum+12.3,ridge),.35,white);beam3('porch-brace',pt(x,datum,d),pt(Math.min(umax,x+3),datum+4.1,d),.28,white);}
  }
  beam3('ridge',pt(umin,datum+12.3,ridge),pt(umax,datum+12.3,ridge),.32,white);top=datum+12.3;
 }else if(kind==='sports71'){
  const inset=p.map(q=>[c[0]+(q[0]-c[0])*.92,c[1]+(q[1]-c[1])*.92]);
  slab('recessed-ground',inset,base,datum+3.8,glass);facade(inset,datum,1,3.8,3.4,2.5,2.8,'curtain');
  slab('pale-upper',p,datum+3.8,datum+15.1,white);facade(p,datum+3.9,3,3.7,3.8,2.0,2.8);
  slab('dark-top',p,datum+15.1,datum+19.1,dark);facade(p,datum+15.1,1,4,3.8,2.4,3,'curtain');slab('roof',p,datum+19.1,datum+19.5,metal);
  for(let e=0;e<p.length;e++){const a=p[e],d=p[(e+1)%p.length],len=Math.hypot(d[0]-a[0],d[1]-a[1]),n=Math.max(1,Math.round(len/7));for(let j=0;j<=n;j++){const t=j/n,q=[a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t];bar('pilotis-column',[q[0]-.3,q[1]],[q[0]+.3,q[1]],datum,3.8,.6,dark);}}top=datum+19.5;
 }else """
s=s.replace("if(kind==='science13')",branch+"if(kind==='science13')");p.write_text(s)
p=Path('dist/data/campus.json');d=json.loads(p.read_text())
for b in d['buildings']:
 if b['id'] not in ['386890466','456356713']:continue
 is310=b['id']=='386890466';b['reviewModel']='engineer310' if is310 else 'sports71';b['h']=12.3 if is310 else 19.5
 b['photoVerification14']={'observed':True,'url':'https://aip.snu.ac.kr/img/intro/img_external.png' if is310 else 'https://snu.ac.kr/webdata/boards/konews/img_20160429_004.jpg','photoDate':'unknown' if is310 else '2016 article; capture date unknown','features':'pitched roof, central roof glazing, exposed triangular frames' if is310 else 'recessed pilotis, pale middle floors, dark glazed top','limitations':'Footprint retained; exact roof orientation, hidden sides and dimensions require more views','status':'photo-features-implemented-awaiting-render-review'}
 b['heightSource']='BUILD14 photo-proportion estimate; not measured'
 b['audit14']['sourcePhotoViewedThisAudit']=True
p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
