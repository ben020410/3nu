"""Re-evaluate profile elevations after float32 packing at nearest-segment seams."""
import json,pathlib,numpy as np,shapely as S
from shapely.geometry import Polygon
R=pathlib.Path(__file__).resolve().parents[1]/'dist/data';N=json.loads((R/'walk.json').read_text());M=json.loads((R/'ground.json').read_text());V=np.fromfile(R/'ground.bin',dtype='<f4');changed=0;maximum=0
for c in M['chunks']:
 v=V[c['offset']:c['offset']+c['count']*3].reshape(-1,3);x,z=v[:,0].astype(float),v[:,2].astype(float);pts=S.points(x,z)
 for p in [s for s in N['surfaces'] if s.get('heightProfile') and s['kind']==c['kind']]:
  best=np.full(len(x),np.inf);y=np.zeros(len(x))
  for a,b in zip(p['heightProfile'],p['heightProfile'][1:]):
   dx,dz=b[0]-a[0],b[1]-a[1];t=np.clip(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz or 1),0,1);d=(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2;k=d<best;best[k]=d[k];y[k]=a[2]+t[k]*(b[2]-a[2])
  e=abs(y-v[:,1]);mask=S.covers(S.make_valid(Polygon(p['outer'],p.get('holes',[]))).buffer(.002),pts)&(e>.002)&(e<.1)
  if mask.any():maximum=max(maximum,float(e[mask].max()));changed+=int(mask.sum());v[mask,1]=y[mask]
V.tofile(R/'ground.bin');print({'profileSeamVertices':changed,'maxCorrectionM':maximum})
