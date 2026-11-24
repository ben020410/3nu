/* The title, local player, remote visitors and residents use the approved 3NU cast.
   One mesh and one atlas per appearance, one animated draw per visible character. */
'use strict';
const CampusCast126 = (() => {
  const species = {baekhak:'jaha', rio:'dongdong', cat:'seolgi'};
  const coats = {cheese:'bori', tuxedo:'galpi', calico:'dahong', tabby:'dinga', black:'tani', cream:'ohu'};
  const labels = {baekhak:'자하 · 백학',rio:'동동 · 오리',cat:'설기 · 고양이'};
  const files = new Map(), scenes = new WeakMap();
  const vertex = `
    precision highp float;
    attribute vec3 position,normal,shapePos,shapeNormal;
    attribute vec2 uv,part;
    uniform mat4 worldViewProjection,world,view,castJoints[12];
    uniform vec4 shape;
    varying vec2 vUV; varying vec3 vNormal; varying float zEye;
    void main(){
      int joint=int(part.x+0.5); float k=part.y<0.5?0.0:(part.y<1.5?shape.y:(part.y<2.5?shape.z:shape.w));
      mat4 bone=castJoints[joint]; vec4 local=bone*vec4(position+k*shapePos,1.0);
      vec3 n=normal+k*shapeNormal;
      mat3 b=mat3(bone);
      vec3 normalLocal=mat3(cross(b[1],b[2]),cross(b[2],b[0]),cross(b[0],b[1]))*n;
      vNormal=normalize(mat3(world)*normalLocal);
      vUV=uv;zEye=abs((view*world*local).z);gl_Position=worldViewProjection*local;
    }`;
  const fragment = `
    precision mediump float;
    varying vec2 vUV; varying vec3 vNormal; varying float zEye;
    uniform sampler2D paint;uniform vec4 fog;
    void main(){
      vec3 n=normalize(vNormal),c=texture2D(paint,vUV).rgb;
      float hemi=dot(n,normalize(vec3(.25,1.,.4)))*.5+.5;
      float sun=max(0.,dot(n,normalize(vec3(.4,.78,.48))));
      vec3 lit=c*(mix(vec3(.65,.67,.70),vec3(.93,.925,.91),hemi)+vec3(.16,.15,.13)*sun);
      float haze=zEye*fog.a;gl_FragColor=vec4(mix(fog.rgb,lit,exp(-haze*haze)),1.);
    }`;
  function decode(bytes) {
    const view = new DataView(bytes);
    if(view.getUint32(0,false)!==0x334e4331)throw Error('Invalid character asset');
    const metaBytes=view.getUint32(4,true), count=view.getUint32(8,true), numIndices=view.getUint32(12,true);
    const start=16+metaBytes,indexStart=start+count*28;
    if(indexStart+numIndices*2!==bytes.byteLength)throw Error('Incomplete character asset');
    const data=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,16,metaBytes)));
    if(data.joints.length>12)throw Error('Character exceeds joint limit');
    const pos=new Float32Array(count*3),norm=new Float32Array(count*3),uv=new Float32Array(count*2);
    const part=new Float32Array(count*2),delta=new Float32Array(count*3),dn=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const o=start+i*28;
      for(let j=0;j<3;j++){
        pos[i*3+j]=view.getInt16(o+j*2,true)/8192;norm[i*3+j]=view.getInt8(o+6+j)/127;
        delta[i*3+j]=view.getInt16(o+16+j*2,true)/8192;dn[i*3+j]=view.getInt8(o+22+j)/63;
      }
      uv[i*2]=view.getUint16(o+10,true)/65535;uv[i*2+1]=view.getUint16(o+12,true)/65535;
      part[i*2]=view.getUint8(o+9);part[i*2+1]=view.getUint8(o+14);
    }
    for(const [,tracks] of Object.values(data.clips))for(const tr of tracks)tr[2]=Float32Array.from(tr[2],v=>v/10000);
    return {...data,pos,norm,uv,part,delta,dn,indices:new Uint16Array(bytes,indexStart,numIndices)};
  }
  async function read(id){
    const compressed=typeof DecompressionStream==='function';
    const url='assets/cast126/'+id+(compressed?'.packed.bin':'.bin');
    const res=await fetch(url);
    if(!res.ok)throw Error('Character unavailable: '+id);
    let bytes=await res.arrayBuffer();
    if(compressed&&new Uint8Array(bytes)[0]===31)bytes=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    return decode(bytes);
  }
  function prepare(ids){
    return Promise.all(ids.map(id=>{
      if(!files.has(id)){
        const entry={};entry.ready=read(id).then(data=>{entry.data=data;return data;}).catch(error=>{files.delete(id);throw error;});
        files.set(id,entry);
      }
      return files.get(id).ready;
    }));
  }
  function resources(B,scene,id){
    let bank=scenes.get(scene);if(!bank){bank=new Map();scenes.set(scene,bank);}
    if(bank.has(id))return bank.get(id);
    const data=files.get(id)?.data;
    if(!data)throw Error('Character was not prepared: '+id);
    const template=new B.Mesh('cast-template-'+id,scene);
    template.isPickable=false;template.metadata={renderRole99:'actor'};template.setEnabled(false);
    const buffers=new B.VertexData();buffers.positions=data.pos;buffers.normals=data.norm;buffers.uvs=data.uv;buffers.indices=data.indices;buffers.applyToMesh(template);
    template.setVerticesData('part',data.part,false,2);template.setVerticesData('shapePos',data.delta,false,3);template.setVerticesData('shapeNormal',data.dn,false,3);
    const texture=new B.Texture('assets/cast126/'+id+'.webp',scene,false,false,B.Texture.TRILINEAR_SAMPLINGMODE);
    texture.wrapU=texture.wrapV=B.Texture.CLAMP_ADDRESSMODE;
    const shared={template,texture,data};bank.set(id,shared);return shared;
  }
  function model(B,scene,id,parent){
    const {template,texture,data}=resources(B,scene,id);
    const mesh=new B.Mesh('3NU-'+id,scene);template.geometry.applyToMesh(mesh);
    mesh.parent=parent;mesh.isPickable=false;mesh.checkCollisions=false;mesh.metadata={renderRole99:'actor',cast126:id};
    // Vertex positions are local to individual joints. Include wings and gestures in the culling volume.
    mesh.setBoundingInfo(new B.BoundingInfo(new B.Vector3(-1.6,-.2,-1.1),new B.Vector3(1.6,2.5,1.1)));
    const mat=new B.ShaderMaterial('coat-'+id,scene,{vertexSource:vertex,fragmentSource:fragment},
      {attributes:['position','normal','uv','part','shapePos','shapeNormal'],uniforms:['worldViewProjection','world','view','castJoints','shape','fog'],samplers:['paint']});
    mesh.material=mat;mat.backFaceCulling=false;mat.setTexture('paint',texture);
    const matrices=new Float32Array(12*16),shape=new Float32Array(4), trs=B.Matrix.Identity();
    const nodes=data.joints.map(([name])=>new B.TransformNode(name,scene));
    const names=new Map(data.joints.map(([name],i)=>[name,nodes[i]]));
    const world=nodes.map(()=>B.Matrix.Identity());
    data.joints.forEach(([,par],i)=>{nodes[i].parent=par<0?parent:nodes[par];nodes[i].rotationQuaternion=B.Quaternion.Identity();});
    let previous='',disposed=false,frame=-1;const get=name=>names.get(name);
    function restore(){
      for(let i=0;i<nodes.length;i++){const [, ,t,q,s]=data.joints[i],n=nodes[i];n.position.set(...t);n.rotationQuaternion.set(...q);n.scaling.set(...s);}
      shape.fill(0);
    }
    function commit(){
      for(let i=0;i<nodes.length;i++){const n=nodes[i],par=data.joints[i][1];
        B.Matrix.ComposeToRef(n.scaling,n.rotationQuaternion,n.position,trs);
        if(par<0)world[i].copyFrom(trs);else trs.multiplyToRef(world[par],world[i]);
        matrices.set(world[i].m,i*16);
      }
    }
    mat.onBindObservable.add(()=>{
      const effect=mat.getEffect();effect.setMatrices('castJoints',matrices);effect.setFloat4('shape',0,shape[1],shape[2],shape[3]);
      const c=scene.fogColor;effect.setFloat4('fog',c.r,c.g,c.b,scene.fogEnabled&&scene.fogMode?scene.fogDensity:0);
    });
    const leg = side=>get('Foot pivot '+side)||get('Leg '+side);
    const arm = side=>get('Mitten pivot '+side)||get('Folded wing pivot '+side);
    function pose(clip,time,post='',gesture=''){
      if(disposed)return;
      // The walking loop interpolates at render frequency. Distant residents are already throttled by the campus.
      const key=clip+'/'+post+'/'+gesture;
      // Rest and held poses have no time-varying tracks. Keep the current joint palette.
      if(key===previous&&(time===frame||!data.clips[clip]))return;
      restore();previous=key;frame=time;
      const anim=data.clips[clip];
      if(anim){const [duration,tracks]=anim,phase=(time%duration+duration)%duration/duration;
        for(const [j,prop,v] of tracks){
          const dim=prop==='q'?4:prop==='w'?1:3,len=v.length/dim,at=phase*(len-1),a=Math.floor(at)*dim,b=Math.min(len-1,Math.floor(at)+1)*dim,f=at-Math.floor(at);
          const mix=k=>v[a+k]+(v[b+k]-v[a+k])*f;
          if(prop==='w')shape[j]=mix(0);else if(prop==='q')nodes[j].rotationQuaternion.set(mix(0),mix(1),mix(2),mix(3)).normalize();
          else (prop==='t'?nodes[j].position:nodes[j].scaling).set(mix(0),mix(1),mix(2));
        }
      }
      const body=get('Body motion'),head=get('Head'),isBird=id==='jaha'||id==='dongdong';
      if(post==='seat'||post==='crouch'){
        const seated=post==='seat',short=id!=='jaha';body.position.y-=seated?(short?.14:.29):(short?.10:.20);
        for(const side of [-1,1]){const foot=leg(side);foot.position.z+=seated?.12:.035;foot.position.y+=seated?.13:(short?.095:.17);B.Quaternion.RotationYawPitchRollToRef(0,seated?-1.08:.76,0,foot.rotationQuaternion);}
      }else if(post==='jump'){
        for(const side of [-1,1]){const foot=leg(side);foot.position.y+=.055;B.Quaternion.RotationYawPitchRollToRef(0,.32,0,foot.rotationQuaternion);}
      }
      if(gesture&&gesture!=='wave'){
        const held=['read','sketch','drink','water','picnic','look','mist','bell'].includes(gesture),stretch=gesture==='stretch';
        if(held||stretch){
          for(const side of [-1,1]){const a=arm(side);
            const pitch=stretch?-.16:gesture==='drink'?-1.02:-(isBird?.58:.68);
            B.Quaternion.RotationYawPitchRollToRef(0,pitch,side*(stretch?1.85:.14),a.rotationQuaternion);
          }B.Quaternion.RotationYawPitchRollToRef(0,held?.12:-.08,0,head.rotationQuaternion);
        }
      }
      commit();
    }
    pose('',0);
    return {mesh,nodes,get,arm,leg,pose,dispose(){disposed=true;mat.dispose(false,false);mesh.dispose(false,false);for(const n of nodes)if(!n.isDisposed())n.dispose();}};
  }
  function resident(B,scene,options){
    const root=new B.TransformNode(options.id,scene);
    const seat=new B.TransformNode('seat',scene);seat.parent=root;
    let body,phase=0,seated=false;
    const actor={root,anchors:{seat},coat:'',role:'',action:'idle',renderMeshes:[],
      setEnabled:v=>root.setEnabled(v),
      setAction(action,opts={}){actor.action=action;seated=action==='sit'||!!opts.seated;seat.position.y=seated?.105:.22;},
      reset({coat,role,phase:nextPhase=0,action='idle'}){
        if(actor.coat!==coat){body?.dispose();body=model(B,scene,coats[coat],root);body.mesh.metadata.npcVisual103=true;actor.renderMeshes=[body.mesh];}
        actor.coat=coat;actor.role=role;phase=nextPhase;actor.setAction(action);
      },
      update(dt,time){const walk=actor.action==='walk';body.pose(walk?'Walk':'Signature',time+phase,seated?'seat':'');},
      dispose(){body?.dispose();root.dispose();}
    };
    actor.reset(options);return actor;
  }
  return {species,coats,labels,prepare,model,resident};
})();
