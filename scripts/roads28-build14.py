import json,copy
from pathlib import Path
from shapely.geometry import Polygon,LineString
cp=Path('dist/data/campus.json');c=json.loads(cp.read_text());wp=Path('dist/data/walk.json');w=json.loads(wp.read_text());foot=Polygon(next(b['p']for b in c['buildings']if b['id']=='167608115'));out=[];changes=[]
for r in w['roads']:
 if r['id'] not in ['167658427','456144029','456144030']:out.append(r);continue
 line=LineString(r['p']);cut=line.difference(foot.buffer(.65));parts=[cut]if cut.geom_type=='LineString' else [q for q in getattr(cut,'geoms',[])if q.geom_type=='LineString'];parts=[q for q in parts if q.length>1]
 for i,q in enumerate(parts):r2=copy.deepcopy(r);r2['p']=list(q.coords);r2['id']=r['id']+('-28-part'+str(i)if i else '');out.append(r2)
 changes.append({'id':r['id'],'beforeLength':line.length,'afterLength':sum(q.length for q in parts),'reason':'Current 28 rebuilt footprint occupies prior mapped walkway; retain only exterior parts; no automatic endpoint joins'})
w['roads']=out;before=len(w['edges']);w['edges']=[e for e in w['edges']if not LineString([w['points'][e[0]][:2],w['points'][e[1]][:2]]).intersects(foot.buffer(.7))];c['roads']=copy.deepcopy(out)
wp.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')));cp.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
Path('BUILD14-28-roads.json').write_text(json.dumps({'roads':changes,'removedGraphEdges':before-len(w['edges']),'surfaceNote':'Inside-building pavement hidden beneath footprint; no raised surface overlays added'},indent=2))
