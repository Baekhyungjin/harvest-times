/* 하베스트 타임스 · 선교 네트워크 (network.html)
   목록·상세·글쓰기·사역자 정보·내 글. 권한은 서버(RPC·RLS)가 최종 판단합니다. */
(function(){
'use strict';
var E=TN.esc;
var REGIONS={korea:'국내','east-asia':'동아시아','southeast-asia':'동남아시아','south-asia':'남아시아','central-asia':'중앙아시아','middle-east':'중동',africa:'아프리카',europe:'유럽',americas:'아메리카',oceania:'오세아니아',global:'전 세계·온라인'};
var ROLE={pastor:'목사',missionary:'선교사'};
var PRAYER={urgent:'긴급',praying:'기도 중',answered:'응답됨'};
var DAYS=['일','월','화','수','목','금','토'];
var U,app,me=null,myIds={},NAMES={news:'선교사 동정/소식',prayer:'선교지 긴급기도',event:'선교단체 협력 행사 소식'},SEC={},ROOT=null,ROOTNAME='선교 네트워크';
function q(k){return new URLSearchParams(location.search).get(k);}
function fmt(v){if(!v)return '';var d=new Date(v);if(isNaN(d.getTime()))return '';return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');}
function day(s){if(!s)return null;var p=String(s).slice(0,10).split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);return isNaN(d.getTime())?null:d;}
function dayText(s){var d=day(s);return d?(d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+' ('+DAYS[d.getDay()]+')'):'';}
function paras(t){return String(t||'').trim().split(/\n{2,}/).map(function(p){return '<p>'+E(p).replace(/\n/g,'<br>')+'</p>';}).join('');}
function cut(p,n){var s=String(p.summary||p.body||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n)+'…':s;}
function who(p){return '<span class="nw-who"><b>'+E(p.author_label||'')+'</b> '+E(ROLE[p.ministry_role]||'')+(p.organization?'<i>'+E(p.organization)+'</i>':'')+'</span>';}
function where(p){return E(REGIONS[p.region]||'')+(p.country?' · '+E(p.country):'');}
function link(id){return 'network.html?id='+encodeURIComponent(id);}
function abs(id){var u=new URL('network.html',location.href);u.search='?id='+id;return u.href;}
function remember(){try{sessionStorage.setItem('tn_after_login',location.pathname.split('/').pop()+location.search);}catch(_){}}
function prayed(id){try{return (JSON.parse(localStorage.getItem('tn_prayed')||'[]')).indexOf(Number(id))>=0;}catch(_){return false;}}
function markPrayed(id){try{var a=JSON.parse(localStorage.getItem('tn_prayed')||'[]');if(a.indexOf(Number(id))<0)a.push(Number(id));localStorage.setItem('tn_prayed',JSON.stringify(a.slice(-500)));}catch(_){}}
function toast(msg,bad){var t=document.getElementById('nw-toast');if(!t){t=document.createElement('div');t.id='nw-toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t);}t.textContent=msg;t.className='nw-toast on'+(bad?' bad':'');clearTimeout(toast.t);toast.t=setTimeout(function(){t.className='nw-toast';},3200);}
function msgOf(e){return (e&&e.message)||'요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';}
async function copy(text){
  if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return;}
  var t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';document.body.appendChild(t);t.select();var ok=document.execCommand('copy');t.remove();if(!ok)throw Error('copy');
}
async function loadMe(){
  me=null;myIds={};
  try{var u=TN.user&&TN.user();if(!u)return null;me=await TN.net.me();}catch(_){me=null;return null;}
  try{(await TN.net.mine()).forEach(function(p){myIds[p.id]=p;});}catch(_){}
  return me;
}
function sections(){
  ROOT=U.sections.filter(function(s){return s.code==='mission-network';})[0]||null;
  if(ROOT)ROOTNAME=ROOT.name;
  U.sections.forEach(function(s){var t=U.netTab(s);if(t&&t!=='all'){if(!SEC[t]){SEC[t]=s;NAMES[t]=s.name;}}});
}
function activeId(tab){return (SEC[tab]&&SEC[tab].id)||(ROOT&&ROOT.id)||null;}

/* ---------- 카드 ---------- */
function newsCard(p){
  var img=p.images&&p.images[0];
  return '<article class="nw-card nw-news"><a class="nw-media" href="'+link(p.id)+'" tabindex="-1" aria-hidden="true">'+(img?'<img src="'+E(img)+'" alt="" loading="lazy">':'<span class="nw-ph"><b>'+E(REGIONS[p.region]||'선교 현장')+'</b></span>')+'</a>'+
   '<div class="nw-body"><div class="nw-meta"><span class="nw-region">'+where(p)+'</span><span>'+fmt(p.created_at)+'</span></div>'+
   '<h3><a href="'+link(p.id)+'">'+E(p.title)+'</a></h3><p class="nw-ex">'+E(cut(p,90))+'</p>'+who(p)+
   '<button type="button" class="nw-btn ghost" data-copy="'+p.id+'">후원자용 링크 복사</button></div></article>';
}
function prayerCard(p){
  var st=p.prayer_status||'urgent',done=prayed(p.id);
  return '<article class="nw-card nw-prayer st-'+E(st)+'"><div class="nw-body"><div class="nw-meta"><span class="nw-badge b-'+E(st)+'">'+E(PRAYER[st]||'')+'</span><span class="nw-region">'+where(p)+'</span><span>'+fmt(p.created_at)+'</span></div>'+
   '<h3><a href="'+link(p.id)+'">'+E(p.title)+'</a></h3><p class="nw-ex">'+E(cut(p,120))+'</p>'+who(p)+
   (st==='answered'?'<a class="nw-btn ghost" href="'+link(p.id)+'">응답 소식 보기</a>':'<button type="button" class="nw-btn pray'+(done?' on':'')+'" data-pray="'+p.id+'" aria-pressed="'+done+'">'+(done?'기도하고 있습니다':'함께 기도합니다')+' <b>'+Number(p.prayer_count||0)+'</b></button>')+'</div></article>';
}
function eventCard(p){
  var d=day(p.event_start),past=d&&d<new Date(new Date().toDateString());
  return '<article class="nw-card nw-event'+(past?' past':'')+'"><div class="nw-date"><span>'+(d?(d.getMonth()+1)+'월':'')+'</span><b>'+(d?String(d.getDate()).padStart(2,'0'):'')+'</b><small>'+(d?DAYS[d.getDay()]+'요일':'')+'</small></div>'+
   '<div class="nw-body"><div class="nw-meta"><span class="nw-region">'+(p.event_online?'온라인':E(p.event_place||REGIONS[p.region]||''))+'</span>'+(p.event_end&&p.event_end!==p.event_start?'<span>~ '+E(dayText(p.event_end))+'</span>':'')+(past?'<span class="nw-badge b-past">지난 행사</span>':'')+'</div>'+
   '<h3><a href="'+link(p.id)+'">'+E(p.title)+'</a></h3><p class="nw-ex">'+E(cut(p,80))+'</p>'+who(p)+
   '<div class="nw-acts">'+(p.event_url&&!past?'<a class="nw-btn" href="'+E(p.event_url)+'" target="_blank" rel="noopener">신청하기 ↗</a>':'')+'<a class="nw-btn ghost" href="'+link(p.id)+'">자세히</a></div></div></article>';
}
function card(p){return p.kind==='prayer'?prayerCard(p):p.kind==='event'?eventCard(p):newsCard(p);}
function legacyCard(a){
  return '<a class="nw-legacy" href="article.html?id='+a.id+'">'+(a.image_url?'<img src="'+E(a.image_url)+'" alt="" loading="lazy">':'<span class="nw-ph sm"></span>')+'<span><small>편집국 기사 · '+fmt(a.published_at)+'</small><b>'+E(a.title)+'</b></span></a>';
}
function bindCards(root){
  [].forEach.call(root.querySelectorAll('[data-copy]'),function(b){b.onclick=async function(){try{await copy(abs(b.dataset.copy));toast('링크를 복사했습니다. 카카오톡·문자·이메일에 붙여넣어 후원자에게 보내세요.');}catch(_){prompt('아래 주소를 복사해 주세요.',abs(b.dataset.copy));}};});
  [].forEach.call(root.querySelectorAll('[data-pray]'),function(b){b.onclick=async function(){
    if(!TN.user||!TN.user()){remember();toast('로그인한 회원만 기도에 참여할 수 있습니다. 로그인 화면으로 이동합니다.',true);setTimeout(function(){location.href='member.html?mode=login';},1200);return;}
    if(b.disabled)return;b.disabled=true;
    try{var r=await TN.net.pray(b.dataset.pray);markPrayed(b.dataset.pray);b.classList.add('on');b.setAttribute('aria-pressed','true');b.innerHTML='기도하고 있습니다 <b>'+Number(r&&r.count||0)+'</b>';toast(r&&r.added?'함께 기도해 주셔서 감사합니다.':'이미 기도에 참여하셨습니다.');}
    catch(e){toast(msgOf(e),true);}finally{b.disabled=false;}
  };});
}

/* ---------- 목록 ---------- */
async function hub(){
  var tab=['news','prayer','event'].indexOf(q('tab'))>=0?q('tab'):'all',region=REGIONS[q('region')]?q('region'):'',search=String(q('q')||'').slice(0,60);
  var aid=tab==='all'?(ROOT&&ROOT.id):activeId(tab);if(aid)U.header(aid);
  document.title=(tab==='all'?ROOTNAME:NAMES[tab])+' - '+U.S.site_name;
  var tabs=[['all','전체'],['news',NAMES.news],['prayer',NAMES.prayer],['event',NAMES.event]];
  function href(t,extra){var u=new URLSearchParams();if(t!=='all')u.set('tab',t);if(extra&&extra.region)u.set('region',extra.region);if(extra&&extra.q)u.set('q',extra.q);var s=u.toString();return 'network.html'+(s?'?'+s:'');}
  app.innerHTML='<section class="nw-hero"><div class="wrap"><div class="nw-hero-txt"><p class="nw-eyebrow">HARVEST MISSION NETWORK</p><h1>'+E(ROOTNAME)+'</h1><p>선교지의 소식과 기도제목, 함께할 행사를 나누는 곳입니다. 회원가입한 목사·선교사 누구나 바로 올릴 수 있습니다.</p>'+
    '<div class="nw-stats"><div><b id="st-news">-</b><span>선교사 소식</span></div><div><b id="st-prayer">-</b><span>함께 기도 중</span></div><div><b id="st-event">-</b><span>다가오는 행사</span></div></div></div>'+
    '<div class="nw-hero-cta"><a class="nw-btn gold big" href="network.html?write=1'+(tab!=='all'?'&tab='+tab:'')+'">글쓰기</a><a class="nw-btn line" href="network.html?mine=1" id="nw-mine-link" hidden>내 글 관리</a><small>선교 보고 링크를 후원자에게 바로 보낼 수 있습니다.</small></div></div></section>'+
   '<div class="wrap nw-wrap"><nav class="nw-tabs" aria-label="선교 네트워크 분류">'+tabs.map(function(t){return '<a href="'+href(t[0],{region:region})+'"'+(t[0]===tab?' class="on" aria-current="page"':'')+'>'+E(t[1])+'</a>';}).join('')+'</nav>'+
   '<form class="nw-filter" id="nw-filter"><label class="nw-sr" for="nw-region">지역</label><select id="nw-region" name="region"><option value="">모든 지역</option>'+Object.keys(REGIONS).map(function(k){return '<option value="'+k+'"'+(k===region?' selected':'')+'>'+E(REGIONS[k])+'</option>';}).join('')+'</select>'+
   '<label class="nw-sr" for="nw-q">검색</label><input id="nw-q" name="q" type="search" placeholder="제목·내용 검색" value="'+E(search)+'"><button class="nw-btn">검색</button></form>'+
   '<div id="nw-list"></div><div class="nw-more"><button type="button" class="nw-btn line" id="nw-more" hidden>더 보기</button></div><div id="nw-legacy"></div></div>';
  document.getElementById('nw-filter').onsubmit=function(e){e.preventDefault();location.href=href(tab,{region:document.getElementById('nw-region').value,q:document.getElementById('nw-q').value.trim()});};
  document.getElementById('nw-region').onchange=function(){document.getElementById('nw-filter').requestSubmit();};
  stats();
  loadMe().then(function(m){if(m)document.getElementById('nw-mine-link').hidden=false;});
  var list=document.getElementById('nw-list'),more=document.getElementById('nw-more'),offset=0,size=12;
  var base={region:region||null,q:search||null};
  async function page(){
    var o=Object.assign({},base,{offset:offset,limit:size});
    if(tab!=='all')o.kind=tab;
    if(tab==='event')o.upcoming=true;
    var r=await TN.net.list(o),rows=r.data||[];
    return {rows:rows,total:r.count||0};
  }
  try{
    var first=await page();offset=first.rows.length;
    var html=first.rows.length?'<div class="nw-grid'+(tab==='event'?' events':'')+'">'+first.rows.map(card).join('')+'</div>':empty(tab);
    if(tab==='event'){var past=await TN.net.list(Object.assign({},base,{kind:'event',upcoming:false,limit:6}));if((past.data||[]).length)html+='<h2 class="nw-sub">지난 행사</h2><div class="nw-grid events">'+past.data.map(card).join('')+'</div>';}
    list.innerHTML=html;bindCards(list);
    more.hidden=offset>=first.total;
    more.onclick=async function(){more.disabled=true;try{var n=await page();offset+=n.rows.length;var g=list.querySelector('.nw-grid');if(g){var tmp=document.createElement('div');tmp.innerHTML=n.rows.map(card).join('');bindCards(tmp);while(tmp.firstChild)g.appendChild(tmp.firstChild);}more.hidden=offset>=n.total||!n.rows.length;}catch(e){toast(msgOf(e),true);}finally{more.disabled=false;}};
  }catch(e){list.innerHTML='<div class="nw-empty"><h2>목록을 불러오지 못했습니다.</h2><p>'+E(msgOf(e))+'</p></div>';}
  try{
    var ids=tab==='all'?Object.keys(SEC).map(function(k){return SEC[k].id;}):(SEC[tab]?[SEC[tab].id]:[]);
    if(ids.length&&!region){var leg=await TN.net.legacy(ids);if(search)leg=leg.filter(function(a){return (a.title+' '+(a.summary||'')).indexOf(search)>=0;});
      if(leg.length)document.getElementById('nw-legacy').innerHTML='<h2 class="nw-sub">편집국이 전하는 선교 소식</h2><div class="nw-legacy-list">'+leg.slice(0,6).map(legacyCard).join('')+'</div>';}
  }catch(_){}
}
function empty(tab){
  var t={all:'아직 올라온 글이 없습니다.',news:'아직 선교사 소식이 없습니다.',prayer:'아직 기도제목이 없습니다.',event:'다가오는 행사가 없습니다.'}[tab];
  return '<div class="nw-empty"><h2>'+E(t)+'</h2><p>회원가입한 목사·선교사님은 누구나 첫 글을 올릴 수 있습니다.</p><a class="nw-btn" href="network.html?write=1'+(tab!=='all'?'&tab='+tab:'')+'">첫 글 쓰기</a></div>';
}
async function stats(){
  try{
    var r=await Promise.all([TN.net.list({kind:'news',limit:1}),TN.net.list({kind:'prayer',prayer_status:'urgent',limit:1}),TN.net.list({kind:'prayer',prayer_status:'praying',limit:1}),TN.net.list({kind:'event',upcoming:true,limit:1})]);
    document.getElementById('st-news').textContent=r[0].count||0;document.getElementById('st-prayer').textContent=(r[1].count||0)+(r[2].count||0);document.getElementById('st-event').textContent=r[3].count||0;
  }catch(_){}
}

/* ---------- 상세 ---------- */
async function detail(id){
  var p=null;try{p=await TN.net.get(id);}catch(_){p=null;}
  await loadMe();
  if(!p&&myIds[id])p=myIds[id];
  if(!p){app.innerHTML='<div class="wrap nw-narrow"><div class="nw-empty"><h2>글을 찾을 수 없습니다.</h2><p>삭제되었거나 비공개로 바뀐 글일 수 있습니다.</p><a class="nw-btn" href="network.html">선교 네트워크로</a></div></div>';return;}
  var aid=activeId(p.kind);if(aid)U.header(aid);
  document.title=p.title+' - '+U.S.site_name;
  var mine=!!myIds[p.id],mod=me&&me.can_moderate,imgs=p.images||[],st=p.prayer_status,done=prayed(p.id);
  var info='';
  if(p.kind==='event')info='<dl class="nw-info"><div><dt>일정</dt><dd>'+E(dayText(p.event_start))+(p.event_end&&p.event_end!==p.event_start?' ~ '+E(dayText(p.event_end)):'')+'</dd></div><div><dt>장소</dt><dd>'+(p.event_online?'온라인':'')+(p.event_online&&p.event_place?' · ':'')+E(p.event_place||'')+'</dd></div><div><dt>지역</dt><dd>'+where(p)+'</dd></div>'+(p.event_url?'<div class="full"><a class="nw-btn" href="'+E(p.event_url)+'" target="_blank" rel="noopener">신청·안내 페이지 열기 ↗</a></div>':'')+'</dl>';
  if(p.kind==='prayer')info='<div class="nw-prayer-box b-'+E(st)+'"><div><span class="nw-badge b-'+E(st)+'">'+E(PRAYER[st]||'')+'</span><b>'+Number(p.prayer_count||0)+'명</b>이 함께 기도하고 있습니다.</div>'+(st!=='answered'?'<button type="button" class="nw-btn pray'+(done?' on':'')+'" data-pray="'+p.id+'" aria-pressed="'+done+'">'+(done?'기도하고 있습니다':'함께 기도합니다')+' <b>'+Number(p.prayer_count||0)+'</b></button>':'')+'</div>'+(p.answer_note?'<div class="nw-answer"><h3>응답 소식</h3>'+paras(p.answer_note)+'</div>':'');
  app.innerHTML='<div class="wrap nw-narrow"><nav class="nw-crumb"><a href="network.html">'+E(ROOTNAME)+'</a><span>›</span><a href="network.html?tab='+p.kind+'">'+E(NAMES[p.kind])+'</a></nav>'+
   (p.status==='hidden'?'<div class="nw-alert">이 글은 지금 비공개 상태입니다. 작성자 본인만 볼 수 있습니다.</div>':'')+
   '<article class="nw-article"><p class="nw-kind">'+E(NAMES[p.kind])+'</p><h1>'+E(p.title)+'</h1>'+
   '<div class="nw-byline">'+who(p)+'<span class="nw-region">'+where(p)+'</span><span>'+fmt(p.created_at)+(p.updated_at&&fmt(p.updated_at)!==fmt(p.created_at)?' (수정 '+fmt(p.updated_at)+')':'')+'</span></div>'+
   info+(p.summary?'<p class="nw-lead">'+E(p.summary)+'</p>':'')+
   (imgs.length?'<div class="nw-gallery n'+imgs.length+'">'+imgs.map(function(u){return '<a href="'+E(u)+'" target="_blank" rel="noopener"><img src="'+E(u)+'" alt="" loading="lazy"></a>';}).join('')+'</div>':'')+
   '<div class="nw-text">'+paras(p.body)+'</div>'+
   '<section class="nw-share"><div><h2>후원자와 나누기</h2><p>아래 버튼으로 이 글의 주소를 복사해 카카오톡·문자·이메일로 보내세요.</p></div><div class="nw-acts"><button type="button" class="nw-btn" data-copy="'+p.id+'">링크 복사</button>'+(navigator.share?'<button type="button" class="nw-btn line" id="nw-share">공유하기</button>':'')+'</div></section>'+
   '<div class="nw-tools">'+(mine?'<a class="nw-btn line" href="network.html?edit='+p.id+'">수정</a><button type="button" class="nw-btn line" id="nw-vis">'+(p.status==='hidden'?'다시 공개':'비공개로 바꾸기')+'</button>':'')+
   (mod&&!mine?'<button type="button" class="nw-btn danger" id="nw-hide">운영자 숨김</button>':'')+
   (!mine?'<button type="button" class="nw-link" id="nw-report">신고하기</button>':'')+'<a class="nw-btn ghost" href="network.html?tab='+p.kind+'">목록으로</a></div></article>'+
   '<section id="nw-related"></section></div>';
  bindCards(app);
  var sh=document.getElementById('nw-share');if(sh)sh.onclick=function(){navigator.share({title:p.title,url:abs(p.id)}).catch(function(){});};
  var vis=document.getElementById('nw-vis');if(vis)vis.onclick=async function(){var hide=p.status!=='hidden';if(!confirm(hide?'이 글을 비공개로 바꿀까요? 목록과 주소에서 보이지 않게 됩니다. 언제든 다시 공개할 수 있습니다.':'이 글을 다시 공개할까요?'))return;try{await TN.net.visibility(p.id,hide);toast(hide?'비공개로 바꿨습니다.':'다시 공개했습니다.');setTimeout(function(){location.reload();},700);}catch(e){toast(msgOf(e),true);}};
  var hd=document.getElementById('nw-hide');if(hd)hd.onclick=async function(){var why=prompt('숨기는 이유를 적어 주세요. (작성자에게는 공개되지 않으며 운영 기록에 남습니다)','');if(why===null)return;try{await TN.net.moderate(p.id,'hide',why);toast('숨겼습니다. 관리자 화면에서 다시 공개할 수 있습니다.');setTimeout(function(){location.href='network.html';},900);}catch(e){toast(msgOf(e),true);}};
  var rp=document.getElementById('nw-report');if(rp)rp.onclick=async function(){if(!TN.user||!TN.user()){remember();toast('신고는 로그인한 회원만 할 수 있습니다.',true);setTimeout(function(){location.href='member.html?mode=login';},1200);return;}var why=prompt('신고 사유를 적어 주세요. (2~300자)','');if(why===null)return;try{await TN.net.report(p.id,why);toast('신고가 접수되었습니다. 운영자가 확인합니다.');}catch(e){toast(msgOf(e),true);}};
  try{var rel=(await TN.net.list({kind:p.kind,limit:3,exclude:p.id})).data||[];if(rel.length){var box=document.getElementById('nw-related');box.innerHTML='<h2 class="nw-sub">'+E(NAMES[p.kind])+' 더 보기</h2><div class="nw-grid">'+rel.map(card).join('')+'</div>';bindCards(box);}}catch(_){}
}

/* ---------- 글쓰기·사역자 정보 ---------- */
function needLogin(title){
  remember();
  app.innerHTML='<div class="wrap nw-narrow"><div class="nw-panel nw-center"><h1>'+E(title)+'</h1><p>선교 네트워크 글쓰기는 <b>회원가입하고 이메일 인증을 마친 목사·선교사</b>님이 할 수 있습니다.<br>로그인하면 이 화면으로 다시 돌아옵니다.</p><div class="nw-acts center"><a class="nw-btn big" href="member.html?mode=login">로그인</a><a class="nw-btn line big" href="member.html?mode=join">회원가입</a></div></div></div>';
}
function profileForm(np,after){
  np=np||{};
  var rg=Object.keys(REGIONS).map(function(k){return '<option value="'+k+'"'+(np.region===k?' selected':'')+'>'+E(REGIONS[k])+'</option>';}).join('');
  return '<form class="nw-panel nw-form" id="nw-profile" novalidate><h1>사역자 정보 '+(np.ministry_role?'수정':'등록')+'</h1><p class="nw-help">한 번만 등록하면 됩니다. 이 정보는 글 작성자 표시에 사용됩니다.</p>'+
   '<fieldset class="nw-choice"><legend>직분 <em>*</em></legend><label><input type="radio" name="role" value="missionary"'+(np.ministry_role!=='pastor'?' checked':'')+'><span><b>선교사</b><small>선교지에서 사역 중이거나 파송된 분</small></span></label><label><input type="radio" name="role" value="pastor"'+(np.ministry_role==='pastor'?' checked':'')+'><span><b>목사</b><small>교회·기관에서 사역하는 목회자</small></span></label></fieldset>'+
   '<div class="nw-row2"><div><label for="np-org">소속 교회·선교단체</label><input id="np-org" name="organization" maxlength="120" value="'+E(np.organization||'')+'" placeholder="예: OO선교회"></div><div><label for="np-region">활동 지역 <em>*</em></label><select id="np-region" name="region" required><option value="">선택해 주세요</option>'+rg+'</select></div></div>'+
   '<div><label for="np-country">국가 또는 도시</label><input id="np-country" name="country" maxlength="60" value="'+E(np.country||'')+'" placeholder="예: 캄보디아 프놈펜"></div>'+
   '<fieldset class="nw-choice"><legend>공개 수준 <em>*</em></legend><label><input type="radio" name="privacy" value="public"'+(np.privacy!=='protected'?' checked':'')+'><span><b>모두 공개</b><small>이름·소속·국가를 표시합니다.</small></span></label><label><input type="radio" name="privacy" value="protected"'+(np.privacy==='protected'?' checked':'')+'><span><b>보호 (보안 지역 권장)</b><small>이름은 첫 글자만(예: 김OO), 지역은 대륙만 표시하고 소속·국가는 숨깁니다.</small></span></label></fieldset>'+
   '<p class="nw-note">회원이 직접 선택한 정보입니다. 사실과 다르게 등록하거나 부적절한 글을 올리면 운영자가 글을 숨길 수 있습니다.</p>'+
   '<div class="nw-acts"><button class="nw-btn big">저장하고 '+(after?'글쓰기로':'돌아가기')+'</button></div><p class="nw-err" role="alert"></p></form>';
}
function bindProfile(after){
  var f=document.getElementById('nw-profile');
  f.onsubmit=async function(e){e.preventDefault();var err=f.querySelector('.nw-err');err.textContent='';
    var d={role:(f.querySelector('[name=role]:checked')||{}).value,organization:f.elements.organization.value.trim(),region:f.elements.region.value,country:f.elements.country.value.trim(),privacy:(f.querySelector('[name=privacy]:checked')||{}).value};
    if(!d.region){err.textContent='활동 지역을 선택해 주세요.';f.elements.region.focus();return;}
    var b=f.querySelector('button');b.disabled=true;
    try{await TN.net.saveProfile(d);toast('사역자 정보를 저장했습니다.');after();}catch(ex){err.textContent=msgOf(ex);b.disabled=false;}
  };
}
async function write(editId){
  if(!TN.user||!TN.user()){needLogin(editId?'글 수정':'선교 네트워크 글쓰기');return;}
  app.innerHTML='<div class="wrap nw-narrow"><p class="nw-loading">불러오는 중…</p></div>';
  try{await loadMe();}catch(_){}
  if(!me){needLogin('이메일 인증을 확인해 주세요');return;}
  if(!me.profile){app.innerHTML='<div class="wrap nw-narrow">'+profileForm(null,true)+'</div>';bindProfile(function(){location.reload();});return;}
  var p=editId?myIds[editId]:null;
  if(editId&&!p){app.innerHTML='<div class="wrap nw-narrow"><div class="nw-empty"><h2>본인이 쓴 글만 수정할 수 있습니다.</h2><a class="nw-btn" href="network.html?mine=1">내 글 관리</a></div></div>';return;}
  var kind=p?p.kind:(['news','prayer','event'].indexOf(q('tab'))>=0?q('tab'):'news');
  var aid=activeId(kind);if(aid)U.header(aid);
  var imgs=(p&&p.images||[]).slice();
  var np=me.profile;
  app.innerHTML='<div class="wrap nw-narrow"><nav class="nw-crumb"><a href="network.html">'+E(ROOTNAME)+'</a><span>›</span><span>'+(p?'글 수정':'글쓰기')+'</span></nav>'+
   '<form class="nw-panel nw-form" id="nw-write" novalidate><div class="nw-form-head"><h1>'+(p?'글 수정':'선교 네트워크 글쓰기')+'</h1><p class="nw-me">'+E(np.privacy==='protected'?(String(me.name||'').slice(0,1)+'OO'):me.name)+' '+E(ROLE[np.ministry_role])+' · '+E(REGIONS[np.region]||'')+' <a href="network.html?profile=1">정보 수정</a></p></div>'+
   '<fieldset class="nw-kinds"><legend>어디에 올릴까요? <em>*</em></legend>'+['news','prayer','event'].map(function(k){var d={news:'선교 보고와 현장 소식',prayer:'급히 함께 기도할 제목',event:'선교대회·집회·모임 안내'}[k];return '<label><input type="radio" name="kind" value="'+k+'"'+(k===kind?' checked':'')+'><span><b>'+E(NAMES[k])+'</b><small>'+d+'</small></span></label>';}).join('')+'</fieldset>'+
   '<div><label for="nw-title">제목 <em>*</em></label><input id="nw-title" name="title" maxlength="120" required value="'+E(p&&p.title||'')+'" placeholder="예: 우기 속에서도 이어진 어린이 성경학교"></div>'+
   '<div class="k-event"><div class="nw-row3"><div><label for="nw-es">시작일 <em>*</em></label><input id="nw-es" name="event_start" type="date" value="'+E(p&&p.event_start||'')+'"></div><div><label for="nw-ee">종료일</label><input id="nw-ee" name="event_end" type="date" value="'+E(p&&p.event_end||'')+'"></div><div><label for="nw-place">장소</label><input id="nw-place" name="event_place" maxlength="120" value="'+E(p&&p.event_place||'')+'" placeholder="예: 서울 OO교회"></div></div>'+
   '<label class="nw-check"><input type="checkbox" name="event_online"'+(p&&p.event_online?' checked':'')+'> 온라인으로 진행합니다</label><div><label for="nw-url">신청·안내 링크</label><input id="nw-url" name="event_url" type="url" maxlength="500" value="'+E(p&&p.event_url||'')+'" placeholder="https://"></div></div>'+
   '<div class="k-prayer"><div><label for="nw-ps">기도 상태</label><select id="nw-ps" name="prayer_status">'+Object.keys(PRAYER).map(function(k){return '<option value="'+k+'"'+((p&&p.prayer_status||'urgent')===k?' selected':'')+'>'+E(PRAYER[k])+'</option>';}).join('')+'</select></div>'+
   (p?'<div><label for="nw-ans">응답 소식 (기도가 응답되면 적어 주세요)</label><textarea id="nw-ans" name="answer_note" maxlength="2000" rows="4">'+E(p.answer_note||'')+'</textarea></div>':'')+'</div>'+
   '<div><label for="nw-sum">한 줄 요약</label><input id="nw-sum" name="summary" maxlength="300" value="'+E(p&&p.summary||'')+'" placeholder="목록에 보일 짧은 소개 (선택)"></div>'+
   '<div><label for="nw-body">내용 <em>*</em></label><textarea id="nw-body" name="body" maxlength="8000" rows="14" required placeholder="문단 사이는 한 줄을 띄워 주세요.">'+E(p&&p.body||'')+'</textarea><small class="nw-count" id="nw-count"></small></div>'+
   '<div><span class="nw-label">사진 (최대 3장)</span><div class="nw-photos" id="nw-photos"></div><input type="file" id="nw-file" accept="image/jpeg,image/png,image/webp" multiple hidden><button type="button" class="nw-btn line" id="nw-add">사진 추가</button><small class="nw-help">사진은 자동으로 줄여서 올립니다. 올린 사진은 공개 주소로 저장됩니다.</small></div>'+
   '<div class="nw-warn"><b>올리기 전에 확인해 주세요</b><ul><li>보안 지역의 실명·정확한 위치·현지인 얼굴 사진은 올리지 않습니다.</li><li>개인 연락처, 후원 계좌, 주민번호 같은 개인정보를 적지 않습니다.</li><li>글은 바로 공개되며, 부적절한 글은 운영자가 숨길 수 있습니다.</li></ul></div>'+
   '<div class="nw-acts"><button class="nw-btn gold big" id="nw-submit">'+(p?'수정 내용 저장':'바로 게시하기')+'</button><a class="nw-btn ghost big" href="'+(p?link(p.id):'network.html')+'">취소</a></div><p class="nw-err" role="alert"></p>'+(!p?'<p class="nw-help">오늘 작성 '+Number(me.today||0)+'/5건</p>':'')+'</form></div>';
  var f=document.getElementById('nw-write');
  function sync(){var k=(f.querySelector('[name=kind]:checked')||{}).value;f.querySelector('.k-event').hidden=k!=='event';f.querySelector('.k-prayer').hidden=k!=='prayer';}
  [].forEach.call(f.querySelectorAll('[name=kind]'),function(r){r.onchange=sync;});sync();
  var cnt=document.getElementById('nw-count');function count(){cnt.textContent=f.elements.body.value.length+' / 8000자';}f.elements.body.oninput=count;count();
  var box=document.getElementById('nw-photos'),fileIn=document.getElementById('nw-file'),add=document.getElementById('nw-add'),busy=false;
  function drawPhotos(){box.innerHTML=imgs.map(function(u,i){return '<figure><img src="'+E(u)+'" alt="첨부 사진 '+(i+1)+'"><button type="button" data-rm="'+i+'" aria-label="사진 '+(i+1)+' 빼기">빼기</button>'+(i===0?'<figcaption>대표 사진</figcaption>':'')+'</figure>';}).join('');add.hidden=imgs.length>=3;[].forEach.call(box.querySelectorAll('[data-rm]'),function(b){b.onclick=function(){imgs.splice(+b.dataset.rm,1);drawPhotos();};});}
  drawPhotos();
  add.onclick=function(){if(!busy)fileIn.click();};
  fileIn.onchange=async function(){var files=[].slice.call(fileIn.files);fileIn.value='';if(!files.length)return;busy=true;add.disabled=true;
    try{var room=3-imgs.length,todo=files.slice(0,room);if(files.length>room)toast('사진은 최대 3장까지 올릴 수 있습니다. 앞의 '+room+'장만 올립니다.');for(var i=0;i<todo.length;i++){add.textContent='사진 올리는 중… ('+(i+1)+'/'+todo.length+')';imgs.push(await TN.upload(todo[i],{maxBytes:350*1024}));drawPhotos();}}
    catch(e){toast(msgOf(e),true);}finally{busy=false;add.disabled=false;add.textContent='사진 추가';}};
  f.onsubmit=async function(e){e.preventDefault();var err=f.querySelector('.nw-err');err.textContent='';
    if(busy){err.textContent='사진을 올리는 중입니다. 잠시 기다려 주세요.';return;}
    var k=(f.querySelector('[name=kind]:checked')||{}).value,post={kind:k,title:f.elements.title.value.trim(),summary:f.elements.summary.value.trim(),body:f.elements.body.value.trim(),images:imgs};
    if(p)post.id=p.id;
    if(post.title.length<2){err.textContent='제목을 2자 이상 입력해 주세요.';f.elements.title.focus();return;}
    if(!post.body){err.textContent='내용을 입력해 주세요.';f.elements.body.focus();return;}
    if(k==='event'){post.event_start=f.elements.event_start.value;post.event_end=f.elements.event_end.value;post.event_place=f.elements.event_place.value.trim();post.event_online=f.elements.event_online.checked;post.event_url=f.elements.event_url.value.trim();
      if(!post.event_start){err.textContent='행사 시작일을 입력해 주세요.';f.elements.event_start.focus();return;}
      if(post.event_url&&!/^https?:\/\/\S+$/.test(post.event_url)){err.textContent='신청 링크는 http 또는 https로 시작해야 합니다.';f.elements.event_url.focus();return;}}
    if(k==='prayer'){post.prayer_status=f.elements.prayer_status.value;if(f.elements.answer_note)post.answer_note=f.elements.answer_note.value.trim();}
    var b=document.getElementById('nw-submit');b.disabled=true;b.textContent='저장하는 중…';
    try{var r=await TN.net.save(post);toast(p?'수정했습니다.':'게시했습니다.');setTimeout(function(){location.href=link(r.id);},500);}
    catch(ex){err.textContent=msgOf(ex);b.disabled=false;b.textContent=p?'수정 내용 저장':'바로 게시하기';}
  };
}
async function profile(){
  if(!TN.user||!TN.user()){needLogin('사역자 정보');return;}
  await loadMe();if(!me){needLogin('이메일 인증을 확인해 주세요');return;}
  app.innerHTML='<div class="wrap nw-narrow"><nav class="nw-crumb"><a href="network.html">'+E(ROOTNAME)+'</a><span>›</span><span>사역자 정보</span></nav>'+profileForm(me.profile,false)+'</div>';
  bindProfile(function(){location.href='network.html?mine=1';});
}
async function mine(){
  if(!TN.user||!TN.user()){needLogin('내 글 관리');return;}
  await loadMe();if(!me){needLogin('이메일 인증을 확인해 주세요');return;}
  var rows=Object.keys(myIds).map(function(k){return myIds[k];}).sort(function(a,b){return String(b.created_at).localeCompare(String(a.created_at));});
  var np=me.profile;
  app.innerHTML='<div class="wrap nw-narrow"><nav class="nw-crumb"><a href="network.html">'+E(ROOTNAME)+'</a><span>›</span><span>내 글 관리</span></nav><div class="nw-panel"><div class="nw-form-head"><h1>내 글 관리</h1>'+
   (np?'<p class="nw-me">'+E(ROLE[np.ministry_role])+' · '+E(REGIONS[np.region]||'')+' · 공개 수준: '+(np.privacy==='protected'?'보호':'모두 공개')+' <a href="network.html?profile=1">정보 수정</a></p>':'<p class="nw-me">사역자 정보가 아직 없습니다. <a href="network.html?profile=1">등록하기</a></p>')+'</div>'+
   (rows.length?'<ul class="nw-mine">'+rows.map(function(p){var hid=p.status==='hidden',byMod=hid&&p.hidden_reason!=='작성자 비공개';return '<li><div><span class="nw-badge '+(hid?'b-past':'b-ok')+'">'+(byMod?'운영자 숨김':hid?'비공개':'공개 중')+'</span> <small>'+E(NAMES[p.kind])+' · '+fmt(p.created_at)+'</small><a href="'+link(p.id)+'"><b>'+E(p.title)+'</b></a>'+(byMod?'<small class="nw-err">운영자가 숨긴 글입니다. 문의는 편집국으로 해 주세요.</small>':'')+'</div><div class="nw-acts"><a class="nw-btn line" href="network.html?edit='+p.id+'">수정</a>'+(byMod?'':'<button type="button" class="nw-btn ghost" data-vis="'+p.id+'" data-hid="'+(hid?1:0)+'">'+(hid?'다시 공개':'비공개')+'</button>')+'</div></li>';}).join('')+'</ul>':'<div class="nw-empty"><h2>아직 쓴 글이 없습니다.</h2></div>')+
   '<div class="nw-acts"><a class="nw-btn gold" href="network.html?write=1">새 글 쓰기</a></div></div></div>';
  [].forEach.call(app.querySelectorAll('[data-vis]'),function(b){b.onclick=async function(){var hide=b.dataset.hid!=='1';try{await TN.net.visibility(b.dataset.vis,hide);toast(hide?'비공개로 바꿨습니다.':'다시 공개했습니다.');setTimeout(function(){location.reload();},600);}catch(e){toast(msgOf(e),true);}};});
}

TNUI.boot(null,async function(ui){
  U=ui;app=document.getElementById('app');sections();if(ROOT)U.header(ROOT.id);
  if(!TN.net||!TN.net.ready()){app.innerHTML='<div class="wrap nw-narrow"><div class="nw-empty"><h2>운영 서버에 연결되지 않았습니다.</h2></div></div>';return;}
  var id=q('id'),edit=q('edit');
  if(id)return detail(id);
  if(q('write')==='1')return write(null);
  if(edit)return write(edit);
  if(q('profile')==='1')return profile();
  if(q('mine')==='1')return mine();
  return hub();
});
})();
