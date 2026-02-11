# /analyze-ref — 레퍼런스 이미지 분석

## Purpose
레퍼런스 상세페이지 이미지를 분석하여 구조화된 레이아웃 데이터를 추출하고,
섹션 분류 체계(taxonomy)에 기반하여 각 섹션을 표준 ID에 매핑합니다.

## Context
- `skills/section-taxonomy.json`에서 **slim 필드만** 로딩:
  `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions`
  (required_elements, copywriting_guide 등은 로딩하지 않음)
- 미분류 리포트 저장: `skills/unmapped-sections/`

## Input
- 레퍼런스 이미지 (1장 또는 여러 장의 상세페이지 스크린샷)
- 레퍼런스 이름 (영문 소문자 + 하이픈, 예: `apple-airpods`)

## Processing

### 1단계: 글로벌 분석

전체 페이지의 시각적 특성을 파악합니다.

```json
{
  "global_analysis": {
    "estimated_width": "페이지 추정 너비 (px, 일반적으로 860 또는 750)",
    "color_palette": {
      "primary": "#hex - 가장 많이 사용된 강조색",
      "secondary": "#hex - 두 번째 강조색",
      "background_colors": ["#hex - 배경에 사용된 색상들"],
      "text_primary": "#hex - 주요 텍스트 색상",
      "text_secondary": "#hex - 보조 텍스트 색상"
    },
    "typography_scale": {
      "largest_heading": "추정 px",
      "section_heading": "추정 px",
      "sub_heading": "추정 px",
      "body_text": "추정 px",
      "small_text": "추정 px"
    },
    "visual_rhythm": "배경색 교차 패턴 설명",
    "overall_style": "전반적인 스타일 (예: 미니멀, 다크모드, 컬러풀, 내추럴 등)",
    "content_alignment": "CENTER / LEFT / MIXED"
  }
}
```

### 2단계: 섹션별 분석 + Taxonomy 매핑

이미지를 위에서 아래로 스크롤하며, 시각적으로 구분되는 각 섹션을 식별합니다.
**각 섹션을 taxonomy의 표준 섹션 ID에 매핑합니다.**

#### 매핑 판단 기준 (우선순위 순)
1. **purpose 일치**: 섹션의 목적이 taxonomy 정의와 부합하는가?
2. **keywords 매칭**: 섹션 내 텍스트에 taxonomy의 keywords가 포함되는가?
3. **visual_cues 매칭**: 시각적 특징이 taxonomy의 visual_cues와 유사한가?

#### 매핑 확신도 기준

| 확신도 | 기준 |
|--------|------|
| 0.9~1.0 | purpose + keywords + visual_cues 모두 일치 |
| 0.7~0.8 | purpose 일치 + keywords 또는 visual_cues 부분 일치 |
| 0.5~0.6 | purpose 유사하지만 구조가 다름 |
| 0.3~0.4 | 일부 요소만 유사, 전체적으로는 다른 목적 |
| 0.0~0.2 | 기존 taxonomy에 해당하는 섹션 없음 → **미분류** |

#### 각 섹션 분석 형식

```json
{
  "sections": [
    {
      "order": 1,
      "detected_purpose": "이 섹션이 하는 역할",
      "taxonomy_mapping": {
        "section_id": "Hook",
        "confidence": 0.9,
        "mapping_reason": "매핑 근거 (어떤 keywords, visual_cues가 매칭되었는지)"
      },
      "layout": {
        "estimated_height": "추정 높이 (px)",
        "background": "#hex 또는 gradient 설명",
        "padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
        "itemSpacing": "요소 간 추정 간격 (px)",
        "layoutMode": "VERTICAL 또는 HORIZONTAL",
        "contentAlignment": "CENTER / LEFT / RIGHT"
      },
      "composition": {
        "type": "stack | composed | split",
        "reason": "composition 타입 선택 근거"
      },
      "elements": [
        {
          "type": "TEXT / IMAGE_AREA / FRAME / BUTTON",
          "role": "이 요소의 역할 설명",
          "estimated_fontSize": "추정 px (텍스트인 경우)",
          "estimated_fontWeight": "추정 굵기 (텍스트인 경우)",
          "color": "#hex (감지된 경우)",
          "estimated_size": "추정 너비 x 높이 (이미지/프레임인 경우)"
        }
      ],
      "visual_notes": "특이한 레이아웃, 장식 요소, 아이콘 사용 등 참고 사항"
    }
  ]
}
```

#### Composition 타입 판단 기준

**`stack`** (기본 — 수직/수평 순차 배치)
- 모든 요소가 위→아래 또는 좌→우로 순서대로 나열
- 요소 간 겹침 없음

**`composed`** (9분할 자유 배치 — 요소 겹침 가능)
- 텍스트가 이미지 위에 오버레이
- 배경 이미지 위에 요소들이 자유롭게 배치

composed 선택 시 추가 분석:
```json
{
  "composition": { "type": "composed", "reason": "배경 이미지 위 텍스트 오버레이" },
  "layers": [
    {
      "zIndex": 0,
      "region": "TL:BR",
      "element": {
        "type": "IMAGE_AREA",
        "name": "Background_Image",
        "label": "어두운 톤의 배경",
        "ai_prompt": {
          "prompt": "Dark moody background, soft gradient, 8k quality",
          "negative": "text, watermark, logo, blurry",
          "style": "mood",
          "aspect_ratio": "16:9"
        }
      }
    },
    {
      "zIndex": 1,
      "region": "BL:BC",
      "element": { "type": "TEXT", "name": "Main_Copy", "role": "헤드라인" }
    }
  ]
}
```

9분할 그리드 코드:
```
┌─────┬─────┬─────┐
│ TL  │ TC  │ TR  │
├─────┼─────┼─────┤
│ ML  │ MC  │ MR  │
├─────┼─────┼─────┤
│ BL  │ BC  │ BR  │
└─────┴─────┴─────┘
```
스팬 표기: `"TL:BR"` = 좌상단~우하단 (전체), `"TL:TR"` = 상단 전체

**`split`** (2분할 레이아웃)
- 좌우 또는 상하로 명확히 2영역 분할

split 선택 시 추가 분석:
```json
{
  "composition": { "type": "split", "reason": "좌측 텍스트, 우측 이미지 1:1 분할" },
  "split_detail": {
    "direction": "horizontal",
    "ratio": [1, 1],
    "left_content": "텍스트 (제목 + 설명)",
    "right_content": "제품 이미지"
  }
}
```

taxonomy의 `typical_compositions` 힌트를 참고하여 판단합니다.

#### AI 이미지 프롬프트 (`ai_prompt`)

**모든 IMAGE_AREA에 `ai_prompt`를 생성합니다.**

```json
{
  "ai_prompt": {
    "prompt": "영문 프롬프트 (이미지 내용, 스타일, 품질 포함)",
    "negative": "제외할 요소 (text, watermark 등)",
    "style": "스타일 프리셋 코드",
    "aspect_ratio": "가로:세로 비율"
  }
}
```

스타일 프리셋:
| style | 용도 | 선택 기준 |
|-------|------|----------|
| `product_hero` | 메인컷 | 배경 없음/화이트, 스튜디오 조명 |
| `product_lifestyle` | 사용 환경 | 실제 사용 장면, 자연광 |
| `product_detail` | 클로즈업 | 마크로, 디테일 강조 |
| `product_flat` | 구성품 나열 | 탑뷰/플랫레이 |
| `infographic` | 인포그래픽 | 클린 디자인, 아이콘 |
| `mood` | 감성/분위기 | 다크/감성 톤 |
| `comparison` | 비교/대조 | 전후 비교 |
| `background_only` | 배경 전용 | 텍스트 오버레이용 |

#### 미분류 섹션 처리 (confidence < 0.3)

```json
{
  "taxonomy_mapping": {
    "section_id": null,
    "confidence": 0.1,
    "mapping_reason": "기존 taxonomy에 해당하는 섹션 없음",
    "unmapped": true,
    "suggested_id": "PascalCase 영문 ID",
    "suggested_category": "intro | problem | features | trust | conversion",
    "suggested_name": "제안하는 한글명"
  }
}
```

#### FeatureDetail 반복 처리

유사 구조가 반복되면 각각 `FeatureDetail`로 매핑 + `feature_index` 부여:
```json
{
  "taxonomy_mapping": {
    "section_id": "FeatureDetail",
    "confidence": 0.9,
    "feature_index": 3,
    "mapping_reason": "Q&A 형식의 기능 상세, 3번째 반복"
  }
}
```

#### 섹션 식별 기준
- 배경색이 변하는 지점
- 명확한 여백으로 분리되는 영역
- 시각적으로 다른 목적을 가진 콘텐츠 블록

### 3단계: 패턴 요약

```json
{
  "pattern_summary": {
    "total_sections": "총 섹션 수",
    "section_flow": ["Hook", "WhatIsThis", "FeatureDetail", "..."],
    "background_pattern": "배경색 교차 패턴",
    "category_distribution": {
      "intro": 3, "problem": 2, "features": 6, "trust": 4, "conversion": 1
    },
    "mapping_stats": {
      "total": 16, "mapped": 14, "unmapped": 2, "coverage": "87%"
    },
    "feature_detail_count": "FeatureDetail 반복 횟수",
    "unique_patterns": ["이 레퍼런스만의 독특한 패턴"]
  }
}
```

### 4단계: 미분류 섹션 리포트

미분류 섹션이 있을 경우 `skills/unmapped-sections/unmapped-{name}.json`으로 저장:

```json
{
  "reference": "레퍼런스명",
  "report_date": "YYYY-MM-DD",
  "total_sections": 16,
  "unmapped_count": 2,
  "unmapped_sections": [
    {
      "position": 5,
      "description": "역할 설명",
      "visual_type": "시각적 특징",
      "content_summary": "콘텐츠 요약",
      "suggested_id": "IngredientsDetail",
      "suggested_category": "features",
      "suggested_name": "성분 상세",
      "suggested_keywords": ["성분", "원료", "함량"],
      "suggested_visual_cues": ["테이블", "수치"],
      "confidence": 0.2
    }
  ]
}
```

미분류 섹션이 없으면 이 단계를 건너뜁니다.

## Output
- 분석 결과: `output/analysis-{name}.json`
- 미분류 리포트: `skills/unmapped-sections/unmapped-{name}.json` (있을 경우)
- 유저에게 요약: 섹션 수, 매핑률, 미분류 섹션 목록

## Validation
- [ ] 모든 섹션에 taxonomy 매핑을 시도했는가?
- [ ] 비율 중심 분석인가? (px 정확도보다 시각적 리듬 우선)
- [ ] 이미지의 모든 섹션을 빠짐없이 분석했는가?
- [ ] 모든 IMAGE_AREA에 ai_prompt가 있는가?
- [ ] composed 섹션에 layers + region 코드가 있는가?
- [ ] FeatureDetail 반복에 feature_index가 있는가?
- [ ] taxonomy의 typical_compositions를 참고했는가?
