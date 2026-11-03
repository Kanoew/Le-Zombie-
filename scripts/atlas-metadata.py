"""Read transparency to index generated artwork; never resample or modify the PNGs."""
from PIL import Image
from collections import deque
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
atlases={}
for name,file in [('machete','hero-atlas.png'),('sabre','hero-sabre.png'),('hatchet','hero-hatchet.png'),('infected','infected.png'),('brute','brute.png'),('echo','echo.png')]:
 im=Image.open(root/'assets'/file);w,h=im.size;alpha=im.getchannel('A');raw=alpha.tobytes();mask=bytearray(v>127 for v in raw);parts=[]
 for i in range(w*h):
  if not mask[i]:continue
  mask[i]=0;q=deque([i]);n=0;x0=w;y0=h;x1=y1=0
  while q:
   k=q.popleft();x=k%w;y=k//w;n+=1;x0=min(x0,x);x1=max(x1,x);y0=min(y0,y);y1=max(y1,y)
   for v in ([k-1] if x else [])+([k+1] if x<w-1 else [])+([k-w] if y else [])+([k+w] if y<h-1 else []):
    if mask[v]:mask[v]=0;q.append(v)
  if n>1500:parts.append((x0,y0,x1+1,y1+1,n))
 if len(parts)!=64:raise ValueError(f'{file}: expected 64 connected sprites, got {len(parts)}')
 rows=[]
 for row in range(8):
  cells=sorted([p for p in parts if round(((p[1]+p[3])/2)/(h/8)-.5)==row],key=lambda p:p[0])
  if len(cells)!=8:raise ValueError(f'{file}: row {row} has {len(cells)} sprites')
  frames=[]
  for x0,y0,x1,y1,n in cells:
   feet=[(x,raw[y*w+x]) for y in range(y1-7,y1) for x in range(x0,x1) if raw[y*w+x]>127]
   anchor=sum(x*a for x,a in feet)/sum(a for x,a in feet)
   frames.append({'x':max(0,x0-2),'y':max(0,y0-2),'w':min(w,x1+2)-max(0,x0-2),'h':min(h,y1+2)-max(0,y0-2),'anchorX':anchor-max(0,x0-2),'anchorY':y1-max(0,y0-2)})
  rows.append(frames)
 atlases[name]={'file':file,'width':w,'height':h,'scale':.49 if name=='brute' else .43,'rows':rows}
 print(name,w,h,len(parts))
(root/'assets'/'atlas.json').write_text(json.dumps(atlases,indent=2)+'\n')
(root/'src'/'atlas-data.js').write_text('export const heroAtlases = '+json.dumps(atlases,separators=(',',':'))+';\n')
