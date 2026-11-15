# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text())
for b in c['buildings']:
 if b['id']in['436516340','436516339']:
  n='18'if b['id']=='436516340'else'19';b.update(reviewModel='science'+n,h=19.3 if n=='18'else 15.2,heightSource='Official facade photograph: exposed5/4rows, differentiated ground/upper floors; metric height estimated')
  b['photoVerification14']={'observed':True,'url':b['officialPhoto'],'features':'18: red brick, tall central glazing, individual upper windows and grouped lower white panels. 19: paired top windows, broad white lower spandrels, entrance canopy.','limits':'Photo date unknown; end/rear faces and exact count behind vegetation unverified. Existing footprint retained pending aligned satellite review.','status':'implemented-awaiting-render-review'}
 if b['id']=='436516341':
  b.update(name='18·19동 연결통로',parentBuildingIds=['436516340','436516339'],reviewModel='scienceConnector',h=12,heightSource='Estimated low connector, partially visible at edge of official18 photograph; ground passage not established')
  b['identitySources14']=['https://ece.snu.ac.kr/community/campus-life?bbsidx=55923&md=v'];b['photoVerification14']={'observed':True,'url':'https://map.snu.ac.kr/api/upload/default/F_BUILD_0000021.jpg','features':'White connector with horizontal glazing partly visible at right edge','limits':'Ground and rear concealed; retains solid footprint collision, not assumed elevated bridge. Height and three rows estimated.','status':'implemented-awaiting-render-review'}
p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='apartmentF'?","let u=kind.startsWith('science18')||kind.startsWith('science19')||kind==='scienceConnector'?[-.09,.9959418]:kind==='apartmentF'?")
branch="""if(kind==='scienceConnector'){
 slab('white-connector',p,base,datum+11.7,white);facade(p,datum+.4,3,3.8,2,1.6,2.4,'curtain');slab('connector-roof',p,datum+11.7,datum+12,metal);top=datum+12;
 }else if(kind==='science18'||kind==='science19'){
 brick.diffuseColor=B.Color3.FromHexString('#a46953');const eighteen=kind==='science18',h=b.h,rows=eighteen?5:4,fh=(h-.8)/rows;slab('brick-mass',p,base,datum+h-.3,brick);slab('flat-roof-cap',p,datum+h-.3,datum+h,metal);
 const columns=eighteen?16:10,step=(umax-umin)/columns,stair=(umin+umax)/2;
 for(const side of [vmax+.12,vmin-.12]){
 const back=side<vmin;
 for(let j=0;j<columns;j++){const x=umin+(j+.5)*step;if(eighteen&&Math.abs(x-stair)<step*1.1)continue;
 for(let r=0;r<rows;r++){
 const y=datum+r*fh+.65,topRow=r>=rows-(eighteen?2:1),w=step*(eighteen?.66:.77);
 if(!topRow)bar('white-spandrel',at(x-w/2,side),at(x+w/2,side),datum+r*fh,.65,.2,white);
 if(!eighteen&&topRow){for(const d of [-w*.26,w*.26])bar('paired-top-window',at(x+d-w*.22,side),at(x+d+w*.22,side),y,fh-1.3,.18,glass);}
 else bar('facade-window',at(x-w/2,side),at(x+w/2,side),y,fh-1.3,.18,glass);
 bar('deep-window-lintel',at(x-w/2-.08,side),at(x+w/2+.08,side),y+fh-1.22,.12,.36,dark);bar('window-centre-mullion',at(x-.035,side),at(x+.035,side),y,fh-1.3,.25,metal);
 }
 }
 if(eighteen){bar('central-stair-glass',at(stair-step,side),at(stair+step,side),datum+.2,h-1.2,.3,glass);for(let y=1;y<h-1;y+=1.4)bar('stair-transom',at(stair-step,side),at(stair+step,side),datum+y,.075,.36,dark);for(let x=stair-step;x<=stair+step;x+=1.2)bar('stair-mullion',at(x-.035,side),at(x+.035,side),datum+.2,h-1.2,.36,dark);}
 if(!back){bar('entrance-canopy',at(stair-3.5,side+.8),at(stair+3.5,side+.8),datum+3.1,.5,2.2,white);bar('entrance-glass',at(stair-2,side+.12),at(stair+2,side+.12),datum,3.1,.2,glass);}
 }
 top=datum+h;
 }else """
s=s.replace("if(kind==='warehouse506'){",branch+"if(kind==='warehouse506'){");p.write_text(s)
p=Path('scripts/update-ledger14.py');s=p.read_text().replace("extra={'vw/71'","extra={'436516341','vw/71'");p.write_text(s)
for path in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=path.read_text().replace("const reviewViews={","const reviewViews={'science18':{eye:[4,104,-260],at:[68,98,-245]},'science19':{eye:[0,100,-324],at:[64,96,-312]},'science1819-top':{eye:[60,450,-282.99],at:[60,90,-283],span:100},")
 path.write_text(s)
