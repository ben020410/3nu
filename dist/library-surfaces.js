/* Metric heights below are estimates; all connected surfaces share one datum. */
function prepareLibrary15(data,nav){const k=data.buildings.find(b=>b.id==='329398175'),b=data.buildings.find(b=>b.id==='148286730'),o=k.p[0],dx=k.p[1][0]-o[0],dz=k.p[1][1]-o[1],len=Math.hypot(dx,dz),u=[dx/len,dz/len],v=[-u[1],u[0]],p=(a,d)=>[o[0]+u[0]*a+v[0]*d,o[1]+u[1]*a+v[1]*d],base=b.siteDatum;
nav.library15={origin:o,u,v,base,rise:22,roof:b.p,stairs:[7,121],start:74,end:10,width:6};b.walkableRoof15=base+22;
k.collisionPolygons=[k.p,[p(-18,-12.5),p(4,-12.5),p(4,19.5),p(-18,19.5)]];k.h=44;b.h=22;
}
