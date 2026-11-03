"""Serve real static files so large PNGs do not travel through Playwright's RPC."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from urllib.parse import unquote,urlsplit
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  path=unquote(urlsplit(path).path)
  if path.startswith('/root/Le-Zombie-/'):candidate=ROOT/path.removeprefix('/root/Le-Zombie-/')
  elif path.startswith('/docs/Le-Zombie-/'):candidate=ROOT/'docs'/path.removeprefix('/docs/Le-Zombie-/')
  else:return str(ROOT/'missing-test-file')
  candidate=candidate.resolve()
  return str(candidate) if candidate==ROOT or ROOT in candidate.parents else str(ROOT/'missing-test-file')
 def log_message(self,*args):pass
SERVER=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=SERVER.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{SERVER.server_port}'
def install_routes(page,source='docs',requests=None):
 if requests is not None:page.on('request',lambda req:requests.append(req.url.split('/Le-Zombie-/')[-1].split('?')[0]))
 def redirect(route):
  relative=route.request.url.split('/Le-Zombie-/')[-1]
  route.fulfill(status=302,headers={'Location':f'{BASE}/{source}/Le-Zombie-/{relative}'})
 page.route('https://prototype.test/**',redirect)
