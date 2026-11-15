/* BUILD35 / 302. Local units are the final-r1 A-width=100 design units.
   All exact dimensions are implementation estimates, never field measurements.
   A ribbon wing, B curtain-wall tower, C recessed X bay, D internal connector,
   E inset ground enclosure. Shared circulation is deliberately not authored here. */
(function(root,factory){
  const recipe=factory();
  if(typeof module==='object'&&module.exports)module.exports=recipe;
  else (root.Engineering35Recipes||(root.Engineering35Recipes={} ))['302']=recipe;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  return function building302(H){
    const R=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    const box=(n,x0,y0,z0,x1,y1,z1,m)=>H.box(n,x0,y0,z0,x1,y1,z1,m);
    const solid=(n,x0,y0,z0,x1,y1,z1)=>H.solid(n,R(x0,y0,x1,y1),z0,z1);

    // A vertical facade runs along x with its front at y. Real frame depth and
    // a recessed pane separate glazing from the outer spandrel face.
    function westGlass(n,x0,x1,z0,z1,y,cols,rows,material='glass'){
      H.quad(n+'-pane',[[x0,y+.24,z0],[x1,y+.24,z0],[x1,y+.24,z1],[x0,y+.24,z1]],material);
      for(let c=0;c<=cols;c++){
        const x=x0+(x1-x0)*c/cols;
        box(n+'-mullion-'+c,x-.075,y-.08,z0,x+.075,y+.34,z1,'frame');
      }
      for(let r=0;r<=rows;r++){
        const z=z0+(z1-z0)*r/rows;
        box(n+'-transom-'+r,x0,y-.06,z-.065,x1,y+.32,z+.065,'frame');
      }
      box(n+'-sill',x0-.12,y-.3,z0-.14,x1+.12,y+.42,z0,'metal');
      box(n+'-lintel',x0-.12,y-.15,z1,x1+.12,y+.4,z1+.12,'metal');
    }
    // Side facade uses its own number of bays; front-side strips are not copied.
    function sideGlass(n,x,y0,y1,z0,z1,cols,rows,direction,material='glass'){
      const g=x-direction*.24,front=x+direction*.08;
      H.quad(n+'-pane',[[g,y0,z0],[g,y1,z0],[g,y1,z1],[g,y0,z1]],material);
      for(let c=0;c<=cols;c++){
        const y=y0+(y1-y0)*c/cols;
        box(n+'-mullion-'+c,Math.min(g-.1,front),y-.075,z0,Math.max(g+.1,front),y+.075,z1,'frame');
      }
      for(let r=0;r<=rows;r++){
        const z=z0+(z1-z0)*r/rows;
        box(n+'-transom-'+r,Math.min(g-.1,front),y0,z-.065,Math.max(g+.1,front),y1,z+.065,'frame');
      }
    }

    // Main masses keep the five-unit deep X recess genuinely empty in front.
    // The backing solids begin beyond the recessed panes, not at the glass.
    box('A-left-inner',1.35,1.25,7.74,34,63.17,40,'stone');
    box('A-right-inner',47,1.25,7.74,98.65,63.17,47.1,'stone');
    box('A-rear',1.35,5.5,7.74,98.65,64.52,40,'stone');
    box('A-upper-left-inner',18,1.25,40,34,64.52,47.1,'glassDark');
    box('A-upper-rear',18,5.5,40,98.65,64.52,47.1,'glassDark');
    box('A-south-end',98.65,0,7.74,100,64.52,47.1,'stone');
    // North face: its first 18 units are opaque, as in the field photograph.
    box('A-north-opaque-corner',0,0,7.74,1.35,18,40,'stone');
    box('A-north-rear-jamb',0,61,7.74,1.35,64.52,40,'stone');

    const segments=[[0,34,12],[47,100,19]], bands=[[10,14],[18,22],[26,30],[34,38]];
    const opaqueBands=[[7.74,10],[14,18],[22,26],[30,34],[38,40]];
    segments.forEach(([a,b,cols],s)=>{
      opaqueBands.forEach(([lo,hi],r)=>{
        box('A-west-spandrel-'+s+'-'+r,a,-.05,lo,b,1.4,hi,'stone');
        box('A-west-drip-'+s+'-'+r,a,-.22,hi-.13,b,.18,hi,'ivory');
        // Quiet panel joints give the grey bands a close-range scale.
        for(let x=a+4;x<b-.5;x+=4)box('A-panel-joint-'+s+'-'+r+'-'+x,x-.025,-.065,lo+.13,x+.025,.005,hi-.18,'darkStone');
      });
      bands.forEach(([lo,hi],r)=>westGlass('A-west-ribbon-'+s+'-'+r,a+.12,b-.12,lo+.1,hi-.1,.12,cols,2));
    });
    opaqueBands.forEach(([lo,hi],r)=>{
      box('A-north-spandrel-'+r,0,18,lo,1.4,61,hi,'stone');
      box('A-north-drip-'+r,-.18,18,hi-.13,.18,61,hi,'ivory');
    });
    bands.forEach(([lo,hi],r)=>sideGlass('A-north-ribbon-'+r,0,18.12,60.88,lo+.1,hi-.1,15,2,-1));

    // Raised upper glazing stays aligned with the same body, while the north
    // shoulder terminates at 40 rather than inheriting the higher roof.
    westGlass('A-upper-left',18.1,33.9,40.3,46.6,.12,6,4);
    westGlass('A-upper-right',47.1,99.85,40.3,46.6,.12,19,4);
    westGlass('A-upper-over-X',34,47,44.05,46.6,.12,4,2);
    sideGlass('A-upper-step-return',18,1.0,63.7,40.3,46.6,22,4,-1);
    box('A-upper-coping',17.8,-.3,46.65,100.3,64.82,47.1,'ivory');
    box('A-upper-roof-inset',18.6,.6,47.1,99.4,63.92,47.22,'roof');
    box('A-shoulder-roof',-.25,-.25,39.55,18,64.77,40,'ivory');
    box('A-shoulder-roof-inset',.6,.6,40,17.7,63.92,40.1,'roof');
    H.floor('A-shoulder-roof',R(0,0,18,64.52),40.1);
    H.floor('A-upper-roof',R(18,0,100,64.52),47.22);
    H.solid('A-occupied-main',[[0,0],[34,0],[34,5],[47,5],[47,0],[100,0],[100,64.52],[0,64.52]],7.74,40);
    solid('A-occupied-upper-left',18,0,40,34,64.52,47.22);
    solid('A-occupied-upper-right',47,0,40,100,64.52,47.22);
    solid('A-occupied-upper-rear',34,5,40,47,64.52,47.22);
    solid('A-upper-X-head',34,0,44,47,5,47.22);

    // C: three-dimensional recess and red steel frame stand apart from the
    // rear curtain wall. No intermediate slab crosses the visible X aperture.
    box('C-left-reveal',33.8,0,7.74,34.05,5.5,44,'darkStone');
    box('C-right-reveal',46.95,0,7.74,47.2,5.5,44,'darkStone');
    box('C-head-reveal',34,0,43.8,47,5.5,44.05,'darkStone');
    westGlass('C-deep-glazing',34.05,46.95,7.85,43.9,4.74,4,12,'glassDark');
    const xL=34.45,xR=46.55,zL=28.45,zH=43.55,yC=1.4;
    H.beam('C-X-frame-left',[xL,yC,zL],[xL,yC,zH],.9,'red');
    H.beam('C-X-frame-right',[xR,yC,zL],[xR,yC,zH],.9,'red');
    H.beam('C-X-frame-bottom',[xL,yC,zL],[xR,yC,zL],.9,'red');
    H.beam('C-X-frame-top',[xL,yC,zH],[xR,yC,zH],.9,'red');
    H.beam('C-red-diagonal-up',[xL+.45,yC-.08,zL+.45],[xR-.45,yC-.08,zH-.45],.85,'red');
    H.beam('C-red-diagonal-down',[xL+.45,yC-.08,zH-.45],[xR-.45,yC-.08,zL+.45],.85,'red');

    // B: a blue curtain wall on a visibly separate taller mass. A compact
    // interior core and slab edges sit behind the skin, avoiding fake external
    // brown/grey bars and an expensive full interior.
    box('B-core',121.15,7.25,-.75,164.33,67.55,63.55,'glassDark');
    const bx0=119.35,bx1=166.13,by0=4.84,by1=69.36,bh=64.03;
    const slots=[[132.9,134.2],[151.6,152.9]];
    // Front skin is divided around its two recessed vertical slits.
    const frontSegments=[[bx0,132.9],[134.2,151.6],[152.9,bx1]];
    frontSegments.forEach(([a,b],i)=>{
      H.quad('B-front-skin-'+i,[[a,by0+.24,0],[b,by0+.24,0],[b,by0+.24,bh],[a,by0+.24,bh]],'glass');
    });
    slots.forEach(([a,b],i)=>{
      box('B-slot-back-'+i,a,by0+1.18,7,b,by0+1.4,59,'glassDark');
      box('B-slot-left-'+i,a-.08,by0+.18,7,a+.08,by0+1.4,59,'metal');
      box('B-slot-right-'+i,b-.08,by0+.18,7,b+.08,by0+1.4,59,'metal');
      westGlass('B-slot-base-'+i,a,b,0,7,by0,1,3);
      westGlass('B-slot-head-'+i,a,b,59,bh,by0,1,2);
      for(const [aZ,bZ] of [[16,17],[31,32],[46,47]])box('B-slot-bridge-'+i+'-'+aZ,a,by0-.12,aZ,b,by0+1.42,bZ,'metal');
    });
    // Global 16 x 24 subdivision is coherent with the side 22 x 24 grids.
    for(let c=0;c<=16;c++){
      const x=bx0+(bx1-bx0)*c/16;
      if(slots.some(([a,b])=>x>a-.12&&x<b+.12))continue;
      box('B-front-mullion-'+c,x-.085,by0-.08,0,x+.085,by0+.45,bh,'frame');
    }
    for(let r=0;r<=24;r++){
      const z=bh*r/24;
      for(let i=0;i<frontSegments.length;i++){
        const [a,b]=frontSegments[i];box('B-front-transom-'+r+'-'+i,a,by0-.05,z-.065,b,by0+.41,z+.065,'frame');
      }
    }
    sideGlass('B-north-curtain',bx0,by0,by1,0,bh,22,24,-1);
    sideGlass('B-south-curtain',bx1,by0,by1,0,bh,22,24,1);
    box('B-east-neutral',bx0,by1-.55,0,bx1,by1,bh,'glassDark');
    for(let z=8;z<bh;z+=8)box('B-visible-floor-edge-'+z,bx0+.45,by0+.65,z-.2,bx1-.45,by1-.65,z,'darkStone');
    box('B-roof-cap',bx0-.2,by0-.2,bh-.4,bx1+.2,by1+.2,bh,'metal');
    box('B-roof-inset',bx0+.7,by0+.7,bh,bx1-.7,by1-.7,bh+.12,'roof');
    H.floor('B-roof',R(bx0,by0,bx1,by1),bh+.12);
    solid('B-occupied',bx0,by0,-2,bx1,by1,bh+.12);

    // D connects only A and B of 302 and remains deeply set back. The open
    // foreground between the masses is preserved at the original terrain.
    box('D-inner',100,21.8,1.61,119.35,48.39,36.65,'glassDark');
    westGlass('D-internal-recess',100,119.35,1.61,37.1,20.73,6,12,'glassDark');
    box('D-roof',99.9,20.87,36.65,119.45,48.49,37.1,'metal');
    solid('D-occupied',100,20.97,1.61,119.35,48.39,37.1);
    H.floor('D-roof',R(100,20.97,119.35,48.39),37.1);

    // E's unknown lower enclosure is conservative: no invented repeated
    // columns, and no collider spanning the full front setback. A short
    // walkable vestibule supplies the user's requested functional entry;
    // its exact position is explicitly recorded as a runtime estimate.
    box('E-left-core',1.61,9.68,-.65,31.5,62.9,7.74,'glassDark');
    box('E-right-core',39.5,9.68,-.65,98.39,62.9,7.74,'glassDark');
    box('E-entry-rear',31.5,18,-.65,39.5,62.9,7.74,'glassDark');
    box('E-entry-head',31.5,9.68,5.5,39.5,18,7.74,'darkStone');
    solid('E-left-core',1.61,9.68,-2,31.5,62.9,7.74);
    solid('E-right-core',39.5,9.68,-2,98.39,62.9,7.74);
    solid('E-entry-rear',31.5,18,-2,39.5,62.9,7.74);
    solid('E-entry-head',31.5,9.68,5.5,39.5,18,7.74);
    // Thin frame marks a real, unobstructed doorway; no glass plane or
    // collision box is drawn across this opening.
    box('E-entry-jamb-left',31.3,9.35,0,31.65,10.2,5.5,'metal');
    box('E-entry-jamb-right',39.35,9.35,0,39.7,10.2,5.5,'metal');
    box('E-entry-header',31.3,9.35,5.3,39.7,10.2,5.65,'metal');
    box('E-vestibule-floor',31.5,9.68,-.18,39.5,18,0,'paving');
    H.floor('E-vestibule',R(31.5,9.68,39.5,18),0);
    H.anchor('entry',[35.5,9.68,0]);
    H.anchor('entryInside',[35.5,15,0]);
    H.anchor('approach',[35.5,-2,0]);
    H.anchor('northApproach',[-3,9,0]);
    H.anchor('betweenMasses',[109.5,12,0]);
    H.anchor('X',[40.5,1.4,36]);
  };
});
