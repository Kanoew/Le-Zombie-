import {registerCityKill,tickCityLifecycle} from '../src/city-ai.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,entity,validSave,transition,migrateSave,toggleWall,collect,deposit,streetWalls} from '../src/world.js';
import {recruitDefender,repairWalls,damageWall,tickRaid,finishRaid,commandDog} from '../src/defense.js';
const ready=()=>{const s=createWorld();s.stock=30;s.delivered=12;s.threat=60;return s;};
function start(s){tickRaid(s,.05);s.raid.remaining=0;tickRaid(s,.05);assert.equal(s.raid.phase,'active');}
test('menace : protection tutoriel, alerte, raid uniquement au retour',()=>{
 const s=createWorld();s.threat=100;tickRaid(s,1);assert.equal(s.raid.phase,'idle');s.delivered=8;tickRaid(s,1);assert.equal(s.raid.remaining,45);
 transition(s);tickRaid(s,46);assert.equal(s.raid.phase,'warning');assert.equal(s.raid.remaining,0);transition(s);tickRaid(s,.05);assert.equal(s.raid.phase,'active');assert.equal(s.raid.enemies.length,4);assert.ok(validSave(s));
 const copy=JSON.parse(JSON.stringify(s));assert.ok(migrateSave(copy));
 const stock=s.stock,walls=[...s.walls];toggleWall(s,20,10);deposit(s);transition(s);repairWalls(s);assert.equal(s.stock,stock);assert.deepEqual(s.walls,walls);assert.equal(s.zone,'camp');
});
test('défenseur : invocation unique, combat et restauration après raid sans nouveau débit',()=>{
 const s=ready();recruitDefender(s);assert.equal(s.stock,24);recruitDefender(s);assert.equal(s.stock,24);start(s);
 for(let i=0;i<2500&&s.raid.phase==='active';i++){tickRaid(s,.05);if(i%100===0)assert.ok(validSave(s),'simulation doit rester sauvegardable');}
 assert.equal(s.raid.phase,'idle');assert.ok(s.raid.result.hits>0);const stock=s.stock;
 for(let i=0;i<100;i++)tickRaid(s,.1);assert.equal(s.stock,stock);assert.equal(finishRaid(s,false),null);assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 deposit(s);assert.equal(s.defender.hp,100);
});
test('enceinte fermée : ennemis atteignent les murs et peuvent ouvrir une brèche',()=>{
 const s=ready();s.walls=[];s.dog.x=464;s.dog.y=304;
 for(let x=12;x<=16;x++)s.walls.push(`${x},7`,`${x},11`);
 for(let y=8;y<=10;y++)s.walls.push(`12,${y}`,`16,${y}`);
 start(s);for(let i=0;i<2405&&s.raid.phase==='active';i++)tickRaid(s,.05);
 assert.equal(s.raid.phase,'idle');assert.ok(s.raid.result.destroyed>0);assert.ok(s.raid.result.loss<=3);assert.ok(validSave(s));
});
test('réparations exactes et rapport victoire non réappliqué après rechargement',()=>{
 const s=ready();damageWall(s,s.walls[0],25);assert.equal(s.wallHealth[s.walls[0]],75);repairWalls(s);assert.equal(s.stock,29);assert.deepEqual(s.wallHealth,{});repairWalls(s);assert.equal(s.stock,29);
 start(s);s.raid.enemies.forEach(e=>e.hp=0);tickRaid(s,.05);assert.equal(s.stock,35);const restored=migrateSave(JSON.parse(JSON.stringify(s)));assert.ok(restored);finishRaid(restored,true);tickRaid(restored,10);assert.equal(restored.stock,35);assert.equal(restored.raid.result.id,1);
});
test('chien : interruption de contact, recharge et refus à travers un obstacle',()=>{
 const s=createWorld();s.zone='street';s.dog={x:960,y:560,cooldown:0};s.enemies=[entity(960,592),...s.enemies.slice(1)];s.enemies[0].windup=.5;
 commandDog(s);assert.equal(s.enemies[0].windup,0);assert.equal(s.dog.cooldown,12);s.enemies[0].windup=.5;commandDog(s);assert.equal(s.enemies[0].windup,.5);
 s.zone='camp';s.walls=['8,3'];s.dog={x:240,y:112,cooldown:0};s.raid.enemies=[entity(304,112)];commandDog(s);assert.equal(s.dog.cooldown,0);
 assert.ok(streetWalls.includes('8,3'));
});
test('renouvellement après 5 minutes actives sans duplication par transition',()=>{
 const s=createWorld();transition(s);collect(s,0);s.enemies[0].hp=0;registerCityKill(s,s.enemies[0]);transition(s);transition(s);assert.equal(s.crates[0].amount,0);assert.equal(s.enemies[0].hp,0);transition(s);s.time=300;transition(s);assert.equal(s.crates[0].amount,4);assert.equal(s.enemies[0].hp,0);assert.equal(s.enemies[0].respawnAt,90);tickCityLifecycle(s);assert.equal(s.enemies[0].hp,60);assert.equal(s.restockAt,600);
});
test('migration réelle v2 et rejet d’un raid corrompu',()=>{
 const s=createWorld();const old={...s,version:2};for(const k of ['raid','defender','threat','restockAt','wallHealth'])delete old[k];delete old.dog.cooldown;const migrated=migrateSave(old);assert.ok(migrated);assert.equal(migrated.version,8);assert.equal(migrated.stock,s.stock);assert.deepEqual(migrated.walls,s.walls);
 assert.equal(migrateSave({version:1}),null);assert.equal(migrateSave({version:2}),null);assert.equal(validSave({...createWorld(),raid:{phase:'active'}}),false);assert.equal(validSave({...createWorld(),wallHealth:{'28,10':20}}),false);
});
