/* BUILD48: approved Pungsan replacement; tagged structures below remain unchanged. */
function buildPungsan(B,scene,b,height){
 if(!b.pungsan48)throw Error("Missing Pungsan BUILD48 geometry");
 Pungsan48.build(B,scene,b.pungsan48);b.base=b.pungsan48.base;b.top=b.base+9;
}
// Explicit OSM structure tags override generic 16 m extrusion. Heights are provisional.
function buildTaggedStructure(B,scene,b,height){
 const V=(x,y,z)=>new B.Vector3(x,y,z),base=height(...b.center),mat=new B.StandardMaterial('structure-'+b.id,scene);mat.diffuseColor=B.Color3.FromHexString('#c8c5b4');
 const roof=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-elevated-deck',{shape:b.p.map(q=>V(q[0],0,q[1])),depth:.35,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);roof.position.y=base+b.h;roof.material=mat;roof.freezeWorldMatrix();
 for(const q of b.supports13||[]){const post=B.MeshBuilder.CreateCylinder('building-'+b.id+'-support',{height:b.h-.35,diameter:.3,tessellation:8},scene);post.position=V(q[0],base+(b.h-.35)/2,q[1]);post.material=mat;post.freezeWorldMatrix();}b.base=base;b.top=base+b.h;
}
function buildUtility14(B,scene,b,height){
 const base=Math.min(...b.p.map(q=>height(...q)))-.3,top=height(...b.center)+(b.utilityHeight14||4),V=q=>new B.Vector3(q[0],0,q[1]);
 const m=new B.StandardMaterial('utility14-'+b.id,scene);m.diffuseColor=B.Color3.FromHexString('#d9d4c5');m.specularColor=B.Color3.Black();
 const body=B.MeshBuilder.ExtrudePolygon('building-'+b.id+'-utility',{shape:b.p.map(V),depth:top-base,sideOrientation:B.Mesh.DOUBLESIDE},scene,earcut);body.position.y=top;body.material=m;body.freezeWorldMatrix();
 b.base=base;b.top=top;
}
