from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon
from scipy.ndimage import gaussian_filter
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n);base=N['rear23']['base']
low=S.union_all([Polygon(q['outer'],q.get('holes',[])) for q in N['designGround23'] if 'lower' in q['id']]);up=S.union_all([Polygon(q['outer'],q.get('holes',[])) for q in N['designGround23'] if q['id'] in ['upper-road25','rear23-upper']]);dl=S.distance(P,low).reshape(n,n);du=S.distance(P,up).reshape(n,n)
# Two coherent terrain terraces; interpolate the planted slope, not independent bumps.
a=np.maximum(dl-2,0);b=np.maximum(du-3,0);t=a/(a+b+1e-9);t=t*t*(3-2*t);target=base+7*t
near=np.minimum(dl,du);w=np.clip((35-near)/18,0,1);w=w*w*(3-2*w)
H=H*(1-w)+target*w
# Preserve dedicated lower excavations and stair support. Architectural walking planes remain separate.
for q in N['designGround23']:
 if 'stair-cut' in q['id'] or 'lower' in q['id']:
  mask=S.covers(Polygon(q['outer'],q.get('holes',[])),P).reshape(n,n);H[mask]=q['groundY']
N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
