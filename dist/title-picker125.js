/* Normalized silhouette center, foot and height in each existing camera or poster. */
const castPortrait127 = {
  baekhak: {height:1, rig:[.493,.898,.820], poster:[.505,.943,.872], wardrobe:[.504,.915,.794]},
  rio: {height:.80, rig:[.493,.900,.818], poster:[.509,.915,.759], wardrobe:[.505,.929,.697]},
  cat: {height:.78, rig:[.507,.903,.828], poster:[.447,.920,.833], wardrobe:[.496,.929,.706]}
};
function frameCastPortrait127(element,kind,view) {
  const cast=castPortrait127[kind];
  if(!cast)return;
  const [center,foot,height]=cast[view];
  const scale=cast.height*(view==='wardrobe'?.794:.82)/height;
  element.style.scale=String(scale);
  element.style.translate=((.5-center)*scale*100)+'% '+((.90-.5-(foot-.5)*scale)*100)+'%';
}
/* On-demand viewer for the packed standing pose of the actual game rigs. */
function createTitlePicker125(form) {
  const choices = [...form.querySelectorAll('input[name="avatar"]')];
  const picker = form.querySelector('.characterPicker');
  const stage = picker.querySelector('.modelStage');
  let poster = stage.querySelector('img');
  const caption = picker.querySelector('output');
  const castIds={baekhak:'jaha',rio:'dongdong',cat:'seolgi'};
  let canvas, gl, program, activeModel, frame=0, angle=.175;
  let requestedChoice = null, displayedChoice = null, revision = 0;

  const models = new Map();
  const readyModels = new Map();
  let lifetime = new AbortController();
  let warmTimer;

  function release() {
    clearTimeout(warmTimer);
    cancelAnimationFrame(frame);frame=0;activeModel=null;
    warmTimer = null;
    lifetime.abort();
    lifetime = new AbortController();
    models.clear();
    readyModels.clear();
    if (gl) {
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    canvas?.remove();
    canvas = gl = program = null;
    revision++;
    requestedChoice = displayedChoice = null;
  }

  function prepare() {
    if (gl) return;
    canvas = document.createElement('canvas');
    canvas.width = 416;
    canvas.height = 400;
    canvas.hidden = true;
    stage.append(canvas);
    canvas.addEventListener('webglcontextlost', event => {
      if (event.target === canvas) release();
    });
    gl = canvas.getContext('webgl', {alpha:true, antialias:true, powerPreference:'low-power'});
    if (!gl) {
      canvas.remove();
      canvas = null;
      throw Error('WebGL unavailable');
    }
    const vertex = `
      uniform vec2 turn; attribute vec3 position, normal; attribute vec2 atlasUV;
      varying vec2 uv; varying float light;
      void main() {
        vec3 p = position / 8192.0;
        float x=turn.x*p.x-turn.y*p.z, z=turn.y*p.x+turn.x*p.z;
        gl_Position = vec4(-x*.87, (p.y*.998-z*.06+.03)*.91, -z*.4, 1.);
        light = .83 + .19*dot(normalize(vec3(turn.x*normal.x-turn.y*normal.z,normal.y,turn.y*normal.x+turn.x*normal.z)),normalize(vec3(-.4,.8,.9)));
        uv=atlasUV;
      }`;
    program = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,'precision mediump float; varying vec2 uv; varying float light; uniform sampler2D paint; void main(){gl_FragColor=vec4(texture2D(paint,uv).rgb*light,1.);}']]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader,src);
      gl.compileShader(shader);
      gl.attachShader(program,shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('Preview shader unavailable');
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
  }

  function modelFor(kind) {
    if (models.has(kind)) return models.get(kind);
    const signal = lifetime.signal;
    const pending = (async () => {
      const [response,atlas] = await Promise.all([
        fetch('assets/cast126/'+castIds[kind]+'.title.bin',{signal}),
        (async()=>{const image=new Image();image.src='assets/cast126/'+castIds[kind]+'.webp';await image.decode();return image;})()
      ]);
      if (!response.ok) throw Error('Preview unavailable');
      let bytes = await response.arrayBuffer();
      if (new Uint8Array(bytes)[0] === 31) {
        bytes = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      }
      if (signal.aborted) throw new DOMException('Released','AbortError');
      prepare();
      const header = new DataView(bytes), end = 8 + header.getUint32(0,true)*16;
      function upload(target, data) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target,buffer);
        gl.bufferData(target,data,gl.STATIC_DRAW);
        return buffer;
      }
      const paint=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,paint);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      return {paint,
        vertices: upload(gl.ARRAY_BUFFER,new Uint8Array(bytes,8,end-8)),
        indices: upload(gl.ELEMENT_ARRAY_BUFFER,new Uint8Array(bytes,end)),
        count: header.getUint32(4,true)
      };
    })();
    models.set(kind,pending);
    pending.then(model => {
      if (models.get(kind) === pending) readyModels.set(kind, model);
    }, () => {
      if (models.get(kind) === pending) models.delete(kind);
    });
    return pending;
  }

  function draw(){
    if(!gl||!activeModel)return;
    const model=activeModel;
    gl.bindBuffer(gl.ARRAY_BUFFER,model.vertices);
    for (const [name,type,normalized,offset] of [['position',gl.SHORT,false,0],['normal',gl.BYTE,true,6],['atlasUV',gl.UNSIGNED_SHORT,true,10]]) {
      const loc = gl.getAttribLocation(program,name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc,name==='atlasUV'?2:3,type,normalized,16,offset);
    }
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,model.paint);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.indices);
    gl.uniform2f(gl.getUniformLocation(program,'turn'),Math.cos(angle),Math.sin(angle));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES,model.count,gl.UNSIGNED_SHORT,0);
    canvas.hidden = false;
  }

  function show(choice = choices.find(input => input.checked)) {
    if (!choice || requestedChoice === choice) return;
    requestedChoice = choice;
    const turn = ++revision;
    const kind = choice.value;
    const hint = picker.querySelector('.rotate-hint127');
    const live = () => turn === revision;
    let modelShown = false, posterShown = false;

    function commitSelection() {
      if (displayedChoice === choice) return;
      displayedChoice = choice;
      picker.dataset.cast = kind;
      caption.textContent = choice.closest('label').querySelector('strong').textContent;
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', choice.dataset.animal + ' 캐릭터 미리보기');
      if (!choice.checked) {
        choice.checked = true;
        choice.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }

    // Keep the visible rig, its rotation and its checked radio until a replacement can paint.
    const nextPoster = new Image();
    frameCastPortrait127(nextPoster,kind,'poster');
    nextPoster.alt = '';
    nextPoster.draggable = false;
    nextPoster.src = 'assets/title125/' + encodeURIComponent(kind) + '.webp?v=126';
    const posterReady = nextPoster.decode().then(() => {
      if (!live()) return;
      poster.replaceWith(nextPoster);
      poster = nextPoster;
      posterShown = true;
      if (modelShown || (displayedChoice === choice && activeModel)) return;
      cancelAnimationFrame(frame);
      frame = 0;
      activeModel = null;
      if (canvas) canvas.hidden = true;
      commitSelection();
    }).catch(() => { /* A ready rig can still supply this selection. */ });

    function showRig(model) {
      if (!live()) return;
      cancelAnimationFrame(frame);
      frame = 0;
      if (displayedChoice !== choice || !activeModel) angle = .175;
      activeModel = model;
      frameCastPortrait127(canvas,kind,'rig');
      draw();
      modelShown = true;
      commitSelection();

      if (!navigator.maxTouchPoints && !matchMedia('(pointer:coarse)').matches &&
          !navigator.connection?.saveData && !warmTimer) {
        const signal = lifetime.signal;
        warmTimer = setTimeout(async () => {
          for (const other of choices) {
            if (signal.aborted) break;
            try { await modelFor(other.value); } catch { /* Its poster stays available. */ }
          }
        }, 150);
      }
    }

    async function posterOnly() {
      await posterReady;
      if (!live()) return;
      if (posterShown) hint.hidden = true;
      else requestedChoice = displayedChoice; // Both assets failed; allow a new attempt.
    }
    if (!window.DecompressionStream) { posterOnly(); return; }
    const ready = readyModels.get(kind);
    if (ready) showRig(ready);
    else modelFor(kind).then(showRig).catch(posterOnly);
  }

  function step(delta) {
    const index = requestedChoice ? choices.indexOf(requestedChoice) : choices.findIndex(input => input.checked);
    show(choices[(index + delta + choices.length) % choices.length]);
  }
  picker.querySelector('[data-prev]').onclick = () => step(-1);
  picker.querySelector('[data-next]').onclick = () => step(1);
  picker.onkeydown = event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  };
  bindCastNav127(picker.querySelector('.cast-nav127'),step);
  bindCastRotation127(stage,delta=>{
    if(!activeModel)return false;
    angle-=delta*.014;
    if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw()});
    return true;
  });
  return {show,release};
}

function bindCastRotation127(stage,rotate){
  let previous=null;
  const hint=stage.parentElement.querySelector('.rotate-hint127');
  function remember(){if(hint&&!hint.hidden){hint.hidden=true;try{localStorage.setItem('3nu.rotation127','1')}catch{}}}
  try{if(hint)hint.hidden=localStorage.getItem('3nu.rotation127')==='1'}catch{}
  stage.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    previous={id:e.pointerId,x:e.clientX};stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    if(previous?.id!==e.pointerId)return;
    const dx=e.clientX-previous.x;previous.x=e.clientX;
    if(dx&&rotate(dx))remember();
  });
  const end=()=>{previous=null};
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(ev,end);
  window.addEventListener('blur',end);
  stage.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.stopPropagation();e.preventDefault();if(rotate(e.key==='ArrowLeft'?-18:18))remember();
  });
}

// A touch across the name strip changes species. Tapping either arrow remains a native click.
function bindCastNav127(nav,step){
 let start=null;
 nav.addEventListener('pointerdown',e=>{
  if(e.isPrimary&&e.pointerType==='touch')start={x:e.clientX,y:e.clientY,id:e.pointerId};
 });
 nav.addEventListener('pointermove',e=>{
  if(start?.id===e.pointerId&&Math.abs(e.clientX-start.x)>18)nav.setPointerCapture(e.pointerId);
 });
 nav.addEventListener('pointerup',e=>{
  if(start?.id!==e.pointerId)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
  if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx<0?1:-1);
 });
 nav.addEventListener('pointercancel',()=>{start=null});
}
