/* ============================================================
   Prompteur — logique de la télécommande (remote.js)
   ============================================================ */
(function () {
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');
  const joinScreen = document.getElementById('join-screen');
  const controlScreen = document.getElementById('control-screen');
  const codeInputs = Array.from(document.querySelectorAll('#code-input input'));
  const joinBtn = document.getElementById('join-btn');
  const footerText = document.getElementById('footer-text');

  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const speedValue = document.getElementById('speed-value');
  const fontsizeValue = document.getElementById('fontsize-value');
  const mirrorBtn = document.getElementById('mirror-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  let peer = null;
  let conn = null;
  let remoteState = { playing: false, speed: 1.0, fontSize: 48, mirror: false };

  // ---------------- Saisie du code ----------------

  codeInputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (input.value && i < codeInputs.length - 1) codeInputs[i + 1].focus();
      updateJoinState();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) codeInputs[i - 1].focus();
      if (e.key === 'Enter' && !joinBtn.disabled) joinBtn.click();
    });
  });

  function updateJoinState() {
    const full = codeInputs.every((inp) => inp.value.length === 1);
    joinBtn.disabled = !full;
  }

  function getCode() {
    return codeInputs.map((inp) => inp.value).join('');
  }

  function prefillFromUrl() {
    const code = (getQueryParam('code') || '').replace(/[^0-9]/g, '');
    if (code.length === 4) {
      code.split('').forEach((ch, i) => (codeInputs[i].value = ch));
      updateJoinState();
      connectToCode(code);
    }
  }

  joinBtn.addEventListener('click', () => connectToCode(getCode()));

  // ---------------- Connexion pair-à-pair ----------------

  function connectToCode(code) {
    if (code.length !== 4) return;
    joinBtn.disabled = true;
    joinBtn.textContent = 'Connexion…';

    if (!peer) {
      peer = new Peer(PEER_PREFIX + 'remote-' + Math.random().toString(36).slice(2, 8), {
        config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      });
      peer.on('open', () => openConnection(code));
      peer.on('error', onPeerError);
    } else {
      openConnection(code);
    }
  }

  function openConnection(code) {
    conn = peer.connect(codeToPeerId(code), { reliable: true });

    conn.on('open', () => {
      statusPill.classList.add('connected');
      statusText.textContent = 'Connecté';
      joinScreen.style.display = 'none';
      controlScreen.classList.add('active');
    });

    conn.on('data', handlePrompterMessage);

    conn.on('close', () => {
      statusPill.classList.remove('connected');
      statusText.textContent = 'Déconnecté';
      controlScreen.classList.remove('active');
      joinScreen.style.display = 'flex';
      joinBtn.disabled = false;
      joinBtn.textContent = 'Se connecter';
    });

    conn.on('error', onPeerError);
  }

  function onPeerError(err) {
    console.error(err);
    joinBtn.disabled = false;
    joinBtn.textContent = 'Se connecter';
    footerText.textContent = 'Connexion impossible — vérifie le code et réessaie.';
  }

  function handlePrompterMessage(msg) {
    if (!msg || msg.type !== 'state') return;
    remoteState = msg;
    renderState();
  }

  function send(action, extra) {
    if (conn && conn.open) conn.send(Object.assign({ type: 'cmd', action }, extra || {}));
  }

  // ---------------- Rendu de l'état reçu ----------------

  function renderState() {
    playBtn.classList.toggle('is-playing', remoteState.playing);
    playIcon.style.display = remoteState.playing ? 'none' : '';
    pauseIcon.style.display = remoteState.playing ? '' : 'none';
    speedValue.textContent = remoteState.speed.toFixed(1) + '×';
    fontsizeValue.textContent = remoteState.fontSize + 'px';
    mirrorBtn.classList.toggle('toggled', !!remoteState.mirror);
  }

  // ---------------- Contrôles ----------------

  playBtn.addEventListener('click', () => send('toggle'));
  document.getElementById('speed-up').addEventListener('click', () => send('speedUp'));
  document.getElementById('speed-down').addEventListener('click', () => send('speedDown'));
  document.getElementById('font-up').addEventListener('click', () => send('fontUp'));
  document.getElementById('font-down').addEventListener('click', () => send('fontDown'));
  document.getElementById('nudge-up').addEventListener('click', () => send('nudge', { amount: -100 }));
  document.getElementById('nudge-down').addEventListener('click', () => send('nudge', { amount: 100 }));
  document.getElementById('restart-btn').addEventListener('click', () => send('restart'));
  mirrorBtn.addEventListener('click', () => send('mirror'));

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      fullscreenBtn.textContent = 'Quitter le plein écran';
    } else {
      document.exitFullscreen();
      fullscreenBtn.textContent = 'Plein écran télécommande';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran télécommande';
  });

  updateJoinState();
  prefillFromUrl();
})();
