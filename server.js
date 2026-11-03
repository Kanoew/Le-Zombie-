import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve(import.meta.dirname);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
http.createServer(async (req,res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    if (!['.html','.js','.css','.png','.json'].includes(extname(path)) || path.includes('/test/')) { res.writeHead(404).end(); return; }
    const data = await readFile(path);
    res.writeHead(200, {'Content-Type':types[extname(path)], 'Cache-Control':'no-store'}).end(data);
  } catch { res.writeHead(404).end('Introuvable'); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Prototype démarré sur le port ' + (process.env.PORT || 3000)));
