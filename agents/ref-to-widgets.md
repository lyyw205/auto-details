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
[Step 2] /extract-widgets + /register-widgets (자동 실행)
  → widgets/_presets/preset--ref-{name}.json  (프리셋 1개)
  → output/widgets-preview--ref-{name}.html  (통합 프리뷰, 참고용)
  → widgets/{taxonomy_id}/{widget_id}.widget.html  (위젯 N개)
  → widgets/_registry.json 업데이트 (status: "new")
```

> **사후 검수**: 추출 완료 후 갤러리(`http://localhost:3333`)의 "새로 추가" 탭에서 위젯을 검수합니다.

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

## Step 2: /extract-widgets + /register-widgets

**스킬 파일**: `skills/extract-widgets.skill.md`, `skills/register-widgets.skill.md`

분석 결과를 HTML 위젯으로 변환하고, 개별 파일로 저장한 뒤 레지스트리에 등록합니다.
`templates/html-section-patterns.md`의 패턴을 참조하여 실제 HTML/CSS를 생성합니다.

### Input
- `output/analysis-{name}.json`

### Output (모두 한 번에 생성)
1. **스타일 프리셋**: `widgets/_presets/preset--ref-{name}.json`
2. **통합 프리뷰** (참고용): `output/widgets-preview--ref-{name}.html`
3. **개별 위젯 파일**: `widgets/{taxonomy_id_lower}/{widget_id}.widget.html` × N개
4. **레지스트리 업데이트**: `widgets/_registry.json` — 각 위젯이 `status: "new"`로 등록

### 유저에게 표시
```
=== ref-{name} 위젯 추출 + 등록 완료 ===

프리셋: preset--ref-{name} ({style_tags})

| # | Taxonomy | Widget ID | Composition | Theme |
|---|----------|-----------|-------------|-------|
| 1 | Hook | hook--ref-{name} | stack | light |
| 2 | WhatIsThis | whatisthis--ref-{name} | stack | light |
| ... | ... | ... | ... | ... |

총 {N}개 위젯 등록 (status: new)

프리뷰 확인: output/widgets-preview--ref-{name}.html (브라우저에서 열기)
```

## 사후 검수 (갤러리)

추출 완료 후 갤러리 웹(`http://localhost:3333`)에서 사후 검수합니다:

1. **"새로 추가" 탭** 클릭 → 새로 등록된 위젯 목록 확인
2. **일반 위젯**: "보관" 또는 "삭제" 선택
3. **중복 후보**: 기존 위젯과 나란히 비교 → "이 위젯 유지" 클릭
4. **전체 보관**: 중복이 없는 위젯을 일괄 보관

검수 완료된 위젯은 `status: "reviewed"`로 변경되어 라이브러리에 포함됩니다.

## 완료 메시지
```
=== 레퍼런스 위젯 등록 완료 ===

소스: ref-{name}
신규 위젯: {N}개 (.widget.html)
프리셋: preset--ref-{name}
현재 총 위젯: {total}개

갤러리에서 검수하세요: http://localhost:3333 → "새로 추가" 탭
이후 /product-to-html로 이 위젯들을 사용할 수 있습니다.
```

---

## v4 와이어프레임 모드

v4 모드를 사용하면 Figma Make에 최적화된 **와이어프레임 HTML 위젯**을 생성합니다.

### v4 파이프라인

```
레퍼런스 이미지
       ↓
[Step 1] /analyze-ref-v3 (변경 없음)
  → output/analysis-v3-{name}.json
       ↓
[Step 2] /extract-widgets-v4 + /register-widgets (자동 실행)
  → widgets/_presets/preset--ref-{name}.json  (프리셋 1개)
  → output/widgets-preview--ref-{name}--v4.html  (와이어프레임 프리뷰)
  → widgets/{taxonomy_id}/{widget_id}--v4.widget.html  (와이어프레임 위젯 N개)
  → widgets/_registry.json 업데이트 (status: "new", composition: "wireframe")
       ↓
[Step 3] (선택) /generate-figma-make-prompt-v2
  → output/{name}-figma-make-prompt.md  (Figma Make 프롬프트)
```

### v4 특징
- **auto-layout** (flexbox/grid) 사용, absolute positioning 금지
- **무채색** 와이어프레임 — 회색/흰색만 사용
- **한글 라벨** — 모든 요소에 역할 라벨 표시
- **Figma Make 힌트** — WIDGET_META에 `figma_make_hints` 블록 포함
- **`.wf-*` CSS 클래스** — `templates/wireframe-base.html` 전용 CSS 시스템

### 스킬 파일
- 분석: `skills/analyze-ref-v3.skill.md`
- 추출: `skills/extract-widgets-v4.skill.md`
- 프롬프트: `skills/generate-figma-make-prompt-v2.skill.md`

### 호환성
- v2/v3 위젯과 동일 레퍼런스에서 공존 가능
- 갤러리 서버가 `composition: "wireframe"` 감지 시 자동으로 wireframe-base.html 사용
- 기존 데모 모드(`applyDemoMode`) 호환 (듀얼 클래스 `wf-image img-placeholder`)
