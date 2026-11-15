import json,math,pathlib
R=pathlib.Path(__file__).resolve().parents[1];p=R/'dist/data/walk.json';N=json.loads(p.read_text());r=next(r for r in N['roads'] if r['id']=='1529465159-outside');P=N['points'];E=N['edges'];prev=None
for a,b in zip(r['p'],r['p'][1:]):
 for i in range(max(2,math.ceil(math.dist(a,b)/3))+1):
  count=max(2,math.ceil(math.dist(a,b)/3));t=i/count;q=[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t];ds=[math.dist(x[:2],q) for x in P];k=min(range(len(ds)),key=ds.__getitem__)
  if ds[k]>.02:k=len(P);P.append(q+[83.027094])
  if prev is not None and prev!=k:E.append([prev,k])
  prev=k
N['edges']=list({tuple(sorted(e)) for e in E});p.write_text(json.dumps(N,separators=(',',':')))
