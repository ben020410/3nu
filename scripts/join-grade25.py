"""Tie continuous design-grade boundary edges to the mesh height field.
Retaining-wall edges between different levels remain separate architectural edges.
"""
from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon
from scipy.ndimage import gaussian_filter
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n)
patches=[q for q in N['designGround23'] if 'stair-cut' not in q['id']];ds=np.array([S.distance(P,Polygon(q['outer'],q.get('holes',[]))) for q in patches]);nearest=ds.argmin(axis=0);distance=ds.min(axis=0);values=np.array([q['groundY'] for q in patches])[nearest];t=np.clip((distance-9)/34,0,1);w=1-t*t*(3-2*t);H=H*(1-w.reshape(n,n))+values.reshape(n,n)*w.reshape(n,n)
# Do not overwrite the original protected building pads outside the rear repair region.
D=json.loads((R/'dist/data/campus.json').read_text());old=json.loads((R.parent.parent/'work/build25-before/dist/data/walk.json').read_text());oldH=np.array(old['terrain']['values']).reshape(n,n)
for b in D['buildings']:
 if b.get('officialNumber') in ['60','62','62-1','63']:
  mask=S.covers(Polygon(b['p']).buffer(2),P).reshape(n,n);H[mask]=oldH[mask]
N['terrain']['values']=H.ravel().tolist();N['grading25']['boundaryJoin']='Nearest design datum propagated 9m through boundary, 34m smooth transition; retaining/stair edges remain explicit';(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
