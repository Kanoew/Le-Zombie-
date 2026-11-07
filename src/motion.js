import {canStand,pathTo} from './world.js?v=0.8';
export function slideActor(walls,a,dx,dy){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));const start={x:a.x,y:a.y};
 for(let i=0;i<steps;i++){
  if(canStand(walls,a.x+dx/steps,a.y))a.x+=dx/steps;
  if(canStand(walls,a.x,a.y+dy/steps))a.y+=dy/steps;
 }
 return Math.hypot(a.x-start.x,a.y-start.y);
}
export function steerPlayer(walls,a,velocity,input,dt,{speed=125,dash=false,facing={x:1,y:0}}={}){
 const n=Math.hypot(input.x,input.y),scale=Math.max(1,n),k=1-Math.exp(-dt*(n>.06?20:28));
 const tx=n>.06?input.x/scale*speed:0,ty=n>.06?input.y/scale*speed:0;
 velocity.x+=(tx-velocity.x)*k;velocity.y+=(ty-velocity.y)*k;
 if(n<=.06&&Math.hypot(velocity.x,velocity.y)<1)velocity.x=velocity.y=0;
 const dx=(dash?facing.x*340:velocity.x)*dt,dy=(dash?facing.y*340:velocity.y)*dt;
 const before={x:a.x,y:a.y};const distance=slideActor(walls,a,dx,dy);
 if(Math.abs(a.x-before.x)<.01)velocity.x=0;if(Math.abs(a.y-before.y)<.01)velocity.y=0;
 return distance;
}
export function clearSegment(walls,a,b){
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6));
 for(let i=1;i<=steps;i++)if(!canStand(walls,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;
 return true;
}
export function followSmooth(walls,a,target,speed,dt,stop=24){
 if(Math.hypot(a.x-target.x,a.y-target.y)<stop)return 0;
 let aim=target;
 if(!clearSegment(walls,a,target)){
  const cells=pathTo(walls,[Math.floor(a.x/32),Math.floor(a.y/32)],[Math.floor(target.x/32),Math.floor(target.y/32)]);
  if(!cells.length)return 0;
  aim=null;
  for(let i=Math.min(5,cells.length-1);i>=0;i--){const point={x:(cells[i][0]+.5)*32,y:(cells[i][1]+.5)*32};if(clearSegment(walls,a,point)){aim=point;break;}}
  if(!aim)return 0;
 }
 const dx=aim.x-a.x,dy=aim.y-a.y,d=Math.hypot(dx,dy),step=Math.min(speed*dt,d);
 return d?slideActor(walls,a,dx/d*step,dy/d*step):0;
}
