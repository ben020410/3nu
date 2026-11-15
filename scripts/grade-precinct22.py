"""BUILD22 coherent foreground grading. Shapes are interpreted, not surveyed boundaries."""
from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon
R=Path(__file__).resolve().parents[1];D=json.loads((R/'dist/data/campus.json').read_text());N=json.loads((R/'dist/data/walk.json').read_text());c=N['student21'];base=c['base'];st=next(b for b in D['buildings']if b.get('officialNumber')=='63');admin=next(b for b in D['buildings']if b.get('officialNumber')=='60');o=[-13.932,-46.323];u=[.7264904966883129,.6871765116922789];v=[-u[1],u[0]]
P=lambda a,d:[o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d]
sp=lambda x,z:[c['origin'][i]+c['u'][i]*x+c['v'][i]*z for i in range(2)]
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));H=np.array(N['terrain']['values']).reshape(n,n);cl=lambda t:np.clip(t,0,1);smooth=lambda t:cl(t)**2*(3-2*cl(t));points=S.points(X.ravel(),Z.ravel())
# Keep one low foreground across the whole student building and shared access court.
fore=Polygon([sp(-38,-54),sp(-38,4),sp(-60,18),sp(-54,39),sp(8,44),sp(34,43),sp(37,-56)]).union(Polygon(st['p']))
dist=S.distance(points,fore).reshape(n,n);w=1-smooth((dist-5)/16);H=H*(1-w)+base*w
# Administration lower/library face and higher lawn face are independent levels.
A=(X-o[0])*u[0]+(Z-o[1])*u[1];Q=(X-o[0])*v[0]+(Z-o[1])*v[1]
w=smooth((A-12)/10)*smooth((134-A)/10)*smooth((Q-119)/9)*smooth((180-Q)/12)
target=base+4.3*smooth((Q-144)/11);H=H*(1-w)+target*w
N['terrain']['values']=H.ravel().tolist()
# Visible foreground pavement from user ground photos and satellite. No image texture.
paving=Polygon([sp(-35,0),sp(-35,11),sp(-53,20),sp(-53,34),sp(-38,42),sp(1,42),sp(1,0)]).difference(Polygon(st['p']))
# Broader admin/library side pavement, leaving the tree-covered central planting island.
paving=paving.union(Polygon([P(18,132),P(116,132),P(116,143),P(18,143)]).difference(Polygon(admin['p'])))
new=[]
for q in N['surfaces']:
 g=Polygon(q['outer'],q.get('holes',[])).difference(paving)
 for part in ([g]if g.geom_type=='Polygon'else getattr(g,'geoms',[])):
  if part.geom_type=='Polygon' and part.area>.01:new.append({**q,'outer':list(part.exterior.coords)[:-1],'holes':[list(h.coords)[:-1]for h in part.interiors]})
for part in ([paving]if paving.geom_type=='Polygon'else paving.geoms):new.append({'kind':'plaza','outer':list(part.exterior.coords)[:-1],'holes':[list(h.coords)[:-1]for h in part.interiors],'source':'BUILD22 photo/satellite interpreted student/admin pavement; not surveyed'})
N['surfaces']=new
N['coordinateAudit22']={'units':'metres','originLonLat':D.get('origin',[126.952,37.459]),'axes':{'x':'east','y':'elevation','z':'north'},'worldScale':1,'note':'Source geographic footprints retained. Roof overhangs and cantilevers are separate geometry. Heights remain estimates.'}
N['student21']['source']='BUILD22 user photos1/3 and satellite4/5 plus Naver visible satellite; footprint source retained, architectural heights estimated'
for b in [st,admin]:b['fixedDatum21']=base;b['siteDatum']=base
for name,obj in [('walk',N),('campus',D)]: (R/f'dist/data/{name}.json').write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
print('graded student foreground and two-sided admin contact; paving',round(paving.area), 'm2')
