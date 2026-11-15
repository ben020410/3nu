"""Coherent height-only regrading. Preserve XY, large hills and architectural floors.
All adjusted elevations are design estimates, not survey measurements.
"""
from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,LineString
from scipy.ndimage import gaussian_filter,gaussian_filter1d,map_coordinates
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());D=json.loads((R/'dist/data/campus.json').read_text())
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];dx=(x1-x0)/(n-1);dz=(z1-z0)/(n-1);X,Z=np.meshgrid(np.linspace(x0,x1,n),np.linspace(z0,z1,n));H=np.array(N['terrain']['values']).reshape(n,n);original=H.copy();P=S.points(X.ravel(),Z.ravel());smooth=lambda t:np.clip(t,0,1)**2*(3-2*np.clip(t,0,1))
def sample(p,field=H):return map_coordinates(field,[(np.array(p)[:,1]-z0)/dz,(np.array(p)[:,0]-x0)/dx],order=1,mode='nearest')
# A broad, low-amplitude regularization removes grid kinks, not the campus hillside.
soft=gaussian_filter(H,1.15);sumw=np.full(H.shape,.15);sumh=soft*.15
protected={'60','62','62-1','63','20'};building_records=[]
for b in D['buildings']:
 g=S.make_valid(Polygon(b['p']));bounds=g.bounds
 if bounds[0]<x0 or bounds[2]>x1 or bounds[1]<z0 or bounds[3]>z1:
  building_records.append({'id':b['id'],'state':'outside terrain coverage; retained, not falsely flattened'});continue
 if b.get('officialNumber') in protected or b.get('kind')=='bridge' or '연결교' in b.get('name',''):continue
 boundary=g.exterior if g.geom_type=='Polygon' else g.boundary
 pts=[list(boundary.interpolate(t).coords)[0] for t in np.linspace(0,boundary.length,max(8,int(boundary.length/2)))];ys=sample(pts)
 # Lowest edge preserves exposed lower floors; ordinary already-flat pads stay at their existing level.
 target=float(np.min(ys));dist=S.distance(P,g).reshape(n,n);w=(1-smooth((dist-4)/12))*30
 sumw+=w;sumh+=w*target
 building_records.append({'id':b['id'],'level':target,'previousEdgeRange':float(np.ptp(ys)),'state':'whole footprint and 4m apron constraint'})
# Independent architectural datums are locked, including lower passage and upper pharmacy.
lock=np.zeros(H.shape,dtype=bool);lockh=H.copy()
for q in N.get('designGround23',[]):
 g=Polygon(q['outer'],q.get('holes',[]));m=S.covers(g,P).reshape(n,n);lock|=m;lockh[m]=q['groundY']
# Preserve intentional central architecture grading; only unsupported gaps are relaxed.
for b in D['buildings']:
 if b.get('officialNumber') in protected:
  g=Polygon(b['p']).buffer(2);m=S.covers(g,P).reshape(n,n);lock|=m;lockh[m]=H[m]
road_records=[]
for r in N['roads']:
 if r.get('kind')=='steps' or r.get('highway')=='steps':continue
 line=LineString(r['p']);length=line.length
 if length<2:continue
 count=max(3,int(length/2)+1);ts=np.linspace(0,length,count);pts=np.array([list(line.interpolate(t).coords)[0] for t in ts]);ys=sample(pts);target=gaussian_filter1d(ys,max(.5,12/(length/(count-1))),mode='nearest')
 # Long grade transitions, bounded in both directions; never increase walking slope tolerance.
 limit=.10*length/(count-1)
 for _ in range(3):
  for j in range(1,count):target[j]=np.clip(target[j],target[j-1]-limit,target[j-1]+limit)
  for j in range(count-2,-1,-1):target[j]=np.clip(target[j],target[j+1]-limit,target[j+1]+limit)
 dist=S.distance(P,line).reshape(n,n);m=dist<float(r.get('width',3))/2+14
 if not m.any():continue
 close=S.line_locate_point(line,P[m.ravel()]);profile=np.interp(close,ts,target);w=(1-smooth((dist[m]-float(r.get('width',3))/2)/14))*4
 sumw[m]+=w;sumh[m]+=w*profile
 road_records.append({'id':r['id'],'length':round(length,2),'profileMaxGrade':float(np.max(np.abs(np.diff(target)))/(length/(count-1)))})
T=sumh/sumw
# Screened diffusion joins apron/road constraints rather than stacking local height offsets.
for _ in range(45):
 avg=(np.roll(T,1,0)+np.roll(T,-1,0)+np.roll(T,1,1)+np.roll(T,-1,1))/4
 T=(sumh+avg*2)/(sumw+2);T[lock]=lockh[lock];T[[0,-1],:]=H[[0,-1],:];T[:,[0,-1]]=H[:,[0,-1]]
N['terrain']['values']=T.ravel().tolist()
# Navigation node elevations are derived from the same field, not the obsolete DEM.
for p in N['points']:p[2]=float(sample([p[:2]],T)[0])
N['grading25']={'method':'screened height field: whole building aprons + 10% longitudinal road profiles + protected architectural datums','estimate':True,'buildingConstraints':len(building_records),'roadProfiles':len(road_records),'largestHeightChange':float(np.max(np.abs(T-H))),'rmsHeightChange':float(np.sqrt(np.mean((T-H)**2))),'preserves':'XY geometry; road widths; multi-level library/lawn/student floors'}
(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(R/'BUILD25-GRADING.json').write_text(json.dumps({'summary':N['grading25'],'buildings':building_records,'roads':road_records},ensure_ascii=False,indent=2));print(N['grading25'])
