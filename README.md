# Le Zombie · Les Cendres — alpha 0.3

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
