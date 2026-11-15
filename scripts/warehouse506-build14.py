# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text());scale=300/71.1;anchor=[1053,367];world=[-235.755,107.338];pixels=[[515,394],[619,378],[625,407],[521,423]];poly=[[round(world[0]+(x-anchor[0])/scale,3),round(world[1]-(y-anchor[1])/scale,3)]for x,y in pixels]
for b in c['buildings']:
 if b['id']=='vw/197':
  b['previousIdentity14']=b['name'];b.update(name='이름 미확인 시설',identityConflict14='Source506 label is hundreds of metres from official506 and Naver natural-science hazardous-store label. Geometry retained; identity removed, not deleted.');b.pop('officialNumber',None)
b={'id':'vw/71','name':'자연대 생명과학부 시약보관창고','officialNumber':'506','p':poly,'holes':[],'h':4.6,'reviewModel':'warehouse506','heightSource':'single concrete storey 3.6m + roof screen1m estimated from official image','siteDatum':88.65926319928778,'siteBlock':1,'source':'Naver satellite manually traced; source screenshot retained for review, no raster used as texture','identitySources14':['https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.46009&lon_val=126.94822&convinType=Y&inst_seq=200','https://map.naver.com/p/search/서울대학교%20500동?c=18.00,0,0,2,dh'],'photoVerification14':{'observed':True,'url':'https://map.snu.ac.kr/api/upload/default/F_BUILD_0000191.jpg','features':'Low exposed concrete facade, flat roof, horizontal rooftop screen, dark double door and external ladder; no repeated windows','limits':'Photo date unknown; exact height and rear face estimated. Adjacent small roofs remain separate and unverified.','status':'implemented-awaiting-render-review'},'planVerification14':{'source':'build14-reference-506.png','pixels':pixels,'anchorPixel':anchor,'anchorWorld':world,'pixelPerMetre':scale,'measurement':'Naver distance tool 300 horizontal screenshot pixels =71.1m; stored screenshot','limits':'Manual registration to102NW roof corner; 500head corner cross-check shows roof-parallax ambiguity. Not surveying accuracy.'}}
b['previousFootprint14']=next(x for x in c['buildings']if x['id']=='vw/71').get('previousFootprint14',next(x for x in c['buildings']if x['id']=='vw/71')['p']);c['buildings']=[x for x in c['buildings']if x['id'] not in [b['id'],'official-506']]+[b];p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text();branch="""if(kind==='warehouse506'){
 slab('concrete-store',p,base,datum+3.6,metal);slab('flat-roof',p,datum+3.6,datum+3.75,white);
 for(let e=0;e<p.length;e++){const a=p[e],z=p[(e+1)%p.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);for(let y=.2;y<1;y+=.18)bar('roof-horizontal-screen',a,z,datum+3.6+y,.08,.12,white);if(len>15){const q=t=>[a[0]+(z[0]-a[0])*t,a[1]+(z[1]-a[1])*t-.1];bar('metal-door',q(.68),q(.79),datum+.05,2.5,.2,dark);bar('door-seam',q(.734),q(.736),datum+.05,2.5,.24,metal);}}
 const a=p[3],z=p[2],dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz),q=t=>[a[0]+dx*t,a[1]+dz*t-.3];for(const t of [.05,.085])bar('ladder-side',q(t-.002),q(t+.002),datum,4.3,.07,dark);for(let y=.3;y<4.3;y+=.32)bar('ladder-rung',q(.05),q(.085),datum+y,.045,.09,dark);top=datum+4.6;
 }else """
s=s.replace("if(kind==='apartmentF'){",branch+"if(kind==='apartmentF'){");p.write_text(s)
for path in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=path.read_text().replace("const reviewViews={","const reviewViews={'warehouse506':{eye:[-371,99,77],at:[-348,91,102]},'warehouse506-top':{eye:[-333.638,450,109.007],at:[-333.638,90,109.017],span:85.32},")
 path.write_text(s)
Path('BUILD14-506-trace.json').write_text(json.dumps(b,ensure_ascii=False,indent=2))
