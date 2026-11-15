import json,pathlib,math
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
root=pathlib.Path(__file__).resolve().parents[1]
def world(q):return [118.303+(q[0]-508)/2.1,12.654-(q[1]-184)/2.1]
control=[{'name':'13 NW roof corner','pixel':[508,184],'world':[118.303,12.654]},{'name':'roundabout centre','pixel':[840,254],'world':[277.9,-22.9]},{'name':'65 NE roof corner','pixel':[596,448],'world':[162.947,-110.816]}]
for p in control:p['projectionPixel']=[508+(p['world'][0]-118.303)*2.1,184-(p['world'][1]-12.654)*2.1]
(root/'BUILD14-pungsan-registration.json').write_text(json.dumps({'scale':'63 visible CSS pixels / 30 metres','northUp':True,'controlPoints':control,'caution':'Manual pixel readings, roof displacement possible. Pixel residual is not surveyed positional accuracy.'},indent=2))
p=root/'dist/data/campus.json';c=json.loads(p.read_text());b=next(b for b in c['buildings']if b['id']=='193893586');b['pungsan13'].update(center=[302,-66],tread=1.55,roofHalfWidth=19.5,roofDepth=12.5,asymmetric=True);cfg=b['pungsan13'];f=cfg['front'];u=[-f[1],f[0]];b['collisionPolygons']=[[[302+u[0]*a+f[0]*d,-66+u[1]*a+f[1]*d]for a,d in [(-12,-7),(12,-7),(12,3.8),(-12,3.8)]]];p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=root/'dist/data/walk.json';w=json.loads(p.read_text());w['pungsan13']=cfg
plaza=Polygon([world(q) for q in [[817,288],[846,302],[876,293],[922,294],[948,312],[967,338],[976,359],[969,384],[947,411],[912,434],[876,435],[847,417],[818,389],[800,367],[801,330]]])
lawn=Polygon([world(q)for q in [[868,290],[901,228],[970,161],[1024,91],[1140,57],[1195,86],[1162,191],[1124,260],[1093,330],[1067,443],[1026,554],[1005,603],[959,647],[901,594],[834,531],[795,461],[813,405]]])
roads=unary_union([LineString(r['p']).buffer(r['width']/2)for r in w['roads']]);lawn=lawn.difference(roads).difference(plaza);plaza=plaza.difference(roads);area=unary_union([plaza,lawn]);out=[]
def emit(q,k):
 if q.is_empty:return
 if q.geom_type=='Polygon':out.append({'kind':k,'outer':list(q.exterior.coords)[:-1],'holes':[list(r.coords)[:-1] for r in q.interiors]})
 elif hasattr(q,'geoms'):
  for t in q.geoms:emit(t,k)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(area),s['kind'])
emit(lawn,'lawn');emit(plaza,'plaza');w['surfaces']=out;p.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
