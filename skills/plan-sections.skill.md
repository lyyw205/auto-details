# /plan-sections — 섹션 플랜 설계

## Purpose
제품 정보를 분석하여 상세페이지에 필요한 섹션 목록과 배치 순서를 설계합니다.

## Context
- `skills/section-taxonomy.json`에서 **slim 필드만** 로딩:
  `id, name, category, purpose, is_required, frequency, keywords, visual_cues`
  (required_elements, copywriting_guide 등은 로딩하지 않음)

## Input
1. **제품명**: 상세페이지를 만들 제품
2. **제품 설명**: 핵심 특징, 기능, 차별점
3. **핵심 기능 수**: 강조할 기능 개수 (기본값: 6)
4. **선호 스타일**: (선택) 다크모드, 미니멀, 컬러풀 등
5. **필수 포함 섹션**: (선택) 반드시 포함할 섹션 목록
6. **제외 섹션**: (선택) 제외할 섹션 목록

## Processing

### 설계 원칙

- taxonomy의 `is_required: true` 섹션(Hook, CTA)은 **항상 포함**
- 제품 특성에 따라 적합한 섹션 선택
- 핵심 기능 수에 따라 FeatureDetail 반복 횟수 결정
- 카테고리별 균형 유지: `intro → problem → features → trust → conversion`
- 사용자 지정 필수/제외 섹션 우선 반영

### FeatureDetail 자동 산출
FeatureDetail 반복 횟수 = min(핵심 기능 수, 8)
- 유저가 핵심 기능 수를 명시한 경우: 해당 수만큼 FeatureDetail 배치
- 미명시 시: 제품 설명에서 기능 수를 추론하여 min(추론 수, 8) 적용

### 제품 카테고리별 자동 매핑
제품 카테고리(가전, 뷰티, 식품, 패션 등)에 따라 기본 섹션 구조를 자동 추천:
- 식품: Hook → WhyCore → Differentiator → FeatureDetail×3 → SetContents → Safety → ProductSpec → CTA
- 뷰티: Hook → BrandName → PainPoint → Solution → FeatureDetail×4 → Reviews → CTA
- 가전: Hook → FeaturesOverview → FeatureDetail×5 → StatsHighlight → Comparison → ProductSpec → CTA
유저 수정 요청에 따라 조정 가능.

### 섹션 선택 가이드

| 제품 특성 | 추천 섹션 |
|-----------|----------|
| 기술 제품 | WhyCore, Comparison, ProductSpec |
| 감성 제품 | BrandName, Target, Reviews |
| 고가 제품 | Safety, Warranty, Comparison |
| 구성품 세트 | SetContents, FeaturesOverview |
| 모든 제품 | Hook(필수), PainPoint, Solution, CTA(필수) |

### 출력 형식

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

## Output
- 파일: `output/{product}-section-plan.json`
- 유저에게 섹션 플랜 요약 표시 → **수정 요청 수렴**

## Validation
- [ ] Hook, CTA 필수 섹션이 포함되었는가?
- [ ] FeatureDetail 수가 핵심 기능 수와 일치하는가?
- [ ] 카테고리 순서가 자연스러운가? (intro → problem → features → trust → conversion)
- [ ] 사용자 지정 필수/제외 섹션이 반영되었는가?
- [ ] 총 섹션 수가 합리적인가? (12~30개 범위)
