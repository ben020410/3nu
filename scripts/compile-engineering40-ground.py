from pathlib import Path
import json,numpy as np,mapbox_earcut as ear
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
import subprocess,tempfile
R=Path(__file__).resolve().parents[1]; W=R/'dist/data'; O=W; tmp=tempfile.TemporaryDirectory(); S=Path(tmp.name)
for name in ['ground.json','ground.bin','ground-indices.bin']: (S/name).write_bytes(subprocess.check_output(['git','show','4498b99e210fe5fa8c315f7ee7081492e6286f19:dist/data/'+name],cwd=R))
m=json.loads((S/'ground.json').read_text());spec=json.loads((W/'engineering40.json').read_text());zone=unary_union([Polygon(p) for p in spec['aprons']]);positions=np.fromfile(S/'ground.bin',dtype='<f4');indices=np.fromfile(S/'ground-indices.bin',dtype='<u4');outP=[];outI=[];chunks=[];changed=[];newP=[];newI=[];area=0;maxError=0

def polys(p):return [p] if p.geom_type=='Polygon' else [q for q in getattr(p,'geoms',[]) if q.geom_type=='Polygon']
def emit(g,plane,ps,ix):
 for p in polys(g):
  if p.area<1e-9:continue
  rings=[list(p.exterior.coords)[:-1]]+[list(r.coords)[:-1] for r in p.interiors];vs=np.array([q for r in rings for q in r]);ends=np.cumsum([len(r) for r in rings],dtype=np.uint32);ii=ear.triangulate_float64(vs,ends);start=len(ps)//3
  for x,z in vs:ps.extend([x,plane[0]*x+plane[1]*z+plane[2],z])
  # Preserve the existing Babylon terrain winding (left-handed normals).
  for k in range(0,len(ii),3):
   a,b,c=[int(i) for i in ii[k:k+3]];va,vb,vc=vs[[a,b,c]];cross=(vb[0]-va[0])*(vc[1]-va[1])-(vb[1]-va[1])*(vc[0]-va[0]);ix.extend([start+a,start+c,start+b] if cross<0 else [start+a,start+b,start+c])
for part in m['chunks']:
 pp=positions[part['offset']:part['offset']+part['count']*3].reshape(-1,3);ii=indices[part['indexOffset']:part['indexOffset']+part['indexCount']];localP=pp.flatten().tolist();localI=ii.tolist()
 if part['kind'] in ['grass','lawn'] and box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(zone):
  localP=[];localI=[];touched=False
  for k in range(0,len(ii),3):
   v=pp[ii[k:k+3]].astype(float);p=Polygon(v[:,[0,2]])
   if p.area<1e-9 or not p.intersects(zone):
    off=len(localP)//3;localP.extend(v.flatten());localI.extend([off,off+1,off+2]);continue
   hit=p.intersection(zone)
   if hit.area<1e-8:
    off=len(localP)//3;localP.extend(v.flatten());localI.extend([off,off+1,off+2]);continue
   plane=np.linalg.solve(np.c_[v[:,0],v[:,2],np.ones(3)],v[:,1]);emit(p.difference(zone),plane,localP,localI);emit(hit,plane,newP,newI);area+=hit.area;touched=True
  if touched:changed.append([part['x'],part['z'],part['kind']])
  else:localP=pp.flatten().tolist();localI=ii.tolist()
 q=dict(part);q.update(offset=len(outP),count=len(localP)//3,indexOffset=len(outI),indexCount=len(localI));chunks.append(q);outP+=localP;outI+=localI
chunks.append({'x':'entrances40','z':0,'kind':'path','offset':len(outP),'count':len(newP)//3,'indexOffset':len(outI),'indexCount':len(newI)});outP+=newP;outI+=newI
np.asarray(outP,dtype='<f4').tofile(O/'ground.bin');np.asarray(outI,dtype='<u4').tofile(O/'ground-indices.bin');m['chunks']=chunks;m['vertices']=len(outP)//3;m['triangles']=len(outI)//3;m['bytes']=len(outP)*4+len(outI)*4;m['engineering40']={'method':'Exclusive material replacement on existing terrain triangle planes; no added top faces or height changes','changedChunks':changed,'pavedAreaM2':area,'aprons':spec['aprons']};(O/'ground.json').write_text(json.dumps(m,separators=(',',':')));(R/'reports/build40/ground-audit.json').write_text(json.dumps(m['engineering40'],indent=2));print(m['engineering40']['changedChunks'],area)
