import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newAtlases} from '../src/atlas-new.js';
import {yejiPose} from '../src/yeji.js';
import {weapons,equipWeapon} from '../src/weapons.js';
import {createWorld,validSave,migrateSave,transition} from '../src/world.js';
import {fireWeapon} from '../src/firearms.js';

test('Yeji : 265 poses importées, échelles cohérentes et ancrage du saut conservé',()=>{
  assert.equal(Object.values(newAtlases).reduce((n,a)=>n+a.rows.flat().length,0),265);
  for(const [id,a] of Object.entries(newAtlases)){
    assert.equal(a.rows.length,id==='companion'?11:4);
    if(id!=='companion')assert.ok(a.rows.every(r=>r.length===6));
    for(const f of a.rows.flat()){
      assert.ok(f.w>0&&f.h>0&&f.x>=0&&f.y>=0&&f.x+f.w<=a.width&&f.y+f.h<=a.height);
      assert.ok(f.anchorX>=0&&f.anchorX<=f.w&&f.anchorY>0&&f.anchorY<=f.h+45);
    }
  }
  assert.ok(Math.abs(newAtlases.companion.rows[0][0].h*.303-newAtlases.pistol.rows[2][0].h*.2)<3);
  const jump=newAtlases.companion.rows[4][2];assert.ok(jump.anchorY>jump.h+30);
});

test('Yeji : course liée à la distance, quatre directions et impacts sur les poses d’attaque',()=>{
  const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
  for(const id of ['pistol','smg','shotgun','assault-rifle','katana','spiked-bat','scythe','chain-sickles']){
    const w=weapons[id];
    for(const [row,facing] of dirs.entries()){
      const columns=new Set();
      for(let i=0;i<60;i++){
        const pose=yejiPose({weapon:id,facing,attackRemaining:w.duration*(1-i/60),duration:w.duration});
        assert.equal(pose.atlas,id);assert.equal(pose.row,row);columns.add(pose.column);
        assert.ok(newAtlases[pose.atlas].rows[pose.row][pose.column]);
      }
      assert.equal(columns.size,6);
      const impact=yejiPose({weapon:id,facing,attackRemaining:w.duration*(1-w.hitFraction),duration:w.duration});
      assert.equal(impact.column,Math.floor(6*w.hitFraction));
    }
  }
  assert.equal(yejiPose({moving:true,facing:{x:-1,y:0}}).row,2);
  assert.equal(yejiPose({moving:true,facing:{x:0,y:1},side:-1}).row,2);
  assert.equal(yejiPose({moving:true,walkPhase:.5}).column,4);
  assert.equal(yejiPose({elapsed:100,reduced:true}).column,0);
  assert.equal(yejiPose({greeting:true}).row,3);
  assert.equal(yejiPose({dash:.08}).row,4);
  assert.equal(yejiPose({hurt:.3}).row,5);
  assert.equal(yejiPose({weapon:'hatchet',attackRemaining:.4}).atlas,'spiked-bat');
});

test('arsenal Yeji : sauvegarde des huit armes, anciens équipements et statistiques conservés',()=>{
  for(const id of Object.keys(weapons)){
    const s=createWorld();equipWeapon(s,id);assert.ok(validSave(s));assert.equal(migrateSave(JSON.parse(JSON.stringify(s))).loadout,id);
  }
  assert.equal(weapons.machete.damage,30);assert.equal(weapons.sabre.stamina,16);assert.equal(weapons.hatchet.damage,48);
  assert.equal(validSave({...createWorld(),loadout:'toString'}),false);
});

test('fusil à pompe : cinq plombs, une cartouche, mort comptée une fois et dégâts sans traverser les murs',()=>{
  const s=createWorld();transition(s);s.loadout='shotgun';s.player.x=960;s.player.y=608;
  for(const e of s.enemies){e.hp=0;e.respawnAt=90;}
  const target=s.enemies[0];Object.assign(target,{x:1000,y:608,hp:40,respawnAt:null});
  const result=fireWeapon(s,{x:1,y:0});assert.equal(result.shots.length,5);assert.equal(s.ammo,17);assert.equal(result.hits.length,1);assert.equal(result.damage,60);assert.equal(s.kills,1);assert.equal(target.respawnAt,90);
  const before=s.ammo;s.zone='camp';s.player.x=400;s.player.y=400;s.walls=['13,12'];
  s.raid.enemies=[{x:460,y:400,hp:60}];fireWeapon(s,{x:1,y:0});assert.equal(s.raid.enemies[0].hp,60);assert.equal(s.ammo,before-1);
});

test('armes à feu : dégâts et portée propres, refus d’une arme de mêlée sans débit',()=>{
  for(const id of ['pistol','smg','assault-rifle']){
    const s=createWorld();transition(s);s.loadout=id;s.player.x=960;s.player.y=608;
    for(const e of s.enemies){e.hp=0;e.respawnAt=90;}
    Object.assign(s.enemies[0],{x:1050,y:608,hp:60,respawnAt:null});
    const shot=fireWeapon(s,{x:1,y:0});assert.equal(shot.damage,weapons[id].damage);assert.equal(s.enemies[0].hp,60-weapons[id].damage);assert.equal(s.ammo,17);
  }
  const s=createWorld(),before=s.ammo;assert.equal(fireWeapon(s,{x:1,y:0}).ok,false);assert.equal(s.ammo,before);
});
