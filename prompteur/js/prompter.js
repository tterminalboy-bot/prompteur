/* ============================================================
   Prompteur — logique de l'écran (prompter.js)
   ============================================================ */
(function () {
  const setupScreen = document.getElementById('setup-screen');
  const stage = document.getElementById('stage');
  const track = document.getElementById('track');
  const textEl = document.getElementById('prompter-text');
  const hud = document.getElementById('hud');
  const hudSpeed = document.getElementById('hud-speed');
  const hudState = document.getElementById('hud-state');
  const exitBtn = document.getElementById('exit-btn');
  const startBtn = document.getElementById('start-btn');
  const scriptInput = document.getElementById('script-input');
  const mirrorToggleSetup = document.getElementById('mirror-toggle-setup');
  const codeDisplay = document.getElementById('code-display');
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');
  const qrContainer = document.getElementById('qr-code');

  const state = {
    playing: false,
    speed: 1.0,
    fontSize: 48,
    mirror: false,
    y: 0,
    baseSpeed: 55, // px/seconde à vitesse 1.0×
  };

  let conn = null;
  let peer = null;
  let lastTime = null;
  let maxScroll = 0;
  let mirrorSetup = false;

  // ---------------- Connexion pair-à-pair ----------------

  function startPeer() {
    const code = generateRoomCode();
    const id = codeToPeerId(code);

    peer = new Peer(id, {
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
    });

    peer.on('open', () => {
      codeDisplay.textContent = code;
      renderQr(buildRemoteUrl(code));
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        try { peer.destroy(); } catch (e) {}
        startPeer(); // code déjà pris ailleurs, on retente avec un autre
      } else {
        statusText.textContent = 'Erreur de connexion';
        console.error(err);
      }
    });

    peer.on('connection', (c) => {
      if (conn) { try { conn.close(); } catch (e) {} }
      conn = c;
      wireConnection();
    });
  }

  function wireConnection() {
    conn.on('open', () => {
      setStatus(true);
      sendState();
    });
    conn.on('data', handleRemoteMessage);
    conn.on('close', () => setStatus(false));
  }

  function setStatus(connected) {
    statusPill.classList.toggle('connected', connected);
    statusText.textContent = connected ? 'Télécommande connectée' : 'En attente…';
  }

  function renderQr(url) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: url,
      width: 132,
      height: 132,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function sendState() {
    if (conn && conn.open) {
      conn.send({
        type: 'state',
        playing: state.playing,
        speed: state.speed,
        fontSize: state.fontSize,
        mirror: state.mirror,
      });
    }
  }

  function handleRemoteMessage(msg) {
    if (!msg || msg.type !== 'cmd') return;
    switch (msg.action) {
      case 'toggle': setPlaying(!state.playing); break;
      case 'play': setPlaying(true); break;
      case 'pause': setPlaying(false); break;
      case 'speedUp': setSpeed(state.speed + 0.1); break;
      case 'speedDown': setSpeed(state.speed - 0.1); break;
      case 'fontUp': setFontSize(state.fontSize + 4); break;
      case 'fontDown': setFontSize(state.fontSize - 4); break;
      case 'nudge': nudge(msg.amount || 0); break;
      case 'restart': restart(); break;
      case 'mirror': setMirror(!state.mirror); break;
    }
  }

  // ---------------- État / actions ----------------

  function setPlaying(v) {
    state.playing = v;
    hudState.textContent = v ? 'Lecture' : 'Pause';
    sendState();
  }

  function setSpeed(v) {
    state.speed = clamp(Math.round(v * 10) / 10, 0.2, 3);
    hudSpeed.textContent = state.speed.toFixed(1) + '×';
    sendState();
  }

  function setFontSize(v) {
    state.fontSize = clamp(v, 22, 100);
    textEl.style.fontSize = state.fontSize + 'px';
    recomputeBounds();
    sendState();
  }

  function setMirror(v) {
    state.mirror = v;
    stage.classList.toggle('mirror', v);
    sendState();
  }

  function nudge(amount) {
    state.y = clamp(state.y - amount, -maxScroll, 0);
    applyTransform();
  }

  function restart() {
    state.y = 0;
    applyTransform();
  }

  function applyTransform() {
    const mirrorPart = state.mirror ? ' scaleX(-1)' : '';
    track.style.transform = `translateY(${state.y}px)${mirrorPart}`;
  }

  function recomputeBounds() {
    requestAnimationFrame(() => {
      const trackHeight = track.scrollHeight;
      const viewportHeight = stage.clientHeight;
      maxScroll = Math.max(0, trackHeight - viewportHeight);
    });
  }

  // ---------------- Boucle de défilement ----------------

  function tick(ts) {
    if (lastTime === null) lastTime = ts;
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;
    if (state.playing) {
      state.y = clamp(state.y - state.baseSpeed * state.speed * dt, -maxScroll, 0);
      applyTransform();
      if (state.y <= -maxScroll) setPlaying(false);
    }
    requestAnimationFrame(tick);
  }

  // ---------------- Écran de configuration ----------------

  mirrorToggleSetup.addEventListener('click', () => {
    mirrorSetup = !mirrorSetup;
    mirrorToggleSetup.textContent = 'Miroir : ' + (mirrorSetup ? 'activé' : 'désactivé');
  });

  startBtn.addEventListener('click', () => {
    const text = scriptInput.value.trim() || 'Votre texte apparaîtra ici.';
    textEl.textContent = text;
    textEl.style.fontSize = state.fontSize + 'px';
    state.mirror = mirrorSetup;
    stage.classList.toggle('mirror', mirrorSetup);

    setupScreen.style.display = 'none';
    stage.classList.add('active');
    state.y = 0;
    applyTransform();
    recomputeBounds();
    requestAnimationFrame(tick);

    if (stage.requestFullscreen) stage.requestFullscreen().catch(() => {});
  });

  exitBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    stage.classList.remove('active');
    setupScreen.style.display = 'flex';
    setPlaying(false);
  });

  window.addEventListener('resize', recomputeBounds);

  stage.addEventListener('click', () => hud.classList.toggle('show'));

  document.addEventListener('keydown', (e) => {
    if (!stage.classList.contains('active')) return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!state.playing); }
    if (e.code === 'Escape' && document.fullscreenElement) document.exitFullscreen();
  });

  startPeer();
})();
