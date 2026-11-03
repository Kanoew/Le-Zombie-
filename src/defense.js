import { entity, key, canStand, pathTo, activeWalls } from './world.js?v=0.5';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const tileOf=a=>[Math.floor(a.x/32),Math.floor(a.y/32)];
const corePosition={x:464,y:304};

export function recruitDefender(s) {
  if(s.zone!=='camp'||s.raid.phase==='active') return 'Invocation disponible au refuge, hors raid.';
  if(s.defender.recruited) return 'Écho-01 protège déjà le refuge. Aucun coût supplémentaire.';
  if(s.stock<6) return 'Reconstituer Écho-01 : 6 ferrailles.';
  s.stock-=6; s.defender.recruited=true;
  return 'Écho-01 reconstitué · défenseur de contact prêt au poste.';
}
export function repairWalls(s) {
  if(s.zone!=='camp'||s.raid.phase==='active') return 'Réparations bloquées pendant le raid ou hors du refuge.';
  const damaged=Object.keys(s.wallHealth);
  if(!damaged.length) return 'Tous les murs encore debout sont intacts.';
  const count=Math.min(damaged.length,s.stock);
  if(!count) return 'Réparer : 1 ferraille par mur endommagé.';
  for(const id of damaged.slice(0,count)) delete s.wallHealth[id];
  s.stock-=count;
  return `${count} mur(s) réparé(s) · −${count} ferrailles`;
}
export function damageWall(s,id,damage) {
  const i=s.walls.indexOf(id);
  if(i<0) return false;
  const hp=(s.wallHealth[id]??100)-damage;
  if(hp<=0) {s.walls.splice(i,1);delete s.wallHealth[id];s.raid.destroyed++;}
  else s.wallHealth[id]=hp;
  return true;
}
export function finishRaid(s,victory) {
  const r=s.raid;
  if(r.phase!=='active') return null;
  const loss=victory?0:Math.floor(s.stock*.1),reward=victory?6:0;
  s.stock+=reward-loss;
  r.result={id:r.number,victory,loss,reward,destroyed:r.destroyed,hits:r.hits};
  r.phase='idle';r.remaining=0;r.enemies=[];r.core=100;s.threat=0;
  return victory?'Raid repoussé · +6 ferrailles · rapport disponible.':`Refuge préservé · pertes plafonnées : ${loss} ferrailles · rapport disponible.`;
}
// All movement follows the same collision grid as the player. Actors align with tile
// centres at corners so a changed wall cannot trap them between two waypoints.
export function navigateCamp(s,a,target,speed,dt,stop=24) {
  if(distance(a,target)<stop) return;
  const path=pathTo(s.walls,tileOf(a),tileOf(target));
  if(!path.length) return;
  const center={x:(path[0][0]+.5)*32,y:(path[0][1]+.5)*32};
  let p=path.length>1?{x:(path[1][0]+.5)*32,y:(path[1][1]+.5)*32}:target;
  if(path.length>1&&((path[1][0]!==path[0][0]&&Math.abs(a.y-center.y)>1)||(path[1][1]!==path[0][1]&&Math.abs(a.x-center.x)>1))) p=center;
  const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);
  if(!d) return;
  const step=Math.min(speed*dt,d);
  if(canStand(s.walls,a.x+dx/d*step,a.y)) a.x+=dx/d*step;
  if(canStand(s.walls,a.x,a.y+dy/d*step)) a.y+=dy/d*step;
}
function spawnRaid(s) {
  const positions=[[27,6],[27,11],[22,15],[6,15]];
  const enemies=[];
  for(const [x,y] of positions) {
    let p={x:(x+.5)*32,y:(y+.5)*32};
    if(!canStand(s.walls,p.x,p.y)) {
      const candidates=[];
      for(let j=1;j<17;j++) for(let i=1;i<29;i++) if(canStand(s.walls,(i+.5)*32,(j+.5)*32)) candidates.push({x:(i+.5)*32,y:(j+.5)*32});
      p=candidates.sort((a,b)=>distance(a,p)-distance(b,p))[0];
    }
    if(p) enemies.push(entity(p.x,p.y));
  }
  return enemies;
}
export function tickRaid(s,dt) {
  const r=s.raid;
  if(r.phase==='idle'&&s.threat>=60&&s.delivered>=8) {
    r.phase='warning';r.remaining=45;
    return 'Signal hostile · raid dans 45 secondes de jeu. Invoque Écho-01 et prépare tes murs.';
  }
  if(r.phase==='warning') {
    r.remaining=Math.max(0,r.remaining-dt);
    if(r.remaining===0&&s.zone==='camp') {
      r.phase='active';r.number++;r.core=100;r.destroyed=0;r.hits=0;r.remaining=120;r.enemies=spawnRaid(s);
      return 'RAID · protège le noyau ! Construction, soins et sortie verrouillés.';
    }
    return null;
  }
  if(r.phase!=='active') return null;
  r.remaining=Math.max(0,r.remaining-dt);
  if(!r.enemies.some(e=>e.hp>0)) return finishRaid(s,true);
  const d=s.defender;
  if(d.recruited&&d.hp>0) {
    d.cooldown=Math.max(0,d.cooldown-dt);
    const target=r.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a,d)-distance(b,d))[0];
    if(target) {
      const route=pathTo(s.walls,tileOf(d),tileOf(target));
      if(distance(d,target)<49&&route.length>0&&route.length<=3&&!d.cooldown) { target.hp-=20;d.cooldown=.8;r.hits++; }
      else navigateCamp(s,d,target,85,dt,32);
    }
  }
  for(const e of r.enemies) {
    if(e.hp<=0) continue;
    const target=d.recruited&&d.hp>0&&distance(e,d)<110?d:corePosition;
    e.cooldown=Math.max(0,e.cooldown-dt);
    // Barricades remain destructible even when a player has enclosed the core.
    const wall=s.walls.map(id=>{const [x,y]=id.split(',').map(Number);return {id,x:(x+.5)*32,y:(y+.5)*32};}).filter(w=>distance(e,w)<49).sort((a,b)=>distance(e,a)-distance(e,b))[0];
    const route=pathTo(s.walls,tileOf(e),tileOf(target));
    if(e.windup>0) {
      e.windup=Math.max(0,e.windup-dt);
      if(!e.windup) {
        e.cooldown=1;
        if(wall) damageWall(s,wall.id,25);
        else if(distance(e,target)<48) {if(target===d)d.hp=Math.max(0,d.hp-12);else r.core=Math.max(0,r.core-12);}
      }
    } else if(!e.cooldown&&(wall||distance(e,target)<44)) e.windup=.7;
    else if(!e.cooldown) {
      if(route.length) navigateCamp(s,e,target,47,dt,30);
      else {
        // Approach the nearest reachable face of a wall before breaking it.
        let best=null;
        const origin=tileOf(e),queue=[origin],reachable=new Set([key(...origin)]);
        for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const [x,y]=queue[i],next=[x+dx,y+dy],id=key(...next);
          if(!reachable.has(id)&&canStand(s.walls,(next[0]+.5)*32,(next[1]+.5)*32)){reachable.add(id);queue.push(next);}
        }
        for(const id of s.walls) {
          const [x,y]=id.split(',').map(Number);
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const point={x:(x+dx+.5)*32,y:(y+dy+.5)*32};
            if(!canStand(s.walls,point.x,point.y))continue;
            if((!best||distance(e,point)<distance(e,best))&&reachable.has(key(...tileOf(point))))best=point;
          }
        }
        if(best)navigateCamp(s,e,best,47,dt,5);
      }
    }
  }
  if(!r.enemies.some(e=>e.hp>0)) return finishRaid(s,true);
  if(r.core<=0||r.remaining===0) return finishRaid(s,false);
  return null;
}
export function commandDog(s) {
  if(s.dog.cooldown>0) return 'Le chien récupère sa capacité.';
  const enemies=s.zone==='camp'?s.raid.enemies:s.enemies;
  const target=enemies.filter(e=>e.hp>0&&distance(e,s.dog)<80).sort((a,b)=>distance(a,s.dog)-distance(b,s.dog)).find(e=>{const path=pathTo(activeWalls(s),tileOf(s.dog),tileOf(e));return path.length>0&&path.length<=3;});
  if(!target) return 'Aucun infecté accessible à portée du chien.';
  target.windup=0;target.cooldown=2;s.dog.cooldown=12;
  return 'Le chien interrompt l’infecté · 12 secondes de recharge.';
}
