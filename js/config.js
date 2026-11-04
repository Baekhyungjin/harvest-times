/* 타임즈 전자신문 - 연결 설정
   SUPABASE_URL 과 SUPABASE_ANON_KEY 를 채우면 실제 서버(Supabase)에 연결됩니다.
   비워 두면 "데모 모드"(이 브라우저 안에만 저장)로 동작합니다.
   ANON KEY(공개용 키)만 넣으세요. service_role 키는 절대 넣지 마세요. */
window.TN_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  SCHEMA: "times",          // 다른 사이트와 같은 Supabase 프로젝트를 쓸 때 쓰는 전용 스키마 이름
  BUCKET: "times-media",    // 이미지 저장 버킷
  ADMIN_DOMAIN: "times-admin.com" // 로그인 화면에 ID만 입력했을 때 붙는 이메일 도메인
};

/* HARVEST_FAVICON_FALLBACK: 정적 head가 없는 관리자도 같은 아이콘 사용 */
(function(){if(!document.querySelector('link[rel="icon"]')){var i=document.createElement("link");i.rel="icon";i.type="image/svg+xml";i.href=new URL("../favicon.svg?v=1",document.currentScript.src).href;document.head.appendChild(i);}})();
