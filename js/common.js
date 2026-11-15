(function(){
var E = TN.esc;
var U = window.TNUI = {};
U.q = function(k){ return new URLSearchParams(location.search).get(k); };
U.netTab = function(s){
  if(!s) return null;
  var all=U.sections||[], par=all.filter(function(x){return x.id===s.parent_id;})[0];
  if(s.code==="mission-network") return "all";
  if(!par||par.code!=="mission-network") return null;
  if(s.code==="partner-events"||/행사|대회/.test(s.name||"")) return "event";
  if(/기도/.test(s.name||"")) return "prayer";
  return "news";
};
U.secUrl = function(s){
  var nt=U.netTab(s); if(nt) return "network.html"+(nt==="all"?"":"?tab="+nt);
  if(s.id===7001||s.id===7111)return "mall.html?view=mall";
  if(s.id===7112)return "mall.html?view=pension";
  if(s.kind==="board") return "board.html?b="+encodeURIComponent(s.code)+"&s="+s.id;
  if(s.kind==="page") return "page.html?slug="+encodeURIComponent(s.code);
  if(s.kind==="link"&&s.link_url) return TN.safeLink(s.link_url)||"#";
  return "list.html?s="+s.id;
};
U.artUrl = function(a){ return "article.html?id="+a.id; };
U.thumb = function(a,cls){
  if(a && a.image_url) return '<div class="thumb '+(cls||"")+'"><img src="'+E(a.image_url)+'" alt="" loading="lazy"></div>';
  return '<div class="thumb sk '+(cls||"")+'"></div>';
};
U.title = function(a){ return a ? E(a.title) : '<span class="sk-t">기사 제목이 들어갑니다</span>'; };
U.ad = function(slot,cls,w,h){
  var b = (U.banners||[]).filter(function(x){return x.slot===slot&&x.active!==false;})[0];
  var def = TN.BANNER_SLOTS.filter(function(x){return x.slot===slot;})[0];
  if(!b||!b.image_url) return "";
  var inner = '<img src="'+E(b.image_url)+'" alt="'+E(b.title||"광고")+'">';
  var h = '<div class="ad '+(cls||"")+'">'+inner+'</div>';
  return b&&TN.safeLink(b.link_url) ? '<a href="'+E(TN.safeLink(b.link_url))+'" target="_blank" rel="noopener" class="adlink">'+h+'</a>' : h;
};
U.pad = function(arr,n){ var o=arr.slice(0,n); while(o.length<n) o.push(null); return o; };

U.header = function(active){
  var S=U.S, secs=U.sections.filter(function(s){return s.visible!==false;});
  var top=secs.filter(function(s){return !s.parent_id;}).sort(function(a,b){return a.sort-b.sort;});
  var kids=function(id){return secs.filter(function(s){return s.parent_id===id;}).sort(function(a,b){return a.sort-b.sort;});};
  var activeTop = null;
  if(active){ var cur=secs.filter(function(s){return s.id==active;})[0]; if(cur) activeTop = cur.parent_id||cur.id; }
  var subOwner = activeTop || (top.filter(function(s){return kids(s.id).length;})[0]||{}).id;
  var d=new Date(), wk="일월화수목금토"[d.getDay()], p=function(n){return String(n).padStart(2,"0");};
  var date = "오늘: "+d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes())+" ("+wk+")";
  var logo = S.logo_url ? '<img src="'+E(S.logo_url)+'" alt="'+E(S.site_name)+'">' : '<b>'+E(S.site_name.replace(/ ?전자신문/,"")||S.site_name)+'</b><small>'+E(S.site_en)+'</small>';
  var h = '<div class="top"><div class="wrap"><div class="l"><a href="board.html?b=report&write=1">기사제보</a><a href="board.html?b=ad&write=1">광고문의</a><a href="member.html?mode=apply">기자단·선교사 신청</a><a href="editor.html">편집실</a><a href="organization.html">조직도</a></div>'+
    '<div class="r"><span>'+date+'</span><a href="member.html?mode=login" id="member-login-link">로그인</a><a href="member.html?mode=join" id="member-signup-link">회원가입</a></div></div></div>'+
    '<div class="logoarea"><div class="wrap"><div class="tb">'+U.ad("top_left")+'</div><a class="logo" href="index.html">'+logo+'</a></div></div>'+
    '<div class="gnb"><div class="wrap"><button class="ham" aria-label="전체메뉴"><i></i></button><ul class="m">'+
    top.map(function(s){return '<li><a href="'+E(U.secUrl(s))+'" data-id="'+s.id+'" class="'+(s.id===subOwner?"on":"")+'">'+E(s.name)+'</a></li>';}).join("")+'</ul>'+
    '<button class="sch" aria-label="검색"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#111" stroke-width="2"><circle cx="10.5" cy="10.5" r="7"/><path d="M16 16l5 5"/></svg></button>'+
    '<div class="allmenu">'+top.map(function(s){return '<div><h4><a href="'+E(U.secUrl(s))+'">'+E(s.name)+'</a></h4>'+kids(s.id).map(function(k){return '<a href="'+E(U.secUrl(k))+'">'+E(k.name)+'</a>';}).join("")+'</div>';}).join("")+'</div></div></div>'+
    '<div class="sbar"><div class="wrap"><form action="list.html"><input name="q" placeholder="검색어를 입력하세요" aria-label="검색어"><button>검색</button></form></div></div>'+
    '<div class="sub"><div class="wrap" id="subbar"></div></div>';
  document.getElementById("hdr").innerHTML = h;
  if(TN.member)TN.member.current().then(function(user){if(!user)return;var login=document.getElementById("member-login-link"),join=document.getElementById("member-signup-link");if(login){login.href="member.html?mode=account";login.textContent="마이페이지";}if(join){join.href="member.html?mode=write";join.textContent="글쓰기";}}).catch(function(){});
  function drawSub(id){
    document.getElementById("subbar").innerHTML = kids(id).map(function(k){return '<a href="'+E(U.secUrl(k))+'" class="'+(k.id==active?"on":"")+'">'+E(k.name)+'</a>';}).join("");
    [].forEach.call(document.querySelectorAll(".gnb ul.m a"),function(a){a.classList.toggle("on",a.dataset.id==id);});
  }
  drawSub(subOwner);
  [].forEach.call(document.querySelectorAll(".gnb ul.m a"),function(a){ a.addEventListener("mouseenter",function(){ drawSub(+a.dataset.id); }); a.addEventListener("focus",function(){ drawSub(+a.dataset.id); }); });
  document.querySelector(".ham").onclick=function(){ document.querySelector(".allmenu").classList.toggle("open"); };
  document.querySelector(".sch").onclick=function(){ var b=document.querySelector(".sbar"); b.classList.toggle("open"); if(b.classList.contains("open")) b.querySelector("input").focus(); };
  document.addEventListener("click",function(e){ if(!e.target.closest(".gnb")) document.querySelector(".allmenu").classList.remove("open"); });
};
U.footer = function(){
  var S=U.S;
  var links=[["매체소개","about"],["조직도","@organization"],["관리자 사용법","@guide"],["기사제보","@report"],["광고문의","@ad"],["기자단·선교사 신청","@member"],["이용약관","terms"],["개인정보처리방침","privacy","pp"],["청소년보호정책","youth"],["저작권보호정책","copyright"],["이메일무단수집거부","email"]];
  var logo = S.logo_url ? '<img src="'+E(S.logo_url)+'" alt="">' : '<b>'+E(S.site_name.replace(/ ?전자신문/,"")||S.site_name)+'</b><small>'+E(S.site_en)+'</small>';
  document.getElementById("ftr").innerHTML = '<div class="ft"><div class="wrap"><a class="logo" href="index.html">'+logo+'</a><div><nav>'+
    links.map(function(l){ var href = l[1]==="@organization" ? "organization.html" : l[1]==="@guide" ? "guide.html" : l[1]==="@member" ? "member.html?mode=apply" : l[1].charAt(0)==="@" ? "board.html?b="+l[1].slice(1)+"&write=1" : "page.html?slug="+l[1]; return '<a class="'+(l[2]||"")+'" href="'+href+'">'+l[0]+'</a>'; }).join("")+'</nav>'+
    '<p><span>주소: '+E(S.address)+'</span><span>대표전화: '+E(S.phone)+'</span><span>청소년보호책임자: '+E(S.youth_officer)+'</span><br><span>제호: '+E(S.reg_title)+'</span><span>등록번호: '+E(S.reg_no)+'</span><span>등록일: '+E(S.reg_date)+'</span><span>발행인: '+E(S.publisher)+'</span><span>편집인: '+E(S.editor_in_chief||"[편집인 입력]")+'</span></p>'+
    '<p>'+E(S.copyright)+'</p></div></div></div><button class="totop" aria-label="맨 위로">&#8593;</button>';
  document.querySelector(".totop").onclick=function(){window.scrollTo({top:0,behavior:"smooth"});};
};
U.demoBar = function(){
  if(!TN.demo&&window.TN_CONFIG?.SITE_STAGE!=="preview") return;
  var b=document.createElement("div");
  b.style.cssText="background:#fff7e6;border-bottom:1px solid #ffd591;font-size:13px;text-align:center;padding:6px 10px;color:#7a4b00";
  b.innerHTML=TN.demo?'데모 모드: 데이터가 이 브라우저에만 저장됩니다. <a href="admin.html">관리자</a>':'운영 준비 사이트: 기존 예시 기사가 포함되어 있습니다. 편집실은 공동 서버에 연결됩니다. <a href="editor.html">편집실</a> · <a href="guide.html">사용법</a>'; 
  document.body.insertBefore(b,document.body.firstChild);
};
U.sidebar = async function(opts){
  opts=opts||{};
  var pop = (await TN.published({}, {order:"views.desc",limit:10})).data||[];
  var lat = (await TN.published({}, {order:"published_at.desc",limit:10})).data||[];
  function rank(list,img){
    var l=U.pad(list,img?5:10);
    return '<ul class="rank '+(img?"rankimg":"")+'">'+l.map(function(a,i){
      return '<li><b>'+(i+1)+'</b><a href="'+(a?U.artUrl(a):"#")+'">'+U.title(a)+'</a>'+(img?'<div class="th">'+U.thumb(a)+'</div>':'')+'</li>';
    }).join("")+'</ul>';
  }
  var photoSec = U.sections.filter(function(s){return s.kind==="photo";})[0];
  var ph = photoSec ? (await TN.published({section_id:"eq."+photoSec.id},{limit:1})).data[0] : null;
  var html = '<aside class="side">'+(opts.noBanner?"":U.ad("side_1","sq"))+
    '<h3 class="bhead">많이 본 뉴스</h3>'+rank(pop,true)+
    '<h3 class="bhead">포토스케치</h3><a href="'+(ph?U.artUrl(ph):"#")+'">'+U.thumb(ph)+'<p style="margin:10px 0 28px;font-weight:600">'+U.title(ph)+'</p></a>'+
    U.ad("side_2","tall");
  for(var i=1;i<=3;i++){
    var sid=U.S["side_box_"+i], sec=U.sections.filter(function(s){return String(s.id)===String(sid);})[0] || U.sections.filter(function(s){return [1112,2111,2114][i-1]===s.id;})[0];
    var a = sec ? (await TN.published({section_id:"in.("+[sec.id].concat(U.sections.filter(function(s){return s.parent_id===sec.id;}).map(function(s){return s.id;})).join(",")+")"},{limit:1})).data[0] : null;
    html += '<div class="sbox"><h3 class="bhead">'+E(sec?sec.name:"코너 "+i)+'</h3><a class="mini" href="'+(a?U.artUrl(a):"#")+'"><div style="flex:1"><h5>'+U.title(a)+'</h5><p>'+(a?E(a.summary||""):'<span class="sk-t">요약이 들어갑니다</span>')+'</p></div><div class="th">'+U.thumb(a)+'</div></a></div>';
  }
  return html+'</aside>';
};
U.boot = async function(active, fn){
  U.demoBar();
  try{
    var r = await Promise.all([TN.settings(),TN.sections(),TN.list("banners",{})]);
    U.S=r[0]; U.sections=r[1]; U.banners=r[2].data||[];
  }catch(e){
    document.body.innerHTML='<p style="padding:40px;text-align:center">서버에 연결하지 못했습니다. 설정(js/config.js)과 DB 스키마를 확인하세요.<br><small>'+E(e.message)+'</small></p>'; return;
  }
  document.title = U.S.site_name;
  var sk = document.createElement("div"); sk.className="skywrap";
  if(!document.getElementById("hdr")){ var hh=document.createElement("div"); hh.id="hdr"; document.body.appendChild(hh); }
  U.header(active);
  await fn(U);
  U.footer();
  var w=document.getElementById("app");
  if(w){
    var scope=(U.S&&U.S.sky_banner_scope)||"home", isHome=document.body.getAttribute("data-page")==="home", closed=false;
    try{ closed=sessionStorage.getItem("tn_sky_closed")==="1"; }catch(_){}
    var showSky=!closed&&scope!=="off"&&(scope==="all"||isHome);
    var sl=showSky?U.ad("sky_left"):"", sr=showSky?U.ad("sky_right"):"";
    var x='<button type="button" class="skyx" aria-label="양쪽 세로 배너 닫기" title="닫기">&times;</button>';
    var sky=document.createElement("div"); sky.className="skywrap";
    sky.innerHTML=(sl?'<div class="skyL">'+x+sl+'</div>':'')+(sr?'<div class="skyR">'+x+sr+'</div>':'');
    w.parentNode.insertBefore(sky,w); sky.appendChild(w);
    [].forEach.call(sky.querySelectorAll(".skyx"),function(b){ b.onclick=function(e){ e.preventDefault(); try{sessionStorage.setItem("tn_sky_closed","1");}catch(_){} [].forEach.call(sky.querySelectorAll(".skyL,.skyR"),function(n){n.remove();}); }; });
  }
};
})();
