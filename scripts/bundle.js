import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFile(resolve(root,p),'utf8');
const [html,css,world,game]=await Promise.all(['index.html','style.css','src/world.js','src/game.js'].map(read));
const output=html.replace('<link rel="stylesheet" href="./style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="./src/game.js"></script>',()=>`<script type="module">${world.replaceAll('export ','')}\n${game.replace(/^import .*;\n/,'')}</script>`);
await mkdir(resolve(root,'dist'),{recursive:true});
await writeFile(resolve(root,'dist/le-zombie.html'),output);
console.log('Fichier autonome généré : dist/le-zombie.html');

// GitHub Pages can serve this directory directly from main.
await mkdir(resolve(root,'docs'),{recursive:true});
await writeFile(resolve(root,'docs/index.html'),output);
await writeFile(resolve(root,'docs/.nojekyll'),'');
console.log('Site GitHub Pages généré : docs/index.html');
