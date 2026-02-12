# /extract-widgets-v3 — v3 트레이스 분석 결과 → HTML 섹션 위젯 추출

## Purpose
`/analyze-ref-v3` 출력(v3 analysis JSON)을 **개별 HTML 섹션 위젯 파일**과 **스타일 프리셋**으로 분해합니다.
**핵심: 모든 요소를 absolute positioning으로 배치**하여, 레퍼런스 이미지 위에 HTML 레이어를 겹쳤을 때 정확히 일치하는 수준의 위젯을 생성합니다.

## 핵심 원칙: 픽셀 정합성 트레이싱

위젯은 레퍼런스 섹션의 **좌표 수준 복제본**입니다.
- 모든 요소의 위치/크기 → absolute positioning으로 직접 매핑
- 레이아웃 추론(flexbox/grid) **사용 금지** — bounds 좌표가 곧 CSS 좌표
- 텍스트 → placeholder로 치환 (역할 라벨)
- 이미지 → img-placeholder로 치환 (설명 라벨)
- **레퍼런스에 없는 요소를 추가하지 않습니다** (아이콘 장식, 추가 텍스트 등)

## Context
- 입력: `output/analysis-v3-{name}.json` (analyze-ref-v3 출력, version: "3.0", mode: "trace")
- taxonomy: `skills/section-taxonomy.json`에서 매칭된 섹션의 `required_elements`만 selective 로딩
- **스타일 가이드**: `templates/style-guide.md` — 토큰 체계, 색상/타이포 규칙, 시각 효과 정의
- 위젯 저장소: `widgets/` 디렉토리

## Input
- v3 analysis JSON (`version: "3.0"`, `mode: "trace"`, `global_analysis` + `sections` + `pattern_summary`)
- 레퍼런스 이름 (영문 소문자 + 하이픈, 예: `ref-apple-airpods`)

## Output

한 번에 모두 생성합니다 (프리뷰 → 개별 파일 → 레지스트리 등록까지 자동 실행):

1. **스타일 프리셋 1개**: `widgets/_presets/preset--ref-{name}.json`
2. **통합 프리뷰 HTML 1개** (참고용): `output/widgets-preview--ref-{name}--v3.html`
   - 모든 위젯을 하나의 HTML 파일에 순서대로 조합
   - 각 위젯 상단에 라벨 표시 (`#번호 Taxonomy — widget_id` + theme 배지 + `[v3 trace]`)
   - `html-base.html`의 Tailwind + 유틸리티 CSS 포함 → 브라우저에서 바로 확인 가능
   - 프리셋의 색상을 CSS 변수(`:root`)에 적용
   - **레퍼런스 오버레이 토글** 포함 (우상단 컨트롤 패널)
3. **섹션 위젯 N개**: `widgets/{taxonomy_id_lower}/{widget_id}.widget.html`
   - 미매핑 섹션: `widgets/_custom/{widget_id}.widget.html`
4. **레지스트리 등록**: `/register-widgets` 자동 실행 → `widgets/_registry.json` 업데이트 (status: "new")

---

## Processing

### 1. 스타일 프리셋 추출

v2와 동일. `global_analysis`에서 추출합니다.

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

### 2. 섹션별 HTML 위젯 추출 (핵심 — Absolute Positioning)

각 분석된 섹션을 독립 HTML 위젯으로 변환합니다.
**모든 요소를 `position: absolute`로 배치합니다.**

#### 2-1. widget_id 네이밍 규칙

```
{taxonomy_id_lower}--ref-{name}--v3
```

- FeatureDetail은 변형 구분 추가: `--v3-split-lr`, `--v3-split-rl`, `--v3-stack-light`, `--v3-stack-dark`
- 커스텀 섹션: `{section_name_lower}--ref-{name}--v3`

#### 2-2. 섹션 컨테이너

모든 섹션의 루트 요소는 고정 크기 relative 컨테이너입니다:

```html
<section id="{taxonomy_id_lower}" data-trace-bounds="{taxonomy_id_lower}"
         style="position: relative; width: 860px; height: {section_height}px; overflow: hidden; background: {bg_value};">
  <!-- 모든 자식 요소는 position: absolute -->
</section>
```

- `width`: 항상 860px
- `height`: 분석의 `bounds.height` 값 (px)
- `background`: 분석의 `background.value` 값 (solid 색상 또는 gradient)
- `overflow: hidden`: 요소가 섹션 경계를 넘지 않도록

#### 2-3. 요소별 HTML 패턴

##### TEXT_BOX — width 고정, height auto (텍스트 리플로우 허용)

```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px;">
  <p style="font-size: {fontSize}px; font-weight: {fontWeight}; color: {color}; text-align: {textAlign}; margin: 0; line-height: 1.4;">[placeholder]</p>
</div>
```

- `width`: bounds.w 그대로
- `height`: **지정하지 않음** (auto) — 텍스트 길이에 따라 자연 리플로우
- placeholder: content_hint 기반 역할 placeholder 생성

##### IMAGE — width, height 모두 고정

```html
<div class="img-placeholder" style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; border-radius: {borderRadius}px;"
     data-ai-prompt="{ai_prompt.prompt}"
     data-ai-style="{ai_prompt.style}"
     data-ai-ratio="{ai_prompt.aspect_ratio}">
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">{한글 설명}</span>
</div>
```

##### BUTTON — 고정 크기

```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px;">
  <button style="width: 100%; height: 100%; font-size: {fontSize}px; font-weight: {fontWeight}; color: {color}; background: {bgColor}; border: none; border-radius: {borderRadius}px; cursor: pointer;">[버튼 텍스트]</button>
</div>
```

##### ICON — 고정 크기

```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; display: flex; align-items: center; justify-content: center;">
  <span style="font-size: {size}px; color: {color};">{의미적 아이콘 문자}</span>
</div>
```

의미적 아이콘 문자 매핑:
| meaning | 문자 |
|---------|------|
| checkmark | ✓ |
| arrow-right | → |
| arrow-down | ↓ |
| star | ★ |
| plus | + |
| minus | − |
| close | ✕ |
| 기타 | ● (기본) |

##### CARD — 로컬 포지셔닝 컨텍스트 생성

카드는 새로운 `position: relative` 컨텍스트를 만듭니다. 자식 요소의 좌표는 카드 기준 상대 좌표로 변환합니다.

```html
<div style="position: absolute; left: {card_x}px; top: {card_y}px; width: {card_w}px; height: {card_h}px; background: {bgColor}; border-radius: {borderRadius}px; overflow: hidden; {border_style}">
  <!-- 자식 좌표: child_x - card_x, child_y - card_y -->
  <div style="position: absolute; left: {rel_x}px; top: {rel_y}px; width: {child_w}px;">
    <!-- 자식 요소 -->
  </div>
</div>
```

좌표 변환 규칙:
- `rel_x = child_bounds.x - card_bounds.x`
- `rel_y = child_bounds.y - card_bounds.y`
- 카드 내부에서는 `position: absolute` 유지

##### 장식 요소 (Decorations) — 모두 absolute positioning

**LINE**:
```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; background: {stroke}; opacity: {opacity};"></div>
```

**DOT**:
```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {radius*2}px; height: {radius*2}px; border-radius: 50%; background: {fill};"></div>
```

**DOT_GROUP**:
```html
<!-- 개별 도트를 각각 absolute로 배치 -->
<div style="position: absolute; left: {x}px; top: {y}px; width: {radius*2}px; height: {radius*2}px; border-radius: 50%; background: {fill};"></div>
<div style="position: absolute; left: {x + radius*2 + gap}px; top: {y}px; width: {radius*2}px; height: {radius*2}px; border-radius: 50%; background: {fill};"></div>
<!-- count만큼 반복, horizontal이면 x 증가, vertical이면 y 증가 -->
```

**SHAPE**:
```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; background: {fill}; border-radius: {borderRadius}px; opacity: {opacity};"></div>
```

**GRADIENT_OVERLAY**:
```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; background: {gradient}; opacity: {opacity};"></div>
```

**BADGE**:
```html
<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px;">
  <span style="display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: {bgColor}; color: {color}; border-radius: {borderRadius}px; font-size: {fontSize}px; font-weight: 500;">{content_hint}</span>
</div>
```

#### 2-4. z_order 처리

분석에 `z_order` 배열이 있으면, 해당 순서로 HTML 요소를 렌더합니다 (DOM 순서 = 뒤→앞).
`z_order`가 없으면 기본 순서: decorations 먼저, 그 다음 elements, 각각 y좌표 순.

#### 2-5. 반복 패턴 처리

분석의 `pattern` 블록이 있는 그룹은 template를 반복하여 HTML을 생성합니다.
**반복 요소도 모두 absolute positioning**입니다.

그룹의 bounds와 pattern.count에서 개별 카드 크기와 위치를 계산합니다:
- horizontal 방향: 카드 width = (group.w - (count-1) * gap) / count, 각 카드 x = group.x + i * (card_w + gap)
- vertical 방향: 카드 height = (group.h - (count-1) * gap) / count, 각 카드 y = group.y + i * (card_h + gap)

placeholder 넘버링: 반복 시 `[수치 1]`, `[수치 2]`, `[수치 3]`으로 고유하게 넘버링합니다.

#### 2-6. HTML 생성 규칙

##### 텍스트 placeholder 생성
- 분석의 `content_hint`에 원문이 있으면 → 해당 텍스트를 기반으로 역할 placeholder 생성
  - 예: content_hint "Point.1" → `[Point.1]` (레퍼런스의 고유 라벨 보존)
  - 예: content_hint "바삭하고 진한 견과 풍미" → `[섹션 타이틀]`
- content_hint가 없거나 "읽기 불가"이면 → 역할 기반 generic placeholder
  - 예: role "메인 카피" → `[메인 카피]`

##### 색상 처리
- 소스 레퍼런스의 **실제 hex 색상** 사용 (generate-html에서 CSS 변수로 리매핑됨)
- 프리셋의 `brand_main` hex → 인라인 스타일에 실제 hex 사용
- 프리셋의 `accent` hex → 인라인 스타일에 실제 hex 사용
- 배경: 분석에서 추출한 실제 색상 사용

#### 2-7. WIDGET_META 포맷

```html
<!--WIDGET_META
{
  "widget_id": "{taxonomy_id_lower}--ref-{name}--v3",
  "taxonomy_id": "Hook",
  "category": "intro",
  "style_tags": ["프리셋의 상위 3개 태그"],
  "theme": "dark",
  "composition": "trace",
  "analysis_version": "3.0",
  "trace_info": {
    "section_height": 600,
    "element_count": 8,
    "decoration_count": 3
  },
  "provenance": {
    "source_ref": "ref-{name}",
    "extracted_date": "YYYY-MM-DD",
    "analysis_version": "3.0"
  },
  "copywriting_guide": "taxonomy 또는 분석에서 추출한 카피라이팅 가이드",
  "sample_data": {
    "texts": { "[브랜드명]": "샘플 브랜드명" },
    "images": [{ "label": "img-label 텍스트", "src": "https://...", "alt": "설명" }]
  }
}
-->
```

**v2 대비 변경:**
- `composition`: 항상 `"trace"` (stack/split/composed 분류 없음)
- `analysis_version`: `"3.0"`
- `trace_info`: 섹션 높이, 요소 수, 장식 수 메타데이터 추가

#### 2-8. sample_data 생성 (Demo 모드용)

v2와 동일. 각 위젯의 WIDGET_META에 `sample_data`를 포함합니다.

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

### 3. theme 판별

배경색 밝기로 판별:
- RGB 밝기 `(R*299 + G*587 + B*114) / 1000`
- 128 초과: `light`, 이하: `dark`

분석의 `background.theme` 값이 이미 있으므로 직접 사용합니다.

### 4. 카테고리 매핑

| taxonomy_id | category |
|---|---|
| Hook, WhatIsThis, BrandName, SetContents | intro |
| WhyCore, PainPoint, Solution | problem |
| FeaturesOverview, FeatureDetail, Tips, Differentiator, StatsHighlight | features |
| Comparison, Safety, Target, Reviews, ProductSpec, FAQ, Warranty | trust |
| CTABanner, EventPromo, CTA | conversion |

### 5. 통합 프리뷰 HTML 생성 (레퍼런스 오버레이 포함)

**파일**: `output/widgets-preview--ref-{name}--v3.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=860">
  <title>Widget Preview — ref-{name} v3 trace</title>

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Pretendard 한국어 폰트 -->
  <link rel="stylesheet" as="style" crossorigin
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />

  <!-- Tailwind 인라인 설정 (html-base.html에서 복사) -->
  <script>
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          pretendard: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        },
        fontSize: {
          'hero':    ['56px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
          'section': ['40px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
          'feature-num': ['72px', { lineHeight: '1.0', letterSpacing: '-0.04em', fontWeight: '700' }],
          'sub':     ['28px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
          'question':['28px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
          'answer':  ['36px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
          'item':    ['24px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
          'body':    ['22px', { lineHeight: '1.6', fontWeight: '400' }],
          'small':   ['20px', { lineHeight: '1.6', fontWeight: '400' }],
          'caption': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        },
        colors: {
          brand: 'var(--brand-main)',
          accent: 'var(--accent)',
          dark: { 1: '#111111', 2: '#1A1A1A' },
          sub: '#888888',
          muted: '#666666',
          placeholder: '#2A2A2A',
        },
        width: { 'canvas': '860px', 'content': '760px' },
      },
    },
  }
  </script>

  <style>
    :root { --brand-main: {brand_main}; --accent: {accent}; }

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Pretendard', system-ui, -apple-system, sans-serif;
      background: #f0f0f0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .page-canvas {
      width: 860px;
      max-width: 860px;
      min-width: 860px;
      overflow: hidden;
      position: relative;
    }

    /* 이미지 플레이스홀더 (html-base.html에서 복사) */
    .img-placeholder {
      background: #2A2A2A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #666;
      overflow: hidden;
    }
    .img-placeholder .img-label {
      font-size: 12px;
      color: #888;
      text-align: center;
      padding: 0 8px;
    }

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
    .badge-trace { background: #ff6b6b; color: white; }
    .badge-dark { background: #555; color: #ccc; }
    .badge-light { background: #ffd43b; color: #333; }

    /* --- 레퍼런스 오버레이 컨트롤 --- */
    .trace-controls {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      background: rgba(0,0,0,0.85);
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 220px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .trace-controls h3 {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
      color: #ff6b6b;
    }
    .trace-controls label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .trace-controls input[type="range"] {
      width: 100%;
      accent-color: #ff6b6b;
    }
    .trace-controls input[type="checkbox"] {
      accent-color: #ff6b6b;
    }

    /* 레퍼런스 오버레이 이미지 */
    .ref-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 860px;
      pointer-events: none;
      z-index: 1000;
      opacity: 0.5;
      display: none;
    }

    /* bounds 디버그 아웃라인 */
    [data-trace-bounds] {
      position: relative;
    }
    .show-bounds [data-trace-bounds] > div {
      outline: 1px dashed rgba(255, 107, 107, 0.4);
    }
  </style>
</head>
<body>
  <!-- 레퍼런스 오버레이 컨트롤 패널 -->
  <div class="trace-controls">
    <h3>v3 Trace Controls</h3>
    <label>
      <input type="checkbox" id="toggleRef" onchange="toggleReference()">
      레퍼런스 오버레이
    </label>
    <div>
      <label>투명도: <span id="opacityVal">50%</span></label>
      <input type="range" id="refOpacity" min="0" max="100" value="50" oninput="updateOpacity(this.value)">
    </div>
    <label>
      <input type="checkbox" id="toggleBounds" onchange="toggleBoundsOutline()">
      Bounds 아웃라인
    </label>
  </div>

  <div class="preview-header" style="width:860px; padding:24px; background:#222; color:white; text-align:center;">
    <h1 style="font-size:20px; margin:0 0 8px;">ref-{name} — v3 Trace Preview</h1>
    <p style="font-size:13px; color:#888; margin:0;">{widget_count}개 위젯 · {style_tags} · <span style="color:#ff6b6b; font-weight:700;">v3 trace mode</span></p>
  </div>

  <div class="page-canvas" id="pageCanvas">
    <!-- 레퍼런스 오버레이 이미지 -->
    <img class="ref-overlay" id="refOverlay" src="../references/{name}.png" alt="Reference">

    <!-- 위젯마다 반복 -->
    <div class="widget-label">
      #1 {Taxonomy} — {widget_id}
      <span class="badge badge-trace">v3 trace</span>
      <span class="badge badge-{theme}">{theme}</span>
    </div>
    <section>...</section>
    <!-- ... -->
  </div>

  <script>
    function toggleReference() {
      const overlay = document.getElementById('refOverlay');
      overlay.style.display = document.getElementById('toggleRef').checked ? 'block' : 'none';
    }
    function updateOpacity(val) {
      document.getElementById('refOverlay').style.opacity = val / 100;
      document.getElementById('opacityVal').textContent = val + '%';
    }
    function toggleBoundsOutline() {
      document.getElementById('pageCanvas').classList.toggle('show-bounds',
        document.getElementById('toggleBounds').checked);
    }
  </script>
</body>
</html>
```

각 위젯 상단 라벨에 표시할 정보:
- `#순번` + `Taxonomy` + `widget_id`
- `[v3 trace]` 배지 (빨간색)
- theme 배지 (light=노랑, dark=회색)

### 6. 개별 위젯 파일 저장

프리뷰 HTML 생성과 동시에 개별 폴더로 저장합니다:

| 조건 | 경로 |
|---|---|
| taxonomy_id 있음 | `widgets/{taxonomy_id_lower}/{widget_id}.widget.html` |
| taxonomy_id 없음 (커스텀) | `widgets/_custom/{widget_id}.widget.html` |

각 위젯 파일은 `<!--WIDGET_META ... -->` + `<section>...</section>` 부분만 포함합니다.

### 7. 레지스트리 등록

개별 파일 저장 후 자동으로 `/register-widgets`를 실행합니다.
등록 시 모든 위젯은 `status: "new"`로 등록됩니다.

---

## v2 vs v3 품질 차이 요약

| 영역 | v2 (semantic) | v3 (trace) |
|------|---------------|------------|
| **레이아웃** | flexbox/grid로 의미 해석 | absolute positioning으로 좌표 직접 매핑 |
| **레퍼런스 정합성** | 근사 (gap/padding 추정) | 픽셀 수준 일치 |
| **composition** | stack/split/composed 분류 | 항상 "trace" (분류 불필요) |
| **콘텐츠 리플로우** | flexbox 기반 자동 리플로우 | TEXT_BOX만 height auto 허용 |
| **Figma 변환** | 수동 재배치 필요 | absolute → Figma Frame 직결 |
| **재사용성** | 다양한 콘텐츠에 적합 | 레퍼런스 특화 (비주얼 충실도 우선) |
| **장식 요소** | CSS 유틸리티 클래스 활용 | 개별 absolute div |
| **카드 내부** | glass-card + flex 레이아웃 | position: relative 컨텍스트 + 자식 absolute |

---

## Validation
- [ ] 모든 위젯이 `<!--WIDGET_META`로 시작하는가?
- [ ] WIDGET_META 내 JSON이 유효한가?
- [ ] 메타데이터에 `widget_id`, `taxonomy_id`, `category`, `composition: "trace"`, `theme` 있는가?
- [ ] 메타데이터에 `analysis_version: "3.0"` 있는가?
- [ ] 메타데이터에 `trace_info` (section_height, element_count, decoration_count) 있는가?
- [ ] 메타데이터 JSON 뒤에 `-->` 닫힘 태그가 있는가?
- [ ] `<section>` 루트 요소에 `position: relative; width: 860px; height: {h}px;` 스타일이 있는가?
- [ ] `<section>`에 `id`와 `data-trace-bounds` 속성이 있는가?
- [ ] 모든 자식 요소에 `position: absolute; left: {x}px; top: {y}px;` 스타일이 있는가?
- [ ] TEXT_BOX 요소에 height가 **지정되지 않았는가** (auto)?
- [ ] IMAGE/BUTTON/ICON 요소에 width와 height가 모두 고정되었는가?
- [ ] CARD 내부 자식의 좌표가 카드 기준 상대 좌표로 변환되었는가?
- [ ] 모든 이미지에 `img-placeholder` 클래스 + `data-ai-prompt` + `data-ai-style` + `data-ai-ratio` 있는가?
- [ ] `data-ai-prompt` 내 제품명이 `[product]` 플레이스홀더로 치환되었는가?
- [ ] 텍스트에 `[브랜드명]`, `[메인 카피]` 등 placeholder가 사용되었는가?
- [ ] 프리셋 파일이 올바르게 생성되었는가?
- [ ] widget_id가 `--v3` 접미사를 포함하는가?
- [ ] widget_id가 전체에서 유니크한가?
- [ ] 개별 위젯 파일이 올바른 경로에 저장되었는가?
- [ ] 레지스트리에 `status: "new"`로 등록되었는가?
- [ ] 모든 위젯 WIDGET_META에 `sample_data`가 포함되어 있는가?
- [ ] `sample_data.texts`의 키가 HTML 본문의 placeholder와 일치하는가?
- [ ] `sample_data.images`의 `label`이 HTML의 `img-label` 텍스트와 정확히 일치하는가?
- [ ] 동일 placeholder가 여러 곳에 쓰이지 않는가? (고유 넘버링 확인)
- [ ] **v3 신규**: z_order 순서대로 HTML이 렌더되었는가?
- [ ] **v3 신규**: 프리뷰 HTML에 레퍼런스 오버레이 컨트롤이 포함되었는가?
- [ ] **v3 신규**: 프리뷰 HTML에 bounds 아웃라인 토글이 포함되었는가?
