# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text());by={b['id']:b for b in c['buildings']};b=by['424946985'];old=b['p'];pixels=[[856,232],[993,351],[879,484],[742,368]];b['p']=[[658.129+(x-424)/4.2,641.539-(y-600)/4.2]for x,y in pixels];b.update(officialNumber='945',name='코웨이 R&D센터',reviewModel='coway945',componentIds=['vw/278']);b['planVerification14']={'status':'Naver manual roof trace; two conflicting outlines replaced by one current visible building','scalePxPerMetre':4.2,'anchorPixel':[424,600],'anchorWorld':[658.129,641.539],'crosscheck':'950 north corner and942 southwest corner; roof parallax remains','before':old,'pixels':pixels};b['photoVerification14']={'observed':True,'url':'https://company.coway.com/newsroom/press/970','photoURL':'https://company.coway.com/files/22673/a0249bcc-2661-416b-9583-6b662f2ef54c','date':'2026-05-22 publication; capture date unknown','features':'brick front, narrow curved glass strips, broad central glazing, uneven parapet','limits':'33.6m existing estimate retained; unphotographed rear and precise ribbon curves estimated','status':'implemented-awaiting-render-review'};b['identitySources14']=['https://map.snu.ac.kr/web/facility_detail.action?lat_val=37.46527&lon_val=126.96065&convinType=Y&inst_seq=228','https://company.coway.com/newsroom/press/970'];a=by['vw/278'];a.update(suppressedDuplicate14=True,supersededBy=b['id'],collisionPolygons=[],suppressionReason14='Conflicting shifted outline of same945 complex. Replaced by current satellite-traced canonical footprint; source row retained.')
p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='samsung944'?","let u=kind==='coway945'?[.755,-.656]:kind==='samsung944'?")
branch="""if(kind==='coway945'){
 brick.diffuseColor=B.Color3.FromHexString('#8d5746');glass.diffuseColor=B.Color3.FromHexString('#74a7b3');slab('brick-volume',p,base,datum+b.h,brick);
 const front=umin-.12,len=vmax-vmin,mid0=vmin+len*.38,mid1=vmin+len*.59;
 bar('central-glass',at(front,mid0),at(front,mid1),datum+.9,b.h-2,.18,glass);
 for(let y=3;y<b.h-1;y+=3.9)bar('central-floor',at(front-.12,mid0),at(front-.12,mid1),datum+y,.18,.2,metal);
 for(let d=mid0;d<mid1;d+=2.5)bar('central-mullion',at(front-.15,d-.045),at(front-.15,d+.045),datum+.9,b.h-2,.12,metal);
 for(const [i,t]of [.1,.24,.69,.8,.91].entries()){
  const paths=[];for(let j=0;j<=24;j++){const y=b.h*j/24,curve=Math.pow(Math.max(0,1-y/12),2)*(i<2?-.9:.8),dd=vmin+t*len+curve,aa=at(front-.02,dd-.42),bb=at(front-.02,dd+.42);paths.push([V(aa[0],datum+y,aa[1]),V(bb[0],datum+y,bb[1])]);}add(B.MeshBuilder.CreateRibbon('building-'+b.id+'-curved-glass-ribbon',{pathArray:paths,sideOrientation:B.Mesh.DOUBLESIDE},scene),glass);
 }
 slab('roof-green-zone',portion(umin+1,umax-1,vmin+1,vmax-1),datum+b.h,datum+b.h+.08,mat('roof','#83a292'));slab('roof-deck',portion(umax-12,umax-1,vmin+1,vmax-1),datum+b.h+.09,datum+b.h+.16,wood);slab('roof-dark-inset',portion(umin+12,umax-12,vmin+4,vmin+14),datum+b.h+.1,datum+b.h+.18,dark);
 bar('entrance-canopy',at(front-1,mid0-1),at(front-1,mid1+1),datum+3.5,.35,2.5,white);top=datum+b.h+.18;
 }else """
s=s.replace("if(kind==='samsung944'){",branch+"if(kind==='samsung944'){");p.write_text(s)
for p in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=p.read_text().replace('const reviewViews={',"const reviewViews={'coway945':{eye:[696,101,749],at:[765,102,699]},'coway945-top':{eye:[709.558,500,698.682],at:[709.558,90,698.692],span:85.7142857},")
 p.write_text(s)
Path('BUILD14-945-trace.json').write_text(json.dumps({'canonical':b,'suppressed':a},ensure_ascii=False,indent=2))
