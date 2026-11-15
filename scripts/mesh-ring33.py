"""Repartition only old/new ring and branch interfaces in the original indexed mesh.
Outside faces stay in place. Split faces share endpoints, no raised overlay surface.
"""
import json,pathlib,math,collections
import numpy as np,shapely as S,mapbox_earcut
from shapely.geometry import Polygon,LineString
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1];O=R/'reports/build33';F=R/'../../work/baseline33/dist/data'
M=json.loads((O/'source-data/ground.json').read_text());V=np.fromfile(F/'ground.bin',dtype='<f4').reshape(-1,3);I=np.fromfile(F/'ground-indices.bin',dtype='<u4');A=json.loads((O/'material-regions.json').read_text());N=json.loads((R/'dist/data/walk.json').read_text())
def poly(q):return S.make_valid(Polygon(q['outer'],q.get('holes',[])))
regs=[poly(q)for q in A['regions']];rt=STRtree(regs);coverage=S.union_all([poly(q)for q in A['coverage']]);S.prepare(coverage)
# Grade shoulders also receive true vertex refinement; they are not new plates.
gradeArea=S.union_all([LineString(N['ring33']['route']).buffer(18),LineString(N['ring33']['approach']).buffer(18)])
S.prepare(gradeArea)
def triangulate(g):
 if g.is_empty or g.area<1e-9:return []
 if g.geom_type!='Polygon':return [t for p in getattr(g,'geoms',[])for t in triangulate(p)]
 rings=[list(g.exterior.coords)[:-1]]+[list(r.coords)[:-1]for r in g.interiors];p=np.array([p for r in rings for p in r]);ix=mapbox_earcut.triangulate_float64(p,np.cumsum([len(r)for r in rings],dtype=np.uint32));return p[ix].reshape(-1,3,2)
def lift(ts,old):
 if len(ts)==0:return np.empty((0,3,3))
 ts=np.array(ts);a,b,c=old[:,[0,2]];den=np.cross(b-a,c-a);u=np.cross(ts-a,c-a)/den;v=np.cross(b-a,ts-a)/den;y=old[0,1]+u*(old[1,1]-old[0,1])+v*(old[2,1]-old[0,1]);return np.stack([ts[:,:,0],y,ts[:,:,1]],axis=-1)
buffers=collections.defaultdict(list);maxerr=0;changed=0
for ci,ch in enumerate(M['chunks']):
 t=V[ch['offset']//3+I[ch['indexOffset']:ch['indexOffset']+ch['indexCount']]].reshape(-1,3,3).astype(float);pp=S.polygons(t[:,:,[0,2]]);hit=S.intersects(coverage,pp);buffers[(ch['x'],ch['z'],ch['kind'])].extend(t[~hit])
 for tri,p in zip(t[hit],pp[hit]):
  if p.area<1e-9:continue
  left=p;area=0
  for j in rt.query(p,predicate='intersects'):
   q=left.intersection(regs[j]);left=left.difference(regs[j]);area+=q.area
   if q.area:buffers[(ch['x'],ch['z'],A['regions'][j]['kind'])].extend(lift(triangulate(q),tri))
  if left.area:buffers[(ch['x'],ch['z'],ch['kind'])].extend(lift(triangulate(left),tri))
  maxerr=max(maxerr,abs(area+left.area-p.area));changed+=1
 if ci%150==0:print('partition',ci,'/',len(M['chunks']),'changed',changed,flush=True)
# Conforming bisection. Shared edges in neighbouring material/spatial cells get
# exactly the same midpoint, including the boundary of the refined corridor.
chunks=[(k,np.array(t))for k,t in buffers.items()if len(t)];original=sum(len(t)for k,t in chunks)
def edge(a,b):
 a,b=tuple(np.round(a,5)),tuple(np.round(b,5));return (a,b)if a<b else(b,a)
for iteration in range(7):
 marked={}
 for k,t in chunks:
  pp=S.polygons(t[:,:,[0,2]]);hit=S.intersects(gradeArea,pp)
  for tri in t[hit]:
   for j in range(3):
    a,b=tri[j],tri[(j+1)%3]
    if np.linalg.norm((a-b)[[0,2]])>1.5:marked[edge(a,b)]=(a+b)/2
 if not marked:break
 newchunks=[]
 for k,t in chunks:
  tt=[]
  for tri in t:
   mids=[marked.get(edge(tri[j],tri[(j+1)%3]))for j in range(3)];present=[j for j in range(3)if mids[j]is not None]
   if not present:tt.append(tri);continue
   if len(present)==1:
    j=present[0];a,b,c=tri[j],tri[(j+1)%3],tri[(j+2)%3];m=mids[j];tt.extend([[a,m,c],[m,b,c]])
   elif len(present)==2:
    j=(next(j for j in range(3)if mids[j]is None)+1)%3;a,b,c=tri[j],tri[(j+1)%3],tri[(j+2)%3];m,n=mids[j],mids[(j+1)%3];tt.extend([[b,n,m],[a,m,c],[m,n,c]])
   else:
    a,b,c=tri;m,n,p=mids;tt.extend([[a,m,p],[m,b,n],[p,n,c],[m,n,p]])
  newchunks.append((k,np.array(tt)))
 chunks=newchunks;print('refine',iteration+1,'edges',len(marked),flush=True)
vv=[];ii=[];meta=[];vo=io=0
for (x,z,kind),t in chunks:
 u,inv=np.unique(t.reshape(-1,3).astype('<f4'),axis=0,return_inverse=True);vv.append(u);ii.append(inv.astype('<u4'));meta.append(dict(x=x,z=z,kind=kind,offset=vo*3,count=len(u),indexOffset=io,indexCount=len(inv)));vo+=len(u);io+=len(inv)
np.concatenate(vv).tofile(R/'dist/data/ground.bin');np.concatenate(ii).tofile(R/'dist/data/ground-indices.bin')
M.update(chunks=meta,vertices=vo,triangles=io//3,bytes=vo*12+io*4,ring33={'sourceTrianglesReplaced':changed,'partitionErrorM2':maxerr,'refinementAdded':io//3-original,'maxEdgeTarget':1.5,'method':'exclusive replacement of existing terrain triangles'})
(R/'dist/data/ground.json').write_text(json.dumps(M,separators=(',',':')));print(M['ring33'],flush=True)
