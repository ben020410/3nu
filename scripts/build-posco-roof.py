import json,math,pathlib
from shapely.geometry import Polygon,box
from shapely import constrained_delaunay_triangles
R=pathlib.Path(__file__).resolve().parents[1];d=json.loads((R/'dist/data/campus.json').read_text());s=json.loads((R/'dist/data/official-profiles.json').read_text());b=next(b for b in d['buildings']if b.get('officialNumber')=='71-2');p=Polygon(b['p']);rect=list(p.minimum_rotated_rectangle.exterior.coords);edges=[(math.dist(rect[i],rect[i+1]),rect[i],rect[i+1])for i in range(4)];length,a,c=max(edges);ux=(c[0]-a[0])/length;uz=(c[1]-a[1])/length;cx,cz=p.centroid.coords[0];local=[((x-cx)*ux+(z-cz)*uz,-(x-cx)*uz+(z-cz)*ux)for x,z in b['p']];width=max(z for x,z in local)-min(z for x,z in local);zmid=(max(z for x,z in local)+min(z for x,z in local))/2
v=[];ind=[]
def roof(x,z):
 q=(-(x-cx)*uz+(z-cz)*ux-zmid)/(width/2);return 6.5+12*math.sqrt(max(0,1-q*q))
x0,z0,x1,z1=p.bounds
for x in range(math.floor(x0),math.ceil(x1),1):
 for z in range(math.floor(z0),math.ceil(z1),1):
  g=p.intersection(box(x,z,x+1,z+1))
  for t in constrained_delaunay_triangles(g).geoms:
   coords=list(t.exterior.coords)[:3];off=len(v)//3
   for px,pz in coords:v.extend([px,roof(px,pz),pz])
   ind.extend([off,off+1,off+2])
s[b['id']]={'number':'71-2','name':b['name'],'style':'barrel','height':18.5,'wall':'#b7c5c2','roofVertices':v,'roofIndices':ind,'endHeights':[roof(x,z)for x,z in b['p']],'axis':[ux,uz],'roofFrame':[cx,cz,ux,uz,zmid,width],'source':b['officialDetail'],'photo':b['officialPhoto'],'observed':'금속 타원 단면 지붕과 큰 유리 단부; OSM 외곽 안에 곡면 지붕 생성','heightStatus':'기단 6.5m·곡면 상승 12m는 사진 비율 추정; 측량값 아님','frontStatus':'세부 지붕 곡률·유리 프레임 수 미확정'};(R/'dist/data/official-profiles.json').write_text(json.dumps(s,ensure_ascii=False,separators=(',',':')));print(b['id'],len(v)//3)
