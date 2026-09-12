const STORE_KEY='prompteur-settings-v1';
const DEFAULTS={text:'',speed:1,fontSize:6,margin:8,color:'#ffffff',countdown:3,mirror:false,invert:false};
function loadSettings(){try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(STORE_KEY)||'{}'))}catch(e){return Object.assign({},DEFAULTS)}}
function saveSettings(patch){const next=Object.assign({},loadSettings(),patch);localStorage.setItem(STORE_KEY,JSON.stringify(next));return next}
function qs(s){return document.querySelector(s)}
function toast(message){let el=qs('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2200)}
function makeCode(){return String(Math.floor(1000+Math.random()*9000))}
