import numpy as np,math,json
from pathlib import Path
from shapely.geometry import Polygon
from shapely.ops import unary_union
import shapely
R=Path(__file__).resolve().parents[1]/'dist/data';s=json.loads((R/'humanities45.json').read_text());s43=json.loads((R/'finish43.json').read_text());meta=json.loads((R/'ground.json').read_text());a=np.fromfile(R/'ground.bin',dtype='<f4').reshape(-1,3);mask=unary_union([Polygon(q['outer'],q['holes'])for q in s['junction46']['zones']]);ids=[]
for c in meta['chunks']:
 if c.get('x')in ['junction46','junction46-edge']:ids.extend(range(c['offset']//3,c['offset']//3+c['count']))
ids=np.array(ids);ids=ids[shapely.distance(shapely.points(a[ids][:,[0,2]]),mask.boundary)<.0001];groups=[];buckets={};mapping={}
for i in ids:
 v=a[i];k=(math.floor(v[0]*500),math.floor(v[2]*500));group=None
 for dx in [-1,0,1]:
  for dz in [-1,0,1]:
   for j in buckets.get((k[0]+dx,k[1]+dz),[]):
    if np.linalg.norm(v[[0,2]]-groups[j][0][[0,2]])<.00015:group=j;break
 if group is None:group=len(groups);groups.append([v.copy(),[]]);buckets.setdefault(k,[]).append(group)
 groups[group][1].append(i)
maxspread=0
for anchor,ii in groups:
 old=a[ii].copy();maxspread=max(maxspread,float(np.ptp(old[:,1])));v=old.astype(float).mean(axis=0).astype('<f4');a[ii]=v
 for q in old:mapping[(float(q[0]),float(q[2]))]=v.tolist()
# Identical vertices in both physical owners receive exactly the same float32 values.
for spec in [s,s43]:
 for t in spec['triangles']:
  for v in t:
   q=mapping.get((v[0],v[2]))
   if q:v[0],v[1],v[2]=q
s['junction46']['weldedBoundaryGroups']=len(groups);s['junction46']['removedBoundaryHeightSpread']=maxspread
a.astype('<f4').tofile(R/'ground.bin');(R/'humanities45.json').write_text(json.dumps(s,separators=(',',':')));(R/'finish43.json').write_text(json.dumps(s43,separators=(',',':')));print(len(groups),maxspread)

# Weld near-coincident subdivision edges; never merge separate levels.
ids=[]
for c in meta['chunks']:
 if c.get('baked46'):ids.extend(range(c['offset']//3,c['offset']//3+c['count']))
ids=np.array(ids);ids=ids;groups=[];buckets={};mapping={}
for i in ids:
 v=a[i];k=(math.floor(v[0]*500),math.floor(v[2]*500));group=None
 for dx in [-1,0,1]:
  for dz in [-1,0,1]:
   for j in buckets.get((k[0]+dx,k[1]+dz),[]):
    if np.linalg.norm(v[[0,2]]-groups[j][0][[0,2]])<.00015 and abs(float(v[1]-groups[j][0][1]))<.001:group=j;break
 if group is None:group=len(groups);groups.append([v.copy(),[]]);buckets.setdefault(k,[]).append(group)
 groups[group][1].append(i)
maxspread=0
for anchor,ii in groups:
 old=a[ii].copy();maxspread=max(maxspread,float(np.ptp(old[:,1])));v=old.astype(float).mean(axis=0).astype('<f4');a[ii]=v
 for q in old:mapping[(float(q[0]),float(q[2]))]=v.tolist()
# Identical vertices in both physical owners receive exactly the same float32 values.
for spec in [s,s43]:
 for t in spec['triangles']:
  for v in t:
   q=mapping.get((v[0],v[2]))
   if q:v[0],v[1],v[2]=q
s['junction46']['weldedSubdivisionGroups']=len(groups);s['junction46']['removedSubdivisionHeightSpread']=maxspread
a.astype('<f4').tofile(R/'ground.bin');(R/'humanities45.json').write_text(json.dumps(s,separators=(',',':')));(R/'finish43.json').write_text(json.dumps(s43,separators=(',',':')));print(len(groups),maxspread)
