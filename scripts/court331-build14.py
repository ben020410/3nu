import json
from pathlib import Path
from shapely.geometry import Polygon
p=Path('dist/data/walk.json');w=json.loads(p.read_text());pixels=[[735,300],[831,302],[889,312],[891,398],[785,409],[723,395]]
shape=Polygon([[-173.233+(x-830)/4.2,-1002.891-(y-31)/4.2]for x,y in pixels]);out=[]
def emit(q,k):
 if q.is_empty:return
 if q.geom_type=='Polygon':out.append({'kind':k,'outer':list(q.exterior.coords)[:-1],'holes':[list(x.coords)[:-1]for x in q.interiors]})
 elif hasattr(q,'geoms'):
  for x in q.geoms:emit(x,k)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(shape),s['kind'])
emit(shape,'parking');w['surfaces']=out;p.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
Path('BUILD14-331-court.json').write_text(json.dumps({'reference':'build14-reference-331.png','pixels':pixels,'note':'Continuous paved maintenance yard; small shed identities and exact footprints remain unresolved; no invented shed models'},indent=2))
