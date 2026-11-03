(function(){
var E=TN.esc, $=function(s,r){return (r||document).querySelector(s);}, app=$("#adm");
var NEWS_KINDS={news:"기사(일반)",photo:"포토",video:"영상",board:"게시판",page:"고정 페이지",link:"외부 링크"};
var secs=[];
function toast(m,err){ var t=$("#toast"); t.textContent=m; t.style.background=err?"#c0392b":"#222"; t.style.opacity=1; setTimeout(function(){t.style.opacity=0;},2600); }
function secOptions(sel,onlyLeaf){
  var top=secs.filter(function(s){return !s.parent_id;}).sort(function(a,b){return a.sort-b.sort;});
  return top.map(function(t){
    var k=secs.filter(function(s){return s.parent_id===t.id;}).sort(function(a,b){return a.sort-b.sort;});
    return '<option value="'+t.id+'"'+(onlyLeaf&&k.length?' disabled':'')+(String(sel)===String(t.id)?" selected":"")+'>'+E(t.name)+'</option>'+k.map(function(c){return '<option value="'+c.id+'"'+(onlyLeaf&&(c.kind==='page'||c.kind==='board')?' disabled':'')+(String(sel)===String(c.id)?" selected":"")+'>&nbsp;&nbsp;- '+E(c.name)+'</option>';}).join("");
  }).join("");
}
function secName(id){ var s=secs.filter(function(x){return String(x.id)===String(id);})[0]; return s?s.name:"-"; }
function toLocal(iso){ var d=iso?new Date(iso):new Date(); var p=function(n){return String(n).padStart(2,"0");}; return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes()); }

/* ---------- 로그인 ---------- */
function loginView(msg){
  document.body.className="login";
  app.innerHTML='<div class="lbox"><h1>'+E(TN.demo?"하베스트 타임스 관리자 (데모)":"하베스트 타임스 관리자")+'</h1>'+(TN.demo?'<p class="hint">데모 모드입니다. ID <b>admin</b> / 비밀번호 <b>demo1234</b></p>':'')+
   '<form id="lf"><label>ID</label><input name="id" autocomplete="username" required><label>비밀번호</label><input name="pw" type="password" autocomplete="current-password" required><button class="b">로그인</button><p class="err">'+E(msg||"")+'</p></form><p><a href="index.html">사이트로 돌아가기</a></p></div>';
  $("#lf").onsubmit=async function(e){ e.preventDefault(); var f=new FormData(e.target); var r=await TN.signIn(f.get("id").trim(),f.get("pw")); if(r.ok) start(); else $(".err").textContent=r.msg; };
}

/* ---------- 틀 ---------- */
var NAV=[["dash","대시보드"],["articles","기사 관리"],["edit/new","기사 작성"],["sections","메뉴·섹션"],["banners","배너"],["inbox","접수함"],["pages","고정 페이지"],["settings","사이트 설정"]];
async function start(){
  document.body.className="";
  secs=await TN.sections();
  app.innerHTML='<div class="shell"><nav><div class="brand">관리자</div>'+NAV.map(function(n){return '<a href="#/'+n[0]+'" data-r="'+n[0].split("/")[0]+'">'+n[1]+'</a>';}).join("")+'<a href="index.html" target="_blank" class="ext">사이트 보기 &#8599;</a><a href="#" id="out" class="ext">로그아웃</a></nav><section id="main"></section></div>';
  $("#out").onclick=function(e){e.preventDefault();TN.signOut();loginView();};
  window.onhashchange=route; route();
}
async function route(){
  var h=(location.hash||"#/dash").slice(2).split("/"), r=h[0];
  [].forEach.call(document.querySelectorAll("nav a[data-r]"),function(a){a.classList.toggle("on",a.dataset.r===r);});
  var m=$("#main"); m.innerHTML='<p class="muted">불러오는 중...</p>';
  try{ await (VIEWS[r]||VIEWS.dash)(m,h[1]); }catch(e){ m.innerHTML='<div class="card"><b>오류</b><p>'+E(e.message)+'</p></div>'; }
}

var VIEWS={};
/* ---------- 대시보드 ---------- */
VIEWS.dash=async function(m){
  var pub=await TN.list("articles",{filters:{status:"eq.published"},limit:1}), dr=await TN.list("articles",{filters:{status:"eq.draft"},limit:1}),
      inb=await TN.list("posts",{filters:{status:"eq.open"},limit:1});
  var rec=(await TN.list("articles",{order:"created_at.desc",limit:8})).data||[];
  m.innerHTML='<h2>대시보드</h2><div class="stats"><div class="card"><small>발행된 기사</small><b>'+(pub.count||0)+'</b></div><div class="card"><small>임시저장</small><b>'+(dr.count||0)+'</b></div><div class="card"><small>미확인 접수</small><b>'+(inb.count||0)+'</b></div></div>'+
   '<div class="card"><h3>최근 기사</h3>'+(rec.length?'<table>'+rec.map(function(a){return '<tr><td><a href="#/edit/'+a.id+'">'+E(a.title)+'</a></td><td>'+E(secName(a.section_id))+'</td><td>'+(a.status==="published"?"발행":"임시")+'</td></tr>';}).join("")+'</table>':'<p class="muted">아직 기사가 없습니다. "기사 작성"에서 첫 기사를 등록하세요.</p>')+'</div>'+
   (TN.hasSample()?'<div class="card"><h3>예시 데이터 (하베스트대학교 공개 내용 기반)</h3><p class="muted">예시 기사 29건, 광고 배너 8개, 접수 예시 5건입니다. 실제 운영 전에 "예시 데이터 지우기"로 삭제하세요. 지워도 직접 만든 기사는 남습니다.</p><button class="b" id="ldS">예시 데이터 넣기</button> <button class="b line" id="clS">예시 데이터 지우기</button></div>':'')+(TN.demo?'<div class="card"><h3>데모 도구</h3><p class="muted">레이아웃 확인용입니다. 실제 서버(Supabase) 연결 시에는 이 버튼이 데이터를 만들지 않도록 사용하지 마세요.</p><button class="b" id="seed">샘플 기사 24개 만들기</button> <button class="b line" id="rst">데모 데이터 모두 지우기</button></div>':'');
  if($("#ldS")){ $("#ldS").onclick=async function(){ this.disabled=true; try{ await TN.loadSample(); toast("예시 데이터를 넣었습니다."); route(); }catch(e){ toast(e.message,1); } }; $("#clS").onclick=async function(){ if(!confirm("예시 기사, 배너, 접수를 지울까요?"))return; await TN.clearSample(); toast("지웠습니다."); route(); }; }
  if(TN.demo){ $("#seed").onclick=async function(){ await TN.seedSamples(24); toast("샘플 기사를 만들었습니다."); route(); }; $("#rst").onclick=function(){ if(confirm("데모 데이터를 모두 지울까요?")){ TN.demoReset(); location.reload(); } }; }
};
/* ---------- 기사 목록 ---------- */
VIEWS.articles=async function(m){
  var st=sessionStorage.getItem("adm_st")||"", sc=sessionStorage.getItem("adm_sc")||"", q=sessionStorage.getItem("adm_q")||"", pg=+(sessionStorage.getItem("adm_pg")||1), size=15;
  var f={}; if(st) f.status="eq."+st; if(sc){ var ch=secs.filter(function(s){return s.parent_id==sc;}).map(function(s){return s.id;}); f.section_id="in.("+[sc].concat(ch).join(",")+")"; } if(q) f.q=q;
  var r=await TN.list("articles",{filters:f,order:"created_at.desc",limit:size,offset:(pg-1)*size}), rows=r.data||[], total=r.count||0, pages=Math.max(1,Math.ceil(total/size));
  m.innerHTML='<div class="bar"><h2>기사 관리</h2><a class="b" href="#/edit/new">+ 기사 작성</a></div><div class="card"><div class="filters"><select id="fs"><option value="">전체 상태</option><option value="published"'+(st==="published"?" selected":"")+'>발행</option><option value="draft"'+(st==="draft"?" selected":"")+'>임시저장</option></select><select id="fc"><option value="">전체 섹션</option>'+secOptions(sc)+'</select><input id="fq" placeholder="제목·내용 검색" value="'+E(q)+'"><button class="b" id="fg">검색</button></div>'+
   '<table><thead><tr><th>제목</th><th>섹션</th><th class="hm">작성자</th><th>상태</th><th>일시</th><th class="hm">조회</th><th></th></tr></thead><tbody>'+
   (rows.length?rows.map(function(a){return '<tr><td><a href="#/edit/'+a.id+'">'+E(a.title)+'</a>'+(a.is_headline?' <span class="tag">헤드라인</span>':"")+(a.is_top?' <span class="tag t2">톱</span>':"")+'</td><td>'+E(secName(a.section_id))+'</td><td class="hm">'+E(a.author||"")+'</td><td class="nw">'+(a.status==="published"?'<span class="pill ok">발행</span>':'<span class="pill">임시</span>')+'</td><td class="nw">'+TN.fmt(a.published_at||a.created_at,true)+'</td><td class="hm">'+(a.views||0)+'</td><td class="act"><a href="article.html?id='+a.id+'" target="_blank">보기</a> <a href="#" data-del="'+a.id+'" class="dng">삭제</a></td></tr>';}).join(""):'<tr><td colspan="7" class="muted" style="text-align:center;padding:40px">기사가 없습니다.</td></tr>')+
   '</tbody></table><div class="pg">'+(pg>1?'<button class="b line" id="pp">이전</button>':"")+'<span>'+pg+' / '+pages+' ('+total+'건)</span>'+(pg<pages?'<button class="b line" id="pn">다음</button>':"")+'</div></div>';
  $("#fg").onclick=function(){ sessionStorage.setItem("adm_st",$("#fs").value);sessionStorage.setItem("adm_sc",$("#fc").value);sessionStorage.setItem("adm_q",$("#fq").value);sessionStorage.setItem("adm_pg",1);route(); };
  $("#fq").onkeydown=function(e){if(e.key==="Enter")$("#fg").click();};
  if($("#pp")) $("#pp").onclick=function(){sessionStorage.setItem("adm_pg",pg-1);route();};
  if($("#pn")) $("#pn").onclick=function(){sessionStorage.setItem("adm_pg",pg+1);route();};
  [].forEach.call(document.querySelectorAll("[data-del]"),function(a){ a.onclick=async function(e){ e.preventDefault(); if(!confirm("이 기사를 삭제할까요? 되돌릴 수 없습니다.")) return; await TN.del("articles",a.dataset.del); toast("삭제했습니다."); route(); }; });
};
/* ---------- 기사 편집 ---------- */
VIEWS.edit=async function(m,id){
  var a = id&&id!=="new" ? await TN.get("articles","id",id) : null;
  a = a || {status:"draft",author:"",section_id:"",title:"",subtitle:"",summary:"",body:"",image_url:"",is_headline:false,is_top:false};
  m.innerHTML='<div class="bar"><h2>'+(a.id?"기사 수정":"기사 작성")+'</h2>'+(a.id?'<a href="article.html?id='+a.id+'" target="_blank" class="b line">미리보기</a>':"")+'</div><form id="af" class="card form">'+
   '<label>제목 *</label><input name="title" required maxlength="200" value="'+E(a.title)+'"><label>부제목</label><input name="subtitle" maxlength="200" value="'+E(a.subtitle||"")+'">'+
   '<div class="g3"><div><label>카테고리 *</label><select name="section_id" required><option value="">선택</option>'+secOptions(a.section_id,true)+'</select></div><div><label>기자명</label><input name="author" maxlength="40" value="'+E(a.author||"")+'"></div><div><label>발행일시</label><input type="datetime-local" name="published_at" value="'+toLocal(a.published_at)+'"></div></div>'+
   '<div class="g3"><div><label>상태</label><select name="status"><option value="draft"'+(a.status==="draft"?" selected":"")+'>임시저장</option><option value="published"'+(a.status==="published"?" selected":"")+'>발행</option></select></div><div><label class="sp">&nbsp;</label><label class="chk"><input type="checkbox" name="is_headline"'+(a.is_headline?" checked":"")+'> 메인 헤드라인</label></div><div><label class="sp">&nbsp;</label><label class="chk"><input type="checkbox" name="is_top"'+(a.is_top?" checked":"")+'> 메인 톱 3건</label></div></div>'+
   '<label>영상 / PDF / 이북 주소 (선택)</label><input type="url" name="video_url" placeholder="https://…" value="'+E(a.video_url||'')+'"><p class="muted">PDF·이북은 매거진 → PDF / 이북 보기, 영상은 타임 TV → 하베스트 영상 / 브이로그를 선택하세요. 파일을 별도 호스팅에 올린 뒤 공개 주소를 입력합니다.</p><label>대표 이미지</label><div class="imgrow"><div id="pv">'+(a.image_url?'<img src="'+E(a.image_url)+'">':'<span class="muted">없음</span>')+'</div><div><input type="file" id="fi" accept="image/*"><input name="image_url" placeholder="또는 이미지 주소" value="'+(a.image_url&&a.image_url.indexOf("data:")===0?"":E(a.image_url||""))+'"><button type="button" class="b line" id="ci">이미지 제거</button></div></div>'+
   '<label>요약 (목록에 표시)</label><textarea name="summary" rows="3" maxlength="400">'+E(a.summary||"")+'</textarea>'+
   '<label>본문</label><div class="tbar">'+[["bold","B"],["italic","I"],["formatBlock:h3","제목"],["insertUnorderedList","목록"],["createLink","링크"],["img","사진"],["removeFormat","서식해제"]].map(function(t){return '<button type="button" data-c="'+t[0]+'">'+t[1]+'</button>';}).join("")+'<input type="file" id="bi" accept="image/*" hidden></div><div id="body" class="rte" contenteditable="true">'+(a.body||"")+'</div>'+
   '<p class="bar2"><button class="b">저장</button> <a href="#/articles" class="b line">목록</a>'+(a.id?' <a href="#" id="dl" class="dng">삭제</a>':"")+'</p></form>';
  var imgUrl=a.image_url||"";
  $("#fi").onchange=async function(){ try{ imgUrl=await TN.upload(this.files[0]); $("#pv").innerHTML='<img src="'+E(imgUrl)+'">'; $('[name=image_url]').value=""; toast("이미지를 올렸습니다."); }catch(e){toast(e.message,1);} };
  $('[name=image_url]').oninput=function(){ imgUrl=this.value; $("#pv").innerHTML=imgUrl?'<img src="'+E(imgUrl)+'">':'<span class="muted">없음</span>'; };
  $("#ci").onclick=function(){ imgUrl=""; $('[name=image_url]').value=""; $("#pv").innerHTML='<span class="muted">없음</span>'; };
  [].forEach.call(document.querySelectorAll(".tbar button"),function(b){ b.onclick=function(){ var c=b.dataset.c; $("#body").focus();
    if(c==="img"){ $("#bi").click(); return; }
    if(c==="createLink"){ var u=prompt("링크 주소"); if(u) document.execCommand("createLink",false,u); return; }
    if(c.indexOf("formatBlock")===0){ document.execCommand("formatBlock",false,c.split(":")[1]); return; }
    document.execCommand(c,false,null); }; });
  $("#bi").onchange=async function(){ try{ var u=await TN.upload(this.files[0]); $("#body").focus(); document.execCommand("insertImage",false,u); }catch(e){toast(e.message,1);} this.value=""; };
  if($("#dl")) $("#dl").onclick=async function(e){ e.preventDefault(); if(!confirm("이 기사를 삭제할까요? 되돌릴 수 없습니다.")) return; await TN.del("articles",a.id); location.hash="#/articles"; };
  $("#af").onsubmit=async function(e){
    e.preventDefault(); var f=new FormData(e.target);
    var row={ title:f.get("title").trim(), subtitle:f.get("subtitle"), section_id:Number(f.get("section_id")), author:f.get("author"), status:f.get("status"),
      published_at:new Date(f.get("published_at")).toISOString(), is_headline:!!f.get("is_headline"), is_top:!!f.get("is_top"), image_url:imgUrl||null, summary:f.get("summary"), body:$("#body").innerHTML, video_url:f.get("video_url")||null };
    var selected=secs.find(function(s){return s.id===row.section_id;});
    if(!selected||selected.kind==='page'||selected.kind==='board'||secs.some(function(s){return s.parent_id===row.section_id;})){toast('기사를 게시할 하위 카테고리를 선택하세요.',1);return;}
    if(a.id) row.id=a.id; else row.views=0;
    try{ var s=await TN.save("articles",row); toast("저장했습니다."); if(!a.id) location.hash="#/edit/"+s.id; }catch(err){ toast("저장 실패: "+err.message,1); }
  };
};
/* ---------- 섹션 ---------- */
VIEWS.sections=async function(m){
  secs=await TN.sections();
  var top=secs.filter(function(s){return !s.parent_id;}).sort(function(a,b){return a.sort-b.sort;});
  function row(s,ind){ return '<tr><td>'+(ind?"&nbsp;&nbsp;&nbsp;- ":"")+'<b>'+E(s.name)+'</b></td><td>'+E(s.code)+'</td><td>'+E(NEWS_KINDS[s.kind]||s.kind)+'</td><td>'+s.sort+'</td><td>'+(s.visible===false?"숨김":"표시")+'</td><td class="act"><a href="#" data-e="'+s.id+'">수정</a> <a href="#" data-d="'+s.id+'" class="dng">삭제</a></td></tr>'; }
  var html=""; top.forEach(function(t){ html+=row(t,0); secs.filter(function(s){return s.parent_id===t.id;}).sort(function(a,b){return a.sort-b.sort;}).forEach(function(c){html+=row(c,1);}); });
  m.innerHTML='<div class="bar"><h2>메뉴·섹션</h2><button class="b" id="add">+ 섹션 추가</button></div><div class="card"><p class="muted">상단 메뉴(대분류)와 하위 메뉴(소분류)를 관리합니다. 코드는 영문 소문자(주소에 사용)입니다.</p><table><thead><tr><th>이름</th><th>코드</th><th>종류</th><th>순서</th><th>표시</th><th></th></tr></thead><tbody>'+html+'</tbody></table></div><div id="sf"></div>';
  function form(s){
    s=s||{name:"",code:"",kind:"news",sort:(secs.length+1),visible:true,parent_id:"",link_url:""};
    $("#sf").innerHTML='<form class="card form" id="sform"><h3>'+(s.id?"섹션 수정":"섹션 추가")+'</h3><div class="g3"><div><label>이름 *</label><input name="name" required value="'+E(s.name)+'"></div><div><label>코드 *</label><input name="code" required pattern="[a-z0-9_-]+" value="'+E(s.code)+'"></div><div><label>순서</label><input name="sort" type="number" value="'+s.sort+'"></div></div><div class="g3"><div><label>상위 메뉴</label><select name="parent_id"><option value="">(없음: 상단 메뉴)</option>'+top.filter(function(t){return t.id!==s.id;}).map(function(t){return '<option value="'+t.id+'"'+(String(s.parent_id)===String(t.id)?" selected":"")+'>'+E(t.name)+'</option>';}).join("")+'</select></div><div><label>종류</label><select name="kind">'+Object.keys(NEWS_KINDS).map(function(k){return '<option value="'+k+'"'+(s.kind===k?" selected":"")+'>'+NEWS_KINDS[k]+'</option>';}).join("")+'</select></div><div><label>외부 링크(종류가 링크일 때)</label><input name="link_url" value="'+E(s.link_url||"")+'"></div></div><label class="chk"><input type="checkbox" name="visible"'+(s.visible!==false?" checked":"")+'> 메뉴에 표시</label><p><button class="b">저장</button></p></form>';
    $("#sform").onsubmit=async function(e){ e.preventDefault(); var f=new FormData(e.target); var row={name:f.get("name"),code:f.get("code"),sort:+f.get("sort"),parent_id:f.get("parent_id")?+f.get("parent_id"):null,kind:f.get("kind"),link_url:f.get("link_url")||null,visible:!!f.get("visible")}; if(s.id) row.id=s.id;
      try{ await TN.save("sections",row); toast("저장했습니다."); route(); }catch(err){toast("저장 실패: "+err.message,1);} };
    $("#sf").scrollIntoView({behavior:"smooth"});
  }
  $("#add").onclick=function(){form();};
  [].forEach.call(document.querySelectorAll("[data-e]"),function(a){a.onclick=function(e){e.preventDefault();form(secs.filter(function(s){return s.id==a.dataset.e;})[0]);};});
  [].forEach.call(document.querySelectorAll("[data-d]"),function(a){a.onclick=async function(e){e.preventDefault();
    var n=(await TN.list("articles",{filters:{section_id:"eq."+a.dataset.d},limit:1})).count||0;
    if(n&&!confirm("이 섹션에 기사가 "+n+"건 있습니다. 삭제하면 기사가 섹션 없이 남거나 삭제 불가할 수 있습니다. 계속할까요?")) return;
    if(!confirm("섹션을 삭제할까요?")) return;
    try{ await TN.del("sections",a.dataset.d); toast("삭제했습니다."); route(); }catch(err){toast("삭제 실패: "+err.message,1);} };});
};
/* ---------- 배너 ---------- */
VIEWS.banners=async function(m){
  var bs=(await TN.list("banners",{})).data||[];
  m.innerHTML='<h2>배너</h2><p class="muted">사이트 곳곳의 광고 자리입니다. 이미지를 올리고 링크를 넣으면 바로 반영됩니다.</p><div class="bgrid">'+TN.BANNER_SLOTS.map(function(s){
    var b=bs.filter(function(x){return x.slot===s.slot;})[0]||{};
    return '<form class="card form bn" data-slot="'+s.slot+'"><h3>'+s.label+' <small class="muted">'+s.size+'</small></h3><div class="bpv">'+(b.image_url?'<img src="'+E(b.image_url)+'">':'<span class="muted">이미지 없음</span>')+'</div><input type="file" accept="image/*"><label>링크 주소</label><input name="link_url" value="'+E(b.link_url||"")+'" placeholder="https://"><label class="chk"><input type="checkbox" name="active"'+(b.active!==false?" checked":"")+'> 사용</label><p><button class="b">저장</button> '+(b.id?'<a href="#" class="dng rm">제거</a>':"")+'</p><input type="hidden" name="image_url" value="'+(b.image_url&&b.image_url.indexOf("data:")===0?"":E(b.image_url||""))+'"><input type="hidden" name="id" value="'+(b.id||"")+'"></form>';
  }).join("")+'</div>';
  [].forEach.call(document.querySelectorAll("form.bn"),function(f){
    var img=(bs.filter(function(x){return x.slot===f.dataset.slot;})[0]||{}).image_url||"";
    f.querySelector("input[type=file]").onchange=async function(){ try{ img=await TN.upload(this.files[0]); f.querySelector(".bpv").innerHTML='<img src="'+E(img)+'">'; }catch(e){toast(e.message,1);} };
    f.onsubmit=async function(e){ e.preventDefault(); var fd=new FormData(f); var row={slot:f.dataset.slot,image_url:img||null,link_url:fd.get("link_url")||null,active:!!fd.get("active"),title:TN.BANNER_SLOTS.filter(function(s){return s.slot===f.dataset.slot;})[0].label}; if(fd.get("id")) row.id=+fd.get("id");
      try{ await TN.save("banners",row); toast("저장했습니다."); route(); }catch(err){toast("저장 실패: "+err.message,1);} };
    var rm=f.querySelector(".rm"); if(rm) rm.onclick=async function(e){ e.preventDefault(); if(!confirm("이 배너를 제거할까요?"))return; await TN.del("banners",f.querySelector("[name=id]").value); route(); };
  });
};
/* ---------- 접수함 ---------- */
VIEWS.inbox=async function(m,id){
  var b=sessionStorage.getItem("adm_b")||"";
  var f={}; if(b) f.board="eq."+b;
  var rows=(await TN.list("posts",{filters:f,order:"created_at.desc",limit:100})).data||[];
  var BN={free:"이전 자유게시판",reporter:"이전 독자기자 접수",report:"기사 제보 및 참여",ad:"광고문의"};
  m.innerHTML='<h2>접수함</h2><div class="card"><div class="filters"><select id="fb"><option value="">전체</option>'+Object.keys(BN).map(function(k){return '<option value="'+k+'"'+(b===k?" selected":"")+'>'+BN[k]+'</option>';}).join("")+'</select></div><table><thead><tr><th>구분</th><th>제목</th><th>작성자</th><th>연락처</th><th>일시</th><th>상태</th><th></th></tr></thead><tbody>'+
   (rows.length?rows.map(function(p){return '<tr><td>'+E(BN[p.board]||p.board)+'</td><td><a href="#" data-v="'+p.id+'">'+E(p.title)+'</a></td><td>'+E(p.author||"")+'</td><td>'+E(p.contact||"")+'</td><td>'+TN.fmt(p.created_at,true)+'</td><td>'+({open:"미확인",done:"처리완료",hidden:"숨김"}[p.status]||p.status)+'</td><td class="act"><a href="#" data-s="'+p.id+':done">처리완료</a> <a href="#" data-s="'+p.id+':hidden">숨김</a> <a href="#" class="dng" data-x="'+p.id+'">삭제</a></td></tr>';}).join(""):'<tr><td colspan="7" class="muted" style="text-align:center;padding:40px">접수된 내용이 없습니다.</td></tr>')+'</tbody></table></div><div id="pv2"></div>';
  $("#fb").onchange=function(){sessionStorage.setItem("adm_b",this.value);route();};
  [].forEach.call(document.querySelectorAll("[data-v]"),function(a){a.onclick=function(e){e.preventDefault();var p=rows.filter(function(x){return x.id==a.dataset.v;})[0]; $("#pv2").innerHTML='<div class="card"><h3>'+E(p.title)+'</h3><p class="muted">'+E(p.author||"")+' / '+E(p.contact||"")+' / '+TN.fmt(p.created_at,true)+'</p><div style="white-space:pre-wrap">'+E(p.body)+'</div></div>'; $("#pv2").scrollIntoView({behavior:"smooth"});};});
  [].forEach.call(document.querySelectorAll("[data-s]"),function(a){a.onclick=async function(e){e.preventDefault();var s=a.dataset.s.split(":");await TN.save("posts",{id:+s[0],status:s[1]});route();};});
  [].forEach.call(document.querySelectorAll("[data-x]"),function(a){a.onclick=async function(e){e.preventDefault();if(!confirm("삭제할까요? 되돌릴 수 없습니다."))return;await TN.del("posts",a.dataset.x);route();};});
};
/* ---------- 고정 페이지 ---------- */
VIEWS.pages=async function(m){
  var ps=(await TN.list("pages",{})).data||[];
  m.innerHTML='<h2>고정 페이지</h2><p class="muted">매체소개, 이용약관 등 푸터에 연결된 안내 페이지입니다.</p>'+ps.map(function(p){return '<form class="card form" data-slug="'+E(p.slug)+'"><h3>'+E(p.title)+' <small class="muted">page.html?slug='+E(p.slug)+'</small></h3><input name="title" value="'+E(p.title)+'"><textarea name="body" rows="6">'+E(p.body)+'</textarea><p><button class="b">저장</button></p></form>';}).join("");
  [].forEach.call(document.querySelectorAll("form[data-slug]"),function(f){f.onsubmit=async function(e){e.preventDefault();var fd=new FormData(f);try{await TN.save("pages",{slug:f.dataset.slug,title:fd.get("title"),body:fd.get("body")},"slug");toast("저장했습니다.");}catch(err){toast("저장 실패: "+err.message,1);}};});
};
/* ---------- 사이트 설정 ---------- */
VIEWS.settings=async function(m){
  var S=await TN.settings();
  var T=[["site_name","사이트 이름"],["site_en","영문 이름(로고 아래)"],["address","주소"],["phone","대표전화"],["youth_officer","청소년보호책임자"],["reg_title","제호"],["reg_no","등록번호"],["reg_date","등록일"],["publisher","발행·편집인"],["copyright","저작권 문구"]];
  var secsTop=secs.filter(function(s){return s.kind!=="board"&&s.kind!=="page"});
  var sel=function(k,label){ return '<div><label>'+label+'</label><select name="'+k+'"><option value="">(기본값)</option>'+secOptions(S[k])+'</select></div>'; };
  m.innerHTML='<h2>사이트 설정</h2><form class="card form" id="stf"><h3>기본 정보 (푸터에 표시)</h3>'+T.map(function(t){return '<label>'+t[1]+'</label><input name="'+t[0]+'" value="'+E(S[t[0]]||"")+'">';}).join("")+
   '<label>로고 이미지 (없으면 글자 로고)</label><div class="imgrow"><div id="lp">'+(S.logo_url?'<img src="'+E(S.logo_url)+'" style="max-height:60px">':'<span class="muted">글자 로고</span>')+'</div><div><input type="file" id="lf2" accept="image/*"></div></div>'+
   '<h3 style="margin-top:28px">홈 화면 구성</h3><p class="muted">홈 아래쪽 3개 블록(마지막은 영상형)과 오른쪽 코너 3개에 보여줄 섹션을 고릅니다.</p><div class="g3">'+sel("home_block_1","홈 블록 1")+sel("home_block_2","홈 블록 2")+sel("home_block_3","홈 블록 3 (영상형)")+'</div><div class="g3">'+sel("side_box_1","사이드 코너 1")+sel("side_box_2","사이드 코너 2")+sel("side_box_3","사이드 코너 3")+'</div>'+sel("focus_section","포커스 섹션")+
   '<p><button class="b">저장</button></p></form>';
  var logo=S.logo_url||"";
  $("#lf2").onchange=async function(){ try{ logo=await TN.upload(this.files[0]); $("#lp").innerHTML='<img src="'+E(logo)+'" style="max-height:60px">'; }catch(e){toast(e.message,1);} };
  $("#stf").onsubmit=async function(e){ e.preventDefault(); var fd=new FormData(e.target);
    try{ for(var [k,v] of fd.entries()){ await TN.saveSetting(k,v); } await TN.saveSetting("logo_url",logo); toast("저장했습니다."); }catch(err){toast("저장 실패: "+err.message,1);} };
};

/* ---------- 시작 ---------- */
(async function(){ if(TN.user() && await TN.isAdmin()) start(); else loginView(); })();
})();
