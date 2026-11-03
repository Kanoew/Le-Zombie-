export const weapons = {
  machete:{id:'machete',name:'Machette',damage:30,range:68,stamina:18,duration:.64,icon:0,description:'Polyvalente · acier récupéré et garde dorée.'},
  sabre:{id:'sabre',name:'Sabre',damage:24,range:84,stamina:16,duration:.52,icon:1,description:'Allonge supérieure · frappes rapides, dégâts légers.'},
  hatchet:{id:'hatchet',name:'Hachette',damage:48,range:58,stamina:28,duration:.88,icon:2,description:'Impact lourd · courte portée et engagement plus long.'}
};
export function equipWeapon(s,id){
  if(!weapons[id])return 'Arme inconnue.';
  if(s.raid.phase==='active')return 'Équipement verrouillé pendant le raid.';
  s.loadout=id;return `${weapons[id].name} équipée`;
}
export function animationFrame(facing,moving,elapsed,attackRemaining=0,duration=.64){
  const direction=Math.abs(facing.x)>Math.abs(facing.y)?(facing.x<0?1:2):(facing.y<0?3:0);
  const attack=attackRemaining>0;
  return {row:direction*2+(attack?1:0),column:attack?Math.min(7,Math.floor((1-attackRemaining/duration)*8)):moving?Math.floor(elapsed*10)%8:0};
}
