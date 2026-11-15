"""Independent importer and road pipeline. No SMASH application code is reused.
Requires numpy, scipy, shapely. Input SMASH campus DATA is ODbL; see data-sources.
"""
import json, math, pathlib, collections, xml.etree.ElementTree as ET
import numpy as np
from scipy.ndimage import gaussian_filter
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union
ROOT=pathlib.Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'data-sources/campus-v3.json').read_text()); S=json.loads((ROOT/'data-sources/smash-campus.json').read_text())
ox,oz=D['origin'];sx=111320*math.cos(math.radians(oz));sz=111320
phi=math.radians(S['meta']['lat']);mx=111412.84*math.cos(phi)-93.5*math.cos(3*phi);mz=111132.92-559.82*math.cos(2*phi)+1.175*math.cos(4*phi)
def transform(p):return [round((S['meta']['lon']+p[0]/mx-ox)*sx,3),round((S['meta']['lat']-p[1]/mz-oz)*sz,3)]
old={b['id']:b for b in D['buildings']}; buildings=[];matched=[]
for b in S['buildings']:
 ident=b['id'].split('/')[-1] if b['id'].startswith('way/') else b['id']
 poly=Polygon([transform(p) for p in b['o']],[[transform(p) for p in h]for h in b['ho']]).buffer(0)
 if poly.geom_type!='Polygon':continue
 p=list(map(list,poly.exterior.coords))[:-1]
 item={'id':ident,'name':old.get(ident,{}).get('name') or b['n'] or '이름 미등록 건물','p':p,'holes':[list(map(list,h.coords))[:-1]for h in poly.interiors],'h':b['h'],'heightSource':'SMASH dataset: source/estimated height; not independently surveyed','roof':b.get('rc','#9aaba5'),'sourceId':b['id'],'source':'SMASH SNU campus data (ODbL); OSM / VWorld attribution per upstream','levels':b['lv']}
 if ident in old:
  op=Polygon(old[ident]['p']);matched.append({'id':ident,'centreShift':round(op.centroid.distance(poly.centroid),3),'oldArea':round(op.area,1),'newArea':round(poly.area,1)})
 buildings.append(item)
occupied=unary_union([Polygon(b['p'],b['holes'])for b in buildings]);retained=[];removed=[]
for b in D['buildings']:
 if b['id']in {x['id']for x in buildings}:continue
 p=Polygon(b['p']).buffer(0)
 if p.intersection(occupied).area/max(p.area,1)>.45:removed.append(b['id']);continue
 b['holes']=[];b['roof']='#91a49b';buildings.append(b);retained.append(b['id'])
D['buildings']=buildings
# Original OSM IDs retain authoritative way connectivity, access, area and layer tags.
R=ET.parse(ROOT/'dist/data/source.osm').getroot();nodes={n.get('id'):((float(n.get('lon'))-ox)*sx,(float(n.get('lat'))-oz)*sz)for n in R.findall('node')};ways={w.get('id'):w for w in R.findall('way')}
rel=next(r for r in R.findall('relation')if r.get('id')=='11917142')
from shapely.ops import linemerge
boundary=linemerge([LineString([nodes[n.get('ref')]for n in ways[m.get('ref')].findall('nd')])for m in rel.findall('member')if m.get('role')=='outer']);campus=Polygon(boundary)
clip=box(-797,-1497,1097,1247).intersection(campus.buffer(150))
obstacles=unary_union([Polygon(b['p'],b.get('holes',[])).buffer(0)for b in buildings])
def parts(g,kind):
 if g.is_empty:return []
 if g.geom_type==kind:return [g]
 return [p for x in getattr(g,'geoms',[])for p in parts(x,kind)]
widths={'primary':10,'secondary':9,'tertiary':8,'unclassified':6,'residential':6,'service':4.5,'living_street':5,'pedestrian':5,'footway':2,'path':1.6,'steps':2.2,'cycleway':2.5,'track':3}
roads=[];areas=[];excluded=[];duplicates=[];segments=set(); navpoints=[];navlookup={};edges=[];edgekeys=set(); layers=collections.Counter(); taggedWidths=0
# Only exact shared original OSM nodes join layer transitions. Generated crossings do not.
original_nodes=collections.defaultdict(list)
for ident,p in nodes.items():original_nodes[(round(p[0],3),round(p[1],3))].append(ident)
def node(p,layer):
 pos=(round(p[0],3),round(p[1],3));ids=original_nodes.get(pos,[]);key=('osm',ids[0]) if len(ids)==1 else (*pos,layer)
 if key not in navlookup:navlookup[key]=len(navpoints);navpoints.append(pos)
 return navlookup[key]
for ident,w in ways.items():
 t={v.get('k'):v.get('v')for v in w.findall('tag')};kind=t.get('highway')
 if kind not in widths:continue
 ps=[nodes[n.get('ref')]for n in w.findall('nd')if n.get('ref')in nodes]
 if len(ps)<2:continue
 if t.get('access')in ['private','no']or t.get('foot')=='no'or t.get('indoor')=='yes':excluded.append(ident);continue
 layer=t.get('layer','0')+':'+str(t.get('bridge','no'))+':'+str(t.get('tunnel','no'));layers[layer]+=1
 if t.get('area')=='yes' and len(ps)>3 and ps[0]==ps[-1]:
  area=Polygon(ps).buffer(0).intersection(clip).difference(obstacles);areas.extend(parts(area,'Polygon'));continue
 width=widths[kind]
 try:width=max(1,min(16,float(t['width'].replace(' m',''))));taggedWidths+=1
 except (KeyError,ValueError):pass
 category='steps'if kind=='steps'else 'path'if kind in ['footway','path','cycleway','track']else 'road'
 # Segment dedup is exact and topology-aware; nearby parallel ways are NEVER merged by distance.
 runs=[];current=[]
 for a,b in zip(ps,ps[1:]):
  key=(layer,tuple(sorted((tuple(round(x,3)for x in a),tuple(round(x,3)for x in b)))))
  if key in segments:
   duplicates.append(ident)
   if len(current)>1:runs.append(current)
   current=[];continue
  segments.add(key)
  if not current:current=[a]
  current.append(b)
 if len(current)>1:runs.append(current)
 for run in runs:
  for line in parts(LineString(run).intersection(clip).difference(obstacles.buffer(.5)),'LineString'):
   if line.length<.15:continue
   roads.append({'id':ident,'kind':kind,'category':category,'width':width,'widthSource':'OSM width'if 'width'in t else 'class estimate','layer':layer,'p':[[round(x,3),round(z,3)]for x,z in line.coords]})
   for a,b in zip(list(line.coords),list(line.coords)[1:]):
    n=max(1,math.ceil(math.dist(a,b)/5));prev=node(a,layer)
    for j in range(1,n+1):
     cur=node((a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n),layer);key=tuple(sorted((prev,cur)))
     if prev!=cur and key not in edgekeys:edges.append([prev,cur]);edgekeys.add(key)
     prev=cur
# True road surfaces: round buffered continuous lines; union before render; no overlapping strips.
surfaces=[];covered=Polygon();surfaceGroups={}
for category in ['road','steps','path','plaza']:
 shapes=[LineString(r['p']).buffer(r['width']/2,quad_segs=4,cap_style=1,join_style=1)for r in roads if r['category']==category] if category!='plaza'else areas
 merged=unary_union(shapes).difference(obstacles).difference(covered).buffer(0)
 surfaceGroups[category]=merged;covered=covered.union(merged)
 for poly in parts(merged,'Polygon'):
  if poly.area>.05:surfaces.append({'kind':category,'outer':[[round(x,3),round(z,3)]for x,z in poly.exterior.coords],'holes':[[[round(x,3),round(z,3)]for x,z in h.coords]for h in poly.interiors]})
# One terrain surface used by rendering, roads and feet; no nearest-road height switching.
n=401;xmin,zmin,xmax,zmax=D['bounds'];oldgrid=np.array(D['terrain']['values']).reshape(D['terrain']['n'],D['terrain']['n']);on=len(oldgrid)
xs=np.linspace(0,on-1,n);zs=np.linspace(0,on-1,n);u,v=np.meshgrid(xs,zs);i=np.minimum(u.astype(int),on-2);j=np.minimum(v.astype(int),on-2);a=u-i;b=v-j
H=(oldgrid[j,i]*(1-a)+oldgrid[j,i+1]*a)*(1-b)+(oldgrid[j+1,i]*(1-a)+oldgrid[j+1,i+1]*a)*b;H=gaussian_filter(H,1.4)
def height(x,z):
 u=np.clip((x-xmin)/(xmax-xmin)*(n-1),0,n-1.00001);v=np.clip((z-zmin)/(zmax-zmin)*(n-1),0,n-1.00001);i=int(u);j=int(v);a=u-i;b=v-j
 return H[j,i]+a*(H[j,i+1]-H[j,i])+b*(H[j+1,i]-H[j,i]) if a+b<=1 else H[j+1,i+1]+(1-a)*(H[j+1,i]-H[j+1,i+1])+(1-b)*(H[j,i+1]-H[j+1,i+1])
P=[[x,z,round(height(x,z),5)]for x,z in navpoints];adj=[[]for p in P]
for a,b in edges:adj[a].append(b);adj[b].append(a)
seen=set();comps=[]
for i in range(len(P)):
 if i in seen:continue
 todo=[i];seen.add(i);c=[]
 while todo:
  k=todo.pop();c.append(k)
  for q in adj[k]:
   if q not in seen:seen.add(q);todo.append(q)
 comps.append(c)
comps.sort(key=len,reverse=True);main=comps[0];anchors={}
for b in buildings:
 poly=Polygon(b['p'],b.get('holes',[]));anchors[b['id']]=min(main,key=lambda i:poly.distance(Point(P[i][:2])))
nav={'bounds':D['bounds'],'campusBoundary':list(boundary.coords),'points':P,'edges':edges,'anchors':anchors,'regions':[],'connectors':[],'terrain':{'n':n,'values':[round(float(x),3)for x in H.ravel()]},'roads':roads,'surfaces':surfaces,'source':'OSM topology, no proximity connectors; unified terrain surface'}
# Preserve named regional waypoints; waypoint postprocessor adds gate and extra POIs.
for ident,label in [('167609409','행정관'),('148286730','중앙도서관'),('228476658','제1공학관 301'),('482207537','제2공학관 302'),('482220682','관악학생생활관 901'),('439707875','연구공원'),('424324200','호암교수회관')]:
 if ident in anchors:nav['regions'].append({'id':ident,'name':label,'node':anchors[ident]})
D['stats']['buildings']=len(buildings);D['attribution']='© OpenStreetMap contributors (ODbL); SMASH SNU campus dataset; VWorld/MOLIT attribution per upstream; terrain Mapzen/USGS'
(ROOT/'dist/data/campus.json').write_text(json.dumps(D,ensure_ascii=False,separators=(',',':')))
(ROOT/'dist/data/walk.json').write_text(json.dumps(nav,ensure_ascii=False,separators=(',',':')))
report={'sourceBuildings':len(S['buildings']),'buildings':len(buildings),'matched':len(matched),'retainedOriginal':retained,'removedOverlappingOriginal':removed,'footprintComparison':matched,'roads':len(roads),'exactDuplicateSegmentsRemoved':len(duplicates),'areaHighways':len(areas),'proximityConnectors':0,'components':list(map(len,comps)),'taggedWidths':taggedWidths,'layers':dict(layers),'surfaceGroups':{k:round(v.area,2)for k,v in surfaceGroups.items()},'surfaceOverlapArea':sum(a.intersection(b).area for i,a in enumerate(surfaceGroups.values())for b in list(surfaceGroups.values())[i+1:]),'roadBuildingOverlapArea':covered.intersection(obstacles).area}
(ROOT/'REBUILD-REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print({k:v for k,v in report.items()if k not in ['footprintComparison','retainedOriginal','components']});print('components',list(map(len,comps))[:15])

# Final user-approved identity policy: never resurrect retired models/registrations.
if (ROOT/'sources/identities49/policy.json').exists():
 import subprocess
 subprocess.run(['node',str(ROOT/'scripts/apply-identities49.cjs')],check=True)
