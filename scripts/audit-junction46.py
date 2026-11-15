from pathlib import Path
import json,numpy as np
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
from shapely.strtree import STRtree
ROOT=Path(__file__).resolve().parents[1];W=ROOT/'reports/build46';R=ROOT/'dist/data';s=json.load(open(R/'humanities45.json'));mask=unary_union([Polygon(q['outer'],q['holes'])for q in s['junction46']['zones']]);outer=unary_union([Polygon(q['outer'])for q in s['retiredGradeZones']]);meta=json.load(open(R/'ground.json'));p=np.fromfile(R/'ground.bin',dtype='<f4');idx=np.fromfile(R/'ground-indices.bin',dtype='<u4');pol=[];planes=[];new=[]
for c in meta['chunks']:
 if c.get('x')not in ['junction46','junction46-edge']:continue
 pp=p[c['offset']:c['offset']+c['count']*3].reshape(-1,3);ii=idx[c['indexOffset']:c['indexOffset']+c['indexCount']]
 for t in pp[ii.reshape(-1,3)].astype(float):
  po=Polygon(t[:,[0,2]])
  if po.area<1e-8:continue
  eq=np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1])
  if c['x']=='junction46':new.append((t,po,eq))
  else:pol.append(po);planes.append(eq)
tree=STRtree(pol);errors=[]
for t,po,eq in new:
 for i in range(3):
  a=t[i,[0,2]];b=t[(i+1)%3,[0,2]]
  if outer.boundary.distance(Point(*a))>.0001 or outer.boundary.distance(Point(*b))>.0001:continue
  for f in [0,.25,.5,.75,1]:
   v=a*(1-f)+b*f;point=Point(*v)
   for k in tree.query(point.buffer(.0001)):
    if pol[k].distance(point)<.0001:errors.append((abs((eq-planes[k])@[*v,1]),v.tolist(),float(eq@[*v,1]),float(planes[k]@[*v,1])))
result={'edgeSamples':len(errors),'maxActualRenderedSeamDelta':max(q[0]for q in errors),'comparison':'actual float32 exterior shared edge, excluding ground hidden inside building footprint','maxBeforeWeldSpread':s['junction46']['removedBoundaryHeightSpread']};(W/'seam-audit.json').write_text(json.dumps(result,indent=2));print(result)
