from pathlib import Path
import json,numpy as np
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());l=N['outdoor']['lawn'];n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));dx=X-l['center'][0];dz=Z-l['center'][1];u=dx*l['u'][0]+dz*l['u'][1];v=dx*l['v'][0]+dz*l['v'][1];H=np.array(N['terrain']['values']).reshape(n,n)
def smooth(t):t=np.clip(t,0,1);return t*t*(3-2*t)
# Existing side stairs terminate at lower ground, administration apron at deck level.
side=(1-smooth((np.abs(np.abs(u)-59)-4)/14))*(1-smooth((np.abs(v)-33)/8));H=H*(1-side)+l['base']*side
admin=(1-smooth((np.abs(v-44)-4)/15))*(1-smooth((np.abs(u)-59)/12));admin*=smooth((np.abs(u)-11)/3);H=H*(1-admin)+(l['base']+l['rise'])*admin
# Keep parking underside low. Do not replace elevated deck with solid terrain.
inside=(np.abs(u)<49)&(v<34)&(v>-44);H[inside]=l['base']
N['terrain']['values']=H.ravel().tolist();(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
