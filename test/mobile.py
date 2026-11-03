from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for source in ['root','docs']:
  for w,h in [(390,844),(844,390)]:
   page=browser.new_page(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
   errors=[];requests=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   def serve(route):
    path=route.request.url.split('/Le-Zombie-/')[-1].split('?')[0]
    target=root/('docs' if source=='docs' else '')/(path or 'index.html')
    requests.append(path)
    if not target.is_file():route.fulfill(status=404);return
    types={'.js':'text/javascript','.css':'text/css','.html':'text/html'}
    route.fulfill(body=target.read_text(),content_type=types.get(target.suffix,'text/plain'))
   page.route('https://prototype.test/**',serve)
   page.goto('https://prototype.test/Le-Zombie-/')
   assert page.locator('#game').is_visible()
   assert page.locator('body').evaluate("e=>getComputedStyle(e).margin")=='0px'
   page.locator('#play').tap()
   page.locator('#interact').tap()
   assert 'soignés' in page.locator('#message').inner_text()
   # Seed an arrival position via the public save/reload UI to exercise transitions.
   page.locator('#pause').tap()
   state=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
   state['player']['x']=850;state['player']['y']=304;state['dog']['x']=816;state['dog']['y']=304
   page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
   page.locator('#load').tap();page.locator('#play').tap();page.locator('#interact').tap()
   expect(page.locator('#zone')).to_have_text('LES CENDRES')
   assert not page.locator('#camp-tools').is_visible()
   page.locator('#pause').tap()
   state=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
   state['player']['x']=208;state['player']['y']=224;state['dog']['x']=208;state['dog']['y']=240
   page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
   page.locator('#load').tap();page.locator('#play').tap();page.locator('#interact').tap()
   expect(page.locator('#bag')).to_contain_text('Sac 4/12')
   page.locator('#pause').tap()
   state=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
   assert state['crates'][0]['amount']==0
   state['player'].update(x=80,y=304);state['dog'].update(x=112,y=336)
   page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
   page.locator('#load').tap();page.locator('#play').tap();page.locator('#interact').tap()
   expect(page.locator('#zone')).to_have_text('STATION 07')
   page.locator('#pause').tap();state=page.evaluate("JSON.parse(localStorage.getItem('zombie.save'))")
   state['player'].update(x=464,y=304);state['dog'].update(x=464,y=336)
   page.evaluate('(s)=>localStorage.setItem("zombie.save",JSON.stringify(s))',state)
   page.locator('#load').tap();page.locator('#play').tap();page.locator('#interact').tap()
   expect(page.locator('#bag')).to_contain_text('Sac 0/12')
   expect(page.locator('#stock')).to_contain_text('Réserve 12')
   page.locator('#forge').tap()
   expect(page.locator('#weapon')).to_contain_text('Machette renforcée')
   expect(page.locator('#stock')).to_contain_text('Réserve 2')
   # Exercise two real simultaneous touch points (movement + attack).
   if source=='docs' and w==390:
    stick=page.locator('#stick').bounding_box(); attack=page.locator('#attack').bounding_box()
    before=state['player']['x']
    cdp=page.context.new_cdp_session(page)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':stick['x']+stick['width']/2+30,'y':stick['y']+stick['height']/2,'id':1},{'x':attack['x']+attack['width']/2,'y':attack['y']+attack['height']/2,'id':2}]})
    page.wait_for_timeout(160)
    assert float(page.locator('#spbar').get_attribute('value'))<99
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    page.locator('#pause').tap()
    moved=page.evaluate("JSON.parse(localStorage.getItem('zombie.save')).player.x")
    assert moved>before, (moved,before)
    page.locator('#play').tap()
    print('OK: déplacement et frappe tactiles simultanés')
   page.screenshot(path=f'/tmp/le-zombie-alpha-{source}-{w}.png')
   assert not errors,errors
   if source=='docs':assert requests==[''],requests
   print(f'OK {source} {w}x{h}: CSS, transitions, fouille persistée, dépôt et amélioration, zéro erreur JS')
   page.close()
 browser.close()
