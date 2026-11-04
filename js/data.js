(function(){
var C = window.TN_CONFIG || {};
var LIVE = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
var TN = window.TN = { live: LIVE, demo: !LIVE };

/* ---------- 기본 데이터(메뉴 구조) ---------- */
var SEED_SECTIONS = [{"id":1001,"parent_id":null,"name":"뉴스","code":"news","kind":"news","sort":1},{"id":1111,"parent_id":1001,"name":"하베스트 대학소식 (공지 / 행사)","code":"univ-news","kind":"news","sort":1},{"id":1112,"parent_id":1001,"name":"하베스트 강의소식","code":"lectures","kind":"news","sort":2},{"id":1113,"parent_id":1001,"name":"하베스트은퇴.노후복지소식","code":"retirement-welfare","kind":"news","sort":3},{"id":2001,"parent_id":null,"name":"매거진","code":"magazine","kind":"news","sort":2},{"id":2111,"parent_id":2001,"name":"커버스토리 / 특집","code":"cover-story","kind":"news","sort":1},{"id":2112,"parent_id":2001,"name":"선교 현장 리포트 & 인터뷰","code":"field-report","kind":"news","sort":2},{"id":2113,"parent_id":2001,"name":"포토스케치","code":"photo-sketch","kind":"photo","sort":3},{"id":2114,"parent_id":2001,"name":"PDF / 이북 보기","code":"archive","kind":"news","sort":4},{"id":3001,"parent_id":null,"name":"선교 네트워크","code":"mission-network","kind":"news","sort":3},{"id":3111,"parent_id":3001,"name":"파송선교사 현장 소식","code":"mission-updates","kind":"news","sort":1},{"id":3112,"parent_id":3001,"name":"선교단체 협력 행사 소식","code":"partner-events","kind":"news","sort":2},{"id":4001,"parent_id":null,"name":"칼럼","code":"columns","kind":"news","sort":4},{"id":4111,"parent_id":4001,"name":"교수·학자 칼럼","code":"scholar-column","kind":"news","sort":1},{"id":4112,"parent_id":4001,"name":"목회자 칼럼","code":"pastor-column","kind":"news","sort":2},{"id":4113,"parent_id":4001,"name":"선교사 칼럼","code":"missionary-column","kind":"news","sort":3},{"id":5001,"parent_id":null,"name":"독자 미디어","code":"reader-media","kind":"news","sort":5},{"id":5111,"parent_id":5001,"name":"임명된 독자 기자단 기고","code":"appointed-reporters","kind":"news","sort":1},{"id":5112,"parent_id":5001,"name":"기사 제보 및 참여","code":"report","kind":"board","sort":2},{"id":6001,"parent_id":null,"name":"타임 TV","code":"time-tv","kind":"news","sort":6},{"id":6111,"parent_id":6001,"name":"하베스트 영상 / 브이로그","code":"harvest-video","kind":"video","sort":1},{"id":6112,"parent_id":6001,"name":"후원 안내 및 참여하기","code":"support","kind":"page","sort":2}];
var SEED_SETTINGS = {
 site_name:"하베스트 타임스", site_en:"HARVEST TIMES", tagline:"",
 address:"[주소 입력]", phone:"[대표전화 입력]", youth_officer:"[청소년보호책임자 입력]",
 reg_title:"하베스트 타임스", reg_no:"[등록번호 입력]", reg_date:"[등록일 입력]", publisher:"[발행·편집인 입력]",
 copyright:"Copyright by 하베스트 타임스 All rights reserved.",
 home_block_1:"4001", home_block_2:"3001", home_block_3:"2113", side_box_1:"1112", side_box_2:"2111", side_box_3:"2114", focus_section:"2001"
};
var SEED_PAGES = [
 {slug:"about",title:"매체소개",body:"[매체소개 내용을 관리자에서 입력하세요]"},
 {slug:"terms",title:"이용약관",body:"[이용약관 내용을 관리자에서 입력하세요]"},
 {slug:"privacy",title:"개인정보처리방침",body:"[개인정보처리방침 내용을 관리자에서 입력하세요]"},
 {slug:"youth",title:"청소년보호정책",body:"[청소년보호정책 내용을 관리자에서 입력하세요]"},
 {slug:"copyright",title:"저작권보호정책",body:"[저작권보호정책 내용을 관리자에서 입력하세요]"},
 {slug:"email",title:"이메일무단수집거부",body:"[이메일무단수집거부 내용을 관리자에서 입력하세요]"},
 {slug:"support",title:"후원 안내 및 참여하기",body:"하베스트대학교의 선교 후원·파트너십 참여 안내입니다.\n공식 후원 안내: https://5012mission.com/\n\n계좌번호·결제 조건은 공식 페이지에서 확인하세요. 이 신문에는 아직 결제 기능을 연결하지 않았습니다."},
 {slug:"join",title:"회원가입",body:"회원가입 기능은 준비 중입니다."}
];
TN.BANNER_SLOTS = [
 {slot:"top_left",label:"상단 좌측 배너",size:"312 x 80"},
 {slot:"sky_left",label:"좌측 스카이스크래퍼",size:"120 x 540"},
 {slot:"sky_right",label:"우측 스카이스크래퍼",size:"120 x 540"},
 {slot:"side_1",label:"사이드 배너 1 (정사각)",size:"300 x 290"},
 {slot:"side_2",label:"사이드 배너 2 (세로)",size:"300 x 380"},
 {slot:"pair_1",label:"본문 가로배너 좌",size:"490 x 80"},
 {slot:"pair_2",label:"본문 가로배너 우",size:"490 x 80"},
 {slot:"focus_side",label:"포커스 우측 배너",size:"300 x 200"}
];

/* ---------- 데모 저장소 ---------- */
var KEY = "tn_demo_v1";
function dload(){
  var s = localStorage.getItem(KEY);
  if(s){ try{ var existing=JSON.parse(s); if(!existing.menu_version||existing.menu_version<2) migrateMenu(existing); if(existing.menu_version<3) updateWelfareMenu(existing); return existing; }catch(e){} }
  var d = {sections:SEED_SECTIONS.slice(),articles:[],banners:[],settings:[],pages:SEED_PAGES.slice(),posts:[],menu_version:3,seq:{articles:1,banners:1,posts:1,sections:7000}};
  Object.keys(SEED_SETTINGS).forEach(function(k){ d.settings.push({key:k,value:SEED_SETTINGS[k]}); });
  if(window.TN_SAMPLE && !localStorage.getItem("tn_nosample")){ addSample(d); }
  localStorage.setItem(KEY, JSON.stringify(d)); return d;
}
function addSample(d){
  var S=window.TN_SAMPLE;
  S.articles.forEach(function(a){ var n=Object.assign({},a); n.id=d.seq.articles++; n.created_at=n.published_at; d.articles.push(n); });
  S.banners.forEach(function(b){ var n=Object.assign({},b); n.id=d.seq.banners++; n.created_at=new Date().toISOString(); d.banners.push(n); });
  S.posts.forEach(function(p){ var n=Object.assign({views:0},p); n.id=d.seq.posts++; d.posts.push(n); });
}
function migrateMenu(d){
  var map={"1":1111,"2":2113,"3":6111,"4":1111,"5":5111,"6":1111,"7":4113,"8":6111,"9":2111,"11":1111,"12":2112,"13":1112,"14":1111,"15":2111,"16":1111,"17":1112,"18":2111,"19":1111}, defs={"site_name":"하베스트 타임스","site_en":"HARVEST TIMES","reg_title":"하베스트 타임스","copyright":"Copyright by HARVEST TIMES. All rights reserved.","home_block_1":"4001","home_block_2":"3001","home_block_3":"2113","side_box_1":"1112","side_box_2":"2111","side_box_3":"2114","focus_section":"2001"};
  d.sections=SEED_SECTIONS.slice().concat((d.sections||[]).filter(function(s){return s.id>=100 && !SEED_SECTIONS.some(function(n){return n.id===s.id;});}));
  (d.articles||[]).forEach(function(a){if(map[a.section_id])a.section_id=map[a.section_id];});
  Object.keys(defs).forEach(function(k){ var row=d.settings.find(function(x){return x.key===k;}); if(row)row.value=defs[k]; else d.settings.push({key:k,value:defs[k]}); });
  d.seq.sections=Math.max(7000,d.seq.sections||0); d.menu_version=2; dsave(d);
}
function updateWelfareMenu(d){
  var mag=d.sections.find(function(s){return s.id===2001;});if(mag)mag.name="매거진";
  if(!d.sections.some(function(s){return s.id===1113;}))d.sections.push({"id":1113,"parent_id":1001,"name":"하베스트은퇴.노후복지소식","code":"retirement-welfare","kind":"news","sort":3});
  d.menu_version=3;dsave(d);
}
function dsave(d){ localStorage.setItem(KEY, JSON.stringify(d)); }
TN.demoReset = function(){ localStorage.removeItem("tn_nosample"); localStorage.removeItem(KEY); localStorage.removeItem("tn_demo_auth"); };
function cmp(a,b){ return a<b?-1:a>b?1:0; }
function match(row, k, expr){
  var v = row[k], i = expr.indexOf("."), op = expr.slice(0,i), a = expr.slice(i+1);
  if(op==="eq") return String(v)===a;
  if(op==="neq") return String(v)!==a;
  if(op==="is") return a==="null" ? (v===null||v===undefined) : String(v)===a;
  if(op==="in"){ return a.replace(/^\(|\)$/g,"").split(",").indexOf(String(v))>=0; }
  if(op==="gte") return v>=a; if(op==="lte") return v<=a;
  if(op==="ilike"){ return String(v||"").toLowerCase().indexOf(a.replace(/\*/g,"").toLowerCase())>=0; }
  return true;
}
function demoQuery(table, o){
  var d = dload(), rows = (d[table]||[]).slice(), f = o.filters||{};
  Object.keys(f).forEach(function(k){
    if(k==="q"){ var q=f[k].toLowerCase(); rows = rows.filter(function(r){ return ((r.title||"")+(r.summary||"")+(r.body||"")).toLowerCase().indexOf(q)>=0; }); }
    else rows = rows.filter(function(r){ return match(r,k,f[k]); });
  });
  if(o.order){ var p=o.order.split("."), col=p[0], desc=p[1]==="desc"; rows.sort(function(a,b){ var r=cmp(a[col],b[col]); return desc?-r:r; }); }
  var count = rows.length;
  if(o.offset) rows = rows.slice(o.offset);
  if(o.limit) rows = rows.slice(0,o.limit);
  return {data:rows,count:count};
}

/* ---------- 인증 ---------- */
function getAuth(){ try{return JSON.parse(localStorage.getItem("tn_auth")||"null");}catch(e){return null;} }
function token(){ var a=getAuth(); return a&&a.access_token||C.SUPABASE_ANON_KEY; }
TN.user = function(){
  if(!LIVE){ return localStorage.getItem("tn_demo_auth") ? {email:"demo-admin"} : null; }
  var a=getAuth(); return a && a.expires_at*1000>Date.now() ? {email:a.email} : null;
};
TN.signIn = async function(id, pw){
  if(!LIVE){
    if(id==="admin" && pw==="demo1234"){ localStorage.setItem("tn_demo_auth","1"); return {ok:true}; }
    return {ok:false,msg:"데모 모드 로그인: ID admin / 비밀번호 demo1234"};
  }
  var email = id.indexOf("@")>0 ? id : id+"@"+C.ADMIN_DOMAIN;
  var r = await fetch(C.SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:C.SUPABASE_ANON_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:email,password:pw})});
  var j = await r.json();
  if(!r.ok) return {ok:false,msg:"로그인 실패: ID 또는 비밀번호를 확인하세요."};
  localStorage.setItem("tn_auth",JSON.stringify({access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Math.floor(Date.now()/1000)+j.expires_in,email:email}));
  var adm = await TN.isAdmin();
  if(!adm){ TN.signOut(); return {ok:false,msg:"관리자 권한이 없는 계정입니다."}; }
  return {ok:true};
};
TN.signOut = function(){ localStorage.removeItem("tn_auth"); localStorage.removeItem("tn_demo_auth"); };
TN.isAdmin = async function(){
  if(!LIVE) return !!TN.user();
  if(!TN.user()) return false;
  try{ var r = await rest("POST","rpc/is_admin",{body:{}}); return r.data===true; }catch(e){ return false; }
};

/* ---------- REST ---------- */
async function rest(method, path, o){
  o = o||{};
  var url = C.SUPABASE_URL+"/rest/v1/"+path, qs=[];
  if(o.select) qs.push("select="+encodeURIComponent(o.select));
  var f=o.filters||{};
  Object.keys(f).forEach(function(k){
    if(k==="q"){ var v=f[k].replace(/[,()*]/g," "); qs.push("or="+encodeURIComponent("(title.ilike.*"+v+"*,summary.ilike.*"+v+"*,body.ilike.*"+v+"*)")); }
    else qs.push(encodeURIComponent(k)+"="+encodeURIComponent(f[k]));
  });
  if(o.order) qs.push("order="+encodeURIComponent(o.order));
  if(o.limit!=null) qs.push("limit="+o.limit);
  if(o.offset) qs.push("offset="+o.offset);
  if(qs.length) url+="?"+qs.join("&");
  var h={apikey:C.SUPABASE_ANON_KEY,Authorization:"Bearer "+token(),"Accept-Profile":C.SCHEMA,"Content-Profile":C.SCHEMA,"Content-Type":"application/json"};
  var pr=[]; if(o.ret) pr.push("return=representation");
  if(o.count) pr.push("count=exact"); if(o.upsert) pr.push("resolution=merge-duplicates");
  if(pr.length) h.Prefer=pr.join(",");
  var r = await fetch(url,{method:method,headers:h,body:o.body!==undefined?JSON.stringify(o.body):undefined});
  var txt = await r.text(), data = null; try{ data = txt?JSON.parse(txt):null; }catch(e){}
  if(!r.ok) throw new Error((data&&(data.message||data.hint))||("HTTP "+r.status));
  var cr = r.headers.get("content-range"), count = cr&&cr.indexOf("/")>0 ? parseInt(cr.split("/")[1],10) : null;
  return {data:data,count:count};
}

/* ---------- 공개 API ---------- */
TN.list = async function(table, o){
  o=o||{};
  if(!LIVE) return demoQuery(table,o);
  return await rest("GET",table,{select:o.select||"*",filters:o.filters,order:o.order,limit:o.limit,offset:o.offset,count:true});
};
TN.get = async function(table,col,val){
  var r = await TN.list(table,{filters:(function(){var f={};f[col]="eq."+val;return f;})(),limit:1});
  return r.data&&r.data[0]||null;
};
TN.save = async function(table,row,key){
  key = key||"id";
  if(!LIVE){
    var d=dload(), arr=d[table];
    if(row[key]!==undefined && row[key]!==null && row[key]!==""){
      var i=arr.findIndex(function(x){return String(x[key])===String(row[key]);});
      if(i>=0){ arr[i]=Object.assign({},arr[i],row); dsave(d); return arr[i]; }
    }
    var n=Object.assign({},row);
    if(key==="id"){ d.seq[table]=(d.seq[table]||1); n.id=d.seq[table]++; }
    n.created_at = n.created_at||new Date().toISOString();
    arr.push(n); dsave(d); return n;
  }
  var has = row[key]!==undefined && row[key]!==null && row[key]!=="";
  if(has && key==="id"){ var id=row.id, b=Object.assign({},row); delete b.id; var f={}; f.id="eq."+id; var r=await rest("PATCH",table,{filters:f,body:b,ret:true}); return r.data&&r.data[0]; }
  var r2=await rest("POST",table,{body:row,ret:true,upsert:key!=="id"}); return r2.data&&r2.data[0];
};
TN.del = async function(table,id,key){
  key=key||"id";
  if(!LIVE){ var d=dload(); d[table]=d[table].filter(function(x){return String(x[key])!==String(id);}); dsave(d); return; }
  var f={}; f[key]="eq."+id; await rest("DELETE",table,{filters:f});
};
TN.bump = async function(id){
  if(!LIVE){ var d=dload(); var a=d.articles.find(function(x){return x.id==id;}); if(a){a.views=(a.views||0)+1;dsave(d);} return; }
  try{ await rest("POST","rpc/bump_views",{body:{p_id:Number(id)}}); }catch(e){}
};
TN.settings = async function(){
  var r = await TN.list("settings",{}), o={};
  (r.data||[]).forEach(function(x){o[x.key]=x.value;});
  Object.keys(SEED_SETTINGS).forEach(function(k){ if(o[k]===undefined) o[k]=SEED_SETTINGS[k]; });
  return o;
};
TN.saveSetting = async function(k,v){ return TN.save("settings",{key:k,value:v},"key"); };
TN.sections = async function(){
  var r = await TN.list("sections",{order:"sort.asc"});
  return r.data||[];
};
TN.published = function(extra,o){
  o=o||{}; var f=Object.assign({status:"eq.published"},extra||{});
  return TN.list("articles",{filters:f,order:o.order||"published_at.desc",limit:o.limit,offset:o.offset,select:o.select});
};
TN.addPost = async function(row){
  if(!LIVE){ return TN.save("posts",Object.assign({status:"open",views:0},row)); }
  await rest("POST","posts",{body:Object.assign({status:"open"},row)}); return true;
};
TN.upload = async function(file){
  var blob = await resize(file, 1600);
  if(!LIVE){ return await new Promise(function(res){ var fr=new FileReader(); fr.onload=function(){res(fr.result);}; fr.readAsDataURL(blob); }); }
  var name = "img/"+new Date().toISOString().slice(0,7)+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";
  var r = await fetch(C.SUPABASE_URL+"/storage/v1/object/"+C.BUCKET+"/"+name,{method:"POST",headers:{apikey:C.SUPABASE_ANON_KEY,Authorization:"Bearer "+token(),"Content-Type":"image/jpeg","x-upsert":"true"},body:blob});
  if(!r.ok) throw new Error("이미지 업로드 실패 (HTTP "+r.status+")");
  return C.SUPABASE_URL+"/storage/v1/object/public/"+C.BUCKET+"/"+name;
};
function resize(file,max){
  return new Promise(function(res,rej){
    var img=new Image(), u=URL.createObjectURL(file);
    img.onload=function(){
      var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,max/Math.max(w,h));
      var c=document.createElement("canvas"); c.width=Math.round(w*s); c.height=Math.round(h*s);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      c.toBlob(function(b){URL.revokeObjectURL(u); b?res(b):rej(new Error("변환 실패"));},"image/jpeg",0.82);
    };
    img.onerror=function(){rej(new Error("이미지를 읽을 수 없습니다."));}; img.src=u;
  });
}
TN.hasSample = function(){ return !!window.TN_SAMPLE; };
TN.loadSample = async function(){
  var S=window.TN_SAMPLE; if(!S) throw new Error("sample-harvest.js 가 없습니다.");
  for(var i=0;i<S.articles.length;i++){ await TN.save("articles",Object.assign({},S.articles[i])); }
  for(var j=0;j<S.banners.length;j++){ await TN.save("banners",Object.assign({},S.banners[j])); }
  for(var k=0;k<S.posts.length;k++){ await TN.save("posts",Object.assign({},S.posts[k])); }
};
TN.clearSample = async function(){
  var S=window.TN_SAMPLE; if(!S) return;
  var titles={}; S.articles.forEach(function(a){titles[a.title]=1;});
  var arts=(await TN.list("articles",{})).data||[];
  for(var i=0;i<arts.length;i++){ if(titles[arts[i].title]) await TN.del("articles",arts[i].id); }
  var bs=(await TN.list("banners",{})).data||[]; var imgs={}; S.banners.forEach(function(b){imgs[b.image_url]=1;});
  for(var j=0;j<bs.length;j++){ if(imgs[bs[j].image_url]) await TN.del("banners",bs[j].id); }
  var ps=(await TN.list("posts",{})).data||[]; var pt={}; S.posts.forEach(function(p){pt[p.title]=1;});
  for(var k=0;k<ps.length;k++){ if(pt[ps[k].title]) await TN.del("posts",ps[k].id); }
  localStorage.setItem("tn_nosample","1");
};
TN.seedSamples = async function(n){
  var all=await TN.sections();
  var secs=all.filter(function(s){return (s.kind==="news"||s.kind==="video"||s.kind==="photo") && (s.parent_id || !all.some(function(c){return c.parent_id===s.id;}));});
  for(var i=1;i<=n;i++){
    var s = secs[i%secs.length];
    await TN.save("articles",{section_id:s.id,title:"샘플 기사 제목 "+i+": 이곳에 기사 제목이 들어갑니다",subtitle:"",summary:"샘플 요약문입니다. 관리자 화면에서 실제 기사로 바꾸거나 삭제하세요. 이 문장은 목록 화면의 요약 영역 모양을 확인하기 위한 것입니다.",body:"<p>샘플 본문 1단락입니다. 실제 기사를 작성하면 이 자리에 표시됩니다.</p><p>샘플 본문 2단락입니다.</p>",image_url:"",author:"편집국",status:"published",is_headline:i===1,is_top:i>1&&i<5,views:Math.floor(Math.random()*500),published_at:new Date(Date.now()-i*3600e3).toISOString()});
  }
};
TN.esc = function(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };
TN.fmt = function(iso,full){ if(!iso) return ""; var d=new Date(iso),p=function(n){return String(n).padStart(2,"0");}; return (full?d.getFullYear()+"-":"")+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes()); };
TN.SEED_SECTIONS = SEED_SECTIONS; TN.SEED_SETTINGS = SEED_SETTINGS; TN.SEED_PAGES = SEED_PAGES;
})();
