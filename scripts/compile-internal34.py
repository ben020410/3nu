#!/usr/bin/env python3
"""Compile BUILD34 from immutable BUILD33 data. Does not write live dist.

Visible road strips inside authored paved courts are replaced by the court's
material; the independent access graph is retained. Structural floors remain
separate from ground, and ring-road geometry is excluded from every replacement.
"""
import copy, hashlib, json, pathlib, argparse
parser=argparse.ArgumentParser()
parser.add_argument("--material-only", action="store_true", help="Preserve baseline heights, floors, rails and collision; only partition existing ground materials")
MATERIAL_ONLY=parser.parse_args().material_only
import shapely as S
from shapely.geometry import Polygon, LineString

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'reports/build34'
def read(p): return json.loads(p.read_text())
def write(name,q): (OUT/name).write_text(json.dumps(q,ensure_ascii=False,separators=(',',':')))
def geom(q): return S.make_valid(Polygon(q.get('outer',q.get('p')),q.get('holes',[])))
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-7: yield g
 else:
  for q in getattr(g,'geoms',[]): yield from parts(q)
def records(g,extra=None):
 return [dict(extra or {},outer=[list(p) for p in q.exterior.coords[:-1]],holes=[[list(p) for p in h.coords[:-1]] for h in q.interiors]) for q in parts(g)]
def union(qs): return S.union_all([geom(q) for q in qs]) if qs else S.GeometryCollection()
def signature(q): return hashlib.sha256(json.dumps(q,sort_keys=True,separators=(',',':')).encode()).hexdigest()
N=read(OUT/'source-data/walk.json'); C=read(OUT/'source-data/campus.json')
A=read(ROOT/'sources/landuse31.json')['areas']; audit=read(OUT/'audit-input.json'); plan=read(OUT/'terrain34-plan.json')
result=copy.deepcopy(N); lib=result['precinct29']['library']
ring_before=signature(N['ring33']); ring_roads=[r for r in N['roads'] if r.get('ring33')]
ring= S.union_all([LineString(r['p']).buffer(7.55,quad_segs=8,join_style=1) for r in ring_roads])
if not MATERIAL_ONLY:
 remove=set(plan['librarySurfacesRemoveIds']); retired=[s for s in lib['surfaces'] if s['id'] in remove]
 retired_union=union(retired)
 lib['surfaces']=[s for s in lib['surfaces'] if s['id'] not in remove]+plan['librarySurfacesAdd']
 lib['routes'].update(plan['routesReplace'])
 # Existing cuts are merged polygons: remove only the retired staircase footprint.
 subtract=union(plan.get('renderCutsSubtract',[])) if plan.get('renderCutsSubtract') else retired_union
 cuts=union(result['precinct29']['renderCuts']).difference(subtract).union(union(plan['renderCutsAdd']))
 result['precinct29']['renderCuts']=records(cuts)
 rail_domain=union(plan.get('railsRemoveDomains',[]))
 old_rails=lib.get('rails',[])
 lib['rails']=[r for r in old_rails if not LineString([r['a'],r['b']]).intersects(rail_domain)]+plan.get('railsAdd',[])
 gremove=set(plan['groundProfilesRemoveIds'])
 result['groundProfiles32']=[p for p in result['groundProfiles32'] if p['id'] not in gremove]+plan['groundProfilesAdd']
 result['terrainOverrides34']=plan['terrainOverrides34']; result['roadGradeExclusions34']=plan['roadGradeExclusions34']
 # Old flat landing collision blockers must disappear with their retired surfaces.
 old_solids=lib.get('groundSolids',[])
 removed_solids=[]; kept_solids=[]
 for q in old_solids:
  p=geom(q)
  if p.area and p.intersection(retired_union).area/p.area>.95:
   removed_solids.append(q['id'])
  else: kept_solids.append(q)
 lib['groundSolids']=kept_solids
else:
 remove=set(); retired_union=S.GeometryCollection(); removed_solids=[]
 cuts=union(result["precinct29"]["renderCuts"]); old_rails=lib.get("rails",[])
buildings=S.union_all([geom(b) for b in C['buildings'] if len(b.get('p',[]))>=3])
structural=cuts.union(union(N.get('landmarkCuts30',[])))
protected=ring.union(structural).union(buildings)
area_by_id={a['id']:a for a in A}; roads_by_index=N['roads']
regions=[]; accepted=S.GeometryCollection(); actions=[]
# Explicit rear corridor ownership is first; do not discard elevated structures.
for p in ([] if MATERIAL_ONLY else plan['pavingOwnership']):
 g=geom(p).difference(protected).difference(accepted)
 regions += records(g,{'id':p['id'],'kind':p['kind'],'source34':'authored-corridor-ground'})
 accepted=accepted.union(g)
# Each candidate keeps graph access and its portions outside the authored court.
# A service road can use the same paving material without becoming a new road.
for i,c in enumerate(audit['campuswideRoadWithinAuthoredPlaza']):
 a=area_by_id[c['areaId']]; r=roads_by_index[c['roadIndex']]
 if r.get('ring33'): continue
 if a['kind'] not in ('plaza','parking','path','soil','clay','courtApron','sportApron'): continue
 width=max([float(r.get('width',3))]+[float(t[1]) for t in r.get('widthProfile32',[])])
 ribbon=LineString(r['p']).buffer(width/2+.15,quad_segs=8,join_style=1)
 g=geom(a).intersection(ribbon).difference(protected).difference(accepted)
 if g.area<=1e-6: continue
 regions += records(g,{'id':f"court34-{i}-{a['id']}",'kind':a['kind'],'source34':a.get('source','landuse31')})
 accepted=accepted.union(g)
 actions.append({'roadId':r['id'],'roadIndex':c['roadIndex'],'areaId':a['id'],'zone':a['zone'],'areaM2':round(g.area,3),'action':'replace visible strip inside authored court only; retain access graph and outside segments','reason':'authored court already owns this ground-level circulation; separate ribbon is duplicate visual use'})
coverage=accepted
# Replace old ground polygons in-place, never append an overlapping cover plate.
surfaces=[]; touched=[]
for s in result['surfaces']:
 p=geom(s)
 if not p.intersects(coverage): surfaces.append(s); continue
 out=p.difference(coverage)
 if abs(out.area-p.area)<1e-7: surfaces.append(s); continue
 touched.append(s.get('id','unnamed'))
 meta={k:v for k,v in s.items() if k not in ('outer','holes','p')}
 for j,q in enumerate(records(out,meta)):
  if 'id' in q:q['id']=f"{q['id']}-cut34-{j}"
  surfaces.append(q)
for i,r in enumerate(regions):
 surfaces.append(dict(r,id=f"internal34-{i}-{r['id']}",source='BUILD34 exclusive ground ownership',confidence='adapted-circulation',internal34=True))
result['surfaces']=surfaces
# Retired source holes are restored only where no surviving structure exists;
# mesh compiler additionally subtracts all existing triangles before filling.
fill=retired_union.difference(protected)
fill_records=records(fill,{'id':'retired-physics34-cut','kind':'plaza','heightProfile':plan['terrainOverrides34'][0]['heightProfile']})
material={'version':'BUILD34','source':'immutable BUILD33 baseline','coverage':records(coverage),'regions':regions,'gradeAreas':([] if MATERIAL_ONLY else plan['gradeAreas']),'fillPolygons':fill_records,'fillExclusions':records(protected),'notes':['Navigation graph is unchanged; visual path ownership differs from route connectivity.','Ring33 geometry and road records are byte-equivalent JSON values.','Baseline stairs, heights and collision are preserved.' if MATERIAL_ONLY else 'New stairs replace retired stairs; no overlapping cover plate is created.']}
result['internal34']={'version':'BUILD34','roadVisualOwnership':actions,'removedLibrarySurfaces':sorted(remove),'removedGroundSolids':removed_solids,'retainedNavigation':True,'remainingScope':'Five-area bespoke remodelling beyond completed ownership replacement remains unverified; do not report whole campus complete.'}
if MATERIAL_ONLY:
 assert result['precinct29']==N['precinct29']
 assert result['groundProfiles32']==N['groundProfiles32']
assert signature(result['ring33'])==ring_before
assert [r for r in result['roads'] if r.get('ring33')]==ring_roads
assert result['points']==N['points'] and result['edges']==N['edges']
write('candidate-walk34.json',result);write('material-regions.json',material)
report={'mode':'material-only' if MATERIAL_ONLY else 'full-unverified','version':'BUILD34','ring33Sha256':ring_before,'ringRoadsPreserved':len(ring_roads),'replacedRoadCourtIntersections':len(actions),'actions':actions,'modifiedSurfaceCount':len(touched),'modifiedSurfaceIds':touched,'replacementAreaM2':round(coverage.area,3),'retiredCutsRestoreAreaM2':round(fill.area,3),'removedLibrarySurfaces':sorted(remove),'removedGroundSolids':removed_solids,'removedRails':len(old_rails)-len(lib['rails']),'limitations':['No new satellite alignment or new routes were inferred.','Existing authored ground ownership only; unsafe height candidate excluded.' if MATERIAL_ONLY else 'Existing authored ground ownership plus unverified stair candidate.','Screen/walking verification must be performed by root before publication.']}
write('compiler-report.json',report)
print(json.dumps({k:v for k,v in report.items() if k not in ('actions','modifiedSurfaceIds')},ensure_ascii=False,indent=2))
