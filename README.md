# 하베스트 타임스

공동 편집·발행을 준비하는 대학신문 사이트입니다. 기존 예시 기사 29개가 포함되어 있으므로 공식 개통 전 내용·법적 고지 검토가 필요합니다.

- 사이트: https://baekhyungjin.github.io/harvest-times/
- 공동 편집실: https://baekhyungjin.github.io/harvest-times/editor.html
- 조직도: https://baekhyungjin.github.io/harvest-times/organization.html
- 열방몰·연금 안내: https://baekhyungjin.github.io/harvest-times/mall.html
- 관리자 사용법: https://baekhyungjin.github.io/harvest-times/guide.html

## 공동운영

개인 계정과 서버에서 확인한 역할·부서 권한을 사용합니다. 공개 명단의 이름은 로그인 계정과 자동으로 연결되지 않습니다. 관리자는 가입 이메일과 본인을 확인한 뒤 실제 담당 역할을 연결합니다. 운영 관리자 권한만으로 기사 승인·발행을 할 수 없습니다.

작성 → 부서승인 → 편집승인 → 최종발행 순서입니다. 수정 중인 비공개 원고와 기존 공개 기사는 분리됩니다. 사진은 공개 저장소이므로 민감 자료를 첨부하지 마세요.

## 서버와 운영 준비

기존 people-ai-institute 프로젝트의 times 스키마를 사용합니다. 선거 관련 다른 프로젝트는 사용하지 않습니다. 운영 관리자 아이디 admin을 활성화했습니다. 비밀번호는 운영자가 직접 설정하며 소스·문서에 기록하지 않습니다. 실제 편집위원 계정 연결과 실사용자 발행 시험은 여전히 필요합니다. 기본 인증메일 상태이며 정식 회원 모집 전 SMTP와 개인정보·이용약관 확정이 필요합니다. Google·카카오 인증은 제공업체 설정 전이라 비활성입니다.

브라우저 설정 js/config-live.js에는 공개용 publishable 키만 사용합니다. secret 또는 service_role 키를 넣지 마세요. js/config.js는 이전 데모 호환용 비활성 설정입니다. 서버 설치는 완료되어 SQL을 다시 실행할 필요가 없습니다.
