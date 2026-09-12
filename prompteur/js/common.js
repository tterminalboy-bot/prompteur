/* ============================================================
   Prompteur — utilitaires partagés (common.js)
   ============================================================ */

// Préfixe des identifiants PeerJS pour éviter les collisions
// avec d'autres apps qui utiliseraient le même service public.
const PEER_PREFIX = 'proompteur-fr-';

/** Génère un code à 4 chiffres lisible à voix haute. */
function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function codeToPeerId(code) {
  return PEER_PREFIX + code;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Construit l'URL absolue de la télécommande pré-remplie avec le code. */
function buildRemoteUrl(code) {
  const url = new URL('remote.html', window.location.href);
  url.searchParams.set('code', code);
  return url.toString();
}
