# /extract-widgets-v2 — v2 분석 결과 → HTML 섹션 위젯 추출

## Purpose
`/analyze-ref-v2` 출력(v2 analysis JSON)을 **개별 HTML 섹션 위젯 파일**과 **스타일 프리셋**으로 분해합니다.
v2의 좌표·그룹·장식 데이터를 활용하여 v1보다 **높은 피델리티**의 위젯을 생성합니다.

## 핵심 원칙: 레퍼런스 구조 트레이싱

위젯은 레퍼런스 섹션의 **구조적 복제본**입니다.
- 레이아웃, 배경색, 여백, 장식 요소 → 레퍼런스 그대로 재현
- 텍스트 → placeholder로 치환 (역할 라벨)
- 이미지 → img-placeholder로 치환 (설명 라벨)
- **레퍼런스에 없는 요소를 추가하지 않습니다** (아이콘 장식, 추가 텍스트 등)

## Context
- 입력: `output/analysis-v2-{name}.json` (analyze-ref-v2 출력, version: "2.0")
- taxonomy: `skills/section-taxonomy.json`에서 매칭된 섹션의 `required_elements`만 selective 로딩
- **스타일 가이드**: `templates/style-guide.md` — 토큰 체계, 색상/타이포 규칙, 시각 효과 정의
- 섹션 패턴: `templates/html-section-patterns.md` — v1_compat 폴백 시 참조
- 위젯 저장소: `widgets/` 디렉토리

## Input
- v2 analysis JSON (`version: "2.0"`, `global_analysis` + `sections` + `pattern_summary`)
- 레퍼런스 이름 (영문 소문자 + 하이픈, 예: `ref-apple-airpods`)

## Output

한 번에 모두 생성합니다 (프리뷰 → 개별 파일 → 레지스트리 등록까지 자동 실행):

1. **스타일 프리셋 1개**: `widgets/_presets/preset--ref-{name}.json`
2. **통합 프리뷰 HTML 1개** (참고용): `output/widgets-preview--ref-{name}.html`
   - 모든 위젯을 하나의 HTML 파일에 순서대로 조합
   - 각 위젯 상단에 라벨 표시 (`#번호 Taxonomy — widget_id` + composition/theme 배지)
   - `html-base.html`의 Tailwind + 유틸리티 CSS 포함 → 브라우저에서 바로 확인 가능
   - 프리셋의 색상을 CSS 변수(`:root`)에 적용
3. **섹션 위젯 N개**: `widgets/{taxonomy_id_lower}/{widget_id}.widget.html`
   - 미매핑 섹션: `widgets/_custom/{widget_id}.widget.html`
4. **레지스트리 등록**: `/register-widgets` 자동 실행 → `widgets/_registry.json` 업데이트 (status: "new")

---

## Processing

### 1. 스타일 프리셋 추출

v1과 동일. `global_analysis`에서 추출합니다.

```json
{
  "type": "STYLE_PRESET",
  "id": "preset--ref-{name}",
  "name": "레퍼런스 설명",
  "source_ref": "ref-{name}",
  "style_tags": ["분석에서 추출한 스타일 키워드 3~5개"],
  "global_layout": {
    "width": "estimated_width",
    "image_area_width": "width - (left + right padding)",
    "default_padding": "가장 빈번한 padding",
    "default_item_spacing": "가장 빈번한 spacing",
    "default_content_alignment": "CENTER | LEFT | MIXED",
    "font_family": "감지된 폰트 또는 Pretendard"
  },
  "color_system": {
    "brand_main": "primary hex",
    "accent": "secondary hex",
    "dark_1": "가장 어두운 배경",
    "dark_2": "두 번째 어두운 배경",
    "light_1": "#FFFFFF",
    "light_2": "밝은 배경 변형",
    "sub_text": "#888888",
    "muted_text": "#666666"
  },
  "typography": {
    "main_copy": { "fontSize": "largest_heading", "fontWeight": 700 },
    "section_title": { "fontSize": "section_heading", "fontWeight": 700 },
    "sub_title": { "fontSize": "sub_heading", "fontWeight": 500 },
    "body": { "fontSize": "body_text", "fontWeight": 400 },
    "small": { "fontSize": "small_text", "fontWeight": 400 }
  }
}
```

### 2. 섹션별 HTML 위젯 추출

각 분석된 섹션을 독립 HTML 위젯으로 변환합니다.
**v2의 좌표, 그룹, 장식 데이터를 최대한 활용**하여 위젯을 생성합니다.

#### 2-1. widget_id 네이밍 규칙

v1과 동일:
```
{taxonomy_id_lower}--ref-{name}
```

- FeatureDetail은 변형 구분 추가: `--split-lr`, `--split-rl`, `--stack-light`, `--stack-dark`
- 커스텀 섹션: `{section_name_lower}--ref-{name}`

#### 2-2. HTML 위젯 포맷

v1과 동일한 메타데이터 구조:

```html
<!--WIDGET_META
{
  "widget_id": "hook--ref-{name}",
  "taxonomy_id": "Hook",
  "category": "intro",
  "style_tags": ["프리셋의 상위 3개 태그"],
  "theme": "dark",
  "composition": "stack | composed | split",
  "provenance": {
    "source_ref": "ref-{name}",
    "extracted_date": "YYYY-MM-DD",
    "analysis_version": "2.0"
  },
  "copywriting_guide": "taxonomy 또는 분석에서 추출한 카피라이팅 가이드",
  "sample_data": {
    "texts": { "[브랜드명]": "샘플 브랜드명" },
    "images": [{ "label": "img-label 텍스트", "src": "https://...", "alt": "설명" }]
  }
}
-->
<section id="{taxonomy_id_lower}" class="..." style="...">
  <!-- 실제 HTML/CSS 콘텐츠 -->
</section>
```

#### 2-3. v2 좌표 → CSS 변환 전략 (핵심 차이)

v2 분석의 좌표, 그룹, 장식 데이터를 직접 CSS로 변환합니다.

##### 그룹 → HTML 구조

| 분석 데이터 | CSS 출력 |
|------------|---------|
| `group.direction: "vertical"` + `group.gap` | `flex flex-col gap-[{gap}px]` |
| `group.direction: "horizontal"` + `group.gap` | `flex flex-row gap-[{gap}px]` |
| `group.alignment: "center"` | `items-center text-center` |
| `group.alignment: "left"` | `items-start text-left` |

표준 group role → HTML 매핑:

| group role | HTML 구조 |
|-----------|----------|
| `header-text-group` | `<div class="flex flex-col items-center gap-[{gap}px]">` |
| `feature-card` | `<div class="glass-card p-[{padding}px] flex flex-col gap-[{gap}px]">` |
| `stat-item` | `<div class="flex flex-col items-center gap-2">` |
| `grid-row` (columns: N) | `<div class="grid grid-cols-{N} gap-[{gap}px]">` |
| `icon-text-pair` | `<div class="flex items-center gap-3">` |
| `cta-group` | `<div class="flex flex-col items-center gap-[{gap}px]">` |
| `split-left` | `<div class="flex flex-col justify-center px-[{pad}px] py-[{pad}px] gap-[{gap}px]">` |
| `split-right` | `<div class="flex items-center justify-center p-[{pad}px]">` |
| `overlay-content` | `<div class="composed-layer bottom-0 left-0 right-0 p-[50px] flex flex-col gap-[{gap}px]">` |
| `checklist` | `<div class="flex flex-col gap-3 w-full max-w-[600px]">` |
| `review-card` | `<div class="glass-card p-6 flex flex-col gap-3 text-center">` |

##### 콘텐츠 요소 → HTML

| element type | HTML 출력 |
|-------------|----------|
| `TEXT_BOX` | `<p>` 또는 `<h2>`, `<h3>` (역할에 따라). fontSize → Tailwind 클래스 매핑 |
| `IMAGE` | `<div class="img-placeholder">` (v1과 동일한 플레이스홀더 패턴) |
| `ICON` | 의미적 아이콘 문자 (✓, →, ★ 등) 또는 인라인 SVG |
| `BUTTON` | `<button>` + style 속성에서 직접 매핑 |
| `CARD` | `<div class="glass-card">` 또는 `<div class="glass-card-strong">` |

**TEXT_BOX → 텍스트 역할별 HTML 태그:**

| fontSize 범위 | 역할 힌트 | 태그 + 클래스 |
|--------------|----------|-------------|
| 48+ | hero, 메인 카피 | `<h1 class="text-hero">` 또는 `<h2 class="text-[{fontSize}px]">` |
| 36~47 | 섹션 제목, 답변 | `<h2 class="text-section">` 또는 `<h2 class="text-answer">` |
| 28~35 | 서브 타이틀 | `<h3 class="text-sub">` |
| 24~27 | 아이템 제목 | `<h3 class="text-item">` |
| 20~23 | 본문, 설명 | `<p class="text-body">` |
| 14~19 | 캡션, 라벨 | `<p class="text-small">` 또는 `<p class="text-caption">` |

**TEXT_BOX color 처리:**
- 프리셋 brand_main과 일치하면: `style="color: {hex}"` (generate-html이 나중에 var로 치환)
- 프리셋 accent와 일치하면: `style="color: {hex}"` (동일)
- 흰색(#FFFFFF 등): `text-white` Tailwind 클래스
- 회색(#888888 등): `text-sub` 또는 `text-muted` Tailwind 클래스
- 기타 중립색: `text-white/{opacity}` Tailwind 클래스

##### 패딩·간격 → CSS

| 분석 데이터 | CSS 출력 |
|------------|---------|
| section bounds → 내부 최외곽 요소 위치로 패딩 추정 | `py-[{top}px] px-[{left}px]` 또는 `section-padding` |
| group.gap | `gap-[{gap}px]` (실제 값 사용) |
| 연속 요소 간 y 차이 | 적절한 `gap`, `mb`, `mt` 설정 |

패딩 추정 로직:
- `padding_top` = 가장 위 요소의 y
- `padding_bottom` = section height - (가장 아래 요소의 y + h)
- `padding_left` = 가장 왼쪽 요소의 x
- `padding_right` = 860 - (가장 오른쪽 요소의 x + w)
- 추정 패딩이 표준값(80/50)에 가까우면 `section-padding` 클래스 사용

##### Split 비율 → CSS

| 분석 데이터 | CSS 출력 |
|------------|---------|
| split.ratio = [1, 1] | `grid grid-cols-2` |
| split.ratio = [3, 2] | `grid grid-cols-[3fr_2fr]` |
| split.ratio = [2, 3] | `grid grid-cols-[2fr_3fr]` |
| left/right group bounds | 실제 비율로 fr 계산 |

##### Composed 레이어 → CSS

| 분석 데이터 | CSS 출력 |
|------------|---------|
| background IMAGE | `<div class="composed-layer inset-0">` + img-placeholder |
| GRADIENT_OVERLAY | `<div class="composed-layer inset-0 hero-overlay">` 또는 커스텀 그래디언트 |
| foreground group bounds | `<div class="composed-layer {position-classes}">` |

Composed 포지셔닝 매핑:
- group.bounds.y < section.height * 0.2 → `top-0 left-0 right-0 pt-[{y}px] px-[{x}px]`
- group.bounds.y > section.height * 0.6 → `bottom-0 left-0 right-0 pb-[{bottom_pad}px] px-[{x}px]`
- 그 외 → `inset-0 flex items-center justify-center` 또는 명시적 위치

##### IMAGE shape → CSS

| shape | CSS |
|-------|-----|
| `rect` | 기본 (rounded 없음) |
| `rounded` | `rounded-xl` 또는 `rounded-[{borderRadius}px]` |
| `circle` | `rounded-full overflow-hidden` |

#### 2-4. 장식 요소 → HTML 변환 (핵심 신규)

v2에서 추출한 장식 요소를 HTML/CSS로 변환합니다.

| Decoration type | HTML/CSS 출력 |
|----------------|-------------|
| `LINE` (horizontal) | `<div class="w-[{w}px] h-px mx-auto" style="background: linear-gradient(90deg, transparent, {stroke}/{opacity}, transparent);"></div>` 또는 `<div class="divider-gradient"></div>` (표준 크기일 때) |
| `LINE` (vertical) | `<div class="w-px h-[{h}px]" style="background: {stroke}; opacity: {opacity};"></div>` |
| `DOT` | `<span class="w-[{radius*2}px] h-[{radius*2}px] rounded-full" style="background: {fill};"></span>` |
| `DOT_GROUP` | `<div class="flex gap-[{gap}px]">` + DOT 반복 → 또는 `<div class="divider-dot"></div>` (3개 표준일 때) |
| `SHAPE` (카드 배경) | `<div class="glass-card">` 또는 `<div class="glass-card-strong">` (opacity 기준) |
| `SHAPE` (기타) | `<div class="absolute" style="...">` (composed 내) 또는 배경 요소로 처리 |
| `GRADIENT_OVERLAY` | `<div class="composed-layer inset-0" style="background: {gradient}; opacity: {opacity};"></div>` 또는 `hero-overlay` 클래스 |
| `BADGE` | `<span class="px-3 py-1 rounded-full text-[{fontSize}px]" style="background: {bgColor}; color: {color};">{content_hint}</span>` |

**장식 요소 배치 규칙:**
- 그룹 내부 장식: 해당 그룹의 HTML 내에 포함
- 독립 장식 (그룹에 속하지 않는): bounds의 y 좌표 기준으로 인접 요소 사이에 삽입
- composed 섹션 장식: 별도 `composed-layer`로 배치

**유틸리티 클래스 우선 사용:**
- LINE의 stroke가 brand_main이고 opacity가 낮으면 → `divider-brand` 클래스 사용
- LINE의 stroke가 white/neutral이면 → `divider-gradient` 클래스 사용
- DOT_GROUP이 3개이면 → `divider-dot` 클래스 사용
- SHAPE이 글라스 카드 스타일이면 → `glass-card` 클래스 사용

#### 2-5. 반복 패턴 처리

분석의 `pattern` 블록이 있는 그룹은 template를 반복하여 HTML을 생성합니다.

```json
// 분석 데이터
{
  "pattern": {
    "type": "repeated-card",
    "count": 3,
    "template": {
      "elements": [
        { "type": "TEXT_BOX", "role": "수치", "style": { "fontSize": 56, "fontWeight": 700, "color": "#B8956A" } },
        { "type": "TEXT_BOX", "role": "라벨", "style": { "fontSize": 20, "fontWeight": 400, "color": "#888888" } }
      ],
      "card_style": { "bgColor": "rgba(255,255,255,0.05)", "borderRadius": 16, "padding": 32 }
    }
  }
}
```

→ HTML 출력:
```html
<div class="w-full grid grid-cols-3 gap-[{gap}px]">
  <!-- count만큼 반복 -->
  <div class="glass-card p-8 flex flex-col items-center gap-2">
    <p class="text-hero text-gradient-brand">[수치 1]</p>
    <p class="text-small text-sub">[라벨 1]</p>
  </div>
  <div class="glass-card p-8 flex flex-col items-center gap-2">
    <p class="text-hero text-gradient-brand">[수치 2]</p>
    <p class="text-small text-sub">[라벨 2]</p>
  </div>
  <div class="glass-card p-8 flex flex-col items-center gap-2">
    <p class="text-hero text-gradient-brand">[수치 3]</p>
    <p class="text-small text-sub">[라벨 3]</p>
  </div>
</div>
```

placeholder 넘버링: 반복 시 `[수치 1]`, `[수치 2]`, `[수치 3]`으로 고유하게 넘버링합니다.

#### 2-6. v1_compat 폴백

v2 분석에서 좌표가 불충분하거나 elements/groups가 비어있는 섹션은
`v1_compat` 블록을 읽어 **기존 v1 로직**으로 위젯을 생성합니다.

폴백 조건:
- `elements` 배열이 비어있거나 2개 미만
- `groups` 배열이 비어있음
- bounds 값이 모두 0이거나 비정상

폴백 시:
1. `v1_compat.layout`, `v1_compat.composition`, `v1_compat.elements`를 사용
2. `templates/html-section-patterns.md`의 패턴 참조
3. 위젯 META에 `"fallback": "v1_compat"` 추가

#### 2-7. HTML 생성 규칙

##### 콘텐츠 생성 규칙 (v1과 동일)

##### 텍스트 placeholder 생성
- 분석의 `content_hint`에 원문이 있으면 → 해당 텍스트를 기반으로 역할 placeholder 생성
  - 예: content_hint "Point.1" → `[Point.1]` (레퍼런스의 고유 라벨 보존)
  - 예: content_hint "바삭하고 진한 견과 풍미" → `[섹션 타이틀]`
- content_hint가 없거나 "읽기 불가"이면 → 역할 기반 generic placeholder
  - 예: role "메인 카피" → `[메인 카피]`

- **텍스트**: placeholder 사용 — `[브랜드명]`, `[메인 카피]`, `[서브 카피]`, `[기능명]`, `[설명]` 등
- **색상**: 소스 레퍼런스의 **실제 hex 색상** 사용 (generate-html에서 CSS 변수로 리매핑됨)
  - 프리셋의 `brand_main` hex → 인라인 스타일에 실제 hex 사용
  - 프리셋의 `accent` hex → 인라인 스타일에 실제 hex 사용
  - 배경: 분석에서 추출한 실제 색상 사용
- **타이포**: 분석의 `style.fontSize` → Tailwind 매핑
  - 시맨틱 매치 (56→`text-hero`, 40→`text-section`, 36→`text-answer` 등)
  - 비표준 크기 → `text-[{size}px]`
- **시각 효과**: `templates/style-guide.md` Section 5 참조
  - `glass-card`, `glass-card-strong` (카드)
  - `tracking-tight` (타이틀)
  - `text-shadow-hero` (composed 섹션)
  - `divider-gradient` (섹션 분리선)

##### 이미지 플레이스홀더 (v1과 동일)

```html
<div class="img-placeholder w-[{w}px] h-[{h}px] rounded-xl"
     data-ai-prompt="descriptive prompt in English, [product] as placeholder"
     data-ai-style="{style}"
     data-ai-ratio="{ratio}">
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">구체적 한글 설명</span>
</div>
```

v2에서는 IMAGE 요소의 bounds에서 w, h를 직접 가져옵니다.
- `w` → 플레이스홀더 width (10px 단위)
- `h` → 플레이스홀더 height (10px 단위)
- `ai_prompt` → 분석의 IMAGE 요소 ai_prompt에서 직접 사용

##### Composition별 HTML 구조

**stack** — v2 좌표 활용:
```html
<section id="{id}" class="flex flex-col items-center gap-[{avg_gap}px] py-[{pad_top}px] px-[{pad_left}px] {bg-class}">
  <div class="content-narrow flex flex-col items-center gap-[{group_gap}px] text-center">
    <!-- groups 순서대로 렌더링 -->
  </div>
</section>
```
- `avg_gap`: 그룹 간 y 간격의 평균
- `pad_top`, `pad_left`: bounds에서 추정한 패딩
- 표준 패딩(80/50)에 가까우면 `section-padding` 클래스 사용

**split** — v2 좌표 활용:
```html
<section id="{id}" class="grid grid-cols-[{left_fr}fr_{right_fr}fr] min-h-[{height}px] {bg-class}">
  <!-- split-left group -->
  <div class="flex flex-col justify-center px-[{pad}px] py-[{pad}px] gap-[{gap}px]">
    <!-- 좌측 콘텐츠 -->
  </div>
  <!-- split-right group -->
  <div class="flex items-center justify-center p-[{pad}px]">
    <!-- 우측 콘텐츠 -->
  </div>
</section>
```
- `left_fr`, `right_fr`: split-left, split-right 그룹의 w 비율에서 계산
- 1:1에 가까우면 `grid-cols-2` 사용

**composed** — v2 좌표 활용:
```html
<section id="{id}" class="composed-section relative overflow-hidden" style="min-height: {height}px;">
  <!-- 배경 이미지 레이어 -->
  <div class="composed-layer inset-0">
    <!-- IMAGE 요소 -->
  </div>
  <!-- 장식 오버레이 레이어 (GRADIENT_OVERLAY 등) -->
  <div class="composed-layer inset-0 hero-overlay"></div>
  <!-- 전경 콘텐츠 레이어 (overlay-content group 등) -->
  <div class="composed-layer {position-classes} flex flex-col gap-[{gap}px]">
    <!-- 텍스트/버튼 콘텐츠 -->
  </div>
</section>
```

#### 2-8. sample_data 생성 (Demo 모드용)

v1과 동일. 각 위젯의 WIDGET_META에 `sample_data`를 포함합니다.

##### 규칙

1. **`texts`**: HTML 본문의 모든 `[placeholder]`를 키로, 레퍼런스 제품에 맞는 샘플 텍스트를 값으로 매핑
   - 레퍼런스 이미지에서 읽히는 실제 텍스트가 있으면 그것을 사용
   - 읽히지 않으면 제품 카테고리에 맞는 그럴듯한 텍스트를 생성
   - **placeholder 고유성 필수**: 동일 텍스트가 여러 곳에 반복되면 고유하게 넘버링
     - BAD: `[설명]` × 3 (모두 같은 텍스트로 치환됨)
     - GOOD: `[혜택 1 설명]`, `[혜택 2 설명]`, `[혜택 3 설명]`

2. **`images`**: `img-placeholder` 안의 `<span class="img-label">` 텍스트를 `label`로, Unsplash URL을 `src`로 매핑
   - URL 형식: `https://images.unsplash.com/photo-{id}?w=760&fit=crop&q=80`
   - 제품 카테고리에 맞는 이미지 선택
   - `label`은 HTML의 `<span class="img-label">` 텍스트와 **정확히 일치**해야 함

3. **서버 치환 로직**: `applyDemoMode()`가 `texts`는 `split().join()`, `images`는 `img-placeholder` div를 `<img>` 태그로 교체

##### 예시

```json
"sample_data": {
  "texts": {
    "[브랜드명]": "ORIGINUT",
    "[메인 카피]": "자연이 키운 고소함",
    "[혜택 1]": "고소한 풍미",
    "[혜택 1 설명]": "저온 로스팅으로 살린 깊은 맛"
  },
  "images": [
    {
      "label": "메인 제품 패키지 이미지",
      "src": "https://images.unsplash.com/photo-1509721434272-b79147e0e708?w=760&fit=crop&q=80",
      "alt": "프리미엄 캐슈넛 패키지"
    }
  ]
}
```

### 3. theme 판별

v1과 동일. 배경색 밝기로 판별:
- RGB 밝기 `(R*299 + G*587 + B*114) / 1000`
- 128 초과: `light`, 이하: `dark`

v2에서는 section의 `background.theme` 값이 이미 있으므로 직접 사용합니다.

### 4. 카테고리 매핑

v1과 동일:

| taxonomy_id | category |
|---|---|
| Hook, WhatIsThis, BrandName, SetContents | intro |
| WhyCore, PainPoint, Solution | problem |
| FeaturesOverview, FeatureDetail, Tips, Differentiator, StatsHighlight | features |
| Comparison, Safety, Target, Reviews, ProductSpec, FAQ, Warranty | trust |
| CTABanner, EventPromo, CTA | conversion |

### 5. 통합 프리뷰 HTML 생성

v1과 동일. 모든 위젯을 하나의 HTML 파일로 조합합니다.

**파일**: `output/widgets-preview--ref-{name}.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- html-base.html의 Tailwind + 유틸리티 CSS 포함 -->
  <!-- 프리셋 색상을 :root CSS 변수에 적용 -->
  <style>:root { --brand-main: {brand_main}; --accent: {accent}; }</style>
</head>
<body>
  <div class="preview-header">프리뷰 헤더 (레퍼런스명, 위젯 수, 스타일 요약, v2 표시)</div>
  <div class="page-canvas">
    <!-- 위젯마다 반복 -->
    <div class="widget-label">#1 Hook — hook--ref-{name} [composed] [dark] [v2]</div>
    <section>...</section>
    <!-- ... -->
  </div>
</body>
</html>
```

각 위젯 상단 라벨에 표시할 정보:
- `#순번` + `Taxonomy` + `widget_id`
- composition 배지 (색상 구분: stack=파랑, split=보라, composed=핑크)
- theme 배지 (light=노랑, dark=회색)
- `[v2]` 배지 (v2 분석 기반임을 표시)

### 6. 개별 위젯 파일 저장

v1과 동일. 프리뷰 HTML 생성과 동시에 개별 폴더로 저장합니다:

| 조건 | 경로 |
|---|---|
| taxonomy_id 있음 | `widgets/{taxonomy_id_lower}/{widget_id}.widget.html` |
| taxonomy_id 없음 (커스텀) | `widgets/_custom/{widget_id}.widget.html` |

각 위젯 파일은 `<!--WIDGET_META ... -->` + `<section>...</section>` 부분만 포함합니다.

### 7. 레지스트리 등록

v1과 동일. 개별 파일 저장 후 자동으로 `/register-widgets`를 실행합니다.
등록 시 모든 위젯은 `status: "new"`로 등록됩니다.

---

## v1 vs v2 품질 차이 요약

| 영역 | v1 (extract-widgets) | v2 (extract-widgets-v2) |
|------|---------------------|------------------------|
| **레이아웃** | html-section-patterns.md 고정 템플릿 | 좌표 기반 gap/padding 값 직접 반영 |
| **split 비율** | grid-cols-2 고정 | 실제 bounds 비율 → fr 계산 |
| **composed 위치** | 고정 position (bottom-0, top-0) | bounds 기반 정확한 위치 |
| **장식 요소** | visual_notes 텍스트로만 기록 → 미반영 | LINE, DOT_GROUP, BADGE 등 HTML로 렌더 |
| **간격** | 기본값 (gap-6, gap-8) | 분석의 실제 gap 값 사용 |
| **카드 스타일** | glass-card 일률 적용 | CARD 요소의 실제 style 반영 |
| **반복 패턴** | 고정 반복 수 | pattern.count로 정확한 반복 |
| **아이콘** | 미지원 | ICON 요소 → SVG/문자 렌더 |
| **폴백** | 없음 | v1_compat 자동 폴백 |

---

## Validation
- [ ] 모든 위젯이 `<!--WIDGET_META`로 시작하는가?
- [ ] WIDGET_META 내 JSON이 유효한가?
- [ ] 메타데이터에 `widget_id`, `taxonomy_id`, `category`, `composition`, `theme` 있는가?
- [ ] 메타데이터에 `provenance.analysis_version: "2.0"` 있는가?
- [ ] 메타데이터 JSON 뒤에 `-->` 닫힘 태그가 있는가?
- [ ] `<section>` 루트 요소가 존재하는가?
- [ ] `<section>`에 `id` 속성이 있는가?
- [ ] 모든 이미지에 `img-placeholder` 클래스 + `data-ai-prompt` + `data-ai-style` + `data-ai-ratio` 있는가?
- [ ] `data-ai-prompt` 내 제품명이 `[product]` 플레이스홀더로 치환되었는가?
- [ ] 텍스트에 `[브랜드명]`, `[메인 카피]` 등 placeholder가 사용되었는가?
- [ ] 프리셋 파일이 올바르게 생성되었는가?
- [ ] widget_id가 전체에서 유니크한가?
- [ ] `composed` 섹션에 `hero-overlay` + `text-shadow-hero` 적용되었는가?
- [ ] 카드 요소에 `glass-card` 클래스가 적용되었는가?
- [ ] 개별 위젯 파일이 올바른 경로에 저장되었는가?
- [ ] 레지스트리에 `status: "new"`로 등록되었는가?
- [ ] 모든 위젯 WIDGET_META에 `sample_data`가 포함되어 있는가?
- [ ] `sample_data.texts`의 키가 HTML 본문의 placeholder와 일치하는가?
- [ ] `sample_data.images`의 `label`이 HTML의 `img-label` 텍스트와 정확히 일치하는가?
- [ ] 동일 placeholder가 여러 곳에 쓰이지 않는가? (고유 넘버링 확인)
- [ ] **v2 신규**: 장식 요소(LINE, DOT_GROUP, BADGE 등)가 HTML에 렌더되었는가?
- [ ] **v2 신규**: group.gap 값이 CSS gap-[]에 반영되었는가?
- [ ] **v2 신규**: split 비율이 실제 bounds에서 계산되었는가?
- [ ] **v2 신규**: composed 레이어 위치가 bounds에서 도출되었는가?
- [ ] **v2 신규**: 반복 패턴이 pattern.count만큼 올바르게 반복되었는가?
- [ ] **v2 신규**: v1_compat 폴백이 필요한 섹션에서 올바르게 폴백했는가?
