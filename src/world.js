import {reservedModuleCell,campFootprint} from './camp.js?v=0.6';
export const COLS = 30, ROWS = 18, TILE = 32;
export const key = (x, y) => `${x},${y}`;
export const entity = (x, y, hp = 60) => ({ x, y, hp, kind:hp>60?'brute':'infected', windup:0,cooldown:0 });
export const streetEntry={x:80,y:608};
export function mapSize(zone){return zone==='camp'?{cols:30,rows:18,width:960,height:576}:{cols:60,rows:40,width:1920,height:1280};}
export const districts=[{name:'Clinique écarlate',x:368,y:560},{name:'Dépôt industriel',x:1280,y:528},{name:'Marché oublié',x:464,y:704},{name:'Serres contaminées',x:1088,y:880}];
const crateLayout = [[368,560,4],[880,400,5],[1184,528,4],[464,704,5],[1088,880,4],[960,1120,5],[320,704,4],[1440,592,5]];
export const newCrates = () => crateLayout.map(([x,y,amount]) => ({x,y,amount}));
export const newEnemies = () => [entity(608,544),entity(880,464),entity(1120,496,90),entity(1280,560),entity(736,704),entity(960,976,90),entity(1056,848),entity(1056,1136)];
export function createWorld() {
  const walls = [];
  for (let x=8; x<=16; x++) walls.push(key(x,5));
  for (let y=6; y<=11; y++) walls.push(key(8,y));
  return {
    version:5, camp:{built:{generator:false,infirmary:false,bunks:false,lights:false}}, loadout:'machete', zone:'camp', player:{x:464,y:304,hp:100,stamina:100},
    dog:{x:410,y:336,cooldown:0}, walls, wallHealth:{}, stock:8, bag:0,
    time:0, weapon:1, delivered:0, visits:0, crates:newCrates(), enemies:newEnemies(),
    kills:0, threat:0, restockAt:300,
    defender:{recruited:false,x:624,y:304,hp:100,cooldown:0},
    raid:{phase:'idle',remaining:0,number:0,enemies:[],core:100,destroyed:0,hits:0,result:null}
  };
}
export const streetWalls = (() => {
  const a=[];
  for (const [x,y,w,h] of [[1,1,26,14],[35,1,23,10],[53,11,6,4],[1,23,25,16],[35,23,24,16]])
    for(let i=x;i<x+w;i++) for(let j=y;j<y+h;j++) a.push(key(i,j));
  Object.defineProperty(a,'zone',{value:'street'});
  return a;
})();
export const campWalls=s=>s.walls.concat(campFootprint(s));
export const activeWalls = s => s.zone==='camp' ? campWalls(s) : streetWalls;
export const activeEnemies = s => s.zone==='camp' ? s.raid.enemies : s.enemies;
export function blocked(walls,x,y) {
  const bounds=mapSize(walls.zone==='street'?'street':'camp');
  return x<1 || y<1 || x>=bounds.cols-1 || y>=bounds.rows-1 || walls.includes(key(x,y));
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
  if(reservedModuleCell(x,y)) return 'Emplacement réservé à une installation du refuge.';
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
  if(s.weapon>=2) return 'Arme déjà renforcée.';
  if(s.stock<10) return 'Renforcement : 10 ferrailles en réserve.';
  s.stock-=10; s.weapon=2; return 'Arme renforcée · dégâts +50 %';
}
export function transition(s) {
  if(s.raid.phase==='active') return 'Raid en cours : protège le refuge avant de partir.';
  s.zone=s.zone==='camp'?'street':'camp'; s.visits++;
  if(s.zone==='street'&&s.time>=s.restockAt) {
    s.crates=newCrates(); s.enemies=newEnemies(); s.restockAt=s.time+300;
  }
  s.player.x=s.zone==='camp'?816:streetEntry.x; s.player.y=s.zone==='camp'?304:streetEntry.y;
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
const validEnemy=(e,walls)=>['infected','brute'].includes(e?.kind)&&positioned(e,walls)&&Number.isFinite(e.hp)&&e.hp>=-100&&e.hp<=100&&finite(e.windup,10)&&finite(e.cooldown,10);
export function validSave(s) {
  if(s?.version!==5||!s.camp||!s.camp.built||!['generator','infirmary','bunks','lights'].every(k=>typeof s.camp.built[k]==='boolean')||!['machete','sabre','hatchet'].includes(s.loadout)||!['camp','street'].includes(s.zone)||!Array.isArray(s.walls)||s.walls.length>COLS*ROWS||new Set(s.walls).size!==s.walls.length||!s.walls.every(id=>typeof id==='string'&&/^\d+,\d+$/.test(id)&&!blocked([],...id.split(',').map(Number)))) return false;
  if(!s.wallHealth||typeof s.wallHealth!=='object'||Array.isArray(s.wallHealth)||!Object.entries(s.wallHealth).every(([id,hp])=>s.walls.includes(id)&&finite(hp,100)&&hp>0)) return false;
  if(!['stock','delivered','visits','kills'].every(k=>integer(s[k]))||!finite(s.time)||!finite(s.restockAt)||!finite(s.threat,100)||!integer(s.bag,12)||![1,2].includes(s.weapon)) return false;
  if(![s.player,s.dog].every(a=>positioned(a,activeWalls(s)))||!finite(s.player.hp,100)||!s.player.hp||!finite(s.player.stamina,100)||!finite(s.dog.cooldown,12)) return false;
  if(!Array.isArray(s.crates)||s.crates.length!==crateLayout.length||!s.crates.every((c,i)=>c?.x===crateLayout[i][0]&&c.y===crateLayout[i][1]&&integer(c.amount,crateLayout[i][2]))) return false;
  if(!Array.isArray(s.enemies)||s.enemies.length!==newEnemies().length||!s.enemies.every(e=>validEnemy(e,streetWalls))) return false;
  const d=s.defender,r=s.raid;
  if(!d||typeof d.recruited!=='boolean'||!positioned(d,campWalls(s))||!finite(d.hp,100)||!finite(d.cooldown,10)||!finite(d.windup??0,1)||(d.windup>0&&(!finite(d.targetX)||!finite(d.targetY)))) return false;
  if(!r||!['idle','warning','active'].includes(r.phase)||!integer(r.number)||!finite(r.remaining,120)||!finite(r.core,100)||!integer(r.destroyed)||!integer(r.hits)||!Array.isArray(r.enemies)||r.enemies.length>6||!r.enemies.every(e=>validEnemy(e,s.walls))) return false;
  if(r.phase==='active'&&(s.zone!=='camp'||!r.enemies.length||!r.core)) return false;
  if(r.phase!=='active'&&r.enemies.length) return false;
  const result=r.result;
  return result===null||!!(result&&integer(result.id)&&result.id<=r.number&&typeof result.victory==='boolean'&&integer(result.loss)&&integer(result.reward)&&integer(result.destroyed)&&integer(result.hits));
}
export function migrateSave(s) {
  if(validSave(s))return s;
  if(![1,2,3,4].includes(s?.version)||!Array.isArray(s.walls))return null;
  const fresh=createWorld();
  const n={...fresh,...s,version:5,camp:fresh.camp,loadout:s.version===4?s.loadout:'machete',dog:{...s.dog,cooldown:s.dog?.cooldown??0},crates:newCrates(),enemies:newEnemies()};
  if(s.version<3){n.wallHealth={};n.threat=0;n.raid=fresh.raid;n.defender=fresh.defender;n.restockAt=Math.max(300,(s.time??0)+300);}
  if(s.version===4){n.crates=s.crates;n.enemies=s.enemies.map((e,i)=>({...e,kind:newEnemies()[i].kind}));n.raid={...s.raid,enemies:s.raid.enemies.map(e=>({...e,kind:e.kind??'infected'}))};}
  if(s.version>1&&s.version<4){
    for(let i=0;i<Math.min(s.crates?.length??0,5);i++)n.crates[i].amount=s.crates[i].amount;
    for(let i=0;i<Math.min(s.enemies?.length??0,4);i++)n.enemies[i].hp=s.enemies[i].hp;
  }
  if(s.version<4&&n.zone==='street'){n.player={...n.player,...streetEntry};n.dog={...n.dog,...streetEntry};}
  n.raid={...n.raid,enemies:n.raid.enemies.map(e=>({...e,kind:e.kind??'infected'}))};
  if(!positioned(n.defender,n.walls)){
    safe:for(let y=1;y<17;y++)for(let x=1;x<29;x++)if(canStand(n.walls,(x+.5)*32,(y+.5)*32)){n.defender={...n.defender,x:(x+.5)*32,y:(y+.5)*32};break safe;}
  }
  return validSave(n)?n:null;
}
