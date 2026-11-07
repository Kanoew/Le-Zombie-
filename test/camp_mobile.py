from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_support import install_routes
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w,h in [(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  install_routes(page);page.goto('https://prototype.test/Le-Zombie-/')
  expect(page.locator('#asset-status')).to_have_text('Ton équipement est prêt.')
  page.locator('#play').tap();page.locator('#pause').tap()
  s=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))');s['journey']={'stage':5,'rewarded':True};s['stock']=50;s['defender'].update(recruited=True,hp=45);s['time']=750
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',s)
  page.locator('#load').tap();page.locator('#play').tap();page.locator('#refuge-menu').tap();page.locator('#camp-manage').tap()
  for id in ['generator','infirmary','bunks','lights']:page.locator(f'[data-module="{id}"]').tap()
  expect(page.locator('#camp-power')).to_contain_text('Énergie 3/4')
  page.locator('[data-module="generator"]').tap()
  expect(page.locator('#camp-status')).to_contain_text('déjà installé')
  page.screenshot(path=f'/tmp/le-zombie-camp-panel-{w}.png')
  page.locator('#camp-close').tap();page.locator('#pause').tap()
  s=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  assert s['stock']==28,s['stock']
  assert all(s['camp']['built'].values())
  page.locator('#load').tap();page.locator('#play').tap();page.wait_for_timeout(100)
  page.screenshot(path=f'/tmp/le-zombie-camp-night-{w}.png')
  page.locator('#pause').tap();s=page.evaluate('JSON.parse(localStorage.getItem("zombie.save"))')
  s['zone']='street';s['player'].update(x=960,y=608);s['dog'].update(x=928,y=608);s['enemies'][0].update(x=1040,y=608,kind='infected',hp=60);s['enemies'][1].update(x=1072,y=688,kind='brute',hp=90)
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',s)
  page.locator('#load').tap();page.locator('#play').tap();page.wait_for_timeout(150)
  page.screenshot(path=f'/tmp/le-zombie-monsters-{w}.png')
  assert not errors,errors
  print(f'OK camp {w}x{h}: installation, coût unique, alimentation, sauvegarde, Écho et monstres générés')
  page.close()
 browser.close()
