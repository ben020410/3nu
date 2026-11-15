# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');d=json.loads(p.read_text());b=next(b for b in d['buildings']if b['id']=='700872151');b.update(h=40.4,levels=10,reviewModel='samsung944');b['heightSource']='Official university account reports10 above-ground floors;40.4m estimate:2 tall base floors+8officefloors, exact section unavailable';b['photoVerification14']={'observed':True,'url':'https://map.naver.com/p/search/서울대학교%20944동?c=18.00,0,0,2,adh&p=ZQ6G4eXwVJ7SDVakTmRhgA,-32,10,80,Float','date':'Naver panorama2021-04 latest shown at this location','features':'glass lower facade, terracotta vertical panels, vent louvers, large overhang','limits':'upper floor count supported by university report; tower dimensions estimated; post2021facade changes unverified','status':'implemented-awaiting-render-review'};b['planVerification14']={'status':'Naver satellite two tower roofs and connecting terrace compared; original full footprint retained','reference':'build14-reference-944.png','limits':'tower split positions manually inferred from image; roof parallax'}
p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='power330'?","let u=kind==='samsung944'?[.739,.674]:kind==='power330'?")
branch="""if(kind==='samsung944'){
 brick.diffuseColor=B.Color3.FromHexString('#a87754');const lower=portion(umin,umax),south=portion(umin,umin+55),north=portion(umax-32,umax),garden=portion(umin+55,umax-32);
 slab('connected-podium',lower,base,datum+9.2,glass);facade(lower,datum,2,4.6,3.1,2.2,3.4,'curtain');slab('roof-garden-terrace',garden,datum+9.2,datum+9.6,white);
 for(const [poly,tag]of [[south,'south'],[north,'north']]){
  slab(tag+'-tower',poly,datum+9.2,datum+39.8,glass);facade(poly,datum+9.2,8,3.825,3.2,2.3,2.5,'curtain');slab(tag+'-roof',poly,datum+39.8,datum+40.4,metal);
  for(let e=0;e<poly.length;e++){const a=poly[e],z=poly[(e+1)%poly.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);if(len<5)continue;const q=t=>[a[0]+(z[0]-a[0])*t,a[1]+(z[1]-a[1])*t];for(let x=1;x<len;x+=6.2){bar('terracotta-fin',q(Math.max(0,(x-.35)/len)),q(Math.min(1,(x+.35)/len)),datum,39.8,.35,brick);for(let y=.5;y<8.6;y+=.35)bar('vent-louver',q(Math.max(0,(x+1)/len)),q(Math.min(1,(x+2.3)/len)),datum+y,.06,.22,dark);}}
 }
 const sp=portion(umin+2,umin+53,vmin+2,vmax-2);slab('south-solar-field',sp,datum+40.42,datum+40.48,dark);for(let x=umin+4;x<umin+53;x+=4)bar('solar-frame',at(x,vmin+2),at(x,vmax-2),datum+40.5,.05,.06,metal);top=datum+40.4;
 }else """
s=s.replace("if(kind==='power330'){",branch+"if(kind==='power330'){");p.write_text(s)
for p in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=p.read_text().replace('const reviewViews={',"const reviewViews={'samsung944':{eye:[835,119,743],at:[733,104,880]},'samsung944-top':{eye:[688.764,500,853.495],at:[688.764,90,853.505],span:85.7142857},")
 p.write_text(s)
Path('BUILD14-944-model.json').write_text(json.dumps(b,ensure_ascii=False,indent=2))
