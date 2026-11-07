import {ENEMY_RESPAWN_DELAY,streetWalls} from './world.js?v=0.8';
import {followSmooth} from './motion.js?v=0.8';

export function registerCityKill(s,e){
  if(s.zone!=='street'||e.hp>0||e.respawnAt!=null)return false;
  e.respawnAt=s.time+ENEMY_RESPAWN_DELAY;
  return true;
}
export function tickCityLifecycle(s){
  let changed=false,respawned=0;
  for(const e of s.enemies){
    if(e.hp>0)continue;
    // Defensive handling for deaths introduced by future damage sources.
    if(e.respawnAt==null){e.respawnAt=s.time+ENEMY_RESPAWN_DELAY;changed=true;}
    if(s.zone!=='street'||s.time<e.respawnAt)continue;
    // Keep the original deadline while the player occupies the spawn area.
    if(Math.hypot(s.player.x-e.spawnX,s.player.y-e.spawnY)<160)continue;
    e.x=e.spawnX;e.y=e.spawnY;e.hp=e.kind==='brute'?90:60;
    e.respawnAt=null;e.windup=0;e.cooldown=2;e.hitFlash=0;e.patrolIdx=0;
    changed=true;respawned++;
  }
  return {changed,respawned};
}
export function tickCityPatrol(e,dt){
  if(e.hp<=0||e.cooldown>0||e.windup>0)return;
  const point=e.patrol[e.patrolIdx];
  if(Math.hypot(e.x-point.x,e.y-point.y)<36)e.patrolIdx=(e.patrolIdx+1)%e.patrol.length;
  followSmooth(streetWalls,e,e.patrol[e.patrolIdx],22,dt,28);
}
