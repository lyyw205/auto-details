# /select-widgets — 섹션별 최적 위젯 선택

## Purpose
섹션 플랜(`plan-sections` 결과)과 스타일 선호를 기반으로,
각 섹션에 가장 적합한 위젯을 레지스트리에서 선택합니다.
기존 `/match-template`(페이지 단위 템플릿 매칭)을 대체합니다.

## Context
- 섹션 플랜: `output/{product}-section-plan.json`
- 위젯 레지스트리: `widgets/_registry.json`
- 위젯 파일: `widgets/{taxonomy_id_lower}/*.widget.html`
- 스타일 프리셋: `widgets/_presets/preset--*.json`
- Taxonomy: `skills/section-taxonomy.json` (fallback용 `required_elements`)

## Input
1. **섹션 플랜**: `output/{product}-section-plan.json` (plan-sections 결과)
2. **스타일 선호** (아래 중 택 1):
   - 프리셋 ID: `"preset--ref-reference3"` (특정 레퍼런스 스타일 따름)
   - style_tags: `["미니멀", "클린", "밝은"]` (키워드 기반 매칭)
   - `"auto"` — 섹션 플랜 분석 후 자동 추천
3. **(선택) 브랜드 컬러 오버라이드**: `{ "brand_main": "#2E7DF7", "accent": "#60A5FA" }`

## Processing

### 1단계: 레지스트리 로딩

`widgets/_registry.json`에서 `widgets` 객체 로드.
각 taxonomy_id별 사용 가능한 위젯 후보 확인.

### 2단계: 섹션별 위젯 선택

섹션 플랜의 각 항목에 대해:

#### 2-1. 후보 조회

레지스트리에서 `section_id` (taxonomy_id)에 해당하는 위젯 배열 조회.
예: `section_id: "Hook"` → `registry.widgets.Hook` 배열

#### 2-2. 스코어링

후보별 점수 산출 (0.0 ~ 1.0 정규화 후 가중합):

| 기준 | 가중치 | 산출 방법 |
|---|---|---|
| **스타일 호환성** | 1.0 | 위젯 `style_tags`와 선호 style_tags의 교집합 비율 |
| **소스 일관성** | 0.5 | 이미 선택된 다른 섹션과 같은 `source_ref`면 1.0, 아니면 0.0 |
| **테마 매칭** | 0.3 | 선호 theme (dark/light)과 일치하면 1.0 |

점수 = `(스타일 × 1.0) + (소스 일관성 × 0.5) + (테마 × 0.3)`

#### 2-3. 폴백 — 위젯 없는 경우

레지스트리에 해당 taxonomy_id의 위젯이 없을 경우:
1. `section-taxonomy.json`에서 해당 섹션의 `required_elements` 로드
2. 기본 HTML 위젯 자동 생성
4. 생성된 폴백 위젯은 `<!--WIDGET_META ... -->` + `<section>` HTML 포맷

### 3단계: 결과 조합

```json
{
  "type": "WIDGET_SELECTION",
  "version": "1.0",
  "product_name": "제품명",
  "style_preset": "preset--ref-reference3",
  "brand_override": { "brand_main": "#2E7DF7", "accent": "#60A5FA" },
  "selected_widgets": [
    {
      "order": 1,
      "section_id": "Hook",
      "widget_id": "hook--ref-reference3",
      "widget_file": "hook/hook--ref-reference3.widget.html",
      "score": 0.92,
      "score_breakdown": {
        "style_compat": 0.95,
        "source_cohesion": 0.5,
        "theme_match": 1.0
      },
      "alternatives": [
        { "widget_id": "hook--ref-maru", "score": 0.68 },
        { "widget_id": "hook--default", "score": 0.45 }
      ]
    },
    {
      "order": 2,
      "section_id": "WhatIsThis",
      "widget_id": "whatisthis--ref-reference3",
      "widget_file": "whatisthis/whatisthis--ref-reference3.widget.html",
      "score": 0.88,
      "alternatives": []
    }
  ],
  "fallback_sections": ["Tips"],
  "summary": {
    "total_sections": 14,
    "matched_from_registry": 13,
    "generated_from_taxonomy": 1,
    "source_distribution": {
      "ref-reference3": 8,
      "ref-logitech-k120": 3,
      "default": 2,
      "taxonomy-fallback": 1
    }
  }
}
```

### 4단계: 유저 확인 (BLOCKING)

선택 결과를 유저에게 표로 표시:

```
| # | 섹션 | 선택된 위젯 | 소스 | 점수 | 대안 |
|---|------|------------|------|------|------|
| 1 | Hook | hook--ref-reference3 | reference3 | 0.92 | ref-maru (0.68) |
| 2 | WhatIsThis | whatisthis--ref-reference3 | reference3 | 0.88 | — |
```

유저가 교체를 원하면 대안 위젯으로 swap 가능.

## Output
- 파일: `output/{product}-widget-selection.json`
- 유저에게 선택 요약 표시

## 주의사항
- 프리셋을 지정하면 해당 프리셋의 style_tags가 선호 기준이 됨
- 브랜드 컬러 오버라이드는 선택에 영향 안 줌 (생성 시 적용)
- 소스 일관성 보너스는 이미 선택된 위젯 기준으로 동적 계산
- 인접 섹션의 theme이 겹치지 않도록 사후 검증 필요

### 인접 섹션 theme 중복 방지
- 연속 3개 이상의 섹션이 동일 theme(dark/light)가 되지 않도록 검증
- 위반 시: 중간 섹션의 위젯을 대안(다른 theme)으로 교체
- 교체 불가 시: 경고 출력 (강제 변경 안 함)

### 소스 일관성 보너스 (개선)
기존: 순차적으로 직전 섹션의 source_ref와 비교
개선: 전체 후보 사전 스캔 → 가장 많이 사용된 source_ref에 보너스
- 전체 선택된 위젯 중 동일 source_ref 비율 × 0.15 보너스
- 순서 독립적으로 일관성 평가
