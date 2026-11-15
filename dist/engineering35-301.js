/* BUILD35 · 301. Relative design units, threshold z=0; world fit belongs to engineering35.js.
   Approved final-r1 silhouette and facade rules. No roads or shared circulation in this recipe. */
(function(root,factory){const recipe=factory();if(typeof module==='object'&&module.exports)module.exports=recipe;else(root.Engineering35Recipes||(root.Engineering35Recipes={}))['301']=recipe;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
return function engineering301(H){
 const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
 const box=(n,x0,y0,z0,x1,y1,z1,m)=>H.box(n,x0,y0,z0,x1,y1,z1,m);
 const beam=(n,a,b,w,m='frame')=>H.beam(n,a,b,w,m);
 const quad=(n,p,m)=>H.quad(n,p,m);
 function glassFace(n,a,b,z0,z1,cols,rows,mat='glass'){
  // Recessed panes, square-section mullions and deeper floor spandrels are real geometry.
  quad(n+'-pane',[[...a,z0],[...b,z0],[...b,z1],[...a,z1]],mat);
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=dy/len*.25,ny=-dx/len*.25;
  for(let j=0;j<=cols;j++){const t=j/cols,x=a[0]+dx*t+nx,y=a[1]+dy*t+ny;beam(n+'-mullion-'+j,[x,y,z0],[x,y,z1],.27);}
  for(let r=0;r<=rows;r++){const z=z0+(z1-z0)*r/rows;beam(n+'-transom-'+r,[a[0]+nx,a[1]+ny,z],[b[0]+nx,b[1]+ny,z],r%3===0?.36:.18);}
 }
 // Foundation follows the retained site datum, independently of the raised north entrance.
 // The existing west tower access remains a real open portal below the main tower shell.
 const groundZ=Number.isFinite(H.groundZ)?H.groundZ:-14.117647058823529;
 const foundationLo=Math.min(-3.4,groundZ-.4),sideZ=-10.588235294117647,sideY=344.11764705882354;
 const footing=(name,x0,y0,x1,y1,hi=-3)=>{box(name,x0,y0,foundationLo,x1,y1,hi,'darkStone');H.solid(name,rect(x0,y0,x1,y1),foundationLo,hi);};
 footing('301-podium-foundation',0,0,100,282);
 footing('301-tower-foundation-core',-6,282,100,400);
 footing('301-tower-foundation-west-north',100,282,106,338.2);
 footing('301-tower-foundation-west-south',100,350,106,400);
 // The floor and closed back make this a short vestibule, not an invented through-building route.
 footing('301-side-entry-subfloor',100,338.2,106,350,sideZ-.25);
 H.floor('301-side-entry-floor',rect(100,338.2,106,350),sideZ);
 H.slab('301-side-entry-finish',rect(100,338.2,106,350),sideZ-.25,sideZ,'paving');
 for(const yy of [338.2,350])beam('301-side-entry-jamb',[106.12,yy,sideZ],[106.12,yy,-3],.35,'metal');
 beam('301-side-entry-header',[106.12,338.2,-3.12],[106.12,350,-3.12],.35,'metal');
 H.anchor('sideEntry',[106,sideY,sideZ]);H.anchor('sideInside',[102.5,sideY,sideZ]);
 // Tower: projected chamfered end bays, recessed centre and two dark vertical cuts.
 const left=[[-6,285],[-3,282],[14,282],[14,400],[-6,400]];
 const right=[[86,282],[103,282],[106,285],[106,400],[86,400]];
 H.slab('301-tower-left',left,-3,190,'glass');
 H.slab('301-tower-right',right,-3,190,'glass');
 box('301-tower-central',16,285,-3,84,400,180,'glass');
 box('301-left-deep-shadow',14,283,-3,16,400,180,'glassDark');
 box('301-right-deep-shadow',84,283,-3,86,400,180,'glassDark');
 // Collision follows each authored volume; the recessed centre must not inherit end-tower height.
 H.solid('301-tower-left',left,-3,190);
 H.solid('301-tower-right',right,-3,190);
 H.solid('301-tower-centre',rect(16,285,84,400),-3,180);
 H.solid('301-tower-slot-left',rect(14,283,16,400),-3,180);
 H.solid('301-tower-slot-right',rect(84,283,86,400),-3,180);
 H.floor('301-left-front-chamfer-roof',[[-6,285],[-3,282],[14,282],[14,285]],190);
 H.floor('301-right-front-chamfer-roof',[[86,282],[103,282],[106,285],[86,285]],190);
 H.floor('301-left-slot-roof',rect(14,283,16,400),180);
 H.floor('301-right-slot-roof',rect(84,283,86,400),180);
 H.floor('301-central-roof-front-margin',rect(16,285,84,286),180);
 H.floor('301-central-roof-rear-margin',rect(16,399,84,400),180);
 glassFace('301-central-curtain',[16,284.88],[84,284.88],46,180,20,45);
 glassFace('301-left-curtain',[-3,281.88],[14,281.88],0,190,6,63);
 glassFace('301-right-curtain',[86,281.88],[103,281.88],0,190,6,63);
 glassFace('301-chamfer-left',[-6.08,284.92],[-3.08,281.92],0,190,1,63,'glassLight');
 glassFace('301-chamfer-right',[103.08,281.92],[106.08,284.92],0,190,1,63,'glassLight');
 glassFace('301-side-right',[106.12,285],[106.12,397],0,190,16,63);
 // Unverified rear/left use restrained structural bands without invented openings.
 glassFace('301-side-left',[-6.12,397],[-6.12,285],0,190,12,21,'glassDark');
 glassFace('301-rear',[106,400.12],[-6,400.12],0,180,16,20,'glassDark');
 for(const z of [153,168])box('301-dark-spandrel-'+z,16,284.52,z,84,284.83,z+3,'glassDark');
 for(const y of [315,360])box('301-side-recess-'+y,106.14,y,0,106.3,y+4,190,'glassDark');
 for(const [x0,x1] of [[-6,14],[86,106]]){
  box('301-end-roof-thickness',x0,285,189.8,x1,400,191,'metal');
  H.floor('301-end-roof-cap-'+x0,rect(x0,285,x1,400),191);
  beam('301-end-coping-front',[x0+3,282,190.5],[x1,282,190.5],.7,'concrete');
 }
 box('301-central-roof',16,286,179.5,84,399,180.4,'roof');
 H.floor('301-central-roof-cap',rect(16,286,84,399),180.4);
 // Open truss: light reaches through the bays; no white filled roof wall.
 for(const y of [282,286]){
  beam('301-truss-top',[14,y,190],[86,y,190],.9,'metal');
  beam('301-truss-bottom',[14,y,180],[86,y,180],.9,'metal');
  for(let i=0;i<10;i++){const x=14+72*i/10,nx=14+72*(i+1)/10;
   beam('301-truss-diagonal-'+i,[x,y,i%2?190:180],[nx,y,i%2?180:190],.9,'metal');
  }
 }
 for(let i=0;i<=10;i++){const x=14+7.2*i;beam('301-truss-depth',[x,282,190],[x,286,190],.7,'metal');}
 // Long low podium. The central arch has a real recess, rather than glass laid on a wall.
 box('301-podium-left',0,40,-3,42,282,46,'stone');
 box('301-podium-right',58,40,-3,100,282,46,'stone');
 box('301-podium-centre-back',42,47,-3,58,282,46,'stone');
 H.solid('301-podium-left',rect(0,40,42,282),-3,46);
 H.solid('301-podium-right',rect(58,40,100,282),-3,46);
 H.solid('301-podium-centre-back',rect(42,47,58,282),-3,46);
 // Ground-level glazed enclosure stays closed; its collider no longer fills above the sloped roof.
 H.solid('301-front-left-enclosure',rect(0,0,43,40),-3,6);
 H.solid('301-front-right-enclosure',rect(57,0,100,40),-3,6);
 H.floor('301-podium-central-roof',rect(42,47,58,282),46);
 box('301-low-roof-left',-.25,40,45.6,42,282,46.6,'concrete');
 box('301-low-roof-right',58,40,45.6,100.25,282,46.6,'concrete');
 H.floor('301-podium-left-roof-cap',rect(-.25,40,42,282),46.6);
 H.floor('301-podium-right-roof-cap',rect(58,40,100.25,282),46.6);
 // Grey front panels, with actual joint recess and thin edge returns.
 for(const [l,r] of [[0,42],[58,100]]){
  box('301-panel-shadow',l,39.6,29,r,40,46,'darkStone');
  const cols=Math.round((r-l)/(100/14));
  for(let i=0;i<cols;i++)for(let j=0;j<4;j++){
   const x0=l+(r-l)*i/cols+.11,x1=l+(r-l)*(i+1)/cols-.11;
   const z0=29+17*j/4+.11,z1=29+17*(j+1)/4-.11;
   box('301-grey-front-panel',x0,39.05,z0,x1,39.62,z1,'stone');
  }
  beam('301-panel-coping',[l,39.2,46.35],[r,39.2,46.35],.7,'concrete');
 }
 // Four right-side ribbons only. The unverified left side is intentionally neutral.
 for(const [z0,z1] of [[3,8],[13,18],[23,28],[33,38]]){
  box('301-ribbon-reveal',100.03,44,z0-.2,100.38,278,z1+.2,'frame');
  box('301-ribbon-glass',100.39,44.3,z0,100.49,277.7,z1,'glassDark');
  beam('301-ribbon-deep-sill',[100.52,44,z0-.22],[100.52,278,z0-.22],.5,'concrete');
  // Continuous bands are retained without asserting unverified individual window bays.
 }
 for(let y=46;y<=280;y+=14)beam('301-side-panel-joint',[100.12,y,39],[100.12,y,45.8],.12,'darkStone');
 // Glazed slope has frames projecting above the panes, an enclosing plinth, and internal ribs.
 function slope(n,x0,x1,zTop,cols){
  const y0=0,y1=39.8,z0=6,z1=zTop;
  H.slopeFloor(n+'-landing',rect(x0,y0,x1,y1),[(x0+x1)/2,y0],[(x0+x1)/2,y1],z0,z1,.3);
  for(let i=0;i<cols;i++){
   const a=x0+(x1-x0)*i/cols,b=x0+(x1-x0)*(i+1)/cols;
   quad(n+'-glass',[[a,y0,z0],[b,y0,z0],[b,y1,z1],[a,y1,z1]],'glassLight');
  }
  for(let i=0;i<=cols;i++){const x=x0+(x1-x0)*i/cols;beam(n+'-rib',[x,-.18,z0+.16],[x,y1-.18,z1+.16],.32,'frame');}
  for(let j=0;j<=5;j++){const t=j/5;beam(n+'-transom',[x0,y0+(y1-y0)*t-.12,z0+(z1-z0)*t+.16],[x1,y0+(y1-y0)*t-.12,z0+(z1-z0)*t+.16],.24,'frame');}
 }
 slope('301-left-sloped-glass',0,42,29,7);
 slope('301-right-sloped-glass',58,100,29,7);
 slope('301-central-sloped-glass',42,58,19,2);
 // The low clear facade is closed except for the central entrance portal.
 for(const [l,r]of [[0,43],[57,100]])glassFace('301-ground-glazing',[l,-.15],[r,-.15],.2,6,Math.max(1,Math.round((r-l)/5)),1,'glass');
 box('301-ground-left-plinth',0,-.2,-1,43,.4,.4,'darkStone');
 box('301-ground-right-plinth',57,-.2,-1,100,.4,.4,'darkStone');
 // End cheeks close the sloped enclosure, without filling the entrance.
 for(const x of [0,100]){
  quad('301-sloped-end-cheek',[[x,0,0],[x,40,0],[x,40,29],[x,0,6]],'stone');
  beam('301-sloped-edge',[x,0,6],[x,40,29],.55,'concrete');
 }
 // Narrow arched glass front. Behind it, a modest structural lattice is visible.
 const cx=50,r=8,yf=39.65,base=19,spring=46;
 quad('301-arch-vertical-glass',[[42,yf,base],[58,yf,base],[58,yf,spring],[42,yf,spring]],'glassClear');
 for(let i=0;i<12;i++){
  const t0=Math.PI*i/12,t1=Math.PI*(i+1)/12;
  const a=[cx+r*Math.cos(t0),yf,spring+r*Math.sin(t0)],b=[cx+r*Math.cos(t1),yf,spring+r*Math.sin(t1)];
  quad('301-arch-crown-pane',[[cx,yf,spring],a,b],'glassClear');
  beam('301-arch-crown-frame',a,b,.5,'frame');
  if(i%2===0)beam('301-arch-radial',[cx,yf-.15,spring],a,.22,'frame');
 }
 for(const x of [42,46,50,54,58]){
  const top=spring+Math.sqrt(Math.max(0,r*r-(x-cx)*(x-cx)));
  beam('301-arch-mullion',[x,yf-.15,base],[x,yf-.15,top],x===42||x===58?.5:.24,'frame');
 }
 for(let z=22;z<=46;z+=4)beam('301-arch-transom',[42,yf-.15,z],[58,yf-.15,z],.22,'frame');
 for(let z=20;z<45;z+=8)for(let x=42;x<58;x+=4){
  beam('301-arch-inner-diagonal',[x,42.6,z],[x+4,42.6,Math.min(z+8,46)],.16,'metal');
  beam('301-arch-inner-reverse',[x+4,42.6,z],[x,42.6,Math.min(z+8,46)],.16,'metal');
 }
 box('301-arch-recess-floor',42,40,18.4,58,47,19,'darkStone');
 H.floor('301-arch-recess-floor',rect(42,40,58,47),19);
 // Long barrel roof behind the arch: the narrow skylight preserves the true long podium.
 for(let j=0;j<12;j++){
  const a=Math.PI*j/12,b=Math.PI*(j+1)/12;
  quad('301-barrel-glass',[[cx+r*Math.cos(a),40,spring+r*Math.sin(a)],[cx+r*Math.cos(b),40,spring+r*Math.sin(b)],[cx+r*Math.cos(b),274,spring+r*Math.sin(b)],[cx+r*Math.cos(a),274,spring+r*Math.sin(a)]],'glass');
  const xa=cx+r*Math.cos(a),xb=cx+r*Math.cos(b),za=spring+r*Math.sin(a),zb=spring+r*Math.sin(b);
  H.slopeFloor('301-barrel-facet-'+j,[[xa,40],[xb,40],[xb,274],[xa,274]],[xa,150],[xb,150],za,zb,.3);
 }
 for(let y=40;y<=274;y+=18)for(let j=0;j<12;j++){
  const a=Math.PI*j/12,b=Math.PI*(j+1)/12;
  beam('301-barrel-rib',[cx+r*Math.cos(a),y,spring+r*Math.sin(a)+.2],[cx+r*Math.cos(b),y,spring+r*Math.sin(b)+.2],.26,'frame');
 }
 for(let j=0;j<=12;j+=3){const a=Math.PI*j/12;beam('301-barrel-longitudinal',[cx+r*Math.cos(a),40,spring+r*Math.sin(a)+.2],[cx+r*Math.cos(a),274,spring+r*Math.sin(a)+.2],.24,'frame');}
 // A small walkable vestibule. Solid rear closure avoids inventing a through-building route.
 H.slab('301-entry-threshold',rect(43,0,57,14),-.55,0,'paving');
 H.floor('301-entry-floor',rect(43,0,57,14),0);
 box('301-entry-left-return',42.5,0,0,43,14,8,'frame');
 box('301-entry-right-return',57,0,0,57.5,14,8,'frame');
 box('301-entry-back',43,14,0,57,14.5,8,'glassDark');
 H.solid('301-vestibule-back',rect(43,14,57,14.5),0,8.5);
 box('301-entry-soffit',43,0,8,57,14,8.5,'darkStone');
 H.floor('301-entry-soffit-roof',rect(43,0,57,14),8.5);
 for(const x of [43,57])beam('301-door-jamb',[x,-.24,0],[x,-.24,8],.48,'metal');
 beam('301-door-header',[43,-.24,8],[57,-.24,8],.5,'metal');
 // Clear side lights keep the central 5-design-unit portal open for walking.
 for(const [x0,x1]of [[43,47.4],[52.6,57]]){
  quad('301-door-sidelight',[[x0,0,.35],[x1,0,.35],[x1,0,7.7],[x0,0,7.7]],'glassClear');
  H.solid('301-door-sidelight',rect(x0,-.12,x1,.12),0,8);
  beam('301-door-mullion',[x1,-.12,.2],[x1,-.12,8],.18,'metal');
 }
 // Small pitched glass canopy, with slender posts outside the doorway.
 quad('301-canopy-left',[[40,-8,8.5],[50,-8,10.5],[50,0,10.5],[40,0,8.5]],'glassClear');
 quad('301-canopy-right',[[50,-8,10.5],[60,-8,8.5],[60,0,8.5],[50,0,10.5]],'glassClear');
 H.slopeFloor('301-canopy-left-roof',rect(40,-8,50,0),[40,-4],[50,-4],8.5,10.5,.25);
 H.slopeFloor('301-canopy-right-roof',rect(50,-8,60,0),[50,-4],[60,-4],10.5,8.5,.25);
 for(const y of [-8,-4,0])for(const [a,b]of [[[40,y,8.5],[50,y,10.5]],[[50,y,10.5],[60,y,8.5]]])beam('301-canopy-rafter',a,b,.27,'metal');
 for(const x of [40,50,60])beam('301-canopy-depth',[x,-8,x===50?10.5:8.5],[x,0,x===50?10.5:8.5],.28,'metal');
 for(const x of [40.6,59.4]){H.cylinder('301-canopy-post',x,-7.2,0,8.5,.18,'metal');H.solid('301-canopy-post',rect(x-.2,-7.4,x+.2,-7),0,8.5);}
 // BUILD36: decorative number removed only. Search/nameplate identity remains 301.
 // The verified ENGINEERING wall lettering is rendered by logo30136.js.
 H.anchor('wallLogo',[81,38.62,41]);
 H.anchor('entry',[50,0,0]);H.anchor('entryApproach',[50,-8,0]);H.anchor('entryInside',[50,9,0]);
 H.anchor('arch',[50,39.65,36]);H.anchor('roofTruss',[50,282,185]);
};
});
