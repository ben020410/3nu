from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());B=json.loads((R/'../../work/build26-before/dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text());n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n);old=np.array(B['terrain']['values']).reshape(n,n)
for b in D['buildings']:
 if b['id'] not in ['167607356','386890918','vw/106']:continue
 d=S.distance(P,Polygon(b['p'])).reshape(n,n);w=np.clip(1-np.maximum(0,d-1.5)/4,0,1);w=w*w*(3-2*w);H=H*(1-w)+old*w
N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')))
