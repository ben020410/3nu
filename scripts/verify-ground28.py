"""Verify the exclusive ground partition and shared height definitions, not overlay sums."""
import json,pathlib,numpy as np,shapely as S
from shapely.geometry import Polygon
R=pathlib.Path(__file__).resolve().parents[1]/'dist/data';N=json.loads((R/'walk.json').read_text());M=json.loads((R/'ground.json').read_text());V=np.fromfile(R/'ground.bin',dtype='<f4');I=np.fromfile(R/'ground-indices.bin',dtype='<u4');H=np.array(N['terrain']['values']);n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];areas={};worst=0;bad=0;sampleCount=0
patches=[s for s in N['surfaces'] if s.get('groundY') is not None or s.get('heightProfile')]
def level(p,x,z):
 if not p.get('heightProfile'):return np.full(len(x),p['groundY'])
 best=np.full(len(x),np.inf);y=np.zeros(len(x))
 for a,b in zip(p['heightProfile'],p['heightProfile'][1:]):
  dx,dz=b[0]-a[0],b[1]-a[1];t=np.clip(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz or 1),0,1);d=(x-a[0]-t*dx)**2+(z-a[1]-t*dz)**2;k=d<best;best[k]=d[k];y[k]=a[2]+t[k]*(b[2]-a[2])
 return y
for c in M['chunks']:
 v=V[c['offset']:c['offset']+c['count']*3].reshape(-1,3).astype(float);ix=I[c['indexOffset']:c['indexOffset']+c['indexCount']].reshape(-1,3);assert ix.max()<len(v);tri=v[ix];u=tri[:,1]-tri[:,0];w=tri[:,2]-tri[:,0];area=(u[:,0]*w[:,2]-u[:,2]*w[:,0])/2;assert area.min()>-1e-5;areas[c['kind']]=areas.get(c['kind'],0)+float(area.sum())
 x,z=v[:,0],v[:,2];uu=np.clip((x-x0)/(x1-x0)*(n-1),0,n-1.000001);ww=np.clip((z-z0)/(z1-z0)*(n-1),0,n-1.000001);i=uu.astype(int);j=ww.astype(int);a=uu-i;b=ww-j;q=j*n+i;y=np.where(a+b<=1,H[q]*(1-a-b)+H[q+1]*a+H[q+n]*b,H[q+1]*(1-b)+H[q+n]*(1-a)+H[q+n+1]*(a+b-1));err=np.abs(y-v[:,1]);pts=S.points(x,z)
 # Boundary vertices belong to either adjacent partition: accept either shared definition.
 for p in patches:
  if p['kind']!=c['kind']:continue
  mask=S.covers(S.make_valid(Polygon(p['outer'],p.get('holes',[]))).buffer(.002),pts);ly=level(p,x,z);err[mask]=np.minimum(err[mask],np.abs(ly[mask]-v[mask,1]))
 
 if (err>.002).any():print("mismatch",c["kind"],int((err>.002).sum()))
 worst=max(worst,float(err.max()));bad+=int((err>.002).sum());sampleCount+=len(v)
report={'vertices':sampleCount,'heightDefinitionMaxErrorM':worst,'heightMismatchVertices':bad,'exclusiveAreaErrorM2':sum(areas.values())-(x1-x0)*(z1-z0),'triangles':M['triangles'],'areasM2':areas,'passed':bad==0 and abs(sum(areas.values())-(x1-x0)*(z1-z0))<1}
print(json.dumps(report,indent=2));pathlib.Path('BUILD28-GROUND.json').write_text(json.dumps(report,indent=2));assert report['passed']
