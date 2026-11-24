"""Small indexed-mesh and glTF helpers for the local 3NU character study. Y is up, +Z is the face."""
from pathlib import Path
import base64, io, json, struct
import numpy as np
from PIL import Image
from math import pi, sin, cos

def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0.,1.)
    return t*t*(3-2*t)

def rgb(h):
    return np.frombuffer(bytes.fromhex(h.lstrip('#')),dtype=np.uint8).astype(float)/255

def linear(a):
    a=np.asarray(a);return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)

def mix(a,b,k):
    return a*(1-np.asarray(k)[...,None])+b*np.asarray(k)[...,None]

def texcoords(w,h):
    return np.meshgrid((np.arange(w)+.5)/w,1-(np.arange(h)+.5)/h)

def sections(rows, y):
    """Shape-preserving Hermite interpolation, including flat shoulders and rounded soles."""
    a=np.array(rows,float);k=a[:,0];p=a[:,1:];h=np.diff(k);d=np.diff(p,axis=0)/h[:,None]
    m=np.zeros_like(p);m[0]=d[0];m[-1]=d[-1]
    for i in range(1,len(k)-1):
        v,w=d[i-1],d[i];s=(2*h[i]+h[i-1]);t=(h[i]+2*h[i-1])
        den=s*np.where(abs(w)>1e-12,w,1)+t*np.where(abs(v)>1e-12,v,1)
        m[i]=np.where((v*w>0)&(abs(den)>1e-12),(s+t)*v*w/np.where(abs(den)>1e-12,den,1),0)
    y=np.clip(np.asarray(y),k[0],k[-1]);i=np.clip(np.searchsorted(k,y,side='right')-1,0,len(k)-2)
    x=((y-k[i])/h[i])[...,None];hh=h[i][...,None]
    return (1+2*x)*(1-x)**2*p[i]+x*(1-x)**2*hh*m[i]+x*x*(3-2*x)*p[i+1]+x*x*(x-1)*hh*m[i+1]

def qrot(x=0,y=0,z=0):
    cx,cy,cz=np.cos(np.array([x,y,z])*.5);sx,sy,sz=np.sin(np.array([x,y,z])*.5)
    return [sx*cy*cz+cx*sy*sz,cx*sy*cz-sx*cy*sz,cx*cy*sz+sx*sy*cz,cx*cy*cz-sx*sy*sz]

def stacked(x,y,z):
    return np.stack(np.broadcast_arrays(x,y,z),axis=-1)

class Model:
    def __init__(self,title):
        self.bin=bytearray();self.views=[];self.acc=[];self.meshes=[];self.nodes=[];self.materials=[];self.textures=[];self.images=[];self.animations=[];self.named={};self.material_cache={}
        self.shapes={};self.morphs={};self.detail=1.;self.root=self.node(title);self.pelvis=self.node('Body motion',self.root)
    def view(self,b,target=None):
        self.bin.extend(bytes(-len(self.bin)%4));v=dict(buffer=0,byteOffset=len(self.bin),byteLength=len(b))
        if target:v['target']=target
        self.views.append(v);self.bin.extend(b);return len(self.views)-1
    def accessor(self,a,typ,target=None,idx=False,bounds=False):
        a=np.ascontiguousarray(a,dtype='<u2' if idx else '<f4')
        d=dict(bufferView=self.view(a.tobytes(),target),componentType=5123 if idx else 5126,count=len(a),type=typ)
        if bounds:
            d['min']=np.atleast_1d(a.min(axis=0)).tolist();d['max']=np.atleast_1d(a.max(axis=0)).tolist()
        self.acc.append(d);return len(self.acc)-1
    def node(self,name,parent=None,pos=None,rot=None,scale=None):
        n={'name':name}
        if pos is not None:n['translation']=list(map(float,pos))
        if rot is not None:n['rotation']=qrot(*rot)
        if scale is not None:n['scale']=list(scale)
        i=len(self.nodes);self.nodes.append(n);self.named[name]=i
        if parent is not None:self.nodes[parent].setdefault('children',[]).append(i)
        return i
    def mat(self,name,color='ffffff',rough=.87,image=None):
        if name in self.material_cache:return self.material_cache[name]
        p=dict(baseColorFactor=[*linear(rgb(color)).tolist(),1.],metallicFactor=0.,roughnessFactor=rough)
        if image is not None:
            io_=io.BytesIO();Image.fromarray(np.uint8(np.clip(image,0,1)*255+.5)).save(io_,format='PNG',compress_level=6)
            self.images.append(dict(mimeType='image/png',bufferView=self.view(io_.getvalue())))
            self.textures.append(dict(source=len(self.images)-1));p['baseColorTexture']={'index':len(self.textures)-1}
        i=len(self.materials);self.materials.append(dict(name=name,pbrMetallicRoughness=p));self.material_cache[name]=i;return i
    def surface(self,name,parent,fn,mat,nu=40,nv=24,reverse=False,normal_finish=None):
        nu=max(5,round(nu*self.detail));nv=max(3,round(nv*self.detail))
        u,v=np.meshgrid(np.linspace(0.,1.,nu+1),np.linspace(0.,1.,nv+1));P=fn(u,v).reshape(-1,3)
        U=np.stack((u,1-v),axis=-1).reshape(-1,2)
        ij=np.arange(nv*(nu+1)).reshape(nv,nu+1)[:,:-1].ravel();lo=ij+nu+1
        I=np.stack([ij,ij+1,lo,ij+1,lo+1,lo],axis=-1).reshape(-1,3)
        if reverse:I=I[:,::-1]
        return self.mesh(name,parent,P,I,mat,U,normal_finish)
    def mesh(self,name,parent,P,I,mat,U=None,normal_finish=None):
        P=np.asarray(P,dtype=float);I=np.asarray(I,dtype=np.int64)
        cross=np.cross(P[I[:,1]]-P[I[:,0]],P[I[:,2]]-P[I[:,0]]);valid=np.linalg.norm(cross,axis=1)>1e-12;I=I[valid];cross=cross[valid]
        N=np.zeros_like(P)
        for j in range(3):np.add.at(N,I[:,j],cross)
        _,groups=np.unique(np.round(P,6),axis=0,return_inverse=True);sums=np.zeros((groups.max()+1,3));np.add.at(sums,groups,N);N=sums[groups]
        mag=np.linalg.norm(N,axis=1);N[mag<1e-8]=[0,1,0];N/=np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-12)
        if normal_finish is not None:
            N=normal_finish(P,N)
            N/=np.maximum(np.linalg.norm(N,axis=1,keepdims=True),1e-12)
        a={'POSITION':self.accessor(P,'VEC3',34962,bounds=True),'NORMAL':self.accessor(N,'VEC3',34962)}
        if U is not None:a['TEXCOORD_0']=self.accessor(U,'VEC2',34962)
        i=self.node(name,parent);self.nodes[i]['mesh']=len(self.meshes)
        self.meshes.append({'name':name,'primitives':[dict(attributes=a,indices=self.accessor(I.ravel(),'SCALAR',34963,idx=True),material=mat)]})
        self.shapes[i]=(P,I,N,U);return i
    def morph(self,node,name,target):
        P,I,N,U=self.shapes[node];P1=np.asarray(target(P.copy(),U.copy()),float)
        cr=np.cross(P1[I[:,1]]-P1[I[:,0]],P1[I[:,2]]-P1[I[:,0]])
        N1=np.zeros_like(P1)
        for j in range(3):np.add.at(N1,I[:,j],cr)
        _,ind=np.unique(np.round(P,6),axis=0,return_inverse=True)
        sums=np.zeros((ind.max()+1,3));np.add.at(sums,ind,N1);N1=sums[ind]
        mag=np.linalg.norm(N1,axis=1);N1[mag<1e-9]=N[mag<1e-9];N1/=np.maximum(np.linalg.norm(N1,axis=1,keepdims=True),1e-12)
        mesh=self.meshes[self.nodes[node]['mesh']]
        mesh['primitives'][0]['targets']=[{'POSITION':self.accessor(P1-P,'VEC3',34962,bounds=True),'NORMAL':self.accessor(N1-N,'VEC3',34962)}]
        mesh['weights']=[0.];mesh['extras']={'targetNames':[name]};self.morphs[name]=node
    def ell(self,name,parent,center,radii,mat,nu=24,nv=16):
        def sample(u,v):
            t=2*pi*(u-.5);a=pi*v;return np.asarray(center)+np.asarray(radii)*stacked(np.sin(a)*np.sin(t),-np.cos(a),np.sin(a)*np.cos(t))
        return self.surface(name,parent,sample,mat,nu,nv)
    def loft(self,name,parent,rows,mat,nu=36,nv=24):
        def sample(u,v):
            y=rows[0][0]+(rows[-1][0]-rows[0][0])*(.5-.5*np.cos(pi*v));x,z,w,d=sections(rows,y).transpose(2,0,1);a=2*pi*(u-.5)
            return stacked(x+w*np.sin(a),y,z+d*np.cos(a))
        return self.surface(name,parent,sample,mat,nu,nv)
    def stroke(self,name,parent,points,radii,mat,sides=12,steps=22):
        sides=max(5,round(sides*self.detail));steps=max(5,round(steps*self.detail))
        points=np.array(points,float);ts=np.linspace(0,1,len(points));ss=np.linspace(0,1,steps+1);t=np.interp(ss,ts,np.arange(len(ts)))
        i=np.minimum(t.astype(int),len(ts)-2);f=(t-i)[:,None];A,B,C,D=points[np.maximum(i-1,0)],points[i],points[i+1],points[np.minimum(len(ts)-1,i+2)]
        C0=.5*((2*B)+(-A+C)*f+(2*A-5*B+4*C-D)*f*f+(-A+3*B-3*C+D)*f**3)
        tang=np.gradient(C0,axis=0);tang/=np.linalg.norm(tang,axis=1)[:,None]
        v0=np.array([0.,1.,0.]) if abs(tang[0,1])<.9 else np.array([0.,0.,1.])
        Ax=[];Ay=[]
        for d in tang:
            v0=v0-d*np.dot(v0,d);v0/=np.linalg.norm(v0);Ax.append(v0.copy());Ay.append(np.cross(d,v0))
        rr=np.interp(ss,np.linspace(0,1,len(radii)),radii);ang=np.linspace(-pi,pi,sides+1)
        P=C0[:,None,:]+rr[:,None,None]*(np.array(Ax)[:,None,:]*np.cos(ang)[None,:,None]+np.array(Ay)[:,None,:]*np.sin(ang)[None,:,None])
        detail=self.detail;self.detail=1.
        idx=self.surface(name,parent,lambda u,v:P,mat,sides,steps)
        self.detail=detail;return idx
    def animation(self,name,tracks,duration,steps=32):
        ts=np.linspace(0.,duration,steps+1);idx=self.accessor(ts,'SCALAR',bounds=True);sam=[];chs=[]
        for node,prop,fun in tracks:
            arr=np.array([fun(t/duration) for t in ts],dtype=float)
            if prop=='rotation':
                arr=np.array([qrot(*a) for a in arr])
                for i in range(1,len(arr)):
                    if np.dot(arr[i],arr[i-1])<0:arr[i]*=-1
            o=self.accessor(arr,'VEC4' if prop=='rotation' else 'SCALAR' if prop=='weights' else 'VEC3')
            sam.append(dict(input=idx,output=o,interpolation='LINEAR'));chs.append(dict(sampler=len(sam)-1,target=dict(node=node,path=prop)))
        self.animations.append(dict(name=name,samplers=sam,channels=chs))
    def save(self,path,id,browser=True):
        self.bin.extend(bytes(-len(self.bin)%4));doc=dict(asset={'version':'2.0','generator':'3NU character workshop'},scene=0,scenes=[{'nodes':[self.root]}],nodes=self.nodes,meshes=self.meshes,materials=self.materials,accessors=self.acc,bufferViews=self.views,buffers=[{'byteLength':len(self.bin)}],animations=self.animations)
        if self.images:doc.update(images=self.images,textures=self.textures)
        j=json.dumps(doc,separators=(',',':'),ensure_ascii=False).encode();j+=b' '*(-len(j)%4)
        b=struct.pack('<4sII',b'glTF',2,28+len(j)+len(self.bin))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(self.bin),b'BIN\0')+self.bin
        (path/(id+'.glb')).write_bytes(b)
        if browser:(path/(id+'.js')).write_text("window.castModel('"+id+"','"+base64.b64encode(b).decode()+"');")
        print(f'{id:9s} {sum(self.acc[p["indices"]]["count"] for m in self.meshes for p in m["primitives"])//3:6,d} triangles {len(b)//1024:4} KiB')
