"""Bake the approved 3NU character surfaces into a single animated draw per actor.
The game and the title share the same packed vertices, atlas, rest pose and clips.
Run with Python, numpy and Pillow. The editable models live in source-data.
"""
from pathlib import Path
import gzip, io, json, struct, sys
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "source-data/character-cast126"))
from build import IDS, make
DEST = ROOT / "dist/assets/cast126"
STRIDE = 28
FIELDS = np.dtype(dict(names=['p','n','joint','uv','morph','dp','dn'],
    formats=[('<i2',3),('i1',3),'u1',('<u2',2),'u1',('<i2',3),('i1',3)],
    offsets=[0,6,9,10,14,16,22],itemsize=STRIDE))

def data(model, accessor):
    a=model.acc[accessor]; view=model.views[a['bufferView']]
    return np.frombuffer(model.bin, '<u2' if a['componentType']==5123 else '<f4',
                         offset=view.get('byteOffset',0),count=view['byteLength']//(2 if a['componentType']==5123 else 4)).reshape(a['count'],-1)

def trs(node):
    x,y,z,w=node.get('rotation',[0,0,0,1])
    rot=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                  [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                  [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    m=np.eye(4);m[:3,:3]=rot@np.diag(node.get('scale',[1]*3));m[:3,3]=node.get('translation',[0]*3)
    return m

def atlas(model, name):
    # Bake the original painted face into the largest tile. Padding prevents mip bleed.
    img=Image.new('RGB',(512,512),'white'); tiles=[]; boxes=[]
    for mat in model.materials:
        p=mat['pbrMetallicRoughness']; color=np.array(p['baseColorFactor'][:3])
        rgb=np.uint8(np.clip(np.where(color<=.0031308,12.92*color,1.055*color**(1/2.4)-.055),0,1)*255+.5)
        if 'baseColorTexture' in p:
            source=model.images[model.textures[p['baseColorTexture']['index']]['source']]
            v=model.views[source['bufferView']];start=v.get('byteOffset',0)
            im=Image.open(io.BytesIO(model.bin[start:start+v['byteLength']])).convert('RGB')
            if im.width>=512: im.thumbnail((500,282),Image.Resampling.LANCZOS)
            else: im.thumbnail((124,76),Image.Resampling.LANCZOS)
            if not np.all(rgb==255):im=Image.fromarray((np.array(im)*rgb.astype(float)/255).astype('uint8'))
        else: im=Image.new('RGB',(4,4),tuple(rgb))
        tiles.append(im);boxes.append(None)
    x=y=h=0;pad=2
    for i in sorted(range(len(tiles)),key=lambda j:-tiles[j].height):
        im=tiles[i];w,hh=im.size
        if x+w+2*pad>512:x=0;y+=h;h=0
        if y+hh+2*pad>512:raise ValueError('atlas overflow '+name)
        block=np.pad(np.array(im),((pad,pad),(pad,pad),(0,0)),mode='edge')
        img.paste(Image.fromarray(block),(x,y));boxes[i]=[x+pad+.5,y+pad+.5,w-1,hh-1]
        x+=w+2*pad;h=max(h,hh+2*pad)
    img.save(DEST/(name+'.webp'),method=6,quality=94)
    return np.array(boxes)

def bake(name):
    model=make(name,.46 if name in IDS[:3] else .28)
    boxes=atlas(model,name); parents={c:i for i,n in enumerate(model.nodes) for c in n.get('children',[])}
    # Joint translations are local. Unanimated intermediate nodes are folded into geometry.
    active={ch['target']['node'] for a in model.animations for ch in a['channels'] if ch['target']['path']!='weights'}
    active.update([model.root,model.pelvis,model.face,*model.arms.values(),*model.legs.values()])
    ordered=sorted(active);joints={old:j for j,old in enumerate(ordered)}
    def ancestor(i):
        while i not in active: i=parents[i]
        return i
    def relative(i,stop):
        t=np.eye(4)
        while i!=stop:
            t=trs(model.nodes[i])@t;i=parents[i]
        return t
    skeleton=[]
    for i in ordered:
        n=model.nodes[i];par=ancestor(parents[i]) if i in parents else None
        if par is not None and not np.allclose(relative(parents[i],par),np.eye(4)):raise ValueError('intermediate joint transform')
        skeleton.append([n['name'],joints[par] if par is not None else -1,n.get('translation',[0]*3),n.get('rotation',[0,0,0,1]),n.get('scale',[1]*3)])
    vertices=[];indices=[];base=0;morphmap={}
    for i,n in enumerate(model.nodes):
        if 'mesh' not in n: continue
        j=ancestor(i);t=relative(i,j); normal=np.linalg.inv(t[:3,:3]).T
        m=model.meshes[n['mesh']]
        for prim in m['primitives']:
            attrs=prim['attributes'];p=data(model,attrs['POSITION'])@t[:3,:3].T+t[:3,3]
            norm=data(model,attrs['NORMAL'])@normal.T
            norm/=np.maximum(1.e-8,np.linalg.norm(norm,axis=1,keepdims=True))
            u=data(model,attrs['TEXCOORD_0']) if 'TEXCOORD_0' in attrs else np.zeros((len(p),2))
            tile=boxes[prim['material']];u=(tile[:2]+u*tile[2:])/512
            packed=np.zeros(len(p),dtype=FIELDS);packed['p']=np.rint(p*8192);packed['n']=np.rint(norm*127)
            packed['joint']=joints[j];packed['uv']=np.rint(u*65535)
            if 'targets' in prim:
                exp=m['extras']['targetNames'][0]
                slot=1 if 'Blink' in exp else 2 if 'ear' in exp.lower() else 3
                morphmap[i]=slot;packed['morph']=slot
                target=prim['targets'][0];dp=data(model,target['POSITION'])@t[:3,:3].T
                packed['dp']=np.rint(dp*8192)
                if 'NORMAL' in target:
                    dn=data(model,target['NORMAL'])@normal.T
                    packed['dn']=np.rint(np.clip(dn,-2,2)*63)
            vertices.append(packed);ix=data(model,prim['indices']).flatten();indices.append(ix.astype('int32')+base);base+=len(p)
    clips={}
    for a in model.animations:
        tracks=[];seen=set()
        for ch in a['channels']:
            prop=ch['target']['path'];ni=ch['target']['node'];s=a['samplers'][ch['sampler']]
            target=morphmap[ni] if prop=='weights' else joints[ni];key=(target,prop)
            if key in seen:continue
            seen.add(key);old=data(model,s['output']);tim=data(model,s['input']).ravel();duration=float(tim[-1])
            count=round(duration*(28 if a['name']=='Walk' else 22))+1
            new=np.stack([np.interp(np.linspace(0,duration,count),tim,col) for col in old.T],axis=1)
            if np.allclose(new,new[0]):new=new[:1]
            tracks.append([target,{'translation':'t','rotation':'q','scale':'s','weights':'w'}[prop],np.rint(new.ravel()*10000).astype(int).tolist()])
        clips[a['name']]=[round(duration,4),tracks]
    assert len(skeleton)<=12 and base<65536
    meta=json.dumps(dict(joints=skeleton,clips=clips),ensure_ascii=False,separators=(',',':')).encode()
    meta+=b' '*(-len(meta)%4)
    allindices=np.concatenate(indices).astype('<u2');blob=struct.pack('<4sIII',b'3NC1',len(meta),base,len(allindices))+meta+np.concatenate(vertices,dtype=FIELDS).tobytes()+allindices.tobytes()
    (DEST/(name+'.bin')).write_bytes(blob)
    # Compress only when the browser can inflate. The raw asset supports older WebViews.
    (DEST/(name+'.packed.bin')).write_bytes(gzip.compress(blob, compresslevel=9,mtime=0))
    if name in IDS[:3]:
        arr=np.concatenate(vertices); static=np.zeros(len(arr),dtype=np.dtype(dict(
            names=['p','n','uv'],formats=[('<i2',3),('i1',3),('<u2',2)],offsets=[0,6,10],itemsize=16)))
        world={}
        for ji,old in enumerate(ordered):
            node=model.nodes[old];parent=skeleton[ji][1];world[ji]=(world[parent] if parent>=0 else np.eye(4))@trs(node)
        for ji,trans in world.items():
            use=arr['joint']==ji
            xyz=arr['p'][use]/8192 @ trans[:3,:3].T+trans[:3,3]
            static['p'][use]=np.rint(xyz*8192)
            ns=arr['n'][use].astype(float)@np.linalg.pinv(trans[:3,:3]);ns/=np.maximum(np.linalg.norm(ns,axis=1,keepdims=True),1.e-9)
            static['n'][use]=np.rint(ns*127)
        static['uv']=arr['uv']
        # Frame from the actual resting bounds so all three posters and poses are centred.
        pt=static['p'].astype(float)/8192;lo,hi=pt.min(axis=0),pt.max(axis=0)
        center=(lo+hi)/2;scale=1.80/max(hi[1]-lo[1],hi[0]-lo[0])
        static['p']=np.rint((pt-center)*scale*8192)
        title=struct.pack('<II',base,len(allindices))+static.tobytes()+allindices.tobytes()
        (DEST/(name+'.title.bin')).write_bytes(gzip.compress(title,compresslevel=9,mtime=0))
    print(name,len(skeleton),base,len(allindices)//3,len(blob),flush=True)
if __name__=='__main__':
    DEST.mkdir(parents=True,exist_ok=True)
    for name in sys.argv[1:] or IDS:bake(name)
