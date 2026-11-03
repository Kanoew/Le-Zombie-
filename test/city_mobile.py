from playwright.sync_api import sync_playwright,expect
from browser_support import install_routes
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w,h in [(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  install_routes(page);page.goto('https://prototype.test/Le-Zombie-/')
  page.locator('#play').tap();page.locator('#pause').tap()
  state=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  assert state['version']==7
  state.update(zone='street',time=299)
  state['player'].update(x=912,y=976);state['dog'].update(x=880,y=976)
  for e in state['enemies']:e.update(hp=0,respawnAt=10000)
  state['enemies'][5].update(hp=30,respawnAt=None,cooldown=0,windup=0)
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
  page.locator('#load').tap();page.locator('#play').tap();page.locator('#attack').tap()
  expect(page.locator('#message')).to_contain_text('au plus tôt dans 90 s')
  page.locator('#pause').tap();state=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  enemy=state['enemies'][5];deadline=enemy['respawnAt'];assert enemy['hp']==0
  assert 389<=deadline<391,deadline
  # Cross the old five-minute global renewal through the actual camp exit.
  state.update(zone='camp',time=305);state['player'].update(x=850,y=304);state['dog'].update(x=816,y=304)
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
  page.locator('#load').tap();page.locator('#play').tap();page.locator('#interact').tap()
  expect(page.locator('#zone')).to_have_text('LES CENDRES')
  page.locator('#pause').tap();state=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  assert state['enemies'][5]['hp']==0
  assert state['enemies'][5]['respawnAt']==deadline
  # An elapsed deadline is applied once, then persisted across another reload.
  state['time']=deadline+1
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
  page.locator('#load').tap();page.locator('#play').tap()
  expect(page.locator('#message')).to_contain_text('Zone réinfestée')
  page.locator('#pause').tap();state=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  assert state['enemies'][5]['hp']==90
  assert state['enemies'][5]['respawnAt'] is None
  page.locator('#load').tap();page.locator('#play').tap();page.locator('#pause').tap()
  assert page.evaluate('JSON.parse(localStorage.getItem("zombie.save")).enemies[5].hp')==90
  assert not errors,errors
  print(f'OK population {w}x{h}: mort réelle, délai sauvegardé, changement de carte sans reset, retour unique et reprise')
  page.close()
 browser.close()
