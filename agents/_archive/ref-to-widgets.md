# /ref-to-widgets — 레퍼런스 → 섹션 위젯 추출 에이전트

## 개요
레퍼런스 이미지를 Gemini Vision 기반 매핑 시스템으로 분석하여, 정확한 좌표 기반 요소 감지 + 인터랙티브 편집을 거쳐 **개별 HTML 섹션 위젯**과 **스타일 프리셋**을 생성하고 레지스트리에 등록합니다.

## 파이프라인

```
레퍼런스 이미지
       ↓
[Step 1] /map-reference (Gemini 매핑 웹앱)
  → http://localhost:3000 에서 인터랙티브 매핑
  → output/mapping-{name}.json  (바운드 데이터)
  → output/mapping-{name}.html  (오버레이 미리보기)
       ↓
[Step 2] 유저 편집/검수
  → 웹앱에서 바운드 이동, 리사이즈, 타입 변경, 라벨 수정
       ↓
[Step 3] /register-widgets
  → widgets/_presets/preset--ref-{name}.json  (프리셋 1개)
  → widgets/{taxonomy_id}/{widget_id}.widget.html  (위젯 N개)
  → widgets/_registry.json 업데이트 (status: "new")
```

> **사후 검수**: 추출 완료 후 갤러리(`http://localhost:3333`)의 "새로 추가" 탭에서 위젯을 검수합니다.

## 실행 조건
- 입력: 레퍼런스 이미지 (1장 이상) + 레퍼런스 이름
- 필요: `mapping/.env.local`에 `GEMINI_API_KEY` 설정
- 필요 파일: `skills/section-taxonomy.json`

## Step 1: /map-reference

**스킬 파일**: `skills/map-reference.skill.md`

Gemini Vision API 기반 매핑 웹앱으로 레퍼런스 이미지의 요소를 자동 감지합니다.

### 매핑 서버 실행

```bash
cd mapping && npm install && npm run dev
# http://localhost:3000
```

### 워크플로우
1. 브라우저에서 `http://localhost:3000` 접속
2. 레퍼런스 이미지 업로드 (드래그앤드롭 또는 파일 선택)
3. Gemini 2.5 Flash가 자동으로 요소 감지 (텍스트, 이미지, 버튼, 아이콘 등)
4. 인터랙티브 편집: 바운드 이동, 리사이즈, 타입 변경, 라벨 수정, 추가/삭제
5. Export → bounds JSON + overlay HTML 저장

### Output
- `output/mapping-{name}.json` — 바운드 데이터 (좌표 % 단위)
- `output/mapping-{name}.html` — 오버레이 미리보기

### Bound 데이터 포맷
```json
[
  {
    "id": "uuid",
    "type": "text|image|background|button|icon|input|container|other",
    "label": "메인 카피",
    "x": 15.5,    // % (0-100)
    "y": 8.2,     // % (0-100)
    "w": 69.0,    // % (0-100)
    "h": 5.3,     // % (0-100)
    "zIndex": 2,
    "content": "감지된 텍스트 내용"
  }
]
```

## Step 2: 유저 편집/검수

유저가 매핑 웹앱에서 직접 바운드를 검수하고 수정합니다:
- 바운드 이동 (드래그)
- 바운드 리사이즈 (핸들 드래그)
- 타입 변경 (text, image, background, button, icon, input, container, other)
- 라벨 수정
- 바운드 추가/삭제

## Step 3: /register-widgets

**스킬 파일**: `skills/register-widgets.skill.md`

매핑 데이터를 기반으로 HTML 위젯을 생성하고, 개별 파일로 저장한 뒤 레지스트리에 등록합니다.

### Output
1. **스타일 프리셋**: `widgets/_presets/preset--ref-{name}.json`
2. **개별 위젯 파일**: `widgets/{taxonomy_id_lower}/{widget_id}.widget.html` × N개
3. **레지스트리 업데이트**: `widgets/_registry.json` — 각 위젯이 `status: "new"`로 등록

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
