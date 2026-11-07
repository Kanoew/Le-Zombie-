import {campModules,campPower} from './camp.js?v=0.8';
import {actorPresentation} from './presentation.js?v=0.8';
import {activeWalls, activeEnemies, mapSize, districts} from './world.js?v=0.8';

import {artImages,drawHero,drawPlayer,drawCampProp} from './art.js?v=0.8';
import {animationFrame,weapons} from './weapons.js?v=0.8';
// Original procedural pixel art. Static terrain is cached; actors and lighting remain dynamic.
const terrainCache = new Map();
const pixel = (c,x,y,w,h,color) => { c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h); };
function label(c,value,x,y,color='#a3b9bd',size=9) {
  c.font=`${size}px monospace`;c.fillStyle=color;c.fillText(value,Math.round(x),Math.round(y));
}
function light(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function ellipse(c,x,y,rx,ry,color) {
  c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();
}
function terrain(zone) {
  if(terrainCache.has(zone))return terrainCache.get(zone);
  const layer=document.createElement('canvas');layer.width=960;layer.height=576;
  const c=layer.getContext('2d'),camp=zone==='camp';
  pixel(c,0,0,960,576,camp?'#1b2930':'#17212e');
  for(let y=0;y<18;y++)for(let x=0;x<30;x++) {
    const n=(x*139+y*89)%31,px=x*32,py=y*32;
    pixel(c,px,py,31,31,camp?(n<9?'#23343b':'#203038'):(n<9?'#202e3b':'#1b2835'));
    pixel(c,px+1,py+1,29,1,'#8da5a70c');
    if(n<7){pixel(c,px+6,py+8,2,2,'#7b92932b');pixel(c,px+20,py+23,5,1,'#07141e77');}
    if(n===3||n===17){pixel(c,px+3,py+12,24,12,'#0e202c');pixel(c,px+7,py+15,17,2,'#3c687343');}
    if(n===22){for(let i=0;i<5;i++)pixel(c,px+5+i*4,py+5,2,20,'#0f1b26');}
  }
  // Inlaid service routes, cables, painted pavement and drainage remain walkable.
  if(camp) {
    // Separate service pads and cable runs make the refuge read as a place.
    for(const [x,y,w,h,tint] of [[300,350,100,108,'#372e30'],[380,380,108,112,'#233a3a'],[650,350,110,112,'#3a3528'],[708,190,88,78,'#26333d']]){
      pixel(c,x,y,w,h,'#101e27');pixel(c,x+3,y+3,w-6,h-6,tint);
      for(let xx=x+8;xx<x+w-5;xx+=14)pixel(c,xx,y+4,7,2,'#9ca27c44');
    }
    pixel(c,350,402,355,2,'#0b1620');pixel(c,350,405,355,1,'#718d7466');
    pixel(c,704,240,2,161,'#0b1620');pixel(c,707,240,1,161,'#8f987044');
    pixel(c,400,218,288,170,'#101f29');
    for(let y=224;y<383;y+=16)for(let x=405;x<685;x+=32){pixel(c,x,y,30,14,'#2a3b42');pixel(c,x+2,y+2,26,1,'#52636833');}
    for(let x=408;x<690;x+=16){pixel(c,x,214,9,3,'#c4a25c77');pixel(c,x,389,9,3,'#c4a25c77');}
    pixel(c,450,305,407,2,'#0b161f');pixel(c,450,308,407,1,'#5f9b8b66');
    pixel(c,546,337,2,132,'#10212a');pixel(c,549,337,1,132,'#aa915f66');
    label(c,'07',688,257,'#456068',30);label(c,'STATION // RESCUE NETWORK',405,207,'#81a597',8);
    for(let y=280;y<336;y+=13)pixel(c,794,y,18,3,'#8eaa7e4a');
  } else {
    pixel(c,55,270,850,73,'#111e2c');pixel(c,55,272,850,2,'#57656c');pixel(c,55,339,850,2,'#57656c');
    for(let x=65;x<900;x+=52)pixel(c,x,305,25,3,'#baa97977');
    for(let x=105;x<182;x+=15)pixel(c,x,278,9,56,'#71818a42');
    for(let i=0;i<9;i++){pixel(c,540+i*3,347+i*2,2,1,'#97cedf33');}
    label(c,'CENDRES / SECTEUR 04',332,260,'#718692',10);
    // Reclaimed planter beds, rubble and drain covers are flat ground markings.
    for(const [x,y] of [[180,94],[590,440],[835,445]]) {
      pixel(c,x,y,42,13,'#152b2c');for(let i=0;i<8;i++)pixel(c,x+i*5,y+(i%3)*3,4,4,['#354a40','#566450','#716c51'][i%3]);
    }
  }
  // Raised perimeter fences, lamps and signs define the actual collision boundary.
  for(let x=0;x<960;x+=32)for(const y of [0,544]) {
    pixel(c,x,y,31,30,'#0e1a24');pixel(c,x+1,y+2,29,5,'#3a4a52');pixel(c,x+3,y+9,25,15,'#23363f');
    if(x%128===0)pixel(c,x+10,y+12,12,3,'#88b6ab');
  }
  for(let y=32;y<544;y+=32)for(const x of [0,928]){pixel(c,x,y,31,32,'#142630');pixel(c,x+4,y+1,5,30,'#384b53');pixel(c,x+12,y+2,2,27,'#71888544');}
  terrainCache.set(zone,layer);return layer;
}
function wall(c,id,camp,health) {
  const [x,y]=id.split(',').map(Number),px=x*32,py=y*32;
  pixel(c,px+5,py+12,31,29,'#020b14a0');pixel(c,px,py-5,32,34,camp?'#233b45':'#253244');
  pixel(c,px+1,py-7,30,7,camp?'#6f8684':'#697787');pixel(c,px+2,py-6,28,1,'#adbbb233');
  pixel(c,px+3,py+2,26,18,camp?'#39545d':'#3b485b');pixel(c,px+5,py+4,22,1,'#79938a44');
  pixel(c,px+3,py+23,26,4,health?'#b78b60':camp?'#77b8a4':'#a37190');
  pixel(c,px+4,py+9,2,2,'#131c2c');pixel(c,px+26,py+9,2,2,'#131c2c');
  if(!camp&&(x+y)%3===0){pixel(c,px+9,py+5,13,9,'#161c31');pixel(c,px+10,py+6,4,7,'#b87d9a');pixel(c,px+16,py+6,5,7,'#7b95b0');}
  if(health){pixel(c,px+16,py+1,2,8,'#111f29');pixel(c,px+12,py+8,5,2,'#111f29');pixel(c,px+10,py+10,2,7,'#111f29');}
}
function consoleProp(c,x,y,type,time) {
  ellipse(c,x,y+14,28,12,'#020a1280');
  if(type==='core') {
    pixel(c,x-24,y-13,48,36,'#152c36');pixel(c,x-20,y-18,40,9,'#72918c');pixel(c,x-19,y-8,38,24,'#3a5b61');
    pixel(c,x-13,y-6,26,16,'#091c28');pixel(c,x-10,y-3,20,7,'#78dbc5');pixel(c,x-8,y+6,8,2,'#82a97a');
    pixel(c,x-24,y+17,48,6,'#0b1a25');pixel(c,x-16,y+20,5,5,'#687e7b');pixel(c,x+11,y+20,5,5,'#687e7b');
    light(c,x,y,75,'#61e9c51a');label(c,'NOYAU',x-15,y+39,'#8fc9b7',8);
  } else if(type==='forge') {
    pixel(c,x-21,y-10,42,25,'#3d3533');pixel(c,x-24,y-13,48,6,'#8b7e69');pixel(c,x-20,y-12,40,1,'#b7a27d');
    pixel(c,x-18,y+13,5,9,'#2a3035');pixel(c,x+13,y+13,5,9,'#2a3035');pixel(c,x-5,y-21,9,10,'#64797c');
    pixel(c,x+8,y-16,8,4,'#b7b0a0');pixel(c,x+5,y-14,2,11,'#87979a');pixel(c,x-15,y-10,9,9,'#282c33');
    pixel(c,x-13,y-8,5,3,'#d7a466');light(c,x-11,y,40,'#dca25a18');label(c,'ATELIER',x-21,y+37,'#c4b18b',8);
  } else {
    pixel(c,x-18,y-17,36,43,'#243149');pixel(c,x-15,y-21,30,7,'#79869c');pixel(c,x-12,y-11,24,26,'#101f36');
    for(let i=0;i<4;i++)pixel(c,x-8,y-7+i*6,16,2,i===Math.floor(time%4)?'#c5b4ec':'#546a8c');
    pixel(c,x-15,y+20,30,4,'#9b9abd');light(c,x,y,64,'#a18ed71f');label(c,'RELAIS ÉCHO',x-29,y+40,'#b8abd4',8);
  }
}
function sprite(c,a,type,clock,facing,walking,hurt) {
  const enemy=type==='enemy',dog=type==='dog',guard=type==='guard';
  const step=Math.sin(clock*11)* (walking?2:0),x=Math.round(a.x),y=Math.round(a.y);
  ellipse(c,x,y+13,dog?17:13,6,'#020a12a0');
  c.save();c.translate(x,y);
  if(dog) {
    pixel(c,-14,-3,25,13,'#836e56');pixel(c,-10,-6,18,5,'#ac9470');pixel(c,7,-11,12,14,'#a48c67');
    pixel(c,8,-15,4,8,'#665343');pixel(c,16,-14,3,6,'#665343');pixel(c,14,-5,6,5,'#353944');
    pixel(c,10,-7,3,2,'#9ad6ba');pixel(c,7,1,10,3,'#346b67');pixel(c,10,2,2,3,'#8ae3c6');
    pixel(c,-12,8,4,9+step,'#544c43');pixel(c,4,8,4,9-step,'#544c43');pixel(c,-20,-7,9,4,'#938066');
  } else {
    const jacket=enemy?'#685262':guard?'#69718e':'#3d7777',skin=enemy?'#999881':'#c3a58b';
    pixel(c,-7,6,6,12+step,'#1a2836');pixel(c,2,6,6,12-step,'#1a2836');
    pixel(c,-9,16+step,8,3,'#0a121e');pixel(c,2,16-step,9,3,'#0a121e');
    pixel(c,-9,-9,18,20,hurt&&!enemy&&!guard?'#cba08e':jacket);
    pixel(c,-7,-7,4,15,enemy?'#806671':'#568e8a');pixel(c,4,-7,3,15,'#142c3d');
    pixel(c,-12,-5,4,13+step,enemy?'#867d74':'#324b56');pixel(c,9,-5,4,13-step,enemy?'#867d74':'#324b56');
    pixel(c,-12,7+step,4,4,skin);pixel(c,9,7-step,4,4,skin);
    pixel(c,-6,-20,12,13,skin);pixel(c,-7,-22,14,6,enemy?'#393c49':'#232638');
    pixel(c,-7,-18,3,7,'#232638');pixel(c,-5,-18,11,3,'#384252');
    if(!enemy&&!guard&&facing.y<-.5){pixel(c,-6,-18,12,10,'#283240');pixel(c,-5,-12,10,3,'#333c4a');}
    else{const sx=!enemy&&!guard?facing.x:0;pixel(c,sx>.5?0:-6,-14,Math.abs(sx)>.5?6:12,3,enemy?'#e99e96':guard?'#d0b9e1':'#8ef3d6');}
    pixel(c,-7,-2,14,3,'#152838');pixel(c,-4,-6,3,4,enemy?'#9b7881':'#bea877');
    pixel(c,-8,8,16,3,'#191e2a');pixel(c,-1,8,3,3,'#a9a58b');
    if(!enemy){const angle=guard?.4:Math.atan2(facing.y,facing.x);c.save();c.rotate(angle);pixel(c,15,-17,3,22,'#dce2cc');pixel(c,16,-19,2,4,'#f7f3dc');pixel(c,12,4,9,2,'#a58963');pixel(c,15,6,3,6,'#252d36');c.restore();}
    if(enemy&&a.windup>0){c.strokeStyle='#ffb084';c.lineWidth=2;c.beginPath();c.arc(0,0,42,0,Math.PI*2);c.stroke();label(c,'!',-3,-36,'#ffdfbb',16);}
  }
  c.restore();
}
export function renderScene(c,s,view,cam,fx) {
  c.imageSmoothingEnabled=false;
  pixel(c,0,0,view.w,view.h,'#0c1724');
  c.save();c.translate(-Math.round(cam.x),-Math.round(cam.y));
  const camp=s.zone==='camp',clock=fx.reduced?0:s.time;
  const size=mapSize(s.zone);
  if(!camp&&artImages.district)c.drawImage(artImages.district,0,0,size.width,size.height);
  else if(camp&&artImages.refuge)c.drawImage(artImages.refuge,0,0,size.width,size.height);
  else c.drawImage(terrain(s.zone),0,0);
  // Lamps, warning paint and a shallow gate indicate the two traversable exits.
  const gx=camp?864:80,gy=camp?304:608;c.save();c.translate(0,gy-304);
  pixel(c,gx-19,268,38,72,'#1a3f42');pixel(c,gx-21,265,5,76,'#557977');pixel(c,gx+17,265,5,76,'#557977');
  pixel(c,gx-18,272,3,61,'#90ebcc');pixel(c,gx+15,272,3,61,'#90ebcc');
  for(let y=277;y<336;y+=10)pixel(c,gx-10,y,20,3,'#598e8377');
  light(c,gx,303,95,'#7ce4c425');label(c,camp?'VERS LES CENDRES →':'← STATION 07',gx-47,360,'#a8d9c5',8);
  c.restore();
  if(camp)for(const id of activeWalls(s))wall(c,id,camp,s.wallHealth[id]);
  if(camp) {
    consoleProp(c,464,272,'core',clock);
    for(const [id,m] of Object.entries(campModules)){if(!s.camp.built[id]){pixel(c,m.x-24,m.y-8,48,12,'#46636533');label(c,'+ '+m.name,m.x-30,m.y+18,'#789590',7);}}consoleProp(c,560,304,'forge',clock);consoleProp(c,624,272,'echo',clock);
    // Small motion and lighting details are decoration, not additional collision obstacles.
    light(c,310,176,100,'#a0c9d010');light(c,720,422,110,'#c5995010');
    if(s.raid.phase==='active'){pixel(c,440,236,48,4,'#162832');pixel(c,440,236,48*s.raid.core/100,4,'#e9c184');}
  } else {
    for(const crate of s.crates){const x=crate.x,y=crate.y,full=crate.amount>0;
      ellipse(c,x+3,y+15,22,8,'#020a1499');pixel(c,x-17,y-10,34,26,full?'#77674b':'#303b44');
      pixel(c,x-18,y-14,36,7,full?'#c1a578':'#65717a');pixel(c,x-14,y-5,28,17,full?'#917957':'#435059');
      pixel(c,x-11,y-12,4,26,'#2b3439');pixel(c,x+8,y-12,4,26,'#2b3439');pixel(c,x-3,y,6,5,full?'#efd397':'#152a35');
      if(full){light(c,x,y,45,'#d7ad5915');label(c,'◇',x-3,y-25,'#efd397',12);}
    }
    for(const [x,y,color,name] of districts.map((d,i)=>[d.x,d.y-50,['#df92bc','#d4b785','#d4b785','#9dcfad'][i],d.name])) {
      pixel(c,x-28,y-19,64,18,'#121c2b');label(c,name,x-24,y-7,color,9);pixel(c,x-28,y,64,2,color);light(c,x,y,76,color+'1a');
    }
  }
  if(fx.building&&camp){c.strokeStyle='#b7e9cf30';c.lineWidth=1;for(let x=1;x<30;x++){c.beginPath();c.moveTo(x*32,32);c.lineTo(x*32,544);c.stroke();}for(let y=1;y<18;y++){c.beginPath();c.moveTo(32,y*32);c.lineTo(928,y*32);c.stroke();}}
  if(fx.blueprint&&fx.building){
    const b=fx.blueprint,exists=s.walls.includes(`${b.x},${b.y}`),color=!b.valid?'#e29889':exists?'#d6b47f':'#9ce3c3';
    pixel(c,b.x*32,b.y*32,32,32,!b.valid?'#e2988944':exists?'#d6b47f44':'#9ce3c344');c.strokeStyle=color;c.lineWidth=2;c.strokeRect(b.x*32+1,b.y*32+1,30,30);label(c,exists?'+2':'−2',b.x*32+8,b.y*32-10,color,11);
  }
  const playerPose={weapon:s.loadout,facing:fx.facing,side:fx.side,moving:fx.moving,walkPhase:fx.walkPhase,elapsed:s.time,attackRemaining:fx.attackTimer,duration:weapons[s.loadout].duration,dash:fx.dash,hurt:fx.hurt,reduced:fx.reduced};
  for(const ghost of fx.ghosts??[]){c.save();c.globalAlpha=ghost.remaining*3;drawPlayer(c,ghost,playerPose);c.restore();}
  const actors=[...(camp?Object.entries(campModules).filter(([id])=>s.camp.built[id]).map(([id,m])=>({a:{...m,module:id},t:'module'})):[]),{a:s.player,t:'player'},{a:s.dog,t:'dog'},...(camp&&s.defender.recruited?[{a:s.defender,t:'guard'}]:[]),...activeEnemies(s).filter(e=>e.hp>0).map(a=>({a,t:'enemy'}))].sort((a,b)=>a.a.y-b.a.y);
  for(const {a,t} of actors){
    if(t==='module'){ellipse(c,a.x,a.y,38,10,'#020a1266');drawCampProp(c,a.module,a.x,a.y,a.module==='lights'?72:86);continue;}
    const v=actorPresentation(a,fx.dt,t==='guard'&&a.windup>0?{x:a.targetX,y:a.targetY}:t==='dog'&&a.cooldown>11.35?{x:a.targetX,y:a.targetY}:t==='enemy'&&a.windup>0?(camp?s.defender.recruited&&s.defender.hp>0?s.defender:{x:464,y:304}:s.player):null);
    const frame=t==='player'?animationFrame(fx.facing,fx.moving,fx.walkPhase*8/10,fx.attackTimer,weapons[s.loadout].duration):animationFrame(v.facing,v.moving,v.phase*8/10,t==='dog'?Math.max(0,(a.cooldown??0)-11.35):a.windup??0,t==='dog'?.65:t==='guard'?.48:camp?.7:.65);
    const id=t==='player'?s.loadout:t==='guard'?'echo':t==='dog'?'dog':a.kind??'infected';
    {
      ellipse(c,a.x,a.y,t==='dog'?17:t==='enemy'&&a.kind==='brute'?19:14,6,'#020a1290');
      light(c,a.x-7,a.y-25,34,t==='enemy'?'#9ab56a09':'#b8d1db09');
    }
    if(!(t==='player'?drawPlayer(c,a,playerPose):drawHero(c,a,id,frame,{hurt:a.hitFlash})))sprite(c,a,t,clock,v.facing,v.moving,fx.hurt);
    if(t==='enemy'){
      pixel(c,a.x-14,a.y-70,28,3,'#222a29');pixel(c,a.x-14,a.y-70,28*Math.max(0,a.hp)/(a.kind==='brute'?90:60),3,'#a6b77b');
      if(a.windup>0){c.strokeStyle='#e5b16e';c.lineWidth=2;c.beginPath();c.arc(a.x,a.y,43,0,Math.PI*2);c.stroke();label(c,'!',a.x-3,a.y-79,'#ffddb5',13);}
    }
    if(t==='guard')label(c,a.hp>0?'ÉCHO-01':'BLESSÉ',a.x-22,a.y-68,'#bdc8e4',8);
  }

  if(!weapons[s.loadout].ranged&&fx.attackTimer>0&&fx.attackTimer<weapons[s.loadout].duration*.6&&fx.attackTimer>weapons[s.loadout].duration*.3){const a=Math.atan2(fx.facing.y,fx.facing.x);c.strokeStyle=s.loadout==='scythe'?'#d6a9eb':'#e6f2cf';c.lineWidth=4;c.beginPath();c.arc(s.player.x,s.player.y,weapons[s.loadout].range*.65,a-.9,a+.9);c.stroke();}
  for(const shot of fx.shots??[]){
    const x=shot.x+shot.direction.x*23,y=shot.y-38+shot.direction.y*12,ex=shot.endX,ey=shot.endY-38;
    c.save();c.globalAlpha=Math.min(1,shot.life/.07);c.strokeStyle='#f7dda1';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();
    c.translate(x,y);c.rotate(Math.atan2(shot.direction.y,shot.direction.x));c.fillStyle='#fff0bf';c.beginPath();c.moveTo(0,-4);c.lineTo(18,0);c.lineTo(0,4);c.closePath();c.fill();c.restore();
    if(!fx.reduced)light(c,x,y,32,'#f3b95455');
  }
  for(const f of fx.floaters??[]){c.save();c.globalAlpha=Math.min(1,f.life*2);label(c,f.text,f.x-10,f.y,'#f1dab0',11);c.restore();}
  if(fx.goal){const dx=fx.goal.x-s.player.x,dy=fx.goal.y-s.player.y,d=Math.hypot(dx,dy);if(d>80){const x=s.player.x+dx/d*44,y=s.player.y+dy/d*44;c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));c.fillStyle='#e1c687';c.beginPath();c.moveTo(8,0);c.lineTo(-4,-5);c.lineTo(-4,5);c.closePath();c.fill();c.restore();}else{c.strokeStyle='#dfc27c';c.lineWidth=1;c.beginPath();c.ellipse(fx.goal.x,fx.goal.y,25,10,0,0,Math.PI*2);c.stroke();}}
  for(const f of fx.particles)pixel(c,f.x,f.y,3,3,f.color);
  if(s.time%1080>=720){pixel(c,0,0,size.width,size.height,'#070b2340');light(c,s.player.x,s.player.y,125,'#b7d9ce15');if(camp&&campPower(s).lights){for(const pos of [{x:752,y:240},{x:464,y:304},{x:864,y:304}])light(c,pos.x,pos.y,170,'#f3da913d');}}
  c.restore();
  // Sparse rain, kept outside the simulation and disabled with reduced motion.
  if(!fx.reduced){c.strokeStyle='#acc8da19';c.lineWidth=1;for(let i=0;i<35;i++){const x=(i*137+clock*19)%view.w,y=(i*79+clock*160)%view.h;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+10);c.stroke();}}
  const g=c.createLinearGradient(0,0,0,view.h);g.addColorStop(0,'#050b17a8');g.addColorStop(.25,'transparent');g.addColorStop(.72,'transparent');g.addColorStop(1,'#050c17a6');c.fillStyle=g;c.fillRect(0,0,view.w,view.h);
}
export function renderMiniMap(c,s) {
  const size=mapSize(s.zone),sx=120/size.width,sy=72/size.height;
  pixel(c,0,0,120,72,'#0b1925');
  if(s.zone==='street'&&artImages.district){c.globalAlpha=.65;c.drawImage(artImages.district,0,0,120,72);c.globalAlpha=1;}
  else for(const id of activeWalls(s)){const [x,y]=id.split(',').map(Number);pixel(c,x*32*sx,y*32*sy,3,3,'#506973');}
  const exit=s.zone==='camp'?{x:864,y:304}:{x:80,y:608};pixel(c,exit.x*sx,exit.y*sy,4,4,'#d4b97d');
  if(s.zone==='street')for(const crate of s.crates)if(crate.amount)pixel(c,crate.x*sx,crate.y*sy,2,2,'#e2c88d');
  for(const e of activeEnemies(s))if(e.hp>0)pixel(c,e.x*sx,e.y*sy,2,2,'#d78e8e');
  pixel(c,s.player.x*sx-1,s.player.y*sy-1,4,4,'#e3fbd9');
}
export function renderWorldMap(c,s){
  const w=c.canvas.width,h=c.canvas.height;
  c.fillStyle='#0b1724';c.fillRect(0,0,w,h);
  if(artImages.district)c.drawImage(artImages.district,0,0,w,h);
  for(const d of districts){const x=d.x/1920*w,y=d.y/1280*h;light(c,x,y,30,'#b2d2ad44');label(c,d.name,x-45,y-12,'#e9e3d2',10);}
  for(const box of s.crates)if(box.amount)pixel(c,box.x/1920*w-2,box.y/1280*h-2,4,4,'#efd195');
  label(c,'← REFUGE',12,608/1280*h-12,'#bfe9c3',11);
  if(s.zone==='street'){ellipse(c,s.player.x/1920*w,s.player.y/1280*h,6,6,'#defbd4');ellipse(c,s.player.x/1920*w,s.player.y/1280*h,3,3,'#285b50');}
}
