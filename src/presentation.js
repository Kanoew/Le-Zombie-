// Presentation clocks follow distance, never the wall clock: a blocked actor stays idle.
const actorVisuals=new WeakMap();
export function actorPresentation(actor,dt=1/60,target=null){
 let v=actorVisuals.get(actor);
 if(!v){v={x:actor.x,y:actor.y,phase:0,moving:false,facing:{x:0,y:1}};actorVisuals.set(actor,v);}
 const dx=actor.x-v.x,dy=actor.y-v.y,d=Math.hypot(dx,dy);
 v.moving=d>.015&&d<30;
 if(v.moving){v.phase+=d/50;const n=Math.hypot(dx,dy);v.facing={x:dx/n,y:dy/n};}
 if(target){const x=target.x-actor.x,y=target.y-actor.y,n=Math.hypot(x,y);if(n)v.facing={x:x/n,y:y/n};}
 v.x=actor.x;v.y=actor.y;
 return v;
}
