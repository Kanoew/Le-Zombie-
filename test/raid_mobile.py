from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w,h in [(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://prototype.test/**',lambda route:route.fulfill(body=(root/'docs/index.html').read_text(),content_type='text/html'))
  page.goto('https://prototype.test/Le-Zombie-/')
  page.locator('#play').tap();page.locator('#pause').tap()
  state=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
  assert state['version']==3
  state.update(stock=30,delivered=12,threat=60)
  state['raid'].update(phase='warning',remaining=20)
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
  page.locator('#load').tap();page.locator('#play').tap();page.locator('#summon').tap()
  expect(page.locator('#stock')).to_have_text('Réserve 24')
  page.locator('#summon').tap()
  expect(page.locator('#stock')).to_have_text('Réserve 24')
  page.locator('#pause').tap();state=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
  state['raid']['remaining']=.15
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
  page.locator('#load').tap();page.locator('#play').tap()
  expect(page.locator('#raid-status')).to_contain_text('noyau')
  page.locator('#build').tap()
  expect(page.locator('#message')).to_contain_text('verrouillée')
  page.screenshot(path=f'/tmp/le-zombie-raid-{w}.png')
  page.locator('#pause').tap();active=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
  assert active['raid']['phase']=='active'
  page.locator('#load').tap();page.locator('#play').tap()
  expect(page.locator('#raid-status')).to_contain_text('noyau')
  page.locator('#pause').tap();active=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
  assert active['raid']['number']==1
  for enemy in active['raid']['enemies']:enemy['hp']=0
  page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',active)
  page.locator('#load').tap();page.locator('#play').tap()
  expect(page.locator('#report')).to_be_visible()
  expect(page.locator('#report-title')).to_have_text('Raid repoussé')
  page.locator('#report-close').tap()
  expect(page.locator('#stock')).to_have_text('Réserve 30')
  page.locator('#pause').tap();page.locator('#report-open').tap();page.locator('#report-close').tap();page.locator('#load').tap();page.locator('#play').tap()
  expect(page.locator('#stock')).to_have_text('Réserve 30')
  assert not errors,errors
  print(f'OK raid {w}x{h}: invocation unique, verrouillage construction, reprise active, rapport et récompense unique')
  page.close()
 browser.close()
