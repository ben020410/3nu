from pathlib import Path
import json,math,numpy as np
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];W=R/'sources/pungsan48';D=R/'dist';C=json.loads((W/'context.json').read_text());cfg=C['cfg'];base=C['base'];f=np.array(cfg['front']);u=np.array([-f[1],f[0]]);origin=np.array(cfg['center'])
J=json.loads((W/'common-layout-ratios.json').read_text())
pos=np.fromfile(W/'render47.bin',np.float32).reshape(-1,3);ix=np.fromfile(D/'data/ground-indices.bin',np.uint32);meta=json.loads((D/'data/ground.json').read_text());tris=[];kinds=[]
for ch in meta['chunks']:
 ps=pos[ch['offset']//3:ch['offset']//3+ch['count']]; ii=ix[ch['indexOffset']:ch['indexOffset']+ch['indexCount']].reshape(-1,3);tr=ps[ii];mask=(tr[:,:,0].max(axis=1)>=250)&(tr[:,:,0].min(axis=1)<=470)&(tr[:,:,2].max(axis=1)>=-230)&(tr[:,:,2].min(axis=1)<=140);tris.extend(tr[mask]);kinds.extend([ch['kind']]*sum(mask))
tr=np.array(tris);lo=tr[:,:,[0,2]].min(axis=1);hi=tr[:,:,[0,2]].max(axis=1)
def ground(x,z,kind=False):
 ids=np.where((lo[:,0]<=x+1e-5)&(hi[:,0]>=x-1e-5)&(lo[:,1]<=z+1e-5)&(hi[:,1]>=z-1e-5))[0]
 for i in ids:
  a,b,c=tr[i];v=b[[0,2]]-a[[0,2]];w=c[[0,2]]-a[[0,2]];q=np.array([x,z])-a[[0,2]];de=v[0]*w[1]-v[1]*w[0]
  if abs(de)<1e-9:continue
  s=(q[0]*w[1]-q[1]*w[0])/de;t=(v[0]*q[1]-v[1]*q[0])/de
  if s>=-1e-5 and t>=-1e-5 and s+t<=1.00001:return (float(a[1]+s*(b[1]-a[1])+t*(c[1]-a[1])),kinds[i]) if kind else float(a[1]+s*(b[1]-a[1])+t*(c[1]-a[1]))
 raise ValueError(('no terrain',x,z))
def pt(a,d,y):
 q=origin+u*a+f*d;return [float(q[0]),base+float(y),float(q[1])]
def gr(a,d):
 q=pt(a,d,0);return ground(q[0],q[2])-base
groups={};floors=[];roofTriangles=[]
def face(ps,mat,floor=False,roof=False,uv=None):
 g=groups.setdefault(mat,{'positions':[],'indices':[],'uvs':[]});start=len(g['positions'])//3;ww=[pt(*p) for p in ps]
 for i,p in enumerate(ww):g['positions']+=p;g['uvs']+=uv[i] if uv else [ps[i][0]/2,ps[i][1]/2]
 for i in range(1,len(ps)-1):
  g['indices'] += [start,start+i,start+i+1];tt=[ww[0],ww[i],ww[i+1]]
  if floor:floors.append(tt)
  if roof:roofTriangles.append(tt)
def grid(rows,mat,uvs,roof=False):
 g=groups.setdefault(mat,{'positions':[],'indices':[],'uvs':[]});n=len(g['positions'])//3;cols=len(rows[0]);ww=[[pt(*p) for p in rr] for rr in rows]
 for j,rr in enumerate(ww):
  for i,p in enumerate(rr):g['positions']+=p;g['uvs']+=uvs[j][i]
 for j in range(len(rows)-1):
  for i in range(cols-1):
   k=n+j*cols+i;g['indices'] += [k,k+cols,k+1,k+1,k+cols,k+cols+1]
   if roof:roofTriangles.extend([[ww[j][i],ww[j+1][i],ww[j][i+1]],[ww[j][i+1],ww[j+1][i],ww[j+1][i+1]]])
def cat(ps,t):
 q=min(len(ps)-2,int(t*(len(ps)-1)));k=t*(len(ps)-1)-q;a=np.array(ps[max(0,q-1)]);b=np.array(ps[q]);c=np.array(ps[q+1]);d=np.array(ps[min(len(ps)-1,q+2)]);return .5*(2*b+(-a+c)*k+(2*a-5*b+4*c-d)*k*k+(-a+3*b-3*c+d)*k*k*k)
# One welded sweep: roof edge, return bend, and low tail share every seam vertex.
inner=list(reversed(cfg['roofRear14']))+cfg['tailOuter14'];outer=list(reversed(cfg['roofLip14']))[:-1]+[[-28,4,2.2]]+cfg['tailInner14'];rows=[];uvs=[];N=220;K=24;length=0;prev=None
for i in range(N+1):
 t=i/N;q=cat(inner,t);r=cat(outer,t);mid=(q+r)/2
 if prev is not None:length+=np.linalg.norm(mid-prev)
 prev=mid.copy();row=[];ur=[];width=np.linalg.norm(q-r)
 for j in range(K+1):
  v=j/K;p=q*(1-v)+r*v;p[2]+=.45*math.sin(math.pi*v)*min(1,width/12)
  # Only the already-low tail contacts the unmodified rendered ground.
  if t>.50:
   blend=min(1,(t-.5)/.12);p[2]=(1-blend)*p[2]+blend*max(gr(p[0],p[1])+.035,p[2])
  row.append(p.tolist());ur.append([length/1.65,v*width/1.65])
 rows.append(row);uvs.append(ur)
grid(rows,'silver',uvs,True)
# Actual thickness around the full silhouette; not a detached trim strip.
for side in [0,K]:
 for i in range(N):
  a=rows[i][side];b=rows[i+1][side];face([a,b,[b[0],b[1],b[2]-.16],[a[0],a[1],a[2]-.16]],'edge')
# Nested arch extends to the opposite glazed entrance.
arch=[];auv=[]
for j in range(25):
 d=7-j*.5;row=[];uv=[]
 for i in range(81):
  theta=-math.pi/2+math.pi*i/80;a=12*math.sin(theta);h=.18+(5.2+(7-d)*.055)*math.cos(theta);row.append([a,d,h]);uv.append([12*theta/1.65,d/1.65])
 arch.append(row);auv.append(uv)
grid(arch,'arch',auv,True)
for i in range(80):
 a,b=arch[0][i:i+2];face([a,b,[b[0],b[1]+.02,b[2]-.18],[a[0],a[1]+.02,a[2]-.18]],'edge')
for d,mat in [(1.85,'backdrop'),(-5,'glass')]:
 for i in range(80):
  th0=-math.pi/2+math.pi*i/80;th1=-math.pi/2+math.pi*(i+1)/80;a=12*math.sin(th0);b=12*math.sin(th1);h0=.18+(5.2+(7-d)*.055)*math.cos(th0);h1=.18+(5.2+(7-d)*.055)*math.cos(th1)
  face([[a,d,.035],[b,d,.035],[b,d,h1-.02],[a,d,h0-.02]],mat,uv=[[a/2,0],[b/2,0],[b/2,h1/2],[a/2,h0/2]])
# Rear mullions only; the front curtain is opaque, ribbed and recessed.
for a in np.arange(-10,10.1,2):
 h=.18+5.86*math.sqrt(1-a*a/144)
 face([[a-.045,-5.04,.035],[a+.045,-5.04,.035],[a+.045,-5.04,h],[a-.045,-5.04,h]],'frame')
# Seats retain 14 risers and scale. Three 1.76-wide aisle interruptions are estimates.
# Side access tapers each tread to the existing apron over a 0.32-radian end sector.
def lim(k):return 1.36-max(0,min(5,k-4))*.036
def yy(k,th,limit):
 s=max(0,min(1,(limit-abs(th))/.50));s=s*s*(3-2*s);return (k+1)*.2*s
for k in range(14):
 r0=12+k*1.65;r1=r0+1.65;limit=lim(k)
 breaks=sorted(set([-limit,limit]+[float(t) for t in np.linspace(-limit,limit,121)]+[a+v*.88/((r0+r1)/2) for a in [-.75,0,.75] for v in [-1,1]]))
 def pp(r,t,h):return [math.sin(t)*r,5+math.cos(t)*r,h]
 for a,b in zip(breaks,breaks[1:]):
  mid=(a+b)/2;aisle=any(abs(mid-t)*(r0+r1)/2<.881 for t in [-.75,0,.75]);ha=yy(k,a,limit);hb=yy(k,b,limit)
  for ra,rb,mat in ([(r0,r1,'aisle')] if aisle else [(r0,r0+.57,'stone'),(r0+.57,r1,'turf' if k>=9 else 'seatBack')]):face([pp(ra,a,ha),pp(ra,b,hb),pp(rb,b,hb),pp(rb,a,ha)],mat,True)
  lowa=yy(k-1,a,lim(k-1)) if k else 0;lowb=yy(k-1,b,lim(k-1)) if k else 0
  face([pp(r0,a,lowa),pp(r0,b,lowb),pp(r0,b,hb),pp(r0,a,ha)],'riser')
  if k==13 or k>=4:
   if k==13 or abs(mid)>lim(k+1):face([pp(r1,a,gr(*pp(r1,a,0)[:2])),pp(r1,b,gr(*pp(r1,b,0)[:2])),pp(r1,b,hb),pp(r1,a,ha)],'riser')
# Apron fan replaces the old fan; its edge reaches the first riser without an offset.
for i in range(100):
 a=-1.4+i*2.8/100;b=-1.4+(i+1)*2.8/100
 face([[0,4,.035],[12*math.sin(a),5+12*math.cos(a),.035],[12*math.sin(b),5+12*math.cos(b),.035]],'stage',True)
# Candidate screening uses existing surfaces/roads/forest, never deletes a forest tree.
plant=J['planting'];openZones=unary_union([Polygon(p) for p in plant['reserved_open_lawn_world_xz']]);zones=unary_union([Polygon(p) for p in plant['candidate_lawn_zones_world_xz']]);obstacles=unary_union([Polygon(b['p']) for b in C['buildings']]);roads=unary_union([LineString(q['p']).buffer(q['width']/2+1.1) for q in C['roads'] if len(q['p'])>1]);trees=[];reject=[]
# Open grass has a deliberately loose rhythm; the exact species is unverified.
for i,t in enumerate(plant['trees']):
 x,z=t['world_xz_proposal'];radius=t['crown_radius_D']*70.2;h=t['height_D']*70.2;crown=Point(x,z).buffer(radius);why=None
 if crown.intersects(openZones):why='OPEN canopy exclusion'
 elif crown.intersects(roads):why='existing path/road crown clearance'
 elif crown.intersects(obstacles):why='building clearance'
 elif any(math.hypot(x-q[0],z-q[1])<radius+4 for q in C['trees']):why='existing tree canopy clearance'
 y,kind=ground(x,z,True)
 if kind not in ['grass','lawn'] or not all(ground(x+math.cos(a)*radius,z+math.sin(a)*radius,True)[1] in ['grass','lawn'] for a in np.linspace(0,2*math.pi,16)):why=why or 'current paved boundary clearance'
 if why:reject.append({'id':t['id'],'reason':why});continue
 trees.append({'id':t['id'],'x':x,'z':z,'y':y,'r':radius,'h':h*(.94+.07*(i%3)),'variant':i%3,'rotation':i*2.39996,'trunkRadius':.24+.035*(i%3)})
canopy=unary_union([Point(t['x'],t['z']).buffer(t['r']) for t in trees]);fraction=canopy.intersection(zones).area/zones.area
out={'revision':'beodeulgol48-r1','id':'193893586','center':cfg['center'],'front':cfg['front'],'base':base,'groups':groups,'floors':floors,'roofTriangles':roofTriangles,'trees':trees,'audit':{'canopyFraction':fraction,'openIntersection':canopy.intersection(openZones).area,'selected':len(trees),'rejected':reject,'tierCountEstimate':14,'aisleCountEstimate':3,'aisleWidth':1.76,'groundUnmodified':True,'roofGrid':[N+1,K+1]}}
(D/'data/pungsan48.json').write_text(json.dumps(out,separators=(',',':')))
(W/'audit48.json').write_text(json.dumps(out['audit'],indent=2));print(out['audit']);print('triangles',sum(len(g['indices'])//3 for g in groups.values()))
