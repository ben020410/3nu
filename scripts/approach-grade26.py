from pathlib import Path
import json,numpy as np
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());L=json.loads((R/'BUILD26-LIBRARY-SPEC.json').read_text());n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));H=np.array(N['terrain']['values']).reshape(n,n);best=np.full_like(H,1e9);target=H.copy();weights=np.zeros_like(H)
for q in L['surfaces']:
 if not q['from'] or not q['id'].startswith(('right-approach-','main-front-49-','main-front-82-')):continue
 a,b=np.array(q['from']),np.array(q['to']);v=b-a;t=np.clip(((X-a[0])*v[0]+(Z-a[1])*v[1])/np.dot(v,v),0,1);dist=np.hypot(X-a[0]-v[0]*t,Z-a[1]-v[1]*t);d=np.maximum(0,dist-q['width']/2);h=L['base']+q['lo']+t*(q['hi']-q['lo'])-.08;m=d<best;best[m]=d[m];target[m]=h[m]
w=np.clip(1-np.maximum(0,best-2)/8,0,1);w=w*w*(3-2*w);H=H*(1-w)+target*w
N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')))
