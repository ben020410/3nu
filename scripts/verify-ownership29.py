"""Independent geometric ownership check (not a test of the counting implementation)."""
import json,pathlib,shapely as S
from shapely.geometry import Polygon
R=pathlib.Path(__file__).resolve().parents[1];n=json.loads((R/'dist/data/walk.json').read_text());l=n['precinct29']['library'];scope=Polygon(n['precinct29']['scope']['outer'])
def poly(q):return S.make_valid(Polygon(q.get('p',q.get('outer')),q.get('holes',[])))
def overlaps(items):
 out=[]
 for i,(q,g)in enumerate(items):
  for r,h in items[i+1:]:
   area=g.intersection(h).area
   if area>.001:out.append({'a':q['id'],'b':r['id'],'areaM2':area})
 return out
regions=[(q,poly(q).intersection(scope))for q in n['surfaces']if poly(q).intersects(scope)]
floors=[q for q in l['surfaces']if not q.get('steps')and q['owner']=='walkway'];floorOverlap=[]
for height in set(q['lo']for q in floors):floorOverlap+=overlaps([(q,poly(q))for q in floors if q['lo']==height])
groundOverlap=overlaps(regions)
report={'exclusiveGroundDomainOverlaps':groundOverlap,'sameHeightRenderedFloorOverlaps':floorOverlap,'groundFloorRemoval':len(json.loads((R/'BUILD29-CLEANUP.json').read_text())['removedLibraryGroundFloors']),'bridgeLevelM':l['levels']['thirdBridge'],'gardenLevelM':l['levels']['mainRoof'],'terrainValuesUnchanged':True,'passed':not groundOverlap and not floorOverlap}
import subprocess
old=json.loads(subprocess.check_output(['git','show','build28-before-cleanup29:dist/data/walk.json'],cwd=R));report['terrainValuesUnchanged']=n['terrain']==old['terrain'];assert report['terrainValuesUnchanged'];assert l['levels']['thirdBridge']!=l['levels']['mainRoof'];assert report['passed']
(R/'BUILD29-OWNERSHIP.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
