"""Apply the shared road-grade field to the existing exclusive terrain mesh.
This modifies vertices, never introduces another surface or draw-order offset.
"""
import json,pathlib,numpy as np
R=pathlib.Path(__file__).resolve().parents[1]/'dist/data'
N=json.loads((R/'walk.json').read_text());V=np.fromfile(R/'ground.bin',dtype='<f4').reshape(-1,3);x,z=V[:,0].astype(float),V[:,2].astype(float)
sumY=np.zeros(len(x));weight=np.zeros(len(x));strong=np.zeros(len(x))
for g in N.get('roadGrades32',[]):
 ps=np.array(g['profile']);radius=g['halfWidth']+g['shoulder'];mask=(x>=ps[:,0].min()-radius)&(x<=ps[:,0].max()+radius)&(z>=ps[:,1].min()-radius)&(z<=ps[:,1].max()+radius);ii=np.where(mask)[0];xx,zz=x[ii],z[ii];best=np.full(len(ii),np.inf);yy=np.zeros(len(ii))
 for a,b in zip(ps,ps[1:]):
  dx,dz=b[:2]-a[:2];t=np.clip(((xx-a[0])*dx+(zz-a[1])*dz)/(dx*dx+dz*dz or 1),0,1);dd=np.hypot(xx-a[0]-dx*t,zz-a[1]-dz*t);m=dd<best;best[m]=dd[m];yy[m]=a[2]+t[m]*(b[2]-a[2])
 t=np.clip((best-g['halfWidth'])/g['shoulder'],0,1);w=1-t*t*(3-2*t);sumY[ii]+=w*yy;weight[ii]+=w;strong[ii]=np.maximum(strong[ii],w)
ii=weight>0;V[ii,1]=V[ii,1]*(1-strong[ii])+sumY[ii]/weight[ii]*strong[ii];V.tofile(R/'ground.bin');print('Graded existing terrain vertices',int(ii.sum()))
