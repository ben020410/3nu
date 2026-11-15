/* BUILD27 material families: geometry/window schedules remain unchanged. */
function applyMiniatureStyle(B,scene,reflection){
 for(const m of scene.materials){if(m.metadata?.gwanjeong37&&/glass/.test(m.name)&&reflection){m.reflectionTexture=reflection;const f=new B.FresnelParameters();f.bias=.08;f.power=3;f.leftColor=new B.Color3(.32,.32,.32);f.rightColor=new B.Color3(.08,.08,.08);m.reflectionFresnelParameters=f;}
  if(m.metadata?.facade53||!m.diffuseColor||m.diffuseTexture||m.name.startsWith('walker-')||m.metadata?.engineering35||m.metadata?.gwanjeong37)continue;
  const n=m.name,c=m.diffuseColor,blend=(hex,t)=>m.diffuseColor=B.Color3.Lerp(c,B.Color3.FromHexString(hex),t);
  if(/glass|glazing|window/.test(n)){
   // Preserve each building's tint instead of recolouring every window alike.
   const family=c.g>c.b? '#b0ced3':'#b4cfdf';blend(family,.70);
   m.specularColor=new B.Color3(.18,.22,.26);m.specularPower=48;m.roughness=.36;
   m.alpha=1;m.emissiveColor=B.Color3.Black();
   if(reflection){m.reflectionTexture=reflection;const f=new B.FresnelParameters();f.bias=.12;f.power=3;f.leftColor=new B.Color3(.5,.5,.5);f.rightColor=new B.Color3(.16,.16,.16);m.reflectionFresnelParameters=f;}
  }
  else if(/brick/.test(n)){blend('#bb8b77',.25);m.specularColor=B.Color3.Black();}
  else if(/foliage|leaf|crown/.test(n)){blend('#4e8d60',.48);m.specularColor=B.Color3.Black();}
  else if(/wall|white|frame|concrete|stone/.test(n)){blend('#eeeae1',.12);m.specularColor=new B.Color3(.025,.025,.025);}
  else if(/roof/.test(n)){blend('#a8b6bc',.25);}
 }
}
