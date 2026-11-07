export const weapons = {
  pistol:{id:'pistol',name:'Pistolet',damage:24,range:380,stamina:0,duration:.36,hitFraction:.25,ranged:true,description:'Tir précis · 1 cartouche · reste appuyé pour enchaîner.'},
  smg:{id:'smg',name:'Mitraillette',damage:12,range:290,stamina:0,duration:.14,hitFraction:.25,ranged:true,description:'Cadence élevée · 1 cartouche par balle.'},
  shotgun:{id:'shotgun',name:'Fusil à pompe',damage:12,pellets:5,spread:.2,range:220,stamina:0,duration:.8,hitFraction:.25,ranged:true,description:'5 plombs en cône · 1 cartouche par tir.'},
  'assault-rifle':{id:'assault-rifle',name:'Fusil d’assaut',damage:28,range:460,stamina:0,duration:.24,hitFraction:.25,ranged:true,description:'Longue portée · 1 cartouche par balle.'},
  katana:{id:'katana',name:'Katana',damage:30,range:78,stamina:18,duration:.64,hitFraction:.4,description:'Lame équilibrée · frappe à quatre directions.'},
  'spiked-bat':{id:'spiked-bat',name:'Batte cloutée',damage:48,range:58,stamina:28,duration:.88,hitFraction:.4,description:'Impact lourd · courte portée.'},
  scythe:{id:'scythe',name:'Faucheuse',damage:38,range:104,stamina:26,duration:.82,hitFraction:.4,description:'Balayage ample · garde tes distances.'},
  'chain-sickles':{id:'chain-sickles',name:'Faucilles',damage:22,range:92,stamina:15,duration:.48,hitFraction:.4,description:'Lames rapides · allonge des chaînes.'},
  // Keep legacy loadouts valid, with their original costs and damage.
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
