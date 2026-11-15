# coding:utf-8
import json
from pathlib import Path
p=Path('dist/data/campus.json');c=json.loads(p.read_text());by={b['id']:b for b in c['buildings']};a=by['vw/47'];a.update(suppressedDuplicate14=True,supersededBy='424946985',collisionPolygons=[],parentFacility14='424946985',suppressionReason14='Thin strip lies along current945roof terrace/parapet, not separate ground building; satellite compared. Canonical roof handles form.')
b=by['vw/258'];b.update(name='코웨이 R&D센터 앞 수경시설',reviewModel='cowayFountain',h=5.5,semanticType14='outdoor-water-feature',parentFacility14='424946985');b['photoVerification14']={'observed':True,'url':'https://company.coway.com/newsroom/press/970','features':'round pool and faceted glazed pyramid; dark circular shape on Naver corresponds same feature','limits':'5.5m height estimate; jets omitted; no standalone official building number','status':'implemented-awaiting-render-review'};b['planVerification14']={'status':'Naver circle compared at pixel747,243 against neighboring945 and950; retained existing circular outline'}
p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=Path('dist/review-buildings.js');s=p.read_text();branch="""if(kind==='cowayFountain'){
 const water=mat('water','#5c9daa');slab('pool-rim',p,base,datum+.7,white);const inner=p.map(q=>[c[0]+(q[0]-c[0])*.89,c[1]+(q[1]-c[1])*.89]);slab('water',inner,datum+.55,datum+.64,water);
 const r=3.4,apex=V(c[0],datum+5.5,c[1]),ring=Array.from({length:6},(_,i)=>V(c[0]+r*Math.cos(i*Math.PI/3),datum+.7,c[1]+r*Math.sin(i*Math.PI/3)));
 const pos=[],ix=[],uv=[];for(let i=0;i<6;i++){const k=pos.length/3;for(const q of [ring[i],ring[(i+1)%6],apex])pos.push(...q.asArray());ix.push(k,k+1,k+2);uv.push(0,0,1,0,.5,1);add(B.MeshBuilder.CreateTube('building-'+b.id+'-pyramid-frame',{path:[ring[i],apex],radius:.07,tessellation:5},scene),dark);}const m=new B.Mesh('building-'+b.id+'-pyramid-glazing',scene),vd=new B.VertexData(),norm=[];B.VertexData.ComputeNormals(pos,ix,norm);vd.positions=pos;vd.indices=ix;vd.normals=norm;vd.uvs=uv;vd.applyToMesh(m);glass.backFaceCulling=false;add(m,glass);top=datum+5.5;
 }else """;s=s.replace("if(kind==='coway945'){",branch+"if(kind==='coway945'){");p.write_text(s)
p=Path('scripts/update-ledger14.py');s=p.read_text().replace("'424946985','vw/278'}","'424946985','vw/278','vw/47','vw/258'}");p.write_text(s)
