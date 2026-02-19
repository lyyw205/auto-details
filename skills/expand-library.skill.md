# /expand-library — 위젯 라이브러리 자동 확장

## Purpose
커버리지 갭을 채우기 위해 기존 위젯에서 변형을 생성하여 위젯 라이브러리를 자동 확장합니다.
Pipeline C에서 `/coverage-report` 실행 후 연속 실행됩니다.

## Context
- 위젯 레지스트리: `widgets/_registry.json`
- 기존 위젯 JSON: `widgets/{taxonomy_id_lower}/*.widget.json`
- Taxonomy 정의: `skills/section-taxonomy.json`
- 스타일 프리셋: `widgets/_presets/preset--*.json`

## Input
1. **커버리지 리포트**: `/coverage-report` 결과 (갭 목록 + 우선순위)
2. **`widgets/_registry.json`**: 소스 위젯 탐색용
3. **기존 `.widget.json` 파일들**: 변형 생성의 소스
4. **`skills/section-taxonomy.json`**: 대상 taxonomy의 `required_elements` 참조

## Processing

### 1단계: 소스 위젯 탐색

갭 taxonomy별로 아래 기준으로 소스 위젯 선정:

**우선순위 (내림차순):**
1. **같은 category** (intro/problem/features/trust/conversion)에서 composition이 동일한 위젯
2. **같은 category**에서 composition이 유사한 위젯
3. **전체 레지스트리**에서 composition이 동일한 위젯

소스 위젯이 없으면 해당 taxonomy 스킵 후 경고 출력.

### 2단계: 변형 타입 결정

갭 taxonomy의 커버리지 상태에 따라 생성할 변형 타입 결정:

| 상태 | 생성 변형 |
|------|----------|
| 위젯 0개 | Theme flip (기존 위젯 반전) |
| 위젯 있으나 dark만 | Light 변형 생성 |
| 위젯 있으나 light만 | Dark 변형 생성 |
| composition 다양성 부족 | Composition 변경 변형 생성 |

### 3단계: 변형 생성 규칙

#### Theme Flip (light → dark / dark → light)
- `canvas.bgColor`: 기존 배경색을 반전 (밝은 색 → `#1A1A1A` 계열, 어두운 색 → `#FFFFFF` 계열)
- 모든 element의 `style.color`: 명도 반전
- `style.background`가 있으면 함께 반전
- `theme` 필드: `"light"` ↔ `"dark"` 교체

#### Composition 변경 (stack → split)
- stack: 세로 나열 구조 → split: 좌우 분할 구조
- 이미지 element: x 좌표를 50% 위치로, width를 45%로 조정
- 텍스트 element: x 좌표를 5% 위치로, width를 45%로 조정
- `composition` 필드 업데이트

#### Style 적응 (다른 프리셋 색상 적용)
- 소스 위젯의 색상 값을 대상 프리셋의 `color_system` 값으로 교체
- `style_tags`를 대상 프리셋의 `style_tags`로 업데이트

**변형 시 불변 항목:**
- element 구조 (types, labels, 개수)
- `required_elements` 충족 여부
- canvas 크기 (width: 860)
- `figma_hints`, `sample_data` 필드

### 4단계: 신규 위젯 메타데이터 생성

```json
{
  "widget_id": "{taxonomy_lower}--ref-{source}--{variant}",
  "taxonomy_id": "대상 taxonomy_id",
  "category": "taxonomy category",
  "composition": "변형 후 composition",
  "theme": "변형 후 theme",
  "style_tags": ["소스 style_tags 유지 또는 변형에 따라 업데이트"],
  "provenance": {
    "source_ref": "소스 위젯의 source_ref",
    "source_widget_id": "소스 위젯 ID",
    "variation_type": "theme_flip | composition_change | style_adaptation",
    "extracted_date": "ISO 8601 현재 날짜"
  },
  "status": "new"
}
```

**widget_id 규칙:**
- Theme flip: `{taxonomy}--ref-{source}--dark` 또는 `--light`
- Composition change: `{taxonomy}--ref-{source}--split` 또는 `--stack`
- Style adaptation: `{taxonomy}--ref-{source}--v2`

### 5단계: 파일 저장 및 레지스트리 등록

1. 신규 `.widget.json`을 `widgets/{taxonomy_id_lower}/` 에 저장
2. `/register-widgets` 스킬 호출하여 `_registry.json` 업데이트

## Output
- 신규 `.widget.json` 파일들
- 업데이트된 `widgets/_registry.json`
- 유저에게 확장 요약 표시:

```
=== 라이브러리 확장 완료 ===
생성된 위젯: 5개
  - cta--ref-reference4--dark (CTA, theme_flip)
  - ctabanner--ref-cassunut--light (CTABanner, theme_flip)
  - faq--ref-reference4--stack (FAQ, composition_change)
  - brandname--ref-cassunut--dark (BrandName, theme_flip)
  - painpoint--ref-reference4--split (PainPoint, composition_change)

커버리지 변화: 8/22 (36%) → 13/22 (59%)
```

## Validation
- [ ] 신규 `widget_id`가 기존 레지스트리와 중복되지 않는가?
- [ ] `required_elements`가 모두 element 배열에 포함되었는가?
- [ ] Theme flip 후 텍스트 가독성이 유지되는가? (light 배경에 dark 텍스트, 반대도 동일)
- [ ] `composition` 필드가 실제 element 배치와 일치하는가?
- [ ] `provenance.source_widget_id`가 실제 존재하는 위젯을 가리키는가?
- [ ] canvas `width`가 860으로 유지되는가?

## 주의사항
- 소스 위젯의 `element` 구조(label, type)는 변경하지 않음 — 위치/색상만 조정
- `status: "new"`로 등록하여 사람 검수 전까지 자동 선택 우선순위 하향
- 동일 소스에서 동일 변형 타입이 이미 존재하면 스킵 (중복 생성 방지)
- composition 변경은 `stack`↔`split`만 지원 — `composed`는 수동 생성 필요
