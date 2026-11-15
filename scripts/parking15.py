# coding: utf-8
import json,pathlib
from shapely.geometry import Polygon
R=pathlib.Path('dist/data');n=json.loads((R/'walk.json').read_text());l=n['outdoor']['lawn'];p=lambda a,b:[l['center'][0]+l['u'][0]*a+l['v'][0]*b,l['center'][1]+l['u'][1]*a+l['v'][1]*b];ring=[p(-49,-44),p(49,-44),p(49,44),p(-49,44)];cut=Polygon(ring);surfaces=[]
for s in n['surfaces']:
 shape=Polygon(s['outer'],s.get('holes',[])).difference(cut)
 for poly in ([shape] if shape.geom_type=='Polygon' else getattr(shape,'geoms',[])):
  if poly.geom_type=='Polygon' and not poly.is_empty:surfaces.append({**s,'outer':list(map(list,list(poly.exterior.coords)[:-1])),'holes':[list(map(list,list(h.coords)[:-1])) for h in poly.interiors]})
surfaces.append({'kind':'parking','outer':ring,'holes':[],'source':'User photo4; footprint matches existing lawn; parking layout estimated'})
n['surfaces']=surfaces;(R/'walk.json').write_text(json.dumps(n,ensure_ascii=False,separators=(',',':')))
