from pathlib import Path
import json,math,numpy as np,mapbox_earcut as ear
from shapely.geometry import Polygon,box,LineString,Point
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];W=R/'sources/civic42'
I=json.loads((W/'inspection.json').read_text())
models=[];routes=[]
def polys(g):return [g] if g.geom_type=='Polygon' else [q for q in getattr(g,'geoms',[]) if q.geom_type=='Polygon']
def coords(p):return [list(q) for q in list(p.exterior.coords)[:-1]]
class Model:
 def __init__(self,n,id,origin,u,v,base):
  self.n=n;self.b={'id':id};self.origin=origin;self.u=u;self.v=v;self.base=base;self.s=1;self.groups={};self.solids=[];self.floors=[];self.rails=[];self.entries=[]
 def pt(self,x,d,h):return [self.origin[0]+self.s*(x*self.u[0]+d*self.v[0]),self.base+h*self.s,self.origin[1]+self.s*(x*self.u[1]+d*self.v[1])]
 def polyworld(self,p):return [[self.pt(x,d,0)[i] for i in [0,2]] for x,d in coords(p)]
 def face(self,points,mat):
  if len(points)<3:return
  g=self.groups.setdefault(mat,{'positions':[],'indices':[],'uvs':[]});start=len(g['positions'])//3
  ps=[self.pt(*p) for p in points]
  a=np.array(ps[1])-ps[0];b=np.array(ps[2])-ps[0];normal=np.cross(a,b);axis=int(np.argmax(abs(normal)))
  for p,q in zip(points,ps):g['positions']+=q;g['uvs'] += ([q[0],q[2]] if axis==1 else [q[2] if axis==0 else q[0],q[1]])
  for k in range(1,len(ps)-1):g['indices'] += [start,start+k,start+k+1]
 def plane(self,shape,mapper,mat):
  for p in polys(shape):
   if p.area<1e-7:continue
   rings=[list(p.exterior.coords)[:-1]]+[list(i.coords)[:-1] for i in p.interiors];vs=np.array([q for rr in rings for q in rr],dtype=np.float64);ends=np.cumsum([len(rr) for rr in rings],dtype=np.uint32)
   ix=ear.triangulate_float64(vs,ends)
   for k in range(0,len(ix),3):self.face([mapper(*vs[i]) for i in ix[k:k+3]],mat)
 def slab(self,p,lo,hi,mat,solid=False,floor=False):
  if p.is_empty:return
  self.plane(p,lambda x,d:(x,d,hi),mat);self.plane(p,lambda x,d:(x,d,lo),mat)
  for pp in polys(p):
   cs=coords(pp)
   for a,b in zip(cs,cs[1:]+cs[:1]):self.face([[*a,lo],[*b,lo],[*b,hi],[*a,hi]],mat)
   if solid:self.volume(pp,lo,hi)
   if floor:self.floor(pp,hi)
 def volume(self,p,lo,hi):
  if hi<=lo:return
  self.solids.append({'id':f'civic42-{self.n}-solid{len(self.solids)}','building':self.b['id'],'p':self.polyworld(p),'lo':self.base+lo*self.s,'hi':self.base+hi*self.s,'hidden':True,'civic42':True})
 def floor(self,p,h):self.floors.append({'id':f'civic42-{self.n}-floor{len(self.floors)}','building':self.b['id'],'p':self.polyworld(p),'lo':self.base+h*self.s,'civic42':True})
 def cube(self,x,d,h,w,depth,height,mat,solid=False):self.slab(box(x,d,x+w,d+depth),h,h+height,mat,solid)
 def beam(self,a,b,w,mat='steel'):
  a=np.array(a);b=np.array(b);n=b-a;n=n/np.linalg.norm(n);ref=np.array([0,0,1]) if abs(n[2])<.9 else np.array([1,0,0]);r=np.cross(n,ref);r=r/np.linalg.norm(r)*w/2;t=np.cross(n,r);vs=[p+x*r+y*t for p in [a,b] for x,y in [(-1,-1),(1,-1),(1,1),(-1,1)]]
  for ids in [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]:self.face([vs[i] for i in ids],mat)
 def window(self,p,mapper,inward,mat='glass',cols=2,rows=2,frame='frame',spandrel=None,grid=None):
  # Glass sits behind the actual perforated wall. Reveals are real 3D surfaces.
  recess=.55;move=lambda x,z,d:np.array(mapper(x,z))+np.array(inward)*d
  self.plane(p,lambda x,z:move(x,z,recess),mat)
  for pp in polys(p):
   cs=coords(pp)
   for a,b in zip(cs,cs[1:]+cs[:1]):
    self.face([move(*a,0),move(*b,0),move(*b,recess),move(*a,recess)],frame)
    self.beam(move(*a,recess-.12),move(*b,recess-.12),.16,frame)
  x0,z0,x1,z1=grid or p.bounds
  for i in range(1,cols):
   x=x0+(x1-x0)*i/cols;cut=p.intersection(LineString([(x,z0),(x,z1)]))
   if cut.geom_type=='LineString' and not cut.is_empty:self.beam(move(*cut.coords[0],recess-.13),move(*cut.coords[-1],recess-.13),.12,frame)
  for i in range(1,rows):
   z=z0+(z1-z0)*i/rows;cut=p.intersection(LineString([(x0,z),(x1,z)]))
   if cut.geom_type=='LineString' and not cut.is_empty:self.beam(move(*cut.coords[0],recess-.13),move(*cut.coords[-1],recess-.13),.12,frame)
  if spandrel:
   pp=p.intersection(box(x0,spandrel[0],x1,spandrel[1]));self.plane(pp,lambda x,z:move(x,z,recess-.025),'spandrel')
 def rail(self,a,b):
  self.beam([a[0],a[1],a[2]+1.05],[b[0],b[1],b[2]+1.05],.055,'rail')
  N=max(1,math.ceil(math.dist(a,b)/1.6))
  for k in range(N+1):
   q=[a[i]+(b[i]-a[i])*k/N for i in range(3)];self.beam(q,[q[0],q[1],q[2]+1.05],.045,'rail')
  aa=self.pt(*a);bb=self.pt(*b);q=LineString([(a[0],a[1]),(b[0],b[1])]).buffer(.03,cap_style=2);self.solids.append({'id':'civic42-rail-solid'+str(len(self.rails)),'building':self.b['id'],'p':self.polyworld(q),'lo':min(aa[1],bb[1]),'hi':max(aa[1],bb[1])+1.1,'hidden':True,'civic42':True,'rail37':{'a':[aa[0],aa[2]],'b':[bb[0],bb[2]],'y0':aa[1],'y1':bb[1]}});self.rails.append({'id':'civic42-rail'+str(len(self.rails)),'building':self.b['id'],'a':aa,'b':bb,'civic42':True})
 def route(self,name,points):
  q=[self.pt(*p) for p in points];routes.append({'zone':'BUILD42','road':name,'coords':[[p[0],p[2]] for p in q],'startFeet':q[0][1],'endFeet':q[-1][1]})
 def finish(self):
  models.append({'number':self.n,'id':self.b['id'],'fit':{'origin':self.origin,'u':self.u,'v':self.v,'scale':1,'datum':self.base},'groups':self.groups,'volumes':self.solids,'surfaces':self.floors,'rails':self.rails,'entries':self.entries,'top':max(y for g in self.groups.values() for y in g['positions'][1::3])})
# Uniform scale 100m fits the latest 108m culture precinct without moving C0 or S1.
u=[.69703555,-.71703657];v=[.71703657,.69703555];origin=[u[i]*-291.76+v[i]*89.627 for i in range(2)]
m=Model('73','vw/215',origin,u,v,92.95926319928778)
glass=[(4,24,24,22,0,10.5,8,5),(28,28,17,20,0,10.5,5,4),(16,50,35,19,10.5,14,10,4),(90,26,10,30,0,10.5,3,8),(83,56,15,12,10.5,14,4,3),(65,65,15,13,14,18,4,3)]
halls=[(16,53,35,20,14,21.5),(22,72,23,14,0,26.5)]
terraces=[(45,14,53,10,3.5),(45,49,45,7,10.5),(80,49,20,20,10.5),(63,56,19,27,14),(49,75,14,8,14)]
# Closed structural podiums supporting upper pavilions: limited to their own footprints.
for x,d,w,dep,lo,hi,c,r in glass:
 p=box(x,d,x+w,d+dep)
 if lo>0:m.slab(p,-.25,lo-.35,'panel',True)
 m.volume(p,max(0,lo-.35),hi)
 for mapper,inward,length,cols in [(lambda a,h,x=x,d=d:(x+a,d,h),[0,1,0],w,c),(lambda a,h,x=x,d=d,dep=dep:(x+a,d+dep,h),[0,-1,0],w,c),(lambda a,h,x=x,d=d:(x,d+a,h),[1,0,0],dep,r),(lambda a,h,x=x,d=d,w=w:(x+w,d+a,h),[-1,0,0],dep,r)]:
  m.window(box(.15,lo+.28,length-.15,hi-.35),mapper,inward,cols=cols,rows=3 if hi-lo>5 else 1)
  m.plane(box(0,lo,length,lo+.28),mapper,'panel');m.plane(box(0,hi-.35,length,hi),mapper,'panel')
 # roof gardens are not walking floors; deduct higher construction and terraces.
 roof=p.buffer(.8,join_style=2);m.slab(roof,hi,hi+.5,'panel')
 exclusions=unary_union([box(a,b,a+w2,b+d2) for a,b,w2,d2,z0,z1 in halls if z1>hi]+[box(a,b,a+w2,b+d2) for a,b,w2,d2,z0,z1,_,_ in glass if z0>=hi]+[box(a,b,a+w2,b+d2) for a,b,w2,d2,z in terraces if abs(z-hi)<.01])
 green=p.buffer(-1.1).difference(exclusions.buffer(.3));m.slab(green,hi+.5,hi+.66,'green')
for x,d,w,dep,lo,hi in halls:
 c=1.8;p=Polygon([(x+c,d),(x+w-c,d),(x+w,d+c),(x+w,d+dep-c),(x+w-c,d+dep),(x+c,d+dep),(x,d+dep-c),(x,d+c)])
 m.slab(p,lo,hi,'panel',True);m.slab(p.buffer(.45,join_style=2),hi-.35,hi,'eave')
 # The four restrained dark strips sit on the roof, rather than wrap as fictitious floors.
 for k in range(4):
  a=x+1.5+k*(w-3)/4;m.slab(box(a,d+.9,a+(w-3)/4-.35,d+dep-.9).intersection(p),hi,hi+.22,'roof')
# Terrace unions eliminate T1/T1R overlap. Taller pavilions are cut out.
for h in sorted(set(t[4] for t in terraces)):
 p=unary_union([box(x,d,x+w,d+dep) for x,d,w,dep,z in terraces if z==h]);occupied=unary_union([box(x,d,x+w,d+dep) for x,d,w,dep,lo,hi,_,_ in glass if hi>h]+[box(x,d,x+w,d+dep) for x,d,w,dep,lo,hi in halls if hi>h])
 p=p.difference(occupied);m.slab(p,h-.8,h,'stone',True,True)
# Stair shells: visible steps and controller surfaces use exactly the same count/endpoints.
for name,x,d,w,run,lo,hi in [('ST0',45,0,22,14,0,3.5),('ST1',46,24,16,25,3.5,10.5),('ST1R',80,24,10,25,3.5,10.5),('ST2',52,56,11,19,10.5,14)]:
 n=math.ceil((hi-lo)/.16)
 for k in range(n):
  a=d+run*k/n;b=d+run*(k+1)/n;h=lo+(hi-lo)*(k+1)/n;m.slab(box(x,a,x+w,b),-.25,h,'stone')
 s={'id':'civic42-'+name,'building':m.b['id'],'p':m.polyworld(box(x,d,x+w,d+run)),'from':[m.pt(x+w/2,d,0)[i] for i in [0,2]],'to':[m.pt(x+w/2,d+run,0)[i] for i in [0,2]],'lo':m.base+lo,'hi':m.base+hi,'steps':n,'foundation29':m.base-.25,'civic42':True};m.floors.append(s)
 for xx in [x+.12,x+w-.12]:m.rail([xx,d,lo],[xx,d+run,hi])
 m.route(name,[(x+w/2,d-1,lo),(x+w/2,d+run+1,hi)])
# B0 is a recessed foyer: a short visual depth with a closed back, never a through tunnel.
m.slab(box(62,24,80,27.5),3.0,3.5,'stone',True,True)
m.cube(62,27.5,3.5,18,.45,6,'dark',True);m.cube(62,24,3.5,.4,3.5,6,'panel',True);m.cube(79.6,24,3.5,.4,3.5,6,'panel',True)
m.slab(box(62,24,80,27.5),9.5,10.5,'panel')
m.window(box(64,3.6,78,8.7),lambda x,h:(x,26.7,h),[0,1,0],cols=7,rows=1)
# Guard only exposed terrace edges; openings remain full width at stair arrivals.
for a,b in [([45,14,3.5],[45,24,3.5]),([67,14,3.5],[98,14,3.5]),([98,14,3.5],[98,24,3.5]),([45,49,10.5],[45,56,10.5]),([45,56,10.5],[52,56,10.5]),([63,56,10.5],[80,56,10.5]),([100,56,10.5],[100,69,10.5]),([98,69,10.5],[82,69,10.5]),([49,75,14],[49,83,14]),([49,83,14],[82,83,14]),([82,69,14],[82,83,14])]:m.rail(a,b)
# Narrow planted edge to the broad T0 landing: leaves movement and B0 approach clear.
for x,d,w,dep,h in [(91,18,5,3,3.5),(64,79,15,2.2,14),(84,52,12,2,10.5)]:
 m.slab(box(x,d,x+w,d+dep),h,h+.32,'panel',True);m.slab(box(x+.2,d+.2,x+w-.2,d+dep-.2),h+.32,h+.42,'green')
 for xx in np.arange(x+.6,x+w-.3,1.4):m.cube(xx,d+.5,h+.42,.85,.85,.35,'leaf')
m.route('culture terrace chain',[(54,15.5,3.5),(54,23,3.5),(54,50,10.5),(57,55,10.5),(57,76,14),(61,77,14),(63.8,77,14)])
# Preserve the existing C0 arrival floor; its ground geometry and datum are unchanged.
m.floor(box(44.99,-12,66.99,0),0)
m.finish()
# Admin uses its own dimensioned local frame; doors retain the latest renderer's exact local positions.
b=next(b for b in I['buildings'] if b['id']=='167609409');u=[.720564651526888,.6933877580185093];v=[.6940501119826337,-.7199266921408691];m=Model('60',b['id'],[-102.821,88.481],u,v,88.65926319928778);ww=86.21294406874178;dep=ww*.2537097;roof=18.9
p=Polygon([((q[0]-m.origin[0])*u[0]+(q[1]-m.origin[1])*u[1],(q[0]-m.origin[0])*v[0]+(q[1]-m.origin[1])*v[1]) for q in b['p']]);m.volume(p,-.6,roof)
# Front and ends: perforated wall with inset glazing and projecting frame, three rows.
for side,L,mapper,inside in [('front',ww,lambda a,h:(a,0,h),[0,1,0]),('left',dep,lambda a,h:(0,a,h),[1,0,0]),('right',dep,lambda a,h:(ww,a,h),[-1,0,0]),('rear',ww,lambda a,h:(a,dep,h),[0,-1,0])]:
 windows=[];N=36 if side=='front' else 4 if side!='rear' else 28
 for row in range(4 if side=='rear' else 3):
  z=(4.5+row*3.5+.8) if side=='rear' else ww*(.086+.044*row);hh=1.85 if side=='rear' else ww*.028
  for col in range(N):
   pitch=(L-2)/N;x=1+pitch*col+pitch*.12;w=pitch*.76;pw=box(x,z,x+w,z+hh);windows.append(pw);m.window(pw,mapper,inside,cols=2,rows=1)
 m.plane(box(0,6.46 if side!='rear' else 4.5,L,18.5).difference(unary_union(windows)),mapper,'panel')
 if side!='rear':
  for j in range(N+1):
   a=1+(L-2)*j/N;pt=np.array(mapper(a,6.46))-np.array(inside)*.3;m.beam(pt,[pt[0],pt[1],18.5],.26,'eave')
  for z in [6.46,10.52,14.31,18.1]:
   a=np.array(mapper(0,z))-np.array(inside)*.28;b1=np.array(mapper(L,z))-np.array(inside)*.28;m.beam(a,b1,.4,'eave')
 # Lower bays vary; no invented open pilotis. Recessed glass has solid geometry behind.
 for j in range(13 if side in ['front','rear'] else 4):
  count=13 if side in ['front','rear'] else 4;a=L*j/count;b1=L*(j+1)/count;mid=(a+b1)/2
  if side=='front' and j<4:
   m.plane(box(a,0,b1,6.46),mapper,'dark');m.window(box(a+.4,4.9,b1-.4,5.8),mapper,inside,cols=2,rows=1)
  else:m.window(box(a+.3,.2,b1-.3,6.1 if side!='rear' else 4.3),mapper,inside,cols=2,rows=2)
  pt=mapper(a,0);m.beam(pt,[pt[0],pt[1],6.46],.65,'dark')
m.slab(p,18.5,18.9,'roof');m.slab(p.buffer(.16),18.35,18.5,'eave')
# Reconstruct the two existing recessed door/canopy locations, no duplication.
center=np.mean(np.array(b['p']),axis=0);ou=np.array([.721,.693]);ov=np.array([-.693,.721]);local=np.array(b['p'])-center;front=max(local@ov);back=min(local@ov)
for d,h,sign in [(front,4.3,1),(back,0,-1)]:
 def old(a,dd,hh):
  world=center+ou*a+ov*dd;delta=world-np.array(m.origin);return [float(delta@np.array(m.u)),float(delta@np.array(m.v)),hh]
 m.face([old(-5,d+sign*.1,h+.1),old(5,d+sign*.1,h+.1),old(5,d+sign*.1,h+3.2),old(-5,d+sign*.1,h+3.2)],'door')
 for a in [-5,0,5]:m.beam(old(a,d+sign*.2,h+.1),old(a,d+sign*.2,h+3.2),.1,'frame')
 for z in [h+.1,h+3.2]:m.beam(old(-5,d+sign*.2,z),old(5,d+sign*.2,z),.12,'frame')
 for a in [-5.9,5.9]:m.beam(old(a,d+sign*1.7,h+3.3),old(a,d-sign*.7,h+3.3),.25,'eave')
 m.face([old(-6,d-sign*.7,h+3.3),old(6,d-sign*.7,h+3.3),old(6,d+sign*1.7,h+3.3),old(-6,d+sign*1.7,h+3.3)],'eave')
 m.entries.append({'world':m.pt(*old(0,d,h)),'sill':m.base+h})
m.finish()
# S1 furnishings follow sampled existing edge heights; no path slab or altered road.
edge=json.loads((W/'side42-edge.json').read_text());m=Model('S1','civic42-side',[0,0],[1,0],[0,1],0)
for i in range(3,len(edge)-3):
 a=edge[i];b=edge[i+1];m.rail(a,b)
 # Low planted pockets are outside the retained 3.2m walking corridor.
 if i%4==0:
  dx=b[0]-a[0];dz=b[1]-a[1];ll=math.hypot(dx,dz);x=a[0]+dz/ll*.65;d=a[1]-dx/ll*.65;h=a[2]
  m.cube(x-.45,d-.45,h,.9,.9,.22,'green')
  for off in [-.22,.22]:m.cube(x+off-.18,d-.23,h+.22,.36,.46,.28,'leaf')
m.finish()
# Close existing terrain height discontinuities with vertical faces only.
m=Model('grade','civic42-grade',[0,0],[1,0],[0,1],0)
for face in json.loads((W/'grade42-faces.json').read_text()):m.face(face,'stone')
m.finish()
(R/'dist/data/civic42.json').write_text(json.dumps({'revision':'civic42-r1','models':models,'routes':routes},separators=(',',':')))
print([(m['number'],sum(len(g['indices'])//3 for g in m['groups'].values()),len(m['surfaces'])) for m in models])
