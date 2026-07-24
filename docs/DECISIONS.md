# 설계 결정 기록

이 문서는 "자기주도 학습 코치" 프로젝트가 지금 형태로 정해지기까지의 과정과 각 결정의 이유를 시간순으로 남긴다.
나중에 "왜 이렇게 만들었지?"가 궁금할 때 참고할 것.

## 배경

진주 항공과학고등학교 2차 시험(국어·영어·수학) 준비가 목적. 시험 범위는 다음과 같이 먼저 정리했다
(원본 시험지·정답지·교과서는 별도 로컬 폴더에 보관, 이 저장소에는 없음):

- 국어: 노미숙(15개정), 1-1 ~ 3-1까지
- 영어: 이재영(15개정), 범위가 애매해 1~3학년 전 범위
- 수학: 이준열(15개정), 1~3학년 중 3학년 "이차방정식" 단원까지

## Rev.1 — FastAPI 백엔드 확장안 (폐기)

처음에는 기존에 운영 중이던 `info-edu-learning-site`("정보ON", Vue3+FastAPI+SQLite로 만든 정보 교과
학급 관리 사이트, 실제 학생·교사 계정과 성적을 다룸)를 열어보니 우연히도 `backend/app/config.py`의
`TEXTBOOK_DIR = REPO_ROOT / "textbook"` 이 방금 만든 `textbook/` 폴더 이름과 정확히 일치했다.
그래서 처음엔 "그 레포에 국영수 모듈을 얹자"는 방향으로 설계했다:

- `StudentProfile`, `AiKeySetting`(Fernet 암호화), `AiInteraction` 테이블을 추가
- 기존 로그인(`User`/`Session`)은 우회하고 `/api/coach/*`만 무인증으로 분리
- API 키는 서버에 암호화 저장, 호출 시에만 복호화

**폐기 이유:** 다음 요구사항이 나오면서 전제가 완전히 바뀌었다 — "`.gitignore`에 올릴 게 없을 정도로
공개적이어야 하고, 깃허브에 올리면 Netlify가 자동배포하게" 하고 싶다는 것. 이건 서버 쪽 비밀(암호화 키,
SQLite DB)이 존재한다는 Rev.1의 전제와 정면으로 충돌한다. 또한 `info-edu-learning-site`는 실제 다른
학생·교사 데이터를 다루는 비공개 도구라, 그 레포 자체를 공개로 바꾸는 것도 불가능한 선택이었다.

## 전환 계기 — 완전 공개 + Netlify 자동배포

두 가지를 확인하고 결정을 내렸다:

1. **Netlify는 정적 사이트만 자동배포한다.** 지금의 FastAPI+SQLite 백엔드는 그대로 올라갈 수 없다.
   (참고로 Netlify는 비공개 GitHub 레포도 자동배포를 지원하긴 하지만, 이번엔 콘텐츠 정책상 공개로 가기로 함 — 아래 참고.)
2. **저작권 자료가 이미 존재한다.** `info-edu-learning-site`가 실제로 `textbook/` 폴더를 `.gitignore`에
   넣어 교과서 PDF(노미숙·이준열·이재영 15개정, 출판사 저작물)를 커밋하지 않고 있었다. 완전 공개 배포를 하면
   이런 자료가 다 같이 공개될 위험이 있어, 미리 정책을 정해야 했다.

이에 대해 사용자와 확인한 결정:

| 항목 | 결정 |
|---|---|
| 교과서 PDF·기출 시험지 원문 | 공개 레포에서 **제외**. 로컬(비공개)에만 보관, 참고용으로만 사용 |
| 공개 레포에 들어가는 콘텐츠 | 직접 만든 학습자료·연습문제, 단원/범위 메타데이터만 |
| 백엔드 구조 | FastAPI+SQLite 전부 제거, **완전 정적 SPA**로 전환 |
| 저장 위치 | 서버 없음 → 이름·AI 키·풀이기록 전부 브라우저 `localStorage` |
| 레포 | `info-edu-learning-site`와 완전히 분리된 **새 공개 레포** |

## Rev.2 — 최종 설계 (현재 구현 중)

- **스택:** Vue3 + Vite, 정적 빌드만. 백엔드 없음.
- **저장:** `localStorage` 키 5개 — `coach.profile`, `coach.aiSettings`, `coach.attempts`,
  `coach.wrongNotes`, `coach.aiCallLog`. 전부 `src/lib/storage.js`에서 관리.
- **AI 연동:** `src/lib/aiProviders.js`에서 Gemini/OpenAI/Claude를 공통 인터페이스로 감싸,
  브라우저가 학생 본인의 키로 각 Provider API를 직접 호출한다. Claude는
  `anthropic-dangerous-direct-browser-access: true` 헤더가 필요(브라우저에서 키가 그대로 보인다는 경고).
- **콘텐츠:** `public/study-data/standards.json`(단원 목록, 시험범위 그대로 반영), `public/study-data/questions/`
  (자체 제작 문항만).
- **배포:** GitHub 공개 레포 → Netlify "Import from Git" 연동 → `netlify.toml`(`npm run build`, publish `dist`,
  SPA fallback redirect) → push마다 자동 재배포.
- **레포 분리:** 이 프로젝트(로컬 경로 `/home/student/Documents/study/std03`, 기존 `std01`/`std02`에 이어
  붙인 이름)는 `info-edu-learning-site`와 무관한 새 레포로 GitHub에 올린다. 레포 이름은 특정 학교명·학생명이
  드러나지 않도록 중립적으로 정한다(예: `self-study-coach`) — 공개 레포라 불필요한 개인 식별 정보를 이름에
  넣지 않는 게 안전하다.

전체 아키텍처 다이어그램·시퀀스 다이어그램·표는 별도로 정리한 디자인 메모(아티팩트)에 있고, 이 문서는
"왜 이렇게 바뀌었는가"에 집중한다.

## 지금까지 구현한 것

- `npm create vite -- --template vue`로 뼈대 생성, `vue-router@4` 추가
- `netlify.toml` (build/publish/SPA redirect)
- `src/lib/storage.js` — localStorage 스키마 구현
- `src/lib/aiProviders.js` — Gemini/OpenAI/Claude 어댑터 + 조언·유사문항·약점리포트 함수,
  일일 호출 소프트 캡(`coach.aiCallLog`) 포함
- `src/views/Onboarding.vue`, `Dashboard.vue`, `SubjectUnits.vue`, `ProblemSolve.vue`, `Settings.vue`
- `public/study-data/standards.json` — 시험범위 그대로 반영한 단원 목록
- `public/study-data/questions/sample.json` — 문항 스키마 확인용 자체 제작 샘플 1개(수학, 이차방정식)
- `npm run build` 성공 확인, `npm run dev`로 로컬 구동 확인(정적 JSON 서빙 포함)

## 다음 단계

1. 국·영·수 각 과목당 실제 자체 제작 문항을 더 채운다(현재 수학 1문항뿐).
2. GitHub에 새 공개 레포 생성 + 첫 커밋 push (사용자 확인 후 진행).
3. Netlify에서 해당 레포 연결, 실제 `*.netlify.app` 주소로 배포 확인.
4. 온보딩 → 문제풀이 → AI 조언/유사문항/약점리포트까지 실제 API 키로 end-to-end 테스트.
