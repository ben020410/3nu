from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import LineString,Polygon
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());B=json.loads((R/'../../work/build26-before/dist/data/walk.json').read_text());records=[];endpoint={}
for i,(a,b) in enumerate(zip(B['roads'],N['roads'])):
 if a['p']==b['p'] and not b.get('retired26'):continue
 r={'index':i,'id':a['id'],'status':'retired indoor segment' if b.get('retired26') else 'corrected','before':a['p'],'after':[] if b.get('retired26') else b['p'],'width':a['width'],'category':a.get('category'),'reason':b.get('retired26',b.get('correction26','align with built stair landings'))};records.append(r)
 if r['after']:
  for p,q,feet in [(a['p'][0],b['p'][0],b.get('startFeet')),(a['p'][-1],b['p'][-1],b.get('endFeet'))]:
   if p!=q:endpoint[tuple(p)]=(q,feet)
for r in N['roads']:
 for i,p in enumerate(r['p']):
  if tuple(p) in endpoint:
   q,h=endpoint[tuple(p)];r['p'][i]=q
   if h is not None:
    if i==0:r['startFeet']=h
    if i==len(r['p'])-1:r['endFeet']=h
# Existing graphs and anchor indexes are retained, obsolete edges are replaced.
P=B['points'];E=[];lines=[LineString(r['before']).buffer(.07) for r in records]
for a,b in B['edges']:
 edge=LineString([P[a][:2],P[b][:2]])
 if not any(g.covers(edge) for g in lines):E.append([a,b])
for p in P:
 if tuple(p[:2]) in endpoint:
  q,h=endpoint[tuple(p[:2])];p[:2]=q
  if h is not None:p[2]=h
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n)
def node(q):
 ds=[(p[0]-q[0])**2+(p[1]-q[1])**2 for p in P];i=int(np.argmin(ds))
 if ds[i]<.02**2:return i
 x,z=q;u=np.clip((x-x0)/(x1-x0)*(n-1),0,n-1);v=np.clip((z-z0)/(z1-z0)*(n-1),0,n-1);P.append([x,z,float(H[int(v),int(u)])]);return len(P)-1
for r in records:
 ids=[]
 for a,b in zip(r['after'],r['after'][1:]):
  for t in np.linspace(0,1,max(2,int(np.linalg.norm(np.array(b)-a)/3)+2)):
   k=node((np.array(a)*(1-t)+np.array(b)*t).tolist())
   if ids and ids[-1]!=k:E.append([ids[-1],k])
   ids.append(k)
N['points']=P;N['edges']=list({tuple(sorted(e)) for e in E});N['roads']=[r for r in N['roads'] if not r.get('retired26')]
cut=S.union_all([LineString(r['before']).buffer(r['width']/2+.2) for r in records]);surfaces=[]
def emit(g,s):
 for p in ([g] if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if p.geom_type=='Polygon' and p.area>.01:surfaces.append({**s,'outer':list(p.exterior.coords)[:-1],'holes':[list(t.coords)[:-1] for t in p.interiors]})
for s in N['surfaces']:
 if s['kind'] in ('path','steps') and (not s.get('id') or s.get('id','').startswith('approach26-')):emit(S.make_valid(Polygon(s['outer'],s.get('holes',[]))).difference(cut),s)
 else:surfaces.append(s)
for i,r in enumerate(records):
 if not r['after'] or r['category']=='road':continue
 emit(LineString(r['after']).buffer(r['width']/2,quad_segs=8),{'id':'connection26-'+str(i),'kind':'path','source':'existing approach corrected for constructed walking surfaces; design adaptation'})
N['surfaces']=surfaces;(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')));(R/'BUILD26-CONNECTIONS.json').write_text(json.dumps(records,ensure_ascii=False,indent=2));print('corrected',sum(r['status']=='corrected' for r in records),'retired',sum(not r['after'] for r in records))
