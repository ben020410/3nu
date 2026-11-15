# coding:utf-8
import json
from pathlib import Path
cp=Path('dist/data/campus.json');d=json.loads(cp.read_text());by={b['id']:b for b in d['buildings']};b=by['439703636'];old=b['p'];pix=[[824,320],[882,317],[884,379],[825,382]]
b['p']=[[-173.233+(x-830)/4.2,-1002.891-(y-31)/4.2]for x,y in pix];b.update(h=11.2,levels=3,reviewModel='garage331',componentIds=['vw/189'])
b['heightSource']='11.2m photo-based estimate; three-floor use from official 2018 article, not surveyed';b['photoVerification14']={'observed':True,'url':'https://www.snu.ac.kr/webdata/boards/konews/img_20181101_005.jpg','date':'2018-11-01','features':'double-height open vehicle bay, pale upper wall, three unequal windows, side stairs','limits':'post-2018 facade changes unverified; rear unseen; stair width estimated','status':'implemented-awaiting-render-review'}
b['planVerification14']={'status':'current Naver satellite manual roof trace; anchor neighboring 332/330-label building southwest/northwest','scalePxPerMetre':4.2,'pixels':pix,'anchorPixel':[830,31],'anchorWorld':[-173.233,-1002.891],'before':old,'numberConflict':'Naver labels adjacent block330; local official identifies332. Kept existing official332, not resolved by proximity.'}
a=by['vw/189'];a['suppressedDuplicate14']=True;a['collisionPolygons']=[];a['supersededBy']='439703636';a['suppressionReason14']='Two overlapping footprints correspond to one visible current 331 building. Canonical geometry replaced from Naver trace; source row preserved.'
cp.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
p=Path('dist/app.js');s=p.read_text().replace('for(const b of data.buildings)if(officialProfiles',"data.buildings=data.buildings.filter(b=>!b.suppressedDuplicate14);\nfor(const b of data.buildings)if(officialProfiles");p.write_text(s)
p=Path('dist/review-buildings.js');s=p.read_text().replace("let u=kind==='lecture28'?","let u=kind==='garage331'?[0,1]:kind==='lecture28'?")
branch="""if(kind==='garage331'){
 const front=vmax,back=vmin,split=umin+(umax-umin)*.78;
 slab('rear-service-core',portion(umin,umax,back,front-5.5),base,datum+6.5,dark);slab('upper-office',p,datum+6.5,datum+11.2,white);
 for(const x of [umin+.3,split,umax-.3])bar('garage-pier',at(x-.3,front-.3),at(x+.3,front-.3),datum,6.5,.6,white);
 for(const [t,w]of [[.17,1.4],[.38,1.4],[.65,3.1]]){const x=umin+(umax-umin)*t;bar('upper-window',at(x-w/2,front+.1),at(x+w/2,front+.1),datum+8.3,1.5,.18,glass);}
 bar('garage-door-header',at(umin,front),at(umax,front),datum+5.8,.7,.6,white);
 // Side stair is represented within the current footprint; exact landing depth remains estimated.
 for(let j=0;j<18;j++){const y=j*.2,x=umax-2.1,d=back+1+j*.26;bar('side-stair',at(x,d),at(umax-.2,d),datum+y,.2,.3,metal);}top=datum+11.2;
 }else """
s=s.replace("if(kind==='lecture28'){",branch+"if(kind==='lecture28'){");p.write_text(s)
for p in [Path('dist/app.js'),Path('../../work/build14-before/dist/app.js')]:
 s=p.read_text().replace('const reviewViews={',"const reviewViews={'garage331':{eye:[-208,103,-1080],at:[-167,101,-1079]},'garage331-top':{eye:[-218.47,500,-1081.22],at:[-218.47,95,-1081.21],span:85.7142857},")
 p.write_text(s)
Path('BUILD14-331-trace.json').write_text(json.dumps({'canonical':b,'suppressedSource':a},ensure_ascii=False,indent=2))
