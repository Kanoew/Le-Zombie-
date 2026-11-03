export const campModules={
 generator:{name:'Générateur',cost:8,x:704,y:400,description:'Produit 4 unités d’énergie. Alimente l’infirmerie et les lampes.',icon:0},
 infirmary:{name:'Infirmerie',cost:6,x:432,y:432,description:'Consomme 2 énergies. Avec les couchages, réduit de moitié le temps de récupération d’Écho.',icon:1},
 bunks:{name:'Couchages',cost:4,x:336,y:400,description:'Écho récupère progressivement au refuge, même blessée. Sans coût quotidien.',icon:2},
 lights:{name:'Éclairage',cost:4,x:752,y:240,description:'Consomme 1 énergie. Éclaire les installations et les accès la nuit.',icon:3}
};
export function campPower(s){
 const built=s.camp.built,supply=built.generator?4:0,medical=!!built.infirmary&&supply>=2,lights=!!built.lights&&supply>=(medical?2:0)+1;
 return {supply,used:(medical?2:0)+(lights?1:0),medical,lights};
}
export function installModule(s,id){
 const m=campModules[id];if(!m)return 'Installation inconnue.';
 if(s.zone!=='camp'||s.raid.phase==='active')return 'Installation indisponible pendant le raid ou hors du camp.';
 if(s.camp.built[id])return `${m.name} déjà installé. Aucun matériau consommé.`;
 if(s.stock<m.cost)return `${m.name} : ${m.cost} ferrailles nécessaires.`;
 const x=Math.floor(m.x/32),y=Math.floor(m.y/32);
 if(s.walls.some(k=>{const [wx,wy]=k.split(',').map(Number);return Math.abs(wx-x)<=1&&Math.abs(wy-y)<=1;}))return 'Démonte les murs sur l’emplacement réservé avant d’installer.';
 if([s.player,s.dog,...(s.defender.recruited?[s.defender]:[])].some(a=>Math.abs(a.x-m.x)<64&&Math.abs(a.y-m.y)<64))return 'Éloigne les occupants de l’emplacement avant d’installer.';
 s.stock-=m.cost;s.camp.built[id]=true;return `${m.name} installé · −${m.cost} ferrailles`;
}
export function tickCamp(s,dt){
 if(s.zone!=='camp'||s.raid.phase==='active'||!s.camp.built.bunks||!s.defender.recruited)return;
 const rate=campPower(s).medical?100/45:100/90;
 s.defender.hp=Math.min(100,s.defender.hp+rate*dt);
}
export function reservedModuleCell(x,y){return Object.values(campModules).some(m=>Math.abs(x-Math.floor(m.x/32))<=1&&Math.abs(y-Math.floor(m.y/32))<=1);}

export function campFootprint(s){const cells=[];for(const [id,m] of Object.entries(campModules))if(s.camp.built[id])for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)cells.push(`${Math.floor(m.x/32)+x},${Math.floor(m.y/32)+y}`);return cells;}
