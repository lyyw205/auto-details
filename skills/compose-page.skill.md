# /compose-page — JSON 위젯 조합 → HTML 상세페이지

## Purpose
선택된 `.widget.json` 위젯들을 **JSON 기반으로 읽어** 컬러 리매핑 + 콘텐츠 치환을 적용하고
**self-contained HTML/CSS 단일 파일**을 생성합니다.
`lib/widget-renderer/renderer.ts`의 `renderWidget()` 로직으로 JSON → HTML을 렌더링하여 조합합니다.

## Context
- **스타일 가이드**: `templates/style-guide.md` — 토큰 체계, 컬러 리매핑, 호환성 규칙
- **HTML 골격**: `templates/html-base.html`
- **위젯 셀렉션**: `output/{product}-widget-selection.json` (`/select-widgets` 결과)
- **위젯 파일**: `widgets/{taxonomy_id_lower}/*.widget.json` (HTML 아님)
- **공유 렌더러**: `lib/widget-renderer/renderer.ts` — JSON → HTML 순수 함수 (`renderWidget()`)
- **스타일 프리셋**: `widgets/_presets/preset--*.json`
- `skills/section-taxonomy.json`에서 **플랜 포함 섹션의 `copywriting_guide`만** selective 로딩
- 미리보기: 브라우저에서 직접 열기

## Input
1. **위젯 셀렉션**: `/select-widgets`에서 유저가 확인한 최종 선택 결과
   - `output/{product}-widget-selection.json`
   - 각 섹션별 선택된 위젯 ID, 파일 경로, 스타일 프리셋
2. **제품 정보**:
   - 제품명, 브랜드명
   - 제품 설명 텍스트
   - 핵심 기능 목록
   - 가격 정보 (선택)
   - 브랜드 컬러: `brand_main` (필수), `accent` (선택, 없으면 brand_main의 밝은 변형)
3. **수정 요청**: (선택) 위젯 구조에서 변경할 사항
4. (선택) **제품 이미지**: `[{ "file": "경로", "label": "설명" }, ...]`

## Processing

### 1. HTML 전체 구조

`templates/html-base.html`을 참조하여 완전한 HTML 파일을 생성합니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- Tailwind CDN -->
  <!-- Pretendard 폰트 CDN -->
  <!-- tailwind.config 인라인 -->
  <!-- CSS 변수: --brand-main, --accent -->
  <!-- 유틸리티 CSS (glass-card, text-gradient 등) -->
</head>
<body>
  <div class="page-canvas">
    <!-- 렌더링된 위젯 HTML 순서대로 조합 -->
  </div>
</body>
</html>
```

**치환 규칙**:
- `{{PRODUCT_NAME}}` → 실제 제품명
- `{{BRAND_MAIN}}` → 실제 brand_main hex (예: `#2E7DF7`)
- `{{ACCENT}}` → 실제 accent hex (예: `#60A5FA`)
- `{{SECTIONS}}` → 조합된 섹션 HTML

### 2. 위젯 로딩 + 컬러 리매핑

위젯 셀렉션에서 각 섹션의 `.widget.json` 파일을 순서대로 로드합니다 (`JSON.parse`, HTML 파싱 X).

#### Legacy Fallback

위젯 JSON에 `html_body` 필드가 존재하고 `elements` 배열이 비어 있으면:
- `html_body`를 그대로 사용 (기존 `.widget.html` 방식과 동일하게 처리)
- 이 경우 아래 컬러 리매핑/콘텐츠 치환은 HTML 문자열에 대해 적용

#### 컬러 리매핑 규칙 (JSON 기반)

위젯 JSON의 `elements[].style` 필드를 **직접 수정**하여 소스 프리셋 색상을 타겟 브랜드 컬러로 치환합니다:

1. **소스 프리셋 로드**: 위젯의 `source_ref`에 해당하는 프리셋 파일에서 `color_system` 읽기
2. **대상 필드**: `style.color`, `style.bgColor`, `style.gradient` 내 hex 값
3. **hex → CSS 변수 치환**:

| 위젯 elements[].style 내 색상 | 치환 대상 |
|-------------------------------|----------|
| 소스 프리셋의 `brand_main` hex | → `var(--brand-main)` |
| 소스 프리셋의 `accent` hex | → `var(--accent)` |
| `#FFFFFF`, `#888888`, `#666666` 등 중립색 | → 그대로 유지 |
| 소스 프리셋의 `dark_1`/`dark_2` | → 밝기 유지하며 다크 배경으로 사용 |

4. `style.gradient` 문자열 내의 hex도 동일 규칙으로 치환

### 2.5. 실제 이미지 매핑 + 치환

> 이미지 미제공 시 이 단계를 건너뜁니다 (완전 하위호환).

#### 이미지 분류

각 이미지를 시각적으로 분석하여 `data-ai-style` 타입으로 분류합니다:

| data-ai-style | 판단 기준 |
|---|---|
| product_hero | 깨끗한 배경, 제품 전체, 스튜디오 |
| product_lifestyle | 실사용 환경, 생활 장면 |
| product_detail | 클로즈업, 부분 확대 |
| product_flat | 탑뷰, 구성품 나열 |
| infographic | 다이어그램, 기능 설명 |
| mood | 분위기, 감성, 배경용 |
| comparison | 비교, 전후 |
| background_only | 텍스처, 오버레이용 |

#### 매핑 규칙

1. `elements[type="image"]`를 순서대로 수집하고 각 요소의 `label` + `aiStyle` 속성으로 필요 이미지 특성 파악
2. 분류된 이미지 풀에서 가장 적합한 이미지를 `src` 필드에 매핑
   - 우선: `aiStyle` 타입 일치 → `label` 유사성
   - Hook 섹션 우선 배치 (product_hero)
   - 이미지 수 < 플레이스홀더 수이면 재사용 허용
   - 무리한 매칭 금지 (mood에 product_detail 매핑 ✗)
3. 매핑 안 된 요소 → `src` 미설정, AI 프롬프트(`aiPrompt`) 그대로 유지

### 3. 콘텐츠 치환

`elements[].content` 필드 내 `[placeholder]` 텍스트를 실제 제품 정보로 교체합니다:

| Placeholder | 치환 대상 |
|-------------|----------|
| `[브랜드명]` | 실제 브랜드명 |
| `[제품명]` | 실제 제품명 |
| `[메인 카피]` | 제품 특성 기반 생성 (taxonomy의 `copywriting_guide` 참고) |
| `[서브 카피]` | 제품 설명 기반 생성 |
| `[기능명]`, `[설명]` | 핵심 기능 목록에서 매핑 |
| `[가격]` | 실제 가격 정보 |
| `[product]` in `aiPrompt` | 실제 제품명 (영문) |

#### 카피라이팅 규칙
- **텍스트 정렬**: 기본 `text-center`, 나열형만 `text-left`
- **줄바꿈**: `<br>` 사용, 들여쓰기 금지
- **긴 텍스트**: `max-w-[760px]` 적용
- **시맨틱 컬러**: `style="color: var(--brand-main)"` 등 CSS 변수 사용
- **카피라이팅**: taxonomy의 `copywriting_guide` 참고

### 4. 렌더링 (`renderWidget()` 로직)

`lib/widget-renderer/renderer.ts`의 `renderWidget()` 함수 로직을 따라 JSON → HTML 섹션을 생성합니다:

```
1. elements를 zIndex 오름차순으로 정렬
2. 각 element를 position: absolute + % 좌표로 배치
   - left: {x}%, top: {y}%, width: {width}%, height: {height}%
   - padding/gap 추가 금지 (좌표 그대로 배치)
3. element type별 HTML 태그 생성:
   - text      → <p> 또는 <h1>/<h2>/<h3> (style.fontSize 기준)
   - image     → src 매핑된 경우 <img class="real-image">, 미매핑 시 img-placeholder div
   - shape     → <div> (style.bgColor, style.borderRadius 적용)
   - button    → <button> (style.gradient 적용)
   - container → <div> (자식 elements 재귀 렌더링)
4. 렌더링된 elements를 <section> 내 position: relative 컨테이너에 삽입
```

**배치 규칙 (html.to.design 호환)**:
- 섹션 컨테이너: `position: relative; width: 860px; min-height: {section.height}px; overflow: hidden`
- 각 element: `position: absolute; left: {x}%; top: {y}%; width: {width}%; height: {height}%`
- padding/margin/gap을 렌더러가 추가하지 않음 (JSON 좌표 신뢰)

### 5. 섹션 조합

렌더링된 섹션 HTML들을 셀렉션 순서대로 `page-canvas` 안에 배치합니다.

### 6. html.to.design 호환 규칙

**반드시 준수**해야 Figma 변환 시 정확하게 반영됩니다:

| 규칙 | 이유 |
|------|------|
| **JS 의존 레이아웃 금지** | html.to.design은 CSS만 해석 |
| **`position: fixed/sticky` 금지** | Figma에 해당 개념 없음 |
| **CSS 애니메이션/트랜지션 금지** | Figma에 해당 개념 없음 |
| **실제 HTML 텍스트만** | SVG/canvas 텍스트는 Figma에서 편집 불가 |
| **`overflow: hidden` 명시** | 원치 않는 영역 노출 방지 |
| **절대값 크기 선호** | `w-[760px]`, `h-[500px]` 등 |
| **Tailwind CDN 사용** | 인라인 스타일 최소화 |

### 7. 인라인 검증 체크리스트

HTML 조합 완료 후, 아래 항목을 자체 검증합니다:

- [ ] `<!DOCTYPE html>` + `<html lang="ko">` 존재
- [ ] Tailwind CDN `<script>` 태그 존재
- [ ] Pretendard 폰트 `<link>` 태그 존재
- [ ] `--brand-main`, `--accent` CSS 변수 정의
- [ ] `.page-canvas` 래퍼 860px 고정
- [ ] 모든 섹션에 고유 `id` 속성 부여
- [ ] 모든 이미지에 `img-placeholder` 클래스 + `data-ai-prompt` 속성 (또는 `real-image` + `data-original-style`)
- [ ] 이미지 제공 시: 매핑된 영역에 `<img class="real-image">` 적용, 나머지는 `img-placeholder` 유지
- [ ] `position: fixed/sticky` 사용하지 않음
- [ ] CSS 애니메이션/트랜지션 사용하지 않음
- [ ] 모든 카드에 `glass-card` 적용
- [ ] composed 섹션에 그라데이션 오버레이 + text-shadow 적용
- [ ] 버튼에 그라데이션 배경 적용
- [ ] 텍스트 가운데 정렬 기본, 나열형만 좌측 정렬
- [ ] 소스 프리셋의 brand/accent hex가 `elements[].style`에서 CSS 변수로 치환되었는가
- [ ] 모든 placeholder(`[브랜드명]`, `[제품명]` 등)가 `elements[].content`에서 실제 값으로 치환되었는가
- [ ] Legacy fallback 사용 시: `html_body` 문자열에도 동일한 컬러/콘텐츠 치환 적용되었는가

검증 통과 시 → 파일 저장
검증 실패 시 → 실패 항목 수정 후 재저장

## Output
- 파일: `output/{product}-detail.html`
- 미리보기 안내: `브라우저에서 직접 열어 확인 가능`
- Figma 변환: `html.to.design (Figma 플러그인)으로 가져오기`
- 이미지 매핑 시 요약 출력:
```
이미지 매핑 결과: 5개 제공 → 3개 매핑 / 13개 AI 프롬프트 유지
- hero-main.jpg → 섹션 1 (Hook) ✓
- detail-closeup.jpg → 섹션 6 (FeatureDetail 1) ✓
- lifestyle.jpg → 섹션 11 (FeatureDetail 6) ✓
- unused-extra.jpg → 미사용
```
