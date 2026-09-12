const s=loadSettings();
const text=qs('#text'),speed=qs('#speed'),size=qs('#size'),margin=qs('#margin'),color=qs('#color'),count=qs('#countdown');
text.value=s.text; speed.value=s.speed; size.value=s.fontSize; margin.value=s.margin; color.value=s.color; count.value=s.countdown;
let running=false,offset=0,last=0,mirror=!!s.mirror,invert=!!s.invert,peer,hostCode,connections=new Set(),countTimer=null;
function state(){return {text:text.value,speed:+speed.value,fontSize:+size.value,margin:+margin.value,color:color.value,mirror,invert,running,offset}}
function render(){const p=qs('#prompt');p.textContent=text.value;p.style.fontSize=size.value+'vw';p.style.left=margin.value+'%';p.style.right=margin.value+'%';p.style.color=color.value;p.style.filter=invert?'invert(1)':'none';p.style.transform='translateY(calc(-50% + '+(-offset)+'px))'+(mirror?' scaleX(-1)':'')}
function ui(){qs('#speedV').textContent=(+speed.value).toFixed(1)+'×';qs('#sizeV').textContent=size.value+'vw';qs('#marginV').textContent=margin.value+'%'}
function broadcast(m){connections.forEach(c=>{if(c.open)c.send(m)})}
function save(){saveSettings({text:text.value,speed:+speed.value,fontSize:+size.value,margin:+margin.value,color:color.value,countdown:+count.value,mirror,invert});ui();render();broadcast({type:'state',state:state()})}
[text,speed,size,margin,color,count].forEach(x=>x.addEventListener('input',save));
function loop(t){if(!running)return;const d=Math.min(80,t-(last||t));last=t;offset+=d*.035*+speed.value;render();requestAnimationFrame(loop)}
function play(v){running=v;if(v){last=0;requestAnimationFrame(loop)}else last=0;qs('#play').textContent=v?'Ⅱ':'▶';broadcast({type:'state',state:state()})}
function action(a){if(a==='play')play(!running);if(a==='back')offset=Math.max(0,offset-180);if(a==='forward')offset+=180;if(a==='slower')speed.value=Math.max(.2,+speed.value-.1);if(a==='faster')speed.value=Math.min(4,+speed.value+.1);if(a==='smaller')size.value=Math.max(2,+size.value-.5);if(a==='larger')size.value=Math.min(12,+size.value+.5);if(a==='restart'){offset=0;play(false)}if(a==='mirror')mirror=!mirror;save()}
['play','back','forward','slower','faster','smaller','larger','restart','mirror2'].forEach(id=>qs('#'+id)?.addEventListener('click',()=>action(id==='mirror2'?'mirror':id)));
qs('#mirror').onclick=()=>{mirror=!mirror;save()};qs('#invert').onclick=()=>{invert=!invert;save()};
async function goFullscreen(){try{if(!document.fullscreenElement)await qs('#stage').requestFullscreen();}catch{toast('Le plein écran doit être autorisé par le navigateur.')}}
qs('#fullscreen').onclick=goFullscreen;
qs('#exit').onclick=()=>{play(false);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});qs('#stage').hidden=true;qs('#setup').style.display='block'};
qs('#launch').onclick=()=>startLaunch();
function startLaunch(){if(!text.value.trim())return toast('Ajoutez un texte.');clearInterval(countTimer);const n=+count.value;if(!n){openStage(true);return}qs('#count').hidden=false;let x=n;qs('#countNum').textContent=x;countTimer=setInterval(()=>{x--;if(x<=0){clearInterval(countTimer);countTimer=null;qs('#count').hidden=true;openStage(true)}else qs('#countNum').textContent=x},1000)}
function openStage(autoFullscreen=false){qs('#setup').style.display='none';qs('#stage').hidden=false;offset=0;render();if(autoFullscreen)setTimeout(goFullscreen,80)}
qs('#count').addEventListener('click',()=>{if(countTimer){clearInterval(countTimer);countTimer=null;qs('#count').hidden=true;toast('Lancement annulé')}});
function status(){const ok=connections.size>0;qs('#statusDot').classList.toggle('ok',ok);qs('#statusText').textContent=ok?connections.size+' télécommande(s) connectée(s)':'Téléphone non connecté';qs('#peers').textContent=qs('#statusText').textContent}
function host(){hostCode=makeCode();peer=new Peer('pt-'+hostCode);peer.on('open',()=>{qs('#code').textContent=hostCode;qs('#qr').innerHTML='';new QRCode(qs('#qr'),{text:new URL('remote.html',location.href).href+'?code='+hostCode,width:200,height:200})});peer.on('connection',c=>{connections.add(c);status();c.on('open',()=>c.send({type:'state',state:state()}));c.on('data',m=>m.type==='command'&&action(m.action));c.on('close',()=>{connections.delete(c);status()});c.on('error',()=>{connections.delete(c);status()})});peer.on('error',e=>{if(e.type==='unavailable-id'){peer.destroy();setTimeout(host,100)}else toast('Erreur de connexion')});peer.on('disconnected',()=>peer.reconnect())}
qs('#connect').onclick=()=>qs('#modal').classList.add('open');qs('#closeModal').onclick=()=>qs('#modal').classList.remove('open');
let hide;qs('#stage').addEventListener('mousemove',()=>{qs('#stage').classList.add('show-controls');clearTimeout(hide);hide=setTimeout(()=>qs('#stage').classList.remove('show-controls'),2500)});qs('#stage').addEventListener('touchstart',()=>qs('#stage').classList.add('show-controls'),{passive:true});
window.addEventListener('keydown',e=>{if(qs('#stage').hidden)return;if(e.key===' '){e.preventDefault();action('play')}else if(e.key==='ArrowLeft')action('back');else if(e.key==='ArrowRight')action('forward');else if(e.key.toLowerCase()==='r')action('restart');else if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})});
host();ui();render();