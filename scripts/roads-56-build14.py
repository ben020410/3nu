# coding: utf-8
import json,copy,math
from pathlib import Path
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
p=Path('dist/data/walk.json');w=json.loads(p.read_text());cpath=Path('dist/data/campus.json');c=json.loads(cpath.read_text());b=next(b for b in c['buildings'] if b['id']=='official-56-1');foot=Polygon(b['p']);r=next(r for r in w['roads'] if r['id']=='37929023');old=copy.deepcopy(r['p']);new=copy.deepcopy(old);new[2]=[-6.791,-103.205];new[3]=[-12.744,-117.491];r['p']=new;r['geometrySource14']='Naver 56-1 satellite: route around east facade; old source line predates current footprint'
changed=[]
for i,q in enumerate(w['points']):
 for j in range(1,len(old)):
  a,d=old[j-1],old[j];dx=d[0]-a[0];dz=d[1]-a[1];t=((q[0]-a[0])*dx+(q[1]-a[1])*dz)/(dx*dx+dz*dz)
  if -.0001<=t<=1.0001 and math.hypot(q[0]-a[0]-t*dx,q[1]-a[1]-t*dz)<.06:
   w['points'][i]=[new[j-1][k]*(1-t)+new[j][k]*t for k in range(2)]+q[2:];changed.append(i);break
ids={'248013966','248013971','248013972','251713862','167597853'};oldRoads=[{'p':old,'width':5}]+[r for r in w['roads'] if r['id'] in ids];area=unary_union([LineString(r['p']).buffer(r['width']/2+1) for r in oldRoads]+[LineString(new).buffer(4)])
outroads=[];actions=[]
for r in w['roads']:
 if r['id']=='167597853':r['p']=[[.963,-120.637],[-9.331,-116.752],new[3]]
 if r['id'] not in ids:outroads.append(r);continue
 line=LineString(r['p']);kept=line.difference(foot.buffer(.6));parts=[kept] if kept.geom_type=='LineString' else [a for a in getattr(kept,'geoms',[]) if a.geom_type=='LineString'];parts=[a for a in parts if a.length>1]
 actions.append({'id':r['id'],'beforeLength':line.length,'afterLength':sum(x.length for x in parts),'reason':'Remove only portions occupied by the current 56-1 building; retain external approaches'})
 for i,line in enumerate(parts):q=copy.deepcopy(r);q['p']=list(line.coords);q['id']=r['id']+(('-part'+str(i)) if i else '');outroads.append(q)
w['roads']=outroads
beforeEdges=len(w['edges']);w['edges']=[e for e in w['edges'] if not LineString([w['points'][e[0]][:2],w['points'][e[1]][:2]]).intersects(foot.buffer(.45))]
# Repartition affected ground, with all retained approaches unioned rather than stacked.
patches={}
for r in w['roads']:
 shape=LineString(r['p']).buffer(r['width']/2,quad_segs=6).intersection(area).difference(foot)
 if shape.is_empty:continue
 kind='steps' if r['kind']=='steps' else ('road' if r['kind'] in ['living_street','service','residential','unclassified','tertiary','secondary','primary'] else 'path');patches.setdefault(kind,[]).append(shape)
out=[]
def emit(q,k):
 if q.is_empty:return
 if q.geom_type=='Polygon':out.append({'kind':k,'outer':list(q.exterior.coords)[:-1],'holes':[list(x.coords)[:-1] for x in q.interiors]})
 elif hasattr(q,'geoms'):
  for x in q.geoms:emit(x,k)
for s in w['surfaces']:emit(Polygon(s['outer'],s.get('holes',[])).difference(area),s['kind'])
used=Polygon()
for k in ['road','steps','path']:
 shape=unary_union(patches.get(k,[])).difference(used);emit(shape,k);used=unary_union([used,shape])
emit(area.difference(used),'grass');w['surfaces']=out
for r in c['roads']:
 if str(r['id'])=='37929023':r['p']=new
p.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')));cpath.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
Path('BUILD14-56-roads.json').write_text(json.dumps({'reference':'build14-reference-56.png','movedGraphPoints':len(changed),'removedIntersectingEdges':beforeEdges-len(w['edges']),'roads':actions,'newRoad':new,'measured':False},ensure_ascii=False,indent=2))
