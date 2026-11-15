"""Explicit public-field extraction. Never copy the review payload into dist."""
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else root.parent/'outputs/campus-zones-20261114-r3/plan-data.json'
plan=json.loads(source.read_text())
names='정문/수의대/경영대/법대·사회대/음대·미대/국제대/중앙광장/인문대/사범대/자연대/농생대/약대/아랫공대/공대연구단지/윗공대/버들골/기숙사/연구공원'.split('/')
assert [z['name'] for z in plan['zones']]==names
registry=json.loads((root/'dist/data/identities49.json').read_text())['approvedLabels']
assert {b['id'] for b in plan['rows']}=={b['id'] for b in registry},'Review IDs differ from current labels; review explicitly instead of guessing.'
payload={'zones':[{k:z[k] for k in ('name','color','label','polygons')} for z in plan['zones']],
         'assignments':{b['id']:b['zoneName'] for b in plan['rows']},
         'boundaries':plan['regionBoundaries'],'envelope':plan['mapEnvelope']}
assert set(payload['assignments'].values())==set(names)
text=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
for forbidden in ('batch','batchName','batches','active','treatment','status','reason','assignmentNote','previousZone','revisionNotes','P01','P17'):
 assert forbidden not in text,forbidden
(root/'dist/data/map-zones50.json').write_text(text)
print('Public r3 map: 18 zones, 227 assignments; internal review fields omitted.')
