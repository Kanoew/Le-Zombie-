from browser_support import install_routes
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w,h in [(390,844),(844,390),(568,320),(360,640)]:
  page=b.new_page(viewport={'width':w,'height':h},has_touch=True,is_mobile=True)
  errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  install_routes(page)
  page.goto('https://prototype.test/Le-Zombie-/')
  page.wait_for_timeout(150)
  page.screenshot(path=f'/tmp/le-zombie-design-menu-{w}.png')
  page.locator('#motion').tap();assert 'réduits' in page.locator('#motion').inner_text()
  page.locator('#play').tap();page.wait_for_timeout(100)
  # A construction preview must not charge until the second touch.
  if not page.locator('#build').is_visible():page.locator('#refuge-menu').tap()
  page.locator('#build').tap()
  zoom=.84 if w<600 else .88
  vw=round(w*zoom);vh=round(h*zoom)
  cx=(960-vw)/2 if vw>960 else max(-16,min(960-vw+16,464-vw/2))
  cy=(576-vh)/2 if vh>576 else max(-32,min(576-vh+32,304-vh*.48))
  candidates=[(592,368),(592,240),(400,240),(464,432),(368,400),(560,432)]
  for wx,wy in candidates:
   sx=(wx-cx)/vw*w;sy=(wy-cy)/vh*h
   if 0<sx<w and 0<sy<h and page.evaluate('([x,y])=>document.elementFromPoint(x,y)?.id==="game"',[sx,sy]):break
  else:raise AssertionError('Aucune case de construction visible hors des panneaux')
  page.touchscreen.tap(sx,sy)
  expect(page.locator('#stock')).to_have_text('Réserve 8')
  page.touchscreen.tap(sx,sy)
  expect(page.locator('#stock')).to_have_text('Réserve 6')
  page.touchscreen.tap(sx,sy)
  expect(page.locator('#stock')).to_have_text('Réserve 6')
  page.touchscreen.tap(sx,sy)
  expect(page.locator('#stock')).to_have_text('Réserve 8')
  if not page.locator('#build').is_visible():page.locator('#refuge-menu').tap()
  page.locator('#build').tap()
  page.locator('#pause').tap()
  page.reload()
  expect(page.locator('#motion')).to_have_text('Effets : réduits')
  page.locator('#play').tap()
  expect(page.locator('#stock')).to_have_text('Réserve 8')
  page.screenshot(path=f'/tmp/le-zombie-design-game-{w}.png')
  assert not errs,errs
  print('OK design',w,h)
  page.close()
 b.close()
