"""Reproject unchanged XY partitions to the latest shared height field.
Useful after height-only grading iterations; no new overlapping road layer.
"""
import json,pathlib,numpy as np
R=pathlib.Path(__file__).resolve().parents[1]/'dist/data'
nav=json.loads((R/'walk.json').read_text());meta=json.loads((R/'ground.json').read_text())
v=np.fromfile(R/'ground.bin',dtype='<f4').reshape(-1,3);n=nav['terrain']['n'];H=np.array(nav['terrain']['values']);x0,z0,x1,z1=nav['bounds']
u=np.clip((v[:,0].astype(float)-x0)/(x1-x0)*(n-1),0,n-1.000001);w=np.clip((v[:,2].astype(float)-z0)/(z1-z0)*(n-1),0,n-1.000001)
i=u.astype(int);j=w.astype(int);a=u-i;b=w-j;q=j*n+i
v[:,1]=np.where(a+b<=1,H[q]+a*(H[q+1]-H[q])+b*(H[q+n]-H[q]),H[q+n+1]+(1-a)*(H[q+n]-H[q+n+1])+(1-b)*(H[q+1]-H[q+n+1]))
v.tofile(R/'ground.bin');print('reprojected vertices',len(v))
