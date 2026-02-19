# /validate-widgets — JSON 위젯 구조 무결성 검증

## Purpose
`/build-widgets` 완료 후 생성된 `.widget.json` 파일들의 스키마, 좌표, 메타데이터, 중복 여부를 자동 검증합니다.

## Context
- **위젯 스키마**: `lib/widget-renderer/widget-schema.json`
- **타입 정의**: `lib/widget-renderer/types.ts` (`ValidationResult` 타입)
- **섹션 분류 체계**: `skills/section-taxonomy.json` (유효한 taxonomy_id 22개)
- **원본 매핑**: `output/mapping-{name}.json` (좌표 비교 기준)
- **레지스트리**: `widgets/_registry.json` (중복 감지 기준)
- **프리셋 목록**: `widgets/_presets/` (source_ref 대응 확인)

## Input
- `.widget.json` 파일 1개 이상 (파일 경로 목록 또는 레퍼런스명 `{name}`)
- `output/mapping-{name}.json` — 좌표 비교용 원본 매핑 데이터
- `widgets/_registry.json` — 중복 감지용 기존 위젯 목록

레퍼런스명만 제공된 경우 `widgets/` 하위에서 `--ref-{name}` 포함 파일을 자동 수집합니다.

## Processing

### 1. JSON 스키마 검증

각 `.widget.json`에 대해 아래 필수 필드 존재 여부를 확인합니다:

**최상위 필수 필드:**
- `widget_id` — 문자열, 비어 있지 않음
- `taxonomy_id` — 문자열, `section-taxonomy.json`의 유효 ID 목록 중 하나
- `category` — 문자열, `intro / problem / features / trust / conversion` 중 하나
- `elements` — 배열, 비어 있지 않음 (`length >= 1`)
- `canvas` — 객체

**canvas 필수 필드:**
- `canvas.width` — 숫자, 값이 `860`

**elements 각 항목 필수 필드:**
- `id` — 문자열
- `type` — `text | image | shape | button | container` 중 하나
- `x`, `y`, `width`, `height` — 숫자
- `zIndex` — 숫자 (없으면 오류)

### 2. 좌표 무결성 검증

#### 2-1. 범위 검사
모든 element의 좌표값이 0~100 범위인지 확인합니다:
- `x`, `y`, `width`, `height` 각각 `0 <= 값 <= 100`
- 범위 초과 시 오류

#### 2-2. 원본 매핑 좌표 일치 검사
`output/mapping-{name}.json`이 존재하면, 위젯의 `provenance.source_ref`에서 레퍼런스명을 추출하여 해당 매핑 파일과 좌표를 비교합니다.

**비교 방법:**
1. 매핑 JSON의 Bound 배열에서 같은 섹션 그룹(taxonomy_id 일치)의 Bound 추출
2. 위젯 elements와 Bound를 `id` 또는 순서 기준으로 1:1 대응
3. `x, y, width, height` 값이 **완전 일치(100%)** 해야 통과

좌표가 단 1개라도 다르면 오류로 처리합니다 (반올림 허용: ±0.01 이내).

매핑 파일이 없으면 이 검사를 건너뜁니다.

### 3. 메타데이터 정합성 검증

#### 3-1. taxonomy_id 유효성
`skills/section-taxonomy.json`을 로드하여 유효한 taxonomy_id 목록을 확보합니다.
위젯의 `taxonomy_id`가 목록에 없으면 오류입니다. `_custom` 그룹은 taxonomy_id 검사를 면제합니다.

**유효한 taxonomy_id 22개:**
`Hook, WhatIsThis, BrandName, SetContents, WhyCore, PainPoint, Solution, FeaturesOverview, FeatureDetail, Tips, Differentiator, StatsHighlight, Comparison, Safety, Target, Reviews, ProductSpec, FAQ, Warranty, CTABanner, EventPromo, CTA`

#### 3-2. source_ref ↔ 프리셋 대응 확인
`provenance.source_ref`가 존재하면 `widgets/_presets/preset--{source_ref}.json` 파일이 실제로 있는지 확인합니다.
파일이 없으면 경고(warning)로 처리합니다.

#### 3-3. figma_hints 비어 있지 않음
`figma_hints` 필드가 존재하고, `layout` 또는 `composition` 중 하나 이상이 비어 있지 않은 문자열인지 확인합니다.
없거나 모두 빈 문자열이면 경고입니다.

#### 3-4. sample_data ↔ elements content placeholder 대응
`sample_data` 필드의 키가 최소 1개 이상인지 확인합니다.
`elements` 중 `type: "text"`인 항목의 `id`가 `sample_data`에 키로 존재하지 않으면 경고입니다.

### 4. 중복 감지

`widgets/_registry.json`에서 동일 `taxonomy_id` 그룹의 기존 위젯(status가 없거나 `"reviewed"`인 항목)과 유사도를 계산합니다.

**유사도 공식 (build-widgets와 동일):**
```
유사도 = (style_tags Jaccard × 0.5) + (composition 일치 × 0.3) + (theme 일치 × 0.2)
```
- **Jaccard** = `|교집합| / |합집합|` (style_tags 기준)
- **composition 일치** = 같으면 1.0, 다르면 0.0
- **theme 일치** = 같으면 1.0, 다르면 0.0
- **임계값**: 0.7 이상이면 중복 후보 경고

여러 위젯이 임계값을 초과하면 최고 점수 위젯 1개만 경고에 포함합니다.

## Output

검증 결과를 JSON으로 출력하고 유저에게 요약을 표시합니다.

```json
{
  "pass": true,
  "total_elements": 12,
  "errors": [],
  "warnings": [
    {
      "widget_id": "hook--ref-terive",
      "element_id": "el_1",
      "field": "sample_data",
      "message": "text element 'el_1'에 대응하는 sample_data 키가 없음"
    },
    {
      "widget_id": "hook--ref-terive",
      "field": "duplicate",
      "message": "기존 위젯 'hook--ref-reference4'와 유사도 0.85 (임계값 0.7 초과)",
      "duplicate_of": "hook--ref-reference4",
      "similarity_score": 0.85
    }
  ]
}
```

**pass 조건**: `errors` 배열이 비어 있으면 `true`, 오류가 1개 이상이면 `false`.

**유저 요약 출력 예시:**
```
검증 결과: PASS (오류 0개, 경고 2개)
- 위젯 3개 검증 완료
- 총 element 12개 확인
- 경고: el_1 sample_data 누락, hook--ref-terive 중복 후보 감지
```

## Validation 판정 기준

| 항목 | 판정 |
|------|------|
| 필수 필드 누락 | 오류 |
| canvas.width ≠ 860 | 오류 |
| elements 배열 비어 있음 | 오류 |
| element 좌표 0~100 범위 초과 | 오류 |
| 원본 매핑과 좌표 불일치 | 오류 |
| taxonomy_id 유효하지 않음 | 오류 |
| source_ref 프리셋 파일 없음 | 경고 |
| figma_hints 비어 있음 | 경고 |
| sample_data 키 누락 | 경고 |
| 중복 후보 감지 (유사도 ≥ 0.7) | 경고 |
