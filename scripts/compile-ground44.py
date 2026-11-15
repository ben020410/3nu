"""Exclusive finish replacements on preserved BUILD43 triangles; no world regrade."""
from pathlib import Path
import json,math,subprocess,numpy as np,mapbox_earcut as E
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];W=R/'sources/landmark44';O=R/'dist/data';s=json.loads((O/'landmark44.json').read_text());source=lambda n:subprocess.check_output(['git','show','7496a3416a02bef984e898336667cbe0777d2c71:dist/data/'+n],cwd=R)
meta=json.loads(source('ground.json'));P=np.frombuffer(source('ground.bin'),dtype='<f4');I=np.frombuffer(source('ground-indices.bin'),dtype='<u4');B=88.65926319928778
g=s['gate'];f=g['coordinate_system'];a=f['angle_radians'];org=f['origin_world_xz'];gp=lambda p:[org[0]+math.cos(a)*p[0]-math.sin(a)*p[1],org[1]+math.sin(a)*p[0]+math.cos(a)*p[1]]
gate=Polygon(g['plaza']['world_outline']);basin=Polygon([gp(p)for p in g['elements']['C']['polygon_local']]);pine=Polygon([gp(p)for p in [(3,-33),(11,-33),(11,-25),(3,-25)]]).intersection(gate)
pond=Polygon(s['pond']['baseline']['originalOuterWorldXZ']);decks=unary_union([Polygon(p)for p in s['deckPolygons']]);f=s['stadiumFrame'];wp=lambda x,z:[f['origin_world_xz'][i]+f['u_world_xz'][i]*x+f['v_world_xz'][i]*z for i in range(2)];pitch=Polygon([wp(x,z)for x,z in [(-52.5,-34),(52.5,-34),(52.5,34),(-52.5,34)]]);stadium=Polygon([wp(x,z)for x,z in [(-95,-45),(95,-45),(95,45),(-95,45)]])
mf=s['models'][0]['fit'];mw=lambda x,z:[mf['origin'][i]+mf['u'][i]*x+mf['v'][i]*z for i in range(2)];apron=Polygon([mw(x,z)for x,z in [(-17,-24),(-11,-27),(7,-27),(8,-20),(8,-7.23),(-7.5,-7.23),(-7.5,-15),(-17,-15)]])
mask=unary_union([gate,pond,decks,stadium,apron]);out=[];ixs=[];chunks=[];changed={}
def polys(g):
 if g.geom_type=='Polygon':
  if g.area>1e-8:yield g
 else:
  for q in getattr(g,'geoms',[]):yield from polys(q)
def put(shape,h,ps,ix):
 for p in polys(shape):
  rr=[list(p.exterior.coords)[:-1]]+[list(r.coords)[:-1] for r in p.interiors];vs=np.array([q for r in rr for q in r],dtype=float);ids=E.triangulate_float64(vs,np.cumsum([len(r)for r in rr],dtype=np.uint32));off=len(ps)//3
  for x,z in vs:ps.extend([x,float(h(x,z)),z])
  for k in range(0,len(ids),3):
   t=ids[k:k+3];q=vs[t];cross=np.cross(q[1]-q[0],q[2]-q[0]);ix.extend((t if cross>0 else t[[0,2,1]])+off)
for ch in meta['chunks']:
 p=P[ch['offset']:ch['offset']+ch['count']*3].reshape(-1,3);idx=I[ch['indexOffset']:ch['indexOffset']+ch['indexCount']];kind=ch['kind'];groups={}
 if not len(p):continue
 if not box(p[:,0].min(),p[:,2].min(),p[:,0].max(),p[:,2].max()).intersects(mask):
  q=dict(ch);q.update(offset=len(out),indexOffset=len(ixs));chunks.append(q);out+=p.flatten().tolist();ixs+=idx.tolist();continue
 for k in range(0,len(idx),3):
  vs=p[idx[k:k+3]].astype(float);tri=Polygon(vs[:,[0,2]])
  if tri.area<1e-9:
   ps,ii=groups.setdefault(kind,([],[]));o=len(ps)//3;ps+=vs.flatten().tolist();ii.extend([o,o+1,o+2]);continue
  coeff=np.linalg.solve(np.c_[vs[:,0],vs[:,2],np.ones(3)],vs[:,1]);h=lambda x,z:coeff@[x,z,1];pieces=[(tri,kind,h)]
  # Remove only old ground below the two replacement deck polygons.
  if tri.intersects(decks):pieces=[(tri.difference(decks),kind,h)]
  def replace(region,new,fn=None):
   global pieces
   newpieces=[]
   for p,k,hh in pieces:
    if not p.intersects(region):newpieces.append((p,k,hh));continue
    cut=p.intersection(region);rest=p.difference(region);newpieces.extend([(rest,k,hh),(cut,new,fn or hh)])
   pieces=newpieces
  if kind!='road' and tri.intersects(gate):replace(gate,'gateStone44');replace(pine,'grass');replace(basin,'gateWater44',lambda x,z:B+.01)
  if kind!='road' and tri.intersects(apron):replace(apron,'gateStone44')
  if kind=='water' and tri.intersects(pond):replace(pond,'pondWater44',lambda x,z:B)
  if kind=='turf' and tri.intersects(stadium):replace(stadium.difference(pitch),'mint44')
  for shape,kk,hh in pieces:
   ps,ii=groups.setdefault(kk,([],[]));put(shape,hh,ps,ii)
 for kk,(ps,ii) in groups.items():
  if not ii:continue
  points,inv=np.unique(np.array(ps,dtype='<f4').reshape(-1,3),axis=0,return_inverse=True);ids=inv[np.array(ii,dtype=int)].reshape(-1,3);tt=points[ids];cross=np.cross(tt[:,1]-tt[:,0],tt[:,2]-tt[:,0]);areas=np.linalg.norm(cross,axis=1)
  # Quantization can reverse tiny clipped slivers; fix final float32 winding
  # before shared-vertex normal accumulation, which otherwise cancels normals.
  reverse=cross[:,1]>0;ids[reverse]=ids[reverse][:,[0,2,1]]
  ii=ids[areas>1e-7].flatten().tolist();ps=points.flatten().tolist()
  q=dict(ch);q.update(kind=kk,offset=len(out),count=len(ps)//3,indexOffset=len(ixs),indexCount=len(ii));chunks.append(q);out+=ps;ixs+=ii
  if kk.endswith('44'):changed[kk]=changed.get(kk,0)+len(ii)//3
meta.update(chunks=chunks,revision='BUILD44-exclusive-facility-finishes');np.array(out,dtype='<f4').tofile(O/'ground.bin');np.array(ixs,dtype='<u4').tofile(O/'ground-indices.bin');(O/'ground.json').write_text(json.dumps(meta,separators=(',',':')));print(changed)
