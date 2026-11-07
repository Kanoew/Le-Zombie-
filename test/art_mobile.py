from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_support import install_routes, BASE
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w,h in [(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  install_routes(page)
  page.goto('https://prototype.test/Le-Zombie-/')
  expect(page.locator('#asset-status')).to_have_text('Ton équipement est prêt.')
  page.screenshot(path=f'/tmp/le-zombie-art-menu-{w}.png')
  page.locator('#play').tap()
  assert not page.locator('#camp-tools').is_visible()
  page.locator('#arsenal-open').tap()
  page.locator('[data-weapon="katana"]').tap();expect(page.locator('#weapon')).to_have_text('Katana')
  page.locator('[data-weapon="spiked-bat"]').tap();expect(page.locator('#weapon')).to_have_text('Batte cloutée')
  page.wait_for_timeout(100)
  assert page.locator('#hero-preview').evaluate('c=>c.getContext("2d").getImageData(0,0,240,180).data.some((v,i)=>i%4===3&&v>127)')
  page.screenshot(path=f'/tmp/le-zombie-art-arsenal-{w}.png')
  page.locator('#arsenal-close').tap();page.locator('#pause').tap()
  state=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  assert state['loadout']=='spiked-bat'
  state['zone']='street';state['player'].update(x=960,y=608);state['dog'].update(x=928,y=608)
  for enemy in state['enemies']:enemy.update(hp=0,respawnAt=state['time']+1000)
  state['enemies'][0].update(x=1008,y=608,hp=90,cooldown=0,windup=0,respawnAt=None)
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
  page.locator('#load').tap();page.locator('#play').tap()
  page.locator('#attack').tap();page.wait_for_timeout(80);page.locator('#pause').tap()
  before=page.evaluate('JSON.parse(localStorage.getItem("zombie.save")).enemies[0].hp')
  assert before==90,before
  page.locator('#play').tap();page.wait_for_timeout(500);page.locator('#pause').tap()
  after=page.evaluate('JSON.parse(localStorage.getItem("zombie.save")).enemies[0].hp')
  assert after==42,after
  page.locator('#play').tap();page.screenshot(path=f'/tmp/le-zombie-art-city-{w}.png')
  page.locator('#map-open').tap();expect(page.locator('#world-view')).to_be_visible()
  page.screenshot(path=f'/tmp/le-zombie-art-map-{w}.png');page.locator('#map-close').tap()
  assert not errors,errors
  print(f'OK art {w}x{h}: images décodées, armes Yeji, aperçu animé, frappe au milieu du cycle, carte générale')
  page.close()
 # The downloadable HTML must not request any external asset.
 page=browser.new_page();requests=[];errors=[]
 page.on('request',lambda r:requests.append(r.url))
 page.on('pageerror',lambda e:errors.append(str(e)))
 # Serve the large embedded file directly instead of moving base64 through RPC.
 page.goto(BASE+'/root/Le-Zombie-/dist/le-zombie.html')
 expect(page.locator('#asset-status')).to_have_text('Ton équipement est prêt.')
 assert len(requests)==1,requests
 assert not errors,errors
 print('OK standalone : toutes les images sont intégrées au HTML')
 browser.close()
