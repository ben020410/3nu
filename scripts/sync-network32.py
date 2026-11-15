"""Replace changed graph corridors, preserving node IDs and all unrelated edges.
Road centerlines are metadata, not a second rendered strip over the ground mesh.
"""
import json,pathlib,math,collections
from shapely.geometry import LineString,Point
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1]
N=json.loads((R/'reports/build32/prepared-walk.json').read_text())
B=json.loads((R/'reports/build32/source-data/walk.json').read_text())
changes=[(a,b) for a,b in zip(B['roads'],N['roads']) if a['p']!=b['p']]
oldLines=[LineString(a['p']).buffer(.06) for a,b in changes];tree=STRtree(oldLines)
oldP=B['points'];P=N['points'];E=[];removed=0
for a,b in B['edges']:
 edge=LineString([oldP[a][:2],oldP[b][:2]])
 if any(oldLines[i].covers(edge) for i in tree.query(edge,predicate='intersects')):removed+=1
 else:E.append([a,b])
moved={}
for a,b in changes:
 for e in [0,-1]:
  if a['p'][e]!=b['p'][e]:moved[tuple(a['p'][e])]=b['p'][e]
for p in P:
 if tuple(p[:2]) in moved:p[:2]=moved[tuple(p[:2])]
grid=collections.defaultdict(list)
def key(x,z):return math.floor(x/.02),math.floor(z/.02)
for i,p in enumerate(P):grid[key(*p[:2])].append(i)
def node(q):
 k=key(*q)
 for dx in [-1,0,1]:
  for dz in [-1,0,1]:
   for i in grid.get((k[0]+dx,k[1]+dz),[]):
    if math.dist(q,P[i][:2])<.02:return i
 i=len(P);P.append([*q,0]);grid[k].append(i);return i
added=0
attachmentFile=R/'reports/build32/junction-attachments.json'
attachmentPoints=[]
if attachmentFile.exists():
 for a in json.loads(attachmentFile.read_text())['attachments']:
  attachmentPoints.extend([a['from'],a['to']])
revised=[b for a,b in changes]+N['roads'][len(B['roads']):]
for b in revised:
 prev=None
 for p,q in zip(b['p'],b['p'][1:]):
  count=max(1,math.ceil(math.dist(p,q)/3))
  segment=LineString([p,q]);samples=[(j/count,[p[0]+(q[0]-p[0])*j/count,p[1]+(q[1]-p[1])*j/count])for j in range(count+1)]
  for a in attachmentPoints:
   if segment.distance(Point(a))<.025:samples.append((segment.project(Point(a))/(segment.length or 1),a))
  for t,position in sorted(samples):
   idx=node(position)
   if prev is not None and prev!=idx:E.append([prev,idx]);added+=1
   prev=idx
N['edges']=[list(e) for e in sorted(set(tuple(sorted(e)) for e in E))]
# Set metadata heights from the same runtime sampler in finalize-network32.cjs.
(R/'reports/build32/prepared-walk.json').write_text(json.dumps(N,separators=(',',':')))
report=dict(changedRoadRecords=len(changes),oldEdgesRemoved=removed,newEdgesAdded=added,pointsBefore=len(oldP),pointsAfter=len(P),edgesBefore=len(B['edges']),edgesAfter=len(N['edges']),sharedEndpointsMoved=len(moved))
(R/'reports/build32/graph-sync.json').write_text(json.dumps(report,indent=2));print(report)
