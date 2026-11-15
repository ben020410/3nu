from pathlib import Path
import json,numpy as np,mapbox_earcut as ear
from shapely.geometry import Polygon,LineString,box
from shapely.ops import unary_union
import subprocess,tempfile
R=Path(__file__).resolve().parents[1];W=R/'dist/data';O=W;tmp=tempfile.TemporaryDirectory();S=Path(tmp.name)
# Immutable BUILD40 ground: reruns replace the same original faces, never layer new slabs.
for name in ['walk.json','ground.json','ground.bin','ground-indices.bin']:(S/name).write_bytes(subprocess.check_output(['git','show','b6423c510d5622af9bbbf9579606909e8070bc15:dist/data/'+name],cwd=R))
nav=json.loads((S/'walk.json').read_text());meta=json.loads((S/'ground.json').read_text())
def poly(s):return Polygon(s['outer'],s.get('holes',[])).buffer(0)
def coords(p):return {'outer':[list(q) for q in list(p.exterior.coords)[:-1]],'holes':[[list(q) for q in list(h.coords)[:-1]] for h in p.interiors]}
def polys(p):return [p] if p.geom_type=='Polygon' else [q for q in getattr(p,'geoms',[]) if q.geom_type=='Polygon']
def line(p,w):return LineString(p).buffer(w/2,cap_style=2,join_style=2)
ring=unary_union([poly(s) for s in nav['surfaces'] if s['kind']=='road' and s['id'].startswith('ring33-')]);allRoads=unary_union([poly(s) for s in nav['surfaces'] if s['kind']=='road'])
z1=Polygon([(1,-1143),(24,-1143),(24,-1098),(20,-1095),(20,-1054),(1,-1054)]).difference(ring)
p1=unary_union([box(1,-1143,24,-1098),box(6,-1102,12,-1066),box(1,-1071,21,-1054)])
z2=Polygon([(-48,-939),(22,-942),(31,-851),(17,-848),(7,-883),(-4,-884),(-17,-923),(-48,-923)]).difference(ring)
z2=z2.union(line([[-33,-878],[-9,-883],[-3,-888.8]],5)).difference(ring)
service=line([[2,-918],[3.8,-912.368],[10.878,-892.107],[22.029,-853.624],[23.814,-854.069]],6)
service=service.union(line([[-3,-888.8],[10.878,-892.107]],6)).union(Polygon([[-3,-918],[6,-921],[8,-915],[-1,-912]]))
p2=unary_union([line([[-28,-925],[-10,-925],[-5,-920],[-1,-908],[2,-898],[0,-889],[-9,-883],[-33,-878]],3.6),line([[0,-889],[5.5,-883],[11.5,-859],[16,-853]],2.8),box(-48,-930,-26,-921)])
# A compact, low-density parking court inside the existing gray clearing; no slope flattening.
z3=box(-141,-1042,-39,-918).difference(allRoads)
lot=Polygon([(-124,-1008),(-124,-947),(-117,-940),(-101,-940),(-96,-947),(-96,-1008)]).buffer(1,join_style=1).buffer(-1,join_style=1)
access=line([[-110,-1007],[-110,-1020],[-102,-1029],[-91,-1035]],7)
parking=lot.union(access)
p3=Polygon([(-84,-1008),(-57,-1008),(-46,-996),(-46,-939),(-40,-939),(-40,-922),(-84,-922)])
# Leave one continuous lawn between the parking court and the building-side pedestrian space.
p3=p3.union(line([[-99,-954],[-82,-954]],2.8)).union(line([[-110,-943],[-82,-930],[-47,-925]],2.8))
# Flush stone edging belongs to the ground partition; no overlapping slab/paint plane.
edging=lot.buffer(.23).difference(lot).difference(access.buffer(.1)).difference(p3)
# 28 ordinary prototype bays, two banks facing an 8m aisle. No implied legal dimensions.
marks=[];stalls=[]
for x0,x1 in [(-119,-114),(-106,-101)]:
 for i in range(14):
  z=-995+i*2.7;stalls.append({'p':[[x0,z],[x1,z],[x1,z+2.7],[x0,z+2.7]],'width':2.7,'depth':5})
 for i in range(15):
  z=-995+i*2.7;marks.append(line([[x0,z],[x1,z]],.10))
 marks.append(line([[x0 if x0==-119 else x1,-995],[x0 if x0==-119 else x1,-957.2]],.10))
paint=unary_union(marks).intersection(parking)
zone=unary_union([z1,z2,z3]);raw=[('parkingLine41',paint),('path',p1.intersection(z1).union(p2.intersection(z2)).union(p3.intersection(z3))),('road',service.intersection(z2)),('parking41',parking.intersection(z3)),('edging41',edging.intersection(z3))]
# Service lane owns crossings; paths use the same ground height and never form a second strip over it.
raw=[raw[0],raw[2],raw[1],raw[3],raw[4]];layers=[];claimed=Polygon()
for kind,g in raw:
 g=g.intersection(zone).difference(claimed);claimed=claimed.union(g);layers.append((kind,g))
layers.append(('grass',zone.difference(claimed)))
positions=np.fromfile(S/'ground.bin',dtype='<f4');indices=np.fromfile(S/'ground-indices.bin',dtype='<u4');outP=[];outI=[];chunks=[];changed=[];groups={};areas={};oldArea=0;newArea=0

def emit(g,plane,ps,ix):
 global newArea
 for p in polys(g):
  if p.area<1e-8:continue
  rings=[list(p.exterior.coords)[:-1]]+[list(r.coords)[:-1] for r in p.interiors];vs=np.asarray([q for r in rings for q in r],dtype=np.float32).astype(np.float64);ends=np.cumsum([len(r) for r in rings],dtype=np.uint32);ii=ear.triangulate_float64(vs,ends);start=len(ps)//3
  for x,z in vs:ps.extend([x,plane[0]*x+plane[1]*z+plane[2],z])
  for k in range(0,len(ii),3):
   a,b,c=[int(i) for i in ii[k:k+3]];va,vb,vc=vs[[a,b,c]];cross=(vb[0]-va[0])*(vc[1]-va[1])-(vb[1]-va[1])*(vc[0]-va[0]);
   if abs(cross)>1e-9:ix.extend([start+a,start+c,start+b] if cross<0 else [start+a,start+b,start+c])
for part in meta['chunks']:
 pp=positions[part['offset']:part['offset']+part['count']*3].reshape(-1,3);ii=indices[part['indexOffset']:part['indexOffset']+part['indexCount']];lp=pp.flatten().tolist();li=ii.tolist()
 if len(pp) and box(pp[:,0].min(),pp[:,2].min(),pp[:,0].max(),pp[:,2].max()).intersects(zone):
  lp=[];li=[];touched=0
  for k in range(0,len(ii),3):
   v=pp[ii[k:k+3]].astype(float);p=Polygon(v[:,[0,2]])
   if p.area<1e-8 or not p.intersects(zone):off=len(lp)//3;lp.extend(v.flatten());li.extend([off,off+1,off+2]);continue
   hit=p.intersection(zone)
   if hit.area<1e-8:off=len(lp)//3;lp.extend(v.flatten());li.extend([off,off+1,off+2]);continue
   plane=np.array([0,0,float(v[:,1].mean())]) if np.ptp(v[:,1])<.00001 else np.linalg.solve(np.c_[v[:,0],v[:,2],np.ones(3)],v[:,1]);emit(p.difference(zone),plane,lp,li);touched+=1;oldArea+=hit.area
   for kind,g in layers:
    q=hit.intersection(g)
    if q.area<1e-8:continue
    # Group by original spatial chunk, never one whole-campus mesh.
    targetKind=part['kind'] if kind=='grass' and part['kind'] in ['wood','planting'] else kind
    key=(str(part['x']),str(part['z']),targetKind);ps,ix=groups.setdefault(key,([],[]));emit(q,plane,ps,ix);areas[targetKind]=areas.get(targetKind,0)+q.area;newArea+=q.area
  if touched:changed.append({'x':part['x'],'z':part['z'],'kind':part['kind'],'triangles':touched})
  else:lp=pp.flatten().tolist();li=ii.tolist()
 q=dict(part);q.update(offset=len(outP),count=len(lp)//3,indexOffset=len(outI),indexCount=len(li));chunks.append(q);outP+=lp;outI+=li
for (x,z,kind),(ps,ix) in groups.items():
 chunks.append({'x':'finish41-'+x,'z':z,'kind':kind,'offset':len(outP),'count':len(ps)//3,'indexOffset':len(outI),'indexCount':len(ix)});outP+=ps;outI+=ix
np.asarray(outP,dtype='<f4').tofile(O/'ground.bin');np.asarray(outI,dtype='<u4').tofile(O/'ground-indices.bin');meta['chunks']=chunks;meta['vertices']=len(outP)//3;meta['triangles']=len(outI)//3;meta['bytes']=len(outP)*4+len(outI)*4;meta['finish41']={'method':'Exclusive local ground repartition; original affine height planes preserved','changedChunks':changed,'areaBefore':oldArea,'areaAfter':newArea,'areas':areas,'parkingBays':28};(O/'ground.json').write_text(json.dumps(meta,separators=(',',':')))
# Authored ownership lets later compilers reapply this finish instead of resurrecting old strips.
spec={'revision':'upper-finish41-r1','zones':[coords(p) for p in polys(zone)],'regions':[{'kind':k,**coords(p)} for k,g in layers for p in polys(g)],'parking':{'outline':coords(lot),'access':coords(access),'stalls':stalls,'aisle':[[-110,-1007],[-110,-946]],'designAdaptation':True},'treeClearance':[coords(p) for p in polys(parking.union(p3).union(p2).union(p1.intersection(z1)).intersection(zone))]};(W/'finish41.json').write_text(json.dumps(spec,separators=(',',':')));(R/'reports/build41/ground-audit.json').write_text(json.dumps(meta['finish41'],indent=2));print('ground',meta['finish41'])
