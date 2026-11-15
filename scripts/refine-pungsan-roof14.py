# coding: utf-8
import json,math
from pathlib import Path
cp=Path('dist/data/campus.json');d=json.loads(cp.read_text());wp=Path('dist/data/walk.json');w=json.loads(wp.read_text())
b=next(b for b in d['buildings'] if b.get('pungsan13'));cfg=b['pungsan13'];c=cfg['center'];f=cfg['front'];u=[-f[1],f[0]]
def local(q):
 x=277.9+(q[0]-812)/4.2-c[0];z=-22.9-(q[1]-150)/4.2-c[1]
 return [round(x*u[0]+z*u[1],3),round(x*f[0]+z*f[1],3),q[2]]
cfg['roofRear14']=list(map(local,[[814,287,.4],[861,292,2.8],[902,280,6],[940,281,8.1],[965,290,8.8],[979,307,8.4]]))
cfg['roofLip14']=list(map(local,[[815,435,.4],[837,403,2.1],[875,375,5.8],[914,349,7.5],[949,326,8.6],[979,307,8.4]]))
cfg['tailOuter14']=list(map(local,[[815,435,.4],[830,480,1],[862,502,.6],[901,516,.3],[943,520,.15],[984,503,.1]]))
cfg['tailInner14']=list(map(local,[[836,437,1.8],[847,465,2.4],[888,492,1.8],[925,505,.5],[950,507,.15],[984,503,.1]]))
cfg['roofTrace14']={'source':'https://map.naver.com/p/search/서울대학교%20풍산마당?c=18.00,0,0,2,dh','scalePixelsPerMetre':4.2,'anchor':'roundabout center pixel 812,150 -> world 277.9,-22.9','heightBasis':'WITHWORKS 2014 completion photographs; all vertical dimensions estimated','date':'2026-11-12','limits':'roof-to-ground parallax and manually selected edge uncertainty; not a survey'}
w['pungsan13']=cfg;cp.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));wp.write_text(json.dumps(w,ensure_ascii=False,separators=(',',':')))
p=Path('dist/pungsan.js');s=p.read_text();start=s.index(' const roofRows=');end=s.index(' \n // Rounded roof lip',start)
s=s[:start]+''' const interpolate=(points,t)=>{const a=Math.min(points.length-2,Math.floor(t*(points.length-1))),k=t*(points.length-1)-a;return points[a].map((v,i)=>v*(1-k)+points[a+1][i]*k)};
 const roofRows=[];for(let j=0;j<=32;j++){const t=j/32,row=[];for(let i=0;i<=64;i++){const q=interpolate(cfg.roofRear14,i/64),r=interpolate(cfg.roofLip14,i/64);row.push(at(q[0]*(1-t)+r[0]*t,q[1]*(1-t)+r[1]*t,q[2]*(1-t)+r[2]*t+.5*Math.sin(Math.PI*t)));}roofRows.push(row);}surface('traced-asymmetric-shell',roofRows,silver);
 const tail=[[],[]];for(let i=0;i<=72;i++){const q=interpolate(cfg.tailOuter14,i/72),r=interpolate(cfg.tailInner14,i/72);tail[0].push(at(...q));tail[1].push(at(...r));}surface('traced-ground-reaching-tail',tail,silver);
''' +s[end:];p.write_text(s)
