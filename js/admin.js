(function(){
var E=TN.esc, $=function(s,r){return (r||document).querySelector(s);}, app=$("#adm");
var NEWS_KINDS={news:"기사(일반)",photo:"포토",video:"영상",board:"게시판",page:"고정 페이지",link:"외부 링크"};
var secs=[];
function toast(m,err){ var t=$("#toast"); t.textContent=m; t.style.background=err?"#c0392b":"#222"; t.style.opacity=1; setTimeout(function(){t.style.opacity=0;},2600); }
function secOptions(sel,onlyLeaf){
  var show=function(s){return s.visible!==false||String(sel)===String(s.id);};
  var top=secs.filter(function(s){return !s.parent_id&&(show(s)||secs.some(function(c){return c.parent_id===s.id&&String(sel)===String(c.id);}));}).sort(function(a,b){return a.sort-b.sort;});
  return top.map(function(t){
    var k=secs.filter(function(s){return s.parent_id===t.id&&(show(s)&&(t.visible!==false||String(sel)===String(s.id)));}).sort(function(a,b){return a.sort-b.sort;});
    return '<option value="'+t.id+'"'+(onlyLeaf&&k.length?' disabled':'')+(String(sel)===String(t.id)?" selected":"")+'>'+E(t.name)+'</option>'+k.map(function(c){return '<option value="'+c.id+'"'+(onlyLeaf&&(c.kind==='page'||c.kind==='board')?' disabled':'')+(String(sel)===String(c.id)?" selected":"")+'>&nbsp;&nbsp;- '+E(c.name)+'</option>';}).join("");
  }).join("");
}
function secName(id){ var s=secs.filter(function(x){return String(x.id)===String(id);})[0]; return s?s.name:"-"; }
function toLocal(iso){ var d=iso?new Date(iso):new Date(); var p=function(n){return String(n).padStart(2,"0");}; return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes()); }

/* ---------- 로그인 ---------- */
function loginView(msg){
  document.body.className="login";
  app.innerHTML='<div class="lbox"><h1>'+E(TN.demo?"하베스트 타임스 관리자 (데모)":"하베스트 타임스 관리자")+'</h1>'+(TN.demo?'<p class="hint">시연용 화면입니다. 실제 서버 데이터와 분리됩니다.</p>':'')+
   '<form id="lf"><label>ID</label><input name="id" autocomplete="username" value="admin" required><label>비밀번호</label><input name="pw" type="password" autocomplete="current-password" required><button class="b">로그인</button><p class="err">'+E(msg||"")+'</p></form><p><a href="index.html">사이트로 돌아가기</a></p></div>';
  $("#lf").onsubmit=async function(e){ e.preventDefault(); var f=new FormData(e.target); var r=await TN.signIn(f.get("id").trim(),f.get("pw")); if(r.ok) start(); else $(".err").textContent=r.msg; };
}

/* ---------- 틀 ---------- */
var NAV=[["dash","대시보드"],["edit/new","새 기사 쓰기"],["articles","기사 목록·수정"],["members","회원·권한 관리"],["sections","메뉴·섹션"],["banners","배너"],["inbox","접수함"],["network","선교 네트워크 관리"],["applications","선교사·기자단 승인"],["pages","고정 페이지"],["settings","사이트 설정"]];
async function start(){
  document.body.className="";
  secs=await TN.sections();
  app.innerHTML='<div class="shell"><nav><div class="brand">관리자</div>'+NAV.map(function(n){return '<a href="#/'+n[0]+'" data-r="'+n[0].split("/")[0]+'">'+n[1]+'</a>';}).join("")+'<a href="index.html" target="_blank" class="ext">사이트 보기 &#8599;</a><a href="#" id="out" class="ext">로그아웃</a></nav><section id="main"></section></div>';
  $("#out").onclick=function(e){e.preventDefault();Promise.resolve(TN.signOut()).then(function(){loginView();});};
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
  m.innerHTML='<div class="bar"><h2>대시보드</h2><a class="b" href="#/edit/new">+ 새 기사 쓰기</a></div><div class="stats"><div class="card"><small>발행된 기사</small><b>'+(pub.count||0)+'</b></div><div class="card"><small>임시저장</small><b>'+(dr.count||0)+'</b></div><div class="card"><small>미확인 접수</small><b>'+(inb.count||0)+'</b></div></div>'+
   '<div class="card"><h3>최근 기사</h3>'+(rec.length?'<table>'+rec.map(function(a){return '<tr><td><a href="#/edit/'+a.id+'">'+E(a.title)+'</a></td><td>'+E(secName(a.section_id))+'</td><td>'+(a.status==="published"?"발행":"임시")+'</td></tr>';}).join("")+'</table>':'<p class="muted">아직 기사가 없습니다. "새 기사 쓰기"에서 첫 기사를 등록하세요.</p>')+'</div>'+
   (TN.demo&&TN.hasSample()?'<div class="card"><h3>예시 데이터 (하베스트대학교 공개 내용 기반)</h3><p class="muted">예시 기사 29건, 광고 배너 8개, 접수 예시 5건입니다. 실제 운영 전에 "예시 데이터 지우기"로 삭제하세요. 지워도 직접 만든 기사는 남습니다.</p><button class="b" id="ldS">예시 데이터 넣기</button> <button class="b line" id="clS">예시 데이터 지우기</button></div>':'')+(TN.demo?'<div class="card"><h3>데모 도구</h3><p class="muted">레이아웃 확인용입니다. 실제 서버(Supabase) 연결 시에는 이 버튼이 데이터를 만들지 않도록 사용하지 마세요.</p><button class="b" id="seed">샘플 기사 24개 만들기</button> <button class="b line" id="rst">데모 데이터 모두 지우기</button></div>':'');
  if($("#ldS")){ $("#ldS").onclick=async function(){ this.disabled=true; try{ await TN.loadSample(); toast("예시 데이터를 넣었습니다."); route(); }catch(e){ toast(e.message,1); } }; $("#clS").onclick=async function(){ if(!confirm("예시 기사, 배너, 접수를 지울까요?"))return; await TN.clearSample(); toast("지웠습니다."); route(); }; }
  if(TN.demo){ $("#seed").onclick=async function(){ await TN.seedSamples(24); toast("샘플 기사를 만들었습니다."); route(); }; $("#rst").onclick=function(){ if(confirm("이 브라우저의 데모 기사·설정·회원·신청·승인 기록을 모두 지우고 로그아웃할까요?")){ TN.demoReset(); location.reload(); } }; }
};
/* ---------- 기사 목록 ---------- */
VIEWS.articles=async function(m){
  var st=sessionStorage.getItem("adm_st")||"", sc=sessionStorage.getItem("adm_sc")||"", q=sessionStorage.getItem("adm_q")||"", pg=+(sessionStorage.getItem("adm_pg")||1), size=15;
  var f={}; if(st) f.status="eq."+st; if(sc){ var ch=secs.filter(function(s){return s.parent_id==sc;}).map(function(s){return s.id;}); f.section_id="in.("+[sc].concat(ch).join(",")+")"; } if(q) f.q=q;
  var r=await TN.list("articles",{filters:f,order:"created_at.desc",limit:size,offset:(pg-1)*size}), rows=r.data||[], total=r.count||0, pages=Math.max(1,Math.ceil(total/size));
  m.innerHTML='<div class="bar"><h2>기사 관리</h2><a class="b" href="#/edit/new">+ 새 기사 쓰기</a></div><div class="card"><div class="filters"><select id="fs"><option value="">전체 상태</option><option value="published"'+(st==="published"?" selected":"")+'>발행</option><option value="draft"'+(st==="draft"?" selected":"")+'>임시저장</option></select><select id="fc"><option value="">전체 섹션</option>'+secOptions(sc)+'</select><input id="fq" placeholder="제목·내용 검색" value="'+E(q)+'"><button class="b" id="fg">검색</button></div>'+
   '<table><thead><tr><th>제목</th><th>섹션</th><th class="hm">작성자</th><th>상태</th><th>일시</th><th class="hm">조회</th><th></th></tr></thead><tbody>'+
   (rows.length?rows.map(function(a){return '<tr><td><a href="#/edit/'+a.id+'">'+E(a.title)+'</a>'+(a.is_headline?' <span class="tag">헤드라인</span>':"")+(a.is_top?' <span class="tag t2">톱</span>':"")+'</td><td>'+E(secName(a.section_id))+'</td><td class="hm">'+E(a.author||"")+'</td><td class="nw">'+(a.status==="published"?'<span class="pill ok">발행</span>':'<span class="pill">임시</span>')+'</td><td class="nw">'+TN.fmt(a.published_at||a.created_at,true)+'</td><td class="hm">'+(a.views||0)+'</td><td class="act"><a href="#/edit/'+a.id+'">수정</a> <a href="article.html?id='+a.id+'" target="_blank">보기</a>'+(TN.live?'':' <a href="#" data-del="'+a.id+'" class="dng">삭제</a>')+'</td></tr>';}).join(""):'<tr><td colspan="7" class="muted" style="text-align:center;padding:40px">기사가 없습니다.</td></tr>')+
   '</tbody></table><div class="pg">'+(pg>1?'<button class="b line" id="pp">이전</button>':"")+'<span>'+pg+' / '+pages+' ('+total+'건)</span>'+(pg<pages?'<button class="b line" id="pn">다음</button>':"")+'</div></div>';
  $("#fg").onclick=function(){ sessionStorage.setItem("adm_st",$("#fs").value);sessionStorage.setItem("adm_sc",$("#fc").value);sessionStorage.setItem("adm_q",$("#fq").value);sessionStorage.setItem("adm_pg",1);route(); };
  $("#fq").onkeydown=function(e){if(e.key==="Enter")$("#fg").click();};
  if($("#pp")) $("#pp").onclick=function(){sessionStorage.setItem("adm_pg",pg-1);route();};
  if($("#pn")) $("#pn").onclick=function(){sessionStorage.setItem("adm_pg",pg+1);route();};
  [].forEach.call(document.querySelectorAll("[data-del]"),function(a){ a.onclick=async function(e){ e.preventDefault(); if(!confirm("이 기사를 삭제할까요? 되돌릴 수 없습니다.")) return; await TN.del("articles",a.dataset.del); toast("삭제했습니다."); route(); }; });
};
/* ---------- 기사 작성·수정 (쉬운 화면) ---------- */
VIEWS.edit=async function(m,id){
  var a = id&&id!=="new" ? await TN.get("articles","id",id) : null;
  if(id&&id!=="new"&&!a){ m.innerHTML='<div class="card"><b>기사를 찾을 수 없습니다.</b><p><a href="#/articles">기사 목록으로</a></p></div>'; return; }
  var isNew=!a, pubd=!!a&&a.status==="published";
  a = a || {status:"draft",author:"",section_id:"",title:"",subtitle:"",summary:"",body:"",image_url:"",video_url:"",is_headline:false,is_top:false};
  var more=(a.subtitle||a.author||a.video_url||a.is_headline||a.is_top)?" open":"";
  m.innerHTML='<div class="bar"><h2>'+(isNew?"새 기사 쓰기":"기사 수정")+'</h2><span><a href="#/articles" class="b line">← 목록으로</a>'+(a.id?' <a href="article.html?id='+a.id+'" target="_blank" class="b line">공개 화면 보기</a>':"")+'</span></div>'+
   '<form id="af" class="card form simple">'+
   '<label>1. 어디에 올릴까요? *</label><select name="section_id" required><option value="">올릴 위치를 선택하세요</option>'+secOptions(a.section_id,true)+'</select><p class="muted">선택한 메뉴의 기사 목록에 표시됩니다. 회색 항목은 선택할 수 없는 큰 메뉴입니다.</p>'+
   '<label>2. 제목 *</label><input name="title" required maxlength="200" value="'+E(a.title)+'" placeholder="기사 제목">'+
   '<label>3. 내용 *</label><div class="tbar">'+[["bold","굵게"],["italic","기울임"],["formatBlock:h3","소제목"],["insertUnorderedList","목록"],["createLink","링크"],["img","사진 넣기"],["removeFormat","서식 지우기"]].map(function(t){return '<button type="button" data-c="'+t[0]+'">'+t[1]+'</button>';}).join("")+'<input type="file" id="bi" accept="image/jpeg,image/png,image/webp" multiple hidden></div><div class="imgbar"><span id="imgmeter" class="pill"></span> <span id="imgsel" hidden><button type="button" class="b line" id="imgup">↑ 위로</button> <button type="button" class="b line" id="imgdn">↓ 아래로</button> <button type="button" class="b line dng" id="imgdel">이 사진 지우기</button></span></div><div id="body" class="rte" contenteditable="true">'+(a.body||"")+'</div><p class="muted">사진을 넣을 <b>글 위치를 클릭</b>한 뒤 <b>사진 넣기</b>를 누르세요(여러 장 선택 가능). 넣은 사진을 누르면 위·아래 이동과 지우기 버튼이 나타나고, 끌어서 옮길 수도 있습니다. 사진은 자동으로 줄여 올리며 한 기사에 <b>최대 5장, 합계 약 2MB</b>까지 올릴 수 있습니다.</p>'+
   '<label>4. 대표 사진 (선택)</label><div class="imgrow"><div id="pv">'+(a.image_url?'<img src="'+E(a.image_url)+'">':'<span class="muted">없음</span>')+'</div><div><input type="file" id="fi" accept="image/*"><button type="button" class="b line" id="ci">사진 빼기</button></div></div>'+
   '<details class="more"'+more+'><summary>더 설정하기 (필요할 때만)</summary><label>부제목</label><input name="subtitle" maxlength="200" value="'+E(a.subtitle||"")+'"><label>기자명</label><input name="author" maxlength="40" value="'+E(a.author||"")+'"><label>요약 (비우면 본문 앞부분으로 자동 작성)</label><textarea name="summary" rows="2" maxlength="400">'+E(a.summary||"")+'</textarea><label>발행일시 (비우면 지금)</label><input type="datetime-local" name="published_at" value="'+(a.published_at?toLocal(a.published_at):"")+'"><div class="g3"><div><label class="chk"><input type="checkbox" name="is_headline"'+(a.is_headline?" checked":"")+'> 메인 헤드라인</label></div><div><label class="chk"><input type="checkbox" name="is_top"'+(a.is_top?" checked":"")+'> 메인 톱 3건</label></div></div><label>영상 / PDF / 이북 주소</label><input type="url" name="video_url" placeholder="https://…" value="'+E(a.video_url||"")+'"></details>'+
   '<p class="bar2">'+(pubd?'<button class="b" value="published">수정 내용 저장 (공개 유지)</button> <button class="b line" value="draft">비공개로 바꾸기</button>':'<button class="b" value="published">바로 발행</button> <button class="b line" value="draft">임시저장</button>')+' <a href="#/articles" class="b line">취소</a></p><p class="muted">'+(pubd?'지금 공개 중인 기사입니다. 저장하면 공개 화면에 바로 반영됩니다.':'임시저장은 방문자에게 보이지 않습니다. 바로 발행하면 사이트에 공개됩니다.')+'</p></form>';
  var imgUrl=a.image_url||"", MAX_N=5, MAX_TOTAL=2*1024*1024, MAX_ONE=500*1024, GUESS=400*1024, coverBytes=a.image_url?GUESS:0;
  var bodyEl0=$("#body"), savedRange=null, uploading=false;
  function usage(){var imgs=[].slice.call(bodyEl0.querySelectorAll("img")),bytes=imgUrl?coverBytes:0;imgs.forEach(function(i){bytes+=Number(i.dataset.bytes)||GUESS;});return {n:imgs.length+(imgUrl?1:0),bytes:bytes};}
  function paint(){var u=usage();var el=$("#imgmeter");el.textContent="사진 "+u.n+"/"+MAX_N+"장 · 약 "+(u.bytes/1048576).toFixed(1)+"/2MB";el.style.background=(u.n>=MAX_N||u.bytes>=MAX_TOTAL)?"#fde2df":"#eceff4";}
  document.addEventListener("selectionchange",function(){var s=getSelection();if(s&&s.rangeCount){var r=s.getRangeAt(0);if(bodyEl0.contains(r.commonAncestorContainer))savedRange=r.cloneRange();}});
  function restore(){bodyEl0.focus();if(savedRange){var s=getSelection();s.removeAllRanges();s.addRange(savedRange);}else{var r=document.createRange();r.selectNodeContents(bodyEl0);r.collapse(false);var s2=getSelection();s2.removeAllRanges();s2.addRange(r);}}
  async function addImages(files){
    if(uploading)return;uploading=true;
    try{
      for(var i=0;i<files.length;i++){
        var u=usage();
        if(u.n>=MAX_N){toast("사진은 한 기사에 최대 "+MAX_N+"장까지입니다.",1);break;}
        var room=Math.min(MAX_ONE,MAX_TOTAL-u.bytes);
        if(room<80*1024){toast("사진 합계 2MB 한도에 도달했습니다.",1);break;}
        $("#imgmeter").textContent="사진 올리는 중… ("+(i+1)+"/"+files.length+")";
        var url=await TN.upload(files[i],{maxBytes:room}), size=TN.upload.lastBytes||GUESS;
        restore();
        document.execCommand("insertHTML",false,'<p><img src="'+E(url)+'" alt="" data-bytes="'+size+'"></p><p><br></p>');
        paint();
      }
    }catch(e){toast(e.message,1);}
    uploading=false;paint();
  }
  paint();
  $("#fi").onchange=async function(){ var f=this.files[0]; this.value=""; if(!f)return; try{ var u=usage(), roomC=Math.min(MAX_ONE,MAX_TOTAL-(u.bytes-(imgUrl?coverBytes:0)));if(!imgUrl&&u.n>=MAX_N){toast("사진은 한 기사에 최대 "+MAX_N+"장까지입니다.",1);return;} if(roomC<80*1024){toast("사진 합계 2MB 한도에 도달했습니다.",1);return;} imgUrl=await TN.upload(f,{maxBytes:roomC}); coverBytes=TN.upload.lastBytes||GUESS; $("#pv").innerHTML='<img src="'+E(imgUrl)+'">'; paint(); toast("대표 사진을 올렸습니다."); }catch(e){toast(e.message,1);} };
  $("#ci").onclick=function(){ imgUrl=""; coverBytes=0; $("#pv").innerHTML='<span class="muted">없음</span>'; paint(); };
  $("#bi").onchange=function(){ var fs=[].slice.call(this.files); this.value=""; addImages(fs); };
  bodyEl0.addEventListener("paste",function(e){var files=[].slice.call((e.clipboardData&&e.clipboardData.files)||[]).filter(function(f){return /^image\//.test(f.type);});if(files.length){e.preventDefault();addImages(files);}});
  bodyEl0.addEventListener("drop",function(e){var files=[].slice.call((e.dataTransfer&&e.dataTransfer.files)||[]).filter(function(f){return /^image\//.test(f.type);});if(files.length){e.preventDefault();addImages(files);}});
  var curImg=null;
  function selectImg(img){[].forEach.call(bodyEl0.querySelectorAll("img.sel"),function(i){i.classList.remove("sel");});curImg=img||null;if(curImg)curImg.classList.add("sel");$("#imgsel").hidden=!curImg;}
  bodyEl0.addEventListener("click",function(e){selectImg(e.target&&e.target.tagName==="IMG"?e.target:null);});
  bodyEl0.addEventListener("input",function(){if(curImg&&!bodyEl0.contains(curImg))selectImg(null);paint();});
  function topOf(img){var t=img;while(t.parentNode&&t.parentNode!==bodyEl0)t=t.parentNode;return t;}
  $("#imgdel").onclick=function(){if(!curImg)return;var t=topOf(curImg);if(t!==curImg&&!t.textContent.trim()&&t.querySelectorAll("img").length===1)t.remove();else curImg.remove();selectImg(null);paint();};
  function move(dir){if(!curImg)return;var t=topOf(curImg);if(t!==curImg&&(t.textContent.trim()||t.querySelectorAll("img").length!==1)){toast("글과 붙어 있는 사진은 끌어서 옮겨 주세요.",1);return;}
    var sib=dir<0?t.previousElementSibling:t.nextElementSibling;if(!sib)return;if(dir<0)bodyEl0.insertBefore(t,sib);else bodyEl0.insertBefore(sib,t);}
  $("#imgup").onclick=function(){move(-1);};$("#imgdn").onclick=function(){move(1);};
  [].forEach.call(document.querySelectorAll(".tbar button"),function(b){ b.onclick=function(){ var c=b.dataset.c;
    if(c==="img"){ if(uploading)return; $("#bi").click(); return; }
    restore();
    if(c==="createLink"){ var u=prompt("링크 주소 (https://…)"); if(u&&TN.safeLink(u)){restore();document.execCommand("createLink",false,u);} else if(u) toast("올바른 http 또는 https 링크를 입력해주세요.",1); return; }
    if(c.indexOf("formatBlock")===0){ document.execCommand("formatBlock",false,c.split(":")[1]); return; }
    document.execCommand(c,false,null); }; });
  var busy=false;
  $("#af").onsubmit=async function(e){
    e.preventDefault(); if(busy) return; var f=new FormData(e.target), mode=(e.submitter&&e.submitter.value)||"draft";
    var bodyEl=$("#body"), plain=bodyEl.textContent.trim();
    var tmp=bodyEl.cloneNode(true);[].forEach.call(tmp.querySelectorAll("img"),function(i){i.classList.remove("sel");if(!i.getAttribute("class"))i.removeAttribute("class");});
    if(tmp.querySelector('img[src^="data:"]')){toast("붙여넣어 들어간 사진이 있습니다. 지우고 [사진 넣기]로 다시 넣어 주세요.",1);return;}
    [].forEach.call(tmp.querySelectorAll("p,div"),function(p){if(!p.textContent.trim()&&!p.querySelector("img,iframe"))p.remove();});
    var html=tmp.innerHTML.trim();
    var sid=Number(f.get("section_id")), selected=secs.find(function(s){return s.id===sid;});
    if(!selected||selected.kind==='page'||selected.kind==='board'||secs.some(function(s){return s.parent_id===sid;})){toast("올릴 위치를 선택하세요.",1);return;}
    if(!f.get("title").trim()){toast("제목을 입력하세요.",1);return;}
    if(mode==="published"&&!plain&&!bodyEl.querySelector("img")){toast("내용을 입력하세요.",1);return;}
    var pubAt=f.get("published_at");
    var row={ title:f.get("title").trim(), subtitle:f.get("subtitle")||"", section_id:sid, author:f.get("author")||"", status:mode,
      published_at:pubAt?new Date(pubAt).toISOString():(a.id?a.published_at:null), is_headline:!!f.get("is_headline"), is_top:!!f.get("is_top"), image_url:imgUrl||null,
      summary:(f.get("summary")||"").trim()||plain.replace(/\s+/g," ").slice(0,120), body:html, video_url:f.get("video_url")||null };
    if(a.id){ row.id=a.id; row.expected_version=a.workflow_version; }
    busy=true; [].forEach.call(e.target.querySelectorAll("button"),function(b){b.disabled=true;});
    try{ var s=await TN.save("articles",row); toast(mode==="published"?"발행했습니다.":"임시저장했습니다."); location.hash=a.id?"#/edit/"+s.id:"#/articles"; if(a.id) route(); }
    catch(err){ toast("저장 실패: "+err.message,1); busy=false; [].forEach.call(e.target.querySelectorAll("button"),function(b){b.disabled=false;}); }
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
    $("#sform").onsubmit=async function(e){ e.preventDefault(); var f=new FormData(e.target); var row={name:f.get("name"),code:f.get("code"),sort:+f.get("sort"),parent_id:f.get("parent_id")?+f.get("parent_id"):null,kind:f.get("kind"),link_url:f.get("link_url")||null,visible:!!f.get("visible")}; if(row.kind==="link"&&(!/^https?:\/\//i.test(row.link_url||"")||!TN.safeLink(row.link_url))){toast("외부 링크는 http 또는 https 주소를 입력해주세요.",1);return;} if(s.id) row.id=s.id;
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
/* ---------- 회원·권한 (관리자 화면 안에서 처리) ---------- */
var ROLE_LABEL={administrator:"운영 관리자",editor_in_chief:"편집인",publisher:"발행인",department_editor:"부서 편집위원",writer:"작성자"};
VIEWS.members=async function(m){
  if(!TN.live||!TN.ops||!TN.ops.ready()){m.innerHTML='<h2>회원·권한 관리</h2><div class="card"><p class="muted">운영서버에 연결된 사이트에서만 사용할 수 있습니다.</p></div>';return;}
  var ctx=await TN.ops.context(), rows=await TN.ops.members();
  var deps=(ctx.departments&&ctx.departments.length?ctx.departments:((window.TN_ORG&&window.TN_ORG.departments)||[])).map(function(d){return {code:d.code,name:d.name,lead:d.lead||""};});
  var deptName=function(c){var d=deps.filter(function(x){return x.code===c;})[0];return d?d.name:c;};
  m.innerHTML='<div class="bar"><h2>회원·권한 관리</h2></div><div class="card"><p>사이트에 <b>가입하고 메일 인증을 마친 계정</b>만 이 목록에 나타납니다. 이름이 아니라 <b>이메일과 본인</b>을 확인한 뒤 역할을 추가하세요.</p><p class="muted">관리자가 쓰는 기사는 이 권한 없이 바로 발행됩니다. 아래 역할은 편집위원·발행인이 <a href="editor.html" target="_blank" rel="noopener">공동 편집실</a>에서 단계별 검토에 참여할 때 필요합니다. 권한 삭제와 계정 정지는 아직 지원하지 않습니다.</p><div class="filters"><input id="msq" placeholder="이름 또는 이메일 검색"></div></div><div id="mlist"></div>';
  function draw(){
    var q=$("#msq").value.trim().toLowerCase();
    var list=rows.filter(function(r){return (String(r.name||"")+" "+String(r.email||"")).toLowerCase().indexOf(q)>=0;});
    $("#mlist").innerHTML=list.length?list.map(function(r){
      return '<form class="card form mf" data-id="'+E(r.id)+'"><h3>'+E(r.name||"이름 미등록")+' <small class="muted">'+E(r.email)+'</small></h3><p>'+((r.roles||[]).length?(r.roles||[]).map(function(x){return '<span class="pill ok">'+E(ROLE_LABEL[x.role]||x.role)+(x.department_code?' · '+E(deptName(x.department_code)):'')+'</span> ';}).join(""):'<span class="muted">부여된 역할 없음</span>')+'</p>'+
       '<div class="g3"><div><label>추가할 역할</label><select name="role" required><option value="">선택</option>'+Object.keys(ROLE_LABEL).map(function(k){return '<option value="'+k+'">'+ROLE_LABEL[k]+'</option>';}).join("")+'</select></div><div><label>담당 부서</label><select name="dept" disabled><option value="">해당 없음</option>'+deps.map(function(d){return '<option value="'+E(d.code)+'">'+E(d.name)+(d.lead?' ('+E(d.lead)+')':'')+'</option>';}).join("")+'</select></div><div><label class="sp">&nbsp;</label><button class="b">이 계정에 역할 추가</button></div></div></form>';
    }).join(""):'<div class="card muted">조건에 맞는 가입 회원이 없습니다.</div>';
    [].forEach.call(document.querySelectorAll("form.mf"),function(f){
      f.elements.role.onchange=function(){var need=["writer","department_editor"].indexOf(f.elements.role.value)>=0;f.elements.dept.disabled=!need;f.elements.dept.required=need;if(!need)f.elements.dept.value="";};
      f.onsubmit=async function(e){e.preventDefault();var role=f.elements.role.value,code=f.elements.dept.value,mem=rows.filter(function(x){return String(x.id)===f.dataset.id;})[0];
        if(!role)return;if(!confirm((mem.email||"")+" 계정에 \""+ROLE_LABEL[role]+(code?" · "+deptName(code):"")+"\" 역할을 추가할까요?"))return;
        var btn=f.querySelector("button");btn.disabled=true;
        try{await TN.ops.assign(f.dataset.id,role,code||null);rows=await TN.ops.members();toast("역할을 추가했습니다.");draw();}catch(err){toast("실패: "+err.message,1);btn.disabled=false;}};
    });
  }
  $("#msq").oninput=draw;draw();
};
/* ---------- 선교 네트워크 관리 (숨김·복구·신고 확인) ---------- */
VIEWS.network=async function(m){
  if(!TN.net||!TN.net.ready()){m.innerHTML='<h2>선교 네트워크 관리</h2><div class="card muted">운영서버에 연결된 사이트에서만 사용할 수 있습니다.</div>';return;}
  var rows=await TN.net.adminList(), KIND={news:"선교사 소식",prayer:"긴급기도",event:"협력 행사"}, filter="all";
  m.innerHTML='<div class="bar"><h2>선교 네트워크 관리</h2><a class="b line" href="network.html" target="_blank" rel="noopener">선교 네트워크 보기 ↗</a></div>'+
   '<div class="card"><p>가입한 목사·선교사가 올린 글은 <b>바로 공개</b>됩니다. 부적절한 글은 <b>숨김</b>으로 내리고, 필요하면 <b>다시 공개</b>할 수 있습니다. 삭제는 하지 않습니다.</p><p class="muted">신고가 들어온 글이 위쪽에 표시됩니다. 운영 관리자, 편집인, 발행인, 부서 편집위원이 처리할 수 있습니다.</p>'+
   '<div class="filters"><select id="nwf"><option value="all">전체 글</option><option value="reported">신고된 글</option><option value="hidden">숨긴 글</option><option value="published">공개 중</option></select></div></div><div id="nwl"></div>';
  function draw(){
    var list=rows.filter(function(r){return filter==="all"||(filter==="reported"?r.report_count>0:r.status===filter);});
    $("#nwl").innerHTML=list.length?'<div class="card"><table class="tbl"><thead><tr><th>상태</th><th>구분</th><th>제목</th><th>작성자</th><th>신고</th><th>작성일</th><th></th></tr></thead><tbody>'+list.map(function(r){
      var hid=r.status==="hidden";
      return '<tr><td><span class="pill'+(hid?'':' ok')+'">'+(hid?(r.hidden_reason==="작성자 비공개"?"작성자 비공개":"숨김"):"공개")+'</span></td><td>'+E(KIND[r.kind]||r.kind)+'</td><td><a href="network.html?id='+r.id+'" target="_blank" rel="noopener">'+E(r.title)+'</a>'+
       (r.reports&&r.reports.length?'<div class="muted" style="font-size:13px;margin-top:4px">신고: '+r.reports.map(function(x){return E(x.reason);}).join(" / ")+'</div>':'')+(hid&&r.hidden_reason?'<div class="muted" style="font-size:13px">숨김 사유: '+E(r.hidden_reason)+'</div>':'')+'</td>'+
       '<td>'+E(r.author_label)+'<div class="muted" style="font-size:12px">'+E(r.author_email||"")+'</div></td><td>'+(r.report_count?'<b style="color:#c0392b">'+r.report_count+'</b>':'0')+'</td><td>'+TN.fmt(r.created_at,true).slice(0,10)+'</td>'+
       '<td class="act">'+(hid?(r.hidden_reason==="작성자 비공개"?'<span class="muted">작성자 관리</span>':'<a href="#" data-restore="'+r.id+'">다시 공개</a>'):'<a href="#" class="dng" data-hide="'+r.id+'">숨김</a>')+'</td></tr>';
    }).join("")+'</tbody></table></div>':'<div class="card muted">해당하는 글이 없습니다.</div>';
    [].forEach.call(document.querySelectorAll("[data-hide]"),function(a){a.onclick=async function(e){e.preventDefault();var why=prompt("숨기는 이유를 적어 주세요. (운영 기록에 남습니다)","");if(why===null)return;try{await TN.net.moderate(a.dataset.hide,"hide",why);toast("숨겼습니다.");rows=await TN.net.adminList();draw();}catch(err){toast("실패: "+err.message,1);}};});
    [].forEach.call(document.querySelectorAll("[data-restore]"),function(a){a.onclick=async function(e){e.preventDefault();if(!confirm("이 글을 다시 공개할까요?"))return;try{await TN.net.moderate(a.dataset.restore,"restore","");toast("다시 공개했습니다.");rows=await TN.net.adminList();draw();}catch(err){toast("실패: "+err.message,1);}};});
  }
  $("#nwf").onchange=function(){filter=this.value;draw();};
  draw();
};
/* ---------- 배너 ---------- */
VIEWS.banners=async function(m){
  var bs=(await TN.list("banners",{})).data||[];
  m.innerHTML='<h2>배너</h2><p class="muted">사이트 곳곳의 광고 자리입니다. 각 칸은 <b>그 자리 하나만</b> 바꾸며, 다른 기사·배너에는 영향이 없습니다. <b>저장하면 방문자 화면에 바로 반영됩니다</b>(임시저장 없음). 배너를 잠시 내리려면 <b>사이트에 보이기</b> 체크를 끄고 저장하세요. 그 자리의 틀까지 사라집니다.</p><div class="card form"><h3>양쪽 세로 배너(스카이스크래퍼) 표시 위치</h3><p class="muted">세로 배너는 넓은 화면(가로 1720px 이상)에서만 보이고, 방문자는 X 버튼으로 닫을 수 있습니다.</p><div class="g3"><div><select id="skyscope"><option value="home">첫 화면에서만 (권장)</option><option value="all">모든 화면</option><option value="off">보이지 않기</option></select></div><div><button type="button" class="b" id="skysave">표시 위치 저장</button></div></div></div><div class="bgrid">'+TN.BANNER_SLOTS.map(function(s){
    var b=bs.filter(function(x){return x.slot===s.slot;})[0]||{};
    return '<form class="card form bn" data-slot="'+s.slot+'"><h3>'+s.label+' <small class="muted">'+s.size+'</small></h3><div class="bpv">'+(b.image_url?'<img src="'+E(b.image_url)+'">':'<span class="muted">이미지 없음</span>')+'</div><input type="file" accept="image/*"><label>링크 주소</label><input name="link_url" value="'+E(b.link_url||"")+'" placeholder="https://"><label class="chk"><input type="checkbox" name="active"'+(b.active!==false?" checked":"")+'> 사이트에 보이기 <small class="muted">(끄면 이 자리가 사라짐)</small></label><p><button class="b">저장 (바로 공개)</button> '+(b.id?'<a href="#" class="b line dng rm">이 자리 비우기</a>':"")+'</p><input type="hidden" name="image_url" value="'+(b.image_url&&b.image_url.indexOf("data:")===0?"":E(b.image_url||""))+'"><input type="hidden" name="id" value="'+(b.id||"")+'"></form>';
  }).join("")+'</div>';
  try{ var ss=await TN.settings(); $("#skyscope").value=ss.sky_banner_scope||"home"; }catch(_){}
  $("#skysave").onclick=async function(){ try{ await TN.saveSetting("sky_banner_scope",$("#skyscope").value); toast("세로 배너 표시 위치를 저장했습니다."); }catch(err){ toast("저장 실패: "+err.message,1); } };
  [].forEach.call(document.querySelectorAll("form.bn"),function(f){
    var img=(bs.filter(function(x){return x.slot===f.dataset.slot;})[0]||{}).image_url||"";
    f.querySelector("input[type=file]").onchange=async function(){ try{ img=await TN.upload(this.files[0]); f.querySelector(".bpv").innerHTML='<img src="'+E(img)+'">'; }catch(e){toast(e.message,1);} };
    f.onsubmit=async function(e){ e.preventDefault(); var fd=new FormData(f); var row={slot:f.dataset.slot,image_url:img||null,link_url:fd.get("link_url")||null,active:!!fd.get("active"),title:TN.BANNER_SLOTS.filter(function(s){return s.slot===f.dataset.slot;})[0].label}; if(row.link_url&&!TN.safeLink(row.link_url)){toast("올바른 http 또는 https 링크를 입력해주세요.",1);return;} if(fd.get("id")) row.id=+fd.get("id");
      try{ await TN.save("banners",row); toast("저장했습니다."); route(); }catch(err){toast("저장 실패: "+err.message,1);} };
    var rm=f.querySelector(".rm"); if(rm) rm.onclick=async function(e){ e.preventDefault(); if(!confirm("이 자리의 배너 설정(이미지·링크)을 비울까요?\n이 칸만 비워지고 다른 배너와 기사에는 영향이 없습니다. 방문자 화면에서 바로 사라집니다."))return; await TN.del("banners",f.querySelector("[name=id]").value); route(); };
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
  var T=[["site_name","사이트 이름"],["site_en","영문 이름(로고 아래)"],["address","주소"],["phone","대표전화"],["youth_officer","청소년보호책임자"],["reg_title","제호"],["reg_no","등록번호"],["reg_date","등록일"],["publisher","발행인"],["editor_in_chief","편집인"],["copyright","저작권 문구"]];
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


/* ---------- 선교사·기자단 신청 승인 ---------- */
VIEWS.applications=async function(m){
 if(!TN.member||!TN.member.ready()){m.innerHTML='<h2>선교사·기자단 승인</h2><div class="card">회원 인증·승인 서버 연결이 필요합니다.</div>';return;}
 if(!await TN.isAdmin())throw new Error("관리자 권한이 필요합니다.");
 var rows=await TN.member.adminApplications(),members=await TN.member.adminMembers();
 var labels={pending:"승인 대기",approved:"승인",rejected:"반려",suspended:"중지"};
 m.innerHTML='<h2>선교사·기자단 승인</h2><div class="card"><p>'+(TN.demo?'브라우저 안에서만 작동하는 승인 시연입니다. 다른 기기의 신청과 공유되지 않습니다. 실제 개인정보를 입력하지 마세요.':'신청 내용을 검토한 뒤 작성 권한을 승인하세요.')+'</p><p>회원 '+members.length+'명 · 승인 대기 '+rows.filter(function(a){return a.status==="pending";}).length+'건</p><a class="b line" href="member.html?mode=apply" target="_blank" rel="noopener">신청 화면 보기</a> <button class="b line" id="refresh-members">새로고침</button></div><div class="filters"><label for="af">상태</label><select id="af"><option value="all">전체</option><option value="pending">승인 대기</option><option value="approved">승인</option><option value="rejected">반려</option></select><label for="ak">유형</label><select id="ak"><option value="all">전체</option><option value="missionary">선교사</option><option value="reporter">기자단</option></select></div><div id="application-list"></div>';
 function draw(){var status=$("#af").value,k=$("#ak").value;var filtered=rows.filter(function(a){return(status==="all"||a.status===status)&&(k==="all"||a.kind===k);});
 $("#application-list").innerHTML=filtered.length?filtered.map(function(a){return '<article class="card" data-app="'+a.id+'"><h3>'+E(a.name)+' · '+(a.kind==="missionary"?'선교사':'기자단')+' <span class="pill '+(a.status==="approved"?'ok':'')+'">'+E(labels[a.status]||a.status)+'</span></h3><p>'+E(a.email)+'<br>소속: '+E(a.organization)+' · 활동 지역: '+E(a.region)+'</p><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+E(a.introduction)+'</p><small>신청: '+TN.fmt(a.created_at,true)+'</small>'+(a.status==="pending"?'<form class="form review-form"><label for="note-'+a.id+'">검토 메모 (신청자에게 표시)</label><textarea id="note-'+a.id+'" name="note" maxlength="500" rows="2"></textarea><p><button class="b" name="decision" value="approved">승인</button> <button class="b line" name="decision" value="rejected">반려</button></p><p class="review-msg" role="status" aria-live="polite"></p></form>':'<p>처리: '+TN.fmt(a.reviewed_at,true)+'<br>검토 메모: '+E(a.review_note||'없음')+'</p>')+'</article>';}).join(''):'<div class="card"><p>해당 신청이 없습니다.</p></div>';
 document.querySelectorAll('.review-form').forEach(function(f){f.onsubmit=async function(e){e.preventDefault();var decision=e.submitter&&e.submitter.value;if(!decision)return;var id=f.closest('[data-app]').dataset.app;f.querySelectorAll('button').forEach(function(b){b.disabled=true;});try{await TN.member.review(id,decision,f.elements.note.value);toast(decision==="approved"?"작성 권한을 승인했습니다.":"반려했습니다.");await VIEWS.applications(m);}catch(err){f.querySelector('.review-msg').textContent=err.message;f.querySelectorAll('button').forEach(function(b){b.disabled=false;});}};});
 }
 $("#af").onchange=draw;$("#ak").onchange=draw;$("#refresh-members").onclick=function(){VIEWS.applications(m).catch(function(e){toast(e.message,1);});};draw();
};

/* ---------- 시작 ---------- */
(async function(){ if(TN.ready)await TN.ready; if(TN.user() && await TN.isAdmin()) start(); else loginView(); })();
})();
