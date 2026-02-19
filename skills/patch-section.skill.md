# /patch-section — 섹션 부분 패치

## Purpose
`validate-output`이 특정 섹션에서 문제를 발견했을 때, 전체 페이지를 재생성하지 않고
해당 섹션만 타겟 수정합니다.

## Context
- 완성된 상세페이지: `output/{product}-detail.html`
- 패치 대상 위젯 JSON: `widgets/{taxonomy_id_lower}/{widget_id}.widget.json`

## Input
1. **product명**: `output/{product}-detail.html` 특정용
2. **섹션 ID**: 패치할 섹션의 taxonomy_id (예: `"Hook"`, `"FeatureDetail"`)
3. **위젯 ID**: 패치 대상 위젯 (예: `"hook--ref-reference3"`)
4. **패치 객체**: 수정할 필드와 신규 값 (아래 패치 타입 참조)

## 패치 타입

### 텍스트 수정
```json
{ "target": "text_0", "field": "content", "value": "새로운 텍스트" }
```

### 스타일 수정
```json
{ "target": "text_1", "field": "style.color", "value": "#FF0000" }
```
중첩 필드는 `.` 구분자로 경로 지정 (`style.fontSize`, `style.fontWeight` 등).

### 이미지 교체
```json
{ "target": "img_0", "field": "placeholder.ai_prompt", "value": "새로운 프롬프트 설명" }
```

### 좌표 조정
```json
{ "target": "img_0", "field": "y", "value": 35 }
```
`x`, `y`, `width`, `height` 모두 지원.

### 배치 패치 (여러 필드 동시 수정)
```json
[
  { "target": "text_0", "field": "content", "value": "제목 수정" },
  { "target": "text_1", "field": "style.fontSize", "value": 18 },
  { "target": "img_0", "field": "y", "value": 40 }
]
```

## Processing

### 1단계: 위젯 JSON 로딩
대상 `.widget.json` 파일을 로드하여 `elements` 배열 확인.

### 2단계: 패치 적용
`target` 필드로 `elements` 배열에서 `label`이 일치하는 element를 찾은 후,
`field` 경로에 `value`를 적용.

- 중첩 필드(`style.color` 등)는 점 표기법으로 파싱하여 단계적으로 접근
- `target`이 일치하는 element가 없으면 오류 출력 후 중단

### 3단계: 섹션 재렌더링
패치된 `.widget.json`을 `lib/widget-renderer/renderer.ts`로 렌더링하여
`<section>` HTML 조각 생성.

### 4단계: 전체 페이지에 섹션 교체
`output/{product}-detail.html`에서 해당 섹션을 찾아 교체:
- 섹션 식별: `<section id="{taxonomy_id_lower}"` 또는 `data-widget-id="{widget_id}"` 속성
- 기존 `<section>...</section>` 블록 전체를 새 렌더링 결과로 대체

### 5단계: 변경 로그 기록
`output/{product}-patch-log.json`에 패치 이력 추가:

```json
{
  "patches": [
    {
      "timestamp": "ISO 8601",
      "section_id": "Hook",
      "widget_id": "hook--ref-reference3",
      "changes": [
        { "target": "text_0", "field": "content", "before": "기존 텍스트", "after": "새로운 텍스트" }
      ]
    }
  ]
}
```

## Output
- 업데이트된 `output/{product}-detail.html` (패치된 섹션 반영)
- 업데이트된 `output/{product}-patch-log.json` (변경 이력)
- 유저에게 패치 요약 표시:
  - 수정된 섹션 ID
  - 적용된 패치 수
  - before/after 주요 변경 내용

## Validation
- [ ] `target`이 위젯 JSON의 실제 element `label`과 일치하는가?
- [ ] 중첩 필드 경로가 실제 JSON 구조와 일치하는가?
- [ ] 패치 후 HTML이 유효한 `<section>` 구조를 유지하는가?
- [ ] 전체 페이지 HTML에서 해당 섹션이 정확히 교체되었는가?
- [ ] 패치 로그에 before/after 값이 모두 기록되었는가?

## 주의사항
- `.widget.json` 원본 파일은 **수정하지 않음** — 패치는 메모리 상에서만 적용 후 HTML 재렌더링
- 동일 섹션이 여러 번 등장하는 경우(FeatureDetail 반복), `widget_id`로 구분하여 정확한 대상 교체
- 패치 후 인접 섹션과의 theme/스타일 연속성은 검증하지 않음 (validate-output 역할)
