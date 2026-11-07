"""Exercise actual Yeji draw calls, weapon selection, attacks and persistence."""
from playwright.sync_api import sync_playwright, expect
from browser_support import install_routes

weapons = [
 ('katana', 'Katana', 30, .64, False),
 ('spiked-bat', 'Batte cloutée', 48, .88, False),
 ('scythe', 'Faucheuse', 38, .82, False),
 ('chain-sickles', 'Faucilles', 22, .48, False),
 ('pistol', 'Pistolet', 24, .36, True),
 ('smg', 'Mitraillette', 12, .14, True),
 ('shotgun', 'Fusil à pompe', 60, .8, True),
 ('assault-rifle', 'Fusil d’assaut', 28, .24, True),
]
with sync_playwright() as p:
 browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
 for width, height in [(390,844),(844,390)]:
  page = browser.new_page(viewport={'width':width,'height':height}, has_touch=True, is_mobile=True)
  errors=[]; requests=[]
  page.on('pageerror', lambda e: errors.append(str(e)))
  page.add_init_script('''window.yejiDraws=[];window.yejiTextures={};
  const original=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(...args){
    const img=args[0],file=img?.assetFile||img?.src?.split('/').pop();
    if(file && args.length===9){
      const imported=['compagnon.png','katana.png','spiked-bat.png','scythe.png','chain-sickles.png','pistol.png','smg.png','shotgun.png','assault-rifle.png'].includes(file);
      const ratio=imported?(file==='compagnon.png'?2288:2560)/img.height:1;
      if(imported)window.yejiTextures[file]={width:img.width,height:img.height};
      window.yejiDraws.push({file,sx:args[1],sy:args[2]*ratio,sw:args[3],sh:args[4]*ratio,dx:args[5],dy:args[6],dw:args[7],dh:args[8]});
      if(window.yejiDraws.length>800)window.yejiDraws.shift();
    }
    return original.apply(this,args);
  };''')
  install_routes(page, requests=requests)
  page.goto('https://prototype.test/Le-Zombie-/')
  expect(page.locator('#asset-status')).to_have_text('Ton équipement est prêt.')
  page.screenshot(path=f'/tmp/le-zombie-08-menu-{width}.png')
  page.locator('#play').tap()
  page.screenshot(path=f'/tmp/le-zombie-08-refuge-{width}.png')
  for direction, lo, hi in [('ArrowLeft',420,620),('ArrowRight',210,415)]:
   page.evaluate('window.yejiDraws=[]')
   page.keyboard.down(direction); page.wait_for_timeout(220); page.keyboard.up(direction)
   assert page.evaluate('([lo,hi])=>window.yejiDraws.some(d=>d.file==="compagnon.png"&&d.sy>=lo&&d.sy<hi)',[lo,hi])
  for key, name, damage, duration, ranged in weapons:
   page.locator('#arsenal-open').tap()
   page.locator(f'[data-weapon-group="{"ranged" if ranged else "melee"}"]').tap()
   assert page.locator('[data-weapon]:visible').count()==4
   page.locator(f'[data-weapon="{key}"]').tap()
   expect(page.locator('#weapon')).to_have_text(name)
   if key in ['scythe','shotgun']:page.screenshot(path=f'/tmp/le-zombie-08-{key}-arsenal-{width}.png')
   page.locator('#arsenal-close').tap(); page.locator('#pause').tap()
   state=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
   state.update(zone='street',ammo=18,weapon=1,journey={'stage':5,'rewarded':True})
   state['player'].update(x=960,y=608,hp=100,stamina=100); state['dog'].update(x=928,y=608)
   for e in state['enemies']:e.update(hp=0,respawnAt=state['time']+1000)
   state['enemies'][0].update(x=1000,y=608,hp=90,respawnAt=None,windup=0,cooldown=0)
   page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
   page.locator('#load').tap(); page.locator('#play').tap()
   expect(page.locator('#weapon')).to_have_text(name)
   page.evaluate('window.yejiDraws=[]')
   page.locator('#attack').tap(); page.wait_for_timeout(duration*600)
   assert page.evaluate('(file)=>window.yejiDraws.some(d=>d.file===file&&d.sy<640&&Math.abs(d.dh/d.sh-.2)<.001)',key+'.png'),(key,'missing attack')
   if key=='scythe':page.screenshot(path=f'/tmp/le-zombie-08-scythe-{width}.png')
   page.locator('#pause').tap()
   saved=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
   assert saved['enemies'][0]['hp']==90-damage,(key,saved['enemies'][0]['hp'])
   assert saved['ammo']==(17 if ranged else 18),(key,saved['ammo'])
   page.locator('#load').tap(); page.locator('#play').tap(); page.wait_for_timeout(duration*1000)
  assert not any(name in r for r in requests for name in ['hero-atlas.png','hero-pistol.png','hero-sabre.png','hero-hatchet.png'])
  textures=page.evaluate('window.yejiTextures')
  assert len(textures)==9,textures
  assert all(max(t.values())<=1024 for t in textures.values()),textures
  assert sum(t['width']*t['height']*4 for t in textures.values())<30*1024*1024
  assert not errors,errors
  print(f'OK Yeji {width}x{height}: course droite/gauche, huit armes et sprites, dégâts, coûts, reprise, aucun ancien sprite joueur')
  page.close()
 browser.close()
