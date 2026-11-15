import json,pathlib
from shapely.geometry import Polygon
from shapely.ops import unary_union
root=pathlib.Path(__file__).resolve().parents[1]
# Manual visible roof vertex trace. 301 NW corner anchors translation; Naver DOM scale=84px/20m.
# Roof lean / anchor uncertainty remain; this is NOT survey-grade registration.
def world(q):return [round(20.625+(q[0]-1103)/4.2,3),round(-948.328-(q[1]-293)/4.2,3)]
parts=[{'name':'north-wing','p':[[731,260],[831,260],[905,222],[935,273],[856,312],[790,317],[733,317]],'h':27,'rows':5}, {'name':'south-wing','p':[[800,420],[952,420],[952,473],[861,476],[774,512],[755,466]],'h':22,'rows':4}, {'name':'atrium','p':[[779,316],[896,289],[920,420],[800,449]],'h':28,'rows':6}]
for part in parts:part['p']=[world(q) for q in part['p']]
c=json.loads((root/'dist/data/campus.json').read_text());b=next(b for b in c['buildings'] if b['id']=='official-303');shape=unary_union([Polygon(p['p']) for p in parts]);assert shape.geom_type=='Polygon'
b['p']=list(shape.exterior.coords)[:-1];b['parts14']=parts;b['h']=28;b['levels']=7;b['heightSource']='Official exterior photo: stepped north/south wings. 27/22/28m photo estimates; seven storeys reported, no surveyed section.';b['collisionPolygons']=[b['p']];b['trace14']={'reference':'build14-reference-303.png','scalePixelsPerMetre':4.2,'anchor':{'pixel':[1103,293],'world':[20.625,-948.328]},'status':'manual roof trace; multi-point registration still under review','parts':3}
(root/'dist/data/campus.json').write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
w=json.loads((root/'dist/data/walk.json').read_text());polys=[('parking',Polygon([world(q) for q in [[494,373],[614,245],[720,245],[737,390],[755,456],[799,524],[709,563],[493,566]]])),('plaza',Polygon([world(q)for q in [[930,209],[986,210],[1076,198],[1078,286],[980,307],[962,480],[958,504],[866,501],[860,477],[952,473],[952,420],[920,420],[896,289],[935,273]]]))]
area=unary_union([q for k,q in polys]);out=[]
def emit(q,k):
 if q.is_empty:return
 if q.geom_type=='Polygon':out.append({'kind':k,'outer':list(q.exterior.coords)[:-1],'holes':[list(r.coords)[:-1] for r in q.interiors]})
 elif hasattr(q,'geoms'):
  for p in q.geoms:emit(p,k)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(area),s['kind'])
for k,q in polys:emit(q,k)
w['surfaces']=out;(root/'dist/data/walk.json').write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
(root/'BUILD14-303-trace.json').write_text(json.dumps({'building':b,'surfaceCoordinates':[(k,list(q.exterior.coords))for k,q in polys]},ensure_ascii=False,indent=2))
