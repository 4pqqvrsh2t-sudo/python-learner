const CONCEPTS = [
  ['print','print()'],['variables','Variables'],['strings','Strings'],['numbers','Numbers'],['input','input()'],['comparisons','Comparisons'],['if','if / else'],['lists','Lists'],['loops','Loops'],['functions','Functions']
];
const DEFAULT_LEARNED = ['print','variables','strings','numbers','input','comparisons','if'];
const KEY='pyrecall-v2';
const state = load();
let currentQuestion=null;
let selected=null;
let hiddenAt=null;

function load(){try{return {...defaults(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return defaults()}}
function defaults(){return{clientId:crypto.randomUUID(),learned:DEFAULT_LEARNED,mastery:{},streak:0,lastDay:null,notifications:false}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
const $=id=>document.getElementById(id);

async function api(path, opts={}){const r=await fetch(path,{headers:{'content-type':'application/json',...(opts.headers||{})},...opts});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||`HTTP ${r.status}`);return r.json()}
function b64ToUint8(base64){const padding='='.repeat((4-base64.length%4)%4);const base64Safe=(base64+padding).replace(/-/g,'+').replace(/_/g,'/');const raw=atob(base64Safe);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
function normalize(s){return String(s).trim().replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n')}
function conceptName(id){return CONCEPTS.find(c=>c[0]===id)?.[1]||id}
function tierName(t){return ['','Recall','Apply','Manipulate'][t]||'Practice'}

async function syncProfile(){try{await api('/api/profile',{method:'POST',body:JSON.stringify({clientId:state.clientId,learnedConcepts:state.learned,mastery:state.mastery})})}catch{}}

function renderSchedule(config){
  const d=new Date(), weekend=[0,6].includes(d.getDay());
  const times=weekend?config.weekendTimes:config.weekdayTimes;
  $('scheduleHeading').textContent=weekend?'Weekend':'Weekday';
  $('schedule').innerHTML=times.map((t,i)=>`<div class="slot"><b>${formatTime(t)}</b><span>${i+1}/5</span></div>`).join('');
}
function formatTime(hhmm){let [h,m]=hhmm.split(':').map(Number);const ap=h>=12?'PM':'AM';h=h%12||12;return `${h}:${String(m).padStart(2,'0')} ${ap}`}

function renderConcepts(){
  $('concepts').innerHTML=CONCEPTS.map(([id,name])=>`<label class="concept-row"><input type="checkbox" data-concept="${id}" ${state.learned.includes(id)?'checked':''}><span>${name}</span></label>`).join('');
  $('learnedSummary').innerHTML=state.learned.map(id=>`<span class="chip">${conceptName(id)}</span>`).join('');
  document.querySelectorAll('[data-concept]').forEach(el=>el.onchange=async()=>{
    const id=el.dataset.concept;
    if(el.checked&&!state.learned.includes(id))state.learned.push(id);
    if(!el.checked)state.learned=state.learned.filter(x=>x!==id);
    if(!state.learned.length){state.learned=['print'];document.querySelector('[data-concept="print"]').checked=true}
    save();renderConcepts();await syncProfile();
  });
}

async function enablePush(){
  $('pushStatus').textContent='Setting up notifications…';
  if(!('serviceWorker'in navigator)||!('PushManager'in window)){ $('pushStatus').textContent='This browser does not support Web Push.'; return; }
  if(!window.matchMedia('(display-mode: standalone)').matches && /iPhone|iPad|iPod/.test(navigator.userAgent)){
    $('pushStatus').textContent='On iPhone, add PyRecall to your Home Screen first, then open it from the new icon.';return;
  }
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){ $('pushStatus').textContent='Notifications were not allowed.';return; }
  const reg=await navigator.serviceWorker.ready;
  const config=await api('/api/config');
  if(!config.vapidPublicKey||config.vapidPublicKey.startsWith('REPLACE'))throw new Error('The server VAPID public key has not been configured yet.');
  let sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(config.vapidPublicKey)});
  const raw=sub.toJSON();
  await api('/api/subscribe',{method:'POST',body:JSON.stringify({clientId:state.clientId,subscription:raw,learnedConcepts:state.learned,mastery:state.mastery})});
  state.notifications=true;save();renderPushState();
  $('pushStatus').textContent='Daily questions are on. You can lock your phone; pushes come from the server.';
}
function renderPushState(){
  $('enablePush').textContent=state.notifications?'Notifications enabled':'Enable daily notifications';
  $('testPush').classList.toggle('hidden',!state.notifications);
}
async function testPush(){
  $('pushStatus').textContent='Sending a test…';
  try{await api('/api/test-push',{method:'POST',body:JSON.stringify({clientId:state.clientId})});$('pushStatus').textContent='Test sent. Lock Screen delivery can take a moment.'}catch(e){$('pushStatus').textContent=e.message}
}

async function showQuestion(id, challenge=false){
  let q;
  if(id){q=await api(`/api/question?id=${encodeURIComponent(id)}`)}else{
    // Challenge mode: pick a learned concept and request a local tier-3 question by known IDs.
    const hard={print:'p3',variables:'v3',strings:'s3',numbers:'n3',input:'i3',comparisons:'c3',if:'if3',lists:'l3',loops:'loop3',functions:'f3'};
    const candidates=state.learned.map(x=>hard[x]).filter(Boolean);
    q=await api(`/api/question?id=${candidates[Math.floor(Math.random()*candidates.length)]}`);
  }
  if(!state.learned.includes(q.concept)&&!challenge){showEager();return}
  currentQuestion=q;selected=null;
  $('questionCard').classList.remove('hidden');$('eagerCard').classList.add('hidden');
  $('conceptPill').textContent=conceptName(q.concept);$('tierLabel').textContent=tierName(q.tier);$('prompt').textContent=q.prompt;
  $('codeBox').classList.toggle('hidden',!q.code);$('code').textContent=q.code||'';$('feedback').className='feedback hidden';
  if(q.type==='choice'){
    $('answers').innerHTML=q.options.map(x=>`<button class="choice" data-answer="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')+'<button id="checkAnswer" class="primary check">Check</button>';
    document.querySelectorAll('.choice').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.choice').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');selected=btn.dataset.answer});
  }else{
    $('answers').innerHTML='<textarea id="typedAnswer" class="typed" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="Type the Python here…"></textarea><button id="checkAnswer" class="primary check">Check</button>';
  }
  $('checkAnswer').onclick=checkAnswer;
  window.scrollTo({top:$('questionCard').offsetTop-10,behavior:'smooth'});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

async function checkAnswer(){
  if(!currentQuestion)return;
  const given=currentQuestion.type==='choice'?selected:$('typedAnswer').value;
  if(!given)return;
  const accepts=[currentQuestion.answer,...(currentQuestion.accepts||[])].map(normalize);
  const correct=accepts.includes(normalize(given));
  const old=state.mastery[currentQuestion.concept]||0;
  state.mastery[currentQuestion.concept]=Math.max(0,Math.min(100,old+(correct?(currentQuestion.tier===3?12:8):-7)));
  const day=new Date().toISOString().slice(0,10);
  if(correct&&state.lastDay!==day){state.streak=(state.lastDay&&daysBetween(state.lastDay,day)===1)?state.streak+1:1;state.lastDay=day}
  save();$('streak').textContent=state.streak;await syncProfile();
  const f=$('feedback');f.className=`feedback ${correct?'good':'bad'}`;f.innerHTML=`<b>${correct?'Correct':'Not quite'}</b><p>${escapeHtml(currentQuestion.explain)}</p>${correct?'':`<p><b>Answer:</b> <code>${escapeHtml(currentQuestion.answer)}</code></p>`}`;
}
function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000)}
function showEager(){$('eagerCard').classList.remove('hidden');$('questionCard').classList.add('hidden')}
function markNotLearned(){
  if(!currentQuestion)return;
  state.learned=state.learned.filter(x=>x!==currentQuestion.concept);if(!state.learned.length)state.learned=['print'];save();renderConcepts();syncProfile();showQuestion(null,true);
}

async function init(){
  if('serviceWorker'in navigator)await navigator.serviceWorker.register('/sw.js');
  $('streak').textContent=state.streak;renderConcepts();renderPushState();
  try{const config=await api('/api/config');renderSchedule(config)}catch{}
  $('enablePush').onclick=()=>enablePush().catch(e=>$('pushStatus').textContent=e.message);
  $('testPush').onclick=()=>testPush();
  $('challengeBtn').onclick=()=>showQuestion(null,true);
  $('notLearned').onclick=markNotLearned;
  $('toggleConcepts').onclick=()=>$('concepts').classList.toggle('hidden');

  const params=new URLSearchParams(location.search);
  const scheduled=params.get('scheduled')==='1';
  const q=params.get('q');
  if(scheduled&&q){await showQuestion(q,false);history.replaceState({},'',location.pathname)}
  else showEager();

  // iPhone may keep a Home Screen PWA alive in the background instead of reloading it.
  // A normal reopen between scheduled pushes should therefore become extra-practice mode.
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){hiddenAt=Date.now();return}
    if(hiddenAt&&Date.now()-hiddenAt>15000){showEager();hiddenAt=null}
  });
}
init();
