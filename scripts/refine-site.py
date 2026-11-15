"""BUILD07: local building pads and conservative road-width corrections; metres.
Feather pads into original DEM, retain original outside 18m buffers. Not surveyed grades.
Run once against BUILD06 input; baseline stored for reproducible reruns.
"""
import json,pathlib,numpy as np,shapely,math
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
root=pathlib.Path(__file__).resolve().parents[1];folder=root/'dist/data'; baseline=root/'data-sources/walk-build06.json'
if not baseline.exists():baseline.write_bytes((folder/'walk.json').read_bytes())
nav=json.loads(baseline.read_text()); data=json.loads((folder/'campus.json').read_text());spec=json.loads((folder/'architecture.json').read_text())
data['buildings']=[b for b in data['buildings'] if b['id']!='vw/53'];data['stats']['buildings']=len(data['buildings']);nav['anchors'].pop('vw/53',None)
for b in data['buildings']:
 if b['id'] in ['567075029','567075030','1437075588','1511791907','1530313056','1530313057']:b['urban']=True
(folder/'campus.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
n=nav['terrain']['n'];x0,z0,x1,z1=nav['bounds'];original=np.array(nav['terrain']['values']).reshape(n,n);H=original.copy();xs=np.linspace(x0,x1,n);zs=np.linspace(z0,z1,n);X,Z=np.meshgrid(xs,zs);points=shapely.points(X.ravel(),Z.ravel());weights=np.zeros(n*n);targets=np.zeros(n*n);records=[]
def sample(x,z):
 u=np.clip((x-x0)/(x1-x0)*(n-1),0,n-1.0001);v=np.clip((z-z0)/(z1-z0)*(n-1),0,n-1.0001);i=int(u);j=int(v);a=u-i;b=v-j
 return float(original[j,i]*(1-a)*(1-b)+original[j,i+1]*a*(1-b)+original[j+1,i]*(1-a)*b+original[j+1,i+1]*a*b)
for b in data['buildings']:
 poly=shapely.make_valid(Polygon(b['p'],b.get('holes',[])))
 if poly.area<25:continue
 c=poly.centroid;s=spec.get(b['id'],{});datum=s.get('datumElevation',sample(*s.get('datumPoint',[c.x,c.y])))
 # Keep real 301 tower datum, gently terrace its southern low wing.
 if b['id']=='482207537':datum=210.0 # artistic correction of DEM canopy artifact; uncertainty ±8m
 feather=max(18,min(100,max(abs(sample(*q)-datum) for q in b['p'])*3));d=shapely.distance(points,poly); mask=d<feather;w=np.clip(1-d[mask]/feather,0,1);w=w*w*(3-2*w);w[d[mask]<2]=1
 target=np.full(mask.sum(),datum)
 if b['id']=='228476658':
  zz=Z.ravel()[mask];target=datum+np.clip((-zz-1020)/50,0,1)*14
 weights[mask]+=w;targets[mask]+=target*w
 records.append({'id':b['id'],'datum':round(datum,2),'featherMetres':round(feather,1),'method':'local pad with adaptive smooth feather; inferred, not surveyed'})
mask=weights>0;blend=np.minimum(weights[mask],1);H.ravel()[mask]=original.ravel()[mask]*(1-blend)+targets[mask]/weights[mask]*blend
nav['terrain']['values']=np.round(H.ravel(),3).tolist()
# Restore the short gap in the SAME OSM way after removing false obstacle vw/53.
pieces=[r for r in nav['roads'] if r['id']=='468202819']
if len(pieces)==2:
 a=pieces[0]['p'][-1];b=pieces[1]['p'][0]
 if ((a[0]-b[0])**2+(a[1]-b[1])**2)**.5<10:
  pieces[0]['p']+=pieces[1]['p'];nav['roads'].remove(pieces[1]);pieces[0]['width']=10.5;pieces[0]['widthSource']='Aug2026 Naver visible multi-lane gate approach; 10.5m estimate'
  ia=min(range(len(nav['points'])),key=lambda i:math.dist(nav['points'][i][:2],a));ib=min(range(len(nav['points'])),key=lambda i:math.dist(nav['points'][i][:2],b))
  if math.dist(nav['points'][ia][:2],a)<.1 and math.dist(nav['points'][ib][:2],b)<.1:nav['edges'].append([ia,ib])
# Extend real OSM approach centerlines into the existing northwest world bounds.
import xml.etree.ElementTree as ET,math
from shapely.geometry import box
xml=ET.parse(folder/'source.osm').getroot();nodes={n.attrib['id']:((float(n.attrib['lon'])-126.952)*111320*math.cos(math.radians(37.459)),(float(n.attrib['lat'])-37.459)*111320) for n in xml.findall('node')}
existing=unary_union([LineString(r['p']) for r in nav['roads']]).buffer(.01);region=box(-797,900,-350,1247)
for way in xml.findall('way'):
 t={v.attrib['k']:v.attrib['v'] for v in way.findall('tag')};kind=t.get('highway')
 if kind not in ['primary','secondary','tertiary','residential','service','footway'] or t.get('access') in ['private','no']:continue
 coords=[nodes[n.attrib['ref']] for n in way.findall('nd') if n.attrib['ref'] in nodes]
 if len(coords)<2:continue
 line=LineString(coords).intersection(region).difference(existing)
 for segment in shapely.get_parts(line):
  if segment.geom_type=='LineString' and segment.length>1:nav['roads'].append({'id':way.attrib['id']+'-outside','kind':kind,'category':'path' if kind=='footway' else 'road','width':2.4 if kind=='footway' else 6,'widthSource':'class estimate','layer':t.get('layer','0'),'p':list(segment.coords)})
for r in nav['roads']:
 if r.get('widthSource')=='OSM width' or r['id']=='468202819':continue
 widths={'service':6.0,'primary':12,'secondary':10,'footway':2.4,'path':2.0}
 if r['kind'] in widths:r['width']=max(r['width'],widths[r['kind']]);r['widthSource']='BUILD07 vehicle/pedestrian clearance estimate; not surveyed'
obstacles=unary_union([shapely.make_valid(Polygon(b['p'],b.get('holes',[]))) for b in data['buildings']]);plazas=[Polygon(s['outer'],s['holes']) for s in nav['surfaces'] if s['kind']=='plaza'];plazas.append(box(-70,-340,-15,-303));surfaces=[];covered=Polygon()
for kind in ['road','steps','path','plaza']:
 shapes=plazas if kind=='plaza' else [LineString(r['p']).buffer(r['width']/2,quad_segs=4) for r in nav['roads'] if r['category']==kind]
 merged=unary_union(shapes).difference(obstacles).difference(covered);covered=covered.union(merged)
 for p in shapely.get_parts(merged):
  if p.geom_type=='Polygon' and p.area>.05:surfaces.append({'kind':kind,'outer':list(p.exterior.coords),'holes':[list(h.coords) for h in p.interiors]})
nav['surfaces']=surfaces
for p in nav['points']:
 u=np.clip((p[0]-x0)/(x1-x0)*(n-1),0,n-1.00001);v=np.clip((p[1]-z0)/(z1-z0)*(n-1),0,n-1.00001);i=int(u);j=int(v);a=u-i;b=v-j
 p[2]=float(H[j,i]+a*(H[j,i+1]-H[j,i])+b*(H[j+1,i]-H[j,i]) if a+b<=1 else H[j+1,i+1]+(1-a)*(H[j+1,i]-H[j+1,i+1])+(1-b)*(H[j,i+1]-H[j+1,i+1]))
(folder/'walk.json').write_text(json.dumps(nav,ensure_ascii=False,separators=(',',':')))
(root/'PAD-AUDIT.json').write_text(json.dumps({'note':'Not a survey. Local terrain edited for playable foundations. 302 datum 210m ±8m inferred; 301 official tower datum 189.3m, south terrace +14m. Broad relief outside buffers unchanged.','pads':records,'maxChange':float(np.max(np.abs(H-original))),'roadBuildingOverlap':covered.intersection(obstacles).area},ensure_ascii=False,indent=2))
print(len(records),'pads; max change',np.max(np.abs(H-original)))
