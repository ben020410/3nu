"""Union existing road corridors. Design widths, not PDF measurements."""
from pathlib import Path
import json
import shapely as S
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1]
N=json.loads((R/'dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text())
policy={'primary':15.5,'secondary':10,'residential':6,'living_street':5,'unclassified':6}
changes=[];buffers=[];zones={}
for i,r in enumerate(N['roads']):
 z=','.join(str(int(v//400)) for v in r['p'][0]);zones.setdefault(z,{'roads':0,'surfaceReviewed':0});zones[z]['roads']+=1
 if r.get('category')!='road':continue
 old=r['width'];target=policy.get(r['kind'],old)
 if old>=15:target=old
 if target!=old:changes.append({'index':i,'id':r['id'],'before':old,'after':target})
 r['width']=target;r['widthSource']='BUILD26 model design: existing class widths; not PDF measurement'
 buffers.append(LineString(r['p']).buffer(target/2,quad_segs=8,join_style=1));zones[z]['surfaceReviewed']+=1
kept=[s for s in N['surfaces'] if s['kind']!='road' or s.get('id') and not s['id'].startswith('roads26-')]
road=S.union_all(buffers)
footprints=S.union_all([S.make_valid(Polygon(b['p'],b.get('holes',[]))).buffer(.25) for b in D['buildings']])
road=road.difference(footprints);polys=[road] if road.geom_type=='Polygon' else list(road.geoms)
for i,g in enumerate(polys):
 if g.geom_type!='Polygon' or g.area<.05:continue
 kept.append({'id':'roads26-'+str(i),'kind':'road','outer':list(g.exterior.coords)[:-1],'holes':[list(r.coords)[:-1] for r in g.interiors],'source':'BUILD26 union of existing road corridors; building clearance cut; same height field'})
N['surfaces']=kept
report={'policyMetres':{'centralService':6,'secondary':10,'arterial':15.5,'livingStreet':5,'pedestrian':'existing 1.5–5; stairs retained'},'widthChanges':changes,'zones':zones,'roadSurfaceParts':len(polys),'newNetworkEdges':0,'buildingMoves':0,'notes':['PDF connectivity only','No arbitrary dead-end joins','Road junctions unioned before terrain partition','Ground patches use stable first-match priority shared with walking core']}
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(R/'BUILD26-ROADS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('width changes',len(changes),'zones',len(zones),'polygons',len(polys))
