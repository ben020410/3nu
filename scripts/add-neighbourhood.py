"""Existing OSM footprints outside campus; no invented buildings across main approaches."""
import json,pathlib,xml.etree.ElementTree as ET,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
r=pathlib.Path(__file__).resolve().parents[1];d=r/'dist/data';data=json.loads((d/'campus.json').read_text());nav=json.loads((d/'walk.json').read_text());xml=ET.parse(d/'source.osm').getroot();nodes={n.attrib['id']:((float(n.attrib['lon'])-126.952)*111320*math.cos(math.radians(37.459)),(float(n.attrib['lat'])-37.459)*111320) for n in xml.findall('node')};roads=unary_union([LineString(x['p']).buffer(x['width']/2+.8) for x in nav['roads']]);campus=Polygon(nav['campusBoundary']);ids={b['id'] for b in data['buildings']};added=[]
for w in xml.findall('way'):
 t={x.attrib['k']:x.attrib['v'] for x in w.findall('tag')};ident=w.attrib['id']
 if 'building' not in t or ident in ids:continue
 p=[nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]
 if len(p)<4:continue
 poly=Polygon(p)
 if not poly.is_valid:continue
 c=poly.centroid
 if not(-795<c.x<-350 and 1000<c.y<1245) or poly.intersects(roads) or campus.contains(c):continue
 h=float(t.get('building:levels','3'))*3.5
 data['buildings'].append({'id':ident,'name':t.get('name','교외 건물'),'p':[list(q) for q in p[:-1]],'holes':[],'h':h,'levels':round(h/3.5),'roof':'#787d83','source':'OpenStreetMap','heightSource':'estimated storey height; background facade stylized','urban':True});added.append(ident)
(d/'campus.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));print('outside OSM footprints added',added)
