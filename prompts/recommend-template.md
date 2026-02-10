# 템플릿 추천 프롬프트

## 목적

제품 설명과 요청 사항을 분석하여 **필요한 섹션을 설계**하고,
기존 템플릿 중 **가장 매칭이 잘 되는 템플릿을 추천**합니다.

### 참조 파일

- 섹션 분류 체계: `skills/section-taxonomy.json`
- 템플릿 레지스트리: `templates/_registry.json`
- 개별 템플릿: `templates/*.template.json`

---

## 입력

사용자가 제공하는 정보:

1. **제품명**: 상세페이지를 만들 제품
2. **제품 설명**: 제품의 핵심 특징, 기능, 차별점
3. **핵심 기능 수**: 강조할 기능 개수 (기본값: 6)
4. **선호 스타일**: (선택) 다크모드, 미니멀, 컬러풀 등
5. **필수 포함 섹션**: (선택) 반드시 포함할 섹션 목록
6. **제외 섹션**: (선택) 제외할 섹션 목록

---

## 처리 단계

### 1단계: 섹션 설계

제품 설명을 분석하여 필요한 섹션 목록과 배치 순서를 결정합니다.

#### 설계 원칙

- taxonomy의 `is_required: true` 섹션(Hook, CTA)은 항상 포함
- 제품 특성에 따라 적합한 섹션 선택
- 핵심 기능 수에 따라 FeatureDetail 반복 횟수 결정
- 카테고리별 균형 유지 (intro → problem → features → trust → conversion)

#### 출력 형식

```json
{
  "section_plan": {
    "product_name": "제품명",
    "total_sections": 18,
    "feature_count": 6,
    "sections": [
      {
        "order": 1,
        "section_id": "Hook",
        "category": "intro",
        "reason": "필수 섹션 - 메인 후킹"
      },
      {
        "order": 2,
        "section_id": "WhatIsThis",
        "category": "intro",
        "reason": "제품 정체성 설명 필요"
      },
      {
        "order": 9,
        "section_id": "FeatureDetail",
        "category": "features",
        "feature_index": 1,
        "reason": "첫 번째 핵심 기능 상세"
      }
    ],
    "category_distribution": {
      "intro": 4,
      "problem": 2,
      "features": 8,
      "trust": 3,
      "conversion": 1
    }
  }
}
```

### 2단계: 템플릿 매칭

설계된 섹션 플랜을 기존 템플릿들과 비교하여 매칭 점수를 계산합니다.

#### 매칭 점수 계산

```
최종 점수 = section_overlap_score × 1.0
           + order_similarity_score × 0.5
           + category_ratio_score × 0.3
           - missing_required_penalty × 2.0
```

##### section_overlap_score (섹션 겹침)

```
겹치는 섹션 수 / max(플랜 섹션 수, 템플릿 섹션 수)
```

- FeatureDetail은 개수까지 비교 (플랜: 6개, 템플릿: 4개 → 4/6 부분 점수)
- 정확히 같은 section_id끼리만 겹침으로 인정

##### order_similarity_score (순서 유사도)

겹치는 섹션들의 상대적 순서가 얼마나 유사한지 측정:

```
1 - (순서 역전 쌍 수 / 전체 비교 가능한 쌍 수)
```

##### category_ratio_score (카테고리 비율)

각 카테고리(intro/problem/features/trust/conversion)의 비율 차이:

```
1 - 평균(|플랜 카테고리 비율 - 템플릿 카테고리 비율|)
```

##### missing_required_penalty

플랜의 `is_required: true` 섹션이 템플릿에 없으면 감점.

#### 출력 형식

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
        "total": 0.85 + 0.36 + 0.27 - 0 = 1.48
      },
      "matched_sections": ["Hook", "WhatIsThis", "FeaturesOverview", "FeatureDetail×4", "Reviews", "FAQ", "CTA"],
      "missing_in_template": ["BrandName", "Tips"],
      "extra_in_template": ["Warranty"],
      "recommendation": "기능 상세 4개 → 6개로 확장 필요. 전체적인 구조와 흐름이 가장 유사."
    },
    {
      "rank": 2,
      "template_id": "default-24section",
      "scores": { "..." : "..." },
      "recommendation": "..."
    }
  ]
}
```

### 3단계: 최종 추천

상위 3개 템플릿을 비교 요약하여 사용자에게 추천합니다.

```json
{
  "recommendation": {
    "best_match": {
      "template_id": "ref-apple-airpods",
      "total_score": 1.48,
      "summary": "18개 섹션 중 15개 매칭 (83%). 기능 상세 섹션 2개 추가 필요."
    },
    "alternatives": [
      {
        "template_id": "default-24section",
        "total_score": 1.32,
        "summary": "24개 전체 섹션 포함. 불필요한 섹션 6개 제거 필요."
      }
    ],
    "modifications_needed": [
      "FeatureDetail 4개 → 6개로 확장",
      "BrandName 섹션 추가 필요",
      "Warranty 섹션 제거 가능"
    ]
  }
}
```

---

## 특수 케이스 처리

### 템플릿이 없거나 매칭이 낮을 때

모든 템플릿의 total_score가 0.5 미만이면:

```json
{
  "recommendation": {
    "best_match": null,
    "suggestion": "기존 템플릿 중 적합한 것이 없습니다. default-24section을 기반으로 커스텀 구성을 추천합니다.",
    "custom_plan": { "...섹션 플랜..." }
  }
}
```

### 사용자가 섹션을 직접 지정한 경우

필수 포함/제외 섹션이 지정되면 해당 조건을 반영한 뒤 매칭합니다.
지정된 섹션은 매칭 점수와 관계없이 최종 결과에 반영됩니다.
