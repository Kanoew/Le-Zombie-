import {heroAtlases} from './atlas-data.js?v=0.5';
const artFiles={machete:'hero-atlas.png',sabre:'hero-sabre.png',hatchet:'hero-hatchet.png',weapons:'weapons.png',district:'district.png'};
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
  c.save();if(options.hurt)c.globalAlpha=.7;
  if(options.dash)c.globalAlpha=.65;
  c.drawImage(img,f.x,f.y,f.w,f.h,Math.round(a.x-f.anchorX*scale),Math.round(a.y-f.anchorY*scale),f.w*scale,f.h*scale);
  c.restore();return true;
}
export function drawWeaponIcon(c,id,x,y,size=96){
  const img=artImages.weapons,position={machete:0,sabre:1,hatchet:2}[id];
  if(!img||position===undefined)return;
  const cell=img.width/3;c.drawImage(img,position*cell,0,cell,img.height,x,y,size,size);
}
