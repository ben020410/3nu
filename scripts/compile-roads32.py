"""BUILD32: exclusive road/walkway partition from immutable BUILD31 input.
No overlay meshes, changed building footprints, or architectural floor edits.
"""
import json,pathlib,math,collections,hashlib
import shapely as S
from shapely.geometry import Polygon,Point,LineString,box
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1]
N=json.loads((R/'reports/build32/prepared-walk.json').read_text());D=json.loads((R/'reports/build32/source-data/campus.json').read_text());A=json.loads((R/'sources/landuse31.json').read_text())
def polygonal(g):
 return S.union_all(list(parts(S.make_valid(g))))
def poly(q):return S.set_precision(polygonal(Polygon(q.get('outer',q.get('p')),q.get('holes',[]))),.00001)
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-7:yield g
 else:
  for q in getattr(g,'geoms',[]):yield from parts(q)
def co(g):return dict(outer=list(g.exterior.coords)[:-1],holes=[list(h.coords)[:-1]for h in g.interiors])
baseline=json.loads((R/'reports/build32/source-data/walk.json').read_text())
retiredSteps=S.union_all([LineString(a['p']).buffer(a['width']/2+.05) for a,b in zip(baseline['roads'],N['roads']) if a['kind']=='steps' and b['kind']!='steps'])
old=[];retiredStepArea=0
for s in N['surfaces']:
 p=poly(s)
 if s['kind']=='steps' and (not s.get('id') or s['id'].startswith('ground')):
  remainder=p.difference(retiredSteps);retiredStepArea+=p.area-remainder.area
  for g in parts(remainder):old.append({**s,**co(g)})
 else:old.append(s)
op=[poly(s)for s in old];ot=STRtree(op)
cut=S.union_all([poly(s)for s in N['precinct29']['renderCuts']+N.get('landmarkCuts30',[])])
build=S.union_all([poly(b)for b in D['buildings'] if not b.get('landmark30') and b['id']not in N['landmarks30']['buildings']]).buffer(.18)
# At ground level, a bridge/deck is not a building footprint. Its support solids
# are kept by the original architecture specification and excluded separately.
for q in N['landmarks30']['volumes']:
 if q['lo']<=N['landmarks30']['buildings'].get(q.get('building'),{}).get('base',-1)+1.8:build=S.union_all([build,poly(q).buffer(.18)])
protected=S.union_all([cut,build]+[p for s,p in zip(old,op)if s['kind']in {'steps','water','bank','track','turf','clay','courtGreen','courtApron','baseballDirt','infield','sportApron'}])
pavedAreas=[(a,poly(a))for a in A['areas']if a['kind']in {'plaza','parking','soil'}]
paved=S.union_all([p for a,p in pavedAreas]);woods=S.union_all([poly(a)for a in A['areas']if a['kind']=='wood'])
# Shared end widths only for the continuation of the same road class. A path
# entering a carriageway must not inherit its 10/15.5m width.
ends=collections.defaultdict(list)
for i,r in enumerate(N['roads']):
 for e in [0,-1]:ends[tuple(round(v,2)for v in r['p'][e])].append((i,e))
transitions={};taperlog=[]
for point,items in ends.items():
 car=[q for q in items if N['roads'][q[0]]['category']=='road' and N['roads'][q[0]]['kind']!='pedestrian']
 if len(car)!=2:continue
 (i,e),(j,f)=car;a,b=N['roads'][i],N['roads'][j]
 def tangent(r,e):
  p=r['p'][e];q=r['p'][1 if e==0 else -2];v=[q[k]-p[k]for k in [0,1]];d=math.hypot(*v);return[vv/(d or 1)for vv in v]
 av,bv=tangent(a,e),tangent(b,f)
 if sum(x*y for x,y in zip(av,bv))>-.78 or abs(a['width']-b['width'])<1:continue
 w=(a['width']+b['width'])/2
 transitions[i,e]=w;transitions[j,f]=w;taperlog.append(dict(ids=[a['id'],b['id']],at=point,widths=[a['width'],b['width']],joinWidth=w))
changes=[];rb=[];pb=[];zone=collections.defaultdict(lambda:dict(roads=0,walkways=0,widthEdits=0))
for i,r in enumerate(N['roads']):
 line=LineString(r['p']);z=','.join(str(math.floor(c/400))for c in r['p'][0]);isroad=r['category']=='road';zone[z]['roads'if isroad else'walkways']+=1
 w=r['width'];new=w
 if r['kind']=='footway' and w>=2 and not woods.covers(line):new=3.2
 elif r['kind']=='path' and paved.intersects(line):new=2.8
 if new!=w:changes.append(dict(id=r['id'],before=w,after=new,zone=z));zone[z]['widthEdits']+=1
 r['width']=new;r['widthSource']='BUILD32 existing class-based model metres; footways 3.2m / woodland paths retained; PDF topology only'
 if r['kind']=='steps':continue
 if isroad:
  length=line.length;positions=sorted(set([0,length]+[min(length,k*3)for k in range(int(length/3)+1)]));geom=[];profile=[]
  for d in positions:
   width=new
   for e,target in [(0,transitions.get((i,0))),(-1,transitions.get((i,-1)))]:
    if target is not None:
     t=min(1,(d if e==0 else length-d)/20);width=target+(new-target)*t
   p=line.interpolate(d);profile.append([round(d,3),round(width,3)]);geom.append(p.buffer(width/2,quad_segs=8))
  # Round joining discs and swept segment hulls, not overlapping rendered ribbons.
  g=S.union_all(geom+[S.union_all([aa,bb]).convex_hull for aa,bb in zip(geom,geom[1:])]);r['widthProfile32']=profile
  rb.append(g)
 else:pb.append(line.buffer(new/2,quad_segs=8,join_style=1))
road=S.set_precision(S.union_all(rb),.00001).difference(protected);paths=S.set_precision(S.union_all(pb),.00001).difference(protected).difference(road)
# Existing useful terminal aprons are retained. Replace only generic old strips;
# do not subtract courtyard/landscape regions except the small width interface.
generic=[];kept=[]
for s,p in zip(old,op):
 sid=s.get('id','');replace=s['kind']=='road' or s['kind']=='path'and(not sid or sid.startswith(('ground','approach26','connection26')))
 if replace:generic.append(p)
 else:kept.append((s,p))
oldcorr=S.union_all(generic);coverage=S.union_all([oldcorr,road,paths]).difference(protected)
regions=[];claimed=Polygon()
# Courtyard walkways become the courtyard's actual paving, with the same
# navigation centerlines. No narrow white strip through one continuous square.
for a,p in reversed(pavedAreas):
 g=p.intersection(paths.union(oldcorr)).difference(road).difference(protected).difference(claimed)
 if not g.is_empty:regions.append((dict(kind=a['kind'],landuse31=a['id'],source=a['source'],confidence=a['confidence']),g));claimed=S.union_all([claimed,g])
regions.extend([(dict(kind='road'),road),(dict(kind='path'),paths.difference(claimed))]);claimed=S.union_all([claimed,road,paths])
# Removed generic strips inside BUILD31 planting/lawn/forest return to that area.
remaining=coverage.difference(claimed)
for a in reversed(A['areas']):
 g=remaining.intersection(poly(a));regions.append((dict(kind=a['kind'],landuse31=a['id'],source=a['source'],confidence=a['confidence']),g));remaining=remaining.difference(g)
# Unchanged legacy path tails outside new corridors keep their original material.
regions.append((dict(kind='grass',source='retired corridor edge; no added route'),remaining))
# One exclusive classification, with all previous first-match height constraints
# partitioned into it. Elevated architecture is a separate layer and remains intact.
height=[i for i,s in enumerate(old)if s.get('groundY')is not None or s.get('heightProfile')];hs=set(height);out=[]
for k,(s,g)in enumerate(regions):
 if g.is_empty:continue
 # Spatially tile the boolean operation, not the rendered road. This avoids
 # repeatedly subtracting a small height patch from one campus-size polygon.
 xmin,zmin,xmax,zmax=g.bounds
 for ix in range(math.floor(xmin/200),math.floor(xmax/200)+1):
  for iz in range(math.floor(zmin/200),math.floor(zmax/200)+1):
   part=g.intersection(box(ix*200,iz*200,(ix+1)*200,(iz+1)*200));rest=part
   if part.is_empty:continue
   for i in sorted(ot.query(part,predicate='intersects')):
    if i not in hs:continue
    q=rest.intersection(op[i]);rest=rest.difference(op[i])
    for j,p in enumerate(parts(q)):out.append({**s,**co(p),**{h:old[i][h]for h in ['groundY','heightProfile']if h in old[i]},'id':f'network32-{k}-{ix}-{iz}-h{i}-{j}'})
   for j,p in enumerate(parts(rest)):out.append({**s,**co(p),'id':f'network32-{k}-{ix}-{iz}-{j}'})
 if k%20==0:print('material region',k,'surfaces',len(out),flush=True)
print('partitioned',len(out),'regions',flush=True)
cover=S.set_precision(polygonal(S.union_all([g for s,g in regions])),.0001);removed=0
for s,p in zip(old,op):
 # Repeated unions can leave sub-millimetre self-touching rings. Normalize
 # topology before subtraction; this is geometry repair, not a render offset.
 rest=S.difference(polygonal(p),cover,grid_size=.0001)
 if not rest.equals(p):removed+=1
 for j,g in enumerate(parts(rest)):out.append({**s,**co(g),'id':s.get('id','ground')+f'-edge32-{j}'} if not rest.equals(p) else s)
N['groundProfiles32']=[{k:s[k] for k in ['id','outer','holes','groundY','heightProfile'] if k in s} for s in old if s.get('groundY') is not None or s.get('heightProfile')]
N['surfaces']=out
# Clear only trees whose centers are newly inside the physical passage surface.
treeold=len(N['trees']);clearance=S.union_all([road,paths]).buffer(.5)
N['trees']=[t for t in N['trees']if not clearance.contains(Point(t[:2]))]
N['roads32']={'policy':{'primary':15.5,'secondary':10,'service':6,'pedestrianPlazaApproach':5,'openFootway':3.2,'courtPath':2.8,'forestPath':'existing 2–2.4','steps':'existing geometry retained'},'widthChanges':changes,'tapers':taperlog,'zoneGrid400m':dict(zone),'surfaceReplacementCount':removed,'treesClearedFromPassage':treeold-len(N['trees']),'courtyardMergeAreaM2':round(sum(g.area for s,g in regions if s.get('landuse31')and s['kind']in ['plaza','parking','soil']),2),'note':'BUILD31 area boundaries preserved except road/path edge interfaces. All material regions partition the original heightfield; no raised cover plates.'}
N['roads32']['retiredLegacyStepMaterialM2']=round(retiredStepArea,2)
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(R/'reports/build32/road-policy.json').write_text(json.dumps(N['roads32'],ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in N['roads32'].items()if k not in ['widthChanges','zoneGrid400m']},ensure_ascii=False,indent=2));print('width changes',len(changes),'surfaces',len(out))
