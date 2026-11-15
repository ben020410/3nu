"""Choose visible edited paving interiors for route QA (does not create roads)."""
import json,pathlib,shapely as S
from shapely.geometry import Polygon
R=pathlib.Path(__file__).resolve().parents[1]
N=json.loads((R/'dist/data/walk.json').read_text())
items=[('science','science-26-27-28-court','26·27·28동 중정 접근'),('agriculture','cals-201-east-court','201동 동측 앞마당'),('engineering','eng-33-34-36-37-court','33·34·36·37동 사이 포장'),('library','pharmacy-21-forecourt','약학관 전면 포장'),('beodeul','faculty-club-forecourt','교수회관 앞마당'),('humanities','humanities-1-2-court','1·2동 사이 중정'),('education','education-inner-court','사범대 내부 중정'),('social','social-east-parking','사회대 동측 차량 공간'),('upper','upper-303-west-parking','303동 서측 차량 공간')]
a=[]
for zone,id,label in items:
 g=S.union_all([Polygon(q['outer'],q.get('holes',[]))for q in N['surfaces']if q.get('landuse31')==id]);parts=list(g.geoms)if g.geom_type=='MultiPolygon'else[g];g=max(parts,key=lambda x:x.area);safe=g.buffer(-2);p=(safe if not safe.is_empty else g).representative_point();a.append(dict(zone=zone,area=id,road=label,target=[p.x,p.y]))
(R/'reports/build31/walk-targets.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
