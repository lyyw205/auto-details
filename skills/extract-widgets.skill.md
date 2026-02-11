# /extract-widgets — 분석 결과 → HTML 섹션 위젯 추출

## Purpose
`/analyze-ref` 출력(analysis JSON)을 **개별 HTML 섹션 위젯 파일**과 **스타일 프리셋**으로 분해합니다.

## Context
- 입력: `output/analysis-{name}.json` (analyze-ref 출력)
- taxonomy: `skills/section-taxonomy.json`에서 매칭된 섹션의 `required_elements`만 selective 로딩
- **스타일 가이드**: `templates/style-guide.md` — 토큰 체계, 색상/타이포 규칙, 시각 효과 정의
- 섹션 패턴: `templates/html-section-patterns.md` — composition별 HTML/CSS 패턴 참조
- 위젯 저장소: `widgets/` 디렉토리

## Input
- analysis JSON (`global_analysis` + `sections` + `pattern_summary`)
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

## Processing

### 1. 스타일 프리셋 추출

`global_analysis`에서 추출 (JSON 유지):

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
    "font_family": "감지된 폰트 또는 Inter"
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

#### 2-1. widget_id 네이밍 규칙

```
{taxonomy_id_lower}--ref-{name}
```

- FeatureDetail은 변형 구분 추가: `--split-lr` (이미지 좌), `--split-rl` (이미지 우), `--stack-light`, `--stack-dark`
- 커스텀 섹션: `{section_name_lower}--ref-{name}`

#### 2-2. HTML 위젯 포맷

각 위젯은 **메타데이터 주석 + `<section>` HTML**로 구성됩니다:

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
    "extracted_date": "YYYY-MM-DD"
  },
  "copywriting_guide": "taxonomy 또는 분석에서 추출한 카피라이팅 가이드",
  "sample_data": {
    "texts": {
      "[브랜드명]": "샘플 브랜드명",
      "[메인 카피]": "샘플 메인 카피"
    },
    "images": [
      {
        "label": "img-label 텍스트와 정확히 일치",
        "src": "https://images.unsplash.com/photo-xxx?w=760&fit=crop&q=80",
        "alt": "이미지 설명"
      }
    ]
  }
}
-->
<section id="{taxonomy_id_lower}" class="..." style="...">
  <!-- 실제 HTML/CSS 콘텐츠 -->
</section>
```

#### 2-3. HTML 생성 규칙

**반드시 `templates/html-section-patterns.md`의 패턴을 참조**하여 생성합니다.

##### Composition별 HTML 구조

**stack** (수직 나열):
```html
<section id="{id}" class="flex flex-col items-center gap-6 section-padding {bg-class}">
  <div class="content-narrow flex flex-col items-center gap-6 text-center">
    <!-- 콘텐츠 -->
  </div>
</section>
```

**split** (2분할):
```html
<section id="{id}" class="grid grid-cols-2 min-h-[500px] {bg-class}">
  <div class="flex flex-col justify-center px-[50px] py-[60px] gap-4">
    <!-- 텍스트 패널 -->
  </div>
  <div class="flex items-center justify-center">
    <!-- 이미지 패널 -->
  </div>
</section>
```

**composed** (레이어 오버레이):
```html
<section id="{id}" class="composed-section relative h-[{height}px] {bg-class}">
  <div class="composed-layer inset-0">
    <!-- 배경 이미지 레이어 -->
  </div>
  <div class="composed-layer inset-0 hero-overlay"></div>
  <div class="composed-layer bottom-0 left-0 right-0 p-[50px]">
    <!-- 텍스트 오버레이 -->
  </div>
</section>
```

##### 콘텐츠 생성 규칙

- **텍스트**: placeholder 사용 — `[브랜드명]`, `[메인 카피]`, `[서브 카피]`, `[기능명]`, `[설명]` 등
- **색상**: 소스 레퍼런스의 **실제 hex 색상** 사용 (생성 시 CSS 변수로 리매핑됨)
  - 프리셋의 `brand_main` → 인라인 스타일에 실제 hex 사용 (예: `style="color: #C8A87C"`)
  - 프리셋의 `accent` → 인라인 스타일에 실제 hex 사용
  - 배경: 분석에서 추출한 실제 색상 사용
- **타이포**: 프리셋의 `typography` 수치를 Tailwind 클래스로 매핑
  - `fontSize: 36` → `text-[36px]`
  - `fontWeight: 700` → `font-bold`
- **레이아웃**: 분석의 `height`, `padding`, `itemSpacing` 값을 CSS로 반영
- **시각 효과**: `templates/style-guide.md` Section 5 + `html-section-patterns.md` 참조
  - `glass-card`, `glass-card-strong` (카드)
  - `tracking-tight` (타이틀)
  - `text-shadow-hero` (composed 섹션)
  - `divider-gradient` (섹션 분리선)

##### 이미지 플레이스홀더

```html
<div class="img-placeholder w-[760px] h-[500px] rounded-xl"
     data-ai-prompt="descriptive prompt in English, [product] as placeholder"
     data-ai-style="product_hero"
     data-ai-ratio="4:3">
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">구체적 한글 설명</span>
</div>
```

- **`data-ai-prompt`**: 분석의 `ai_prompt.prompt`에서 변환. 제품명 → `[product]` 치환
- **`data-ai-style`**: `product_hero`, `product_lifestyle`, `product_detail`, `product_flat`, `infographic`, `mood`, `comparison`, `background_only`
- **`data-ai-ratio`**: `4:3`, `16:9`, `1:1`, `3:4`
- 배경색: 다크 배경 → `#2A2A2A`, 밝은 배경 → `#E8E8E8`

#### 2-4. sample_data 생성 (Demo 모드용)

각 위젯의 WIDGET_META에 `sample_data`를 포함하여 갤러리 Demo 모드에서 실제 제품처럼 보이게 합니다.

##### 규칙

1. **`texts`**: HTML 본문의 모든 `[placeholder]`를 키로, 레퍼런스 제품에 맞는 샘플 텍스트를 값으로 매핑
   - 레퍼런스 이미지에서 읽히는 실제 텍스트가 있으면 그것을 사용
   - 읽히지 않으면 제품 카테고리에 맞는 그럴듯한 텍스트를 생성
   - **placeholder 고유성 필수**: 동일 텍스트가 여러 곳에 반복되면 고유하게 넘버링
     - BAD: `[설명]` × 3 (모두 같은 텍스트로 치환됨)
     - GOOD: `[혜택 1 설명]`, `[혜택 2 설명]`, `[혜택 3 설명]`

2. **`images`**: `img-placeholder` 안의 `<span class="img-label">` 텍스트를 `label`로, Unsplash URL을 `src`로 매핑
   - URL 형식: `https://images.unsplash.com/photo-{id}?w=760&fit=crop&q=80`
   - 제품 카테고리에 맞는 이미지 선택 (식품→음식 사진, 가구→인테리어 등)
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

배경색의 밝기로 판별:
- RGB 밝기 `(R*299 + G*587 + B*114) / 1000`
- 128 초과: `light`, 이하: `dark`

### 4. 카테고리 매핑

| taxonomy_id | category |
|---|---|
| Hook, WhatIsThis, BrandName, SetContents | intro |
| WhyCore, PainPoint, Solution | problem |
| FeaturesOverview, FeatureDetail, Tips, Differentiator, StatsHighlight | features |
| Comparison, Safety, Target, Reviews, ProductSpec, FAQ, Warranty | trust |
| CTABanner, EventPromo, CTA | conversion |

### 5. 통합 프리뷰 HTML 생성

모든 위젯을 하나의 HTML 파일로 조합하여 참고용 프리뷰를 생성합니다.

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
  <div class="preview-header">프리뷰 헤더 (레퍼런스명, 위젯 수, 스타일 요약)</div>
  <div class="page-canvas">
    <!-- 위젯마다 반복 -->
    <div class="widget-label">#1 Hook — hook--ref-{name} [stack] [light]</div>
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

## Validation
- [ ] 모든 위젯이 `<!--WIDGET_META`로 시작하는가?
- [ ] WIDGET_META 내 JSON이 유효한가?
- [ ] 메타데이터에 `widget_id`, `taxonomy_id`, `category`, `composition`, `theme` 있는가?
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
