# /extract-widgets-v4 — v3 분석 결과 → 와이어프레임 HTML 위젯 추출

## Purpose
`/analyze-ref-v3` 출력(v3 analysis JSON)을 **와이어프레임 스타일 HTML 위젯 파일**과 **스타일 프리셋**으로 분해합니다.
**핵심: auto-layout(flexbox/grid)으로 구조적 와이어프레임**을 생성하여 Figma Make 워크플로우에 최적화합니다.

## 핵심 원칙: 구조적 와이어프레임

위젯은 레퍼런스 섹션의 **레이아웃 구조 추상화**입니다.
- **auto-layout** (flexbox/grid) 사용, absolute positioning **금지**
- **모든 요소에 한글 레이블** ("텍스트 박스 2줄", "이미지 영역")
- **무채색** — 회색/흰색만 (#E8E8E8, #F5F5F5, #FFFFFF, #E0E0E0, #D0D0D0, #CCCCCC)
- **860px 캔버스** 유지, Tailwind CDN 미사용 (자체 `.wf-*` CSS 클래스)
- 레퍼런스에 없는 요소를 추가하지 않습니다

## Context
- 입력: `output/analysis-v3-{name}.json` (analyze-ref-v3 출력, version: "3.0", mode: "trace")
- taxonomy: `skills/section-taxonomy.json`에서 매칭된 섹션의 `required_elements`만 selective 로딩
- **와이어프레임 CSS**: `templates/wireframe-base.html` — `.wf-*` 클래스 체계
- 위젯 저장소: `widgets/` 디렉토리

## Input
- v3 analysis JSON (`version: "3.0"`, `mode: "trace"`, `global_analysis` + `sections` + `pattern_summary`)
- 레퍼런스 이름 (영문 소문자 + 하이픈, 예: `ref-test-sample`)

## Output

한 번에 모두 생성합니다 (프리뷰 → 개별 파일 → 레지스트리 등록까지 자동 실행):

1. **스타일 프리셋 1개**: `widgets/_presets/preset--ref-{name}.json`
2. **통합 프리뷰 HTML 1개** (참고용): `output/widgets-preview--ref-{name}--v4.html`
   - 모든 위젯을 하나의 HTML 파일에 순서대로 조합
   - 각 위젯 상단에 라벨 표시 (`#번호 Taxonomy — widget_id` + `[v4 wireframe]` 배지)
   - `wireframe-base.html`의 `.wf-*` CSS 포함 → 브라우저에서 바로 확인 가능
3. **섹션 위젯 N개**: `widgets/{taxonomy_id_lower}/{widget_id}.widget.html`
   - 미매핑 섹션: `widgets/_custom/{widget_id}.widget.html`
4. **레지스트리 등록**: `/register-widgets` 자동 실행 → `widgets/_registry.json` 업데이트 (status: "new")

---

## Processing

### 1. 스타일 프리셋 추출

`global_analysis`에서 추출합니다. v2/v3와 동일 포맷.

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

### 2. 레이아웃 추론 로직 (v3 그룹 → 와이어프레임 매핑)

v3 분석의 그룹 role과 요소 타입을 와이어프레임 레이아웃으로 변환합니다.

#### 그룹 Role → 와이어프레임 레이아웃

| v3 Group Role / layout.type | 와이어프레임 레이아웃 | CSS 클래스 |
|---------------|---------------------|------------|
| `header-text-group` | 수직 스택, 중앙 정렬 | `.wf-content` |
| `alternating-list` / `alternating` | 수직 나열, 각 아이템 `.wf-split--lr`/`--rl` 교대 | `.wf-alternating` 컨테이너 |
| `vertical-list` / `stack` | 수직 나열, 중앙 정렬 | `.wf-stack` |
| `horizontal-list` / `row` | 수평 나열 | `.wf-row` |
| `grid-row` / `grid` (columns=2, rows=2) | 2x2 그리드 | `.wf-grid-2x2` |
| `grid-row` × 2 (같은 자식 수) | NxM 그리드 | `.wf-grid-2x2` |
| `grid-row` (2 children) | 2열 그리드 | `.wf-grid-2` |
| `grid-row` (3 children) | 3열 그리드 | `.wf-grid-3` |
| `split-left` + `split-right` | 2분할 | `.wf-split` |
| `feature-card` | 카드 컨테이너 | `.wf-card` |
| `icon-text-pair` | 가로 행 | `.wf-row` |
| `overlay-content` | 수직 스택 + 설명 | `.wf-content` |

#### 요소 타입 → 와이어프레임 렌더링

| v3 Type | 와이어프레임 클래스 | 라벨 생성 규칙 |
|---------|-------------------|---------------|
| TEXT_BOX (fontSize ≥ 24) | `.wf-text .wf-text--heading` | "텍스트 박스 N줄 (제목)" |
| TEXT_BOX (16–23) | `.wf-text .wf-text--body` | "텍스트 박스 N줄" |
| TEXT_BOX (< 16) | `.wf-text .wf-text--small` | "텍스트 박스 N줄 (작은글)" |
| IMAGE | `.wf-image img-placeholder` | "이미지 영역 (ratio)" |
| BUTTON | `.wf-button` | "버튼" |
| BADGE | `.wf-badge` | content_hint 텍스트 그대로 |
| CARD | `.wf-card` + 자식 재귀 | 카드 컨테이너 |
| ICON | `.wf-badge` (작은 크기) | 아이콘 의미 텍스트 |
| SHAPE, GRADIENT_OVERLAY | **생략** | — |
| LINE | **생략** | — |
| DOT, DOT_GROUP | **생략** | — |

#### 줄 수 추정

```
lineCount = Math.ceil(bounds.h / (fontSize × 1.4))
clamp(lineCount, 1, 4)
```

### 3. 섹션별 와이어프레임 HTML 생성

#### 3-1. widget_id 네이밍 규칙

```
{taxonomy_id_lower}--ref-{name}--v4
```

- FeatureDetail은 변형 구분 추가: `--v4-split-lr`, `--v4-split-rl`, `--v4-stack-light`, `--v4-stack-dark`
- 커스텀 섹션: `{section_name_lower}--ref-{name}--v4`

#### 3-2. 섹션 컨테이너

```html
<section class="wf-section">
  <span class="wf-section-label">{Taxonomy} #{order}</span>
  <!-- 와이어프레임 콘텐츠 -->
</section>
```

#### 3-3. 요소별 HTML 패턴

##### TEXT_BOX

```html
<div class="wf-text wf-text--{size}">
  [placeholder 텍스트]
  <div class="wf-text--label">텍스트 박스 {N}줄{크기 설명}</div>
</div>
```

- `{size}`: heading / body / small (fontSize 기반)
- `{N}`: 줄 수 추정값
- `{크기 설명}`: heading이면 " (제목)", small이면 " (작은글)", body면 ""
- `[placeholder 텍스트]`: content_hint 기반 역할 placeholder

##### IMAGE

```html
<div class="wf-image img-placeholder" style="height:{h}px;"
     data-ai-prompt="{ai_prompt.prompt}"
     data-ai-style="{ai_prompt.style}"
     data-ai-ratio="{ai_prompt.aspect_ratio}">
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">{한글 설명}</span>
</div>
```

- `height`: 비율 기반 계산. 예: 16:9 → `width * 9/16`, 4:3 → `width * 3/4`
- 정확한 높이를 알 수 없으면 v3 bounds 비율로 추정
- `data-ai-*` 속성 유지 (generate-figma-make-prompt-v2에서 사용)
- **듀얼 클래스** `wf-image img-placeholder` — 기존 `applyDemoMode()` regex 호환

##### BUTTON

```html
<button class="wf-button">[버튼 텍스트]</button>
```

##### BADGE

```html
<span class="wf-badge">{content_hint}</span>
```

##### CARD

```html
<div class="wf-card">
  <!-- 자식 요소들 재귀적으로 렌더 -->
</div>
```

##### ICON (→ 작은 배지로 변환)

```html
<span class="wf-badge" style="font-size:11px; padding:4px 8px;">{의미 텍스트}</span>
```

##### SHAPE, GRADIENT_OVERLAY, LINE, DOT, DOT_GROUP → 생략

장식 요소는 와이어프레임에서 생략합니다. 구조적 의미가 있는 BADGE만 렌더링합니다.

#### 3-4. 그룹 구조 → 레이아웃 조립

섹션의 groups 배열을 분석하여 레이아웃을 조립합니다.

**Step 1: 그룹 계층 파악**

```
섹션 루트
├── header-text-group → .wf-content 안에 텍스트 블록 나열
├── alternating-list (g2) → .wf-alternating 컨테이너
│   ├── 아이템 1 (lr) → .wf-split.wf-split--lr
│   ├── 아이템 2 (rl) → .wf-split.wf-split--rl
│   └── ...
└── grid-row (g3) + grid-row (g4) → .wf-grid-2x2 (그리드 합치기)
```

**Step 2: 레이아웃 그룹 처리 규칙**

그룹의 `role`과 `layout` 필드에 따라 와이어프레임을 생성합니다:

**alternating-list (지그재그)**:
`layout.item_direction_pattern` 배열에 따라 각 아이템을 `.wf-split--lr` 또는 `.wf-split--rl`로 교대 배치합니다.
```html
<div class="wf-alternating">
  <!-- lr: 이미지 왼쪽, 텍스트 오른쪽 -->
  <div class="wf-split wf-split--lr">
    <div class="wf-card">
      <div class="wf-image img-placeholder">...</div>
    </div>
    <div class="wf-stack">
      <span class="wf-badge">①</span>
      <div class="wf-text wf-text--body">[설명]</div>
    </div>
  </div>
  <!-- rl: 텍스트 왼쪽, 이미지 오른쪽 (DOM 순서 반전) -->
  <div class="wf-split wf-split--rl">
    <div class="wf-stack">
      <span class="wf-badge">②</span>
      <div class="wf-text wf-text--body">[설명]</div>
    </div>
    <div class="wf-card">
      <div class="wf-image img-placeholder">...</div>
    </div>
  </div>
</div>
```

**grid-row 합치기**:
연속된 `grid-row` 그룹(같은 자식 수)은 하나의 그리드로 합칩니다:
- 2개 row × 2 children = `.wf-grid-2x2`
- 1개 row × 2 children = `.wf-grid-2`
- 1개 row × 3 children = `.wf-grid-3`

**Step 3: CARD 자식 렌더링**

CARD 타입 요소의 `children` 배열에 있는 요소 ID를 찾아 재귀적으로 렌더합니다:
```html
<div class="wf-card">
  <div class="wf-image img-placeholder" style="height:160px;">...</div>
  <div class="wf-text wf-text--body">[설명]<div class="wf-text--label">텍스트 박스 1줄</div></div>
</div>
```

**Step 4: 남은 요소 처리**

그룹에 속하지 않은 요소(decorations 중 BADGE 타입)는 적절한 위치에 배치:
- 섹션 최상단 배지 → `.wf-section` 내 첫 번째 자식 (align-self: flex-start)
- 섹션 하단 배지 → `.wf-row`로 묶어 하단 배치
- 카드 사이 배지 → 해당 카드 위에 오버레이 또는 인접 배치

#### 3-5. 전체 조립 예시: FeatureDetail

분석 데이터:
- d1: BADGE "Point 03" (좌상단)
- g1: header-text-group [e1: 서브헤딩, e2: 메인 헤딩]
- g2: grid-row [e3: CARD, e4: CARD]
- g3: grid-row [e5: CARD, e6: CARD]
- d2~d5: BADGE (넘버 서클, 카드 중앙에 오버레이)

생성되는 와이어프레임:

```html
<section class="wf-section">
  <span class="wf-section-label">FeatureDetail #3</span>

  <!-- 배지 (좌상단 정렬) -->
  <div style="align-self: flex-start;">
    <span class="wf-badge">Point 03</span>
  </div>

  <!-- 헤더 텍스트 그룹 -->
  <div class="wf-content">
    <div class="wf-text wf-text--small">
      [포인트 서브 헤딩]
      <div class="wf-text--label">텍스트 박스 1줄 (작은글)</div>
    </div>
    <div class="wf-text wf-text--heading">
      [포인트 메인 헤딩]
      <div class="wf-text--label">텍스트 박스 1줄 (제목)</div>
    </div>
  </div>

  <!-- 2x2 카드 그리드 -->
  <div class="wf-grid-2x2">
    <div class="wf-card">
      <div class="wf-image img-placeholder" style="height:160px;"
           data-ai-prompt="Vietnamese cashew..."
           data-ai-style="product_lifestyle"
           data-ai-ratio="16:9">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span class="img-label">프로세스 1 이미지</span>
      </div>
      <div class="wf-text wf-text--body">
        [프로세스 1 설명]
        <div class="wf-text--label">텍스트 박스 1줄</div>
      </div>
    </div>
    <div class="wf-card">
      <div class="wf-image img-placeholder" style="height:160px;"
           data-ai-prompt="Roasted cashew nuts..."
           data-ai-style="product_detail"
           data-ai-ratio="16:9">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span class="img-label">프로세스 2 이미지</span>
      </div>
      <div class="wf-text wf-text--body">
        [프로세스 2 설명]
        <div class="wf-text--label">텍스트 박스 1줄</div>
      </div>
    </div>
    <div class="wf-card">
      <div class="wf-image img-placeholder" style="height:160px;"
           data-ai-prompt="Clean food manufacturing..."
           data-ai-style="infographic"
           data-ai-ratio="16:9">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span class="img-label">프로세스 3 이미지</span>
      </div>
      <div class="wf-text wf-text--body">
        [프로세스 3 설명]
        <div class="wf-text--label">텍스트 박스 1줄</div>
      </div>
    </div>
    <div class="wf-card">
      <div class="wf-image img-placeholder" style="height:160px;"
           data-ai-prompt="Sealed food package..."
           data-ai-style="product_detail"
           data-ai-ratio="16:9">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span class="img-label">프로세스 4 이미지</span>
      </div>
      <div class="wf-text wf-text--body">
        [프로세스 4 설명]
        <div class="wf-text--label">텍스트 박스 1줄</div>
      </div>
    </div>
  </div>
</section>
```

### 4. WIDGET_META 포맷

```html
<!--WIDGET_META
{
  "widget_id": "{taxonomy_id_lower}--ref-{name}--v4",
  "taxonomy_id": "FeatureDetail",
  "category": "features",
  "style_tags": ["프리셋의 상위 3개 태그"],
  "theme": "light",
  "composition": "wireframe",
  "analysis_version": "3.0",
  "wireframe_info": {
    "layout_type": "stack | split | composed",
    "sub_layouts": [
      { "type": "header-text-group", "elements": ["badge", "text-small", "text-heading"] },
      { "type": "grid-2x2", "card_template": ["image", "text-body"] }
    ]
  },
  "figma_make_hints": {
    "section_description": "포인트 넘버링 배지 + 2x2 카드 그리드 (이미지+캡션)",
    "layout_structure": "badge(top-left) → heading(center) → 2x2 card grid",
    "key_elements": [
      { "role": "badge", "label": "Point 03", "position": "top-left" },
      { "role": "heading", "lines": 2, "alignment": "center" },
      { "role": "card-grid", "columns": 2, "rows": 2, "card_content": "image + caption" }
    ],
    "ai_images": [
      {
        "role": "프로세스 1 이미지",
        "prompt": "Vietnamese cashew nut farm...",
        "style": "product_lifestyle",
        "ratio": "16:9"
      }
    ]
  },
  "provenance": {
    "source_ref": "ref-{name}",
    "extracted_date": "YYYY-MM-DD",
    "analysis_version": "3.0"
  },
  "copywriting_guide": "taxonomy 또는 분석에서 추출한 카피라이팅 가이드",
  "sample_data": {
    "texts": {
      "[포인트 서브 헤딩]": "꼼꼼한 생산관리로 완성한",
      "[포인트 메인 헤딩]": "안심 먹거리 캐슈넛"
    },
    "images": [
      { "label": "프로세스 1 이미지", "src": "https://images.unsplash.com/photo-xxx?w=760&fit=crop&q=80", "alt": "농장 선별 이미지" }
    ]
  }
}
-->
```

#### WIDGET_META 필드 설명

| 필드 | 용도 |
|------|------|
| `composition` | 항상 `"wireframe"` (v4 전용 값) |
| `wireframe_info` | 와이어프레임 레이아웃 구조 메타데이터 |
| `wireframe_info.layout_type` | 전체 레이아웃: `stack` (수직 나열), `split` (좌우 분할), `composed` (복합) |
| `wireframe_info.sub_layouts` | 내부 구조 배열 — 각 그룹의 타입과 포함 요소 |
| `figma_make_hints` | Figma Make 프롬프트 생성용 힌트 |
| `figma_make_hints.section_description` | 섹션 한줄 설명 (한글) |
| `figma_make_hints.layout_structure` | 레이아웃 구조 요약 (화살표 표기) |
| `figma_make_hints.key_elements` | 핵심 요소 목록 (역할, 위치, 크기) |
| `figma_make_hints.ai_images` | AI 이미지 생성 프롬프트 목록 |

### 5. theme 판별

v3 분석의 `background.theme` 값을 직접 사용합니다.
분석에 없으면 배경색 밝기로 판별:
- RGB 밝기 `(R*299 + G*587 + B*114) / 1000`
- 128 초과: `light`, 이하: `dark`

### 6. 카테고리 매핑

| taxonomy_id | category |
|---|---|
| Hook, WhatIsThis, BrandName, SetContents | intro |
| WhyCore, PainPoint, Solution | problem |
| FeaturesOverview, FeatureDetail, Tips, Differentiator, StatsHighlight | features |
| Comparison, Safety, Target, Reviews, ProductSpec, FAQ, Warranty | trust |
| CTABanner, EventPromo, CTA | conversion |

### 7. 통합 프리뷰 HTML 생성

**파일**: `output/widgets-preview--ref-{name}--v4.html`

`templates/wireframe-base.html`을 기반으로 구성합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=860">
  <title>Widget Preview — ref-{name} v4 wireframe</title>

  <!-- Pretendard 한국어 폰트 -->
  <link rel="stylesheet" as="style" crossorigin
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />

  <style>
    /* wireframe-base.html의 전체 CSS를 여기에 인라인 */
    /* ... (.wf-* 클래스 전체) ... */

    /* 위젯 라벨 */
    .widget-label {
      background: #333;
      color: #fff;
      padding: 8px 16px;
      font-size: 13px;
      font-family: monospace;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 860px;
    }
    .widget-label .badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-wireframe { background: #6C63FF; color: white; }
    .badge-light { background: #ffd43b; color: #333; }
    .badge-dark { background: #555; color: #ccc; }
  </style>
</head>
<body>
  <div class="preview-header" style="width:860px; padding:24px; background:#222; color:white; text-align:center;">
    <h1 style="font-size:20px; margin:0 0 8px;">ref-{name} — v4 Wireframe Preview</h1>
    <p style="font-size:13px; color:#888; margin:0;">{widget_count}개 위젯 · {style_tags} · <span style="color:#6C63FF; font-weight:700;">v4 wireframe mode</span></p>
  </div>

  <div class="page-canvas">
    <!-- 위젯마다 반복 -->
    <div class="widget-label">
      #1 {Taxonomy} — {widget_id}
      <span class="badge badge-wireframe">v4 wireframe</span>
      <span class="badge badge-{theme}">{theme}</span>
    </div>
    <section class="wf-section">...</section>
    <!-- ... -->
  </div>
</body>
</html>
```

### 8. 개별 위젯 파일 저장

| 조건 | 경로 |
|---|---|
| taxonomy_id 있음 | `widgets/{taxonomy_id_lower}/{widget_id}.widget.html` |
| taxonomy_id 없음 (커스텀) | `widgets/_custom/{widget_id}.widget.html` |

각 위젯 파일은 `<!--WIDGET_META ... -->` + `<section class="wf-section">...</section>` 부분만 포함합니다.

### 9. 레지스트리 등록

개별 파일 저장 후 자동으로 `/register-widgets`를 실행합니다.
등록 시 모든 위젯은 `status: "new"`로 등록됩니다.

### 10. sample_data 생성 (Demo 모드용)

각 위젯의 WIDGET_META에 `sample_data`를 포함합니다.

#### 규칙

1. **`texts`**: HTML 본문의 모든 `[placeholder]`를 키로, 레퍼런스 제품에 맞는 샘플 텍스트를 값으로 매핑
   - 레퍼런스 이미지에서 읽히는 실제 텍스트(content_hint)가 있으면 그것을 사용
   - 읽히지 않으면 제품 카테고리에 맞는 그럴듯한 텍스트를 생성
   - **placeholder 고유성 필수**: 동일 텍스트가 여러 곳에 반복되면 고유하게 넘버링
     - BAD: `[설명]` × 3 (모두 같은 텍스트로 치환됨)
     - GOOD: `[프로세스 1 설명]`, `[프로세스 2 설명]`, `[프로세스 3 설명]`

2. **`images`**: `img-placeholder` 안의 `<span class="img-label">` 텍스트를 `label`로, Unsplash URL을 `src`로 매핑
   - URL 형식: `https://images.unsplash.com/photo-{id}?w=760&fit=crop&q=80`
   - 제품 카테고리에 맞는 이미지 선택
   - `label`은 HTML의 `<span class="img-label">` 텍스트와 **정확히 일치**해야 함

3. **서버 치환 로직**: `applyDemoMode()`가 `texts`는 `split().join()`, `images`는 `img-placeholder` div를 `<img>` 태그로 교체

---

## 유저에게 표시

```
=== ref-{name} v4 와이어프레임 위젯 추출 + 등록 완료 ===

프리셋: preset--ref-{name} ({style_tags})

| # | Taxonomy | Widget ID | Layout | Theme |
|---|----------|-----------|--------|-------|
| 1 | FeatureDetail | featuredetail--ref-{name}--v4-stack-light | stack (2x2 grid) | light |
| 2 | Differentiator | differentiator--ref-{name}--v4 | stack | light |
| ... | ... | ... | ... | ... |

총 {N}개 위젯 등록 (status: new, composition: wireframe)

프리뷰 확인: output/widgets-preview--ref-{name}--v4.html (브라우저에서 열기)
갤러리 검수: http://localhost:3333 → "새로 추가" 탭
```

---

## Validation
- [ ] 모든 위젯이 `<!--WIDGET_META`로 시작하는가?
- [ ] WIDGET_META 내 JSON이 유효한가?
- [ ] 메타데이터에 `widget_id`, `taxonomy_id`, `category`, `composition: "wireframe"`, `theme` 있는가?
- [ ] 메타데이터에 `analysis_version: "3.0"` 있는가?
- [ ] 메타데이터에 `wireframe_info` (layout_type, sub_layouts) 있는가?
- [ ] 메타데이터에 `figma_make_hints` (section_description, layout_structure, key_elements, ai_images) 있는가?
- [ ] 메타데이터 JSON 뒤에 `-->` 닫힘 태그가 있는가?
- [ ] `<section class="wf-section">`이 루트 요소인가?
- [ ] absolute positioning이 **사용되지 않았는가** (position: absolute 금지)?
- [ ] 모든 레이아웃이 `.wf-*` 클래스로만 구성되었는가?
- [ ] 모든 텍스트 블록에 `.wf-text--label` 라벨이 있는가?
- [ ] 모든 이미지에 `wf-image img-placeholder` 듀얼 클래스가 있는가?
- [ ] 이미지에 `data-ai-prompt`, `data-ai-style`, `data-ai-ratio` 속성이 있는가?
- [ ] 이미지 내에 `<span class="img-label">` 라벨이 있는가?
- [ ] 텍스트에 `[placeholder]` 형식이 사용되었는가?
- [ ] widget_id가 `--v4` 접미사를 포함하는가?
- [ ] widget_id가 전체에서 유니크한가?
- [ ] 프리셋 파일이 올바르게 생성되었는가?
- [ ] 개별 위젯 파일이 올바른 경로에 저장되었는가?
- [ ] 레지스트리에 `status: "new"`로 등록되었는가?
- [ ] WIDGET_META에 `sample_data`가 포함되어 있는가?
- [ ] `sample_data.texts`의 키가 HTML 본문의 placeholder와 일치하는가?
- [ ] `sample_data.images`의 `label`이 HTML의 `img-label` 텍스트와 정확히 일치하는가?
- [ ] 동일 placeholder가 여러 곳에 쓰이지 않는가? (고유 넘버링 확인)
- [ ] SHAPE, GRADIENT_OVERLAY, LINE, DOT 등 장식 요소가 생략되었는가?
- [ ] 무채색만 사용되었는가? (브랜드 컬러 없음)
- [ ] 프리뷰 HTML에 `[v4 wireframe]` 배지가 표시되는가?
