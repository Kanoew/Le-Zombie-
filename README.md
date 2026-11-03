# Le Zombie — prototype Canvas 2D

Essai technique inspiré du cahier des charges survival cyberpunk de Kanoew. JavaScript natif, Canvas 2D et serveur Node sans dépendances. Phaser reste une option pour la suite ; ce premier essai ne l'utilise pas.

## Lancer

Node.js 22 ou supérieur :

```sh
cd /workspace/Le-Zombie-
npm run dev
```

Le serveur écoute sur le port 3000 (`PORT` permet de le changer). Pour tester sur téléphone, il faut une URL HTTPS accessible ou un accès réseau au serveur ; une adresse locale au cloud n'est pas accessible depuis le téléphone. Aucune publication distante n'est effectuée par ces commandes.

## Jouer

- Joystick tactile ou ZQSD / WASD / flèches pour se déplacer.
- Attaquer / espace ; esquive / Maj. Ces actions consomment de l'endurance.
- Trois ennemis de test : éliminer un infecté donne 3 ferrailles.
- Le chien suit en contournant les murs via une recherche de chemin sur grille.
- Construire : toucher une case pour poser un mur (2 ferrailles) ou le démonter (remboursement complet dans ce prototype).
- Le cycle d'essai dure 12 minutes de jour et 6 de nuit. Un bouton permet de tester la nuit immédiatement.
- Sauvegarde automatique toutes les 15 secondes et lors de la mise en arrière-plan, ou bouton Sauvegarder. Recharger restaure le joueur, le chien, les murs, l'heure et les ressources. Les ennemis sont réinitialisés.

La sauvegarde est propre au navigateur et à l'origine du site. Une copie précédente est conservée et utilisée si la sauvegarde courante est invalide. Ce stockage navigateur n'est pas encore le système de fichiers atomique requis pour l'APK. Les onglets masqués mettent le jeu en pause.

## Vérification

```sh
npm test
npm run check
```

Tests : navigation après modification d'un mur, transactions de construction et validation des sauvegardes. Un essai Chromium mobile vérifie également le chargement, la nuit, la construction et la reprise. Les performances et les commandes simultanées restent à valider sur un vrai téléphone Android.

## Limites de cet essai

Une seule carte, formes pixelisées provisoires, une arme, aucun asset externe. Pas encore de défenseur, porte, fouille, inventaire, raid, PWA, APK ou export Godot. La mort rétablit le joueur au refuge sans perte. Les ennemis n'attaquent pas encore les murs ; le camp fermé n'est donc pas un test de défense complet. Ce prototype constitue une première partie de l'étape A, pas sa validation finale.

## Version autonome pour téléphone

`npm run build` génère `dist/le-zombie.html`, avec le CSS et le JavaScript intégrés. Télécharger ce fichier et l’ouvrir dans un navigateur Android acceptant les fichiers HTML locaux. Aucune connexion ni installation nécessaire pour le jeu. La disponibilité de la sauvegarde locale dépend du navigateur et du mode d’ouverture. Si Android ne propose pas de navigateur pour le fichier, utiliser un hébergement HTTPS statique ; aucun hébergement n’est configuré automatiquement.

## Publication GitHub Pages

`npm run build` produit aussi `docs/index.html`, autonome et compatible avec le sous-chemin du dépôt. Après une modification du jeu, reconstruire puis inclure `docs/` dans le commit.

Dans les paramètres GitHub du dépôt, section Pages : sélectionner **Deploy from a branch**, branche **main**, dossier **/docs**, puis enregistrer. GitHub déploie ensuite les mises à jour poussées sur cette branche. L'adresse attendue après activation est `https://kanoew.github.io/Le-Zombie-/`.
