import json,pathlib
p=pathlib.Path('dist/data/official-profiles.json');P=json.loads(p.read_text());records=[]
brick={'30':'#c89a7e','33':'#bc987b','36':'#9e8c7e','37':'#9f8b7d','22':'#a58c76','23':'#ac9581','24':'#a89380','25':'#ac9681','27':'#a08b75','1':'#ad9986','2':'#ac9582','3':'#a99380','5':'#a48b76','7':'#a48a72','9':'#aa927d','10':'#ad9988','11':'#ac9179'}
for k,v in P.items():
 n=v['number']
 if n in brick:
  v.update(wall=brick[n],eaveDepth=.9,frameDepth=.48,windowRatio=.70,windowHeight=1.5,windowSill=.9,cornerPiers=True,shortBlankMax=7)
  records.append({'id':k,'number':n,'source':v['photo'],'observed':'white concrete frame and recessed windows, brick infill, projecting roof edge','implemented':'3D eaves, window recess/proportions, concrete frames and short wall separation','limits':'unseen sides and dimensions estimated; footprint retained'})
 if n=='31':v.update(wall='#e5e5df',eaveDepth=.8,windowRatio=.79,windowHeight=1.55,frameDepth=.4)
 if n=='8':v.update(wall='#baa48a',style='staggered',windowRatio=.43,windowHeight=2.6,windowSill=.25,windowSpacing=2.6,eaveDepth=.25)
 if n=='200':v.update(wall='#c9a180',eaveDepth=1.15,windowRatio=.56,windowHeight=1.65,windowSpacing=3.6,crownGlass=True)
 if n in ['130','133']:v.update(eaveDepth=.55,windowRatio=.92,windowHeight=2.15,windowSill=.6,frameDepth=.35)
 if n=='40':v.update(wall='#b39b83',style='shed',eaveDepth=.65,windowRatio=.55,windowHeight=1.4,windowSill=2.5,shortBlankMax=12)
 # Correct swapped source URL metadata with explicit official record, not guessed names.
 if n in ['36','37']:
  v['photo']='https://map.snu.ac.kr/api/upload/default/F_BUILD_00000'+('45' if n=='36' else '46')+'.jpg'
 for r in records:
  if r['id']==k:r['source']=v['photo']
for k,v in P.items():
 if v['number'] in ['31','8','200','130','133','40']:records.append({'id':k,'number':v['number'],'source':v['photo'],'implemented':'individual eave / facade / upper crown schedule','limits':'no new footprint survey; height retained; unseen elevations estimated'})
p.write_text(json.dumps(P,ensure_ascii=False,separators=(',',':')))
pathlib.Path('BUILD27-BUILDINGS.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
