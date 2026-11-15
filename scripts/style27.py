from pathlib import Path
import re
D=Path('dist')
p=D/'app.js';s=p.read_text();s=s.replace('#cfdfec','#c9e6f6').replace('#79b7d1','#70b9ea').replace('#cbdfea','#c9e7f8').replace('#e6e9dc','#e3f1fa').replace('light.intensity=.85','light.intensity=.82').replace("'#90958b'","'#bdcbd5'").replace('sun.intensity=.88','sun.intensity=.92').replace("'#fff1dc'","'#fff8ec'").replace('scene.fogDensity=.00016','scene.fogDensity=.000095');s=s.replace("'#9baa7b'","'#8ebc76'").replace("['#e9e0cb','#d8c8af','#c4d3ca','#e0d7bc']","['#ede9df','#e5d5c3','#d9e2df','#e8e1d5']")
# Damp the vertical follow target, not the player's physical feet or collision camera ray.
s=s.replace('let nameTick=0;', 'let nameTick=0, smoothFocusY=null;')
s=s.replace('const focus=player.position.add(V(0,.8,0));let cam;', 'const desiredFocusY=player.position.y+.8;if(smoothFocusY===null||Math.abs(desiredFocusY-smoothFocusY)>6)smoothFocusY=desiredFocusY;else smoothFocusY+=(desiredFocusY-smoothFocusY)*(1-Math.exp(-14*dt));const focus=V(player.position.x,smoothFocusY,player.position.z);let cam;')
p.write_text(s)
p=D/'render-quality.js';s=p.read_text().replace('TONEMAPPING_ACES','TONEMAPPING_STANDARD').replace('ic.exposure=1.12;ic.contrast=1.08','ic.exposure=1.0;ic.contrast=1.0');p.write_text(s)
p=D/'ground-surface.js';s=p.read_text();s=s.replace('grass:[153,173,121]','grass:[124,172,103]').replace('lawn:[143,164,103]','lawn:[113,170,91]').replace('planting:[121,139,87]','planting:[99,146,82]').replace('road:[120,128,127]','road:[131,139,146]').replace('path:[199,193,172]','path:[216,213,203]').replace('plaza:[224,218,199]','plaza:[222,220,211]').replace('steps:[178,171,156]','steps:[207,206,197]').replace('rearPaving:[187,190,185]','rearPaving:[207,211,210]').replace('wood:[88,111,72]','wood:[89,132,84]').replace('water:[72,110,94]','water:[77,143,147]');p.write_text(s)
p=D/'miniature-style.js';p.write_text('''/* BUILD27 material families: geometry/window schedules remain unchanged. */
function applyMiniatureStyle(B,scene){
 for(const m of scene.materials){
  if(!m.diffuseColor||m.diffuseTexture||m.name.startsWith('walker-'))continue;
  const n=m.name,c=m.diffuseColor,blend=(hex,t)=>m.diffuseColor=B.Color3.Lerp(c,B.Color3.FromHexString(hex),t);
  if(/glass|glazing|window/.test(n)){blend('#8eb6c8',.55);m.specularColor=new B.Color3(.22,.27,.30);m.specularPower=64;}
  else if(/brick/.test(n)){blend('#bb8b77',.25);m.specularColor=B.Color3.Black();}
  else if(/foliage|leaf|crown/.test(n)){blend('#4e8d60',.48);m.specularColor=B.Color3.Black();}
  else if(/wall|white|frame|concrete|stone/.test(n)){blend('#eeeae1',.12);m.specularColor=new B.Color3(.025,.025,.025);}
  else if(/roof/.test(n)){blend('#a8b6bc',.25);}
 }
}
''')
p=D/'scene-details.js';s=p.read_text().replace("'#607e5c'","'#568d61'").replace("'#cbc5b5'","'#e0dcd2'").replace("'#719397'","'#86acbe'").replace("'#9caa9f'","'#bdc9c9'").replace("'#b7b8a2'","'#d6d6ce'");s=s.replace('road&&road.d<6','road&&road.d<road.seg.width/2+2') if 'road.seg.width' in s else s
# Existing roadAt uses s field, inspect separately before changing clearances.
p.write_text(s)
p=D/'character.js';s=p.read_text().replace('animate(dt,moving,airborne,flying){phase+=dt*(flying?7:moving?10:2);','animate(dt,moving,airborne,flying,speed=12){phase+=dt*(flying?7:moving?Math.min(20,6+speed*.34):2);');p.write_text(s)
p=D/'app.js';s=p.read_text().replace('jump.airborne,flying);','jump.airborne,flying,12*speedMultiplier*(sprint||keys.ShiftLeft?1.75:1));');p.write_text(s)
# Invalidate every changed module AND data request (previous versions mixed v24/v25).
for p in [D/'index.html',D/'app.js',D/'ground-surface.js']:
 s=p.read_text();s=re.sub(r'\?v=\d+', '?v=27',s);p.write_text(s)
