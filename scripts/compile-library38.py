"""BUILD38 exclusive plaza reconstruction. Reproducible from tracked BUILD37 source.
Requires numpy, shapely 2 and mapbox_earcut. No network or historical archive.
The immutable mesh input is intentional; this is the BUILD38 migration, not a
future global rebuild command. Preserve later terrain edits in subsequent migrations.
"""
from pathlib import Path
import json, numpy as np, shapely as S, mapbox_earcut as E
from shapely.geometry import Polygon,box
import subprocess
R=Path(__file__).resolve().parents[1];W=R/'reports/build38';W.mkdir(parents=True,exist_ok=True);D=R/'dist/data'
SOURCE='604f981aee400169d0f0dc58d21456741d919fe9'
def source(name):return subprocess.check_output(['git','show',SOURCE+':dist/data/'+name],cwd=R)
n=json.loads((D/'walk.json').read_text());owned=json.loads((R/'sources/library38-plaza.json').read_text());mask=Polygon(owned['outer'],owned.get('holes',[]));level=owned['groundY'];meta=json.loads(source('ground.json'));verts=np.frombuffer(source('ground.bin'),dtype='<f4');ix=np.frombuffer(source('ground-indices.bin'),dtype='<u4');newv=[];newi=[];chunks=[];vo=io=0;inside=[];removed={};outsideBefore=outsideAfter=0;changedChunks=0

def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-9:yield g
 else:
  for c in getattr(g,'geoms',[]):yield from parts(c)
def pack(g):return {'outer':list(g.exterior.coords)[:-1],'holes':[list(h.coords)[:-1]for h in g.interiors]}
def tri(g):
 for q in parts(g):
  rings=[list(q.exterior.coords)[:-1]]+[list(h.coords)[:-1]for h in q.interiors];ps=np.array([p for r in rings for p in r],dtype=np.float64);ii=E.triangulate_float64(ps,np.cumsum([len(r)for r in rings],dtype=np.uint32));yield from (ps[ii[j:j+3]] for j in range(0,len(ii),3))
def add(v,i,chunk,repair=False):
 global vo,io
 v=np.array(v,dtype='<f4').reshape(-1,3);i=np.array(i,dtype='<u4').reshape(-1);
 if len(i) and repair:
  ts=v[i.reshape(-1,3)];cross=(ts[:,1,2]-ts[:,0,2])*(ts[:,2,0]-ts[:,0,0])-(ts[:,1,0]-ts[:,0,0])*(ts[:,2,2]-ts[:,0,2]);keep=abs(cross)>1e-10;it=i.reshape(-1,3)[keep].copy();flip=cross[keep]>0;it[flip]=it[flip][:,[0,2,1]];i=it.reshape(-1)
 chunks.append({**chunk,'offset':vo,'count':len(v),'indexOffset':io,'indexCount':len(i)});newv.append(v.reshape(-1));newi.append(i);vo+=v.size;io+=i.size
for c in meta['chunks']:
 v=verts[c['offset']:c['offset']+c['count']*3].reshape(-1,3);ii=ix[c['indexOffset']:c['indexOffset']+c['indexCount']];xz=v[:,[0,2]]
 if not box(*np.min(xz,axis=0),*np.max(xz,axis=0)).intersects(mask):add(v,ii,c);continue
 vv=[];ind=[];changed=False
 for j in range(0,len(ii),3):
  t=v[ii[j:j+3]].astype(float);poly=Polygon(t[:,[0,2]]);cut=poly.intersection(mask)
  if cut.area<1e-9:ind.extend(range(len(vv),len(vv)+3));vv.extend(t);continue
  changed=True;inside.extend(parts(cut));removed[c['kind']]=removed.get(c['kind'],0)+cut.area;rest=poly.difference(mask)
  # Reconstruct only outside fragments on their unchanged original triangle plane.
  a,b,d=t;matrix=np.array([[b[0]-a[0],d[0]-a[0]],[b[2]-a[2],d[2]-a[2]]]);inv=np.linalg.inv(matrix) if abs(np.linalg.det(matrix))>1e-15 else None
  for xzt in tri(rest):
   coeff=(xzt-a[[0,2]])@inv.T;y=a[1]+coeff[:,0]*(b[1]-a[1])+coeff[:,1]*(d[1]-a[1]);pts=np.column_stack([xzt[:,0],y,xzt[:,1]]);ind.extend(range(len(vv),len(vv)+3));vv.extend(pts)
 if changed:changedChunks+=1;add(vv,ind,c,True)
 else:add(v,ii,c)
coverage=S.union_all(inside,grid_size=.00001);v=[];indices=[]
# One triangulated plaza owner, no inherited road seams or stacked surfaces.
for t in tri(coverage):
 points=[[x,level,z]for x,z in t];indices.extend(range(len(v),len(v)+3));v.extend(points)
add(v,indices,{'x':'library38','z':'court','kind':'plaza'},True)
meta['chunks']=chunks;meta['vertices']=vo//3;meta['triangles']=io//3;meta['bytes']=(vo+io)*4;meta['library38']={'source':'BUILD37 ground; canonical SC plaza reconstruction','removedAreaByMaterial':removed,'newArea':coverage.area,'oldAreaSum':sum(removed.values()),'changedChunks':changedChunks,'newTriangles':len(indices)//3,'height':level}
np.concatenate(newv).tofile(D/'ground.bin');np.concatenate(newi).tofile(D/'ground-indices.bin');(D/'ground.json').write_text(json.dumps(meta,separators=(',',':')))
# Keep walking graph and real vehicle roads. Surface ownership prevents their
# generic material sweeps from generating pavement ribbons inside this square.
new=[];removedSources=[]
for q in n['surfaces']:
 if q.get('id','').startswith('library38-court-'):continue
 g=Polygon(q['outer'],q.get('holes',[]))
 if g.intersection(mask).area<1e-7:new.append(q);continue
 rest=g.difference(mask)
 if g.intersection(mask).area>.001:removedSources.append({'id':q.get('id'),'kind':q['kind'],'area':g.intersection(mask).area})
 for h in parts(rest):new.append({**q,**pack(h)})
plazas=[{'id':'library38-court-'+str(i),'kind':'plaza',**pack(g),'groundY':level,'source':'BUILD38 owned plaza; generic road render excluded, navigation graph retained'}for i,g in enumerate(parts(mask))]
n['ownedPlazas38']=plazas;n['surfaces']=plazas+new;n['library38GroundAudit']={**meta['library38'],'removedSources':removedSources,'noNavigationEdits':True}
(D/'walk.json').write_text(json.dumps(n,ensure_ascii=False,separators=(',',':')));(W/'ground-replacement.json').write_text(json.dumps(n['library38GroundAudit'],ensure_ascii=False,indent=2))
print(json.dumps(meta['library38'],indent=2))
