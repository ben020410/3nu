"""Stylized northwest neighbourhood backdrop; NOT surveyed buildings.
Keeps source roads and campus boundary clear. Does not change campus footprints.
"""
import json,pathlib
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union
r=pathlib.Path(__file__).resolve().parents[1];p=r/'dist/data/campus.json';d=json.loads(p.read_text());n=json.loads((r/'dist/data/walk.json').read_text());d['buildings']=[b for b in d['buildings'] if not b['id'].startswith('context-')];blocked=unary_union([Polygon(b['p'],b.get('holes',[])).buffer(3) for b in d['buildings']]+[LineString(r['p']).buffer(r['width']/2+4) for r in n['roads']]);campus=Polygon(n['campusBoundary']);added=[]
for iz,z in enumerate([1145,1171,1197,1223,1240]):
 for ix,x in enumerate([-783,-758,-733,-708,-683,-658,-633,-608]):
  w=12+(ix%2)*3;dep=12+(iz%2)*2;poly=box(x-w/2,z-dep/2,x+w/2,z+dep/2)
  if poly.intersects(blocked) or poly.intersects(campus):continue
  ident=f'context-{ix}-{iz}';levels=3+(ix+iz)%4
  d['buildings'].append({'id':ident,'name':'교외 시가지 · 각색 건물','p':list(poly.exterior.coords)[:-1],'holes':[],'h':levels*3.4,'levels':levels,'urban':True,'roof':['#697879','#9b8c78','#727e86'][(ix+iz)%3],'source':'Stylized city background; not actual footprint','heightSource':'art direction; not measured'});added.append(ident);blocked=blocked.union(poly.buffer(3))
d['stats']['buildings']=len(d['buildings']);p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));print('stylized context buildings',len(added),added)
(r/'CITY-CONTEXT.json').write_text(json.dumps({'added':added,'zone':'northwest corner, outside campus, inside current world bounds','notSurveyed':True,'roadClearanceMetres':4,'existingBuildingClearanceMetres':3},indent=2))
