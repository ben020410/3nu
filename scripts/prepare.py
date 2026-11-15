"""Offline OSM + Skadi conversion. python3 scripts/prepare.py source.osm N37E126.hgt.gz"""
import xml.etree.ElementTree as E,json,math,sys,gzip,struct,pathlib
root=pathlib.Path(__file__).resolve().parents[1];r=E.parse(sys.argv[1]).getroot()
origin=[126.952,37.459]; sx=111320*math.cos(math.radians(origin[1]));sz=111320
nodes={n.get('id'):[round((float(n.get('lon'))-origin[0])*sx,2),round((float(n.get('lat'))-origin[1])*sz,2)]for n in r.findall('node')}
b=[];roads=[];counts={'height':0,'levels':0,'either':0};excluded=0
for w in r.findall('way'):
 t={a.get('k'):a.get('v')for a in w.findall('tag')};p=[nodes[a.get('ref')] for a in w.findall('nd') if a.get('ref') in nodes]
 if 'building'in t and len(p)>3 and p[0]==p[-1]:
  counts['height']+='height'in t;counts['levels']+='building:levels'in t;counts['either']+=('height'in t or 'building:levels'in t)
  try:h=float(t['height'].replace(' m',''));source='height'
  except (KeyError,ValueError):
   try:h=float(t['building:levels'])*3.3;source='levels × 3.3m'
   except (KeyError,ValueError):h=12;source='default 12m'
  b.append({'id':w.get('id'),'name':t.get('name','이름 미등록 건물'),'p':p[:-1],'h':h,'heightSource':source})
 if 'highway'in t and len(p)>1:
  if t.get('access')in ['private','no'] or t['highway']in ['trunk','trunk_link','construction']:excluded+=1;continue
  roads.append({'id':w.get('id'),'kind':t['highway'],'p':p})
n=101;bound=[-800,-1500,1100,1250];raw=gzip.open(sys.argv[2],'rb').read();dim=int(math.sqrt(len(raw)//2));vals=[]
for j in range(n):
 for i in range(n):
  x=bound[0]+(bound[2]-bound[0])*i/(n-1);z=bound[1]+(bound[3]-bound[1])*j/(n-1)
  lon=origin[0]+x/sx;lat=origin[1]+z/sz;col=round((lon-126)*(dim-1));row=round((38-lat)*(dim-1));v=struct.unpack_from('>h',raw,2*(row*dim+col))[0]
  if v==-32768:raise ValueError('DEM void')
  vals.append(v)
data={'origin':origin,'bounds':bound,'buildings':b,'roads':roads,'terrain':{'n':n,'values':vals},'stats':dict(buildings=len(b),roads=len(roads),excludedRoads=excluded,**counts),'attribution':'© OpenStreetMap contributors, ODbL 1.0; terrain: Mapzen / USGS'}
(root/'dist/data/campus.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print(data['stats'],'elevation',min(vals),max(vals),'HGT dimension',dim)
