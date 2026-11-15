import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
def world(q):return [round(-103.22+(q[0]-572)/4.2,3),round(-26.062-(q[1]-65)/4.2,3)]
p=root/'dist/data/campus.json';c=json.loads(p.read_text());b=next(b for b in c['buildings']if b['id']=='official-56-1')
b['p']=[world(q) for q in [[779,300],[945,356],[914,443],[759,382]]];b['trace14']={'reference':'build14-reference-56.png','scalePixelsPerMetre':4.2,'anchor':{'pixel':[572,65],'world':[-103.22,-26.062]},'checkedNeighbours':['23','22','56'],'status':'manual visible envelope; roof lean / base ambiguity remains'};b['terraceOffsets14']=[0,2.2,4.3,3.2,5.4,7.0];b['collisionPolygons']=[b['p']];p.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':')))
(root/'BUILD14-56-trace.json').write_text(json.dumps(b,ensure_ascii=False,indent=2))
