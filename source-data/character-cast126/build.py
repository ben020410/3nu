"""Build the local 3NU cast from its editable surfaces and motion clips. +Z is forward."""
from pathlib import Path
from math import sin,cos,pi
import argparse
import numpy as np
from kit import qrot
from cats import cat,CATS
from birds import bird,magic_wings
from props import cat_props
HERE=Path(__file__).resolve().parent
IDS=['jaha','dongdong','seolgi','bori','galpi','dahong','dinga','tani','ohu']
def beat(t):return .5-.5*cos(2*pi*t)
def pulse(t,c,w):
    d=min(abs(t-c),1-abs(t-c))
    return .5+.5*cos(pi*d/w) if d<w else 0.
def ease(x):return x*x*(3-2*x)
def winkless_blink(m,tracks,slow=False):
    for s in (-1,1):
        tracks.append((m.morphs['Blink '+str(s)],'weights',lambda t:pulse(t,.708,.100 if slow else .035)))
def feline_motion(m, id):
    """Short standing gestures, a two-foot contact cycle, and a tucked flying pose."""
    upper, head = m.upper, m.face
    def look(t):
        p, s = beat(t), sin(2*pi*t)
        if id=='seolgi':return (-.025-.037*p,.085*s,-.045-.102*pulse(t,.31,.25))
        if id=='galpi':return (.118+.185*pulse(t,.29,.25)-.175*pulse(t,.68,.18),-.084*s,-.031*p)
        if id=='dahong':return (.083+.114*pulse(t,.27,.22),.072*s,-.151*pulse(t,.62,.27))
        if id=='bori':return (.035*p,.110*s,-.089*pulse(t,.44,.20))
        if id=='dinga':return (.070*sin(4*pi*t),.051*s,-.081*s)
        if id=='tani':return (-.049*pulse(t,.41,.27),.071*s,.065*pulse(t,.37,.21))
        return (.050+.13*pulse(t,.54,.29),.048*s,-.065*p)
    m.nodes[head]['rotation']=qrot(*look(0))
    sig=[(head,'rotation',look),
         (upper,'translation',lambda t:(0,.005*beat(t),0)),
         (m.tail,'rotation',lambda t:(.025*beat(t),.080*sin(2*pi*t),.024*sin(4*pi*t))),
         (m.morphs['Perk ears'],'weights',lambda t:.68*pulse(t,.23,.19)+.34*pulse(t,.66,.16)),
         (m.morphs['Tail tip flick'],'weights',lambda t:.63*pulse(t,.32,.23)+.22*pulse(t,.70,.14))]
    winkless_blink(m,sig,id=='ohu')
    if id=='seolgi':
        # The little paw reaches its cheek and makes two beats before tucking in.
        def wave(t):
            lift=pulse(t,.39,.30);salute=lift*(1.82+.15*sin(8*pi*t))
            return (-.72*lift,-.61*lift,salute)
        sig.append((m.arms[1],'rotation',wave))
        sig.append((upper,'rotation',lambda t:(0,0,.037*pulse(t,.40,.26))))
    elif id=='bori':
        sig.extend([(m.arms[-1],'rotation',lambda t:(-.33*pulse(t,.39,.22),0,-.21*pulse(t,.44,.21))),
                    (m.named['School bag'],'rotation',lambda t:(-.13+.047*pulse(t,.43,.21),-.04,.065-.091*pulse(t,.44,.22)))])
    elif id=='galpi':
        sig.append((m.arms[-1],'rotation',lambda t:(-.095*pulse(t,.35,.19),.025*pulse(t,.35,.19),0)))
    elif id=='dahong':
        sig.append((m.arms[1],'rotation',lambda t:(-.070*pulse(t,.38,.23),.075*sin(4*pi*t),.058*sin(4*pi*t))))
    elif id=='dinga':
        sig.append((upper,'rotation',lambda t:(0,.055*sin(2*pi*t),.035*sin(4*pi*t))))
    elif id=='tani':
        sig.append((m.arms[-1],'rotation',lambda t:(-.41*pulse(t,.45,.31),0,-.92*pulse(t,.45,.31))))
    else:
        sig.append((upper,'rotation',lambda t:(.026*pulse(t,.52,.3),0,0)))
    m.animation('Signature',sig,3.2,steps=80)

    carrying=id in ('galpi','dahong','ohu')
    walk=[(upper,'translation',lambda t:(-.010*sin(2*pi*t),-.004+.020*beat(2*t),.005*beat(t))),
          (upper,'rotation',lambda t:(.026+.013*cos(4*pi*t),.046*sin(2*pi*t),.040*sin(2*pi*t))),
          (head,'rotation',lambda t:(.027+.023*cos(4*pi*t+.18),-.021*sin(2*pi*t+.16),-.025*sin(2*pi*t-.18))),
          (m.tail,'rotation',lambda t:(.037*cos(4*pi*t),.100*sin(2*pi*t-.21),.047*sin(2*pi*t))),
          (m.morphs['Tail tip flick'],'weights',lambda t:.22+.32*beat(t-.04))]
    stance=.575
    for side in (-1,1):
        arm=m.arms[side];foot=m.legs[side];at=m.legrest[side]
        sway=.039 if carrying or (id=='tani' and side==1) else .25
        walk.append((arm,'rotation',lambda t,s=side,amp=sway:
                     (s*amp*sin(2*pi*t+.14),0,s*(.028+.022*beat(2*t)))))
        points=m.shapes[m.nodes[foot]['children'][0]][0]
        sole=points[points[:,1]<points[:,1].min()+.12]
        def step(t,s=side,origin=at,sole=sole):
            phase=(t+(.0 if s<0 else .5))%1
            if phase<stance:
                u=phase/stance
                travel=.081*cos(pi*u)
                lift=0.
                pitch=-.11*(1-u)**3+.21*u**3
                outward=0.
            else:
                u=(phase-stance)/(1-stance)
                travel=-.081*cos(pi*u)
                lift=.077*sin(pi*u)**1.50
                pitch=.21-.32*ease(u)-.115*sin(pi*u)
                outward=.012*sin(pi*u)**2
            # Solve the sole after pitching. The other foot always has a contact phase.
            min_y=np.min(sole[:,1]*cos(pitch)-sole[:,2]*sin(pitch))
            return (pitch,s*.065,0),(origin[0]+s*outward,.002+lift-min_y,origin[2]+travel)
        walk.extend([(foot,'rotation',lambda t,fn=step:fn(t)[0]),
                     (foot,'translation',lambda t,fn=step:fn(t)[1])])
    m.animation('Walk',walk,.90,steps=60)
    if m.wings:
        fly=[(m.pelvis,'translation',lambda t:(0,.25+.048*beat(t),0)),
             (upper,'rotation',lambda t:(.10+.027*sin(2*pi*t),0,.021*sin(2*pi*t))),
             (head,'rotation',lambda t:(-.092,0,.018*sin(2*pi*t))),
             (m.tail,'rotation',lambda t:(.14+.026*beat(t),.105*sin(2*pi*t),0)),
             (m.morphs['Tail tip flick'],'weights',lambda t:.46+.27*beat(t))]
        for side,wing in m.wings:
            fly.extend([(wing,'scale',lambda t:(1,1,1)),
                        (wing,'rotation',lambda t,s=side:(.05,-s*.10,s*(.21+.40*cos(2*pi*t)))),
                        (m.legs[side],'rotation',lambda t,s=side:(.53+s*.12*sin(2*pi*t),s*.08,0)),
                        (m.arms[side],'rotation',lambda t,s=side:(-.085,0,s*(.36+.061*beat(t))))])
        m.animation('Flight',fly,.88)

def bird_motion(m,id):
    crane=id=='jaha';sp=m.pelvis;head=m.face;pos=m.nodes[head]['translation']
    sig=[(head,'rotation',lambda t:(.092*beat(t) if crane else -.060*beat(t),(.26 if crane else .13)*sin(2*pi*t),.052*sin(2*pi*t) if crane else -.12*pulse(t,.32,.24)+.061*pulse(t,.67,.22))),
         (m.tail,'rotation',lambda t:(.04*beat(t),.13*sin(2*pi*t),0))]
    winkless_blink(m,sig)
    if crane:sig.append((head,'translation',lambda t:(pos[0],pos[1]+.012*beat(t),pos[2]+.047*beat(t))))
    else:
        for s,n in m.legs.items():
            p=m.legrest[s];c=.32 if s<0 else .64
            sig.append((n,'translation',lambda t,p=p,c=c:(p[0],p[1]+.041*pulse(t,c,.22),p[2]+.021*pulse(t,c,.22))))
    m.animation('Signature',sig,3.2,80)
    walk=[(sp,'translation',lambda t:(.015*sin(2*pi*t),.008+.013*beat(2*t),0)),
          (head,'rotation',lambda t:(.029*cos(4*pi*t),.038*sin(2*pi*t),.046*sin(2*pi*t))),
          (m.tail,'rotation',lambda t:(.067*cos(4*pi*t),.18*sin(2*pi*t),.024*sin(2*pi*t)))]
    for s in (-1,1):
        p=m.legrest[s]
        walk.extend([(m.legs[s],'rotation',lambda t,s=s:(s*(.36 if crane else .30)*sin(2*pi*t),0,s*.025*sin(2*pi*t))),
                     (m.legs[s],'translation',lambda t,s=s,p=p:(p[0],p[1]+.030*max(0,s*cos(2*pi*t))**2,p[2])),
                     (m.arms[s],'rotation',lambda t,s=s:((.65 if crane else .82)-s*.11*sin(2*pi*t),0,s*(.045+.028*cos(2*pi*t))))])
    m.animation('Walk',walk,.90)
    fly=[(sp,'translation',lambda t:(0,.249+.047*beat(t),0)),(head,'rotation',lambda t:(-.077+.021*sin(2*pi*t),0,.020*sin(2*pi*t))),(m.tail,'rotation',lambda t:(-.095,.12*sin(2*pi*t),0))]
    for s,n in m.wings:
        fly.extend([(n,'scale',lambda t:(1,1,1)),(n,'rotation',lambda t,s=s:(.13,-s*.16,s*(.19+.43*cos(2*pi*t)))),
                    (m.legs[s],'rotation',lambda t,s=s:(.51+s*.076*sin(2*pi*t),0,s*.051)),(m.arms[s],'rotation',lambda t,s=s:(.55 if crane else .75,-s*.06,s*.145))])
        if crane:fly.append((m.arms[s],'scale',lambda t:(.26,.32,.28)))
    m.animation('Flight',fly,.88)
def make(id,detail=1.):
    if id in CATS:
        m=cat(id,detail)
        if id=='seolgi':magic_wings(m,.483,-.169)
        else:cat_props(m,id)
        feline_motion(m,id)
    else:
        m=bird(id,detail)
        if id=='dongdong':m.nodes[m.pelvis]['scale']=[1.12,.92,1.15]
        bird_motion(m,id)
    return m
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('ids',nargs='*');args=ap.parse_args()
    dest=HERE.parent/'models';dest.mkdir(exist_ok=True);lite=dest/'lite';lite.mkdir(exist_ok=True)
    for id in args.ids or IDS:make(id).save(dest,id);make(id,.54).save(lite,id,False)
