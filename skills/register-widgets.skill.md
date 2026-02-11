# /register-widgets — 위젯 레지스트리 등록

## Purpose
`/extract-widgets` 결과물(HTML 위젯 파일 + 프리셋)을 `widgets/_registry.json`에 등록합니다.

## Context
- 위젯 파일: `widgets/{taxonomy_id_lower}/{widget_id}.widget.html`
- 프리셋 파일: `widgets/_presets/preset--ref-{name}.json`
- 레지스트리: `widgets/_registry.json`

## Input
- 등록할 위젯 파일 경로 목록 (보통 `/extract-widgets` 직후 실행)
- 또는 소스 레퍼런스명 (`ref-{name}`) — 해당 소스의 모든 위젯을 자동 탐색

## Processing

### 1. 위젯 메타데이터 수집

각 `.widget.html` 파일에서 `<!--WIDGET_META ... -->` 주석을 파싱하여 레지스트리 엔트리에 필요한 필드를 추출합니다.

#### 파싱 방법
1. 파일 시작의 `<!--WIDGET_META` 와 `-->` 사이의 JSON 추출
2. JSON 파싱하여 아래 필드 수집:

```json
{
  "widget_id": "WIDGET_META의 widget_id",
  "file": "상대 경로 (widgets/ 기준, .widget.html)",
  "source_ref": "WIDGET_META의 provenance.source_ref",
  "style_tags": "WIDGET_META의 style_tags",
  "composition": "WIDGET_META의 composition",
  "theme": "WIDGET_META의 theme"
}
```

FeatureDetail 위젯 추가 필드:
- `variant`: `"image-left"` | `"image-right"` (split의 이미지 위치, widget_id suffix로 판별)

### 2. 레지스트리 업데이트

`widgets/_registry.json`의 구조:

```json
{
  "type": "WIDGET_REGISTRY",
  "version": "2.0",
  "total_widgets": 0,
  "presets": ["preset--ref-reference3", "preset--ref-maru"],
  "widgets": {
    "Hook": [
      { "widget_id": "hook--ref-reference3", "file": "hook/hook--ref-reference3.widget.html", ... }
    ],
    "FeatureDetail": [...]
  }
}
```

- `widgets` 객체: taxonomy_id를 키로 위젯 배열 관리
- 커스텀 섹션: `"_custom"` 키 아래 배열
- `presets` 배열: 프리셋 ID 목록
- `total_widgets`: 전체 위젯 수 갱신

### 3. 중복 처리

- 동일 `widget_id`가 이미 존재하면 **덮어쓰기** (최신 분석 결과 우선)
- 덮어쓸 때 유저에게 알림

### 4. 프리셋 등록

- `presets` 배열에 프리셋 ID 추가 (중복 시 무시)

## Output
- 업데이트된 `widgets/_registry.json`
- 유저에게 등록 요약 표시:
  - 신규 위젯 수
  - 덮어쓴 위젯 수
  - taxonomy_id별 현재 위젯 수
  - 총 위젯 수

## Validation
- [ ] `_registry.json`이 유효한 JSON인가?
- [ ] `total_widgets`가 실제 위젯 배열의 총합과 일치하는가?
- [ ] 모든 `file` 경로의 파일이 실제 존재하는가?
- [ ] 중복 `widget_id`가 같은 taxonomy_id 그룹 내에 없는가?
- [ ] 각 `file` 경로가 `.widget.html` 확장자인가?
