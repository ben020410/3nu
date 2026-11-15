"""Excavate under each ground stair flight to its own slope, not one deep rectangular pit."""
import json,pathlib
R=pathlib.Path(__file__).resolve().parents[1];p=R/'dist/data/walk.json';n=json.loads(p.read_text());L=json.loads((R/'BUILD26-LIBRARY-SPEC.json').read_text());mapping={'far-stair-cut25':'far-stair25','rear23-stair-cut0':'pharmacy-near23','rear23-stair-cut1':'pharmacy-road23'};out=[]
for s in n['surfaces']:
 key=next((k for k in mapping if s.get('id','').startswith(k)),None)
 if key:
  for q in L['surfaces']:
   if not q['id'].startswith(mapping[key]+'-'):continue
   a,b=q['from'],q['to'];out.append({'id':'stair-bed26-'+q['id'],'kind':s['kind'],'outer':q['p'],'holes':[],'heightProfile':[[*a,L['base']+q['lo']-.08],[*b,L['base']+q['hi']-.08]],'source':'Ground-connected stair bed follows flight and landing heights; rooftop stairs excluded'})
 else:out.append(s)
n['surfaces']=out;p.write_text(json.dumps(n,separators=(',',':')))
