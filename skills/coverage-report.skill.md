# /coverage-report — 위젯 커버리지 리포트

## Purpose
위젯 라이브러리의 taxonomy 커버리지 현황을 분석하고, 확장 우선순위를 제시합니다.
Pipeline C 시작 시 자동 실행되거나, 독립적으로 온디맨드 실행 가능합니다.

## Context
- 위젯 레지스트리: `widgets/_registry.json`
- Taxonomy 정의: `skills/section-taxonomy.json` (slim 필드 사용: `id, name, category, is_required, frequency`)

## Input
- `widgets/_registry.json`
- `skills/section-taxonomy.json`

## Processing

### 1단계: Taxonomy 로딩

`skills/section-taxonomy.json`에서 22개 섹션의 `id, name, category, is_required, frequency` 필드 추출.

### 2단계: 레지스트리 집계

`widgets/_registry.json`의 `widgets` 객체를 순회하여 taxonomy_id별 위젯 수 집계.

집계 항목:
- **taxonomy별 위젯 수**: `registry.widgets[taxonomy_id].length`
- **theme 분포**: 각 위젯의 `theme` 필드 집계 (light / dark / null)
- **composition 분포**: 각 위젯의 `composition` 필드 집계 (stack / split / composed / wireframe)
- **소스 레퍼런스 분포**: 각 위젯의 `source_ref` 필드 집계

### 3단계: 커버리지 산출

```
커버리지 % = (위젯이 1개 이상인 taxonomy 수) / 22 × 100
```

### 4단계: 갭 분석

위젯이 0개인 taxonomy를 갭으로 분류:
- `is_required: true`인 갭 섹션 → **최우선 확장 대상**
- `frequency`가 높은 갭 섹션 → **우선 확장 대상**

### 5단계: 추천 확장 우선순위 산출

우선순위 정렬 기준 (내림차순):
1. `is_required: true`이고 위젯 수 = 0
2. `is_required: false`이고 위젯 수 = 0, `frequency` 내림차순
3. 위젯 수 > 0이지만 theme 단일(dark만 또는 light만) — 다양성 부족

추가 권장사항:
- 위젯이 3개 이상인 taxonomy에서 dark/light 중 한쪽이 없으면 테마 반전 변형 권장
- FeatureDetail처럼 반복 사용 섹션은 6개 이상 권장

## Output

유저에게 아래 형식으로 출력 (파일 저장 없이 콘솔 출력):

```
=== 위젯 커버리지 리포트 ===
전체 커버리지: 8/22 (36%)

[커버리지 있음] Hook(3), WhatIsThis(1), SetContents(1), FeaturesOverview(1), FeatureDetail(6), Target(1), ProductSpec(3), Differentiator(3), WhyCore(2)
[미커버] BrandName, PainPoint, Solution, Tips, StatsHighlight, Comparison, Safety, Reviews, FAQ, Warranty, CTABanner, EventPromo, CTA

스타일 분포:
  Theme: light 21 / dark 0
  Composition: stack 14 / split 3 / composed 1 / wireframe 2

소스 분포: ref-reference4(8), ref-cassunut(10), ref-test-sample(2), ref-reference3(1)

→ 추천 확장: Hook(dark 변형 필요), CTA(필수·미커버), CTABanner(필수·미커버), FAQ(빈도 높음·미커버)
```

필요 시 선택적으로 `output/coverage-report.json`에 저장:

```json
{
  "type": "COVERAGE_REPORT",
  "generated_at": "ISO 8601",
  "total_taxonomies": 22,
  "covered_taxonomies": 8,
  "coverage_pct": 36,
  "by_taxonomy": {
    "Hook": { "count": 3, "theme": { "light": 3, "dark": 0 }, "composition": { "stack": 2, "split": 1 } },
    "CTA": { "count": 0 }
  },
  "style_distribution": {
    "theme": { "light": 21, "dark": 0 },
    "composition": { "stack": 14, "split": 3, "composed": 1, "wireframe": 2 }
  },
  "source_distribution": { "ref-reference4": 8, "ref-cassunut": 10 },
  "gaps": ["BrandName", "PainPoint", "Solution", "CTA"],
  "priority_expansions": [
    { "taxonomy_id": "CTA", "reason": "필수 섹션·미커버", "priority": 1 },
    { "taxonomy_id": "CTABanner", "reason": "필수 섹션·미커버", "priority": 2 },
    { "taxonomy_id": "Hook", "reason": "dark 변형 부재", "priority": 3 }
  ]
}
```

## Validation
- [ ] 22개 taxonomy가 모두 집계에 포함되었는가?
- [ ] `total_widgets`와 taxonomy별 합산이 일치하는가?
- [ ] `is_required: true` 섹션이 추천 확장 목록에 우선 포함되었는가?
- [ ] theme/composition 분포 합산이 전체 위젯 수와 일치하는가?
