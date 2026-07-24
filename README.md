# 자기주도 학습 코치

진주 항공과학고등학교 2차 시험(국어·영어·수학) 준비를 위한 완전 정적 학습 사이트.
서버가 없다 — 이름·AI 키·풀이 기록은 방문자의 브라우저(`localStorage`)에만 저장되고,
AI 호출도 브라우저에서 Gemini/GPT/Claude API로 직접 나간다.

자세한 설계 배경과 결정 이유는 [`docs/DECISIONS.md`](./docs/DECISIONS.md)에 정리해 두었다.

## 로컬에서 실행하기

```bash
npm install
npm run dev
```

http://localhost:5173 에서 확인. 첫 접속 시 온보딩(이름 + AI Provider + API 키 입력) 화면으로 이동한다.

## 빌드

```bash
npm run build
```

`dist/`에 정적 파일이 생성된다. Netlify가 이 명령을 그대로 실행해 자동 배포한다(`netlify.toml` 참고).

## 폴더 구조

```
src/
  lib/storage.js       localStorage 읽기/쓰기 (이름, AI 키, 풀이 기록, 오답노트)
  lib/aiProviders.js    Gemini/OpenAI/Claude 공통 어댑터 + 조언·유사문항·약점리포트
  views/                Onboarding, Dashboard, SubjectUnits, ProblemSolve, Settings
public/study-data/
  standards.json        국·영·수 단원 목록 (시험 범위 그대로 반영)
  questions/            자체 제작 문항 (교과서·기출 원문은 절대 포함하지 않음)
```

## 콘텐츠 정책

교과서 PDF와 기출 시험지 원문은 저작권이 있는 자료라 이 저장소에 절대 커밋하지 않는다.
`public/study-data/`에는 직접 만든 연습문제와 단원 목록만 넣는다. 자세한 기준은
[`docs/DECISIONS.md`](./docs/DECISIONS.md)의 콘텐츠 정책 표를 참고.
