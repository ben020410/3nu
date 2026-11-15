"""Reproducible BUILD13 partial correction. Never reduce unmatched cohort by deletion."""
import json,pathlib,math
from shapely.geometry import Point,Polygon
from shapely.ops import unary_union
root=pathlib.Path(__file__).resolve().parents[1]
p=root/'dist/data/campus.json';c=json.loads(p.read_text())
for patch in json.loads((root/'data-sources/build13-identity-patch.json').read_text()):
 b=next(b for b in c['buildings'] if b['id']==patch['id']);b.update(patch);b['identityVerification13']='Official name/number plus marker in footprint; geometry NOT verified'
p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
p=root/'dist/data/walk.json';w=json.loads(p.read_text())
# Preserve the road envelope and centre; reduce oversized generic traffic island.
# Radius visually estimated against the Naver 20 m scale, not survey data.
ring=Point(277.9,-22.9).buffer(7,resolution=32).difference(Point(277.9,-22.9).buffer(3.5,resolution=32))
def records(geom,kind):
 if geom.is_empty:return []
 if geom.geom_type=='Polygon':return [dict(kind=kind,outer=list(geom.exterior.coords)[:-1],holes=[list(r.coords)[:-1] for r in geom.interiors])]
 return sum((records(g,kind) for g in geom.geoms),[])
new=[]
for s in w['surfaces']:
 poly=Polygon(s['outer'],s.get('holes',[]));new+=records(poly.difference(ring),s['kind'])
new+=records(ring,'road');w['surfaces']=new
w['build13']={'trafficIsland':'Centre preserved; inner radius 3.5 m visually estimated, not surveyed','pungsan':'Custom shell and SE tiers; detailed measurement pending'}
p.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
