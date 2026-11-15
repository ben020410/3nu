#!/usr/bin/env python3
"""Deterministic BUILD34 local terrain/architecture edit plan (never writes runtime assets)."""
import json,math
from pathlib import Path
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]
N=json.loads((ROOT/'reports/build34/source-data/walk.json').read_text())
L=N['precinct29']['library']; base=L['base']; origin=L['origin']; u=L['u']; v=L['v']
def world(p): return [origin[0]+u[0]*p[0]+v[0]*p[1],origin[1]+u[1]*p[0]+v[1]*p[1]]
def poly(coords): return Polygon([world(p) for p in coords])
def geom(g): return {'outer':[[round(x,6),round(z,6)] for x,z in list(g.exterior.coords)[:-1]],'holes':[[[round(x,6),round(z,6)] for x,z in list(r.coords)[:-1]] for r in g.interiors]}
def ribbon(a,b,width):
    A=world(a);B=world(b);dx=B[0]-A[0];dz=B[1]-A[1];n=math.hypot(dx,dz);nx=-dz/n*width/2;nz=dx/n*width/2
    return Polygon([[A[0]+nx,A[1]+nz],[B[0]+nx,B[1]+nz],[B[0]-nx,B[1]-nz],[A[0]-nx,A[1]-nz]])
def flight(id,a,b,width):
    return {'id':id,'p':geom(ribbon(a,b,width))['outer'],'holes':[],'lo':a[2],'hi':b[2],'steps':math.ceil(abs(b[2]-a[2])/.18),'from':world(a),'to':world(b),'width':width,'owner':'stairs','category29':'stairs','source34':'adapted circulation / no surveyed dimensions'}
def line_profile(points,offset=0): return [[*world(p),round(base+p[2]+offset,6)] for p in points]
# Replace the previous 5 m wide, 8.8 m run / 7 m rise stair by two 10.77 m runs.
route=[[-60,-53,0,9],[-48,-48,0,7],[-44,-58,3.4,7],[-42.6,-61.5,3.4,7],[-38.6,-71.5,7,7],[-25,-65.3,7,8],[-21,-56,7,8]]
f1=flight('physics34-lower-flight',route[1],route[2],7)
f2=flight('physics34-upper-flight',route[3],route[4],7)
# Adjacent flights are parallel: one shared landing, no independent overlap plates.
landing=ribbon(route[2],route[3],7)
flat={'id':'physics34-mid-landing','p':geom(landing)['outer'],'holes':[],'lo':3.4,'hi':3.4,'steps':0,'from':None,'to':None,'owner':'walkway','category29':'walkway','source34':'shared landing between two stair flights'}
oldids=['pharmacy-road23-2','pharmacy-road23-4','floor29-0-walkway-0','floor29-3.4-walkway-0']
old=[s for s in L['surfaces'] if s['id'] in oldids]
oldpoly=unary_union([Polygon(s['p']) for s in old])
# The entire small stair landscape is regraded; no extra terrain or slab is added.
# A 7m central stair is supported by a continuous bank with a 4m shoulder.
core=LineString([world(p) for p in route]).buffer(4.5,cap_style=2,join_style=2)
shoulder=core.buffer(4,join_style=2)
# Trim at existing building boundaries. Building placement/shape is never modified.
D=json.loads((ROOT/'reports/build34/source-data/campus.json').read_text())
B=D.get('buildings',[])
if isinstance(B,dict): B=list(B.values())
solids=[]
for b in B:
    pts=b.get('points') or b.get('p') or b.get('polygon') or b.get('footprint')
    if pts and isinstance(pts[0],list):
        try:
            p=Polygon(pts)
            if p.is_valid:solids.append(p)
        except Exception:pass
if solids:
    solid=unary_union(solids);core=core.difference(solid);shoulder=shoulder.difference(solid)
# The rear paving is existing ground, deliberately distinct from annex roof and bridges.
rear=poly([[-29,-26],[153,-26],[153,-12.5],[-29,-12.5]])
rear_end=poly([[-60,-53],[-45,-58],[-24,-31],[-15,-27],[0,-27],[0,-12.5],[-24,-12.5],[-40,-35]])
# A source-owned floor must not be reshaped again by old road grading.
protect=[]
for p in N['groundProfiles32']:
    if p['id'].startswith('precinct29-') or p['id'].startswith('rear23-'):
        protect.append({'id':p['id'],**{k:p[k] for k in ('outer','holes') if k in p}})
# Explicit ownership domains, profile absolute m; profileLinear handles nearest segment.
areas=[]
for i,g in enumerate(shoulder.geoms if hasattr(shoulder,'geoms') else [shoulder]):
    if g.area>.01:areas.append({'id':f'physics34-ground-{i}',**geom(g),'heightProfile':line_profile(route,-.08),'profileMode':'nearest-segment','shoulder':4,'source':'BUILD34 adapted local circulation','confidence':'design-estimate'})
# Old ground profile fragments are retired. Broader fixed upper/low grades are masked
# only by the new ownership geometry, not deleted wholesale.
removeProfiles=[p['id'] for p in N['groundProfiles32'] if any(p['id'].startswith('precinct29-'+str(i)+'-') for i in (26,27,28,29))]
retiredCuts=[]
for c in N['precinct29']['renderCuts']:
    q=Polygon(c['outer'],c.get('holes',[]))
    if q.intersection(oldpoly).area/q.area>.95:retiredCuts.append(c)
# Rail removal is by actual old stair corridor, so unrelated rails survive.
railDomain=oldpoly.buffer(.75)
newrails=[]
for s in [f1,f2]:
    p=s['p'];a=s['from'];b=s['to']
    for j,k in ((0,1),(3,2)):
        # grade endpoints recorded separately; renderer uses height interpolation.
        newrails.append({'a':p[j],'b':p[k],'y':s['lo'],'toY34':s['hi'],'stairId34':s['id']})
plan={'version':34,'coordinateSystem':'existing local metres; y absolute except library lo/hi','libraryBase':base,
'librarySurfacesRemoveIds':oldids,'librarySurfacesAdd':[f1,flat,f2],
'routesReplace':{'pharmacy-road23':route},
'renderCutsRemove':retiredCuts,'renderCutsSubtract':[geom(g) for g in (oldpoly.geoms if hasattr(oldpoly,'geoms') else [oldpoly])],'renderCutsAdd':[geom(Polygon(s['p'])) for s in [f1,flat,f2]],
'groundProfilesRemoveIds':removeProfiles,'groundProfilesAdd':areas,
# Runtime contract: apply these after raw authored profiles and before ring33; exclude
# old roadGrades32 in protected authored floors. Never apply to bridge/roof floor selection.
 'terrainOverrides34':areas,'roadGradeExclusions34':protect+[geom(shoulder)],
'gradeAreas':[geom(shoulder),geom(oldpoly.buffer(4))]+protect,
'pavingOwnership':[{'id':'rear34-low-paving','kind':'plaza',**geom(rear),'groundY':base,'layer':'ground','source':'existing rear ground corridor / user-confirmed'}, {'id':'rear34-natural-approach','kind':'plaza',**geom(rear_end),'groundY':base,'layer':'ground','source':'existing natural-sciences lower approach / adapted'}, {'id':'physics34-access-paving','kind':'plaza',**geom(core),'heightProfile':line_profile(route,-.08),'layer':'ground','source':'adapted access around existing building footprints'}],
'roadSuppressionPolygons':[geom(rear),geom(rear_end),geom(shoulder)],
'railsRemoveDomains':[geom(railDomain)],'railsAdd':[],
'notes':['Existing stair renderer already creates graded side rails: do not duplicate railsAdd.','3F bridge floor remains +7; 5F rooftop garden remains +22; neither is terrain.','Physics stair design is an authorized adaptation, not surveyed geometry.','Retired renderCuts must be filled from new ground field; replace with new cuts, do not preserve both holes.','New profile takes precedence only within its polygon. Use smooth shoulder blending outside the core if necessary.'],
'walkTests':[{'id':'physics34-stairs','route':route,'bothDirections':True},{'id':'rear34-lower-passage','route':[[-24,-22,0,8],[12,-22,0,8],[72,-22,0,8],[140,-22,0,8]],'bothDirections':True}],
'summary':{'stairWidthM':7,'oldStairWidthM':5,'lowerRunM':math.dist(route[1][:2],route[2][:2]),'upperRunM':math.dist(route[3][:2],route[4][:2]),'landingLengthM':math.dist(route[2][:2],route[3][:2]),'riseM':7,'retiredStairAndSlabCount':len(old),'newStairAndLandingCount':3,'retiredHeightProfileCount':len(removeProfiles)}}
out=ROOT/'reports/build34/terrain34-plan.json';out.write_text(json.dumps(plan,ensure_ascii=False,indent=2))
print(out);print(json.dumps(plan['summary'],indent=2));print('grade bounds',shoulder.bounds,'rear',rear.bounds)
