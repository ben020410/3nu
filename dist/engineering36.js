/* BUILD36: replace the common structure, preserving all four BUILD35 exteriors.
 * 1 world unit = 1 m. Dimensions below are game design values, not site surveys. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engineering35.js'):root.Engineering35,typeof module==='object'&&module.exports?require('./vendor/earcut.js'):root.earcut);if(typeof module==='object'&&module.exports)module.exports=api;else root.Engineering36=api;})(typeof globalThis!=='undefined'?globalThis:this,(E,triangulate)=>{
'use strict';
const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
function prepare(data,nav){
 if(nav.engineering36)return nav.engineering36;
 const old=nav.engineering35||E.prepare(data,nav),S=nav.landmarks30,G=old.ground,T=old.deck;
 const retired={volumes:[],surfaces:[]};
 // The old common model also owns the remote 301/302 side-entry handrails.
 // Retain those exact pieces; retire only the deck district, by actual extent.
 const inDistrict=q=>q.building==='engineering-common35'&&q.p.some(p=>p[1]>-1040);
 for(const key of ['volumes','surfaces'])S[key]=S[key].filter(q=>{if(inDistrict(q)){retired[key].push(q.id);return false;}return true;});
 const shared=old.models.find(m=>m.number==='shared');
 if(shared){const keep=q=>{const p=q.a?[q.a,q.b]:q.p||[];return p.length&&p.every(p=>p[1]<-1040);};shared.geometry=shared.geometry.filter(keep);shared.volumes=shared.volumes.filter(q=>!inDistrict(q));}
 const outline=[[-25,-981],[-14,-986],[8.4,-974],[15.6,-974],[19,-964.5],[19,-948],[53,-948],[53,-940],[26,-940],[18.11803398875,-939.2360679775],[15.88196601125,-934.7639320225],[-5,-941],[-18,-945],[-18,-922.5],[-29,-922.5],[-29,-927.5],[-25,-927.5],[-25,-944]];
 const planters=[],rails=[],piers=[],stairSpecs=[];
 let model;
 model=E.collect('plaza36',H=>{
  function floor(name,p,y,thickness=.30,material='plazaStone'){
   H.slab(name,p,y-thickness,y,material);H.solid(name,p,y-thickness,y);
   H.anchor(name+'-level',[p[0][0],p[0][1],y]);
  }
  floor('continuous-plaza',outline,T);
  // Clip large paving modules to the authored perimeter; joints are an inset
  // material detail, not another deck slab or a physics patch over old geometry.
  function clip(p,axis,value,greater){const out=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],fa=a[axis]-value,fb=b[axis]-value,ia=greater?fa>=0:fa<=0,ib=greater?fb>=0:fb<=0;if(ia)out.push(a);if(ia!==ib){const t=fa/(fa-fb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
  const indices=triangulate(outline.flat(),null,2);
  for(let x=-32,i=0;x<56;x+=4,i++)for(let z=-988,j=0;z<-920;z+=3,j++){
   const tint=(i+j)%3===0?'plazaWarm':'plazaLight',joint=.035;
   const regions=[[x,z,x+joint,z+3,'plazaJoint'],[x+joint,z,x+4,z+joint,'plazaJoint']];
   if(j%5===0)regions.push([x+joint,z+joint,x+4,z+.48,'plazaBand'],[x+joint,z+.48,x+4,z+3,tint]);
   else regions.push([x+joint,z+joint,x+4,z+3,tint]);
   for(const [r,region]of regions.entries())for(let k=0;k<indices.length;k+=3){
    const [x0,z0,x1,z1,material]=region;let p=indices.slice(k,k+3).map(index=>outline[index]);
    for(const [axis,value,greater]of [[0,x0,true],[0,x1,false],[1,z0,true],[1,z1,false]])p=clip(p,axis,value,greater);
    if(p.length>=3)H.quad('paver-'+i+'-'+j+'-'+r+'-'+k,p.map(p=>[...p,T]),material);
   }
  }
  function rail(name,a,b){
   const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.19),h=1.10;
   H.beam(name+'-handrail',[a[0],a[1],a[2]+h],[b[0],b[1],b[2]+h],.085,'railBrown');
   H.beam(name+'-bottom',[a[0],a[1],a[2]+.12],[b[0],b[1],b[2]+.12],.055,'railBrown');
   for(let i=0;i<=n;i++){const p=a.map((v,k)=>v+(b[k]-v)*i/n);H.beam(name+'-vertical-'+i,[p[0],p[1],p[2]+.04],[p[0],p[1],p[2]+h],i%8===0?.075:.045,'railBrown');}
   const dx=b[0]-a[0],dz=b[1]-a[1],nx=-dz/len*.065,nz=dx/len*.065;
   const count=Math.ceil(len/.6);for(let i=0;i<count;i++){const u=i/count,v=(i+1)/count,aa=a.map((q,k)=>q+(b[k]-q)*u),bb=a.map((q,k)=>q+(b[k]-q)*v);H.solid(name+'-barrier-'+i,[[aa[0]+nx,aa[1]+nz],[aa[0]-nx,aa[1]-nz],[bb[0]-nx,bb[1]-nz],[bb[0]+nx,bb[1]+nz]],Math.min(aa[2],bb[2]),Math.max(aa[2],bb[2])+h);}
   rails.push({name,a,b,height:h});
  }
  // Open: stair head, building 301 threshold, 300 stair, 312 stair, 303 facade.
  const openEdges=new Set([2,4,5,9,14,17]);
  for(let i=0;i<outline.length;i++){
   const a=outline[i],b=outline[(i+1)%outline.length];
   if(!openEdges.has(i))rail('edge-rail-'+i,[...a,T],[...b,T]);
   // Slab edge fascia is above the structural underside; never lowers clearance.
   if(i!==17&&i!==5)H.beam('edge-fascia-'+i,[...a,T-.16],[...b,T-.16],.22,'plazaBand');
  }
  function stair(name,a,b,width,lo,hi){
   const steps=Math.ceil((hi-lo)/.16);H.stair(name,a,b,width,lo,hi,steps,'plazaLight');
   const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*width/2,nz=dx/l*width/2;
   for(const sign of [-1,1])rail(name+'-rail-'+sign,[a[0]+nx*sign,a[1]+nz*sign,lo],[b[0]+nx*sign,b[1]+nz*sign,hi]);
   stairSpecs.push({name,a,b,width,lo,hi,steps});
  }
  stair('main-lower-flight',[7,-1001],[7,-989],7.2,G,G+2.4);
  floor('turn-landing',rect(3.4,-989,15.6,-985),G+2.4,.32);
  rail('turn-outer-left',[3.4,-989,G+2.4],[3.4,-985,G+2.4]);
  rail('turn-back-left',[3.4,-985,G+2.4],[8.4,-985,G+2.4]);
  rail('turn-outer-right',[15.6,-989,G+2.4],[15.6,-985,G+2.4]);
  rail('turn-front-right',[10.6,-989,G+2.4],[15.6,-989,G+2.4]);
  stair('main-upper-flight',[12,-985],[12,-974],7.2,G+2.4,T);
  stair('300-shared-flight',[27,-932],[17,-937],5,G,T);
  stair('312-shared-flight',[-47,-925],[-29,-925],5,G,T);
  // Shallow steel/concrete edge girders: minimum underside T-.60 = road+4.20.
  // Columns remain outside the entire 15 m carriageway, not merely lane centres.
  for(const [i,[x,z]]of [[-14,-968],[10,-967],[-21,-931],[17,-942]].entries()){
   H.cylinder('pier-'+i,x,z,G-.08,T-.30,.45,'concrete');
   const p=Array.from({length:16},(_,j)=>[x+Math.cos(j*Math.PI/8)*.45,z+Math.sin(j*Math.PI/8)*.45]);H.solid('pier-'+i,p,G-.08,T-.30);piers.push({x,z,radius:.45,lo:G-.08,hi:T-.30});
   H.cylinder('pier-collar-'+i,x,z,T-.48,T-.30,.65,'plazaBand');
  }
  for(const [i,p]of [rect(-17,-968.35,14,-967.65),rect(-21.35,-941,-20.65,-926),rect(-18,-950.35,19,-949.65)].entries()){
   H.slab('shallow-girder-'+i,p,T-.60,T-.30,'darkStone');H.solid('shallow-girder-'+i,p,T-.60,T-.30);
  }
  function planter(name,x,z,w,d,tree){
   const p=rect(x-w/2,z-d/2,x+w/2,z+d/2);H.slab(name+'-body',p,T,T+.42,'plazaBand');H.solid(name+'-body',p,T,T+.42);
   H.slab(name+'-soil',rect(x-w/2+.16,z-d/2+.16,x+w/2-.16,z+d/2-.16),T+.42,T+.44,'soil36');
   for(let i=0;i<Math.floor(w/.7);i++)H.ellipsoid(name+'-shrub-'+i,[x-w/2+.45+i*.7,z,T+.65],[.48,.52,.34],i%2?'leaf36':'leafLight36');
   if(tree){H.cylinder(name+'-trunk',x,z,T+.44,T+3.6,.11,'timber');H.beam(name+'-branch',[x,z,T+2.3],[x+.65,z+.2,T+3.3],.10,'timber');H.ellipsoid(name+'-crown',[x,z,T+3.8],[1.25,1.1,1.45],'leafLight36');H.ellipsoid(name+'-crown-side',[x+.7,z+.15,T+3.6],[.85,.8,1.0],'leaf36');}
   planters.push({name,p,top:T+.42,treeCenter:tree?[x,T+3.8,z]:null,crownRadius:tree?1.55:0});
  }
  planter('west-garden',-20,-978,6,1.7,true);
  planter('north-garden',-11,-945.5,7,1.7,true);
  planter('east-garden',13.7,-955,5.4,1.7,true);
  planter('301-side-garden',45,-942.1,6,1.6,true);
  planter('303-side-garden',-21,-959,4.8,1.6,false);
 },{id:'engineering-common36',scale:1,origin:[0,0],u:[1,0],v:[0,1],datum:0});
 // The cell mesh is the actual top face, not a coplanar overlay on a slab.
 model.geometry.find(q=>q.name==='continuous-plaza').topFace=false;
 // A single authoritative support polygon; landings use their own exact surfaces.
 const flatNames=new Set(['continuous-plaza','turn-landing']);
 for(const q of model.geometry)if(q.kind==='slab'&&flatNames.has(q.name))model.surfaces.push({id:'eng36-'+q.name+'-surface',building:'engineering-common36',p:q.p,lo:q.hi,engineering35:true,engineering36:true});
 for(const q of [...model.volumes,...model.surfaces])q.engineering36=true;
 S.volumes.push(...model.volumes);S.surfaces.push(...model.surfaces);
 const route=(name,coords,startFeet,endFeet=startFeet)=>({name,coords,startFeet,endFeet});
 const entry301=old.anchors['301'],entry303=old.anchors['303'];
 const xy=p=>[p[0],p[2]];
 const state={build:36,models:[model],ground:G,deck:T,plazaOutline:outline,planters,rails,piers,stairs:stairSpecs,retired,
  assumptions:{units:'metres',surveyed:false,deckAboveRoad:T-G,slabThickness:.30,girderDepthBelowDeck:.60,minimumDesignClearance:4.20,handrailHeight:1.10},
  qaRoutes:[
   route('shared B stairs → 303 entry',[[7,-1003],[7,-1001],[7,-989],[7,-987],[12,-987],[12,-985],[12,-974],[12,-970],[-15,-966.75],xy(entry303.entry),xy(entry303.vestibule)],G,T),
   route('shared deck → 301 entry',[[12,-970],[8,-957],[14,-949],[24,-944.6],[36,-944.6],xy(entry301.entry),xy(entry301.entryInside)],T),
   route('300 retained shared access',[[29,-931],[27,-932],[17,-937],[14,-941],[7,-945],[0,-948]],G,T),
   route('312 retained shared access',[[-49,-925],[-47,-925],[-29,-925],[-21.5,-925],[-21.5,-954],[-16,-954]],G,T)
  ]};
 nav.engineering36=state;return state;
}
function build(B,scene,state){if(!state)return;const stats=E.build(B,scene,state);for(const m of scene.meshes)if(m.metadata?.facilityId==='engineering-common36')m.metadata.engineering36=true;return stats;}
return{prepare,build};
});
