export const COLS=30, ROWS=18, TILE=32;
export const key=(x,y)=>`${x},${y}`;
const entity=(x,y,hp=60)=>({x,y,hp,windup:0,cooldown:0});
export function createWorld(){
 const walls=[];for(let x=8;x<=16;x++)walls.push(key(x,5));for(let y=6;y<=11;y++)walls.push(key(8,y));
 return {version:2,zone:'camp',player:{x:464,y:304,hp:100,stamina:100},dog:{x:410,y:336},walls,stock:8,bag:0,time:0,weapon:1,delivered:0,visits:0,crates:[{x:208,y:208,amount:4},{x:720,y:144,amount:5},{x:752,y:400,amount:4},{x:304,y:432,amount:5},{x:560,y:272,amount:4}],enemies:[entity(360,208),entity(650,300),entity(740,440,90),entity(280,400)],kills:0};
}
export const streetWalls=(()=>{const a=[];for(const [x,y,w,h] of [[8,3,5,2],[16,5,4,3],[5,10,3,2],[14,12,5,2],[24,2,3,5]])for(let i=x;i<x+w;i++)for(let j=y;j<y+h;j++)a.push(key(i,j));return a;})();
export const activeWalls=s=>s.zone==='camp'?s.walls:streetWalls;
export function blocked(walls,x,y){return x<1||y<1||x>=COLS-1||y>=ROWS-1||walls.includes(key(x,y));}
export function canStand(walls,x,y,r=10){return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dy])=>!blocked(walls,Math.floor((x+dx)/TILE),Math.floor((y+dy)/TILE)));}
export function pathTo(walls,from,to){const q=[from],seen=new Map([[key(...from),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(p[0]===to[0]&&p[1]===to[1]){const a=[];let at=p;while(at){a.unshift(at);at=seen.get(key(...at));}return a;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+dx,p[1]+dy],id=key(...n);if(!seen.has(id)&&!blocked(walls,...n)){seen.set(id,p);q.push(n);}}}return [];}
export function toggleWall(s,x,y,actors=[]){
 if(s.zone!=='camp')return 'La construction est réservée au refuge.';
 const id=key(x,y),i=s.walls.indexOf(id);if(i>=0){s.walls.splice(i,1);s.stock+=2;return 'Mur démonté · +2 ferrailles';}
 if(blocked([],x,y))return 'Hors du terrain.';
 if((x>=13&&x<=15&&y>=8&&y<=10)||(x>=25&&y>=7&&y<=10))return 'Accès au refuge et passage protégés.';
 if(actors.some(a=>Math.abs(a.x-(x+.5)*TILE)<27&&Math.abs(a.y-(y+.5)*TILE)<27))return 'Un occupant bloque cette case.';
 if(s.stock<2)return 'Il faut 2 ferrailles en réserve.';
 s.walls.push(id);s.stock-=2;return 'Mur construit · −2 ferrailles';
}
export function collect(s,index){const c=s.crates[index];if(s.zone!=='street'||!c)return 'Rien à fouiller ici.';const n=Math.min(c.amount,12-s.bag);if(!n)return c.amount?'Sac plein · rentre déposer au refuge.':'Conteneur déjà vidé.';s.bag+=n;c.amount-=n;return `+${n} ferrailles · sac ${s.bag}/12`;}
export function deposit(s){if(s.zone!=='camp')return 'Retourne au refuge.';const n=s.bag;s.stock+=n;s.delivered+=n;s.bag=0;s.player.hp=100;return n?`${n} ferrailles déposées · vie restaurée`:'Vie restaurée au refuge';}
export function upgrade(s){if(s.zone!=='camp')return 'L’atelier est au refuge.';if(s.weapon>=2)return 'Machette déjà renforcée.';if(s.stock<10)return 'Renforcement : 10 ferrailles en réserve.';s.stock-=10;s.weapon=2;return 'Machette renforcée · dégâts 30 → 45';}
export function transition(s){s.zone=s.zone==='camp'?'street':'camp';s.visits++;s.player.x=s.zone==='camp'?816:112;s.player.y=304;s.dog.x=s.player.x;s.dog.y=s.player.y;return s.zone==='camp'?'Refuge rejoint · approche le noyau pour déposer.':'Quartier des Cendres · fouille et reviens en vie.';}
const integer=(n,max=1e7)=>Number.isInteger(n)&&n>=0&&n<=max;
export function validSave(s){
 if(s?.version!==2||!['camp','street'].includes(s.zone)||!Array.isArray(s.walls)||s.walls.length>COLS*ROWS||new Set(s.walls).size!==s.walls.length||!s.walls.every(id=>typeof id==='string'&&/^\d+,\d+$/.test(id)&&!blocked([],...id.split(',').map(Number))))return false;
 const walls=activeWalls(s);return ['stock','time','delivered','visits','kills'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&integer(s.stock)&&integer(s.bag,12)&&[1,2].includes(s.weapon)&&[s.player,s.dog].every(a=>a&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&canStand(walls,a.x,a.y))&&s.player.hp>0&&s.player.hp<=100&&s.player.stamina>=0&&s.player.stamina<=100&&Array.isArray(s.crates)&&s.crates.length===5&&s.crates.every((c,i)=>c.x===createWorld().crates[i].x&&c.y===createWorld().crates[i].y&&integer(c.amount,5))&&Array.isArray(s.enemies)&&s.enemies.length===4&&s.enemies.every(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)&&canStand(streetWalls,e.x,e.y)&&Number.isFinite(e.hp)&&e.hp<=100&&Number.isFinite(e.windup)&&e.windup>=0&&Number.isFinite(e.cooldown)&&e.cooldown>=0);
}
export function migrateSave(s){if(validSave(s))return s;if(s?.version===1&&Array.isArray(s.walls)){const n={...createWorld(),walls:s.walls,stock:s.stock,time:s.time,player:s.player,dog:s.dog};if(validSave(n))return n;}return null;}
