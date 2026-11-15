"""Ordered, metre-based ring alignment. Immutable BUILD32 input; no building edits.
Road widening is an explicit design adaptation, not a survey of lane counts.
"""
import json,pathlib,math,hashlib,collections
import numpy as np
import shapely as S
from shapely.geometry import Polygon,LineString,Point
from shapely.strtree import STRtree
R=pathlib.Path(__file__).resolve().parents[1];O=R/'reports/build33';O.mkdir(exist_ok=True)
N=json.loads((O/'source-data/walk.json').read_text());D=json.loads((O/'source-data/campus.json').read_text())
ref=json.loads((O/'source-data/ring-road-ids.json').read_text())
ids={q['id']for q in ref};roads={r['id']:r for r in N['roads']};old=[];ends=[]
for q in ref:
 r=roads[q['id']];p=r['p'];start=min(range(len(p)),key=lambda i:math.dist(p[i],q['start']));end=min(range(len(p)),key=lambda i:math.dist(p[i],q['end']))
 p=p[start:end+1] if start<end else p[end:start+1][::-1]
 if old and math.dist(old[-1],p[0])>.02:raise ValueError(('disconnected',q['id']))
 ends.append(len(old)-1 if old else 0);old+=p[1:]if old else p
raw=LineString(old);length=raw.length;count=math.ceil(length/2);ds=length/count
base=np.array([raw.interpolate(i*ds).coords[0]for i in range(count)])
def smooth(a,sigma=3):
 rad=math.ceil(sigma*3);w=np.exp(-.5*(np.arange(-rad,rad+1)/sigma)**2);w/=sum(w)
 return sum(np.roll(a,k,axis=0)*v for k,v in zip(range(-rad,rad+1),w))
xy=smooth(base,8)
# Broaden the sharp gate/ring turn for future bus swept clearance.
wide=smooth(xy,9);gate_weight=np.exp(-.5*(np.minimum(np.arange(count),count-np.arange(count))/32)**2)
xy=xy*(1-gate_weight[:,None])+wide*gate_weight[:,None]
polys=[];names=[]
for b in D['buildings']:
 if b['id']in N['landmarks30']['buildings']:continue
 polys.append(S.make_valid(Polygon(b['p'],b.get('holes',[]))));names.append({'id':b['id'],'name':b.get('name','')})
for q in N['landmarks30']['volumes']:
 if q['lo']<=N['landmarks30']['buildings'].get(q.get('building'),{}).get('base',-1)+1.8:
  polys.append(S.make_valid(Polygon(q['p'])));names.append({'id':q['id'],'name':'ground-level landmark solid'})
# Preserve existing ground-access stairs as well as buildings.
for q in N.get('landmarkCuts30',[]):
 polys.append(Polygon(q['outer'],q.get('holes',[])));names.append({'id':'access-stair','name':str(q['outer'][0])})
tree=STRtree(polys);pushlog=[]
# A smooth displacement field, rather than clipping the 15m road around walls.
for iteration in range(30):
 violations=[]
 for i,p in enumerate(xy):
  for j in tree.query(Point(p).buffer(9),predicate='intersects'):
   g=polys[j];distance=g.distance(Point(p))
   if distance<8.15:violations.append((i,int(j),distance))
 if not violations:break
 delta=np.zeros_like(xy);weight=np.zeros(count)
 for i,j,d in violations:
  nearest=np.array(S.get_coordinates(S.shortest_line(polys[j],Point(xy[i])))[0]);away=xy[i]-nearest
  if np.linalg.norm(away)<.001:away=xy[i]-np.array(polys[j].centroid.coords[0])
  away/=np.linalg.norm(away);shift=away*(8.4-d)
  for k in range(-26,27):
   w=math.exp(-.5*(k/11)**2);at=(i+k)%count;delta[at]+=shift*w;weight[at]+=w
  if iteration==0:pushlog.append({**names[j],'chainage':i*ds,'originalClearance':d})
 mask=weight>0;delta[mask]/=np.maximum(1,weight[mask,None]);xy+=delta
 # One small smoothing pass prevents a local avoidance bulge creating a sharp bend.
 xy=smooth(xy,.8)
ring=LineString(np.vstack([xy,xy[0]]));newlen=ring.length
# Stable chainage starts at the previously reviewed gate/ring junction.
samples=np.array([ring.interpolate(i*newlen/count).coords[0]for i in range(count+1)])
ring=LineString(samples);s=np.linspace(0,ring.length,count+1)
anchors=[ring.project(Point(q['start']))for q in ref]+[ring.length]
anchors[0]=0
for i,q in enumerate(ref):
 start,end=anchors[i:i+2];part=[ring.interpolate(start).coords[0]]+[p.tolist()for p,ss in zip(samples,s)if start<ss<end]+[ring.interpolate(end).coords[0]]
 roads[q['id']].update(p=part,width=15,widthProfile32=[[0,15],[end-start,15]],ring33=True,ringOrder33=i,chainage33=[start,end],widthSource='BUILD33 user-directed 15m / 4 lanes; not measured road width')
# The historic first ID also contains the gate approach, retained as the same ID.
entry=roads[ref[0]['id']]
sourceRoads=json.loads((O/'source-data/walk.json').read_text())['roads'];oldfirst=next(r for r in sourceRoads if r['id']==entry['id'])
join=min(range(len(oldfirst['p'])),key=lambda i:math.dist(oldfirst['p'][i],ref[0]['start']));approach=oldfirst['p'][:join]+[samples[0].tolist()]
al=LineString(approach);ap=np.array([al.interpolate(al.length*i/math.ceil(al.length/2)).coords[0]for i in range(math.ceil(al.length/2)+1)])
for iteration in range(25):
 corrections=[]
 for i,p in enumerate(ap[1:-1],1):
  for j in tree.query(Point(p).buffer(8.4),predicate='intersects'):
   d=polys[j].distance(Point(p))
   if d>=8.2:continue
   near=np.array(S.get_coordinates(S.shortest_line(polys[j],Point(p)))[0]);away=p-near;away/=np.linalg.norm(away) or 1
   corrections.append((i,away*(8.4-d)))
 if not corrections:break
 delta=np.zeros_like(ap);weights=np.zeros(len(ap))
 for i,v in corrections:
  for j in range(1,len(ap)-1):
   w=math.exp(-.5*((j-i)/10)**2)*min(1,j/8,(len(ap)-1-j)/8);delta[j]+=v*w;weights[j]+=w
 ap+=delta/np.maximum(1,weights[:,None])
approach=ap.tolist()
entry['p']=approach[:-1]+entry['p'];entry['widthProfile32']=[[0,15],[LineString(entry['p']).length,15]]
N['ring33']={'version':1,'units':'metres','carriageway':15,'laneWidth':3.3,'edgeMargin':.9,'laneOffsets':[-4.95,-1.65,1.65,4.95],
 'centerMark':{'double':True,'offset':.16,'width':.11,'color':'#d4af66'},'laneMark':{'width':.12,'dash':3,'gap':4,'color':'#f2f0e5'},'edgeMark':{'offset':7.12,'width':.12},
 'route':samples.tolist(),'approach':approach,'orderedIds':[q['id']for q in ref],'length':ring.length,'authoring':'User-requested four-lane adaptation; existing ring alignment, local collision avoidance'}
# Reattach actual branch intersections/endpoints to the moved ring. Keep branch widths.
attachments=[]
for r in N['roads']:
 if r['id']in ids:continue
 pp=r['p'];changed=False
 for i,p in enumerate(pp):
  if raw.distance(Point(p))<.12:
   a=ring.interpolate(ring.project(Point(p)));v=list(a.coords[0]);dist=math.dist(p,v)
   if dist>.01:
    attachments.append({'road':r['id'],'before':p,'after':v,'distance':dist});pp[i]=v;changed=True
 r['p']=pp
N['ring33']['attachments']=attachments
# Actual multi-road junctions, not the arbitrary split points between source IDs.
junction=[]
for r in N['roads']:
 if r['id']in ids or r['category']!='road':continue
 line=LineString(r['p']);hit=line.intersection(ring)
 candidates=list(S.get_coordinates(hit))+[a['after'] for a in attachments if a['road']==r['id']]
 for p in candidates:
  c=ring.project(Point(p))
  if not any(min(abs(c-j['s']),ring.length-abs(c-j['s']))<9 for j in junction):junction.append({'s':c,'point':list(p),'branchIds':[r['id']],'halfGap':max(8,r['width']/2+4)})
  else:
   j=min(junction,key=lambda j:min(abs(c-j['s']),ring.length-abs(c-j['s'])));j['branchIds']=sorted(set(j['branchIds']+[r['id']]));j['halfGap']=max(j['halfGap'],r['width']/2+4)
junction.append({'s':0,'point':samples[0].tolist(),'branchIds':['gate-approach'],'halfGap':13})
N['ring33']['junctions']=sorted(junction,key=lambda j:j['s'])
roadshape=S.union_all([ring.buffer(7.5,quad_segs=8),LineString(approach).buffer(7.5,quad_segs=8)])
clashes=[{**name,'area':roadshape.intersection(p).area}for name,p in zip(names,polys)if roadshape.intersection(p).area>.001]
previous={r['id']:r for r in sourceRoads}
mapping=[{'oldId':q['id'],'currentId':q['id'],'order':i,'beforeWidth':previous[q['id']]['width'],'beforeWidthProfile':previous[q['id']].get('widthProfile32',[]),'afterWidth':15,'chainage':anchors[i:i+2],'previousStart':q['start'],'newStart':list(ring.interpolate(anchors[i]).coords[0])}for i,q in enumerate(ref)]
out={'mapping':mapping,'length':ring.length,'maxCenterDisplacement':float(max(raw.distance(Point(p))for p in samples)), 'buildingClashes':clashes,'avoidance':pushlog,'junctions':junction,'branchAttachments':attachments}
(O/'alignment.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));(O/'prepared-walk.json').write_text(json.dumps(N,separators=(',',':'),ensure_ascii=False))
(O/'height-query.json').write_text(json.dumps({'ring':samples.tolist(),'approach':approach}))
print('Ring length',ring.length,'clashes',clashes,'max shift',out['maxCenterDisplacement'],'branches',len(attachments),'junctions',len(junction))
