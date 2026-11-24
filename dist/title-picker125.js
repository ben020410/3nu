/* On-demand viewer for the packed standing pose of the actual game rigs. */
function createTitlePicker125(form) {
  const choices = [...form.querySelectorAll('input[name="avatar"]')];
  const picker = form.querySelector('.characterPicker');
  const stage = picker.querySelector('.modelStage');
  const poster = stage.querySelector('img');
  const caption = picker.querySelector('output');
  const castIds={baekhak:'jaha',rio:'dongdong',cat:'seolgi'};
  let canvas, gl, program, current, startPoint;

  const models = new Map();
  const readyModels = new Set();
  let lifetime = new AbortController();
  let warmTimer;

  function release() {
    clearTimeout(warmTimer);
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
    current = null;
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
      attribute vec3 position, normal; attribute vec2 atlasUV;
      varying vec2 uv; varying float light;
      void main() {
        vec3 p = position / 8192.0;
        float x = .9848*p.x - .1736*p.z, z = .1736*p.x + .9848*p.z;
        gl_Position = vec4(-x*.87, (p.y*.998-z*.06+.03)*.91, -z*.4, 1.);
        light = .83 + .19*dot(normalize(normal),normalize(vec3(-.4,.8,.9)));
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
    pending.then(() => {
      if (models.get(kind) === pending) readyModels.add(kind);
    }, () => {
      if (models.get(kind) === pending) models.delete(kind);
    });
    return pending;
  }

  async function show() {
    const index = choices.findIndex(input => input.checked);
    if (index < 0) return;
    const choice = choices[index], kind = choice.value;
    if (current === kind) return;
    current = kind;
    const signal = lifetime.signal;
    const name = choice.closest('label').querySelector('strong').textContent;
    caption.textContent = name;
    poster.alt = name;
    poster.src = 'assets/title125/' + encodeURIComponent(kind) + '.webp?v=126';
    if (canvas && !readyModels.has(kind)) canvas.hidden = true;
    if (!window.DecompressionStream) return;
    try {
      const model = await modelFor(kind);
      if (signal.aborted || current !== kind) return;
      gl.bindBuffer(gl.ARRAY_BUFFER,model.vertices);
      for (const [name,type,normalized,offset] of [['position',gl.SHORT,false,0],['normal',gl.BYTE,true,6],['atlasUV',gl.UNSIGNED_SHORT,true,10]]) {
        const loc = gl.getAttribLocation(program,name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc,name==='atlasUV'?2:3,type,normalized,16,offset);
      }
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,model.paint);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.indices);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES,model.count,gl.UNSIGNED_SHORT,0);
      canvas.hidden = false;
      if (!navigator.connection?.saveData && !warmTimer) {
        warmTimer = setTimeout(async () => {
          for (const other of choices) {
            if (signal.aborted) break;
            try { await modelFor(other.value); } catch { /* On selection the poster is available. */ }
          }
        }, 150);
      }
    } catch {
      if (!signal.aborted && current === kind && canvas) canvas.hidden = true;
    }
  }

  function step(delta) {
    const index = choices.findIndex(input => input.checked);
    select((index + delta + choices.length) % choices.length);
  }

  function select(index) {
    const choice = choices[index];
    choice.checked = true;
    choice.dispatchEvent(new Event('change',{bubbles:true}));
    show();
  }
  picker.querySelector('[data-prev]').onclick = () => step(-1);
  picker.querySelector('[data-next]').onclick = () => step(1);
  picker.onkeydown = event => {
    if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowLeft' ? -1 : 1);
  };
  stage.onpointerdown = event => {
    if (!event.isPrimary || event.button !== 0) return;
    startPoint = {id:event.pointerId,x:event.clientX,y:event.clientY};
    stage.setPointerCapture(event.pointerId);
  };
  stage.onpointerup = event => {
    if (!startPoint || startPoint.id !== event.pointerId) return;
    const dx = event.clientX-startPoint.x, dy = event.clientY-startPoint.y;
    startPoint = null;
    if (Math.abs(dx)>28 && Math.abs(dx)>Math.abs(dy)*1.3) step(dx<0?1:-1);
  };
  stage.onpointercancel = stage.onlostpointercapture = () => {startPoint=null};
  return {show,release};
}
