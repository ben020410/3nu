/* Collision and persisted/wire species identifiers remain independent of the visual rig. */
function createWalker15(B,scene,shared=null){
  const player=new B.Mesh('walker',scene);player.ellipsoid=new B.Vector3(.42,.9,.42);
  player.isPickable=false;player.metadata={renderRole99:'actor'};
  const visual=new B.TransformNode('player appearance',scene);visual.parent=player;visual.position.y=-.95;
  const clothes=createCastClothes126(B,scene);
  let kind,body,look=CharacterStyle125.normalize({}),clock=0,visible=1,lastPost='',worn=null;
  const hands={};
  function syncWear(){
    if(!body)return;
    if(worn&&(worn.metadata.wear!==look.wear||worn.metadata.kind!==kind)){worn.dispose(false,false);worn=null;}
    if(look.wear==='none')return;
    if(!worn){
      worn=clothes.garment(kind,look.wear);worn.metadata={...worn.metadata,wear:look.wear,kind};
      if(look.wear==='cap'){
        worn.parent=body.get('Head');
        if(kind==='cat'){worn.scaling.set(.81,.94,.90);worn.position.set(0,.295,-.008);}
        else if(kind==='rio'){worn.scaling.set(.98,.98,.98);worn.position.y=.115;}
        else{worn.scaling.set(.95,.97,.92);worn.position.y=.110;}
      }else{
        worn.parent=body.get('Chest sway')||body.get('Body motion');
        if(kind==='cat'){worn.scaling.set(1.05,1.03,1.17);worn.position.set(0,.14,0);}
        else if(kind==='rio'){worn.scaling.set(.78,.93,.84);worn.position.set(0,.70,.095);}
        else{worn.scaling.set(.89,.99,.92);worn.position.set(0,.93,.105);}
      }
      worn.isVisible=!!visible;
    }
    worn.material=clothes.material(look.color,look.wear);
  }
  function setCharacter(type){
    type=Object.hasOwn(CampusCast126.species,type)?type:'rio';if(type===kind)return;
    worn?.dispose(false,false);worn=null;
    // Facilities can own a held prop while the wardrobe is open. Keep its anchor alive.
    for(const anchor of Object.values(hands))anchor.parent=visual;
    body?.dispose();kind=type;
    body=CampusCast126.model(B,scene,CampusCast126.species[kind],visual);body.mesh.isVisible=!!visible;
    const scale=kind==='cat'?1.14:kind==='rio'?1.16:1;visual.scaling.setAll(scale);
    for(const side of [-1,1]){
      const anchor=hands[side]||new B.TransformNode('held item '+side,scene);anchor.parent=body.arm(side);
      if(kind==='cat')anchor.position.set(side*.014,-.148,.045);
      else anchor.position.set(side*.13,-.095,.055);
      hands[side]=anchor;
    }
    api.head=body.get('Head');clock=0;syncWear();
  }
  const api={player,head:null,bag:player,setCharacter,
    setStyle(s){look=CharacterStyle125.normalize({...s,kind});syncWear();},
    handAnchor(side=1){return hands[side];},
    visibility(value){if(visible===value)return;visible=value;body.mesh.isVisible=!!value;if(worn)worn.isVisible=!!value;},
    animate(dt,moving,airborne,flying,speed=12,crouching=false,seated=false){
      visual.position.y=seated?-.54:-.95;
      clock+=dt*(moving?Math.min(1.65,Math.max(.65,speed/12)):1);
      lastPost=seated?'seat':crouching&&!flying&&!airborne?'crouch':airborne&&!flying?'jump':'';
      const clip=flying&&!seated?'Flight':moving&&!seated?'Walk':'';
      body.pose(clip,clock,lastPost);
    },
    actionPose(action,time){body.pose(action==='wave'?'Signature':'',time,lastPost,action);},
    styleAudit(){return {kind,wear:look.wear,color:look.color,meshes:worn?1:0,model:CampusCast126.species[kind]};},
    dispose125(){worn?.dispose(false,false);worn=null;body?.dispose();body=null;}
  };
  setCharacter('rio');return api;
}
