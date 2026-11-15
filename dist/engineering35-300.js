/* BUILD35 · 300 유회진학술정보관. Local x=front right, y=rear, z=up.
 * W100 reference units; z=0 is F3 terrace, not site ground.
 * Authored from engineering-final-r1, not imported photographic geometry.
 * Terrain, roads, shared deck and 301 canopy are intentionally not generated here.
 */
(function(root,factory){
 const recipe=factory();
 if(typeof module==='object'&&module.exports)module.exports=recipe;
 else{root.Engineering35Recipes=root.Engineering35Recipes||{};root.Engineering35Recipes['300']=recipe;}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const G={"A":{"label":"세로 타일·유리 상부동","x":[0,100],"y":[0,85],"z":[13.5,60],"roof_lip":{"x":[4,96],"y":[3,82],"z":[60,60.7]},"feature_status":"photos and published west/south elevations","numeric_status":"relative drawing-derived approximation; not survey"},"B":{"label":"후퇴 유리층과 기둥 공간","x":[3,97],"y":[6,83],"z":[0,13.5],"front_columns_x":[4,28,52,76,96],"front_column_y":1.2,"column_radius":1.1,"column_segments":12,"feature_status":"KIRA03/06/07/08","numeric_status":"recess and individual column positions/count are simplified proposal"},"C1":{"label":"낮은 전면 테라스 / F1","walk_z":-25,"outline":[[-60,12],[45,12],[68,-30],[48,-54],[-60,-32]],"wood_edges":[2,3,4],"guard_top":-21.5,"fascia_bottom":-26.2,"source":"KIRA01/05/15, footprint inferred"},"C2":{"label":"중간 테라스 / F2","walk_z":-14,"outline":[[-52,37],[0,37],[0,85],[100,85],[100,35],[185,35],[195,20],[195,-86],[165,-89],[100,-40],[-42,-13.84],[-42,-8],[-52,-8]],"wood_edges":[7,8,9,10,12],"guard_openings":[{"edge":11,"t":[0,1],"reason":"E2 stair head; design assumption"}],"guard_top":-10.5,"fascia_bottom":-15.2,"source":"KIRA17 and photos; contour simplified with E2 stair notch, not a traced survey"},"C3":{"label":"상부 테라스 / F3","walk_z":0,"outline":[[-36,40],[0,40],[0,85],[100,85],[100,40],[177,40],[177,24],[188,21],[188,-24],[178,-24],[178,-73],[166,-75],[115,-50],[90,-23],[-36,-7]],"wood_edges":[7,9,10,11,12,13,14],"guard_top":3.5,"fascia_bottom":-1.2,"source":"KIRA18 approximate contour; open E1 stair edge is design assumption"},"low_enclosures":[{"id":"C-F2-envelope","outline":[[-30,34],[100,34],[175,20],[175,-58],[162,-65],[113,-43],[87,-17],[-30,-1]],"z":[-14,-1.2],"front_edges":[3,4,5,6,7],"status":"simplified facade envelope below C3; not room layout"},{"id":"C-F1-envelope","outline":[[-47,28],[64,28],[92,-30],[84,-34],[-47,-6]],"z":[-25,-15.2],"front_edges":[2,3,4],"status":"only visible left/front portion; buried right part left unresolved"},{"id":"C-B1-envelope","outline":[[-56,5],[36,5],[59,-29],[44,-47],[-56,-27]],"z":[-36,-26.2],"front_edges":[2,3,4],"status":"visible lower-front simplification; terrain clipping deferred"}],"D":{"label":"둥근 은회색 저층부","centre":[158,5],"radii":[28,21],"segments":32,"z":[0,18],"glazing_top":6.5,"feature_status":"KIRA01/03/18","numeric_status":"simplified ellipse; actual outline is not a perfect ellipse"},"E_garage":{"label":"낮은 전면 주차 개구부","x":[68,114],"y":[-66,-40],"z":[-26,-14],"opening_x":[76,106],"opening_z":[-26,-17],"recess":4,"status":"presence supported by KIRA01/15; size/position inferred"},"stairs":[{"id":"E1","label":"F2→F3 우측 자체 계단","lower":[183,-78,-14],"upper":[183,-24,0],"width":10,"riser_count":24,"landing_length":2,"slab_depth":0.8,"feature_status":"external terrace stair supported by photos; exact alignment inferred","release_status":"proposed internal interface; verify fit and pedestrian scale before building"},{"id":"E2","label":"F1→F2 낮은 전면 계단","lower":[-55,-26,-25],"upper":[-47,-8,-14],"width":8,"riser_count":20,"landing_length":2,"slab_depth":0.8,"feature_status":"multi-level stair presence supported by KIRA04/08; path is simplified proposal","release_status":"verify exact location before implementation"}],"facades":{"A_west":{"bay_edges":[0,5.05051,9.09091,15.15152,20.20203,24.24243,29.29294,35.35355,39.39395,44.44446,49.49497,53.53537,59.59598,64.64649,69.697,73.7374,79.79801,84.84852,88.88892,94.94953,100],"glass_fraction":[0.54,0.62,0.5,0.58,0.57,0.51,0.6,0.55,0.5,0.62,0.55,0.58,0.52,0.61,0.55,0.5,0.59,0.55,0.62,0.51],"pane_z":[13.5,18.667,23.833,29,34.167,39.333,44.5,49.667,54.833,60]},"A_south":{"bay_edges":[0,5.0,11.0,15.0,20.0,25.0,29.0,35.0,40.0,44.0,50.0,55.0,59.0,64.0,70.0,74.0,80.0,85],"glass_fraction":[0.55,0.5,0.6,0.56,0.51,0.62,0.54,0.57,0.5,0.58,0.6,0.51,0.56,0.59,0.5,0.62,0.54],"pane_z":[13.5,18.667,23.833,29,34.167,39.333,44.5,49.667,54.833,60]},"A_north":{"bay_edges":[0,5.0,9.0,15.0,20.0,25.0,31.0,35.0,40.0,46.0,50.0,55.0,60.0,64.0,70.0,75.0,79.0,85],"glass_fraction":[0.57,0.52,0.61,0.51,0.6,0.54,0.56,0.5,0.61,0.52,0.58,0.55,0.5,0.61,0.54,0.58,0.53],"pane_z":[13.5,18.667,23.833,29,34.167,39.333,44.5,49.667,54.833,60]},"A_east":{"mode":"neutral wall/glass placeholder","status":"unverified; no invented door or repeated west pattern"},"B_west":{"columns":20,"rows":3},"B_sides":{"columns":14,"rows":3},"C":{"mullion_spacing":5,"slat_spacing":0.8,"frame_width":0.14},"count_status":"all pane/bay counts are implementation estimates, NOT measured window or floor counts; A comprises three upper storeys"}};

 function recipe(H){
  const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  const lerp=(a,b,t)=>a.map((q,i)=>q+(b[i]-q)*t);
  const panel=(name,a,b,lo,hi,mat)=>H.quad(name,[[a[0],a[1],lo],[b[0],b[1],lo],[b[0],b[1],hi],[a[0],a[1],hi]],mat);
  const edgeSolid=(name,a,b,lo,hi,th=.42)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*th/2,ny=dx/l*th/2;H.solid(name,[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],lo,hi);};
  const ellipse=(cx,cy,rx,ry,n=32)=>Array.from({length:n},(_,i)=>[cx+rx*Math.cos(2*Math.PI*i/n),cy+ry*Math.sin(2*Math.PI*i/n)]);
  // A: separate vertical cladding strips and recessed glazing; nine panes are
  // window divisions across THREE upper floors, not nine added storeys.
  H.solid('A-upper-body',rect(0,0,100,85),13.5,60.15);
  H.box('A-soffit',0,0,13.15,100,85,13.5,'darkStone');
  H.box('A-roof-edge',0,0,59.7,100,85,60.15,'metal');
  H.box('A-recessed-roof',4,3,60.15,96,82,60.7,'roof');
  H.solid('A-roof-cap',rect(4,3,96,82),60.15,60.7);
  H.floor('A-roof-edge-landing',rect(0,0,100,85),60.15);
  H.floor('A-roof-cap-landing',rect(4,3,96,82),60.7);
  // Restrained rear elevation: no unsupported repeated front-window pattern.
  H.box('A-rear-wall',0,84.3,13.5,100,85,59.7,'stone');
  H.box('A-rear-central-panel',22,84.1,17,78,84.35,56.5,'glassDark');
  for(const z of [29,44.5])H.box('A-rear-floor-band',0,84.0,z-.35,100,85,z+.25,'metal');
  const stripFacade=(name,f,face)=>{
   const pos=(u,d,z)=>face==='front'?[u,d,z]:face==='north'?[d,u,z]:[100-d,u,z];
   const box=(n,u0,d0,z0,u1,d1,z1,mat)=>{const a=pos(u0,d0,z0),b=pos(u1,d1,z1);H.box(n,Math.min(a[0],b[0]),Math.min(a[1],b[1]),z0,Math.max(a[0],b[0]),Math.max(a[1],b[1]),z1,mat);};
   for(let i=0;i<f.bay_edges.length-1;i++){
    const a=f.bay_edges[i],b=f.bay_edges[i+1],glassW=(b-a)*f.glass_fraction[i],edge=b-glassW;
    box(name+'-tile-'+i,a,-.12,13.5,edge,.8,59.7,'stone');
    // Deep dark jambs and inset blue glass give parallax at close oblique angles.
    box(name+'-reveal-'+i,edge,.07,13.5,b,.56,59.7,'glassDark');
    for(let j=0;j<f.pane_z.length-1;j++){
     const lo=f.pane_z[j],hi=Math.min(59.7,f.pane_z[j+1]);
     box(name+'-pane-'+i+'-'+j,edge+.12,.01,lo+.12,b-.12,.09,hi-.12,'glass');
    }
    for(const u of [edge,b])box(name+'-jamb-'+i+'-'+u,u-.065,-.22,13.5,u+.065,.13,59.7,'frame');
    for(let j=1;j<f.pane_z.length-1;j++)box(name+'-transom-'+i+'-'+j,edge,-.15,f.pane_z[j]-.07,b,.14,f.pane_z[j]+.07,'frame');
    // The very shallow tile joints continue the cladding scale without creating
    // black stripes as prominent as the windows.
    for(const z of [21.25,29,36.75,44.5,52.25])box(name+'-tile-joint-'+i+'-'+z,a,-.14,z-.025,edge,-.10,z+.025,'metal');
   }
  };
  stripFacade('A-west',G.facades.A_west,'front');
  stripFacade('A-north',G.facades.A_north,'north');
  stripFacade('A-south',G.facades.A_south,'south');
  // B: real recessed glazing with a usable porch and open entrance bay.
  // C3 already owns the front floor; this rear rectangle fills only its notch.
  H.slab('B-rear-floor',rect(0,40,100,85),-.8,0,'paving');
  H.floor('B-lobby-floor',rect(3,6,97,83),0);
  H.floor('B-front-passage',rect(0,0,100,7),0);
  H.box('B-back-core',3,45,0,97,83,13.15,'darkStone');
  H.solid('B-back-core',rect(3,45,97,83),0,13.5);
  // Interior floor edges and columns are visible behind clear glass.
  for(const x of [28,52,76]){
   H.cylinder('B-interior-column-'+x,x,30,0,13.15,.8,'concrete');
   H.solid('B-interior-column-'+x,ellipse(x,30,.8,.8,16),0,13.15);
  }
  for(const y of [17,31,44])H.box('B-ceiling-beam-'+y,3,y,12.1,97,y+.5,12.8,'timberLight');
  H.box('B-entry-inner-header',58,9,7.7,72,10,8.2,'metal');
  for(const [name,a,b]of [['front-left',[3,6],[60,6]],['front-right',[68,6],[97,6]],['north',[3,6],[3,45]],['south',[97,6],[97,45]]]){
   panel('B-'+name+'-glazing',a,b,.15,13.0,'glassClear');
   edgeSolid('B-'+name+'-glass-collision',a,b,0,13.5,.3);
   const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(len/4.7));
   for(let i=0;i<=n;i++){const p=lerp(a,b,i/n);H.beam('B-'+name+'-mullion-'+i,[...p,0],[...p,13.15],.18,'frame');}
   for(const z of [4.5,9,13])H.beam('B-'+name+'-transom-'+z,[...a,z],[...b,z],.16,'frame');
  }
  panel('B-entry-head',[60,6],[68,6],8,13,'glassClear');
  edgeSolid('B-entry-head-solid',[60,6],[68,6],8,13.5,.3);
  H.beam('B-entry-jamb-L',[60,6,0],[60,6,8],.27,'metal');
  H.beam('B-entry-jamb-R',[68,6,0],[68,6,8],.27,'metal');
  H.beam('B-entry-head-frame',[60,6,8],[68,6,8],.3,'metal');
  for(const x of G.B.front_columns_x){H.cylinder('B-front-column-'+x,x,1.2,0,13.5,1.1,'darkStone');H.solid('B-front-column-'+x,ellipse(x,1.2,1.1,1.1,16),0,13.5);}
  // Distinct terrace shapes and levels retained from the delivered floor plan.
  for(const key of ['C1','C2','C3']){
   const t=G[key],z=t.walk_z;
   H.slab(key+'-terrace-slab',t.outline,z-1.2,z,'paving');
   H.floor(key+'-terrace-floor',t.outline,z);
   H.solid(key+'-terrace-slab-collision',t.outline,z-1.2,z);
   for(const i of t.wood_edges){
    // E1 arrives on edge7 of C3. E2 head is C2 edge11 (not in wood_edges).
    if(key==='C3'&&i===7)continue;
    const edgeA=t.outline[i],edgeB=t.outline[(i+1)%t.outline.length];
    // Ground-to-F1 access is cut into the actual front edge, centred on x=-55.
    // Both the timber screen and its guard collider share the same 8-unit gap.
    // The terrace slab is unchanged: its +0.12m world threshold needs no cover.
    const spans=key==='C1'&&i===3?[[0,99/108],[107/108,1]]:[[0,1]];
    spans.forEach(([from,to],part)=>{
     const a=lerp(edgeA,edgeB,from),b=lerp(edgeA,edgeB,to),len=Math.hypot(b[0]-a[0],b[1]-a[1]),tag=i+'-'+part;
     H.beam(key+'-fascia-base-'+tag,[...a,z-.7],[...b,z-.7],1.05,'timber');
     H.beam(key+'-timber-cap-'+tag,[...a,t.guard_top],[...b,t.guard_top],.28,'timberLight');
     const n=Math.ceil(len/.8);
     for(let j=0;j<=n;j++){const p=lerp(a,b,j/n);H.beam(key+'-slat-'+tag+'-'+j,[...p,t.fascia_bottom],[...p,t.guard_top],.25,'timber');}
     H.rail(key+'-edge-guard-'+tag,[...a,z],[...b,z]);
    });
   }
  }
  // Lower occupied volumes, not full-site blocks. Buried rear faces remain simple.
  // The glass strip is outside the inset opaque backing, with independent frames.
  for(const e of G.low_enclosures){
   const lo=e.z[0],hi=e.z[1],p=e.outline,c=p.reduce((r,v)=>[r[0]+v[0]/p.length,r[1]+v[1]/p.length],[0,0]);
   const inner=p.map(v=>[c[0]+(v[0]-c[0])*.985,c[1]+(v[1]-c[1])*.985]);
   H.slab(e.id+'-inner-shell',inner,lo,hi,'glassDark');H.solid(e.id+'-occupied',p,lo,hi);
   for(const i of e.front_edges){
    const a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/5),dx=b[0]-a[0],dy=b[1]-a[1];
    const out=[dy/len*.12,-dx/len*.12];
    const aa=[a[0]+out[0],a[1]+out[1]],bb=[b[0]+out[0],b[1]+out[1]];
    panel(e.id+'-glass-'+i,aa,bb,lo+.2,hi-.2,'glass');
    for(let j=0;j<=n;j++){const q=lerp(aa,bb,j/n);H.beam(e.id+'-jamb-'+i+'-'+j,[...q,lo],[...q,hi],.18,'frame');}
    for(const z of [lo,lo+(hi-lo)*.66,hi])H.beam(e.id+'-transom-'+i+'-'+z,[...aa,z],[...bb,z],.16,'metal');
   }
  }
  // D: independent elliptical pavilion; lower glass and thick silver upper drum.
  const dp=ellipse(158,5,28,21,32),dInset=ellipse(158,5,27.35,20.35,32);
  H.slab('D-pavilion-floor',dInset,-.6,0,'paving');H.floor('D-pavilion-floor',dInset,0);
  H.slab('D-upper-silver-drum',dp,6.5,18,'metal');H.solid('D-upper-drum',dp,6.5,18);
  H.slab('D-roof-cap',dp,18,18.5,'roof');
  H.solid('D-roof-cap',dp,18,18.5);H.floor('D-roof-landing',dp,18.5);
  // Entrance at the south-west-facing arc; no unsupported adjacent glass canopy.
  for(let i=0;i<32;i++){
   const a=dp[i],b=dp[(i+1)%32],door=(i===23||i===24);
   if(!door){panel('D-lower-glazing-'+i,a,b,.05,6.5,'glassClear');edgeSolid('D-glazing-solid-'+i,a,b,0,6.5,.3);}
   // Segments23/24 form one open pair of doors; do not leave a ghost post in it.
   if(i!==24)H.beam('D-lower-mullion-'+i,[...a,0],[...a,6.5],.18,'frame');
   H.beam('D-metal-seam-'+i,[a[0]*1.001-158*.001,a[1]*1.001-5*.001,6.6],[a[0]*1.001-158*.001,a[1]*1.001-5*.001,17.9],.1,'concrete');
   H.beam('D-glass-head-'+i,[...a,6.4],[...b,6.4],.18,'frame');
  }
  for(const x of [142,158,174])H.box('D-visible-inner-beam-'+x,x-.2,-10,5.6,x+.2,20,6.2,'timberLight');
  H.box('D-rear-occupied-core',145,10,0,171,22,6.5,'darkStone');H.solid('D-core',rect(145,10,171,22),0,6.5);
  // Garage is a short recessed portal, never a solid bounding box over its void.
  const garage=G.E_garage;
  for(const [name,x0,x1]of [['left',68,76],['right',106,114]]){H.box('garage-'+name,x0,-66,-26,x1,-40,-14,'timber');H.solid('garage-'+name,rect(x0,-66,x1,-40),-26,-14);}
  H.box('garage-header',76,-66,-17,106,-40,-14,'timber');H.solid('garage-header',rect(76,-66,106,-40),-17,-14);
  H.floor('garage-roof-landing',rect(68,-66,114,-40),-14);
  H.box('garage-rear',76,-41,-26,106,-40,-17,'darkStone');H.solid('garage-rear',rect(76,-41,106,-40),-26,-17);
  H.slab('garage-threshold',rect(76,-66,106,-41),-26.4,-26,'concrete');H.floor('garage-threshold',rect(76,-66,106,-41),-26);
  for(let x=68.6;x<114;x+=.8){const topOnly=x>76&&x<106;H.beam('garage-timber-slat-'+x,[x,-66.18,topOnly?-17:-26],[x,-66.18,-14],.23,'timberLight');}
  // Own terrace stairs. Helper enforces <=0.18m world risers for chosen scale.
  for(const st of G.stairs){
   H.stair(st.id+'-terrace-stair',st.lower.slice(0,2),st.upper.slice(0,2),st.width,st.lower[2],st.upper[2],st.riser_count,'concrete');
   const dx=st.upper[0]-st.lower[0],dy=st.upper[1]-st.lower[1],l=Math.hypot(dx,dy),nx=-dy/l*st.width/2,ny=dx/l*st.width/2;
   for(const s of[-1,1])H.rail(st.id+'-stair-rail-'+s,[st.lower[0]+nx*s,st.lower[1]+ny*s,st.lower[2]],[st.upper[0]+nx*s,st.upper[1]+ny*s,st.upper[2]]);
   H.anchor(st.id+'.lower',st.lower);H.anchor(st.id+'.upper',st.upper);
  }
  H.anchor('entry',[64,6,0]);H.anchor('entry.approach',[64,-4,0]);
  H.anchor('ground.approach',[-55,-37,H.groundZ]);H.anchor('terrace.F1.entry',[-55,-32,-25]);
  H.anchor('terrace.F3',[110,-15,0]);H.anchor('terrace.F2',[181,-79,-14]);H.anchor('terrace.F1',[-55,-27,-25]);
  H.anchor('pavilion.entry',[158,-16,0]);H.anchor('garage.entry',[91,-66,-26]);
 }
 recipe.designBounds={min:[-60,-89,-36],max:[195,85,60.7]};
 recipe.datum='F3 terrace; design values are implementation estimates, not metres';
 return recipe;
});
