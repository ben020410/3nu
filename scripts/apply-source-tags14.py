#!/usr/bin/env python3
"""Reconcile explicit local OSM tags, never derive heights from storeys.
--apply changes campus.json only; conflicting photo/architecture profiles retained.
Source assertions are not satellite verification or proof of current reality.
"""
import argparse,json,pathlib,re,xml.etree.ElementTree as ET,collections
p=argparse.ArgumentParser();p.add_argument('--root',type=pathlib.Path,default=pathlib.Path(__file__).resolve().parents[1]);p.add_argument('--apply',action='store_true');p.add_argument('--report',action='store_true');a=p.parse_args();r=a.root
cpath=r/'dist/data/campus.json';c=json.loads(cpath.read_text());profiles=json.loads((r/'dist/data/official-profiles.json').read_text());arch=json.loads((r/'dist/data/architecture.json').read_text());src={e.attrib['id']:{t.attrib['k']:t.attrib['v'] for t in e.findall('tag')} for e in ET.parse(r/'dist/data/source.osm').getroot() if e.tag=='way'}
def height(v):
 m=re.fullmatch(r'\s*(\d+(?:\.\d+)?)\s*(m|metres|meters|ft|feet)?\s*',v or '',re.I)
 return float(m[1])*(.3048 if (m[2] or '').lower() in ('ft','feet') else 1) if m else None
rows=[];counts=collections.Counter();protected={b['id']:[b.get(k) for k in ['p','holes','center','siteDatum']] for b in c['buildings']}
for b in c['buildings']:
 tags=src.get(b['id'],{});explicit={k:tags[k] for k in ['height','building:levels','roof:shape','building:part','amenity'] if k in tags}
 if not explicit:continue
 patch={'sourceAttributes14':{'tags':explicit,'source':'dist/data/source.osm','osmURL':'https://www.openstreetmap.org/way/'+b['id'],'status':'local-source-assertion; current imagery not verified'}}; conflicts=[];decisions=[]
 v=height(tags.get('height'))
 if v is not None and 0<v<300:
  patch['sourceHeightMeters14']=v
  if b['id'] not in arch and b['id'] not in profiles:
   patch.update(h=v,heightSource='Explicit OSM height='+tags['height']+'; local source.osm; not independently surveyed');decisions.append('explicit-height-applied')
  elif b.get('h')!=v:conflicts.append('explicit-height-vs-individual-model-retained')
 if 'building:levels' in tags:
  raw=tags['building:levels']; lv=float(raw) if re.fullmatch(r'\d+(\.\d+)?',raw) else None
  if lv is not None and lv>0:
   patch['sourceLevels14']=lv
   if b.get('levels')!=lv:
    if b.get('levels') is not None or b['id'] in arch or b['id'] in profiles:conflicts.append('OSM-storeys-vs-existing-levels-or-individual-profile; existing-value-retained-for-source-priority-review')
    else:patch['levels']=lv;decisions.append('explicit-storeys-applied-without-height-change')
  else:conflicts.append('zero-or-unparseable-storeys-not-rendered')
 if tags.get('roof:shape'):patch['sourceRoofShape14']=tags['roof:shape'];decisions.append('roof-shape-data-added-renderer-integration-required')
 if tags.get('building:part'):patch['sourceBuildingPart14']=tags['building:part']
 if tags.get('amenity'):patch['sourceAmenity14']=tags['amenity']
 delta={k:v for k,v in patch.items() if b.get(k)!=v};rows.append({'id':b['id'],'name':b['name'],'beforeHeight':b.get('h'),'beforeLevels':b.get('levels'),'sourceTags':explicit,'patch':patch,'changedKeys':list(delta),'conflicts':conflicts,'decisions':decisions});b.update(patch)
 counts.update(decisions);counts['conflicting-records']+=bool(conflicts);counts['changed-records']+=bool(delta)
assert protected=={b['id']:[b.get(k) for k in ['p','holes','center','siteDatum']] for b in c['buildings']}
report={'scope':'all current model IDs vs local OSM ways','modelsTotal':len(c['buildings']),'sourceTaggedModels':len(rows),'counts':dict(counts),'newSatelliteOrPhotoVerified':0,'heightPolicy':'Only explicit parseable OSM height; never levels multiplication; individual profiles retain priority; source is not ground truth.','rows':rows,'utilityPhotoSearch':{'queries':['site.snu.ac.kr 서울대학교 저류조 입구 사진','site.map.snu.ac.kr 공중화장실 정문 관악로 19'],'result':'No uniquely matching official photo found. Indoor campus toilet results excluded. Neither utility location inferred from unrelated toilet records.','targetIds':['605434649','1138174384']}}
if a.report:(r/'BUILD14-source-tags-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if a.apply:cpath.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['rows','utilityPhotoSearch']},ensure_ascii=False))
