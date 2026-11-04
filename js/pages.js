(function(){
var E=TN.esc, P=document.body.dataset.page;
function ids(sec,secs){ var o=[sec.id]; secs.forEach(function(s){ if(s.parent_id===sec.id) o.push(s.id); }); return o; }
function secByCode(U,c){ return U.sections.filter(function(s){return s.code===c;})[0]; }
function secSetting(U,key,fallbackCode){ var v=U.S[key]; return U.sections.filter(function(s){return String(s.id)===String(v);})[0] || secByCode(U,fallbackCode); }
function clean(html){
  var d=new DOMParser().parseFromString(html||"","text/html");
  d.querySelectorAll("script,object,embed,style,link,meta,base,form,input,button,textarea,select,option,svg,math,template").forEach(function(n){n.remove();});
  d.body.querySelectorAll("*").forEach(function(n){
    if(n.tagName==="IFRAME"){
      var u;try{u=new URL(n.getAttribute("src")||"",location.href);}catch(e){};
      if(!u||u.protocol!=="https:"||["www.youtube.com","youtube.com","www.youtube-nocookie.com"].indexOf(u.hostname)<0||!/^\/embed\/[A-Za-z0-9_-]+$/.test(u.pathname)){n.remove();return;}
      Array.from(n.attributes).forEach(function(a){n.removeAttribute(a.name);});n.src=u.href;n.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");n.setAttribute("allow","encrypted-media; picture-in-picture; fullscreen");n.setAttribute("loading","lazy");n.setAttribute("title","YouTube 영상");return;
    }
    Array.from(n.attributes).forEach(function(a){
      if(["href","src","alt","title","target","rel","colspan","rowspan","width","height","loading"].indexOf(a.name)<0){n.removeAttribute(a.name);return;}
      if(a.name==="href"||a.name==="src"){var safe=false;try{var u=new URL(a.value,location.href);safe=u.protocol==="https:"||u.protocol==="http:";}catch(e){}if(a.name==="src"&&n.tagName==="IMG"&&/^data:image\/(jpeg|png|webp|gif);base64,/i.test(a.value))safe=true;if(!safe)n.removeAttribute(a.name);}
      if(a.name==="target"&&a.value!=="_blank")n.removeAttribute(a.name);
    });if(n.tagName==="A")n.setAttribute("rel","noopener noreferrer");
  });
  return d.body.innerHTML;
}
function item(U,a){ return '<a class="li" href="'+(a?U.artUrl(a):"#")+'"><div class="thumb'+(a&&a.image_url?"":" sk")+'" style="flex:0 0 120px;aspect-ratio:3/2">'+(a&&a.image_url?'<img src="'+E(a.image_url)+'" alt="" loading="lazy">':"")+'</div><h4>'+U.title(a)+'</h4></a>'; }

function mediaAction(a,kind){
  if(!a.video_url || !/^https?:\/\//i.test(a.video_url))return kind==='archive'?'<span class="media-pending">PDF / 이북 등록 대기</span>':'';
  var isPdf=/\.pdf(?:[?#]|$)/i.test(a.video_url), isSource=/harvest-k-university\.com\/bbs\/board\.php/i.test(a.video_url);
  return '<a class="btn line" href="'+E(a.video_url)+'" target="_blank" rel="noopener">'+(isPdf?'PDF 보기':isSource?'원문 발행호 보기':kind==='archive'?'이북 보기':'영상 보기')+' ↗</a>';
}
function bindCopy(U){
  [].forEach.call(document.querySelectorAll('[data-copy]'),function(b){ b.onclick=async function(){
    var url=new URL('article.html',location.href);url.searchParams.set('id',b.dataset.copy);
    var msg=b.parentElement.querySelector('.share-status');
    try{
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(url.href);
      else { var t=document.createElement('textarea');t.value=url.href;t.setAttribute('readonly','');t.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';document.body.appendChild(t);t.select();var ok=document.execCommand('copy');t.remove();if(!ok)throw Error('copy'); }
      if(msg)msg.textContent='복사했습니다. 후원자에게 붙여넣어 보내세요.';
    }catch(e){if(msg){msg.textContent='아래 주소를 길게 눌러 복사하세요: ';var f=document.createElement('input');f.readOnly=true;f.value=url.href;msg.appendChild(f);f.select();}}
  }; });
}

/* ---------------- 홈 ---------------- */
async function home(U){
  var all=(await TN.published({}, {limit:60})).data||[];
  var used={};
  function take(pred,n){ var o=[]; all.forEach(function(a){ if(o.length<n&&!used[a.id]&&pred(a)){o.push(a);used[a.id]=1;} }); return o; }
  var head=take(function(a){return a.is_headline;},1); if(!head.length) head=take(function(){return true;},1);
  var top3=take(function(a){return a.is_top;},3); if(top3.length<3) top3=top3.concat(take(function(){return true;},3-top3.length));
  var l1=take(function(){return true;},10), l2=take(function(){return true;},10);
  var h=head[0];
  var pop=(await TN.published({}, {order:"views.desc",limit:10})).data||[];
  var lat=all.slice(0,10);
  function rankList(list){ var l=U.pad(list,10); return '<ul class="rank">'+l.map(function(a,i){return '<li><b>'+(i+1)+'</b><a href="'+(a?U.artUrl(a):"#")+'">'+U.title(a)+'</a></li>';}).join("")+'</ul>'; }
  var boxes="";
  for(var i=1;i<=3;i++){
    var sec=secSetting(U,"side_box_"+i,["lectures","cover-story","archive"][i-1]);
    var a=sec?((await TN.published({section_id:"in.("+ids(sec,U.sections).join(",")+")"},{limit:1})).data||[])[0]:null;
    boxes+='<div class="sbox"><h3 class="bhead">'+E(sec?sec.name:"코너 "+i)+'</h3><a class="mini" href="'+(a?U.artUrl(a):"#")+'"><div style="flex:1"><h5>'+U.title(a)+'</h5><p>'+(a?E(a.summary||""):'<span class="sk-t">요약이 들어갑니다</span>')+'</p></div><div class="th">'+U.thumb(a)+'</div></a></div>';
  }
  var blocks="";
  for(var j=1;j<=3;j++){
    var bs=secSetting(U,"home_block_"+j,["columns","mission-network","photo-sketch"][j-1]);
    var list=bs?((await TN.published({section_id:"in.("+ids(bs,U.sections).join(",")+")"},{limit:3})).data||[]):[];
    var body;
    if(j===3){ var v=list[0]; body='<a class="vid" href="'+(v?U.artUrl(v):"#")+'">'+U.thumb(v)+(bs&&bs.kind==="video"?'<span class="play"></span>':'')+'<h4>'+U.title(v)+'</h4><small>'+E(bs?bs.name:"")+'</small></a>'; }
    else body=list.length?list.map(function(a){return '<a class="it" href="'+U.artUrl(a)+'"><h4>'+U.title(a)+'</h4>'+U.thumb(a)+'</a>';}).join(""):'<p class="muted empty-state">콘텐츠 등록을 준비하고 있습니다.</p>';
    blocks+='<div class="b"><h3>'+E(bs?bs.name:"섹션 "+j)+'</h3>'+body+'</div>';
  }
  var focusSec=secSetting(U,"focus_section","magazine");
  var foc=focusSec?(await TN.published({section_id:"in.("+ids(focusSec,U.sections).join(",")+")"},{limit:3})).data||[]:[];
  var fl=U.pad(foc,3);
  document.getElementById("app").innerHTML=
   '<section class="hero"><div class="wrap"><div><h1>'+U.title(h)+'</h1><p>'+(h?E(h.summary||""):'<span class="sk-t">기사 요약문이 들어갑니다. 관리자에서 기사를 발행하고 "헤드라인"으로 지정하면 이 자리에 표시됩니다.</span>')+'</p></div><a href="'+(h?U.artUrl(h):"#")+'">'+U.thumb(h)+'</a></div></section>'+
   '<div class="wrap"><div class="cards3">'+U.pad(top3,3).map(function(a){return '<a href="'+(a?U.artUrl(a):"#")+'">'+U.thumb(a)+'<h3>'+U.title(a)+'</h3></a>';}).join("")+'</div>'+
   '<div class="cols"><main><div class="lst2">'+U.pad(l1,10).map(function(a){return item(U,a);}).join("")+'</div>'+
   '<div class="adpair">'+U.ad("pair_1")+U.ad("pair_2")+'</div>'+
   '<div class="lst2">'+U.pad(l2,10).map(function(a){return item(U,a);}).join("")+'</div></main>'+
   '<aside class="side">'+U.ad("side_1","sq")+'<div class="tabs"><button class="on" data-t="pop">조회순</button><button data-t="lat">최신순</button></div><div id="rk">'+rankList(pop)+'</div>'+boxes+'</aside></div>'+
   '<div class="focus">'+fl.map(function(a){return '<a class="it" href="'+(a?U.artUrl(a):"#")+'">'+U.thumb(a)+'<h4>'+U.title(a)+'</h4></a>';}).join("")+'<div>'+U.ad("focus_side")+'</div></div>'+
   '<div class="blocks3">'+blocks+'</div></div>';
  var tabs=document.querySelectorAll(".tabs button");
  [].forEach.call(tabs,function(b){ b.onclick=function(){ [].forEach.call(tabs,function(x){x.classList.toggle("on",x===b);}); document.getElementById("rk").innerHTML=rankList(b.dataset.t==="pop"?pop:lat); }; });
}

/* ---------------- 목록/검색 ---------------- */
async function list(U){
  var sid=U.q("s"), q=U.q("q"), pg=parseInt(U.q("p")||"1",10), sec=sid?U.sections.filter(function(s){return String(s.id)===sid;})[0]:null;
  var isArchive=sec&&sec.code==="archive", isNetwork=sec&&(sec.code==="mission-updates"||sec.code==="mission-network");
  var children=sec?U.sections.filter(function(s){return s.parent_id===sec.id&&s.visible!==false;}):[];
  var view=isArchive?"grid":(localStorage.getItem("tn_view")||(sec&&sec.kind==="photo"?"grid":"sm"));
  var size=view==="grid"?12:10, f={};
  if(sec) f.section_id="in.("+ids(sec,U.sections).join(",")+")";
  if(q) f.q=q;
  var r=await TN.published(f,{limit:size,offset:(pg-1)*size});
  var rows=r.data||[], total=r.count==null?rows.length:r.count, pages=Math.max(1,Math.ceil(total/size));
  var name=q?'"'+E(q)+'" 검색결과':E(sec?sec.name:"전체기사");
  var secName=function(a){var s=U.sections.filter(function(x){return x.id===a.section_id;})[0];return s?s.name:"";};
  var body = rows.length ? rows.map(function(a){
    if(isArchive) return '<article class="archive-card">'+U.thumb(a)+'<div><span class="eyebrow">발행호 아카이브</span><h2>'+E(a.title)+'</h2><p>'+E(a.subtitle||'')+'</p><a class="btn" href="'+U.artUrl(a)+'">발행호 안내</a> '+mediaAction(a,'archive')+'</div></article>';
    var item='<a class="row" href="'+U.artUrl(a)+'">'+U.thumb(a)+'<div style="flex:1;min-width:0"><h2>'+E(a.title)+'</h2><p>'+E(a.summary||'')+'</p><div class="meta"><span>'+E(secName(a))+'</span><span>'+E(a.author||'')+'</span><span>'+TN.fmt(a.published_at)+'</span></div></div></a>';
    return isNetwork&&a.section_id===3111?'<article class="network-card">'+item+'<button class="btn copy-support" data-copy="'+a.id+'" data-title="'+E(a.title)+'">후원자용 링크 복사</button><span class="share-status" role="status"></span></article>':item;
  }).join("") : '<div class="empty-state"><h2>등록된 콘텐츠가 없습니다.</h2><p>'+E(sec&&sec.code==='appointed-reporters'?'임명된 독자 기자단의 기고는 관리자 검토·발행 후 이곳에 표시됩니다.':isNetwork?'파송선교사 소식과 협력 행사 소식은 편집국 확인 후 게시합니다.':'관리자가 콘텐츠를 등록하면 이곳에 표시됩니다.')+'</p></div>';
  function pageUrl(n){ var u=new URLSearchParams(location.search); u.set("p",n); return "list.html?"+u.toString(); }
  var from=Math.max(1,pg-4), to=Math.min(pages,from+9), pager="";
  if(pg>1) pager+='<a href="'+pageUrl(pg-1)+'">&lsaquo;</a>';
  for(var i=from;i<=to;i++) pager+= i===pg?'<span class="on">'+i+'</span>':'<a href="'+pageUrl(i)+'">'+i+'</a>';
  if(pg<pages) pager+='<a href="'+pageUrl(pg+1)+'">&rsaquo;</a>';
  document.title=(q||sec&&sec.name||"기사목록")+" - "+U.S.site_name;
  document.getElementById("app").innerHTML='<div class="wrap"><div class="cols"><main><div class="ph-head"><h1>'+name+'</h1><small>총 <b>'+total+'</b>건의 기사가 있습니다.</small><div class="views"><button data-v="list" title="제목형">&#9776;</button><button data-v="sm" title="요약형">&#9638;</button><button data-v="grid" title="갤러리형">&#9707;</button></div></div><div class="'+(view==="grid"?"grid3":view==="list"?"compact":"")+'">'+body+'</div><div class="pager">'+pager+'</div></main>'+(await U.sidebar())+'</div></div>';
  var intro='';
  if(children.length)intro+='<nav class="section-chips" aria-label="하위 카테고리">'+children.map(function(s){return '<a href="'+E(U.secUrl(s))+'">'+E(s.name)+'</a>';}).join('')+'</nav>';
  if(isNetwork)intro+='<div class="section-note"><strong>선교의 소식을 후원자에게 전하세요</strong><p>파송선교사 현장 소식의 링크를 복사해 카카오톡·문자·이메일로 나누세요. 개인 정보와 사역지 보안은 편집국에서 확인 후 발행합니다. 관리자에게 승인받은 선교사만 글을 작성할 수 있습니다.</p><p><a class="btn" href="member.html?mode=apply&amp;kind=missionary">선교사 신청</a> <a class="btn" href="member.html?mode=write">선교소식 작성</a></p></div>';
  if(sec&&sec.id===5111)intro+='<div class="section-note"><strong>하베스트 독자 기자단</strong><p>기자단을 신청하고 관리자의 승인을 받은 뒤 기고할 수 있습니다. 작성한 글은 편집국 검토 후 발행됩니다.</p><a class="btn" href="member.html?mode=apply&amp;kind=reporter">기자단 신청</a> <a class="btn" href="member.html?mode=write">기고 작성</a></div>';
  if(isArchive)intro+='<div class="section-note"><strong>역대 발행호 아카이브</strong><p>PDF 파일 또는 이북 주소를 등록하면 보기 버튼이 표시됩니다. 현재 예시는 하베스트대학교 원문 발행호 페이지로 연결됩니다.</p></div>';
  document.querySelector('.ph-head').insertAdjacentHTML('afterend',intro);
  if(isArchive)document.querySelector('.views').hidden=true;
  bindCopy(U);
  [].forEach.call(document.querySelectorAll(".views button"),function(b){ b.classList.toggle("on",b.dataset.v===view); b.onclick=function(){localStorage.setItem("tn_view",b.dataset.v);location.reload();}; });
}

/* ---------------- 기사 ---------------- */
async function article(U){
  var id=U.q("id"), a=id?await TN.get("articles","id",id):null;
  if(a&&a.status!=="published"&&!await TN.isAdmin())a=null;
  if(!a){ document.getElementById("app").innerHTML='<div class="wrap" style="padding:80px 0;text-align:center"><h2>기사를 찾을 수 없습니다.</h2><p><a class="btn" href="index.html">홈으로</a></p></div>'; return; }
  var sec=U.sections.filter(function(s){return s.id===a.section_id;})[0];
  var rel=(await TN.published({section_id:"eq."+a.section_id,id:"neq."+a.id},{limit:5})).data||[];
  document.title=a.title+" - "+U.S.site_name;
  var sk="art-"+a.id; if(!sessionStorage.getItem(sk)&&a.status==="published"){ sessionStorage.setItem(sk,"1"); TN.bump(a.id); }
  document.getElementById("app").innerHTML='<div class="wrap"><div class="cols"><main class="art">'+
   (a.status!=="published"?'<div class="notice">미리보기: 아직 발행되지 않은 기사입니다. (관리자만 볼 수 있습니다)</div>':"")+
   '<p class="art-sec">'+E(sec?sec.name:"")+'</p><h1>'+E(a.title)+'</h1>'+(a.subtitle?'<p class="subt">'+E(a.subtitle)+'</p>':"")+
   '<div class="by"><b>'+E(a.author||"편집국")+'</b><span>입력 '+TN.fmt(a.published_at||a.created_at,true)+'</span><span>조회수 '+(a.views||0)+'</span></div>'+
   (sec&&sec.code==='mission-updates'?'<section class="support-share"><h2>후원자에게 현장 소식을 전하세요</h2><p>링크 하나로 기도와 후원의 소식을 나눌 수 있습니다.</p><button class="btn copy-support" data-copy="'+a.id+'" data-title="'+E(a.title)+'">후원자용 링크 복사</button><span class="share-status" role="status"></span></section>':'')+
   (a.video_url?'<div class="media-access">'+mediaAction(a,sec&&sec.code==='archive'?'archive':'video')+'</div>':'')+
   '<div class="body"><div class="tools"><button data-a="font">가</button><button data-a="mark">&#9873;</button><button data-a="print">&#9112;</button><button data-a="share">&#8644;</button></div>'+
   (a.image_url?'<figure style="margin:0 0 24px"><img src="'+E(a.image_url)+'" alt=""></figure>':"")+
   '<div class="txt" id="txt">'+clean(a.body)+'</div></div>'+
   '<div class="rel"><h3>관련기사</h3>'+(rel.length?rel.map(function(r){return '<a class="li" href="'+U.artUrl(r)+'"><h4>'+E(r.title)+'</h4></a>';}).join(""):'<p class="sk-t">같은 섹션의 다른 기사가 여기에 표시됩니다.</p>')+'</div>'+
   '<div class="cmt">댓글 기능은 준비 중입니다.</div></main>'+(await U.sidebar())+'</div></div>';
  bindCopy(U);
  var fs=18;
  [].forEach.call(document.querySelectorAll(".tools button"),function(b){ b.onclick=function(){
    if(b.dataset.a==="font"){ fs=fs>=24?16:fs+2; document.getElementById("txt").style.fontSize=fs+"px"; }
    if(b.dataset.a==="print") window.print();
    if(b.dataset.a==="mark"){ localStorage.setItem("tn_mark_"+a.id,"1"); alert("북마크에 저장했습니다. (이 브라우저)"); }
    if(b.dataset.a==="share"){ (navigator.clipboard?navigator.clipboard.writeText(location.href):Promise.reject()).then(function(){alert("주소를 복사했습니다.");},function(){prompt("주소를 복사하세요",location.href);}); }
  };});
}

/* ---------------- 게시판/제보/문의 ---------------- */
var BOARDS={free:{t:"자유게시판",pub:true},reporter:{t:"독자기자",pub:true},report:{t:"기사제보",pub:false},ad:{t:"광고문의",pub:false}};
async function board(U){
  var b=U.q("b")||"free"; if(!Object.prototype.hasOwnProperty.call(BOARDS,b))b="free"; var cfg=BOARDS[b];
  var id=U.q("id"), write=U.q("write")==="1"||!cfg.pub, pg=parseInt(U.q("p")||"1",10), size=15;
  var app=document.getElementById("app");
  function shell(inner){ app.innerHTML='<div class="wrap"><div class="cols"><main><div class="ph-head"><h1>'+E(cfg.t)+'</h1></div>'+inner+'</main><aside class="side">'+U.ad("side_1","sq")+U.ad("side_2","tall")+'</aside></div></div>'; }
  if(id){
    var p=await TN.get("posts","id",id);
    if(!p||p.board!==b||((!cfg.pub||p.status==="hidden")&&!await TN.isAdmin())){ shell('<p style="padding:60px 0;text-align:center">글을 찾을 수 없습니다.</p>'); return; }
    shell('<div style="padding:24px 0;border-bottom:1px solid var(--line)"><h2 style="margin:0 0 10px">'+E(p.title)+'</h2><div class="meta"><span>'+E(p.author||"")+'</span><span>'+TN.fmt(p.created_at,true)+'</span></div></div><div class="page-body" style="padding:28px 0">'+E(p.body)+'</div><a class="btn line" href="board.html?b='+b+'">목록</a>');
    return;
  }
  if(write){
    var hint = cfg.pub ? "" : '<div class="notice">접수된 내용은 편집국에서만 확인할 수 있습니다.</div>';
    shell(hint+'<form class="form" id="f"><label>제목</label><input name="title" required maxlength="120"><label>작성자</label><input name="author" required maxlength="40"><label>연락처(이메일 또는 전화)</label><input name="contact" maxlength="80" '+(cfg.pub?"":"required")+'><label>내용</label><textarea name="body" required maxlength="5000"></textarea><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><p style="margin-top:20px"><button class="btn">등록</button> '+(cfg.pub?'<a class="btn line" href="board.html?b='+b+'">목록</a>':"")+'</p><p id="msg" style="color:#d62828"></p></form>');
    document.getElementById("f").onsubmit=async function(e){
      e.preventDefault(); var fd=new FormData(e.target); if(fd.get("website")) return;
      try{ await TN.addPost({board:b,title:fd.get("title"),author:fd.get("author"),contact:fd.get("contact")||null,body:fd.get("body")}); app.querySelector("main").innerHTML='<div class="ph-head"><h1>'+E(cfg.t)+'</h1></div><p style="padding:60px 0;text-align:center">접수되었습니다. 감사합니다.</p><p style="text-align:center"><a class="btn" href="index.html">홈으로</a></p>'; }
      catch(err){ document.getElementById("msg").textContent="등록하지 못했습니다: "+err.message; }
    };
    return;
  }
  var r=await TN.list("posts",{filters:{board:"eq."+b,status:"neq.hidden"},order:"created_at.desc",limit:size,offset:(pg-1)*size});
  var rows=r.data||[], total=r.count==null?rows.length:r.count, pages=Math.max(1,Math.ceil(total/size));
  var pager=""; for(var i=1;i<=pages&&i<=10;i++) pager+= i===pg?'<span class="on">'+i+'</span>':'<a href="board.html?b='+b+'&p='+i+'">'+i+'</a>';
  shell('<table class="tbl"><thead><tr><th style="width:70px">번호</th><th>제목</th><th style="width:110px">글쓴이</th><th style="width:140px">날짜</th></tr></thead><tbody>'+
    (rows.length?rows.map(function(p,i){return '<tr><td>'+(total-(pg-1)*size-i)+'</td><td class="t"><a href="board.html?b='+b+'&id='+p.id+'">'+E(p.title)+'</a></td><td>'+E(p.author||"")+'</td><td>'+TN.fmt(p.created_at,true).slice(0,10)+'</td></tr>';}).join(""):'<tr><td colspan="4" class="sk-t" style="padding:50px">등록된 글이 없습니다.</td></tr>')+
    '</tbody></table><p style="text-align:right;margin-top:16px"><a class="btn" href="board.html?b='+b+'&write=1">글쓰기</a></p><div class="pager">'+pager+'</div>');
}

/* ---------------- 고정 페이지 ---------------- */
async function page(U){
  var slug=U.q("slug")||"about"; if(slug==="join"){location.replace("member.html?mode=join");return;} var p=await TN.get("pages","slug",slug);
  document.title=(p?p.title:"")+" - "+U.S.site_name;
  document.getElementById("app").innerHTML='<div class="wrap narrow"><div class="ph-head"><h1>'+E(p?p.title:"페이지를 찾을 수 없습니다")+'</h1></div><div class="page-body" style="padding:28px 0">'+E(p?p.body:"").replace(/https?:\/\/[^\s<>]+/g,function(u){return '<a href="'+u+'" target="_blank" rel="noopener">'+u+'</a>';})+'</div></div>';
}

var MAP={home:home,list:list,article:article,board:board,page:page};
var active = null;
TNUI.boot(null,async function(U){
  var sid=P==='list'?U.q('s'):P==='board'?5112:P==='page'&&U.q('slug')==='support'?6112:null;
  if(P==='article'){var a=await TN.get('articles','id',U.q('id'));if(a)sid=a.section_id;}
  if(sid)U.header(sid);
  return MAP[P](U);
});
})();
