# /build-widgets — JSON 위젯 생성 + 레지스트리 등록

## Purpose
매핑 데이터(Bound 배열)에서 `.widget.json` 위젯 파일을 생성하고 `widgets/_registry.json`에 등록합니다.

## Context
- 매핑 결과: `output/mapping-{name}.json` (Gemini Vision 매핑 웹앱 출력 Bound 배열)
- 섹션 분류 체계: `skills/section-taxonomy.json`
- 기존 프리셋 참조: `widgets/_presets/`
- 위젯 타입: `lib/widget-renderer/types.ts` (`WidgetJSON`)
- 위젯 스키마: `lib/widget-renderer/widget-schema.json`
- 위젯 출력 경로: `widgets/{taxonomy_id_lower}/{widget_id}.widget.json`
- 프리셋 출력 경로: `widgets/_presets/preset--ref-{name}.json`
- 레지스트리: `widgets/_registry.json`

## Input
- `output/mapping-{name}.json` — 매핑 웹앱에서 생성된 Bound 배열 (유저가 편집/검수 완료한 상태)
- `{name}` — 레퍼런스명 (예: `ref-terive` → name은 `terive`)

## Processing

### 1. 매핑 데이터 로드 및 섹션 그룹화

`output/mapping-{name}.json`을 읽어 Bound 배열을 taxonomy_id 기준으로 그룹화합니다.

1. `skills/section-taxonomy.json`을 로드하여 유효한 taxonomy_id 목록 확보
2. 각 Bound의 label/taxonomy 필드를 taxonomy 목록과 매칭
3. 같은 taxonomy_id를 가진 Bound끼리 섹션 그룹으로 묶기
4. 매핑되지 않은 Bound는 `_custom` 그룹으로 분류

### 2. 위젯 JSON 생성

각 섹션 그룹에 대해 `.widget.json` 파일을 생성합니다.

#### 2-1. widget_id 결정

```
{taxonomy_id_lower}--ref-{name}
```

같은 taxonomy_id의 위젯이 이미 존재하면 variant suffix를 추가:
```
{taxonomy_id_lower}--ref-{name}--v2
```

FeatureDetail처럼 이미지 위치가 명확한 경우:
```
featuredetail--ref-{name}--image-left
featuredetail--ref-{name}--image-right
```

#### 2-2. canvas 높이 추정

섹션 그룹 내 모든 Bound의 y + height 최대값을 기준으로 추정합니다:

```
estimated_height = max(bound.y + bound.height) / 100 × 1200
```

canvas 기본값: `{ width: 860, height: estimated_height }`

#### 2-3. elements 배열 구성

**중요: 원본 매핑 Bound의 좌표를 그대로 사용합니다. 좌표 수정, 패딩 추가, 갭 삽입 금지.**

각 Bound를 element로 변환:

```json
{
  "id": "el_{index}",
  "type": "bound의 elementType (text | image | container | icon)",
  "label": "bound의 label",
  "x": "bound.x (0-100% 그대로)",
  "y": "bound.y (0-100% 그대로)",
  "width": "bound.width (0-100% 그대로)",
  "height": "bound.height (0-100% 그대로)",
  "style": "bound에서 추출된 스타일 힌트 (fontSize, fontWeight, color 등)"
}
```

#### 2-4. figma_hints 자동 생성

elements 구성과 섹션 taxonomy를 바탕으로 Figma Make 작업 힌트를 자동 생성합니다:

```json
{
  "layout": "섹션의 전반적 레이아웃 패턴 (예: 'vertical-stack', 'grid-2col', 'hero-split')",
  "composition": "elements 배치 패턴 요약 (예: 'image-top text-bottom', 'icon-grid')",
  "dominant_elements": ["가장 큰 면적의 element type 목록"],
  "style_notes": "섹션 특성 기반 디자인 힌트"
}
```

#### 2-5. sample_data 자동 생성

element label과 taxonomy의 `copywriting_guide`를 참고하여 샘플 콘텐츠를 생성합니다:

```json
{
  "el_0": "element label에 맞는 샘플 텍스트 또는 이미지 설명",
  "el_1": "..."
}
```

#### 2-6. 최종 `.widget.json` 구조

`lib/widget-renderer/types.ts`의 `WidgetJSON` 타입과 `lib/widget-renderer/widget-schema.json` 스키마를 준수합니다:

```json
{
  "widget_id": "hook--ref-terive",
  "taxonomy_id": "Hook",
  "category": "intro",
  "style_tags": ["모던", "미니멀"],
  "theme": "light",
  "composition": "image-top text-bottom",
  "provenance": {
    "source_ref": "ref-terive",
    "extracted_date": "2026-02-20"
  },
  "copywriting_guide": "taxonomy의 copywriting_guide 내용",
  "canvas": { "width": 860, "height": 700 },
  "elements": [
    {
      "id": "el_0",
      "type": "image",
      "label": "메인 이미지",
      "x": 0, "y": 0, "width": 100, "height": 55,
      "style": {}
    },
    {
      "id": "el_1",
      "type": "text",
      "label": "메인 카피",
      "x": 10, "y": 60, "width": 80, "height": 10,
      "style": { "fontSize": 36, "fontWeight": 700 }
    }
  ],
  "figma_hints": {
    "layout": "hero-split",
    "composition": "image-top text-bottom",
    "dominant_elements": ["image"],
    "style_notes": "강렬한 첫인상을 위한 풀블리드 이미지 + 오버레이 텍스트"
  },
  "sample_data": {
    "el_0": "제품 대표 이미지 (배경 포함)",
    "el_1": "지금까지 없던 새로운 경험"
  }
}
```

#### 2-7. 파일 저장

```
widgets/{taxonomy_id_lower}/{widget_id}.widget.json
```

`_custom` 그룹:
```
widgets/_custom/{widget_id}.widget.json
```

### 3. 스타일 프리셋 생성

레퍼런스 전체 이미지의 색상/타이포 분석 결과로 `widgets/_presets/preset--ref-{name}.json`을 생성합니다.

기존 프리셋이 있으면 덮어쓰고 유저에게 알림.

```json
{
  "type": "STYLE_PRESET",
  "id": "preset--ref-{name}",
  "name": "레퍼런스 스타일명 (분위기 기반 명명)",
  "style_tags": ["모던", "미니멀"],
  "color_system": {
    "brand_main": "#HEX",
    "accent": "#HEX",
    "dark_1": "#HEX",
    "dark_2": "#HEX",
    "light_1": "#HEX",
    "light_2": "#HEX"
  },
  "typography": {
    "main_copy": { "fontSize": 36, "fontWeight": 700 },
    "sub_copy": { "fontSize": 18, "fontWeight": 400 },
    "body": { "fontSize": 14, "fontWeight": 400 }
  }
}
```

### 4. 레지스트리 업데이트

`widgets/_registry.json` 구조 (version `"3.0"`):

```json
{
  "type": "WIDGET_REGISTRY",
  "version": "3.0",
  "total_widgets": 0,
  "presets": ["preset--ref-terive"],
  "widgets": {
    "Hook": [
      {
        "widget_id": "hook--ref-terive",
        "file": "hook/hook--ref-terive.widget.json",
        "source_ref": "ref-terive",
        "style_tags": ["모던", "미니멀"],
        "composition": "image-top text-bottom",
        "theme": "light",
        "status": "new",
        "added_date": "2026-02-20T00:00:00.000Z"
      }
    ]
  }
}
```

- `widgets` 객체: taxonomy_id를 키로 위젯 배열 관리
- 커스텀 섹션: `"_custom"` 키 아래 배열
- `presets` 배열: 프리셋 ID 목록
- `total_widgets`: 전체 위젯 수 갱신
- `file` 경로: `.widget.json` 확장자 사용

### 5. 중복 처리

#### 5-1. 동일 ID 중복
- 동일 `widget_id`가 이미 존재하면 **덮어쓰기** (최신 분석 결과 우선)
- 덮어쓸 때 유저에게 알림

#### 5-2. 유사도 기반 중복 감지

같은 `taxonomy_id` 그룹 내 기존 위젯(status가 없거나 "reviewed"인 위젯)과 비교하여 중복 후보를 표시합니다.

**유사도 공식:**
```
유사도 = (style_tags Jaccard × 0.5) + (composition 일치 × 0.3) + (theme 일치 × 0.2)
```

- **Jaccard** = 교집합 / 합집합 (style_tags 기준) — 가중치 0.5
- **composition 일치** = 같으면 1.0, 다르면 0.0 — 가중치 0.3
- **theme 일치** = 같으면 1.0, 다르면 0.0 — 가중치 0.2
- **임계값**: 0.7 이상이면 중복 후보로 표시

여러 기존 위젯이 임계값을 초과하면 **최고 점수** 위젯을 `duplicate_of`에 기록합니다.

**중복 후보 표시 필드:**
```json
{
  "widget_id": "hook--ref-newref",
  "status": "new",
  "added_date": "2026-02-20T14:30:00.000Z",
  "duplicate_of": "hook--ref-reference4",
  "similarity_score": 0.85
}
```

- `duplicate_of`: 유사한 기존 위젯의 widget_id
- `similarity_score`: 0.0~1.0 (임계값 0.7 이상일 때만 기록)

### 6. 프리셋 등록

- `presets` 배열에 프리셋 ID 추가 (중복 시 무시)

## Output
- `widgets/{taxonomy_id_lower}/{widget_id}.widget.json` — 생성된 위젯 JSON 파일들
- `widgets/_presets/preset--ref-{name}.json` — 스타일 프리셋
- 업데이트된 `widgets/_registry.json`
- 유저에게 등록 요약 표시:
  - 신규 위젯 수
  - 덮어쓴 위젯 수
  - 중복 후보 수
  - taxonomy_id별 현재 위젯 수
  - 총 위젯 수

## Validation
- [ ] 생성된 각 `.widget.json`이 `lib/widget-renderer/widget-schema.json` 스키마를 통과하는가?
- [ ] 모든 element 좌표(x, y, width, height)가 0~100 범위인가?
- [ ] 원본 매핑 Bound 좌표가 수정 없이 그대로 사용되었는가?
- [ ] `elements` 배열이 비어 있지 않은가?
- [ ] `figma_hints`와 `sample_data`가 채워져 있는가?
- [ ] `_registry.json`이 유효한 JSON인가?
- [ ] `total_widgets`가 실제 위젯 배열의 총합과 일치하는가?
- [ ] 모든 `file` 경로의 파일이 실제 존재하는가?
- [ ] 중복 `widget_id`가 같은 taxonomy_id 그룹 내에 없는가?
- [ ] 각 `file` 경로가 `.widget.json` 확장자인가?
- [ ] 새 위젯에 `status: "new"` 필드가 있는가?
- [ ] 새 위젯에 `added_date` (ISO 8601) 필드가 있는가?
- [ ] 유사도 0.7 이상인 위젯에 `duplicate_of`, `similarity_score` 필드가 있는가?
