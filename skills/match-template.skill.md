# /match-template — 템플릿 매칭/추천

## Purpose
섹션 플랜을 기존 템플릿들과 비교하여 매칭 점수를 계산하고 상위 3개를 추천합니다.

## Context
- `output/{product}-section-plan.json` (plan-sections 출력)
- `templates/_registry.json` (템플릿 목록)
- 각 템플릿 파일에서 **섹션 ID 목록 + 카테고리 비율만** 로딩 (전체 내용 불필요)
- `skills/section-taxonomy.json`에서 **`matching_config` 블록만** (~200 토큰)

## Input
- section plan JSON (product name, sections 배열, category_distribution)

## Processing

### 매칭 점수 계산

```
최종 점수 = section_overlap_score × 1.0
           + order_similarity_score × 0.5
           + category_ratio_score × 0.3
           - missing_required_penalty × 2.0
```

#### section_overlap_score (섹션 겹침)

```
겹치는 섹션 수 / max(플랜 섹션 수, 템플릿 섹션 수)
```
- FeatureDetail은 개수까지 비교 (플랜: 6개, 템플릿: 4개 → 4/6 부분 점수)
- 정확히 같은 section_id끼리만 겹침으로 인정

#### order_similarity_score (순서 유사도)

겹치는 섹션들의 상대적 순서가 얼마나 유사한지:
```
1 - (순서 역전 쌍 수 / 전체 비교 가능한 쌍 수)
```

#### category_ratio_score (카테고리 비율)

각 카테고리(intro/problem/features/trust/conversion)의 비율 차이:
```
1 - 평균(|플랜 카테고리 비율 - 템플릿 카테고리 비율|)
```

#### missing_required_penalty

플랜의 `is_required: true` 섹션(Hook, CTA)이 템플릿에 없으면 감점.

### 출력 형식

```json
{
  "template_ranking": [
    {
      "rank": 1,
      "template_id": "ref-apple-airpods",
      "template_name": "Apple AirPods 기반 템플릿",
      "file": "ref-apple-airpods.template.json",
      "scores": {
        "section_overlap": 0.85,
        "order_similarity": 0.72,
        "category_ratio": 0.91,
        "missing_required_penalty": 0,
        "total": 1.48
      },
      "matched_sections": ["Hook", "WhatIsThis", "FeaturesOverview", "FeatureDetail×4", "Reviews", "FAQ", "CTA"],
      "missing_in_template": ["BrandName", "Tips"],
      "extra_in_template": ["Warranty"],
      "recommendation": "기능 상세 4개 → 6개로 확장 필요. 전체적인 구조와 흐름이 가장 유사."
    },
    {
      "rank": 2,
      "template_id": "default-24section",
      "scores": {},
      "recommendation": "..."
    },
    {
      "rank": 3,
      "template_id": "...",
      "scores": {},
      "recommendation": "..."
    }
  ]
}
```

### 특수 케이스

#### 모든 템플릿 total_score < 0.5

```json
{
  "template_ranking": [],
  "recommendation": {
    "best_match": null,
    "suggestion": "기존 템플릿 중 적합한 것이 없습니다. default-24section을 기반으로 커스텀 구성을 추천합니다.",
    "custom_plan": "섹션 플랜 그대로 사용"
  }
}
```

#### 사용자가 섹션을 직접 지정한 경우

필수 포함/제외 섹션이 지정되면 해당 조건을 반영한 뒤 매칭.
지정된 섹션은 매칭 점수와 관계없이 최종 결과에 반영.

## Output
- 파일: `output/{product}-template-match.json`
- 상위 3개 템플릿 추천 표시
- **[BLOCKING] 유저가 템플릿을 선택할 때까지 대기**

## Validation
- [ ] 모든 등록 템플릿과 비교했는가?
- [ ] 점수 계산이 matching_config 가중치를 따르는가?
- [ ] 추천 사유가 구체적이고 명확한가?
- [ ] missing/extra 섹션이 정확히 식별되었는가?
