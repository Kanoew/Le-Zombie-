export const COLS = 30, ROWS = 18, TILE = 32;
export const key = (x, y) => `${x},${y}`;
export const entity = (x, y, hp = 60) => ({ x, y, hp, windup: 0, cooldown: 0 });
const crateLayout = [[208,208,4],[720,144,5],[752,400,4],[304,432,5],[560,272,4]];
export const newCrates = () => crateLayout.map(([x,y,amount]) => ({x,y,amount}));
export const newEnemies = () => [entity(360,208), entity(650,300), entity(740,440,90), entity(280,400)];
export function createWorld() {
  const walls = [];
  for (let x=8; x<=16; x++) walls.push(key(x,5));
  for (let y=6; y<=11; y++) walls.push(key(8,y));
  return {
    version:3, zone:'camp', player:{x:464,y:304,hp:100,stamina:100},
    dog:{x:410,y:336,cooldown:0}, walls, wallHealth:{}, stock:8, bag:0,
    time:0, weapon:1, delivered:0, visits:0, crates:newCrates(), enemies:newEnemies(),
    kills:0, threat:0, restockAt:300,
    defender:{recruited:false,x:624,y:304,hp:100,cooldown:0},
    raid:{phase:'idle',remaining:0,number:0,enemies:[],core:100,destroyed:0,hits:0,result:null}
  };
}
export const streetWalls = (() => {
  const a=[];
  for (const [x,y,w,h] of [[8,3,5,2],[16,5,4,3],[5,10,3,2],[14,12,5,2],[24,2,3,5]])
    for(let i=x;i<x+w;i++) for(let j=y;j<y+h;j++) a.push(key(i,j));
  return a;
})();
export const activeWalls = s => s.zone==='camp' ? s.walls : streetWalls;
export const activeEnemies = s => s.zone==='camp' ? s.raid.enemies : s.enemies;
export function blocked(walls,x,y) {
  return x<1 || y<1 || x>=COLS-1 || y>=ROWS-1 || walls.includes(key(x,y));
}
export function canStand(walls,x,y,r=10) {
  return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dy]) => !blocked(walls,Math.floor((x+dx)/TILE),Math.floor((y+dy)/TILE)));
}
export function pathTo(walls,from,to) {
  const q=[from], seen=new Map([[key(...from),null]]);
  for(let i=0;i<q.length;i++) {
    const p=q[i];
    if(p[0]===to[0] && p[1]===to[1]) {
      const a=[]; let at=p;
      while(at) { a.unshift(at); at=seen.get(key(...at)); }
      return a;
    }
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const n=[p[0]+dx,p[1]+dy], id=key(...n);
      if(!seen.has(id) && !blocked(walls,...n)) { seen.set(id,p); q.push(n); }
    }
  }
  return [];
}
export function toggleWall(s,x,y,actors=[]) {
  if(s.zone!=='camp') return 'La construction est réservée au refuge.';
  if(s.raid.phase==='active') return 'Construction et démontage bloqués pendant le raid.';
  const id=key(x,y), i=s.walls.indexOf(id);
  if(i>=0) { s.walls.splice(i,1); delete s.wallHealth[id]; s.stock+=2; return 'Mur démonté · +2 ferrailles'; }
  if(blocked([],x,y)) return 'Hors du terrain.';
  if((x>=13&&x<=15&&y>=8&&y<=10)||(x>=25&&y>=7&&y<=10)||(x===19&&y>=9&&y<=10)) return 'Noyau, poste et passage protégés.';
  if(actors.some(a=>Math.abs(a.x-(x+.5)*TILE)<27&&Math.abs(a.y-(y+.5)*TILE)<27)) return 'Un occupant bloque cette case.';
  if(s.stock<2) return 'Il faut 2 ferrailles en réserve.';
  s.walls.push(id); s.stock-=2; return 'Mur construit · −2 ferrailles';
}
export function collect(s,index) {
  const c=s.crates[index];
  if(s.zone!=='street'||!c) return 'Rien à fouiller ici.';
  const n=Math.min(c.amount,12-s.bag);
  if(!n) return c.amount ? 'Sac plein · rentre déposer au refuge.' : 'Conteneur déjà vidé.';
  s.bag+=n; c.amount-=n; s.threat=Math.min(100,s.threat+n*5);
  return `+${n} ferrailles · sac ${s.bag}/12 · menace +${n*5}`;
}
export function deposit(s) {
  if(s.zone!=='camp') return 'Retourne au refuge.';
  if(s.raid.phase==='active') return 'Noyau verrouillé : repousse les assaillants avant de te soigner.';
  const n=s.bag; s.stock+=n; s.delivered+=n; s.bag=0; s.player.hp=100; s.defender.hp=100;
  return n ? `${n} ferrailles déposées · joueur et défenseur soignés` : 'Joueur et défenseur soignés au refuge';
}
export function upgrade(s) {
  if(s.zone!=='camp') return 'L’atelier est au refuge.';
  if(s.raid.phase==='active') return 'Atelier indisponible pendant le raid.';
  if(s.weapon>=2) return 'Machette déjà renforcée.';
  if(s.stock<10) return 'Renforcement : 10 ferrailles en réserve.';
  s.stock-=10; s.weapon=2; return 'Machette renforcée · dégâts 30 → 45';
}
export function transition(s) {
  if(s.raid.phase==='active') return 'Raid en cours : protège le refuge avant de partir.';
  s.zone=s.zone==='camp'?'street':'camp'; s.visits++;
  if(s.zone==='street'&&s.time>=s.restockAt) {
    s.crates=newCrates(); s.enemies=newEnemies(); s.restockAt=s.time+300;
  }
  s.player.x=s.zone==='camp'?816:112; s.player.y=304;
  // Legacy camps can have a wall on the old entry cell. Pick a safe nearby spawn.
  if(!canStand(activeWalls(s),s.player.x,s.player.y)) {
    outer:for(let y=8;y<17;y++) for(let x=24;x>0;x--) {
      if(canStand(activeWalls(s),(x+.5)*32,(y+.5)*32)) { s.player.x=(x+.5)*32;s.player.y=(y+.5)*32;break outer; }
    }
  }
  s.dog.x=s.player.x; s.dog.y=s.player.y;
  return s.zone==='camp'?'Refuge rejoint · dépose au noyau et prépare la défense.':'Quartier des Cendres · fouille et reviens en vie.';
}
const integer=(n,max=1e7)=>Number.isInteger(n)&&n>=0&&n<=max;
const finite=(n,max=1e9)=>Number.isFinite(n)&&n>=0&&n<=max;
const positioned=(a,walls)=>a&&finite(a.x)&&finite(a.y)&&canStand(walls,a.x,a.y);
const validEnemy=(e,walls)=>positioned(e,walls)&&Number.isFinite(e.hp)&&e.hp>=-100&&e.hp<=100&&finite(e.windup,10)&&finite(e.cooldown,10);
export function validSave(s) {
  if(s?.version!==3||!['camp','street'].includes(s.zone)||!Array.isArray(s.walls)||s.walls.length>COLS*ROWS||new Set(s.walls).size!==s.walls.length||!s.walls.every(id=>typeof id==='string'&&/^\d+,\d+$/.test(id)&&!blocked([],...id.split(',').map(Number)))) return false;
  if(!s.wallHealth||typeof s.wallHealth!=='object'||Array.isArray(s.wallHealth)||!Object.entries(s.wallHealth).every(([id,hp])=>s.walls.includes(id)&&finite(hp,100)&&hp>0)) return false;
  if(!['stock','delivered','visits','kills'].every(k=>integer(s[k]))||!finite(s.time)||!finite(s.restockAt)||!finite(s.threat,100)||!integer(s.bag,12)||![1,2].includes(s.weapon)) return false;
  if(![s.player,s.dog].every(a=>positioned(a,activeWalls(s)))||!finite(s.player.hp,100)||!s.player.hp||!finite(s.player.stamina,100)||!finite(s.dog.cooldown,12)) return false;
  if(!Array.isArray(s.crates)||s.crates.length!==5||!s.crates.every((c,i)=>c?.x===crateLayout[i][0]&&c.y===crateLayout[i][1]&&integer(c.amount,crateLayout[i][2]))) return false;
  if(!Array.isArray(s.enemies)||s.enemies.length!==4||!s.enemies.every(e=>validEnemy(e,streetWalls))) return false;
  const d=s.defender,r=s.raid;
  if(!d||typeof d.recruited!=='boolean'||!positioned(d,s.walls)||!finite(d.hp,100)||!finite(d.cooldown,10)) return false;
  if(!r||!['idle','warning','active'].includes(r.phase)||!integer(r.number)||!finite(r.remaining,120)||!finite(r.core,100)||!integer(r.destroyed)||!integer(r.hits)||!Array.isArray(r.enemies)||r.enemies.length>6||!r.enemies.every(e=>validEnemy(e,s.walls))) return false;
  if(r.phase==='active'&&(s.zone!=='camp'||!r.enemies.length||!r.core)) return false;
  if(r.phase!=='active'&&r.enemies.length) return false;
  const result=r.result;
  return result===null||!!(result&&integer(result.id)&&result.id<=r.number&&typeof result.victory==='boolean'&&integer(result.loss)&&integer(result.reward)&&integer(result.destroyed)&&integer(result.hits));
}
export function migrateSave(s) {
  if(validSave(s)) return s;
  if((s?.version!==1&&s?.version!==2)||!Array.isArray(s.walls)) return null;
  const fresh=createWorld();
  const n=s.version===1 ? {...fresh,walls:s.walls,stock:s.stock,time:s.time,player:s.player,dog:{...s.dog,cooldown:0}} : {...fresh,...s,version:3,wallHealth:{},threat:0,restockAt:Math.max(300,s.time+300),dog:{...s.dog,cooldown:0}};
  // A new defender must not spawn inside a wall from an older save.
  if(!positioned(n.defender,n.walls)) {
    for(let y=1;y<17;y++) for(let x=1;x<29;x++) {
      if(canStand(n.walls,(x+.5)*32,(y+.5)*32)) { n.defender.x=(x+.5)*32;n.defender.y=(y+.5)*32;break; }
    }
  }
  return validSave(n)?n:null;
}
