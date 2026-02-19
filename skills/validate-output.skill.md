# /validate-output — HTML 상세페이지 17개 항목 자동 검증

## Purpose
`/compose-page` 완료 후 생성된 `output/{product}-detail.html`을 17개 체크리스트 항목으로 자동 검증합니다.
실패 항목은 구체적인 세부 정보와 함께 보고하고, Composer가 실패 섹션만 재실행할 수 있도록 안내합니다.

## Context
- **스타일 가이드**: `templates/style-guide.md` — 호환성 규칙 및 구조 기준
- **위젯 셀렉션**: `output/{product}-widget-selection.json` — 섹션 수 비교 기준

## Input
- `output/{product}-detail.html` — 검증 대상 HTML 파일
- `output/{product}-widget-selection.json` — 섹션 수 비교용 (선택, 없으면 체크 2 건너뜀)

## Processing

HTML 파일을 문자열로 읽어 아래 17개 항목을 순서대로 검사합니다.

---

### 구조 검증 (5개)

**체크 1 — 860px page-canvas 컨테이너 존재**
`.page-canvas` 클래스를 가진 요소가 존재하고, 해당 요소의 style 또는 Tailwind 클래스에 `860px` 또는 `w-[860px]`이 포함되어 있는지 확인합니다.

**체크 2 — 섹션 수 일치**
`widget-selection.json`이 존재하면, HTML 내 `<section` 태그 수가 위젯 셀렉션의 섹션 항목 수와 일치하는지 확인합니다.
`widget-selection.json`이 없으면 이 항목을 건너뜁니다(자동 통과).

**체크 3 — 각 섹션에 id 속성 존재**
모든 `<section` 태그에 `id="..."` 속성이 있는지 확인합니다.
id가 없는 section이 1개라도 있으면 실패이며, 몇 번째 section인지 detail에 기록합니다.

**체크 4 — HTML 문서 구조 유효**
아래 패턴이 모두 존재하는지 확인합니다:
- `<!DOCTYPE html>`
- `<html` 태그
- `<head` 태그
- `<body` 태그

**체크 5 — 빈 섹션 없음**
`<section` 태그 내부에 실질적인 콘텐츠(공백 제외, 길이 10자 이상)가 있는지 확인합니다.
내부 콘텐츠가 비어 있거나 10자 미만인 section이 있으면 실패입니다.

---

### 스타일 검증 (4개)

**체크 6 — CSS 변수 정의 및 사용**
`--brand-main`과 `--accent` 두 변수가 모두:
1. `<style>` 블록 내 `:root` 또는 인라인 style에서 **정의**되어 있는지 확인
2. HTML 본문 어딘가에서 `var(--brand-main)`, `var(--accent)` 형태로 **사용**되고 있는지 확인

정의만 있고 사용이 없어도 실패입니다.

**체크 7 — Tailwind CDN 포함**
`<script` 태그 중 `cdn.tailwindcss.com` 또는 `tailwindcss` 포함 URL이 있는지 확인합니다.

**체크 8 — Pretendard 폰트 로드**
`<link` 태그 중 `Pretendard` 또는 `pretendard` 포함 URL이 있는지, 또는 `@import` 구문에 Pretendard가 포함되어 있는지 확인합니다.

**체크 9 — 충돌 스타일 오버라이드 없음**
아래 패턴이 HTML 내에 존재하면 실패입니다:
- `!important` 사용 (CSS 변수 충돌 위험)
- `font-family` 인라인 스타일에서 Pretendard 외 폰트 지정

발견된 위치(줄 수 또는 태그)를 detail에 기록합니다.

---

### 콘텐츠 검증 (4개)

**체크 10 — placeholder 잔존 없음**
`[브랜드명]`, `[제품명]`, `[메인 카피]`, `[서브 카피]`, `[기능명]`, `[설명]`, `[가격]` 등 `[...]` 형태의 한글/영문 placeholder가 HTML 내에 남아 있는지 확인합니다.

정규식: `/\[[^\]]{1,30}\]/g`

발견된 경우 몇 개인지, 어떤 값인지 detail에 기록합니다.

**체크 11 — img-placeholder에 data-ai-prompt 속성**
`img-placeholder` 클래스를 가진 모든 요소에 `data-ai-prompt` 속성이 있는지 확인합니다.
속성이 없거나 빈 문자열인 요소가 있으면 실패이며, 몇 개인지 기록합니다.

**체크 12 — 섹션 내 빈 텍스트 콘텐츠 없음**
`<p`, `<h1`, `<h2`, `<h3`, `<span` 태그 중 내부 텍스트가 완전히 비어 있는 태그가 있는지 확인합니다.
공백만 있는 경우도 실패입니다. 발견 수를 기록합니다.

**체크 13 — 모든 섹션에 의미 있는 콘텐츠**
각 `<section` 내에 최소 1개 이상의 텍스트 태그(`<p`, `<h1~h3`, `<span`) 또는 이미지 관련 요소(`<img`, `img-placeholder`)가 있는지 확인합니다.

---

### 호환성 검증 (4개)

**체크 14 — 인라인 스타일만 사용 (CDN 제외)**
`<link rel="stylesheet"` 태그 중 CDN(외부 URL)이 아닌 로컬 CSS 파일 참조가 있는지 확인합니다.
`href`가 상대 경로(예: `./style.css`, `/css/main.css`)이면 실패입니다.

**체크 15 — position: fixed/sticky 미사용**
HTML 내 `position: fixed` 또는 `position: sticky` 문자열이 존재하면 실패입니다.
발견된 위치를 detail에 기록합니다.

**체크 16 — html.to.design 호환 구조**
아래 항목을 모두 확인합니다:
- CSS 애니메이션/트랜지션 미사용: `@keyframes`, `animation:`, `transition:` 문자열 없음
- `<canvas`, `<svg` 내부 텍스트 미사용 (SVG 아이콘은 허용, SVG 내 `<text>` 태그만 검사)
- 레이아웃에 JS 의존 없음: `document.`, `window.`, `addEventListener` 미사용

3가지 중 하나라도 위반하면 실패이며 어떤 항목인지 기록합니다.

**체크 17 — JavaScript 의존성 없음 (정적 HTML)**
`<script` 태그가 존재하는 경우, Tailwind CDN 스크립트와 tailwind.config 인라인 스크립트를 제외한 나머지 `<script` 태그가 있는지 확인합니다.

허용 예외:
- `src`에 `tailwindcss` 포함된 스크립트
- `type="text/javascript"` 없이 tailwind config만 담긴 인라인 `<script>`

위 예외 외 `<script` 태그가 있으면 실패입니다.

---

## Output

```json
{
  "pass": true,
  "total_checks": 17,
  "passed": 17,
  "failed": 0,
  "details": [
    { "check": 1, "name": "860px page-canvas 컨테이너", "pass": true },
    { "check": 2, "name": "섹션 수 일치", "pass": true },
    { "check": 3, "name": "섹션 id 속성", "pass": true },
    { "check": 4, "name": "HTML 문서 구조", "pass": true },
    { "check": 5, "name": "빈 섹션 없음", "pass": true },
    { "check": 6, "name": "CSS 변수 정의 및 사용", "pass": true },
    { "check": 7, "name": "Tailwind CDN 포함", "pass": true },
    { "check": 8, "name": "Pretendard 폰트 로드", "pass": true },
    { "check": 9, "name": "충돌 스타일 오버라이드 없음", "pass": true },
    { "check": 10, "name": "placeholder 잔존 없음", "pass": false, "detail": "2개 발견: [브랜드명], [서브카피]" },
    { "check": 11, "name": "img-placeholder data-ai-prompt 속성", "pass": true },
    { "check": 12, "name": "빈 텍스트 콘텐츠 없음", "pass": true },
    { "check": 13, "name": "섹션 의미 있는 콘텐츠", "pass": true },
    { "check": 14, "name": "인라인 스타일만 사용", "pass": true },
    { "check": 15, "name": "position fixed/sticky 미사용", "pass": true },
    { "check": 16, "name": "html.to.design 호환 구조", "pass": true },
    { "check": 17, "name": "JavaScript 의존성 없음", "pass": true }
  ]
}
```

**pass 조건**: `failed === 0`이면 `true`, 1개 이상이면 `false`.

## 실패 시 처리

검증 실패 항목이 있으면 아래 순서로 처리합니다:

**1. 실패 항목 요약 출력:**
```
검증 결과: FAIL (17개 중 15개 통과, 2개 실패)

실패 항목:
- [10] placeholder 잔존 없음: 2개 발견 → [브랜드명] (섹션 #hook), [서브카피] (섹션 #solution)
- [15] position fixed/sticky 미사용: 섹션 #cta-banner에서 position: fixed 발견
```

**2. /patch-section 안내:**
실패 섹션이 특정 section id와 연관되면 `/patch-section`으로 해당 섹션만 재생성을 권장합니다:
```
→ /patch-section으로 수정 권장:
  - #hook: placeholder 미치환
  - #cta-banner: position: fixed 제거 필요
```

**3. Composer 재실행 범위:**
실패 항목이 특정 섹션에 귀속되지 않는 전역 문제(체크 4, 7, 8 등)면 전체 HTML 재생성을 권장합니다.
섹션 귀속 문제(체크 2, 3, 5, 10, 11, 12, 13, 15)면 해당 섹션만 재실행합니다.
