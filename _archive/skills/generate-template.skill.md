# /generate-template — 분석 결과 → 템플릿 JSON 변환

## Purpose
`/analyze-ref` 출력(analysis JSON)을 v3.0 템플릿 JSON 파일로 변환합니다.

## Context
- `output/analysis-{name}.json` (analyze-ref 출력)
- `skills/section-taxonomy.json`에서 **매칭된 섹션의 required_elements만** selective 로딩
  (플랜에 포함된 section_id의 required_elements 필드만 참조)

## Input
- analysis JSON (global_analysis + sections + pattern_summary)
- 레퍼런스 이름 (영문 소문자 + 하이픈)

## Processing

### 1. 메타데이터 생성

```json
{
  "type": "DETAIL_PAGE_TEMPLATE",
  "version": "3.0",
  "name": "[레퍼런스명] 기반 템플릿",
  "description": "레퍼런스 이미지 분석 기반 자동 생성 템플릿",
  "created": "YYYY-MM-DD",
  "source": {
    "type": "reference_analysis",
    "based_on": "레퍼런스 파일명/출처",
    "analysis_date": "YYYY-MM-DD"
  }
}
```

### 2. global_layout 매핑

분석의 `global_analysis`에서 추출:

```json
{
  "global_layout": {
    "width": "estimated_width 값",
    "image_area_width": "width - (left padding + right padding)",
    "default_padding": "가장 빈번한 padding 값",
    "default_item_spacing": "가장 빈번한 itemSpacing 값",
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

- **모든 색상은 반드시 hex 값**으로 표기
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

- 최소 크기 14px 이상
- fontWeight는 시각적 굵기에 따라 400/500/600/700 중 선택

### 5. 섹션 변환

#### 5-1. ID 매핑 규칙

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

- `XX`는 순서 번호 (01, 02, ...)
- 매핑 불가 섹션: `Section_XX_Custom_[설명적ID]` + `"custom": true`

#### 5-2. 레이아웃 속성 변환

```json
{
  "layout": {
    "height": "estimated_height (50px 단위 반올림)",
    "background": "#hex (시맨틱 이름 허용 - color_system 키)",
    "padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
    "itemSpacing": "추정값 (4px 단위 반올림)",
    "layoutMode": "VERTICAL 또는 HORIZONTAL",
    "primaryAxisAlign": "CENTER / MIN / MAX",
    "counterAxisAlign": "CENTER / MIN / MAX"
  }
}
```

#### 5-3. required_elements 변환

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

#### `stack` (기본값)
composition이 `stack`이거나 명시되지 않은 경우:
```json
{ "composition": "stack", "layout": {}, "required_elements": [] }
```

#### `composed` (9분할 자유 배치)
분석의 `layers` 배열을 그대로 보존:
```json
{
  "composition": "composed",
  "layout": { "height": 600, "background": "#1A1A2E" },
  "layers": [
    {
      "zIndex": 0,
      "region": "TL:BR",
      "element": {
        "type": "IMAGE_AREA", "name": "Background_Image", "role": "배경 이미지",
        "ai_prompt": { "prompt": "...", "style": "background_only", "aspect_ratio": "16:9" }
      }
    },
    {
      "zIndex": 1,
      "region": "BL:BC",
      "element": { "type": "TEXT", "name": "Main_Copy", "role": "메인 카피", "fontSize": 42, "fontWeight": 700 }
    }
  ]
}
```

#### `split` (2분할 레이아웃)
```json
{
  "composition": "split",
  "direction": "horizontal",
  "ratio": [1, 1],
  "left": { "valign": "MC", "required_elements": [] },
  "right": { "valign": "MC", "required_elements": [] }
}
```
- `valign`: 9분할 코드 중 세로 위치 (MC = 중앙, TC = 상단, BC = 하단)

### 7. ai_prompt 보존 규칙

- 분석에서 생성된 `ai_prompt` 객체를 **템플릿에 그대로 보존**
- `prompt` 내 구체적 제품명은 `[product]` 플레이스홀더로 치환
- `style`, `negative`, `aspect_ratio`는 그대로 유지

### 8. 기능 상세 섹션 처리

레퍼런스에서 기능 상세가 반복 패턴으로 나타나는 경우:
- 각각을 `Section_XX_FeatureN_Detail`로 분리
- `feature_detail_template`에 공통 구조 정의
- 기능 수는 레퍼런스에 따라 유동적 (3개~8개)

## Output
- 템플릿 파일: `templates/ref-{name}.template.json`
- 유저에게 템플릿 요약 표시 (섹션 구조, 컬러, 타이포)

## Validation
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
