# /ref-to-widgets — 레퍼런스 → 섹션 위젯 추출 에이전트

## 개요
레퍼런스 이미지를 분석하여 **개별 HTML 섹션 위젯**과 **스타일 프리셋**을 생성하고 레지스트리에 등록합니다.

## 파이프라인

```
레퍼런스 이미지
       ↓
[Step 1] /analyze-ref
  → output/analysis-{name}.json
       ↓
[Step 2] /extract-widgets (프리뷰 생성)
  → widgets/_presets/preset--ref-{name}.json  (1개)
  → output/widgets-preview--ref-{name}.html  (통합 프리뷰)
       ↓
[Step 2.5] 유저 검수
  → 브라우저에서 통합 프리뷰 확인
  → 유저 확인/수정
       ↓
[Step 3] 분리 저장 + /register-widgets
  → widgets/{taxonomy_id}/{widget_id}.widget.html  (N개)
  → widgets/_registry.json 업데이트
```

## 실행 조건
- 입력: 레퍼런스 이미지 (1장 이상) + 레퍼런스 이름
- 필요 파일: `skills/section-taxonomy.json`, `templates/html-section-patterns.md`

## Step 1: /analyze-ref

**스킬 파일**: `skills/analyze-ref.skill.md`

레퍼런스 이미지를 분석하여 구조화된 레이아웃 데이터를 추출합니다.

### Input
- 레퍼런스 이미지
- 레퍼런스 이름 (영문 소문자 + 하이픈)

### Output
- `output/analysis-{name}.json`
  - `global_analysis`: 너비, 색상, 타이포, 스타일, **style_tags**, **theme**
  - `sections[]`: 각 섹션의 매핑, 레이아웃, composition, 요소, ai_prompt
  - `pattern_summary`: 전체 구조 요약

### 유저 확인
- 분석 결과 요약 표시 (섹션 수, 매핑률, 미분류 섹션)
- 미분류 섹션이 있으면 리포트 (`skills/unmapped-sections/`) 표시

## Step 2: /extract-widgets (프리뷰 생성)

**스킬 파일**: `skills/extract-widgets.skill.md`

분석 결과를 HTML 위젯으로 변환하되, **개별 파일이 아닌 통합 프리뷰 HTML**로 먼저 생성합니다.
`templates/html-section-patterns.md`의 패턴을 참조하여 실제 HTML/CSS를 생성합니다.

### Input
- `output/analysis-{name}.json`

### Output (이 단계에서는 프리뷰만)
- 스타일 프리셋: `widgets/_presets/preset--ref-{name}.json`
- 통합 프리뷰: `output/widgets-preview--ref-{name}.html`
  - 모든 위젯을 하나의 HTML에 순서대로 조합
  - 각 위젯 상단에 라벨 (번호, Taxonomy, widget_id, composition, theme)
  - 브라우저에서 바로 확인 가능

### 유저에게 표시
```
=== ref-{name} 위젯 프리뷰 생성 완료 ===

프리셋: preset--ref-{name} ({style_tags})

| # | Taxonomy | Widget ID | Composition | Theme |
|---|----------|-----------|-------------|-------|
| 1 | Hook | hook--ref-{name} | stack | light |
| 2 | WhatIsThis | whatisthis--ref-{name} | stack | light |
| ... | ... | ... | ... | ... |

총 {N}개 위젯

프리뷰 확인: output/widgets-preview--ref-{name}.html (브라우저에서 열기)
```

## Step 2.5: 유저 검수

**통합 프리뷰 HTML을 브라우저에서 열어** 한 화면에서 모든 위젯을 확인합니다:
- 잘못된 taxonomy 매핑 수정
- 불필요한 위젯 제거
- 레이아웃/스타일 수정 요청
- 커스텀 섹션 확인

## Step 3: 분리 저장 + /register-widgets

**유저 승인 후** 실행합니다.

### 3-1. 분리 저장
프리뷰에서 각 위젯의 `<!--WIDGET_META-->` + `<section>` 부분을 추출하여 개별 파일로 저장:
- `widgets/{taxonomy_id_lower}/{widget_id}.widget.html` × N개

### 3-2. 레지스트리 등록
**스킬 파일**: `skills/register-widgets.skill.md`

저장된 위젯들을 레지스트리에 등록합니다.

### Output
- `widgets/_registry.json` 업데이트
- 등록 요약 (신규/갱신 수, 현재 총 위젯 수)

## 완료 메시지
```
=== 레퍼런스 위젯 등록 완료 ===

소스: ref-{name}
신규 위젯: {N}개 (.widget.html)
프리셋: preset--ref-{name}
현재 총 위젯: {total}개

이제 /product-to-html로 이 위젯들을 사용할 수 있습니다.
```
