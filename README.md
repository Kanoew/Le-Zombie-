# Le Zombie · Les Cendres — alpha 0.4

Survival cyberpunk en JavaScript / Canvas 2D natif, sans dépendance. Première boucle d'expédition du projet Android de Kanoew. Aucun asset tiers : décor et personnages sont dessinés par le code, encore provisoires.

## Jouer sur téléphone

Site prévu : https://kanoew.github.io/Le-Zombie-/ (GitHub Pages doit être activé sur main, dossier /docs ou racine). L'interface s'adapte au portrait et au paysage. Bouton plein écran si le navigateur le permet.

- Rejoindre la sortie à l'est du refuge, puis Interagir pour partir.
- Fouiller les cinq caisses du quartier (sac limité à 12). Un sac plein laisse le surplus dans la caisse.
- Combattre les quatre infectés avec la machette, ou les éviter. Un cercle annonce leur attaque ; l'esquive consomme de l'endurance. La nuit accroît vitesse et dégâts.
- Revenir par l'entrée ouest du quartier. Au noyau du refuge, Interagir dépose le sac et restaure la vie.
- Renforcer la machette à l'atelier (10 ferrailles, dégâts 30 → 45), puis construire des murs (2 ferrailles). Bâtir active la grille : toucher une case pour poser ou démonter.
- Le chien suit et contourne les murs. La minicarte montre position, obstacles, accès et caches.

Clavier : ZQSD / WASD / flèches, espace pour frapper, Maj pour esquiver, E pour interagir. Sur téléphone, joystick et boutons fonctionnent avec des pointeurs distincts.

## Progression et limites

Les caisses, ennemis vaincus, ressources, amélioration, heure, constructions, position et vie sont enregistrés ensemble en localStorage. Sauvegarde après les transactions, toutes les 15 secondes et au passage en arrière-plan. Copie précédente et migration de l'ancien prototype v1. Pause lors d'un changement d'onglet ; aucune simulation permanente en arrière-plan.

Règle alpha affichée : la mort renvoie au refuge et retire la moitié du sac, sans sac récupérable pour l'instant. Le refuge peut désormais subir un raid (voir alpha 0.3 ci-dessous). Pas encore d’artisanat complet, personnalisation, boss, PWA ou APK. La sauvegarde navigateur ne remplace pas encore l'écriture atomique sur fichier de la future application. Effacer les données du site efface la partie.

## Développement et publication

Node.js 22+ :

```sh
npm run dev
npm test
npm run check
npm run build
```

Le serveur écoute sur le port 3000 (`PORT` peut le modifier). `npm run build` intègre CSS et JavaScript dans `docs/index.html` pour Pages et dans `dist/le-zombie.html` pour un fichier autonome. Inclure `docs/` dans chaque commit de publication. La page source utilise aussi des chemins relatifs afin de fonctionner sous le sous-chemin GitHub du dépôt.

Dans Settings → Pages : Deploy from a branch, main, /docs (recommandé). Une configuration existante à la racine fonctionne également. Le déploiement est exécuté par GitHub après le push.

## Validation

Tests Node : navigation, construction et protection des accès, collecte partielle, dépôt et amélioration sans double débit, conservation des caisses et ennemis entre cartes, sauvegarde et migration. Tests Chromium mobile en 390×844 et 844×390 sur la racine et le bundle Pages : chargement du style, transitions, fouille, dépôt et amélioration via les commandes, absence d'erreur JavaScript. Les scénarios positionnent le joueur via les sauvegardes pour tester chaque interaction séparément.

Restent à mesurer sur téléphone Android réel : confort tactile, navigation prolongée, fluidité, reprise après interruption système et session de 30 minutes. Cette alpha ne valide pas encore toutes les étapes A et B du cahier des charges.

## Alpha 0.3 — défense du refuge

- Fouiller ajoute 5 de menace par ferraille ; vaincre un infecté du quartier ajoute 5. Après au moins 8 ferrailles livrées, atteindre 60 de menace déclenche une alerte de 45 secondes de jeu actif. Le raid démarre au refuge ; si le joueur est dehors à l'échéance, il commence au retour.
- **Invoquer Écho · 6** reconstitue un défenseur unique pour 6 ferrailles. Il se déplace sur la grille et frappe au contact. Blessé à 0 PV, il est indisponible jusqu'au soin au noyau hors raid.
- Quatre assaillants attaquent le noyau, le défenseur et les murs. Les murs ont 100 PV ; les coups infligent 25. Le joueur peut repousser les ennemis avec sa machette. Construction, démontage, atelier, soins et sortie sont verrouillés pendant le raid.
- Victoire : +6 ferrailles. Noyau à 0 ou assaut non repoussé après 120 secondes : fin du raid et perte de 10 % arrondie à l'entier inférieur de la réserve. Aucune mort permanente. Le rapport conserve l'identifiant, les murs détruits, les frappes d'Écho et les coûts/récompenses déjà appliqués. Consulter ou recharger le rapport ne les réapplique pas.
- **Réparer** restaure les murs encore debout pour 1 ferraille par mur, dans la limite du stock disponible. Un mur détruit doit être reconstruit.
- **Chien** interrompt un ennemi accessible à 80 unités maximum. Recharge : 12 secondes. Il n'attaque pas à travers un obstacle.
- Les ressources ordinaires et infectés du quartier se renouvellent à l'entrée après cinq minutes de jeu actif. Ils ne sont pas réinitialisés à chaque transition.
- Sauvegardes v1 et v2 migrées vers v3 en conservant la progression. L'alerte, le raid actif, les dommages, le défenseur et les rapports sont sauvegardés. Les fichiers source ont des URL versionnées pour éviter un mélange d'anciennes ressources dans le cache mobile.

**Limite explicite :** le jeu est en pause pendant l'absence ; aucun calcul de raid hors session n'est encore effectué. Les graphismes restent procéduraux. Cette mise à jour ne constitue pas la recette Android complète.

Validation mobile reproductible (Python Playwright et Chromium installés) :

```sh
python3 test/mobile.py
python3 test/raid_mobile.py
```

Ces scénarios utilisent des sauvegardes préparées pour atteindre les interactions. Ils couvrent l'exploration, le multitouch, l'invocation, la reprise d'un raid et l'absence de double récompense, en portrait et paysage. Les 11 tests Node comprennent aussi une simulation avec enceinte fermée et une avec défenseur. Les performances sur téléphone réel restent à mesurer.

## Alpha 0.4 — présentation et confort

Refonte de l'écran d'accueil, des commandes, du journal et de la minicarte. Décors, équipements et personnages redessinés en pixel art procédural original, sans images ni polices externes. Le terrain statique est mis en cache dans des canvas hors écran ; les personnages, les lumières, la pluie et les retours d'attaque sont rendus séparément. La caméra est plus proche et accompagne le joueur. Les panneaux respectent les marges de sécurité du téléphone.

La construction fonctionne maintenant en deux touches : sélectionner la case pour voir l'aperçu et le coût, puis toucher la même case pour confirmer. Un placement refusé est indiqué par un aperçu rouge et un message. Aucun coût n'est appliqué pendant l'aperçu.

L'option **Effets : réduits** coupe la pluie et les mouvements décoratifs et supprime l'interpolation de caméra. Elle respecte la préférence système au premier lancement, puis mémorise le choix sur cet appareil. Les indicateurs d'attaque restent visibles. Les commandes et règles détaillées sont accessibles dans le menu. Échap ouvre/ferme la pause ou ferme le rapport.

Les sauvegardes restent en version 3 : aucun changement au contenu de la partie. Publication avec `npm run build`, incluant le renderer dans le HTML autonome et les URL versionnées des fichiers source.

Vérification supplémentaire : `python3 test/design_mobile.py` couvre les formats 390×844, 844×390, 568×320 et 360×640, la préférence d'effets après rechargement et le débit de construction uniquement après confirmation. La qualité et la fluidité sur appareil Android réel restent à apprécier lors des essais.

## Alpha 0.5 — survivante, arsenal et quartier étendu

Le personnage fourni comme référence est désormais intégré via trois planches animées, une par arme : 192 poses au total, attente/marche/attaque dans quatre directions. Machette, sabre et hachette ont des portées, coûts d’endurance, dégâts et durées distincts ; l’impact est synchronisé avec le milieu du coup. L’arsenal s’ouvre en touchant l’arme équipée.

Le quartier passe de 960 × 576 à 1920 × 1280 avec un décor généré et intégré, huit caches et huit infectés. Clinique, dépôt, marché et abords des serres sont reliés par les avenues. Toucher la minicarte ouvre la carte générale. Les intérieurs sont fermés ; les collisions de bâtiments sont approximées sur la grille. Le refuge conserve ses dimensions et sa construction dynamique.

L’écran est allégé : gestion du refuge dans le panneau ouvert par l’icône maison, armes dans l’arsenal, carte dans sa propre vue. Les images sont chargées avant de rendre le bouton de départ actif. En cas d’échec, le menu signale les visuels manquants et le rendu de secours reste disponible. Environ 10 Mo de PNG sont chargés au premier lancement ; la fluidité et le téléchargement restent à mesurer sur téléphone réel.

Les sauvegardes passent à la version 4. Les anciennes ressources, armes améliorées, murs, menace, défenseur et raids sont conservés. Les cinq anciennes caches et les quatre anciens infectés conservent leur état aux nouveaux emplacements. Un joueur sauvegardé dans l’ancien quartier est replacé à la nouvelle entrée pour éviter de se retrouver dans un bâtiment. Les trois caches et quatre infectés supplémentaires sont nouveaux.

Détails de production, formats et limites : [assets/README.md](assets/README.md). Aucun service de génération ni accès réseau externe n’est requis par le jeu après chargement des fichiers statiques.

Vérification : `npm test` (15 scénarios), `npm run check`, `npm run build`, puis `python3 test/mobile.py`, `python3 test/raid_mobile.py`, `python3 test/design_mobile.py` et `python3 test/art_mobile.py`. Le dernier scénario vérifie le décodage des images, les armes, la temporisation de l’impact et la carte en portrait/paysage ainsi que le HTML autonome sans requêtes externes.

## Alpha 0.6 — camp aménagé et personnages vivants

Les monstres et Écho utilisent maintenant des planches animées dans la famille graphique de la survivante : rôdeur vert, colosse vert, gardienne argentée. Les acteurs ont une orientation propre, un cycle de marche lié à la distance, des ombres et un éclairage cohérents. Les coups infligent les dégâts au milieu du mouvement et interrompent l’ennemi touché. Les frappes du joueur repoussent légèrement la cible et l’esquive laisse des silhouettes brèves (sauf effets réduits).

Le déplacement du joueur a une courte accélération et un arrêt amorti. Les diagonales ne sont pas plus rapides ; les collisions sont vérifiées par petits pas, y compris pendant l’esquive. Compagnons et défenseurs prennent un trajet direct si le segment est libre, sinon suivent des points de grille avec anticipation du virage. La caméra suit une interpolation indépendante de la fréquence d’affichage.

Au refuge, **icône maison → Installations** ouvre quatre modules à emplacement fixe :

| Module | Coût | Effet |
| --- | ---: | --- |
| Générateur | 8 | Produit 4 unités d’énergie, sans combustible quotidien. |
| Couchages | 4 | Écho récupère 100 PV en 90 secondes de jeu actif au camp. |
| Infirmerie | 6 | Consomme 2 énergies ; avec les couchages, réduit ce délai à 45 secondes. |
| Éclairage | 4 | Consomme 1 énergie et éclaire les accès et installations la nuit. |

Les modules ont des volumes de collision, sont sauvegardés et ne peuvent être installés deux fois ni pendant un raid. Une ancienne construction sur l’emplacement empêche l’installation jusqu’au démontage. Les occupants doivent libérer l’emplacement. La récupération est suspendue en expédition et pendant un raid. Le soin manuel au noyau reste disponible hors raid.

Sauvegardes en version 5, migration depuis v4 conservant positions, ressources, équipement, ennemis, murs, défenseur et raid. Les quatre installations sont initialement non construites. Les mêmes PNG sont inclus dans le build autonome et copiés pour Pages ; le volume initial de téléchargement augmente avec ces nouveaux assets.

Validation : 22 tests Node, parcours d’exploration/raid/armes, test des quatre formats mobiles et `python3 test/camp_mobile.py` pour installation, budget d’énergie, coût unique, persistance et rendu nocturne. Les mesures de fluidité sur appareil Android réel restent à faire. Les raids hors session, le placement libre des modules, des animations dédiées de mort et l’asset final du chien ne sont pas encore réalisés.

## Correctif 0.6.1 — patrouilles et réapparitions individuelles

Conserve l’évolution de Claude Code (patrouilles et délai individuel de 90 secondes), avec les corrections suivantes :

- Les trois points de chaque patrouille sont sélectionnés sur des cases accessibles, reliées au lieu de départ. La génération reste déterministe. Un scénario simule deux minutes pour chacun des huit infectés afin de détecter les blocages.
- Le renouvellement du butin après cinq minutes ne réinitialise plus la population. Chaque ennemi garde sa position, ses PV et son échéance entre deux cartes.
- Le retour survient au plus tôt 90 secondes de jeu actif après la mort. Si le joueur est à moins de 160 unités du point de départ, le retour attend qu’il s’éloigne, sans repousser l’échéance sauvegardée. Au camp, le délai peut s’écouler ; la réapparition se résout lors du retour dans le quartier. Les pauses et l’absence ne font toujours pas avancer l’horloge.
- La sauvegarde passe en version 7 : migration des versions antérieures, réparation des patrouilles et ajout d’une échéance aux morts qui n’en avaient pas. Un délai existant est conservé, y compris s’il est déjà écoulé. La migration ne ressuscite pas les ennemis et ne modifie ni ressources, ni installations, ni équipement.
- Les positions de départ, points de patrouille, index et échéances sont désormais validés au chargement. La population est sauvegardée immédiatement après une réapparition.

`src/city-ai.js` regroupe les morts, retours et patrouilles pour les vérifier sans navigateur. Les recherches de navigation dans la ville utilisent des collisions en ensemble pour éviter de parcourir toute la liste des bâtiments à chaque case testée.

Vérifications : 30 tests Node, dont les régressions des trois problèmes ; `python3 test/city_mobile.py` exerce une mort réelle, le délai, un changement de carte après cinq minutes, le retour et le rechargement, en portrait et paysage. Les parcours d’exploration et de raid restent vérifiés. Les URL source sont versionnées en 0.6.1 pour éviter le mélange de fichiers d’anciennes versions.
