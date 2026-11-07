import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,transition,collect,deposit,validSave,migrateSave} from '../src/world.js';
import {traceShot,firePistol,craftAmmo} from '../src/firearms.js';
import {advanceJourney,journeyObjective} from '../src/journey.js';
import {installModule} from '../src/camp.js';

test('tir : premier ennemi seulement, mur bloquant et orientation normalisée',()=>{
 const a={x:460,y:400,hp:60},b={x:520,y:400,hp:60},origin={x:400,y:400};
 let shot=traceShot([],[b,a],origin,{x:4,y:0});assert.equal(shot.target,a);assert.equal(shot.endX,446);
 shot=traceShot(['13,12'],[a,b],origin,{x:1,y:0});assert.equal(shot.target,null);assert.equal(shot.wall,true);assert.ok(shot.endX<=418);
 assert.equal(traceShot([],[a],origin,{x:0,y:0}),null);
});
test('pistolet : cartouche, dégâts, mort et délai sauvegardés ensemble',()=>{
 const s=createWorld();transition(s);s.loadout='pistol';s.player.x=960;s.player.y=608;s.dog.x=928;s.dog.y=608;s.ammo=1;
 s.enemies[0].x=1024;s.enemies[0].y=608;s.enemies[0].hp=20;
 const shot=firePistol(s,{x:1,y:0});assert.equal(shot.ok,true);assert.equal(shot.killed,true);assert.equal(s.ammo,0);assert.equal(s.kills,1);assert.equal(s.enemies[0].respawnAt,90);assert.ok(validSave(s));
 const again=firePistol(s,{x:1,y:0});assert.equal(again.ok,false);assert.equal(s.kills,1);assert.equal(s.enemies[0].respawnAt,90);
 assert.ok(validSave(JSON.parse(JSON.stringify(s))));
});
test('cartouches : coût exact et refus sans consommation',()=>{
 const s=createWorld();s.ammo=18;craftAmmo(s);assert.equal(s.stock,6);assert.equal(s.ammo,24);
 s.ammo=85;craftAmmo(s);assert.equal(s.stock,6);assert.equal(s.ammo,85);
 s.ammo=18;s.raid.phase='active';craftAmmo(s);assert.equal(s.stock,6);assert.equal(s.ammo,18);
 s.raid.phase='idle';s.stock=1;craftAmmo(s);assert.equal(s.stock,1);assert.equal(s.ammo,18);
});
test('parcours : objectifs liés aux actions et récompense unique au premier aménagement',()=>{
 const s=createWorld();assert.match(journeyObjective(s).title,/Pars explorer/);advanceJourney(s);assert.equal(s.journey.stage,0);
 transition(s);advanceJourney(s);assert.equal(s.journey.stage,1);collect(s,0);advanceJourney(s);assert.equal(s.journey.stage,2);
 transition(s);deposit(s);advanceJourney(s);assert.equal(s.journey.stage,3);installModule(s,'bunks');const before=s.stock;
 const result=advanceJourney(s);assert.equal(result.bonus,true);assert.equal(s.journey.stage,4);assert.equal(s.stock,before+6);assert.equal(s.ammo,30);
 for(let i=0;i<20;i++)advanceJourney(s);assert.equal(s.stock,before+6);assert.equal(s.ammo,30);assert.ok(validSave(s));
 const restored=migrateSave(JSON.parse(JSON.stringify(s)));advanceJourney(restored);assert.equal(restored.stock,s.stock);assert.equal(restored.ammo,30);
 s.raid.phase='warning';s.raid.remaining=45;s.zone='street';assert.match(journeyObjective(s).title,/Prépare/);assert.deepEqual(journeyObjective(s).target,{x:80,y:608});
 s.raid.phase='active';s.zone='camp';assert.match(journeyObjective(s).title,/Défends/);assert.deepEqual(journeyObjective(s).target,{x:464,y:304});
});
test('migration v7 : inventaire, patrouilles et camp préservés ; munitions initialisées',()=>{
 const old=createWorld();old.version=7;delete old.ammo;delete old.journey;old.stock=19;old.loadout='sabre';old.enemies[2].hp=33;old.enemies[1].patrolIdx=2;
 const migrated=migrateSave(old);assert.ok(migrated);assert.equal(migrated.stock,19);assert.equal(migrated.loadout,'sabre');assert.deepEqual(migrated.enemies,old.enemies);assert.equal(migrated.ammo,18);assert.equal(migrated.journey.stage,0);assert.ok(validSave(migrated));
 assert.equal(validSave({...migrated,ammo:-1}),false);assert.equal(validSave({...migrated,journey:{stage:9,rewarded:false}}),false);
});
