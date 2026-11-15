from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import LineString,Polygon
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());report=json.loads((R/'BUILD26-LOCAL-ROUTES.json').read_text());records=[r for r in report if r['status']=='corrected'];moved={}
for r in records:
 for a,b in [(r['before'][0],r['after'][0]),(r['before'][-1],r['after'][-1])]:
  if a!=b:moved[tuple(a)]=b
for r in N['roads']:r['p']=[moved.get(tuple(p),p) for p in r['p']]
# Remove old generic path fragments before replacing their physical footprint.
cut=S.union_all([LineString(r['before']).buffer(2) for r in records]);surfaces=[]
def emit(g,s):
 for q in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if q.geom_type=='Polygon' and q.area>.01:surfaces.append({**s,'outer':list(q.exterior.coords)[:-1],'holes':[list(t.coords)[:-1] for t in q.interiors]})
for s in N['surfaces']:
 if s['kind'] in ('path','steps') and not s.get('id'):emit(S.make_valid(Polygon(s['outer'],s.get('holes',[]))).difference(cut),s)
 else:surfaces.append(s)
for i,r in enumerate(records):
 # Ground-level approach corrections use walkable terrain; retain existing stairs elsewhere.
 road=next(q for q in N['roads'] if q['id']==r['id'])
 if road.get('category')=='road':continue
 emit(LineString(r['after']).buffer(road['width']/2,quad_segs=8),{'id':'approach26-'+str(i),'kind':'path','source':'local collision clearance correction; design estimate'})
N['surfaces']=surfaces
# Reconcile changed corridors with the existing navigation graph, preserving IDs elsewhere.
P=N['points'];oldP=[p[:] for p in P];oldLines=[LineString(r['before']) for r in records]
E=[]
for a,b in N['edges']:
 edge=LineString([oldP[a][:2],oldP[b][:2]])
 if any(g.buffer(.06).covers(edge) for g in oldLines):continue
 E.append([a,b])
for i,p in enumerate(P):
 q=moved.get(tuple(p[:2]))
 if q:p[0],p[1]=q
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n)
def height(x,z):
 u=np.clip((x-x0)/(x1-x0)*(n-1),0,n-1.000001);v=np.clip((z-z0)/(z1-z0)*(n-1),0,n-1.000001);i,j=int(u),int(v);a,b=u-i,v-j
 return float(H[j,i]+a*(H[j,i+1]-H[j,i])+b*(H[j+1,i]-H[j,i]) if a+b<=1 else H[j+1,i+1]+(1-a)*(H[j+1,i]-H[j+1,i+1])+(1-b)*(H[j,i+1]-H[j+1,i+1]))
def node(q):
 ds=[(p[0]-q[0])**2+(p[1]-q[1])**2 for p in P];i=int(np.argmin(ds))
 if ds[i]<.02**2:return i
 P.append([q[0],q[1],height(*q)]);return len(P)-1
for r in records:
 ids=[]
 for a,b in zip(r['after'],r['after'][1:]):
  for t in np.linspace(0,1,max(2,int(np.linalg.norm(np.array(b)-a)/3)+2)):
   q=(np.array(a)*(1-t)+np.array(b)*t).tolist();k=node(q)
   if ids and ids[-1]!=k:E.append([ids[-1],k])
   ids.append(k)
N['edges']=list({tuple(sorted(e)) for e in E});N['points']=P
(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')))
print('updated approaches',len(records),'shared endpoint corrections',len(moved),'navigation edges',len(E))
