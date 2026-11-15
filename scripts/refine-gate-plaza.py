import json,pathlib
from shapely.geometry import Polygon,box,Point
from shapely.ops import unary_union
R=pathlib.Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());area=box(-345,745,-285,865);plazas=[Polygon(s['outer'],s['holes'])for s in N['surfaces']if s['kind']=='plaza' and Polygon(s['outer'],s['holes']).intersects(area)];plaza=unary_union(plazas).convex_hull;roads=unary_union([Polygon(s['outer'],s['holes'])for s in N['surfaces']if s['kind']=='road']);plaza=plaza.difference(roads);out=[]
def emit(k,g):
 for p in ([g]if g.geom_type=='Polygon'else getattr(g,'geoms',[])):
  if p.geom_type=='Polygon'and p.area>.005:out.append(dict(kind=k,outer=list(p.exterior.coords)[:-1],holes=[list(h.coords)[:-1]for h in p.interiors]))
for s in N['surfaces']:emit(s['kind'],Polygon(s['outer'],s['holes']).difference(plaza))
bands=unary_union([box(-350,z,-280,z+.35) for z in range(750,863,12)]).intersection(plaza);emit('plaza',plaza.difference(bands));emit('plazaBand',bands);N['surfaces']=out;N['gate']['plazaOutline']=list(plaza.exterior.coords)[:-1]if plaza.geom_type=='Polygon'else[];N['gate']['plazaNote']='기존 광장 경계 조각의 볼록 외곽을 연결; 도로는 제외. 포장 구획은 첨부 사진 근사.';(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
p=R/'scripts/build-ground.py';p.write_text(p.read_text().replace("'track','turf']","'track','turf','plazaBand']"));p=R/'dist/ground-surface.js';p.write_text(p.read_text().replace('water:[72,110,94],','plazaBand:[153,152,143],water:[72,110,94],'))
