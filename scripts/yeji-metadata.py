"""Normalize the imported atlas anchors without changing the supplied PNGs."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
path = root / 'src/atlas-new.js'
atlases = json.loads(path.read_text().split('export const newAtlases = ', 1)[1].strip().removesuffix(';'))
for name, atlas in atlases.items():
    alpha = Image.open(root / 'assets' / atlas['file']).getchannel('A')
    atlas['scale'] = .303 if name == 'companion' else .2
    for r, row in enumerate(atlas['rows']):
        for col, frame in enumerate(row):
            if name == 'companion':
                # Stable cell origin preserves the lift in the jump and run poses.
                frame['anchorX'] = col * 192 + 96 - frame['x']
                frame['anchorY'] = r * 208 + 203 - frame['y']
            else:
                # Weapon bounds move during a swing; only boots determine the pivot.
                y = frame['y'] + frame['h']
                feet = alpha.crop((frame['x'], y - 8, frame['x'] + frame['w'], y)).point(lambda a: 255 if a > 127 else 0).getbbox()
                assert feet, (name, r, col)
                frame['anchorX'] = (feet[0] + feet[2]) / 2
                frame['anchorY'] = frame['h']
    print(name, sum(map(len, atlas['rows'])), 'poses', atlas['scale'])
path.write_text('// Imported from Claude commit b630ec2; anchors normalized by scripts/yeji-metadata.py.\n'
                '// Weapons: right, left, down, up; six attack frames each.\n'
                '// Companion: idle, run-right, run-left, greeting, jump, hurt, talk, think, rest, look-right, look-left.\n'
                + 'export const newAtlases = ' + json.dumps(atlases, separators=(',', ':')) + ';\n')
