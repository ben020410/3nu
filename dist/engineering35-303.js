/* BUILD35 / 303 Haedong Advanced Engineering Center.
 * Local axes: x front left→right, y front→rear, z up from plaza.
 * Design-fit units, NOT metres or a survey. Shared plaza and 301 stairs have
 * a separate owner and are deliberately absent from this recipe.
 */
(function(root,factory){const recipe=factory();if(typeof module==='object'&&module.exports)module.exports=recipe;else(root.Engineering35Recipes||(root.Engineering35Recipes={}))['303']=recipe;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
return function build303(H){
  const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  const box=(n,x0,y0,z0,x1,y1,z1,m)=>H.box('303-'+n,x0,y0,z0,x1,y1,z1,m);
  const solid=(n,x0,y0,z0,x1,y1,z1)=>H.solid('303-'+n,rect(x0,y0,x1,y1),z0,z1);
  const beam=(n,a,b,w,m)=>H.beam('303-'+n,a,b,w,m);
  // Faces are assembled around actual holes. The glazing sits 0.48 units
  // behind the cladding face, with a darker reveal and projecting sill.
  function facade(name,axis,face,start,end,bottom,top,windows,outward){
    const depth=.82;
    const block=(n,a,z0,b,z1,d0,d1,m)=>{
      if(b-a<.005||z1-z0<.005)return;
      const v0=face+outward*d0,v1=face+outward*d1;
      if(axis==='front')box(n,a,Math.min(v0,v1),z0,b,Math.max(v0,v1),z1,m);
      else box(n,Math.min(v0,v1),a,z0,Math.max(v0,v1),b,z1,m);
    };
    const levels=[...new Set([bottom,top,...windows.flatMap(w=>[w.z,w.z+w.h])])].filter(v=>v>=bottom&&v<=top).sort((a,b)=>a-b);
    for(let j=1;j<levels.length;j++){
      const z0=levels[j-1],z1=levels[j],mid=(z0+z1)/2;
      const holes=windows.filter(w=>w.z<mid&&w.z+w.h>mid).sort((a,b)=>a.c-b.c);
      let a=start;for(const w of holes){const lo=Math.max(start,w.c-w.w/2),hi=Math.min(end,w.c+w.w/2);block(name+'-panel',a,z0,lo,z1,-depth,0,'ivory');a=Math.max(a,hi);}block(name+'-panel',a,z0,end,z1,-depth,0,'ivory');
    }
    windows.forEach((w,i)=>{
      const a=w.c-w.w/2,b=w.c+w.w/2,z=w.z,t=z+w.h;
      block(name+'-glass-'+i,a+.11,z+.13,b-.11,t-.13,-.56,-.51,i%4===0?'glassLight':'glass');
      block(name+'-jambL',a,z,a+.16,t,-.78,.025,'darkStone');
      block(name+'-jambR',b-.16,z,b,t,-.78,.025,'darkStone');
      block(name+'-head',a,t-.14,b,t,-.78,.025,'frame');
      block(name+'-sill',a-.08,z-.14,b+.08,z+.10,-.78,.22,'stone');
      if(w.h>3)block(name+'-transom',a+.11,z+w.h*.73,b-.11,z+w.h*.73+.09,-.51,-.39,'frame');
      if(i%5===0&&w.h>3)block(name+'-interior-wood',a+.30,z+.20,a+.49,t-.2,-1.12,-.92,'timberLight');
    });
    // Restrained panel joints, unlike heavy stripes pasted across windows.
    for(let z=bottom+3;z<top;z+=5.0){
      let a=start;const holes=windows.filter(w=>z>w.z-.06&&z<w.z+w.h+.06).sort((a,b)=>a.c-b.c);
      for(const w of holes){block(name+'-joint',a,z,w.c-w.w/2-.05,z+.045,.006,.025,'stone');a=w.c+w.w/2+.05;}block(name+'-joint',a,z,end,z+.045,.006,.025,'stone');
    }
  }
  const windows=(centres,rows,w,h)=>rows.flatMap(z=>centres.map(c=>({c,z,w,h})));
  const Ac=[3,7,11,16,20,24],Ar=[12,22,32,42,52];
  const Bc=[66,73,80,87,94],Br=[22,33,44];
  // A: taller and shallower. The inset internal mass leaves deep window reveals.
  box('A-inner',.82,.82,8,26.18,43.18,61.4,'concrete');
  solid('A-occupied',0,0,-10,27,44,62);
  facade('A-front','front',0,0,27,8,62,windows(Ac,Ar,1.9,6.8),-1);
  facade('A-left','side',0,0,44,8,62,windows([5,12,19,26,33,40],Ar,2.1,6.8),-1);
  facade('A-rear','front',44,0,27,8,62,windows([5,12,20],Ar,1.65,6.3),1);
  box('A-court-wall',26.18,0,8,27,44,62,'ivory');
  box('A-basement',.7,.7,-10,26.3,43.3,-.35,'concrete');
  // Low glazed occupied storey, independent of the central entry void.
  box('A-lobby-core',2.3,3,0,24.5,41,8.2,'concrete');
  box('A-low-glass',.4,1.2,.12,26.6,1.32,7.9,'glassClear');
  for(let x=1;x<27;x+=3.25)box('A-low-mullion',x,1.0,0,x+.15,1.4,8,'frame');
  for(const x of [1.3,12.8,25.5])box('A-ground-column',x,.9,0,x+.55,2.4,8.2,'stone');
  box('A-roof-cap',-.25,-.25,61.8,27.25,44.25,62.55,'ivory');
  box('A-roof-inset',1.5,1.5,62.5,25.5,42.5,62.68,'roof');
  H.floor('303-A-roof-cap',rect(-.25,-.25,27.25,44.25),62.55);
  solid('A-roof-cap',-.25,-.25,61.8,27.25,44.25,62.55);
  H.floor('303-A-roof-inset',rect(1.5,1.5,25.5,42.5),62.68);
  solid('A-roof-inset',1.5,1.5,62.5,25.5,42.5,62.68);
  // B: lower and deeper, with a narrow occupied/recessed base, never a full piloti.
  box('B-inner',62.82,.82,8,98.15,53.18,54.4,'concrete');
  solid('B-upper',62,0,5,100,54,55);
  solid('B-low-occupied',62.8,1.2,-10,96.8,53.2,8);
  facade('B-front','front',0,62,100,8,55,[...windows(Bc,Br,2.5,7),...windows(Bc,[15],3.8,1.65)],-1);
  const sideCentres=[3,7.5,12,16.5,21,25.5,30,34.5,39,43.5,49];
  const sideWindows=[...windows(sideCentres,[33,44],2.15,7),...windows([3,7.5,12,34.5,39,43.5,49],[22],2.15,7),...windows([3,7.5,12,34.5,39,43.5,49],[15],2.5,1.55),{c:22.5,z:8,w:13,h:22}];
  facade('B-right','side',100,0,54,8,55,sideWindows,1);
  facade('B-rear','front',54,62,100,8,55,windows([67,76,85,94],[22,33,44],2,6.4),1);
  box('B-court-wall',62,0,8,62.82,54,55,'ivory');
  box('B-roof-cap',61.75,-.25,54.8,100.25,54.25,55.55,'ivory');
  box('B-roof-inset',63.5,1.5,55.5,98.5,52.5,55.68,'roof');
  H.floor('303-B-roof-cap',rect(61.75,-.25,100.25,54.25),55.55);
  solid('B-roof-cap',61.75,-.25,54.8,100.25,54.25,55.55);
  H.floor('303-B-roof-inset',rect(63.5,1.5,98.5,52.5),55.68);
  solid('B-roof-inset',63.5,1.5,55.5,98.5,52.5,55.68);
  box('B-low-core',64,3,0,96.5,51.5,8.2,'concrete');
  box('B-low-front',62.5,1.3,.15,99.1,1.44,7.85,'glassClear');
  for(let x=63;x<100;x+=3.8)box('B-low-front-mullion',x,1.1,0,x+.14,1.58,8.1,'frame');
  box('B-recess-glass',96.85,29,.15,97.02,48,5,'glassClear');
  box('B-recess-back',96.8,48,0,97.02,53.3,5,'glassDark');
  for(let y=29;y<=48;y+=3.8)box('B-recess-mullion',96.7,y,0,97.2,y+.14,5.1,'frame');
  // Large side glazing continues into the ground storey. A short internal depth
  // and timber structure make it different from a painted rectangle.
  box('B-side-glass',99.35,16,.15,99.5,29,30,'glassClear');
  for(let y=16;y<=29.01;y+=2.6)box('B-bay-mullion',99.18,y,0,99.62,y+.13,30,'frame');
  for(let z=8;z<=30;z+=5.5)box('B-bay-transom',99.18,16,z,99.62,29,z+.12,'frame');
  for(const y of [17,27.5])box('B-bay-timber',98.4,y,0,98.9,y+.55,29.6,'timber');
  for(const y of [30,52]){box('B-recess-support',98.9,y,0,99.6,y+.65,5.1,'stone');solid('B-recess-support',98.9,y,0,99.6,y+.65,5.1);}
  H.slab('303-B-floor',rect(62,0,100,54),-.6,0,'concrete');
  H.floor('303-B-recess-walk',rect(97,29,100,54),0);
  // C: an actual hollow atrium, glazed on the front and rear. Roof and internal
  // structure remain visible through transparent glass; no solid mass is here.
  H.slab('303-C-entry-floor',rect(27,0,62,48),-.8,0,'paving');
  H.floor('303-C-entry-floor',rect(27,-.05,62,48),0);
  solid('C-floor-structure',27,0,-.8,62,48,-.02);
  const door=[40.5,48.5],head=7.3;
  function centralGlass(name,y,z0,z1,front){
    const parts=front&&z0<head?[[27,door[0]],[door[1],62]]:[[27,62]];
    for(const [a,b]of parts)box(name,a,y-.06,z0,b,y+.06,z1,'glassClear');
  }
  centralGlass('C-front-glass-low',.10,0,head,true);
  centralGlass('C-front-glass-high',.10,head,57,true);
  centralGlass('C-rear-glass',47.8,0,64,false);
  // Glass colliders split around the clear portal; lintel blocks jumping through.
  solid('C-front-wall-left',27,-.08,0,door[0],.26,57);
  solid('C-front-wall-right',door[1],-.08,0,62,.26,57);
  solid('C-front-lintel',door[0],-.08,head,door[1],.26,57);
  solid('C-rear-wall',27,47.55,0,62,48,64);
  for(let x=27;x<=62.01;x+=3.5){const low=x>door[0]&&x<door[1]?head:0;box('C-front-mullion',x-.075,-.16,low,x+.075,.38,57.1,'frame');box('C-rear-mullion',x-.075,47.55,0,x+.075,48,64,'frame');}
  for(let z=0;z<=57.01;z+=4.75){
    const spans=z<head?[[27,door[0]],[door[1],62]]:[[27,62]];
    for(const [a,b]of spans)box('C-front-transom',a,-.15,z,b,.34,z+.13,'frame');
  }
  for(const x of door)box('C-door-jamb',x-.13,-.2,0,x+.13,.58,head,'metal');
  box('C-door-head',door[0]-.13,-.2,head,door[1]+.13,.58,head+.26,'metal');
  // Recessed inner entrance frame conveys the threshold without a glass barrier.
  for(const x of door)box('C-inner-entry-jamb',x-.12,2,0,x+.12,2.4,head,'timber');
  box('C-inner-entry-head',door[0],2,head,door[1],2.4,head+.35,'timber');
  // Timber is physically BEHIND the glass. The visible staggered columns, deep
  // beams, and a restrained set of braces are a design interpretation.
  for(const y of [4.4,20.8,39])for(const x of [30,58.5]){
    // A level column cap meets the lowest point of the sloped soffit across
    // its .96-unit depth; it must never protrude through the roof skin.
    const top=y<22?57.5+(y-.48+.7)*3.1/22.7-.7:68-(y+.48-21.8)*3.6/26.8-.75;
    box('C-timber-column',x-.48,y-.48,0,x+.48,y+.48,top,'timber');
    solid('C-timber-column',x-.48,y-.48,0,x+.48,y+.48,top);
  }
  for(const y of [5.4,21.8,39.5])for(const z of [10,21,32,43,54])beam('C-timber-crossbeam',[28.5,y,z],[60.5,y,z],.72,'timberLight');
  for(const x of [29.5,59.5])for(const z of [10,21,32,43,54])beam('C-timber-sidebeam',[x,4.4,z],[x,40.5,z],.64,'timber');
  beam('C-timber-diagonal-left',[30,5.2,0],[37.5,5.2,21],.95,'timber');
  beam('C-timber-diagonal-right',[58.5,5.2,0],[51,5.2,21],.95,'timber');
  beam('C-timber-diagonal-upper',[31,20.8,32],[41,20.8,54],.72,'timber');
  // Only perimeter floor edges, not complete slabs hiding the atrium structure.
  for(const z of [10,21,32,43]){
    H.slab('303-C-side-gallery-L',rect(27,8,30.2,44),z-.55,z,'concrete');
    H.slab('303-C-side-gallery-R',rect(58.8,8,62,44),z-.55,z,'concrete');
    H.slab('303-C-rear-gallery',rect(30.2,40,58.8,44),z-.55,z,'concrete');
    H.floor('303-C-side-gallery-L-'+z,rect(27,8,30.2,44),z);
    H.floor('303-C-side-gallery-R-'+z,rect(58.8,8,62,44),z);
    H.floor('303-C-rear-gallery-'+z,rect(30.2,40,58.8,44),z);
    solid('C-side-gallery-L-'+z,27,8,z-.55,30.2,44,z);
    solid('C-side-gallery-R-'+z,58.8,8,z-.55,62,44,z);
    solid('C-rear-gallery-'+z,30.2,40,z-.55,58.8,44,z);
    beam('C-gallery-wood-edge-L',[30.15,8,z-.25],[30.15,44,z-.25],.36,'timberLight');
    beam('C-gallery-wood-edge-R',[58.85,8,z-.25],[58.85,44,z-.25],.36,'timberLight');
  }
  // Simplified forum benches behind the public vestibule, with real side mass.
  for(let k=0;k<7;k++){
    const y=19+k*2.5,z=(k+1)*1.5;
    for(const [x0,x1]of [[31,40],[49,58]]){box('C-forum-seat',x0,y,0,x1,y+2.5,z,'concrete');box('C-forum-seat-edge',x0,y,z-.18,x1,y+.35,z,'timberLight');solid('C-forum-seat',x0,y,0,x1,y+2.5,z);}
  }
  H.stair('303-C-forum-step',[44.5,18],[44.5,36.5],8.7,0,10.5,48,'concrete');
  H.slab('303-C-forum-top',rect(40.15,36.5,48.85,40),10,10.5,'concrete');
  H.floor('303-C-forum-top',rect(40.15,36.5,48.85,40),10.5);
  solid('C-forum-top',40.15,36.5,10,48.85,40,10.5);
  // Continuous opaque roof, with a raised glazed clerestory. The shallow
  // sawtooth section is a conservative fit to photographs, not measured.
  function roofPanel(name,p,thickness){
    H.quad('303-'+name+'-top',p,'roof');
    H.quad('303-'+name+'-soffit',p.map(q=>[q[0],q[1],q[2]-thickness]).reverse(),'timberLight');
    for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4];H.quad('303-'+name+'-fascia',[a,b,[b[0],b[1],b[2]-thickness],[a[0],a[1],a[2]-thickness]],'metal');}
  }
  roofPanel('C-front-roof',[[26.5,-.7,57.5],[62.5,-.7,57.5],[62.5,22,60.6],[26.5,22,60.6]],.7);
  roofPanel('C-high-roof',[[26.5,21.8,68],[62.5,21.8,68],[62.5,48.6,64.4],[26.5,48.6,64.4]],.75);
  // Landing and ceiling support share the exact render roof-plane endpoints.
  // Thin, plane-aware support leaves the double-height atrium clear underneath.
  H.slopeFloor('303-C-front-roof',rect(26.5,-.7,62.5,22),[44.5,-.7],[44.5,22],57.5,60.6,.7);
  H.slopeFloor('303-C-high-roof',rect(26.5,21.8,62.5,48.6),[44.5,21.8],[44.5,48.6],68,64.4,.75);
  box('C-clerestory-glass',27,21.82,60.5,62,21.96,67.35,'glassClear');
  for(let x=27;x<=62.01;x+=3.5)box('C-clerestory-frame',x-.08,21.62,60.45,x+.08,22.1,67.6,'frame');
  box('C-clerestory-sill',27,21.58,60.35,62,22.15,60.7,'frame');
  box('C-clerestory-head',27,21.58,67.3,62,22.15,67.7,'frame');
  // Triangular roof side closures, all part of the atrium envelope.
  for(const x of [27,62]){
    H.quad('303-C-roof-cheek-front',[[x,0,57],[x,22,60],[x,22,60.6],[x,0,57.5]],'metal');
    H.quad('303-C-roof-cheek-rear',[[x,22,57],[x,48,57],[x,48,64.4],[x,22,68]],'glassClear');
  }
  for(let x=29;x<62;x+=4.5){beam('C-front-rafter',[x,0,56.65],[x,21.5,59.6],.52,'timber');beam('C-high-rafter',[x,22,67.0],[x,48,63.4],.6,'timber');}
  for(let x=27;x<=62;x+=5)beam('C-roof-seam-front',[x,-.6,57.55],[x,21.85,60.63],.07,'metal');
  for(let y=28;y<48;y+=7){const z=68-(y-21.8)*3.6/26.8;beam('C-roof-seam-rear',[26.7,y,z+.03],[62.3,y,z+.03],.07,'metal');}
  H.anchor('entry',[44.5,0,0]);
  H.anchor('vestibule',[44.5,10,0]);
  H.anchor('shared.E',[44.5,0,0]);
  H.anchor('right-recess',[98.4,38,0]);
  H.anchor('roof-high',[44.5,21.8,68]);
};
});
