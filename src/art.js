import {campPropFrames} from './prop-data.js?v=0.6.1';
import {heroAtlases} from './atlas-data.js?v=0.6.1';
const artFiles={machete:'hero-atlas.png',sabre:'hero-sabre.png',hatchet:'hero-hatchet.png',weapons:'weapons.png',district:'district.png',infected:'infected.png',brute:'brute.png',echo:'echo.png',props:'camp-props.png'};
export const artImages={};
export async function loadArt(){
  const results=await Promise.all(Object.entries(artFiles).map(([id,file])=>new Promise(resolve=>{
    const img=new Image();img.onload=()=>{artImages[id]=img;resolve(id);};img.onerror=()=>resolve(null);
    img.src=window.__ART_DATA__?.[id]||new URL('./assets/'+file,document.baseURI).href;
  })));
  return results.every(Boolean);
}
export function drawHero(c,a,weapon,frame,options={}){
  const img=artImages[weapon],atlas=heroAtlases[weapon];
  if(!img||!atlas)return false;
  const f=atlas.rows[frame.row][frame.column],scale=atlas.scale;
  c.save();if(options.hurt)c.filter='brightness(1.7)';
  if(options.dash)c.globalAlpha=.65;
  c.drawImage(img,f.x,f.y,f.w,f.h,Math.round(a.x-f.anchorX*scale),Math.round(a.y-f.anchorY*scale),f.w*scale,f.h*scale);
  c.restore();return true;
}
export function drawWeaponIcon(c,id,x,y,size=96){
  const img=artImages.weapons,position={machete:0,sabre:1,hatchet:2}[id];
  if(!img||position===undefined)return;
  const cell=img.width/3;c.drawImage(img,position*cell,0,cell,img.height,x,y,size,size);
}

export function drawCampProp(c,id,x,y,width=82,opacity=1){
 const img=artImages.props,f=campPropFrames[id];if(!img||!f)return false;
 const height=f.h/f.w*width;c.save();c.globalAlpha=opacity;c.drawImage(img,f.x,f.y,f.w,f.h,x-width/2,y-height,width,height);c.restore();return true;
}
