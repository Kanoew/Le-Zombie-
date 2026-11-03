import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,validSave,migrateSave,activeWalls,canStand,streetWalls,transition} from '../src/world.js';
import {installModule,campPower,tickCamp} from '../src/camp.js';
import {steerPlayer,slideActor,followSmooth} from '../src/motion.js';
import {actorPresentation} from '../src/presentation.js';
test('installations : coûts uniques, énergie, obstacles et refus pendant raid',()=>{
 const s=createWorld();s.stock=40;installModule(s,'generator');assert.equal(s.stock,32);installModule(s,'generator');assert.equal(s.stock,32);installModule(s,'infirmary');installModule(s,'lights');installModule(s,'bunks');
 assert.equal(s.stock,18);assert.deepEqual(campPower(s),{supply:4,used:3,medical:true,lights:true});assert.equal(canStand(activeWalls(s),704,400),false);assert.ok(validSave(s));
 const t=createWorld();t.stock=20;t.raid.phase='active';installModule(t,'generator');assert.equal(t.stock,20);assert.equal(t.camp.built.generator,false);
});
test('couchages et infirmerie : récupération conditionnée, sans soin pendant raid',()=>{
 const s=createWorld();s.stock=40;s.defender.recruited=true;s.defender.hp=0;tickCamp(s,10);assert.equal(s.defender.hp,0);
 installModule(s,'bunks');tickCamp(s,9);assert.equal(s.defender.hp,10);installModule(s,'infirmary');tickCamp(s,9);assert.equal(s.defender.hp,20);
 installModule(s,'generator');tickCamp(s,9);assert.equal(s.defender.hp,40);s.raid.phase='active';tickCamp(s,20);assert.equal(s.defender.hp,40);s.raid.phase='idle';transition(s);tickCamp(s,20);assert.equal(s.defender.hp,40);
});
test('migration v4 conserve camp, sac, arsenal et position de la ville',()=>{
 const old=createWorld();old.version=4;delete old.camp;old.stock=19;old.bag=7;old.loadout='sabre';old.zone='street';old.player.x=960;old.player.y=608;old.dog.x=928;old.dog.y=608;delete old.enemies[0].kind;
 const n=migrateSave(old);assert.ok(n);assert.equal(n.stock,19);assert.equal(n.bag,7);assert.equal(n.loadout,'sabre');assert.equal(n.player.x,960);assert.ok(validSave(n));
});
test('déplacement : départ progressif, arrêt amorti et aucune traversée de mur',()=>{
 const a={x:400,y:304},v={x:0,y:0},walls=['13,9'];
 steerPlayer(walls,a,v,{x:1,y:0},1/60);assert.ok(v.x>0&&v.x<125);
 for(let i=0;i<90;i++)steerPlayer(walls,a,v,{x:1,y:0},1/60);assert.ok(a.x<=406.01);assert.ok(canStand(walls,a.x,a.y));
 const b={x:400,y:304};slideActor(walls,b,200,0);assert.ok(b.x<=406.01);
 const p={x:400,y:400},speed={x:100,y:0};for(let i=0;i<30;i++)steerPlayer([],p,speed,{x:0,y:0},1/60);assert.equal(speed.x,0);
});
test('navigation lissée : diagonale directe et contournement sans collision',()=>{
 const a={x:400,y:400};followSmooth([],a,{x:450,y:450},100,.1,0);assert.ok(a.x>400&&a.y>400);
 const s=createWorld();const dog={x:400,y:304};for(let i=0;i<600;i++){followSmooth(s.walls,dog,{x:400,y:112},120,.016,10);assert.ok(canStand(s.walls,dog.x,dog.y));}
 assert.ok(Math.hypot(dog.x-400,dog.y-112)<12);
 const city={x:960,y:608};followSmooth(streetWalls,city,{x:1056,y:704},100,.1,0);assert.ok(city.x>960&&city.y>608);
});
test('horloge visuelle : immobilité sans patinage, phase liée à la distance',()=>{
 const a={x:0,y:0};const v=actorPresentation(a);assert.equal(v.moving,false);a.x=25;actorPresentation(a);assert.equal(v.phase,.5);assert.equal(v.facing.x,1);actorPresentation(a);assert.equal(v.moving,false);assert.equal(v.phase,.5);
});
import {tickRaid} from '../src/defense.js';
test('raid avec camp équipé : navigation valide et défenseur actif',()=>{
 const s=createWorld();s.stock=60;s.defender.recruited=true;
 for(const id of ['generator','infirmary','bunks','lights'])installModule(s,id);
 s.delivered=12;s.threat=60;tickRaid(s,.05);s.raid.remaining=0;tickRaid(s,.05);
 for(let i=0;i<2500&&s.raid.phase==='active';i++){tickRaid(s,.05);if(i%100===0)assert.ok(validSave(s));}
 assert.equal(s.raid.phase,'idle');assert.ok(s.raid.result.hits>0);assert.ok(validSave(s));
});
