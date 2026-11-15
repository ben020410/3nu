# coding: utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');d=json.loads(p.read_text());b=next(x for x in d['buildings'] if x['id']=='167608115');old=b['p'];anchor=[658,310];world=[-200.899,-139.302]
pixels=[[819,253],[995,310],[929,455],[751,395]]
b['p']=[[round(world[0]+(x-anchor[0])/4.2,3),round(world[1]-(y-anchor[1])/4.2,3)] for x,y in pixels]
b.update(officialNumber='28',name='자연대 대형강의동',levels=5,reviewModel='lecture28')
b['heightSource']='26.9m retained estimate, not measured; published five above-ground floors only'
b['photoVerification14']={'observed':True,'url':'https://www.snu.ac.kr/webdata/boardimages/kobodo/img_20221215_001.jpg','date':'2022-12-15 opening press release','features':'stepped pale massing, recessed glazed middle, vertical slit windows, large south glazing, upper solar canopy','limits':'height, unseen sides, depth estimates; current facade changes since 2022 unverified','status':'implemented-awaiting-render-review'}
b['planVerification14']={'status':'Naver roof outline manually traced, ground edge subject to parallax','scalePxPerMetre':4.2,'anchor':{'pixel':anchor,'world':world,'feature':'27 southwest corner'},'additionalControl':'27 southeast corner at pixel742,345 corresponds world[-180.524,-148.83];22 southwest pixel1005,396 world[-119.5,-159.964]','before':old,'pixels':pixels}
b['identitySources14']=['https://www.snu.ac.kr/snunow/press?bbsidx=139177&md=v','https://science.snu.ac.kr/newsroom/view/2/11/1195']
p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='science500head'?","let u=kind==='lecture28'?[.951,-.309]:kind==='science500head'?")
branch="""if(kind==='lecture28'){
 const width=umax-umin,split=umin+width*.47,lower=p.map(q=>[c[0]+(q[0]-c[0])*.84,c[1]+(q[1]-c[1])*.84]);
 slab('pale-ground',p,base,datum+4.6,white);facade(p,datum,1,4.6,4.8,3.8,3.4,'curtain');slab('terrace-floor',p,datum+4.6,datum+5.1,white);
 slab('recessed-middle',lower,datum+5.1,datum+10,glass);facade(lower,datum+5.1,1,4.9,3.2,2.4,3.5,'curtain');
 const body=portion(umin,umax,vmin,vmax),left=portion(umin,split),right=portion(split,umax,vmin+2,vmax);
 slab('main-upper',body,datum+10,datum+19.8,white);slab('upper-left',left,datum+19.8,datum+26,white);slab('upper-right',right,datum+19.8,datum+23.5,white);
 // South-facing openings are drawn as distinct bands, not a full repeated facade texture.
 for(const [a0,a1,y,h,n] of [[umin+1,split-1,11.3,7.2,12],[umin+1,split-1,20.4,5,11],[split+1,umax-1,20.5,2.5,12]]){
  for(let j=0;j<n;j++){const x=a0+(a1-a0)*(j+.5)/n,d=vmin+(y>20&&a0>split?2:0)-.1;bar('vertical-glass',at(x-.34,d),at(x+.34,d),datum+y,h,.18,glass);}
 }
 bar('large-south-glazing',at(split+1,vmin-.1),at(umax-6,vmin-.1),datum+11,7.1,.2,glass);
 for(let x=split+1;x<umax-6;x+=3.2)bar('south-mullion',at(x-.08,vmin-.22),at(x+.08,vmin-.22),datum+11,7.1,.22,metal);
 for(const x of [umin+1,split-1,umax-1])bar('middle-pier',at(x-.28,vmin+1),at(x+.28,vmin+1),datum+5.1,4.9,.7,white);
 slab('left-roof',left,datum+26,datum+26.3,metal);const canopy=portion(umin+.6,split-.6,vmin+1,vmax-1);slab('solar-canopy',canopy,datum+26.65,datum+26.9,dark);for(let x=umin+1;x<split;x+=3)bar('canopy-frame',at(x,vmin+1),at(x,vmax-1),datum+26.91,.05,.08,metal);top=datum+26.9;
 }else """
s=s.replace("if(kind==='science500head'){",branch+"if(kind==='science500head'){");p.write_text(s)
for p in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=p.read_text().replace('const reviewViews={',"const reviewViews={'lecture28':{eye:[-177,121,-226],at:[-151,106,-149]},'lecture28-top':{eye:[-205.185,450,-151.197],at:[-205.185,90,-151.187],span:85.7142857},")
 p.write_text(s)
Path('BUILD14-28-trace.json').write_text(json.dumps(b,ensure_ascii=False,indent=2))
