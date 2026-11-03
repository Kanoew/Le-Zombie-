import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,mapSize,pathTo,streetWalls,validSave,migrateSave,transition,canStand} from '../src/world.js';
import {weapons,equipWeapon,animationFrame} from '../src/weapons.js';
import {heroAtlases} from '../src/atlas-data.js';
test('quartier étendu : chaque cache et chaque ennemi sont accessibles depuis le refuge',()=>{
 const s=createWorld();transition(s);assert.deepEqual(mapSize('street'),{cols:60,rows:40,width:1920,height:1280});
 const origin=[Math.floor(s.player.x/32),Math.floor(s.player.y/32)];
 for(const a of [...s.crates,...s.enemies]){assert.ok(canStand(streetWalls,a.x,a.y));assert.ok(pathTo(streetWalls,origin,[Math.floor(a.x/32),Math.floor(a.y/32)]).length);}
 assert.ok(validSave(s));
});
test('migration v3 conserve coûts, morts et caches vidées avec les nouvelles positions',()=>{
 const old={...createWorld(),version:3,zone:'street',stock:19,bag:7,weapon:2,crates:[{x:208,y:208,amount:0},{x:720,y:144,amount:2},{x:752,y:400,amount:4},{x:304,y:432,amount:5},{x:560,y:272,amount:4}],enemies:createWorld().enemies.slice(0,4)};
 old.enemies[0].hp=0;const s=migrateSave(old);assert.ok(s);assert.equal(s.stock,19);assert.equal(s.bag,7);assert.equal(s.weapon,2);assert.equal(s.crates[0].amount,0);assert.equal(s.crates[1].amount,2);assert.equal(s.enemies[0].hp,0);assert.equal(s.crates.length,8);assert.ok(validSave(s));
});
test('trois armes distinctes et impossibilité de changer pendant un raid',()=>{
 const s=createWorld();equipWeapon(s,'sabre');assert.equal(s.loadout,'sabre');assert.ok(weapons.sabre.range>weapons.machete.range);assert.ok(weapons.hatchet.damage>weapons.machete.damage);s.raid.phase='active';equipWeapon(s,'hatchet');assert.equal(s.loadout,'sabre');
});
test('atlas : 192 frames dans leurs limites et animation attaque alignée sur le cycle',()=>{
 for(const atlas of Object.values(heroAtlases)){assert.equal(atlas.rows.length,8);for(const row of atlas.rows){assert.equal(row.length,8);for(const f of row){assert.ok(f.w>0&&f.h>0&&f.x>=0&&f.y>=0&&f.x+f.w<=atlas.width&&f.y+f.h<=atlas.height);assert.ok(f.anchorX>=0&&f.anchorX<=f.w&&f.anchorY>=0&&f.anchorY<=f.h);}}}
 for(const facing of [{x:0,y:1},{x:-1,y:0},{x:1,y:0},{x:0,y:-1}]){
 const idle=animationFrame(facing,false,0),attack=animationFrame(facing,false,0,.32,.64);assert.equal(attack.row,idle.row+1);assert.equal(attack.column,4);assert.equal(idle.column,0);
 }
});
