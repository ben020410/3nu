from pathlib import Path
import json,math,numpy as np,mapbox_earcut as ear
from shapely.geometry import Polygon,box,LineString,Point
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];W=R/'sources/landmark44'

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
  self.solids.append({'id':f'landmark44-{self.n}-solid{len(self.solids)}','building':self.b['id'],'p':self.polyworld(p),'lo':self.base+lo*self.s,'hi':self.base+hi*self.s,'hidden':True,'landmark44':True})
 def floor(self,p,h):self.floors.append({'id':f'landmark44-{self.n}-floor{len(self.floors)}','building':self.b['id'],'p':self.polyworld(p),'lo':self.base+h*self.s,'landmark44':True})
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
  aa=self.pt(*a);bb=self.pt(*b);q=LineString([(a[0],a[1]),(b[0],b[1])]).buffer(.03,cap_style=2);self.solids.append({'id':'landmark44-rail-solid'+str(len(self.rails)),'building':self.b['id'],'p':self.polyworld(q),'lo':min(aa[1],bb[1]),'hi':max(aa[1],bb[1])+1.1,'hidden':True,'landmark44':True,'rail37':{'a':[aa[0],aa[2]],'b':[bb[0],bb[2]],'y0':aa[1],'y1':bb[1]}});self.rails.append({'id':'landmark44-rail'+str(len(self.rails)),'building':self.b['id'],'a':aa,'b':bb,'landmark44':True})
 def route(self,name,points):
  q=[self.pt(*p) for p in points];routes.append({'zone':'BUILD44','road':name,'coords':[[p[0],p[2]] for p in q],'startFeet':q[0][1],'endFeet':q[-1][1]})
 def finish(self):
  models.append({'number':self.n,'id':self.b['id'],'fit':{'origin':self.origin,'u':self.u,'v':self.v,'scale':1,'datum':self.base},'groups':self.groups,'volumes':self.solids,'surfaces':self.floors,'rails':self.rails,'entries':self.entries,'top':max(y for g in self.groups.values() for y in g['positions'][1::3])})
# BUILD44: authored geometry from approved evidence; all coordinates refer to latest BUILD43.
def read(n,f='layout-ratios.json'):return json.loads((W/n/f).read_text())
M=read('museum151','geometry-layout.json');J=read('jahayeon');S=read('stadium');G=read('gate-plaza');B=88.65926319928778
c=M['coordinate_system'];ww,ll,hh=[c['dimensions_scene'][k] for k in ['W','L','H']];m=Model('151','252233408',c['origin_world_xz'],c['basis_x_world_xz'],c['basis_z_world_xz'],B)
cv=lambda q:[q[0]*ww,q[2]*ll,q[1]*hh];outer=list(map(cv,M['geometry']['C_soffit']['outer_loop_xyzN']));inner=list(map(cv,M['geometry']['C_soffit']['inner_loop_xyzN']));tops=list(map(cv,M['geometry']['A_shell']['top_vertices_xyzN']));ceilings=[]
for i in range(4):
 j=(i+1)%4
 for tri in [[outer[i],outer[j],inner[j]],[outer[i],inner[j],inner[i]]]:
  m.face(tri,'soffit');ceilings.append([m.pt(*p) for p in tri])
 m.beam(outer[i],outer[j],.18,'edge');m.beam(tops[i],tops[j],.22,'edge')
 # U-glass optical depth: subdued inner backing, steel in cavity, thin textured outer skin.
 inward=[-sum([outer[i][0],outer[j][0]])/2,-sum([outer[i][1],outer[j][1]])/2,0];inward=np.array(inward);inward=inward/np.linalg.norm(inward)
 panel=[outer[i],outer[j],tops[j],tops[i]];m.face([np.array(p)+inward*.7 for p in panel],'uglassBack');m.face(panel,'uglassFront' if i==0 else 'uglassSide');m.groups['uglassFront' if i==0 else 'uglassSide']['uvs'][-8:]=[0,outer[i][2],math.dist(outer[i][:2],outer[j][:2]),outer[j][2],math.dist(outer[i][:2],outer[j][:2]),hh,0,hh]
for key,mapper,offset in [('front',lambda u,v:[(u-.5)*ww,-ll/2+.25,v*hh],0),('gate_side',lambda u,v:[-ww/2+.25,(.5-u)*ll,v*hh],1)]:
 f=M['facades'][key];poly=Polygon(f['panel_uv']).buffer(-.008)
 for path in [f['upper_truss_uv'],f['lower_truss_uv']]+[[[0,h],[1,h]]for h in f['rails_y']]:
  for a,b in zip(path,path[1:]):
   cut=poly.intersection(LineString([a,b]));
   if cut.geom_type=='LineString' and not cut.is_empty:m.beam(mapper(*cut.coords[0]),mapper(*cut.coords[-1]),.23 if not offset else .17,'steelFront' if not offset else 'steelSide')
 for pp in f['windows_uv']:m.plane(Polygon(pp).intersection(poly),lambda u,v:mapper(u,v),'glass')
m.slab(box(-ww/2,-ll/2,ww/2,ll/2),hh,hh+.18,'edge')
core=box(-.22*ww,-.12*ll,.22*ww,.12*ll);doorx=[.07*ww,.2*ww];front=-.12*ll
# Recessed front doorway, closed at its inner glass plane; no fictitious traversable interior.
m.slab(core,0,.23*hh,'concrete');m.volume(box(-.22*ww,front+.62,.22*ww,.12*ll),-.1,.23*hh)
m.volume(box(-.22*ww,front,doorx[0],front+.62),-.1,.23*hh);m.volume(box(doorx[1],front,.22*ww,front+.62),-.1,.23*hh)
# Remove the original core front face and replace it with an actual aperture.
m.groups.pop('concrete');
for a,b in zip(coords(core),coords(core)[1:]+coords(core)[:1]):
 if abs(a[1]-front)<.001 and abs(b[1]-front)<.001:continue
 m.face([[*a,0],[*b,0],[*b,.23*hh],[*a,.23*hh]],'concrete')
m.plane(box(-.22*ww,0,.22*ww,.23*hh).difference(box(doorx[0],0,doorx[1],.17*hh)),lambda x,h:(x,front,h),'concrete');m.window(box(doorx[0],0,doorx[1],.17*hh),lambda x,h:(x,front,h),[0,1,0],cols=3,rows=1)
m.route('museum recessed entrance',[(3.25,-34,0),(3.25,front-.7,0),(3.25,front+.1,0)])
for x in [-8,8]:m.route('museum core side '+str(x),[(x,-34,0),(x,25,0)])
m.route('museum front undercroft',[(-14,-18,0),(14,-18,0)])
m.finish()
# 149: independently scaled to the retained footprint. Front stairs lengthened locally for even risers.
f=S['frame'];gs=S['grandstand'];ww=gs['W_scene'];o=[f['origin_world_xz'][i]+f['u_world_xz'][i]*gs['front_origin_uv'][0]+f['v_world_xz'][i]*gs['front_origin_uv'][1]for i in range(2)];m=Model('149','1469808348',o,f['u_world_xz'],f['v_world_xz'],B);h=.1*ww;d=.25487973684344767*ww
body=box(0,.055*ww,ww,d);m.volume(body,-.2,h);m.plane(body,lambda x,z:(x,z,h),'warm')
for a,b in zip(coords(body),coords(body)[1:]+coords(body)[:1]):
 if abs(a[1]-.055*ww)<.001 and abs(b[1]-.055*ww)<.001:continue
 m.face([[*a,-.2],[*b,-.2],[*b,h],[*a,h]],'warm')
openings=[box((x-.013)*ww,0,(x+.013)*ww,.07*ww)for x in [.055,.945]]+[box((x-.007)*ww,.015*ww,(x+.007)*ww,.08*ww)for x in [.46,.54]]+[box(a*ww,.06*ww,b*ww,.085*ww)for a,b in gs['front_openings']['dark_recesses_x']]
m.plane(box(0,-.2,ww,h).difference(unary_union(openings)),lambda x,y:(x,.055*ww,y),'warm')
# Inset strips and separate side doors on enclosed floor.
for x in [.055,.945]:m.window(box((x-.013)*ww,0,(x+.013)*ww,.07*ww),lambda x,y:(x,.055*ww-.05,y),[0,1,0],cols=1,rows=1)
for x in [.46,.54]:m.window(box((x-.007)*ww,.015*ww,(x+.007)*ww,.08*ww),lambda x,y:(x,.055*ww-.05,y),[0,1,0],cols=2,rows=8,mat='glassBlock')
for a,b in gs['front_openings']['dark_recesses_x']:m.window(box(a*ww,.06*ww,b*ww,.085*ww),lambda x,y:(x,.055*ww-.05,y),[0,1,0],cols=8,rows=1)
concourse=unary_union([box(0,.055*ww,ww,.075*ww),box(.29*ww,0,.71*ww,.075*ww)])
m.slab(concourse,h-.28,h,'stone',False,True)
for a,b in gs['banks_x']:
 for j in range(6):
  y=h+(j+1)*.06*ww/6;dd=(.075+j*.16/6)*ww;m.slab(box(a*ww,dd,b*ww,dd+.16*ww/6),h,y,'seating')
  m.beam([a*ww+.1,dd+.5,y+.06],[b*ww-.1,dd+.5,y+.06],.12,'seatTrim')
# Steps rise across the facade and meet a generous central arrival. Their voids stay open.
for name,start,end in [('left',.09,.29),('right',.91,.71)]:
 x0=start*ww;x1=end*ww;z0=.001*ww;z1=.055*ww;n=math.ceil(h/.15)
 for k in range(n):
  a=x0+(x1-x0)*k/n;b=x0+(x1-x0)*(k+1)/n;m.slab(box(min(a,b),z0,max(a,b),z1),-.08,h*(k+1)/n,'stone')
 p=box(min(x0,x1),z0,max(x0,x1),z1);aa=m.pt(x0,(z0+z1)/2,0);bb=m.pt(x1,(z0+z1)/2,0)
 m.floors.append({'id':'landmark44-stairs-'+name,'building':m.b['id'],'p':m.polyworld(p),'from':[aa[0],aa[2]],'to':[bb[0],bb[2]],'lo':B,'hi':B+h,'steps':n,'foundation29':B-.08,'landmark44':True})
 for z in [z0+.06,z1-.06]:m.rail([x0,z,0],[x1,z,h])
 m.route('149 '+name+' stairs',[(x0+(x0-x1)/abs(x0-x1)*1.2,(z0+z1)/2,0),(x1+(x1-x0)/abs(x1-x0)*1.3,(z0+z1)/2,h),(.5*ww,.065*ww,h)])
m.rail([.3*ww,0,h],[.7*ww,0,h]);m.rail([0,.075*ww,h],[0,d,h+.06*ww]);m.rail([ww,.075*ww,h],[ww,d,h+.06*ww]);m.rail([0,d,h+.06*ww],[ww,d,h+.06*ww])
ca=gs['canopy'];m.slab(box(.2*ww,.06*ww,.8*ww,.235*ww),.245*ww,.265*ww,'edge');
for x in ca['mast_x']:
 m.beam([x*ww,.19*ww,h],[x*ww,.19*ww,.33*ww],.23,'mast');m.beam([x*ww,.19*ww,.33*ww],[x*ww,.065*ww,.265*ww],.1,'mast');m.beam([x*ww,.19*ww,.33*ww],[x*ww,.235*ww,.265*ww],.1,'mast')
# Rounded thin canopy fascia and restrained scoreboard at centre.
m.beam([.2*ww,.06*ww,.25*ww],[.8*ww,.06*ww,.25*ww],.3,'edge');m.cube(.3*ww,.062*ww,.205*ww,.4*ww,.22,.034*ww,'score')
m.finish()
# Ground conforming timber decks: exact original terrain triangles are sampled to avoid new stairs.
samples=json.loads((W/'terrain-samples.json').read_text());heights={(round(x*2),round(z*2)):h for x,z,h in samples}
def ground(x,z):
 u=x*2;v=z*2;i=math.floor(u);j=math.floor(v);a=u-i;b=v-j
 return (1-a)*(1-b)*heights[(i,j)]+a*(1-b)*heights[(i+1,j)]+(1-a)*b*heights[(i,j+1)]+a*b*heights[(i+1,j+1)]
m=Model('pond','jahayon',[0,0],[1,0],[0,1],0);deckTriangles=[];deckPolys=[]
for key in ['B1','B2']:
 pp=Polygon(J['elements'][key]['polygonWorldXZ']);deckPolys.append(coords(pp));minx,minz,maxx,maxz=pp.bounds
 for x in np.arange(math.floor(minx),maxx,.5):
  for z in np.arange(math.floor(minz),maxz,.5):
   cut=pp.intersection(box(x,z,x+.5,z+.5))
   for part in polys(cut):
    if part.area<1e-7:continue
    m.plane(part,lambda x,z:(x,z,ground(x,z)),'timber')
    cs=coords(part)
    for i in range(1,len(cs)-1):deckTriangles.append([[q[0],ground(*q),q[1]]for q in [cs[0],cs[i],cs[i+1]]])
 cs=coords(pp)
 for a,b in zip(cs,cs[1:]+cs[:1]):m.face([[*a,ground(*a)-.18],[*b,ground(*b)-.18],[*b,ground(*b)],[*a,ground(*a)]],'timberEdge')
 water=J['elements'][key]['waterEdgeWorldXZ']
 for a,b in zip(water,water[1:]):
  count=math.ceil(math.dist(a,b)/2.5)
  for i in range(count):
   p=[a[k]+(b[k]-a[k])*i/count for k in range(2)];q=[a[k]+(b[k]-a[k])*(i+1)/count for k in range(2)];yp=ground(*p);yq=ground(*q)
   # Circular posts and two sagging rope courses, land side stays open.
   for t in [0,1]:
    if t==1 and i<count-1:continue
    r=p if not t else q;y=yp if not t else yq
    m.plane(Point(*r).buffer(.085,quad_segs=2),lambda x,z:(x,z,y+.95),'timberEdge')
    for j in range(8):
     a0=j*math.tau/8;a1=(j+1)*math.tau/8;m.face([[r[0]+.085*math.cos(a0),r[1]+.085*math.sin(a0),y],[r[0]+.085*math.cos(a1),r[1]+.085*math.sin(a1),y],[r[0]+.085*math.cos(a1),r[1]+.085*math.sin(a1),y+.95],[r[0]+.085*math.cos(a0),r[1]+.085*math.sin(a0),y+.95]],'timberEdge')
   for H in [.48,.9]:
    for j in range(8):
     def rp(t):return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,yp+(yq-yp)*t+H-.16*4*t*(1-t)]
     m.beam(rp(j/8),rp((j+1)/8),.035,'rope')
   aa=m.pt(*p,yp);bb=m.pt(*q,yq);m.solids.append({'id':key+'-rope'+str(i),'p':m.polyworld(LineString([p,q]).buffer(.045)),'lo':min(yp,yq),'hi':max(yp,yq)+1,'hidden':True,'landmark44':True,'rail37':{'a':p,'b':q,'y0':yp,'y1':yq}})
# Faceted organic stones: deterministic unequal axes/rings, shared batched finishes.
import random
rng=random.Random(44)
def rock(m,x,z,h,rx,rz,ry,mat):
 rings=[]
 for j in range(5):
  lat=-math.pi/2+math.pi*j/4;rings.append([[x+rx*math.cos(lat)*math.cos(i*math.tau/9)*(1+rng.uniform(-.09,.09)),z+rz*math.cos(lat)*math.sin(i*math.tau/9)*(1+rng.uniform(-.09,.09)),h+ry*math.sin(lat)]for i in range(9)])
 for j in range(4):
  for i in range(9):m.face([rings[j][i],rings[j][(i+1)%9],rings[j+1][(i+1)%9],rings[j+1][i]],mat)
pond=Polygon(J['baseline']['originalOuterWorldXZ']);bank=coords(pond)
for e,(a,b) in enumerate(zip(bank,bank[1:]+bank[:1])):
 for i in range(math.ceil(math.dist(a,b)/.95)):
  t=(i+.3)/math.ceil(math.dist(a,b)/.95);x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t
  if any(Point(x,z).distance(Polygon(p))<.3 for p in deckPolys):continue
  yy=ground(x,z);height=max(.65,yy-B+.4)
  for row in range(math.ceil(height/.65)):
   rock(m,x+(rng.random()-.5)*.2,z+(rng.random()-.5)*.2,B+.27+row*.6,.52+rng.random()*.35,.45+rng.random()*.25,.36+rng.random()*.12,'rock'+str((i+row)%3))
for x,z in [(1,207.8),(10,198.5),(25,193),(33,182),(-6,173)]:
 yy=ground(x,z);m.beam([x,z,yy],[x,z,yy+4.3],.2,'bark');m.volume(Point(x,z).buffer(.18),yy,yy+4.5)
 for j in range(3):rock(m,x+math.sin(j*2.4)*.65,z+math.cos(j*2.4)*.65,yy+4.3+j*.35,1.6,1.5,1.6,'pine'+str(j%2))
for x,z in J['elements']['D']['centersWorldXZ']:
 for j in range(14):
  a=j*math.tau/14
  for k in range(10):
   def jet(t):return [x+math.cos(a)*1.9*t,z+math.sin(a)*1.9*t,B+.1+.96*4*t*(1-t)]
   m.beam(jet(k/10),jet((k+1)/10),.035,'spray')
 for rad in [1.7,2.3,2.9]:
  for j in range(48):m.beam([x+rad*math.cos(j*math.tau/48),z+rad*math.sin(j*math.tau/48),B+.015],[x+rad*math.cos((j+1)*math.tau/48),z+rad*math.sin((j+1)*math.tau/48),B+.015],.018,'ripple')
m.finish()
# One scholar memorial; no invented lettering.
f=J['elements']['F'];n=f['frontNormalWorldXZ'];m=Model('memorial','jahayon',f['centerWorldXZ'],[-n[1],n[0]],[-n[0],-n[1]],ground(*f['centerWorldXZ']));m.slab(box(-1.69,-1.06,1.69,1.06),-.1,.254,'granite',True);rock(m,0,0,.87,1.48,.845,.69,'granite');m.volume(box(-1.45,-.8,1.45,.8),.25,1.6)
for i in range(3):m.cube(-1.25+i*.83,-.82,.42,.78,.07,.91,'bronze' if i==0 else 'panelStone')
# Small full standing figure, robe/legs/arms/head and scholarly hat.
m.slab(box(-.26,-.22,.26,.22),1.48,1.58,'bronze')
for x in [-.1,.1]:m.cube(x-.055,-.08,1.58,.11,.18,.22,'bronze')
for j in range(10):
 a=j*math.tau/10;b=(j+1)*math.tau/10;m.face([[.24*math.cos(a),.18*math.sin(a),1.75],[.24*math.cos(b),.18*math.sin(b),1.75],[.15*math.cos(b),.11*math.sin(b),2.2],[.15*math.cos(a),.11*math.sin(a),2.2]],'bronze')
rock(m,0,0,2.31,.10,.10,.13,'bronze');m.cube(-.15,-.12,2.4,.3,.24,.055,'bronze');m.beam([-.15,0,2.15],[-.22,-.13,1.91],.1,'bronze');m.beam([.15,0,2.15],[.2,-.17,1.99],.1,'bronze');m.finish()
# Exactly one granite chair and a low-branch spreading pine in the specified flat planting area.
f=G['coordinate_system'];a=f['angle_radians'];m=Model('gate','gate',f['origin_world_xz'],[math.cos(a),math.sin(a)],[-math.sin(a),math.cos(a)],B)
x,z=G['elements']['E']['center_local'];w=.8964;dep=.996;H=2.2908
m.cube(x-w/2,z-dep/2,0,.18,dep,.55,'granite',True);m.cube(x+w/2-.18,z-dep/2,0,.18,dep,.55,'granite',True);m.cube(x-w/2,z-dep/2,.55,w,dep,.18,'granite',True)
back=[[x-w/2,z+.1,.65],[x+w/2,z+.1,.65],[x+w/2,z+.48,H],[x-w/2,z+.48,H]];m.face(back,'granite');m.face([[p[0],p[1]+.16,p[2]]for p in back],'granite')
for i in range(4):j=(i+1)%4;m.face([back[i],back[j],[back[j][0],back[j][1]+.16,back[j][2]],[back[i][0],back[i][1]+.16,back[i][2]]],'granite')
m.volume(box(x-w/2,z-dep/2,x+w/2,z+.64),0,H)
x,z=G['elements']['F']['center_local'];m.beam([x,z,0],[x+.3,z,6.9],.4,'bark');m.volume(Point(x,z).buffer(.26),0,7)
for j in range(9):
 a=j*2.4;r=2.3+(j%3)*.7;yy=5.2+(j%4)*.85;xx=x+math.cos(a)*r;zz=z+math.sin(a)*r;m.beam([x,z,3.7],[xx,zz,yy],.17,'bark');rock(m,xx,zz,yy,2.1,1.6,.8,'pine'+str(j%2))
m.route('gate centre',[ (0,-38,0),(0,-5,0),(0,4,0),(8,14,0),(8,24,0),(4,44,0)])
m.route('gate basin forest side',[(-8,15,0),(-8,25,0),(-4,44,0)])
m.finish()
result={'revision':'landmark44-r1','models':models,'routes':routes,'museumCeilings':ceilings,'deckTriangles':deckTriangles,'deckPolygons':deckPolys,'counts':{'chair':1,'fountains':2,'memorial':1,'museumCores':1,'masts149':4},'sha':S['sha'],'stadiumFrame':S['frame'],'pond':J,'gate':G}
(R/'dist/data/landmark44.json').write_text(json.dumps(result,separators=(',',':')))
print([(m['number'],sum(len(g['indices'])//3 for g in m['groups'].values()))for m in models])
