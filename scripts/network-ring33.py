"""Replace only changed road graph corridors; stable legacy node IDs survive.
Shared branch attachments are projected once, then used by both connected roads.
"""
import json,pathlib,math,collections
import shapely as S
from shapely.geometry import LineString,Point
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1];O=R/'reports/build33';N=json.loads((R/'dist/data/walk.json').read_text());B=json.loads((O/'source-data/walk.json').read_text())
changes=[(a,b)for a,b in zip(B['roads'],N['roads'])if a['p']!=b['p'] or b.get('ring33')]
oldlines=[LineString(a['p'])for a,b in changes];newlines=[LineString(b['p'])for a,b in changes];oldbuf=[l.buffer(.075)for l in oldlines];tree=STRtree(oldbuf)
rawring=S.union_all([oldlines[i]for i,(a,b)in enumerate(changes)if b.get('ring33')]);newring=S.union_all([newlines[i]for i,(a,b)in enumerate(changes)if b.get('ring33')])
P=N['points'];E=[];removed=0
for a,b in B['edges']:
 line=LineString([B['points'][a][:2],B['points'][b][:2]])
 if any(oldbuf[i].covers(line)for i in tree.query(line,predicate='intersects')):removed+=1
 else:E.append([a,b])
moved=0
for p in P:
 pt=Point(p[:2]);found=tree.query(pt,predicate='intersects')
 if not len(found):continue
 if rawring.distance(pt)<.075:
  target=S.get_coordinates(S.shortest_line(pt,newring))[-1].tolist()
 else:
  i=min(found,key=lambda i:oldlines[i].distance(pt));fraction=oldlines[i].project(pt)/(oldlines[i].length or 1);target=list(newlines[i].interpolate(newlines[i].length*fraction).coords[0])
 p[:2]=target;moved+=1
nodeTree=STRtree([Point(p[:2])for p in P]);grid=collections.defaultdict(list)
def key(p):return math.floor(p[0]/.02),math.floor(p[1]/.02)
for i,p in enumerate(P):grid[key(p)].append(i)
def node(q):
 k=key(q)
 for dx in [-1,0,1]:
  for dz in [-1,0,1]:
   for i in grid.get((k[0]+dx,k[1]+dz),[]):
    if math.dist(q,P[i][:2])<.02:return i
 i=len(P);P.append([*q,0]);grid[k].append(i);return i
added=0
for old,r in changes:
 prev=None
 for p,q in zip(r['p'],r['p'][1:]):
  seg=LineString([p,q]);count=max(1,math.ceil(seg.length/3));samples=[(j/count,list(seg.interpolate(j/count,normalized=True).coords[0]))for j in range(count+1)]
  for i in nodeTree.query(seg.buffer(.025),predicate='intersects'):
   pt=Point(P[i][:2]);samples.append((seg.project(pt)/(seg.length or 1),P[i][:2]))
  for t,pos in sorted(samples):
   idx=node(pos)
   if prev is not None and prev!=idx:E.append([prev,idx]);added+=1
   prev=idx
N['edges']=[list(e)for e in sorted(set(tuple(sorted(e))for e in E))]
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(O/'network.json').write_text(json.dumps({'changedRoads':len(changes),'nodesMoved':moved,'edgesRetired':removed,'edgesAdded':added,'beforeNodes':len(B['points']),'afterNodes':len(P),'beforeEdges':len(B['edges']),'afterEdges':len(N['edges'])},indent=2));print((O/'network.json').read_text())
