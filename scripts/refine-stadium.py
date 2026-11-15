import json,pathlib,math
from shapely.geometry import Polygon,LineString
R=pathlib.Path(__file__).resolve().parents[1];N=json.loads((R/'dist/data/walk.json').read_text());f=next(f for f in N['facilities']if f['id']=='stadium');stadium=Polygon(f['outer']);pitch=Polygon(f['pitch']);rect=list(pitch.minimum_rotated_rectangle.exterior.coords);length,a,b=max((math.dist(rect[i],rect[i+1]),rect[i],rect[i+1])for i in range(4));ux=(b[0]-a[0])/length;uz=(b[1]-a[1])/length;cx,cz=pitch.centroid.coords[0];axis=LineString([(cx-42*ux,cz-42*uz),(cx+42*ux,cz+42*uz)]);inner=axis.buffer(37.2,quad_segs=48);outer=axis.buffer(46.96,quad_segs=48);f['trackLanes']=[list(axis.buffer(37.2+i*1.22,quad_segs=48).intersection(stadium).exterior.coords)for i in range(9)];f['trackNote']='공식 사진의 붉은 8레인 형태 반영. 레인 1.22m·곡률은 표준 규격을 적용한 추정; 외곽은 OSM 시설 경계 안으로 제한';out=[]
def emit(k,p):
 for q in ([p]if p.geom_type=='Polygon'else getattr(p,'geoms',[])):
  if q.geom_type=='Polygon'and q.area>.005:out.append(dict(kind=k,outer=list(q.exterior.coords)[:-1],holes=[list(h.coords)[:-1]for h in q.interiors]))
for s in N['surfaces']:emit(s['kind'],Polygon(s['outer'],s['holes']).difference(stadium))
emit('turf',inner.intersection(stadium));emit('track',outer.difference(inner).intersection(stadium));emit('sportApron',stadium.difference(outer));N['surfaces']=out;(R/'dist/data/walk.json').write_text(json.dumps(N,ensure_ascii=False,separators=(',',':')))
p=R/'scripts/build-ground.py';p.write_text(p.read_text().replace("'turf','plazaBand']","'turf','plazaBand','sportApron']"));p=R/'dist/ground-surface.js';p.write_text(p.read_text().replace('plazaBand:[153,152,143],','sportApron:[139,175,157],plazaBand:[153,152,143],'))
p=R/'dist/campus-facilities.js';s=p.read_text();a=s.index('  const center=f.outer.reduce');b=s.index('\n }',a);s=s[:a]+"  for(const ring of f.trackLanes||[])line('track-lane',ring,.045);"+s[b:];p.write_text(s)
