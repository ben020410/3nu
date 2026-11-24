/* A photo invite contains a short random key. Only the explicit link action sends an image. */
window.PhotoReply126 = (() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fragment = new URLSearchParams(location.hash.slice(1));
  let invitation = null, loading = null, banner = null, accepted = false, controller = null;
  const imageURL = data => 'data:image/jpeg;base64,' + data;
  function forget() {
    invitation = null;
    accepted = false;
    if (banner) {banner.querySelector('img').removeAttribute('src');banner.remove();}
    const url = new URL(location.href);
    const params = new URLSearchParams(url.hash.slice(1));
    params.delete('photo');
    url.hash = params.toString();
    history.replaceState(history.state, '', url);
  }
  async function loadInvite(id) {
    const label = banner.querySelector('strong'), info = banner.querySelector('p');
    const retry = banner.querySelector('[data-retry]'), thumb = banner.querySelector('img');
    label.textContent = '답장할 사진을 불러오는 중…';
    info.textContent = '';
    retry.hidden = true;
    try {
      if (!/^[a-f0-9]{32}$/.test(id)) throw Object.assign(Error(), {missing:true});
      const {r,data} = await Community107.timedJSON('/api/photo-replies/' + id, {cache:'no-store',credentials:'omit'});
      if (!r.ok) throw Object.assign(Error(), {missing:r.status===404});
      const original = new Image();
      original.src = imageURL(data.photo);
      await original.decode();
      if (!banner.isConnected) return;
      invitation = {original,shot:data.shot};
      thumb.src = original.src;
      thumb.hidden = false;
      label.textContent = '친구가 보낸 장면';
      info.textContent = '시작하면 친구가 찍은 위치와 각도에서 내 캐릭터로 촬영해요.';
    } catch (e) {
      if (!banner.isConnected) return;
      label.textContent = e.missing ? '이 사진 링크를 열 수 없어요' : '사진을 불러오지 못했어요';
      info.textContent = e.missing ? '기간이 지났거나 잘못된 링크예요. 캠퍼스는 그대로 둘러볼 수 있어요.' : '연결을 확인하고 다시 시도해 주세요.';
      retry.hidden = !!e.missing;
    }
  }
  function startLoad() {
    loading = loadInvite(fragment.get('photo')).finally(()=>{loading=null;});
  }
  if (fragment.has('photo')) {
    banner = document.createElement('section');
    banner.id='photoInvite126';
    banner.setAttribute('aria-live','polite');
    banner.innerHTML='<img alt="친구가 보낸 캠퍼스 사진" hidden><div><strong></strong><p></p><button type="button" data-retry hidden>다시 불러오기</button><button type="button" data-skip>일반 탐방으로 열기</button></div>';
    $('startForm').prepend(banner);
    banner.querySelector('[data-skip]').onclick=forget;
    banner.querySelector('[data-retry]').onclick=startLoad;
    startLoad();
    document.addEventListener('submit',e=>{
      if (e.target!==$('startForm') || !loading || !banner.isConnected) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const form=e.target;
      loading.then(()=>{if (!document.body.classList.contains('playing')) form.requestSubmit();});
    },true);
  }
  function shotFrom(camera,engine,player,flying) {
    const xyz = v=>[v.x,v.y,v.z];
    return {eye:xyz(camera.position),at:xyz(camera.getTarget()),player:xyz(player.position),
      facing:player.rotation.y,flying:!!flying,aspect:engine.getRenderWidth()/engine.getRenderHeight(),
      fov:camera.fov,span:camera.mode===BABYLON.Camera.ORTHOGRAPHIC_CAMERA?camera.orthoTop:0};
  }
  function applyCamera(B,camera,engine,rig,sky,scene) {
    if (!accepted) return;
    const s = invitation.shot;
    camera.position.set(...s.eye);
    camera.setTarget(B.Vector3.FromArray(s.at));
    const actual = engine.getRenderWidth()/engine.getRenderHeight(), scale=Math.max(1,s.aspect/actual);
    camera.mode = s.span ? B.Camera.ORTHOGRAPHIC_CAMERA : B.Camera.PERSPECTIVE_CAMERA;
    camera.fov = 2*Math.atan(Math.tan(s.fov/2)*scale);
    if (s.span) {
      camera.orthoTop=s.span*scale;
      camera.orthoBottom=-camera.orthoTop;
      camera.orthoRight=camera.orthoTop*actual;
      camera.orthoLeft=-camera.orthoRight;
    }
    sky.setEnabled(!s.span);
    scene.fogMode=s.span?B.Scene.FOGMODE_NONE:B.Scene.FOGMODE_EXP2;
    rig.visibility(Math.hypot(s.eye[0]-s.player[0],s.eye[1]-s.player[1]-.8,s.eye[2]-s.player[2])<3?0:1);
  }
  function fitCanvas(canvas,aspect) {
    const w=Math.min(canvas.width,canvas.height*aspect), h=Math.min(canvas.height,canvas.width/aspect);
    const result=document.createElement('canvas');
    result.width=Math.max(1,Math.round(w)); result.height=Math.max(1,Math.round(h));
    result.getContext('2d').drawImage(canvas,(canvas.width-w)/2,(canvas.height-h)/2,w,h,0,0,result.width,result.height);
    return result;
  }
  async function compress(blob) {
    const img=new Image(), url=URL.createObjectURL(blob);
    try {
      img.src=url; await img.decode();
      const canvas=document.createElement('canvas');
      for(const [edge,quality] of [[1080,.81],[900,.72],[720,.65],[520,.58]]) {
        const scale=Math.min(1,edge/Math.max(img.width,img.height));
        canvas.width=Math.max(1,Math.round(img.width*scale));
        canvas.height=Math.max(1,Math.round(img.height*scale));
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        const encoded=canvas.toDataURL('image/jpeg',quality).split(',')[1];
        if(encoded.length<215000) return encoded;
      }
      throw Error('사진 용량이 커서 링크를 만들지 못했어요.');
    } finally {URL.revokeObjectURL(url);}
  }
  function pair(original,reply) {
    const c=document.createElement('canvas');
    const panelW=Math.min(1050,Math.max(430,original.naturalWidth,reply.width));
    const panelH=Math.max(260,Math.min(1200,Math.round(panelW/Math.max(.35,Math.min(3,original.naturalWidth/original.naturalHeight)))));
    const pad=Math.round(panelW*.043), foot=pad*2;
    c.width=2*panelW+3*pad; c.height=panelH+2*pad+foot;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#faf8f1'; ctx.fillRect(0,0,c.width,c.height);
    for(const [i,p,label] of [[0,original,'친구의 사진'],[1,reply,'나의 답장']]) {
      const x=pad+i*(panelW+pad),w=p.naturalWidth||p.width,h=p.naturalHeight||p.height,f=Math.min(panelW/w,panelH/h);
      ctx.fillStyle='#e8e7df'; ctx.fillRect(x,pad,panelW,panelH);
      ctx.drawImage(p,x+(panelW-w*f)/2,pad+(panelH-h*f)/2,w*f,h*f);
      ctx.fillStyle='#234d4b'; ctx.font='600 '+Math.max(15,Math.round(pad*.71))+'px sans-serif';ctx.textBaseline='middle';
      ctx.fillText(label,x,pad+panelH+foot*.56);
    }
    ctx.textAlign='right';ctx.fillStyle='#486563';ctx.fillText('3NU',c.width-pad,pad+panelH+foot*.56);
    return c;
  }
  function install(photo, hooks) {
    let shot=null, sourceBlob=null, link=null, generation=0, copying=false, processing=false;
    const status=$('photoStatus97'), invite=document.createElement('button');
    invite.type='button'; invite.id='photoLink126'; invite.textContent='친구에게 이 장면 보내기';
    photo.querySelector('footer').prepend(invite);
    const linkBox=document.createElement('section');
    linkBox.id='photoLinkBox126'; linkBox.hidden=true;
    linkBox.innerHTML='<label>장면 링크 · 7일간 유효<input readonly aria-label="사진 초대 링크"></label><button type="button">링크 복사</button>';
    photo.querySelector('footer').after(linkBox);
    const field=linkBox.querySelector('input');
    async function copyLink(){
      if (!link || copying) return;
      copying=true;
      try {await navigator.clipboard.writeText(link);status.textContent='장면 링크를 복사했어요. 친구에게 붙여넣어 보내세요.';}
      catch {field.focus();field.select();status.textContent='장면 링크가 준비됐어요. 직접 복사해 친구에게 보내세요.';}
      finally {copying=false;}
    }
    linkBox.querySelector('button').onclick=copyLink;
    const disclosure=document.createElement('p');
    disclosure.id='photoPrivacy126';disclosure.textContent='친구도 이 자리에서 찍을 수 있어요. 링크는 7일간 유효해요.';
    photo.querySelector('footer').before(disclosure);
    const retry=document.createElement('button');
    retry.type='button';retry.textContent='답장 다시 찍기';retry.hidden=true;
    photo.querySelector('footer').prepend(retry);
    const dock=document.createElement('section');
    dock.id='photoDock126';dock.hidden=true;dock.setAttribute('aria-label','친구에게 사진 답장');
    dock.innerHTML='<img alt="친구가 보낸 원본 사진"><div><strong>친구가 보낸 장면</strong><p>친구 사진과 나란히 저장돼요.</p></div><button type="button" data-take disabled>장면 준비 중…</button><button type="button" data-exit aria-label="사진 답장 닫기" data-centered-icon><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';
    document.body.append(dock);
    const shutter=dock.querySelector('[data-take]');
    const guide=document.createElement('div');guide.id='photoCrop126';guide.hidden=true;document.body.append(guide);
    function dockState(show) {
      dock.hidden=guide.hidden=!show;
      if(show){shutter.disabled=true;shutter.textContent='장면 준비 중…';}
      document.body.classList.toggle('photo-framing126',show);
    }
    function resetLink() {
      ++generation;
      link=null;field.value='';linkBox.hidden=true;sourceBlob=null;processing=false;
      invite.disabled=false;invite.textContent='친구에게 이 장면 보내기';
    }
    function end() {
      const finishedInvite=accepted;
      accepted=false; dockState(false);dock.querySelector('img').removeAttribute('src');
      if(invitation)forget();
      photo.classList.remove('photo-pair126');
      retry.hidden=true;invite.hidden=false;
      hooks.clear();
      if(finishedInvite)queueMicrotask(()=>hooks.onExplore?.());
    }
    function enter() {
      if (!invitation) return false;
      if(!hooks.place(invitation.shot)){forget();return false;}
      accepted=true;
      dock.querySelector('img').src=invitation.original.src;
      dockState(true);
      return true;
    }
    function ready() {
      if (!accepted || dock.hidden) return;
      const world=$('world').getBoundingClientRect(), aspect=invitation.shot.aspect;
      const w=Math.min(world.width,world.height*aspect),h=Math.min(world.height,world.width/aspect);
      guide.style.width=w+'px';guide.style.height=h+'px';
      const blocked=hooks.paused();
      if (shutter.disabled!==blocked) shutter.disabled=blocked;
      shutter.textContent=blocked?'장면 준비 중…':'여기서 나도 찍기';
    }
    shutter.onclick=()=>{if (!shutter.disabled)hooks.capture();};
    dock.querySelector('[data-exit]').onclick=end;
    let retaking=false;
    retry.onclick=()=>{
      retaking=true;
      photo.addEventListener('close',()=>{if(accepted)dockState(true);},{once:true});
      photo.close();
    };
    photo.addEventListener('close',()=>{
      if (accepted && !retaking) end();
      retaking=false;resetLink();shot=null;
    });
    invite.onclick=async()=>{
      if (!sourceBlob || !shot || processing) return;
      if(link){
        if(typeof navigator.share!=='function'){await copyLink();return;}
        try{await navigator.share({title:'3NU에서 찍은 장면',url:link});status.textContent='공유 창을 닫았어요.'}
        catch(error){if(error.name!=='AbortError')await copyLink()}
        return;
      }
      const rev=generation,current=sourceBlob,here=shot;
      processing=true;invite.disabled=true;invite.textContent='링크 만드는 중…';
      status.textContent=''; 
      try {
        const photoData=await compress(current);
        if (generation!==rev) return;
        const result=await Community107.request('/api/photo-replies','POST',{photo:photoData,shot:here});
        if (generation!==rev) return;
        const url=new URL(location.pathname,location.origin);
        url.hash='photo='+result.id;
        link=url.toString();field.value=link;linkBox.hidden=false;linkBox.scrollIntoView({block:'nearest'});
        if(typeof navigator.share==='function'){
          invite.textContent='장면 링크 공유';status.textContent='장면 링크가 준비됐어요. 공유할 앱을 선택하세요.';
        }else{invite.textContent='장면 링크 복사';await copyLink();}
      } catch {if (generation===rev)status.textContent='장면 링크를 만들지 못했어요. 연결을 확인하고 다시 눌러 주세요.';}
      finally {if(generation===rev){processing=false;invite.disabled=false;if(!link)invite.textContent='친구에게 이 장면 보내기';}}
    };
    controller={enter};
    return {enter,ready,applyCamera,
      setShot(value){shot=value;},
      setBlob(value){resetLink();sourceBlob=value;},
      finish(canvas) {
        if (!accepted) return canvas;
        const cropped=fitCanvas(canvas,invitation.shot.aspect);
        const result=pair(invitation.original,cropped);
        cropped.width=cropped.height=0;
        dockState(false);photo.classList.add('photo-pair126');invite.hidden=true;retry.hidden=false;
        return result;
      },
      get active(){return accepted;},
      get busy(){return accepted && !dock.hidden;}
    };
  }
  return {install,shotFrom,entryPoint:()=>invitation?{x:invitation.shot.player[0],z:invitation.shot.player[2]}:null,
    enter:()=>controller?.enter()||false,get valid(){return !!invitation;}};
})();
