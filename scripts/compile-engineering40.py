from pathlib import Path
import json,math,numpy as np,mapbox_earcut as ear
from shapely.geometry import Polygon,box,LineString,Point
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1]; W=R/'dist/data'; S=R/'sources/engineering40'
BASE=json.loads((S/'baseline-buildings.json').read_text())
J={}
for n in ['engineer310','icp311','iamd312-313','automotive314']:J[n]=json.loads((S/(n+'.json')).read_text())
G=95.47306874492949
models=[];routes=[]
def polys(g):return [g] if g.geom_type=='Polygon' else [q for q in getattr(g,'geoms',[]) if q.geom_type=='Polygon']
def coords(p):return [list(q) for q in list(p.exterior.coords)[:-1]]
class Model:
 def __init__(self,n,u,width=100,s=None,offset=0):
  self.n=n;self.b=BASE[n];l=math.hypot(*u);self.u=[a/l for a in u];self.v=[-self.u[1],self.u[0]]
  p=self.b['p'];xx=[sum(q[i]*self.u[i] for i in range(2)) for q in p];dd=[sum(q[i]*self.v[i] for i in range(2)) for q in p]
  self.s=s or (max(xx)-min(xx))/width;self.origin=[self.u[i]*min(xx)+self.v[i]*(min(dd)+offset*self.s) for i in range(2)];self.base=self.b['siteDatum']
  self.p=Polygon([((x-min(xx))/self.s,(d-min(dd))/self.s-offset) for x,d in zip(xx,dd)])
  self.groups={};self.solids=[];self.floors=[];self.entries=[]
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
  self.solids.append({'id':f'eng40-{self.n}-solid{len(self.solids)}','building':self.b['id'],'p':self.polyworld(p),'lo':self.base+lo*self.s,'hi':self.base+hi*self.s,'hidden':True,'engineering40':True})
 def floor(self,p,h):self.floors.append({'id':f'eng40-{self.n}-floor{len(self.floors)}','building':self.b['id'],'p':self.polyworld(p),'lo':self.base+h*self.s,'engineering40':True})
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
 def walls(self,p,lo,hi,mat,windows,outer=None):
  for pp in polys(p):
   cs=coords(pp)
   edges=list(zip(cs,cs[1:]+cs[:1]))
   for a,b in edges:
    # Only exposed segments survive material/volume union.
    seg=LineString([a,b]);parts=[seg] if outer is None else ([seg] if outer.buffer(1e-6).covers(seg) else [])
    if not parts:continue
    dx,dd=b[0]-a[0],b[1]-a[1];l=math.hypot(dx,dd)
    if l<1e-5:continue
    mid=np.array([(a[0]+b[0])/2,(a[1]+b[1])/2]);normal=np.array([-dd,dx])/l
    if not p.covers(Point(*(mid+normal*.02))):normal=-normal
    front=normal[1]>.7;side=normal[0]>.7;rear=self.n=='311' and normal[1]<-.7;frontAxis=front or rear
    # Facade schedules are independent; BUILD41 adds restrained, explicit rear/end adaptations.
    target=windows.get('front',[]) if front else windows.get('left',[]) if side else windows.get('rear',[]) if rear else []
    x0=min(a[0],b[0]) if frontAxis else min(a[1],b[1]);x1=max(a[0],b[0]) if frontAxis else max(a[1],b[1])
    if not(frontAxis or side):self.face([[*a,lo],[*b,lo],[*b,hi],[*a,hi]],mat);continue
    if frontAxis:
     mapper=lambda x,z,a=a,b=b:(x,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]),z)
    else:mapper=lambda x,z,a=a,b=b:(a[0]+(b[0]-a[0])*(x-a[1])/(b[1]-a[1]),x,z)
    boundary=box(x0,lo,x1,hi);holes=[]
    for q in target:
     shape=q.get('shape')
     if shape is None:
      x,z,w,h=q['rect'];shape=box(x,z,x+w,z+h)
     pwin=shape.intersection(boundary)
     if pwin.area<.05:continue
     holes.append(pwin);self.window(pwin,mapper,[normal[0],normal[1],0],q.get('mat','glass'),q.get('cols',2),q.get('rows',2),q.get('frame','frame'),q.get('spandrel_h'),shape.bounds)
    self.plane(boundary.difference(unary_union(holes)),mapper,'dark' if self.n=='313' and front else mat)
 def masses(self,masses,windows,entry=None):
  # Partition horizontal layers, remove internal faces and covered roofs.
  levels=sorted(set([z for p,lo,hi,mat in masses for z in [lo,hi]]+([entry['head']] if entry else [])));layers=[]
  for lo,hi in zip(levels,levels[1:]):
   used=Polygon();parts=[]
   for p,z0,z1,mat in reversed(masses):
    if z0<=lo and z1>=hi:
     q=p.difference(used);used=used.union(p)
     if not q.is_empty:parts.append((q,mat))
   layers.append((lo,hi,parts,used))
  for i,(lo,hi,parts,whole) in enumerate(layers):
   above=layers[i+1][3] if i+1<len(layers) else Polygon()
   if self.n=='311':self.walls(whole,lo,hi,'panel',windows)
   for p,mat in parts:
    if self.n!='311':self.walls(p,lo,hi,mat,windows,whole.boundary)
    self.plane(p.difference(above),lambda x,d:(x,d,hi),'roof')
   vol=whole
   if entry and hi<=entry['head']:vol=vol.difference(entry['recess'])
   for pp in polys(vol):self.volume(pp,lo,hi)
 def entry(self,x,width,front=0,raiseU=0,run=0,canopy=3,doorHeight=5,landing=None,canopyWidth=None):
  s=self.s;lo=0;hi=raiseU;dtop=front-2.2 if landing is None else landing;dstart=dtop-run
  # Physical entry terrace, supported down to existing grade; only its actual footprint.
  terrace=box(x-width/2,dtop,x+width/2,front+1.25)
  if hi>0:self.slab(terrace, min(-.12,hi-.25),hi,'stone',False,True)
  if hi>0:self.volume(terrace,-.2,hi)
  if run and hi>0:
   count=max(1,math.ceil(hi*s/.16))
   for i in range(count):
    a=dstart+run*i/count;b=dstart+run*(i+1)/count;h=hi*(i+1)/count
    self.slab(box(x-width/2,a,x+width/2,b),-.2,h,'stone',False,True)
   for side in [-1,1]:
    xx=x+side*(width/2+.1)
    self.beam([xx,dstart,1/s],[xx,dtop,hi+1/s],.055/s,'rail')
    for t in [0,.5,1]:self.beam([xx,dstart+run*t,hi*t],[xx,dstart+run*t,hi*t+1/s],.045/s,'rail')
  cw=canopyWidth or width+1
  if self.n!='310':self.cube(x-cw/2,front-canopy,hi+doorHeight+.3,cw,canopy+1,.45,'dark' if self.n=='313' else 'panel')
  for hx in [x-.3,x+.3]:self.beam([hx,front+.36,hi+.85/s],[hx,front+.36,hi+1.25/s],.035/s,'metal')
  self.entries.append({'x':x,'width':width,'front':front,'dtop':dtop,'start':dstart-1.5/s,'end':front-.5,'sill':self.base+hi*s,'raise':hi*s})
  nodes=[self.pt(x,dstart-2/s,0),self.pt(x,dstart,0),self.pt(x,dtop,hi),self.pt(x,front-.5,hi)]
  routes.append({'zone':'연구시설 BUILD40','road':self.n+' entry','coords':[[p[0],p[2]] for p in nodes],'startFeet':nodes[0][1],'endFeet':nodes[-1][1]})
 def finish(self):
  models.append({'number':self.n,'id':self.b['id'],'fit':{'scale':self.s,'origin':self.origin,'u':self.u,'v':self.v,'datum':self.base},'groups':self.groups,'volumes':self.solids,'surfaces':self.floors,'entries':self.entries,'originalFootprint':self.b['p'],'top':max(y for g in self.groups.values() for y in g['positions'][1::3])})
# 310: independent roof strips, exposed crown, recessed porch and true open gable.
m=Model('310',[0,1],offset=1.05);j=J['engineer310'];e=j['envelope'];floor=2.2
m.slab(box(0,-3.5,100,48),-.25,floor,'stone',False,False)
m.floor(box(0,-3.5,100,3.5),floor)
m.volume(box(0,3.65,100,48),-.25,11.5)
for x0,x1 in [(0,32),(44,100)]:m.window(box(x0,2.2,x1,11.5),lambda x,h:(x,3.5,h),[0,1,0],cols=8 if x0==0 else 14,rows=3)
m.window(box(33,2.2,43,8.6),lambda x,h:(x,3.5,h),[0,1,0],cols=4,rows=1)
m.cube(32,3.5,8.6,12,.6,2.9,'frame')
for x in [32,43]:m.cube(x,3.5,2.2,1,.6,6.4,'steel')
m.cube(-2,-3.5,11.5,104,7,.8,'steel');m.cube(-2,44.5,11.5,104,7,.8,'steel')
for a,b in j['frames']['v_bays']:
 for p,q in [([a,0,11.5],[(a+b)/2,0,2.2]),([(a+b)/2,0,2.2],[b,0,11.5])]:m.beam(p,q,1.1)
 # trunk of actual supports is solid, doorway gap is kept.
 m.volume(box((a+b)/2-.55,-.55,(a+b)/2+.55,.55),2.2,11.5)
roofy=lambda d:12.5+19.5*d/24
for a,b in [(0,28),(50,100)]:
 for d0,d1 in [(0,16.6153846),(31.3846154,48)]:
  yy=lambda d:roofy(min(d,48-d))
  m.face([[a,d0,yy(d0)],[b,d0,yy(d0)],[b,d1,yy(d1)],[a,d1,yy(d1)]],'ribbed')
 m.face([[a,16.6153846,26],[b,16.6153846,26],[b,31.3846154,26],[a,31.3846154,26]],'roof')
for a,b in j['frames']['upper_front_bays']:
 m.beam([a,16.6153846,26],[(a+b)/2,24,32],.72);m.beam([(a+b)/2,24,32],[b,16.6153846,26],.72)
m.beam([0,24,32],[100,24,32],.72)
for d0,d1 in [(0,24),(24,48)]:
 yy=lambda d:roofy(min(d,48-d));m.face([[28,d0,yy(d0)],[50,d0,yy(d0)],[50,d1,yy(d1)],[28,d1,yy(d1)]],'glass')
 for i in range(9):x=28+22*i/8;m.beam([x,d0,yy(d0)+.12],[x,d1,yy(d1)+.12],.17,'steel')
 for i in range(6):d=d0+(d1-d0)*i/5;m.beam([28,d,yy(d)+.12],[50,d,yy(d)+.12],.17,'steel')
for x in j['roof']['rooflight_centers_x']:
 m.face([[x-3,1,roofy(1)+.16],[x+3,1,roofy(1)+.16],[x+3,7,roofy(7)+.16],[x-3,7,roofy(7)+.16]],'glass')
 for a,b in [([x-3,1,roofy(1)+.25],[x+3,1,roofy(1)+.25]),([x-3,7,roofy(7)+.25],[x+3,7,roofy(7)+.25]),([x-3,1,roofy(1)+.25],[x-3,7,roofy(7)+.25]),([x+3,1,roofy(1)+.25],[x+3,7,roofy(7)+.25])]:m.beam(a,b,.26)
for x in [0,100]:
 outer=Polygon(j['gable']['opaque_polygon_zy']);glass=Polygon(j['gable']['upper_glass_polygon_zy']);m.plane(outer.difference(glass),lambda d,h:(x,d,h),'panel')
 m.window(glass,lambda d,h:(x,d,h),[1 if x==0 else -1,0,0],cols=7,rows=3,frame='steel')
 m.window(box(3.5,2.2,46,11.5),lambda d,h:(x,d,h),[1 if x==0 else -1,0,0],cols=7,rows=3,frame='steel')
 tri=j['gable']['outer_frame_triangle_zy'];m.beam([x,*tri[0]],[x,*tri[1]],.72);m.beam([x,*tri[1]],[x,*tri[2]],.72)
m.entry(38,10,front=2.1,raiseU=2.2,run=6,canopy=5.6,doorHeight=6.4,landing=-3.5)
# Replace narrower helper landing with genuine porch extension (door is at 3.5).
for x0,x1 in [(0,32),(44,100)]:
 for d in [-3.25]:
  m.beam([x0,d,2.2+1/m.s],[x1,d,2.2+1/m.s],.055/m.s,'rail')
  for x in np.linspace(x0,x1,max(2,math.ceil((x1-x0)*m.s/1.6))):m.beam([x,d,2.2],[x,d,2.2+1/m.s],.045/m.s,'rail')
m.finish()
# 311: right-hand entry faces 302, 6 tall + 6 short bays; polygon window lies in wall.
m=Model('311',[-.031543,.999502],offset=7);j=J['icp311'];wins={'front':[],'left':j['facades']['left']['windows']}
wins['rear']=[{'rect':[x,h,7,4.2],'cols':2,'rows':1,'mat':'glass'} for x in [8,24,40,56,72,88] for h in [6,18,28]]+[{'rect':[x,37,7,3.5],'cols':2,'rows':1,'mat':'glass'} for x in [20,40,60,84]]
for q in j['facades']['front']['windows']:wins['front'].append({**q,'cols':2 if q['mass']=='A' else 1,'rows':3 if q['type']=='tall_glazed_bay' else 1})
wins['front'] += [{'shape':Polygon(j['facades']['front']['polygon_window']['points_uh']),'cols':2,'rows':3},{'rect':[71,1.6,8,4.4],'cols':3,'rows':1,'mat':'door'}]
mass=[]
for q in j['masses']:
 x,d,h=q['origin'];ww,dd,hh=q['size'];p=box(x,d,x+ww,d+dd).intersection(m.p)
 if q['id']=='A':p=box(0,0,82,36).intersection(m.p)
 if q['id']=='D':continue
 mass.append((p,-.3 if h==0 else h,h+hh,'panel'))
recess=box(70.7,-.1,79.3,.60)
m.masses(mass,wins,{'recess':recess,'head':6.1})
# Door is recessed behind the facade glass; blocked interior remains closed.
m.entry(75,12,raiseU=1.6,run=4,canopy=2.4,doorHeight=4.4)
for x in j['roof_frame']['rib_u']:m.beam([x,5,40.8],[x,12,40.8],.55)
m.beam([8,5,40.8],[79,5,40.8],.65)
for x in [8,79]:m.beam([x,5,34],[x,5,40.8],.55)
m.finish()
# 312 and 313 share relative scale; their grade is sampled independently, never flattened.
s313=Model('313',[-.970762,.240045]).s
m=Model('312',[.218,.976],width=80,s=s313);j=J['iamd312-313']['buildings']['312'];masses=[]
# Actual georeferenced indentations take priority over bounding boxes in the design.
maxu=m.p.bounds[2]
for q in j['masses']:
 if q['key']=='A3':continue
 u0,u1=q['u'];d0,d1=q['v'];z0,z1=q['z']
 if q['key']=='A0':u1=maxu;d1=m.p.bounds[3]
 if q['key']=='A4':u0=maxu-10;u1=maxu;d1=m.p.bounds[3]
 p=box(u0,d0,u1,d1).intersection(m.p)
 masses.append((p,-.3 if z0==0 else z0,z1,'panel' if q['material']=='pale' else 'dark'))
# Preserve existing footprint at lower levels and shape stepped upper silhouette.
masses.insert(0,(m.p,-.3,12,'panel'))
wins={'front':j['facades']['front']['windows'],'left':j['facades']['side']['windows']}
wins['front']=[q for q in wins['front'] if not q['id'].startswith('A3')]
wins['front'].append({'rect':[29.5,0,8.5,65.6],'cols':3,'rows':12,'mat':'glassBlue'})
m.masses(masses,wins,{'recess':box(30,-.2,37.5,.60),'head':5.2})
m.entry(33.7,7,raiseU=0,canopy=1.8,doorHeight=5.2)
m.finish()
m=Model('313',[-.970762,.240045],s=s313);j=J['iamd312-313']['buildings']['313'];wins={'front':[q for q in j['facades']['front']['windows'] if not(q['floor']==1 and 40<q['rect'][0]<60)],'left':[{'rect':[d,h,11.5,4.8],'cols':3,'rows':1,'mat':'glassBlue','frame':'dark'} for d in [7,29] for h in [2,10,18]]}
wins['front'].append({'rect':[44,0,15,5.2],'cols':4,'rows':1,'mat':'door'})
m.masses([(m.p,-.3,25,'panel')],wins,{'recess':box(44,-.1,59,.60),'head':5.8})
# Real protruding dark I-shaped frames, with shallow flanges and inset webs.
for x in j['facades']['front']['frame_x']:
 lo=5.8 if 44<x<59 else 0
 m.cube(x-.36,-.8,lo,.72,.24,25-lo,'dark');m.cube(x-.16,-.56,lo,.32,.55,25-lo,'dark')
for h in [0,8,16,24]:
 for a,b in ([(1.3,44),(59,99.3)] if h==0 else [(1.3,99.3)]):m.cube(a,-.55,h,b-a,.9,.6,'dark')
# BUILD41: explicitly authorized road-facing end-wall design adaptation, not restoration.
# Follow the exact existing slanted end boundary, retaining the three original floor lines.
cs=coords(m.p);a,b=min(zip(cs,cs[1:]+cs[:1]),key=lambda ab:(ab[0][0]+ab[1][0])/2)
u_at=lambda d:a[0]+(b[0]-a[0])*(d-a[1])/(b[1]-a[1])
for h in [8,16,24]:m.beam([u_at(1.2)-.18,1.2,h+.3],[u_at(48)-.18,48,h+.3],.50,'dark')
for d in [6.5,19,28.5,41]:m.beam([u_at(d)-.17,d,.8],[u_at(d)-.17,d,24.6],.43,'dark')
m.entry(51.5,15,raiseU=0,canopy=5.5,doorHeight=5.2,canopyWidth=25)
for x in [41,64]:m.cube(x-.17,-5,0,.34,.34,5.5,'dark',True)
m.finish()
# 314: four narrow horizontal ribbons, separate glazed end, original rear outline.
m=Model('314',[.33430835061644026,.9424637535248319]);j=J['automotive314'];front=[]
for band in j['front_glazing']['bands_y']:
 for group in j['front_glazing']['groups']:
  x=group['x_breaks'][0];front.append({'rect':[x,band[0],group['x_breaks'][-1]-x,band[1]-band[0]],'cols':len(group['x_breaks'])-1,'rows':3,'mat':'glass'})
for q in j['ground_front']['glazing']:front.append({'rect':[q['x'][0],q['y'][0],q['x'][1]-q['x'][0],q['y'][1]-q['y'][0]],'cols':q['columns'],'rows':q['rows']})
for q in j['ground_front']['doors']:front.append({'rect':[q['x'][0],0,q['x'][1]-q['x'][0],q['y'][1]],'cols':q['columns'],'rows':1,'mat':'door' if q['type']=='glazed' else 'service'})
# Build front and other perimeter; end wall receives its own broad glazing rather than copied ribbons.
m.masses([(m.p,-.3,30,'panel')],{'front':front,'left':[]},{'recess':box(33,-.1,42,.60),'head':5.2})
# Replace the actual end wall faces (not overlay): remove triangles on its plane and rebuild with openings.
endA=np.array([100,31.4694]);endB=np.array([99.2617,0]);axis=endB-endA
# Existing end goes from projected u=100,d31.47 to u99.26,d0. It is a blank face in mass pass.
def endx(d):return 99.2617+(100-99.2617)*d/31.4694
panel=m.groups['panel'];pos=panel['positions'];idx=panel['indices'];keep=[]
for k in range(0,len(idx),3):
 tri=[pos[i*3:i*3+3] for i in idx[k:k+3]];local=[]
 for p in tri:
  delta=[p[0]-m.origin[0],p[2]-m.origin[1]];u=sum(delta[i]*m.u[i] for i in range(2))/m.s;d=sum(delta[i]*m.v[i] for i in range(2))/m.s;local.append((u,d))
 if all(abs(u-endx(d))<.002 for u,d in local):continue
 keep+=idx[k:k+3]
panel['indices']=keep
holes=[]
for lo,hi in j['side_glazing']['bands_y']:
 p=box(2,lo,30,hi);holes.append(p);m.window(p,lambda d,h:(endx(d),d,h),[-1,0,0],'glassBlue',8,2)
p=box(4,1.2,11,4.8);holes.append(p);m.window(p,lambda d,h:(endx(d),d,h),[-1,0,0],'glassBlue',2,2)
m.plane(box(0,-.3,31.4694,30).difference(unary_union(holes)),lambda d,h:(endx(d),d,h),'panel')
for lo,hi in j['front_glazing']['bands_y']:
 for t in [.22,.82]:h=lo+(hi-lo)*t;m.cube(16.5,-.38,h,77.5,.5,.13,'metal')
m.entry(37.5,13,raiseU=0,canopy=2.8,doorHeight=5)
for x0,x1 in [(53,67),(76,93)]:m.cube(x0,-2.2,5.1,x1-x0,2.4,.7,'metal')
for d in j['roof_frame']['crossbar_z']:m.beam([97,d,33.5],[100,d,33.5],.45,'metal')
for x in [97,100]:m.beam([x,0,33.5],[x,31.47,33.5],.45,'metal')
for d in [0,31.47]:m.beam([100,d,30],[100,d,33.5],.45,'metal')
m.finish()
# Road-side approach points are derived from latest retained roads, not package Y=0.
aprons=[]
for model,route in zip(models,routes):
 p=Point(route['coords'][0]);candidates=[]
 for road in BASE[model['number']]['nearRoads']:
  line=LineString(road['p']);q=line.interpolate(line.project(p));candidates.append((p.distance(q),q,float(road['width'])))
 distance,q,width=min(candidates,key=lambda v:v[0]);dx=p.x-q.x;dz=p.y-q.y
 if distance>width/2+.2:
  start=[q.x+dx/distance*(width/2+.25),q.y+dz/distance*(width/2+.25)]
  route['coords'].insert(0,start)
 else:start=route['coords'][0]
 # Stop at the first raised riser; flat entrances continue to the recessed door.
 end=route['coords'][2]
 if model['entries'][0]['raise']==0:
  f=model['fit'];e=model['entries'][0];end=[f['origin'][i]+f['scale']*(e['x']*f['u'][i]+(e['front']+1.25)*f['v'][i]) for i in range(2)]
 half=min(2.6,model['entries'][0]['width']*model['fit']['scale']/2)
 area=LineString([start,end]).buffer(half,cap_style=2,join_style=2)
 aprons.extend([coords(p) for p in polys(area)])
# Existing gaps: retain their ground, no C2/C3/C4 link introduced.
for name,ps in [('312–313 existing gap',[[18,-877],[3,-887],[-9,-883],[-30,-878],[-44,-876]]),('314 side existing passage',[[18,-859],[9,-851],[-5,-845],[2,-818],[18,-814]])]:routes.append({'zone':'연구시설 BUILD40','road':name,'coords':ps,'startFeet':G,'endFeet':G})
for model in models:
 for group in model['groups'].values():
  group['positions']=[round(x,5) for x in group['positions']]
  group['uvs']=[round(x,5) for x in group['uvs']]
(W/'engineering40.json').write_text(json.dumps({'revision':'engineering40-r1','models':models,'routes':routes,'aprons':aprons},separators=(',',':')))
(W/'qa40-routes.json').write_text(json.dumps(routes,ensure_ascii=False,indent=2))
print([(m['number'],len(m['volumes']),len(m['surfaces']),sum(len(g['indices'])//3 for g in m['groups'].values())) for m in models])
