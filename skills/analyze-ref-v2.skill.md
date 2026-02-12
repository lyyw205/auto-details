# /analyze-ref-v2 — 좌표 기반 레퍼런스 이미지 분석

## Purpose
레퍼런스 상세페이지 이미지를 **좌표 기반**으로 분석하여, 텍스트 상자/이미지/아이콘/장식 요소의 위치·크기·스타일을 구체적으로 추출합니다.
섹션 분류 체계(taxonomy)에 매핑하고, v1과 호환되는 `v1_compat` 블록을 포함합니다.

## 핵심 원칙: 레퍼런스 충실도 (Reference Fidelity)

> **이 스킬의 목적은 레퍼런스를 "분석"하는 것이지, "완성"하거나 "보완"하는 것이 아닙니다.**

### 절대 금지 사항
1. **섹션 날조 금지**: 레퍼런스 이미지에 시각적으로 존재하지 않는 섹션을 추가하지 않습니다.
   - BAD: 레퍼런스에 CTA 버튼이 없는데 "상세페이지니까 CTA가 있어야지" → CTA 섹션 추가
   - BAD: 레퍼런스에 제품 스펙 테이블이 없는데 ProductSpec 섹션 추가
   - GOOD: 이미지에 보이는 섹션만 정확하게 기술

2. **내용 재해석 금지**: content_hint는 이미지에서 읽히는 **원문 텍스트**를 기록합니다.
   - BAD: 이미지에 "바삭하고 진한 견과 풍미" → content_hint: "프리미엄 캐슈넛의 깊은 맛"
   - GOOD: content_hint: "바삭하고 진한 견과 풍미" (원문 그대로)

3. **용어 변경 금지**: 레퍼런스가 사용하는 고유한 라벨/넘버링을 그대로 보존합니다.
   - BAD: 레퍼런스에 "Point.1" → "Part.1"로 변경
   - GOOD: "Point.1" 그대로 사용

4. **반복 섹션 누락 금지**: 시각적으로 구분되는 반복 섹션은 빠짐없이 모두 캡처합니다.
   - BAD: Point.1~4가 있는데 3개만 캡처
   - GOOD: 4개 모두 캡처, feature_index 1~4 부여

### 판단 기준
- "이 섹션을 이미지에서 손가락으로 가리킬 수 있는가?" → 가리킬 수 없으면 존재하지 않는 섹션
- "이 텍스트가 이미지에서 읽히는가?" → 읽히지 않으면 content_hint에 넣지 않음 (role 설명만 사용)

## Context
- `skills/section-taxonomy.json`에서 **slim 필드만** 로딩:
  `id, name, category, purpose, is_required, frequency, keywords, visual_cues, typical_compositions`
  (required_elements, copywriting_guide 등은 로딩하지 않음)
- 미분류 리포트 저장: `skills/unmapped-sections/`

## Input
- 레퍼런스 이미지 (1장 또는 여러 장의 상세페이지 스크린샷)
- 레퍼런스 이름 (영문 소문자 + 하이픈, 예: `apple-airpods`)

## Output
- 분석 결과: `output/analysis-v2-{name}.json`
- 미분류 리포트: `skills/unmapped-sections/unmapped-{name}.json` (있을 경우)
- 유저에게 요약: 섹션 수, 매핑률, 요소/장식 캡처 수, 미분류 섹션 목록

---

## Processing

### 1단계: 글로벌 분석

v1과 동일. 전체 페이지의 시각적 특성을 파악합니다.

```json
{
  "version": "2.0",
  "reference_name": "ref-{name}",
  "analysis_date": "YYYY-MM-DD",
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
    "content_alignment": "CENTER / LEFT / MIXED",
    "style_tags": ["3~5개 스타일 키워드"],
    "theme": "dark | light | mixed"
  }
}
```

### 2단계: 섹션 분할 + bounds 기록

이미지를 위에서 아래로 스크롤하며 시각적으로 구분되는 각 섹션을 식별합니다.

#### 섹션 식별 기준
- 배경색이 변하는 지점
- 명확한 여백으로 분리되는 영역
- 시각적으로 다른 목적을 가진 콘텐츠 블록

#### 섹션 검증 (분석 완료 후)
분석을 마친 뒤 아래 체크리스트로 자가 검증합니다:
- [ ] 모든 sections 항목이 레퍼런스 이미지에서 시각적으로 확인 가능한가?
- [ ] 이미지에는 보이지만 sections에서 누락된 영역이 없는가?
- [ ] content_hint가 이미지의 원문 텍스트와 일치하는가? (읽기 어려우면 "읽기 불가"로 표시)
- [ ] 레퍼런스의 고유 라벨(Point.1, Step.1 등)이 그대로 보존되었는가?

각 섹션에 bounds를 기록합니다:
```json
{
  "order": 1,
  "bounds": { "y": 0, "height": 750 }
}
```
- `y`: 페이지 전체에서의 y 좌표 (px)
- `height`: 섹션 높이 (px)

### 3단계: 섹션별 좌표 추출 (핵심 신규)

각 섹션 내부의 모든 시각 요소를 좌표와 함께 추출합니다.
**좌표는 섹션 내 상대 좌표** (섹션 좌상단 = 0,0) 기준입니다.

#### 좌표 규칙
- 860px 캔버스 기준 절대 px (x축)
- 섹션 상대 y좌표 (섹션 좌상단 = 0,0)
- 위치: 5px 단위 반올림
- 크기: 10px 단위 반올림
- bounds 형식: `{ "x", "y", "w", "h" }` (모두 px 정수)

#### 추출 순서

**A. 콘텐츠 요소 (elements)** — 의미 있는 콘텐츠를 담는 요소

| type | 설명 | 필수 style 속성 |
|------|------|----------------|
| `TEXT_BOX` | 텍스트 블록 | `fontSize`, `fontWeight`, `color`, `textAlign` |
| `IMAGE` | 이미지 영역 | `shape` (rect/circle/rounded), `objectFit` |
| `ICON` | 아이콘 | `size`, `color`, `meaning` (의미 설명) |
| `BUTTON` | 버튼/CTA | `fontSize`, `fontWeight`, `color`, `bgColor`, `borderRadius` |
| `CARD` | 카드 컨테이너 | `bgColor`, `borderRadius`, `padding`, `border` |

각 요소 형식:
```json
{
  "id": "e1",
  "type": "TEXT_BOX",
  "role": "브랜드 라벨",
  "bounds": { "x": 330, "y": 40, "w": 200, "h": 20 },
  "style": {
    "fontSize": 14,
    "fontWeight": 400,
    "color": "#B8956A",
    "textAlign": "center"
  },
  "group": "g1",
  "content_hint": "감지된 텍스트 또는 역할 설명"
}
```

IMAGE 요소에는 반드시 `ai_prompt`를 포함합니다:
```json
{
  "id": "e5",
  "type": "IMAGE",
  "role": "메인 제품 이미지",
  "bounds": { "x": 50, "y": 200, "w": 760, "h": 500 },
  "style": {
    "shape": "rounded",
    "objectFit": "cover",
    "borderRadius": 12
  },
  "ai_prompt": {
    "prompt": "영문 프롬프트 (이미지 내용, 스타일, 품질)",
    "negative": "text, watermark, logo, blurry",
    "style": "product_hero | product_lifestyle | product_detail | product_flat | infographic | mood | comparison | background_only",
    "aspect_ratio": "4:3 | 16:9 | 1:1 | 3:4"
  }
}
```

ICON 요소:
```json
{
  "id": "e10",
  "type": "ICON",
  "role": "체크 아이콘",
  "bounds": { "x": 100, "y": 500, "w": 20, "h": 20 },
  "style": {
    "size": 20,
    "color": "#B8956A",
    "meaning": "checkmark"
  },
  "group": "g3"
}
```

BUTTON 요소:
```json
{
  "id": "e12",
  "type": "BUTTON",
  "role": "CTA 버튼",
  "bounds": { "x": 280, "y": 650, "w": 300, "h": 56 },
  "style": {
    "fontSize": 18,
    "fontWeight": 700,
    "color": "#FFFFFF",
    "bgColor": "#B8956A",
    "borderRadius": 9999
  },
  "content_hint": "지금 구매하기"
}
```

CARD 요소:
```json
{
  "id": "e15",
  "type": "CARD",
  "role": "기능 카드",
  "bounds": { "x": 50, "y": 300, "w": 350, "h": 200 },
  "style": {
    "bgColor": "rgba(255,255,255,0.05)",
    "borderRadius": 16,
    "padding": 24,
    "border": "1px solid rgba(255,255,255,0.08)"
  },
  "children": ["e16", "e17", "e18"]
}
```

**B. 장식 요소 (decorations)** — 의미 없는 시각 장식

| type | 설명 | 필수 style 속성 |
|------|------|----------------|
| `LINE` | 라인/디바이더 | `stroke`, `strokeWidth`, `opacity`, `direction` (horizontal/vertical) |
| `DOT` | 단일 장식 도트 | `fill`, `radius` |
| `DOT_GROUP` | 도트 그룹 | `fill`, `radius`, `count`, `gap`, `direction` |
| `SHAPE` | 배경 쉐이프/카드 배경 | `fill`, `borderRadius`, `opacity` |
| `GRADIENT_OVERLAY` | 그라디언트 오버레이 | `gradient`, `opacity` |
| `BADGE` | 장식 배지/태그 | `bgColor`, `color`, `borderRadius`, `fontSize` |

각 장식 형식:
```json
{
  "id": "d1",
  "type": "LINE",
  "role": "section-divider",
  "bounds": { "x": 200, "y": 350, "w": 460, "h": 1 },
  "style": {
    "stroke": "#B8956A",
    "strokeWidth": 1,
    "opacity": 0.3,
    "direction": "horizontal"
  }
}
```

DOT_GROUP:
```json
{
  "id": "d3",
  "type": "DOT_GROUP",
  "role": "decorative-dots",
  "bounds": { "x": 405, "y": 340, "w": 50, "h": 6 },
  "style": {
    "fill": "#B8956A",
    "radius": 3,
    "count": 3,
    "gap": 12,
    "direction": "horizontal"
  }
}
```

SHAPE:
```json
{
  "id": "d5",
  "type": "SHAPE",
  "role": "background-card",
  "bounds": { "x": 50, "y": 100, "w": 760, "h": 400 },
  "style": {
    "fill": "rgba(255,255,255,0.05)",
    "borderRadius": 16,
    "opacity": 1
  }
}
```

GRADIENT_OVERLAY:
```json
{
  "id": "d6",
  "type": "GRADIENT_OVERLAY",
  "role": "hero-gradient",
  "bounds": { "x": 0, "y": 0, "w": 860, "h": 750 },
  "style": {
    "gradient": "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)",
    "opacity": 1
  }
}
```

BADGE:
```json
{
  "id": "d7",
  "type": "BADGE",
  "role": "category-label",
  "bounds": { "x": 350, "y": 50, "w": 160, "h": 30 },
  "style": {
    "bgColor": "rgba(184,149,106,0.1)",
    "color": "#B8956A",
    "borderRadius": 9999,
    "fontSize": 12
  },
  "content_hint": "국내 최초"
}
```

**C. 그룹 감지 (groups)**

시각적으로 하나의 단위를 이루는 요소를 묶습니다.

표준 group role:
| role | 설명 | 전형적 구조 |
|------|------|------------|
| `header-text-group` | 제목 + 서브 텍스트 묶음 | 수직, 센터 정렬 |
| `feature-card` | 기능 카드 내부 콘텐츠 | 수직, gap 있음 |
| `stat-item` | 수치 + 라벨 쌍 | 수직, 센터 정렬 |
| `grid-row` | 그리드의 한 행 | 수평, 균등 배분 |
| `icon-text-pair` | 아이콘 + 텍스트 쌍 | 수평, 좌정렬 |
| `cta-group` | CTA 버튼 + 부가 텍스트 | 수직, 센터 정렬 |
| `split-left` | 분할 레이아웃 좌측 | 수직 |
| `split-right` | 분할 레이아웃 우측 | 수직 |
| `overlay-content` | 오버레이 텍스트 묶음 | 수직, 하단 정렬 |
| `checklist` | 체크 아이템 리스트 | 수직, 좌정렬 |
| `review-card` | 리뷰 카드 내부 | 수직, 센터 정렬 |

그룹 형식:
```json
{
  "group_id": "g1",
  "role": "header-text-group",
  "bounds": { "x": 50, "y": 40, "w": 760, "h": 120 },
  "alignment": "center",
  "gap": 12,
  "direction": "vertical",
  "children": ["e1", "e2", "e3"]
}
```

**반복 패턴 토큰 절약**:
동일 구조가 반복되면 `pattern`으로 표현합니다.

```json
{
  "group_id": "g5",
  "role": "grid-row",
  "bounds": { "x": 50, "y": 400, "w": 760, "h": 200 },
  "alignment": "center",
  "gap": 16,
  "direction": "horizontal",
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

반복 패턴 사용 시, 개별 요소를 `elements`에 모두 나열하지 않고 `pattern` 블록으로 대체하여 토큰을 절약합니다.
실제 개수와 대표 템플릿만 기록합니다.

**D. Composition 도출**

그룹과 요소의 bounds를 분석하여 composition을 판단합니다:

- **`stack`**: 모든 그룹/요소의 x가 유사하고 y가 순차적 → 수직 배치
- **`split`**: 2개의 주요 그룹이 좌/우로 나뉘어 있음 (x 기준 430px 부근에서 분리)
- **`composed`**: 요소들의 bounds가 겹침 (z-index 개념 필요, 이미지 위에 텍스트 등)

```json
{
  "composition": {
    "type": "split",
    "derived_from": "coordinates",
    "detail": {
      "direction": "horizontal",
      "ratio": [1, 1],
      "left_group": "g2",
      "right_group": "g3"
    }
  }
}
```

composed일 때:
```json
{
  "composition": {
    "type": "composed",
    "derived_from": "coordinates",
    "detail": {
      "background_elements": ["e1"],
      "overlay_elements": ["d6"],
      "foreground_groups": ["g1"]
    }
  }
}
```

### 4단계: Taxonomy 매핑

v1과 동일한 매핑 로직을 적용합니다.

#### 매핑 판단 기준 (우선순위 순)
1. **purpose 일치**: 섹션의 목적이 taxonomy 정의와 부합하는가?
2. **keywords 매칭**: 섹션 내 텍스트에 taxonomy의 keywords가 포함되는가?
3. **visual_cues 매칭**: 시각적 특징이 taxonomy의 visual_cues와 유사한가?

#### ⚠️ 매핑 주의사항
- Taxonomy 매핑은 "이미 존재하는 섹션"에 라벨을 붙이는 행위입니다.
- 매핑되지 않는 섹션이 있어도 괜찮습니다 — `confidence: 0.2` 이하로 미분류 처리.
- **절대로** taxonomy에 맞추기 위해 섹션을 새로 만들지 않습니다.
- `is_required: true`인 taxonomy 섹션이 레퍼런스에 없을 수 있습니다 — 그것은 정상입니다.

#### 매핑 확신도 기준

| 확신도 | 기준 |
|--------|------|
| 0.9~1.0 | purpose + keywords + visual_cues 모두 일치 |
| 0.7~0.8 | purpose 일치 + keywords 또는 visual_cues 부분 일치 |
| 0.5~0.6 | purpose 유사하지만 구조가 다름 |
| 0.3~0.4 | 일부 요소만 유사, 전체적으로는 다른 목적 |
| 0.0~0.2 | 기존 taxonomy에 해당하는 섹션 없음 → **미분류** |

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

### 5단계: 패턴 요약

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
    "element_stats": {
      "total_elements": 85,
      "total_decorations": 23,
      "total_groups": 32,
      "by_type": {
        "TEXT_BOX": 45, "IMAGE": 12, "ICON": 8, "BUTTON": 5, "CARD": 15,
        "LINE": 7, "DOT_GROUP": 3, "SHAPE": 8, "GRADIENT_OVERLAY": 3, "BADGE": 2
      }
    },
    "feature_detail_count": "FeatureDetail 반복 횟수",
    "unique_patterns": ["이 레퍼런스만의 독특한 패턴"]
  }
}
```

### 6단계: 미분류 섹션 리포트

v1과 동일. 미분류 섹션이 있을 경우 `skills/unmapped-sections/unmapped-{name}.json`으로 저장합니다.

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

---

## 전체 섹션 JSON 구조

```json
{
  "version": "2.0",
  "reference_name": "ref-{name}",
  "analysis_date": "YYYY-MM-DD",
  "global_analysis": { /* 1단계 */ },
  "sections": [
    {
      "order": 1,
      "bounds": { "y": 0, "height": 750 },
      "detected_purpose": "이 섹션이 하는 역할",
      "taxonomy_mapping": {
        "section_id": "Hook",
        "confidence": 0.9,
        "mapping_reason": "매핑 근거"
      },
      "background": {
        "type": "solid | gradient | image",
        "value": "#111111 또는 linear-gradient(...)",
        "theme": "dark | light"
      },
      "composition": {
        "type": "stack | split | composed",
        "derived_from": "coordinates",
        "detail": { /* composition별 추가 정보 */ }
      },

      "groups": [
        {
          "group_id": "g1",
          "role": "header-text-group",
          "bounds": { "x": 50, "y": 40, "w": 760, "h": 120 },
          "alignment": "center",
          "gap": 12,
          "direction": "vertical",
          "children": ["e1", "e2", "e3"]
        }
      ],

      "elements": [
        {
          "id": "e1",
          "type": "TEXT_BOX",
          "role": "브랜드 라벨",
          "bounds": { "x": 330, "y": 40, "w": 200, "h": 20 },
          "style": { "fontSize": 14, "fontWeight": 400, "color": "#B8956A", "textAlign": "center" },
          "group": "g1",
          "content_hint": "BRAND"
        }
      ],

      "decorations": [
        {
          "id": "d1",
          "type": "LINE",
          "role": "section-divider",
          "bounds": { "x": 200, "y": 350, "w": 460, "h": 1 },
          "style": { "stroke": "#B8956A", "strokeWidth": 1, "opacity": 0.3, "direction": "horizontal" }
        }
      ],

      "v1_compat": {
        "layout": {
          "estimated_height": 750,
          "background": "#111111",
          "padding": { "top": 80, "bottom": 80, "left": 50, "right": 50 },
          "itemSpacing": 24,
          "layoutMode": "VERTICAL",
          "contentAlignment": "CENTER"
        },
        "composition": {
          "type": "composed",
          "reason": "배경 이미지 위 텍스트 오버레이"
        },
        "elements": [
          {
            "type": "TEXT",
            "role": "브랜드 라벨",
            "estimated_fontSize": 14,
            "estimated_fontWeight": 400,
            "color": "#B8956A"
          },
          {
            "type": "IMAGE_AREA",
            "role": "메인 제품 이미지",
            "estimated_size": "760x500",
            "ai_prompt": {
              "prompt": "영문 프롬프트",
              "negative": "text, watermark",
              "style": "product_hero",
              "aspect_ratio": "4:3"
            }
          }
        ],
        "visual_notes": "특이한 레이아웃, 장식 요소 등 참고 사항"
      }
    }
  ],
  "pattern_summary": { /* 5단계 */ }
}
```

---

## v1_compat 블록 생성 규칙

각 v2 섹션에 `v1_compat` 블록을 자동 생성합니다:

1. **layout**: v2 bounds에서 역산
   - `estimated_height` = section bounds.height
   - `background` = section background.value
   - `padding` = 가장 바깥쪽 요소들의 bounds에서 추정
   - `itemSpacing` = 연속 요소 간 y 간격의 중앙값
   - `layoutMode` = composition.type이 stack이면 `VERTICAL`, split이면 `HORIZONTAL`
   - `contentAlignment` = 요소들의 x 분포에서 추정 (CENTER/LEFT/RIGHT)

2. **composition**: v2 composition을 v1 형식으로 변환
   - `type` 그대로 유지 (stack/split/composed)
   - `reason` 텍스트 생성

3. **elements**: v2 elements를 v1 형식으로 변환
   - `TEXT_BOX` → `{ "type": "TEXT", "role", "estimated_fontSize", "estimated_fontWeight", "color" }`
   - `IMAGE` → `{ "type": "IMAGE_AREA", "role", "estimated_size": "{w}x{h}", "ai_prompt" }`
   - `BUTTON` → `{ "type": "BUTTON", "role", "text" }`
   - `CARD` → `{ "type": "FRAME", "role" }`
   - `ICON` → 포함하지 않음 (v1에 해당 타입 없음)

4. **visual_notes**: decorations 정보를 텍스트로 요약

---

## AI 이미지 프롬프트 (`ai_prompt`)

**모든 IMAGE 요소에 `ai_prompt`를 생성합니다.**

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

---

## Validation
- [ ] 모든 섹션에 `bounds`, `groups`, `elements`, `decorations` 블록이 있는가?
- [ ] 모든 요소에 `bounds` { x, y, w, h }가 있는가?
- [ ] bounds 값이 좌표 규칙을 따르는가? (위치 5px, 크기 10px 단위)
- [ ] x 좌표가 0~860 범위 내인가?
- [ ] 모든 IMAGE에 `ai_prompt`가 있는가?
- [ ] 장식 요소(LINE, DOT_GROUP, SHAPE, GRADIENT_OVERLAY, BADGE)가 캡처되었는가?
- [ ] 그룹의 `children`이 실제 존재하는 element/decoration id와 일치하는가?
- [ ] composition이 좌표 분석에서 도출되었는가? (`derived_from: "coordinates"`)
- [ ] 모든 섹션에 `v1_compat` 블록이 포함되었는가?
- [ ] v1_compat.elements의 형식이 v1 분석 출력과 호환되는가?
- [ ] taxonomy 매핑이 모든 섹션에 시도되었는가?
- [ ] FeatureDetail 반복에 `feature_index`가 있는가?
- [ ] taxonomy의 `typical_compositions`를 참고했는가?
- [ ] 이미지의 모든 섹션을 빠짐없이 분석했는가?
- [ ] `pattern_summary.element_stats`에 요소 수 통계가 있는가?
- [ ] 반복 패턴에 `pattern` 블록을 사용하여 토큰을 절약했는가?
