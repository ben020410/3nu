"""Preserve explicitly mapped building parts; never generate random wings/courtyards."""
import json,math,pathlib,xml.etree.ElementTree as ET
from shapely.geometry import Polygon
ROOT=pathlib.Path(__file__).resolve().parents[1];D=json.loads((ROOT/'dist/data/campus.json').read_text());R=ET.parse(ROOT/'dist/data/source.osm').getroot();ox,oz=D['origin'];sx=111320*math.cos(math.radians(oz));nodes={n.get('id'):((float(n.get('lon'))-ox)*sx,(float(n.get('lat'))-oz)*111320)for n in R.findall('node')}
count=0
for w in R.findall('way'):
 t={a.get('k'):a.get('v')for a in w.findall('tag')}
 if 'building:part'not in t:continue
 ps=[nodes[n.get('ref')]for n in w.findall('nd')if n.get('ref')in nodes]
 if len(ps)<4:continue
 p=Polygon(ps).buffer(0)
 for b in D['buildings']:
  parent=Polygon(b['p'],b.get('holes',[]));cut=parent.intersection(p)
  if cut.area<.8*p.area:continue
  h=float(t.get('height',float(t.get('building:levels',2))*3.3));rest=parent.difference(p)
  parts=[]
  for geom,height,label in [(cut,h,'OSM building:part levels × estimated 3.3m'),(rest,b['h'],b['heightSource'])]:
   polys=[geom]if geom.geom_type=='Polygon'else list(geom.geoms)
   for poly in polys:
    if poly.area<2:continue
    parts.append({'p':list(poly.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in poly.interiors],'h':height,'heightSource':label})
  b['renderParts']=parts;count+=1;break
(ROOT/'dist/data/campus.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':')));print('Mapped multipart buildings',count)
