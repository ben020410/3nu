"""Partition the original terrain triangles, never overlay roads. Metres throughout."""
import json, pathlib, numpy as np, shapely, mapbox_earcut
from shapely.geometry import Polygon
from shapely.strtree import STRtree
def triangulate(shape):
 if shape.geom_type!='Polygon':
  return [t for p in getattr(shape,'geoms',[]) for t in triangulate(p)]
 rings=[list(shape.exterior.coords)[:-1]]+[list(r.coords)[:-1]for r in shape.interiors]
 points=np.array([p for r in rings for p in r],dtype=np.float64)
 indices=mapbox_earcut.triangulate_float64(points,np.cumsum([len(r)for r in rings],dtype=np.uint32))
 return [Polygon(points[indices[i:i+3]])for i in range(0,len(indices),3)]
root=pathlib.Path(__file__).resolve().parents[1]; nav=json.loads((root/'dist/data/walk.json').read_text())
n=nav['terrain']['n']; h=nav['terrain']['values']; x0,z0,x1,z1=nav['bounds']; dx=(x1-x0)/(n-1); dz=(z1-z0)/(n-1)
polys=[shapely.make_valid(Polygon(s['outer'],s['holes'])) for s in nav['surfaces']]; tree=STRtree(polys); kinds=['rearPaving','clay','courtGreen','courtApron','baseballDirt','infield','grass','road','path','steps','plaza','water','bank','track','turf','plazaBand','sportApron','wood','planting','soil','parking','lawn']; chunks=[]; arrays=[]; offset=0; maxerr=0; total=0
# Optional local regeneration preserves all other campus chunks byte-for-byte before packing.
import sys
local28='--junction28' in sys.argv or '--precinct29' in sys.argv or '--landmarks30' in sys.argv
if local28:
 oldmeta=json.loads((root/'dist/data/ground.json').read_text());oldverts=np.fromfile(root/'dist/data/ground.bin',dtype='<f4');oldidx=np.fromfile(root/'dist/data/ground-indices.bin',dtype='<u4')
 localpts=([p for q in nav['landmarks30']['scopes']for p in q['outer']] if '--landmarks30' in sys.argv else nav['precinct29']['scope']['outer'] if '--precinct29' in sys.argv else [p for s in nav['surfaces'] if '28-' in s.get('id','') for p in s['outer']])
 bx0=min(p[0]for p in localpts)-10;bx1=max(p[0]for p in localpts)+10;bz0=min(p[1]for p in localpts)-10;bz1=max(p[1]for p in localpts)+10
cuts=shapely.union_all([Polygon(q['outer'],q.get('holes',[]))for q in nav.get('precinct29',{}).get('renderCuts',[])+nav.get('landmarkCuts30',[])])
for gz in range(0,n-1,40):
 for gx in range(0,n-1,40):
  if local28 and (x0+(gx+40)*dx<bx0 or x0+gx*dx>bx1 or z0+(gz+40)*dz<bz0 or z0+gz*dz>bz1):
   for c in oldmeta['chunks']:
    if c['x']!=gx or c['z']!=gz:continue
    vv=oldverts[c['offset']:c['offset']+c['count']*3].reshape(-1,3);ii=oldidx[c['indexOffset']:c['indexOffset']+c['indexCount']];arr=vv[ii].reshape(-1)
    arrays.append(arr);chunks.append(dict(kind=c['kind'],x=gx,z=gz,offset=offset,count=len(arr)//3));offset+=len(arr);total+=len(arr)//9
   continue
  buffers={k:[] for k in kinds}
  for j in range(gz,min(gz+40,n-1)):
   for i in range(gx,min(gx+40,n-1)):
    xa=x0+i*dx; za=z0+j*dz
    for second in (False,True):
     coords=[(xa+dx,za),(xa+dx,za+dz),(xa,za+dz)] if second else [(xa,za),(xa+dx,za),(xa,za+dz)]
     tri=Polygon(coords); remaining=tri.difference(cuts); expectedArea=remaining.area; parts=[]
     # Match walk-core first-match surface priority; STRtree order is not semantic.
     for q in sorted(tree.query(tri,predicate='intersects'),key=lambda q:(0 if nav['surfaces'][q].get('groundY') is not None or nav['surfaces'][q].get('heightProfile') else 1,q)):
      p=remaining.intersection(polys[q]);
      if p.area>1e-9: parts.append((nav['surfaces'][q]['kind'],p,nav['surfaces'][q].get('heightProfile',nav['surfaces'][q].get('groundY')))); remaining=remaining.difference(polys[q])
     if remaining.area>1e-9: parts.append(('grass',remaining,None))
     maxerr=max(maxerr,abs(sum(p.area for k,p,level in parts)-expectedArea))
     for kind,shape,level in parts:
      ts=[shape] if shape.geom_type=='Polygon' and len(shape.exterior.coords)==4 and not shape.interiors else triangulate(shape)
      for t in ts:
       pts=list(t.exterior.coords)[:3]
       if (pts[1][0]-pts[0][0])*(pts[2][1]-pts[0][1])-(pts[1][1]-pts[0][1])*(pts[2][0]-pts[0][0])<0: pts.reverse()
       for x,z in pts:
        a=(x-xa)/dx;b=(z-za)/dz; q=j*n+i
        y=(h[q+1]*(1-b)+h[q+n]*(1-a)+h[q+n+1]*(a+b-1)) if second else h[q]*(1-a-b)+h[q+1]*a+h[q+n]*b
        if isinstance(level,list):
         nearest=None
         for a0,b0 in zip(level,level[1:]):
          vx,vz=b0[0]-a0[0],b0[1]-a0[1]; tt=max(0,min(1,((x-a0[0])*vx+(z-a0[1])*vz)/(vx*vx+vz*vz or 1))); dd=(x-a0[0]-tt*vx)**2+(z-a0[1]-tt*vz)**2
          if nearest is None or dd<nearest[0]:nearest=(dd,a0[2]+tt*(b0[2]-a0[2]))
         yy=nearest[1]
        else: yy=y if level is None else level
        buffers[kind].extend((x,yy,z))
  for kind,values in buffers.items():
   if not values: continue
   a=np.asarray(values,dtype='<f4'); arrays.append(a);chunks.append(dict(kind=kind,x=gx,z=gz,offset=offset,count=len(values)//3)); offset+=len(values);total+=len(values)//9
 print('row',gz,flush=True)
np.concatenate(arrays).tofile(root/'dist/data/ground.bin')
meta=dict(chunks=chunks,triangles=total,maxPartitionAreaErrorM2=maxerr,bytes=offset*4,repeatMetres=4,method='exclusive partition of existing terrain triangles; no raised road layer')
(root/'dist/data/ground.json').write_text(json.dumps(meta,separators=(',',':')))
print(json.dumps({k:v for k,v in meta.items() if k!='chunks'}))

import subprocess,sys
subprocess.run([sys.executable,str(root/"scripts/pack-ground.py")],check=True)

# Stabilize float32 nearest-segment profile seam elevations after indexing.
subprocess.run([sys.executable,str(root/"scripts/stabilize-profile26.py")],check=True)

if nav.get("roadGrades32"):
 subprocess.run([sys.executable,str(root/"scripts/refine-grades32.py")],check=True)
 subprocess.run([sys.executable,str(root/"scripts/grade-ground32.py")],check=True)
