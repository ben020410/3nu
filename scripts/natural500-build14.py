# coding: utf-8
import json
from pathlib import Path
cp=Path('dist/data/campus.json');data=json.loads(cp.read_text());ids=['329398248','179742150','179742153','297047750'];url='https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.4592190840394&lon_val=126.948120067187&convinType=Y&inst_seq=199';photo='https://map.snu.ac.kr/api/upload/default/F_BUILD_0000190.jpg'
for b in data['buildings']:
 if b['id'] in ids:
  b['officialNumber']='500';b['name']='대학원연구동(2단계)';b['parentFacility14']='179742155';b['componentStatus14']='Joined complex confirmed on Naver satellite; no separate official building number asserted'
  b['identitySources14']=[url,'https://map.naver.com/p/search/서울대학교%20500동?c=17.00,0,0,2,dh']
  b['planVerification14']={'status':'visible footprint and connected complex compared; original plan retained','scalePxPerMetre':2.1,'controls':'north wing NW, 102 NW, 203 NW; roof parallax prevents survey error claim'}
 if b['id']=='297047750':
  b['reviewModel']='science500head';b['photoVerification14']={'observed':True,'url':photo,'features':'tall glazed ground floor, brick middle floors, glazed corner and external terrace slabs','limits':'Photo age unknown; section dimensions and hidden sides estimated','status':'implemented-awaiting-render-review'}
 if b['id'] in ['179742150','179742153','179742155']:
  b['reviewModel']='science500wing';b['roofWell14']=True;b['photoVerification14']={'observed':False,'satelliteObserved':True,'url':'https://map.naver.com/p/search/서울대학교%20500동?c=17.00,0,0,2,dh','features':'separate joined wings and recessed rectangular roof zones','limits':'Upper roof relief estimated. No verified individual facade photo; retained generic facade rhythm.','status':'roof-form-implemented-awaiting-render-review'}
cp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='engineer310'?", "let u=kind==='science500head'?[.28,.96]:kind==='science500wing'?[.988,.154]:kind==='engineer310'?")
needle="if(kind==='engineer310'){"
branch="""if(kind==='science500head'){
 brick.diffuseColor=B.Color3.FromHexString('#ad765c');const split=umax-12,body=portion(umin,split),corner=portion(split,umax-3),porch=portion(umax-3,umax);
 slab('tall-glazed-ground',p,base,datum+5.8,glass);facade(p,datum,1,5.8,3.2,2.7,4.3,'curtain');slab('brick-upper',body,datum+5.8,datum+18.2,brick);facade(body,datum+5.8,3,4.1,4.8,3.2,2.3);slab('top-glazing',body,datum+18.2,datum+21.1,glass);facade(body,datum+18.2,1,3,3.8,2.9,2,'curtain');
 slab('glazed-corner',corner,datum+5.8,datum+21.1,glass);facade(corner,datum+5.8,4,3.8,3.2,2.6,2.7,'curtain');for(let k=0;k<5;k++)slab('open-terrace-'+k,porch,datum+5.8+k*3.7,datum+6.05+k*3.7,white);slab('roof',body,datum+21.1,datum+21.6,white);top=datum+21.6;
 }else if(kind==='science500wing'){
 const h=b.h;slab('retained-wing',p,base,datum+h,brick);facade(p,datum,Math.max(1,Math.round(h/4)),4,3.8,2.3,2);const inner=portion(umin+7,umax-7,vmin+6,vmax-6);slab('roof-inset',inner,datum+h,datum+h+.06,dark);
 for(const q of [portion(umin,umin+7),portion(umax-7,umax),portion(umin+7,umax-7,vmin,vmin+6),portion(umin+7,umax-7,vmax-6,vmax)])slab('roof-rim',q,datum+h,datum+h+.7,metal);top=datum+h+.7;
 }else """
assert needle in s;s=s.replace(needle,branch+needle);p.write_text(s)
for p in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=p.read_text().replace('const reviewViews={',"const reviewViews={'natural500':{eye:[-214,123,175],at:[-310,101,126]},'natural500-top':{eye:[-463.111,450,10.821],at:[-463.111,90,10.831],span:171.4285714},")
 p.write_text(s)
