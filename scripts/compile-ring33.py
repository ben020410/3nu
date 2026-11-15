"""Replace BUILD32 ring/branch material corridors; retain all other land-use areas.
No second carriageway slab. Nav heights are independent from material boundaries.
"""
import json,pathlib,math,collections
import numpy as np
import shapely as S
from ring33_partition import normalize_regions
from shapely.geometry import Polygon,LineString,Point,box
R=pathlib.Path(__file__).resolve().parents[1];O=R/'reports/build33'
N=json.loads((O/'prepared-walk.json').read_text());B=json.loads((O/'source-data/walk.json').read_text());A=json.loads((R/'sources/landuse31.json').read_text());H=json.loads((O/'height-samples.json').read_text())
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-8:yield g
 else:
  for p in getattr(g,'geoms',[]):yield from parts(p)
def clean(g):
 if g.geom_type in ('Polygon','MultiPolygon'):return g
 return S.union_all(list(parts(S.make_valid(g))),grid_size=.001)
def snap(g):return clean(S.make_valid(S.transform(g,lambda xy:np.round(xy,3))))
def poly(q):return snap(Polygon(q['outer'],q.get('holes',[])))
def diff(a,b):return clean(S.difference(clean(a),clean(b),grid_size=.001))
def inter(a,b):return clean(S.intersection(clean(a),clean(b),grid_size=.001))
def union(gs):return clean(S.union_all(gs,grid_size=.001))
def co(g):return {'outer':list(g.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in g.interiors]}
def smooth(a,sigma,closed):
 rad=math.ceil(sigma*3);weights=np.exp(-.5*(np.arange(-rad,rad+1)/sigma)**2);weights/=sum(weights)
 v=np.pad(a,rad,mode='wrap' if closed else 'edge');return np.convolve(v,weights,'valid')
# Use the existing global elevations, smoothing only the long ring profile.
h=np.array(H['ring']);h[:-1,2]=smooth(h[:-1,2],6,True);h[-1,2]=h[0,2]
a=np.array(H['approach']);a[:,2]=smooth(a[:,2],4,False);a[:,2]+=np.linspace(0,1,len(a))*(h[0,2]-a[-1,2]);N['ring33']['profile']=h.tolist();N['ring33']['approachProfile']=a.tolist()
N['ring33']['grade']={'halfWidth':7.65,'shoulder':10,'method':'smooth existing sampled world grade, flat transverse carriageway; design estimate'}
# Preserve non-ring width profiles and architecture. Their endpoint positions may
# move with the ring, but their category and width never inherit 15 m.
def shape(r):
 l=LineString(r['p'])
 if r.get('ring33'):return snap(l.buffer(7.5,quad_segs=8,join_style=1))
 profile=r.get('widthProfile32',[])
 if profile and max(p[1]for p in profile)-min(p[1]for p in profile)>.01:
  ds=sorted(set([0,l.length]+[min(l.length,i*3)for i in range(math.ceil(l.length/3))]));pp=np.array(profile);discs=[l.interpolate(d).buffer(float(np.interp(d,pp[:,0],pp[:,1]))/2,quad_segs=8)for d in ds]
  return snap(S.union_all(discs+[S.union_all([a,b]).convex_hull for a,b in zip(discs,discs[1:])]))
 return snap(l.buffer(r['width']/2,quad_segs=8,join_style=1))
changed=[(o,n)for o,n in zip(B['roads'],N['roads'])if o['p']!=n['p'] or o['width']!=n['width'] or n.get('ring33')]
coverage=snap(S.union_all([shape(o).buffer(.025)for o,n in changed]+[shape(n).buffer(.025)for o,n in changed]))
# Rendering cuts are the actual stair/bridge openings, not removable duplicates.
cuts=S.union_all([poly(q)for q in B.get('precinct29',{}).get('renderCuts',[])+B.get('landmarkCuts30',[])])
coverage=diff(coverage,cuts)
car=[];foot=[]
for r in N['roads']:
 if r['kind']=='steps':continue
 l=LineString(r['p'])
 if not l.buffer(r['width']/2+.5).intersects(coverage):continue
 g=inter(shape(r),coverage)
 (car if r['category']=='road' else foot).append(g)
road=union(car);paths=diff(union(foot),road)
regions=[({'kind':'road','source':'ring33 carriageway + retained branch junction'},road)]
# Existing courtyard footprints are retained at path junctions.
remaining=paths
for q in reversed(A['areas']):
 if q['kind']not in {'plaza','parking','soil'}:continue
 g=poly(q)
 if remaining.is_empty:break
 if not remaining.intersects(g):continue
 p=inter(remaining,g);remaining=diff(remaining,p)
 if p.area:regions.append(({'kind':q['kind'],'landuse31':q['id'],'source':q['source']},p))
regions.append(({'kind':'path'},remaining));remaining=diff(coverage,union([p for q,p in regions]))
for q in reversed(A['areas']):
 g=poly(q)
 if remaining.is_empty:break
 if not remaining.intersects(g):continue
 p=inter(remaining,g);remaining=diff(remaining,p)
 if p.area:regions.append(({'kind':q['kind'],'landuse31':q['id'],'source':q['source']},p))
# Keep any original non-road apron at the regraded interface, then restore grass
# only where the old carriageway has actually been retired outside authored areas.
for qi,q in enumerate(B['surfaces']):
 if qi%1000==0:print('restore surface',qi,flush=True)
 if q['kind']in {'road','path'}:continue
 g=poly(q)
 if remaining.is_empty:break
 if not remaining.intersects(g):continue
 p=inter(remaining,g);remaining=diff(remaining,p)
 if p.area:regions.append(({k:v for k,v in q.items()if k not in ['outer','holes','id','groundY','heightProfile']},p))
regions.append(({'kind':'grass','source':'retired road edge outside authored land use'},remaining))
print('Material partition ready',len(regions),flush=True)
S.prepare(coverage)
out=[];removed=0
for qi,q in enumerate(B['surfaces']):
 if qi%1000==0:print('clip surface',qi,flush=True)
 p=poly(q)
 if not p.intersects(coverage):out.append(q);continue
 rest=diff(p,coverage);removed+=1
 for i,g in enumerate(parts(rest)):out.append({**q,**co(g),'id':q.get('id','surface')+'-edge33-'+str(i)})
compiled=[]
for i,(q,p)in enumerate(regions):
 for j,g in enumerate(parts(p)):
  item={**q,**co(g),'id':f'ring33-{i}-{j}'};compiled.append(item)
compiled=normalize_regions(compiled);out.extend(compiled)
N['surfaces']=out
clear=LineString(N['ring33']['route']).buffer(8.5).union(LineString(N['ring33']['approach']).buffer(8.5));before=len(N['trees']);N['trees']=[t for t in N['trees']if not clear.contains(Point(t[:2]))]
N['ring33']['surfaceReplacement']={'oldSurfaceRecordsReplaced':removed,'newExclusiveRegions':len(compiled),'changedRoadRecords':len(changed),'treesRemovedFromCarriageway':before-len(N['trees']),'coverageArea':coverage.area}
(O/'material-regions.json').write_text(json.dumps({'coverage':[co(p)for p in parts(coverage)],'regions':compiled},separators=(',',':')))
(O/'prepared-walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
print(N['ring33']['surfaceReplacement']);print('Grade range',h[:,2].min(),h[:,2].max(),'max slope',max(abs(np.diff(h[:,2]))/np.linalg.norm(np.diff(h[:,:2],axis=0),axis=1)))
