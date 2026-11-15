/* A static directional sky: one dome, one baked 2048x1024 cloud atlas.
   No clock, animation, planar billboards, render targets or moving shadows. */
function createClearSky29(B,scene){
 const tex=new B.DynamicTexture('static-cloud-atlas29',{width:2048,height:1024},scene,false,B.Texture.BILINEAR_SAMPLINGMODE),ctx=tex.getContext(),im=ctx.createImageData(2048,1024);
 // Different angular extents and heights, with generous blue-sky gaps.
 const clusters=[[-2.36,.41,.34,.12],[-1.25,.68,.26,.13],[-.24,.38,.31,.10],[.92,.56,.36,.14],[2.04,.33,.25,.09],[2.79,.85,.21,.13]];
 const lobes=[[-.65,-.13,.42,.48],[-.30,.14,.46,.74],[.05,.31,.44,.83],[.39,.08,.43,.64],[.70,-.17,.35,.41],[.01,-.23,.76,.47]];
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
 for(let y=0;y<1024;y++){const lat=(.5-y/1024)*Math.PI;if(lat<.12||lat>1.14)continue;
  for(let x=0;x<2048;x++){const lon=(x/2048-.5)*Math.PI*2;let alpha=0,shade=1;
   for(let i=0;i<clusters.length;i++){const[cx,cy,w,h]=clusters[i],dx=Math.atan2(Math.sin(lon-cx),Math.cos(lon-cx))/w,dy=(lat-cy)/h;if(Math.abs(dx)>1.2||Math.abs(dy)>1.3)continue;
    let field=-10;for(const[lx,ly,rx,ry]of lobes){const xx=(dx-lx*(i%2?-1:1))/rx,yy=(dy-ly)/ry;field=Math.max(field,1-xx*xx-yy*yy);}
    const detail=.025*Math.sin(dx*29+i)*Math.sin(dy*25+.4)+.015*Math.cos(dx*57+dy*35);
    const a=smooth(-.12,.22,field+detail)*.9;if(a>alpha){alpha=a;shade=.92+.08*smooth(-.6,.5,dy);}
   }
   if(alpha>.001){const k=(y*2048+x)*4;im.data[k]=Math.round(255*shade);im.data[k+1]=Math.round(255*shade);im.data[k+2]=255;im.data[k+3]=Math.round(255*alpha);}
  }
 }
 ctx.putImageData(im,0,0);tex.wrapU=B.Texture.WRAP_ADDRESSMODE;tex.wrapV=B.Texture.CLAMP_ADDRESSMODE;tex.update(true);
 B.Effect.ShadersStore.clearSky29VertexShader='precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 direction; void main(){direction=position;gl_Position=worldViewProjection*vec4(position,1.0);}';
 B.Effect.ShadersStore.clearSky29FragmentShader=`precision highp float; varying vec3 direction; uniform sampler2D clouds;
 void main(){vec3 d=normalize(direction);float elevation=clamp(d.y,0.0,1.0);vec3 horizon=vec3(.855,.937,.984);vec3 zenith=vec3(.416,.695,.902);vec3 col=mix(horizon,zenith,pow(elevation,.5));
 vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+.5,asin(clamp(d.y,-1.0,1.0))/3.14159265359+.5);vec4 cloud=texture2D(clouds,uv);col=mix(col,cloud.rgb,cloud.a*smoothstep(.10,.20,d.y));gl_FragColor=vec4(col,1.0);}`;
 const mat=new B.ShaderMaterial('clear-static-sky29',scene,{vertex:'clearSky29',fragment:'clearSky29'},{attributes:['position'],uniforms:['worldViewProjection'],samplers:['clouds']});mat.setTexture('clouds',tex);mat.backFaceCulling=false;
 const sky=B.MeshBuilder.CreateSphere('sky-dome',{diameter:5000,segments:32,sideOrientation:B.Mesh.BACKSIDE},scene);sky.material=mat;sky.infiniteDistance=true;sky.isPickable=false;sky.applyFog=false;sky.receiveShadows=false;
 scene.clearColor=B.Color4.FromHexString('#dbeffbff');scene.fogColor=B.Color3.FromHexString('#dbeffb');scene.fogDensity=.000065;
 // Shared 96px environment cube. Static sky/ground irradiance impression only;
 // it deliberately contains no buildings and never renders the scene again.
 const size=96,faces=[];
 for(let f=0;f<6;f++){const p=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const a=2*(x+.5)/size-1,b=2*(y+.5)/size-1,v=[[1,-b,-a],[-1,-b,a],[a,1,b],[a,-1,-b],[a,-b,1],[-a,-b,-1]][f],h=v[1]/Math.hypot(...v),t=Math.pow(Math.max(0,h),.5),rgb=h<0?[.62,.70,.70]:[.855*(1-t)+.416*t,.937*(1-t)+.695*t,.984*(1-t)+.902*t],k=(y*size+x)*4;for(let c=0;c<3;c++)p[k+c]=Math.round(rgb[c]*255);p[k+3]=255;
 }faces.push(p);}
 const reflection=new B.RawCubeTexture(scene,faces,size,B.Constants.TEXTUREFORMAT_RGBA,B.Constants.TEXTURETYPE_UNSIGNED_BYTE,true,false,B.Texture.TRILINEAR_SAMPLINGMODE);reflection.name='static-glass-environment29';reflection.coordinatesMode=B.Texture.CUBIC_MODE;reflection.level=.32;
 scene.metadata={...scene.metadata,sky29:{static:true,cloudClusters:clusters.length,cloudTexture:[2048,1024],reflectionFace:size,exposureChanged:false}};
 return {sky,reflection};
}
