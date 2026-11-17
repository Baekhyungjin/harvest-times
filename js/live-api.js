/* Harvest Times live adapter. The server/RLS is the authorization boundary. */
(function () {
'use strict';
var TN = window.TN, C = window.TN_CONFIG || {};
if (!TN) throw new Error('신문 데이터 모듈을 먼저 불러와 주세요.');
var OFF = '운영서버 연결 전입니다. 실제 편집·승인은 사용할 수 없습니다.';
if (!TN.live) {
  TN.ready = Promise.resolve();
  var unavailable = async function () { throw new Error(OFF); };
  TN.ops = {ready:function(){return false;},context:unavailable,list:unavailable,save:unavailable,transition:unavailable,history:unavailable,members:unavailable,assign:unavailable};
  TN.net = {ready:function(){return false;},list:unavailable,get:unavailable,me:unavailable,saveProfile:unavailable,save:unavailable,mine:unavailable,visibility:unavailable,pray:unavailable,report:unavailable,moderate:unavailable,adminList:unavailable,legacy:unavailable};
  return;
}
var bootstrapAttemptedFor = null;
var client = null, db = null, authUser = null, startupError = null, profileFlight = null, lastContext = null;
function errorFor(err, write) {
  if (err && err.harvestSafe) return err;
  var code = String(err && err.code || ''), text = String(err && err.message || ''), msg;
  if (code === '40001') msg = '최신본과 충돌했습니다. 목록을 새로 불러온 뒤 다시 작업해 주세요. 자동 재전송하지 않습니다.';
  else if (code === 'email_not_confirmed' || /email not confirmed/i.test(text)) msg = '이메일 인증을 완료한 뒤 로그인해 주세요.';
  else if (code === 'email_address_not_authorized' || /not authorized.*email|smtp|sending confirmation email/i.test(text)) msg = '인증 메일 발송 준비를 확인해야 합니다. 운영 관리자에게 SMTP 연결을 문의해주세요.';
  else if (code === 'invalid_credentials' || /invalid login credentials/i.test(text)) msg = '이메일 또는 비밀번호를 확인해 주세요.';
  else if (code === 'user_already_exists' || /already registered/i.test(text)) msg = '이미 가입된 이메일입니다. 로그인을 이용해 주세요.';
  else if (code === 'weak_password' || /password.*(short|least|weak)/i.test(text)) msg = '비밀번호가 보안 기준에 맞지 않습니다. 더 긴 비밀번호를 사용해 주세요.';
  else if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate limit/i.test(text)) msg = '요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.';
  else if (code === '42501' || /permission denied|forbidden/i.test(text)) msg = '이 작업을 수행할 권한이 없습니다.';
  else if (code === '23505') msg = '이미 등록되었거나 처리 중인 항목입니다. 목록을 먼저 확인해 주세요.';
  else if (code === 'P0001' && text && /[가-힣]/.test(text) && text.length < 300) msg = text;
  else if (code === 'PGRST301' || code === 'PGRST302' || /jwt|session.*missing|not authenticated|인증|검증된 이메일/i.test(text)) msg = '이메일 인증과 로그인 상태를 확인해 주세요.';
  else if (/fetch|network|timeout|failed to send/i.test(text) || Number(err && err.status) >= 500) msg = write ? '연결 오류로 처리 결과를 확인할 수 없습니다. 중복 요청하지 말고 목록에서 결과를 먼저 확인해 주세요.' : '운영서버 연결을 확인해 주세요.';
  else if (code === 'PGRST202' || code === 'PGRST205' || /schema cache/i.test(text)) msg = '운영서버 API가 아직 준비되지 않았습니다. 관리자에게 문의해 주세요.';
  else msg = write ? '요청을 완료하지 못했습니다. 입력값과 권한을 확인하고 목록에서 처리 결과를 먼저 확인해 주세요.' : '운영서버에서 정보를 불러오지 못했습니다.';
  var e = safeError(msg); if (/^[A-Za-z0-9_]{1,40}$/.test(code)) e.code = code;
  if (write && (/fetch|network|timeout/i.test(text) || Number(err && err.status) >= 500)) e.certainty = 'unknown';
  return e;
}
function safeError(msg) { var e = new Error(msg); e.harvestSafe = true; return e; }
function cacheUser(user) { authUser = user || null; lastContext = null; profileFlight = null; }
try {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') throw safeError('Supabase SDK 2.119.0을 불러오지 못했습니다. 운영서버 연결을 확인해 주세요.');
  if (C.SCHEMA && C.SCHEMA !== 'times') throw safeError('신문 전용 times 스키마 설정을 확인해 주세요.');
  if (String(C.SUPABASE_ANON_KEY || '').startsWith('sb_secret_')) throw safeError('공개 연결 키 설정을 확인해 주세요.');
  if (String(C.SUPABASE_ANON_KEY || '').split('.').length === 3) {
    try { var payload = JSON.parse(atob(String(C.SUPABASE_ANON_KEY).split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); if (payload.role !== 'anon') throw new Error(); }
    catch (_) { throw safeError('공개 연결 키 설정을 확인해 주세요.'); }
  }
  client = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {db:{retry:false},auth:{storageKey:'harvest-times-auth-v1',flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
  db = client.schema('times');
  client.auth.onAuthStateChange(function (_event, session) { cacheUser(session && session.user); });
} catch (e) { startupError = e.harvestSafe ? e : safeError('운영서버 연결 설정을 확인해 주세요. 데모 인증으로 대신할 수 없습니다.'); }
TN.ready = (async function () {
  if (startupError) return;
  try { var r = await client.auth.getSession(); if (r.error) throw r.error; cacheUser(r.data && r.data.session && r.data.session.user); }
  catch (e) { startupError = errorFor(e, false); }
})();
async function ready() { await TN.ready; if (startupError) throw startupError; }
async function run(query, write) { try { var r = await (query && typeof query.retry === 'function' ? query.retry(false) : query); if (r.error) throw r.error; return r; } catch (e) { throw errorFor(e, write); } }
async function rpc(name, args, write) { await ready(); return (await run(db.rpc(name, args || {}), write)).data; }
async function verifiedUser() {
  await ready();
  if (!authUser) return null;
  var r = await run(client.auth.getUser(), false), u = r.data && r.data.user;
  if (!u) { cacheUser(null); return null; }
  authUser = u;
  if (!u.email || !u.email_confirmed_at) throw safeError('이메일 인증을 완료한 뒤 로그인해 주세요.');
  return u;
}
function cleanProfile(row, u) { return row ? {id:row.id,name:row.name != null ? row.name : row.display_name || '',email:u.email} : null; }
async function ownProfile() {
  await ready(); if (!authUser) return null;
  if (profileFlight) return profileFlight;
  var pending = (async function () {
    var u = await verifiedUser(); if (!u) return null;
    var row = (await run(db.from('profiles').select('id,display_name').eq('id', u.id).maybeSingle(), false)).data;
    if (!row) {
      var name = String(u.user_metadata && u.user_metadata.harvest_display_name || u.email.split('@')[0]).trim().slice(0,80) || '회원';
      row = await rpc('profile_save', {p_display_name:name}, true);
    }
    if (!authUser || authUser.id !== u.id) throw safeError('로그인 계정이 변경되었습니다. 새로고침해 주세요.');
    return cleanProfile(row, u);
  })();
  profileFlight = pending;
  try { return await pending; } finally { if (profileFlight === pending) profileFlight = null; }
}
async function requireProfile() { var p = await ownProfile(); if (!p) throw safeError('먼저 회원 로그인을 해주세요.'); return p; }
function roleName(role) { return role === 'staff_writer' ? 'writer' : role; }
function roles(rows) { return (Array.isArray(rows) ? rows : []).map(function(r){return Object.assign({},r,{role:roleName(r.role)});}); }
async function mediaStatus() {
  if (C.MEDIA_UPLOADS_ENABLED !== true || C.MEDIA_BUCKET !== 'harvest-times-media') return {enabled:false};
  try { var m = await rpc('media_status'); return m && m.enabled === true && m.bucket === 'harvest-times-media' ? m : {enabled:false}; } catch (_) { return {enabled:false}; }
}
async function context() {
  var profile = await requireProfile();
  if(bootstrapAttemptedFor!==profile.id){bootstrapAttemptedFor=profile.id;try{await rpc("claim_initial_admin",{},true);}catch(_){}}
  var ctx = await rpc("workspace_context");
  if (!ctx || !ctx.profile || ctx.profile.id !== profile.id) throw safeError('본인 편집 권한을 확인할 수 없습니다.');
  var secs = (Array.isArray(ctx.sections) ? ctx.sections : []).filter(function(s){return s.visible !== false;}), rs = roles(ctx.roles), allowed = new Set();
  var leaves = secs.filter(function(s){return s.parent_id != null && ['news','photo','video'].includes(s.kind) && !s.link_url && !secs.some(function(x){return String(x.parent_id) === String(s.id);});});
  var full = rs.some(function(r){return r.role === 'publisher' || r.role === 'editor_in_chief';});
  leaves.forEach(function(s){if(full || rs.some(function(r){return (r.role === 'writer' || r.role === 'department_editor') && r.department_code && r.department_code === s.department_code;})) allowed.add(s.id);});
  var apps = await rpc('applications_list');
  (Array.isArray(apps) ? apps : []).forEach(function(a){if(a.user_id === profile.id && a.status === 'approved'){if(a.kind === 'missionary') allowed.add(3111); if(a.kind === 'reporter') allowed.add(5111);}});
  var media = await mediaStatus();
  lastContext = Object.assign({},ctx,{profile:profile,roles:rs,sections:secs,allowed_section_ids:Array.from(allowed),can_admin:ctx.can_admin === true,uploads_enabled:media.enabled === true});
  return lastContext;
}
TN.user = function () { return authUser ? {id:authUser.id,email:authUser.email || ''} : null; };
TN.isAdmin = async function () { await ready(); if (!authUser) return false; return (await context()).can_admin === true; };
TN.signIn = async function (id,pw) {
  try {
    await ready(); var email = String(id || '').trim();
    if (email.toLowerCase() === 'admin') email = 'admin@harvest-times.invalid';
    if (!email.includes('@')) return {ok:false,msg:'관리자 아이디 또는 가입 이메일을 입력해 주세요.'};
    var r = await run(client.auth.signInWithPassword({email:email,password:String(pw || '')}), true); cacheUser(r.data && r.data.user);
    if (!await TN.isAdmin()) return {ok:false,msg:'회원 로그인은 완료되었습니다. 계정 관리 권한은 없으니 편집실을 이용해 주세요.'};
    return {ok:true};
  } catch (e) { return {ok:false,msg:errorFor(e,true).message}; }
};
TN.signOut = async function () { await ready(); await run(client.auth.signOut({scope:'local'}), true); cacheUser(null); };
var READ = ['articles','sections','settings','banners','pages','posts'];
function tableName(table) { if (!READ.includes(table)) throw safeError('지원하지 않는 데이터 요청입니다.'); return table; }
function filter(query, key, input) {
  var text = String(input), dot = text.indexOf('.'), op = text.slice(0,dot), value = text.slice(dot+1);
  if (!/^[a-z_][a-z0-9_]*$/i.test(key) || dot < 1) throw safeError('검색 조건을 확인해 주세요.');
  if (['eq','neq','gte','lte','ilike'].includes(op)) return query[op](key,value);
  if (op === 'is') return query.is(key,value === 'null' ? null : value === 'true' ? true : value === 'false' ? false : value);
  if (op === 'in' && value.startsWith('(') && value.endsWith(')')) return query.in(key,value.slice(1,-1).split(',').map(function(v){return v.trim().replace(/^"|"$/g,'');}));
  throw safeError('지원하지 않는 검색 조건입니다.');
}
TN.list = async function (table,o) {
  await ready(); tableName(table); o = o || {};
  if (table === 'posts' && !await TN.isAdmin()) throw safeError('제보·광고 문의는 관리자만 열람할 수 있습니다.');
  var query = db.from(table).select(o.select || '*',{count:'exact'}), f = o.filters || {};
  Object.keys(f).forEach(function(k){
    if (k === 'q') { var q = String(f[k] || '').replace(/[,()*%_"\\]/g,' ').trim(); if(q) query = query.or('title.ilike.*'+q+'*,summary.ilike.*'+q+'*,body.ilike.*'+q+'*'); }
    else query = filter(query,k,f[k]);
  });
  if (o.order) String(o.order).split(',').forEach(function(order){var p=order.split('.');if(!/^[a-z_][a-z0-9_]*$/i.test(p[0]))throw safeError('정렬 조건을 확인해 주세요.');var opt={ascending:p[1]!=='desc'};if(p.includes('nullsfirst'))opt.nullsFirst=true;if(p.includes('nullslast'))opt.nullsFirst=false;query=query.order(p[0],opt);});
  var offset = o.offset == null ? 0 : Number(o.offset), limit = o.limit == null ? null : Number(o.limit);
  if (!Number.isSafeInteger(offset) || offset < 0 || (limit !== null && (!Number.isSafeInteger(limit) || limit < 0))) throw safeError('목록 범위를 확인해 주세요.');
  if (limit === 0) { var empty = await run(query.range(0,0),false); return {data:[],count:empty.count}; }
  if (limit !== null) query = query.range(offset,offset+limit-1);
  else if(offset) query=query.range(offset,2147483646);
  var r = await run(query,false); return {data:r.data || [],count:r.count};
};
TN.get = async function(table,col,val){var f={};f[col]='eq.'+val;var r=await TN.list(table,{filters:f,limit:1});return r.data[0] || null;};
async function requireAdmin(){if(!await TN.isAdmin())throw safeError('관리자 권한이 필요합니다.');}
TN.save = async function(table,row,key){
  await ready(); tableName(table); key=key || 'id';
  if(table==='articles'){await requireAdmin();var ap=Object.assign({},row);if(ap.workflow_version!==undefined&&ap.expected_version===undefined)ap.expected_version=ap.workflow_version;delete ap.workflow_version;delete ap.views;var saved=await rpc('admin_article_save',{p_article:ap},true);return saved;}
  if(table==='posts' && (row[key]==null || row[key]===''))return TN.addPost(row);
  await requireAdmin(); var query, has=row[key]!==undefined&&row[key]!==null&&row[key]!=='';
  if(has && key==='id'){var body=Object.assign({},row);delete body.id;query=db.from(table).update(body).eq(key,row[key]);}
  else if(key!=='id')query=db.from(table).upsert(row,{onConflict:key});
  else query=db.from(table).insert(row);
  var r=await run(query.select('*').single(),true);return r.data;
};
TN.del = async function(table,id,key){await ready();tableName(table);if(table==='articles')throw safeError('기사는 삭제하지 않습니다. 기사 수정에서 비공개(임시저장)로 바꿀 수 있습니다.');await requireAdmin();await run(db.from(table).delete().eq(key||'id',id),true);};
TN.settings = async function(){var r=await TN.list('settings'),out={};r.data.forEach(function(x){out[x.key]=x.value;});return out;};
TN.saveSetting = function(k,v){return TN.save('settings',{key:k,value:v},'key');};
TN.sections = async function(){return (await TN.list('sections',{order:'sort.asc'})).data;};
TN.published = function(extra,o){o=o||{};var f=Object.assign({},extra||{},{status:'eq.published'});if(!f.published_at)f.published_at='lte.'+new Date().toISOString();return TN.list('articles',{filters:f,order:o.order||'published_at.desc',limit:o.limit,offset:o.offset,select:o.select});};
TN.addPost = async function(row){await ready();await run(db.from('posts').insert(Object.assign({status:'open'},row)),true);return true;};
TN.bump = async function(id){try{await rpc('bump_views',{p_id:id},true);}catch(_){} };
['demoReset','loadSample','seedSamples','clearSample'].forEach(function(k){TN[k]=function(){throw safeError('운영서버에서는 샘플 추가·삭제·초기화를 실행할 수 없습니다.');};});
TN.hasSample=function(){return false;};
function revision(row,ctx){if(!row)return row;var s=(ctx && ctx.sections || []).find(function(s){return String(s.id)===String(row.section_id || row.content && row.content.section_id);});return Object.assign({},row,{owner_id:row.created_by,department_code:s && s.department_code || row.department_code || null});}
TN.ops = {
  ready:function(){return !!TN.live && !!client && !startupError;},
  context:context,
  list:async function(scope,status){
    var ctx=await context();
    var rows=await rpc('workflow_list',{p_scope:scope || 'mine',p_status:Array.isArray(status)?null:status || null});
    return (Array.isArray(rows)?rows:[]).filter(function(r){return !Array.isArray(status)||!status.length||status.includes(r.status);}).map(function(r){return revision(r,ctx);});
  },
  save:async function(row){row=row||{};return revision(await rpc('workflow_save',{p_revision_id:row.revision_id??null,p_article_id:row.article_id??null,p_content:row.content??{},p_expected_version:row.expected_version??null},true),lastContext);},
  transition:async function(id,action,note,version){return revision(await rpc('workflow_transition',{p_revision_id:id,p_action:action,p_note:note||'',p_expected_version:version??null},true),lastContext);},
  history:function(id){return rpc('workflow_history',{p_revision_id:id});},
  members:async function(){var rows=await rpc('members_list');return (Array.isArray(rows)?rows:[]).map(function(m){return Object.assign({},m,{roles:roles(m.roles)});});},
  assign:async function(userId,role,departmentCode){var result=await rpc('staff_assign',{p_user_id:userId,p_role:role==='writer'?'staff_writer':role,p_department_code:departmentCode||null},true);lastContext=null;return result?Object.assign({},result,{role:roleName(result.role)}):result;}
};

var NET_KINDS=['news','prayer','event'];
function netClean(q){return String(q||'').replace(/[,()*%_"\\]/g,' ').trim().slice(0,60);}
TN.net = {
  ready:function(){return !!client && !startupError;},
  list:async function(o){
    await ready();o=o||{};
    var q=db.from('network_posts').select('id,kind,author_label,ministry_role,organization,region,country,title,summary,body,images,event_start,event_end,event_place,event_online,event_url,prayer_status,answer_note,prayer_count,status,created_at,updated_at',{count:'exact'}).eq('status','published');
    if(o.kind){if(!NET_KINDS.includes(o.kind))throw safeError('게시판 구분을 확인해 주세요.');q=q.eq('kind',o.kind);}
    if(o.region)q=q.eq('region',String(o.region));
    if(o.author_label)q=q.eq('author_label',String(o.author_label));
    if(o.prayer_status)q=q.eq('prayer_status',String(o.prayer_status));
    var s=netClean(o.q);if(s)q=q.or('title.ilike.*'+s+'*,summary.ilike.*'+s+'*,body.ilike.*'+s+'*');
    if(o.upcoming===true)q=q.gte('event_start',new Date(Date.now()-864e5).toISOString().slice(0,10)).order('event_start',{ascending:true});
    else if(o.upcoming===false)q=q.lt('event_start',new Date(Date.now()-864e5).toISOString().slice(0,10)).order('event_start',{ascending:false});
    else q=q.order('created_at',{ascending:false});
    if(o.exclude)q=q.neq('id',Number(o.exclude));
    var off=Number(o.offset||0),lim=Number(o.limit||12);q=q.range(off,off+lim-1);
    var r=await run(q,false);return {data:r.data||[],count:r.count};
  },
  get:async function(id){await ready();var r=await run(db.from('network_posts').select('id,kind,author_label,ministry_role,organization,region,country,title,summary,body,images,event_start,event_end,event_place,event_online,event_url,prayer_status,answer_note,prayer_count,status,created_at,updated_at').eq('id',Number(id)).maybeSingle(),false);return r.data||null;},
  me:async function(){await ready();if(!authUser)return null;await requireProfile();return rpc('network_me');},
  saveProfile:function(p){p=p||{};return rpc('network_profile_save',{p_role:p.role,p_organization:p.organization||'',p_region:p.region,p_country:p.country||'',p_privacy:p.privacy||'public'},true);},
  save:function(post){return rpc('network_save',{p_post:post||{}},true);},
  mine:async function(){var r=await rpc('network_my_posts');return Array.isArray(r)?r:[];},
  visibility:function(id,hidden){return rpc('network_owner_visibility',{p_id:Number(id),p_hidden:!!hidden},true);},
  pray:function(id){return rpc('network_pray',{p_id:Number(id)},true);},
  report:function(id,reason){return rpc('network_report',{p_id:Number(id),p_reason:String(reason||'')},true);},
  moderate:function(id,action,reason){return rpc('network_moderate',{p_id:Number(id),p_action:action,p_reason:reason||''},true);},
  adminList:async function(){var r=await rpc('network_admin_list');return Array.isArray(r)?r:[];},
  legacy:async function(ids){await ready();var r=await run(db.from('articles').select('id,section_id,title,summary,image_url,author,published_at').eq('status','published').lte('published_at',new Date().toISOString()).in('section_id',ids).order('published_at',{ascending:false}).limit(30),false);return r.data||[];}
};
var M = TN.member = {
  ready:function(){return !!TN.live;},
  enabledOAuth:function(){return Array.isArray(C.OAUTH_PROVIDERS)?C.OAUTH_PROVIDERS.slice():[];},
  current:ownProfile,
  register:async function(row){
    await ready();row=row||{};var name=String(row.name||'').trim(),email=String(row.email||'').trim();
    if(!name||name.length>80)throw safeError('이름을 1~80자로 입력해 주세요.');
    var r=await run(client.auth.signUp({email:email,password:String(row.password||''),options:{data:{harvest_display_name:name},emailRedirectTo:new URL('member.html?mode=account',location.href).href}}),true);
    if(!r.data || !r.data.session)return {requiresConfirmation:true};
    cacheUser(r.data.session.user);return requireProfile();
  },
  login:async function(email,pw){await ready();var r=await run(client.auth.signInWithPassword({email:String(email||'').trim(),password:String(pw||'')}),true);cacheUser(r.data && r.data.user);return requireProfile();},
  logout:function(){return TN.signOut();},
  social:async function(provider){await ready();if(!M.enabledOAuth().includes(provider))throw safeError('아직 사용할 수 없는 간편로그인입니다. 이메일로 가입·로그인해 주세요.');return (await run(client.auth.signInWithOAuth({provider:provider,options:{redirectTo:new URL('member.html?mode=account',location.href).href}}),true)).data;},
  applications:async function(){await requireProfile();return await rpc('applications_list') || [];},
  apply:async function(row){await requireProfile();row=row||{};if(!['missionary','reporter'].includes(row.kind))throw safeError('신청 유형을 확인해 주세요.');lastContext=null;return rpc('application_submit',{p_kind:row.kind,p_organization:row.organization||'',p_region:row.region||'',p_introduction:row.introduction||''},true);},
  canWrite:async function(kind){if(!['missionary','reporter'].includes(kind))return false;await ready();if(!authUser)return false;var ctx=await context(),id=kind==='missionary'?3111:5111;return ctx.allowed_section_ids.some(function(x){return String(x)===String(id);});},
  submit:async function(row){
    row=row||{};if(!await M.canWrite(row.kind))throw safeError('해당 유형의 작성 승인이 필요합니다.');
    var p=await requireProfile(),saved=await TN.ops.save({content:{section_id:row.kind==='missionary'?3111:5111,title:row.title||'',summary:row.summary||'',body_text:row.body_text??row.body??'',author:p.name,is_headline:false,is_top:false,image_url:row.image_url||'',video_url:row.video_url||''}});
    try{return await TN.ops.transition(saved.id,'submit','',saved.version);}catch(e){var partial=safeError('임시 저장은 완료됐지만 제출은 확인하지 못했습니다. 작업본 ID '+String(saved.id)+'를 편집실에서 확인해 주세요. 새 원고로 재생성하면 중복될 수 있습니다.');partial.code=e.code;partial.revision_id=saved.id;partial.certainty=e.certainty||'partial';throw partial;}
  },
  myArticles:async function(){await requireProfile();var rows=await TN.ops.list('mine',null);return rows.map(function(r){var c=r.content||{},id=String(r.section_id||c.section_id);return {id:r.article_id,revision_id:r.id,title:c.title||'',status:r.status,member_kind:id==='3111'?'missionary':id==='5111'?'reporter':null,created_at:r.created_at,summary:c.summary||'',body_text:c.body_text||''};});},
  adminApplications:async function(){await requireAdmin();var values=await Promise.all([rpc('applications_list'),TN.ops.members()]),byId=new Map(values[1].map(function(m){return [m.id,m];}));return (values[0]||[]).map(function(a){var m=byId.get(a.user_id);return Object.assign({},a,{name:m?m.name:'',email:m?m.email:''});});},
  adminMembers:function(){return TN.ops.members();},
  review:async function(id,decision,note){if(!['approved','rejected'].includes(decision))throw safeError('심사 결과를 확인해 주세요.');var r=await rpc('application_review',{p_id:id,p_decision:decision,p_note:note||''},true);lastContext=null;return r;}
};
async function jpeg(file,maxBytes) {
  maxBytes=Math.min(Math.max(Number(maxBytes)||512000,50000),1048576);
  var bytes=new Uint8Array(await file.slice(0,16).arrayBuffer()),type=file.type;
  var valid=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10:type==='image/webp'?String.fromCharCode.apply(null,bytes.slice(0,4))==='RIFF'&&String.fromCharCode.apply(null,bytes.slice(8,12))==='WEBP':false;
  if(!valid)throw safeError('JPG·PNG·WebP 이미지 원본을 선택해 주세요.');
  var url=URL.createObjectURL(file);
  try{
    var image=await new Promise(function(resolve,reject){var im=new Image();im.onload=function(){resolve(im);};im.onerror=function(){reject(safeError('이미지를 읽을 수 없습니다.'));};im.src=url;});
    var w=image.naturalWidth,h=image.naturalHeight;if(!w||!h)throw safeError('이미지를 읽을 수 없습니다.');
    var edge=1280,quality=0.82;
    for(var attempt=0;attempt<24;attempt++){
      var scale=Math.min(1,edge/Math.max(w,h)),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
      var draw=canvas.getContext('2d');draw.fillStyle='#fff';draw.fillRect(0,0,canvas.width,canvas.height);draw.drawImage(image,0,0,canvas.width,canvas.height);
      var blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/jpeg',quality);});
      if(!blob)throw safeError('이미지 변환에 실패했습니다.');
      if(blob.size<=maxBytes)return blob;
      quality-=0.08;
      if(quality<0.5){quality=0.8;edge=Math.round(edge*0.82);if(edge<560)break;}
    }
    throw safeError('사진을 한도('+Math.round(maxBytes/1024)+'KB) 안으로 줄이지 못했습니다. 더 단순한 사진을 사용해 주세요.');
  }finally{URL.revokeObjectURL(url);}
}
TN.compressImage=jpeg;
TN.upload=async function(file,opts){opts=opts||{};
  await ready();if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>5*1024*1024)throw safeError('JPG·PNG·WebP 원본 5MB 이하 파일만 올릴 수 있습니다.');
  var p=await requireProfile(),ctx=await context();
  if(!ctx.uploads_enabled)throw safeError('이미지 업로드는 아직 열리지 않았습니다. 검증된 외부 HTTPS 이미지 주소를 사용해 주세요.');
  var blob=await jpeg(file,opts.maxBytes),bucket=C.MEDIA_BUCKET,name=p.id+'/'+crypto.randomUUID()+'.jpg';
  if(!authUser||authUser.id!==p.id)throw safeError('로그인 계정이 변경되었습니다. 다시 확인해 주세요.');
  await run(client.storage.from(bucket).upload(name,blob,{contentType:'image/jpeg',upsert:false}),true);
  var result=client.storage.from(bucket).getPublicUrl(name);if(result.error)throw errorFor(result.error,true);
  var url=result.data&&result.data.publicUrl;if(!url||!url.startsWith('https://'))throw safeError('공개 이미지 URL을 확인하지 못했습니다. 재업로드하지 말고 관리자에게 문의해 주세요.');TN.upload.lastBytes=blob.size;return url;
};
})();
