import {registerCityKill} from '../src/city-ai.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,pathTo,toggleWall,validSave,canStand,collect,deposit,upgrade,transition,migrateSave,streetWalls} from '../src/world.js';
test('navigation contourne un mur et recalcule après construction',()=>{const s=createWorld();const before=pathTo(s.walls,[10,7],[10,3]);assert.ok(before.length>5);toggleWall(s,10,6);const after=pathTo(s.walls,[10,7],[10,3]);assert.ok(after.length);assert.ok(after.every(p=>!s.walls.includes(p.join(','))));});
test('construction débite une fois, protège accès et occupants',()=>{const s=createWorld();toggleWall(s,14,9);assert.equal(s.stock,8);toggleWall(s,12,9,[{x:400,y:304}]);assert.equal(s.stock,8);toggleWall(s,20,10);assert.equal(s.stock,6);assert.equal(canStand(s.walls,656,336),false);toggleWall(s,20,10);assert.equal(s.stock,8);transition(s);toggleWall(s,20,10);assert.equal(s.stock,8);});
test('boucle fouille, sac plein sans destruction, retour et amélioration',()=>{const s=createWorld();transition(s);collect(s,0);collect(s,1);collect(s,2);assert.equal(s.bag,12);assert.equal(s.crates[2].amount,1);collect(s,2);assert.equal(s.crates[2].amount,1);s.enemies[0].hp=0;registerCityKill(s,s.enemies[0]);transition(s);assert.equal(s.bag,12);deposit(s);assert.equal(s.stock,20);assert.equal(s.delivered,12);assert.equal(s.bag,0);deposit(s);assert.equal(s.stock,20);upgrade(s);assert.equal(s.weapon,2);assert.equal(s.stock,10);upgrade(s);assert.equal(s.stock,10);transition(s);assert.equal(s.enemies[0].hp,0);assert.equal(s.crates[0].amount,0);assert.ok(validSave(s));});
test('sauvegarde valide, migration v1, refus de corruption',()=>{const s=createWorld();assert.ok(validSave(JSON.parse(JSON.stringify(s))));assert.equal(validSave({...s,stock:-1}),false);assert.equal(validSave({...s,bag:13}),false);assert.equal(validSave({...s,player:{...s.player,x:NaN}}),false);assert.equal(validSave({...s,walls:['900,900']}),false);assert.ok(migrateSave({...s,version:1}));assert.equal(migrateSave({...s,version:10}),null);assert.ok(s.enemies.every(e=>canStand(streetWalls,e.x,e.y)));});
import './defense.test.js';
import './expansion.test.js';
import './camp-motion.test.js';

import './city-ai.test.js';
