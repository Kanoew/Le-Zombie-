export const COLS = 30, ROWS = 18, TILE = 32;
export const key = (x,y) => `${x},${y}`;
export function createWorld() {
  const walls = [];
  for (let x=8;x<=16;x++) walls.push(key(x,5));
  for (let y=6;y<=11;y++) walls.push(key(8,y));
  return {version:1,player:{x:464,y:304,hp:100,stamina:100},dog:{x:400,y:336},walls,stock:20,time:0};
}
export function blocked(walls,x,y) { return x<1 || y<1 || x>=COLS-1 || y>=ROWS-1 || walls.includes(key(x,y)); }
export function canStand(walls,x,y,r=10) {
  return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dy])=>!blocked(walls,Math.floor((x+dx)/TILE),Math.floor((y+dy)/TILE)));
}
export function pathTo(walls,from,to) {
  const queue=[from], seen=new Map([[key(...from),null]]);
  for(let i=0;i<queue.length;i++) {
    const p=queue[i];
    if(p[0]===to[0] && p[1]===to[1]) {
      const path=[];let at=p;
      while(at) {path.unshift(at);at=seen.get(key(...at));}return path;
    }
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const n=[p[0]+dx,p[1]+dy], id=key(...n);
      if(!seen.has(id)&&!blocked(walls,...n)){seen.set(id,p);queue.push(n);}
    }
  } return [];
}
export function toggleWall(state,x,y,actors=[]) {
  const id=key(x,y), index=state.walls.indexOf(id);
  if(index>=0){state.walls.splice(index,1);state.stock+=2;return 'Mur démonté : +2 ferrailles.';}
  if(blocked([],x,y)) return 'Hors de la zone constructible.';
  if(x===14&&y===9) return 'Arrivée du refuge protégée.';
  if(actors.some(a=>Math.abs(a.x-(x+.5)*TILE)<26 && Math.abs(a.y-(y+.5)*TILE)<26)) return 'Un occupant bloque cette case.';
  if(state.stock<2)return 'Il faut 2 ferrailles.';
  state.walls.push(id);state.stock-=2;return 'Mur construit : −2 ferrailles.';
}
export function validSave(s) {
  return s?.version===1 && Array.isArray(s.walls) && s.walls.length<=COLS*ROWS && new Set(s.walls).size===s.walls.length && s.walls.every(id=> typeof id==='string' && /^\d+,\d+$/.test(id) && !blocked([],...id.split(',').map(Number))) && Number.isInteger(s.stock)&&s.stock>=0&&Number.isFinite(s.time)&&s.time>=0 && [s.player,s.dog].every(a=>a&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&canStand(s.walls,a.x,a.y)) && Number.isFinite(s.player.hp)&&s.player.hp>0&&s.player.hp<=100&&Number.isFinite(s.player.stamina)&&s.player.stamina>=0&&s.player.stamina<=100;
}
