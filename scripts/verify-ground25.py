import json,pathlib,numpy as np
from shapely.geometry import Polygon,box
from shapely import make_valid
import shapely as S
r=pathlib.Path(__file__).resolve().parents[1]/'dist/data';m=json.loads((r/'ground.json').read_text());nav=json.loads((r/'walk.json').read_text());a=np.fromfile(r/'ground.bin',dtype='<f4');inds=np.fromfile(r/'ground-indices.bin',dtype='<u4');n=nav['terrain']['n'];H=np.array(nav['terrain']['values']);x0,z0,x1,z1=nav['bounds'];areas={};err=0
for p in m['chunks']:
 v=a[p['offset']:p['offset']+p['count']*3].reshape(-1,3).astype(float);ix=inds[p['indexOffset']:p['indexOffset']+p['indexCount']].reshape(-1,3);assert ix.max()<len(v)
 t=v[ix][:,:,[0,2]];u=t[:,1]-t[:,0];w=t[:,2]-t[:,0];area=(u[:,0]*w[:,1]-u[:,1]*w[:,0])/2;assert area.min()>-1e-5;areas[p['kind']]=areas.get(p['kind'],0)+area.sum()
 xx=np.clip((v[:,0]-x0)/(x1-x0)*(n-1),0,n-1-1e-8);zz=np.clip((v[:,2]-z0)/(z1-z0)*(n-1),0,n-1-1e-8);i=xx.astype(int);j=zz.astype(int);u=xx-i;w=zz-j;q=j*n+i;y=np.where(u+w<=1,H[q]*(1-u-w)+H[q+1]*u+H[q+n]*w,H[q+1]*(1-w)+H[q+n]*(1-u)+H[q+n+1]*(u+w-1));
 points=S.points(v[:,0],v[:,2]);errors=np.abs(y-v[:,1])
 for patch in [s for s in nav['surfaces'] if s.get('groundY') is not None]:
  if patch['kind']!=p['kind']:continue
  shape=Polygon(patch['outer'],patch.get('holes',[]));interior=S.contains(shape.buffer(-.001),points);boundary=S.covers(shape.buffer(.001),points)&~interior
  errors[interior]=np.abs(v[interior,1]-patch['groundY']);errors[boundary]=np.minimum(errors[boundary],np.abs(v[boundary,1]-patch['groundY']))
 err=max(err,np.max(errors))
print("heightError",err,"area",sum(areas.values())-(x1-x0)*(z1-z0));assert err<.001;assert abs(sum(areas.values())-(x1-x0)*(z1-z0))<1
expected={}
for s in nav['surfaces']: expected[s['kind']]=expected.get(s['kind'],0)+make_valid(Polygon(s['outer'],s['holes'])).intersection(box(x0,z0,x1,z1)).area
# Grass is also the default material outside explicit partitions.
expected['grass']=(x1-x0)*(z1-z0)-sum(v for k,v in expected.items() if k!='grass')
for k,v in expected.items():assert abs(areas[k]-v)<2.0,(k,areas[k]-v)
print(json.dumps(dict(terrainHeightMaxErrorM=err,areasM2=areas,surfaceAreaErrorsM2={k:areas[k]-v for k,v in expected.items()},areaToleranceM2=2.0,triangles=m['triangles'],bytes=m['bytes'],passed=True),indent=2))
