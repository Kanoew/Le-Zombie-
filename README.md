# Le Zombie · Les Cendres — alpha 0.2

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

Règle alpha affichée : la mort renvoie au refuge et retire la moitié du sac, sans sac récupérable pour l'instant. Le refuge est sûr. Le contenu du quartier est fini, sans renouvellement pour cet essai. Pas encore de raid, défenseur, artisanat complet, personnalisation, boss, PWA ou APK. La sauvegarde navigateur ne remplace pas encore l'écriture atomique sur fichier de la future application. Effacer les données du site efface la partie.

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
