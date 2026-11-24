"""Props, each attached to the head, shoulders, or the acting paw."""
import numpy as np
from math import sin, cos, pi
from kit import sections, stacked, rgb, mix, smooth, texcoords

def rounded_box(m,name,parent,pos,size,mat,rot=None,rad=.035):
    n=m.node(name+' pivot',parent,pos,rot);s=np.array(size)/2
    # A rounded cuboid with six tangent-continuous patches, preserving a broad flat face.
    for ax in range(3):
        for sign in (-1,1):
            def patch(u,v):
                dims=[(ax+1)%3,(ax+2)%3];p=np.zeros((*u.shape,3));p[...,ax]=sign*s[ax];p[...,dims[0]]=(2*u-1)*s[dims[0]];p[...,dims[1]]=(2*v-1)*s[dims[1]]
                a=np.clip(p,-s+rad,s-rad);d=p-a;return a+rad*d/np.maximum(np.linalg.norm(d,axis=-1,keepdims=True),1e-10)
            m.surface(name+' panel '+str(ax)+str(sign),n,patch,mat,10,8,sign<0)
    return n

def book(m,parent,pencil=False):
    ink=m.mat('Ink','686064');paper=m.mat('Paper','f6e7bf');edge=m.mat('Page edges','d8c8a7')
    cover=m.mat('Sketch cover','bd7655') if pencil else m.mat('Library green','647d6d')
    width=.184 if not pencil else .153;ht=.244 if not pencil else .199
    def half(side,yoff,zoff,layer):
        def patch(u,v):
            t=u if side>0 else 1-u
            shrink=1-.075*layer/2;x=side*(width*t*shrink);y=(2*v-1)*ht*.5*shrink+yoff;z=zoff-.060*t+.029*np.sin(pi*t)
            return stacked(x,y,z)
        m.surface(('Book ' if not pencil else 'Sketchpad ')+str(side)+' '+str(layer),parent,patch,[cover,edge,paper][layer],14,7)
    for s in (-1,1):
        for i,(y,z) in enumerate([(-.005,0),(-.001,.006),(0,.011)]):half(s,y,z,i)
        m.stroke('Bound edge '+str(s),parent,[(0,ht*.51,.009),(s*width*.55,ht*.51,.008),(s*width,ht*.51,-.02)], [.004,.004,.003],cover,6,12)
    m.stroke('Spine',parent,[(0,-ht*.52,.011),(0,.0,.011),(0,ht*.52,.011)],[.005]*3,cover,7,8)
    if pencil:
        m.stroke('Pencil drawing',parent,[(-.104,-.027,.003),(-.083,.001,.013),(-.063,-.012,.016),(-.029,.032,.020),(-.012,.018,.020)],[.0018]*5,ink,6,12)
    else:
        for s in (-1,1):
            for j in range(3):
                center=.035-j*.024
                m.stroke('Printed line',parent,[(s*.037,center,.019),(s*.073,center+.001,.016),(s*(.115 if j==2 else .140),center,.003)],[.0013]*3,edge,5,10)
        ribbon=m.mat('Cloth bookmark','b26451')
        m.stroke('Red bookmark',parent,[(.085,-.055,.011),(.085,-.105,.01),(.094,-.153,.008)],[.006,.006,.004],ribbon,6,9)

def cat_props(m,id):
    sp=m.upper;head=m.face;metal=m.mat('Soft brass','c4a16f');canvas=m.mat('Petrol canvas','466c6e');trim=m.mat('Deep teal binding','304f55')
    if id in ('bori','galpi'):
        bagroot=m.node('School bag',sp,(-.055,.365,-.264),(-.13,-.04,.065),(.94,.94,.94))
        rounded_box(m,'School backpack',bagroot,(0,.055,0),(.350,.301,.174),canvas,rad=.056)
        rounded_box(m,'Bag pocket',bagroot,(0,.010,-.079),(.252,.131,.066),trim,rad=.026)
        m.stroke('Carry loop',bagroot,[(-.055,.180,0),(-.042,.244,-.004),(.027,.245,-.008),(.049,.183,0)],[.011]*4,trim,8,16)
        strap=[(.501,2.78),(.553,2.57),(.590,1.90),(.593,1.17),(.540,.82),(.469,.77),(.398,.97),(.354,1.42),(.322,1.96),(.316,2.42),(.321,2.74)]
        for side in (-1,1):
            m.stroke('Chest harness '+str(side),sp,[m.fit_harness(y,side*a) for y,a in strap],[.014]*len(strap),canvas,10,36)
        if id=='bori':
            rounded_box(m,'Pack label',bagroot,(.037,.013,-.116),(.083,.048,.012),metal,rad=.004)
            rounded_box(m,'Bag side badge',bagroot,(-.171,.065,-.008),(.013,.046,.058),metal,rad=.005)
    if id in ('galpi','dahong'):
        center=m.node('Open book in paws',sp,(.008,.322,.354),(-.38,-.11 if id=='dahong' else .04,.018))
        book(m,center,id=='dahong')
    if id=='dahong':
        hat=m.node('Beret tilt',head,(-.068,.587,.030),(.05,.09,.25))
        red=m.mat('Persimmon wool','bb6852');band=m.mat('Beret band','9f5748')
        m.loft('Slouched beret',hat,[(-.015,-.005,-.006,.213,.186),(.005,-.012,-.005,.256,.211),(.039,-.038,-.008,.302,.229),(.080,-.055,-.013,.28,.211),(.120,-.060,-.021,.203,.158),(.162,-.060,-.011,.042,.048),(.165,-.060,-.011,.005,.005)],red,44,22)
        m.loft('Hat band',hat,[(-.026,0,-.005,.215,.185),(-.016,0,-.005,.228,.196),(.004,0,-.005,.228,.193)],band,44,5)
        m.stroke('Beret stem',hat,[(-.061,.142,-.004),(-.066,.168,-.003),(-.089,.177,.003)],[.014,.013,.007],red,9,12)
        gx,gy,gz=m.grips[1]
        holder=m.node('Pencil in paw',m.arms[1],(gx-.019,gy-.015,gz+.075),(-.65,.12,-.65))
        m.stroke('Ochre pencil',holder,[(0,-.084,0),(0,.065,0),(0,.192,0)],[.012,.012,.011],m.mat('Ochre lacquer','d8a453'),8,12)
        m.stroke('Sharpened graphite',holder,[(0,-.083,0),(0,-.107,0)],[.012,.002],m.mat('Graphite','574e4a'),8,5)
    if id=='dinga':
        case=m.node('Instrument case',sp,(-.262,.234,-.215),(.015,-.89,.73),(.75,.75,.75))
        cm=m.mat('Storm blue instrument case','485965');piping=m.mat('Woven edging','768791')
        rows=[(-.105,0,0,.022,.032),(-.091,0,0,.110,.051),(-.008,0,.006,.141,.069),(.116,0,.006,.123,.075),(.185,0,.003,.086,.059),(.262,-.005,0,.094,.057),(.342,-.011,0,.051,.045),(.71,-.015,0,.050,.042),(.772,-.015,0,.047,.034),(.790,-.015,0,.009,.009)]
        m.loft('Shaped instrument case',case,rows,cm,32,33)
        for s in (-1,1):
            m.stroke('Case piping',case,[(s*.09,-.086,-.037),(s*.139,.018,-.030),(s*.088,.181,-.030),(s*.090,.264,-.035),(s*.043-.012,.370,-.031),(s*.04-.012,.585,-.029)],[.004]*6,piping,7,22)
        belt=m.mat('Woven strap','9a785a')
        points=[m.fit_harness(y,a) for y,a in [(.354,-2.18),(.450,-1.65),(.530,-.99),(.600,-.40),(.584,.05),(.505,.32),(.412,.66),(.338,1.06),(.304,1.68),(.325,2.42)]]
        m.stroke('Crossbody strap',sp,points,[.017]*len(points),belt,9,30)
        m.stroke('Case handle',case,[(-.093,.131,.041),(-.128,.146,.051),(-.135,.216,.050),(-.092,.239,.038)],[.009]*4,belt,8,17)
    if id=='tani':
        # Match the head surface, so the band follows the brow and continues around the skull.
        from cats import CATS,SEC
        width=CATS[id][5];mint=m.mat('Mint headband','86baaa');stripe=m.mat('Light stitching','c4dcca')
        def band(u,v):
            t=2*pi*(u-.5);y=.433+.028*np.cos(t)+.012*np.sin(t)+(v-.5)*.075
            w,f,b,o=sections(SEC,y).transpose(2,0,1);c=np.cos(t)
            return stacked((w*width+.004)*np.sin(t),y,o+(np.where(c>0,f,b)+.004)*c)
        m.surface('Stretch headband',head,band,mint,64,5)
        m.surface('Band piping',head,lambda u,v:band(u,.16+v*.06)*np.array([1.002,1.,1.002]),stripe,64,2)
        for side in (-1,1):
            m.stroke('Tied band end',head,[(.338,.405,-.139),(.398,.378,-.168),(.435,.339+side*.033,-.178+side*.046)],[.019,.021,.004],mint,10,12)
        gx,gy,gz=m.grips[1]
        br=m.node('Water bottle in paw',m.arms[1],(gx+.040,gy-.004,gz+.083),(.085,0,-.12))
        bottle=m.mat('Sea glass bottle','79aca9');cap=m.mat('Bottle cap','517b76')
        m.loft('Water bottle body',br,[(-.090,0,0,.041,.041),(-.081,0,0,.050,.05),(.048,0,0,.05,.05),(.082,0,0,.035,.035),(.098,0,0,.029,.029)],bottle,23,15)
        m.loft('Bottle screw cap',br,[(.09,0,0,.03,.03),(.098,0,0,.035,.035),(.123,0,0,.034,.034),(.129,0,0,.025,.025)],cap,24,8)
    if id=='ohu':
        bag=m.mat('Linen bag','d2b995')
        rounded_box(m,'Canvas tote',sp,(-.324,.239,-.123),(.180,.202,.103),bag,(0,-.31,.05),.029)
        m.stroke('Tote handle',sp,[(-.393,.321,-.101),(-.381,.410,-.080),(-.326,.467,-.035),(-.279,.416,-.040),(-.262,.324,-.074)],[.010]*5,bag,9,23)
        cup=m.node('Tea cup between paws',sp,(0,.334,.337),(.018,0,-.015),(1.15,1.15,1.15))
        cm=m.mat('Honey ceramic','c89a62');lip=m.mat('Cup inner glaze','efe1c5');tea=m.mat('Milk tea','91674e')
        m.loft('Cup ceramic',cup,[(-.05,0,0,.038,.038),(-.045,0,0,.052,.052),(.015,0,0,.060,.06),(.064,0,0,.070,.07),(.068,0,0,.068,.068)],cm,28,12)
        circ=[(.064*cos(a),.068,.064*sin(a)) for a in np.linspace(0,2*pi,25)];m.stroke('Glazed lip',cup,circ,[.004]*2,lip,6,28)
        m.ell('Tea surface',cup,(0,.058,0),(.063,.001,.063),tea,24,6)
        m.stroke('Cup handle',cup,[(.053,.041,0),(.099,.043,0),(.102,.008,0),(.081,-.014,0),(.052,-.019,0)],[.009]*5,cm,9,18)
