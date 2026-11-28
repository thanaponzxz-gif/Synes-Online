"""Assemble private review renders without external image packages or services."""
import bpy
import numpy as np
import struct
import zlib
from pathlib import Path
OUT=Path(__file__).resolve().parents[3]/'assets'/'_inbox'
def png(path,a):
 h,w,_=a.shape
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
 raw=b''.join(b'\0'+r.tobytes() for r in a)
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))
def sheet(name,labels,cols):
 rows=(len(labels)+cols-1)//cols;a=np.full((rows*720,cols*720,3),70,np.uint8)
 for i,label in enumerate(labels):
  im=bpy.data.images.load(str(OUT/('concept_boss_crab_c1_v01_'+label+'.png')),check_existing=False)
  # Review PNGs are display pixels; bypass linear color conversion for copying.
  im.colorspace_settings.name='Non-Color'
  data=np.empty(720*720*4,np.float32);im.pixels.foreach_get(data)
  data=np.clip(np.round(data.reshape(720,720,4)[::-1,:,:3]*255),0,255).astype(np.uint8)
  r,c=divmod(i,cols);a[r*720:(r+1)*720,c*720:(c+1)*720]=data
  bpy.data.images.remove(im)
 png(OUT/name,a)
sheet('concept_boss_crab_turnaround_v01.png',['front','side','back','q'],2)
sheet('concept_boss_crab_posecheck_v01.png',['walk','sweep_hit','slam_windup','slam_hit','charge','shard_cast','stunned','down'],4)
print('CRAB_SHEETS complete',flush=True)
