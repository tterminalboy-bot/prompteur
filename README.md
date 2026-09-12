# Prompteur

Prompteur web statique pour PC/tablette + téléphone.

## Fonctions
- écran prompteur plein écran
- télécommande mobile
- QR code + code à 4 chiffres
- plusieurs télécommandes simultanées
- commandes synchronisées
- reconnexion automatique
- sauvegarde locale du texte et des réglages
- compte à rebours
- marges, taille et couleur personnalisables
- interface responsive

## GitHub Pages
Dans **Settings → Pages**, choisir **Deploy from a branch**, branche `main`, dossier `/ (root)`.

L'application n'a pas de serveur applicatif. PeerJS sert à la signalisation WebRTC ; la communication de données est ensuite établie entre les navigateurs.
