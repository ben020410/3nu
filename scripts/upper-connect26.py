from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import LineString
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());L=json.loads((R/'BUILD26-LIBRARY-SPEC.json').read_text());base=L['base']
def world(q):return [L['origin'][0]+L['u'][0]*q[0]+L['v'][0]*q[1],L['origin'][1]+L['u'][1]*q[0]+L['v'][1]*q[1]]
changes=[]
for id,route in [('167597853','pharmacy-road23'),('167597860','pharmacy-near23')]:
 for r in N['roads']:
  if r['id']==id:
   old=r['p'];new=[world(q) for q in reversed(L['routes'][route])]
   if route=='pharmacy-near23':new.append(old[-1])
   r['p']=new;r['startFeet']=base+7;r['endFeet']=base;changes.append({'id':id,'status':'corrected','before':old,'after':new})
r=next(r for r in N['roads'] if r['id']=='457001557');n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n);X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n))
def sample(p):return float(H[int((p[1]-z0)/(z1-z0)*(n-1)),int((p[0]-x0)/(x1-x0)*(n-1))])
profile=[[*p,sample(p)] for p in r['p']];profile[5]=[*world(L['routes']['pharmacy-road23'][-1]),base+7];profile[6]=[*world(L['routes']['pharmacy-near23'][-1]),base+7];profile[7]=[*world(L['routes']['far-stair25'][-1]),base+7]
# A gradual approach on either end, fixed at existing stair-top datums.
for a,b in [(0,5),(7,len(profile)-1)]:
 lengths=[0]
 for i in range(a+1,b+1):lengths.append(lengths[-1]+np.linalg.norm(np.array(profile[i][:2])-profile[i-1][:2]))
 lo,hi=profile[a][2],profile[b][2]
 for i in range(a,b+1):profile[i][2]=lo+(hi-lo)*lengths[i-a]/lengths[-1]
r['p']=[p[:2] for p in profile];line=LineString(r['p']);best=np.full_like(H,1e20);T=H.copy()
for a,b in zip(profile,profile[1:]):
 vx,vz=b[0]-a[0],b[1]-a[1];t=np.clip(((X-a[0])*vx+(Z-a[1])*vz)/(vx*vx+vz*vz),0,1);d=np.hypot(X-a[0]-t*vx,Z-a[1]-t*vz);m=d<best;best[m]=d[m];T[m]=a[2]+t[m]*(b[2]-a[2])
w=np.clip(1-np.maximum(0,best-4)/12,0,1);w=w*w*(3-2*w);H=H*(1-w)+T*w;N['terrain']['values']=H.ravel().tolist()
g=line.buffer(3,quad_segs=8);s={'id':'upper-connection26','kind':'road','outer':list(g.exterior.coords)[:-1],'holes':[],'heightProfile':profile,'source':'continuous design profile tied to three existing stair top datums; not survey heights'}
# Stair excavation wins only inside its exact footprint; road wins over old terrace patches.
i=next(i for i,s in enumerate(N['surfaces']) if not s.get('id','').startswith(('far-stair-cut25','rear23-stair-cut')));N['surfaces'].insert(i,s)
(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')));(R/'BUILD26-UPPER-CONNECTION.json').write_text(json.dumps({'profile':profile,'stairChanges':changes},indent=2))
