"""BUILD39 local exterior connection atlas, sourced from immutable BUILD38.
Requires numpy, shapely2, mapbox_earcut. The road and all building shells are retained.
All new terrain is a partition replacement, never an overlay.
"""
from pathlib import Path
import json,subprocess,numpy as np,shapely as S,mapbox_earcut as E
from shapely.geometry import Polygon,box,Point
R=Path(__file__).resolve().parents[1];D=R/'dist/data';W=R/'reports/build39';W.mkdir(parents=True,exist_ok=True)
SOURCE='c84a87297ac03eae561b8aa5cf097a77fc0b9803'
def source(name):return subprocess.check_output(['git','show',SOURCE+':dist/data/'+name],cwd=R)
n=json.loads(source('walk.json'));s=n['precinct29']['library'];o=np.array(s['origin']);u=np.array(s['u']);v=np.array(s['v']);base=s['base']
def pt(a,d):return (o+u*a+v*d).tolist()
def loc(p):return [np.dot(np.array(p)-o,u),np.dot(np.array(p)-o,v)]
def world(g):return S.transform(g,lambda p:o+p[:,0,None]*u+p[:,1,None]*v)
def parts(g):
 if g.geom_type=='Polygon':
  if g.area>1e-8:yield g
 else:
  for q in getattr(g,'geoms',[]):yield from parts(q)
def pack(g):return {'outer':list(g.exterior.coords)[:-1],'holes':[list(r.coords)[:-1]for r in g.interiors]}
def tris(g):
 for p in parts(g):
  rings=[list(p.exterior.coords)[:-1]]+[list(h.coords)[:-1]for h in p.interiors];a=np.array([x for r in rings for x in r]);ii=E.triangulate_float64(a,np.cumsum([len(r)for r in rings],dtype=np.uint32));yield from (a[ii[i:i+3]] for i in range(0,len(ii),3))
# Preserve the existing endpoints and thresholds. Only surface ownership/finish changes.
flights=[q for q in s['surfaces'] if q.get('steps') and q['id'].startswith(('main-front','right-approach'))]
landings=[q for q in s['surfaces'] if any(x.startswith(('main-front','right-approach')) for x in q.get('sources',[])) and not q.get('steps')]
stairMask=S.union_all([Polygon(q['p']) for q in flights+landings])
# The court fans towards the lower main-library threshold; SC court stays +4.45.
court=Polygon([[15,69],[37,69],[37,88],[25,88],[15,73]])
maincourt=box(37,69,107,88)
# Keep the existing Student Union stairs and building footprints.
studentMask=S.union_all([Polygon(q['p'])for q in s['volumes']if q['id'].startswith('student22') and q['lo']<5])
oldCourt=S.union_all([Polygon(q['outer'],q.get('holes',[]))for q in n['ownedPlazas38']])
localMask=S.union_all([box(-10,69,115,128),box(22,54,37,69),court,maincourt]);mask=S.union_all([world(localMask),oldCourt]).difference(studentMask)
# A small sheltered apron directly meets the recessed main glazing at d=69.
patches=[]
def patch(name,g,plane,kind='acroStone39',visible=True):
 for j,p in enumerate(parts(world(g).intersection(mask))):patches.append({'id':name+'-'+str(j),'kind':kind,**pack(p),'plane39':plane,'visible':visible})
# Each triangle/quad is planar. Physics uses exactly this plane; GPU uses its float32 vertices.
def plane3(coords):
 a=np.array([[x,z,1]for x,z,h in coords]);y=np.array([h for x,z,h in coords]);return np.linalg.solve(a,y).tolist()
def piece(name,coords,kind):patch(name,Polygon([[x,z]for x,z,h in coords]),plane3(coords[:3]),kind)
# Existing flat SC court retained, new material only.
for j,g in enumerate(parts(oldCourt.intersection(mask))):patches.append({'id':'SC-court-'+str(j),'kind':'acroStone39',**pack(g),'plane39':[0,0,4.45],'visible':True})
# Spread the 2.25m level change diagonally across the actual available court.
# Max gradient sqrt(2)*.075 = 10.61%; all central stair tops and main door remain +2.2.
connected=S.union_all([court,maincourt,box(22,54,37,69)])
low95=Polygon([[-200,-200],[295,-200],[-200,295]])
low125=Polygon([[-200,-200],[325,-200],[-200,325]])
patch('court-flat-upper',connected.intersection(low95),[0,0,4.45])
patch('court-diagonal-grade',connected.intersection(low125).difference(low95),[-.075,-.075,11.575])
patch('court-flat-main',connected.difference(low125),[0,0,2.2])
# Lower forecourt meets the unchanged road interface at d=128 and student stair foot.
patch('lower-square',box(-10,122,115,128),[0,0,0])
patch('student-square',box(-10,112,37,122),[0,0,0])
# Central lawn slopes follow the actual three-stage central stair envelope.
C=[(88,2.2),(94,1.48),(100,1.48),(108,.74),(114,.74),(122,0)]
def interp(nodes,d):
 for (d0,h0),(d1,h1) in zip(nodes,nodes[1:]):
  if d0-1e-6<=d<=d1+1e-6:return h0+(h1-h0)*(d-d0)/(d1-d0)
 return nodes[0][1] if d<nodes[0][0] else nodes[-1][1]
for a,b in [(37,61),(61,70),(70,94),(94,107)]:
 for j,((d0,h0),(d1,h1)) in enumerate(zip(C,C[1:])):
  patch('central-bank-'+str(a)+'-'+str(j),box(a,d0,b,d1),[0,(h1-h0)/(d1-d0),h0-d0*(h1-h0)/(d1-d0)],'acroLawn39')
# The diagonal court edge is also the upper edge of its lawn bank.
# Shared boundary heights prevent a concealed vertical drop beside the open court.
edge=[(15,73,4.45),(17.8,77.2,4.45),(22,83.5,3.6625),(25,88,3.1),(37,88,2.2),(37,94,1.48),(37,98,1.48),(15,98,1.6),(15,88,1.6)]
idx=E.triangulate_float64(np.array([[a,d]for a,d,h in edge]),np.array([len(edge)],dtype=np.uint32))
for j in range(0,len(idx),3):piece('court-lawn-edge-'+str(j),[edge[k]for k in idx[j:j+3]],'acroLawn39')

# Side approach earth banks blend to the lower central lawn. The paved court clips these below.
SIDE=[(69,4.45),(73,4.45),(88,1.6),(98,1.6),(112,0),(122,0)]
for d0,d1 in zip([69,73,88,94,98,100,108,112,114,122],[73,88,94,98,100,108,112,114,122,128]):
 h0,h1=interp(SIDE,d0),interp(SIDE,d1);c0,c1=interp(C,d0),interp(C,d1)
 for k,coords in enumerate([[(15,d0,h0),(37,d0,c0),(37,d1,c1)],[(15,d0,h0),(37,d1,c1),(15,d1,h1)]]):piece('side-bank-'+str(d0)+'-'+str(k),coords,'acroLawn39')
 # A low graded flank beside D; no huge retaining wall.
 for k,coords in enumerate([[(-10,d0,max(0,h0-.8)),(-3,d0,h0),(-3,d1,h1)],[(-10,d0,max(0,h0-.8)),(-3,d1,h1),(-10,d1,max(0,h1-.8))]]):piece('student-bank-'+str(d0)+'-'+str(k),coords,'acroLawn39')
# Outer lawn transitions towards unchanged east ground at a=115.
for (d0,h0),(d1,h1) in zip([(69,2.2),(73,2.2),(88,2.2)]+C[1:]+[(128,0)],[(73,2.2),(88,2.2)]+C[1:]+[(128,0),(129,0)]):
 if d0>=128:continue
 for k,coords in enumerate([[(107,d0,h0),(115,d0,0),(115,d1,0)],[(107,d0,h0),(115,d1,0),(107,d1,h1)]]):piece('east-bank-'+str(d0)+'-'+str(k),coords,'acroLawn39')
# Stair/landing owners retain their shells; no terrain top is rendered under earth stairs.
for q in flights+landings:
 if q.get('steps'):
  a,d=loc(q['from']);aa,dd=loc(q['to']);slope=(q['hi']-q['lo'])/(dd-d);plane=[0,slope,q['lo']-slope*d-.30]
 else:plane=[0,0,q['lo']-.30]
 patches.insert(0,{'id':q['id'],'kind':'acroSupport39',**pack(Polygon(q['p']).intersection(mask)),'plane39':plane,'visible':False})
# Make every ownership polygon exclusive, priority order listed above.
claimed=Polygon();exclusive=[]
for p in patches:
 g=Polygon(p['outer'],p.get('holes',[])).difference(claimed)
 for q in parts(g):exclusive.append({**p,**pack(q)})
 claimed=S.union_all([claimed,g])
# Unassigned side corridor ends become existing-height paving/landscape, not new slabs.
remaining=mask.difference(claimed)
print('unassigned',remaining.area)
# Narrow a=-3..15 approach interiors not already covered are the original landings/flights.
# Use a triangulated low ground plane for any tiny residual at the open approach.
assert remaining.area<.001, 'Unowned terrain must be explicitly designed, not filled at arbitrary height'
# Sub-millimetre rounding slivers at legacy seams have no independent floor owner.
# Match retained terrain along the two outer lawn edges on the original triangle planes.
# Split by those triangles first, then use the same resulting plane for rendering and walking.
oldmeta=json.loads(source('ground.json'));oldv=np.frombuffer(source('ground.bin'),dtype='<f4');oldi=np.frombuffer(source('ground-indices.bin'),dtype='<u4');oldtris=[]
for ch in oldmeta['chunks']:
 vv=oldv[ch['offset']:ch['offset']+ch['count']*3].reshape(-1,3);ii=oldi[ch['indexOffset']:ch['indexOffset']+ch['indexCount']]
 if not box(*vv[:,[0,2]].min(axis=0),*vv[:,[0,2]].max(axis=0)).intersects(mask):continue
 for j in range(0,len(ii),3):
  t=vv[ii[j:j+3]].astype(float);g=Polygon(t[:,[0,2]])
  if g.area>1e-9 and g.intersects(mask):oldtris.append((g,t))
refined=[]
for p in exclusive:
 left=p['id'].startswith('student-bank');right=p['id'].startswith('east-bank')
 if not left and not right:refined.append(p);continue
 g=Polygon(p['outer'],p.get('holes',[]));covered=Polygon()
 for oldg,t in oldtris:
  cut=g.intersection(oldg)
  if cut.area<1e-8:continue
  aa,bb,cc=t;inv=np.linalg.inv(np.array([[bb[0]-aa[0],cc[0]-aa[0]],[bb[2]-aa[2],cc[2]-aa[2]]]))
  for tri in tris(cut):
   if Polygon(tri).area<1e-8:continue
   coords=[]
   for xz in tri:
    a,d=loc(xz);coef=inv@(xz-aa[[0,2]]);oldh=aa[1]+coef[0]*(bb[1]-aa[1])+coef[1]*(cc[1]-aa[1])-base
    blend=max(0,min(1,(a+10)/7 if left else (115-a)/8));target=interp(SIDE,d) if left else p['plane39'][0]*107+p['plane39'][1]*d+p['plane39'][2];coords.append((a,d,oldh*(1-blend)+target*blend))
   refined.append({**p,**pack(Polygon(tri)),'plane39':plane3(coords)})
  covered=S.union_all([covered,cut])
 for rest in parts(g.difference(covered)):
  if rest.area>.0001:refined.append({**p,**pack(rest)})
exclusive=[p for p in refined if Polygon(p['outer'],p.get('holes',[])).area>1e-5]

# Keep canonical library floors but mark finish; no duplicate floor plates added.
for q in s['surfaces']:
 if q in flights+landings or q['id'].startswith('right-third') or any('right-third' in x for x in q.get('sources',[])):q['finish39']=True
# Drop old central isolated planter generator separately in Acro39 runtime.
# Clip every legacy terrain source inside the new domain; no old road-grade can reclaim it.
removedSources=[]
for key in ['surfaces','groundProfiles32','designGround23']:
 if key not in n:continue
 new=[]
 for q in n[key]:
  g=Polygon(q['outer'],q.get('holes',[]));cut=g.intersection(mask)
  if cut.area<1e-7:new.append(q);continue
  removedSources.append({'collection':key,'id':q.get('id'),'area':cut.area})
  for p in parts(g.difference(mask)):new.append({**q,**pack(p)})
 n[key]=new
# Remove only obsolete vertical grade faces within the rebuilt terrain, below the entrances.
faces=n['precinct29'].get('gradeFaces',[]);kept=[];removedFaces=0
for i in range(0,len(faces),9):
 t=np.array(faces[i:i+9]).reshape(3,3);mid=t.mean(axis=0)
 if max(t[:,1])<base+5 and mask.covers(Point(mid[0],mid[2])):removedFaces+=1
 else:kept.extend(faces[i:i+9])
n['precinct29']['gradeFaces']=kept
# Archive the old forest pre-filter solids before runtime finish adds new curbs.
n['acro39']={'revision':'acro39-r1','sourceCommit':SOURCE,'forestBlocked38':json.loads((R/'sources/forest-blocked38.json').read_text()),'patches':exclusive,'mask':[pack(g)for g in parts(mask)],'removedSources':removedSources,'removedGradeTriangles':removedFaces,'levels':{'road':0,'mainFront':2.2,'court':4.45,'SCtop':13,'G':0,'B3':7,'R5':22}}
# Reconstruct only inside the footprint. Outside fragments keep their exact old triangle planes.
meta=json.loads(source('ground.json'));verts=np.frombuffer(source('ground.bin'),dtype='<f4');ix=np.frombuffer(source('ground-indices.bin'),dtype='<u4');newv=[];newi=[];chunks=[];vo=io=0;removed={};changedChunks=0
def add(vv,ii,c,repair=False):
 global vo,io
 vv=np.array(vv,dtype='<f4').reshape(-1,3);ii=np.array(ii,dtype='<u4').reshape(-1)
 if repair and len(ii):
  t=vv[ii.reshape(-1,3)];cross=(t[:,1,2]-t[:,0,2])*(t[:,2,0]-t[:,0,0])-(t[:,1,0]-t[:,0,0])*(t[:,2,2]-t[:,0,2]);keep=abs(cross)>2e-4;it=ii.reshape(-1,3)[keep].copy();flip=cross[keep]>0;it[flip]=it[flip][:,[0,2,1]];ii=it.reshape(-1)
 if not len(ii):return
 chunks.append({**c,'offset':vo,'count':len(vv),'indexOffset':io,'indexCount':len(ii)});newv.append(vv.reshape(-1));newi.append(ii);vo+=vv.size;io+=ii.size
for c in meta['chunks']:
 vv=verts[c['offset']:c['offset']+c['count']*3].reshape(-1,3);ii=ix[c['indexOffset']:c['indexOffset']+c['indexCount']];xz=vv[:,[0,2]]
 if not box(*np.min(xz,axis=0),*np.max(xz,axis=0)).intersects(mask):add(vv,ii,c);continue
 out=[];ids=[];changed=False
 for j in range(0,len(ii),3):
  t=vv[ii[j:j+3]].astype(float);g=Polygon(t[:,[0,2]]);cut=g.intersection(mask)
  if cut.area<1e-9:ids.extend(range(len(out),len(out)+3));out.extend(t);continue
  changed=True;removed[c['kind']]=removed.get(c['kind'],0)+cut.area;aa,bb,cc=t;mat=np.array([[bb[0]-aa[0],cc[0]-aa[0]],[bb[2]-aa[2],cc[2]-aa[2]]]);inv=np.linalg.inv(mat)
  for xzt in tris(g.difference(mask)):
   coef=(xzt-aa[[0,2]])@inv.T;y=aa[1]+coef[:,0]*(bb[1]-aa[1])+coef[:,1]*(cc[1]-aa[1]);pts=np.column_stack([xzt[:,0],y,xzt[:,1]]);ids.extend(range(len(out),len(out)+3));out.extend(pts)
 if changed:changedChunks+=1;add(out,ids,c,True)
 else:add(vv,ii,c)
# Group in small local sectors for frustum exclusion, with shared finish materials.
for kind in ['acroStone39','acroLawn39']:
 for sector in range(4):
  vv=[];ii=[];zone=world(box(-30+sector*40,-50,10+sector*40,150))
  for p in exclusive:
   if not p['visible'] or p['kind']!=kind:continue
   for t in tris(Polygon(p['outer'],p.get('holes',[])).intersection(zone)):
    a=np.array([loc(x)for x in t]);pl=p['plane39'];ys=base+a[:,0]*pl[0]+a[:,1]*pl[1]+pl[2];ii.extend(range(len(vv),len(vv)+3));vv.extend(np.column_stack([t[:,0],ys,t[:,1]]))
  add(vv,ii,{'x':'acro39','z':sector,'kind':kind},True)
meta['chunks']=chunks;meta['vertices']=vo//3;meta['triangles']=io//3;meta['bytes']=(vo+io)*4;meta['acro39']={'sourceCommit':SOURCE,'removedAreaByMaterial':removed,'ownedArea':mask.area,'changedChunks':changedChunks,'patches':len(exclusive),'removedGradeTriangles':removedFaces}
np.concatenate(newv).tofile(D/'ground.bin');np.concatenate(newi).tofile(D/'ground-indices.bin');(D/'ground.json').write_text(json.dumps(meta,separators=(',',':')));(D/'walk.json').write_text(json.dumps(n,ensure_ascii=False,separators=(',',':')));(W/'ground-replacement.json').write_text(json.dumps(meta['acro39'],indent=2));print(json.dumps(meta['acro39'],indent=2))
