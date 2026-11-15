from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon
import sys
R=Path.cwd();B=Path(sys.argv[1]);D=json.loads((B/'campus.json').read_text());N=json.loads((B/'walk.json').read_text());s=json.loads((R/'BUILD20-GEOMETRY.json').read_text());o,u,v=s['origin'],s['u'],s['v'];base=s['base'];P=lambda a,d:[o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d]
st=next(b for b in D['buildings']if b['officialNumber']=='63');origin=st['p'][9];delta=np.array(st['p'][10])-origin;f=delta/np.linalg.norm(delta);e=np.array([f[1],-f[0]]);sp=lambda a,d:list(np.array(origin)+e*a+f*d)
# Full coherent low plaza with edge transition; preserve architectural steps separately.
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));H=np.array(N['terrain']['values']).reshape(n,n);A=(X-o[0])*u[0]+(Z-o[1])*u[1];Q=(X-o[0])*v[0]+(Z-o[1])*v[1];cl=lambda t:np.clip(t,0,1)
poly=Polygon(st['p']).union(Polygon([sp(7,-45),sp(50,-45),sp(50,40),sp(7,40)]));dist=S.distance(S.points(X.ravel(),Z.ravel()),poly).reshape(n,n);weight=cl((16-dist)/10);H=H*(1-weight)+base*weight
# Administrative north/lawn front stays +4.3; south/library frontage returns to lower datum.
w=cl((A-12)/12)*cl((133-A)/12)*cl((Q-115)/12)*cl((176-Q)/12);target=base+4.3*cl((Q-143)/13);H=H*(1-w)+target*w
for b in D['buildings']:
 if b.get('officialNumber') in ['60','63']:b['siteDatum']=base;b['fixedDatum21']=base;b['grading21']='Lower library/student frontage; north lawn remains elevated. Heights estimated.'
N['terrain']['values']=H.ravel().tolist();N['student21']={'origin':origin,'u':e.tolist(),'v':f.tolist(),'base':base,'source':'user photos 1,3 and satellite 4,5; dimensions estimated'}
# Paving is ground partition, not a floating overlay.
newpoly=Polygon([sp(7,-45),sp(50,-45),sp(50,40),sp(7,40)]).difference(Polygon(st['p']));out=[]
for a in N['surfaces']:
 g=Polygon(a['outer'],a.get('holes',[])).difference(newpoly)
 for q in ([g]if g.geom_type=='Polygon'else getattr(g,'geoms',[])):
  if q.geom_type=='Polygon'and q.area>.01:out.append({**a,'outer':list(q.exterior.coords)[:-1],'holes':[list(h.coords)[:-1]for h in q.interiors]})
for q in ([newpoly]if newpoly.geom_type=='Polygon'else newpoly.geoms):out.append({'kind':'plaza','outer':list(q.exterior.coords)[:-1],'holes':[list(h.coords)[:-1]for h in q.interiors],'source':'BUILD21 student forecourt'})
N['surfaces']=out
for name,obj in [('walk',N),('campus',D)]: (R/f'dist/data/{name}.json').write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
print(N['student21'])
