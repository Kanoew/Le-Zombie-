export function advanceJourney(s){
 let changed=false,bonus=false;
 const ready=[s.visits>0,s.bag>=4||s.delivered>=4,s.delivered>=4,s.defender.recruited||Object.values(s.camp.built).some(Boolean),!!s.raid.result?.victory];
 while(s.journey.stage<5&&ready[s.journey.stage]){s.journey.stage++;changed=true;}
 if(s.journey.stage>=4&&!s.journey.rewarded){s.stock+=6;s.ammo=Math.min(90,s.ammo+12);s.journey.rewarded=true;changed=true;bonus=true;}
 return {changed,bonus};
}
export function journeyObjective(s){
 if(s.raid.phase==='active')return {title:'Défends le noyau !',detail:'Repousse les assaillants. Le chien interrompt une attaque ; Écho et les murs protègent le noyau.',target:s.zone==='camp'?{x:464,y:304}:null};
 if(s.raid.phase==='warning')return {title:'Prépare le refuge',detail:`Alerte : ${Math.ceil(s.raid.remaining)} s. Rentre, invoque Écho et prépare tes murs avant l’assaut.`,target:s.zone==='street'?{x:80,y:608}:{x:464,y:304}};
 const nearest=s.crates.filter(c=>c.amount>0).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];
 const out={x:864,y:304},back={x:80,y:608};
 const goals=[
  {title:'1 · Pars explorer',detail:'Va à la porte dorée à droite, puis touche Interagir.',target:s.zone==='camp'?out:null},
  {title:'2 · Récupère 4 ferrailles',detail:'Approche une caisse dorée et touche Fouiller. Le sac est limité à 12.',target:s.zone==='street'?nearest:out},
  {title:'3 · Rapporte ton butin',detail:'Reviens au refuge, approche le noyau puis Déposer / se soigner.',target:s.zone==='street'?back:{x:464,y:304}},
  {title:'4 · Aménage le refuge',detail:'Maison → Installations, ou invoque Écho. Première installation : +6 ferrailles, +12 cartouches.',target:s.zone==='street'?back:null},
  {title:'5 · Tiens face au raid',detail:s.delivered<8?`Livre encore ${8-s.delivered} ferrailles pour activer les raids. La fouille monte la menace.`:'À 60 de menace, prépare tes murs et Écho pendant les 45 s d’alerte.',target:s.zone==='street'?(s.delivered<8&&s.bag>=8-s.delivered?back:nearest):s.delivered<8&&s.bag?{x:464,y:304}:out},
  {title:'Continue ta survie',detail:'Explore, renforce ton camp et protège tes ressources. Les ennemis reviennent après 90 s.',target:null}
 ];
 return goals[s.journey.stage];
}
