from pathlib import Path
import json,math,sys
import numpy as np,shapely as S
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
R=Path(__file__).resolve().parents[1];baseline=Path(sys.argv[1]);D=json.loads((baseline/'data/campus.json').read_text());N=json.loads((baseline/'data/walk.json').read_text());spec=json.loads((R/'BUILD19-GEOMETRY.json').read_text());o,u,v=spec['origin'],spec['u'],spec['v'];base=spec['base']
p=lambda a,d:[o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d]
rect=lambda a,d,w,h:Polygon([p(a,d),p(a+w,d),p(a+w,d+h),p(a,d+h)])
patches=[]
def area(id,kind,pts):patches.append({'id':id,'kind':kind,'shape':Polygon([p(*q)for q in pts])})
def box(id,kind,a,d,w,h):patches.append({'id':id,'kind':kind,'shape':rect(a,d,w,h)})
# Ground boundaries interpreted from attached satellite, not shadow colors. Building polygons subtracted below.
box('admin-lawn-forecourt','plaza',8,158,129,43)
box('admin-entrance-apron','plaza',20,132,104,28)
area('student-library-court','plaza',[[-48,77],[-11,77],[26,87],[32,123],[23,142],[-20,153],[-53,128]])
box('main-front-apron','plaza',25,72,94,21)
box('admin-library-paired-approach','plaza',34,88,65,51)
box('main-side-court','plaza',-18,18,40,58)
box('humanities-path','path',119,14,24,88)
area('humanities-east-connection','path',[[136,62],[163,62],[182,77],[177,89],[155,77],[136,78]])
box('library-back-passage','plaza',14,-26,125,13.5)
box('pharmacy-upper-forecourt','plaza',20,-81,113,40)
# Broad side walks connecting existing paved areas; no new road through buildings.
area('student-south-walk','path',[[-62,68],[-23,69],[-13,80],[-19,92],[-58,84]])
area('main-north-garden-walk','path',[[105,91],[120,88],[131,120],[145,133],[139,141],[120,131]])
# Retain actual green islands between paired approaches and around the main library.
box('front-central-planting','planting',61,88,9,48)
area('front-east-lawn','lawn',[[102,94],[119,94],[126,121],[116,134],[103,134]])
area('front-west-planting','planting',[[20,92],[32,92],[33,127],[24,130],[17,118]])
area('humanities-garden','planting',[[121,103],[138,100],[154,115],[155,131],[145,135],[128,124]])
# Preserve surface ownership: priority planting -> explicit plazas -> previous surfaces.
new=[];used=Polygon();buildings=unary_union([Polygon(b['p']).buffer(.05)for b in D['buildings'] if b.get('officialNumber') not in ['62','62-1']])
for r in sorted(patches,key=lambda r:0 if r['kind'] in ['planting','lawn'] else 1):
 g=S.make_valid(r['shape']).difference(buildings).difference(used);used=used.union(g)
 for q in ([g]if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if q.geom_type=='Polygon' and q.area>.01:new.append({'kind':r['kind'],'outer':list(map(list,list(q.exterior.coords)[:-1])),'holes':[list(map(list,list(h.coords)[:-1]))for h in q.interiors],'source':'BUILD20 user satellite / official VR; boundaries manually interpreted','id':r['id']})
for old in N['surfaces']:
 g=S.make_valid(Polygon(old['outer'],old.get('holes',[]))).difference(used)
 for q in ([g]if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if q.geom_type=='Polygon' and q.area>.01:new.append({**old,'outer':list(map(list,list(q.exterior.coords)[:-1])),'holes':[list(map(list,list(h.coords)[:-1])) for h in q.interiors]})
l=N['outdoor']['lawn'];lp=lambda a,d:[l['center'][0]+l['u'][0]*a+l['v'][0]*d,l['center'][1]+l['u'][1]*a+l['v'][1]*d]
deck=Polygon([lp(-49,-44),lp(49,-44),lp(49,44),lp(-49,44)])
trimmed=[]
for old in new:
 g=Polygon(old['outer'],old.get('holes',[])).difference(deck)
 for q in ([g]if g.geom_type=='Polygon' else getattr(g,'geoms',[])):
  if q.geom_type=='Polygon' and q.area>.01:trimmed.append({**old,'outer':list(map(list,list(q.exterior.coords)[:-1])),'holes':[list(map(list,list(h.coords)[:-1]))for h in q.interiors]})
N['surfaces']=[{'kind':'parking','id':'lawn-parking-ground20','outer':list(map(list,list(deck.exterior.coords)[:-1])),'holes':[],'groundY':l['base']}]+trimmed
# Shared designed terrain field: parking remains low; only the administration-facing bank joins the deck.
n=N['terrain']['n'];x0,z0,x1,z1=N['bounds'];H=np.array(N['terrain']['values']).reshape(n,n);xs=np.linspace(x0,x1,n);zs=np.linspace(z0,z1,n);X,Z=np.meshgrid(xs,zs);A=(X-o[0])*u[0]+(Z-o[1])*u[1];Q=(X-o[0])*v[0]+(Z-o[1])*v[1]
clamp=lambda x:np.clip(x,0,1)
def apply(target,weight):
 global H
 H=H*(1-weight)+target*weight
# full datum on administration footprint and front lawn-side forecourt; wide smooth fall toward library.
w=clamp((A+12)/20)*clamp((155-A)/15)*clamp((Q-112)/25)*(Q<=214)
apply(base+4.3,w)
# roof of separate low building meets pharmacy-side grade, lower open passage remains 9m below.
target=base+np.where(Q<-44,20,np.where(Q<-34,13+(-34-Q)/10*7,np.where(Q<=-5,13,13*clamp(-Q/5))))
w=clamp((A-12)/8)*clamp((144-A)/20)*clamp((Q+90)/15)*(Q<=0)
apply(target,w)
# opposite stair terminates on the main/humanities walking datum, not on low student-side grade.
w=clamp((A-113)/6)*clamp((180-A)/14)*clamp((Q-4)/10)*clamp((108-Q)/20)
apply(base+4.45,w)
# Humanities building needs the same raised site on its full footprint.
for b in D['buildings']:
 if b.get('officialNumber') in ['60','20','1']:
  target=base+({'60':4.3,'20':20,'1':4.45}[b['officialNumber']]);b['siteDatum']=target;b['grading20']='Shared forecourt/roof connection; datum is design estimate, not surveyed.'
  poly=Polygon(b['p']);pts=S.points(X.ravel(),Z.ravel());dist=S.distance(pts,poly).reshape(n,n);w=clamp((10-dist)/8);apply(target,w)
N['terrain']['values']=np.round(H.ravel(),6).tolist();N['outdoor']['lawn']['adminJoin20']=True
N['precinct20']={'origin':o,'u':u,'v':v,'base':base,'source':'user satellite + official library VR','surfaceCount':len(patches),'heightEstimates':{'adminAndLawn':base+4.3,'lowerPassage':base+13,'separateRoofAndPharmacy':base+20,'humanities':base+4.45},'registration':{'imageFrame':[1990,1247],'scale':5.05,'offset':[1050,800],'ySign':-1,'status':'manual multi-building visual registration; not surveyed'}}
for name,obj in [('campus',D),('walk',N)]: (R/f'dist/data/{name}.json').write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
(R/'BUILD20-GROUND-RECORD.json').write_text(json.dumps({'patches':[{'id':r['id'],'kind':r['kind'],'worldOuter':list(map(list,r['shape'].exterior.coords))}for r in patches],'height':N['precinct20'],'unknowns':['Exact paving boundaries beneath trees','survey elevations','VR capture era; lawn VR predates current elevated plaza']},ensure_ascii=False,indent=2))
print('prepared',len(new),'exclusive surfaces',len(patches),'new zones')
