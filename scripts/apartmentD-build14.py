# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text());b=next(b for b in c['buildings']if b['id']=='439707887')
b.update(name='교수아파트 D동',reviewModel='apartmentD',h=19.5,heightSource='2025-08 streetview: five residential rows above exposed garage; 19.5m estimated, not surveyed')
b['photoVerification14']={'observed':True,'date':'2025-08','url':'https://map.naver.com/p/search/서울대교수아파트E동?p=pLrJdk-N_qEYCI4iF0vjlA,-85,10,80,Float','features':'Roadside D facade: exposed garage, five residential rows, brick lower part, pale upper two rows, four unequal window/balcony columns, flat projecting roof','limits':'Rear facade and exact dimensions unverified. Garage is a recessed closed entrance, not a traversable interior. Official numeric suffix not assigned.','status':'implemented-awaiting-render-review'}
b['planVerification14']={'source':'build14-reference-professor-apartments.png','status':'Naver A-I labels and existing relative arrangement visually checked; no surveyed registration or footprint retrace'}
b['identitySources14']=['https://map.naver.com/p/search/서울대학교%20교수아파트']
p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text();branch="""if(kind==='apartmentD'){
 brick.diffuseColor=B.Color3.FromHexString('#9b8a72');glass.diffuseColor=B.Color3.FromHexString('#8ca9aa');
 slab('lower-brick',p,base,datum+12.8,brick);slab('upper-pale',p,datum+12.8,datum+19.1,white);slab('flat-roof',p,datum+19.1,datum+19.5,metal);
 const a=p[2],z=p[3],dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz),pt=(t,o=.12)=>[a[0]+dx*t+dz/len*o,a[1]+dz*t-dx/len*o];
 bar('garage-recess',pt(.36),pt(.75),datum+.1,3,.18,dark);bar('garage-lintel',pt(.32,.28),pt(.79,.28),datum+3.05,.3,.6,white);
 for(let row=0;row<5;row++){
 const y=datum+3.65+row*3.1;
 for(const [i,t]of [.12,.36,.60,.85].entries()){
 if(row===0&&i!==2)continue;
 const half=(i===1?.057:.102);bar('glazed-opening',pt(t-half,.17),pt(t+half,.17),y,2.35,.15,glass);
 bar('window-sill',pt(t-half,.28),pt(t+half,.28),y-.13,.13,.4,white);
 bar('window-mullion',pt(t-.003,.31),pt(t+.003,.31),y,2.35,.15,white);
 if(i!==1&&row>0){bar('balcony-slab',pt(t-half,.55),pt(t+half,.55),y-.2,.2,1,metal);bar('balcony-handrail',pt(t-half,1.05),pt(t+half,1.05),y+.92,.065,.07,dark);for(let j=0;j<=12;j++){const tt=t-half+2*half*j/12;bar('balcony-rail',pt(tt-.0015,1.05),pt(tt+.0015,1.05),y,.92,.045,dark);}}
 }
 }
 // Unseen sides remain restrained estimates, separately documented.
 for(let e=0;e<2;e++){const aa=p[e],zz=p[e+1],l=Math.hypot(zz[0]-aa[0],zz[1]-aa[1]);if(l<20)continue;for(let t=.12;t<.95;t+=.18)for(let r=0;r<5;r++){const q=x=>[aa[0]+(zz[0]-aa[0])*x-.1,aa[1]+(zz[1]-aa[1])*x];bar('unverified-side-window',q(t-.045),q(t+.045),datum+3.7+r*3.1,2.2,.16,glass);}}
 top=datum+19.5;
 }else """
s=s.replace("if(kind==='cowayFountain'){",branch+"if(kind==='cowayFountain'){");p.write_text(s)
p=Path('scripts/update-ledger14.py');s=p.read_text().replace("extra={'329398248'","extra={'439707887','329398248'");p.write_text(s)
for path in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=path.read_text().replace("const reviewViews={","const reviewViews={'apartments':{eye:[552,103,977],at:[479,92,963]},'apartments-top':{eye:[435,480,975.01],at:[435,80,975],span:150},")
 path.write_text(s)
