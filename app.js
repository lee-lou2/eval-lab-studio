
const STORE='evallab-viewed-v1',POS='evallab-last-v1';
const $=id=>document.getElementById(id);
let course=[],meta={},filter='all',query='',idx=0;
const load=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch{return{}}};
const viewed=id=>!!load()[id];
const mark=id=>{const m=load();m[id]={at:new Date().toISOString()};localStorage.setItem(STORE,JSON.stringify(m))};
const loadPos=()=>{const n=Number(localStorage.getItem(POS)||'0');return Number.isFinite(n)?Math.max(0,Math.min(course.length-1,n)):0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function filtered(){const q=query.trim().toLowerCase();return course.filter(it=>{
 if(filter==='unread'&&viewed(it.id))return false;if(filter==='video'&&!it.video)return false;
 if(q&&!(it.title+' '+it.summary+' '+it.id).toLowerCase().includes(q))return false;return true})}
function renderHome(){
 const unread=course.findIndex(it=>!viewed(it.id));const ri=unread>=0?unread:loadPos();const r=course[ri];
 $('resumeTitle').textContent=r?`${String(r.index+1).padStart(2,'0')}. ${r.title}`:'강의 없음';$('resumeBtn').dataset.idx=String(ri);
 const items=filtered(),list=$('list');
 if(!items.length){list.innerHTML='<li class="empty">표시할 강의가 없어요.</li>'}else{
 list.innerHTML=items.map(it=>{const done=viewed(it.id);return `<li><button type="button" class="lesson${done?' done':''}" data-idx="${it.nav}">
  <div class="lesson-idx"><div class="n">${done?'✓':String(it.index+1).padStart(2,'0')}</div><div class="spine"></div></div>
  <div class="lesson-card"><div class="top">${it.video?'<span class="pill video">VIDEO</span>':'<span class="pill text">TEXT</span>'}<span class="seen">${it.minutes}분 · ${done?'봤음':'안 봄'}</span></div>
  <h3>${esc(it.title)}</h3><p>${esc(it.summary)}</p></div></button></li>`}).join('');
 list.querySelectorAll('.lesson').forEach(b=>b.addEventListener('click',()=>openWatch(Number(b.dataset.idx))))}
 const up=meta.upcoming||[];$('upcoming').innerHTML=up.length?`<h4>다음 예정 (발송되면 열려요)</h4><ul>${up.map(u=>`<li>${String(u.index+1).padStart(2,'0')}. ${esc(u.title)}</li>`).join('')}</ul>`:'';
}
function openWatch(i){
 if(!course.length)return;i=Math.max(0,Math.min(course.length-1,Number(i)||0));idx=i;const it=course[i];mark(it.id);localStorage.setItem(POS,String(i));
 $('home').classList.add('hidden');$('watch').classList.remove('hidden');
 $('barFill').style.width=((i+1)/course.length*100)+'%';$('watchCount').textContent=`${i+1} / ${course.length}`;
 $('watchKicker').textContent=`${it.phase} · Lesson ${String(it.index+1).padStart(2,'0')}`;$('watchTitle').textContent=it.title;
 $('watchSub').textContent=`읽는 시간 약 ${it.minutes}분 · 출처 ${it.sources.length}건`;
 const c=$('cinema');
 if(it.video){const u='videos/'+encodeURIComponent(it.video);c.innerHTML=`<video id="v" controls playsinline preload="metadata" src="${u}"></video>`;
  c.insertAdjacentHTML('afterend','');}
 else c.innerHTML='<div class="placeholder">이 강의는 텍스트 강의입니다.<br/>아래에서 바로 읽어 보세요.</div>';
 $('watchBody').innerHTML=it.html||'';
 $('prevBtn').disabled=i<=0;$('nextBtn').disabled=i>=course.length-1;
 window.scrollTo(0,0);history.replaceState(null,'','#'+encodeURIComponent(it.id));
}
function closeWatch(){const v=document.getElementById('v');if(v)v.pause();$('watch').classList.add('hidden');$('home').classList.remove('hidden');history.replaceState(null,'','#');renderHome()}
const on=(el,fn)=>el.addEventListener('click',e=>{e.preventDefault();if(el.disabled)return;fn(e)});
function bind(){
 on($('prevBtn'),()=>openWatch(idx-1));on($('nextBtn'),()=>openWatch(idx+1));on($('backHome'),closeWatch);
 on($('resumeBtn'),()=>openWatch(Number($('resumeBtn').dataset.idx||0)));
 $('q').addEventListener('input',e=>{query=e.target.value;renderHome()});
 document.querySelectorAll('.seg-item').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.seg-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;renderHome()}));
 document.addEventListener('keydown',e=>{if($('watch').classList.contains('hidden'))return;if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
  if(e.key==='ArrowLeft')openWatch(idx-1);if(e.key==='ArrowRight')openWatch(idx+1);if(e.key==='Escape')closeWatch()});
}
async function boot(){
 const d=await (await fetch('data.json',{cache:'no-store'})).json();meta=d.meta||{};course=(d.items||[]).filter(x=>x.kind==='lesson');course.forEach((it,i)=>it.nav=i);
 $('metaLine').textContent=`공개 ${course.length}강 / 전체 계획 ${meta.total_planned||'?'}강 · 영상 ${meta.videos||0}개 · 하루 2회 새 강의 · 읽음 표시는 이 기기에만 저장`;
 bind();renderHome();
 const h=decodeURIComponent((location.hash||'').replace(/^#/,''));if(h){const i=course.findIndex(x=>x.id===h);if(i>=0)openWatch(i)}
}
boot();
