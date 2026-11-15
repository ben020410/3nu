"""Independent render-mesh vs controller-height comparison, not path reachability."""
import json,numpy as np,shapely
from shapely.strtree import STRtree
from pathlib import Path
R=Path(__file__).resolve().parents[1];M=json.loads((R/'dist/data/ground.json').read_text());V=np.fromfile(R/'dist/data/ground.bin',dtype='<f4').reshape(-1,3);I=np.fromfile(R/'dist/data/ground-indices.bin',dtype='<u4');ts=[]
for c in M['chunks']:
 ts.append(V[c['offset']//3+I[c['indexOffset']:c['indexOffset']+c['indexCount']]].reshape(-1,3,3))
T=np.concatenate(ts);Q=T[:,:,[0,2]].astype(float);polys=shapely.polygons(Q);tree=STRtree(polys)
S=json.loads((R/'reports/build32/ground-samples.json').read_text());P=np.array([[s['x'],s['z']]for s in S]);Y=np.array([s['y']for s in S]);pairs=tree.query(shapely.points(P),predicate='intersects');pi,ti=pairs
A,B,C=Q[ti,0],Q[ti,1],Q[ti,2];p=P[pi];det=(B[:,0]-A[:,0])*(C[:,1]-A[:,1])-(B[:,1]-A[:,1])*(C[:,0]-A[:,0]);det[np.abs(det)<1e-12]=np.nan
u=((p[:,0]-A[:,0])*(C[:,1]-A[:,1])-(p[:,1]-A[:,1])*(C[:,0]-A[:,0]))/det
v=((B[:,0]-A[:,0])*(p[:,1]-A[:,1])-(B[:,1]-A[:,1])*(p[:,0]-A[:,0]))/det
h=T[ti,0,1]+u*(T[ti,1,1]-T[ti,0,1])+v*(T[ti,2,1]-T[ti,0,1]);err=np.abs(Y[pi]-h)
errors=np.full(len(S),np.inf);np.minimum.at(errors,pi,err);valid=np.isfinite(errors);bad=np.flatnonzero(valid&(errors>.12));order=bad[np.argsort(errors[bad])[::-1]]
out={'samples':len(S),'terrainSamples':int(valid.sum()),'excludedArchitecturalCuts':int((~valid).sum()),'p95':float(np.percentile(errors[valid],95)),'max':float(errors[valid].max()),'above12cm':len(bad),'worst':[dict(S[i],error=float(errors[i]))for i in order[:100]]}
(R/'reports/build32/mesh-height-check.json').write_text(json.dumps(out,indent=2));print(json.dumps({k:v for k,v in out.items()if k!='worst'},indent=2));print(json.dumps(out['worst'][:8],indent=2))
