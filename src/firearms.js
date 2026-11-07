import {activeWalls,activeEnemies,blocked} from './world.js?v=0.8';
import {registerCityKill} from './city-ai.js?v=0.8';
import {weapons} from './weapons.js?v=0.8';
export function traceShot(walls,enemies,origin,direction,range=380){
 const length=Math.hypot(direction.x,direction.y);if(!length)return null;
 const dir={x:direction.x/length,y:direction.y/length};let wallDistance=range;
 for(let t=0;t<=range;t+=2){if(blocked(walls,Math.floor((origin.x+dir.x*t)/32),Math.floor((origin.y+dir.y*t)/32))){wallDistance=t;break;}}
 let target=null,distance=wallDistance;
 for(const e of enemies){if(e.hp<=0)continue;const dx=e.x-origin.x,dy=e.y-origin.y,along=dx*dir.x+dy*dir.y,across=Math.abs(dx*dir.y-dy*dir.x);
  if(across>14||along<0)continue;const entry=Math.max(0,along-Math.sqrt(14**2-across**2));if(entry<distance){distance=entry;target=e;}
 }
 return {x:origin.x,y:origin.y,endX:origin.x+dir.x*distance,endY:origin.y+dir.y*distance,direction:dir,target,wall:!target&&wallDistance<range,life:.11};
}
export function firePistol(s,direction){
 return fireWeapon(s,direction,'pistol');
}
export function fireWeapon(s,direction,id=s.loadout){
 const weapon=weapons[id];if(!weapon?.ranged)return {ok:false,message:'Choisis une arme à feu.'};
 if(s.ammo<1)return {ok:false,message:'Plus de cartouches. Atelier → fabriquer 6 cartouches pour 2 ferrailles.'};
 if(!Math.hypot(direction.x,direction.y))return {ok:false,message:'Choisis une direction.'};
 const shots=[],damageByTarget=new Map(),angle=Math.atan2(direction.y,direction.x),pellets=weapon.pellets??1;
 const damage=Math.round(weapon.damage*(s.weapon===2?1.5:1));
 for(let i=0;i<pellets;i++){
  const a=angle+(pellets>1?(i/(pellets-1)-.5)*weapon.spread*2:0);
  const shot=traceShot(activeWalls(s),activeEnemies(s),s.player,{x:Math.cos(a),y:Math.sin(a)},weapon.range);
  shots.push(shot);if(shot.target)damageByTarget.set(shot.target,(damageByTarget.get(shot.target)??0)+damage);
 }
 s.ammo--;s.threat=Math.min(100,s.threat+(s.zone==='street'?1:0));
 let killed=false;const hits=[];
 for(const [e,total] of damageByTarget){e.hp=Math.max(-90,e.hp-total);e.windup=0;e.cooldown=.35;e.hitFlash=.12;hits.push({target:e,damage:total});
  if(e.hp<=0){registerCityKill(s,e);s.kills++;if(s.zone==='street')s.threat=Math.min(100,s.threat+5);killed=true;}
 }
 return {ok:true,shot:shots[0],shots,hits,damage:hits.reduce((n,h)=>n+h.damage,0),killed};
}
export function craftAmmo(s){
 if(s.zone!=='camp'||s.raid.phase==='active')return 'Fabrication disponible au refuge, hors raid.';
 if(s.ammo>84)return 'Réserve presque pleine : pas de matériaux consommés.';
 if(s.stock<2)return 'Il faut 2 ferrailles pour fabriquer 6 cartouches.';
 s.stock-=2;s.ammo+=6;return '+6 cartouches · −2 ferrailles';
}
