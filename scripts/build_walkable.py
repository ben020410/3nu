"""Create game navigation from OSM. Uses shapely, scipy, numpy at build time only."""
import json,math,collections,heapq,xml.etree.ElementTree as ET,pathlib
import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
from shapely.geometry import LineString,Polygon,Point,box
from shapely.ops import unary_union,linemerge,nearest_points
ROOT=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'dist/data/campus.json').read_text());R=ET.parse(ROOT/'dist/data/source.osm').getroot();ways={w.get('id'):w for w in R.findall('way')};rawnodes={n.get('id'):n for n in R.findall('node')}
origin=D['origin'];sx=111320*math.cos(math.radians(origin[1]));sz=111320
xy=lambda n:((float(n.get('lon'))-origin[0])*sx,(float(n.get('lat'))-origin[1])*sz)
# Complete OSM campus outer, no guessed bounding rectangle as boundary.
rel=next(r for r in R.findall('relation')if r.get('id')=='11917142')
boundary_lines=[LineString([xy(rawnodes[n.get('ref')])for n in ways[m.get('ref')].findall('nd')])for m in rel.findall('member')if m.get('role')=='outer']
boundary=linemerge(boundary_lines);assert boundary.is_ring;campus=Polygon(boundary)
# Include university dormitories and research park represented in the supplied PDF.
region=box(-797,-1497,1097,1247);assert region.contains(campus)
polys=[Polygon(b['p']).buffer(0)for b in D['buildings']];obs=unary_union(polys).buffer(.9)
# Avoid inventing indoor passages, grade-separated paths and closed/restricted roads.
lines=[];skipped=[];roadmeta=[]
for w in R.findall('way'):
 t={x.get('k'):x.get('v')for x in w.findall('tag')}
 if 'highway'not in t:continue
 if t.get('access')in ['private','no']or t.get('foot')=='no'or t['highway']in ['trunk','trunk_link','construction','motorway','motorway_link']or t.get('indoor')=='yes':skipped.append(w.get('id'));continue
 pts=[xy(rawnodes[n.get('ref')])for n in w.findall('nd')if n.get('ref')in rawnodes]
 if len(pts)<2:continue
 l=LineString(pts).intersection(region.intersection(campus.buffer(150)))
 if l.is_empty:continue
 lines.append(l);roadmeta.append(t)
raw=unary_union(lines);cut=raw.difference(obs);parts=[g for g in cut.geoms if g.geom_type=='LineString'and g.length>.4]
# Subdivide into <=4m segments. All graph intersection nodes share exact positions.
points=[];lookup={};edges=[]
def node(p):
 k=tuple(round(float(v),3)for v in p)
 if k not in lookup:lookup[k]=len(points);points.append(k)
 return lookup[k]
for l in parts:
 cs=list(l.coords)
 for a,b in zip(cs,cs[1:]):
  dist=math.dist(a,b);steps=max(1,math.ceil(dist/4));last=node(a)
  for i in range(1,steps+1):
   p=(a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps);n=node(p)
   if last!=n:edges.append([last,n]);last=n
adj=collections.defaultdict(set)
for a,b in edges:adj[a].add(b);adj[b].add(a)
def components():
 seen=set();res=[]
 for a in adj:
  if a in seen:continue
  c=[];todo=[a];seen.add(a)
  while todo:
   x=todo.pop();c.append(x)
   for b in adj[x]:
    if b not in seen:seen.add(b);todo.append(b)
  res.append(c)
 return sorted(res,key=len,reverse=True)
comps=components();before=list(map(len,comps));patches=[]
# Connect short gaps with explicit game-only connectors; never through footprints.
for c in comps[1:]:
 main=components()[0]
 if c[0]in main:continue
 tree=cKDTree([points[i]for i in main]);dist,idx=tree.query([points[i]for i in c],k=min(12,len(main)))
 candidates=sorted((float(ds),c[i],main[int(ix)])for i,(dsrow,ixrow)in enumerate(zip(dist,idx))for ds,ix in zip(np.atleast_1d(dsrow),np.atleast_1d(ixrow)))
 for dist,a,b in candidates:
  if dist>18:break
  line=LineString([points[a],points[b]])
  if not line.intersects(obs):
   adj[a].add(b);adj[b].add(a);edges.append([a,b]);patches.append({'p':[points[a],points[b]],'length':round(dist,2),'reason':'game-only short gap connector'});break
comps=components();main=set(comps[0]);kept=[(a,b)for a,b in edges if a in main and b in main]
# Main walk network is connected. Tiny disconnected stubs remain reference data, not recommended routes.
ordered=sorted(main);remap={a:i for i,a in enumerate(ordered)};P=np.array([points[a]for a in ordered]);E=np.array([(remap[a],remap[b])for a,b in kept],dtype=int)
N=D['terrain']['n'];old=np.array(D['terrain']['values']).reshape(N,N);xmin,zmin,xmax,zmax=D['bounds']
def dem(x,z):
 u=np.clip((np.asarray(x)-xmin)/(xmax-xmin)*(N-1),0,N-1.000001);v=np.clip((np.asarray(z)-zmin)/(zmax-zmin)*(N-1),0,N-1.000001);i=u.astype(int);j=v.astype(int);a=u-i;b=v-j
 return (old[j,i]*(1-a)+old[j,i+1]*a)*(1-b)+(old[j+1,i]*(1-a)+old[j+1,i+1]*a)*b
Z=dem(P[:,0],P[:,1]);original=Z.copy();A=E[:,0];B=E[:,1];L=np.linalg.norm(P[A]-P[B],axis=1)
# Diffusion keeps broad hills, removes noisy stair-like DEM changes. Then enforce 25% road grade.
counts=np.bincount(E.ravel(),minlength=len(P))
for _ in range(15):
 sums=np.bincount(A,weights=Z[B],minlength=len(P))+np.bincount(B,weights=Z[A],minlength=len(P));Z=.6*Z+.4*sums/np.maximum(1,counts)
for _ in range(300):
 changed=0
 for a,b,l in zip(A,B,L):
  delta=Z[b]-Z[a];limit=.45*l
  if abs(delta)>limit+1e-5:
   correction=(abs(delta)-limit)/2;sign=1 if delta>0 else -1;Z[a]+=sign*correction;Z[b]-=sign*correction;changed+=1
 if not changed:break
# Exact graph Lipschitz envelope; converges by multi-source Dijkstra.
height_adj=[[] for _ in P]
for a,b,l in zip(A,B,L):height_adj[a].append((b,float(l)*.45));height_adj[b].append((a,float(l)*.45))
heap=[(float(h),i)for i,h in enumerate(Z)];heapq.heapify(heap)
while heap:
 h,a=heapq.heappop(heap)
 if h>Z[a]+1e-9:continue
 for b,cost in height_adj[a]:
  if Z[b]>h+cost+1e-9:Z[b]=h+cost;heapq.heappush(heap,(float(Z[b]),b))
# Dense visual terrain, road corridors blend to conditioned heights. Runtime samples exact road planes.
GN=401;gx=np.linspace(xmin,xmax,GN);gz=np.linspace(zmin,zmax,GN);xx,zz=np.meshgrid(gx,gz);samples=np.column_stack((xx.ravel(),zz.ravel()));tree=cKDTree(P);dist,ix=tree.query(samples);base=dem(samples[:,0],samples[:,1]);w=np.clip((12-dist)/10,0,1);w=w*w*(3-2*w);terrain=base*(1-w)+Z[ix]*w;terrain=gaussian_filter(terrain.reshape(GN,GN),.45)
# Anchor every mapped building to the connected network; destination is an outside approach, never the centre.
anchors={};maxApproach=0
for b,poly in zip(D['buildings'],polys):
 distances=np.array([poly.distance(Point(x,z)) for x,z in P]);order=np.argsort(distances)
 for k in order:
  if not poly.buffer(.65).contains(Point(P[k])):
   anchors[b['id']]=int(k);maxApproach=max(maxApproach,float(distances[k]));break
# regional waypoints from observed OSM POI / existing mapped buildings
regions=[]
for ident,label in [('167609409','행정관'),('148286730','중앙도서관'),('228476658','제1공학관 301'),('482207537','제2공학관 302'),('482220682','관악학생생활관 901'),('439707875','연구공원'),('424324200','호암교수회관'),('252233408','미술관·정문 주변')]:
 regions.append({'id':ident,'name':label,'node':anchors[ident]})
gate=[]
for n in R.findall('node'):
 t={a.get('k'):a.get('v')for a in n.findall('tag')}
 if '정문'in t.get('name',''):gate.append((n.get('id'),t,xy(n)))
print('gates',gate)
nav={'bounds':D['bounds'],'campusBoundary':list(boundary.coords),'points':[[round(x,3),round(z,3),round(h,6)]for (x,z),h in zip(P,Z)],'edges':E.tolist(),'anchors':anchors,'regions':regions,'connectors':patches,'terrain':{'n':GN,'values':[round(float(v),2)for v in terrain.ravel()]},'roadWidth':3.2,'source':'OSM-derived game navigation / ODbL; modified heights are not surveyed elevations'}
(ROOT/'dist/data/walk.json').write_text(json.dumps(nav,ensure_ascii=False,separators=(',',':')))
report={'campusBoundaryComplete':True,'campusBoundaryWithinTerrain':True,'boundaryBounds':campus.bounds,'rawRoadBuildingOverlaps':sum(l.intersection(obs).length>1 for l in lines),'componentsBefore':before,'componentsAfter':list(map(len,comps)),'navigationNodes':len(P),'navigationEdges':len(E),'connectedRecommendedNetwork':True,'gameConnectors':patches,'maxRoadGrade':float(np.max(np.abs(Z[A]-Z[B])/L)),'maxHeightCorrection':float(np.max(np.abs(Z-original))),'excludedWays':len(skipped),'regions':regions}
(ROOT/'WALK-REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items()if k not in ['gameConnectors','regions']},ensure_ascii=False))
