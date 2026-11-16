/* A static directional sky: one dome, one baked 2048x1024 cloud atlas.
   No clock, animation, planar billboards, render targets or moving shadows. */
function createClearSky29(B,scene){
 const tex=new B.DynamicTexture('clear-sky-atlas97',{width:8,height:8},scene,false);tex.getContext().clearRect(0,0,8,8);tex.update();const clusters=[];
 const outline=[[-4,-1],[-3,-1],[-3,-2],[-1,-2],[-1,-3],[1,-3],[1,-2],[3,-2],[3,-1],[4,-1],[4,1],[2,1],[2,2],[0,2],[0,3],[-2,3],[-2,2],[-4,2]];
 const cloudMat=new B.StandardMaterial('cloud97',scene);cloudMat.diffuseColor=B.Color3.FromHexString('#f4fbff');cloudMat.emissiveColor=B.Color3.FromHexString('#8c9da8').scale(.25);cloudMat.specularColor=B.Color3.Black();cloudMat.alpha=.68;cloudMat.backFaceCulling=true;cloudMat.needDepthPrePass=true;
 const source=B.MeshBuilder.ExtrudePolygon('cloud97-source',{shape:outline.map(([x,z])=>new B.Vector3(x,0,z*.63)),depth:.18},scene,earcut);source.material=cloudMat;source.isVisible=false;
 [[-220,222,-100,15,0],[-40,248,-400,20,.12],[200,245,-40,17,-.08],[-410,235,-350,16,.04],[400,255,-550,22,.1],[-75,210,570,15,.03],[460,240,600,18,-.05],[-600,230,480,19,.07]].forEach(([x,y,z,s,a],i)=>{const m=source.createInstance('cloud97-'+i);m.position.set(x,y,z);m.scaling.setAll(s);m.rotation.y=a;m.isPickable=false;m.receiveShadows=false;m.freezeWorldMatrix();clusters.push(m);});
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
 scene.metadata={...scene.metadata,sky29:{static:true,cloudClusters:clusters.length,cloudTexture:[8,8],reflectionFace:size,exposureChanged:false}};
 return {sky,reflection};
}
