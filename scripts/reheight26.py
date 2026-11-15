from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon
R=Path(__file__).resolve().parents[1]/'dist/data';N=json.loads((R/'walk.json').read_text());M=json.loads((R/'ground.json').read_text());v=np.fromfile(R/'ground.bin',dtype='<f4').reshape(-1,3);old=v[:,1].copy();n=N['terrain']['n'];H=np.array(N['terrain']['values']);x0,z0,x1,z1=N['bounds'];u=np.clip((v[:,0].astype(float)-x0)/(x1-x0)*(n-1),0,n-1.000001);w=np.clip((v[:,2].astype(float)-z0)/(z1-z0)*(n-1),0,n-1.000001);i=u.astype(int);j=w.astype(int);a=u-i;b=w-j;q=j*n+i;v[:,1]=np.where(a+b<=1,H[q]+a*(H[q+1]-H[q])+b*(H[q+n]-H[q]),H[q+n+1]+(1-a)*(H[q+n]-H[q+n+1])+(1-b)*(H[q+1]-H[q+n+1]))
for c in M['chunks']:
 lo=c['offset']//3;hi=lo+c['count'];pts=S.points(v[lo:hi,0].astype(float),v[lo:hi,2].astype(float))
 for p in [s for s in N['surfaces'] if s.get('groundY') is not None or s.get('heightProfile')]:
  if p['kind']!=c['kind']:continue
  level=p.get('groundY')
  if p.get('heightProfile'):
   xx=v[lo:hi,0].astype(float);zz=v[lo:hi,2].astype(float);best=np.full(len(xx),1e20);level=np.zeros(len(xx))
   for a,b in zip(p['heightProfile'],p['heightProfile'][1:]):
    dx,dz=b[0]-a[0],b[1]-a[1];t=np.clip(((xx-a[0])*dx+(zz-a[1])*dz)/(dx*dx+dz*dz),0,1);d=(xx-a[0]-t*dx)**2+(zz-a[1]-t*dz)**2;m=d<best;best[m]=d[m];level[m]=a[2]+t[m]*(b[2]-a[2])
  mask=S.covers(Polygon(p['outer'],p.get('holes',[])).buffer(.001),pts)&(np.abs(old[lo:hi]-level)<.002);v[lo:hi,1][mask]=level if np.isscalar(level) else level[mask]
v.tofile(R/'ground.bin');print('Reprojected shared indexed vertices:',len(v),'preserving exact architectural patch elevations')
