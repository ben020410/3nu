"""Replace ground classifications from an immutable input; never overlay a plate.

Roads, building footprints, architectural floors and the terrain heightfield are
unchanged. Old height constraints are partitioned into the new area boundaries,
so rendering and walk-core consume exactly the same elevation definitions.
"""
import json,pathlib,random,hashlib,math,collections
import shapely
from shapely.geometry import Polygon,Point
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1]
N=json.loads((R/'reports/build31/source-data/walk.json').read_text())
D=json.loads((R/'reports/build31/source-data/campus.json').read_text())
A=json.loads((R/'sources/landuse31.json').read_text())
def poly(s):return shapely.make_valid(Polygon(s.get('outer',s.get('p')),s.get('holes',[])))
def polygons(g):
 if g.geom_type=='Polygon':
  if g.area>1e-7:yield g
 else:
  for q in getattr(g,'geoms',[]):yield from polygons(q)
def coords(g):return dict(outer=[list(p)for p in list(g.exterior.coords)[:-1]],holes=[[list(p)for p in list(r.coords)[:-1]]for r in g.interiors])
def digest(v):return hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()
old=N['surfaces'];oldp=[poly(s)for s in old];oldtree=STRtree(oldp)
protectedKinds={'road','path','steps','water','bank','track','turf','clay','courtGreen','courtApron','baseballDirt','infield','sportApron'}
roadmask=shapely.union_all([g for s,g in zip(old,oldp)if s['kind']in protectedKinds])
buildmask=shapely.union_all([poly(b)for b in D['buildings']])
# Do not erase real holes (courtyards) in the source building polygons.
cuts=shapely.union_all([poly(s)for s in N.get('precinct29',{}).get('renderCuts',[])+N.get('landmarkCuts30',[])])
mask=shapely.union_all([roadmask,buildmask,cuts])
claimed=Polygon();regions=[]
for a in reversed(A['areas']):
 g=poly(a).difference(mask).difference(claimed)
 regions.append((a,g));claimed=shapely.union_all([claimed,g])
regions.reverse()
coverage=claimed
# Partition original height overrides in the SAME order used by walk-core.
# No override is removed or given a new value, even under a new material.
heightidx=[i for i,s in enumerate(old)if s.get('groundY')is not None or s.get('heightProfile')]
heightset=set(heightidx)
new=[];stats=[]
for a,g in regions:
 remaining=g;parts=[]
 for i in sorted(oldtree.query(g,predicate='intersects')):
  if i not in heightset:continue
  q=remaining.intersection(oldp[i]);remaining=remaining.difference(oldp[i])
  for p in polygons(q):parts.append((p,{k:old[i][k]for k in ['groundY','heightProfile']if k in old[i]}))
 for p in polygons(remaining):parts.append((p,{}))
 for j,(p,h)in enumerate(parts):
  new.append(dict(id=f"landuse31-{a['id']}-{j}",kind=a['kind'],**coords(p),**h,landuse31=a['id'],source=a['source'],confidence=a['confidence']))
 stats.append(dict(id=a['id'],zone=a['zone'],kind=a['kind'],authoredArea=round(poly(a).area,2),effectiveArea=round(g.area,2),fragments=len(parts),heightPolicy=a['heightPolicy'],source=a['source'],note=a['note']))
# Keep old road/facility boundaries. Only replaced areas are removed; preserving
# original order keeps all existing elevation constraints semantically stable.
kept=[];removed=0;split=0
for s,g in zip(old,oldp):
 if not g.intersects(coverage):kept.append(s);continue
 rest=g.difference(coverage)
 if rest.equals(g):kept.append(s);continue
 removed+=1
 for j,q in enumerate(polygons(rest)):
  kept.append({**s,**coords(q),'id':s.get('id','ground')+f'-retained31-{j}' });split+=1
N['surfaces']=new+kept
# Canopy density and extent are area-based, seeded and reproducible. Retain trees
# outside the edited footprint; never populate streets or a building entrance.
trees=[t for t in N['trees']if not coverage.covers(Point(t[0],t[1]))]
treeclear=shapely.union_all([roadmask.buffer(2.3),buildmask.buffer(2.2),cuts])
added=0;rand=random.Random(310713);forestCount=collections.Counter()
for a,g in regions:
 if not a.get('treeDensity'):continue
 p=g.difference(treeclear);x0,z0,x1,z1=p.bounds if not p.is_empty else(0,0,0,0)
 wanted=int(p.area*a['treeDensity']);placed=[];cell={}
 for attempt in range(max(0,wanted*22)):
  if len(placed)>=wanted:break
  x,z=rand.uniform(x0,x1),rand.uniform(z0,z1);k=(int(x//3),int(z//3))
  if not p.contains(Point(x,z)):continue
  if any((x-u)**2+(z-v)**2<12.25 for ix in range(k[0]-2,k[0]+3)for iz in range(k[1]-2,k[1]+3)for u,v in cell.get((ix,iz),[])):continue
  # Varied heights/crowns; not a uniform rectangular planting grid.
  scale=rand.uniform(.48,1.36)if a['kind']=='wood' else rand.uniform(.42,.85)
  trees.append([round(x,3),round(z,3),round(scale,3)]);placed.append((x,z));cell.setdefault(k,[]).append((x,z))
 added+=len(placed);forestCount[a['zone']]+=len(placed)
N['trees']=trees
N['landuse31']={**A,'areas':stats,'method':'exclusive ground partition replacing old classes; original height constraints retained','roadsUnchanged':True,'heightfieldUnchanged':True,'buildingFootprintsUnchanged':True,'oldSurfacesReplacedOrSplit':removed,'oldFragmentsRetained':split,'newFragments':len(new),'effectiveAreaM2':round(coverage.area,2),'treesAdded':added,'treesPerZone':dict(forestCount)}
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(R/'reports/build31/area-ledger.json').write_text(json.dumps(N['landuse31'],ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:N['landuse31'][k]for k in ['oldSurfacesReplacedOrSplit','oldFragmentsRetained','newFragments','effectiveAreaM2','treesAdded','treesPerZone']},indent=2))
# Check true geometry, rather than suppressing depth conflicts at render time.
sumarea=sum(g.area for a,g in regions)
assert abs(sumarea-coverage.area)<1e-5,'Area overlap'
assert coverage.intersection(roadmask).area<1e-5,'Road overlap'
assert coverage.intersection(buildmask).area<1e-5,'Building overlap'
assert coverage.intersection(cuts).area<1e-5,'Architectural-floor overlap'
baseline=json.loads((R/'reports/build31/source-data/walk.json').read_text())
for k in ['terrain','roads','edges','points','precinct29','landmarks30']:
 assert digest(N[k])==digest(baseline[k]),k+' unexpectedly changed'
(R/'reports/build31/partition-check.json').write_text(json.dumps(dict(areaOverlapM2=round(sumarea-coverage.area,9),roadOverlapM2=round(coverage.intersection(roadmask).area,9),buildingOverlapM2=round(coverage.intersection(buildmask).area,9),areas=len(regions),unchanged=['terrain','roads','edges','points','precinct29','landmarks30'],allValid=all(g.is_valid for a,g in regions)),indent=2)+'\n')
