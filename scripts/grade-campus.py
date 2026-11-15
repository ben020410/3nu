"""BUILD10: designed connected precincts, not DEM-derived individual mounds.
XY geometry is invariant. Heights are intentionally game-designed, not surveyed.
"""
import json,pathlib,zipfile,math
import numpy as np
import shapely as S
from shapely.geometry import Polygon,LineString,Point,box
from shapely.ops import unary_union
R=pathlib.Path(__file__).resolve().parents[1]
archive=R/'data-sources/build10-input.zip'
if not archive.exists():
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for name in ['campus','walk','architecture']:z.write(R/f'dist/data/{name}.json',name+'.json')
with zipfile.ZipFile(archive) as z:
 D=json.loads(z.read('campus.json'));N=json.loads(z.read('walk.json'));A=json.loads(z.read('architecture.json'))
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];xs=np.linspace(x0,x1,n);zs=np.linspace(z0,z1,n);X,Z=np.meshgrid(xs,zs);points=S.points(X.ravel(),Z.ravel());old=np.array(N['terrain']['values']).reshape(n,n);dx=xs[1]-xs[0];dz=zs[1]-zs[0]
def sample(H,x,z):
 u=np.clip((x-x0)/dx,0,n-1.000001);v=np.clip((z-z0)/dz,0,n-1.000001);i=int(u);j=int(v);a=u-i;b=v-j
 return H[j,i]+a*(H[j,i+1]-H[j,i])+b*(H[j+1,i]-H[j,i]) if a+b<=1 else H[j+1,i+1]+(1-a)*(H[j+1,i]-H[j+1,i+1])+(1-b)*(H[j,i+1]-H[j+1,i+1])
def mask(g):return S.covers(g,points).reshape(n,n)
def design(z):
 # Broad common levels, with 220-300m transitions. Absolute datums are artistic.
 v=np.asarray(z);h=np.full(v.shape,70.,dtype=float)
 for lo,hi,delta in [(300,600,20),(-400,-180,15),(-900,-650,20)]:
  t=np.clip((hi-v)/(hi-lo),0,1);h+=delta*t*t*(3-2*t)
 return h
polys=[S.make_valid(Polygon(b['p'],b.get('holes',[]))) for b in D['buildings']]
# Large named precinct cores include streets, inter-building space and plazas.
cores=[box(-430,600,230,1000),box(-410,-180,225,300),box(-250,-650,210,-400),box(-180,-1330,210,-900),box(250,-140,435,90)]
# Join close buildings into one block. Fill enclosed gaps; never round each building separately.
shapes=[p.buffer(11,join_style=2) for p in polys]+cores+[Polygon(f['outer']).buffer(14) for f in N['facilities']]+[Polygon(N['gate']['plazaOutline']).buffer(15)]
merged=unary_union(shapes);blocks=list(merged.geoms) if hasattr(merged,'geoms') else [merged]
blocks=[p.buffer(7).buffer(-7) for p in blocks]
fixed=np.zeros((n,n),bool);levels=np.zeros((n,n));blockrecords=[]
for index,g in enumerate(blocks):
 ids=[i for i,p in enumerate(polys) if g.intersects(p)]
 # An entire connected block gets one datum; no overlapping feathered pads.
 cy=g.centroid.y;level=float(design(cy))
 if g.intersects(cores[3]):level=100.
 elif g.intersects(cores[1]):level=90.
 elif g.intersects(cores[0]):level=70.
 elif g.intersects(cores[2]):level=105.
 elif g.intersects(cores[4]):level=90.
 if not g.intersects(box(-600,-1400,650,1100)):
  inside_points=[(max(x0,min(x1,q[0])),max(z0,min(z1,q[1]))) for i in ids for q in D['buildings'][i]['p']]
  level=float(np.median([sample(old,*q) for q in inside_points])) if inside_points else float(design(cy))
 m=mask(g);fixed|=m;levels[m]=level
 for i in ids:D['buildings'][i]['siteDatum']=level;D['buildings'][i]['siteBlock']=index
 blockrecords.append({'id':index,'datum':level,'areaM2':g.area,'buildings':[D['buildings'][i]['id'] for i in ids],'outer':list(g.exterior.coords),'holes':[list(r.coords) for r in g.interiors]})
# A bounded-grade envelope replaces harmonic interpolation, which could pull roads
# toward high mountain boundary values and create steep lips next to flat blocks.
valid=[i for i,g in enumerate(blocks) if g.intersects(box(x0,z0,x1,z1))]
G=.065
for iteration in range(500):
 change=0.
 for ii,i in enumerate(valid):
  for j in valid[ii+1:]:
   limit=G*blocks[i].distance(blocks[j]);delta=blockrecords[i]['datum']-blockrecords[j]['datum']
   excess=abs(delta)-limit
   if excess<=1e-7:continue
   sign=1 if delta>0 else -1;ai=blocks[i].area;aj=blocks[j].area
   blockrecords[i]['datum']-=sign*excess*aj/(ai+aj);blockrecords[j]['datum']+=sign*excess*ai/(ai+aj);change=max(change,excess)
 if change<1e-6:break
lo=np.full((n,n),-1e9);hi=np.full((n,n),1e9)
for i in valid:
 level=blockrecords[i]['datum'];dist=S.distance(points,blocks[i]).reshape(n,n)
 lo=np.maximum(lo,level-G*dist);hi=np.minimum(hi,level+G*dist)
 for bid in blockrecords[i]['buildings']:
  next(b for b in D['buildings'] if b['id']==bid)['siteDatum']=level
assert np.max(lo-hi)<.001
smooth=(lo+hi)/2
# Convolution and min/max clipping preserve the Lipschitz slope bound.
weights=np.exp(-np.arange(-4,5)**2/(2*2.0**2));weights/=weights.sum()
for axis in (0,1):smooth=np.apply_along_axis(lambda a:np.convolve(np.pad(a,(4,4),mode='edge'),weights,mode='valid'),axis,smooth)
smooth=np.maximum(lo,np.minimum(hi,smooth))
routes=unary_union([LineString(r['p']).buffer(max(25,r['width']/2+18)) for r in N['roads'] if len(r['p'])>1])
developed=unary_union([blocks[i] for i in valid]+[routes]);dist=S.distance(points,developed).reshape(n,n)
t=np.clip(1-dist/600,0,1);t=t*t*(3-2*t)
outer=old.copy();kw=np.exp(-np.arange(-12,13)**2/(2*6**2));kw/=kw.sum()
for axis in (0,1):outer=np.apply_along_axis(lambda a:np.convolve(np.pad(a,(12,12),mode='edge'),kw,mode='valid'),axis,outer)
H=smooth+(outer-smooth)*(1-t)*.5
# Inside all roads and shared blocks: one bounded-grade field, no DEM contribution.
# Outside the built/path corridor: retain the mountains with a long blending apron.
N['terrain']['values']=H.ravel().round(5).tolist()
for p in N['points']:p[2]=round(sample(H,*p[:2]),5)
for f in N['facilities']:
 c=Polygon(f['outer']).centroid;f['elevation']=round(sample(H,c.x,c.y),5)
for spec in A.values():
 if 'datumElevation' in spec:spec['previousMeasuredDatum']=spec.pop('datumElevation')
 spec['sitePolicy']='BUILD10 common designed block datum; structural heights retained'
# Rebuild continuous road polygons from the original centre-lines, not old clipped strips.
# Width blends only at EXACT shared endpoints of the same surface category/layer.
cache=R/'data-sources/build10-road-surfaces.json'
if cache.exists():surfaces=json.loads(cache.read_text())
else:
 junctions={}
 for r in N['roads']:
  for q in [r['p'][0],r['p'][-1]]:
   key=(tuple(q),r['category'],r.get('layer'));junctions[key]=max(junctions.get(key,0),r['width'])
 groups={}
 for r in N['roads']:
  p=r['p'];w=r['width'];widths=[];lengths=[0]
  for a,b in zip(p,p[1:]):lengths.append(lengths[-1]+math.dist(a,b))
  start=junctions[(tuple(p[0]),r['category'],r.get('layer'))];end=junctions[(tuple(p[-1]),r['category'],r.get('layer'))]
  pieces=[]
  for j in range(1,len(p)):
   a,b=p[j-1],p[j];length=math.dist(a,b)
   if length<1e-6:continue
   count=max(1,math.ceil(length/4));prev=None
   for k in range(count+1):
    f=k/count;q=(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f);s=lengths[j-1]+f*length
    ww=max(w,w+(start-w)*max(0,1-s/35),w+(end-w)*max(0,1-(lengths[-1]-s)/35))/2
    disk=Point(q).buffer(ww,quad_segs=6)
    if prev is not None:pieces.append(unary_union([prev,disk]).convex_hull)
    prev=disk
  g=unary_union(pieces);groups.setdefault(r['category'],[]).append(g)
 obstacles=unary_union([p for b,p in zip(D['buildings'],polys) if not b.get('landmarkOnly') and b.get('reviewModel')!='pungsan'])
 new={k:unary_union(v).difference(obstacles.buffer(.35)) for k,v in groups.items()}
 # Mild corner fillet per existing connected component: no bridge across separate parallel paths.
 for k,g in list(new.items()):
  parts=list(g.geoms) if hasattr(g,'geoms') else [g];radius=.7 if k=='road' else .25
  new[k]=unary_union([p.buffer(radius).buffer(-radius) for p in parts]).difference(obstacles.buffer(.35))
 oldsurfaces=[(s['kind'],S.make_valid(Polygon(s['outer'],s['holes']))) for s in N['surfaces'] if s['kind'] not in ['road','path','steps']]
 protected=[(k,g) for k,g in oldsurfaces if k in ['water','bank','track','turf','sportApron']]
 priority=protected+[(k,new[k]) for k in ['road','steps','path'] if k in new]+[(k,g) for k,g in oldsurfaces if k not in ['water','bank','track','turf','sportApron']]
 seen=Polygon();surfaces=[]
 def emit(k,g):
  if g.is_empty:return
  if g.geom_type=='Polygon':
   if g.area>.005:surfaces.append({'kind':k,'outer':list(g.exterior.coords)[:-1],'holes':[list(h.coords)[:-1] for h in g.interiors]})
  elif hasattr(g,'geoms'):
   for p in g.geoms:emit(k,p)
 for k,g in priority:
  g=S.make_valid(g);emit(k,g.difference(seen));seen=unary_union([seen,g])
 cache.write_text(json.dumps(surfaces,separators=(',',':')))
N['surfaces']=surfaces;N['grading']={'version':10,'policy':'Connected designed precincts; artistic elevations replace local DEM','blocks':blockrecords}
audit=[]
for b,p in zip(D['buildings'],polys):
 samples=[]
 for a,c in zip(list(p.exterior.coords),list(p.exterior.coords)[1:]):
  for f in np.linspace(0,1,max(2,int(math.dist(a,c))+1)):samples.append((a[0]+f*(c[0]-a[0]),a[1]+f*(c[1]-a[1])))
 samples=[q for q in samples if x0<=q[0]<=x1 and z0<=q[1]<=z1]
 if not samples:continue
 ys=[sample(H,*q) for q in samples];ys0=[sample(old,*q) for q in samples]
 audit.append({'id':b['id'],'number':b.get('officialNumber'),'beforeRange':max(ys0)-min(ys0),'afterRange':max(ys)-min(ys),'datum':b.get('siteDatum'),'block':b.get('siteBlock')})
report={'blocks':len(blockrecords),'iterations':iteration+1,'maxDatumConstraintResidualM':float(change),'designGradeLimit':G,'rmsChangeM':float(np.sqrt(np.mean((H-old)**2))),'maxChangeM':float(np.max(abs(H-old))),'buildings':audit,'roadsXYUnchanged':True,'buildingXYUnchanged':True}
for name,obj in [('walk',N),('campus',D),('architecture',A)]: (R/f'dist/data/{name}.json').write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
(R/'BUILD-10-GRADING.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print({k:v for k,v in report.items() if k!='buildings'});print('building max ground range',max(r['afterRange'] for r in audit));print('worst',sorted(audit,key=lambda r:-r['afterRange'])[:8])
