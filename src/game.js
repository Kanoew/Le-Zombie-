import {COLS,ROWS,TILE,key,createWorld,canStand,pathTo,toggleWall,validSave,migrateSave,activeWalls,activeEnemies,mapSize,streetEntry,collect,deposit,upgrade,transition} from './world.js?v=0.5';
import {recruitDefender,repairWalls,tickRaid,finishRaid,commandDog} from './defense.js?v=0.5';
import {renderScene,renderMiniMap,renderWorldMap} from './renderer.js?v=0.5';
import {loadArt,drawHero,drawWeaponIcon,artImages} from './art.js?v=0.5';
import {weapons,equipWeapon,animationFrame} from './weapons.js?v=0.5';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let state=createWorld(),paused=true,building=false,keys=new Set(),joystick={x:0,y:0},facing={x:1,y:0},attackTimer=0,cooldown=0,dash=0,hurt=0,last=performance.now(),autosave=0,stickPointer=null,cam={x:0,y:0},view={w:480,h:800},particles=[],messageTimer=0,moving=false,pendingBuild=null;
let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
try{const value=localStorage.getItem('zombie.motion');if(value!==null)reduced=value==='reduced';}catch{}
$('app').classList.toggle('reduced-motion',reduced);$('motion').textContent=reduced?'Effets : réduits':'Effets : complets';
$('motion').onclick=()=>{reduced=!reduced;$('app').classList.toggle('reduced-motion',reduced);$('motion').textContent=reduced?'Effets : réduits':'Effets : complets';try{localStorage.setItem('zombie.motion',reduced?'reduced':'full');}catch{}};
const cell=a=>[Math.floor(a.x/TILE),Math.floor(a.y/TILE)];
const say=t=>{$('message').textContent=t;messageTimer=5;};
function persist(notify=false){try{const current=localStorage.getItem('zombie.save');if(current){try{if(migrateSave(JSON.parse(current)))localStorage.setItem('zombie.backup',current);}catch{}}localStorage.setItem('zombie.save',JSON.stringify(state));if(notify)say('Partie sauvegardée sur cet appareil.');return true;}catch{say('Stockage indisponible : la progression ne sera pas conservée.');return false;}}
function load(notify=true){for(const name of ['zombie.save','zombie.backup']){try{const data=migrateSave(JSON.parse(localStorage.getItem(name)));if(data){state=data;attackTimer=0;cooldown=0;strikePending=false;cameraReady=false;pendingBuild=null;building=false;$('build').classList.remove('active');if(notify)say(name.endsWith('backup')?'Copie précédente restaurée.':'Partie restaurée.');return true;}}catch{}}if(notify)say('Aucune sauvegarde valide disponible.');return false;}
function clearInput(){keys.clear();joystick={x:0,y:0};stickPointer=null;$('knob').style.transform='';}
function pause(value){paused=value;$('menu').hidden=!value;$('play').textContent='Reprendre l’expédition →';clearInput();if(value)persist();}
$('pause').onclick=()=>pause(!paused);$('play').onclick=()=>pause(false);$('save').onclick=()=>persist(true);$('load').onclick=()=>load();
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch{say('Plein écran indisponible dans ce navigateur.');}};
$('build').onclick=()=>{if(state.raid.phase==='active'){say('Construction verrouillée pendant le raid.');return;}building=!building;pendingBuild=null;if(building)$('camp-tools').classList.add('collapsed');$('build').classList.toggle('active',building);say(building?'Choisis une case, puis touche-la à nouveau pour confirmer.':'Mode exploration.');};
$('forge').onclick=()=>{say(upgrade(state));persist();};
$('summon').onclick=()=>{say(recruitDefender(state));persist();};
$('repair').onclick=()=>{say(repairWalls(state));persist();};
$('dog-action').onpointerdown=e=>{e.preventDefault();if(!paused){say(commandDog(state));persist();}};
function showReport(){
 const r=state.raid.result;if(!r){say('Aucun raid terminé.');return;}
 paused=true;clearInput();$('report').hidden=false;
 $('report-title').textContent=r.victory?'Raid repoussé':'Refuge préservé';
 $('report-body').textContent=`Assaut n°${r.id} · ${r.destroyed} mur(s) détruit(s). Écho-01 : ${r.hits} frappe(s). Récompense : ${r.reward} ferrailles. Pertes : ${r.loss} ferrailles. Aucun personnage perdu définitivement. Les murs debout se réparent au refuge.`;
}
$('report-open').onclick=showReport;
$('report-close').onclick=()=>{$('report').hidden=true;paused=!$('menu').hidden;};
function burst(x,y,color){for(let i=0;i<8;i++)particles.push({x,y,vx:Math.cos(i*.8)*50,vy:Math.sin(i*.8)*50,t:.35,color});}
let strikePending=false,attackFacing={x:1,y:0};
function attack(){
 const w=weapons[state.loadout];
 if(paused||cooldown>0||state.player.stamina<w.stamina)return;
 state.player.stamina-=w.stamina;attackTimer=w.duration;cooldown=w.duration+.08;
 attackFacing={...facing};strikePending=true;
}
function applyStrike(){
 const w=weapons[state.loadout],p=state.player;
 for(const e of activeEnemies(state)){
  const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy),path=pathTo(activeWalls(state),cell(p),cell(e));
  if(e.hp>0&&d<w.range&&dx*attackFacing.x+dy*attackFacing.y>-8&&path.length>0&&path.length<=Math.ceil(w.range/32)+1){
   e.hp=Math.max(-90,e.hp-Math.round(w.damage*(state.weapon===2?1.5:1)));e.windup=0;e.cooldown=.5;burst(e.x,e.y,'#e5908e');
   if(e.hp<=0){state.kills++;if(state.zone==='street')state.threat=Math.min(100,state.threat+5);say('Infecté neutralisé.');persist();}
  }
 }
}

function dodge(){if(!paused&&state.player.stamina>=30&&dash<=0){state.player.stamina-=30;dash=.16;}}
function target(){const p=state.player,near=a=>Math.hypot(a.x-p.x,a.y-p.y)<65;
 if(state.zone==='camp'){if(near({x:464,y:304}))return {label:'Déposer / se soigner',run:()=>deposit(state)};if(near({x:560,y:336}))return {label:'Renforcer · 10',run:()=>upgrade(state)};if(near({x:864,y:304}))return {label:'Explorer le quartier →',run:()=>transition(state)};}
 else{if(near(streetEntry))return {label:'← Retour au refuge',run:()=>transition(state)};const i=state.crates.findIndex(c=>c.amount>0&&near(c));if(i>=0)return {label:`Fouiller · ${state.crates[i].amount} ferrailles`,run:()=>collect(state,i)};}
 return null;
}
function interact(){if(paused)return;const t=target();if(!t)return;say(t.run());attackTimer=0;strikePending=false;building=false;$('build').classList.remove('active');persist();}
$('interact').onpointerdown=e=>{e.preventDefault();interact();};$('attack').onpointerdown=e=>{e.preventDefault();attack();};$('dodge').onpointerdown=e=>{e.preventDefault();dodge();};
window.addEventListener('keydown',e=>{if(e.code==='Escape'){if(!$('arsenal').hidden){closeArsenal();return;}if(!$('world-view').hidden){closeMap();return;}if(!$('report').hidden)$('report-close').click();else pause(!paused);return;}if(paused)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(!e.repeat&&e.code==='Space')attack();if(!e.repeat&&e.code==='KeyE')interact();if(!e.repeat&&e.code.startsWith('Shift'))dodge();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
const stick=$('stick');function stickMove(e){if(e.pointerId!==stickPointer||paused)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.max(38,Math.hypot(dx,dy));joystick={x:dx/d,y:dy/d};$('knob').style.transform=`translate(${joystick.x*30}px,${joystick.y*30}px)`;}
stick.onpointerdown=e=>{if(stickPointer!==null||paused)return;stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);};stick.onpointermove=stickMove;function release(e){if(e.pointerId===stickPointer){stickPointer=null;joystick={x:0,y:0};$('knob').style.transform='';}}stick.onpointerup=release;stick.onpointercancel=release;stick.onlostpointercapture=release;
canvas.onpointerdown=e=>{
 if(!building||paused||state.zone!=='camp')return;
 const r=canvas.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)/r.width*view.w+cam.x)/32),y=Math.floor(((e.clientY-r.top)/r.height*view.h+cam.y)/32);
 if(!pendingBuild||pendingBuild.x!==x||pendingBuild.y!==y){const probe=structuredClone(state),before=probe.stock,result=toggleWall(probe,x,y,[state.player,state.dog,...(state.defender.recruited?[state.defender]:[])]);pendingBuild={x,y,valid:probe.stock!==before};say(!pendingBuild.valid?result:state.walls.includes(key(x,y))?'Démonter · +2 ferrailles · retouche pour confirmer.':'Construire · −2 ferrailles · retouche pour confirmer.');return;}
 say(toggleWall(state,x,y,[state.player,state.dog,...(state.defender.recruited?[state.defender]:[]),...state.raid.enemies.filter(e=>e.hp>0)]));pendingBuild=null;persist();
};
function move(a,dx,dy){const walls=activeWalls(state);if(canStand(walls,a.x+dx,a.y))a.x+=dx;if(canStand(walls,a.x,a.y+dy))a.y+=dy;}
function follow(a,t,speed,dt,stop){if(Math.hypot(a.x-t.x,a.y-t.y)<stop)return;const path=pathTo(activeWalls(state),cell(a),cell(t));if(!path.length)return;let p=path.length>1?{x:(path[1][0]+.5)*32,y:(path[1][1]+.5)*32}:t;const center={x:(path[0][0]+.5)*32,y:(path[0][1]+.5)*32};if(path.length>1&&((path[1][0]!==path[0][0]&&Math.abs(a.y-center.y)>1)||(path[1][1]!==path[0][1]&&Math.abs(a.x-center.x)>1)))p=center;const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);if(d)move(a,dx/d*Math.min(speed*dt,d),dy/d*Math.min(speed*dt,d));}
function update(dt){state.time+=dt;state.dog.cooldown=Math.max(0,state.dog.cooldown-dt);autosave+=dt;if(autosave>15){persist();autosave=0;}messageTimer=Math.max(0,messageTimer-dt);cooldown=Math.max(0,cooldown-dt);attackTimer=Math.max(0,attackTimer-dt);if(strikePending&&attackTimer<=weapons[state.loadout].duration*.5){strikePending=false;applyStrike();}hurt=Math.max(0,hurt-dt);const p=state.player;p.stamina=Math.min(100,p.stamina+dt*15);let x=joystick.x,y=joystick.y;if(keys.has('KeyW')||keys.has('KeyZ')||keys.has('ArrowUp'))y--;if(keys.has('KeyS')||keys.has('ArrowDown'))y++;if(keys.has('KeyA')||keys.has('KeyQ')||keys.has('ArrowLeft'))x--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;const d=Math.hypot(x,y);moving=d>.05;if(d){x/=Math.max(1,d);y/=Math.max(1,d);if(!attackTimer)facing={x:x/Math.hypot(x,y),y:y/Math.hypot(x,y)};}if(dash>0){dash-=dt;move(p,facing.x*340*dt,facing.y*340*dt);}else move(p,x*125*dt,y*125*dt);follow(state.dog,p,145,dt,42);
 const raidPhase=state.raid.phase,raidMessage=tickRaid(state,dt);
 if(raidMessage){say(raidMessage);if(state.raid.phase==='active'){building=false;$('build').classList.remove('active');}persist();if(raidPhase==='active'&&state.raid.phase==='idle')showReport();}
 if(state.zone==='street')for(const e of state.enemies){if(e.hp<=0)continue;e.cooldown=Math.max(0,e.cooldown-dt);const dist=Math.hypot(e.x-p.x,e.y-p.y);if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(!e.windup){e.cooldown=1.1;if(dist<48&&!hurt&&dash<=0){p.hp-=state.time%1080>=720?18:12;hurt=.7;burst(p.x,p.y,'#f7cbb9');say('Touché ! Esquive au signal rouge.');}}}else if(dist<44&&!e.cooldown)e.windup=.65;else if(dist<240)follow(e,p,state.time%1080>=720?54:40,dt,32);if(p.hp<=0){state.zone='street';transition(state);p.x=464;p.y=304;p.hp=100;p.stamina=100;state.dog.x=464;state.dog.y=304;const loss=Math.ceil(state.bag/2);state.bag-=loss;hurt=2;say(`Retour au refuge · ${loss} ferrailles perdues (règle alpha : moitié du sac).`);persist();break;}}
 if(state.zone==='camp'&&state.raid.phase==='active')for(const e of state.raid.enemies){
   if(e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<42&&e.windup>0&&e.windup<.08&&!hurt&&dash<=0&&pathTo(state.walls,cell(e),cell(p)).length>0&&pathTo(state.walls,cell(e),cell(p)).length<=3){p.hp-=12;hurt=.7;burst(p.x,p.y,'#f7cbb9');}
 }
 if(p.hp<=0){finishRaid(state,false);p.x=464;p.y=304;p.hp=100;state.dog.x=p.x;state.dog.y=p.y;persist();showReport();}
 for(const f of particles){f.x+=f.vx*dt;f.y+=f.vy*dt;f.t-=dt;}particles=particles.filter(f=>f.t>0);
}
let cameraReady=false,lastZone=state.zone;
function resize(){
 const r=canvas.getBoundingClientRect();
 const zoom=r.width<600?.84:.88;
 const next={w:Math.round(r.width*zoom),h:Math.round(r.height*zoom)};
 if(canvas.width!==next.w||canvas.height!==next.h){canvas.width=next.w;canvas.height=next.h;cameraReady=false;}
 view=next;
 const bounds=mapSize(state.zone);
 const tx=view.w>bounds.width?(bounds.width-view.w)/2:Math.max(-16,Math.min(bounds.width-view.w+16,state.player.x-view.w/2));
 const ty=view.h>bounds.height?(bounds.height-view.h)/2:Math.max(-32,Math.min(bounds.height-view.h+32,state.player.y-view.h*.48));
 if(!cameraReady||lastZone!==state.zone||reduced){cam.x=tx;cam.y=ty;cameraReady=true;lastZone=state.zone;}
 else{cam.x+=(tx-cam.x)*.15;cam.y+=(ty-cam.y)*.15;}
}
function draw(){
 resize();const p=state.player,camp=state.zone==='camp';
 renderScene(ctx,state,view,cam,{facing:attackTimer?attackFacing:facing,hurt,dash,attackTimer,particles,building,moving,reduced,blueprint:pendingBuild});
 renderMiniMap($('map').getContext('2d'),state);
 const r=state.raid;
 $('raid-status').textContent=r.phase==='active'?`RAID · noyau ${r.core}/100 · ${r.enemies.filter(e=>e.hp>0).length} assaillants`:r.phase==='warning'?`RAID · ${Math.ceil(r.remaining)} s${state.zone==='street'?' · débute au retour':''}`:`Menace ${Math.floor(state.threat)}/60 · ${state.delivered<8?'protection tutoriel':'refuge en veille'}`;
 $('raid-status').classList.toggle('danger',r.phase!=='idle');
 $('summon').textContent=state.defender.recruited?`Écho-01 · ${Math.ceil(state.defender.hp)} PV`:'Invoquer Écho · 6';
 $('dog-action').textContent=state.dog.cooldown>0?`Chien ${Math.ceil(state.dog.cooldown)}s`:'Chien';
 $('dog-action').disabled=state.dog.cooldown>0;
 $('report-open').disabled=!r.result;
 $('repair').textContent=`Réparer · ${Object.keys(state.wallHealth).length}`;
 $('health').textContent=`${Math.ceil(p.hp)} / 100`;$('hpbar').value=p.hp;$('stamina').textContent=Math.floor(p.stamina);$('spbar').value=p.stamina;$('stock').textContent=`Réserve ${state.stock}`;$('bag').textContent=`Sac ${state.bag}/12`;$('weapon').textContent=weapons[state.loadout].name+(state.weapon===2?' +':'');$('zone').textContent=camp?'STATION 07':'LES CENDRES';$('time').textContent=state.time%1080>=720?'Nuit · danger accru':state.time%1080>=660?'Crépuscule · rentre vite':'Jour';$('camp-tools').hidden=!camp;$('refuge-menu').hidden=!camp;$('objective').textContent=r.phase==='active'?'Défends le noyau ! Les murs peuvent céder.':r.phase==='warning'?'Invoque Écho-01 et prépare le refuge.':!state.delivered?'Ramène des ferrailles au noyau du refuge.':state.weapon===1?'Renforce ton arme à l’atelier · 10 ferrailles.':'Construis tes défenses · explore les dernières caches.';const t=target();$('interact').textContent=t?t.label:'Approche une caisse / un accès';$('interact').disabled=!t;$('message').classList.toggle('visible',messageTimer>0);$('interact').classList.toggle('ready',!!t);$('build-hint').hidden=!building;$('app').classList.toggle('under-attack',r.phase==='active');
}
let panelWasPaused=false;
function openArsenal(){panelWasPaused=paused;paused=true;clearInput();$('arsenal').hidden=false;$('arsenal-status').textContent=state.raid.phase==='active'?'Changement verrouillé pendant le raid.':'Choisis une arme : le changement est immédiat.';}
function closeArsenal(){$('arsenal').hidden=true;paused=panelWasPaused||!$('menu').hidden;}
$('arsenal-open').onclick=openArsenal;$('arsenal-close').onclick=closeArsenal;
for(const button of document.querySelectorAll('[data-weapon]'))button.onclick=()=>{
 if(attackTimer>0){$('arsenal-status').textContent='Termine ton attaque avant de changer d’arme.';return;}
 const result=equipWeapon(state,button.dataset.weapon);$('arsenal-status').textContent=result;say(result);persist();
};
function openMap(){panelWasPaused=paused;paused=true;clearInput();$('world-view').hidden=false;renderWorldMap($('world-map').getContext('2d'),state);}
function closeMap(){$('world-view').hidden=true;paused=panelWasPaused||!$('menu').hidden;}
$('map-open').onclick=openMap;$('map-close').onclick=closeMap;
$('refuge-menu').onclick=()=>$('camp-tools').classList.toggle('collapsed');
$('play').disabled=true;$('play').textContent='Préparation de l’expédition…';
loadArt().then(ok=>{if(artImages.district){$('menu').style.backgroundImage='linear-gradient(110deg,#081320ef,#0a1827c9 60%,#152b2ce8),url("'+artImages.district.src+'")';$('menu').style.backgroundSize='cover';$('menu').style.backgroundPosition='center';}$('play').disabled=false;$('play').textContent='Entrer dans les Cendres →';for(const icon of document.querySelectorAll('[data-icon]'))drawWeaponIcon(icon.getContext('2d'),icon.dataset.icon,0,0,96);$('asset-status').textContent=ok?'Ton équipement est prêt.':'Certains visuels ne sont pas chargés. Actualise avec une connexion.';});
load(false);function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;if(!paused)update(dt);draw();if(!$('menu').hidden){const mc=$('menu-hero').getContext('2d');mc.clearRect(0,0,240,260);mc.save();mc.translate(120,245);mc.scale(3.6,3.6);drawHero(mc,{x:0,y:0},state.loadout,{row:0,column:0});mc.restore();}if(!$('arsenal').hidden){const c=$('hero-preview').getContext('2d');c.clearRect(0,0,240,180);c.save();c.translate(120,155);c.scale(2,2);drawHero(c,{x:0,y:0},state.loadout,animationFrame({x:0,y:1},!reduced,reduced?0:now/1000));c.restore();for(const b of document.querySelectorAll('[data-weapon]'))b.classList.toggle('selected',b.dataset.weapon===state.loadout);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
