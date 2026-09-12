const input=qs('#codeInput');
let code=new URLSearchParams(location.search).get('code')||localStorage.getItem('prompteur-code')||'';input.value=code;
let peer=null,conn=null,retryTimer=null,connecting=false;
function connected(v){qs('#dot').classList.toggle('ok',v);qs('#connectionText').textContent=v?'Connecté':'Connexion…'}
function retry(){clearTimeout(retryTimer);retryTimer=setTimeout(()=>{if(code&&!conn?.open)connect()},2500)}
function resetConnection(){if(conn){try{conn.close()}catch{}}conn=null;if(peer){try{peer.destroy()}catch{}}peer=null}
function syncState(s){
  if(!s)return;
  qs('#play').firstChild.textContent=s.running?'Ⅱ':'▶';
  if(s.bands!==undefined)qs('#remoteBands').classList.toggle('active',!!s.bands);
  if(s.arrows!==undefined)qs('#remoteArrows').classList.toggle('active',!!s.arrows);
  if(s.lineEnabled!==undefined)qs('#remoteLine').classList.toggle('active',!!s.lineEnabled);
  if(s.mirror!==undefined||s.invert!==undefined){const flip=!!(s.mirror||s.invert);qs('#mirror').classList.toggle('active',flip);qs('#invert').classList.toggle('active',flip)}
  if(s.bandHeight!==undefined){qs('#bandHeight').value=s.bandHeight;qs('#bandHeightValue').textContent=s.bandHeight+'%'}
  if(s.bandBlur!==undefined){qs('#bandBlur').value=s.bandBlur;qs('#bandBlurValue').textContent=s.bandBlur+'%'}
  if(s.arrowSize!==undefined){qs('#arrowSize').value=s.arrowSize;qs('#arrowSizeValue').textContent=s.arrowSize+'px'}
  if(s.lineSize!==undefined){qs('#lineSize').value=s.lineSize;qs('#lineSizeValue').textContent=s.lineSize+'px'}
}
function connect(){
  code=input.value.replace(/\D/g,'').slice(0,4);input.value=code;
  if(code.length!==4)return toast('Le code doit contenir 4 chiffres.');
  localStorage.setItem('prompteur-code',code);clearTimeout(retryTimer);resetConnection();connecting=true;connected(false);
  peer=new Peer(undefined,{debug:0});
  const fail=()=>{connecting=false;connected(false);toast('Connexion impossible. Vérifiez le code affiché sur l’écran.');retry()};
  peer.on('open',()=>{conn=peer.connect('pt-'+code,{reliable:true});
    const timeout=setTimeout(()=>{if(!conn?.open)fail()},7000);
    conn.on('open',()=>{clearTimeout(timeout);connecting=false;qs('#connectView').hidden=true;qs('#controlView').hidden=false;connected(true)});
    conn.on('data',m=>{if(m?.type==='state')syncState(m.state)});
    conn.on('close',()=>{connected(false);retry()});conn.on('error',fail);
  });
  peer.on('error',fail);peer.on('disconnected',()=>peer.reconnect());
}
function send(a){if(conn?.open)conn.send({type:'command',action:a});else toast('Télécommande non connectée')}
function setting(key,value){if(conn?.open)conn.send({type:'setting',key,value});else toast('Télécommande non connectée')}
qs('#backHome').onclick=()=>{clearTimeout(retryTimer);resetConnection();location.href='index.html'};
qs('#connectBtn').onclick=connect;input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,4)});input.addEventListener('keydown',e=>{if(e.key==='Enter')connect()});
['play','back','forward','slower','faster','smaller','larger','restart','mirror','invert'].forEach(id=>qs('#'+id).onclick=()=>send(id));
qs('#remoteBands').onclick=()=>setting('bands',!qs('#remoteBands').classList.contains('active'));
qs('#remoteArrows').onclick=()=>setting('arrows',!qs('#remoteArrows').classList.contains('active'));
qs('#remoteLine').onclick=()=>setting('lineEnabled',!qs('#remoteLine').classList.contains('active'));
qs('#bandHeight').oninput=e=>{qs('#bandHeightValue').textContent=e.target.value+'%';setting('bandHeight',+e.target.value)};
qs('#bandBlur').oninput=e=>{qs('#bandBlurValue').textContent=e.target.value+'%';setting('bandBlur',+e.target.value)};
qs('#arrowSize').oninput=e=>{qs('#arrowSizeValue').textContent=e.target.value+'px';setting('arrowSize',+e.target.value)};
qs('#lineSize').oninput=e=>{qs('#lineSizeValue').textContent=e.target.value+'px';setting('lineSize',+e.target.value)};
qs('#fullscreen').onclick=()=>document.documentElement.requestFullscreen?.().catch(()=>{});
qs('#disconnect').onclick=()=>{clearTimeout(retryTimer);resetConnection();qs('#controlView').hidden=true;qs('#connectView').hidden=false;connected(false)};
if(code.length===4)setTimeout(connect,300);
