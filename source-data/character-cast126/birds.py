import numpy as np
from math import pi
from kit import Model,sections,stacked,texcoords,smooth,mix,rgb
from cats import eyes

def wing_shape(m,nd,side,mat,small=False):
    # A broad leading feather and three graduated primaries fan from a common root.
    ivory=m.mat('Secondary feather ivory','f0eee3')
    length=.54 if small else .79
    for j,(end,rise,width,depth) in enumerate([(1.,.32,.088,.065),(.84,.140,.086,.055),(.65,.016,.081,.048),(.44,-.066,.073,.042)]):
        def feather(u,v):
            theta=2*pi*u;r=.5-.5*np.cos(pi*v)
            envelope=np.maximum(0,np.sin(pi*r))**.61
            sx=length*(.015+end*r)
            cy=.080*np.sin(pi*r)+rise*r*r-.012*j*(1-r)
            cz=-.115*end*r+.009*j
            return stacked(side*sx,cy+width*envelope*np.cos(theta),cz+depth*envelope*np.sin(theta))
        m.surface('Primary feather '+str(side)+' '+str(j),nd,feather,mat if j in (0,2) else ivory,20,29,side<0)

def magic_wings(m,y,z,small=True):
    pearl=m.mat('Pearl flight feathers','f7f4e8');m.wings=[]
    for s in (-1,1):
        n=m.node('Flight wing '+str(s),m.pelvis,(s*.165,y,z),scale=(.0001,)*3)
        wing_shape(m,n,s,pearl,small);m.wings.append((s,n))

def bird(id,detail=1.):
    crane=id=='jaha';m=Model('자하' if crane else '동동');m.detail=detail;sp=m.pelvis
    m.wings=[];m.arms={};m.legs={};m.legrest={};m.armrest={}
    feather=m.mat('Ivory feathers' if crane else 'Butter feathers','f3f1e8' if crane else 'f5d791')
    highlight=m.mat('Feather edging','dddeda' if crane else 'e7be78')
    ink=m.mat('Slate feet' if crane else 'Marigold feet','465365' if crane else 'd69650')
    upperBill=m.mat('Ochre beak' if crane else 'Apricot bill','dca64c' if crane else 'e6a354');billEdge=m.mat('Bill seam','a77949' if crane else 'b77844');lowerBill=m.mat('Lower bill','c89147' if crane else 'd99950')
    # One flowing breast/neck. Head pivot is buried where the feather mass meets the neck.
    if crane:
        rows=[(.33,0,-.059,.005,.006),(.38,0,-.069,.122,.169),(.49,0,-.089,.235,.292),(.63,0,-.083,.279,.323),(.75,0,-.040,.258,.288),(.87,0,.042,.195,.213),(.98,0,.095,.136,.145),(1.10,0,.102,.108,.112),(1.24,0,.099,.107,.104),(1.42,0,.133,.111,.107)]
        hp=(0,1.28,.130);hr=[(-.068,.012,.02,.025,.009),(-.040,.130,.134,.132,.01),(.023,.230,.213,.210,.005),(.125,.307,.266,.257,0),(.213,.335,.279,.270,-.006),(.282,.321,.267,.264,-.013),(.363,.268,.218,.226,-.02),(.422,.188,.153,.165,-.021),(.467,.089,.080,.076,-.021),(.477,.002,.003,.004,-.018)]
        eye=(.195,.116,.041,.048);wy=.81;ly=.51
    else:
        rows=[(.143,0,-.068,.009,.015),(.181,0,-.081,.160,.201),(.272,0,-.105,.278,.329),(.402,0,-.107,.345,.405),(.521,0,-.083,.365,.405),(.636,0,-.032,.343,.361),(.756,0,.042,.285,.274),(.858,0,.101,.217,.193),(.993,0,.120,.152,.153),(1.085,0,.118,.015,.014)]
        hp=(0,.888,.134);hr=[(-.098,.004,.01,.01,.012),(-.069,.203,.163,.150,.019),(.018,.330,.263,.256,.012),(.14,.393,.318,.315,0),(.276,.394,.326,.337,-.008),(.408,.352,.282,.304,-.014),(.509,.249,.204,.220,-.015),(.561,.126,.104,.11,-.014),(.57,.002,.004,.004,-.014)]
        eye=(.240,.140,.048,.054);wy=.723;ly=.345
    m.loft('Breast and neck' if crane else 'Duck breast',sp,rows,feather,46,33)
    m.face=m.node('Head',sp,hp)
    def secdata(u,v):
        y=hr[0][0]+(hr[-1][0]-hr[0][0])*(.5-.5*np.cos(pi*v));w,f,b,o=sections(hr,y).transpose(2,0,1);a=(u-.5)*2*pi;c=np.cos(a)
        return stacked(w*np.sin(a),y,o+np.where(c>0,f,b)*c)
    u,v=texcoords(576,320);P=secdata(u,v);x,y,z=P.transpose(2,0,1)
    coat=np.broadcast_to(rgb('f3f1e8' if crane else 'f4d99b'),(*u.shape,3)).copy()
    cheek=np.exp(-((np.abs(x)-(.193 if crane else .214))/.054)**2-((y-(.127 if crane else .152))/.024)**2)*smooth(.08,.21,z)
    coat=mix(coat,rgb('e2ad9a' if crane else 'e7b283'),cheek*(.81 if crane else .64))
    if not crane:
        brow=np.exp(-((np.abs(x)-.140)/.035)**4-((y-(.335+.047*(abs(x)-.14)))/.007)**2)*smooth(.12,.24,z)
        coat=mix(coat,rgb('a68464'),.72*brow)
    m.surface('Forehead and cheeks',m.face,secdata,m.mat('Face with painted cheeks',image=coat),64,38)
    def faceZ(x,y):
        w,f,_,o=sections(hr,y).transpose(2,0,1);return o+f*np.sqrt(np.maximum(.001,1-(x/w)**2))
    eyes(m,m.face,id,*eye,facefun=faceZ,iris='565361' if crane else '85654d')
    # Separate upper/lower profile facets share a perimeter; the beak reads as one bill in profile.
    baseZ=.209 if crane else .261;by=.123 if crane else .116
    zlen=.277 if crane else .226;bwid=.135 if crane else .176
    def bill(top):
        def fn(u,v):
            a=2*pi*u;p=.5-.5*np.cos(pi*v)
            if crane:r=np.sin(pi*p)**.60*(1.15-.62*p)
            else:r=np.sin(pi*p)**.52*(.78+.36*p)
            x=bwid*r*np.cos(a);widthH=(.055 if crane else .060)*r
            mid=by+(.009*np.sin(pi*p)-.019*p if crane else -.010+.005*np.sin(pi*p)-.016*p)
            if top:y=mid+.005+np.where(np.sin(a)>=0,np.sin(a)*widthH,np.sin(a)*.007*r)
            else:y=mid-.003+np.where(np.sin(a)>=0,np.sin(a)*.006*r,np.sin(a)*widthH*.62)
            return stacked(x,y,baseZ+zlen*p)
        return fn
    m.surface('Upper bill',m.face,bill(True),upperBill,32,28)
    m.surface('Lower bill',m.face,bill(False),lowerBill,32,28)
    if crane:
        m.stroke('Swept crown plume',m.face,[(0,.441,-.050),(-.014,.469,-.071),(-.030,.478,-.123),(-.049,.468,-.172)],[.026,.031,.024,.002],feather,14,17)
    if not crane:
        for s in (-1,1):
            m.ell('Nostril',m.face,(s*.059,by+.034,baseZ+.102),(.011,.0037,.012),billEdge,14,8)
    # Tail primaries grow from the body and give the rear a readable silhouette.
    tail=m.node('Tail',sp,(0,.58 if crane else .47,-.293 if crane else -.402));m.tail=tail
    for s in (-1,0,1):
        m.stroke('Tail feather '+str(s),tail,[(s*.027,.006,0),(s*.069,.037,-.105),(s*.093,.080,-.203),(s*.100,.105+(.043 if s==0 else 0),-.252+abs(s)*.029)],[.038,.054,.039,.002],feather,12,17)
    for s in (-1,1):
        pos=(s*(.151 if crane else .176),ly,-.015);leg=m.node('Leg '+str(s),sp,pos);m.legs[s]=leg;m.legrest[s]=pos
        if crane:
            m.stroke('Tapered shin',leg,[(0,.018,0),(0,-.105,-.008),(s*.010,-.224,-.041),(s*.006,-.314,-.012),(0,-.429,.025)],[.037,.033,.027,.026,.031],ink,14,18)
            m.ell('Foot',leg,(0,-.453,.059),(.065,.048,.110),ink)
            for toe in (-1,0,1):m.stroke('Toe',leg,[(toe*.018,-.457,.074),(toe*.040,-.475,.125),(toe*.053,-.479,.180-abs(toe)*.022)],[.019,.015,.005],ink,9,12)
        else:
            m.stroke('Duck ankle',leg,[(0,.014,0),(0,-.095,-.007),(s*.011,-.202,.006),(s*.011,-.273,.036)],[.043,.043,.038,.040],ink,16,16)
            def foot(u,v):
                a=(u-.5)*2*pi;h=np.sin(pi*v);width=.108*(1+.19*np.cos(a));r=.105+.024*np.cos(3*a)*smooth(-.2,.65,np.cos(a))
                return stacked(s*.009+h*width*np.sin(a),-.303-np.cos(pi*v)*.039,.064+h*r*np.cos(a))
            m.surface('Webbed foot',leg,foot,ink,40,18)
        arpos=(s*(.220 if crane else .282),wy-.013,.041);arm=m.node('Folded wing pivot '+str(s),sp,arpos,(.65 if crane else .82,0,s*.045),scale=(1,.96,1.20));m.arms[s]=arm;m.armrest[s]=arpos
        m.loft('Folded wing '+str(s),arm,[(-.327,s*.055,-.079,.005,.008),(-.288,s*.077,-.066,.034,.068),(-.215,s*.091,-.045,.059,.108),(-.112,s*.080,-.014,.078,.134),(-.028,s*.052,.004,.067,.117),(.043,s*.025,.003,.041,.070),(.063,0,.001,.006,.009)],feather,28,21)
        for j in range(2):
            m.stroke('Folded feather crease',arm,[(s*(.143-j*.018),-.129-j*.024,.028-j*.045),(s*(.148-j*.015),-.175-j*.024,.010-j*.05),(s*(.111-j*.011),-.226-j*.024,-.022-j*.05)],[.003,.005,.002],highlight,7,12)
    if crane:magic_wings(m,.835,-.078,False)
    else:magic_wings(m,.746,-.143)
    return m
