import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,newEnemies,streetWalls,canStand,pathTo,validSave,migrateSave,transition,collect} from '../src/world.js';
import {registerCityKill,tickCityLifecycle,tickCityPatrol} from '../src/city-ai.js';

test('chaque patrouille est accessible et boucle sans se bloquer pendant deux minutes',()=>{
 const s=createWorld();
 assert.deepEqual(newEnemies().map(e=>e.patrol),s.enemies.map(e=>e.patrol),'génération déterministe');
 for(const e of s.enemies){
  for(const p of e.patrol){assert.ok(canStand(streetWalls,p.x,p.y));assert.ok(pathTo(streetWalls,[e.spawnX/32|0,e.spawnY/32|0],[p.x/32|0,p.y/32|0]).length);}
  let reached=0;
  for(let i=0;i<1200;i++){const before=e.patrolIdx;tickCityPatrol(e,.1);if(e.patrolIdx!==before)reached++;assert.ok(canStand(streetWalls,e.x,e.y));}
  assert.ok(reached>=6,`patrouille de ${e.spawnX},${e.spawnY} bloquée : ${reached} étapes`);
 }
 assert.ok(validSave(s));
});
test('le retour individuel ne survient pas avant 90 secondes et une mort ne redécale pas l’échéance',()=>{
 const s=createWorld();transition(s);s.time=299;const e=s.enemies[0];e.hp=0;
 assert.equal(registerCityKill(s,e),true);assert.equal(e.respawnAt,389);
 s.time=310;assert.equal(registerCityKill(s,e),false);assert.equal(e.respawnAt,389);
 s.time=388.999;assert.equal(tickCityLifecycle(s).respawned,0);assert.equal(e.hp,0);
 s.time=389;assert.equal(tickCityLifecycle(s).respawned,1);assert.equal(e.hp,60);assert.equal(e.respawnAt,null);assert.equal(e.cooldown,2);
 e.hp=35;assert.equal(tickCityLifecycle(s).respawned,0);assert.equal(e.hp,35,'ne soigne pas un ennemi déjà revenu');
});
test('renouveler les caisses et changer de carte préserve les ennemis et leurs délais',()=>{
 const s=createWorld();transition(s);collect(s,0);s.time=299;s.enemies[0].hp=0;registerCityKill(s,s.enemies[0]);s.enemies[1].hp=17;s.enemies[1].patrolIdx=2;
 const enemies=structuredClone(s.enemies);transition(s);s.time=301;transition(s);
 assert.equal(s.crates[0].amount,4);assert.deepEqual(s.enemies,enemies);
 assert.equal(tickCityLifecycle(s).respawned,0);assert.equal(s.enemies[0].respawnAt,389);assert.ok(validSave(s));
});
test('une échéance passée au camp est conservée jusqu’au retour en expédition',()=>{
 const s=createWorld();transition(s);s.enemies[0].hp=0;registerCityKill(s,s.enemies[0]);transition(s);s.time=120;
 assert.equal(tickCityLifecycle(s).respawned,0);assert.equal(s.enemies[0].hp,0);assert.equal(s.enemies[0].respawnAt,90);
 transition(s);assert.equal(tickCityLifecycle(s).respawned,1);assert.equal(s.enemies[0].hp,60);
});
test('pas de réapparition sur le joueur, et délai conservé tant qu’il reste à proximité',()=>{
 const s=createWorld();transition(s);const e=s.enemies[0];e.hp=0;registerCityKill(s,e);s.player.x=e.spawnX;s.player.y=e.spawnY;s.time=100;
 assert.equal(tickCityLifecycle(s).respawned,0);assert.equal(e.respawnAt,90);
 s.player.x=80;s.player.y=608;assert.equal(tickCityLifecycle(s).respawned,1);
});
test('migration v5 et v6 : morts planifiés, patrouilles réparées et progression conservée',()=>{
 for(const version of [5,6]){
  const old=createWorld();old.version=version;old.stock=17;old.bag=6;old.time=400;old.loadout='sabre';old.camp.built.generator=true;
  old.enemies[0].hp=0;old.enemies[0].respawnAt=null;old.enemies[1].hp=0;old.enemies[1].respawnAt=480;
  old.enemies[2].hp=33;old.enemies[2].patrol=[{x:564,y:467},{x:10,y:10},{x:0,y:0}];
  const migrated=migrateSave(old);assert.ok(migrated);assert.equal(migrated.version,7);assert.equal(migrated.enemies[0].hp,0);assert.equal(migrated.enemies[0].respawnAt,490);assert.equal(migrated.enemies[1].respawnAt,480);assert.equal(migrated.enemies[2].hp,33);
  assert.equal(migrated.stock,17);assert.equal(migrated.bag,6);assert.equal(migrated.loadout,'sabre');assert.equal(migrated.camp.built.generator,true);assert.ok(validSave(migrated));
  assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(migrated))),migrated,'une seconde reprise ne repousse pas le délai');
 }
});
test('sauvegarde v7 : rejette les métadonnées de navigation ou de retour corrompues',()=>{
 for(const edit of [e=>delete e.patrol,e=>e.patrol=[],e=>e.patrolIdx=3,e=>e.patrol[1]={...e.patrol[0]},e=>e.patrol[0]={x:64,y:64},e=>delete e.spawnX,e=>e.spawnY=NaN,e=>e.hp=0,e=>e.respawnAt=90]){
  const s=createWorld();edit(s.enemies[0]);assert.equal(validSave(s),false);
 }
});
test('une migration v6 après expiration garde l’échéance et ne ressuscite pas pendant le chargement',()=>{
 const s=createWorld();s.version=6;s.time=200;s.enemies[0].hp=0;s.enemies[0].respawnAt=90;
 const n=migrateSave(s);assert.ok(n);assert.equal(n.enemies[0].hp,0);assert.equal(n.enemies[0].respawnAt,90);assert.ok(validSave(n));
});
