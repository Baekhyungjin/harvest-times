/* 하베스트 타임스 회원/기자단/선교사 화면. member.html?mode=join|login|apply|write|account */
(function(){
"use strict";
if(!window.TNUI||typeof TNUI.boot!=="function"){
  var r0=document.getElementById("member-root");
  if(r0) r0.textContent="화면 구성 스크립트를 불러오지 못했습니다. 새로고침해 주세요.";
  return;
}

var MODES=["join","login","apply","write","account"];
var LABEL={join:"회원가입",login:"로그인",apply:"선교사·기자단 신청",write:"글쓰기",account:"마이페이지"};
var LEAD={
  join:"회원가입 후 선교사 또는 기자단으로 신청하면, 관리자 승인 뒤 글을 작성할 수 있습니다.",
  login:"가입한 이메일과 비밀번호로 로그인합니다.",
  apply:"선교사 또는 기자단으로 활동하려면 신청서를 제출해 주세요. 관리자가 확인한 뒤 승인합니다.",
  write:"승인된 유형으로만 글을 작성할 수 있습니다. 저장한 글은 초안으로 보관되어 관리자의 검토를 기다립니다.",
  account:"내 신청 현황과 작성한 글을 확인합니다."
};
var KIND={missionary:"선교사",reporter:"기자단"};
var APP_STATUS={pending:"대기",approved:"승인",rejected:"반려",suspended:"중지"};
var ART_STATUS={draft:"초안 · 검토 대기",pending:"검토 중",review:"검토 중",published:"게시됨",rejected:"반려",archived:"보관"};
var FLASH={
  join:"회원가입이 완료되었습니다. 다음 단계로 선교사 또는 기자단 신청을 진행해 주세요.",
  login:"로그인했습니다.",
  logout:"로그아웃했습니다.",
  apply:"신청이 접수되었습니다. 관리자 승인 전까지 글쓰기는 열리지 않습니다.",
  write:"글이 초안(draft)으로 저장되었고 관리자 검토를 요청했습니다. 승인 전에는 공개되지 않습니다."
};
var DEMO_CONFIRM="데모 체험이며 실제 개인정보와 사용 중인 비밀번호를 입력하지 않습니다.";
var EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function E(s){return TN.esc(s);}
function url(mode,done){return "member.html?mode="+mode+(done?"&done="+done:"");}
function fmtDate(v){
  if(!v) return "";
  var d=new Date(v);
  if(isNaN(d.getTime())) return "";
  var p=function(n){return String(n).padStart(2,"0");};
  return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
}
function errMsg(e){
  var m=e&&e.message?String(e.message):"";
  return m||"요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
function rnd(len,chars){
  var out="", buf=new Uint32Array(len);
  (window.crypto||window.msCrypto).getRandomValues(buf);
  for(var i=0;i<len;i++) out+=chars.charAt(buf[i]%chars.length);
  return out;
}
function badge(status,map){
  var key=String(status||"");
  var label=map[key]||key||"알 수 없음";
  var cls=map===APP_STATUS?"is-"+(APP_STATUS[key]?key:"suspended"):(key==="published"?"is-approved":key==="rejected"?"is-rejected":"is-draft");
  return '<span class="member-badge '+cls+'" data-testid="status-'+E(key)+'">'+E(label)+'</span>';
}

/* ---------- 폼 도우미 ---------- */
function field(o){
  var id="member-f-"+o.name, desc=[];
  if(o.hint) desc.push(id+"-hint");
  desc.push(id+"-err");
  var attrs=' id="'+id+'" name="'+o.name+'" class="member-input'+(o.cls?" "+o.cls:"")+'" aria-describedby="'+desc.join(" ")+'" data-testid="field-'+o.name+'"'+(o.required?' aria-required="true"':'');
  var ctrl;
  if(o.tag==="textarea"){
    ctrl='<textarea'+attrs+' rows="'+(o.rows||5)+'"'+(o.max?' maxlength="'+o.max+'"':'')+'></textarea>';
  }else if(o.tag==="select"){
    ctrl='<select'+attrs+'>'+o.options+'</select>';
  }else{
    ctrl='<input'+attrs+' type="'+(o.type||"text")+'"'+(o.auto?' autocomplete="'+o.auto+'"':'')+(o.max?' maxlength="'+o.max+'"':'')+(o.type==="email"?' inputmode="email" autocapitalize="off" spellcheck="false"':'')+'>';
  }
  return '<div class="member-field"><label class="member-label" for="'+id+'">'+E(o.label)+(o.required?'<span class="member-req" aria-hidden="true">*</span><span class="member-sr"> (필수)</span>':' (선택)')+'</label>'+ctrl+
    (o.hint?'<p class="member-hint" id="'+id+'-hint">'+E(o.hint)+'</p>':'')+
    '<p class="member-err" id="'+id+'-err" data-err-for="'+o.name+'"></p></div>';
}
function statusBox(){return '<div class="member-status" role="status" aria-live="assertive" aria-atomic="true" data-role="status" data-testid="form-status"></div>';}
function setStatus(box,text,type){
  if(!box) return;
  box.className="member-status"+(text?(type==="error"?" is-error":" is-info"):"");
  box.textContent=text||"";
}
function val(form,name){var el=form.elements[name];return el?String(el.value):"";}
function showErrors(form,errs){
  var first=null;
  [].forEach.call(form.querySelectorAll(".member-input"),function(el){el.removeAttribute("aria-invalid");});
  [].forEach.call(form.querySelectorAll("[data-err-for]"),function(p){
    var n=p.getAttribute("data-err-for");
    p.textContent=errs[n]||"";
    var el=form.elements[n];
    if(errs[n]&&el){el.setAttribute("aria-invalid","true");if(!first) first=el;}
  });
  if(first){first.focus();return true;}
  return false;
}
function setBusy(form,on){
  form.setAttribute("aria-busy",on?"true":"false");
  [].forEach.call(form.querySelectorAll('button[type="submit"]'),function(b){b.disabled=on||b.hasAttribute("data-locked");});
}
function bindForm(form,ctx,validate,action){
  var box=form.querySelector('[data-role="status"]');
  form.addEventListener("submit",async function(ev){
    ev.preventDefault();
    if(!ctx.ready){setStatus(box,"회원 기능 서버 연결이 끝나지 않아 지금은 제출할 수 없습니다.","error");return;}
    if(form.getAttribute("aria-busy")==="true") return;
    var errs=validate(form)||{};
    if(showErrors(form,errs)){setStatus(box,"입력 내용을 확인해 주세요.","error");return;}
    setStatus(box,"처리 중입니다.","info");
    setBusy(form,true);
    try{ await action(form,box); }
    catch(e){ setStatus(box,errMsg(e),"error"); setBusy(form,false); }
  });
}
function lockIfNotReady(root,ctx){
  if(ctx.ready) return;
  [].forEach.call(root.querySelectorAll("form.member-form"),function(f){
    [].forEach.call(f.querySelectorAll("input,select,textarea,button"),function(el){
      el.disabled=true;
      if(el.type==="submit") el.setAttribute("data-locked","1");
    });
  });
}
async function ensureSession(ctx,email,pw){
  var u=null;
  try{u=await ctx.m.current();}catch(e){u=null;}
  if(!u) await ctx.m.login(email,pw);
}

/* ---------- 공통 조각 ---------- */
function notice(text,cls,testid){return '<p class="member-notice'+(cls?" "+cls:"")+'" role="note"'+(testid?' data-testid="'+testid+'"':'')+'>'+E(text)+'</p>';}
function tabs(mode){
  return '<nav aria-label="회원 메뉴"><ul class="member-tabs">'+MODES.map(function(k){
    return '<li><a class="member-tab" data-testid="tab-'+k+'" href="'+url(k)+'"'+(k===mode?' aria-current="page"':'')+'>'+E(LABEL[k])+'</a></li>';
  }).join("")+'</ul></nav>';
}
function steps(stage){
  var items=[["회원가입","계정 만들기"],["신청","선교사·기자단"],["관리자 승인","검토 대기"],["작성","글 초안 저장"]];
  return '<ol class="member-steps" aria-label="이용 순서" data-testid="member-steps">'+items.map(function(it,i){
    var cls=i<stage?"is-done":(i===stage?"is-current":"");
    var st=i<stage?"완료":(i===stage?"현재 단계":"");
    return '<li class="member-step '+cls+'"'+(i===stage?' aria-current="step"':'')+'>'+E(it[0])+'<small>'+E(it[1])+(st?' · '+st:'')+'</small></li>';
  }).join("")+'</ol>';
}
function loginRequired(){
  return '<section class="member-card member-narrow" data-testid="member-login-required"><h2>로그인이 필요합니다</h2><p>이 화면은 로그인한 회원만 볼 수 있습니다.</p>'+
    '<div class="member-actions"><a class="member-btn" href="'+url("login")+'">로그인하기</a><a class="member-btn is-ghost" href="'+url("join")+'">회원가입하기</a></div></section>';
}
function stageOf(user,apps){
  if(!user) return 0;
  if(apps.some(function(a){return a.status==="approved";})) return 3;
  if(apps.some(function(a){return a.status==="pending";})) return 2;
  return 1;
}

/* ---------- 화면별 렌더 ---------- */
function alreadyIn(ctx,extra){
  return '<section class="member-card member-narrow" data-testid="already-logged-in"><h2>이미 로그인되어 있습니다</h2><p>'+E(ctx.user.name||ctx.user.email||"회원")+'님으로 로그인 중입니다.</p><div class="member-actions"><a class="member-btn" href="'+url("account")+'">마이페이지로 이동</a>'+(extra||"")+'</div></section>';
}
function viewJoin(ctx){
  if(ctx.user) return alreadyIn(ctx,'<a class="member-btn is-ghost" href="'+url("apply")+'">선교사·기자단 신청</a>');
  var oauth=ctx.oauth;
  function soc(p,label){
    var on=oauth.indexOf(p)>=0&&ctx.ready;
    return '<button type="button" class="member-btn is-ghost" data-social="'+p+'" data-testid="social-'+p+'"'+(on?'':' disabled aria-disabled="true"')+' aria-label="'+E(label)+'로 간편가입'+(on?'':' (인증 서버 연결 후 사용)')+'">'+E(label)+(on?'':'<small>인증 서버 연결 후 사용</small>')+'</button>';
  }
  return '<section class="member-card member-narrow" aria-labelledby="member-join-h"><h2 id="member-join-h">이메일로 회원가입</h2>'+
    '<form class="member-form" id="member-join-form" novalidate data-testid="join-form"><fieldset>'+
    field({name:"name",label:"이름",required:true,auto:"name",max:40})+
    field({name:"email",label:"이메일",type:"email",required:true,auto:"email",max:120})+
    field({name:"password",label:"비밀번호",type:"password",required:true,auto:"new-password",hint:"8자 이상 입력해 주세요.",max:100})+
    field({name:"confirm",label:"비밀번호 확인",type:"password",required:true,auto:"new-password",max:100})+
    (TN.demo?'<div class="member-field"><label class="member-check" for="member-f-demoOk"><input type="checkbox" id="member-f-demoOk" name="demoOk" aria-describedby="member-f-demoOk-err" data-testid="field-demoOk"><span>'+E(DEMO_CONFIRM)+'<span class="member-req" aria-hidden="true"> *</span><span class="member-sr"> (필수)</span></span></label><p class="member-err" id="member-f-demoOk-err" data-err-for="demoOk"></p></div>':
      '<p class="member-hint">이용약관과 개인정보처리방침은 현재 임시 안내 문서입니다. 가입 동의를 대신하지 않습니다.</p>')+
    '<div class="member-actions"><button type="submit" class="member-btn" data-testid="join-submit">회원가입</button><a class="member-btn is-ghost" href="'+url("login")+'">이미 계정이 있어요</a></div>'+
    statusBox()+'</fieldset></form>'+
    '<div class="member-divider">간편가입</div>'+
    '<div class="member-social" role="group" aria-label="간편가입">'+soc("google","Google")+soc("kakao","카카오")+'</div>'+
    '<p class="member-hint" data-testid="oauth-note">'+(oauth.length&&ctx.ready?'간편가입은 외부 인증 화면에서 진행됩니다.':'간편가입은 인증 서버가 연결된 뒤에만 사용할 수 있습니다. 지금은 이메일 가입도 이 브라우저 안의 데모 체험으로만 가능합니다.')+'</p>'+
    (TN.demo?'<div class="member-divider">데모 체험</div>'+
      '<div data-testid="demo-account-box"><p>입력 없이 체험하려면 임시 체험 계정을 만들 수 있습니다. 이 브라우저에만 저장되는 시험용 계정입니다.</p>'+
      '<button type="button" class="member-btn is-gold" id="member-demo-btn" data-testid="demo-account-btn">데모 체험계정 만들기</button>'+
      '<div class="member-status" role="status" aria-live="assertive" aria-atomic="true" id="member-demo-status" data-testid="demo-status"></div></div>':'')+
    '</section>';
}
function viewLogin(ctx){
  if(ctx.user) return alreadyIn(ctx,"");
  return '<section class="member-card member-narrow" aria-labelledby="member-login-h"><h2 id="member-login-h">이메일로 로그인</h2>'+
    '<form class="member-form" id="member-login-form" novalidate data-testid="login-form"><fieldset>'+
    field({name:"email",label:"이메일",type:"email",required:true,auto:"email",max:120})+
    field({name:"password",label:"비밀번호",type:"password",required:true,auto:"current-password",max:100})+
    '<div class="member-actions"><button type="submit" class="member-btn" data-testid="login-submit">로그인</button><a class="member-btn is-ghost" href="'+url("join")+'">회원가입</a></div>'+
    statusBox()+'</fieldset></form></section>';
}
function viewApply(ctx){
  if(!ctx.user) return loginRequired();
  var taken={};
  ctx.apps.forEach(function(a){ if(a.status==="pending"||a.status==="approved"||a.status==="suspended") taken[a.kind]=a.status; });
  var opts=Object.keys(KIND).map(function(k){
    var t=taken[k];
    return '<option value="'+k+'"'+(t?' disabled':'')+'>'+E(KIND[k]+(t?" ("+APP_STATUS[t]+" 상태라 신청 불가)":""))+'</option>';
  }).join("");
  var avail=Object.keys(KIND).filter(function(k){return !taken[k];});
  var h='<section class="member-card member-narrow" aria-labelledby="member-apply-h"><h2 id="member-apply-h">선교사·기자단 신청</h2>';
  if(!avail.length){
    return h+'<p data-testid="apply-none">신청할 수 있는 유형이 없습니다. 현재 신청 현황은 마이페이지에서 확인해 주세요.</p><div class="member-actions"><a class="member-btn" href="'+url("account")+'">마이페이지</a></div></section>';
  }
  return h+'<p>신청서는 관리자가 확인한 뒤 승인 또는 반려합니다. 승인 전에는 글쓰기가 열리지 않습니다.</p>'+
    '<form class="member-form" id="member-apply-form" novalidate data-testid="apply-form"><fieldset>'+
    field({name:"kind",label:"신청 유형",tag:"select",required:true,options:'<option value="">선택해 주세요</option>'+opts})+
    field({name:"organization",label:"소속 단체",required:true,hint:"파송 단체, 교회, 기관 또는 매체명을 적어 주세요.",max:100})+
    field({name:"region",label:"활동 지역",required:true,hint:"예: 국가와 도시. 공개하기 곤란하면 광역 단위로 적어도 됩니다.",max:100})+
    field({name:"introduction",label:"소개와 활동 내용",tag:"textarea",rows:6,required:true,hint:"20자 이상, 1000자 이내. 일반 글자로만 입력하며 HTML은 사용할 수 없습니다.",max:1000})+
    '<div class="member-actions"><button type="submit" class="member-btn is-gold" data-testid="apply-submit">신청서 제출</button><a class="member-btn is-ghost" href="'+url("account")+'">취소</a></div>'+
    statusBox()+'</fieldset></form></section>';
}
function viewWrite(ctx){
  if(!ctx.user) return loginRequired();
  var kinds=ctx.writable;
  if(!kinds.length){
    var pending=ctx.apps.some(function(a){return a.status==="pending";});
    return '<section class="member-card member-narrow" data-testid="write-denied"><h2>글쓰기 권한이 없습니다</h2>'+
      '<p>'+(pending?'신청이 아직 관리자 승인 대기 중입니다. 승인되면 이 화면에서 글을 쓸 수 있습니다.':'선교사 또는 기자단으로 승인된 계정만 글을 작성할 수 있습니다. 먼저 신청서를 제출해 주세요.')+'</p>'+
      '<div class="member-actions"><a class="member-btn is-gold" href="'+url("apply")+'">선교사·기자단 신청</a><a class="member-btn is-ghost" href="'+url("account")+'">신청 현황 보기</a></div></section>';
  }
  var opts=kinds.map(function(k){return '<option value="'+k+'">'+E(KIND[k]||k)+'</option>';}).join("");
  return '<section class="member-card" aria-labelledby="member-write-h"><h2 id="member-write-h">글쓰기</h2>'+
    notice("저장하면 초안(draft)으로 보관되고 관리자 검토를 요청합니다. 관리자가 승인하기 전에는 공개되지 않습니다. 제목·요약·본문은 일반 글자로만 입력하며 HTML은 지원하지 않습니다.","","write-note")+
    '<form class="member-form" id="member-write-form" novalidate data-testid="write-form"><fieldset>'+
    field({name:"kind",label:"작성 유형",tag:"select",required:true,options:opts,hint:"승인된 유형만 선택할 수 있습니다."})+
    field({name:"title",label:"제목",required:true,hint:"5자 이상, 120자 이내.",max:120})+
    field({name:"summary",label:"요약",tag:"textarea",rows:3,hint:"목록에 보일 짧은 설명입니다. 300자 이내.",max:300})+
    field({name:"body",label:"본문",tag:"textarea",required:true,rows:14,cls:"member-body",hint:"20자 이상. 줄바꿈은 그대로 저장됩니다. 직접 확인한 사실만 적어 주세요.",max:20000})+
    '<div class="member-actions"><button type="submit" class="member-btn is-gold" data-testid="write-submit">초안으로 저장하고 검토 요청</button><a class="member-btn is-ghost" href="'+url("account")+'">취소</a></div>'+
    statusBox()+'</fieldset></form></section>';
}
function viewAccount(ctx){
  if(!ctx.user) return loginRequired();
  var u=ctx.user;
  var appsHtml=ctx.apps.length?'<ul class="member-list" data-testid="my-applications">'+ctx.apps.map(function(a){
    return '<li class="member-item" data-testid="application-item"><div class="member-item-top"><span class="member-item-title">'+E(KIND[a.kind]||a.kind||"신청")+'</span>'+badge(a.status,APP_STATUS)+'</div>'+
      '<p class="member-meta">'+E([a.organization,a.region].filter(Boolean).join(" · "))+(a.created_at?' · 접수 '+E(fmtDate(a.created_at)):'')+'</p>'+
      (a.review_note?'<p class="member-meta">관리자 검토 메모: '+E(a.review_note)+'</p>':'')+
      (a.status==="rejected"?'<p class="member-meta">반려되었습니다. 내용을 보완해 다시 신청할 수 있습니다.</p>':'')+
      (a.status==="suspended"?'<p class="member-meta">활동이 중지되었습니다. 문의는 관리자에게 해 주세요.</p>':'')+'</li>';
  }).join("")+'</ul>':'<p class="member-empty" data-testid="no-applications">아직 제출한 신청이 없습니다.</p>';
  var artsHtml=ctx.articles.length?'<ul class="member-list" data-testid="my-articles">'+ctx.articles.map(function(a){
    var t=E(a.title||"(제목 없음)");
    var link=a.status==="published"&&a.id!=null?'<a class="member-link" href="'+E(TNUI.artUrl(a))+'">'+t+'</a>':t;
    var d=fmtDate(a.created_at||a.updated_at);
    return '<li class="member-item" data-testid="article-item"><div class="member-item-top"><span class="member-item-title">'+link+'</span>'+badge(a.status,ART_STATUS)+'</div>'+
      '<p class="member-meta">'+E(d)+((a.member_kind||a.kind)&&KIND[a.member_kind||a.kind]?(d?' · ':'')+E(KIND[a.member_kind||a.kind]):'')+'</p></li>';
  }).join("")+'</ul>':'<p class="member-empty" data-testid="no-articles">저장한 글이 없습니다.</p>';
  var canW=ctx.writable.length>0;
  return '<section class="member-card" aria-labelledby="member-acc-h"><h2 id="member-acc-h">내 정보</h2>'+
    '<p><b>'+E(u.name||"이름 없음")+'</b> · '+E(u.email||"")+'</p>'+
    '<div class="member-actions"><a class="member-btn is-gold" href="'+url("apply")+'">선교사·기자단 신청</a>'+
    (canW?'<a class="member-btn" href="'+url("write")+'" data-testid="goto-write">글쓰기</a>':'<span class="member-hint" data-testid="write-locked">승인된 유형이 생기면 글쓰기가 열립니다.</span>')+'</div>'+
    (ctx.loadError?'<div class="member-status is-error" role="status" aria-live="assertive" data-testid="account-error">'+E(ctx.loadError)+'</div>':'')+'</section>'+
    '<div class="member-grid"><section class="member-card" aria-labelledby="member-apps-h"><h2 id="member-apps-h">내 신청</h2>'+appsHtml+'</section>'+
    '<section class="member-card" aria-labelledby="member-arts-h"><h2 id="member-arts-h">내 글</h2>'+artsHtml+'</section></div>';
}

/* ---------- 이벤트 연결 ---------- */
function bindJoin(root,ctx){
  var form=root.querySelector("#member-join-form");
  if(form){
    bindForm(form,ctx,function(f){
      var e={}, name=val(f,"name").trim(), email=val(f,"email").trim(), pw=val(f,"password"), cf=val(f,"confirm");
      if(!name) e.name="이름을 입력해 주세요.";
      if(!email) e.email="이메일을 입력해 주세요."; else if(!EMAIL_RE.test(email)) e.email="이메일 형식을 확인해 주세요.";
      if(!pw) e.password="비밀번호를 입력해 주세요."; else if(pw.length<8) e.password="비밀번호는 8자 이상이어야 합니다.";
      if(!cf) e.confirm="비밀번호를 한 번 더 입력해 주세요."; else if(pw&&cf!==pw) e.confirm="비밀번호가 서로 다릅니다.";
      if(TN.demo&&!(f.elements.demoOk&&f.elements.demoOk.checked)) e.demoOk="데모 체험 확인에 체크해 주세요.";
      return e;
    },async function(f){
      var email=val(f,"email").trim(), pw=val(f,"password");
      await ctx.m.register({name:val(f,"name").trim(),email:email,password:pw});
      await ensureSession(ctx,email,pw);
      f.elements.password.value="";f.elements.confirm.value="";
      location.assign(url("account","join"));
    });
  }
  var demo=root.querySelector("#member-demo-btn");
  if(demo){
    demo.addEventListener("click",async function(){
      var box=root.querySelector("#member-demo-status");
      if(!ctx.ready){setStatus(box,"회원 기능 서버 연결이 끝나지 않아 지금은 사용할 수 없습니다.","error");return;}
      demo.disabled=true;
      setStatus(box,"데모 체험계정을 만드는 중입니다.","info");
      try{
        var email="demo-"+rnd(10,"abcdefghjkmnpqrstuvwxyz23456789")+"@example.test";
        var pw="Dm!"+rnd(24,"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789");
        await ctx.m.register({name:"체험 회원",email:email,password:pw});
        await ensureSession(ctx,email,pw);
        pw=null;
        location.assign(url("account","join"));
      }catch(e){ setStatus(box,errMsg(e),"error"); demo.disabled=false; }
    });
  }
  [].forEach.call(root.querySelectorAll("[data-social]"),function(b){
    b.addEventListener("click",async function(){
      if(b.disabled) return;
      var box=root.querySelector('#member-join-form [data-role="status"]');
      setStatus(box,"인증 요청 중입니다.","info");
      try{
        await ctx.m.social(b.getAttribute("data-social"));
        var u=null; try{u=await ctx.m.current();}catch(e){}
        if(u) location.assign(url("account","login"));
        else setStatus(box,"인증 절차가 아직 끝나지 않았습니다. 인증 화면에서 계속해 주세요.","info");
      }catch(e){ setStatus(box,errMsg(e),"error"); }
    });
  });
}
function bindLogin(root,ctx){
  var form=root.querySelector("#member-login-form");
  if(!form) return;
  bindForm(form,ctx,function(f){
    var e={}, email=val(f,"email").trim();
    if(!email) e.email="이메일을 입력해 주세요."; else if(!EMAIL_RE.test(email)) e.email="이메일 형식을 확인해 주세요.";
    if(!val(f,"password")) e.password="비밀번호를 입력해 주세요.";
    return e;
  },async function(f){
    await ctx.m.login(val(f,"email").trim(),val(f,"password"));
    f.elements.password.value="";
    location.assign(url("account","login"));
  });
}
function bindApply(root,ctx){
  var form=root.querySelector("#member-apply-form");
  if(!form) return;
  bindForm(form,ctx,function(f){
    var e={}, k=val(f,"kind"), org=val(f,"organization").trim(), reg=val(f,"region").trim(), intro=val(f,"introduction").trim();
    if(!KIND[k]) e.kind="신청 유형을 선택해 주세요.";
    if(org.length<2) e.organization="소속 단체를 2자 이상 입력해 주세요.";
    if(reg.length<2) e.region="활동 지역을 2자 이상 입력해 주세요.";
    if(intro.length<20) e.introduction="소개와 활동 내용을 20자 이상 입력해 주세요.";
    return e;
  },async function(f){
    await ctx.m.apply({kind:val(f,"kind"),organization:val(f,"organization").trim(),region:val(f,"region").trim(),introduction:val(f,"introduction").trim()});
    location.assign(url("account","apply"));
  });
}
function bindWrite(root,ctx){
  var form=root.querySelector("#member-write-form");
  if(!form) return;
  bindForm(form,ctx,function(f){
    var e={}, k=val(f,"kind"), t=val(f,"title").trim(), b=val(f,"body").trim();
    if(ctx.writable.indexOf(k)<0) e.kind="승인된 작성 유형을 선택해 주세요.";
    if(t.length<5) e.title="제목은 5자 이상 입력해 주세요.";
    if(b.length<20) e.body="본문은 20자 이상 입력해 주세요.";
    return e;
  },async function(f){
    var k=val(f,"kind");
    var ok=false;
    try{ ok=await ctx.m.canWrite(k); }catch(e){ ok=false; }
    if(!ok) throw new Error("이 유형으로 글을 쓸 권한이 없습니다. 승인 상태를 확인해 주세요.");
    await ctx.m.submit({kind:k,title:val(f,"title").trim(),summary:val(f,"summary").trim(),body:val(f,"body").trim()});
    location.assign(url("account","write"));
  });
}

/* ---------- 부트스트랩 ---------- */
TNUI.boot(null,async function(U){
  var root=document.getElementById("member-root");
  if(!root){root=document.createElement("main");root.id="member-root";root.className="member-page";document.getElementById("app").appendChild(root);}
  root.removeAttribute("aria-live");
  var mode=U.q("mode");
  if(MODES.indexOf(mode)<0) mode="join";
  var done=U.q("done");
  var m=TN.member;
  document.title=LABEL[mode]+" | "+(U.S&&U.S.site_name?U.S.site_name:"하베스트 타임스");

  var head='<header class="member-head"><div><h1 class="member-title" id="member-title" tabindex="-1">'+E(LABEL[mode])+'</h1><p class="member-lead">'+E(LEAD[mode])+'</p></div><div data-role="userbar"></div></header>';
  if(!m||typeof m.current!=="function"){
    root.innerHTML='<div class="member-card" data-testid="member-unavailable"><h1 class="member-title">회원 기능을 불러오지 못했습니다</h1><p>회원 기능 스크립트(data.js)가 최신 버전이 아닙니다. 새로고침해도 같으면 관리자에게 알려 주세요.</p></div>';
    return;
  }
  var ctx={m:m,user:null,apps:[],articles:[],writable:[],oauth:[],ready:false,loadError:""};
  try{ ctx.ready=!!m.ready(); }catch(e){ ctx.ready=false; }
  try{ var o=m.enabledOAuth(); ctx.oauth=Array.isArray(o)?o:[]; }catch(e){ ctx.oauth=[]; }
  var errors=[];
  try{ ctx.user=await m.current(); }catch(e){ ctx.user=null; errors.push(errMsg(e)); }
  if(ctx.user){
    var tasks=[
      Promise.resolve().then(function(){return m.applications();}).then(function(r){ctx.apps=Array.isArray(r)?r:[];}),
      Promise.resolve().then(function(){return m.myArticles();}).then(function(r){ctx.articles=Array.isArray(r)?r:[];}),
      Promise.all(Object.keys(KIND).map(function(k){
        return Promise.resolve().then(function(){return m.canWrite(k);}).then(function(ok){return ok?k:null;});
      })).then(function(r){ctx.writable=r.filter(Boolean);})
    ];
    var res=await Promise.all(tasks.map(function(p){return p.then(function(){return null;},function(e){return errMsg(e);});}));
    res.forEach(function(x){if(x) errors.push(x);});
  }
  ctx.loadError=errors.length?errors[0]:"";

  var banner="";
  if(!ctx.ready) banner+=notice("회원 기능 서버 연결이 아직 완성되지 않았습니다. 지금은 실제 정보를 입력하거나 제출할 수 없습니다.","is-warn","member-not-ready");
  else if(TN.demo) banner+=notice("데모 모드입니다. 입력한 내용은 이 브라우저에만 저장되며 실제 회원 정보가 아닙니다.","","member-demo-note");
  if(FLASH[done]) banner+='<div class="member-notice is-ok" role="status" aria-live="polite" data-testid="member-flash">'+E(FLASH[done])+'</div>';
  if(ctx.loadError&&mode!=="account") banner+='<div class="member-status is-error" role="status" aria-live="assertive" data-testid="member-load-error">'+E(ctx.loadError)+'</div>';

  var view={join:viewJoin,login:viewLogin,apply:viewApply,write:viewWrite,account:viewAccount}[mode](ctx);
  root.innerHTML=head+tabs(mode)+steps(stageOf(ctx.user,ctx.apps))+banner+view;

  var ub=root.querySelector('[data-role="userbar"]');
  if(ctx.user&&ub){
    ub.className="member-userbar";
    ub.innerHTML='<span data-testid="current-user"><b>'+E(ctx.user.name||ctx.user.email||"회원")+'</b>님 로그인 중</span><button type="button" class="member-btn is-ghost is-small" id="member-logout" data-testid="logout-btn">로그아웃</button>';
    root.querySelector("#member-logout").addEventListener("click",function(){
      try{ m.logout(); }catch(e){}
      location.assign(url("login","logout"));
    });
  }

  lockIfNotReady(root,ctx);
  if(mode==="join") bindJoin(root,ctx);
  if(mode==="login") bindLogin(root,ctx);
  if(mode==="apply"){bindApply(root,ctx);var requested=U.q("kind"),select=root.querySelector('select[name="kind"]');if(select&&(requested==="missionary"||requested==="reporter")){var opt=select.querySelector('option[value="'+requested+'"]');if(opt&&!opt.disabled)select.value=requested;}}
  if(mode==="write") bindWrite(root,ctx);
});
})();
