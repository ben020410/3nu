"""Compile one owned surface atlas from the recoverable BUILD28 state.
Same-level landings are unioned, ground courts have no second deck, and grade
corrections are resolved once rather than left as competing runtime patches.
Architectural layers (0m passage, 7m bridge, 22m garden) remain independent.
"""
import json,math,pathlib,subprocess,collections
import shapely as S
from shapely.geometry import Polygon,Point,LineString,box
from shapely.ops import transform
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1]
def old(path):return json.loads(subprocess.check_output(['git','show','build28-before-cleanup29:'+path],cwd=R,text=True))
N=old('dist/data/walk.json'); L=old('BUILD28-AFTER-SPEC.json');base=L['base'];u=L['u'];v=L['v'];o=L['origin']
def world(g):return transform(lambda a,d:(o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d),g)
def poly(q):return S.make_valid(Polygon(q.get('p',q.get('outer')),q.get('holes',[])))
def polys(g):return [g]if g.geom_type=='Polygon' else [p for h in getattr(g,'geoms',[]) for p in polys(h)]
def pack(g,key='outer'):return {key:[list(p)for p in list(g.exterior.coords)[:-1]],'holes':[[list(p)for p in list(r.coords)[:-1]]for r in g.interiors]}
def clean(g):return S.set_precision(S.make_valid(g),.00001)
scope=world(box(-55,-68,169,140));sourceSurfaces=L['surfaces'];changes=[]
# Audit competing authored regions separately from actual render overlap: the
# ground generator already selects one triangle owner, while collision still
# consulted the entire ordered list of overlapping height patches.
hq=[q for q in N['surfaces']if q.get('groundY')is not None or q.get('heightProfile')]
groundPairs=[]
for i,q in enumerate(hq):
 g=poly(q).intersection(scope)
 if g.is_empty:continue
 for r in hq[i+1:]:
  area=g.intersection(poly(r)).area
  if area>.01:groundPairs.append({'a':q['id'],'b':r['id'],'areaM2':round(area,3)})
flatPairs=[]
for i,q in enumerate(sourceSurfaces):
 if q.get('steps'):continue
 for r in sourceSurfaces[i+1:]:
  if r.get('steps')or abs(q['lo']-r['lo'])>.001:continue
  area=poly(q).intersection(poly(r)).area
  if area>.01:flatPairs.append({'a':q['id'],'b':r['id'],'areaM2':round(area,3),'height':q['lo']})
# True ground courts: remove their slab/foundation and let the terrain own the
# visible paving AND ground height. No raised cover plate.
groundIds={'main-front-court','main-front-door-pad','yangdu-court','education-entry-pad','entry-recess','front-court','main-side-piloti','main-opposite-piloti','opposite-court','rear-passage20','annex20-grade-join','third-rear-join20'}
newGround=[];floorInput=[]
for q in sourceSurfaces:
 groundOwned=q['id'] in groundIds or q.get('groundOwned28') or q['id'].startswith(('humanities-connection','rear-access'))
 if groundOwned:
  g=poly(q)
  # Replace the clipped zigzag at the far bank's toe with the existing lower
  # court's straight edge. This expands the ground domain, not a second slab.
  if q['id']=='rear-access-2':g=S.union_all([g,world(box(126,-26,145,-18))])
  newGround.append({'id':'owned29-'+q['id'],'kind':'rearPaving'if q['id'].startswith(('rear','annex','near','far','third-rear','yangdu'))else'plaza',**pack(g),'groundY':base+q['lo'],'source':'Canonical precinct ground; design elevation, not survey'})
  changes.append({'id':q['id'],'action':'ground owns top; redundant library floor/deck removed'})
 else:floorInput.append(q)
# Remove same-height flat route tails under a ground court, without trimming
# upper flights or the ground floor under a bridge.
for q in floorInput:
 if q.get('steps'):continue
 masks=[poly(r)for r in newGround if abs(r['groundY']-base-q['lo'])<.001]
 g=poly(q).difference(S.union_all(masks)) if masks else poly(q)
 q['_geometry']=clean(g)
# Main piloti previously had an extra 0.035m plate, independent of walking.
main=next(q for q in L['volumes']if q['id']=='main-body')
newGround.append({'id':'owned29-main-piloti','kind':'plaza',**pack(poly(main)),'groundY':base,'source':'Main ground floor; first floor/roof remain separate'})
# Prefer existing forecourts at +4.45m over this underlying piloti domain.
# Union only equal-height/equal-owner surfaces; never combine floor levels.
merged=[];groups=collections.defaultdict(list)
volumeIds={'annex20-roof','annex20-bridge'}
for q in floorInput:
 if q.get('steps'):
  merged.append({**q,'owner':'stairs','category29':'stairs'});continue
 owner='structure'if q['id'].startswith('student22-') else 'walkway'
 groups[(round(q['lo'],5),owner)].append(q)
for (h,owner),qs in groups.items():
 geom=clean(S.union_all([q.get('_geometry',poly(q))for q in qs]))
 for i,g in enumerate(polys(geom)):
  if g.area<.001:continue
  contributors=[q['id']for q in qs if g.intersection(q.get('_geometry',poly(q))).area>.001]
  merged.append({'id':f'floor29-{h}-{owner}-{i}','sources':contributors,**pack(g,'p'),'lo':h,'hi':h,'steps':0,'owner':owner,'category29':'walkway','from':None,'to':None})
# A single floor finish at +22 replaces the overlapping main roof cap, timber
# plate and covered-floor plate. No 2/8cm offsets and no render-order trick.
roofGeom=S.union_all([poly(q)for q in merged if q['lo']==22 and not q.get('steps')])
wood=roofGeom.intersection(world(box(24,12,107,39)))
merged=[q for q in merged if q['lo']!=22 or q.get('steps')]
for material,g in [('timber',wood),('paving',roofGeom.difference(wood))]:
 for i,p in enumerate(polys(clean(g))):merged.append({'id':f'roof29-{material}-{i}',**pack(p,'p'),'lo':22,'hi':22,'steps':0,'from':None,'to':None,'owner':'walkway','material':material,'category29':'walkway','sources':['main-roof','roof-covered-walk','roof-back-link','roof-timber-deck','covered-stone-floor']})
# Consolidate horizontal surface ownership at volume interfaces.
for q in L['volumes']:
 if q['id'] in ['main-body','annex20-roof-slab','annex20-bridge']:q['omitTop29']=True
L['surfaces']=merged;L['canonical29']=True;L.pop('roofOwnedByVolume28',None)
oldSolids=L['groundSolids'];L['groundSolids']=[q for q in oldSolids if not q['id'].endswith('-foundation')]
L['rails']=L.pop('rails28');L['ownership29']={'ground':'nav.surfaces','stairs':'library17.surfaces owner=stairs','upper':'library17.surfaces owner=walkway','student':'volume-owned stair tops; lookup only','levels':'3F bridge 7m, 5F garden 22m; not joined'}
# Resolve EVERY local ground patch into disjoint geometry in first-match order.
# Raw terrain is a continuous base, not another visible overlay.
oldLocal=[];outside=[]
for q in N['surfaces']:
 if q.get('id','').startswith('far28-bank'):
  # Regrade the planting bank to meet the reclaimed court at zero, preserving
  # the seven-metre upper walk. Remove its previous piecewise stair profile.
  q={**q,'heightProfile':[[*world(Point(134,-26)).coords[0],base],[*world(Point(134,-42)).coords[0],base+7]]}
 g=clean(poly(q));inside=g.intersection(scope);out=g.difference(scope)
 for p in polys(out):
  if p.area>.001:outside.append({**q,**pack(p)})
 for p in polys(inside):
  if p.area>.001:oldLocal.append({**q,**pack(p)})
ordered=newGround+[q for q in oldLocal if q.get('groundY')is not None or q.get('heightProfile')]+[q for q in oldLocal if q.get('groundY')is None and not q.get('heightProfile')]
occupied=Polygon();resolved=[]
for q in ordered:
 g=clean(poly(q).intersection(scope).difference(occupied));occupied=clean(S.union_all([occupied,poly(q).intersection(scope)]))
 for p in polys(g):
  if p.area>.001:resolved.append({**q,**pack(p)})
# Adjacent matching finish + height definitions become one semantic domain.
groups=collections.defaultdict(list)
for q in resolved:groups[json.dumps([q['kind'],q.get('groundY'),q.get('heightProfile')],sort_keys=True)].append(q)
resolved=[]
for j,qs in enumerate(groups.values()):
 for i,p in enumerate(polys(clean(S.union_all([poly(q)for q in qs])))):
  if p.area>.001:resolved.append({**{k:v for k,v in qs[0].items()if k not in ['outer','holes','id']},'id':f'precinct29-{j}-{i}','sources':[q.get('id','unnamed-material-region')for q in qs],**pack(p)})
N['surfaces']=resolved+outside
# Remove previous local retaining-face generators; the final partition owns
# boundary walls. Existing outside precinct faces are kept, never redrawn.
N['designGround23']=[q for q in N.get('designGround23',[])if not poly(q).intersects(scope)]
N.pop('junction28',None)
N['precinct29']={'library':L,'scope':pack(scope),'description':'one compiled ground partition and one architectural floor atlas; generated from BUILD28 baseline','gradeFaces':[]}
# Ground-supported stairs replace their terrain top exactly, not two top layers.
# Their subsurface profile remains for collision fallback; treads have closed sides.
N['precinct29']['renderCuts']=[pack(poly(q))for q in merged if q.get('earthSupported28') or q['id'].startswith('main-front-') and q.get('steps')]
# Boundary walls use FINAL height ownership; no independent legacy height source.
height_q=[q for q in N['surfaces']if q.get('groundY')is not None or q.get('heightProfile')];height_g=[poly(q)for q in height_q];ht=STRtree(height_g)
def ground(x,z):
 pt=Point(x,z)
 for ix in sorted(ht.query(pt,predicate='intersects')):
  q=height_q[ix]
  if not q.get('heightProfile'):return q['groundY']
  near=None
  for a,b in zip(q['heightProfile'],q['heightProfile'][1:]):
   dx,dz=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz or 1)));dd=(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2
   if near is None or dd<near[0]:near=dd,a[2]+t*(b[2]-a[2])
  return near[1]
 n=N['terrain']['n'];H=N['terrain']['values'];x0,z0,x1,z1=N['bounds'];uu=max(0,min(n-1.00001,(x-x0)/(x1-x0)*(n-1)));vv=max(0,min(n-1.00001,(z-z0)/(z1-z0)*(n-1)));i,j=int(uu),int(vv);a,b=uu-i,vv-j;A=H[j*n+i];B=H[j*n+i+1];C=H[(j+1)*n+i];D=H[(j+1)*n+i+1]
 return A+a*(B-A)+b*(C-A) if a+b<=1 else D+(1-a)*(C-D)+(1-b)*(B-D)
# Terrain top is absent under earth-supported treads. Their SINGLE stair mesh
# must close to the neighboring grade, not end as a thin floating slab.
# Elevated stairs/bridge/garden retain their open underside.
for q in merged:
 if not(q.get('earthSupported28')or q['id'].startswith('main-front-')and q.get('steps')):continue
 a,b=q['from'],q['to'];dx,dz=b[0]-a[0],b[1]-a[1];ll=math.hypot(dx,dz);nx,nz=-dz/ll,dx/ll
 samples=[]
 for k in range(q['steps']+1):
  t=k/q['steps'];x,z=a[0]+dx*t,a[1]+dz*t
  samples.extend(ground(x+nx*sign*(q['width']/2+.025),z+nz*sign*(q['width']/2+.025))-base for sign in[-1,1])
 q['foundation29']=min(q['lo']-.3,min(samples))
faces=[];seen=set();solids=[(poly(q),q)for q in L['volumes']];cuts=S.union_all([poly(q)for q in N['precinct29']['renderCuts']])
for g in height_g:
 if not g.intersects(scope):continue
 for ring in [g.exterior,*g.interiors]:
  ps=list(ring.coords)
  for a,b in zip(ps,ps[1:]):
   dx,dz=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dz)
   if length<.001:continue
   nx,nz=-dz/length,dx/length;count=math.ceil(length/1.2)
   for k in range(count):
    p=[a[0]+dx*k/count,a[1]+dz*k/count];r=[a[0]+dx*(k+1)/count,a[1]+dz*(k+1)/count];m=Point((p[0]+r[0])/2,(p[1]+r[1])/2)
    if not scope.intersects(m):continue
    key=tuple(sorted((tuple(round(c,4)for c in p),tuple(round(c,4)for c in r))))
    if key in seen:continue
    seen.add(key);samples=[[p[0]+dx/length*.002,p[1]+dz/length*.002],[r[0]-dx/length*.002,r[1]-dz/length*.002]]
    ys=[[ground(q[0]+nx*sign*.02,q[1]+nz*sign*.02)for q in samples]for sign in[-1,1]]
    if max(abs(ys[0][i]-ys[1][i])for i in[0,1])<.055:continue
    lo,hi=min(*ys[0],*ys[1]),max(*ys[0],*ys[1])
    if any(g.buffer(.01).intersects(m)and base+q['lo']<=lo+.05 and base+q['hi']>=hi-.05 for g,q in solids):continue
    faces.extend([p[0],ys[0][0],p[1],r[0],ys[0][1],r[1],r[0],ys[1][1],r[1],p[0],ys[0][0],p[1],r[0],ys[1][1],r[1],p[0],ys[1][0],p[1]])
N['precinct29']['gradeFaces']=faces
# Ignore obsolete source metadata in runtime. Source history stays in Git.
N.pop('precinct20',None);N.pop('rear23',None)
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
report={'scope':N['precinct29']['scope'],'groundSourceOverlapPairsBefore':groundPairs,'flatFloorOverlapPairsBefore':flatPairs,'removedLibraryGroundFloors':changes,'groundFoundationsRemoved':[q['id']for q in oldSolids if q not in L['groundSolids']], 'before':{'floorDefinitions':len(sourceSurfaces),'localGroundDefinitions':len(oldLocal)},'after':{'floorDefinitions':len(merged),'localGroundDomains':len(resolved),'retainingTriangles':len(faces)//9},'keptMultiLevels':{'rearPassage':0,'bridgeAndOppositeRoof':7,'mainRoofGarden':22},'units':'m; design elevations, not surveyed','generator':'scripts/precinct29.py'}
(R/'BUILD29-CLEANUP.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items()if k in ['before','after']}));print('conflicting authored ground pairs',len(groundPairs),'samelevel floor pairs',len(flatPairs),'redundant ground floors removed',len(changes))
