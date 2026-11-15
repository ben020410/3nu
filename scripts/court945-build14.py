import json
from pathlib import Path
from shapely.geometry import Polygon
p=Path('dist/data/walk.json');w=json.loads(p.read_text());pixels=[[650,322],[720,300],[802,267],[818,280],[742,368],[846,458],[781,516],[652,406]];shape=Polygon([[658.129+(x-424)/4.2,641.539-(y-600)/4.2]for x,y in pixels]);out=[]
def emit(q,k):
 if q.is_empty:return
 if q.geom_type=='Polygon':out.append({'kind':k,'outer':list(q.exterior.coords)[:-1],'holes':[list(x.coords)[:-1]for x in q.interiors]})
 elif hasattr(q,'geoms'):
  for x in q.geoms:emit(x,k)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(shape),s['kind'])
emit(shape,'parking');w['surfaces']=out;p.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
Path('BUILD14-945-court.json').write_text(json.dumps({'reference':'build14-reference-945.png','pixels':pixels,'limits':'planting islands and center-island details not fully traced'},indent=2))
p=Path('dist/review-buildings.js');s=p.read_text().replace("slab('pool-rim',p,base,datum+.7,white);","slab('pool-base',p,base,datum+.55,white);for(let i=0;i<p.length;i++)bar('pool-rim',p[i],p[(i+1)%p.length],datum+.55,.16,.3,white);").replace("slab('water',inner,datum+.55,datum+.64,water)","slab('water',inner,datum+.56,datum+.64,water)").replace("[.1,.24,.69,.8,.91].entries()","[.09,.20,.31,.76,.90].entries()");p.write_text(s)
