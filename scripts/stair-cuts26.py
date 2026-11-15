from pathlib import Path
import json,shapely as S
from shapely.geometry import Polygon
R=Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());L=json.loads((R/'BUILD26-LIBRARY-SPEC.json').read_text());mapping={'far-stair-cut25':'far-stair25','rear23-stair-cut0':'pharmacy-near23','rear23-stair-cut1':'pharmacy-road23'};out=[]
for s in N['surfaces']:
 if s.get('id') not in mapping:out.append(s);continue
 prefix=mapping[s['id']];g=S.union_all([Polygon(q['p']) for q in L['surfaces'] if q['id'].startswith(prefix+'-')]);gs=[g] if g.geom_type=='Polygon' else g.geoms
 for i,p in enumerate(gs):out.append({**s,'id':s['id']+'-'+str(i),'outer':list(p.exterior.coords)[:-1],'holes':[list(r.coords)[:-1] for r in p.interiors],'source':'BUILD26 excavation restricted to actual stair and landing footprints; preserve upper road outside stairs'})
N['surfaces']=out;(R/'dist/data/walk.json').write_text(json.dumps(N,separators=(',',':')))
