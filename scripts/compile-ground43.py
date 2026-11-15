from pathlib import Path
import json,math,numpy as np,shapely as S,mapbox_earcut as E
from shapely.geometry import Polygon,Point,box,LineString
from shapely.ops import unary_union
from shapely.strtree import STRtree
import tempfile,subprocess
R=Path(__file__).resolve().parents[1];tmp=tempfile.TemporaryDirectory();W=Path(tmp.name);O=R/'dist/data'
subprocess.run(['/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node',str(R/'scripts/prepare-ground43.cjs'),str(W)],check=True)

meta=json.loads((W/'render-ground.json').read_text());P=np.fromfile(W/'render-ground.bin',dtype='<f4');I=np.fromfile(W/'render-indices.bin',dtype='<u4');D=json.loads((W/'prepared.json').read_text());lib=D['library'];cul=json.loads((R/'dist/data/civic42.json').read_text())['models'][0]['fit'];base=lib['base'];cb=cul['datum']
def world(g,f):return S.transform(g,lambda p:np.array(f['origin'])+p[:,0,None]*np.array(f['u'])+p[:,1,None]*np.array(f['v']))
def loc(x,z,f):q=np.array([x,z])-f['origin'];return float(q@np.array(f['u'])),float(q@np.array(f['v']))
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-8:yield g
 else:
  for q in getattr(g,'geoms',[]):yield from parts(q)
def tr(g):
 for p in parts(g):
  rings=[list(p.exterior.coords)[:-1]]+[list(h.coords)[:-1]for h in p.interiors];v=np.array([q for rr in rings for q in rr]);ix=E.triangulate_float64(v,np.cumsum([len(r)for r in rings],dtype=np.uint32))
  for k in range(0,len(ix),3):yield v[ix[k:k+3]]
def pack(g):return {'outer':list(g.exterior.coords)[:-1],'holes':[list(h.coords)[:-1] for h in g.interiors]}
# Only the shown local interfaces. No campus-wide terrain changes.
z1=world(box(98,-5,122,88),cul)
z3=world(Polygon([(107,69),(164,69),(164,74),(136,132),(115,137),(107,137)]),lib)
z4=world(box(-32,64,-3,99),lib)
# Protected architecture and existing structural floors remain their own owners.
protected=unary_union([Polygon(q['p']) for q in lib['surfaces'] if q.get('steps') or q.get('finish39')]+[Polygon(q['outer'],q.get('holes',[])) for q in lib['acro39']['patches'] if q['id'].startswith('SC-court')]+[Polygon(b['p']) for b in D['buildings'] if b['id'] in ['167607356','167984624','167609409','148286730']])
# Do not alter the upper lawn slab, its stairs, or the underpass terrain.
l=D['lawn'];lf={'origin':l['center'],'u':l['u'],'v':l['v']};lawn=world(box(-59,-44,59,44),lf)
z1=z1.difference(lawn);z3=z3.difference(protected);z4=z4.difference(protected)
zones=[z1,z3,z4];mask=unary_union(zones);bounds=mask.bounds
# Exact pre-change rendered triangles are the boundary datum.
pol=[];verts=[];kinds=[];alltris=[];referenceMask=mask.buffer(8)
for ch in meta['chunks']:
 pp=P[ch['offset']:ch['offset']+ch['count']*3].reshape(-1,3);ix=I[ch['indexOffset']:ch['indexOffset']+ch['indexCount']]
 if not len(pp) or not box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(referenceMask):continue
 for k in range(0,len(ix),3):
  t=pp[ix[k:k+3]].astype(float);p=Polygon(t[:,[0,2]])
  if p.area>1e-8 and p.intersects(referenceMask):pol.append(p);verts.append(t);kinds.append(ch['kind'])
tree=STRtree(pol);planes=[np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]) for t in verts]
def old(x,z):
 p=Point(x,z);ids=tree.query(p)
 hits=[j for j in ids if pol[j].buffer(1e-6).covers(p)]
 if not hits:j=tree.nearest(p);return float(np.array([x,z,1])@planes[j])
 return float(np.mean([np.array([x,z,1])@planes[j] for j in hits]))
def interp(nodes,d):return float(np.interp(d,[p[0]for p in nodes],[p[1]for p in nodes]))
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
# Solve only the open 1-dong court with its actual surrounding datum fixed.
# A harmonic field removes the legacy diagonal ridge without moving thresholds.
step=.75;aa=np.arange(106.5,165.01,step);dd=np.arange(68.25,138.01,step);HH=np.zeros((len(dd),len(aa)));free=np.zeros_like(HH,dtype=bool)
for j,d in enumerate(dd):
 for i,a in enumerate(aa):
  q=np.array(lib['origin'])+np.array(lib['u'])*a+np.array(lib['v'])*d;p=Point(*q);HH[j,i]=old(*q);free[j,i]=z3.contains(p) and p.distance(z3.boundary)>.8
for iteration in range(4000):
 avg=(HH[:-2,1:-1]+HH[2:,1:-1]+HH[1:-1,:-2]+HH[1:-1,2:])*.25;delta=np.where(free[1:-1,1:-1],avg-HH[1:-1,1:-1],0);HH[1:-1,1:-1]+=delta
 if np.max(abs(delta))<.00001:break
print('court relaxation',iteration,flush=True)
def harmonic(a,d):
 u=max(0,min(len(aa)-1.00001,(a-aa[0])/step));v=max(0,min(len(dd)-1.00001,(d-dd[0])/step));i=int(u);j=int(v);u-=i;v-=j;return HH[j,i]*(1-u)*(1-v)+HH[j,i+1]*u*(1-v)+HH[j+1,i]*(1-u)*v+HH[j+1,i+1]*u*v
def height(x,z,zone):
 raw=old(x,z);p=Point(x,z)
 if zone==0:
  a,d=loc(x,z,cul);t=ease((a-101)/21);q=cul['origin']+np.array(cul['u'])*122+np.array(cul['v'])*d;target=cb*(1-t)+old(*q)*t;w=ease((d+5)/8)*ease((88-d)/8)
  # Keep existing low stair/underpass datum at the protected lawn boundary.
  w*=ease(p.distance(lawn)/3)
 elif zone==1:
  a,d=loc(x,z,lib);target=harmonic(a,d);w=ease(p.distance(z3.boundary)/1.5)
 else:
  a,d=loc(x,z,lib);ramp=4.45*max(0,min(1,(99-d)/26));side=interp([(64,4.45),(73,4.45),(88,1.6),(98,1.6),(112,0)],d);h=4.45 if d<=73 else ramp
  if a>-18:h=h*(1-(a+18)/15)+side*((a+18)/15)
  t=ease((a+32)/14) if a<-18 else 1;target=base+h*t;w=ease((d-64)/5)*ease((99-d)/4)
  # Exact retained SC court and D stair thresholds.
  if d<=73 and a>=-18:target=base+4.45
 return raw*(1-w)+target*w
# Coherent material areas: keep S1 path; outer green banks only. No road strip within shared court.
stone1=unary_union([pol[j] for j,k in enumerate(kinds) if k in ['civicStone42','path','plaza','steps','road']]).intersection(z1)
# Remove tiny isolated grass wedges inside the apron; actual S1 corridor remains continuous.
stone1=stone1.buffer(.6).buffer(-.6).intersection(z1)
matzones=[[(stone1,'finishStone43'),(z1.difference(stone1),'finishGrass43')],[(z3,'finishStone43')],[(z4.intersection(world(box(-19,64,-3,99),lib)),'acroStone43'),(z4.difference(world(box(-19,64,-3,99),lib)),'acroGrass43')]]
# Cut all prior terrain partitions out of the ownership masks, then rebuild them once.
outP=[];outI=[];chunks=[];newgroups={};physical=[];counts={};cache={}
def put(g,fn,ps,ii):
 for t in tr(g):
  off=len(ps)//3
  for x,z in t:ps.extend([float(x),float(fn(x,z)),float(z)])
  cross=np.cross(t[1]-t[0],t[2]-t[0]);ii.extend([off,off+1,off+2] if cross>=0 else [off,off+2,off+1])
originalP=np.fromfile(W/'before/data/ground.bin',dtype='<f4')
for ch in meta['chunks']:
 pp=originalP[ch['offset']:ch['offset']+ch['count']*3].reshape(-1,3);ix=I[ch['indexOffset']:ch['indexOffset']+ch['indexCount']];lp=[];li=[];changed=0
 if not len(pp) or not box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(mask):
  q=dict(ch);q.update(offset=len(outP),count=len(pp),indexOffset=len(outI),indexCount=len(ix));chunks.append(q);outP+=pp.flatten().tolist();outI+=ix.tolist();continue
 for k in range(0,len(ix),3):
  t=pp[ix[k:k+3]].astype(float);p=Polygon(t[:,[0,2]])
  if p.area<1e-8 or not p.intersects(mask):off=len(lp)//3;lp.extend(t.flatten());li.extend([off,off+1,off+2]);continue
  cut=p.intersection(mask)
  if cut.area<1e-7:off=len(lp)//3;lp.extend(t.flatten());li.extend([off,off+1,off+2]);continue
  plane=np.linalg.solve(np.c_[t[:,0],t[:,2],np.ones(3)],t[:,1]);put(p.difference(mask),lambda x,z:plane@[x,z,1],lp,li);changed+=1
 q=dict(ch);q.update(offset=len(outP),count=len(lp)//3,indexOffset=len(outI),indexCount=len(li));chunks.append(q);outP+=lp;outI+=li
 if changed:counts[str(ch['x'])+','+str(ch['z'])+':'+ch['kind']]=changed
# New triangulation uses a 1.5m sampling grid; common heights at every shared point.
for zi,zone in enumerate(zones):
 cover=unary_union([p.intersection(zone) for p in pol if p.intersects(zone)])
 for area,kind in matzones[zi]:
  area=area.intersection(cover);ps,ii=newgroups.setdefault(kind,([],[]));xmin,zmin,xmax,zmax=area.bounds
  for x in np.arange(math.floor(xmin/1.5)*1.5,xmax,1.5):
   for z in np.arange(math.floor(zmin/1.5)*1.5,zmax,1.5):
    g=area.intersection(box(x,z,x+1.5,z+1.5))
    if g.area<1e-8:continue
    for t in tr(g):
     vv=[]
     for xx,zz in t:
      key=(zi,round(xx,6),round(zz,6));h=cache.setdefault(key,height(xx,zz,zi));vv.append([float(xx),h,float(zz)])
     v32=np.array(vv,dtype=np.float32).astype(float);a,b,c=v32[:,[0,2]];det=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
     if abs(det)<.00001:continue
     if np.cross(t[1]-t[0],t[2]-t[0])<0:vv=[vv[0],vv[2],vv[1]]
     off=len(ps)//3;ps.extend(np.array(vv).flatten());ii.extend([off,off+1,off+2]);physical.append(vv)
for kind,(ps,ii) in newgroups.items():chunks.append({'x':'finish43','z':0,'kind':kind,'offset':len(outP),'count':len(ps)//3,'indexOffset':len(outI),'indexCount':len(ii)});outP+=ps;outI+=ii
np.array(outP,dtype='<f4').tofile(O/'ground.bin');np.array(outI,dtype='<u4').tofile(O/'ground-indices.bin');meta.update(chunks=chunks,vertices=len(outP)//3,triangles=len(outI)//3);meta['finish43']={'revision':'ground-finish43-r1','zones':[pack(p) for z in zones for p in parts(z)],'changedChunks':counts,'newTriangles':len(physical)};(O/'ground.json').write_text(json.dumps(meta,separators=(',',':')))
# Use GPU float32 coordinates for the runtime movement height, not a separate approximation.
physical=np.array(physical,dtype=np.float32).astype(float).tolist();
for t in physical:
 for p in t:p.append(old(p[0],p[2]))
spec={'revision':'ground-finish43-r1','zones':[pack(p) for z in zones for p in parts(z)],'triangles':physical};(O/'finish43.json').write_text(json.dumps(spec,separators=(',',':')));(R/'reports/build43/ground-audit.json').write_text(json.dumps(meta['finish43'],indent=2));print('replacement areas',[z.area for z in zones],'triangles',len(physical))
