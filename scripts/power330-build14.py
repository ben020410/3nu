# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text());b=next(b for b in c['buildings']if b['id']=='439703635');b['previousIdentity14']={'number':b.get('officialNumber'),'name':b['name']};b.update(officialNumber='330',name='제2파워플랜트',reviewModel='power330');b['identitySources14']=['https://cee.snu.ac.kr/bbs/board.php?bo_table=sub6_1&wr_id=4481','https://map.naver.com/p/search/서울대학교%20331동?c=18.00,0,0,2,dh'];b['photoVerification14']={'observed':True,'url':'https://map.snu.ac.kr/api/upload/default/F_BUILD_0000189.jpg','features':'background concrete powerhouse and curved glazed roof; main photo subject is separate metal warehouse332','limits':'Only partial west side photographed; sixteen-metre height retained estimate; rear walls not verified','status':'partial-features-implemented-awaiting-review'};b['identityCaveat14']='Previous official332 marker was assigned to wrong neighboring large footprint. Official332 metal warehouse photo differs; its exact separate footprint remains unassigned.'
p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/data/places.json');places=json.loads(p.read_text())
for x in places:
 if x['id']==b['id']:x.update(number='330',name='제2파워플랜트',description='제2파워플랜트. 인접한 다목적차량보관소(332동)와 구분합니다.',verification='네이버 위성 이름과 공식2026시설공지 대조; 외형 부분확인')
p.write_text(json.dumps(places,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='garage331'?","let u=kind==='power330'?[0,1]:kind==='garage331'?")
branch="""if(kind==='power330'){
 slab('concrete-body',p,base,datum+12.8,metal);const a0=umin+8,a1=umax-6,d0=vmax-9,d1=vmax-2,r=(d1-d0)/2,mid=(d0+d1)/2;
 const paths=[];for(let j=0;j<=20;j++){const angle=Math.PI*j/20,d=mid+r*Math.cos(angle),y=datum+12.8+3.2*Math.sin(angle);paths.push([V(...[at(a0,d)[0],y,at(a0,d)[1]]),V(...[at(a1,d)[0],y,at(a1,d)[1]])]);}add(B.MeshBuilder.CreateRibbon('building-'+b.id+'-barrel-glazing',{pathArray:paths,sideOrientation:B.Mesh.DOUBLESIDE},scene),glass);
 for(let j=0;j<=20;j+=4){const angle=Math.PI*j/20,d=mid+r*Math.cos(angle);bar('roof-long-mullion',at(a0,d),at(a1,d),datum+12.8+3.2*Math.sin(angle),.12,.12,dark);}
 for(let x=a0;x<=a1;x+=4)for(let j=0;j<20;j++){const t0=Math.PI*j/20,t1=Math.PI*(j+1)/20,q0=at(x,mid+r*Math.cos(t0)),q1=at(x,mid+r*Math.cos(t1)),y0=datum+12.8+3.2*Math.sin(t0),y1=datum+12.8+3.2*Math.sin(t1);const pts=[V(q0[0],y0,q0[1]),V(q1[0],y1,q1[1])];add(B.MeshBuilder.CreateTube('building-'+b.id+'-roof-rib',{path:pts,radius:.07,tessellation:4},scene),dark);}
 for(let x=umin+4;x<umax-3;x+=7)bar('high-side-window',at(x-.7,vmax+.1),at(x+.7,vmax+.1),datum+8.7,2.2,.16,glass);top=datum+16;
 }else """
s=s.replace("if(kind==='garage331'){",branch+"if(kind==='garage331'){");p.write_text(s)
