# Prompteur

Un prompteur en ligne 100 % statique : affiche ton texte en plein écran sur un ordinateur ou une tablette, et pilote le défilement depuis ton téléphone comme une télécommande — lecture/pause, vitesse, avance/retour manuel, taille du texte, mode miroir.

Aucun serveur à héberger : les deux appareils se connectent directement en pair-à-pair (WebRTC, via [PeerJS](https://peerjs.com/)). Le texte ne transite jamais par un serveur tiers.

## Utiliser le prompteur

1. Ouvre `index.html` → **Ouvrir l'écran** sur l'appareil qui affichera le texte.
2. Colle ton texte, clique sur **Lancer le prompteur**.
3. Sur ton téléphone, scanne le QR code affiché (ou ouvre `remote.html` et entre le code à 4 chiffres).
4. Une fois connecté, pilote le défilement depuis le téléphone : lecture/pause, vitesse (−/+), avancer/reculer manuellement, taille du texte, miroir (utile pour un rig avec vitre semi-réfléchissante), retour au début.

Raccourci clavier sur l'écran du prompteur : `Espace` = lecture/pause, `Échap` = quitter le plein écran.

## Déployer sur GitHub Pages

1. Crée un dépôt GitHub et pousse tout le contenu de ce dossier (`index.html`, `prompter.html`, `remote.html`, `css/`, `js/`) à la racine.
2. Dans le dépôt : **Settings → Pages → Source**, choisis la branche (ex. `main`) et le dossier `/ (root)`.
3. GitHub publie le site à une adresse du type `https://ton-compte.github.io/ton-depot/`. C'est cette adresse (en HTTPS) qu'il faut ouvrir — le QR code se génère automatiquement avec la bonne URL.

## Tester en local

Ouvrir les fichiers directement (`file://`) peut poser des soucis avec certains navigateurs. Le plus fiable est de lancer un petit serveur local à la racine du dossier :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Pour tester avec un vrai téléphone en local, les deux appareils doivent être sur le même réseau Wi-Fi, et tu dois remplacer `localhost` par l'adresse IP locale de ton ordinateur (ex. `http://192.168.1.23:8000`) sur le téléphone.

## Comment ça marche

- **Code à 4 chiffres** = identifiant PeerJS (`proompteur-fr-XXXX`). L'écran du prompteur crée cet identifiant ; la télécommande s'y connecte directement.
- **QR code** encode l'URL de `remote.html?code=XXXX` : le scanner ouvre directement la télécommande déjà connectée.
- La connexion passe par le service de signalisation public gratuit de PeerJS pour établir la liaison, puis les données (commandes, état) circulent en direct entre les deux appareils.
- Comme aucun serveur TURN n'est configuré (solution 100 % gratuite et statique), la connexion peut échouer sur certains réseaux très restrictifs (Wi-Fi d'entreprise, pare-feu strict). Dans ce cas, essaie avec les deux appareils sur le même réseau, ou en partage de connexion depuis le téléphone.

## Personnaliser

- Vitesse de base du défilement : variable `baseSpeed` dans `js/prompter.js`.
- Couleurs / typographies : variables CSS en haut de `css/style.css`.
- Pas d'avance/recul manuel, pas de taille de police : constantes dans les gestionnaires de clics de `js/remote.js`.
