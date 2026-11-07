// The supplied run cycle has side views; attack sheets have all four directions.
export const yejiWeaponAliases = {machete:'katana',sabre:'katana',hatchet:'spiked-bat'};
export const yejiWeaponId = id => yejiWeaponAliases[id] ?? id;
export function yejiPose({weapon='katana',facing={x:0,y:1},moving=false,walkPhase=0,elapsed=0,attackRemaining=0,duration=.64,dash=0,hurt=0,reduced=false,greeting=false,side=1}={}){
  if(attackRemaining>0){
    const row=Math.abs(facing.x)>Math.abs(facing.y)?(facing.x<0?1:0):(facing.y<0?3:2);
    return {atlas:yejiWeaponId(weapon),row,column:Math.max(0,Math.min(5,Math.floor((1-attackRemaining/duration)*6)))};
  }
  if(dash>0)return {atlas:'companion',row:4,column:Math.max(0,Math.min(4,Math.floor((1-dash/.16)*5)))};
  if(hurt>0)return {atlas:'companion',row:5,column:Math.max(0,Math.min(7,Math.floor((1-Math.min(.7,hurt)/.7)*8)))};
  if(moving)return {atlas:'companion',row:(Math.abs(facing.x)>.15?facing.x:side)<0?2:1,column:Math.floor(walkPhase*8)%8};
  if(greeting&&!reduced)return {atlas:'companion',row:3,column:Math.min(3,Math.floor(elapsed*5)%4)};
  return {atlas:'companion',row:0,column:reduced?0:Math.floor(elapsed*3)%6};
}
