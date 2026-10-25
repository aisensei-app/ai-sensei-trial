# デベソの仮の絵（背景透過）をつくる
import numpy as np
from PIL import Image
SS=4; W,H=52,46; w,h=W*SS,H*SS
yy,xx=np.mgrid[0:h,0:w].astype(float)
cx,cy=w/2,h/2
skin=np.array([226,161,106.])
img=np.zeros((h,w,3))+skin
# 外側：ふちをぼかして下の「へこみヘソ」を隠す
r=np.hypot((xx-cx)/(w*0.48),(yy-cy)/(h*0.48))
alpha=np.clip((1-r)/0.35,0,1)
# でっぱり（少し上寄りの楕円）
kx,ky,krx,kry=cx,cy-1.5*SS,13*SS,10.5*SS
u=(xx-kx)/krx; v=(yy-ky)/kry; d=np.hypot(u,v)
inside=d<1
nz=np.sqrt(np.clip(1-d*d,0,1))            # 球の高さ
# 光は左上から
L=np.array([-0.5,-0.6,0.62]); L/=np.linalg.norm(L)
nx,ny=u,v
shade=np.clip(nx*L[0]+ny*L[1]+nz*L[2],0,1)
knob=skin*(0.78+0.32*shade)[...,None]
# ハイライト
hl=np.exp(-(((xx-(kx-4*SS))/(3.2*SS))**2+((yy-(ky-3.5*SS))/(2.4*SS))**2))
knob=knob+(np.array([255,236,210])-knob)*(0.55*hl)[...,None]
# ふちの輪郭（うすい線）
edge=np.clip(1-np.abs(d-1)/0.09,0,1)*(0.6+0.8*np.clip(v,0,1))
knob=knob*(1-0.35*edge)[...,None]
# 下に落ちる影
sh=np.exp(-(((xx-(kx+1*SS))/(14*SS))**2+((yy-(ky+10*SS))/(3.2*SS))**2))*(d>0.92)
img=img*(1-0.28*sh)[...,None]
m=np.clip((1.04-d)/0.08,0,1)[...,None]
img=img*(1-m)+knob*m
# まんなかの結び目（小さなしわ）
c1=np.exp(-((((xx-(kx+1*SS))/(4.5*SS))**2)+(((yy-(ky+1.2*SS)-0.04*((xx-kx)/SS)**2*SS))/(0.7*SS))**2))
img=img*(1-0.38*c1)[...,None]
c2=np.exp(-((((xx-(kx+0.5*SS))/(2.5*SS))**2)+(((yy-(ky+3.2*SS)+0.06*((xx-kx)/SS)**2*SS))/(0.6*SS))**2))
img=img*(1-0.22*c2)[...,None]
out=np.dstack([np.clip(img,0,255),alpha*255]).astype(np.uint8)
Image.fromarray(out,'RGBA').resize((W,H),Image.LANCZOS).save('images/parts/debeso.webp',lossless=True)
