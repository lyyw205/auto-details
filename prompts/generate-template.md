# 분석 결과 → 템플릿 JSON 변환 프롬프트

## 목적

`analyze-reference.md` 프롬프트로 생성된 레퍼런스 분석 결과를 v3.0 템플릿 JSON 파일로 변환합니다.

---

## 입력

레퍼런스 분석 결과 JSON (3단계 분석: global_analysis, sections, pattern_summary)

## 출력

v3.0 형식의 `.template.json` 파일

---

## 변환 규칙

### 1. 메타데이터 생성

```json
{
  "type": "DETAIL_PAGE_TEMPLATE",
  "version": "3.0",
  "name": "[레퍼런스 이름] 기반 템플릿",
  "description": "레퍼런스 이미지 분석 기반 자동 생성 템플릿",
  "created": "생성 날짜",
  "source": {
    "type": "reference_analysis",
    "based_on": "레퍼런스 이미지 파일명 또는 출처",
    "analysis_date": "분석 날짜"
  }
}
```

### 2. global_layout 매핑

분석의 `global_analysis`에서 추출:

```json
{
  "global_layout": {
    "width": "estimated_width 값",
    "image_area_width": "width - (default_padding.left + default_padding.right)",
    "default_padding": "가장 빈번한 padding 값으로 설정",
    "default_item_spacing": "가장 빈번한 itemSpacing 값으로 설정",
    "default_content_alignment": "content_alignment 값",
    "font_family": "감지된 폰트 또는 기본값 Inter"
  }
}
```

### 3. color_system 매핑

분석의 `color_palette`에서 추출:

```json
{
  "color_system": {
    "brand_main": "primary 색상",
    "accent": "secondary 색상",
    "dark_1": "가장 어두운 배경색",
    "dark_2": "두 번째로 어두운 배경색",
    "light_text": "#FFFFFF",
    "sub_text": "text_secondary",
    "image_placeholder": "#2A2A2A"
  }
}
```

- **모든 색상은 반드시 hex 값**으로 표기 (시맨틱 이름 아님)
- 밝은 테마 레퍼런스의 경우 dark_1, dark_2 대신 light_1, light_2 사용 가능

### 4. typography 매핑

분석의 `typography_scale`에서 추출:

```json
{
  "typography": {
    "main_copy": { "fontSize": "largest_heading", "fontWeight": 700 },
    "section_title": { "fontSize": "section_heading", "fontWeight": 700 },
    "sub_title": { "fontSize": "sub_heading", "fontWeight": 500 },
    "body": { "fontSize": "body_text", "fontWeight": 400 },
    "small": { "fontSize": "small_text", "fontWeight": 400 }
  }
}
```

- 감지된 스케일 비율을 유지하되, 최소 크기는 14px 이상
- fontWeight는 시각적 굵기에 따라 400/500/600/700 중 선택

### 5. 섹션 변환

각 분석된 섹션을 v3.0 섹션 형식으로 변환:

#### 5-1. ID 매핑 규칙

기존 24섹션 ID와 매핑 시도:

| 감지된 목적 | 매핑 대상 ID |
|------------|-------------|
| 메인 후킹, 히어로 | Section_XX_Hook |
| 제품 소개, 정의 | Section_XX_WhatIsThis |
| 브랜드 스토리 | Section_XX_BrandName |
| 구성품 | Section_XX_SetContents |
| 핵심 기술/기능 중요성 | Section_XX_WhyCore |
| 문제 제기, 불편 공감 | Section_XX_PainPoint |
| 해결책 | Section_XX_Solution |
| 기능 개요/나열 | Section_XX_FeaturesOverview |
| 개별 기능 상세 | Section_XX_FeatureN_Detail |
| 사용 팁 | Section_XX_Tips |
| 차별화 | Section_XX_Differentiator |
| 비교표 | Section_XX_Comparison |
| 안전/인증 | Section_XX_Safety |
| 추천 대상 | Section_XX_Target |
| 고객 후기 | Section_XX_Reviews |
| 제품 스펙 | Section_XX_ProductSpec |
| FAQ | Section_XX_FAQ |
| 보증/정책 | Section_XX_Warranty |
| 구매 유도 (CTA) | Section_XX_CTA |

- `XX`는 실제 순서 번호 (01, 02, ...)
- 매핑 불가능한 섹션은 `"custom": true` 추가하고 설명적 ID 부여
  - 예: `Section_05_Custom_BrandHistory`

#### 5-2. 레이아웃 속성 변환

```json
{
  "layout": {
    "height": "estimated_height 값 (50px 단위로 반올림)",
    "background": "#hex 값 (시맨틱 이름 아닌 실제 hex)",
    "padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
    "itemSpacing": "추정값 (4px 단위로 반올림)",
    "layoutMode": "VERTICAL 또는 HORIZONTAL",
    "primaryAxisAlign": "CENTER / MIN / MAX",
    "counterAxisAlign": "CENTER / MIN / MAX"
  }
}
```

- background에 시맨틱 이름(`brand_main`, `accent`) 사용 가능 - color_system에 정의된 경우
- 높이는 50px 단위로 반올림 (예: 1037 → 1050)
- 간격은 4px 단위로 반올림 (예: 22 → 24)

#### 5-3. required_elements 변환

분석된 elements를 template의 required_elements로 변환:

```json
{
  "required_elements": [
    {
      "type": "TEXT",
      "name": "설명적_이름",
      "role": "이 요소의 역할 설명",
      "fontSize": "추정값",
      "fontWeight": "추정값",
      "color": "#hex 또는 시맨틱 이름"
    }
  ]
}
```

### 6. Composition 정보 보존

분석 결과의 `composition` 정보를 템플릿에 그대로 보존합니다.

#### 6-1. `stack` composition (기본값)

composition이 `stack`이거나 명시되지 않은 경우, 기존 방식대로 변환합니다.
`composition` 필드는 생략 가능 (하위 호환).

```json
{
  "composition": "stack",
  "layout": { "..." },
  "required_elements": [ "..." ]
}
```

#### 6-2. `composed` composition (9분할 자유 배치)

분석의 `layers` 배열을 그대로 보존합니다:

```json
{
  "composition": "composed",
  "layout": {
    "height": 600,
    "background": "#1A1A2E"
  },
  "layers": [
    {
      "zIndex": 0,
      "region": "TL:BR",
      "element": {
        "type": "IMAGE_AREA",
        "name": "Background_Image",
        "role": "배경 이미지",
        "ai_prompt": {
          "prompt": "...",
          "style": "background_only",
          "aspect_ratio": "16:9"
        }
      }
    },
    {
      "zIndex": 1,
      "region": "BL:BC",
      "element": {
        "type": "TEXT",
        "name": "Main_Copy",
        "role": "메인 카피",
        "fontSize": 42,
        "fontWeight": 700
      }
    }
  ]
}
```

- region 코드는 분석 결과 그대로 유지
- zIndex 순서 보존
- layers 내 element의 속성도 `required_elements` 변환 규칙과 동일하게 적용

#### 6-3. `split` composition (2분할 레이아웃)

분석의 `split_detail`을 구조화합니다:

```json
{
  "composition": "split",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": {
    "valign": "MC",
    "required_elements": [
      { "type": "TEXT", "name": "Title", "role": "제목", "fontSize": 32, "fontWeight": 700 },
      { "type": "TEXT", "name": "Desc", "role": "설명", "fontSize": 16 }
    ]
  },
  "right": {
    "valign": "MC",
    "required_elements": [
      { "type": "IMAGE_AREA", "name": "Feature_Image", "role": "기능 이미지", "height": 300 }
    ]
  }
}
```

- `direction`: "horizontal" 또는 "vertical"
- `ratio`: 분할 비율 (분석 결과에서 추정)
- 각 패널의 `valign`: 9분할 코드 중 세로 위치 (MC = 중앙, TC = 상단, BC = 하단)

#### 6-4. ai_prompt 보존 규칙

- 분석에서 생성된 `ai_prompt` 객체를 **템플릿에 그대로 보존**
- `prompt` 내 구체적 제품명은 `[product]` 플레이스홀더로 치환
  - 예: `"Logitech K120 keyboard"` → `"[product]"`
- `style`, `negative`, `aspect_ratio`는 그대로 유지

```json
{
  "type": "IMAGE_AREA",
  "name": "Main_Product_Image",
  "role": "메인 제품 이미지",
  "ai_prompt": {
    "prompt": "Professional product photography of [product], front view, centered, white seamless background, studio lighting, 8k",
    "negative": "text, watermark, logo, blurry, low quality",
    "style": "product_hero",
    "aspect_ratio": "4:3"
  },
  "height": 500,
  "placeholderColor": "#E8E8E8"
}
```

### 7. 기능 상세 섹션 처리

레퍼런스에서 기능 상세 설명이 반복 패턴으로 나타나는 경우:

- 각각을 `Section_XX_FeatureN_Detail`로 분리
- `feature_detail_template`에 공통 구조 정의
- 기능 수는 레퍼런스에 따라 유동적 (3개~8개 가능)

---

## 출력 형식

### 파일명 규칙

- `ref-[레퍼런스명].template.json`
- 예: `ref-apple-airpods.template.json`
- 예: `ref-dyson-v15.template.json`

### 레지스트리 등록

생성된 템플릿을 `templates/_registry.json`에 추가:

```json
{
  "id": "ref-[레퍼런스명]",
  "file": "ref-[레퍼런스명].template.json",
  "name": "[레퍼런스명] 기반 템플릿",
  "description": "레퍼런스 이미지 분석 기반 자동 생성",
  "section_count": "감지된 섹션 수",
  "category": "레퍼런스",
  "source": "reference_analysis",
  "created": "생성 날짜"
}
```

---

## 검증 체크리스트

생성된 템플릿이 다음 조건을 충족하는지 확인:

- [ ] `version`이 "3.0"인가?
- [ ] `source.type`이 "reference_analysis"인가?
- [ ] 모든 색상이 hex 값으로 표기되었는가?
- [ ] 모든 섹션에 `layout` 속성이 있는가?
- [ ] 매핑 불가 섹션에 `"custom": true`가 있는가?
- [ ] `global_layout`이 정의되었는가?
- [ ] 섹션 order가 연속적인가?
- [ ] 폰트 크기가 14px 이상인가?
- [ ] 높이가 50px 단위로 반올림되었는가?
- [ ] `composed` 섹션에 `layers` 배열과 `region` 코드가 있는가?
- [ ] `split` 섹션에 `direction`, `ratio`, 양쪽 패널 데이터가 있는가?
- [ ] 모든 IMAGE_AREA에 `ai_prompt` 객체가 있는가?
- [ ] `ai_prompt.prompt` 내 제품명이 `[product]` 플레이스홀더로 치환되었는가?
