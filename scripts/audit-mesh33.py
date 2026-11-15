"""Sample the real indexed carriageway mesh, not its input polygons."""
import json,pathlib,math
import numpy as np,shapely as S
from shapely.geometry import LineString,Point
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1];O=R/'reports/build33'
N=json.loads((R/'dist/data/walk.json').read_text());M=json.loads((R/'dist/data/ground.json').read_text())
V=np.fromfile(R/'dist/data/ground.bin',dtype='<f4').reshape(-1,3);I=np.fromfile(R/'dist/data/ground-indices.bin',dtype='<u4')
tris=np.concatenate([V[c['offset']//3+I[c['indexOffset']:c['indexOffset']+c['indexCount']]].reshape(-1,3,3) for c in M['chunks'] if c['kind']=='road'])
polys=S.polygons(tris[:,:,[0,2]]);tree=STRtree(polys);samples=[];missing=[];overlap=[]
for name,pp in [('ring',N['ring33']['route']),('approach',N['ring33']['approach'])]:
 l=LineString(pp)
 for s in np.arange(.137,l.length,2.7):
  p=l.interpolate(s);a=l.interpolate(max(0,s-.25));b=l.interpolate(min(l.length,s+.25));dx,dz=b.x-a.x,b.y-a.y;d=math.hypot(dx,dz)
  for off in [-7.35,-4.95,-1.65,.00031,1.65,4.95,7.35]:
   x,z=p.x-dz/d*off,p.y+dx/d*off;pt=Point(x,z);ix=tree.query(pt,predicate='within')
   if not len(ix):missing.append([name,float(s),off,x,z]);continue
   if len(ix)>1:overlap.append([name,float(s),off,len(ix)])
   q=tris[ix[0]].astype(float);a,b,c=q[:,[0,2]];t=np.array([x,z]);den=np.linalg.det(np.array([b-a,c-a]));u=np.linalg.det(np.array([t-a,c-a]))/den;v=np.linalg.det(np.array([b-a,t-a]))/den;y=q[0,1]+u*(q[1,1]-q[0,1])+v*(q[2,1]-q[0,1]);samples.append([x,z,float(y)])
(O/'mesh-height-samples.json').write_text(json.dumps(samples,separators=(',',':')))
result={'samples':len(samples),'missing':missing,'overlappingCarriagewayTriangles':overlap,'groundVertices':M['vertices'],'groundTriangles':M['triangles'],'groundBytes':M['bytes']}
(O/'mesh-audit.json').write_text(json.dumps(result,indent=2));print({k:len(v)if isinstance(v,list)else v for k,v in result.items()})
