from pathlib import Path
import json,numpy as np,shapely as S
from shapely.geometry import Polygon,Point,box
R=Path(__file__).resolve().parents[1];A=R.parent/'work/build39/before';B=R/'dist';W=R/'reports/build39'
n0=json.loads((A/'data/walk.json').read_text());n=json.loads((B/'data/walk.json').read_text());s=n['precinct29']['library'];o=np.array(s['origin']);u=np.array(s['u']);v=np.array(s['v']);base=s['base'];mask=S.union_all([Polygon(p['outer'],p.get('holes',[]))for p in n['acro39']['mask']]);p0=np.fromfile(A/'data/ground.bin',dtype='<f4');p1=np.fromfile(B/'data/ground.bin',dtype='<f4');i0=np.fromfile(A/'data/ground-indices.bin',dtype='<u4');i1=np.fromfile(B/'data/ground-indices.bin',dtype='<u4');m0=json.loads((A/'data/ground.json').read_text());m1=json.loads((B/'data/ground.json').read_text());unchanged=changed=0;legacyInside=0;newArea=0;sampleErrors=[];worst=[]
patches=[(Polygon(p['outer'],p.get('holes',[])),p)for p in n['acro39']['patches']];tree=S.STRtree([x[0]for x in patches]);
for c in m1['chunks']:
 ps=p1[c['offset']:c['offset']+c['count']*3].reshape(-1,3);ix=i1[c['indexOffset']:c['indexOffset']+c['indexCount']]
 if not c['kind'].startswith('acro'):
  old=next((q for q in m0['chunks']if(q['x'],q['z'],q['kind'])==(c['x'],c['z'],c['kind']) and np.array_equal(ps.reshape(-1),p0[q['offset']:q['offset']+q['count']*3]) and np.array_equal(ix,i0[q['indexOffset']:q['indexOffset']+q['indexCount']])),None)
  if old and np.array_equal(ps.reshape(-1),p0[old['offset']:old['offset']+old['count']*3]) and np.array_equal(ix,i0[old['indexOffset']:old['indexOffset']+old['indexCount']]):unchanged+=1;continue
  changed+=1
  for j in range(0,len(ix),3):legacyInside+=Polygon(ps[ix[j:j+3]][:,[0,2]]).intersection(mask).area
  continue
 for j in range(0,len(ix),3):
  t=ps[ix[j:j+3]];g=Polygon(t[:,[0,2]]);newArea+=g.area;q=t.mean(axis=0);point=Point(float(q[0]),float(q[2]));local=[np.dot(q[[0,2]]-o,u),np.dot(q[[0,2]]-o,v)]
  for k in tree.query(point):
   poly,p=patches[k]
   if p['visible'] and poly.covers(point):
    c0,c1,c2=p['plane39'];expected=base+local[0]*c0+local[1]*c1+c2;err=abs(float(q[1])-expected);sampleErrors.append(err);worst.append({'error':err,'point':q.tolist(),'area':g.area,'patch':p['id'],'plane':p['plane39']});break
files=['engineering35.js','engineering35-300.js','engineering35-301.js','engineering35-302.js','engineering35-303.js','engineering36.js','logo30136.js','ring-road33.js','render-quality.js','character.js','jump-core.js','flight-core.js','building-labels.js','student22.js','central-cluster.js','assets/snu-engineering-ui-original.png']
unchangedFiles={f:(A/f).read_bytes()==(B/f).read_bytes()for f in files};graph={k:n0[k]==n[k]for k in ['roads','points','edges','ring33']}
# Pairwise overlap is area-based; shared edges are intentional.
overlap=0
for i,(p,q)in enumerate(patches):
 for j in tree.query(p):
  if j>i:overlap+=p.intersection(patches[j][0]).area
out={'source':n['acro39']['sourceCommit'],'unchangedTerrainChunks':unchanged,'changedTerrainChunks':changed,'legacyInsideAreaM2':legacyInside,'newVisibleTerrainAreaM2':newArea,'patchOverlapM2':overlap,'heightSamples':len(sampleErrors),'maxRenderPhysicsErrorM':max(sampleErrors),'worst':sorted(worst,key=lambda q:-q['error'])[:10],'preservedFiles':unchangedFiles,'navigationAndRoadsUnchanged':graph,'levels':n['acro39']['levels']}
out['passed']=legacyInside<.02 and overlap<.001 and max(sampleErrors)<.003 and all(unchangedFiles.values()) and all(graph.values());(W/'geometry-audit.json').write_text(json.dumps(out,indent=2,default=lambda x:x.item()));print(json.dumps(out,indent=2,default=lambda x:x.item()))
