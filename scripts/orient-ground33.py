"""Canonical top-face winding after float32 packing (not a render workaround).

Boolean splits create sub-millimetre slivers. Packing metre coordinates as
float32 can collapse or reverse those faces and poison shared vertex normals.
Remove collapsed faces, orient the remainder, and compact the index ranges.
Run after mesh-ring33.py. Vertical architectural walls are separate meshes.
"""
import json,pathlib
import numpy as np
R=pathlib.Path(__file__).resolve().parents[1];P=R/'dist/data';O=R/'reports/build33'
M=json.loads((P/'ground.json').read_text());V=np.fromfile(P/'ground.bin',dtype='<f4').reshape(-1,3);I=np.fromfile(P/'ground-indices.bin',dtype='<u4')
parts=[];offset=0;flipped=removed=0
for c in M['chunks']:
 ix=I[c['indexOffset']:c['indexOffset']+c['indexCount']].reshape(-1,3).copy()
 t=V[c['offset']//3+ix].astype(float)
 area=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0])[:,1]
 keep=abs(area)>1e-10;removed+=int((~keep).sum());ix=ix[keep];area=area[keep]
 reverse=area>0;flipped+=int(reverse.sum());ix[reverse]=ix[reverse][:,[0,2,1]]
 c['indexOffset']=offset;c['indexCount']=ix.size;offset+=ix.size;parts.append(ix.ravel())
np.concatenate(parts).astype('<u4').tofile(P/'ground-indices.bin')
M['triangles']=offset//3;M['bytes']=M['vertices']*12+offset*4
M['ring33']['windingRepair']={'flipped':flipped,'collapsedRemoved':removed}
(P/'ground.json').write_text(json.dumps(M,separators=(',',':')))
(O/'mesh-winding.json').write_text(json.dumps(M['ring33']['windingRepair'],indent=2))
print(M['ring33']['windingRepair'])
