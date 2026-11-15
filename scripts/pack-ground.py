import json,pathlib,numpy as np
r=pathlib.Path(__file__).resolve().parents[1]/'dist/data';m=json.loads((r/'ground.json').read_text());a=np.fromfile(r/'ground.bin',dtype='<f4');out=[];indices=[];off=ioff=0
assert 'indexCount' not in m['chunks'][0], 'Run build-ground.py to regenerate unpacked data first'
for p in m['chunks']:
 v=a[p['offset']:p['offset']+p['count']*3].reshape(-1,3);t=v.reshape(-1,3,3).copy();q=t[:,:,[0,2]].astype(float);area=(q[:,1,0]-q[:,0,0])*(q[:,2,1]-q[:,0,1])-(q[:,1,1]-q[:,0,1])*(q[:,2,0]-q[:,0,0]);negative=area<0;t[negative]=t[negative][:,[0,2,1],:];v=t[abs(area)>1e-10].reshape(-1,3);unique,inv=np.unique(v,axis=0,return_inverse=True);out.append(unique.reshape(-1));indices.append(inv.astype('<u4'));p.update(offset=off,count=len(unique),indexOffset=ioff,indexCount=len(inv));off+=unique.size;ioff+=len(inv)
np.concatenate(out).astype('<f4').tofile(r/'ground.bin');np.concatenate(indices).tofile(r/'ground-indices.bin');m['bytes']=off*4+ioff*4;m['vertices']=off//3;m['triangles']=ioff//3;(r/'ground.json').write_text(json.dumps(m,separators=(',',':')));print(m['bytes'],m['vertices'],m['triangles'])
