import {campPropFrames} from './prop-data.js?v=0.8';
import {heroAtlases} from './atlas-data.js?v=0.8';
import {newAtlases} from './atlas-new.js?v=0.8';
import {artFiles} from './art-files.js?v=0.8';
import {yejiPose,yejiWeaponId} from './yeji.js?v=0.8';
export const artImages={};
export async function loadArt(){
  const entries=Object.entries(artFiles),results=[];
  // Decode at most two large sheets at once. Keep small GPU textures on phones.
  for(let start=0;start<entries.length;start+=2){
    results.push(...await Promise.all(entries.slice(start,start+2).map(([id,file])=>new Promise(resolve=>{
      const img=new Image();img.onload=async()=>{
        let texture=img;
        if(newAtlases[id]&&typeof createImageBitmap==='function'){
          const ratio=Math.min(1,1024/Math.max(img.width,img.height));
          try{texture=await createImageBitmap(img,{resizeWidth:Math.round(img.width*ratio),resizeHeight:Math.round(img.height*ratio),resizeQuality:'high'});texture.assetFile=file;}catch{/* Original image remains a compatible fallback. */}
        }
        artImages[id]=texture;resolve(id);
      };img.onerror=()=>resolve(null);
      img.src=window.__ART_DATA__?.[id]||new URL('./assets/'+file,document.baseURI).href;
    }))));
  }
  return results.every(Boolean);
}
export function drawHero(c,a,weapon,frame,options={}){
  const img=artImages[weapon],atlas=heroAtlases[weapon];
  return drawAtlasFrame(c,a,img,atlas,frame,options);
}
function drawAtlasFrame(c,a,img,atlas,frame,options={}){
  if(!img||!atlas)return false;
  const f=atlas.rows[frame.row]?.[frame.column],scale=atlas.scale;
  if(!f)return false;
  c.save();if(options.hurt)c.filter='brightness(1.7)';
  if(options.dash)c.globalAlpha*=.65;
  const sx=img.width/atlas.width,sy=img.height/atlas.height;
  c.drawImage(img,f.x*sx,f.y*sy,f.w*sx,f.h*sy,Math.round(a.x-f.anchorX*scale),Math.round(a.y-f.anchorY*scale),f.w*scale,f.h*scale);
  c.restore();return true;
}
export function drawPlayer(c,a,options={}){
  const pose=yejiPose(options);
  return drawAtlasFrame(c,a,artImages[pose.atlas],newAtlases[pose.atlas],pose,options);
}
export function drawWeaponIcon(c,id,x,y,size=96){
  const key=yejiWeaponId(id),sheet=artImages[key],atlas=newAtlases[key];
  if(sheet&&atlas){const f=atlas.rows[2][0],scale=Math.min(size*.92/f.w,size*.92/f.h),sx=sheet.width/atlas.width,sy=sheet.height/atlas.height;c.drawImage(sheet,f.x*sx,f.y*sy,f.w*sx,f.h*sy,x+(size-f.w*scale)/2,y+(size-f.h*scale)/2,f.w*scale,f.h*scale);return;}
  const img=artImages.weapons,position={machete:0,sabre:1,hatchet:2}[id];
  if(id==='pistol'){c.save();c.translate(x+size*.2,y+size*.72);c.rotate(-.55);c.fillStyle='#bac4cd';c.fillRect(0,-size*.35,size*.65,size*.16);c.fillStyle='#35404c';c.fillRect(size*.05,-size*.21,size*.17,size*.3);c.fillStyle='#d0b07a';c.fillRect(size*.39,-size*.34,size*.12,size*.05);c.restore();return;}
  if(!img||position===undefined)return;
  const cell=img.width/3;c.drawImage(img,position*cell,0,cell,img.height,x,y,size,size);
}

export function drawCampProp(c,id,x,y,width=82,opacity=1){
 const img=artImages.props,f=campPropFrames[id];if(!img||!f)return false;
 const height=f.h/f.w*width;c.save();c.globalAlpha=opacity;c.drawImage(img,f.x,f.y,f.w,f.h,x-width/2,y-height,width,height);c.restore();return true;
}
