"""BUILD27: exclusive ground boundaries; no new paths or changes to layered floors."""
import json, pathlib, shapely as S
from shapely.geometry import Polygon,Point,LineString
R=pathlib.Path(__file__).resolve().parents[1];p=R/'dist/data/walk.json';N=json.loads(p.read_text());D=json.loads((R/'dist/data/campus.json').read_text());build=S.union_all([S.make_valid(Polygon(b['p'])).buffer(.5) for b in D['buildings']]);changes=[]
# Round sharp convex paving edges at sub-metre scale without altering centreline widths.
for s in N['surfaces']:
 if not str(s.get('id','')).startswith('roads26-'):continue
 old=S.make_valid(Polygon(s['outer'],s.get('holes',[])))
 new=old.buffer(.35,quad_segs=4).buffer(-.35,quad_segs=4).difference(build)
 if new.geom_type!='Polygon':continue
 changes.append({'id':s['id'],'areaDelta':round(new.area-old.area,3)});s['outer']=list(new.exterior.coords)[:-1];s['holes']=[list(r.coords)[:-1] for r in new.interiors]
# Resolve small isolated grass holes inside existing paving only; no wide gardens/courtyards removed.
filled=[]
for s in N['surfaces']:
 if s['kind'] not in ['path','plaza','rearPaving']:continue
 holes=[]
 for h in s.get('holes',[]):
  g=Polygon(h)
  if g.area<8 and not g.intersects(build):filled.append({'surface':s.get('id'),'area':g.area})
  else:holes.append(h)
 s['holes']=holes
# Unknown dead ends remain in their original place. Small paved rest/turning aprons are design,
# explicitly not claims of observed destinations. Skip steps and steep/layered areas.
ends=json.loads((R/'BUILD26-ROAD-ENDS.json').read_text());aprons=[]
for e in ends['records']:
 if e['classification']!='unconfirmed endpoint retained':continue
 r=next((r for r in N['roads'] if r['id']==e['id'] and e['point'] in [r['p'][0],r['p'][-1]]),None)
 if not r or r['kind']=='steps':continue
 q=Point(e['point']);radius=max(1.8,min(4,r['width']*.7));g=q.buffer(radius,quad_segs=8).difference(build)
 if g.geom_type!='Polygon':continue
 if any(Polygon(s['outer']).intersects(g) for s in N['surfaces'] if s.get('groundY') is not None or s.get('heightProfile')):continue
 if any(Polygon(f['outer']).intersects(g) for f in N.get('facilities',[]) if f.get('kind')=='pond'):continue
 n={'id':'end27-'+str(len(aprons)),'kind':'path','outer':list(g.exterior.coords)[:-1],'holes':[],'source':'Designed small road-end apron; destination unconfirmed; existing ground retained'};N['surfaces'].append(n);aprons.append({'road':r['id'],'point':e['point'],'radius':radius})
p.write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
(R/'BUILD27-SPACE.json').write_text(json.dumps({'roundedJunctions':changes,'smallPavingHolesFilled':filled,'designedEndAprons':aprons,'newRoads':0,'buildingMoves':0,'heightChanges':0,'retained':'BUILD26 shared profiles, stair beds, multi-layer routes'},indent=2));print(len(changes),len(filled),len(aprons))
