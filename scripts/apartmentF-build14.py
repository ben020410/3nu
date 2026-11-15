# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text());b=next(b for b in c['buildings']if b['id']=='439707889');b.update(name='교수아파트 F동',reviewModel='apartmentF',h=18.8,heightSource='2025-08 streetview five visible residential bands and stepped roof; 18.8m estimated')
b['photoVerification14']={'observed':True,'date':'2025-08','url':'https://map.naver.com/p/search/서울대교수아파트E동?p=pLrJdk-N_qEYCI4iF0vjlA,-32,10,80,Float','features':'Glazed balcony bands, pale structural frames, lower roadside roof segment, dark roof overhangs','limits':'Vegetation hides lower floors; exact height and hidden rear faces estimated; roof step extent approximate','status':'implemented-awaiting-render-review'};b['identitySources14']=['https://map.naver.com/p/search/서울대학교%20교수아파트'];p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='coway945'?","let u=kind==='apartmentF'?[.80,.60]:kind==='coway945'?")
branch="""if(kind==='apartmentF'){
 glass.diffuseColor=B.Color3.FromHexString('#829c9d');const split=umax-9,high=portion(umin,split),low=portion(split,umax);
 slab('high-block',high,base,datum+18.4,white);slab('lower-roadside-block',low,base,datum+15.3,white);slab('high-overhang',high,datum+18.4,datum+18.8,dark);slab('lower-overhang',low,datum+15.3,datum+15.7,dark);
 for(let e=0;e<p.length;e++){const a=p[e],z=p[(e+1)%p.length],dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz);const pt=(t,o=.14)=>[a[0]+dx*t+dz/len*o,a[1]+dz*t-dx/len*o],count=Math.max(2,Math.round(len/4.6));
 for(let j=0;j<count;j++){const t=(j+.5)/count,lowPart=local(pt(t,0))[0]>split;for(let r=0;r<(lowPart?4:5);r++){const y=datum+2.7+r*3.1,half=.43/count;bar('balcony-glazing',pt(t-half),pt(t+half),y,2.55,.16,glass);bar('white-transom',pt(t-half,.3),pt(t+half,.3),y-.18,.18,.4,white);for(const side of [-1,1])bar('white-pier',pt(t+side*half-.004,.28),pt(t+side*half+.004,.28),y,2.9,.4,white);bar('glass-mullion',pt(t-.002,.34),pt(t+.002,.34),y,2.55,.1,metal);bar('balcony-railing',pt(t-half,.53),pt(t+half,.53),y+.9,.06,.08,dark);}}
 }
 top=datum+18.8;
 }else """
s=s.replace("if(kind==='apartmentD'){",branch+"if(kind==='apartmentD'){");p.write_text(s)
p=Path('scripts/update-ledger14.py');s=p.read_text().replace("extra={'439707887'","extra={'439707889','439707887'");p.write_text(s)
