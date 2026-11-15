/* BUILD36: original SNU artwork matching the user's supplied logo.
 * The source PNG is already transparent. Only its bottom 337 x 40 pixel
 * wordmark is sampled, keeping the actual glyphs instead of substituting a font.
 */
(function(root){
'use strict';
root.Logo30136={render(B,scene,state){
 const old=scene.getMeshByName('301-wall-engineering-lettering36');if(old)return old;
 const model=state.models.find(m=>m.number==='301');if(!model)return null;
 const w=11.56,h=w*40/337,position=model.world([81,38.62,41]);
 const tex=new B.Texture('assets/snu-engineering-ui-original.png',scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE);
 tex.name='301-engineering-original-wordmark36';
 tex.hasAlpha=true;
 tex.wrapU=B.Texture.CLAMP_ADDRESSMODE;tex.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 // Texture upload flips Y: v=0..0.2 selects source rows 160..199. The crest is excluded.
 tex.uScale=1;tex.uOffset=0;tex.vScale=40/200;tex.vOffset=0;
 const mat=new B.StandardMaterial('301-wall-lettering-material36',scene);
 mat.diffuseTexture=tex;mat.opacityTexture=tex;mat.useAlphaFromDiffuseTexture=true;
 mat.diffuseColor=B.Color3.White();mat.emissiveColor=new B.Color3(.24,.24,.24);
 mat.specularColor=B.Color3.Black();mat.backFaceCulling=false;
 mat.transparencyMode=B.Material.MATERIAL_ALPHATEST;mat.alphaCutOff=.25;
 mat.metadata={engineering35:true,wallLogo36:true};
 const mesh=B.MeshBuilder.CreatePlane('301-wall-engineering-lettering36',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);
 mesh.position=new B.Vector3(...position);
 // The north facade faces +world-Z; this keeps the word readable from the plaza.
 mesh.rotation.y=Math.PI;mesh.material=mat;mesh.isPickable=false;
 mesh.metadata={engineering35:true,facilityId:model.fit.id,wallLogo36:true,text:'ENGINEERING',fontStatus:'Original supplied artwork; no font substitution',sourceImage:'assets/snu-engineering-ui-original.png',sourceCrop:[0,160,337,40]};
 mesh.freezeWorldMatrix();return mesh;
}};
})(typeof globalThis!=='undefined'?globalThis:this);
