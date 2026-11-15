import json
from pathlib import Path
from shapely.geometry import Polygon
from shapely.ops import unary_union
p=Path('dist/data/walk.json');w=json.loads(p.read_text())
def world(q):return [-200.899+(q[0]-658)/4.2,-139.302-(q[1]-310)/4.2]
def poly(q):return Polygon([world(x)for x in q])
outer=poly([[888,82],[1072,136],[1015,278],[820,251]])
lawns=[poly([[908,116],[1024,149],[1001,211],[884,177]]),poly([[862,206],[993,243],[981,270],[848,236]])]
area=outer;out=[]
def emit(q,k):
 if q.is_empty:return
 if q.geom_type=='Polygon':out.append({'kind':k,'outer':list(q.exterior.coords)[:-1],'holes':[list(x.coords)[:-1]for x in q.interiors]})
 elif hasattr(q,'geoms'):
  for x in q.geoms:emit(x,k)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(area),s['kind'])
emit(outer.difference(unary_union(lawns)),'plaza')
for q in lawns:emit(q,'lawn')
w['surfaces']=out;p.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
Path('BUILD14-28-court.json').write_text(json.dumps({'reference':'build14-reference-28.png','note':'Naver visible north court paving and two planted rectangles; internal stairs and terrace heights not measured','outer':list(outer.exterior.coords),'lawns':[list(q.exterior.coords)for q in lawns]},indent=2))
