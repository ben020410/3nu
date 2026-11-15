"""Photo-informed massing studies. Partition existing footprint; no placement edits."""
import json,pathlib
D=json.load(open('dist/data/campus.json'));P=json.load(open('dist/data/official-profiles.json'));records=json.load(open('BUILD27-BUILDINGS.json'))
for id,num,style,wall,rows,h,spacing in [('1530459898','32','frame','#b39b83',4,16,3.6),('231167704','16','punched','#ddd9d0',6,27.3,3.5),('162045723','43-1','glass','#e4e4de',4,21.4,2.7),('238935852','103','band','#d5cec0',4,21.2,3.4)]:
 b=next(b for b in D['buildings'] if b['id']==id)
 P[id]={'number':num,'name':b['name'],'rows':rows,'height':h,'style':style,'wall':wall,'floorHeights':[h/rows]*rows,'windowSpacing':spacing,'photo':b['officialPhoto'],'source':b['officialDetail'],'heightStatus':'Existing dataset height retained, not survey; photos reviewed BUILD27','eaveDepth':1.1,'frameDepth':.55,'windowRatio':.72,'windowHeight':1.8,'frontStatus':'Photo orientation and hidden elevations remain inferred'}
 if num=='43-1':P[id]['mass27']={'cut':-252,'axis':'z','highSide':'low','lowHeight':7.2,'raisedAt':7.2,'roof':'flat'}
 if num=='103':P[id]['mass27']={'cut':-163,'axis':'x','highSide':'low','lowHeight':7.6,'raisedAt':0,'roof':'hip','roofRise':3.2};P[id]['height']=14.8;P[id]['rows']=3;P[id]['floorHeights']=[5,4.9,4.9];P[id]['mass27']['lowHeight']=6.8;P[id]['heightStatus']='BUILD27 photo-informed estimated body14.8m + hip3.2m, not surveyed'
 records.append({'id':id,'number':num,'source':b['officialPhoto'],'observed':'43-1 raised pale upper block/recessed glazing; 103 taller roof and low entrance wing; 32 frame/brick;16 broad light wall with smaller windows','implemented':'dedicated height partitions for43-1/103, original outline retained; others individualized facade','limits':'partition orientation/extent inferred, no aerial confirmation; cannot mark precise reconstruction complete'})
pathlib.Path('dist/data/official-profiles.json').write_text(json.dumps(P,ensure_ascii=False,separators=(',',':')))
pathlib.Path('BUILD27-BUILDINGS.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
