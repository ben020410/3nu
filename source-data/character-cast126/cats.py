import numpy as np
from math import pi, sin, cos
from kit import Model, sections, rgb, mix, smooth, texcoords, stacked

# Palette and proportion choices stay linked to the seven appearances in the live game.
CATS={
 'seolgi':('설기','f1efe9','879bae','fff9ed','98765d',1.035,.93,.96),
 'bori':('보리','edaf62','a56739','ffe4b3','765135',1.01,.95,.93),
 'galpi':('갈피','55545b','41404a','f5e9cf','80674a',.985,1.02,1.08),
 'dahong':('다홍','faebd4','b96942','fff0dc','705143',1.00,.99,.97),
 'dinga':('딩가','a6a39b','686970','edddc8','79604c',1.055,.94,.99),
 'tani':('탄이','504d58','3c3c46','5a5860','a3865b',.97,1.03,.90),
 'ohu':('오후','efdab3','d2ac78','fff0d1','796554',1.05,.94,.92),
}
# Vertex profile at each height, with cheek width, forehead, occiput and centre of the head.
SEC=[(-.121,.003,.009,.012,.038),(-.104,.142,.116,.115,.035),(-.066,.260,.191,.189,.029),(.002,.360,.263,.258,.018),(.097,.446,.309,.312,.009),(.184,.481,.340,.352,.001),(.259,.485,.349,.369,-.003),(.382,.441,.332,.367,-.008),(.489,.392,.285,.327,-.010),(.580,.310,.229,.265,-.011),(.630,.213,.162,.182,-.012),(.655,.120,.092,.104,-.013),(.664,.002,.005,.005,-.014)]

def head_surface(u,v,id,detail=False):
    _,_,_,_,_,width,_,ear=CATS[id];t=2*pi*(u-.5);ct=np.cos(t);y=-.121+.785*(.5-.5*np.cos(pi*v))
    w,f,b,o=sections(SEC,y).transpose(2,0,1);x=w*np.sin(t)*width
    cheek=.012*np.exp(-((y-.142)/.105)**2)*smooth(.63,.95,np.abs(np.sin(t)))
    x+=np.sign(x)*cheek
    z=o+np.where(ct>0,f,b)*ct
    z+=.0028*np.exp(-(x/.034)**2-((y-.16)/.026)**2)*np.maximum(ct,0)**2
    z+=.0035*np.maximum(ct,0)**2*np.exp(-((y-.163)/.072)**2)*(np.exp(-((x-.08)/.105)**2)+np.exp(-((x+.08)/.105)**2))
    side=np.where(x<0,-1.,1.);cx=.348*width
    ex=(abs(x)-cx)/(.176*width);ez=(z+.041)/.151
    r=np.sqrt(ex*ex+ez*ez+.205**2)-.205
    l=np.maximum(0,1-r);l=l*l*(2.66-1.66*l)*smooth(.36,.49,y)
    # Carve the bowl from the forward slope of the ear, with an unbroken raised outer rim.
    pocket=(ex/(.47+.10*np.clip(ez,0,1)))**2+((ez-.485)/.315)**2
    concha=(1-smooth(.0,1.45,pocket))*smooth(.35,.51,y)
    crown=.026*np.exp(-(x/.205)**2-((z+.019)/.245)**2)*smooth(.43,.62,y)
    # Both ears grow from the crown, sharing its vertices, colour and normals.
    x=x+side*l*(.040 if id!='ohu' else .050)
    y=y+crown+l*(.248*ear+side*(.009 if id in ('seolgi','dahong') else .003))-.009*concha
    z=z-l*.021-.035*concha
    if detail:return x,y,z,l,t,ct,pocket
    return stacked(x,y,z)

def face_z(x,y,id):
    width=CATS[id][5];w,f,b,o=sections(SEC,y).transpose(2,0,1);ct=np.sqrt(np.maximum(.001,1-(x/(w*width))**2))
    return o+f*ct+.0035*ct**2*np.exp(-((y-.163)/.072)**2)*(np.exp(-((x-.08)/.105)**2)+np.exp(-((x+.08)/.105)**2))

def coat_face(id):
    _,base,stripe,white,iris,width,_,ear=CATS[id]
    u,v=texcoords(896,512);x,y,z,l,t,c,pocket=head_surface(u,v,id,True)
    col=np.broadcast_to(rgb(base),(*u.shape,3)).copy();front=smooth(.02,.36,c)
    def put(h,k):
        nonlocal col
        col=mix(col,rgb(h),np.clip(k,0,1))
    # Soft colour separations are painted over the form and carry around the ears.
    lower=smooth(.415,.02,y+.045*(x/.45)**2)
    if id=='galpi':
        blaze=(.016+.113*(1-smooth(.09,.36,y)))*np.sqrt(np.clip((.41-y)/.078,0,1));bib=.075+.040*np.cos(x*12)
        put(white,front*np.maximum(smooth(.007,-.007,abs(x+.008)-blaze)*smooth(.45,.27,y),smooth(.010,-.010,y-bib)))
    elif id=='dahong':
        put('c9794a',smooth(.012,-.012,x+.140+.102*np.cos((y-.28)*7.2))*smooth(-.025,.16,y+np.maximum(-x-.20,0)))
        put('58545b',smooth(.013,-.013,abs(t-1.18)-(.57+.13*np.cos(y*6.8)))*smooth(.12,.27,y))
        put(white,lower*front*.52)
    elif id in ('bori','dinga'):
        put(white,front*smooth(.022,-.022,y-(.11+.037*np.cos(x*9)-.14*(abs(x)/.43)**2)))
        for side in [-1,1]:
            for level in [.177,.246]:
                a=abs(t);sig=smooth(.86,1.24,a)*smooth(2.88,2.10,a)
                put(stripe,.88*smooth(.007,-.007,abs(y-(level+.027*np.sin(t*1.9)+side*.005))-.022*sig)*sig*(t*side>0))
    elif id=='seolgi':put(white,.38*lower*front)
    elif id=='ohu':put(white,front*lower*.62)
    elif id=='tani':put('69626a',front*lower*.43)
    if id in ('seolgi','bori','dinga','ohu'):
        for off,length,weight in [(-.117,.124,.82),(-.010,.161,1),(.095,.117,.86)]:
            mid=.615-length*.55;sy=(y-mid)/(length*.55)
            xc=off*(1.0+.24*sy)+.007*sy*sy+.010*sy
            dist=np.sqrt(((x-xc)/(.023 if id=='seolgi' else .028))**2+sy*sy)
            put(stripe,(.38 if id=='seolgi' else .72 if id!='ohu' else .24)*weight*front*smooth(1.07,.87,dist))
    if id=='seolgi':put(stripe,.96*smooth(.045,.51,l))
    else:put(stripe,.30*smooth(.09,.93,l))
    # Recessed rose region inside a fur rim, narrowing to the rounded apex.
    ins=smooth(1.04,.78,pocket)*smooth(.09,.25,l)
    rim=smooth(1.72,1.27,pocket)*smooth(.08,.24,l)
    put('eee4dd' if id=='seolgi' else base,rim*.36)
    put('c59799' if id not in ('tani','galpi') else 'a7838c',ins)
    # The nearer fold catches more light than the cool, recessed upper pocket.
    innerlight=.22+.59*smooth(.76,.53,y)+.12*(1-smooth(.03,.67,pocket))
    put('f1c5b7' if id not in ('tani','galpi') else 'cfa7a7',ins*innerlight)
    if id=='seolgi':
        pads=np.exp(-((np.abs(x)-.058)/.073)**2-((y-.140)/.037)**2)*front
        put('fff9eb',pads*.46)
    blush=np.exp(-((abs(x)-.279*width)/.063)**2-((y-.151)/.027)**2)*front
    put('e3ad9f' if id!='tani' else 'b28283',blush*(.62 if id in ('seolgi','ohu') else .34))
    # All facial markings are flush. The side silhouette stays the coat itself.
    dx=np.abs(x);span=.064;xx=np.clip(dx/span,0,1);mouth=.120-.014*np.sin(pi*xx)+.017*xx**3
    dist=np.hypot(np.maximum(dx-span,0),y-mouth)
    put('6e514e' if id!='tani' else 'c0a097',front*smooth(.0063,.0029,dist))
    put('765854',front*smooth(.0052,.0023,np.hypot(x,y-np.clip(y,.118,.153))))
    ny=(y-.161)/.017;nx=x/(.033*(1+.43*np.clip(ny,-1,1)));nd=np.sqrt(nx*nx+ny*ny)
    put('aa7771',front*smooth(1.09,.93,nd));put('bf8980',front*smooth(1.02,.76,nd)*smooth(-.8,.6,ny))
    return col

def eye_paint(iris,dark=False,cat_eye=False):
    u,v=texcoords(256,160);rad=np.cos(v*pi/2);a=2*pi*u;x=rad*np.cos(a);y=rad*np.sin(a)
    col=np.broadcast_to(rgb('443a39' if not dark else '514548'),(*u.shape,3)).copy()
    bottom=smooth(.22,-.85,y)*smooth(.995,.80,rad)
    col=mix(col,rgb(iris),(.97 if dark else .77)*bottom)
    if dark:col=mix(col,rgb('cc9b64'),smooth(.99,.83,rad)*smooth(.66,-.50,y)*.60)
    pup=np.hypot((x+.035)/.83,(y-.159)/.88)
    col=mix(col,rgb('332f32'),smooth(1.10,.84,pup)*smooth(1.01,.94,rad))
    # The lower reflected crescent is broad and low-contrast, without a concentric iris ring.
    glow=np.exp(-((x-.10)/.52)**2-((y+.71)/.165)**2)
    col=mix(col,rgb('aa856b'),glow*.23)
    dot=np.hypot((x+.252)/(.163 if cat_eye else .157),(y-.318)/.164)
    col=mix(col,rgb('fff6e8' if cat_eye else 'fff3e0'),smooth(1.08,.82,dot))
    if cat_eye:
        bounce=np.hypot((x-.285)/.072,(y+.330)/.062)
        col=mix(col,rgb('dac6b1'),.64*smooth(1.12,.70,bounce))
    return col

def eyes(m,nd,id,centery=.268,halfw=.185,rx=.073,ry=.078,facefun=None,iris=None):
    if iris is None:iris=CATS[id][4]
    mat=m.mat('Soft gloss / '+iris,rough=.46,image=eye_paint(iris,id in ('tani','galpi'),id in CATS))
    for s in (-1,1):
        def sample(u,v):
            r=np.cos(pi/2*v);a=2*pi*u;x=s*halfw+rx*r*np.cos(a);y=centery+ry*r*np.sin(a)
            z=(facefun(x,y) if facefun else face_z(x,y,id))+.0014+.008*np.sin(pi*v/2)
            return stacked(x,y,z)
        eye=m.surface('Eye left' if s<0 else 'Eye right',nd,sample,mat,40,12)
        def shut(P,U):
            x=P[:,0];y=centery+.055*(P[:,1]-centery)+.0045*(1-((x-s*halfw)/rx)**2)
            xx=x.reshape(1,-1);yy=y.reshape(1,-1)
            z=(facefun(xx,yy) if facefun else face_z(xx,yy,id))[0]+.0025
            return np.column_stack((x,y,z))
        m.morph(eye,'Blink '+str(s),shut)

def furpaint(id,part):
    _,base,stripe,white,_,_,_,_=CATS[id]
    u,v=texcoords(256,128);t=2*pi*(u-.5)
    col=np.broadcast_to(rgb(base),(*u.shape,3)).copy()
    if part=='body':
        bib=.68+.26*np.cos(t*1.8);vmin=.19+.25*(np.abs(t)/1.5)**1.5
        mask=smooth(1.46,.91,np.abs(t))*smooth(vmin,vmin+.035,v)*smooth(bib+.05,bib-.03,v)
        col=mix(col,rgb(white),mask*(.9 if id!='seolgi' else .24));col*=1-.035*smooth(.6,.96,v)[...,None]
        if id=='dahong':
            col=mix(col,rgb('cd8661'),smooth(.09,-.02,np.abs(t+1.1)-.41)*smooth(.16,.3,v)*smooth(.77,.66,v))
            col=mix(col,rgb('615b60'),smooth(.08,-.02,np.abs(t-.97)-.28)*smooth(.39,.47,v)*smooth(.86,.75,v))
        if id=='seolgi':
            # Soft ivory bib and a small collar shadow give the pale neck definition at game scale.
            oval=(t/1.02)**2+((v-.43)/.305)**2
            col=mix(col,rgb('fff9e9'),.68*smooth(1.14,.85,oval))
    elif part=='tail':
        if id in ('dinga','bori','seolgi'):
            if id=='seolgi':col=mix(col,rgb('a9b8c3'),smooth(.11,.86,v)*.95)
            for pos in ([.44,.69] if id=='seolgi' else [.27,.47,.68,.89]):
                col=mix(col,rgb(stripe),smooth(.071,.037,abs(v-pos-.012*np.sin(t)))*(.38 if id=='seolgi' else .84))
        if id=='dahong':col=mix(col,rgb('c77950'),smooth(.3,.34,v));col=mix(col,rgb('534f57'),smooth(.68,.70,v))
        if id=='galpi':col=mix(col,rgb(white),smooth(.83,.86,v))
    else:
        mitten=part.startswith('mitten')
        polarity=-1 if part=='mitten left' else 1
        base_line=.35 if mitten else .43
        line=base_line+.037*np.cos(t)+.019*np.cos(t*2)+(.041*polarity*np.sin(t-.21) if mitten else 0)
        if part=='left' and id=='seolgi':line+=.027*np.exp(-((t+.32)/.31)**2)
        col=mix(col,rgb(stripe if id=='seolgi' else white),smooth(line+.035,line-.03,v))
        if id=='seolgi':
            toes=np.exp(-((np.abs(t)-.40)/.11)**2-((v-.179)/.071)**2)*smooth(.7,1.,np.cos(t))
            col=mix(col,rgb('6d8193'),.38*toes)
        if mitten and id=='seolgi':
            # Paint across the round end cap. Its UV pole has one colour at every angle.
            radial=np.sqrt(1-np.clip(1-v/.29,0,1)**2)
            px=-radial*np.cos(t)
            py=polarity*radial*np.sin(t)
            pad=(px/.31)**2+((py+.16-.041*np.cos(px*9))/.22)**2
            dye=smooth(1.10,.82,pad)
            for center in (-.29,0,.29):
                bean=((px-center)/.104)**2+((py-(.35-.08*abs(center)/.29))/.137)**2
                dye=np.maximum(dye,smooth(1.1,.82,bean))
            col=mix(col,rgb('deb3ad'),dye*smooth(.23,.14,v)*.85)
    return col

def cat(id, detail=1.):
    """A standing two-footed mascot with a soft belly, two little mitten paws and a raised tail."""
    name, _, _, _, _, _, tall, _ = CATS[id]
    m = Model(name)
    m.detail = detail
    base = m.pelvis
    upper = m.node('Chest sway', base)
    m.upper = upper
    m.arms, m.legs, m.armrest, m.legrest, m.grips = {}, {}, {}, {}, {}
    m.wings = []
    stock = {'seolgi': 1.045, 'bori': 1.015, 'galpi': .98, 'dahong': .99,
             'dinga': 1.045, 'tani': .985, 'ohu': 1.075}[id]
    # The cheeks rest over the shoulders. Only the softly rounded feet protrude below the belly.
    m.face = m.node('Head', upper, (0, .650 + .11 * (tall - .94), .032),
                    scale=(1.095 if id == 'seolgi' else 1.065, .888, .986))
    head = m.surface('Cheeks, crown and ears', m.face, lambda u,v: head_surface(u,v,id),
                     m.mat('Coat / '+name, image=coat_face(id)), 112, 72)

    def perk(points, uv):
        x,y,z = points.T.copy()
        weight = smooth(.51,.77,y) * smooth(.18,.36,abs(x))
        return np.column_stack((x-np.sign(x)*.036*weight, y+.025*weight, z+.033*weight))
    m.morph(head, 'Perk ears', perk)
    eyes_by_coat = {'seolgi':(.262,.171,.077,.089),'bori':(.26,.177,.068,.078),
                    'galpi':(.269,.164,.065,.074),'dahong':(.255,.169,.072,.080),
                    'dinga':(.247,.175,.069,.073),'tani':(.270,.170,.068,.079),
                    'ohu':(.248,.181,.069,.068)}
    eyes(m, m.face, id, *eyes_by_coat[id])

    rows = [(.077,-.010,.006,.008),(.089,-.015,.142,.121),(.115,-.017,.215,.180),
            (.156,-.019,.280,.224),(.215,-.019,.327,.261),(.291,-.010,.351,.280),
            (.366,.002,.347,.280),(.448,.012,.326,.262),(.517,.021,.287,.228),
            (.586,.027,.242,.191),(.637,.029,.194,.154),(.689,.031,.124,.104),
            (.715,.032,.006,.008)]
    def trunk_cross(y, a, outset=0.):
        z0, width, depth = np.moveaxis(sections(rows,y), -1, 0)
        c = np.cos(a)
        # A small forward swell in the lower tummy offsets the tucked shoulders.
        belly = .015*np.exp(-((y-.284)/.121)**2)*np.maximum(0,c)**2
        return stacked((stock*width+outset)*np.sin(a), y, z0+(depth+outset)*c+belly)
    def trunk(u,v):
        y=rows[0][0]+(rows[-1][0]-rows[0][0])*(.5-.5*np.cos(pi*v))
        return trunk_cross(y, (u-.5)*2*pi)
    m.surface('Stuffed pear-shaped body', upper, trunk, m.mat('Tummy',image=furpaint(id,'body')), 64,40)
    m.fit_harness=lambda y,a: trunk_cross(y,a,.009)

    def mitten(side, shoulder, grip_x, grip_z):
        # Cross sections follow the bent centreline, keeping the wrist round even around a book or cup.
        controls=np.array([(side*grip_x,-.177,grip_z+.039),
                           (side*(grip_x+.014),-.159,grip_z-.031),
                           (side*.063,-.045,.021),(-side*.034,.069,-.032)])
        if id=='seolgi':
            controls[1]=controls[0]+np.array([side*.028,.060,-.024])
        def mitten_surface(u,v):
            t=v[:,0,None]
            p0,p1,p2,p3=controls
            centre=(1-t)**3*p0+3*(1-t)**2*t*p1+3*(1-t)*t*t*p2+t**3*p3
            tangent=3*((1-t)**2*(p1-p0)+2*(1-t)*t*(p2-p1)+t*t*(p3-p2))
            tangent/=np.linalg.norm(tangent,axis=1,keepdims=True)
            right=np.array([1.,0.,0.])-tangent*tangent[:,0,None]
            right/=np.linalg.norm(right,axis=1,keepdims=True)
            forward=np.cross(right,tangent)
            width=np.interp(t[:,0],[0,.23,.48,.74,1],[.084,.094,.090,.080,.068])
            cap1=np.sqrt(1-np.clip((.29-t[:,0])/.29,0,1)**2)
            cap2=np.sqrt(1-np.clip((t[:,0]-.72)/.28,0,1)**2)
            radius=width*cap1*cap2
            a=(u[0]-.5)*2*pi
            ring=right[:,None,:]*np.sin(a)[None,:,None]+forward[:,None,:]*np.cos(a)[None,:,None]*.91
            return centre[:,None,:]+radius[:,None,None]*ring
        material=m.mat('Soft paw '+str(side),image=furpaint(id,'mitten left' if side<0 else 'mitten right'))
        m.surface('Mitten '+str(side),shoulder,mitten_surface,material,48,32)
        m.grips[side]=(side*(grip_x+.003),-.146,grip_z+.013)

    grip = {'galpi':(-.101,.180),'dahong':(-.099,.186),'ohu':(-.153,.211)}
    for side in (-1,1):
        carrying = id in grip
        x0 = .270 if carrying else .290
        at = (side*x0,.497,.069 if carrying else .105)
        arm = m.node('Mitten pivot '+str(side),upper,at)
        m.arms[side]=arm
        m.armrest[side]=at
        gx,gz=grip.get(id,(-.013,.131))
        if id=='seolgi' and side>0:gx,gz=-.038,.143
        if id=='bori' and side<0:gx,gz=-.019,.136
        if id=='tani' and side>0:gx,gz=-.020,.142
        mitten(side,arm,gx,gz)

        at=(side*.152,.171,.007)
        foot=m.node('Foot pivot '+str(side),base,at)
        m.legs[side]=foot
        m.legrest[side]=at
        # The ankle is entirely tucked into the body in the neutral pose.
        profile=[(-.169,0,.049,.001,.002),(-.165,side*.003,.058,.067,.088),
                 (-.153,side*.008,.067,.104,.123),(-.131,side*.011,.070,.124,.141),
                 (-.106,side*.012,.061,.131,.142),(-.083,side*.011,.047,.124,.131),
                 (-.052,side*.007,.030,.111,.110),(-.013,0,.007,.091,.088),
                 (.027,-side*.005,-.007,.075,.073),(.086,-side*.014,-.016,.054,.054),
                 (.113,-side*.017,-.016,.004,.006)]
        def foot_shape(u,v):
            lo,hi=profile[0][0],profile[-1][0]
            y=lo+(hi-lo)*(.5-.5*np.cos(pi*v))
            x,z,w,d=np.moveaxis(sections(profile,y),-1,0)
            a=(u-.5)*2*pi
            toes=np.exp(-((abs(a)-.43)/.15)**2-((y+.124)/.026)**2)*smooth(.2,.8,np.cos(a))
            return stacked(x+w*np.sin(a),y-.0025*toes,z+d*np.cos(a)-.010*toes)
        m.surface('Little foot '+str(side),foot,foot_shape,
                  m.mat('Sock '+str(side),image=furpaint(id,'left' if side<0 else 'foot')),48,26)

    # The tail begins behind the hips and ends above the mitten. Even in profile the feet read as a pair.
    toward=-1 if id in ('seolgi','dahong','ohu','tani') else 1
    m.tail=m.node('Tail',upper,(toward*.080,.215,-.157))
    path=np.array([(0,0,0),(.113,-.030,-.153),(.320,.009,-.265),(.363,.177,-.267),
                   (.406,.345,-.269),(.414,.461,-.258),(.269,.466,-.068)])
    def tail_surface(awake,u,v):
        along=v[:,0];circle=u[0]*2*pi
        seg=np.minimum((along*2).astype(int),1)*3
        t=(along*2-seg/3)[:,None]
        centers=(1-t)**3*path[seg]+3*(1-t)**2*t*path[seg+1]+3*(1-t)*t*t*path[seg+2]+t**3*path[seg+3]
        centers[:,0]*=toward
        late=smooth(.33,1.,along)
        centers[:,0]+=toward*.069*late*awake
        centers[:,1]+=.041*late*awake
        centers[:,2]+=.086*late*awake
        tangent=np.gradient(centers,axis=0);tangent/=np.linalg.norm(tangent,axis=1,keepdims=True)
        normal=np.array([0.,1.,0.]);rings=[]
        for direction in tangent:
            normal=normal-direction*np.dot(normal,direction);normal/=np.linalg.norm(normal)
            rings.append(normal*np.cos(circle[:,None])+np.cross(direction,normal)*np.sin(circle[:,None]))
        radius=np.interp(along,[0,.18,.43,.68,.85,1],[.062,.079,.088,.087,.076,.067])
        radius*=np.sqrt(1-np.clip((along-.855)/.145,0,1)**2)
        return centers[:,None,:]+radius[:,None,None]*np.asarray(rings)
    tail=m.surface('Curled brush tail',m.tail,lambda u,v:tail_surface(0,u,v),
                   m.mat('Tail markings',image=furpaint(id,'tail')),30,52)
    cols=max(5,round(30*detail))+1;rows_count=max(3,round(52*detail))+1
    grid=np.meshgrid(np.linspace(0,1,cols),np.linspace(0,1,rows_count))
    released=tail_surface(1,*grid).reshape(-1,3)
    m.morph(tail,'Tail tip flick',lambda P,U:released)
    return m
