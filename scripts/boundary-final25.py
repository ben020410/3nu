from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));P=S.points(X.ravel(),Z.ravel());H=np.array(N['terrain']['values']).reshape(n,n);base=N['rear23']['base']
low=S.union_all([Polygon(q['outer'],q.get('holes',[])) for q in N['designGround23'] if 'lower' in q['id']]);dist=S.distance(P,low).reshape(n,n);t=np.clip((dist-8)/20,0,1);w=1-t*t*(3-2*t)
upper=S.union_all([LineString(r['p']).buffer(r.get('width',3)/2+2) for r in N['roads'] if str(r['id']) in ['457001557','435329619','456540217','435329616']]);du=S.distance(P,upper).reshape(n,n)
# Lower approaches own their 8m apron except the separate upper route.
w*=np.clip(du/4,0,1);H=H*(1-w)+base*w
N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
