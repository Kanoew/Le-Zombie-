# Assets — Les Cendres, alpha 0.5

Images générées pour ce projet à partir du personnage de référence fourni par Kanoew : cheveux rouge profond, veste noire, tenue rouge, bijoux dorés. La tenue a été adaptée au combat avec jupe fendue plus courte et bottes. Les fichiers PNG originaux sont conservés sans retouche ni redimensionnement.

## Personnage

- `hero-atlas.png` : machette.
- `hero-sabre.png` : variante sabre.
- `hero-hatchet.png` : variante hachette.
- Chaque planche : 1254 × 1254, RGBA, 8 colonnes × 8 lignes, 64 poses.
- Lignes 0/1 : sud, 2/3 : ouest, 4/5 : est, 6/7 : nord.
- Ligne paire : marche, 8 images, première image utilisée pour l’attente.
- Ligne impaire : attaque, 8 images, anticipation → impact → récupération.
- Marche à 10 images/seconde. Attaque sur une durée propre à chaque arme. Les dégâts sont appliqués à 50 % du cycle et non lors de la pression initiale.

Le quadrillage généré n’est pas parfaitement régulier. **Ne pas découper en cellules fixes de 156,75 pixels** : cela peut capturer une partie d’un personnage voisin. `atlas.json` et `src/atlas-data.js` donnent les rectangles et ancrages des 192 poses réellement séparées. Le pied sert d’ancrage ; l’échelle est fixe par planche. Les métadonnées sont calculées par lecture de la transparence, sans modifier les images : `python3 scripts/atlas-metadata.py` (Pillow requis). Les coordonnées sont vérifiées par les tests Node.

Les séquences restent issues d’une génération d’images : une retouche manuelle pourra améliorer certains mouvements de cheveux et de vêtements. Pas de planches dédiées à la mort ou à l’impact pour l’instant ; esquive et dégâts utilisent des effets du moteur. Les autres acteurs conservent leurs sprites procéduraux.

## Armes

`weapons.png` : 2172 × 724, trois icônes de 724 × 724 dans l’ordre machette, sabre, hachette. Transparence réelle. Les statistiques et le choix d’équipement sont définis dans `src/weapons.js`.

## Quartier

`district.png` : 1536 × 1024, rendu à 1920 × 1280 dans le jeu. Clinique / logements au nord-ouest, dépôt au nord-est, marché au sud-ouest, serres au sud-est. La carte utilise les avenues et les abords des bâtiments. Les intérieurs ne sont pas jouables. Les bâtiments possèdent des collisions rectangulaires approchées ; les points de fouille et ennemis sont placés sur les chemins accessibles, vérifiés par recherche de chemin. Cette illustration n’est pas un tileset modifiable.

Les PNG sont servis localement, sans CDN. Le build copie les assets dans `docs/assets` et les intègre comme données dans le HTML autonome de `dist`. Aucune clé ni service de génération n’est nécessaire pour jouer.

## Alpha 0.6 — personnages et refuge

- `infected.png` : rôdeur chibi verdâtre, vêtements déchirés, yeux jaunes et contamination des implants.
- `brute.png` : colosse chibi vert, épaules massives et bras mutant ; échelle légèrement plus grande.
- `echo.png` : Écho-01, gardienne synthétique aux cheveux argentés, tenue bleu nuit et sabre, dans le style de la survivante.
- Ces trois planches ajoutent 192 poses (64 par personnage), soit 384 poses indexées au total. Même organisation sud/ouest/est/nord, marche et attaque. L’extraction conserve les ancrages de pieds et les PNG originaux. Certains pixels de frange sont très faiblement opaques : le rendu réel se vérifie sur le fond du jeu plutôt qu’avec un aperçu converti en RGB.
- `camp-props.png` : quatre installations en grille 2 × 2, dans l’ordre générateur, infirmerie, couchages, éclairage. `prop-atlas.json` et `src/prop-data.js` donnent leurs rectangles. Les objets sont triés avec les acteurs selon leur profondeur.

Les ombres au sol, l’éclairage, le recul d’impact et les traînées d’esquive sont rendus par le jeu. Les cycles de marche avancent en fonction de la distance réellement parcourue, pas pendant l’immobilité. Les attaques des ennemis et d’Écho ont une anticipation et un impact à mi-cycle. Le chien conserve son dessin procédural.
