"""Conforming subdivision of existing terrain triangles in three grade corridors.
Only splits existing faces; no overlay, changed footprint, or new layer.
Run on the packed, ungraded mesh, before grade-ground32.py.
"""
import json,pathlib,numpy as np
R=pathlib.Path(__file__).resolve().parents[1]/'dist/data';N=json.loads((R/'walk.json').read_text());M=json.loads((R/'ground.json').read_text());V=np.fromfile(R/'ground.bin',dtype='<f4').reshape(-1,3);I=np.fromfile(R/'ground-indices.bin',dtype='<u4');boxes=[]
for g in N.get('roadGrades32',[]):
 p=np.array(g['profile']);r=g['halfWidth']+g['shoulder']+2
 boxes.append((p[:,0].min()-r,p[:,1].min()-r,p[:,0].max()+r,p[:,1].max()+r))
def touches(t):
 x0,z0=t[:,[0,2]].min(axis=0);x1,z1=t[:,[0,2]].max(axis=0)
 return any(x1>=a and x0<=c and z1>=b and z0<=d for a,b,c,d in boxes)
def key(p):return tuple(np.round(p,5))
def edge(a,b):
 a,b=key(a),key(b);return (a,b) if a<b else (b,a)
chunks=[];active=[]
for i,c in enumerate(M['chunks']):
 t=V[c['offset']//3+I[c['indexOffset']:c['indexOffset']+c['indexCount']]].reshape(-1,3,3).astype(float);chunks.append(t)
 if touches(t.reshape(-1,3)):active.append(i)
original=sum(len(t)for t in chunks)
for iteration in range(8):
 marked={}
 for i in active:
  for t in chunks[i]:
   if not touches(t):continue
   for j in range(3):
    a,b=t[j],t[(j+1)%3]
    if np.linalg.norm((a-b)[[0,2]])>1.25:marked[edge(a,b)]=(a+b)/2
 if not marked:break
 for i in active:
  new=[]
  for t in chunks[i]:
   mids=[marked.get(edge(t[j],t[(j+1)%3]))for j in range(3)];present=[j for j in range(3)if mids[j]is not None]
   if not present:new.append(t);continue
   if len(present)==1:
    j=present[0];a,b,c=t[j],t[(j+1)%3],t[(j+2)%3];m=mids[j];new.extend([[a,m,c],[m,b,c]])
   elif len(present)==2:
    missing=next(j for j in range(3)if mids[j]is None);j=(missing+1)%3;a,b,c=t[j],t[(j+1)%3],t[(j+2)%3];m,n=mids[j],mids[(j+1)%3];new.extend([[b,n,m],[a,m,c],[m,n,c]])
   else:
    a,b,c=t;m,n,p=mids;new.extend([[a,m,p],[m,b,n],[p,n,c],[m,n,p]])
  chunks[i]=np.array(new)
 print('grade refinement',iteration+1,'split edges',len(marked),flush=True)
verts=[];indices=[];vo=io=0
for c,t in zip(M['chunks'],chunks):
 u,inv=np.unique(t.reshape(-1,3).astype('<f4'),axis=0,return_inverse=True);verts.append(u);indices.append(inv.astype('<u4'));c.update(offset=vo*3,count=len(u),indexOffset=io,indexCount=len(inv));vo+=len(u);io+=len(inv)
np.concatenate(verts).tofile(R/'ground.bin');np.concatenate(indices).tofile(R/'ground-indices.bin');M.update(vertices=vo,triangles=io//3,bytes=vo*12+io*4,gradeRefinement32={'maxPlanarEdge':1.25,'addedTriangles':io//3-original,'corridors':len(boxes)});(R/'ground.json').write_text(json.dumps(M,separators=(',',':')));print(M['gradeRefinement32'])
